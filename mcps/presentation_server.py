"""MCP server for aw-app-presentations — lets an agent create/update HTML
visualizations in the AW UI.

Ported from agentic-workspace's src/mcp/presentation-server.py (2026-08-08)
onto this app's own tree, following the aw-app-devctl / aw-app-mcp-tools
concept: the gateway that federates this Telegram bot session's tools
(``aw-app-mcp-gateway``) scans each *installed app's own* root ``mcp.json``
and spawns whatever it declares — it does NOT read agentic-workspace's
``src/config/mcp.json`` (that's the separate, monolith-core gateway). The
original script only ever showed up on that other gateway, so it was
structurally invisible here no matter how correct its HTTP calls were.

Dropped in the port (monolith-only concepts that don't apply once this
lives inside the app's own repo):
  * ``_task_env.merge_tags`` import — inlined below (it was already a tiny,
    dependency-free helper; only the import path was monolith-specific).
  * ``.tmp/awserv_api_key`` file lookup / ``x-api-key`` header — this app's
    own mounted routes are unauthenticated on the current framework (see
    presentations_app/routes.py's module docstring re: the IdentityGuard
    gap), so there's nothing to authenticate against yet.
  * ``from src.config import get_aw_domain, get_config`` for the public
    share URL — replaced with the ``AW_PUBLIC_URL`` env var, since this
    process no longer has the monolith's package tree on its path.

Kept identical: the tool surface (same 8 tools, same schemas, same
namespace-scoping hook for a future curated gateway profile) and the HTTP
calls into this app's own mounted routes (``/api/apps/presentations/...``),
since that part isn't a monolith concept — it's just this app's own API.

Run: ``python -m mcps.presentation_server`` (stdio). Registered via this
repo's root ``mcp.json`` — the gateway spawns it with cwd set to the app
root, so ``mcps.commented_file`` imports cleanly.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.request

AWSERV_URL = os.environ.get("AWSERV_URL", "http://127.0.0.1:9123")
_APP_PREFIX = "/api/apps/presentations"


def _inherited_tags() -> list[str]:
    """['task:<id>', 'run:<id>'] for whichever AW_TASK_* breadcrumbs are set.

    Ported from agentic-workspace's src/mcp/_task_env.py — same sidecar-file
    contract (AW_TASK_RUN_FILE is rewritten per run by the task spawner;
    AW_TASK_ID stays constant), no monolith imports required.
    """
    tags: list[str] = []
    tid = os.environ.get("AW_TASK_ID")
    if tid:
        tags.append(f"task:{tid}")

    run_id = None
    run_file = os.environ.get("AW_TASK_RUN_FILE")
    if run_file:
        try:
            with open(run_file) as f:
                run_id = f.read().strip() or None
        except OSError:
            run_id = None
    run_id = run_id or os.environ.get("AW_TASK_RUN_ID")
    if run_id:
        tags.append(f"run:{run_id}")
    return tags


def merge_tags(caller_tags) -> list[str]:
    """Caller tags first, then env-inherited ones; dedup, drop empties.

    Even an explicit ``[]`` from the caller still gets the env tags merged
    in — only a caller that never invokes this at all ends up with none.
    """
    seen: dict[str, None] = {}
    for t in (list(caller_tags or []) + _inherited_tags()):
        if t is None:
            continue
        s = str(t).strip()
        if not s:
            continue
        seen.setdefault(s, None)
    return list(seen.keys())


def _api(method, path, body=None):
    """Make an HTTP request to this app's own mounted sub-app."""
    url = f"{AWSERV_URL}{_APP_PREFIX}{path}"
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"} if data else {}
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.loads(resp.read())
    except Exception as e:
        return {"error": str(e), "success": False}


def _ns_tag(namespace: str) -> str:
    return f"namespace:{namespace}"


def _apply_namespace(body: dict, namespace: str | None) -> dict:
    """Force `namespace:<ns>` into body['tags'] before a create/update call.
    Injected by a curated gateway profile — the caller never sees or
    controls it, so a scoped profile cannot create/relabel a presentation
    outside its scope."""
    if not namespace:
        return body
    tags = list(body.get("tags") or [])
    tag = _ns_tag(namespace)
    if tag not in tags:
        tags.append(tag)
    body["tags"] = tags
    return body


def _check_owned(presentation_id: str, namespace: str | None) -> str | None:
    """Return an error message if `namespace` is set and the presentation
    exists but lacks the matching namespace tag. Returns None (allowed) if
    unscoped, or if the presentation doesn't exist yet (fresh create)."""
    if not namespace:
        return None
    existing = _api("GET", f"/presentations/{presentation_id}")
    if not existing.get("id"):
        return None  # doesn't exist yet — a scoped create will tag it below
    if _ns_tag(namespace) not in (existing.get("tags") or []):
        return f"Presentation '{presentation_id}' is not in your namespace ('{namespace}')."
    return None


def handle_request(request: dict) -> dict:
    method = request.get("method", "")
    req_id = request.get("id")

    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "aw-presentation", "version": "1.0.0"},
            },
        }

    if method == "notifications/initialized":
        return None

    if method == "tools/list":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "tools": [
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
                                    "description": "Optional tag list (e.g. ['kind:summary', 'topic:churn']). Convention: 'key:value' strings. The server auto-stamps task:<id> and run:<id> when AW_TASK_ID/AW_TASK_RUN_ID are set in the environment.",
                                },
                                "silent": {
                                    "type": "boolean",
                                    "description": "If true, the presentation is created and shown in the Presentation menu but does NOT auto-pop up in the UI. Default is false (auto-opens). When this MCP runs inside a task (AW_TASK_ID is set), silent defaults to true so background tasks don't yank the user's view — pass silent=false explicitly to override.",
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
                                    "description": "If true, the UI updates the presentation in place but does NOT re-open / re-focus the window. Default false (re-opens, matching previous behavior). Inside a task (AW_TASK_ID set) the default flips to true.",
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
                            "properties": {
                                "id": {"type": "string", "description": "The presentation ID to delete"},
                            },
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
                            "path. Defaults: 1280x800 @ 2x scale, "
                            "full_page=True (taller content extends below the viewport)."
                        ),
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "presentation_id": {"type": "string", "description": "ID of an existing presentation (from create_presentation / list_presentations)."},
                                "output_path": {"type": "string", "description": "Absolute path to write the PNG. Defaults to .tmp/presentation-exports/{id}-{ts}.png."},
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
                        "description": "Generate a public share URL for a presentation (as a Telegram Mini App link). Returns {url, share_id, expires_at} — does NOT send to Telegram. Pass the returned url via a [[MINIAPP: <url>]] marker for the Agents Platform to deliver it. Use ttl_hours=0 for a link that never expires.",
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
            },
        }

    if method == "tools/call":
        tool_name = request.get("params", {}).get("name", "")
        args = request.get("params", {}).get("arguments", {})
        # Injected by a curated gateway profile (never present on a
        # legitimate client-authored call), if/when this gateway grows the
        # same per-profile scoping the monolith-core one had.
        namespace = args.get("_gateway_presentation_namespace")

        if tool_name == "create_presentation":
            presentation_id = args.get("id")
            visible = args.get("visible", True)
            session_id = args.get("session_id")
            # Always merge AW_TASK_ID/AW_TASK_RUN_ID env tags onto the caller's
            # list. If the caller passed nothing, this still produces task: tags
            # when we're inside a task; if they passed [], we still merge —
            # explicit empty lists shouldn't strip the task breadcrumb.
            tags = merge_tags(args.get("tags"))
            # silent: explicit caller value wins. If unspecified, default to
            # True when running inside a task (AW_TASK_ID set) so background
            # work doesn't disrupt the user's view; False otherwise.
            silent = args.get("silent")
            if silent is None:
                silent = bool(os.environ.get("AW_TASK_ID"))
            else:
                silent = bool(silent)
            if presentation_id:
                err = _check_owned(presentation_id, namespace)
                if err:
                    return _tool_result(req_id, err, is_error=True)
                existing = _api("GET", f"/presentations/{presentation_id}")
                if existing.get("id"):
                    update_body = {
                        "title": args.get("title"),
                        "html": args.get("html"),
                    }
                    if not visible:
                        update_body["visible"] = False
                    if session_id:
                        update_body["session_id"] = session_id
                    if tags:
                        # Merge with existing tags so prior task: stamps survive.
                        existing_tags = list(existing.get("tags") or [])
                        merged = list(dict.fromkeys(existing_tags + tags))
                        update_body["tags"] = merged
                    if silent:
                        update_body["silent"] = True
                    if "tags" in update_body:
                        _apply_namespace(update_body, namespace)
                    result = _api("PUT", f"/presentations/{presentation_id}", update_body)
                    return _tool_result(req_id, f"Presentation updated: {presentation_id} ({result.get('title', '')})")

            body = {
                "title": args["title"],
                "html": args["html"],
            }
            if presentation_id:
                body["id"] = presentation_id
            if not visible:
                body["visible"] = False
            if session_id:
                body["session_id"] = session_id
            if tags:
                body["tags"] = tags
            if silent:
                body["silent"] = True
            _apply_namespace(body, namespace)
            result = _api("POST", "/presentations", body)
            stamped = result.get("tags") or []
            tag_note = f" tags={stamped}" if stamped else ""
            silent_note = " (silent)" if silent else ""
            return _tool_result(req_id, f"Presentation created: {result.get('id', '')} ({result.get('title', '')}){tag_note}{silent_note}")

        if tool_name == "update_presentation":
            err = _check_owned(args["id"], namespace)
            if err:
                return _tool_result(req_id, err, is_error=True)
            body = {}
            if "title" in args:
                body["title"] = args["title"]
            if "html" in args:
                body["html"] = args["html"]
            if "tags" in args:
                body["tags"] = args["tags"]
            # Same silent rule as create_presentation: explicit value wins, else
            # auto-default True inside a task.
            silent = args.get("silent")
            if silent is None:
                silent = bool(os.environ.get("AW_TASK_ID"))
            else:
                silent = bool(silent)
            if silent:
                body["silent"] = True
            # Only force the namespace tag back in if this call is already
            # touching tags — an update that doesn't mention tags leaves the
            # server-side list (which already carries the tag) untouched.
            if "tags" in body:
                _apply_namespace(body, namespace)
            result = _api("PUT", f"/presentations/{args['id']}", body)
            if result.get("success"):
                return _tool_result(req_id, f"Presentation updated: {args['id']}{' (silent)' if silent else ''}")
            return _tool_result(req_id, f"Error: {result.get('error', 'unknown')}", is_error=True)

        if tool_name == "delete_presentation":
            err = _check_owned(args["id"], namespace)
            if err:
                return _tool_result(req_id, err, is_error=True)
            _api("DELETE", f"/presentations/{args['id']}")
            return _tool_result(req_id, f"Presentation deleted: {args['id']}")

        if tool_name == "list_presentations":
            presentations = _api("GET", "/presentations")
            if isinstance(presentations, list):
                if namespace:
                    presentations = [p for p in presentations if _ns_tag(namespace) in (p.get("tags") or [])]
                items = [f"- {c['id']}: {c['title']}" for c in presentations]
                text = f"{len(presentations)} presentations:\n" + "\n".join(items) if items else "No presentations"
            else:
                text = "No presentations"
            return _tool_result(req_id, text)

        if tool_name == "export_presentation_to_image":
            err = _check_owned(args["presentation_id"], namespace)
            if err:
                return _tool_result(req_id, err, is_error=True)
            body = {}
            for k in ("output_path", "width", "height", "scale"):
                if k in args:
                    body[k] = args[k]
            result = _api("POST", f"/presentations/{args['presentation_id']}/export", body)
            if result.get("success"):
                return _tool_result(
                    req_id,
                    f"Exported presentation {result.get('presentation_id')} ({result.get('title', '')}) "
                    f"to {result.get('path')} ({result.get('size_bytes', 0)} bytes)",
                )
            return _tool_result(req_id, f"Error: {result.get('detail') or result.get('error', 'unknown')}", is_error=True)

        if tool_name == "show_image":
            import base64
            file_path = args["path"]
            if not os.path.isfile(file_path):
                return _tool_result(req_id, f"File not found: {file_path}", is_error=True)
            ext = os.path.splitext(file_path)[1].lower()
            mime_map = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".svg": "image/svg+xml", ".webp": "image/webp", ".bmp": "image/bmp"}
            mime = mime_map.get(ext, "image/png")
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
            err = _check_owned(presentation_id, namespace)
            if err:
                return _tool_result(req_id, err, is_error=True)
            existing = _api("GET", f"/presentations/{presentation_id}")
            if existing.get("id"):
                update_body = {"title": title, "html": html}
                if namespace:
                    update_body["tags"] = list(dict.fromkeys(list(existing.get("tags") or []) + [_ns_tag(namespace)]))
                result = _api("PUT", f"/presentations/{presentation_id}", update_body)
            else:
                result = _api("POST", "/presentations", _apply_namespace({"title": title, "html": html, "id": presentation_id}, namespace))
            return _tool_result(req_id, f"Image displayed: {presentation_id} ({title}, {len(b64)} bytes base64)")

        if tool_name == "commented_file":
            from mcps.commented_file import generate_commented_file_html

            files = args.get("files", [])
            if not files:
                return _tool_result(req_id, "No files provided", is_error=True)

            html = generate_commented_file_html(files)
            presentation_id = args.get("id", "code-review")
            file_names = ", ".join(os.path.basename(f["file_path"]) for f in files)
            total_comments = sum(len(f.get("comments", [])) for f in files)
            title = args.get("title") or f"Review: {file_names}"

            existing = _api("GET", f"/presentations/{presentation_id}")
            if existing.get("id"):
                _api("PUT", f"/presentations/{presentation_id}", {"title": title, "html": html})
            else:
                _api("POST", "/presentations", {"title": title, "html": html, "id": presentation_id})

            return _tool_result(
                req_id,
                f"Review displayed: {presentation_id} ({len(files)} file{'s' if len(files) > 1 else ''}, {total_comments} comments)"
            )

        if tool_name == "share_presentation":
            presentation_id = args.get("presentation_id", "").strip()
            if not presentation_id:
                return _tool_result(req_id, "presentation_id is required", is_error=True)
            err = _check_owned(presentation_id, namespace)
            if err:
                return _tool_result(req_id, err, is_error=True)
            # POST /api/apps/presentations/presentations/{id}/share -> {token, expires_at}
            # GET  /api/apps/presentations/presentations/{id}/html?token=…  (public, no JWT)
            # ttl_hours 0/None means a permanent link (never expires).
            ttl_hours = args.get("ttl_hours")
            expires_in = None
            if ttl_hours:
                try:
                    expires_in = float(ttl_hours) * 3600.0
                except (TypeError, ValueError):
                    expires_in = None
            resp = _api("POST", f"/presentations/{presentation_id}/share",
                        {"expires_in": expires_in})
            if resp.get("error") or not resp.get("success"):
                return _tool_result(req_id, f"Failed to create share link: {resp}", is_error=True)
            token = resp.get("token", "")
            # No monolith src.config here — a decoupled app doesn't have that
            # package tree on its path. AW_PUBLIC_URL is the app-framework
            # equivalent; an empty base still returns a valid path-only URL.
            base = os.environ.get("AW_PUBLIC_URL", "").rstrip("/")
            url = f"{base}{_APP_PREFIX}/presentations/{presentation_id}/html?token={token}"
            return _tool_result(
                req_id,
                json.dumps({
                    "url": url,
                    "token": token,
                    "expires_at": resp.get("expires_at"),
                }, indent=2)
            )

        return _tool_result(req_id, f"Unknown tool: {tool_name}", is_error=True)

    return {"jsonrpc": "2.0", "id": req_id, "error": {"code": -32601, "message": f"Unknown method: {method}"}}


def _tool_result(req_id, text: str, is_error: bool = False) -> dict:
    return {
        "jsonrpc": "2.0",
        "id": req_id,
        "result": {
            "content": [{"type": "text", "text": text}],
            "isError": is_error,
        },
    }


def main():
    """stdio MCP server loop."""
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            request = json.loads(line)
        except json.JSONDecodeError:
            continue

        response = handle_request(request)
        if response is not None:
            sys.stdout.write(json.dumps(response) + "\n")
            sys.stdout.flush()


if __name__ == "__main__":
    main()
