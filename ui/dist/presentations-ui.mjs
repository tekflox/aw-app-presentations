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
function O(e) {
  const t = [];
  for (let n = 0, r = e.length; n < r; n++)
    t.push(e[n]);
  return t;
}
let M = null;
function pe(e = {}) {
  return M || (e.includeStyleProperties ? (M = e.includeStyleProperties, M) : (M = O(window.getComputedStyle(document.documentElement)), M));
}
function V(e, t) {
  const r = (e.ownerDocument.defaultView || window).getComputedStyle(e).getPropertyValue(t);
  return r ? parseFloat(r.replace("px", "")) : 0;
}
function Ae(e) {
  const t = V(e, "border-left-width"), n = V(e, "border-right-width");
  return e.clientWidth + t + n;
}
function De(e) {
  const t = V(e, "border-top-width"), n = V(e, "border-bottom-width");
  return e.clientHeight + t + n;
}
function ge(e, t = {}) {
  const n = t.width || Ae(e), r = t.height || De(e);
  return { width: n, height: r };
}
function Fe() {
  let e, t;
  try {
    t = process;
  } catch {
  }
  const n = t && t.env ? t.env.devicePixelRatio : null;
  return n && (e = parseInt(n, 10), Number.isNaN(e) && (e = 1)), e || window.devicePixelRatio || 1;
}
const R = 16384;
function Oe(e) {
  (e.width > R || e.height > R) && (e.width > R && e.height > R ? e.width > e.height ? (e.height *= R / e.width, e.width = R) : (e.width *= R / e.height, e.height = R) : e.width > R ? (e.height *= R / e.width, e.width = R) : (e.width *= R / e.height, e.height = R));
}
function z(e) {
  return new Promise((t, n) => {
    const r = new Image();
    r.onload = () => {
      r.decode().then(() => {
        requestAnimationFrame(() => t(r));
      });
    }, r.onerror = n, r.crossOrigin = "anonymous", r.decoding = "async", r.src = e;
  });
}
async function Ue(e) {
  return Promise.resolve().then(() => new XMLSerializer().serializeToString(e)).then(encodeURIComponent).then((t) => `data:image/svg+xml;charset=utf-8,${t}`);
}
async function _e(e, t, n) {
  const r = "http://www.w3.org/2000/svg", a = document.createElementNS(r, "svg"), i = document.createElementNS(r, "foreignObject");
  return a.setAttribute("width", `${t}`), a.setAttribute("height", `${n}`), a.setAttribute("viewBox", `0 0 ${t} ${n}`), i.setAttribute("width", "100%"), i.setAttribute("height", "100%"), i.setAttribute("x", "0"), i.setAttribute("y", "0"), i.setAttribute("externalResourcesRequired", "true"), a.appendChild(i), i.appendChild(e), Ue(a);
}
const E = (e, t) => {
  if (e instanceof t)
    return !0;
  const n = Object.getPrototypeOf(e);
  return n === null ? !1 : n.constructor.name === t.name || E(n, t);
};
function We(e) {
  const t = e.getPropertyValue("content");
  return `${e.cssText} content: '${t.replace(/'|"/g, "")}';`;
}
function Me(e, t) {
  return pe(t).map((n) => {
    const r = e.getPropertyValue(n), a = e.getPropertyPriority(n);
    return `${n}: ${r}${a ? " !important" : ""};`;
  }).join(" ");
}
function Ie(e, t, n, r) {
  const a = `.${e}:${t}`, i = n.cssText ? We(n) : Me(n, r);
  return document.createTextNode(`${a}{${i}}`);
}
function se(e, t, n, r) {
  const a = window.getComputedStyle(e, n), i = a.getPropertyValue("content");
  if (i === "" || i === "none")
    return;
  const o = $e();
  try {
    t.className = `${t.className} ${o}`;
  } catch {
    return;
  }
  const c = document.createElement("style");
  c.appendChild(Ie(o, n, a, r)), t.appendChild(c);
}
function Ne(e, t, n) {
  se(e, t, ":before", n), se(e, t, ":after", n);
}
const le = "application/font-woff", ue = "image/jpeg", He = {
  woff: le,
  woff2: le,
  ttf: "application/font-truetype",
  eot: "application/vnd.ms-fontobject",
  png: "image/png",
  jpg: ue,
  jpeg: ue,
  gif: "image/gif",
  tiff: "image/tiff",
  svg: "image/svg+xml",
  webp: "image/webp"
};
function Ve(e) {
  const t = /\.([^./]*?)$/g.exec(e);
  return t ? t[1] : "";
}
function Q(e) {
  const t = Ve(e).toLowerCase();
  return He[t] || "";
}
function ze(e) {
  return e.split(/,/)[1];
}
function K(e) {
  return e.search(/^(data:)/) !== -1;
}
function je(e, t) {
  return `data:${t};base64,${e}`;
}
async function xe(e, t, n) {
  const r = await fetch(e, t);
  if (r.status === 404)
    throw new Error(`Resource "${r.url}" not found`);
  const a = await r.blob();
  return new Promise((i, o) => {
    const c = new FileReader();
    c.onerror = o, c.onloadend = () => {
      try {
        i(n({ res: r, result: c.result }));
      } catch (d) {
        o(d);
      }
    }, c.readAsDataURL(a);
  });
}
const X = {};
function Be(e, t, n) {
  let r = e.replace(/\?.*/, "");
  return n && (r = e), /ttf|otf|eot|woff2?/i.test(r) && (r = r.replace(/.*\//, "")), t ? `[${t}]${r}` : r;
}
async function Z(e, t, n) {
  const r = Be(e, t, n.includeQueryParams);
  if (X[r] != null)
    return X[r];
  n.cacheBust && (e += (/\?/.test(e) ? "&" : "?") + (/* @__PURE__ */ new Date()).getTime());
  let a;
  try {
    const i = await xe(e, n.fetchRequestInit, ({ res: o, result: c }) => (t || (t = o.headers.get("Content-Type") || ""), ze(c)));
    a = je(i, t);
  } catch (i) {
    a = n.imagePlaceholder || "";
    let o = `Failed to fetch resource: ${e}`;
    i && (o = typeof i == "string" ? i : i.message), o && console.warn(o);
  }
  return X[r] = a, a;
}
async function Ge(e) {
  const t = e.toDataURL();
  return t === "data:," ? e.cloneNode(!1) : z(t);
}
async function qe(e, t) {
  if (e.currentSrc) {
    const i = document.createElement("canvas"), o = i.getContext("2d");
    i.width = e.clientWidth, i.height = e.clientHeight, o == null || o.drawImage(e, 0, 0, i.width, i.height);
    const c = i.toDataURL();
    return z(c);
  }
  const n = e.poster, r = Q(n), a = await Z(n, r, t);
  return z(a);
}
async function Je(e, t) {
  var n;
  try {
    if (!((n = e == null ? void 0 : e.contentDocument) === null || n === void 0) && n.body)
      return await j(e.contentDocument.body, t, !0);
  } catch {
  }
  return e.cloneNode(!1);
}
async function Xe(e, t) {
  return E(e, HTMLCanvasElement) ? Ge(e) : E(e, HTMLVideoElement) ? qe(e, t) : E(e, HTMLIFrameElement) ? Je(e, t) : e.cloneNode(we(e));
}
const Ke = (e) => e.tagName != null && e.tagName.toUpperCase() === "SLOT", we = (e) => e.tagName != null && e.tagName.toUpperCase() === "SVG";
async function Qe(e, t, n) {
  var r, a;
  if (we(t))
    return t;
  let i = [];
  return Ke(e) && e.assignedNodes ? i = O(e.assignedNodes()) : E(e, HTMLIFrameElement) && (!((r = e.contentDocument) === null || r === void 0) && r.body) ? i = O(e.contentDocument.body.childNodes) : i = O(((a = e.shadowRoot) !== null && a !== void 0 ? a : e).childNodes), i.length === 0 || E(e, HTMLVideoElement) || await i.reduce((o, c) => o.then(() => j(c, n)).then((d) => {
    d && t.appendChild(d);
  }), Promise.resolve()), t;
}
function Ze(e, t, n) {
  const r = t.style;
  if (!r)
    return;
  const a = window.getComputedStyle(e);
  a.cssText ? (r.cssText = a.cssText, r.transformOrigin = a.transformOrigin) : pe(n).forEach((i) => {
    let o = a.getPropertyValue(i);
    i === "font-size" && o.endsWith("px") && (o = `${Math.floor(parseFloat(o.substring(0, o.length - 2))) - 0.1}px`), E(e, HTMLIFrameElement) && i === "display" && o === "inline" && (o = "block"), i === "d" && t.getAttribute("d") && (o = `path(${t.getAttribute("d")})`), r.setProperty(i, o, a.getPropertyPriority(i));
  });
}
function Ye(e, t) {
  E(e, HTMLTextAreaElement) && (t.innerHTML = e.value), E(e, HTMLInputElement) && t.setAttribute("value", e.value);
}
function et(e, t) {
  if (E(e, HTMLSelectElement)) {
    const n = t, r = Array.from(n.children).find((a) => e.value === a.getAttribute("value"));
    r && r.setAttribute("selected", "");
  }
}
function tt(e, t, n) {
  return E(t, Element) && (Ze(e, t, n), Ne(e, t, n), Ye(e, t), et(e, t)), t;
}
async function rt(e, t) {
  const n = e.querySelectorAll ? e.querySelectorAll("use") : [];
  if (n.length === 0)
    return e;
  const r = {};
  for (let i = 0; i < n.length; i++) {
    const c = n[i].getAttribute("xlink:href");
    if (c) {
      const d = e.querySelector(c), L = document.querySelector(c);
      !d && L && !r[c] && (r[c] = await j(L, t, !0));
    }
  }
  const a = Object.values(r);
  if (a.length) {
    const i = "http://www.w3.org/1999/xhtml", o = document.createElementNS(i, "svg");
    o.setAttribute("xmlns", i), o.style.position = "absolute", o.style.width = "0", o.style.height = "0", o.style.overflow = "hidden", o.style.display = "none";
    const c = document.createElementNS(i, "defs");
    o.appendChild(c);
    for (let d = 0; d < a.length; d++)
      c.appendChild(a[d]);
    e.appendChild(o);
  }
  return e;
}
async function j(e, t, n) {
  return !n && t.filter && !t.filter(e) ? null : Promise.resolve(e).then((r) => Xe(r, t)).then((r) => Qe(e, r, t)).then((r) => tt(e, r, t)).then((r) => rt(r, t));
}
const ye = /url\((['"]?)([^'"]+?)\1\)/g, nt = /url\([^)]+\)\s*format\((["']?)([^"']+)\1\)/g, at = /src:\s*(?:url\([^)]+\)\s*format\([^)]+\)[,;]\s*)+/g;
function it(e) {
  const t = e.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1");
  return new RegExp(`(url\\(['"]?)(${t})(['"]?\\))`, "g");
}
function ot(e) {
  const t = [];
  return e.replace(ye, (n, r, a) => (t.push(a), n)), t.filter((n) => !K(n));
}
async function ct(e, t, n, r, a) {
  try {
    const i = n ? Le(t, n) : t, o = Q(t);
    let c;
    return a || (c = await Z(i, o, r)), e.replace(it(t), `$1${c}$3`);
  } catch {
  }
  return e;
}
function st(e, { preferredFontFormat: t }) {
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
function be(e) {
  return e.search(ye) !== -1;
}
async function ve(e, t, n) {
  if (!be(e))
    return e;
  const r = st(e, n);
  return ot(r).reduce((i, o) => i.then((c) => ct(c, o, t, n)), Promise.resolve(r));
}
async function I(e, t, n) {
  var r;
  const a = (r = t.style) === null || r === void 0 ? void 0 : r.getPropertyValue(e);
  if (a) {
    const i = await ve(a, null, n);
    return t.style.setProperty(e, i, t.style.getPropertyPriority(e)), !0;
  }
  return !1;
}
async function lt(e, t) {
  await I("background", e, t) || await I("background-image", e, t), await I("mask", e, t) || await I("-webkit-mask", e, t) || await I("mask-image", e, t) || await I("-webkit-mask-image", e, t);
}
async function ut(e, t) {
  const n = E(e, HTMLImageElement);
  if (!(n && !K(e.src)) && !(E(e, SVGImageElement) && !K(e.href.baseVal)))
    return;
  const r = n ? e.src : e.href.baseVal, a = await Z(r, Q(r), t);
  await new Promise((i, o) => {
    e.onload = i, e.onerror = t.onImageErrorHandler ? (...d) => {
      try {
        i(t.onImageErrorHandler(...d));
      } catch (L) {
        o(L);
      }
    } : o;
    const c = e;
    c.decode && (c.decode = i), c.loading === "lazy" && (c.loading = "eager"), n ? (e.srcset = "", e.src = a) : e.href.baseVal = a;
  });
}
async function dt(e, t) {
  const r = O(e.childNodes).map((a) => Ee(a, t));
  await Promise.all(r).then(() => e);
}
async function Ee(e, t) {
  E(e, Element) && (await lt(e, t), await ut(e, t), await dt(e, t));
}
function ft(e, t) {
  const { style: n } = e;
  t.backgroundColor && (n.backgroundColor = t.backgroundColor), t.width && (n.width = `${t.width}px`), t.height && (n.height = `${t.height}px`);
  const r = t.style;
  return r != null && Object.keys(r).forEach((a) => {
    n[a] = r[a];
  }), e;
}
const de = {};
async function fe(e) {
  let t = de[e];
  if (t != null)
    return t;
  const r = await (await fetch(e)).text();
  return t = { url: e, cssText: r }, de[e] = t, t;
}
async function me(e, t) {
  let n = e.cssText;
  const r = /url\(["']?([^"')]+)["']?\)/g, i = (n.match(/url\([^)]+\)/g) || []).map(async (o) => {
    let c = o.replace(r, "$1");
    return c.startsWith("https://") || (c = new URL(c, e.url).href), xe(c, t.fetchRequestInit, ({ result: d }) => (n = n.replace(o, `url(${d})`), [o, d]));
  });
  return Promise.all(i).then(() => n);
}
function he(e) {
  if (e == null)
    return [];
  const t = [], n = /(\/\*[\s\S]*?\*\/)/gi;
  let r = e.replace(n, "");
  const a = new RegExp("((@.*?keyframes [\\s\\S]*?){([\\s\\S]*?}\\s*?)})", "gi");
  for (; ; ) {
    const d = a.exec(r);
    if (d === null)
      break;
    t.push(d[0]);
  }
  r = r.replace(a, "");
  const i = /@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi, o = "((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})", c = new RegExp(o, "gi");
  for (; ; ) {
    let d = i.exec(r);
    if (d === null) {
      if (d = c.exec(r), d === null)
        break;
      i.lastIndex = c.lastIndex;
    } else
      c.lastIndex = i.lastIndex;
    t.push(d[0]);
  }
  return t;
}
async function mt(e, t) {
  const n = [], r = [];
  return e.forEach((a) => {
    if ("cssRules" in a)
      try {
        O(a.cssRules || []).forEach((i, o) => {
          if (i.type === CSSRule.IMPORT_RULE) {
            let c = o + 1;
            const d = i.href, L = fe(d).then(($) => me($, t)).then(($) => he($).forEach((p) => {
              try {
                a.insertRule(p, p.startsWith("@import") ? c += 1 : a.cssRules.length);
              } catch (k) {
                console.error("Error inserting rule from remote css", {
                  rule: p,
                  error: k
                });
              }
            })).catch(($) => {
              console.error("Error loading remote css", $.toString());
            });
            r.push(L);
          }
        });
      } catch (i) {
        const o = e.find((c) => c.href == null) || document.styleSheets[0];
        a.href != null && r.push(fe(a.href).then((c) => me(c, t)).then((c) => he(c).forEach((d) => {
          o.insertRule(d, o.cssRules.length);
        })).catch((c) => {
          console.error("Error loading remote stylesheet", c);
        })), console.error("Error inlining remote css file", i);
      }
  }), Promise.all(r).then(() => (e.forEach((a) => {
    if ("cssRules" in a)
      try {
        O(a.cssRules || []).forEach((i) => {
          n.push(i);
        });
      } catch (i) {
        console.error(`Error while reading CSS rules from ${a.href}`, i);
      }
  }), n));
}
function ht(e) {
  return e.filter((t) => t.type === CSSRule.FONT_FACE_RULE).filter((t) => be(t.style.getPropertyValue("src")));
}
async function pt(e, t) {
  if (e.ownerDocument == null)
    throw new Error("Provided element is not within a Document");
  const n = O(e.ownerDocument.styleSheets), r = await mt(n, t);
  return ht(r);
}
function Se(e) {
  return e.trim().replace(/["']/g, "");
}
function gt(e) {
  const t = /* @__PURE__ */ new Set();
  function n(r) {
    (r.style.fontFamily || getComputedStyle(r).fontFamily).split(",").forEach((i) => {
      t.add(Se(i));
    }), Array.from(r.children).forEach((i) => {
      i instanceof HTMLElement && n(i);
    });
  }
  return n(e), t;
}
async function xt(e, t) {
  const n = await pt(e, t), r = gt(e);
  return (await Promise.all(n.filter((i) => r.has(Se(i.style.fontFamily))).map((i) => {
    const o = i.parentStyleSheet ? i.parentStyleSheet.href : null;
    return ve(i.cssText, o, t);
  }))).join(`
`);
}
async function wt(e, t) {
  const n = t.fontEmbedCSS != null ? t.fontEmbedCSS : t.skipFonts ? null : await xt(e, t);
  if (n) {
    const r = document.createElement("style"), a = document.createTextNode(n);
    r.appendChild(a), e.firstChild ? e.insertBefore(r, e.firstChild) : e.appendChild(r);
  }
}
async function yt(e, t = {}) {
  const { width: n, height: r } = ge(e, t), a = await j(e, t, !0);
  return await wt(a, t), await Ee(a, t), ft(a, t), await _e(a, n, r);
}
async function bt(e, t = {}) {
  const { width: n, height: r } = ge(e, t), a = await yt(e, t), i = await z(a), o = document.createElement("canvas"), c = o.getContext("2d"), d = t.pixelRatio || Fe(), L = t.canvasWidth || n, $ = t.canvasHeight || r;
  return o.width = L * d, o.height = $ * d, t.skipAutoScale || Oe(o), o.style.width = `${L}`, o.style.height = `${$}`, t.backgroundColor && (c.fillStyle = t.backgroundColor, c.fillRect(0, 0, o.width, o.height)), c.drawImage(i, 0, 0, o.width, o.height), o;
}
async function vt(e, t = {}) {
  return (await bt(e, t)).toDataURL();
}
function Et(e) {
  var $;
  const { useState: t, useRef: n, useCallback: r, useEffect: a } = e.React;
  function i() {
    const [p, k] = t([]), [w, y] = t(!1), m = n(null), h = r((s, x) => {
      var v;
      (v = window.__awOpenAppWindow) == null || v.call(window, "presentations.viewer", s, x);
    }, []);
    a(() => (window.__awOpenPresentation = (s) => {
      const x = p.find((v) => v.id === s);
      h(s, x == null ? void 0 : x.title);
    }, () => {
      delete window.__awOpenPresentation;
    }), [p, h]), a(() => {
      let s, x, v = !1;
      const U = () => {
        try {
          s = new WebSocket(e.app.wsUrl("/ws")), s.onmessage = (_) => {
            let g;
            try {
              g = JSON.parse(_.data);
            } catch {
              return;
            }
            if (g.type === "presentation_init") {
              k(g.presentations || []);
              return;
            }
            if (g.type === "presentation_update") {
              try {
                window.dispatchEvent(new CustomEvent("aw-presentation-update", { detail: g }));
              } catch {
              }
              g.action === "create" ? (k((A) => [...A.filter((F) => F.id !== g.presentation.id), g.presentation]), g.presentation.visible !== !1 && !g.silent && h(g.presentation.id, g.presentation.title)) : g.action === "update" ? k((A) => A.map((F) => F.id === g.presentation.id ? g.presentation : F)) : g.action === "delete" && k((A) => A.filter((F) => F.id !== g.id));
            }
          }, s.onclose = () => {
            v || (x = setTimeout(U, 5e3));
          }, s.onerror = () => {
            try {
              s.close();
            } catch {
            }
          };
        } catch {
          v || (x = setTimeout(U, 5e3));
        }
      };
      return U(), () => {
        if (v = !0, clearTimeout(x), s) {
          s.onclose = null;
          try {
            s.close();
          } catch {
          }
        }
      };
    }, [h]);
    const C = r(() => {
      clearTimeout(m.current), y(!0);
    }, []), P = r(() => {
      clearTimeout(m.current), m.current = setTimeout(() => y(!1), 150);
    }, []);
    a(() => () => clearTimeout(m.current), []);
    const b = r(async (s) => {
      await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${s}`), { method: "DELETE" });
    }, []), T = [...p].sort((s, x) => (x.created_at || 0) - (s.created_at || 0));
    return /* @__PURE__ */ e.h("div", { className: "relative", onMouseEnter: C, onMouseLeave: P }, /* @__PURE__ */ e.h(
      "button",
      {
        onClick: () => y((s) => !s),
        className: "px-3 py-1 text-xs rounded transition-colors cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5"
      },
      "Presentation",
      T.length > 0 && /* @__PURE__ */ e.h("span", { className: "ml-1.5 inline-flex items-center justify-center min-w-[16px] h-[16px] rounded-full text-[9px] font-bold px-1 bg-[var(--color-accent)]/20 text-[var(--color-accent)]" }, T.length)
    ), w && /* @__PURE__ */ e.h(
      "div",
      {
        className: "absolute left-0 top-full mt-2 z-50 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-2xl p-3",
        style: { minWidth: 320, maxWidth: 720 }
      },
      T.length === 0 ? /* @__PURE__ */ e.h("div", { className: "px-4 py-6 text-center text-xs text-[var(--color-text-muted)] italic" }, "No presentations yet. Use ", /* @__PURE__ */ e.h("code", { className: "bg-white/10 px-1 rounded" }, "/aw-presentation"), " to create one.") : /* @__PURE__ */ e.h(e.React.Fragment, null, /* @__PURE__ */ e.h("div", { className: "text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2 px-1" }, "Presentations · newest first"), /* @__PURE__ */ e.h(
        "div",
        {
          className: "grid gap-2 overflow-y-auto",
          style: { gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", maxHeight: "70vh" }
        },
        T.map((s) => /* @__PURE__ */ e.h(
          o,
          {
            key: s.id,
            presentation: s,
            onClick: () => {
              y(!1), h(s.id, s.title);
            },
            onDelete: () => b(s.id)
          }
        ))
      ))
    ));
  }
  function o({ presentation: p, onClick: k, onDelete: w }) {
    const y = n(null), [m, h] = t(0.16), C = 1e3, P = 650, b = P / C;
    a(() => {
      const s = y.current;
      if (!s || typeof ResizeObserver > "u") return;
      const x = new ResizeObserver((v) => {
        for (const U of v) {
          const _ = U.contentRect.width;
          _ > 0 && h(_ / C);
        }
      });
      return x.observe(s), () => x.disconnect();
    }, []);
    const T = p.created_at ? new Date(p.created_at * 1e3).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
    return /* @__PURE__ */ e.h(
      "div",
      {
        onClick: k,
        className: "group relative rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] overflow-hidden cursor-pointer hover:border-[var(--color-accent)] transition-colors",
        title: p.title
      },
      /* @__PURE__ */ e.h(
        "div",
        {
          ref: y,
          className: "relative bg-[var(--color-bg-primary)]",
          style: { width: "100%", paddingTop: `${b * 100}%`, overflow: "hidden" }
        },
        /* @__PURE__ */ e.h(
          "iframe",
          {
            src: e.app.absoluteApiUrl(`/presentations/${p.id}/html`),
            sandbox: "allow-same-origin",
            tabIndex: -1,
            "aria-hidden": !0,
            style: {
              position: "absolute",
              top: 0,
              left: 0,
              width: C,
              height: P,
              border: 0,
              pointerEvents: "none",
              transform: `scale(${m})`,
              transformOrigin: "top left"
            }
          }
        )
      ),
      /* @__PURE__ */ e.h("div", { className: "px-2 py-1.5 border-t border-[var(--color-border)]" }, /* @__PURE__ */ e.h("div", { className: "text-[11px] font-medium text-[var(--color-text-primary)] truncate" }, p.title || "Untitled"), Array.isArray(p.tags) && p.tags.length > 0 && /* @__PURE__ */ e.h("div", { className: "flex flex-wrap gap-0.5 mt-0.5 overflow-hidden", style: { maxHeight: 18 } }, p.tags.slice(0, 4).map((s) => /* @__PURE__ */ e.h(
        "span",
        {
          key: s,
          className: "text-[8px] font-mono leading-none px-1 py-[2px] rounded bg-white/5 border border-white/10 text-[var(--color-text-muted)] truncate",
          title: s
        },
        s
      )), p.tags.length > 4 && /* @__PURE__ */ e.h(
        "span",
        {
          className: "text-[8px] leading-none px-1 py-[2px] text-[var(--color-text-muted)]",
          title: p.tags.slice(4).join(", ")
        },
        "+",
        p.tags.length - 4
      )), T && /* @__PURE__ */ e.h("div", { className: "text-[9px] text-[var(--color-text-muted)] truncate mt-0.5" }, T)),
      /* @__PURE__ */ e.h(
        "button",
        {
          onClick: (s) => {
            s.stopPropagation(), w();
          },
          className: "hidden group-hover:flex absolute top-1 right-1 items-center justify-center w-5 h-5 rounded bg-black/60 text-white/80 hover:text-[var(--color-danger)] hover:bg-black/80",
          title: "Delete presentation"
        },
        /* @__PURE__ */ e.h("svg", { className: "w-3 h-3", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("path", { d: "M18 6L6 18M6 6l12 12" }))
      )
    );
  }
  const c = /* @__PURE__ */ new Map();
  function d({ windowKey: p, instanceId: k, onClose: w, onTitleChange: y }) {
    const m = k, [h, C] = t(null), [P, b] = t(!1), [T, s] = t(""), [x, v] = t(!1), [U, _] = t(!1), [g, A] = t(null), [F, B] = t(!1), [Y, ee] = t(!1), [W, N] = t(null), G = n(null), q = n(null), [D, Re] = t(null), te = r((l) => {
      var f;
      const u = (f = l.current) == null ? void 0 : f.getBoundingClientRect();
      u && Re({ top: u.bottom + 6, right: window.innerWidth - u.right });
    }, []), re = r(async () => {
      if (m)
        try {
          const u = await (await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${m}`))).json();
          if ((u == null ? void 0 : u.success) === !1) return;
          C(u), s(u.title || "");
        } catch {
        }
    }, [m]);
    a(() => {
      re();
    }, [re]), a(() => {
      const l = (u) => {
        var S;
        const f = u.detail;
        !f || f.type !== "presentation_update" || (f.action === "delete" && f.id === m ? w == null || w() : (f.action === "update" || f.action === "create") && ((S = f.presentation) == null ? void 0 : S.id) === m && (C(f.presentation), P || s(f.presentation.title || "")));
      };
      return window.addEventListener("aw-presentation-update", l), () => window.removeEventListener("aw-presentation-update", l);
    }, [m, w, P]), a(() => {
      if (!P && !x && !W) return;
      const l = (f) => {
        var S, ie, oe, ce;
        (S = G.current) != null && S.contains(f.target) || (ie = q.current) != null && ie.contains(f.target) || (ce = (oe = f.target).closest) != null && ce.call(oe, "[data-pres-popover]") || (b(!1), v(!1), N(null));
      }, u = (f) => {
        f.key === "Escape" && (b(!1), v(!1), N(null));
      };
      return document.addEventListener("mousedown", l), document.addEventListener("keydown", u), () => {
        document.removeEventListener("mousedown", l), document.removeEventListener("keydown", u);
      };
    }, [P, x, W]);
    const H = m ? e.app.absoluteApiUrl(`/presentations/${m}/html`) : null, J = r((l) => {
      const u = document.createElement("a");
      u.download = `${((h == null ? void 0 : h.title) || "presentation").replace(/[^a-zA-Z0-9_-]/g, "_")}.png`, u.href = l, u.click();
    }, [h == null ? void 0 : h.title]), ke = r(async () => {
      var l;
      N(null), ee(!0);
      try {
        const u = (l = c.get(p)) == null ? void 0 : l.contentDocument;
        if (u && u.body) {
          const f = await vt(u.documentElement, {
            backgroundColor: "#111318",
            pixelRatio: 2,
            width: u.documentElement.scrollWidth,
            height: u.documentElement.scrollHeight
          });
          J(f);
          return;
        }
        throw new Error("presentation content is not accessible from this window (cross-origin iframe)");
      } catch (u) {
        console.warn("Client-side export failed, falling back to server render:", u);
        try {
          const f = await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${m}/export`), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
          }), S = await f.json().catch(() => null);
          if (!f.ok || !(S != null && S.data_url))
            throw new Error((S == null ? void 0 : S.detail) || `export failed (${f.status})`);
          J(S.data_url);
        } catch (f) {
          console.error("Export failed:", f), N(f.message || "Export failed");
        }
      } finally {
        ee(!1);
      }
    }, [m, J, p]), ne = r((l) => {
      var u;
      if (y) {
        y(l);
        return;
      }
      (u = window.__awOpenAppWindow) == null || u.call(window, "presentations.viewer", m, l);
    }, [y, m]), ae = r(async () => {
      b(!1);
      const l = T.trim();
      !l || l === (h == null ? void 0 : h.title) || (await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${m}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: l })
      }), C((u) => u && { ...u, title: l }), ne(l));
    }, [T, h == null ? void 0 : h.title, m, ne]), Ce = r(async (l) => {
      if (m) {
        _(!0), A(null);
        try {
          const f = await (await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${m}/share`), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expires_in: l })
          })).json();
          f.success && f.token && A(`${H}?token=${f.token}`);
        } catch (u) {
          console.error("Share failed:", u);
        } finally {
          _(!1);
        }
      }
    }, [m, H]), Pe = r(() => {
      var l;
      g && ((l = navigator.clipboard) == null || l.writeText(g).then(() => {
        B(!0), setTimeout(() => B(!1), 2e3);
      }).catch(() => {
      }));
    }, [g]), Te = r(async () => {
      await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${m}`), { method: "DELETE" }), w == null || w();
    }, [m, w]);
    return /* @__PURE__ */ e.h(e.React.Fragment, null, /* @__PURE__ */ e.h(
      "button",
      {
        ref: G,
        onClick: () => {
          v(!1), b((l) => l ? !1 : (s((h == null ? void 0 : h.title) || ""), te(G), !0));
        },
        className: "p-1 rounded hover:bg-white/10 text-[var(--color-text-muted)]",
        title: "Rename presentation"
      },
      /* @__PURE__ */ e.h("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("path", { d: "M12 20h9" }), /* @__PURE__ */ e.h("path", { d: "M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z" }))
    ), /* @__PURE__ */ e.h(
      "button",
      {
        ref: q,
        onClick: () => {
          b(!1), A(null), B(!1), v((l) => l ? !1 : (te(q), !0));
        },
        className: "p-1 rounded hover:bg-white/10 text-[var(--color-text-muted)]",
        title: "Share presentation"
      },
      /* @__PURE__ */ e.h("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("circle", { cx: "18", cy: "5", r: "3" }), /* @__PURE__ */ e.h("circle", { cx: "6", cy: "12", r: "3" }), /* @__PURE__ */ e.h("circle", { cx: "18", cy: "19", r: "3" }), /* @__PURE__ */ e.h("path", { d: "M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" }))
    ), /* @__PURE__ */ e.h(
      "button",
      {
        onClick: () => {
          H && window.open(H, `presentation-${m}`, "popup=1,width=1000,height=700");
        },
        className: "p-1 rounded hover:bg-white/10 text-[var(--color-text-muted)]",
        title: "Pop out to new window"
      },
      /* @__PURE__ */ e.h("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("path", { d: "M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" }), /* @__PURE__ */ e.h("polyline", { points: "15 3 21 3 21 9" }), /* @__PURE__ */ e.h("line", { x1: "10", y1: "14", x2: "21", y2: "3" }))
    ), /* @__PURE__ */ e.h(
      "button",
      {
        onClick: ke,
        disabled: Y,
        className: `p-1 rounded ${Y ? "opacity-50 cursor-wait" : "hover:bg-white/10 cursor-pointer"} ${W ? "text-[var(--color-danger)]" : "text-[var(--color-text-muted)]"}`,
        title: W ? `Export failed: ${W}` : "Export as PNG"
      },
      /* @__PURE__ */ e.h("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("path", { d: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" }), /* @__PURE__ */ e.h("polyline", { points: "7 10 12 15 17 10" }), /* @__PURE__ */ e.h("line", { x1: "12", y1: "15", x2: "12", y2: "3" }))
    ), /* @__PURE__ */ e.h(
      "button",
      {
        onClick: Te,
        className: "p-1 rounded hover:bg-white/10 text-[var(--color-text-muted)] hover:text-[var(--color-danger)]",
        title: "Delete presentation"
      },
      /* @__PURE__ */ e.h("svg", { width: "14", height: "14", viewBox: "0 0 16 16", fill: "currentColor" }, /* @__PURE__ */ e.h("path", { d: "M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" }), /* @__PURE__ */ e.h("path", { fillRule: "evenodd", d: "M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2h3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1h3a1 1 0 0 1 1 1z" }))
    ), P && D && e.ReactDOM.createPortal(
      /* @__PURE__ */ e.h(
        "div",
        {
          "data-pres-popover": !0,
          className: "fixed z-[1000] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-2xl p-3",
          style: { top: D.top, right: D.right, minWidth: 260 }
        },
        /* @__PURE__ */ e.h("div", { className: "text-[11px] font-medium text-[var(--color-text-primary)] mb-2" }, "Rename presentation"),
        /* @__PURE__ */ e.h(
          "input",
          {
            autoFocus: !0,
            value: T,
            onChange: (l) => s(l.target.value),
            onKeyDown: (l) => {
              l.key === "Enter" && ae(), l.key === "Escape" && (b(!1), s((h == null ? void 0 : h.title) || ""));
            },
            className: "w-full text-[11px] bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2 py-1 text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
          }
        ),
        /* @__PURE__ */ e.h("div", { className: "flex justify-end mt-2" }, /* @__PURE__ */ e.h(
          "button",
          {
            onClick: ae,
            disabled: !T.trim(),
            className: "text-[11px] px-2 py-1 rounded bg-[var(--color-accent)]/20 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/30 transition-colors disabled:opacity-40"
          },
          "Rename"
        ))
      ),
      document.body
    ), x && D && e.ReactDOM.createPortal(
      /* @__PURE__ */ e.h(
        "div",
        {
          "data-pres-popover": !0,
          className: "fixed z-[1000] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-2xl p-3",
          style: { top: D.top, right: D.right, minWidth: 260 }
        },
        /* @__PURE__ */ e.h("div", { className: "text-[11px] font-medium text-[var(--color-text-primary)] mb-2" }, "Share presentation"),
        U ? /* @__PURE__ */ e.h("div", { className: "text-[11px] text-[var(--color-text-muted)] py-2 text-center" }, "Generating link…") : g ? /* @__PURE__ */ e.h("div", { className: "flex flex-col gap-2" }, /* @__PURE__ */ e.h("div", { className: "text-[10px] text-[var(--color-text-muted)]" }, "Link generated:"), /* @__PURE__ */ e.h("div", { className: "flex items-center gap-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2 py-1.5" }, /* @__PURE__ */ e.h("span", { className: "text-[10px] font-mono text-[var(--color-text-primary)] truncate flex-1", title: g }, g), /* @__PURE__ */ e.h("button", { onClick: Pe, className: "shrink-0 text-[10px] px-2 py-0.5 rounded bg-[var(--color-accent)]/20 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/30 transition-colors" }, F ? "✓ Copied" : "Copy")), /* @__PURE__ */ e.h("button", { onClick: () => A(null), className: "text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-left" }, "← Generate new link")) : /* @__PURE__ */ e.h("div", { className: "flex flex-col gap-1.5" }, /* @__PURE__ */ e.h("div", { className: "text-[10px] text-[var(--color-text-muted)] mb-1" }, "Link expires after:"), [{ label: "1 hour", value: 3600 }, { label: "1 day", value: 86400 }, { label: "Never expires", value: null }].map(({ label: l, value: u }) => /* @__PURE__ */ e.h(
          "button",
          {
            key: l,
            onClick: () => Ce(u),
            className: "text-left text-[11px] px-3 py-1.5 rounded bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-colors"
          },
          l
        )))
      ),
      document.body
    ), W && D && e.ReactDOM.createPortal(
      // The `title` attribute never surfaces on touch devices (iOS Safari
      // shows no hover tooltip on tap), so a red icon with no visible
      // reason reads as "broken, does nothing" — this makes it tappable.
      /* @__PURE__ */ e.h(
        "div",
        {
          "data-pres-popover": !0,
          className: "fixed z-[1000] bg-[var(--color-bg-secondary)] border border-[var(--color-danger)]/40 rounded-lg shadow-2xl p-3",
          style: { top: D.top, right: D.right, minWidth: 220, maxWidth: 280 }
        },
        /* @__PURE__ */ e.h("div", { className: "text-[11px] font-medium text-[var(--color-danger)] mb-1" }, "Export failed"),
        /* @__PURE__ */ e.h("div", { className: "text-[10px] text-[var(--color-text-muted)] mb-2" }, W),
        /* @__PURE__ */ e.h(
          "button",
          {
            onClick: () => N(null),
            className: "text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          },
          "Dismiss"
        )
      ),
      document.body
    ));
  }
  function L({ windowKey: p, instanceId: k, onClose: w }) {
    const y = k, m = n(null), h = y ? e.app.absoluteApiUrl(`/presentations/${y}/html`) : null;
    return a(() => (c.set(p, m.current), () => c.delete(p)), [p]), a(() => {
      const C = (P) => {
        const b = P.detail;
        (b == null ? void 0 : b.type) === "presentation_update" && b.action === "delete" && b.id === y && (w == null || w());
      };
      return window.addEventListener("aw-presentation-update", C), () => window.removeEventListener("aw-presentation-update", C);
    }, [y, w]), /* @__PURE__ */ e.h("div", { className: "flex flex-col bg-[var(--color-bg-secondary)] h-full" }, /* @__PURE__ */ e.h("div", { className: "flex-1 relative" }, h && /* @__PURE__ */ e.h("iframe", { ref: m, src: h, className: "absolute inset-0 w-full h-full bg-white border-0", title: "Presentation" })));
  }
  e.registerSlot("core.nav", i), e.registerWindow("presentations.viewer", L), ($ = e.registerWindowActions) == null || $.call(e, "presentations.viewer", d);
}
export {
  Et as default,
  Et as register
};
