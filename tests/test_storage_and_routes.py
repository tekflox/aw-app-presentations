"""End-to-end test of storage.py + routes.py against a real FastAPI
TestClient, with ``ctx.db`` faked by an in-memory sqlite3 connection (same
SQL shape as the real Postgres-backed DbFacade — ``{table}`` placeholder,
``ON CONFLICT ... DO UPDATE``, which sqlite3 3.24+ also supports).

Run: .venv/aw/bin/python -m pytest tests/test_storage_and_routes.py
"""
from __future__ import annotations

import fcntl
import os
import sqlite3
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from presentations_app import routes as routes_mod  # noqa: E402
from presentations_app import storage as storage_mod  # noqa: E402
from presentations_app.storage import PresentationStore  # noqa: E402

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures" / "search"


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


def test_served_html_is_normalized_on_both_paths(client):
    """The share link is the surface the mobile incident was reported
    against, so it gets its own assertion rather than an inference from the
    token-less path — they are the same handler today, and a future auth
    change could stop them being so."""
    body = "<html><head><title>t</title></head><body><b>x</b></body></html>"
    pid = client.post("/presentations", json={"title": "T", "html": body}).json()["id"]

    plain = client.get(f"/presentations/{pid}/html")
    assert 'name="viewport"' in plain.text
    assert "data-aw-responsive-fallback" in plain.text
    assert "<b>x</b>" in plain.text

    token = client.post(f"/presentations/{pid}/share", json={}).json()["token"]
    shared = client.get(f"/presentations/{pid}/html", params={"token": token})
    assert 'name="viewport"' in shared.text
    assert "data-aw-responsive-fallback" in shared.text

    # Storage stays verbatim — normalization is a render-time concern, so
    # update_presentation round-trips without drift.
    assert client.get(f"/presentations/{pid}").json()["html"] == body


def test_export_renders_the_normalized_html(client, monkeypatch, tmp_path):
    """One normalization path, not two: an export asked for at width=390 has
    to render what a phone would actually get."""
    pid = client.post("/presentations", json={
        "title": "T", "html": "<html><head></head><body>x</body></html>"}).json()["id"]

    seen = {}

    def _fake_render(html, output_path, width, height, scale):
        seen["html"] = html
        with open(output_path, "wb") as f:
            f.write(b"\x89PNG\r\n\x1a\nfake")
    monkeypatch.setattr(routes_mod, "_render_html_to_png", _fake_render)

    assert client.post(f"/presentations/{pid}/export", json={}).status_code == 200
    assert "data-aw-responsive-fallback" in seen["html"]
    assert 'name="viewport"' in seen["html"]


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


def test_search_matches_body_only_term(client):
    """criterion 1 — the one that separates this card from a title-only
    filter: a term present only in the HTML body still surfaces it."""
    target = client.post("/presentations", json={
        "title": "Relatório Semanal",
        "html": "<body><p>Resultados do upgrade de pgvector nesta semana.</p></body>",
    }).json()["id"]
    sibling = client.post("/presentations", json={
        "title": "Outro Relatório",
        "html": "<body><p>Nada relacionado aqui.</p></body>",
    }).json()["id"]

    found = client.get("/presentations", params={"q": "pgvector"}).json()
    ids = {p["id"] for p in found}
    assert target in ids
    assert sibling not in ids


def test_search_matches_title_only_term(client):
    """criterion 2 — a term present only in the title still surfaces it."""
    target = client.post("/presentations", json={
        "title": "Auditoria CISUC", "html": "<p>sem termo aqui</p>"}).json()["id"]

    found = client.get("/presentations", params={"q": "CISUC"}).json()
    assert any(p["id"] == target for p in found)


def test_search_is_accent_and_case_insensitive_both_ways(client):
    """criterion 3 — both directions: a plain query finds an accented
    stored term, and an accented/uppercase query finds a plain stored term."""
    by_title = client.post("/presentations", json={
        "title": "Análise", "html": "<p>x</p>"}).json()["id"]
    by_body = client.post("/presentations", json={
        "title": "Outro", "html": "<p>Resultado da ação pendente.</p>"}).json()["id"]

    assert any(p["id"] == by_title
               for p in client.get("/presentations", params={"q": "analise"}).json())
    assert any(p["id"] == by_body
               for p in client.get("/presentations", params={"q": "AÇÃO"}).json())


def test_markup_terms_do_not_match_content_search(client):
    """criterion 4 — the card's key test. Every presentation here is built
    from the dark-theme template in skills/aw-presentation/SKILL.md; a naive
    raw-HTML substring search would hit all of them on these terms."""
    html = (FIXTURES_DIR / "dark-theme-template.html").read_text()
    client.post("/presentations", json={"title": "Relatório Semanal", "html": html})

    for term in ("div", "style", "box-sizing", "#0d1117"):
        assert client.get("/presentations", params={"q": term}).json() == [], \
            f"markup term {term!r} must not match"

    assert len(client.get("/presentations", params={"q": "pgvector"}).json()) == 1


def test_empty_or_whitespace_query_returns_full_list_newest_first(client):
    """criterion 5 — empty/whitespace term is a no-op, order unchanged."""
    first = client.post("/presentations", json={"title": "A", "html": "<p>a</p>"}).json()["id"]
    second = client.post("/presentations", json={"title": "B", "html": "<p>b</p>"}).json()["id"]

    for q in ("", "   "):
        listed = client.get("/presentations", params={"q": q}).json()
        assert [p["id"] for p in listed] == [second, first]


def test_list_and_broadcast_payload_excludes_html_and_search_text(store, tmp_path):
    """Payload regression: neither the list route nor the WS broadcast may
    ever carry html or the derived search_text — that would smuggle body
    text into the menu payload, which the PO explicitly forbade.

    Needs its OWN ``with TestClient(app) as client:`` rather than the
    module's bare ``client`` fixture: a bare ``TestClient(app)`` never binds
    ``store._loop`` via ``on_event("startup")`` at all on some calls and, on
    others, each top-level call can bind it to a different portal thread —
    harmless for a plain request/response, but a broadcast scheduled via
    ``call_soon_threadsafe`` onto a loop that doesn't match the one the open
    websocket is bound to hangs forever with no error. Same reasoning as
    ``test_cross_worker_broadcast_gap.py``'s ``_worker()`` fixture.
    """
    app = routes_mod.build_app(store, str(tmp_path))
    with TestClient(app) as client, client.websocket_connect("/ws") as ws:
        ws.receive_json()  # presentation_init
        resp = client.post("/presentations", json={"title": "T", "html": "<p>secret body text</p>"})
        assert resp.status_code == 200
        update = ws.receive_json()

        assert "html" not in update["presentation"]
        assert "search_text" not in update["presentation"]

        for p in client.get("/presentations").json():
            assert "html" not in p
            assert "search_text" not in p


def test_lazy_backfill_persists_search_text_for_legacy_rows(client, store):
    """criterion-adjacent: a pre-feature row with NULL search_text is found
    on first search and the column gets persisted so the next search is a
    plain lookup."""
    pid = client.post("/presentations", json={
        "title": "T", "html": "<p>pgvector backfill term</p>"}).json()["id"]
    store._ctx.db.execute(storage_mod._TABLE, "UPDATE {table} SET search_text=NULL WHERE id=:id",
                          {"id": pid})

    rows = store._ctx.db.execute(storage_mod._TABLE, "SELECT * FROM {table} WHERE id=:id", {"id": pid})
    assert rows[0]._mapping["search_text"] is None

    found = client.get("/presentations", params={"q": "pgvector"}).json()
    assert any(p["id"] == pid for p in found)

    rows = store._ctx.db.execute(storage_mod._TABLE, "SELECT * FROM {table} WHERE id=:id", {"id": pid})
    assert rows[0]._mapping["search_text"] is not None


def test_malformed_html_with_stray_closing_tag_is_not_stuck_skipping(client):
    """criterion 8 — a stray </div> landing right after a real </style>
    close must not leave extraction stuck treating everything after as
    markup content."""
    html = ("<html><body><style>body{color:red} <div>Oops</style></div> "
            "Still visible after malformed markup.</body></html>")
    pid = client.post("/presentations", json={"title": "Malformed Doc", "html": html}).json()["id"]

    found = client.get("/presentations", params={"q": "visible"}).json()
    assert any(p["id"] == pid for p in found)


def test_unclosed_style_tag_does_not_crash_or_blank_the_title_search(client):
    """criterion 8 — an unclosed <style> (no closing literal anywhere in the
    document) must not raise and must not make the row unsearchable by its
    title, even though the body text after it is unrecoverable."""
    html = "<html><body><style>body{color:red}</body></html>"
    pid = client.post("/presentations", json={
        "title": "Unclosed Style Title", "html": html}).json()["id"]

    found = client.get("/presentations", params={"q": "unclosed"}).json()
    assert any(p["id"] == pid for p in found)


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
# _launch_chromium — the browser binaries.
#
# `playwright install chromium` is a ~150 MB step separate from the pip package
# and nothing in the app lifecycle ran it, so a fresh workspace had the package
# and no browser. It runs lazily on first export: at activate() it would add
# minutes to every boot, including the many that never export anything.
#
# These tests drive a fake `p.chromium` (BrowserType) handle directly through
# `.launch()`, rather than stubbing a resolved executable path — an earlier
# version of this fix DID pre-check `.executable_path` on disk before
# launching, and that was itself a live bug: playwright's `.executable_path`
# always names the regular chrome binary, but `launch()` with this app's
# default `headless=True` silently prefers a separate "headless shell" build
# when one is installed, so the two were checking different files. Testing
# through `.launch()` itself can't repeat that mistake.
# ---------------------------------------------------------------------------

class _FakeBrowser:
    def __init__(self):
        self.closed = False

    def close(self):
        self.closed = True


_MISSING_CHROMIUM_ERROR = RuntimeError(
    "BrowserType.launch: Executable doesn't exist at /some/path\n"
    "Please run the following command to download new browsers:\n"
    "    playwright install"
)


class _FakeChromium:
    """Stands in for the real ``p.chromium`` (``BrowserType``) handle
    ``_launch_chromium`` now drives directly via ``.launch()``.

    ``launch_results`` is consumed one entry per ``.launch()`` call: an
    exception instance is raised, anything else is returned as the "browser".
    """

    def __init__(self, launch_results):
        self._results = list(launch_results)
        self.launch_calls = 0

    def launch(self, **kwargs):
        self.launch_calls += 1
        result = self._results.pop(0)
        if isinstance(result, BaseException):
            raise result
        return result


def _reset_ready(monkeypatch, tmp_path, launch_results=None):
    """Reset the per-process flag and point ``AW_WORKSPACE_HOME`` at a
    throwaway ``tmp_path`` so the cross-process install lock file lands
    there, not in a real workspace's ``.aw-workspace/locks/``.

    Returns a ``_FakeChromium`` whose default ``launch_results`` is "fails
    once with playwright's own 'not installed' error, then succeeds" — the
    genuine first-install shape these tests exercise by default.
    """
    monkeypatch.setattr(routes_mod, "_chromium_ready", False, raising=False)
    monkeypatch.setenv("AW_WORKSPACE_HOME", str(tmp_path))
    if launch_results is None:
        launch_results = [_MISSING_CHROMIUM_ERROR, _FakeBrowser()]
    return _FakeChromium(launch_results)


class _Ok:
    returncode = 0
    stdout = ""
    stderr = ""


class _Fail:
    returncode = 1
    stdout = ""
    stderr = "network unreachable"


def test_chromium_is_installed_with_its_system_libraries(monkeypatch, tmp_path):
    """--with-deps is not optional here: the workspace image carries no GUI
    stack, so without it the browser binary lands and dies on launch with
    "Target page, context or browser has been closed" (ldd: 17 not-found)."""
    chromium = _reset_ready(monkeypatch, tmp_path)
    monkeypatch.setattr(routes_mod, "_has_sudo", lambda: False)
    calls = []
    monkeypatch.setattr(routes_mod.subprocess, "run", lambda cmd, **kw: calls.append(cmd) or _Ok())

    routes_mod._launch_chromium(chromium)

    assert len(calls) == 1
    assert calls[0][1:] == ["-m", "playwright", "install", "--with-deps", "chromium"]
    assert chromium.launch_calls == 2, "first attempt fails, second (post-install) succeeds"


def test_sudo_is_used_when_available(monkeypatch, tmp_path):
    """--with-deps shells out to apt; the workspace runs as uid 1001."""
    chromium = _reset_ready(monkeypatch, tmp_path)
    monkeypatch.setattr(routes_mod, "_has_sudo", lambda: True)
    calls = []
    monkeypatch.setattr(routes_mod.subprocess, "run", lambda cmd, **kw: calls.append(cmd) or _Ok())

    routes_mod._launch_chromium(chromium)

    assert calls[0][:2] == ["sudo", "-n"]


def test_sudo_form_carries_home_through_so_the_download_lands_where_launch_looks(
        monkeypatch, tmp_path):
    """Live bug, 2026-10-09: a bare `sudo -n` resets $HOME to root's home
    (Debian/Ubuntu default env_reset + always_set_home), so the download
    landed in /root/.cache/ms-playwright while the later unprivileged
    chromium.launch() looked in the real user's ~/.cache/ms-playwright and
    found nothing — install reported success, launch still failed. The sudo
    form must explicitly pass the real $HOME through."""
    chromium = _reset_ready(monkeypatch, tmp_path)
    monkeypatch.setattr(routes_mod, "_has_sudo", lambda: True)
    monkeypatch.setenv("HOME", "/home/ubuntu")
    calls = []
    monkeypatch.setattr(routes_mod.subprocess, "run", lambda cmd, **kw: calls.append(cmd) or _Ok())

    routes_mod._launch_chromium(chromium)

    assert calls[0][:2] == ["sudo", "-n"]
    assert "env" in calls[0]
    assert "HOME=/home/ubuntu" in calls[0]


def test_falls_back_to_the_unprivileged_form_when_sudo_fails(monkeypatch, tmp_path):
    """A sudo that exists but is refused for this command must not be the end
    of it — the plain install still helps a container that already has the
    libraries."""
    chromium = _reset_ready(monkeypatch, tmp_path)
    monkeypatch.setattr(routes_mod, "_has_sudo", lambda: True)
    calls = []

    def _run(cmd, **kw):
        calls.append(cmd)
        return _Ok() if cmd[0] != "sudo" else _Fail()

    monkeypatch.setattr(routes_mod.subprocess, "run", _run)

    routes_mod._launch_chromium(chromium)

    assert len(calls) == 2
    assert calls[0][0] == "sudo" and calls[1][0] != "sudo"


def test_chromium_is_not_reinstalled_on_every_export(monkeypatch, tmp_path):
    chromium = _reset_ready(monkeypatch, tmp_path, launch_results=[
        _MISSING_CHROMIUM_ERROR, _FakeBrowser(), _FakeBrowser(), _FakeBrowser(),
    ])
    monkeypatch.setattr(routes_mod, "_has_sudo", lambda: False)
    calls = []
    monkeypatch.setattr(routes_mod.subprocess, "run", lambda cmd, **kw: calls.append(cmd) or _Ok())

    routes_mod._launch_chromium(chromium)
    routes_mod._launch_chromium(chromium)
    routes_mod._launch_chromium(chromium)

    assert len(calls) == 1, "only the first call's failed attempt should trigger an install"


def test_a_failed_install_raises_and_is_retried_next_time(monkeypatch, tmp_path):
    """A transient network failure must not be latched as 'ready' — the next
    export has to try again rather than fail forever on a stale flag."""
    chromium = _reset_ready(monkeypatch, tmp_path, launch_results=[
        _MISSING_CHROMIUM_ERROR, _MISSING_CHROMIUM_ERROR,
    ])
    monkeypatch.setattr(routes_mod, "_has_sudo", lambda: False)
    calls = []
    monkeypatch.setattr(routes_mod.subprocess, "run", lambda cmd, **kw: calls.append(cmd) or _Fail())

    with pytest.raises(RuntimeError, match="playwright install chromium failed"):
        routes_mod._launch_chromium(chromium)
    with pytest.raises(RuntimeError):
        routes_mod._launch_chromium(chromium)

    assert len(calls) == 2
    assert chromium.launch_calls == 2, "a failed install must not attempt the retry launch"


def test_launch_succeeding_immediately_skips_the_install_subprocess_entirely(monkeypatch, tmp_path):
    """The WORKERS=10 bug: a worker that has never personally run this before
    must not re-run `playwright install --with-deps chromium` (and its
    apt-get) just because ITS OWN `_chromium_ready` flag happens to be unset
    — if the browser launches fine on the first try (already on disk,
    whichever binary variant `launch()` actually needed), there is nothing
    to install."""
    chromium = _reset_ready(monkeypatch, tmp_path, launch_results=[_FakeBrowser()])
    monkeypatch.setattr(routes_mod.subprocess, "run",
                         lambda *a, **kw: (_ for _ in ()).throw(AssertionError("must not shell out")))

    routes_mod._launch_chromium(chromium)

    assert routes_mod._chromium_ready is True
    assert chromium.launch_calls == 1


def test_an_unrelated_launch_failure_is_not_mistaken_for_missing_chromium(monkeypatch, tmp_path):
    """A crash that ISN'T playwright's own "not installed" message (e.g. a
    real sandbox/permission problem) must propagate immediately — treating
    every launch failure as "go install" would waste an apt-get on a problem
    `playwright install` can't fix, and would mask the real error."""
    chromium = _reset_ready(monkeypatch, tmp_path, launch_results=[RuntimeError("something else crashed")])
    monkeypatch.setattr(routes_mod.subprocess, "run",
                         lambda *a, **kw: (_ for _ in ()).throw(AssertionError("must not shell out")))

    with pytest.raises(RuntimeError, match="something else crashed"):
        routes_mod._launch_chromium(chromium)


def test_install_is_serialized_across_worker_processes(monkeypatch, tmp_path):
    """`_chromium_ready` is per-process; the actual cross-process guard is the
    flock on `_chromium_install_lock_path()`. Simulate a second worker already
    holding that lock (a non-blocking LOCK_EX from a separate fd fails
    immediately) and confirm `_launch_chromium` blocks on it rather than
    racing `apt-get` — proven here by checking the lock is contended, then
    released once `_launch_chromium` returns."""
    chromium = _reset_ready(monkeypatch, tmp_path)
    monkeypatch.setattr(routes_mod, "_has_sudo", lambda: False)
    monkeypatch.setattr(routes_mod.subprocess, "run", lambda cmd, **kw: _Ok())

    lock_path = routes_mod._chromium_install_lock_path()
    # A SEPARATE fd on the same path, standing in for a second worker PROCESS
    # holding the lock — flock() is scoped to the open file description, not
    # the process, so reusing one fd for both sides of this check would only
    # prove a fd can re-acquire its own lock, not that two holders contend.
    other_fd = os.open(lock_path, os.O_CREAT | os.O_RDWR, 0o600)
    fcntl.flock(other_fd, fcntl.LOCK_EX)
    try:
        contender_fd = os.open(lock_path, os.O_CREAT | os.O_RDWR, 0o600)
        try:
            with pytest.raises(BlockingIOError):
                fcntl.flock(contender_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        finally:
            os.close(contender_fd)
    finally:
        fcntl.flock(other_fd, fcntl.LOCK_UN)
        os.close(other_fd)

    routes_mod._launch_chromium(chromium)
    assert routes_mod._chromium_ready is True

    # The real guard: _launch_chromium released its own lock on the way out,
    # so a fresh fd can now take it without blocking.
    check_fd = os.open(lock_path, os.O_CREAT | os.O_RDWR, 0o600)
    try:
        fcntl.flock(check_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        fcntl.flock(check_fd, fcntl.LOCK_UN)
    finally:
        os.close(check_fd)


def test_render_launches_its_own_browser_and_closes_it(monkeypatch, tmp_path):
    """Its OWN browser — deliberately not the shared aw-app-browser, so an
    export never contends with whatever the playwright MCP is driving there."""
    import sys as _sys
    import types

    _reset_ready(monkeypatch, tmp_path)
    monkeypatch.setattr(routes_mod, "_launch_chromium", lambda chromium: chromium.launch())

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
