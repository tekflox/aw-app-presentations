---
repo: architecture
path: docs/architecture/aw-app-presentations.md
source: generated
edited: false
checksum: sha256:5e3898b809040b53d7315afd602af34fd50eab6bb024d1bf90fdd170a74f30dd
---
# Presentations

- **repo**: aw-app-presentations
- **layer**: app
- **technologies**: python, react
- **health** (derived): planned

HTML presentations created by agents (reports, diagrams, code reviews, images) — top-bar gallery nav + a window that renders each presentation. Replaces the monolith's /ws/presentations feature and the aw-frontend static PresentationNav. Diff viewing lives in the separate aw-app-diff-tool.

## Connections
- `db` → **postgres** — app-owned tables in the workspace schema
- `http` → **aw-workspace** — routes mounted at /api/apps/presentations
- `stdio-mcp` → **mcp-gateway** — MCP surface aggregated by the gateway

## MCP tools
- `commented_file`
- `create_presentation`
- `delete_presentation`
- `export_presentation_to_image`
- `list_presentations`
- `share_presentation`
- `show_image`
- `update_presentation`

## Requirements
_none documented_
