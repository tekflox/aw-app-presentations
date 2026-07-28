import { useState, useRef, useCallback } from 'react';
import { apiFetch } from '../auth';

const API_BASE = '';

export default function PresentationWindow({ presentation, onClose, onDelete, onMaximize, isMaximized, windowKey, onRename, onFocus }) {
  const iframeRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(presentation?.title || '');

  // Share modal state
  const [shareOpen, setShareOpen] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareLink, setShareLink] = useState(null);
  const [shareCopied, setShareCopied] = useState(false);

  const htmlUrl = presentation?.id ? `${API_BASE}/api/presentations/${presentation.id}/html` : null;

  const handleExport = useCallback(async () => {
    if (!iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc || !doc.body) return;
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(doc.documentElement, {
        backgroundColor: '#111318',
        pixelRatio: 2,
        width: doc.documentElement.scrollWidth,
        height: doc.documentElement.scrollHeight,
      });
      const link = document.createElement('a');
      link.download = `${(presentation?.title || 'presentation').replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
  }, [presentation?.title]);

  const handleCreateShare = useCallback(async (expiresIn) => {
    if (!presentation?.id) return;
    setShareLoading(true);
    setShareLink(null);
    try {
      const res = await apiFetch(`${API_BASE}/api/presentations/${presentation.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expires_in: expiresIn }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        const url = `${window.location.origin}/api/presentations/${presentation.id}/html?token=${data.token}`;
        setShareLink(url);
      }
    } catch (err) {
      console.error('Share failed:', err);
    } finally {
      setShareLoading(false);
    }
  }, [presentation?.id]);

  const handleCopy = useCallback(() => {
    if (!shareLink) return;
    navigator.clipboard?.writeText(shareLink).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }).catch(() => {});
  }, [shareLink]);

  return (
    <div className="flex flex-col bg-[var(--color-bg-secondary)] rounded-lg overflow-hidden h-full shadow-2xl shadow-black/40 border border-[var(--color-border)]">
      {/* Header */}
      <div className="drag-handle flex items-center justify-between px-3 py-2 bg-[var(--color-bg-header)] border-b border-[var(--color-border)] select-none cursor-grab active:cursor-grabbing shrink-0">
        <div className="flex items-center gap-2 min-w-0" onMouseDown={(e) => e.stopPropagation()}>
          <svg className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 3v18" />
          </svg>
          {editing ? (
            <input
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={() => { setEditing(false); if (editTitle.trim() && editTitle !== presentation?.title) onRename?.(presentation.id, editTitle.trim()); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { setEditing(false); if (editTitle.trim() && editTitle !== presentation?.title) onRename?.(presentation.id, editTitle.trim()); }
                if (e.key === 'Escape') { setEditing(false); setEditTitle(presentation?.title || ''); }
                e.stopPropagation();
              }}
              className="font-semibold text-[15px] text-[var(--color-text-primary)] bg-[var(--color-bg-primary)] border border-[var(--color-accent)] rounded px-1 py-0 outline-none w-48"
            />
          ) : (
            <span
              className="font-semibold text-[15px] text-[var(--color-text-primary)] truncate cursor-text"
              onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); setEditTitle(presentation?.title || ''); }}
              title="Double-click to rename"
            >
              {presentation?.title || 'Untitled'}
            </span>
          )}
          {Array.isArray(presentation?.tags) && presentation.tags.length > 0 && (
            <div className="flex items-center gap-1 ml-1 overflow-hidden" onMouseDown={(e) => e.stopPropagation()}>
              {presentation.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    try { navigator.clipboard?.writeText(tag); } catch (_) { /* noop */ }
                  }}
                  title={`Click to copy: ${tag}`}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[var(--color-text-muted)] hover:bg-white/10 hover:text-[var(--color-text-primary)] transition-colors whitespace-nowrap"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2" onMouseDown={(e) => e.stopPropagation()}>
          {/* Share */}
          <div className="relative">
            <button
              onClick={() => { setShareOpen((v) => !v); setShareLink(null); setShareCopied(false); }}
              className="p-1.5 rounded hover:bg-white/10 transition-colors"
              title="Share presentation"
            >
              <svg className="w-4 h-4 text-[var(--color-text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>
              </svg>
            </button>
            {shareOpen && (
              <div
                className="absolute right-0 top-full mt-2 z-50 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-2xl p-3"
                style={{ minWidth: 260 }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="text-[11px] font-medium text-[var(--color-text-primary)] mb-2">Share presentation</div>
                {shareLoading ? (
                  <div className="text-[11px] text-[var(--color-text-muted)] py-2 text-center">Generating link…</div>
                ) : shareLink ? (
                  <div className="flex flex-col gap-2">
                    <div className="text-[10px] text-[var(--color-text-muted)]">Link generated:</div>
                    <div className="flex items-center gap-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2 py-1.5">
                      <span className="text-[10px] font-mono text-[var(--color-text-primary)] truncate flex-1" title={shareLink}>
                        {shareLink}
                      </span>
                      <button
                        onClick={handleCopy}
                        className="shrink-0 text-[10px] px-2 py-0.5 rounded bg-[var(--color-accent)]/20 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/30 transition-colors"
                      >
                        {shareCopied ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                    <button
                      onClick={() => setShareLink(null)}
                      className="text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-left"
                    >
                      ← Generate new link
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <div className="text-[10px] text-[var(--color-text-muted)] mb-1">Link expires after:</div>
                    {[
                      { label: '1 hour', value: 3600 },
                      { label: '1 day', value: 86400 },
                      { label: 'Never expires', value: null },
                    ].map(({ label, value }) => (
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

          {/* Pop out */}
          <button
            onClick={() => {
              if (!htmlUrl) return;
              window.open(htmlUrl, `presentation-${presentation.id}`, 'popup=1,width=1000,height=700');
            }}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            title="Pop out to new window"
          >
            <svg className="w-4 h-4 text-[var(--color-text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </button>
          {/* Export as image */}
          <button
            onClick={handleExport}
            className="p-1.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
            title="Export as PNG"
          >
            <svg className="w-4 h-4 text-[var(--color-text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
          {/* Maximize */}
          <button
            onClick={() => onMaximize?.(windowKey)}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? (
              <svg className="w-4 h-4 text-[var(--color-text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="5" width="14" height="14" rx="1" />
                <path d="M8 2h12a2 2 0 0 1 2 2v12" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-[var(--color-text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
            )}
          </button>
          {/* Delete */}
          <button
            onClick={onDelete}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            title="Delete presentation"
          >
            <svg className="w-4 h-4 text-[var(--color-text-muted)] hover:text-[var(--color-danger)]" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
              <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2h3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1h3a1 1 0 0 1 1 1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118z"/>
            </svg>
          </button>
          {/* Close */}
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            title="Close"
          >
            <svg className="w-4 h-4 text-[var(--color-text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 relative" onClick={() => setShareOpen(false)}>
        {htmlUrl && (
          <iframe
            ref={iframeRef}
            src={htmlUrl}
            className="absolute inset-0 w-full h-full bg-white border-0"
            title={presentation?.title || 'Presentation'}
          />
        )}
        {/* Focus overlay — pointer-events:none so iframe is fully interactive */}
        <div
          className="absolute inset-0"
          style={{ pointerEvents: 'none', zIndex: 1 }}
        />
      </div>
    </div>
  );
}
