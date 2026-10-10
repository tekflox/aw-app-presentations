function Ae(e, t) {
  if (e.match(/^[a-z]+:\/\//i))
    return e;
  if (e.match(/^\/\//))
    return window.location.protocol + e;
  if (e.match(/^[a-z]+:/i))
    return e;
  const n = document.implementation.createHTMLDocument(), r = n.createElement("base"), a = n.createElement("a");
  return n.head.appendChild(r), n.body.appendChild(a), t && (r.href = t), a.href = e, a.href;
}
const Ne = /* @__PURE__ */ (() => {
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
let q = null;
function be(e = {}) {
  return q || (e.includeStyleProperties ? (q = e.includeStyleProperties, q) : (q = G(window.getComputedStyle(document.documentElement)), q));
}
function Q(e, t) {
  const r = (e.ownerDocument.defaultView || window).getComputedStyle(e).getPropertyValue(t);
  return r ? parseFloat(r.replace("px", "")) : 0;
}
function Fe(e) {
  const t = Q(e, "border-left-width"), n = Q(e, "border-right-width");
  return e.clientWidth + t + n;
}
function We(e) {
  const t = Q(e, "border-top-width"), n = Q(e, "border-bottom-width");
  return e.clientHeight + t + n;
}
function ve(e, t = {}) {
  const n = t.width || Fe(e), r = t.height || We(e);
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
const M = 16384;
function De(e) {
  (e.width > M || e.height > M) && (e.width > M && e.height > M ? e.width > e.height ? (e.height *= M / e.width, e.width = M) : (e.width *= M / e.height, e.height = M) : e.width > M ? (e.height *= M / e.width, e.width = M) : (e.width *= M / e.height, e.height = M));
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
async function Ue(e) {
  return Promise.resolve().then(() => new XMLSerializer().serializeToString(e)).then(encodeURIComponent).then((t) => `data:image/svg+xml;charset=utf-8,${t}`);
}
async function He(e, t, n) {
  const r = "http://www.w3.org/2000/svg", a = document.createElementNS(r, "svg"), o = document.createElementNS(r, "foreignObject");
  return a.setAttribute("width", `${t}`), a.setAttribute("height", `${n}`), a.setAttribute("viewBox", `0 0 ${t} ${n}`), o.setAttribute("width", "100%"), o.setAttribute("height", "100%"), o.setAttribute("x", "0"), o.setAttribute("y", "0"), o.setAttribute("externalResourcesRequired", "true"), a.appendChild(o), o.appendChild(e), Ue(a);
}
const H = (e, t) => {
  if (e instanceof t)
    return !0;
  const n = Object.getPrototypeOf(e);
  return n === null ? !1 : n.constructor.name === t.name || H(n, t);
};
function Me(e) {
  const t = e.getPropertyValue("content");
  return `${e.cssText} content: '${t.replace(/'|"/g, "")}';`;
}
function ze(e, t) {
  return be(t).map((n) => {
    const r = e.getPropertyValue(n), a = e.getPropertyPriority(n);
    return `${n}: ${r}${a ? " !important" : ""};`;
  }).join(" ");
}
function Ve(e, t, n, r) {
  const a = `.${e}:${t}`, o = n.cssText ? Me(n) : ze(n, r);
  return document.createTextNode(`${a}{${o}}`);
}
function pe(e, t, n, r) {
  const a = window.getComputedStyle(e, n), o = a.getPropertyValue("content");
  if (o === "" || o === "none")
    return;
  const i = Ne();
  try {
    t.className = `${t.className} ${i}`;
  } catch {
    return;
  }
  const l = document.createElement("style");
  l.appendChild(Ve(i, n, a, r)), t.appendChild(l);
}
function Be(e, t, n) {
  pe(e, t, ":before", n), pe(e, t, ":after", n);
}
const me = "application/font-woff", he = "image/jpeg", je = {
  woff: me,
  woff2: me,
  ttf: "application/font-truetype",
  eot: "application/vnd.ms-fontobject",
  png: "image/png",
  jpg: he,
  jpeg: he,
  gif: "image/gif",
  tiff: "image/tiff",
  svg: "image/svg+xml",
  webp: "image/webp"
};
function Ie(e) {
  const t = /\.([^./]*?)$/g.exec(e);
  return t ? t[1] : "";
}
function re(e) {
  const t = Ie(e).toLowerCase();
  return je[t] || "";
}
function Ge(e) {
  return e.split(/,/)[1];
}
function te(e) {
  return e.search(/^(data:)/) !== -1;
}
function qe(e, t) {
  return `data:${t};base64,${e}`;
}
async function Ee(e, t, n) {
  const r = await fetch(e, t);
  if (r.status === 404)
    throw new Error(`Resource "${r.url}" not found`);
  const a = await r.blob();
  return new Promise((o, i) => {
    const l = new FileReader();
    l.onerror = i, l.onloadend = () => {
      try {
        o(n({ res: r, result: l.result }));
      } catch (h) {
        i(h);
      }
    }, l.readAsDataURL(a);
  });
}
const ee = {};
function Je(e, t, n) {
  let r = e.replace(/\?.*/, "");
  return n && (r = e), /ttf|otf|eot|woff2?/i.test(r) && (r = r.replace(/.*\//, "")), t ? `[${t}]${r}` : r;
}
async function ne(e, t, n) {
  const r = Je(e, t, n.includeQueryParams);
  if (ee[r] != null)
    return ee[r];
  n.cacheBust && (e += (/\?/.test(e) ? "&" : "?") + (/* @__PURE__ */ new Date()).getTime());
  let a;
  try {
    const o = await Ee(e, n.fetchRequestInit, ({ res: i, result: l }) => (t || (t = i.headers.get("Content-Type") || ""), Ge(l)));
    a = qe(o, t);
  } catch (o) {
    a = n.imagePlaceholder || "";
    let i = `Failed to fetch resource: ${e}`;
    o && (i = typeof o == "string" ? o : o.message), i && console.warn(i);
  }
  return ee[r] = a, a;
}
async function Xe(e) {
  const t = e.toDataURL();
  return t === "data:," ? e.cloneNode(!1) : Y(t);
}
async function Ke(e, t) {
  if (e.currentSrc) {
    const o = document.createElement("canvas"), i = o.getContext("2d");
    o.width = e.clientWidth, o.height = e.clientHeight, i == null || i.drawImage(e, 0, 0, o.width, o.height);
    const l = o.toDataURL();
    return Y(l);
  }
  const n = e.poster, r = re(n), a = await ne(n, r, t);
  return Y(a);
}
async function Qe(e, t) {
  var n;
  try {
    if (!((n = e == null ? void 0 : e.contentDocument) === null || n === void 0) && n.body)
      return await Z(e.contentDocument.body, t, !0);
  } catch {
  }
  return e.cloneNode(!1);
}
async function Ye(e, t) {
  return H(e, HTMLCanvasElement) ? Xe(e) : H(e, HTMLVideoElement) ? Ke(e, t) : H(e, HTMLIFrameElement) ? Qe(e, t) : e.cloneNode(Se(e));
}
const Ze = (e) => e.tagName != null && e.tagName.toUpperCase() === "SLOT", Se = (e) => e.tagName != null && e.tagName.toUpperCase() === "SVG";
async function et(e, t, n) {
  var r, a;
  if (Se(t))
    return t;
  let o = [];
  return Ze(e) && e.assignedNodes ? o = G(e.assignedNodes()) : H(e, HTMLIFrameElement) && (!((r = e.contentDocument) === null || r === void 0) && r.body) ? o = G(e.contentDocument.body.childNodes) : o = G(((a = e.shadowRoot) !== null && a !== void 0 ? a : e).childNodes), o.length === 0 || H(e, HTMLVideoElement) || await o.reduce((i, l) => i.then(() => Z(l, n)).then((h) => {
    h && t.appendChild(h);
  }), Promise.resolve()), t;
}
function tt(e, t, n) {
  const r = t.style;
  if (!r)
    return;
  const a = window.getComputedStyle(e);
  a.cssText ? (r.cssText = a.cssText, r.transformOrigin = a.transformOrigin) : be(n).forEach((o) => {
    let i = a.getPropertyValue(o);
    o === "font-size" && i.endsWith("px") && (i = `${Math.floor(parseFloat(i.substring(0, i.length - 2))) - 0.1}px`), H(e, HTMLIFrameElement) && o === "display" && i === "inline" && (i = "block"), o === "d" && t.getAttribute("d") && (i = `path(${t.getAttribute("d")})`), r.setProperty(o, i, a.getPropertyPriority(o));
  });
}
function rt(e, t) {
  H(e, HTMLTextAreaElement) && (t.innerHTML = e.value), H(e, HTMLInputElement) && t.setAttribute("value", e.value);
}
function nt(e, t) {
  if (H(e, HTMLSelectElement)) {
    const n = t, r = Array.from(n.children).find((a) => e.value === a.getAttribute("value"));
    r && r.setAttribute("selected", "");
  }
}
function at(e, t, n) {
  return H(t, Element) && (tt(e, t, n), Be(e, t, n), rt(e, t), nt(e, t)), t;
}
async function ot(e, t) {
  const n = e.querySelectorAll ? e.querySelectorAll("use") : [];
  if (n.length === 0)
    return e;
  const r = {};
  for (let o = 0; o < n.length; o++) {
    const l = n[o].getAttribute("xlink:href");
    if (l) {
      const h = e.querySelector(l), V = document.querySelector(l);
      !h && V && !r[l] && (r[l] = await Z(V, t, !0));
    }
  }
  const a = Object.values(r);
  if (a.length) {
    const o = "http://www.w3.org/1999/xhtml", i = document.createElementNS(o, "svg");
    i.setAttribute("xmlns", o), i.style.position = "absolute", i.style.width = "0", i.style.height = "0", i.style.overflow = "hidden", i.style.display = "none";
    const l = document.createElementNS(o, "defs");
    i.appendChild(l);
    for (let h = 0; h < a.length; h++)
      l.appendChild(a[h]);
    e.appendChild(i);
  }
  return e;
}
async function Z(e, t, n) {
  return !n && t.filter && !t.filter(e) ? null : Promise.resolve(e).then((r) => Ye(r, t)).then((r) => et(e, r, t)).then((r) => at(e, r, t)).then((r) => ot(r, t));
}
const ke = /url\((['"]?)([^'"]+?)\1\)/g, it = /url\([^)]+\)\s*format\((["']?)([^"']+)\1\)/g, lt = /src:\s*(?:url\([^)]+\)\s*format\([^)]+\)[,;]\s*)+/g;
function ct(e) {
  const t = e.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1");
  return new RegExp(`(url\\(['"]?)(${t})(['"]?\\))`, "g");
}
function st(e) {
  const t = [];
  return e.replace(ke, (n, r, a) => (t.push(a), n)), t.filter((n) => !te(n));
}
async function ut(e, t, n, r, a) {
  try {
    const o = n ? Ae(t, n) : t, i = re(t);
    let l;
    return a || (l = await ne(o, i, r)), e.replace(ct(t), `$1${l}$3`);
  } catch {
  }
  return e;
}
function dt(e, { preferredFontFormat: t }) {
  return t ? e.replace(lt, (n) => {
    for (; ; ) {
      const [r, , a] = it.exec(n) || [];
      if (!a)
        return "";
      if (a === t)
        return `src: ${r};`;
    }
  }) : e;
}
function Ce(e) {
  return e.search(ke) !== -1;
}
async function Re(e, t, n) {
  if (!Ce(e))
    return e;
  const r = dt(e, n);
  return st(r).reduce((o, i) => o.then((l) => ut(l, i, t, n)), Promise.resolve(r));
}
async function J(e, t, n) {
  var r;
  const a = (r = t.style) === null || r === void 0 ? void 0 : r.getPropertyValue(e);
  if (a) {
    const o = await Re(a, null, n);
    return t.style.setProperty(e, o, t.style.getPropertyPriority(e)), !0;
  }
  return !1;
}
async function ft(e, t) {
  await J("background", e, t) || await J("background-image", e, t), await J("mask", e, t) || await J("-webkit-mask", e, t) || await J("mask-image", e, t) || await J("-webkit-mask-image", e, t);
}
async function pt(e, t) {
  const n = H(e, HTMLImageElement);
  if (!(n && !te(e.src)) && !(H(e, SVGImageElement) && !te(e.href.baseVal)))
    return;
  const r = n ? e.src : e.href.baseVal, a = await ne(r, re(r), t);
  await new Promise((o, i) => {
    e.onload = o, e.onerror = t.onImageErrorHandler ? (...h) => {
      try {
        o(t.onImageErrorHandler(...h));
      } catch (V) {
        i(V);
      }
    } : i;
    const l = e;
    l.decode && (l.decode = o), l.loading === "lazy" && (l.loading = "eager"), n ? (e.srcset = "", e.src = a) : e.href.baseVal = a;
  });
}
async function mt(e, t) {
  const r = G(e.childNodes).map((a) => Pe(a, t));
  await Promise.all(r).then(() => e);
}
async function Pe(e, t) {
  H(e, Element) && (await ft(e, t), await pt(e, t), await mt(e, t));
}
function ht(e, t) {
  const { style: n } = e;
  t.backgroundColor && (n.backgroundColor = t.backgroundColor), t.width && (n.width = `${t.width}px`), t.height && (n.height = `${t.height}px`);
  const r = t.style;
  return r != null && Object.keys(r).forEach((a) => {
    n[a] = r[a];
  }), e;
}
const ge = {};
async function xe(e) {
  let t = ge[e];
  if (t != null)
    return t;
  const r = await (await fetch(e)).text();
  return t = { url: e, cssText: r }, ge[e] = t, t;
}
async function ye(e, t) {
  let n = e.cssText;
  const r = /url\(["']?([^"')]+)["']?\)/g, o = (n.match(/url\([^)]+\)/g) || []).map(async (i) => {
    let l = i.replace(r, "$1");
    return l.startsWith("https://") || (l = new URL(l, e.url).href), Ee(l, t.fetchRequestInit, ({ result: h }) => (n = n.replace(i, `url(${h})`), [i, h]));
  });
  return Promise.all(o).then(() => n);
}
function we(e) {
  if (e == null)
    return [];
  const t = [], n = /(\/\*[\s\S]*?\*\/)/gi;
  let r = e.replace(n, "");
  const a = new RegExp("((@.*?keyframes [\\s\\S]*?){([\\s\\S]*?}\\s*?)})", "gi");
  for (; ; ) {
    const h = a.exec(r);
    if (h === null)
      break;
    t.push(h[0]);
  }
  r = r.replace(a, "");
  const o = /@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi, i = "((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})", l = new RegExp(i, "gi");
  for (; ; ) {
    let h = o.exec(r);
    if (h === null) {
      if (h = l.exec(r), h === null)
        break;
      o.lastIndex = l.lastIndex;
    } else
      l.lastIndex = o.lastIndex;
    t.push(h[0]);
  }
  return t;
}
async function gt(e, t) {
  const n = [], r = [];
  return e.forEach((a) => {
    if ("cssRules" in a)
      try {
        G(a.cssRules || []).forEach((o, i) => {
          if (o.type === CSSRule.IMPORT_RULE) {
            let l = i + 1;
            const h = o.href, V = xe(h).then((B) => ye(B, t)).then((B) => we(B).forEach((X) => {
              try {
                a.insertRule(X, X.startsWith("@import") ? l += 1 : a.cssRules.length);
              } catch (K) {
                console.error("Error inserting rule from remote css", {
                  rule: X,
                  error: K
                });
              }
            })).catch((B) => {
              console.error("Error loading remote css", B.toString());
            });
            r.push(V);
          }
        });
      } catch (o) {
        const i = e.find((l) => l.href == null) || document.styleSheets[0];
        a.href != null && r.push(xe(a.href).then((l) => ye(l, t)).then((l) => we(l).forEach((h) => {
          i.insertRule(h, i.cssRules.length);
        })).catch((l) => {
          console.error("Error loading remote stylesheet", l);
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
function xt(e) {
  return e.filter((t) => t.type === CSSRule.FONT_FACE_RULE).filter((t) => Ce(t.style.getPropertyValue("src")));
}
async function yt(e, t) {
  if (e.ownerDocument == null)
    throw new Error("Provided element is not within a Document");
  const n = G(e.ownerDocument.styleSheets), r = await gt(n, t);
  return xt(r);
}
function Le(e) {
  return e.trim().replace(/["']/g, "");
}
function wt(e) {
  const t = /* @__PURE__ */ new Set();
  function n(r) {
    (r.style.fontFamily || getComputedStyle(r).fontFamily).split(",").forEach((o) => {
      t.add(Le(o));
    }), Array.from(r.children).forEach((o) => {
      o instanceof HTMLElement && n(o);
    });
  }
  return n(e), t;
}
async function bt(e, t) {
  const n = await yt(e, t), r = wt(e);
  return (await Promise.all(n.filter((o) => r.has(Le(o.style.fontFamily))).map((o) => {
    const i = o.parentStyleSheet ? o.parentStyleSheet.href : null;
    return Re(o.cssText, i, t);
  }))).join(`
`);
}
async function vt(e, t) {
  const n = t.fontEmbedCSS != null ? t.fontEmbedCSS : t.skipFonts ? null : await bt(e, t);
  if (n) {
    const r = document.createElement("style"), a = document.createTextNode(n);
    r.appendChild(a), e.firstChild ? e.insertBefore(r, e.firstChild) : e.appendChild(r);
  }
}
async function Et(e, t = {}) {
  const { width: n, height: r } = ve(e, t), a = await Z(e, t, !0);
  return await vt(a, t), await Pe(a, t), ht(a, t), await He(a, n, r);
}
async function St(e, t = {}) {
  const { width: n, height: r } = ve(e, t), a = await Et(e, t), o = await Y(a), i = document.createElement("canvas"), l = i.getContext("2d"), h = t.pixelRatio || _e(), V = t.canvasWidth || n, B = t.canvasHeight || r;
  return i.width = V * h, i.height = B * h, t.skipAutoScale || De(i), i.style.width = `${V}`, i.style.height = `${B}`, t.backgroundColor && (l.fillStyle = t.backgroundColor, l.fillRect(0, 0, i.width, i.height)), l.drawImage(o, 0, 0, i.width, i.height), i;
}
async function kt(e, t = {}) {
  return (await St(e, t)).toDataURL();
}
function Ct(e) {
  var ie;
  const { useState: t, useRef: n, useCallback: r, useEffect: a } = e.React, o = 1280, i = 832;
  function l(c) {
    const x = c === void 0, [g, b] = t([]), [w, u] = t(x), [C, v] = t(""), [L, s] = t(null), [p, E] = t(!1), d = n(""), R = n(null), y = n(0);
    a(() => {
      x && (async () => {
        try {
          const S = await (await e.sdk.api.fetch(e.app.apiUrl("/presentations"))).json();
          b(Array.isArray(S) ? S : []);
        } catch {
          b([]);
        } finally {
          u(!1);
        }
      })();
    }, [x]);
    const O = r(($) => {
      clearTimeout(R.current);
      const S = $.trim();
      if (!S) {
        s(null), E(!1);
        return;
      }
      E(!0), R.current = setTimeout(async () => {
        const k = ++y.current;
        try {
          const N = await (await e.sdk.api.fetch(e.app.apiUrl("/presentations?q=" + encodeURIComponent(S)))).json();
          k === y.current && (s(Array.isArray(N) ? N : []), E(!1));
        } catch {
          k === y.current && (s([]), E(!1));
        }
      }, 200);
    }, []);
    a(() => () => clearTimeout(R.current), []);
    const _ = r(($) => {
      const S = $.target.value;
      d.current = S, v(S), O(S);
    }, [O]);
    a(() => {
      const $ = (S) => {
        const k = S.detail;
        !k || k.type !== "presentation_update" || (x && (k.action === "create" ? b((F) => [...F.filter((N) => N.id !== k.presentation.id), k.presentation]) : k.action === "update" ? b((F) => F.map((N) => N.id === k.presentation.id ? k.presentation : N)) : k.action === "delete" && b((F) => F.filter((N) => N.id !== k.id))), k.action === "create" || k.action === "update" ? d.current.trim() && O(d.current) : k.action === "delete" && s((F) => F && F.filter((N) => N.id !== k.id)));
      };
      return window.addEventListener("aw-presentation-update", $), () => window.removeEventListener("aw-presentation-update", $);
    }, [x, O]);
    const D = [...x ? g : c].sort(($, S) => (S.created_at || 0) - ($.created_at || 0)), U = L ?? D, T = r(async ($) => {
      await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${$}`), { method: "DELETE" });
    }, []);
    return { loading: w, term: C, handleTermChange: _, results: L, searchLoading: p, visible: U, count: D.length, deletePresentation: T };
  }
  function h() {
    const [c, x] = t([]), g = r((s, p) => {
      var E;
      (E = window.__awOpenAppWindow) == null || E.call(window, "presentations.viewer", s, p);
    }, []);
    a(() => (window.__awOpenPresentation = (s) => {
      const p = c.find((E) => E.id === s);
      g(s, p == null ? void 0 : p.title);
    }, () => {
      delete window.__awOpenPresentation;
    }), [c, g]), a(() => {
      var E;
      const s = (E = e.sdk.ws) == null ? void 0 : E.createSharedSocket;
      if (!s) {
        console.warn("[presentations] host.sdk.ws.createSharedSocket is unavailable (SPA too old for aw-ws/1 §9.1) — live updates disabled.");
        return;
      }
      return s({
        url: () => e.app.wsUrl("/ws"),
        initType: "presentation_init",
        onFrame: (d) => {
          if (d.type === "presentation_init") {
            x(d.presentations || []);
            return;
          }
          if (d.type === "presentation_update") {
            try {
              window.dispatchEvent(new CustomEvent("aw-presentation-update", { detail: d }));
            } catch {
            }
            d.action === "create" ? (x((R) => [...R.filter((y) => y.id !== d.presentation.id), d.presentation]), d.presentation.visible !== !1 && !d.silent && g(d.presentation.id, d.presentation.title)) : d.action === "update" ? x((R) => R.map((y) => y.id === d.presentation.id ? d.presentation : y)) : d.action === "delete" && x((R) => R.filter((y) => y.id !== d.id));
          }
        },
        onStatus: ({ state: d }) => {
          if (d === "fatal")
            try {
              window.dispatchEvent(new Event("aw-auth-failed"));
            } catch {
            }
        }
      }).retain();
    }, [g]);
    const b = l(c), [w, u] = t(!1), C = n(null), v = r(() => {
      clearTimeout(C.current), u(!0);
    }, []), L = r(() => {
      clearTimeout(C.current), C.current = setTimeout(() => u(!1), 150);
    }, []);
    return a(() => () => clearTimeout(C.current), []), /* @__PURE__ */ e.h("div", { className: "relative", onMouseEnter: v, onMouseLeave: L }, /* @__PURE__ */ e.h(
      "button",
      {
        onClick: () => {
          var s;
          return (s = window.__awOpenAppWindow) == null ? void 0 : s.call(window, "presentations.gallery", void 0, "Presentations");
        },
        className: "px-3 py-1 text-xs rounded transition-colors cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5"
      },
      "Presentation",
      c.length > 0 && /* @__PURE__ */ e.h("span", { className: "ml-1.5 inline-flex items-center justify-center min-w-[16px] h-[16px] rounded-full text-[9px] font-bold px-1 bg-[var(--color-accent)]/20 text-[var(--color-accent)]" }, c.length)
    ), w && /* @__PURE__ */ e.h(
      "div",
      {
        className: "absolute left-0 top-full mt-2 z-50 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-2xl p-3",
        style: { minWidth: 320, maxWidth: 720 }
      },
      /* @__PURE__ */ e.h(
        B,
        {
          gallery: b,
          onOpen: (s, p) => {
            u(!1), g(s, p);
          },
          cardMinWidth: 160,
          showSectionLabel: !0,
          inputWrapperClassName: "mb-2",
          inputClassName: "w-full text-[11px] bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2 py-1.5 text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]",
          resultsWrapperClassName: "overflow-y-auto",
          resultsWrapperStyle: { maxHeight: "70vh" },
          gridGapClassName: "gap-2",
          emptyPaddingClassName: "px-4 py-6"
        }
      )
    ));
  }
  function V({ presentation: c, onClick: x, onDelete: g }) {
    const b = n(null), [w, u] = t(0.16), C = o, v = i, L = v / C;
    a(() => {
      const p = b.current;
      if (!p || typeof ResizeObserver > "u") return;
      const E = new ResizeObserver((d) => {
        for (const R of d) {
          const y = R.contentRect.width;
          y > 0 && u(y / C);
        }
      });
      return E.observe(p), () => E.disconnect();
    }, []);
    const s = c.created_at ? new Date(c.created_at * 1e3).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
    return /* @__PURE__ */ e.h(
      "div",
      {
        onClick: x,
        className: "group relative rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] overflow-hidden cursor-pointer hover:border-[var(--color-accent)] transition-colors",
        title: c.title
      },
      /* @__PURE__ */ e.h(
        "div",
        {
          ref: b,
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
              width: C,
              height: v,
              border: 0,
              pointerEvents: "none",
              transform: `scale(${w})`,
              transformOrigin: "top left"
            }
          }
        )
      ),
      /* @__PURE__ */ e.h("div", { className: "px-2 py-1.5 border-t border-[var(--color-border)]" }, /* @__PURE__ */ e.h("div", { className: "text-[11px] font-medium text-[var(--color-text-primary)] truncate" }, c.title || "Untitled"), Array.isArray(c.tags) && c.tags.length > 0 && /* @__PURE__ */ e.h("div", { className: "flex flex-wrap gap-0.5 mt-0.5 overflow-hidden", style: { maxHeight: 18 } }, c.tags.slice(0, 4).map((p) => /* @__PURE__ */ e.h(
        "span",
        {
          key: p,
          className: "text-[8px] font-mono leading-none px-1 py-[2px] rounded bg-white/5 border border-white/10 text-[var(--color-text-muted)] truncate",
          title: p
        },
        p
      )), c.tags.length > 4 && /* @__PURE__ */ e.h(
        "span",
        {
          className: "text-[8px] leading-none px-1 py-[2px] text-[var(--color-text-muted)]",
          title: c.tags.slice(4).join(", ")
        },
        "+",
        c.tags.length - 4
      )), s && /* @__PURE__ */ e.h("div", { className: "text-[9px] text-[var(--color-text-muted)] truncate mt-0.5" }, s)),
      /* @__PURE__ */ e.h(
        "button",
        {
          onClick: (p) => {
            p.stopPropagation(), g();
          },
          className: "hidden group-hover:flex absolute top-1 right-1 items-center justify-center w-5 h-5 rounded bg-black/60 text-white/80 hover:text-[var(--color-danger)] hover:bg-black/80",
          title: "Delete presentation"
        },
        /* @__PURE__ */ e.h("svg", { className: "w-3 h-3", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("path", { d: "M18 6L6 18M6 6l12 12" }))
      )
    );
  }
  function B({
    gallery: c,
    onOpen: x,
    cardMinWidth: g,
    narrow: b = !1,
    autoFocus: w = !0,
    inputWrapperClassName: u,
    inputClassName: C,
    resultsWrapperClassName: v,
    resultsWrapperStyle: L,
    gridGapClassName: s = "gap-3",
    emptyPaddingClassName: p = "px-4 py-10",
    showSectionLabel: E = !1
  }) {
    const { term: d, handleTermChange: R, results: y, searchLoading: O, visible: _, loading: A, deletePresentation: D } = c;
    return /* @__PURE__ */ e.h(e.React.Fragment, null, /* @__PURE__ */ e.h("div", { className: u }, /* @__PURE__ */ e.h(
      "input",
      {
        type: "text",
        value: d,
        onChange: R,
        placeholder: "Search title or content…",
        autoFocus: w && !b,
        className: C,
        style: b ? { fontSize: 16 } : void 0
      }
    )), /* @__PURE__ */ e.h("div", { className: v, style: L }, A ? /* @__PURE__ */ e.h("div", { className: `${p} text-center text-xs text-[var(--color-text-muted)]` }, "Loading…") : _.length === 0 && !O ? y !== null ? /* @__PURE__ */ e.h("div", { className: `${p} text-center text-xs text-[var(--color-text-muted)]` }, "No results for “", d.trim(), "”") : /* @__PURE__ */ e.h("div", { className: `${p} text-center text-xs text-[var(--color-text-muted)] italic` }, "No presentations yet. Use ", /* @__PURE__ */ e.h("code", { className: "bg-white/10 px-1 rounded" }, "/aw-presentation"), " to create one.") : /* @__PURE__ */ e.h(e.React.Fragment, null, E && !O && /* @__PURE__ */ e.h("div", { className: "text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2 px-1" }, "Presentations · newest first"), O && /* @__PURE__ */ e.h("div", { className: "text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2 px-1" }, "Searching…"), /* @__PURE__ */ e.h(
      "div",
      {
        className: `grid ${s}`,
        style: { gridTemplateColumns: `repeat(auto-fill, minmax(${g}px, 1fr))` }
      },
      _.map((U) => /* @__PURE__ */ e.h(
        V,
        {
          key: U.id,
          presentation: U,
          onClick: () => x(U.id, U.title),
          onDelete: () => D(U.id)
        }
      ))
    ))));
  }
  function X() {
    const c = n(null), [x, g] = t(!1), b = l(), w = r((u, C) => {
      var v;
      (v = window.__awOpenAppWindow) == null || v.call(window, "presentations.viewer", u, C);
    }, []);
    return a(() => {
      const u = c.current;
      if (!u || typeof ResizeObserver > "u") return;
      const C = new ResizeObserver((v) => {
        for (const L of v) {
          const s = L.contentRect.width;
          s > 0 && g(s < ae);
        }
      });
      return C.observe(u), () => C.disconnect();
    }, []), /* @__PURE__ */ e.h("div", { ref: c, className: "flex flex-col h-full bg-[var(--color-bg-secondary)]" }, /* @__PURE__ */ e.h(
      B,
      {
        gallery: b,
        onOpen: w,
        cardMinWidth: 200,
        narrow: x,
        inputWrapperClassName: "p-3 border-b border-[var(--color-border)]",
        inputClassName: "w-full text-[12px] bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2.5 py-2 text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]",
        resultsWrapperClassName: "flex-1 overflow-y-auto p-3"
      }
    ));
  }
  const K = /* @__PURE__ */ new Map(), ae = 640;
  function oe(c, x, { onClose: g, onTitleChange: b } = {}) {
    const [w, u] = t(null), [C, v] = t(!1), [L, s] = t(null), [p, E] = t(!1), [d, R] = t(!1), [y, O] = t(null), _ = r(async () => {
      if (c)
        try {
          const m = await (await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${c}`))).json();
          if ((m == null ? void 0 : m.success) === !1) return;
          u(m);
        } catch {
        }
    }, [c]);
    a(() => {
      _();
    }, [_]), a(() => {
      const P = (m) => {
        var z;
        const f = m.detail;
        !f || f.type !== "presentation_update" || (f.action === "delete" && f.id === c ? g == null || g() : (f.action === "update" || f.action === "create") && ((z = f.presentation) == null ? void 0 : z.id) === c && u(f.presentation));
      };
      return window.addEventListener("aw-presentation-update", P), () => window.removeEventListener("aw-presentation-update", P);
    }, [c, g]);
    const A = c ? e.app.absoluteApiUrl(`/presentations/${c}/html`) : null, D = r((P) => {
      const m = document.createElement("a");
      m.download = `${((w == null ? void 0 : w.title) || "presentation").replace(/[^a-zA-Z0-9_-]/g, "_")}.png`, m.href = P, m.click();
    }, [w == null ? void 0 : w.title]), U = r(async () => {
      var P;
      O(null), R(!0);
      try {
        const m = (P = K.get(x)) == null ? void 0 : P.contentDocument;
        if (m && m.body) {
          const f = await kt(m.documentElement, {
            backgroundColor: "#111318",
            pixelRatio: 2,
            width: m.documentElement.scrollWidth,
            height: m.documentElement.scrollHeight
          });
          D(f);
          return;
        }
        throw new Error("presentation content is not accessible from this window (cross-origin iframe)");
      } catch (m) {
        console.warn("Client-side export failed, falling back to server render:", m);
        try {
          const f = await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${c}/export`), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
          }), z = await f.json().catch(() => null);
          if (!f.ok || !(z != null && z.data_url))
            throw new Error((z == null ? void 0 : z.detail) || `export failed (${f.status})`);
          D(z.data_url);
        } catch (f) {
          console.error("Export failed:", f), O(f.message || "Export failed");
        }
      } finally {
        R(!1);
      }
    }, [c, D, x]), T = r((P) => {
      var m;
      if (b) {
        b(P);
        return;
      }
      (m = window.__awOpenAppWindow) == null || m.call(window, "presentations.viewer", c, P);
    }, [b, c]), $ = r(async (P) => {
      const m = (P || "").trim();
      !m || m === (w == null ? void 0 : w.title) || (await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${c}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: m })
      }), u((f) => f && { ...f, title: m }), T(m));
    }, [w == null ? void 0 : w.title, c, T]), S = r(async (P) => {
      if (c) {
        v(!0), s(null);
        try {
          const f = await (await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${c}/share`), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expires_in: P })
          })).json();
          f.success && f.token && s(`${A}?token=${f.token}`);
        } catch (m) {
          console.error("Share failed:", m);
        } finally {
          v(!1);
        }
      }
    }, [c, A]), k = r(() => {
      var P;
      L && ((P = navigator.clipboard) == null || P.writeText(L).then(() => {
        E(!0), setTimeout(() => E(!1), 2e3);
      }).catch(() => {
      }));
    }, [L]), F = r(async () => {
      await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${c}`), { method: "DELETE" }), g == null || g();
    }, [c, g]), N = r(({ asTab: P = !1 } = {}) => {
      if (A) {
        if (P) {
          window.open(A, "_blank");
          return;
        }
        window.open(A, `presentation-${c}`, "popup=1,width=1000,height=700");
      }
    }, [A, c]);
    return {
      presentation: w,
      htmlUrl: A,
      shareLink: L,
      setShareLink: s,
      shareLoading: C,
      shareCopied: p,
      handleCreateShare: S,
      handleCopy: k,
      exportLoading: d,
      exportError: y,
      setExportError: O,
      handleExport: U,
      commitRename: $,
      handleDelete: F,
      popOut: N
    };
  }
  function Te({ windowKey: c, instanceId: x, onClose: g, onTitleChange: b }) {
    const w = x, {
      presentation: u,
      htmlUrl: C,
      shareLink: v,
      setShareLink: L,
      shareLoading: s,
      shareCopied: p,
      handleCreateShare: E,
      handleCopy: d,
      exportLoading: R,
      exportError: y,
      setExportError: O,
      handleExport: _,
      commitRename: A,
      handleDelete: D,
      popOut: U
    } = oe(w, c, { onClose: g, onTitleChange: b }), [T, $] = t(!1), [S, k] = t(""), [F, N] = t(!1);
    a(() => {
      T || k((u == null ? void 0 : u.title) || "");
    }, [u == null ? void 0 : u.title, T]);
    const P = n(null), m = n(null), [f, z] = t(null), le = r((W) => {
      var I;
      const j = (I = W.current) == null ? void 0 : I.getBoundingClientRect();
      j && z({ top: j.bottom + 6, right: window.innerWidth - j.right });
    }, []), ce = r(() => {
      $(!1), A(S);
    }, [A, S]);
    return a(() => {
      if (!T && !F && !y) return;
      const W = (I) => {
        var se, ue, de, fe;
        (se = P.current) != null && se.contains(I.target) || (ue = m.current) != null && ue.contains(I.target) || (fe = (de = I.target).closest) != null && fe.call(de, "[data-pres-popover]") || ($(!1), N(!1), O(null));
      }, j = (I) => {
        I.key === "Escape" && ($(!1), N(!1), O(null));
      };
      return document.addEventListener("mousedown", W), document.addEventListener("keydown", j), () => {
        document.removeEventListener("mousedown", W), document.removeEventListener("keydown", j);
      };
    }, [T, F, y, O]), /* @__PURE__ */ e.h(e.React.Fragment, null, /* @__PURE__ */ e.h(
      "button",
      {
        ref: P,
        onClick: () => {
          N(!1), $((W) => W ? !1 : (k((u == null ? void 0 : u.title) || ""), le(P), !0));
        },
        className: "p-1 rounded hover:bg-white/10 text-[var(--color-text-muted)]",
        title: "Rename presentation"
      },
      /* @__PURE__ */ e.h("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("path", { d: "M12 20h9" }), /* @__PURE__ */ e.h("path", { d: "M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z" }))
    ), /* @__PURE__ */ e.h(
      "button",
      {
        ref: m,
        onClick: () => {
          $(!1), L(null), setShareCopied(!1), N((W) => W ? !1 : (le(m), !0));
        },
        className: "p-1 rounded hover:bg-white/10 text-[var(--color-text-muted)]",
        title: "Share presentation"
      },
      /* @__PURE__ */ e.h("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("circle", { cx: "18", cy: "5", r: "3" }), /* @__PURE__ */ e.h("circle", { cx: "6", cy: "12", r: "3" }), /* @__PURE__ */ e.h("circle", { cx: "18", cy: "19", r: "3" }), /* @__PURE__ */ e.h("path", { d: "M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" }))
    ), /* @__PURE__ */ e.h(
      "button",
      {
        onClick: () => U(),
        className: "p-1 rounded hover:bg-white/10 text-[var(--color-text-muted)]",
        title: "Pop out to new window"
      },
      /* @__PURE__ */ e.h("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("path", { d: "M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" }), /* @__PURE__ */ e.h("polyline", { points: "15 3 21 3 21 9" }), /* @__PURE__ */ e.h("line", { x1: "10", y1: "14", x2: "21", y2: "3" }))
    ), /* @__PURE__ */ e.h(
      "button",
      {
        onClick: _,
        disabled: R,
        className: `p-1 rounded ${R ? "opacity-50 cursor-wait" : "hover:bg-white/10 cursor-pointer"} ${y ? "text-[var(--color-danger)]" : "text-[var(--color-text-muted)]"}`,
        title: y ? `Export failed: ${y}` : "Export as PNG"
      },
      /* @__PURE__ */ e.h("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("path", { d: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" }), /* @__PURE__ */ e.h("polyline", { points: "7 10 12 15 17 10" }), /* @__PURE__ */ e.h("line", { x1: "12", y1: "15", x2: "12", y2: "3" }))
    ), /* @__PURE__ */ e.h(
      "button",
      {
        onClick: D,
        className: "p-1 rounded hover:bg-white/10 text-[var(--color-text-muted)] hover:text-[var(--color-danger)]",
        title: "Delete presentation"
      },
      /* @__PURE__ */ e.h("svg", { width: "14", height: "14", viewBox: "0 0 16 16", fill: "currentColor" }, /* @__PURE__ */ e.h("path", { d: "M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" }), /* @__PURE__ */ e.h("path", { fillRule: "evenodd", d: "M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2h3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1h3a1 1 0 0 1 1 1z" }))
    ), T && f && e.ReactDOM.createPortal(
      /* @__PURE__ */ e.h(
        "div",
        {
          "data-pres-popover": !0,
          className: "fixed z-[1000] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-2xl p-3",
          style: { top: f.top, right: f.right, minWidth: 260 }
        },
        /* @__PURE__ */ e.h("div", { className: "text-[11px] font-medium text-[var(--color-text-primary)] mb-2" }, "Rename presentation"),
        /* @__PURE__ */ e.h(
          "input",
          {
            autoFocus: !0,
            value: S,
            onChange: (W) => k(W.target.value),
            onKeyDown: (W) => {
              W.key === "Enter" && ce(), W.key === "Escape" && ($(!1), k((u == null ? void 0 : u.title) || ""));
            },
            className: "w-full text-[11px] bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2 py-1 text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
          }
        ),
        /* @__PURE__ */ e.h("div", { className: "flex justify-end mt-2" }, /* @__PURE__ */ e.h(
          "button",
          {
            onClick: ce,
            disabled: !S.trim(),
            className: "text-[11px] px-2 py-1 rounded bg-[var(--color-accent)]/20 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/30 transition-colors disabled:opacity-40"
          },
          "Rename"
        ))
      ),
      document.body
    ), F && f && e.ReactDOM.createPortal(
      /* @__PURE__ */ e.h(
        "div",
        {
          "data-pres-popover": !0,
          className: "fixed z-[1000] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-2xl p-3",
          style: { top: f.top, right: f.right, minWidth: 260 }
        },
        /* @__PURE__ */ e.h("div", { className: "text-[11px] font-medium text-[var(--color-text-primary)] mb-2" }, "Share presentation"),
        s ? /* @__PURE__ */ e.h("div", { className: "text-[11px] text-[var(--color-text-muted)] py-2 text-center" }, "Generating link…") : v ? /* @__PURE__ */ e.h("div", { className: "flex flex-col gap-2" }, /* @__PURE__ */ e.h("div", { className: "text-[10px] text-[var(--color-text-muted)]" }, "Link generated:"), /* @__PURE__ */ e.h("div", { className: "flex items-center gap-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2 py-1.5" }, /* @__PURE__ */ e.h("span", { className: "text-[10px] font-mono text-[var(--color-text-primary)] truncate flex-1", title: v }, v), /* @__PURE__ */ e.h("button", { onClick: d, className: "shrink-0 text-[10px] px-2 py-0.5 rounded bg-[var(--color-accent)]/20 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/30 transition-colors" }, p ? "✓ Copied" : "Copy")), /* @__PURE__ */ e.h("button", { onClick: () => L(null), className: "text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-left" }, "← Generate new link")) : /* @__PURE__ */ e.h("div", { className: "flex flex-col gap-1.5" }, /* @__PURE__ */ e.h("div", { className: "text-[10px] text-[var(--color-text-muted)] mb-1" }, "Link expires after:"), [{ label: "1 hour", value: 3600 }, { label: "1 day", value: 86400 }, { label: "Never expires", value: null }].map(({ label: W, value: j }) => /* @__PURE__ */ e.h(
          "button",
          {
            key: W,
            onClick: () => E(j),
            className: "text-left text-[11px] px-3 py-1.5 rounded bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-colors"
          },
          W
        )))
      ),
      document.body
    ), y && f && e.ReactDOM.createPortal(
      // The `title` attribute never surfaces on touch devices (iOS Safari
      // shows no hover tooltip on tap), so a red icon with no visible
      // reason reads as "broken, does nothing" — this makes it tappable.
      /* @__PURE__ */ e.h(
        "div",
        {
          "data-pres-popover": !0,
          className: "fixed z-[1000] bg-[var(--color-bg-secondary)] border border-[var(--color-danger)]/40 rounded-lg shadow-2xl p-3",
          style: { top: f.top, right: f.right, minWidth: 220, maxWidth: 280 }
        },
        /* @__PURE__ */ e.h("div", { className: "text-[11px] font-medium text-[var(--color-danger)] mb-1" }, "Export failed"),
        /* @__PURE__ */ e.h("div", { className: "text-[10px] text-[var(--color-text-muted)] mb-2" }, y),
        /* @__PURE__ */ e.h(
          "button",
          {
            onClick: () => O(null),
            className: "text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          },
          "Dismiss"
        )
      ),
      document.body
    ));
  }
  function $e({ actions: c, onDismiss: x }) {
    const {
      presentation: g,
      shareLink: b,
      setShareLink: w,
      shareLoading: u,
      shareCopied: C,
      handleCreateShare: v,
      handleCopy: L,
      exportLoading: s,
      exportError: p,
      setExportError: E,
      handleExport: d,
      commitRename: R,
      handleDelete: y,
      popOut: O
    } = c, [_, A] = t("menu"), [D, U] = t((g == null ? void 0 : g.title) || ""), T = {
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
    }, $ = {
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
        onClick: x,
        style: { position: "absolute", inset: 0, zIndex: 19, background: "rgba(0,0,0,0.45)" }
      }
    ), /* @__PURE__ */ e.h("div", { style: $, role: "menu" }, _ === "menu" && /* @__PURE__ */ e.h(e.React.Fragment, null, /* @__PURE__ */ e.h("button", { style: T, onClick: () => {
      w(null), A("share");
    } }, "Share"), /* @__PURE__ */ e.h(
      "button",
      {
        style: { ...T, opacity: s ? 0.5 : 1 },
        disabled: s,
        onClick: d
      },
      s ? "Exporting…" : "Export as PNG"
    ), /* @__PURE__ */ e.h("button", { style: T, onClick: () => {
      U((g == null ? void 0 : g.title) || ""), A("rename");
    } }, "Rename"), /* @__PURE__ */ e.h("button", { style: T, onClick: () => {
      O({ asTab: !0 }), x();
    } }, "Open in new tab"), /* @__PURE__ */ e.h(
      "button",
      {
        style: { ...T, color: "var(--color-danger)" },
        onClick: () => {
          y(), x();
        }
      },
      "Delete"
    ), p && /* @__PURE__ */ e.h("div", { style: { padding: "8px 16px", fontSize: 12, color: "var(--color-danger)" } }, "Export failed: ", p, /* @__PURE__ */ e.h(
      "button",
      {
        onClick: () => E(null),
        style: { ...T, minHeight: 36, padding: 0, marginTop: 4, fontSize: 12, color: "var(--color-text-muted)" }
      },
      "Dismiss"
    ))), _ === "share" && /* @__PURE__ */ e.h("div", { style: { padding: "8px 16px 4px" } }, /* @__PURE__ */ e.h("div", { style: { fontSize: 12, color: "var(--color-text-muted)", marginBottom: 8 } }, b ? "Link generated:" : "Link expires after:"), u ? /* @__PURE__ */ e.h("div", { style: { fontSize: 13, color: "var(--color-text-muted)", padding: "12px 0" } }, "Generating link…") : b ? /* @__PURE__ */ e.h(e.React.Fragment, null, /* @__PURE__ */ e.h("div", { style: {
      fontSize: 11,
      fontFamily: "monospace",
      wordBreak: "break-all",
      background: "var(--color-bg-primary)",
      border: "1px solid var(--color-border)",
      borderRadius: 6,
      padding: 8,
      color: "var(--color-text-primary)"
    } }, b), /* @__PURE__ */ e.h("button", { style: { ...T, padding: 0, color: "var(--color-accent)" }, onClick: L }, C ? "✓ Copied" : "Copy link")) : [{ label: "1 hour", value: 3600 }, { label: "1 day", value: 86400 }, { label: "Never expires", value: null }].map(({ label: S, value: k }) => /* @__PURE__ */ e.h("button", { key: S, style: { ...T, padding: 0 }, onClick: () => v(k) }, S)), /* @__PURE__ */ e.h("button", { style: { ...T, padding: 0, color: "var(--color-text-muted)" }, onClick: () => A("menu") }, "← Back")), _ === "rename" && /* @__PURE__ */ e.h("div", { style: { padding: "8px 16px 4px" } }, /* @__PURE__ */ e.h("div", { style: { fontSize: 12, color: "var(--color-text-muted)", marginBottom: 8 } }, "Rename presentation"), /* @__PURE__ */ e.h(
      "input",
      {
        autoFocus: !0,
        value: D,
        onChange: (S) => U(S.target.value),
        onKeyDown: (S) => {
          S.key === "Enter" && (R(D), x());
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
    ), /* @__PURE__ */ e.h("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ e.h("button", { style: { ...T, color: "var(--color-text-muted)" }, onClick: () => A("menu") }, "Cancel"), /* @__PURE__ */ e.h(
      "button",
      {
        style: { ...T, color: "var(--color-accent)", justifyContent: "flex-end" },
        disabled: !D.trim(),
        onClick: () => {
          R(D), x();
        }
      },
      "Rename"
    )))));
  }
  function Oe({ windowKey: c, instanceId: x, onClose: g, onTitleChange: b }) {
    const w = x, u = n(null), C = n(null), [v, L] = t(!1), [s, p] = t(!1), E = oe(w, c, { onClose: g, onTitleChange: b }), { htmlUrl: d } = E;
    return a(() => {
      const R = C.current;
      if (!R || typeof ResizeObserver > "u") return;
      const y = new ResizeObserver((O) => {
        for (const _ of O) {
          const A = _.contentRect.width;
          A > 0 && L(A < ae);
        }
      });
      return y.observe(R), () => y.disconnect();
    }, []), a(() => {
      v || p(!1);
    }, [v]), a(() => (K.set(c, u.current), () => K.delete(c)), [c]), /* @__PURE__ */ e.h("div", { ref: C, className: "flex flex-col bg-[var(--color-bg-secondary)] h-full" }, /* @__PURE__ */ e.h("div", { className: "flex-1 relative" }, d && // allow-scripts only, deliberately NOT allow-same-origin: presentation
    // HTML is agent-generated and can be hostile/compromised. Without
    // allow-same-origin the frame is an opaque origin — scripts run, but
    // can't read this API host's cookies/localStorage or ride an
    // authenticated same-origin request. A relative fetch inside a
    // presentation would need to resolve via an absolute URL instead.
    /* @__PURE__ */ e.h("iframe", { ref: u, src: d, sandbox: "allow-scripts", className: "absolute inset-0 w-full h-full bg-white border-0", title: "Presentation" }), v && !s && /* @__PURE__ */ e.h(
      "button",
      {
        onClick: () => p(!0),
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
    ), v && s && /* @__PURE__ */ e.h($e, { actions: E, onDismiss: () => p(!1) })));
  }
  e.registerSlot("core.nav", h), e.registerWindow("presentations.gallery", X), e.registerWindow("presentations.viewer", Oe), (ie = e.registerWindowActions) == null || ie.call(e, "presentations.viewer", Te);
}
export {
  Ct as default,
  Ct as register
};
