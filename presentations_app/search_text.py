"""Write-time extraction of searchable text from a presentation's title and
HTML body, for the menu search feature (feature:presentation-menu-full-text-
search). Computed once in ``storage.create``/``update`` and persisted in the
``search_text`` column — never shipped back to the browser (see
``Presentation.to_dict`` in ``storage.py``, which deliberately omits it).

Two acceptance criteria this module alone is responsible for:
  * accent/case-insensitive matching both ways (``normalize``)
  * markup terms (``div``, ``style``, ``box-sizing``, ``#0d1117``) must never
    match, because every presentation in this app is built from the same
    dark-theme template (see ``skills/aw-presentation/SKILL.md``) and a raw
    substring search over the HTML would hit all of them on those terms —
    ``visible_text`` only ever emits ``handle_data`` text nodes, never tag
    names or attribute values.
"""

from __future__ import annotations

import re
import unicodedata
from html.parser import HTMLParser

_WS_RE = re.compile(r"\s+")

# Tags whose text content is never shown to a reader — script/style bodies
# are raw CSS/JS, not prose, and noscript/template content isn't rendered in
# the normal case either.
_SKIP_TAGS = {"script", "style", "noscript", "template"}


def normalize(s: str) -> str:
    """NFKD -> drop combining marks -> casefold -> collapse whitespace.

    Applied to both the stored text and the query term, so accents match in
    either direction: "analise" finds "Análise" and "ANÁLISE" finds "análise".
    """
    if not s:
        return ""
    decomposed = unicodedata.normalize("NFKD", s)
    stripped = "".join(c for c in decomposed if not unicodedata.combining(c))
    return _WS_RE.sub(" ", stripped.casefold()).strip()


class _VisibleTextExtractor(HTMLParser):
    """Collects ``handle_data`` text nodes, skipping anything inside
    script/style/noscript/template.

    ``_skip_depth`` is a plain counter, not a per-tag-name stack: all that
    matters is "am I inside any skip tag right now", so an unbalanced or
    missing end tag for one skip tag can't desync tracking for another.
    ``handle_endtag`` floors the decrement at 0 — a stray close tag (e.g. a
    lone ``</div>``, which isn't even a skip tag) never drives it negative,
    and a skip-tag close with nothing open is a no-op rather than corrupting
    later state. Self-closing/void tags never reach here via
    ``handle_starttag``/``handle_endtag`` imbalance: ``handle_startendtag``
    (HTMLParser's default) calls both in the same step, netting zero.
    """

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self._skip_depth = 0
        self._chunks: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag in _SKIP_TAGS:
            self._skip_depth += 1

    def handle_endtag(self, tag):
        if tag in _SKIP_TAGS and self._skip_depth > 0:
            self._skip_depth -= 1

    def handle_data(self, data):
        if self._skip_depth == 0 and data:
            self._chunks.append(data)

    def text(self) -> str:
        return " ".join(self._chunks)


def visible_text(html: str) -> str:
    """The reader-visible text of ``html`` — no tag names, no attribute
    values, no script/style/noscript/template content. Never raises: a
    presentation's HTML is agent-generated and sometimes malformed, and a
    broken extraction must degrade to partial/empty text, not take the
    create/update call down with it.
    """
    parser = _VisibleTextExtractor()
    try:
        parser.feed(html or "")
        parser.close()
    except Exception:
        pass
    return parser.text()


def extract_search_text(title: str, html: str) -> str:
    return normalize(title or "") + "\n" + normalize(visible_text(html or ""))
