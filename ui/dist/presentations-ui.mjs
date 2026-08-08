function be(e, t) {
  if (e.match(/^[a-z]+:\/\//i))
    return e;
  if (e.match(/^\/\//))
    return window.location.protocol + e;
  if (e.match(/^[a-z]+:/i))
    return e;
  const n = document.implementation.createHTMLDocument(), r = n.createElement("base"), a = n.createElement("a");
  return n.head.appendChild(r), n.body.appendChild(a), t && (r.href = t), a.href = e, a.href;
}
const ve = /* @__PURE__ */ (() => {
  let e = 0;
  const t = () => (
    // eslint-disable-next-line no-bitwise
    `0000${(Math.random() * 36 ** 4 << 0).toString(36)}`.slice(-4)
  );
  return () => (e += 1, `u${t()}${e}`);
})();
function $(e) {
  const t = [];
  for (let n = 0, r = e.length; n < r; n++)
    t.push(e[n]);
  return t;
}
let _ = null;
function oe(e = {}) {
  return _ || (e.includeStyleProperties ? (_ = e.includeStyleProperties, _) : (_ = $(window.getComputedStyle(document.documentElement)), _));
}
function N(e, t) {
  const r = (e.ownerDocument.defaultView || window).getComputedStyle(e).getPropertyValue(t);
  return r ? parseFloat(r.replace("px", "")) : 0;
}
function Ee(e) {
  const t = N(e, "border-left-width"), n = N(e, "border-right-width");
  return e.clientWidth + t + n;
}
function Se(e) {
  const t = N(e, "border-top-width"), n = N(e, "border-bottom-width");
  return e.clientHeight + t + n;
}
function se(e, t = {}) {
  const n = t.width || Ee(e), r = t.height || Se(e);
  return { width: n, height: r };
}
function ke() {
  let e, t;
  try {
    t = process;
  } catch {
  }
  const n = t && t.env ? t.env.devicePixelRatio : null;
  return n && (e = parseInt(n, 10), Number.isNaN(e) && (e = 1)), e || window.devicePixelRatio || 1;
}
const E = 16384;
function Ce(e) {
  (e.width > E || e.height > E) && (e.width > E && e.height > E ? e.width > e.height ? (e.height *= E / e.width, e.width = E) : (e.width *= E / e.height, e.height = E) : e.width > E ? (e.height *= E / e.width, e.width = E) : (e.width *= E / e.height, e.height = E));
}
function H(e) {
  return new Promise((t, n) => {
    const r = new Image();
    r.onload = () => {
      r.decode().then(() => {
        requestAnimationFrame(() => t(r));
      });
    }, r.onerror = n, r.crossOrigin = "anonymous", r.decoding = "async", r.src = e;
  });
}
async function Re(e) {
  return Promise.resolve().then(() => new XMLSerializer().serializeToString(e)).then(encodeURIComponent).then((t) => `data:image/svg+xml;charset=utf-8,${t}`);
}
async function Pe(e, t, n) {
  const r = "http://www.w3.org/2000/svg", a = document.createElementNS(r, "svg"), i = document.createElementNS(r, "foreignObject");
  return a.setAttribute("width", `${t}`), a.setAttribute("height", `${n}`), a.setAttribute("viewBox", `0 0 ${t} ${n}`), i.setAttribute("width", "100%"), i.setAttribute("height", "100%"), i.setAttribute("x", "0"), i.setAttribute("y", "0"), i.setAttribute("externalResourcesRequired", "true"), a.appendChild(i), i.appendChild(e), Re(a);
}
const v = (e, t) => {
  if (e instanceof t)
    return !0;
  const n = Object.getPrototypeOf(e);
  return n === null ? !1 : n.constructor.name === t.name || v(n, t);
};
function Te(e) {
  const t = e.getPropertyValue("content");
  return `${e.cssText} content: '${t.replace(/'|"/g, "")}';`;
}
function $e(e, t) {
  return oe(t).map((n) => {
    const r = e.getPropertyValue(n), a = e.getPropertyPriority(n);
    return `${n}: ${r}${a ? " !important" : ""};`;
  }).join(" ");
}
function Le(e, t, n, r) {
  const a = `.${e}:${t}`, i = n.cssText ? Te(n) : $e(n, r);
  return document.createTextNode(`${a}{${i}}`);
}
function Y(e, t, n, r) {
  const a = window.getComputedStyle(e, n), i = a.getPropertyValue("content");
  if (i === "" || i === "none")
    return;
  const o = ve();
  try {
    t.className = `${t.className} ${o}`;
  } catch {
    return;
  }
  const s = document.createElement("style");
  s.appendChild(Le(o, n, a, r)), t.appendChild(s);
}
function Ae(e, t, n) {
  Y(e, t, ":before", n), Y(e, t, ":after", n);
}
const ee = "application/font-woff", te = "image/jpeg", Fe = {
  woff: ee,
  woff2: ee,
  ttf: "application/font-truetype",
  eot: "application/vnd.ms-fontobject",
  png: "image/png",
  jpg: te,
  jpeg: te,
  gif: "image/gif",
  tiff: "image/tiff",
  svg: "image/svg+xml",
  webp: "image/webp"
};
function Ue(e) {
  const t = /\.([^./]*?)$/g.exec(e);
  return t ? t[1] : "";
}
function G(e) {
  const t = Ue(e).toLowerCase();
  return Fe[t] || "";
}
function De(e) {
  return e.split(/,/)[1];
}
function z(e) {
  return e.search(/^(data:)/) !== -1;
}
function _e(e, t) {
  return `data:${t};base64,${e}`;
}
async function ce(e, t, n) {
  const r = await fetch(e, t);
  if (r.status === 404)
    throw new Error(`Resource "${r.url}" not found`);
  const a = await r.blob();
  return new Promise((i, o) => {
    const s = new FileReader();
    s.onerror = o, s.onloadend = () => {
      try {
        i(n({ res: r, result: s.result }));
      } catch (c) {
        o(c);
      }
    }, s.readAsDataURL(a);
  });
}
const B = {};
function Ie(e, t, n) {
  let r = e.replace(/\?.*/, "");
  return n && (r = e), /ttf|otf|eot|woff2?/i.test(r) && (r = r.replace(/.*\//, "")), t ? `[${t}]${r}` : r;
}
async function q(e, t, n) {
  const r = Ie(e, t, n.includeQueryParams);
  if (B[r] != null)
    return B[r];
  n.cacheBust && (e += (/\?/.test(e) ? "&" : "?") + (/* @__PURE__ */ new Date()).getTime());
  let a;
  try {
    const i = await ce(e, n.fetchRequestInit, ({ res: o, result: s }) => (t || (t = o.headers.get("Content-Type") || ""), De(s)));
    a = _e(i, t);
  } catch (i) {
    a = n.imagePlaceholder || "";
    let o = `Failed to fetch resource: ${e}`;
    i && (o = typeof i == "string" ? i : i.message), o && console.warn(o);
  }
  return B[r] = a, a;
}
async function Oe(e) {
  const t = e.toDataURL();
  return t === "data:," ? e.cloneNode(!1) : H(t);
}
async function Ne(e, t) {
  if (e.currentSrc) {
    const i = document.createElement("canvas"), o = i.getContext("2d");
    i.width = e.clientWidth, i.height = e.clientHeight, o == null || o.drawImage(e, 0, 0, i.width, i.height);
    const s = i.toDataURL();
    return H(s);
  }
  const n = e.poster, r = G(n), a = await q(n, r, t);
  return H(a);
}
async function He(e, t) {
  var n;
  try {
    if (!((n = e == null ? void 0 : e.contentDocument) === null || n === void 0) && n.body)
      return await W(e.contentDocument.body, t, !0);
  } catch {
  }
  return e.cloneNode(!1);
}
async function We(e, t) {
  return v(e, HTMLCanvasElement) ? Oe(e) : v(e, HTMLVideoElement) ? Ne(e, t) : v(e, HTMLIFrameElement) ? He(e, t) : e.cloneNode(le(e));
}
const Me = (e) => e.tagName != null && e.tagName.toUpperCase() === "SLOT", le = (e) => e.tagName != null && e.tagName.toUpperCase() === "SVG";
async function Ve(e, t, n) {
  var r, a;
  if (le(t))
    return t;
  let i = [];
  return Me(e) && e.assignedNodes ? i = $(e.assignedNodes()) : v(e, HTMLIFrameElement) && (!((r = e.contentDocument) === null || r === void 0) && r.body) ? i = $(e.contentDocument.body.childNodes) : i = $(((a = e.shadowRoot) !== null && a !== void 0 ? a : e).childNodes), i.length === 0 || v(e, HTMLVideoElement) || await i.reduce((o, s) => o.then(() => W(s, n)).then((c) => {
    c && t.appendChild(c);
  }), Promise.resolve()), t;
}
function je(e, t, n) {
  const r = t.style;
  if (!r)
    return;
  const a = window.getComputedStyle(e);
  a.cssText ? (r.cssText = a.cssText, r.transformOrigin = a.transformOrigin) : oe(n).forEach((i) => {
    let o = a.getPropertyValue(i);
    i === "font-size" && o.endsWith("px") && (o = `${Math.floor(parseFloat(o.substring(0, o.length - 2))) - 0.1}px`), v(e, HTMLIFrameElement) && i === "display" && o === "inline" && (o = "block"), i === "d" && t.getAttribute("d") && (o = `path(${t.getAttribute("d")})`), r.setProperty(i, o, a.getPropertyPriority(i));
  });
}
function Be(e, t) {
  v(e, HTMLTextAreaElement) && (t.innerHTML = e.value), v(e, HTMLInputElement) && t.setAttribute("value", e.value);
}
function ze(e, t) {
  if (v(e, HTMLSelectElement)) {
    const n = t, r = Array.from(n.children).find((a) => e.value === a.getAttribute("value"));
    r && r.setAttribute("selected", "");
  }
}
function Ge(e, t, n) {
  return v(t, Element) && (je(e, t, n), Ae(e, t, n), Be(e, t), ze(e, t)), t;
}
async function qe(e, t) {
  const n = e.querySelectorAll ? e.querySelectorAll("use") : [];
  if (n.length === 0)
    return e;
  const r = {};
  for (let i = 0; i < n.length; i++) {
    const s = n[i].getAttribute("xlink:href");
    if (s) {
      const c = e.querySelector(s), w = document.querySelector(s);
      !c && w && !r[s] && (r[s] = await W(w, t, !0));
    }
  }
  const a = Object.values(r);
  if (a.length) {
    const i = "http://www.w3.org/1999/xhtml", o = document.createElementNS(i, "svg");
    o.setAttribute("xmlns", i), o.style.position = "absolute", o.style.width = "0", o.style.height = "0", o.style.overflow = "hidden", o.style.display = "none";
    const s = document.createElementNS(i, "defs");
    o.appendChild(s);
    for (let c = 0; c < a.length; c++)
      s.appendChild(a[c]);
    e.appendChild(o);
  }
  return e;
}
async function W(e, t, n) {
  return !n && t.filter && !t.filter(e) ? null : Promise.resolve(e).then((r) => We(r, t)).then((r) => Ve(e, r, t)).then((r) => Ge(e, r, t)).then((r) => qe(r, t));
}
const ue = /url\((['"]?)([^'"]+?)\1\)/g, Je = /url\([^)]+\)\s*format\((["']?)([^"']+)\1\)/g, Xe = /src:\s*(?:url\([^)]+\)\s*format\([^)]+\)[,;]\s*)+/g;
function Ke(e) {
  const t = e.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1");
  return new RegExp(`(url\\(['"]?)(${t})(['"]?\\))`, "g");
}
function Qe(e) {
  const t = [];
  return e.replace(ue, (n, r, a) => (t.push(a), n)), t.filter((n) => !z(n));
}
async function Ze(e, t, n, r, a) {
  try {
    const i = n ? be(t, n) : t, o = G(t);
    let s;
    return a || (s = await q(i, o, r)), e.replace(Ke(t), `$1${s}$3`);
  } catch {
  }
  return e;
}
function Ye(e, { preferredFontFormat: t }) {
  return t ? e.replace(Xe, (n) => {
    for (; ; ) {
      const [r, , a] = Je.exec(n) || [];
      if (!a)
        return "";
      if (a === t)
        return `src: ${r};`;
    }
  }) : e;
}
function de(e) {
  return e.search(ue) !== -1;
}
async function fe(e, t, n) {
  if (!de(e))
    return e;
  const r = Ye(e, n);
  return Qe(r).reduce((i, o) => i.then((s) => Ze(s, o, t, n)), Promise.resolve(r));
}
async function I(e, t, n) {
  var r;
  const a = (r = t.style) === null || r === void 0 ? void 0 : r.getPropertyValue(e);
  if (a) {
    const i = await fe(a, null, n);
    return t.style.setProperty(e, i, t.style.getPropertyPriority(e)), !0;
  }
  return !1;
}
async function et(e, t) {
  await I("background", e, t) || await I("background-image", e, t), await I("mask", e, t) || await I("-webkit-mask", e, t) || await I("mask-image", e, t) || await I("-webkit-mask-image", e, t);
}
async function tt(e, t) {
  const n = v(e, HTMLImageElement);
  if (!(n && !z(e.src)) && !(v(e, SVGImageElement) && !z(e.href.baseVal)))
    return;
  const r = n ? e.src : e.href.baseVal, a = await q(r, G(r), t);
  await new Promise((i, o) => {
    e.onload = i, e.onerror = t.onImageErrorHandler ? (...c) => {
      try {
        i(t.onImageErrorHandler(...c));
      } catch (w) {
        o(w);
      }
    } : o;
    const s = e;
    s.decode && (s.decode = i), s.loading === "lazy" && (s.loading = "eager"), n ? (e.srcset = "", e.src = a) : e.href.baseVal = a;
  });
}
async function rt(e, t) {
  const r = $(e.childNodes).map((a) => me(a, t));
  await Promise.all(r).then(() => e);
}
async function me(e, t) {
  v(e, Element) && (await et(e, t), await tt(e, t), await rt(e, t));
}
function nt(e, t) {
  const { style: n } = e;
  t.backgroundColor && (n.backgroundColor = t.backgroundColor), t.width && (n.width = `${t.width}px`), t.height && (n.height = `${t.height}px`);
  const r = t.style;
  return r != null && Object.keys(r).forEach((a) => {
    n[a] = r[a];
  }), e;
}
const re = {};
async function ne(e) {
  let t = re[e];
  if (t != null)
    return t;
  const r = await (await fetch(e)).text();
  return t = { url: e, cssText: r }, re[e] = t, t;
}
async function ae(e, t) {
  let n = e.cssText;
  const r = /url\(["']?([^"')]+)["']?\)/g, i = (n.match(/url\([^)]+\)/g) || []).map(async (o) => {
    let s = o.replace(r, "$1");
    return s.startsWith("https://") || (s = new URL(s, e.url).href), ce(s, t.fetchRequestInit, ({ result: c }) => (n = n.replace(o, `url(${c})`), [o, c]));
  });
  return Promise.all(i).then(() => n);
}
function ie(e) {
  if (e == null)
    return [];
  const t = [], n = /(\/\*[\s\S]*?\*\/)/gi;
  let r = e.replace(n, "");
  const a = new RegExp("((@.*?keyframes [\\s\\S]*?){([\\s\\S]*?}\\s*?)})", "gi");
  for (; ; ) {
    const c = a.exec(r);
    if (c === null)
      break;
    t.push(c[0]);
  }
  r = r.replace(a, "");
  const i = /@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi, o = "((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})", s = new RegExp(o, "gi");
  for (; ; ) {
    let c = i.exec(r);
    if (c === null) {
      if (c = s.exec(r), c === null)
        break;
      i.lastIndex = s.lastIndex;
    } else
      s.lastIndex = i.lastIndex;
    t.push(c[0]);
  }
  return t;
}
async function at(e, t) {
  const n = [], r = [];
  return e.forEach((a) => {
    if ("cssRules" in a)
      try {
        $(a.cssRules || []).forEach((i, o) => {
          if (i.type === CSSRule.IMPORT_RULE) {
            let s = o + 1;
            const c = i.href, w = ne(c).then((p) => ae(p, t)).then((p) => ie(p).forEach((y) => {
              try {
                a.insertRule(y, y.startsWith("@import") ? s += 1 : a.cssRules.length);
              } catch (R) {
                console.error("Error inserting rule from remote css", {
                  rule: y,
                  error: R
                });
              }
            })).catch((p) => {
              console.error("Error loading remote css", p.toString());
            });
            r.push(w);
          }
        });
      } catch (i) {
        const o = e.find((s) => s.href == null) || document.styleSheets[0];
        a.href != null && r.push(ne(a.href).then((s) => ae(s, t)).then((s) => ie(s).forEach((c) => {
          o.insertRule(c, o.cssRules.length);
        })).catch((s) => {
          console.error("Error loading remote stylesheet", s);
        })), console.error("Error inlining remote css file", i);
      }
  }), Promise.all(r).then(() => (e.forEach((a) => {
    if ("cssRules" in a)
      try {
        $(a.cssRules || []).forEach((i) => {
          n.push(i);
        });
      } catch (i) {
        console.error(`Error while reading CSS rules from ${a.href}`, i);
      }
  }), n));
}
function it(e) {
  return e.filter((t) => t.type === CSSRule.FONT_FACE_RULE).filter((t) => de(t.style.getPropertyValue("src")));
}
async function ot(e, t) {
  if (e.ownerDocument == null)
    throw new Error("Provided element is not within a Document");
  const n = $(e.ownerDocument.styleSheets), r = await at(n, t);
  return it(r);
}
function he(e) {
  return e.trim().replace(/["']/g, "");
}
function st(e) {
  const t = /* @__PURE__ */ new Set();
  function n(r) {
    (r.style.fontFamily || getComputedStyle(r).fontFamily).split(",").forEach((i) => {
      t.add(he(i));
    }), Array.from(r.children).forEach((i) => {
      i instanceof HTMLElement && n(i);
    });
  }
  return n(e), t;
}
async function ct(e, t) {
  const n = await ot(e, t), r = st(e);
  return (await Promise.all(n.filter((i) => r.has(he(i.style.fontFamily))).map((i) => {
    const o = i.parentStyleSheet ? i.parentStyleSheet.href : null;
    return fe(i.cssText, o, t);
  }))).join(`
`);
}
async function lt(e, t) {
  const n = t.fontEmbedCSS != null ? t.fontEmbedCSS : t.skipFonts ? null : await ct(e, t);
  if (n) {
    const r = document.createElement("style"), a = document.createTextNode(n);
    r.appendChild(a), e.firstChild ? e.insertBefore(r, e.firstChild) : e.appendChild(r);
  }
}
async function ut(e, t = {}) {
  const { width: n, height: r } = se(e, t), a = await W(e, t, !0);
  return await lt(a, t), await me(a, t), nt(a, t), await Pe(a, n, r);
}
async function dt(e, t = {}) {
  const { width: n, height: r } = se(e, t), a = await ut(e, t), i = await H(a), o = document.createElement("canvas"), s = o.getContext("2d"), c = t.pixelRatio || ke(), w = t.canvasWidth || n, p = t.canvasHeight || r;
  return o.width = w * c, o.height = p * c, t.skipAutoScale || Ce(o), o.style.width = `${w}`, o.style.height = `${p}`, t.backgroundColor && (s.fillStyle = t.backgroundColor, s.fillRect(0, 0, o.width, o.height)), s.drawImage(i, 0, 0, o.width, o.height), o;
}
async function ft(e, t = {}) {
  return (await dt(e, t)).toDataURL();
}
function mt(e) {
  const { useState: t, useRef: n, useCallback: r, useEffect: a } = e.React;
  function i() {
    const [c, w] = t([]), [p, y] = t(!1), R = n(null), S = r((l, x) => {
      var b;
      (b = window.__awOpenAppWindow) == null || b.call(window, "presentations.viewer", l, x);
    }, []);
    a(() => (window.__awOpenPresentation = (l) => {
      const x = c.find((b) => b.id === l);
      S(l, x == null ? void 0 : x.title);
    }, () => {
      delete window.__awOpenPresentation;
    }), [c, S]), a(() => {
      let l, x, b = !1;
      const C = () => {
        try {
          l = new WebSocket(e.app.wsUrl("/ws")), l.onmessage = (F) => {
            let g;
            try {
              g = JSON.parse(F.data);
            } catch {
              return;
            }
            if (g.type === "presentation_init") {
              w(g.presentations || []);
              return;
            }
            if (g.type === "presentation_update") {
              try {
                window.dispatchEvent(new CustomEvent("aw-presentation-update", { detail: g }));
              } catch {
              }
              g.action === "create" ? (w((A) => [...A.filter((T) => T.id !== g.presentation.id), g.presentation]), g.presentation.visible !== !1 && !g.silent && S(g.presentation.id, g.presentation.title)) : g.action === "update" ? w((A) => A.map((T) => T.id === g.presentation.id ? g.presentation : T)) : g.action === "delete" && w((A) => A.filter((T) => T.id !== g.id));
            }
          }, l.onclose = () => {
            b || (x = setTimeout(C, 5e3));
          }, l.onerror = () => {
            try {
              l.close();
            } catch {
            }
          };
        } catch {
          b || (x = setTimeout(C, 5e3));
        }
      };
      return C(), () => {
        if (b = !0, clearTimeout(x), l) {
          l.onclose = null;
          try {
            l.close();
          } catch {
          }
        }
      };
    }, [S]);
    const m = r(() => {
      clearTimeout(R.current), y(!0);
    }, []), L = r(() => {
      clearTimeout(R.current), R.current = setTimeout(() => y(!1), 150);
    }, []);
    a(() => () => clearTimeout(R.current), []);
    const d = r(async (l) => {
      await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${l}`), { method: "DELETE" });
    }, []), k = [...c].sort((l, x) => (x.created_at || 0) - (l.created_at || 0));
    return /* @__PURE__ */ e.h("div", { className: "relative", onMouseEnter: m, onMouseLeave: L }, /* @__PURE__ */ e.h(
      "button",
      {
        onClick: () => y((l) => !l),
        className: "px-3 py-1 text-xs rounded transition-colors cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5"
      },
      "Presentation",
      k.length > 0 && /* @__PURE__ */ e.h("span", { className: "ml-1.5 inline-flex items-center justify-center min-w-[16px] h-[16px] rounded-full text-[9px] font-bold px-1 bg-[var(--color-accent)]/20 text-[var(--color-accent)]" }, k.length)
    ), p && /* @__PURE__ */ e.h(
      "div",
      {
        className: "absolute left-0 top-full mt-2 z-50 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-2xl p-3",
        style: { minWidth: 320, maxWidth: 720 }
      },
      k.length === 0 ? /* @__PURE__ */ e.h("div", { className: "px-4 py-6 text-center text-xs text-[var(--color-text-muted)] italic" }, "No presentations yet. Use ", /* @__PURE__ */ e.h("code", { className: "bg-white/10 px-1 rounded" }, "/aw-presentation"), " to create one.") : /* @__PURE__ */ e.h(e.React.Fragment, null, /* @__PURE__ */ e.h("div", { className: "text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2 px-1" }, "Presentations · newest first"), /* @__PURE__ */ e.h(
        "div",
        {
          className: "grid gap-2 overflow-y-auto",
          style: { gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", maxHeight: "70vh" }
        },
        k.map((l) => /* @__PURE__ */ e.h(
          o,
          {
            key: l.id,
            presentation: l,
            onClick: () => {
              y(!1), S(l.id, l.title);
            },
            onDelete: () => d(l.id)
          }
        ))
      ))
    ));
  }
  function o({ presentation: c, onClick: w, onDelete: p }) {
    const y = n(null), [R, S] = t(0.16), m = 1e3, L = 650, d = L / m;
    a(() => {
      const l = y.current;
      if (!l || typeof ResizeObserver > "u") return;
      const x = new ResizeObserver((b) => {
        for (const C of b) {
          const F = C.contentRect.width;
          F > 0 && S(F / m);
        }
      });
      return x.observe(l), () => x.disconnect();
    }, []);
    const k = c.created_at ? new Date(c.created_at * 1e3).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
    return /* @__PURE__ */ e.h(
      "div",
      {
        onClick: w,
        className: "group relative rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] overflow-hidden cursor-pointer hover:border-[var(--color-accent)] transition-colors",
        title: c.title
      },
      /* @__PURE__ */ e.h(
        "div",
        {
          ref: y,
          className: "relative bg-[var(--color-bg-primary)]",
          style: { width: "100%", paddingTop: `${d * 100}%`, overflow: "hidden" }
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
              width: m,
              height: L,
              border: 0,
              pointerEvents: "none",
              transform: `scale(${R})`,
              transformOrigin: "top left"
            }
          }
        )
      ),
      /* @__PURE__ */ e.h("div", { className: "px-2 py-1.5 border-t border-[var(--color-border)]" }, /* @__PURE__ */ e.h("div", { className: "text-[11px] font-medium text-[var(--color-text-primary)] truncate" }, c.title || "Untitled"), Array.isArray(c.tags) && c.tags.length > 0 && /* @__PURE__ */ e.h("div", { className: "flex flex-wrap gap-0.5 mt-0.5 overflow-hidden", style: { maxHeight: 18 } }, c.tags.slice(0, 4).map((l) => /* @__PURE__ */ e.h(
        "span",
        {
          key: l,
          className: "text-[8px] font-mono leading-none px-1 py-[2px] rounded bg-white/5 border border-white/10 text-[var(--color-text-muted)] truncate",
          title: l
        },
        l
      )), c.tags.length > 4 && /* @__PURE__ */ e.h(
        "span",
        {
          className: "text-[8px] leading-none px-1 py-[2px] text-[var(--color-text-muted)]",
          title: c.tags.slice(4).join(", ")
        },
        "+",
        c.tags.length - 4
      )), k && /* @__PURE__ */ e.h("div", { className: "text-[9px] text-[var(--color-text-muted)] truncate mt-0.5" }, k)),
      /* @__PURE__ */ e.h(
        "button",
        {
          onClick: (l) => {
            l.stopPropagation(), p();
          },
          className: "hidden group-hover:flex absolute top-1 right-1 items-center justify-center w-5 h-5 rounded bg-black/60 text-white/80 hover:text-[var(--color-danger)] hover:bg-black/80",
          title: "Delete presentation"
        },
        /* @__PURE__ */ e.h("svg", { className: "w-3 h-3", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("path", { d: "M18 6L6 18M6 6l12 12" }))
      )
    );
  }
  function s({ windowKey: c, instanceId: w, onClose: p, onMaximize: y, isMaximized: R, onTitleChange: S }) {
    const m = w, L = n(null), [d, k] = t(null), [l, x] = t(!1), [b, C] = t(""), [F, g] = t(!1), [A, T] = t(!1), [U, O] = t(null), [pe, M] = t(!1), [J, X] = t(!1), [V, K] = t(null), Q = r(async () => {
      if (m)
        try {
          const f = await (await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${m}`))).json();
          if ((f == null ? void 0 : f.success) === !1) return;
          k(f), C(f.title || "");
        } catch {
        }
    }, [m]);
    a(() => {
      Q();
    }, [Q]), a(() => {
      const u = (f) => {
        var P;
        const h = f.detail;
        !h || h.type !== "presentation_update" || (h.action === "delete" && h.id === m ? p == null || p() : (h.action === "update" || h.action === "create") && ((P = h.presentation) == null ? void 0 : P.id) === m && (k(h.presentation), l || C(h.presentation.title || "")));
      };
      return window.addEventListener("aw-presentation-update", u), () => window.removeEventListener("aw-presentation-update", u);
    }, [m, p, l]);
    const D = m ? e.app.absoluteApiUrl(`/presentations/${m}/html`) : null, j = r((u) => {
      const f = document.createElement("a");
      f.download = `${((d == null ? void 0 : d.title) || "presentation").replace(/[^a-zA-Z0-9_-]/g, "_")}.png`, f.href = u, f.click();
    }, [d == null ? void 0 : d.title]), ge = r(async () => {
      var u;
      K(null), X(!0);
      try {
        const f = (u = L.current) == null ? void 0 : u.contentDocument;
        if (f && f.body) {
          const h = await ft(f.documentElement, {
            backgroundColor: "#111318",
            pixelRatio: 2,
            width: f.documentElement.scrollWidth,
            height: f.documentElement.scrollHeight
          });
          j(h);
          return;
        }
        throw new Error("presentation content is not accessible from this window (cross-origin iframe)");
      } catch (f) {
        console.warn("Client-side export failed, falling back to server render:", f);
        try {
          const h = await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${m}/export`), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
          }), P = await h.json().catch(() => null);
          if (!h.ok || !(P != null && P.data_url))
            throw new Error((P == null ? void 0 : P.detail) || `export failed (${h.status})`);
          j(P.data_url);
        } catch (h) {
          console.error("Export failed:", h), K(h.message || "Export failed");
        }
      } finally {
        X(!1);
      }
    }, [m, j]), Z = r(async () => {
      x(!1);
      const u = b.trim();
      !u || u === (d == null ? void 0 : d.title) || (await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${m}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: u })
      }), k((f) => f && { ...f, title: u }), S == null || S(u));
    }, [b, d == null ? void 0 : d.title, m, S]), we = r(async (u) => {
      if (m) {
        T(!0), O(null);
        try {
          const h = await (await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${m}/share`), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expires_in: u })
          })).json();
          h.success && h.token && O(`${D}?token=${h.token}`);
        } catch (f) {
          console.error("Share failed:", f);
        } finally {
          T(!1);
        }
      }
    }, [m, D]), xe = r(() => {
      var u;
      U && ((u = navigator.clipboard) == null || u.writeText(U).then(() => {
        M(!0), setTimeout(() => M(!1), 2e3);
      }).catch(() => {
      }));
    }, [U]), ye = r(async () => {
      await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${m}`), { method: "DELETE" }), p == null || p();
    }, [m, p]);
    return /* @__PURE__ */ e.h("div", { className: "flex flex-col bg-[var(--color-bg-secondary)] h-full" }, /* @__PURE__ */ e.h("div", { className: "flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)] shrink-0", onMouseDown: (u) => u.stopPropagation() }, /* @__PURE__ */ e.h("div", { className: "flex items-center gap-2 min-w-0" }, l ? /* @__PURE__ */ e.h(
      "input",
      {
        autoFocus: !0,
        value: b,
        onChange: (u) => C(u.target.value),
        onBlur: Z,
        onKeyDown: (u) => {
          u.key === "Enter" && Z(), u.key === "Escape" && (x(!1), C((d == null ? void 0 : d.title) || ""));
        },
        className: "font-semibold text-[13px] text-[var(--color-text-primary)] bg-[var(--color-bg-primary)] border border-[var(--color-accent)] rounded px-1 py-0 outline-none w-48"
      }
    ) : /* @__PURE__ */ e.h(
      "span",
      {
        className: "text-[13px] text-[var(--color-text-primary)] truncate cursor-text",
        onDoubleClick: () => {
          x(!0), C((d == null ? void 0 : d.title) || "");
        },
        title: "Double-click to rename"
      },
      (d == null ? void 0 : d.title) || "Untitled"
    )), /* @__PURE__ */ e.h("div", { className: "flex items-center gap-1" }, /* @__PURE__ */ e.h("div", { className: "relative" }, /* @__PURE__ */ e.h(
      "button",
      {
        onClick: () => {
          g((u) => !u), O(null), M(!1);
        },
        className: "p-1.5 rounded hover:bg-white/10 transition-colors",
        title: "Share presentation"
      },
      /* @__PURE__ */ e.h("svg", { className: "w-4 h-4 text-[var(--color-text-muted)]", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("circle", { cx: "18", cy: "5", r: "3" }), /* @__PURE__ */ e.h("circle", { cx: "6", cy: "12", r: "3" }), /* @__PURE__ */ e.h("circle", { cx: "18", cy: "19", r: "3" }), /* @__PURE__ */ e.h("path", { d: "M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" }))
    ), F && /* @__PURE__ */ e.h(
      "div",
      {
        className: "absolute right-0 top-full mt-2 z-50 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-2xl p-3",
        style: { minWidth: 260 }
      },
      /* @__PURE__ */ e.h("div", { className: "text-[11px] font-medium text-[var(--color-text-primary)] mb-2" }, "Share presentation"),
      A ? /* @__PURE__ */ e.h("div", { className: "text-[11px] text-[var(--color-text-muted)] py-2 text-center" }, "Generating link…") : U ? /* @__PURE__ */ e.h("div", { className: "flex flex-col gap-2" }, /* @__PURE__ */ e.h("div", { className: "text-[10px] text-[var(--color-text-muted)]" }, "Link generated:"), /* @__PURE__ */ e.h("div", { className: "flex items-center gap-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2 py-1.5" }, /* @__PURE__ */ e.h("span", { className: "text-[10px] font-mono text-[var(--color-text-primary)] truncate flex-1", title: U }, U), /* @__PURE__ */ e.h("button", { onClick: xe, className: "shrink-0 text-[10px] px-2 py-0.5 rounded bg-[var(--color-accent)]/20 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/30 transition-colors" }, pe ? "✓ Copied" : "Copy")), /* @__PURE__ */ e.h("button", { onClick: () => O(null), className: "text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-left" }, "← Generate new link")) : /* @__PURE__ */ e.h("div", { className: "flex flex-col gap-1.5" }, /* @__PURE__ */ e.h("div", { className: "text-[10px] text-[var(--color-text-muted)] mb-1" }, "Link expires after:"), [{ label: "1 hour", value: 3600 }, { label: "1 day", value: 86400 }, { label: "Never expires", value: null }].map(({ label: u, value: f }) => /* @__PURE__ */ e.h(
        "button",
        {
          key: u,
          onClick: () => we(f),
          className: "text-left text-[11px] px-3 py-1.5 rounded bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-colors"
        },
        u
      )))
    )), /* @__PURE__ */ e.h(
      "button",
      {
        onClick: () => {
          D && window.open(D, `presentation-${m}`, "popup=1,width=1000,height=700");
        },
        className: "p-1.5 rounded hover:bg-white/10 transition-colors",
        title: "Pop out to new window"
      },
      /* @__PURE__ */ e.h("svg", { className: "w-4 h-4 text-[var(--color-text-muted)]", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("path", { d: "M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" }), /* @__PURE__ */ e.h("polyline", { points: "15 3 21 3 21 9" }), /* @__PURE__ */ e.h("line", { x1: "10", y1: "14", x2: "21", y2: "3" }))
    ), /* @__PURE__ */ e.h(
      "button",
      {
        onClick: ge,
        disabled: J,
        className: `p-1.5 rounded transition-colors ${J ? "opacity-50 cursor-wait" : "hover:bg-white/10 cursor-pointer"}`,
        title: V ? `Export failed: ${V}` : "Export as PNG"
      },
      /* @__PURE__ */ e.h("svg", { className: `w-4 h-4 ${V ? "text-[var(--color-danger)]" : "text-[var(--color-text-muted)]"}`, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("path", { d: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" }), /* @__PURE__ */ e.h("polyline", { points: "7 10 12 15 17 10" }), /* @__PURE__ */ e.h("line", { x1: "12", y1: "15", x2: "12", y2: "3" }))
    ), /* @__PURE__ */ e.h("button", { onClick: () => y == null ? void 0 : y(c), className: "p-1.5 rounded hover:bg-white/10 transition-colors", title: R ? "Restore" : "Maximize" }, /* @__PURE__ */ e.h("svg", { className: "w-4 h-4 text-[var(--color-text-muted)]", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }))), /* @__PURE__ */ e.h("button", { onClick: ye, className: "p-1.5 rounded hover:bg-white/10 transition-colors", title: "Delete presentation" }, /* @__PURE__ */ e.h("svg", { className: "w-4 h-4 text-[var(--color-text-muted)] hover:text-[var(--color-danger)]", viewBox: "0 0 16 16", fill: "currentColor" }, /* @__PURE__ */ e.h("path", { d: "M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" }), /* @__PURE__ */ e.h("path", { fillRule: "evenodd", d: "M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2h3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1h3a1 1 0 0 1 1 1z" }))))), /* @__PURE__ */ e.h("div", { className: "flex-1 relative", onClick: () => g(!1) }, D && /* @__PURE__ */ e.h("iframe", { ref: L, src: D, className: "absolute inset-0 w-full h-full bg-white border-0", title: (d == null ? void 0 : d.title) || "Presentation" })));
  }
  e.registerSlot("core.nav", i), e.registerWindow("presentations.viewer", s);
}
export {
  mt as default,
  mt as register
};
