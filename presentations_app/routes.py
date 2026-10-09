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
import fcntl
import json
import logging
import os
import subprocess
import sys
import threading
import time

from fastapi import Body, FastAPI, HTTPException, Query, Request, WebSocket, WebSocketDisconnect
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import HTMLResponse

from .normalize import normalize_presentation_html
from .storage import PresentationStore

_log = logging.getLogger("presentations_app.routes")


def build_app(store: PresentationStore, export_dir: str) -> FastAPI:
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
            # Normalized like the served page, not raw: at the 1280px default
            # the media query cannot fire, so this is a no-op today — but it
            # keeps ONE normalization path instead of two, and an export
            # explicitly asked for at width=390 then renders what a phone
            # would actually get instead of silently diverging from it.
            await run_in_threadpool(_render_html_to_png,
                                    normalize_presentation_html(p.html),
                                    output_path, width, height, scale)
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
        return HTMLResponse(content=normalize_presentation_html(p.html))

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


# PNG export drives its OWN Chromium — a dedicated one, deliberately not the
# shared browser aw-app-browser runs. Attaching to that over CDP was tried on
# 2026-08-14 and reverted the same day: it makes every export contend with
# whatever the playwright MCP is doing in that browser (its own tabs, its own
# navigation), couples this app's availability to another app's, and puts a
# render that must not be interfered with inside a process other callers drive.
#
# The cost of owning it is the browser binaries: `playwright install chromium`
# is a ~150 MB step separate from the pip package, and nothing in the app
# lifecycle ran it — so a fresh workspace had the package (once core started
# honouring runtime.pip_requires) and still no browser, which is exactly how
# this endpoint was found broken. _ensure_chromium below runs that step once,
# lazily, on the first export that needs it: at activate() it would add minutes
# to every workspace boot, including the many that never export anything.

_INSTALL_LOCK = threading.Lock()
_chromium_ready = False


def _chromium_install_lock_path() -> str:
    """A path every one of the 10 ``AW_WORKSPACE_WORKERS`` processes can see
    and flock — same host-mounted tree core itself uses for durable,
    cross-process state (see ``src/apps/paths.py``'s ``workspace_home()``),
    duplicated narrowly here rather than imported so this app doesn't reach
    into core's package for one path string."""
    home = os.environ.get("AW_WORKSPACE_HOME") or os.path.join(
        os.environ.get("AW_WORKSPACE_CONTAINER_DIR", "/opt/aw-workspace"), ".aw-workspace"
    )
    lock_dir = os.path.join(home, "locks")
    os.makedirs(lock_dir, exist_ok=True)
    return os.path.join(lock_dir, "presentations-chromium-install.lock")


def _is_missing_chromium_error(exc: Exception) -> bool:
    """True for playwright's own "the browser binary isn't on disk" error —
    the ONE failure shape `_launch_chromium` should react to by installing.
    Anything else (a real crash, a sandbox issue, missing OS libs) is a
    different problem and must not trigger a wasted install + apt-get."""
    return "Executable doesn't exist" in str(exc) and "playwright install" in str(exc)


def _install_chromium_once() -> None:
    """Actually run `playwright install --with-deps chromium`, serialized
    across all 10 ``AW_WORKSPACE_WORKERS`` PROCESSES via an ``fcntl.flock``
    on a file under ``AW_WORKSPACE_HOME`` (visible to every worker) — not a
    process-local lock — so two workers that both hit a genuine first-install
    near-simultaneously queue for the lock instead of racing `apt-get` and
    colliding on `/var/lib/dpkg/lock-frontend`.

    Two separate installs, and missing either one leaves a browser that cannot
    start:

    * ``playwright install chromium`` fetches the ~150 MB browser build (and,
      by default, the separate "headless shell" build too — see
      ``_launch_chromium``'s docstring for why that second build matters).
    * ``--with-deps`` apt-installs the ~17 shared libraries it links against
      (libnss3, libglib, libatk, the libX* set...). The workspace image does not
      carry a GUI stack, so without this the binary is present and dies on
      launch with "Target page, context or browser has been closed" — an error
      that names nothing useful. Confirmed by ldd: 17 "not found" entries.

    ``--with-deps`` shells out to apt, which needs root; the workspace container
    runs as uid 1001 with NOPASSWD sudo, so it is prefixed when available and
    the plain form is tried otherwise (a container without sudo either already
    has the libraries or cannot get them, and the error below says which).

    The sudo'd form explicitly carries ``HOME`` through to the child process
    (``sudo -n env HOME=<real home> ...``) rather than a bare ``sudo -n``.
    Confirmed live on 2026-10-09: sudo's default Debian/Ubuntu policy
    (``env_reset`` + ``always_set_home``) resets ``$HOME`` to ROOT's home for
    the duration of the sudo'd command, so a bare ``sudo -n`` install writes
    the downloaded browser to ``/root/.cache/ms-playwright`` — the install
    genuinely succeeds (exit 0) — while every later ``chromium.launch()``
    runs as the unprivileged app user and looks in THAT user's
    ``~/.cache/ms-playwright``, which never received anything. Looked
    exactly like "still not installed" after a reportedly successful
    install, which is what made it so easy to miss.
    """
    lock_path = _chromium_install_lock_path()
    lock_fd = os.open(lock_path, os.O_CREAT | os.O_RDWR, 0o600)
    try:
        fcntl.flock(lock_fd, fcntl.LOCK_EX)
        base = [sys.executable, "-m", "playwright", "install", "--with-deps", "chromium"]
        real_home = os.environ.get("HOME", os.path.expanduser("~"))
        cmds = ([["sudo", "-n", "env", f"HOME={real_home}", *base], base]
                if _has_sudo() else [base])
        last = ""
        for cmd in cmds:
            _log.info("presentations: installing chromium for PNG export (first use): %s",
                      " ".join(cmd[:4]))
            try:
                proc = subprocess.run(cmd, capture_output=True, text=True, timeout=1800)
            except Exception as exc:  # noqa: BLE001 — try the next form
                last = str(exc)
                _trace_install_attempt(cmd, returncode=None, detail=last)
                continue
            if proc.returncode == 0:
                _log.info("presentations: chromium install finished")
                _trace_install_attempt(cmd, returncode=0, detail="ok")
                return
            last = (proc.stderr or proc.stdout or "")[-400:]
            _trace_install_attempt(cmd, returncode=proc.returncode, detail=last)
        # Deliberately do NOT latch anything as ready — a transient failure
        # (no network, apt lock held) must be retried by the next export.
        raise RuntimeError("playwright install chromium failed: " + last)
    finally:
        fcntl.flock(lock_fd, fcntl.LOCK_UN)
        os.close(lock_fd)


def _trace_install_attempt(cmd: list[str], returncode: int | None, detail: str) -> None:
    """Append one line to a durable, append-only trace of every real install
    attempt — not just ``_log.info``/``_log.exception``, which land in this
    workspace's SigNoz sink and are unreachable from a plain agent-runner
    container (see CLAUDE.md: "workspace core python logs go to SigNoz, not
    podman logs"). This exact failure class has twice needed a human/agent
    to see what the install subprocess actually did without SigNoz access —
    cheap enough (one short line) to leave in permanently rather than re-add
    as a throwaway diagnostic the next time this is debugged."""
    try:
        home = os.environ.get("AW_WORKSPACE_HOME") or os.path.join(
            os.environ.get("AW_WORKSPACE_CONTAINER_DIR", "/opt/aw-workspace"), ".aw-workspace"
        )
        path = os.path.join(home, "presentations-chromium-install.log")
        line = (f"{time.time():.0f} pid={os.getpid()} cmd={' '.join(cmd)} "
                f"returncode={returncode} detail={detail!r}\n")
        with open(path, "a", encoding="utf-8") as f:
            f.write(line)
    except Exception:  # noqa: BLE001 — tracing must never break the install path
        pass


def _has_sudo() -> bool:
    try:
        return subprocess.run(["sudo", "-n", "true"], capture_output=True,
                              timeout=10).returncode == 0
    except Exception:  # noqa: BLE001
        return False


def _launch_chromium(chromium):
    """Launch this app's own headless Chromium, installing it first if this
    is the first export to need it on this worker.

    Does NOT pre-check a resolved executable path on disk before launching —
    an earlier version of this fix did exactly that (stat
    ``chromium.executable_path``) and still hit a live failure on
    2026-10-09: ``.executable_path`` always reports the REGULAR chrome
    binary (``chromium-<rev>/chrome-linux64/chrome``), but ``launch()`` with
    this app's default ``headless=True`` silently prefers a SEPARATE
    "headless shell" build (``chromium_headless_shell-<rev>/...``) when one
    is installed — confirmed by watching the actual launch command in
    playwright's own browser log. A worker whose ``$HOME/.cache/ms-playwright``
    had the regular build but not the headless-shell one (plausible after a
    playwright version bump started preferring the shell build, with the
    regular build surviving from an older install) would pass a
    `.executable_path` disk check and then still fail to launch — the two
    checks were simply looking at different files.

    So: just attempt the real launch. It fails fast and in the exact same
    way regardless of which binary variant is missing, which sidesteps the
    whole "which path does this playwright version actually use" question
    instead of trying to keep re-guessing it correctly. Only a failure
    matching playwright's own "not installed" message triggers the (cross-
    process-locked) install; anything else propagates immediately.

    ``_chromium_ready`` is a per-PROCESS cache of "a launch has already
    succeeded here" — ``AW_WORKSPACE_WORKERS=10`` runs this app across 10
    separate worker processes (docker-compose.yml), so this flag being unset
    on one worker says nothing about whether the browser is actually on
    disk; the launch attempt itself is what answers that, every time this
    flag is still false.
    """
    global _chromium_ready
    if _chromium_ready:
        return chromium.launch(args=["--no-sandbox"])

    with _INSTALL_LOCK:
        if _chromium_ready:
            return chromium.launch(args=["--no-sandbox"])

        try:
            browser = chromium.launch(args=["--no-sandbox"])
        except Exception as exc:
            if not _is_missing_chromium_error(exc):
                raise
            _install_chromium_once()
            # Let this raise straight through if it still fails — a second
            # "not installed" right after a reported-successful install is a
            # real, unexpected problem, not one to retry silently.
            browser = chromium.launch(args=["--no-sandbox"])

        _chromium_ready = True
        return browser


def _render_html_to_png(html: str, output_path: str, width: int, height: int,
                        scale: float) -> None:
    """Render HTML to PNG in this app's own headless Chromium."""
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = _launch_chromium(p.chromium)
        try:
            context = browser.new_context(viewport={"width": width, "height": height},
                                          device_scale_factor=scale)
            page = context.new_page()
            page.set_content(html, wait_until="load")
            page.screenshot(path=output_path, full_page=True)
        finally:
            browser.close()


def _playwright_unavailable_reason(exc: Exception) -> str | None:
    """None for an unrelated failure; else a plain-language reason to hand
    back as a 501 instead of a raw stack trace. Covers the two shapes this
    actually fails in: the package missing entirely (ModuleNotFoundError)
    vs. installed but `playwright install chromium` never ran (its own
    error names the missing executable path)."""
    if isinstance(exc, ModuleNotFoundError) and "playwright" in str(exc):
        return "PNG export needs the 'playwright' package, which isn't installed on this server yet."
    if _is_missing_chromium_error(exc):
        return "PNG export needs playwright's browser binaries (`playwright install chromium`), not installed on this server yet."
    return None
