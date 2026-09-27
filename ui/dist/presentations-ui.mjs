function Le(e, t) {
  if (e.match(/^[a-z]+:\/\//i))
    return e;
  if (e.match(/^\/\//))
    return window.location.protocol + e;
  if (e.match(/^[a-z]+:/i))
    return e;
  const n = document.implementation.createHTMLDocument(), r = n.createElement("base"), a = n.createElement("a");
  return n.head.appendChild(r), n.body.appendChild(a), t && (r.href = t), a.href = e, a.href;
}
const $e = /* @__PURE__ */ (() => {
  let e = 0;
  const t = () => (
    // eslint-disable-next-line no-bitwise
    `0000${(Math.random() * 36 ** 4 << 0).toString(36)}`.slice(-4)
  );
  return () => (e += 1, `u${t()}${e}`);
})();
function B(e) {
  const t = [];
  for (let n = 0, r = e.length; n < r; n++)
    t.push(e[n]);
  return t;
}
let q = null;
function ye(e = {}) {
  return q || (e.includeStyleProperties ? (q = e.includeStyleProperties, q) : (q = B(window.getComputedStyle(document.documentElement)), q));
}
function K(e, t) {
  const r = (e.ownerDocument.defaultView || window).getComputedStyle(e).getPropertyValue(t);
  return r ? parseFloat(r.replace("px", "")) : 0;
}
function Ae(e) {
  const t = K(e, "border-left-width"), n = K(e, "border-right-width");
  return e.clientWidth + t + n;
}
function Fe(e) {
  const t = K(e, "border-top-width"), n = K(e, "border-bottom-width");
  return e.clientHeight + t + n;
}
function we(e, t = {}) {
  const n = t.width || Ae(e), r = t.height || Fe(e);
  return { width: n, height: r };
}
function Oe() {
  let e, t;
  try {
    t = process;
  } catch {
  }
  const n = t && t.env ? t.env.devicePixelRatio : null;
  return n && (e = parseInt(n, 10), Number.isNaN(e) && (e = 1)), e || window.devicePixelRatio || 1;
}
const D = 16384;
function De(e) {
  (e.width > D || e.height > D) && (e.width > D && e.height > D ? e.width > e.height ? (e.height *= D / e.width, e.width = D) : (e.width *= D / e.height, e.height = D) : e.width > D ? (e.height *= D / e.width, e.width = D) : (e.width *= D / e.height, e.height = D));
}
function Q(e) {
  return new Promise((t, n) => {
    const r = new Image();
    r.onload = () => {
      r.decode().then(() => {
        requestAnimationFrame(() => t(r));
      });
    }, r.onerror = n, r.crossOrigin = "anonymous", r.decoding = "async", r.src = e;
  });
}
async function _e(e) {
  return Promise.resolve().then(() => new XMLSerializer().serializeToString(e)).then(encodeURIComponent).then((t) => `data:image/svg+xml;charset=utf-8,${t}`);
}
async function Ue(e, t, n) {
  const r = "http://www.w3.org/2000/svg", a = document.createElementNS(r, "svg"), o = document.createElementNS(r, "foreignObject");
  return a.setAttribute("width", `${t}`), a.setAttribute("height", `${n}`), a.setAttribute("viewBox", `0 0 ${t} ${n}`), o.setAttribute("width", "100%"), o.setAttribute("height", "100%"), o.setAttribute("x", "0"), o.setAttribute("y", "0"), o.setAttribute("externalResourcesRequired", "true"), a.appendChild(o), o.appendChild(e), _e(a);
}
const $ = (e, t) => {
  if (e instanceof t)
    return !0;
  const n = Object.getPrototypeOf(e);
  return n === null ? !1 : n.constructor.name === t.name || $(n, t);
};
function We(e) {
  const t = e.getPropertyValue("content");
  return `${e.cssText} content: '${t.replace(/'|"/g, "")}';`;
}
function He(e, t) {
  return ye(t).map((n) => {
    const r = e.getPropertyValue(n), a = e.getPropertyPriority(n);
    return `${n}: ${r}${a ? " !important" : ""};`;
  }).join(" ");
}
function Me(e, t, n, r) {
  const a = `.${e}:${t}`, o = n.cssText ? We(n) : He(n, r);
  return document.createTextNode(`${a}{${o}}`);
}
function de(e, t, n, r) {
  const a = window.getComputedStyle(e, n), o = a.getPropertyValue("content");
  if (o === "" || o === "none")
    return;
  const i = $e();
  try {
    t.className = `${t.className} ${i}`;
  } catch {
    return;
  }
  const l = document.createElement("style");
  l.appendChild(Me(i, n, a, r)), t.appendChild(l);
}
function Ne(e, t, n) {
  de(e, t, ":before", n), de(e, t, ":after", n);
}
const fe = "application/font-woff", pe = "image/jpeg", ze = {
  woff: fe,
  woff2: fe,
  ttf: "application/font-truetype",
  eot: "application/vnd.ms-fontobject",
  png: "image/png",
  jpg: pe,
  jpeg: pe,
  gif: "image/gif",
  tiff: "image/tiff",
  svg: "image/svg+xml",
  webp: "image/webp"
};
function Ve(e) {
  const t = /\.([^./]*?)$/g.exec(e);
  return t ? t[1] : "";
}
function re(e) {
  const t = Ve(e).toLowerCase();
  return ze[t] || "";
}
function Be(e) {
  return e.split(/,/)[1];
}
function te(e) {
  return e.search(/^(data:)/) !== -1;
}
function Ie(e, t) {
  return `data:${t};base64,${e}`;
}
async function be(e, t, n) {
  const r = await fetch(e, t);
  if (r.status === 404)
    throw new Error(`Resource "${r.url}" not found`);
  const a = await r.blob();
  return new Promise((o, i) => {
    const l = new FileReader();
    l.onerror = i, l.onloadend = () => {
      try {
        o(n({ res: r, result: l.result }));
      } catch (f) {
        i(f);
      }
    }, l.readAsDataURL(a);
  });
}
const ee = {};
function je(e, t, n) {
  let r = e.replace(/\?.*/, "");
  return n && (r = e), /ttf|otf|eot|woff2?/i.test(r) && (r = r.replace(/.*\//, "")), t ? `[${t}]${r}` : r;
}
async function ne(e, t, n) {
  const r = je(e, t, n.includeQueryParams);
  if (ee[r] != null)
    return ee[r];
  n.cacheBust && (e += (/\?/.test(e) ? "&" : "?") + (/* @__PURE__ */ new Date()).getTime());
  let a;
  try {
    const o = await be(e, n.fetchRequestInit, ({ res: i, result: l }) => (t || (t = i.headers.get("Content-Type") || ""), Be(l)));
    a = Ie(o, t);
  } catch (o) {
    a = n.imagePlaceholder || "";
    let i = `Failed to fetch resource: ${e}`;
    o && (i = typeof o == "string" ? o : o.message), i && console.warn(i);
  }
  return ee[r] = a, a;
}
async function Ge(e) {
  const t = e.toDataURL();
  return t === "data:," ? e.cloneNode(!1) : Q(t);
}
async function qe(e, t) {
  if (e.currentSrc) {
    const o = document.createElement("canvas"), i = o.getContext("2d");
    o.width = e.clientWidth, o.height = e.clientHeight, i == null || i.drawImage(e, 0, 0, o.width, o.height);
    const l = o.toDataURL();
    return Q(l);
  }
  const n = e.poster, r = re(n), a = await ne(n, r, t);
  return Q(a);
}
async function Je(e, t) {
  var n;
  try {
    if (!((n = e == null ? void 0 : e.contentDocument) === null || n === void 0) && n.body)
      return await Y(e.contentDocument.body, t, !0);
  } catch {
  }
  return e.cloneNode(!1);
}
async function Xe(e, t) {
  return $(e, HTMLCanvasElement) ? Ge(e) : $(e, HTMLVideoElement) ? qe(e, t) : $(e, HTMLIFrameElement) ? Je(e, t) : e.cloneNode(ve(e));
}
const Ke = (e) => e.tagName != null && e.tagName.toUpperCase() === "SLOT", ve = (e) => e.tagName != null && e.tagName.toUpperCase() === "SVG";
async function Qe(e, t, n) {
  var r, a;
  if (ve(t))
    return t;
  let o = [];
  return Ke(e) && e.assignedNodes ? o = B(e.assignedNodes()) : $(e, HTMLIFrameElement) && (!((r = e.contentDocument) === null || r === void 0) && r.body) ? o = B(e.contentDocument.body.childNodes) : o = B(((a = e.shadowRoot) !== null && a !== void 0 ? a : e).childNodes), o.length === 0 || $(e, HTMLVideoElement) || await o.reduce((i, l) => i.then(() => Y(l, n)).then((f) => {
    f && t.appendChild(f);
  }), Promise.resolve()), t;
}
function Ye(e, t, n) {
  const r = t.style;
  if (!r)
    return;
  const a = window.getComputedStyle(e);
  a.cssText ? (r.cssText = a.cssText, r.transformOrigin = a.transformOrigin) : ye(n).forEach((o) => {
    let i = a.getPropertyValue(o);
    o === "font-size" && i.endsWith("px") && (i = `${Math.floor(parseFloat(i.substring(0, i.length - 2))) - 0.1}px`), $(e, HTMLIFrameElement) && o === "display" && i === "inline" && (i = "block"), o === "d" && t.getAttribute("d") && (i = `path(${t.getAttribute("d")})`), r.setProperty(o, i, a.getPropertyPriority(o));
  });
}
function Ze(e, t) {
  $(e, HTMLTextAreaElement) && (t.innerHTML = e.value), $(e, HTMLInputElement) && t.setAttribute("value", e.value);
}
function et(e, t) {
  if ($(e, HTMLSelectElement)) {
    const n = t, r = Array.from(n.children).find((a) => e.value === a.getAttribute("value"));
    r && r.setAttribute("selected", "");
  }
}
function tt(e, t, n) {
  return $(t, Element) && (Ye(e, t, n), Ne(e, t, n), Ze(e, t), et(e, t)), t;
}
async function rt(e, t) {
  const n = e.querySelectorAll ? e.querySelectorAll("use") : [];
  if (n.length === 0)
    return e;
  const r = {};
  for (let o = 0; o < n.length; o++) {
    const l = n[o].getAttribute("xlink:href");
    if (l) {
      const f = e.querySelector(l), A = document.querySelector(l);
      !f && A && !r[l] && (r[l] = await Y(A, t, !0));
    }
  }
  const a = Object.values(r);
  if (a.length) {
    const o = "http://www.w3.org/1999/xhtml", i = document.createElementNS(o, "svg");
    i.setAttribute("xmlns", o), i.style.position = "absolute", i.style.width = "0", i.style.height = "0", i.style.overflow = "hidden", i.style.display = "none";
    const l = document.createElementNS(o, "defs");
    i.appendChild(l);
    for (let f = 0; f < a.length; f++)
      l.appendChild(a[f]);
    e.appendChild(i);
  }
  return e;
}
async function Y(e, t, n) {
  return !n && t.filter && !t.filter(e) ? null : Promise.resolve(e).then((r) => Xe(r, t)).then((r) => Qe(e, r, t)).then((r) => tt(e, r, t)).then((r) => rt(r, t));
}
const Ee = /url\((['"]?)([^'"]+?)\1\)/g, nt = /url\([^)]+\)\s*format\((["']?)([^"']+)\1\)/g, at = /src:\s*(?:url\([^)]+\)\s*format\([^)]+\)[,;]\s*)+/g;
function ot(e) {
  const t = e.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1");
  return new RegExp(`(url\\(['"]?)(${t})(['"]?\\))`, "g");
}
function it(e) {
  const t = [];
  return e.replace(Ee, (n, r, a) => (t.push(a), n)), t.filter((n) => !te(n));
}
async function lt(e, t, n, r, a) {
  try {
    const o = n ? Le(t, n) : t, i = re(t);
    let l;
    return a || (l = await ne(o, i, r)), e.replace(ot(t), `$1${l}$3`);
  } catch {
  }
  return e;
}
function ct(e, { preferredFontFormat: t }) {
  return t ? e.replace(at, (n) => {
    for (; ; ) {
      const [r, , a] = nt.exec(n) || [];
      if (!a)
        return "";
      if (a === t)
        return `src: ${r};`;
    }
  }) : e;
}
function Se(e) {
  return e.search(Ee) !== -1;
}
async function ke(e, t, n) {
  if (!Se(e))
    return e;
  const r = ct(e, n);
  return it(r).reduce((o, i) => o.then((l) => lt(l, i, t, n)), Promise.resolve(r));
}
async function J(e, t, n) {
  var r;
  const a = (r = t.style) === null || r === void 0 ? void 0 : r.getPropertyValue(e);
  if (a) {
    const o = await ke(a, null, n);
    return t.style.setProperty(e, o, t.style.getPropertyPriority(e)), !0;
  }
  return !1;
}
async function st(e, t) {
  await J("background", e, t) || await J("background-image", e, t), await J("mask", e, t) || await J("-webkit-mask", e, t) || await J("mask-image", e, t) || await J("-webkit-mask-image", e, t);
}
async function ut(e, t) {
  const n = $(e, HTMLImageElement);
  if (!(n && !te(e.src)) && !($(e, SVGImageElement) && !te(e.href.baseVal)))
    return;
  const r = n ? e.src : e.href.baseVal, a = await ne(r, re(r), t);
  await new Promise((o, i) => {
    e.onload = o, e.onerror = t.onImageErrorHandler ? (...f) => {
      try {
        o(t.onImageErrorHandler(...f));
      } catch (A) {
        i(A);
      }
    } : i;
    const l = e;
    l.decode && (l.decode = o), l.loading === "lazy" && (l.loading = "eager"), n ? (e.srcset = "", e.src = a) : e.href.baseVal = a;
  });
}
async function dt(e, t) {
  const r = B(e.childNodes).map((a) => Re(a, t));
  await Promise.all(r).then(() => e);
}
async function Re(e, t) {
  $(e, Element) && (await st(e, t), await ut(e, t), await dt(e, t));
}
function ft(e, t) {
  const { style: n } = e;
  t.backgroundColor && (n.backgroundColor = t.backgroundColor), t.width && (n.width = `${t.width}px`), t.height && (n.height = `${t.height}px`);
  const r = t.style;
  return r != null && Object.keys(r).forEach((a) => {
    n[a] = r[a];
  }), e;
}
const he = {};
async function me(e) {
  let t = he[e];
  if (t != null)
    return t;
  const r = await (await fetch(e)).text();
  return t = { url: e, cssText: r }, he[e] = t, t;
}
async function ge(e, t) {
  let n = e.cssText;
  const r = /url\(["']?([^"')]+)["']?\)/g, o = (n.match(/url\([^)]+\)/g) || []).map(async (i) => {
    let l = i.replace(r, "$1");
    return l.startsWith("https://") || (l = new URL(l, e.url).href), be(l, t.fetchRequestInit, ({ result: f }) => (n = n.replace(i, `url(${f})`), [i, f]));
  });
  return Promise.all(o).then(() => n);
}
function xe(e) {
  if (e == null)
    return [];
  const t = [], n = /(\/\*[\s\S]*?\*\/)/gi;
  let r = e.replace(n, "");
  const a = new RegExp("((@.*?keyframes [\\s\\S]*?){([\\s\\S]*?}\\s*?)})", "gi");
  for (; ; ) {
    const f = a.exec(r);
    if (f === null)
      break;
    t.push(f[0]);
  }
  r = r.replace(a, "");
  const o = /@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi, i = "((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})", l = new RegExp(i, "gi");
  for (; ; ) {
    let f = o.exec(r);
    if (f === null) {
      if (f = l.exec(r), f === null)
        break;
      o.lastIndex = l.lastIndex;
    } else
      l.lastIndex = o.lastIndex;
    t.push(f[0]);
  }
  return t;
}
async function pt(e, t) {
  const n = [], r = [];
  return e.forEach((a) => {
    if ("cssRules" in a)
      try {
        B(a.cssRules || []).forEach((o, i) => {
          if (o.type === CSSRule.IMPORT_RULE) {
            let l = i + 1;
            const f = o.href, A = me(f).then((U) => ge(U, t)).then((U) => xe(U).forEach((I) => {
              try {
                a.insertRule(I, I.startsWith("@import") ? l += 1 : a.cssRules.length);
              } catch (Z) {
                console.error("Error inserting rule from remote css", {
                  rule: I,
                  error: Z
                });
              }
            })).catch((U) => {
              console.error("Error loading remote css", U.toString());
            });
            r.push(A);
          }
        });
      } catch (o) {
        const i = e.find((l) => l.href == null) || document.styleSheets[0];
        a.href != null && r.push(me(a.href).then((l) => ge(l, t)).then((l) => xe(l).forEach((f) => {
          i.insertRule(f, i.cssRules.length);
        })).catch((l) => {
          console.error("Error loading remote stylesheet", l);
        })), console.error("Error inlining remote css file", o);
      }
  }), Promise.all(r).then(() => (e.forEach((a) => {
    if ("cssRules" in a)
      try {
        B(a.cssRules || []).forEach((o) => {
          n.push(o);
        });
      } catch (o) {
        console.error(`Error while reading CSS rules from ${a.href}`, o);
      }
  }), n));
}
function ht(e) {
  return e.filter((t) => t.type === CSSRule.FONT_FACE_RULE).filter((t) => Se(t.style.getPropertyValue("src")));
}
async function mt(e, t) {
  if (e.ownerDocument == null)
    throw new Error("Provided element is not within a Document");
  const n = B(e.ownerDocument.styleSheets), r = await pt(n, t);
  return ht(r);
}
function Ce(e) {
  return e.trim().replace(/["']/g, "");
}
function gt(e) {
  const t = /* @__PURE__ */ new Set();
  function n(r) {
    (r.style.fontFamily || getComputedStyle(r).fontFamily).split(",").forEach((o) => {
      t.add(Ce(o));
    }), Array.from(r.children).forEach((o) => {
      o instanceof HTMLElement && n(o);
    });
  }
  return n(e), t;
}
async function xt(e, t) {
  const n = await mt(e, t), r = gt(e);
  return (await Promise.all(n.filter((o) => r.has(Ce(o.style.fontFamily))).map((o) => {
    const i = o.parentStyleSheet ? o.parentStyleSheet.href : null;
    return ke(o.cssText, i, t);
  }))).join(`
`);
}
async function yt(e, t) {
  const n = t.fontEmbedCSS != null ? t.fontEmbedCSS : t.skipFonts ? null : await xt(e, t);
  if (n) {
    const r = document.createElement("style"), a = document.createTextNode(n);
    r.appendChild(a), e.firstChild ? e.insertBefore(r, e.firstChild) : e.appendChild(r);
  }
}
async function wt(e, t = {}) {
  const { width: n, height: r } = we(e, t), a = await Y(e, t, !0);
  return await yt(a, t), await Re(a, t), ft(a, t), await Ue(a, n, r);
}
async function bt(e, t = {}) {
  const { width: n, height: r } = we(e, t), a = await wt(e, t), o = await Q(a), i = document.createElement("canvas"), l = i.getContext("2d"), f = t.pixelRatio || Oe(), A = t.canvasWidth || n, U = t.canvasHeight || r;
  return i.width = A * f, i.height = U * f, t.skipAutoScale || De(i), i.style.width = `${A}`, i.style.height = `${U}`, t.backgroundColor && (l.fillStyle = t.backgroundColor, l.fillRect(0, 0, i.width, i.height)), l.drawImage(o, 0, 0, i.width, i.height), i;
}
async function vt(e, t = {}) {
  return (await bt(e, t)).toDataURL();
}
function Et(e) {
  var ae;
  const { useState: t, useRef: n, useCallback: r, useEffect: a } = e.React, o = 1280, i = 832;
  function l() {
    const [c, E] = t([]), [x, S] = t(!1), m = n(null), h = r((s, w) => {
      var C;
      (C = window.__awOpenAppWindow) == null || C.call(window, "presentations.viewer", s, w);
    }, []);
    a(() => (window.__awOpenPresentation = (s) => {
      const w = c.find((C) => C.id === s);
      h(s, w == null ? void 0 : w.title);
    }, () => {
      delete window.__awOpenPresentation;
    }), [c, h]), a(() => {
      var C;
      const s = (C = e.sdk.ws) == null ? void 0 : C.createSharedSocket;
      if (!s) {
        console.warn("[presentations] host.sdk.ws.createSharedSocket is unavailable (SPA too old for aw-ws/1 §9.1) — live updates disabled.");
        return;
      }
      return s({
        url: () => e.app.wsUrl("/ws"),
        initType: "presentation_init",
        onFrame: (p) => {
          if (p.type === "presentation_init") {
            E(p.presentations || []);
            return;
          }
          if (p.type === "presentation_update") {
            try {
              window.dispatchEvent(new CustomEvent("aw-presentation-update", { detail: p }));
            } catch {
            }
            p.action === "create" ? (E((y) => [...y.filter((k) => k.id !== p.presentation.id), p.presentation]), p.presentation.visible !== !1 && !p.silent && h(p.presentation.id, p.presentation.title)) : p.action === "update" ? E((y) => y.map((k) => k.id === p.presentation.id ? p.presentation : k)) : p.action === "delete" && E((y) => y.filter((k) => k.id !== p.id));
          }
        },
        onStatus: ({ state: p }) => {
          if (p === "fatal")
            try {
              window.dispatchEvent(new Event("aw-auth-failed"));
            } catch {
            }
        }
      }).retain();
    }, [h]);
    const F = r(() => {
      clearTimeout(m.current), S(!0);
    }, []), R = r(() => {
      clearTimeout(m.current), m.current = setTimeout(() => S(!1), 150);
    }, []);
    a(() => () => clearTimeout(m.current), []);
    const L = r(async (s) => {
      await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${s}`), { method: "DELETE" });
    }, []), b = [...c].sort((s, w) => (w.created_at || 0) - (s.created_at || 0));
    return /* @__PURE__ */ e.h("div", { className: "relative", onMouseEnter: F, onMouseLeave: R }, /* @__PURE__ */ e.h(
      "button",
      {
        onClick: () => S((s) => !s),
        className: "px-3 py-1 text-xs rounded transition-colors cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5"
      },
      "Presentation",
      b.length > 0 && /* @__PURE__ */ e.h("span", { className: "ml-1.5 inline-flex items-center justify-center min-w-[16px] h-[16px] rounded-full text-[9px] font-bold px-1 bg-[var(--color-accent)]/20 text-[var(--color-accent)]" }, b.length)
    ), x && /* @__PURE__ */ e.h(
      "div",
      {
        className: "absolute left-0 top-full mt-2 z-50 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-2xl p-3",
        style: { minWidth: 320, maxWidth: 720 }
      },
      b.length === 0 ? /* @__PURE__ */ e.h("div", { className: "px-4 py-6 text-center text-xs text-[var(--color-text-muted)] italic" }, "No presentations yet. Use ", /* @__PURE__ */ e.h("code", { className: "bg-white/10 px-1 rounded" }, "/aw-presentation"), " to create one.") : /* @__PURE__ */ e.h(e.React.Fragment, null, /* @__PURE__ */ e.h("div", { className: "text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2 px-1" }, "Presentations · newest first"), /* @__PURE__ */ e.h(
        "div",
        {
          className: "grid gap-2 overflow-y-auto",
          style: { gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", maxHeight: "70vh" }
        },
        b.map((s) => /* @__PURE__ */ e.h(
          f,
          {
            key: s.id,
            presentation: s,
            onClick: () => {
              S(!1), h(s.id, s.title);
            },
            onDelete: () => L(s.id)
          }
        ))
      ))
    ));
  }
  function f({ presentation: c, onClick: E, onDelete: x }) {
    const S = n(null), [m, h] = t(0.16), F = o, R = i, L = R / F;
    a(() => {
      const s = S.current;
      if (!s || typeof ResizeObserver > "u") return;
      const w = new ResizeObserver((C) => {
        for (const p of C) {
          const y = p.contentRect.width;
          y > 0 && h(y / F);
        }
      });
      return w.observe(s), () => w.disconnect();
    }, []);
    const b = c.created_at ? new Date(c.created_at * 1e3).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
    return /* @__PURE__ */ e.h(
      "div",
      {
        onClick: E,
        className: "group relative rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] overflow-hidden cursor-pointer hover:border-[var(--color-accent)] transition-colors",
        title: c.title
      },
      /* @__PURE__ */ e.h(
        "div",
        {
          ref: S,
          className: "relative bg-[var(--color-bg-primary)]",
          style: { width: "100%", paddingTop: `${L * 100}%`, overflow: "hidden" }
        },
        /* @__PURE__ */ e.h(
          "iframe",
          {
            src: e.app.absoluteApiUrl(`/presentations/${c.id}/html`),
            sandbox: "allow-same-origin",
            tabIndex: -1,
            "aria-hidden": !0,
            style: {
              position: "absolute",
              top: 0,
              left: 0,
              width: F,
              height: R,
              border: 0,
              pointerEvents: "none",
              transform: `scale(${m})`,
              transformOrigin: "top left"
            }
          }
        )
      ),
      /* @__PURE__ */ e.h("div", { className: "px-2 py-1.5 border-t border-[var(--color-border)]" }, /* @__PURE__ */ e.h("div", { className: "text-[11px] font-medium text-[var(--color-text-primary)] truncate" }, c.title || "Untitled"), Array.isArray(c.tags) && c.tags.length > 0 && /* @__PURE__ */ e.h("div", { className: "flex flex-wrap gap-0.5 mt-0.5 overflow-hidden", style: { maxHeight: 18 } }, c.tags.slice(0, 4).map((s) => /* @__PURE__ */ e.h(
        "span",
        {
          key: s,
          className: "text-[8px] font-mono leading-none px-1 py-[2px] rounded bg-white/5 border border-white/10 text-[var(--color-text-muted)] truncate",
          title: s
        },
        s
      )), c.tags.length > 4 && /* @__PURE__ */ e.h(
        "span",
        {
          className: "text-[8px] leading-none px-1 py-[2px] text-[var(--color-text-muted)]",
          title: c.tags.slice(4).join(", ")
        },
        "+",
        c.tags.length - 4
      )), b && /* @__PURE__ */ e.h("div", { className: "text-[9px] text-[var(--color-text-muted)] truncate mt-0.5" }, b)),
      /* @__PURE__ */ e.h(
        "button",
        {
          onClick: (s) => {
            s.stopPropagation(), x();
          },
          className: "hidden group-hover:flex absolute top-1 right-1 items-center justify-center w-5 h-5 rounded bg-black/60 text-white/80 hover:text-[var(--color-danger)] hover:bg-black/80",
          title: "Delete presentation"
        },
        /* @__PURE__ */ e.h("svg", { className: "w-3 h-3", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("path", { d: "M18 6L6 18M6 6l12 12" }))
      )
    );
  }
  const A = /* @__PURE__ */ new Map(), U = 640;
  function I(c, E, { onClose: x, onTitleChange: S } = {}) {
    const [m, h] = t(null), [F, R] = t(!1), [L, b] = t(null), [s, w] = t(!1), [C, p] = t(!1), [y, k] = t(null), W = r(async () => {
      if (c)
        try {
          const d = await (await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${c}`))).json();
          if ((d == null ? void 0 : d.success) === !1) return;
          h(d);
        } catch {
        }
    }, [c]);
    a(() => {
      W();
    }, [W]), a(() => {
      const g = (d) => {
        var _;
        const u = d.detail;
        !u || u.type !== "presentation_update" || (u.action === "delete" && u.id === c ? x == null || x() : (u.action === "update" || u.action === "create") && ((_ = u.presentation) == null ? void 0 : _.id) === c && h(u.presentation));
      };
      return window.addEventListener("aw-presentation-update", g), () => window.removeEventListener("aw-presentation-update", g);
    }, [c, x]);
    const P = c ? e.app.absoluteApiUrl(`/presentations/${c}/html`) : null, H = r((g) => {
      const d = document.createElement("a");
      d.download = `${((m == null ? void 0 : m.title) || "presentation").replace(/[^a-zA-Z0-9_-]/g, "_")}.png`, d.href = g, d.click();
    }, [m == null ? void 0 : m.title]), j = r(async () => {
      var g;
      k(null), p(!0);
      try {
        const d = (g = A.get(E)) == null ? void 0 : g.contentDocument;
        if (d && d.body) {
          const u = await vt(d.documentElement, {
            backgroundColor: "#111318",
            pixelRatio: 2,
            width: d.documentElement.scrollWidth,
            height: d.documentElement.scrollHeight
          });
          H(u);
          return;
        }
        throw new Error("presentation content is not accessible from this window (cross-origin iframe)");
      } catch (d) {
        console.warn("Client-side export failed, falling back to server render:", d);
        try {
          const u = await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${c}/export`), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
          }), _ = await u.json().catch(() => null);
          if (!u.ok || !(_ != null && _.data_url))
            throw new Error((_ == null ? void 0 : _.detail) || `export failed (${u.status})`);
          H(_.data_url);
        } catch (u) {
          console.error("Export failed:", u), k(u.message || "Export failed");
        }
      } finally {
        p(!1);
      }
    }, [c, H, E]), v = r((g) => {
      var d;
      if (S) {
        S(g);
        return;
      }
      (d = window.__awOpenAppWindow) == null || d.call(window, "presentations.viewer", c, g);
    }, [S, c]), M = r(async (g) => {
      const d = (g || "").trim();
      !d || d === (m == null ? void 0 : m.title) || (await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${c}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: d })
      }), h((u) => u && { ...u, title: d }), v(d));
    }, [m == null ? void 0 : m.title, c, v]), O = r(async (g) => {
      if (c) {
        R(!0), b(null);
        try {
          const u = await (await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${c}/share`), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expires_in: g })
          })).json();
          u.success && u.token && b(`${P}?token=${u.token}`);
        } catch (d) {
          console.error("Share failed:", d);
        } finally {
          R(!1);
        }
      }
    }, [c, P]), N = r(() => {
      var g;
      L && ((g = navigator.clipboard) == null || g.writeText(L).then(() => {
        w(!0), setTimeout(() => w(!1), 2e3);
      }).catch(() => {
      }));
    }, [L]), X = r(async () => {
      await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${c}`), { method: "DELETE" }), x == null || x();
    }, [c, x]), G = r(({ asTab: g = !1 } = {}) => {
      if (P) {
        if (g) {
          window.open(P, "_blank");
          return;
        }
        window.open(P, `presentation-${c}`, "popup=1,width=1000,height=700");
      }
    }, [P, c]);
    return {
      presentation: m,
      htmlUrl: P,
      shareLink: L,
      setShareLink: b,
      shareLoading: F,
      shareCopied: s,
      handleCreateShare: O,
      handleCopy: N,
      exportLoading: C,
      exportError: y,
      setExportError: k,
      handleExport: j,
      commitRename: M,
      handleDelete: X,
      popOut: G
    };
  }
  function Z({ windowKey: c, instanceId: E, onClose: x, onTitleChange: S }) {
    const m = E, {
      presentation: h,
      htmlUrl: F,
      shareLink: R,
      setShareLink: L,
      shareLoading: b,
      shareCopied: s,
      handleCreateShare: w,
      handleCopy: C,
      exportLoading: p,
      exportError: y,
      setExportError: k,
      handleExport: W,
      commitRename: P,
      handleDelete: H,
      popOut: j
    } = I(m, c, { onClose: x, onTitleChange: S }), [v, M] = t(!1), [O, N] = t(""), [X, G] = t(!1);
    a(() => {
      v || N((h == null ? void 0 : h.title) || "");
    }, [h == null ? void 0 : h.title, v]);
    const g = n(null), d = n(null), [u, _] = t(null), oe = r((T) => {
      var V;
      const z = (V = T.current) == null ? void 0 : V.getBoundingClientRect();
      z && _({ top: z.bottom + 6, right: window.innerWidth - z.right });
    }, []), ie = r(() => {
      M(!1), P(O);
    }, [P, O]);
    return a(() => {
      if (!v && !X && !y) return;
      const T = (V) => {
        var le, ce, se, ue;
        (le = g.current) != null && le.contains(V.target) || (ce = d.current) != null && ce.contains(V.target) || (ue = (se = V.target).closest) != null && ue.call(se, "[data-pres-popover]") || (M(!1), G(!1), k(null));
      }, z = (V) => {
        V.key === "Escape" && (M(!1), G(!1), k(null));
      };
      return document.addEventListener("mousedown", T), document.addEventListener("keydown", z), () => {
        document.removeEventListener("mousedown", T), document.removeEventListener("keydown", z);
      };
    }, [v, X, y, k]), /* @__PURE__ */ e.h(e.React.Fragment, null, /* @__PURE__ */ e.h(
      "button",
      {
        ref: g,
        onClick: () => {
          G(!1), M((T) => T ? !1 : (N((h == null ? void 0 : h.title) || ""), oe(g), !0));
        },
        className: "p-1 rounded hover:bg-white/10 text-[var(--color-text-muted)]",
        title: "Rename presentation"
      },
      /* @__PURE__ */ e.h("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("path", { d: "M12 20h9" }), /* @__PURE__ */ e.h("path", { d: "M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z" }))
    ), /* @__PURE__ */ e.h(
      "button",
      {
        ref: d,
        onClick: () => {
          M(!1), L(null), setShareCopied(!1), G((T) => T ? !1 : (oe(d), !0));
        },
        className: "p-1 rounded hover:bg-white/10 text-[var(--color-text-muted)]",
        title: "Share presentation"
      },
      /* @__PURE__ */ e.h("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("circle", { cx: "18", cy: "5", r: "3" }), /* @__PURE__ */ e.h("circle", { cx: "6", cy: "12", r: "3" }), /* @__PURE__ */ e.h("circle", { cx: "18", cy: "19", r: "3" }), /* @__PURE__ */ e.h("path", { d: "M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" }))
    ), /* @__PURE__ */ e.h(
      "button",
      {
        onClick: () => j(),
        className: "p-1 rounded hover:bg-white/10 text-[var(--color-text-muted)]",
        title: "Pop out to new window"
      },
      /* @__PURE__ */ e.h("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("path", { d: "M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" }), /* @__PURE__ */ e.h("polyline", { points: "15 3 21 3 21 9" }), /* @__PURE__ */ e.h("line", { x1: "10", y1: "14", x2: "21", y2: "3" }))
    ), /* @__PURE__ */ e.h(
      "button",
      {
        onClick: W,
        disabled: p,
        className: `p-1 rounded ${p ? "opacity-50 cursor-wait" : "hover:bg-white/10 cursor-pointer"} ${y ? "text-[var(--color-danger)]" : "text-[var(--color-text-muted)]"}`,
        title: y ? `Export failed: ${y}` : "Export as PNG"
      },
      /* @__PURE__ */ e.h("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("path", { d: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" }), /* @__PURE__ */ e.h("polyline", { points: "7 10 12 15 17 10" }), /* @__PURE__ */ e.h("line", { x1: "12", y1: "15", x2: "12", y2: "3" }))
    ), /* @__PURE__ */ e.h(
      "button",
      {
        onClick: H,
        className: "p-1 rounded hover:bg-white/10 text-[var(--color-text-muted)] hover:text-[var(--color-danger)]",
        title: "Delete presentation"
      },
      /* @__PURE__ */ e.h("svg", { width: "14", height: "14", viewBox: "0 0 16 16", fill: "currentColor" }, /* @__PURE__ */ e.h("path", { d: "M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" }), /* @__PURE__ */ e.h("path", { fillRule: "evenodd", d: "M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2h3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1h3a1 1 0 0 1 1 1z" }))
    ), v && u && e.ReactDOM.createPortal(
      /* @__PURE__ */ e.h(
        "div",
        {
          "data-pres-popover": !0,
          className: "fixed z-[1000] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-2xl p-3",
          style: { top: u.top, right: u.right, minWidth: 260 }
        },
        /* @__PURE__ */ e.h("div", { className: "text-[11px] font-medium text-[var(--color-text-primary)] mb-2" }, "Rename presentation"),
        /* @__PURE__ */ e.h(
          "input",
          {
            autoFocus: !0,
            value: O,
            onChange: (T) => N(T.target.value),
            onKeyDown: (T) => {
              T.key === "Enter" && ie(), T.key === "Escape" && (M(!1), N((h == null ? void 0 : h.title) || ""));
            },
            className: "w-full text-[11px] bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2 py-1 text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
          }
        ),
        /* @__PURE__ */ e.h("div", { className: "flex justify-end mt-2" }, /* @__PURE__ */ e.h(
          "button",
          {
            onClick: ie,
            disabled: !O.trim(),
            className: "text-[11px] px-2 py-1 rounded bg-[var(--color-accent)]/20 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/30 transition-colors disabled:opacity-40"
          },
          "Rename"
        ))
      ),
      document.body
    ), X && u && e.ReactDOM.createPortal(
      /* @__PURE__ */ e.h(
        "div",
        {
          "data-pres-popover": !0,
          className: "fixed z-[1000] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-2xl p-3",
          style: { top: u.top, right: u.right, minWidth: 260 }
        },
        /* @__PURE__ */ e.h("div", { className: "text-[11px] font-medium text-[var(--color-text-primary)] mb-2" }, "Share presentation"),
        b ? /* @__PURE__ */ e.h("div", { className: "text-[11px] text-[var(--color-text-muted)] py-2 text-center" }, "Generating link…") : R ? /* @__PURE__ */ e.h("div", { className: "flex flex-col gap-2" }, /* @__PURE__ */ e.h("div", { className: "text-[10px] text-[var(--color-text-muted)]" }, "Link generated:"), /* @__PURE__ */ e.h("div", { className: "flex items-center gap-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2 py-1.5" }, /* @__PURE__ */ e.h("span", { className: "text-[10px] font-mono text-[var(--color-text-primary)] truncate flex-1", title: R }, R), /* @__PURE__ */ e.h("button", { onClick: C, className: "shrink-0 text-[10px] px-2 py-0.5 rounded bg-[var(--color-accent)]/20 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/30 transition-colors" }, s ? "✓ Copied" : "Copy")), /* @__PURE__ */ e.h("button", { onClick: () => L(null), className: "text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-left" }, "← Generate new link")) : /* @__PURE__ */ e.h("div", { className: "flex flex-col gap-1.5" }, /* @__PURE__ */ e.h("div", { className: "text-[10px] text-[var(--color-text-muted)] mb-1" }, "Link expires after:"), [{ label: "1 hour", value: 3600 }, { label: "1 day", value: 86400 }, { label: "Never expires", value: null }].map(({ label: T, value: z }) => /* @__PURE__ */ e.h(
          "button",
          {
            key: T,
            onClick: () => w(z),
            className: "text-left text-[11px] px-3 py-1.5 rounded bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-colors"
          },
          T
        )))
      ),
      document.body
    ), y && u && e.ReactDOM.createPortal(
      // The `title` attribute never surfaces on touch devices (iOS Safari
      // shows no hover tooltip on tap), so a red icon with no visible
      // reason reads as "broken, does nothing" — this makes it tappable.
      /* @__PURE__ */ e.h(
        "div",
        {
          "data-pres-popover": !0,
          className: "fixed z-[1000] bg-[var(--color-bg-secondary)] border border-[var(--color-danger)]/40 rounded-lg shadow-2xl p-3",
          style: { top: u.top, right: u.right, minWidth: 220, maxWidth: 280 }
        },
        /* @__PURE__ */ e.h("div", { className: "text-[11px] font-medium text-[var(--color-danger)] mb-1" }, "Export failed"),
        /* @__PURE__ */ e.h("div", { className: "text-[10px] text-[var(--color-text-muted)] mb-2" }, y),
        /* @__PURE__ */ e.h(
          "button",
          {
            onClick: () => k(null),
            className: "text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          },
          "Dismiss"
        )
      ),
      document.body
    ));
  }
  function Pe({ actions: c, onDismiss: E }) {
    const {
      presentation: x,
      shareLink: S,
      setShareLink: m,
      shareLoading: h,
      shareCopied: F,
      handleCreateShare: R,
      handleCopy: L,
      exportLoading: b,
      exportError: s,
      setExportError: w,
      handleExport: C,
      commitRename: p,
      handleDelete: y,
      popOut: k
    } = c, [W, P] = t("menu"), [H, j] = t((x == null ? void 0 : x.title) || ""), v = {
      display: "flex",
      alignItems: "center",
      gap: 12,
      width: "100%",
      minHeight: 44,
      padding: "0 16px",
      background: "transparent",
      border: 0,
      color: "var(--color-text-primary)",
      fontSize: 14,
      textAlign: "left",
      cursor: "pointer"
    }, M = {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 20,
      background: "var(--color-bg-secondary)",
      borderTop: "1px solid var(--color-border)",
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      paddingTop: 8,
      paddingBottom: 8,
      maxHeight: "80%",
      overflowY: "auto"
    };
    return /* @__PURE__ */ e.h(e.React.Fragment, null, /* @__PURE__ */ e.h(
      "div",
      {
        onClick: E,
        style: { position: "absolute", inset: 0, zIndex: 19, background: "rgba(0,0,0,0.45)" }
      }
    ), /* @__PURE__ */ e.h("div", { style: M, role: "menu" }, W === "menu" && /* @__PURE__ */ e.h(e.React.Fragment, null, /* @__PURE__ */ e.h("button", { style: v, onClick: () => {
      m(null), P("share");
    } }, "Share"), /* @__PURE__ */ e.h(
      "button",
      {
        style: { ...v, opacity: b ? 0.5 : 1 },
        disabled: b,
        onClick: C
      },
      b ? "Exporting…" : "Export as PNG"
    ), /* @__PURE__ */ e.h("button", { style: v, onClick: () => {
      j((x == null ? void 0 : x.title) || ""), P("rename");
    } }, "Rename"), /* @__PURE__ */ e.h("button", { style: v, onClick: () => {
      k({ asTab: !0 }), E();
    } }, "Open in new tab"), /* @__PURE__ */ e.h(
      "button",
      {
        style: { ...v, color: "var(--color-danger)" },
        onClick: () => {
          y(), E();
        }
      },
      "Delete"
    ), s && /* @__PURE__ */ e.h("div", { style: { padding: "8px 16px", fontSize: 12, color: "var(--color-danger)" } }, "Export failed: ", s, /* @__PURE__ */ e.h(
      "button",
      {
        onClick: () => w(null),
        style: { ...v, minHeight: 36, padding: 0, marginTop: 4, fontSize: 12, color: "var(--color-text-muted)" }
      },
      "Dismiss"
    ))), W === "share" && /* @__PURE__ */ e.h("div", { style: { padding: "8px 16px 4px" } }, /* @__PURE__ */ e.h("div", { style: { fontSize: 12, color: "var(--color-text-muted)", marginBottom: 8 } }, S ? "Link generated:" : "Link expires after:"), h ? /* @__PURE__ */ e.h("div", { style: { fontSize: 13, color: "var(--color-text-muted)", padding: "12px 0" } }, "Generating link…") : S ? /* @__PURE__ */ e.h(e.React.Fragment, null, /* @__PURE__ */ e.h("div", { style: {
      fontSize: 11,
      fontFamily: "monospace",
      wordBreak: "break-all",
      background: "var(--color-bg-primary)",
      border: "1px solid var(--color-border)",
      borderRadius: 6,
      padding: 8,
      color: "var(--color-text-primary)"
    } }, S), /* @__PURE__ */ e.h("button", { style: { ...v, padding: 0, color: "var(--color-accent)" }, onClick: L }, F ? "✓ Copied" : "Copy link")) : [{ label: "1 hour", value: 3600 }, { label: "1 day", value: 86400 }, { label: "Never expires", value: null }].map(({ label: O, value: N }) => /* @__PURE__ */ e.h("button", { key: O, style: { ...v, padding: 0 }, onClick: () => R(N) }, O)), /* @__PURE__ */ e.h("button", { style: { ...v, padding: 0, color: "var(--color-text-muted)" }, onClick: () => P("menu") }, "← Back")), W === "rename" && /* @__PURE__ */ e.h("div", { style: { padding: "8px 16px 4px" } }, /* @__PURE__ */ e.h("div", { style: { fontSize: 12, color: "var(--color-text-muted)", marginBottom: 8 } }, "Rename presentation"), /* @__PURE__ */ e.h(
      "input",
      {
        autoFocus: !0,
        value: H,
        onChange: (O) => j(O.target.value),
        onKeyDown: (O) => {
          O.key === "Enter" && (p(H), E());
        },
        style: {
          // 16px, not smaller: iOS Safari zooms the whole page in on
          // any focused field below that.
          width: "100%",
          minHeight: 44,
          fontSize: 16,
          padding: "0 10px",
          background: "var(--color-bg-primary)",
          color: "var(--color-text-primary)",
          border: "1px solid var(--color-border)",
          borderRadius: 6,
          outline: "none"
        }
      }
    ), /* @__PURE__ */ e.h("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ e.h("button", { style: { ...v, color: "var(--color-text-muted)" }, onClick: () => P("menu") }, "Cancel"), /* @__PURE__ */ e.h(
      "button",
      {
        style: { ...v, color: "var(--color-accent)", justifyContent: "flex-end" },
        disabled: !H.trim(),
        onClick: () => {
          p(H), E();
        }
      },
      "Rename"
    )))));
  }
  function Te({ windowKey: c, instanceId: E, onClose: x, onTitleChange: S }) {
    const m = E, h = n(null), F = n(null), [R, L] = t(!1), [b, s] = t(!1), w = I(m, c, { onClose: x, onTitleChange: S }), { htmlUrl: C } = w;
    return a(() => {
      const p = F.current;
      if (!p || typeof ResizeObserver > "u") return;
      const y = new ResizeObserver((k) => {
        for (const W of k) {
          const P = W.contentRect.width;
          P > 0 && L(P < U);
        }
      });
      return y.observe(p), () => y.disconnect();
    }, []), a(() => {
      R || s(!1);
    }, [R]), a(() => (A.set(c, h.current), () => A.delete(c)), [c]), /* @__PURE__ */ e.h("div", { ref: F, className: "flex flex-col bg-[var(--color-bg-secondary)] h-full" }, /* @__PURE__ */ e.h("div", { className: "flex-1 relative" }, C && // allow-scripts only, deliberately NOT allow-same-origin: presentation
    // HTML is agent-generated and can be hostile/compromised. Without
    // allow-same-origin the frame is an opaque origin — scripts run, but
    // can't read this API host's cookies/localStorage or ride an
    // authenticated same-origin request. A relative fetch inside a
    // presentation would need to resolve via an absolute URL instead.
    /* @__PURE__ */ e.h("iframe", { ref: h, src: C, sandbox: "allow-scripts", className: "absolute inset-0 w-full h-full bg-white border-0", title: "Presentation" }), R && !b && /* @__PURE__ */ e.h(
      "button",
      {
        onClick: () => s(!0),
        "aria-label": "Presentation actions",
        style: {
          position: "absolute",
          bottom: 16,
          right: 16,
          zIndex: 18,
          width: 48,
          height: 48,
          borderRadius: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--color-bg-secondary)",
          border: "1px solid var(--color-border)",
          color: "var(--color-text-primary)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          cursor: "pointer"
        }
      },
      /* @__PURE__ */ e.h("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "currentColor" }, /* @__PURE__ */ e.h("circle", { cx: "12", cy: "5", r: "2" }), /* @__PURE__ */ e.h("circle", { cx: "12", cy: "12", r: "2" }), /* @__PURE__ */ e.h("circle", { cx: "12", cy: "19", r: "2" }))
    ), R && b && /* @__PURE__ */ e.h(Pe, { actions: w, onDismiss: () => s(!1) })));
  }
  e.registerSlot("core.nav", l), e.registerWindow("presentations.viewer", Te), (ae = e.registerWindowActions) == null || ae.call(e, "presentations.viewer", Z);
}
export {
  Et as default,
  Et as register
};
