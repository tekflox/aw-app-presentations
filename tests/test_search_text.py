"""String-level invariants for presentations_app.search_text.

No DB, no TestClient — normalize/visible_text/extract_search_text are pure
functions; tests/test_storage_and_routes.py covers the route/storage wiring
on top of them.

Run: python3 -m pytest tests/test_search_text.py
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from presentations_app.search_text import (  # noqa: E402
    extract_search_text,
    normalize,
    visible_text,
)


def test_normalize_strips_accents_and_casefolds():
    assert normalize("Análise") == normalize("analise") == "analise"
    assert normalize("AÇÃO") == normalize("ação") == "acao"


def test_normalize_collapses_whitespace_runs():
    assert normalize("a\n\n  b\t\tc") == "a b c"


def test_normalize_empty_and_none_like_input():
    assert normalize("") == ""
    assert normalize("   ") == ""


def test_visible_text_skips_script_style_noscript_template():
    html = (
        "<html><head><style>body{color:red}</style></head>"
        "<body><script>var x = 1;</script>"
        "<noscript>no js here</noscript>"
        "<template><span>templated</span></template>"
        "<p>Real visible text.</p></body></html>"
    )
    text = visible_text(html)
    assert "Real visible text." in text
    for leaked in ("color:red", "var x", "no js here", "templated"):
        assert leaked not in text


def test_visible_text_never_emits_tag_names_or_attribute_values():
    html = '<div class="box-sizing" style="background:#0d1117">Hello</div>'
    text = visible_text(html)
    assert text.strip() == "Hello"
    assert "div" not in text
    assert "box-sizing" not in text
    assert "#0d1117" not in text


def test_visible_text_self_closing_skip_tag_does_not_swallow_following_text():
    html = "<style/><p>After a self-closing style tag.</p>"
    assert "After a self-closing style tag." in visible_text(html)


def test_visible_text_stray_closing_tag_is_a_no_op():
    html = "</div><p>Still here.</p></span>"
    assert "Still here." in visible_text(html)


def test_visible_text_unclosed_skip_tag_does_not_raise():
    # No literal "</style>" anywhere — HTMLParser's CDATA mode swallows the
    # rest of the document as style content. Must not raise; recovering the
    # trailing text isn't required (the row stays searchable by its title).
    html = "<html><body><style>never closed</body></html>"
    assert visible_text(html) == ""


def test_extract_search_text_combines_title_and_visible_body():
    text = extract_search_text("Análise", "<style>.x{}</style><p>pgVector ação</p>")
    title_part, body_part = text.split("\n", 1)
    assert title_part == "analise"
    assert "pgvector acao" in body_part
    assert "style" not in body_part
