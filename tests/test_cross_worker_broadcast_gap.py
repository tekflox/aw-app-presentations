"""Regression test for Kanban card 3f25bf3b-9510-81d7-a833-f1fc0377590e
("Presentation não atualiza na UI após nova gravação sem refresh").

Root cause (fixed): ``PresentationStore._broadcast`` (storage.py) used to
notify only this PROCESS's own ``_listeners`` set — there was no
cross-worker relay (contrast with ``src/apps/service_relay.py`` /
``apps/devctl/devctl_app/relay.py`` / aw-backend's own (fixed 2026-09-25)
``PresentationManager``, all of which PUBLISH over
``src.libs.redis_coord.RedisBroadcaster`` so every worker's listeners hear
every event). At ``AW_WORKSPACE_WORKERS=10`` (the production default,
docker-compose.yml), a browser's open WS lands on one worker (uvicorn's
OS-level accept across the forked processes decides which); an external
HTTP upsert — e.g. aw-app-playwright-record's
``push_presentation_for_bundle``, a brand-new connection with no session
affinity to the browser's — lands on an independently-chosen worker. Before
the fix, only when the two coincided did the open WS's ``_send_all``
actually reach it; now ``_broadcast`` publishes over ``RedisBroadcaster``
and every worker's own relay fans it back out to its local listeners.

Two independent ``PresentationStore`` instances stand in for two workers,
sharing one ``FakeDb`` the way two real workers share one Postgres — proving
this is a BROADCAST/sync gap, not a persistence gap: the row is visible to
both the instant it's written, and (with the fix) the live push notification
now reaches the other worker's listener too.

Needs a reachable Redis (``AW_TEST_REDIS_URL`` / ``AW_WORKSPACE_REDIS_URL`` /
``AW_REDIS_URL`` — same resolution order ``storage.py`` itself uses) AND
aw-workspace core's own ``src`` package on ``sys.path``: ``storage.py``'s
relay lazy-imports ``src.libs.redis_coord``, only importable when this app
is running INSIDE an aw-workspace checkout — not the case in this repo's own
CI (no aw-workspace checkout, no Redis service), so this test skips cleanly
there, same posture as ``apps/devctl/tests/test_relay_multiworker.py``.
"""
from __future__ import annotations

import contextlib
import os
import sys
import time
import uuid
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

_WORKSPACE_ROOT = Path(os.environ.get("AW_WORKSPACE_CONTAINER_DIR", "/opt/aw-workspace"))
if (_WORKSPACE_ROOT / "src" / "libs" / "redis_coord.py").is_file():
    sys.path.insert(0, str(_WORKSPACE_ROOT))


def _redis_url() -> str:
    for var in ("AW_TEST_REDIS_URL", "AW_WORKSPACE_REDIS_URL", "AW_REDIS_URL"):
        url = os.environ.get(var)
        if url:
            return url
    return "redis://127.0.0.1:6379/0"


def _src_available() -> bool:
    try:
        import src.libs.redis_coord  # noqa: F401
        return True
    except Exception:
        return False


def _redis_available() -> bool:
    if not _src_available():
        return False
    try:
        import redis as sync_redis

        client = sync_redis.Redis.from_url(_redis_url(), socket_connect_timeout=2)
        return bool(client.ping())
    except Exception:
        return False


pytestmark = [
    pytest.mark.skipif(not _src_available(), reason="aw-workspace core's src package is not on sys.path"),
    pytest.mark.skipif(not _redis_available(), reason="Redis not reachable"),
]

# Isolate this run's relay keys from any real workspace sharing the same Redis.
os.environ["AW_WORKSPACE"] = f"presentations-relay-test-{uuid.uuid4().hex[:8]}"

from presentations_app import routes as routes_mod  # noqa: E402
from presentations_app.storage import PresentationStore  # noqa: E402
from tests.test_storage_and_routes import FakeDb  # noqa: E402


class SharedCtx:
    """One ``FakeDb`` shared by multiple ``Ctx``s — the real-world shape is
    N uvicorn worker processes each with their own Python heap, all pointed
    at the SAME Postgres."""

    def __init__(self, db):
        self.db = db


@contextlib.contextmanager
def _worker(db, tmp_path):
    """Yields ``(store, client)`` with the sub-app's ASGI lifespan actually
    running — only ``TestClient``'s own ``with`` context manager triggers
    ``on_event("startup")`` (see ``test_activate_sets_broadcast_loop_without_
    relying_on_asgi_startup`` in ``test_storage_and_routes.py``), which is
    what calls ``store.set_loop()`` and, through it, starts the relay this
    test exercises. A bare ``TestClient(app)`` with no ``with`` never binds
    the loop at all, which would make this test pass for the wrong reason."""
    store = PresentationStore(SharedCtx(db))
    app = routes_mod.build_app(store, str(tmp_path))
    with TestClient(app) as client:
        yield store, client


def _wait_until(predicate, timeout: float = 5.0, interval: float = 0.05) -> bool:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if predicate():
            return True
        time.sleep(interval)
    return predicate()


def test_create_on_one_worker_is_broadcast_to_another(tmp_path):
    db = FakeDb()
    with _worker(db, tmp_path / "a") as (store_a, client_a), \
            _worker(db, tmp_path / "b") as (_store_b, client_b), \
            client_a.websocket_connect("/ws") as ws_a:
        init = ws_a.receive_json()
        assert init["type"] == "presentation_init"
        assert init["presentations"] == []

        # Give worker A's relay time to finish PSUBSCRIBE-ing before worker B
        # publishes — Redis pub/sub does not queue for a subscriber that
        # hasn't subscribed yet, so this isn't optional cleanup, it's the
        # same ramp-up every real worker goes through right after boot.
        assert _wait_until(lambda: store_a._relay_up), (
            "worker A's cross-worker relay never came up — PresentationStore."
            "_start_relay() either failed silently or Redis isn't reachable "
            "despite the module-level availability check passing")

        # The recording daemon's upsert lands on worker B — a different
        # process, picked independently of the browser's own connection.
        resp = client_b.post("/presentations", json={
            "id": "recording-demo", "title": "Recording: demo", "html": "<h1>hi</h1>",
        })
        assert resp.status_code == 200 and resp.json()["success"] is True

        # PERSISTENCE: the row is immediately visible from EITHER worker —
        # proves this was never a persistence bug. A manual page refresh (a
        # fresh GET/WS-init against whichever worker it lands on) always saw
        # this, which is why "refresh fixes it" was the only known workaround.
        assert client_a.get("/presentations").json()[0]["id"] == "recording-demo"
        assert client_b.get("/presentations").json()[0]["id"] == "recording-demo"

        # SYNC: the open WS on worker A — the one actual live users are
        # looking at — now hears about a create that happened on worker B,
        # via the Redis relay, instead of needing a manual refresh.
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
            msg = result.get(timeout=5.0)
        except queue.Empty:
            msg = None

        assert msg is not None, (
            "worker A's open WS never received the presentation_update "
            "broadcast from worker B's create — the cross-worker relay did "
            "not fan it out"
        )
        assert msg["type"] == "presentation_update"
        assert msg["action"] == "create"
        assert msg["presentation"]["id"] == "recording-demo"
