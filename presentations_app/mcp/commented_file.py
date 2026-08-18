"""Commented file viewer — displays files with inline review comments.

Shows full file content with comment annotations at specific line ranges,
styled like a code review document. Supports multiple files as tabs
with multiple comments per file.

Ported verbatim from agentic-workspace's src/mcp/presentation/commented_file.py
— pure HTML generation, no monolith dependencies to strip.
"""

import html
import os


def _esc(text):
    return html.escape(text) if text else ""


def _read_file(file_path):
    try:
        with open(file_path, "r") as f:
            return [line.rstrip("\n") for line in f.readlines()]
    except (FileNotFoundError, PermissionError):
        return None


def generate_commented_file_html(files_data):
    """Generate HTML for one or more files with inline comments.

    files_data: list of {
        file_path: str,
        comments: [{start: int, end: int, text: str, severity?: str, author?: str}]
    }
    """
    css = _css()
    js = _js()

    tabs_html = ""
    content_html = ""

    for idx, fd in enumerate(files_data):
        file_path = fd["file_path"]
        comments = fd.get("comments", [])
        fname = os.path.basename(file_path)
        comment_count = len(comments)

        active = "active" if idx == 0 else ""
        badge = f'<span class="tab-badge">{comment_count}</span>' if comment_count else ""
        tabs_html += f'<button class="tab {active}" onclick="switchTab({idx})">{_esc(fname)} {badge}</button>'

        hidden = "" if idx == 0 else "hidden"
        file_content = _render_file(file_path, comments)
        content_html += f'<div id="file-{idx}" class="file-panel {hidden}">{file_content}</div>'

    tabs_bar = ""
    if len(files_data) > 1:
        tabs_bar = f'<div class="tabs-bar">{tabs_html}</div>'

    # This document's viewport meta is declared here rather than relying on
    # the server-side net in presentations_app/normalize.py: this is one of
    # the two presentations whose HTML the app owns outright, and a document
    # that states its own contract does not depend on a later rewrite of
    # someone else's detection logic.
    return f"""<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width, initial-scale=1"><style>{css}</style></head>
<body>
{tabs_bar}
{content_html}
<script>{js}</script>
</body>
</html>"""


def _render_file(file_path, comments):
    file_lines = _read_file(file_path)
    if not file_lines:
        return f'<div class="file-header"><div class="file-info"><a class="file-path" href="vscode://file/{_esc(file_path)}">{_esc(file_path)}</a><div class="file-error">File not found</div></div></div>'

    total = len(file_lines)
    comment_count = len(comments)

    comment_ends = {}
    commented_lines = set()
    for c in comments:
        start = c.get("start", 1)
        end = c.get("end", start)
        comment_ends.setdefault(end, []).append(c)
        for n in range(start, end + 1):
            commented_lines.add(n)

    sev_counts = {}
    for c in comments:
        sev = c.get("severity", "comment")
        sev_counts[sev] = sev_counts.get(sev, 0) + 1

    sev_badges = ""
    for sev, count in sorted(sev_counts.items()):
        sev_badges += f'<span class="sev-badge sev-{sev}">{count} {sev}</span>'

    lines_html = ""
    for i, line in enumerate(file_lines, 1):
        cls = "highlighted" if i in commented_lines else ""
        content = _esc(line) or " "
        lines_html += f'<div class="code-line {cls}" id="L{i}"><div class="ln">{i}</div><div class="lc">{content}</div></div>'

        if i in comment_ends:
            for c in comment_ends[i]:
                start = c.get("start", i)
                end = c.get("end", start)
                text = c.get("text", "")
                severity = c.get("severity", "comment")
                author = c.get("author", "")
                range_label = f"L{start}" if start == end else f"L{start}-L{end}"

                author_html = f'<span class="comment-author">{_esc(author)}</span>' if author else ""
                lines_html += f'''<div class="comment-block sev-{severity}">
                    <div class="comment-header">
                        <span class="comment-sev sev-{severity}">{severity}</span>
                        {author_html}
                        <span class="comment-range">{range_label}</span>
                    </div>
                    <div class="comment-body">{_esc(text)}</div>
                </div>'''

    return f"""
    <div class="file-header">
        <div class="file-info">
            <a class="file-path" href="vscode://file/{_esc(file_path)}">{_esc(file_path)}</a>
            <div class="file-meta">{total} lines &bull; {comment_count} comments {sev_badges}</div>
        </div>
    </div>
    <div class="code-container">{lines_html}</div>
    <div class="file-footer">
        {comment_count} comments on {len(commented_lines)} lines
        <span style="margin-left:auto;color:#6366f1">{total} lines total</span>
    </div>
    """


def _css():
    return """
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #111318; color: #d4d4d8; font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace; font-size: 13px; line-height: 1.5; }

    /* Tabs */
    .tabs-bar { background: #18191e; border-bottom: 1px solid #27282e; padding: 0 8px; display: flex; overflow-x: auto; gap: 0; }
    .tab { padding: 10px 16px; font-size: 12px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: none; color: #71717a; border: none; border-bottom: 2px solid transparent; cursor: pointer; white-space: nowrap; transition: color 0.15s; display: flex; align-items: center; gap: 6px; }
    .tab.active { color: #e4e4e7; border-bottom-color: #6366f1; }
    .tab:hover:not(.active) { color: #a1a1aa; }
    .tab-badge { font-size: 10px; background: #6366f1; color: #fff; padding: 1px 6px; border-radius: 10px; font-weight: 600; }

    /* File header */
    .file-header { background: #18191e; border-bottom: 1px solid #27282e; padding: 12px 16px; position: sticky; top: 0; z-index: 10; }
    .file-path { font-size: 13px; font-weight: 500; color: #6366f1; font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-decoration: none; cursor: pointer; display: block; }
    .file-path:hover { color: #818cf8; text-decoration: underline; }
    .file-meta { font-size: 12px; color: #71717a; margin-top: 4px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .file-error { font-size: 12px; color: #f87171; margin-top: 4px; }

    /* Severity badges in header */
    .sev-badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
    .sev-badge.sev-error { background: rgba(239,68,68,0.15); color: #f87171; }
    .sev-badge.sev-warning { background: rgba(251,191,36,0.15); color: #fbbf24; }
    .sev-badge.sev-suggestion { background: rgba(99,102,241,0.15); color: #818cf8; }
    .sev-badge.sev-comment { background: rgba(113,113,122,0.15); color: #a1a1aa; }
    .sev-badge.sev-info { background: rgba(56,189,248,0.15); color: #38bdf8; }
    .sev-badge.sev-praise { background: rgba(74,222,128,0.15); color: #4ade80; }

    /* Code lines — ONE horizontal scroll container for the whole listing.
       Per-line `overflow-x: auto` on .lc gave every line its own independent
       scrollbar: reading one long line scrolled that line only and left the
       next one behind, which on a phone is unusable. The lines are sized to
       their content and scroll together instead. */
    .code-container { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .code-line { display: flex; min-height: 20px; line-height: 20px; transition: background 0.1s; width: max-content; min-width: 100%; }
    .code-line:hover { background: #16171d; }
    .code-line .ln { width: 48px; text-align: right; padding: 0 8px; color: #3f3f46; flex-shrink: 0; font-size: 11px; user-select: none; }
    .code-line .lc { flex: 1; padding: 0 12px; white-space: pre; font-size: 13px; color: #a1a1aa; }

    /* Highlighted lines (have comments) */
    .code-line.highlighted { background: rgba(99,102,241,0.06); }
    .code-line.highlighted .ln { color: #6366f1; }
    .code-line.highlighted .lc { color: #d4d4d8; }
    .code-line.highlighted:hover { background: rgba(99,102,241,0.1); }

    /* Comment blocks */
    .comment-block { margin: 4px 0 4px 48px; border-radius: 8px; border: 1px solid #27282e; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
    .comment-header { padding: 8px 12px; display: flex; align-items: center; gap: 8px; font-size: 11px; background: #18191e; border-bottom: 1px solid #27282e; }
    .comment-sev { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.03em; }
    .comment-sev.sev-error { background: rgba(239,68,68,0.15); color: #f87171; }
    .comment-sev.sev-warning { background: rgba(251,191,36,0.15); color: #fbbf24; }
    .comment-sev.sev-suggestion { background: rgba(99,102,241,0.15); color: #818cf8; }
    .comment-sev.sev-comment { background: rgba(113,113,122,0.15); color: #a1a1aa; }
    .comment-sev.sev-info { background: rgba(56,189,248,0.15); color: #38bdf8; }
    .comment-sev.sev-praise { background: rgba(74,222,128,0.15); color: #4ade80; }
    .comment-author { color: #e4e4e7; font-weight: 600; }
    .comment-range { color: #52525b; margin-left: auto; font-family: ui-monospace, monospace; }
    .comment-body { padding: 10px 12px; font-size: 13px; color: #d4d4d8; line-height: 1.6; background: #111318; }

    /* Comment block left accent bar by severity */
    .comment-block.sev-error { border-left: 3px solid #ef4444; }
    .comment-block.sev-warning { border-left: 3px solid #f59e0b; }
    .comment-block.sev-suggestion { border-left: 3px solid #6366f1; }
    .comment-block.sev-comment { border-left: 3px solid #52525b; }
    .comment-block.sev-info { border-left: 3px solid #0ea5e9; }
    .comment-block.sev-praise { border-left: 3px solid #22c55e; }

    /* Footer */
    .file-footer { display: flex; gap: 16px; padding: 8px 16px; background: #18191e; border-top: 1px solid #27282e; font-size: 11px; color: #71717a; align-items: center; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }

    .hidden { display: none !important; }

    /* Narrow screens. Same 640px breakpoint as normalize.py's fallback net,
       the authoring template and the viewer's action bar. 12px is the floor:
       monospace below that stops being readable, and iOS Safari starts
       auto-zooming. */
    @media (max-width: 640px) {
        body { font-size: 12px; }
        .code-line .ln { width: 34px; padding: 0 4px; }
        .comment-block { margin-left: 34px; }
    }
    """


def _js():
    return """
    function switchTab(idx) {
        document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i === idx));
        document.querySelectorAll('.file-panel').forEach((p, i) => p.classList.toggle('hidden', i !== idx));
    }
    """
