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
    const REAL_W = 1000;
    const REAL_H = 650;
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
  function PresentationWindowBody({ windowKey, instanceId, onClose, onMaximize, isMaximized, onTitleChange }) {
    const presentationId = instanceId;
    const iframeRef = useRef(null);
    const [presentation, setPresentation] = useState(null);
    const [editing, setEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');

    const [shareOpen, setShareOpen] = useState(false);
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
        setEditTitle(data.title || '');
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
          if (!editing) setEditTitle(msg.presentation.title || '');
        }
      };
      window.addEventListener('aw-presentation-update', handler);
      return () => window.removeEventListener('aw-presentation-update', handler);
    }, [presentationId, onClose, editing]);

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
        const doc = iframeRef.current?.contentDocument;
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
    }, [presentationId, downloadDataUrl]);

    const commitRename = useCallback(async () => {
      setEditing(false);
      const title = editTitle.trim();
      if (!title || title === presentation?.title) return;
      await host.sdk.api.fetch(host.app.apiUrl(`/presentations/${presentationId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      setPresentation((prev) => (prev ? { ...prev, title } : prev));
      onTitleChange?.(title);
    }, [editTitle, presentation?.title, presentationId, onTitleChange]);

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

    return (
      <div className="flex flex-col bg-[var(--color-bg-secondary)] h-full">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)] shrink-0" onMouseDown={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2 min-w-0">
            {editing ? (
              <input
                autoFocus
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') { setEditing(false); setEditTitle(presentation?.title || ''); }
                }}
                className="font-semibold text-[13px] text-[var(--color-text-primary)] bg-[var(--color-bg-primary)] border border-[var(--color-accent)] rounded px-1 py-0 outline-none w-48"
              />
            ) : (
              <span
                className="text-[13px] text-[var(--color-text-primary)] truncate cursor-text"
                onDoubleClick={() => { setEditing(true); setEditTitle(presentation?.title || ''); }}
                title="Double-click to rename"
              >
                {presentation?.title || 'Untitled'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                onClick={() => { setShareOpen((v) => !v); setShareLink(null); setShareCopied(false); }}
                className="p-1.5 rounded hover:bg-white/10 transition-colors"
                title="Share presentation"
              >
                <svg className="w-4 h-4 text-[var(--color-text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                  <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
                </svg>
              </button>
              {shareOpen && (
                <div
                  className="absolute right-0 top-full mt-2 z-50 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-2xl p-3"
                  style={{ minWidth: 260 }}
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
                </div>
              )}
            </div>
            <button
              onClick={() => { if (htmlUrl) window.open(htmlUrl, `presentation-${presentationId}`, 'popup=1,width=1000,height=700'); }}
              className="p-1.5 rounded hover:bg-white/10 transition-colors"
              title="Pop out to new window"
            >
              <svg className="w-4 h-4 text-[var(--color-text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </button>
            <div className="relative">
              <button
                onClick={handleExport}
                disabled={exportLoading}
                className={`p-1.5 rounded transition-colors ${exportLoading ? 'opacity-50 cursor-wait' : 'hover:bg-white/10 cursor-pointer'}`}
                title={exportError ? `Export failed: ${exportError}` : 'Export as PNG'}
              >
                <svg className={`w-4 h-4 ${exportError ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-muted)]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
              {exportError && (
                // The `title` attribute above never surfaces on touch devices
                // (iOS Safari doesn't show hover tooltips on tap), so a red
                // icon with no visible reason reads as "broken, does nothing"
                // — this popover makes the failure reason tappable too.
                <div
                  className="absolute right-0 top-full mt-2 z-50 bg-[var(--color-bg-secondary)] border border-[var(--color-danger)]/40 rounded-lg shadow-2xl p-3"
                  style={{ minWidth: 220, maxWidth: 280 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-[11px] font-medium text-[var(--color-danger)] mb-1">Export failed</div>
                  <div className="text-[10px] text-[var(--color-text-muted)] mb-2">{exportError}</div>
                  <button
                    onClick={() => setExportError(null)}
                    className="text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => onMaximize?.(windowKey)} className="p-1.5 rounded hover:bg-white/10 transition-colors" title={isMaximized ? 'Restore' : 'Maximize'}>
              <svg className="w-4 h-4 text-[var(--color-text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
            </button>
            <button onClick={handleDelete} className="p-1.5 rounded hover:bg-white/10 transition-colors" title="Delete presentation">
              <svg className="w-4 h-4 text-[var(--color-text-muted)] hover:text-[var(--color-danger)]" viewBox="0 0 16 16" fill="currentColor">
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2h3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1h3a1 1 0 0 1 1 1z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 relative" onClick={() => setShareOpen(false)}>
          {htmlUrl && (
            <iframe ref={iframeRef} src={htmlUrl} className="absolute inset-0 w-full h-full bg-white border-0" title={presentation?.title || 'Presentation'} />
          )}
        </div>
      </div>
    );
  }

  host.registerSlot('core.nav', PresentationsNavSlot);
  host.registerWindow('presentations.viewer', PresentationWindowBody);
}

export default register;
