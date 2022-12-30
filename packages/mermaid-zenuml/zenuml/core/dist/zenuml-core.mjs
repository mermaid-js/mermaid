var M2 = Object.defineProperty;
var P2 = (n, t, e) => t in n ? M2(n, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : n[t] = e;
var tt = (n, t, e) => (P2(n, typeof t != "symbol" ? t + "" : t, e), e);
var ts = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function $2(n) {
  try {
    return JSON.stringify(n);
  } catch {
    return '"[Circular]"';
  }
}
var D2 = F2;
function F2(n, t, e) {
  var r = e && e.stringify || $2, s = 1;
  if (typeof n == "object" && n !== null) {
    var i = t.length + s;
    if (i === 1)
      return n;
    var o = new Array(i);
    o[0] = r(n);
    for (var a = 1; a < i; a++)
      o[a] = r(t[a]);
    return o.join(" ");
  }
  if (typeof n != "string")
    return n;
  var l = t.length;
  if (l === 0)
    return n;
  for (var c = "", u = 1 - s, f = -1, d = n && n.length || 0, p = 0; p < d; ) {
    if (n.charCodeAt(p) === 37 && p + 1 < d) {
      switch (f = f > -1 ? f : 0, n.charCodeAt(p + 1)) {
        case 100:
        case 102:
          if (u >= l || t[u] == null)
            break;
          f < p && (c += n.slice(f, p)), c += Number(t[u]), f = p + 2, p++;
          break;
        case 105:
          if (u >= l || t[u] == null)
            break;
          f < p && (c += n.slice(f, p)), c += Math.floor(Number(t[u])), f = p + 2, p++;
          break;
        case 79:
        case 111:
        case 106:
          if (u >= l || t[u] === void 0)
            break;
          f < p && (c += n.slice(f, p));
          var w = typeof t[u];
          if (w === "string") {
            c += "'" + t[u] + "'", f = p + 2, p++;
            break;
          }
          if (w === "function") {
            c += t[u].name || "<anonymous>", f = p + 2, p++;
            break;
          }
          c += r(t[u]), f = p + 2, p++;
          break;
        case 115:
          if (u >= l)
            break;
          f < p && (c += n.slice(f, p)), c += String(t[u]), f = p + 2, p++;
          break;
        case 37:
          f < p && (c += n.slice(f, p)), c += "%", f = p + 2, p++, u--;
          break;
      }
      ++u;
    }
    ++p;
  }
  return f === -1 ? n : (f < d && (c += n.slice(f)), c);
}
const N1 = D2;
var B2 = ve;
const mr = K2().console || {}, U2 = {
  mapHttpRequest: es,
  mapHttpResponse: es,
  wrapRequestSerializer: Mi,
  wrapResponseSerializer: Mi,
  wrapErrorSerializer: Mi,
  req: es,
  res: es,
  err: z2
};
function H2(n, t) {
  return Array.isArray(n) ? n.filter(function(r) {
    return r !== "!stdSerializers.err";
  }) : n === !0 ? Object.keys(t) : !1;
}
function ve(n) {
  n = n || {}, n.browser = n.browser || {};
  const t = n.browser.transmit;
  if (t && typeof t.send != "function")
    throw Error("pino: transmit option must have a send function");
  const e = n.browser.write || mr;
  n.browser.write && (n.browser.asObject = !0);
  const r = n.serializers || {}, s = H2(n.browser.serialize, r);
  let i = n.browser.serialize;
  Array.isArray(n.browser.serialize) && n.browser.serialize.indexOf("!stdSerializers.err") > -1 && (i = !1);
  const o = ["error", "fatal", "warn", "info", "debug", "trace"];
  typeof e == "function" && (e.error = e.fatal = e.warn = e.info = e.debug = e.trace = e), (n.enabled === !1 || n.browser.disabled) && (n.level = "silent");
  const a = n.level || "info", l = Object.create(e);
  l.log || (l.log = _r), Object.defineProperty(l, "levelVal", {
    get: u
  }), Object.defineProperty(l, "level", {
    get: f,
    set: d
  });
  const c = {
    transmit: t,
    serialize: s,
    asObject: n.browser.asObject,
    levels: o,
    timestamp: Z2(n)
  };
  l.levels = ve.levels, l.level = a, l.setMaxListeners = l.getMaxListeners = l.emit = l.addListener = l.on = l.prependListener = l.once = l.prependOnceListener = l.removeListener = l.removeAllListeners = l.listeners = l.listenerCount = l.eventNames = l.write = l.flush = _r, l.serializers = r, l._serialize = s, l._stdErrSerialize = i, l.child = p, t && (l._logEvent = ro());
  function u() {
    return this.level === "silent" ? 1 / 0 : this.levels.values[this.level];
  }
  function f() {
    return this._level;
  }
  function d(w) {
    if (w !== "silent" && !this.levels.values[w])
      throw Error("unknown level " + w);
    this._level = w, Cn(c, l, "error", "log"), Cn(c, l, "fatal", "error"), Cn(c, l, "warn", "error"), Cn(c, l, "info", "log"), Cn(c, l, "debug", "log"), Cn(c, l, "trace", "log");
  }
  function p(w, I) {
    if (!w)
      throw new Error("missing bindings for child Pino");
    I = I || {}, s && w.serializers && (I.serializers = w.serializers);
    const W = I.serializers;
    if (s && W) {
      var $ = Object.assign({}, r, W), j = n.browser.serialize === !0 ? Object.keys($) : s;
      delete w.serializers, Qs([w], j, $, this._stdErrSerialize);
    }
    function it(Y) {
      this._childLevel = (Y._childLevel | 0) + 1, this.error = En(Y, w, "error"), this.fatal = En(Y, w, "fatal"), this.warn = En(Y, w, "warn"), this.info = En(Y, w, "info"), this.debug = En(Y, w, "debug"), this.trace = En(Y, w, "trace"), $ && (this.serializers = $, this._serialize = j), t && (this._logEvent = ro(
        [].concat(Y._logEvent.bindings, w)
      ));
    }
    return it.prototype = this, new it(this);
  }
  return l;
}
ve.levels = {
  values: {
    fatal: 60,
    error: 50,
    warn: 40,
    info: 30,
    debug: 20,
    trace: 10
  },
  labels: {
    10: "trace",
    20: "debug",
    30: "info",
    40: "warn",
    50: "error",
    60: "fatal"
  }
};
ve.stdSerializers = U2;
ve.stdTimeFunctions = Object.assign({}, { nullTime: w0, epochTime: T0, unixTime: W2, isoTime: q2 });
function Cn(n, t, e, r) {
  const s = Object.getPrototypeOf(t);
  t[e] = t.levelVal > t.levels.values[e] ? _r : s[e] ? s[e] : mr[e] || mr[r] || _r, G2(n, t, e);
}
function G2(n, t, e) {
  !n.transmit && t[e] === _r || (t[e] = function(r) {
    return function() {
      const i = n.timestamp(), o = new Array(arguments.length), a = Object.getPrototypeOf && Object.getPrototypeOf(this) === mr ? mr : this;
      for (var l = 0; l < o.length; l++)
        o[l] = arguments[l];
      if (n.serialize && !n.asObject && Qs(o, this._serialize, this.serializers, this._stdErrSerialize), n.asObject ? r.call(a, j2(this, e, o, i)) : r.apply(a, o), n.transmit) {
        const c = n.transmit.level || t.level, u = ve.levels.values[c], f = ve.levels.values[e];
        if (f < u)
          return;
        V2(this, {
          ts: i,
          methodLevel: e,
          methodValue: f,
          transmitLevel: c,
          transmitValue: ve.levels.values[n.transmit.level || t.level],
          send: n.transmit.send,
          val: t.levelVal
        }, o);
      }
    };
  }(t[e]));
}
function j2(n, t, e, r) {
  n._serialize && Qs(e, n._serialize, n.serializers, n._stdErrSerialize);
  const s = e.slice();
  let i = s[0];
  const o = {};
  r && (o.time = r), o.level = ve.levels.values[t];
  let a = (n._childLevel | 0) + 1;
  if (a < 1 && (a = 1), i !== null && typeof i == "object") {
    for (; a-- && typeof s[0] == "object"; )
      Object.assign(o, s.shift());
    i = s.length ? N1(s.shift(), s) : void 0;
  } else
    typeof i == "string" && (i = N1(s.shift(), s));
  return i !== void 0 && (o.msg = i), o;
}
function Qs(n, t, e, r) {
  for (const s in n)
    if (r && n[s] instanceof Error)
      n[s] = ve.stdSerializers.err(n[s]);
    else if (typeof n[s] == "object" && !Array.isArray(n[s]))
      for (const i in n[s])
        t && t.indexOf(i) > -1 && i in e && (n[s][i] = e[i](n[s][i]));
}
function En(n, t, e) {
  return function() {
    const r = new Array(1 + arguments.length);
    r[0] = t;
    for (var s = 1; s < r.length; s++)
      r[s] = arguments[s - 1];
    return n[e].apply(this, r);
  };
}
function V2(n, t, e) {
  const r = t.send, s = t.ts, i = t.methodLevel, o = t.methodValue, a = t.val, l = n._logEvent.bindings;
  Qs(
    e,
    n._serialize || Object.keys(n.serializers),
    n.serializers,
    n._stdErrSerialize === void 0 ? !0 : n._stdErrSerialize
  ), n._logEvent.ts = s, n._logEvent.messages = e.filter(function(c) {
    return l.indexOf(c) === -1;
  }), n._logEvent.level.label = i, n._logEvent.level.value = o, r(i, n._logEvent, a), n._logEvent = ro(l);
}
function ro(n) {
  return {
    ts: 0,
    messages: [],
    bindings: n || [],
    level: { label: "", value: 0 }
  };
}
function z2(n) {
  const t = {
    type: n.constructor.name,
    msg: n.message,
    stack: n.stack
  };
  for (const e in n)
    t[e] === void 0 && (t[e] = n[e]);
  return t;
}
function Z2(n) {
  return typeof n.timestamp == "function" ? n.timestamp : n.timestamp === !1 ? w0 : T0;
}
function es() {
  return {};
}
function Mi(n) {
  return n;
}
function _r() {
}
function w0() {
  return !1;
}
function T0() {
  return Date.now();
}
function W2() {
  return Math.round(Date.now() / 1e3);
}
function q2() {
  return new Date(Date.now()).toISOString();
}
function K2() {
  function n(t) {
    return typeof t < "u" && t;
  }
  try {
    return typeof globalThis < "u" || Object.defineProperty(Object.prototype, "globalThis", {
      get: function() {
        return delete Object.prototype.globalThis, this.globalThis = this;
      },
      configurable: !0
    }), globalThis;
  } catch {
    return n(self) || n(window) || n(this) || {};
  }
}
const Y2 = B2({
  level: "warn"
}), I1 = ["log", "trace", "debug", "info", "warn", "error"];
function X2(n, t) {
  n[t] = (console[t] || console.log).bind(console);
}
function Q2(n, t, e) {
  n[t] = (console[t] || console.log).bind(console, e[0], e[1]);
}
function J2(n) {
  I1.forEach((e) => X2(n, e));
  const t = n.child;
  return n.child = function(e) {
    const r = t.call(n, e);
    return I1.forEach((s) => Q2(r, s, ["%c" + e.name || "", "color: #00f"])), r;
  }, n;
}
let kr = J2(Y2);
var $t = Object.freeze({}), z = Array.isArray;
function G(n) {
  return n == null;
}
function L(n) {
  return n != null;
}
function _t(n) {
  return n === !0;
}
function tf(n) {
  return n === !1;
}
function $e(n) {
  return typeof n == "string" || typeof n == "number" || typeof n == "symbol" || typeof n == "boolean";
}
function ht(n) {
  return typeof n == "function";
}
function St(n) {
  return n !== null && typeof n == "object";
}
var Js = Object.prototype.toString;
function Or(n) {
  return Js.call(n).slice(8, -1);
}
function Ut(n) {
  return Js.call(n) === "[object Object]";
}
function A0(n) {
  return Js.call(n) === "[object RegExp]";
}
function S0(n) {
  var t = parseFloat(String(n));
  return t >= 0 && Math.floor(t) === t && isFinite(n);
}
function so(n) {
  return L(n) && typeof n.then == "function" && typeof n.catch == "function";
}
function ef(n) {
  return n == null ? "" : Array.isArray(n) || Ut(n) && n.toString === Js ? JSON.stringify(n, null, 2) : String(n);
}
function Lr(n) {
  var t = parseFloat(n);
  return isNaN(t) ? n : t;
}
function Qt(n, t) {
  for (var e = /* @__PURE__ */ Object.create(null), r = n.split(","), s = 0; s < r.length; s++)
    e[r[s]] = !0;
  return t ? function(i) {
    return e[i.toLowerCase()];
  } : function(i) {
    return e[i];
  };
}
var nf = Qt("slot,component", !0), R0 = Qt("key,ref,slot,slot-scope,is");
function Ke(n, t) {
  var e = n.length;
  if (e) {
    if (t === n[e - 1]) {
      n.length = e - 1;
      return;
    }
    var r = n.indexOf(t);
    if (r > -1)
      return n.splice(r, 1);
  }
}
var rf = Object.prototype.hasOwnProperty;
function At(n, t) {
  return rf.call(n, t);
}
function hn(n) {
  var t = /* @__PURE__ */ Object.create(null);
  return function(r) {
    var s = t[r];
    return s || (t[r] = n(r));
  };
}
var sf = /-(\w)/g, an = hn(function(n) {
  return n.replace(sf, function(t, e) {
    return e ? e.toUpperCase() : "";
  });
}), k0 = hn(function(n) {
  return n.charAt(0).toUpperCase() + n.slice(1);
}), of = /\B([A-Z])/g, fn = hn(function(n) {
  return n.replace(of, "-$1").toLowerCase();
});
function af(n, t) {
  function e(r) {
    var s = arguments.length;
    return s ? s > 1 ? n.apply(t, arguments) : n.call(t, r) : n.call(t);
  }
  return e._length = n.length, e;
}
function lf(n, t) {
  return n.bind(t);
}
var O0 = Function.prototype.bind ? lf : af;
function io(n, t) {
  t = t || 0;
  for (var e = n.length - t, r = new Array(e); e--; )
    r[e] = n[e + t];
  return r;
}
function ct(n, t) {
  for (var e in t)
    n[e] = t[e];
  return n;
}
function N0(n) {
  for (var t = {}, e = 0; e < n.length; e++)
    n[e] && ct(t, n[e]);
  return t;
}
function Ct(n, t, e) {
}
var ns = function(n, t, e) {
  return !1;
}, I0 = function(n) {
  return n;
};
function ln(n, t) {
  if (n === t)
    return !0;
  var e = St(n), r = St(t);
  if (e && r)
    try {
      var s = Array.isArray(n), i = Array.isArray(t);
      if (s && i)
        return n.length === t.length && n.every(function(l, c) {
          return ln(l, t[c]);
        });
      if (n instanceof Date && t instanceof Date)
        return n.getTime() === t.getTime();
      if (!s && !i) {
        var o = Object.keys(n), a = Object.keys(t);
        return o.length === a.length && o.every(function(l) {
          return ln(n[l], t[l]);
        });
      } else
        return !1;
    } catch {
      return !1;
    }
  else
    return !e && !r ? String(n) === String(t) : !1;
}
function M0(n, t) {
  for (var e = 0; e < n.length; e++)
    if (ln(n[e], t))
      return e;
  return -1;
}
function ws(n) {
  var t = !1;
  return function() {
    t || (t = !0, n.apply(this, arguments));
  };
}
function cf(n, t) {
  return n === t ? n === 0 && 1 / n !== 1 / t : n === n || t === t;
}
var M1 = "data-server-rendered", ti = ["component", "directive", "filter"], P0 = [
  "beforeCreate",
  "created",
  "beforeMount",
  "mounted",
  "beforeUpdate",
  "updated",
  "beforeDestroy",
  "destroyed",
  "activated",
  "deactivated",
  "errorCaptured",
  "serverPrefetch",
  "renderTracked",
  "renderTriggered"
], nt = {
  optionMergeStrategies: /* @__PURE__ */ Object.create(null),
  silent: !1,
  productionTip: process.env.NODE_ENV !== "production",
  devtools: process.env.NODE_ENV !== "production",
  performance: !1,
  errorHandler: null,
  warnHandler: null,
  ignoredElements: [],
  keyCodes: /* @__PURE__ */ Object.create(null),
  isReservedTag: ns,
  isReservedAttr: ns,
  isUnknownElement: ns,
  getTagNamespace: Ct,
  parsePlatformTagName: I0,
  mustUseProp: ns,
  async: !0,
  _lifecycleHooks: P0
}, $0 = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/;
function Vo(n) {
  var t = (n + "").charCodeAt(0);
  return t === 36 || t === 95;
}
function Ge(n, t, e, r) {
  Object.defineProperty(n, t, {
    value: e,
    enumerable: !!r,
    writable: !0,
    configurable: !0
  });
}
var uf = new RegExp("[^".concat($0.source, ".$_\\d]"));
function hf(n) {
  if (!uf.test(n)) {
    var t = n.split(".");
    return function(e) {
      for (var r = 0; r < t.length; r++) {
        if (!e)
          return;
        e = e[t[r]];
      }
      return e;
    };
  }
}
var ff = "__proto__" in {}, zt = typeof window < "u", ie = zt && window.navigator.userAgent.toLowerCase(), Gn = ie && /msie|trident/.test(ie), jn = ie && ie.indexOf("msie 9.0") > 0, D0 = ie && ie.indexOf("edge/") > 0;
ie && ie.indexOf("android") > 0;
var df = ie && /iphone|ipad|ipod|ios/.test(ie), P1 = ie && ie.match(/firefox\/(\d+)/), oo = {}.watch, F0 = !1;
if (zt)
  try {
    var $1 = {};
    Object.defineProperty($1, "passive", {
      get: function() {
        F0 = !0;
      }
    }), window.addEventListener("test-passive", null, $1);
  } catch {
  }
var rs, Nr = function() {
  return rs === void 0 && (!zt && typeof global < "u" ? rs = global.process && global.process.env.VUE_ENV === "server" : rs = !1), rs;
}, Ts = zt && window.__VUE_DEVTOOLS_GLOBAL_HOOK__;
function en(n) {
  return typeof n == "function" && /native code/.test(n.toString());
}
var Ir = typeof Symbol < "u" && en(Symbol) && typeof Reflect < "u" && en(Reflect.ownKeys), vr;
typeof Set < "u" && en(Set) ? vr = Set : vr = function() {
  function n() {
    this.set = /* @__PURE__ */ Object.create(null);
  }
  return n.prototype.has = function(t) {
    return this.set[t] === !0;
  }, n.prototype.add = function(t) {
    this.set[t] = !0;
  }, n.prototype.clear = function() {
    this.set = /* @__PURE__ */ Object.create(null);
  }, n;
}();
var In = null;
function Ve(n) {
  n === void 0 && (n = null), n || In && In._scope.off(), In = n, n && n._scope.on();
}
var Vt = function() {
  function n(t, e, r, s, i, o, a, l) {
    this.tag = t, this.data = e, this.children = r, this.text = s, this.elm = i, this.ns = void 0, this.context = o, this.fnContext = void 0, this.fnOptions = void 0, this.fnScopeId = void 0, this.key = e && e.key, this.componentOptions = a, this.componentInstance = void 0, this.parent = void 0, this.raw = !1, this.isStatic = !1, this.isRootInsert = !0, this.isComment = !1, this.isCloned = !1, this.isOnce = !1, this.asyncFactory = l, this.asyncMeta = void 0, this.isAsyncPlaceholder = !1;
  }
  return Object.defineProperty(n.prototype, "child", {
    get: function() {
      return this.componentInstance;
    },
    enumerable: !1,
    configurable: !0
  }), n;
}(), nn = function(n) {
  n === void 0 && (n = "");
  var t = new Vt();
  return t.text = n, t.isComment = !0, t;
};
function Sn(n) {
  return new Vt(void 0, void 0, void 0, String(n));
}
function ao(n) {
  var t = new Vt(
    n.tag,
    n.data,
    n.children && n.children.slice(),
    n.text,
    n.elm,
    n.context,
    n.componentOptions,
    n.asyncFactory
  );
  return t.ns = n.ns, t.isStatic = n.isStatic, t.key = n.key, t.isComment = n.isComment, t.fnContext = n.fnContext, t.fnOptions = n.fnOptions, t.fnScopeId = n.fnScopeId, t.asyncMeta = n.asyncMeta, t.isCloned = !0, t;
}
var As = function() {
  return As = Object.assign || function(t) {
    for (var e, r = 1, s = arguments.length; r < s; r++) {
      e = arguments[r];
      for (var i in e)
        Object.prototype.hasOwnProperty.call(e, i) && (t[i] = e[i]);
    }
    return t;
  }, As.apply(this, arguments);
}, pf = 0, _s = [], gf = function() {
  for (var n = 0; n < _s.length; n++) {
    var t = _s[n];
    t.subs = t.subs.filter(function(e) {
      return e;
    }), t._pending = !1;
  }
  _s.length = 0;
}, he = function() {
  function n() {
    this._pending = !1, this.id = pf++, this.subs = [];
  }
  return n.prototype.addSub = function(t) {
    this.subs.push(t);
  }, n.prototype.removeSub = function(t) {
    this.subs[this.subs.indexOf(t)] = null, this._pending || (this._pending = !0, _s.push(this));
  }, n.prototype.depend = function(t) {
    n.target && (n.target.addDep(this), process.env.NODE_ENV !== "production" && t && n.target.onTrack && n.target.onTrack(As({ effect: n.target }, t)));
  }, n.prototype.notify = function(t) {
    var e = this.subs.filter(function(o) {
      return o;
    });
    process.env.NODE_ENV !== "production" && !nt.async && e.sort(function(o, a) {
      return o.id - a.id;
    });
    for (var r = 0, s = e.length; r < s; r++) {
      var i = e[r];
      process.env.NODE_ENV !== "production" && t && i.onTrigger && i.onTrigger(As({ effect: e[r] }, t)), i.update();
    }
  }, n;
}();
he.target = null;
var Ls = [];
function Vn(n) {
  Ls.push(n), he.target = n;
}
function zn() {
  Ls.pop(), he.target = Ls[Ls.length - 1];
}
var B0 = Array.prototype, Ss = Object.create(B0), xf = [
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse"
];
xf.forEach(function(n) {
  var t = B0[n];
  Ge(Ss, n, function() {
    for (var r = [], s = 0; s < arguments.length; s++)
      r[s] = arguments[s];
    var i = t.apply(this, r), o = this.__ob__, a;
    switch (n) {
      case "push":
      case "unshift":
        a = r;
        break;
      case "splice":
        a = r.slice(2);
        break;
    }
    return a && o.observeArray(a), process.env.NODE_ENV !== "production" ? o.dep.notify({
      type: "array mutation",
      target: this,
      key: n
    }) : o.dep.notify(), i;
  });
});
var D1 = Object.getOwnPropertyNames(Ss), U0 = {}, zo = !0;
function ze(n) {
  zo = n;
}
var mf = {
  notify: Ct,
  depend: Ct,
  addSub: Ct,
  removeSub: Ct
}, F1 = function() {
  function n(t, e, r) {
    if (e === void 0 && (e = !1), r === void 0 && (r = !1), this.value = t, this.shallow = e, this.mock = r, this.dep = r ? mf : new he(), this.vmCount = 0, Ge(t, "__ob__", this), z(t)) {
      if (!r)
        if (ff)
          t.__proto__ = Ss;
        else
          for (var s = 0, i = D1.length; s < i; s++) {
            var o = D1[s];
            Ge(t, o, Ss[o]);
          }
      e || this.observeArray(t);
    } else
      for (var a = Object.keys(t), s = 0; s < a.length; s++) {
        var o = a[s];
        fe(t, o, U0, void 0, e, r);
      }
  }
  return n.prototype.observeArray = function(t) {
    for (var e = 0, r = t.length; e < r; e++)
      Ie(t[e], !1, this.mock);
  }, n;
}();
function Ie(n, t, e) {
  if (n && At(n, "__ob__") && n.__ob__ instanceof F1)
    return n.__ob__;
  if (zo && (e || !Nr()) && (z(n) || Ut(n)) && Object.isExtensible(n) && !n.__v_skip && !ye(n) && !(n instanceof Vt))
    return new F1(n, t, e);
}
function fe(n, t, e, r, s, i) {
  var o = new he(), a = Object.getOwnPropertyDescriptor(n, t);
  if (!(a && a.configurable === !1)) {
    var l = a && a.get, c = a && a.set;
    (!l || c) && (e === U0 || arguments.length === 2) && (e = n[t]);
    var u = !s && Ie(e, !1, i);
    return Object.defineProperty(n, t, {
      enumerable: !0,
      configurable: !0,
      get: function() {
        var d = l ? l.call(n) : e;
        return he.target && (process.env.NODE_ENV !== "production" ? o.depend({
          target: n,
          type: "get",
          key: t
        }) : o.depend(), u && (u.dep.depend(), z(d) && G0(d))), ye(d) && !s ? d.value : d;
      },
      set: function(d) {
        var p = l ? l.call(n) : e;
        if (cf(p, d)) {
          if (process.env.NODE_ENV !== "production" && r && r(), c)
            c.call(n, d);
          else {
            if (l)
              return;
            if (!s && ye(p) && !ye(d)) {
              p.value = d;
              return;
            } else
              e = d;
          }
          u = !s && Ie(d, !1, i), process.env.NODE_ENV !== "production" ? o.notify({
            type: "set",
            target: n,
            key: t,
            newValue: d,
            oldValue: p
          }) : o.notify();
        }
      }
    }), o;
  }
}
function Zo(n, t, e) {
  if (process.env.NODE_ENV !== "production" && (G(n) || $e(n)) && T("Cannot set reactive property on undefined, null, or primitive value: ".concat(n)), Wo(n)) {
    process.env.NODE_ENV !== "production" && T('Set operation on key "'.concat(t, '" failed: target is readonly.'));
    return;
  }
  var r = n.__ob__;
  return z(n) && S0(t) ? (n.length = Math.max(n.length, t), n.splice(t, 1, e), r && !r.shallow && r.mock && Ie(e, !1, !0), e) : t in n && !(t in Object.prototype) ? (n[t] = e, e) : n._isVue || r && r.vmCount ? (process.env.NODE_ENV !== "production" && T("Avoid adding reactive properties to a Vue instance or its root $data at runtime - declare it upfront in the data option."), e) : r ? (fe(r.value, t, e, void 0, r.shallow, r.mock), process.env.NODE_ENV !== "production" ? r.dep.notify({
    type: "add",
    target: n,
    key: t,
    newValue: e,
    oldValue: void 0
  }) : r.dep.notify(), e) : (n[t] = e, e);
}
function H0(n, t) {
  if (process.env.NODE_ENV !== "production" && (G(n) || $e(n)) && T("Cannot delete reactive property on undefined, null, or primitive value: ".concat(n)), z(n) && S0(t)) {
    n.splice(t, 1);
    return;
  }
  var e = n.__ob__;
  if (n._isVue || e && e.vmCount) {
    process.env.NODE_ENV !== "production" && T("Avoid deleting properties on a Vue instance or its root $data - just set it to null.");
    return;
  }
  if (Wo(n)) {
    process.env.NODE_ENV !== "production" && T('Delete operation on key "'.concat(t, '" failed: target is readonly.'));
    return;
  }
  At(n, t) && (delete n[t], e && (process.env.NODE_ENV !== "production" ? e.dep.notify({
    type: "delete",
    target: n,
    key: t
  }) : e.dep.notify()));
}
function G0(n) {
  for (var t = void 0, e = 0, r = n.length; e < r; e++)
    t = n[e], t && t.__ob__ && t.__ob__.dep.depend(), z(t) && G0(t);
}
function j0(n) {
  return _f(n, !0), Ge(n, "__v_isShallow", !0), n;
}
function _f(n, t) {
  if (!Wo(n)) {
    if (process.env.NODE_ENV !== "production") {
      z(n) && T("Avoid using Array as root value for ".concat(t ? "shallowReactive()" : "reactive()", " as it cannot be tracked in watch() or watchEffect(). Use ").concat(t ? "shallowRef()" : "ref()", " instead. This is a Vue-2-only limitation."));
      var e = n && n.__ob__;
      e && e.shallow !== t && T("Target is already a ".concat(e.shallow ? "" : "non-", "shallow reactive object, and cannot be converted to ").concat(t ? "" : "non-", "shallow."));
    }
    var r = Ie(n, t, Nr());
    process.env.NODE_ENV !== "production" && !r && ((n == null || $e(n)) && T("value cannot be made reactive: ".concat(String(n))), Lf(n) && T("Vue 2 does not support reactive collection types such as Map or Set."));
  }
}
function Wo(n) {
  return !!(n && n.__v_isReadonly);
}
function Lf(n) {
  var t = Or(n);
  return t === "Map" || t === "WeakMap" || t === "Set" || t === "WeakSet";
}
function ye(n) {
  return !!(n && n.__v_isRef === !0);
}
function lo(n, t, e) {
  Object.defineProperty(n, e, {
    enumerable: !0,
    configurable: !0,
    get: function() {
      var r = t[e];
      if (ye(r))
        return r.value;
      var s = r && r.__ob__;
      return s && s.dep.depend(), r;
    },
    set: function(r) {
      var s = t[e];
      ye(s) && !ye(r) ? s.value = r : t[e] = r;
    }
  });
}
var qt, vf = function() {
  function n(t) {
    t === void 0 && (t = !1), this.detached = t, this.active = !0, this.effects = [], this.cleanups = [], this.parent = qt, !t && qt && (this.index = (qt.scopes || (qt.scopes = [])).push(this) - 1);
  }
  return n.prototype.run = function(t) {
    if (this.active) {
      var e = qt;
      try {
        return qt = this, t();
      } finally {
        qt = e;
      }
    } else
      process.env.NODE_ENV !== "production" && T("cannot run an inactive effect scope.");
  }, n.prototype.on = function() {
    qt = this;
  }, n.prototype.off = function() {
    qt = this.parent;
  }, n.prototype.stop = function(t) {
    if (this.active) {
      var e = void 0, r = void 0;
      for (e = 0, r = this.effects.length; e < r; e++)
        this.effects[e].teardown();
      for (e = 0, r = this.cleanups.length; e < r; e++)
        this.cleanups[e]();
      if (this.scopes)
        for (e = 0, r = this.scopes.length; e < r; e++)
          this.scopes[e].stop(!0);
      if (!this.detached && this.parent && !t) {
        var s = this.parent.scopes.pop();
        s && s !== this && (this.parent.scopes[this.index] = s, s.index = this.index);
      }
      this.parent = void 0, this.active = !1;
    }
  }, n;
}();
function yf(n, t) {
  t === void 0 && (t = qt), t && t.active && t.effects.push(n);
}
function Cf(n) {
  var t = n._provided, e = n.$parent && n.$parent._provided;
  return e === t ? n._provided = Object.create(e) : t;
}
var B1 = hn(function(n) {
  var t = n.charAt(0) === "&";
  n = t ? n.slice(1) : n;
  var e = n.charAt(0) === "~";
  n = e ? n.slice(1) : n;
  var r = n.charAt(0) === "!";
  return n = r ? n.slice(1) : n, {
    name: n,
    once: e,
    capture: r,
    passive: t
  };
});
function co(n, t) {
  function e() {
    var r = e.fns;
    if (z(r))
      for (var s = r.slice(), i = 0; i < s.length; i++)
        We(s[i], null, arguments, t, "v-on handler");
    else
      return We(r, null, arguments, t, "v-on handler");
  }
  return e.fns = n, e;
}
function V0(n, t, e, r, s, i) {
  var o, a, l, c;
  for (o in n)
    a = n[o], l = t[o], c = B1(o), G(a) ? process.env.NODE_ENV !== "production" && T('Invalid handler for event "'.concat(c.name, '": got ') + String(a), i) : G(l) ? (G(a.fns) && (a = n[o] = co(a, i)), _t(c.once) && (a = n[o] = s(c.name, a, c.capture)), e(c.name, a, c.capture, c.passive, c.params)) : a !== l && (l.fns = a, n[o] = l);
  for (o in t)
    G(n[o]) && (c = B1(o), r(c.name, t[o], c.capture));
}
function Fe(n, t, e) {
  n instanceof Vt && (n = n.data.hook || (n.data.hook = {}));
  var r, s = n[t];
  function i() {
    e.apply(this, arguments), Ke(r.fns, i);
  }
  G(s) ? r = co([i]) : L(s.fns) && _t(s.merged) ? (r = s, r.fns.push(i)) : r = co([s, i]), r.merged = !0, n[t] = r;
}
function Ef(n, t, e) {
  var r = t.options.props;
  if (!G(r)) {
    var s = {}, i = n.attrs, o = n.props;
    if (L(i) || L(o))
      for (var a in r) {
        var l = fn(a);
        if (process.env.NODE_ENV !== "production") {
          var c = a.toLowerCase();
          a !== c && i && At(i, c) && ra('Prop "'.concat(c, '" is passed to component ') + "".concat(tn(
            e || t
          ), ", but the declared prop name is") + ' "'.concat(a, '". ') + "Note that HTML attributes are case-insensitive and camelCased props need to use their kebab-case equivalents when using in-DOM " + 'templates. You should probably use "'.concat(l, '" instead of "').concat(a, '".'));
        }
        U1(s, o, a, l, !0) || U1(s, i, a, l, !1);
      }
    return s;
  }
}
function U1(n, t, e, r, s) {
  if (L(t)) {
    if (At(t, e))
      return n[e] = t[e], s || delete t[e], !0;
    if (At(t, r))
      return n[e] = t[r], s || delete t[r], !0;
  }
  return !1;
}
function bf(n) {
  for (var t = 0; t < n.length; t++)
    if (z(n[t]))
      return Array.prototype.concat.apply([], n);
  return n;
}
function qo(n) {
  return $e(n) ? [Sn(n)] : z(n) ? z0(n) : void 0;
}
function er(n) {
  return L(n) && L(n.text) && tf(n.isComment);
}
function z0(n, t) {
  var e = [], r, s, i, o;
  for (r = 0; r < n.length; r++)
    s = n[r], !(G(s) || typeof s == "boolean") && (i = e.length - 1, o = e[i], z(s) ? s.length > 0 && (s = z0(s, "".concat(t || "", "_").concat(r)), er(s[0]) && er(o) && (e[i] = Sn(o.text + s[0].text), s.shift()), e.push.apply(e, s)) : $e(s) ? er(o) ? e[i] = Sn(o.text + s) : s !== "" && e.push(Sn(s)) : er(s) && er(o) ? e[i] = Sn(o.text + s.text) : (_t(n._isVList) && L(s.tag) && G(s.key) && L(t) && (s.key = "__vlist".concat(t, "_").concat(r, "__")), e.push(s)));
  return e;
}
function wf(n, t) {
  var e = null, r, s, i, o;
  if (z(n) || typeof n == "string")
    for (e = new Array(n.length), r = 0, s = n.length; r < s; r++)
      e[r] = t(n[r], r);
  else if (typeof n == "number")
    for (e = new Array(n), r = 0; r < n; r++)
      e[r] = t(r + 1, r);
  else if (St(n))
    if (Ir && n[Symbol.iterator]) {
      e = [];
      for (var a = n[Symbol.iterator](), l = a.next(); !l.done; )
        e.push(t(l.value, e.length)), l = a.next();
    } else
      for (i = Object.keys(n), e = new Array(i.length), r = 0, s = i.length; r < s; r++)
        o = i[r], e[r] = t(n[o], o, r);
  return L(e) || (e = []), e._isVList = !0, e;
}
function Tf(n, t, e, r) {
  var s = this.$scopedSlots[n], i;
  s ? (e = e || {}, r && (process.env.NODE_ENV !== "production" && !St(r) && T("slot v-bind without argument expects an Object", this), e = ct(ct({}, r), e)), i = s(e) || (ht(t) ? t() : t)) : i = this.$slots[n] || (ht(t) ? t() : t);
  var o = e && e.slot;
  return o ? this.$createElement("template", { slot: o }, i) : i;
}
function Af(n) {
  return Is(this.$options, "filters", n, !0) || I0;
}
function H1(n, t) {
  return z(n) ? n.indexOf(t) === -1 : n !== t;
}
function Sf(n, t, e, r, s) {
  var i = nt.keyCodes[t] || e;
  return s && r && !nt.keyCodes[t] ? H1(s, r) : i ? H1(i, n) : r ? fn(r) !== t : n === void 0;
}
function Rf(n, t, e, r, s) {
  if (e)
    if (!St(e))
      process.env.NODE_ENV !== "production" && T("v-bind without argument expects an Object or Array value", this);
    else {
      z(e) && (e = N0(e));
      var i = void 0, o = function(l) {
        if (l === "class" || l === "style" || R0(l))
          i = n;
        else {
          var c = n.attrs && n.attrs.type;
          i = r || nt.mustUseProp(t, c, l) ? n.domProps || (n.domProps = {}) : n.attrs || (n.attrs = {});
        }
        var u = an(l), f = fn(l);
        if (!(u in i) && !(f in i) && (i[l] = e[l], s)) {
          var d = n.on || (n.on = {});
          d["update:".concat(l)] = function(p) {
            e[l] = p;
          };
        }
      };
      for (var a in e)
        o(a);
    }
  return n;
}
function kf(n, t) {
  var e = this._staticTrees || (this._staticTrees = []), r = e[n];
  return r && !t || (r = e[n] = this.$options.staticRenderFns[n].call(
    this._renderProxy,
    this._c,
    this
  ), Z0(r, "__static__".concat(n), !1)), r;
}
function Of(n, t, e) {
  return Z0(n, "__once__".concat(t).concat(e ? "_".concat(e) : ""), !0), n;
}
function Z0(n, t, e) {
  if (z(n))
    for (var r = 0; r < n.length; r++)
      n[r] && typeof n[r] != "string" && G1(n[r], "".concat(t, "_").concat(r), e);
  else
    G1(n, t, e);
}
function G1(n, t, e) {
  n.isStatic = !0, n.key = t, n.isOnce = e;
}
function Nf(n, t) {
  if (t)
    if (!Ut(t))
      process.env.NODE_ENV !== "production" && T("v-on without argument expects an Object value", this);
    else {
      var e = n.on = n.on ? ct({}, n.on) : {};
      for (var r in t) {
        var s = e[r], i = t[r];
        e[r] = s ? [].concat(s, i) : i;
      }
    }
  return n;
}
function W0(n, t, e, r) {
  t = t || { $stable: !e };
  for (var s = 0; s < n.length; s++) {
    var i = n[s];
    z(i) ? W0(i, t, e) : i && (i.proxy && (i.fn.proxy = !0), t[i.key] = i.fn);
  }
  return r && (t.$key = r), t;
}
function If(n, t) {
  for (var e = 0; e < t.length; e += 2) {
    var r = t[e];
    typeof r == "string" && r ? n[t[e]] = t[e + 1] : process.env.NODE_ENV !== "production" && r !== "" && r !== null && T("Invalid value for dynamic directive argument (expected string or null): ".concat(r), this);
  }
  return n;
}
function Mf(n, t) {
  return typeof n == "string" ? t + n : n;
}
function q0(n) {
  n._o = Of, n._n = Lr, n._s = ef, n._l = wf, n._t = Tf, n._q = ln, n._i = M0, n._m = kf, n._f = Af, n._k = Sf, n._b = Rf, n._v = Sn, n._e = nn, n._u = W0, n._g = Nf, n._d = If, n._p = Mf;
}
function Ko(n, t) {
  if (!n || !n.length)
    return {};
  for (var e = {}, r = 0, s = n.length; r < s; r++) {
    var i = n[r], o = i.data;
    if (o && o.attrs && o.attrs.slot && delete o.attrs.slot, (i.context === t || i.fnContext === t) && o && o.slot != null) {
      var a = o.slot, l = e[a] || (e[a] = []);
      i.tag === "template" ? l.push.apply(l, i.children || []) : l.push(i);
    } else
      (e.default || (e.default = [])).push(i);
  }
  for (var c in e)
    e[c].every(Pf) && delete e[c];
  return e;
}
function Pf(n) {
  return n.isComment && !n.asyncFactory || n.text === " ";
}
function yr(n) {
  return n.isComment && n.asyncFactory;
}
function ur(n, t, e, r) {
  var s, i = Object.keys(e).length > 0, o = t ? !!t.$stable : !i, a = t && t.$key;
  if (!t)
    s = {};
  else {
    if (t._normalized)
      return t._normalized;
    if (o && r && r !== $t && a === r.$key && !i && !r.$hasNormal)
      return r;
    s = {};
    for (var l in t)
      t[l] && l[0] !== "$" && (s[l] = $f(n, e, l, t[l]));
  }
  for (var c in e)
    c in s || (s[c] = Df(e, c));
  return t && Object.isExtensible(t) && (t._normalized = s), Ge(s, "$stable", o), Ge(s, "$key", a), Ge(s, "$hasNormal", i), s;
}
function $f(n, t, e, r) {
  var s = function() {
    var i = In;
    Ve(n);
    var o = arguments.length ? r.apply(null, arguments) : r({});
    o = o && typeof o == "object" && !z(o) ? [o] : qo(o);
    var a = o && o[0];
    return Ve(i), o && (!a || o.length === 1 && a.isComment && !yr(a)) ? void 0 : o;
  };
  return r.proxy && Object.defineProperty(t, e, {
    get: s,
    enumerable: !0,
    configurable: !0
  }), s;
}
function Df(n, t) {
  return function() {
    return n[t];
  };
}
function Ff(n) {
  var t = n.$options, e = t.setup;
  if (e) {
    var r = n._setupContext = Bf(n);
    Ve(n), Vn();
    var s = We(e, null, [n._props || j0({}), r], n, "setup");
    if (zn(), Ve(), ht(s))
      t.render = s;
    else if (St(s))
      if (process.env.NODE_ENV !== "production" && s instanceof Vt && T("setup() should not return VNodes directly - return a render function instead."), n._setupState = s, s.__sfc) {
        var o = n._setupProxy = {};
        for (var i in s)
          i !== "__sfc" && lo(o, s, i);
      } else
        for (var i in s)
          Vo(i) ? process.env.NODE_ENV !== "production" && T("Avoid using variables that start with _ or $ in setup().") : lo(n, s, i);
    else
      process.env.NODE_ENV !== "production" && s !== void 0 && T("setup() should return an object. Received: ".concat(s === null ? "null" : typeof s));
  }
}
function Bf(n) {
  var t = !1;
  return {
    get attrs() {
      if (!n._attrsProxy) {
        var e = n._attrsProxy = {};
        Ge(e, "_v_attr_proxy", !0), Rs(e, n.$attrs, $t, n, "$attrs");
      }
      return n._attrsProxy;
    },
    get listeners() {
      if (!n._listenersProxy) {
        var e = n._listenersProxy = {};
        Rs(e, n.$listeners, $t, n, "$listeners");
      }
      return n._listenersProxy;
    },
    get slots() {
      return Hf(n);
    },
    emit: O0(n.$emit, n),
    expose: function(e) {
      process.env.NODE_ENV !== "production" && (t && T("expose() should be called only once per setup().", n), t = !0), e && Object.keys(e).forEach(function(r) {
        return lo(n, e, r);
      });
    }
  };
}
function Rs(n, t, e, r, s) {
  var i = !1;
  for (var o in t)
    o in n ? t[o] !== e[o] && (i = !0) : (i = !0, Uf(n, o, r, s));
  for (var o in n)
    o in t || (i = !0, delete n[o]);
  return i;
}
function Uf(n, t, e, r) {
  Object.defineProperty(n, t, {
    enumerable: !0,
    configurable: !0,
    get: function() {
      return e[r][t];
    }
  });
}
function Hf(n) {
  return n._slotsProxy || K0(n._slotsProxy = {}, n.$scopedSlots), n._slotsProxy;
}
function K0(n, t) {
  for (var e in t)
    n[e] = t[e];
  for (var e in n)
    e in t || delete n[e];
}
function Gf(n) {
  n._vnode = null, n._staticTrees = null;
  var t = n.$options, e = n.$vnode = t._parentVnode, r = e && e.context;
  n.$slots = Ko(t._renderChildren, r), n.$scopedSlots = e ? ur(n.$parent, e.data.scopedSlots, n.$slots) : $t, n._c = function(i, o, a, l) {
    return ks(n, i, o, a, l, !1);
  }, n.$createElement = function(i, o, a, l) {
    return ks(n, i, o, a, l, !0);
  };
  var s = e && e.data;
  process.env.NODE_ENV !== "production" ? (fe(n, "$attrs", s && s.attrs || $t, function() {
    !Er && T("$attrs is readonly.", n);
  }, !0), fe(n, "$listeners", t._parentListeners || $t, function() {
    !Er && T("$listeners is readonly.", n);
  }, !0)) : (fe(n, "$attrs", s && s.attrs || $t, null, !0), fe(n, "$listeners", t._parentListeners || $t, null, !0));
}
var uo = null;
function jf(n) {
  q0(n.prototype), n.prototype.$nextTick = function(t) {
    return Yo(t, this);
  }, n.prototype._render = function() {
    var t = this, e = t.$options, r = e.render, s = e._parentVnode;
    s && t._isMounted && (t.$scopedSlots = ur(t.$parent, s.data.scopedSlots, t.$slots, t.$scopedSlots), t._slotsProxy && K0(t._slotsProxy, t.$scopedSlots)), t.$vnode = s;
    var i;
    try {
      Ve(t), uo = t, i = r.call(t._renderProxy, t.$createElement);
    } catch (o) {
      if (Ze(o, t, "render"), process.env.NODE_ENV !== "production" && t.$options.renderError)
        try {
          i = t.$options.renderError.call(t._renderProxy, t.$createElement, o);
        } catch (a) {
          Ze(a, t, "renderError"), i = t._vnode;
        }
      else
        i = t._vnode;
    } finally {
      uo = null, Ve();
    }
    return z(i) && i.length === 1 && (i = i[0]), i instanceof Vt || (process.env.NODE_ENV !== "production" && z(i) && T("Multiple root nodes returned from render function. Render function should return a single root node.", t), i = nn()), i.parent = s, i;
  };
}
function Pi(n, t) {
  return (n.__esModule || Ir && n[Symbol.toStringTag] === "Module") && (n = n.default), St(n) ? t.extend(n) : n;
}
function Vf(n, t, e, r, s) {
  var i = nn();
  return i.asyncFactory = n, i.asyncMeta = { data: t, context: e, children: r, tag: s }, i;
}
function zf(n, t) {
  if (_t(n.error) && L(n.errorComp))
    return n.errorComp;
  if (L(n.resolved))
    return n.resolved;
  var e = uo;
  if (e && L(n.owners) && n.owners.indexOf(e) === -1 && n.owners.push(e), _t(n.loading) && L(n.loadingComp))
    return n.loadingComp;
  if (e && !L(n.owners)) {
    var r = n.owners = [e], s = !0, i = null, o = null;
    e.$on("hook:destroyed", function() {
      return Ke(r, e);
    });
    var a = function(f) {
      for (var d = 0, p = r.length; d < p; d++)
        r[d].$forceUpdate();
      f && (r.length = 0, i !== null && (clearTimeout(i), i = null), o !== null && (clearTimeout(o), o = null));
    }, l = ws(function(f) {
      n.resolved = Pi(f, t), s ? r.length = 0 : a(!0);
    }), c = ws(function(f) {
      process.env.NODE_ENV !== "production" && T("Failed to resolve async component: ".concat(String(n)) + (f ? `
Reason: `.concat(f) : "")), L(n.errorComp) && (n.error = !0, a(!0));
    }), u = n(l, c);
    return St(u) && (so(u) ? G(n.resolved) && u.then(l, c) : so(u.component) && (u.component.then(l, c), L(u.error) && (n.errorComp = Pi(u.error, t)), L(u.loading) && (n.loadingComp = Pi(u.loading, t), u.delay === 0 ? n.loading = !0 : i = setTimeout(function() {
      i = null, G(n.resolved) && G(n.error) && (n.loading = !0, a(!1));
    }, u.delay || 200)), L(u.timeout) && (o = setTimeout(function() {
      o = null, G(n.resolved) && c(process.env.NODE_ENV !== "production" ? "timeout (".concat(u.timeout, "ms)") : null);
    }, u.timeout)))), s = !1, n.loading ? n.loadingComp : n.resolved;
  }
}
function Y0(n) {
  if (z(n))
    for (var t = 0; t < n.length; t++) {
      var e = n[t];
      if (L(e) && (L(e.componentOptions) || yr(e)))
        return e;
    }
}
var Zf = 1, X0 = 2;
function ks(n, t, e, r, s, i) {
  return (z(e) || $e(e)) && (s = r, r = e, e = void 0), _t(i) && (s = X0), Wf(n, t, e, r, s);
}
function Wf(n, t, e, r, s) {
  if (L(e) && L(e.__ob__))
    return process.env.NODE_ENV !== "production" && T("Avoid using observed data object as vnode data: ".concat(JSON.stringify(e), `
`) + "Always create fresh vnode data objects in each render!", n), nn();
  if (L(e) && L(e.is) && (t = e.is), !t)
    return nn();
  process.env.NODE_ENV !== "production" && L(e) && L(e.key) && !$e(e.key) && T("Avoid using non-primitive value as key, use string/number value instead.", n), z(r) && ht(r[0]) && (e = e || {}, e.scopedSlots = { default: r[0] }, r.length = 0), s === X0 ? r = qo(r) : s === Zf && (r = bf(r));
  var i, o;
  if (typeof t == "string") {
    var a = void 0;
    o = n.$vnode && n.$vnode.ns || nt.getTagNamespace(t), nt.isReservedTag(t) ? (process.env.NODE_ENV !== "production" && L(e) && L(e.nativeOn) && e.tag !== "component" && T("The .native modifier for v-on is only valid on components but it was used on <".concat(t, ">."), n), i = new Vt(nt.parsePlatformTagName(t), e, r, void 0, void 0, n)) : (!e || !e.pre) && L(a = Is(n.$options, "components", t)) ? i = X1(a, e, n, r, t) : i = new Vt(t, e, r, void 0, void 0, n);
  } else
    i = X1(t, e, n, r);
  return z(i) ? i : L(i) ? (L(o) && Q0(i, o), L(e) && qf(e), i) : nn();
}
function Q0(n, t, e) {
  if (n.ns = t, n.tag === "foreignObject" && (t = void 0, e = !0), L(n.children))
    for (var r = 0, s = n.children.length; r < s; r++) {
      var i = n.children[r];
      L(i.tag) && (G(i.ns) || _t(e) && i.tag !== "svg") && Q0(i, t, e);
    }
}
function qf(n) {
  St(n.style) && Os(n.style), St(n.class) && Os(n.class);
}
function Ze(n, t, e) {
  Vn();
  try {
    if (t)
      for (var r = t; r = r.$parent; ) {
        var s = r.$options.errorCaptured;
        if (s)
          for (var i = 0; i < s.length; i++)
            try {
              var o = s[i].call(r, n, t, e) === !1;
              if (o)
                return;
            } catch (a) {
              j1(a, r, "errorCaptured hook");
            }
      }
    j1(n, t, e);
  } finally {
    zn();
  }
}
function We(n, t, e, r, s) {
  var i;
  try {
    i = e ? n.apply(t, e) : n.call(t), i && !i._isVue && so(i) && !i._handled && (i.catch(function(o) {
      return Ze(o, r, s + " (Promise/async)");
    }), i._handled = !0);
  } catch (o) {
    Ze(o, r, s);
  }
  return i;
}
function j1(n, t, e) {
  if (nt.errorHandler)
    try {
      return nt.errorHandler.call(null, n, t, e);
    } catch (r) {
      r !== n && V1(r, null, "config.errorHandler");
    }
  V1(n, t, e);
}
function V1(n, t, e) {
  if (process.env.NODE_ENV !== "production" && T("Error in ".concat(e, ': "').concat(n.toString(), '"'), t), zt && typeof console < "u")
    console.error(n);
  else
    throw n;
}
var ho = !1, fo = [], po = !1;
function ss() {
  po = !1;
  var n = fo.slice(0);
  fo.length = 0;
  for (var t = 0; t < n.length; t++)
    n[t]();
}
var cr;
if (typeof Promise < "u" && en(Promise)) {
  var Kf = Promise.resolve();
  cr = function() {
    Kf.then(ss), df && setTimeout(Ct);
  }, ho = !0;
} else if (!Gn && typeof MutationObserver < "u" && (en(MutationObserver) || MutationObserver.toString() === "[object MutationObserverConstructor]")) {
  var is = 1, Yf = new MutationObserver(ss), z1 = document.createTextNode(String(is));
  Yf.observe(z1, {
    characterData: !0
  }), cr = function() {
    is = (is + 1) % 2, z1.data = String(is);
  }, ho = !0;
} else
  typeof setImmediate < "u" && en(setImmediate) ? cr = function() {
    setImmediate(ss);
  } : cr = function() {
    setTimeout(ss, 0);
  };
function Yo(n, t) {
  var e;
  if (fo.push(function() {
    if (n)
      try {
        n.call(t);
      } catch (r) {
        Ze(r, t, "nextTick");
      }
    else
      e && e(t);
  }), po || (po = !0, cr()), !n && typeof Promise < "u")
    return new Promise(function(r) {
      e = r;
    });
}
var Xf = "2.7.14", Z1 = new vr();
function Os(n) {
  return vs(n, Z1), Z1.clear(), n;
}
function vs(n, t) {
  var e, r, s = z(n);
  if (!(!s && !St(n) || n.__v_skip || Object.isFrozen(n) || n instanceof Vt)) {
    if (n.__ob__) {
      var i = n.__ob__.dep.id;
      if (t.has(i))
        return;
      t.add(i);
    }
    if (s)
      for (e = n.length; e--; )
        vs(n[e], t);
    else if (ye(n))
      vs(n.value, t);
    else
      for (r = Object.keys(n), e = r.length; e--; )
        vs(n[r[e]], t);
  }
}
var Qf = 0, Xo = function() {
  function n(t, e, r, s, i) {
    yf(
      this,
      qt && !qt._vm ? qt : t ? t._scope : void 0
    ), (this.vm = t) && i && (t._watcher = this), s ? (this.deep = !!s.deep, this.user = !!s.user, this.lazy = !!s.lazy, this.sync = !!s.sync, this.before = s.before, process.env.NODE_ENV !== "production" && (this.onTrack = s.onTrack, this.onTrigger = s.onTrigger)) : this.deep = this.user = this.lazy = this.sync = !1, this.cb = r, this.id = ++Qf, this.active = !0, this.post = !1, this.dirty = this.lazy, this.deps = [], this.newDeps = [], this.depIds = new vr(), this.newDepIds = new vr(), this.expression = process.env.NODE_ENV !== "production" ? e.toString() : "", ht(e) ? this.getter = e : (this.getter = hf(e), this.getter || (this.getter = Ct, process.env.NODE_ENV !== "production" && T('Failed watching path: "'.concat(e, '" ') + "Watcher only accepts simple dot-delimited paths. For full control, use a function instead.", t))), this.value = this.lazy ? void 0 : this.get();
  }
  return n.prototype.get = function() {
    Vn(this);
    var t, e = this.vm;
    try {
      t = this.getter.call(e, e);
    } catch (r) {
      if (this.user)
        Ze(r, e, 'getter for watcher "'.concat(this.expression, '"'));
      else
        throw r;
    } finally {
      this.deep && Os(t), zn(), this.cleanupDeps();
    }
    return t;
  }, n.prototype.addDep = function(t) {
    var e = t.id;
    this.newDepIds.has(e) || (this.newDepIds.add(e), this.newDeps.push(t), this.depIds.has(e) || t.addSub(this));
  }, n.prototype.cleanupDeps = function() {
    for (var t = this.deps.length; t--; ) {
      var e = this.deps[t];
      this.newDepIds.has(e.id) || e.removeSub(this);
    }
    var r = this.depIds;
    this.depIds = this.newDepIds, this.newDepIds = r, this.newDepIds.clear(), r = this.deps, this.deps = this.newDeps, this.newDeps = r, this.newDeps.length = 0;
  }, n.prototype.update = function() {
    this.lazy ? this.dirty = !0 : this.sync ? this.run() : pd(this);
  }, n.prototype.run = function() {
    if (this.active) {
      var t = this.get();
      if (t !== this.value || St(t) || this.deep) {
        var e = this.value;
        if (this.value = t, this.user) {
          var r = 'callback for watcher "'.concat(this.expression, '"');
          We(this.cb, this.vm, [t, e], this.vm, r);
        } else
          this.cb.call(this.vm, t, e);
      }
    }
  }, n.prototype.evaluate = function() {
    this.value = this.get(), this.dirty = !1;
  }, n.prototype.depend = function() {
    for (var t = this.deps.length; t--; )
      this.deps[t].depend();
  }, n.prototype.teardown = function() {
    if (this.vm && !this.vm._isBeingDestroyed && Ke(this.vm._scope.effects, this), this.active) {
      for (var t = this.deps.length; t--; )
        this.deps[t].removeSub(this);
      this.active = !1, this.onStop && this.onStop();
    }
  }, n;
}(), _e, Ns;
if (process.env.NODE_ENV !== "production") {
  var Se = zt && window.performance;
  Se && Se.mark && Se.measure && Se.clearMarks && Se.clearMeasures && (_e = function(n) {
    return Se.mark(n);
  }, Ns = function(n, t, e) {
    Se.measure(n, t, e), Se.clearMarks(t), Se.clearMarks(e);
  });
}
function Jf(n) {
  n._events = /* @__PURE__ */ Object.create(null), n._hasHookEvent = !1;
  var t = n.$options._parentListeners;
  t && J0(n, t);
}
var Cr;
function td(n, t) {
  Cr.$on(n, t);
}
function ed(n, t) {
  Cr.$off(n, t);
}
function nd(n, t) {
  var e = Cr;
  return function r() {
    var s = t.apply(null, arguments);
    s !== null && e.$off(n, r);
  };
}
function J0(n, t, e) {
  Cr = n, V0(t, e || {}, td, ed, nd, n), Cr = void 0;
}
function rd(n) {
  var t = /^hook:/;
  n.prototype.$on = function(e, r) {
    var s = this;
    if (z(e))
      for (var i = 0, o = e.length; i < o; i++)
        s.$on(e[i], r);
    else
      (s._events[e] || (s._events[e] = [])).push(r), t.test(e) && (s._hasHookEvent = !0);
    return s;
  }, n.prototype.$once = function(e, r) {
    var s = this;
    function i() {
      s.$off(e, i), r.apply(s, arguments);
    }
    return i.fn = r, s.$on(e, i), s;
  }, n.prototype.$off = function(e, r) {
    var s = this;
    if (!arguments.length)
      return s._events = /* @__PURE__ */ Object.create(null), s;
    if (z(e)) {
      for (var i = 0, o = e.length; i < o; i++)
        s.$off(e[i], r);
      return s;
    }
    var a = s._events[e];
    if (!a)
      return s;
    if (!r)
      return s._events[e] = null, s;
    for (var l, c = a.length; c--; )
      if (l = a[c], l === r || l.fn === r) {
        a.splice(c, 1);
        break;
      }
    return s;
  }, n.prototype.$emit = function(e) {
    var r = this;
    if (process.env.NODE_ENV !== "production") {
      var s = e.toLowerCase();
      s !== e && r._events[s] && ra('Event "'.concat(s, '" is emitted in component ') + "".concat(tn(r), ' but the handler is registered for "').concat(e, '". ') + "Note that HTML attributes are case-insensitive and you cannot use v-on to listen to camelCase events when using in-DOM templates. " + 'You should probably use "'.concat(fn(e), '" instead of "').concat(e, '".'));
    }
    var i = r._events[e];
    if (i) {
      i = i.length > 1 ? io(i) : i;
      for (var o = io(arguments, 1), a = 'event handler for "'.concat(e, '"'), l = 0, c = i.length; l < c; l++)
        We(i[l], r, o, r, a);
    }
    return r;
  };
}
var rn = null, Er = !1;
function tu(n) {
  var t = rn;
  return rn = n, function() {
    rn = t;
  };
}
function sd(n) {
  var t = n.$options, e = t.parent;
  if (e && !t.abstract) {
    for (; e.$options.abstract && e.$parent; )
      e = e.$parent;
    e.$children.push(n);
  }
  n.$parent = e, n.$root = e ? e.$root : n, n.$children = [], n.$refs = {}, n._provided = e ? e._provided : /* @__PURE__ */ Object.create(null), n._watcher = null, n._inactive = null, n._directInactive = !1, n._isMounted = !1, n._isDestroyed = !1, n._isBeingDestroyed = !1;
}
function id(n) {
  n.prototype._update = function(t, e) {
    var r = this, s = r.$el, i = r._vnode, o = tu(r);
    r._vnode = t, i ? r.$el = r.__patch__(i, t) : r.$el = r.__patch__(r.$el, t, e, !1), o(), s && (s.__vue__ = null), r.$el && (r.$el.__vue__ = r);
    for (var a = r; a && a.$vnode && a.$parent && a.$vnode === a.$parent._vnode; )
      a.$parent.$el = a.$el, a = a.$parent;
  }, n.prototype.$forceUpdate = function() {
    var t = this;
    t._watcher && t._watcher.update();
  }, n.prototype.$destroy = function() {
    var t = this;
    if (!t._isBeingDestroyed) {
      Kt(t, "beforeDestroy"), t._isBeingDestroyed = !0;
      var e = t.$parent;
      e && !e._isBeingDestroyed && !t.$options.abstract && Ke(e.$children, t), t._scope.stop(), t._data.__ob__ && t._data.__ob__.vmCount--, t._isDestroyed = !0, t.__patch__(t._vnode, null), Kt(t, "destroyed"), t.$off(), t.$el && (t.$el.__vue__ = null), t.$vnode && (t.$vnode.parent = null);
    }
  };
}
function od(n, t, e) {
  n.$el = t, n.$options.render || (n.$options.render = nn, process.env.NODE_ENV !== "production" && (n.$options.template && n.$options.template.charAt(0) !== "#" || n.$options.el || t ? T("You are using the runtime-only build of Vue where the template compiler is not available. Either pre-compile the templates into render functions, or use the compiler-included build.", n) : T("Failed to mount component: template or render function not defined.", n))), Kt(n, "beforeMount");
  var r;
  process.env.NODE_ENV !== "production" && nt.performance && _e ? r = function() {
    var a = n._name, l = n._uid, c = "vue-perf-start:".concat(l), u = "vue-perf-end:".concat(l);
    _e(c);
    var f = n._render();
    _e(u), Ns("vue ".concat(a, " render"), c, u), _e(c), n._update(f, e), _e(u), Ns("vue ".concat(a, " patch"), c, u);
  } : r = function() {
    n._update(n._render(), e);
  };
  var s = {
    before: function() {
      n._isMounted && !n._isDestroyed && Kt(n, "beforeUpdate");
    }
  };
  process.env.NODE_ENV !== "production" && (s.onTrack = function(a) {
    return Kt(n, "renderTracked", [a]);
  }, s.onTrigger = function(a) {
    return Kt(n, "renderTriggered", [a]);
  }), new Xo(n, r, Ct, s, !0), e = !1;
  var i = n._preWatchers;
  if (i)
    for (var o = 0; o < i.length; o++)
      i[o].run();
  return n.$vnode == null && (n._isMounted = !0, Kt(n, "mounted")), n;
}
function ad(n, t, e, r, s) {
  process.env.NODE_ENV !== "production" && (Er = !0);
  var i = r.data.scopedSlots, o = n.$scopedSlots, a = !!(i && !i.$stable || o !== $t && !o.$stable || i && n.$scopedSlots.$key !== i.$key || !i && n.$scopedSlots.$key), l = !!(s || n.$options._renderChildren || a), c = n.$vnode;
  n.$options._parentVnode = r, n.$vnode = r, n._vnode && (n._vnode.parent = r), n.$options._renderChildren = s;
  var u = r.data.attrs || $t;
  n._attrsProxy && Rs(n._attrsProxy, u, c.data && c.data.attrs || $t, n, "$attrs") && (l = !0), n.$attrs = u, e = e || $t;
  var f = n.$options._parentListeners;
  if (n._listenersProxy && Rs(n._listenersProxy, e, f || $t, n, "$listeners"), n.$listeners = n.$options._parentListeners = e, J0(n, e, f), t && n.$options.props) {
    ze(!1);
    for (var d = n._props, p = n.$options._propKeys || [], w = 0; w < p.length; w++) {
      var I = p[w], W = n.$options.props;
      d[I] = oa(I, W, t, n);
    }
    ze(!0), n.$options.propsData = t;
  }
  l && (n.$slots = Ko(s, r.context), n.$forceUpdate()), process.env.NODE_ENV !== "production" && (Er = !1);
}
function eu(n) {
  for (; n && (n = n.$parent); )
    if (n._inactive)
      return !0;
  return !1;
}
function Qo(n, t) {
  if (t) {
    if (n._directInactive = !1, eu(n))
      return;
  } else if (n._directInactive)
    return;
  if (n._inactive || n._inactive === null) {
    n._inactive = !1;
    for (var e = 0; e < n.$children.length; e++)
      Qo(n.$children[e]);
    Kt(n, "activated");
  }
}
function nu(n, t) {
  if (!(t && (n._directInactive = !0, eu(n))) && !n._inactive) {
    n._inactive = !0;
    for (var e = 0; e < n.$children.length; e++)
      nu(n.$children[e]);
    Kt(n, "deactivated");
  }
}
function Kt(n, t, e, r) {
  r === void 0 && (r = !0), Vn();
  var s = In;
  r && Ve(n);
  var i = n.$options[t], o = "".concat(t, " hook");
  if (i)
    for (var a = 0, l = i.length; a < l; a++)
      We(i[a], n, e || null, n, o);
  n._hasHookEvent && n.$emit("hook:" + t), r && Ve(s), zn();
}
var ld = 100, Re = [], Jo = [], br = {}, ys = {}, go = !1, ta = !1, Rn = 0;
function cd() {
  Rn = Re.length = Jo.length = 0, br = {}, process.env.NODE_ENV !== "production" && (ys = {}), go = ta = !1;
}
var ru = 0, xo = Date.now;
if (zt && !Gn) {
  var $i = window.performance;
  $i && typeof $i.now == "function" && xo() > document.createEvent("Event").timeStamp && (xo = function() {
    return $i.now();
  });
}
var ud = function(n, t) {
  if (n.post) {
    if (!t.post)
      return 1;
  } else if (t.post)
    return -1;
  return n.id - t.id;
};
function W1() {
  ru = xo(), ta = !0;
  var n, t;
  for (Re.sort(ud), Rn = 0; Rn < Re.length; Rn++)
    if (n = Re[Rn], n.before && n.before(), t = n.id, br[t] = null, n.run(), process.env.NODE_ENV !== "production" && br[t] != null && (ys[t] = (ys[t] || 0) + 1, ys[t] > ld)) {
      T("You may have an infinite update loop " + (n.user ? 'in watcher with expression "'.concat(n.expression, '"') : "in a component render function."), n.vm);
      break;
    }
  var e = Jo.slice(), r = Re.slice();
  cd(), dd(e), hd(r), gf(), Ts && nt.devtools && Ts.emit("flush");
}
function hd(n) {
  for (var t = n.length; t--; ) {
    var e = n[t], r = e.vm;
    r && r._watcher === e && r._isMounted && !r._isDestroyed && Kt(r, "updated");
  }
}
function fd(n) {
  n._inactive = !1, Jo.push(n);
}
function dd(n) {
  for (var t = 0; t < n.length; t++)
    n[t]._inactive = !0, Qo(n[t], !0);
}
function pd(n) {
  var t = n.id;
  if (br[t] == null && !(n === he.target && n.noRecurse)) {
    if (br[t] = !0, !ta)
      Re.push(n);
    else {
      for (var e = Re.length - 1; e > Rn && Re[e].id > n.id; )
        e--;
      Re.splice(e + 1, 0, n);
    }
    if (!go) {
      if (go = !0, process.env.NODE_ENV !== "production" && !nt.async) {
        W1();
        return;
      }
      Yo(W1);
    }
  }
}
function gd(n) {
  var t = n.$options.provide;
  if (t) {
    var e = ht(t) ? t.call(n) : t;
    if (!St(e))
      return;
    for (var r = Cf(n), s = Ir ? Reflect.ownKeys(e) : Object.keys(e), i = 0; i < s.length; i++) {
      var o = s[i];
      Object.defineProperty(r, o, Object.getOwnPropertyDescriptor(e, o));
    }
  }
}
function xd(n) {
  var t = su(n.$options.inject, n);
  t && (ze(!1), Object.keys(t).forEach(function(e) {
    process.env.NODE_ENV !== "production" ? fe(n, e, t[e], function() {
      T("Avoid mutating an injected value directly since the changes will be overwritten whenever the provided component re-renders. " + 'injection being mutated: "'.concat(e, '"'), n);
    }) : fe(n, e, t[e]);
  }), ze(!0));
}
function su(n, t) {
  if (n) {
    for (var e = /* @__PURE__ */ Object.create(null), r = Ir ? Reflect.ownKeys(n) : Object.keys(n), s = 0; s < r.length; s++) {
      var i = r[s];
      if (i !== "__ob__") {
        var o = n[i].from;
        if (o in t._provided)
          e[i] = t._provided[o];
        else if ("default" in n[i]) {
          var a = n[i].default;
          e[i] = ht(a) ? a.call(t) : a;
        } else
          process.env.NODE_ENV !== "production" && T('Injection "'.concat(i, '" not found'), t);
      }
    }
    return e;
  }
}
function ea(n, t, e, r, s) {
  var i = this, o = s.options, a;
  At(r, "_uid") ? (a = Object.create(r), a._original = r) : (a = r, r = r._original);
  var l = _t(o._compiled), c = !l;
  this.data = n, this.props = t, this.children = e, this.parent = r, this.listeners = n.on || $t, this.injections = su(o.inject, r), this.slots = function() {
    return i.$slots || ur(r, n.scopedSlots, i.$slots = Ko(e, r)), i.$slots;
  }, Object.defineProperty(this, "scopedSlots", {
    enumerable: !0,
    get: function() {
      return ur(r, n.scopedSlots, this.slots());
    }
  }), l && (this.$options = o, this.$slots = this.slots(), this.$scopedSlots = ur(r, n.scopedSlots, this.$slots)), o._scopeId ? this._c = function(u, f, d, p) {
    var w = ks(a, u, f, d, p, c);
    return w && !z(w) && (w.fnScopeId = o._scopeId, w.fnContext = r), w;
  } : this._c = function(u, f, d, p) {
    return ks(a, u, f, d, p, c);
  };
}
q0(ea.prototype);
function md(n, t, e, r, s) {
  var i = n.options, o = {}, a = i.props;
  if (L(a))
    for (var l in a)
      o[l] = oa(l, a, t || $t);
  else
    L(e.attrs) && K1(o, e.attrs), L(e.props) && K1(o, e.props);
  var c = new ea(e, o, s, r, n), u = i.render.call(null, c._c, c);
  if (u instanceof Vt)
    return q1(u, e, c.parent, i, c);
  if (z(u)) {
    for (var f = qo(u) || [], d = new Array(f.length), p = 0; p < f.length; p++)
      d[p] = q1(f[p], e, c.parent, i, c);
    return d;
  }
}
function q1(n, t, e, r, s) {
  var i = ao(n);
  return i.fnContext = e, i.fnOptions = r, process.env.NODE_ENV !== "production" && ((i.devtoolsMeta = i.devtoolsMeta || {}).renderContext = s), t.slot && ((i.data || (i.data = {})).slot = t.slot), i;
}
function K1(n, t) {
  for (var e in t)
    n[an(e)] = t[e];
}
function $n(n) {
  return n.name || n.__name || n._componentTag;
}
var na = {
  init: function(n, t) {
    if (n.componentInstance && !n.componentInstance._isDestroyed && n.data.keepAlive) {
      var e = n;
      na.prepatch(e, e);
    } else {
      var r = n.componentInstance = _d(n, rn);
      r.$mount(t ? n.elm : void 0, t);
    }
  },
  prepatch: function(n, t) {
    var e = t.componentOptions, r = t.componentInstance = n.componentInstance;
    ad(
      r,
      e.propsData,
      e.listeners,
      t,
      e.children
    );
  },
  insert: function(n) {
    var t = n.context, e = n.componentInstance;
    e._isMounted || (e._isMounted = !0, Kt(e, "mounted")), n.data.keepAlive && (t._isMounted ? fd(e) : Qo(e, !0));
  },
  destroy: function(n) {
    var t = n.componentInstance;
    t._isDestroyed || (n.data.keepAlive ? nu(t, !0) : t.$destroy());
  }
}, Y1 = Object.keys(na);
function X1(n, t, e, r, s) {
  if (!G(n)) {
    var i = e.$options._base;
    if (St(n) && (n = i.extend(n)), typeof n != "function") {
      process.env.NODE_ENV !== "production" && T("Invalid Component definition: ".concat(String(n)), e);
      return;
    }
    var o;
    if (G(n.cid) && (o = n, n = zf(o, i), n === void 0))
      return Vf(o, t, e, r, s);
    t = t || {}, la(n), L(t.model) && yd(n.options, t);
    var a = Ef(t, n, s);
    if (_t(n.options.functional))
      return md(n, a, t, e, r);
    var l = t.on;
    if (t.on = t.nativeOn, _t(n.options.abstract)) {
      var c = t.slot;
      t = {}, c && (t.slot = c);
    }
    Ld(t);
    var u = $n(n.options) || s, f = new Vt(
      "vue-component-".concat(n.cid).concat(u ? "-".concat(u) : ""),
      t,
      void 0,
      void 0,
      void 0,
      e,
      { Ctor: n, propsData: a, listeners: l, tag: s, children: r },
      o
    );
    return f;
  }
}
function _d(n, t) {
  var e = {
    _isComponent: !0,
    _parentVnode: n,
    parent: t
  }, r = n.data.inlineTemplate;
  return L(r) && (e.render = r.render, e.staticRenderFns = r.staticRenderFns), new n.componentOptions.Ctor(e);
}
function Ld(n) {
  for (var t = n.hook || (n.hook = {}), e = 0; e < Y1.length; e++) {
    var r = Y1[e], s = t[r], i = na[r];
    s !== i && !(s && s._merged) && (t[r] = s ? vd(i, s) : i);
  }
}
function vd(n, t) {
  var e = function(r, s) {
    n(r, s), t(r, s);
  };
  return e._merged = !0, e;
}
function yd(n, t) {
  var e = n.model && n.model.prop || "value", r = n.model && n.model.event || "input";
  (t.attrs || (t.attrs = {}))[e] = t.model.value;
  var s = t.on || (t.on = {}), i = s[r], o = t.model.callback;
  L(i) ? (z(i) ? i.indexOf(o) === -1 : i !== o) && (s[r] = [o].concat(i)) : s[r] = o;
}
var T = Ct, ra = Ct, Di, tn;
if (process.env.NODE_ENV !== "production") {
  var Q1 = typeof console < "u", Cd = /(?:^|[-_])(\w)/g, Ed = function(n) {
    return n.replace(Cd, function(t) {
      return t.toUpperCase();
    }).replace(/[-_]/g, "");
  };
  T = function(n, t) {
    t === void 0 && (t = In);
    var e = t ? Di(t) : "";
    nt.warnHandler ? nt.warnHandler.call(null, n, t, e) : Q1 && !nt.silent && console.error("[Vue warn]: ".concat(n).concat(e));
  }, ra = function(n, t) {
    Q1 && !nt.silent && console.warn("[Vue tip]: ".concat(n) + (t ? Di(t) : ""));
  }, tn = function(n, t) {
    if (n.$root === n)
      return "<Root>";
    var e = ht(n) && n.cid != null ? n.options : n._isVue ? n.$options || n.constructor.options : n, r = $n(e), s = e.__file;
    if (!r && s) {
      var i = s.match(/([^/\\]+)\.vue$/);
      r = i && i[1];
    }
    return (r ? "<".concat(Ed(r), ">") : "<Anonymous>") + (s && t !== !1 ? " at ".concat(s) : "");
  };
  var bd = function(n, t) {
    for (var e = ""; t; )
      t % 2 === 1 && (e += n), t > 1 && (n += n), t >>= 1;
    return e;
  };
  Di = function(n) {
    if (n._isVue && n.$parent) {
      for (var t = [], e = 0; n; ) {
        if (t.length > 0) {
          var r = t[t.length - 1];
          if (r.constructor === n.constructor) {
            e++, n = n.$parent;
            continue;
          } else
            e > 0 && (t[t.length - 1] = [r, e], e = 0);
        }
        t.push(n), n = n.$parent;
      }
      return `

found in

` + t.map(function(s, i) {
        return "".concat(i === 0 ? "---> " : bd(" ", 5 + i * 2)).concat(z(s) ? "".concat(tn(s[0]), "... (").concat(s[1], " recursive calls)") : tn(s));
      }).join(`
`);
    } else
      return `

(found in `.concat(tn(n), ")");
  };
}
var re = nt.optionMergeStrategies;
process.env.NODE_ENV !== "production" && (re.el = re.propsData = function(n, t, e, r) {
  return e || T('option "'.concat(r, '" can only be used during instance ') + "creation with the `new` keyword."), iu(n, t);
});
function wr(n, t, e) {
  if (e === void 0 && (e = !0), !t)
    return n;
  for (var r, s, i, o = Ir ? Reflect.ownKeys(t) : Object.keys(t), a = 0; a < o.length; a++)
    r = o[a], r !== "__ob__" && (s = n[r], i = t[r], !e || !At(n, r) ? Zo(n, r, i) : s !== i && Ut(s) && Ut(i) && wr(s, i));
  return n;
}
function J1(n, t, e) {
  return e ? function() {
    var s = ht(t) ? t.call(e, e) : t, i = ht(n) ? n.call(e, e) : n;
    return s ? wr(s, i) : i;
  } : t ? n ? function() {
    return wr(ht(t) ? t.call(this, this) : t, ht(n) ? n.call(this, this) : n);
  } : t : n;
}
re.data = function(n, t, e) {
  return e ? J1(n, t, e) : t && typeof t != "function" ? (process.env.NODE_ENV !== "production" && T('The "data" option should be a function that returns a per-instance value in component definitions.', e), n) : J1(n, t);
};
function wd(n, t) {
  var e = t ? n ? n.concat(t) : z(t) ? t : [t] : n;
  return e && Td(e);
}
function Td(n) {
  for (var t = [], e = 0; e < n.length; e++)
    t.indexOf(n[e]) === -1 && t.push(n[e]);
  return t;
}
P0.forEach(function(n) {
  re[n] = wd;
});
function Ad(n, t, e, r) {
  var s = Object.create(n || null);
  return t ? (process.env.NODE_ENV !== "production" && ia(r, t, e), ct(s, t)) : s;
}
ti.forEach(function(n) {
  re[n + "s"] = Ad;
});
re.watch = function(n, t, e, r) {
  if (n === oo && (n = void 0), t === oo && (t = void 0), !t)
    return Object.create(n || null);
  if (process.env.NODE_ENV !== "production" && ia(r, t, e), !n)
    return t;
  var s = {};
  ct(s, n);
  for (var i in t) {
    var o = s[i], a = t[i];
    o && !z(o) && (o = [o]), s[i] = o ? o.concat(a) : z(a) ? a : [a];
  }
  return s;
};
re.props = re.methods = re.inject = re.computed = function(n, t, e, r) {
  if (t && process.env.NODE_ENV !== "production" && ia(r, t, e), !n)
    return t;
  var s = /* @__PURE__ */ Object.create(null);
  return ct(s, n), t && ct(s, t), s;
};
re.provide = function(n, t) {
  return n ? function() {
    var e = /* @__PURE__ */ Object.create(null);
    return wr(e, ht(n) ? n.call(this) : n), t && wr(
      e,
      ht(t) ? t.call(this) : t,
      !1
    ), e;
  } : t;
};
var iu = function(n, t) {
  return t === void 0 ? n : t;
};
function Sd(n) {
  for (var t in n.components)
    sa(t);
}
function sa(n) {
  new RegExp("^[a-zA-Z][\\-\\.0-9_".concat($0.source, "]*$")).test(n) || T('Invalid component name: "' + n + '". Component names should conform to valid custom element name in html5 specification.'), (nf(n) || nt.isReservedTag(n)) && T("Do not use built-in or reserved HTML elements as component id: " + n);
}
function Rd(n, t) {
  var e = n.props;
  if (e) {
    var r = {}, s, i, o;
    if (z(e))
      for (s = e.length; s--; )
        i = e[s], typeof i == "string" ? (o = an(i), r[o] = { type: null }) : process.env.NODE_ENV !== "production" && T("props must be strings when using array syntax.");
    else if (Ut(e))
      for (var a in e)
        i = e[a], o = an(a), r[o] = Ut(i) ? i : { type: i };
    else
      process.env.NODE_ENV !== "production" && T('Invalid value for option "props": expected an Array or an Object, ' + "but got ".concat(Or(e), "."), t);
    n.props = r;
  }
}
function kd(n, t) {
  var e = n.inject;
  if (e) {
    var r = n.inject = {};
    if (z(e))
      for (var s = 0; s < e.length; s++)
        r[e[s]] = { from: e[s] };
    else if (Ut(e))
      for (var i in e) {
        var o = e[i];
        r[i] = Ut(o) ? ct({ from: i }, o) : { from: o };
      }
    else
      process.env.NODE_ENV !== "production" && T('Invalid value for option "inject": expected an Array or an Object, ' + "but got ".concat(Or(e), "."), t);
  }
}
function Od(n) {
  var t = n.directives;
  if (t)
    for (var e in t) {
      var r = t[e];
      ht(r) && (t[e] = { bind: r, update: r });
    }
}
function ia(n, t, e) {
  Ut(t) || T('Invalid value for option "'.concat(n, '": expected an Object, ') + "but got ".concat(Or(t), "."), e);
}
function cn(n, t, e) {
  if (process.env.NODE_ENV !== "production" && Sd(t), ht(t) && (t = t.options), Rd(t, e), kd(t, e), Od(t), !t._base && (t.extends && (n = cn(n, t.extends, e)), t.mixins))
    for (var r = 0, s = t.mixins.length; r < s; r++)
      n = cn(n, t.mixins[r], e);
  var i = {}, o;
  for (o in n)
    a(o);
  for (o in t)
    At(n, o) || a(o);
  function a(l) {
    var c = re[l] || iu;
    i[l] = c(n[l], t[l], e, l);
  }
  return i;
}
function Is(n, t, e, r) {
  if (typeof e == "string") {
    var s = n[t];
    if (At(s, e))
      return s[e];
    var i = an(e);
    if (At(s, i))
      return s[i];
    var o = k0(i);
    if (At(s, o))
      return s[o];
    var a = s[e] || s[i] || s[o];
    return process.env.NODE_ENV !== "production" && r && !a && T("Failed to resolve " + t.slice(0, -1) + ": " + e), a;
  }
}
function oa(n, t, e, r) {
  var s = t[n], i = !At(e, n), o = e[n], a = el(Boolean, s.type);
  if (a > -1) {
    if (i && !At(s, "default"))
      o = !1;
    else if (o === "" || o === fn(n)) {
      var l = el(String, s.type);
      (l < 0 || a < l) && (o = !0);
    }
  }
  if (o === void 0) {
    o = Nd(r, s, n);
    var c = zo;
    ze(!0), Ie(o), ze(c);
  }
  return process.env.NODE_ENV !== "production" && Id(s, n, o, r, i), o;
}
function Nd(n, t, e) {
  if (At(t, "default")) {
    var r = t.default;
    return process.env.NODE_ENV !== "production" && St(r) && T('Invalid default value for prop "' + e + '": Props with type Object/Array must use a factory function to return the default value.', n), n && n.$options.propsData && n.$options.propsData[e] === void 0 && n._props[e] !== void 0 ? n._props[e] : ht(r) && Ms(t.type) !== "Function" ? r.call(n) : r;
  }
}
function Id(n, t, e, r, s) {
  if (n.required && s) {
    T('Missing required prop: "' + t + '"', r);
    return;
  }
  if (!(e == null && !n.required)) {
    var i = n.type, o = !i || i === !0, a = [];
    if (i) {
      z(i) || (i = [i]);
      for (var l = 0; l < i.length && !o; l++) {
        var c = Pd(e, i[l], r);
        a.push(c.expectedType || ""), o = c.valid;
      }
    }
    var u = a.some(function(d) {
      return d;
    });
    if (!o && u) {
      T(Dd(t, e, a), r);
      return;
    }
    var f = n.validator;
    f && (f(e) || T('Invalid prop: custom validator check failed for prop "' + t + '".', r));
  }
}
var Md = /^(String|Number|Boolean|Function|Symbol|BigInt)$/;
function Pd(n, t, e) {
  var r, s = Ms(t);
  if (Md.test(s)) {
    var i = typeof n;
    r = i === s.toLowerCase(), !r && i === "object" && (r = n instanceof t);
  } else if (s === "Object")
    r = Ut(n);
  else if (s === "Array")
    r = z(n);
  else
    try {
      r = n instanceof t;
    } catch {
      T('Invalid prop type: "' + String(t) + '" is not a constructor', e), r = !1;
    }
  return {
    valid: r,
    expectedType: s
  };
}
var $d = /^\s*function (\w+)/;
function Ms(n) {
  var t = n && n.toString().match($d);
  return t ? t[1] : "";
}
function tl(n, t) {
  return Ms(n) === Ms(t);
}
function el(n, t) {
  if (!z(t))
    return tl(t, n) ? 0 : -1;
  for (var e = 0, r = t.length; e < r; e++)
    if (tl(t[e], n))
      return e;
  return -1;
}
function Dd(n, t, e) {
  var r = 'Invalid prop: type check failed for prop "'.concat(n, '".') + " Expected ".concat(e.map(k0).join(", ")), s = e[0], i = Or(t);
  return e.length === 1 && Fi(s) && Fi(typeof t) && !Bd(s, i) && (r += " with value ".concat(nl(t, s))), r += ", got ".concat(i, " "), Fi(i) && (r += "with value ".concat(nl(t, i), ".")), r;
}
function nl(n, t) {
  return t === "String" ? '"'.concat(n, '"') : t === "Number" ? "".concat(Number(n)) : "".concat(n);
}
var Fd = ["string", "number", "boolean"];
function Fi(n) {
  return Fd.some(function(t) {
    return n.toLowerCase() === t;
  });
}
function Bd() {
  for (var n = [], t = 0; t < arguments.length; t++)
    n[t] = arguments[t];
  return n.some(function(e) {
    return e.toLowerCase() === "boolean";
  });
}
var ou;
if (process.env.NODE_ENV !== "production") {
  var Ud = Qt(
    "Infinity,undefined,NaN,isFinite,isNaN,parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,BigInt,require"
  ), rl = function(n, t) {
    T('Property or method "'.concat(t, '" is not defined on the instance but ') + "referenced during render. Make sure that this property is reactive, either in the data option, or for class-based components, by initializing the property. See: https://v2.vuejs.org/v2/guide/reactivity.html#Declaring-Reactive-Properties.", n);
  }, sl = function(n, t) {
    T('Property "'.concat(t, '" must be accessed with "$data.').concat(t, '" because ') + 'properties starting with "$" or "_" are not proxied in the Vue instance to prevent conflicts with Vue internals. See: https://v2.vuejs.org/v2/api/#data', n);
  }, il = typeof Proxy < "u" && en(Proxy);
  if (il) {
    var Hd = Qt("stop,prevent,self,ctrl,shift,alt,meta,exact");
    nt.keyCodes = new Proxy(nt.keyCodes, {
      set: function(n, t, e) {
        return Hd(t) ? (T("Avoid overwriting built-in modifier in config.keyCodes: .".concat(t)), !1) : (n[t] = e, !0);
      }
    });
  }
  var Gd = {
    has: function(n, t) {
      var e = t in n, r = Ud(t) || typeof t == "string" && t.charAt(0) === "_" && !(t in n.$data);
      return !e && !r && (t in n.$data ? sl(n, t) : rl(n, t)), e || !r;
    }
  }, jd = {
    get: function(n, t) {
      return typeof t == "string" && !(t in n) && (t in n.$data ? sl(n, t) : rl(n, t)), n[t];
    }
  };
  ou = function(t) {
    if (il) {
      var e = t.$options, r = e.render && e.render._withStripped ? jd : Gd;
      t._renderProxy = new Proxy(t, r);
    } else
      t._renderProxy = t;
  };
}
var me = {
  enumerable: !0,
  configurable: !0,
  get: Ct,
  set: Ct
};
function aa(n, t, e) {
  me.get = function() {
    return this[t][e];
  }, me.set = function(s) {
    this[t][e] = s;
  }, Object.defineProperty(n, e, me);
}
function Vd(n) {
  var t = n.$options;
  if (t.props && zd(n, t.props), Ff(n), t.methods && Yd(n, t.methods), t.data)
    Zd(n);
  else {
    var e = Ie(n._data = {});
    e && e.vmCount++;
  }
  t.computed && Kd(n, t.computed), t.watch && t.watch !== oo && Xd(n, t.watch);
}
function zd(n, t) {
  var e = n.$options.propsData || {}, r = n._props = j0({}), s = n.$options._propKeys = [], i = !n.$parent;
  i || ze(!1);
  var o = function(l) {
    s.push(l);
    var c = oa(l, t, e, n);
    if (process.env.NODE_ENV !== "production") {
      var u = fn(l);
      (R0(u) || nt.isReservedAttr(u)) && T('"'.concat(u, '" is a reserved attribute and cannot be used as component prop.'), n), fe(r, l, c, function() {
        !i && !Er && T("Avoid mutating a prop directly since the value will be overwritten whenever the parent component re-renders. Instead, use a data or computed property based on the prop's " + 'value. Prop being mutated: "'.concat(l, '"'), n);
      });
    } else
      fe(r, l, c);
    l in n || aa(n, "_props", l);
  };
  for (var a in t)
    o(a);
  ze(!0);
}
function Zd(n) {
  var t = n.$options.data;
  t = n._data = ht(t) ? Wd(t, n) : t || {}, Ut(t) || (t = {}, process.env.NODE_ENV !== "production" && T(`data functions should return an object:
https://v2.vuejs.org/v2/guide/components.html#data-Must-Be-a-Function`, n));
  for (var e = Object.keys(t), r = n.$options.props, s = n.$options.methods, i = e.length; i--; ) {
    var o = e[i];
    process.env.NODE_ENV !== "production" && s && At(s, o) && T('Method "'.concat(o, '" has already been defined as a data property.'), n), r && At(r, o) ? process.env.NODE_ENV !== "production" && T('The data property "'.concat(o, '" is already declared as a prop. ') + "Use prop default value instead.", n) : Vo(o) || aa(n, "_data", o);
  }
  var a = Ie(t);
  a && a.vmCount++;
}
function Wd(n, t) {
  Vn();
  try {
    return n.call(t, t);
  } catch (e) {
    return Ze(e, t, "data()"), {};
  } finally {
    zn();
  }
}
var qd = { lazy: !0 };
function Kd(n, t) {
  var e = n._computedWatchers = /* @__PURE__ */ Object.create(null), r = Nr();
  for (var s in t) {
    var i = t[s], o = ht(i) ? i : i.get;
    process.env.NODE_ENV !== "production" && o == null && T('Getter is missing for computed property "'.concat(s, '".'), n), r || (e[s] = new Xo(n, o || Ct, Ct, qd)), s in n ? process.env.NODE_ENV !== "production" && (s in n.$data ? T('The computed property "'.concat(s, '" is already defined in data.'), n) : n.$options.props && s in n.$options.props ? T('The computed property "'.concat(s, '" is already defined as a prop.'), n) : n.$options.methods && s in n.$options.methods && T('The computed property "'.concat(s, '" is already defined as a method.'), n)) : au(n, s, i);
  }
}
function au(n, t, e) {
  var r = !Nr();
  ht(e) ? (me.get = r ? ol(t) : al(e), me.set = Ct) : (me.get = e.get ? r && e.cache !== !1 ? ol(t) : al(e.get) : Ct, me.set = e.set || Ct), process.env.NODE_ENV !== "production" && me.set === Ct && (me.set = function() {
    T('Computed property "'.concat(t, '" was assigned to but it has no setter.'), this);
  }), Object.defineProperty(n, t, me);
}
function ol(n) {
  return function() {
    var e = this._computedWatchers && this._computedWatchers[n];
    if (e)
      return e.dirty && e.evaluate(), he.target && (process.env.NODE_ENV !== "production" && he.target.onTrack && he.target.onTrack({
        effect: he.target,
        target: this,
        type: "get",
        key: n
      }), e.depend()), e.value;
  };
}
function al(n) {
  return function() {
    return n.call(this, this);
  };
}
function Yd(n, t) {
  var e = n.$options.props;
  for (var r in t)
    process.env.NODE_ENV !== "production" && (typeof t[r] != "function" && T('Method "'.concat(r, '" has type "').concat(typeof t[r], '" in the component definition. ') + "Did you reference the function correctly?", n), e && At(e, r) && T('Method "'.concat(r, '" has already been defined as a prop.'), n), r in n && Vo(r) && T('Method "'.concat(r, '" conflicts with an existing Vue instance method. ') + "Avoid defining component methods that start with _ or $.")), n[r] = typeof t[r] != "function" ? Ct : O0(t[r], n);
}
function Xd(n, t) {
  for (var e in t) {
    var r = t[e];
    if (z(r))
      for (var s = 0; s < r.length; s++)
        mo(n, e, r[s]);
    else
      mo(n, e, r);
  }
}
function mo(n, t, e, r) {
  return Ut(e) && (r = e, e = e.handler), typeof e == "string" && (e = n[e]), n.$watch(t, e, r);
}
function Qd(n) {
  var t = {};
  t.get = function() {
    return this._data;
  };
  var e = {};
  e.get = function() {
    return this._props;
  }, process.env.NODE_ENV !== "production" && (t.set = function() {
    T("Avoid replacing instance root $data. Use nested data properties instead.", this);
  }, e.set = function() {
    T("$props is readonly.", this);
  }), Object.defineProperty(n.prototype, "$data", t), Object.defineProperty(n.prototype, "$props", e), n.prototype.$set = Zo, n.prototype.$delete = H0, n.prototype.$watch = function(r, s, i) {
    var o = this;
    if (Ut(s))
      return mo(o, r, s, i);
    i = i || {}, i.user = !0;
    var a = new Xo(o, r, s, i);
    if (i.immediate) {
      var l = 'callback for immediate watcher "'.concat(a.expression, '"');
      Vn(), We(s, o, [a.value], o, l), zn();
    }
    return function() {
      a.teardown();
    };
  };
}
var Jd = 0;
function t3(n) {
  n.prototype._init = function(t) {
    var e = this;
    e._uid = Jd++;
    var r, s;
    process.env.NODE_ENV !== "production" && nt.performance && _e && (r = "vue-perf-start:".concat(e._uid), s = "vue-perf-end:".concat(e._uid), _e(r)), e._isVue = !0, e.__v_skip = !0, e._scope = new vf(!0), e._scope._vm = !0, t && t._isComponent ? e3(e, t) : e.$options = cn(la(e.constructor), t || {}, e), process.env.NODE_ENV !== "production" ? ou(e) : e._renderProxy = e, e._self = e, sd(e), Jf(e), Gf(e), Kt(e, "beforeCreate", void 0, !1), xd(e), Vd(e), gd(e), Kt(e, "created"), process.env.NODE_ENV !== "production" && nt.performance && _e && (e._name = tn(e, !1), _e(s), Ns("vue ".concat(e._name, " init"), r, s)), e.$options.el && e.$mount(e.$options.el);
  };
}
function e3(n, t) {
  var e = n.$options = Object.create(n.constructor.options), r = t._parentVnode;
  e.parent = t.parent, e._parentVnode = r;
  var s = r.componentOptions;
  e.propsData = s.propsData, e._parentListeners = s.listeners, e._renderChildren = s.children, e._componentTag = s.tag, t.render && (e.render = t.render, e.staticRenderFns = t.staticRenderFns);
}
function la(n) {
  var t = n.options;
  if (n.super) {
    var e = la(n.super), r = n.superOptions;
    if (e !== r) {
      n.superOptions = e;
      var s = n3(n);
      s && ct(n.extendOptions, s), t = n.options = cn(e, n.extendOptions), t.name && (t.components[t.name] = n);
    }
  }
  return t;
}
function n3(n) {
  var t, e = n.options, r = n.sealedOptions;
  for (var s in e)
    e[s] !== r[s] && (t || (t = {}), t[s] = e[s]);
  return t;
}
function gt(n) {
  process.env.NODE_ENV !== "production" && !(this instanceof gt) && T("Vue is a constructor and should be called with the `new` keyword"), this._init(n);
}
t3(gt);
Qd(gt);
rd(gt);
id(gt);
jf(gt);
function r3(n) {
  n.use = function(t) {
    var e = this._installedPlugins || (this._installedPlugins = []);
    if (e.indexOf(t) > -1)
      return this;
    var r = io(arguments, 1);
    return r.unshift(this), ht(t.install) ? t.install.apply(t, r) : ht(t) && t.apply(null, r), e.push(t), this;
  };
}
function s3(n) {
  n.mixin = function(t) {
    return this.options = cn(this.options, t), this;
  };
}
function i3(n) {
  n.cid = 0;
  var t = 1;
  n.extend = function(e) {
    e = e || {};
    var r = this, s = r.cid, i = e._Ctor || (e._Ctor = {});
    if (i[s])
      return i[s];
    var o = $n(e) || $n(r.options);
    process.env.NODE_ENV !== "production" && o && sa(o);
    var a = function(c) {
      this._init(c);
    };
    return a.prototype = Object.create(r.prototype), a.prototype.constructor = a, a.cid = t++, a.options = cn(r.options, e), a.super = r, a.options.props && o3(a), a.options.computed && a3(a), a.extend = r.extend, a.mixin = r.mixin, a.use = r.use, ti.forEach(function(l) {
      a[l] = r[l];
    }), o && (a.options.components[o] = a), a.superOptions = r.options, a.extendOptions = e, a.sealedOptions = ct({}, a.options), i[s] = a, a;
  };
}
function o3(n) {
  var t = n.options.props;
  for (var e in t)
    aa(n.prototype, "_props", e);
}
function a3(n) {
  var t = n.options.computed;
  for (var e in t)
    au(n.prototype, e, t[e]);
}
function l3(n) {
  ti.forEach(function(t) {
    n[t] = function(e, r) {
      return r ? (process.env.NODE_ENV !== "production" && t === "component" && sa(e), t === "component" && Ut(r) && (r.name = r.name || e, r = this.options._base.extend(r)), t === "directive" && ht(r) && (r = { bind: r, update: r }), this.options[t + "s"][e] = r, r) : this.options[t + "s"][e];
    };
  });
}
function ll(n) {
  return n && ($n(n.Ctor.options) || n.tag);
}
function os(n, t) {
  return z(n) ? n.indexOf(t) > -1 : typeof n == "string" ? n.split(",").indexOf(t) > -1 : A0(n) ? n.test(t) : !1;
}
function cl(n, t) {
  var e = n.cache, r = n.keys, s = n._vnode;
  for (var i in e) {
    var o = e[i];
    if (o) {
      var a = o.name;
      a && !t(a) && _o(e, i, r, s);
    }
  }
}
function _o(n, t, e, r) {
  var s = n[t];
  s && (!r || s.tag !== r.tag) && s.componentInstance.$destroy(), n[t] = null, Ke(e, t);
}
var ul = [String, RegExp, Array], c3 = {
  name: "keep-alive",
  abstract: !0,
  props: {
    include: ul,
    exclude: ul,
    max: [String, Number]
  },
  methods: {
    cacheVNode: function() {
      var n = this, t = n.cache, e = n.keys, r = n.vnodeToCache, s = n.keyToCache;
      if (r) {
        var i = r.tag, o = r.componentInstance, a = r.componentOptions;
        t[s] = {
          name: ll(a),
          tag: i,
          componentInstance: o
        }, e.push(s), this.max && e.length > parseInt(this.max) && _o(t, e[0], e, this._vnode), this.vnodeToCache = null;
      }
    }
  },
  created: function() {
    this.cache = /* @__PURE__ */ Object.create(null), this.keys = [];
  },
  destroyed: function() {
    for (var n in this.cache)
      _o(this.cache, n, this.keys);
  },
  mounted: function() {
    var n = this;
    this.cacheVNode(), this.$watch("include", function(t) {
      cl(n, function(e) {
        return os(t, e);
      });
    }), this.$watch("exclude", function(t) {
      cl(n, function(e) {
        return !os(t, e);
      });
    });
  },
  updated: function() {
    this.cacheVNode();
  },
  render: function() {
    var n = this.$slots.default, t = Y0(n), e = t && t.componentOptions;
    if (e) {
      var r = ll(e), s = this, i = s.include, o = s.exclude;
      if (i && (!r || !os(i, r)) || o && r && os(o, r))
        return t;
      var a = this, l = a.cache, c = a.keys, u = t.key == null ? e.Ctor.cid + (e.tag ? "::".concat(e.tag) : "") : t.key;
      l[u] ? (t.componentInstance = l[u].componentInstance, Ke(c, u), c.push(u)) : (this.vnodeToCache = t, this.keyToCache = u), t.data.keepAlive = !0;
    }
    return t || n && n[0];
  }
}, u3 = {
  KeepAlive: c3
};
function h3(n) {
  var t = {};
  t.get = function() {
    return nt;
  }, process.env.NODE_ENV !== "production" && (t.set = function() {
    T("Do not replace the Vue.config object, set individual fields instead.");
  }), Object.defineProperty(n, "config", t), n.util = {
    warn: T,
    extend: ct,
    mergeOptions: cn,
    defineReactive: fe
  }, n.set = Zo, n.delete = H0, n.nextTick = Yo, n.observable = function(e) {
    return Ie(e), e;
  }, n.options = /* @__PURE__ */ Object.create(null), ti.forEach(function(e) {
    n.options[e + "s"] = /* @__PURE__ */ Object.create(null);
  }), n.options._base = n, ct(n.options.components, u3), r3(n), s3(n), i3(n), l3(n);
}
h3(gt);
Object.defineProperty(gt.prototype, "$isServer", {
  get: Nr
});
Object.defineProperty(gt.prototype, "$ssrContext", {
  get: function() {
    return this.$vnode && this.$vnode.ssrContext;
  }
});
Object.defineProperty(gt, "FunctionalRenderContext", {
  value: ea
});
gt.version = Xf;
var f3 = Qt("style,class"), d3 = Qt("input,textarea,option,select,progress"), p3 = function(n, t, e) {
  return e === "value" && d3(n) && t !== "button" || e === "selected" && n === "option" || e === "checked" && n === "input" || e === "muted" && n === "video";
}, lu = Qt("contenteditable,draggable,spellcheck"), g3 = Qt("events,caret,typing,plaintext-only"), x3 = function(n, t) {
  return Ps(t) || t === "false" ? "false" : n === "contenteditable" && g3(t) ? t : "true";
}, m3 = Qt("allowfullscreen,async,autofocus,autoplay,checked,compact,controls,declare,default,defaultchecked,defaultmuted,defaultselected,defer,disabled,enabled,formnovalidate,hidden,indeterminate,inert,ismap,itemscope,loop,multiple,muted,nohref,noresize,noshade,novalidate,nowrap,open,pauseonexit,readonly,required,reversed,scoped,seamless,selected,sortable,truespeed,typemustmatch,visible"), Lo = "http://www.w3.org/1999/xlink", ca = function(n) {
  return n.charAt(5) === ":" && n.slice(0, 5) === "xlink";
}, cu = function(n) {
  return ca(n) ? n.slice(6, n.length) : "";
}, Ps = function(n) {
  return n == null || n === !1;
};
function _3(n) {
  for (var t = n.data, e = n, r = n; L(r.componentInstance); )
    r = r.componentInstance._vnode, r && r.data && (t = hl(r.data, t));
  for (; L(e = e.parent); )
    e && e.data && (t = hl(t, e.data));
  return L3(t.staticClass, t.class);
}
function hl(n, t) {
  return {
    staticClass: ua(n.staticClass, t.staticClass),
    class: L(n.class) ? [n.class, t.class] : t.class
  };
}
function L3(n, t) {
  return L(n) || L(t) ? ua(n, ha(t)) : "";
}
function ua(n, t) {
  return n ? t ? n + " " + t : n : t || "";
}
function ha(n) {
  return Array.isArray(n) ? v3(n) : St(n) ? y3(n) : typeof n == "string" ? n : "";
}
function v3(n) {
  for (var t = "", e, r = 0, s = n.length; r < s; r++)
    L(e = ha(n[r])) && e !== "" && (t && (t += " "), t += e);
  return t;
}
function y3(n) {
  var t = "";
  for (var e in n)
    n[e] && (t && (t += " "), t += e);
  return t;
}
var C3 = {
  svg: "http://www.w3.org/2000/svg",
  math: "http://www.w3.org/1998/Math/MathML"
}, E3 = Qt("html,body,base,head,link,meta,style,title,address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,s,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,embed,object,param,source,canvas,script,noscript,del,ins,caption,col,colgroup,table,thead,tbody,td,th,tr,button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,output,progress,select,textarea,details,dialog,menu,menuitem,summary,content,element,shadow,template,blockquote,iframe,tfoot"), fa = Qt("svg,animate,circle,clippath,cursor,defs,desc,ellipse,filter,font-face,foreignobject,g,glyph,image,line,marker,mask,missing-glyph,path,pattern,polygon,polyline,rect,switch,symbol,text,textpath,tspan,use,view", !0), uu = function(n) {
  return E3(n) || fa(n);
};
function b3(n) {
  if (fa(n))
    return "svg";
  if (n === "math")
    return "math";
}
var as = /* @__PURE__ */ Object.create(null);
function w3(n) {
  if (!zt)
    return !0;
  if (uu(n))
    return !1;
  if (n = n.toLowerCase(), as[n] != null)
    return as[n];
  var t = document.createElement(n);
  return n.indexOf("-") > -1 ? as[n] = t.constructor === window.HTMLUnknownElement || t.constructor === window.HTMLElement : as[n] = /HTMLUnknownElement/.test(t.toString());
}
var vo = Qt("text,number,password,search,email,tel,url");
function T3(n) {
  if (typeof n == "string") {
    var t = document.querySelector(n);
    return t || (process.env.NODE_ENV !== "production" && T("Cannot find element: " + n), document.createElement("div"));
  } else
    return n;
}
function A3(n, t) {
  var e = document.createElement(n);
  return n !== "select" || t.data && t.data.attrs && t.data.attrs.multiple !== void 0 && e.setAttribute("multiple", "multiple"), e;
}
function S3(n, t) {
  return document.createElementNS(C3[n], t);
}
function R3(n) {
  return document.createTextNode(n);
}
function k3(n) {
  return document.createComment(n);
}
function O3(n, t, e) {
  n.insertBefore(t, e);
}
function N3(n, t) {
  n.removeChild(t);
}
function I3(n, t) {
  n.appendChild(t);
}
function M3(n) {
  return n.parentNode;
}
function P3(n) {
  return n.nextSibling;
}
function $3(n) {
  return n.tagName;
}
function D3(n, t) {
  n.textContent = t;
}
function F3(n, t) {
  n.setAttribute(t, "");
}
var B3 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  createElement: A3,
  createElementNS: S3,
  createTextNode: R3,
  createComment: k3,
  insertBefore: O3,
  removeChild: N3,
  appendChild: I3,
  parentNode: M3,
  nextSibling: P3,
  tagName: $3,
  setTextContent: D3,
  setStyleScope: F3
}), U3 = {
  create: function(n, t) {
    kn(t);
  },
  update: function(n, t) {
    n.data.ref !== t.data.ref && (kn(n, !0), kn(t));
  },
  destroy: function(n) {
    kn(n, !0);
  }
};
function kn(n, t) {
  var e = n.data.ref;
  if (L(e)) {
    var r = n.context, s = n.componentInstance || n.elm, i = t ? null : s, o = t ? void 0 : s;
    if (ht(e)) {
      We(e, r, [i], r, "template ref function");
      return;
    }
    var a = n.data.refInFor, l = typeof e == "string" || typeof e == "number", c = ye(e), u = r.$refs;
    if (l || c)
      if (a) {
        var f = l ? u[e] : e.value;
        t ? z(f) && Ke(f, s) : z(f) ? f.includes(s) || f.push(s) : l ? (u[e] = [s], fl(r, e, u[e])) : e.value = [s];
      } else if (l) {
        if (t && u[e] !== s)
          return;
        u[e] = o, fl(r, e, i);
      } else if (c) {
        if (t && e.value !== s)
          return;
        e.value = i;
      } else
        process.env.NODE_ENV !== "production" && T("Invalid template ref type: ".concat(typeof e));
  }
}
function fl(n, t, e) {
  var r = n._setupState;
  r && At(r, t) && (ye(r[t]) ? r[t].value = e : r[t] = e);
}
var Be = new Vt("", {}, []), nr = ["create", "activate", "update", "remove", "destroy"];
function Xe(n, t) {
  return n.key === t.key && n.asyncFactory === t.asyncFactory && (n.tag === t.tag && n.isComment === t.isComment && L(n.data) === L(t.data) && H3(n, t) || _t(n.isAsyncPlaceholder) && G(t.asyncFactory.error));
}
function H3(n, t) {
  if (n.tag !== "input")
    return !0;
  var e, r = L(e = n.data) && L(e = e.attrs) && e.type, s = L(e = t.data) && L(e = e.attrs) && e.type;
  return r === s || vo(r) && vo(s);
}
function G3(n, t, e) {
  var r, s, i = {};
  for (r = t; r <= e; ++r)
    s = n[r].key, L(s) && (i[s] = r);
  return i;
}
function j3(n) {
  var t, e, r = {}, s = n.modules, i = n.nodeOps;
  for (t = 0; t < nr.length; ++t)
    for (r[nr[t]] = [], e = 0; e < s.length; ++e)
      L(s[e][nr[t]]) && r[nr[t]].push(s[e][nr[t]]);
  function o(x) {
    return new Vt(i.tagName(x).toLowerCase(), {}, [], void 0, x);
  }
  function a(x, g) {
    function C() {
      --C.listeners === 0 && l(x);
    }
    return C.listeners = g, C;
  }
  function l(x) {
    var g = i.parentNode(x);
    L(g) && i.removeChild(g, x);
  }
  function c(x, g) {
    return !g && !x.ns && !(nt.ignoredElements.length && nt.ignoredElements.some(function(C) {
      return A0(C) ? C.test(x.tag) : C === x.tag;
    })) && nt.isUnknownElement(x.tag);
  }
  var u = 0;
  function f(x, g, C, S, B, X, y) {
    if (L(x.elm) && L(X) && (x = X[y] = ao(x)), x.isRootInsert = !B, !d(x, g, C, S)) {
      var E = x.data, O = x.children, M = x.tag;
      L(M) ? (process.env.NODE_ENV !== "production" && (E && E.pre && u++, c(x, u) && T("Unknown custom element: <" + M + '> - did you register the component correctly? For recursive components, make sure to provide the "name" option.', x.context)), x.elm = x.ns ? i.createElementNS(x.ns, M) : i.createElement(M, x), it(x), W(x, O, g), L(E) && j(x, g), I(C, x.elm, S), process.env.NODE_ENV !== "production" && E && E.pre && u--) : _t(x.isComment) ? (x.elm = i.createComment(x.text), I(C, x.elm, S)) : (x.elm = i.createTextNode(x.text), I(C, x.elm, S));
    }
  }
  function d(x, g, C, S) {
    var B = x.data;
    if (L(B)) {
      var X = L(x.componentInstance) && B.keepAlive;
      if (L(B = B.hook) && L(B = B.init) && B(x, !1), L(x.componentInstance))
        return p(x, g), I(C, x.elm, S), _t(X) && w(x, g, C, S), !0;
    }
  }
  function p(x, g) {
    L(x.data.pendingInsert) && (g.push.apply(g, x.data.pendingInsert), x.data.pendingInsert = null), x.elm = x.componentInstance.$el, $(x) ? (j(x, g), it(x)) : (kn(x), g.push(x));
  }
  function w(x, g, C, S) {
    for (var B, X = x; X.componentInstance; )
      if (X = X.componentInstance._vnode, L(B = X.data) && L(B = B.transition)) {
        for (B = 0; B < r.activate.length; ++B)
          r.activate[B](Be, X);
        g.push(X);
        break;
      }
    I(C, x.elm, S);
  }
  function I(x, g, C) {
    L(x) && (L(C) ? i.parentNode(C) === x && i.insertBefore(x, g, C) : i.appendChild(x, g));
  }
  function W(x, g, C) {
    if (z(g)) {
      process.env.NODE_ENV !== "production" && ce(g);
      for (var S = 0; S < g.length; ++S)
        f(g[S], C, x.elm, null, !0, g, S);
    } else
      $e(x.text) && i.appendChild(x.elm, i.createTextNode(String(x.text)));
  }
  function $(x) {
    for (; x.componentInstance; )
      x = x.componentInstance._vnode;
    return L(x.tag);
  }
  function j(x, g) {
    for (var C = 0; C < r.create.length; ++C)
      r.create[C](Be, x);
    t = x.data.hook, L(t) && (L(t.create) && t.create(Be, x), L(t.insert) && g.push(x));
  }
  function it(x) {
    var g;
    if (L(g = x.fnScopeId))
      i.setStyleScope(x.elm, g);
    else
      for (var C = x; C; )
        L(g = C.context) && L(g = g.$options._scopeId) && i.setStyleScope(x.elm, g), C = C.parent;
    L(g = rn) && g !== x.context && g !== x.fnContext && L(g = g.$options._scopeId) && i.setStyleScope(x.elm, g);
  }
  function Y(x, g, C, S, B, X) {
    for (; S <= B; ++S)
      f(C[S], X, x, g, !1, C, S);
  }
  function ft(x) {
    var g, C, S = x.data;
    if (L(S))
      for (L(g = S.hook) && L(g = g.destroy) && g(x), g = 0; g < r.destroy.length; ++g)
        r.destroy[g](x);
    if (L(g = x.children))
      for (C = 0; C < x.children.length; ++C)
        ft(x.children[C]);
  }
  function rt(x, g, C) {
    for (; g <= C; ++g) {
      var S = x[g];
      L(S) && (L(S.tag) ? (dt(S), ft(S)) : l(S.elm));
    }
  }
  function dt(x, g) {
    if (L(g) || L(x.data)) {
      var C, S = r.remove.length + 1;
      for (L(g) ? g.listeners += S : g = a(x.elm, S), L(C = x.componentInstance) && L(C = C._vnode) && L(C.data) && dt(C, g), C = 0; C < r.remove.length; ++C)
        r.remove[C](x, g);
      L(C = x.data.hook) && L(C = C.remove) ? C(x, g) : g();
    } else
      l(x.elm);
  }
  function It(x, g, C, S, B) {
    var X = 0, y = 0, E = g.length - 1, O = g[0], M = g[E], U = C.length - 1, ot = C[0], xt = C[U], wt, Et, Rt, Yr, tr = !B;
    for (process.env.NODE_ENV !== "production" && ce(C); X <= E && y <= U; )
      G(O) ? O = g[++X] : G(M) ? M = g[--E] : Xe(O, ot) ? (ue(O, ot, S, C, y), O = g[++X], ot = C[++y]) : Xe(M, xt) ? (ue(M, xt, S, C, U), M = g[--E], xt = C[--U]) : Xe(O, xt) ? (ue(O, xt, S, C, U), tr && i.insertBefore(x, O.elm, i.nextSibling(M.elm)), O = g[++X], xt = C[--U]) : Xe(M, ot) ? (ue(M, ot, S, C, y), tr && i.insertBefore(x, M.elm, O.elm), M = g[--E], ot = C[++y]) : (G(wt) && (wt = G3(g, X, E)), Et = L(ot.key) ? wt[ot.key] : _n(ot, g, X, E), G(Et) ? f(ot, S, x, O.elm, !1, C, y) : (Rt = g[Et], Xe(Rt, ot) ? (ue(Rt, ot, S, C, y), g[Et] = void 0, tr && i.insertBefore(x, Rt.elm, O.elm)) : f(ot, S, x, O.elm, !1, C, y)), ot = C[++y]);
    X > E ? (Yr = G(C[U + 1]) ? null : C[U + 1].elm, Y(x, Yr, C, y, U, S)) : y > U && rt(g, X, E);
  }
  function ce(x) {
    for (var g = {}, C = 0; C < x.length; C++) {
      var S = x[C], B = S.key;
      L(B) && (g[B] ? T("Duplicate keys detected: '".concat(B, "'. This may cause an update error."), S.context) : g[B] = !0);
    }
  }
  function _n(x, g, C, S) {
    for (var B = C; B < S; B++) {
      var X = g[B];
      if (L(X) && Xe(x, X))
        return B;
    }
  }
  function ue(x, g, C, S, B, X) {
    if (x !== g) {
      L(g.elm) && L(S) && (g = S[B] = ao(g));
      var y = g.elm = x.elm;
      if (_t(x.isAsyncPlaceholder)) {
        L(g.asyncFactory.resolved) ? bt(x.elm, g, C) : g.isAsyncPlaceholder = !0;
        return;
      }
      if (_t(g.isStatic) && _t(x.isStatic) && g.key === x.key && (_t(g.isCloned) || _t(g.isOnce))) {
        g.componentInstance = x.componentInstance;
        return;
      }
      var E, O = g.data;
      L(O) && L(E = O.hook) && L(E = E.prepatch) && E(x, g);
      var M = x.children, U = g.children;
      if (L(O) && $(g)) {
        for (E = 0; E < r.update.length; ++E)
          r.update[E](x, g);
        L(E = O.hook) && L(E = E.update) && E(x, g);
      }
      G(g.text) ? L(M) && L(U) ? M !== U && It(y, M, U, C, X) : L(U) ? (process.env.NODE_ENV !== "production" && ce(U), L(x.text) && i.setTextContent(y, ""), Y(y, null, U, 0, U.length - 1, C)) : L(M) ? rt(M, 0, M.length - 1) : L(x.text) && i.setTextContent(y, "") : x.text !== g.text && i.setTextContent(y, g.text), L(O) && L(E = O.hook) && L(E = E.postpatch) && E(x, g);
    }
  }
  function ge(x, g, C) {
    if (_t(C) && L(x.parent))
      x.parent.data.pendingInsert = g;
    else
      for (var S = 0; S < g.length; ++S)
        g[S].data.hook.insert(g[S]);
  }
  var Te = !1, Ln = Qt("attrs,class,staticClass,staticStyle,key");
  function bt(x, g, C, S) {
    var B, X = g.tag, y = g.data, E = g.children;
    if (S = S || y && y.pre, g.elm = x, _t(g.isComment) && L(g.asyncFactory))
      return g.isAsyncPlaceholder = !0, !0;
    if (process.env.NODE_ENV !== "production" && !Ae(x, g, S))
      return !1;
    if (L(y) && (L(B = y.hook) && L(B = B.init) && B(g, !0), L(B = g.componentInstance)))
      return p(g, C), !0;
    if (L(X)) {
      if (L(E))
        if (!x.hasChildNodes())
          W(g, E, C);
        else if (L(B = y) && L(B = B.domProps) && L(B = B.innerHTML)) {
          if (B !== x.innerHTML)
            return process.env.NODE_ENV !== "production" && typeof console < "u" && !Te && (Te = !0, console.warn("Parent: ", x), console.warn("server innerHTML: ", B), console.warn("client innerHTML: ", x.innerHTML)), !1;
        } else {
          for (var O = !0, M = x.firstChild, U = 0; U < E.length; U++) {
            if (!M || !bt(M, E[U], C, S)) {
              O = !1;
              break;
            }
            M = M.nextSibling;
          }
          if (!O || M)
            return process.env.NODE_ENV !== "production" && typeof console < "u" && !Te && (Te = !0, console.warn("Parent: ", x), console.warn("Mismatching childNodes vs. VNodes: ", x.childNodes, E)), !1;
        }
      if (L(y)) {
        var ot = !1;
        for (var xt in y)
          if (!Ln(xt)) {
            ot = !0, j(g, C);
            break;
          }
        !ot && y.class && Os(y.class);
      }
    } else
      x.data !== g.text && (x.data = g.text);
    return !0;
  }
  function Ae(x, g, C) {
    return L(g.tag) ? g.tag.indexOf("vue-component") === 0 || !c(g, C) && g.tag.toLowerCase() === (x.tagName && x.tagName.toLowerCase()) : x.nodeType === (g.isComment ? 8 : 3);
  }
  return function(g, C, S, B) {
    if (G(C)) {
      L(g) && ft(g);
      return;
    }
    var X = !1, y = [];
    if (G(g))
      X = !0, f(C, y);
    else {
      var E = L(g.nodeType);
      if (!E && Xe(g, C))
        ue(g, C, y, null, null, B);
      else {
        if (E) {
          if (g.nodeType === 1 && g.hasAttribute(M1) && (g.removeAttribute(M1), S = !0), _t(S)) {
            if (bt(g, C, y))
              return ge(C, y, !0), g;
            process.env.NODE_ENV !== "production" && T("The client-side rendered virtual DOM tree is not matching server-rendered content. This is likely caused by incorrect HTML markup, for example nesting block-level elements inside <p>, or missing <tbody>. Bailing hydration and performing full client-side render.");
          }
          g = o(g);
        }
        var O = g.elm, M = i.parentNode(O);
        if (f(
          C,
          y,
          O._leaveCb ? null : M,
          i.nextSibling(O)
        ), L(C.parent))
          for (var U = C.parent, ot = $(C); U; ) {
            for (var xt = 0; xt < r.destroy.length; ++xt)
              r.destroy[xt](U);
            if (U.elm = C.elm, ot) {
              for (var wt = 0; wt < r.create.length; ++wt)
                r.create[wt](Be, U);
              var Et = U.data.hook.insert;
              if (Et.merged)
                for (var Rt = 1; Rt < Et.fns.length; Rt++)
                  Et.fns[Rt]();
            } else
              kn(U);
            U = U.parent;
          }
        L(M) ? rt([g], 0, 0) : L(g.tag) && ft(g);
      }
    }
    return ge(C, y, X), C.elm;
  };
}
var V3 = {
  create: Bi,
  update: Bi,
  destroy: function(t) {
    Bi(t, Be);
  }
};
function Bi(n, t) {
  (n.data.directives || t.data.directives) && z3(n, t);
}
function z3(n, t) {
  var e = n === Be, r = t === Be, s = dl(n.data.directives, n.context), i = dl(t.data.directives, t.context), o = [], a = [], l, c, u;
  for (l in i)
    c = s[l], u = i[l], c ? (u.oldValue = c.value, u.oldArg = c.arg, rr(u, "update", t, n), u.def && u.def.componentUpdated && a.push(u)) : (rr(u, "bind", t, n), u.def && u.def.inserted && o.push(u));
  if (o.length) {
    var f = function() {
      for (var d = 0; d < o.length; d++)
        rr(o[d], "inserted", t, n);
    };
    e ? Fe(t, "insert", f) : f();
  }
  if (a.length && Fe(t, "postpatch", function() {
    for (var d = 0; d < a.length; d++)
      rr(a[d], "componentUpdated", t, n);
  }), !e)
    for (l in s)
      i[l] || rr(s[l], "unbind", n, n, r);
}
var Z3 = /* @__PURE__ */ Object.create(null);
function dl(n, t) {
  var e = /* @__PURE__ */ Object.create(null);
  if (!n)
    return e;
  var r, s;
  for (r = 0; r < n.length; r++) {
    if (s = n[r], s.modifiers || (s.modifiers = Z3), e[W3(s)] = s, t._setupState && t._setupState.__sfc) {
      var i = s.def || Is(t, "_setupState", "v-" + s.name);
      typeof i == "function" ? s.def = {
        bind: i,
        update: i
      } : s.def = i;
    }
    s.def = s.def || Is(t.$options, "directives", s.name, !0);
  }
  return e;
}
function W3(n) {
  return n.rawName || "".concat(n.name, ".").concat(Object.keys(n.modifiers || {}).join("."));
}
function rr(n, t, e, r, s) {
  var i = n.def && n.def[t];
  if (i)
    try {
      i(e.elm, n, e, r, s);
    } catch (o) {
      Ze(o, e.context, "directive ".concat(n.name, " ").concat(t, " hook"));
    }
}
var q3 = [U3, V3];
function pl(n, t) {
  var e = t.componentOptions;
  if (!(L(e) && e.Ctor.options.inheritAttrs === !1) && !(G(n.data.attrs) && G(t.data.attrs))) {
    var r, s, i, o = t.elm, a = n.data.attrs || {}, l = t.data.attrs || {};
    (L(l.__ob__) || _t(l._v_attr_proxy)) && (l = t.data.attrs = ct({}, l));
    for (r in l)
      s = l[r], i = a[r], i !== s && gl(o, r, s, t.data.pre);
    (Gn || D0) && l.value !== a.value && gl(o, "value", l.value);
    for (r in a)
      G(l[r]) && (ca(r) ? o.removeAttributeNS(Lo, cu(r)) : lu(r) || o.removeAttribute(r));
  }
}
function gl(n, t, e, r) {
  r || n.tagName.indexOf("-") > -1 ? xl(n, t, e) : m3(t) ? Ps(e) ? n.removeAttribute(t) : (e = t === "allowfullscreen" && n.tagName === "EMBED" ? "true" : t, n.setAttribute(t, e)) : lu(t) ? n.setAttribute(t, x3(t, e)) : ca(t) ? Ps(e) ? n.removeAttributeNS(Lo, cu(t)) : n.setAttributeNS(Lo, t, e) : xl(n, t, e);
}
function xl(n, t, e) {
  if (Ps(e))
    n.removeAttribute(t);
  else {
    if (Gn && !jn && n.tagName === "TEXTAREA" && t === "placeholder" && e !== "" && !n.__ieph) {
      var r = function(s) {
        s.stopImmediatePropagation(), n.removeEventListener("input", r);
      };
      n.addEventListener("input", r), n.__ieph = !0;
    }
    n.setAttribute(t, e);
  }
}
var K3 = {
  create: pl,
  update: pl
};
function ml(n, t) {
  var e = t.elm, r = t.data, s = n.data;
  if (!(G(r.staticClass) && G(r.class) && (G(s) || G(s.staticClass) && G(s.class)))) {
    var i = _3(t), o = e._transitionClasses;
    L(o) && (i = ua(i, ha(o))), i !== e._prevClass && (e.setAttribute("class", i), e._prevClass = i);
  }
}
var Y3 = {
  create: ml,
  update: ml
}, Ui = "__r", Hi = "__c";
function X3(n) {
  if (L(n[Ui])) {
    var t = Gn ? "change" : "input";
    n[t] = [].concat(n[Ui], n[t] || []), delete n[Ui];
  }
  L(n[Hi]) && (n.change = [].concat(n[Hi], n.change || []), delete n[Hi]);
}
var Tr;
function Q3(n, t, e) {
  var r = Tr;
  return function s() {
    var i = t.apply(null, arguments);
    i !== null && hu(n, s, e, r);
  };
}
var J3 = ho && !(P1 && Number(P1[1]) <= 53);
function t4(n, t, e, r) {
  if (J3) {
    var s = ru, i = t;
    t = i._wrapper = function(o) {
      if (o.target === o.currentTarget || o.timeStamp >= s || o.timeStamp <= 0 || o.target.ownerDocument !== document)
        return i.apply(this, arguments);
    };
  }
  Tr.addEventListener(n, t, F0 ? { capture: e, passive: r } : e);
}
function hu(n, t, e, r) {
  (r || Tr).removeEventListener(
    n,
    t._wrapper || t,
    e
  );
}
function Gi(n, t) {
  if (!(G(n.data.on) && G(t.data.on))) {
    var e = t.data.on || {}, r = n.data.on || {};
    Tr = t.elm || n.elm, X3(e), V0(e, r, t4, hu, Q3, t.context), Tr = void 0;
  }
}
var e4 = {
  create: Gi,
  update: Gi,
  destroy: function(n) {
    return Gi(n, Be);
  }
}, ls;
function _l(n, t) {
  if (!(G(n.data.domProps) && G(t.data.domProps))) {
    var e, r, s = t.elm, i = n.data.domProps || {}, o = t.data.domProps || {};
    (L(o.__ob__) || _t(o._v_attr_proxy)) && (o = t.data.domProps = ct({}, o));
    for (e in i)
      e in o || (s[e] = "");
    for (e in o) {
      if (r = o[e], e === "textContent" || e === "innerHTML") {
        if (t.children && (t.children.length = 0), r === i[e])
          continue;
        s.childNodes.length === 1 && s.removeChild(s.childNodes[0]);
      }
      if (e === "value" && s.tagName !== "PROGRESS") {
        s._value = r;
        var a = G(r) ? "" : String(r);
        n4(s, a) && (s.value = a);
      } else if (e === "innerHTML" && fa(s.tagName) && G(s.innerHTML)) {
        ls = ls || document.createElement("div"), ls.innerHTML = "<svg>".concat(r, "</svg>");
        for (var l = ls.firstChild; s.firstChild; )
          s.removeChild(s.firstChild);
        for (; l.firstChild; )
          s.appendChild(l.firstChild);
      } else if (r !== i[e])
        try {
          s[e] = r;
        } catch {
        }
    }
  }
}
function n4(n, t) {
  return !n.composing && (n.tagName === "OPTION" || r4(n, t) || s4(n, t));
}
function r4(n, t) {
  var e = !0;
  try {
    e = document.activeElement !== n;
  } catch {
  }
  return e && n.value !== t;
}
function s4(n, t) {
  var e = n.value, r = n._vModifiers;
  if (L(r)) {
    if (r.number)
      return Lr(e) !== Lr(t);
    if (r.trim)
      return e.trim() !== t.trim();
  }
  return e !== t;
}
var i4 = {
  create: _l,
  update: _l
}, o4 = hn(function(n) {
  var t = {}, e = /;(?![^(]*\))/g, r = /:(.+)/;
  return n.split(e).forEach(function(s) {
    if (s) {
      var i = s.split(r);
      i.length > 1 && (t[i[0].trim()] = i[1].trim());
    }
  }), t;
});
function ji(n) {
  var t = fu(n.style);
  return n.staticStyle ? ct(n.staticStyle, t) : t;
}
function fu(n) {
  return Array.isArray(n) ? N0(n) : typeof n == "string" ? o4(n) : n;
}
function a4(n, t) {
  var e = {}, r;
  if (t)
    for (var s = n; s.componentInstance; )
      s = s.componentInstance._vnode, s && s.data && (r = ji(s.data)) && ct(e, r);
  (r = ji(n.data)) && ct(e, r);
  for (var i = n; i = i.parent; )
    i.data && (r = ji(i.data)) && ct(e, r);
  return e;
}
var l4 = /^--/, Ll = /\s*!important$/, vl = function(n, t, e) {
  if (l4.test(t))
    n.style.setProperty(t, e);
  else if (Ll.test(e))
    n.style.setProperty(fn(t), e.replace(Ll, ""), "important");
  else {
    var r = c4(t);
    if (Array.isArray(e))
      for (var s = 0, i = e.length; s < i; s++)
        n.style[r] = e[s];
    else
      n.style[r] = e;
  }
}, yl = ["Webkit", "Moz", "ms"], cs, c4 = hn(function(n) {
  if (cs = cs || document.createElement("div").style, n = an(n), n !== "filter" && n in cs)
    return n;
  for (var t = n.charAt(0).toUpperCase() + n.slice(1), e = 0; e < yl.length; e++) {
    var r = yl[e] + t;
    if (r in cs)
      return r;
  }
});
function Cl(n, t) {
  var e = t.data, r = n.data;
  if (!(G(e.staticStyle) && G(e.style) && G(r.staticStyle) && G(r.style))) {
    var s, i, o = t.elm, a = r.staticStyle, l = r.normalizedStyle || r.style || {}, c = a || l, u = fu(t.data.style) || {};
    t.data.normalizedStyle = L(u.__ob__) ? ct({}, u) : u;
    var f = a4(t, !0);
    for (i in c)
      G(f[i]) && vl(o, i, "");
    for (i in f)
      s = f[i], s !== c[i] && vl(o, i, s ?? "");
  }
}
var u4 = {
  create: Cl,
  update: Cl
}, du = /\s+/;
function pu(n, t) {
  if (!(!t || !(t = t.trim())))
    if (n.classList)
      t.indexOf(" ") > -1 ? t.split(du).forEach(function(r) {
        return n.classList.add(r);
      }) : n.classList.add(t);
    else {
      var e = " ".concat(n.getAttribute("class") || "", " ");
      e.indexOf(" " + t + " ") < 0 && n.setAttribute("class", (e + t).trim());
    }
}
function gu(n, t) {
  if (!(!t || !(t = t.trim())))
    if (n.classList)
      t.indexOf(" ") > -1 ? t.split(du).forEach(function(s) {
        return n.classList.remove(s);
      }) : n.classList.remove(t), n.classList.length || n.removeAttribute("class");
    else {
      for (var e = " ".concat(n.getAttribute("class") || "", " "), r = " " + t + " "; e.indexOf(r) >= 0; )
        e = e.replace(r, " ");
      e = e.trim(), e ? n.setAttribute("class", e) : n.removeAttribute("class");
    }
}
function xu(n) {
  if (n) {
    if (typeof n == "object") {
      var t = {};
      return n.css !== !1 && ct(t, El(n.name || "v")), ct(t, n), t;
    } else if (typeof n == "string")
      return El(n);
  }
}
var El = hn(function(n) {
  return {
    enterClass: "".concat(n, "-enter"),
    enterToClass: "".concat(n, "-enter-to"),
    enterActiveClass: "".concat(n, "-enter-active"),
    leaveClass: "".concat(n, "-leave"),
    leaveToClass: "".concat(n, "-leave-to"),
    leaveActiveClass: "".concat(n, "-leave-active")
  };
}), mu = zt && !jn, An = "transition", Vi = "animation", Cs = "transition", $s = "transitionend", yo = "animation", _u = "animationend";
mu && (window.ontransitionend === void 0 && window.onwebkittransitionend !== void 0 && (Cs = "WebkitTransition", $s = "webkitTransitionEnd"), window.onanimationend === void 0 && window.onwebkitanimationend !== void 0 && (yo = "WebkitAnimation", _u = "webkitAnimationEnd"));
var bl = zt ? window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : setTimeout : function(n) {
  return n();
};
function Lu(n) {
  bl(function() {
    bl(n);
  });
}
function sn(n, t) {
  var e = n._transitionClasses || (n._transitionClasses = []);
  e.indexOf(t) < 0 && (e.push(t), pu(n, t));
}
function ke(n, t) {
  n._transitionClasses && Ke(n._transitionClasses, t), gu(n, t);
}
function vu(n, t, e) {
  var r = yu(n, t), s = r.type, i = r.timeout, o = r.propCount;
  if (!s)
    return e();
  var a = s === An ? $s : _u, l = 0, c = function() {
    n.removeEventListener(a, u), e();
  }, u = function(f) {
    f.target === n && ++l >= o && c();
  };
  setTimeout(function() {
    l < o && c();
  }, i + 1), n.addEventListener(a, u);
}
var h4 = /\b(transform|all)(,|$)/;
function yu(n, t) {
  var e = window.getComputedStyle(n), r = (e[Cs + "Delay"] || "").split(", "), s = (e[Cs + "Duration"] || "").split(", "), i = wl(r, s), o = (e[yo + "Delay"] || "").split(", "), a = (e[yo + "Duration"] || "").split(", "), l = wl(o, a), c, u = 0, f = 0;
  t === An ? i > 0 && (c = An, u = i, f = s.length) : t === Vi ? l > 0 && (c = Vi, u = l, f = a.length) : (u = Math.max(i, l), c = u > 0 ? i > l ? An : Vi : null, f = c ? c === An ? s.length : a.length : 0);
  var d = c === An && h4.test(e[Cs + "Property"]);
  return {
    type: c,
    timeout: u,
    propCount: f,
    hasTransform: d
  };
}
function wl(n, t) {
  for (; n.length < t.length; )
    n = n.concat(n);
  return Math.max.apply(null, t.map(function(e, r) {
    return Tl(e) + Tl(n[r]);
  }));
}
function Tl(n) {
  return Number(n.slice(0, -1).replace(",", ".")) * 1e3;
}
function Co(n, t) {
  var e = n.elm;
  L(e._leaveCb) && (e._leaveCb.cancelled = !0, e._leaveCb());
  var r = xu(n.data.transition);
  if (!G(r) && !(L(e._enterCb) || e.nodeType !== 1)) {
    for (var s = r.css, i = r.type, o = r.enterClass, a = r.enterToClass, l = r.enterActiveClass, c = r.appearClass, u = r.appearToClass, f = r.appearActiveClass, d = r.beforeEnter, p = r.enter, w = r.afterEnter, I = r.enterCancelled, W = r.beforeAppear, $ = r.appear, j = r.afterAppear, it = r.appearCancelled, Y = r.duration, ft = rn, rt = rn.$vnode; rt && rt.parent; )
      ft = rt.context, rt = rt.parent;
    var dt = !ft._isMounted || !n.isRootInsert;
    if (!(dt && !$ && $ !== "")) {
      var It = dt && c ? c : o, ce = dt && f ? f : l, _n = dt && u ? u : a, ue = dt && W || d, ge = dt && ht($) ? $ : p, Te = dt && j || w, Ln = dt && it || I, bt = Lr(St(Y) ? Y.enter : Y);
      process.env.NODE_ENV !== "production" && bt != null && Eu(bt, "enter", n);
      var Ae = s !== !1 && !jn, x = da(ge), g = e._enterCb = ws(function() {
        Ae && (ke(e, _n), ke(e, ce)), g.cancelled ? (Ae && ke(e, It), Ln && Ln(e)) : Te && Te(e), e._enterCb = null;
      });
      n.data.show || Fe(n, "insert", function() {
        var C = e.parentNode, S = C && C._pending && C._pending[n.key];
        S && S.tag === n.tag && S.elm._leaveCb && S.elm._leaveCb(), ge && ge(e, g);
      }), ue && ue(e), Ae && (sn(e, It), sn(e, ce), Lu(function() {
        ke(e, It), g.cancelled || (sn(e, _n), x || (bu(bt) ? setTimeout(g, bt) : vu(e, i, g)));
      })), n.data.show && (t && t(), ge && ge(e, g)), !Ae && !x && g();
    }
  }
}
function Cu(n, t) {
  var e = n.elm;
  L(e._enterCb) && (e._enterCb.cancelled = !0, e._enterCb());
  var r = xu(n.data.transition);
  if (G(r) || e.nodeType !== 1)
    return t();
  if (L(e._leaveCb))
    return;
  var s = r.css, i = r.type, o = r.leaveClass, a = r.leaveToClass, l = r.leaveActiveClass, c = r.beforeLeave, u = r.leave, f = r.afterLeave, d = r.leaveCancelled, p = r.delayLeave, w = r.duration, I = s !== !1 && !jn, W = da(u), $ = Lr(St(w) ? w.leave : w);
  process.env.NODE_ENV !== "production" && L($) && Eu($, "leave", n);
  var j = e._leaveCb = ws(function() {
    e.parentNode && e.parentNode._pending && (e.parentNode._pending[n.key] = null), I && (ke(e, a), ke(e, l)), j.cancelled ? (I && ke(e, o), d && d(e)) : (t(), f && f(e)), e._leaveCb = null;
  });
  p ? p(it) : it();
  function it() {
    j.cancelled || (!n.data.show && e.parentNode && ((e.parentNode._pending || (e.parentNode._pending = {}))[n.key] = n), c && c(e), I && (sn(e, o), sn(e, l), Lu(function() {
      ke(e, o), j.cancelled || (sn(e, a), W || (bu($) ? setTimeout(j, $) : vu(e, i, j)));
    })), u && u(e, j), !I && !W && j());
  }
}
function Eu(n, t, e) {
  typeof n != "number" ? T("<transition> explicit ".concat(t, " duration is not a valid number - ") + "got ".concat(JSON.stringify(n), "."), e.context) : isNaN(n) && T("<transition> explicit ".concat(t, " duration is NaN - ") + "the duration expression might be incorrect.", e.context);
}
function bu(n) {
  return typeof n == "number" && !isNaN(n);
}
function da(n) {
  if (G(n))
    return !1;
  var t = n.fns;
  return L(t) ? da(Array.isArray(t) ? t[0] : t) : (n._length || n.length) > 1;
}
function Al(n, t) {
  t.data.show !== !0 && Co(t);
}
var f4 = zt ? {
  create: Al,
  activate: Al,
  remove: function(n, t) {
    n.data.show !== !0 ? Cu(n, t) : t();
  }
} : {}, d4 = [K3, Y3, e4, i4, u4, f4], p4 = d4.concat(q3), g4 = j3({ nodeOps: B3, modules: p4 });
jn && document.addEventListener("selectionchange", function() {
  var n = document.activeElement;
  n && n.vmodel && pa(n, "input");
});
var wu = {
  inserted: function(n, t, e, r) {
    e.tag === "select" ? (r.elm && !r.elm._vOptions ? Fe(e, "postpatch", function() {
      wu.componentUpdated(n, t, e);
    }) : Sl(n, t, e.context), n._vOptions = [].map.call(n.options, Ds)) : (e.tag === "textarea" || vo(n.type)) && (n._vModifiers = t.modifiers, t.modifiers.lazy || (n.addEventListener("compositionstart", x4), n.addEventListener("compositionend", Ol), n.addEventListener("change", Ol), jn && (n.vmodel = !0)));
  },
  componentUpdated: function(n, t, e) {
    if (e.tag === "select") {
      Sl(n, t, e.context);
      var r = n._vOptions, s = n._vOptions = [].map.call(n.options, Ds);
      if (s.some(function(o, a) {
        return !ln(o, r[a]);
      })) {
        var i = n.multiple ? t.value.some(function(o) {
          return kl(o, s);
        }) : t.value !== t.oldValue && kl(t.value, s);
        i && pa(n, "change");
      }
    }
  }
};
function Sl(n, t, e) {
  Rl(n, t, e), (Gn || D0) && setTimeout(function() {
    Rl(n, t, e);
  }, 0);
}
function Rl(n, t, e) {
  var r = t.value, s = n.multiple;
  if (s && !Array.isArray(r)) {
    process.env.NODE_ENV !== "production" && T('<select multiple v-model="'.concat(t.expression, '"> ') + "expects an Array value for its binding, but got ".concat(Object.prototype.toString.call(r).slice(8, -1)), e);
    return;
  }
  for (var i, o, a = 0, l = n.options.length; a < l; a++)
    if (o = n.options[a], s)
      i = M0(r, Ds(o)) > -1, o.selected !== i && (o.selected = i);
    else if (ln(Ds(o), r)) {
      n.selectedIndex !== a && (n.selectedIndex = a);
      return;
    }
  s || (n.selectedIndex = -1);
}
function kl(n, t) {
  return t.every(function(e) {
    return !ln(e, n);
  });
}
function Ds(n) {
  return "_value" in n ? n._value : n.value;
}
function x4(n) {
  n.target.composing = !0;
}
function Ol(n) {
  n.target.composing && (n.target.composing = !1, pa(n.target, "input"));
}
function pa(n, t) {
  var e = document.createEvent("HTMLEvents");
  e.initEvent(t, !0, !0), n.dispatchEvent(e);
}
function Eo(n) {
  return n.componentInstance && (!n.data || !n.data.transition) ? Eo(n.componentInstance._vnode) : n;
}
var m4 = {
  bind: function(n, t, e) {
    var r = t.value;
    e = Eo(e);
    var s = e.data && e.data.transition, i = n.__vOriginalDisplay = n.style.display === "none" ? "" : n.style.display;
    r && s ? (e.data.show = !0, Co(e, function() {
      n.style.display = i;
    })) : n.style.display = r ? i : "none";
  },
  update: function(n, t, e) {
    var r = t.value, s = t.oldValue;
    if (!r != !s) {
      e = Eo(e);
      var i = e.data && e.data.transition;
      i ? (e.data.show = !0, r ? Co(e, function() {
        n.style.display = n.__vOriginalDisplay;
      }) : Cu(e, function() {
        n.style.display = "none";
      })) : n.style.display = r ? n.__vOriginalDisplay : "none";
    }
  },
  unbind: function(n, t, e, r, s) {
    s || (n.style.display = n.__vOriginalDisplay);
  }
}, _4 = {
  model: wu,
  show: m4
}, Tu = {
  name: String,
  appear: Boolean,
  css: Boolean,
  mode: String,
  type: String,
  enterClass: String,
  leaveClass: String,
  enterToClass: String,
  leaveToClass: String,
  enterActiveClass: String,
  leaveActiveClass: String,
  appearClass: String,
  appearActiveClass: String,
  appearToClass: String,
  duration: [Number, String, Object]
};
function bo(n) {
  var t = n && n.componentOptions;
  return t && t.Ctor.options.abstract ? bo(Y0(t.children)) : n;
}
function Au(n) {
  var t = {}, e = n.$options;
  for (var r in e.propsData)
    t[r] = n[r];
  var s = e._parentListeners;
  for (var r in s)
    t[an(r)] = s[r];
  return t;
}
function Nl(n, t) {
  if (/\d-keep-alive$/.test(t.tag))
    return n("keep-alive", {
      props: t.componentOptions.propsData
    });
}
function L4(n) {
  for (; n = n.parent; )
    if (n.data.transition)
      return !0;
}
function v4(n, t) {
  return t.key === n.key && t.tag === n.tag;
}
var y4 = function(n) {
  return n.tag || yr(n);
}, C4 = function(n) {
  return n.name === "show";
}, E4 = {
  name: "transition",
  props: Tu,
  abstract: !0,
  render: function(n) {
    var t = this, e = this.$slots.default;
    if (e && (e = e.filter(y4), !!e.length)) {
      process.env.NODE_ENV !== "production" && e.length > 1 && T("<transition> can only be used on a single element. Use <transition-group> for lists.", this.$parent);
      var r = this.mode;
      process.env.NODE_ENV !== "production" && r && r !== "in-out" && r !== "out-in" && T("invalid <transition> mode: " + r, this.$parent);
      var s = e[0];
      if (L4(this.$vnode))
        return s;
      var i = bo(s);
      if (!i)
        return s;
      if (this._leaving)
        return Nl(n, s);
      var o = "__transition-".concat(this._uid, "-");
      i.key = i.key == null ? i.isComment ? o + "comment" : o + i.tag : $e(i.key) ? String(i.key).indexOf(o) === 0 ? i.key : o + i.key : i.key;
      var a = (i.data || (i.data = {})).transition = Au(this), l = this._vnode, c = bo(l);
      if (i.data.directives && i.data.directives.some(C4) && (i.data.show = !0), c && c.data && !v4(i, c) && !yr(c) && !(c.componentInstance && c.componentInstance._vnode.isComment)) {
        var u = c.data.transition = ct({}, a);
        if (r === "out-in")
          return this._leaving = !0, Fe(u, "afterLeave", function() {
            t._leaving = !1, t.$forceUpdate();
          }), Nl(n, s);
        if (r === "in-out") {
          if (yr(i))
            return l;
          var f, d = function() {
            f();
          };
          Fe(a, "afterEnter", d), Fe(a, "enterCancelled", d), Fe(u, "delayLeave", function(p) {
            f = p;
          });
        }
      }
      return s;
    }
  }
}, Su = ct({
  tag: String,
  moveClass: String
}, Tu);
delete Su.mode;
var b4 = {
  props: Su,
  beforeMount: function() {
    var n = this, t = this._update;
    this._update = function(e, r) {
      var s = tu(n);
      n.__patch__(
        n._vnode,
        n.kept,
        !1,
        !0
      ), n._vnode = n.kept, s(), t.call(n, e, r);
    };
  },
  render: function(n) {
    for (var t = this.tag || this.$vnode.data.tag || "span", e = /* @__PURE__ */ Object.create(null), r = this.prevChildren = this.children, s = this.$slots.default || [], i = this.children = [], o = Au(this), a = 0; a < s.length; a++) {
      var l = s[a];
      if (l.tag) {
        if (l.key != null && String(l.key).indexOf("__vlist") !== 0)
          i.push(l), e[l.key] = l, (l.data || (l.data = {})).transition = o;
        else if (process.env.NODE_ENV !== "production") {
          var c = l.componentOptions, u = c ? $n(c.Ctor.options) || c.tag || "" : l.tag;
          T("<transition-group> children must be keyed: <".concat(u, ">"));
        }
      }
    }
    if (r) {
      for (var f = [], d = [], a = 0; a < r.length; a++) {
        var l = r[a];
        l.data.transition = o, l.data.pos = l.elm.getBoundingClientRect(), e[l.key] ? f.push(l) : d.push(l);
      }
      this.kept = n(t, null, f), this.removed = d;
    }
    return n(t, null, i);
  },
  updated: function() {
    var n = this.prevChildren, t = this.moveClass || (this.name || "v") + "-move";
    !n.length || !this.hasMove(n[0].elm, t) || (n.forEach(w4), n.forEach(T4), n.forEach(A4), this._reflow = document.body.offsetHeight, n.forEach(function(e) {
      if (e.data.moved) {
        var r = e.elm, s = r.style;
        sn(r, t), s.transform = s.WebkitTransform = s.transitionDuration = "", r.addEventListener($s, r._moveCb = function i(o) {
          o && o.target !== r || (!o || /transform$/.test(o.propertyName)) && (r.removeEventListener($s, i), r._moveCb = null, ke(r, t));
        });
      }
    }));
  },
  methods: {
    hasMove: function(n, t) {
      if (!mu)
        return !1;
      if (this._hasMove)
        return this._hasMove;
      var e = n.cloneNode();
      n._transitionClasses && n._transitionClasses.forEach(function(s) {
        gu(e, s);
      }), pu(e, t), e.style.display = "none", this.$el.appendChild(e);
      var r = yu(e);
      return this.$el.removeChild(e), this._hasMove = r.hasTransform;
    }
  }
};
function w4(n) {
  n.elm._moveCb && n.elm._moveCb(), n.elm._enterCb && n.elm._enterCb();
}
function T4(n) {
  n.data.newPos = n.elm.getBoundingClientRect();
}
function A4(n) {
  var t = n.data.pos, e = n.data.newPos, r = t.left - e.left, s = t.top - e.top;
  if (r || s) {
    n.data.moved = !0;
    var i = n.elm.style;
    i.transform = i.WebkitTransform = "translate(".concat(r, "px,").concat(s, "px)"), i.transitionDuration = "0s";
  }
}
var S4 = {
  Transition: E4,
  TransitionGroup: b4
};
gt.config.mustUseProp = p3;
gt.config.isReservedTag = uu;
gt.config.isReservedAttr = f3;
gt.config.getTagNamespace = b3;
gt.config.isUnknownElement = w3;
ct(gt.options.directives, _4);
ct(gt.options.components, S4);
gt.prototype.__patch__ = zt ? g4 : Ct;
gt.prototype.$mount = function(n, t) {
  return n = n && zt ? T3(n) : void 0, od(this, n, t);
};
zt && setTimeout(function() {
  nt.devtools && (Ts ? Ts.emit("init", gt) : process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test" && console[console.info ? "info" : "log"](`Download the Vue Devtools extension for a better development experience:
https://github.com/vuejs/vue-devtools`)), process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test" && nt.productionTip !== !1 && typeof console < "u" && console[console.info ? "info" : "log"](`You are running Vue in development mode.
Make sure to turn on production mode when deploying for production.
See more tips at https://vuejs.org/guide/deployment.html`);
}, 0);
function R4(n) {
  var t = Number(n.version.split(".")[0]);
  if (t >= 2)
    n.mixin({ beforeCreate: r });
  else {
    var e = n.prototype._init;
    n.prototype._init = function(s) {
      s === void 0 && (s = {}), s.init = s.init ? [r].concat(s.init) : r, e.call(this, s);
    };
  }
  function r() {
    var s = this.$options;
    s.store ? this.$store = typeof s.store == "function" ? s.store() : s.store : s.parent && s.parent.$store && (this.$store = s.parent.$store);
  }
}
var k4 = typeof window < "u" ? window : typeof global < "u" ? global : {}, bn = k4.__VUE_DEVTOOLS_GLOBAL_HOOK__;
function O4(n) {
  bn && (n._devtoolHook = bn, bn.emit("vuex:init", n), bn.on("vuex:travel-to-state", function(t) {
    n.replaceState(t);
  }), n.subscribe(function(t, e) {
    bn.emit("vuex:mutation", t, e);
  }, { prepend: !0 }), n.subscribeAction(function(t, e) {
    bn.emit("vuex:action", t, e);
  }, { prepend: !0 }));
}
function N4(n, t) {
  return n.filter(t)[0];
}
function wo(n, t) {
  if (t === void 0 && (t = []), n === null || typeof n != "object")
    return n;
  var e = N4(t, function(s) {
    return s.original === n;
  });
  if (e)
    return e.copy;
  var r = Array.isArray(n) ? [] : {};
  return t.push({
    original: n,
    copy: r
  }), Object.keys(n).forEach(function(s) {
    r[s] = wo(n[s], t);
  }), r;
}
function dn(n, t) {
  Object.keys(n).forEach(function(e) {
    return t(n[e], e);
  });
}
function Ru(n) {
  return n !== null && typeof n == "object";
}
function I4(n) {
  return n && typeof n.then == "function";
}
function se(n, t) {
  if (!n)
    throw new Error("[vuex] " + t);
}
function M4(n, t) {
  return function() {
    return n(t);
  };
}
var de = function(t, e) {
  this.runtime = e, this._children = /* @__PURE__ */ Object.create(null), this._rawModule = t;
  var r = t.state;
  this.state = (typeof r == "function" ? r() : r) || {};
}, ku = { namespaced: { configurable: !0 } };
ku.namespaced.get = function() {
  return !!this._rawModule.namespaced;
};
de.prototype.addChild = function(t, e) {
  this._children[t] = e;
};
de.prototype.removeChild = function(t) {
  delete this._children[t];
};
de.prototype.getChild = function(t) {
  return this._children[t];
};
de.prototype.hasChild = function(t) {
  return t in this._children;
};
de.prototype.update = function(t) {
  this._rawModule.namespaced = t.namespaced, t.actions && (this._rawModule.actions = t.actions), t.mutations && (this._rawModule.mutations = t.mutations), t.getters && (this._rawModule.getters = t.getters);
};
de.prototype.forEachChild = function(t) {
  dn(this._children, t);
};
de.prototype.forEachGetter = function(t) {
  this._rawModule.getters && dn(this._rawModule.getters, t);
};
de.prototype.forEachAction = function(t) {
  this._rawModule.actions && dn(this._rawModule.actions, t);
};
de.prototype.forEachMutation = function(t) {
  this._rawModule.mutations && dn(this._rawModule.mutations, t);
};
Object.defineProperties(de.prototype, ku);
var pn = function(t) {
  this.register([], t, !1);
};
pn.prototype.get = function(t) {
  return t.reduce(function(e, r) {
    return e.getChild(r);
  }, this.root);
};
pn.prototype.getNamespace = function(t) {
  var e = this.root;
  return t.reduce(function(r, s) {
    return e = e.getChild(s), r + (e.namespaced ? s + "/" : "");
  }, "");
};
pn.prototype.update = function(t) {
  Ou([], this.root, t);
};
pn.prototype.register = function(t, e, r) {
  var s = this;
  r === void 0 && (r = !0), process.env.NODE_ENV !== "production" && Nu(t, e);
  var i = new de(e, r);
  if (t.length === 0)
    this.root = i;
  else {
    var o = this.get(t.slice(0, -1));
    o.addChild(t[t.length - 1], i);
  }
  e.modules && dn(e.modules, function(a, l) {
    s.register(t.concat(l), a, r);
  });
};
pn.prototype.unregister = function(t) {
  var e = this.get(t.slice(0, -1)), r = t[t.length - 1], s = e.getChild(r);
  if (!s) {
    process.env.NODE_ENV !== "production" && console.warn(
      "[vuex] trying to unregister module '" + r + "', which is not registered"
    );
    return;
  }
  s.runtime && e.removeChild(r);
};
pn.prototype.isRegistered = function(t) {
  var e = this.get(t.slice(0, -1)), r = t[t.length - 1];
  return e ? e.hasChild(r) : !1;
};
function Ou(n, t, e) {
  if (process.env.NODE_ENV !== "production" && Nu(n, e), t.update(e), e.modules)
    for (var r in e.modules) {
      if (!t.getChild(r)) {
        process.env.NODE_ENV !== "production" && console.warn(
          "[vuex] trying to add a new module '" + r + "' on hot reloading, manual reload is needed"
        );
        return;
      }
      Ou(
        n.concat(r),
        t.getChild(r),
        e.modules[r]
      );
    }
}
var Il = {
  assert: function(n) {
    return typeof n == "function";
  },
  expected: "function"
}, P4 = {
  assert: function(n) {
    return typeof n == "function" || typeof n == "object" && typeof n.handler == "function";
  },
  expected: 'function or object with "handler" function'
}, Ml = {
  getters: Il,
  mutations: Il,
  actions: P4
};
function Nu(n, t) {
  Object.keys(Ml).forEach(function(e) {
    if (t[e]) {
      var r = Ml[e];
      dn(t[e], function(s, i) {
        se(
          r.assert(s),
          $4(n, e, i, s, r.expected)
        );
      });
    }
  });
}
function $4(n, t, e, r, s) {
  var i = t + " should be " + s + ' but "' + t + "." + e + '"';
  return n.length > 0 && (i += ' in module "' + n.join(".") + '"'), i += " is " + JSON.stringify(r) + ".", i;
}
var Dt, te = function n(t) {
  var e = this;
  t === void 0 && (t = {}), !Dt && typeof window < "u" && window.Vue && Pu(window.Vue), process.env.NODE_ENV !== "production" && (se(Dt, "must call Vue.use(Vuex) before creating a store instance."), se(typeof Promise < "u", "vuex requires a Promise polyfill in this browser."), se(this instanceof n, "store must be called with the new operator."));
  var r = t.plugins;
  r === void 0 && (r = []);
  var s = t.strict;
  s === void 0 && (s = !1), this._committing = !1, this._actions = /* @__PURE__ */ Object.create(null), this._actionSubscribers = [], this._mutations = /* @__PURE__ */ Object.create(null), this._wrappedGetters = /* @__PURE__ */ Object.create(null), this._modules = new pn(t), this._modulesNamespaceMap = /* @__PURE__ */ Object.create(null), this._subscribers = [], this._watcherVM = new Dt(), this._makeLocalGettersCache = /* @__PURE__ */ Object.create(null);
  var i = this, o = this, a = o.dispatch, l = o.commit;
  this.dispatch = function(d, p) {
    return a.call(i, d, p);
  }, this.commit = function(d, p, w) {
    return l.call(i, d, p, w);
  }, this.strict = s;
  var c = this._modules.root.state;
  ei(this, c, [], this._modules.root), xa(this, c), r.forEach(function(f) {
    return f(e);
  });
  var u = t.devtools !== void 0 ? t.devtools : Dt.config.devtools;
  u && O4(this);
}, ga = { state: { configurable: !0 } };
ga.state.get = function() {
  return this._vm._data.$$state;
};
ga.state.set = function(n) {
  process.env.NODE_ENV !== "production" && se(!1, "use store.replaceState() to explicit replace store state.");
};
te.prototype.commit = function(t, e, r) {
  var s = this, i = Fs(t, e, r), o = i.type, a = i.payload, l = i.options, c = { type: o, payload: a }, u = this._mutations[o];
  if (!u) {
    process.env.NODE_ENV !== "production" && console.error("[vuex] unknown mutation type: " + o);
    return;
  }
  this._withCommit(function() {
    u.forEach(function(d) {
      d(a);
    });
  }), this._subscribers.slice().forEach(function(f) {
    return f(c, s.state);
  }), process.env.NODE_ENV !== "production" && l && l.silent && console.warn(
    "[vuex] mutation type: " + o + ". Silent option has been removed. Use the filter functionality in the vue-devtools"
  );
};
te.prototype.dispatch = function(t, e) {
  var r = this, s = Fs(t, e), i = s.type, o = s.payload, a = { type: i, payload: o }, l = this._actions[i];
  if (!l) {
    process.env.NODE_ENV !== "production" && console.error("[vuex] unknown action type: " + i);
    return;
  }
  try {
    this._actionSubscribers.slice().filter(function(u) {
      return u.before;
    }).forEach(function(u) {
      return u.before(a, r.state);
    });
  } catch (u) {
    process.env.NODE_ENV !== "production" && (console.warn("[vuex] error in before action subscribers: "), console.error(u));
  }
  var c = l.length > 1 ? Promise.all(l.map(function(u) {
    return u(o);
  })) : l[0](o);
  return new Promise(function(u, f) {
    c.then(function(d) {
      try {
        r._actionSubscribers.filter(function(p) {
          return p.after;
        }).forEach(function(p) {
          return p.after(a, r.state);
        });
      } catch (p) {
        process.env.NODE_ENV !== "production" && (console.warn("[vuex] error in after action subscribers: "), console.error(p));
      }
      u(d);
    }, function(d) {
      try {
        r._actionSubscribers.filter(function(p) {
          return p.error;
        }).forEach(function(p) {
          return p.error(a, r.state, d);
        });
      } catch (p) {
        process.env.NODE_ENV !== "production" && (console.warn("[vuex] error in error action subscribers: "), console.error(p));
      }
      f(d);
    });
  });
};
te.prototype.subscribe = function(t, e) {
  return Iu(t, this._subscribers, e);
};
te.prototype.subscribeAction = function(t, e) {
  var r = typeof t == "function" ? { before: t } : t;
  return Iu(r, this._actionSubscribers, e);
};
te.prototype.watch = function(t, e, r) {
  var s = this;
  return process.env.NODE_ENV !== "production" && se(typeof t == "function", "store.watch only accepts a function."), this._watcherVM.$watch(function() {
    return t(s.state, s.getters);
  }, e, r);
};
te.prototype.replaceState = function(t) {
  var e = this;
  this._withCommit(function() {
    e._vm._data.$$state = t;
  });
};
te.prototype.registerModule = function(t, e, r) {
  r === void 0 && (r = {}), typeof t == "string" && (t = [t]), process.env.NODE_ENV !== "production" && (se(Array.isArray(t), "module path must be a string or an Array."), se(t.length > 0, "cannot register the root module by using registerModule.")), this._modules.register(t, e), ei(this, this.state, t, this._modules.get(t), r.preserveState), xa(this, this.state);
};
te.prototype.unregisterModule = function(t) {
  var e = this;
  typeof t == "string" && (t = [t]), process.env.NODE_ENV !== "production" && se(Array.isArray(t), "module path must be a string or an Array."), this._modules.unregister(t), this._withCommit(function() {
    var r = ma(e.state, t.slice(0, -1));
    Dt.delete(r, t[t.length - 1]);
  }), Mu(this);
};
te.prototype.hasModule = function(t) {
  return typeof t == "string" && (t = [t]), process.env.NODE_ENV !== "production" && se(Array.isArray(t), "module path must be a string or an Array."), this._modules.isRegistered(t);
};
te.prototype.hotUpdate = function(t) {
  this._modules.update(t), Mu(this, !0);
};
te.prototype._withCommit = function(t) {
  var e = this._committing;
  this._committing = !0, t(), this._committing = e;
};
Object.defineProperties(te.prototype, ga);
function Iu(n, t, e) {
  return t.indexOf(n) < 0 && (e && e.prepend ? t.unshift(n) : t.push(n)), function() {
    var r = t.indexOf(n);
    r > -1 && t.splice(r, 1);
  };
}
function Mu(n, t) {
  n._actions = /* @__PURE__ */ Object.create(null), n._mutations = /* @__PURE__ */ Object.create(null), n._wrappedGetters = /* @__PURE__ */ Object.create(null), n._modulesNamespaceMap = /* @__PURE__ */ Object.create(null);
  var e = n.state;
  ei(n, e, [], n._modules.root, !0), xa(n, e, t);
}
function xa(n, t, e) {
  var r = n._vm;
  n.getters = {}, n._makeLocalGettersCache = /* @__PURE__ */ Object.create(null);
  var s = n._wrappedGetters, i = {};
  dn(s, function(a, l) {
    i[l] = M4(a, n), Object.defineProperty(n.getters, l, {
      get: function() {
        return n._vm[l];
      },
      enumerable: !0
    });
  });
  var o = Dt.config.silent;
  Dt.config.silent = !0, n._vm = new Dt({
    data: {
      $$state: t
    },
    computed: i
  }), Dt.config.silent = o, n.strict && G4(n), r && (e && n._withCommit(function() {
    r._data.$$state = null;
  }), Dt.nextTick(function() {
    return r.$destroy();
  }));
}
function ei(n, t, e, r, s) {
  var i = !e.length, o = n._modules.getNamespace(e);
  if (r.namespaced && (n._modulesNamespaceMap[o] && process.env.NODE_ENV !== "production" && console.error("[vuex] duplicate namespace " + o + " for the namespaced module " + e.join("/")), n._modulesNamespaceMap[o] = r), !i && !s) {
    var a = ma(t, e.slice(0, -1)), l = e[e.length - 1];
    n._withCommit(function() {
      process.env.NODE_ENV !== "production" && l in a && console.warn(
        '[vuex] state field "' + l + '" was overridden by a module with the same name at "' + e.join(".") + '"'
      ), Dt.set(a, l, r.state);
    });
  }
  var c = r.context = D4(n, o, e);
  r.forEachMutation(function(u, f) {
    var d = o + f;
    B4(n, d, u, c);
  }), r.forEachAction(function(u, f) {
    var d = u.root ? f : o + f, p = u.handler || u;
    U4(n, d, p, c);
  }), r.forEachGetter(function(u, f) {
    var d = o + f;
    H4(n, d, u, c);
  }), r.forEachChild(function(u, f) {
    ei(n, t, e.concat(f), u, s);
  });
}
function D4(n, t, e) {
  var r = t === "", s = {
    dispatch: r ? n.dispatch : function(i, o, a) {
      var l = Fs(i, o, a), c = l.payload, u = l.options, f = l.type;
      if ((!u || !u.root) && (f = t + f, process.env.NODE_ENV !== "production" && !n._actions[f])) {
        console.error("[vuex] unknown local action type: " + l.type + ", global type: " + f);
        return;
      }
      return n.dispatch(f, c);
    },
    commit: r ? n.commit : function(i, o, a) {
      var l = Fs(i, o, a), c = l.payload, u = l.options, f = l.type;
      if ((!u || !u.root) && (f = t + f, process.env.NODE_ENV !== "production" && !n._mutations[f])) {
        console.error("[vuex] unknown local mutation type: " + l.type + ", global type: " + f);
        return;
      }
      n.commit(f, c, u);
    }
  };
  return Object.defineProperties(s, {
    getters: {
      get: r ? function() {
        return n.getters;
      } : function() {
        return F4(n, t);
      }
    },
    state: {
      get: function() {
        return ma(n.state, e);
      }
    }
  }), s;
}
function F4(n, t) {
  if (!n._makeLocalGettersCache[t]) {
    var e = {}, r = t.length;
    Object.keys(n.getters).forEach(function(s) {
      if (s.slice(0, r) === t) {
        var i = s.slice(r);
        Object.defineProperty(e, i, {
          get: function() {
            return n.getters[s];
          },
          enumerable: !0
        });
      }
    }), n._makeLocalGettersCache[t] = e;
  }
  return n._makeLocalGettersCache[t];
}
function B4(n, t, e, r) {
  var s = n._mutations[t] || (n._mutations[t] = []);
  s.push(function(o) {
    e.call(n, r.state, o);
  });
}
function U4(n, t, e, r) {
  var s = n._actions[t] || (n._actions[t] = []);
  s.push(function(o) {
    var a = e.call(n, {
      dispatch: r.dispatch,
      commit: r.commit,
      getters: r.getters,
      state: r.state,
      rootGetters: n.getters,
      rootState: n.state
    }, o);
    return I4(a) || (a = Promise.resolve(a)), n._devtoolHook ? a.catch(function(l) {
      throw n._devtoolHook.emit("vuex:error", l), l;
    }) : a;
  });
}
function H4(n, t, e, r) {
  if (n._wrappedGetters[t]) {
    process.env.NODE_ENV !== "production" && console.error("[vuex] duplicate getter key: " + t);
    return;
  }
  n._wrappedGetters[t] = function(i) {
    return e(
      r.state,
      r.getters,
      i.state,
      i.getters
    );
  };
}
function G4(n) {
  n._vm.$watch(function() {
    return this._data.$$state;
  }, function() {
    process.env.NODE_ENV !== "production" && se(n._committing, "do not mutate vuex store state outside mutation handlers.");
  }, { deep: !0, sync: !0 });
}
function ma(n, t) {
  return t.reduce(function(e, r) {
    return e[r];
  }, n);
}
function Fs(n, t, e) {
  return Ru(n) && n.type && (e = t, t = n, n = n.type), process.env.NODE_ENV !== "production" && se(typeof n == "string", "expects string as the type, but found " + typeof n + "."), { type: n, payload: t, options: e };
}
function Pu(n) {
  if (Dt && n === Dt) {
    process.env.NODE_ENV !== "production" && console.error(
      "[vuex] already installed. Vue.use(Vuex) should be called only once."
    );
    return;
  }
  Dt = n, R4(Dt);
}
var Mr = ri(function(n, t) {
  var e = {};
  return process.env.NODE_ENV !== "production" && !$r(t) && console.error("[vuex] mapState: mapper parameter must be either an Array or an Object"), ni(t).forEach(function(r) {
    var s = r.key, i = r.val;
    e[s] = function() {
      var a = this.$store.state, l = this.$store.getters;
      if (n) {
        var c = si(this.$store, "mapState", n);
        if (!c)
          return;
        a = c.context.state, l = c.context.getters;
      }
      return typeof i == "function" ? i.call(this, a, l) : a[i];
    }, e[s].vuex = !0;
  }), e;
}), Pr = ri(function(n, t) {
  var e = {};
  return process.env.NODE_ENV !== "production" && !$r(t) && console.error("[vuex] mapMutations: mapper parameter must be either an Array or an Object"), ni(t).forEach(function(r) {
    var s = r.key, i = r.val;
    e[s] = function() {
      for (var a = [], l = arguments.length; l--; )
        a[l] = arguments[l];
      var c = this.$store.commit;
      if (n) {
        var u = si(this.$store, "mapMutations", n);
        if (!u)
          return;
        c = u.context.commit;
      }
      return typeof i == "function" ? i.apply(this, [c].concat(a)) : c.apply(this.$store, [i].concat(a));
    };
  }), e;
}), Ht = ri(function(n, t) {
  var e = {};
  return process.env.NODE_ENV !== "production" && !$r(t) && console.error("[vuex] mapGetters: mapper parameter must be either an Array or an Object"), ni(t).forEach(function(r) {
    var s = r.key, i = r.val;
    i = n + i, e[s] = function() {
      if (!(n && !si(this.$store, "mapGetters", n))) {
        if (process.env.NODE_ENV !== "production" && !(i in this.$store.getters)) {
          console.error("[vuex] unknown getter: " + i);
          return;
        }
        return this.$store.getters[i];
      }
    }, e[s].vuex = !0;
  }), e;
}), $u = ri(function(n, t) {
  var e = {};
  return process.env.NODE_ENV !== "production" && !$r(t) && console.error("[vuex] mapActions: mapper parameter must be either an Array or an Object"), ni(t).forEach(function(r) {
    var s = r.key, i = r.val;
    e[s] = function() {
      for (var a = [], l = arguments.length; l--; )
        a[l] = arguments[l];
      var c = this.$store.dispatch;
      if (n) {
        var u = si(this.$store, "mapActions", n);
        if (!u)
          return;
        c = u.context.dispatch;
      }
      return typeof i == "function" ? i.apply(this, [c].concat(a)) : c.apply(this.$store, [i].concat(a));
    };
  }), e;
}), j4 = function(n) {
  return {
    mapState: Mr.bind(null, n),
    mapGetters: Ht.bind(null, n),
    mapMutations: Pr.bind(null, n),
    mapActions: $u.bind(null, n)
  };
};
function ni(n) {
  return $r(n) ? Array.isArray(n) ? n.map(function(t) {
    return { key: t, val: t };
  }) : Object.keys(n).map(function(t) {
    return { key: t, val: n[t] };
  }) : [];
}
function $r(n) {
  return Array.isArray(n) || Ru(n);
}
function ri(n) {
  return function(t, e) {
    return typeof t != "string" ? (e = t, t = "") : t.charAt(t.length - 1) !== "/" && (t += "/"), n(t, e);
  };
}
function si(n, t, e) {
  var r = n._modulesNamespaceMap[e];
  return process.env.NODE_ENV !== "production" && !r && console.error("[vuex] module namespace not found in " + t + "(): " + e), r;
}
function V4(n) {
  n === void 0 && (n = {});
  var t = n.collapsed;
  t === void 0 && (t = !0);
  var e = n.filter;
  e === void 0 && (e = function(u, f, d) {
    return !0;
  });
  var r = n.transformer;
  r === void 0 && (r = function(u) {
    return u;
  });
  var s = n.mutationTransformer;
  s === void 0 && (s = function(u) {
    return u;
  });
  var i = n.actionFilter;
  i === void 0 && (i = function(u, f) {
    return !0;
  });
  var o = n.actionTransformer;
  o === void 0 && (o = function(u) {
    return u;
  });
  var a = n.logMutations;
  a === void 0 && (a = !0);
  var l = n.logActions;
  l === void 0 && (l = !0);
  var c = n.logger;
  return c === void 0 && (c = console), function(u) {
    var f = wo(u.state);
    typeof c > "u" || (a && u.subscribe(function(d, p) {
      var w = wo(p);
      if (e(d, f, w)) {
        var I = Dl(), W = s(d), $ = "mutation " + d.type + I;
        Pl(c, $, t), c.log("%c prev state", "color: #9E9E9E; font-weight: bold", r(f)), c.log("%c mutation", "color: #03A9F4; font-weight: bold", W), c.log("%c next state", "color: #4CAF50; font-weight: bold", r(w)), $l(c);
      }
      f = w;
    }), l && u.subscribeAction(function(d, p) {
      if (i(d, p)) {
        var w = Dl(), I = o(d), W = "action " + d.type + w;
        Pl(c, W, t), c.log("%c action", "color: #03A9F4; font-weight: bold", I), $l(c);
      }
    }));
  };
}
function Pl(n, t, e) {
  var r = e ? n.groupCollapsed : n.group;
  try {
    r.call(n, t);
  } catch {
    n.log(t);
  }
}
function $l(n) {
  try {
    n.groupEnd();
  } catch {
    n.log("—— log end ——");
  }
}
function Dl() {
  var n = new Date();
  return " @ " + us(n.getHours(), 2) + ":" + us(n.getMinutes(), 2) + ":" + us(n.getSeconds(), 2) + "." + us(n.getMilliseconds(), 3);
}
function z4(n, t) {
  return new Array(t + 1).join(n);
}
function us(n, t) {
  return z4("0", t - n.toString().length) + n;
}
var Z4 = {
  Store: te,
  install: Pu,
  version: "3.6.2",
  mapState: Mr,
  mapMutations: Pr,
  mapGetters: Ht,
  mapActions: $u,
  createNamespacedHelpers: j4,
  createLogger: V4
};
const Du = Z4;
var W4 = typeof ts == "object" && ts && ts.Object === Object && ts, Fu = W4, q4 = Fu, K4 = typeof self == "object" && self && self.Object === Object && self, Y4 = q4 || K4 || Function("return this")(), gn = Y4, X4 = gn, Q4 = function() {
  return X4.Date.now();
}, J4 = Q4;
String.prototype.seed = String.prototype.seed || Math.round(Math.random() * Math.pow(2, 32));
String.prototype.hashCode = function() {
  const n = this.toString();
  let t, e;
  const r = n.length & 3, s = n.length - r;
  let i = String.prototype.seed;
  const o = 3432918353, a = 461845907;
  let l = 0;
  for (; l < s; )
    e = n.charCodeAt(l) & 255 | (n.charCodeAt(++l) & 255) << 8 | (n.charCodeAt(++l) & 255) << 16 | (n.charCodeAt(++l) & 255) << 24, ++l, e = (e & 65535) * o + (((e >>> 16) * o & 65535) << 16) & 4294967295, e = e << 15 | e >>> 17, e = (e & 65535) * a + (((e >>> 16) * a & 65535) << 16) & 4294967295, i ^= e, i = i << 13 | i >>> 19, t = (i & 65535) * 5 + (((i >>> 16) * 5 & 65535) << 16) & 4294967295, i = (t & 65535) + 27492 + (((t >>> 16) + 58964 & 65535) << 16);
  switch (e = 0, r) {
    case 3:
      e ^= (n.charCodeAt(l + 2) & 255) << 16;
    case 2:
      e ^= (n.charCodeAt(l + 1) & 255) << 8;
    case 1:
      e ^= n.charCodeAt(l) & 255, e = (e & 65535) * o + (((e >>> 16) * o & 65535) << 16) & 4294967295, e = e << 15 | e >>> 17, e = (e & 65535) * a + (((e >>> 16) * a & 65535) << 16) & 4294967295, i ^= e;
  }
  return i ^= n.length, i ^= i >>> 16, i = (i & 65535) * 2246822507 + (((i >>> 16) * 2246822507 & 65535) << 16) & 4294967295, i ^= i >>> 13, i = (i & 65535) * 3266489909 + (((i >>> 16) * 3266489909 & 65535) << 16) & 4294967295, i ^= i >>> 16, i >>> 0;
};
String.prototype.codePointAt || function() {
  var n = function() {
    let e;
    try {
      const r = {}, s = Object.defineProperty;
      e = s(r, r, r) && s;
    } catch {
    }
    return e;
  }();
  const t = function(e) {
    if (this == null)
      throw TypeError();
    const r = String(this), s = r.length;
    let i = e ? Number(e) : 0;
    if (i !== i && (i = 0), i < 0 || i >= s)
      return;
    const o = r.charCodeAt(i);
    let a;
    return o >= 55296 && o <= 56319 && s > i + 1 && (a = r.charCodeAt(i + 1), a >= 56320 && a <= 57343) ? (o - 55296) * 1024 + a - 56320 + 65536 : o;
  };
  n ? n(String.prototype, "codePointAt", {
    value: t,
    configurable: !0,
    writable: !0
  }) : String.prototype.codePointAt = t;
}();
String.fromCodePoint || function() {
  const n = function() {
    let s;
    try {
      const i = {}, o = Object.defineProperty;
      s = o(i, i, i) && o;
    } catch {
    }
    return s;
  }(), t = String.fromCharCode, e = Math.floor, r = function(s) {
    const o = [];
    let a, l, c = -1;
    const u = arguments.length;
    if (!u)
      return "";
    let f = "";
    for (; ++c < u; ) {
      let d = Number(arguments[c]);
      if (!isFinite(d) || d < 0 || d > 1114111 || e(d) !== d)
        throw RangeError("Invalid code point: " + d);
      d <= 65535 ? o.push(d) : (d -= 65536, a = (d >> 10) + 55296, l = d % 1024 + 56320, o.push(a, l)), (c + 1 === u || o.length > 16384) && (f += t.apply(null, o), o.length = 0);
    }
    return f;
  };
  n ? n(String, "fromCodePoint", {
    value: r,
    configurable: !0,
    writable: !0
  }) : String.fromCodePoint = r;
}();
class b {
  constructor() {
    this.source = null, this.type = null, this.channel = null, this.start = null, this.stop = null, this.tokenIndex = null, this.line = null, this.column = null, this._text = null;
  }
  getTokenSource() {
    return this.source[0];
  }
  getInputStream() {
    return this.source[1];
  }
  get text() {
    return this._text;
  }
  set text(t) {
    this._text = t;
  }
}
b.INVALID_TYPE = 0;
b.EPSILON = -2;
b.MIN_USER_TOKEN_TYPE = 1;
b.EOF = -1;
b.DEFAULT_CHANNEL = 0;
b.HIDDEN_CHANNEL = 1;
function Dn(n, t) {
  if (!Array.isArray(n) || !Array.isArray(t))
    return !1;
  if (n === t)
    return !0;
  if (n.length !== t.length)
    return !1;
  for (let e = 0; e < n.length; e++)
    if (n[e] !== t[e] && (!n[e].equals || !n[e].equals(t[e])))
      return !1;
  return !0;
}
class Jt {
  constructor() {
    this.count = 0, this.hash = 0;
  }
  update() {
    for (let t = 0; t < arguments.length; t++) {
      const e = arguments[t];
      if (e != null)
        if (Array.isArray(e))
          this.update.apply(this, e);
        else {
          let r = 0;
          switch (typeof e) {
            case "undefined":
            case "function":
              continue;
            case "number":
            case "boolean":
              r = e;
              break;
            case "string":
              r = e.hashCode();
              break;
            default:
              e.updateHashCode ? e.updateHashCode(this) : console.log("No updateHashCode for " + e.toString());
              continue;
          }
          r = r * 3432918353, r = r << 15 | r >>> 32 - 15, r = r * 461845907, this.count = this.count + 1;
          let s = this.hash ^ r;
          s = s << 13 | s >>> 32 - 13, s = s * 5 + 3864292196, this.hash = s;
        }
    }
  }
  finish() {
    let t = this.hash ^ this.count * 4;
    return t = t ^ t >>> 16, t = t * 2246822507, t = t ^ t >>> 13, t = t * 3266489909, t = t ^ t >>> 16, t;
  }
  static hashStuff() {
    const t = new Jt();
    return t.update.apply(t, arguments), t.finish();
  }
}
function Bu(n) {
  return n ? n.hashCode() : -1;
}
function Uu(n, t) {
  return n ? n.equals(t) : n === t;
}
function t5(n) {
  return n === null ? "null" : n;
}
function Ue(n) {
  return Array.isArray(n) ? "[" + n.map(t5).join(", ") + "]" : "null";
}
const hs = "h-";
class Xt {
  constructor(t, e) {
    this.data = {}, this.hashFunction = t || Bu, this.equalsFunction = e || Uu;
  }
  add(t) {
    const e = hs + this.hashFunction(t);
    if (e in this.data) {
      const r = this.data[e];
      for (let s = 0; s < r.length; s++)
        if (this.equalsFunction(t, r[s]))
          return r[s];
      return r.push(t), t;
    } else
      return this.data[e] = [t], t;
  }
  has(t) {
    return this.get(t) != null;
  }
  get(t) {
    const e = hs + this.hashFunction(t);
    if (e in this.data) {
      const r = this.data[e];
      for (let s = 0; s < r.length; s++)
        if (this.equalsFunction(t, r[s]))
          return r[s];
    }
    return null;
  }
  values() {
    return Object.keys(this.data).filter((t) => t.startsWith(hs)).flatMap((t) => this.data[t], this);
  }
  toString() {
    return Ue(this.values());
  }
  get length() {
    return Object.keys(this.data).filter((t) => t.startsWith(hs)).map((t) => this.data[t].length, this).reduce((t, e) => t + e, 0);
  }
}
class J {
  hashCode() {
    const t = new Jt();
    return this.updateHashCode(t), t.finish();
  }
  evaluate(t, e) {
  }
  evalPrecedence(t, e) {
    return this;
  }
  static andContext(t, e) {
    if (t === null || t === J.NONE)
      return e;
    if (e === null || e === J.NONE)
      return t;
    const r = new hr(t, e);
    return r.opnds.length === 1 ? r.opnds[0] : r;
  }
  static orContext(t, e) {
    if (t === null)
      return e;
    if (e === null)
      return t;
    if (t === J.NONE || e === J.NONE)
      return J.NONE;
    const r = new fr(t, e);
    return r.opnds.length === 1 ? r.opnds[0] : r;
  }
}
class hr extends J {
  constructor(t, e) {
    super();
    const r = new Xt();
    t instanceof hr ? t.opnds.map(function(i) {
      r.add(i);
    }) : r.add(t), e instanceof hr ? e.opnds.map(function(i) {
      r.add(i);
    }) : r.add(e);
    const s = Hu(r);
    if (s.length > 0) {
      let i = null;
      s.map(function(o) {
        (i === null || o.precedence < i.precedence) && (i = o);
      }), r.add(i);
    }
    this.opnds = Array.from(r.values());
  }
  equals(t) {
    return this === t ? !0 : t instanceof hr ? Dn(this.opnds, t.opnds) : !1;
  }
  updateHashCode(t) {
    t.update(this.opnds, "AND");
  }
  evaluate(t, e) {
    for (let r = 0; r < this.opnds.length; r++)
      if (!this.opnds[r].evaluate(t, e))
        return !1;
    return !0;
  }
  evalPrecedence(t, e) {
    let r = !1;
    const s = [];
    for (let o = 0; o < this.opnds.length; o++) {
      const a = this.opnds[o], l = a.evalPrecedence(t, e);
      if (r |= l !== a, l === null)
        return null;
      l !== J.NONE && s.push(l);
    }
    if (!r)
      return this;
    if (s.length === 0)
      return J.NONE;
    let i = null;
    return s.map(function(o) {
      i = i === null ? o : J.andContext(i, o);
    }), i;
  }
  toString() {
    const t = this.opnds.map((e) => e.toString());
    return (t.length > 3 ? t.slice(3) : t).join("&&");
  }
}
class fr extends J {
  constructor(t, e) {
    super();
    const r = new Xt();
    t instanceof fr ? t.opnds.map(function(i) {
      r.add(i);
    }) : r.add(t), e instanceof fr ? e.opnds.map(function(i) {
      r.add(i);
    }) : r.add(e);
    const s = Hu(r);
    if (s.length > 0) {
      const i = s.sort(function(a, l) {
        return a.compareTo(l);
      }), o = i[i.length - 1];
      r.add(o);
    }
    this.opnds = Array.from(r.values());
  }
  equals(t) {
    return this === t ? !0 : t instanceof fr ? Dn(this.opnds, t.opnds) : !1;
  }
  updateHashCode(t) {
    t.update(this.opnds, "OR");
  }
  evaluate(t, e) {
    for (let r = 0; r < this.opnds.length; r++)
      if (this.opnds[r].evaluate(t, e))
        return !0;
    return !1;
  }
  evalPrecedence(t, e) {
    let r = !1;
    const s = [];
    for (let o = 0; o < this.opnds.length; o++) {
      const a = this.opnds[o], l = a.evalPrecedence(t, e);
      if (r |= l !== a, l === J.NONE)
        return J.NONE;
      l !== null && s.push(l);
    }
    return r ? (s.length === 0, null) : this;
  }
  toString() {
    const t = this.opnds.map((e) => e.toString());
    return (t.length > 3 ? t.slice(3) : t).join("||");
  }
}
function Hu(n) {
  const t = [];
  return n.values().map(function(e) {
    e instanceof J.PrecedencePredicate && t.push(e);
  }), t;
}
function Fl(n, t) {
  if (n === null) {
    const e = { state: null, alt: null, context: null, semanticContext: null };
    return t && (e.reachesIntoOuterContext = 0), e;
  } else {
    const e = {};
    return e.state = n.state || null, e.alt = n.alt === void 0 ? null : n.alt, e.context = n.context || null, e.semanticContext = n.semanticContext || null, t && (e.reachesIntoOuterContext = n.reachesIntoOuterContext || 0, e.precedenceFilterSuppressed = n.precedenceFilterSuppressed || !1), e;
  }
}
class Lt {
  constructor(t, e) {
    this.checkContext(t, e), t = Fl(t), e = Fl(e, !0), this.state = t.state !== null ? t.state : e.state, this.alt = t.alt !== null ? t.alt : e.alt, this.context = t.context !== null ? t.context : e.context, this.semanticContext = t.semanticContext !== null ? t.semanticContext : e.semanticContext !== null ? e.semanticContext : J.NONE, this.reachesIntoOuterContext = e.reachesIntoOuterContext, this.precedenceFilterSuppressed = e.precedenceFilterSuppressed;
  }
  checkContext(t, e) {
    (t.context === null || t.context === void 0) && (e === null || e.context === null || e.context === void 0) && (this.context = null);
  }
  hashCode() {
    const t = new Jt();
    return this.updateHashCode(t), t.finish();
  }
  updateHashCode(t) {
    t.update(this.state.stateNumber, this.alt, this.context, this.semanticContext);
  }
  equals(t) {
    return this === t ? !0 : t instanceof Lt ? this.state.stateNumber === t.state.stateNumber && this.alt === t.alt && (this.context === null ? t.context === null : this.context.equals(t.context)) && this.semanticContext.equals(t.semanticContext) && this.precedenceFilterSuppressed === t.precedenceFilterSuppressed : !1;
  }
  hashCodeForConfigSet() {
    const t = new Jt();
    return t.update(this.state.stateNumber, this.alt, this.semanticContext), t.finish();
  }
  equalsForConfigSet(t) {
    return this === t ? !0 : t instanceof Lt ? this.state.stateNumber === t.state.stateNumber && this.alt === t.alt && this.semanticContext.equals(t.semanticContext) : !1;
  }
  toString() {
    return "(" + this.state + "," + this.alt + (this.context !== null ? ",[" + this.context.toString() + "]" : "") + (this.semanticContext !== J.NONE ? "," + this.semanticContext.toString() : "") + (this.reachesIntoOuterContext > 0 ? ",up=" + this.reachesIntoOuterContext : "") + ")";
  }
}
class Q {
  constructor(t, e) {
    this.start = t, this.stop = e;
  }
  clone() {
    return new Q(this.start, this.stop);
  }
  contains(t) {
    return t >= this.start && t < this.stop;
  }
  toString() {
    return this.start === this.stop - 1 ? this.start.toString() : this.start.toString() + ".." + (this.stop - 1).toString();
  }
  get length() {
    return this.stop - this.start;
  }
}
Q.INVALID_INTERVAL = new Q(-1, -2);
class oe {
  constructor() {
    this.intervals = null, this.readOnly = !1;
  }
  first(t) {
    return this.intervals === null || this.intervals.length === 0 ? b.INVALID_TYPE : this.intervals[0].start;
  }
  addOne(t) {
    this.addInterval(new Q(t, t + 1));
  }
  addRange(t, e) {
    this.addInterval(new Q(t, e + 1));
  }
  addInterval(t) {
    if (this.intervals === null)
      this.intervals = [], this.intervals.push(t.clone());
    else {
      for (let e = 0; e < this.intervals.length; e++) {
        const r = this.intervals[e];
        if (t.stop < r.start) {
          this.intervals.splice(e, 0, t);
          return;
        } else if (t.stop === r.start) {
          this.intervals[e] = new Q(t.start, r.stop);
          return;
        } else if (t.start <= r.stop) {
          this.intervals[e] = new Q(Math.min(r.start, t.start), Math.max(r.stop, t.stop)), this.reduce(e);
          return;
        }
      }
      this.intervals.push(t.clone());
    }
  }
  addSet(t) {
    return t.intervals !== null && t.intervals.forEach((e) => this.addInterval(e), this), this;
  }
  reduce(t) {
    if (t < this.intervals.length - 1) {
      const e = this.intervals[t], r = this.intervals[t + 1];
      e.stop >= r.stop ? (this.intervals.splice(t + 1, 1), this.reduce(t)) : e.stop >= r.start && (this.intervals[t] = new Q(e.start, r.stop), this.intervals.splice(t + 1, 1));
    }
  }
  complement(t, e) {
    const r = new oe();
    return r.addInterval(new Q(t, e + 1)), this.intervals !== null && this.intervals.forEach((s) => r.removeRange(s)), r;
  }
  contains(t) {
    if (this.intervals === null)
      return !1;
    for (let e = 0; e < this.intervals.length; e++)
      if (this.intervals[e].contains(t))
        return !0;
    return !1;
  }
  removeRange(t) {
    if (t.start === t.stop - 1)
      this.removeOne(t.start);
    else if (this.intervals !== null) {
      let e = 0;
      for (let r = 0; r < this.intervals.length; r++) {
        const s = this.intervals[e];
        if (t.stop <= s.start)
          return;
        if (t.start > s.start && t.stop < s.stop) {
          this.intervals[e] = new Q(s.start, t.start);
          const i = new Q(t.stop, s.stop);
          this.intervals.splice(e, 0, i);
          return;
        } else
          t.start <= s.start && t.stop >= s.stop ? (this.intervals.splice(e, 1), e = e - 1) : t.start < s.stop ? this.intervals[e] = new Q(s.start, t.start) : t.stop < s.stop && (this.intervals[e] = new Q(t.stop, s.stop));
        e += 1;
      }
    }
  }
  removeOne(t) {
    if (this.intervals !== null)
      for (let e = 0; e < this.intervals.length; e++) {
        const r = this.intervals[e];
        if (t < r.start)
          return;
        if (t === r.start && t === r.stop - 1) {
          this.intervals.splice(e, 1);
          return;
        } else if (t === r.start) {
          this.intervals[e] = new Q(r.start + 1, r.stop);
          return;
        } else if (t === r.stop - 1) {
          this.intervals[e] = new Q(r.start, r.stop - 1);
          return;
        } else if (t < r.stop - 1) {
          const s = new Q(r.start, t);
          r.start = t + 1, this.intervals.splice(e, 0, s);
          return;
        }
      }
  }
  toString(t, e, r) {
    return t = t || null, e = e || null, r = r || !1, this.intervals === null ? "{}" : t !== null || e !== null ? this.toTokenString(t, e) : r ? this.toCharString() : this.toIndexString();
  }
  toCharString() {
    const t = [];
    for (let e = 0; e < this.intervals.length; e++) {
      const r = this.intervals[e];
      r.stop === r.start + 1 ? r.start === b.EOF ? t.push("<EOF>") : t.push("'" + String.fromCharCode(r.start) + "'") : t.push("'" + String.fromCharCode(r.start) + "'..'" + String.fromCharCode(r.stop - 1) + "'");
    }
    return t.length > 1 ? "{" + t.join(", ") + "}" : t[0];
  }
  toIndexString() {
    const t = [];
    for (let e = 0; e < this.intervals.length; e++) {
      const r = this.intervals[e];
      r.stop === r.start + 1 ? r.start === b.EOF ? t.push("<EOF>") : t.push(r.start.toString()) : t.push(r.start.toString() + ".." + (r.stop - 1).toString());
    }
    return t.length > 1 ? "{" + t.join(", ") + "}" : t[0];
  }
  toTokenString(t, e) {
    const r = [];
    for (let s = 0; s < this.intervals.length; s++) {
      const i = this.intervals[s];
      for (let o = i.start; o < i.stop; o++)
        r.push(this.elementName(t, e, o));
    }
    return r.length > 1 ? "{" + r.join(", ") + "}" : r[0];
  }
  elementName(t, e, r) {
    return r === b.EOF ? "<EOF>" : r === b.EPSILON ? "<EPSILON>" : t[r] || e[r];
  }
  get length() {
    return this.intervals.map((t) => t.length).reduce((t, e) => t + e);
  }
}
class N {
  constructor() {
    this.atn = null, this.stateNumber = N.INVALID_STATE_NUMBER, this.stateType = null, this.ruleIndex = 0, this.epsilonOnlyTransitions = !1, this.transitions = [], this.nextTokenWithinRule = null;
  }
  toString() {
    return this.stateNumber;
  }
  equals(t) {
    return t instanceof N ? this.stateNumber === t.stateNumber : !1;
  }
  isNonGreedyExitState() {
    return !1;
  }
  addTransition(t, e) {
    e === void 0 && (e = -1), this.transitions.length === 0 ? this.epsilonOnlyTransitions = t.isEpsilon : this.epsilonOnlyTransitions !== t.isEpsilon && (this.epsilonOnlyTransitions = !1), e === -1 ? this.transitions.push(t) : this.transitions.splice(e, 1, t);
  }
}
N.INVALID_TYPE = 0;
N.BASIC = 1;
N.RULE_START = 2;
N.BLOCK_START = 3;
N.PLUS_BLOCK_START = 4;
N.STAR_BLOCK_START = 5;
N.TOKEN_START = 6;
N.RULE_STOP = 7;
N.BLOCK_END = 8;
N.STAR_LOOP_BACK = 9;
N.STAR_LOOP_ENTRY = 10;
N.PLUS_LOOP_BACK = 11;
N.LOOP_END = 12;
N.serializationNames = [
  "INVALID",
  "BASIC",
  "RULE_START",
  "BLOCK_START",
  "PLUS_BLOCK_START",
  "STAR_BLOCK_START",
  "TOKEN_START",
  "RULE_STOP",
  "BLOCK_END",
  "STAR_LOOP_BACK",
  "STAR_LOOP_ENTRY",
  "PLUS_LOOP_BACK",
  "LOOP_END"
];
N.INVALID_STATE_NUMBER = -1;
class Ft extends N {
  constructor() {
    return super(), this.stateType = N.RULE_STOP, this;
  }
}
class R {
  constructor(t) {
    if (t == null)
      throw "target cannot be null.";
    this.target = t, this.isEpsilon = !1, this.label = null;
  }
}
R.EPSILON = 1;
R.RANGE = 2;
R.RULE = 3;
R.PREDICATE = 4;
R.ATOM = 5;
R.ACTION = 6;
R.SET = 7;
R.NOT_SET = 8;
R.WILDCARD = 9;
R.PRECEDENCE = 10;
R.serializationNames = [
  "INVALID",
  "EPSILON",
  "RANGE",
  "RULE",
  "PREDICATE",
  "ATOM",
  "ACTION",
  "SET",
  "NOT_SET",
  "WILDCARD",
  "PRECEDENCE"
];
R.serializationTypes = {
  EpsilonTransition: R.EPSILON,
  RangeTransition: R.RANGE,
  RuleTransition: R.RULE,
  PredicateTransition: R.PREDICATE,
  AtomTransition: R.ATOM,
  ActionTransition: R.ACTION,
  SetTransition: R.SET,
  NotSetTransition: R.NOT_SET,
  WildcardTransition: R.WILDCARD,
  PrecedencePredicateTransition: R.PRECEDENCE
};
class Bs extends R {
  constructor(t, e, r, s) {
    super(t), this.ruleIndex = e, this.precedence = r, this.followState = s, this.serializationType = R.RULE, this.isEpsilon = !0;
  }
  matches(t, e, r) {
    return !1;
  }
}
class _a extends R {
  constructor(t, e) {
    super(t), this.serializationType = R.SET, e != null ? this.label = e : (this.label = new oe(), this.label.addOne(b.INVALID_TYPE));
  }
  matches(t, e, r) {
    return this.label.contains(t);
  }
  toString() {
    return this.label.toString();
  }
}
class La extends _a {
  constructor(t, e) {
    super(t, e), this.serializationType = R.NOT_SET;
  }
  matches(t, e, r) {
    return t >= e && t <= r && !super.matches(t, e, r);
  }
  toString() {
    return "~" + super.toString();
  }
}
class Gu extends R {
  constructor(t) {
    super(t), this.serializationType = R.WILDCARD;
  }
  matches(t, e, r) {
    return t >= e && t <= r;
  }
  toString() {
    return ".";
  }
}
class va extends R {
  constructor(t) {
    super(t);
  }
}
class e5 {
}
class n5 extends e5 {
}
class ju extends n5 {
}
class Us extends ju {
  getRuleContext() {
    throw new Error("missing interface implementation");
  }
}
class Me extends ju {
}
class ii extends Me {
}
function r5(n, t) {
  return n = n.replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r"), t && (n = n.replace(/ /g, "·")), n;
}
const xe = {
  toStringTree: function(n, t, e) {
    t = t || null, e = e || null, e !== null && (t = e.ruleNames);
    let r = xe.getNodeText(n, t);
    r = r5(r, !1);
    const s = n.getChildCount();
    if (s === 0)
      return r;
    let i = "(" + r + " ";
    s > 0 && (r = xe.toStringTree(n.getChild(0), t), i = i.concat(r));
    for (let o = 1; o < s; o++)
      r = xe.toStringTree(n.getChild(o), t), i = i.concat(" " + r);
    return i = i.concat(")"), i;
  },
  getNodeText: function(n, t, e) {
    if (t = t || null, e = e || null, e !== null && (t = e.ruleNames), t !== null)
      if (n instanceof Us) {
        const i = n.getRuleContext().getAltNumber();
        return i != 0 ? t[n.ruleIndex] + ":" + i : t[n.ruleIndex];
      } else {
        if (n instanceof ii)
          return n.toString();
        if (n instanceof Me && n.symbol !== null)
          return n.symbol.text;
      }
    const r = n.getPayload();
    return r instanceof b ? r.text : n.getPayload().toString();
  },
  getChildren: function(n) {
    const t = [];
    for (let e = 0; e < n.getChildCount(); e++)
      t.push(n.getChild(e));
    return t;
  },
  getAncestors: function(n) {
    let t = [];
    for (n = n.getParent(); n !== null; )
      t = [n].concat(t), n = n.getParent();
    return t;
  },
  findAllTokenNodes: function(n, t) {
    return xe.findAllNodes(n, t, !0);
  },
  findAllRuleNodes: function(n, t) {
    return xe.findAllNodes(n, t, !1);
  },
  findAllNodes: function(n, t, e) {
    const r = [];
    return xe._findAllNodes(n, t, e, r), r;
  },
  _findAllNodes: function(n, t, e, r) {
    e && n instanceof Me ? n.symbol.type === t && r.push(n) : !e && n instanceof Us && n.ruleIndex === t && r.push(n);
    for (let s = 0; s < n.getChildCount(); s++)
      xe._findAllNodes(n.getChild(s), t, e, r);
  },
  descendants: function(n) {
    let t = [n];
    for (let e = 0; e < n.getChildCount(); e++)
      t = t.concat(xe.descendants(n.getChild(e)));
    return t;
  }
};
class Fn extends Us {
  constructor(t, e) {
    super(), this.parentCtx = t || null, this.invokingState = e || -1;
  }
  depth() {
    let t = 0, e = this;
    for (; e !== null; )
      e = e.parentCtx, t += 1;
    return t;
  }
  isEmpty() {
    return this.invokingState === -1;
  }
  getSourceInterval() {
    return Q.INVALID_INTERVAL;
  }
  getRuleContext() {
    return this;
  }
  getPayload() {
    return this;
  }
  getText() {
    return this.getChildCount() === 0 ? "" : this.children.map(function(t) {
      return t.getText();
    }).join("");
  }
  getAltNumber() {
    return 0;
  }
  setAltNumber(t) {
  }
  getChild(t) {
    return null;
  }
  getChildCount() {
    return 0;
  }
  accept(t) {
    return t.visitChildren(this);
  }
  toStringTree(t, e) {
    return xe.toStringTree(this, t, e);
  }
  toString(t, e) {
    t = t || null, e = e || null;
    let r = this, s = "[";
    for (; r !== null && r !== e; ) {
      if (t === null)
        r.isEmpty() || (s += r.invokingState);
      else {
        const i = r.ruleIndex, o = i >= 0 && i < t.length ? t[i] : "" + i;
        s += o;
      }
      r.parentCtx !== null && (t !== null || !r.parentCtx.isEmpty()) && (s += " "), r = r.parentCtx;
    }
    return s += "]", s;
  }
}
class Z {
  constructor(t) {
    this.cachedHashCode = t;
  }
  isEmpty() {
    return this === Z.EMPTY;
  }
  hasEmptyPath() {
    return this.getReturnState(this.length - 1) === Z.EMPTY_RETURN_STATE;
  }
  hashCode() {
    return this.cachedHashCode;
  }
  updateHashCode(t) {
    t.update(this.cachedHashCode);
  }
}
Z.EMPTY = null;
Z.EMPTY_RETURN_STATE = 2147483647;
Z.globalNodeCount = 1;
Z.id = Z.globalNodeCount;
class be extends Z {
  constructor(t, e) {
    const r = new Jt();
    r.update(t, e);
    const s = r.finish();
    return super(s), this.parents = t, this.returnStates = e, this;
  }
  isEmpty() {
    return this.returnStates[0] === Z.EMPTY_RETURN_STATE;
  }
  getParent(t) {
    return this.parents[t];
  }
  getReturnState(t) {
    return this.returnStates[t];
  }
  equals(t) {
    return this === t ? !0 : t instanceof be ? this.hashCode() !== t.hashCode() ? !1 : Dn(this.returnStates, t.returnStates) && Dn(this.parents, t.parents) : !1;
  }
  toString() {
    if (this.isEmpty())
      return "[]";
    {
      let t = "[";
      for (let e = 0; e < this.returnStates.length; e++) {
        if (e > 0 && (t = t + ", "), this.returnStates[e] === Z.EMPTY_RETURN_STATE) {
          t = t + "$";
          continue;
        }
        t = t + this.returnStates[e], this.parents[e] !== null ? t = t + " " + this.parents[e] : t = t + "null";
      }
      return t + "]";
    }
  }
  get length() {
    return this.returnStates.length;
  }
}
class Bt extends Z {
  constructor(t, e) {
    let r = 0;
    const s = new Jt();
    t !== null ? s.update(t, e) : s.update(1), r = s.finish(), super(r), this.parentCtx = t, this.returnState = e;
  }
  getParent(t) {
    return this.parentCtx;
  }
  getReturnState(t) {
    return this.returnState;
  }
  equals(t) {
    return this === t ? !0 : t instanceof Bt ? this.hashCode() !== t.hashCode() || this.returnState !== t.returnState ? !1 : this.parentCtx == null ? t.parentCtx == null : this.parentCtx.equals(t.parentCtx) : !1;
  }
  toString() {
    const t = this.parentCtx === null ? "" : this.parentCtx.toString();
    return t.length === 0 ? this.returnState === Z.EMPTY_RETURN_STATE ? "$" : "" + this.returnState : "" + this.returnState + " " + t;
  }
  get length() {
    return 1;
  }
  static create(t, e) {
    return e === Z.EMPTY_RETURN_STATE && t === null ? Z.EMPTY : new Bt(t, e);
  }
}
class To extends Bt {
  constructor() {
    super(null, Z.EMPTY_RETURN_STATE);
  }
  isEmpty() {
    return !0;
  }
  getParent(t) {
    return null;
  }
  getReturnState(t) {
    return this.returnState;
  }
  equals(t) {
    return this === t;
  }
  toString() {
    return "$";
  }
}
Z.EMPTY = new To();
const sr = "h-";
class Dr {
  constructor(t, e) {
    this.data = {}, this.hashFunction = t || Bu, this.equalsFunction = e || Uu;
  }
  set(t, e) {
    const r = sr + this.hashFunction(t);
    if (r in this.data) {
      const s = this.data[r];
      for (let i = 0; i < s.length; i++) {
        const o = s[i];
        if (this.equalsFunction(t, o.key)) {
          const a = o.value;
          return o.value = e, a;
        }
      }
      return s.push({ key: t, value: e }), e;
    } else
      return this.data[r] = [{ key: t, value: e }], e;
  }
  containsKey(t) {
    const e = sr + this.hashFunction(t);
    if (e in this.data) {
      const r = this.data[e];
      for (let s = 0; s < r.length; s++) {
        const i = r[s];
        if (this.equalsFunction(t, i.key))
          return !0;
      }
    }
    return !1;
  }
  get(t) {
    const e = sr + this.hashFunction(t);
    if (e in this.data) {
      const r = this.data[e];
      for (let s = 0; s < r.length; s++) {
        const i = r[s];
        if (this.equalsFunction(t, i.key))
          return i.value;
      }
    }
    return null;
  }
  entries() {
    return Object.keys(this.data).filter((t) => t.startsWith(sr)).flatMap((t) => this.data[t], this);
  }
  getKeys() {
    return this.entries().map((t) => t.key);
  }
  getValues() {
    return this.entries().map((t) => t.value);
  }
  toString() {
    return "[" + this.entries().map((e) => "{" + e.key + ":" + e.value + "}").join(", ") + "]";
  }
  get length() {
    return Object.keys(this.data).filter((t) => t.startsWith(sr)).map((t) => this.data[t].length, this).reduce((t, e) => t + e, 0);
  }
}
function ya(n, t) {
  if (t == null && (t = Fn.EMPTY), t.parentCtx === null || t === Fn.EMPTY)
    return Z.EMPTY;
  const e = ya(n, t.parentCtx), s = n.states[t.invokingState].transitions[0];
  return Bt.create(e, s.followState.stateNumber);
}
function Vu(n, t, e) {
  if (n.isEmpty())
    return n;
  let r = e.get(n) || null;
  if (r !== null)
    return r;
  if (r = t.get(n), r !== null)
    return e.set(n, r), r;
  let s = !1, i = [];
  for (let a = 0; a < i.length; a++) {
    const l = Vu(n.getParent(a), t, e);
    if (s || l !== n.getParent(a)) {
      if (!s) {
        i = [];
        for (let c = 0; c < n.length; c++)
          i[c] = n.getParent(c);
        s = !0;
      }
      i[a] = l;
    }
  }
  if (!s)
    return t.add(n), e.set(n, n), n;
  let o = null;
  return i.length === 0 ? o = Z.EMPTY : i.length === 1 ? o = Bt.create(i[0], n.getReturnState(0)) : o = new be(i, n.returnStates), t.add(o), e.set(o, o), e.set(n, o), o;
}
function Ca(n, t, e, r) {
  if (n === t)
    return n;
  if (n instanceof Bt && t instanceof Bt)
    return o5(n, t, e, r);
  if (e) {
    if (n instanceof To)
      return n;
    if (t instanceof To)
      return t;
  }
  return n instanceof Bt && (n = new be([n.getParent()], [n.returnState])), t instanceof Bt && (t = new be([t.getParent()], [t.returnState])), s5(n, t, e, r);
}
function s5(n, t, e, r) {
  if (r !== null) {
    let u = r.get(n, t);
    if (u !== null || (u = r.get(t, n), u !== null))
      return u;
  }
  let s = 0, i = 0, o = 0, a = [], l = [];
  for (; s < n.returnStates.length && i < t.returnStates.length; ) {
    const u = n.parents[s], f = t.parents[i];
    if (n.returnStates[s] === t.returnStates[i]) {
      const d = n.returnStates[s];
      d === Z.EMPTY_RETURN_STATE && u === null && f === null || u !== null && f !== null && u === f ? (l[o] = u, a[o] = d) : (l[o] = Ca(u, f, e, r), a[o] = d), s += 1, i += 1;
    } else
      n.returnStates[s] < t.returnStates[i] ? (l[o] = u, a[o] = n.returnStates[s], s += 1) : (l[o] = f, a[o] = t.returnStates[i], i += 1);
    o += 1;
  }
  if (s < n.returnStates.length)
    for (let u = s; u < n.returnStates.length; u++)
      l[o] = n.parents[u], a[o] = n.returnStates[u], o += 1;
  else
    for (let u = i; u < t.returnStates.length; u++)
      l[o] = t.parents[u], a[o] = t.returnStates[u], o += 1;
  if (o < l.length) {
    if (o === 1) {
      const u = Bt.create(
        l[0],
        a[0]
      );
      return r !== null && r.set(n, t, u), u;
    }
    l = l.slice(0, o), a = a.slice(0, o);
  }
  const c = new be(l, a);
  return c === n ? (r !== null && r.set(n, t, n), n) : c === t ? (r !== null && r.set(n, t, t), t) : (i5(l), r !== null && r.set(n, t, c), c);
}
function i5(n) {
  const t = new Dr();
  for (let e = 0; e < n.length; e++) {
    const r = n[e];
    t.containsKey(r) || t.set(r, r);
  }
  for (let e = 0; e < n.length; e++)
    n[e] = t.get(n[e]);
}
function o5(n, t, e, r) {
  if (r !== null) {
    let i = r.get(n, t);
    if (i !== null || (i = r.get(t, n), i !== null))
      return i;
  }
  const s = a5(n, t, e);
  if (s !== null)
    return r !== null && r.set(n, t, s), s;
  if (n.returnState === t.returnState) {
    const i = Ca(n.parentCtx, t.parentCtx, e, r);
    if (i === n.parentCtx)
      return n;
    if (i === t.parentCtx)
      return t;
    const o = Bt.create(i, n.returnState);
    return r !== null && r.set(n, t, o), o;
  } else {
    let i = null;
    if ((n === t || n.parentCtx !== null && n.parentCtx === t.parentCtx) && (i = n.parentCtx), i !== null) {
      const c = [n.returnState, t.returnState];
      n.returnState > t.returnState && (c[0] = t.returnState, c[1] = n.returnState);
      const u = [i, i], f = new be(u, c);
      return r !== null && r.set(n, t, f), f;
    }
    const o = [n.returnState, t.returnState];
    let a = [n.parentCtx, t.parentCtx];
    n.returnState > t.returnState && (o[0] = t.returnState, o[1] = n.returnState, a = [t.parentCtx, n.parentCtx]);
    const l = new be(a, o);
    return r !== null && r.set(n, t, l), l;
  }
}
function a5(n, t, e) {
  if (e) {
    if (n === Z.EMPTY || t === Z.EMPTY)
      return Z.EMPTY;
  } else {
    if (n === Z.EMPTY && t === Z.EMPTY)
      return Z.EMPTY;
    if (n === Z.EMPTY) {
      const r = [
        t.returnState,
        Z.EMPTY_RETURN_STATE
      ], s = [t.parentCtx, null];
      return new be(s, r);
    } else if (t === Z.EMPTY) {
      const r = [n.returnState, Z.EMPTY_RETURN_STATE], s = [n.parentCtx, null];
      return new be(s, r);
    }
  }
  return null;
}
class Ce {
  constructor() {
    this.data = [];
  }
  add(t) {
    this.data[t] = !0;
  }
  or(t) {
    Object.keys(t.data).map((e) => this.add(e), this);
  }
  remove(t) {
    delete this.data[t];
  }
  has(t) {
    return this.data[t] === !0;
  }
  values() {
    return Object.keys(this.data);
  }
  minValue() {
    return Math.min.apply(null, this.values());
  }
  hashCode() {
    return Jt.hashStuff(this.values());
  }
  equals(t) {
    return t instanceof Ce && Dn(this.data, t.data);
  }
  toString() {
    return "{" + this.values().join(", ") + "}";
  }
  get length() {
    return this.values().length;
  }
}
class Bn {
  constructor(t) {
    this.atn = t;
  }
  getDecisionLookahead(t) {
    if (t === null)
      return null;
    const e = t.transitions.length, r = [];
    for (let s = 0; s < e; s++) {
      r[s] = new oe();
      const i = new Xt(), o = !1;
      this._LOOK(
        t.transition(s).target,
        null,
        Z.EMPTY,
        r[s],
        i,
        new Ce(),
        o,
        !1
      ), (r[s].length === 0 || r[s].contains(Bn.HIT_PRED)) && (r[s] = null);
    }
    return r;
  }
  LOOK(t, e, r) {
    const s = new oe(), i = !0;
    r = r || null;
    const o = r !== null ? ya(t.atn, r) : null;
    return this._LOOK(t, e, o, s, new Xt(), new Ce(), i, !0), s;
  }
  _LOOK(t, e, r, s, i, o, a, l) {
    const c = new Lt({ state: t, alt: 0, context: r }, null);
    if (!i.has(c)) {
      if (i.add(c), t === e) {
        if (r === null) {
          s.addOne(b.EPSILON);
          return;
        } else if (r.isEmpty() && l) {
          s.addOne(b.EOF);
          return;
        }
      }
      if (t instanceof Ft) {
        if (r === null) {
          s.addOne(b.EPSILON);
          return;
        } else if (r.isEmpty() && l) {
          s.addOne(b.EOF);
          return;
        }
        if (r !== Z.EMPTY) {
          const u = o.has(t.ruleIndex);
          try {
            o.remove(t.ruleIndex);
            for (let f = 0; f < r.length; f++) {
              const d = this.atn.states[r.getReturnState(f)];
              this._LOOK(d, e, r.getParent(f), s, i, o, a, l);
            }
          } finally {
            u && o.add(t.ruleIndex);
          }
          return;
        }
      }
      for (let u = 0; u < t.transitions.length; u++) {
        const f = t.transitions[u];
        if (f.constructor === Bs) {
          if (o.has(f.target.ruleIndex))
            continue;
          const d = Bt.create(r, f.followState.stateNumber);
          try {
            o.add(f.target.ruleIndex), this._LOOK(f.target, e, d, s, i, o, a, l);
          } finally {
            o.remove(f.target.ruleIndex);
          }
        } else if (f instanceof va)
          a ? this._LOOK(f.target, e, r, s, i, o, a, l) : s.addOne(Bn.HIT_PRED);
        else if (f.isEpsilon)
          this._LOOK(f.target, e, r, s, i, o, a, l);
        else if (f.constructor === Gu)
          s.addRange(b.MIN_USER_TOKEN_TYPE, this.atn.maxTokenType);
        else {
          let d = f.label;
          d !== null && (f instanceof La && (d = d.complement(b.MIN_USER_TOKEN_TYPE, this.atn.maxTokenType)), s.addSet(d));
        }
      }
    }
  }
}
Bn.HIT_PRED = b.INVALID_TYPE;
class pt {
  constructor(t, e) {
    this.grammarType = t, this.maxTokenType = e, this.states = [], this.decisionToState = [], this.ruleToStartState = [], this.ruleToStopState = null, this.modeNameToStartState = {}, this.ruleToTokenType = null, this.lexerActions = null, this.modeToStartState = [];
  }
  nextTokensInContext(t, e) {
    return new Bn(this).LOOK(t, null, e);
  }
  nextTokensNoContext(t) {
    return t.nextTokenWithinRule !== null || (t.nextTokenWithinRule = this.nextTokensInContext(t, null), t.nextTokenWithinRule.readOnly = !0), t.nextTokenWithinRule;
  }
  nextTokens(t, e) {
    return e === void 0 ? this.nextTokensNoContext(t) : this.nextTokensInContext(t, e);
  }
  addState(t) {
    t !== null && (t.atn = this, t.stateNumber = this.states.length), this.states.push(t);
  }
  removeState(t) {
    this.states[t.stateNumber] = null;
  }
  defineDecisionState(t) {
    return this.decisionToState.push(t), t.decision = this.decisionToState.length - 1, t.decision;
  }
  getDecisionState(t) {
    return this.decisionToState.length === 0 ? null : this.decisionToState[t];
  }
  getExpectedTokens(t, e) {
    if (t < 0 || t >= this.states.length)
      throw "Invalid state number.";
    const r = this.states[t];
    let s = this.nextTokens(r);
    if (!s.contains(b.EPSILON))
      return s;
    const i = new oe();
    for (i.addSet(s), i.removeOne(b.EPSILON); e !== null && e.invokingState >= 0 && s.contains(b.EPSILON); ) {
      const a = this.states[e.invokingState].transitions[0];
      s = this.nextTokens(a.followState), i.addSet(s), i.removeOne(b.EPSILON), e = e.parentCtx;
    }
    return s.contains(b.EPSILON) && i.addOne(b.EOF), i;
  }
}
pt.INVALID_ALT_NUMBER = 0;
const fs = {
  LEXER: 0,
  PARSER: 1
};
class Bl extends N {
  constructor() {
    super(), this.stateType = N.BASIC;
  }
}
class Zn extends N {
  constructor() {
    return super(), this.decision = -1, this.nonGreedy = !1, this;
  }
}
class Mn extends Zn {
  constructor() {
    return super(), this.endState = null, this;
  }
}
class zi extends N {
  constructor() {
    return super(), this.stateType = N.BLOCK_END, this.startState = null, this;
  }
}
class wn extends N {
  constructor() {
    return super(), this.stateType = N.LOOP_END, this.loopBackState = null, this;
  }
}
class Ul extends N {
  constructor() {
    return super(), this.stateType = N.RULE_START, this.stopState = null, this.isPrecedenceRule = !1, this;
  }
}
class l5 extends Zn {
  constructor() {
    return super(), this.stateType = N.TOKEN_START, this;
  }
}
class Hl extends Zn {
  constructor() {
    return super(), this.stateType = N.PLUS_LOOP_BACK, this;
  }
}
class Zi extends N {
  constructor() {
    return super(), this.stateType = N.STAR_LOOP_BACK, this;
  }
}
class Qe extends Zn {
  constructor() {
    return super(), this.stateType = N.STAR_LOOP_ENTRY, this.loopBackState = null, this.isPrecedenceDecision = null, this;
  }
}
class Wi extends Mn {
  constructor() {
    return super(), this.stateType = N.PLUS_BLOCK_START, this.loopBackState = null, this;
  }
}
class qi extends Mn {
  constructor() {
    return super(), this.stateType = N.STAR_BLOCK_START, this;
  }
}
class Gl extends Mn {
  constructor() {
    return super(), this.stateType = N.BLOCK_START, this;
  }
}
class Es extends R {
  constructor(t, e) {
    super(t), this.label_ = e, this.label = this.makeLabel(), this.serializationType = R.ATOM;
  }
  makeLabel() {
    const t = new oe();
    return t.addOne(this.label_), t;
  }
  matches(t, e, r) {
    return this.label_ === t;
  }
  toString() {
    return this.label_;
  }
}
class jl extends R {
  constructor(t, e, r) {
    super(t), this.serializationType = R.RANGE, this.start = e, this.stop = r, this.label = this.makeLabel();
  }
  makeLabel() {
    const t = new oe();
    return t.addRange(this.start, this.stop), t;
  }
  matches(t, e, r) {
    return t >= this.start && t <= this.stop;
  }
  toString() {
    return "'" + String.fromCharCode(this.start) + "'..'" + String.fromCharCode(this.stop) + "'";
  }
}
class zu extends R {
  constructor(t, e, r, s) {
    super(t), this.serializationType = R.ACTION, this.ruleIndex = e, this.actionIndex = r === void 0 ? -1 : r, this.isCtxDependent = s === void 0 ? !1 : s, this.isEpsilon = !0;
  }
  matches(t, e, r) {
    return !1;
  }
  toString() {
    return "action_" + this.ruleIndex + ":" + this.actionIndex;
  }
}
class ir extends R {
  constructor(t, e) {
    super(t), this.serializationType = R.EPSILON, this.isEpsilon = !0, this.outermostPrecedenceReturn = e;
  }
  matches(t, e, r) {
    return !1;
  }
  toString() {
    return "epsilon";
  }
}
class oi extends J {
  constructor(t, e, r) {
    super(), this.ruleIndex = t === void 0 ? -1 : t, this.predIndex = e === void 0 ? -1 : e, this.isCtxDependent = r === void 0 ? !1 : r;
  }
  evaluate(t, e) {
    const r = this.isCtxDependent ? e : null;
    return t.sempred(r, this.ruleIndex, this.predIndex);
  }
  updateHashCode(t) {
    t.update(this.ruleIndex, this.predIndex, this.isCtxDependent);
  }
  equals(t) {
    return this === t ? !0 : t instanceof oi ? this.ruleIndex === t.ruleIndex && this.predIndex === t.predIndex && this.isCtxDependent === t.isCtxDependent : !1;
  }
  toString() {
    return "{" + this.ruleIndex + ":" + this.predIndex + "}?";
  }
}
J.NONE = new oi();
class Zu extends va {
  constructor(t, e, r, s) {
    super(t), this.serializationType = R.PREDICATE, this.ruleIndex = e, this.predIndex = r, this.isCtxDependent = s, this.isEpsilon = !0;
  }
  matches(t, e, r) {
    return !1;
  }
  getPredicate() {
    return new oi(this.ruleIndex, this.predIndex, this.isCtxDependent);
  }
  toString() {
    return "pred_" + this.ruleIndex + ":" + this.predIndex;
  }
}
class ai extends J {
  constructor(t) {
    super(), this.precedence = t === void 0 ? 0 : t;
  }
  evaluate(t, e) {
    return t.precpred(e, this.precedence);
  }
  evalPrecedence(t, e) {
    return t.precpred(e, this.precedence) ? J.NONE : null;
  }
  compareTo(t) {
    return this.precedence - t.precedence;
  }
  updateHashCode(t) {
    t.update(this.precedence);
  }
  equals(t) {
    return this === t ? !0 : t instanceof ai ? this.precedence === t.precedence : !1;
  }
  toString() {
    return "{" + this.precedence + ">=prec}?";
  }
}
J.PrecedencePredicate = ai;
class c5 extends va {
  constructor(t, e) {
    super(t), this.serializationType = R.PRECEDENCE, this.precedence = e, this.isEpsilon = !0;
  }
  matches(t, e, r) {
    return !1;
  }
  getPredicate() {
    return new ai(this.precedence);
  }
  toString() {
    return this.precedence + " >= _p";
  }
}
class Ar {
  constructor(t) {
    t === void 0 && (t = null), this.readOnly = !1, this.verifyATN = t === null ? !0 : t.verifyATN, this.generateRuleBypassTransitions = t === null ? !1 : t.generateRuleBypassTransitions;
  }
}
Ar.defaultOptions = new Ar();
Ar.defaultOptions.readOnly = !0;
const Ot = {
  CHANNEL: 0,
  CUSTOM: 1,
  MODE: 2,
  MORE: 3,
  POP_MODE: 4,
  PUSH_MODE: 5,
  SKIP: 6,
  TYPE: 7
};
class De {
  constructor(t) {
    this.actionType = t, this.isPositionDependent = !1;
  }
  hashCode() {
    const t = new Jt();
    return this.updateHashCode(t), t.finish();
  }
  updateHashCode(t) {
    t.update(this.actionType);
  }
  equals(t) {
    return this === t;
  }
}
class Ao extends De {
  constructor() {
    super(Ot.SKIP);
  }
  execute(t) {
    t.skip();
  }
  toString() {
    return "skip";
  }
}
Ao.INSTANCE = new Ao();
class Ea extends De {
  constructor(t) {
    super(Ot.CHANNEL), this.channel = t;
  }
  execute(t) {
    t._channel = this.channel;
  }
  updateHashCode(t) {
    t.update(this.actionType, this.channel);
  }
  equals(t) {
    return this === t ? !0 : t instanceof Ea ? this.channel === t.channel : !1;
  }
  toString() {
    return "channel(" + this.channel + ")";
  }
}
class ba extends De {
  constructor(t, e) {
    super(Ot.CUSTOM), this.ruleIndex = t, this.actionIndex = e, this.isPositionDependent = !0;
  }
  execute(t) {
    t.action(null, this.ruleIndex, this.actionIndex);
  }
  updateHashCode(t) {
    t.update(this.actionType, this.ruleIndex, this.actionIndex);
  }
  equals(t) {
    return this === t ? !0 : t instanceof ba ? this.ruleIndex === t.ruleIndex && this.actionIndex === t.actionIndex : !1;
  }
}
class So extends De {
  constructor() {
    super(Ot.MORE);
  }
  execute(t) {
    t.more();
  }
  toString() {
    return "more";
  }
}
So.INSTANCE = new So();
class wa extends De {
  constructor(t) {
    super(Ot.TYPE), this.type = t;
  }
  execute(t) {
    t.type = this.type;
  }
  updateHashCode(t) {
    t.update(this.actionType, this.type);
  }
  equals(t) {
    return this === t ? !0 : t instanceof wa ? this.type === t.type : !1;
  }
  toString() {
    return "type(" + this.type + ")";
  }
}
class Ta extends De {
  constructor(t) {
    super(Ot.PUSH_MODE), this.mode = t;
  }
  execute(t) {
    t.pushMode(this.mode);
  }
  updateHashCode(t) {
    t.update(this.actionType, this.mode);
  }
  equals(t) {
    return this === t ? !0 : t instanceof Ta ? this.mode === t.mode : !1;
  }
  toString() {
    return "pushMode(" + this.mode + ")";
  }
}
class Ro extends De {
  constructor() {
    super(Ot.POP_MODE);
  }
  execute(t) {
    t.popMode();
  }
  toString() {
    return "popMode";
  }
}
Ro.INSTANCE = new Ro();
class Aa extends De {
  constructor(t) {
    super(Ot.MODE), this.mode = t;
  }
  execute(t) {
    t.mode(this.mode);
  }
  updateHashCode(t) {
    t.update(this.actionType, this.mode);
  }
  equals(t) {
    return this === t ? !0 : t instanceof Aa ? this.mode === t.mode : !1;
  }
  toString() {
    return "mode(" + this.mode + ")";
  }
}
const Ki = 4;
function ds(n, t) {
  const e = [];
  return e[n - 1] = t, e.map(function(r) {
    return t;
  });
}
class Wu {
  constructor(t) {
    t == null && (t = Ar.defaultOptions), this.deserializationOptions = t, this.stateFactories = null, this.actionFactories = null;
  }
  deserialize(t) {
    const e = this.reset(t);
    this.checkVersion(e), e && this.skipUUID();
    const r = this.readATN();
    this.readStates(r, e), this.readRules(r, e), this.readModes(r);
    const s = [];
    return this.readSets(r, s, this.readInt.bind(this)), e && this.readSets(r, s, this.readInt32.bind(this)), this.readEdges(r, s), this.readDecisions(r), this.readLexerActions(r, e), this.markPrecedenceDecisions(r), this.verifyATN(r), this.deserializationOptions.generateRuleBypassTransitions && r.grammarType === fs.PARSER && (this.generateRuleBypassTransitions(r), this.verifyATN(r)), r;
  }
  reset(t) {
    if ((t.charCodeAt ? t.charCodeAt(0) : t[0]) === Ki - 1) {
      const r = function(i) {
        const o = i.charCodeAt(0);
        return o > 1 ? o - 2 : o + 65534;
      }, s = t.split("").map(r);
      return s[0] = t.charCodeAt(0), this.data = s, this.pos = 0, !0;
    } else
      return this.data = t, this.pos = 0, !1;
  }
  skipUUID() {
    let t = 0;
    for (; t++ < 8; )
      this.readInt();
  }
  checkVersion(t) {
    const e = this.readInt();
    if (!t && e !== Ki)
      throw "Could not deserialize ATN with version " + e + " (expected " + Ki + ").";
  }
  readATN() {
    const t = this.readInt(), e = this.readInt();
    return new pt(t, e);
  }
  readStates(t, e) {
    let r, s, i;
    const o = [], a = [], l = this.readInt();
    for (let f = 0; f < l; f++) {
      const d = this.readInt();
      if (d === N.INVALID_TYPE) {
        t.addState(null);
        continue;
      }
      let p = this.readInt();
      e && p === 65535 && (p = -1);
      const w = this.stateFactory(d, p);
      if (d === N.LOOP_END) {
        const I = this.readInt();
        o.push([w, I]);
      } else if (w instanceof Mn) {
        const I = this.readInt();
        a.push([w, I]);
      }
      t.addState(w);
    }
    for (r = 0; r < o.length; r++)
      s = o[r], s[0].loopBackState = t.states[s[1]];
    for (r = 0; r < a.length; r++)
      s = a[r], s[0].endState = t.states[s[1]];
    let c = this.readInt();
    for (r = 0; r < c; r++)
      i = this.readInt(), t.states[i].nonGreedy = !0;
    let u = this.readInt();
    for (r = 0; r < u; r++)
      i = this.readInt(), t.states[i].isPrecedenceRule = !0;
  }
  readRules(t, e) {
    let r;
    const s = this.readInt();
    for (t.grammarType === fs.LEXER && (t.ruleToTokenType = ds(s, 0)), t.ruleToStartState = ds(s, 0), r = 0; r < s; r++) {
      const i = this.readInt();
      if (t.ruleToStartState[r] = t.states[i], t.grammarType === fs.LEXER) {
        let o = this.readInt();
        e && o === 65535 && (o = b.EOF), t.ruleToTokenType[r] = o;
      }
    }
    for (t.ruleToStopState = ds(s, 0), r = 0; r < t.states.length; r++) {
      const i = t.states[r];
      i instanceof Ft && (t.ruleToStopState[i.ruleIndex] = i, t.ruleToStartState[i.ruleIndex].stopState = i);
    }
  }
  readModes(t) {
    const e = this.readInt();
    for (let r = 0; r < e; r++) {
      let s = this.readInt();
      t.modeToStartState.push(t.states[s]);
    }
  }
  readSets(t, e, r) {
    const s = this.readInt();
    for (let i = 0; i < s; i++) {
      const o = new oe();
      e.push(o);
      const a = this.readInt();
      this.readInt() !== 0 && o.addOne(-1);
      for (let c = 0; c < a; c++) {
        const u = r(), f = r();
        o.addRange(u, f);
      }
    }
  }
  readEdges(t, e) {
    let r, s, i, o, a;
    const l = this.readInt();
    for (r = 0; r < l; r++) {
      const c = this.readInt(), u = this.readInt(), f = this.readInt(), d = this.readInt(), p = this.readInt(), w = this.readInt();
      o = this.edgeFactory(t, f, c, u, d, p, w, e), t.states[c].addTransition(o);
    }
    for (r = 0; r < t.states.length; r++)
      for (i = t.states[r], s = 0; s < i.transitions.length; s++) {
        const c = i.transitions[s];
        if (!(c instanceof Bs))
          continue;
        let u = -1;
        t.ruleToStartState[c.target.ruleIndex].isPrecedenceRule && c.precedence === 0 && (u = c.target.ruleIndex), o = new ir(c.followState, u), t.ruleToStopState[c.target.ruleIndex].addTransition(o);
      }
    for (r = 0; r < t.states.length; r++) {
      if (i = t.states[r], i instanceof Mn) {
        if (i.endState === null || i.endState.startState !== null)
          throw "IllegalState";
        i.endState.startState = i;
      }
      if (i instanceof Hl)
        for (s = 0; s < i.transitions.length; s++)
          a = i.transitions[s].target, a instanceof Wi && (a.loopBackState = i);
      else if (i instanceof Zi)
        for (s = 0; s < i.transitions.length; s++)
          a = i.transitions[s].target, a instanceof Qe && (a.loopBackState = i);
    }
  }
  readDecisions(t) {
    const e = this.readInt();
    for (let r = 0; r < e; r++) {
      const s = this.readInt(), i = t.states[s];
      t.decisionToState.push(i), i.decision = r;
    }
  }
  readLexerActions(t, e) {
    if (t.grammarType === fs.LEXER) {
      const r = this.readInt();
      t.lexerActions = ds(r, null);
      for (let s = 0; s < r; s++) {
        const i = this.readInt();
        let o = this.readInt();
        e && o === 65535 && (o = -1);
        let a = this.readInt();
        e && a === 65535 && (a = -1), t.lexerActions[s] = this.lexerActionFactory(i, o, a);
      }
    }
  }
  generateRuleBypassTransitions(t) {
    let e;
    const r = t.ruleToStartState.length;
    for (e = 0; e < r; e++)
      t.ruleToTokenType[e] = t.maxTokenType + e + 1;
    for (e = 0; e < r; e++)
      this.generateRuleBypassTransition(t, e);
  }
  generateRuleBypassTransition(t, e) {
    let r, s;
    const i = new Gl();
    i.ruleIndex = e, t.addState(i);
    const o = new zi();
    o.ruleIndex = e, t.addState(o), i.endState = o, t.defineDecisionState(i), o.startState = i;
    let a = null, l = null;
    if (t.ruleToStartState[e].isPrecedenceRule) {
      for (l = null, r = 0; r < t.states.length; r++)
        if (s = t.states[r], this.stateIsEndStateFor(s, e)) {
          l = s, a = s.loopBackState.transitions[0];
          break;
        }
      if (a === null)
        throw "Couldn't identify final state of the precedence rule prefix section.";
    } else
      l = t.ruleToStopState[e];
    for (r = 0; r < t.states.length; r++) {
      s = t.states[r];
      for (let d = 0; d < s.transitions.length; d++) {
        const p = s.transitions[d];
        p !== a && p.target === l && (p.target = o);
      }
    }
    const c = t.ruleToStartState[e], u = c.transitions.length;
    for (; u > 0; )
      i.addTransition(c.transitions[u - 1]), c.transitions = c.transitions.slice(-1);
    t.ruleToStartState[e].addTransition(new ir(i)), o.addTransition(new ir(l));
    const f = new Bl();
    t.addState(f), f.addTransition(new Es(o, t.ruleToTokenType[e])), i.addTransition(new ir(f));
  }
  stateIsEndStateFor(t, e) {
    if (t.ruleIndex !== e || !(t instanceof Qe))
      return null;
    const r = t.transitions[t.transitions.length - 1].target;
    return r instanceof wn && r.epsilonOnlyTransitions && r.transitions[0].target instanceof Ft ? t : null;
  }
  markPrecedenceDecisions(t) {
    for (let e = 0; e < t.states.length; e++) {
      const r = t.states[e];
      if (r instanceof Qe && t.ruleToStartState[r.ruleIndex].isPrecedenceRule) {
        const s = r.transitions[r.transitions.length - 1].target;
        s instanceof wn && s.epsilonOnlyTransitions && s.transitions[0].target instanceof Ft && (r.isPrecedenceDecision = !0);
      }
    }
  }
  verifyATN(t) {
    if (this.deserializationOptions.verifyATN)
      for (let e = 0; e < t.states.length; e++) {
        const r = t.states[e];
        if (r !== null)
          if (this.checkCondition(r.epsilonOnlyTransitions || r.transitions.length <= 1), r instanceof Wi)
            this.checkCondition(r.loopBackState !== null);
          else if (r instanceof Qe)
            if (this.checkCondition(r.loopBackState !== null), this.checkCondition(r.transitions.length === 2), r.transitions[0].target instanceof qi)
              this.checkCondition(r.transitions[1].target instanceof wn), this.checkCondition(!r.nonGreedy);
            else if (r.transitions[0].target instanceof wn)
              this.checkCondition(r.transitions[1].target instanceof qi), this.checkCondition(r.nonGreedy);
            else
              throw "IllegalState";
          else
            r instanceof Zi ? (this.checkCondition(r.transitions.length === 1), this.checkCondition(r.transitions[0].target instanceof Qe)) : r instanceof wn ? this.checkCondition(r.loopBackState !== null) : r instanceof Ul ? this.checkCondition(r.stopState !== null) : r instanceof Mn ? this.checkCondition(r.endState !== null) : r instanceof zi ? this.checkCondition(r.startState !== null) : r instanceof Zn ? this.checkCondition(r.transitions.length <= 1 || r.decision >= 0) : this.checkCondition(r.transitions.length <= 1 || r instanceof Ft);
      }
  }
  checkCondition(t, e) {
    if (!t)
      throw e == null && (e = "IllegalState"), e;
  }
  readInt() {
    return this.data[this.pos++];
  }
  readInt32() {
    const t = this.readInt(), e = this.readInt();
    return t | e << 16;
  }
  edgeFactory(t, e, r, s, i, o, a, l) {
    const c = t.states[s];
    switch (e) {
      case R.EPSILON:
        return new ir(c);
      case R.RANGE:
        return a !== 0 ? new jl(c, b.EOF, o) : new jl(c, i, o);
      case R.RULE:
        return new Bs(t.states[i], o, a, c);
      case R.PREDICATE:
        return new Zu(c, i, o, a !== 0);
      case R.PRECEDENCE:
        return new c5(c, i);
      case R.ATOM:
        return a !== 0 ? new Es(c, b.EOF) : new Es(c, i);
      case R.ACTION:
        return new zu(c, i, o, a !== 0);
      case R.SET:
        return new _a(c, l[i]);
      case R.NOT_SET:
        return new La(c, l[i]);
      case R.WILDCARD:
        return new Gu(c);
      default:
        throw "The specified transition type: " + e + " is not valid.";
    }
  }
  stateFactory(t, e) {
    if (this.stateFactories === null) {
      const r = [];
      r[N.INVALID_TYPE] = null, r[N.BASIC] = () => new Bl(), r[N.RULE_START] = () => new Ul(), r[N.BLOCK_START] = () => new Gl(), r[N.PLUS_BLOCK_START] = () => new Wi(), r[N.STAR_BLOCK_START] = () => new qi(), r[N.TOKEN_START] = () => new l5(), r[N.RULE_STOP] = () => new Ft(), r[N.BLOCK_END] = () => new zi(), r[N.STAR_LOOP_BACK] = () => new Zi(), r[N.STAR_LOOP_ENTRY] = () => new Qe(), r[N.PLUS_LOOP_BACK] = () => new Hl(), r[N.LOOP_END] = () => new wn(), this.stateFactories = r;
    }
    if (t > this.stateFactories.length || this.stateFactories[t] === null)
      throw "The specified state type " + t + " is not valid.";
    {
      const r = this.stateFactories[t]();
      if (r !== null)
        return r.ruleIndex = e, r;
    }
  }
  lexerActionFactory(t, e, r) {
    if (this.actionFactories === null) {
      const s = [];
      s[Ot.CHANNEL] = (i, o) => new Ea(i), s[Ot.CUSTOM] = (i, o) => new ba(i, o), s[Ot.MODE] = (i, o) => new Aa(i), s[Ot.MORE] = (i, o) => So.INSTANCE, s[Ot.POP_MODE] = (i, o) => Ro.INSTANCE, s[Ot.PUSH_MODE] = (i, o) => new Ta(i), s[Ot.SKIP] = (i, o) => Ao.INSTANCE, s[Ot.TYPE] = (i, o) => new wa(i), this.actionFactories = s;
    }
    if (t > this.actionFactories.length || this.actionFactories[t] === null)
      throw "The specified lexer action type " + t + " is not valid.";
    return this.actionFactories[t](e, r);
  }
}
class li {
  syntaxError(t, e, r, s, i, o) {
  }
  reportAmbiguity(t, e, r, s, i, o, a) {
  }
  reportAttemptingFullContext(t, e, r, s, i, o) {
  }
  reportContextSensitivity(t, e, r, s, i, o) {
  }
}
class ko extends li {
  constructor() {
    super();
  }
  syntaxError(t, e, r, s, i, o) {
    console.error("line " + r + ":" + s + " " + i);
  }
}
ko.INSTANCE = new ko();
class u5 extends li {
  constructor(t) {
    if (super(), t === null)
      throw "delegates";
    return this.delegates = t, this;
  }
  syntaxError(t, e, r, s, i, o) {
    this.delegates.map((a) => a.syntaxError(t, e, r, s, i, o));
  }
  reportAmbiguity(t, e, r, s, i, o, a) {
    this.delegates.map((l) => l.reportAmbiguity(t, e, r, s, i, o, a));
  }
  reportAttemptingFullContext(t, e, r, s, i, o) {
    this.delegates.map((a) => a.reportAttemptingFullContext(t, e, r, s, i, o));
  }
  reportContextSensitivity(t, e, r, s, i, o) {
    this.delegates.map((a) => a.reportContextSensitivity(t, e, r, s, i, o));
  }
}
class ci {
  constructor() {
    this._listeners = [ko.INSTANCE], this._interp = null, this._stateNumber = -1;
  }
  checkVersion(t) {
    const e = "4.11.0";
    e !== t && console.log("ANTLR runtime and generated code versions disagree: " + e + "!=" + t);
  }
  addErrorListener(t) {
    this._listeners.push(t);
  }
  removeErrorListeners() {
    this._listeners = [];
  }
  getLiteralNames() {
    return Object.getPrototypeOf(this).constructor.literalNames || [];
  }
  getSymbolicNames() {
    return Object.getPrototypeOf(this).constructor.symbolicNames || [];
  }
  getTokenNames() {
    if (!this.tokenNames) {
      const t = this.getLiteralNames(), e = this.getSymbolicNames(), r = t.length > e.length ? t.length : e.length;
      this.tokenNames = [];
      for (let s = 0; s < r; s++)
        this.tokenNames[s] = t[s] || e[s] || "<INVALID";
    }
    return this.tokenNames;
  }
  getTokenTypeMap() {
    const t = this.getTokenNames();
    if (t === null)
      throw "The current recognizer does not provide a list of token names.";
    let e = this.tokenTypeMapCache[t];
    return e === void 0 && (e = t.reduce(function(r, s, i) {
      r[s] = i;
    }), e.EOF = b.EOF, this.tokenTypeMapCache[t] = e), e;
  }
  getRuleIndexMap() {
    const t = this.ruleNames;
    if (t === null)
      throw "The current recognizer does not provide a list of rule names.";
    let e = this.ruleIndexMapCache[t];
    return e === void 0 && (e = t.reduce(function(r, s, i) {
      r[s] = i;
    }), this.ruleIndexMapCache[t] = e), e;
  }
  getTokenType(t) {
    const e = this.getTokenTypeMap()[t];
    return e !== void 0 ? e : b.INVALID_TYPE;
  }
  getErrorHeader(t) {
    const e = t.getOffendingToken().line, r = t.getOffendingToken().column;
    return "line " + e + ":" + r;
  }
  getTokenErrorDisplay(t) {
    if (t === null)
      return "<no token>";
    let e = t.text;
    return e === null && (t.type === b.EOF ? e = "<EOF>" : e = "<" + t.type + ">"), e = e.replace(`
`, "\\n").replace("\r", "\\r").replace("	", "\\t"), "'" + e + "'";
  }
  getErrorListenerDispatch() {
    return new u5(this._listeners);
  }
  sempred(t, e, r) {
    return !0;
  }
  precpred(t, e) {
    return !0;
  }
  get state() {
    return this._stateNumber;
  }
  set state(t) {
    this._stateNumber = t;
  }
}
ci.tokenTypeMapCache = {};
ci.ruleIndexMapCache = {};
class un extends b {
  constructor(t, e, r, s, i) {
    super(), this.source = t !== void 0 ? t : un.EMPTY_SOURCE, this.type = e !== void 0 ? e : null, this.channel = r !== void 0 ? r : b.DEFAULT_CHANNEL, this.start = s !== void 0 ? s : -1, this.stop = i !== void 0 ? i : -1, this.tokenIndex = -1, this.source[0] !== null ? (this.line = t[0].line, this.column = t[0].column) : this.column = -1;
  }
  clone() {
    const t = new un(this.source, this.type, this.channel, this.start, this.stop);
    return t.tokenIndex = this.tokenIndex, t.line = this.line, t.column = this.column, t.text = this.text, t;
  }
  toString() {
    let t = this.text;
    return t !== null ? t = t.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t") : t = "<no text>", "[@" + this.tokenIndex + "," + this.start + ":" + this.stop + "='" + t + "',<" + this.type + ">" + (this.channel > 0 ? ",channel=" + this.channel : "") + "," + this.line + ":" + this.column + "]";
  }
  get text() {
    if (this._text !== null)
      return this._text;
    const t = this.getInputStream();
    if (t === null)
      return null;
    const e = t.size;
    return this.start < e && this.stop < e ? t.getText(this.start, this.stop) : "<EOF>";
  }
  set text(t) {
    this._text = t;
  }
}
un.EMPTY_SOURCE = [null, null];
class h5 {
}
class Oo extends h5 {
  constructor(t) {
    super(), this.copyText = t === void 0 ? !1 : t;
  }
  create(t, e, r, s, i, o, a, l) {
    const c = new un(t, e, s, i, o);
    return c.line = a, c.column = l, r !== null ? c.text = r : this.copyText && t[1] !== null && (c.text = t[1].getText(i, o)), c;
  }
  createThin(t, e) {
    const r = new un(null, t);
    return r.text = e, r;
  }
}
Oo.DEFAULT = new Oo();
class Ye extends Error {
  constructor(t) {
    super(t.message), Error.captureStackTrace && Error.captureStackTrace(this, Ye), this.message = t.message, this.recognizer = t.recognizer, this.input = t.input, this.ctx = t.ctx, this.offendingToken = null, this.offendingState = -1, this.recognizer !== null && (this.offendingState = this.recognizer.state);
  }
  getExpectedTokens() {
    return this.recognizer !== null ? this.recognizer.atn.getExpectedTokens(this.offendingState, this.ctx) : null;
  }
  toString() {
    return this.message;
  }
}
class Sa extends Ye {
  constructor(t, e, r, s) {
    super({ message: "", recognizer: t, input: e, ctx: null }), this.startIndex = r, this.deadEndConfigs = s;
  }
  toString() {
    let t = "";
    return this.startIndex >= 0 && this.startIndex < this.input.size && (t = this.input.getText(new Q(this.startIndex, this.startIndex))), "LexerNoViableAltException" + t;
  }
}
let vt = class extends ci {
  constructor(t) {
    super(), this._input = t, this._factory = Oo.DEFAULT, this._tokenFactorySourcePair = [this, t], this._interp = null, this._token = null, this._tokenStartCharIndex = -1, this._tokenStartLine = -1, this._tokenStartColumn = -1, this._hitEOF = !1, this._channel = b.DEFAULT_CHANNEL, this._type = b.INVALID_TYPE, this._modeStack = [], this._mode = vt.DEFAULT_MODE, this._text = null;
  }
  reset() {
    this._input !== null && this._input.seek(0), this._token = null, this._type = b.INVALID_TYPE, this._channel = b.DEFAULT_CHANNEL, this._tokenStartCharIndex = -1, this._tokenStartColumn = -1, this._tokenStartLine = -1, this._text = null, this._hitEOF = !1, this._mode = vt.DEFAULT_MODE, this._modeStack = [], this._interp.reset();
  }
  nextToken() {
    if (this._input === null)
      throw "nextToken requires a non-null input stream.";
    const t = this._input.mark();
    try {
      for (; ; ) {
        if (this._hitEOF)
          return this.emitEOF(), this._token;
        this._token = null, this._channel = b.DEFAULT_CHANNEL, this._tokenStartCharIndex = this._input.index, this._tokenStartColumn = this._interp.column, this._tokenStartLine = this._interp.line, this._text = null;
        let e = !1;
        for (; ; ) {
          this._type = b.INVALID_TYPE;
          let r = vt.SKIP;
          try {
            r = this._interp.match(this._input, this._mode);
          } catch (s) {
            if (s instanceof Ye)
              this.notifyListeners(s), this.recover(s);
            else
              throw console.log(s.stack), s;
          }
          if (this._input.LA(1) === b.EOF && (this._hitEOF = !0), this._type === b.INVALID_TYPE && (this._type = r), this._type === vt.SKIP) {
            e = !0;
            break;
          }
          if (this._type !== vt.MORE)
            break;
        }
        if (!e)
          return this._token === null && this.emit(), this._token;
      }
    } finally {
      this._input.release(t);
    }
  }
  skip() {
    this._type = vt.SKIP;
  }
  more() {
    this._type = vt.MORE;
  }
  mode(t) {
    this._mode = t;
  }
  pushMode(t) {
    this._interp.debug && console.log("pushMode " + t), this._modeStack.push(this._mode), this.mode(t);
  }
  popMode() {
    if (this._modeStack.length === 0)
      throw "Empty Stack";
    return this._interp.debug && console.log("popMode back to " + this._modeStack.slice(0, -1)), this.mode(this._modeStack.pop()), this._mode;
  }
  emitToken(t) {
    this._token = t;
  }
  emit() {
    const t = this._factory.create(
      this._tokenFactorySourcePair,
      this._type,
      this._text,
      this._channel,
      this._tokenStartCharIndex,
      this.getCharIndex() - 1,
      this._tokenStartLine,
      this._tokenStartColumn
    );
    return this.emitToken(t), t;
  }
  emitEOF() {
    const t = this.column, e = this.line, r = this._factory.create(
      this._tokenFactorySourcePair,
      b.EOF,
      null,
      b.DEFAULT_CHANNEL,
      this._input.index,
      this._input.index - 1,
      e,
      t
    );
    return this.emitToken(r), r;
  }
  getCharIndex() {
    return this._input.index;
  }
  getAllTokens() {
    const t = [];
    let e = this.nextToken();
    for (; e.type !== b.EOF; )
      t.push(e), e = this.nextToken();
    return t;
  }
  notifyListeners(t) {
    const e = this._tokenStartCharIndex, r = this._input.index, s = this._input.getText(e, r), i = "token recognition error at: '" + this.getErrorDisplay(s) + "'";
    this.getErrorListenerDispatch().syntaxError(
      this,
      null,
      this._tokenStartLine,
      this._tokenStartColumn,
      i,
      t
    );
  }
  getErrorDisplay(t) {
    const e = [];
    for (let r = 0; r < t.length; r++)
      e.push(t[r]);
    return e.join("");
  }
  getErrorDisplayForChar(t) {
    return t.charCodeAt(0) === b.EOF ? "<EOF>" : t === `
` ? "\\n" : t === "	" ? "\\t" : t === "\r" ? "\\r" : t;
  }
  getCharErrorDisplay(t) {
    return "'" + this.getErrorDisplayForChar(t) + "'";
  }
  recover(t) {
    this._input.LA(1) !== b.EOF && (t instanceof Sa ? this._interp.consume(this._input) : this._input.consume());
  }
  get inputStream() {
    return this._input;
  }
  set inputStream(t) {
    this._input = null, this._tokenFactorySourcePair = [this, this._input], this.reset(), this._input = t, this._tokenFactorySourcePair = [this, this._input];
  }
  get sourceName() {
    return this._input.sourceName;
  }
  get type() {
    return this._type;
  }
  set type(t) {
    this._type = t;
  }
  get line() {
    return this._interp.line;
  }
  set line(t) {
    this._interp.line = t;
  }
  get column() {
    return this._interp.column;
  }
  set column(t) {
    this._interp.column = t;
  }
  get text() {
    return this._text !== null ? this._text : this._interp.getText(this._input);
  }
  set text(t) {
    this._text = t;
  }
};
vt.DEFAULT_MODE = 0;
vt.MORE = -2;
vt.SKIP = -3;
vt.DEFAULT_TOKEN_CHANNEL = b.DEFAULT_CHANNEL;
vt.HIDDEN = b.HIDDEN_CHANNEL;
vt.MIN_CHAR_VALUE = 0;
vt.MAX_CHAR_VALUE = 1114111;
function f5(n) {
  return n.hashCodeForConfigSet();
}
function d5(n, t) {
  return n === t ? !0 : n === null || t === null ? !1 : n.equalsForConfigSet(t);
}
class Pt {
  constructor(t) {
    this.configLookup = new Xt(f5, d5), this.fullCtx = t === void 0 ? !0 : t, this.readOnly = !1, this.configs = [], this.uniqueAlt = 0, this.conflictingAlts = null, this.hasSemanticContext = !1, this.dipsIntoOuterContext = !1, this.cachedHashCode = -1;
  }
  add(t, e) {
    if (e === void 0 && (e = null), this.readOnly)
      throw "This set is readonly";
    t.semanticContext !== J.NONE && (this.hasSemanticContext = !0), t.reachesIntoOuterContext > 0 && (this.dipsIntoOuterContext = !0);
    const r = this.configLookup.add(t);
    if (r === t)
      return this.cachedHashCode = -1, this.configs.push(t), !0;
    const s = !this.fullCtx, i = Ca(r.context, t.context, s, e);
    return r.reachesIntoOuterContext = Math.max(r.reachesIntoOuterContext, t.reachesIntoOuterContext), t.precedenceFilterSuppressed && (r.precedenceFilterSuppressed = !0), r.context = i, !0;
  }
  getStates() {
    const t = new Xt();
    for (let e = 0; e < this.configs.length; e++)
      t.add(this.configs[e].state);
    return t;
  }
  getPredicates() {
    const t = [];
    for (let e = 0; e < this.configs.length; e++) {
      const r = this.configs[e].semanticContext;
      r !== J.NONE && t.push(r.semanticContext);
    }
    return t;
  }
  optimizeConfigs(t) {
    if (this.readOnly)
      throw "This set is readonly";
    if (this.configLookup.length !== 0)
      for (let e = 0; e < this.configs.length; e++) {
        const r = this.configs[e];
        r.context = t.getCachedContext(r.context);
      }
  }
  addAll(t) {
    for (let e = 0; e < t.length; e++)
      this.add(t[e]);
    return !1;
  }
  equals(t) {
    return this === t || t instanceof Pt && Dn(this.configs, t.configs) && this.fullCtx === t.fullCtx && this.uniqueAlt === t.uniqueAlt && this.conflictingAlts === t.conflictingAlts && this.hasSemanticContext === t.hasSemanticContext && this.dipsIntoOuterContext === t.dipsIntoOuterContext;
  }
  hashCode() {
    const t = new Jt();
    return t.update(this.configs), t.finish();
  }
  updateHashCode(t) {
    this.readOnly ? (this.cachedHashCode === -1 && (this.cachedHashCode = this.hashCode()), t.update(this.cachedHashCode)) : t.update(this.hashCode());
  }
  isEmpty() {
    return this.configs.length === 0;
  }
  contains(t) {
    if (this.configLookup === null)
      throw "This method is not implemented for readonly sets.";
    return this.configLookup.contains(t);
  }
  containsFast(t) {
    if (this.configLookup === null)
      throw "This method is not implemented for readonly sets.";
    return this.configLookup.containsFast(t);
  }
  clear() {
    if (this.readOnly)
      throw "This set is readonly";
    this.configs = [], this.cachedHashCode = -1, this.configLookup = new Xt();
  }
  setReadonly(t) {
    this.readOnly = t, t && (this.configLookup = null);
  }
  toString() {
    return Ue(this.configs) + (this.hasSemanticContext ? ",hasSemanticContext=" + this.hasSemanticContext : "") + (this.uniqueAlt !== pt.INVALID_ALT_NUMBER ? ",uniqueAlt=" + this.uniqueAlt : "") + (this.conflictingAlts !== null ? ",conflictingAlts=" + this.conflictingAlts : "") + (this.dipsIntoOuterContext ? ",dipsIntoOuterContext" : "");
  }
  get items() {
    return this.configs;
  }
  get length() {
    return this.configs.length;
  }
}
class Oe {
  constructor(t, e) {
    return t === null && (t = -1), e === null && (e = new Pt()), this.stateNumber = t, this.configs = e, this.edges = null, this.isAcceptState = !1, this.prediction = 0, this.lexerActionExecutor = null, this.requiresFullContext = !1, this.predicates = null, this;
  }
  getAltSet() {
    const t = new Xt();
    if (this.configs !== null)
      for (let e = 0; e < this.configs.length; e++) {
        const r = this.configs[e];
        t.add(r.alt);
      }
    return t.length === 0 ? null : t;
  }
  equals(t) {
    return this === t || t instanceof Oe && this.configs.equals(t.configs);
  }
  toString() {
    let t = "" + this.stateNumber + ":" + this.configs;
    return this.isAcceptState && (t = t + "=>", this.predicates !== null ? t = t + this.predicates : t = t + this.prediction), t;
  }
  hashCode() {
    const t = new Jt();
    return t.update(this.configs), t.finish();
  }
}
class Le {
  constructor(t, e) {
    return this.atn = t, this.sharedContextCache = e, this;
  }
  getCachedContext(t) {
    if (this.sharedContextCache === null)
      return t;
    const e = new Dr();
    return Vu(t, this.sharedContextCache, e);
  }
}
Le.ERROR = new Oe(2147483647, new Pt());
class Vl extends Pt {
  constructor() {
    super(), this.configLookup = new Xt();
  }
}
class jt extends Lt {
  constructor(t, e) {
    super(t, e);
    const r = t.lexerActionExecutor || null;
    return this.lexerActionExecutor = r || (e !== null ? e.lexerActionExecutor : null), this.passedThroughNonGreedyDecision = e !== null ? this.checkNonGreedyDecision(e, this.state) : !1, this.hashCodeForConfigSet = jt.prototype.hashCode, this.equalsForConfigSet = jt.prototype.equals, this;
  }
  updateHashCode(t) {
    t.update(this.state.stateNumber, this.alt, this.context, this.semanticContext, this.passedThroughNonGreedyDecision, this.lexerActionExecutor);
  }
  equals(t) {
    return this === t || t instanceof jt && this.passedThroughNonGreedyDecision === t.passedThroughNonGreedyDecision && (this.lexerActionExecutor ? this.lexerActionExecutor.equals(t.lexerActionExecutor) : !t.lexerActionExecutor) && super.equals(t);
  }
  checkNonGreedyDecision(t, e) {
    return t.passedThroughNonGreedyDecision || e instanceof Zn && e.nonGreedy;
  }
}
class dr extends De {
  constructor(t, e) {
    super(e.actionType), this.offset = t, this.action = e, this.isPositionDependent = !0;
  }
  execute(t) {
    this.action.execute(t);
  }
  updateHashCode(t) {
    t.update(this.actionType, this.offset, this.action);
  }
  equals(t) {
    return this === t ? !0 : t instanceof dr ? this.offset === t.offset && this.action === t.action : !1;
  }
}
class On {
  constructor(t) {
    return this.lexerActions = t === null ? [] : t, this.cachedHashCode = Jt.hashStuff(t), this;
  }
  fixOffsetBeforeMatch(t) {
    let e = null;
    for (let r = 0; r < this.lexerActions.length; r++)
      this.lexerActions[r].isPositionDependent && !(this.lexerActions[r] instanceof dr) && (e === null && (e = this.lexerActions.concat([])), e[r] = new dr(
        t,
        this.lexerActions[r]
      ));
    return e === null ? this : new On(e);
  }
  execute(t, e, r) {
    let s = !1;
    const i = e.index;
    try {
      for (let o = 0; o < this.lexerActions.length; o++) {
        let a = this.lexerActions[o];
        if (a instanceof dr) {
          const l = a.offset;
          e.seek(r + l), a = a.action, s = r + l !== i;
        } else
          a.isPositionDependent && (e.seek(i), s = !1);
        a.execute(t);
      }
    } finally {
      s && e.seek(i);
    }
  }
  hashCode() {
    return this.cachedHashCode;
  }
  updateHashCode(t) {
    t.update(this.cachedHashCode);
  }
  equals(t) {
    if (this === t)
      return !0;
    if (t instanceof On) {
      if (this.cachedHashCode != t.cachedHashCode)
        return !1;
      if (this.lexerActions.length != t.lexerActions.length)
        return !1;
      {
        const e = this.lexerActions.length;
        for (let r = 0; r < e; ++r)
          if (!this.lexerActions[r].equals(t.lexerActions[r]))
            return !1;
        return !0;
      }
    } else
      return !1;
  }
  static append(t, e) {
    if (t === null)
      return new On([e]);
    const r = t.lexerActions.concat([e]);
    return new On(r);
  }
}
function zl(n) {
  n.index = -1, n.line = 0, n.column = -1, n.dfaState = null;
}
class p5 {
  constructor() {
    zl(this);
  }
  reset() {
    zl(this);
  }
}
class mt extends Le {
  constructor(t, e, r, s) {
    super(e, s), this.decisionToDFA = r, this.recog = t, this.startIndex = -1, this.line = 1, this.column = 0, this.mode = vt.DEFAULT_MODE, this.prevAccept = new p5();
  }
  copyState(t) {
    this.column = t.column, this.line = t.line, this.mode = t.mode, this.startIndex = t.startIndex;
  }
  match(t, e) {
    this.mode = e;
    const r = t.mark();
    try {
      this.startIndex = t.index, this.prevAccept.reset();
      const s = this.decisionToDFA[e];
      return s.s0 === null ? this.matchATN(t) : this.execATN(t, s.s0);
    } finally {
      t.release(r);
    }
  }
  reset() {
    this.prevAccept.reset(), this.startIndex = -1, this.line = 1, this.column = 0, this.mode = vt.DEFAULT_MODE;
  }
  matchATN(t) {
    const e = this.atn.modeToStartState[this.mode];
    mt.debug && console.log("matchATN mode " + this.mode + " start: " + e);
    const r = this.mode, s = this.computeStartState(t, e), i = s.hasSemanticContext;
    s.hasSemanticContext = !1;
    const o = this.addDFAState(s);
    i || (this.decisionToDFA[this.mode].s0 = o);
    const a = this.execATN(t, o);
    return mt.debug && console.log("DFA after matchATN: " + this.decisionToDFA[r].toLexerString()), a;
  }
  execATN(t, e) {
    mt.debug && console.log("start state closure=" + e.configs), e.isAcceptState && this.captureSimState(this.prevAccept, t, e);
    let r = t.LA(1), s = e;
    for (; ; ) {
      mt.debug && console.log("execATN loop starting closure: " + s.configs);
      let i = this.getExistingTargetState(s, r);
      if (i === null && (i = this.computeTargetState(t, s, r)), i === Le.ERROR || (r !== b.EOF && this.consume(t), i.isAcceptState && (this.captureSimState(this.prevAccept, t, i), r === b.EOF)))
        break;
      r = t.LA(1), s = i;
    }
    return this.failOrAccept(this.prevAccept, t, s.configs, r);
  }
  getExistingTargetState(t, e) {
    if (t.edges === null || e < mt.MIN_DFA_EDGE || e > mt.MAX_DFA_EDGE)
      return null;
    let r = t.edges[e - mt.MIN_DFA_EDGE];
    return r === void 0 && (r = null), mt.debug && r !== null && console.log("reuse state " + t.stateNumber + " edge to " + r.stateNumber), r;
  }
  computeTargetState(t, e, r) {
    const s = new Vl();
    return this.getReachableConfigSet(t, e.configs, s, r), s.items.length === 0 ? (s.hasSemanticContext || this.addDFAEdge(e, r, Le.ERROR), Le.ERROR) : this.addDFAEdge(e, r, null, s);
  }
  failOrAccept(t, e, r, s) {
    if (this.prevAccept.dfaState !== null) {
      const i = t.dfaState.lexerActionExecutor;
      return this.accept(
        e,
        i,
        this.startIndex,
        t.index,
        t.line,
        t.column
      ), t.dfaState.prediction;
    } else {
      if (s === b.EOF && e.index === this.startIndex)
        return b.EOF;
      throw new Sa(this.recog, e, this.startIndex, r);
    }
  }
  getReachableConfigSet(t, e, r, s) {
    let i = pt.INVALID_ALT_NUMBER;
    for (let o = 0; o < e.items.length; o++) {
      const a = e.items[o], l = a.alt === i;
      if (!(l && a.passedThroughNonGreedyDecision)) {
        mt.debug && console.log(`testing %s at %s
`, this.getTokenName(s), a.toString(this.recog, !0));
        for (let c = 0; c < a.state.transitions.length; c++) {
          const u = a.state.transitions[c], f = this.getReachableTarget(u, s);
          if (f !== null) {
            let d = a.lexerActionExecutor;
            d !== null && (d = d.fixOffsetBeforeMatch(t.index - this.startIndex));
            const p = s === b.EOF, w = new jt({ state: f, lexerActionExecutor: d }, a);
            this.closure(
              t,
              w,
              r,
              l,
              !0,
              p
            ) && (i = a.alt);
          }
        }
      }
    }
  }
  accept(t, e, r, s, i, o) {
    mt.debug && console.log(`ACTION %s
`, e), t.seek(s), this.line = i, this.column = o, e !== null && this.recog !== null && e.execute(this.recog, t, r);
  }
  getReachableTarget(t, e) {
    return t.matches(e, 0, vt.MAX_CHAR_VALUE) ? t.target : null;
  }
  computeStartState(t, e) {
    const r = Z.EMPTY, s = new Vl();
    for (let i = 0; i < e.transitions.length; i++) {
      const o = e.transitions[i].target, a = new jt({ state: o, alt: i + 1, context: r }, null);
      this.closure(t, a, s, !1, !1, !1);
    }
    return s;
  }
  closure(t, e, r, s, i, o) {
    let a = null;
    if (mt.debug && console.log("closure(" + e.toString(this.recog, !0) + ")"), e.state instanceof Ft) {
      if (mt.debug && (this.recog !== null ? console.log(`closure at %s rule stop %s
`, this.recog.ruleNames[e.state.ruleIndex], e) : console.log(`closure at rule stop %s
`, e)), e.context === null || e.context.hasEmptyPath()) {
        if (e.context === null || e.context.isEmpty())
          return r.add(e), !0;
        r.add(new jt({ state: e.state, context: Z.EMPTY }, e)), s = !0;
      }
      if (e.context !== null && !e.context.isEmpty()) {
        for (let l = 0; l < e.context.length; l++)
          if (e.context.getReturnState(l) !== Z.EMPTY_RETURN_STATE) {
            const c = e.context.getParent(l), u = this.atn.states[e.context.getReturnState(l)];
            a = new jt({ state: u, context: c }, e), s = this.closure(
              t,
              a,
              r,
              s,
              i,
              o
            );
          }
      }
      return s;
    }
    e.state.epsilonOnlyTransitions || (!s || !e.passedThroughNonGreedyDecision) && r.add(e);
    for (let l = 0; l < e.state.transitions.length; l++) {
      const c = e.state.transitions[l];
      a = this.getEpsilonTarget(t, e, c, r, i, o), a !== null && (s = this.closure(
        t,
        a,
        r,
        s,
        i,
        o
      ));
    }
    return s;
  }
  getEpsilonTarget(t, e, r, s, i, o) {
    let a = null;
    if (r.serializationType === R.RULE) {
      const l = Bt.create(e.context, r.followState.stateNumber);
      a = new jt({ state: r.target, context: l }, e);
    } else {
      if (r.serializationType === R.PRECEDENCE)
        throw "Precedence predicates are not supported in lexers.";
      if (r.serializationType === R.PREDICATE)
        mt.debug && console.log("EVAL rule " + r.ruleIndex + ":" + r.predIndex), s.hasSemanticContext = !0, this.evaluatePredicate(t, r.ruleIndex, r.predIndex, i) && (a = new jt({ state: r.target }, e));
      else if (r.serializationType === R.ACTION)
        if (e.context === null || e.context.hasEmptyPath()) {
          const l = On.append(
            e.lexerActionExecutor,
            this.atn.lexerActions[r.actionIndex]
          );
          a = new jt({ state: r.target, lexerActionExecutor: l }, e);
        } else
          a = new jt({ state: r.target }, e);
      else
        r.serializationType === R.EPSILON ? a = new jt({ state: r.target }, e) : (r.serializationType === R.ATOM || r.serializationType === R.RANGE || r.serializationType === R.SET) && o && r.matches(b.EOF, 0, vt.MAX_CHAR_VALUE) && (a = new jt({ state: r.target }, e));
    }
    return a;
  }
  evaluatePredicate(t, e, r, s) {
    if (this.recog === null)
      return !0;
    if (!s)
      return this.recog.sempred(null, e, r);
    const i = this.column, o = this.line, a = t.index, l = t.mark();
    try {
      return this.consume(t), this.recog.sempred(null, e, r);
    } finally {
      this.column = i, this.line = o, t.seek(a), t.release(l);
    }
  }
  captureSimState(t, e, r) {
    t.index = e.index, t.line = this.line, t.column = this.column, t.dfaState = r;
  }
  addDFAEdge(t, e, r, s) {
    if (r === void 0 && (r = null), s === void 0 && (s = null), r === null && s !== null) {
      const i = s.hasSemanticContext;
      if (s.hasSemanticContext = !1, r = this.addDFAState(s), i)
        return r;
    }
    return e < mt.MIN_DFA_EDGE || e > mt.MAX_DFA_EDGE || (mt.debug && console.log("EDGE " + t + " -> " + r + " upon " + e), t.edges === null && (t.edges = []), t.edges[e - mt.MIN_DFA_EDGE] = r), r;
  }
  addDFAState(t) {
    const e = new Oe(null, t);
    let r = null;
    for (let a = 0; a < t.items.length; a++) {
      const l = t.items[a];
      if (l.state instanceof Ft) {
        r = l;
        break;
      }
    }
    r !== null && (e.isAcceptState = !0, e.lexerActionExecutor = r.lexerActionExecutor, e.prediction = this.atn.ruleToTokenType[r.state.ruleIndex]);
    const s = this.decisionToDFA[this.mode], i = s.states.get(e);
    if (i !== null)
      return i;
    const o = e;
    return o.stateNumber = s.states.length, t.setReadonly(!0), o.configs = t, s.states.add(o), o;
  }
  getDFA(t) {
    return this.decisionToDFA[t];
  }
  getText(t) {
    return t.getText(this.startIndex, t.index - 1);
  }
  consume(t) {
    t.LA(1) === `
`.charCodeAt(0) ? (this.line += 1, this.column = 0) : this.column += 1, t.consume();
  }
  getTokenName(t) {
    return t === -1 ? "EOF" : "'" + String.fromCharCode(t) + "'";
  }
}
mt.debug = !1;
mt.dfa_debug = !1;
mt.MIN_DFA_EDGE = 0;
mt.MAX_DFA_EDGE = 127;
class qu {
  constructor(t, e) {
    this.alt = e, this.pred = t;
  }
  toString() {
    return "(" + this.pred + ", " + this.alt + ")";
  }
}
class g5 {
  constructor() {
    this.data = {};
  }
  get(t) {
    return this.data["k-" + t] || null;
  }
  set(t, e) {
    this.data["k-" + t] = e;
  }
  values() {
    return Object.keys(this.data).filter((t) => t.startsWith("k-")).map((t) => this.data[t], this);
  }
}
const at = {
  SLL: 0,
  LL: 1,
  LL_EXACT_AMBIG_DETECTION: 2,
  hasSLLConflictTerminatingPrediction: function(n, t) {
    if (at.allConfigsInRuleStopStates(t))
      return !0;
    if (n === at.SLL && t.hasSemanticContext) {
      const r = new Pt();
      for (let s = 0; s < t.items.length; s++) {
        let i = t.items[s];
        i = new Lt({ semanticContext: J.NONE }, i), r.add(i);
      }
      t = r;
    }
    const e = at.getConflictingAltSubsets(t);
    return at.hasConflictingAltSet(e) && !at.hasStateAssociatedWithOneAlt(t);
  },
  hasConfigInRuleStopState: function(n) {
    for (let t = 0; t < n.items.length; t++)
      if (n.items[t].state instanceof Ft)
        return !0;
    return !1;
  },
  allConfigsInRuleStopStates: function(n) {
    for (let t = 0; t < n.items.length; t++)
      if (!(n.items[t].state instanceof Ft))
        return !1;
    return !0;
  },
  resolvesToJustOneViableAlt: function(n) {
    return at.getSingleViableAlt(n);
  },
  allSubsetsConflict: function(n) {
    return !at.hasNonConflictingAltSet(n);
  },
  hasNonConflictingAltSet: function(n) {
    for (let t = 0; t < n.length; t++)
      if (n[t].length === 1)
        return !0;
    return !1;
  },
  hasConflictingAltSet: function(n) {
    for (let t = 0; t < n.length; t++)
      if (n[t].length > 1)
        return !0;
    return !1;
  },
  allSubsetsEqual: function(n) {
    let t = null;
    for (let e = 0; e < n.length; e++) {
      const r = n[e];
      if (t === null)
        t = r;
      else if (r !== t)
        return !1;
    }
    return !0;
  },
  getUniqueAlt: function(n) {
    const t = at.getAlts(n);
    return t.length === 1 ? t.minValue() : pt.INVALID_ALT_NUMBER;
  },
  getAlts: function(n) {
    const t = new Ce();
    return n.map(function(e) {
      t.or(e);
    }), t;
  },
  getConflictingAltSubsets: function(n) {
    const t = new Dr();
    return t.hashFunction = function(e) {
      Jt.hashStuff(e.state.stateNumber, e.context);
    }, t.equalsFunction = function(e, r) {
      return e.state.stateNumber === r.state.stateNumber && e.context.equals(r.context);
    }, n.items.map(function(e) {
      let r = t.get(e);
      r === null && (r = new Ce(), t.set(e, r)), r.add(e.alt);
    }), t.getValues();
  },
  getStateToAltMap: function(n) {
    const t = new g5();
    return n.items.map(function(e) {
      let r = t.get(e.state);
      r === null && (r = new Ce(), t.set(e.state, r)), r.add(e.alt);
    }), t;
  },
  hasStateAssociatedWithOneAlt: function(n) {
    const t = at.getStateToAltMap(n).values();
    for (let e = 0; e < t.length; e++)
      if (t[e].length === 1)
        return !0;
    return !1;
  },
  getSingleViableAlt: function(n) {
    let t = null;
    for (let e = 0; e < n.length; e++) {
      const s = n[e].minValue();
      if (t === null)
        t = s;
      else if (t !== s)
        return pt.INVALID_ALT_NUMBER;
    }
    return t;
  }
};
class Ra extends Ye {
  constructor(t, e, r, s, i, o) {
    o = o || t._ctx, s = s || t.getCurrentToken(), r = r || t.getCurrentToken(), e = e || t.getInputStream(), super({ message: "", recognizer: t, input: e, ctx: o }), this.deadEndConfigs = i, this.startToken = r, this.offendingToken = s;
  }
}
class x5 {
  constructor(t) {
    this.defaultMapCtor = t || Dr, this.cacheMap = new this.defaultMapCtor();
  }
  get(t, e) {
    const r = this.cacheMap.get(t) || null;
    return r === null ? null : r.get(e) || null;
  }
  set(t, e, r) {
    let s = this.cacheMap.get(t) || null;
    s === null && (s = new this.defaultMapCtor(), this.cacheMap.set(t, s)), s.set(e, r);
  }
}
class m5 extends Le {
  constructor(t, e, r, s) {
    super(e, s), this.parser = t, this.decisionToDFA = r, this.predictionMode = at.LL, this._input = null, this._startIndex = 0, this._outerContext = null, this._dfa = null, this.mergeCache = null, this.debug = !1, this.debug_closure = !1, this.debug_add = !1, this.debug_list_atn_decisions = !1, this.dfa_debug = !1, this.retry_debug = !1;
  }
  reset() {
  }
  adaptivePredict(t, e, r) {
    (this.debug || this.debug_list_atn_decisions) && console.log("adaptivePredict decision " + e + " exec LA(1)==" + this.getLookaheadName(t) + " line " + t.LT(1).line + ":" + t.LT(1).column), this._input = t, this._startIndex = t.index, this._outerContext = r;
    const s = this.decisionToDFA[e];
    this._dfa = s;
    const i = t.mark(), o = t.index;
    try {
      let a;
      if (s.precedenceDfa ? a = s.getPrecedenceStartState(this.parser.getPrecedence()) : a = s.s0, a === null) {
        r === null && (r = Fn.EMPTY), (this.debug || this.debug_list_atn_decisions) && console.log("predictATN decision " + s.decision + " exec LA(1)==" + this.getLookaheadName(t) + ", outerContext=" + r.toString(this.parser.ruleNames));
        const c = !1;
        let u = this.computeStartState(s.atnStartState, Fn.EMPTY, c);
        s.precedenceDfa ? (s.s0.configs = u, u = this.applyPrecedenceFilter(u), a = this.addDFAState(s, new Oe(null, u)), s.setPrecedenceStartState(this.parser.getPrecedence(), a)) : (a = this.addDFAState(s, new Oe(null, u)), s.s0 = a);
      }
      const l = this.execATN(s, a, t, o, r);
      return this.debug && console.log("DFA after predictATN: " + s.toString(this.parser.literalNames, this.parser.symbolicNames)), l;
    } finally {
      this._dfa = null, this.mergeCache = null, t.seek(o), t.release(i);
    }
  }
  execATN(t, e, r, s, i) {
    (this.debug || this.debug_list_atn_decisions) && console.log("execATN decision " + t.decision + " exec LA(1)==" + this.getLookaheadName(r) + " line " + r.LT(1).line + ":" + r.LT(1).column);
    let o, a = e;
    this.debug && console.log("s0 = " + e);
    let l = r.LA(1);
    for (; ; ) {
      let c = this.getExistingTargetState(a, l);
      if (c === null && (c = this.computeTargetState(t, a, l)), c === Le.ERROR) {
        const u = this.noViableAlt(r, i, a.configs, s);
        if (r.seek(s), o = this.getSynValidOrSemInvalidAltThatFinishedDecisionEntryRule(a.configs, i), o !== pt.INVALID_ALT_NUMBER)
          return o;
        throw u;
      }
      if (c.requiresFullContext && this.predictionMode !== at.SLL) {
        let u = null;
        if (c.predicates !== null) {
          this.debug && console.log("DFA state has preds in DFA sim LL failover");
          const p = r.index;
          if (p !== s && r.seek(s), u = this.evalSemanticContext(c.predicates, i, !0), u.length === 1)
            return this.debug && console.log("Full LL avoided"), u.minValue();
          p !== s && r.seek(p);
        }
        this.dfa_debug && console.log("ctx sensitive state " + i + " in " + c);
        const f = !0, d = this.computeStartState(t.atnStartState, i, f);
        return this.reportAttemptingFullContext(t, u, c.configs, s, r.index), o = this.execATNWithFullContext(t, c, d, r, s, i), o;
      }
      if (c.isAcceptState) {
        if (c.predicates === null)
          return c.prediction;
        const u = r.index;
        r.seek(s);
        const f = this.evalSemanticContext(c.predicates, i, !0);
        if (f.length === 0)
          throw this.noViableAlt(r, i, c.configs, s);
        return f.length === 1 || this.reportAmbiguity(t, c, s, u, !1, f, c.configs), f.minValue();
      }
      a = c, l !== b.EOF && (r.consume(), l = r.LA(1));
    }
  }
  getExistingTargetState(t, e) {
    const r = t.edges;
    return r === null ? null : r[e + 1] || null;
  }
  computeTargetState(t, e, r) {
    const s = this.computeReachSet(e.configs, r, !1);
    if (s === null)
      return this.addDFAEdge(t, e, r, Le.ERROR), Le.ERROR;
    let i = new Oe(null, s);
    const o = this.getUniqueAlt(s);
    if (this.debug) {
      const a = at.getConflictingAltSubsets(s);
      console.log("SLL altSubSets=" + Ue(a) + ", configs=" + s + ", predict=" + o + ", allSubsetsConflict=" + at.allSubsetsConflict(a) + ", conflictingAlts=" + this.getConflictingAlts(s));
    }
    return o !== pt.INVALID_ALT_NUMBER ? (i.isAcceptState = !0, i.configs.uniqueAlt = o, i.prediction = o) : at.hasSLLConflictTerminatingPrediction(this.predictionMode, s) && (i.configs.conflictingAlts = this.getConflictingAlts(s), i.requiresFullContext = !0, i.isAcceptState = !0, i.prediction = i.configs.conflictingAlts.minValue()), i.isAcceptState && i.configs.hasSemanticContext && (this.predicateDFAState(i, this.atn.getDecisionState(t.decision)), i.predicates !== null && (i.prediction = pt.INVALID_ALT_NUMBER)), i = this.addDFAEdge(t, e, r, i), i;
  }
  predicateDFAState(t, e) {
    const r = e.transitions.length, s = this.getConflictingAltsOrUniqueAlt(t.configs), i = this.getPredsForAmbigAlts(s, t.configs, r);
    i !== null ? (t.predicates = this.getPredicatePredictions(s, i), t.prediction = pt.INVALID_ALT_NUMBER) : t.prediction = s.minValue();
  }
  execATNWithFullContext(t, e, r, s, i, o) {
    (this.debug || this.debug_list_atn_decisions) && console.log("execATNWithFullContext " + r);
    const a = !0;
    let l = !1, c, u = r;
    s.seek(i);
    let f = s.LA(1), d = -1;
    for (; ; ) {
      if (c = this.computeReachSet(u, f, a), c === null) {
        const w = this.noViableAlt(s, o, u, i);
        s.seek(i);
        const I = this.getSynValidOrSemInvalidAltThatFinishedDecisionEntryRule(u, o);
        if (I !== pt.INVALID_ALT_NUMBER)
          return I;
        throw w;
      }
      const p = at.getConflictingAltSubsets(c);
      if (this.debug && console.log("LL altSubSets=" + p + ", predict=" + at.getUniqueAlt(p) + ", resolvesToJustOneViableAlt=" + at.resolvesToJustOneViableAlt(p)), c.uniqueAlt = this.getUniqueAlt(c), c.uniqueAlt !== pt.INVALID_ALT_NUMBER) {
        d = c.uniqueAlt;
        break;
      } else if (this.predictionMode !== at.LL_EXACT_AMBIG_DETECTION) {
        if (d = at.resolvesToJustOneViableAlt(p), d !== pt.INVALID_ALT_NUMBER)
          break;
      } else if (at.allSubsetsConflict(p) && at.allSubsetsEqual(p)) {
        l = !0, d = at.getSingleViableAlt(p);
        break;
      }
      u = c, f !== b.EOF && (s.consume(), f = s.LA(1));
    }
    return c.uniqueAlt !== pt.INVALID_ALT_NUMBER ? (this.reportContextSensitivity(t, d, c, i, s.index), d) : (this.reportAmbiguity(t, e, i, s.index, l, null, c), d);
  }
  computeReachSet(t, e, r) {
    this.debug && console.log("in computeReachSet, starting closure: " + t), this.mergeCache === null && (this.mergeCache = new x5());
    const s = new Pt(r);
    let i = null;
    for (let a = 0; a < t.items.length; a++) {
      const l = t.items[a];
      if (this.debug && console.log("testing " + this.getTokenName(e) + " at " + l), l.state instanceof Ft) {
        (r || e === b.EOF) && (i === null && (i = []), i.push(l), this.debug_add && console.log("added " + l + " to skippedStopStates"));
        continue;
      }
      for (let c = 0; c < l.state.transitions.length; c++) {
        const u = l.state.transitions[c], f = this.getReachableTarget(u, e);
        if (f !== null) {
          const d = new Lt({ state: f }, l);
          s.add(d, this.mergeCache), this.debug_add && console.log("added " + d + " to intermediate");
        }
      }
    }
    let o = null;
    if (i === null && e !== b.EOF && (s.items.length === 1 || this.getUniqueAlt(s) !== pt.INVALID_ALT_NUMBER) && (o = s), o === null) {
      o = new Pt(r);
      const a = new Xt(), l = e === b.EOF;
      for (let c = 0; c < s.items.length; c++)
        this.closure(s.items[c], o, a, !1, r, l);
    }
    if (e === b.EOF && (o = this.removeAllConfigsNotInRuleStopState(o, o === s)), i !== null && (!r || !at.hasConfigInRuleStopState(o)))
      for (let a = 0; a < i.length; a++)
        o.add(i[a], this.mergeCache);
    return o.items.length === 0 ? null : o;
  }
  removeAllConfigsNotInRuleStopState(t, e) {
    if (at.allConfigsInRuleStopStates(t))
      return t;
    const r = new Pt(t.fullCtx);
    for (let s = 0; s < t.items.length; s++) {
      const i = t.items[s];
      if (i.state instanceof Ft) {
        r.add(i, this.mergeCache);
        continue;
      }
      if (e && i.state.epsilonOnlyTransitions && this.atn.nextTokens(i.state).contains(b.EPSILON)) {
        const a = this.atn.ruleToStopState[i.state.ruleIndex];
        r.add(new Lt({ state: a }, i), this.mergeCache);
      }
    }
    return r;
  }
  computeStartState(t, e, r) {
    const s = ya(this.atn, e), i = new Pt(r);
    for (let o = 0; o < t.transitions.length; o++) {
      const a = t.transitions[o].target, l = new Lt({ state: a, alt: o + 1, context: s }, null), c = new Xt();
      this.closure(l, i, c, !0, r, !1);
    }
    return i;
  }
  applyPrecedenceFilter(t) {
    let e;
    const r = [], s = new Pt(t.fullCtx);
    for (let i = 0; i < t.items.length; i++) {
      if (e = t.items[i], e.alt !== 1)
        continue;
      const o = e.semanticContext.evalPrecedence(this.parser, this._outerContext);
      o !== null && (r[e.state.stateNumber] = e.context, o !== e.semanticContext ? s.add(new Lt({ semanticContext: o }, e), this.mergeCache) : s.add(e, this.mergeCache));
    }
    for (let i = 0; i < t.items.length; i++)
      if (e = t.items[i], e.alt !== 1) {
        if (!e.precedenceFilterSuppressed) {
          const o = r[e.state.stateNumber] || null;
          if (o !== null && o.equals(e.context))
            continue;
        }
        s.add(e, this.mergeCache);
      }
    return s;
  }
  getReachableTarget(t, e) {
    return t.matches(e, 0, this.atn.maxTokenType) ? t.target : null;
  }
  getPredsForAmbigAlts(t, e, r) {
    let s = [];
    for (let o = 0; o < e.items.length; o++) {
      const a = e.items[o];
      t.has(a.alt) && (s[a.alt] = J.orContext(s[a.alt] || null, a.semanticContext));
    }
    let i = 0;
    for (let o = 1; o < r + 1; o++) {
      const a = s[o] || null;
      a === null ? s[o] = J.NONE : a !== J.NONE && (i += 1);
    }
    return i === 0 && (s = null), this.debug && console.log("getPredsForAmbigAlts result " + Ue(s)), s;
  }
  getPredicatePredictions(t, e) {
    const r = [];
    let s = !1;
    for (let i = 1; i < e.length; i++) {
      const o = e[i];
      t !== null && t.has(i) && r.push(new qu(o, i)), o !== J.NONE && (s = !0);
    }
    return s ? r : null;
  }
  getSynValidOrSemInvalidAltThatFinishedDecisionEntryRule(t, e) {
    const r = this.splitAccordingToSemanticValidity(t, e), s = r[0], i = r[1];
    let o = this.getAltThatFinishedDecisionEntryRule(s);
    return o !== pt.INVALID_ALT_NUMBER || i.items.length > 0 && (o = this.getAltThatFinishedDecisionEntryRule(i), o !== pt.INVALID_ALT_NUMBER) ? o : pt.INVALID_ALT_NUMBER;
  }
  getAltThatFinishedDecisionEntryRule(t) {
    const e = [];
    for (let r = 0; r < t.items.length; r++) {
      const s = t.items[r];
      (s.reachesIntoOuterContext > 0 || s.state instanceof Ft && s.context.hasEmptyPath()) && e.indexOf(s.alt) < 0 && e.push(s.alt);
    }
    return e.length === 0 ? pt.INVALID_ALT_NUMBER : Math.min.apply(null, e);
  }
  splitAccordingToSemanticValidity(t, e) {
    const r = new Pt(t.fullCtx), s = new Pt(t.fullCtx);
    for (let i = 0; i < t.items.length; i++) {
      const o = t.items[i];
      o.semanticContext !== J.NONE ? o.semanticContext.evaluate(this.parser, e) ? r.add(o) : s.add(o) : r.add(o);
    }
    return [r, s];
  }
  evalSemanticContext(t, e, r) {
    const s = new Ce();
    for (let i = 0; i < t.length; i++) {
      const o = t[i];
      if (o.pred === J.NONE) {
        if (s.add(o.alt), !r)
          break;
        continue;
      }
      const a = o.pred.evaluate(this.parser, e);
      if ((this.debug || this.dfa_debug) && console.log("eval pred " + o + "=" + a), a && ((this.debug || this.dfa_debug) && console.log("PREDICT " + o.alt), s.add(o.alt), !r))
        break;
    }
    return s;
  }
  closure(t, e, r, s, i, o) {
    this.closureCheckingStopState(
      t,
      e,
      r,
      s,
      i,
      0,
      o
    );
  }
  closureCheckingStopState(t, e, r, s, i, o, a) {
    if ((this.debug || this.debug_closure) && (console.log("closure(" + t.toString(this.parser, !0) + ")"), t.reachesIntoOuterContext > 50))
      throw "problem";
    if (t.state instanceof Ft)
      if (t.context.isEmpty())
        if (i) {
          e.add(t, this.mergeCache);
          return;
        } else
          this.debug && console.log("FALLING off rule " + this.getRuleName(t.state.ruleIndex));
      else {
        for (let l = 0; l < t.context.length; l++) {
          if (t.context.getReturnState(l) === Z.EMPTY_RETURN_STATE) {
            if (i) {
              e.add(new Lt({ state: t.state, context: Z.EMPTY }, t), this.mergeCache);
              continue;
            } else
              this.debug && console.log("FALLING off rule " + this.getRuleName(t.state.ruleIndex)), this.closure_(
                t,
                e,
                r,
                s,
                i,
                o,
                a
              );
            continue;
          }
          const c = this.atn.states[t.context.getReturnState(l)], u = t.context.getParent(l), f = { state: c, alt: t.alt, context: u, semanticContext: t.semanticContext }, d = new Lt(f, null);
          d.reachesIntoOuterContext = t.reachesIntoOuterContext, this.closureCheckingStopState(d, e, r, s, i, o - 1, a);
        }
        return;
      }
    this.closure_(t, e, r, s, i, o, a);
  }
  closure_(t, e, r, s, i, o, a) {
    const l = t.state;
    l.epsilonOnlyTransitions || e.add(t, this.mergeCache);
    for (let c = 0; c < l.transitions.length; c++) {
      if (c === 0 && this.canDropLoopEntryEdgeInLeftRecursiveRule(t))
        continue;
      const u = l.transitions[c], f = s && !(u instanceof zu), d = this.getEpsilonTarget(t, u, f, o === 0, i, a);
      if (d !== null) {
        let p = o;
        if (t.state instanceof Ft) {
          if (this._dfa !== null && this._dfa.precedenceDfa && u.outermostPrecedenceReturn === this._dfa.atnStartState.ruleIndex && (d.precedenceFilterSuppressed = !0), d.reachesIntoOuterContext += 1, r.add(d) !== d)
            continue;
          e.dipsIntoOuterContext = !0, p -= 1, this.debug && console.log("dips into outer ctx: " + d);
        } else {
          if (!u.isEpsilon && r.add(d) !== d)
            continue;
          u instanceof Bs && p >= 0 && (p += 1);
        }
        this.closureCheckingStopState(d, e, r, f, i, p, a);
      }
    }
  }
  canDropLoopEntryEdgeInLeftRecursiveRule(t) {
    const e = t.state;
    if (e.stateType !== N.STAR_LOOP_ENTRY || e.stateType !== N.STAR_LOOP_ENTRY || !e.isPrecedenceDecision || t.context.isEmpty() || t.context.hasEmptyPath())
      return !1;
    const r = t.context.length;
    for (let a = 0; a < r; a++)
      if (this.atn.states[t.context.getReturnState(a)].ruleIndex !== e.ruleIndex)
        return !1;
    const i = e.transitions[0].target.endState.stateNumber, o = this.atn.states[i];
    for (let a = 0; a < r; a++) {
      const l = t.context.getReturnState(a), c = this.atn.states[l];
      if (c.transitions.length !== 1 || !c.transitions[0].isEpsilon)
        return !1;
      const u = c.transitions[0].target;
      if (!(c.stateType === N.BLOCK_END && u === e) && c !== o && u !== o && !(u.stateType === N.BLOCK_END && u.transitions.length === 1 && u.transitions[0].isEpsilon && u.transitions[0].target === e))
        return !1;
    }
    return !0;
  }
  getRuleName(t) {
    return this.parser !== null && t >= 0 ? this.parser.ruleNames[t] : "<rule " + t + ">";
  }
  getEpsilonTarget(t, e, r, s, i, o) {
    switch (e.serializationType) {
      case R.RULE:
        return this.ruleTransition(t, e);
      case R.PRECEDENCE:
        return this.precedenceTransition(t, e, r, s, i);
      case R.PREDICATE:
        return this.predTransition(t, e, r, s, i);
      case R.ACTION:
        return this.actionTransition(t, e);
      case R.EPSILON:
        return new Lt({ state: e.target }, t);
      case R.ATOM:
      case R.RANGE:
      case R.SET:
        return o && e.matches(b.EOF, 0, 1) ? new Lt({ state: e.target }, t) : null;
      default:
        return null;
    }
  }
  actionTransition(t, e) {
    if (this.debug) {
      const r = e.actionIndex === -1 ? 65535 : e.actionIndex;
      console.log("ACTION edge " + e.ruleIndex + ":" + r);
    }
    return new Lt({ state: e.target }, t);
  }
  precedenceTransition(t, e, r, s, i) {
    this.debug && (console.log("PRED (collectPredicates=" + r + ") " + e.precedence + ">=_p, ctx dependent=true"), this.parser !== null && console.log("context surrounding pred is " + Ue(this.parser.getRuleInvocationStack())));
    let o = null;
    if (r && s)
      if (i) {
        const a = this._input.index;
        this._input.seek(this._startIndex);
        const l = e.getPredicate().evaluate(this.parser, this._outerContext);
        this._input.seek(a), l && (o = new Lt({ state: e.target }, t));
      } else {
        const a = J.andContext(t.semanticContext, e.getPredicate());
        o = new Lt({ state: e.target, semanticContext: a }, t);
      }
    else
      o = new Lt({ state: e.target }, t);
    return this.debug && console.log("config from pred transition=" + o), o;
  }
  predTransition(t, e, r, s, i) {
    this.debug && (console.log("PRED (collectPredicates=" + r + ") " + e.ruleIndex + ":" + e.predIndex + ", ctx dependent=" + e.isCtxDependent), this.parser !== null && console.log("context surrounding pred is " + Ue(this.parser.getRuleInvocationStack())));
    let o = null;
    if (r && (e.isCtxDependent && s || !e.isCtxDependent))
      if (i) {
        const a = this._input.index;
        this._input.seek(this._startIndex);
        const l = e.getPredicate().evaluate(this.parser, this._outerContext);
        this._input.seek(a), l && (o = new Lt({ state: e.target }, t));
      } else {
        const a = J.andContext(t.semanticContext, e.getPredicate());
        o = new Lt({ state: e.target, semanticContext: a }, t);
      }
    else
      o = new Lt({ state: e.target }, t);
    return this.debug && console.log("config from pred transition=" + o), o;
  }
  ruleTransition(t, e) {
    this.debug && console.log("CALL rule " + this.getRuleName(e.target.ruleIndex) + ", ctx=" + t.context);
    const r = e.followState, s = Bt.create(t.context, r.stateNumber);
    return new Lt({ state: e.target, context: s }, t);
  }
  getConflictingAlts(t) {
    const e = at.getConflictingAltSubsets(t);
    return at.getAlts(e);
  }
  getConflictingAltsOrUniqueAlt(t) {
    let e = null;
    return t.uniqueAlt !== pt.INVALID_ALT_NUMBER ? (e = new Ce(), e.add(t.uniqueAlt)) : e = t.conflictingAlts, e;
  }
  getTokenName(t) {
    if (t === b.EOF)
      return "EOF";
    if (this.parser !== null && this.parser.literalNames !== null)
      if (t >= this.parser.literalNames.length && t >= this.parser.symbolicNames.length)
        console.log("" + t + " ttype out of range: " + this.parser.literalNames), console.log("" + this.parser.getInputStream().getTokens());
      else
        return (this.parser.literalNames[t] || this.parser.symbolicNames[t]) + "<" + t + ">";
    return "" + t;
  }
  getLookaheadName(t) {
    return this.getTokenName(t.LA(1));
  }
  dumpDeadEndConfigs(t) {
    console.log("dead end configs: ");
    const e = t.getDeadEndConfigs();
    for (let r = 0; r < e.length; r++) {
      const s = e[r];
      let i = "no edges";
      if (s.state.transitions.length > 0) {
        const o = s.state.transitions[0];
        o instanceof Es ? i = "Atom " + this.getTokenName(o.label) : o instanceof _a && (i = (o instanceof La ? "~" : "") + "Set " + o.set);
      }
      console.error(s.toString(this.parser, !0) + ":" + i);
    }
  }
  noViableAlt(t, e, r, s) {
    return new Ra(this.parser, t, t.get(s), t.LT(1), r, e);
  }
  getUniqueAlt(t) {
    let e = pt.INVALID_ALT_NUMBER;
    for (let r = 0; r < t.items.length; r++) {
      const s = t.items[r];
      if (e === pt.INVALID_ALT_NUMBER)
        e = s.alt;
      else if (s.alt !== e)
        return pt.INVALID_ALT_NUMBER;
    }
    return e;
  }
  addDFAEdge(t, e, r, s) {
    if (this.debug && console.log("EDGE " + e + " -> " + s + " upon " + this.getTokenName(r)), s === null)
      return null;
    if (s = this.addDFAState(t, s), e === null || r < -1 || r > this.atn.maxTokenType)
      return s;
    if (e.edges === null && (e.edges = []), e.edges[r + 1] = s, this.debug) {
      const i = this.parser === null ? null : this.parser.literalNames, o = this.parser === null ? null : this.parser.symbolicNames;
      console.log(`DFA=
` + t.toString(i, o));
    }
    return s;
  }
  addDFAState(t, e) {
    if (e === Le.ERROR)
      return e;
    const r = t.states.get(e);
    return r !== null ? r : (e.stateNumber = t.states.length, e.configs.readOnly || (e.configs.optimizeConfigs(this), e.configs.setReadonly(!0)), t.states.add(e), this.debug && console.log("adding new DFA state: " + e), e);
  }
  reportAttemptingFullContext(t, e, r, s, i) {
    if (this.debug || this.retry_debug) {
      const o = new Q(s, i + 1);
      console.log("reportAttemptingFullContext decision=" + t.decision + ":" + r + ", input=" + this.parser.getTokenStream().getText(o));
    }
    this.parser !== null && this.parser.getErrorListenerDispatch().reportAttemptingFullContext(this.parser, t, s, i, e, r);
  }
  reportContextSensitivity(t, e, r, s, i) {
    if (this.debug || this.retry_debug) {
      const o = new Q(s, i + 1);
      console.log("reportContextSensitivity decision=" + t.decision + ":" + r + ", input=" + this.parser.getTokenStream().getText(o));
    }
    this.parser !== null && this.parser.getErrorListenerDispatch().reportContextSensitivity(this.parser, t, s, i, e, r);
  }
  reportAmbiguity(t, e, r, s, i, o, a) {
    if (this.debug || this.retry_debug) {
      const l = new Q(r, s + 1);
      console.log("reportAmbiguity " + o + ":" + a + ", input=" + this.parser.getTokenStream().getText(l));
    }
    this.parser !== null && this.parser.getErrorListenerDispatch().reportAmbiguity(this.parser, t, r, s, i, o, a);
  }
}
const _5 = { ATN: pt, ATNDeserializer: Wu, LexerATNSimulator: mt, ParserATNSimulator: m5, PredictionMode: at };
class ka {
  constructor(t, e, r) {
    this.dfa = t, this.literalNames = e || [], this.symbolicNames = r || [];
  }
  toString() {
    if (this.dfa.s0 === null)
      return null;
    let t = "";
    const e = this.dfa.sortedStates();
    for (let r = 0; r < e.length; r++) {
      const s = e[r];
      if (s.edges !== null) {
        const i = s.edges.length;
        for (let o = 0; o < i; o++) {
          const a = s.edges[o] || null;
          a !== null && a.stateNumber !== 2147483647 && (t = t.concat(this.getStateString(s)), t = t.concat("-"), t = t.concat(this.getEdgeLabel(o)), t = t.concat("->"), t = t.concat(this.getStateString(a)), t = t.concat(`
`));
        }
      }
    }
    return t.length === 0 ? null : t;
  }
  getEdgeLabel(t) {
    return t === 0 ? "EOF" : this.literalNames !== null || this.symbolicNames !== null ? this.literalNames[t - 1] || this.symbolicNames[t - 1] : String.fromCharCode(t - 1);
  }
  getStateString(t) {
    const e = (t.isAcceptState ? ":" : "") + "s" + t.stateNumber + (t.requiresFullContext ? "^" : "");
    return t.isAcceptState ? t.predicates !== null ? e + "=>" + Ue(t.predicates) : e + "=>" + t.prediction.toString() : e;
  }
}
class Ku extends ka {
  constructor(t) {
    super(t, null);
  }
  getEdgeLabel(t) {
    return "'" + String.fromCharCode(t) + "'";
  }
}
class L5 {
  constructor(t, e) {
    if (e === void 0 && (e = 0), this.atnStartState = t, this.decision = e, this._states = new Xt(), this.s0 = null, this.precedenceDfa = !1, t instanceof Qe && t.isPrecedenceDecision) {
      this.precedenceDfa = !0;
      const r = new Oe(null, new Pt());
      r.edges = [], r.isAcceptState = !1, r.requiresFullContext = !1, this.s0 = r;
    }
  }
  getPrecedenceStartState(t) {
    if (!this.precedenceDfa)
      throw "Only precedence DFAs may contain a precedence start state.";
    return t < 0 || t >= this.s0.edges.length ? null : this.s0.edges[t] || null;
  }
  setPrecedenceStartState(t, e) {
    if (!this.precedenceDfa)
      throw "Only precedence DFAs may contain a precedence start state.";
    t < 0 || (this.s0.edges[t] = e);
  }
  setPrecedenceDfa(t) {
    if (this.precedenceDfa !== t) {
      if (this._states = new Xt(), t) {
        const e = new Oe(null, new Pt());
        e.edges = [], e.isAcceptState = !1, e.requiresFullContext = !1, this.s0 = e;
      } else
        this.s0 = null;
      this.precedenceDfa = t;
    }
  }
  sortedStates() {
    return this._states.values().sort(function(e, r) {
      return e.stateNumber - r.stateNumber;
    });
  }
  toString(t, e) {
    return t = t || null, e = e || null, this.s0 === null ? "" : new ka(this, t, e).toString();
  }
  toLexerString() {
    return this.s0 === null ? "" : new Ku(this).toString();
  }
  get states() {
    return this._states;
  }
}
const v5 = { DFA: L5, DFASerializer: ka, LexerDFASerializer: Ku, PredPrediction: qu };
class Yu {
  visitTerminal(t) {
  }
  visitErrorNode(t) {
  }
  enterEveryRule(t) {
  }
  exitEveryRule(t) {
  }
}
class y5 {
  visit(t) {
    return Array.isArray(t) ? t.map(function(e) {
      return e.accept(this);
    }, this) : t.accept(this);
  }
  visitChildren(t) {
    return t.children ? this.visit(t.children) : null;
  }
  visitTerminal(t) {
  }
  visitErrorNode(t) {
  }
}
class No {
  walk(t, e) {
    if (e instanceof ii || e.isErrorNode !== void 0 && e.isErrorNode())
      t.visitErrorNode(e);
    else if (e instanceof Me)
      t.visitTerminal(e);
    else {
      this.enterRule(t, e);
      for (let s = 0; s < e.getChildCount(); s++) {
        const i = e.getChild(s);
        this.walk(t, i);
      }
      this.exitRule(t, e);
    }
  }
  enterRule(t, e) {
    const r = e.getRuleContext();
    t.enterEveryRule(r), r.enterRule(t);
  }
  exitRule(t, e) {
    const r = e.getRuleContext();
    r.exitRule(t), t.exitEveryRule(r);
  }
}
No.DEFAULT = new No();
const C5 = { Trees: xe, RuleNode: Us, ErrorNode: ii, TerminalNode: Me, ParseTreeListener: Yu, ParseTreeVisitor: y5, ParseTreeWalker: No };
class pr extends Ye {
  constructor(t) {
    super({ message: "", recognizer: t, input: t.getInputStream(), ctx: t._ctx }), this.offendingToken = t.getCurrentToken();
  }
}
class Xu extends Ye {
  constructor(t, e, r) {
    super({
      message: E5(e, r || null),
      recognizer: t,
      input: t.getInputStream(),
      ctx: t._ctx
    });
    const i = t._interp.atn.states[t.state].transitions[0];
    i instanceof Zu ? (this.ruleIndex = i.ruleIndex, this.predicateIndex = i.predIndex) : (this.ruleIndex = 0, this.predicateIndex = 0), this.predicate = e, this.offendingToken = t.getCurrentToken();
  }
}
function E5(n, t) {
  return t !== null ? t : "failed predicate: {" + n + "}?";
}
class b5 extends li {
  constructor(t) {
    super(), t = t || !0, this.exactOnly = t;
  }
  reportAmbiguity(t, e, r, s, i, o, a) {
    if (this.exactOnly && !i)
      return;
    const l = "reportAmbiguity d=" + this.getDecisionDescription(t, e) + ": ambigAlts=" + this.getConflictingAlts(o, a) + ", input='" + t.getTokenStream().getText(new Q(r, s)) + "'";
    t.notifyErrorListeners(l);
  }
  reportAttemptingFullContext(t, e, r, s, i, o) {
    const a = "reportAttemptingFullContext d=" + this.getDecisionDescription(t, e) + ", input='" + t.getTokenStream().getText(new Q(r, s)) + "'";
    t.notifyErrorListeners(a);
  }
  reportContextSensitivity(t, e, r, s, i, o) {
    const a = "reportContextSensitivity d=" + this.getDecisionDescription(t, e) + ", input='" + t.getTokenStream().getText(new Q(r, s)) + "'";
    t.notifyErrorListeners(a);
  }
  getDecisionDescription(t, e) {
    const r = e.decision, s = e.atnStartState.ruleIndex, i = t.ruleNames;
    if (s < 0 || s >= i.length)
      return "" + r;
    const o = i[s] || null;
    return o === null || o.length === 0 ? "" + r : `${r} (${o})`;
  }
  getConflictingAlts(t, e) {
    if (t !== null)
      return t;
    const r = new Ce();
    for (let s = 0; s < e.items.length; s++)
      r.add(e.items[s].alt);
    return `{${r.values().join(", ")}}`;
  }
}
class Oa extends Error {
  constructor() {
    super(), Error.captureStackTrace(this, Oa);
  }
}
class w5 {
  reset(t) {
  }
  recoverInline(t) {
  }
  recover(t, e) {
  }
  sync(t) {
  }
  inErrorRecoveryMode(t) {
  }
  reportError(t) {
  }
}
class Na extends w5 {
  constructor() {
    super(), this.errorRecoveryMode = !1, this.lastErrorIndex = -1, this.lastErrorStates = null, this.nextTokensContext = null, this.nextTokenState = 0;
  }
  reset(t) {
    this.endErrorCondition(t);
  }
  beginErrorCondition(t) {
    this.errorRecoveryMode = !0;
  }
  inErrorRecoveryMode(t) {
    return this.errorRecoveryMode;
  }
  endErrorCondition(t) {
    this.errorRecoveryMode = !1, this.lastErrorStates = null, this.lastErrorIndex = -1;
  }
  reportMatch(t) {
    this.endErrorCondition(t);
  }
  reportError(t, e) {
    this.inErrorRecoveryMode(t) || (this.beginErrorCondition(t), e instanceof Ra ? this.reportNoViableAlternative(t, e) : e instanceof pr ? this.reportInputMismatch(t, e) : e instanceof Xu ? this.reportFailedPredicate(t, e) : (console.log("unknown recognition error type: " + e.constructor.name), console.log(e.stack), t.notifyErrorListeners(e.getOffendingToken(), e.getMessage(), e)));
  }
  recover(t, e) {
    this.lastErrorIndex === t.getInputStream().index && this.lastErrorStates !== null && this.lastErrorStates.indexOf(t.state) >= 0 && t.consume(), this.lastErrorIndex = t._input.index, this.lastErrorStates === null && (this.lastErrorStates = []), this.lastErrorStates.push(t.state);
    const r = this.getErrorRecoverySet(t);
    this.consumeUntil(t, r);
  }
  sync(t) {
    if (this.inErrorRecoveryMode(t))
      return;
    const e = t._interp.atn.states[t.state], r = t.getTokenStream().LA(1), s = t.atn.nextTokens(e);
    if (s.contains(r)) {
      this.nextTokensContext = null, this.nextTokenState = N.INVALID_STATE_NUMBER;
      return;
    } else if (s.contains(b.EPSILON)) {
      this.nextTokensContext === null && (this.nextTokensContext = t._ctx, this.nextTokensState = t._stateNumber);
      return;
    }
    switch (e.stateType) {
      case N.BLOCK_START:
      case N.STAR_BLOCK_START:
      case N.PLUS_BLOCK_START:
      case N.STAR_LOOP_ENTRY:
        if (this.singleTokenDeletion(t) !== null)
          return;
        throw new pr(t);
      case N.PLUS_LOOP_BACK:
      case N.STAR_LOOP_BACK:
        {
          this.reportUnwantedToken(t);
          const i = new oe();
          i.addSet(t.getExpectedTokens());
          const o = i.addSet(this.getErrorRecoverySet(t));
          this.consumeUntil(t, o);
        }
        break;
    }
  }
  reportNoViableAlternative(t, e) {
    const r = t.getTokenStream();
    let s;
    r !== null ? e.startToken.type === b.EOF ? s = "<EOF>" : s = r.getText(new Q(e.startToken.tokenIndex, e.offendingToken.tokenIndex)) : s = "<unknown input>";
    const i = "no viable alternative at input " + this.escapeWSAndQuote(s);
    t.notifyErrorListeners(i, e.offendingToken, e);
  }
  reportInputMismatch(t, e) {
    const r = "mismatched input " + this.getTokenErrorDisplay(e.offendingToken) + " expecting " + e.getExpectedTokens().toString(t.literalNames, t.symbolicNames);
    t.notifyErrorListeners(r, e.offendingToken, e);
  }
  reportFailedPredicate(t, e) {
    const s = "rule " + t.ruleNames[t._ctx.ruleIndex] + " " + e.message;
    t.notifyErrorListeners(s, e.offendingToken, e);
  }
  reportUnwantedToken(t) {
    if (this.inErrorRecoveryMode(t))
      return;
    this.beginErrorCondition(t);
    const e = t.getCurrentToken(), r = this.getTokenErrorDisplay(e), s = this.getExpectedTokens(t), i = "extraneous input " + r + " expecting " + s.toString(t.literalNames, t.symbolicNames);
    t.notifyErrorListeners(i, e, null);
  }
  reportMissingToken(t) {
    if (this.inErrorRecoveryMode(t))
      return;
    this.beginErrorCondition(t);
    const e = t.getCurrentToken(), s = "missing " + this.getExpectedTokens(t).toString(t.literalNames, t.symbolicNames) + " at " + this.getTokenErrorDisplay(e);
    t.notifyErrorListeners(s, e, null);
  }
  recoverInline(t) {
    const e = this.singleTokenDeletion(t);
    if (e !== null)
      return t.consume(), e;
    if (this.singleTokenInsertion(t))
      return this.getMissingSymbol(t);
    throw new pr(t);
  }
  singleTokenInsertion(t) {
    const e = t.getTokenStream().LA(1), r = t._interp.atn, i = r.states[t.state].transitions[0].target;
    return r.nextTokens(i, t._ctx).contains(e) ? (this.reportMissingToken(t), !0) : !1;
  }
  singleTokenDeletion(t) {
    const e = t.getTokenStream().LA(2);
    if (this.getExpectedTokens(t).contains(e)) {
      this.reportUnwantedToken(t), t.consume();
      const s = t.getCurrentToken();
      return this.reportMatch(t), s;
    } else
      return null;
  }
  getMissingSymbol(t) {
    const e = t.getCurrentToken(), s = this.getExpectedTokens(t).first();
    let i;
    s === b.EOF ? i = "<missing EOF>" : i = "<missing " + t.literalNames[s] + ">";
    let o = e;
    const a = t.getTokenStream().LT(-1);
    return o.type === b.EOF && a !== null && (o = a), t.getTokenFactory().create(
      o.source,
      s,
      i,
      b.DEFAULT_CHANNEL,
      -1,
      -1,
      o.line,
      o.column
    );
  }
  getExpectedTokens(t) {
    return t.getExpectedTokens();
  }
  getTokenErrorDisplay(t) {
    if (t === null)
      return "<no token>";
    let e = t.text;
    return e === null && (t.type === b.EOF ? e = "<EOF>" : e = "<" + t.type + ">"), this.escapeWSAndQuote(e);
  }
  escapeWSAndQuote(t) {
    return t = t.replace(/\n/g, "\\n"), t = t.replace(/\r/g, "\\r"), t = t.replace(/\t/g, "\\t"), "'" + t + "'";
  }
  getErrorRecoverySet(t) {
    const e = t._interp.atn;
    let r = t._ctx;
    const s = new oe();
    for (; r !== null && r.invokingState >= 0; ) {
      const o = e.states[r.invokingState].transitions[0], a = e.nextTokens(o.followState);
      s.addSet(a), r = r.parentCtx;
    }
    return s.removeOne(b.EPSILON), s;
  }
  consumeUntil(t, e) {
    let r = t.getTokenStream().LA(1);
    for (; r !== b.EOF && !e.contains(r); )
      t.consume(), r = t.getTokenStream().LA(1);
  }
}
class T5 extends Na {
  constructor() {
    super();
  }
  recover(t, e) {
    let r = t._ctx;
    for (; r !== null; )
      r.exception = e, r = r.parentCtx;
    throw new Oa(e);
  }
  recoverInline(t) {
    this.recover(t, new pr(t));
  }
  sync(t) {
  }
}
const A5 = {
  RecognitionException: Ye,
  NoViableAltException: Ra,
  LexerNoViableAltException: Sa,
  InputMismatchException: pr,
  FailedPredicateException: Xu,
  DiagnosticErrorListener: b5,
  BailErrorStrategy: T5,
  DefaultErrorStrategy: Na,
  ErrorListener: li
};
class Je {
  constructor(t, e) {
    if (this.name = "<empty>", this.strdata = t, this.decodeToUnicodeCodePoints = e || !1, this._index = 0, this.data = [], this.decodeToUnicodeCodePoints)
      for (let r = 0; r < this.strdata.length; ) {
        const s = this.strdata.codePointAt(r);
        this.data.push(s), r += s <= 65535 ? 1 : 2;
      }
    else {
      this.data = new Array(this.strdata.length);
      for (let r = 0; r < this.strdata.length; r++) {
        const s = this.strdata.charCodeAt(r);
        this.data[r] = s;
      }
    }
    this._size = this.data.length;
  }
  reset() {
    this._index = 0;
  }
  consume() {
    if (this._index >= this._size)
      throw "cannot consume EOF";
    this._index += 1;
  }
  LA(t) {
    if (t === 0)
      return 0;
    t < 0 && (t += 1);
    const e = this._index + t - 1;
    return e < 0 || e >= this._size ? b.EOF : this.data[e];
  }
  LT(t) {
    return this.LA(t);
  }
  mark() {
    return -1;
  }
  release(t) {
  }
  seek(t) {
    if (t <= this._index) {
      this._index = t;
      return;
    }
    this._index = Math.min(t, this._size);
  }
  getText(t, e) {
    if (e >= this._size && (e = this._size - 1), t >= this._size)
      return "";
    if (this.decodeToUnicodeCodePoints) {
      let r = "";
      for (let s = t; s <= e; s++)
        r += String.fromCodePoint(this.data[s]);
      return r;
    } else
      return this.strdata.slice(t, e + 1);
  }
  toString() {
    return this.strdata;
  }
  get index() {
    return this._index;
  }
  get size() {
    return this._size;
  }
}
const Io = {}, S5 = {
  fromString: function(n) {
    return new Je(n, !0);
  },
  fromBlob: function(n, t, e, r) {
    const s = new window.FileReader();
    s.onload = function(i) {
      const o = new Je(i.target.result, !0);
      e(o);
    }, s.onerror = r, s.readAsText(n, t);
  },
  fromBuffer: function(n, t) {
    return new Je(n.toString(t), !0);
  },
  fromPath: function(n, t, e) {
    Io.readFile(n, t, function(r, s) {
      let i = null;
      s !== null && (i = new Je(s, !0)), e(r, i);
    });
  },
  fromPathSync: function(n, t) {
    const e = Io.readFileSync(n, t);
    return new Je(e, !0);
  }
};
class R5 extends Je {
  constructor(t, e) {
    const r = Io.readFileSync(t, "utf8");
    super(r, e), this.fileName = t;
  }
}
class k5 {
}
class O5 extends k5 {
  constructor(t) {
    super(), this.tokenSource = t, this.tokens = [], this.index = -1, this.fetchedEOF = !1;
  }
  mark() {
    return 0;
  }
  release(t) {
  }
  reset() {
    this.seek(0);
  }
  seek(t) {
    this.lazyInit(), this.index = this.adjustSeekIndex(t);
  }
  get(t) {
    return this.lazyInit(), this.tokens[t];
  }
  consume() {
    let t = !1;
    if (this.index >= 0 ? this.fetchedEOF ? t = this.index < this.tokens.length - 1 : t = this.index < this.tokens.length : t = !1, !t && this.LA(1) === b.EOF)
      throw "cannot consume EOF";
    this.sync(this.index + 1) && (this.index = this.adjustSeekIndex(this.index + 1));
  }
  sync(t) {
    const e = t - this.tokens.length + 1;
    return e > 0 ? this.fetch(e) >= e : !0;
  }
  fetch(t) {
    if (this.fetchedEOF)
      return 0;
    for (let e = 0; e < t; e++) {
      const r = this.tokenSource.nextToken();
      if (r.tokenIndex = this.tokens.length, this.tokens.push(r), r.type === b.EOF)
        return this.fetchedEOF = !0, e + 1;
    }
    return t;
  }
  getTokens(t, e, r) {
    if (r === void 0 && (r = null), t < 0 || e < 0)
      return null;
    this.lazyInit();
    const s = [];
    e >= this.tokens.length && (e = this.tokens.length - 1);
    for (let i = t; i < e; i++) {
      const o = this.tokens[i];
      if (o.type === b.EOF)
        break;
      (r === null || r.contains(o.type)) && s.push(o);
    }
    return s;
  }
  LA(t) {
    return this.LT(t).type;
  }
  LB(t) {
    return this.index - t < 0 ? null : this.tokens[this.index - t];
  }
  LT(t) {
    if (this.lazyInit(), t === 0)
      return null;
    if (t < 0)
      return this.LB(-t);
    const e = this.index + t - 1;
    return this.sync(e), e >= this.tokens.length ? this.tokens[this.tokens.length - 1] : this.tokens[e];
  }
  adjustSeekIndex(t) {
    return t;
  }
  lazyInit() {
    this.index === -1 && this.setup();
  }
  setup() {
    this.sync(0), this.index = this.adjustSeekIndex(0);
  }
  setTokenSource(t) {
    this.tokenSource = t, this.tokens = [], this.index = -1, this.fetchedEOF = !1;
  }
  nextTokenOnChannel(t, e) {
    if (this.sync(t), t >= this.tokens.length)
      return -1;
    let r = this.tokens[t];
    for (; r.channel !== this.channel; ) {
      if (r.type === b.EOF)
        return -1;
      t += 1, this.sync(t), r = this.tokens[t];
    }
    return t;
  }
  previousTokenOnChannel(t, e) {
    for (; t >= 0 && this.tokens[t].channel !== e; )
      t -= 1;
    return t;
  }
  getHiddenTokensToRight(t, e) {
    if (e === void 0 && (e = -1), this.lazyInit(), t < 0 || t >= this.tokens.length)
      throw "" + t + " not in 0.." + this.tokens.length - 1;
    const r = this.nextTokenOnChannel(t + 1, vt.DEFAULT_TOKEN_CHANNEL), s = t + 1, i = r === -1 ? this.tokens.length - 1 : r;
    return this.filterForChannel(s, i, e);
  }
  getHiddenTokensToLeft(t, e) {
    if (e === void 0 && (e = -1), this.lazyInit(), t < 0 || t >= this.tokens.length)
      throw "" + t + " not in 0.." + this.tokens.length - 1;
    const r = this.previousTokenOnChannel(t - 1, vt.DEFAULT_TOKEN_CHANNEL);
    if (r === t - 1)
      return null;
    const s = r + 1, i = t - 1;
    return this.filterForChannel(s, i, e);
  }
  filterForChannel(t, e, r) {
    const s = [];
    for (let i = t; i < e + 1; i++) {
      const o = this.tokens[i];
      r === -1 ? o.channel !== vt.DEFAULT_TOKEN_CHANNEL && s.push(o) : o.channel === r && s.push(o);
    }
    return s.length === 0 ? null : s;
  }
  getSourceName() {
    return this.tokenSource.getSourceName();
  }
  getText(t) {
    this.lazyInit(), this.fill(), t == null && (t = new Q(0, this.tokens.length - 1));
    let e = t.start;
    e instanceof b && (e = e.tokenIndex);
    let r = t.stop;
    if (r instanceof b && (r = r.tokenIndex), e === null || r === null || e < 0 || r < 0)
      return "";
    r >= this.tokens.length && (r = this.tokens.length - 1);
    let s = "";
    for (let i = e; i < r + 1; i++) {
      const o = this.tokens[i];
      if (o.type === b.EOF)
        break;
      s = s + o.text;
    }
    return s;
  }
  fill() {
    for (this.lazyInit(); this.fetch(1e3) === 1e3; )
      ;
  }
}
class N5 extends O5 {
  constructor(t, e) {
    super(t), this.channel = e === void 0 ? b.DEFAULT_CHANNEL : e;
  }
  adjustSeekIndex(t) {
    return this.nextTokenOnChannel(t, this.channel);
  }
  LB(t) {
    if (t === 0 || this.index - t < 0)
      return null;
    let e = this.index, r = 1;
    for (; r <= t; )
      e = this.previousTokenOnChannel(e - 1, this.channel), r += 1;
    return e < 0 ? null : this.tokens[e];
  }
  LT(t) {
    if (this.lazyInit(), t === 0)
      return null;
    if (t < 0)
      return this.LB(-t);
    let e = this.index, r = 1;
    for (; r < t; )
      this.sync(e + 1) && (e = this.nextTokenOnChannel(e + 1, this.channel)), r += 1;
    return this.tokens[e];
  }
  getNumberOfOnChannelTokens() {
    let t = 0;
    this.fill();
    for (let e = 0; e < this.tokens.length; e++) {
      const r = this.tokens[e];
      if (r.channel === this.channel && (t += 1), r.type === b.EOF)
        break;
    }
    return t;
  }
}
class I5 extends Yu {
  constructor(t) {
    super(), this.parser = t;
  }
  enterEveryRule(t) {
    console.log("enter   " + this.parser.ruleNames[t.ruleIndex] + ", LT(1)=" + this.parser._input.LT(1).text);
  }
  visitTerminal(t) {
    console.log("consume " + t.symbol + " rule " + this.parser.ruleNames[this.parser._ctx.ruleIndex]);
  }
  exitEveryRule(t) {
    console.log("exit    " + this.parser.ruleNames[t.ruleIndex] + ", LT(1)=" + this.parser._input.LT(1).text);
  }
}
let Qu = class extends ci {
  constructor(t) {
    super(), this._input = null, this._errHandler = new Na(), this._precedenceStack = [], this._precedenceStack.push(0), this._ctx = null, this.buildParseTrees = !0, this._tracer = null, this._parseListeners = null, this._syntaxErrors = 0, this.setInputStream(t);
  }
  reset() {
    this._input !== null && this._input.seek(0), this._errHandler.reset(this), this._ctx = null, this._syntaxErrors = 0, this.setTrace(!1), this._precedenceStack = [], this._precedenceStack.push(0), this._interp !== null && this._interp.reset();
  }
  match(t) {
    let e = this.getCurrentToken();
    return e.type === t ? (this._errHandler.reportMatch(this), this.consume()) : (e = this._errHandler.recoverInline(this), this.buildParseTrees && e.tokenIndex === -1 && this._ctx.addErrorNode(e)), e;
  }
  matchWildcard() {
    let t = this.getCurrentToken();
    return t.type > 0 ? (this._errHandler.reportMatch(this), this.consume()) : (t = this._errHandler.recoverInline(this), this._buildParseTrees && t.tokenIndex === -1 && this._ctx.addErrorNode(t)), t;
  }
  getParseListeners() {
    return this._parseListeners || [];
  }
  addParseListener(t) {
    if (t === null)
      throw "listener";
    this._parseListeners === null && (this._parseListeners = []), this._parseListeners.push(t);
  }
  removeParseListener(t) {
    if (this._parseListeners !== null) {
      const e = this._parseListeners.indexOf(t);
      e >= 0 && this._parseListeners.splice(e, 1), this._parseListeners.length === 0 && (this._parseListeners = null);
    }
  }
  removeParseListeners() {
    this._parseListeners = null;
  }
  triggerEnterRuleEvent() {
    if (this._parseListeners !== null) {
      const t = this._ctx;
      this._parseListeners.forEach(function(e) {
        e.enterEveryRule(t), t.enterRule(e);
      });
    }
  }
  triggerExitRuleEvent() {
    if (this._parseListeners !== null) {
      const t = this._ctx;
      this._parseListeners.slice(0).reverse().forEach(function(e) {
        t.exitRule(e), e.exitEveryRule(t);
      });
    }
  }
  getTokenFactory() {
    return this._input.tokenSource._factory;
  }
  setTokenFactory(t) {
    this._input.tokenSource._factory = t;
  }
  getATNWithBypassAlts() {
    const t = this.getSerializedATN();
    if (t === null)
      throw "The current parser does not support an ATN with bypass alternatives.";
    let e = this.bypassAltsAtnCache[t];
    if (e === null) {
      const r = new Ar();
      r.generateRuleBypassTransitions = !0, e = new Wu(r).deserialize(t), this.bypassAltsAtnCache[t] = e;
    }
    return e;
  }
  getInputStream() {
    return this.getTokenStream();
  }
  setInputStream(t) {
    this.setTokenStream(t);
  }
  getTokenStream() {
    return this._input;
  }
  setTokenStream(t) {
    this._input = null, this.reset(), this._input = t;
  }
  getCurrentToken() {
    return this._input.LT(1);
  }
  notifyErrorListeners(t, e, r) {
    e = e || null, r = r || null, e === null && (e = this.getCurrentToken()), this._syntaxErrors += 1;
    const s = e.line, i = e.column;
    this.getErrorListenerDispatch().syntaxError(this, e, s, i, t, r);
  }
  consume() {
    const t = this.getCurrentToken();
    t.type !== b.EOF && this.getInputStream().consume();
    const e = this._parseListeners !== null && this._parseListeners.length > 0;
    if (this.buildParseTrees || e) {
      let r;
      this._errHandler.inErrorRecoveryMode(this) ? r = this._ctx.addErrorNode(t) : r = this._ctx.addTokenNode(t), r.invokingState = this.state, e && this._parseListeners.forEach(function(s) {
        r instanceof ii || r.isErrorNode !== void 0 && r.isErrorNode() ? s.visitErrorNode(r) : r instanceof Me && s.visitTerminal(r);
      });
    }
    return t;
  }
  addContextToParseTree() {
    this._ctx.parentCtx !== null && this._ctx.parentCtx.addChild(this._ctx);
  }
  enterRule(t, e, r) {
    this.state = e, this._ctx = t, this._ctx.start = this._input.LT(1), this.buildParseTrees && this.addContextToParseTree(), this.triggerEnterRuleEvent();
  }
  exitRule() {
    this._ctx.stop = this._input.LT(-1), this.triggerExitRuleEvent(), this.state = this._ctx.invokingState, this._ctx = this._ctx.parentCtx;
  }
  enterOuterAlt(t, e) {
    t.setAltNumber(e), this.buildParseTrees && this._ctx !== t && this._ctx.parentCtx !== null && (this._ctx.parentCtx.removeLastChild(), this._ctx.parentCtx.addChild(t)), this._ctx = t;
  }
  getPrecedence() {
    return this._precedenceStack.length === 0 ? -1 : this._precedenceStack[this._precedenceStack.length - 1];
  }
  enterRecursionRule(t, e, r, s) {
    this.state = e, this._precedenceStack.push(s), this._ctx = t, this._ctx.start = this._input.LT(1), this.triggerEnterRuleEvent();
  }
  pushNewRecursionContext(t, e, r) {
    const s = this._ctx;
    s.parentCtx = t, s.invokingState = e, s.stop = this._input.LT(-1), this._ctx = t, this._ctx.start = s.start, this.buildParseTrees && this._ctx.addChild(s), this.triggerEnterRuleEvent();
  }
  unrollRecursionContexts(t) {
    this._precedenceStack.pop(), this._ctx.stop = this._input.LT(-1);
    const e = this._ctx, r = this.getParseListeners();
    if (r !== null && r.length > 0)
      for (; this._ctx !== t; )
        this.triggerExitRuleEvent(), this._ctx = this._ctx.parentCtx;
    else
      this._ctx = t;
    e.parentCtx = t, this.buildParseTrees && t !== null && t.addChild(e);
  }
  getInvokingContext(t) {
    let e = this._ctx;
    for (; e !== null; ) {
      if (e.ruleIndex === t)
        return e;
      e = e.parentCtx;
    }
    return null;
  }
  precpred(t, e) {
    return e >= this._precedenceStack[this._precedenceStack.length - 1];
  }
  inContext(t) {
    return !1;
  }
  isExpectedToken(t) {
    const e = this._interp.atn;
    let r = this._ctx;
    const s = e.states[this.state];
    let i = e.nextTokens(s);
    if (i.contains(t))
      return !0;
    if (!i.contains(b.EPSILON))
      return !1;
    for (; r !== null && r.invokingState >= 0 && i.contains(b.EPSILON); ) {
      const a = e.states[r.invokingState].transitions[0];
      if (i = e.nextTokens(a.followState), i.contains(t))
        return !0;
      r = r.parentCtx;
    }
    return !!(i.contains(b.EPSILON) && t === b.EOF);
  }
  getExpectedTokens() {
    return this._interp.atn.getExpectedTokens(this.state, this._ctx);
  }
  getExpectedTokensWithinCurrentRule() {
    const t = this._interp.atn, e = t.states[this.state];
    return t.nextTokens(e);
  }
  getRuleIndex(t) {
    const e = this.getRuleIndexMap()[t];
    return e !== null ? e : -1;
  }
  getRuleInvocationStack(t) {
    t = t || null, t === null && (t = this._ctx);
    const e = [];
    for (; t !== null; ) {
      const r = t.ruleIndex;
      r < 0 ? e.push("n/a") : e.push(this.ruleNames[r]), t = t.parentCtx;
    }
    return e;
  }
  getDFAStrings() {
    return this._interp.decisionToDFA.toString();
  }
  dumpDFA() {
    let t = !1;
    for (let e = 0; e < this._interp.decisionToDFA.length; e++) {
      const r = this._interp.decisionToDFA[e];
      r.states.length > 0 && (t && console.log(), this.printer.println("Decision " + r.decision + ":"), this.printer.print(r.toString(this.literalNames, this.symbolicNames)), t = !0);
    }
  }
  getSourceName() {
    return this._input.sourceName;
  }
  setTrace(t) {
    t ? (this._tracer !== null && this.removeParseListener(this._tracer), this._tracer = new I5(this), this.addParseListener(this._tracer)) : (this.removeParseListener(this._tracer), this._tracer = null);
  }
};
Qu.bypassAltsAtnCache = {};
class M5 {
  constructor() {
    this.cache = new Dr();
  }
  add(t) {
    if (t === Z.EMPTY)
      return Z.EMPTY;
    const e = this.cache.get(t) || null;
    return e !== null ? e : (this.cache.set(t, t), t);
  }
  get(t) {
    return this.cache.get(t) || null;
  }
  get length() {
    return this.cache.length;
  }
}
class Ju extends Me {
  constructor(t) {
    super(), this.parentCtx = null, this.symbol = t;
  }
  getChild(t) {
    return null;
  }
  getSymbol() {
    return this.symbol;
  }
  getParent() {
    return this.parentCtx;
  }
  getPayload() {
    return this.symbol;
  }
  getSourceInterval() {
    if (this.symbol === null)
      return Q.INVALID_INTERVAL;
    const t = this.symbol.tokenIndex;
    return new Q(t, t);
  }
  getChildCount() {
    return 0;
  }
  accept(t) {
    return t.visitTerminal(this);
  }
  getText() {
    return this.symbol.text;
  }
  toString() {
    return this.symbol.type === b.EOF ? "<EOF>" : this.symbol.text;
  }
}
class Zl extends Ju {
  constructor(t) {
    super(t);
  }
  isErrorNode() {
    return !0;
  }
  accept(t) {
    return t.visitErrorNode(this);
  }
}
class th extends Fn {
  constructor(t, e) {
    t = t || null, e = e || null, super(t, e), this.ruleIndex = -1, this.children = null, this.start = null, this.stop = null, this.exception = null;
  }
  copyFrom(t) {
    this.parentCtx = t.parentCtx, this.invokingState = t.invokingState, this.children = null, this.start = t.start, this.stop = t.stop, t.children && (this.children = [], t.children.map(function(e) {
      e instanceof Zl && (this.children.push(e), e.parentCtx = this);
    }, this));
  }
  enterRule(t) {
  }
  exitRule(t) {
  }
  addChild(t) {
    return this.children === null && (this.children = []), this.children.push(t), t;
  }
  removeLastChild() {
    this.children !== null && this.children.pop();
  }
  addTokenNode(t) {
    const e = new Ju(t);
    return this.addChild(e), e.parentCtx = this, e;
  }
  addErrorNode(t) {
    const e = new Zl(t);
    return this.addChild(e), e.parentCtx = this, e;
  }
  getChild(t, e) {
    if (e = e || null, this.children === null || t < 0 || t >= this.children.length)
      return null;
    if (e === null)
      return this.children[t];
    for (let r = 0; r < this.children.length; r++) {
      const s = this.children[r];
      if (s instanceof e) {
        if (t === 0)
          return s;
        t -= 1;
      }
    }
    return null;
  }
  getToken(t, e) {
    if (this.children === null || e < 0 || e >= this.children.length)
      return null;
    for (let r = 0; r < this.children.length; r++) {
      const s = this.children[r];
      if (s instanceof Me && s.symbol.type === t) {
        if (e === 0)
          return s;
        e -= 1;
      }
    }
    return null;
  }
  getTokens(t) {
    if (this.children === null)
      return [];
    {
      const e = [];
      for (let r = 0; r < this.children.length; r++) {
        const s = this.children[r];
        s instanceof Me && s.symbol.type === t && e.push(s);
      }
      return e;
    }
  }
  getTypedRuleContext(t, e) {
    return this.getChild(e, t);
  }
  getTypedRuleContexts(t) {
    if (this.children === null)
      return [];
    {
      const e = [];
      for (let r = 0; r < this.children.length; r++) {
        const s = this.children[r];
        s instanceof t && e.push(s);
      }
      return e;
    }
  }
  getChildCount() {
    return this.children === null ? 0 : this.children.length;
  }
  getSourceInterval() {
    return this.start === null || this.stop === null ? Q.INVALID_INTERVAL : new Q(this.start.tokenIndex, this.stop.tokenIndex);
  }
}
Fn.EMPTY = new th();
const P5 = { arrayToString: Ue }, _ = {
  atn: _5,
  dfa: v5,
  tree: C5,
  error: A5,
  Token: b,
  CommonToken: un,
  CharStreams: S5,
  InputStream: Je,
  FileStream: R5,
  CommonTokenStream: N5,
  Lexer: vt,
  Parser: Qu,
  PredictionContextCache: M5,
  ParserRuleContext: th,
  Interval: Q,
  IntervalSet: oe,
  LL1Analyzer: Bn,
  Utils: P5
}, $5 = [
  4,
  0,
  65,
  511,
  6,
  -1,
  6,
  -1,
  6,
  -1,
  2,
  0,
  7,
  0,
  2,
  1,
  7,
  1,
  2,
  2,
  7,
  2,
  2,
  3,
  7,
  3,
  2,
  4,
  7,
  4,
  2,
  5,
  7,
  5,
  2,
  6,
  7,
  6,
  2,
  7,
  7,
  7,
  2,
  8,
  7,
  8,
  2,
  9,
  7,
  9,
  2,
  10,
  7,
  10,
  2,
  11,
  7,
  11,
  2,
  12,
  7,
  12,
  2,
  13,
  7,
  13,
  2,
  14,
  7,
  14,
  2,
  15,
  7,
  15,
  2,
  16,
  7,
  16,
  2,
  17,
  7,
  17,
  2,
  18,
  7,
  18,
  2,
  19,
  7,
  19,
  2,
  20,
  7,
  20,
  2,
  21,
  7,
  21,
  2,
  22,
  7,
  22,
  2,
  23,
  7,
  23,
  2,
  24,
  7,
  24,
  2,
  25,
  7,
  25,
  2,
  26,
  7,
  26,
  2,
  27,
  7,
  27,
  2,
  28,
  7,
  28,
  2,
  29,
  7,
  29,
  2,
  30,
  7,
  30,
  2,
  31,
  7,
  31,
  2,
  32,
  7,
  32,
  2,
  33,
  7,
  33,
  2,
  34,
  7,
  34,
  2,
  35,
  7,
  35,
  2,
  36,
  7,
  36,
  2,
  37,
  7,
  37,
  2,
  38,
  7,
  38,
  2,
  39,
  7,
  39,
  2,
  40,
  7,
  40,
  2,
  41,
  7,
  41,
  2,
  42,
  7,
  42,
  2,
  43,
  7,
  43,
  2,
  44,
  7,
  44,
  2,
  45,
  7,
  45,
  2,
  46,
  7,
  46,
  2,
  47,
  7,
  47,
  2,
  48,
  7,
  48,
  2,
  49,
  7,
  49,
  2,
  50,
  7,
  50,
  2,
  51,
  7,
  51,
  2,
  52,
  7,
  52,
  2,
  53,
  7,
  53,
  2,
  54,
  7,
  54,
  2,
  55,
  7,
  55,
  2,
  56,
  7,
  56,
  2,
  57,
  7,
  57,
  2,
  58,
  7,
  58,
  2,
  59,
  7,
  59,
  2,
  60,
  7,
  60,
  2,
  61,
  7,
  61,
  2,
  62,
  7,
  62,
  2,
  63,
  7,
  63,
  2,
  64,
  7,
  64,
  2,
  65,
  7,
  65,
  1,
  0,
  1,
  0,
  1,
  0,
  1,
  0,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  2,
  1,
  2,
  1,
  2,
  1,
  2,
  1,
  2,
  1,
  2,
  1,
  2,
  1,
  2,
  1,
  2,
  1,
  2,
  1,
  2,
  1,
  3,
  1,
  3,
  1,
  3,
  1,
  3,
  1,
  3,
  1,
  3,
  1,
  3,
  1,
  3,
  1,
  3,
  1,
  4,
  1,
  4,
  1,
  4,
  1,
  4,
  1,
  4,
  1,
  4,
  1,
  4,
  1,
  4,
  1,
  5,
  1,
  5,
  1,
  5,
  1,
  5,
  1,
  5,
  1,
  5,
  1,
  5,
  1,
  5,
  1,
  6,
  1,
  6,
  1,
  6,
  1,
  6,
  1,
  7,
  1,
  7,
  1,
  7,
  1,
  8,
  1,
  8,
  1,
  8,
  1,
  9,
  1,
  9,
  1,
  9,
  1,
  10,
  1,
  10,
  1,
  11,
  1,
  11,
  4,
  11,
  201,
  8,
  11,
  11,
  11,
  12,
  11,
  202,
  1,
  12,
  1,
  12,
  1,
  12,
  1,
  13,
  1,
  13,
  1,
  13,
  1,
  14,
  1,
  14,
  1,
  14,
  1,
  15,
  1,
  15,
  1,
  15,
  1,
  16,
  1,
  16,
  1,
  17,
  1,
  17,
  1,
  18,
  1,
  18,
  1,
  18,
  1,
  19,
  1,
  19,
  1,
  19,
  1,
  20,
  1,
  20,
  1,
  21,
  1,
  21,
  1,
  22,
  1,
  22,
  1,
  23,
  1,
  23,
  1,
  24,
  1,
  24,
  1,
  25,
  1,
  25,
  1,
  26,
  1,
  26,
  1,
  27,
  1,
  27,
  1,
  28,
  1,
  28,
  1,
  29,
  1,
  29,
  1,
  30,
  1,
  30,
  1,
  31,
  1,
  31,
  1,
  32,
  1,
  32,
  1,
  33,
  1,
  33,
  1,
  34,
  1,
  34,
  1,
  34,
  1,
  34,
  1,
  34,
  1,
  35,
  1,
  35,
  1,
  35,
  1,
  35,
  1,
  35,
  1,
  35,
  1,
  36,
  1,
  36,
  1,
  36,
  1,
  36,
  1,
  36,
  1,
  36,
  1,
  36,
  3,
  36,
  273,
  8,
  36,
  1,
  37,
  1,
  37,
  1,
  37,
  1,
  38,
  1,
  38,
  1,
  38,
  1,
  38,
  1,
  38,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  3,
  39,
  309,
  8,
  39,
  1,
  40,
  1,
  40,
  1,
  40,
  1,
  40,
  1,
  40,
  1,
  40,
  1,
  40,
  1,
  41,
  1,
  41,
  1,
  41,
  1,
  41,
  1,
  42,
  1,
  42,
  1,
  42,
  1,
  42,
  1,
  43,
  1,
  43,
  1,
  43,
  1,
  43,
  1,
  43,
  1,
  43,
  1,
  44,
  1,
  44,
  1,
  44,
  1,
  44,
  1,
  45,
  1,
  45,
  1,
  45,
  1,
  46,
  1,
  46,
  1,
  46,
  1,
  46,
  1,
  47,
  1,
  47,
  1,
  47,
  1,
  47,
  1,
  47,
  1,
  47,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  49,
  1,
  49,
  1,
  49,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  3,
  50,
  376,
  8,
  50,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  3,
  51,
  404,
  8,
  51,
  1,
  52,
  1,
  52,
  5,
  52,
  408,
  8,
  52,
  10,
  52,
  12,
  52,
  411,
  9,
  52,
  1,
  53,
  1,
  53,
  1,
  54,
  1,
  54,
  5,
  54,
  417,
  8,
  54,
  10,
  54,
  12,
  54,
  420,
  9,
  54,
  1,
  55,
  4,
  55,
  423,
  8,
  55,
  11,
  55,
  12,
  55,
  424,
  1,
  56,
  4,
  56,
  428,
  8,
  56,
  11,
  56,
  12,
  56,
  429,
  1,
  56,
  1,
  56,
  5,
  56,
  434,
  8,
  56,
  10,
  56,
  12,
  56,
  437,
  9,
  56,
  1,
  56,
  1,
  56,
  4,
  56,
  441,
  8,
  56,
  11,
  56,
  12,
  56,
  442,
  3,
  56,
  445,
  8,
  56,
  1,
  57,
  1,
  57,
  1,
  57,
  1,
  57,
  5,
  57,
  451,
  8,
  57,
  10,
  57,
  12,
  57,
  454,
  9,
  57,
  1,
  57,
  3,
  57,
  457,
  8,
  57,
  1,
  58,
  1,
  58,
  1,
  58,
  1,
  58,
  1,
  59,
  1,
  59,
  1,
  59,
  1,
  59,
  5,
  59,
  467,
  8,
  59,
  10,
  59,
  12,
  59,
  470,
  9,
  59,
  1,
  59,
  1,
  59,
  1,
  59,
  1,
  59,
  1,
  60,
  1,
  60,
  1,
  61,
  1,
  61,
  5,
  61,
  480,
  8,
  61,
  10,
  61,
  12,
  61,
  483,
  9,
  61,
  1,
  61,
  1,
  61,
  1,
  61,
  1,
  61,
  5,
  61,
  489,
  8,
  61,
  10,
  61,
  12,
  61,
  492,
  9,
  61,
  1,
  62,
  4,
  62,
  495,
  8,
  62,
  11,
  62,
  12,
  62,
  496,
  1,
  63,
  1,
  63,
  1,
  63,
  1,
  63,
  1,
  64,
  4,
  64,
  504,
  8,
  64,
  11,
  64,
  12,
  64,
  505,
  1,
  65,
  1,
  65,
  1,
  65,
  1,
  65,
  1,
  468,
  0,
  66,
  3,
  1,
  5,
  2,
  7,
  3,
  9,
  4,
  11,
  5,
  13,
  6,
  15,
  7,
  17,
  8,
  19,
  9,
  21,
  10,
  23,
  0,
  25,
  11,
  27,
  12,
  29,
  13,
  31,
  14,
  33,
  15,
  35,
  16,
  37,
  17,
  39,
  18,
  41,
  19,
  43,
  20,
  45,
  21,
  47,
  22,
  49,
  23,
  51,
  24,
  53,
  25,
  55,
  26,
  57,
  27,
  59,
  28,
  61,
  29,
  63,
  30,
  65,
  31,
  67,
  32,
  69,
  33,
  71,
  34,
  73,
  35,
  75,
  36,
  77,
  37,
  79,
  38,
  81,
  39,
  83,
  40,
  85,
  41,
  87,
  42,
  89,
  43,
  91,
  44,
  93,
  45,
  95,
  46,
  97,
  47,
  99,
  48,
  101,
  49,
  103,
  50,
  105,
  51,
  107,
  52,
  109,
  53,
  111,
  54,
  113,
  55,
  115,
  56,
  117,
  57,
  119,
  58,
  121,
  59,
  123,
  60,
  125,
  61,
  127,
  62,
  129,
  63,
  131,
  64,
  133,
  65,
  3,
  0,
  1,
  2,
  7,
  2,
  0,
  9,
  9,
  32,
  32,
  3,
  0,
  48,
  57,
  65,
  70,
  97,
  102,
  4,
  0,
  48,
  57,
  65,
  90,
  95,
  95,
  97,
  122,
  3,
  0,
  65,
  90,
  95,
  95,
  97,
  122,
  1,
  0,
  48,
  57,
  3,
  0,
  10,
  10,
  13,
  13,
  34,
  34,
  2,
  0,
  10,
  10,
  13,
  13,
  532,
  0,
  3,
  1,
  0,
  0,
  0,
  0,
  5,
  1,
  0,
  0,
  0,
  0,
  7,
  1,
  0,
  0,
  0,
  0,
  9,
  1,
  0,
  0,
  0,
  0,
  11,
  1,
  0,
  0,
  0,
  0,
  13,
  1,
  0,
  0,
  0,
  0,
  15,
  1,
  0,
  0,
  0,
  0,
  17,
  1,
  0,
  0,
  0,
  0,
  19,
  1,
  0,
  0,
  0,
  0,
  21,
  1,
  0,
  0,
  0,
  0,
  25,
  1,
  0,
  0,
  0,
  0,
  27,
  1,
  0,
  0,
  0,
  0,
  29,
  1,
  0,
  0,
  0,
  0,
  31,
  1,
  0,
  0,
  0,
  0,
  33,
  1,
  0,
  0,
  0,
  0,
  35,
  1,
  0,
  0,
  0,
  0,
  37,
  1,
  0,
  0,
  0,
  0,
  39,
  1,
  0,
  0,
  0,
  0,
  41,
  1,
  0,
  0,
  0,
  0,
  43,
  1,
  0,
  0,
  0,
  0,
  45,
  1,
  0,
  0,
  0,
  0,
  47,
  1,
  0,
  0,
  0,
  0,
  49,
  1,
  0,
  0,
  0,
  0,
  51,
  1,
  0,
  0,
  0,
  0,
  53,
  1,
  0,
  0,
  0,
  0,
  55,
  1,
  0,
  0,
  0,
  0,
  57,
  1,
  0,
  0,
  0,
  0,
  59,
  1,
  0,
  0,
  0,
  0,
  61,
  1,
  0,
  0,
  0,
  0,
  63,
  1,
  0,
  0,
  0,
  0,
  65,
  1,
  0,
  0,
  0,
  0,
  67,
  1,
  0,
  0,
  0,
  0,
  69,
  1,
  0,
  0,
  0,
  0,
  71,
  1,
  0,
  0,
  0,
  0,
  73,
  1,
  0,
  0,
  0,
  0,
  75,
  1,
  0,
  0,
  0,
  0,
  77,
  1,
  0,
  0,
  0,
  0,
  79,
  1,
  0,
  0,
  0,
  0,
  81,
  1,
  0,
  0,
  0,
  0,
  83,
  1,
  0,
  0,
  0,
  0,
  85,
  1,
  0,
  0,
  0,
  0,
  87,
  1,
  0,
  0,
  0,
  0,
  89,
  1,
  0,
  0,
  0,
  0,
  91,
  1,
  0,
  0,
  0,
  0,
  93,
  1,
  0,
  0,
  0,
  0,
  95,
  1,
  0,
  0,
  0,
  0,
  97,
  1,
  0,
  0,
  0,
  0,
  99,
  1,
  0,
  0,
  0,
  0,
  101,
  1,
  0,
  0,
  0,
  0,
  103,
  1,
  0,
  0,
  0,
  0,
  105,
  1,
  0,
  0,
  0,
  0,
  107,
  1,
  0,
  0,
  0,
  0,
  109,
  1,
  0,
  0,
  0,
  0,
  111,
  1,
  0,
  0,
  0,
  0,
  113,
  1,
  0,
  0,
  0,
  0,
  115,
  1,
  0,
  0,
  0,
  0,
  117,
  1,
  0,
  0,
  0,
  0,
  119,
  1,
  0,
  0,
  0,
  0,
  121,
  1,
  0,
  0,
  0,
  0,
  123,
  1,
  0,
  0,
  0,
  0,
  125,
  1,
  0,
  0,
  0,
  1,
  127,
  1,
  0,
  0,
  0,
  1,
  129,
  1,
  0,
  0,
  0,
  2,
  131,
  1,
  0,
  0,
  0,
  2,
  133,
  1,
  0,
  0,
  0,
  3,
  135,
  1,
  0,
  0,
  0,
  5,
  139,
  1,
  0,
  0,
  0,
  7,
  147,
  1,
  0,
  0,
  0,
  9,
  158,
  1,
  0,
  0,
  0,
  11,
  167,
  1,
  0,
  0,
  0,
  13,
  175,
  1,
  0,
  0,
  0,
  15,
  183,
  1,
  0,
  0,
  0,
  17,
  187,
  1,
  0,
  0,
  0,
  19,
  190,
  1,
  0,
  0,
  0,
  21,
  193,
  1,
  0,
  0,
  0,
  23,
  196,
  1,
  0,
  0,
  0,
  25,
  198,
  1,
  0,
  0,
  0,
  27,
  204,
  1,
  0,
  0,
  0,
  29,
  207,
  1,
  0,
  0,
  0,
  31,
  210,
  1,
  0,
  0,
  0,
  33,
  213,
  1,
  0,
  0,
  0,
  35,
  216,
  1,
  0,
  0,
  0,
  37,
  218,
  1,
  0,
  0,
  0,
  39,
  220,
  1,
  0,
  0,
  0,
  41,
  223,
  1,
  0,
  0,
  0,
  43,
  226,
  1,
  0,
  0,
  0,
  45,
  228,
  1,
  0,
  0,
  0,
  47,
  230,
  1,
  0,
  0,
  0,
  49,
  232,
  1,
  0,
  0,
  0,
  51,
  234,
  1,
  0,
  0,
  0,
  53,
  236,
  1,
  0,
  0,
  0,
  55,
  238,
  1,
  0,
  0,
  0,
  57,
  240,
  1,
  0,
  0,
  0,
  59,
  242,
  1,
  0,
  0,
  0,
  61,
  244,
  1,
  0,
  0,
  0,
  63,
  246,
  1,
  0,
  0,
  0,
  65,
  248,
  1,
  0,
  0,
  0,
  67,
  250,
  1,
  0,
  0,
  0,
  69,
  252,
  1,
  0,
  0,
  0,
  71,
  254,
  1,
  0,
  0,
  0,
  73,
  259,
  1,
  0,
  0,
  0,
  75,
  272,
  1,
  0,
  0,
  0,
  77,
  274,
  1,
  0,
  0,
  0,
  79,
  277,
  1,
  0,
  0,
  0,
  81,
  308,
  1,
  0,
  0,
  0,
  83,
  310,
  1,
  0,
  0,
  0,
  85,
  317,
  1,
  0,
  0,
  0,
  87,
  321,
  1,
  0,
  0,
  0,
  89,
  325,
  1,
  0,
  0,
  0,
  91,
  331,
  1,
  0,
  0,
  0,
  93,
  335,
  1,
  0,
  0,
  0,
  95,
  338,
  1,
  0,
  0,
  0,
  97,
  342,
  1,
  0,
  0,
  0,
  99,
  348,
  1,
  0,
  0,
  0,
  101,
  356,
  1,
  0,
  0,
  0,
  103,
  375,
  1,
  0,
  0,
  0,
  105,
  403,
  1,
  0,
  0,
  0,
  107,
  405,
  1,
  0,
  0,
  0,
  109,
  412,
  1,
  0,
  0,
  0,
  111,
  414,
  1,
  0,
  0,
  0,
  113,
  422,
  1,
  0,
  0,
  0,
  115,
  444,
  1,
  0,
  0,
  0,
  117,
  446,
  1,
  0,
  0,
  0,
  119,
  458,
  1,
  0,
  0,
  0,
  121,
  462,
  1,
  0,
  0,
  0,
  123,
  475,
  1,
  0,
  0,
  0,
  125,
  477,
  1,
  0,
  0,
  0,
  127,
  494,
  1,
  0,
  0,
  0,
  129,
  498,
  1,
  0,
  0,
  0,
  131,
  503,
  1,
  0,
  0,
  0,
  133,
  507,
  1,
  0,
  0,
  0,
  135,
  136,
  7,
  0,
  0,
  0,
  136,
  137,
  1,
  0,
  0,
  0,
  137,
  138,
  6,
  0,
  0,
  0,
  138,
  4,
  1,
  0,
  0,
  0,
  139,
  140,
  5,
  99,
  0,
  0,
  140,
  141,
  5,
  111,
  0,
  0,
  141,
  142,
  5,
  110,
  0,
  0,
  142,
  143,
  5,
  115,
  0,
  0,
  143,
  144,
  5,
  116,
  0,
  0,
  144,
  145,
  1,
  0,
  0,
  0,
  145,
  146,
  6,
  1,
  1,
  0,
  146,
  6,
  1,
  0,
  0,
  0,
  147,
  148,
  5,
  114,
  0,
  0,
  148,
  149,
  5,
  101,
  0,
  0,
  149,
  150,
  5,
  97,
  0,
  0,
  150,
  151,
  5,
  100,
  0,
  0,
  151,
  152,
  5,
  111,
  0,
  0,
  152,
  153,
  5,
  110,
  0,
  0,
  153,
  154,
  5,
  108,
  0,
  0,
  154,
  155,
  5,
  121,
  0,
  0,
  155,
  156,
  1,
  0,
  0,
  0,
  156,
  157,
  6,
  2,
  1,
  0,
  157,
  8,
  1,
  0,
  0,
  0,
  158,
  159,
  5,
  115,
  0,
  0,
  159,
  160,
  5,
  116,
  0,
  0,
  160,
  161,
  5,
  97,
  0,
  0,
  161,
  162,
  5,
  116,
  0,
  0,
  162,
  163,
  5,
  105,
  0,
  0,
  163,
  164,
  5,
  99,
  0,
  0,
  164,
  165,
  1,
  0,
  0,
  0,
  165,
  166,
  6,
  3,
  1,
  0,
  166,
  10,
  1,
  0,
  0,
  0,
  167,
  168,
  5,
  97,
  0,
  0,
  168,
  169,
  5,
  119,
  0,
  0,
  169,
  170,
  5,
  97,
  0,
  0,
  170,
  171,
  5,
  105,
  0,
  0,
  171,
  172,
  5,
  116,
  0,
  0,
  172,
  173,
  1,
  0,
  0,
  0,
  173,
  174,
  6,
  4,
  1,
  0,
  174,
  12,
  1,
  0,
  0,
  0,
  175,
  176,
  5,
  116,
  0,
  0,
  176,
  177,
  5,
  105,
  0,
  0,
  177,
  178,
  5,
  116,
  0,
  0,
  178,
  179,
  5,
  108,
  0,
  0,
  179,
  180,
  5,
  101,
  0,
  0,
  180,
  181,
  1,
  0,
  0,
  0,
  181,
  182,
  6,
  5,
  2,
  0,
  182,
  14,
  1,
  0,
  0,
  0,
  183,
  184,
  5,
  58,
  0,
  0,
  184,
  185,
  1,
  0,
  0,
  0,
  185,
  186,
  6,
  6,
  3,
  0,
  186,
  16,
  1,
  0,
  0,
  0,
  187,
  188,
  5,
  60,
  0,
  0,
  188,
  189,
  5,
  60,
  0,
  0,
  189,
  18,
  1,
  0,
  0,
  0,
  190,
  191,
  5,
  62,
  0,
  0,
  191,
  192,
  5,
  62,
  0,
  0,
  192,
  20,
  1,
  0,
  0,
  0,
  193,
  194,
  5,
  45,
  0,
  0,
  194,
  195,
  5,
  62,
  0,
  0,
  195,
  22,
  1,
  0,
  0,
  0,
  196,
  197,
  7,
  1,
  0,
  0,
  197,
  24,
  1,
  0,
  0,
  0,
  198,
  200,
  5,
  35,
  0,
  0,
  199,
  201,
  3,
  23,
  10,
  0,
  200,
  199,
  1,
  0,
  0,
  0,
  201,
  202,
  1,
  0,
  0,
  0,
  202,
  200,
  1,
  0,
  0,
  0,
  202,
  203,
  1,
  0,
  0,
  0,
  203,
  26,
  1,
  0,
  0,
  0,
  204,
  205,
  5,
  124,
  0,
  0,
  205,
  206,
  5,
  124,
  0,
  0,
  206,
  28,
  1,
  0,
  0,
  0,
  207,
  208,
  5,
  38,
  0,
  0,
  208,
  209,
  5,
  38,
  0,
  0,
  209,
  30,
  1,
  0,
  0,
  0,
  210,
  211,
  5,
  61,
  0,
  0,
  211,
  212,
  5,
  61,
  0,
  0,
  212,
  32,
  1,
  0,
  0,
  0,
  213,
  214,
  5,
  33,
  0,
  0,
  214,
  215,
  5,
  61,
  0,
  0,
  215,
  34,
  1,
  0,
  0,
  0,
  216,
  217,
  5,
  62,
  0,
  0,
  217,
  36,
  1,
  0,
  0,
  0,
  218,
  219,
  5,
  60,
  0,
  0,
  219,
  38,
  1,
  0,
  0,
  0,
  220,
  221,
  5,
  62,
  0,
  0,
  221,
  222,
  5,
  61,
  0,
  0,
  222,
  40,
  1,
  0,
  0,
  0,
  223,
  224,
  5,
  60,
  0,
  0,
  224,
  225,
  5,
  61,
  0,
  0,
  225,
  42,
  1,
  0,
  0,
  0,
  226,
  227,
  5,
  43,
  0,
  0,
  227,
  44,
  1,
  0,
  0,
  0,
  228,
  229,
  5,
  45,
  0,
  0,
  229,
  46,
  1,
  0,
  0,
  0,
  230,
  231,
  5,
  42,
  0,
  0,
  231,
  48,
  1,
  0,
  0,
  0,
  232,
  233,
  5,
  47,
  0,
  0,
  233,
  50,
  1,
  0,
  0,
  0,
  234,
  235,
  5,
  37,
  0,
  0,
  235,
  52,
  1,
  0,
  0,
  0,
  236,
  237,
  5,
  94,
  0,
  0,
  237,
  54,
  1,
  0,
  0,
  0,
  238,
  239,
  5,
  33,
  0,
  0,
  239,
  56,
  1,
  0,
  0,
  0,
  240,
  241,
  5,
  59,
  0,
  0,
  241,
  58,
  1,
  0,
  0,
  0,
  242,
  243,
  5,
  44,
  0,
  0,
  243,
  60,
  1,
  0,
  0,
  0,
  244,
  245,
  5,
  61,
  0,
  0,
  245,
  62,
  1,
  0,
  0,
  0,
  246,
  247,
  5,
  40,
  0,
  0,
  247,
  64,
  1,
  0,
  0,
  0,
  248,
  249,
  5,
  41,
  0,
  0,
  249,
  66,
  1,
  0,
  0,
  0,
  250,
  251,
  5,
  123,
  0,
  0,
  251,
  68,
  1,
  0,
  0,
  0,
  252,
  253,
  5,
  125,
  0,
  0,
  253,
  70,
  1,
  0,
  0,
  0,
  254,
  255,
  5,
  116,
  0,
  0,
  255,
  256,
  5,
  114,
  0,
  0,
  256,
  257,
  5,
  117,
  0,
  0,
  257,
  258,
  5,
  101,
  0,
  0,
  258,
  72,
  1,
  0,
  0,
  0,
  259,
  260,
  5,
  102,
  0,
  0,
  260,
  261,
  5,
  97,
  0,
  0,
  261,
  262,
  5,
  108,
  0,
  0,
  262,
  263,
  5,
  115,
  0,
  0,
  263,
  264,
  5,
  101,
  0,
  0,
  264,
  74,
  1,
  0,
  0,
  0,
  265,
  266,
  5,
  110,
  0,
  0,
  266,
  267,
  5,
  105,
  0,
  0,
  267,
  273,
  5,
  108,
  0,
  0,
  268,
  269,
  5,
  110,
  0,
  0,
  269,
  270,
  5,
  117,
  0,
  0,
  270,
  271,
  5,
  108,
  0,
  0,
  271,
  273,
  5,
  108,
  0,
  0,
  272,
  265,
  1,
  0,
  0,
  0,
  272,
  268,
  1,
  0,
  0,
  0,
  273,
  76,
  1,
  0,
  0,
  0,
  274,
  275,
  5,
  105,
  0,
  0,
  275,
  276,
  5,
  102,
  0,
  0,
  276,
  78,
  1,
  0,
  0,
  0,
  277,
  278,
  5,
  101,
  0,
  0,
  278,
  279,
  5,
  108,
  0,
  0,
  279,
  280,
  5,
  115,
  0,
  0,
  280,
  281,
  5,
  101,
  0,
  0,
  281,
  80,
  1,
  0,
  0,
  0,
  282,
  283,
  5,
  119,
  0,
  0,
  283,
  284,
  5,
  104,
  0,
  0,
  284,
  285,
  5,
  105,
  0,
  0,
  285,
  286,
  5,
  108,
  0,
  0,
  286,
  309,
  5,
  101,
  0,
  0,
  287,
  288,
  5,
  102,
  0,
  0,
  288,
  289,
  5,
  111,
  0,
  0,
  289,
  309,
  5,
  114,
  0,
  0,
  290,
  291,
  5,
  102,
  0,
  0,
  291,
  292,
  5,
  111,
  0,
  0,
  292,
  293,
  5,
  114,
  0,
  0,
  293,
  294,
  5,
  101,
  0,
  0,
  294,
  295,
  5,
  97,
  0,
  0,
  295,
  296,
  5,
  99,
  0,
  0,
  296,
  309,
  5,
  104,
  0,
  0,
  297,
  298,
  5,
  102,
  0,
  0,
  298,
  299,
  5,
  111,
  0,
  0,
  299,
  300,
  5,
  114,
  0,
  0,
  300,
  301,
  5,
  69,
  0,
  0,
  301,
  302,
  5,
  97,
  0,
  0,
  302,
  303,
  5,
  99,
  0,
  0,
  303,
  309,
  5,
  104,
  0,
  0,
  304,
  305,
  5,
  108,
  0,
  0,
  305,
  306,
  5,
  111,
  0,
  0,
  306,
  307,
  5,
  111,
  0,
  0,
  307,
  309,
  5,
  112,
  0,
  0,
  308,
  282,
  1,
  0,
  0,
  0,
  308,
  287,
  1,
  0,
  0,
  0,
  308,
  290,
  1,
  0,
  0,
  0,
  308,
  297,
  1,
  0,
  0,
  0,
  308,
  304,
  1,
  0,
  0,
  0,
  309,
  82,
  1,
  0,
  0,
  0,
  310,
  311,
  5,
  114,
  0,
  0,
  311,
  312,
  5,
  101,
  0,
  0,
  312,
  313,
  5,
  116,
  0,
  0,
  313,
  314,
  5,
  117,
  0,
  0,
  314,
  315,
  5,
  114,
  0,
  0,
  315,
  316,
  5,
  110,
  0,
  0,
  316,
  84,
  1,
  0,
  0,
  0,
  317,
  318,
  5,
  110,
  0,
  0,
  318,
  319,
  5,
  101,
  0,
  0,
  319,
  320,
  5,
  119,
  0,
  0,
  320,
  86,
  1,
  0,
  0,
  0,
  321,
  322,
  5,
  112,
  0,
  0,
  322,
  323,
  5,
  97,
  0,
  0,
  323,
  324,
  5,
  114,
  0,
  0,
  324,
  88,
  1,
  0,
  0,
  0,
  325,
  326,
  5,
  103,
  0,
  0,
  326,
  327,
  5,
  114,
  0,
  0,
  327,
  328,
  5,
  111,
  0,
  0,
  328,
  329,
  5,
  117,
  0,
  0,
  329,
  330,
  5,
  112,
  0,
  0,
  330,
  90,
  1,
  0,
  0,
  0,
  331,
  332,
  5,
  111,
  0,
  0,
  332,
  333,
  5,
  112,
  0,
  0,
  333,
  334,
  5,
  116,
  0,
  0,
  334,
  92,
  1,
  0,
  0,
  0,
  335,
  336,
  5,
  97,
  0,
  0,
  336,
  337,
  5,
  115,
  0,
  0,
  337,
  94,
  1,
  0,
  0,
  0,
  338,
  339,
  5,
  116,
  0,
  0,
  339,
  340,
  5,
  114,
  0,
  0,
  340,
  341,
  5,
  121,
  0,
  0,
  341,
  96,
  1,
  0,
  0,
  0,
  342,
  343,
  5,
  99,
  0,
  0,
  343,
  344,
  5,
  97,
  0,
  0,
  344,
  345,
  5,
  116,
  0,
  0,
  345,
  346,
  5,
  99,
  0,
  0,
  346,
  347,
  5,
  104,
  0,
  0,
  347,
  98,
  1,
  0,
  0,
  0,
  348,
  349,
  5,
  102,
  0,
  0,
  349,
  350,
  5,
  105,
  0,
  0,
  350,
  351,
  5,
  110,
  0,
  0,
  351,
  352,
  5,
  97,
  0,
  0,
  352,
  353,
  5,
  108,
  0,
  0,
  353,
  354,
  5,
  108,
  0,
  0,
  354,
  355,
  5,
  121,
  0,
  0,
  355,
  100,
  1,
  0,
  0,
  0,
  356,
  357,
  5,
  105,
  0,
  0,
  357,
  358,
  5,
  110,
  0,
  0,
  358,
  102,
  1,
  0,
  0,
  0,
  359,
  360,
  5,
  64,
  0,
  0,
  360,
  361,
  5,
  83,
  0,
  0,
  361,
  362,
  5,
  116,
  0,
  0,
  362,
  363,
  5,
  97,
  0,
  0,
  363,
  364,
  5,
  114,
  0,
  0,
  364,
  365,
  5,
  116,
  0,
  0,
  365,
  366,
  5,
  101,
  0,
  0,
  366,
  376,
  5,
  114,
  0,
  0,
  367,
  368,
  5,
  64,
  0,
  0,
  368,
  369,
  5,
  115,
  0,
  0,
  369,
  370,
  5,
  116,
  0,
  0,
  370,
  371,
  5,
  97,
  0,
  0,
  371,
  372,
  5,
  114,
  0,
  0,
  372,
  373,
  5,
  116,
  0,
  0,
  373,
  374,
  5,
  101,
  0,
  0,
  374,
  376,
  5,
  114,
  0,
  0,
  375,
  359,
  1,
  0,
  0,
  0,
  375,
  367,
  1,
  0,
  0,
  0,
  376,
  104,
  1,
  0,
  0,
  0,
  377,
  378,
  5,
  64,
  0,
  0,
  378,
  379,
  5,
  82,
  0,
  0,
  379,
  380,
  5,
  101,
  0,
  0,
  380,
  381,
  5,
  116,
  0,
  0,
  381,
  382,
  5,
  117,
  0,
  0,
  382,
  383,
  5,
  114,
  0,
  0,
  383,
  404,
  5,
  110,
  0,
  0,
  384,
  385,
  5,
  64,
  0,
  0,
  385,
  386,
  5,
  114,
  0,
  0,
  386,
  387,
  5,
  101,
  0,
  0,
  387,
  388,
  5,
  116,
  0,
  0,
  388,
  389,
  5,
  117,
  0,
  0,
  389,
  390,
  5,
  114,
  0,
  0,
  390,
  404,
  5,
  110,
  0,
  0,
  391,
  392,
  5,
  64,
  0,
  0,
  392,
  393,
  5,
  82,
  0,
  0,
  393,
  394,
  5,
  101,
  0,
  0,
  394,
  395,
  5,
  112,
  0,
  0,
  395,
  396,
  5,
  108,
  0,
  0,
  396,
  404,
  5,
  121,
  0,
  0,
  397,
  398,
  5,
  64,
  0,
  0,
  398,
  399,
  5,
  114,
  0,
  0,
  399,
  400,
  5,
  101,
  0,
  0,
  400,
  401,
  5,
  112,
  0,
  0,
  401,
  402,
  5,
  108,
  0,
  0,
  402,
  404,
  5,
  121,
  0,
  0,
  403,
  377,
  1,
  0,
  0,
  0,
  403,
  384,
  1,
  0,
  0,
  0,
  403,
  391,
  1,
  0,
  0,
  0,
  403,
  397,
  1,
  0,
  0,
  0,
  404,
  106,
  1,
  0,
  0,
  0,
  405,
  409,
  5,
  64,
  0,
  0,
  406,
  408,
  7,
  2,
  0,
  0,
  407,
  406,
  1,
  0,
  0,
  0,
  408,
  411,
  1,
  0,
  0,
  0,
  409,
  407,
  1,
  0,
  0,
  0,
  409,
  410,
  1,
  0,
  0,
  0,
  410,
  108,
  1,
  0,
  0,
  0,
  411,
  409,
  1,
  0,
  0,
  0,
  412,
  413,
  5,
  46,
  0,
  0,
  413,
  110,
  1,
  0,
  0,
  0,
  414,
  418,
  7,
  3,
  0,
  0,
  415,
  417,
  7,
  2,
  0,
  0,
  416,
  415,
  1,
  0,
  0,
  0,
  417,
  420,
  1,
  0,
  0,
  0,
  418,
  416,
  1,
  0,
  0,
  0,
  418,
  419,
  1,
  0,
  0,
  0,
  419,
  112,
  1,
  0,
  0,
  0,
  420,
  418,
  1,
  0,
  0,
  0,
  421,
  423,
  7,
  4,
  0,
  0,
  422,
  421,
  1,
  0,
  0,
  0,
  423,
  424,
  1,
  0,
  0,
  0,
  424,
  422,
  1,
  0,
  0,
  0,
  424,
  425,
  1,
  0,
  0,
  0,
  425,
  114,
  1,
  0,
  0,
  0,
  426,
  428,
  7,
  4,
  0,
  0,
  427,
  426,
  1,
  0,
  0,
  0,
  428,
  429,
  1,
  0,
  0,
  0,
  429,
  427,
  1,
  0,
  0,
  0,
  429,
  430,
  1,
  0,
  0,
  0,
  430,
  431,
  1,
  0,
  0,
  0,
  431,
  435,
  5,
  46,
  0,
  0,
  432,
  434,
  7,
  4,
  0,
  0,
  433,
  432,
  1,
  0,
  0,
  0,
  434,
  437,
  1,
  0,
  0,
  0,
  435,
  433,
  1,
  0,
  0,
  0,
  435,
  436,
  1,
  0,
  0,
  0,
  436,
  445,
  1,
  0,
  0,
  0,
  437,
  435,
  1,
  0,
  0,
  0,
  438,
  440,
  5,
  46,
  0,
  0,
  439,
  441,
  7,
  4,
  0,
  0,
  440,
  439,
  1,
  0,
  0,
  0,
  441,
  442,
  1,
  0,
  0,
  0,
  442,
  440,
  1,
  0,
  0,
  0,
  442,
  443,
  1,
  0,
  0,
  0,
  443,
  445,
  1,
  0,
  0,
  0,
  444,
  427,
  1,
  0,
  0,
  0,
  444,
  438,
  1,
  0,
  0,
  0,
  445,
  116,
  1,
  0,
  0,
  0,
  446,
  452,
  5,
  34,
  0,
  0,
  447,
  451,
  8,
  5,
  0,
  0,
  448,
  449,
  5,
  34,
  0,
  0,
  449,
  451,
  5,
  34,
  0,
  0,
  450,
  447,
  1,
  0,
  0,
  0,
  450,
  448,
  1,
  0,
  0,
  0,
  451,
  454,
  1,
  0,
  0,
  0,
  452,
  450,
  1,
  0,
  0,
  0,
  452,
  453,
  1,
  0,
  0,
  0,
  453,
  456,
  1,
  0,
  0,
  0,
  454,
  452,
  1,
  0,
  0,
  0,
  455,
  457,
  7,
  5,
  0,
  0,
  456,
  455,
  1,
  0,
  0,
  0,
  456,
  457,
  1,
  0,
  0,
  0,
  457,
  118,
  1,
  0,
  0,
  0,
  458,
  459,
  7,
  6,
  0,
  0,
  459,
  460,
  1,
  0,
  0,
  0,
  460,
  461,
  6,
  58,
  0,
  0,
  461,
  120,
  1,
  0,
  0,
  0,
  462,
  463,
  5,
  47,
  0,
  0,
  463,
  464,
  5,
  47,
  0,
  0,
  464,
  468,
  1,
  0,
  0,
  0,
  465,
  467,
  9,
  0,
  0,
  0,
  466,
  465,
  1,
  0,
  0,
  0,
  467,
  470,
  1,
  0,
  0,
  0,
  468,
  469,
  1,
  0,
  0,
  0,
  468,
  466,
  1,
  0,
  0,
  0,
  469,
  471,
  1,
  0,
  0,
  0,
  470,
  468,
  1,
  0,
  0,
  0,
  471,
  472,
  5,
  10,
  0,
  0,
  472,
  473,
  1,
  0,
  0,
  0,
  473,
  474,
  6,
  59,
  4,
  0,
  474,
  122,
  1,
  0,
  0,
  0,
  475,
  476,
  9,
  0,
  0,
  0,
  476,
  124,
  1,
  0,
  0,
  0,
  477,
  481,
  4,
  61,
  0,
  0,
  478,
  480,
  3,
  3,
  0,
  0,
  479,
  478,
  1,
  0,
  0,
  0,
  480,
  483,
  1,
  0,
  0,
  0,
  481,
  479,
  1,
  0,
  0,
  0,
  481,
  482,
  1,
  0,
  0,
  0,
  482,
  484,
  1,
  0,
  0,
  0,
  483,
  481,
  1,
  0,
  0,
  0,
  484,
  485,
  5,
  61,
  0,
  0,
  485,
  486,
  5,
  61,
  0,
  0,
  486,
  490,
  1,
  0,
  0,
  0,
  487,
  489,
  8,
  6,
  0,
  0,
  488,
  487,
  1,
  0,
  0,
  0,
  489,
  492,
  1,
  0,
  0,
  0,
  490,
  488,
  1,
  0,
  0,
  0,
  490,
  491,
  1,
  0,
  0,
  0,
  491,
  126,
  1,
  0,
  0,
  0,
  492,
  490,
  1,
  0,
  0,
  0,
  493,
  495,
  8,
  6,
  0,
  0,
  494,
  493,
  1,
  0,
  0,
  0,
  495,
  496,
  1,
  0,
  0,
  0,
  496,
  494,
  1,
  0,
  0,
  0,
  496,
  497,
  1,
  0,
  0,
  0,
  497,
  128,
  1,
  0,
  0,
  0,
  498,
  499,
  7,
  6,
  0,
  0,
  499,
  500,
  1,
  0,
  0,
  0,
  500,
  501,
  6,
  63,
  5,
  0,
  501,
  130,
  1,
  0,
  0,
  0,
  502,
  504,
  8,
  6,
  0,
  0,
  503,
  502,
  1,
  0,
  0,
  0,
  504,
  505,
  1,
  0,
  0,
  0,
  505,
  503,
  1,
  0,
  0,
  0,
  505,
  506,
  1,
  0,
  0,
  0,
  506,
  132,
  1,
  0,
  0,
  0,
  507,
  508,
  7,
  6,
  0,
  0,
  508,
  509,
  1,
  0,
  0,
  0,
  509,
  510,
  6,
  65,
  5,
  0,
  510,
  134,
  1,
  0,
  0,
  0,
  23,
  0,
  1,
  2,
  202,
  272,
  308,
  375,
  403,
  409,
  418,
  424,
  429,
  435,
  442,
  444,
  450,
  452,
  456,
  468,
  481,
  490,
  496,
  505,
  6,
  0,
  1,
  0,
  0,
  3,
  0,
  5,
  2,
  0,
  5,
  1,
  0,
  0,
  2,
  0,
  4,
  0,
  0
], Mo = new _.atn.ATNDeserializer().deserialize($5), D5 = Mo.decisionToState.map((n, t) => new _.dfa.DFA(n, t));
class A extends _.Lexer {
  constructor(t) {
    super(t), this._interp = new _.atn.LexerATNSimulator(
      this,
      Mo,
      D5,
      new _.PredictionContextCache()
    );
  }
  get atn() {
    return Mo;
  }
}
tt(A, "grammarFileName", "sequenceLexer.g4"), tt(A, "channelNames", ["DEFAULT_TOKEN_CHANNEL", "HIDDEN", "COMMENT_CHANNEL", "MODIFIER_CHANNEL"]), tt(A, "modeNames", ["DEFAULT_MODE", "EVENT", "TITLE_MODE"]), tt(A, "literalNames", [
  null,
  null,
  "'const'",
  "'readonly'",
  "'static'",
  "'await'",
  "'title'",
  "':'",
  "'<<'",
  "'>>'",
  "'->'",
  null,
  "'||'",
  "'&&'",
  "'=='",
  "'!='",
  "'>'",
  "'<'",
  "'>='",
  "'<='",
  "'+'",
  "'-'",
  "'*'",
  "'/'",
  "'%'",
  "'^'",
  "'!'",
  "';'",
  "','",
  "'='",
  "'('",
  "')'",
  "'{'",
  "'}'",
  "'true'",
  "'false'",
  null,
  "'if'",
  "'else'",
  null,
  "'return'",
  "'new'",
  "'par'",
  "'group'",
  "'opt'",
  "'as'",
  "'try'",
  "'catch'",
  "'finally'",
  "'in'",
  null,
  null,
  null,
  "'.'"
]), tt(A, "symbolicNames", [
  null,
  "WS",
  "CONSTANT",
  "READONLY",
  "STATIC",
  "AWAIT",
  "TITLE",
  "COL",
  "SOPEN",
  "SCLOSE",
  "ARROW",
  "COLOR",
  "OR",
  "AND",
  "EQ",
  "NEQ",
  "GT",
  "LT",
  "GTEQ",
  "LTEQ",
  "PLUS",
  "MINUS",
  "MULT",
  "DIV",
  "MOD",
  "POW",
  "NOT",
  "SCOL",
  "COMMA",
  "ASSIGN",
  "OPAR",
  "CPAR",
  "OBRACE",
  "CBRACE",
  "TRUE",
  "FALSE",
  "NIL",
  "IF",
  "ELSE",
  "WHILE",
  "RETURN",
  "NEW",
  "PAR",
  "GROUP",
  "OPT",
  "AS",
  "TRY",
  "CATCH",
  "FINALLY",
  "IN",
  "STARTER_LXR",
  "ANNOTATION_RET",
  "ANNOTATION",
  "DOT",
  "ID",
  "INT",
  "FLOAT",
  "STRING",
  "CR",
  "COMMENT",
  "OTHER",
  "DIVIDER",
  "EVENT_PAYLOAD_LXR",
  "EVENT_END",
  "TITLE_CONTENT",
  "TITLE_END"
]), tt(A, "ruleNames", [
  "WS",
  "CONSTANT",
  "READONLY",
  "STATIC",
  "AWAIT",
  "TITLE",
  "COL",
  "SOPEN",
  "SCLOSE",
  "ARROW",
  "HEX",
  "COLOR",
  "OR",
  "AND",
  "EQ",
  "NEQ",
  "GT",
  "LT",
  "GTEQ",
  "LTEQ",
  "PLUS",
  "MINUS",
  "MULT",
  "DIV",
  "MOD",
  "POW",
  "NOT",
  "SCOL",
  "COMMA",
  "ASSIGN",
  "OPAR",
  "CPAR",
  "OBRACE",
  "CBRACE",
  "TRUE",
  "FALSE",
  "NIL",
  "IF",
  "ELSE",
  "WHILE",
  "RETURN",
  "NEW",
  "PAR",
  "GROUP",
  "OPT",
  "AS",
  "TRY",
  "CATCH",
  "FINALLY",
  "IN",
  "STARTER_LXR",
  "ANNOTATION_RET",
  "ANNOTATION",
  "DOT",
  "ID",
  "INT",
  "FLOAT",
  "STRING",
  "CR",
  "COMMENT",
  "OTHER",
  "DIVIDER",
  "EVENT_PAYLOAD_LXR",
  "EVENT_END",
  "TITLE_CONTENT",
  "TITLE_END"
]);
A.EOF = _.Token.EOF;
A.WS = 1;
A.CONSTANT = 2;
A.READONLY = 3;
A.STATIC = 4;
A.AWAIT = 5;
A.TITLE = 6;
A.COL = 7;
A.SOPEN = 8;
A.SCLOSE = 9;
A.ARROW = 10;
A.COLOR = 11;
A.OR = 12;
A.AND = 13;
A.EQ = 14;
A.NEQ = 15;
A.GT = 16;
A.LT = 17;
A.GTEQ = 18;
A.LTEQ = 19;
A.PLUS = 20;
A.MINUS = 21;
A.MULT = 22;
A.DIV = 23;
A.MOD = 24;
A.POW = 25;
A.NOT = 26;
A.SCOL = 27;
A.COMMA = 28;
A.ASSIGN = 29;
A.OPAR = 30;
A.CPAR = 31;
A.OBRACE = 32;
A.CBRACE = 33;
A.TRUE = 34;
A.FALSE = 35;
A.NIL = 36;
A.IF = 37;
A.ELSE = 38;
A.WHILE = 39;
A.RETURN = 40;
A.NEW = 41;
A.PAR = 42;
A.GROUP = 43;
A.OPT = 44;
A.AS = 45;
A.TRY = 46;
A.CATCH = 47;
A.FINALLY = 48;
A.IN = 49;
A.STARTER_LXR = 50;
A.ANNOTATION_RET = 51;
A.ANNOTATION = 52;
A.DOT = 53;
A.ID = 54;
A.INT = 55;
A.FLOAT = 56;
A.STRING = 57;
A.CR = 58;
A.COMMENT = 59;
A.OTHER = 60;
A.DIVIDER = 61;
A.EVENT_PAYLOAD_LXR = 62;
A.EVENT_END = 63;
A.TITLE_CONTENT = 64;
A.TITLE_END = 65;
A.COMMENT_CHANNEL = 2;
A.MODIFIER_CHANNEL = 3;
A.EVENT = 1;
A.TITLE_MODE = 2;
A.prototype.sempred = function(n, t, e) {
  switch (t) {
    case 61:
      return this.DIVIDER_sempred(n, e);
    default:
      throw "No registered predicate for:" + t;
  }
};
A.prototype.DIVIDER_sempred = function(n, t) {
  switch (t) {
    case 0:
      return this.column === 0;
    default:
      throw "No predicate with index:" + t;
  }
};
class v extends _.tree.ParseTreeListener {
  enterProg(t) {
  }
  exitProg(t) {
  }
  enterTitle(t) {
  }
  exitTitle(t) {
  }
  enterHead(t) {
  }
  exitHead(t) {
  }
  enterGroup(t) {
  }
  exitGroup(t) {
  }
  enterStarterExp(t) {
  }
  exitStarterExp(t) {
  }
  enterStarter(t) {
  }
  exitStarter(t) {
  }
  enterParticipant(t) {
  }
  exitParticipant(t) {
  }
  enterStereotype(t) {
  }
  exitStereotype(t) {
  }
  enterLabel(t) {
  }
  exitLabel(t) {
  }
  enterParticipantType(t) {
  }
  exitParticipantType(t) {
  }
  enterName(t) {
  }
  exitName(t) {
  }
  enterWidth(t) {
  }
  exitWidth(t) {
  }
  enterBlock(t) {
  }
  exitBlock(t) {
  }
  enterRet(t) {
  }
  exitRet(t) {
  }
  enterDivider(t) {
  }
  exitDivider(t) {
  }
  enterDividerNote(t) {
  }
  exitDividerNote(t) {
  }
  enterStat(t) {
  }
  exitStat(t) {
  }
  enterPar(t) {
  }
  exitPar(t) {
  }
  enterOpt(t) {
  }
  exitOpt(t) {
  }
  enterCreation(t) {
  }
  exitCreation(t) {
  }
  enterCreationBody(t) {
  }
  exitCreationBody(t) {
  }
  enterMessage(t) {
  }
  exitMessage(t) {
  }
  enterMessageBody(t) {
  }
  exitMessageBody(t) {
  }
  enterFunc(t) {
  }
  exitFunc(t) {
  }
  enterFrom(t) {
  }
  exitFrom(t) {
  }
  enterTo(t) {
  }
  exitTo(t) {
  }
  enterSignature(t) {
  }
  exitSignature(t) {
  }
  enterInvocation(t) {
  }
  exitInvocation(t) {
  }
  enterAssignment(t) {
  }
  exitAssignment(t) {
  }
  enterAsyncMessage(t) {
  }
  exitAsyncMessage(t) {
  }
  enterContent(t) {
  }
  exitContent(t) {
  }
  enterConstruct(t) {
  }
  exitConstruct(t) {
  }
  enterType(t) {
  }
  exitType(t) {
  }
  enterAssignee(t) {
  }
  exitAssignee(t) {
  }
  enterMethodName(t) {
  }
  exitMethodName(t) {
  }
  enterParameters(t) {
  }
  exitParameters(t) {
  }
  enterParameter(t) {
  }
  exitParameter(t) {
  }
  enterDeclaration(t) {
  }
  exitDeclaration(t) {
  }
  enterTcf(t) {
  }
  exitTcf(t) {
  }
  enterTryBlock(t) {
  }
  exitTryBlock(t) {
  }
  enterCatchBlock(t) {
  }
  exitCatchBlock(t) {
  }
  enterFinallyBlock(t) {
  }
  exitFinallyBlock(t) {
  }
  enterAlt(t) {
  }
  exitAlt(t) {
  }
  enterIfBlock(t) {
  }
  exitIfBlock(t) {
  }
  enterElseIfBlock(t) {
  }
  exitElseIfBlock(t) {
  }
  enterElseBlock(t) {
  }
  exitElseBlock(t) {
  }
  enterBraceBlock(t) {
  }
  exitBraceBlock(t) {
  }
  enterLoop(t) {
  }
  exitLoop(t) {
  }
  enterAssignmentExpr(t) {
  }
  exitAssignmentExpr(t) {
  }
  enterFuncExpr(t) {
  }
  exitFuncExpr(t) {
  }
  enterAtomExpr(t) {
  }
  exitAtomExpr(t) {
  }
  enterOrExpr(t) {
  }
  exitOrExpr(t) {
  }
  enterAdditiveExpr(t) {
  }
  exitAdditiveExpr(t) {
  }
  enterRelationalExpr(t) {
  }
  exitRelationalExpr(t) {
  }
  enterPlusExpr(t) {
  }
  exitPlusExpr(t) {
  }
  enterNotExpr(t) {
  }
  exitNotExpr(t) {
  }
  enterUnaryMinusExpr(t) {
  }
  exitUnaryMinusExpr(t) {
  }
  enterCreationExpr(t) {
  }
  exitCreationExpr(t) {
  }
  enterParenthesizedExpr(t) {
  }
  exitParenthesizedExpr(t) {
  }
  enterMultiplicationExpr(t) {
  }
  exitMultiplicationExpr(t) {
  }
  enterEqualityExpr(t) {
  }
  exitEqualityExpr(t) {
  }
  enterAndExpr(t) {
  }
  exitAndExpr(t) {
  }
  enterNumberAtom(t) {
  }
  exitNumberAtom(t) {
  }
  enterBooleanAtom(t) {
  }
  exitBooleanAtom(t) {
  }
  enterIdAtom(t) {
  }
  exitIdAtom(t) {
  }
  enterStringAtom(t) {
  }
  exitStringAtom(t) {
  }
  enterNilAtom(t) {
  }
  exitNilAtom(t) {
  }
  enterParExpr(t) {
  }
  exitParExpr(t) {
  }
  enterCondition(t) {
  }
  exitCondition(t) {
  }
  enterInExpr(t) {
  }
  exitInExpr(t) {
  }
}
const F5 = [
  4,
  1,
  65,
  550,
  2,
  0,
  7,
  0,
  2,
  1,
  7,
  1,
  2,
  2,
  7,
  2,
  2,
  3,
  7,
  3,
  2,
  4,
  7,
  4,
  2,
  5,
  7,
  5,
  2,
  6,
  7,
  6,
  2,
  7,
  7,
  7,
  2,
  8,
  7,
  8,
  2,
  9,
  7,
  9,
  2,
  10,
  7,
  10,
  2,
  11,
  7,
  11,
  2,
  12,
  7,
  12,
  2,
  13,
  7,
  13,
  2,
  14,
  7,
  14,
  2,
  15,
  7,
  15,
  2,
  16,
  7,
  16,
  2,
  17,
  7,
  17,
  2,
  18,
  7,
  18,
  2,
  19,
  7,
  19,
  2,
  20,
  7,
  20,
  2,
  21,
  7,
  21,
  2,
  22,
  7,
  22,
  2,
  23,
  7,
  23,
  2,
  24,
  7,
  24,
  2,
  25,
  7,
  25,
  2,
  26,
  7,
  26,
  2,
  27,
  7,
  27,
  2,
  28,
  7,
  28,
  2,
  29,
  7,
  29,
  2,
  30,
  7,
  30,
  2,
  31,
  7,
  31,
  2,
  32,
  7,
  32,
  2,
  33,
  7,
  33,
  2,
  34,
  7,
  34,
  2,
  35,
  7,
  35,
  2,
  36,
  7,
  36,
  2,
  37,
  7,
  37,
  2,
  38,
  7,
  38,
  2,
  39,
  7,
  39,
  2,
  40,
  7,
  40,
  2,
  41,
  7,
  41,
  2,
  42,
  7,
  42,
  2,
  43,
  7,
  43,
  2,
  44,
  7,
  44,
  2,
  45,
  7,
  45,
  2,
  46,
  7,
  46,
  2,
  47,
  7,
  47,
  2,
  48,
  7,
  48,
  2,
  49,
  7,
  49,
  2,
  50,
  7,
  50,
  2,
  51,
  7,
  51,
  2,
  52,
  7,
  52,
  1,
  0,
  3,
  0,
  108,
  8,
  0,
  1,
  0,
  1,
  0,
  3,
  0,
  112,
  8,
  0,
  1,
  0,
  1,
  0,
  1,
  0,
  1,
  0,
  3,
  0,
  118,
  8,
  0,
  1,
  0,
  3,
  0,
  121,
  8,
  0,
  1,
  0,
  1,
  0,
  1,
  0,
  3,
  0,
  126,
  8,
  0,
  1,
  1,
  1,
  1,
  1,
  1,
  3,
  1,
  131,
  8,
  1,
  1,
  2,
  1,
  2,
  4,
  2,
  135,
  8,
  2,
  11,
  2,
  12,
  2,
  136,
  1,
  2,
  1,
  2,
  5,
  2,
  141,
  8,
  2,
  10,
  2,
  12,
  2,
  144,
  9,
  2,
  1,
  2,
  3,
  2,
  147,
  8,
  2,
  1,
  3,
  1,
  3,
  3,
  3,
  151,
  8,
  3,
  1,
  3,
  1,
  3,
  5,
  3,
  155,
  8,
  3,
  10,
  3,
  12,
  3,
  158,
  9,
  3,
  1,
  3,
  1,
  3,
  1,
  3,
  3,
  3,
  163,
  8,
  3,
  1,
  3,
  1,
  3,
  1,
  3,
  3,
  3,
  168,
  8,
  3,
  3,
  3,
  170,
  8,
  3,
  1,
  4,
  1,
  4,
  1,
  4,
  3,
  4,
  175,
  8,
  4,
  1,
  4,
  3,
  4,
  178,
  8,
  4,
  1,
  4,
  3,
  4,
  181,
  8,
  4,
  1,
  5,
  1,
  5,
  1,
  6,
  3,
  6,
  186,
  8,
  6,
  1,
  6,
  3,
  6,
  189,
  8,
  6,
  1,
  6,
  1,
  6,
  3,
  6,
  193,
  8,
  6,
  1,
  6,
  3,
  6,
  196,
  8,
  6,
  1,
  6,
  3,
  6,
  199,
  8,
  6,
  1,
  6,
  1,
  6,
  3,
  6,
  203,
  8,
  6,
  1,
  7,
  1,
  7,
  1,
  7,
  1,
  7,
  1,
  7,
  1,
  7,
  1,
  7,
  3,
  7,
  212,
  8,
  7,
  1,
  7,
  1,
  7,
  3,
  7,
  216,
  8,
  7,
  3,
  7,
  218,
  8,
  7,
  1,
  8,
  1,
  8,
  1,
  8,
  3,
  8,
  223,
  8,
  8,
  1,
  9,
  1,
  9,
  1,
  10,
  1,
  10,
  1,
  11,
  1,
  11,
  1,
  12,
  4,
  12,
  232,
  8,
  12,
  11,
  12,
  12,
  12,
  233,
  1,
  13,
  1,
  13,
  3,
  13,
  238,
  8,
  13,
  1,
  13,
  3,
  13,
  241,
  8,
  13,
  1,
  13,
  1,
  13,
  1,
  13,
  3,
  13,
  246,
  8,
  13,
  3,
  13,
  248,
  8,
  13,
  1,
  14,
  1,
  14,
  1,
  15,
  1,
  15,
  1,
  16,
  1,
  16,
  1,
  16,
  1,
  16,
  1,
  16,
  1,
  16,
  1,
  16,
  1,
  16,
  3,
  16,
  262,
  8,
  16,
  1,
  16,
  1,
  16,
  1,
  16,
  1,
  16,
  1,
  16,
  3,
  16,
  269,
  8,
  16,
  1,
  17,
  1,
  17,
  1,
  17,
  3,
  17,
  274,
  8,
  17,
  1,
  18,
  1,
  18,
  1,
  18,
  3,
  18,
  279,
  8,
  18,
  1,
  19,
  1,
  19,
  1,
  19,
  3,
  19,
  284,
  8,
  19,
  1,
  20,
  3,
  20,
  287,
  8,
  20,
  1,
  20,
  1,
  20,
  1,
  20,
  1,
  20,
  3,
  20,
  293,
  8,
  20,
  1,
  20,
  3,
  20,
  296,
  8,
  20,
  1,
  20,
  3,
  20,
  299,
  8,
  20,
  1,
  20,
  3,
  20,
  302,
  8,
  20,
  1,
  21,
  1,
  21,
  1,
  21,
  3,
  21,
  307,
  8,
  21,
  1,
  22,
  3,
  22,
  310,
  8,
  22,
  1,
  22,
  1,
  22,
  1,
  22,
  3,
  22,
  315,
  8,
  22,
  1,
  22,
  1,
  22,
  1,
  22,
  3,
  22,
  320,
  8,
  22,
  1,
  22,
  1,
  22,
  1,
  22,
  1,
  22,
  1,
  22,
  3,
  22,
  327,
  8,
  22,
  1,
  22,
  1,
  22,
  1,
  22,
  3,
  22,
  332,
  8,
  22,
  1,
  23,
  1,
  23,
  1,
  23,
  5,
  23,
  337,
  8,
  23,
  10,
  23,
  12,
  23,
  340,
  9,
  23,
  1,
  24,
  1,
  24,
  1,
  25,
  1,
  25,
  1,
  26,
  1,
  26,
  3,
  26,
  348,
  8,
  26,
  1,
  27,
  1,
  27,
  3,
  27,
  352,
  8,
  27,
  1,
  27,
  1,
  27,
  1,
  28,
  3,
  28,
  357,
  8,
  28,
  1,
  28,
  1,
  28,
  1,
  28,
  1,
  29,
  1,
  29,
  1,
  29,
  3,
  29,
  365,
  8,
  29,
  1,
  29,
  1,
  29,
  1,
  29,
  1,
  29,
  1,
  29,
  1,
  29,
  1,
  29,
  3,
  29,
  374,
  8,
  29,
  3,
  29,
  376,
  8,
  29,
  1,
  30,
  1,
  30,
  1,
  31,
  1,
  31,
  1,
  32,
  1,
  32,
  1,
  33,
  1,
  33,
  1,
  33,
  1,
  33,
  5,
  33,
  388,
  8,
  33,
  10,
  33,
  12,
  33,
  391,
  9,
  33,
  1,
  33,
  3,
  33,
  394,
  8,
  33,
  1,
  34,
  1,
  34,
  1,
  35,
  1,
  35,
  1,
  35,
  5,
  35,
  401,
  8,
  35,
  10,
  35,
  12,
  35,
  404,
  9,
  35,
  1,
  35,
  3,
  35,
  407,
  8,
  35,
  1,
  36,
  1,
  36,
  3,
  36,
  411,
  8,
  36,
  1,
  37,
  1,
  37,
  1,
  37,
  1,
  38,
  1,
  38,
  5,
  38,
  418,
  8,
  38,
  10,
  38,
  12,
  38,
  421,
  9,
  38,
  1,
  38,
  3,
  38,
  424,
  8,
  38,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  40,
  1,
  40,
  3,
  40,
  431,
  8,
  40,
  1,
  40,
  1,
  40,
  1,
  41,
  1,
  41,
  1,
  41,
  1,
  42,
  1,
  42,
  5,
  42,
  440,
  8,
  42,
  10,
  42,
  12,
  42,
  443,
  9,
  42,
  1,
  42,
  3,
  42,
  446,
  8,
  42,
  1,
  43,
  1,
  43,
  1,
  43,
  1,
  43,
  1,
  44,
  1,
  44,
  1,
  44,
  1,
  44,
  1,
  44,
  1,
  45,
  1,
  45,
  1,
  45,
  1,
  46,
  1,
  46,
  3,
  46,
  462,
  8,
  46,
  1,
  46,
  1,
  46,
  1,
  47,
  1,
  47,
  1,
  47,
  1,
  47,
  1,
  47,
  1,
  47,
  1,
  47,
  3,
  47,
  473,
  8,
  47,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  3,
  48,
  484,
  8,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  3,
  48,
  495,
  8,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  5,
  48,
  518,
  8,
  48,
  10,
  48,
  12,
  48,
  521,
  9,
  48,
  1,
  49,
  1,
  49,
  1,
  49,
  1,
  49,
  1,
  49,
  3,
  49,
  528,
  8,
  49,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  3,
  50,
  539,
  8,
  50,
  1,
  51,
  1,
  51,
  1,
  51,
  3,
  51,
  544,
  8,
  51,
  1,
  52,
  1,
  52,
  1,
  52,
  1,
  52,
  1,
  52,
  0,
  1,
  96,
  53,
  0,
  2,
  4,
  6,
  8,
  10,
  12,
  14,
  16,
  18,
  20,
  22,
  24,
  26,
  28,
  30,
  32,
  34,
  36,
  38,
  40,
  42,
  44,
  46,
  48,
  50,
  52,
  54,
  56,
  58,
  60,
  62,
  64,
  66,
  68,
  70,
  72,
  74,
  76,
  78,
  80,
  82,
  84,
  86,
  88,
  90,
  92,
  94,
  96,
  98,
  100,
  102,
  104,
  0,
  10,
  2,
  0,
  54,
  54,
  57,
  57,
  2,
  0,
  8,
  8,
  17,
  17,
  2,
  0,
  9,
  9,
  16,
  16,
  2,
  0,
  10,
  10,
  21,
  21,
  1,
  0,
  22,
  24,
  1,
  0,
  20,
  21,
  1,
  0,
  16,
  19,
  1,
  0,
  14,
  15,
  1,
  0,
  55,
  56,
  1,
  0,
  34,
  35,
  606,
  0,
  125,
  1,
  0,
  0,
  0,
  2,
  127,
  1,
  0,
  0,
  0,
  4,
  146,
  1,
  0,
  0,
  0,
  6,
  169,
  1,
  0,
  0,
  0,
  8,
  180,
  1,
  0,
  0,
  0,
  10,
  182,
  1,
  0,
  0,
  0,
  12,
  202,
  1,
  0,
  0,
  0,
  14,
  217,
  1,
  0,
  0,
  0,
  16,
  222,
  1,
  0,
  0,
  0,
  18,
  224,
  1,
  0,
  0,
  0,
  20,
  226,
  1,
  0,
  0,
  0,
  22,
  228,
  1,
  0,
  0,
  0,
  24,
  231,
  1,
  0,
  0,
  0,
  26,
  247,
  1,
  0,
  0,
  0,
  28,
  249,
  1,
  0,
  0,
  0,
  30,
  251,
  1,
  0,
  0,
  0,
  32,
  268,
  1,
  0,
  0,
  0,
  34,
  273,
  1,
  0,
  0,
  0,
  36,
  278,
  1,
  0,
  0,
  0,
  38,
  280,
  1,
  0,
  0,
  0,
  40,
  301,
  1,
  0,
  0,
  0,
  42,
  303,
  1,
  0,
  0,
  0,
  44,
  331,
  1,
  0,
  0,
  0,
  46,
  333,
  1,
  0,
  0,
  0,
  48,
  341,
  1,
  0,
  0,
  0,
  50,
  343,
  1,
  0,
  0,
  0,
  52,
  345,
  1,
  0,
  0,
  0,
  54,
  349,
  1,
  0,
  0,
  0,
  56,
  356,
  1,
  0,
  0,
  0,
  58,
  375,
  1,
  0,
  0,
  0,
  60,
  377,
  1,
  0,
  0,
  0,
  62,
  379,
  1,
  0,
  0,
  0,
  64,
  381,
  1,
  0,
  0,
  0,
  66,
  393,
  1,
  0,
  0,
  0,
  68,
  395,
  1,
  0,
  0,
  0,
  70,
  397,
  1,
  0,
  0,
  0,
  72,
  410,
  1,
  0,
  0,
  0,
  74,
  412,
  1,
  0,
  0,
  0,
  76,
  415,
  1,
  0,
  0,
  0,
  78,
  425,
  1,
  0,
  0,
  0,
  80,
  428,
  1,
  0,
  0,
  0,
  82,
  434,
  1,
  0,
  0,
  0,
  84,
  437,
  1,
  0,
  0,
  0,
  86,
  447,
  1,
  0,
  0,
  0,
  88,
  451,
  1,
  0,
  0,
  0,
  90,
  456,
  1,
  0,
  0,
  0,
  92,
  459,
  1,
  0,
  0,
  0,
  94,
  472,
  1,
  0,
  0,
  0,
  96,
  494,
  1,
  0,
  0,
  0,
  98,
  527,
  1,
  0,
  0,
  0,
  100,
  538,
  1,
  0,
  0,
  0,
  102,
  543,
  1,
  0,
  0,
  0,
  104,
  545,
  1,
  0,
  0,
  0,
  106,
  108,
  3,
  2,
  1,
  0,
  107,
  106,
  1,
  0,
  0,
  0,
  107,
  108,
  1,
  0,
  0,
  0,
  108,
  109,
  1,
  0,
  0,
  0,
  109,
  126,
  5,
  0,
  0,
  1,
  110,
  112,
  3,
  2,
  1,
  0,
  111,
  110,
  1,
  0,
  0,
  0,
  111,
  112,
  1,
  0,
  0,
  0,
  112,
  113,
  1,
  0,
  0,
  0,
  113,
  114,
  3,
  4,
  2,
  0,
  114,
  115,
  5,
  0,
  0,
  1,
  115,
  126,
  1,
  0,
  0,
  0,
  116,
  118,
  3,
  2,
  1,
  0,
  117,
  116,
  1,
  0,
  0,
  0,
  117,
  118,
  1,
  0,
  0,
  0,
  118,
  120,
  1,
  0,
  0,
  0,
  119,
  121,
  3,
  4,
  2,
  0,
  120,
  119,
  1,
  0,
  0,
  0,
  120,
  121,
  1,
  0,
  0,
  0,
  121,
  122,
  1,
  0,
  0,
  0,
  122,
  123,
  3,
  24,
  12,
  0,
  123,
  124,
  5,
  0,
  0,
  1,
  124,
  126,
  1,
  0,
  0,
  0,
  125,
  107,
  1,
  0,
  0,
  0,
  125,
  111,
  1,
  0,
  0,
  0,
  125,
  117,
  1,
  0,
  0,
  0,
  126,
  1,
  1,
  0,
  0,
  0,
  127,
  128,
  5,
  6,
  0,
  0,
  128,
  130,
  5,
  64,
  0,
  0,
  129,
  131,
  5,
  65,
  0,
  0,
  130,
  129,
  1,
  0,
  0,
  0,
  130,
  131,
  1,
  0,
  0,
  0,
  131,
  3,
  1,
  0,
  0,
  0,
  132,
  135,
  3,
  6,
  3,
  0,
  133,
  135,
  3,
  12,
  6,
  0,
  134,
  132,
  1,
  0,
  0,
  0,
  134,
  133,
  1,
  0,
  0,
  0,
  135,
  136,
  1,
  0,
  0,
  0,
  136,
  134,
  1,
  0,
  0,
  0,
  136,
  137,
  1,
  0,
  0,
  0,
  137,
  147,
  1,
  0,
  0,
  0,
  138,
  141,
  3,
  6,
  3,
  0,
  139,
  141,
  3,
  12,
  6,
  0,
  140,
  138,
  1,
  0,
  0,
  0,
  140,
  139,
  1,
  0,
  0,
  0,
  141,
  144,
  1,
  0,
  0,
  0,
  142,
  140,
  1,
  0,
  0,
  0,
  142,
  143,
  1,
  0,
  0,
  0,
  143,
  145,
  1,
  0,
  0,
  0,
  144,
  142,
  1,
  0,
  0,
  0,
  145,
  147,
  3,
  8,
  4,
  0,
  146,
  134,
  1,
  0,
  0,
  0,
  146,
  142,
  1,
  0,
  0,
  0,
  147,
  5,
  1,
  0,
  0,
  0,
  148,
  150,
  5,
  43,
  0,
  0,
  149,
  151,
  3,
  20,
  10,
  0,
  150,
  149,
  1,
  0,
  0,
  0,
  150,
  151,
  1,
  0,
  0,
  0,
  151,
  152,
  1,
  0,
  0,
  0,
  152,
  156,
  5,
  32,
  0,
  0,
  153,
  155,
  3,
  12,
  6,
  0,
  154,
  153,
  1,
  0,
  0,
  0,
  155,
  158,
  1,
  0,
  0,
  0,
  156,
  154,
  1,
  0,
  0,
  0,
  156,
  157,
  1,
  0,
  0,
  0,
  157,
  159,
  1,
  0,
  0,
  0,
  158,
  156,
  1,
  0,
  0,
  0,
  159,
  170,
  5,
  33,
  0,
  0,
  160,
  162,
  5,
  43,
  0,
  0,
  161,
  163,
  3,
  20,
  10,
  0,
  162,
  161,
  1,
  0,
  0,
  0,
  162,
  163,
  1,
  0,
  0,
  0,
  163,
  164,
  1,
  0,
  0,
  0,
  164,
  170,
  5,
  32,
  0,
  0,
  165,
  167,
  5,
  43,
  0,
  0,
  166,
  168,
  3,
  20,
  10,
  0,
  167,
  166,
  1,
  0,
  0,
  0,
  167,
  168,
  1,
  0,
  0,
  0,
  168,
  170,
  1,
  0,
  0,
  0,
  169,
  148,
  1,
  0,
  0,
  0,
  169,
  160,
  1,
  0,
  0,
  0,
  169,
  165,
  1,
  0,
  0,
  0,
  170,
  7,
  1,
  0,
  0,
  0,
  171,
  177,
  5,
  50,
  0,
  0,
  172,
  174,
  5,
  30,
  0,
  0,
  173,
  175,
  3,
  10,
  5,
  0,
  174,
  173,
  1,
  0,
  0,
  0,
  174,
  175,
  1,
  0,
  0,
  0,
  175,
  176,
  1,
  0,
  0,
  0,
  176,
  178,
  5,
  31,
  0,
  0,
  177,
  172,
  1,
  0,
  0,
  0,
  177,
  178,
  1,
  0,
  0,
  0,
  178,
  181,
  1,
  0,
  0,
  0,
  179,
  181,
  5,
  52,
  0,
  0,
  180,
  171,
  1,
  0,
  0,
  0,
  180,
  179,
  1,
  0,
  0,
  0,
  181,
  9,
  1,
  0,
  0,
  0,
  182,
  183,
  7,
  0,
  0,
  0,
  183,
  11,
  1,
  0,
  0,
  0,
  184,
  186,
  3,
  18,
  9,
  0,
  185,
  184,
  1,
  0,
  0,
  0,
  185,
  186,
  1,
  0,
  0,
  0,
  186,
  188,
  1,
  0,
  0,
  0,
  187,
  189,
  3,
  14,
  7,
  0,
  188,
  187,
  1,
  0,
  0,
  0,
  188,
  189,
  1,
  0,
  0,
  0,
  189,
  190,
  1,
  0,
  0,
  0,
  190,
  192,
  3,
  20,
  10,
  0,
  191,
  193,
  3,
  22,
  11,
  0,
  192,
  191,
  1,
  0,
  0,
  0,
  192,
  193,
  1,
  0,
  0,
  0,
  193,
  195,
  1,
  0,
  0,
  0,
  194,
  196,
  3,
  16,
  8,
  0,
  195,
  194,
  1,
  0,
  0,
  0,
  195,
  196,
  1,
  0,
  0,
  0,
  196,
  198,
  1,
  0,
  0,
  0,
  197,
  199,
  5,
  11,
  0,
  0,
  198,
  197,
  1,
  0,
  0,
  0,
  198,
  199,
  1,
  0,
  0,
  0,
  199,
  203,
  1,
  0,
  0,
  0,
  200,
  203,
  3,
  14,
  7,
  0,
  201,
  203,
  3,
  18,
  9,
  0,
  202,
  185,
  1,
  0,
  0,
  0,
  202,
  200,
  1,
  0,
  0,
  0,
  202,
  201,
  1,
  0,
  0,
  0,
  203,
  13,
  1,
  0,
  0,
  0,
  204,
  205,
  5,
  8,
  0,
  0,
  205,
  206,
  3,
  20,
  10,
  0,
  206,
  207,
  5,
  9,
  0,
  0,
  207,
  218,
  1,
  0,
  0,
  0,
  208,
  209,
  5,
  8,
  0,
  0,
  209,
  211,
  3,
  20,
  10,
  0,
  210,
  212,
  5,
  16,
  0,
  0,
  211,
  210,
  1,
  0,
  0,
  0,
  211,
  212,
  1,
  0,
  0,
  0,
  212,
  218,
  1,
  0,
  0,
  0,
  213,
  215,
  7,
  1,
  0,
  0,
  214,
  216,
  7,
  2,
  0,
  0,
  215,
  214,
  1,
  0,
  0,
  0,
  215,
  216,
  1,
  0,
  0,
  0,
  216,
  218,
  1,
  0,
  0,
  0,
  217,
  204,
  1,
  0,
  0,
  0,
  217,
  208,
  1,
  0,
  0,
  0,
  217,
  213,
  1,
  0,
  0,
  0,
  218,
  15,
  1,
  0,
  0,
  0,
  219,
  220,
  5,
  45,
  0,
  0,
  220,
  223,
  3,
  20,
  10,
  0,
  221,
  223,
  5,
  45,
  0,
  0,
  222,
  219,
  1,
  0,
  0,
  0,
  222,
  221,
  1,
  0,
  0,
  0,
  223,
  17,
  1,
  0,
  0,
  0,
  224,
  225,
  5,
  52,
  0,
  0,
  225,
  19,
  1,
  0,
  0,
  0,
  226,
  227,
  7,
  0,
  0,
  0,
  227,
  21,
  1,
  0,
  0,
  0,
  228,
  229,
  5,
  55,
  0,
  0,
  229,
  23,
  1,
  0,
  0,
  0,
  230,
  232,
  3,
  32,
  16,
  0,
  231,
  230,
  1,
  0,
  0,
  0,
  232,
  233,
  1,
  0,
  0,
  0,
  233,
  231,
  1,
  0,
  0,
  0,
  233,
  234,
  1,
  0,
  0,
  0,
  234,
  25,
  1,
  0,
  0,
  0,
  235,
  237,
  5,
  40,
  0,
  0,
  236,
  238,
  3,
  96,
  48,
  0,
  237,
  236,
  1,
  0,
  0,
  0,
  237,
  238,
  1,
  0,
  0,
  0,
  238,
  240,
  1,
  0,
  0,
  0,
  239,
  241,
  5,
  27,
  0,
  0,
  240,
  239,
  1,
  0,
  0,
  0,
  240,
  241,
  1,
  0,
  0,
  0,
  241,
  248,
  1,
  0,
  0,
  0,
  242,
  243,
  5,
  51,
  0,
  0,
  243,
  245,
  3,
  58,
  29,
  0,
  244,
  246,
  5,
  63,
  0,
  0,
  245,
  244,
  1,
  0,
  0,
  0,
  245,
  246,
  1,
  0,
  0,
  0,
  246,
  248,
  1,
  0,
  0,
  0,
  247,
  235,
  1,
  0,
  0,
  0,
  247,
  242,
  1,
  0,
  0,
  0,
  248,
  27,
  1,
  0,
  0,
  0,
  249,
  250,
  3,
  30,
  15,
  0,
  250,
  29,
  1,
  0,
  0,
  0,
  251,
  252,
  5,
  61,
  0,
  0,
  252,
  31,
  1,
  0,
  0,
  0,
  253,
  269,
  3,
  84,
  42,
  0,
  254,
  269,
  3,
  34,
  17,
  0,
  255,
  269,
  3,
  36,
  18,
  0,
  256,
  269,
  3,
  94,
  47,
  0,
  257,
  269,
  3,
  38,
  19,
  0,
  258,
  269,
  3,
  42,
  21,
  0,
  259,
  261,
  3,
  58,
  29,
  0,
  260,
  262,
  5,
  63,
  0,
  0,
  261,
  260,
  1,
  0,
  0,
  0,
  261,
  262,
  1,
  0,
  0,
  0,
  262,
  269,
  1,
  0,
  0,
  0,
  263,
  269,
  3,
  26,
  13,
  0,
  264,
  269,
  3,
  28,
  14,
  0,
  265,
  269,
  3,
  76,
  38,
  0,
  266,
  267,
  5,
  60,
  0,
  0,
  267,
  269,
  6,
  16,
  -1,
  0,
  268,
  253,
  1,
  0,
  0,
  0,
  268,
  254,
  1,
  0,
  0,
  0,
  268,
  255,
  1,
  0,
  0,
  0,
  268,
  256,
  1,
  0,
  0,
  0,
  268,
  257,
  1,
  0,
  0,
  0,
  268,
  258,
  1,
  0,
  0,
  0,
  268,
  259,
  1,
  0,
  0,
  0,
  268,
  263,
  1,
  0,
  0,
  0,
  268,
  264,
  1,
  0,
  0,
  0,
  268,
  265,
  1,
  0,
  0,
  0,
  268,
  266,
  1,
  0,
  0,
  0,
  269,
  33,
  1,
  0,
  0,
  0,
  270,
  271,
  5,
  42,
  0,
  0,
  271,
  274,
  3,
  92,
  46,
  0,
  272,
  274,
  5,
  42,
  0,
  0,
  273,
  270,
  1,
  0,
  0,
  0,
  273,
  272,
  1,
  0,
  0,
  0,
  274,
  35,
  1,
  0,
  0,
  0,
  275,
  276,
  5,
  44,
  0,
  0,
  276,
  279,
  3,
  92,
  46,
  0,
  277,
  279,
  5,
  44,
  0,
  0,
  278,
  275,
  1,
  0,
  0,
  0,
  278,
  277,
  1,
  0,
  0,
  0,
  279,
  37,
  1,
  0,
  0,
  0,
  280,
  283,
  3,
  40,
  20,
  0,
  281,
  284,
  5,
  27,
  0,
  0,
  282,
  284,
  3,
  92,
  46,
  0,
  283,
  281,
  1,
  0,
  0,
  0,
  283,
  282,
  1,
  0,
  0,
  0,
  283,
  284,
  1,
  0,
  0,
  0,
  284,
  39,
  1,
  0,
  0,
  0,
  285,
  287,
  3,
  56,
  28,
  0,
  286,
  285,
  1,
  0,
  0,
  0,
  286,
  287,
  1,
  0,
  0,
  0,
  287,
  288,
  1,
  0,
  0,
  0,
  288,
  289,
  5,
  41,
  0,
  0,
  289,
  295,
  3,
  62,
  31,
  0,
  290,
  292,
  5,
  30,
  0,
  0,
  291,
  293,
  3,
  70,
  35,
  0,
  292,
  291,
  1,
  0,
  0,
  0,
  292,
  293,
  1,
  0,
  0,
  0,
  293,
  294,
  1,
  0,
  0,
  0,
  294,
  296,
  5,
  31,
  0,
  0,
  295,
  290,
  1,
  0,
  0,
  0,
  295,
  296,
  1,
  0,
  0,
  0,
  296,
  302,
  1,
  0,
  0,
  0,
  297,
  299,
  3,
  56,
  28,
  0,
  298,
  297,
  1,
  0,
  0,
  0,
  298,
  299,
  1,
  0,
  0,
  0,
  299,
  300,
  1,
  0,
  0,
  0,
  300,
  302,
  5,
  41,
  0,
  0,
  301,
  286,
  1,
  0,
  0,
  0,
  301,
  298,
  1,
  0,
  0,
  0,
  302,
  41,
  1,
  0,
  0,
  0,
  303,
  306,
  3,
  44,
  22,
  0,
  304,
  307,
  5,
  27,
  0,
  0,
  305,
  307,
  3,
  92,
  46,
  0,
  306,
  304,
  1,
  0,
  0,
  0,
  306,
  305,
  1,
  0,
  0,
  0,
  306,
  307,
  1,
  0,
  0,
  0,
  307,
  43,
  1,
  0,
  0,
  0,
  308,
  310,
  3,
  56,
  28,
  0,
  309,
  308,
  1,
  0,
  0,
  0,
  309,
  310,
  1,
  0,
  0,
  0,
  310,
  319,
  1,
  0,
  0,
  0,
  311,
  312,
  3,
  48,
  24,
  0,
  312,
  313,
  5,
  10,
  0,
  0,
  313,
  315,
  1,
  0,
  0,
  0,
  314,
  311,
  1,
  0,
  0,
  0,
  314,
  315,
  1,
  0,
  0,
  0,
  315,
  316,
  1,
  0,
  0,
  0,
  316,
  317,
  3,
  50,
  25,
  0,
  317,
  318,
  5,
  53,
  0,
  0,
  318,
  320,
  1,
  0,
  0,
  0,
  319,
  314,
  1,
  0,
  0,
  0,
  319,
  320,
  1,
  0,
  0,
  0,
  320,
  321,
  1,
  0,
  0,
  0,
  321,
  332,
  3,
  46,
  23,
  0,
  322,
  332,
  3,
  56,
  28,
  0,
  323,
  324,
  3,
  48,
  24,
  0,
  324,
  325,
  5,
  10,
  0,
  0,
  325,
  327,
  1,
  0,
  0,
  0,
  326,
  323,
  1,
  0,
  0,
  0,
  326,
  327,
  1,
  0,
  0,
  0,
  327,
  328,
  1,
  0,
  0,
  0,
  328,
  329,
  3,
  50,
  25,
  0,
  329,
  330,
  5,
  53,
  0,
  0,
  330,
  332,
  1,
  0,
  0,
  0,
  331,
  309,
  1,
  0,
  0,
  0,
  331,
  322,
  1,
  0,
  0,
  0,
  331,
  326,
  1,
  0,
  0,
  0,
  332,
  45,
  1,
  0,
  0,
  0,
  333,
  338,
  3,
  52,
  26,
  0,
  334,
  335,
  5,
  53,
  0,
  0,
  335,
  337,
  3,
  52,
  26,
  0,
  336,
  334,
  1,
  0,
  0,
  0,
  337,
  340,
  1,
  0,
  0,
  0,
  338,
  336,
  1,
  0,
  0,
  0,
  338,
  339,
  1,
  0,
  0,
  0,
  339,
  47,
  1,
  0,
  0,
  0,
  340,
  338,
  1,
  0,
  0,
  0,
  341,
  342,
  7,
  0,
  0,
  0,
  342,
  49,
  1,
  0,
  0,
  0,
  343,
  344,
  7,
  0,
  0,
  0,
  344,
  51,
  1,
  0,
  0,
  0,
  345,
  347,
  3,
  68,
  34,
  0,
  346,
  348,
  3,
  54,
  27,
  0,
  347,
  346,
  1,
  0,
  0,
  0,
  347,
  348,
  1,
  0,
  0,
  0,
  348,
  53,
  1,
  0,
  0,
  0,
  349,
  351,
  5,
  30,
  0,
  0,
  350,
  352,
  3,
  70,
  35,
  0,
  351,
  350,
  1,
  0,
  0,
  0,
  351,
  352,
  1,
  0,
  0,
  0,
  352,
  353,
  1,
  0,
  0,
  0,
  353,
  354,
  5,
  31,
  0,
  0,
  354,
  55,
  1,
  0,
  0,
  0,
  355,
  357,
  3,
  64,
  32,
  0,
  356,
  355,
  1,
  0,
  0,
  0,
  356,
  357,
  1,
  0,
  0,
  0,
  357,
  358,
  1,
  0,
  0,
  0,
  358,
  359,
  3,
  66,
  33,
  0,
  359,
  360,
  5,
  29,
  0,
  0,
  360,
  57,
  1,
  0,
  0,
  0,
  361,
  362,
  3,
  48,
  24,
  0,
  362,
  363,
  5,
  10,
  0,
  0,
  363,
  365,
  1,
  0,
  0,
  0,
  364,
  361,
  1,
  0,
  0,
  0,
  364,
  365,
  1,
  0,
  0,
  0,
  365,
  366,
  1,
  0,
  0,
  0,
  366,
  367,
  3,
  50,
  25,
  0,
  367,
  368,
  5,
  7,
  0,
  0,
  368,
  369,
  3,
  60,
  30,
  0,
  369,
  376,
  1,
  0,
  0,
  0,
  370,
  371,
  3,
  48,
  24,
  0,
  371,
  373,
  7,
  3,
  0,
  0,
  372,
  374,
  3,
  50,
  25,
  0,
  373,
  372,
  1,
  0,
  0,
  0,
  373,
  374,
  1,
  0,
  0,
  0,
  374,
  376,
  1,
  0,
  0,
  0,
  375,
  364,
  1,
  0,
  0,
  0,
  375,
  370,
  1,
  0,
  0,
  0,
  376,
  59,
  1,
  0,
  0,
  0,
  377,
  378,
  5,
  62,
  0,
  0,
  378,
  61,
  1,
  0,
  0,
  0,
  379,
  380,
  7,
  0,
  0,
  0,
  380,
  63,
  1,
  0,
  0,
  0,
  381,
  382,
  7,
  0,
  0,
  0,
  382,
  65,
  1,
  0,
  0,
  0,
  383,
  394,
  3,
  98,
  49,
  0,
  384,
  389,
  5,
  54,
  0,
  0,
  385,
  386,
  5,
  28,
  0,
  0,
  386,
  388,
  5,
  54,
  0,
  0,
  387,
  385,
  1,
  0,
  0,
  0,
  388,
  391,
  1,
  0,
  0,
  0,
  389,
  387,
  1,
  0,
  0,
  0,
  389,
  390,
  1,
  0,
  0,
  0,
  390,
  394,
  1,
  0,
  0,
  0,
  391,
  389,
  1,
  0,
  0,
  0,
  392,
  394,
  5,
  57,
  0,
  0,
  393,
  383,
  1,
  0,
  0,
  0,
  393,
  384,
  1,
  0,
  0,
  0,
  393,
  392,
  1,
  0,
  0,
  0,
  394,
  67,
  1,
  0,
  0,
  0,
  395,
  396,
  7,
  0,
  0,
  0,
  396,
  69,
  1,
  0,
  0,
  0,
  397,
  402,
  3,
  72,
  36,
  0,
  398,
  399,
  5,
  28,
  0,
  0,
  399,
  401,
  3,
  72,
  36,
  0,
  400,
  398,
  1,
  0,
  0,
  0,
  401,
  404,
  1,
  0,
  0,
  0,
  402,
  400,
  1,
  0,
  0,
  0,
  402,
  403,
  1,
  0,
  0,
  0,
  403,
  406,
  1,
  0,
  0,
  0,
  404,
  402,
  1,
  0,
  0,
  0,
  405,
  407,
  5,
  28,
  0,
  0,
  406,
  405,
  1,
  0,
  0,
  0,
  406,
  407,
  1,
  0,
  0,
  0,
  407,
  71,
  1,
  0,
  0,
  0,
  408,
  411,
  3,
  74,
  37,
  0,
  409,
  411,
  3,
  96,
  48,
  0,
  410,
  408,
  1,
  0,
  0,
  0,
  410,
  409,
  1,
  0,
  0,
  0,
  411,
  73,
  1,
  0,
  0,
  0,
  412,
  413,
  3,
  64,
  32,
  0,
  413,
  414,
  5,
  54,
  0,
  0,
  414,
  75,
  1,
  0,
  0,
  0,
  415,
  419,
  3,
  78,
  39,
  0,
  416,
  418,
  3,
  80,
  40,
  0,
  417,
  416,
  1,
  0,
  0,
  0,
  418,
  421,
  1,
  0,
  0,
  0,
  419,
  417,
  1,
  0,
  0,
  0,
  419,
  420,
  1,
  0,
  0,
  0,
  420,
  423,
  1,
  0,
  0,
  0,
  421,
  419,
  1,
  0,
  0,
  0,
  422,
  424,
  3,
  82,
  41,
  0,
  423,
  422,
  1,
  0,
  0,
  0,
  423,
  424,
  1,
  0,
  0,
  0,
  424,
  77,
  1,
  0,
  0,
  0,
  425,
  426,
  5,
  46,
  0,
  0,
  426,
  427,
  3,
  92,
  46,
  0,
  427,
  79,
  1,
  0,
  0,
  0,
  428,
  430,
  5,
  47,
  0,
  0,
  429,
  431,
  3,
  54,
  27,
  0,
  430,
  429,
  1,
  0,
  0,
  0,
  430,
  431,
  1,
  0,
  0,
  0,
  431,
  432,
  1,
  0,
  0,
  0,
  432,
  433,
  3,
  92,
  46,
  0,
  433,
  81,
  1,
  0,
  0,
  0,
  434,
  435,
  5,
  48,
  0,
  0,
  435,
  436,
  3,
  92,
  46,
  0,
  436,
  83,
  1,
  0,
  0,
  0,
  437,
  441,
  3,
  86,
  43,
  0,
  438,
  440,
  3,
  88,
  44,
  0,
  439,
  438,
  1,
  0,
  0,
  0,
  440,
  443,
  1,
  0,
  0,
  0,
  441,
  439,
  1,
  0,
  0,
  0,
  441,
  442,
  1,
  0,
  0,
  0,
  442,
  445,
  1,
  0,
  0,
  0,
  443,
  441,
  1,
  0,
  0,
  0,
  444,
  446,
  3,
  90,
  45,
  0,
  445,
  444,
  1,
  0,
  0,
  0,
  445,
  446,
  1,
  0,
  0,
  0,
  446,
  85,
  1,
  0,
  0,
  0,
  447,
  448,
  5,
  37,
  0,
  0,
  448,
  449,
  3,
  100,
  50,
  0,
  449,
  450,
  3,
  92,
  46,
  0,
  450,
  87,
  1,
  0,
  0,
  0,
  451,
  452,
  5,
  38,
  0,
  0,
  452,
  453,
  5,
  37,
  0,
  0,
  453,
  454,
  3,
  100,
  50,
  0,
  454,
  455,
  3,
  92,
  46,
  0,
  455,
  89,
  1,
  0,
  0,
  0,
  456,
  457,
  5,
  38,
  0,
  0,
  457,
  458,
  3,
  92,
  46,
  0,
  458,
  91,
  1,
  0,
  0,
  0,
  459,
  461,
  5,
  32,
  0,
  0,
  460,
  462,
  3,
  24,
  12,
  0,
  461,
  460,
  1,
  0,
  0,
  0,
  461,
  462,
  1,
  0,
  0,
  0,
  462,
  463,
  1,
  0,
  0,
  0,
  463,
  464,
  5,
  33,
  0,
  0,
  464,
  93,
  1,
  0,
  0,
  0,
  465,
  466,
  5,
  39,
  0,
  0,
  466,
  467,
  3,
  100,
  50,
  0,
  467,
  468,
  3,
  92,
  46,
  0,
  468,
  473,
  1,
  0,
  0,
  0,
  469,
  470,
  5,
  39,
  0,
  0,
  470,
  473,
  3,
  100,
  50,
  0,
  471,
  473,
  5,
  39,
  0,
  0,
  472,
  465,
  1,
  0,
  0,
  0,
  472,
  469,
  1,
  0,
  0,
  0,
  472,
  471,
  1,
  0,
  0,
  0,
  473,
  95,
  1,
  0,
  0,
  0,
  474,
  475,
  6,
  48,
  -1,
  0,
  475,
  495,
  3,
  98,
  49,
  0,
  476,
  477,
  5,
  21,
  0,
  0,
  477,
  495,
  3,
  96,
  48,
  13,
  478,
  479,
  5,
  26,
  0,
  0,
  479,
  495,
  3,
  96,
  48,
  12,
  480,
  481,
  3,
  50,
  25,
  0,
  481,
  482,
  5,
  53,
  0,
  0,
  482,
  484,
  1,
  0,
  0,
  0,
  483,
  480,
  1,
  0,
  0,
  0,
  483,
  484,
  1,
  0,
  0,
  0,
  484,
  485,
  1,
  0,
  0,
  0,
  485,
  495,
  3,
  46,
  23,
  0,
  486,
  495,
  3,
  38,
  19,
  0,
  487,
  488,
  5,
  30,
  0,
  0,
  488,
  489,
  3,
  96,
  48,
  0,
  489,
  490,
  5,
  31,
  0,
  0,
  490,
  495,
  1,
  0,
  0,
  0,
  491,
  492,
  3,
  56,
  28,
  0,
  492,
  493,
  3,
  96,
  48,
  1,
  493,
  495,
  1,
  0,
  0,
  0,
  494,
  474,
  1,
  0,
  0,
  0,
  494,
  476,
  1,
  0,
  0,
  0,
  494,
  478,
  1,
  0,
  0,
  0,
  494,
  483,
  1,
  0,
  0,
  0,
  494,
  486,
  1,
  0,
  0,
  0,
  494,
  487,
  1,
  0,
  0,
  0,
  494,
  491,
  1,
  0,
  0,
  0,
  495,
  519,
  1,
  0,
  0,
  0,
  496,
  497,
  10,
  11,
  0,
  0,
  497,
  498,
  7,
  4,
  0,
  0,
  498,
  518,
  3,
  96,
  48,
  12,
  499,
  500,
  10,
  10,
  0,
  0,
  500,
  501,
  7,
  5,
  0,
  0,
  501,
  518,
  3,
  96,
  48,
  11,
  502,
  503,
  10,
  9,
  0,
  0,
  503,
  504,
  7,
  6,
  0,
  0,
  504,
  518,
  3,
  96,
  48,
  10,
  505,
  506,
  10,
  8,
  0,
  0,
  506,
  507,
  7,
  7,
  0,
  0,
  507,
  518,
  3,
  96,
  48,
  9,
  508,
  509,
  10,
  7,
  0,
  0,
  509,
  510,
  5,
  13,
  0,
  0,
  510,
  518,
  3,
  96,
  48,
  8,
  511,
  512,
  10,
  6,
  0,
  0,
  512,
  513,
  5,
  12,
  0,
  0,
  513,
  518,
  3,
  96,
  48,
  7,
  514,
  515,
  10,
  5,
  0,
  0,
  515,
  516,
  5,
  20,
  0,
  0,
  516,
  518,
  3,
  96,
  48,
  6,
  517,
  496,
  1,
  0,
  0,
  0,
  517,
  499,
  1,
  0,
  0,
  0,
  517,
  502,
  1,
  0,
  0,
  0,
  517,
  505,
  1,
  0,
  0,
  0,
  517,
  508,
  1,
  0,
  0,
  0,
  517,
  511,
  1,
  0,
  0,
  0,
  517,
  514,
  1,
  0,
  0,
  0,
  518,
  521,
  1,
  0,
  0,
  0,
  519,
  517,
  1,
  0,
  0,
  0,
  519,
  520,
  1,
  0,
  0,
  0,
  520,
  97,
  1,
  0,
  0,
  0,
  521,
  519,
  1,
  0,
  0,
  0,
  522,
  528,
  7,
  8,
  0,
  0,
  523,
  528,
  7,
  9,
  0,
  0,
  524,
  528,
  5,
  54,
  0,
  0,
  525,
  528,
  5,
  57,
  0,
  0,
  526,
  528,
  5,
  36,
  0,
  0,
  527,
  522,
  1,
  0,
  0,
  0,
  527,
  523,
  1,
  0,
  0,
  0,
  527,
  524,
  1,
  0,
  0,
  0,
  527,
  525,
  1,
  0,
  0,
  0,
  527,
  526,
  1,
  0,
  0,
  0,
  528,
  99,
  1,
  0,
  0,
  0,
  529,
  530,
  5,
  30,
  0,
  0,
  530,
  531,
  3,
  102,
  51,
  0,
  531,
  532,
  5,
  31,
  0,
  0,
  532,
  539,
  1,
  0,
  0,
  0,
  533,
  534,
  5,
  30,
  0,
  0,
  534,
  539,
  3,
  102,
  51,
  0,
  535,
  536,
  5,
  30,
  0,
  0,
  536,
  539,
  5,
  31,
  0,
  0,
  537,
  539,
  5,
  30,
  0,
  0,
  538,
  529,
  1,
  0,
  0,
  0,
  538,
  533,
  1,
  0,
  0,
  0,
  538,
  535,
  1,
  0,
  0,
  0,
  538,
  537,
  1,
  0,
  0,
  0,
  539,
  101,
  1,
  0,
  0,
  0,
  540,
  544,
  3,
  98,
  49,
  0,
  541,
  544,
  3,
  96,
  48,
  0,
  542,
  544,
  3,
  104,
  52,
  0,
  543,
  540,
  1,
  0,
  0,
  0,
  543,
  541,
  1,
  0,
  0,
  0,
  543,
  542,
  1,
  0,
  0,
  0,
  544,
  103,
  1,
  0,
  0,
  0,
  545,
  546,
  5,
  54,
  0,
  0,
  546,
  547,
  5,
  49,
  0,
  0,
  547,
  548,
  5,
  54,
  0,
  0,
  548,
  105,
  1,
  0,
  0,
  0,
  76,
  107,
  111,
  117,
  120,
  125,
  130,
  134,
  136,
  140,
  142,
  146,
  150,
  156,
  162,
  167,
  169,
  174,
  177,
  180,
  185,
  188,
  192,
  195,
  198,
  202,
  211,
  215,
  217,
  222,
  233,
  237,
  240,
  245,
  247,
  261,
  268,
  273,
  278,
  283,
  286,
  292,
  295,
  298,
  301,
  306,
  309,
  314,
  319,
  326,
  331,
  338,
  347,
  351,
  356,
  364,
  373,
  375,
  389,
  393,
  402,
  406,
  410,
  419,
  423,
  430,
  441,
  445,
  461,
  472,
  483,
  494,
  517,
  519,
  527,
  538,
  543
], Po = new _.atn.ATNDeserializer().deserialize(F5), B5 = Po.decisionToState.map((n, t) => new _.dfa.DFA(n, t)), U5 = new _.PredictionContextCache(), m = class extends _.Parser {
  constructor(t) {
    super(t), this._interp = new _.atn.ParserATNSimulator(this, Po, B5, U5), this.ruleNames = m.ruleNames, this.literalNames = m.literalNames, this.symbolicNames = m.symbolicNames;
  }
  get atn() {
    return Po;
  }
  sempred(t, e, r) {
    switch (e) {
      case 48:
        return this.expr_sempred(t, r);
      default:
        throw "No predicate with index:" + e;
    }
  }
  expr_sempred(t, e) {
    switch (e) {
      case 0:
        return this.precpred(this._ctx, 11);
      case 1:
        return this.precpred(this._ctx, 10);
      case 2:
        return this.precpred(this._ctx, 9);
      case 3:
        return this.precpred(this._ctx, 8);
      case 4:
        return this.precpred(this._ctx, 7);
      case 5:
        return this.precpred(this._ctx, 6);
      case 6:
        return this.precpred(this._ctx, 5);
      default:
        throw "No predicate with index:" + e;
    }
  }
  prog() {
    let t = new eh(this, this._ctx, this.state);
    this.enterRule(t, 0, m.RULE_prog);
    var e = 0;
    try {
      this.state = 125, this._errHandler.sync(this);
      var r = this._interp.adaptivePredict(this._input, 4, this._ctx);
      switch (r) {
        case 1:
          this.enterOuterAlt(t, 1), this.state = 107, this._errHandler.sync(this), e = this._input.LA(1), e === 6 && (this.state = 106, this.title()), this.state = 109, this.match(m.EOF);
          break;
        case 2:
          this.enterOuterAlt(t, 2), this.state = 111, this._errHandler.sync(this), e = this._input.LA(1), e === 6 && (this.state = 110, this.title()), this.state = 113, this.head(), this.state = 114, this.match(m.EOF);
          break;
        case 3:
          this.enterOuterAlt(t, 3), this.state = 117, this._errHandler.sync(this), e = this._input.LA(1), e === 6 && (this.state = 116, this.title()), this.state = 120, this._errHandler.sync(this);
          var r = this._interp.adaptivePredict(this._input, 3, this._ctx);
          r === 1 && (this.state = 119, this.head()), this.state = 122, this.block(), this.state = 123, this.match(m.EOF);
          break;
      }
    } catch (s) {
      if (s instanceof _.error.RecognitionException)
        t.exception = s, this._errHandler.reportError(this, s), this._errHandler.recover(this, s);
      else
        throw s;
    } finally {
      this.exitRule();
    }
    return t;
  }
  title() {
    let t = new Ia(this, this._ctx, this.state);
    this.enterRule(t, 2, m.RULE_title);
    var e = 0;
    try {
      this.enterOuterAlt(t, 1), this.state = 127, this.match(m.TITLE), this.state = 128, this.match(m.TITLE_CONTENT), this.state = 130, this._errHandler.sync(this), e = this._input.LA(1), e === 65 && (this.state = 129, this.match(m.TITLE_END));
    } catch (r) {
      if (r instanceof _.error.RecognitionException)
        t.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return t;
  }
  head() {
    let t = new Ma(this, this._ctx, this.state);
    this.enterRule(t, 4, m.RULE_head);
    try {
      this.state = 146, this._errHandler.sync(this);
      var e = this._interp.adaptivePredict(this._input, 10, this._ctx);
      switch (e) {
        case 1:
          this.enterOuterAlt(t, 1), this.state = 134, this._errHandler.sync(this);
          var r = 1;
          do {
            switch (r) {
              case 1:
                switch (this.state = 134, this._errHandler.sync(this), this._input.LA(1)) {
                  case 43:
                    this.state = 132, this.group();
                    break;
                  case 8:
                  case 17:
                  case 52:
                  case 54:
                  case 57:
                    this.state = 133, this.participant();
                    break;
                  default:
                    throw new _.error.NoViableAltException(this);
                }
                break;
              default:
                throw new _.error.NoViableAltException(this);
            }
            this.state = 136, this._errHandler.sync(this), r = this._interp.adaptivePredict(this._input, 7, this._ctx);
          } while (r != 2 && r != _.atn.ATN.INVALID_ALT_NUMBER);
          break;
        case 2:
          this.enterOuterAlt(t, 2), this.state = 142, this._errHandler.sync(this);
          for (var r = this._interp.adaptivePredict(this._input, 9, this._ctx); r != 2 && r != _.atn.ATN.INVALID_ALT_NUMBER; ) {
            if (r === 1)
              switch (this.state = 140, this._errHandler.sync(this), this._input.LA(1)) {
                case 43:
                  this.state = 138, this.group();
                  break;
                case 8:
                case 17:
                case 52:
                case 54:
                case 57:
                  this.state = 139, this.participant();
                  break;
                default:
                  throw new _.error.NoViableAltException(this);
              }
            this.state = 144, this._errHandler.sync(this), r = this._interp.adaptivePredict(this._input, 9, this._ctx);
          }
          this.state = 145, this.starterExp();
          break;
      }
    } catch (s) {
      if (s instanceof _.error.RecognitionException)
        t.exception = s, this._errHandler.reportError(this, s), this._errHandler.recover(this, s);
      else
        throw s;
    } finally {
      this.exitRule();
    }
    return t;
  }
  group() {
    let t = new Hs(this, this._ctx, this.state);
    this.enterRule(t, 6, m.RULE_group);
    var e = 0;
    try {
      this.state = 169, this._errHandler.sync(this);
      var r = this._interp.adaptivePredict(this._input, 15, this._ctx);
      switch (r) {
        case 1:
          for (this.enterOuterAlt(t, 1), this.state = 148, this.match(m.GROUP), this.state = 150, this._errHandler.sync(this), e = this._input.LA(1), (e === 54 || e === 57) && (this.state = 149, this.name()), this.state = 152, this.match(m.OBRACE), this.state = 156, this._errHandler.sync(this), e = this._input.LA(1); e === 8 || e === 17 || !(e - 52 & -32) && 1 << e - 52 & 37; )
            this.state = 153, this.participant(), this.state = 158, this._errHandler.sync(this), e = this._input.LA(1);
          this.state = 159, this.match(m.CBRACE);
          break;
        case 2:
          this.enterOuterAlt(t, 2), this.state = 160, this.match(m.GROUP), this.state = 162, this._errHandler.sync(this), e = this._input.LA(1), (e === 54 || e === 57) && (this.state = 161, this.name()), this.state = 164, this.match(m.OBRACE);
          break;
        case 3:
          this.enterOuterAlt(t, 3), this.state = 165, this.match(m.GROUP), this.state = 167, this._errHandler.sync(this);
          var r = this._interp.adaptivePredict(this._input, 14, this._ctx);
          r === 1 && (this.state = 166, this.name());
          break;
      }
    } catch (s) {
      if (s instanceof _.error.RecognitionException)
        t.exception = s, this._errHandler.reportError(this, s), this._errHandler.recover(this, s);
      else
        throw s;
    } finally {
      this.exitRule();
    }
    return t;
  }
  starterExp() {
    let t = new Pa(this, this._ctx, this.state);
    this.enterRule(t, 8, m.RULE_starterExp);
    var e = 0;
    try {
      switch (this.state = 180, this._errHandler.sync(this), this._input.LA(1)) {
        case 50:
          this.enterOuterAlt(t, 1), this.state = 171, this.match(m.STARTER_LXR), this.state = 177, this._errHandler.sync(this), e = this._input.LA(1), e === 30 && (this.state = 172, this.match(m.OPAR), this.state = 174, this._errHandler.sync(this), e = this._input.LA(1), (e === 54 || e === 57) && (this.state = 173, this.starter()), this.state = 176, this.match(m.CPAR));
          break;
        case 52:
          this.enterOuterAlt(t, 2), this.state = 179, this.match(m.ANNOTATION);
          break;
        default:
          throw new _.error.NoViableAltException(this);
      }
    } catch (r) {
      if (r instanceof _.error.RecognitionException)
        t.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return t;
  }
  starter() {
    let t = new $a(this, this._ctx, this.state);
    this.enterRule(t, 10, m.RULE_starter);
    var e = 0;
    try {
      this.enterOuterAlt(t, 1), this.state = 182, e = this._input.LA(1), e === 54 || e === 57 ? (this._errHandler.reportMatch(this), this.consume()) : this._errHandler.recoverInline(this);
    } catch (r) {
      if (r instanceof _.error.RecognitionException)
        t.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return t;
  }
  participant() {
    let t = new Un(this, this._ctx, this.state);
    this.enterRule(t, 12, m.RULE_participant);
    var e = 0;
    try {
      this.state = 202, this._errHandler.sync(this);
      var r = this._interp.adaptivePredict(this._input, 24, this._ctx);
      switch (r) {
        case 1:
          this.enterOuterAlt(t, 1), this.state = 185, this._errHandler.sync(this), e = this._input.LA(1), e === 52 && (this.state = 184, this.participantType()), this.state = 188, this._errHandler.sync(this), e = this._input.LA(1), (e === 8 || e === 17) && (this.state = 187, this.stereotype()), this.state = 190, this.name(), this.state = 192, this._errHandler.sync(this);
          var r = this._interp.adaptivePredict(this._input, 21, this._ctx);
          r === 1 && (this.state = 191, this.width()), this.state = 195, this._errHandler.sync(this), e = this._input.LA(1), e === 45 && (this.state = 194, this.label()), this.state = 198, this._errHandler.sync(this), e = this._input.LA(1), e === 11 && (this.state = 197, this.match(m.COLOR));
          break;
        case 2:
          this.enterOuterAlt(t, 2), this.state = 200, this.stereotype();
          break;
        case 3:
          this.enterOuterAlt(t, 3), this.state = 201, this.participantType();
          break;
      }
    } catch (s) {
      if (s instanceof _.error.RecognitionException)
        t.exception = s, this._errHandler.reportError(this, s), this._errHandler.recover(this, s);
      else
        throw s;
    } finally {
      this.exitRule();
    }
    return t;
  }
  stereotype() {
    let t = new Da(this, this._ctx, this.state);
    this.enterRule(t, 14, m.RULE_stereotype);
    var e = 0;
    try {
      this.state = 217, this._errHandler.sync(this);
      var r = this._interp.adaptivePredict(this._input, 27, this._ctx);
      switch (r) {
        case 1:
          this.enterOuterAlt(t, 1), this.state = 204, this.match(m.SOPEN), this.state = 205, this.name(), this.state = 206, this.match(m.SCLOSE);
          break;
        case 2:
          this.enterOuterAlt(t, 2), this.state = 208, this.match(m.SOPEN), this.state = 209, this.name(), this.state = 211, this._errHandler.sync(this), e = this._input.LA(1), e === 16 && (this.state = 210, this.match(m.GT));
          break;
        case 3:
          this.enterOuterAlt(t, 3), this.state = 213, e = this._input.LA(1), e === 8 || e === 17 ? (this._errHandler.reportMatch(this), this.consume()) : this._errHandler.recoverInline(this), this.state = 215, this._errHandler.sync(this), e = this._input.LA(1), (e === 9 || e === 16) && (this.state = 214, e = this._input.LA(1), e === 9 || e === 16 ? (this._errHandler.reportMatch(this), this.consume()) : this._errHandler.recoverInline(this));
          break;
      }
    } catch (s) {
      if (s instanceof _.error.RecognitionException)
        t.exception = s, this._errHandler.reportError(this, s), this._errHandler.recover(this, s);
      else
        throw s;
    } finally {
      this.exitRule();
    }
    return t;
  }
  label() {
    let t = new Fa(this, this._ctx, this.state);
    this.enterRule(t, 16, m.RULE_label);
    try {
      this.state = 222, this._errHandler.sync(this);
      var e = this._interp.adaptivePredict(this._input, 28, this._ctx);
      switch (e) {
        case 1:
          this.enterOuterAlt(t, 1), this.state = 219, this.match(m.AS), this.state = 220, this.name();
          break;
        case 2:
          this.enterOuterAlt(t, 2), this.state = 221, this.match(m.AS);
          break;
      }
    } catch (r) {
      if (r instanceof _.error.RecognitionException)
        t.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return t;
  }
  participantType() {
    let t = new Ba(this, this._ctx, this.state);
    this.enterRule(t, 18, m.RULE_participantType);
    try {
      this.enterOuterAlt(t, 1), this.state = 224, this.match(m.ANNOTATION);
    } catch (e) {
      if (e instanceof _.error.RecognitionException)
        t.exception = e, this._errHandler.reportError(this, e), this._errHandler.recover(this, e);
      else
        throw e;
    } finally {
      this.exitRule();
    }
    return t;
  }
  name() {
    let t = new Wn(this, this._ctx, this.state);
    this.enterRule(t, 20, m.RULE_name);
    var e = 0;
    try {
      this.enterOuterAlt(t, 1), this.state = 226, e = this._input.LA(1), e === 54 || e === 57 ? (this._errHandler.reportMatch(this), this.consume()) : this._errHandler.recoverInline(this);
    } catch (r) {
      if (r instanceof _.error.RecognitionException)
        t.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return t;
  }
  width() {
    let t = new Ua(this, this._ctx, this.state);
    this.enterRule(t, 22, m.RULE_width);
    try {
      this.enterOuterAlt(t, 1), this.state = 228, this.match(m.INT);
    } catch (e) {
      if (e instanceof _.error.RecognitionException)
        t.exception = e, this._errHandler.reportError(this, e), this._errHandler.recover(this, e);
      else
        throw e;
    } finally {
      this.exitRule();
    }
    return t;
  }
  block() {
    let t = new ui(this, this._ctx, this.state);
    this.enterRule(t, 24, m.RULE_block);
    var e = 0;
    try {
      this.enterOuterAlt(t, 1), this.state = 231, this._errHandler.sync(this), e = this._input.LA(1);
      do
        this.state = 230, this.stat(), this.state = 233, this._errHandler.sync(this), e = this._input.LA(1);
      while (!(e - 34 & -32) && 1 << e - 34 & 217191919);
    } catch (r) {
      if (r instanceof _.error.RecognitionException)
        t.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return t;
  }
  ret() {
    let t = new Ha(this, this._ctx, this.state);
    this.enterRule(t, 26, m.RULE_ret);
    var e = 0;
    try {
      switch (this.state = 247, this._errHandler.sync(this), this._input.LA(1)) {
        case 40:
          this.enterOuterAlt(t, 1), this.state = 235, this.match(m.RETURN), this.state = 237, this._errHandler.sync(this);
          var r = this._interp.adaptivePredict(this._input, 30, this._ctx);
          r === 1 && (this.state = 236, this.expr(0)), this.state = 240, this._errHandler.sync(this), e = this._input.LA(1), e === 27 && (this.state = 239, this.match(m.SCOL));
          break;
        case 51:
          this.enterOuterAlt(t, 2), this.state = 242, this.match(m.ANNOTATION_RET), this.state = 243, this.asyncMessage(), this.state = 245, this._errHandler.sync(this), e = this._input.LA(1), e === 63 && (this.state = 244, this.match(m.EVENT_END));
          break;
        default:
          throw new _.error.NoViableAltException(this);
      }
    } catch (s) {
      if (s instanceof _.error.RecognitionException)
        t.exception = s, this._errHandler.reportError(this, s), this._errHandler.recover(this, s);
      else
        throw s;
    } finally {
      this.exitRule();
    }
    return t;
  }
  divider() {
    let t = new Ga(this, this._ctx, this.state);
    this.enterRule(t, 28, m.RULE_divider);
    try {
      this.enterOuterAlt(t, 1), this.state = 249, this.dividerNote();
    } catch (e) {
      if (e instanceof _.error.RecognitionException)
        t.exception = e, this._errHandler.reportError(this, e), this._errHandler.recover(this, e);
      else
        throw e;
    } finally {
      this.exitRule();
    }
    return t;
  }
  dividerNote() {
    let t = new ja(this, this._ctx, this.state);
    this.enterRule(t, 30, m.RULE_dividerNote);
    try {
      this.enterOuterAlt(t, 1), this.state = 251, this.match(m.DIVIDER);
    } catch (e) {
      if (e instanceof _.error.RecognitionException)
        t.exception = e, this._errHandler.reportError(this, e), this._errHandler.recover(this, e);
      else
        throw e;
    } finally {
      this.exitRule();
    }
    return t;
  }
  stat() {
    let t = new Gs(this, this._ctx, this.state);
    this.enterRule(t, 32, m.RULE_stat);
    var e = 0;
    try {
      this.state = 268, this._errHandler.sync(this);
      var r = this._interp.adaptivePredict(this._input, 35, this._ctx);
      switch (r) {
        case 1:
          this.enterOuterAlt(t, 1), this.state = 253, this.alt();
          break;
        case 2:
          this.enterOuterAlt(t, 2), this.state = 254, this.par();
          break;
        case 3:
          this.enterOuterAlt(t, 3), this.state = 255, this.opt();
          break;
        case 4:
          this.enterOuterAlt(t, 4), this.state = 256, this.loop();
          break;
        case 5:
          this.enterOuterAlt(t, 5), this.state = 257, this.creation();
          break;
        case 6:
          this.enterOuterAlt(t, 6), this.state = 258, this.message();
          break;
        case 7:
          this.enterOuterAlt(t, 7), this.state = 259, this.asyncMessage(), this.state = 261, this._errHandler.sync(this), e = this._input.LA(1), e === 63 && (this.state = 260, this.match(m.EVENT_END));
          break;
        case 8:
          this.enterOuterAlt(t, 8), this.state = 263, this.ret();
          break;
        case 9:
          this.enterOuterAlt(t, 9), this.state = 264, this.divider();
          break;
        case 10:
          this.enterOuterAlt(t, 10), this.state = 265, this.tcf();
          break;
        case 11:
          this.enterOuterAlt(t, 11), this.state = 266, t._OTHER = this.match(m.OTHER), console.log("unknown char: " + (t._OTHER === null ? null : t._OTHER.text));
          break;
      }
    } catch (s) {
      if (s instanceof _.error.RecognitionException)
        t.exception = s, this._errHandler.reportError(this, s), this._errHandler.recover(this, s);
      else
        throw s;
    } finally {
      this.exitRule();
    }
    return t;
  }
  par() {
    let t = new Va(this, this._ctx, this.state);
    this.enterRule(t, 34, m.RULE_par);
    try {
      this.state = 273, this._errHandler.sync(this);
      var e = this._interp.adaptivePredict(this._input, 36, this._ctx);
      switch (e) {
        case 1:
          this.enterOuterAlt(t, 1), this.state = 270, this.match(m.PAR), this.state = 271, this.braceBlock();
          break;
        case 2:
          this.enterOuterAlt(t, 2), this.state = 272, this.match(m.PAR);
          break;
      }
    } catch (r) {
      if (r instanceof _.error.RecognitionException)
        t.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return t;
  }
  opt() {
    let t = new za(this, this._ctx, this.state);
    this.enterRule(t, 36, m.RULE_opt);
    try {
      this.state = 278, this._errHandler.sync(this);
      var e = this._interp.adaptivePredict(this._input, 37, this._ctx);
      switch (e) {
        case 1:
          this.enterOuterAlt(t, 1), this.state = 275, this.match(m.OPT), this.state = 276, this.braceBlock();
          break;
        case 2:
          this.enterOuterAlt(t, 2), this.state = 277, this.match(m.OPT);
          break;
      }
    } catch (r) {
      if (r instanceof _.error.RecognitionException)
        t.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return t;
  }
  creation() {
    let t = new hi(this, this._ctx, this.state);
    this.enterRule(t, 38, m.RULE_creation);
    try {
      this.enterOuterAlt(t, 1), this.state = 280, this.creationBody(), this.state = 283, this._errHandler.sync(this);
      var e = this._interp.adaptivePredict(this._input, 38, this._ctx);
      e === 1 ? (this.state = 281, this.match(m.SCOL)) : e === 2 && (this.state = 282, this.braceBlock());
    } catch (r) {
      if (r instanceof _.error.RecognitionException)
        t.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return t;
  }
  creationBody() {
    let t = new Za(this, this._ctx, this.state);
    this.enterRule(t, 40, m.RULE_creationBody);
    var e = 0;
    try {
      this.state = 301, this._errHandler.sync(this);
      var r = this._interp.adaptivePredict(this._input, 43, this._ctx);
      switch (r) {
        case 1:
          this.enterOuterAlt(t, 1), this.state = 286, this._errHandler.sync(this), e = this._input.LA(1), !(e - 34 & -32) && 1 << e - 34 & 15728647 && (this.state = 285, this.assignment()), this.state = 288, this.match(m.NEW), this.state = 289, this.construct(), this.state = 295, this._errHandler.sync(this);
          var r = this._interp.adaptivePredict(this._input, 41, this._ctx);
          r === 1 && (this.state = 290, this.match(m.OPAR), this.state = 292, this._errHandler.sync(this), e = this._input.LA(1), (!(e & -32) && 1 << e & 1142947840 || !(e - 34 & -32) && 1 << e - 34 & 15728775) && (this.state = 291, this.parameters()), this.state = 294, this.match(m.CPAR));
          break;
        case 2:
          this.enterOuterAlt(t, 2), this.state = 298, this._errHandler.sync(this), e = this._input.LA(1), !(e - 34 & -32) && 1 << e - 34 & 15728647 && (this.state = 297, this.assignment()), this.state = 300, this.match(m.NEW);
          break;
      }
    } catch (s) {
      if (s instanceof _.error.RecognitionException)
        t.exception = s, this._errHandler.reportError(this, s), this._errHandler.recover(this, s);
      else
        throw s;
    } finally {
      this.exitRule();
    }
    return t;
  }
  message() {
    let t = new Wa(this, this._ctx, this.state);
    this.enterRule(t, 42, m.RULE_message);
    try {
      switch (this.enterOuterAlt(t, 1), this.state = 303, this.messageBody(), this.state = 306, this._errHandler.sync(this), this._input.LA(1)) {
        case 27:
          this.state = 304, this.match(m.SCOL);
          break;
        case 32:
          this.state = 305, this.braceBlock();
          break;
        case -1:
        case 33:
        case 34:
        case 35:
        case 36:
        case 37:
        case 39:
        case 40:
        case 41:
        case 42:
        case 44:
        case 46:
        case 51:
        case 54:
        case 55:
        case 56:
        case 57:
        case 60:
        case 61:
          break;
        default:
          break;
      }
    } catch (e) {
      if (e instanceof _.error.RecognitionException)
        t.exception = e, this._errHandler.reportError(this, e), this._errHandler.recover(this, e);
      else
        throw e;
    } finally {
      this.exitRule();
    }
    return t;
  }
  messageBody() {
    let t = new qa(this, this._ctx, this.state);
    this.enterRule(t, 44, m.RULE_messageBody);
    try {
      this.state = 331, this._errHandler.sync(this);
      var e = this._interp.adaptivePredict(this._input, 49, this._ctx);
      switch (e) {
        case 1:
          this.enterOuterAlt(t, 1), this.state = 309, this._errHandler.sync(this);
          var e = this._interp.adaptivePredict(this._input, 45, this._ctx);
          e === 1 && (this.state = 308, this.assignment()), this.state = 319, this._errHandler.sync(this);
          var e = this._interp.adaptivePredict(this._input, 47, this._ctx);
          if (e === 1) {
            this.state = 314, this._errHandler.sync(this);
            var e = this._interp.adaptivePredict(this._input, 46, this._ctx);
            e === 1 && (this.state = 311, this.from(), this.state = 312, this.match(m.ARROW)), this.state = 316, this.to(), this.state = 317, this.match(m.DOT);
          }
          this.state = 321, this.func();
          break;
        case 2:
          this.enterOuterAlt(t, 2), this.state = 322, this.assignment();
          break;
        case 3:
          this.enterOuterAlt(t, 3), this.state = 326, this._errHandler.sync(this);
          var e = this._interp.adaptivePredict(this._input, 48, this._ctx);
          e === 1 && (this.state = 323, this.from(), this.state = 324, this.match(m.ARROW)), this.state = 328, this.to(), this.state = 329, this.match(m.DOT);
          break;
      }
    } catch (r) {
      if (r instanceof _.error.RecognitionException)
        t.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return t;
  }
  func() {
    let t = new fi(this, this._ctx, this.state);
    this.enterRule(t, 46, m.RULE_func);
    try {
      this.enterOuterAlt(t, 1), this.state = 333, this.signature(), this.state = 338, this._errHandler.sync(this);
      for (var e = this._interp.adaptivePredict(this._input, 50, this._ctx); e != 2 && e != _.atn.ATN.INVALID_ALT_NUMBER; )
        e === 1 && (this.state = 334, this.match(m.DOT), this.state = 335, this.signature()), this.state = 340, this._errHandler.sync(this), e = this._interp.adaptivePredict(this._input, 50, this._ctx);
    } catch (r) {
      if (r instanceof _.error.RecognitionException)
        t.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return t;
  }
  from() {
    let t = new di(this, this._ctx, this.state);
    this.enterRule(t, 48, m.RULE_from);
    var e = 0;
    try {
      this.enterOuterAlt(t, 1), this.state = 341, e = this._input.LA(1), e === 54 || e === 57 ? (this._errHandler.reportMatch(this), this.consume()) : this._errHandler.recoverInline(this);
    } catch (r) {
      if (r instanceof _.error.RecognitionException)
        t.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return t;
  }
  to() {
    let t = new Fr(this, this._ctx, this.state);
    this.enterRule(t, 50, m.RULE_to);
    var e = 0;
    try {
      this.enterOuterAlt(t, 1), this.state = 343, e = this._input.LA(1), e === 54 || e === 57 ? (this._errHandler.reportMatch(this), this.consume()) : this._errHandler.recoverInline(this);
    } catch (r) {
      if (r instanceof _.error.RecognitionException)
        t.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return t;
  }
  signature() {
    let t = new js(this, this._ctx, this.state);
    this.enterRule(t, 52, m.RULE_signature);
    try {
      this.enterOuterAlt(t, 1), this.state = 345, this.methodName(), this.state = 347, this._errHandler.sync(this);
      var e = this._interp.adaptivePredict(this._input, 51, this._ctx);
      e === 1 && (this.state = 346, this.invocation());
    } catch (r) {
      if (r instanceof _.error.RecognitionException)
        t.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return t;
  }
  invocation() {
    let t = new pi(this, this._ctx, this.state);
    this.enterRule(t, 54, m.RULE_invocation);
    var e = 0;
    try {
      this.enterOuterAlt(t, 1), this.state = 349, this.match(m.OPAR), this.state = 351, this._errHandler.sync(this), e = this._input.LA(1), (!(e & -32) && 1 << e & 1142947840 || !(e - 34 & -32) && 1 << e - 34 & 15728775) && (this.state = 350, this.parameters()), this.state = 353, this.match(m.CPAR);
    } catch (r) {
      if (r instanceof _.error.RecognitionException)
        t.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return t;
  }
  assignment() {
    let t = new Br(this, this._ctx, this.state);
    this.enterRule(t, 56, m.RULE_assignment);
    try {
      this.enterOuterAlt(t, 1), this.state = 356, this._errHandler.sync(this);
      var e = this._interp.adaptivePredict(this._input, 53, this._ctx);
      e === 1 && (this.state = 355, this.type()), this.state = 358, this.assignee(), this.state = 359, this.match(m.ASSIGN);
    } catch (r) {
      if (r instanceof _.error.RecognitionException)
        t.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return t;
  }
  asyncMessage() {
    let t = new gi(this, this._ctx, this.state);
    this.enterRule(t, 58, m.RULE_asyncMessage);
    var e = 0;
    try {
      this.state = 375, this._errHandler.sync(this);
      var r = this._interp.adaptivePredict(this._input, 56, this._ctx);
      switch (r) {
        case 1:
          this.enterOuterAlt(t, 1), this.state = 364, this._errHandler.sync(this);
          var r = this._interp.adaptivePredict(this._input, 54, this._ctx);
          r === 1 && (this.state = 361, this.from(), this.state = 362, this.match(m.ARROW)), this.state = 366, this.to(), this.state = 367, this.match(m.COL), this.state = 368, this.content();
          break;
        case 2:
          this.enterOuterAlt(t, 2), this.state = 370, this.from(), this.state = 371, e = this._input.LA(1), e === 10 || e === 21 ? (this._errHandler.reportMatch(this), this.consume()) : this._errHandler.recoverInline(this), this.state = 373, this._errHandler.sync(this);
          var r = this._interp.adaptivePredict(this._input, 55, this._ctx);
          r === 1 && (this.state = 372, this.to());
          break;
      }
    } catch (s) {
      if (s instanceof _.error.RecognitionException)
        t.exception = s, this._errHandler.reportError(this, s), this._errHandler.recover(this, s);
      else
        throw s;
    } finally {
      this.exitRule();
    }
    return t;
  }
  content() {
    let t = new Ka(this, this._ctx, this.state);
    this.enterRule(t, 60, m.RULE_content);
    try {
      this.enterOuterAlt(t, 1), this.state = 377, this.match(m.EVENT_PAYLOAD_LXR);
    } catch (e) {
      if (e instanceof _.error.RecognitionException)
        t.exception = e, this._errHandler.reportError(this, e), this._errHandler.recover(this, e);
      else
        throw e;
    } finally {
      this.exitRule();
    }
    return t;
  }
  construct() {
    let t = new Ya(this, this._ctx, this.state);
    this.enterRule(t, 62, m.RULE_construct);
    var e = 0;
    try {
      this.enterOuterAlt(t, 1), this.state = 379, e = this._input.LA(1), e === 54 || e === 57 ? (this._errHandler.reportMatch(this), this.consume()) : this._errHandler.recoverInline(this);
    } catch (r) {
      if (r instanceof _.error.RecognitionException)
        t.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return t;
  }
  type() {
    let t = new xi(this, this._ctx, this.state);
    this.enterRule(t, 64, m.RULE_type);
    var e = 0;
    try {
      this.enterOuterAlt(t, 1), this.state = 381, e = this._input.LA(1), e === 54 || e === 57 ? (this._errHandler.reportMatch(this), this.consume()) : this._errHandler.recoverInline(this);
    } catch (r) {
      if (r instanceof _.error.RecognitionException)
        t.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return t;
  }
  assignee() {
    let t = new Xa(this, this._ctx, this.state);
    this.enterRule(t, 66, m.RULE_assignee);
    var e = 0;
    try {
      this.state = 393, this._errHandler.sync(this);
      var r = this._interp.adaptivePredict(this._input, 58, this._ctx);
      switch (r) {
        case 1:
          this.enterOuterAlt(t, 1), this.state = 383, this.atom();
          break;
        case 2:
          for (this.enterOuterAlt(t, 2), this.state = 384, this.match(m.ID), this.state = 389, this._errHandler.sync(this), e = this._input.LA(1); e === 28; )
            this.state = 385, this.match(m.COMMA), this.state = 386, this.match(m.ID), this.state = 391, this._errHandler.sync(this), e = this._input.LA(1);
          break;
        case 3:
          this.enterOuterAlt(t, 3), this.state = 392, this.match(m.STRING);
          break;
      }
    } catch (s) {
      if (s instanceof _.error.RecognitionException)
        t.exception = s, this._errHandler.reportError(this, s), this._errHandler.recover(this, s);
      else
        throw s;
    } finally {
      this.exitRule();
    }
    return t;
  }
  methodName() {
    let t = new Qa(this, this._ctx, this.state);
    this.enterRule(t, 68, m.RULE_methodName);
    var e = 0;
    try {
      this.enterOuterAlt(t, 1), this.state = 395, e = this._input.LA(1), e === 54 || e === 57 ? (this._errHandler.reportMatch(this), this.consume()) : this._errHandler.recoverInline(this);
    } catch (r) {
      if (r instanceof _.error.RecognitionException)
        t.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return t;
  }
  parameters() {
    let t = new mi(this, this._ctx, this.state);
    this.enterRule(t, 70, m.RULE_parameters);
    var e = 0;
    try {
      this.enterOuterAlt(t, 1), this.state = 397, this.parameter(), this.state = 402, this._errHandler.sync(this);
      for (var r = this._interp.adaptivePredict(this._input, 59, this._ctx); r != 2 && r != _.atn.ATN.INVALID_ALT_NUMBER; )
        r === 1 && (this.state = 398, this.match(m.COMMA), this.state = 399, this.parameter()), this.state = 404, this._errHandler.sync(this), r = this._interp.adaptivePredict(this._input, 59, this._ctx);
      this.state = 406, this._errHandler.sync(this), e = this._input.LA(1), e === 28 && (this.state = 405, this.match(m.COMMA));
    } catch (s) {
      if (s instanceof _.error.RecognitionException)
        t.exception = s, this._errHandler.reportError(this, s), this._errHandler.recover(this, s);
      else
        throw s;
    } finally {
      this.exitRule();
    }
    return t;
  }
  parameter() {
    let t = new Vs(this, this._ctx, this.state);
    this.enterRule(t, 72, m.RULE_parameter);
    try {
      this.state = 410, this._errHandler.sync(this);
      var e = this._interp.adaptivePredict(this._input, 61, this._ctx);
      switch (e) {
        case 1:
          this.enterOuterAlt(t, 1), this.state = 408, this.declaration();
          break;
        case 2:
          this.enterOuterAlt(t, 2), this.state = 409, this.expr(0);
          break;
      }
    } catch (r) {
      if (r instanceof _.error.RecognitionException)
        t.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return t;
  }
  declaration() {
    let t = new Ja(this, this._ctx, this.state);
    this.enterRule(t, 74, m.RULE_declaration);
    try {
      this.enterOuterAlt(t, 1), this.state = 412, this.type(), this.state = 413, this.match(m.ID);
    } catch (e) {
      if (e instanceof _.error.RecognitionException)
        t.exception = e, this._errHandler.reportError(this, e), this._errHandler.recover(this, e);
      else
        throw e;
    } finally {
      this.exitRule();
    }
    return t;
  }
  tcf() {
    let t = new t1(this, this._ctx, this.state);
    this.enterRule(t, 76, m.RULE_tcf);
    var e = 0;
    try {
      for (this.enterOuterAlt(t, 1), this.state = 415, this.tryBlock(), this.state = 419, this._errHandler.sync(this), e = this._input.LA(1); e === 47; )
        this.state = 416, this.catchBlock(), this.state = 421, this._errHandler.sync(this), e = this._input.LA(1);
      this.state = 423, this._errHandler.sync(this), e = this._input.LA(1), e === 48 && (this.state = 422, this.finallyBlock());
    } catch (r) {
      if (r instanceof _.error.RecognitionException)
        t.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return t;
  }
  tryBlock() {
    let t = new e1(this, this._ctx, this.state);
    this.enterRule(t, 78, m.RULE_tryBlock);
    try {
      this.enterOuterAlt(t, 1), this.state = 425, this.match(m.TRY), this.state = 426, this.braceBlock();
    } catch (e) {
      if (e instanceof _.error.RecognitionException)
        t.exception = e, this._errHandler.reportError(this, e), this._errHandler.recover(this, e);
      else
        throw e;
    } finally {
      this.exitRule();
    }
    return t;
  }
  catchBlock() {
    let t = new zs(this, this._ctx, this.state);
    this.enterRule(t, 80, m.RULE_catchBlock);
    var e = 0;
    try {
      this.enterOuterAlt(t, 1), this.state = 428, this.match(m.CATCH), this.state = 430, this._errHandler.sync(this), e = this._input.LA(1), e === 30 && (this.state = 429, this.invocation()), this.state = 432, this.braceBlock();
    } catch (r) {
      if (r instanceof _.error.RecognitionException)
        t.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return t;
  }
  finallyBlock() {
    let t = new n1(this, this._ctx, this.state);
    this.enterRule(t, 82, m.RULE_finallyBlock);
    try {
      this.enterOuterAlt(t, 1), this.state = 434, this.match(m.FINALLY), this.state = 435, this.braceBlock();
    } catch (e) {
      if (e instanceof _.error.RecognitionException)
        t.exception = e, this._errHandler.reportError(this, e), this._errHandler.recover(this, e);
      else
        throw e;
    } finally {
      this.exitRule();
    }
    return t;
  }
  alt() {
    let t = new r1(this, this._ctx, this.state);
    this.enterRule(t, 84, m.RULE_alt);
    var e = 0;
    try {
      this.enterOuterAlt(t, 1), this.state = 437, this.ifBlock(), this.state = 441, this._errHandler.sync(this);
      for (var r = this._interp.adaptivePredict(this._input, 65, this._ctx); r != 2 && r != _.atn.ATN.INVALID_ALT_NUMBER; )
        r === 1 && (this.state = 438, this.elseIfBlock()), this.state = 443, this._errHandler.sync(this), r = this._interp.adaptivePredict(this._input, 65, this._ctx);
      this.state = 445, this._errHandler.sync(this), e = this._input.LA(1), e === 38 && (this.state = 444, this.elseBlock());
    } catch (s) {
      if (s instanceof _.error.RecognitionException)
        t.exception = s, this._errHandler.reportError(this, s), this._errHandler.recover(this, s);
      else
        throw s;
    } finally {
      this.exitRule();
    }
    return t;
  }
  ifBlock() {
    let t = new s1(this, this._ctx, this.state);
    this.enterRule(t, 86, m.RULE_ifBlock);
    try {
      this.enterOuterAlt(t, 1), this.state = 447, this.match(m.IF), this.state = 448, this.parExpr(), this.state = 449, this.braceBlock();
    } catch (e) {
      if (e instanceof _.error.RecognitionException)
        t.exception = e, this._errHandler.reportError(this, e), this._errHandler.recover(this, e);
      else
        throw e;
    } finally {
      this.exitRule();
    }
    return t;
  }
  elseIfBlock() {
    let t = new Zs(this, this._ctx, this.state);
    this.enterRule(t, 88, m.RULE_elseIfBlock);
    try {
      this.enterOuterAlt(t, 1), this.state = 451, this.match(m.ELSE), this.state = 452, this.match(m.IF), this.state = 453, this.parExpr(), this.state = 454, this.braceBlock();
    } catch (e) {
      if (e instanceof _.error.RecognitionException)
        t.exception = e, this._errHandler.reportError(this, e), this._errHandler.recover(this, e);
      else
        throw e;
    } finally {
      this.exitRule();
    }
    return t;
  }
  elseBlock() {
    let t = new i1(this, this._ctx, this.state);
    this.enterRule(t, 90, m.RULE_elseBlock);
    try {
      this.enterOuterAlt(t, 1), this.state = 456, this.match(m.ELSE), this.state = 457, this.braceBlock();
    } catch (e) {
      if (e instanceof _.error.RecognitionException)
        t.exception = e, this._errHandler.reportError(this, e), this._errHandler.recover(this, e);
      else
        throw e;
    } finally {
      this.exitRule();
    }
    return t;
  }
  braceBlock() {
    let t = new ee(this, this._ctx, this.state);
    this.enterRule(t, 92, m.RULE_braceBlock);
    var e = 0;
    try {
      this.enterOuterAlt(t, 1), this.state = 459, this.match(m.OBRACE), this.state = 461, this._errHandler.sync(this), e = this._input.LA(1), !(e - 34 & -32) && 1 << e - 34 & 217191919 && (this.state = 460, this.block()), this.state = 463, this.match(m.CBRACE);
    } catch (r) {
      if (r instanceof _.error.RecognitionException)
        t.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return t;
  }
  loop() {
    let t = new o1(this, this._ctx, this.state);
    this.enterRule(t, 94, m.RULE_loop);
    try {
      this.state = 472, this._errHandler.sync(this);
      var e = this._interp.adaptivePredict(this._input, 68, this._ctx);
      switch (e) {
        case 1:
          this.enterOuterAlt(t, 1), this.state = 465, this.match(m.WHILE), this.state = 466, this.parExpr(), this.state = 467, this.braceBlock();
          break;
        case 2:
          this.enterOuterAlt(t, 2), this.state = 469, this.match(m.WHILE), this.state = 470, this.parExpr();
          break;
        case 3:
          this.enterOuterAlt(t, 3), this.state = 471, this.match(m.WHILE);
          break;
      }
    } catch (r) {
      if (r instanceof _.error.RecognitionException)
        t.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return t;
  }
  expr(t) {
    t === void 0 && (t = 0);
    const e = this._ctx, r = this.state;
    let s = new V(this, this._ctx, r), i = s;
    const o = 96;
    this.enterRecursionRule(s, 96, m.RULE_expr, t);
    var a = 0;
    try {
      this.enterOuterAlt(s, 1), this.state = 494, this._errHandler.sync(this);
      var l = this._interp.adaptivePredict(this._input, 70, this._ctx);
      switch (l) {
        case 1:
          s = new sh(this, s), this._ctx = s, i = s, this.state = 475, this.atom();
          break;
        case 2:
          s = new uh(this, s), this._ctx = s, i = s, this.state = 476, this.match(m.MINUS), this.state = 477, this.expr(13);
          break;
        case 3:
          s = new ch(this, s), this._ctx = s, i = s, this.state = 478, this.match(m.NOT), this.state = 479, this.expr(12);
          break;
        case 4:
          s = new rh(this, s), this._ctx = s, i = s, this.state = 483, this._errHandler.sync(this);
          var l = this._interp.adaptivePredict(this._input, 69, this._ctx);
          l === 1 && (this.state = 480, this.to(), this.state = 481, this.match(m.DOT)), this.state = 485, this.func();
          break;
        case 5:
          s = new hh(this, s), this._ctx = s, i = s, this.state = 486, this.creation();
          break;
        case 6:
          s = new fh(this, s), this._ctx = s, i = s, this.state = 487, this.match(m.OPAR), this.state = 488, this.expr(0), this.state = 489, this.match(m.CPAR);
          break;
        case 7:
          s = new nh(this, s), this._ctx = s, i = s, this.state = 491, this.assignment(), this.state = 492, this.expr(1);
          break;
      }
      this._ctx.stop = this._input.LT(-1), this.state = 519, this._errHandler.sync(this);
      for (var c = this._interp.adaptivePredict(this._input, 72, this._ctx); c != 2 && c != _.atn.ATN.INVALID_ALT_NUMBER; ) {
        if (c === 1) {
          this._parseListeners !== null && this.triggerExitRuleEvent(), i = s, this.state = 517, this._errHandler.sync(this);
          var l = this._interp.adaptivePredict(this._input, 71, this._ctx);
          switch (l) {
            case 1:
              if (s = new dh(
                this,
                new V(this, e, r)
              ), this.pushNewRecursionContext(s, o, m.RULE_expr), this.state = 496, !this.precpred(this._ctx, 11))
                throw new _.error.FailedPredicateException(
                  this,
                  "this.precpred(this._ctx, 11)"
                );
              this.state = 497, s.op = this._input.LT(1), a = this._input.LA(1), !(a & -32) && 1 << a & 29360128 ? (this._errHandler.reportMatch(this), this.consume()) : s.op = this._errHandler.recoverInline(this), this.state = 498, this.expr(12);
              break;
            case 2:
              if (s = new oh(
                this,
                new V(this, e, r)
              ), this.pushNewRecursionContext(s, o, m.RULE_expr), this.state = 499, !this.precpred(this._ctx, 10))
                throw new _.error.FailedPredicateException(
                  this,
                  "this.precpred(this._ctx, 10)"
                );
              this.state = 500, s.op = this._input.LT(1), a = this._input.LA(1), a === 20 || a === 21 ? (this._errHandler.reportMatch(this), this.consume()) : s.op = this._errHandler.recoverInline(this), this.state = 501, this.expr(11);
              break;
            case 3:
              if (s = new ah(
                this,
                new V(this, e, r)
              ), this.pushNewRecursionContext(s, o, m.RULE_expr), this.state = 502, !this.precpred(this._ctx, 9))
                throw new _.error.FailedPredicateException(
                  this,
                  "this.precpred(this._ctx, 9)"
                );
              this.state = 503, s.op = this._input.LT(1), a = this._input.LA(1), !(a & -32) && 1 << a & 983040 ? (this._errHandler.reportMatch(this), this.consume()) : s.op = this._errHandler.recoverInline(this), this.state = 504, this.expr(10);
              break;
            case 4:
              if (s = new ph(
                this,
                new V(this, e, r)
              ), this.pushNewRecursionContext(s, o, m.RULE_expr), this.state = 505, !this.precpred(this._ctx, 8))
                throw new _.error.FailedPredicateException(
                  this,
                  "this.precpred(this._ctx, 8)"
                );
              this.state = 506, s.op = this._input.LT(1), a = this._input.LA(1), a === 14 || a === 15 ? (this._errHandler.reportMatch(this), this.consume()) : s.op = this._errHandler.recoverInline(this), this.state = 507, this.expr(9);
              break;
            case 5:
              if (s = new gh(this, new V(this, e, r)), this.pushNewRecursionContext(s, o, m.RULE_expr), this.state = 508, !this.precpred(this._ctx, 7))
                throw new _.error.FailedPredicateException(
                  this,
                  "this.precpred(this._ctx, 7)"
                );
              this.state = 509, this.match(m.AND), this.state = 510, this.expr(8);
              break;
            case 6:
              if (s = new ih(this, new V(this, e, r)), this.pushNewRecursionContext(s, o, m.RULE_expr), this.state = 511, !this.precpred(this._ctx, 6))
                throw new _.error.FailedPredicateException(
                  this,
                  "this.precpred(this._ctx, 6)"
                );
              this.state = 512, this.match(m.OR), this.state = 513, this.expr(7);
              break;
            case 7:
              if (s = new lh(this, new V(this, e, r)), this.pushNewRecursionContext(s, o, m.RULE_expr), this.state = 514, !this.precpred(this._ctx, 5))
                throw new _.error.FailedPredicateException(
                  this,
                  "this.precpred(this._ctx, 5)"
                );
              this.state = 515, this.match(m.PLUS), this.state = 516, this.expr(6);
              break;
          }
        }
        this.state = 521, this._errHandler.sync(this), c = this._interp.adaptivePredict(this._input, 72, this._ctx);
      }
    } catch (u) {
      if (u instanceof _.error.RecognitionException)
        s.exception = u, this._errHandler.reportError(this, u), this._errHandler.recover(this, u);
      else
        throw u;
    } finally {
      this.unrollRecursionContexts(e);
    }
    return s;
  }
  atom() {
    let t = new we(this, this._ctx, this.state);
    this.enterRule(t, 98, m.RULE_atom);
    var e = 0;
    try {
      switch (this.state = 527, this._errHandler.sync(this), this._input.LA(1)) {
        case 55:
        case 56:
          t = new vh(this, t), this.enterOuterAlt(t, 1), this.state = 522, e = this._input.LA(1), e === 55 || e === 56 ? (this._errHandler.reportMatch(this), this.consume()) : this._errHandler.recoverInline(this);
          break;
        case 34:
        case 35:
          t = new xh(this, t), this.enterOuterAlt(t, 2), this.state = 523, e = this._input.LA(1), e === 34 || e === 35 ? (this._errHandler.reportMatch(this), this.consume()) : this._errHandler.recoverInline(this);
          break;
        case 54:
          t = new mh(this, t), this.enterOuterAlt(t, 3), this.state = 524, this.match(m.ID);
          break;
        case 57:
          t = new _h(this, t), this.enterOuterAlt(t, 4), this.state = 525, this.match(m.STRING);
          break;
        case 36:
          t = new Lh(this, t), this.enterOuterAlt(t, 5), this.state = 526, this.match(m.NIL);
          break;
        default:
          throw new _.error.NoViableAltException(this);
      }
    } catch (r) {
      if (r instanceof _.error.RecognitionException)
        t.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return t;
  }
  parExpr() {
    let t = new Ur(this, this._ctx, this.state);
    this.enterRule(t, 100, m.RULE_parExpr);
    try {
      this.state = 538, this._errHandler.sync(this);
      var e = this._interp.adaptivePredict(this._input, 74, this._ctx);
      switch (e) {
        case 1:
          this.enterOuterAlt(t, 1), this.state = 529, this.match(m.OPAR), this.state = 530, this.condition(), this.state = 531, this.match(m.CPAR);
          break;
        case 2:
          this.enterOuterAlt(t, 2), this.state = 533, this.match(m.OPAR), this.state = 534, this.condition();
          break;
        case 3:
          this.enterOuterAlt(t, 3), this.state = 535, this.match(m.OPAR), this.state = 536, this.match(m.CPAR);
          break;
        case 4:
          this.enterOuterAlt(t, 4), this.state = 537, this.match(m.OPAR);
          break;
      }
    } catch (r) {
      if (r instanceof _.error.RecognitionException)
        t.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return t;
  }
  condition() {
    let t = new a1(this, this._ctx, this.state);
    this.enterRule(t, 102, m.RULE_condition);
    try {
      this.state = 543, this._errHandler.sync(this);
      var e = this._interp.adaptivePredict(this._input, 75, this._ctx);
      switch (e) {
        case 1:
          this.enterOuterAlt(t, 1), this.state = 540, this.atom();
          break;
        case 2:
          this.enterOuterAlt(t, 2), this.state = 541, this.expr(0);
          break;
        case 3:
          this.enterOuterAlt(t, 3), this.state = 542, this.inExpr();
          break;
      }
    } catch (r) {
      if (r instanceof _.error.RecognitionException)
        t.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return t;
  }
  inExpr() {
    let t = new l1(this, this._ctx, this.state);
    this.enterRule(t, 104, m.RULE_inExpr);
    try {
      this.enterOuterAlt(t, 1), this.state = 545, this.match(m.ID), this.state = 546, this.match(m.IN), this.state = 547, this.match(m.ID);
    } catch (e) {
      if (e instanceof _.error.RecognitionException)
        t.exception = e, this._errHandler.reportError(this, e), this._errHandler.recover(this, e);
      else
        throw e;
    } finally {
      this.exitRule();
    }
    return t;
  }
};
let h = m;
tt(h, "grammarFileName", "java-escape"), tt(h, "literalNames", [
  null,
  null,
  "'const'",
  "'readonly'",
  "'static'",
  "'await'",
  "'title'",
  "':'",
  "'<<'",
  "'>>'",
  "'->'",
  null,
  "'||'",
  "'&&'",
  "'=='",
  "'!='",
  "'>'",
  "'<'",
  "'>='",
  "'<='",
  "'+'",
  "'-'",
  "'*'",
  "'/'",
  "'%'",
  "'^'",
  "'!'",
  "';'",
  "','",
  "'='",
  "'('",
  "')'",
  "'{'",
  "'}'",
  "'true'",
  "'false'",
  null,
  "'if'",
  "'else'",
  null,
  "'return'",
  "'new'",
  "'par'",
  "'group'",
  "'opt'",
  "'as'",
  "'try'",
  "'catch'",
  "'finally'",
  "'in'",
  null,
  null,
  null,
  "'.'"
]), tt(h, "symbolicNames", [
  null,
  "WS",
  "CONSTANT",
  "READONLY",
  "STATIC",
  "AWAIT",
  "TITLE",
  "COL",
  "SOPEN",
  "SCLOSE",
  "ARROW",
  "COLOR",
  "OR",
  "AND",
  "EQ",
  "NEQ",
  "GT",
  "LT",
  "GTEQ",
  "LTEQ",
  "PLUS",
  "MINUS",
  "MULT",
  "DIV",
  "MOD",
  "POW",
  "NOT",
  "SCOL",
  "COMMA",
  "ASSIGN",
  "OPAR",
  "CPAR",
  "OBRACE",
  "CBRACE",
  "TRUE",
  "FALSE",
  "NIL",
  "IF",
  "ELSE",
  "WHILE",
  "RETURN",
  "NEW",
  "PAR",
  "GROUP",
  "OPT",
  "AS",
  "TRY",
  "CATCH",
  "FINALLY",
  "IN",
  "STARTER_LXR",
  "ANNOTATION_RET",
  "ANNOTATION",
  "DOT",
  "ID",
  "INT",
  "FLOAT",
  "STRING",
  "CR",
  "COMMENT",
  "OTHER",
  "DIVIDER",
  "EVENT_PAYLOAD_LXR",
  "EVENT_END",
  "TITLE_CONTENT",
  "TITLE_END"
]), tt(h, "ruleNames", [
  "prog",
  "title",
  "head",
  "group",
  "starterExp",
  "starter",
  "participant",
  "stereotype",
  "label",
  "participantType",
  "name",
  "width",
  "block",
  "ret",
  "divider",
  "dividerNote",
  "stat",
  "par",
  "opt",
  "creation",
  "creationBody",
  "message",
  "messageBody",
  "func",
  "from",
  "to",
  "signature",
  "invocation",
  "assignment",
  "asyncMessage",
  "content",
  "construct",
  "type",
  "assignee",
  "methodName",
  "parameters",
  "parameter",
  "declaration",
  "tcf",
  "tryBlock",
  "catchBlock",
  "finallyBlock",
  "alt",
  "ifBlock",
  "elseIfBlock",
  "elseBlock",
  "braceBlock",
  "loop",
  "expr",
  "atom",
  "parExpr",
  "condition",
  "inExpr"
]);
h.EOF = _.Token.EOF;
h.WS = 1;
h.CONSTANT = 2;
h.READONLY = 3;
h.STATIC = 4;
h.AWAIT = 5;
h.TITLE = 6;
h.COL = 7;
h.SOPEN = 8;
h.SCLOSE = 9;
h.ARROW = 10;
h.COLOR = 11;
h.OR = 12;
h.AND = 13;
h.EQ = 14;
h.NEQ = 15;
h.GT = 16;
h.LT = 17;
h.GTEQ = 18;
h.LTEQ = 19;
h.PLUS = 20;
h.MINUS = 21;
h.MULT = 22;
h.DIV = 23;
h.MOD = 24;
h.POW = 25;
h.NOT = 26;
h.SCOL = 27;
h.COMMA = 28;
h.ASSIGN = 29;
h.OPAR = 30;
h.CPAR = 31;
h.OBRACE = 32;
h.CBRACE = 33;
h.TRUE = 34;
h.FALSE = 35;
h.NIL = 36;
h.IF = 37;
h.ELSE = 38;
h.WHILE = 39;
h.RETURN = 40;
h.NEW = 41;
h.PAR = 42;
h.GROUP = 43;
h.OPT = 44;
h.AS = 45;
h.TRY = 46;
h.CATCH = 47;
h.FINALLY = 48;
h.IN = 49;
h.STARTER_LXR = 50;
h.ANNOTATION_RET = 51;
h.ANNOTATION = 52;
h.DOT = 53;
h.ID = 54;
h.INT = 55;
h.FLOAT = 56;
h.STRING = 57;
h.CR = 58;
h.COMMENT = 59;
h.OTHER = 60;
h.DIVIDER = 61;
h.EVENT_PAYLOAD_LXR = 62;
h.EVENT_END = 63;
h.TITLE_CONTENT = 64;
h.TITLE_END = 65;
h.RULE_prog = 0;
h.RULE_title = 1;
h.RULE_head = 2;
h.RULE_group = 3;
h.RULE_starterExp = 4;
h.RULE_starter = 5;
h.RULE_participant = 6;
h.RULE_stereotype = 7;
h.RULE_label = 8;
h.RULE_participantType = 9;
h.RULE_name = 10;
h.RULE_width = 11;
h.RULE_block = 12;
h.RULE_ret = 13;
h.RULE_divider = 14;
h.RULE_dividerNote = 15;
h.RULE_stat = 16;
h.RULE_par = 17;
h.RULE_opt = 18;
h.RULE_creation = 19;
h.RULE_creationBody = 20;
h.RULE_message = 21;
h.RULE_messageBody = 22;
h.RULE_func = 23;
h.RULE_from = 24;
h.RULE_to = 25;
h.RULE_signature = 26;
h.RULE_invocation = 27;
h.RULE_assignment = 28;
h.RULE_asyncMessage = 29;
h.RULE_content = 30;
h.RULE_construct = 31;
h.RULE_type = 32;
h.RULE_assignee = 33;
h.RULE_methodName = 34;
h.RULE_parameters = 35;
h.RULE_parameter = 36;
h.RULE_declaration = 37;
h.RULE_tcf = 38;
h.RULE_tryBlock = 39;
h.RULE_catchBlock = 40;
h.RULE_finallyBlock = 41;
h.RULE_alt = 42;
h.RULE_ifBlock = 43;
h.RULE_elseIfBlock = 44;
h.RULE_elseBlock = 45;
h.RULE_braceBlock = 46;
h.RULE_loop = 47;
h.RULE_expr = 48;
h.RULE_atom = 49;
h.RULE_parExpr = 50;
h.RULE_condition = 51;
h.RULE_inExpr = 52;
let eh = class extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_prog;
  }
  EOF() {
    return this.getToken(h.EOF, 0);
  }
  title() {
    return this.getTypedRuleContext(Ia, 0);
  }
  head() {
    return this.getTypedRuleContext(Ma, 0);
  }
  block() {
    return this.getTypedRuleContext(ui, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterProg(this);
  }
  exitRule(t) {
    t instanceof v && t.exitProg(this);
  }
}, Ia = class extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_title;
  }
  TITLE() {
    return this.getToken(h.TITLE, 0);
  }
  TITLE_CONTENT() {
    return this.getToken(h.TITLE_CONTENT, 0);
  }
  TITLE_END() {
    return this.getToken(h.TITLE_END, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterTitle(this);
  }
  exitRule(t) {
    t instanceof v && t.exitTitle(this);
  }
};
class Ma extends _.ParserRuleContext {
  constructor(e, r, s) {
    r === void 0 && (r = null), s == null && (s = -1);
    super(r, s);
    tt(this, "group", function(e) {
      return e === void 0 && (e = null), e === null ? this.getTypedRuleContexts(Hs) : this.getTypedRuleContext(Hs, e);
    });
    tt(this, "participant", function(e) {
      return e === void 0 && (e = null), e === null ? this.getTypedRuleContexts(Un) : this.getTypedRuleContext(Un, e);
    });
    this.parser = e, this.ruleIndex = h.RULE_head;
  }
  starterExp() {
    return this.getTypedRuleContext(Pa, 0);
  }
  enterRule(e) {
    e instanceof v && e.enterHead(this);
  }
  exitRule(e) {
    e instanceof v && e.exitHead(this);
  }
}
let Hs = class extends _.ParserRuleContext {
  constructor(e, r, s) {
    r === void 0 && (r = null), s == null && (s = -1);
    super(r, s);
    tt(this, "participant", function(e) {
      return e === void 0 && (e = null), e === null ? this.getTypedRuleContexts(Un) : this.getTypedRuleContext(Un, e);
    });
    this.parser = e, this.ruleIndex = h.RULE_group;
  }
  GROUP() {
    return this.getToken(h.GROUP, 0);
  }
  OBRACE() {
    return this.getToken(h.OBRACE, 0);
  }
  CBRACE() {
    return this.getToken(h.CBRACE, 0);
  }
  name() {
    return this.getTypedRuleContext(Wn, 0);
  }
  enterRule(e) {
    e instanceof v && e.enterGroup(this);
  }
  exitRule(e) {
    e instanceof v && e.exitGroup(this);
  }
};
class Pa extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_starterExp;
  }
  STARTER_LXR() {
    return this.getToken(h.STARTER_LXR, 0);
  }
  OPAR() {
    return this.getToken(h.OPAR, 0);
  }
  CPAR() {
    return this.getToken(h.CPAR, 0);
  }
  starter() {
    return this.getTypedRuleContext($a, 0);
  }
  ANNOTATION() {
    return this.getToken(h.ANNOTATION, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterStarterExp(this);
  }
  exitRule(t) {
    t instanceof v && t.exitStarterExp(this);
  }
}
class $a extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_starter;
  }
  ID() {
    return this.getToken(h.ID, 0);
  }
  STRING() {
    return this.getToken(h.STRING, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterStarter(this);
  }
  exitRule(t) {
    t instanceof v && t.exitStarter(this);
  }
}
let Un = class extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_participant;
  }
  name() {
    return this.getTypedRuleContext(Wn, 0);
  }
  participantType() {
    return this.getTypedRuleContext(Ba, 0);
  }
  stereotype() {
    return this.getTypedRuleContext(Da, 0);
  }
  width() {
    return this.getTypedRuleContext(Ua, 0);
  }
  label() {
    return this.getTypedRuleContext(Fa, 0);
  }
  COLOR() {
    return this.getToken(h.COLOR, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterParticipant(this);
  }
  exitRule(t) {
    t instanceof v && t.exitParticipant(this);
  }
};
class Da extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_stereotype;
  }
  SOPEN() {
    return this.getToken(h.SOPEN, 0);
  }
  name() {
    return this.getTypedRuleContext(Wn, 0);
  }
  SCLOSE() {
    return this.getToken(h.SCLOSE, 0);
  }
  GT() {
    return this.getToken(h.GT, 0);
  }
  LT() {
    return this.getToken(h.LT, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterStereotype(this);
  }
  exitRule(t) {
    t instanceof v && t.exitStereotype(this);
  }
}
class Fa extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_label;
  }
  AS() {
    return this.getToken(h.AS, 0);
  }
  name() {
    return this.getTypedRuleContext(Wn, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterLabel(this);
  }
  exitRule(t) {
    t instanceof v && t.exitLabel(this);
  }
}
class Ba extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_participantType;
  }
  ANNOTATION() {
    return this.getToken(h.ANNOTATION, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterParticipantType(this);
  }
  exitRule(t) {
    t instanceof v && t.exitParticipantType(this);
  }
}
class Wn extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_name;
  }
  ID() {
    return this.getToken(h.ID, 0);
  }
  STRING() {
    return this.getToken(h.STRING, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterName(this);
  }
  exitRule(t) {
    t instanceof v && t.exitName(this);
  }
}
class Ua extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_width;
  }
  INT() {
    return this.getToken(h.INT, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterWidth(this);
  }
  exitRule(t) {
    t instanceof v && t.exitWidth(this);
  }
}
class ui extends _.ParserRuleContext {
  constructor(e, r, s) {
    r === void 0 && (r = null), s == null && (s = -1);
    super(r, s);
    tt(this, "stat", function(e) {
      return e === void 0 && (e = null), e === null ? this.getTypedRuleContexts(Gs) : this.getTypedRuleContext(Gs, e);
    });
    this.parser = e, this.ruleIndex = h.RULE_block;
  }
  enterRule(e) {
    e instanceof v && e.enterBlock(this);
  }
  exitRule(e) {
    e instanceof v && e.exitBlock(this);
  }
}
let Ha = class extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_ret;
  }
  RETURN() {
    return this.getToken(h.RETURN, 0);
  }
  expr() {
    return this.getTypedRuleContext(V, 0);
  }
  SCOL() {
    return this.getToken(h.SCOL, 0);
  }
  ANNOTATION_RET() {
    return this.getToken(h.ANNOTATION_RET, 0);
  }
  asyncMessage() {
    return this.getTypedRuleContext(gi, 0);
  }
  EVENT_END() {
    return this.getToken(h.EVENT_END, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterRet(this);
  }
  exitRule(t) {
    t instanceof v && t.exitRet(this);
  }
}, Ga = class extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_divider;
  }
  dividerNote() {
    return this.getTypedRuleContext(ja, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterDivider(this);
  }
  exitRule(t) {
    t instanceof v && t.exitDivider(this);
  }
};
class ja extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_dividerNote;
  }
  DIVIDER() {
    return this.getToken(h.DIVIDER, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterDividerNote(this);
  }
  exitRule(t) {
    t instanceof v && t.exitDividerNote(this);
  }
}
let Gs = class extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_stat, this._OTHER = null;
  }
  alt() {
    return this.getTypedRuleContext(r1, 0);
  }
  par() {
    return this.getTypedRuleContext(Va, 0);
  }
  opt() {
    return this.getTypedRuleContext(za, 0);
  }
  loop() {
    return this.getTypedRuleContext(o1, 0);
  }
  creation() {
    return this.getTypedRuleContext(hi, 0);
  }
  message() {
    return this.getTypedRuleContext(Wa, 0);
  }
  asyncMessage() {
    return this.getTypedRuleContext(gi, 0);
  }
  EVENT_END() {
    return this.getToken(h.EVENT_END, 0);
  }
  ret() {
    return this.getTypedRuleContext(Ha, 0);
  }
  divider() {
    return this.getTypedRuleContext(Ga, 0);
  }
  tcf() {
    return this.getTypedRuleContext(t1, 0);
  }
  OTHER() {
    return this.getToken(h.OTHER, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterStat(this);
  }
  exitRule(t) {
    t instanceof v && t.exitStat(this);
  }
};
class Va extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_par;
  }
  PAR() {
    return this.getToken(h.PAR, 0);
  }
  braceBlock() {
    return this.getTypedRuleContext(ee, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterPar(this);
  }
  exitRule(t) {
    t instanceof v && t.exitPar(this);
  }
}
class za extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_opt;
  }
  OPT() {
    return this.getToken(h.OPT, 0);
  }
  braceBlock() {
    return this.getTypedRuleContext(ee, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterOpt(this);
  }
  exitRule(t) {
    t instanceof v && t.exitOpt(this);
  }
}
let hi = class extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_creation;
  }
  creationBody() {
    return this.getTypedRuleContext(Za, 0);
  }
  SCOL() {
    return this.getToken(h.SCOL, 0);
  }
  braceBlock() {
    return this.getTypedRuleContext(ee, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterCreation(this);
  }
  exitRule(t) {
    t instanceof v && t.exitCreation(this);
  }
};
class Za extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_creationBody;
  }
  NEW() {
    return this.getToken(h.NEW, 0);
  }
  construct() {
    return this.getTypedRuleContext(Ya, 0);
  }
  assignment() {
    return this.getTypedRuleContext(Br, 0);
  }
  OPAR() {
    return this.getToken(h.OPAR, 0);
  }
  CPAR() {
    return this.getToken(h.CPAR, 0);
  }
  parameters() {
    return this.getTypedRuleContext(mi, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterCreationBody(this);
  }
  exitRule(t) {
    t instanceof v && t.exitCreationBody(this);
  }
}
let Wa = class extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_message;
  }
  messageBody() {
    return this.getTypedRuleContext(qa, 0);
  }
  SCOL() {
    return this.getToken(h.SCOL, 0);
  }
  braceBlock() {
    return this.getTypedRuleContext(ee, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterMessage(this);
  }
  exitRule(t) {
    t instanceof v && t.exitMessage(this);
  }
};
class qa extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_messageBody;
  }
  func() {
    return this.getTypedRuleContext(fi, 0);
  }
  assignment() {
    return this.getTypedRuleContext(Br, 0);
  }
  to() {
    return this.getTypedRuleContext(Fr, 0);
  }
  DOT() {
    return this.getToken(h.DOT, 0);
  }
  from() {
    return this.getTypedRuleContext(di, 0);
  }
  ARROW() {
    return this.getToken(h.ARROW, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterMessageBody(this);
  }
  exitRule(t) {
    t instanceof v && t.exitMessageBody(this);
  }
}
class fi extends _.ParserRuleContext {
  constructor(e, r, s) {
    r === void 0 && (r = null), s == null && (s = -1);
    super(r, s);
    tt(this, "signature", function(e) {
      return e === void 0 && (e = null), e === null ? this.getTypedRuleContexts(js) : this.getTypedRuleContext(js, e);
    });
    tt(this, "DOT", function(e) {
      return e === void 0 && (e = null), e === null ? this.getTokens(h.DOT) : this.getToken(h.DOT, e);
    });
    this.parser = e, this.ruleIndex = h.RULE_func;
  }
  enterRule(e) {
    e instanceof v && e.enterFunc(this);
  }
  exitRule(e) {
    e instanceof v && e.exitFunc(this);
  }
}
class di extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_from;
  }
  ID() {
    return this.getToken(h.ID, 0);
  }
  STRING() {
    return this.getToken(h.STRING, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterFrom(this);
  }
  exitRule(t) {
    t instanceof v && t.exitFrom(this);
  }
}
class Fr extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_to;
  }
  ID() {
    return this.getToken(h.ID, 0);
  }
  STRING() {
    return this.getToken(h.STRING, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterTo(this);
  }
  exitRule(t) {
    t instanceof v && t.exitTo(this);
  }
}
class js extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_signature;
  }
  methodName() {
    return this.getTypedRuleContext(Qa, 0);
  }
  invocation() {
    return this.getTypedRuleContext(pi, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterSignature(this);
  }
  exitRule(t) {
    t instanceof v && t.exitSignature(this);
  }
}
class pi extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_invocation;
  }
  OPAR() {
    return this.getToken(h.OPAR, 0);
  }
  CPAR() {
    return this.getToken(h.CPAR, 0);
  }
  parameters() {
    return this.getTypedRuleContext(mi, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterInvocation(this);
  }
  exitRule(t) {
    t instanceof v && t.exitInvocation(this);
  }
}
class Br extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_assignment;
  }
  assignee() {
    return this.getTypedRuleContext(Xa, 0);
  }
  ASSIGN() {
    return this.getToken(h.ASSIGN, 0);
  }
  type() {
    return this.getTypedRuleContext(xi, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterAssignment(this);
  }
  exitRule(t) {
    t instanceof v && t.exitAssignment(this);
  }
}
let gi = class extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_asyncMessage;
  }
  to() {
    return this.getTypedRuleContext(Fr, 0);
  }
  COL() {
    return this.getToken(h.COL, 0);
  }
  content() {
    return this.getTypedRuleContext(Ka, 0);
  }
  from() {
    return this.getTypedRuleContext(di, 0);
  }
  ARROW() {
    return this.getToken(h.ARROW, 0);
  }
  MINUS() {
    return this.getToken(h.MINUS, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterAsyncMessage(this);
  }
  exitRule(t) {
    t instanceof v && t.exitAsyncMessage(this);
  }
};
class Ka extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_content;
  }
  EVENT_PAYLOAD_LXR() {
    return this.getToken(h.EVENT_PAYLOAD_LXR, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterContent(this);
  }
  exitRule(t) {
    t instanceof v && t.exitContent(this);
  }
}
class Ya extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_construct;
  }
  ID() {
    return this.getToken(h.ID, 0);
  }
  STRING() {
    return this.getToken(h.STRING, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterConstruct(this);
  }
  exitRule(t) {
    t instanceof v && t.exitConstruct(this);
  }
}
class xi extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_type;
  }
  ID() {
    return this.getToken(h.ID, 0);
  }
  STRING() {
    return this.getToken(h.STRING, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterType(this);
  }
  exitRule(t) {
    t instanceof v && t.exitType(this);
  }
}
class Xa extends _.ParserRuleContext {
  constructor(e, r, s) {
    r === void 0 && (r = null), s == null && (s = -1);
    super(r, s);
    tt(this, "ID", function(e) {
      return e === void 0 && (e = null), e === null ? this.getTokens(h.ID) : this.getToken(h.ID, e);
    });
    tt(this, "COMMA", function(e) {
      return e === void 0 && (e = null), e === null ? this.getTokens(h.COMMA) : this.getToken(h.COMMA, e);
    });
    this.parser = e, this.ruleIndex = h.RULE_assignee;
  }
  atom() {
    return this.getTypedRuleContext(we, 0);
  }
  STRING() {
    return this.getToken(h.STRING, 0);
  }
  enterRule(e) {
    e instanceof v && e.enterAssignee(this);
  }
  exitRule(e) {
    e instanceof v && e.exitAssignee(this);
  }
}
class Qa extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_methodName;
  }
  ID() {
    return this.getToken(h.ID, 0);
  }
  STRING() {
    return this.getToken(h.STRING, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterMethodName(this);
  }
  exitRule(t) {
    t instanceof v && t.exitMethodName(this);
  }
}
class mi extends _.ParserRuleContext {
  constructor(e, r, s) {
    r === void 0 && (r = null), s == null && (s = -1);
    super(r, s);
    tt(this, "parameter", function(e) {
      return e === void 0 && (e = null), e === null ? this.getTypedRuleContexts(Vs) : this.getTypedRuleContext(Vs, e);
    });
    tt(this, "COMMA", function(e) {
      return e === void 0 && (e = null), e === null ? this.getTokens(h.COMMA) : this.getToken(h.COMMA, e);
    });
    this.parser = e, this.ruleIndex = h.RULE_parameters;
  }
  enterRule(e) {
    e instanceof v && e.enterParameters(this);
  }
  exitRule(e) {
    e instanceof v && e.exitParameters(this);
  }
}
class Vs extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_parameter;
  }
  declaration() {
    return this.getTypedRuleContext(Ja, 0);
  }
  expr() {
    return this.getTypedRuleContext(V, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterParameter(this);
  }
  exitRule(t) {
    t instanceof v && t.exitParameter(this);
  }
}
class Ja extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_declaration;
  }
  type() {
    return this.getTypedRuleContext(xi, 0);
  }
  ID() {
    return this.getToken(h.ID, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterDeclaration(this);
  }
  exitRule(t) {
    t instanceof v && t.exitDeclaration(this);
  }
}
class t1 extends _.ParserRuleContext {
  constructor(e, r, s) {
    r === void 0 && (r = null), s == null && (s = -1);
    super(r, s);
    tt(this, "catchBlock", function(e) {
      return e === void 0 && (e = null), e === null ? this.getTypedRuleContexts(zs) : this.getTypedRuleContext(zs, e);
    });
    this.parser = e, this.ruleIndex = h.RULE_tcf;
  }
  tryBlock() {
    return this.getTypedRuleContext(e1, 0);
  }
  finallyBlock() {
    return this.getTypedRuleContext(n1, 0);
  }
  enterRule(e) {
    e instanceof v && e.enterTcf(this);
  }
  exitRule(e) {
    e instanceof v && e.exitTcf(this);
  }
}
class e1 extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_tryBlock;
  }
  TRY() {
    return this.getToken(h.TRY, 0);
  }
  braceBlock() {
    return this.getTypedRuleContext(ee, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterTryBlock(this);
  }
  exitRule(t) {
    t instanceof v && t.exitTryBlock(this);
  }
}
class zs extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_catchBlock;
  }
  CATCH() {
    return this.getToken(h.CATCH, 0);
  }
  braceBlock() {
    return this.getTypedRuleContext(ee, 0);
  }
  invocation() {
    return this.getTypedRuleContext(pi, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterCatchBlock(this);
  }
  exitRule(t) {
    t instanceof v && t.exitCatchBlock(this);
  }
}
class n1 extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_finallyBlock;
  }
  FINALLY() {
    return this.getToken(h.FINALLY, 0);
  }
  braceBlock() {
    return this.getTypedRuleContext(ee, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterFinallyBlock(this);
  }
  exitRule(t) {
    t instanceof v && t.exitFinallyBlock(this);
  }
}
class r1 extends _.ParserRuleContext {
  constructor(e, r, s) {
    r === void 0 && (r = null), s == null && (s = -1);
    super(r, s);
    tt(this, "elseIfBlock", function(e) {
      return e === void 0 && (e = null), e === null ? this.getTypedRuleContexts(Zs) : this.getTypedRuleContext(Zs, e);
    });
    this.parser = e, this.ruleIndex = h.RULE_alt;
  }
  ifBlock() {
    return this.getTypedRuleContext(s1, 0);
  }
  elseBlock() {
    return this.getTypedRuleContext(i1, 0);
  }
  enterRule(e) {
    e instanceof v && e.enterAlt(this);
  }
  exitRule(e) {
    e instanceof v && e.exitAlt(this);
  }
}
class s1 extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_ifBlock;
  }
  IF() {
    return this.getToken(h.IF, 0);
  }
  parExpr() {
    return this.getTypedRuleContext(Ur, 0);
  }
  braceBlock() {
    return this.getTypedRuleContext(ee, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterIfBlock(this);
  }
  exitRule(t) {
    t instanceof v && t.exitIfBlock(this);
  }
}
class Zs extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_elseIfBlock;
  }
  ELSE() {
    return this.getToken(h.ELSE, 0);
  }
  IF() {
    return this.getToken(h.IF, 0);
  }
  parExpr() {
    return this.getTypedRuleContext(Ur, 0);
  }
  braceBlock() {
    return this.getTypedRuleContext(ee, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterElseIfBlock(this);
  }
  exitRule(t) {
    t instanceof v && t.exitElseIfBlock(this);
  }
}
class i1 extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_elseBlock;
  }
  ELSE() {
    return this.getToken(h.ELSE, 0);
  }
  braceBlock() {
    return this.getTypedRuleContext(ee, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterElseBlock(this);
  }
  exitRule(t) {
    t instanceof v && t.exitElseBlock(this);
  }
}
class ee extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_braceBlock;
  }
  OBRACE() {
    return this.getToken(h.OBRACE, 0);
  }
  CBRACE() {
    return this.getToken(h.CBRACE, 0);
  }
  block() {
    return this.getTypedRuleContext(ui, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterBraceBlock(this);
  }
  exitRule(t) {
    t instanceof v && t.exitBraceBlock(this);
  }
}
class o1 extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_loop;
  }
  WHILE() {
    return this.getToken(h.WHILE, 0);
  }
  parExpr() {
    return this.getTypedRuleContext(Ur, 0);
  }
  braceBlock() {
    return this.getTypedRuleContext(ee, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterLoop(this);
  }
  exitRule(t) {
    t instanceof v && t.exitLoop(this);
  }
}
class V extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_expr;
  }
  copyFrom(t) {
    super.copyFrom(t);
  }
}
class nh extends V {
  constructor(t, e) {
    super(t), super.copyFrom(e);
  }
  assignment() {
    return this.getTypedRuleContext(Br, 0);
  }
  expr() {
    return this.getTypedRuleContext(V, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterAssignmentExpr(this);
  }
  exitRule(t) {
    t instanceof v && t.exitAssignmentExpr(this);
  }
}
h.AssignmentExprContext = nh;
class rh extends V {
  constructor(t, e) {
    super(t), super.copyFrom(e);
  }
  func() {
    return this.getTypedRuleContext(fi, 0);
  }
  to() {
    return this.getTypedRuleContext(Fr, 0);
  }
  DOT() {
    return this.getToken(h.DOT, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterFuncExpr(this);
  }
  exitRule(t) {
    t instanceof v && t.exitFuncExpr(this);
  }
}
h.FuncExprContext = rh;
class sh extends V {
  constructor(t, e) {
    super(t), super.copyFrom(e);
  }
  atom() {
    return this.getTypedRuleContext(we, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterAtomExpr(this);
  }
  exitRule(t) {
    t instanceof v && t.exitAtomExpr(this);
  }
}
h.AtomExprContext = sh;
class ih extends V {
  constructor(e, r) {
    super(e);
    tt(this, "expr", function(e) {
      return e === void 0 && (e = null), e === null ? this.getTypedRuleContexts(V) : this.getTypedRuleContext(V, e);
    });
    super.copyFrom(r);
  }
  OR() {
    return this.getToken(h.OR, 0);
  }
  enterRule(e) {
    e instanceof v && e.enterOrExpr(this);
  }
  exitRule(e) {
    e instanceof v && e.exitOrExpr(this);
  }
}
h.OrExprContext = ih;
class oh extends V {
  constructor(e, r) {
    super(e);
    tt(this, "expr", function(e) {
      return e === void 0 && (e = null), e === null ? this.getTypedRuleContexts(V) : this.getTypedRuleContext(V, e);
    });
    this.op = null, super.copyFrom(r);
  }
  PLUS() {
    return this.getToken(h.PLUS, 0);
  }
  MINUS() {
    return this.getToken(h.MINUS, 0);
  }
  enterRule(e) {
    e instanceof v && e.enterAdditiveExpr(this);
  }
  exitRule(e) {
    e instanceof v && e.exitAdditiveExpr(this);
  }
}
h.AdditiveExprContext = oh;
class ah extends V {
  constructor(e, r) {
    super(e);
    tt(this, "expr", function(e) {
      return e === void 0 && (e = null), e === null ? this.getTypedRuleContexts(V) : this.getTypedRuleContext(V, e);
    });
    this.op = null, super.copyFrom(r);
  }
  LTEQ() {
    return this.getToken(h.LTEQ, 0);
  }
  GTEQ() {
    return this.getToken(h.GTEQ, 0);
  }
  LT() {
    return this.getToken(h.LT, 0);
  }
  GT() {
    return this.getToken(h.GT, 0);
  }
  enterRule(e) {
    e instanceof v && e.enterRelationalExpr(this);
  }
  exitRule(e) {
    e instanceof v && e.exitRelationalExpr(this);
  }
}
h.RelationalExprContext = ah;
class lh extends V {
  constructor(e, r) {
    super(e);
    tt(this, "expr", function(e) {
      return e === void 0 && (e = null), e === null ? this.getTypedRuleContexts(V) : this.getTypedRuleContext(V, e);
    });
    super.copyFrom(r);
  }
  PLUS() {
    return this.getToken(h.PLUS, 0);
  }
  enterRule(e) {
    e instanceof v && e.enterPlusExpr(this);
  }
  exitRule(e) {
    e instanceof v && e.exitPlusExpr(this);
  }
}
h.PlusExprContext = lh;
class ch extends V {
  constructor(t, e) {
    super(t), super.copyFrom(e);
  }
  NOT() {
    return this.getToken(h.NOT, 0);
  }
  expr() {
    return this.getTypedRuleContext(V, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterNotExpr(this);
  }
  exitRule(t) {
    t instanceof v && t.exitNotExpr(this);
  }
}
h.NotExprContext = ch;
class uh extends V {
  constructor(t, e) {
    super(t), super.copyFrom(e);
  }
  MINUS() {
    return this.getToken(h.MINUS, 0);
  }
  expr() {
    return this.getTypedRuleContext(V, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterUnaryMinusExpr(this);
  }
  exitRule(t) {
    t instanceof v && t.exitUnaryMinusExpr(this);
  }
}
h.UnaryMinusExprContext = uh;
class hh extends V {
  constructor(t, e) {
    super(t), super.copyFrom(e);
  }
  creation() {
    return this.getTypedRuleContext(hi, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterCreationExpr(this);
  }
  exitRule(t) {
    t instanceof v && t.exitCreationExpr(this);
  }
}
h.CreationExprContext = hh;
class fh extends V {
  constructor(t, e) {
    super(t), super.copyFrom(e);
  }
  OPAR() {
    return this.getToken(h.OPAR, 0);
  }
  expr() {
    return this.getTypedRuleContext(V, 0);
  }
  CPAR() {
    return this.getToken(h.CPAR, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterParenthesizedExpr(this);
  }
  exitRule(t) {
    t instanceof v && t.exitParenthesizedExpr(this);
  }
}
h.ParenthesizedExprContext = fh;
class dh extends V {
  constructor(e, r) {
    super(e);
    tt(this, "expr", function(e) {
      return e === void 0 && (e = null), e === null ? this.getTypedRuleContexts(V) : this.getTypedRuleContext(V, e);
    });
    this.op = null, super.copyFrom(r);
  }
  MULT() {
    return this.getToken(h.MULT, 0);
  }
  DIV() {
    return this.getToken(h.DIV, 0);
  }
  MOD() {
    return this.getToken(h.MOD, 0);
  }
  enterRule(e) {
    e instanceof v && e.enterMultiplicationExpr(this);
  }
  exitRule(e) {
    e instanceof v && e.exitMultiplicationExpr(this);
  }
}
h.MultiplicationExprContext = dh;
class ph extends V {
  constructor(e, r) {
    super(e);
    tt(this, "expr", function(e) {
      return e === void 0 && (e = null), e === null ? this.getTypedRuleContexts(V) : this.getTypedRuleContext(V, e);
    });
    this.op = null, super.copyFrom(r);
  }
  EQ() {
    return this.getToken(h.EQ, 0);
  }
  NEQ() {
    return this.getToken(h.NEQ, 0);
  }
  enterRule(e) {
    e instanceof v && e.enterEqualityExpr(this);
  }
  exitRule(e) {
    e instanceof v && e.exitEqualityExpr(this);
  }
}
h.EqualityExprContext = ph;
class gh extends V {
  constructor(e, r) {
    super(e);
    tt(this, "expr", function(e) {
      return e === void 0 && (e = null), e === null ? this.getTypedRuleContexts(V) : this.getTypedRuleContext(V, e);
    });
    super.copyFrom(r);
  }
  AND() {
    return this.getToken(h.AND, 0);
  }
  enterRule(e) {
    e instanceof v && e.enterAndExpr(this);
  }
  exitRule(e) {
    e instanceof v && e.exitAndExpr(this);
  }
}
h.AndExprContext = gh;
class we extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_atom;
  }
  copyFrom(t) {
    super.copyFrom(t);
  }
}
class xh extends we {
  constructor(t, e) {
    super(t), super.copyFrom(e);
  }
  TRUE() {
    return this.getToken(h.TRUE, 0);
  }
  FALSE() {
    return this.getToken(h.FALSE, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterBooleanAtom(this);
  }
  exitRule(t) {
    t instanceof v && t.exitBooleanAtom(this);
  }
}
h.BooleanAtomContext = xh;
class mh extends we {
  constructor(t, e) {
    super(t), super.copyFrom(e);
  }
  ID() {
    return this.getToken(h.ID, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterIdAtom(this);
  }
  exitRule(t) {
    t instanceof v && t.exitIdAtom(this);
  }
}
h.IdAtomContext = mh;
class _h extends we {
  constructor(t, e) {
    super(t), super.copyFrom(e);
  }
  STRING() {
    return this.getToken(h.STRING, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterStringAtom(this);
  }
  exitRule(t) {
    t instanceof v && t.exitStringAtom(this);
  }
}
h.StringAtomContext = _h;
class Lh extends we {
  constructor(t, e) {
    super(t), super.copyFrom(e);
  }
  NIL() {
    return this.getToken(h.NIL, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterNilAtom(this);
  }
  exitRule(t) {
    t instanceof v && t.exitNilAtom(this);
  }
}
h.NilAtomContext = Lh;
class vh extends we {
  constructor(t, e) {
    super(t), super.copyFrom(e);
  }
  INT() {
    return this.getToken(h.INT, 0);
  }
  FLOAT() {
    return this.getToken(h.FLOAT, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterNumberAtom(this);
  }
  exitRule(t) {
    t instanceof v && t.exitNumberAtom(this);
  }
}
h.NumberAtomContext = vh;
class Ur extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_parExpr;
  }
  OPAR() {
    return this.getToken(h.OPAR, 0);
  }
  condition() {
    return this.getTypedRuleContext(a1, 0);
  }
  CPAR() {
    return this.getToken(h.CPAR, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterParExpr(this);
  }
  exitRule(t) {
    t instanceof v && t.exitParExpr(this);
  }
}
class a1 extends _.ParserRuleContext {
  constructor(t, e, r) {
    e === void 0 && (e = null), r == null && (r = -1), super(e, r), this.parser = t, this.ruleIndex = h.RULE_condition;
  }
  atom() {
    return this.getTypedRuleContext(we, 0);
  }
  expr() {
    return this.getTypedRuleContext(V, 0);
  }
  inExpr() {
    return this.getTypedRuleContext(l1, 0);
  }
  enterRule(t) {
    t instanceof v && t.enterCondition(this);
  }
  exitRule(t) {
    t instanceof v && t.exitCondition(this);
  }
}
class l1 extends _.ParserRuleContext {
  constructor(e, r, s) {
    r === void 0 && (r = null), s == null && (s = -1);
    super(r, s);
    tt(this, "ID", function(e) {
      return e === void 0 && (e = null), e === null ? this.getTokens(h.ID) : this.getToken(h.ID, e);
    });
    this.parser = e, this.ruleIndex = h.RULE_inExpr;
  }
  IN() {
    return this.getToken(h.IN, 0);
  }
  enterRule(e) {
    e instanceof v && e.enterInExpr(this);
  }
  exitRule(e) {
    e instanceof v && e.exitInExpr(this);
  }
}
h.ProgContext = eh;
h.TitleContext = Ia;
h.HeadContext = Ma;
h.GroupContext = Hs;
h.StarterExpContext = Pa;
h.StarterContext = $a;
h.ParticipantContext = Un;
h.StereotypeContext = Da;
h.LabelContext = Fa;
h.ParticipantTypeContext = Ba;
h.NameContext = Wn;
h.WidthContext = Ua;
h.BlockContext = ui;
h.RetContext = Ha;
h.DividerContext = Ga;
h.DividerNoteContext = ja;
h.StatContext = Gs;
h.ParContext = Va;
h.OptContext = za;
h.CreationContext = hi;
h.CreationBodyContext = Za;
h.MessageContext = Wa;
h.MessageBodyContext = qa;
h.FuncContext = fi;
h.FromContext = di;
h.ToContext = Fr;
h.SignatureContext = js;
h.InvocationContext = pi;
h.AssignmentContext = Br;
h.AsyncMessageContext = gi;
h.ContentContext = Ka;
h.ConstructContext = Ya;
h.TypeContext = xi;
h.AssigneeContext = Xa;
h.MethodNameContext = Qa;
h.ParametersContext = mi;
h.ParameterContext = Vs;
h.DeclarationContext = Ja;
h.TcfContext = t1;
h.TryBlockContext = e1;
h.CatchBlockContext = zs;
h.FinallyBlockContext = n1;
h.AltContext = r1;
h.IfBlockContext = s1;
h.ElseIfBlockContext = Zs;
h.ElseBlockContext = i1;
h.BraceBlockContext = ee;
h.LoopContext = o1;
h.ExprContext = V;
h.AtomContext = we;
h.ParExprContext = Ur;
h.ConditionContext = a1;
h.InExprContext = l1;
function H5() {
  this.__data__ = [], this.size = 0;
}
var G5 = H5;
function j5(n, t) {
  return n === t || n !== n && t !== t;
}
var _i = j5, V5 = _i;
function z5(n, t) {
  for (var e = n.length; e--; )
    if (V5(n[e][0], t))
      return e;
  return -1;
}
var Li = z5, Z5 = Li, W5 = Array.prototype, q5 = W5.splice;
function K5(n) {
  var t = this.__data__, e = Z5(t, n);
  if (e < 0)
    return !1;
  var r = t.length - 1;
  return e == r ? t.pop() : q5.call(t, e, 1), --this.size, !0;
}
var Y5 = K5, X5 = Li;
function Q5(n) {
  var t = this.__data__, e = X5(t, n);
  return e < 0 ? void 0 : t[e][1];
}
var J5 = Q5, tp = Li;
function ep(n) {
  return tp(this.__data__, n) > -1;
}
var np = ep, rp = Li;
function sp(n, t) {
  var e = this.__data__, r = rp(e, n);
  return r < 0 ? (++this.size, e.push([n, t])) : e[r][1] = t, this;
}
var ip = sp, op = G5, ap = Y5, lp = J5, cp = np, up = ip;
function qn(n) {
  var t = -1, e = n == null ? 0 : n.length;
  for (this.clear(); ++t < e; ) {
    var r = n[t];
    this.set(r[0], r[1]);
  }
}
qn.prototype.clear = op;
qn.prototype.delete = ap;
qn.prototype.get = lp;
qn.prototype.has = cp;
qn.prototype.set = up;
var vi = qn, hp = vi;
function fp() {
  this.__data__ = new hp(), this.size = 0;
}
var dp = fp;
function pp(n) {
  var t = this.__data__, e = t.delete(n);
  return this.size = t.size, e;
}
var gp = pp;
function xp(n) {
  return this.__data__.get(n);
}
var mp = xp;
function _p(n) {
  return this.__data__.has(n);
}
var Lp = _p, vp = gn, yp = vp.Symbol, yh = yp, Wl = yh, Ch = Object.prototype, Cp = Ch.hasOwnProperty, Ep = Ch.toString, or = Wl ? Wl.toStringTag : void 0;
function bp(n) {
  var t = Cp.call(n, or), e = n[or];
  try {
    n[or] = void 0;
    var r = !0;
  } catch {
  }
  var s = Ep.call(n);
  return r && (t ? n[or] = e : delete n[or]), s;
}
var wp = bp, Tp = Object.prototype, Ap = Tp.toString;
function Sp(n) {
  return Ap.call(n);
}
var Rp = Sp, ql = yh, kp = wp, Op = Rp, Np = "[object Null]", Ip = "[object Undefined]", Kl = ql ? ql.toStringTag : void 0;
function Mp(n) {
  return n == null ? n === void 0 ? Ip : Np : Kl && Kl in Object(n) ? kp(n) : Op(n);
}
var yi = Mp;
function Pp(n) {
  var t = typeof n;
  return n != null && (t == "object" || t == "function");
}
var xn = Pp, $p = yi, Dp = xn, Fp = "[object AsyncFunction]", Bp = "[object Function]", Up = "[object GeneratorFunction]", Hp = "[object Proxy]";
function Gp(n) {
  if (!Dp(n))
    return !1;
  var t = $p(n);
  return t == Bp || t == Up || t == Fp || t == Hp;
}
var c1 = Gp, jp = gn, Vp = jp["__core-js_shared__"], zp = Vp, Yi = zp, Yl = function() {
  var n = /[^.]+$/.exec(Yi && Yi.keys && Yi.keys.IE_PROTO || "");
  return n ? "Symbol(src)_1." + n : "";
}();
function Zp(n) {
  return !!Yl && Yl in n;
}
var Wp = Zp, qp = Function.prototype, Kp = qp.toString;
function Yp(n) {
  if (n != null) {
    try {
      return Kp.call(n);
    } catch {
    }
    try {
      return n + "";
    } catch {
    }
  }
  return "";
}
var Xp = Yp, Qp = c1, Jp = Wp, t9 = xn, e9 = Xp, n9 = /[\\^$.*+?()[\]{}|]/g, r9 = /^\[object .+?Constructor\]$/, s9 = Function.prototype, i9 = Object.prototype, o9 = s9.toString, a9 = i9.hasOwnProperty, l9 = RegExp(
  "^" + o9.call(a9).replace(n9, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
);
function c9(n) {
  if (!t9(n) || Jp(n))
    return !1;
  var t = Qp(n) ? l9 : r9;
  return t.test(e9(n));
}
var u9 = c9;
function h9(n, t) {
  return n == null ? void 0 : n[t];
}
var f9 = h9, d9 = u9, p9 = f9;
function g9(n, t) {
  var e = p9(n, t);
  return d9(e) ? e : void 0;
}
var u1 = g9, x9 = u1, m9 = gn, _9 = x9(m9, "Map"), Eh = _9, L9 = u1, v9 = L9(Object, "create"), Ci = v9, Xl = Ci;
function y9() {
  this.__data__ = Xl ? Xl(null) : {}, this.size = 0;
}
var C9 = y9;
function E9(n) {
  var t = this.has(n) && delete this.__data__[n];
  return this.size -= t ? 1 : 0, t;
}
var b9 = E9, w9 = Ci, T9 = "__lodash_hash_undefined__", A9 = Object.prototype, S9 = A9.hasOwnProperty;
function R9(n) {
  var t = this.__data__;
  if (w9) {
    var e = t[n];
    return e === T9 ? void 0 : e;
  }
  return S9.call(t, n) ? t[n] : void 0;
}
var k9 = R9, O9 = Ci, N9 = Object.prototype, I9 = N9.hasOwnProperty;
function M9(n) {
  var t = this.__data__;
  return O9 ? t[n] !== void 0 : I9.call(t, n);
}
var P9 = M9, $9 = Ci, D9 = "__lodash_hash_undefined__";
function F9(n, t) {
  var e = this.__data__;
  return this.size += this.has(n) ? 0 : 1, e[n] = $9 && t === void 0 ? D9 : t, this;
}
var B9 = F9, U9 = C9, H9 = b9, G9 = k9, j9 = P9, V9 = B9;
function Kn(n) {
  var t = -1, e = n == null ? 0 : n.length;
  for (this.clear(); ++t < e; ) {
    var r = n[t];
    this.set(r[0], r[1]);
  }
}
Kn.prototype.clear = U9;
Kn.prototype.delete = H9;
Kn.prototype.get = G9;
Kn.prototype.has = j9;
Kn.prototype.set = V9;
var z9 = Kn, Ql = z9, Z9 = vi, W9 = Eh;
function q9() {
  this.size = 0, this.__data__ = {
    hash: new Ql(),
    map: new (W9 || Z9)(),
    string: new Ql()
  };
}
var K9 = q9;
function Y9(n) {
  var t = typeof n;
  return t == "string" || t == "number" || t == "symbol" || t == "boolean" ? n !== "__proto__" : n === null;
}
var X9 = Y9, Q9 = X9;
function J9(n, t) {
  var e = n.__data__;
  return Q9(t) ? e[typeof t == "string" ? "string" : "hash"] : e.map;
}
var Ei = J9, t6 = Ei;
function e6(n) {
  var t = t6(this, n).delete(n);
  return this.size -= t ? 1 : 0, t;
}
var n6 = e6, r6 = Ei;
function s6(n) {
  return r6(this, n).get(n);
}
var i6 = s6, o6 = Ei;
function a6(n) {
  return o6(this, n).has(n);
}
var l6 = a6, c6 = Ei;
function u6(n, t) {
  var e = c6(this, n), r = e.size;
  return e.set(n, t), this.size += e.size == r ? 0 : 1, this;
}
var h6 = u6, f6 = K9, d6 = n6, p6 = i6, g6 = l6, x6 = h6;
function Yn(n) {
  var t = -1, e = n == null ? 0 : n.length;
  for (this.clear(); ++t < e; ) {
    var r = n[t];
    this.set(r[0], r[1]);
  }
}
Yn.prototype.clear = f6;
Yn.prototype.delete = d6;
Yn.prototype.get = p6;
Yn.prototype.has = g6;
Yn.prototype.set = x6;
var m6 = Yn, _6 = vi, L6 = Eh, v6 = m6, y6 = 200;
function C6(n, t) {
  var e = this.__data__;
  if (e instanceof _6) {
    var r = e.__data__;
    if (!L6 || r.length < y6 - 1)
      return r.push([n, t]), this.size = ++e.size, this;
    e = this.__data__ = new v6(r);
  }
  return e.set(n, t), this.size = e.size, this;
}
var E6 = C6, b6 = vi, w6 = dp, T6 = gp, A6 = mp, S6 = Lp, R6 = E6;
function Xn(n) {
  var t = this.__data__ = new b6(n);
  this.size = t.size;
}
Xn.prototype.clear = w6;
Xn.prototype.delete = T6;
Xn.prototype.get = A6;
Xn.prototype.has = S6;
Xn.prototype.set = R6;
var k6 = Xn, O6 = u1, N6 = function() {
  try {
    var n = O6(Object, "defineProperty");
    return n({}, "", {}), n;
  } catch {
  }
}(), bh = N6, Jl = bh;
function I6(n, t, e) {
  t == "__proto__" && Jl ? Jl(n, t, {
    configurable: !0,
    enumerable: !0,
    value: e,
    writable: !0
  }) : n[t] = e;
}
var h1 = I6, M6 = h1, P6 = _i;
function $6(n, t, e) {
  (e !== void 0 && !P6(n[t], e) || e === void 0 && !(t in n)) && M6(n, t, e);
}
var wh = $6;
function D6(n) {
  return function(t, e, r) {
    for (var s = -1, i = Object(t), o = r(t), a = o.length; a--; ) {
      var l = o[n ? a : ++s];
      if (e(i[l], l, i) === !1)
        break;
    }
    return t;
  };
}
var F6 = D6, B6 = F6, U6 = B6(), H6 = U6, $o = { exports: {} };
(function(n, t) {
  var e = gn, r = t && !t.nodeType && t, s = r && !0 && n && !n.nodeType && n, i = s && s.exports === r, o = i ? e.Buffer : void 0, a = o ? o.allocUnsafe : void 0;
  function l(c, u) {
    if (u)
      return c.slice();
    var f = c.length, d = a ? a(f) : new c.constructor(f);
    return c.copy(d), d;
  }
  n.exports = l;
})($o, $o.exports);
var G6 = gn, j6 = G6.Uint8Array, V6 = j6, tc = V6;
function z6(n) {
  var t = new n.constructor(n.byteLength);
  return new tc(t).set(new tc(n)), t;
}
var Z6 = z6, W6 = Z6;
function q6(n, t) {
  var e = t ? W6(n.buffer) : n.buffer;
  return new n.constructor(e, n.byteOffset, n.length);
}
var K6 = q6;
function Y6(n, t) {
  var e = -1, r = n.length;
  for (t || (t = Array(r)); ++e < r; )
    t[e] = n[e];
  return t;
}
var X6 = Y6, Q6 = xn, ec = Object.create, J6 = function() {
  function n() {
  }
  return function(t) {
    if (!Q6(t))
      return {};
    if (ec)
      return ec(t);
    n.prototype = t;
    var e = new n();
    return n.prototype = void 0, e;
  };
}(), t8 = J6;
function e8(n, t) {
  return function(e) {
    return n(t(e));
  };
}
var n8 = e8, r8 = n8, s8 = r8(Object.getPrototypeOf, Object), Th = s8, i8 = Object.prototype;
function o8(n) {
  var t = n && n.constructor, e = typeof t == "function" && t.prototype || i8;
  return n === e;
}
var Ah = o8, a8 = t8, l8 = Th, c8 = Ah;
function u8(n) {
  return typeof n.constructor == "function" && !c8(n) ? a8(l8(n)) : {};
}
var h8 = u8;
function f8(n) {
  return n != null && typeof n == "object";
}
var Hr = f8, d8 = yi, p8 = Hr, g8 = "[object Arguments]";
function x8(n) {
  return p8(n) && d8(n) == g8;
}
var m8 = x8, nc = m8, _8 = Hr, Sh = Object.prototype, L8 = Sh.hasOwnProperty, v8 = Sh.propertyIsEnumerable, y8 = nc(function() {
  return arguments;
}()) ? nc : function(n) {
  return _8(n) && L8.call(n, "callee") && !v8.call(n, "callee");
}, Rh = y8, C8 = Array.isArray, kh = C8, E8 = 9007199254740991;
function b8(n) {
  return typeof n == "number" && n > -1 && n % 1 == 0 && n <= E8;
}
var Oh = b8, w8 = c1, T8 = Oh;
function A8(n) {
  return n != null && T8(n.length) && !w8(n);
}
var f1 = A8, S8 = f1, R8 = Hr;
function k8(n) {
  return R8(n) && S8(n);
}
var O8 = k8, Ws = { exports: {} };
function N8() {
  return !1;
}
var I8 = N8;
(function(n, t) {
  var e = gn, r = I8, s = t && !t.nodeType && t, i = s && !0 && n && !n.nodeType && n, o = i && i.exports === s, a = o ? e.Buffer : void 0, l = a ? a.isBuffer : void 0, c = l || r;
  n.exports = c;
})(Ws, Ws.exports);
var M8 = yi, P8 = Th, $8 = Hr, D8 = "[object Object]", F8 = Function.prototype, B8 = Object.prototype, Nh = F8.toString, U8 = B8.hasOwnProperty, H8 = Nh.call(Object);
function G8(n) {
  if (!$8(n) || M8(n) != D8)
    return !1;
  var t = P8(n);
  if (t === null)
    return !0;
  var e = U8.call(t, "constructor") && t.constructor;
  return typeof e == "function" && e instanceof e && Nh.call(e) == H8;
}
var j8 = G8, V8 = yi, z8 = Oh, Z8 = Hr, W8 = "[object Arguments]", q8 = "[object Array]", K8 = "[object Boolean]", Y8 = "[object Date]", X8 = "[object Error]", Q8 = "[object Function]", J8 = "[object Map]", t7 = "[object Number]", e7 = "[object Object]", n7 = "[object RegExp]", r7 = "[object Set]", s7 = "[object String]", i7 = "[object WeakMap]", o7 = "[object ArrayBuffer]", a7 = "[object DataView]", l7 = "[object Float32Array]", c7 = "[object Float64Array]", u7 = "[object Int8Array]", h7 = "[object Int16Array]", f7 = "[object Int32Array]", d7 = "[object Uint8Array]", p7 = "[object Uint8ClampedArray]", g7 = "[object Uint16Array]", x7 = "[object Uint32Array]", ut = {};
ut[l7] = ut[c7] = ut[u7] = ut[h7] = ut[f7] = ut[d7] = ut[p7] = ut[g7] = ut[x7] = !0;
ut[W8] = ut[q8] = ut[o7] = ut[K8] = ut[a7] = ut[Y8] = ut[X8] = ut[Q8] = ut[J8] = ut[t7] = ut[e7] = ut[n7] = ut[r7] = ut[s7] = ut[i7] = !1;
function m7(n) {
  return Z8(n) && z8(n.length) && !!ut[V8(n)];
}
var _7 = m7;
function L7(n) {
  return function(t) {
    return n(t);
  };
}
var v7 = L7, Do = { exports: {} };
(function(n, t) {
  var e = Fu, r = t && !t.nodeType && t, s = r && !0 && n && !n.nodeType && n, i = s && s.exports === r, o = i && e.process, a = function() {
    try {
      var l = s && s.require && s.require("util").types;
      return l || o && o.binding && o.binding("util");
    } catch {
    }
  }();
  n.exports = a;
})(Do, Do.exports);
var y7 = _7, C7 = v7, rc = Do.exports, sc = rc && rc.isTypedArray, E7 = sc ? C7(sc) : y7, Ih = E7;
function b7(n, t) {
  if (!(t === "constructor" && typeof n[t] == "function") && t != "__proto__")
    return n[t];
}
var Mh = b7, w7 = h1, T7 = _i, A7 = Object.prototype, S7 = A7.hasOwnProperty;
function R7(n, t, e) {
  var r = n[t];
  (!(S7.call(n, t) && T7(r, e)) || e === void 0 && !(t in n)) && w7(n, t, e);
}
var k7 = R7, O7 = k7, N7 = h1;
function I7(n, t, e, r) {
  var s = !e;
  e || (e = {});
  for (var i = -1, o = t.length; ++i < o; ) {
    var a = t[i], l = r ? r(e[a], n[a], a, e, n) : void 0;
    l === void 0 && (l = n[a]), s ? N7(e, a, l) : O7(e, a, l);
  }
  return e;
}
var M7 = I7;
function P7(n, t) {
  for (var e = -1, r = Array(n); ++e < n; )
    r[e] = t(e);
  return r;
}
var $7 = P7, D7 = 9007199254740991, F7 = /^(?:0|[1-9]\d*)$/;
function B7(n, t) {
  var e = typeof n;
  return t = t ?? D7, !!t && (e == "number" || e != "symbol" && F7.test(n)) && n > -1 && n % 1 == 0 && n < t;
}
var Ph = B7, U7 = $7, H7 = Rh, G7 = kh, j7 = Ws.exports, V7 = Ph, z7 = Ih, Z7 = Object.prototype, W7 = Z7.hasOwnProperty;
function q7(n, t) {
  var e = G7(n), r = !e && H7(n), s = !e && !r && j7(n), i = !e && !r && !s && z7(n), o = e || r || s || i, a = o ? U7(n.length, String) : [], l = a.length;
  for (var c in n)
    (t || W7.call(n, c)) && !(o && (c == "length" || s && (c == "offset" || c == "parent") || i && (c == "buffer" || c == "byteLength" || c == "byteOffset") || V7(c, l))) && a.push(c);
  return a;
}
var K7 = q7;
function Y7(n) {
  var t = [];
  if (n != null)
    for (var e in Object(n))
      t.push(e);
  return t;
}
var X7 = Y7, Q7 = xn, J7 = Ah, tg = X7, eg = Object.prototype, ng = eg.hasOwnProperty;
function rg(n) {
  if (!Q7(n))
    return tg(n);
  var t = J7(n), e = [];
  for (var r in n)
    r == "constructor" && (t || !ng.call(n, r)) || e.push(r);
  return e;
}
var sg = rg, ig = K7, og = sg, ag = f1;
function lg(n) {
  return ag(n) ? ig(n, !0) : og(n);
}
var $h = lg, cg = M7, ug = $h;
function hg(n) {
  return cg(n, ug(n));
}
var fg = hg, ic = wh, dg = $o.exports, pg = K6, gg = X6, xg = h8, oc = Rh, ac = kh, mg = O8, _g = Ws.exports, Lg = c1, vg = xn, yg = j8, Cg = Ih, lc = Mh, Eg = fg;
function bg(n, t, e, r, s, i, o) {
  var a = lc(n, e), l = lc(t, e), c = o.get(l);
  if (c) {
    ic(n, e, c);
    return;
  }
  var u = i ? i(a, l, e + "", n, t, o) : void 0, f = u === void 0;
  if (f) {
    var d = ac(l), p = !d && _g(l), w = !d && !p && Cg(l);
    u = l, d || p || w ? ac(a) ? u = a : mg(a) ? u = gg(a) : p ? (f = !1, u = dg(l, !0)) : w ? (f = !1, u = pg(l, !0)) : u = [] : yg(l) || oc(l) ? (u = a, oc(a) ? u = Eg(a) : (!vg(a) || Lg(a)) && (u = xg(l))) : f = !1;
  }
  f && (o.set(l, u), s(u, l, r, i, o), o.delete(l)), ic(n, e, u);
}
var wg = bg, Tg = k6, Ag = wh, Sg = H6, Rg = wg, kg = xn, Og = $h, Ng = Mh;
function Dh(n, t, e, r, s) {
  n !== t && Sg(t, function(i, o) {
    if (s || (s = new Tg()), kg(i))
      Rg(n, t, o, e, Dh, r, s);
    else {
      var a = r ? r(Ng(n, o), i, o + "", n, t, s) : void 0;
      a === void 0 && (a = i), Ag(n, o, a);
    }
  }, Og);
}
var Ig = Dh;
function Mg(n) {
  return n;
}
var Fh = Mg;
function Pg(n, t, e) {
  switch (e.length) {
    case 0:
      return n.call(t);
    case 1:
      return n.call(t, e[0]);
    case 2:
      return n.call(t, e[0], e[1]);
    case 3:
      return n.call(t, e[0], e[1], e[2]);
  }
  return n.apply(t, e);
}
var $g = Pg, Dg = $g, cc = Math.max;
function Fg(n, t, e) {
  return t = cc(t === void 0 ? n.length - 1 : t, 0), function() {
    for (var r = arguments, s = -1, i = cc(r.length - t, 0), o = Array(i); ++s < i; )
      o[s] = r[t + s];
    s = -1;
    for (var a = Array(t + 1); ++s < t; )
      a[s] = r[s];
    return a[t] = e(o), Dg(n, this, a);
  };
}
var Bg = Fg;
function Ug(n) {
  return function() {
    return n;
  };
}
var Hg = Ug, Gg = Hg, uc = bh, jg = Fh, Vg = uc ? function(n, t) {
  return uc(n, "toString", {
    configurable: !0,
    enumerable: !1,
    value: Gg(t),
    writable: !0
  });
} : jg, zg = Vg, Zg = 800, Wg = 16, qg = Date.now;
function Kg(n) {
  var t = 0, e = 0;
  return function() {
    var r = qg(), s = Wg - (r - e);
    if (e = r, s > 0) {
      if (++t >= Zg)
        return arguments[0];
    } else
      t = 0;
    return n.apply(void 0, arguments);
  };
}
var Yg = Kg, Xg = zg, Qg = Yg, Jg = Qg(Xg), tx = Jg, ex = Fh, nx = Bg, rx = tx;
function sx(n, t) {
  return rx(nx(n, t, ex), n + "");
}
var ix = sx, ox = _i, ax = f1, lx = Ph, cx = xn;
function ux(n, t, e) {
  if (!cx(e))
    return !1;
  var r = typeof t;
  return (r == "number" ? ax(e) && lx(t, e.length) : r == "string" && t in e) ? ox(e[t], n) : !1;
}
var hx = ux, fx = ix, dx = hx;
function px(n) {
  return fx(function(t, e) {
    var r = -1, s = e.length, i = s > 1 ? e[s - 1] : void 0, o = s > 2 ? e[2] : void 0;
    for (i = n.length > 3 && typeof i == "function" ? (s--, i) : void 0, o && dx(e[0], e[1], o) && (i = s < 3 ? void 0 : i, s = 1), t = Object(t); ++r < s; ) {
      var a = e[r];
      a && n(t, a, r, i);
    }
    return t;
  });
}
var gx = px, xx = Ig, mx = gx, _x = mx(function(n, t, e, r) {
  xx(n, t, e, r);
}), Lx = _x;
let vx = class {
  constructor(t, e, r, s, i, o, a, l, c, u) {
    this.name = t, this.stereotype = r, this.width = s, this.groupId = i, this.explicit = a, this.isStarter = e, this.label = o, this.type = l, this.color = c, this.comment = u;
  }
  Type() {
    var t;
    switch ((t = this.type) == null ? void 0 : t.toLowerCase()) {
      case "@actor":
        return 1;
      case "@boundary":
        return 2;
      case "@collection":
        return 3;
      case "@control":
        return 4;
      case "@database":
        return 5;
      case "@entity":
        return 6;
      case "@queue":
        return 7;
      case "@ec2":
        return 8;
      case "@ecs":
        return 9;
      case "@iam":
        return 10;
      case "@lambda":
        return 11;
      case "@rds":
        return 12;
      case "@s3":
        return 13;
    }
    return 14;
  }
}, yx = class {
  constructor() {
    this.participants = /* @__PURE__ */ new Map();
  }
  Add(t, e, r, s, i, o, a, l, c, u) {
    const f = new vx(
      t,
      e,
      r,
      s,
      i,
      o,
      a,
      l,
      c,
      u
    );
    this.participants.set(
      t,
      Lx({}, this.Get(t), f, (d, p) => d || p)
    );
  }
  ImplicitArray() {
    return this.Array().filter((t) => !t.explicit && !t.isStarter);
  }
  Array() {
    return Array.from(this.participants.entries()).map((t) => t[1]);
  }
  Names() {
    return Array.from(this.participants.keys());
  }
  First() {
    return this.participants.values().next().value;
  }
  Get(t) {
    return this.participants.get(t);
  }
  Size() {
    return this.participants.size;
  }
  Starter() {
    const t = this.First();
    return t.isStarter ? t : void 0;
  }
};
const Cx = h, Ex = Cx.ProgContext;
let Ne, mn = !1, d1;
const Zt = new v();
let bx = function(n) {
  var c, u, f, d, p, w, I;
  if (mn)
    return;
  const t = (c = n == null ? void 0 : n.participantType()) == null ? void 0 : c.getFormattedText().replace("@", ""), e = ((u = n == null ? void 0 : n.name()) == null ? void 0 : u.getFormattedText()) || "Missing `Participant`", r = (d = (f = n.stereotype()) == null ? void 0 : f.name()) == null ? void 0 : d.getFormattedText(), s = n.width && n.width() && Number.parseInt(n.width().getText()) || void 0, i = n.label && ((w = (p = n.label()) == null ? void 0 : p.name()) == null ? void 0 : w.getFormattedText()), o = !0, a = (I = n.COLOR()) == null ? void 0 : I.getText(), l = n.getComment();
  Ne.Add(
    e,
    !1,
    r,
    s,
    d1,
    i,
    o,
    t,
    a,
    l
  );
};
Zt.enterParticipant = bx;
let Bh = function(n) {
  if (mn)
    return;
  let t = n.getFormattedText();
  Ne.Add(t);
};
Zt.enterFrom = Bh;
Zt.enterTo = Bh;
Zt.enterStarter = function(n) {
  let t = n.getFormattedText();
  Ne.Add(t, !0);
};
Zt.enterCreation = function(n) {
  if (mn)
    return;
  const t = n.Owner();
  Ne.Add(t);
};
Zt.enterParameters = function() {
  mn = !0;
};
Zt.exitParameters = function() {
  mn = !1;
};
Zt.enterCondition = function() {
  mn = !0;
};
Zt.exitCondition = function() {
  mn = !1;
};
Zt.enterGroup = function(n) {
  var t;
  d1 = (t = n.name()) == null ? void 0 : t.getFormattedText();
};
Zt.exitGroup = function() {
  d1 = void 0;
};
Zt.enterRet = function(n) {
  n.asyncMessage() || (Ne.Add(n.From()), Ne.Add(n.ReturnTo()));
};
const wx = _.tree.ParseTreeWalker.DEFAULT;
Zt.getParticipants = function(n, t) {
  return Ne = new yx(), t && n instanceof Ex && Ne.Add(n.Starter(), !0), wx.walk(this, n), Ne;
};
const Tx = _.tree.ParseTreeWalker.DEFAULT;
var le = new v(), Nt = 0, ae = 0;
le.enterTcf = function() {
  Nt++;
};
le.enterOpt = function() {
  Nt++;
};
le.enterPar = function() {
  Nt++;
};
le.enterAlt = function() {
  Nt++;
};
le.enterLoop = function() {
  Nt++;
};
le.exitTcf = function() {
  ae = Math.max(ae, Nt), Nt--;
};
le.exitOpt = function() {
  ae = Math.max(ae, Nt), Nt--;
};
le.exitPar = function() {
  ae = Math.max(ae, Nt), Nt--;
};
le.exitAlt = function() {
  ae = Math.max(ae, Nt), Nt--;
};
le.exitLoop = function() {
  ae = Math.max(ae, Nt), Nt--;
};
le.depth = function(n) {
  return function(t) {
    return Nt = 0, ae = 0, t.children.map(function(e) {
      Tx.walk(n, e);
    }), ae;
  };
};
const Ax = h, Sx = Ax.TitleContext;
Sx.prototype.content = function() {
  return this.children.length < 2 ? "Untiled" : this.children[1].getText().trim();
};
const Uh = h, Fo = Uh.CreationContext;
Fo.prototype.Body = Fo.prototype.creationBody;
Fo.prototype.isCurrent = function(n) {
  return Hh.bind(this)(n);
};
const Bo = Uh.MessageContext;
Bo.prototype.Body = Bo.prototype.messageBody;
Bo.prototype.isCurrent = function(n) {
  return Hh.bind(this)(n);
};
function Hh(n) {
  try {
    if (n == null)
      return !1;
    const t = this.start.start, e = this.Body().stop.stop + 1;
    return n >= t && n <= e;
  } catch {
    return !1;
  }
}
const p1 = h, bi = p1.CreationContext, g1 = p1.MessageContext, Gh = p1.AsyncMessageContext;
bi.prototype.Assignee = function() {
  var n, t, e;
  return (e = (t = (n = this.creationBody()) == null ? void 0 : n.assignment()) == null ? void 0 : t.assignee()) == null ? void 0 : e.getFormattedText();
};
bi.prototype.Constructor = function() {
  var n, t;
  return (t = (n = this.creationBody()) == null ? void 0 : n.construct()) == null ? void 0 : t.getFormattedText();
};
bi.prototype.Owner = function() {
  if (!this.Constructor())
    return "Missing Constructor";
  const n = this.Assignee(), t = this.Constructor();
  return n ? `${n}:${t}` : t;
};
g1.prototype.To = function() {
  var n, t;
  return (t = (n = this.messageBody()) == null ? void 0 : n.to()) == null ? void 0 : t.getFormattedText();
};
g1.prototype.Owner = function() {
  return this.To() || jh(this.parentCtx);
};
function jh(n) {
  for (; n; ) {
    if (n instanceof bi || n instanceof g1)
      return n.Owner();
    n = n.parentCtx;
  }
}
Gh.prototype.To = function() {
  var n;
  return (n = this.to()) == null ? void 0 : n.getFormattedText();
};
Gh.prototype.Owner = function() {
  return this.To() || jh(this.parentCtx);
};
const Rx = h.ProgContext;
Rx.prototype.Starter = function() {
  var i, o, a, l, c, u, f, d, p, w, I, W;
  const n = (a = (o = (i = this.head()) == null ? void 0 : i.starterExp()) == null ? void 0 : o.starter()) == null ? void 0 : a.getFormattedText();
  let t, e, r;
  const s = (l = this.block()) == null ? void 0 : l.stat();
  if (s && s[0]) {
    const $ = (f = (u = (c = s[0].message()) == null ? void 0 : c.messageBody()) == null ? void 0 : u.from()) == null ? void 0 : f.getFormattedText(), j = (p = (d = s[0].asyncMessage()) == null ? void 0 : d.from()) == null ? void 0 : p.getFormattedText();
    t = $ || j;
  } else {
    const $ = (w = this.head()) == null ? void 0 : w.children;
    if ($ && $[0]) {
      const j = $[0];
      if (j instanceof h.ParticipantContext && (e = (I = j.name()) == null ? void 0 : I.getFormattedText()), j instanceof h.GroupContext) {
        const it = j.participant();
        it && it[0] && (r = (W = it[0].name()) == null ? void 0 : W.getFormattedText());
      }
    }
  }
  return n || t || e || r || "_STARTER_";
};
const wi = h, kx = wi.RetContext, hc = wi.ProgContext, fc = wi.MessageContext, Ox = wi.CreationContext;
kx.prototype.ReturnTo = function() {
  var r, s;
  const e = this.parentCtx.parentCtx.parentCtx;
  if (e instanceof hc)
    return e.Starter();
  {
    let i = e;
    for (; i && !(i instanceof fc) && !(i instanceof Ox); ) {
      if (i instanceof hc)
        return i.Starter();
      i = i.parentCtx;
    }
    return i instanceof fc && ((s = (r = i.messageBody()) == null ? void 0 : r.from()) == null ? void 0 : s.getFormattedText()) || i.ClosestAncestorStat().Origin();
  }
};
const Nx = h.StatContext, Ix = h.ProgContext, Mx = h.MessageContext, Px = h.CreationContext;
Nx.prototype.Origin = function() {
  let n = this.parentCtx;
  for (; n; ) {
    if (n instanceof Ix)
      return n.Starter();
    if (n instanceof Mx || n instanceof Px) {
      const t = n.Owner();
      if (t)
        return t;
    }
    n = n.parentCtx;
  }
};
const $x = h, Dx = $x.DividerContext;
Dx.prototype.Note = function() {
  var t;
  let n = (t = this.dividerNote()) == null ? void 0 : t.getFormattedText().trim();
  if (!n.startsWith("=="))
    throw new Error("Divider note must start with ==");
  return n == null ? void 0 : n.replace(/^=+|=+$/g, "");
};
const x1 = h, Fx = x1.MessageContext, Bx = x1.AsyncMessageContext, Ux = x1.CreationContext;
Fx.prototype.SignatureText = function() {
  var n, t, e;
  return (e = (t = (n = this.messageBody()) == null ? void 0 : n.func()) == null ? void 0 : t.signature()) == null ? void 0 : e.map((r) => r == null ? void 0 : r.getFormattedText()).join(".");
};
Bx.prototype.SignatureText = function() {
  var n;
  return (n = this.content()) == null ? void 0 : n.getFormattedText();
};
Ux.prototype.SignatureText = function() {
  var e;
  const n = this.creationBody().parameters();
  return "«" + (((e = n == null ? void 0 : n.parameter()) == null ? void 0 : e.length) > 0 ? n.getFormattedText() : "create") + "»";
};
const Hx = h, Gx = Hx.MessageContext;
class jx {
  constructor(t, e) {
    if (e && !t)
      throw new Error("assignee must be defined if type is defined");
    this.assignee = t || "", this.type = e || "";
  }
  getText() {
    return [this.assignee, this.type].filter(Boolean).join(":");
  }
}
Gx.prototype.Assignment = function() {
  var r, s;
  let n = this.messageBody().assignment();
  const t = (r = n == null ? void 0 : n.assignee()) == null ? void 0 : r.getFormattedText(), e = (s = n == null ? void 0 : n.type()) == null ? void 0 : s.getFormattedText();
  if (t)
    return new jx(t, e);
};
const Gr = h, Vx = Gr.CreationContext, zx = Gr.StatContext, Vh = Gr.MessageContext, Zx = Gr.AsyncMessageContext, Wx = Gr.RetContext;
Vx.prototype.From = function() {
  if (this.parentCtx instanceof zx)
    return this.ClosestAncestorStat().Origin();
};
Vh.prototype.ProvidedFrom = function() {
  var n, t;
  return (t = (n = this.messageBody()) == null ? void 0 : n.from()) == null ? void 0 : t.getFormattedText();
};
Vh.prototype.From = function() {
  return this.ProvidedFrom() || this.ClosestAncestorStat().Origin();
};
Zx.prototype.From = function() {
  return this.from() ? this.from().getFormattedText() : this.ClosestAncestorStat().Origin();
};
Wx.prototype.From = function() {
  return this.ClosestAncestorStat().Origin();
};
_.ParserRuleContext.prototype.Key = function() {
  return `${this.start.start}:${this.stop.stop}`;
};
const zh = h, dc = zh.StatContext;
_.ParserRuleContext.prototype.ClosestAncestorStat = function() {
  let n = this;
  for (; !(n instanceof dc); )
    n = n.parentCtx;
  if (n instanceof dc)
    return n;
};
_.ParserRuleContext.prototype.ClosestAncestorBlock = function() {
  var t;
  const n = (t = this.ClosestAncestorStat()) == null ? void 0 : t.parentCtx;
  if (n instanceof zh.BlockContext)
    return n;
  console.warn("Cannot find closest ancestor block for context:", this);
};
function qx(n, t) {
  switch (n) {
    case 0:
      return function() {
        return t.apply(this, arguments);
      };
    case 1:
      return function(e) {
        return t.apply(this, arguments);
      };
    case 2:
      return function(e, r) {
        return t.apply(this, arguments);
      };
    case 3:
      return function(e, r, s) {
        return t.apply(this, arguments);
      };
    case 4:
      return function(e, r, s, i) {
        return t.apply(this, arguments);
      };
    case 5:
      return function(e, r, s, i, o) {
        return t.apply(this, arguments);
      };
    case 6:
      return function(e, r, s, i, o, a) {
        return t.apply(this, arguments);
      };
    case 7:
      return function(e, r, s, i, o, a, l) {
        return t.apply(this, arguments);
      };
    case 8:
      return function(e, r, s, i, o, a, l, c) {
        return t.apply(this, arguments);
      };
    case 9:
      return function(e, r, s, i, o, a, l, c, u) {
        return t.apply(this, arguments);
      };
    case 10:
      return function(e, r, s, i, o, a, l, c, u, f) {
        return t.apply(this, arguments);
      };
    default:
      throw new Error("First argument to _arity must be a non-negative integer no greater than ten");
  }
}
var Zh = qx;
function Kx(n, t) {
  return function() {
    return t.call(this, n.apply(this, arguments));
  };
}
var Yx = Kx;
function Xx(n) {
  return n != null && typeof n == "object" && n["@@functional/placeholder"] === !0;
}
var m1 = Xx, Qx = m1;
function Jx(n) {
  return function t(e) {
    return arguments.length === 0 || Qx(e) ? t : n.apply(this, arguments);
  };
}
var Ti = Jx, Xi = Ti, ar = m1;
function tm(n) {
  return function t(e, r) {
    switch (arguments.length) {
      case 0:
        return t;
      case 1:
        return ar(e) ? t : Xi(function(s) {
          return n(e, s);
        });
      default:
        return ar(e) && ar(r) ? t : ar(e) ? Xi(function(s) {
          return n(s, r);
        }) : ar(r) ? Xi(function(s) {
          return n(e, s);
        }) : n(e, r);
    }
  };
}
var Wh = tm, ps = Ti, Tn = Wh, kt = m1;
function em(n) {
  return function t(e, r, s) {
    switch (arguments.length) {
      case 0:
        return t;
      case 1:
        return kt(e) ? t : Tn(function(i, o) {
          return n(e, i, o);
        });
      case 2:
        return kt(e) && kt(r) ? t : kt(e) ? Tn(function(i, o) {
          return n(i, r, o);
        }) : kt(r) ? Tn(function(i, o) {
          return n(e, i, o);
        }) : ps(function(i) {
          return n(e, r, i);
        });
      default:
        return kt(e) && kt(r) && kt(s) ? t : kt(e) && kt(r) ? Tn(function(i, o) {
          return n(i, o, s);
        }) : kt(e) && kt(s) ? Tn(function(i, o) {
          return n(i, r, o);
        }) : kt(r) && kt(s) ? Tn(function(i, o) {
          return n(e, i, o);
        }) : kt(e) ? ps(function(i) {
          return n(i, r, s);
        }) : kt(r) ? ps(function(i) {
          return n(e, i, s);
        }) : kt(s) ? ps(function(i) {
          return n(e, r, i);
        }) : n(e, r, s);
    }
  };
}
var _1 = em, qh = Array.isArray || function(t) {
  return t != null && t.length >= 0 && Object.prototype.toString.call(t) === "[object Array]";
};
function nm(n) {
  return Object.prototype.toString.call(n) === "[object String]";
}
var rm = nm, sm = Ti, im = qh, om = rm, am = /* @__PURE__ */ sm(function(t) {
  return im(t) ? !0 : !t || typeof t != "object" || om(t) ? !1 : t.length === 0 ? !0 : t.length > 0 ? t.hasOwnProperty(0) && t.hasOwnProperty(t.length - 1) : !1;
}), lm = am, cm = /* @__PURE__ */ function() {
  function n(t) {
    this.f = t;
  }
  return n.prototype["@@transducer/init"] = function() {
    throw new Error("init not implemented on XWrap");
  }, n.prototype["@@transducer/result"] = function(t) {
    return t;
  }, n.prototype["@@transducer/step"] = function(t, e) {
    return this.f(t, e);
  }, n;
}();
function um(n) {
  return new cm(n);
}
var hm = um, fm = Zh, dm = Wh, pm = /* @__PURE__ */ dm(function(t, e) {
  return fm(t.length, function() {
    return t.apply(e, arguments);
  });
}), gm = pm, xm = lm, mm = hm, _m = gm;
function Lm(n, t, e) {
  for (var r = 0, s = e.length; r < s; ) {
    if (t = n["@@transducer/step"](t, e[r]), t && t["@@transducer/reduced"]) {
      t = t["@@transducer/value"];
      break;
    }
    r += 1;
  }
  return n["@@transducer/result"](t);
}
function pc(n, t, e) {
  for (var r = e.next(); !r.done; ) {
    if (t = n["@@transducer/step"](t, r.value), t && t["@@transducer/reduced"]) {
      t = t["@@transducer/value"];
      break;
    }
    r = e.next();
  }
  return n["@@transducer/result"](t);
}
function gc(n, t, e, r) {
  return n["@@transducer/result"](e[r](_m(n["@@transducer/step"], n), t));
}
var xc = typeof Symbol < "u" ? Symbol.iterator : "@@iterator";
function vm(n, t, e) {
  if (typeof n == "function" && (n = mm(n)), xm(e))
    return Lm(n, t, e);
  if (typeof e["fantasy-land/reduce"] == "function")
    return gc(n, t, e, "fantasy-land/reduce");
  if (e[xc] != null)
    return pc(n, t, e[xc]());
  if (typeof e.next == "function")
    return pc(n, t, e);
  if (typeof e.reduce == "function")
    return gc(n, t, e, "reduce");
  throw new TypeError("reduce: list must be array or iterable");
}
var ym = vm, Cm = _1, Em = ym, bm = /* @__PURE__ */ Cm(Em), wm = bm, Tm = qh;
function Am(n, t) {
  return function() {
    var e = arguments.length;
    if (e === 0)
      return t();
    var r = arguments[e - 1];
    return Tm(r) || typeof r[n] != "function" ? t.apply(this, arguments) : r[n].apply(r, Array.prototype.slice.call(arguments, 0, e - 1));
  };
}
var Kh = Am, Sm = Kh, Rm = _1, km = /* @__PURE__ */ Rm(
  /* @__PURE__ */ Sm("slice", function(t, e, r) {
    return Array.prototype.slice.call(r, t, e);
  })
), Om = km, Nm = Kh, Im = Ti, Mm = Om, Pm = /* @__PURE__ */ Im(
  /* @__PURE__ */ Nm(
    "tail",
    /* @__PURE__ */ Mm(1, 1 / 0)
  )
), $m = Pm, Dm = Zh, Fm = Yx, Bm = wm, Um = $m;
function Hm() {
  if (arguments.length === 0)
    throw new Error("pipe requires at least one argument");
  return Dm(arguments[0].length, Bm(Fm, arguments[0], Um(arguments)));
}
var Gm = Hm;
const jm = Gm;
var Vm = _1, zm = /* @__PURE__ */ Vm(function(t, e, r) {
  return r.replace(t, e);
}), Zm = zm;
const jr = Zm, Wm = jr(/[\n\r]/g, " "), qm = jr(/\s+/g, " "), Km = jr(/\s*([,;.()])\s*/g, "$1"), Ym = jr(/\s+$/g, ""), Xm = jr(/^"(.*)"$/, "$1"), Qm = jm(
  Wm,
  qm,
  Km,
  Ym,
  Xm
);
class Jm extends _.error.ErrorListener {
  syntaxError(t, e, r, s, i) {
  }
}
function t_(n) {
  const t = new _.InputStream(n), e = new A(t), r = new _.CommonTokenStream(e), s = new h(r);
  return s.addErrorListener(new Jm()), s._syntaxErrors ? null : s.prog();
}
_.ParserRuleContext.prototype.getFormattedText = function() {
  const n = this.parser.getTokenStream().getText(this.getSourceInterval());
  return Qm(n);
};
_.ParserRuleContext.prototype.getComment = function() {
  let n = this.start.tokenIndex, t = A.channelNames.indexOf("COMMENT_CHANNEL");
  this.constructor.name === "BraceBlockContext" && (n = this.stop.tokenIndex);
  let e = this.parser.getTokenStream().getHiddenTokensToLeft(n, t);
  return e && e.map((r) => r.text.substring(2)).join("");
};
_.ParserRuleContext.prototype.returnedValue = function() {
  return this.braceBlock().block().ret().value();
};
const e_ = h.ProgContext, n_ = t_, Yh = h.GroupContext, Xh = h.ParticipantContext, Qh = function(n) {
  const t = le;
  return t.depth(t)(n);
}, Ai = function(n, t) {
  return Zt.getParticipants(n, t);
};
function qs(n, t) {
  let e = document.querySelector(".textarea-hidden-div");
  if (!e) {
    const s = document.createElement("div");
    s.className = "textarea-hidden-div ", s.style.fontSize = "13px", s.style.fontFamily = "Helvetica, Verdana, serif", s.style.display = "inline", s.style.whiteSpace = "nowrap", s.style.visibility = "hidden", s.style.position = "absolute", s.style.top = "0", s.style.left = "0", s.style.overflow = "hidden", s.style.width = "0px", s.style.paddingLeft = "20px", s.style.paddingRight = "20px", s.style.margin = "0px", s.style.border = "0px", document.body.appendChild(s), e = s;
  }
  return e.innerHTML = n, e.scrollWidth;
}
const r_ = 100, mc = 20, _c = 10, s_ = 100;
var Hn = /* @__PURE__ */ ((n) => (n[n.MessageContent = 0] = "MessageContent", n[n.ParticipantName = 1] = "ParticipantName", n))(Hn || {});
const i_ = h;
class L1 extends v {
  constructor() {
    super(...arguments), this.explicitParticipants = [], this.starter = "", this.implicitParticipants = [], this.isBlind = !1;
  }
  enterCondition() {
    this.isBlind = !0;
  }
  exitCondition() {
    this.isBlind = !1;
  }
  enterParameters() {
    this.isBlind = !0;
  }
  exitParameters() {
    this.isBlind = !1;
  }
  enterStarter(t) {
    this.starter = t.getFormattedText();
  }
  enterParticipant(t) {
    var i, o, a;
    const e = ((i = t == null ? void 0 : t.name()) == null ? void 0 : i.getFormattedText()) || "Missing `Participant` name", r = (a = (o = t.label()) == null ? void 0 : o.name()) == null ? void 0 : a.getFormattedText(), s = { name: e, label: r, left: "" };
    this.explicitParticipants.push(s);
  }
  enterFrom(t) {
    if (this.isBlind)
      return;
    const e = t == null ? void 0 : t.getFormattedText();
    if (t.ClosestAncestorBlock().parentCtx instanceof i_.ProgContext && t.ClosestAncestorStat() === t.ClosestAncestorBlock().children[0]) {
      this.starter = e;
      return;
    }
    this.enterTo(t);
  }
  enterTo(t) {
    if (this.isBlind)
      return;
    const e = t == null ? void 0 : t.getFormattedText();
    if (e === this.starter || this.explicitParticipants.some((s) => s.name === e))
      return;
    const r = { name: e, left: "" };
    this.implicitParticipants.push(r);
  }
  enterCreation(t) {
    if (this.isBlind)
      return;
    const e = t == null ? void 0 : t.Owner();
    if (e === this.starter || this.explicitParticipants.some((s) => s.name === e))
      return;
    const r = { name: e, left: "" };
    this.implicitParticipants.push(r);
  }
  result() {
    let t = [...this.explicitParticipants, ...this.implicitParticipants];
    return this._isStarterExplicitlyPositioned() || t.unshift(this._getStarter()), t = this._dedup(t), L1._assignLeft(t), t;
  }
  _isStarterExplicitlyPositioned() {
    return this.starter && this.explicitParticipants.find((t) => t.name === this.starter);
  }
  _getStarter() {
    return { name: this.starter || "_STARTER_", left: "" };
  }
  _dedup(t) {
    return t.filter((e, r) => t.findIndex((s) => s.name === e.name) === r);
  }
  static _assignLeft(t) {
    t.reduce(
      (e, r) => (r.left = e.name || "", r),
      { name: "", left: "" }
    );
  }
}
function o_(n) {
  const t = new L1();
  return _.tree.ParseTreeWalker.DEFAULT.walk(t, n), t.result();
}
function Si(n, t) {
  return { position: n, velocity: t };
}
function Lc(n, t) {
  return Si(n.position + t.position, n.velocity + t.velocity);
}
const vc = Math.sqrt(Number.EPSILON);
function a_(n, t) {
  let e = n.position - t.position;
  return e < -vc || Math.abs(e) <= vc && n.velocity < t.velocity;
}
function l_() {
  return {
    delta: 1 / 0,
    dualLessThan: function(n, t) {
      let e = a_(n, t);
      return e && ([n, t] = [t, n]), n.velocity < t.velocity && (this.delta = Math.min(this.delta, (n.position - t.position) / (t.velocity - n.velocity))), e;
    }
  };
}
function c_(n, t) {
  let e = Array();
  for (let r = 0; r < n; r++) {
    e.push([]);
    for (let s = 0; s < r; s++)
      t[s][r] > 0 && e[r].push({ i: s, length: Si(t[s][r], 0) });
  }
  return e;
}
function u_(n, t) {
  let e = l_(), r = Si(0, 0), s = [];
  for (let i = 0; i < n.length; i++) {
    let o = null;
    i > 0 && (r = Lc(r, t[i - 1]));
    for (let a of n[i]) {
      let l = Lc(s[a.i].maximum, a.length);
      e.dualLessThan(r, l) && (o = a.i, r = l);
    }
    s.push({ argument: o, maximum: r });
  }
  return [e.delta, s];
}
function h_(n, t, e) {
  let r = n.length - 1;
  for (; r > 0; ) {
    let s = n[r].argument;
    s !== null ? r = s : (r--, e[r].velocity = 0);
  }
}
function f_(n, t) {
  for (let e = 0; e < n.length; e++)
    n[e].position += n[e].velocity * t;
}
function d_(n) {
  let t = [];
  for (let e of n)
    t.push(e.maximum.position);
  return t;
}
function p_(n) {
  const t = n.length;
  let e = c_(t, n), r = [];
  for (let s = 1; s < t; s++)
    r.push(Si(0, 1));
  for (; ; ) {
    let [s, i] = u_(e, r);
    if (s == 1 / 0)
      return d_(i);
    i[t - 1].maximum.velocity > 0 ? h_(i, e, r) : f_(r, s);
  }
}
var gr = /* @__PURE__ */ ((n) => (n[n.SyncMessage = 0] = "SyncMessage", n[n.AsyncMessage = 1] = "AsyncMessage", n[n.CreationMessage = 2] = "CreationMessage", n))(gr || {});
class g_ extends v {
  constructor() {
    super(...arguments), this.isBlind = !1, this.ownableMessages = [], this.enterMessage = (t) => this._addOwnedMessage(gr.SyncMessage)(t), this.enterAsyncMessage = (t) => this._addOwnedMessage(gr.AsyncMessage)(t), this.enterCreation = (t) => this._addOwnedMessage(gr.CreationMessage)(t), this._addOwnedMessage = (t) => (e) => {
      if (this.isBlind)
        return;
      let r = e.From();
      const s = e == null ? void 0 : e.Owner(), i = e == null ? void 0 : e.SignatureText();
      this.ownableMessages.push({ from: r, signature: i, type: t, to: s });
    };
  }
  enterParameters() {
    this.isBlind = !0;
  }
  exitParameters() {
    this.isBlind = !1;
  }
  result() {
    return this.ownableMessages;
  }
}
function x_(n) {
  const t = _.tree.ParseTreeWalker.DEFAULT, e = new g_();
  return t.walk(e, n), e.result();
}
class Nn {
  constructor(t, e) {
    this.m = [], this.participantModels = o_(t), this.ownableMessages = x_(t), this.widthProvider = e, this.walkThrough();
  }
  getPosition(t) {
    const e = this.participantModels.findIndex((r) => r.name === t);
    if (e === -1)
      throw Error(`Participant ${t} not found`);
    return this.getParticipantGap(this.participantModels[0]) + p_(this.m)[e] + _c;
  }
  walkThrough() {
    this.withParticipantGaps(this.participantModels), this.withMessageGaps(this.ownableMessages, this.participantModels);
  }
  withMessageGaps(t, e) {
    t.forEach((r) => {
      const s = e.findIndex((l) => l.name === r.from), i = e.findIndex((l) => l.name === r.to);
      if (s === -1 || i === -1) {
        console.warn(`Participant ${r.from} or ${r.to} not found`);
        return;
      }
      let o = Math.min(s, i), a = Math.max(s, i);
      try {
        let l = this.getMessageWidth(r);
        this.m[o][a] = Math.max(
          l + _c,
          this.m[o][a]
        );
      } catch {
        console.warn(`Could not set message gap between ${r.from} and ${r.to}`);
      }
    });
  }
  getMessageWidth(t) {
    const e = Nn.half(this.widthProvider, t.to);
    let r = this.widthProvider(t.signature, Hn.MessageContent);
    return t.type === gr.CreationMessage && (r += e), r;
  }
  withParticipantGaps(t) {
    this.m = t.map((e, r) => t.map((s, i) => i - r === 1 ? this.getParticipantGap(s) : 0));
  }
  getParticipantGap(t) {
    let e = this.labelOrName(t.left);
    const r = Nn.half(this.widthProvider, e), s = Nn.half(this.widthProvider, t.label || t.name), i = t.left && t.left !== "_STARTER_", o = t.name && t.name !== "_STARTER_";
    return (i && r || 0) + (o && s || 0);
  }
  labelOrName(t) {
    const e = this.participantModels.findIndex((r) => r.name === t);
    return e === -1 ? "" : this.participantModels[e].label || this.participantModels[e].name;
  }
  static half(t, e) {
    if (e === "_STARTER_")
      return mc / 2;
    const r = this.halfWithMargin(t, e);
    return Math.max(r, r_ / 2);
  }
  static halfWithMargin(t, e) {
    return this._getParticipantWidth(t, e) / 2 + mc / 2;
  }
  static _getParticipantWidth(t, e) {
    return Math.max(
      t(e || "", Hn.ParticipantName),
      s_
    );
  }
  getWidth() {
    const t = this.participantModels[this.participantModels.length - 1].name, e = this.getPosition(t) + Nn.halfWithMargin(this.widthProvider, t);
    return Math.max(e, 200);
  }
}
let Jh = 0;
setTimeout(function() {
  Jh || console.warn("[vue-sequence] Store is a function and is not initiated in 1 second.");
}, 1e3);
const m_ = () => (Jh = J4(), {
  state: {
    warning: void 0,
    code: "",
    theme: "naked",
    scale: 1,
    selected: [],
    cursor: null,
    showTips: !1,
    onElementClick: (n) => {
      console.log("Element clicked", n);
    }
  },
  getters: {
    rootContext: (n) => n_(n.code),
    title: (n, t) => {
      var e, r;
      return (r = (e = t.rootContext) == null ? void 0 : e.title()) == null ? void 0 : r.content();
    },
    participants: (n, t) => Ai(t.rootContext, !0),
    coordinates: (n, t) => new Nn(t.rootContext, qs),
    centerOf: (n, t) => (e) => {
      if (!e)
        return console.error("[vue-sequence] centerOf: entity is undefined"), 0;
      try {
        return t.coordinates.getPosition(e) || 0;
      } catch (r) {
        return console.error(r), 0;
      }
    },
    GroupContext: () => Yh,
    ParticipantContext: () => Xh,
    cursor: (n) => n.cursor,
    distance: (n, t) => (e, r) => t.centerOf(e) - t.centerOf(r),
    distance2: (n, t) => (e, r) => !e || !r ? 0 : t.centerOf(r) - t.centerOf(e),
    onElementClick: (n) => n.onElementClick
  },
  mutations: {
    code: function(n, t) {
      n.code = t;
    },
    setScale: function(n, t) {
      n.scale = t;
    },
    onSelect: function(n, t) {
      n.selected.includes(t) ? n.selected = n.selected.filter((e) => e !== t) : n.selected.push(t);
    },
    cursor: function(n, t) {
      n.cursor = t;
    }
  },
  actions: {
    updateCode: function({ commit: n, getters: t }, e) {
      if (typeof e == "string")
        throw Error(
          "You are using a old version of vue-sequence. New version requires {code, cursor}."
        );
      n("code", e.code);
    }
  },
  strict: !1
});
var __ = function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", [e("div", {
    staticClass: "tooltip bottom whitespace-normal",
    attrs: {
      "data-tooltip": "We (the vendor) do not have access to your data. The diagram is generated in this browser."
    }
  }, [e("svg", {
    staticClass: "fill-current h-6 w-6 m-auto",
    attrs: {
      xmlns: "http://www.w3.org/2000/svg",
      "xml:space": "preserve",
      viewBox: "0 0 214.27 214.27"
    }
  }, [e("path", {
    attrs: {
      d: "M196.926 55.171c-.11-5.785-.215-11.25-.215-16.537a7.5 7.5 0 0 0-7.5-7.5c-32.075 0-56.496-9.218-76.852-29.01a7.498 7.498 0 0 0-10.457 0c-20.354 19.792-44.771 29.01-76.844 29.01a7.5 7.5 0 0 0-7.5 7.5c0 5.288-.104 10.755-.215 16.541-1.028 53.836-2.436 127.567 87.331 158.682a7.495 7.495 0 0 0 4.912 0c89.774-31.116 88.368-104.849 87.34-158.686zm-89.795 143.641c-76.987-27.967-75.823-89.232-74.79-143.351.062-3.248.122-6.396.164-9.482 30.04-1.268 54.062-10.371 74.626-28.285 20.566 17.914 44.592 27.018 74.634 28.285.042 3.085.102 6.231.164 9.477 1.032 54.121 2.195 115.388-74.798 143.356z"
    }
  }), e("path", {
    attrs: {
      d: "m132.958 81.082-36.199 36.197-15.447-15.447a7.501 7.501 0 0 0-10.606 10.607l20.75 20.75a7.477 7.477 0 0 0 5.303 2.196 7.477 7.477 0 0 0 5.303-2.196l41.501-41.5a7.498 7.498 0 0 0 .001-10.606 7.5 7.5 0 0 0-10.606-.001z"
    }
  })])])]);
}, L_ = [];
function et(n, t, e, r, s, i, o, a) {
  var l = typeof n == "function" ? n.options : n;
  t && (l.render = t, l.staticRenderFns = e, l._compiled = !0), r && (l.functional = !0), i && (l._scopeId = "data-v-" + i);
  var c;
  if (o ? (c = function(d) {
    d = d || this.$vnode && this.$vnode.ssrContext || this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext, !d && typeof __VUE_SSR_CONTEXT__ < "u" && (d = __VUE_SSR_CONTEXT__), s && s.call(this, d), d && d._registeredComponents && d._registeredComponents.add(o);
  }, l._ssrRegister = c) : s && (c = a ? function() {
    s.call(
      this,
      (l.functional ? this.parent : this).$root.$options.shadowRoot
    );
  } : s), c)
    if (l.functional) {
      l._injectStyles = c;
      var u = l.render;
      l.render = function(p, w) {
        return c.call(w), u(p, w);
      };
    } else {
      var f = l.beforeCreate;
      l.beforeCreate = f ? [].concat(f, c) : [c];
    }
  return {
    exports: n,
    options: l
  };
}
const v_ = {
  name: "Privacy"
}, yc = {};
var y_ = /* @__PURE__ */ et(
  v_,
  __,
  L_,
  !1,
  C_,
  "384a6fbc",
  null,
  null
);
function C_(n) {
  for (let t in yc)
    this[t] = yc[t];
}
const E_ = /* @__PURE__ */ function() {
  return y_.exports;
}();
var b_ = function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    staticClass: "title text-skin-title text-base font-semibold"
  }, [n._v(n._s(n.title))]);
}, w_ = [];
const T_ = {
  name: "DiagramTitle",
  props: ["context"],
  computed: {
    title: function() {
      var n;
      return (n = this.context) == null ? void 0 : n.content();
    }
  }
}, Cc = {};
var A_ = /* @__PURE__ */ et(
  T_,
  b_,
  w_,
  !1,
  S_,
  null,
  null,
  null
);
function S_(n) {
  for (let t in Cc)
    this[t] = Cc[t];
}
const R_ = /* @__PURE__ */ function() {
  return A_.exports;
}();
var v1 = { exports: {} }, k_ = {
  aliceblue: [240, 248, 255],
  antiquewhite: [250, 235, 215],
  aqua: [0, 255, 255],
  aquamarine: [127, 255, 212],
  azure: [240, 255, 255],
  beige: [245, 245, 220],
  bisque: [255, 228, 196],
  black: [0, 0, 0],
  blanchedalmond: [255, 235, 205],
  blue: [0, 0, 255],
  blueviolet: [138, 43, 226],
  brown: [165, 42, 42],
  burlywood: [222, 184, 135],
  cadetblue: [95, 158, 160],
  chartreuse: [127, 255, 0],
  chocolate: [210, 105, 30],
  coral: [255, 127, 80],
  cornflowerblue: [100, 149, 237],
  cornsilk: [255, 248, 220],
  crimson: [220, 20, 60],
  cyan: [0, 255, 255],
  darkblue: [0, 0, 139],
  darkcyan: [0, 139, 139],
  darkgoldenrod: [184, 134, 11],
  darkgray: [169, 169, 169],
  darkgreen: [0, 100, 0],
  darkgrey: [169, 169, 169],
  darkkhaki: [189, 183, 107],
  darkmagenta: [139, 0, 139],
  darkolivegreen: [85, 107, 47],
  darkorange: [255, 140, 0],
  darkorchid: [153, 50, 204],
  darkred: [139, 0, 0],
  darksalmon: [233, 150, 122],
  darkseagreen: [143, 188, 143],
  darkslateblue: [72, 61, 139],
  darkslategray: [47, 79, 79],
  darkslategrey: [47, 79, 79],
  darkturquoise: [0, 206, 209],
  darkviolet: [148, 0, 211],
  deeppink: [255, 20, 147],
  deepskyblue: [0, 191, 255],
  dimgray: [105, 105, 105],
  dimgrey: [105, 105, 105],
  dodgerblue: [30, 144, 255],
  firebrick: [178, 34, 34],
  floralwhite: [255, 250, 240],
  forestgreen: [34, 139, 34],
  fuchsia: [255, 0, 255],
  gainsboro: [220, 220, 220],
  ghostwhite: [248, 248, 255],
  gold: [255, 215, 0],
  goldenrod: [218, 165, 32],
  gray: [128, 128, 128],
  green: [0, 128, 0],
  greenyellow: [173, 255, 47],
  grey: [128, 128, 128],
  honeydew: [240, 255, 240],
  hotpink: [255, 105, 180],
  indianred: [205, 92, 92],
  indigo: [75, 0, 130],
  ivory: [255, 255, 240],
  khaki: [240, 230, 140],
  lavender: [230, 230, 250],
  lavenderblush: [255, 240, 245],
  lawngreen: [124, 252, 0],
  lemonchiffon: [255, 250, 205],
  lightblue: [173, 216, 230],
  lightcoral: [240, 128, 128],
  lightcyan: [224, 255, 255],
  lightgoldenrodyellow: [250, 250, 210],
  lightgray: [211, 211, 211],
  lightgreen: [144, 238, 144],
  lightgrey: [211, 211, 211],
  lightpink: [255, 182, 193],
  lightsalmon: [255, 160, 122],
  lightseagreen: [32, 178, 170],
  lightskyblue: [135, 206, 250],
  lightslategray: [119, 136, 153],
  lightslategrey: [119, 136, 153],
  lightsteelblue: [176, 196, 222],
  lightyellow: [255, 255, 224],
  lime: [0, 255, 0],
  limegreen: [50, 205, 50],
  linen: [250, 240, 230],
  magenta: [255, 0, 255],
  maroon: [128, 0, 0],
  mediumaquamarine: [102, 205, 170],
  mediumblue: [0, 0, 205],
  mediumorchid: [186, 85, 211],
  mediumpurple: [147, 112, 219],
  mediumseagreen: [60, 179, 113],
  mediumslateblue: [123, 104, 238],
  mediumspringgreen: [0, 250, 154],
  mediumturquoise: [72, 209, 204],
  mediumvioletred: [199, 21, 133],
  midnightblue: [25, 25, 112],
  mintcream: [245, 255, 250],
  mistyrose: [255, 228, 225],
  moccasin: [255, 228, 181],
  navajowhite: [255, 222, 173],
  navy: [0, 0, 128],
  oldlace: [253, 245, 230],
  olive: [128, 128, 0],
  olivedrab: [107, 142, 35],
  orange: [255, 165, 0],
  orangered: [255, 69, 0],
  orchid: [218, 112, 214],
  palegoldenrod: [238, 232, 170],
  palegreen: [152, 251, 152],
  paleturquoise: [175, 238, 238],
  palevioletred: [219, 112, 147],
  papayawhip: [255, 239, 213],
  peachpuff: [255, 218, 185],
  peru: [205, 133, 63],
  pink: [255, 192, 203],
  plum: [221, 160, 221],
  powderblue: [176, 224, 230],
  purple: [128, 0, 128],
  rebeccapurple: [102, 51, 153],
  red: [255, 0, 0],
  rosybrown: [188, 143, 143],
  royalblue: [65, 105, 225],
  saddlebrown: [139, 69, 19],
  salmon: [250, 128, 114],
  sandybrown: [244, 164, 96],
  seagreen: [46, 139, 87],
  seashell: [255, 245, 238],
  sienna: [160, 82, 45],
  silver: [192, 192, 192],
  skyblue: [135, 206, 235],
  slateblue: [106, 90, 205],
  slategray: [112, 128, 144],
  slategrey: [112, 128, 144],
  snow: [255, 250, 250],
  springgreen: [0, 255, 127],
  steelblue: [70, 130, 180],
  tan: [210, 180, 140],
  teal: [0, 128, 128],
  thistle: [216, 191, 216],
  tomato: [255, 99, 71],
  turquoise: [64, 224, 208],
  violet: [238, 130, 238],
  wheat: [245, 222, 179],
  white: [255, 255, 255],
  whitesmoke: [245, 245, 245],
  yellow: [255, 255, 0],
  yellowgreen: [154, 205, 50]
}, t2 = { exports: {} }, O_ = function(t) {
  return !t || typeof t == "string" ? !1 : t instanceof Array || Array.isArray(t) || t.length >= 0 && (t.splice instanceof Function || Object.getOwnPropertyDescriptor(t, t.length - 1) && t.constructor.name !== "String");
}, N_ = O_, I_ = Array.prototype.concat, M_ = Array.prototype.slice, Ec = t2.exports = function(t) {
  for (var e = [], r = 0, s = t.length; r < s; r++) {
    var i = t[r];
    N_(i) ? e = I_.call(e, M_.call(i)) : e.push(i);
  }
  return e;
};
Ec.wrap = function(n) {
  return function() {
    return n(Ec(arguments));
  };
};
var xr = k_, Vr = t2.exports, e2 = Object.hasOwnProperty, n2 = /* @__PURE__ */ Object.create(null);
for (var Qi in xr)
  e2.call(xr, Qi) && (n2[xr[Qi]] = Qi);
var Yt = v1.exports = {
  to: {},
  get: {}
};
Yt.get = function(n) {
  var t = n.substring(0, 3).toLowerCase(), e, r;
  switch (t) {
    case "hsl":
      e = Yt.get.hsl(n), r = "hsl";
      break;
    case "hwb":
      e = Yt.get.hwb(n), r = "hwb";
      break;
    default:
      e = Yt.get.rgb(n), r = "rgb";
      break;
  }
  return e ? { model: r, value: e } : null;
};
Yt.get.rgb = function(n) {
  if (!n)
    return null;
  var t = /^#([a-f0-9]{3,4})$/i, e = /^#([a-f0-9]{6})([a-f0-9]{2})?$/i, r = /^rgba?\(\s*([+-]?\d+)(?=[\s,])\s*(?:,\s*)?([+-]?\d+)(?=[\s,])\s*(?:,\s*)?([+-]?\d+)\s*(?:[,|\/]\s*([+-]?[\d\.]+)(%?)\s*)?\)$/, s = /^rgba?\(\s*([+-]?[\d\.]+)\%\s*,?\s*([+-]?[\d\.]+)\%\s*,?\s*([+-]?[\d\.]+)\%\s*(?:[,|\/]\s*([+-]?[\d\.]+)(%?)\s*)?\)$/, i = /^(\w+)$/, o = [0, 0, 0, 1], a, l, c;
  if (a = n.match(e)) {
    for (c = a[2], a = a[1], l = 0; l < 3; l++) {
      var u = l * 2;
      o[l] = parseInt(a.slice(u, u + 2), 16);
    }
    c && (o[3] = parseInt(c, 16) / 255);
  } else if (a = n.match(t)) {
    for (a = a[1], c = a[3], l = 0; l < 3; l++)
      o[l] = parseInt(a[l] + a[l], 16);
    c && (o[3] = parseInt(c + c, 16) / 255);
  } else if (a = n.match(r)) {
    for (l = 0; l < 3; l++)
      o[l] = parseInt(a[l + 1], 0);
    a[4] && (a[5] ? o[3] = parseFloat(a[4]) * 0.01 : o[3] = parseFloat(a[4]));
  } else if (a = n.match(s)) {
    for (l = 0; l < 3; l++)
      o[l] = Math.round(parseFloat(a[l + 1]) * 2.55);
    a[4] && (a[5] ? o[3] = parseFloat(a[4]) * 0.01 : o[3] = parseFloat(a[4]));
  } else
    return (a = n.match(i)) ? a[1] === "transparent" ? [0, 0, 0, 0] : e2.call(xr, a[1]) ? (o = xr[a[1]], o[3] = 1, o) : null : null;
  for (l = 0; l < 3; l++)
    o[l] = je(o[l], 0, 255);
  return o[3] = je(o[3], 0, 1), o;
};
Yt.get.hsl = function(n) {
  if (!n)
    return null;
  var t = /^hsla?\(\s*([+-]?(?:\d{0,3}\.)?\d+)(?:deg)?\s*,?\s*([+-]?[\d\.]+)%\s*,?\s*([+-]?[\d\.]+)%\s*(?:[,|\/]\s*([+-]?(?=\.\d|\d)(?:0|[1-9]\d*)?(?:\.\d*)?(?:[eE][+-]?\d+)?)\s*)?\)$/, e = n.match(t);
  if (e) {
    var r = parseFloat(e[4]), s = (parseFloat(e[1]) % 360 + 360) % 360, i = je(parseFloat(e[2]), 0, 100), o = je(parseFloat(e[3]), 0, 100), a = je(isNaN(r) ? 1 : r, 0, 1);
    return [s, i, o, a];
  }
  return null;
};
Yt.get.hwb = function(n) {
  if (!n)
    return null;
  var t = /^hwb\(\s*([+-]?\d{0,3}(?:\.\d+)?)(?:deg)?\s*,\s*([+-]?[\d\.]+)%\s*,\s*([+-]?[\d\.]+)%\s*(?:,\s*([+-]?(?=\.\d|\d)(?:0|[1-9]\d*)?(?:\.\d*)?(?:[eE][+-]?\d+)?)\s*)?\)$/, e = n.match(t);
  if (e) {
    var r = parseFloat(e[4]), s = (parseFloat(e[1]) % 360 + 360) % 360, i = je(parseFloat(e[2]), 0, 100), o = je(parseFloat(e[3]), 0, 100), a = je(isNaN(r) ? 1 : r, 0, 1);
    return [s, i, o, a];
  }
  return null;
};
Yt.to.hex = function() {
  var n = Vr(arguments);
  return "#" + gs(n[0]) + gs(n[1]) + gs(n[2]) + (n[3] < 1 ? gs(Math.round(n[3] * 255)) : "");
};
Yt.to.rgb = function() {
  var n = Vr(arguments);
  return n.length < 4 || n[3] === 1 ? "rgb(" + Math.round(n[0]) + ", " + Math.round(n[1]) + ", " + Math.round(n[2]) + ")" : "rgba(" + Math.round(n[0]) + ", " + Math.round(n[1]) + ", " + Math.round(n[2]) + ", " + n[3] + ")";
};
Yt.to.rgb.percent = function() {
  var n = Vr(arguments), t = Math.round(n[0] / 255 * 100), e = Math.round(n[1] / 255 * 100), r = Math.round(n[2] / 255 * 100);
  return n.length < 4 || n[3] === 1 ? "rgb(" + t + "%, " + e + "%, " + r + "%)" : "rgba(" + t + "%, " + e + "%, " + r + "%, " + n[3] + ")";
};
Yt.to.hsl = function() {
  var n = Vr(arguments);
  return n.length < 4 || n[3] === 1 ? "hsl(" + n[0] + ", " + n[1] + "%, " + n[2] + "%)" : "hsla(" + n[0] + ", " + n[1] + "%, " + n[2] + "%, " + n[3] + ")";
};
Yt.to.hwb = function() {
  var n = Vr(arguments), t = "";
  return n.length >= 4 && n[3] !== 1 && (t = ", " + n[3]), "hwb(" + n[0] + ", " + n[1] + "%, " + n[2] + "%" + t + ")";
};
Yt.to.keyword = function(n) {
  return n2[n.slice(0, 3)];
};
function je(n, t, e) {
  return Math.min(Math.max(t, n), e);
}
function gs(n) {
  var t = Math.round(n).toString(16).toUpperCase();
  return t.length < 2 ? "0" + t : t;
}
function P_(n) {
  const t = v1.exports.get.rgb(n);
  let [e, r, s] = t;
  return (e * 299 + r * 587 + s * 114) / 1e3;
}
function $_(n) {
  const t = v1.exports.get.rgb(n);
  let [e, r, s] = t;
  return `rgb(${e}, ${r}, ${s})`;
}
const D_ = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g clip-path="url(#clip0_544_54)">
    <path d="M15.5489 4.19771C15.5489 5.18773 15.1485 6.13721 14.4358 6.83726C13.7231 7.53731 12.7565 7.93058 11.7486 7.93058C10.7407 7.93058 9.77403 7.53731 9.06133 6.83726C8.34863 6.13721 7.94824 5.18773 7.94824 4.19771C7.94824 3.20768 8.34863 2.25822 9.06133 1.55818C9.77403 0.858126 10.7407 0.464844 11.7486 0.464844C12.7565 0.464844 13.7231 0.858126 14.4358 1.55818C15.1485 2.25822 15.5489 3.20768 15.5489 4.19771Z" stroke="black"/>
    <path d="M6.54883 11.2152L17.2025 11.2073M11.7471 8.06641V19.5806V8.06641ZM11.7471 19.4385L6.79789 23.5738L11.7471 19.4385ZM11.7551 19.4385L17.1864 23.3055L11.7551 19.4385Z" stroke="black"/>
  </g>
  <defs>
    <clipPath id="clip0_544_54">
      <rect width="24" height="24" fill="white"/>
    </clipPath>
  </defs>
</svg>
`, F_ = `<svg width="101" height="78" viewBox="0 0 101 78" fill="none" xmlns="http://www.w3.org/2000/svg">
	<path d="M96.3563 39.4479C96.3563 48.4904 92.6755 57.1625 86.1237 63.5566C79.5718 69.9506 70.6856 73.5427 61.4199 73.5427C52.1541 73.5427 43.2679 69.9506 36.7161 63.5566C30.1642 57.1625 26.4834 48.4904 26.4834 39.4479C26.4834 30.147 30.1642 21.2271 36.7161 14.6504C43.2679 8.07366 52.1541 4.37891 61.4199 4.37891C70.6856 4.37891 79.5718 8.07366 86.1237 14.6504C92.6755 21.2271 96.3563 30.147 96.3563 39.4479V39.4479Z" stroke="black" stroke-width="7.56826"/>
	<path d="M27.3611 39.4482H3.93945" stroke="black" stroke-width="8"/>
	<path d="M4.91504 4.37891V74.5168" stroke="black" stroke-width="8"/>
</svg>
`, B_ = `<svg width="77" height="86" viewBox="0 0 77 86" fill="none" xmlns="http://www.w3.org/2000/svg">
	<g clip-path="url(#clip0_544_57)">
		<path d="M74.0149 46.8888C74.0149 51.5755 73.0918 56.2163 71.2983 60.5463C69.5048 64.8762 66.876 68.8105 63.562 72.1245C60.248 75.4385 56.3137 78.0673 51.9838 79.8608C47.6538 81.6543 43.013 82.5774 38.3263 82.5774C33.6396 82.5774 28.9988 81.6543 24.6689 79.8608C20.3389 78.0673 16.4046 75.4385 13.0907 72.1245C9.77666 68.8105 7.14785 64.8762 5.35433 60.5463C3.56081 56.2163 2.6377 51.5755 2.6377 46.8888C2.6377 42.2021 3.56081 37.5613 5.35433 33.2314C7.14785 28.9014 9.77666 24.9671 13.0907 21.6532C16.4046 18.3392 20.3389 15.7104 24.6689 13.9168C28.9988 12.1233 33.6396 11.2002 38.3263 11.2002C43.013 11.2002 47.6538 12.1233 51.9838 13.9168C56.3137 15.7104 60.248 18.3392 63.562 21.6532C66.876 24.9671 69.5048 28.9014 71.2983 33.2314C73.0918 37.5613 74.0149 42.2021 74.0149 46.8888V46.8888Z" stroke="black" stroke-width="4.98203"/>
		<path d="M47.5352 2.30371L37.5352 11.5001L47.5352 20.6966" stroke="black" stroke-width="6"/>
	</g>
	<defs>
		<clipPath id="clip0_544_57">
			<rect width="77" height="86" fill="white"/>
		</clipPath>
	</defs>
</svg>
`, U_ = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M12.258 0.001L12.514 0.005L12.769 0.01L13.022 0.018L13.273 0.028L13.522 0.04L13.769 0.055L14.015 0.071L14.257 0.09L14.498 0.11L14.737 0.133L14.973 0.157L15.206 0.184L15.437 0.212L15.666 0.243L15.891 0.275L16.114 0.309L16.334 0.345L16.551 0.383L16.765 0.423L16.976 0.464L17.184 0.507L17.389 0.552L17.59 0.598L17.788 0.646L17.982 0.696L18.173 0.747L18.36 0.8L18.543 0.854L18.723 0.91L18.898 0.967L19.07 1.026L19.238 1.086L19.401 1.147L19.561 1.21L19.716 1.274L19.866 1.34L19.94 1.373L20.013 1.406L20.084 1.44L20.154 1.474L20.223 1.509L20.291 1.544L20.358 1.579L20.424 1.614L20.488 1.65L20.552 1.686L20.614 1.722L20.674 1.758L20.734 1.795L20.792 1.832L20.85 1.869L20.905 1.907L20.96 1.945L21.013 1.983L21.065 2.021L21.116 2.06L21.166 2.099L21.214 2.138L21.261 2.177L21.306 2.217L21.35 2.257L21.393 2.297L21.434 2.337L21.474 2.378L21.513 2.419L21.55 2.46L21.586 2.501L21.62 2.542L21.653 2.584L21.685 2.626L21.715 2.668L21.744 2.71L21.771 2.752L21.797 2.795L21.821 2.838L21.844 2.881L21.865 2.924L21.885 2.967L21.903 3.011L21.92 3.054L21.935 3.098L21.948 3.142L21.96 3.186L21.971 3.231L21.98 3.275L21.987 3.32L21.993 3.365L21.997 3.41L21.999 3.455L22 3.5V20.5L21.999 20.545L21.997 20.59L21.993 20.635L21.987 20.68L21.98 20.725L21.971 20.769L21.96 20.814L21.948 20.858L21.935 20.902L21.92 20.946L21.903 20.989L21.885 21.033L21.865 21.076L21.844 21.119L21.821 21.162L21.797 21.205L21.771 21.248L21.744 21.29L21.715 21.332L21.685 21.374L21.653 21.416L21.62 21.458L21.586 21.499L21.55 21.54L21.513 21.581L21.474 21.622L21.434 21.663L21.393 21.703L21.35 21.743L21.306 21.783L21.261 21.823L21.214 21.862L21.166 21.901L21.116 21.94L21.065 21.979L21.013 22.017L20.96 22.055L20.905 22.093L20.85 22.131L20.792 22.168L20.734 22.205L20.674 22.242L20.614 22.278L20.552 22.314L20.488 22.35L20.424 22.386L20.358 22.421L20.291 22.456L20.223 22.491L20.154 22.526L20.084 22.56L20.013 22.594L19.94 22.627L19.866 22.66L19.716 22.726L19.561 22.79L19.401 22.853L19.238 22.914L19.07 22.974L18.898 23.033L18.723 23.09L18.543 23.146L18.36 23.2L18.173 23.253L17.982 23.304L17.788 23.354L17.59 23.402L17.389 23.448L17.184 23.493L16.976 23.536L16.765 23.577L16.551 23.617L16.334 23.655L16.114 23.691L15.891 23.725L15.666 23.757L15.437 23.788L15.206 23.816L14.973 23.843L14.737 23.867L14.498 23.89L14.257 23.91L14.015 23.929L13.769 23.945L13.522 23.96L13.273 23.972L13.022 23.982L12.769 23.99L12.514 23.995L12.258 23.999L12 24L11.742 23.999L11.486 23.995L11.231 23.99L10.978 23.982L10.727 23.972L10.478 23.96L10.231 23.945L9.986 23.929L9.743 23.91L9.502 23.89L9.264 23.867L9.028 23.843L8.794 23.816L8.563 23.788L8.335 23.757L8.109 23.725L7.886 23.691L7.666 23.655L7.449 23.617L7.235 23.577L7.024 23.536L6.816 23.493L6.612 23.448L6.411 23.402L6.213 23.354L6.018 23.304L5.828 23.253L5.641 23.2L5.457 23.146L5.278 23.09L5.102 23.033L4.93 22.974L4.763 22.914L4.599 22.853L4.44 22.79L4.285 22.726L4.134 22.66L4.06 22.627L3.988 22.594L3.916 22.56L3.846 22.526L3.777 22.491L3.709 22.456L3.642 22.421L3.576 22.386L3.512 22.35L3.449 22.314L3.387 22.278L3.326 22.242L3.266 22.205L3.208 22.168L3.151 22.131L3.095 22.093L3.04 22.055L2.987 22.017L2.935 21.979L2.884 21.94L2.835 21.901L2.786 21.862L2.74 21.823L2.694 21.783L2.65 21.743L2.607 21.703L2.566 21.663L2.526 21.622L2.487 21.581L2.45 21.54L2.414 21.499L2.38 21.458L2.347 21.416L2.315 21.374L2.285 21.332L2.256 21.29L2.229 21.248L2.203 21.205L2.179 21.162L2.156 21.119L2.135 21.076L2.115 21.033L2.097 20.989L2.08 20.946L2.065 20.902L2.052 20.858L2.04 20.814L2.029 20.769L2.02 20.725L2.013 20.68L2.007 20.635L2.003 20.59L2.001 20.545L2 20.5V3.5L2.001 3.455L2.003 3.41L2.007 3.365L2.013 3.32L2.02 3.275L2.029 3.231L2.04 3.186L2.052 3.142L2.065 3.098L2.08 3.054L2.097 3.011L2.115 2.967L2.135 2.924L2.156 2.881L2.179 2.838L2.203 2.795L2.229 2.752L2.256 2.71L2.285 2.668L2.315 2.626L2.347 2.584L2.38 2.542L2.414 2.501L2.45 2.46L2.487 2.419L2.526 2.378L2.566 2.337L2.607 2.297L2.65 2.257L2.694 2.217L2.74 2.177L2.786 2.138L2.835 2.099L2.884 2.06L2.935 2.021L2.987 1.983L3.04 1.945L3.095 1.907L3.151 1.869L3.208 1.832L3.266 1.795L3.326 1.758L3.387 1.722L3.449 1.686L3.512 1.65L3.576 1.614L3.642 1.579L3.709 1.544L3.777 1.509L3.846 1.474L3.916 1.44L3.988 1.406L4.06 1.373L4.134 1.34L4.285 1.274L4.44 1.21L4.599 1.147L4.763 1.086L4.93 1.026L5.102 0.967L5.278 0.91L5.457 0.854L5.641 0.8L5.828 0.747L6.018 0.696L6.213 0.646L6.411 0.598L6.612 0.552L6.816 0.507L7.024 0.464L7.235 0.423L7.449 0.383L7.666 0.345L7.886 0.309L8.109 0.275L8.335 0.243L8.563 0.212L8.794 0.184L9.028 0.157L9.264 0.133L9.502 0.11L9.743 0.09L9.986 0.071L10.231 0.055L10.478 0.04L10.727 0.028L10.978 0.018L11.231 0.01L11.486 0.005L11.742 0.001L12 0L12.258 0.001V0.001ZM3 20.5V20.51L3.001 20.531L3.004 20.552L3.008 20.574L3.013 20.595L3.019 20.617L3.026 20.639L3.035 20.662L3.045 20.684L3.056 20.707L3.068 20.73L3.081 20.753L3.096 20.776L3.112 20.8L3.129 20.823L3.147 20.847L3.166 20.871L3.187 20.895L3.209 20.92L3.232 20.944L3.256 20.969L3.308 21.018L3.364 21.068L3.425 21.119L3.491 21.17L3.561 21.221L3.636 21.272L3.715 21.324L3.799 21.376L3.887 21.428L3.979 21.48L4.076 21.532L4.178 21.583L4.283 21.635L4.393 21.687L4.507 21.738L4.626 21.789L4.749 21.84L4.876 21.89L5.007 21.94L5.142 21.99L5.281 22.038L5.425 22.087L5.572 22.134L5.724 22.181L5.879 22.228L6.039 22.273L6.202 22.318L6.369 22.361L6.54 22.404L6.716 22.445L6.894 22.486L7.077 22.525L7.264 22.564L7.454 22.601L7.648 22.636L7.845 22.671L8.047 22.704L8.251 22.735L8.46 22.765L8.672 22.794L8.888 22.821L9.107 22.846L9.329 22.87L9.555 22.891L9.785 22.911L10.018 22.929L10.254 22.945L10.494 22.96L10.737 22.972L10.983 22.982L11.232 22.99L11.485 22.995L11.741 22.999L12 23L12.26 22.999L12.517 22.995L12.771 22.99L13.021 22.982L13.268 22.971L13.512 22.959L13.753 22.945L13.99 22.929L14.223 22.911L14.454 22.89L14.68 22.869L14.904 22.845L15.124 22.819L15.34 22.792L15.552 22.764L15.762 22.733L15.967 22.702L16.169 22.668L16.367 22.634L16.561 22.598L16.752 22.561L16.939 22.522L17.122 22.482L17.301 22.442L17.476 22.4L17.648 22.357L17.816 22.313L17.979 22.268L18.139 22.222L18.294 22.176L18.446 22.129L18.594 22.081L18.737 22.032L18.876 21.983L19.012 21.933L19.143 21.883L19.269 21.833L19.392 21.782L19.51 21.73L19.624 21.679L19.734 21.627L19.84 21.575L19.941 21.523L20.037 21.471L20.129 21.419L20.217 21.366L20.3 21.315L20.379 21.263L20.453 21.211L20.523 21.16L20.588 21.109L20.648 21.058L20.704 21.008L20.755 20.958L20.778 20.934L20.801 20.909L20.822 20.885L20.842 20.861L20.861 20.837L20.879 20.813L20.896 20.789L20.911 20.766L20.925 20.742L20.938 20.719L20.95 20.696L20.96 20.673L20.97 20.651L20.978 20.629L20.984 20.607L20.99 20.585L20.994 20.563L20.998 20.542L20.999 20.521L21 20.5V16.373L20.923 16.428L20.843 16.481L20.76 16.535L20.675 16.588L20.588 16.64L20.498 16.692L20.405 16.743L20.31 16.793L20.213 16.843L20.113 16.892L20.011 16.941L19.906 16.989L19.8 17.036L19.691 17.083L19.58 17.129L19.466 17.174L19.351 17.219L19.233 17.263L19.113 17.306L18.991 17.348L18.867 17.39L18.741 17.431L18.613 17.471L18.483 17.511L18.351 17.549L18.217 17.587L18.082 17.624L17.944 17.661L17.805 17.696L17.663 17.731L17.52 17.765L17.376 17.798L17.229 17.83L17.081 17.861L16.931 17.891L16.78 17.921L16.627 17.95L16.473 17.977L16.317 18.004L16.159 18.03L16 18.055L15.839 18.079L15.677 18.102L15.514 18.124L15.349 18.145L15.183 18.165L15.016 18.184L14.847 18.202L14.678 18.219L14.507 18.235L14.334 18.25L14.161 18.264L13.986 18.277L13.811 18.289L13.634 18.3L13.456 18.31L13.277 18.318L13.098 18.326L12.917 18.332L12.735 18.337L12.553 18.341L12.369 18.344L12.185 18.346H11.815L11.631 18.344L11.447 18.341L11.265 18.337L11.083 18.332L10.902 18.326L10.723 18.318L10.544 18.31L10.366 18.3L10.19 18.289L10.014 18.277L9.839 18.264L9.666 18.25L9.494 18.235L9.323 18.219L9.153 18.202L8.984 18.184L8.817 18.165L8.651 18.145L8.486 18.124L8.323 18.102L8.161 18.079L8 18.055L7.841 18.03L7.684 18.004L7.528 17.977L7.373 17.95L7.22 17.921L7.069 17.891L6.919 17.861L6.771 17.83L6.625 17.798L6.48 17.765L6.337 17.731L6.196 17.696L6.056 17.661L5.919 17.624L5.783 17.587L5.649 17.549L5.517 17.511L5.387 17.471L5.259 17.431L5.133 17.39L5.009 17.348L4.887 17.306L4.767 17.262L4.65 17.219L4.534 17.174L4.421 17.129L4.309 17.083L4.2 17.036L4.094 16.989L3.989 16.941L3.887 16.892L3.787 16.843L3.69 16.793L3.595 16.743L3.502 16.691L3.412 16.64L3.325 16.588L3.24 16.535L3.157 16.481L3.077 16.427L3 16.373V20.5V20.5ZM3 14.846V14.857L3.001 14.878L3.004 14.899L3.008 14.92L3.013 14.942L3.019 14.964L3.026 14.986L3.035 15.008L3.045 15.03L3.056 15.053L3.068 15.076L3.081 15.099L3.096 15.123L3.112 15.146L3.129 15.17L3.147 15.194L3.166 15.218L3.187 15.242L3.209 15.266L3.232 15.291L3.256 15.315L3.308 15.365L3.364 15.415L3.425 15.465L3.491 15.516L3.561 15.567L3.636 15.619L3.715 15.67L3.799 15.722L3.887 15.774L3.979 15.826L4.076 15.878L4.178 15.93L4.283 15.982L4.393 16.033L4.507 16.084L4.626 16.136L4.749 16.186L4.876 16.237L5.007 16.287L5.142 16.336L5.281 16.385L5.425 16.433L5.572 16.481L5.724 16.528L5.879 16.574L6.039 16.619L6.202 16.664L6.369 16.708L6.54 16.75L6.716 16.792L6.894 16.832L7.077 16.872L7.264 16.91L7.454 16.947L7.648 16.983L7.845 17.017L8.047 17.05L8.251 17.082L8.46 17.112L8.672 17.14L8.888 17.167L9.107 17.192L9.329 17.216L9.555 17.238L9.785 17.258L10.018 17.276L10.254 17.292L10.494 17.306L10.737 17.318L10.983 17.328L11.232 17.336L11.485 17.342L11.741 17.345L12 17.346L12.26 17.345L12.517 17.342L12.771 17.336L13.021 17.328L13.268 17.318L13.512 17.306L13.753 17.291L13.99 17.275L14.223 17.257L14.454 17.237L14.68 17.215L14.904 17.191L15.124 17.166L15.34 17.139L15.552 17.11L15.762 17.08L15.967 17.048L16.169 17.015L16.367 16.98L16.561 16.944L16.752 16.907L16.939 16.868L17.122 16.829L17.301 16.788L17.476 16.746L17.648 16.703L17.816 16.659L17.979 16.614L18.139 16.569L18.294 16.522L18.446 16.475L18.594 16.427L18.737 16.379L18.876 16.329L19.012 16.28L19.143 16.23L19.269 16.179L19.392 16.128L19.51 16.077L19.624 16.025L19.734 15.973L19.84 15.921L19.941 15.869L20.037 15.817L20.129 15.765L20.217 15.713L20.3 15.661L20.379 15.609L20.453 15.558L20.523 15.506L20.588 15.455L20.648 15.405L20.704 15.354L20.755 15.305L20.778 15.28L20.801 15.256L20.822 15.231L20.842 15.207L20.861 15.183L20.879 15.159L20.896 15.135L20.911 15.112L20.925 15.089L20.938 15.065L20.95 15.043L20.96 15.02L20.97 14.997L20.978 14.975L20.984 14.953L20.99 14.931L20.994 14.91L20.998 14.888L20.999 14.867L21 14.846V10.707L20.923 10.761L20.843 10.815L20.76 10.869L20.675 10.921L20.588 10.974L20.498 11.025L20.405 11.076L20.31 11.127L20.213 11.177L20.113 11.226L20.011 11.275L19.906 11.323L19.8 11.37L19.691 11.417L19.58 11.463L19.466 11.508L19.351 11.552L19.233 11.596L19.113 11.64L18.991 11.682L18.867 11.724L18.741 11.765L18.613 11.805L18.483 11.844L18.351 11.883L18.217 11.921L18.082 11.958L17.944 11.994L17.805 12.03L17.663 12.065L17.52 12.098L17.376 12.131L17.229 12.164L17.081 12.195L16.931 12.225L16.78 12.255L16.627 12.283L16.473 12.311L16.317 12.338L16.159 12.364L16 12.389L15.839 12.413L15.677 12.436L15.514 12.458L15.349 12.479L15.183 12.499L15.016 12.518L14.847 12.536L14.678 12.553L14.507 12.569L14.334 12.584L14.161 12.598L13.986 12.611L13.811 12.623L13.634 12.634L13.456 12.643L13.277 12.652L13.098 12.659L12.917 12.666L12.735 12.671L12.553 12.675L12.369 12.678L12.185 12.68H11.815L11.631 12.678L11.447 12.675L11.265 12.671L11.083 12.666L10.902 12.659L10.723 12.652L10.544 12.643L10.366 12.634L10.19 12.623L10.014 12.611L9.839 12.598L9.666 12.584L9.494 12.569L9.323 12.553L9.153 12.536L8.984 12.518L8.817 12.499L8.651 12.479L8.486 12.458L8.323 12.436L8.161 12.413L8 12.389L7.841 12.364L7.684 12.338L7.528 12.311L7.373 12.283L7.22 12.255L7.069 12.225L6.919 12.195L6.771 12.164L6.625 12.131L6.48 12.098L6.337 12.065L6.196 12.03L6.056 11.994L5.919 11.958L5.783 11.921L5.649 11.883L5.517 11.844L5.387 11.805L5.259 11.765L5.133 11.724L5.009 11.682L4.887 11.639L4.767 11.596L4.65 11.552L4.534 11.508L4.421 11.462L4.309 11.416L4.2 11.37L4.094 11.323L3.989 11.275L3.887 11.226L3.787 11.177L3.69 11.127L3.595 11.076L3.502 11.025L3.412 10.974L3.325 10.921L3.24 10.869L3.157 10.815L3.077 10.761L3 10.707V14.846V14.846ZM3 9.18V9.191L3.001 9.211L3.004 9.233L3.008 9.254L3.013 9.276L3.019 9.297L3.026 9.319L3.035 9.342L3.045 9.364L3.056 9.387L3.068 9.41L3.081 9.433L3.096 9.456L3.112 9.48L3.129 9.504L3.147 9.527L3.166 9.551L3.187 9.576L3.209 9.6L3.232 9.624L3.256 9.649L3.308 9.699L3.364 9.749L3.425 9.799L3.491 9.85L3.561 9.901L3.636 9.953L3.715 10.004L3.799 10.056L3.887 10.108L3.979 10.16L4.076 10.212L4.178 10.264L4.283 10.315L4.393 10.367L4.507 10.418L4.626 10.469L4.749 10.52L4.876 10.57L5.007 10.62L5.142 10.67L5.281 10.719L5.425 10.767L5.572 10.815L5.724 10.862L5.879 10.908L6.039 10.953L6.202 10.998L6.369 11.041L6.54 11.084L6.716 11.126L6.894 11.166L7.077 11.206L7.264 11.244L7.454 11.281L7.648 11.317L7.845 11.351L8.047 11.384L8.251 11.416L8.46 11.446L8.672 11.474L8.888 11.501L9.107 11.526L9.329 11.55L9.555 11.571L9.785 11.591L10.018 11.609L10.254 11.626L10.494 11.64L10.737 11.652L10.983 11.662L11.232 11.67L11.485 11.676L11.741 11.679L12 11.68L12.26 11.679L12.517 11.676L12.771 11.67L13.021 11.662L13.268 11.652L13.512 11.639L13.753 11.625L13.99 11.609L14.223 11.591L14.454 11.571L14.68 11.549L14.904 11.525L15.124 11.5L15.34 11.473L15.552 11.444L15.762 11.414L15.967 11.382L16.169 11.349L16.367 11.314L16.561 11.278L16.752 11.241L16.939 11.202L17.122 11.163L17.301 11.122L17.476 11.08L17.648 11.037L17.816 10.993L17.979 10.948L18.139 10.903L18.294 10.856L18.446 10.809L18.594 10.761L18.737 10.712L18.876 10.663L19.012 10.614L19.143 10.563L19.269 10.513L19.392 10.462L19.51 10.41L19.624 10.359L19.734 10.307L19.84 10.255L19.941 10.203L20.037 10.151L20.129 10.099L20.217 10.047L20.3 9.995L20.379 9.943L20.453 9.891L20.523 9.84L20.588 9.789L20.648 9.738L20.704 9.688L20.755 9.639L20.778 9.614L20.801 9.589L20.822 9.565L20.842 9.541L20.861 9.517L20.879 9.493L20.896 9.469L20.911 9.446L20.925 9.422L20.938 9.399L20.95 9.376L20.96 9.354L20.97 9.331L20.978 9.309L20.984 9.287L20.99 9.265L20.994 9.243L20.998 9.222L20.999 9.201L21 9.18V5.027L20.923 5.081L20.843 5.135L20.76 5.188L20.675 5.241L20.588 5.294L20.498 5.345L20.405 5.396L20.31 5.447L20.213 5.497L20.113 5.546L20.011 5.594L19.906 5.642L19.8 5.69L19.691 5.736L19.58 5.782L19.466 5.828L19.351 5.872L19.233 5.916L19.113 5.959L18.991 6.002L18.867 6.044L18.741 6.085L18.613 6.125L18.483 6.164L18.351 6.203L18.217 6.241L18.082 6.278L17.944 6.314L17.805 6.35L17.663 6.384L17.52 6.418L17.376 6.451L17.229 6.483L17.081 6.515L16.931 6.545L16.78 6.575L16.627 6.603L16.473 6.631L16.317 6.658L16.159 6.684L16 6.708L15.839 6.732L15.677 6.755L15.514 6.778L15.349 6.799L15.183 6.819L15.016 6.838L14.847 6.856L14.678 6.873L14.507 6.889L14.334 6.904L14.161 6.918L13.986 6.931L13.811 6.943L13.634 6.953L13.456 6.963L13.277 6.972L13.098 6.979L12.917 6.985L12.735 6.991L12.553 6.995L12.369 6.998L12.185 6.999L12 7L11.815 6.999L11.631 6.998L11.447 6.995L11.265 6.991L11.083 6.985L10.902 6.979L10.723 6.972L10.544 6.963L10.366 6.953L10.19 6.943L10.014 6.931L9.839 6.918L9.666 6.904L9.494 6.889L9.323 6.873L9.153 6.856L8.984 6.838L8.817 6.819L8.651 6.799L8.486 6.778L8.323 6.755L8.161 6.732L8 6.708L7.841 6.684L7.684 6.658L7.528 6.631L7.373 6.603L7.22 6.575L7.069 6.545L6.919 6.515L6.771 6.483L6.625 6.451L6.48 6.418L6.337 6.384L6.196 6.35L6.056 6.314L5.919 6.278L5.783 6.241L5.649 6.203L5.517 6.164L5.387 6.125L5.259 6.084L5.133 6.043L5.009 6.002L4.887 5.959L4.767 5.916L4.65 5.872L4.534 5.828L4.421 5.782L4.309 5.736L4.2 5.69L4.094 5.642L3.989 5.594L3.887 5.546L3.787 5.496L3.69 5.447L3.595 5.396L3.502 5.345L3.412 5.293L3.325 5.241L3.24 5.188L3.157 5.135L3.077 5.081L3 5.027V9.18V9.18ZM11.74 1.001L11.483 1.005L11.229 1.01L10.979 1.018L10.732 1.029L10.488 1.041L10.247 1.055L10.01 1.071L9.777 1.089L9.546 1.11L9.32 1.132L9.096 1.155L8.876 1.181L8.66 1.208L8.448 1.236L8.238 1.267L8.033 1.299L7.831 1.332L7.633 1.366L7.439 1.402L7.248 1.44L7.061 1.478L6.878 1.518L6.699 1.559L6.524 1.601L6.352 1.644L6.184 1.687L6.021 1.732L5.861 1.778L5.706 1.824L5.554 1.872L5.406 1.92L5.263 1.968L5.124 2.017L4.988 2.067L4.857 2.117L4.731 2.168L4.608 2.219L4.49 2.27L4.376 2.322L4.266 2.374L4.16 2.426L4.059 2.478L3.963 2.53L3.871 2.582L3.783 2.634L3.7 2.686L3.621 2.738L3.547 2.789L3.477 2.841L3.412 2.892L3.352 2.942L3.296 2.992L3.245 3.042L3.222 3.067L3.199 3.091L3.178 3.115L3.158 3.14L3.139 3.164L3.121 3.188L3.104 3.211L3.089 3.235L3.075 3.258L3.062 3.281L3.05 3.304L3.04 3.327L3.03 3.349L3.022 3.371L3.016 3.394L3.01 3.415L3.006 3.437L3.002 3.458L3.001 3.479L3 3.5L3.001 3.521L3.002 3.542L3.006 3.563L3.01 3.585L3.016 3.606L3.022 3.629L3.03 3.651L3.04 3.673L3.05 3.696L3.062 3.719L3.075 3.742L3.089 3.765L3.104 3.789L3.121 3.812L3.139 3.836L3.158 3.86L3.178 3.885L3.199 3.909L3.222 3.933L3.245 3.958L3.296 4.008L3.352 4.058L3.412 4.108L3.477 4.159L3.547 4.211L3.621 4.262L3.7 4.314L3.783 4.366L3.871 4.418L3.963 4.47L4.059 4.522L4.16 4.574L4.266 4.626L4.376 4.678L4.49 4.73L4.608 4.781L4.731 4.832L4.857 4.883L4.988 4.933L5.124 4.983L5.263 5.032L5.406 5.08L5.554 5.128L5.706 5.176L5.861 5.222L6.021 5.268L6.184 5.313L6.352 5.356L6.524 5.399L6.699 5.441L6.878 5.482L7.061 5.522L7.248 5.56L7.439 5.598L7.633 5.634L7.831 5.668L8.033 5.701L8.238 5.733L8.448 5.764L8.66 5.792L8.876 5.819L9.096 5.845L9.32 5.868L9.546 5.89L9.777 5.911L10.01 5.929L10.247 5.945L10.488 5.959L10.732 5.971L10.979 5.982L11.229 5.99L11.483 5.995L11.74 5.999L12 6L12.26 5.999L12.517 5.995L12.771 5.99L13.021 5.982L13.268 5.971L13.512 5.959L13.753 5.945L13.99 5.929L14.223 5.911L14.454 5.89L14.68 5.868L14.904 5.845L15.124 5.819L15.34 5.792L15.552 5.764L15.762 5.733L15.967 5.701L16.169 5.668L16.367 5.634L16.561 5.598L16.752 5.56L16.939 5.522L17.122 5.482L17.301 5.441L17.476 5.399L17.648 5.356L17.816 5.313L17.979 5.268L18.139 5.222L18.294 5.176L18.446 5.128L18.594 5.08L18.737 5.032L18.876 4.983L19.012 4.933L19.143 4.883L19.269 4.832L19.392 4.781L19.51 4.73L19.624 4.678L19.734 4.626L19.84 4.574L19.941 4.522L20.037 4.47L20.129 4.418L20.217 4.366L20.3 4.314L20.379 4.262L20.453 4.211L20.523 4.159L20.588 4.108L20.648 4.058L20.704 4.008L20.755 3.958L20.778 3.933L20.801 3.909L20.822 3.885L20.842 3.86L20.861 3.836L20.879 3.812L20.896 3.789L20.911 3.765L20.925 3.742L20.938 3.719L20.95 3.696L20.96 3.673L20.97 3.651L20.978 3.629L20.984 3.606L20.99 3.585L20.994 3.563L20.998 3.542L20.999 3.521L21 3.5L20.999 3.479L20.998 3.458L20.994 3.437L20.99 3.415L20.984 3.394L20.978 3.371L20.97 3.349L20.96 3.327L20.95 3.304L20.938 3.281L20.925 3.258L20.911 3.235L20.896 3.211L20.879 3.188L20.861 3.164L20.842 3.14L20.822 3.115L20.801 3.091L20.778 3.067L20.755 3.042L20.704 2.992L20.648 2.942L20.588 2.892L20.523 2.841L20.453 2.789L20.379 2.738L20.3 2.686L20.217 2.634L20.129 2.582L20.037 2.53L19.941 2.478L19.84 2.426L19.734 2.374L19.624 2.322L19.51 2.27L19.392 2.219L19.269 2.168L19.143 2.117L19.012 2.067L18.876 2.017L18.737 1.968L18.594 1.92L18.446 1.872L18.294 1.824L18.139 1.778L17.979 1.732L17.816 1.687L17.648 1.644L17.476 1.601L17.301 1.559L17.122 1.518L16.939 1.478L16.752 1.44L16.561 1.402L16.367 1.366L16.169 1.332L15.967 1.299L15.762 1.267L15.552 1.236L15.34 1.208L15.124 1.181L14.904 1.155L14.68 1.132L14.454 1.11L14.223 1.089L13.99 1.071L13.753 1.055L13.512 1.041L13.268 1.029L13.021 1.018L12.771 1.01L12.517 1.005L12.26 1.001L12 1L11.74 1.001V1.001Z" fill="black"/>
</svg>
`, H_ = `<svg width="77" height="80" viewBox="0 0 77 80" fill="none" xmlns="http://www.w3.org/2000/svg">
	<g clip-path="url(#clip0_544_61)">
		<path d="M74.0149 38.8888C74.0149 43.5755 73.0918 48.2163 71.2983 52.5463C69.5048 56.8762 66.876 60.8105 63.562 64.1245C60.248 67.4385 56.3137 70.0673 51.9838 71.8608C47.6538 73.6543 43.013 74.5774 38.3263 74.5774C33.6396 74.5774 28.9988 73.6543 24.6689 71.8608C20.3389 70.0673 16.4046 67.4385 13.0907 64.1245C9.77666 60.8105 7.14785 56.8762 5.35433 52.5463C3.56081 48.2163 2.6377 43.5755 2.6377 38.8888C2.6377 34.2021 3.56081 29.5613 5.35433 25.2314C7.14785 20.9014 9.77666 16.9671 13.0907 13.6532C16.4046 10.3392 20.3389 7.71035 24.6689 5.91683C28.9988 4.12331 33.6396 3.2002 38.3263 3.2002C43.013 3.2002 47.6538 4.12331 51.9838 5.91683C56.3137 7.71035 60.248 10.3392 63.562 13.6532C66.876 16.9671 69.5048 20.9014 71.2983 25.2314C73.0918 29.5613 74.0149 34.2021 74.0149 38.8888V38.8888Z" stroke="black" stroke-width="4.98203"/>
		<path d="M2.69922 75.4727L75.6992 75.5154" stroke="black" stroke-width="8"/>
	</g>
	<defs>
		<clipPath id="clip0_544_61">
			<rect width="77" height="80" fill="white"/>
		</clipPath>
	</defs>
</svg>
`, G_ = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_Amazon-CloudWatch_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#B0084D" offset="0%"></stop>
            <stop stop-color="#FF4F8B" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_Amazon-CloudWatch_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Management-Governance" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M18.9074368,18.522369 L16.9527886,16.7879726 C16.8210145,16.9276688 16.6782593,17.0526083 16.5285161,17.1726289 L18.5220975,18.9453925 C18.6388972,19.048689 18.8235806,19.0408188 18.9303974,18.9227657 C19.0352176,18.8086477 19.0252348,18.627633 18.9074368,18.522369 M14.0248095,17.0831053 C15.6769763,17.0831053 17.0196739,15.7589433 17.0196739,14.1317785 C17.0196739,12.5046136 15.6769763,11.1804516 14.0248095,11.1804516 C12.3736409,11.1804516 11.0299451,12.5046136 11.0299451,14.1317785 C11.0299451,15.7589433 12.3736409,17.0831053 14.0248095,17.0831053 M19.6721255,19.5818954 C19.417562,19.8593201 19.0651663,20 18.7137689,20 C18.4062961,20 18.0988234,19.8937522 17.8542428,19.6763378 L15.6510209,17.7186243 C15.1528751,17.9380063 14.6048149,18.0668809 14.0248095,18.0668809 C11.8225858,18.0668809 10.0316569,16.3019875 10.0316569,14.1317785 C10.0316569,11.9625532 11.8225858,10.196676 14.0248095,10.196676 C16.2270331,10.196676 18.017962,11.9625532 18.017962,14.1317785 C18.017962,14.8017297 17.8312821,15.4234758 17.5307974,15.9763577 L19.5762898,17.7924075 C20.1013894,18.2606847 20.1443158,19.0634456 19.6721255,19.5818954 M6.53764845,14.1317785 L9.03336879,14.1317785 L9.03336879,15.1155541 L6.53764845,15.1155541 C5.3127489,15.1155541 4,13.9596177 4,12.2389942 C4,10.8459679 4.75171097,9.77660381 6.03251465,9.30832662 C6.03151636,9.27389447 6.03151636,9.23847855 6.03151636,9.2040464 C6.03151636,7.60934613 7.12963331,5.95463555 8.58713399,5.3555162 C10.2832255,4.65506796 12.0871322,5.00234075 13.4008794,6.28518415 C13.7492819,6.62458674 14.0437769,7.02498342 14.2813695,7.4814553 C14.6028183,7.28273263 14.9731832,7.17451731 15.3585224,7.17451731 C16.2619732,7.17451731 17.2722408,7.81593901 17.5048419,9.21388416 C18.7596901,9.54246521 19.9726102,10.4829547 19.9726102,12.2606372 C19.9726102,12.6334882 19.9206992,12.9876474 19.815879,13.3113096 L18.8645104,13.0142094 C18.9373854,12.7859734 18.9743221,12.5331431 18.9743221,12.2606372 C18.9743221,10.6147806 17.5637409,10.2035624 16.95778,10.1032173 C16.8250077,10.0805905 16.7072097,10.0077911 16.6313398,9.89859199 C16.5544716,9.79037667 16.524523,9.65559941 16.5504785,9.52574103 C16.4736103,8.54196541 15.8596631,8.15829292 15.3585224,8.15829292 C15.0270908,8.15829292 14.7146266,8.31963213 14.5009929,8.60099195 C14.3911812,8.74560697 14.2154825,8.81545504 14.0268061,8.7928282 C13.8461159,8.76626625 13.6933778,8.6432943 13.6314839,8.47310112 C13.4128588,7.87594932 13.0993964,7.37422376 12.6990828,6.98366484 C12.2099216,6.50751744 10.8652275,5.4804557 8.97247321,6.26354109 C7.88234257,6.71115899 7.0298045,8.00285638 7.0298045,9.2040464 C7.0298045,9.33882366 7.03679251,9.47163337 7.05376341,9.60050798 C7.07273089,9.74118789 7.02880621,9.8818678 6.93396884,9.98811557 C6.86009551,10.0707527 6.7602667,10.1258442 6.65245158,10.1465034 C6.02353005,10.3088264 4.99828814,10.7957953 4.99828814,12.2389942 C4.99828814,13.3545957 5.80989639,14.1317785 6.53764845,14.1317785" id="Amazon-CloudWatch_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, j_ = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_Amazon-CloudFront_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#4D27A8" offset="0%"></stop>
            <stop stop-color="#A166FF" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_Amazon-CloudFront_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Networking-Content-Delivery" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M16,15.4980737 C16,15.2219556 15.775,14.9978597 15.5,14.9978597 C15.225,14.9978597 15,15.2219556 15,15.4980737 C15,15.7741919 15.225,15.9982877 15.5,15.9982877 C15.775,15.9982877 16,15.7741919 16,15.4980737 M17,15.4980737 C17,16.3254277 16.327,16.9987158 15.5,16.9987158 C14.673,16.9987158 14,16.3254277 14,15.4980737 C14,14.6707197 14.673,13.9974316 15.5,13.9974316 C16.327,13.9974316 17,14.6707197 17,15.4980737 M9,11.4963614 C9,11.2202433 8.775,10.9961474 8.5,10.9961474 C8.225,10.9961474 8,11.2202433 8,11.4963614 C8,11.7724796 8.225,11.9965755 8.5,11.9965755 C8.775,11.9965755 9,11.7724796 9,11.4963614 M10,11.4963614 C10,12.3237155 9.327,12.9970035 8.5,12.9970035 C7.673,12.9970035 7,12.3237155 7,11.4963614 C7,10.6690074 7.673,9.99571934 8.5,9.99571934 C9.327,9.99571934 10,10.6690074 10,11.4963614 M12,7.49464918 C12,7.77076733 12.225,7.99486321 12.5,7.99486321 C12.775,7.99486321 13,7.77076733 13,7.49464918 C13,7.21853103 12.775,6.99443515 12.5,6.99443515 C12.225,6.99443515 12,7.21853103 12,7.49464918 M11,7.49464918 C11,6.66729517 11.673,5.99400708 12.5,5.99400708 C13.327,5.99400708 14,6.66729517 14,7.49464918 C14,8.32200319 13.327,8.99529128 12.5,8.99529128 C11.673,8.99529128 11,8.32200319 11,7.49464918 M19,11.9965755 C19,9.73960976 17.903,7.63971125 16.101,6.33215177 C15.917,6.27312651 15.407,6.42319072 14.566,6.78434525 C14.415,6.84837265 14.287,6.90239576 14.197,6.93540989 L13.857,5.99400708 C13.935,5.96699552 14.044,5.91897498 14.173,5.86395143 C14.394,5.76991119 14.611,5.67987267 14.823,5.59983842 C13.939,5.20867105 12.979,4.99357901 12,4.99357901 C11.313,4.99357901 10.642,5.09162097 10.002,5.28470358 C9.956,5.29770915 9.915,5.32071899 9.87,5.33472499 C10.22,5.46578106 10.637,5.6348534 11.132,5.85694844 L10.724,6.76933883 C9.518,6.22810725 8.828,6.02702121 8.507,5.9519891 C6.692,7.00443943 5.429,8.82721936 5.104,10.9291187 C5.426,10.8871007 5.751,10.86209 6.097,10.8530862 L6.122,11.8535143 C5.725,11.8635185 5.363,11.9055365 5.001,11.9645618 C5.001,11.9745661 5,11.9855708 5,11.9965755 C5,14.29756 6.125,16.4174671 7.976,17.7180236 C7.775,17.0167235 7.604,16.1773644 7.604,15.3310022 C7.604,15.1749354 7.599,15.0098648 7.594,14.8427933 C7.578,14.3655891 7.562,13.8723781 7.65,13.4231859 L8.631,13.6162685 C8.564,13.9534128 8.579,14.388599 8.593,14.8097792 C8.599,14.9888558 8.604,15.1639307 8.604,15.3310022 C8.604,16.2293866 8.853,17.3548682 9.277,18.4433339 C10.504,18.9595548 11.859,19.1086186 13.154,18.8935266 C13.266,18.6874384 13.402,18.4783489 13.546,18.2662582 C13.76,17.9501229 13.981,17.6239833 14.067,17.3278566 L15.028,17.6069761 C14.938,17.9191096 14.774,18.2012303 14.601,18.4743472 C15.199,18.2352449 15.768,17.934116 16.279,17.5369461 C18.009,16.1983734 19,14.1785091 19,11.9965755 M20,11.9965755 C20,14.4906426 18.867,16.7986302 16.892,18.3272843 C16.193,18.8695163 15.416,19.2876952 14.582,19.5688155 C13.76,19.8539375 12.89,20 12,20 C10.686,20 9.381,19.6718596 8.225,19.0525946 C5.619,17.6569975 4,14.9538408 4,11.9965755 C4,11.8315048 4.004,11.6674346 4.018,11.5063657 C4.212,8.17393984 6.502,5.28270273 9.715,4.32629349 C11.729,3.71903366 14.052,3.96513896 15.91,5.01658886 C18.433,6.43019372 20,9.10433794 20,11.9965755 M11.075,8.93526559 L10.419,8.18194326 C9.903,8.63013503 9.765,8.86023349 9.534,9.24039615 C9.467,9.35144367 9.389,9.48149932 9.285,9.64056738 L10.123,10.1858007 C10.233,10.0157279 10.317,9.87766883 10.39,9.75861789 C10.594,9.42147363 10.678,9.28241413 11.075,8.93526559 M10.649,11.3663058 L10.325,12.3117103 C11.438,12.6948743 12.411,13.3071362 13.387,14.2375343 L14.076,13.5132244 C12.993,12.4797822 11.904,11.7974903 10.649,11.3663058 M13.285,9.07432509 L14.121,8.52509009 C15.083,9.99271806 15.624,11.6044077 15.73,13.3161401 L14.732,13.3781666 C14.638,11.8425096 14.15,10.3938897 13.285,9.07432509" id="Amazon-CloudFront_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, V_ = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_Amazon-Cognito_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#BD0816" offset="0%"></stop>
            <stop stop-color="#FF5252" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_Amazon-Cognito_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Security-Identity-Compliance" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M15.188,16.891 L13.938,15.891 L14.563,15.11 L15.387,15.769 L17.084,13.223 L17.917,13.778 L15.917,16.778 C15.838,16.894 15.715,16.973 15.578,16.995 C15.551,16.998 15.526,17 15.5,17 C15.388,17 15.278,16.962 15.188,16.891 L15.188,16.891 Z M6,12 L8,12 L8,11 L6,11 L6,12 Z M6.001,10 L9.001,10 L9.001,9 L6.001,9 L6.001,10 Z M18.001,7 L18.001,6.5 C18.001,6.224 17.777,6 17.501,6 L10.501,6 C10.224,6 10.001,6.224 10.001,6.5 L10.001,7 L5,7 L5,5.6 C5,5.281 5.198,5 5.422,5 L18.578,5 C18.803,5 19.001,5.281 19.001,5.6 L19.001,7 L18.001,7 Z M15.625,12 C17.487,12 19.001,13.571 19.001,15.5 C19.001,17.43 17.487,19 15.625,19 C13.764,19 12.25,17.43 12.25,15.5 C12.25,13.571 13.764,12 15.625,12 L15.625,12 Z M20,12 L20,5.6 C20,4.718 19.362,4 18.578,4 L5.422,4 C4.638,4 4,4.718 4,5.6 L4,14.4 C4,15.283 4.638,16 5.422,16 L11.299,16 C11.545,18.244 13.379,20 15.625,20 C18.038,20 20,17.982 20,15.5 C20,13.019 18.038,11 15.625,11 C13.379,11 11.545,12.757 11.299,15 L5.422,15 C5.198,15 5,14.72 5,14.4 L5,8 L10.001,8 L10.001,12 L11.001,12 L11.001,8 L11.001,7 L17,7 L17,8 L17,10 L18.001,10 L18.001,8 L19.001,8 L19.001,12 L20,12 Z" id="Amazon-Cognito_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, z_ = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_Amazon-DynamoDB_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#2E27AD" offset="0%"></stop>
            <stop stop-color="#527FFF" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_Amazon-DynamoDB_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Database" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M14.3871979,13.0634319 L15.4218955,9.61738691 C15.468467,9.46474602 15.4391067,9.29896386 15.3439388,9.17058378 C15.2487709,9.04220369 15.0979197,8.96739955 14.9379567,8.96739955 L14.2383715,8.96739955 L15.2507958,6.94566591 L17.7798316,6.94566591 L16.9881159,9.313116 C16.9374946,9.46676775 16.9628052,9.63659338 17.0589856,9.76800607 C17.153141,9.90042962 17.3060171,9.97826636 17.4690174,9.97826636 L18.095708,9.97826636 L14.3871979,13.0634319 Z M19.9697053,9.29997473 C19.8968108,9.10083397 19.7074875,8.96739955 19.4938659,8.96739955 L18.1706274,8.96739955 L18.9623432,6.59994946 C19.0129644,6.4462977 18.9876538,6.27647207 18.8914735,6.14404852 C18.7963056,6.01263584 18.644442,5.93479909 18.4814417,5.93479909 L14.9379567,5.93479909 C14.7455961,5.93479909 14.5714591,6.04296184 14.485403,6.21379833 L12.9667666,9.24639879 C12.88881,9.40308314 12.8958969,9.58908264 12.9880275,9.73768006 C13.0811706,9.88728835 13.2441709,9.97826636 13.4193203,9.97826636 L14.2576076,9.97826636 L12.9343691,14.3816022 C12.8705863,14.595906 12.9536051,14.8253728 13.1409036,14.9486985 C13.2259472,15.0042962 13.3221275,15.0326005 13.4193203,15.0326005 C13.5347366,15.0326005 13.6491406,14.9931766 13.743296,14.9153399 L19.8178417,9.86100581 C19.980842,9.72453879 20.0425999,9.50113723 19.9697053,9.29997473 L19.9697053,9.29997473 Z M14.8346894,17.6285064 C14.8346894,18.0904726 13.2775809,18.9891332 10.4235568,18.9891332 C7.56953281,18.9891332 6.01242428,18.0904726 6.01242428,17.6285064 L6.01242428,16.562042 C7.04914673,17.1786707 8.74293255,17.495072 10.4235568,17.495072 C12.1041811,17.495072 13.797967,17.1786707 14.8346894,16.562042 L14.8346894,17.6285064 Z M14.8346894,15.1235785 C14.8346894,15.5855446 13.2775809,16.4842052 10.4235568,16.4842052 C7.56953281,16.4842052 6.01242428,15.5855446 6.01242428,15.1235785 C6.01242428,15.0275461 6.08633125,14.9133182 6.21187186,14.7950468 C7.21214704,15.316654 8.74698225,15.6239575 10.4235568,15.6239575 C10.4438053,15.6239575 11.9948393,15.5916098 11.9948393,15.5916098 L11.9948393,14.580743 C11.9745908,14.580743 10.4235568,14.6130907 10.4235568,14.6130907 C8.77128043,14.6130907 7.24656947,14.2886025 6.44574187,13.7680061 C6.17542458,13.5900935 6.0134367,13.3980288 6.01242428,13.252464 L6.01242428,12.1859995 C7.04914673,12.8026283 8.74293255,13.1200404 10.4235568,13.1200404 C10.6898244,13.1200404 11.8348763,13.0391711 12.1922621,13.0138994 L12.213523,12.5054334 L12.1203799,12.0050543 C11.7761557,12.0293151 10.6786878,12.1091736 10.4235568,12.1091736 C7.56953281,12.1091736 6.01242428,11.2095021 6.01242428,10.747536 C6.01242428,10.6474602 6.09139337,10.5281779 6.22503337,10.405863 C7.01877401,10.7566338 8.57183285,11.1508719 12.3178027,11.1963609 L12.3299518,10.1854941 C9.27951741,10.1491029 7.3437622,9.88223402 6.44574187,9.39095274 C6.17542458,9.21304018 6.0134367,9.02097549 6.01242428,8.87541066 L6.01242428,7.80995704 C7.04914673,8.4265858 8.74293255,8.74298711 10.4235568,8.74298711 C10.5015135,8.74298711 12.480803,8.70659591 12.5587596,8.70356331 L12.5152254,7.69370735 C12.4079084,7.69775082 10.5187247,7.73212029 10.4235568,7.73212029 C7.56953281,7.73212029 6.01242428,6.83345969 6.01242428,6.37149356 C6.01242428,5.90952742 7.56953281,5.01086682 10.4235568,5.01086682 C11.7447705,5.01086682 13.0001766,5.21809452 13.8668118,5.5809957 L14.25862,4.64796563 C13.2573324,4.23047763 11.8956217,4 10.4235568,4 C7.72949585,4 5.00101242,4.81374779 5,6.36947182 L5,8.88147587 C5,8.88147587 5.09213061,9.46070255 5.40092001,9.80742987 C5.08808091,10.1551681 5,10.4938084 5,10.7465251 L5,13.2625727 C5.00101242,13.510235 5.09213061,13.8438211 5.39788274,14.1875158 C5.08808091,14.5342431 5,14.8718726 5,15.1235785 L5,17.6335608 C5.00506212,19.1872631 7.7315207,20 10.4235568,20 C13.1186303,20 15.8471137,19.1862522 15.8471137,17.6305282 L15.8471137,15.1235785 L14.8346894,15.1235785 Z" id="Amazon-DynamoDB_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, Z_ = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_Amazon-Elastic-Block-Store_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#1B660F" offset="0%"></stop>
            <stop stop-color="#6CAE3E" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_Amazon-Elastic-Block-Store_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Storage" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M19,16.5 L20,16.5 L20,20 L16.5,20 L16.5,19 L18.293,19 L16.646,17.354 L17.354,16.646 L19,18.293 L19,16.5 Z M6.707,19 L8.5,19 L8.5,20 L5,20 L5,16.5 L6,16.5 L6,18.293 L7.646,16.646 L8.354,17.354 L6.707,19 Z M20,4 L20,7.5 L19,7.5 L19,5.707 L17.354,7.354 L16.646,6.646 L18.293,5 L16.5,5 L16.5,4 L20,4 Z M5,4 L8.5,4 L8.5,5 L6.707,5 L8.354,6.646 L7.646,7.354 L6,5.707 L6,7.5 L5,7.5 L5,4 Z M12.561,15.5 C11.004,15.5 10.17,15.156 10.092,14.996 L10.082,10.053 C10.875,10.342 11.952,10.391 12.561,10.391 C13.161,10.391 14.216,10.337 15.002,10.051 L15.011,14.946 C14.896,15.14 13.955,15.5 12.561,15.5 L12.561,15.5 Z M14.943,8.994 C14.708,9.151 13.956,9.391 12.561,9.391 C11.031,9.391 10.271,9.108 10.119,9.009 C10.322,8.809 11.216,8.5 12.561,8.5 C13.78,8.5 14.684,8.796 14.943,8.994 L14.943,8.994 Z M12.561,7.5 C11.272,7.5 9.092,7.814 9.092,8.992 L9.092,14.996 C9.092,16.392 11.747,16.5 12.561,16.5 C13.838,16.5 16,16.183 16,14.996 L16,8.992 C16,7.812 13.75,7.5 12.561,7.5 L12.561,7.5 Z" id="Amazon-Elastic-Block-Store_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, W_ = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_Amazon-EC2_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#C8511B" offset="0%"></stop>
            <stop stop-color="#FF9900" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_Amazon-EC2_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Compute" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M15,9 L14,9 L13,9 L12,9 L11,9 L10,9 L10,10 L10,11 L10,12 L10,13 L10,14 L11,14 L12,14 L13,14 L14,14 L15,14 L15,13 L15,12 L15,11 L15,10 L15,9 Z M16,9 L17,9 L17,10 L16,10 L16,11 L17,11 L17,12 L16,12 L16,13 L17,13 L17,14 L16,14 L16,14.308 C16,14.689 15.689,15 15.308,15 L15,15 L15,16 L14,16 L14,15 L13,15 L13,16 L12,16 L12,15 L11,15 L11,16 L10,16 L10,15 L9.692,15 C9.311,15 9,14.689 9,14.308 L9,14 L8,14 L8,13 L9,13 L9,12 L8,12 L8,11 L9,11 L9,10 L8,10 L8,9 L9,9 L9,8.692 C9,8.311 9.311,8 9.692,8 L10,8 L10,7 L11,7 L11,8 L12,8 L12,7 L13,7 L13,8 L14,8 L14,7 L15,7 L15,8 L15.308,8 C15.689,8 16,8.311 16,8.692 L16,9 Z M12,19 L5,19 L5,13 L7,13 L7,12 L4.8,12 C4.358,12 4,12.342 4,12.762 L4,19.219 C4,19.65 4.351,20 4.781,20 L12.2,20 C12.642,20 13,19.658 13,19.238 L13,17 L12,17 L12,19 Z M20,4.781 L20,12.219 C20,12.65 19.649,13 19.219,13 L18,13 L18,12 L19,12 L19,5 L12,5 L12,6 L11,6 L11,4.781 C11,4.35 11.351,4 11.781,4 L19.219,4 C19.649,4 20,4.35 20,4.781 L20,4.781 Z" id="Amazon-EC2_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, q_ = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_Amazon-Elastic-Container-Service_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#C8511B" offset="0%"></stop>
            <stop stop-color="#FF9900" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_Amazon-Elastic-Container-Service_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Compute" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <g id="Icon-Service/16/Amazon-Elastic-Container-Service" transform="translate(4.000000, 4.000000)" fill="#FFFFFF">
            <path d="M14.9951095,10.0569914 L13.036578,8.5362249 L13.036578,5.70726144 C13.036578,5.5354178 12.9471428,5.37549395 12.7994239,5.28510221 L9.99577946,3.56765916 L9.99577946,1.38435098 L14.9951095,4.31065939 L14.9951095,10.0569914 Z M15.7538018,3.60043858 L9.7495813,0.0850938804 C9.59482816,-0.00529785955 9.4008843,-0.0072844912 9.24412139,0.0811206171 C9.08836337,0.169525725 8.99088899,0.333422836 8.99088899,0.512219684 L8.99088899,3.84380096 C8.99088899,4.01564459 9.08132914,4.17556844 9.22804314,4.26596018 L12.0316875,5.98340324 L12.0316875,8.77760065 C12.0316875,8.92957797 12.1030348,9.07360876 12.2246265,9.16797377 L15.1870436,11.4704798 C15.2774838,11.5410053 15.3860119,11.5767646 15.4975548,11.5767646 C15.5719167,11.5767646 15.6472834,11.5598783 15.7166209,11.5261055 C15.889462,11.4436603 16,11.26983 16,11.0801067 L16,4.02756438 C16,3.85174748 15.9065452,3.68884369 15.7538018,3.60043858 L15.7538018,3.60043858 Z M8.53466872,14.959005 L2.00489047,11.6701363 L2.00489047,4.30966608 L6.9871374,1.37143787 L6.9871374,3.55573937 L4.24780599,5.27020248 C4.10310176,5.36158753 4.0146714,5.51952475 4.0146714,5.69037507 L4.0146714,10.2566479 C4.0146714,10.4453779 4.12219468,10.6172216 4.29403095,10.7016534 L8.25631406,12.6425925 C8.39699873,12.7121246 8.56481544,12.710138 8.70650499,12.6396126 L11.816641,11.0751401 L13.9058083,12.8154295 L8.53466872,14.959005 Z M12.2085483,10.1036773 C12.0558049,9.97553953 11.8357339,9.95169995 11.6568634,10.0410984 L8.47538018,11.6413302 L5.01956187,9.94872 L5.01956187,5.96254361 L7.75788839,4.2480805 C7.90359751,4.15669544 7.99202787,3.99875822 7.99202787,3.8279079 L7.99202787,0.497319947 C7.99202787,0.318523099 7.89455349,0.153632672 7.73779058,0.0652275639 C7.57901789,-0.0241708602 7.38507403,-0.0211909127 7.23233068,0.0711874588 L1.24519327,3.60043858 C1.09345481,3.689837 1,3.85174748 1,4.02756438 L1,11.974091 C1,12.1608343 1.1055135,12.3316847 1.2743351,12.4161165 L8.28244121,15.9463609 C8.35278355,15.9821203 8.431165,16 8.51055135,16 C8.57385945,16 8.63716755,15.9880802 8.69846587,15.9642406 L15.0564079,13.4283053 C15.2192001,13.3627465 15.3367723,13.2177224 15.3649092,13.0448854 C15.3920413,12.8730418 15.3267234,12.6992115 15.1920681,12.5869668 L12.2085483,10.1036773 Z" id="Amazon-Elastic-Container-Service_Icon_16_Squid"></path>
        </g>
    </g>
</svg>`, bc = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_Amazon-Elastic-File-System_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#1B660F" offset="0%"></stop>
            <stop stop-color="#6CAE3E" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_Amazon-Elastic-File-System_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Storage" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M19,18.293 L17.354,16.647 L16.646,17.354 L18.293,19 L17,19 L17,20 L19.5,20 C19.776,20 20,19.776 20,19.5 L20,17 L19,17 L19,18.293 Z M6.646,16.647 L5,18.293 L5,17 L4,17 L4,19.5 C4,19.776 4.224,20 4.5,20 L7,20 L7,19 L5.707,19 L7.354,17.354 L6.646,16.647 Z M19.5,4 L17,4 L17,5 L18.293,5 L16.646,6.647 L17.354,7.354 L19,5.707 L19,7 L20,7 L20,4.5 C20,4.224 19.776,4 19.5,4 L19.5,4 Z M5,5.707 L6.646,7.354 L7.354,6.647 L5.707,5 L7,5 L7,4 L4.5,4 C4.224,4 4,4.224 4,4.5 L4,7 L5,7 L5,5.707 Z M15,12.117 C15,12.088 14.976,12.062 14.962,12.048 C14.923,12.012 14.872,11.989 14.854,11.999 L11.487,12 C11.211,12 10.987,11.776 10.987,11.5 L10.987,11.493 L10.451,11.498 C10.449,11.506 10.448,11.513 10.447,11.52 C10.447,11.795 10.225,12 9.948,12 L9.25,12 C9.103,11.989 9.002,12.031 8.979,12.054 L8.998,16 L15,16 L15,12.117 Z M15.644,11.317 C15.874,11.532 16,11.815 16,12.117 L16,16.5 C16,16.776 15.776,17 15.5,17 L8.5,17 C8.224,17 8,16.776 8,16.5 L8,12 C8,11.742 8.105,11.501 8.297,11.323 C8.584,11.055 8.992,10.981 9.284,11.001 L9.555,11.001 C9.649,10.751 9.827,10.5 10.156,10.5 L11.323,10.5 C11.637,10.557 11.803,10.779 11.89,11 L14.82,11 C15.096,10.974 15.41,11.099 15.644,11.317 L15.644,11.317 Z M16.131,10.972 C15.91,10.926 15.747,10.737 15.734,10.512 C15.687,9.71 15.266,9.425 14.918,9.425 C14.691,9.425 14.477,9.539 14.328,9.737 C14.218,9.884 14.035,9.959 13.854,9.932 C13.671,9.904 13.519,9.779 13.457,9.606 C13.292,9.144 13.055,8.757 12.752,8.458 C12.384,8.091 11.368,7.305 9.944,7.903 C9.141,8.241 8.486,9.251 8.486,10.155 C8.486,10.259 8.495,10.363 8.507,10.463 C8.538,10.713 8.377,10.948 8.131,11.009 C7.567,11.149 6.896,11.535 6.896,12.581 C6.896,12.582 6.9,12.709 6.9,12.709 C6.921,13.076 7.082,13.432 7.354,13.704 L6.646,14.411 C6.201,13.965 5.937,13.378 5.901,12.758 L5.896,12.581 C5.896,11.444 6.482,10.567 7.486,10.168 L7.486,10.155 C7.486,8.841 8.377,7.477 9.559,6.981 C10.936,6.404 12.393,6.692 13.456,7.748 C13.712,8.001 13.932,8.296 14.113,8.629 C14.996,8.154 16.402,8.511 16.688,10.083 C17.951,10.46 18.641,11.342 18.641,12.595 C18.641,13.72 18.123,14.543 17.184,14.914 L16.816,13.983 C17.379,13.762 17.641,13.32 17.641,12.595 C17.641,12.272 17.641,11.29 16.131,10.972 L16.131,10.972 Z" id="Amazon-Elastic-File-System_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, K_ = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_Amazon-ElastiCache_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#2E27AD" offset="0%"></stop>
            <stop stop-color="#527FFF" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_Amazon-ElastiCache_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Database" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M10,13 L15,13 L15,11 L10,11 L10,13 Z M10,16 L15,16 L15,14 L10,14 L10,16 Z M10,19 L15,19 L15,17 L10,17 L10,19 Z M16,10.5 L16,19.5 C16,19.777 15.776,20 15.5,20 L9.5,20 C9.224,20 9,19.777 9,19.5 L9,10.5 C9,10.224 9.224,10 9.5,10 L15.5,10 C15.776,10 16,10.224 16,10.5 L16,10.5 Z M17,12 L18,12 L18,6.5 C18,6.224 17.776,6 17.5,6 L15.5,6 C15.224,6 15,6.224 15,6.5 L15,9 L16,9 L16,7 L17,7 L17,12 Z M14,9 L14,6.5 C14,6.224 13.776,6 13.5,6 L11.5,6 C11.224,6 11,6.224 11,6.5 L11,9 L12,9 L12,7 L13,7 L13,9 L14,9 Z M9,9 L10,9 L10,6.5 C10,6.224 9.776,6 9.5,6 L7.5,6 C7.224,6 7,6.224 7,6.5 L7,12 L8,12 L8,7 L9,7 L9,9 Z M20,4.5 L20,14.5 C20,14.777 19.776,15 19.5,15 L17,15 L17,14 L19,14 L19,5 L6,5 L6,14 L8,14 L8,15 L5.5,15 C5.224,15 5,14.777 5,14.5 L5,4.5 C5,4.224 5.224,4 5.5,4 L19.5,4 C19.776,4 20,4.224 20,4.5 L20,4.5 Z" id="Amazon-ElastiCache_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, Y_ = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_AWS-Elastic-Beanstalk_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#C8511B" offset="0%"></stop>
            <stop stop-color="#FF9900" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_AWS-Elastic-Beanstalk_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Compute" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M14.9985007,13.6428238 C14.9985007,13.373991 14.7736132,13.1558078 14.4987506,13.1558078 C14.2238881,13.1558078 13.9990005,13.373991 13.9990005,13.6428238 C13.9990005,13.9116567 14.2238881,14.1298398 14.4987506,14.1298398 C14.7736132,14.1298398 14.9985007,13.9116567 14.9985007,13.6428238 M11.0004998,9.7466957 C11.0004998,10.0155285 11.2253873,10.2337117 11.5002499,10.2337117 C11.7751124,10.2337117 12,10.0155285 12,9.7466957 C12,9.47786286 11.7751124,9.25967968 11.5002499,9.25967968 C11.2253873,9.25967968 11.0004998,9.47786286 11.0004998,9.7466957 M8.001999,12.6687918 C8.001999,12.9376246 8.22688656,13.1558078 8.50174913,13.1558078 C8.77661169,13.1558078 9.00149925,12.9376246 9.00149925,12.6687918 C9.00149925,12.399959 8.77661169,12.1817758 8.50174913,12.1817758 C8.22688656,12.1817758 8.001999,12.399959 8.001999,12.6687918 M15.998001,13.6428238 C15.998001,14.2769187 15.5792104,14.8126363 14.9985007,15.0142609 L14.9985007,16.5649199 C14.9985007,16.8337528 14.7746127,17.0519359 14.4987506,17.0519359 L12,17.0519359 L12,19 L11.0004998,19 L11.0004998,16.0779039 L8.50174913,16.0779039 C8.22588706,16.0779039 8.001999,15.8597207 8.001999,15.5908879 L8.001999,14.0402289 C7.42128936,13.8386043 7.00249875,13.3028866 7.00249875,12.6687918 C7.00249875,11.8632673 7.67516242,11.2077437 8.50174913,11.2077437 C9.32833583,11.2077437 10.0009995,11.8632673 10.0009995,12.6687918 C10.0009995,13.3028866 9.5822089,13.8386043 9.00149925,14.0402289 L9.00149925,15.1038719 L11.0004998,15.1038719 L11.0004998,11.1181328 C10.4197901,10.9165082 10.0009995,10.3807906 10.0009995,9.7466957 C10.0009995,8.94117121 10.6736632,8.28564765 11.5002499,8.28564765 C12.3268366,8.28564765 12.9995002,8.94117121 12.9995002,9.7466957 C12.9995002,10.3807906 12.5807096,10.9165082 12,11.1181328 L12,16.0779039 L13.9990005,16.0779039 L13.9990005,15.0142609 C13.4182909,14.8126363 12.9995002,14.2769187 12.9995002,13.6428238 C12.9995002,12.8372993 13.6721639,12.1817758 14.4987506,12.1817758 C15.3253373,12.1817758 15.998001,12.8372993 15.998001,13.6428238 M20,12.0590477 C20,13.8054872 18.8965517,14.9392605 17.0504748,15.0892614 L16.9665167,14.1191255 C17.894053,14.043151 19.0004998,13.6243172 19.0004998,12.0590477 C19.0004998,10.9369628 18.3148426,10.2337117 16.9635182,9.96974904 C16.7406297,9.92591759 16.5767116,9.74182554 16.5627186,9.52072027 C16.4987506,8.45805132 15.888056,8.08207496 15.3843078,8.08207496 C15.0474763,8.08207496 14.7306347,8.23889412 14.5167416,8.51357115 C14.4067966,8.65480579 14.2218891,8.7249361 14.0449775,8.7005853 C13.864068,8.6733124 13.7131434,8.55350646 13.6501749,8.38694698 C13.4312844,7.80739793 13.1174413,7.32232997 12.7186407,6.94635361 C12.2278861,6.48174033 10.8795602,5.48530556 8.97751124,6.24505055 C7.88805597,6.67752077 7.03448276,7.9281779 7.03448276,9.09312021 C7.03448276,9.22169244 7.04247876,9.3512387 7.05847076,9.47786286 C7.08945527,9.7223449 6.92853573,9.9502684 6.68265867,10.0106584 C6.05397301,10.1616333 4.99950025,10.6272207 4.99950025,12.037619 L5.00449775,12.1652172 C5.06246877,13.1850288 5.93203398,14.011982 7.02848576,14.1181515 L6.93053473,15.0873133 C5.34732634,14.9353643 4.09095452,13.7139282 4.007996,12.2470359 L4,12.037619 C4,10.6827405 4.75262369,9.64150024 6.03598201,9.18467922 C6.03498251,9.15448423 6.03498251,9.1233152 6.03498251,9.09312021 C6.03498251,7.53466896 7.13743128,5.92361998 8.59970015,5.34309689 C10.2988506,4.66614462 12.0989505,5.00315971 13.4132934,6.24602458 C13.7631184,6.57524741 14.0589705,6.96583425 14.2978511,7.40999286 C14.6216892,7.21323839 14.9945027,7.10804293 15.3843078,7.10804293 C16.2858571,7.10804293 17.2903548,7.73337149 17.5192404,9.09701634 C19.1224388,9.52072027 20,10.5619605 20,12.0590477" id="AWS-Elastic-Beanstalk_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, X_ = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_Amazon-Glacier_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#1B660F" offset="0%"></stop>
            <stop stop-color="#6CAE3E" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_Amazon-Glacier_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Storage" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <polygon id="Amazon-Glacier_Icon_16_Squid" fill="#FFFFFF" points="18.3212076 12 20 13.6022806 19.2789148 14.2914755 17.3889984 12.4867195 13.3827429 12.4867195 15.3858707 15.7973856 17.9683144 16.4573773 17.7051744 17.3977194 15.4103488 16.8107356 14.7963555 19 13.8100904 18.7488527 14.5026178 16.2831317 12.50051 12.973439 10.4984021 16.2831317 11.1909295 18.7488527 10.2046644 19 9.58965119 16.8107356 7.29482559 17.3977194 7.03270551 16.4573773 9.61514925 15.7973856 11.618277 12.4867195 7.61202149 12.4867195 5.7210852 14.2914755 5 13.6022806 6.67981233 12 5 10.3977194 5.7210852 9.70852454 7.61202149 11.5132805 11.618277 11.5132805 9.61514925 8.20261438 7.03270551 7.54262272 7.29482559 6.60228063 9.58965119 7.18926436 10.2046644 5 11.1909295 5.25114727 10.4984021 7.71686831 12.50051 11.026561 14.5026178 7.71686831 13.8100904 5.25114727 14.7963555 5 15.4103488 7.18926436 17.7051744 6.60228063 17.9683144 7.54262272 15.3858707 8.20261438 13.3827429 11.5132805 17.3889984 11.5132805 19.2789148 9.70852454 20 10.3977194"></polygon>
    </g>
</svg>`, Q_ = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_AWS-Identity-and-Access-Management_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#BD0816" offset="0%"></stop>
            <stop stop-color="#FF5252" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_AWS-Identity-and-Access-Management_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Security-Identity-Compliance" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M5,18 L19,18 L19,7 L5,7 L5,18 Z M20,6.5 L20,18.5 C20,18.776 19.776,19 19.5,19 L4.5,19 C4.224,19 4,18.776 4,18.5 L4,6.5 C4,6.224 4.224,6 4.5,6 L19.5,6 C19.776,6 20,6.224 20,6.5 L20,6.5 Z M7,14.998 L10.998,15 L11,12.002 L7.002,12 L7,14.998 Z M8,11 L10,11.001 L10,9.854 C10,9.264 9.645,8.939 9,8.939 L8.999,8.939 C8.67,8.939 8.407,9.027 8.239,9.193 C8.042,9.388 8.001,9.659 8.001,9.852 L8,11 Z M6.146,15.852 C6.053,15.758 6,15.63 6,15.498 L6.002,11.5 C6.002,11.224 6.226,11 6.502,11 L7,11 L7.001,9.852 C7.001,9.301 7.187,8.827 7.537,8.481 C7.896,8.127 8.401,7.939 8.999,7.939 L9,7.939 C10.196,7.939 11,8.708 11,9.854 L11,11.002 L11.5,11.002 C11.633,11.002 11.76,11.055 11.854,11.148 C11.947,11.242 12,11.37 12,11.502 L11.998,15.5 C11.998,15.776 11.774,16 11.498,16 L6.5,15.998 C6.367,15.998 6.24,15.945 6.146,15.852 L6.146,15.852 Z M14,14 L16,14 L16,13 L14,13 L14,14 Z M14,11 L18,11 L18,10 L14,10 L14,11 Z" id="AWS-Identity-and-Access-Management_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, J_ = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_Amazon-Kinesis_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#4D27A8" offset="0%"></stop>
            <stop stop-color="#A166FF" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_Amazon-Kinesis_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Analytics" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M6.7337492,17.8414023 L7.72616432,17.8414023 C7.72616432,16.9338898 7.72616432,14.8073456 19,14.8073456 L19,13.8056761 C8.21939463,13.8056761 6.7337492,15.7449082 6.7337492,17.8414023 M8.03778266,20 L9.03019777,20 C9.03019777,18.9632721 9.03019777,16.5342237 19,16.5342237 L19,15.5325543 C9.3408237,15.5325543 8.03778266,17.7903172 8.03778266,20 M5.99241511,9.38931553 L5,9.38931553 C5,10.8287145 5.99340753,11.9105175 9.81718296,12.4994992 C5.99340753,13.0894825 5,14.1712855 5,15.6096828 L5.99241511,15.6096828 C5.99241511,14.3956594 7.47111363,13.0003339 19,13.0003339 L19,11.9986644 C7.47111363,11.9986644 5.99241511,10.6043406 5.99241511,9.38931553 M7.72616432,7.15859766 L6.7337492,7.15859766 C6.7337492,9.25409015 8.21939463,11.1943239 19,11.1943239 L19,10.1926544 C7.72616432,10.1926544 7.72616432,8.06611018 7.72616432,7.15859766 M19,8.46577629 L19,9.46744574 C9.3408237,9.46744574 8.03778266,7.20868114 8.03778266,5 L9.03019777,5 C9.03019777,6.03672788 9.03019777,8.46577629 19,8.46577629" id="Amazon-Kinesis_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, tL = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_AWS-Lambda_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#C8511B" offset="0%"></stop>
            <stop stop-color="#FF9900" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_AWS-Lambda_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Compute" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M8.35471698,19 L5.33377354,19 L8.87677893,11.806 L10.3893141,14.832 L8.35471698,19 Z M9.3369363,10.435 C9.25026989,10.262 9.06971487,10.153 8.87265196,10.153 L8.87058847,10.153 C8.67352556,10.153 8.49297054,10.264 8.40733588,10.437 L4.05028527,19.285 C3.97393629,19.439 3.98528546,19.622 4.07917407,19.767 C4.17409443,19.912 4.33814156,20 4.51560135,20 L8.68074777,20 C8.8809059,20 9.06249267,19.889 9.14812734,19.714 L11.4282793,15.043 C11.4943109,14.907 11.4932791,14.748 11.4262158,14.611 L9.3369363,10.435 Z M18.968257,19 L15.7987426,19 L10.1747116,7.289 C10.0901087,7.113 9.90749017,7 9.70733203,7 L7.61598901,7 L7.6180525,5 L11.7883576,5 L17.386595,16.71 C17.471198,16.887 17.6548482,17 17.8550063,17 L18.968257,17 L18.968257,19 Z M19.4841285,16 L18.1841324,16 L12.5869267,4.29 C12.5023238,4.113 12.3186735,4 12.1174836,4 L7.10321275,4 C6.81845169,4 6.58734126,4.224 6.58734126,4.5 L6.58424603,7.5 C6.58424603,7.632 6.63892841,7.759 6.73591225,7.854 C6.83186434,7.947 6.9628957,8 7.10011752,8 L9.37820602,8 L15.002237,19.711 C15.0868399,19.887 15.2694584,20 15.4696166,20 L19.4841285,20 C19.7688896,20 20,19.776 20,19.5 L20,16.5 C20,16.224 19.7688896,16 19.4841285,16 L19.4841285,16 Z" id="AWS-Lambda_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, eL = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_Amazon-Lightsail_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#C8511B" offset="0%"></stop>
            <stop stop-color="#FF9900" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_Amazon-Lightsail_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Compute" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M20,12.5 C20,16.636 16.636,20 12.5,20 C9.458,20 6.738,18.185 5.571,15.376 L6.495,14.992 C7.506,17.427 9.863,19 12.5,19 C16.084,19 19,16.084 19,12.5 C19,8.916 16.084,6 12.5,6 C9.826,6 7.386,7.677 6.429,10.173 L5.495,9.815 C6.6,6.935 9.415,5 12.5,5 C16.636,5 20,8.364 20,12.5 L20,12.5 Z M7,13 L10,13 L10,12 L7,12 L7,13 Z M4,13 L6,13 L6,12 L4,12 L4,13 Z M14.193,9.163 C14.792,10.014 15.392,11.192 15.392,12.501 C15.392,13.794 14.737,15.02 14.188,15.82 C13.856,14.343 13.213,13.192 12.331,12.501 C13.217,11.807 13.862,10.65 14.193,9.163 L14.193,9.163 Z M13.382,17.081 C13.402,17.277 13.537,17.443 13.725,17.504 C13.775,17.521 13.827,17.528 13.879,17.528 C14.018,17.528 14.153,17.47 14.25,17.363 C14.753,16.806 16.392,14.81 16.392,12.501 C16.392,10.33 15.051,8.521 14.251,7.636 C14.118,7.49 13.913,7.434 13.725,7.496 C13.537,7.557 13.403,7.723 13.383,7.919 C13.163,10 12.334,11.541 11.165,12.042 C10.981,12.12 10.862,12.301 10.862,12.501 C10.862,12.701 10.981,12.882 11.165,12.96 C12.334,13.462 13.162,15.002 13.382,17.081 L13.382,17.081 Z" id="Amazon-Lightsail-Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, nL = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_Amazon-RDS_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#2E27AD" offset="0%"></stop>
            <stop stop-color="#527FFF" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_Amazon-RDS_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Database" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M5.707,5 L7.853,7.146 L7.146,7.854 L5,5.707 L5,7.5 L4,7.5 L4,4.5 C4,4.224 4.224,4 4.5,4 L7.5,4 L7.5,5 L5.707,5 Z M7.853,16.854 L5.707,19 L7.5,19 L7.5,20 L4.5,20 C4.224,20 4,19.776 4,19.5 L4,16.5 L5,16.5 L5,18.293 L7.146,16.146 L7.853,16.854 Z M5,12 C5,12.75 5.966,13.542 7.519,14.069 L7.199,15.016 C5.166,14.328 4,13.228 4,12 C4,10.772 5.166,9.672 7.199,8.984 L7.519,9.931 C5.966,10.458 5,11.25 5,12 L5,12 Z M19,16.5 L20,16.5 L20,19.5 C20,19.776 19.776,20 19.5,20 L16.5,20 L16.5,19 L18.293,19 L16.146,16.854 L16.853,16.146 L19,18.293 L19,16.5 Z M20,4.5 L20,7.5 L19,7.5 L19,5.707 L16.853,7.854 L16.146,7.146 L18.293,5 L16.5,5 L16.5,4 L19.5,4 C19.776,4 20,4.224 20,4.5 L20,4.5 Z M20,12 C20,13.228 18.834,14.328 16.801,15.016 L16.48,14.069 C18.034,13.542 19,12.75 19,12 C19,11.25 18.034,10.458 16.48,9.931 L16.801,8.984 C18.834,9.672 20,10.772 20,12 L20,12 Z M12,15.402 C10.81,15.402 10.087,15.104 10,15.032 L10,10.651 C10.564,10.886 11.294,11 12,11 C12.708,11 13.439,10.886 14.004,10.65 L14.02,14.952 C13.913,15.104 13.19,15.402 12,15.402 L12,15.402 Z M12,9 C13.174,9 13.858,9.336 13.987,9.5 C13.858,9.664 13.174,10 12,10 C10.771,10 10.08,9.632 10,9.531 L10,9.521 C10.08,9.368 10.771,9 12,9 L12,9 Z M12,8 C10.555,8 9,8.469 9,9.5 L9,15.032 C9,15.979 10.507,16.402 12,16.402 C13.493,16.402 15,15.979 15,15.032 L15,9.5 C15,8.469 13.445,8 12,8 L12,8 Z" id="Amazon-RDS_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, rL = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_Amazon-Redshift_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#4D27A8" offset="0%"></stop>
            <stop stop-color="#A166FF" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_Amazon-Redshift_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Analytics" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M14.4737051,10.7348035 C14.4737051,10.6013584 14.5788847,10.4925493 14.7078785,10.4925493 C14.8368724,10.4925493 14.9430443,10.6013584 14.9430443,10.7348035 C14.9430443,11.0016937 14.4737051,11.0016937 14.4737051,10.7348035 M13.2562016,13.756822 C13.2562016,13.6233768 13.3623735,13.5145678 13.4913673,13.5145678 C13.6203612,13.5145678 13.7245485,13.6233768 13.7245485,13.756822 C13.7245485,14.0247387 13.2562016,14.0247387 13.2562016,13.756822 M10.3349871,13.25281 C10.3349871,13.1193649 10.441159,13.0105559 10.5691605,13.0105559 C10.6981544,13.0105559 10.8043263,13.1193649 10.8043263,13.25281 C10.8043263,13.5207268 10.3349871,13.5207268 10.3349871,13.25281 M9.11847589,16.0233358 C9.11847589,15.8898907 9.22365549,15.7810816 9.35264934,15.7810816 C9.48164318,15.7810816 9.58583052,15.8898907 9.58583052,16.0233358 C9.58583052,16.290226 9.11847589,16.290226 9.11847589,16.0233358 M14.7078785,9.46604849 C14.0321492,9.46604849 13.4814447,10.0347299 13.4814447,10.7348035 C13.4814447,11.0899728 13.6253225,11.4092146 13.8525501,11.6401772 L13.5270887,12.4952524 C13.5141893,12.4952524 13.5032745,12.4880669 13.4913673,12.4880669 C13.0359198,12.4880669 12.6529073,12.7580366 12.4405636,13.1409215 L11.7420123,12.9766813 C11.6159952,12.4131324 11.1506251,11.984055 10.5691605,11.984055 C9.89343124,11.984055 9.34272673,12.5527365 9.34272673,13.25281 C9.34272673,13.5145678 9.43897599,13.7455304 9.57094662,13.9477511 L9.22762453,14.7802433 C8.6124231,14.8490188 8.12621552,15.3694548 8.12621552,16.0233358 C8.12621552,16.7234094 8.67592776,17.2920908 9.35264934,17.2920908 C10.0293709,17.2920908 10.5780909,16.7234094 10.5780909,16.0233358 C10.5780909,15.654822 10.4203215,15.3294212 10.1762254,15.097432 L10.4262751,14.4917965 C10.4748958,14.4989821 10.5185553,14.5215651 10.5691605,14.5215651 C10.9779718,14.5215651 11.3222862,14.3008674 11.5455448,13.9836786 L12.3453066,14.1715283 C12.5129986,14.6663017 12.9575313,15.025577 13.4913673,15.025577 C14.1670966,15.025577 14.7168089,14.455869 14.7168089,13.756822 C14.7168089,13.4478452 14.5967454,13.1737695 14.4181385,12.9530718 L14.7862671,11.9871345 C15.4242905,11.942995 15.9353046,11.4061351 15.9353046,10.7348035 C15.9353046,10.0347299 15.3846001,9.46604849 14.7078785,9.46604849 M12,18.9734992 C9.35562612,18.9734992 7.99226037,18.1461395 7.99226037,17.7930232 L7.99226037,8.59044328 C8.95276841,9.14885973 10.4808494,9.43730646 12,9.43730646 C13.5191506,9.43730646 15.0472316,9.14885973 16.0077396,8.59044328 L16.0077396,17.7930232 C16.0077396,18.1461395 14.6443739,18.9734992 12,18.9734992 M12,5.99236968 C14.4866045,5.99236968 16.0077396,6.77558981 16.0077396,7.20261416 C16.0077396,7.628612 14.4866045,8.41080563 12,8.41080563 C9.51339551,8.41080563 7.99226037,7.628612 7.99226037,7.20261416 C7.99226037,6.77558981 9.51339551,5.99236968 12,5.99236968 M17,7.20261416 C17,4.26579528 7,4.26579528 7,7.20261416 C7,7.20466716 7.00099226,7.20672016 7.00099226,7.20877316 L7,7.20877316 L7,17.7930232 C7,19.2424424 9.51538004,20 12,20 C14.48462,20 17,19.2424424 17,17.7930232 L17,7.20877316 L16.9990077,7.20877316 C16.9990077,7.20672016 17,7.20466716 17,7.20261416" id="Amazon-Redshift_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, sL = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <title>Icon-Architecture/16/Arch_Amazon-Simple-Storage-Service_16</title>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#1B660F" offset="0%"></stop>
            <stop stop-color="#6CAE3E" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_Amazon-Simple-Storage-Service_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Rectangle" fill="url(#linearGradient-1)">
            <rect x="0" y="0" width="24" height="24"></rect>
        </g>
        <g id="Icon-Service/16/Amazon-Simple-Storage-Service_16" transform="translate(4.000000, 4.000000)" fill="#FFFFFF">
            <path d="M13.9082,9.0508 L13.9492,8.8068 C14.2152,8.9598 14.4192,9.0888 14.5642,9.1918 C14.3942,9.1638 14.1662,9.1138 13.9082,9.0508 L13.9082,9.0508 Z M12.0492,14.0928 C11.9992,14.3958 10.9792,14.9998 7.4782,14.9998 C4.0442,14.9998 3.0432,14.3968 2.9932,14.0898 L1.2592,3.9648 C2.6962,4.6678 5.1522,4.9998 7.5002,4.9998 C9.8502,4.9998 12.3112,4.6658 13.7482,3.9618 L12.9402,8.7748 C11.3852,8.2668 9.5682,7.3978 8.6442,6.9548 L8.4742,6.8728 C8.4092,6.3838 8.0072,5.9998 7.5002,5.9998 C6.9482,5.9998 6.5002,6.4488 6.5002,6.9998 C6.5002,7.5508 6.9482,7.9998 7.5002,7.9998 C7.7212,7.9998 7.9142,7.9138 8.0792,7.7928 L8.2132,7.8568 C9.1842,8.3228 11.1192,9.2468 12.7732,9.7698 L12.0492,14.0928 Z M7.5002,0.9998 C11.7612,0.9998 13.9712,2.0368 14.0002,2.4898 L14.0002,2.5188 C13.9462,2.9768 11.7352,3.9998 7.5002,3.9998 C3.2702,3.9998 1.0592,2.9798 1.0002,2.5208 L1.0002,2.4888 C1.0302,2.0348 3.2422,0.9998 7.5002,0.9998 L7.5002,0.9998 Z M15.0002,2.4998 C15.0002,0.7818 11.1122,-0.0002 7.5002,-0.0002 C3.8872,-0.0002 0.0002,0.7818 0.0002,2.4998 L0.0472,2.8158 L2.0072,14.2548 C2.1972,15.4248 3.9362,15.9998 7.4782,15.9998 C12.2072,15.9998 12.9142,14.9908 13.0352,14.2568 L13.7422,10.0428 C14.3202,10.1828 14.7312,10.2388 15.0232,10.2388 C15.4852,10.2388 15.6612,10.1038 15.7832,9.9598 C15.9292,9.7858 15.9852,9.5668 15.9422,9.3428 C15.8492,8.8678 15.3302,8.4158 14.1252,7.7598 L14.9542,2.8138 L15.0002,2.4998 Z" id="Amazon-Simple-Storage-Service-Icon_16_Squid"></path>
        </g>
    </g>
</svg>`, iL = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_AWS-Simple-Notification-Service_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#B0084D" offset="0%"></stop>
            <stop stop-color="#FF4F8B" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_AWS-Simple-Notification-Service_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Application-Integration" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M6.4951189,11.5607705 C6.4951189,11.9743992 6.15969962,12.3097195 5.74818523,12.3097195 C5.33667084,12.3097195 5.00125156,11.9743992 5.00125156,11.5607705 C5.00125156,11.1471419 5.33667084,10.8118215 5.74818523,10.8118215 C6.15969962,10.8118215 6.4951189,11.1471419 6.4951189,11.5607705 L6.4951189,11.5607705 Z M12.4395494,18.9960469 C9.28861076,18.9960469 6.52015019,16.6006149 5.7261577,13.3116647 C5.73316646,13.3116647 5.74017522,13.3136726 5.74818523,13.3136726 C6.71239049,13.3136726 7.49637046,12.5275773 7.49637046,11.5607705 C7.49637046,10.6441614 6.78948686,9.89822426 5.89436796,9.82292778 C6.84155194,6.99579595 9.47083855,5.00395307 12.4395494,5.00395307 C13.7481852,5.00395307 14.8715895,5.23486227 15.7787234,5.68965301 L16.2272841,4.79111502 C15.1789737,4.26604756 13.9043805,4 12.4395494,4 C8.82202753,4 5.62302879,6.56610403 4.74593242,10.1291335 C4.29637046,10.4463826 4,10.9684382 4,11.5607705 C4,12.0958775 4.24530663,12.5697434 4.62377972,12.8910083 C5.29461827,16.9570183 8.61677096,20 12.4395494,20 C13.58398,20 14.9296621,19.6395808 16.2282854,18.9850035 L15.7777222,18.0874694 C14.6162703,18.673778 13.4307885,18.9960469 12.4395494,18.9960469 L12.4395494,18.9960469 Z M8.75994994,9.96046935 L12.2392991,9.96046935 L11.0217772,12.8056723 C10.9947434,12.8689214 10.9807259,12.9361862 10.9807259,13.0034511 L10.9807259,14.7061555 L10.0455569,15.1910648 L10.0455569,13.0034511 C10.0455569,12.9341783 10.0305382,12.8659095 10.0035044,12.8016565 L8.75994994,9.96046935 Z M9.28460576,16.4450022 C9.36370463,16.4931919 9.45481852,16.5172868 9.54493116,16.5172868 C9.62403004,16.5172868 9.70212766,16.4992157 9.77421777,16.4620694 L11.7116395,15.4581163 C11.8778473,15.3717764 11.9819775,15.2001004 11.9819775,15.0123612 L11.9819775,13.1068583 L13.4588235,9.65727552 C13.5249061,9.5016628 13.5098874,9.32295915 13.4177722,9.18240572 C13.3246558,9.04185229 13.1674593,8.95651628 12.9992491,8.95651628 L7.99299124,8.95651628 C7.82377972,8.95651628 7.66658323,9.04285625 7.57346683,9.18441363 C7.48135169,9.32597101 7.46733417,9.50567861 7.53441802,9.66028738 L9.04430538,13.1088662 L9.04430538,16.0153103 C9.04430538,16.1910021 9.13541927,16.3536425 9.28460576,16.4450022 L9.28460576,16.4450022 Z M18.2518148,14.823618 C18.6633292,14.823618 18.9987484,15.1589383 18.9987484,15.572567 C18.9987484,15.9861956 18.6633292,16.3225199 18.2518148,16.3225199 C17.8403004,16.3225199 17.5048811,15.9861956 17.5048811,15.572567 C17.5048811,15.1589383 17.8403004,14.823618 18.2518148,14.823618 L18.2518148,14.823618 Z M18.2518148,6.75384326 C18.6633292,6.75384326 18.9987484,7.09016753 18.9987484,7.50279224 C18.9987484,7.91642091 18.6633292,8.25274518 18.2518148,8.25274518 C17.8403004,8.25274518 17.5048811,7.91642091 17.5048811,7.50279224 C17.5048811,7.09016753 17.8403004,6.75384326 18.2518148,6.75384326 L18.2518148,6.75384326 Z M18.2518148,10.8118215 C18.6633292,10.8118215 18.9987484,11.1471419 18.9987484,11.5607705 C18.9987484,11.9743992 18.6633292,12.3097195 18.2518148,12.3097195 C17.8403004,12.3097195 17.5048811,11.9743992 17.5048811,11.5607705 C17.5048811,11.1471419 17.8403004,10.8118215 18.2518148,10.8118215 L18.2518148,10.8118215 Z M16.0030038,12.0627471 L16.5857322,12.0627471 C16.8030038,12.7835854 17.4628285,13.3136726 18.2518148,13.3136726 C19.21602,13.3136726 20,12.5275773 20,11.5607705 C20,10.5939637 19.21602,9.80786848 18.2518148,9.80786848 C17.4628285,9.80786848 16.8030038,10.3379557 16.5857322,11.058794 L16.0030038,11.058794 L16.0030038,8.00476878 L16.5857322,8.00476878 C16.8030038,8.72661103 17.4628285,9.25669825 18.2518148,9.25669825 C19.21602,9.25669825 20,8.46959905 20,7.50279224 C20,6.5369894 19.21602,5.74989019 18.2518148,5.74989019 C17.4628285,5.74989019 16.8030038,6.27997741 16.5857322,7.00081571 L15.502378,7.00081571 C15.2260325,7.00081571 15.0017522,7.2257012 15.0017522,7.50279224 L15.0017522,11.058794 L14.0005006,11.058794 L14.0005006,12.0627471 L15.0017522,12.0627471 L15.0017522,15.572567 C15.0017522,15.849658 15.2260325,16.0745435 15.502378,16.0745435 L16.5857322,16.0745435 C16.8030038,16.7953818 17.4628285,17.326473 18.2518148,17.326473 C19.21602,17.326473 20,16.5393738 20,15.572567 C20,14.6057602 19.21602,13.8196649 18.2518148,13.8196649 C17.4628285,13.8196649 16.8030038,14.3497521 16.5857322,15.0705904 L16.0030038,15.0705904 L16.0030038,12.0627471 Z" id="AWS-Simple-Notification-Service_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, oL = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_AWS-Simple-Queue-Service_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#B0084D" offset="0%"></stop>
            <stop stop-color="#FF4F8B" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_AWS-Simple-Queue-Service_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Application-Integration" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M8.00538392,12.9850432 L9.00704291,12.9850432 L9.00704291,11.9942745 L8.00538392,11.9942745 L8.00538392,12.9850432 Z M15.0169969,12.986034 L16.0186559,12.986034 L16.0186559,11.9952653 L15.0169969,11.9952653 L15.0169969,12.986034 Z M12.7903089,11.2234565 C12.2824678,11.3522564 11.741572,11.3522564 11.2337309,11.2234565 C11.4350643,12.005173 11.4350643,12.8780402 11.2337309,13.6597567 C11.4881523,13.5953567 11.7485836,13.5626614 12.0120199,13.5626614 C12.2754562,13.5626614 12.5358876,13.5953567 12.7903089,13.6597567 C12.5889755,12.8780402 12.5889755,12.005173 12.7903089,11.2234565 L12.7903089,11.2234565 Z M14.3699252,10.3149216 C13.4053276,11.2690318 13.4053276,13.6141813 14.3699252,14.5682916 C14.4670861,14.6653869 14.5161674,14.7922053 14.5161674,14.9190237 C14.5161674,15.0458421 14.4670861,15.1726605 14.3699252,15.2687651 C14.2717626,15.3658604 14.1435503,15.4144081 14.0153379,15.4144081 C13.8871256,15.4144081 13.7589132,15.3658604 13.6617523,15.2687651 C12.7282061,14.3463594 11.2958337,14.3463594 10.3632892,15.2687651 C10.166964,15.4629557 9.85043979,15.4629557 9.65511629,15.2687651 C9.5569537,15.1726605 9.50787241,15.0458421 9.50787241,14.9190237 C9.50787241,14.7922053 9.5569537,14.6653869 9.65511629,14.5682916 C10.6187122,13.6141813 10.6187122,11.2690318 9.65511629,10.3149216 C9.5569537,10.218817 9.50787241,10.0919986 9.50787241,9.96518021 C9.50787241,9.83836181 9.5569537,9.71154342 9.65511629,9.61444809 C9.85043979,9.42124819 10.166964,9.42124819 10.3632892,9.61444809 C11.2958337,10.5378445 12.7282061,10.5378445 13.6617523,9.61444809 C13.8570758,9.42124819 14.1736,9.42124819 14.3699252,9.61444809 C14.4670861,9.71154342 14.5161674,9.83836181 14.5161674,9.96518021 C14.5161674,10.0919986 14.4670861,10.218817 14.3699252,10.3149216 L14.3699252,10.3149216 Z M18.8162895,12.0794806 C18.6980937,11.9635607 18.5418349,11.8991607 18.3755595,11.8991607 C18.2082825,11.8991607 18.051022,11.9635607 17.9328262,12.0794806 C17.6894231,12.3212282 17.6894231,12.7125818 17.9328262,12.9533386 C18.1692178,13.1851785 18.5788963,13.18716 18.8162895,12.9533386 C19.0596926,12.7125818 19.0596926,12.3212282 18.8162895,12.0794806 L18.8162895,12.0794806 Z M19.5244624,13.6538121 C19.2169531,13.9569873 18.8092779,14.1244272 18.3755595,14.1244272 C17.9398379,14.1244272 17.5321626,13.9569873 17.2246533,13.6538121 C16.5906032,13.0266555 16.5906032,12.0061637 17.2246533,11.3790071 C17.8376686,10.7726567 18.9094438,10.7716659 19.5244624,11.3790071 C20.1585125,12.0061637 20.1585125,13.0266555 19.5244624,13.6538121 L19.5244624,13.6538121 Z M6.0661721,12.0854252 C5.94797634,11.9695053 5.79171753,11.9051053 5.62544214,11.9051053 C5.45816509,11.9051053 5.30190628,11.9695053 5.18371052,12.0854252 C4.93930573,12.326182 4.93930573,12.7185264 5.18371052,12.9592832 C5.42010204,13.1911231 5.82978057,13.1931046 6.0661721,12.9592832 C6.31057689,12.7185264 6.31057689,12.326182 6.0661721,12.0854252 L6.0661721,12.0854252 Z M6.77534667,13.6597567 C6.46783736,13.9629319 6.06016214,14.1303718 5.62544214,14.1303718 C5.18972047,14.1303718 4.78204526,13.9629319 4.47553761,13.6597567 C3.84148746,13.0326001 3.84148746,12.0121083 4.47553761,11.3849518 C5.08955457,10.7776105 6.15932638,10.7776105 6.77534667,11.3849518 C7.40839515,12.0121083 7.40839515,13.0326001 6.77534667,13.6597567 L6.77534667,13.6597567 Z M15.8844336,16.4081491 C13.7248568,18.5432556 10.2130403,18.5422649 8.05546687,16.4081491 C7.47650797,15.8354848 7.10889911,15.3371281 6.86148934,14.7922053 L5.94797634,15.196439 C6.24647072,15.8562909 6.67818575,16.4467891 7.34729396,17.1086225 C8.6214042,18.3698711 10.2951764,19 11.9699502,19 C13.6437224,19 15.3184963,18.3698711 16.5926065,17.1086225 C17.1044543,16.6033305 17.6753999,15.9821185 18.0400038,15.2013928 L17.1294957,14.7862607 C16.8330047,15.423325 16.356215,15.9424878 15.8844336,16.4081491 L15.8844336,16.4081491 Z M6.8795192,10.1722509 L5.97001283,9.75711878 C6.26750556,9.12104527 6.70523054,8.52856559 7.34929727,7.89051055 C9.8965161,5.36999497 14.0433844,5.36999497 16.5906032,7.88951978 C17.0563746,8.35121799 17.6393402,8.97936535 18.0139606,9.7501834 L17.1124675,10.1791862 C16.8670611,9.67587575 16.4994522,9.20129754 15.8824303,8.58999325 C13.7238551,6.45686824 10.214042,6.45884977 8.05747018,8.58999325 C7.49153285,9.15076834 7.12893229,9.63822654 6.8795192,10.1722509 L6.8795192,10.1722509 Z" id="AWS-Simple-Queue-Service_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, aL = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_AWS-SageMaker_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#055F4E" offset="0%"></stop>
            <stop stop-color="#56C0A7" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_AWS-SageMaker_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Machine-Learning" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M19.000533,13.6672874 L17.3104344,12.3579393 L16.6857676,13.1152694 L18.5747601,14.5766646 L17.2604611,15.2080958 C17.0895522,15.2894458 16.9816098,15.4579566 16.9816098,15.6419626 L16.9816098,17.2989853 L14.0161914,18.9482603 L12.96875,18.2858386 L12.96875,15.6574578 L14.9986674,15.6574578 L14.9986674,14.6890051 L12.96875,14.6890051 L12.96875,12.7366043 L11.969283,12.7366043 L11.969283,18.2906809 L10.9788113,18.9453549 L9.91038113,18.350725 L11.3546109,16.9532476 L10.6479877,16.2685515 L9.01285981,17.8519718 L8.01839019,17.2989853 L8.01839019,15.6419626 C8.01839019,15.4579566 7.91044776,15.2894458 7.73953891,15.2080958 L5.99946695,14.3732895 L5.99946695,11.0941084 L7.43370203,10.3726111 L9.00186567,11.1047614 L9.00186567,12.477059 L7.72554638,13.3021807 L8.27925107,14.1079334 L9.77845149,13.1394807 C9.9173774,13.0494146 10.0013326,12.8983359 10.0013326,12.7366043 L10.0013326,11.0592442 L11.2776519,10.2341224 L10.7239472,9.42836971 L9.46162047,10.2438069 L7.9244403,9.52715189 L7.9244403,7.24644565 L9.00186567,6.80386274 L9.00186567,8.827929 L10.0013326,8.827929 L10.0013326,6.39323877 L10.958822,6.00004695 L11.969283,6.31188874 L11.969283,9.83124606 C11.969283,9.97941933 12.0392457,10.1188765 12.1591818,10.2108795 L14.6898321,12.147785 L15.3085021,11.3885181 L12.96875,9.59688049 L12.96875,6.30704647 L13.9132463,6.0010154 L16.9976013,7.24838255 L16.9976013,7.95535307 L14.9986674,7.95535307 L14.9986674,8.92380582 L16.9976013,8.92380582 L16.9976013,9.83124606 C16.9976013,10.0152521 17.1055437,10.1827944 17.2734542,10.2641444 L19.000533,11.0989507 L19.000533,13.6672874 Z M19.7241471,10.3668004 L17.9970682,9.53199415 L17.9970682,6.92588779 C17.9970682,6.73026033 17.8761327,6.55400193 17.6892324,6.47943106 L14.1251333,5.03740491 C14.013193,4.99188763 13.8892591,4.98898227 13.7743204,5.02578348 L12.4660181,5.44899733 L11.0857543,5.02287812 C10.9728145,4.98801382 10.8498801,4.99285608 10.7389392,5.03837336 L7.22981077,6.48039952 C7.04490938,6.55593883 6.92497335,6.73122878 6.92497335,6.92588779 L6.92497335,9.53683642 L5.26985608,10.3697058 C5.10394456,10.4529927 5,10.6195666 5,10.7996988 L5,14.6735098 C5,14.8575159 5.10794243,15.0260266 5.27885128,15.1073767 L7.01892324,15.9431514 L7.01892324,17.5788681 C7.01892324,17.7522212 7.1138726,17.9129843 7.26978945,17.9991766 L10.7519323,19.9360821 C10.8288913,19.978694 10.9148454,20 11.0007996,20 C11.0997468,20 11.1966951,19.9719149 11.2816498,19.9157446 L12.4750133,19.129361 L13.7263459,19.9215553 C13.8093017,19.9738518 13.9032516,20 13.9992004,20 C14.0851546,20 14.1711087,19.978694 14.2480677,19.9360821 L17.7302106,17.9991766 C17.8861274,17.9129843 17.9810768,17.7522212 17.9810768,17.5788681 L17.9810768,15.9431514 L19.7221482,15.1073767 C19.893057,15.0260266 20,14.8575159 20,14.6735098 L20,10.7996988 C20,10.6166612 19.893057,10.4481505 19.7241471,10.3668004 L19.7241471,10.3668004 Z" id="AWS-SageMaker_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, lL = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_Amazon-Virtual-Private-Cloud_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#4D27A8" offset="0%"></stop>
            <stop stop-color="#A166FF" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_Amazon-Virtual-Private-Cloud_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Networking-Content-Delivery" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M16.997,11.8210743 L15.074,10.8030743 L15.074,18.4610743 C16.958,18.0830743 16.996,15.6320743 16.997,15.5190743 L16.997,11.8210743 Z M12.851,17.8750743 C13.178,18.2020743 13.581,18.4000743 14.074,18.4770743 L14.074,10.7820743 L11.981,11.8290743 L11.981,15.5200743 C11.981,15.5370743 11.988,17.0100743 12.851,17.8750743 L12.851,17.8750743 Z M17.997,11.5200743 L17.997,15.5200743 C17.997,16.9020743 17.28,19.5140743 14.567,19.5140743 C13.573,19.5140743 12.756,19.1990743 12.138,18.5760743 C10.980946,17.4110743 10.98,15.5930743 10.980946,15.5160743 L10.980946,11.5200743 C10.980946,11.3300743 11.089,11.1570743 11.258,11.0720743 L14.351,9.52607432 C14.495,9.45307432 14.667,9.45607432 14.808,9.53107432 L17.73,11.0780743 C17.894,11.1640743 17.997,11.3350743 17.997,11.5200743 L17.997,11.5200743 Z M19.69,9.73507432 L18.753,10.0810743 C18.547,9.52407432 18.199,9.29607432 17.555,9.29607432 C17.29,9.29607432 17.071,9.09007432 17.056,8.82607432 C16.986,7.66307432 16.389,7.10607432 15.862,7.07907432 C15.189,7.04807432 14.968,7.33607432 14.894,7.43107432 C14.783,7.57707432 14.6,7.64907432 14.422,7.62407432 C14.241,7.59607432 14.089,7.47307432 14.026,7.30107432 C13.811,6.71307432 13.509,6.24207432 13.076,5.82007432 C12.144,4.91807432 10.407,4.73107432 8.851,5.36907432 C7.789,5.80407432 7.102,6.92707432 7.102,8.23007432 C7.102,8.37407432 7.121,8.59807432 7.138,8.73707432 C7.168,8.98707432 7.007,9.22007432 6.762,9.28107432 C5.576,9.57507432 5,10.2550743 5,11.3570743 C5,11.4070743 4.999,11.4580743 5.004,11.5080743 C5.061,12.5170743 5.613,13.5770743 6.995,13.5770743 L8.997,13.5770743 L8.997,14.5770743 L6.995,14.5770743 C5.309,14.5770743 4.107,13.3730743 4.007,11.5810743 C4.001,11.5170743 4,11.4370743 4,11.3570743 C4,9.93307432 4.745,8.90807432 6.109,8.43307432 C6.105,8.36007432 6.102,8.28907432 6.102,8.23007432 C6.102,6.51907432 7.033,5.03307432 8.473,4.44307432 C10.386,3.66207432 12.564,3.93307432 13.772,5.10207432 C14.145,5.46607432 14.447,5.86907432 14.686,6.32307432 C14.986,6.16107432 15.382,6.05107432 15.913,6.08007432 C16.968,6.13407432 17.786,7.03507432 18.004,8.32807432 C18.824,8.44907432 19.39,8.92107432 19.69,9.73507432 L19.69,9.73507432 Z" id="Amazon-Virtual-Private-Cloud_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, cL = '<svg id="bdb56329-4717-4410-aa13-4505ecaa4e46" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><defs><linearGradient id="ba2610c3-a45a-4e7e-a0c0-285cfd7e005d" x1="13.25" y1="13.02" x2="8.62" y2="4.25" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#1988d9" /><stop offset="0.9" stop-color="#54aef0" /></linearGradient><linearGradient id="bd8f618b-4f2f-4cb7-aff0-2fd2d211326d" x1="11.26" y1="10.47" x2="14.46" y2="15.99" gradientUnits="userSpaceOnUse"><stop offset="0.1" stop-color="#54aef0" /><stop offset="0.29" stop-color="#4fabee" /><stop offset="0.51" stop-color="#41a2e9" /><stop offset="0.74" stop-color="#2a93e0" /><stop offset="0.88" stop-color="#1988d9" /></linearGradient></defs><title>Icon-identity-221</title><polygon points="1.01 10.19 8.93 15.33 16.99 10.17 18 11.35 8.93 17.19 0 11.35 1.01 10.19" fill="#50e6ff" /><polygon points="1.61 9.53 8.93 0.81 16.4 9.54 8.93 14.26 1.61 9.53" fill="#fff" /><polygon points="8.93 0.81 8.93 14.26 1.61 9.53 8.93 0.81" fill="#50e6ff" /><polygon points="8.93 0.81 8.93 14.26 16.4 9.54 8.93 0.81" fill="url(#ba2610c3-a45a-4e7e-a0c0-285cfd7e005d)" /><polygon points="8.93 7.76 16.4 9.54 8.93 14.26 8.93 7.76" fill="#53b1e0" /><polygon points="8.93 14.26 1.61 9.53 8.93 7.76 8.93 14.26" fill="#9cebff" /><polygon points="8.93 17.19 18 11.35 16.99 10.17 8.93 15.33 8.93 17.19" fill="url(#bd8f618b-4f2f-4cb7-aff0-2fd2d211326d)" /></svg>', uL = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><defs><linearGradient id="fdd5d44a-d038-42da-afe7-cecaad9f8ff9" x1="6.49" y1="17.38" x2="6.49" y2="0.44" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#949494" /><stop offset="0.53" stop-color="#a2a2a2" /><stop offset="1" stop-color="#b3b3b3" /></linearGradient><linearGradient id="bf4a560d-147b-4f76-9d70-f90bc5f8ddd6" x1="10.06" y1="13.89" x2="16.48" y2="13.89" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#005ba1" /><stop offset="0.07" stop-color="#0060a9" /><stop offset="0.36" stop-color="#0071c8" /><stop offset="0.52" stop-color="#0078d4" /><stop offset="0.64" stop-color="#0074cd" /><stop offset="0.82" stop-color="#006abb" /><stop offset="1" stop-color="#005ba1" /></linearGradient></defs><g id="a55981fb-ccb2-4f5b-acf6-743ff717cb3a"><g><path d="M11,9.57a6.72,6.72,0,0,0-2.23.32,6.64,6.64,0,0,0,2.23.33,6.56,6.56,0,0,0,2.23-.33A6.63,6.63,0,0,0,11,9.57Z" fill="#198ab3" /><g><path d="M11.47,16.81a.57.57,0,0,1-.58.57H2.09a.56.56,0,0,1-.57-.57V1A.57.57,0,0,1,2.09.44h8.8a.58.58,0,0,1,.58.57Z" fill="url(#fdd5d44a-d038-42da-afe7-cecaad9f8ff9)" /><path d="M3,6.38A1.08,1.08,0,0,1,4.06,5.3H9a1.08,1.08,0,0,1,1.08,1.08h0A1.08,1.08,0,0,1,9,7.47H4.06A1.08,1.08,0,0,1,3,6.38Z" fill="#003067" /><path d="M3,3.17A1.08,1.08,0,0,1,4.06,2.09H9a1.08,1.08,0,0,1,1.08,1.08h0A1.08,1.08,0,0,1,9,4.25H4.06A1.08,1.08,0,0,1,3,3.17Z" fill="#003067" /><circle cx="4.11" cy="3.17" r="0.73" fill="#50e6ff" /><circle cx="4.11" cy="6.38" r="0.73" fill="#50e6ff" /></g><path d="M13.27,11.38c-1.77,0-3.21-.53-3.21-1.17V16.4c0,.63,1.42,1.15,3.17,1.16h0c1.78,0,3.21-.52,3.21-1.16V10.21C16.48,10.85,15.05,11.38,13.27,11.38Z" fill="url(#bf4a560d-147b-4f76-9d70-f90bc5f8ddd6)" /><path d="M16.48,10.21c0,.64-1.43,1.17-3.21,1.17s-3.21-.53-3.21-1.17,1.44-1.16,3.21-1.16,3.21.52,3.21,1.16" fill="#e6e6e6" /><path d="M15.73,10.12c0,.41-1.1.74-2.46.74s-2.46-.33-2.46-.74,1.1-.74,2.46-.74,2.46.33,2.46.74" fill="#50e6ff" /><path d="M13.68,8.66l2.13-2.13a.11.11,0,0,0-.08-.19H14.49c0-2.57-1.37-5.13-3.84-5.13a6.68,6.68,0,0,1,2,5.13H11.47a.11.11,0,0,0-.08.19l2.13,2.13A.12.12,0,0,0,13.68,8.66Z" fill="#50e6ff" /></g></g></svg>', hL = '<svg id="b300f0d1-2ad8-4418-a1c5-23d0b9d21841" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><defs><linearGradient id="b8cad6fd-ec7f-45e9-be2a-125e8b87bd03" x1="10.79" y1="2.17" x2="10.79" y2="16.56" gradientUnits="userSpaceOnUse"><stop offset="0.18" stop-color="#5ea0ef" /><stop offset="1" stop-color="#0078d4" /></linearGradient></defs><title>Icon-web-43</title><rect x="3.7" y="5.49" width="1.18" height="5.26" rx="0.52" transform="translate(-3.83 12.41) rotate(-90)" fill="#b3b3b3" /><rect x="2.04" y="7.88" width="1.18" height="5.26" rx="0.52" transform="translate(-7.88 13.14) rotate(-90)" fill="#a3a3a3" /><rect x="3.7" y="10.26" width="1.18" height="5.26" rx="0.52" transform="translate(-8.6 17.19) rotate(-90)" fill="#7a7a7a" /><path d="M18,11a3.28,3.28,0,0,0-2.81-3.18,4.13,4.13,0,0,0-4.21-4,4.23,4.23,0,0,0-4,2.8,3.89,3.89,0,0,0-3.38,3.8,4,4,0,0,0,4.06,3.86l.36,0h6.58l.17,0A3.32,3.32,0,0,0,18,11Z" fill="url(#b8cad6fd-ec7f-45e9-be2a-125e8b87bd03)" /></svg>', fL = '<svg id="f9ed9690-6753-43a7-8b32-d66ac7b8a99a" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><defs><linearGradient id="f710a364-083f-494c-9d96-89b92ee2d5a8" x1="0.5" y1="9.77" x2="9" y2="9.77" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#005ba1" /><stop offset="0.07" stop-color="#0060a9" /><stop offset="0.36" stop-color="#0071c8" /><stop offset="0.52" stop-color="#0078d4" /><stop offset="0.64" stop-color="#0074cd" /><stop offset="0.81" stop-color="#006abb" /><stop offset="0.99" stop-color="#005ba1" /></linearGradient></defs><title>Icon-databases-126</title><g><path d="M13.25,10.48V6.57a.14.14,0,0,0-.24-.1l-4,4L4.85,14.63V17.5H16.93a.56.56,0,0,0,.57-.57V6.57a.14.14,0,0,0-.24-.1Z" fill="#005ba1" /><path d="M4.75,3.58C2.4,3.58.5,2.89.5,2V7.67h0v9.26a.56.56,0,0,0,.57.57H9V2C9,2.89,7.1,3.58,4.75,3.58Z" fill="url(#f710a364-083f-494c-9d96-89b92ee2d5a8)" /><rect x="12.91" y="12.97" width="2.27" height="2.27" rx="0.28" fill="#fff" /><rect x="8.97" y="12.97" width="2.27" height="2.27" rx="0.28" fill="#fff" /><rect x="5.03" y="12.97" width="2.27" height="2.27" rx="0.28" fill="#fff" /><path d="M9,2c0,.85-1.9,1.54-4.25,1.54S.5,2.89.5,2,2.4.5,4.75.5,9,1.19,9,2" fill="#eaeaea" /><path d="M8,1.91c0,.55-1.46,1-3.26,1s-3.26-.43-3.26-1S3,.94,4.75.94,8,1.37,8,1.91" fill="#50e6ff" /><path d="M4.75,2.14a8.07,8.07,0,0,0-2.58.37,7.64,7.64,0,0,0,2.58.38,7.64,7.64,0,0,0,2.58-.38A8.07,8.07,0,0,0,4.75,2.14Z" fill="#198ab3" /></g></svg>', dL = '<svg id="f4337506-5d95-4e80-b7ca-68498c6e008e" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><defs><linearGradient id="ba420277-700e-42cc-9de9-5388a5c16e54" x1="9" y1="16.97" x2="9" y2="1.03" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0078d4" /><stop offset="0.16" stop-color="#1380da" /><stop offset="0.53" stop-color="#3c91e5" /><stop offset="0.82" stop-color="#559cec" /><stop offset="1" stop-color="#5ea0ef" /></linearGradient></defs><title>Icon-devops-261</title><path id="a91f0ca4-8fb7-4019-9c09-0a52e2c05754" d="M17,4v9.74l-4,3.28-6.2-2.26V17L3.29,12.41l10.23.8V4.44Zm-3.41.49L7.85,1V3.29L2.58,4.84,1,6.87v4.61l2.26,1V6.57Z" fill="url(#ba420277-700e-42cc-9de9-5388a5c16e54)" /></svg>', pL = '<svg id="a2c88306-fa03-4e5b-b192-401f0b77808b" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><defs><linearGradient id="b403aca7-f387-4434-96b4-ae157edc835f" x1="-175.993" y1="-343.723" x2="-175.993" y2="-359.232" gradientTransform="translate(212.573 370.548) scale(1.156 1.029)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fea11b" /><stop offset="0.284" stop-color="#fea51a" /><stop offset="0.547" stop-color="#feb018" /><stop offset="0.8" stop-color="#ffc314" /><stop offset="1" stop-color="#ffd70f" /></linearGradient></defs><title>Icon-compute-29</title><g><path d="M2.37,7.475H3.2a.267.267,0,0,1,.267.267v6.148a.533.533,0,0,1-.533.533H2.1a0,0,0,0,1,0,0V7.741a.267.267,0,0,1,.267-.267Z" transform="translate(12.507 16.705) rotate(134.919)" fill="#50e6ff" /><path d="M2.325,3.6h.833a.267.267,0,0,1,.267.267v6.583a0,0,0,0,1,0,0H2.591a.533.533,0,0,1-.533-.533V3.865A.267.267,0,0,1,2.325,3.6Z" transform="translate(5.759 0.114) rotate(44.919)" fill="#1490df" /></g><g><path d="M14.53,7.475h.833a.533.533,0,0,1,.533.533v6.148a.267.267,0,0,1-.267.267H14.8a.267.267,0,0,1-.267-.267V7.475a0,0,0,0,1,0,0Z" transform="translate(12.223 -7.555) rotate(45.081)" fill="#50e6ff" /><path d="M15.108,3.6h.833a0,0,0,0,1,0,0v6.583a.267.267,0,0,1-.267.267h-.833a.267.267,0,0,1-.267-.267V4.131a.533.533,0,0,1,.533-.533Z" transform="translate(31.022 1.222) rotate(135.081)" fill="#1490df" /></g><path d="M8.459,9.9H4.87a.193.193,0,0,1-.2-.181.166.166,0,0,1,.018-.075L8.991,1.13a.206.206,0,0,1,.186-.106h4.245a.193.193,0,0,1,.2.181.165.165,0,0,1-.035.1L8.534,7.966h4.928a.193.193,0,0,1,.2.181.176.176,0,0,1-.052.122L5.421,16.788c-.077.046-.624.5-.356-.189h0Z" fill="url(#b403aca7-f387-4434-96b4-ae157edc835f)" /></svg>', gL = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><defs><linearGradient id="f67d1585-6164-4ad0-b2dd-f9cc59b2969f" x1="9.908" y1="15.943" x2="7.516" y2="2.383" gradientUnits="userSpaceOnUse"><stop offset="0.15" stop-color="#0078d4" /><stop offset="0.8" stop-color="#5ea0ef" /><stop offset="1" stop-color="#83b9f9" /></linearGradient></defs><g id="a4fd1868-54fe-4ca6-8ff6-3b01866dc27b"><path d="M14.49,7.15A5.147,5.147,0,0,0,9.24,2.164,5.272,5.272,0,0,0,4.216,5.653,4.869,4.869,0,0,0,0,10.4a4.946,4.946,0,0,0,5.068,4.814H13.82A4.292,4.292,0,0,0,18,11.127,4.105,4.105,0,0,0,14.49,7.15Z" fill="url(#f67d1585-6164-4ad0-b2dd-f9cc59b2969f)" /><path d="M12.9,11.4V8H12v4.13h2.46V11.4ZM5.76,9.73a1.825,1.825,0,0,1-.51-.31.441.441,0,0,1-.12-.32.342.342,0,0,1,.15-.3.683.683,0,0,1,.42-.12,1.62,1.62,0,0,1,1,.29V8.11a2.58,2.58,0,0,0-1-.16,1.641,1.641,0,0,0-1.09.34,1.08,1.08,0,0,0-.42.89c0,.51.32.91,1,1.21a2.907,2.907,0,0,1,.62.36.419.419,0,0,1,.15.32.381.381,0,0,1-.16.31.806.806,0,0,1-.45.11,1.66,1.66,0,0,1-1.09-.42V12a2.173,2.173,0,0,0,1.07.24,1.877,1.877,0,0,0,1.18-.33A1.08,1.08,0,0,0,6.84,11a1.048,1.048,0,0,0-.25-.7A2.425,2.425,0,0,0,5.76,9.73ZM11,11.32A2.191,2.191,0,0,0,11,9a1.808,1.808,0,0,0-.7-.75,2,2,0,0,0-1-.26,2.112,2.112,0,0,0-1.08.27A1.856,1.856,0,0,0,7.49,9a2.465,2.465,0,0,0-.26,1.14,2.256,2.256,0,0,0,.24,1,1.766,1.766,0,0,0,.69.74,2.056,2.056,0,0,0,1,.3l.86,1h1.21L10,12.08A1.79,1.79,0,0,0,11,11.32Zm-1-.25a.941.941,0,0,1-.76.35.916.916,0,0,1-.76-.36,1.523,1.523,0,0,1-.29-1,1.529,1.529,0,0,1,.29-1,1,1,0,0,1,.78-.37.869.869,0,0,1,.75.37,1.619,1.619,0,0,1,.27,1A1.459,1.459,0,0,1,10,11.07Z" fill="#f2f2f2" /></g>​
</svg>`, xL = '<svg id="b089cfca-0de1-451c-a1ca-6680ea50cb4f" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><defs><radialGradient id="b25d0836-964a-4c84-8c20-855f66e8345e" cx="-105.006" cy="-10.409" r="5.954" gradientTransform="translate(117.739 19.644) scale(1.036 1.027)" gradientUnits="userSpaceOnUse"><stop offset="0.183" stop-color="#5ea0ef" /><stop offset="1" stop-color="#0078d4" /></radialGradient><clipPath id="b36c7f5d-2ef1-4760-8a25-eeb9661f4e47"><path d="M14.969,7.53A6.137,6.137,0,1,1,7.574,2.987,6.137,6.137,0,0,1,14.969,7.53Z" fill="none" /></clipPath></defs><title>Icon-databases-121</title><path d="M2.954,5.266a.175.175,0,0,1-.176-.176h0A2.012,2.012,0,0,0,.769,3.081a.176.176,0,0,1-.176-.175h0a.176.176,0,0,1,.176-.176A2.012,2.012,0,0,0,2.778.72.175.175,0,0,1,2.954.544h0A.175.175,0,0,1,3.13.72h0A2.012,2.012,0,0,0,5.139,2.729a.175.175,0,0,1,.176.176h0a.175.175,0,0,1-.176.176h0A2.011,2.011,0,0,0,3.13,5.09.177.177,0,0,1,2.954,5.266Z" fill="#50e6ff" /><path d="M15.611,17.456a.141.141,0,0,1-.141-.141h0a1.609,1.609,0,0,0-1.607-1.607.141.141,0,0,1-.141-.14h0a.141.141,0,0,1,.141-.141h0a1.608,1.608,0,0,0,1.607-1.607.141.141,0,0,1,.141-.141h0a.141.141,0,0,1,.141.141h0a1.608,1.608,0,0,0,1.607,1.607.141.141,0,1,1,0,.282h0a1.609,1.609,0,0,0-1.607,1.607A.141.141,0,0,1,15.611,17.456Z" fill="#50e6ff" /><g><path d="M14.969,7.53A6.137,6.137,0,1,1,7.574,2.987,6.137,6.137,0,0,1,14.969,7.53Z" fill="url(#b25d0836-964a-4c84-8c20-855f66e8345e)" /><g clip-path="url(#b36c7f5d-2ef1-4760-8a25-eeb9661f4e47)"><path d="M5.709,13.115A1.638,1.638,0,1,0,5.714,9.84,1.307,1.307,0,0,0,5.721,9.7,1.651,1.651,0,0,0,4.06,8.064H2.832a6.251,6.251,0,0,0,1.595,5.051Z" fill="#f2f2f2" /><path d="M15.045,7.815c0-.015,0-.03-.007-.044a5.978,5.978,0,0,0-1.406-2.88,1.825,1.825,0,0,0-.289-.09,1.806,1.806,0,0,0-2.3,1.663,2,2,0,0,0-.2-.013,1.737,1.737,0,0,0-.581,3.374,1.451,1.451,0,0,0,.541.1h2.03A13.453,13.453,0,0,0,15.045,7.815Z" fill="#f2f2f2" /></g></g><path d="M17.191,3.832c-.629-1.047-2.1-1.455-4.155-1.149a14.606,14.606,0,0,0-2.082.452,6.456,6.456,0,0,1,1.528.767c.241-.053.483-.116.715-.151A7.49,7.49,0,0,1,14.3,3.662a2.188,2.188,0,0,1,1.959.725h0c.383.638.06,1.729-.886,3a16.723,16.723,0,0,1-4.749,4.051A16.758,16.758,0,0,1,4.8,13.7c-1.564.234-2.682,0-3.065-.636s-.06-1.73.886-2.995c.117-.157.146-.234.279-.392a6.252,6.252,0,0,1,.026-1.63A11.552,11.552,0,0,0,1.756,9.419C.517,11.076.181,12.566.809,13.613a3.165,3.165,0,0,0,2.9,1.249,8.434,8.434,0,0,0,1.251-.1,17.855,17.855,0,0,0,6.219-2.4,17.808,17.808,0,0,0,5.061-4.332C17.483,6.369,17.819,4.88,17.191,3.832Z" fill="#50e6ff" /></svg>', mL = '<svg id="b5b638e5-1de7-4378-8f50-7c3738e5874c" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><defs><linearGradient id="e20ae4ca-8128-4625-bcc6-863bc1bc51d9" x1="5.05" y1="10.55" x2="5.05" y2="13.48" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#76bc2d" /><stop offset="1" stop-color="#5e9624" /></linearGradient><linearGradient id="b6fa89de-29eb-462e-97de-5bdbdaeb090e" x1="12.84" y1="10.57" x2="12.84" y2="13.5" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#76bc2d" /><stop offset="1" stop-color="#5e9624" /></linearGradient></defs><title>Icon-integration-204</title><g><path d="M3.19,15.6a2.49,2.49,0,0,1-1.53-.38,1.7,1.7,0,0,1-.45-1.36V10.33c0-.58-.23-.89-.71-.89V8.56c.48,0,.71-.31.71-.92V4.17a1.79,1.79,0,0,1,.45-1.39A2.29,2.29,0,0,1,3.19,2.4v.89c-.51,0-.79.27-.79.85v3.4c0,.78-.23,1.26-.74,1.46a1.42,1.42,0,0,1,.74,1.46v3.37a1.25,1.25,0,0,0,.17.68.74.74,0,0,0,.58.2l0,.89Z" fill="#949494" /><path d="M14.81,2.4a2.49,2.49,0,0,1,1.53.38,1.7,1.7,0,0,1,.45,1.36V7.67c0,.58.23.89.71.89v.88c-.48,0-.71.31-.71.92v3.43a1.8,1.8,0,0,1-.45,1.4,2.28,2.28,0,0,1-1.53.41v-.89c.51,0,.79-.27.79-.85v-3.4c0-.78.23-1.26.74-1.46a1.42,1.42,0,0,1-.74-1.46V4.17a1.25,1.25,0,0,0-.17-.68.74.74,0,0,0-.58-.2Z" fill="#949494" /><path d="M9.41,8.35V7.08h-.9V8.35a.18.18,0,0,1-.18.18H5a.36.36,0,0,0-.36.36v1.65h.9V9.63a.18.18,0,0,1,.17-.18h6.54a.18.18,0,0,1,.18.18v.93h.89V8.89a.36.36,0,0,0-.35-.36H9.59A.18.18,0,0,1,9.41,8.35Z" fill="#005ba1" /><path d="M10.61,3.21H7.25a.38.38,0,0,0-.38.37V6.94a.37.37,0,0,0,.38.37h3.36A.37.37,0,0,0,11,6.94V3.58A.38.38,0,0,0,10.61,3.21Zm-.32,3.17a.25.25,0,0,1-.25.24H7.81a.25.25,0,0,1-.25-.24V4.15a.25.25,0,0,1,.25-.25H10a.25.25,0,0,1,.25.25Z" fill="#0078d4" /><rect x="3.58" y="10.55" width="2.94" height="2.94" rx="0.27" fill="url(#e20ae4ca-8128-4625-bcc6-863bc1bc51d9)" /><rect x="11.38" y="10.57" width="2.94" height="2.94" rx="0.27" fill="url(#b6fa89de-29eb-462e-97de-5bdbdaeb090e)" /></g></svg>', _L = '<svg id="fd454f1c-5506-44b8-874e-8814b8b2f70b" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><defs><linearGradient id="f34d9569-2bd0-4002-8f16-3d01d8106cb5" x1="8.88" y1="12.21" x2="8.88" y2="0.21" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0078d4" /><stop offset="0.82" stop-color="#5ea0ef" /></linearGradient><linearGradient id="bdb45a0b-eb58-4970-a60a-fb2ce314f866" x1="8.88" y1="16.84" x2="8.88" y2="12.21" gradientUnits="userSpaceOnUse"><stop offset="0.15" stop-color="#ccc" /><stop offset="1" stop-color="#707070" /></linearGradient></defs><title>Icon-compute-21</title><rect x="-0.12" y="0.21" width="18" height="12" rx="0.6" fill="url(#f34d9569-2bd0-4002-8f16-3d01d8106cb5)" /><polygon points="11.88 4.46 11.88 7.95 8.88 9.71 8.88 6.21 11.88 4.46" fill="#50e6ff" /><polygon points="11.88 4.46 8.88 6.22 5.88 4.46 8.88 2.71 11.88 4.46" fill="#c3f1ff" /><polygon points="8.88 6.22 8.88 9.71 5.88 7.95 5.88 4.46 8.88 6.22" fill="#9cebff" /><polygon points="5.88 7.95 8.88 6.21 8.88 9.71 5.88 7.95" fill="#c3f1ff" /><polygon points="11.88 7.95 8.88 6.21 8.88 9.71 11.88 7.95" fill="#9cebff" /><path d="M12.49,15.84c-1.78-.28-1.85-1.56-1.85-3.63H7.11c0,2.07-.06,3.35-1.84,3.63a1,1,0,0,0-.89,1h9A1,1,0,0,0,12.49,15.84Z" fill="url(#bdb45a0b-eb58-4970-a60a-fb2ce314f866)" /></svg>', LL = '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24"><defs><style>.cls-1{fill:#669df6;}.cls-1,.cls-2,.cls-3{fill-rule:evenodd;}.cls-2{fill:#aecbfa;}.cls-3{fill:#4285f4;}</style></defs><title>Icon_24px_BigTable_Color</title><g data-name="Product Icons"><g ><path class="cls-1" d="M16.22,6.45,12,3.94a2.86,2.86,0,0,1-1.25-1.71s.16-.32.38-.2,3.5,2.06,5.25,3.1c.63.37.24,2,.24,2A.77.77,0,0,0,16.22,6.45Z"/><path class="cls-2" d="M17.49,12.69a.35.35,0,0,1-.16.33l-1,.68V5.75c0-.27.17-.56-.06-.7l.92.68a.73.73,0,0,1,.35.65Z"/><path class="cls-1" d="M12,13.6a.36.36,0,0,1-.2-.06L8.34,11.48v.9L12,14.56l.29-.57s-.22-.39-.29-.39Z"/><path class="cls-1" d="M12.2,15.4a.36.36,0,0,1-.4,0L8.34,13.34V14a.42.42,0,0,0,.19.35l3.28,2a.37.37,0,0,0,.38,0,2,2,0,0,0,.2-.52l-.19-.39Z"/><path class="cls-2" d="M12,12.73l3.66-2.18v-.43a.39.39,0,0,0-.19-.34l-3.28-2a.37.37,0,0,0-.38,0l-3.28,2a.41.41,0,0,0-.19.34v.43L12,12.73Z"/><path class="cls-1" d="M12,11.83,8.53,9.78a.41.41,0,0,0-.19.34v.43L12,12.73l.28-.56L12,11.83Z"/><path class="cls-3" d="M12,13.6v1l3.66-2.18v-.9L12.2,13.54a.65.65,0,0,1-.2.06Z"/><path class="cls-3" d="M12.2,15.4a.36.36,0,0,1-.2.06c0,.28,0,.9,0,.9a.5.5,0,0,0,.21-.05l3.28-2a.39.39,0,0,0,.19-.35v-.66L12.2,15.4Z"/><path class="cls-3" d="M15.47,9.78,12,11.83v.9l3.66-2.18v-.43a.39.39,0,0,0-.19-.34Z"/><path class="cls-1" d="M7.78,17.53,11.93,20a2.72,2.72,0,0,1,1.28,1.8.18.18,0,0,1-.28.18L7.48,18.75c-.53-.32-.07-1.88-.07-1.88A.77.77,0,0,0,7.78,17.53Z"/><path class="cls-2" d="M6.51,17.73V11.17a.41.41,0,0,1,.19-.33l1-.59v7.91c0,.27,0,.69.21.83l-1.06-.66A.75.75,0,0,1,6.51,17.73Z"/><path class="cls-1" d="M10.16,5.46a.75.75,0,0,0-.74,0L5.22,8a2.63,2.63,0,0,1-2.08.26.23.23,0,0,1,0-.4c.18-.09,6.32-3.74,6.32-3.74.23-.14.74,1.39.74,1.39Z"/><path class="cls-2" d="M10.15,4.08l5.32,3.15a.37.37,0,0,1,.2.31V8.72L9,4.76a.75.75,0,0,0-.74,0l1.18-.69a.71.71,0,0,1,.73,0Z"/><path class="cls-1" d="M13.82,18.49a.73.73,0,0,0,.74,0L18.76,16a2.63,2.63,0,0,1,2.1-.25.21.21,0,0,1,0,.38l-6.33,3.75c-.22.14-.74-1.4-.74-1.4Z"/><path class="cls-2" d="M8.51,16.75a.56.56,0,0,1-.17-.33V15.26L15,19.19a.69.69,0,0,0,.73,0l-1.18.7a.7.7,0,0,1-.74,0Z"/><path class="cls-1" d="M6.26,9.81a.76.76,0,0,0-.37.65v5a2.75,2.75,0,0,1-.87,2,.18.18,0,0,1-.3-.13V9.77c0-.28,1.54,0,1.54,0Z"/><path class="cls-2" d="M9.77,6.52a.34.34,0,0,1,.36,0l1,.59L5.05,10.67a.77.77,0,0,0-.37.66V9.94a.72.72,0,0,1,.38-.64Z"/><path class="cls-1" d="M18.17,13.44v-5a2.81,2.81,0,0,1,.84-2s.33-.11.31.21,0,7.37,0,7.37c-.31.37-1.61,0-1.61,0A.81.81,0,0,0,18.17,13.44Z"/><path class="cls-2" d="M19,14.61l-4.74,2.85a.35.35,0,0,1-.37,0l-1-.57L19,13.22a.77.77,0,0,0,.37-.66V14C19.35,14.23,19,14.61,19,14.61Z"/></g></g></svg>', vL = '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24"><defs><style>.cls-1{fill:#aecbfa;}.cls-1,.cls-2,.cls-3{fill-rule:evenodd;}.cls-2{fill:#669df6;}.cls-3{fill:#4285f4;}</style></defs><title>Icon_24px_BigQuery_Color</title><g data-name="Product Icons"><g ><path class="cls-1" d="M6.73,10.83v2.63A4.91,4.91,0,0,0,8.44,15.2V10.83Z"/><path class="cls-2" d="M9.89,8.41v7.53A7.62,7.62,0,0,0,11,16,8,8,0,0,0,12,16V8.41Z"/><path class="cls-1" d="M13.64,11.86v3.29a5,5,0,0,0,1.7-1.82V11.86Z"/><path class="cls-3" d="M17.74,16.32l-1.42,1.42a.42.42,0,0,0,0,.6l3.54,3.54a.42.42,0,0,0,.59,0l1.43-1.43a.42.42,0,0,0,0-.59l-3.54-3.54a.42.42,0,0,0-.6,0"/><path class="cls-2" d="M11,2a9,9,0,1,0,9,9,9,9,0,0,0-9-9m0,15.69A6.68,6.68,0,1,1,17.69,11,6.68,6.68,0,0,1,11,17.69"/></g></g></svg>', yL = '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24"><defs><style>.cls-1{fill:none;}.cls-2{fill:#669df6;}.cls-2,.cls-3,.cls-4{fill-rule:evenodd;}.cls-3{fill:#aecbfa;}.cls-4{fill:#4285f4;}</style></defs><title>Icon_24px_CDN_Color</title><g data-name="Product Icons"><rect class="cls-1" x="2" y="2" width="20" height="20"/><g ><polygon id="Fill-1" class="cls-2" points="12 2 12 4.41 15.13 7.63 15.13 5.21 12 2"/><polygon id="Fill-1-Copy-2" class="cls-2" points="19.5 12 16.38 15.13 18.88 15.13 22 12 19.5 12"/><polygon id="Fill-1-Copy-3" class="cls-2" points="4.5 12 7.63 15.13 5.13 15.13 2 12 4.5 12"/><polygon id="Fill-1-Copy" class="cls-2" points="12 22 12 19.59 15.13 16.38 15.13 18.79 12 22"/><polygon id="Fill-2" class="cls-3" points="12 2 8.88 5.21 8.88 7.63 12 4.41 12 2"/><polygon id="Fill-2-Copy-2" class="cls-3" points="18.88 8.88 16.38 8.88 19.5 12 22 12 18.88 8.88"/><polygon id="Fill-2-Copy-3" class="cls-3" points="5.13 8.88 7.63 8.88 4.5 12 2 12 5.13 8.88"/><polygon id="Fill-2-Copy" class="cls-3" points="12 22 8.88 18.79 8.88 16.38 12 19.59 12 22"/><polygon id="Fill-9" class="cls-3" points="15.13 15.13 8.88 15.13 8.88 8.88 15.13 8.88 15.13 15.13"/><polygon id="Fill-10" class="cls-2" points="15.13 8.88 15.13 15.13 8.88 15.13 15.13 8.88"/><polygon class="cls-4" points="15.13 8.88 15.13 15.13 12 12 15.13 8.88"/></g></g></svg>', CL = '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24"><defs><style>.cls-1{fill:#4285f4;}.cls-2{fill:#669df6;}.cls-3{fill:#aecbfa;}.cls-4{fill:#fff;}</style></defs><title>Icon_24px_DNS_Color</title><g data-name="Product Icons"><g data-name="colored-32/dns"><g ><polygon id="Fill-1" class="cls-1" points="13 18 11 18 11 8 13 8 13 18"/><polygon id="Fill-2" class="cls-2" points="2 21 22 21 22 19 2 19 2 21"/><polygon id="Fill-3" class="cls-3" points="10 22 14 22 14 18 10 18 10 22"/></g></g><rect class="cls-3" x="2" y="2" width="20" height="6"/><rect class="cls-2" x="12" y="2" width="10" height="6"/><rect class="cls-4" x="4" y="4" width="2" height="2"/><rect class="cls-3" x="2" y="10" width="20" height="6"/><rect class="cls-2" x="12" y="10" width="10" height="6"/><rect class="cls-4" x="4" y="12" width="2" height="2"/></g></svg>', EL = '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24"><defs><style>.cls-1{fill:#4285f4;}.cls-1,.cls-2,.cls-3{fill-rule:evenodd;}.cls-2{fill:#aecbfa;}.cls-3{fill:#669df6;}</style></defs><title>Icon_24px_Interconnect_Color</title><g data-name="Product Icons"><g ><polygon id="Fill-3" class="cls-1" points="2 13 6 13 6 11 2 11 2 13"/><polygon id="Fill-6" class="cls-2" points="15 17 5 17 5 7 15 7 15 17"/><polygon id="Fill-1" class="cls-1" points="17.33 13 22 13 22 11 17.33 11 17.33 13"/><polygon class="cls-3" points="8 3 8 5 17 5 17 19 8 19 8 21 19 21 19 19 19 5 19 3 8 3"/><polygon id="Fill-7" class="cls-3" points="15 17 10 17 10 7 15 7 15 17"/></g></g></svg>', bL = '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24"><defs><style>.cls-1{fill:none;}.cls-2{fill:#669df6;}.cls-3{fill:#4285f4;}.cls-4{fill:#aecbfa;}</style></defs><title>Icon_24px_LoadBalancing_Color</title><g data-name="Product Icons"><g data-name="colored-32/load-balancing"><rect class="cls-1" width="24" height="24"/><g ><rect class="cls-2" x="18" y="12" width="2" height="4"/><rect class="cls-2" x="11" y="12" width="2" height="4"/><rect class="cls-2" x="4" y="12" width="2" height="4"/><polygon id="Fill-2" class="cls-3" points="13 11 11 11 11 7 13 7 13 11"/><rect class="cls-2" x="4" y="11" width="16" height="2"/><rect class="cls-4" x="6" y="2" width="12" height="5"/><rect class="cls-2" x="12" y="2" width="6" height="5"/><rect class="cls-4" x="16" y="16" width="6" height="6"/><rect class="cls-4" x="2" y="16" width="6" height="6"/><rect class="cls-2" x="5" y="16" width="3" height="6"/><rect class="cls-4" x="9" y="16" width="6" height="6"/><rect class="cls-2" x="12" y="16" width="3" height="6"/><rect class="cls-2" x="19" y="16" width="3" height="6"/></g></g></g></svg>', wL = '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24"><defs><style>.cls-1{fill:#aecbfa;}.cls-1,.cls-2,.cls-3{fill-rule:evenodd;}.cls-2{fill:#669df6;}.cls-3{fill:#4285f4;}</style></defs><title>Icon_24px_SQL_Color</title><g data-name="Product Icons"><g ><polygon class="cls-1" points="4.67 10.44 4.67 13.45 12 17.35 12 14.34 4.67 10.44"/><polygon class="cls-1" points="4.67 15.09 4.67 18.1 12 22 12 18.99 4.67 15.09"/><polygon class="cls-2" points="12 17.35 19.33 13.45 19.33 10.44 12 14.34 12 17.35"/><polygon class="cls-2" points="12 22 19.33 18.1 19.33 15.09 12 18.99 12 22"/><polygon class="cls-3" points="19.33 8.91 19.33 5.9 12 2 12 5.01 19.33 8.91"/><polygon class="cls-2" points="12 2 4.67 5.9 4.67 8.91 12 5.01 12 2"/><polygon class="cls-1" points="4.67 5.87 4.67 8.89 12 12.79 12 9.77 4.67 5.87"/><polygon class="cls-2" points="12 12.79 19.33 8.89 19.33 5.87 12 9.77 12 12.79"/></g></g></svg>', TL = '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24"><defs><style>.cls-1{fill:#aecbfa;}.cls-2{fill:#669df6;}.cls-3{fill:#4285f4;}.cls-4{fill:#fff;}</style></defs><title>Icon_24px_CloudStorage_Color</title><g data-name="Product Icons"><rect class="cls-1" x="2" y="4" width="20" height="7"/><rect class="cls-2" x="20" y="4" width="2" height="7"/><polygon class="cls-3" points="22 4 20 4 20 11 22 4"/><rect class="cls-2" x="2" y="4" width="2" height="7"/><rect class="cls-4" x="6" y="7" width="6" height="1"/><rect class="cls-4" x="15" y="6" width="3" height="3" rx="1.5"/><rect class="cls-1" x="2" y="13" width="20" height="7"/><rect class="cls-2" x="20" y="13" width="2" height="7"/><polygon class="cls-3" points="22 13 20 13 20 20 22 13"/><rect class="cls-2" x="2" y="13" width="2" height="7"/><rect class="cls-4" x="6" y="16" width="6" height="1"/><rect class="cls-4" x="15" y="15" width="3" height="3" rx="1.5"/></g></svg>', AL = `<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <path d="M14.7110701,8.84507935 C14.7717439,8.84507935 14.8231931,8.88719721 14.8413458,8.94564457 L14.8483412,8.99213893 L14.8483412,9.80096662 C14.8483412,9.86590813 14.8090267,9.92106136 14.7544697,9.94052499 L14.7110701,9.9480262 L14.1619856,9.9480262 L14.1619856,11.3971513 C14.1619856,11.4393574 14.1689102,11.4810733 14.1822916,11.5204472 L14.2071478,11.5775199 L17.9097614,18.3983638 C18.0128912,18.5897093 18.0276241,18.8190863 17.9539599,19.0212979 L17.9097614,19.1198381 L16.5667009,21.6392628 C16.4635711,21.8306084 16.2854576,21.9589644 16.0851783,21.9917325 L15.983436,22 L8.01656405,22 C7.8103044,22 7.61750853,21.8989791 7.49086453,21.7295356 L7.43329911,21.6392628 L6.09023859,19.1198381 C5.98710877,18.9284926 5.97237594,18.6991157 6.0460401,18.496904 L6.09023859,18.3983638 L9.78310593,11.5775199 C9.80278146,11.5409511 9.8205962,11.5011143 9.83028652,11.4598613 L9.83794574,11.3971513 L9.83794574,9.9480262 L9.28886131,9.9480262 C9.22824239,9.9480262 9.17676023,9.90586128 9.15859212,9.84743274 L9.1515902,9.80096662 L9.1515902,8.99213893 C9.1515902,8.9271386 9.19094857,8.87202066 9.24548803,8.85257351 L9.28886131,8.84507935 L14.7110701,8.84507935 Z M13.1324523,9.9480262 L10.867479,9.9480262 L10.867479,11.6220054 C10.867479,11.7170243 10.8499898,11.810761 10.8163145,11.8979731 L10.7772919,11.9828161 L7.23720733,18.5909383 C7.18910754,18.6801741 7.17948758,18.7860688 7.2083826,18.8820057 L7.23727597,18.9516755 L8.15266835,20.6500666 C8.20076815,20.7393612 8.28154945,20.8012203 8.37354086,20.8223922 L8.44430082,20.8304352 L9.572,20.83 L8.57527805,18.9792271 C8.52717825,18.8899325 8.51755829,18.7840732 8.54641817,18.6881527 L8.57527805,18.6184899 L9.44379234,17.006864 L15.913,17.006 L15.399,16.047 L13.0053393,16.0472267 L12.6160384,15.3248701 L15.012,15.324 L14.292,13.979 L11.8745205,13.9792234 L11.4852196,13.2568668 L13.904,13.256 L13.2227081,11.9828161 C13.1783867,11.9005363 13.1497785,11.8099843 13.1382445,11.7164027 L13.1324523,11.6220054 L13.1324523,9.9480262 Z M16.347,17.815 L13.9560996,17.8156917 L14.3454004,18.5509896 L16.741,18.55 L16.347,17.815 Z M10.630604,5.77278412 C11.0025401,5.77278412 11.3040561,6.09587402 11.3040561,6.49433196 C11.3040561,6.89278989 11.0025401,7.21580626 10.630604,7.21580626 C10.258668,7.21580626 9.95715197,6.89278989 9.95715197,6.49433196 C9.95715197,6.09587402 10.258668,5.77278412 10.630604,5.77278412 Z M13.1716089,4.22465851 C13.7295473,4.22465851 14.1818556,4.7091463 14.1818556,5.30686996 C14.1818556,5.9045201 13.7295473,6.38908141 13.1716089,6.38908141 C12.6136705,6.38908141 12.1614308,5.9045201 12.1614308,5.30686996 C12.1614308,4.7091463 12.6136705,4.22465851 13.1716089,4.22465851 Z M11.6407615,2 C12.0126976,2 12.3142822,2.3230899 12.3142822,2.72154783 C12.3142822,3.12000576 12.0126976,3.44302213 11.6407615,3.44302213 C11.2688941,3.44302213 10.9673095,3.12000576 10.9673095,2.72154783 C10.9673095,2.3230899 11.2688941,2 11.6407615,2 Z" fill="#4285F4"></path>
    </g>
</svg>`, SL = '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24"><defs><style>.cls-1{fill:none;}.cls-2{fill:#aecbfa;}.cls-2,.cls-3,.cls-4{fill-rule:evenodd;}.cls-3{fill:#4285f4;}.cls-4{fill:#669df6;}</style></defs><title>Icon_24px_DataProc_Color</title><g data-name="Product Icons"><rect class="cls-1" x="2" y="2" width="20" height="20"/><g ><polygon class="cls-2" points="17.85 14.2 7.67 20.08 6.69 18.4 16.88 12.51 17.85 14.2"/><polygon class="cls-2" points="7.63 18.16 7.63 6.4 9.5 6.4 9.5 16.75 7.63 18.16"/><polygon class="cls-2" points="9.56 9.69 9.3 7.33 19.49 13.2 18.52 14.88 9.56 9.69"/><path class="cls-3" d="M14.39,10.26,9.3,7.33l.26,2.36,1.51.86a4,4,0,0,0,3.32-.29Z"/><path class="cls-2" d="M8.13,8.29h0a3.78,3.78,0,1,1,3.27,1.89A3.8,3.8,0,0,1,8.13,8.29ZM13,5.49a1.84,1.84,0,0,0-1.59-.92A1.83,1.83,0,0,0,9.57,6.4a1.84,1.84,0,1,0,3.67,0A1.8,1.8,0,0,0,13,5.49Z"/><path class="cls-3" d="M7.63,12.94v5.22L9.5,16.75V15.12a3.29,3.29,0,0,0-1.87-2.18Z"/><path class="cls-3" d="M13.33,16.81l4.52-2.61-2.21-1L14.39,14a4.23,4.23,0,0,0-1.06,2.86Z"/><path class="cls-2" d="M2.51,18.7h0a3.77,3.77,0,0,1,1.38-5.16,3.72,3.72,0,0,1,2.86-.38A3.78,3.78,0,1,1,2.51,18.7Zm4.85-2.81A1.79,1.79,0,0,0,6.25,15a1.83,1.83,0,0,0-2.06,2.69h0a1.83,1.83,0,1,0,3.17-1.84Z"/><path class="cls-2" d="M14.33,18.36h0a3.79,3.79,0,0,1,0-3.77,3.79,3.79,0,0,1,5.16-1.39,3.78,3.78,0,0,1,1.38,5.16,3.78,3.78,0,0,1-6.54,0Zm4.86-2.81a2,2,0,0,0-.67-.67,1.85,1.85,0,0,0-2.51.68,1.86,1.86,0,0,0,0,1.83,1.83,1.83,0,0,0,2.07.85,1.82,1.82,0,0,0,1.11-.85,1.88,1.88,0,0,0,0-1.84Z"/><path class="cls-4" d="M9.49,16.15s-2.34,2-2.8,2.25l2.86-1.65a4.07,4.07,0,0,0-.06-.6Z"/><path class="cls-4" d="M10.15,10S9.56,6.72,9.56,6.4V9.69a3.47,3.47,0,0,0,.59.27Z"/><path class="cls-4" d="M15.3,13.47s2.76,1.15,3.22,1.41l-2.86-1.64a1.69,1.69,0,0,0-.36.23Z"/></g></g></svg>', RL = '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24"><defs><style>.cls-1{fill:#669df6;}.cls-1,.cls-2{fill-rule:evenodd;}.cls-2{fill:#4285f4;}</style></defs><title>Icon_24px_IAM_Color</title><g data-name="Product Icons"><g ><path class="cls-1" d="M12,2,3.79,5.42v5.63c0,5.06,3.5,9.8,8.21,11,4.71-1.15,8.21-5.89,8.21-10.95V5.42Zm0,3.79a2.63,2.63,0,1,1-1.86.77A2.63,2.63,0,0,1,12,5.79Zm4.11,11.15A8.64,8.64,0,0,1,12,19.87a8.64,8.64,0,0,1-4.11-2.93V14.69c0-1.67,2.74-2.52,4.11-2.52s4.11.85,4.11,2.52v2.25Z"/><path class="cls-2" d="M12,2V5.79a2.63,2.63,0,1,1,0,5.26v1.12c1.37,0,4.11.85,4.11,2.52v2.25A8.64,8.64,0,0,1,12,19.87V22c4.71-1.15,8.21-5.89,8.21-10.95V5.42Z"/></g></g></svg>', kL = `<svg version="1.1" baseProfile="tiny" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
	 x="0px" y="0px" width="24px" height="24px" viewBox="0 0 24 24" overflow="visible" xml:space="preserve">
<g >
	<g transform="translate(4.000000, 1.000000)">
		<path fill="#85A4E6" d="M8,0l-9,4v6c0,5.6,3.8,10.7,9,12c5.2-1.3,9-6.4,9-12V4L8,0z M8,11h7c-0.5,4.1-3.3,7.8-7,8.9V11l-7,0V5.3
			l7-3.1V11z"/>
		<path fill="#5C85DE" d="M8,0v22c5.2-1.3,9-6.4,9-12V4L8,0z M15,11c-0.5,4.1-3.3,7.8-7,8.9V11L15,11z"/>
		<path fill-rule="evenodd" fill="#3367D6" d="M17,11h-2c0,0,0,0.3-0.1,0.6L17,11z"/>
		<polygon fill-rule="evenodd" fill="#3367D6" points="-1,11 1,11 1,10.4 		"/>
	</g>
</g>
</svg>
`, OL = '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24"><defs><style>.cls-1{fill:#aecbfa;}.cls-2{fill:#669df6;}.cls-3{fill:#4285f4;}</style></defs><title>Icon_24px_VirtualPrivateCloud_Color</title><g data-name="Product Icons"><rect class="cls-1" x="16" y="2" width="6" height="6"/><rect class="cls-2" x="19" y="2" width="3" height="6"/><rect class="cls-1" x="16" y="16" width="6" height="6"/><rect class="cls-2" x="19" y="16" width="3" height="6"/><rect class="cls-1" x="2" y="2" width="6" height="6"/><rect class="cls-2" x="5" y="2" width="3" height="6"/><rect class="cls-1" x="2" y="16" width="6" height="6"/><rect class="cls-2" x="5" y="16" width="3" height="6"/><rect class="cls-2" x="8" y="4" width="8" height="2"/><rect class="cls-2" x="8" y="18" width="8" height="2"/><rect class="cls-2" x="18" y="8" width="2" height="8"/><rect class="cls-2" x="4" y="8" width="2" height="8"/><rect class="cls-3" x="4" y="8" width="2" height="2"/><rect class="cls-3" x="18" y="8" width="2" height="2"/><rect class="cls-3" x="8" y="4" width="2" height="2"/><rect class="cls-3" x="8" y="18" width="2" height="2"/></g></svg>', NL = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24px" height="24px" viewBox="0 0 24 24"><defs><style>.cls-1{filter:url(#luminosity-noclip);}.cls-2{fill:#669df6;}.cls-3{mask:url(#mask);}.cls-4{fill:#4285f4;}.cls-5{fill:#aecbfa;}</style><filter id="luminosity-noclip" x="4.64" y="4.19" width="14.73" height="12.76" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-color="#fff" result="bg"/><feBlend in="SourceGraphic" in2="bg"/></filter><mask id="mask" x="4.64" y="4.19" width="14.73" height="12.76" maskUnits="userSpaceOnUse"><circle class="cls-1" cx="12" cy="12.23" r="3.58"/></mask></defs><title>Icon_24px_Pub-Sub_Color</title><g data-name="Product Icons"><circle class="cls-2" cx="18.97" cy="8.21" r="1.72"/><circle class="cls-2" cx="5.03" cy="8.21" r="1.72"/><circle class="cls-2" cx="12" cy="20.28" r="1.72"/><g class="cls-3"><rect class="cls-4" x="14.69" y="10.22" width="1.59" height="8.04" transform="matrix(0.5, -0.87, 0.87, 0.5, -4.59, 20.53)"/><rect class="cls-4" x="4.49" y="13.45" width="8.04" height="1.59" transform="translate(-5.98 6.17) rotate(-30)"/><rect class="cls-4" x="11.2" y="4.19" width="1.59" height="8.04"/></g><circle class="cls-5" cx="12" cy="12.23" r="2.78"/><circle class="cls-5" cx="5.03" cy="16.25" r="2.19"/><circle class="cls-5" cx="18.97" cy="16.25" r="2.19"/><circle class="cls-5" cx="12" cy="4.19" r="2.19"/></g></svg>', IL = '<svg id="Artwork" xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24"><circle cx="11.45" cy="11.51" r="2.89" style="fill:#669df6"/><path d="M18.05,6.81a8.12,8.12,0,0,0-4.94-3.23l-.27,1.3A6.79,6.79,0,1,1,6.65,6.74l-1-.94a8.1,8.1,0,1,0,13,2.12A1.31,1.31,0,0,1,18.05,6.81Z" style="fill:#aecbfa"/><path d="M14.46,20.42a2,2,0,1,1,0-3.93" style="fill:#669df6"/><path d="M14.46,16.49a2,2,0,1,1,0,3.93" style="fill:#4285f4"/><path d="M19.38,8.1a1.34,1.34,0,0,1,0-2.67v-1h0a2.38,2.38,0,0,0,0,4.75Z" style="fill:#669df6"/><path d="M19.38,5.43a1.34,1.34,0,0,1,0,2.67v1h0a2.38,2.38,0,0,0,0-4.75Z" style="fill:#4285f4"/><path d="M4.22,12.78a2,2,0,1,1,0-3.93" style="fill:#669df6"/><path d="M4.22,8.85a2,2,0,0,1,0,3.93" style="fill:#4285f4"/></svg>', ML = '<svg id="Artwork" xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24"><polygon points="11.19 11.35 15.75 3.51 6.75 3.51 2.25 11.35 11.19 11.35" style="fill:#aecbfa"/><polygon points="2.25 12.65 6.74 20.49 15.73 20.49 11.25 12.65 2.25 12.65" style="fill:#4285f4"/><path d="M21.75,12l-4.5-7.87L12.74,12l4.51,7.87Z" style="fill:#669df6"/></svg>', PL = '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24"><defs><style>.cls-1{fill:none;}.cls-2{fill:#669df6;}.cls-3{fill:#aecbfa;}.cls-4{fill:#4285f4;}</style></defs><title>Icon_24px_VisionAPI_Color</title><g data-name="Product Icons"><g data-name="colored-32/vision"><rect class="cls-1" width="24" height="24"/><g ><polygon class="cls-2" points="6 12 12 16.99 12 20 2 12 6 12"/><polygon id="Shape-2" data-name="Shape" class="cls-2" points="12 16.99 18 12 22 12 12 20 12 16.99"/><polygon id="Shape-3" data-name="Shape" class="cls-3" points="2 12 12 4 12 7.01 6 12 2 12"/><polygon id="Shape-4" data-name="Shape" class="cls-3" points="12 7.01 18 12 22 12 12 4 12 7.01"/><circle id="Oval" class="cls-4" cx="12" cy="12" r="2"/></g></g></g></svg>', r2 = {
  actor: D_,
  boundary: F_,
  control: B_,
  database: U_,
  entity: H_,
  cloudwatch: G_,
  cloudfront: j_,
  cognito: V_,
  dynamodb: z_,
  ebs: Z_,
  ec2: W_,
  ecs: q_,
  efs: bc,
  elasticache: K_,
  elasticbeantalk: Y_,
  elasticfilesystem: bc,
  glacier: X_,
  iam: Q_,
  kinesis: J_,
  lambda: tL,
  lightsail: eL,
  rds: nL,
  redshift: rL,
  s3: sL,
  sns: iL,
  sqs: oL,
  sagemaker: aL,
  vpc: lL,
  azureactivedirectory: cL,
  azurebackup: uL,
  azurecdn: hL,
  azuredatafactory: fL,
  azuredevops: dL,
  azurefunction: pL,
  azuresql: gL,
  cosmosdb: xL,
  logicapps: mL,
  virtualmachine: _L,
  bigtable: LL,
  bigquery: vL,
  cloudcdn: yL,
  clouddns: CL,
  cloudinterconnect: EL,
  cloudloadbalancing: bL,
  cloudsql: wL,
  cloudstorage: TL,
  datalab: AL,
  dataproc: SL,
  googleiam: RL,
  googlesecurity: kL,
  googlevpc: OL,
  pubsub: NL,
  securityscanner: IL,
  stackdriver: ML,
  visionapi: PL
};
var $L = function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    ref: "participant",
    staticClass: "participant bg-skin-participant border-skin-participant text-skin-participant rounded text-base leading-4 relative flex flex-col justify-center z-10 h-10",
    class: {
      selected: n.selected,
      "border-transparent": !!n.icon
    },
    style: {
      backgroundColor: n.backgroundColor,
      color: n.color
    },
    on: {
      click: n.onSelect
    }
  }, [n.icon ? e("div", {
    staticClass: "absolute left-1/2 transform -translate-x-1/2 -translate-y-full h-8 [&>svg]:w-full [&>svg]:h-full",
    attrs: {
      alt: `icon for ${n.entity.name}`
    },
    domProps: {
      innerHTML: n._s(n.icon)
    }
  }) : n._e(), e("div", {
    staticClass: "h-5 group flex flex-col justify-center"
  }, [n.comment ? e("span", {
    staticClass: "absolute hidden rounded-lg transform -translate-y-8 bg-gray-400 px-2 py-1 text-center text-sm text-white group-hover:flex"
  }, [n._v(" " + n._s(n.comment) + " ")]) : n._e(), n.stereotype ? e("label", {
    staticClass: "interface leading-4"
  }, [n._v("«" + n._s(n.stereotype) + "»")]) : n._e(), e("label", {
    staticClass: "name leading-4"
  }, [n._v(n._s(n.entity.label || n.entity.name))])])]);
}, DL = [];
const FL = {
  name: "Participant",
  props: {
    entity: {
      type: Object,
      required: !0
    }
  },
  data() {
    return {
      color: void 0
    };
  },
  mounted() {
    this.updateFontColor();
  },
  updated() {
    this.updateFontColor();
  },
  computed: {
    selected() {
      return this.$store.state.selected.includes(this.entity.name);
    },
    stereotype() {
      return this.entity.stereotype;
    },
    comment() {
      return this.entity.comment;
    },
    icon() {
      var n;
      return r2[(n = this.entity.type) == null ? void 0 : n.toLowerCase()];
    },
    backgroundColor() {
      try {
        return this.entity.color ? this.entity.color && $_(this.entity.color) : void 0;
      } catch {
        return;
      }
    }
  },
  methods: {
    onSelect() {
      this.$store.commit("onSelect", this.entity.name);
    },
    updateFontColor() {
      if (!this.backgroundColor)
        return;
      let n = window.getComputedStyle(this.$refs.participant).getPropertyValue("background-color");
      if (!n)
        return;
      let t = P_(n);
      this.color = t > 128 ? "#000" : "#fff";
    }
  }
}, wc = {};
var BL = /* @__PURE__ */ et(
  FL,
  $L,
  DL,
  !1,
  UL,
  null,
  null,
  null
);
function UL(n) {
  for (let t in wc)
    this[t] = wc[t];
}
const s2 = /* @__PURE__ */ function() {
  return BL.exports;
}();
var HL = function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    staticClass: "lifeline absolute flex flex-col mx-2 transform -translate-x-1/2 h-full",
    style: {
      paddingTop: n.top + "px",
      left: n.left + "px"
    },
    attrs: {
      id: n.entity.name
    }
  }, [e("participant", {
    attrs: {
      entity: n.entity
    }
  }), e("div", {
    staticClass: "line bg-skin-lifeline w0 mx-auto flex-grow w-px"
  })], 1);
}, GL = [];
const lr = kr.child({ name: "LifeLine" }), jL = {
  name: "life-line",
  components: { Participant: s2 },
  props: ["entity", "context", "groupLeft", "inGroup"],
  data: () => ({
    translateX: 0,
    top: 0
  }),
  computed: {
    ...Ht(["centerOf"]),
    ...Mr(["scale"]),
    left() {
      return this.centerOf(this.entity.name) - 8 - (this.groupLeft || 0);
    }
  },
  mounted() {
    lr.debug(`LifeLine mounted for ${this.entity.name}`), this.$nextTick(() => {
      this.setTop(), lr.debug(`nextTick after updated for ${this.entity.name}`);
    });
  },
  updated() {
    lr.debug(`updated for ${this.entity.name}`), this.$nextTick(() => {
      this.setTop(), lr.debug(`nextTick after updated for ${this.entity.name}`);
    });
  },
  methods: {
    onSelect() {
      this.$store.commit("onSelect", this.entity.name);
    },
    setTop() {
      const n = this.$root.$el.querySelector(`[data-to="${this.entity.name}"]`);
      if (n && n.attributes["data-type"].value === "creation") {
        lr.debug(`First message to ${this.entity.name} is creation`);
        const t = this.$el.getBoundingClientRect().y, e = n.getBoundingClientRect().y;
        this.top = (e - t) / this.scale;
      } else
        this.top = 0;
    }
  }
}, Tc = {};
var VL = /* @__PURE__ */ et(
  jL,
  HL,
  GL,
  !1,
  zL,
  "4bfd9a34",
  null,
  null
);
function zL(n) {
  for (let t in Tc)
    this[t] = Tc[t];
}
const i2 = /* @__PURE__ */ function() {
  return VL.exports;
}();
var ZL = function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return n.entities.length > 0 ? e("div", {
    staticClass: "container absolute flex flex-col h-full",
    style: {
      left: `${n.left}px`,
      width: `${n.right - n.left}px`
    }
  }, [e("div", {
    staticClass: "flex flex-col shadow shadow-slate-500/50 flex-grow"
  }, [e("div", {
    staticClass: "lifeline-group relative flex-grow"
  }, n._l(n.entities, function(r) {
    return e("life-line", {
      key: r.name,
      ref: r.name,
      refInFor: !0,
      attrs: {
        inGroup: "true",
        entity: r,
        "group-left": n.left
      }
    });
  }), 1)])]) : n._e();
}, WL = [];
const qL = {
  name: "lifeline-group",
  props: ["context"],
  computed: {
    ...Ht(["centerOf"]),
    name() {
      var n, t;
      return (t = (n = this.context) == null ? void 0 : n.name()) == null ? void 0 : t.getFormattedText();
    },
    offset() {
      return 0;
    },
    left() {
      const n = this.entities[0].name, t = Math.max(qs(n, Hn.ParticipantName), "100");
      return this.centerOf(n) - t / 2 - 8;
    },
    right() {
      const n = Math.max(
        qs(this.entities.slice(-1).name, Hn.ParticipantName),
        "100"
      ), t = this.entities.slice(0).pop().name;
      return this.centerOf(t) + n / 2 + 20;
    },
    entities() {
      return Ai(this.context).Array();
    }
  },
  components: {
    LifeLine: i2
  }
}, Ac = {};
var KL = /* @__PURE__ */ et(
  qL,
  ZL,
  WL,
  !1,
  YL,
  null,
  null,
  null
);
function YL(n) {
  for (let t in Ac)
    this[t] = Ac[t];
}
const XL = /* @__PURE__ */ function() {
  return KL.exports;
}();
var QL = function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    staticClass: "life-line-layer lifeline-layer absolute h-full flex flex-col pt-8",
    style: {
      "min-width": "200px"
    }
  }, [e("div", {
    staticClass: "container relative grow"
  }, [n.starterOnTheLeft ? e("life-line", {
    staticClass: "starter",
    class: {
      invisible: n.invisibleStarter
    },
    attrs: {
      entity: n.starterParticipant
    }
  }) : n._e(), n._l(n.explicitGroupAndParticipants, function(r, s) {
    return [r instanceof n.GroupContext ? e("life-line-group", {
      key: s,
      attrs: {
        context: r
      }
    }) : n._e(), r instanceof n.ParticipantContext ? e("life-line", {
      key: s,
      attrs: {
        entity: n.getParticipantEntity(r)
      }
    }) : n._e()];
  }), n._l(n.implicitParticipants, function(r) {
    return e("life-line", {
      key: r.name,
      attrs: {
        entity: r
      }
    });
  })], 2)]);
}, JL = [];
const Sc = kr.child({ name: "LifeLineLayer" }), tv = {
  name: "life-line-layer",
  props: ["context"],
  computed: {
    ...Ht(["participants", "GroupContext", "ParticipantContext", "centerOf"]),
    invisibleStarter() {
      return this.starterParticipant.name === "_STARTER_";
    },
    starterParticipant() {
      return this.participants.Starter();
    },
    starterOnTheLeft() {
      return !this.starterParticipant.explicit;
    },
    implicitParticipants() {
      return this.participants.ImplicitArray();
    },
    explicitGroupAndParticipants() {
      var n;
      return (n = this.context) == null ? void 0 : n.children.filter((t) => {
        const e = t instanceof Yh, r = t instanceof Xh;
        return e || r;
      });
    }
  },
  methods: {
    ...Pr(["increaseGeneration"]),
    getParticipantEntity(n) {
      return Ai(n).First();
    }
  },
  updated() {
    Sc.debug("LifeLineLayer updated");
  },
  mounted() {
    Sc.debug("LifeLineLayer mounted");
  },
  components: {
    LifeLine: i2,
    LifeLineGroup: XL
  }
}, Rc = {};
var ev = /* @__PURE__ */ et(
  tv,
  QL,
  JL,
  !1,
  nv,
  null,
  null,
  null
);
function nv(n) {
  for (let t in Rc)
    this[t] = Rc[t];
}
const rv = /* @__PURE__ */ function() {
  return ev.exports;
}();
var sv = function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    staticClass: "message-layer pt-24 pb-10"
  }, [e("block", {
    style: {
      "padding-left": n.paddingLeft + "px"
    },
    attrs: {
      context: n.context
    }
  })], 1);
}, iv = [];
const kc = kr.child({ name: "MessageLayer" }), ov = {
  name: "message-layer",
  props: ["context"],
  data() {
    return {
      left: 0,
      right: 0,
      totalWidth: 0
    };
  },
  computed: {
    ...Ht(["participants", "centerOf"]),
    paddingLeft() {
      if (this.participants.Array().length >= 1) {
        const n = this.participants.Array().slice(0)[0].name;
        return this.centerOf(n);
      }
      return 0;
    }
  },
  methods: {
    ...Pr(["onMessageLayerMountedOrUpdated"]),
    participantNames() {
      return this.participants.Names();
    }
  },
  updated() {
    kc.debug("MessageLayer updated");
  },
  mounted() {
    kc.debug("MessageLayer mounted");
  }
}, Oc = {};
var av = /* @__PURE__ */ et(
  ov,
  sv,
  iv,
  !1,
  lv,
  null,
  null,
  null
);
function lv(n) {
  for (let t in Oc)
    this[t] = Oc[t];
}
const cv = /* @__PURE__ */ function() {
  return av.exports;
}(), Uo = 30, o2 = 100, zr = {
  computed: {
    ...Ht(["coordinates", "distance2"]),
    localParticipants: function() {
      return [
        this.from,
        ...Ai(this.context).ImplicitArray().map((n) => n.name)
      ];
    },
    leftParticipant: function() {
      return this.coordinates.participantModels.map((t) => t.name).find((t) => this.localParticipants.includes(t));
    },
    rightParticipant: function() {
      return this.coordinates.participantModels.map((t) => t.name).reverse().find((t) => this.localParticipants.includes(t));
    },
    depth: function() {
      return Qh(this.context);
    },
    offsetX: function() {
      let n = 10 * (this.depth + 1);
      return this.distance2(this.leftParticipant, this.from) + n + Uo;
    },
    fragmentStyle: function() {
      return {
        transform: "translateX(" + (this.offsetX + 1) * -1 + "px)",
        width: this.distance2(this.leftParticipant, this.rightParticipant) + 20 * this.depth + Uo + o2 + "px"
      };
    }
  }
};
var uv = function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    ref: "diagram",
    staticClass: "zenuml sequence-diagram relative box-border text-left overflow-visible",
    style: {
      width: `${n.width}px`,
      paddingLeft: `${n.paddingLeft}px`
    }
  }, [e("life-line-layer", {
    attrs: {
      context: n.rootContext.head()
    }
  }), e("message-layer", {
    attrs: {
      context: n.rootContext.block()
    }
  })], 1);
}, hv = [];
const fv = {
  name: "seq-diagram",
  components: {
    LifeLineLayer: rv,
    MessageLayer: cv
  },
  computed: {
    ...Ht(["rootContext", "coordinates"]),
    width() {
      return this.coordinates.getWidth() + 10 * (this.depth + 1) + o2;
    },
    depth: function() {
      return Qh(this.rootContext);
    },
    paddingLeft: function() {
      return 10 * (this.depth + 1) + Uo;
    }
  }
}, Nc = {};
var dv = /* @__PURE__ */ et(
  fv,
  uv,
  hv,
  !1,
  pv,
  null,
  null,
  null
);
function pv(n) {
  for (let t in Nc)
    this[t] = Nc[t];
}
const a2 = /* @__PURE__ */ function() {
  return dv.exports;
}();
var gv = function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("ul", {
    staticClass: "mt-3 grid grid-cols-4 gap-5 sm:gap-6 sm:grid-cols-6 lg:grid-cols-8",
    attrs: {
      role: "list"
    }
  }, n._l(n.types, function(r) {
    return e("li", {
      key: r,
      staticClass: "col-span-1 flex flex-col shadow-sm rounded-md"
    }, [e("div", {
      staticClass: "h-12 flex items-center justify-center bg-gray-50 text-white text-sm font-medium rounded-t-md"
    }, [n.icon ? e("i", {
      staticClass: "object-contain h-8 w-8 m-auto [&>svg]:w-full [&>svg]:h-full",
      attrs: {
        alt: `icon for ${r}`
      },
      domProps: {
        innerHTML: n._s(n.icon(r))
      }
    }) : n._e()]), e("div", {
      staticClass: "flex items-center justify-center border-t border-r border-b border-gray-200 bg-white rounded-b-md"
    }, [e("div", {
      staticClass: "px-2 py-2 text-xs"
    }, [e("span", {
      staticClass: "text-gray-900 font-medium hover:text-gray-600"
    }, [n._v("@" + n._s(r))])])])]);
  }), 0);
}, xv = [];
const mv = {
  name: "IconList",
  props: ["types"],
  computed: {},
  methods: {
    icon(n) {
      return r2[n == null ? void 0 : n.toLowerCase()];
    }
  }
}, Ic = {};
var _v = /* @__PURE__ */ et(
  mv,
  gv,
  xv,
  !1,
  Lv,
  null,
  null,
  null
);
function Lv(n) {
  for (let t in Ic)
    this[t] = Ic[t];
}
const vv = /* @__PURE__ */ function() {
  return _v.exports;
}();
var yv = function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    staticClass: "flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block"
  }, [e("div", {
    staticClass: "fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity",
    attrs: {
      "aria-hidden": "true"
    }
  }), e("span", {
    staticClass: "hidden sm:inline-block sm:align-middle sm:h-screen",
    attrs: {
      "aria-hidden": "true"
    }
  }, [n._v("​")]), e("div", {
    staticClass: "z-40 inline-block align-bottom bg-white rounded-lg px-4 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:p-2"
  }, [e("div", [e("div", {
    staticClass: "bg-white px-4 py-5 border-b border-gray-200 sm:px-6",
    attrs: {
      slot: "header"
    },
    slot: "header"
  }, [e("h3", {
    staticClass: "text-xl leading-6 font-medium text-gray-900 inline-block"
  }, [n._v("ZenUML Tips")]), e("button", {
    staticClass: "float-right bg-white rounded-md inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500",
    attrs: {
      type: "button"
    },
    on: {
      click: function(r) {
        return n.closeTipsDialog();
      }
    }
  }, [e("span", {
    staticClass: "sr-only"
  }, [n._v("Close menu")]), e("svg", {
    staticClass: "h-6 w-6",
    attrs: {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      stroke: "currentColor",
      "aria-hidden": "true"
    }
  }, [e("path", {
    attrs: {
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-width": "2",
      d: "M6 18L18 6M6 6l12 12"
    }
  })])])]), e("div", {
    attrs: {
      slot: "body"
    },
    slot: "body"
  }, [e("div", {
    staticClass: "relative bg-white pb-32 mt-4 overflow-hidden"
  }, [e("div", {
    staticClass: "relative"
  }, [e("div", {
    staticClass: "lg:mx-auto lg:max-w-11/12 lg:px-8"
  }, [n._m(0), e("div", {
    staticClass: "px-4 max-w-7xl mx-auto sm:px-6 lg:max-w-none lg:mx-0"
  }, [e("h2", {
    staticClass: "mt-8 mb-4 text-lg leading-6 font-medium text-gray-900"
  }, [n._v(" Builtin Icons ")]), n._m(1), e("IconList", {
    attrs: {
      types: n.standardTypes
    }
  }), e("hr", {
    staticClass: "mt-4"
  }), e("IconList", {
    attrs: {
      types: n.awsServices
    }
  }), e("hr", {
    staticClass: "mt-4"
  }), e("IconList", {
    attrs: {
      types: n.azureServices
    }
  }), e("hr", {
    staticClass: "mt-4"
  }), e("IconList", {
    attrs: {
      types: n.googleServices
    }
  })], 1)])])])])])])]);
}, Cv = [function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    staticClass: "grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1"
  }, [e("div", [e("div", {
    staticClass: "px-4 max-w-full mx-auto sm:px-6 lg:max-w-none lg:mx-0"
  }, [e("h2", {
    staticClass: "mt-4 mb-4 text-lg leading-6 font-medium text-gray-900"
  }, [n._v(" Declare Participants ")]), e("pre", {
    staticClass: "text-xs w-full bg-gray-50 text-gray-600 p-2 rounded-lg"
  }, [e("code", [n._v(`// Define a Starter (optional)
@Starter(A)

// Show icons
@EC2 A

// Use 'group' keyword
group GroupName {  B  C }

// Use stereotype
<<servlet>> ServiceX`)])])]), e("div", {
    staticClass: "px-4 max-w-7xl mx-auto sm:px-6 lg:max-w-none lg:mx-0"
  }, [e("h2", {
    staticClass: "mt-4 mb-4 text-lg leading-6 font-medium text-gray-900"
  }, [n._v("Divider")]), e("pre", {
    staticClass: "text-xs w-full bg-gray-50 text-gray-600 p-2 rounded-lg"
  }, [e("code", [n._v(`A.method()
==divider name==
B.method()
`)])])])]), e("div", {
    staticClass: "px-4 w-full mx-auto lg:max-w-none lg:mx-0"
  }, [e("h2", {
    staticClass: "mt-4 mb-4 text-lg leading-6 font-medium text-gray-900"
  }, [n._v("Fragments")]), e("pre", {
    staticClass: "text-xs w-full bg-gray-50 text-gray-600 p-2 rounded-lg"
  }, [e("code", [n._v(`// Alt (AKA if/else)
if(condition1) {}
else if (condition2) {}
else {}

// \`loop\`, \`for\`, \`forEach\`, \`while\`
// are treated the same
forEach(records) {}

// Opt
opt {}

// Par
par {}

// Try Catch Finally
try {} catch() {} finally {}
`)])])]), e("div", {
    staticClass: "px-4 w-full mx-auto lg:max-w-none lg:mx-0"
  }, [e("h2", {
    staticClass: "mt-4 mb-4 text-lg leading-6 font-medium text-gray-900"
  }, [n._v("Messages")]), e("pre", {
    staticClass: "text-xs w-full bg-gray-50 text-gray-600 p-2 rounded-lg"
  }, [e("code", [n._v(`//Creation
new ParticipantName()

//Sync Message
A.method
A->B.method

//Async Message
A->B: async message

//Reply Message, three styles
x = A.method
A.method() {
  return x
}
A.method() {
  @return A->B: message
}`)])])])]);
}, function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("p", {
    staticClass: "text-sm text-gray-500"
  }, [n._v(" Use "), e("span", {
    staticClass: "rounded inline-block bg-gray-50 text-gray-600"
  }, [e("code", {
    staticClass: "text-xs"
  }, [n._v("@Actor TheParticipant")])]), n._v(" to define the type of the participant. ")]);
}];
const Ev = {
  name: "TipsDialog",
  components: { IconList: vv },
  computed: {
    standardTypes() {
      return ["Actor", "Boundary", "Control", "Database", "Entity"];
    },
    awsServices() {
      return [
        "CloudWatch",
        "CloudFront",
        "Cognito",
        "DynamoDB",
        "EBS",
        "EC2",
        "ECS",
        "EFS",
        "ElastiCache",
        "ElasticBeantalk",
        "ElasticFileSystem",
        "Glacier",
        "IAM",
        "Kinesis",
        "Lambda",
        "LightSail",
        "RDS",
        "Redshift",
        "S3",
        "SNS",
        "SQS",
        "Sagemaker",
        "VPC"
      ];
    },
    azureServices() {
      return [
        "AzureActiveDirectory",
        "AzureBackup",
        "AzureCDN",
        "AzureDataFactory",
        "AzureDevOps",
        "AzureFunction",
        "AzureSQL",
        "CosmosDB",
        "LogicApps",
        "VirtualMachine"
      ];
    },
    googleServices() {
      return [
        "BigTable",
        "BigQuery",
        "CloudCDN",
        "CloudDNS",
        "CloudInterconnect",
        "CloudLoadBalancing",
        "CloudSQL",
        "CloudStorage",
        "DataLab",
        "DataProc",
        "GoogleIAM",
        "GoogleSecurity",
        "GoogleVPC",
        "PubSub",
        "SecurityScanner",
        "StackDriver",
        "VisionAPI"
      ];
    }
  },
  methods: {
    closeTipsDialog() {
      var n;
      this.$store.state.showTips = !1;
      try {
        (n = this.$gtag) == null || n.event("close", {
          event_category: "help",
          event_label: "tips dialog"
        });
      } catch (t) {
        console.error(t);
      }
    }
  }
}, Mc = {};
var bv = /* @__PURE__ */ et(
  Ev,
  yv,
  Cv,
  !1,
  wv,
  null,
  null,
  null
);
function wv(n) {
  for (let t in Mc)
    this[t] = Mc[t];
}
const Tv = /* @__PURE__ */ function() {
  return bv.exports;
}();
var Av = function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    staticClass: "point text-skin-message-arrow",
    class: {
      fill: n.fill,
      "no-fill": !n.fill,
      "right-to-left": n.rtl
    }
  }, [n.rtl ? n._e() : e("svg", {
    staticClass: "arrow stroke-2",
    attrs: {
      height: "10",
      width: "10"
    }
  }, [e("polyline", {
    staticClass: "right head fill-current stroke-current",
    attrs: {
      points: "0,0 10,5 0,10"
    }
  })]), n.rtl ? e("svg", {
    staticClass: "arrow stroke-2",
    attrs: {
      height: "10",
      width: "10"
    }
  }, [e("polyline", {
    staticClass: "left head fill-current stroke-current",
    attrs: {
      points: "10,0 0,5 10,10"
    }
  })]) : n._e()]);
}, Sv = [];
const Rv = {
  name: "point",
  props: ["fill", "rtl"]
}, Pc = {};
var kv = /* @__PURE__ */ et(
  Rv,
  Av,
  Sv,
  !1,
  Ov,
  "340f62e6",
  null,
  null
);
function Ov(n) {
  for (let t in Pc)
    this[t] = Pc[t];
}
const Nv = /* @__PURE__ */ function() {
  return kv.exports;
}();
var Iv = function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    staticClass: "message border-skin-message-arrow border-b-2 flex items-end",
    class: {
      "flex-row-reverse": n.rtl,
      return: n.type === "return",
      "right-to-left": n.rtl,
      "text-left": n.isAsync,
      "text-center": !n.isAsync
    },
    style: {
      "border-bottom-style": n.borderStyle
    }
  }, [e("div", {
    staticClass: "name flex-grow text-sm truncate hover:whitespace-normal hover:text-skin-message-hover hover:bg-skin-message-hover",
    staticStyle: {
      "padding-left": "5px",
      float: "left"
    },
    style: {
      color: n.color
    }
  }, [n._v(" " + n._s(n.content) + " ")]), e("point", {
    staticClass: "flex-shrink-0 transform translate-y-1/2 -my-px",
    attrs: {
      fill: n.fill,
      rtl: n.rtl
    }
  })], 1);
}, Mv = [];
const Pv = {
  name: "message",
  props: ["content", "rtl", "type", "color"],
  computed: {
    isAsync: function() {
      return this.type === "async";
    },
    borderStyle() {
      switch (this.type) {
        case "sync":
        case "async":
          return "solid";
        case "creation":
        case "return":
          return "dashed";
      }
      return "";
    },
    fill() {
      switch (this.type) {
        case "sync":
        case "async":
          return !0;
        case "creation":
        case "return":
          return !1;
      }
      return !1;
    }
  },
  components: {
    Point: Nv
  }
}, $c = {};
var $v = /* @__PURE__ */ et(
  Pv,
  Iv,
  Mv,
  !1,
  Dv,
  null,
  null,
  null
);
function Dv(n) {
  for (let t in $c)
    this[t] = $c[t];
}
const Zr = /* @__PURE__ */ function() {
  return $v.exports;
}();
var Fv = function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    staticClass: "invisible"
  }, [e("message", {
    attrs: {
      content: n.text,
      rtl: "false",
      type: "sync"
    }
  })], 1);
}, Bv = [];
const Uv = {
  name: "WidthProvider",
  components: { Message: Zr },
  data: function() {
    return {
      text: "abcd"
    };
  },
  methods: {
    width: function(n, t) {
      return console.log(n, t), this.text = n, this.$el.clientWidth;
    }
  },
  mounted() {
    this.$store.state.widthProvider = this;
  }
}, Dc = {};
var Hv = /* @__PURE__ */ et(
  Uv,
  Fv,
  Bv,
  !1,
  Gv,
  null,
  null,
  null
);
function Gv(n) {
  for (let t in Dc)
    this[t] = Dc[t];
}
const jv = /* @__PURE__ */ function() {
  return Hv.exports;
}();
function Vv(n, t) {
  if (n.match(/^[a-z]+:\/\//i))
    return n;
  if (n.match(/^\/\//))
    return window.location.protocol + n;
  if (n.match(/^[a-z]+:/i))
    return n;
  const e = document.implementation.createHTMLDocument(), r = e.createElement("base"), s = e.createElement("a");
  return e.head.appendChild(r), e.body.appendChild(s), t && (r.href = t), s.href = n, s.href;
}
const zv = (() => {
  let n = 0;
  const t = () => `0000${(Math.random() * 36 ** 4 << 0).toString(36)}`.slice(-4);
  return () => (n += 1, `u${t()}${n}`);
})();
function qe(n) {
  const t = [];
  for (let e = 0, r = n.length; e < r; e++)
    t.push(n[e]);
  return t;
}
function Ks(n, t) {
  const r = (n.ownerDocument.defaultView || window).getComputedStyle(n).getPropertyValue(t);
  return r ? parseFloat(r.replace("px", "")) : 0;
}
function Zv(n) {
  const t = Ks(n, "border-left-width"), e = Ks(n, "border-right-width");
  return n.clientWidth + t + e;
}
function Wv(n) {
  const t = Ks(n, "border-top-width"), e = Ks(n, "border-bottom-width");
  return n.clientHeight + t + e;
}
function l2(n, t = {}) {
  const e = t.width || Zv(n), r = t.height || Wv(n);
  return { width: e, height: r };
}
function qv() {
  let n, t;
  try {
    t = process;
  } catch {
  }
  const e = t && t.env ? t.env.devicePixelRatio : null;
  return e && (n = parseInt(e, 10), Number.isNaN(n) && (n = 1)), n || window.devicePixelRatio || 1;
}
const Wt = 16384;
function Kv(n) {
  (n.width > Wt || n.height > Wt) && (n.width > Wt && n.height > Wt ? n.width > n.height ? (n.height *= Wt / n.width, n.width = Wt) : (n.width *= Wt / n.height, n.height = Wt) : n.width > Wt ? (n.height *= Wt / n.width, n.width = Wt) : (n.width *= Wt / n.height, n.height = Wt));
}
function Yv(n, t = {}) {
  return n.toBlob ? new Promise((e) => {
    n.toBlob(e, t.type ? t.type : "image/png", t.quality ? t.quality : 1);
  }) : new Promise((e) => {
    const r = window.atob(n.toDataURL(t.type ? t.type : void 0, t.quality ? t.quality : void 0).split(",")[1]), s = r.length, i = new Uint8Array(s);
    for (let o = 0; o < s; o += 1)
      i[o] = r.charCodeAt(o);
    e(new Blob([i], {
      type: t.type ? t.type : "image/png"
    }));
  });
}
function Ys(n) {
  return new Promise((t, e) => {
    const r = new Image();
    r.decode = () => t(r), r.onload = () => t(r), r.onerror = e, r.crossOrigin = "anonymous", r.decoding = "async", r.src = n;
  });
}
async function Xv(n) {
  return Promise.resolve().then(() => new XMLSerializer().serializeToString(n)).then(encodeURIComponent).then((t) => `data:image/svg+xml;charset=utf-8,${t}`);
}
async function Qv(n, t, e) {
  const r = "http://www.w3.org/2000/svg", s = document.createElementNS(r, "svg"), i = document.createElementNS(r, "foreignObject");
  return s.setAttribute("width", `${t}`), s.setAttribute("height", `${e}`), s.setAttribute("viewBox", `0 0 ${t} ${e}`), i.setAttribute("width", "100%"), i.setAttribute("height", "100%"), i.setAttribute("x", "0"), i.setAttribute("y", "0"), i.setAttribute("externalResourcesRequired", "true"), s.appendChild(i), i.appendChild(n), Xv(s);
}
function Jv(n) {
  const t = n.getPropertyValue("content");
  return `${n.cssText} content: '${t.replace(/'|"/g, "")}';`;
}
function ty(n) {
  return qe(n).map((t) => {
    const e = n.getPropertyValue(t), r = n.getPropertyPriority(t);
    return `${t}: ${e}${r ? " !important" : ""};`;
  }).join(" ");
}
function ey(n, t, e) {
  const r = `.${n}:${t}`, s = e.cssText ? Jv(e) : ty(e);
  return document.createTextNode(`${r}{${s}}`);
}
function Fc(n, t, e) {
  const r = window.getComputedStyle(n, e), s = r.getPropertyValue("content");
  if (s === "" || s === "none")
    return;
  const i = zv();
  try {
    t.className = `${t.className} ${i}`;
  } catch {
    return;
  }
  const o = document.createElement("style");
  o.appendChild(ey(i, e, r)), t.appendChild(o);
}
function ny(n, t) {
  Fc(n, t, ":before"), Fc(n, t, ":after");
}
const Bc = "application/font-woff", Uc = "image/jpeg", ry = {
  woff: Bc,
  woff2: Bc,
  ttf: "application/font-truetype",
  eot: "application/vnd.ms-fontobject",
  png: "image/png",
  jpg: Uc,
  jpeg: Uc,
  gif: "image/gif",
  tiff: "image/tiff",
  svg: "image/svg+xml",
  webp: "image/webp"
};
function sy(n) {
  const t = /\.([^./]*?)$/g.exec(n);
  return t ? t[1] : "";
}
function y1(n) {
  const t = sy(n).toLowerCase();
  return ry[t] || "";
}
function iy(n) {
  return n.split(/,/)[1];
}
function Ho(n) {
  return n.search(/^(data:)/) !== -1;
}
function c2(n, t) {
  return `data:${t};base64,${n}`;
}
async function u2(n, t, e) {
  const r = await fetch(n, t);
  if (r.status === 404)
    throw new Error(`Resource "${r.url}" not found`);
  const s = await r.blob();
  return new Promise((i, o) => {
    const a = new FileReader();
    a.onerror = o, a.onloadend = () => {
      try {
        i(e({ res: r, result: a.result }));
      } catch (l) {
        o(l);
      }
    }, a.readAsDataURL(s);
  });
}
const Ji = {};
function oy(n, t, e) {
  let r = n.replace(/\?.*/, "");
  return e && (r = n), /ttf|otf|eot|woff2?/i.test(r) && (r = r.replace(/.*\//, "")), t ? `[${t}]${r}` : r;
}
async function C1(n, t, e) {
  const r = oy(n, t, e.includeQueryParams);
  if (Ji[r] != null)
    return Ji[r];
  e.cacheBust && (n += (/\?/.test(n) ? "&" : "?") + new Date().getTime());
  let s;
  try {
    const i = await u2(n, e.fetchRequestInit, ({ res: o, result: a }) => (t || (t = o.headers.get("Content-Type") || ""), iy(a)));
    s = c2(i, t);
  } catch (i) {
    s = e.imagePlaceholder || "";
    let o = `Failed to fetch resource: ${n}`;
    i && (o = typeof i == "string" ? i : i.message), o && console.warn(o);
  }
  return Ji[r] = s, s;
}
async function ay(n) {
  const t = n.toDataURL();
  return t === "data:," ? n.cloneNode(!1) : Ys(t);
}
async function ly(n, t) {
  if (n.currentSrc) {
    const i = document.createElement("canvas"), o = i.getContext("2d");
    i.width = n.clientWidth, i.height = n.clientHeight, o == null || o.drawImage(n, 0, 0, i.width, i.height);
    const a = i.toDataURL();
    return Ys(a);
  }
  const e = n.poster, r = y1(e), s = await C1(e, r, t);
  return Ys(s);
}
async function cy(n) {
  var t;
  try {
    if (!((t = n == null ? void 0 : n.contentDocument) === null || t === void 0) && t.body)
      return await Ri(n.contentDocument.body, {}, !0);
  } catch {
  }
  return n.cloneNode(!1);
}
async function uy(n, t) {
  return n instanceof HTMLCanvasElement ? ay(n) : n instanceof HTMLVideoElement ? ly(n, t) : n instanceof HTMLIFrameElement ? cy(n) : n.cloneNode(!1);
}
const hy = (n) => n.tagName != null && n.tagName.toUpperCase() === "SLOT";
async function fy(n, t, e) {
  var r;
  const s = hy(n) && n.assignedNodes ? qe(n.assignedNodes()) : qe(((r = n.shadowRoot) !== null && r !== void 0 ? r : n).childNodes);
  return s.length === 0 || n instanceof HTMLVideoElement || await s.reduce((i, o) => i.then(() => Ri(o, e)).then((a) => {
    a && t.appendChild(a);
  }), Promise.resolve()), t;
}
function dy(n, t) {
  const e = t.style;
  if (!e)
    return;
  const r = window.getComputedStyle(n);
  r.cssText ? (e.cssText = r.cssText, e.transformOrigin = r.transformOrigin) : qe(r).forEach((s) => {
    let i = r.getPropertyValue(s);
    s === "font-size" && i.endsWith("px") && (i = `${Math.floor(parseFloat(i.substring(0, i.length - 2))) - 0.1}px`), e.setProperty(s, i, r.getPropertyPriority(s));
  });
}
function py(n, t) {
  n instanceof HTMLTextAreaElement && (t.innerHTML = n.value), n instanceof HTMLInputElement && t.setAttribute("value", n.value);
}
function gy(n, t) {
  if (n instanceof HTMLSelectElement) {
    const e = t, r = Array.from(e.children).find((s) => n.value === s.getAttribute("value"));
    r && r.setAttribute("selected", "");
  }
}
function xy(n, t) {
  return t instanceof Element && (dy(n, t), ny(n, t), py(n, t), gy(n, t)), t;
}
async function my(n, t) {
  const e = n.querySelectorAll ? n.querySelectorAll("use") : [];
  if (e.length === 0)
    return n;
  const r = {};
  for (let i = 0; i < e.length; i++) {
    const a = e[i].getAttribute("xlink:href");
    if (a) {
      const l = n.querySelector(a), c = document.querySelector(a);
      !l && c && !r[a] && (r[a] = await Ri(c, t, !0));
    }
  }
  const s = Object.values(r);
  if (s.length) {
    const i = "http://www.w3.org/1999/xhtml", o = document.createElementNS(i, "svg");
    o.setAttribute("xmlns", i), o.style.position = "absolute", o.style.width = "0", o.style.height = "0", o.style.overflow = "hidden", o.style.display = "none";
    const a = document.createElementNS(i, "defs");
    o.appendChild(a);
    for (let l = 0; l < s.length; l++)
      a.appendChild(s[l]);
    n.appendChild(o);
  }
  return n;
}
async function Ri(n, t, e) {
  return !e && t.filter && !t.filter(n) ? null : Promise.resolve(n).then((r) => uy(r, t)).then((r) => fy(n, r, t)).then((r) => xy(n, r)).then((r) => my(r, t));
}
const h2 = /url\((['"]?)([^'"]+?)\1\)/g, _y = /url\([^)]+\)\s*format\((["']?)([^"']+)\1\)/g, Ly = /src:\s*(?:url\([^)]+\)\s*format\([^)]+\)[,;]\s*)+/g;
function vy(n) {
  const t = n.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1");
  return new RegExp(`(url\\(['"]?)(${t})(['"]?\\))`, "g");
}
function yy(n) {
  const t = [];
  return n.replace(h2, (e, r, s) => (t.push(s), e)), t.filter((e) => !Ho(e));
}
async function Cy(n, t, e, r, s) {
  try {
    const i = e ? Vv(t, e) : t, o = y1(t);
    let a;
    if (s) {
      const l = await s(i);
      a = c2(l, o);
    } else
      a = await C1(i, o, r);
    return n.replace(vy(t), `$1${a}$3`);
  } catch {
  }
  return n;
}
function Ey(n, { preferredFontFormat: t }) {
  return t ? n.replace(Ly, (e) => {
    for (; ; ) {
      const [r, , s] = _y.exec(e) || [];
      if (!s)
        return "";
      if (s === t)
        return `src: ${r};`;
    }
  }) : n;
}
function f2(n) {
  return n.search(h2) !== -1;
}
async function d2(n, t, e) {
  if (!f2(n))
    return n;
  const r = Ey(n, e);
  return yy(r).reduce((i, o) => i.then((a) => Cy(a, o, t, e)), Promise.resolve(r));
}
async function by(n, t) {
  var e;
  const r = (e = n.style) === null || e === void 0 ? void 0 : e.getPropertyValue("background");
  if (r) {
    const s = await d2(r, null, t);
    n.style.setProperty("background", s, n.style.getPropertyPriority("background"));
  }
}
async function wy(n, t) {
  if (!(n instanceof HTMLImageElement && !Ho(n.src)) && !(n instanceof SVGImageElement && !Ho(n.href.baseVal)))
    return;
  const e = n instanceof HTMLImageElement ? n.src : n.href.baseVal, r = await C1(e, y1(e), t);
  await new Promise((s, i) => {
    n.onload = s, n.onerror = i;
    const o = n;
    o.decode && (o.decode = s), n instanceof HTMLImageElement ? (n.srcset = "", n.src = r) : n.href.baseVal = r;
  });
}
async function Ty(n, t) {
  const r = qe(n.childNodes).map((s) => p2(s, t));
  await Promise.all(r).then(() => n);
}
async function p2(n, t) {
  n instanceof Element && (await by(n, t), await wy(n, t), await Ty(n, t));
}
function Ay(n, t) {
  const { style: e } = n;
  t.backgroundColor && (e.backgroundColor = t.backgroundColor), t.width && (e.width = `${t.width}px`), t.height && (e.height = `${t.height}px`);
  const r = t.style;
  return r != null && Object.keys(r).forEach((s) => {
    e[s] = r[s];
  }), n;
}
const Hc = {};
async function Gc(n) {
  let t = Hc[n];
  if (t != null)
    return t;
  const r = await (await fetch(n)).text();
  return t = { url: n, cssText: r }, Hc[n] = t, t;
}
async function jc(n, t) {
  let e = n.cssText;
  const r = /url\(["']?([^"')]+)["']?\)/g, i = (e.match(/url\([^)]+\)/g) || []).map(async (o) => {
    let a = o.replace(r, "$1");
    return a.startsWith("https://") || (a = new URL(a, n.url).href), u2(a, t.fetchRequestInit, ({ result: l }) => (e = e.replace(o, `url(${l})`), [o, l]));
  });
  return Promise.all(i).then(() => e);
}
function Vc(n) {
  if (n == null)
    return [];
  const t = [], e = /(\/\*[\s\S]*?\*\/)/gi;
  let r = n.replace(e, "");
  const s = new RegExp("((@.*?keyframes [\\s\\S]*?){([\\s\\S]*?}\\s*?)})", "gi");
  for (; ; ) {
    const l = s.exec(r);
    if (l === null)
      break;
    t.push(l[0]);
  }
  r = r.replace(s, "");
  const i = /@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi, o = "((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})", a = new RegExp(o, "gi");
  for (; ; ) {
    let l = i.exec(r);
    if (l === null) {
      if (l = a.exec(r), l === null)
        break;
      i.lastIndex = a.lastIndex;
    } else
      a.lastIndex = i.lastIndex;
    t.push(l[0]);
  }
  return t;
}
async function Sy(n, t) {
  const e = [], r = [];
  return n.forEach((s) => {
    if ("cssRules" in s)
      try {
        qe(s.cssRules || []).forEach((i, o) => {
          if (i.type === CSSRule.IMPORT_RULE) {
            let a = o + 1;
            const l = i.href, c = Gc(l).then((u) => jc(u, t)).then((u) => Vc(u).forEach((f) => {
              try {
                s.insertRule(f, f.startsWith("@import") ? a += 1 : s.cssRules.length);
              } catch (d) {
                console.error("Error inserting rule from remote css", {
                  rule: f,
                  error: d
                });
              }
            })).catch((u) => {
              console.error("Error loading remote css", u.toString());
            });
            r.push(c);
          }
        });
      } catch (i) {
        const o = n.find((a) => a.href == null) || document.styleSheets[0];
        s.href != null && r.push(Gc(s.href).then((a) => jc(a, t)).then((a) => Vc(a).forEach((l) => {
          o.insertRule(l, s.cssRules.length);
        })).catch((a) => {
          console.error("Error loading remote stylesheet", a.toString());
        })), console.error("Error inlining remote css file", i.toString());
      }
  }), Promise.all(r).then(() => (n.forEach((s) => {
    if ("cssRules" in s)
      try {
        qe(s.cssRules || []).forEach((i) => {
          e.push(i);
        });
      } catch (i) {
        console.error(`Error while reading CSS rules from ${s.href}`, i.toString());
      }
  }), e));
}
function Ry(n) {
  return n.filter((t) => t.type === CSSRule.FONT_FACE_RULE).filter((t) => f2(t.style.getPropertyValue("src")));
}
async function ky(n, t) {
  if (n.ownerDocument == null)
    throw new Error("Provided element is not within a Document");
  const e = qe(n.ownerDocument.styleSheets), r = await Sy(e, t);
  return Ry(r);
}
async function Oy(n, t) {
  const e = await ky(n, t);
  return (await Promise.all(e.map((s) => {
    const i = s.parentStyleSheet ? s.parentStyleSheet.href : null;
    return d2(s.cssText, i, t);
  }))).join(`
`);
}
async function Ny(n, t) {
  const e = t.fontEmbedCSS != null ? t.fontEmbedCSS : t.skipFonts ? null : await Oy(n, t);
  if (e) {
    const r = document.createElement("style"), s = document.createTextNode(e);
    r.appendChild(s), n.firstChild ? n.insertBefore(r, n.firstChild) : n.appendChild(r);
  }
}
async function g2(n, t = {}) {
  const { width: e, height: r } = l2(n, t), s = await Ri(n, t, !0);
  return await Ny(s, t), await p2(s, t), Ay(s, t), await Qv(s, e, r);
}
async function E1(n, t = {}) {
  const { width: e, height: r } = l2(n, t), s = await g2(n, t), i = await Ys(s), o = document.createElement("canvas"), a = o.getContext("2d"), l = t.pixelRatio || qv(), c = t.canvasWidth || e, u = t.canvasHeight || r;
  return o.width = c * l, o.height = u * l, t.skipAutoScale || Kv(o), o.style.width = `${c}`, o.style.height = `${u}`, t.backgroundColor && (a.fillStyle = t.backgroundColor, a.fillRect(0, 0, o.width, o.height)), a.drawImage(i, 0, 0, o.width, o.height), o;
}
async function Iy(n, t = {}) {
  return (await E1(n, t)).toDataURL();
}
async function My(n, t = {}) {
  return (await E1(n, t)).toDataURL("image/jpeg", t.quality || 1);
}
async function Py(n, t = {}) {
  const e = await E1(n, t);
  return await Yv(e);
}
var $y = function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    directives: [{
      name: "show",
      rawName: "v-show",
      value: n.debug,
      expression: "debug"
    }]
  }, [e("div", {
    staticClass: "flex flex-nowrap m-2 text-sm"
  }, [e("div", {
    staticClass: "ml-4 text-xs inline-flex items-center font-bold leading-sm px-3 py-1 bg-green-200 text-green-700 rounded-sm"
  }, [e("svg", {
    staticClass: "h-4 w-4",
    attrs: {
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    }
  }, [e("line", {
    attrs: {
      x1: "6",
      y1: "3",
      x2: "6",
      y2: "15"
    }
  }), e("circle", {
    attrs: {
      cx: "18",
      cy: "6",
      r: "3"
    }
  }), e("circle", {
    attrs: {
      cx: "6",
      cy: "18",
      r: "3"
    }
  }), e("path", {
    attrs: {
      d: "M18 9a9 9 0 0 1-9 9"
    }
  })]), e("span", {
    staticClass: "inline-block px-2"
  }, [n._v(n._s(n.gitBranch) + ":" + n._s(n.commitHash))])])])]);
}, Dy = [];
const Fy = "process.env.VUE_APP_GIT_HASH", By = "process.env.VUE_APP_GIT_BRANCH", Uy = {
  name: "Debug",
  data() {
    return {
      commitHash: Fy,
      gitBranch: By
    };
  },
  computed: {
    debug() {
      return !!localStorage.zenumlDebug;
    }
  }
}, zc = {};
var Hy = /* @__PURE__ */ et(
  Uy,
  $y,
  Dy,
  !1,
  Gy,
  null,
  null,
  null
);
function Gy(n) {
  for (let t in zc)
    this[t] = zc[t];
}
const jy = /* @__PURE__ */ function() {
  return Hy.exports;
}();
var Vy = function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    ref: "export",
    staticClass: "zenuml p-1 bg-skin-canvas",
    class: n.theme,
    staticStyle: {
      display: "inline-block"
    }
  }, [e("debug"), e("div", {
    staticClass: "frame text-skin-frame bg-skin-frame border-skin-frame relative m-1 origin-top-left whitespace-nowrap border rounded",
    style: {
      transform: `scale(${n.scale})`
    }
  }, [e("div", {
    ref: "content"
  }, [e("div", {
    staticClass: "header text-skin-title bg-skin-title border-skin-frame border-b p-1 flex justify-between rounded-t"
  }, [e("div", {
    staticClass: "left hide-export"
  }, [n._t("default")], 2), e("div", {
    staticClass: "right flex-grow flex justify-between"
  }, [e("diagram-title", {
    attrs: {
      context: n.title
    }
  }), e("privacy", {
    staticClass: "hide-export flex items-center"
  })], 1)]), e("div", [n.showTips ? e("div", {
    staticClass: "fixed z-40 inset-0 overflow-y-auto",
    attrs: {
      "aria-labelledby": "modal-title",
      role: "dialog",
      "aria-modal": "true"
    }
  }, [e("TipsDialog")], 1) : n._e()]), e("seq-diagram")], 1), e("div", {
    staticClass: "footer p-1 flex justify-between"
  }, [e("button", {
    staticClass: "bottom-1 left-1 hide-export",
    on: {
      click: function(r) {
        return n.showTipsDialog();
      }
    }
  }, [e("svg", {
    staticClass: "filter grayscale",
    staticStyle: {
      width: "1em",
      height: "1em",
      "vertical-align": "middle",
      fill: "currentColor",
      overflow: "hidden"
    },
    attrs: {
      viewBox: "0 0 1024 1024",
      xmlns: "http://www.w3.org/2000/svg"
    }
  }, [e("path", {
    attrs: {
      d: "M514 912c-219.9 0-398.8-178.9-398.8-398.9 0-219.9 178.9-398.8 398.8-398.8s398.9 178.9 398.9 398.8c-0.1 220-179 398.9-398.9 398.9z m0-701.5c-166.9 0-302.7 135.8-302.7 302.7S347.1 815.9 514 815.9s302.7-135.8 302.7-302.7S680.9 210.5 514 210.5z",
      fill: "#BDD2EF"
    }
  }), e("path", {
    attrs: {
      d: "M431.1 502.4c-0.1 0.3 0.3 0.4 0.4 0.2 6.9-11.7 56.5-89.1 23.4 167.3-17.4 134.7 122.9 153.6 142.3-7.9 0.1-1-1.3-1.4-1.7-0.4-11.9 37.2-49.6 104.9-4.7-155.2 18.6-107.2-127.6-146-159.7-4z",
      fill: "#2867CE"
    }
  }), e("path", {
    attrs: {
      d: "M541.3 328m-68 0a68 68 0 1 0 136 0 68 68 0 1 0-136 0Z",
      fill: "#2867CE"
    }
  })])]), e("div", {
    staticClass: "zoom-controls bg-skin-base text-skin-control flex justify-between w-28 hide-export",
    style: {
      transform: `scale(${1 / n.scale})`
    }
  }, [e("button", {
    staticClass: "zoom-in px-1",
    on: {
      click: function(r) {
        return n.zoomIn();
      }
    }
  }, [n._v("+")]), e("label", [n._v(n._s(Number(n.scale * 100).toFixed(0)) + " %")]), e("button", {
    staticClass: "zoom-out px-1",
    on: {
      click: function(r) {
        return n.zoomOut();
      }
    }
  }, [n._v("-")])]), e("width-provider"), e("a", {
    staticClass: "brand text-skin-link absolute bottom-1 right-1 text-xs",
    attrs: {
      target: "_blank",
      href: "https://zenuml.com"
    }
  }, [n._v("ZenUML.com")])], 1)])], 1);
}, zy = [];
const Zy = {
  name: "DiagramFrame",
  computed: {
    ...Mr(["showTips", "scale", "theme"]),
    ...Ht(["rootContext"]),
    title() {
      var n;
      return this.rootContext || console.error("`rootContext` is empty. Please make sure `store` is properly configured."), (n = this.rootContext) == null ? void 0 : n.title();
    }
  },
  methods: {
    ...Pr(["setScale"]),
    showTipsDialog() {
      var n;
      this.$store.state.showTips = !0;
      try {
        (n = this.$gtag) == null || n.event("view", {
          event_category: "help",
          event_label: "tips dialog"
        });
      } catch (t) {
        console.error(t);
      }
    },
    toPng() {
      return Iy(this.$refs.export, {
        backgroundColor: "white",
        filter: (n) => {
          var t;
          return !((t = n == null ? void 0 : n.classList) != null && t.contains("hide-export"));
        }
      });
    },
    toSvg() {
      return g2(this.$refs.export, {
        backgroundColor: "white",
        filter: (n) => {
          var t;
          return !((t = n == null ? void 0 : n.classList) != null && t.contains("hide-export"));
        }
      });
    },
    toBlob() {
      return Py(this.$refs.export, {
        backgroundColor: "white",
        filter: (n) => {
          var t;
          return !((t = n == null ? void 0 : n.classList) != null && t.contains("hide-export"));
        }
      });
    },
    toJpeg() {
      return My(this.$refs.export, {
        backgroundColor: "white",
        filter: (n) => {
          var t;
          return !((t = n == null ? void 0 : n.classList) != null && t.contains("hide-export"));
        }
      });
    },
    zoomIn() {
      this.setScale(this.scale + 0.1);
    },
    zoomOut() {
      this.setScale(this.scale - 0.1);
    },
    setTheme(n) {
      this.theme = n;
    },
    setStyle(n) {
      const t = "zenuml-style";
      let e = document.getElementById(t);
      e || (e = document.createElement("style"), e.id = t, document.head.append(e)), e.textContent = n;
    },
    setRemoteCss(n) {
      if (n.includes("github.com") || n.includes("githubusercontent.com")) {
        fetch(n.replace("github.com", "raw.githubusercontent.com").replace("blob/", "")).then((r) => r.text()).then((r) => {
          this.setStyle(r), console.log("set remote css from github", r);
        });
        return;
      }
      if (n.includes("github.com") || n.includes("githubusercontent.com")) {
        const r = n.replace("github.com", "raw.githubusercontent.com").replace("/blob", "");
        fetch(r).then((s) => s.text()).then((s) => this.setStyle(s));
        return;
      }
      console.log("setRemoteCss", n);
      const t = "zenuml-remote-css";
      let e = document.getElementById(t);
      e || (e = document.createElement("link"), e.id = t, e.rel = "stylesheet", document.head.append(e)), e.href = n;
    }
  },
  components: {
    Debug: jy,
    WidthProvider: jv,
    TipsDialog: Tv,
    DiagramTitle: R_,
    SeqDiagram: a2,
    Privacy: E_
  }
}, Zc = {};
var Wy = /* @__PURE__ */ et(
  Zy,
  Vy,
  zy,
  !1,
  qy,
  null,
  null,
  null
);
function qy(n) {
  for (let t in Zc)
    this[t] = Zc[t];
}
const Ky = /* @__PURE__ */ function() {
  return Wy.exports;
}();
function x2() {
  return {
    async: !1,
    baseUrl: null,
    breaks: !1,
    extensions: null,
    gfm: !0,
    headerIds: !0,
    headerPrefix: "",
    highlight: null,
    langPrefix: "language-",
    mangle: !0,
    pedantic: !1,
    renderer: null,
    sanitize: !1,
    sanitizer: null,
    silent: !1,
    smartypants: !1,
    tokenizer: null,
    walkTokens: null,
    xhtml: !1
  };
}
let Qn = x2();
function Yy(n) {
  Qn = n;
}
const Xy = /[&<>"']/, Qy = /[&<>"']/g, Jy = /[<>"']|&(?!#?\w+;)/, tC = /[<>"']|&(?!#?\w+;)/g, eC = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}, Wc = (n) => eC[n];
function Tt(n, t) {
  if (t) {
    if (Xy.test(n))
      return n.replace(Qy, Wc);
  } else if (Jy.test(n))
    return n.replace(tC, Wc);
  return n;
}
const nC = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;
function m2(n) {
  return n.replace(nC, (t, e) => (e = e.toLowerCase(), e === "colon" ? ":" : e.charAt(0) === "#" ? e.charAt(1) === "x" ? String.fromCharCode(parseInt(e.substring(2), 16)) : String.fromCharCode(+e.substring(1)) : ""));
}
const rC = /(^|[^\[])\^/g;
function lt(n, t) {
  n = typeof n == "string" ? n : n.source, t = t || "";
  const e = {
    replace: (r, s) => (s = s.source || s, s = s.replace(rC, "$1"), n = n.replace(r, s), e),
    getRegex: () => new RegExp(n, t)
  };
  return e;
}
const sC = /[^\w:]/g, iC = /^$|^[a-z][a-z0-9+.-]*:|^[?#]/i;
function qc(n, t, e) {
  if (n) {
    let r;
    try {
      r = decodeURIComponent(m2(e)).replace(sC, "").toLowerCase();
    } catch {
      return null;
    }
    if (r.indexOf("javascript:") === 0 || r.indexOf("vbscript:") === 0 || r.indexOf("data:") === 0)
      return null;
  }
  t && !iC.test(e) && (e = cC(t, e));
  try {
    e = encodeURI(e).replace(/%25/g, "%");
  } catch {
    return null;
  }
  return e;
}
const xs = {}, oC = /^[^:]+:\/*[^/]*$/, aC = /^([^:]+:)[\s\S]*$/, lC = /^([^:]+:\/*[^/]*)[\s\S]*$/;
function cC(n, t) {
  xs[" " + n] || (oC.test(n) ? xs[" " + n] = n + "/" : xs[" " + n] = bs(n, "/", !0)), n = xs[" " + n];
  const e = n.indexOf(":") === -1;
  return t.substring(0, 2) === "//" ? e ? t : n.replace(aC, "$1") + t : t.charAt(0) === "/" ? e ? t : n.replace(lC, "$1") + t : n + t;
}
const Xs = { exec: function() {
} };
function pe(n) {
  let t = 1, e, r;
  for (; t < arguments.length; t++) {
    e = arguments[t];
    for (r in e)
      Object.prototype.hasOwnProperty.call(e, r) && (n[r] = e[r]);
  }
  return n;
}
function Kc(n, t) {
  const e = n.replace(/\|/g, (i, o, a) => {
    let l = !1, c = o;
    for (; --c >= 0 && a[c] === "\\"; )
      l = !l;
    return l ? "|" : " |";
  }), r = e.split(/ \|/);
  let s = 0;
  if (r[0].trim() || r.shift(), r.length > 0 && !r[r.length - 1].trim() && r.pop(), r.length > t)
    r.splice(t);
  else
    for (; r.length < t; )
      r.push("");
  for (; s < r.length; s++)
    r[s] = r[s].trim().replace(/\\\|/g, "|");
  return r;
}
function bs(n, t, e) {
  const r = n.length;
  if (r === 0)
    return "";
  let s = 0;
  for (; s < r; ) {
    const i = n.charAt(r - s - 1);
    if (i === t && !e)
      s++;
    else if (i !== t && e)
      s++;
    else
      break;
  }
  return n.slice(0, r - s);
}
function uC(n, t) {
  if (n.indexOf(t[1]) === -1)
    return -1;
  const e = n.length;
  let r = 0, s = 0;
  for (; s < e; s++)
    if (n[s] === "\\")
      s++;
    else if (n[s] === t[0])
      r++;
    else if (n[s] === t[1] && (r--, r < 0))
      return s;
  return -1;
}
function _2(n) {
  n && n.sanitize && !n.silent && console.warn("marked(): sanitize and sanitizer parameters are deprecated since version 0.7.0, should not be used and will be removed in the future. Read more here: https://marked.js.org/#/USING_ADVANCED.md#options");
}
function Yc(n, t) {
  if (t < 1)
    return "";
  let e = "";
  for (; t > 1; )
    t & 1 && (e += n), t >>= 1, n += n;
  return e + n;
}
function Xc(n, t, e, r) {
  const s = t.href, i = t.title ? Tt(t.title) : null, o = n[1].replace(/\\([\[\]])/g, "$1");
  if (n[0].charAt(0) !== "!") {
    r.state.inLink = !0;
    const a = {
      type: "link",
      raw: e,
      href: s,
      title: i,
      text: o,
      tokens: r.inlineTokens(o)
    };
    return r.state.inLink = !1, a;
  }
  return {
    type: "image",
    raw: e,
    href: s,
    title: i,
    text: Tt(o)
  };
}
function hC(n, t) {
  const e = n.match(/^(\s+)(?:```)/);
  if (e === null)
    return t;
  const r = e[1];
  return t.split(`
`).map((s) => {
    const i = s.match(/^\s+/);
    if (i === null)
      return s;
    const [o] = i;
    return o.length >= r.length ? s.slice(r.length) : s;
  }).join(`
`);
}
class b1 {
  constructor(t) {
    this.options = t || Qn;
  }
  space(t) {
    const e = this.rules.block.newline.exec(t);
    if (e && e[0].length > 0)
      return {
        type: "space",
        raw: e[0]
      };
  }
  code(t) {
    const e = this.rules.block.code.exec(t);
    if (e) {
      const r = e[0].replace(/^ {1,4}/gm, "");
      return {
        type: "code",
        raw: e[0],
        codeBlockStyle: "indented",
        text: this.options.pedantic ? r : bs(r, `
`)
      };
    }
  }
  fences(t) {
    const e = this.rules.block.fences.exec(t);
    if (e) {
      const r = e[0], s = hC(r, e[3] || "");
      return {
        type: "code",
        raw: r,
        lang: e[2] ? e[2].trim() : e[2],
        text: s
      };
    }
  }
  heading(t) {
    const e = this.rules.block.heading.exec(t);
    if (e) {
      let r = e[2].trim();
      if (/#$/.test(r)) {
        const s = bs(r, "#");
        (this.options.pedantic || !s || / $/.test(s)) && (r = s.trim());
      }
      return {
        type: "heading",
        raw: e[0],
        depth: e[1].length,
        text: r,
        tokens: this.lexer.inline(r)
      };
    }
  }
  hr(t) {
    const e = this.rules.block.hr.exec(t);
    if (e)
      return {
        type: "hr",
        raw: e[0]
      };
  }
  blockquote(t) {
    const e = this.rules.block.blockquote.exec(t);
    if (e) {
      const r = e[0].replace(/^ *>[ \t]?/gm, "");
      return {
        type: "blockquote",
        raw: e[0],
        tokens: this.lexer.blockTokens(r, []),
        text: r
      };
    }
  }
  list(t) {
    let e = this.rules.block.list.exec(t);
    if (e) {
      let r, s, i, o, a, l, c, u, f, d, p, w, I = e[1].trim();
      const W = I.length > 1, $ = {
        type: "list",
        raw: "",
        ordered: W,
        start: W ? +I.slice(0, -1) : "",
        loose: !1,
        items: []
      };
      I = W ? `\\d{1,9}\\${I.slice(-1)}` : `\\${I}`, this.options.pedantic && (I = W ? I : "[*+-]");
      const j = new RegExp(`^( {0,3}${I})((?:[	 ][^\\n]*)?(?:\\n|$))`);
      for (; t && (w = !1, !(!(e = j.exec(t)) || this.rules.block.hr.test(t))); ) {
        if (r = e[0], t = t.substring(r.length), u = e[2].split(`
`, 1)[0], f = t.split(`
`, 1)[0], this.options.pedantic ? (o = 2, p = u.trimLeft()) : (o = e[2].search(/[^ ]/), o = o > 4 ? 1 : o, p = u.slice(o), o += e[1].length), l = !1, !u && /^ *$/.test(f) && (r += f + `
`, t = t.substring(f.length + 1), w = !0), !w) {
          const Y = new RegExp(`^ {0,${Math.min(3, o - 1)}}(?:[*+-]|\\d{1,9}[.)])((?: [^\\n]*)?(?:\\n|$))`), ft = new RegExp(`^ {0,${Math.min(3, o - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), rt = new RegExp(`^ {0,${Math.min(3, o - 1)}}(?:\`\`\`|~~~)`), dt = new RegExp(`^ {0,${Math.min(3, o - 1)}}#`);
          for (; t && (d = t.split(`
`, 1)[0], u = d, this.options.pedantic && (u = u.replace(/^ {1,4}(?=( {4})*[^ ])/g, "  ")), !(rt.test(u) || dt.test(u) || Y.test(u) || ft.test(t))); ) {
            if (u.search(/[^ ]/) >= o || !u.trim())
              p += `
` + u.slice(o);
            else if (!l)
              p += `
` + u;
            else
              break;
            !l && !u.trim() && (l = !0), r += d + `
`, t = t.substring(d.length + 1);
          }
        }
        $.loose || (c ? $.loose = !0 : /\n *\n *$/.test(r) && (c = !0)), this.options.gfm && (s = /^\[[ xX]\] /.exec(p), s && (i = s[0] !== "[ ] ", p = p.replace(/^\[[ xX]\] +/, ""))), $.items.push({
          type: "list_item",
          raw: r,
          task: !!s,
          checked: i,
          loose: !1,
          text: p
        }), $.raw += r;
      }
      $.items[$.items.length - 1].raw = r.trimRight(), $.items[$.items.length - 1].text = p.trimRight(), $.raw = $.raw.trimRight();
      const it = $.items.length;
      for (a = 0; a < it; a++) {
        this.lexer.state.top = !1, $.items[a].tokens = this.lexer.blockTokens($.items[a].text, []);
        const Y = $.items[a].tokens.filter((rt) => rt.type === "space"), ft = Y.every((rt) => {
          const dt = rt.raw.split("");
          let It = 0;
          for (const ce of dt)
            if (ce === `
` && (It += 1), It > 1)
              return !0;
          return !1;
        });
        !$.loose && Y.length && ft && ($.loose = !0, $.items[a].loose = !0);
      }
      return $;
    }
  }
  html(t) {
    const e = this.rules.block.html.exec(t);
    if (e) {
      const r = {
        type: "html",
        raw: e[0],
        pre: !this.options.sanitizer && (e[1] === "pre" || e[1] === "script" || e[1] === "style"),
        text: e[0]
      };
      if (this.options.sanitize) {
        const s = this.options.sanitizer ? this.options.sanitizer(e[0]) : Tt(e[0]);
        r.type = "paragraph", r.text = s, r.tokens = this.lexer.inline(s);
      }
      return r;
    }
  }
  def(t) {
    const e = this.rules.block.def.exec(t);
    if (e)
      return e[3] && (e[3] = e[3].substring(1, e[3].length - 1)), {
        type: "def",
        tag: e[1].toLowerCase().replace(/\s+/g, " "),
        raw: e[0],
        href: e[2],
        title: e[3]
      };
  }
  table(t) {
    const e = this.rules.block.table.exec(t);
    if (e) {
      const r = {
        type: "table",
        header: Kc(e[1]).map((s) => ({ text: s })),
        align: e[2].replace(/^ *|\| *$/g, "").split(/ *\| */),
        rows: e[3] && e[3].trim() ? e[3].replace(/\n[ \t]*$/, "").split(`
`) : []
      };
      if (r.header.length === r.align.length) {
        r.raw = e[0];
        let s = r.align.length, i, o, a, l;
        for (i = 0; i < s; i++)
          /^ *-+: *$/.test(r.align[i]) ? r.align[i] = "right" : /^ *:-+: *$/.test(r.align[i]) ? r.align[i] = "center" : /^ *:-+ *$/.test(r.align[i]) ? r.align[i] = "left" : r.align[i] = null;
        for (s = r.rows.length, i = 0; i < s; i++)
          r.rows[i] = Kc(r.rows[i], r.header.length).map((c) => ({ text: c }));
        for (s = r.header.length, o = 0; o < s; o++)
          r.header[o].tokens = this.lexer.inline(r.header[o].text);
        for (s = r.rows.length, o = 0; o < s; o++)
          for (l = r.rows[o], a = 0; a < l.length; a++)
            l[a].tokens = this.lexer.inline(l[a].text);
        return r;
      }
    }
  }
  lheading(t) {
    const e = this.rules.block.lheading.exec(t);
    if (e)
      return {
        type: "heading",
        raw: e[0],
        depth: e[2].charAt(0) === "=" ? 1 : 2,
        text: e[1],
        tokens: this.lexer.inline(e[1])
      };
  }
  paragraph(t) {
    const e = this.rules.block.paragraph.exec(t);
    if (e) {
      const r = e[1].charAt(e[1].length - 1) === `
` ? e[1].slice(0, -1) : e[1];
      return {
        type: "paragraph",
        raw: e[0],
        text: r,
        tokens: this.lexer.inline(r)
      };
    }
  }
  text(t) {
    const e = this.rules.block.text.exec(t);
    if (e)
      return {
        type: "text",
        raw: e[0],
        text: e[0],
        tokens: this.lexer.inline(e[0])
      };
  }
  escape(t) {
    const e = this.rules.inline.escape.exec(t);
    if (e)
      return {
        type: "escape",
        raw: e[0],
        text: Tt(e[1])
      };
  }
  tag(t) {
    const e = this.rules.inline.tag.exec(t);
    if (e)
      return !this.lexer.state.inLink && /^<a /i.test(e[0]) ? this.lexer.state.inLink = !0 : this.lexer.state.inLink && /^<\/a>/i.test(e[0]) && (this.lexer.state.inLink = !1), !this.lexer.state.inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(e[0]) ? this.lexer.state.inRawBlock = !0 : this.lexer.state.inRawBlock && /^<\/(pre|code|kbd|script)(\s|>)/i.test(e[0]) && (this.lexer.state.inRawBlock = !1), {
        type: this.options.sanitize ? "text" : "html",
        raw: e[0],
        inLink: this.lexer.state.inLink,
        inRawBlock: this.lexer.state.inRawBlock,
        text: this.options.sanitize ? this.options.sanitizer ? this.options.sanitizer(e[0]) : Tt(e[0]) : e[0]
      };
  }
  link(t) {
    const e = this.rules.inline.link.exec(t);
    if (e) {
      const r = e[2].trim();
      if (!this.options.pedantic && /^</.test(r)) {
        if (!/>$/.test(r))
          return;
        const o = bs(r.slice(0, -1), "\\");
        if ((r.length - o.length) % 2 === 0)
          return;
      } else {
        const o = uC(e[2], "()");
        if (o > -1) {
          const l = (e[0].indexOf("!") === 0 ? 5 : 4) + e[1].length + o;
          e[2] = e[2].substring(0, o), e[0] = e[0].substring(0, l).trim(), e[3] = "";
        }
      }
      let s = e[2], i = "";
      if (this.options.pedantic) {
        const o = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(s);
        o && (s = o[1], i = o[3]);
      } else
        i = e[3] ? e[3].slice(1, -1) : "";
      return s = s.trim(), /^</.test(s) && (this.options.pedantic && !/>$/.test(r) ? s = s.slice(1) : s = s.slice(1, -1)), Xc(e, {
        href: s && s.replace(this.rules.inline._escapes, "$1"),
        title: i && i.replace(this.rules.inline._escapes, "$1")
      }, e[0], this.lexer);
    }
  }
  reflink(t, e) {
    let r;
    if ((r = this.rules.inline.reflink.exec(t)) || (r = this.rules.inline.nolink.exec(t))) {
      let s = (r[2] || r[1]).replace(/\s+/g, " ");
      if (s = e[s.toLowerCase()], !s || !s.href) {
        const i = r[0].charAt(0);
        return {
          type: "text",
          raw: i,
          text: i
        };
      }
      return Xc(r, s, r[0], this.lexer);
    }
  }
  emStrong(t, e, r = "") {
    let s = this.rules.inline.emStrong.lDelim.exec(t);
    if (!s || s[3] && r.match(/[\p{L}\p{N}]/u))
      return;
    const i = s[1] || s[2] || "";
    if (!i || i && (r === "" || this.rules.inline.punctuation.exec(r))) {
      const o = s[0].length - 1;
      let a, l, c = o, u = 0;
      const f = s[0][0] === "*" ? this.rules.inline.emStrong.rDelimAst : this.rules.inline.emStrong.rDelimUnd;
      for (f.lastIndex = 0, e = e.slice(-1 * t.length + o); (s = f.exec(e)) != null; ) {
        if (a = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !a)
          continue;
        if (l = a.length, s[3] || s[4]) {
          c += l;
          continue;
        } else if ((s[5] || s[6]) && o % 3 && !((o + l) % 3)) {
          u += l;
          continue;
        }
        if (c -= l, c > 0)
          continue;
        if (l = Math.min(l, l + c + u), Math.min(o, l) % 2) {
          const p = t.slice(1, o + s.index + l);
          return {
            type: "em",
            raw: t.slice(0, o + s.index + l + 1),
            text: p,
            tokens: this.lexer.inlineTokens(p)
          };
        }
        const d = t.slice(2, o + s.index + l - 1);
        return {
          type: "strong",
          raw: t.slice(0, o + s.index + l + 1),
          text: d,
          tokens: this.lexer.inlineTokens(d)
        };
      }
    }
  }
  codespan(t) {
    const e = this.rules.inline.code.exec(t);
    if (e) {
      let r = e[2].replace(/\n/g, " ");
      const s = /[^ ]/.test(r), i = /^ /.test(r) && / $/.test(r);
      return s && i && (r = r.substring(1, r.length - 1)), r = Tt(r, !0), {
        type: "codespan",
        raw: e[0],
        text: r
      };
    }
  }
  br(t) {
    const e = this.rules.inline.br.exec(t);
    if (e)
      return {
        type: "br",
        raw: e[0]
      };
  }
  del(t) {
    const e = this.rules.inline.del.exec(t);
    if (e)
      return {
        type: "del",
        raw: e[0],
        text: e[2],
        tokens: this.lexer.inlineTokens(e[2])
      };
  }
  autolink(t, e) {
    const r = this.rules.inline.autolink.exec(t);
    if (r) {
      let s, i;
      return r[2] === "@" ? (s = Tt(this.options.mangle ? e(r[1]) : r[1]), i = "mailto:" + s) : (s = Tt(r[1]), i = s), {
        type: "link",
        raw: r[0],
        text: s,
        href: i,
        tokens: [
          {
            type: "text",
            raw: s,
            text: s
          }
        ]
      };
    }
  }
  url(t, e) {
    let r;
    if (r = this.rules.inline.url.exec(t)) {
      let s, i;
      if (r[2] === "@")
        s = Tt(this.options.mangle ? e(r[0]) : r[0]), i = "mailto:" + s;
      else {
        let o;
        do
          o = r[0], r[0] = this.rules.inline._backpedal.exec(r[0])[0];
        while (o !== r[0]);
        s = Tt(r[0]), r[1] === "www." ? i = "http://" + s : i = s;
      }
      return {
        type: "link",
        raw: r[0],
        text: s,
        href: i,
        tokens: [
          {
            type: "text",
            raw: s,
            text: s
          }
        ]
      };
    }
  }
  inlineText(t, e) {
    const r = this.rules.inline.text.exec(t);
    if (r) {
      let s;
      return this.lexer.state.inRawBlock ? s = this.options.sanitize ? this.options.sanitizer ? this.options.sanitizer(r[0]) : Tt(r[0]) : r[0] : s = Tt(this.options.smartypants ? e(r[0]) : r[0]), {
        type: "text",
        raw: r[0],
        text: s
      };
    }
  }
}
const D = {
  newline: /^(?: *(?:\n|$))+/,
  code: /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/,
  fences: /^ {0,3}(`{3,}(?=[^`\n]*\n)|~{3,})([^\n]*)\n(?:|([\s\S]*?)\n)(?: {0,3}\1[~`]* *(?=\n|$)|$)/,
  hr: /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/,
  heading: /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,
  blockquote: /^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/,
  list: /^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/,
  html: "^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n *)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$))",
  def: /^ {0,3}\[(label)\]: *(?:\n *)?<?([^\s>]+)>?(?:(?: +(?:\n *)?| *\n *)(title))? *(?:\n+|$)/,
  table: Xs,
  lheading: /^([^\n]+)\n {0,3}(=+|-+) *(?:\n+|$)/,
  _paragraph: /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/,
  text: /^[^\n]+/
};
D._label = /(?!\s*\])(?:\\.|[^\[\]\\])+/;
D._title = /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/;
D.def = lt(D.def).replace("label", D._label).replace("title", D._title).getRegex();
D.bullet = /(?:[*+-]|\d{1,9}[.)])/;
D.listItemStart = lt(/^( *)(bull) */).replace("bull", D.bullet).getRegex();
D.list = lt(D.list).replace(/bull/g, D.bullet).replace("hr", "\\n+(?=\\1?(?:(?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$))").replace("def", "\\n+(?=" + D.def.source + ")").getRegex();
D._tag = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul";
D._comment = /<!--(?!-?>)[\s\S]*?(?:-->|$)/;
D.html = lt(D.html, "i").replace("comment", D._comment).replace("tag", D._tag).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex();
D.paragraph = lt(D._paragraph).replace("hr", D.hr).replace("heading", " {0,3}#{1,6} ").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", D._tag).getRegex();
D.blockquote = lt(D.blockquote).replace("paragraph", D.paragraph).getRegex();
D.normal = pe({}, D);
D.gfm = pe({}, D.normal, {
  table: "^ *([^\\n ].*\\|.*)\\n {0,3}(?:\\| *)?(:?-+:? *(?:\\| *:?-+:? *)*)(?:\\| *)?(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)"
});
D.gfm.table = lt(D.gfm.table).replace("hr", D.hr).replace("heading", " {0,3}#{1,6} ").replace("blockquote", " {0,3}>").replace("code", " {4}[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", D._tag).getRegex();
D.gfm.paragraph = lt(D._paragraph).replace("hr", D.hr).replace("heading", " {0,3}#{1,6} ").replace("|lheading", "").replace("table", D.gfm.table).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", D._tag).getRegex();
D.pedantic = pe({}, D.normal, {
  html: lt(
    `^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`
  ).replace("comment", D._comment).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: Xs,
  paragraph: lt(D.normal._paragraph).replace("hr", D.hr).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", D.lheading).replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").getRegex()
});
const k = {
  escape: /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
  autolink: /^<(scheme:[^\s\x00-\x1f<>]*|email)>/,
  url: Xs,
  tag: "^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>",
  link: /^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/,
  reflink: /^!?\[(label)\]\[(ref)\]/,
  nolink: /^!?\[(ref)\](?:\[\])?/,
  reflinkSearch: "reflink|nolink(?!\\()",
  emStrong: {
    lDelim: /^(?:\*+(?:([punct_])|[^\s*]))|^_+(?:([punct*])|([^\s_]))/,
    rDelimAst: /^[^_*]*?\_\_[^_*]*?\*[^_*]*?(?=\_\_)|[^*]+(?=[^*])|[punct_](\*+)(?=[\s]|$)|[^punct*_\s](\*+)(?=[punct_\s]|$)|[punct_\s](\*+)(?=[^punct*_\s])|[\s](\*+)(?=[punct_])|[punct_](\*+)(?=[punct_])|[^punct*_\s](\*+)(?=[^punct*_\s])/,
    rDelimUnd: /^[^_*]*?\*\*[^_*]*?\_[^_*]*?(?=\*\*)|[^_]+(?=[^_])|[punct*](\_+)(?=[\s]|$)|[^punct*_\s](\_+)(?=[punct*\s]|$)|[punct*\s](\_+)(?=[^punct*_\s])|[\s](\_+)(?=[punct*])|[punct*](\_+)(?=[punct*])/
  },
  code: /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,
  br: /^( {2,}|\\)\n(?!\s*$)/,
  del: Xs,
  text: /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,
  punctuation: /^([\spunctuation])/
};
k._punctuation = "!\"#$%&'()+\\-.,/:;<=>?@\\[\\]`^{|}~";
k.punctuation = lt(k.punctuation).replace(/punctuation/g, k._punctuation).getRegex();
k.blockSkip = /\[[^\]]*?\]\([^\)]*?\)|`[^`]*?`|<[^>]*?>/g;
k.escapedEmSt = /\\\*|\\_/g;
k._comment = lt(D._comment).replace("(?:-->|$)", "-->").getRegex();
k.emStrong.lDelim = lt(k.emStrong.lDelim).replace(/punct/g, k._punctuation).getRegex();
k.emStrong.rDelimAst = lt(k.emStrong.rDelimAst, "g").replace(/punct/g, k._punctuation).getRegex();
k.emStrong.rDelimUnd = lt(k.emStrong.rDelimUnd, "g").replace(/punct/g, k._punctuation).getRegex();
k._escapes = /\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/g;
k._scheme = /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/;
k._email = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/;
k.autolink = lt(k.autolink).replace("scheme", k._scheme).replace("email", k._email).getRegex();
k._attribute = /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/;
k.tag = lt(k.tag).replace("comment", k._comment).replace("attribute", k._attribute).getRegex();
k._label = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/;
k._href = /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/;
k._title = /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/;
k.link = lt(k.link).replace("label", k._label).replace("href", k._href).replace("title", k._title).getRegex();
k.reflink = lt(k.reflink).replace("label", k._label).replace("ref", D._label).getRegex();
k.nolink = lt(k.nolink).replace("ref", D._label).getRegex();
k.reflinkSearch = lt(k.reflinkSearch, "g").replace("reflink", k.reflink).replace("nolink", k.nolink).getRegex();
k.normal = pe({}, k);
k.pedantic = pe({}, k.normal, {
  strong: {
    start: /^__|\*\*/,
    middle: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
    endAst: /\*\*(?!\*)/g,
    endUnd: /__(?!_)/g
  },
  em: {
    start: /^_|\*/,
    middle: /^()\*(?=\S)([\s\S]*?\S)\*(?!\*)|^_(?=\S)([\s\S]*?\S)_(?!_)/,
    endAst: /\*(?!\*)/g,
    endUnd: /_(?!_)/g
  },
  link: lt(/^!?\[(label)\]\((.*?)\)/).replace("label", k._label).getRegex(),
  reflink: lt(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", k._label).getRegex()
});
k.gfm = pe({}, k.normal, {
  escape: lt(k.escape).replace("])", "~|])").getRegex(),
  _extended_email: /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/,
  url: /^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/,
  _backpedal: /(?:[^?!.,:;*_~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
});
k.gfm.url = lt(k.gfm.url, "i").replace("email", k.gfm._extended_email).getRegex();
k.breaks = pe({}, k.gfm, {
  br: lt(k.br).replace("{2,}", "*").getRegex(),
  text: lt(k.gfm.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
});
function fC(n) {
  return n.replace(/---/g, "—").replace(/--/g, "–").replace(/(^|[-\u2014/(\[{"\s])'/g, "$1‘").replace(/'/g, "’").replace(/(^|[-\u2014/(\[{\u2018\s])"/g, "$1“").replace(/"/g, "”").replace(/\.{3}/g, "…");
}
function Qc(n) {
  let t = "", e, r;
  const s = n.length;
  for (e = 0; e < s; e++)
    r = n.charCodeAt(e), Math.random() > 0.5 && (r = "x" + r.toString(16)), t += "&#" + r + ";";
  return t;
}
class Pe {
  constructor(t) {
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = t || Qn, this.options.tokenizer = this.options.tokenizer || new b1(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
      inLink: !1,
      inRawBlock: !1,
      top: !0
    };
    const e = {
      block: D.normal,
      inline: k.normal
    };
    this.options.pedantic ? (e.block = D.pedantic, e.inline = k.pedantic) : this.options.gfm && (e.block = D.gfm, this.options.breaks ? e.inline = k.breaks : e.inline = k.gfm), this.tokenizer.rules = e;
  }
  static get rules() {
    return {
      block: D,
      inline: k
    };
  }
  static lex(t, e) {
    return new Pe(e).lex(t);
  }
  static lexInline(t, e) {
    return new Pe(e).inlineTokens(t);
  }
  lex(t) {
    t = t.replace(/\r\n|\r/g, `
`), this.blockTokens(t, this.tokens);
    let e;
    for (; e = this.inlineQueue.shift(); )
      this.inlineTokens(e.src, e.tokens);
    return this.tokens;
  }
  blockTokens(t, e = []) {
    this.options.pedantic ? t = t.replace(/\t/g, "    ").replace(/^ +$/gm, "") : t = t.replace(/^( *)(\t+)/gm, (a, l, c) => l + "    ".repeat(c.length));
    let r, s, i, o;
    for (; t; )
      if (!(this.options.extensions && this.options.extensions.block && this.options.extensions.block.some((a) => (r = a.call({ lexer: this }, t, e)) ? (t = t.substring(r.raw.length), e.push(r), !0) : !1))) {
        if (r = this.tokenizer.space(t)) {
          t = t.substring(r.raw.length), r.raw.length === 1 && e.length > 0 ? e[e.length - 1].raw += `
` : e.push(r);
          continue;
        }
        if (r = this.tokenizer.code(t)) {
          t = t.substring(r.raw.length), s = e[e.length - 1], s && (s.type === "paragraph" || s.type === "text") ? (s.raw += `
` + r.raw, s.text += `
` + r.text, this.inlineQueue[this.inlineQueue.length - 1].src = s.text) : e.push(r);
          continue;
        }
        if (r = this.tokenizer.fences(t)) {
          t = t.substring(r.raw.length), e.push(r);
          continue;
        }
        if (r = this.tokenizer.heading(t)) {
          t = t.substring(r.raw.length), e.push(r);
          continue;
        }
        if (r = this.tokenizer.hr(t)) {
          t = t.substring(r.raw.length), e.push(r);
          continue;
        }
        if (r = this.tokenizer.blockquote(t)) {
          t = t.substring(r.raw.length), e.push(r);
          continue;
        }
        if (r = this.tokenizer.list(t)) {
          t = t.substring(r.raw.length), e.push(r);
          continue;
        }
        if (r = this.tokenizer.html(t)) {
          t = t.substring(r.raw.length), e.push(r);
          continue;
        }
        if (r = this.tokenizer.def(t)) {
          t = t.substring(r.raw.length), s = e[e.length - 1], s && (s.type === "paragraph" || s.type === "text") ? (s.raw += `
` + r.raw, s.text += `
` + r.raw, this.inlineQueue[this.inlineQueue.length - 1].src = s.text) : this.tokens.links[r.tag] || (this.tokens.links[r.tag] = {
            href: r.href,
            title: r.title
          });
          continue;
        }
        if (r = this.tokenizer.table(t)) {
          t = t.substring(r.raw.length), e.push(r);
          continue;
        }
        if (r = this.tokenizer.lheading(t)) {
          t = t.substring(r.raw.length), e.push(r);
          continue;
        }
        if (i = t, this.options.extensions && this.options.extensions.startBlock) {
          let a = 1 / 0;
          const l = t.slice(1);
          let c;
          this.options.extensions.startBlock.forEach(function(u) {
            c = u.call({ lexer: this }, l), typeof c == "number" && c >= 0 && (a = Math.min(a, c));
          }), a < 1 / 0 && a >= 0 && (i = t.substring(0, a + 1));
        }
        if (this.state.top && (r = this.tokenizer.paragraph(i))) {
          s = e[e.length - 1], o && s.type === "paragraph" ? (s.raw += `
` + r.raw, s.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue[this.inlineQueue.length - 1].src = s.text) : e.push(r), o = i.length !== t.length, t = t.substring(r.raw.length);
          continue;
        }
        if (r = this.tokenizer.text(t)) {
          t = t.substring(r.raw.length), s = e[e.length - 1], s && s.type === "text" ? (s.raw += `
` + r.raw, s.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue[this.inlineQueue.length - 1].src = s.text) : e.push(r);
          continue;
        }
        if (t) {
          const a = "Infinite loop on byte: " + t.charCodeAt(0);
          if (this.options.silent) {
            console.error(a);
            break;
          } else
            throw new Error(a);
        }
      }
    return this.state.top = !0, e;
  }
  inline(t, e = []) {
    return this.inlineQueue.push({ src: t, tokens: e }), e;
  }
  inlineTokens(t, e = []) {
    let r, s, i, o = t, a, l, c;
    if (this.tokens.links) {
      const u = Object.keys(this.tokens.links);
      if (u.length > 0)
        for (; (a = this.tokenizer.rules.inline.reflinkSearch.exec(o)) != null; )
          u.includes(a[0].slice(a[0].lastIndexOf("[") + 1, -1)) && (o = o.slice(0, a.index) + "[" + Yc("a", a[0].length - 2) + "]" + o.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (a = this.tokenizer.rules.inline.blockSkip.exec(o)) != null; )
      o = o.slice(0, a.index) + "[" + Yc("a", a[0].length - 2) + "]" + o.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    for (; (a = this.tokenizer.rules.inline.escapedEmSt.exec(o)) != null; )
      o = o.slice(0, a.index) + "++" + o.slice(this.tokenizer.rules.inline.escapedEmSt.lastIndex);
    for (; t; )
      if (l || (c = ""), l = !1, !(this.options.extensions && this.options.extensions.inline && this.options.extensions.inline.some((u) => (r = u.call({ lexer: this }, t, e)) ? (t = t.substring(r.raw.length), e.push(r), !0) : !1))) {
        if (r = this.tokenizer.escape(t)) {
          t = t.substring(r.raw.length), e.push(r);
          continue;
        }
        if (r = this.tokenizer.tag(t)) {
          t = t.substring(r.raw.length), s = e[e.length - 1], s && r.type === "text" && s.type === "text" ? (s.raw += r.raw, s.text += r.text) : e.push(r);
          continue;
        }
        if (r = this.tokenizer.link(t)) {
          t = t.substring(r.raw.length), e.push(r);
          continue;
        }
        if (r = this.tokenizer.reflink(t, this.tokens.links)) {
          t = t.substring(r.raw.length), s = e[e.length - 1], s && r.type === "text" && s.type === "text" ? (s.raw += r.raw, s.text += r.text) : e.push(r);
          continue;
        }
        if (r = this.tokenizer.emStrong(t, o, c)) {
          t = t.substring(r.raw.length), e.push(r);
          continue;
        }
        if (r = this.tokenizer.codespan(t)) {
          t = t.substring(r.raw.length), e.push(r);
          continue;
        }
        if (r = this.tokenizer.br(t)) {
          t = t.substring(r.raw.length), e.push(r);
          continue;
        }
        if (r = this.tokenizer.del(t)) {
          t = t.substring(r.raw.length), e.push(r);
          continue;
        }
        if (r = this.tokenizer.autolink(t, Qc)) {
          t = t.substring(r.raw.length), e.push(r);
          continue;
        }
        if (!this.state.inLink && (r = this.tokenizer.url(t, Qc))) {
          t = t.substring(r.raw.length), e.push(r);
          continue;
        }
        if (i = t, this.options.extensions && this.options.extensions.startInline) {
          let u = 1 / 0;
          const f = t.slice(1);
          let d;
          this.options.extensions.startInline.forEach(function(p) {
            d = p.call({ lexer: this }, f), typeof d == "number" && d >= 0 && (u = Math.min(u, d));
          }), u < 1 / 0 && u >= 0 && (i = t.substring(0, u + 1));
        }
        if (r = this.tokenizer.inlineText(i, fC)) {
          t = t.substring(r.raw.length), r.raw.slice(-1) !== "_" && (c = r.raw.slice(-1)), l = !0, s = e[e.length - 1], s && s.type === "text" ? (s.raw += r.raw, s.text += r.text) : e.push(r);
          continue;
        }
        if (t) {
          const u = "Infinite loop on byte: " + t.charCodeAt(0);
          if (this.options.silent) {
            console.error(u);
            break;
          } else
            throw new Error(u);
        }
      }
    return e;
  }
}
class w1 {
  constructor(t) {
    this.options = t || Qn;
  }
  code(t, e, r) {
    const s = (e || "").match(/\S*/)[0];
    if (this.options.highlight) {
      const i = this.options.highlight(t, s);
      i != null && i !== t && (r = !0, t = i);
    }
    return t = t.replace(/\n$/, "") + `
`, s ? '<pre><code class="' + this.options.langPrefix + Tt(s, !0) + '">' + (r ? t : Tt(t, !0)) + `</code></pre>
` : "<pre><code>" + (r ? t : Tt(t, !0)) + `</code></pre>
`;
  }
  blockquote(t) {
    return `<blockquote>
${t}</blockquote>
`;
  }
  html(t) {
    return t;
  }
  heading(t, e, r, s) {
    if (this.options.headerIds) {
      const i = this.options.headerPrefix + s.slug(r);
      return `<h${e} id="${i}">${t}</h${e}>
`;
    }
    return `<h${e}>${t}</h${e}>
`;
  }
  hr() {
    return this.options.xhtml ? `<hr/>
` : `<hr>
`;
  }
  list(t, e, r) {
    const s = e ? "ol" : "ul", i = e && r !== 1 ? ' start="' + r + '"' : "";
    return "<" + s + i + `>
` + t + "</" + s + `>
`;
  }
  listitem(t) {
    return `<li>${t}</li>
`;
  }
  checkbox(t) {
    return "<input " + (t ? 'checked="" ' : "") + 'disabled="" type="checkbox"' + (this.options.xhtml ? " /" : "") + "> ";
  }
  paragraph(t) {
    return `<p>${t}</p>
`;
  }
  table(t, e) {
    return e && (e = `<tbody>${e}</tbody>`), `<table>
<thead>
` + t + `</thead>
` + e + `</table>
`;
  }
  tablerow(t) {
    return `<tr>
${t}</tr>
`;
  }
  tablecell(t, e) {
    const r = e.header ? "th" : "td";
    return (e.align ? `<${r} align="${e.align}">` : `<${r}>`) + t + `</${r}>
`;
  }
  strong(t) {
    return `<strong>${t}</strong>`;
  }
  em(t) {
    return `<em>${t}</em>`;
  }
  codespan(t) {
    return `<code>${t}</code>`;
  }
  br() {
    return this.options.xhtml ? "<br/>" : "<br>";
  }
  del(t) {
    return `<del>${t}</del>`;
  }
  link(t, e, r) {
    if (t = qc(this.options.sanitize, this.options.baseUrl, t), t === null)
      return r;
    let s = '<a href="' + Tt(t) + '"';
    return e && (s += ' title="' + e + '"'), s += ">" + r + "</a>", s;
  }
  image(t, e, r) {
    if (t = qc(this.options.sanitize, this.options.baseUrl, t), t === null)
      return r;
    let s = `<img src="${t}" alt="${r}"`;
    return e && (s += ` title="${e}"`), s += this.options.xhtml ? "/>" : ">", s;
  }
  text(t) {
    return t;
  }
}
class L2 {
  strong(t) {
    return t;
  }
  em(t) {
    return t;
  }
  codespan(t) {
    return t;
  }
  del(t) {
    return t;
  }
  html(t) {
    return t;
  }
  text(t) {
    return t;
  }
  link(t, e, r) {
    return "" + r;
  }
  image(t, e, r) {
    return "" + r;
  }
  br() {
    return "";
  }
}
class v2 {
  constructor() {
    this.seen = {};
  }
  serialize(t) {
    return t.toLowerCase().trim().replace(/<[!\/a-z].*?>/ig, "").replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g, "").replace(/\s/g, "-");
  }
  getNextSafeSlug(t, e) {
    let r = t, s = 0;
    if (this.seen.hasOwnProperty(r)) {
      s = this.seen[t];
      do
        s++, r = t + "-" + s;
      while (this.seen.hasOwnProperty(r));
    }
    return e || (this.seen[t] = s, this.seen[r] = 0), r;
  }
  slug(t, e = {}) {
    const r = this.serialize(t);
    return this.getNextSafeSlug(r, e.dryrun);
  }
}
class Ee {
  constructor(t) {
    this.options = t || Qn, this.options.renderer = this.options.renderer || new w1(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.textRenderer = new L2(), this.slugger = new v2();
  }
  static parse(t, e) {
    return new Ee(e).parse(t);
  }
  static parseInline(t, e) {
    return new Ee(e).parseInline(t);
  }
  parse(t, e = !0) {
    let r = "", s, i, o, a, l, c, u, f, d, p, w, I, W, $, j, it, Y, ft, rt;
    const dt = t.length;
    for (s = 0; s < dt; s++) {
      if (p = t[s], this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[p.type] && (rt = this.options.extensions.renderers[p.type].call({ parser: this }, p), rt !== !1 || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "paragraph", "text"].includes(p.type))) {
        r += rt || "";
        continue;
      }
      switch (p.type) {
        case "space":
          continue;
        case "hr": {
          r += this.renderer.hr();
          continue;
        }
        case "heading": {
          r += this.renderer.heading(
            this.parseInline(p.tokens),
            p.depth,
            m2(this.parseInline(p.tokens, this.textRenderer)),
            this.slugger
          );
          continue;
        }
        case "code": {
          r += this.renderer.code(
            p.text,
            p.lang,
            p.escaped
          );
          continue;
        }
        case "table": {
          for (f = "", u = "", a = p.header.length, i = 0; i < a; i++)
            u += this.renderer.tablecell(
              this.parseInline(p.header[i].tokens),
              { header: !0, align: p.align[i] }
            );
          for (f += this.renderer.tablerow(u), d = "", a = p.rows.length, i = 0; i < a; i++) {
            for (c = p.rows[i], u = "", l = c.length, o = 0; o < l; o++)
              u += this.renderer.tablecell(
                this.parseInline(c[o].tokens),
                { header: !1, align: p.align[o] }
              );
            d += this.renderer.tablerow(u);
          }
          r += this.renderer.table(f, d);
          continue;
        }
        case "blockquote": {
          d = this.parse(p.tokens), r += this.renderer.blockquote(d);
          continue;
        }
        case "list": {
          for (w = p.ordered, I = p.start, W = p.loose, a = p.items.length, d = "", i = 0; i < a; i++)
            j = p.items[i], it = j.checked, Y = j.task, $ = "", j.task && (ft = this.renderer.checkbox(it), W ? j.tokens.length > 0 && j.tokens[0].type === "paragraph" ? (j.tokens[0].text = ft + " " + j.tokens[0].text, j.tokens[0].tokens && j.tokens[0].tokens.length > 0 && j.tokens[0].tokens[0].type === "text" && (j.tokens[0].tokens[0].text = ft + " " + j.tokens[0].tokens[0].text)) : j.tokens.unshift({
              type: "text",
              text: ft
            }) : $ += ft), $ += this.parse(j.tokens, W), d += this.renderer.listitem($, Y, it);
          r += this.renderer.list(d, w, I);
          continue;
        }
        case "html": {
          r += this.renderer.html(p.text);
          continue;
        }
        case "paragraph": {
          r += this.renderer.paragraph(this.parseInline(p.tokens));
          continue;
        }
        case "text": {
          for (d = p.tokens ? this.parseInline(p.tokens) : p.text; s + 1 < dt && t[s + 1].type === "text"; )
            p = t[++s], d += `
` + (p.tokens ? this.parseInline(p.tokens) : p.text);
          r += e ? this.renderer.paragraph(d) : d;
          continue;
        }
        default: {
          const It = 'Token with "' + p.type + '" type was not found.';
          if (this.options.silent) {
            console.error(It);
            return;
          } else
            throw new Error(It);
        }
      }
    }
    return r;
  }
  parseInline(t, e) {
    e = e || this.renderer;
    let r = "", s, i, o;
    const a = t.length;
    for (s = 0; s < a; s++) {
      if (i = t[s], this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[i.type] && (o = this.options.extensions.renderers[i.type].call({ parser: this }, i), o !== !1 || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(i.type))) {
        r += o || "";
        continue;
      }
      switch (i.type) {
        case "escape": {
          r += e.text(i.text);
          break;
        }
        case "html": {
          r += e.html(i.text);
          break;
        }
        case "link": {
          r += e.link(i.href, i.title, this.parseInline(i.tokens, e));
          break;
        }
        case "image": {
          r += e.image(i.href, i.title, i.text);
          break;
        }
        case "strong": {
          r += e.strong(this.parseInline(i.tokens, e));
          break;
        }
        case "em": {
          r += e.em(this.parseInline(i.tokens, e));
          break;
        }
        case "codespan": {
          r += e.codespan(i.text);
          break;
        }
        case "br": {
          r += e.br();
          break;
        }
        case "del": {
          r += e.del(this.parseInline(i.tokens, e));
          break;
        }
        case "text": {
          r += e.text(i.text);
          break;
        }
        default: {
          const l = 'Token with "' + i.type + '" type was not found.';
          if (this.options.silent) {
            console.error(l);
            return;
          } else
            throw new Error(l);
        }
      }
    }
    return r;
  }
}
function F(n, t, e) {
  if (typeof n > "u" || n === null)
    throw new Error("marked(): input parameter is undefined or null");
  if (typeof n != "string")
    throw new Error("marked(): input parameter is of type " + Object.prototype.toString.call(n) + ", string expected");
  if (typeof t == "function" && (e = t, t = null), t = pe({}, F.defaults, t || {}), _2(t), e) {
    const s = t.highlight;
    let i;
    try {
      i = Pe.lex(n, t);
    } catch (l) {
      return e(l);
    }
    const o = function(l) {
      let c;
      if (!l)
        try {
          t.walkTokens && F.walkTokens(i, t.walkTokens), c = Ee.parse(i, t);
        } catch (u) {
          l = u;
        }
      return t.highlight = s, l ? e(l) : e(null, c);
    };
    if (!s || s.length < 3 || (delete t.highlight, !i.length))
      return o();
    let a = 0;
    F.walkTokens(i, function(l) {
      l.type === "code" && (a++, setTimeout(() => {
        s(l.text, l.lang, function(c, u) {
          if (c)
            return o(c);
          u != null && u !== l.text && (l.text = u, l.escaped = !0), a--, a === 0 && o();
        });
      }, 0));
    }), a === 0 && o();
    return;
  }
  function r(s) {
    if (s.message += `
Please report this to https://github.com/markedjs/marked.`, t.silent)
      return "<p>An error occurred:</p><pre>" + Tt(s.message + "", !0) + "</pre>";
    throw s;
  }
  try {
    const s = Pe.lex(n, t);
    if (t.walkTokens) {
      if (t.async)
        return Promise.all(F.walkTokens(s, t.walkTokens)).then(() => Ee.parse(s, t)).catch(r);
      F.walkTokens(s, t.walkTokens);
    }
    return Ee.parse(s, t);
  } catch (s) {
    r(s);
  }
}
F.options = F.setOptions = function(n) {
  return pe(F.defaults, n), Yy(F.defaults), F;
};
F.getDefaults = x2;
F.defaults = Qn;
F.use = function(...n) {
  const t = pe({}, ...n), e = F.defaults.extensions || { renderers: {}, childTokens: {} };
  let r;
  n.forEach((s) => {
    if (s.extensions && (r = !0, s.extensions.forEach((i) => {
      if (!i.name)
        throw new Error("extension name required");
      if (i.renderer) {
        const o = e.renderers ? e.renderers[i.name] : null;
        o ? e.renderers[i.name] = function(...a) {
          let l = i.renderer.apply(this, a);
          return l === !1 && (l = o.apply(this, a)), l;
        } : e.renderers[i.name] = i.renderer;
      }
      if (i.tokenizer) {
        if (!i.level || i.level !== "block" && i.level !== "inline")
          throw new Error("extension level must be 'block' or 'inline'");
        e[i.level] ? e[i.level].unshift(i.tokenizer) : e[i.level] = [i.tokenizer], i.start && (i.level === "block" ? e.startBlock ? e.startBlock.push(i.start) : e.startBlock = [i.start] : i.level === "inline" && (e.startInline ? e.startInline.push(i.start) : e.startInline = [i.start]));
      }
      i.childTokens && (e.childTokens[i.name] = i.childTokens);
    })), s.renderer) {
      const i = F.defaults.renderer || new w1();
      for (const o in s.renderer) {
        const a = i[o];
        i[o] = (...l) => {
          let c = s.renderer[o].apply(i, l);
          return c === !1 && (c = a.apply(i, l)), c;
        };
      }
      t.renderer = i;
    }
    if (s.tokenizer) {
      const i = F.defaults.tokenizer || new b1();
      for (const o in s.tokenizer) {
        const a = i[o];
        i[o] = (...l) => {
          let c = s.tokenizer[o].apply(i, l);
          return c === !1 && (c = a.apply(i, l)), c;
        };
      }
      t.tokenizer = i;
    }
    if (s.walkTokens) {
      const i = F.defaults.walkTokens;
      t.walkTokens = function(o) {
        let a = [];
        return a.push(s.walkTokens.call(this, o)), i && (a = a.concat(i.call(this, o))), a;
      };
    }
    r && (t.extensions = e), F.setOptions(t);
  });
};
F.walkTokens = function(n, t) {
  let e = [];
  for (const r of n)
    switch (e = e.concat(t.call(F, r)), r.type) {
      case "table": {
        for (const s of r.header)
          e = e.concat(F.walkTokens(s.tokens, t));
        for (const s of r.rows)
          for (const i of s)
            e = e.concat(F.walkTokens(i.tokens, t));
        break;
      }
      case "list": {
        e = e.concat(F.walkTokens(r.items, t));
        break;
      }
      default:
        F.defaults.extensions && F.defaults.extensions.childTokens && F.defaults.extensions.childTokens[r.type] ? F.defaults.extensions.childTokens[r.type].forEach(function(s) {
          e = e.concat(F.walkTokens(r[s], t));
        }) : r.tokens && (e = e.concat(F.walkTokens(r.tokens, t)));
    }
  return e;
};
F.parseInline = function(n, t) {
  if (typeof n > "u" || n === null)
    throw new Error("marked.parseInline(): input parameter is undefined or null");
  if (typeof n != "string")
    throw new Error("marked.parseInline(): input parameter is of type " + Object.prototype.toString.call(n) + ", string expected");
  t = pe({}, F.defaults, t || {}), _2(t);
  try {
    const e = Pe.lexInline(n, t);
    return t.walkTokens && F.walkTokens(e, t.walkTokens), Ee.parseInline(e, t);
  } catch (e) {
    if (e.message += `
Please report this to https://github.com/markedjs/marked.`, t.silent)
      return "<p>An error occurred:</p><pre>" + Tt(e.message + "", !0) + "</pre>";
    throw e;
  }
};
F.Parser = Ee;
F.parser = Ee.parse;
F.Renderer = w1;
F.TextRenderer = L2;
F.Lexer = Pe;
F.lexer = Pe.lex;
F.Tokenizer = b1;
F.Slugger = v2;
F.parse = F;
F.options;
F.setOptions;
F.use;
F.walkTokens;
F.parseInline;
Ee.parse;
Pe.lex;
function T1(n) {
  return n instanceof Map ? n.clear = n.delete = n.set = function() {
    throw new Error("map is read-only");
  } : n instanceof Set && (n.add = n.clear = n.delete = function() {
    throw new Error("set is read-only");
  }), Object.freeze(n), Object.getOwnPropertyNames(n).forEach(function(t) {
    var e = n[t];
    typeof e == "object" && !Object.isFrozen(e) && T1(e);
  }), n;
}
var y2 = T1, dC = T1;
y2.default = dC;
class Jc {
  constructor(t) {
    t.data === void 0 && (t.data = {}), this.data = t.data, this.isMatchIgnored = !1;
  }
  ignoreMatch() {
    this.isMatchIgnored = !0;
  }
}
function Pn(n) {
  return n.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}
function He(n, ...t) {
  const e = /* @__PURE__ */ Object.create(null);
  for (const r in n)
    e[r] = n[r];
  return t.forEach(function(r) {
    for (const s in r)
      e[s] = r[s];
  }), e;
}
const pC = "</span>", t0 = (n) => !!n.kind;
class gC {
  constructor(t, e) {
    this.buffer = "", this.classPrefix = e.classPrefix, t.walk(this);
  }
  addText(t) {
    this.buffer += Pn(t);
  }
  openNode(t) {
    if (!t0(t))
      return;
    let e = t.kind;
    t.sublanguage || (e = `${this.classPrefix}${e}`), this.span(e);
  }
  closeNode(t) {
    t0(t) && (this.buffer += pC);
  }
  value() {
    return this.buffer;
  }
  span(t) {
    this.buffer += `<span class="${t}">`;
  }
}
class A1 {
  constructor() {
    this.rootNode = { children: [] }, this.stack = [this.rootNode];
  }
  get top() {
    return this.stack[this.stack.length - 1];
  }
  get root() {
    return this.rootNode;
  }
  add(t) {
    this.top.children.push(t);
  }
  openNode(t) {
    const e = { kind: t, children: [] };
    this.add(e), this.stack.push(e);
  }
  closeNode() {
    if (this.stack.length > 1)
      return this.stack.pop();
  }
  closeAllNodes() {
    for (; this.closeNode(); )
      ;
  }
  toJSON() {
    return JSON.stringify(this.rootNode, null, 4);
  }
  walk(t) {
    return this.constructor._walk(t, this.rootNode);
  }
  static _walk(t, e) {
    return typeof e == "string" ? t.addText(e) : e.children && (t.openNode(e), e.children.forEach((r) => this._walk(t, r)), t.closeNode(e)), t;
  }
  static _collapse(t) {
    typeof t != "string" && t.children && (t.children.every((e) => typeof e == "string") ? t.children = [t.children.join("")] : t.children.forEach((e) => {
      A1._collapse(e);
    }));
  }
}
class xC extends A1 {
  constructor(t) {
    super(), this.options = t;
  }
  addKeyword(t, e) {
    t !== "" && (this.openNode(e), this.addText(t), this.closeNode());
  }
  addText(t) {
    t !== "" && this.add(t);
  }
  addSublanguage(t, e) {
    const r = t.root;
    r.kind = e, r.sublanguage = !0, this.add(r);
  }
  toHTML() {
    return new gC(this, this.options).value();
  }
  finalize() {
    return !0;
  }
}
function mC(n) {
  return new RegExp(n.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "m");
}
function Sr(n) {
  return n ? typeof n == "string" ? n : n.source : null;
}
function _C(...n) {
  return n.map((e) => Sr(e)).join("");
}
function LC(...n) {
  return "(" + n.map((e) => Sr(e)).join("|") + ")";
}
function vC(n) {
  return new RegExp(n.toString() + "|").exec("").length - 1;
}
function yC(n, t) {
  const e = n && n.exec(t);
  return e && e.index === 0;
}
const CC = /\[(?:[^\\\]]|\\.)*\]|\(\??|\\([1-9][0-9]*)|\\./;
function EC(n, t = "|") {
  let e = 0;
  return n.map((r) => {
    e += 1;
    const s = e;
    let i = Sr(r), o = "";
    for (; i.length > 0; ) {
      const a = CC.exec(i);
      if (!a) {
        o += i;
        break;
      }
      o += i.substring(0, a.index), i = i.substring(a.index + a[0].length), a[0][0] === "\\" && a[1] ? o += "\\" + String(Number(a[1]) + s) : (o += a[0], a[0] === "(" && e++);
    }
    return o;
  }).map((r) => `(${r})`).join(t);
}
const bC = /\b\B/, C2 = "[a-zA-Z]\\w*", S1 = "[a-zA-Z_]\\w*", R1 = "\\b\\d+(\\.\\d+)?", E2 = "(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)", b2 = "\\b(0b[01]+)", wC = "!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~", TC = (n = {}) => {
  const t = /^#![ ]*\//;
  return n.binary && (n.begin = _C(
    t,
    /.*\b/,
    n.binary,
    /\b.*/
  )), He({
    className: "meta",
    begin: t,
    end: /$/,
    relevance: 0,
    "on:begin": (e, r) => {
      e.index !== 0 && r.ignoreMatch();
    }
  }, n);
}, Rr = {
  begin: "\\\\[\\s\\S]",
  relevance: 0
}, AC = {
  className: "string",
  begin: "'",
  end: "'",
  illegal: "\\n",
  contains: [Rr]
}, SC = {
  className: "string",
  begin: '"',
  end: '"',
  illegal: "\\n",
  contains: [Rr]
}, w2 = {
  begin: /\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/
}, ki = function(n, t, e = {}) {
  const r = He(
    {
      className: "comment",
      begin: n,
      end: t,
      contains: []
    },
    e
  );
  return r.contains.push(w2), r.contains.push({
    className: "doctag",
    begin: "(?:TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):",
    relevance: 0
  }), r;
}, RC = ki("//", "$"), kC = ki("/\\*", "\\*/"), OC = ki("#", "$"), NC = {
  className: "number",
  begin: R1,
  relevance: 0
}, IC = {
  className: "number",
  begin: E2,
  relevance: 0
}, MC = {
  className: "number",
  begin: b2,
  relevance: 0
}, PC = {
  className: "number",
  begin: R1 + "(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?",
  relevance: 0
}, $C = {
  begin: /(?=\/[^/\n]*\/)/,
  contains: [{
    className: "regexp",
    begin: /\//,
    end: /\/[gimuy]*/,
    illegal: /\n/,
    contains: [
      Rr,
      {
        begin: /\[/,
        end: /\]/,
        relevance: 0,
        contains: [Rr]
      }
    ]
  }]
}, DC = {
  className: "title",
  begin: C2,
  relevance: 0
}, FC = {
  className: "title",
  begin: S1,
  relevance: 0
}, BC = {
  begin: "\\.\\s*" + S1,
  relevance: 0
}, UC = function(n) {
  return Object.assign(
    n,
    {
      "on:begin": (t, e) => {
        e.data._beginMatch = t[1];
      },
      "on:end": (t, e) => {
        e.data._beginMatch !== t[1] && e.ignoreMatch();
      }
    }
  );
};
var ms = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  MATCH_NOTHING_RE: bC,
  IDENT_RE: C2,
  UNDERSCORE_IDENT_RE: S1,
  NUMBER_RE: R1,
  C_NUMBER_RE: E2,
  BINARY_NUMBER_RE: b2,
  RE_STARTERS_RE: wC,
  SHEBANG: TC,
  BACKSLASH_ESCAPE: Rr,
  APOS_STRING_MODE: AC,
  QUOTE_STRING_MODE: SC,
  PHRASAL_WORDS_MODE: w2,
  COMMENT: ki,
  C_LINE_COMMENT_MODE: RC,
  C_BLOCK_COMMENT_MODE: kC,
  HASH_COMMENT_MODE: OC,
  NUMBER_MODE: NC,
  C_NUMBER_MODE: IC,
  BINARY_NUMBER_MODE: MC,
  CSS_NUMBER_MODE: PC,
  REGEXP_MODE: $C,
  TITLE_MODE: DC,
  UNDERSCORE_TITLE_MODE: FC,
  METHOD_GUARD: BC,
  END_SAME_AS_BEGIN: UC
});
function HC(n, t) {
  n.input[n.index - 1] === "." && t.ignoreMatch();
}
function GC(n, t) {
  t && n.beginKeywords && (n.begin = "\\b(" + n.beginKeywords.split(" ").join("|") + ")(?!\\.)(?=\\b|\\s)", n.__beforeBegin = HC, n.keywords = n.keywords || n.beginKeywords, delete n.beginKeywords, n.relevance === void 0 && (n.relevance = 0));
}
function jC(n, t) {
  Array.isArray(n.illegal) && (n.illegal = LC(...n.illegal));
}
function VC(n, t) {
  if (n.match) {
    if (n.begin || n.end)
      throw new Error("begin & end are not supported with match");
    n.begin = n.match, delete n.match;
  }
}
function zC(n, t) {
  n.relevance === void 0 && (n.relevance = 1);
}
const ZC = [
  "of",
  "and",
  "for",
  "in",
  "not",
  "or",
  "if",
  "then",
  "parent",
  "list",
  "value"
], WC = "keyword";
function T2(n, t, e = WC) {
  const r = {};
  return typeof n == "string" ? s(e, n.split(" ")) : Array.isArray(n) ? s(e, n) : Object.keys(n).forEach(function(i) {
    Object.assign(
      r,
      T2(n[i], t, i)
    );
  }), r;
  function s(i, o) {
    t && (o = o.map((a) => a.toLowerCase())), o.forEach(function(a) {
      const l = a.split("|");
      r[l[0]] = [i, qC(l[0], l[1])];
    });
  }
}
function qC(n, t) {
  return t ? Number(t) : KC(n) ? 0 : 1;
}
function KC(n) {
  return ZC.includes(n.toLowerCase());
}
function YC(n, { plugins: t }) {
  function e(a, l) {
    return new RegExp(
      Sr(a),
      "m" + (n.case_insensitive ? "i" : "") + (l ? "g" : "")
    );
  }
  class r {
    constructor() {
      this.matchIndexes = {}, this.regexes = [], this.matchAt = 1, this.position = 0;
    }
    addRule(l, c) {
      c.position = this.position++, this.matchIndexes[this.matchAt] = c, this.regexes.push([c, l]), this.matchAt += vC(l) + 1;
    }
    compile() {
      this.regexes.length === 0 && (this.exec = () => null);
      const l = this.regexes.map((c) => c[1]);
      this.matcherRe = e(EC(l), !0), this.lastIndex = 0;
    }
    exec(l) {
      this.matcherRe.lastIndex = this.lastIndex;
      const c = this.matcherRe.exec(l);
      if (!c)
        return null;
      const u = c.findIndex((d, p) => p > 0 && d !== void 0), f = this.matchIndexes[u];
      return c.splice(0, u), Object.assign(c, f);
    }
  }
  class s {
    constructor() {
      this.rules = [], this.multiRegexes = [], this.count = 0, this.lastIndex = 0, this.regexIndex = 0;
    }
    getMatcher(l) {
      if (this.multiRegexes[l])
        return this.multiRegexes[l];
      const c = new r();
      return this.rules.slice(l).forEach(([u, f]) => c.addRule(u, f)), c.compile(), this.multiRegexes[l] = c, c;
    }
    resumingScanAtSamePosition() {
      return this.regexIndex !== 0;
    }
    considerAll() {
      this.regexIndex = 0;
    }
    addRule(l, c) {
      this.rules.push([l, c]), c.type === "begin" && this.count++;
    }
    exec(l) {
      const c = this.getMatcher(this.regexIndex);
      c.lastIndex = this.lastIndex;
      let u = c.exec(l);
      if (this.resumingScanAtSamePosition() && !(u && u.index === this.lastIndex)) {
        const f = this.getMatcher(0);
        f.lastIndex = this.lastIndex + 1, u = f.exec(l);
      }
      return u && (this.regexIndex += u.position + 1, this.regexIndex === this.count && this.considerAll()), u;
    }
  }
  function i(a) {
    const l = new s();
    return a.contains.forEach((c) => l.addRule(c.begin, { rule: c, type: "begin" })), a.terminatorEnd && l.addRule(a.terminatorEnd, { type: "end" }), a.illegal && l.addRule(a.illegal, { type: "illegal" }), l;
  }
  function o(a, l) {
    const c = a;
    if (a.isCompiled)
      return c;
    [
      VC
    ].forEach((f) => f(a, l)), n.compilerExtensions.forEach((f) => f(a, l)), a.__beforeBegin = null, [
      GC,
      jC,
      zC
    ].forEach((f) => f(a, l)), a.isCompiled = !0;
    let u = null;
    if (typeof a.keywords == "object" && (u = a.keywords.$pattern, delete a.keywords.$pattern), a.keywords && (a.keywords = T2(a.keywords, n.case_insensitive)), a.lexemes && u)
      throw new Error("ERR: Prefer `keywords.$pattern` to `mode.lexemes`, BOTH are not allowed. (see mode reference) ");
    return u = u || a.lexemes || /\w+/, c.keywordPatternRe = e(u, !0), l && (a.begin || (a.begin = /\B|\b/), c.beginRe = e(a.begin), a.endSameAsBegin && (a.end = a.begin), !a.end && !a.endsWithParent && (a.end = /\B|\b/), a.end && (c.endRe = e(a.end)), c.terminatorEnd = Sr(a.end) || "", a.endsWithParent && l.terminatorEnd && (c.terminatorEnd += (a.end ? "|" : "") + l.terminatorEnd)), a.illegal && (c.illegalRe = e(a.illegal)), a.contains || (a.contains = []), a.contains = [].concat(...a.contains.map(function(f) {
      return XC(f === "self" ? a : f);
    })), a.contains.forEach(function(f) {
      o(f, c);
    }), a.starts && o(a.starts, l), c.matcher = i(c), c;
  }
  if (n.compilerExtensions || (n.compilerExtensions = []), n.contains && n.contains.includes("self"))
    throw new Error("ERR: contains `self` is not supported at the top-level of a language.  See documentation.");
  return n.classNameAliases = He(n.classNameAliases || {}), o(n);
}
function A2(n) {
  return n ? n.endsWithParent || A2(n.starts) : !1;
}
function XC(n) {
  return n.variants && !n.cachedVariants && (n.cachedVariants = n.variants.map(function(t) {
    return He(n, { variants: null }, t);
  })), n.cachedVariants ? n.cachedVariants : A2(n) ? He(n, { starts: n.starts ? He(n.starts) : null }) : Object.isFrozen(n) ? He(n) : n;
}
var QC = "10.7.3";
function JC(n) {
  return Boolean(n || n === "");
}
function tE(n) {
  const t = {
    props: ["language", "code", "autodetect"],
    data: function() {
      return {
        detectedLanguage: "",
        unknownLanguage: !1
      };
    },
    computed: {
      className() {
        return this.unknownLanguage ? "" : "hljs " + this.detectedLanguage;
      },
      highlighted() {
        if (!this.autoDetect && !n.getLanguage(this.language))
          return console.warn(`The language "${this.language}" you specified could not be found.`), this.unknownLanguage = !0, Pn(this.code);
        let r = {};
        return this.autoDetect ? (r = n.highlightAuto(this.code), this.detectedLanguage = r.language) : (r = n.highlight(this.language, this.code, this.ignoreIllegals), this.detectedLanguage = this.language), r.value;
      },
      autoDetect() {
        return !this.language || JC(this.autodetect);
      },
      ignoreIllegals() {
        return !0;
      }
    },
    render(r) {
      return r("pre", {}, [
        r("code", {
          class: this.className,
          domProps: { innerHTML: this.highlighted }
        })
      ]);
    }
  };
  return { Component: t, VuePlugin: {
    install(r) {
      r.component("highlightjs", t);
    }
  } };
}
const eE = {
  "after:highlightElement": ({ el: n, result: t, text: e }) => {
    const r = e0(n);
    if (!r.length)
      return;
    const s = document.createElement("div");
    s.innerHTML = t.value, t.value = nE(r, e0(s), e);
  }
};
function Go(n) {
  return n.nodeName.toLowerCase();
}
function e0(n) {
  const t = [];
  return function e(r, s) {
    for (let i = r.firstChild; i; i = i.nextSibling)
      i.nodeType === 3 ? s += i.nodeValue.length : i.nodeType === 1 && (t.push({
        event: "start",
        offset: s,
        node: i
      }), s = e(i, s), Go(i).match(/br|hr|img|input/) || t.push({
        event: "stop",
        offset: s,
        node: i
      }));
    return s;
  }(n, 0), t;
}
function nE(n, t, e) {
  let r = 0, s = "";
  const i = [];
  function o() {
    return !n.length || !t.length ? n.length ? n : t : n[0].offset !== t[0].offset ? n[0].offset < t[0].offset ? n : t : t[0].event === "start" ? n : t;
  }
  function a(u) {
    function f(d) {
      return " " + d.nodeName + '="' + Pn(d.value) + '"';
    }
    s += "<" + Go(u) + [].map.call(u.attributes, f).join("") + ">";
  }
  function l(u) {
    s += "</" + Go(u) + ">";
  }
  function c(u) {
    (u.event === "start" ? a : l)(u.node);
  }
  for (; n.length || t.length; ) {
    let u = o();
    if (s += Pn(e.substring(r, u[0].offset)), r = u[0].offset, u === n) {
      i.reverse().forEach(l);
      do
        c(u.splice(0, 1)[0]), u = o();
      while (u === n && u.length && u[0].offset === r);
      i.reverse().forEach(a);
    } else
      u[0].event === "start" ? i.push(u[0].node) : i.pop(), c(u.splice(0, 1)[0]);
  }
  return s + Pn(e.substr(r));
}
const n0 = {}, to = (n) => {
  console.error(n);
}, r0 = (n, ...t) => {
  console.log(`WARN: ${n}`, ...t);
}, ne = (n, t) => {
  n0[`${n}/${t}`] || (console.log(`Deprecated as of ${n}. ${t}`), n0[`${n}/${t}`] = !0);
}, eo = Pn, s0 = He, i0 = Symbol("nomatch"), rE = function(n) {
  const t = /* @__PURE__ */ Object.create(null), e = /* @__PURE__ */ Object.create(null), r = [];
  let s = !0;
  const i = /(^(<[^>]+>|\t|)+|\n)/gm, o = "Could not find the language '{}', did you forget to load/include a language module?", a = { disableAutodetect: !0, name: "Plain text", contains: [] };
  let l = {
    noHighlightRe: /^(no-?highlight)$/i,
    languageDetectRe: /\blang(?:uage)?-([\w-]+)\b/i,
    classPrefix: "hljs-",
    tabReplace: null,
    useBR: !1,
    languages: null,
    __emitter: xC
  };
  function c(y) {
    return l.noHighlightRe.test(y);
  }
  function u(y) {
    let E = y.className + " ";
    E += y.parentNode ? y.parentNode.className : "";
    const O = l.languageDetectRe.exec(E);
    if (O) {
      const M = bt(O[1]);
      return M || (r0(o.replace("{}", O[1])), r0("Falling back to no-highlight mode for this block.", y)), M ? O[1] : "no-highlight";
    }
    return E.split(/\s+/).find((M) => c(M) || bt(M));
  }
  function f(y, E, O, M) {
    let U = "", ot = "";
    typeof E == "object" ? (U = y, O = E.ignoreIllegals, ot = E.language, M = void 0) : (ne("10.7.0", "highlight(lang, code, ...args) has been deprecated."), ne("10.7.0", `Please use highlight(code, options) instead.
https://github.com/highlightjs/highlight.js/issues/2277`), ot = y, U = E);
    const xt = {
      code: U,
      language: ot
    };
    S("before:highlight", xt);
    const wt = xt.result ? xt.result : d(xt.language, xt.code, O, M);
    return wt.code = xt.code, S("after:highlight", wt), wt;
  }
  function d(y, E, O, M) {
    function U(P, H) {
      const K = vn.case_insensitive ? H[0].toLowerCase() : H[0];
      return Object.prototype.hasOwnProperty.call(P.keywords, K) && P.keywords[K];
    }
    function ot() {
      if (!q.keywords) {
        Mt.addText(yt);
        return;
      }
      let P = 0;
      q.keywordPatternRe.lastIndex = 0;
      let H = q.keywordPatternRe.exec(yt), K = "";
      for (; H; ) {
        K += yt.substring(P, H.index);
        const st = U(q, H);
        if (st) {
          const [Gt, Jr] = st;
          if (Mt.addText(K), K = "", Qr += Jr, Gt.startsWith("_"))
            K += H[0];
          else {
            const I2 = vn.classNameAliases[Gt] || Gt;
            Mt.addKeyword(H[0], I2);
          }
        } else
          K += H[0];
        P = q.keywordPatternRe.lastIndex, H = q.keywordPatternRe.exec(yt);
      }
      K += yt.substr(P), Mt.addText(K);
    }
    function xt() {
      if (yt === "")
        return;
      let P = null;
      if (typeof q.subLanguage == "string") {
        if (!t[q.subLanguage]) {
          Mt.addText(yt);
          return;
        }
        P = d(q.subLanguage, yt, !0, O1[q.subLanguage]), O1[q.subLanguage] = P.top;
      } else
        P = w(yt, q.subLanguage.length ? q.subLanguage : null);
      q.relevance > 0 && (Qr += P.relevance), Mt.addSublanguage(P.emitter, P.language);
    }
    function wt() {
      q.subLanguage != null ? xt() : ot(), yt = "";
    }
    function Et(P) {
      return P.className && Mt.openNode(vn.classNameAliases[P.className] || P.className), q = Object.create(P, { parent: { value: q } }), q;
    }
    function Rt(P, H, K) {
      let st = yC(P.endRe, K);
      if (st) {
        if (P["on:end"]) {
          const Gt = new Jc(P);
          P["on:end"](H, Gt), Gt.isMatchIgnored && (st = !1);
        }
        if (st) {
          for (; P.endsParent && P.parent; )
            P = P.parent;
          return P;
        }
      }
      if (P.endsWithParent)
        return Rt(P.parent, H, K);
    }
    function Yr(P) {
      return q.matcher.regexIndex === 0 ? (yt += P[0], 1) : (Ii = !0, 0);
    }
    function tr(P) {
      const H = P[0], K = P.rule, st = new Jc(K), Gt = [K.__beforeBegin, K["on:begin"]];
      for (const Jr of Gt)
        if (Jr && (Jr(P, st), st.isMatchIgnored))
          return Yr(H);
      return K && K.endSameAsBegin && (K.endRe = mC(H)), K.skip ? yt += H : (K.excludeBegin && (yt += H), wt(), !K.returnBegin && !K.excludeBegin && (yt = H)), Et(K), K.returnBegin ? 0 : H.length;
    }
    function k2(P) {
      const H = P[0], K = E.substr(P.index), st = Rt(q, P, K);
      if (!st)
        return i0;
      const Gt = q;
      Gt.skip ? yt += H : (Gt.returnEnd || Gt.excludeEnd || (yt += H), wt(), Gt.excludeEnd && (yt = H));
      do
        q.className && Mt.closeNode(), !q.skip && !q.subLanguage && (Qr += q.relevance), q = q.parent;
      while (q !== st.parent);
      return st.starts && (st.endSameAsBegin && (st.starts.endRe = st.endRe), Et(st.starts)), Gt.returnEnd ? 0 : H.length;
    }
    function O2() {
      const P = [];
      for (let H = q; H !== vn; H = H.parent)
        H.className && P.unshift(H.className);
      P.forEach((H) => Mt.openNode(H));
    }
    let Xr = {};
    function k1(P, H) {
      const K = H && H[0];
      if (yt += P, K == null)
        return wt(), 0;
      if (Xr.type === "begin" && H.type === "end" && Xr.index === H.index && K === "") {
        if (yt += E.slice(H.index, H.index + 1), !s) {
          const st = new Error("0 width match regex");
          throw st.languageName = y, st.badRule = Xr.rule, st;
        }
        return 1;
      }
      if (Xr = H, H.type === "begin")
        return tr(H);
      if (H.type === "illegal" && !O) {
        const st = new Error('Illegal lexeme "' + K + '" for mode "' + (q.className || "<unnamed>") + '"');
        throw st.mode = q, st;
      } else if (H.type === "end") {
        const st = k2(H);
        if (st !== i0)
          return st;
      }
      if (H.type === "illegal" && K === "")
        return 1;
      if (Ni > 1e5 && Ni > H.index * 3)
        throw new Error("potential infinite loop, way more iterations than matches");
      return yt += K, K.length;
    }
    const vn = bt(y);
    if (!vn)
      throw to(o.replace("{}", y)), new Error('Unknown language: "' + y + '"');
    const N2 = YC(vn, { plugins: r });
    let Oi = "", q = M || N2;
    const O1 = {}, Mt = new l.__emitter(l);
    O2();
    let yt = "", Qr = 0, yn = 0, Ni = 0, Ii = !1;
    try {
      for (q.matcher.considerAll(); ; ) {
        Ni++, Ii ? Ii = !1 : q.matcher.considerAll(), q.matcher.lastIndex = yn;
        const P = q.matcher.exec(E);
        if (!P)
          break;
        const H = E.substring(yn, P.index), K = k1(H, P);
        yn = P.index + K;
      }
      return k1(E.substr(yn)), Mt.closeAllNodes(), Mt.finalize(), Oi = Mt.toHTML(), {
        relevance: Math.floor(Qr),
        value: Oi,
        language: y,
        illegal: !1,
        emitter: Mt,
        top: q
      };
    } catch (P) {
      if (P.message && P.message.includes("Illegal"))
        return {
          illegal: !0,
          illegalBy: {
            msg: P.message,
            context: E.slice(yn - 100, yn + 100),
            mode: P.mode
          },
          sofar: Oi,
          relevance: 0,
          value: eo(E),
          emitter: Mt
        };
      if (s)
        return {
          illegal: !1,
          relevance: 0,
          value: eo(E),
          emitter: Mt,
          language: y,
          top: q,
          errorRaised: P
        };
      throw P;
    }
  }
  function p(y) {
    const E = {
      relevance: 0,
      emitter: new l.__emitter(l),
      value: eo(y),
      illegal: !1,
      top: a
    };
    return E.emitter.addText(y), E;
  }
  function w(y, E) {
    E = E || l.languages || Object.keys(t);
    const O = p(y), M = E.filter(bt).filter(x).map(
      (Et) => d(Et, y, !1)
    );
    M.unshift(O);
    const U = M.sort((Et, Rt) => {
      if (Et.relevance !== Rt.relevance)
        return Rt.relevance - Et.relevance;
      if (Et.language && Rt.language) {
        if (bt(Et.language).supersetOf === Rt.language)
          return 1;
        if (bt(Rt.language).supersetOf === Et.language)
          return -1;
      }
      return 0;
    }), [ot, xt] = U, wt = ot;
    return wt.second_best = xt, wt;
  }
  function I(y) {
    return l.tabReplace || l.useBR ? y.replace(i, (E) => E === `
` ? l.useBR ? "<br>" : E : l.tabReplace ? E.replace(/\t/g, l.tabReplace) : E) : y;
  }
  function W(y, E, O) {
    const M = E ? e[E] : O;
    y.classList.add("hljs"), M && y.classList.add(M);
  }
  const $ = {
    "before:highlightElement": ({ el: y }) => {
      l.useBR && (y.innerHTML = y.innerHTML.replace(/\n/g, "").replace(/<br[ /]*>/g, `
`));
    },
    "after:highlightElement": ({ result: y }) => {
      l.useBR && (y.value = y.value.replace(/\n/g, "<br>"));
    }
  }, j = /^(<[^>]+>|\t)+/gm, it = {
    "after:highlightElement": ({ result: y }) => {
      l.tabReplace && (y.value = y.value.replace(
        j,
        (E) => E.replace(/\t/g, l.tabReplace)
      ));
    }
  };
  function Y(y) {
    let E = null;
    const O = u(y);
    if (c(O))
      return;
    S(
      "before:highlightElement",
      { el: y, language: O }
    ), E = y;
    const M = E.textContent, U = O ? f(M, { language: O, ignoreIllegals: !0 }) : w(M);
    S("after:highlightElement", { el: y, result: U, text: M }), y.innerHTML = U.value, W(y, O, U.language), y.result = {
      language: U.language,
      re: U.relevance,
      relavance: U.relevance
    }, U.second_best && (y.second_best = {
      language: U.second_best.language,
      re: U.second_best.relevance,
      relavance: U.second_best.relevance
    });
  }
  function ft(y) {
    y.useBR && (ne("10.3.0", "'useBR' will be removed entirely in v11.0"), ne("10.3.0", "Please see https://github.com/highlightjs/highlight.js/issues/2559")), l = s0(l, y);
  }
  const rt = () => {
    if (rt.called)
      return;
    rt.called = !0, ne("10.6.0", "initHighlighting() is deprecated.  Use highlightAll() instead."), document.querySelectorAll("pre code").forEach(Y);
  };
  function dt() {
    ne("10.6.0", "initHighlightingOnLoad() is deprecated.  Use highlightAll() instead."), It = !0;
  }
  let It = !1;
  function ce() {
    if (document.readyState === "loading") {
      It = !0;
      return;
    }
    document.querySelectorAll("pre code").forEach(Y);
  }
  function _n() {
    It && ce();
  }
  typeof window < "u" && window.addEventListener && window.addEventListener("DOMContentLoaded", _n, !1);
  function ue(y, E) {
    let O = null;
    try {
      O = E(n);
    } catch (M) {
      if (to("Language definition for '{}' could not be registered.".replace("{}", y)), s)
        to(M);
      else
        throw M;
      O = a;
    }
    O.name || (O.name = y), t[y] = O, O.rawDefinition = E.bind(null, n), O.aliases && Ae(O.aliases, { languageName: y });
  }
  function ge(y) {
    delete t[y];
    for (const E of Object.keys(e))
      e[E] === y && delete e[E];
  }
  function Te() {
    return Object.keys(t);
  }
  function Ln(y) {
    ne("10.4.0", "requireLanguage will be removed entirely in v11."), ne("10.4.0", "Please see https://github.com/highlightjs/highlight.js/pull/2844");
    const E = bt(y);
    if (E)
      return E;
    throw new Error("The '{}' language is required, but not loaded.".replace("{}", y));
  }
  function bt(y) {
    return y = (y || "").toLowerCase(), t[y] || t[e[y]];
  }
  function Ae(y, { languageName: E }) {
    typeof y == "string" && (y = [y]), y.forEach((O) => {
      e[O.toLowerCase()] = E;
    });
  }
  function x(y) {
    const E = bt(y);
    return E && !E.disableAutodetect;
  }
  function g(y) {
    y["before:highlightBlock"] && !y["before:highlightElement"] && (y["before:highlightElement"] = (E) => {
      y["before:highlightBlock"](
        Object.assign({ block: E.el }, E)
      );
    }), y["after:highlightBlock"] && !y["after:highlightElement"] && (y["after:highlightElement"] = (E) => {
      y["after:highlightBlock"](
        Object.assign({ block: E.el }, E)
      );
    });
  }
  function C(y) {
    g(y), r.push(y);
  }
  function S(y, E) {
    const O = y;
    r.forEach(function(M) {
      M[O] && M[O](E);
    });
  }
  function B(y) {
    return ne("10.2.0", "fixMarkup will be removed entirely in v11.0"), ne("10.2.0", "Please see https://github.com/highlightjs/highlight.js/issues/2534"), I(y);
  }
  function X(y) {
    return ne("10.7.0", "highlightBlock will be removed entirely in v12.0"), ne("10.7.0", "Please use highlightElement now."), Y(y);
  }
  Object.assign(n, {
    highlight: f,
    highlightAuto: w,
    highlightAll: ce,
    fixMarkup: B,
    highlightElement: Y,
    highlightBlock: X,
    configure: ft,
    initHighlighting: rt,
    initHighlightingOnLoad: dt,
    registerLanguage: ue,
    unregisterLanguage: ge,
    listLanguages: Te,
    getLanguage: bt,
    registerAliases: Ae,
    requireLanguage: Ln,
    autoDetection: x,
    inherit: s0,
    addPlugin: C,
    vuePlugin: tE(n).VuePlugin
  }), n.debugMode = function() {
    s = !1;
  }, n.safeMode = function() {
    s = !0;
  }, n.versionString = QC;
  for (const y in ms)
    typeof ms[y] == "object" && y2(ms[y]);
  return Object.assign(n, ms), n.addPlugin($), n.addPlugin(eE), n.addPlugin(it), n;
};
var sE = rE({}), on = sE;
function iE(n) {
  return {
    name: "Plain text",
    aliases: [
      "text",
      "txt"
    ],
    disableAutodetect: !0
  };
}
var oE = iE;
const o0 = "[A-Za-z$_][0-9A-Za-z$_]*", aE = [
  "as",
  "in",
  "of",
  "if",
  "for",
  "while",
  "finally",
  "var",
  "new",
  "function",
  "do",
  "return",
  "void",
  "else",
  "break",
  "catch",
  "instanceof",
  "with",
  "throw",
  "case",
  "default",
  "try",
  "switch",
  "continue",
  "typeof",
  "delete",
  "let",
  "yield",
  "const",
  "class",
  "debugger",
  "async",
  "await",
  "static",
  "import",
  "from",
  "export",
  "extends"
], lE = [
  "true",
  "false",
  "null",
  "undefined",
  "NaN",
  "Infinity"
], cE = [
  "Intl",
  "DataView",
  "Number",
  "Math",
  "Date",
  "String",
  "RegExp",
  "Object",
  "Function",
  "Boolean",
  "Error",
  "Symbol",
  "Set",
  "Map",
  "WeakSet",
  "WeakMap",
  "Proxy",
  "Reflect",
  "JSON",
  "Promise",
  "Float64Array",
  "Int16Array",
  "Int32Array",
  "Int8Array",
  "Uint16Array",
  "Uint32Array",
  "Float32Array",
  "Array",
  "Uint8Array",
  "Uint8ClampedArray",
  "ArrayBuffer",
  "BigInt64Array",
  "BigUint64Array",
  "BigInt"
], uE = [
  "EvalError",
  "InternalError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "TypeError",
  "URIError"
], hE = [
  "setInterval",
  "setTimeout",
  "clearInterval",
  "clearTimeout",
  "require",
  "exports",
  "eval",
  "isFinite",
  "isNaN",
  "parseFloat",
  "parseInt",
  "decodeURI",
  "decodeURIComponent",
  "encodeURI",
  "encodeURIComponent",
  "escape",
  "unescape"
], fE = [
  "arguments",
  "this",
  "super",
  "console",
  "window",
  "document",
  "localStorage",
  "module",
  "global"
], dE = [].concat(
  hE,
  fE,
  cE,
  uE
);
function pE(n) {
  return n ? typeof n == "string" ? n : n.source : null;
}
function a0(n) {
  return jo("(?=", n, ")");
}
function jo(...n) {
  return n.map((e) => pE(e)).join("");
}
function gE(n) {
  const t = (Y, { after: ft }) => {
    const rt = "</" + Y[0].slice(1);
    return Y.input.indexOf(rt, ft) !== -1;
  }, e = o0, r = {
    begin: "<>",
    end: "</>"
  }, s = {
    begin: /<[A-Za-z0-9\\._:-]+/,
    end: /\/[A-Za-z0-9\\._:-]+>|\/>/,
    isTrulyOpeningTag: (Y, ft) => {
      const rt = Y[0].length + Y.index, dt = Y.input[rt];
      if (dt === "<") {
        ft.ignoreMatch();
        return;
      }
      dt === ">" && (t(Y, { after: rt }) || ft.ignoreMatch());
    }
  }, i = {
    $pattern: o0,
    keyword: aE,
    literal: lE,
    built_in: dE
  }, o = "[0-9](_?[0-9])*", a = `\\.(${o})`, l = "0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*", c = {
    className: "number",
    variants: [
      { begin: `(\\b(${l})((${a})|\\.)?|(${a}))[eE][+-]?(${o})\\b` },
      { begin: `\\b(${l})\\b((${a})\\b|\\.)?|(${a})\\b` },
      { begin: "\\b(0|[1-9](_?[0-9])*)n\\b" },
      { begin: "\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b" },
      { begin: "\\b0[bB][0-1](_?[0-1])*n?\\b" },
      { begin: "\\b0[oO][0-7](_?[0-7])*n?\\b" },
      { begin: "\\b0[0-7]+n?\\b" }
    ],
    relevance: 0
  }, u = {
    className: "subst",
    begin: "\\$\\{",
    end: "\\}",
    keywords: i,
    contains: []
  }, f = {
    begin: "html`",
    end: "",
    starts: {
      end: "`",
      returnEnd: !1,
      contains: [
        n.BACKSLASH_ESCAPE,
        u
      ],
      subLanguage: "xml"
    }
  }, d = {
    begin: "css`",
    end: "",
    starts: {
      end: "`",
      returnEnd: !1,
      contains: [
        n.BACKSLASH_ESCAPE,
        u
      ],
      subLanguage: "css"
    }
  }, p = {
    className: "string",
    begin: "`",
    end: "`",
    contains: [
      n.BACKSLASH_ESCAPE,
      u
    ]
  }, I = {
    className: "comment",
    variants: [
      n.COMMENT(
        /\/\*\*(?!\/)/,
        "\\*/",
        {
          relevance: 0,
          contains: [
            {
              className: "doctag",
              begin: "@[A-Za-z]+",
              contains: [
                {
                  className: "type",
                  begin: "\\{",
                  end: "\\}",
                  relevance: 0
                },
                {
                  className: "variable",
                  begin: e + "(?=\\s*(-)|$)",
                  endsParent: !0,
                  relevance: 0
                },
                {
                  begin: /(?=[^\n])\s/,
                  relevance: 0
                }
              ]
            }
          ]
        }
      ),
      n.C_BLOCK_COMMENT_MODE,
      n.C_LINE_COMMENT_MODE
    ]
  }, W = [
    n.APOS_STRING_MODE,
    n.QUOTE_STRING_MODE,
    f,
    d,
    p,
    c,
    n.REGEXP_MODE
  ];
  u.contains = W.concat({
    begin: /\{/,
    end: /\}/,
    keywords: i,
    contains: [
      "self"
    ].concat(W)
  });
  const $ = [].concat(I, u.contains), j = $.concat([
    {
      begin: /\(/,
      end: /\)/,
      keywords: i,
      contains: ["self"].concat($)
    }
  ]), it = {
    className: "params",
    begin: /\(/,
    end: /\)/,
    excludeBegin: !0,
    excludeEnd: !0,
    keywords: i,
    contains: j
  };
  return {
    name: "Javascript",
    aliases: ["js", "jsx", "mjs", "cjs"],
    keywords: i,
    exports: { PARAMS_CONTAINS: j },
    illegal: /#(?![$_A-z])/,
    contains: [
      n.SHEBANG({
        label: "shebang",
        binary: "node",
        relevance: 5
      }),
      {
        label: "use_strict",
        className: "meta",
        relevance: 10,
        begin: /^\s*['"]use (strict|asm)['"]/
      },
      n.APOS_STRING_MODE,
      n.QUOTE_STRING_MODE,
      f,
      d,
      p,
      I,
      c,
      {
        begin: jo(
          /[{,\n]\s*/,
          a0(jo(
            /(((\/\/.*$)|(\/\*(\*[^/]|[^*])*\*\/))\s*)*/,
            e + "\\s*:"
          ))
        ),
        relevance: 0,
        contains: [
          {
            className: "attr",
            begin: e + a0("\\s*:"),
            relevance: 0
          }
        ]
      },
      {
        begin: "(" + n.RE_STARTERS_RE + "|\\b(case|return|throw)\\b)\\s*",
        keywords: "return throw case",
        contains: [
          I,
          n.REGEXP_MODE,
          {
            className: "function",
            begin: "(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|" + n.UNDERSCORE_IDENT_RE + ")\\s*=>",
            returnBegin: !0,
            end: "\\s*=>",
            contains: [
              {
                className: "params",
                variants: [
                  {
                    begin: n.UNDERSCORE_IDENT_RE,
                    relevance: 0
                  },
                  {
                    className: null,
                    begin: /\(\s*\)/,
                    skip: !0
                  },
                  {
                    begin: /\(/,
                    end: /\)/,
                    excludeBegin: !0,
                    excludeEnd: !0,
                    keywords: i,
                    contains: j
                  }
                ]
              }
            ]
          },
          {
            begin: /,/,
            relevance: 0
          },
          {
            className: "",
            begin: /\s/,
            end: /\s*/,
            skip: !0
          },
          {
            variants: [
              { begin: r.begin, end: r.end },
              {
                begin: s.begin,
                "on:begin": s.isTrulyOpeningTag,
                end: s.end
              }
            ],
            subLanguage: "xml",
            contains: [
              {
                begin: s.begin,
                end: s.end,
                skip: !0,
                contains: ["self"]
              }
            ]
          }
        ],
        relevance: 0
      },
      {
        className: "function",
        beginKeywords: "function",
        end: /[{;]/,
        excludeEnd: !0,
        keywords: i,
        contains: [
          "self",
          n.inherit(n.TITLE_MODE, { begin: e }),
          it
        ],
        illegal: /%/
      },
      {
        beginKeywords: "while if switch catch for"
      },
      {
        className: "function",
        begin: n.UNDERSCORE_IDENT_RE + "\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",
        returnBegin: !0,
        contains: [
          it,
          n.inherit(n.TITLE_MODE, { begin: e })
        ]
      },
      {
        variants: [
          { begin: "\\." + e },
          { begin: "\\$" + e }
        ],
        relevance: 0
      },
      {
        className: "class",
        beginKeywords: "class",
        end: /[{;=]/,
        excludeEnd: !0,
        illegal: /[:"[\]]/,
        contains: [
          { beginKeywords: "extends" },
          n.UNDERSCORE_TITLE_MODE
        ]
      },
      {
        begin: /\b(?=constructor)/,
        end: /[{;]/,
        excludeEnd: !0,
        contains: [
          n.inherit(n.TITLE_MODE, { begin: e }),
          "self",
          it
        ]
      },
      {
        begin: "(get|set)\\s+(?=" + e + "\\()",
        end: /\{/,
        keywords: "get set",
        contains: [
          n.inherit(n.TITLE_MODE, { begin: e }),
          { begin: /\(\)/ },
          it
        ]
      },
      {
        begin: /\$[(.]/
      }
    ]
  };
}
var xE = gE;
function mE(n) {
  return n ? typeof n == "string" ? n : n.source : null;
}
function _E(...n) {
  return n.map((e) => mE(e)).join("");
}
function LE(n) {
  const t = {}, e = {
    begin: /\$\{/,
    end: /\}/,
    contains: [
      "self",
      {
        begin: /:-/,
        contains: [t]
      }
    ]
  };
  Object.assign(t, {
    className: "variable",
    variants: [
      { begin: _E(
        /\$[\w\d#@][\w\d_]*/,
        "(?![\\w\\d])(?![$])"
      ) },
      e
    ]
  });
  const r = {
    className: "subst",
    begin: /\$\(/,
    end: /\)/,
    contains: [n.BACKSLASH_ESCAPE]
  }, s = {
    begin: /<<-?\s*(?=\w+)/,
    starts: {
      contains: [
        n.END_SAME_AS_BEGIN({
          begin: /(\w+)/,
          end: /(\w+)/,
          className: "string"
        })
      ]
    }
  }, i = {
    className: "string",
    begin: /"/,
    end: /"/,
    contains: [
      n.BACKSLASH_ESCAPE,
      t,
      r
    ]
  };
  r.contains.push(i);
  const o = {
    className: "",
    begin: /\\"/
  }, a = {
    className: "string",
    begin: /'/,
    end: /'/
  }, l = {
    begin: /\$\(\(/,
    end: /\)\)/,
    contains: [
      { begin: /\d+#[0-9a-f]+/, className: "number" },
      n.NUMBER_MODE,
      t
    ]
  }, c = [
    "fish",
    "bash",
    "zsh",
    "sh",
    "csh",
    "ksh",
    "tcsh",
    "dash",
    "scsh"
  ], u = n.SHEBANG({
    binary: `(${c.join("|")})`,
    relevance: 10
  }), f = {
    className: "function",
    begin: /\w[\w\d_]*\s*\(\s*\)\s*\{/,
    returnBegin: !0,
    contains: [n.inherit(n.TITLE_MODE, { begin: /\w[\w\d_]*/ })],
    relevance: 0
  };
  return {
    name: "Bash",
    aliases: ["sh", "zsh"],
    keywords: {
      $pattern: /\b[a-z._-]+\b/,
      keyword: "if then else elif fi for while in do done case esac function",
      literal: "true false",
      built_in: "break cd continue eval exec exit export getopts hash pwd readonly return shift test times trap umask unset alias bind builtin caller command declare echo enable help let local logout mapfile printf read readarray source type typeset ulimit unalias set shopt autoload bg bindkey bye cap chdir clone comparguments compcall compctl compdescribe compfiles compgroups compquote comptags comptry compvalues dirs disable disown echotc echoti emulate fc fg float functions getcap getln history integer jobs kill limit log noglob popd print pushd pushln rehash sched setcap setopt stat suspend ttyctl unfunction unhash unlimit unsetopt vared wait whence where which zcompile zformat zftp zle zmodload zparseopts zprof zpty zregexparse zsocket zstyle ztcp"
    },
    contains: [
      u,
      n.SHEBANG(),
      f,
      l,
      n.HASH_COMMENT_MODE,
      s,
      i,
      o,
      a,
      t
    ]
  };
}
var vE = LE;
function yE(n) {
  var t = "true false yes no null", e = "[\\w#;/?:@&=+$,.~*'()[\\]]+", r = {
    className: "attr",
    variants: [
      { begin: "\\w[\\w :\\/.-]*:(?=[ 	]|$)" },
      { begin: '"\\w[\\w :\\/.-]*":(?=[ 	]|$)' },
      { begin: "'\\w[\\w :\\/.-]*':(?=[ 	]|$)" }
    ]
  }, s = {
    className: "template-variable",
    variants: [
      { begin: /\{\{/, end: /\}\}/ },
      { begin: /%\{/, end: /\}/ }
    ]
  }, i = {
    className: "string",
    relevance: 0,
    variants: [
      { begin: /'/, end: /'/ },
      { begin: /"/, end: /"/ },
      { begin: /\S+/ }
    ],
    contains: [
      n.BACKSLASH_ESCAPE,
      s
    ]
  }, o = n.inherit(i, {
    variants: [
      { begin: /'/, end: /'/ },
      { begin: /"/, end: /"/ },
      { begin: /[^\s,{}[\]]+/ }
    ]
  }), a = "[0-9]{4}(-[0-9][0-9]){0,2}", l = "([Tt \\t][0-9][0-9]?(:[0-9][0-9]){2})?", c = "(\\.[0-9]*)?", u = "([ \\t])*(Z|[-+][0-9][0-9]?(:[0-9][0-9])?)?", f = {
    className: "number",
    begin: "\\b" + a + l + c + u + "\\b"
  }, d = {
    end: ",",
    endsWithParent: !0,
    excludeEnd: !0,
    keywords: t,
    relevance: 0
  }, p = {
    begin: /\{/,
    end: /\}/,
    contains: [d],
    illegal: "\\n",
    relevance: 0
  }, w = {
    begin: "\\[",
    end: "\\]",
    contains: [d],
    illegal: "\\n",
    relevance: 0
  }, I = [
    r,
    {
      className: "meta",
      begin: "^---\\s*$",
      relevance: 10
    },
    {
      className: "string",
      begin: "[\\|>]([1-9]?[+-])?[ ]*\\n( +)[^ ][^\\n]*\\n(\\2[^\\n]+\\n?)*"
    },
    {
      begin: "<%[%=-]?",
      end: "[%-]?%>",
      subLanguage: "ruby",
      excludeBegin: !0,
      excludeEnd: !0,
      relevance: 0
    },
    {
      className: "type",
      begin: "!\\w+!" + e
    },
    {
      className: "type",
      begin: "!<" + e + ">"
    },
    {
      className: "type",
      begin: "!" + e
    },
    {
      className: "type",
      begin: "!!" + e
    },
    {
      className: "meta",
      begin: "&" + n.UNDERSCORE_IDENT_RE + "$"
    },
    {
      className: "meta",
      begin: "\\*" + n.UNDERSCORE_IDENT_RE + "$"
    },
    {
      className: "bullet",
      begin: "-(?=[ ]|$)",
      relevance: 0
    },
    n.HASH_COMMENT_MODE,
    {
      beginKeywords: t,
      keywords: { literal: t }
    },
    f,
    {
      className: "number",
      begin: n.C_NUMBER_RE + "\\b",
      relevance: 0
    },
    p,
    w,
    i
  ], W = [...I];
  return W.pop(), W.push(o), d.contains = W, {
    name: "YAML",
    case_insensitive: !0,
    aliases: ["yml"],
    contains: I
  };
}
var CE = yE, EE = function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    staticClass: "comments text-skin-comment min-w-[100px] flex justify-around text-left text-sm opacity-50 hover:opacity-100",
    style: {
      color: n.color
    }
  }, [e("div", {
    domProps: {
      innerHTML: n._s(n.markedComment)
    }
  })]);
}, bE = [];
on.registerLanguage("plaintext", oE);
on.registerLanguage("javascript", xE);
on.registerLanguage("bash", vE);
on.registerLanguage("yaml", CE);
const wE = {
  codespan(n) {
    let e = /(GET|HEAD|POST|PUT|DELETE|CONNECT|OPTIONS|TRACE|PATCH)\s+(.+)/gi.exec(n);
    return (e == null ? void 0 : e.length) === 3 ? `
          <code class="rest-api">
          <span class="http-method-${e[1].toLowerCase()}">${e[1]}</span>
          <span class="http-path">${e[2]}</span>
          </code>
        ` : `<code>${n}</code>`;
  }
};
F.setOptions({
  highlight: function(n, t) {
    if (!t)
      return on.highlightAuto(n).value;
    const e = on.getLanguage(t) ? t : "plaintext";
    return on.highlight(e, n).value;
  },
  breaks: !0
});
F.use({ renderer: wE });
const TE = {
  name: "comment",
  props: ["comment", "commentObj"],
  computed: {
    markedComment() {
      var n, t;
      return ((n = this.commentObj) == null ? void 0 : n.text) && F.parse((t = this.commentObj) == null ? void 0 : t.text) || this.comment && F.parse(this.comment);
    },
    color() {
      var n;
      return (n = this.commentObj) == null ? void 0 : n.color;
    }
  }
}, l0 = {};
var AE = /* @__PURE__ */ et(
  TE,
  EE,
  bE,
  !1,
  SE,
  "460475e2",
  null,
  null
);
function SE(n) {
  for (let t in l0)
    this[t] = l0[t];
}
const Wr = /* @__PURE__ */ function() {
  return AE.exports;
}(), qr = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Wr
}, Symbol.toStringTag, { value: "Module" }));
var RE = function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    staticClass: "occurrence border-skin-occurrence bg-skin-occurrence rounded-sm border-2 relative left-full",
    class: {
      "right-to-left": n.rtl
    },
    attrs: {
      "data-el-type": "occurrence",
      "data-belongs-to": n.participant,
      "data-x-offset": n.center,
      "data-debug-center-of": n.computedCenter
    }
  }, [this.context.braceBlock() ? e("block", {
    attrs: {
      context: n.context.braceBlock().block(),
      selfCallIndent: n.selfCallIndent
    }
  }) : n._e()], 1);
}, kE = [];
const OE = {
  name: "occurrence",
  props: ["context", "selfCallIndent", "participant", "rtl"],
  data: function() {
    return {
      center: 0
    };
  },
  computed: {
    ...Ht(["centerOf", "messageLayerLeft"]),
    ...Mr(["code"]),
    computedCenter: function() {
      try {
        return this.centerOf(this.participant);
      } catch (n) {
        return console.error(n), 0;
      }
    }
  }
}, c0 = {};
var NE = /* @__PURE__ */ et(
  OE,
  RE,
  kE,
  !1,
  IE,
  "696286d4",
  null,
  null
);
function IE(n) {
  for (let t in c0)
    this[t] = c0[t];
}
const S2 = /* @__PURE__ */ function() {
  return NE.exports;
}();
class Jn {
  constructor(t, e, r, s) {
    this.start = { line: t, col: e }, this.stop = { line: r, col: s };
  }
  static from(t) {
    const e = t.start, r = t.stop;
    return new Jn(e.line, e.column, r.line, r.column + r.text.length);
  }
}
var ME = function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    staticClass: "interaction creation sync text-center transform",
    class: {
      "right-to-left": n.rightToLeft,
      "-translate-x-full": n.rightToLeft,
      highlight: n.isCurrent
    },
    style: {
      width: n.interactionWidth + "px"
    },
    attrs: {
      "data-signature": n.signature
    },
    on: {
      click: function(r) {
        return r.stopPropagation(), n.onClick.apply(null, arguments);
      }
    }
  }, [n.comment ? e("comment", {
    attrs: {
      comment: n.comment
    }
  }) : n._e(), e("div", {
    ref: "messageContainer",
    staticClass: "message-container pointer-events-none flex items-center h-10",
    class: {
      "flex-row-reverse": n.rightToLeft
    },
    attrs: {
      "data-type": "creation",
      "data-to": n.to
    }
  }, [e("message", {
    ref: "messageEl",
    staticClass: "invocation w-full transform -translate-y-1/2 pointer-events-auto",
    attrs: {
      content: n.signature,
      rtl: n.rightToLeft,
      type: "creation"
    }
  }), e("div", {
    ref: "participantPlaceHolder",
    staticClass: "invisible right-0 flex flex-col justify-center flex-shrink-0"
  }, [e("participant", {
    attrs: {
      entity: {
        name: n.to
      }
    }
  })], 1)], 1), e("occurrence", {
    staticClass: "pointer-events-auto",
    attrs: {
      context: n.creation,
      participant: n.to
    }
  }), n.assignee ? e("message", {
    staticClass: "return transform -translate-y-full pointer-events-auto",
    attrs: {
      content: n.assignee,
      rtl: !n.rightToLeft,
      type: "return"
    }
  }) : n._e()], 1);
}, PE = [];
const u0 = kr.child({ name: "Creation" }), $E = {
  name: "creation",
  props: ["context", "comment", "selfCallIndent"],
  computed: {
    ...Ht(["cursor", "onElementClick", "distance"]),
    from() {
      return this.context.Origin();
    },
    creation() {
      return this.context.creation();
    },
    interactionWidth() {
      let n = Math.abs(this.distance(this.to, this.from)), t = this.selfCallIndent || 0;
      return n + (this.rightToLeft ? t : -t);
    },
    rightToLeft() {
      return this.distance(this.to, this.from) < 0;
    },
    signature() {
      return this.creation.SignatureText();
    },
    assignee() {
      function n(s) {
        return s && s.getFormattedText() || "";
      }
      let t = this.creation.creationBody().assignment();
      if (!t)
        return "";
      let e = n(t.assignee());
      const r = n(t.type());
      return e + (r ? ":" + r : "");
    },
    to() {
      return this.creation.Owner();
    },
    isCurrent() {
      return this.creation.isCurrent(this.cursor);
    }
  },
  mounted() {
    this.layoutMessageContainer(), u0.log(`mounted for ${this.to}`);
  },
  updated() {
    this.layoutMessageContainer(), u0.debug(`mounted for ${this.to}`);
  },
  methods: {
    layoutMessageContainer() {
      (() => {
        if (!this.$refs.participantPlaceHolder || !this.$refs.messageContainer)
          return;
        const t = this.$refs.participantPlaceHolder.offsetWidth / 2;
        this.$refs.messageContainer.style.width = `calc(100% + ${t + 6}px`, this.rightToLeft && (this.$refs.messageContainer.style.transform = `translateX( ${-(t + 6)}px`);
      })();
    },
    onClick() {
      this.onElementClick(Jn.from(this.context));
    }
  },
  components: {
    Participant: s2,
    Comment: Wr,
    Occurrence: S2,
    Message: Zr
  }
}, h0 = {};
var DE = /* @__PURE__ */ et(
  $E,
  ME,
  PE,
  !1,
  FE,
  null,
  null,
  null
);
function FE(n) {
  for (let t in h0)
    this[t] = h0[t];
}
const BE = /* @__PURE__ */ function() {
  return DE.exports;
}();
var UE = function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    staticClass: "message self text-sm flex items-start",
    staticStyle: {
      "border-width": "0"
    }
  }, [e("svg", {
    staticClass: "arrow text-skin-message-arrow",
    attrs: {
      width: "30",
      height: "24"
    }
  }, [e("polyline", {
    staticClass: "line stroke-current fill-none stroke-2",
    attrs: {
      points: "0,2 28,2 28,15 14,15"
    }
  }), e("polyline", {
    staticClass: "head stroke-current fill-current stroke-2",
    attrs: {
      points: "18,9 8,15 18,21"
    }
  })]), e("label", {
    staticClass: "name px-px hover:text-skin-message-hover hover:bg-skin-message-hover"
  }, [n.assignee ? e("span", [n._v(n._s(n.assignee) + " = ")]) : n._e(), n._v(" " + n._s(n.content))])]);
}, HE = [];
const GE = {
  name: "self-invocation",
  props: ["content", "assignee"]
}, f0 = {};
var jE = /* @__PURE__ */ et(
  GE,
  UE,
  HE,
  !1,
  VE,
  null,
  null,
  null
);
function VE(n) {
  for (let t in f0)
    this[t] = f0[t];
}
const zE = /* @__PURE__ */ function() {
  return jE.exports;
}();
var ZE = function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    staticClass: "interaction sync inline-block",
    class: {
      highlight: n.isCurrent,
      self: n.isSelf
    },
    style: {
      width: !n.isSelf && n.interactionWidth + "px",
      transform: "translateX(" + n.translateX + "px)"
    },
    attrs: {
      "data-to": n.to,
      "data-type": "interaction",
      "data-signature": n.signature
    },
    on: {
      click: function(r) {
        return r.stopPropagation(), n.onClick.apply(null, arguments);
      }
    }
  }, [n.showStarter && n.isRootBlock || n.outOfBand ? e("div", {
    staticClass: "occurrence source border-2",
    class: {
      "right-to-left": n.rightToLeft
    }
  }) : n._e(), n.hasComment ? e("comment", {
    attrs: {
      commentObj: n.commentObj
    }
  }) : n._e(), e(n.invocation, {
    tag: "component",
    staticClass: "text-center",
    attrs: {
      color: n.color,
      content: n.signature,
      assignee: n.assignee,
      rtl: n.rightToLeft,
      type: "sync"
    }
  }), e("occurrence", {
    attrs: {
      context: n.message,
      participant: n.to,
      selfCallIndent: n.passOnOffset,
      rtl: n.rightToLeft
    }
  }), n.assignee && !n.isSelf ? e("message", {
    staticClass: "return transform -translate-y-full",
    attrs: {
      content: n.assignee,
      rtl: !n.rightToLeft,
      type: "return"
    }
  }) : n._e()], 1);
}, WE = [];
const qE = {
  name: "interaction",
  props: ["context", "selfCallIndent", "commentObj"],
  computed: {
    ...Ht(["participants", "distance2", "cursor", "onElementClick"]),
    hasComment() {
      var n, t;
      return ((n = this.commentObj) == null ? void 0 : n.text) !== "" || ((t = this.commentObj) == null ? void 0 : t.color) !== "";
    },
    color() {
      var n;
      return (n = this.commentObj) == null ? void 0 : n.color;
    },
    message: function() {
      var n;
      return (n = this.context) == null ? void 0 : n.message();
    },
    providedFrom: function() {
      var n, t;
      return (t = (n = this.context) == null ? void 0 : n.message()) == null ? void 0 : t.ProvidedFrom();
    },
    from: function() {
      return this.providedFrom || this.origin;
    },
    outOfBand: function() {
      return !!this.providedFrom && this.providedFrom !== this.origin;
    },
    assignee: function() {
      var t;
      let n = (t = this.message) == null ? void 0 : t.Assignment();
      return n ? n.getText() : "";
    },
    signature: function() {
      var n;
      return (n = this.message) == null ? void 0 : n.SignatureText();
    },
    translateX: function() {
      if (!this.rightToLeft && !this.outOfBand)
        return 0;
      const t = this.rightToLeft ? this.to : this.providedFrom, e = this.distance2(this.origin, t), r = this.selfCallIndent || 0;
      return e + 0 - r;
    },
    rightToLeft: function() {
      return this.distance2(this.from, this.to) < 0;
    },
    isCurrent: function() {
      var n;
      return (n = this.message) == null ? void 0 : n.isCurrent(this.cursor);
    },
    showStarter() {
      return this.participants.Starter().name !== "_STARTER_";
    },
    isRootBlock() {
      var n, t;
      return ((t = (n = this.context) == null ? void 0 : n.parentCtx) == null ? void 0 : t.parentCtx) instanceof e_;
    },
    origin: function() {
      var n;
      return (n = this.context) == null ? void 0 : n.Origin();
    },
    passOnOffset: function() {
      return this.isSelf ? (this.selfCallIndent || 0) + 6 : 0;
    },
    interactionWidth: function() {
      if (this.context && this.isSelf)
        return 0;
      let n = this.outOfBand ? 0 : this.selfCallIndent || 0;
      return Math.abs(this.distance2(this.from, this.to) - n);
    },
    to: function() {
      var n, t;
      return (t = (n = this.context) == null ? void 0 : n.message()) == null ? void 0 : t.Owner();
    },
    isSelf: function() {
      return this.to === this.from;
    },
    invocation: function() {
      return this.isSelf ? "SelfInvocation" : "Message";
    }
  },
  methods: {
    onClick() {
      this.onElementClick(Jn.from(this.context));
    }
  },
  components: {
    Message: Zr,
    SelfInvocation: zE,
    Comment: Wr,
    Occurrence: S2
  }
}, d0 = {};
var KE = /* @__PURE__ */ et(
  qE,
  ZE,
  WE,
  !1,
  YE,
  "654355dc",
  null,
  null
);
function YE(n) {
  for (let t in d0)
    this[t] = d0[t];
}
const XE = /* @__PURE__ */ function() {
  return KE.exports;
}();
var QE = function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    staticClass: "message self flex items-start",
    staticStyle: {
      "border-width": "0"
    }
  }, [e("svg", {
    staticClass: "arrow text-skin-message-arrow",
    attrs: {
      width: "34",
      height: "34"
    }
  }, [e("polyline", {
    staticClass: "stroke-current stroke-2 fill-none",
    attrs: {
      points: "0,2 28,2 28,25 1,25"
    }
  }), e("polyline", {
    staticClass: "head stroke-current stroke-2 fill-none",
    attrs: {
      points: "11,19 1,25 11,31"
    }
  })]), e("label", {
    staticClass: "name px-px hover:text-skin-message-hover hover:bg-skin-message-hover"
  }, [n._v(n._s(n.content))])]);
}, JE = [];
const tb = {
  name: "self-invocation-async",
  props: ["content"]
}, p0 = {};
var eb = /* @__PURE__ */ et(
  tb,
  QE,
  JE,
  !1,
  nb,
  "15650a4a",
  null,
  null
);
function nb(n) {
  for (let t in p0)
    this[t] = p0[t];
}
const rb = /* @__PURE__ */ function() {
  return eb.exports;
}();
var sb = function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    staticClass: "interaction async",
    class: {
      "right-to-left": n.rightToLeft,
      highlight: n.isCurrent
    },
    style: {
      width: n.interactionWidth + "px",
      transform: "translateX(" + n.translateX + "px)"
    },
    attrs: {
      "data-signature": n.signature
    },
    on: {
      click: function(r) {
        return r.stopPropagation(), n.onClick.apply(null, arguments);
      }
    }
  }, [n.comment ? e("comment", {
    attrs: {
      comment: n.comment
    }
  }) : n._e(), e(n.invocation, {
    tag: "component",
    attrs: {
      content: n.signature,
      rtl: n.rightToLeft,
      type: "async"
    }
  })], 1);
}, ib = [];
function no(n) {
  return n == null;
}
const ob = {
  name: "interaction-async",
  props: ["context", "comment", "selfCallIndent"],
  computed: {
    ...Ht(["distance", "cursor", "onElementClick"]),
    from: function() {
      return this.context.Origin();
    },
    asyncMessage: function() {
      var n;
      return (n = this.context) == null ? void 0 : n.asyncMessage();
    },
    interactionWidth: function() {
      var n;
      return this.isSelf ? 10 * (((n = this.signature) == null ? void 0 : n.length) || 0) + 100 : Math.abs(this.distance(this.target, this.source));
    },
    translateX: function() {
      return this.rightToLeft ? this.distance(this.target, this.from) : this.distance(this.source, this.from);
    },
    rightToLeft: function() {
      return this.distance(this.target, this.source) < 0;
    },
    signature: function() {
      var n, t;
      return (t = (n = this.asyncMessage) == null ? void 0 : n.content()) == null ? void 0 : t.getFormattedText();
    },
    source: function() {
      var n, t;
      return ((t = (n = this.asyncMessage) == null ? void 0 : n.from()) == null ? void 0 : t.getFormattedText()) || this.from;
    },
    target: function() {
      var n, t;
      return (t = (n = this.asyncMessage) == null ? void 0 : n.to()) == null ? void 0 : t.getFormattedText();
    },
    isCurrent: function() {
      const n = this.asyncMessage.start.start, t = this.asyncMessage.stop.stop + 1;
      return no(this.cursor) || no(n) || no(t) ? !1 : this.cursor >= n && this.cursor <= t;
    },
    isSelf: function() {
      return this.source === this.target;
    },
    invocation: function() {
      return this.isSelf ? "SelfInvocationAsync" : "Message";
    }
  },
  methods: {
    onClick() {
      this.onElementClick(Jn.from(this.context));
    }
  },
  components: {
    Comment: Wr,
    SelfInvocationAsync: rb,
    Message: Zr
  }
}, g0 = {};
var ab = /* @__PURE__ */ et(
  ob,
  sb,
  ib,
  !1,
  lb,
  "146d3785",
  null,
  null
);
function lb(n) {
  for (let t in g0)
    this[t] = g0[t];
}
const cb = /* @__PURE__ */ function() {
  return ab.exports;
}();
var ub = function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    staticClass: "fragment alt border-skin-fragment rounded",
    style: n.fragmentStyle
  }, [e("div", {
    staticClass: "segment"
  }, [n.comment ? e("comment", {
    attrs: {
      comment: n.comment,
      commentObj: n.commentObj
    }
  }) : n._e(), n._m(0), e("div", {
    staticClass: "segment"
  }, [e("div", {
    staticClass: "text-skin-fragment"
  }, [e("label", {
    staticClass: "condition p-1"
  }, [n._v("[" + n._s(n.condition) + "]")])]), n.blockInIfBlock ? e("block", {
    style: {
      paddingLeft: `${n.offsetX}px`
    },
    attrs: {
      context: n.blockInIfBlock,
      selfCallIndent: n.selfCallIndent
    }
  }) : n._e()], 1)], 1), n._l(n.alt.elseIfBlock(), function(r, s) {
    return [e("div", {
      key: s + 500,
      staticClass: "segment mt-2 border-t border-solid"
    }, [e("div", {
      key: s + 1e3,
      staticClass: "text-skin-fragment"
    }, [e("label", {
      staticClass: "else-if hidden"
    }, [n._v("else if")]), e("label", {
      staticClass: "condition p-1"
    }, [n._v("[" + n._s(n.conditionFromIfElseBlock(r)) + "]")])]), e("block", {
      key: s + 2e3,
      style: {
        paddingLeft: `${n.offsetX}px`
      },
      attrs: {
        context: n.blockInElseIfBlock(r),
        selfCallIndent: n.selfCallIndent
      }
    })], 1)];
  }), n.elseBlock ? [e("div", {
    staticClass: "segment mt-2 border-t border-solid"
  }, [n._m(1), e("block", {
    style: {
      paddingLeft: `${n.offsetX}px`
    },
    attrs: {
      context: n.elseBlock,
      selfCallIndent: n.selfCallIndent
    }
  })], 1)] : n._e()], 2);
}, hb = [function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    staticClass: "header bg-skin-fragment-header text-skin-fragment-header text-base leading-4 rounded-t"
  }, [e("div", {
    staticClass: "name font-semibold p-1 border-b"
  }, [e("label", {
    staticClass: "p-0"
  }, [n._v("Alt")])])]);
}, function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    staticClass: "text-skin-fragment"
  }, [e("label", {
    staticClass: "p-1"
  }, [n._v("[else]")])]);
}];
const fb = {
  name: "fragment-alt",
  props: ["context", "comment", "selfCallIndent", "commentObj"],
  mixins: [zr],
  computed: {
    from: function() {
      return this.context.Origin();
    },
    alt: function() {
      return this.context.alt();
    },
    blockInIfBlock: function() {
      var n, t, e;
      return (e = (t = (n = this.alt) == null ? void 0 : n.ifBlock()) == null ? void 0 : t.braceBlock()) == null ? void 0 : e.block();
    },
    condition: function() {
      var n;
      return this.conditionFromIfElseBlock((n = this.alt) == null ? void 0 : n.ifBlock());
    },
    elseBlock: function() {
      var n, t, e;
      return (e = (t = (n = this.alt) == null ? void 0 : n.elseBlock()) == null ? void 0 : t.braceBlock()) == null ? void 0 : e.block();
    }
  },
  methods: {
    conditionFromIfElseBlock(n) {
      var t, e;
      return (e = (t = n == null ? void 0 : n.parExpr()) == null ? void 0 : t.condition()) == null ? void 0 : e.getFormattedText();
    },
    blockInElseIfBlock(n) {
      var t;
      return (t = n == null ? void 0 : n.braceBlock()) == null ? void 0 : t.block();
    }
  },
  components: {
    Block: () => Promise.resolve().then(() => Kr),
    Comment: () => Promise.resolve().then(() => qr)
  }
}, x0 = {};
var db = /* @__PURE__ */ et(
  fb,
  ub,
  hb,
  !1,
  pb,
  "fcaaa9a6",
  null,
  null
);
function pb(n) {
  for (let t in x0)
    this[t] = x0[t];
}
const gb = /* @__PURE__ */ function() {
  return db.exports;
}();
var xb = function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    staticClass: "fragment par border-skin-fragment rounded",
    style: n.fragmentStyle
  }, [n.comment ? e("comment", {
    attrs: {
      comment: n.comment
    }
  }) : n._e(), n._m(0), e("block", {
    style: {
      paddingLeft: `${n.offsetX}px`
    },
    attrs: {
      context: n.par.braceBlock().block(),
      selfCallIndent: n.selfCallIndent
    }
  })], 1);
}, mb = [function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    staticClass: "header bg-skin-fragment-header text-skin-fragment-header text-base leading-4 rounded-t"
  }, [e("div", {
    staticClass: "name font-semibold p-1 border-b"
  }, [e("label", [n._v("Par")])])]);
}];
const _b = {
  name: "fragment-par",
  props: ["context", "comment", "selfCallIndent"],
  mixins: [zr],
  computed: {
    from: function() {
      return this.context.Origin();
    },
    par: function() {
      return this.context.par();
    }
  },
  components: {
    Block: () => Promise.resolve().then(() => Kr),
    Comment: () => Promise.resolve().then(() => qr)
  }
}, m0 = {};
var Lb = /* @__PURE__ */ et(
  _b,
  xb,
  mb,
  !1,
  vb,
  "18096432",
  null,
  null
);
function vb(n) {
  for (let t in m0)
    this[t] = m0[t];
}
const yb = /* @__PURE__ */ function() {
  return Lb.exports;
}();
var Cb = function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    staticClass: "fragment loop border-skin-fragment rounded",
    style: n.fragmentStyle
  }, [n.comment ? e("comment", {
    attrs: {
      comment: n.comment
    }
  }) : n._e(), n._m(0), e("div", {
    staticClass: "segment"
  }, [e("div", {
    staticClass: "text-skin-fragment"
  }, [e("label", {
    staticClass: "condition p-1"
  }, [n._v("[" + n._s(n.condition) + "]")])]), e("block", {
    style: {
      paddingLeft: `${n.offsetX}px`
    },
    attrs: {
      context: n.blockInLoop,
      selfCallIndent: n.selfCallIndent
    }
  })], 1)], 1);
}, Eb = [function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    staticClass: "header text-skin-fragment-header bg-skin-fragment-header text-base leading-4"
  }, [e("div", {
    staticClass: "name font-semibold p-1 border-b"
  }, [e("label", {
    staticClass: "p-0"
  }, [n._v("Loop")])])]);
}];
const bb = {
  name: "fragment-loop",
  props: ["context", "comment", "selfCallIndent"],
  mixins: [zr],
  computed: {
    from: function() {
      return this.context.Origin();
    },
    loop: function() {
      return this.context.loop();
    },
    blockInLoop: function() {
      var n, t;
      return (t = (n = this.loop) == null ? void 0 : n.braceBlock()) == null ? void 0 : t.block();
    },
    condition: function() {
      var n, t, e;
      return (e = (t = (n = this.loop) == null ? void 0 : n.parExpr()) == null ? void 0 : t.condition()) == null ? void 0 : e.getFormattedText();
    }
  },
  components: {
    Block: () => Promise.resolve().then(() => Kr),
    Comment: () => Promise.resolve().then(() => qr)
  }
}, _0 = {};
var wb = /* @__PURE__ */ et(
  bb,
  Cb,
  Eb,
  !1,
  Tb,
  "601e8030",
  null,
  null
);
function Tb(n) {
  for (let t in _0)
    this[t] = _0[t];
}
const Ab = /* @__PURE__ */ function() {
  return wb.exports;
}();
var Sb = function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    staticClass: "fragment opt border-skin-fragment rounded",
    style: n.fragmentStyle
  }, [n.comment ? e("comment", {
    attrs: {
      comment: n.comment
    }
  }) : n._e(), n._m(0), e("block", {
    style: {
      paddingLeft: `${n.offsetX}px`
    },
    attrs: {
      context: n.opt.braceBlock().block(),
      selfCallIndent: n.selfCallIndent
    }
  })], 1);
}, Rb = [function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    staticClass: "header bg-skin-fragment-header text-skin-fragment-header text-base leading-4"
  }, [e("div", {
    staticClass: "name font-semibold p-1 border-b"
  }, [e("label", [n._v("Opt")])])]);
}];
const kb = {
  name: "fragment-opt",
  props: ["context", "comment", "selfCallIndent"],
  mixins: [zr],
  computed: {
    from: function() {
      return this.context.Origin();
    },
    opt: function() {
      return this.context.opt();
    }
  },
  components: {
    Block: () => Promise.resolve().then(() => Kr),
    Comment: () => Promise.resolve().then(() => qr)
  }
}, L0 = {};
var Ob = /* @__PURE__ */ et(
  kb,
  Sb,
  Rb,
  !1,
  Nb,
  "38884dbf",
  null,
  null
);
function Nb(n) {
  for (let t in L0)
    this[t] = L0[t];
}
const Ib = /* @__PURE__ */ function() {
  return Ob.exports;
}();
var Mb = function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    staticClass: "fragment tcf border-skin-fragment rounded",
    style: n.fragmentStyle
  }, [e("div", {
    staticClass: "segment"
  }, [n.comment ? e("comment", {
    attrs: {
      comment: n.comment
    }
  }) : n._e(), n._m(0), n.blockInTryBlock ? e("block", {
    style: {
      paddingLeft: `${n.offsetX}px`
    },
    attrs: {
      context: n.blockInTryBlock,
      selfCallIndent: n.selfCallIndent
    }
  }) : n._e()], 1), n._l(n.tcf.catchBlock(), function(r, s) {
    return [e("div", {
      key: s + 500,
      staticClass: "segment mt-2 border-t border-solid"
    }, [e("div", {
      key: s + 1e3,
      staticClass: "header text-skin-fragment"
    }, [e("label", {
      staticClass: "keyword catch p-1"
    }, [n._v("catch")]), e("label", {
      staticClass: "exception p-1"
    }, [n._v(n._s(n.exception(r)))])]), e("block", {
      key: s + 2e3,
      style: {
        paddingLeft: `${n.offsetX}px`
      },
      attrs: {
        context: n.blockInCatchBlock(r),
        selfCallIndent: n.selfCallIndent
      }
    })], 1)];
  }), n.finallyBlock ? [e("div", {
    staticClass: "segment mt-2 border-t border-solid"
  }, [n._m(1), e("block", {
    style: {
      paddingLeft: `${n.offsetX}px`
    },
    attrs: {
      context: n.finallyBlock,
      selfCallIndent: n.selfCallIndent
    }
  })], 1)] : n._e()], 2);
}, Pb = [function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    staticClass: "header bg-skin-fragment-header text-skin-fragment-header text-base leading-4 rounded-t"
  }, [e("div", {
    staticClass: "name font-semibold p-1 border-b"
  }, [e("label", [n._v("Try")])])]);
}, function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    staticClass: "header text-skin-fragment finally"
  }, [e("label", {
    staticClass: "keyword finally p-1"
  }, [n._v("finally")])]);
}];
const $b = {
  name: "fragment-tcf",
  props: ["context", "comment", "selfCallIndent"],
  mixins: [zr],
  computed: {
    from: function() {
      return this.context.Origin();
    },
    tcf: function() {
      return this.context.tcf();
    },
    blockInTryBlock: function() {
      var n, t, e;
      return (e = (t = (n = this.tcf) == null ? void 0 : n.tryBlock()) == null ? void 0 : t.braceBlock()) == null ? void 0 : e.block();
    },
    finallyBlock: function() {
      var n, t, e;
      return (e = (t = (n = this.tcf) == null ? void 0 : n.finallyBlock()) == null ? void 0 : t.braceBlock()) == null ? void 0 : e.block();
    }
  },
  methods: {
    exception(n) {
      var t;
      return (t = n == null ? void 0 : n.invocation()) == null ? void 0 : t.parameters().getText();
    },
    blockInCatchBlock(n) {
      var t;
      return (t = n == null ? void 0 : n.braceBlock()) == null ? void 0 : t.block();
    }
  },
  components: {
    Block: () => Promise.resolve().then(() => Kr),
    Comment: () => Promise.resolve().then(() => qr)
  }
}, v0 = {};
var Db = /* @__PURE__ */ et(
  $b,
  Mb,
  Pb,
  !1,
  Fb,
  "0fdf26b4",
  null,
  null
);
function Fb(n) {
  for (let t in v0)
    this[t] = v0[t];
}
const Bb = /* @__PURE__ */ function() {
  return Db.exports;
}();
var Ub = function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    staticClass: "interaction return relative",
    class: {
      "right-to-left": n.rightToLeft,
      highlight: n.isCurrent
    },
    style: {
      width: n.width + "px",
      left: n.left + "px"
    },
    attrs: {
      "data-signature": n.signature
    },
    on: {
      click: function(r) {
        return r.stopPropagation(), n.onClick.apply(null, arguments);
      }
    }
  }, [n.comment ? e("comment", {
    attrs: {
      comment: n.comment
    }
  }) : n._e(), n.isSelf ? e("div", {
    staticClass: "flex items-center"
  }, [e("svg", {
    staticClass: "w-3 h-3 flex-shrink-0 fill-current m-1",
    attrs: {
      viewBox: "0 0 512 512"
    }
  }, [e("path", {
    staticClass: "cls-1",
    attrs: {
      d: "M256 0C114.84 0 0 114.84 0 256s114.84 256 256 256 256-114.84 256-256S397.16 0 256 0Zm0 469.33c-117.63 0-213.33-95.7-213.33-213.33S138.37 42.67 256 42.67 469.33 138.37 469.33 256 373.63 469.33 256 469.33Z"
    }
  }), e("path", {
    staticClass: "cls-1",
    attrs: {
      d: "M288 192h-87.16l27.58-27.58a21.33 21.33 0 1 0-30.17-30.17l-64 64a21.33 21.33 0 0 0 0 30.17l64 64a21.33 21.33 0 0 0 30.17-30.17l-27.58-27.58H288a53.33 53.33 0 0 1 0 106.67h-32a21.33 21.33 0 0 0 0 42.66h32a96 96 0 0 0 0-192Z"
    }
  })]), e("span", {
    staticClass: "name text-sm"
  }, [n._v(n._s(n.signature))])]) : n._e(), n.isSelf ? n._e() : e("Message", {
    attrs: {
      content: n.signature,
      rtl: n.rightToLeft,
      type: "return"
    }
  })], 1);
}, Hb = [];
const Gb = {
  name: "return",
  props: ["context", "comment"],
  computed: {
    ...Ht(["distance", "cursor", "onElementClick"]),
    from: function() {
      return this.context.Origin();
    },
    asyncMessage: function() {
      var n;
      return (n = this.context) == null ? void 0 : n.ret().asyncMessage();
    },
    width: function() {
      return this.isSelf ? qs(this.signature, Hn.MessageContent) : Math.abs(this.distance(this.target, this.source));
    },
    left: function() {
      return this.rightToLeft ? this.distance(this.target, this.from) + 2 : this.distance(this.source, this.from) + 2;
    },
    rightToLeft: function() {
      return this.distance(this.target, this.source) < 0;
    },
    signature: function() {
      var n, t, e, r, s;
      return ((t = (n = this.asyncMessage) == null ? void 0 : n.content()) == null ? void 0 : t.getFormattedText()) || ((s = (r = (e = this.context) == null ? void 0 : e.ret()) == null ? void 0 : r.expr()) == null ? void 0 : s.getFormattedText());
    },
    source: function() {
      var n, t;
      return ((t = (n = this.asyncMessage) == null ? void 0 : n.from()) == null ? void 0 : t.getFormattedText()) || this.from;
    },
    target: function() {
      var n, t, e, r;
      return ((t = (n = this.asyncMessage) == null ? void 0 : n.to()) == null ? void 0 : t.getFormattedText()) || ((r = (e = this.context) == null ? void 0 : e.ret()) == null ? void 0 : r.ReturnTo());
    },
    isCurrent: function() {
      return !1;
    },
    isSelf: function() {
      return this.source === this.target;
    }
  },
  methods: {
    onClick() {
      this.onElementClick(Jn.from(this.context));
    }
  },
  components: {
    Comment: Wr,
    Message: Zr
  }
}, y0 = {};
var jb = /* @__PURE__ */ et(
  Gb,
  Ub,
  Hb,
  !1,
  Vb,
  null,
  null,
  null
);
function Vb(n) {
  for (let t in y0)
    this[t] = y0[t];
}
const zb = /* @__PURE__ */ function() {
  return jb.exports;
}();
var Zb = function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    staticClass: "divider",
    style: {
      width: n.width + "px",
      transform: "translateX(" + (-1 * n.centerOfFrom + 10) + "px)"
    }
  }, [e("div", {
    staticClass: "left bg-skin-divider"
  }), e("div", {
    staticClass: "name"
  }, [n._v(n._s(n.name))]), e("div", {
    staticClass: "right bg-skin-divider"
  })]);
}, Wb = [];
const qb = {
  name: "divider",
  props: ["context"],
  computed: {
    ...Ht(["participants", "centerOf"]),
    width() {
      let n = this.participants.Names().pop();
      return this.centerOf(n) + 10;
    },
    from: function() {
      return this.context.Origin();
    },
    centerOfFrom() {
      return this.centerOf(this.from);
    },
    name: function() {
      return this.context.divider().Note();
    }
  }
}, C0 = {};
var Kb = /* @__PURE__ */ et(
  qb,
  Zb,
  Wb,
  !1,
  Yb,
  "83993fee",
  null,
  null
);
function Yb(n) {
  for (let t in C0)
    this[t] = C0[t];
}
const Xb = /* @__PURE__ */ function() {
  return Kb.exports;
}();
class Qb {
  constructor(t) {
    const e = t.split(`
`);
    this.color = e.find((s) => s.trimStart().startsWith("[red]")) ? "red" : void 0;
    const r = e.map((s) => s.replace("[red]", ""));
    this.text = r.join(`
`), this.text = this.text.trimEnd();
  }
}
var Jb = function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e(n.subStatement, {
    tag: "component",
    staticClass: "text-left text-sm text-skin-message",
    attrs: {
      context: n.context,
      comment: n.comment,
      commentObj: n.commentObj,
      selfCallIndent: n.selfCallIndent
    }
  });
}, tw = [];
const ew = {
  name: "statement",
  props: ["context", "selfCallIndent"],
  computed: {
    comment: function() {
      return this.context.getComment() ? this.context.getComment() : "";
    },
    commentObj: function() {
      return new Qb(this.comment);
    },
    subStatement: function() {
      let n = this, t = {
        loop: "FragmentLoop",
        alt: "FragmentAlt",
        par: "FragmentPar",
        opt: "FragmentOpt",
        tcf: "FragmentTryCatchFinally",
        creation: "Creation",
        message: "Interaction",
        asyncMessage: "InteractionAsync",
        divider: "Divider",
        ret: "Return"
      }, e = Object.keys(t).find((r) => n.context[r]() !== null);
      return t[e];
    }
  },
  components: {
    Creation: BE,
    Interaction: XE,
    InteractionAsync: cb,
    FragmentAlt: gb,
    FragmentPar: yb,
    FragmentOpt: Ib,
    FragmentTryCatchFinally: Bb,
    FragmentLoop: Ab,
    Divider: Xb,
    Return: zb
  }
}, E0 = {};
var nw = /* @__PURE__ */ et(
  ew,
  Jb,
  tw,
  !1,
  rw,
  null,
  null,
  null
);
function rw(n) {
  for (let t in E0)
    this[t] = E0[t];
}
const sw = /* @__PURE__ */ function() {
  return nw.exports;
}();
var iw = function() {
  var n = this, t = n.$createElement, e = n._self._c || t;
  return e("div", {
    staticClass: "block"
  }, n._l(n.statements, function(r, s) {
    return e("div", {
      key: s,
      staticClass: "statement-container mt-1"
    }, [e("statement", {
      attrs: {
        context: r,
        selfCallIndent: n.selfCallIndent
      }
    })], 1);
  }), 0);
}, ow = [];
const aw = {
  name: "block",
  props: ["context", "selfCallIndent"],
  computed: {
    statements: function() {
      var n;
      return (n = this.context) == null ? void 0 : n.stat();
    }
  },
  components: {
    Statement: sw
  }
}, b0 = {};
var lw = /* @__PURE__ */ et(
  aw,
  iw,
  ow,
  !1,
  cw,
  null,
  null,
  null
);
function cw(n) {
  for (let t in b0)
    this[t] = b0[t];
}
const R2 = /* @__PURE__ */ function() {
  return lw.exports;
}(), Kr = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: R2
}, Symbol.toStringTag, { value: "Module" })), uw = kr.child({ name: "core" });
gt.component("Block", R2);
gt.use(Du);
class Tw {
  constructor(t, e = !1) {
    this.el = t, this.store = m_(), this.app = new gt({
      el: this.el,
      store: new Du.Store(this.store),
      render: (r) => r(e ? a2 : Ky)
    });
  }
  async render(t, e) {
    return uw.debug("rendering", t, e), this._code = t || this._code, this._theme = e || this._theme, this.store.state.theme = this._theme || "default", await this.app.$store.dispatch("updateCode", { code: this._code }), Promise.resolve(this);
  }
  get code() {
    return this._code;
  }
  get theme() {
    return this._theme;
  }
}
export {
  Tw as default
};
