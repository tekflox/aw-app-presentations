"""Presentation storage, ported from the monolith's
``src/api/presentation_manager.py`` onto the ``ctx.db`` (``db:own-tables``)
facade instead of the monolith's own SQLModel/Postgres session — this app
owns its rows under the ``app__presentations__`` prefix in the workspace's
own Postgres schema (ADR Decision 8), no legacy ``.tmp`` file migration
(that was monolith-only bootstrap history).

WebSocket broadcast (live updates to open galleries) is unchanged in shape
from the monolith: ``{"type": "presentation_update", "action": ...}``.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import time
import uuid

from .search_text import extract_search_text, normalize

logger = logging.getLogger("presentations_app.storage")

_TABLE = "app__presentations__records"
_SHARE_TABLE = "app__presentations__shares"
_RELAY_TOPIC = "presentations:update"

_TABLE_DDL = """
    id TEXT PRIMARY KEY,
    title TEXT,
    html TEXT,
    visible BOOLEAN NOT NULL DEFAULT true,
    session_id TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    created_at DOUBLE PRECISION,
    updated_at DOUBLE PRECISION,
    search_text TEXT
"""

_SHARE_TABLE_DDL = """
    token TEXT PRIMARY KEY,
    presentation_id TEXT NOT NULL,
    created_at DOUBLE PRECISION,
    expires_at DOUBLE PRECISION
"""


def _normalize_tags(tags) -> list[str]:
    if not tags:
        return []
    if isinstance(tags, str):
        tags = [tags]
    seen: dict[str, None] = {}
    for t in tags:
        if t is None:
            continue
        s = str(t).strip()
        if not s:
            continue
        seen.setdefault(s, None)
    return list(seen.keys())


def _env_inherited_tags() -> list[str]:
    """Auto-tags inherited from the process environment, ported verbatim
    from the monolith's ``PresentationManager.create`` — lets a Tasks UI
    filter "presentations this task produced" by tag."""
    tags: list[str] = []
    tid = os.environ.get("AW_TASK_ID")
    if tid:
        tags.append(f"task:{tid}")
    rid = os.environ.get("AW_TASK_RUN_ID")
    if rid:
        tags.append(f"run:{rid}")
    return tags


class Presentation:
    def __init__(self, presentation_id: str, title: str, html: str, visible: bool = True,
                 session_id: str | None = None, tags: list[str] | None = None,
                 created_at: float | None = None, updated_at: float | None = None):
        self.id = presentation_id
        self.title = title
        self.html = html
        self.visible = visible
        self.session_id = session_id
        self.tags = _normalize_tags(tags)
        self.created_at = created_at or time.time()
        self.updated_at = updated_at or time.time()

    def to_dict(self, include_html: bool = True) -> dict:
        d = {
            "id": self.id,
            "title": self.title,
            "visible": self.visible,
            "session_id": self.session_id,
            "tags": self.tags,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
        if include_html:
            d["html"] = self.html
        return d


class PresentationStore:
    """``ctx.db``-backed presentation store with WebSocket broadcast.

    Mirrors the monolith ``PresentationManager`` public API used by the
    ported routes in ``routes.py`` — kept intentionally close so the ported
    route handlers and the frontend gallery/thumbnail contract stay
    byte-for-byte compatible with the monolith's ``/api/presentations``.
    """

    def __init__(self, ctx):
        self._ctx = ctx
        self._listeners: set = set()
        self._loop: asyncio.AbstractEventLoop | None = None
        self._broadcaster = None
        self._relay_up = False
        ctx.db.create(_TABLE, _TABLE_DDL)
        ctx.db.create(_SHARE_TABLE, _SHARE_TABLE_DDL)
        # Migrate the LIVE table for installs that predate this column — a
        # fresh table (and the sqlite FakeDb in tests) already has it from
        # _TABLE_DDL above and raises duplicate-column here, swallowed. Same
        # pattern as aw-app-remote-screen's POST_INIT_COLUMNS swallow
        # (remote_screen_app/__main__.py). Catches broadly: sqlite raises
        # OperationalError, real Postgres raises sqlalchemy's ProgrammingError.
        try:
            ctx.db.execute(_TABLE, "ALTER TABLE {table} ADD COLUMN search_text TEXT", {})
        except Exception:
            pass

    def set_loop(self, loop: asyncio.AbstractEventLoop):
        self._loop = loop
        asyncio.ensure_future(self._start_relay())

    async def _start_relay(self) -> None:
        """Start the cross-worker Redis relay. Never raises: at
        ``AW_WORKSPACE_WORKERS=10`` (production) a browser's WS and a
        recording daemon's HTTP upsert land on independently-chosen
        workers, so without this relay ``_broadcast`` only ever reached
        whichever worker happened to hold the open WS (~1/10 of the time).
        With no reachable Redis — or no aw-workspace ``src`` package on
        ``sys.path`` (this app also ships/tests standalone) — broadcasts
        degrade to this worker's own listeners only, the same posture as
        every other relay in this codebase (see
        ``apps/devctl/devctl_app/relay.py``'s ``start_relay``)."""
        try:
            from src.libs.redis_coord import RedisBroadcaster

            self._broadcaster = RedisBroadcaster()
            await self._broadcaster.start_relay(self._on_relay_message)
            self._relay_up = True
        except Exception:
            logger.warning(
                "presentations: could not start the cross-worker Redis relay — "
                "live updates will only reach this worker's own listeners until "
                "restarted (harmless at AW_WORKSPACE_WORKERS=1)", exc_info=True)

    async def _on_relay_message(self, topic: str, payload: dict) -> None:
        if topic != _RELAY_TOPIC:
            return
        await self._send_all(json.dumps(payload))

    # ------------------------------------------------------------------
    # CRUD
    # ------------------------------------------------------------------

    def create(self, title: str, html: str, presentation_id: str | None = None,
               visible: bool = True, session_id: str | None = None,
               tags: list[str] | None = None, silent: bool = False) -> Presentation:
        cid = presentation_id or f"presentation-{uuid.uuid4().hex[:12]}"
        merged_tags = _normalize_tags(list(tags or []) + _env_inherited_tags())
        p = Presentation(cid, title, html, visible=visible, session_id=session_id, tags=merged_tags)
        search_text = extract_search_text(p.title, p.html)
        self._ctx.db.execute(
            _TABLE,
            "INSERT INTO {table} (id, title, html, visible, session_id, tags, created_at, updated_at, search_text) "
            "VALUES (:id, :title, :html, :visible, :session_id, :tags, :created_at, :updated_at, :search_text) "
            "ON CONFLICT (id) DO UPDATE SET title=:title, html=:html, visible=:visible, "
            "session_id=:session_id, tags=:tags, updated_at=:updated_at, search_text=:search_text",
            {"id": p.id, "title": p.title, "html": p.html, "visible": p.visible,
             "session_id": p.session_id, "tags": json.dumps(p.tags),
             "created_at": p.created_at, "updated_at": p.updated_at, "search_text": search_text},
        )
        logger.info("presentation created: %s (%s)", p.id, p.title)
        self._broadcast({"type": "presentation_update", "action": "create",
                          "presentation": p.to_dict(include_html=False),
                          **({"silent": True} if silent else {})})
        return p

    def update(self, presentation_id: str, title: str | None = None, html: str | None = None,
               tags: list[str] | None = None, silent: bool = False) -> Presentation | None:
        p = self.get(presentation_id)
        if not p:
            return None
        if title is not None:
            p.title = title
        if html is not None:
            p.html = html
        if tags is not None:
            p.tags = _normalize_tags(tags)
        p.updated_at = time.time()
        search_text = extract_search_text(p.title, p.html)
        self._ctx.db.execute(
            _TABLE,
            "UPDATE {table} SET title=:title, html=:html, tags=:tags, updated_at=:updated_at, "
            "search_text=:search_text WHERE id=:id",
            {"id": p.id, "title": p.title, "html": p.html, "tags": json.dumps(p.tags),
             "updated_at": p.updated_at, "search_text": search_text},
        )
        logger.info("presentation updated: %s (%s)", p.id, p.title)
        self._broadcast({"type": "presentation_update", "action": "update",
                          "presentation": p.to_dict(include_html=False),
                          **({"silent": True} if silent else {})})
        return p

    def delete(self, presentation_id: str) -> bool:
        p = self.get(presentation_id)
        if not p:
            return False
        self._ctx.db.execute(_TABLE, "DELETE FROM {table} WHERE id=:id", {"id": presentation_id})
        self._ctx.db.execute(_SHARE_TABLE, "DELETE FROM {table} WHERE presentation_id=:id",
                              {"id": presentation_id})
        logger.info("presentation deleted: %s", presentation_id)
        self._broadcast({"type": "presentation_update", "action": "delete", "id": presentation_id})
        return True

    def get(self, presentation_id: str) -> Presentation | None:
        rows = self._ctx.db.execute(_TABLE, "SELECT * FROM {table} WHERE id=:id", {"id": presentation_id})
        row = rows[0] if rows else None
        if not row:
            return None
        return self._row_to_presentation(row)

    def list_presentations(self, tags_filter: list[str] | None = None,
                           query: str | None = None) -> list[dict]:
        rows = self._ctx.db.execute(_TABLE, "SELECT * FROM {table} ORDER BY created_at DESC", {})
        filt = _normalize_tags(tags_filter) if tags_filter else []
        nq = normalize(query or "")
        out = []
        for row in rows:
            m = row._mapping
            p = self._row_to_presentation(row)
            if filt and not all(t in set(p.tags) for t in filt):
                continue
            if nq:
                search_text = m.get("search_text")
                if search_text is None:
                    # Legacy row predating this column — extract lazily and
                    # persist it back so the next search for this row is a
                    # plain lookup. WHERE search_text IS NULL makes this
                    # idempotent and race-safe under WORKERS=10: a loser just
                    # updates zero rows.
                    search_text = extract_search_text(p.title, p.html)
                    self._ctx.db.execute(
                        _TABLE,
                        "UPDATE {table} SET search_text=:search_text WHERE id=:id AND search_text IS NULL",
                        {"id": p.id, "search_text": search_text},
                    )
                if nq not in search_text:
                    continue
            out.append(p.to_dict(include_html=False))
        return out

    @staticmethod
    def _row_to_presentation(row) -> Presentation:
        m = row._mapping
        return Presentation(m["id"], m["title"], m["html"], visible=m["visible"],
                             session_id=m["session_id"], tags=json.loads(m["tags"] or "[]"),
                             created_at=m["created_at"], updated_at=m["updated_at"])

    # ------------------------------------------------------------------
    # Share tokens
    # ------------------------------------------------------------------

    def create_share_token(self, presentation_id: str, expires_in: float | None) -> dict:
        token = str(uuid.uuid4())
        now = time.time()
        expires_at = (now + expires_in) if expires_in is not None else None
        self._ctx.db.execute(
            _SHARE_TABLE,
            "INSERT INTO {table} (token, presentation_id, created_at, expires_at) "
            "VALUES (:token, :pid, :created_at, :expires_at)",
            {"token": token, "pid": presentation_id, "created_at": now, "expires_at": expires_at},
        )
        return {"token": token, "presentation_id": presentation_id,
                "created_at": now, "expires_at": expires_at}

    def validate_share_token(self, token: str) -> str | None:
        rows = self._ctx.db.execute(_SHARE_TABLE, "SELECT * FROM {table} WHERE token=:token", {"token": token})
        if not rows:
            return None
        m = rows[0]._mapping
        if m["expires_at"] is not None and m["expires_at"] < time.time():
            return None
        return m["presentation_id"]

    def list_share_tokens(self, presentation_id: str) -> list[dict]:
        rows = self._ctx.db.execute(
            _SHARE_TABLE, "SELECT * FROM {table} WHERE presentation_id=:id", {"id": presentation_id}
        )
        now = time.time()
        out = []
        for row in rows:
            m = row._mapping
            if m["expires_at"] is None or m["expires_at"] > now:
                out.append({"token": m["token"], "presentation_id": m["presentation_id"],
                            "created_at": m["created_at"], "expires_at": m["expires_at"]})
        return out

    def revoke_share_token(self, token: str) -> bool:
        rows = self._ctx.db.execute(_SHARE_TABLE, "SELECT * FROM {table} WHERE token=:token", {"token": token})
        if not rows:
            return False
        self._ctx.db.execute(_SHARE_TABLE, "DELETE FROM {table} WHERE token=:token", {"token": token})
        return True

    # ------------------------------------------------------------------
    # WebSocket broadcast
    # ------------------------------------------------------------------

    def add_listener(self, ws):
        self._listeners.add(ws)

    def remove_listener(self, ws):
        self._listeners.discard(ws)

    def _broadcast(self, msg: dict):
        """Publish an event to every worker's listeners.

        Must not early-return on "no LOCAL listeners" — the whole point of
        the relay is reaching a listener owned by a DIFFERENT worker. The
        "no loop" guard stays: without a loop there is nothing to schedule
        either the publish or a local send onto.
        """
        if not self._loop:
            return
        if self._relay_up:
            self._loop.call_soon_threadsafe(
                asyncio.ensure_future, self._broadcaster.publish(_RELAY_TOPIC, msg))
        elif self._listeners:
            data = json.dumps(msg)
            self._loop.call_soon_threadsafe(asyncio.ensure_future, self._send_all(data))

    async def _send_all(self, data: str):
        dead = set()
        for ws in self._listeners:
            try:
                await ws.send_text(data)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self._listeners.discard(ws)
