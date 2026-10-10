function Fe(e, t) {
  if (e.match(/^[a-z]+:\/\//i))
    return e;
  if (e.match(/^\/\//))
    return window.location.protocol + e;
  if (e.match(/^[a-z]+:/i))
    return e;
  const n = document.implementation.createHTMLDocument(), r = n.createElement("base"), a = n.createElement("a");
  return n.head.appendChild(r), n.body.appendChild(a), t && (r.href = t), a.href = e, a.href;
}
const We = /* @__PURE__ */ (() => {
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
let K = null;
function Ee(e = {}) {
  return K || (e.includeStyleProperties ? (K = e.includeStyleProperties, K) : (K = G(window.getComputedStyle(document.documentElement)), K));
}
function ee(e, t) {
  const r = (e.ownerDocument.defaultView || window).getComputedStyle(e).getPropertyValue(t);
  return r ? parseFloat(r.replace("px", "")) : 0;
}
function _e(e) {
  const t = ee(e, "border-left-width"), n = ee(e, "border-right-width");
  return e.clientWidth + t + n;
}
function De(e) {
  const t = ee(e, "border-top-width"), n = ee(e, "border-bottom-width");
  return e.clientHeight + t + n;
}
function Se(e, t = {}) {
  const n = t.width || _e(e), r = t.height || De(e);
  return { width: n, height: r };
}
function Ue() {
  let e, t;
  try {
    t = process;
  } catch {
  }
  const n = t && t.env ? t.env.devicePixelRatio : null;
  return n && (e = parseInt(n, 10), Number.isNaN(e) && (e = 1)), e || window.devicePixelRatio || 1;
}
const z = 16384;
function ze(e) {
  (e.width > z || e.height > z) && (e.width > z && e.height > z ? e.width > e.height ? (e.height *= z / e.width, e.width = z) : (e.width *= z / e.height, e.height = z) : e.width > z ? (e.height *= z / e.width, e.width = z) : (e.width *= z / e.height, e.height = z));
}
function te(e) {
  return new Promise((t, n) => {
    const r = new Image();
    r.onload = () => {
      r.decode().then(() => {
        requestAnimationFrame(() => t(r));
      });
    }, r.onerror = n, r.crossOrigin = "anonymous", r.decoding = "async", r.src = e;
  });
}
async function He(e) {
  return Promise.resolve().then(() => new XMLSerializer().serializeToString(e)).then(encodeURIComponent).then((t) => `data:image/svg+xml;charset=utf-8,${t}`);
}
async function Me(e, t, n) {
  const r = "http://www.w3.org/2000/svg", a = document.createElementNS(r, "svg"), o = document.createElementNS(r, "foreignObject");
  return a.setAttribute("width", `${t}`), a.setAttribute("height", `${n}`), a.setAttribute("viewBox", `0 0 ${t} ${n}`), o.setAttribute("width", "100%"), o.setAttribute("height", "100%"), o.setAttribute("x", "0"), o.setAttribute("y", "0"), o.setAttribute("externalResourcesRequired", "true"), a.appendChild(o), o.appendChild(e), He(a);
}
const U = (e, t) => {
  if (e instanceof t)
    return !0;
  const n = Object.getPrototypeOf(e);
  return n === null ? !1 : n.constructor.name === t.name || U(n, t);
};
function Ve(e) {
  const t = e.getPropertyValue("content");
  return `${e.cssText} content: '${t.replace(/'|"/g, "")}';`;
}
function Be(e, t) {
  return Ee(t).map((n) => {
    const r = e.getPropertyValue(n), a = e.getPropertyPriority(n);
    return `${n}: ${r}${a ? " !important" : ""};`;
  }).join(" ");
}
function Ie(e, t, n, r) {
  const a = `.${e}:${t}`, o = n.cssText ? Ve(n) : Be(n, r);
  return document.createTextNode(`${a}{${o}}`);
}
function he(e, t, n, r) {
  const a = window.getComputedStyle(e, n), o = a.getPropertyValue("content");
  if (o === "" || o === "none")
    return;
  const i = We();
  try {
    t.className = `${t.className} ${i}`;
  } catch {
    return;
  }
  const l = document.createElement("style");
  l.appendChild(Ie(i, n, a, r)), t.appendChild(l);
}
function je(e, t, n) {
  he(e, t, ":before", n), he(e, t, ":after", n);
}
const ge = "application/font-woff", xe = "image/jpeg", Ge = {
  woff: ge,
  woff2: ge,
  ttf: "application/font-truetype",
  eot: "application/vnd.ms-fontobject",
  png: "image/png",
  jpg: xe,
  jpeg: xe,
  gif: "image/gif",
  tiff: "image/tiff",
  svg: "image/svg+xml",
  webp: "image/webp"
};
function qe(e) {
  const t = /\.([^./]*?)$/g.exec(e);
  return t ? t[1] : "";
}
function oe(e) {
  const t = qe(e).toLowerCase();
  return Ge[t] || "";
}
function Je(e) {
  return e.split(/,/)[1];
}
function ae(e) {
  return e.search(/^(data:)/) !== -1;
}
function Xe(e, t) {
  return `data:${t};base64,${e}`;
}
async function ke(e, t, n) {
  const r = await fetch(e, t);
  if (r.status === 404)
    throw new Error(`Resource "${r.url}" not found`);
  const a = await r.blob();
  return new Promise((o, i) => {
    const l = new FileReader();
    l.onerror = i, l.onloadend = () => {
      try {
        o(n({ res: r, result: l.result }));
      } catch (g) {
        i(g);
      }
    }, l.readAsDataURL(a);
  });
}
const ne = {};
function Ke(e, t, n) {
  let r = e.replace(/\?.*/, "");
  return n && (r = e), /ttf|otf|eot|woff2?/i.test(r) && (r = r.replace(/.*\//, "")), t ? `[${t}]${r}` : r;
}
async function ie(e, t, n) {
  const r = Ke(e, t, n.includeQueryParams);
  if (ne[r] != null)
    return ne[r];
  n.cacheBust && (e += (/\?/.test(e) ? "&" : "?") + (/* @__PURE__ */ new Date()).getTime());
  let a;
  try {
    const o = await ke(e, n.fetchRequestInit, ({ res: i, result: l }) => (t || (t = i.headers.get("Content-Type") || ""), Je(l)));
    a = Xe(o, t);
  } catch (o) {
    a = n.imagePlaceholder || "";
    let i = `Failed to fetch resource: ${e}`;
    o && (i = typeof o == "string" ? o : o.message), i && console.warn(i);
  }
  return ne[r] = a, a;
}
async function Qe(e) {
  const t = e.toDataURL();
  return t === "data:," ? e.cloneNode(!1) : te(t);
}
async function Ye(e, t) {
  if (e.currentSrc) {
    const o = document.createElement("canvas"), i = o.getContext("2d");
    o.width = e.clientWidth, o.height = e.clientHeight, i == null || i.drawImage(e, 0, 0, o.width, o.height);
    const l = o.toDataURL();
    return te(l);
  }
  const n = e.poster, r = oe(n), a = await ie(n, r, t);
  return te(a);
}
async function Ze(e, t) {
  var n;
  try {
    if (!((n = e == null ? void 0 : e.contentDocument) === null || n === void 0) && n.body)
      return await re(e.contentDocument.body, t, !0);
  } catch {
  }
  return e.cloneNode(!1);
}
async function et(e, t) {
  return U(e, HTMLCanvasElement) ? Qe(e) : U(e, HTMLVideoElement) ? Ye(e, t) : U(e, HTMLIFrameElement) ? Ze(e, t) : e.cloneNode(Re(e));
}
const tt = (e) => e.tagName != null && e.tagName.toUpperCase() === "SLOT", Re = (e) => e.tagName != null && e.tagName.toUpperCase() === "SVG";
async function rt(e, t, n) {
  var r, a;
  if (Re(t))
    return t;
  let o = [];
  return tt(e) && e.assignedNodes ? o = G(e.assignedNodes()) : U(e, HTMLIFrameElement) && (!((r = e.contentDocument) === null || r === void 0) && r.body) ? o = G(e.contentDocument.body.childNodes) : o = G(((a = e.shadowRoot) !== null && a !== void 0 ? a : e).childNodes), o.length === 0 || U(e, HTMLVideoElement) || await o.reduce((i, l) => i.then(() => re(l, n)).then((g) => {
    g && t.appendChild(g);
  }), Promise.resolve()), t;
}
function nt(e, t, n) {
  const r = t.style;
  if (!r)
    return;
  const a = window.getComputedStyle(e);
  a.cssText ? (r.cssText = a.cssText, r.transformOrigin = a.transformOrigin) : Ee(n).forEach((o) => {
    let i = a.getPropertyValue(o);
    o === "font-size" && i.endsWith("px") && (i = `${Math.floor(parseFloat(i.substring(0, i.length - 2))) - 0.1}px`), U(e, HTMLIFrameElement) && o === "display" && i === "inline" && (i = "block"), o === "d" && t.getAttribute("d") && (i = `path(${t.getAttribute("d")})`), r.setProperty(o, i, a.getPropertyPriority(o));
  });
}
function at(e, t) {
  U(e, HTMLTextAreaElement) && (t.innerHTML = e.value), U(e, HTMLInputElement) && t.setAttribute("value", e.value);
}
function ot(e, t) {
  if (U(e, HTMLSelectElement)) {
    const n = t, r = Array.from(n.children).find((a) => e.value === a.getAttribute("value"));
    r && r.setAttribute("selected", "");
  }
}
function it(e, t, n) {
  return U(t, Element) && (nt(e, t, n), je(e, t, n), at(e, t), ot(e, t)), t;
}
async function lt(e, t) {
  const n = e.querySelectorAll ? e.querySelectorAll("use") : [];
  if (n.length === 0)
    return e;
  const r = {};
  for (let o = 0; o < n.length; o++) {
    const l = n[o].getAttribute("xlink:href");
    if (l) {
      const g = e.querySelector(l), V = document.querySelector(l);
      !g && V && !r[l] && (r[l] = await re(V, t, !0));
    }
  }
  const a = Object.values(r);
  if (a.length) {
    const o = "http://www.w3.org/1999/xhtml", i = document.createElementNS(o, "svg");
    i.setAttribute("xmlns", o), i.style.position = "absolute", i.style.width = "0", i.style.height = "0", i.style.overflow = "hidden", i.style.display = "none";
    const l = document.createElementNS(o, "defs");
    i.appendChild(l);
    for (let g = 0; g < a.length; g++)
      l.appendChild(a[g]);
    e.appendChild(i);
  }
  return e;
}
async function re(e, t, n) {
  return !n && t.filter && !t.filter(e) ? null : Promise.resolve(e).then((r) => et(r, t)).then((r) => rt(e, r, t)).then((r) => it(e, r, t)).then((r) => lt(r, t));
}
const Ce = /url\((['"]?)([^'"]+?)\1\)/g, ct = /url\([^)]+\)\s*format\((["']?)([^"']+)\1\)/g, st = /src:\s*(?:url\([^)]+\)\s*format\([^)]+\)[,;]\s*)+/g;
function ut(e) {
  const t = e.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1");
  return new RegExp(`(url\\(['"]?)(${t})(['"]?\\))`, "g");
}
function dt(e) {
  const t = [];
  return e.replace(Ce, (n, r, a) => (t.push(a), n)), t.filter((n) => !ae(n));
}
async function ft(e, t, n, r, a) {
  try {
    const o = n ? Fe(t, n) : t, i = oe(t);
    let l;
    return a || (l = await ie(o, i, r)), e.replace(ut(t), `$1${l}$3`);
  } catch {
  }
  return e;
}
function pt(e, { preferredFontFormat: t }) {
  return t ? e.replace(st, (n) => {
    for (; ; ) {
      const [r, , a] = ct.exec(n) || [];
      if (!a)
        return "";
      if (a === t)
        return `src: ${r};`;
    }
  }) : e;
}
function Pe(e) {
  return e.search(Ce) !== -1;
}
async function Le(e, t, n) {
  if (!Pe(e))
    return e;
  const r = pt(e, n);
  return dt(r).reduce((o, i) => o.then((l) => ft(l, i, t, n)), Promise.resolve(r));
}
async function Q(e, t, n) {
  var r;
  const a = (r = t.style) === null || r === void 0 ? void 0 : r.getPropertyValue(e);
  if (a) {
    const o = await Le(a, null, n);
    return t.style.setProperty(e, o, t.style.getPropertyPriority(e)), !0;
  }
  return !1;
}
async function mt(e, t) {
  await Q("background", e, t) || await Q("background-image", e, t), await Q("mask", e, t) || await Q("-webkit-mask", e, t) || await Q("mask-image", e, t) || await Q("-webkit-mask-image", e, t);
}
async function ht(e, t) {
  const n = U(e, HTMLImageElement);
  if (!(n && !ae(e.src)) && !(U(e, SVGImageElement) && !ae(e.href.baseVal)))
    return;
  const r = n ? e.src : e.href.baseVal, a = await ie(r, oe(r), t);
  await new Promise((o, i) => {
    e.onload = o, e.onerror = t.onImageErrorHandler ? (...g) => {
      try {
        o(t.onImageErrorHandler(...g));
      } catch (V) {
        i(V);
      }
    } : i;
    const l = e;
    l.decode && (l.decode = o), l.loading === "lazy" && (l.loading = "eager"), n ? (e.srcset = "", e.src = a) : e.href.baseVal = a;
  });
}
async function gt(e, t) {
  const r = G(e.childNodes).map((a) => Te(a, t));
  await Promise.all(r).then(() => e);
}
async function Te(e, t) {
  U(e, Element) && (await mt(e, t), await ht(e, t), await gt(e, t));
}
function xt(e, t) {
  const { style: n } = e;
  t.backgroundColor && (n.backgroundColor = t.backgroundColor), t.width && (n.width = `${t.width}px`), t.height && (n.height = `${t.height}px`);
  const r = t.style;
  return r != null && Object.keys(r).forEach((a) => {
    n[a] = r[a];
  }), e;
}
const ye = {};
async function we(e) {
  let t = ye[e];
  if (t != null)
    return t;
  const r = await (await fetch(e)).text();
  return t = { url: e, cssText: r }, ye[e] = t, t;
}
async function be(e, t) {
  let n = e.cssText;
  const r = /url\(["']?([^"')]+)["']?\)/g, o = (n.match(/url\([^)]+\)/g) || []).map(async (i) => {
    let l = i.replace(r, "$1");
    return l.startsWith("https://") || (l = new URL(l, e.url).href), ke(l, t.fetchRequestInit, ({ result: g }) => (n = n.replace(i, `url(${g})`), [i, g]));
  });
  return Promise.all(o).then(() => n);
}
function ve(e) {
  if (e == null)
    return [];
  const t = [], n = /(\/\*[\s\S]*?\*\/)/gi;
  let r = e.replace(n, "");
  const a = new RegExp("((@.*?keyframes [\\s\\S]*?){([\\s\\S]*?}\\s*?)})", "gi");
  for (; ; ) {
    const g = a.exec(r);
    if (g === null)
      break;
    t.push(g[0]);
  }
  r = r.replace(a, "");
  const o = /@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi, i = "((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})", l = new RegExp(i, "gi");
  for (; ; ) {
    let g = o.exec(r);
    if (g === null) {
      if (g = l.exec(r), g === null)
        break;
      o.lastIndex = l.lastIndex;
    } else
      l.lastIndex = o.lastIndex;
    t.push(g[0]);
  }
  return t;
}
async function yt(e, t) {
  const n = [], r = [];
  return e.forEach((a) => {
    if ("cssRules" in a)
      try {
        G(a.cssRules || []).forEach((o, i) => {
          if (o.type === CSSRule.IMPORT_RULE) {
            let l = i + 1;
            const g = o.href, V = we(g).then((B) => be(B, t)).then((B) => ve(B).forEach((Y) => {
              try {
                a.insertRule(Y, Y.startsWith("@import") ? l += 1 : a.cssRules.length);
              } catch (Z) {
                console.error("Error inserting rule from remote css", {
                  rule: Y,
                  error: Z
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
        a.href != null && r.push(we(a.href).then((l) => be(l, t)).then((l) => ve(l).forEach((g) => {
          i.insertRule(g, i.cssRules.length);
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
function wt(e) {
  return e.filter((t) => t.type === CSSRule.FONT_FACE_RULE).filter((t) => Pe(t.style.getPropertyValue("src")));
}
async function bt(e, t) {
  if (e.ownerDocument == null)
    throw new Error("Provided element is not within a Document");
  const n = G(e.ownerDocument.styleSheets), r = await yt(n, t);
  return wt(r);
}
function $e(e) {
  return e.trim().replace(/["']/g, "");
}
function vt(e) {
  const t = /* @__PURE__ */ new Set();
  function n(r) {
    (r.style.fontFamily || getComputedStyle(r).fontFamily).split(",").forEach((o) => {
      t.add($e(o));
    }), Array.from(r.children).forEach((o) => {
      o instanceof HTMLElement && n(o);
    });
  }
  return n(e), t;
}
async function Et(e, t) {
  const n = await bt(e, t), r = vt(e);
  return (await Promise.all(n.filter((o) => r.has($e(o.style.fontFamily))).map((o) => {
    const i = o.parentStyleSheet ? o.parentStyleSheet.href : null;
    return Le(o.cssText, i, t);
  }))).join(`
`);
}
async function St(e, t) {
  const n = t.fontEmbedCSS != null ? t.fontEmbedCSS : t.skipFonts ? null : await Et(e, t);
  if (n) {
    const r = document.createElement("style"), a = document.createTextNode(n);
    r.appendChild(a), e.firstChild ? e.insertBefore(r, e.firstChild) : e.appendChild(r);
  }
}
async function kt(e, t = {}) {
  const { width: n, height: r } = Se(e, t), a = await re(e, t, !0);
  return await St(a, t), await Te(a, t), xt(a, t), await Me(a, n, r);
}
async function Rt(e, t = {}) {
  const { width: n, height: r } = Se(e, t), a = await kt(e, t), o = await te(a), i = document.createElement("canvas"), l = i.getContext("2d"), g = t.pixelRatio || Ue(), V = t.canvasWidth || n, B = t.canvasHeight || r;
  return i.width = V * g, i.height = B * g, t.skipAutoScale || ze(i), i.style.width = `${V}`, i.style.height = `${B}`, t.backgroundColor && (l.fillStyle = t.backgroundColor, l.fillRect(0, 0, i.width, i.height)), l.drawImage(o, 0, 0, i.width, i.height), i;
}
async function Ct(e, t = {}) {
  return (await Rt(e, t)).toDataURL();
}
function Pt(e) {
  var se;
  const { useState: t, useRef: n, useCallback: r, useEffect: a } = e.React, o = 1280, i = 832;
  function l(c) {
    const w = c === void 0, [x, v] = t([]), [b, f] = t(w), [C, E] = t(""), [$, s] = t(null), [m, S] = t(!1), p = n(""), P = n(null), y = n(0);
    a(() => {
      w && (async () => {
        try {
          const L = await (await e.sdk.api.fetch(e.app.apiUrl("/presentations"))).json();
          v(Array.isArray(L) ? L : []);
        } catch {
          v([]);
        } finally {
          f(!1);
        }
      })();
    }, [w]);
    const O = r((F) => {
      clearTimeout(P.current);
      const L = F.trim();
      if (!L) {
        s(null), S(!1);
        return;
      }
      S(!0), P.current = setTimeout(async () => {
        const u = ++y.current;
        try {
          const R = await (await e.sdk.api.fetch(e.app.apiUrl("/presentations?q=" + encodeURIComponent(L)))).json();
          u === y.current && (s(Array.isArray(R) ? R : []), S(!1));
        } catch {
          u === y.current && (s([]), S(!1));
        }
      }, 200);
    }, []);
    a(() => () => clearTimeout(P.current), []);
    const H = r((F) => {
      const L = F.target.value;
      p.current = L, E(L), O(L);
    }, [O]);
    a(() => {
      const F = (L) => {
        const u = L.detail;
        !u || u.type !== "presentation_update" || (w && (u.action === "create" ? v((A) => [...A.filter((R) => R.id !== u.presentation.id), u.presentation]) : u.action === "update" ? v((A) => A.map((R) => R.id === u.presentation.id ? u.presentation : R)) : u.action === "delete" && v((A) => A.filter((R) => R.id !== u.id))), u.action === "create" || u.action === "update" ? p.current.trim() && O(p.current) : u.action === "delete" && s((A) => A && A.filter((R) => R.id !== u.id)));
      };
      return window.addEventListener("aw-presentation-update", F), () => window.removeEventListener("aw-presentation-update", F);
    }, [w, O]);
    const D = [...w ? x : c].sort((F, L) => (L.created_at || 0) - (F.created_at || 0)), k = $ ?? D, M = r(async (F) => {
      await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${F}`), { method: "DELETE" });
    }, []);
    return { loading: b, term: C, handleTermChange: H, results: $, searchLoading: m, visible: k, count: D.length, deletePresentation: M };
  }
  function g() {
    const [c, w] = t([]), x = r((s, m) => {
      var S;
      (S = window.__awOpenAppWindow) == null || S.call(window, "presentations.viewer", s, m);
    }, []);
    a(() => (window.__awOpenPresentation = (s) => {
      const m = c.find((S) => S.id === s);
      x(s, m == null ? void 0 : m.title);
    }, () => {
      delete window.__awOpenPresentation;
    }), [c, x]), a(() => {
      var S;
      const s = (S = e.sdk.ws) == null ? void 0 : S.createSharedSocket;
      if (!s) {
        console.warn("[presentations] host.sdk.ws.createSharedSocket is unavailable (SPA too old for aw-ws/1 §9.1) — live updates disabled.");
        return;
      }
      return s({
        url: () => e.app.wsUrl("/ws"),
        initType: "presentation_init",
        onFrame: (p) => {
          if (p.type === "presentation_init") {
            w(p.presentations || []);
            return;
          }
          if (p.type === "presentation_update") {
            try {
              window.dispatchEvent(new CustomEvent("aw-presentation-update", { detail: p }));
            } catch {
            }
            p.action === "create" ? (w((P) => [...P.filter((y) => y.id !== p.presentation.id), p.presentation]), p.presentation.visible !== !1 && !p.silent && x(p.presentation.id, p.presentation.title)) : p.action === "update" ? w((P) => P.map((y) => y.id === p.presentation.id ? p.presentation : y)) : p.action === "delete" && w((P) => P.filter((y) => y.id !== p.id));
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
    }, [x]);
    const v = l(c), [b, f] = t(!1), C = n(null), E = r(() => {
      clearTimeout(C.current), f(!0);
    }, []), $ = r(() => {
      clearTimeout(C.current), C.current = setTimeout(() => f(!1), 150);
    }, []);
    return a(() => () => clearTimeout(C.current), []), /* @__PURE__ */ e.h("div", { className: "relative", onMouseEnter: E, onMouseLeave: $ }, /* @__PURE__ */ e.h(
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
    ), b && /* @__PURE__ */ e.h(
      "div",
      {
        className: "absolute left-0 top-full mt-2 z-50 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-2xl p-3",
        style: { minWidth: 320, maxWidth: 720 }
      },
      /* @__PURE__ */ e.h(
        B,
        {
          gallery: v,
          onOpen: (s, m) => {
            f(!1), x(s, m);
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
  function V({ presentation: c, onClick: w, onDelete: x }) {
    const v = n(null), [b, f] = t(0.16), C = o, E = i, $ = E / C;
    a(() => {
      const m = v.current;
      if (!m || typeof ResizeObserver > "u") return;
      const S = new ResizeObserver((p) => {
        for (const P of p) {
          const y = P.contentRect.width;
          y > 0 && f(y / C);
        }
      });
      return S.observe(m), () => S.disconnect();
    }, []);
    const s = c.created_at ? new Date(c.created_at * 1e3).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
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
          ref: v,
          className: "relative bg-[var(--color-bg-primary)]",
          style: { width: "100%", paddingTop: `${$ * 100}%`, overflow: "hidden" }
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
              height: E,
              border: 0,
              pointerEvents: "none",
              transform: `scale(${b})`,
              transformOrigin: "top left"
            }
          }
        )
      ),
      /* @__PURE__ */ e.h("div", { className: "px-2 py-1.5 border-t border-[var(--color-border)]" }, /* @__PURE__ */ e.h("div", { className: "text-[11px] font-medium text-[var(--color-text-primary)] truncate" }, c.title || "Untitled"), Array.isArray(c.tags) && c.tags.length > 0 && /* @__PURE__ */ e.h("div", { className: "flex flex-wrap gap-0.5 mt-0.5 overflow-hidden", style: { maxHeight: 18 } }, c.tags.slice(0, 4).map((m) => /* @__PURE__ */ e.h(
        "span",
        {
          key: m,
          className: "text-[8px] font-mono leading-none px-1 py-[2px] rounded bg-white/5 border border-white/10 text-[var(--color-text-muted)] truncate",
          title: m
        },
        m
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
          onClick: (m) => {
            m.stopPropagation(), x();
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
    onOpen: w,
    cardMinWidth: x,
    narrow: v = !1,
    autoFocus: b = !0,
    inputWrapperClassName: f,
    inputClassName: C,
    resultsWrapperClassName: E,
    resultsWrapperStyle: $,
    gridGapClassName: s = "gap-3",
    emptyPaddingClassName: m = "px-4 py-10",
    showSectionLabel: S = !1
  }) {
    const { term: p, handleTermChange: P, results: y, searchLoading: O, visible: H, loading: _, deletePresentation: D } = c;
    return /* @__PURE__ */ e.h(e.React.Fragment, null, /* @__PURE__ */ e.h("div", { className: f }, /* @__PURE__ */ e.h(
      "input",
      {
        type: "text",
        value: p,
        onChange: P,
        placeholder: "Search title or content…",
        autoFocus: b && !v,
        className: C,
        style: v ? { fontSize: 16 } : void 0
      }
    )), /* @__PURE__ */ e.h("div", { className: E, style: $ }, _ ? /* @__PURE__ */ e.h("div", { className: `${m} text-center text-xs text-[var(--color-text-muted)]` }, "Loading…") : H.length === 0 && !O ? y !== null ? /* @__PURE__ */ e.h("div", { className: `${m} text-center text-xs text-[var(--color-text-muted)]` }, "No results for “", p.trim(), "”") : /* @__PURE__ */ e.h("div", { className: `${m} text-center text-xs text-[var(--color-text-muted)] italic` }, "No presentations yet. Use ", /* @__PURE__ */ e.h("code", { className: "bg-white/10 px-1 rounded" }, "/aw-presentation"), " to create one.") : /* @__PURE__ */ e.h(e.React.Fragment, null, S && !O && /* @__PURE__ */ e.h("div", { className: "text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2 px-1" }, "Presentations · newest first"), O && /* @__PURE__ */ e.h("div", { className: "text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2 px-1" }, "Searching…"), /* @__PURE__ */ e.h(
      "div",
      {
        className: `grid ${s}`,
        style: { gridTemplateColumns: `repeat(auto-fill, minmax(${x}px, 1fr))` }
      },
      H.map((k) => /* @__PURE__ */ e.h(
        V,
        {
          key: k.id,
          presentation: k,
          onClick: () => w(k.id, k.title),
          onDelete: () => D(k.id)
        }
      ))
    ))));
  }
  function Y() {
    const c = n(null), [w, x] = t(!1), v = l(), b = r((f, C) => {
      var E;
      (E = window.__awOpenAppWindow) == null || E.call(window, "presentations.viewer", f, C);
    }, []);
    return a(() => {
      const f = c.current;
      if (!f || typeof ResizeObserver > "u") return;
      const C = new ResizeObserver((E) => {
        for (const $ of E) {
          const s = $.contentRect.width;
          s > 0 && x(s < le);
        }
      });
      return C.observe(f), () => C.disconnect();
    }, []), /* @__PURE__ */ e.h("div", { ref: c, className: "flex flex-col h-full bg-[var(--color-bg-secondary)]" }, /* @__PURE__ */ e.h(
      B,
      {
        gallery: v,
        onOpen: b,
        cardMinWidth: 200,
        narrow: w,
        inputWrapperClassName: "p-3 border-b border-[var(--color-border)]",
        inputClassName: "w-full text-[12px] bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2.5 py-2 text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]",
        resultsWrapperClassName: "flex-1 overflow-y-auto p-3"
      }
    ));
  }
  const Z = /* @__PURE__ */ new Map(), le = 640;
  function ce(c, w, { onClose: x, onTitleChange: v } = {}) {
    const [b, f] = t(null), [C, E] = t(!1), [$, s] = t(null), [m, S] = t(!1), [p, P] = t(!1), [y, O] = t(null), [H, _] = t(null), D = r(async () => {
      if (c)
        try {
          const h = await (await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${c}`))).json();
          if ((h == null ? void 0 : h.success) === !1) return;
          f(h);
        } catch {
        }
    }, [c]);
    a(() => {
      D();
    }, [D]), a(() => {
      const T = (h) => {
        var N;
        const d = h.detail;
        !d || d.type !== "presentation_update" || (d.action === "delete" && d.id === c ? x == null || x() : (d.action === "update" || d.action === "create") && ((N = d.presentation) == null ? void 0 : N.id) === c && f(d.presentation));
      };
      return window.addEventListener("aw-presentation-update", T), () => window.removeEventListener("aw-presentation-update", T);
    }, [c, x]);
    const k = c ? e.app.absoluteApiUrl(`/presentations/${c}/html`) : null, M = r((T) => {
      const h = document.createElement("a");
      h.download = `${((b == null ? void 0 : b.title) || "presentation").replace(/[^a-zA-Z0-9_-]/g, "_")}.png`, h.href = T, h.click();
    }, [b == null ? void 0 : b.title]), F = r(async () => {
      var T;
      O(null), P(!0);
      try {
        const h = (T = Z.get(w)) == null ? void 0 : T.contentDocument;
        if (h && h.body) {
          const d = await Ct(h.documentElement, {
            backgroundColor: "#111318",
            pixelRatio: 2,
            width: h.documentElement.scrollWidth,
            height: h.documentElement.scrollHeight
          });
          M(d);
          return;
        }
        throw new Error("presentation content is not accessible from this window (cross-origin iframe)");
      } catch (h) {
        console.warn("Client-side export failed, falling back to server render:", h);
        try {
          const d = await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${c}/export`), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
          }), N = await d.json().catch(() => null);
          if (!d.ok || !(N != null && N.data_url))
            throw new Error((N == null ? void 0 : N.detail) || `export failed (${d.status})`);
          M(N.data_url);
        } catch (d) {
          console.error("Export failed:", d), O(d.message || "Export failed");
        }
      } finally {
        P(!1);
      }
    }, [c, M, w]), L = r((T) => {
      var h;
      if (v) {
        v(T);
        return;
      }
      (h = window.__awOpenAppWindow) == null || h.call(window, "presentations.viewer", c, T);
    }, [v, c]), u = r(async (T) => {
      const h = (T || "").trim();
      if (!h || h === (b == null ? void 0 : b.title)) return !0;
      _(null);
      try {
        const d = await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${c}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: h })
        }), N = await d.json().catch(() => null);
        if (!d.ok || (N == null ? void 0 : N.success) === !1)
          throw new Error((N == null ? void 0 : N.error) || `rename failed (${d.status})`);
        return f((X) => X && { ...X, title: h }), L(h), !0;
      } catch (d) {
        return console.error("Rename failed:", d), _(d.message || "Rename failed"), !1;
      }
    }, [b == null ? void 0 : b.title, c, L]), A = r(async (T) => {
      if (c) {
        E(!0), s(null);
        try {
          const d = await (await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${c}/share`), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expires_in: T })
          })).json();
          d.success && d.token && s(`${k}?token=${d.token}`);
        } catch (h) {
          console.error("Share failed:", h);
        } finally {
          E(!1);
        }
      }
    }, [c, k]), R = r(() => {
      var T;
      $ && ((T = navigator.clipboard) == null || T.writeText($).then(() => {
        S(!0), setTimeout(() => S(!1), 2e3);
      }).catch(() => {
      }));
    }, [$]), q = r(async () => {
      await e.sdk.api.fetch(e.app.apiUrl(`/presentations/${c}`), { method: "DELETE" }), x == null || x();
    }, [c, x]), J = r(({ asTab: T = !1 } = {}) => {
      if (k) {
        if (T) {
          window.open(k, "_blank");
          return;
        }
        window.open(k, `presentation-${c}`, "popup=1,width=1000,height=700");
      }
    }, [k, c]);
    return {
      presentation: b,
      htmlUrl: k,
      shareLink: $,
      setShareLink: s,
      shareLoading: C,
      shareCopied: m,
      handleCreateShare: A,
      handleCopy: R,
      exportLoading: p,
      exportError: y,
      setExportError: O,
      handleExport: F,
      commitRename: u,
      renameError: H,
      setRenameError: _,
      handleDelete: q,
      popOut: J
    };
  }
  function Oe({ windowKey: c, instanceId: w, onClose: x, onTitleChange: v }) {
    const b = w, {
      presentation: f,
      htmlUrl: C,
      shareLink: E,
      setShareLink: $,
      shareLoading: s,
      shareCopied: m,
      handleCreateShare: S,
      handleCopy: p,
      exportLoading: P,
      exportError: y,
      setExportError: O,
      handleExport: H,
      commitRename: _,
      renameError: D,
      setRenameError: k,
      handleDelete: M,
      popOut: F
    } = ce(b, c, { onClose: x, onTitleChange: v }), [L, u] = t(!1), [A, R] = t(""), [q, J] = t(!1);
    a(() => {
      L || R((f == null ? void 0 : f.title) || "");
    }, [f == null ? void 0 : f.title, L]);
    const T = n(null), h = n(null), [d, N] = t(null), X = r((W) => {
      var j;
      const I = (j = W.current) == null ? void 0 : j.getBoundingClientRect();
      I && N({ top: I.bottom + 6, right: window.innerWidth - I.right });
    }, []), ue = r(async () => {
      await _(A) && u(!1);
    }, [_, A]);
    return a(() => {
      if (!L && !q && !y) return;
      const W = (j) => {
        var de, fe, pe, me;
        (de = T.current) != null && de.contains(j.target) || (fe = h.current) != null && fe.contains(j.target) || (me = (pe = j.target).closest) != null && me.call(pe, "[data-pres-popover]") || (u(!1), J(!1), O(null), k(null));
      }, I = (j) => {
        j.key === "Escape" && (u(!1), J(!1), O(null), k(null));
      };
      return document.addEventListener("mousedown", W), document.addEventListener("keydown", I), () => {
        document.removeEventListener("mousedown", W), document.removeEventListener("keydown", I);
      };
    }, [L, q, y, O, k]), /* @__PURE__ */ e.h(e.React.Fragment, null, /* @__PURE__ */ e.h(
      "button",
      {
        ref: T,
        onClick: () => {
          J(!1), u((W) => W ? !1 : (R((f == null ? void 0 : f.title) || ""), k(null), X(T), !0));
        },
        className: "p-1 rounded hover:bg-white/10 text-[var(--color-text-muted)]",
        title: "Rename presentation"
      },
      /* @__PURE__ */ e.h("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("path", { d: "M12 20h9" }), /* @__PURE__ */ e.h("path", { d: "M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z" }))
    ), /* @__PURE__ */ e.h(
      "button",
      {
        ref: h,
        onClick: () => {
          u(!1), $(null), J((W) => W ? !1 : (X(h), !0));
        },
        className: "p-1 rounded hover:bg-white/10 text-[var(--color-text-muted)]",
        title: "Share presentation"
      },
      /* @__PURE__ */ e.h("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("circle", { cx: "18", cy: "5", r: "3" }), /* @__PURE__ */ e.h("circle", { cx: "6", cy: "12", r: "3" }), /* @__PURE__ */ e.h("circle", { cx: "18", cy: "19", r: "3" }), /* @__PURE__ */ e.h("path", { d: "M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" }))
    ), /* @__PURE__ */ e.h(
      "button",
      {
        onClick: () => F(),
        className: "p-1 rounded hover:bg-white/10 text-[var(--color-text-muted)]",
        title: "Pop out to new window"
      },
      /* @__PURE__ */ e.h("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("path", { d: "M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" }), /* @__PURE__ */ e.h("polyline", { points: "15 3 21 3 21 9" }), /* @__PURE__ */ e.h("line", { x1: "10", y1: "14", x2: "21", y2: "3" }))
    ), /* @__PURE__ */ e.h(
      "button",
      {
        onClick: H,
        disabled: P,
        className: `p-1 rounded ${P ? "opacity-50 cursor-wait" : "hover:bg-white/10 cursor-pointer"} ${y ? "text-[var(--color-danger)]" : "text-[var(--color-text-muted)]"}`,
        title: y ? `Export failed: ${y}` : "Export as PNG"
      },
      /* @__PURE__ */ e.h("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ e.h("path", { d: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" }), /* @__PURE__ */ e.h("polyline", { points: "7 10 12 15 17 10" }), /* @__PURE__ */ e.h("line", { x1: "12", y1: "15", x2: "12", y2: "3" }))
    ), /* @__PURE__ */ e.h(
      "button",
      {
        onClick: M,
        className: "p-1 rounded hover:bg-white/10 text-[var(--color-text-muted)] hover:text-[var(--color-danger)]",
        title: "Delete presentation"
      },
      /* @__PURE__ */ e.h("svg", { width: "14", height: "14", viewBox: "0 0 16 16", fill: "currentColor" }, /* @__PURE__ */ e.h("path", { d: "M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" }), /* @__PURE__ */ e.h("path", { fillRule: "evenodd", d: "M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2h3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1h3a1 1 0 0 1 1 1z" }))
    ), L && d && e.ReactDOM.createPortal(
      /* @__PURE__ */ e.h(
        "div",
        {
          "data-pres-popover": !0,
          className: "fixed bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-2xl p-3",
          style: { top: d.top, right: d.right, minWidth: 260, zIndex: 1e3 }
        },
        /* @__PURE__ */ e.h("div", { className: "text-[11px] font-medium text-[var(--color-text-primary)] mb-2" }, "Rename presentation"),
        /* @__PURE__ */ e.h(
          "input",
          {
            autoFocus: !0,
            value: A,
            onChange: (W) => R(W.target.value),
            onKeyDown: (W) => {
              W.key === "Enter" && ue(), W.key === "Escape" && (u(!1), R((f == null ? void 0 : f.title) || ""), k(null));
            },
            className: "w-full text-[11px] bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2 py-1 text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
          }
        ),
        D && /* @__PURE__ */ e.h("div", { className: "text-[10px] text-[var(--color-danger)] mt-1.5" }, D),
        /* @__PURE__ */ e.h("div", { className: "flex justify-end mt-2" }, /* @__PURE__ */ e.h(
          "button",
          {
            onClick: ue,
            disabled: !A.trim(),
            className: "text-[11px] px-2 py-1 rounded bg-[var(--color-accent)]/20 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/30 transition-colors disabled:opacity-40"
          },
          "Rename"
        ))
      ),
      document.body
    ), q && d && e.ReactDOM.createPortal(
      /* @__PURE__ */ e.h(
        "div",
        {
          "data-pres-popover": !0,
          className: "fixed bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-2xl p-3",
          style: { top: d.top, right: d.right, minWidth: 260, zIndex: 1e3 }
        },
        /* @__PURE__ */ e.h("div", { className: "text-[11px] font-medium text-[var(--color-text-primary)] mb-2" }, "Share presentation"),
        s ? /* @__PURE__ */ e.h("div", { className: "text-[11px] text-[var(--color-text-muted)] py-2 text-center" }, "Generating link…") : E ? /* @__PURE__ */ e.h("div", { className: "flex flex-col gap-2" }, /* @__PURE__ */ e.h("div", { className: "text-[10px] text-[var(--color-text-muted)]" }, "Link generated:"), /* @__PURE__ */ e.h("div", { className: "flex items-center gap-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2 py-1.5" }, /* @__PURE__ */ e.h("span", { className: "text-[10px] font-mono text-[var(--color-text-primary)] truncate flex-1", title: E }, E), /* @__PURE__ */ e.h("button", { onClick: p, className: "shrink-0 text-[10px] px-2 py-0.5 rounded bg-[var(--color-accent)]/20 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/30 transition-colors" }, m ? "✓ Copied" : "Copy")), /* @__PURE__ */ e.h("button", { onClick: () => $(null), className: "text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-left" }, "← Generate new link")) : /* @__PURE__ */ e.h("div", { className: "flex flex-col gap-1.5" }, /* @__PURE__ */ e.h("div", { className: "text-[10px] text-[var(--color-text-muted)] mb-1" }, "Link expires after:"), [{ label: "1 hour", value: 3600 }, { label: "1 day", value: 86400 }, { label: "Never expires", value: null }].map(({ label: W, value: I }) => /* @__PURE__ */ e.h(
          "button",
          {
            key: W,
            onClick: () => S(I),
            className: "text-left text-[11px] px-3 py-1.5 rounded bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-colors"
          },
          W
        )))
      ),
      document.body
    ), y && d && e.ReactDOM.createPortal(
      // The `title` attribute never surfaces on touch devices (iOS Safari
      // shows no hover tooltip on tap), so a red icon with no visible
      // reason reads as "broken, does nothing" — this makes it tappable.
      /* @__PURE__ */ e.h(
        "div",
        {
          "data-pres-popover": !0,
          className: "fixed bg-[var(--color-bg-secondary)] border border-[var(--color-danger)]/40 rounded-lg shadow-2xl p-3",
          style: { top: d.top, right: d.right, minWidth: 220, maxWidth: 280, zIndex: 1e3 }
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
  function Ae({ actions: c, onDismiss: w }) {
    const {
      presentation: x,
      shareLink: v,
      setShareLink: b,
      shareLoading: f,
      shareCopied: C,
      handleCreateShare: E,
      handleCopy: $,
      exportLoading: s,
      exportError: m,
      setExportError: S,
      handleExport: p,
      commitRename: P,
      renameError: y,
      setRenameError: O,
      handleDelete: H,
      popOut: _
    } = c, [D, k] = t("menu"), [M, F] = t((x == null ? void 0 : x.title) || ""), L = r(async () => {
      await P(M) && w();
    }, [P, M, w]), u = {
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
    }, A = {
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
        onClick: w,
        style: { position: "absolute", inset: 0, zIndex: 19, background: "rgba(0,0,0,0.45)" }
      }
    ), /* @__PURE__ */ e.h("div", { style: A, role: "menu" }, D === "menu" && /* @__PURE__ */ e.h(e.React.Fragment, null, /* @__PURE__ */ e.h("button", { style: u, onClick: () => {
      b(null), k("share");
    } }, "Share"), /* @__PURE__ */ e.h(
      "button",
      {
        style: { ...u, opacity: s ? 0.5 : 1 },
        disabled: s,
        onClick: p
      },
      s ? "Exporting…" : "Export as PNG"
    ), /* @__PURE__ */ e.h("button", { style: u, onClick: () => {
      F((x == null ? void 0 : x.title) || ""), O(null), k("rename");
    } }, "Rename"), /* @__PURE__ */ e.h("button", { style: u, onClick: () => {
      _({ asTab: !0 }), w();
    } }, "Open in new tab"), /* @__PURE__ */ e.h(
      "button",
      {
        style: { ...u, color: "var(--color-danger)" },
        onClick: () => {
          H(), w();
        }
      },
      "Delete"
    ), m && /* @__PURE__ */ e.h("div", { style: { padding: "8px 16px", fontSize: 12, color: "var(--color-danger)" } }, "Export failed: ", m, /* @__PURE__ */ e.h(
      "button",
      {
        onClick: () => S(null),
        style: { ...u, minHeight: 36, padding: 0, marginTop: 4, fontSize: 12, color: "var(--color-text-muted)" }
      },
      "Dismiss"
    ))), D === "share" && /* @__PURE__ */ e.h("div", { style: { padding: "8px 16px 4px" } }, /* @__PURE__ */ e.h("div", { style: { fontSize: 12, color: "var(--color-text-muted)", marginBottom: 8 } }, v ? "Link generated:" : "Link expires after:"), f ? /* @__PURE__ */ e.h("div", { style: { fontSize: 13, color: "var(--color-text-muted)", padding: "12px 0" } }, "Generating link…") : v ? /* @__PURE__ */ e.h(e.React.Fragment, null, /* @__PURE__ */ e.h("div", { style: {
      fontSize: 11,
      fontFamily: "monospace",
      wordBreak: "break-all",
      background: "var(--color-bg-primary)",
      border: "1px solid var(--color-border)",
      borderRadius: 6,
      padding: 8,
      color: "var(--color-text-primary)"
    } }, v), /* @__PURE__ */ e.h("button", { style: { ...u, padding: 0, color: "var(--color-accent)" }, onClick: $ }, C ? "✓ Copied" : "Copy link")) : [{ label: "1 hour", value: 3600 }, { label: "1 day", value: 86400 }, { label: "Never expires", value: null }].map(({ label: R, value: q }) => /* @__PURE__ */ e.h("button", { key: R, style: { ...u, padding: 0 }, onClick: () => E(q) }, R)), /* @__PURE__ */ e.h("button", { style: { ...u, padding: 0, color: "var(--color-text-muted)" }, onClick: () => k("menu") }, "← Back")), D === "rename" && /* @__PURE__ */ e.h("div", { style: { padding: "8px 16px 4px" } }, /* @__PURE__ */ e.h("div", { style: { fontSize: 12, color: "var(--color-text-muted)", marginBottom: 8 } }, "Rename presentation"), /* @__PURE__ */ e.h(
      "input",
      {
        autoFocus: !0,
        value: M,
        onChange: (R) => F(R.target.value),
        onKeyDown: (R) => {
          R.key === "Enter" && L();
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
    ), y && /* @__PURE__ */ e.h("div", { style: { fontSize: 12, color: "var(--color-danger)", margin: "4px 0" } }, y), /* @__PURE__ */ e.h("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ e.h("button", { style: { ...u, color: "var(--color-text-muted)" }, onClick: () => {
      O(null), k("menu");
    } }, "Cancel"), /* @__PURE__ */ e.h(
      "button",
      {
        style: { ...u, color: "var(--color-accent)", justifyContent: "flex-end" },
        disabled: !M.trim(),
        onClick: L
      },
      "Rename"
    )))));
  }
  function Ne({ windowKey: c, instanceId: w, onClose: x, onTitleChange: v }) {
    const b = w, f = n(null), C = n(null), [E, $] = t(!1), [s, m] = t(!1), S = ce(b, c, { onClose: x, onTitleChange: v }), { htmlUrl: p } = S;
    return a(() => {
      const P = C.current;
      if (!P || typeof ResizeObserver > "u") return;
      const y = new ResizeObserver((O) => {
        for (const H of O) {
          const _ = H.contentRect.width;
          _ > 0 && $(_ < le);
        }
      });
      return y.observe(P), () => y.disconnect();
    }, []), a(() => {
      E || m(!1);
    }, [E]), a(() => (Z.set(c, f.current), () => Z.delete(c)), [c]), /* @__PURE__ */ e.h("div", { ref: C, className: "flex flex-col bg-[var(--color-bg-secondary)] h-full" }, /* @__PURE__ */ e.h("div", { className: "flex-1 relative" }, p && // allow-scripts only, deliberately NOT allow-same-origin: presentation
    // HTML is agent-generated and can be hostile/compromised. Without
    // allow-same-origin the frame is an opaque origin — scripts run, but
    // can't read this API host's cookies/localStorage or ride an
    // authenticated same-origin request. A relative fetch inside a
    // presentation would need to resolve via an absolute URL instead.
    /* @__PURE__ */ e.h("iframe", { ref: f, src: p, sandbox: "allow-scripts", className: "absolute inset-0 w-full h-full bg-white border-0", title: "Presentation" }), E && !s && /* @__PURE__ */ e.h(
      "button",
      {
        onClick: () => m(!0),
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
    ), E && s && /* @__PURE__ */ e.h(Ae, { actions: S, onDismiss: () => m(!1) })));
  }
  e.registerSlot("core.nav", g), e.registerWindow("presentations.gallery", Y), e.registerWindow("presentations.viewer", Ne), (se = e.registerWindowActions) == null || se.call(e, "presentations.viewer", Oe);
}
export {
  Pt as default,
  Pt as register
};
