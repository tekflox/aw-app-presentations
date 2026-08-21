---
name: aw-presentation
description: Create visual presentations in the AW UI. Use when the user asks for analysis, code reviews, architecture diagrams, status reports, investigation summaries, images, or any "show me" / "present" request. Trigger on phrases like "show me on presentation", "what did you do", "analysis", "review this", "summarize", "diagram", "report".
---

# aw-presentation — Visual Presentations in AW UI

Use the `aw-presentation` MCP tools (aw-app-presentations' own MCP server,
`src/mcp/presentation-server.py` in agentic-workspace) to create rich visual
presentations in the AW dashboard. This app owns HTML reports, diagrams,
code-review annotations, and image display — everything except diffs.

> **Diffs live elsewhere.** Git diff viewing was split out into its own app
> (`aw-app-diff-tool`) with its own `show_diff` MCP tool — see the
> `aw-diff-tool` skill for that. Don't route diff requests here.

## When to Trigger

- User says "show me", "present", "visualize", "presentation", "diagram", "report"
- User asks "what did you do?" or "summarize your changes" (pair with `aw-diff-tool`'s `show_diff` for the actual code)
- User asks for code review or analysis results
- User asks for architecture diagrams or flowcharts
- After completing investigative work (debugging, log analysis)
- User wants to see an image file rendered in the dashboard

---

## Intent Router

### 1. Analysis / Investigation / Report — `"/aw-presentation analysis"` or `"present your findings"`

Create a rich HTML presentation of analysis results — log findings, debugging sessions, architecture exploration, performance analysis, etc.

**Tool:** `create_presentation`

```
create_presentation(
  title="Analysis Report",
  html="<html>...</html>",
  id="analysis-report"   # stable id so a later call updates in place
)
```

**HTML Template Structure** — adapt to the content, always dark theme:

```html
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body { font-family: -apple-system, system-ui, sans-serif; margin: 0;
         padding: clamp(12px, 4vw, 24px); background: #0d1117; color: #c9d1d9;
         overflow-wrap: anywhere; }
  .header { border-bottom: 1px solid #30363d; padding-bottom: 16px; margin-bottom: 24px; }
  .header h1 { color: #58a6ff; margin: 0 0 8px; font-size: clamp(20px, 5vw, 30px); }
  .header .subtitle { color: #8b949e; }
  .section { margin-bottom: 32px; }
  .section h2 { color: #58a6ff; border-bottom: 1px solid #21262d; padding-bottom: 8px;
                font-size: clamp(16px, 4vw, 22px); }
  .card { background: #161b22; border: 1px solid #30363d; border-radius: 8px;
          padding: clamp(12px, 3vw, 16px); margin: 12px 0; }
  .card h3 { color: #f0f6fc; margin-top: 0; }
  /* Fluid card/metric rows — auto-fit is what makes them reflow on a phone. */
  .grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
  .metrics { display: flex; flex-wrap: wrap; gap: 12px 24px; }
  .metric { text-align: center; }
  .metric .value { font-size: clamp(20px, 6vw, 28px); font-weight: 700; color: #f0f6fc; }
  .metric .label { font-size: 12px; color: #8b949e; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; }
  .badge-green { background: #1b4332; color: #2dd4bf; }
  .badge-yellow { background: #3d2e00; color: #f0c000; }
  .badge-red { background: #3d0000; color: #f87171; }
  .badge-blue { background: #0c2d48; color: #58a6ff; }
  /* Tables MUST be wrapped: <div class="table-wrap"><table>…</table></div> */
  .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 12px 0; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #21262d; }
  th { color: #8b949e; font-weight: 600; }
  code { background: #1f2937; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
  pre { background: #161b22; border: 1px solid #30363d; border-radius: 8px;
        padding: 16px; overflow-x: auto; max-width: 100%; }
  img, svg, canvas { max-width: 100%; height: auto; }
  .finding { border-left: 3px solid #58a6ff; padding-left: 12px; margin: 12px 0; }
  .finding.critical { border-color: #f87171; }
  .finding.warning { border-color: #f0c000; }
  .finding.success { border-color: #2dd4bf; }
  @media (max-width: 640px) {
    .header { margin-bottom: 16px; }
    .section { margin-bottom: 20px; }
  }
</style>
</head>
<body>
  <div class="header">
    <h1>Title</h1>
    <div class="subtitle">Date &mdash; Context</div>
  </div>
  <!-- sections, cards, findings, metrics, tables, code blocks as needed -->
</body>
</html>
```

**Responsive rules — a presentation is read on a phone as often as on a desktop.**

1. Never set a fixed `width` in px on a container. Use `%`, `fr`, `clamp()` or
   let it be auto.
2. Multi-column layouts use `grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))`,
   never `repeat(3, 1fr)`. `auto-fit` collapses to one column on a phone by itself.
3. Wrap every `<table>` in `<div class="table-wrap">`. A table is the single
   most common thing that pushes a report wider than the screen.
4. Rows of items (metrics, badges, cards) go in a flex container with
   `flex-wrap: wrap`. If you set `min-width` on the items, keep it under 140px.
5. Nothing important may depend on `:hover` — there is no hover on a touch screen.
6. Verify mentally at 390px wide (iPhone). If anything would need horizontal
   panning to read, it is wrong.

The server injects a narrow-screen safety net into every presentation it
serves, but that net only *relaxes* implicit constraints — it cannot undo a
`repeat(4, 1fr)` grid or an explicit `min-width`. Getting it right here is
what actually makes the page readable on a phone.

Common patterns: log analysis (metrics at top, findings as cards), architecture (CSS/SVG boxes + dependency tables), debugging (stack traces in `pre`, timeline of events), performance (badges, before/after tables), planning (numbered steps, file lists, trade-off cards).

**Inline vs from file — which tool to call:**

- **`create_presentation` (inline `html`)** — for content you are composing right
  now, in this turn, as you write the tool call. Analysis write-ups, diagrams,
  reports you're drafting live.
- **`create_presentation_from_file` (`path`)** — for content that already
  exists as a file, especially one a script generated. Pasting a 12KB
  script-generated HTML report into a tool call wastes context and is fragile
  (the content was generated, not authored — a stray edit while copying it in
  silently changes what ships). Point the tool at the file instead. See
  section 1b below for the full contract (accepted extensions, guardrails).

---

### 1b. From a file — `create_presentation_from_file`

Create a presentation by reading its content from a file already on disk,
instead of inline. Reach for this whenever the content was produced by a
script, a build step, or any process other than you typing it into the tool
call right now.

```
create_presentation_from_file(
  path="/opt/aw-workspace/.tmp/report.html",  # absolute, must resolve inside the workspace
  title="Nightly Report",                     # optional, defaults to the filename
  id="nightly-report"                         # optional, same upsert semantics as create_presentation
)
```

**Dispatch by extension — content decides nothing, only the extension does:**

| Extension | Behavior |
|---|---|
| `.html` / `.htm` | File content becomes the presentation's `html`, byte-for-byte unchanged. |
| `.md` | Rendered as preformatted text inside this app's dark theme. This app carries no markdown-rendering dependency, so headings/bold/lists are **not** translated into real `<h1>`/`<strong>`/`<ul>` elements — the raw markdown text is shown as-is in a styled `<pre>` block. For a fully-styled report, author HTML directly (section 1) instead. |
| `.png` `.jpg` `.jpeg` `.gif` `.svg` `.webp` | Delegates to the exact same code path `show_image` uses — no separate base64/encoding logic to drift out of sync. |
| anything else | Rejected outright, with the accepted list in the error. The tool never guesses format from content. |

**Guardrails (all enforced, not advisory):**

- `path` must be **absolute** — a relative path is rejected.
- The path is resolved with `realpath` (symlinks included) and must land
  **inside** the workspace (`AW_WORKSPACE_CONTAINER_DIR`, default
  `/opt/aw-workspace`). A symlink inside the workspace pointing outside it is
  rejected too — the resolution happens before the containment check, not
  after.
- Size caps: **5MB** for `.html`/`.md`, **15MB** for images. A file over the
  cap is rejected with the size read and the limit, rather than being loaded
  into an iframe and hanging the tab.
- A missing file or a read failure (permissions, etc.) is reported by path,
  never as a stack trace.
- Text files are read as UTF-8 with `errors="replace"` — one bad byte in a
  generated report doesn't fail the whole call.

---

### 2. Code Review — `"/aw-presentation review"` or `"review this code"`

Annotate files with inline review comments at specific line ranges.

**Tool:** `commented_file`

```
commented_file(
  title="Code Review: restart.py",
  files=[{
    file_path: "src/commands/restart.py",
    comments: [
      {start: 35, end: 50, text: "Good: detects running port from process cmdline", severity: "praise"},
      {start: 72, end: 72, text: "Consider adding a timeout for the subprocess call", severity: "suggestion"},
      {start: 90, end: 95, text: "Bug: port_override should take precedence over running_port", severity: "error"}
    ]
  }]
)
```

**Severity levels:** `error`, `warning`, `suggestion`, `info`, `comment`, `praise`

**Guidelines:**
- Read the files first, then annotate with meaningful comments
- Use `praise` for good patterns worth highlighting
- Use `error` only for actual bugs
- Group related comments, don't over-annotate

---

### 3. Diagram — `"/aw-presentation diagram"` or `"architecture diagram"`

Create visual diagrams using HTML/CSS/SVG via `create_presentation` (same tool as analysis reports). Use CSS flexbox/grid with styled divs and SVG arrows. Keep it clean — dark theme, clear labels, color-coded by component type.

---

### 4. Image — `"/aw-presentation show image <path>"`

Display an image file in the presentation.

**Tool:** `show_image`

```
show_image(path="/absolute/path/to/image.png", title="Screenshot")
```

---

### 5. Export to PNG — after creating a presentation, to attach it as a chat image

Render an existing presentation to a PNG on disk (headless Chromium — pixel-for-pixel match with the dashboard).

**Tool:** `export_presentation_to_image`

```
export_presentation_to_image(presentation_id="analysis-report")
```

Pair with the Agents Platform's `[[ATTACH: <path>]]` marker to ship the returned path straight to chat: `create_presentation` → `export_presentation_to_image` → attach.

---

## Presentation Management

- **Update existing:** `update_presentation(id=..., html=...)` to refresh content in place
- **List presentations:** `list_presentations()` to list all stored presentations with their IDs and titles
- **Delete:** `delete_presentation(id=...)` to clean up
- **Stable IDs:** Use descriptive IDs like `"analysis-report"`, `"code-review"` so updates replace rather than duplicate

---

## Sharing a Presentation externally

Use `share_presentation` to generate a **public, time-limited URL**. The tool only generates the link — delivery to Telegram is a separate step via the Agents Platform's `[[MINIAPP: <url>]]` marker (not a direct tool call).

```
# Default: link expires in 24h
share_presentation(presentation_id="my-report")
→ { url: "...", token: "...", expires_at: 1234567890 }

# Permanent link (never expires)
share_presentation(presentation_id="my-report", ttl_hours=0)
```

Use `ttl_hours=0` for dashboards or reports the user will revisit. Use the default (24h) for one-off shares.

## Tips

- Always use the dark theme (background: `#0d1117`) — it matches the AW UI.
  Dark + a layout that overflows a phone reads as a *blank black screen*, not
  as a broken layout, so the responsive rules above are not optional cosmetics
- For code reviews, read the file first to get accurate line numbers
- A "what did you do" request should combine THIS skill (summary presentation) with `aw-diff-tool`'s `show_diff` (the actual code changes) — two separate tool calls, two separate apps
- Keep presentation titles short — they appear as window titles in the dashboard
