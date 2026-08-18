"""String-level invariants for presentations_app.normalize.

No DB, no TestClient — normalize_presentation_html is a pure function and
these are the properties it has to hold for every document the corpus
contains. What they deliberately do NOT prove is that the page *looks* right
at 390px: there is no browser in CI (chromium is a lazy runtime install, see
routes._ensure_chromium), so visual behaviour is verified by hand.

Run: python3 -m pytest tests/test_html_normalize.py
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from presentations_app.normalize import (  # noqa: E402
    FALLBACK_MARKER,
    normalize_presentation_html,
)

FIXTURE_DIR = Path(__file__).parent / "fixtures" / "presentations"
FIXTURES = sorted(FIXTURE_DIR.glob("*.html"))

_VIEWPORT_TAG_RE = re.compile(r"""<meta[^>]+name\s*=\s*["']?viewport""", re.I)


def _count_viewport_tags(html: str) -> int:
    return len(_VIEWPORT_TAG_RE.findall(html))


def test_viewport_word_in_body_text_is_not_a_viewport_tag():
    """The regression this module exists for.

    The old guard was ``if "viewport" in html.lower()``, which matched the
    word anywhere — including prose. A presentation whose content merely
    discussed viewports (a report about this very bug, for instance) got no
    meta tag and shipped laid out at desktop width.
    """
    html = (
        "<html><head><style>body{background:#0d1117}</style></head>"
        "<body><p>The fix adds a viewport meta tag.</p></body></html>"
    )
    out = normalize_presentation_html(html)
    assert _count_viewport_tags(out) == 1, out[:400]


def test_existing_viewport_meta_is_not_duplicated():
    html = (
        '<html><head><meta name="viewport" content="width=device-width, initial-scale=1">'
        "</head><body>x</body></html>"
    )
    out = normalize_presentation_html(html)
    assert _count_viewport_tags(out) == 1
    # ...but the fallback stylesheet still lands: it is inert on desktop and
    # only ever relaxes, so a self-declared viewport is no reason to skip it.
    assert FALLBACK_MARKER in out


@pytest.mark.parametrize(
    "html",
    [
        "<html><head></head><body>x</body></html>",
        "<!DOCTYPE html><html><body>no head</body></html>",
        "<div>bare fragment</div>",
        '<html><head><meta name="viewport" content="width=device-width"></head><body>y</body></html>',
        "",
    ],
    ids=["head", "doctype-no-head", "fragment", "has-viewport", "empty"],
)
def test_idempotent(html):
    once = normalize_presentation_html(html)
    assert normalize_presentation_html(once) == once
    assert once.count(FALLBACK_MARKER) <= 1
    if html:
        assert once.count(FALLBACK_MARKER) == 1
        assert _count_viewport_tags(once) == 1


@pytest.mark.parametrize(
    "head_open",
    ["<head>", "<HEAD>", "<head >", '<head lang="pt-BR">'],
)
def test_injection_lands_inside_head(head_open):
    """All four shapes are real. Only the first matched the old code's
    literal ``lower.find("<head>")``; the rest fell through to prepending
    the meta tag ahead of everything, doctype included."""
    html = f"<!DOCTYPE html><html>{head_open}<title>t</title></head><body>x</body></html>"
    out = normalize_presentation_html(html)

    head_end = out.lower().index(head_open.lower()) + len(head_open)
    close_head = out.lower().index("</head>")
    marker_at = out.index(FALLBACK_MARKER)
    viewport_at = _VIEWPORT_TAG_RE.search(out).start()

    # Injected at the very start of <head>, so author CSS that comes later
    # wins on equal specificity — hence <=, not < , at the opening boundary.
    assert head_end <= viewport_at < close_head
    assert head_end <= marker_at < close_head


def test_doctype_is_never_preceded():
    """Content ahead of the doctype puts the browser in quirks mode — a
    worse bug than the one being fixed, and what the old fallback did."""
    html = "<!DOCTYPE html><html><body>x</body></html>"
    out = normalize_presentation_html(html)
    assert out.lstrip().lower().startswith("<!doctype")


def test_fragment_without_html_still_gets_both():
    out = normalize_presentation_html("<div>x</div>")
    assert _count_viewport_tags(out) == 1
    assert FALLBACK_MARKER in out
    assert "<div>x</div>" in out


def test_every_injected_rule_sits_inside_the_media_query():
    """The executable form of "this cannot affect desktop".

    Everything the fallback stylesheet declares must be nested inside
    ``@media (max-width: 640px)``. Brace-counting is enough; a CSS parser
    would be a dependency bought for one assertion.
    """
    out = normalize_presentation_html("<html><head></head><body>x</body></html>")
    style = re.search(r"<style[^>]*data-aw-responsive-fallback[^>]*>(.*?)</style>", out, re.S)
    assert style, "fallback <style> block not found"
    body = style.group(1).strip()

    assert body.startswith("@media (max-width: 640px)")
    depth = 0
    for i, ch in enumerate(body):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            assert depth >= 0, "unbalanced braces in fallback CSS"
            # Returning to depth 0 before the end would mean a second,
            # unwrapped top-level rule follows.
            if depth == 0:
                assert i == len(body) - 1, "a rule sits outside the media query"
    assert depth == 0


@pytest.mark.parametrize("fixture", FIXTURES, ids=lambda p: p.stem)
def test_real_corpus_fixtures(fixture):
    """Three presentations lifted from the live corpus, covering the shapes
    that actually overflow: a repeat(N, 1fr) grid with min-width floors, a
    table-heavy report, and one with inline SVG."""
    html = fixture.read_text()
    out = normalize_presentation_html(html)

    assert _count_viewport_tags(out) == 1
    assert out.count(FALLBACK_MARKER) == 1
    assert normalize_presentation_html(out) == out
    # The author's document is preserved, not rewritten.
    assert html[-64:] in out


def test_fixtures_are_present():
    assert len(FIXTURES) == 3, f"expected 3 corpus fixtures, found {[f.name for f in FIXTURES]}"
