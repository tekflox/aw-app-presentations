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
import time
import uuid

logger = logging.getLogger("presentations_app.storage")

_TABLE = "app__presentations__records"
_SHARE_TABLE = "app__presentations__shares"

_TABLE_DDL = """
    id TEXT PRIMARY KEY,
    title TEXT,
    html TEXT,
    visible BOOLEAN NOT NULL DEFAULT true,
    session_id TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    created_at DOUBLE PRECISION,
    updated_at DOUBLE PRECISION
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
        ctx.db.create(_TABLE, _TABLE_DDL)
        ctx.db.create(_SHARE_TABLE, _SHARE_TABLE_DDL)

    def set_loop(self, loop: asyncio.AbstractEventLoop):
        self._loop = loop

    # ------------------------------------------------------------------
    # CRUD
    # ------------------------------------------------------------------

    def create(self, title: str, html: str, presentation_id: str | None = None,
               visible: bool = True, session_id: str | None = None,
               tags: list[str] | None = None, silent: bool = False) -> Presentation:
        cid = presentation_id or f"presentation-{uuid.uuid4().hex[:12]}"
        p = Presentation(cid, title, html, visible=visible, session_id=session_id, tags=tags)
        self._ctx.db.execute(
            _TABLE,
            "INSERT INTO {table} (id, title, html, visible, session_id, tags, created_at, updated_at) "
            "VALUES (:id, :title, :html, :visible, :session_id, :tags, :created_at, :updated_at) "
            "ON CONFLICT (id) DO UPDATE SET title=:title, html=:html, visible=:visible, "
            "session_id=:session_id, tags=:tags, updated_at=:updated_at",
            {"id": p.id, "title": p.title, "html": p.html, "visible": p.visible,
             "session_id": p.session_id, "tags": json.dumps(p.tags),
             "created_at": p.created_at, "updated_at": p.updated_at},
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
        self._ctx.db.execute(
            _TABLE,
            "UPDATE {table} SET title=:title, html=:html, tags=:tags, updated_at=:updated_at WHERE id=:id",
            {"id": p.id, "title": p.title, "html": p.html, "tags": json.dumps(p.tags),
             "updated_at": p.updated_at},
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

    def list_presentations(self, tags_filter: list[str] | None = None) -> list[dict]:
        rows = self._ctx.db.execute(_TABLE, "SELECT * FROM {table} ORDER BY created_at DESC", {})
        filt = _normalize_tags(tags_filter) if tags_filter else []
        out = []
        for row in rows:
            p = self._row_to_presentation(row)
            if filt and not all(t in set(p.tags) for t in filt):
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

    # ------------------------------------------------------------------
    # WebSocket broadcast
    # ------------------------------------------------------------------

    def add_listener(self, ws):
        self._listeners.add(ws)

    def remove_listener(self, ws):
        self._listeners.discard(ws)

    def _broadcast(self, msg: dict):
        if not self._listeners or not self._loop:
            return
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
