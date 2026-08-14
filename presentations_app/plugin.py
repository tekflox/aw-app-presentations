"""Entrypoint referenced by aw-app.json's runtime.entrypoint
("presentations_app.plugin:PresentationsAppPlugin").

Ports the monolith's ``/ws/presentations`` + ``/api/presentations/*``
(``src/api/routes/presentation.py``, 232 lines) onto the F4 ``ctx`` facades:

* ``ctx.routes`` (``routes:register``) — HTTP + WebSocket sub-app mounted at
  ``/api/apps/presentations`` by the runtime.
* ``ctx.db`` (``db:own-tables``) — presentation records + share tokens live
  in this app's own Postgres tables (``app__presentations__*``) instead of
  the monolith's SQLModel session.

Also self-registers an in-process MCP-over-HTTP endpoint (``mcp/`` —
``http_handler.py`` + ``self_register.py``) with aw-mcp-gateway, replacing
an earlier stdio port that needed credentials a sibling container had no
sustainable way to hold. See ``mcp/http_handler.py``'s docstring.

The SPA plugin-host wiring (2026-08-05) now has a real ``ui/src/plugin.jsx``
consuming this app's ``core.nav`` + ``core.window.body:presentations.viewer``
contributions — the "inert until aw-frontend wires it" note that used to be
here is stale; see aw-workspace-ui's App.jsx/BasicWindow.jsx.
"""

from __future__ import annotations

import asyncio
import logging
import os

from . import routes as routes_mod
from .mcp import self_register as mcp_self_register
from .storage import PresentationStore

log = logging.getLogger("aw_apps.presentations")


class PresentationsAppPlugin:
    async def activate(self, ctx) -> None:
        self.ctx = ctx
        self.store = PresentationStore(ctx)
        # F1 hot-loads this app's sub-app via a Mount() into the ALREADY
        # running process — Starlette's own @api.on_event("startup") (which
        # storage.py's set_loop() used to rely on being called from) only
        # fires during the OUTER app's own startup sequence, which already
        # completed long before this app gets hot-loaded. That handler never
        # ran, so `store._loop` stayed None forever and every create/update/
        # delete's _broadcast() silently no-op'd (the `if not self._loop:
        # return` guard) — real-time WS pushes to already-connected clients
        # never fired, even though the WS itself connected fine and got its
        # one-shot presentation_init. activate() runs inside the running
        # event loop, so grab it directly here instead.
        self.store.set_loop(asyncio.get_running_loop())

        app_dir = os.path.join(
            os.path.dirname(__file__), "..", ".data", "presentation-exports"
        )
        os.makedirs(app_dir, exist_ok=True)
        self._export_dir = app_dir

        subapp = routes_mod.build_app(self.store, self._export_dir)
        ctx.routes.register(subapp)
        ctx.on_deactivate(self._close_all_sockets)

        # Discoverable by aw-mcp-gateway's app-scan — see mcp/self_register.py.
        port = int(os.environ.get("AW_PORT", "9030"))
        mcp_self_register.register_self(ctx.package_dir, port)

        log.info("aw-app-presentations activated")

    async def deactivate(self) -> None:
        log.info("aw-app-presentations deactivated")

    async def _close_all_sockets(self) -> None:
        # WS unload contract (F6 Capability 1): the runtime drains the Mount
        # itself; this just clears our own listener bookkeeping so a stale
        # broadcast after unload is a no-op rather than an error.
        for ws in list(self.store._listeners):
            self.store.remove_listener(ws)
