"""Entrypoint referenced by aw-app.json's runtime.entrypoint
("presentations_app.plugin:PresentationsAppPlugin").

Ports the monolith's ``/ws/presentations`` + ``/api/presentations/*``
(``src/api/routes/presentation.py``, 232 lines) onto the F4 ``ctx`` facades:

* ``ctx.routes`` (``routes:register``) — HTTP + WebSocket sub-app mounted at
  ``/api/apps/presentations`` by the runtime.
* ``ctx.db`` (``db:own-tables``) — presentation records + share tokens live
  in this app's own Postgres tables (``app__presentations__*``) instead of
  the monolith's SQLModel session.

Known gap (see repo README + Kanban card comment): the manifest also
declares ``ui:code`` / ``ui:slots:core.nav`` / ``contributes.frontend`` for
the top-bar "Presentation" nav + gallery window, matching where the F6 ADR
(``design:migrate-repos-github-into-aw-app-git``, still *Proposed*) says
this capability is headed — but the SPA plugin-host wiring
(``installPluginHost``/``fetchContributions``/``<AppSlot>``) is NOT yet
called anywhere in ``aw-frontend/src/App.jsx``, so these manifest entries
are inert until that framework piece ships. Do not remove the monolith's
static ``PresentationNav.jsx`` until it lands — there is no working
replacement yet.
"""

from __future__ import annotations

import logging
import os

from . import routes as routes_mod
from .storage import PresentationStore

log = logging.getLogger("aw_apps.presentations")


class PresentationsAppPlugin:
    async def activate(self, ctx) -> None:
        self.ctx = ctx
        self.store = PresentationStore(ctx)

        app_dir = os.path.join(
            os.path.dirname(__file__), "..", ".data", "presentation-exports"
        )
        os.makedirs(app_dir, exist_ok=True)
        self._export_dir = app_dir

        subapp = routes_mod.build_app(self.store, self._export_dir)
        ctx.routes.register(subapp)
        ctx.on_deactivate(self._close_all_sockets)
        log.info("aw-app-presentations activated")

    async def deactivate(self) -> None:
        log.info("aw-app-presentations deactivated")

    async def _close_all_sockets(self) -> None:
        # WS unload contract (F6 Capability 1): the runtime drains the Mount
        # itself; this just clears our own listener bookkeeping so a stale
        # broadcast after unload is a no-op rather than an error.
        for ws in list(self.store._listeners):
            self.store.remove_listener(ws)
