"""MCP server for Presentations, exposed over Streamable HTTP (POST /mcp).

Replaces the earlier stdio port (``mcps/presentation_server.py``, removed
2026-08-08). That approach — a subprocess spawned by aw-mcp-gateway calling
back into this app's own REST routes over HTTP — needed the gateway
container to have ``AW_WORKSPACE_API_URL``/``AW_WORKSPACE_API_KEY``
available (env vars or a shared ``.env``), and verified live that it
doesn't; every workaround required manually injecting credentials into the
*installed* (never git-committed, by design — a secret has no business in
this repo) copy, which a future reinstall would just wipe again. Not
sustainable.

This app is Tier-1 (in-process) — its routes already run inside the same
aw-workspace process as everything else, exactly like ``aw-app-whiteboard``
(``whiteboard_app/mcp/http_handler.py``, the template this file follows) and
``aw-app-kb``. So instead of a separate process reaching back over the
network, the MCP tool handlers below call ``PresentationStore`` DIRECTLY —
no HTTP hop, no credentials, nothing to provision. ``self_register.py``
tells aw-mcp-gateway where to find this endpoint using
``socket.gethostname()`` (the same value ``ContainerSupervisor`` already
publishes to sibling containers as ``AW_WORKSPACE_HOST`` — no cross-container
secret needed, see that module's docstring) and the workspace API key that's
already sitting in THIS process's own ``os.environ`` (the server mints it
there at boot for exactly this kind of same-process reuse).
"""

from __future__ import annotations

import base64
import json
import os
import time

from fastapi.concurrency import run_in_threadpool

from .commented_file import generate_commented_file_html
from ..storage import PresentationStore

_MIME_MAP = {
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".gif": "image/gif", ".svg": "image/svg+xml", ".webp": "image/webp", ".bmp": "image/bmp",
}


def _ok(req_id, text):
    return {"jsonrpc": "2.0", "id": req_id, "result": {"content": [{"type": "text", "text": text}], "isError": False}}


def _err(req_id, text):
    return {"jsonrpc": "2.0", "id": req_id, "result": {"content": [{"type": "text", "text": text}], "isError": True}}


def _silent_default(args: dict) -> bool:
    """Explicit caller value wins; else default True inside a task (AW_TASK_ID
    set) so background work doesn't yank the user's view."""
    silent = args.get("silent")
    if silent is None:
        return bool(os.environ.get("AW_TASK_ID"))
    return bool(silent)


TOOLS_SCHEMA = [
    {
        "name": "create_presentation",
        "description": "Create a new HTML presentation visualization in the AW UI. The presentation will open as a window in the dashboard. Use this for charts, diagrams, reports, or any HTML content the user wants to see visually.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "Title for the presentation window"},
                "html": {"type": "string", "description": "Full HTML content to render. Can include inline CSS and JavaScript. The HTML is rendered in a sandboxed iframe."},
                "id": {"type": "string", "description": "Optional stable ID. If provided and a presentation with this ID exists, it will be updated instead of creating a new one."},
                "visible": {"type": "boolean", "description": "If true (default), presentation appears in sidebar and auto-opens. If false, stored but hidden."},
                "session_id": {"type": "string", "description": "Optional session ID to associate this presentation with."},
                "tags": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Optional tag list (e.g. ['kind:summary', 'topic:churn']). Convention: 'key:value' strings. task:<id> and run:<id> are auto-stamped when AW_TASK_ID/AW_TASK_RUN_ID are set in the environment.",
                },
                "silent": {
                    "type": "boolean",
                    "description": "If true, the presentation is created and shown in the Presentation menu but does NOT auto-pop up in the UI. Default is false (auto-opens). When this runs inside a task (AW_TASK_ID is set), silent defaults to true so background tasks don't yank the user's view — pass silent=false explicitly to override.",
                },
            },
            "required": ["title", "html"],
        },
    },
    {
        "name": "update_presentation",
        "description": "Update an existing presentation by ID. Use this to modify the HTML content, title, or tags of a previously created presentation.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "id": {"type": "string", "description": "The presentation ID to update"},
                "title": {"type": "string", "description": "New title (optional)"},
                "html": {"type": "string", "description": "New HTML content (optional)"},
                "tags": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Replace tag list. Pass [] to clear all tags. Omit to leave tags unchanged.",
                },
                "silent": {
                    "type": "boolean",
                    "description": "If true, the UI updates the presentation in place but does NOT re-open / re-focus the window. Default false (re-opens). Inside a task (AW_TASK_ID set) the default flips to true.",
                },
            },
            "required": ["id"],
        },
    },
    {
        "name": "delete_presentation",
        "description": "Delete a presentation from the AW UI.",
        "inputSchema": {
            "type": "object",
            "properties": {"id": {"type": "string", "description": "The presentation ID to delete"}},
            "required": ["id"],
        },
    },
    {
        "name": "list_presentations",
        "description": "List all active presentations in the AW UI.",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "show_image",
        "description": "Display an image file in the AW UI presentation. Reads the file, converts to base64, and shows it in a presentation window. Supports PNG, JPG, GIF, SVG, WebP.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Absolute path to the image file"},
                "title": {"type": "string", "description": "Title for the presentation window (defaults to filename)"},
                "id": {"type": "string", "description": "Optional stable ID for updating an existing image presentation"},
            },
            "required": ["path"],
        },
    },
    {
        "name": "export_presentation_to_image",
        "description": (
            "Render an existing presentation to a PNG file on disk and return the path. "
            "Uses headless chromium so the screenshot matches what the workspace UI "
            "shows pixel-for-pixel. Pair with the Agents Platform's Telegram delivery "
            "([[ATTACH: <path>]] marker) to ship visualisations to chat: "
            "create_presentation → export_presentation_to_image → attach the returned "
            "path. Defaults: 1280x800 @ 2x scale, full_page=True."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "presentation_id": {"type": "string", "description": "ID of an existing presentation (from create_presentation / list_presentations)."},
                "output_path": {"type": "string", "description": "Absolute path to write the PNG. Defaults to .data/presentation-exports/{id}-{ts}.png."},
                "width": {"type": "integer", "description": "Viewport width in CSS pixels. Default 1280."},
                "height": {"type": "integer", "description": "Viewport height in CSS pixels. Default 800."},
                "scale": {"type": "number", "description": "Device scale factor for retina output. Default 2."},
            },
            "required": ["presentation_id"],
        },
    },
    {
        "name": "commented_file",
        "description": "Display files with inline review comments in the AW UI presentation. Shows full file content with comment annotations at specific line ranges, styled like a code review document. Supports multiple files as tabs with multiple comments per file. Severity levels: error, warning, suggestion, info, comment, praise.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "files": {
                    "type": "array",
                    "description": "List of files with comments.",
                    "items": {
                        "type": "object",
                        "properties": {
                            "file_path": {"type": "string", "description": "Path to the file"},
                            "comments": {
                                "type": "array",
                                "description": "Comments to annotate on the file.",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "start": {"type": "integer", "description": "Start line number"},
                                        "end": {"type": "integer", "description": "End line number (same as start for single line)"},
                                        "text": {"type": "string", "description": "Comment text"},
                                        "severity": {"type": "string", "description": "Severity: error, warning, suggestion, info, comment, praise"},
                                        "author": {"type": "string", "description": "Comment author name (optional)"},
                                    },
                                    "required": ["start", "end", "text"],
                                },
                            },
                        },
                        "required": ["file_path", "comments"],
                    },
                },
                "id": {"type": "string", "description": "Optional presentation ID (defaults to 'code-review')"},
                "title": {"type": "string", "description": "Optional presentation title"},
            },
            "required": ["files"],
        },
    },
    {
        "name": "share_presentation",
        "description": "Generate a public share URL for a presentation (as a Telegram Mini App link). Returns {url, token, expires_at} — does NOT send to Telegram. Pass the returned url via a [[MINIAPP: <url>]] marker for the Agents Platform to deliver it. Use ttl_hours=0 for a link that never expires.",
        "inputSchema": {
            "type": "object",
            "required": ["presentation_id"],
            "properties": {
                "presentation_id": {"type": "string", "description": "ID of an existing presentation to share."},
                "ttl_hours": {"type": "number", "description": "Link lifetime in hours. Default: 24. Pass 0 for a permanent link that never expires."},
            },
        },
    },
]


async def handle_request(request: dict, *, store: PresentationStore, export_dir: str) -> dict | None:
    method = request.get("method", "")
    req_id = request.get("id")

    if method == "initialize":
        return {
            "jsonrpc": "2.0", "id": req_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "aw-presentation", "version": "2.0.0"},
            },
        }
    if method == "notifications/initialized":
        return None
    if method == "tools/list":
        return {"jsonrpc": "2.0", "id": req_id, "result": {"tools": TOOLS_SCHEMA}}

    if method != "tools/call":
        return {"jsonrpc": "2.0", "id": req_id, "error": {"code": -32601, "message": f"Unknown method: {method}"}}

    name = request.get("params", {}).get("name", "")
    args = request.get("params", {}).get("arguments", {}) or {}

    if name == "create_presentation":
        p = store.create(
            args["title"], args["html"], presentation_id=args.get("id"),
            visible=args.get("visible", True), session_id=args.get("session_id"),
            tags=args.get("tags"), silent=_silent_default(args),
        )
        tag_note = f" tags={p.tags}" if p.tags else ""
        return _ok(req_id, f"Presentation created: {p.id} ({p.title}){tag_note}")

    if name == "update_presentation":
        p = store.update(
            args["id"], title=args.get("title"), html=args.get("html"),
            tags=args.get("tags"), silent=_silent_default(args),
        )
        if p is None:
            return _err(req_id, f"Presentation not found: {args['id']}")
        return _ok(req_id, f"Presentation updated: {p.id}")

    if name == "delete_presentation":
        ok = store.delete(args["id"])
        if not ok:
            return _err(req_id, f"Presentation not found: {args['id']}")
        return _ok(req_id, f"Presentation deleted: {args['id']}")

    if name == "list_presentations":
        presentations = store.list_presentations()
        items = [f"- {p['id']}: {p['title']}" for p in presentations]
        text = f"{len(presentations)} presentations:\n" + "\n".join(items) if items else "No presentations"
        return _ok(req_id, text)

    if name == "show_image":
        file_path = args["path"]
        if not os.path.isfile(file_path):
            return _err(req_id, f"File not found: {file_path}")
        ext = os.path.splitext(file_path)[1].lower()
        mime = _MIME_MAP.get(ext, "image/png")
        with open(file_path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode()
        title = args.get("title") or os.path.basename(file_path)
        presentation_id = args.get("id") or f"img-{os.path.basename(file_path).replace('.', '-')}"
        html = f'''<!DOCTYPE html>
<html><head><style>
body {{ margin:0; background:#0a0a0f; display:flex; align-items:center; justify-content:center; height:100vh; overflow:auto; }}
img {{ max-width:100%; max-height:100vh; object-fit:contain; }}
</style></head><body>
<img src="data:{mime};base64,{b64}" alt="{title}" />
</body></html>'''
        p = store.create(title, html, presentation_id=presentation_id)
        return _ok(req_id, f"Image displayed: {p.id} ({title}, {len(b64)} bytes base64)")

    if name == "export_presentation_to_image":
        p = store.get(args["presentation_id"])
        if not p:
            return _err(req_id, f"Presentation not found: {args['presentation_id']}")
        os.makedirs(export_dir, exist_ok=True)
        output_path = args.get("output_path") or os.path.join(
            export_dir, f"{p.id}-{int(time.time())}.png")
        width = int(args.get("width") or 1280)
        height = int(args.get("height") or 800)
        scale = float(args.get("scale") or 2.0)
        from .. import routes as routes_mod
        try:
            await run_in_threadpool(routes_mod._render_html_to_png, p.html, output_path, width, height, scale)
        except Exception as exc:
            return _err(req_id, f"render failed: {exc}")
        size = os.path.getsize(output_path) if os.path.exists(output_path) else 0
        return _ok(req_id, f"Exported presentation {p.id} ({p.title}) to {output_path} ({size} bytes)")

    if name == "commented_file":
        files = args.get("files", [])
        if not files:
            return _err(req_id, "No files provided")
        html = generate_commented_file_html(files)
        presentation_id = args.get("id", "code-review")
        file_names = ", ".join(os.path.basename(f["file_path"]) for f in files)
        total_comments = sum(len(f.get("comments", [])) for f in files)
        title = args.get("title") or f"Review: {file_names}"
        p = store.create(title, html, presentation_id=presentation_id)
        return _ok(req_id, f"Review displayed: {p.id} ({len(files)} file{'s' if len(files) > 1 else ''}, {total_comments} comments)")

    if name == "share_presentation":
        presentation_id = args.get("presentation_id", "").strip()
        if not presentation_id:
            return _err(req_id, "presentation_id is required")
        if not store.get(presentation_id):
            return _err(req_id, f"Presentation not found: {presentation_id}")
        ttl_hours = args.get("ttl_hours")
        expires_in = None
        if ttl_hours:
            try:
                expires_in = float(ttl_hours) * 3600.0
            except (TypeError, ValueError):
                expires_in = None
        share = store.create_share_token(presentation_id, expires_in)
        # Same process as the server itself — its own published external URL
        # is just an env var read away, no cross-container resolution needed.
        base = os.environ.get("AW_WORKSPACE_API_URL", "").rstrip("/")
        url = f"{base}/api/apps/presentations/presentations/{presentation_id}/html?token={share['token']}"
        return _ok(req_id, json.dumps({
            "url": url, "token": share["token"], "expires_at": share.get("expires_at"),
        }, indent=2))

    return _err(req_id, f"Unknown tool: {name}")
