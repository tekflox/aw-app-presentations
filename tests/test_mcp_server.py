"""Tests for mcps/presentation_server.py — the stdio MCP server ported from
agentic-workspace, adapted to live inside this app (see that module's
docstring for what changed in the port).

``_api()`` is monkeypatched to dispatch into a real TestClient-backed
instance of this app's own FastAPI sub-app (same fixture shape as
test_storage_and_routes.py), so tools/call is exercised against the actual
route contract rather than a mock.
"""
from __future__ import annotations

import sqlite3
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient  # noqa: E402

from presentations_app import routes as routes_mod  # noqa: E402
from presentations_app.storage import PresentationStore  # noqa: E402
from mcps import presentation_server as srv  # noqa: E402


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
def client(tmp_path):
    store = PresentationStore(FakeCtx())
    app = routes_mod.build_app(store, str(tmp_path))
    return TestClient(app)


@pytest.fixture(autouse=True)
def route_api_through_client(client, monkeypatch):
    """Redirect srv._api() at the TestClient instead of a real HTTP socket —
    lets tools/call exercise the real route contract without a live awserv."""

    def fake_api(method, path, body=None):
        resp = client.request(method, path, json=body if body is not None else None)
        try:
            return resp.json()
        except ValueError:
            return {"error": f"non-JSON response: {resp.status_code}", "success": False}

    monkeypatch.setattr(srv, "_api", fake_api)


def _call(name, arguments):
    return srv.handle_request({
        "jsonrpc": "2.0", "id": 1, "method": "tools/call",
        "params": {"name": name, "arguments": arguments},
    })


def test_tools_list_matches_the_documented_surface():
    resp = srv.handle_request({"jsonrpc": "2.0", "id": 1, "method": "tools/list"})
    names = {t["name"] for t in resp["result"]["tools"]}
    assert names == {
        "create_presentation", "update_presentation", "delete_presentation",
        "list_presentations", "show_image", "export_presentation_to_image",
        "commented_file", "share_presentation",
    }


def test_merge_tags_dedupes_and_preserves_order(monkeypatch):
    monkeypatch.delenv("AW_TASK_ID", raising=False)
    monkeypatch.delenv("AW_TASK_RUN_ID", raising=False)
    assert srv.merge_tags(["a", "b", "a"]) == ["a", "b"]
    assert srv.merge_tags(None) == []


def test_merge_tags_inherits_task_breadcrumbs(monkeypatch):
    monkeypatch.setenv("AW_TASK_ID", "task-1")
    monkeypatch.setenv("AW_TASK_RUN_ID", "run-42")
    monkeypatch.delenv("AW_TASK_RUN_FILE", raising=False)
    assert srv.merge_tags([]) == ["task:task-1", "run:run-42"]


def test_create_then_list_presentation_round_trip():
    result = _call("create_presentation", {"title": "Hi", "html": "<h1>Hi</h1>", "id": "demo"})
    text = result["result"]["content"][0]["text"]
    assert "Presentation created: demo" in text
    assert result["result"]["isError"] is False

    listed = _call("list_presentations", {})
    listed_text = listed["result"]["content"][0]["text"]
    assert "demo: Hi" in listed_text


def test_create_presentation_is_idempotent_by_id():
    _call("create_presentation", {"title": "V1", "html": "<p>1</p>", "id": "same-id"})
    result = _call("create_presentation", {"title": "V2", "html": "<p>2</p>", "id": "same-id"})
    assert "Presentation updated: same-id" in result["result"]["content"][0]["text"]

    listed = _call("list_presentations", {})
    assert listed["result"]["content"][0]["text"].count("same-id") == 1


def test_commented_file_renders_and_stores():
    result = _call("commented_file", {
        "id": "review-1",
        "files": [{
            "file_path": str(ROOT / "aw-app.json"),
            "comments": [{"start": 1, "end": 1, "text": "Looks fine", "severity": "praise"}],
        }],
    })
    assert result["result"]["isError"] is False
    assert "review-1" in result["result"]["content"][0]["text"]


def test_share_presentation_returns_a_url_with_the_app_prefix(monkeypatch):
    monkeypatch.delenv("AW_PUBLIC_URL", raising=False)
    _call("create_presentation", {"title": "S", "html": "<p>s</p>", "id": "shareable"})
    result = _call("share_presentation", {"presentation_id": "shareable", "ttl_hours": 0})
    assert result["result"]["isError"] is False
    payload = result["result"]["content"][0]["text"]
    assert "/api/apps/presentations/presentations/shareable/html?token=" in payload


def test_delete_unknown_tool_reports_error():
    result = srv.handle_request({
        "jsonrpc": "2.0", "id": 1, "method": "tools/call",
        "params": {"name": "not_a_real_tool", "arguments": {}},
    })
    assert result["result"]["isError"] is True
