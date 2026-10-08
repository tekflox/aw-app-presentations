"""Reproduces the live bug behind Kanban card 3f25bf3b-9510-81d7-a833-f1fc0377590e
("Presentation não atualiza na UI após nova gravação sem refresh").

Root cause: ``PresentationStore._broadcast`` (storage.py) notifies only this
PROCESS's own ``_listeners`` set — there is no cross-worker relay (contrast
with ``src/apps/service_relay.py`` / ``apps/devctl/devctl_app/relay.py`` /
aw-backend's own (fixed 2026-09-25) ``PresentationManager``, all of which
PUBLISH over ``src.libs.redis_coord.RedisBroadcaster`` so every worker's
listeners hear every event). At ``AW_WORKSPACE_WORKERS=10`` (the production
default, docker-compose.yml), a browser's open WS lands on one worker
(uvicorn's OS-level accept across the forked processes decides which); an
external HTTP upsert — e.g. aw-app-playwright-record's
``push_presentation_for_bundle``, a brand-new connection with no session
affinity to the browser's — lands on an independently-chosen worker. Only
when the two coincide does the open WS's ``_send_all`` actually reach it.

Two independent ``PresentationStore`` instances stand in for two workers,
sharing one ``FakeDb`` the way two real workers share one Postgres — proving
this is a BROADCAST/sync gap, not a persistence gap: the row is visible to
both the instant it's written; only the live push notification is lost.
"""
from __future__ import annotations

import sys
from pathlib import Path

from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from presentations_app import routes as routes_mod  # noqa: E402
from presentations_app.storage import PresentationStore  # noqa: E402
from tests.test_storage_and_routes import FakeDb  # noqa: E402


class SharedCtx:
    """One ``FakeDb`` shared by multiple ``Ctx``s — the real-world shape is
    N uvicorn worker processes each with their own Python heap, all pointed
    at the SAME Postgres."""

    def __init__(self, db):
        self.db = db


def _worker(db, tmp_path):
    store = PresentationStore(SharedCtx(db))
    app = routes_mod.build_app(store, str(tmp_path))
    return store, TestClient(app)


def test_create_on_one_worker_is_persisted_but_not_broadcast_to_another(tmp_path):
    db = FakeDb()
    _store_a, client_a = _worker(db, tmp_path / "a")
    _store_b, client_b = _worker(db, tmp_path / "b")

    # Worker A holds the browser's live WS (it connected to whichever worker
    # the load balancer picked).
    with client_a.websocket_connect("/ws") as ws_a:
        init = ws_a.receive_json()
        assert init["type"] == "presentation_init"
        assert init["presentations"] == []

        # The recording daemon's upsert lands on worker B — a different
        # process, picked independently of the browser's own connection.
        resp = client_b.post("/presentations", json={
            "id": "recording-demo", "title": "Recording: demo", "html": "<h1>hi</h1>",
        })
        assert resp.status_code == 200 and resp.json()["success"] is True

        # PERSISTENCE: the row is immediately visible from EITHER worker —
        # proves this is not a persistence bug. A manual page refresh (a
        # fresh GET/WS-init against whichever worker it lands on) always
        # sees this and is why "refresh fixes it".
        assert client_a.get("/presentations").json()[0]["id"] == "recording-demo"
        assert client_b.get("/presentations").json()[0]["id"] == "recording-demo"

        # SYNC: the open WS on worker A — the one actual live users are
        # looking at — never hears about it. This is the bug: today
        # ws_a.receive_json() here would hang forever (no cross-worker
        # relay), so prove the gap without blocking the test suite.
        import queue
        import threading

        def _try_receive():
            try:
                result.put(ws_a.receive_json())
            except Exception:  # the `with` block closes ws_a once we move on
                pass

        result: "queue.Queue[dict]" = queue.Queue()
        t = threading.Thread(target=_try_receive, daemon=True)
        t.start()
        try:
            msg = result.get(timeout=1.0)
        except queue.Empty:
            msg = None

        assert msg is None, (
            "worker A's open WS received a presentation_update it should not "
            "have been able to see without a cross-worker relay — if this "
            "now fails, PresentationStore._broadcast gained cross-worker fan-out "
            "and this test's assertion must flip to a positive receive check."
        )
