"""Write this app's own ``mcp.json`` so aw-mcp-gateway's app-scan
(``scan_app_mcp_servers()``, reading ``<installed-app-dir>/mcp.json``)
discovers the ``/mcp`` endpoint (``http_handler.py``) without any manual
wiring — mirrors ``aw-app-whiteboard``'s ``whiteboard_app/mcp/self_register.py``
(itself mirroring ``aw-app-kb``'s ``kb_app/self_register.py``, adapted for a
Tier-1 (in-process) app instead of kb's Tier-2 (container) one).

Tier-1 vs Tier-2 difference: a Tier-2 app is its OWN container, so it needs
``AW_APP_SELF_HOST`` (injected by ``ContainerSupervisor.start()``) to tell
sibling containers its own network alias. A Tier-1 app IS the aw-workspace
process — ``socket.gethostname()`` from inside it returns the exact same
value ``ContainerSupervisor`` injects into sibling containers as
``AW_WORKSPACE_HOST``, so no extra env var is needed here, and no secret
ever needs to leave this process: ``AW_WORKSPACE_API_KEY`` is already in
this process's own ``os.environ`` (the server mints it there at boot).

This is the sustainable replacement for the earlier stdio approach
(``mcps/presentation_server.py``, removed 2026-08-08), which needed those
same two values *inside a different container* (aw-mcp-gateway) that has
no path to them short of manually editing the installed (never
git-committed) copy after every deploy — see http_handler.py's docstring
for the full story.
"""

from __future__ import annotations

import json
import logging
import os
import socket

log = logging.getLogger("aw-app-presentations")

MCP_SERVER_NAME = "aw-presentation"


def _mcp_json_path(package_dir: str) -> str:
    return os.path.join(package_dir, "mcp.json")


def register_self(package_dir: str, port: int) -> None:
    """Best-effort; a bare dev run with no package_dir on a scanned root
    simply no-ops (nothing to write into, nothing breaks)."""
    if not os.path.isdir(package_dir):
        return

    host = socket.gethostname()
    api_key = os.environ.get("AW_WORKSPACE_API_KEY")
    entry: dict = {
        "type": "http",
        "url": f"http://{host}:{port}/api/apps/presentations/mcp",
        "enabled": True,
    }
    if api_key:
        entry["headers"] = {"X-Api-Key": api_key}

    path = _mcp_json_path(package_dir)
    data: dict = {"mcpServers": {}}
    try:
        with open(path) as f:
            existing = json.load(f)
        if isinstance(existing, dict) and isinstance(existing.get("mcpServers"), dict):
            data = existing
    except (FileNotFoundError, json.JSONDecodeError):
        pass

    if data["mcpServers"].get(MCP_SERVER_NAME) == entry:
        return
    data["mcpServers"][MCP_SERVER_NAME] = entry
    try:
        tmp = f"{path}.tmp"
        with open(tmp, "w") as f:
            json.dump(data, f, indent=2)
        os.replace(tmp, path)
        log.info("registered self as %r in %s (%s)", MCP_SERVER_NAME, path, entry["url"])
    except OSError as e:
        log.warning("could not write %s: %s", path, e)
