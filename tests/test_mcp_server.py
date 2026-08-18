"""Tests for the in-process MCP endpoint (presentations_app/mcp/http_handler.py,
mounted as POST/GET /mcp by routes.py) and self-registration
(presentations_app/mcp/self_register.py) — the mechanism aw-mcp-gateway's
app-scan uses to auto-discover this app's MCP tools, no separate process,
no credentials to provision anywhere (see http_handler.py's docstring for
why the earlier stdio approach — mcps/presentation_server.py, removed
2026-08-08 — wasn't sustainable).

Reuses test_storage_and_routes.py's FakeDb/FakeCtx shape via a local
sys.path insert (same convention that file itself uses).
"""
from __future__ import annotations

import json
import sqlite3
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from presentations_app import routes as routes_mod  # noqa: E402
from presentations_app.storage import PresentationStore  # noqa: E402
from presentations_app.mcp import self_register  # noqa: E402


class FakeDb:
    def __init__(self):
        self.conn = sqlite3.connect(":memory:", check_same_thread=False)
        self.conn.row_factory = sqlite3.Row

    def create(self, name, columns_sql):
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
    # Exposed as its own fixture so a test can read back the HTML a tool
    # generated — the MCP response only carries a confirmation string.
    app = routes_mod.build_app(store, str(tmp_path))
    return TestClient(app)


def _call(client, name, arguments=None, req_id=1):
    return client.post("/mcp", json={
        "jsonrpc": "2.0", "id": req_id, "method": "tools/call",
        "params": {"name": name, "arguments": arguments or {}},
    })


# ---- http_handler.py -------------------------------------------------------


def test_initialize(client):
    resp = client.post("/mcp", json={"jsonrpc": "2.0", "id": 1, "method": "initialize"})
    assert resp.status_code == 200
    assert resp.json()["result"]["serverInfo"]["name"] == "aw-presentation"


def test_tools_list_matches_the_documented_surface(client):
    resp = client.post("/mcp", json={"jsonrpc": "2.0", "id": 1, "method": "tools/list"})
    names = {t["name"] for t in resp.json()["result"]["tools"]}
    assert names == {
        "create_presentation", "update_presentation", "delete_presentation",
        "list_presentations", "show_image", "export_presentation_to_image",
        "commented_file", "share_presentation",
    }


def test_get_mcp_returns_405(client):
    assert client.get("/mcp").status_code == 405


def test_create_then_list_presentation_round_trip(client):
    resp = _call(client, "create_presentation", {"title": "Hi", "html": "<h1>Hi</h1>", "id": "demo"})
    body = resp.json()
    assert body["result"]["isError"] is False
    assert "Presentation created: demo" in body["result"]["content"][0]["text"]

    listed = _call(client, "list_presentations")
    assert "demo: Hi" in listed.json()["result"]["content"][0]["text"]


def test_create_presentation_is_idempotent_by_id(client):
    _call(client, "create_presentation", {"title": "V1", "html": "<p>1</p>", "id": "same-id"})
    resp = _call(client, "create_presentation", {"title": "V2", "html": "<p>2</p>", "id": "same-id"})
    assert "Presentation created: same-id" in resp.json()["result"]["content"][0]["text"]

    listed = _call(client, "list_presentations")
    assert listed.json()["result"]["content"][0]["text"].count("same-id") == 1


def test_update_presentation_not_found_is_an_error(client):
    resp = _call(client, "update_presentation", {"id": "nope", "title": "x"})
    assert resp.json()["result"]["isError"] is True


def test_delete_presentation(client):
    _call(client, "create_presentation", {"title": "T", "html": "<p>a</p>", "id": "to-delete"})
    resp = _call(client, "delete_presentation", {"id": "to-delete"})
    assert resp.json()["result"]["isError"] is False
    assert "No presentations" in _call(client, "list_presentations").json()["result"]["content"][0]["text"]


def test_show_image_reads_file_and_creates_presentation(client, tmp_path):
    img = tmp_path / "shot.png"
    img.write_bytes(b"\x89PNG\r\n\x1a\nfakepngbytes")
    resp = _call(client, "show_image", {"path": str(img), "title": "Screenshot"})
    assert resp.json()["result"]["isError"] is False
    assert "Screenshot" in resp.json()["result"]["content"][0]["text"]


def test_show_image_missing_file_is_an_error(client):
    resp = _call(client, "show_image", {"path": "/no/such/file.png"})
    assert resp.json()["result"]["isError"] is True


def test_export_presentation_to_image_missing_presentation_is_an_error(client):
    resp = _call(client, "export_presentation_to_image", {"presentation_id": "nope"})
    assert resp.json()["result"]["isError"] is True


def test_commented_file_renders_and_stores(client):
    resp = _call(client, "commented_file", {
        "id": "review-1",
        "files": [{
            "file_path": str(ROOT / "aw-app.json"),
            "comments": [{"start": 1, "end": 1, "text": "Looks fine", "severity": "praise"}],
        }],
    })
    assert resp.json()["result"]["isError"] is False
    assert "review-1" in resp.json()["result"]["content"][0]["text"]


def test_commented_file_html_is_readable_on_a_phone(client, store):
    _call(client, "commented_file", {
        "id": "review-mobile",
        "files": [{
            "file_path": str(ROOT / "aw-app.json"),
            "comments": [{"start": 1, "end": 1, "text": "x", "severity": "info"}],
        }],
    })
    html = store.get("review-mobile").html

    assert 'name="viewport"' in html
    assert "@media (max-width: 640px)" in html
    # ONE scroll container for the listing...
    assert ".code-container { overflow-x: auto;" in html
    # ...and not one per line: `.lc { overflow-x: auto }` scrolled each line
    # independently, which is the regression this guards.
    lc_rule = html.split(".code-line .lc {")[1].split("}")[0]
    assert "overflow-x" not in lc_rule, lc_rule


def test_show_image_html_is_readable_on_a_phone(client, store, tmp_path):
    img = tmp_path / "shot.png"
    img.write_bytes(b"\x89PNG\r\n\x1a\nfake")
    _call(client, "show_image", {"path": str(img), "id": "img-mobile"})
    html = store.get("img-mobile").html

    # Pinch-zoom is the feature here, hence maximum-scale rather than the
    # default meta the server injects everywhere else.
    assert 'name="viewport"' in html
    assert "maximum-scale=5" in html
    # dvh with a vh fallback declaration ahead of it for older engines.
    assert "min-height:100vh; min-height:100dvh;" in html


def test_commented_file_requires_files(client):
    resp = _call(client, "commented_file", {"files": []})
    assert resp.json()["result"]["isError"] is True


def test_share_presentation_returns_a_url_with_the_app_prefix(client, monkeypatch):
    monkeypatch.setenv("AW_WORKSPACE_API_URL", "https://api.example.workspace")
    _call(client, "create_presentation", {"title": "S", "html": "<p>s</p>", "id": "shareable"})
    resp = _call(client, "share_presentation", {"presentation_id": "shareable", "ttl_hours": 0})
    assert resp.json()["result"]["isError"] is False
    payload = resp.json()["result"]["content"][0]["text"]
    assert "https://api.example.workspace/api/apps/presentations/presentations/shareable/html?token=" in payload


def test_share_presentation_missing_presentation_is_an_error(client):
    resp = _call(client, "share_presentation", {"presentation_id": "nope"})
    assert resp.json()["result"]["isError"] is True


def test_unknown_tool_reports_error(client):
    resp = _call(client, "not_a_real_tool")
    assert resp.json()["result"]["isError"] is True


# ---- self_register.py -------------------------------------------------------


def test_register_self_writes_mcp_json(tmp_path, monkeypatch):
    monkeypatch.delenv("AW_WORKSPACE_API_KEY", raising=False)
    self_register.register_self(str(tmp_path), 9030)

    data = json.loads((tmp_path / "mcp.json").read_text())
    entry = data["mcpServers"]["aw-presentation"]
    assert entry["type"] == "http"
    assert entry["url"].endswith(":9030/api/apps/presentations/mcp")
    assert entry["enabled"] is True
    assert "headers" not in entry  # no key available yet


def test_register_self_includes_api_key_header_when_available(tmp_path, monkeypatch):
    monkeypatch.setenv("AW_WORKSPACE_API_KEY", "the-key")
    self_register.register_self(str(tmp_path), 9030)

    data = json.loads((tmp_path / "mcp.json").read_text())
    assert data["mcpServers"]["aw-presentation"]["headers"] == {"X-Api-Key": "the-key"}


def test_register_self_preserves_other_servers_in_existing_mcp_json(tmp_path, monkeypatch):
    monkeypatch.delenv("AW_WORKSPACE_API_KEY", raising=False)
    (tmp_path / "mcp.json").write_text(json.dumps({
        "mcpServers": {"other-app": {"type": "http", "url": "http://x/mcp"}}
    }))

    self_register.register_self(str(tmp_path), 9030)

    data = json.loads((tmp_path / "mcp.json").read_text())
    assert "other-app" in data["mcpServers"]
    assert "aw-presentation" in data["mcpServers"]


def test_register_self_is_idempotent_noop_when_unchanged(tmp_path, monkeypatch):
    monkeypatch.setenv("AW_WORKSPACE_API_KEY", "the-key")
    self_register.register_self(str(tmp_path), 9030)
    first_mtime = (tmp_path / "mcp.json").stat().st_mtime_ns

    self_register.register_self(str(tmp_path), 9030)
    second_mtime = (tmp_path / "mcp.json").stat().st_mtime_ns
    assert first_mtime == second_mtime  # no rewrite when entry is unchanged


def test_register_self_noops_when_package_dir_missing(tmp_path):
    missing = tmp_path / "does-not-exist"
    self_register.register_self(str(missing), 9030)
    assert not missing.exists()  # no crash, nothing created
