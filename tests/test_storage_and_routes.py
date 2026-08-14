"""End-to-end test of storage.py + routes.py against a real FastAPI
TestClient, with ``ctx.db`` faked by an in-memory sqlite3 connection (same
SQL shape as the real Postgres-backed DbFacade — ``{table}`` placeholder,
``ON CONFLICT ... DO UPDATE``, which sqlite3 3.24+ also supports).

Run: .venv/aw/bin/python -m pytest tests/test_storage_and_routes.py
"""
from __future__ import annotations

import sqlite3
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from presentations_app import routes as routes_mod  # noqa: E402
from presentations_app.storage import PresentationStore  # noqa: E402


class FakeDb:
    def __init__(self):
        self.conn = sqlite3.connect(":memory:", check_same_thread=False)
        self.conn.row_factory = sqlite3.Row

    def create(self, name, columns_sql):
        # sqlite has no native BOOLEAN/DOUBLE PRECISION keywords but accepts
        # them as type affinities — the DDL from storage.py works unmodified.
        self.conn.execute(f"CREATE TABLE IF NOT EXISTS {name} ({columns_sql})")
        self.conn.commit()
        return name

    def execute(self, name, sql, params=None):
        stmt = sql.replace("{table}", name)
        cur = self.conn.execute(stmt, params or {})
        self.conn.commit()
        if stmt.strip().lower().startswith("select"):
            return [_Row(dict(r)) for r in cur.fetchall()]
        return cur


class _Row:
    """Mimics SQLAlchemy Row's ``._mapping`` access used by storage.py."""

    def __init__(self, d):
        self._mapping = d


class FakeCtx:
    def __init__(self):
        self.db = FakeDb()


@pytest.fixture
def store():
    return PresentationStore(FakeCtx())


@pytest.fixture
def client(store, tmp_path):
    app = routes_mod.build_app(store, str(tmp_path))
    return TestClient(app)


def test_create_list_get(client):
    resp = client.post("/presentations", json={"title": "Hello", "html": "<h1>Hi</h1>"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    pid = body["id"]

    listed = client.get("/presentations").json()
    assert len(listed) == 1
    assert listed[0]["id"] == pid
    assert "html" not in listed[0]

    got = client.get(f"/presentations/{pid}").json()
    assert got["html"] == "<h1>Hi</h1>"


def test_update_and_delete(client):
    pid = client.post("/presentations", json={"title": "T", "html": "<p>a</p>"}).json()["id"]
    upd = client.put(f"/presentations/{pid}", json={"title": "T2"}).json()
    assert upd["title"] == "T2"

    deleted = client.delete(f"/presentations/{pid}").json()
    assert deleted["success"] is True
    assert client.get(f"/presentations/{pid}").json()["success"] is False


def test_export_returns_501_when_playwright_package_missing(client, monkeypatch):
    pid = client.post("/presentations", json={"title": "T", "html": "<b>x</b>"}).json()["id"]

    def _raise(*a, **kw):
        raise ModuleNotFoundError("No module named 'playwright'")
    monkeypatch.setattr(routes_mod, "_render_html_to_png", _raise)

    resp = client.post(f"/presentations/{pid}/export", json={})
    assert resp.status_code == 501
    assert "playwright' package" in resp.json()["detail"]


def test_export_returns_501_when_chromium_binary_missing(client, monkeypatch):
    pid = client.post("/presentations", json={"title": "T", "html": "<b>x</b>"}).json()["id"]

    def _raise(*a, **kw):
        raise RuntimeError(
            "BrowserType.launch: Executable doesn't exist at /some/path\n"
            "Please run the following command to download new browsers:\n"
            "    playwright install"
        )
    monkeypatch.setattr(routes_mod, "_render_html_to_png", _raise)

    resp = client.post(f"/presentations/{pid}/export", json={})
    assert resp.status_code == 501
    assert "browser binaries" in resp.json()["detail"]


def test_export_returns_500_for_unrelated_failures(client, monkeypatch):
    pid = client.post("/presentations", json={"title": "T", "html": "<b>x</b>"}).json()["id"]

    def _raise(*a, **kw):
        raise RuntimeError("disk full")
    monkeypatch.setattr(routes_mod, "_render_html_to_png", _raise)

    resp = client.post(f"/presentations/{pid}/export", json={})
    assert resp.status_code == 500
    assert "disk full" in resp.json()["detail"]


def test_export_includes_a_data_url_on_success(client, monkeypatch, tmp_path):
    pid = client.post("/presentations", json={"title": "T", "html": "<b>x</b>"}).json()["id"]

    def _fake_render(html, output_path, width, height, scale):
        with open(output_path, "wb") as f:
            f.write(b"\x89PNG\r\n\x1a\nfakepngbytes")
    monkeypatch.setattr(routes_mod, "_render_html_to_png", _fake_render)

    resp = client.post(f"/presentations/{pid}/export", json={})
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["data_url"].startswith("data:image/png;base64,")


def test_get_html_and_share_token(client):
    pid = client.post("/presentations", json={"title": "T", "html": "<b>x</b>"}).json()["id"]

    html_resp = client.get(f"/presentations/{pid}/html")
    assert html_resp.status_code == 200
    assert "<b>x</b>" in html_resp.text

    share = client.post(f"/presentations/{pid}/share", json={}).json()
    assert share["success"] is True
    token = share["token"]

    tokened = client.get(f"/presentations/{pid}/html", params={"token": token})
    assert tokened.status_code == 200

    bad = client.get(f"/presentations/{pid}/html", params={"token": "not-a-real-token"})
    assert bad.status_code == 403


def test_websocket_init_and_broadcast(client):
    with client.websocket_connect("/ws") as ws:
        init = ws.receive_json()
        assert init["type"] == "presentation_init"
        assert init["presentations"] == []


def test_list_and_revoke_share(client):
    pid = client.post("/presentations", json={"title": "T", "html": "<b>x</b>"}).json()["id"]
    token = client.post(f"/presentations/{pid}/share", json={}).json()["token"]

    listed = client.get(f"/presentations/{pid}/share").json()
    assert len(listed) == 1
    assert listed[0]["token"] == token

    revoked = client.delete(f"/presentations/{pid}/share/{token}").json()
    assert revoked["success"] is True

    assert client.get(f"/presentations/{pid}/share").json() == []
    assert client.delete(f"/presentations/{pid}/share/{token}").status_code == 404


def test_env_inherited_tags(client, monkeypatch):
    monkeypatch.setenv("AW_TASK_ID", "task-1")
    monkeypatch.setenv("AW_TASK_RUN_ID", "run-42")
    pid = client.post("/presentations", json={"title": "T", "html": "<p>a</p>"}).json()["id"]
    got = client.get(f"/presentations/{pid}").json()
    assert "task:task-1" in got["tags"]
    assert "run:run-42" in got["tags"]


def test_rest_route_contract(client):
    """Pins the public REST route shape — the share-link/html endpoints in
    particular are depended on by external viewers (Telegram mini-app links)
    outside this process, so a rename here should fail loudly rather than
    surface as a 404 for someone with an already-shared link. The in-process
    MCP handler (presentations_app/mcp/http_handler.py) calls the store
    directly rather than these HTTP routes, so it isn't coupled to this
    contract the way the now-removed stdio MCP server used to be — see
    test_mcp_server.py for that handler's own coverage.
    """
    routes = {(m, r.path) for r in client.app.routes for m in getattr(r, "methods", set())}

    required = {
        ("GET", "/presentations"),
        ("POST", "/presentations"),
        ("GET", "/presentations/{presentation_id}"),
        ("PUT", "/presentations/{presentation_id}"),
        ("DELETE", "/presentations/{presentation_id}"),
        ("POST", "/presentations/{presentation_id}/export"),
        ("GET", "/presentations/{presentation_id}/html"),
        ("POST", "/presentations/{presentation_id}/share"),
    }
    missing = required - routes
    assert not missing, f"external callers depend on these routes, now missing: {missing}"


def test_activate_sets_broadcast_loop_without_relying_on_asgi_startup():
    """Regression (2026-08-05): F1 hot-loads this app's sub-app via a bare
    Mount() into the already-running process — Starlette's own
    @api.on_event("startup") (which storage.py's set_loop() used to rely on
    exclusively) never fires for a hot-mounted app, since the OUTER app's
    startup sequence already completed before this app gets loaded. That
    left store._loop permanently None in the real runtime, silently no-op'ing
    every create/update/delete broadcast to already-connected WS clients —
    invisible in the other tests here because TestClient's `with` context
    manager runs a real ASGI lifespan (unlike the real runtime), masking it.
    plugin.py's activate() now sets the loop directly; assert it does."""
    import asyncio

    from presentations_app.plugin import PresentationsAppPlugin

    class Ctx:
        def __init__(self):
            self.db = FakeDb()
            self._on_deactivate = None
            # Nonexistent on purpose — self_register.register_self() no-ops
            # for a missing package_dir, which is all this test needs (it's
            # only exercising set_loop()).
            self.package_dir = "/nonexistent-in-test"

        def on_deactivate(self, fn):
            self._on_deactivate = fn

        routes = type("R", (), {"register": staticmethod(lambda subapp: None)})()

    async def run():
        ctx = Ctx()
        plugin = PresentationsAppPlugin()
        await plugin.activate(ctx)
        assert plugin.store._loop is asyncio.get_running_loop()

    asyncio.run(run())


# ---------------------------------------------------------------------------
# _ensure_chromium — the browser binaries.
#
# `playwright install chromium` is a ~150 MB step separate from the pip package
# and nothing in the app lifecycle ran it, so a fresh workspace had the package
# and no browser. It runs lazily on first export: at activate() it would add
# minutes to every boot, including the many that never export anything.
# ---------------------------------------------------------------------------

def _reset_ready(monkeypatch):
    monkeypatch.setattr(routes_mod, "_chromium_ready", False, raising=False)


class _Ok:
    returncode = 0
    stdout = ""
    stderr = ""


class _Fail:
    returncode = 1
    stdout = ""
    stderr = "network unreachable"


def test_chromium_is_installed_on_first_use(monkeypatch):
    _reset_ready(monkeypatch)
    calls = []
    monkeypatch.setattr(routes_mod.subprocess, "run", lambda cmd, **kw: calls.append(cmd) or _Ok())

    routes_mod._ensure_chromium()

    assert len(calls) == 1
    assert calls[0][1:] == ["-m", "playwright", "install", "chromium"]


def test_chromium_is_not_reinstalled_on_every_export(monkeypatch):
    _reset_ready(monkeypatch)
    calls = []
    monkeypatch.setattr(routes_mod.subprocess, "run", lambda cmd, **kw: calls.append(cmd) or _Ok())

    routes_mod._ensure_chromium()
    routes_mod._ensure_chromium()
    routes_mod._ensure_chromium()

    assert len(calls) == 1


def test_a_failed_install_raises_and_is_retried_next_time(monkeypatch):
    """A transient network failure must not be latched as 'ready' — the next
    export has to try again rather than fail forever on a stale flag."""
    _reset_ready(monkeypatch)
    calls = []
    monkeypatch.setattr(routes_mod.subprocess, "run", lambda cmd, **kw: calls.append(cmd) or _Fail())

    with pytest.raises(RuntimeError, match="playwright install chromium failed"):
        routes_mod._ensure_chromium()
    with pytest.raises(RuntimeError):
        routes_mod._ensure_chromium()

    assert len(calls) == 2


def test_render_launches_its_own_browser_and_closes_it(monkeypatch, tmp_path):
    """Its OWN browser — deliberately not the shared aw-app-browser, so an
    export never contends with whatever the playwright MCP is driving there."""
    import sys as _sys
    import types

    _reset_ready(monkeypatch)
    monkeypatch.setattr(routes_mod, "_ensure_chromium", lambda: None)

    state = {"launched": False, "closed": False, "written": None}

    class _Page:
        def set_content(self, html, wait_until=None): pass
        def screenshot(self, path, full_page=False):
            with open(path, "wb") as f:
                f.write(b"\x89PNG\r\n\x1a\nx")
            state["written"] = path

    class _Ctx:
        def new_page(self): return _Page()

    class _Browser:
        def new_context(self, **kw): return _Ctx()
        def close(self): state["closed"] = True

    class _Chromium:
        def launch(self, args=None):
            state["launched"] = True
            return _Browser()

    class _PW:
        chromium = _Chromium()
        def __enter__(self): return self
        def __exit__(self, *a): return False

    mod = types.ModuleType("playwright")
    sync_api = types.ModuleType("playwright.sync_api")
    sync_api.sync_playwright = lambda: _PW()
    monkeypatch.setitem(_sys.modules, "playwright", mod)
    monkeypatch.setitem(_sys.modules, "playwright.sync_api", sync_api)

    out = str(tmp_path / "a.png")
    routes_mod._render_html_to_png("<b>x</b>", out, 800, 600, 1.0)

    assert state["launched"] is True
    assert state["closed"] is True, "a browser we launched must be closed"
    assert state["written"] == out
