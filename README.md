# aw-app-presentations

Workspace app for creating, storing, sharing, and viewing HTML presentations
from Agentic Workspace.

## Features

- REST routes for presentation CRUD.
- WebSocket updates for live viewers.
- Share-token creation, listing, and revocation.
- Environment-derived task tags on presentation creation.
- Frontend source for the presentation nav and viewer window.

## Status

Backend routes and storage are implemented and covered by tests. The frontend
source is kept in `ui/src/` for packaging with the workspace UI host.

## Layout

- `aw-app.json` - manifest for the `presentations` app.
- `schemas/aw-app.schema.json` - local structural validator.
- `presentations_app/storage.py` - `PresentationStore`.
- `presentations_app/routes.py` - FastAPI sub-app with REST and WebSocket
  routes.
- `presentations_app/plugin.py` - plugin entrypoint.
- `ui/src/PresentationNav.jsx` - presentation navigation source.
- `ui/src/PresentationWindow.jsx` - presentation viewer source.
- `tests/validate_manifest.py` - manifest validation.
- `tests/test_storage_and_routes.py` - storage and route coverage.

## Testing

```bash
.venv/aw/bin/python tests/validate_manifest.py
.venv/aw/bin/python -m pytest tests/
```
