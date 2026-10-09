function $e(e, t) {
  if (e.match(/^[a-z]+:\/\//i))
    return e;
  if (e.match(/^\/\//))
    return window.location.protocol + e;
  if (e.match(/^[a-z]+:/i))
    return e;
  const n = document.implementation.createHTMLDocument(), r = n.createElement("base"), a = n.createElement("a");
  return n.head.appendChild(r), n.body.appendChild(a), t && (r.href = t), a.href = e, a.href;
}
const Ae = /* @__PURE__ */ (() => {
  let e = 0;
  const t = () => (
    // eslint-disable-next-line no-bitwise
    `0000${(Math.random() * 36 ** 4 << 0).toString(36)}`.slice(-4)
  );
  return () => (e += 1, `u${t()}${e}`);
})();
function G(e) {
  const t = [];
  for (let n = 0, r = e.length; n < r; n++)
    t.push(e[n]);
  return t;
}
let J = null;
function ye(e = {}) {
  return J || (e.includeStyleProperties ? (J = e.includeStyleProperties, J) : (J = G(window.getComputedStyle(document.documentElement)), J));
}
function Q(e, t) {
  const r = (e.ownerDocument.defaultView || window).getComputedStyle(e).getPropertyValue(t);
  return r ? parseFloat(r.replace("px", "")) : 0;
}
function Oe(e) {
  const t = Q(e, "border-left-width"), n = Q(e, "border-right-width");
  return e.clientWidth + t + n;
}
function Fe(e) {
  const t = Q(e, "border-top-width"), n = Q(e, "border-bottom-width");
  return e.clientHeight + t + n;
}
function we(e, t = {}) {
  const n = t.width || Oe(e), r = t.height || Fe(e);
  return { width: n, height: r };
}
function _e() {
  let e, t;
  try {
    t = process;
  } catch {
  }
  const n = t && t.env ? t.env.devicePixelRatio : null;
  return n && (e = parseInt(n, 10), Number.isNaN(e) && (e = 1)), e || window.devicePixelRatio || 1;
}
const W = 16384;
function De(e) {
  (e.width > W || e.height > W) && (e.width > W && e.height > W ? e.width > e.height ? (e.height *= W / e.width, e.width = W) : (e.width *= W / e.height, e.height = W) : e.width > W ? (e.height *= W / e.width, e.width = W) : (e.width *= W / e.height, e.height = W));
}
function Y(e) {
  return new Promise((t, n) => {
    const r = new Image();
    r.onload = () => {
      r.decode().then(() => {
        requestAnimationFrame(() => t(r));
      });
    }, r.onerror = n, r.crossOrigin = "anonymous", r.decoding = "async", r.src = e;
  });
}
async function Ne(e) {
  return Promise.resolve().then(() => new XMLSerializer().serializeToString(e)).then(encodeURIComponent).then((t) => `data:image/svg+xml;charset=utf-8,${t}`);
}
async function Ue(e, t, n) {
  const r = "http://www.w3.org/2000/svg", a = document.createElementNS(r, "svg"), o = document.createElementNS(r, "foreignObject");
  return a.setAttribute("width", `${t}`), a.setAttribute("height", `${n}`), a.setAttribute("viewBox", `0 0 ${t} ${n}`), o.setAttribute("width", "100%"), o.setAttribute("height", "100%"), o.setAttribute("x", "0"), o.setAttribute("y", "0"), o.setAttribute("externalResourcesRequired", "true"), a.appendChild(o), o.appendChild(e), Ne(a);
}
const N = (e, t) => {
  if (e instanceof t)
    return !0;
  const n = Object.getPrototypeOf(e);
  return n === null ? !1 : n.constructor.name === t.name || N(n, t);
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
function ze(e, t, n, r) {
  const a = `.${e}:${t}`, o = n.cssText ? We(n) : He(n, r);
  return document.createTextNode(`${a}{${o}}`);
}
function de(e, t, n, r) {
  const a = window.getComputedStyle(e, n), o = a.getPropertyValue("content");
  if (o === "" || o === "none")
    return;
  const i = Ae();
  try {
    t.className = `${t.className} ${i}`;
  } catch {
    return;
  }
  const c = document.createElement("style");
  c.appendChild(ze(i, n, a, r)), t.appendChild(c);
}
function Me(e, t, n) {
  de(e, t, ":before", n), de(e, t, ":after", n);
}
const fe = "application/font-woff", pe = "image/jpeg", Ve = {
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
function Be(e) {
  const t = /\.([^./]*?)$/g.exec(e);
  return t ? t[1] : "";
}
function re(e) {
  const t = Be(e).toLowerCase();
  return Ve[t] || "";
}
function je(e) {
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
    const c = new FileReader();
    c.onerror = i, c.onloadend = () => {
      try {
        o(n({ res: r, result: c.result }));
      } catch (p) {
        i(p);
      }
    }, c.readAsDataURL(a);
  });
}
const ee = {};
function Ge(e, t, n) {
  let r = e.replace(/\?.*/, "");
  return n && (r = e), /ttf|otf|eot|woff2?/i.test(r) && (r = r.replace(/.*\//, "")), t ? `[${t}]${r}` : r;
}
async function ne(e, t, n) {
  const r = Ge(e, t, n.includeQueryParams);
  if (ee[r] != null)
    return ee[r];
  n.cacheBust && (e += (/\?/.test(e) ? "&" : "?") + (/* @__PURE__ */ new Date()).getTime());
  let a;
  try {
    const o = await be(e, n.fetchRequestInit, ({ res: i, result: c }) => (t || (t = i.headers.get("Content-Type") || ""), je(c)));
    a = Ie(o, t);
  } catch (o) {
    a = n.imagePlaceholder || "";
    let i = `Failed to fetch resource: ${e}`;
    o && (i = typeof o == "string" ? o : o.message), i && console.warn(i);
  }
  return ee[r] = a, a;
}
async function qe(e) {
  const t = e.toDataURL();
  return t === "data:," ? e.cloneNode(!1) : Y(t);
}
async function Je(e, t) {
  if (e.currentSrc) {
    const o = document.createElement("canvas"), i = o.getContext("2d");
    o.width = e.clientWidth, o.height = e.clientHeight, i == null || i.drawImage(e, 0, 0, o.width, o.height);
    const c = o.toDataURL();
    return Y(c);
  }
  const n = e.poster, r = re(n), a = await ne(n, r, t);
  return Y(a);
}
async function Xe(e, t) {
  var n;
  try {
    if (!((n = e == null ? void 0 : e.contentDocument) === null || n === void 0) && n.body)
      return await Z(e.contentDocument.body, t, !0);
  } catch {
  }
  return e.cloneNode(!1);
}
async function Ke(e, t) {
  return N(e, HTMLCanvasElement) ? qe(e) : N(e, HTMLVideoElement) ? Je(e, t) : N(e, HTMLIFrameElement) ? Xe(e, t) : e.cloneNode(ve(e));
}
const Qe = (e) => e.tagName != null && e.tagName.toUpperCase() === "SLOT", ve = (e) => e.tagName != null && e.tagName.toUpperCase() === "SVG";
async function Ye(e, t, n) {
  var r, a;
  if (ve(t))
    return t;
  let o = [];
  return Qe(e) && e.assignedNodes ? o = G(e.assignedNodes()) : N(e, HTMLIFrameElement) && (!((r = e.contentDocument) === null || r === void 0) && r.body) ? o = G(e.contentDocument.body.childNodes) : o = G(((a = e.shadowRoot) !== null && a !== void 0 ? a : e).childNodes), o.length === 0 || N(e, HTMLVideoElement) || await o.reduce((i, c) => i.then(() => Z(c, n)).then((p) => {
    p && t.appendChild(p);
  }), Promise.resolve()), t;
}
function Ze(e, t, n) {
  const r = t.style;
  if (!r)
    return;
  const a = window.getComputedStyle(e);
  a.cssText ? (r.cssText = a.cssText, r.transformOrigin = a.transformOrigin) : ye(n).forEach((o) => {
    let i = a.getPropertyValue(o);
    o === "font-size" && i.endsWith("px") && (i = `${Math.floor(parseFloat(i.substring(0, i.length - 2))) - 0.1}px`), N(e, HTMLIFrameElement) && o === "display" && i === "inline" && (i = "block"), o === "d" && t.getAttribute("d") && (i = `path(${t.getAttribute("d")})`), r.setProperty(o, i, a.getPropertyPriority(o));
  });
}
function et(e, t) {
  N(e, HTMLTextAreaElement) && (t.innerHTML = e.value), N(e, HTMLInputElement) && t.setAttribute("value", e.value);
}
function tt(e, t) {
  if (N(e, HTMLSelectElement)) {
    const n = t, r = Array.from(n.children).find((a) => e.value === a.getAttribute("value"));
    r && r.setAttribute("selected", "");
  }
}
function rt(e, t, n) {
  return N(t, Element) && (Ze(e, t, n), Me(e, t, n), et(e, t), tt(e, t)), t;
}
async function nt(e, t) {
  const n = e.querySelectorAll ? e.querySelectorAll("use") : [];
  if (n.length === 0)
    return e;
  const r = {};
  for (let o = 0; o < n.length; o++) {
    const c = n[o].getAttribute("xlink:href");
    if (c) {
      const p = e.querySelector(c), V = document.querySelector(c);
      !p && V && !r[c] && (r[c] = await Z(V, t, !0));
    }
  }
  const a = Object.values(r);
  if (a.length) {
    const o = "http://www.w3.org/1999/xhtml", i = document.createElementNS(o, "svg");
    i.setAttribute("xmlns", o), i.style.position = "absolute", i.style.width = "0", i.style.height = "0", i.style.overflow = "hidden", i.style.display = "none";
    const c = document.createElementNS(o, "defs");
    i.appendChild(c);
    for (let p = 0; p < a.length; p++)
      c.appendChild(a[p]);
    e.appendChild(i);
  }
  return e;
}
async function Z(e, t, n) {
  return !n && t.filter && !t.filter(e) ? null : Promise.resolve(e).then((r) => Ke(r, t)).then((r) => Ye(e, r, t)).then((r) => rt(e, r, t)).then((r) => nt(r, t));
}
const Ee = /url\((['"]?)([^'"]+?)\1\)/g, at = /url\([^)]+\)\s*format\((["']?)([^"']+)\1\)/g, ot = /src:\s*(?:url\([^)]+\)\s*format\([^)]+\)[,;]\s*)+/g;
function it(e) {
  const t = e.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1");
  return new RegExp(`(url\\(['"]?)(${t})(['"]?\\))`, "g");
}
function ct(e) {
  const t = [];
  return e.replace(Ee, (n, r, a) => (t.push(a), n)), t.filter((n) => !te(n));
}
async function lt(e, t, n, r, a) {
  try {
    const o = n ? $e(t, n) : t, i = re(t);
    let c;
    return a || (c = await ne(o, i, r)), e.replace(it(t), `$1${c}$3`);
  } catch {
  }
  return e;
}
function st(e, { preferredFontFormat: t }) {
  return t ? e.replace(ot, (n) => {
    for (; ; ) {
      const [r, , a] = at.exec(n) || [];
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
  const r = st(e, n);
  return ct(r).reduce((o, i) => o.then((c) => lt(c, i, t, n)), Promise.resolve(r));
}
async function X(e, t, n) {
  var r;
  const a = (r = t.style) === null || r === void 0 ? void 0 : r.getPropertyValue(e);
  if (a) {
    const o = await ke(a, null, n);
    return t.style.setProperty(e, o, t.style.getPropertyPriority(e)), !0;
  }
  return !1;
}
async function ut(e, t) {
  await X("background", e, t) || await X("background-image", e, t), await X("mask", e, t) || await X("-webkit-mask", e, t) || await X("mask-image", e, t) || await X("-webkit-mask-image", e, t);
}
async function dt(e, t) {
  const n = N(e, HTMLImageElement);
  if (!(n && !te(e.src)) && !(N(e, SVGImageElement) && !te(e.href.baseVal)))
    return;
  const r = n ? e.src : e.href.baseVal, a = await ne(r, re(r), t);
  await new Promise((o, i) => {
    e.onload = o, e.onerror = t.onImageErrorHandler ? (...p) => {
      try {
        o(t.onImageErrorHandler(...p));
      } catch (V) {
        i(V);
      }
    } : i;
    const c = e;
    c.decode && (c.decode = o), c.loading === "lazy" && (c.loading = "eager"), n ? (e.srcset = "", e.src = a) : e.href.baseVal = a;
  });
}
async function ft(e, t) {
  const r = G(e.childNodes).map((a) => Re(a, t));
  await Promise.all(r).then(() => e);
}
async function Re(e, t) {
  N(e, Element) && (await ut(e, t), await dt(e, t), await ft(e, t));
}
function pt(e, t) {
  const { style: n } = e;
  t.backgroundColor && (n.backgroundColor = t.backgroundColor), t.width && (n.width = `${t.width}px`), t.height && (n.height = `${t.height}px`);
  const r = t.style;
  return r != null && Object.keys(r).forEach((a) => {
    n[a] = r[a];
  }), e;
}
const me = {};
async function he(e) {
  let t = me[e];
  if (t != null)
    return t;
  const r = await (await fetch(e)).text();
  return t = { url: e, cssText: r }, me[e] = t, t;
}
async function ge(e, t) {
  let n = e.cssText;
  const r = /url\(["']?([^"')]+)["']?\)/g, o = (n.match(/url\([^)]+\)/g) || []).map(async (i) => {
    let c = i.replace(r, "$1");
    return c.startsWith("https://") || (c = new URL(c, e.url).href), be(c, t.fetchRequestInit, ({ result: p }) => (n = n.replace(i, `url(${p})`), [i, p]));
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
    const p = a.exec(r);
    if (p === null)
      break;
    t.push(p[0]);
  }
  r = r.replace(a, "");
  const o = /@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi, i = "((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})", c = new RegExp(i, "gi");
  for (; ; ) {
    let p = o.exec(r);
    if (p === null) {
      if (p = c.exec(r), p === null)
        break;
      o.lastIndex = c.lastIndex;
    } else
      c.lastIndex = o.lastIndex;
    t.push(p[0]);
  }
  return t;
}
async function mt(e, t) {
  const n = [], r = [];
  return e.forEach((a) => {
    if ("cssRules" in a)
      try {
        G(a.cssRules || []).forEach((o, i) => {
          if (o.type === CSSRule.IMPORT_RULE) {
            let c = i + 1;
            const p = o.href, V = he(p).then((H) => ge(H, t)).then((H) => xe(H).forEach((q) => {
              try {
                a.insertRule(q, q.startsWith("@import") ? c += 1 : a.cssRules.length);
              } catch (K) {
                console.error("Error inserting rule from remote css", {
                  rule: q,
                  error: K
                });
              }
            })).catch((H) => {
              console.error("Error loading remote css", H.toString());
            });
            r.push(V);
          }
        });
      } catch (o) {
        const i = e.find((c) => c.href == null) || document.styleSheets[0];
        a.href != null && r.push(he(a.href).then((c) => ge(c, t)).then((c) => xe(c).forEach((p) => {
          i.insertRule(p, i.cssRules.length);
        })).catch((c) => {
          console.error("Error loading remote stylesheet", c);
        })), console.error("Error inlining remote css file", o);
      }
  }), Promise.all(r).then(() => (e.forEach((a) => {
    if ("cssRules" in a)
      try {
        G(a.cssRules || []).forEach((o) => {
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
async function gt(e, t) {
  if (e.ownerDocument == null)
    throw new Error("Provided element is not within a Document");
  const n = G(e.ownerDocument.styleSheets), r = await mt(n, t);
  return ht(r);
}
function Ce(e) {
  return e.trim().replace(/["']/g, "");
}
function xt(e) {
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
async function yt(e, t) {
  const n = await gt(e, t), r = xt(e);
  return (await Promise.all(n.filter((o) => r.has(Ce(o.style.fontFamily))).map((o) => {
    const i = o.parentStyleSheet ? o.parentStyleSheet.href : null;
    return ke(o.cssText, i, t);
  }))).join(`
`);
}
async function wt(e, t) {
  const n = t.fontEmbedCSS != null ? t.fontEmbedCSS : t.skipFonts ? null : await yt(e, t);
  if (n) {
    const r = document.createElement("style"), a = document.createTextNode(n);
    r.appendChild(a), e.firstChild ? e.insertBefore(r, e.firstChild) : e.appendChild(r);
  }
}
async function bt(e, t = {}) {
  const { width: n, height: r } = we(e, t), a = await Z(e, t, !0);
  return await wt(a, t), await Re(a, t), pt(a, t), await Ue(a, n, r);
}
async function vt(e, t = {}) {
  const { width: n, height: r } = we(e, t), a = await bt(e, t), o = await Y(a), i = document.createElement("canvas"), c = i.getContext("2d"), p = t.pixelRatio || _e(), V = t.canvasWidth || n, H = t.canvasHeight || r;
  return i.width = V * p, i.height = H * p, t.skipAutoScale || De(i), i.style.width = `${V}`, i.style.height = `${H}`, t.backgroundColor && (c.fillStyle = t.backgroundColor, c.fillRect(0, 0, i.width, i.height)), c.drawImage(o, 0, 0, i.width, i.height), i;
}
async function Et(e, t = {}) {
  return (await vt(e, t)).toDataURL();
}
function St(e) {
  var ae;
  const { useState: t, useRef: n, useCallback: r, useEffect: a } = e.React, o = 1280, i = 832;
  function c() {
    const [l, v] = t([]), x = r((y, g) => {
      var m;
      (m = window.__awOpenAppWindow) == null || m.call(window, "presentations.viewer", y, g);
    }, []);
    return a(() => (window.__awOpenPresentation = (y) => {
      const g = l.find((m) => m.id === y);
      x(y, g == null ? void 0 : g.title);
    }, () => {
      delete window.__awOpenPresentation;
    }), [l, x]), a(() => {
      var m;
      const y = (m = e.sdk.ws) == null ? void 0 : m.createSharedSocket;
      if (!y) {
        console.warn("[presentations] host.sdk.ws.createSharedSocket is unavailable (SPA too old for aw-ws/1 §9.1) — live updates disabled.");
        return;
      }
      return y({
        url: () => e.app.wsUrl("/ws"),
        initType: "presentation_init",
        onFrame: (h) => {
          if (h.type === "presentation_init") {
            v(h.presentations || []);
            return;
          }
          if (h.type === "presentation_update") {
            try {
              window.dispatchEvent(new CustomEvent("aw-presentation-update", { detail: h }));
            } catch {
            }
            h.action === "create" ? (v((w) => [...w.filter((k) => k.id !== h.presentation.id), h.presentation]), h.presentation.visible !== !1 && !h.silent && x(h.presentation.id, h.presentation.title)) : h.action === "update" ? v((w) => w.map((k) => k.id === h.presentation.id ? h.presentation : k)) : h.action === "delete" && v((w) => w.filter((k) => k.id !== h.id));
          }
        },
        onStatus: ({ state: h }) => {
          if (h === "fatal")
            try {
              window.dispatchEvent(new Event("aw-auth-failed"));
            } catch {
            }
        }
      }).retain();
    }, [x]), /* @__PURE__ */ e.h("div", { className: "relative" }, /* @__PURE__ */ e.h(
      "button",
      {
        onClick: () => {
          var y;
          return (y = window.__awOpenAppWindow) == null ? void 0 : y.call(window, "presentations.gallery", void 0, "Presentations");
        },
        className: "px-3 py-1 text-xs rounded transition-colors cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5"
      },
      "Presentation",
      l.length > 0 && /* @__PURE__ */ e.h("span", { className: "ml-1.5 inline-flex items-center justify-center min-w-[16px] h-[16px] rounded-full text-[9px] font-bold px-1 bg-[var(--color-accent)]/20 text-[var(--color-accent)]" }, l.length)
    ));
  }
  function p({ presentation: l, onClick: v, onDelete: x }) {
    const y = n(null), [g, m] = t(0.16), h = o, w = i, k = w / h;
    a(() => {
      const E = y.current;
      if (!E || typeof ResizeObserver > "u") return;
      const $ = new ResizeObserver((_) => {
        for (const A of _) {
          const P = A.contentRect.width;
          P > 0 && m(P / h);
        }
      });
      return $.observe(E), () => $.disconnect();
    }, []);
    const C = l.created_at ? new Date(l.created_at * 1e3).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
    return /* @__PURE__ */ e.h(
      "div",
      {
        onClick: v,
        className: "group relative rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] overflow-hidden cursor-pointer hover:border-[var(--color-accent)] transition-colors",
        title: l.title
      },
      /* @__PURE__ */ e.h(
        "div",
        {
          ref: y,
          className: "relative bg-[var(--color-bg-primary)]",
          style: { width: "100%", paddingTop: `${k * 100}%`, overflow: "hidden" }
        },
        /* @__PURE__ */ e.h(
          "iframe",
          {
            src: e.app.absoluteApiUrl(`/presentations/${l.id}/html`),
            sandbox: "allow-same-origin",
            tabIndex: -1,
            "aria-hidden": !0,
            style: {
              position: "absolute",
              top: 0,
              left: 0,
              width: h,
              height: w,
              border: 0,
              pointerEvents: "none",
              transform: `scale(${g})`,
              transformOrigin: "top left"
            }
          }
        )
      ),
      /* @__PURE__ */ e.h("div", { className: "px-2 py-1.5 border-t border-[var(--color-border)]" }, /* @__PURE__ */ e.h("div", { className: "text-[11px] font-medium text-[var(--color-text-primary)] truncate" }, l.title || "Untitled"), Array.isArray(l.tags) && l.tags.length > 0 && /* @__PURE__ */ e.h("div", { className: "flex flex-wrap gap-0.5 mt-0.5 overflow-hidden", style: { maxHeight: 18 } }, l.tags.slice(0, 4).map((E) => /* @__PURE__ */ e.h(
        "span",
        {
          key: E,
          className: "text-[8px] font-mono leading-none px-1 py-[2px] rounded bg-white/5 border border-white/10 text-[var(--color-text-muted)] truncate",
          title: E
        },
        E
      )), l.tags.length > 4 && /* @__PURE__ */ e.h(
        "span",
        {
          className: "text-[8px] leading-none px-1 py-[2px] text-[var(--color-text-muted)]",
          title: l.tags.slice(4).join(", ")
        },
        "+",
        l.tags.length - 4
      )), C && /* @__PURE__ */ e.h("div", { className: "text-[9px] text-[var(--color-text-muted)] truncate mt-0.5" }, C)),
      /* @__PURE__ */ e.h(
        "button",
        {
          onClick: (E) => {
            E.stopPropagation(), x();
          },
          className: "hidden group-hover:flex absolute top-1 right-1 items-center justify-center w-5 h-5 rounded bg-black/60 text-white/80 hover:text-[var(--color-danger)] hover:bg-black/80",
          title: "Delete presentation"
        },
        /* @__PURE__ */ e.h("svg", { className: "w-3 h-3", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("path", { d: "M18 6L6 18M6 6l12 12" }))
      )
    );
  }
  function V() {
    const [l, v] = t([]), [x, y] = t(!0), [g, m] = t(""), [h, w] = t(null), [k, C] = t(!1), E = n(""), $ = n(null), _ = n(0), A = n(null), [P, D] = t(!1), z = r((u, b) => {
      var S;
      (S = window.__awOpenAppWindow) == null || S.call(window, "presentations.viewer", u, b);
    }, []), L = r(async (u) => {
      await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${u}`), { method: "DELETE" });
    }, []);
    a(() => {
      (async () => {
        try {
          const b = await (await e.sdk.api.fetch(e.app.apiUrl("/presentations"))).json();
          v(Array.isArray(b) ? b : []);
        } catch {
          v([]);
        } finally {
          y(!1);
        }
      })();
    }, []);
    const O = r((u) => {
      clearTimeout($.current);
      const b = u.trim();
      if (!b) {
        w(null), C(!1);
        return;
      }
      C(!0), $.current = setTimeout(async () => {
        const S = ++_.current;
        try {
          const s = await (await e.sdk.api.fetch(e.app.apiUrl("/presentations?q=" + encodeURIComponent(b)))).json();
          S === _.current && (w(Array.isArray(s) ? s : []), C(!1));
        } catch {
          S === _.current && (w([]), C(!1));
        }
      }, 200);
    }, []);
    a(() => () => clearTimeout($.current), []);
    const B = r((u) => {
      const b = u.target.value;
      E.current = b, m(b), O(b);
    }, [O]);
    a(() => {
      const u = (b) => {
        const S = b.detail;
        !S || S.type !== "presentation_update" || (S.action === "create" ? (v((T) => [...T.filter((s) => s.id !== S.presentation.id), S.presentation]), E.current.trim() && O(E.current)) : S.action === "update" ? (v((T) => T.map((s) => s.id === S.presentation.id ? S.presentation : s)), E.current.trim() && O(E.current)) : S.action === "delete" && (v((T) => T.filter((s) => s.id !== S.id)), w((T) => T && T.filter((s) => s.id !== S.id))));
      };
      return window.addEventListener("aw-presentation-update", u), () => window.removeEventListener("aw-presentation-update", u);
    }, [O]), a(() => {
      const u = A.current;
      if (!u || typeof ResizeObserver > "u") return;
      const b = new ResizeObserver((S) => {
        for (const T of S) {
          const s = T.contentRect.width;
          s > 0 && D(s < q);
        }
      });
      return b.observe(u), () => b.disconnect();
    }, []);
    const R = [...l].sort((u, b) => (b.created_at || 0) - (u.created_at || 0)), U = h ?? R;
    return /* @__PURE__ */ e.h("div", { ref: A, className: "flex flex-col h-full bg-[var(--color-bg-secondary)]" }, /* @__PURE__ */ e.h("div", { className: "p-3 border-b border-[var(--color-border)]" }, /* @__PURE__ */ e.h(
      "input",
      {
        type: "text",
        value: g,
        onChange: B,
        placeholder: "Search title or content…",
        autoFocus: !P,
        className: "w-full text-[12px] bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2.5 py-2 text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]",
        style: P ? { fontSize: 16 } : void 0
      }
    )), /* @__PURE__ */ e.h("div", { className: "flex-1 overflow-y-auto p-3" }, x ? /* @__PURE__ */ e.h("div", { className: "px-4 py-10 text-center text-xs text-[var(--color-text-muted)]" }, "Loading…") : U.length === 0 && !k ? h !== null ? /* @__PURE__ */ e.h("div", { className: "px-4 py-10 text-center text-xs text-[var(--color-text-muted)]" }, "No results for “", g.trim(), "”") : /* @__PURE__ */ e.h("div", { className: "px-4 py-10 text-center text-xs text-[var(--color-text-muted)] italic" }, "No presentations yet. Use ", /* @__PURE__ */ e.h("code", { className: "bg-white/10 px-1 rounded" }, "/aw-presentation"), " to create one.") : /* @__PURE__ */ e.h(e.React.Fragment, null, k && /* @__PURE__ */ e.h("div", { className: "text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2 px-1" }, "Searching…"), /* @__PURE__ */ e.h(
      "div",
      {
        className: "grid gap-3",
        style: { gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }
      },
      U.map((u) => /* @__PURE__ */ e.h(
        p,
        {
          key: u.id,
          presentation: u,
          onClick: () => z(u.id, u.title),
          onDelete: () => L(u.id)
        }
      ))
    ))));
  }
  const H = /* @__PURE__ */ new Map(), q = 640;
  function K(l, v, { onClose: x, onTitleChange: y } = {}) {
    const [g, m] = t(null), [h, w] = t(!1), [k, C] = t(null), [E, $] = t(!1), [_, A] = t(!1), [P, D] = t(null), z = r(async () => {
      if (l)
        try {
          const f = await (await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${l}`))).json();
          if ((f == null ? void 0 : f.success) === !1) return;
          m(f);
        } catch {
        }
    }, [l]);
    a(() => {
      z();
    }, [z]), a(() => {
      const s = (f) => {
        var M;
        const d = f.detail;
        !d || d.type !== "presentation_update" || (d.action === "delete" && d.id === l ? x == null || x() : (d.action === "update" || d.action === "create") && ((M = d.presentation) == null ? void 0 : M.id) === l && m(d.presentation));
      };
      return window.addEventListener("aw-presentation-update", s), () => window.removeEventListener("aw-presentation-update", s);
    }, [l, x]);
    const L = l ? e.app.absoluteApiUrl(`/presentations/${l}/html`) : null, O = r((s) => {
      const f = document.createElement("a");
      f.download = `${((g == null ? void 0 : g.title) || "presentation").replace(/[^a-zA-Z0-9_-]/g, "_")}.png`, f.href = s, f.click();
    }, [g == null ? void 0 : g.title]), B = r(async () => {
      var s;
      D(null), A(!0);
      try {
        const f = (s = H.get(v)) == null ? void 0 : s.contentDocument;
        if (f && f.body) {
          const d = await Et(f.documentElement, {
            backgroundColor: "#111318",
            pixelRatio: 2,
            width: f.documentElement.scrollWidth,
            height: f.documentElement.scrollHeight
          });
          O(d);
          return;
        }
        throw new Error("presentation content is not accessible from this window (cross-origin iframe)");
      } catch (f) {
        console.warn("Client-side export failed, falling back to server render:", f);
        try {
          const d = await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${l}/export`), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
          }), M = await d.json().catch(() => null);
          if (!d.ok || !(M != null && M.data_url))
            throw new Error((M == null ? void 0 : M.detail) || `export failed (${d.status})`);
          O(M.data_url);
        } catch (d) {
          console.error("Export failed:", d), D(d.message || "Export failed");
        }
      } finally {
        A(!1);
      }
    }, [l, O, v]), R = r((s) => {
      var f;
      if (y) {
        y(s);
        return;
      }
      (f = window.__awOpenAppWindow) == null || f.call(window, "presentations.viewer", l, s);
    }, [y, l]), U = r(async (s) => {
      const f = (s || "").trim();
      !f || f === (g == null ? void 0 : g.title) || (await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${l}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: f })
      }), m((d) => d && { ...d, title: f }), R(f));
    }, [g == null ? void 0 : g.title, l, R]), u = r(async (s) => {
      if (l) {
        w(!0), C(null);
        try {
          const d = await (await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${l}/share`), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expires_in: s })
          })).json();
          d.success && d.token && C(`${L}?token=${d.token}`);
        } catch (f) {
          console.error("Share failed:", f);
        } finally {
          w(!1);
        }
      }
    }, [l, L]), b = r(() => {
      var s;
      k && ((s = navigator.clipboard) == null || s.writeText(k).then(() => {
        $(!0), setTimeout(() => $(!1), 2e3);
      }).catch(() => {
      }));
    }, [k]), S = r(async () => {
      await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${l}`), { method: "DELETE" }), x == null || x();
    }, [l, x]), T = r(({ asTab: s = !1 } = {}) => {
      if (L) {
        if (s) {
          window.open(L, "_blank");
          return;
        }
        window.open(L, `presentation-${l}`, "popup=1,width=1000,height=700");
      }
    }, [L, l]);
    return {
      presentation: g,
      htmlUrl: L,
      shareLink: k,
      setShareLink: C,
      shareLoading: h,
      shareCopied: E,
      handleCreateShare: u,
      handleCopy: b,
      exportLoading: _,
      exportError: P,
      setExportError: D,
      handleExport: B,
      commitRename: U,
      handleDelete: S,
      popOut: T
    };
  }
  function Pe({ windowKey: l, instanceId: v, onClose: x, onTitleChange: y }) {
    const g = v, {
      presentation: m,
      htmlUrl: h,
      shareLink: w,
      setShareLink: k,
      shareLoading: C,
      shareCopied: E,
      handleCreateShare: $,
      handleCopy: _,
      exportLoading: A,
      exportError: P,
      setExportError: D,
      handleExport: z,
      commitRename: L,
      handleDelete: O,
      popOut: B
    } = K(g, l, { onClose: x, onTitleChange: y }), [R, U] = t(!1), [u, b] = t(""), [S, T] = t(!1);
    a(() => {
      R || b((m == null ? void 0 : m.title) || "");
    }, [m == null ? void 0 : m.title, R]);
    const s = n(null), f = n(null), [d, M] = t(null), oe = r((F) => {
      var I;
      const j = (I = F.current) == null ? void 0 : I.getBoundingClientRect();
      j && M({ top: j.bottom + 6, right: window.innerWidth - j.right });
    }, []), ie = r(() => {
      U(!1), L(u);
    }, [L, u]);
    return a(() => {
      if (!R && !S && !P) return;
      const F = (I) => {
        var ce, le, se, ue;
        (ce = s.current) != null && ce.contains(I.target) || (le = f.current) != null && le.contains(I.target) || (ue = (se = I.target).closest) != null && ue.call(se, "[data-pres-popover]") || (U(!1), T(!1), D(null));
      }, j = (I) => {
        I.key === "Escape" && (U(!1), T(!1), D(null));
      };
      return document.addEventListener("mousedown", F), document.addEventListener("keydown", j), () => {
        document.removeEventListener("mousedown", F), document.removeEventListener("keydown", j);
      };
    }, [R, S, P, D]), /* @__PURE__ */ e.h(e.React.Fragment, null, /* @__PURE__ */ e.h(
      "button",
      {
        ref: s,
        onClick: () => {
          T(!1), U((F) => F ? !1 : (b((m == null ? void 0 : m.title) || ""), oe(s), !0));
        },
        className: "p-1 rounded hover:bg-white/10 text-[var(--color-text-muted)]",
        title: "Rename presentation"
      },
      /* @__PURE__ */ e.h("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("path", { d: "M12 20h9" }), /* @__PURE__ */ e.h("path", { d: "M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z" }))
    ), /* @__PURE__ */ e.h(
      "button",
      {
        ref: f,
        onClick: () => {
          U(!1), k(null), setShareCopied(!1), T((F) => F ? !1 : (oe(f), !0));
        },
        className: "p-1 rounded hover:bg-white/10 text-[var(--color-text-muted)]",
        title: "Share presentation"
      },
      /* @__PURE__ */ e.h("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("circle", { cx: "18", cy: "5", r: "3" }), /* @__PURE__ */ e.h("circle", { cx: "6", cy: "12", r: "3" }), /* @__PURE__ */ e.h("circle", { cx: "18", cy: "19", r: "3" }), /* @__PURE__ */ e.h("path", { d: "M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" }))
    ), /* @__PURE__ */ e.h(
      "button",
      {
        onClick: () => B(),
        className: "p-1 rounded hover:bg-white/10 text-[var(--color-text-muted)]",
        title: "Pop out to new window"
      },
      /* @__PURE__ */ e.h("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("path", { d: "M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" }), /* @__PURE__ */ e.h("polyline", { points: "15 3 21 3 21 9" }), /* @__PURE__ */ e.h("line", { x1: "10", y1: "14", x2: "21", y2: "3" }))
    ), /* @__PURE__ */ e.h(
      "button",
      {
        onClick: z,
        disabled: A,
        className: `p-1 rounded ${A ? "opacity-50 cursor-wait" : "hover:bg-white/10 cursor-pointer"} ${P ? "text-[var(--color-danger)]" : "text-[var(--color-text-muted)]"}`,
        title: P ? `Export failed: ${P}` : "Export as PNG"
      },
      /* @__PURE__ */ e.h("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("path", { d: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" }), /* @__PURE__ */ e.h("polyline", { points: "7 10 12 15 17 10" }), /* @__PURE__ */ e.h("line", { x1: "12", y1: "15", x2: "12", y2: "3" }))
    ), /* @__PURE__ */ e.h(
      "button",
      {
        onClick: O,
        className: "p-1 rounded hover:bg-white/10 text-[var(--color-text-muted)] hover:text-[var(--color-danger)]",
        title: "Delete presentation"
      },
      /* @__PURE__ */ e.h("svg", { width: "14", height: "14", viewBox: "0 0 16 16", fill: "currentColor" }, /* @__PURE__ */ e.h("path", { d: "M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" }), /* @__PURE__ */ e.h("path", { fillRule: "evenodd", d: "M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2h3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1h3a1 1 0 0 1 1 1z" }))
    ), R && d && e.ReactDOM.createPortal(
      /* @__PURE__ */ e.h(
        "div",
        {
          "data-pres-popover": !0,
          className: "fixed z-[1000] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-2xl p-3",
          style: { top: d.top, right: d.right, minWidth: 260 }
        },
        /* @__PURE__ */ e.h("div", { className: "text-[11px] font-medium text-[var(--color-text-primary)] mb-2" }, "Rename presentation"),
        /* @__PURE__ */ e.h(
          "input",
          {
            autoFocus: !0,
            value: u,
            onChange: (F) => b(F.target.value),
            onKeyDown: (F) => {
              F.key === "Enter" && ie(), F.key === "Escape" && (U(!1), b((m == null ? void 0 : m.title) || ""));
            },
            className: "w-full text-[11px] bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2 py-1 text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
          }
        ),
        /* @__PURE__ */ e.h("div", { className: "flex justify-end mt-2" }, /* @__PURE__ */ e.h(
          "button",
          {
            onClick: ie,
            disabled: !u.trim(),
            className: "text-[11px] px-2 py-1 rounded bg-[var(--color-accent)]/20 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/30 transition-colors disabled:opacity-40"
          },
          "Rename"
        ))
      ),
      document.body
    ), S && d && e.ReactDOM.createPortal(
      /* @__PURE__ */ e.h(
        "div",
        {
          "data-pres-popover": !0,
          className: "fixed z-[1000] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-2xl p-3",
          style: { top: d.top, right: d.right, minWidth: 260 }
        },
        /* @__PURE__ */ e.h("div", { className: "text-[11px] font-medium text-[var(--color-text-primary)] mb-2" }, "Share presentation"),
        C ? /* @__PURE__ */ e.h("div", { className: "text-[11px] text-[var(--color-text-muted)] py-2 text-center" }, "Generating link…") : w ? /* @__PURE__ */ e.h("div", { className: "flex flex-col gap-2" }, /* @__PURE__ */ e.h("div", { className: "text-[10px] text-[var(--color-text-muted)]" }, "Link generated:"), /* @__PURE__ */ e.h("div", { className: "flex items-center gap-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2 py-1.5" }, /* @__PURE__ */ e.h("span", { className: "text-[10px] font-mono text-[var(--color-text-primary)] truncate flex-1", title: w }, w), /* @__PURE__ */ e.h("button", { onClick: _, className: "shrink-0 text-[10px] px-2 py-0.5 rounded bg-[var(--color-accent)]/20 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/30 transition-colors" }, E ? "✓ Copied" : "Copy")), /* @__PURE__ */ e.h("button", { onClick: () => k(null), className: "text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-left" }, "← Generate new link")) : /* @__PURE__ */ e.h("div", { className: "flex flex-col gap-1.5" }, /* @__PURE__ */ e.h("div", { className: "text-[10px] text-[var(--color-text-muted)] mb-1" }, "Link expires after:"), [{ label: "1 hour", value: 3600 }, { label: "1 day", value: 86400 }, { label: "Never expires", value: null }].map(({ label: F, value: j }) => /* @__PURE__ */ e.h(
          "button",
          {
            key: F,
            onClick: () => $(j),
            className: "text-left text-[11px] px-3 py-1.5 rounded bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-colors"
          },
          F
        )))
      ),
      document.body
    ), P && d && e.ReactDOM.createPortal(
      // The `title` attribute never surfaces on touch devices (iOS Safari
      // shows no hover tooltip on tap), so a red icon with no visible
      // reason reads as "broken, does nothing" — this makes it tappable.
      /* @__PURE__ */ e.h(
        "div",
        {
          "data-pres-popover": !0,
          className: "fixed z-[1000] bg-[var(--color-bg-secondary)] border border-[var(--color-danger)]/40 rounded-lg shadow-2xl p-3",
          style: { top: d.top, right: d.right, minWidth: 220, maxWidth: 280 }
        },
        /* @__PURE__ */ e.h("div", { className: "text-[11px] font-medium text-[var(--color-danger)] mb-1" }, "Export failed"),
        /* @__PURE__ */ e.h("div", { className: "text-[10px] text-[var(--color-text-muted)] mb-2" }, P),
        /* @__PURE__ */ e.h(
          "button",
          {
            onClick: () => D(null),
            className: "text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          },
          "Dismiss"
        )
      ),
      document.body
    ));
  }
  function Le({ actions: l, onDismiss: v }) {
    const {
      presentation: x,
      shareLink: y,
      setShareLink: g,
      shareLoading: m,
      shareCopied: h,
      handleCreateShare: w,
      handleCopy: k,
      exportLoading: C,
      exportError: E,
      setExportError: $,
      handleExport: _,
      commitRename: A,
      handleDelete: P,
      popOut: D
    } = l, [z, L] = t("menu"), [O, B] = t((x == null ? void 0 : x.title) || ""), R = {
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
    }, U = {
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
        onClick: v,
        style: { position: "absolute", inset: 0, zIndex: 19, background: "rgba(0,0,0,0.45)" }
      }
    ), /* @__PURE__ */ e.h("div", { style: U, role: "menu" }, z === "menu" && /* @__PURE__ */ e.h(e.React.Fragment, null, /* @__PURE__ */ e.h("button", { style: R, onClick: () => {
      g(null), L("share");
    } }, "Share"), /* @__PURE__ */ e.h(
      "button",
      {
        style: { ...R, opacity: C ? 0.5 : 1 },
        disabled: C,
        onClick: _
      },
      C ? "Exporting…" : "Export as PNG"
    ), /* @__PURE__ */ e.h("button", { style: R, onClick: () => {
      B((x == null ? void 0 : x.title) || ""), L("rename");
    } }, "Rename"), /* @__PURE__ */ e.h("button", { style: R, onClick: () => {
      D({ asTab: !0 }), v();
    } }, "Open in new tab"), /* @__PURE__ */ e.h(
      "button",
      {
        style: { ...R, color: "var(--color-danger)" },
        onClick: () => {
          P(), v();
        }
      },
      "Delete"
    ), E && /* @__PURE__ */ e.h("div", { style: { padding: "8px 16px", fontSize: 12, color: "var(--color-danger)" } }, "Export failed: ", E, /* @__PURE__ */ e.h(
      "button",
      {
        onClick: () => $(null),
        style: { ...R, minHeight: 36, padding: 0, marginTop: 4, fontSize: 12, color: "var(--color-text-muted)" }
      },
      "Dismiss"
    ))), z === "share" && /* @__PURE__ */ e.h("div", { style: { padding: "8px 16px 4px" } }, /* @__PURE__ */ e.h("div", { style: { fontSize: 12, color: "var(--color-text-muted)", marginBottom: 8 } }, y ? "Link generated:" : "Link expires after:"), m ? /* @__PURE__ */ e.h("div", { style: { fontSize: 13, color: "var(--color-text-muted)", padding: "12px 0" } }, "Generating link…") : y ? /* @__PURE__ */ e.h(e.React.Fragment, null, /* @__PURE__ */ e.h("div", { style: {
      fontSize: 11,
      fontFamily: "monospace",
      wordBreak: "break-all",
      background: "var(--color-bg-primary)",
      border: "1px solid var(--color-border)",
      borderRadius: 6,
      padding: 8,
      color: "var(--color-text-primary)"
    } }, y), /* @__PURE__ */ e.h("button", { style: { ...R, padding: 0, color: "var(--color-accent)" }, onClick: k }, h ? "✓ Copied" : "Copy link")) : [{ label: "1 hour", value: 3600 }, { label: "1 day", value: 86400 }, { label: "Never expires", value: null }].map(({ label: u, value: b }) => /* @__PURE__ */ e.h("button", { key: u, style: { ...R, padding: 0 }, onClick: () => w(b) }, u)), /* @__PURE__ */ e.h("button", { style: { ...R, padding: 0, color: "var(--color-text-muted)" }, onClick: () => L("menu") }, "← Back")), z === "rename" && /* @__PURE__ */ e.h("div", { style: { padding: "8px 16px 4px" } }, /* @__PURE__ */ e.h("div", { style: { fontSize: 12, color: "var(--color-text-muted)", marginBottom: 8 } }, "Rename presentation"), /* @__PURE__ */ e.h(
      "input",
      {
        autoFocus: !0,
        value: O,
        onChange: (u) => B(u.target.value),
        onKeyDown: (u) => {
          u.key === "Enter" && (A(O), v());
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
    ), /* @__PURE__ */ e.h("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ e.h("button", { style: { ...R, color: "var(--color-text-muted)" }, onClick: () => L("menu") }, "Cancel"), /* @__PURE__ */ e.h(
      "button",
      {
        style: { ...R, color: "var(--color-accent)", justifyContent: "flex-end" },
        disabled: !O.trim(),
        onClick: () => {
          A(O), v();
        }
      },
      "Rename"
    )))));
  }
  function Te({ windowKey: l, instanceId: v, onClose: x, onTitleChange: y }) {
    const g = v, m = n(null), h = n(null), [w, k] = t(!1), [C, E] = t(!1), $ = K(g, l, { onClose: x, onTitleChange: y }), { htmlUrl: _ } = $;
    return a(() => {
      const A = h.current;
      if (!A || typeof ResizeObserver > "u") return;
      const P = new ResizeObserver((D) => {
        for (const z of D) {
          const L = z.contentRect.width;
          L > 0 && k(L < q);
        }
      });
      return P.observe(A), () => P.disconnect();
    }, []), a(() => {
      w || E(!1);
    }, [w]), a(() => (H.set(l, m.current), () => H.delete(l)), [l]), /* @__PURE__ */ e.h("div", { ref: h, className: "flex flex-col bg-[var(--color-bg-secondary)] h-full" }, /* @__PURE__ */ e.h("div", { className: "flex-1 relative" }, _ && // allow-scripts only, deliberately NOT allow-same-origin: presentation
    // HTML is agent-generated and can be hostile/compromised. Without
    // allow-same-origin the frame is an opaque origin — scripts run, but
    // can't read this API host's cookies/localStorage or ride an
    // authenticated same-origin request. A relative fetch inside a
    // presentation would need to resolve via an absolute URL instead.
    /* @__PURE__ */ e.h("iframe", { ref: m, src: _, sandbox: "allow-scripts", className: "absolute inset-0 w-full h-full bg-white border-0", title: "Presentation" }), w && !C && /* @__PURE__ */ e.h(
      "button",
      {
        onClick: () => E(!0),
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
    ), w && C && /* @__PURE__ */ e.h(Le, { actions: $, onDismiss: () => E(!1) })));
  }
  e.registerSlot("core.nav", c), e.registerWindow("presentations.gallery", V), e.registerWindow("presentations.viewer", Te), (ae = e.registerWindowActions) == null || ae.call(e, "presentations.viewer", Pe);
}
export {
  St as default,
  St as register
};
