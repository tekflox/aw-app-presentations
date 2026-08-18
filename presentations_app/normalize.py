"""Render-time normalization of stored presentation HTML.

Presentations are authored by agents, stored verbatim, and read on phones as
often as on desktops. Most of the corpus predates any mobile consideration:
of the 17 presentations stored when this module was written, 16 had no
viewport meta, 5 set explicit ``min-width`` floors, 8 contained unwrapped
``<table>``s and 3 used ``grid-template-columns: repeat(N, 1fr)``. Without a
viewport meta a mobile browser lays the page out at desktop width and the
dark-theme body reads as a blank black screen; *with* one, those same
layouts simply overflow horizontally instead.

So this module does two things at serve time:

* injects the viewport meta tag when the document does not declare its own;
* injects a fallback stylesheet, wrapped in ``@media (max-width: 640px)``,
  that only ever *relaxes* constraints.

Two rules keep the blast radius of the stylesheet provably empty on every
existing desktop surface, and both are load-bearing — do not "improve" the
CSS out of them:

1. **Everything lives inside the media query.** The thumbnail iframe renders
   at 1000px, PNG export at 1280px, the desktop viewer at whatever the window
   is, and the SPA's desktop-on-phone mode at 1600px. The block is inert in
   all of them; the only surface it can reach is a genuinely narrow one,
   which is the surface that is broken today.
2. **It relaxes, never overrides.** No ``!important``, no reset. ``* {
   min-width: 0 }`` defeats the *implicit* ``min-width: auto`` floor on flex
   and grid items (the thing that stops a row shrinking) at specificity
   0-0-0, so an author's explicit ``.metric { min-width: 120px }`` still
   wins. That is deliberate: overriding explicit author sizing is how you
   break the presentations somebody built carefully.

Normalization is a *render*-time concern only. ``storage.create``/``update``
keep the author's bytes verbatim, so ``update_presentation`` round-trips
without drift and changing the net below is a deploy, not a data migration.
The injected ``data-aw-responsive-fallback`` marker exists so the difference
between stored and served HTML is greppable rather than mysterious.

Companion changes share the 640px breakpoint: ``skills/aw-presentation``'s
authoring template, ``mcp/commented_file.py``'s CSS, and the viewer's
narrow-screen action bar in ``ui/src/plugin.jsx``. One number, four places —
if it ever moves it has to move in all of them.
"""

from __future__ import annotations

import re

VIEWPORT_META = '<meta name="viewport" content="width=device-width, initial-scale=1">'

FALLBACK_MARKER = "data-aw-responsive-fallback"

FALLBACK_STYLE = """<style data-aw-responsive-fallback>
@media (max-width: 640px) {
  html, body { max-width: 100%; }
  body { overflow-wrap: anywhere; }
  * { min-width: 0; }
  img, svg, video, canvas { max-width: 100%; height: auto; }
  iframe, embed, object { max-width: 100%; }
  pre { max-width: 100%; overflow-x: auto; }
  table { display: block; max-width: 100%; overflow-x: auto; }
}
</style>"""

# A real tag test, not ``"viewport" in html``. The substring form matched the
# word anywhere in the document — including body text — so a presentation
# that merely *discussed* viewports (a report about this very bug, say)
# skipped the injection and shipped broken.
_VIEWPORT_RE = re.compile(r"""<meta[^>]+name\s*=\s*["']?viewport""", re.I)

# ``<head>`` is the common case, but ``<head lang="pt-BR">`` and ``<head >``
# are both real and both missed by a literal "<head>" search.
_HEAD_OPEN_RE = re.compile(r"<head\b[^>]*>", re.I)
_HTML_OPEN_RE = re.compile(r"<html\b[^>]*>", re.I)
_DOCTYPE_RE = re.compile(r"\s*<!doctype[^>]*>", re.I)


def normalize_presentation_html(html: str) -> str:
    """Return ``html`` with a viewport meta and the narrow-viewport fallback
    stylesheet, both at the very start of ``<head>`` so author CSS that comes
    later wins on equal specificity.

    Idempotent. The two injections are decided independently: a document that
    declares its own viewport meta still gets the fallback stylesheet (it is
    inert on desktop and only relaxes on a phone), and one that already
    carries the fallback marker gets neither again.
    """
    if not html:
        return html

    injected = ""
    if not _VIEWPORT_RE.search(html):
        injected += VIEWPORT_META
    if FALLBACK_MARKER not in html:
        injected += FALLBACK_STYLE
    if not injected:
        return html

    # Ordered by how much structure the document actually has. Never insert
    # before a doctype: content ahead of it puts the browser in quirks mode,
    # which is a worse bug than the one being fixed.
    head_open = _HEAD_OPEN_RE.search(html)
    if head_open:
        at = head_open.end()
        return html[:at] + injected + html[at:]

    html_open = _HTML_OPEN_RE.search(html)
    if html_open:
        at = html_open.end()
        return html[:at] + "<head>" + injected + "</head>" + html[at:]

    doctype = _DOCTYPE_RE.match(html)
    if doctype:
        at = doctype.end()
        return html[:at] + injected + html[at:]

    return injected + html
