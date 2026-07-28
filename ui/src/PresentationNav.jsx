import { useState, useRef, useCallback, useEffect } from 'react';

const API_BASE = '';

/**
 * Top-bar nav entry for Presentation. Hovering opens a gallery of presentation thumbnails
 * sorted by creation time (newest first). Each thumbnail is a scaled iframe
 * rendering the live presentation HTML; clicking opens that presentation as a window.
 */
export default function PresentationNav({ presentations, onSelectPresentation, onDeletePresentation, active }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef(null);

  const handleEnter = useCallback(() => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  }, []);

  const handleLeave = useCallback(() => {
    // Small delay so the user can move from the button to the popover
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }, []);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const sorted = [...(presentations || [])].sort(
    (a, b) => (b.created_at || 0) - (a.created_at || 0)
  );

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button
        onClick={() => {
          // Click toggles popover open (also useful on touch devices)
          setOpen((v) => !v);
        }}
        className={`px-3 py-1 text-xs rounded transition-colors cursor-pointer ${active
          ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]'
          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5'}`}
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
                    onClick={() => { setOpen(false); onSelectPresentation(c.id); }}
                    onDelete={onDeletePresentation ? () => onDeletePresentation(c.id) : null}
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

/**
 * A scaled-down iframe preview of a presentation. Click the card to open the presentation.
 * The iframe is render-only (pointer-events: none) so the wrapping click works
 * regardless of where you press inside the thumbnail area.
 *
 * The iframe loads the presentation HTML from /api/presentations/{id}/html and is scaled
 * via CSS transform to exactly fill the wrapper — no white bleed on either side
 * regardless of the grid cell width. sandbox="allow-same-origin" keeps styles
 * working while blocking script execution.
 */
function PresentationThumbnail({ presentation, onClick, onDelete }) {
  const wrapperRef = useRef(null);
  const [scale, setScale] = useState(0.16);

  // Render the full presentation HTML at "real" size, then scale via CSS transform.
  const REAL_W = 1000;
  const REAL_H = 650;
  const ASPECT = REAL_H / REAL_W; // thumbnail height = wrapper width * ASPECT

  // Track wrapper width; recompute scale so iframe exactly fills it.
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
      {/* Thumbnail viewport — height keeps the presentation aspect ratio, iframe
          is scaled to exactly the wrapper's width so there's no white bleed.
          sandbox="allow-same-origin" lets styles work but blocks scripts. */}
      <div
        ref={wrapperRef}
        className="relative bg-[var(--color-bg-primary)]"
        style={{ width: '100%', paddingTop: `${ASPECT * 100}%`, overflow: 'hidden' }}
      >
        <iframe
          src={`${API_BASE}/api/presentations/${presentation.id}/html`}
          sandbox="allow-same-origin"
          tabIndex={-1}
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: REAL_W,
            height: REAL_H,
            border: 0,
            pointerEvents: 'none',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        />
      </div>

      {/* Caption */}
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

      {/* Delete button — appears on hover */}
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="hidden group-hover:flex absolute top-1 right-1 items-center justify-center w-5 h-5 rounded bg-black/60 text-white/80 hover:text-[var(--color-danger)] hover:bg-black/80"
          title="Delete presentation"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
