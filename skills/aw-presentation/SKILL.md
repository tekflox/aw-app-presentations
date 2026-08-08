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
<style>
  body { font-family: -apple-system, system-ui, sans-serif; margin: 0; padding: 24px; background: #0d1117; color: #c9d1d9; }
  .header { border-bottom: 1px solid #30363d; padding-bottom: 16px; margin-bottom: 24px; }
  .header h1 { color: #58a6ff; margin: 0 0 8px; }
  .header .subtitle { color: #8b949e; }
  .section { margin-bottom: 32px; }
  .section h2 { color: #58a6ff; border-bottom: 1px solid #21262d; padding-bottom: 8px; }
  .card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 16px; margin: 12px 0; }
  .card h3 { color: #f0f6fc; margin-top: 0; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; }
  .badge-green { background: #1b4332; color: #2dd4bf; }
  .badge-yellow { background: #3d2e00; color: #f0c000; }
  .badge-red { background: #3d0000; color: #f87171; }
  .badge-blue { background: #0c2d48; color: #58a6ff; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #21262d; }
  th { color: #8b949e; font-weight: 600; }
  code { background: #1f2937; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
  pre { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 16px; overflow-x: auto; }
  .finding { border-left: 3px solid #58a6ff; padding-left: 12px; margin: 12px 0; }
  .finding.critical { border-color: #f87171; }
  .finding.warning { border-color: #f0c000; }
  .finding.success { border-color: #2dd4bf; }
  .metric { display: inline-block; text-align: center; margin: 0 24px 12px 0; }
  .metric .value { font-size: 28px; font-weight: 700; color: #f0f6fc; }
  .metric .label { font-size: 12px; color: #8b949e; }
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

Common patterns: log analysis (metrics at top, findings as cards), architecture (CSS/SVG boxes + dependency tables), debugging (stack traces in `pre`, timeline of events), performance (badges, before/after tables), planning (numbered steps, file lists, trade-off cards).

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

- Always use the dark theme (background: #0d1117) — it matches the AW UI
- For code reviews, read the file first to get accurate line numbers
- A "what did you do" request should combine THIS skill (summary presentation) with `aw-diff-tool`'s `show_diff` (the actual code changes) — two separate tool calls, two separate apps
- Keep presentation titles short — they appear as window titles in the dashboard
