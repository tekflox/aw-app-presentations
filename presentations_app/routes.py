"""Presentation REST + WebSocket sub-app, ported from the monolith's
``src/api/routes/presentation.py`` onto a plain FastAPI sub-app registered
via ``ctx.routes.register`` (mounted by the runtime at
``/api/apps/presentations``).

Differences from the monolith route set:
  * Auth is NOT re-implemented here — the F6 ADR's ``IdentityGuard`` gap
    (mounted app sub-apps have no auth yet) applies to this app exactly like
    it applies to aw-app-git today; every route below is reachable
    unauthenticated on the current framework. Tracked as the same framework
    gap, not re-solved per-app.
  * Share-token html serving keeps the ``?token=`` bypass (no JWT needed);
    JWT-cookie auth for the plain (non-token) path is the framework's job
    once IdentityGuard ships, same as everywhere else in this app.
  * ``export_presentation`` keeps playwright as a soft/optional import
    exactly like the monolith did — only that one endpoint needs the
    browser binaries.
"""

from __future__ import annotations

import base64
import json
import logging
import os
import time

from fastapi import Body, FastAPI, HTTPException, Query, Request, WebSocket, WebSocketDisconnect
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import HTMLResponse

from .storage import PresentationStore

_log = logging.getLogger("presentations_app.routes")


def build_app(store: PresentationStore, export_dir: str,
              cdp_endpoint: str | None = None) -> FastAPI:
    api = FastAPI()

    @api.on_event("startup")
    async def _bind_loop():
        import asyncio
        store.set_loop(asyncio.get_event_loop())

    @api.get("/presentations")
    async def list_presentations(tag: list[str] | None = Query(default=None)):
        return store.list_presentations(tags_filter=tag)

    @api.post("/presentations")
    async def create_presentation(data: dict = Body(...)):
        title = data.get("title", "Untitled")
        html = data.get("html", "")
        presentation_id = data.get("id")
        visible = data.get("visible", True)
        session_id = data.get("session_id")
        tags = data.get("tags")
        silent = bool(data.get("silent", False))
        p = store.create(title, html, presentation_id=presentation_id, visible=visible,
                          session_id=session_id, tags=tags, silent=silent)
        return {"id": p.id, "title": p.title, "visible": p.visible,
                "tags": list(p.tags), "silent": silent, "success": True}

    @api.get("/presentations/{presentation_id}")
    async def get_presentation(presentation_id: str):
        p = store.get(presentation_id)
        if not p:
            return {"error": "Presentation not found", "success": False}
        return p.to_dict()

    @api.put("/presentations/{presentation_id}")
    async def update_presentation(presentation_id: str, data: dict = Body(...)):
        silent = bool(data.get("silent", False))
        p = store.update(presentation_id, title=data.get("title"), html=data.get("html"),
                          tags=data.get("tags"), silent=silent)
        if not p:
            return {"error": "Presentation not found", "success": False}
        return {"id": p.id, "title": p.title, "tags": list(p.tags), "silent": silent, "success": True}

    @api.delete("/presentations/{presentation_id}")
    async def delete_presentation(presentation_id: str):
        store.delete(presentation_id)
        return {"success": True}

    @api.post("/presentations/{presentation_id}/export")
    async def export_presentation(presentation_id: str, data: dict = Body(default={})):
        p = store.get(presentation_id)
        if not p:
            raise HTTPException(status_code=404, detail="presentation not found")

        os.makedirs(export_dir, exist_ok=True)
        output_path = (data or {}).get("output_path") or os.path.join(
            export_dir, f"{presentation_id}-{int(time.time())}.png"
        )
        width = int((data or {}).get("width") or 1280)
        height = int((data or {}).get("height") or 800)
        scale = float((data or {}).get("scale") or 2.0)

        try:
            await run_in_threadpool(_render_html_to_png, p.html, output_path,
                                    width, height, scale, cdp_endpoint)
        except Exception as exc:
            unavailable = _playwright_unavailable_reason(exc)
            if unavailable:
                # The one dependency this endpoint needs beyond the rest of
                # the app (see module docstring) isn't installed/usable on
                # this server — a clearer 501 beats a raw 500 stack trace
                # for the UI's export button to surface.
                _log.warning("presentation export unavailable for %s: %s", presentation_id, exc)
                raise HTTPException(status_code=501, detail=unavailable) from exc
            _log.exception("presentation export failed for %s", presentation_id)
            raise HTTPException(status_code=500, detail=f"render failed: {exc}") from exc

        with open(output_path, "rb") as f:
            image_bytes = f.read()
        return {
            "success": True, "presentation_id": presentation_id, "path": output_path,
            "title": p.title, "size_bytes": len(image_bytes),
            # Lets the UI trigger a browser download in one round-trip
            # instead of a second GET against a server-local path it has
            # no route to fetch.
            "data_url": f"data:image/png;base64,{base64.b64encode(image_bytes).decode()}",
        }

    @api.get("/presentations/{presentation_id}/html")
    async def get_presentation_html(presentation_id: str, request: Request,
                                     token: str | None = Query(default=None)):
        if token is not None:
            pid_from_token = store.validate_share_token(token)
            if pid_from_token is None:
                raise HTTPException(status_code=403, detail="Invalid or expired share token")
            if pid_from_token != presentation_id:
                raise HTTPException(status_code=403, detail="Token does not match presentation")

        p = store.get(presentation_id)
        if p is None:
            raise HTTPException(status_code=404, detail="Presentation not found")
        return HTMLResponse(content=p.html)

    @api.post("/presentations/{presentation_id}/share")
    async def create_share(presentation_id: str, data: dict = Body(default={})):
        if not store.get(presentation_id):
            raise HTTPException(status_code=404, detail="Presentation not found")
        expires_in = data.get("expires_in")
        if expires_in is not None:
            expires_in = float(expires_in)
        share = store.create_share_token(presentation_id, expires_in)
        return {"success": True, **share}

    @api.get("/presentations/{presentation_id}/share")
    async def list_shares(presentation_id: str):
        if not store.get(presentation_id):
            raise HTTPException(status_code=404, detail="Presentation not found")
        return store.list_share_tokens(presentation_id)

    @api.delete("/presentations/{presentation_id}/share/{token}")
    async def revoke_share(presentation_id: str, token: str):
        ok = store.revoke_share_token(token)
        if not ok:
            raise HTTPException(status_code=404, detail="Token not found")
        return {"success": True, "token": token}

    @api.websocket("/ws")
    async def presentation_stream(websocket: WebSocket):
        """Stream presentation create/update/delete events.

        Mounted (via ctx.routes.register) at /api/apps/presentations/ws —
        replaces the monolith's /ws/presentations. Protocol unchanged:
        {"type": "presentation_init", ...} on connect, then
        {"type": "presentation_update", "action": ...} per change.
        """
        await websocket.accept()
        await websocket.send_text(json.dumps({
            "type": "presentation_init",
            "presentations": store.list_presentations(),
        }))
        store.add_listener(websocket)
        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            pass
        finally:
            store.remove_listener(websocket)

    # ------------------------------------------------------------------
    # MCP — Streamable HTTP, auto-discovered by aw-mcp-gateway's app-scan
    # (see mcp/self_register.py + mcp/http_handler.py).
    # ------------------------------------------------------------------

    @api.post("/mcp")
    async def mcp_post(data: dict | list = Body(...)):
        from fastapi.responses import JSONResponse, Response

        from .mcp.http_handler import handle_request as mcp_handle_request

        messages = data if isinstance(data, list) else [data]
        responses = []
        for m in messages:
            r = await mcp_handle_request(m, store=store, export_dir=export_dir)
            if r is not None:
                responses.append(r)
        if not responses:
            return Response(status_code=202)
        return JSONResponse(responses if isinstance(data, list) else responses[0])

    @api.get("/mcp")
    async def mcp_get():
        from fastapi.responses import Response
        return Response(status_code=405)

    return api


# The workspace already runs a Chromium: aw-app-browser exposes one over CDP,
# and the playwright MCP server drives it that way (--cdp-endpoint). Reusing it
# is why this app needs only the `playwright` pip package and not its ~150 MB of
# browser binaries — `playwright install chromium` is a second install step that
# nothing in the app lifecycle runs, so a fresh workspace had the package (once
# runtime.pip_requires started being honoured) and still no browser.
#
# Override with the `cdp_endpoint` config key; set it empty to force a local
# launch (useful if aw-app-browser isn't installed and the binaries are).
_DEFAULT_CDP = "http://aw-app-browser:9223"


def _render_html_to_png(html: str, output_path: str, width: int, height: int, scale: float,
                        cdp_endpoint: str | None = None) -> None:
    """Render HTML to PNG, preferring the shared browser over a local one.

    Ported from the monolith, which only knew how to launch its own. playwright
    stays a soft import — nothing else in this app needs it.
    """
    from playwright.sync_api import sync_playwright

    endpoint = _DEFAULT_CDP if cdp_endpoint is None else cdp_endpoint

    with sync_playwright() as p:
        browser = None
        connected = False
        if endpoint:
            try:
                browser = p.chromium.connect_over_cdp(endpoint)
                connected = True
            except Exception as exc:  # noqa: BLE001 — fall back to a local launch
                _log.info("presentations: CDP %s unavailable (%s); launching locally",
                          endpoint, exc)
        if browser is None:
            browser = p.chromium.launch(args=["--no-sandbox"])
        try:
            context = browser.new_context(viewport={"width": width, "height": height},
                                          device_scale_factor=scale)
            page = context.new_page()
            page.set_content(html, wait_until="load")
            page.screenshot(path=output_path, full_page=True)
            context.close()
        finally:
            # Only close a browser we launched. A CDP-attached one is another
            # container's process — closing it would take the shared browser
            # down for every other caller (the playwright MCP included).
            if not connected:
                browser.close()


def _playwright_unavailable_reason(exc: Exception) -> str | None:
    """None for an unrelated failure; else a plain-language reason to hand
    back as a 501 instead of a raw stack trace. Covers the two shapes this
    actually fails in: the package missing entirely (ModuleNotFoundError)
    vs. installed but `playwright install chromium` never ran (its own
    error names the missing executable path)."""
    if isinstance(exc, ModuleNotFoundError) and "playwright" in str(exc):
        return "PNG export needs the 'playwright' package, which isn't installed on this server yet."
    if "Executable doesn't exist" in str(exc) and "playwright install" in str(exc):
        return "PNG export needs playwright's browser binaries (`playwright install chromium`), not installed on this server yet."
    return None
