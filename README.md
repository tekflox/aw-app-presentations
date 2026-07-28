# aw-app-presentations

Decoupled app for aw-workspace, per the
[Decoupled Apps Framework ADR](https://github.com/tekflox/agentic-workspace/blob/main/docs/knowledge_base/docs/architecture/decoupled-apps-framework.md)
(`aw-app.json` manifest schema v1). Absorbs the monolith's Presentation
feature — agents create/update HTML presentations (diffs, reports,
dashboards) that show up live in the workspace UI — currently
`src/api/routes/presentation.py` (232 lines, `/ws/presentations` +
`/api/presentations/*`) in the `agentic-workspace` monolith, plus
`PresentationNav.jsx` (top-bar gallery, hover thumbnails) and
`PresentationWindow.jsx` (the viewer window) in `aw-frontend`.

Same pattern as `tekflox/aw-app-git`'s ongoing Repos/PRs migration
(`design:migrate-repos-github-into-aw-app-git`, run `18fc9a42`) — this app
consumes the same shared framework capability: app-registered backend
routes/WebSocket + app-contributed view/nav.

## Status: **backend + storage ported and tested; frontend/nav registration BLOCKED on a framework capability that does not exist yet**

Per the executor instructions on this card: when the framework piece isn't
there, scaffold what can be scaffolded and stop — don't fake the nav/WS
registration. Concretely:

### Done

- `presentations_app/storage.py` — `PresentationStore`, ported from the
  monolith's `PresentationManager` onto `ctx.db` (`db:own-tables`) instead
  of the monolith's own SQLModel/Postgres session. Rows live in this app's
  own tables (`app__presentations__records`, `app__presentations__shares`),
  isolated per ADR Decision 8. Same public shape (create/update/delete/get/
  list/share-tokens/broadcast).
- `presentations_app/routes.py` — the full REST surface + `WS /ws` (replaces
  `/ws/presentations`), ported to a plain FastAPI sub-app registered via
  `ctx.routes.register(...)` (mounted by the runtime at
  `/api/apps/presentations`). Protocol on the wire is unchanged
  (`presentation_init` / `presentation_update`), so a ported frontend needs
  no protocol changes, only a URL-base change once wired. Now includes the
  share-token `GET`/`DELETE` list/revoke endpoints and the `AW_TASK_ID`/
  `AW_TASK_RUN_ID` env-inherited auto-tags on create — both present in the
  monolith's `presentation.py`/`presentation_manager.py` but missing from
  the first port (2026-07-28 parity fix).
- `presentations_app/plugin.py` — `PresentationsAppPlugin` entrypoint.
- `ui/src/PresentationNav.jsx`, `ui/src/PresentationWindow.jsx` — ported
  **verbatim** (byte-identical logic) from `aw-frontend/src/components/`,
  staged here as the source for the eventual `ui:code` component bundle
  (F6d pattern). **Not yet wired into a buildable plugin package** — see
  Blocked below.
- `aw-app.json` — declares the target end-state manifest (`routes:register`,
  `db:own-tables`, `ui:code`, `ui:slots:core.nav`, `contributes.nav` with
  `section: "top"`, `contributes.frontend.mode: "component"`) matching
  where the F6 ADR says this class of app is headed. Validates against
  `schemas/aw-app.schema.json`.
- Tests: `tests/test_storage_and_routes.py` (6 tests, real `FastAPI
  TestClient` against an in-memory-sqlite fake `ctx.db` — CRUD, HTML-with-
  share-token, WS init/broadcast, share list/revoke, env-inherited tags) +
  `tests/validate_manifest.py`. All passing
  (`.venv/aw/bin/python -m pytest tests/` → `6 passed`).

### Blocked — the missing framework piece

**Capability 2 of the F6 ADR — app-contributed view + nav in the SPA — is
not wired into the live `aw-frontend` shell.** Confirmed by reading the
code, not just the ADR: `aw-frontend/src/App.jsx` never calls
`installPluginHost()` or `fetchContributions()`, and no `<AppSlot>` renders
anywhere outside `apps/__tests__`. The library (`aw-frontend/src/apps/`:
`slotRegistry`, `pluginHost`, `loadPlugin`, `AppSlot`, `appsApi`) exists and
is unit-tested, but it is inert in the running app — even `aw-app-git`'s
existing declarative `nav`/`windows` entries don't render today.

On top of that, the parent ADR
(`docs/knowledge_base/docs/architecture/decoupled-apps-f6-repos-prs-migration.md`)
that specifies exactly this capability is still
**`Status: Proposed (awaiting Frederico's approval — do not implement
before approval)`** — so even if this app's job were to wire `App.jsx`
itself, that ADR explicitly says not to build it pre-approval.

Concretely, this blocks:

- Registering the "Presentation" top-bar nav item as an app contribution
  (would need `<AppSlot slot="core.nav" />` rendered in the shell, which
  isn't there).
- Shipping `ui/dist/presentations-ui.mjs` as a real component bundle —
  no point building it before there's a host to load it into. `ui/src/*`
  is kept as the ported source, ready to become a Vite lib build once F6b
  (SPA wiring) ships.
- **Removing the static `PresentationNav.jsx` / `PresentationWindow.jsx`
  from `aw-frontend`** — deliberately **not done** in this card. Removing
  the only working path to Presentations with no framework replacement
  live would break the feature for users, which the executor instructions
  explicitly say not to fake. Do this in the same follow-up as F6b, once
  `<AppSlot core.nav/>` actually renders app-contributed nav entries.
- The monolith's `src/api/routes/presentation.py` stays as-is for now too,
  same reasoning as F6e's "legacy monolith dashboard stays frozen until
  strangled" — it's what aw-frontend/the legacy dashboard currently talk
  to; nothing consumes `/api/apps/presentations/*` yet.

**What would unblock this app specifically** (once F6/Capability 2 ships,
approval permitting): wire `App.jsx`'s `installPluginHost()` +
`fetchContributions()` + `<AppSlot slot="core.nav"/>` in the top bar, build
`ui/` into a real Vite lib bundle exporting `register(host)` (mirrors F6d's
plan for `git-ui.mjs`), bump this app's `frontend.bundle` version, then
remove the static `PresentationNav.jsx`/`PresentationWindow.jsx` from
`aw-frontend` and the monolith route once nothing points at them anymore.

## The `aw-presentation` MCP nuance (mapped, not resolved)

`src/mcp/presentation-server.py` (stdio MCP, tools:
`create_presentation`/`update_presentation`/`delete_presentation`/
`list_presentations`/`show_diff`/`commented_file`/`show_image`/
`export_presentation_to_image`/`share_presentation`) is how agents create
presentations today. It talks HTTP to **awserv** (the monolith control
plane) at a fixed base URL + API key (`_get_api_key()` reads it fresh each
time so it survives awserv restarts) — i.e. it writes into the monolith's
`PresentationManager`/Postgres, not into any per-workspace store.

Once (if) the presentation *store* itself lives inside an aw-workspace app
instead of the monolith, the MCP has two audiences that don't map onto
today's single fixed base URL:

1. **Monolith-only agents** (the common case today — Claude Code sessions,
   Agents Platform runs, this very session) have no notion of "which BYOD
   workspace" — they're not scoped to one. Pointing the MCP at a
   *workspace's* `/api/apps/presentations/*` instead of awserv's own
   `/api/presentations/*` would require the MCP to pick a target workspace,
   which doesn't exist as a concept for this class of caller.
2. **A workspace-scoped agent** (one actually running with
   `cwd`/context tied to one BYOD workspace) *could* target that
   workspace's own `/api/apps/presentations/*` — but the MCP has no such
   mode today, and per-workspace auth (the IdentityGuard gap above) isn't
   solved either.

**Proposal (for coordination with the F6/framework design, not implemented
here):** keep `aw-presentation` MCP → **monolith** `PresentationManager` as
the default/only path for now (audience 1 covers effectively every current
caller). If/when a workspace-scoped agent story exists, that's the natural
point to either (a) give the MCP a `workspace_base_url` override, or
(b) — cleaner — have workspace-scoped agents get a *different*,
workspace-local presentation MCP pointed at `/api/apps/presentations/*`
instead of trying to make one MCP dynamically target either plane. Either
way this is bigger than one app's migration and belongs in the F6/framework
design track, not decided unilaterally here — flagging it on the Kanban
card per the "PARE e reporte" instruction rather than picking silently.

## Layout

- `aw-app.json` — manifest (id `presentations`, tier `inprocess`).
- `schemas/aw-app.schema.json` — local structural validator (same
  stand-in copy `aw-app-git` uses).
- `presentations_app/storage.py` — `PresentationStore` (ctx.db-backed).
- `presentations_app/routes.py` — FastAPI sub-app (REST + `WS /ws`).
- `presentations_app/plugin.py` — `PresentationsAppPlugin` entrypoint.
- `ui/src/PresentationNav.jsx`, `ui/src/PresentationWindow.jsx` — ported
  frontend source, not yet built into a plugin bundle (blocked, see above).
- `tests/validate_manifest.py`, `tests/test_storage_and_routes.py`.
