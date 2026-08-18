// Integrated-mode entrypoint — dynamic-imported by aw-workspace-ui's
// loadComponentPlugin() once this app is installed with "ui:code" +
// "ui:slots:core.nav" granted. Built by `npm run build` -> ui/dist/
// presentations-ui.mjs, referenced from aw-app.json's
// contributes.frontend.bundle. Same register(host)/JSX-factory pattern as
// aw-app-whiteboard/aw-app-tasks's plugin.jsx — see those for the full
// explanation of host.h/host.React closures and the "one shared React
// instance" ADR.
//
// Owns BOTH contributions this app makes to the SPA (2026-08-05 decision:
// aw-workspace-ui carries zero app-specific window/nav logic):
//
// 1. PresentationsNavSlot -> core.nav (the TOP-BAR "Presentation" button +
//    hover gallery — a DIFFERENT slot than Whiteboard/Tasks's
//    core.nav.workspace, matching this app's existing manifest declaration
//    and its historically top-level placement, not tucked inside the
//    Workspace popover). Owns the standing WebSocket (create/update/delete
//    push), the presentation list state, and exposes
//    window.__awOpenPresentation(id) — the cross-app global hook
//    aw-app-whiteboard's and aw-app-tasks's own GeneratedAssets/nav code
//    already call to jump to a presentation from elsewhere.
//
// 2. PresentationWindowBody -> core.window.body:presentations.viewer. Unlike
//    Whiteboard/Tasks (one static window), Presentations opens MANY windows
//    at once — one per presentation id. This uses the 2026-08-05 framework
//    addition: window.__awOpenAppWindow(windowId, instanceId, title) keys
//    the window as `appwin:<windowId>:<instanceId>` instead of the bare
//    singleton `appwin:<windowId>`, so each instance gets its own
//    open/close/maximize/z-order state for free. BasicWindow.jsx passes
//    `instanceId` (here: the presentation id) and `onTitleChange` (so a
//    rename here updates the window's OWN chrome title, not just the body)
//    down as props to this component — see BasicWindow.jsx's header
//    comment. Each window body fetches its OWN presentation record by id
//    (GET /presentations/{id}) rather than sharing state with the nav's
//    list — simplest thing that works given slotted components don't share
//    a React tree — and refreshes on the same 'aw-presentation-update'
//    DOM CustomEvent the nav already dispatches (also consumed by
//    aw-app-whiteboard/aw-app-tasks's own GeneratedAssets refresh — this
//    app is the one that originates that broadcast).

import { toPng } from 'html-to-image';

export function register(host) {
  const { useState, useRef, useCallback, useEffect } = host.React;

  // The width a presentation is *previewed* at, shared with PNG export's
  // 1280px default (routes.py / mcp/http_handler.py) so a thumbnail and an
  // exported image are the same picture. It used to be three unreconciled
  // numbers — 1000x650 here, 1280x800 for export, 1000x700 for the pop-out —
  // none of them documented.
  //
  // Deliberately a desktop-ish fixed width, NOT the device width: a preview
  // should show the desktop look, and a constant aspect ratio is what keeps
  // the gallery grid from going ragged. 832 preserves the 1.538 ratio the
  // gallery has always had, so this is a rename, not a relayout.
  const REFERENCE_WIDTH = 1280;
  const REFERENCE_HEIGHT = 832;

  // ------------------------------------------------------------------
  // 1. Nav entry (top bar) + standing WS + global open-by-id hook
  // ------------------------------------------------------------------
  function PresentationsNavSlot() {
    const [presentations, setPresentations] = useState([]);
    const [open, setOpen] = useState(false);
    const closeTimer = useRef(null);

    const openPresentation = useCallback((id, title) => {
      window.__awOpenAppWindow?.('presentations.viewer', id, title);
    }, []);

    useEffect(() => {
      window.__awOpenPresentation = (id) => {
        const p = presentations.find((c) => c.id === id);
        openPresentation(id, p?.title);
      };
      return () => { delete window.__awOpenPresentation; };
    }, [presentations, openPresentation]);

    useEffect(() => {
      let ws, reconnectTimer, closed = false;
      const connect = () => {
        try {
          ws = new WebSocket(host.app.wsUrl('/ws'));
          ws.onmessage = (event) => {
            let msg;
            try { msg = JSON.parse(event.data); } catch { return; }
            if (msg.type === 'presentation_init') {
              setPresentations(msg.presentations || []);
              return;
            }
            if (msg.type !== 'presentation_update') return;
            // Broadcast for cross-app consumers (aw-app-whiteboard's /
            // aw-app-tasks's own GeneratedAssets refresh) AND for this
            // app's own open window bodies to self-refresh/self-close.
            try { window.dispatchEvent(new CustomEvent('aw-presentation-update', { detail: msg })); } catch {}
            if (msg.action === 'create') {
              setPresentations((prev) => [...prev.filter((c) => c.id !== msg.presentation.id), msg.presentation]);
              // Auto-open the new presentation unless visible=false
              // (thumbnail-only) or silent=true (background-task hint —
              // show in the gallery, don't yank the user's current view).
              if (msg.presentation.visible !== false && !msg.silent) {
                openPresentation(msg.presentation.id, msg.presentation.title);
              }
            } else if (msg.action === 'update') {
              setPresentations((prev) => prev.map((c) => (c.id === msg.presentation.id ? msg.presentation : c)));
            } else if (msg.action === 'delete') {
              setPresentations((prev) => prev.filter((c) => c.id !== msg.id));
            }
          };
          ws.onclose = () => { if (!closed) reconnectTimer = setTimeout(connect, 5000); };
          ws.onerror = () => { try { ws.close(); } catch {} };
        } catch {
          if (!closed) reconnectTimer = setTimeout(connect, 5000);
        }
      };
      connect();
      return () => {
        closed = true;
        clearTimeout(reconnectTimer);
        if (ws) { ws.onclose = null; try { ws.close(); } catch {} }
      };
    }, [openPresentation]);

    const handleEnter = useCallback(() => { clearTimeout(closeTimer.current); setOpen(true); }, []);
    const handleLeave = useCallback(() => {
      clearTimeout(closeTimer.current);
      closeTimer.current = setTimeout(() => setOpen(false), 150);
    }, []);
    useEffect(() => () => clearTimeout(closeTimer.current), []);

    const deletePresentation = useCallback(async (id) => {
      await host.sdk.api.fetch(host.app.apiUrl(`/presentations/${id}`), { method: 'DELETE' });
    }, []);

    const sorted = [...presentations].sort((a, b) => (b.created_at || 0) - (a.created_at || 0));

    return (
      <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="px-3 py-1 text-xs rounded transition-colors cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5"
        >
          Presentation
          {sorted.length > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center min-w-[16px] h-[16px] rounded-full text-[9px] font-bold px-1 bg-[var(--color-accent)]/20 text-[var(--color-accent)]">
              {sorted.length}
            </span>
          )}
        </button>

        {open && (
          <div
            className="absolute left-0 top-full mt-2 z-50 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-2xl p-3"
            style={{ minWidth: 320, maxWidth: 720 }}
          >
            {sorted.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-[var(--color-text-muted)] italic">
                No presentations yet. Use <code className="bg-white/10 px-1 rounded">/aw-presentation</code> to create one.
              </div>
            ) : (
              <>
                <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2 px-1">
                  Presentations · newest first
                </div>
                <div
                  className="grid gap-2 overflow-y-auto"
                  style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', maxHeight: '70vh' }}
                >
                  {sorted.map((c) => (
                    <PresentationThumbnail
                      key={c.id}
                      presentation={c}
                      onClick={() => { setOpen(false); openPresentation(c.id, c.title); }}
                      onDelete={() => deletePresentation(c.id)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  function PresentationThumbnail({ presentation, onClick, onDelete }) {
    const wrapperRef = useRef(null);
    const [scale, setScale] = useState(0.16);
    const REAL_W = REFERENCE_WIDTH;
    const REAL_H = REFERENCE_HEIGHT;
    const ASPECT = REAL_H / REAL_W;

    useEffect(() => {
      const el = wrapperRef.current;
      if (!el || typeof ResizeObserver === 'undefined') return;
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const w = entry.contentRect.width;
          if (w > 0) setScale(w / REAL_W);
        }
      });
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    const created = presentation.created_at
      ? new Date(presentation.created_at * 1000).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '';

    return (
      <div
        onClick={onClick}
        className="group relative rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] overflow-hidden cursor-pointer hover:border-[var(--color-accent)] transition-colors"
        title={presentation.title}
      >
        <div
          ref={wrapperRef}
          className="relative bg-[var(--color-bg-primary)]"
          style={{ width: '100%', paddingTop: `${ASPECT * 100}%`, overflow: 'hidden' }}
        >
          <iframe
            src={host.app.absoluteApiUrl(`/presentations/${presentation.id}/html`)}
            sandbox="allow-same-origin"
            tabIndex={-1}
            aria-hidden
            style={{
              position: 'absolute', top: 0, left: 0,
              width: REAL_W, height: REAL_H, border: 0,
              pointerEvents: 'none',
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          />
        </div>
        <div className="px-2 py-1.5 border-t border-[var(--color-border)]">
          <div className="text-[11px] font-medium text-[var(--color-text-primary)] truncate">
            {presentation.title || 'Untitled'}
          </div>
          {Array.isArray(presentation.tags) && presentation.tags.length > 0 && (
            <div className="flex flex-wrap gap-0.5 mt-0.5 overflow-hidden" style={{ maxHeight: 18 }}>
              {presentation.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="text-[8px] font-mono leading-none px-1 py-[2px] rounded bg-white/5 border border-white/10 text-[var(--color-text-muted)] truncate"
                  title={tag}
                >
                  {tag}
                </span>
              ))}
              {presentation.tags.length > 4 && (
                <span
                  className="text-[8px] leading-none px-1 py-[2px] text-[var(--color-text-muted)]"
                  title={presentation.tags.slice(4).join(', ')}
                >
                  +{presentation.tags.length - 4}
                </span>
              )}
            </div>
          )}
          {created && (
            <div className="text-[9px] text-[var(--color-text-muted)] truncate mt-0.5">{created}</div>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="hidden group-hover:flex absolute top-1 right-1 items-center justify-center w-5 h-5 rounded bg-black/60 text-white/80 hover:text-[var(--color-danger)] hover:bg-black/80"
          title="Delete presentation"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // 2. Window body — one per open presentation (instanceId = presentation id)
  // ------------------------------------------------------------------
  // The viewer's buttons live in the HOST's title bar
  // (core.window.titlebar:presentations.viewer) and its content in the body
  // slot below — SIBLING contributions, not parent/child. They used to be one
  // component drawing its own full-width header above the iframe, which put a
  // second title bar under the host's: the presentation title twice, a
  // Maximize button twice, and ~38px of viewer height gone. Same fix the
  // whiteboard app already made.
  //
  // Export-as-PNG reads the body's <iframe> document, so the body publishes
  // its element here and the actions read it back, keyed by windowKey (one
  // entry per open presentation — this window is multi-instance).
  const iframesByWindow = new Map();

  // The narrow-screen breakpoint. Same 640px the server-side fallback net
  // (presentations_app/normalize.py), the authoring template
  // (skills/aw-presentation/SKILL.md) and commented_file.py's CSS use.
  const NARROW_WIDTH = 640;

  // Every action this app offers on a presentation, in ONE place.
  //
  // They are rendered from two: the host title bar (PresentationWindowActions)
  // and — because the mobile workspace shell renders the body slot but never
  // the titlebar slot, leaving a phone user with no Share/Export/Rename/
  // Pop-out/Delete at all — a narrow-screen sheet owned by the body. Two
  // copies of the export fallback chain would drift, so there is one.
  function usePresentationActions(presentationId, windowKey, { onClose, onTitleChange } = {}) {
    const [presentation, setPresentation] = useState(null);
    const [shareLoading, setShareLoading] = useState(false);
    const [shareLink, setShareLink] = useState(null);
    const [shareCopied, setShareCopied] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [exportError, setExportError] = useState(null);

    const load = useCallback(async () => {
      if (!presentationId) return;
      try {
        const r = await host.sdk.api.fetch(host.app.apiUrl(`/presentations/${presentationId}`));
        const data = await r.json();
        if (data?.success === false) return;
        setPresentation(data);
      } catch {}
    }, [presentationId]);

    useEffect(() => { load(); }, [load]);

    // Refresh (or self-close on delete) when the nav's WS pushes a change
    // for this exact presentation.
    useEffect(() => {
      const handler = (e) => {
        const msg = e.detail;
        if (!msg || msg.type !== 'presentation_update') return;
        if (msg.action === 'delete' && msg.id === presentationId) {
          onClose?.();
        } else if ((msg.action === 'update' || msg.action === 'create') && msg.presentation?.id === presentationId) {
          setPresentation(msg.presentation);
        }
      };
      window.addEventListener('aw-presentation-update', handler);
      return () => window.removeEventListener('aw-presentation-update', handler);
    }, [presentationId, onClose]);

    // Absolute URL required — <iframe src> and window.open() are resolved
    // directly by the browser, bypassing the fetch/XHR-only apiBase.js
    // rewrite shim a relative path depends on.
    const htmlUrl = presentationId ? host.app.absoluteApiUrl(`/presentations/${presentationId}/html`) : null;

    const downloadDataUrl = useCallback((dataUrl) => {
      const link = document.createElement('a');
      link.download = `${(presentation?.title || 'presentation').replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    }, [presentation?.title]);

    const handleExport = useCallback(async () => {
      setExportError(null);
      setExportLoading(true);
      try {
        // Client-side first: instant, no server round-trip, works even if
        // the server has no playwright/chromium installed. Only fails when
        // the iframe's content is cross-origin (contentDocument comes back
        // null/inaccessible) or html-to-image itself chokes on the DOM.
        const doc = iframesByWindow.get(windowKey)?.contentDocument;
        if (doc && doc.body) {
          const dataUrl = await toPng(doc.documentElement, {
            backgroundColor: '#111318', pixelRatio: 2,
            width: doc.documentElement.scrollWidth, height: doc.documentElement.scrollHeight,
          });
          downloadDataUrl(dataUrl);
          return;
        }
        throw new Error('presentation content is not accessible from this window (cross-origin iframe)');
      } catch (clientErr) {
        console.warn('Client-side export failed, falling back to server render:', clientErr);
        // Server-side fallback: same PNG, via headless chromium — covers
        // the cross-origin case above. Needs playwright installed server
        // side; surfaces that plainly (via the backend's 501) rather than
        // failing silently like the old console.error-only path did.
        try {
          const res = await host.sdk.api.fetch(host.app.apiUrl(`/presentations/${presentationId}/export`), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });
          const data = await res.json().catch(() => null);
          if (!res.ok || !data?.data_url) {
            throw new Error(data?.detail || `export failed (${res.status})`);
          }
          downloadDataUrl(data.data_url);
        } catch (serverErr) {
          console.error('Export failed:', serverErr);
          setExportError(serverErr.message || 'Export failed');
        }
      } finally {
        setExportLoading(false);
      }
    }, [presentationId, downloadDataUrl, windowKey]);

    // Push a renamed title into the HOST's title bar — which is now the only
    // place the title is shown. `onTitleChange` is the direct route; the
    // fallback covers a host whose title-bar slot predates that prop, where
    // re-opening the same window id+instance merges the new title into the
    // stored window spec. Without either, a rename would persist server-side
    // but the header would keep the stale name until reload.
    const applyTitle = useCallback((title) => {
      if (onTitleChange) { onTitleChange(title); return; }
      window.__awOpenAppWindow?.('presentations.viewer', presentationId, title);
    }, [onTitleChange, presentationId]);

    const commitRename = useCallback(async (rawTitle) => {
      const title = (rawTitle || '').trim();
      if (!title || title === presentation?.title) return;
      await host.sdk.api.fetch(host.app.apiUrl(`/presentations/${presentationId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      setPresentation((prev) => (prev ? { ...prev, title } : prev));
      applyTitle(title);
    }, [presentation?.title, presentationId, applyTitle]);

    const handleCreateShare = useCallback(async (expiresIn) => {
      if (!presentationId) return;
      setShareLoading(true);
      setShareLink(null);
      try {
        const res = await host.sdk.api.fetch(host.app.apiUrl(`/presentations/${presentationId}/share`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expires_in: expiresIn }),
        });
        const data = await res.json();
        if (data.success && data.token) {
          setShareLink(`${htmlUrl}?token=${data.token}`);
        }
      } catch (err) {
        console.error('Share failed:', err);
      } finally {
        setShareLoading(false);
      }
    }, [presentationId, htmlUrl]);

    const handleCopy = useCallback(() => {
      if (!shareLink) return;
      navigator.clipboard?.writeText(shareLink).then(() => {
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }).catch(() => {});
    }, [shareLink]);

    const handleDelete = useCallback(async () => {
      await host.sdk.api.fetch(host.app.apiUrl(`/presentations/${presentationId}`), { method: 'DELETE' });
      onClose?.();
    }, [presentationId, onClose]);

    // On mobile Safari, window.open() with a feature string is ignored and
    // opens a full tab anyway — so the sheet asks for a tab outright rather
    // than a popup that will not be one.
    const popOut = useCallback(({ asTab = false } = {}) => {
      if (!htmlUrl) return;
      if (asTab) { window.open(htmlUrl, '_blank'); return; }
      window.open(htmlUrl, `presentation-${presentationId}`, 'popup=1,width=1000,height=700');
    }, [htmlUrl, presentationId]);

    return {
      presentation, htmlUrl,
      shareLink, setShareLink, shareLoading, shareCopied, handleCreateShare, handleCopy,
      exportLoading, exportError, setExportError, handleExport,
      commitRename, handleDelete, popOut,
    };
  }

  function PresentationWindowActions({ windowKey, instanceId, onClose, onTitleChange }) {
    const presentationId = instanceId;
    const {
      presentation, htmlUrl,
      shareLink, setShareLink, shareLoading, shareCopied, handleCreateShare, handleCopy,
      exportLoading, exportError, setExportError, handleExport,
      commitRename, handleDelete, popOut,
    } = usePresentationActions(presentationId, windowKey, { onClose, onTitleChange });

    const [renameOpen, setRenameOpen] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [shareOpen, setShareOpen] = useState(false);

    // Follow the stored title (initial load, or a rename made elsewhere)
    // unless the user is mid-edit in the rename box.
    useEffect(() => {
      if (!renameOpen) setEditTitle(presentation?.title || '');
    }, [presentation?.title, renameOpen]);

    // BasicWindow's root is overflow-hidden (rounded corners), so an
    // `absolute` popover anchored in the header is clipped. Every popover
    // here portals to document.body with fixed coords from its button.
    const renameBtnRef = useRef(null);
    const shareBtnRef = useRef(null);
    const [anchor, setAnchor] = useState(null);

    const anchorTo = useCallback((ref) => {
      const r = ref.current?.getBoundingClientRect();
      if (r) setAnchor({ top: r.bottom + 6, right: window.innerWidth - r.right });
    }, []);

    const submitRename = useCallback(() => {
      setRenameOpen(false);
      commitRename(editTitle);
    }, [commitRename, editTitle]);

    // Dismiss any open popover on outside click / Escape — portalled content
    // sits outside this window's DOM subtree, so nothing else dismisses it.
    useEffect(() => {
      if (!renameOpen && !shareOpen && !exportError) return undefined;
      const onDown = (e) => {
        if (renameBtnRef.current?.contains(e.target)) return;
        if (shareBtnRef.current?.contains(e.target)) return;
        if (e.target.closest?.('[data-pres-popover]')) return;
        setRenameOpen(false);
        setShareOpen(false);
        setExportError(null);
      };
      const onKey = (e) => {
        if (e.key !== 'Escape') return;
        setRenameOpen(false);
        setShareOpen(false);
        setExportError(null);
      };
      document.addEventListener('mousedown', onDown);
      document.addEventListener('keydown', onKey);
      return () => {
        document.removeEventListener('mousedown', onDown);
        document.removeEventListener('keydown', onKey);
      };
    }, [renameOpen, shareOpen, exportError, setExportError]);

    // No Maximize button here on purpose — BasicWindow's header already has
    // one, and duplicating it was half the reason this app drew a second bar.
    // No title either: the host header shows it, so Rename is a button now
    // rather than a double-click on a title that no longer exists here.
    return (
      <>
        <button
          ref={renameBtnRef}
          onClick={() => {
            setShareOpen(false);
            setRenameOpen((open) => {
              if (open) return false;
              setEditTitle(presentation?.title || '');
              anchorTo(renameBtnRef);
              return true;
            });
          }}
          className="p-1 rounded hover:bg-white/10 text-[var(--color-text-muted)]"
          title="Rename presentation"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z" />
          </svg>
        </button>
        <button
          ref={shareBtnRef}
          onClick={() => {
            setRenameOpen(false);
            setShareLink(null);
            setShareCopied(false);
            setShareOpen((open) => {
              if (open) return false;
              anchorTo(shareBtnRef);
              return true;
            });
          }}
          className="p-1 rounded hover:bg-white/10 text-[var(--color-text-muted)]"
          title="Share presentation"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
          </svg>
        </button>
        <button
          onClick={() => popOut()}
          className="p-1 rounded hover:bg-white/10 text-[var(--color-text-muted)]"
          title="Pop out to new window"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </button>
        <button
          onClick={handleExport}
          disabled={exportLoading}
          className={`p-1 rounded ${exportLoading ? 'opacity-50 cursor-wait' : 'hover:bg-white/10 cursor-pointer'} ${exportError ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-muted)]'}`}
          title={exportError ? `Export failed: ${exportError}` : 'Export as PNG'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
        <button
          onClick={handleDelete}
          className="p-1 rounded hover:bg-white/10 text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
          title="Delete presentation"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
            <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2h3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1h3a1 1 0 0 1 1 1z" />
          </svg>
        </button>

        {renameOpen && anchor && host.ReactDOM.createPortal(
          <div
            data-pres-popover
            className="fixed z-[1000] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-2xl p-3"
            style={{ top: anchor.top, right: anchor.right, minWidth: 260 }}
          >
            <div className="text-[11px] font-medium text-[var(--color-text-primary)] mb-2">Rename presentation</div>
            <input
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitRename();
                if (e.key === 'Escape') { setRenameOpen(false); setEditTitle(presentation?.title || ''); }
              }}
              className="w-full text-[11px] bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2 py-1 text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={submitRename}
                disabled={!editTitle.trim()}
                className="text-[11px] px-2 py-1 rounded bg-[var(--color-accent)]/20 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/30 transition-colors disabled:opacity-40"
              >
                Rename
              </button>
            </div>
          </div>,
          document.body,
        )}

        {shareOpen && anchor && host.ReactDOM.createPortal(
          <div
            data-pres-popover
            className="fixed z-[1000] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-2xl p-3"
            style={{ top: anchor.top, right: anchor.right, minWidth: 260 }}
          >
            <div className="text-[11px] font-medium text-[var(--color-text-primary)] mb-2">Share presentation</div>
            {shareLoading ? (
              <div className="text-[11px] text-[var(--color-text-muted)] py-2 text-center">Generating link…</div>
            ) : shareLink ? (
              <div className="flex flex-col gap-2">
                <div className="text-[10px] text-[var(--color-text-muted)]">Link generated:</div>
                <div className="flex items-center gap-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2 py-1.5">
                  <span className="text-[10px] font-mono text-[var(--color-text-primary)] truncate flex-1" title={shareLink}>{shareLink}</span>
                  <button onClick={handleCopy} className="shrink-0 text-[10px] px-2 py-0.5 rounded bg-[var(--color-accent)]/20 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/30 transition-colors">
                    {shareCopied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <button onClick={() => setShareLink(null)} className="text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-left">← Generate new link</button>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div className="text-[10px] text-[var(--color-text-muted)] mb-1">Link expires after:</div>
                {[{ label: '1 hour', value: 3600 }, { label: '1 day', value: 86400 }, { label: 'Never expires', value: null }].map(({ label, value }) => (
                  <button
                    key={label}
                    onClick={() => handleCreateShare(value)}
                    className="text-left text-[11px] px-3 py-1.5 rounded bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>,
          document.body,
        )}

        {exportError && anchor && host.ReactDOM.createPortal(
          // The `title` attribute never surfaces on touch devices (iOS Safari
          // shows no hover tooltip on tap), so a red icon with no visible
          // reason reads as "broken, does nothing" — this makes it tappable.
          <div
            data-pres-popover
            className="fixed z-[1000] bg-[var(--color-bg-secondary)] border border-[var(--color-danger)]/40 rounded-lg shadow-2xl p-3"
            style={{ top: anchor.top, right: anchor.right, minWidth: 220, maxWidth: 280 }}
          >
            <div className="text-[11px] font-medium text-[var(--color-danger)] mb-1">Export failed</div>
            <div className="text-[10px] text-[var(--color-text-muted)] mb-2">{exportError}</div>
            <button
              onClick={() => setExportError(null)}
              className="text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              Dismiss
            </button>
          </div>,
          document.body,
        )}
      </>
    );
  }

  // The narrow-screen action sheet. Rendered by the body, not the title bar,
  // because the title bar is exactly what a phone does not get.
  //
  // Deliberately does NOT reuse the titlebar buttons' classes: those are `p-1`
  // around a 14px icon (~22px), which is fine under a mouse and too small for
  // a thumb. Everything here is at least 44px tall. Sizing is inline rather
  // than in arbitrary-value utility classes, because an app bundle can only
  // rely on the utilities the host already ships — an invented one silently
  // does nothing and reads as a layout bug.
  function PresentationActionSheet({ actions, onDismiss }) {
    const {
      presentation, shareLink, setShareLink, shareLoading, shareCopied,
      handleCreateShare, handleCopy, exportLoading, exportError, setExportError,
      handleExport, commitRename, handleDelete, popOut,
    } = actions;
    const [view, setView] = useState('menu');
    const [title, setTitle] = useState(presentation?.title || '');

    const row = {
      display: 'flex', alignItems: 'center', gap: 12, width: '100%',
      minHeight: 44, padding: '0 16px', background: 'transparent',
      border: 0, color: 'var(--color-text-primary)', fontSize: 14,
      textAlign: 'left', cursor: 'pointer',
    };
    const sheet = {
      position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 20,
      background: 'var(--color-bg-secondary)',
      borderTop: '1px solid var(--color-border)',
      borderTopLeftRadius: 12, borderTopRightRadius: 12,
      paddingTop: 8, paddingBottom: 8, maxHeight: '80%', overflowY: 'auto',
    };

    return (
      <>
        <div
          onClick={onDismiss}
          style={{ position: 'absolute', inset: 0, zIndex: 19, background: 'rgba(0,0,0,0.45)' }}
        />
        <div style={sheet} role="menu">
          {view === 'menu' && (
            <>
              <button style={row} onClick={() => { setShareLink(null); setView('share'); }}>Share</button>
              <button
                style={{ ...row, opacity: exportLoading ? 0.5 : 1 }}
                disabled={exportLoading}
                onClick={handleExport}
              >
                {exportLoading ? 'Exporting…' : 'Export as PNG'}
              </button>
              <button style={row} onClick={() => { setTitle(presentation?.title || ''); setView('rename'); }}>Rename</button>
              <button style={row} onClick={() => { popOut({ asTab: true }); onDismiss(); }}>Open in new tab</button>
              <button
                style={{ ...row, color: 'var(--color-danger)' }}
                onClick={() => { handleDelete(); onDismiss(); }}
              >
                Delete
              </button>
              {exportError && (
                <div style={{ padding: '8px 16px', fontSize: 12, color: 'var(--color-danger)' }}>
                  Export failed: {exportError}
                  <button
                    onClick={() => setExportError(null)}
                    style={{ ...row, minHeight: 36, padding: 0, marginTop: 4, fontSize: 12, color: 'var(--color-text-muted)' }}
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </>
          )}

          {view === 'share' && (
            <div style={{ padding: '8px 16px 4px' }}>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                {shareLink ? 'Link generated:' : 'Link expires after:'}
              </div>
              {shareLoading ? (
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', padding: '12px 0' }}>Generating link…</div>
              ) : shareLink ? (
                <>
                  <div style={{
                    fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all',
                    background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)',
                    borderRadius: 6, padding: 8, color: 'var(--color-text-primary)',
                  }}>
                    {shareLink}
                  </div>
                  <button style={{ ...row, padding: 0, color: 'var(--color-accent)' }} onClick={handleCopy}>
                    {shareCopied ? '✓ Copied' : 'Copy link'}
                  </button>
                </>
              ) : (
                [{ label: '1 hour', value: 3600 }, { label: '1 day', value: 86400 }, { label: 'Never expires', value: null }]
                  .map(({ label, value }) => (
                    <button key={label} style={{ ...row, padding: 0 }} onClick={() => handleCreateShare(value)}>
                      {label}
                    </button>
                  ))
              )}
              <button style={{ ...row, padding: 0, color: 'var(--color-text-muted)' }} onClick={() => setView('menu')}>← Back</button>
            </div>
          )}

          {view === 'rename' && (
            <div style={{ padding: '8px 16px 4px' }}>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>Rename presentation</div>
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { commitRename(title); onDismiss(); } }}
                style={{
                  // 16px, not smaller: iOS Safari zooms the whole page in on
                  // any focused field below that.
                  width: '100%', minHeight: 44, fontSize: 16, padding: '0 10px',
                  background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)', borderRadius: 6, outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ ...row, color: 'var(--color-text-muted)' }} onClick={() => setView('menu')}>Cancel</button>
                <button
                  style={{ ...row, color: 'var(--color-accent)', justifyContent: 'flex-end' }}
                  disabled={!title.trim()}
                  onClick={() => { commitRename(title); onDismiss(); }}
                >
                  Rename
                </button>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  // Body is now JUST the viewer — the toolbar that used to sit above this
  // iframe is PresentationWindowActions in the host's title bar, so the window
  // has one header instead of two and the presentation gets that height back.
  //
  // ...except on a narrow screen, where there IS no title bar to put it in:
  // aw-workspace-ui's mobile shell renders windowBodySlot and never
  // windowTitlebarSlot, so a phone user otherwise has no Share/Export/Rename/
  // Pop-out/Delete at all. Hence the floating button below. Gating is on the
  // measured container WIDTH — not a UA test, which would get the 1600px
  // desktop-on-phone layout and the 320px desktop window both wrong. The
  // accepted cost is that a desktop window dragged under 640px shows both the
  // titlebar buttons and the button: redundant, not broken.
  function PresentationWindowBody({ windowKey, instanceId, onClose, onTitleChange }) {
    const presentationId = instanceId;
    const iframeRef = useRef(null);
    const containerRef = useRef(null);
    const [narrow, setNarrow] = useState(false);
    const [sheetOpen, setSheetOpen] = useState(false);
    const actions = usePresentationActions(presentationId, windowKey, { onClose, onTitleChange });
    const { htmlUrl } = actions;

    // Same ResizeObserver pattern as PresentationThumbnail.
    useEffect(() => {
      const el = containerRef.current;
      if (!el || typeof ResizeObserver === 'undefined') return undefined;
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const w = entry.contentRect.width;
          if (w > 0) setNarrow(w < NARROW_WIDTH);
        }
      });
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    useEffect(() => { if (!narrow) setSheetOpen(false); }, [narrow]);

    // Published for the actions' export-as-PNG — the titlebar copy and the
    // sheet both read the iframe document back through this map.
    useEffect(() => {
      iframesByWindow.set(windowKey, iframeRef.current);
      return () => iframesByWindow.delete(windowKey);
    }, [windowKey]);

    return (
      <div ref={containerRef} className="flex flex-col bg-[var(--color-bg-secondary)] h-full">
        <div className="flex-1 relative">
          {htmlUrl && (
            <iframe ref={iframeRef} src={htmlUrl} className="absolute inset-0 w-full h-full bg-white border-0" title="Presentation" />
          )}
          {narrow && !sheetOpen && (
            <button
              onClick={() => setSheetOpen(true)}
              aria-label="Presentation actions"
              style={{
                position: 'absolute', bottom: 16, right: 16, zIndex: 18,
                width: 48, height: 48, borderRadius: 24,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)', cursor: 'pointer',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
              </svg>
            </button>
          )}
          {narrow && sheetOpen && (
            <PresentationActionSheet actions={actions} onDismiss={() => setSheetOpen(false)} />
          )}
        </div>
      </div>
    );
  }

  host.registerSlot('core.nav', PresentationsNavSlot);
  host.registerWindow('presentations.viewer', PresentationWindowBody);
  // Optional-chained: needs an aw-workspace-ui new enough to expose it (and to
  // render the core.window.titlebar:<id> slot at all). On an older host this
  // is simply absent — the window keeps its single header with no app buttons,
  // rather than throwing during register() and losing the nav too.
  host.registerWindowActions?.('presentations.viewer', PresentationWindowActions);
}

export default register;
