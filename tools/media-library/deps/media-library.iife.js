var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var MediaLibrary = function(exports) {
  var _a;
  "use strict";
  /**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
  const t$4 = globalThis, e$5 = t$4.ShadowRoot && (void 0 === t$4.ShadyCSS || t$4.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, s$5 = Symbol(), o$6 = /* @__PURE__ */ new WeakMap();
  let n$5 = class n {
    constructor(t2, e2, o2) {
      if (this._$cssResult$ = true, o2 !== s$5)
        throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
      this.cssText = t2, this.t = e2;
    }
    get styleSheet() {
      let t2 = this.o;
      const s2 = this.t;
      if (e$5 && void 0 === t2) {
        const e2 = void 0 !== s2 && 1 === s2.length;
        e2 && (t2 = o$6.get(s2)), void 0 === t2 && ((this.o = t2 = new CSSStyleSheet()).replaceSync(this.cssText), e2 && o$6.set(s2, t2));
      }
      return t2;
    }
    toString() {
      return this.cssText;
    }
  };
  const r$5 = (t2) => new n$5("string" == typeof t2 ? t2 : t2 + "", void 0, s$5), i$5 = (t2, ...e2) => {
    const o2 = 1 === t2.length ? t2[0] : e2.reduce((e3, s2, o3) => e3 + ((t3) => {
      if (true === t3._$cssResult$)
        return t3.cssText;
      if ("number" == typeof t3)
        return t3;
      throw Error("Value passed to 'css' function must be a 'css' function result: " + t3 + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
    })(s2) + t2[o3 + 1], t2[0]);
    return new n$5(o2, t2, s$5);
  }, S$2 = (s2, o2) => {
    if (e$5)
      s2.adoptedStyleSheets = o2.map((t2) => t2 instanceof CSSStyleSheet ? t2 : t2.styleSheet);
    else
      for (const e2 of o2) {
        const o3 = document.createElement("style"), n2 = t$4.litNonce;
        void 0 !== n2 && o3.setAttribute("nonce", n2), o3.textContent = e2.cssText, s2.appendChild(o3);
      }
  }, c$5 = e$5 ? (t2) => t2 : (t2) => t2 instanceof CSSStyleSheet ? ((t3) => {
    let e2 = "";
    for (const s2 of t3.cssRules)
      e2 += s2.cssText;
    return r$5(e2);
  })(t2) : t2;
  /**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
  const { is: i$4, defineProperty: e$4, getOwnPropertyDescriptor: h$4, getOwnPropertyNames: r$4, getOwnPropertySymbols: o$5, getPrototypeOf: n$4 } = Object, a$2 = globalThis, c$4 = a$2.trustedTypes, l$2 = c$4 ? c$4.emptyScript : "", p$3 = a$2.reactiveElementPolyfillSupport, d$2 = (t2, s2) => t2, u$4 = { toAttribute(t2, s2) {
    switch (s2) {
      case Boolean:
        t2 = t2 ? l$2 : null;
        break;
      case Object:
      case Array:
        t2 = null == t2 ? t2 : JSON.stringify(t2);
    }
    return t2;
  }, fromAttribute(t2, s2) {
    let i2 = t2;
    switch (s2) {
      case Boolean:
        i2 = null !== t2;
        break;
      case Number:
        i2 = null === t2 ? null : Number(t2);
        break;
      case Object:
      case Array:
        try {
          i2 = JSON.parse(t2);
        } catch (t3) {
          i2 = null;
        }
    }
    return i2;
  } }, f$4 = (t2, s2) => !i$4(t2, s2), b$1 = { attribute: true, type: String, converter: u$4, reflect: false, useDefault: false, hasChanged: f$4 };
  Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), a$2.litPropertyMetadata ?? (a$2.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
  let y$2 = class y extends HTMLElement {
    static addInitializer(t2) {
      this._$Ei(), (this.l ?? (this.l = [])).push(t2);
    }
    static get observedAttributes() {
      return this.finalize(), this._$Eh && [...this._$Eh.keys()];
    }
    static createProperty(t2, s2 = b$1) {
      if (s2.state && (s2.attribute = false), this._$Ei(), this.prototype.hasOwnProperty(t2) && ((s2 = Object.create(s2)).wrapped = true), this.elementProperties.set(t2, s2), !s2.noAccessor) {
        const i2 = Symbol(), h2 = this.getPropertyDescriptor(t2, i2, s2);
        void 0 !== h2 && e$4(this.prototype, t2, h2);
      }
    }
    static getPropertyDescriptor(t2, s2, i2) {
      const { get: e2, set: r2 } = h$4(this.prototype, t2) ?? { get() {
        return this[s2];
      }, set(t3) {
        this[s2] = t3;
      } };
      return { get: e2, set(s3) {
        const h2 = e2 == null ? void 0 : e2.call(this);
        r2 == null ? void 0 : r2.call(this, s3), this.requestUpdate(t2, h2, i2);
      }, configurable: true, enumerable: true };
    }
    static getPropertyOptions(t2) {
      return this.elementProperties.get(t2) ?? b$1;
    }
    static _$Ei() {
      if (this.hasOwnProperty(d$2("elementProperties")))
        return;
      const t2 = n$4(this);
      t2.finalize(), void 0 !== t2.l && (this.l = [...t2.l]), this.elementProperties = new Map(t2.elementProperties);
    }
    static finalize() {
      if (this.hasOwnProperty(d$2("finalized")))
        return;
      if (this.finalized = true, this._$Ei(), this.hasOwnProperty(d$2("properties"))) {
        const t3 = this.properties, s2 = [...r$4(t3), ...o$5(t3)];
        for (const i2 of s2)
          this.createProperty(i2, t3[i2]);
      }
      const t2 = this[Symbol.metadata];
      if (null !== t2) {
        const s2 = litPropertyMetadata.get(t2);
        if (void 0 !== s2)
          for (const [t3, i2] of s2)
            this.elementProperties.set(t3, i2);
      }
      this._$Eh = /* @__PURE__ */ new Map();
      for (const [t3, s2] of this.elementProperties) {
        const i2 = this._$Eu(t3, s2);
        void 0 !== i2 && this._$Eh.set(i2, t3);
      }
      this.elementStyles = this.finalizeStyles(this.styles);
    }
    static finalizeStyles(s2) {
      const i2 = [];
      if (Array.isArray(s2)) {
        const e2 = new Set(s2.flat(1 / 0).reverse());
        for (const s3 of e2)
          i2.unshift(c$5(s3));
      } else
        void 0 !== s2 && i2.push(c$5(s2));
      return i2;
    }
    static _$Eu(t2, s2) {
      const i2 = s2.attribute;
      return false === i2 ? void 0 : "string" == typeof i2 ? i2 : "string" == typeof t2 ? t2.toLowerCase() : void 0;
    }
    constructor() {
      super(), this._$Ep = void 0, this.isUpdatePending = false, this.hasUpdated = false, this._$Em = null, this._$Ev();
    }
    _$Ev() {
      var _a2;
      this._$ES = new Promise((t2) => this.enableUpdating = t2), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (_a2 = this.constructor.l) == null ? void 0 : _a2.forEach((t2) => t2(this));
    }
    addController(t2) {
      var _a2;
      (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(t2), void 0 !== this.renderRoot && this.isConnected && ((_a2 = t2.hostConnected) == null ? void 0 : _a2.call(t2));
    }
    removeController(t2) {
      var _a2;
      (_a2 = this._$EO) == null ? void 0 : _a2.delete(t2);
    }
    _$E_() {
      const t2 = /* @__PURE__ */ new Map(), s2 = this.constructor.elementProperties;
      for (const i2 of s2.keys())
        this.hasOwnProperty(i2) && (t2.set(i2, this[i2]), delete this[i2]);
      t2.size > 0 && (this._$Ep = t2);
    }
    createRenderRoot() {
      const t2 = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
      return S$2(t2, this.constructor.elementStyles), t2;
    }
    connectedCallback() {
      var _a2;
      this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(true), (_a2 = this._$EO) == null ? void 0 : _a2.forEach((t2) => {
        var _a3;
        return (_a3 = t2.hostConnected) == null ? void 0 : _a3.call(t2);
      });
    }
    enableUpdating(t2) {
    }
    disconnectedCallback() {
      var _a2;
      (_a2 = this._$EO) == null ? void 0 : _a2.forEach((t2) => {
        var _a3;
        return (_a3 = t2.hostDisconnected) == null ? void 0 : _a3.call(t2);
      });
    }
    attributeChangedCallback(t2, s2, i2) {
      this._$AK(t2, i2);
    }
    _$ET(t2, s2) {
      var _a2;
      const i2 = this.constructor.elementProperties.get(t2), e2 = this.constructor._$Eu(t2, i2);
      if (void 0 !== e2 && true === i2.reflect) {
        const h2 = (void 0 !== ((_a2 = i2.converter) == null ? void 0 : _a2.toAttribute) ? i2.converter : u$4).toAttribute(s2, i2.type);
        this._$Em = t2, null == h2 ? this.removeAttribute(e2) : this.setAttribute(e2, h2), this._$Em = null;
      }
    }
    _$AK(t2, s2) {
      var _a2, _b;
      const i2 = this.constructor, e2 = i2._$Eh.get(t2);
      if (void 0 !== e2 && this._$Em !== e2) {
        const t3 = i2.getPropertyOptions(e2), h2 = "function" == typeof t3.converter ? { fromAttribute: t3.converter } : void 0 !== ((_a2 = t3.converter) == null ? void 0 : _a2.fromAttribute) ? t3.converter : u$4;
        this._$Em = e2;
        const r2 = h2.fromAttribute(s2, t3.type);
        this[e2] = r2 ?? ((_b = this._$Ej) == null ? void 0 : _b.get(e2)) ?? r2, this._$Em = null;
      }
    }
    requestUpdate(t2, s2, i2) {
      var _a2;
      if (void 0 !== t2) {
        const e2 = this.constructor, h2 = this[t2];
        if (i2 ?? (i2 = e2.getPropertyOptions(t2)), !((i2.hasChanged ?? f$4)(h2, s2) || i2.useDefault && i2.reflect && h2 === ((_a2 = this._$Ej) == null ? void 0 : _a2.get(t2)) && !this.hasAttribute(e2._$Eu(t2, i2))))
          return;
        this.C(t2, s2, i2);
      }
      false === this.isUpdatePending && (this._$ES = this._$EP());
    }
    C(t2, s2, { useDefault: i2, reflect: e2, wrapped: h2 }, r2) {
      i2 && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(t2) && (this._$Ej.set(t2, r2 ?? s2 ?? this[t2]), true !== h2 || void 0 !== r2) || (this._$AL.has(t2) || (this.hasUpdated || i2 || (s2 = void 0), this._$AL.set(t2, s2)), true === e2 && this._$Em !== t2 && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(t2));
    }
    async _$EP() {
      this.isUpdatePending = true;
      try {
        await this._$ES;
      } catch (t3) {
        Promise.reject(t3);
      }
      const t2 = this.scheduleUpdate();
      return null != t2 && await t2, !this.isUpdatePending;
    }
    scheduleUpdate() {
      return this.performUpdate();
    }
    performUpdate() {
      var _a2;
      if (!this.isUpdatePending)
        return;
      if (!this.hasUpdated) {
        if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
          for (const [t4, s3] of this._$Ep)
            this[t4] = s3;
          this._$Ep = void 0;
        }
        const t3 = this.constructor.elementProperties;
        if (t3.size > 0)
          for (const [s3, i2] of t3) {
            const { wrapped: t4 } = i2, e2 = this[s3];
            true !== t4 || this._$AL.has(s3) || void 0 === e2 || this.C(s3, void 0, i2, e2);
          }
      }
      let t2 = false;
      const s2 = this._$AL;
      try {
        t2 = this.shouldUpdate(s2), t2 ? (this.willUpdate(s2), (_a2 = this._$EO) == null ? void 0 : _a2.forEach((t3) => {
          var _a3;
          return (_a3 = t3.hostUpdate) == null ? void 0 : _a3.call(t3);
        }), this.update(s2)) : this._$EM();
      } catch (s3) {
        throw t2 = false, this._$EM(), s3;
      }
      t2 && this._$AE(s2);
    }
    willUpdate(t2) {
    }
    _$AE(t2) {
      var _a2;
      (_a2 = this._$EO) == null ? void 0 : _a2.forEach((t3) => {
        var _a3;
        return (_a3 = t3.hostUpdated) == null ? void 0 : _a3.call(t3);
      }), this.hasUpdated || (this.hasUpdated = true, this.firstUpdated(t2)), this.updated(t2);
    }
    _$EM() {
      this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = false;
    }
    get updateComplete() {
      return this.getUpdateComplete();
    }
    getUpdateComplete() {
      return this._$ES;
    }
    shouldUpdate(t2) {
      return true;
    }
    update(t2) {
      this._$Eq && (this._$Eq = this._$Eq.forEach((t3) => this._$ET(t3, this[t3]))), this._$EM();
    }
    updated(t2) {
    }
    firstUpdated(t2) {
    }
  };
  y$2.elementStyles = [], y$2.shadowRootOptions = { mode: "open" }, y$2[d$2("elementProperties")] = /* @__PURE__ */ new Map(), y$2[d$2("finalized")] = /* @__PURE__ */ new Map(), p$3 == null ? void 0 : p$3({ ReactiveElement: y$2 }), (a$2.reactiveElementVersions ?? (a$2.reactiveElementVersions = [])).push("2.1.1");
  /**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
  const t$3 = globalThis, i$3 = t$3.trustedTypes, s$4 = i$3 ? i$3.createPolicy("lit-html", { createHTML: (t2) => t2 }) : void 0, e$3 = "$lit$", h$3 = `lit$${Math.random().toFixed(9).slice(2)}$`, o$4 = "?" + h$3, n$3 = `<${o$4}>`, r$3 = document, l$1 = () => r$3.createComment(""), c$3 = (t2) => null === t2 || "object" != typeof t2 && "function" != typeof t2, a$1 = Array.isArray, u$3 = (t2) => a$1(t2) || "function" == typeof (t2 == null ? void 0 : t2[Symbol.iterator]), d$1 = "[ 	\n\f\r]", f$3 = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, v$2 = /-->/g, _$1 = />/g, m$2 = RegExp(`>|${d$1}(?:([^\\s"'>=/]+)(${d$1}*=${d$1}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), p$2 = /'/g, g$1 = /"/g, $$1 = /^(?:script|style|textarea|title)$/i, y$1 = (t2) => (i2, ...s2) => ({ _$litType$: t2, strings: i2, values: s2 }), x$1 = y$1(1), T$1 = Symbol.for("lit-noChange"), E$1 = Symbol.for("lit-nothing"), A$1 = /* @__PURE__ */ new WeakMap(), C$1 = r$3.createTreeWalker(r$3, 129);
  function P$1(t2, i2) {
    if (!a$1(t2) || !t2.hasOwnProperty("raw"))
      throw Error("invalid template strings array");
    return void 0 !== s$4 ? s$4.createHTML(i2) : i2;
  }
  const V$1 = (t2, i2) => {
    const s2 = t2.length - 1, o2 = [];
    let r2, l2 = 2 === i2 ? "<svg>" : 3 === i2 ? "<math>" : "", c2 = f$3;
    for (let i3 = 0; i3 < s2; i3++) {
      const s3 = t2[i3];
      let a2, u2, d2 = -1, y2 = 0;
      for (; y2 < s3.length && (c2.lastIndex = y2, u2 = c2.exec(s3), null !== u2); )
        y2 = c2.lastIndex, c2 === f$3 ? "!--" === u2[1] ? c2 = v$2 : void 0 !== u2[1] ? c2 = _$1 : void 0 !== u2[2] ? ($$1.test(u2[2]) && (r2 = RegExp("</" + u2[2], "g")), c2 = m$2) : void 0 !== u2[3] && (c2 = m$2) : c2 === m$2 ? ">" === u2[0] ? (c2 = r2 ?? f$3, d2 = -1) : void 0 === u2[1] ? d2 = -2 : (d2 = c2.lastIndex - u2[2].length, a2 = u2[1], c2 = void 0 === u2[3] ? m$2 : '"' === u2[3] ? g$1 : p$2) : c2 === g$1 || c2 === p$2 ? c2 = m$2 : c2 === v$2 || c2 === _$1 ? c2 = f$3 : (c2 = m$2, r2 = void 0);
      const x2 = c2 === m$2 && t2[i3 + 1].startsWith("/>") ? " " : "";
      l2 += c2 === f$3 ? s3 + n$3 : d2 >= 0 ? (o2.push(a2), s3.slice(0, d2) + e$3 + s3.slice(d2) + h$3 + x2) : s3 + h$3 + (-2 === d2 ? i3 : x2);
    }
    return [P$1(t2, l2 + (t2[s2] || "<?>") + (2 === i2 ? "</svg>" : 3 === i2 ? "</math>" : "")), o2];
  };
  let N$1 = class N2 {
    constructor({ strings: t2, _$litType$: s2 }, n2) {
      let r2;
      this.parts = [];
      let c2 = 0, a2 = 0;
      const u2 = t2.length - 1, d2 = this.parts, [f2, v2] = V$1(t2, s2);
      if (this.el = N2.createElement(f2, n2), C$1.currentNode = this.el.content, 2 === s2 || 3 === s2) {
        const t3 = this.el.content.firstChild;
        t3.replaceWith(...t3.childNodes);
      }
      for (; null !== (r2 = C$1.nextNode()) && d2.length < u2; ) {
        if (1 === r2.nodeType) {
          if (r2.hasAttributes())
            for (const t3 of r2.getAttributeNames())
              if (t3.endsWith(e$3)) {
                const i2 = v2[a2++], s3 = r2.getAttribute(t3).split(h$3), e2 = /([.?@])?(.*)/.exec(i2);
                d2.push({ type: 1, index: c2, name: e2[2], strings: s3, ctor: "." === e2[1] ? H$1 : "?" === e2[1] ? I$1 : "@" === e2[1] ? L$1 : k$1 }), r2.removeAttribute(t3);
              } else
                t3.startsWith(h$3) && (d2.push({ type: 6, index: c2 }), r2.removeAttribute(t3));
          if ($$1.test(r2.tagName)) {
            const t3 = r2.textContent.split(h$3), s3 = t3.length - 1;
            if (s3 > 0) {
              r2.textContent = i$3 ? i$3.emptyScript : "";
              for (let i2 = 0; i2 < s3; i2++)
                r2.append(t3[i2], l$1()), C$1.nextNode(), d2.push({ type: 2, index: ++c2 });
              r2.append(t3[s3], l$1());
            }
          }
        } else if (8 === r2.nodeType)
          if (r2.data === o$4)
            d2.push({ type: 2, index: c2 });
          else {
            let t3 = -1;
            for (; -1 !== (t3 = r2.data.indexOf(h$3, t3 + 1)); )
              d2.push({ type: 7, index: c2 }), t3 += h$3.length - 1;
          }
        c2++;
      }
    }
    static createElement(t2, i2) {
      const s2 = r$3.createElement("template");
      return s2.innerHTML = t2, s2;
    }
  };
  function S$1(t2, i2, s2 = t2, e2) {
    var _a2, _b;
    if (i2 === T$1)
      return i2;
    let h2 = void 0 !== e2 ? (_a2 = s2._$Co) == null ? void 0 : _a2[e2] : s2._$Cl;
    const o2 = c$3(i2) ? void 0 : i2._$litDirective$;
    return (h2 == null ? void 0 : h2.constructor) !== o2 && ((_b = h2 == null ? void 0 : h2._$AO) == null ? void 0 : _b.call(h2, false), void 0 === o2 ? h2 = void 0 : (h2 = new o2(t2), h2._$AT(t2, s2, e2)), void 0 !== e2 ? (s2._$Co ?? (s2._$Co = []))[e2] = h2 : s2._$Cl = h2), void 0 !== h2 && (i2 = S$1(t2, h2._$AS(t2, i2.values), h2, e2)), i2;
  }
  let M$2 = class M {
    constructor(t2, i2) {
      this._$AV = [], this._$AN = void 0, this._$AD = t2, this._$AM = i2;
    }
    get parentNode() {
      return this._$AM.parentNode;
    }
    get _$AU() {
      return this._$AM._$AU;
    }
    u(t2) {
      const { el: { content: i2 }, parts: s2 } = this._$AD, e2 = ((t2 == null ? void 0 : t2.creationScope) ?? r$3).importNode(i2, true);
      C$1.currentNode = e2;
      let h2 = C$1.nextNode(), o2 = 0, n2 = 0, l2 = s2[0];
      for (; void 0 !== l2; ) {
        if (o2 === l2.index) {
          let i3;
          2 === l2.type ? i3 = new R$1(h2, h2.nextSibling, this, t2) : 1 === l2.type ? i3 = new l2.ctor(h2, l2.name, l2.strings, this, t2) : 6 === l2.type && (i3 = new z$1(h2, this, t2)), this._$AV.push(i3), l2 = s2[++n2];
        }
        o2 !== (l2 == null ? void 0 : l2.index) && (h2 = C$1.nextNode(), o2++);
      }
      return C$1.currentNode = r$3, e2;
    }
    p(t2) {
      let i2 = 0;
      for (const s2 of this._$AV)
        void 0 !== s2 && (void 0 !== s2.strings ? (s2._$AI(t2, s2, i2), i2 += s2.strings.length - 2) : s2._$AI(t2[i2])), i2++;
    }
  };
  let R$1 = class R2 {
    get _$AU() {
      var _a2;
      return ((_a2 = this._$AM) == null ? void 0 : _a2._$AU) ?? this._$Cv;
    }
    constructor(t2, i2, s2, e2) {
      this.type = 2, this._$AH = E$1, this._$AN = void 0, this._$AA = t2, this._$AB = i2, this._$AM = s2, this.options = e2, this._$Cv = (e2 == null ? void 0 : e2.isConnected) ?? true;
    }
    get parentNode() {
      let t2 = this._$AA.parentNode;
      const i2 = this._$AM;
      return void 0 !== i2 && 11 === (t2 == null ? void 0 : t2.nodeType) && (t2 = i2.parentNode), t2;
    }
    get startNode() {
      return this._$AA;
    }
    get endNode() {
      return this._$AB;
    }
    _$AI(t2, i2 = this) {
      t2 = S$1(this, t2, i2), c$3(t2) ? t2 === E$1 || null == t2 || "" === t2 ? (this._$AH !== E$1 && this._$AR(), this._$AH = E$1) : t2 !== this._$AH && t2 !== T$1 && this._(t2) : void 0 !== t2._$litType$ ? this.$(t2) : void 0 !== t2.nodeType ? this.T(t2) : u$3(t2) ? this.k(t2) : this._(t2);
    }
    O(t2) {
      return this._$AA.parentNode.insertBefore(t2, this._$AB);
    }
    T(t2) {
      this._$AH !== t2 && (this._$AR(), this._$AH = this.O(t2));
    }
    _(t2) {
      this._$AH !== E$1 && c$3(this._$AH) ? this._$AA.nextSibling.data = t2 : this.T(r$3.createTextNode(t2)), this._$AH = t2;
    }
    $(t2) {
      var _a2;
      const { values: i2, _$litType$: s2 } = t2, e2 = "number" == typeof s2 ? this._$AC(t2) : (void 0 === s2.el && (s2.el = N$1.createElement(P$1(s2.h, s2.h[0]), this.options)), s2);
      if (((_a2 = this._$AH) == null ? void 0 : _a2._$AD) === e2)
        this._$AH.p(i2);
      else {
        const t3 = new M$2(e2, this), s3 = t3.u(this.options);
        t3.p(i2), this.T(s3), this._$AH = t3;
      }
    }
    _$AC(t2) {
      let i2 = A$1.get(t2.strings);
      return void 0 === i2 && A$1.set(t2.strings, i2 = new N$1(t2)), i2;
    }
    k(t2) {
      a$1(this._$AH) || (this._$AH = [], this._$AR());
      const i2 = this._$AH;
      let s2, e2 = 0;
      for (const h2 of t2)
        e2 === i2.length ? i2.push(s2 = new R2(this.O(l$1()), this.O(l$1()), this, this.options)) : s2 = i2[e2], s2._$AI(h2), e2++;
      e2 < i2.length && (this._$AR(s2 && s2._$AB.nextSibling, e2), i2.length = e2);
    }
    _$AR(t2 = this._$AA.nextSibling, i2) {
      var _a2;
      for ((_a2 = this._$AP) == null ? void 0 : _a2.call(this, false, true, i2); t2 !== this._$AB; ) {
        const i3 = t2.nextSibling;
        t2.remove(), t2 = i3;
      }
    }
    setConnected(t2) {
      var _a2;
      void 0 === this._$AM && (this._$Cv = t2, (_a2 = this._$AP) == null ? void 0 : _a2.call(this, t2));
    }
  };
  let k$1 = class k {
    get tagName() {
      return this.element.tagName;
    }
    get _$AU() {
      return this._$AM._$AU;
    }
    constructor(t2, i2, s2, e2, h2) {
      this.type = 1, this._$AH = E$1, this._$AN = void 0, this.element = t2, this.name = i2, this._$AM = e2, this.options = h2, s2.length > 2 || "" !== s2[0] || "" !== s2[1] ? (this._$AH = Array(s2.length - 1).fill(new String()), this.strings = s2) : this._$AH = E$1;
    }
    _$AI(t2, i2 = this, s2, e2) {
      const h2 = this.strings;
      let o2 = false;
      if (void 0 === h2)
        t2 = S$1(this, t2, i2, 0), o2 = !c$3(t2) || t2 !== this._$AH && t2 !== T$1, o2 && (this._$AH = t2);
      else {
        const e3 = t2;
        let n2, r2;
        for (t2 = h2[0], n2 = 0; n2 < h2.length - 1; n2++)
          r2 = S$1(this, e3[s2 + n2], i2, n2), r2 === T$1 && (r2 = this._$AH[n2]), o2 || (o2 = !c$3(r2) || r2 !== this._$AH[n2]), r2 === E$1 ? t2 = E$1 : t2 !== E$1 && (t2 += (r2 ?? "") + h2[n2 + 1]), this._$AH[n2] = r2;
      }
      o2 && !e2 && this.j(t2);
    }
    j(t2) {
      t2 === E$1 ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t2 ?? "");
    }
  };
  let H$1 = class H extends k$1 {
    constructor() {
      super(...arguments), this.type = 3;
    }
    j(t2) {
      this.element[this.name] = t2 === E$1 ? void 0 : t2;
    }
  };
  let I$1 = class I extends k$1 {
    constructor() {
      super(...arguments), this.type = 4;
    }
    j(t2) {
      this.element.toggleAttribute(this.name, !!t2 && t2 !== E$1);
    }
  };
  let L$1 = class L extends k$1 {
    constructor(t2, i2, s2, e2, h2) {
      super(t2, i2, s2, e2, h2), this.type = 5;
    }
    _$AI(t2, i2 = this) {
      if ((t2 = S$1(this, t2, i2, 0) ?? E$1) === T$1)
        return;
      const s2 = this._$AH, e2 = t2 === E$1 && s2 !== E$1 || t2.capture !== s2.capture || t2.once !== s2.once || t2.passive !== s2.passive, h2 = t2 !== E$1 && (s2 === E$1 || e2);
      e2 && this.element.removeEventListener(this.name, this, s2), h2 && this.element.addEventListener(this.name, this, t2), this._$AH = t2;
    }
    handleEvent(t2) {
      var _a2;
      "function" == typeof this._$AH ? this._$AH.call(((_a2 = this.options) == null ? void 0 : _a2.host) ?? this.element, t2) : this._$AH.handleEvent(t2);
    }
  };
  let z$1 = class z {
    constructor(t2, i2, s2) {
      this.element = t2, this.type = 6, this._$AN = void 0, this._$AM = i2, this.options = s2;
    }
    get _$AU() {
      return this._$AM._$AU;
    }
    _$AI(t2) {
      S$1(this, t2);
    }
  };
  const Z$1 = { M: e$3, P: h$3, A: o$4, C: 1, L: V$1, R: M$2, D: u$3, V: S$1, I: R$1, H: k$1, N: I$1, U: L$1, B: H$1, F: z$1 }, j$1 = t$3.litHtmlPolyfillSupport;
  j$1 == null ? void 0 : j$1(N$1, R$1), (t$3.litHtmlVersions ?? (t$3.litHtmlVersions = [])).push("3.3.1");
  const B$1 = (t2, i2, s2) => {
    const e2 = (s2 == null ? void 0 : s2.renderBefore) ?? i2;
    let h2 = e2._$litPart$;
    if (void 0 === h2) {
      const t3 = (s2 == null ? void 0 : s2.renderBefore) ?? null;
      e2._$litPart$ = h2 = new R$1(i2.insertBefore(l$1(), t3), t3, void 0, s2 ?? {});
    }
    return h2._$AI(t2), h2;
  };
  /**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
  const s$3 = globalThis;
  let i$2 = class i extends y$2 {
    constructor() {
      super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
    }
    createRenderRoot() {
      var _a2;
      const t2 = super.createRenderRoot();
      return (_a2 = this.renderOptions).renderBefore ?? (_a2.renderBefore = t2.firstChild), t2;
    }
    update(t2) {
      const r2 = this.render();
      this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t2), this._$Do = B$1(r2, this.renderRoot, this.renderOptions);
    }
    connectedCallback() {
      var _a2;
      super.connectedCallback(), (_a2 = this._$Do) == null ? void 0 : _a2.setConnected(true);
    }
    disconnectedCallback() {
      var _a2;
      super.disconnectedCallback(), (_a2 = this._$Do) == null ? void 0 : _a2.setConnected(false);
    }
    render() {
      return T$1;
    }
  };
  i$2._$litElement$ = true, i$2["finalized"] = true, (_a = s$3.litElementHydrateSupport) == null ? void 0 : _a.call(s$3, { LitElement: i$2 });
  const o$3 = s$3.litElementPolyfillSupport;
  o$3 == null ? void 0 : o$3({ LitElement: i$2 });
  (s$3.litElementVersions ?? (s$3.litElementVersions = [])).push("4.2.1");
  const enTranslations = {
    common: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      cancel: "Cancel",
      save: "Save",
      "delete": "Delete",
      edit: "Edit",
      close: "Close",
      search: "Search",
      filter: "Filter",
      clear: "Clear",
      all: "All"
    },
    COMMON: {
      FILTER: "Filter"
    },
    mediaLibrary: {
      title: "Media Library",
      searchPlaceholder: "Search media, doc:path, folder:path, or / for root files...",
      searchDisabledDuringScan: "Search disabled during scan...",
      noResults: "No media found",
      loadingMedia: "Loading media...",
      scanProgress: "Scanning {{current}} of {{total}} pages...",
      scanStarting: "Starting scan...",
      scanComplete: "Scan complete! Found {{count}} media files.",
      scanning: "Scanning...",
      scanButton: "Scan Media",
      manualSitemap: "Manual Sitemap URL",
      sitemapPlaceholder: "Enter sitemap URL manually",
      analysisEnabled: "Analysis ON",
      analysisDisabled: "Analysis OFF",
      analysisTooltip: "Toggle EXIF data extraction (camera info, date taken, natural dimensions) - OFF for faster scanning"
    },
    filters: {
      all: "All Media",
      images: "Images",
      videos: "Videos",
      documents: "Documents",
      links: "Links",
      icons: "SVGs",
      missingAlt: "Missing Alt Text",
      decorative: "Decorative",
      filled: "With Alt Text",
      unused: "Unused",
      landscape: "Landscape",
      portrait: "Portrait",
      square: "Square",
      lcpCandidate: "LCP Candidates",
      aboveFold: "Above Fold",
      belowFold: "Below Fold",
      needsOptimization: "Needs Optimization",
      fullyOptimized: "Fully Optimized",
      noSrcset: "No Srcset",
      hasSrcset: "Has Srcset",
      legacyFormat: "Legacy Format",
      modernFormat: "Modern Format",
      noLazyLoading: "No Lazy Loading",
      lazyLoading: "Lazy Loading",
      socialImage: "Social Images",
      ogImage: "OG Images",
      performanceIssue: "Performance Issues",
      screenshots: "Graphics & UI",
      logos: "Logos",
      "people-photos": "People",
      products: "Products",
      "404-media": "404 Media"
    },
    views: {
      grid: "Grid View",
      list: "List View"
    },
    categories: {
      title: "Categories",
      "hero-banner": "Hero/Banner",
      "team-member": "Team/People",
      testimonials: "Testimonials",
      "navigation-ui": "Navigation/UI",
      "article-content": "Article/Content",
      "product-service": "Product/Service",
      "decorative-background": "Decorative/Background",
      "social-sharing": "Social/Sharing",
      "document-pdf": "Document/PDF",
      "logo-brand": "Logo/Brand",
      "screenshot-demo": "Screenshot/Demo"
    },
    media: {
      altText: "Alt Text",
      fileName: "File Name",
      fileSize: "File Size",
      lastModified: "Last Modified",
      usedIn: "Used in {{count}} documents",
      notUsed: "Not used",
      copyUrl: "Copy URL",
      copyImage: "Copy Image",
      download: "Download",
      editAltText: "Edit Alt Text"
    },
    units: {
      bytes: "bytes",
      KB: "KB",
      MB: "MB",
      GB: "GB"
    },
    errors: {
      loadFailed: "Failed to load media data",
      scanFailed: "Failed to scan media",
      saveFailed: "Failed to save changes",
      networkError: "Network error occurred",
      invalidSource: "Invalid source URL",
      parseError: "Failed to parse data"
    }
  };
  const esTranslations = {
    common: {
      loading: "Cargando...",
      error: "Error",
      success: "Éxito",
      cancel: "Cancelar",
      save: "Guardar",
      "delete": "Eliminar",
      edit: "Editar",
      close: "Cerrar",
      search: "Buscar",
      filter: "Filtrar",
      clear: "Limpiar",
      all: "Todos"
    },
    COMMON: {
      FILTER: "Filtrar"
    },
    mediaLibrary: {
      title: "Biblioteca de Medios",
      searchPlaceholder: "Buscar medios, doc:ruta, folder:ruta, o / para archivos raíz...",
      noResults: "No se encontraron medios",
      loadingMedia: "Cargando medios...",
      scanProgress: "Escaneando {{current}} de {{total}} páginas...",
      scanStarting: "Iniciando escaneo...",
      scanComplete: "¡Escaneo completo! Se encontraron {{count}} archivos de medios.",
      scanning: "Escaneando...",
      scanButton: "Escanear Medios",
      manualSitemap: "URL de Sitemap Manual",
      sitemapPlaceholder: "Ingrese la URL del sitemap manualmente",
      analysisEnabled: "Análisis ON",
      analysisDisabled: "Análisis OFF",
      analysisTooltip: "Alternar análisis de imagen (orientación, categorización, datos EXIF) - ON por defecto para mejor categorización"
    },
    filters: {
      all: "Todos los Medios",
      images: "Imágenes",
      videos: "Videos",
      documents: "Documentos",
      links: "Enlaces",
      icons: "SVGs",
      missingAlt: "Falta Texto Alt",
      decorative: "Decorativo",
      filled: "Con Texto Alt",
      unused: "No Utilizado",
      landscape: "Horizontal",
      portrait: "Vertical",
      square: "Cuadrado",
      lcpCandidate: "Candidatos LCP",
      aboveFold: "Arriba del Pliegue",
      belowFold: "Debajo del Pliegue",
      needsOptimization: "Necesita Optimización",
      fullyOptimized: "Totalmente Optimizado",
      noSrcset: "Sin Srcset",
      hasSrcset: "Con Srcset",
      legacyFormat: "Formato Legacy",
      modernFormat: "Formato Moderno",
      noLazyLoading: "Sin Carga Perezosa",
      lazyLoading: "Carga Perezosa",
      socialImage: "Imágenes Sociales",
      ogImage: "Imágenes OG",
      performanceIssue: "Problemas de Rendimiento",
      screenshots: "Capturas de Pantalla",
      logos: "Logotipos",
      "people-photos": "Fotos de Personas",
      products: "Productos",
      "404-media": "Medios 404"
    },
    views: {
      grid: "Vista de Cuadrícula",
      list: "Vista de Lista"
    },
    categories: {
      title: "Categorías",
      "hero-banner": "Hero/Banner",
      "team-member": "Equipo/Personas",
      testimonials: "Testimonios",
      "navigation-ui": "Navegación/UI",
      "article-content": "Artículo/Contenido",
      "product-service": "Producto/Servicio",
      "decorative-background": "Decorativo/Fondo",
      "social-sharing": "Social/Compartir",
      "document-pdf": "Documento/PDF",
      "logo-brand": "Logo/Marca",
      "screenshot-demo": "Captura/Demo"
    },
    media: {
      altText: "Texto Alt",
      fileName: "Nombre del Archivo",
      fileSize: "Tamaño del Archivo",
      lastModified: "Última Modificación",
      usedIn: "Usado en {{count}} documentos",
      notUsed: "No usado",
      copyUrl: "Copiar URL",
      copyImage: "Copiar Imagen",
      download: "Descargar",
      editAltText: "Editar Texto Alt"
    },
    units: {
      bytes: "bytes",
      KB: "KB",
      MB: "MB",
      GB: "GB"
    },
    errors: {
      loadFailed: "Error al cargar datos de medios",
      scanFailed: "Error al escanear medios",
      saveFailed: "Error al guardar cambios",
      networkError: "Error de red",
      invalidSource: "URL de origen inválida",
      parseError: "Error al analizar datos"
    }
  };
  const deTranslations = {
    common: {
      loading: "Laden...",
      error: "Fehler",
      success: "Erfolg",
      cancel: "Abbrechen",
      save: "Speichern",
      "delete": "Löschen",
      edit: "Bearbeiten",
      close: "Schließen",
      search: "Suchen",
      filter: "Filtern",
      clear: "Löschen",
      all: "Alle"
    },
    COMMON: {
      FILTER: "Filtern"
    },
    mediaLibrary: {
      title: "Medienbibliothek",
      searchPlaceholder: "Medien suchen, doc:pfad, folder:pfad, oder / für Root-Dateien...",
      noResults: "Keine Medien gefunden",
      loadingMedia: "Medien werden geladen...",
      scanProgress: "Scanne {{current}} von {{total}} Seiten...",
      scanStarting: "Scan wird gestartet...",
      scanComplete: "Scan abgeschlossen! {{count}} Mediendateien gefunden.",
      scanning: "Scannen...",
      scanButton: "Medien Scannen",
      manualSitemap: "Manuelle Sitemap-URL",
      sitemapPlaceholder: "Sitemap-URL manuell eingeben",
      analysisEnabled: "Analyse AN",
      analysisDisabled: "Analyse AUS",
      analysisTooltip: "Bildanalyse umschalten (Orientierung, Kategorisierung, EXIF-Daten) - Standardmäßig AN für bessere Kategorisierung"
    },
    filters: {
      all: "Alle Medien",
      images: "Bilder",
      videos: "Videos",
      documents: "Dokumente",
      links: "Links",
      icons: "SVGs",
      missingAlt: "Fehlender Alt-Text",
      decorative: "Dekorativ",
      filled: "Mit Alt-Text",
      unused: "Ungenutzt",
      landscape: "Querformat",
      portrait: "Hochformat",
      square: "Quadratisch",
      lcpCandidate: "LCP-Kandidaten",
      aboveFold: "Oberhalb der Falz",
      belowFold: "Unterhalb der Falz",
      needsOptimization: "Optimierung erforderlich",
      fullyOptimized: "Vollständig optimiert",
      noSrcset: "Kein Srcset",
      hasSrcset: "Mit Srcset",
      legacyFormat: "Legacy-Format",
      modernFormat: "Modernes Format",
      noLazyLoading: "Kein Lazy Loading",
      lazyLoading: "Lazy Loading",
      socialImage: "Social Images",
      ogImage: "OG Images",
      performanceIssue: "Leistungsprobleme",
      screenshots: "Screenshots",
      logos: "Logos",
      "people-photos": "Personenfotos",
      products: "Produkte",
      "404-media": "404-Medien"
    },
    views: {
      grid: "Rasteransicht",
      list: "Listenansicht"
    },
    categories: {
      title: "Kategorien",
      "hero-banner": "Hero/Banner",
      "team-member": "Team/Personen",
      testimonials: "Testimonials",
      "navigation-ui": "Navigation/UI",
      "article-content": "Artikel/Inhalt",
      "product-service": "Produkt/Service",
      "decorative-background": "Dekorativ/Hintergrund",
      "social-sharing": "Social/Teilen",
      "document-pdf": "Dokument/PDF",
      "logo-brand": "Logo/Marke",
      "screenshot-demo": "Screenshot/Demo"
    },
    media: {
      altText: "Alt-Text",
      fileName: "Dateiname",
      fileSize: "Dateigröße",
      lastModified: "Zuletzt geändert",
      usedIn: "Verwendet in {{count}} Dokumenten",
      notUsed: "Nicht verwendet",
      copyUrl: "URL kopieren",
      copyImage: "Bild kopieren",
      download: "Herunterladen",
      editAltText: "Alt-Text bearbeiten"
    },
    units: {
      bytes: "Bytes",
      KB: "KB",
      MB: "MB",
      GB: "GB"
    },
    errors: {
      loadFailed: "Fehler beim Laden der Mediendaten",
      scanFailed: "Fehler beim Scannen der Medien",
      saveFailed: "Fehler beim Speichern der Änderungen",
      networkError: "Netzwerkfehler aufgetreten",
      invalidSource: "Ungültige Quell-URL",
      parseError: "Fehler beim Analysieren der Daten"
    }
  };
  const frTranslations = {
    common: {
      loading: "Chargement...",
      error: "Erreur",
      success: "Succès",
      cancel: "Annuler",
      save: "Enregistrer",
      "delete": "Supprimer",
      edit: "Modifier",
      close: "Fermer",
      search: "Rechercher",
      filter: "Filtrer",
      clear: "Effacer",
      all: "Tous"
    },
    COMMON: {
      FILTER: "Filtrer"
    },
    mediaLibrary: {
      title: "Bibliothèque de Médias",
      searchPlaceholder: "Rechercher des médias, doc:chemin, folder:chemin, ou / pour fichiers racine...",
      noResults: "Aucun média trouvé",
      loadingMedia: "Chargement des médias...",
      scanProgress: "Analyse de {{current}} sur {{total}} pages...",
      scanStarting: "Démarrage de l'analyse...",
      scanComplete: "Analyse terminée ! {{count}} fichiers multimédias trouvés.",
      scanning: "Analyse en cours...",
      scanButton: "Analyser les Médias",
      manualSitemap: "URL de Sitemap Manuelle",
      sitemapPlaceholder: "Saisir l'URL du sitemap manuellement",
      analysisEnabled: "Analyse ON",
      analysisDisabled: "Analyse OFF",
      analysisTooltip: "Basculer l'analyse d'image (orientation, catégorisation, données EXIF) - ON par défaut pour une meilleure catégorisation"
    },
    filters: {
      all: "Tous les Médias",
      images: "Images",
      videos: "Vidéos",
      documents: "Documents",
      links: "Liens",
      icons: "SVGs",
      missingAlt: "Texte Alt Manquant",
      decorative: "Décoratif",
      filled: "Avec Texte Alt",
      unused: "Non Utilisé",
      landscape: "Paysage",
      portrait: "Portrait",
      square: "Carré",
      lcpCandidate: "Candidats LCP",
      aboveFold: "Au-dessus du Pli",
      belowFold: "En-dessous du Pli",
      needsOptimization: "Nécessite une Optimisation",
      fullyOptimized: "Entièrement Optimisé",
      noSrcset: "Pas de Srcset",
      hasSrcset: "Avec Srcset",
      legacyFormat: "Format Legacy",
      modernFormat: "Format Moderne",
      noLazyLoading: "Pas de Lazy Loading",
      lazyLoading: "Lazy Loading",
      socialImage: "Images Sociales",
      ogImage: "Images OG",
      performanceIssue: "Problèmes de Performance",
      screenshots: "Captures d'Écran",
      logos: "Logos",
      "people-photos": "Photos de Personnes",
      products: "Produits",
      "404-media": "Médias 404"
    },
    views: {
      grid: "Vue Grille",
      list: "Vue Liste"
    },
    categories: {
      title: "Catégories",
      "hero-banner": "Hero/Bannière",
      "team-member": "Équipe/Personnes",
      testimonials: "Témoignages",
      "navigation-ui": "Navigation/UI",
      "article-content": "Article/Contenu",
      "product-service": "Produit/Service",
      "decorative-background": "Décoratif/Arrière-plan",
      "social-sharing": "Social/Partage",
      "document-pdf": "Document/PDF",
      "logo-brand": "Logo/Marque",
      "screenshot-demo": "Capture/Démo"
    },
    media: {
      altText: "Texte Alt",
      fileName: "Nom du Fichier",
      fileSize: "Taille du Fichier",
      lastModified: "Dernière Modification",
      usedIn: "Utilisé dans {{count}} documents",
      notUsed: "Non utilisé",
      copyUrl: "Copier l'URL",
      copyImage: "Copier l'Image",
      download: "Télécharger",
      editAltText: "Modifier le Texte Alt"
    },
    units: {
      bytes: "octets",
      KB: "Ko",
      MB: "Mo",
      GB: "Go"
    },
    errors: {
      loadFailed: "Échec du chargement des données multimédias",
      scanFailed: "Échec de l'analyse des médias",
      saveFailed: "Échec de l'enregistrement des modifications",
      networkError: "Erreur réseau survenue",
      invalidSource: "URL source invalide",
      parseError: "Échec de l'analyse des données"
    }
  };
  class I18nManager extends EventTarget {
    constructor() {
      super();
      this.currentLocale = "en";
      this.translations = /* @__PURE__ */ new Map();
      this.fallbackLocale = "en";
      this.translations.set("en", enTranslations);
      this.translations.set("es", esTranslations);
      this.translations.set("de", deTranslations);
      this.translations.set("fr", frTranslations);
    }
    async loadLocale(locale) {
      if (this.translations.has(locale)) {
        return this.translations.get(locale);
      }
      try {
        if (locale === "en") {
          this.translations.set(locale, enTranslations);
          return enTranslations;
        }
        if (locale === "es") {
          this.translations.set(locale, esTranslations);
          return esTranslations;
        }
        if (locale === "de") {
          this.translations.set(locale, deTranslations);
          return deTranslations;
        }
        if (locale === "fr") {
          this.translations.set(locale, frTranslations);
          return frTranslations;
        }
        return this.translations.get(this.fallbackLocale) || {};
      } catch (error) {
        return this.translations.get(this.fallbackLocale) || {};
      }
    }
    setLocale(locale) {
      this.currentLocale = locale;
      this.dispatchEvent(new CustomEvent("locale-changed", { detail: { locale } }));
    }
    t(key, params = {}) {
      const translations = this.translations.get(this.currentLocale) || {};
      let translation = this.getNestedValue(translations, key);
      if (!translation) {
        const fallbackTranslations = this.translations.get(this.fallbackLocale) || {};
        translation = this.getNestedValue(fallbackTranslations, key);
      }
      if (!translation) {
        return key;
      }
      return this.replaceParams(translation, params);
    }
    getNestedValue(obj, path) {
      return path.split(".").reduce((current, key) => current == null ? void 0 : current[key], obj);
    }
    replaceParams(str, params) {
      return str.replace(/\{\{(\w+)\}\}/g, (match, key) => params[key] || match);
    }
    formatNumber(number, options = {}) {
      return new Intl.NumberFormat(this.currentLocale, options).format(number);
    }
    formatDate(date, options = {}) {
      return new Intl.DateTimeFormat(this.currentLocale, options).format(date);
    }
    formatFileSize(bytes) {
      const units = ["bytes", "KB", "MB", "GB"];
      const k2 = 1024;
      const i2 = Math.floor(Math.log(bytes) / Math.log(k2));
      const size = parseFloat((bytes / k2 ** i2).toFixed(2));
      return `${size} ${this.t(`units.${units[i2]}`)}`;
    }
  }
  const i18n = new I18nManager();
  class LocalizableElement extends i$2 {
    constructor() {
      super();
      __publicField(this, "handleLocaleChange", () => {
        this.requestUpdate();
      });
      this.t = i18n.t.bind(i18n);
      this.formatNumber = i18n.formatNumber.bind(i18n);
      this.formatDate = i18n.formatDate.bind(i18n);
      this.formatFileSize = i18n.formatFileSize.bind(i18n);
    }
    connectedCallback() {
      super.connectedCallback();
      i18n.addEventListener("locale-changed", this.handleLocaleChange);
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      i18n.removeEventListener("locale-changed", this.handleLocaleChange);
    }
  }
  class Logger {
    constructor() {
      this.logLevel = this.getLogLevel();
      this.isDevelopment = this.isDevelopmentEnvironment();
    }
    getLogLevel() {
      var _a2;
      const envLevel = typeof process !== "undefined" && ((_a2 = process.env) == null ? void 0 : _a2.LOG_LEVEL);
      if (envLevel) {
        return envLevel.toLowerCase();
      }
      return this.isDevelopmentEnvironment() ? "debug" : "info";
    }
    isDevelopmentEnvironment() {
      var _a2, _b, _c;
      return typeof window !== "undefined" && ((_a2 = window.location) == null ? void 0 : _a2.hostname) === "localhost" || typeof process !== "undefined" && ((_b = process.env) == null ? void 0 : _b.NODE_ENV) === "development" || typeof process !== "undefined" && ((_c = process.env) == null ? void 0 : _c.NODE_ENV) === "dev";
    }
    shouldLog(level) {
      const levels = ["error", "warn", "info", "debug"];
      const currentLevelIndex = levels.indexOf(this.logLevel);
      const messageLevelIndex = levels.indexOf(level);
      return messageLevelIndex <= currentLevelIndex;
    }
    error(message, ...args) {
      if (this.shouldLog("error")) {
        console.error(`[ERROR] ${message}`, ...args);
      }
    }
    warn(message, ...args) {
      if (this.shouldLog("warn")) {
        console.warn(`[WARN] ${message}`, ...args);
      }
    }
    info(message, ...args) {
      if (this.shouldLog("info")) {
        console.info(`[INFO] ${message}`, ...args);
      }
    }
    debug(message, ...args) {
      if (this.shouldLog("debug")) {
        console.debug(`[DEBUG] ${message}`, ...args);
      }
    }
    log(message, ...args) {
      this.info(message, ...args);
    }
    logWithContext(context, level, message, ...args) {
      const contextMessage = `[${context}] ${message}`;
      this[level](contextMessage, ...args);
    }
    setLogLevel(level) {
      const validLevels = ["error", "warn", "info", "debug"];
      if (validLevels.includes(level.toLowerCase())) {
        this.logLevel = level.toLowerCase();
      } else {
        this.warn(`Invalid log level: ${level}. Valid levels are: ${validLevels.join(", ")}`);
      }
    }
    setEnabled(enabled) {
      this.enabled = enabled;
    }
    createContextLogger(context) {
      return {
        error: (message, ...args) => this.logWithContext(context, "error", message, ...args),
        warn: (message, ...args) => this.logWithContext(context, "warn", message, ...args),
        info: (message, ...args) => this.logWithContext(context, "info", message, ...args),
        debug: (message, ...args) => this.logWithContext(context, "debug", message, ...args),
        log: (message, ...args) => this.logWithContext(context, "info", message, ...args)
      };
    }
  }
  const logger = new Logger();
  class R2API {
    constructor(config) {
      this.apiUrl = config.apiUrl;
    }
    async putObject(key, data) {
      const response = await fetch(`${this.apiUrl}/api/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, data })
      });
      if (!response.ok) {
        throw new Error(`R2 API PUT failed: ${response.status} ${response.statusText}`);
      }
      return response.json();
    }
    async getObject(key) {
      const response = await fetch(`${this.apiUrl}/api/load?key=${encodeURIComponent(key)}`, { method: "GET" });
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`R2 API GET failed: ${response.status} ${response.statusText}`);
      }
      return response.json();
    }
    async deleteObject(key) {
      const response = await fetch(`${this.apiUrl}/api/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key })
      });
      if (!response.ok) {
        throw new Error(`R2 API DELETE failed: ${response.status} ${response.statusText}`);
      }
      return response.json();
    }
    async listObjects(prefix = "") {
      const response = await fetch(`${this.apiUrl}/api/list?prefix=${encodeURIComponent(prefix)}`, { method: "GET" });
      if (!response.ok) {
        throw new Error(`R2 API LIST failed: ${response.status} ${response.statusText}`);
      }
      const result = await response.json();
      return result.objects || [];
    }
    async batchSave(mediaUsages, mode = "preview") {
      const response = await fetch(`${this.apiUrl}/api/batch-save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaUsages, mode })
      });
      if (!response.ok) {
        throw new Error(`R2 API BATCH SAVE failed: ${response.status} ${response.statusText}`);
      }
      return response.json();
    }
    async batchLoad(keys) {
      const response = await fetch(`${this.apiUrl}/api/batch-load`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys })
      });
      if (!response.ok) {
        throw new Error(`R2 API BATCH LOAD failed: ${response.status} ${response.statusText}`);
      }
      const result = await response.json();
      return result.results || [];
    }
    async batchDelete(keys) {
      const response = await fetch(`${this.apiUrl}/api/batch-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys })
      });
      if (!response.ok) {
        throw new Error(`R2 API BATCH DELETE failed: ${response.status} ${response.statusText}`);
      }
      return response.json();
    }
  }
  function chunkArray$1(array, chunkSize) {
    const chunks = [];
    for (let i2 = 0; i2 < array.length; i2 += chunkSize) {
      chunks.push(array.slice(i2, i2 + chunkSize));
    }
    return chunks;
  }
  class R2Storage {
    constructor(type = "r2", siteKey = null) {
      this.type = type;
      this.siteKey = siteKey;
      this.mode = "live";
      this.isDestroyed = false;
      const apiUrl = "https://r2-api-worker.kiran-murugulla.workers.dev";
      this.r2API = new R2API({ apiUrl });
    }
    async saveMediaUsages(mediaUsages, mode = "live") {
      if (this.isDestroyed) {
        throw new Error("R2Storage instance has been destroyed");
      }
      try {
        const batchSize = 100;
        const batches = chunkArray$1(mediaUsages, batchSize);
        for (let i2 = 0; i2 < batches.length; i2 += 1) {
          const batch = batches[i2];
          try {
            await this.r2API.batchSave(batch, mode);
            await new Promise((resolve) => {
              setTimeout(resolve, 10);
            });
          } catch (error) {
            logger.error(`Failed to save batch ${i2 + 1}:`, error);
            throw error;
          }
        }
      } catch (error) {
        logger.error("Failed to save media usages to R2:", error);
        throw error;
      }
    }
    async loadMediaUsages(mode = null) {
      const actualMode = mode === null ? this.mode : mode;
      try {
        const hashFiles = await this.r2API.listObjects(`${actualMode}/`);
        const jsonFiles = hashFiles.filter((filename) => filename.endsWith(".json"));
        if (jsonFiles.length === 0) {
          return [];
        }
        const batchSize = 100;
        const batches = chunkArray$1(jsonFiles, batchSize);
        const mediaUsages = [];
        for (let i2 = 0; i2 < batches.length; i2 += 1) {
          const batch = batches[i2];
          try {
            const batchResults = await this.r2API.batchLoad(batch);
            const validResults = batchResults.filter((result) => result !== null);
            mediaUsages.push(...validResults);
            await new Promise((resolve) => {
              setTimeout(resolve, 10);
            });
          } catch (error) {
            logger.error(`Failed to load batch ${i2 + 1}:`, error);
          }
        }
        return mediaUsages;
      } catch (error) {
        logger.error("Failed to load media usages from R2:", error);
        return [];
      }
    }
    async loadMediaUsagesProgressive(mode = null, batchSize = 100, onProgress = null) {
      const actualMode = mode === null ? this.mode : mode;
      try {
        const hashFiles = await this.r2API.listObjects(`${actualMode}/`);
        const jsonFiles = hashFiles.filter((filename) => filename.endsWith(".json"));
        if (jsonFiles.length === 0) {
          return [];
        }
        const mediaUsages = [];
        const batches = chunkArray$1(jsonFiles, batchSize);
        for (let i2 = 0; i2 < batches.length; i2 += 1) {
          const batch = batches[i2];
          try {
            const batchResults = await this.r2API.batchLoad(batch);
            const validResults = batchResults.filter((result) => result !== null);
            mediaUsages.push(...validResults);
            if (onProgress) {
              onProgress((i2 + 1) / batches.length * 100);
            }
            await new Promise((resolve) => {
              setTimeout(resolve, 10);
            });
          } catch (error) {
            logger.error(`Failed to load batch ${i2 + 1}:`, error);
          }
        }
        return mediaUsages;
      } catch (error) {
        logger.error("Failed to load media usages progressively from R2:", error);
        return [];
      }
    }
    async saveMediaUsage(mediaUsage, mode = "live") {
      try {
        const filename = `${mediaUsage.hash}.json`;
        await this.r2API.putObject(`${mode}/${filename}`, mediaUsage);
      } catch (error) {
        logger.error("Failed to save media usage to R2:", error);
        throw error;
      }
    }
    async loadMediaUsage(hash, mode = "live") {
      try {
        const filename = `${hash}.json`;
        return await this.r2API.getObject(`${mode}/${filename}`);
      } catch (error) {
        logger.error("Failed to load media usage from R2:", error);
        return null;
      }
    }
    async updateMediaUsage(hash, updatedUsage, mode = "live") {
      try {
        const filename = `${hash}.json`;
        await this.r2API.putObject(`${mode}/${filename}`, updatedUsage);
      } catch (error) {
        logger.error("Failed to update media usage in R2:", error);
        throw error;
      }
    }
    async deleteMediaUsage(hash, mode = "live") {
      try {
        const filename = `${hash}.json`;
        await this.r2API.deleteObject(`${mode}/${filename}`);
      } catch (error) {
        logger.error("Failed to delete media usage from R2:", error);
        throw error;
      }
    }
    async handleIncrementalChanges(changes, mode = "live") {
      try {
        const operations = [];
        for (const usage of changes.addedUsages || []) {
          operations.push(this.saveMediaUsage(usage, mode));
        }
        for (const usage of changes.updatedUsages || []) {
          operations.push(this.updateMediaUsage(usage.hash, usage, mode));
        }
        for (const usage of changes.deletedUsages || []) {
          operations.push(this.deleteMediaUsage(usage.hash, mode));
        }
        await Promise.all(operations);
        logger.info(`Applied ${operations.length} incremental changes to ${mode} mode`);
      } catch (error) {
        logger.error("Failed to handle incremental changes in R2:", error);
        throw error;
      }
    }
    async getMediaUsagesByDocument(docPath, mode = "live") {
      try {
        const allUsages = await this.loadMediaUsages(mode);
        return allUsages.filter((usage) => usage.doc === docPath);
      } catch (error) {
        logger.error("Failed to get media usages by document from R2:", error);
        return [];
      }
    }
    async getMediaUsagesByUrl(mediaUrl, mode = "live") {
      try {
        const allUsages = await this.loadMediaUsages(mode);
        return allUsages.filter((usage) => {
          const baseUrl = usage.url.split(/[?#]/)[0];
          return baseUrl === mediaUrl;
        });
      } catch (error) {
        logger.error("Failed to get media usages by URL from R2:", error);
        return [];
      }
    }
    async getMediaUsageStats(mode = "live") {
      try {
        const allUsages = await this.loadMediaUsages(mode);
        const stats = {
          totalUsages: allUsages.length,
          uniqueMedia: new Set(allUsages.map((u2) => u2.url.split(/[?#]/)[0])).size,
          uniqueDocuments: new Set(allUsages.map((u2) => u2.doc)).size,
          byType: {},
          byDocument: {}
        };
        allUsages.forEach((usage) => {
          var _a2;
          const type = ((_a2 = usage.type) == null ? void 0 : _a2.split(" > ")[0]) || "unknown";
          stats.byType[type] = (stats.byType[type] || 0) + 1;
        });
        allUsages.forEach((usage) => {
          stats.byDocument[usage.doc] = (stats.byDocument[usage.doc] || 0) + 1;
        });
        return stats;
      } catch (error) {
        logger.error("Failed to get media usage stats from R2:", error);
        return {
          totalUsages: 0,
          uniqueMedia: 0,
          uniqueDocuments: 0,
          byType: {},
          byDocument: {}
        };
      }
    }
    setMode(mode) {
      this.mode = mode;
    }
    getMode() {
      return this.mode;
    }
    async getAllSites() {
      try {
        const modes = ["preview", "edit", "live", "audit"];
        const allSites = /* @__PURE__ */ new Map();
        for (const mode of modes) {
          const hashFiles = await this.r2API.listObjects(`${mode}/`);
          const jsonFiles = hashFiles.filter((filename) => filename.endsWith(".json"));
          if (jsonFiles.length > 0) {
            const batchSize = 50;
            const batches = chunkArray$1(jsonFiles, batchSize);
            for (const batch of batches) {
              try {
                const batchResults = await this.r2API.batchLoad(batch);
                for (const usage of batchResults) {
                  if (usage && usage.doc) {
                    try {
                      const siteKey = new URL(usage.doc).hostname;
                      if (!allSites.has(siteKey)) {
                        allSites.set(siteKey, {
                          siteKey,
                          itemCount: 0,
                          timestamp: usage.firstUsedAt || Date.now()
                        });
                      }
                      const site = allSites.get(siteKey);
                      site.itemCount += 1;
                      if (usage.firstUsedAt && usage.firstUsedAt < site.timestamp) {
                        site.timestamp = usage.firstUsedAt;
                      }
                    } catch (urlError) {
                    }
                  }
                }
              } catch (error) {
                logger.warn(`Failed to process batch for mode ${mode}:`, error);
              }
            }
          }
        }
        return Array.from(allSites.values()).sort((a2, b2) => b2.timestamp - a2.timestamp);
      } catch (error) {
        logger.error("Failed to get all sites from R2:", error);
        return [];
      }
    }
    async migrateFromIndexedDB(siteKey, mode = "live") {
      try {
        const { default: BrowserStorage2 } = await Promise.resolve().then(() => storage);
        const indexedDBStorage = new BrowserStorage2("indexeddb", siteKey);
        const mediaUsages = await indexedDBStorage.load();
        await this.saveMediaUsages(mediaUsages, mode);
        logger.info(`Migrated ${mediaUsages.length} media usages to R2 ${mode} mode`);
      } catch (error) {
        logger.error("Failed to migrate from IndexedDB to R2:", error);
        throw error;
      }
    }
    async save(data) {
      return this.saveMediaUsages(data, this.mode);
    }
    async load() {
      return this.loadMediaUsages(this.mode);
    }
    async loadScanMetadata() {
      try {
        const allUsages = await this.loadMediaUsages(this.mode);
        const pageLastModified = {};
        for (const usage of allUsages) {
          if (usage.doc && usage.lastUsedAt) {
            pageLastModified[usage.doc] = new Date(usage.lastUsedAt).toISOString();
          }
        }
        return { pageLastModified };
      } catch (error) {
        logger.error("Failed to load scan metadata from R2:", error);
        return { pageLastModified: {} };
      }
    }
    async saveScanMetadata(metadata) {
      try {
        const metadataKey = `${this.mode}/scan-metadata.json`;
        await this.r2API.putObject(metadataKey, metadata);
      } catch (error) {
        logger.error("Failed to save scan metadata to R2:", error);
        throw error;
      }
    }
    async deleteSiteFromIndexedDB(siteKey) {
      try {
        const allUsages = await this.loadMediaUsages(this.mode);
        const siteUsages = allUsages.filter((usage) => {
          try {
            const usageSiteKey = new URL(usage.doc).hostname;
            return usageSiteKey === siteKey;
          } catch {
            return false;
          }
        });
        const operations = siteUsages.map((usage) => this.deleteMediaUsage(usage.hash, this.mode));
        await Promise.all(operations);
        logger.info(`Deleted ${siteUsages.length} media usages for site: ${siteKey}`);
      } catch (error) {
        logger.error("Failed to delete site from R2:", error);
        throw error;
      }
    }
    async clearAllSites() {
      try {
        const modes = ["preview", "edit", "live"];
        const operations = [];
        for (const mode of modes) {
          const hashFiles = await this.r2API.listObjects(`${mode}/`);
          for (const filename of hashFiles) {
            if (filename.endsWith(".json")) {
              operations.push(this.r2API.deleteObject(filename));
            }
          }
        }
        await Promise.all(operations);
        logger.info("Cleared all sites from R2");
      } catch (error) {
        logger.error("Failed to clear all sites from R2:", error);
        throw error;
      }
    }
    destroy() {
      if (this.isDestroyed)
        return;
      this.isDestroyed = true;
      this.r2API = null;
      logger.debug(`R2Storage instance destroyed for ${this.siteKey || "default"}`);
    }
    isValid() {
      return !this.isDestroyed;
    }
  }
  class BrowserStorage {
    constructor(type = "indexeddb", siteKey = null) {
      this.type = type;
      this.dbVersion = 7;
      this.siteKey = siteKey;
      this.dbName = siteKey ? `media_${this.normalizeSiteKey(siteKey)}` : "MediaLibrary";
      this.db = null;
      this.isDestroyed = false;
    }
    normalizeSiteKey(siteKey) {
      if (!siteKey)
        return "unknown";
      return siteKey.toLowerCase().replace(/[^a-z0-9-]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "").substring(0, 50);
    }
    denormalizeSiteKey(normalizedSiteKey) {
      return normalizedSiteKey.replace(/_/g, ".").replace(/^www_/, "www.");
    }
    async ensureDatabase() {
      if (this.type !== "indexeddb")
        return null;
      if (this.isDestroyed) {
        throw new Error("Storage instance has been destroyed");
      }
      if (this.db) {
        this.db.close();
        this.db = null;
      }
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, this.dbVersion);
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (db.objectStoreNames.contains("processedData")) {
            db.deleteObjectStore("processedData");
          }
          if (db.objectStoreNames.contains("media")) {
            db.deleteObjectStore("media");
          }
          const mediaStore = db.createObjectStore("media", { keyPath: "id", autoIncrement: true });
          mediaStore.createIndex("hash", "hash", { unique: false });
          mediaStore.createIndex("url", "url", { unique: false });
          mediaStore.createIndex("doc", "doc", { unique: false });
          mediaStore.createIndex("name", "name", { unique: false });
          if (!db.objectStoreNames.contains("last-modified-data")) {
            db.createObjectStore("last-modified-data", { keyPath: "siteKey" });
          }
        };
        request.onsuccess = (event) => {
          const db = event.target.result;
          this.db = db;
          resolve(db);
        };
        request.onerror = () => {
          logger.error("Failed to open IndexedDB:", request.error);
          reject(request.error);
        };
      });
    }
    async save(data) {
      switch (this.type) {
        case "indexeddb":
          return this.saveItemsToIndexedDB(data);
        case "none":
          return Promise.resolve();
        default:
          throw new Error(`Unsupported storage type: ${this.type}`);
      }
    }
    async saveItemsToIndexedDB(items) {
      try {
        const db = await this.ensureDatabase();
        if (!db.objectStoreNames.contains("media")) {
          logger.warn("Media object store does not exist, cannot save data");
          return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(["media"], "readwrite");
          const store = transaction.objectStore("media");
          let savedCount = 0;
          const totalItems = items.length;
          if (totalItems === 0) {
            resolve();
            return;
          }
          transaction.onerror = () => {
            this.closeConnection();
            reject(transaction.error);
          };
          items.forEach((item) => {
            const rowData = {
              ...item,
              timestamp: Date.now()
            };
            const saveRequest = store.put(rowData);
            saveRequest.onsuccess = () => {
              savedCount += 1;
              if (savedCount === totalItems) {
                this.closeConnection();
                resolve();
              }
            };
            saveRequest.onerror = () => {
              this.closeConnection();
              reject(saveRequest.error);
            };
          });
        });
      } catch (error) {
        this.closeConnection();
        logger.error("Failed to save items to IndexedDB:", error);
        throw error;
      }
    }
    async load() {
      switch (this.type) {
        case "indexeddb": {
          const data = await this.loadRawDataBySite();
          return data;
        }
        case "none":
          return [];
        default:
          throw new Error(`Unsupported storage type: ${this.type}`);
      }
    }
    async loadChunk(offset, limit) {
      switch (this.type) {
        case "indexeddb":
          return this.loadRawDataChunk(offset, limit);
        case "none":
          return [];
        default:
          throw new Error(`Unsupported storage type: ${this.type}`);
      }
    }
    async loadUniqueMediaItems() {
      switch (this.type) {
        case "indexeddb":
          return this.loadUniqueMediaItemsFromIndexedDB();
        case "none":
          return [];
        default:
          throw new Error(`Unsupported storage type: ${this.type}`);
      }
    }
    async loadRawDataBySite() {
      try {
        const db = await this.ensureDatabase();
        if (!db.objectStoreNames.contains("media")) {
          logger.warn("Media object store does not exist, returning empty array");
          return [];
        }
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(["media"], "readonly");
          const store = transaction.objectStore("media");
          const request = store.getAll();
          transaction.onerror = () => {
            this.closeConnection();
            reject(transaction.error);
          };
          request.onsuccess = () => {
            const results = request.result || [];
            const cleanResults = results.map((item) => {
              const { timestamp: _2, ...cleanItem } = item;
              return cleanItem;
            });
            this.closeConnection();
            resolve(cleanResults);
          };
          request.onerror = () => {
            this.closeConnection();
            reject(request.error);
          };
        });
      } catch (error) {
        this.closeConnection();
        logger.error("Failed to load raw data from IndexedDB:", error);
        return [];
      }
    }
    async loadRawDataChunk(offset, limit) {
      try {
        const db = await this.ensureDatabase();
        if (!db.objectStoreNames.contains("media")) {
          return [];
        }
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(["media"], "readonly");
          const store = transaction.objectStore("media");
          const request = store.openCursor();
          const results = [];
          let currentOffset = 0;
          request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (!cursor) {
              const cleanResults = results.map((item) => {
                const { timestamp: _2, ...cleanItem } = item;
                return cleanItem;
              });
              resolve(cleanResults);
              return;
            }
            if (currentOffset < offset) {
              currentOffset += 1;
              cursor.continue();
              return;
            }
            results.push(cursor.value);
            if (results.length >= limit) {
              const cleanResults = results.map((item) => {
                const { timestamp: _2, ...cleanItem } = item;
                return cleanItem;
              });
              resolve(cleanResults);
              return;
            }
            cursor.continue();
          };
          request.onerror = () => {
            reject(request.error);
          };
        });
      } catch (error) {
        logger.error("Failed to load raw data chunk from IndexedDB:", error);
        return [];
      }
    }
    async loadUniqueMediaItemsFromIndexedDB() {
      try {
        const db = await this.ensureDatabase();
        if (!db.objectStoreNames.contains("media")) {
          return [];
        }
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(["media"], "readonly");
          const store = transaction.objectStore("media");
          const request = store.openCursor();
          const uniqueItems = /* @__PURE__ */ new Map();
          request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (!cursor) {
              const results = Array.from(uniqueItems.values());
              const cleanResults = results.map((item2) => {
                const { timestamp: _2, ...cleanItem } = item2;
                return cleanItem;
              });
              resolve(cleanResults);
              return;
            }
            const item = cursor.value;
            if (!uniqueItems.has(item.url)) {
              uniqueItems.set(item.url, item);
            }
            cursor.continue();
          };
          request.onerror = () => {
            reject(request.error);
          };
        });
      } catch (error) {
        logger.error("Failed to load unique media items from IndexedDB:", error);
        return [];
      }
    }
    async getItemByHash(hash) {
      try {
        const db = await this.ensureDatabase();
        if (!db.objectStoreNames.contains("media")) {
          return null;
        }
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(["media"], "readonly");
          const store = transaction.objectStore("media");
          const index = store.index("hash");
          const request = index.get(hash);
          request.onsuccess = () => {
            const { result } = request;
            if (result) {
              const { timestamp: _2, ...cleanItem } = result;
              resolve(cleanItem);
            } else {
              resolve(null);
            }
          };
          request.onerror = () => {
            reject(request.error);
          };
        });
      } catch (error) {
        logger.error("Failed to get item by hash:", error);
        return null;
      }
    }
    async getAllSites() {
      switch (this.type) {
        case "indexeddb":
          return this.getAllSitesFromIndexedDB();
        case "none":
          return [];
        default:
          throw new Error(`Unsupported storage type: ${this.type}`);
      }
    }
    async getAllSitesFromIndexedDB() {
      try {
        const sites = [];
        const databases = await this.getAllDatabases();
        for (const dbName of databases) {
          if (dbName.startsWith("media_")) {
            const normalizedSiteKey = dbName.replace("media_", "");
            const siteKey = this.denormalizeSiteKey(normalizedSiteKey);
            try {
              const siteStorage = new BrowserStorage("indexeddb", siteKey);
              const db = await siteStorage.ensureDatabase();
              if (db && db.objectStoreNames.contains("media")) {
                const transaction = db.transaction(["media"], "readonly");
                const store = transaction.objectStore("media");
                const countRequest = store.count();
                const count = await new Promise((resolve, reject) => {
                  countRequest.onsuccess = () => resolve(countRequest.result);
                  countRequest.onerror = () => reject(countRequest.error);
                });
                let timestamp = Date.now();
                if (db.objectStoreNames.contains("last-modified-data")) {
                  const metaTransaction = db.transaction(["last-modified-data"], "readonly");
                  const metaStore = metaTransaction.objectStore("last-modified-data");
                  const metaRequest = metaStore.get(this.siteKey || "default");
                  try {
                    const metaResult = await new Promise((resolve, reject) => {
                      metaRequest.onsuccess = () => resolve(metaRequest.result);
                      metaRequest.onerror = () => reject(metaRequest.error);
                    });
                    if (metaResult && metaResult.timestamp) {
                      timestamp = metaResult.timestamp;
                    }
                  } catch (error) {
                  }
                }
                sites.push({
                  siteKey,
                  itemCount: count,
                  timestamp
                });
              }
              siteStorage.closeConnection();
            } catch (error) {
            }
          }
        }
        return sites.sort((a2, b2) => b2.timestamp - a2.timestamp);
      } catch (error) {
        logger.error("Failed to get all sites from IndexedDB:", error);
        return [];
      }
    }
    async getAllDatabases() {
      try {
        if (typeof indexedDB !== "undefined" && indexedDB.databases) {
          const databases = await indexedDB.databases();
          const mediaDatabases = databases.map((db) => db.name).filter((name) => name && name.startsWith("media_"));
          logger.debug("Found databases via indexedDB.databases():", mediaDatabases);
          return mediaDatabases;
        }
        logger.warn("indexedDB.databases() not supported in this browser");
        return [];
      } catch (error) {
        logger.error("Failed to get all databases:", error);
        return [];
      }
    }
    async deleteSite(siteKey) {
      switch (this.type) {
        case "indexeddb":
          return this.deleteSiteFromIndexedDB(siteKey);
        case "none":
          return Promise.resolve();
        default:
          throw new Error(`Unsupported storage type: ${this.type}`);
      }
    }
    async deleteSiteFromIndexedDB(siteKey) {
      try {
        this.closeConnection();
        const normalizedSiteKey = this.normalizeSiteKey(siteKey);
        const dbName = `media_${normalizedSiteKey}`;
        await new Promise((resolve, reject) => {
          const deleteRequest = indexedDB.deleteDatabase(dbName);
          deleteRequest.onsuccess = () => {
            logger.info(`Successfully deleted database: ${dbName}`);
            resolve();
          };
          deleteRequest.onerror = () => {
            logger.error(`Failed to delete database: ${dbName}`, deleteRequest.error);
            reject(deleteRequest.error);
          };
          deleteRequest.onblocked = () => {
            logger.warn(`Database deletion blocked: ${dbName}`);
            reject(new Error("Database deletion blocked - please close other tabs and try again"));
          };
        });
      } catch (error) {
        logger.error("Failed to delete site from IndexedDB:", error);
        throw error;
      }
    }
    async saveScanMetadata(metadata) {
      switch (this.type) {
        case "indexeddb":
          return this.saveScanMetadataToIndexedDB(metadata);
        case "none":
          return Promise.resolve();
        default:
          throw new Error(`Unsupported storage type: ${this.type}`);
      }
    }
    async removeMediaForPages(pages) {
      switch (this.type) {
        case "indexeddb":
          return this.removeMediaForPagesFromIndexedDB(pages);
        case "none":
          return Promise.resolve();
        default:
          throw new Error(`Unsupported storage type: ${this.type}`);
      }
    }
    async removeMediaForPagesFromIndexedDB(pages) {
      try {
        const db = await this.ensureDatabase();
        if (!db.objectStoreNames.contains("media")) {
          return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(["media"], "readwrite");
          const store = transaction.objectStore("media");
          const request = store.openCursor();
          transaction.onerror = () => {
            this.closeConnection();
            reject(transaction.error);
          };
          request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (!cursor) {
              this.closeConnection();
              resolve();
              return;
            }
            const item = cursor.value;
            if (pages.includes(item.doc)) {
              cursor.delete();
            }
            cursor.continue();
          };
          request.onerror = () => {
            this.closeConnection();
            reject(request.error);
          };
        });
      } catch (error) {
        this.closeConnection();
        logger.error("Failed to remove media for pages from IndexedDB:", error);
        throw error;
      }
    }
    async loadScanMetadata() {
      switch (this.type) {
        case "indexeddb":
          return this.loadScanMetadataFromIndexedDB();
        case "none":
          return null;
        default:
          return null;
      }
    }
    async saveScanMetadataToIndexedDB(metadata) {
      try {
        const db = await this.ensureDatabase();
        if (!db.objectStoreNames.contains("last-modified-data")) {
          logger.warn("Last modified data object store does not exist, cannot save metadata");
          return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(["last-modified-data"], "readwrite");
          const store = transaction.objectStore("last-modified-data");
          const getRequest = store.get(this.siteKey || "default");
          getRequest.onsuccess = () => {
            const existingMetadata = getRequest.result || {};
            const mergedPageLastModified = {
              ...existingMetadata.pageLastModified,
              ...metadata.pageLastModified
            };
            const mergedMetadata = {
              siteKey: this.siteKey || "default",
              ...existingMetadata,
              ...metadata,
              pageLastModified: mergedPageLastModified,
              timestamp: Date.now()
            };
            const saveRequest = store.put(mergedMetadata);
            saveRequest.onsuccess = () => {
              this.closeConnection();
              resolve();
            };
            saveRequest.onerror = () => {
              reject(saveRequest.error);
            };
          };
          getRequest.onerror = () => {
            reject(getRequest.error);
          };
        });
      } catch (error) {
        logger.error("Failed to save scan metadata to IndexedDB:", error);
        throw error;
      }
    }
    async loadScanMetadataFromIndexedDB() {
      try {
        const db = await this.ensureDatabase();
        if (!db.objectStoreNames.contains("last-modified-data")) {
          return null;
        }
        return new Promise((resolve) => {
          const transaction = db.transaction(["last-modified-data"], "readonly");
          const store = transaction.objectStore("last-modified-data");
          const getRequest = store.get(this.siteKey || "default");
          getRequest.onsuccess = () => {
            const { result } = getRequest;
            this.closeConnection();
            resolve(result || null);
          };
          getRequest.onerror = () => {
            logger.warn("Failed to get scan metadata from IndexedDB:", getRequest.error);
            resolve(null);
          };
        });
      } catch (error) {
        logger.warn("Failed to load scan metadata from IndexedDB:", error);
        return null;
      }
    }
    async clearAllSites() {
      try {
        const sites = await this.getAllSites();
        for (const site of sites) {
          await this.deleteSiteFromIndexedDB(site.siteKey);
        }
        logger.info(`Cleared all ${sites.length} sites from IndexedDB`);
      } catch (error) {
        logger.error("Failed to clear all sites:", error);
        throw error;
      }
    }
    closeConnection() {
      if (this.db) {
        this.db.close();
        this.db = null;
      }
    }
    destroy() {
      if (this.isDestroyed)
        return;
      this.isDestroyed = true;
      this.closeConnection();
      logger.debug(`BrowserStorage instance destroyed for ${this.dbName}`);
    }
    isValid() {
      return !this.isDestroyed;
    }
  }
  function createStorage(type = "indexeddb", siteKey = null) {
    if (type === "r2") {
      const r2Storage = new R2Storage(type, siteKey);
      return r2Storage;
    }
    const browserStorage = new BrowserStorage(type, siteKey);
    return browserStorage;
  }
  const storage = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    BrowserStorage,
    createStorage,
    default: BrowserStorage
  }, Symbol.toStringTag, { value: "Module" }));
  const categoryPatterns = {
    version: "2.0",
    lastUpdated: "2024-01-15",
    confidence: {
      thresholds: {
        high: 8,
        medium: 6,
        low: 4
      }
    },
    categories: {
      screenshots: {
        description: "App interfaces, software demos, and UI previews",
        keywords: {
          filename: [
            "screenshot-",
            "screen-",
            "demo-",
            "ui-",
            "interface-",
            "app-",
            "software-",
            "mockup-",
            "preview-",
            "dashboard-"
          ],
          context: [
            "screenshot",
            "screen",
            "demo",
            "ui",
            "interface",
            "app",
            "software",
            "mockup",
            "preview",
            "dashboard",
            "application",
            "feature-section",
            "release-notes",
            "feature",
            "update",
            "change",
            "improvement",
            "fix",
            "bug",
            "enhancement",
            "adobe",
            "microsoft",
            "google",
            "apple",
            "documentation",
            "guide",
            "tutorial",
            "help",
            "manual",
            "technical",
            "development",
            "programming",
            "code"
          ],
          alt: [
            "screenshot",
            "screen",
            "demo",
            "ui",
            "interface",
            "app",
            "software",
            "mockup",
            "preview",
            "dashboard",
            "application",
            "feature",
            "update",
            "change",
            "improvement",
            "fix",
            "bug",
            "enhancement",
            "technical",
            "development",
            "programming",
            "code"
          ],
          position: [
            "demo",
            "preview",
            "below-fold",
            "feature-section",
            "documentation",
            "guide",
            "tutorial",
            "help",
            "manual"
          ]
        },
        negativeIndicators: {
          filename: [
            "logo-",
            "brand-",
            "team-",
            "person-",
            "headshot-",
            "portrait-",
            "product-",
            "catalog-"
          ],
          context: [
            "logo",
            "brand",
            "team",
            "staff",
            "person",
            "headshot",
            "portrait",
            "product",
            "catalog",
            "award",
            "winner",
            "announcement",
            "partner",
            "executive",
            "leadership"
          ],
          alt: [
            "logo",
            "brand",
            "team",
            "person",
            "headshot",
            "portrait",
            "product",
            "catalog",
            "award",
            "winner",
            "announcement",
            "partner",
            "executive",
            "leadership"
          ]
        },
        dimensions: {
          minAspectRatio: 1.3,
          minPixels: 1e5
        },
        confidence: {
          high: 4,
          medium: 2,
          low: 1
        }
      },
      logos: {
        description: "Brand logos, company symbols, and identity elements",
        keywords: {
          filename: [
            "logo-",
            "brand-",
            "identity-",
            "trademark-",
            "watermark-",
            "symbol-",
            "emblem-",
            "badge-",
            "icon-"
          ],
          context: [
            "logo",
            "brand",
            "identity",
            "trademark",
            "watermark",
            "symbol",
            "emblem",
            "badge",
            "header",
            "footer",
            "navigation",
            "branding"
          ],
          alt: [
            "logo",
            "brand",
            "identity",
            "trademark",
            "watermark",
            "symbol",
            "emblem",
            "badge"
          ],
          position: [
            "header",
            "footer",
            "brand",
            "navigation"
          ]
        },
        negativeIndicators: {
          filename: [
            "screenshot-",
            "team-",
            "person-",
            "headshot-",
            "portrait-",
            "product-",
            "catalog-"
          ],
          context: [
            "screenshot",
            "team",
            "staff",
            "person",
            "headshot",
            "portrait",
            "product",
            "catalog",
            "interface"
          ],
          alt: [
            "screenshot",
            "team",
            "person",
            "headshot",
            "portrait",
            "product",
            "catalog",
            "interface"
          ]
        },
        dimensions: {
          maxPixels: 1e5,
          minAspectRatio: 0.4,
          maxAspectRatio: 2.5
        },
        confidence: {
          high: 7,
          medium: 5,
          low: 3
        }
      },
      "people-photos": {
        description: "Team photos, headshots, professional portraits, and testimonials",
        keywords: {
          filename: [
            "team-",
            "staff-",
            "member-",
            "person-",
            "headshot-",
            "portrait-",
            "profile-",
            "about-",
            "people-",
            "executive-",
            "ceo-",
            "cto-",
            "director-",
            "manager-",
            "testimonial-",
            "customer-",
            "client-",
            "review-"
          ],
          context: [
            "team",
            "staff",
            "member",
            "person",
            "headshot",
            "portrait",
            "about",
            "people",
            "leadership",
            "executive",
            "team-section",
            "about-section",
            "testimonial",
            "testimonials",
            "customer",
            "customers",
            "client",
            "clients",
            "review",
            "reviews",
            "feedback",
            "quote",
            "quotes",
            "endorsement",
            "endorsements",
            "recommendation",
            "recommendations"
          ],
          alt: [
            "team",
            "staff",
            "member",
            "person",
            "headshot",
            "portrait",
            "about",
            "people",
            "CEO",
            "CTO",
            "Manager",
            "Director",
            "Executive",
            "Leader",
            "Head",
            "Chief",
            "testimonial",
            "customer",
            "client",
            "review",
            "feedback",
            "quote",
            "endorsement",
            "recommendation"
          ],
          position: [
            "below-fold",
            "about-section",
            "team-section",
            "team",
            "content",
            "article",
            "testimonial-section",
            "testimonials",
            "reviews-section",
            "feedback-section"
          ]
        },
        negativeIndicators: {
          filename: [
            "screenshot-",
            "logo-",
            "brand-",
            "product-",
            "catalog-",
            "demo-",
            "ui-",
            "interface-",
            "app-",
            "software-",
            "release-",
            "feature-",
            "update-",
            "change-",
            "improvement-",
            "fix-",
            "bug-",
            "enhancement-"
          ],
          context: [
            "screenshot",
            "logo",
            "brand",
            "product",
            "catalog",
            "interface",
            "demo",
            "release-notes",
            "feature",
            "update",
            "change",
            "improvement",
            "fix",
            "bug",
            "enhancement",
            "adobe",
            "microsoft",
            "google",
            "apple",
            "documentation",
            "guide",
            "tutorial",
            "help",
            "manual",
            "technical",
            "development",
            "programming",
            "code",
            "software",
            "application",
            "app",
            "ui",
            "ux"
          ],
          alt: [
            "screenshot",
            "logo",
            "brand",
            "product",
            "catalog",
            "interface",
            "demo",
            "release-notes",
            "feature",
            "update",
            "change",
            "improvement",
            "fix",
            "bug",
            "enhancement",
            "adobe",
            "microsoft",
            "google",
            "apple",
            "documentation",
            "guide",
            "tutorial",
            "help",
            "manual",
            "technical",
            "development",
            "programming",
            "code",
            "software",
            "application",
            "app",
            "ui",
            "ux"
          ]
        },
        dimensions: {
          maxAspectRatio: 1.5,
          minPixels: 5e4
        },
        confidence: {
          high: 8,
          medium: 6,
          low: 4
        }
      },
      products: {
        description: "Product photos, catalog images, and merchandise",
        keywords: {
          filename: [
            "product-",
            "item-",
            "catalog-",
            "inventory-",
            "merchandise-",
            "feature-",
            "shop-",
            "store-",
            "ecommerce-"
          ],
          context: [
            "product",
            "catalog",
            "inventory",
            "merchandise",
            "feature",
            "shop",
            "store",
            "e-commerce",
            "gallery",
            "product-section"
          ],
          alt: [
            "product",
            "item",
            "catalog",
            "inventory",
            "merchandise",
            "feature",
            "shop",
            "store"
          ],
          position: [
            "product-section",
            "catalog",
            "below-fold",
            "gallery"
          ]
        },
        negativeIndicators: {
          filename: [
            "screenshot-",
            "logo-",
            "brand-",
            "team-",
            "person-",
            "headshot-",
            "portrait-",
            "demo-",
            "ui-",
            "interface-",
            "app-",
            "software-",
            "release-",
            "update-",
            "change-",
            "improvement-",
            "fix-",
            "bug-",
            "enhancement-"
          ],
          context: [
            "screenshot",
            "logo",
            "brand",
            "team",
            "staff",
            "person",
            "headshot",
            "portrait",
            "interface",
            "demo",
            "release-notes",
            "feature",
            "update",
            "change",
            "improvement",
            "fix",
            "bug",
            "enhancement",
            "adobe",
            "microsoft",
            "google",
            "apple",
            "documentation",
            "guide",
            "tutorial",
            "help",
            "manual",
            "technical",
            "development",
            "programming",
            "code",
            "software",
            "application",
            "app",
            "ui",
            "ux"
          ],
          alt: [
            "screenshot",
            "logo",
            "brand",
            "team",
            "person",
            "headshot",
            "portrait",
            "interface",
            "demo",
            "release-notes",
            "feature",
            "update",
            "change",
            "improvement",
            "fix",
            "bug",
            "enhancement",
            "adobe",
            "microsoft",
            "google",
            "apple",
            "documentation",
            "guide",
            "tutorial",
            "help",
            "manual",
            "technical",
            "development",
            "programming",
            "code",
            "software",
            "application",
            "app",
            "ui",
            "ux"
          ]
        },
        dimensions: {
          minPixels: 5e4
        },
        confidence: {
          high: 7,
          medium: 5,
          low: 3
        }
      },
      "404-media": {
        keywords: {
          filename: [],
          context: [],
          alt: [],
          position: []
        },
        confidence: {
          high: 1,
          medium: 1,
          low: 1
        },
        description: "Images that return 404 errors or other HTTP errors"
      }
    }
  };
  let parsedPatterns = null;
  function loadCategoryPatterns() {
    if (parsedPatterns) {
      return parsedPatterns;
    }
    try {
      if (typeof categoryPatterns === "object" && categoryPatterns !== null) {
        parsedPatterns = categoryPatterns;
      } else {
        parsedPatterns = JSON.parse(categoryPatterns);
      }
      return parsedPatterns;
    } catch (error) {
      return null;
    }
  }
  function getConfidenceLevel(score, confidenceThresholds) {
    if (score >= confidenceThresholds.high) {
      return "high";
    }
    if (score >= confidenceThresholds.medium) {
      return "medium";
    }
    if (score >= confidenceThresholds.low) {
      return "low";
    }
    return "none";
  }
  function calculateNegativePenalty(negativeIndicators, filename, context, altText) {
    let penalty = 0;
    const filenameLower = filename.toLowerCase();
    const contextLower = context.toLowerCase();
    const altLower = altText.toLowerCase();
    if (negativeIndicators.filename) {
      const filenamePenalty = negativeIndicators.filename.filter((indicator) => filenameLower.includes(indicator.toLowerCase())).length;
      penalty += filenamePenalty * 2;
    }
    if (negativeIndicators.context) {
      const contextPenalty = negativeIndicators.context.filter((indicator) => contextLower.includes(indicator.toLowerCase())).length;
      penalty += contextPenalty * 1.5;
    }
    if (negativeIndicators.alt) {
      const altPenalty = negativeIndicators.alt.filter((indicator) => altLower.includes(indicator.toLowerCase())).length;
      penalty += altPenalty * 1.5;
    }
    return penalty;
  }
  function analyzeImageDimensionsWithConstraints(dimensions, aspectRatio, pixels) {
    let score = 0;
    if (dimensions.minAspectRatio && aspectRatio < dimensions.minAspectRatio) {
      score -= 2;
    }
    if (dimensions.maxAspectRatio && aspectRatio > dimensions.maxAspectRatio) {
      score -= 2;
    }
    if (dimensions.minPixels && pixels < dimensions.minPixels) {
      score -= 2;
    }
    if (dimensions.maxPixels && pixels > dimensions.maxPixels) {
      score -= 2;
    }
    if ((!dimensions.minAspectRatio || aspectRatio >= dimensions.minAspectRatio) && (!dimensions.maxAspectRatio || aspectRatio <= dimensions.maxAspectRatio) && (!dimensions.minPixels || pixels >= dimensions.minPixels) && (!dimensions.maxPixels || pixels <= dimensions.maxPixels)) {
      score += 2;
    }
    return score;
  }
  function analyzeImageDimensionsLegacy(categoryName, width, height) {
    const aspectRatio = width / height;
    const isSquare = Math.abs(aspectRatio - 1) < 0.1;
    const isPortrait = aspectRatio < 0.8;
    const isLandscape = aspectRatio > 1.2;
    switch (categoryName) {
      case "logos":
        if (isSquare || isLandscape)
          return 2;
        if (isPortrait)
          return -1;
        break;
      case "screenshots":
        if (isLandscape)
          return 2;
        if (isSquare)
          return 1;
        if (isPortrait)
          return -2;
        break;
      case "people-photos":
        if (isPortrait || isSquare)
          return 2;
        if (isLandscape)
          return 0;
        break;
      case "products":
        if (isSquare || isLandscape)
          return 1;
        if (isPortrait)
          return 0;
        break;
      default:
        return 0;
    }
    return 0;
  }
  function analyzeImageDimensions(categoryName, categoryData, width, height) {
    const aspectRatio = width / height;
    const pixels = width * height;
    if (categoryData.dimensions) {
      return analyzeImageDimensionsWithConstraints(categoryData.dimensions, aspectRatio, pixels);
    }
    return analyzeImageDimensionsLegacy(categoryName, width, height);
  }
  function detectPeopleInAltText(altText) {
    if (!altText)
      return 0;
    let score = 0;
    const text = altText.toLowerCase();
    const strongPeopleIndicators = [
      "profile photo",
      "headshot",
      "portrait",
      "team photo",
      "staff photo",
      "person",
      "people",
      "man",
      "woman",
      "child",
      "baby"
    ];
    if (strongPeopleIndicators.some((indicator) => text.includes(indicator))) {
      score += 4;
    }
    const namePatterns = [
      /^[a-z]+ [a-z]+$/,
      /^(mr|ms|dr|prof)\. [a-z]+/,
      /[a-z]+, (ceo|cto|manager|director|founder|president)/,
      /(ceo|cto|manager|director|founder|president) [a-z]+/,
      /profile photo for [a-z]+ [a-z]+/i,
      /photo of [a-z]+ [a-z]+/i,
      /headshot of [a-z]+ [a-z]+/i
    ];
    if (namePatterns.some((pattern) => pattern.test(text))) {
      score += 3;
    }
    const professionalTerms = [
      "ceo",
      "cto",
      "manager",
      "director",
      "founder",
      "president",
      "team",
      "staff",
      "employee",
      "worker",
      "professional"
    ];
    if (professionalTerms.some((term) => text.includes(term))) {
      score += 2;
    }
    const peopleIndicators = [
      "photo",
      "picture",
      "image",
      "headshot",
      "portrait"
    ];
    if (peopleIndicators.some((indicator) => text.includes(indicator))) {
      score += 1;
    }
    return Math.min(score, 6);
  }
  function detectPeopleInContext(context) {
    if (!context)
      return 0;
    let score = 0;
    const text = context.toLowerCase();
    const teamIndicators = [
      "team",
      "staff",
      "employees",
      "workers",
      "professionals",
      "leadership",
      "management",
      "founders",
      "co-founders"
    ];
    if (teamIndicators.some((indicator) => text.includes(indicator))) {
      score += 3;
    }
    const peopleIndicators = [
      "people",
      "person",
      "individual",
      "member",
      "colleague",
      "partner",
      "associate",
      "representative"
    ];
    if (peopleIndicators.some((indicator) => text.includes(indicator))) {
      score += 2;
    }
    const professionalContext = [
      "about us",
      "our team",
      "meet the team",
      "leadership team",
      "company",
      "organization",
      "business",
      "corporate"
    ];
    if (professionalContext.some((contextItem) => text.includes(contextItem))) {
      score += 2;
    }
    return Math.min(score, 5);
  }
  function analyzeTechnicalContent(context, altText) {
    if (!context && !altText)
      return 0;
    let score = 0;
    const text = `${context || ""} ${altText || ""}`.toLowerCase();
    const technicalTerms = [
      "screenshot",
      "interface",
      "ui",
      "ux",
      "design",
      "mockup",
      "wireframe",
      "prototype",
      "demo",
      "preview",
      "example",
      "application",
      "app",
      "software",
      "program",
      "system",
      "dashboard",
      "admin",
      "panel",
      "control",
      "settings",
      "configuration",
      "setup",
      "installation",
      "deployment"
    ];
    if (technicalTerms.some((term) => text.includes(term))) {
      score += 3;
    }
    const developmentTerms = [
      "development",
      "coding",
      "programming",
      "development",
      "frontend",
      "backend",
      "api",
      "database",
      "server",
      "framework",
      "library",
      "tool",
      "utility"
    ];
    if (developmentTerms.some((term) => text.includes(term))) {
      score += 2;
    }
    return Math.min(score, 5);
  }
  function analyzeContextClustering(categoryName, context, altText) {
    if (!context && !altText)
      return 0;
    let score = 0;
    const text = `${context || ""} ${altText || ""}`.toLowerCase();
    switch (categoryName) {
      case "screenshots":
        if (text.includes("screenshot") || text.includes("interface")) {
          score += 2;
        }
        break;
      case "logos":
        if (text.includes("logo") || text.includes("brand")) {
          score += 2;
        }
        break;
      case "people-photos":
        if (text.includes("team") || text.includes("staff") || text.includes("testimonial") || text.includes("customer") || text.includes("client")) {
          score += 2;
        }
        break;
      case "products":
        if (text.includes("product") || text.includes("item")) {
          score += 2;
        }
        break;
    }
    return Math.min(score, 3);
  }
  function calculateCategoryScore(categoryName, categoryData, filename, context, altText, position, width = 0, height = 0) {
    let score = 0;
    const { keywords } = categoryData;
    if (keywords.filename) {
      const filenameMatches = keywords.filename.filter((keyword) => filename.includes(keyword.toLowerCase())).length;
      score += filenameMatches * 3;
    }
    if (keywords.context) {
      const contextMatches = keywords.context.filter((keyword) => context.includes(keyword.toLowerCase())).length;
      score += contextMatches * 2.5;
    }
    if (keywords.alt) {
      const altMatches = keywords.alt.filter((keyword) => altText.includes(keyword.toLowerCase())).length;
      score += altMatches * 2;
    }
    if (keywords.position) {
      const positionMatches = keywords.position.filter((keyword) => position.includes(keyword.toLowerCase())).length;
      score += positionMatches * 2;
    }
    if (categoryData.negativeIndicators) {
      const negativePenalty = calculateNegativePenalty(
        categoryData.negativeIndicators,
        filename,
        context,
        altText
      );
      score -= negativePenalty;
    }
    if (width > 0 && height > 0) {
      const dimensionScore = analyzeImageDimensions(categoryName, categoryData, width, height);
      score += dimensionScore * 1.5;
    }
    if (categoryName === "people-photos") {
      const peopleScore = detectPeopleInAltText(altText) + detectPeopleInContext(context);
      score += peopleScore * 2;
    }
    if (categoryName === "screenshots") {
      const technicalScore = analyzeTechnicalContent(context, altText);
      score += technicalScore * 3;
    }
    const contextClusterScore = analyzeContextClustering(categoryName, context, altText);
    score += contextClusterScore * 2;
    return Math.max(0, score);
  }
  function detectCategory(imageUrl, context = "", altText = "", position = "", width = 0, height = 0) {
    const patterns = loadCategoryPatterns();
    if (!patterns || !patterns.categories) {
      return {
        category: "other",
        confidence: "none",
        score: 0,
        source: "fallback"
      };
    }
    const filename = imageUrl.toLowerCase();
    const contextLower = context.toLowerCase();
    const altLower = altText.toLowerCase();
    const positionLower = position.toLowerCase();
    const detectionOrder = ["screenshots", "logos", "people-photos", "products", "404-media"];
    for (const categoryName of detectionOrder) {
      const categoryData = patterns.categories[categoryName];
      if (categoryData) {
        const score = calculateCategoryScore(
          categoryName,
          categoryData,
          filename,
          contextLower,
          altLower,
          positionLower,
          width,
          height
        );
        const confidence = getConfidenceLevel(score, categoryData.confidence);
        if (confidence === "high") {
          return {
            category: categoryName,
            confidence,
            score,
            source: "hierarchical-detection"
          };
        }
        if (confidence === "medium" && score > 0) {
          return {
            category: categoryName,
            confidence,
            score,
            source: "hierarchical-detection"
          };
        }
      }
    }
    return {
      category: "other",
      confidence: "low",
      score: 0,
      source: "fallback"
    };
  }
  function getAvailableCategories() {
    const patterns = loadCategoryPatterns();
    if (!patterns || !patterns.categories) {
      return ["other"];
    }
    return Object.keys(patterns.categories);
  }
  const ANALYSIS_CONFIG = {
    enabled: true,
    extractEXIF: true,
    extractDimensions: true,
    categorizeFromFilename: true,
    analyzeUsage: true
  };
  const analysisCache = /* @__PURE__ */ new Map();
  async function getImageDimensions(imageUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = function onImageLoad() {
        resolve({
          width: this.naturalWidth,
          height: this.naturalHeight
        });
      };
      img.onerror = () => resolve({ width: 0, height: 0 });
      img.src = imageUrl;
    });
  }
  async function extractEXIFData(imageUrl) {
    try {
      const exifr = await Promise.resolve().then(() => full_esm);
      const response = await fetch(imageUrl);
      if (!response.ok) {
        return {
          error: true,
          errorType: response.status === 404 ? "404" : "http_error",
          errorMessage: `HTTP ${response.status}`,
          statusCode: response.status
        };
      }
      const blob = await response.blob();
      const exifData = await exifr.parse(blob, { pick: ["Make", "Model", "DateTime"] });
      if (!exifData) {
        return null;
      }
      let camera = null;
      const make = exifData.Make;
      const model = exifData.Model;
      if (make && model && make !== "undefined" && model !== "undefined") {
        camera = `${make} ${model}`.trim();
      } else if (make && make !== "undefined") {
        camera = make.trim();
      } else if (model && model !== "undefined") {
        camera = model.trim();
      }
      return {
        camera,
        dateTime: exifData.DateTime
      };
    } catch (error) {
      return {
        error: true,
        errorType: "parse_error",
        errorMessage: error.message,
        statusCode: null
      };
    }
  }
  function getBasicAnalysis() {
    return {
      orientation: "unknown",
      category: "other",
      width: 0,
      height: 0,
      confidence: "none",
      source: "basic"
    };
  }
  async function hasContentChanged(imageUrl, existingAnalysis) {
    try {
      const response = await fetch(imageUrl, { method: "HEAD" });
      const currentETag = response.headers.get("ETag");
      const currentLastModified = response.headers.get("Last-Modified");
      return currentETag !== existingAnalysis.etag || currentLastModified !== existingAnalysis.lastModified;
    } catch (error) {
      return true;
    }
  }
  async function runAnalysisPipeline(imageUrl, context = "") {
    const analysis = {
      source: "analysis",
      confidence: "low"
    };
    if (ANALYSIS_CONFIG.extractDimensions) {
      const dimensions = await getImageDimensions(imageUrl);
      analysis.width = dimensions.width;
      analysis.height = dimensions.height;
      analysis.orientation = dimensions.width > dimensions.height ? "landscape" : "portrait";
    }
    if (ANALYSIS_CONFIG.categorizeFromFilename) {
      const categoryResult = detectCategory(imageUrl, context, "", "", analysis.width, analysis.height);
      analysis.category = categoryResult.category;
      analysis.categoryConfidence = categoryResult.confidence;
      analysis.categoryScore = categoryResult.score;
      analysis.categorySource = categoryResult.source;
      if (categoryResult.confidence === "high") {
        analysis.confidence = "high";
      } else if (categoryResult.confidence === "medium" && analysis.confidence === "low") {
        analysis.confidence = "medium";
      }
    }
    if (ANALYSIS_CONFIG.extractEXIF) {
      const exifData = await extractEXIFData(imageUrl);
      if (exifData) {
        if (exifData.error) {
          analysis.exifError = exifData;
        } else {
          analysis.exifCamera = exifData.camera;
          analysis.exifDate = exifData.date;
          if (exifData.camera || exifData.date) {
            analysis.confidence = "high";
          }
        }
      }
    }
    return analysis;
  }
  async function getImageContentHash(imageUrl) {
    try {
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b2) => b2.toString(16).padStart(2, "0")).join("");
    } catch (error) {
      return imageUrl;
    }
  }
  async function analyzeImage(imageUrl, existingAnalysis = null, context = "") {
    if (!ANALYSIS_CONFIG.enabled) {
      return getBasicAnalysis();
    }
    try {
      if (existingAnalysis && !await hasContentChanged(imageUrl, existingAnalysis)) {
        return existingAnalysis;
      }
      const analysis = await runAnalysisPipeline(imageUrl, context);
      const contentHash = await getImageContentHash(imageUrl);
      analysisCache.set(contentHash, analysis);
      return analysis;
    } catch (error) {
      return getBasicAnalysis();
    }
  }
  function updateAnalysisConfig(config) {
    Object.assign(ANALYSIS_CONFIG, config);
  }
  function getAnalysisConfig() {
    return { ...ANALYSIS_CONFIG };
  }
  function clearAnalysisCache() {
    analysisCache.clear();
  }
  if (typeof window !== "undefined") {
    window.clearAnalysisCache = clearAnalysisCache;
  }
  class ContentParser {
    constructor(options = {}) {
      this.throttleDelay = 50;
      this.maxConcurrency = 20;
      this.corsProxy = options.corsProxy || "https://media-library-cors-proxy.aem-poc-lab.workers.dev/";
      this.enableImageAnalysis = options.enableImageAnalysis || false;
      this.enableCategorization = options.enableCategorization !== false;
      this.analysisConfig = options.analysisConfig || {};
      this.categorizationConfig = options.categorizationConfig || {};
      this.latestMediaItems = [];
      this.occurrenceCounters = /* @__PURE__ */ new Map();
      if (this.enableImageAnalysis) {
        updateAnalysisConfig({
          enabled: true,
          ...this.analysisConfig
        });
      }
    }
    setImageAnalysis(enabled, config = {}) {
      this.enableImageAnalysis = enabled;
      this.analysisConfig = config;
      if (enabled) {
        updateAnalysisConfig({
          enabled: true,
          ...config
        });
      } else {
        updateAnalysisConfig({ enabled: false });
      }
    }
    getImageAnalysisConfig() {
      return {
        enabled: this.enableImageAnalysis,
        config: this.analysisConfig,
        analysisConfig: getAnalysisConfig()
      };
    }
    async scanPages(urls, onProgress, previousMetadata = null) {
      const results = [];
      let completed = 0;
      this.latestMediaItems = [];
      const urlsToScan = previousMetadata ? this.filterChangedUrls(urls, previousMetadata) : urls;
      for (const url of urlsToScan) {
        try {
          const mediaItems = await this.scanPage(url);
          completed += 1;
          this.latestMediaItems = mediaItems;
          if (onProgress) {
            onProgress(completed, urlsToScan.length, mediaItems.length);
          }
          results.push(...mediaItems);
        } catch (error) {
          completed += 1;
          this.latestMediaItems = [];
          if (onProgress) {
            onProgress(completed, urlsToScan.length, 0);
          }
        }
      }
      return results;
    }
    getLatestMediaItems() {
      return this.latestMediaItems;
    }
    async scanPage(url) {
      try {
        const proxyUrl = `${this.corsProxy}?url=${encodeURIComponent(url.loc)}`;
        const response = await fetch(proxyUrl, { redirect: "manual" });
        if (!response.ok) {
          throw new Error(`Failed to fetch page: ${response.status}`);
        }
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const mediaItems = [];
        const timestamp = new Date(url.lastmod).getTime();
        const images = doc.querySelectorAll("img");
        const imageItems = await Promise.all([...images].map(async (img) => {
          const rawSrc = img.getAttribute("src");
          const lazySrc = img.getAttribute("data-src") || img.getAttribute("data-lazy-src") || img.getAttribute("data-original") || img.getAttribute("data-sling-src") || img.getAttribute("data-responsive-src");
          const actualSrc = rawSrc || lazySrc;
          if (!actualSrc || !actualSrc.trim() || !this.isMediaFile(actualSrc)) {
            return null;
          }
          const extension = this.getFileExtension(actualSrc);
          const resolvedUrl = this.resolveUrl(actualSrc, url.loc);
          const documentDomain = new URL(url.loc).hostname;
          const fixedUrl = this.fixLocalhostUrl(resolvedUrl, documentDomain);
          const cleanFilename = this.getCleanFilename(actualSrc);
          const domWidth = parseInt(img.getAttribute("width"), 10) || 0;
          const domHeight = parseInt(img.getAttribute("height"), 10) || 0;
          const mediaItem = {
            url: fixedUrl,
            name: cleanFilename,
            alt: img.alt || "null",
            type: `img > ${extension}`,
            doc: url.loc,
            ctx: this.captureContext(img, "img"),
            hash: this.createUniqueHash(
              actualSrc,
              url.loc,
              img.alt,
              this.getOccurrenceIndex(actualSrc, url.loc)
            ),
            firstUsedAt: timestamp,
            lastUsedAt: timestamp,
            domWidth,
            domHeight
          };
          if (this.enableCategorization) {
            try {
              const categoryResult = detectCategory(
                fixedUrl,
                mediaItem.ctx,
                mediaItem.alt,
                "",
                domWidth,
                domHeight
              );
              mediaItem.category = categoryResult.category;
              mediaItem.categoryConfidence = categoryResult.confidence;
              mediaItem.categoryScore = categoryResult.score;
              mediaItem.categorySource = categoryResult.source;
            } catch (error) {
              mediaItem.category = "other";
              mediaItem.categoryConfidence = "none";
              mediaItem.categoryScore = 0;
              mediaItem.categorySource = "fallback";
            }
          }
          if (this.enableImageAnalysis) {
            try {
              const analysis = await analyzeImage(fixedUrl, null, mediaItem.ctx);
              mediaItem.orientation = analysis.orientation;
              mediaItem.width = analysis.width;
              mediaItem.height = analysis.height;
              mediaItem.exifCamera = analysis.exifCamera;
              mediaItem.exifDate = analysis.exifDate;
              mediaItem.analysisConfidence = analysis.confidence;
              if (analysis.category) {
                mediaItem.category = analysis.category;
                mediaItem.categoryConfidence = analysis.categoryConfidence;
                mediaItem.categoryScore = analysis.categoryScore;
                mediaItem.categorySource = analysis.categorySource;
              }
              if (analysis.exifError) {
                mediaItem.hasError = true;
                mediaItem.errorType = analysis.exifError.errorType;
                mediaItem.errorMessage = analysis.exifError.errorMessage;
                mediaItem.statusCode = analysis.exifError.statusCode;
                if (analysis.exifError.errorType === "404") {
                  mediaItem.category = "404-media";
                }
              }
            } catch (error) {
            }
          }
          if (!this.enableImageAnalysis && domWidth > 0 && domHeight > 0) {
            mediaItem.orientation = domWidth > domHeight ? "landscape" : "portrait";
            mediaItem.width = domWidth;
            mediaItem.height = domHeight;
          }
          return mediaItem;
        }));
        mediaItems.push(...imageItems.filter((item) => item !== null));
        const videos = doc.querySelectorAll("video");
        videos.forEach((video) => {
          if (video.src && this.isMediaFile(video.src)) {
            const resolvedUrl = this.resolveUrl(video.src, url.loc);
            const documentDomain = new URL(url.loc).hostname;
            const fixedUrl = this.fixLocalhostUrl(resolvedUrl, documentDomain);
            mediaItems.push({
              url: fixedUrl,
              name: this.getCleanFilename(video.src),
              alt: "",
              type: `video > ${this.getFileExtension(video.src)}`,
              doc: url.loc,
              ctx: this.captureContext(video, "video"),
              hash: this.createUniqueHash(video.src, url.loc, "", this.getOccurrenceIndex(video.src, url.loc)),
              firstUsedAt: timestamp,
              lastUsedAt: timestamp
            });
          }
        });
        const sources = doc.querySelectorAll("video source");
        sources.forEach((source) => {
          if (source.src && this.isMediaFile(source.src)) {
            const resolvedUrl = this.resolveUrl(source.src, url.loc);
            const documentDomain = new URL(url.loc).hostname;
            const fixedUrl = this.fixLocalhostUrl(resolvedUrl, documentDomain);
            mediaItems.push({
              url: fixedUrl,
              name: this.getCleanFilename(source.src),
              alt: "",
              type: `video-source > ${this.getFileExtension(source.src)}`,
              doc: url.loc,
              ctx: this.captureContext(source, "video-source"),
              hash: this.createUniqueHash(source.src, url.loc, "", this.getOccurrenceIndex(source.src, url.loc)),
              firstUsedAt: timestamp,
              lastUsedAt: timestamp
            });
          }
        });
        const links = doc.querySelectorAll("a[href]");
        links.forEach((link) => {
          const href = link.getAttribute("href");
          if (href && this.isMediaFile(href)) {
            const resolvedUrl = this.resolveUrl(href, url.loc);
            const documentDomain = new URL(url.loc).hostname;
            const fixedUrl = this.fixLocalhostUrl(resolvedUrl, documentDomain);
            mediaItems.push({
              url: fixedUrl,
              name: this.getCleanFilename(href),
              alt: link.textContent || "",
              type: `link > ${this.getFileExtension(href)}`,
              doc: url.loc,
              ctx: this.captureContext(link, "link"),
              hash: this.createUniqueHash(
                href,
                url.loc,
                link.textContent,
                this.getOccurrenceIndex(href, url.loc)
              ),
              firstUsedAt: timestamp,
              lastUsedAt: timestamp
            });
          }
        });
        return mediaItems;
      } catch (error) {
        return [];
      }
    }
    resolveUrl(src, docPath) {
      if (!src) {
        return null;
      }
      if (src.startsWith("http://") || src.startsWith("https://")) {
        return src;
      }
      if (src.startsWith("data:")) {
        return src;
      }
      try {
        const docUrl = new URL(docPath);
        const resolvedUrl = new URL(src, docUrl);
        const result = resolvedUrl.toString();
        return result;
      } catch (error) {
        return src;
      }
    }
    captureContext(element, type) {
      const context = [type];
      const pictureElement = element.closest("picture");
      if (pictureElement) {
        context.push("picture");
      }
      const semanticParent = this.findSemanticParent(element);
      if (semanticParent) {
        context.push(`In: ${semanticParent}`);
      }
      const containerInfo = this.findContainerClasses(element);
      if (containerInfo) {
        context.push(`In: ${containerInfo}`);
      }
      const nearbyText = this.getNearbyText(element);
      if (nearbyText) {
        context.push(`text: ${nearbyText}`);
      }
      if (context.length === 1) {
        const paragraphContext = this.getParagraphContext(element);
        if (paragraphContext) {
          context.push(`paragraph: ${paragraphContext}`);
        }
      }
      return context.join(" > ");
    }
    findContainerClasses(element) {
      let current = element.parentElement;
      let depth = 0;
      while (current && depth < 3) {
        const classAttr = current.getAttribute("class");
        if (classAttr) {
          const classes = classAttr.split(" ").filter((c2) => c2.trim() && c2.length > 3);
          const meaningfulClasses = classes.filter((cls) => cls.includes("section") || cls.includes("container") || cls.includes("content") || cls.includes("wrapper") || cls.includes("block") || cls.includes("main") || cls.includes("header") || cls.includes("footer") || cls.includes("nav") || cls.includes("article") || cls.includes("aside") || cls.includes("gallery"));
          if (meaningfulClasses.length > 0) {
            return meaningfulClasses.slice(0, 2).join(" ");
          }
        }
        current = current.parentElement;
        depth += 1;
      }
      return null;
    }
    findSemanticParent(element) {
      var _a2;
      let current = element.parentElement;
      let depth = 0;
      while (current && depth < 5) {
        const tagName = (_a2 = current.tagName) == null ? void 0 : _a2.toLowerCase();
        if (["article", "section", "aside", "header", "footer", "nav", "main"].includes(tagName)) {
          return tagName;
        }
        current = current.parentElement;
        depth += 1;
      }
      return null;
    }
    getParagraphContext(element) {
      var _a2, _b;
      let current = element.parentElement;
      let depth = 0;
      while (current && depth < 3) {
        if (((_a2 = current.tagName) == null ? void 0 : _a2.toLowerCase()) === "p") {
          const text = (_b = current.textContent) == null ? void 0 : _b.trim();
          if (text && text.length > 20 && text.length < 200) {
            return text.substring(0, 50) + (text.length > 50 ? "..." : "");
          }
        }
        current = current.parentElement;
        depth += 1;
      }
      return null;
    }
    getNearbyText(element) {
      var _a2;
      const parent = element.parentElement;
      if (!parent)
        return null;
      const siblings = Array.from(parent.children || []);
      for (const sibling of siblings) {
        if (sibling !== element && sibling.textContent) {
          const text = sibling.textContent.trim();
          if (text.length > 10 && text.length < 100) {
            return text;
          }
        }
      }
      const parentText = (_a2 = parent.textContent) == null ? void 0 : _a2.trim();
      if (parentText && parentText.length > 10) {
        if (parentText.length <= 200) {
          return parentText;
        }
        return parentText.substring(0, 20);
      }
      return null;
    }
    isMediaFile(url) {
      if (!url || typeof url !== "string")
        return false;
      const mediaExtensions = [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "webp",
        "svg",
        "avif",
        "bmp",
        "tiff",
        "ico",
        "mp4",
        "webm",
        "mov",
        "avi",
        "mkv",
        "flv",
        "wmv",
        "m4v",
        "pdf",
        "doc",
        "docx",
        "txt",
        "rtf",
        "mp3",
        "wav",
        "ogg",
        "aac",
        "flac",
        "m4a"
      ];
      const extension = this.getFileExtension(url);
      return extension && mediaExtensions.includes(extension.toLowerCase());
    }
    getFileExtension(url) {
      var _a2;
      if (!url)
        return "";
      try {
        const cleanUrl = url.split(/[?#]/)[0];
        const extension = ((_a2 = cleanUrl.split(".").pop()) == null ? void 0 : _a2.toLowerCase()) || "";
        if (!extension || extension === cleanUrl || /[^a-z0-9]/.test(extension)) {
          return "";
        }
        return extension;
      } catch (error) {
        return "";
      }
    }
    getCleanFilename(url) {
      if (!url)
        return "";
      try {
        const cleanUrl = url.split(/[?#]/)[0];
        const filename = cleanUrl.split("/").pop() || "";
        return filename;
      } catch (error) {
        return "";
      }
    }
    fixLocalhostUrl(url, originalDomain) {
      if (!url || !originalDomain)
        return url;
      if (url.includes("localhost:")) {
        try {
          const localhostUrl = new URL(url);
          const pathAndQuery = localhostUrl.pathname + localhostUrl.search;
          const fixedUrl = `https://${originalDomain}${pathAndQuery}`;
          return fixedUrl;
        } catch (error) {
          return url;
        }
      }
      return url;
    }
    normalizeUrlForHash(url) {
      if (!url)
        return "";
      try {
        const cleanUrl = url.split(/[?#]/)[0];
        return cleanUrl;
      } catch (error) {
        return url;
      }
    }
    getOccurrenceIndex(mediaUrl, pageUrl) {
      const key = `${mediaUrl}_${pageUrl}`;
      const currentCount = this.occurrenceCounters.get(key) || 0;
      this.occurrenceCounters.set(key, currentCount + 1);
      return currentCount;
    }
    createUniqueHash(mediaUrl, pageUrl, altText = "", occurrenceIndex = 0) {
      const baseString = this.normalizeUrlForHash(mediaUrl) + altText + pageUrl;
      const occurrenceString = `${baseString}_${occurrenceIndex}`;
      return this.createHash(occurrenceString);
    }
    createHash(str) {
      let hash = 0;
      if (str.length === 0)
        return hash.toString(36).padStart(10, "0");
      for (let i2 = 0; i2 < str.length; i2 += 1) {
        const char = str.charCodeAt(i2);
        hash = (hash * 33 + char) % 2147483647;
      }
      const base36 = Math.abs(hash).toString(36);
      return base36.padStart(10, "0");
    }
    filterChangedUrls(urls, previousMetadata) {
      if (!previousMetadata || !previousMetadata.pageLastModified) {
        return urls;
      }
      const changedUrls = [];
      const { pageLastModified } = previousMetadata;
      for (const url of urls) {
        const urlKey = url.loc;
        const previousLastMod = pageLastModified[urlKey];
        if (!previousLastMod || !url.lastmod || url.lastmod !== previousLastMod) {
          changedUrls.push(url);
        }
      }
      return changedUrls;
    }
    testHtmlParsing(htmlString) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlString, "text/html");
      const images = doc.querySelectorAll("img");
      images.forEach((img) => {
        this.captureContext(img, "img");
      });
      return images.length;
    }
  }
  if (typeof window !== "undefined") {
    window.clearAnalysisCache = clearAnalysisCache;
  }
  function extractFileExtension$1(filePath) {
    var _a2;
    return (_a2 = filePath == null ? void 0 : filePath.split(".").pop()) == null ? void 0 : _a2.toLowerCase();
  }
  function getGroupingKey(url) {
    if (!url)
      return "";
    try {
      const urlObj = new URL(url);
      const { pathname } = urlObj;
      const filename = pathname.split("/").pop();
      if (filename && filename.includes("media_")) {
        return filename;
      }
      return pathname;
    } catch {
      return url;
    }
  }
  function detectMediaTypeFromExtension$1(ext) {
    const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"];
    const videoExtensions = ["mp4", "webm", "mov", "avi"];
    const documentExtensions = ["pdf"];
    const audioExtensions = ["mp3", "wav"];
    if (imageExtensions.includes(ext))
      return "image";
    if (videoExtensions.includes(ext))
      return "video";
    if (documentExtensions.includes(ext))
      return "document";
    if (audioExtensions.includes(ext))
      return "audio";
    return "unknown";
  }
  function getMediaType$1(media) {
    const type = media.type || "";
    if (type.startsWith("img >"))
      return "image";
    if (type.startsWith("video >"))
      return "video";
    if (type.startsWith("document >"))
      return "document";
    if (type.startsWith("link >"))
      return "link";
    const mediaUrl = media.url || "";
    const ext = extractFileExtension$1(mediaUrl);
    return detectMediaTypeFromExtension$1(ext);
  }
  function isSvgFile$1(media) {
    const type = media.type || "";
    return type === "img > svg" || type === "link > svg";
  }
  function hasPerformanceTag(item, tag) {
    if (!item.ctx)
      return false;
    const perfMatch = item.ctx.match(/perf:([^>]+)/);
    if (!perfMatch)
      return false;
    const perfTags = perfMatch[1].split(",").map((t2) => t2.trim().toLowerCase());
    return perfTags.includes(tag.toLowerCase());
  }
  const FILTER_CONFIG = {
    images: (item) => getMediaType$1(item) === "image" && !isSvgFile$1(item),
    videos: (item) => getMediaType$1(item) === "video",
    documents: (item) => getMediaType$1(item) === "document",
    links: (item) => getMediaType$1(item) === "link",
    icons: (item) => isSvgFile$1(item),
    missingAlt: (item) => {
      var _a2, _b;
      return ((_a2 = item.type) == null ? void 0 : _a2.startsWith("img >")) && !((_b = item.type) == null ? void 0 : _b.includes("svg")) && item.alt === "null";
    },
    decorative: (item) => {
      var _a2, _b;
      return ((_a2 = item.type) == null ? void 0 : _a2.startsWith("img >")) && !((_b = item.type) == null ? void 0 : _b.includes("svg")) && item.alt === "";
    },
    filled: (item) => {
      var _a2, _b;
      return ((_a2 = item.type) == null ? void 0 : _a2.startsWith("img >")) && !((_b = item.type) == null ? void 0 : _b.includes("svg")) && item.alt && item.alt !== "" && item.alt !== "null";
    },
    unused: (item) => !item.doc || item.doc.trim() === "",
    landscape: (item) => getMediaType$1(item) === "image" && !isSvgFile$1(item) && item.orientation === "landscape",
    portrait: (item) => getMediaType$1(item) === "image" && !isSvgFile$1(item) && item.orientation === "portrait",
    square: (item) => getMediaType$1(item) === "image" && !isSvgFile$1(item) && item.orientation === "square",
    lcpCandidate: (item) => getMediaType$1(item) === "image" && !isSvgFile$1(item) && hasPerformanceTag(item, "lcp-candidate"),
    aboveFold: (item) => getMediaType$1(item) === "image" && !isSvgFile$1(item) && hasPerformanceTag(item, "above-fold"),
    belowFold: (item) => getMediaType$1(item) === "image" && !isSvgFile$1(item) && hasPerformanceTag(item, "below-fold"),
    needsOptimization: (item) => getMediaType$1(item) === "image" && !isSvgFile$1(item) && hasPerformanceTag(item, "needs-optimization"),
    fullyOptimized: (item) => getMediaType$1(item) === "image" && !isSvgFile$1(item) && hasPerformanceTag(item, "fully-optimized"),
    noSrcset: (item) => getMediaType$1(item) === "image" && !isSvgFile$1(item) && hasPerformanceTag(item, "no-srcset"),
    hasSrcset: (item) => getMediaType$1(item) === "image" && !isSvgFile$1(item) && hasPerformanceTag(item, "has-srcset"),
    legacyFormat: (item) => getMediaType$1(item) === "image" && !isSvgFile$1(item) && hasPerformanceTag(item, "legacy-format"),
    modernFormat: (item) => getMediaType$1(item) === "image" && !isSvgFile$1(item) && hasPerformanceTag(item, "modern-format"),
    noLazyLoading: (item) => getMediaType$1(item) === "image" && !isSvgFile$1(item) && hasPerformanceTag(item, "no-loading-strategy"),
    lazyLoading: (item) => getMediaType$1(item) === "image" && !isSvgFile$1(item) && hasPerformanceTag(item, "lazy-loading"),
    socialImage: (item) => getMediaType$1(item) === "image" && !isSvgFile$1(item) && hasPerformanceTag(item, "social-image"),
    ogImage: (item) => getMediaType$1(item) === "image" && !isSvgFile$1(item) && hasPerformanceTag(item, "og-image"),
    performanceIssue: (item) => getMediaType$1(item) === "image" && !isSvgFile$1(item) && hasPerformanceTag(item, "performance-issue"),
    screenshots: (item) => getMediaType$1(item) === "image" && !isSvgFile$1(item) && item.category === "screenshots",
    logos: (item) => getMediaType$1(item) === "image" && !isSvgFile$1(item) && item.category === "logos",
    "people-photos": (item) => getMediaType$1(item) === "image" && !isSvgFile$1(item) && item.category === "people-photos",
    products: (item) => getMediaType$1(item) === "image" && !isSvgFile$1(item) && item.category === "products",
    "404-media": (item) => getMediaType$1(item) === "image" && !isSvgFile$1(item) && item.category === "404-media",
    documentImages: (item, selectedDocument) => FILTER_CONFIG.images(item) && item.doc === selectedDocument,
    documentIcons: (item, selectedDocument) => FILTER_CONFIG.icons(item) && item.doc === selectedDocument,
    documentVideos: (item, selectedDocument) => FILTER_CONFIG.videos(item) && item.doc === selectedDocument,
    documentDocuments: (item, selectedDocument) => FILTER_CONFIG.documents(item) && item.doc === selectedDocument,
    documentLinks: (item, selectedDocument) => FILTER_CONFIG.links(item) && item.doc === selectedDocument,
    documentMissingAlt: (item, selectedDocument) => {
      var _a2, _b;
      return ((_a2 = item.type) == null ? void 0 : _a2.startsWith("img >")) && !((_b = item.type) == null ? void 0 : _b.includes("svg")) && item.alt === "null" && item.doc === selectedDocument;
    },
    documentDecorative: (item, selectedDocument) => {
      var _a2, _b;
      return ((_a2 = item.type) == null ? void 0 : _a2.startsWith("img >")) && !((_b = item.type) == null ? void 0 : _b.includes("svg")) && item.alt === "" && item.doc === selectedDocument;
    },
    documentFilled: (item, selectedDocument) => {
      var _a2, _b;
      return item.doc === selectedDocument && ((_a2 = item.type) == null ? void 0 : _a2.startsWith("img >")) && !((_b = item.type) == null ? void 0 : _b.includes("svg")) && item.alt && item.alt !== "" && item.alt !== "null";
    },
    documentTotal: () => true,
    all: (item) => !isSvgFile$1(item)
  };
  function applyFilter(data, filterName, selectedDocument) {
    const filterFn = FILTER_CONFIG[filterName];
    if (filterFn) {
      if (filterName.startsWith("document")) {
        return data.filter((item) => filterFn(item, selectedDocument));
      }
      return data.filter(filterFn);
    }
    return data;
  }
  function getAvailableFilters() {
    return Object.keys(FILTER_CONFIG);
  }
  function getCategoryFilters() {
    const categories = getAvailableCategories();
    return categories.filter((category) => category !== "other");
  }
  function parseColonSyntax(query) {
    if (!query)
      return null;
    const colonMatch = query.match(/^([a-zA-Z]+):(.*)$/);
    if (colonMatch) {
      const [, field, value] = colonMatch;
      const result = {
        field: field.toLowerCase(),
        value: value.trim().toLowerCase(),
        originalQuery: query
      };
      return result;
    }
    if (query.startsWith("/") || query.includes("/")) {
      const result = {
        field: "folder",
        value: query.toLowerCase().trim(),
        originalQuery: query
      };
      return result;
    }
    return null;
  }
  function filterByColonSyntax(mediaData, colonSyntax) {
    const { field, value } = colonSyntax;
    const filteredResults = mediaData.filter((item) => {
      switch (field) {
        case "doc": {
          if (!item.doc)
            return false;
          let docPath = item.doc;
          try {
            const url = new URL(item.doc);
            docPath = url.pathname;
          } catch {
            docPath = item.doc;
          }
          const docMatch = docPath.toLowerCase().includes(value) || item.doc.toLowerCase().includes(value);
          return docMatch;
        }
        case "name": {
          const nameMatch = item.name && item.name.toLowerCase().includes(value);
          return nameMatch;
        }
        case "alt": {
          const altMatch = item.alt && item.alt.toLowerCase().includes(value);
          return altMatch;
        }
        case "url": {
          const urlMatch = item.url && item.url.toLowerCase().includes(value);
          return urlMatch;
        }
        case "folder": {
          if (!item.doc)
            return false;
          let docPath = item.doc;
          try {
            const url = new URL(item.doc);
            docPath = url.pathname;
          } catch {
            docPath = item.doc;
          }
          if (value === "" || value === "/") {
            return !docPath.includes("/", 1);
          }
          const cleanPath = docPath.replace(/\.html$/, "");
          const parts = cleanPath.split("/");
          if (parts.length > 2) {
            const folderPath = parts.slice(0, -1).join("/");
            const searchPath = value.startsWith("/") ? value : `/${value}`;
            const folderMatch = folderPath === searchPath;
            return folderMatch;
          }
          return false;
        }
        case "perf": {
          if (!item.ctx)
            return false;
          const perfMatch = item.ctx.match(/perf:([^>]+)/);
          if (!perfMatch)
            return false;
          const perfTags = perfMatch[1].split(",").map((tag) => tag.trim().toLowerCase());
          const searchValue = value.toLowerCase();
          return perfTags.some((tag) => tag === searchValue || tag.includes(searchValue) || searchValue.includes(tag));
        }
        default:
          return false;
      }
    });
    return filteredResults;
  }
  function filterBySearchQuery(mediaData, query) {
    if (!query || query.trim() === "") {
      return mediaData;
    }
    const lowerQuery = query.toLowerCase().trim();
    return mediaData.filter((item) => {
      if (item.name && item.name.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      if (item.alt && item.alt.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      if (item.doc && item.doc.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      if (item.ctx && item.ctx.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      if (item.url && item.url.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      return false;
    });
  }
  function calculateFilteredMediaData(mediaData, selectedFilterType, searchQuery, selectedDocument) {
    if (!mediaData || mediaData.length === 0) {
      return [];
    }
    let filteredData = [...mediaData];
    if (searchQuery && searchQuery.trim()) {
      const colonSyntax = parseColonSyntax(searchQuery);
      if (colonSyntax) {
        filteredData = filterByColonSyntax(filteredData, colonSyntax);
      } else {
        filteredData = filterBySearchQuery(filteredData, searchQuery);
      }
    }
    if (selectedFilterType && selectedFilterType !== "all") {
      filteredData = applyFilter(filteredData, selectedFilterType, selectedDocument);
    }
    return filteredData;
  }
  function calculateFilteredMediaDataFromIndex(mediaData, processedData, selectedFilterType, searchQuery, selectedDocument) {
    if (!mediaData || mediaData.length === 0 || !processedData) {
      return [];
    }
    let filteredData = [...mediaData];
    if (searchQuery && searchQuery.trim()) {
      const colonSyntax = parseColonSyntax(searchQuery);
      if (colonSyntax) {
        filteredData = filterByColonSyntax(filteredData, colonSyntax);
      } else {
        filteredData = filterBySearchQuery(filteredData, searchQuery);
      }
    }
    if (selectedFilterType && selectedFilterType !== "all") {
      const filterHashes = processedData.filterArrays[selectedFilterType] || [];
      const filteredHashes = new Set(filterHashes);
      if (selectedDocument && selectedFilterType.startsWith("document")) {
        filteredData = filteredData.filter((item) => filteredHashes.has(item.hash) && item.doc === selectedDocument);
      } else {
        filteredData = filteredData.filter((item) => filteredHashes.has(item.hash));
      }
    }
    return filteredData;
  }
  function generateFolderSuggestions(mediaData, value) {
    const folderPaths = /* @__PURE__ */ new Set();
    mediaData.forEach((item) => {
      if (item.doc) {
        let docPath = item.doc;
        try {
          const url = new URL(item.doc);
          docPath = url.pathname;
        } catch {
          docPath = item.doc;
        }
        const cleanPath = docPath.replace(/\.html$/, "");
        const parts = cleanPath.split("/");
        if (parts.length > 2) {
          for (let i2 = 1; i2 < parts.length - 1; i2 += 1) {
            const folderPath = parts.slice(0, i2 + 1).join("/");
            folderPaths.add(folderPath);
          }
        } else if (parts.length === 2) {
          folderPaths.add("/");
        }
      }
    });
    const filteredPaths = Array.from(folderPaths).filter((folderPath) => {
      if (value === "" || value === "/") {
        return true;
      }
      const searchPath = value.startsWith("/") ? value : `/${value}`;
      return folderPath.startsWith(searchPath);
    });
    const folderSuggestions = filteredPaths.map((folderPath) => ({
      type: "folder",
      value: folderPath,
      display: folderPath
    }));
    return folderSuggestions.slice(0, 10);
  }
  function createSearchSuggestion(item) {
    if (!item.name && !item.url && !item.doc)
      return null;
    if (isSvgFile$1(item))
      return null;
    return {
      type: "media",
      value: item,
      display: item.name || item.url || "Unnamed Media",
      details: {
        alt: item.alt,
        doc: item.doc,
        url: item.url,
        type: getMediaType$1(item)
      }
    };
  }
  function generateSearchSuggestions(mediaData, query, createSuggestionFn, maxResults = 10) {
    if (!query || !query.trim() || !mediaData) {
      return [];
    }
    const suggestions = [];
    const matchingDocs = /* @__PURE__ */ new Set();
    let processedCount = 0;
    const maxProcessItems = 1e3;
    const colonSyntax = parseColonSyntax(query);
    if (colonSyntax) {
      const { field, value } = colonSyntax;
      if (field === "folder") {
        return generateFolderSuggestions(mediaData, value);
      }
      for (const item of mediaData) {
        if (processedCount >= maxProcessItems)
          break;
        processedCount += 1;
        switch (field) {
          case "doc": {
            if (item.doc && item.doc.toLowerCase().includes(value)) {
              matchingDocs.add(item.doc);
            }
            break;
          }
          case "alt": {
            if (item.alt && item.alt.toLowerCase().includes(value) && !isSvgFile$1(item)) {
              suggestions.push(createSuggestionFn(item));
              if (suggestions.length >= maxResults)
                break;
            }
            break;
          }
          case "name": {
            if (item.name && item.name.toLowerCase().includes(value) && !isSvgFile$1(item)) {
              suggestions.push(createSuggestionFn(item));
              if (suggestions.length >= maxResults)
                break;
            }
            break;
          }
          case "url": {
            if (item.url && item.url.toLowerCase().includes(value) && !isSvgFile$1(item)) {
              suggestions.push(createSuggestionFn(item));
              if (suggestions.length >= maxResults)
                break;
            }
            break;
          }
        }
      }
      const docSuggestions2 = Array.from(matchingDocs).map((doc) => ({
        type: "doc",
        value: doc,
        display: doc
      }));
      return [...docSuggestions2, ...suggestions].slice(0, maxResults);
    }
    const q2 = query.toLowerCase().trim();
    if (q2 === "/") {
      for (const item of mediaData) {
        if (suggestions.length >= maxResults)
          break;
        if (item.doc && !item.doc.includes("/", 1)) {
          suggestions.push(createSuggestionFn(item));
        }
      }
      return suggestions.slice(0, maxResults);
    }
    for (const item of mediaData) {
      if (processedCount >= maxProcessItems)
        break;
      processedCount += 1;
      if (item.doc && item.doc.toLowerCase().includes(q2)) {
        matchingDocs.add(item.doc);
      }
      if (!isSvgFile$1(item) && (item.name && item.name.toLowerCase().includes(q2) || item.alt && item.alt.toLowerCase().includes(q2) || item.url && item.url.toLowerCase().includes(q2))) {
        suggestions.push(createSuggestionFn(item));
        if (suggestions.length >= maxResults)
          break;
      }
    }
    const docSuggestions = Array.from(matchingDocs).map((doc) => ({
      type: "doc",
      value: doc,
      display: doc
    }));
    return [...docSuggestions, ...suggestions].slice(0, maxResults);
  }
  let processedDataCache = null;
  let lastProcessedDataHash = null;
  function createDataHash(mediaData) {
    if (!mediaData || mediaData.length === 0)
      return "";
    const { length } = mediaData;
    const firstItem = mediaData[0];
    const lastItem = mediaData[length - 1];
    return `${length}-${(firstItem == null ? void 0 : firstItem.url) || ""}-${(lastItem == null ? void 0 : lastItem.url) || ""}`;
  }
  function chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i2 = 0; i2 < array.length; i2 += chunkSize) {
      chunks.push(array.slice(i2, i2 + chunkSize));
    }
    return chunks;
  }
  function initializeProcessedData() {
    const filterArrays = {};
    const usageData = {};
    const searchIndex = {
      name: {},
      alt: {},
      doc: {},
      ctx: {},
      url: {}
    };
    const filterCounts = {};
    Object.keys(FILTER_CONFIG).forEach((filterName) => {
      if (!filterName.startsWith("document")) {
        filterArrays[filterName] = [];
      }
    });
    return {
      filterArrays,
      usageData,
      searchIndex,
      filterCounts,
      totalCount: 0
    };
  }
  async function processMediaData(mediaData, onProgress = null) {
    if (!mediaData || mediaData.length === 0) {
      return initializeProcessedData();
    }
    const currentHash = createDataHash(mediaData);
    if (processedDataCache && lastProcessedDataHash === currentHash) {
      return processedDataCache;
    }
    const processedData = initializeProcessedData();
    const uniqueMediaUrls = /* @__PURE__ */ new Set();
    const uniqueNonSvgUrls = /* @__PURE__ */ new Set();
    const batchSize = mediaData.length > 1e5 ? 500 : 1e3;
    const batches = chunkArray(mediaData, batchSize);
    const totalBatches = batches.length;
    for (let i2 = 0; i2 < batches.length; i2 += 1) {
      const batch = batches[i2];
      batch.forEach((item) => {
        if (!item.hash)
          return;
        if (item.url) {
          const groupingKey = getGroupingKey(item.url);
          if (!processedData.usageData[groupingKey]) {
            processedData.usageData[groupingKey] = {
              hashes: [],
              uniqueDocs: /* @__PURE__ */ new Set(),
              count: 0
            };
          }
          processedData.usageData[groupingKey].hashes.push(item.hash);
          if (item.doc) {
            processedData.usageData[groupingKey].uniqueDocs.add(item.doc);
          }
          const usageData = processedData.usageData[groupingKey];
          usageData.count = usageData.hashes.length;
        }
        if (item.name) {
          const nameKey = item.name.toLowerCase();
          if (!processedData.searchIndex.name[nameKey]) {
            processedData.searchIndex.name[nameKey] = [];
          }
          processedData.searchIndex.name[nameKey].push(item.hash);
        }
        if (item.alt) {
          const altKey = item.alt.toLowerCase();
          if (!processedData.searchIndex.alt[altKey]) {
            processedData.searchIndex.alt[altKey] = [];
          }
          processedData.searchIndex.alt[altKey].push(item.hash);
        }
        if (item.doc) {
          const docKey = item.doc.toLowerCase();
          if (!processedData.searchIndex.doc[docKey]) {
            processedData.searchIndex.doc[docKey] = [];
          }
          processedData.searchIndex.doc[docKey].push(item.hash);
        }
        if (item.ctx) {
          const ctxKey = item.ctx.toLowerCase();
          if (!processedData.searchIndex.ctx[ctxKey]) {
            processedData.searchIndex.ctx[ctxKey] = [];
          }
          processedData.searchIndex.ctx[ctxKey].push(item.hash);
        }
        if (item.url) {
          const urlKey = item.url.toLowerCase();
          if (!processedData.searchIndex.url[urlKey]) {
            processedData.searchIndex.url[urlKey] = [];
          }
          processedData.searchIndex.url[urlKey].push(item.hash);
        }
        Object.keys(processedData.filterArrays).forEach((filterName) => {
          try {
            if (FILTER_CONFIG[filterName](item)) {
              processedData.filterArrays[filterName].push(item.hash);
            }
          } catch (error) {
          }
        });
        if (item.url) {
          uniqueMediaUrls.add(item.url);
          if (!isSvgFile$1(item)) {
            uniqueNonSvgUrls.add(item.url);
          }
        }
      });
      if (onProgress) {
        onProgress((i2 + 1) / totalBatches * 100);
      }
      if (i2 < batches.length - 1) {
        if (mediaData.length > 1e5 && i2 % 5 === 0) {
          await new Promise((resolve) => {
            setTimeout(resolve, 1);
          });
        } else {
          await new Promise((resolve) => {
            setTimeout(resolve, 0);
          });
        }
      }
    }
    const hashToItemMap = /* @__PURE__ */ new Map();
    mediaData.forEach((item) => {
      if (item.hash) {
        hashToItemMap.set(item.hash, item);
      }
    });
    mediaData.forEach((item) => {
      if (item.url) {
        const groupingKey = getGroupingKey(item.url);
        const usageInfo = processedData.usageData[groupingKey];
        if (usageInfo) {
          item.usageCount = usageInfo.count || 1;
        } else {
          item.usageCount = 1;
        }
      } else {
        item.usageCount = 1;
      }
    });
    Object.keys(processedData.filterArrays).forEach((filterName) => {
      const uniqueUrls = /* @__PURE__ */ new Set();
      processedData.filterArrays[filterName].forEach((hash) => {
        const item = hashToItemMap.get(hash);
        if (item && item.url) {
          uniqueUrls.add(item.url);
        }
      });
      processedData.filterCounts[filterName] = uniqueUrls.size;
    });
    processedData.filterCounts.all = uniqueNonSvgUrls.size;
    processedData.totalCount = uniqueMediaUrls.size;
    processedDataCache = processedData;
    lastProcessedDataHash = currentHash;
    return processedData;
  }
  function clearProcessedDataCache() {
    processedDataCache = null;
    lastProcessedDataHash = null;
  }
  function mergeSearchIndex(item, searchIndex) {
    if (item.name) {
      const nameKey = item.name.toLowerCase();
      if (!searchIndex.name[nameKey]) {
        searchIndex.name[nameKey] = [];
      }
      if (!searchIndex.name[nameKey].includes(item.hash)) {
        searchIndex.name[nameKey].push(item.hash);
      }
    }
    if (item.alt) {
      const altKey = item.alt.toLowerCase();
      if (!searchIndex.alt[altKey]) {
        searchIndex.alt[altKey] = [];
      }
      if (!searchIndex.alt[altKey].includes(item.hash)) {
        searchIndex.alt[altKey].push(item.hash);
      }
    }
    if (item.doc) {
      const docKey = item.doc.toLowerCase();
      if (!searchIndex.doc[docKey]) {
        searchIndex.doc[docKey] = [];
      }
      if (!searchIndex.doc[docKey].includes(item.hash)) {
        searchIndex.doc[docKey].push(item.hash);
      }
    }
    if (item.ctx) {
      const ctxKey = item.ctx.toLowerCase();
      if (!searchIndex.ctx[ctxKey]) {
        searchIndex.ctx[ctxKey] = [];
      }
      if (!searchIndex.ctx[ctxKey].includes(item.hash)) {
        searchIndex.ctx[ctxKey].push(item.hash);
      }
    }
    if (item.url) {
      const urlKey = item.url.toLowerCase();
      if (!searchIndex.url[urlKey]) {
        searchIndex.url[urlKey] = [];
      }
      if (!searchIndex.url[urlKey].includes(item.hash)) {
        searchIndex.url[urlKey].push(item.hash);
      }
    }
  }
  function mergeFilterArrays(item, filterArrays) {
    Object.keys(filterArrays).forEach((filterName) => {
      try {
        if (FILTER_CONFIG[filterName](item)) {
          if (!filterArrays[filterName].includes(item.hash)) {
            filterArrays[filterName].push(item.hash);
          }
        }
      } catch (error) {
      }
    });
  }
  function recalculateFilterCounts(processedData) {
    Object.keys(processedData.filterArrays).forEach((filterName) => {
      processedData.filterCounts[filterName] = processedData.filterArrays[filterName].length;
    });
  }
  async function processNewItems(newItems, existingProcessedData, onProgress = null) {
    const batchSize = 100;
    for (let i2 = 0; i2 < newItems.length; i2 += batchSize) {
      const batch = newItems.slice(i2, i2 + batchSize);
      batch.forEach((item) => {
        if (!item.hash)
          return;
        if (item.url) {
          const groupingKey = getGroupingKey(item.url);
          if (!existingProcessedData.usageData[groupingKey]) {
            existingProcessedData.usageData[groupingKey] = {
              hashes: [],
              uniqueDocs: /* @__PURE__ */ new Set(),
              count: 0
            };
          }
          if (!existingProcessedData.usageData[groupingKey].hashes.includes(item.hash)) {
            existingProcessedData.usageData[groupingKey].hashes.push(item.hash);
            if (item.doc) {
              existingProcessedData.usageData[groupingKey].uniqueDocs.add(item.doc);
            }
            const existingUsageData = existingProcessedData.usageData[groupingKey];
            existingUsageData.count = existingUsageData.hashes.length;
          }
        }
        mergeSearchIndex(item, existingProcessedData.searchIndex);
        mergeFilterArrays(item, existingProcessedData.filterArrays);
        existingProcessedData.totalCount += 1;
      });
      if (onProgress) {
        onProgress((i2 + batchSize) / newItems.length * 100);
      }
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
    }
    recalculateFilterCounts(existingProcessedData);
    return existingProcessedData;
  }
  function getFilteredItems(processedData, filterName) {
    if (!processedData || !processedData.filterArrays) {
      return [];
    }
    if (filterName === "all") {
      return processedData.filterArrays.all || [];
    }
    if (filterName && processedData.filterArrays[filterName]) {
      return processedData.filterArrays[filterName];
    }
    return [];
  }
  function getItemByHash(rawData, hash) {
    if (!rawData || !Array.isArray(rawData)) {
      return null;
    }
    return rawData.find((item) => item.hash === hash) || null;
  }
  function getUsageData(processedData, url) {
    if (!processedData || !processedData.usageData) {
      return [];
    }
    const groupingKey = getGroupingKey(url);
    const usageInfo = processedData.usageData[groupingKey];
    if (!usageInfo) {
      return [];
    }
    return usageInfo.hashes || [];
  }
  function searchProcessedData(processedData, query) {
    if (!processedData || !processedData.searchIndex || !query) {
      return [];
    }
    const lowerQuery = query.toLowerCase().trim();
    const results = /* @__PURE__ */ new Set();
    Object.keys(processedData.searchIndex).forEach((field) => {
      const index = processedData.searchIndex[field];
      Object.keys(index).forEach((key) => {
        if (key.includes(lowerQuery)) {
          index[key].forEach((hash) => results.add(hash));
        }
      });
    });
    return Array.from(results);
  }
  function getFilterCounts(processedData) {
    if (!processedData || !processedData.filterCounts) {
      return {};
    }
    return processedData.filterCounts;
  }
  async function updateUsageCounts(items, processedData, progressCallback) {
    if (!items || items.length === 0)
      return;
    const batchSize = 100;
    let processed = 0;
    for (let i2 = 0; i2 < items.length; i2 += batchSize) {
      const batch = items.slice(i2, i2 + batchSize);
      for (const item of batch) {
        const { hash } = item;
        if (!hash) {
          continue;
        }
        if (!processedData.usageData[hash]) {
          processedData.usageData[hash] = {
            count: 0,
            urls: /* @__PURE__ */ new Set(),
            docs: /* @__PURE__ */ new Set()
          };
        }
        processedData.usageData[hash].count += 1;
        if (item.url)
          processedData.usageData[hash].urls.add(item.url);
        if (item.doc)
          processedData.usageData[hash].docs.add(item.doc);
      }
      processed += batch.length;
      if (progressCallback) {
        progressCallback(processed / items.length * 100);
      }
      if (i2 + batchSize < items.length) {
        await new Promise((resolve) => {
          setTimeout(resolve, 1);
        });
      }
    }
  }
  const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"];
  const VIDEO_EXTENSIONS = ["mp4", "webm", "mov", "avi"];
  const DOCUMENT_EXTENSIONS = ["pdf"];
  const AUDIO_EXTENSIONS = ["mp3", "wav"];
  const MEDIA_EXTENSIONS = [
    ...IMAGE_EXTENSIONS,
    ...VIDEO_EXTENSIONS,
    ...DOCUMENT_EXTENSIONS,
    ...AUDIO_EXTENSIONS
  ];
  function extractFileExtension(filePath) {
    var _a2;
    if (!filePath)
      return "";
    try {
      const cleanUrl = filePath.split(/[?#]/)[0];
      const extension = ((_a2 = cleanUrl.split(".").pop()) == null ? void 0 : _a2.toLowerCase()) || "";
      if (!extension || extension === cleanUrl || /[^a-z0-9]/.test(extension)) {
        return "";
      }
      return extension;
    } catch (error) {
      return "";
    }
  }
  function isSvgFile(media) {
    const type = media.type || "";
    return type === "img > svg" || type === "link > svg";
  }
  function detectMediaTypeFromExtension(ext) {
    if (IMAGE_EXTENSIONS.includes(ext))
      return "img";
    if (VIDEO_EXTENSIONS.includes(ext))
      return "video";
    if (DOCUMENT_EXTENSIONS.includes(ext))
      return "document";
    if (AUDIO_EXTENSIONS.includes(ext))
      return "audio";
    return "unknown";
  }
  function getMediaType(media) {
    const type = media.type || "";
    if (type.startsWith("img >"))
      return "image";
    if (type.startsWith("video >"))
      return "video";
    if (type.startsWith("document >"))
      return "document";
    if (type.startsWith("link >"))
      return "link";
    const mediaUrl = media.url || "";
    const ext = extractFileExtension(mediaUrl);
    return detectMediaTypeFromExtension(ext);
  }
  function getSubtype(media) {
    const type = media.type || "";
    if (!type.includes(" > "))
      return "";
    const [, subtype] = type.split(" > ");
    return subtype.toUpperCase();
  }
  function getDisplayMediaType(media) {
    if (media.type) {
      if (media.type.includes(" > ")) {
        const [baseType, subtype] = media.type.split(" > ");
        const baseLabels = {
          img: "IMAGE",
          video: "VIDEO",
          "video-source": "VIDEO SOURCE",
          link: "LINK",
          background: "BACKGROUND"
        };
        const baseLabel = baseLabels[baseType] || baseType.toUpperCase();
        return `${baseLabel} (${subtype.toUpperCase()})`;
      }
      const typeLabels = {
        img: "IMAGE",
        video: "VIDEO",
        "video-source": "VIDEO SOURCE",
        link: "LINK",
        background: "BACKGROUND"
      };
      return typeLabels[media.type] || media.type.toUpperCase();
    }
    const mediaUrl = media.url || "";
    const ext = extractFileExtension(mediaUrl);
    if (IMAGE_EXTENSIONS.includes(ext))
      return "IMAGE";
    if (ext === "mp4")
      return "VIDEO";
    if (ext === "pdf")
      return "DOCUMENT";
    return "UNKNOWN";
  }
  function isMediaFile(ext) {
    let cleanExt = ext;
    if (cleanExt && cleanExt.startsWith(".")) {
      cleanExt = cleanExt.substring(1);
    }
    const lowerExt = cleanExt == null ? void 0 : cleanExt.toLowerCase();
    return MEDIA_EXTENSIONS.includes(lowerExt);
  }
  function sortMediaData(mediaData) {
    return [...mediaData].sort((a2, b2) => {
      const lastUsedA = new Date(a2.lastUsedAt || 0);
      const lastUsedB = new Date(b2.lastUsedAt || 0);
      const timeDiff = lastUsedB - lastUsedA;
      if (timeDiff !== 0)
        return timeDiff;
      const nameA = (a2.name || "").toLowerCase();
      const nameB = (b2.name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }
  function getVideoThumbnail(videoUrl) {
    if (!videoUrl)
      return null;
    const youtubeMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (youtubeMatch) {
      return `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`;
    }
    const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      const videoId = vimeoMatch[1];
      return `https://i.vimeocdn.com/video/${videoId}_640.jpg`;
    }
    return null;
  }
  function isExternalVideoUrl(url) {
    if (!url)
      return false;
    const supportedPatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)/,
      /vimeo\.com\/(\d+)/
    ];
    return supportedPatterns.some((pattern) => pattern.test(url));
  }
  function createHash(str) {
    let hash = 0;
    if (str.length === 0)
      return hash.toString(36).padStart(10, "0");
    for (let i2 = 0; i2 < str.length; i2 += 1) {
      const char = str.charCodeAt(i2);
      hash = (hash * 33 + char) % 2147483647;
    }
    const base36 = Math.abs(hash).toString(36);
    return base36.padStart(10, "0");
  }
  function formatFileSize(bytes) {
    if (bytes === 0)
      return "0 Bytes";
    const k2 = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i2 = Math.floor(Math.log(bytes) / Math.log(k2));
    return `${parseFloat((bytes / k2 ** i2).toFixed(2))} ${sizes[i2]}`;
  }
  function extractMediaLocation(mediaUrl) {
    try {
      const url = new URL(mediaUrl);
      return {
        origin: url.origin,
        path: url.pathname,
        fullUrl: mediaUrl
      };
    } catch (error) {
      return {
        origin: "",
        path: mediaUrl,
        fullUrl: mediaUrl
      };
    }
  }
  function normalizeUrl(url) {
    if (!url)
      return "";
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch {
      return url;
    }
  }
  function urlsMatch(url1, url2) {
    if (!url1 || !url2)
      return false;
    const path1 = normalizeUrl(url1);
    const path2 = normalizeUrl(url2);
    if (path1 === path2)
      return true;
    const normalizedPath1 = path1.startsWith("/") ? path1 : `/${path1}`;
    const normalizedPath2 = path2.startsWith("/") ? path2 : `/${path2}`;
    if (normalizedPath1 === normalizedPath2)
      return true;
    const fileName1 = path1.split("/").pop();
    const fileName2 = path2.split("/").pop();
    return fileName1 === fileName2 && fileName1 && fileName2;
  }
  function groupUsagesByPath(usages) {
    const grouped = /* @__PURE__ */ new Map();
    usages.forEach((usage) => {
      const docPath = usage.doc || "Unknown Document";
      if (!grouped.has(docPath)) {
        grouped.set(docPath, []);
      }
      grouped.get(docPath).push(usage);
    });
    return Array.from(grouped.entries()).map(([path, usageList]) => ({
      path,
      usages: usageList,
      count: usageList.length
    }));
  }
  function createElement(tag, attributes = {}, content = void 0) {
    const element = document.createElement(tag);
    if (attributes) {
      Object.entries(attributes).forEach(([key, val]) => {
        switch (key) {
          case "className":
            element.className = val;
            break;
          case "dataset":
            Object.assign(element.dataset, val);
            break;
          case "textContent":
            element.textContent = val;
            break;
          case "innerHTML":
            element.innerHTML = val;
            break;
          case "style":
            if (typeof val === "object") {
              Object.assign(element.style, val);
            } else {
              element.style.cssText = val;
            }
            break;
          case "events":
            Object.entries(val).forEach(([event, handler]) => {
              element.addEventListener(event, handler);
            });
            break;
          default:
            element.setAttribute(key, val);
        }
      });
    }
    if (content) {
      if (Array.isArray(content)) {
        element.append(...content);
      } else if (content instanceof HTMLElement || content instanceof SVGElement) {
        element.append(content);
      } else {
        element.insertAdjacentHTML("beforeend", content);
      }
    }
    return element;
  }
  async function copyImageToClipboard(imageUrl) {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob();
    let clipboardBlob = blob;
    let mimeType = blob.type;
    if (!["image/png", "image/gif", "image/webp"].includes(blob.type)) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(blob);
      });
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      clipboardBlob = await new Promise((resolve) => {
        canvas.toBlob(resolve, "image/png");
      });
      mimeType = "image/png";
      URL.revokeObjectURL(img.src);
    }
    const clipboardItem = new ClipboardItem({ [mimeType]: clipboardBlob });
    await navigator.clipboard.write([clipboardItem]);
  }
  async function copyMediaToClipboard(media) {
    const mediaUrl = media.url;
    const mediaType = getMediaType(media);
    try {
      if (mediaType === "image") {
        await copyImageToClipboard(mediaUrl);
        return { heading: "Copied", message: "Image copied to clipboard." };
      }
      await navigator.clipboard.writeText(mediaUrl);
      return { heading: "Copied", message: "Media URL copied to clipboard." };
    } catch (error) {
      return { heading: "Error", message: "Failed to copy to clipboard." };
    }
  }
  function getFileName(url) {
    try {
      const urlObj = new URL(url);
      const { pathname } = urlObj;
      return pathname.split("/").pop() || "";
    } catch {
      return url.split("/").pop() || "";
    }
  }
  function extractRelativePath(fullPath) {
    if (!fullPath)
      return fullPath;
    const pathParts = fullPath.split("/").filter(Boolean);
    if (pathParts.length >= 2) {
      return `/${pathParts.slice(2).join("/")}`;
    }
    return fullPath;
  }
  function getDisplayName(fullPath) {
    if (!fullPath)
      return "";
    const pathParts = fullPath.split("/").filter(Boolean);
    const fileName = pathParts[pathParts.length - 1];
    return fileName.replace(/\.[^/.]+$/, "");
  }
  function isImage(url) {
    const ext = extractFileExtension(url);
    return ["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"].includes(ext);
  }
  function isVideo(url) {
    const ext = extractFileExtension(url);
    return ["mp4", "webm", "mov", "avi"].includes(ext);
  }
  function isPdf(url) {
    const ext = extractFileExtension(url);
    return ext === "pdf";
  }
  function getStyles(cssContent) {
    return i$5([cssContent]);
  }
  /**
   * @license
   * Copyright 2020 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
  const { I: t$2 } = Z$1, f$2 = (o2) => void 0 === o2.strings, r$2 = () => document.createComment(""), s$2 = (o2, i2, n2) => {
    var _a2;
    const e2 = o2._$AA.parentNode, l2 = void 0 === i2 ? o2._$AB : i2._$AA;
    if (void 0 === n2) {
      const i3 = e2.insertBefore(r$2(), l2), d2 = e2.insertBefore(r$2(), l2);
      n2 = new t$2(i3, d2, o2, o2.options);
    } else {
      const t2 = n2._$AB.nextSibling, i3 = n2._$AM, d2 = i3 !== o2;
      if (d2) {
        let t3;
        (_a2 = n2._$AQ) == null ? void 0 : _a2.call(n2, o2), n2._$AM = o2, void 0 !== n2._$AP && (t3 = o2._$AU) !== i3._$AU && n2._$AP(t3);
      }
      if (t2 !== l2 || d2) {
        let o3 = n2._$AA;
        for (; o3 !== t2; ) {
          const t3 = o3.nextSibling;
          e2.insertBefore(o3, l2), o3 = t3;
        }
      }
    }
    return n2;
  }, v$1 = (o2, t2, i2 = o2) => (o2._$AI(t2, i2), o2), u$2 = {}, m$1 = (o2, t2 = u$2) => o2._$AH = t2, p$1 = (o2) => o2._$AH, M$1 = (o2) => {
    o2._$AR(), o2._$AA.remove();
  };
  /**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
  const t$1 = { ATTRIBUTE: 1, CHILD: 2, PROPERTY: 3, BOOLEAN_ATTRIBUTE: 4, EVENT: 5, ELEMENT: 6 }, e$2 = (t2) => (...e2) => ({ _$litDirective$: t2, values: e2 });
  let i$1 = class i {
    constructor(t2) {
    }
    get _$AU() {
      return this._$AM._$AU;
    }
    _$AT(t2, e2, i2) {
      this._$Ct = t2, this._$AM = e2, this._$Ci = i2;
    }
    _$AS(t2, e2) {
      return this.update(t2, e2);
    }
    update(t2, e2) {
      return this.render(...e2);
    }
  };
  /**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
  const s$1 = (i2, t2) => {
    var _a2;
    const e2 = i2._$AN;
    if (void 0 === e2)
      return false;
    for (const i3 of e2)
      (_a2 = i3._$AO) == null ? void 0 : _a2.call(i3, t2, false), s$1(i3, t2);
    return true;
  }, o$2 = (i2) => {
    let t2, e2;
    do {
      if (void 0 === (t2 = i2._$AM))
        break;
      e2 = t2._$AN, e2.delete(i2), i2 = t2;
    } while (0 === (e2 == null ? void 0 : e2.size));
  }, r$1 = (i2) => {
    for (let t2; t2 = i2._$AM; i2 = t2) {
      let e2 = t2._$AN;
      if (void 0 === e2)
        t2._$AN = e2 = /* @__PURE__ */ new Set();
      else if (e2.has(i2))
        break;
      e2.add(i2), c$2(t2);
    }
  };
  function h$2(i2) {
    void 0 !== this._$AN ? (o$2(this), this._$AM = i2, r$1(this)) : this._$AM = i2;
  }
  function n$2(i2, t2 = false, e2 = 0) {
    const r2 = this._$AH, h2 = this._$AN;
    if (void 0 !== h2 && 0 !== h2.size)
      if (t2)
        if (Array.isArray(r2))
          for (let i3 = e2; i3 < r2.length; i3++)
            s$1(r2[i3], false), o$2(r2[i3]);
        else
          null != r2 && (s$1(r2, false), o$2(r2));
      else
        s$1(this, i2);
  }
  const c$2 = (i2) => {
    i2.type == t$1.CHILD && (i2._$AP ?? (i2._$AP = n$2), i2._$AQ ?? (i2._$AQ = h$2));
  };
  let f$1 = class f extends i$1 {
    constructor() {
      super(...arguments), this._$AN = void 0;
    }
    _$AT(i2, t2, e2) {
      super._$AT(i2, t2, e2), r$1(this), this.isConnected = i2._$AU;
    }
    _$AO(i2, t2 = true) {
      var _a2, _b;
      i2 !== this.isConnected && (this.isConnected = i2, i2 ? (_a2 = this.reconnected) == null ? void 0 : _a2.call(this) : (_b = this.disconnected) == null ? void 0 : _b.call(this)), t2 && (s$1(this, i2), o$2(this));
    }
    setValue(t2) {
      if (f$2(this._$Ct))
        this._$Ct._$AI(t2, this);
      else {
        const i2 = [...this._$Ct._$AH];
        i2[this._$Ci] = t2, this._$Ct._$AI(i2, this, 0);
      }
    }
    disconnected() {
    }
    reconnected() {
    }
  };
  /**
   * @license
   * Copyright 2020 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
  const e$1 = () => new h$1();
  let h$1 = class h {
  };
  const o$1 = /* @__PURE__ */ new WeakMap(), n$1 = e$2(class extends f$1 {
    render(i2) {
      return E$1;
    }
    update(i2, [s2]) {
      var _a2;
      const e2 = s2 !== this.G;
      return e2 && void 0 !== this.G && this.rt(void 0), (e2 || this.lt !== this.ct) && (this.G = s2, this.ht = (_a2 = i2.options) == null ? void 0 : _a2.host, this.rt(this.ct = i2.element)), E$1;
    }
    rt(t2) {
      if (this.isConnected || (t2 = void 0), "function" == typeof this.G) {
        const i2 = this.ht ?? globalThis;
        let s2 = o$1.get(i2);
        void 0 === s2 && (s2 = /* @__PURE__ */ new WeakMap(), o$1.set(i2, s2)), void 0 !== s2.get(this.G) && this.G.call(this.ht, void 0), s2.set(this.G, t2), void 0 !== t2 && this.G.call(this.ht, t2);
      } else
        this.G.value = t2;
    }
    get lt() {
      var _a2, _b;
      return "function" == typeof this.G ? (_a2 = o$1.get(this.ht ?? globalThis)) == null ? void 0 : _a2.get(this.G) : (_b = this.G) == null ? void 0 : _b.value;
    }
    disconnected() {
      this.lt === this.ct && this.rt(void 0);
    }
    reconnected() {
      this.rt(this.ct);
    }
  });
  const PARSER = new DOMParser();
  async function fetchIcon(path) {
    try {
      const resp = await fetch(path);
      if (!resp.ok) {
        return null;
      }
      const text = await resp.text();
      const doc = PARSER.parseFromString(text, "image/svg+xml");
      const svg = doc.querySelector("svg");
      return svg;
    } catch (error) {
      return null;
    }
  }
  async function getSvg({ parent, paths }) {
    const svgs = await Promise.all(paths.map(async (path) => {
      const svg = await fetchIcon(path);
      if (svg && parent) {
        parent.append(svg);
      }
      return svg;
    }));
    return svgs;
  }
  const topbarStyles = "/* src/components/topbar/topbar.css */\n\n/* Franklin-style SVG handling */\n:host > svg {\n  display: none;\n}\n\n/* Icon styles */\n.search-icon,\n.clear-icon,\n.view-icon,\n.scan-icon {\n  color: currentcolor;\n  display: block;\n  height: 20px;\n  width: 20px;\n}\n\n.topbar {\n  align-items: center;\n  background: #fff;\n  border-bottom: 1px solid #e2e8f0;\n  display: flex;\n  gap: 16px;\n  padding: 16px;\n}\n\n.search-container {\n  align-items: center;\n  display: flex;\n  flex: 1;\n  margin: 0 auto; /* Center the search container */\n  max-width: 800px; /* Increased maximum width */\n  min-width: 0; /* Allow flex item to shrink below content size */\n  position: relative;\n}\n\n.search-wrapper {\n  align-items: center;\n  display: flex;\n  position: relative;\n  width: 100%;\n}\n\n.search-input {\n  background: #fff;\n  border: 1px solid #e2e8f0;\n  border-radius: 6px;\n  color: #1e293b;\n  font-size: 0.875rem;\n  min-width: 300px; /* Increased minimum usable width */\n  padding: 8px 16px;\n  padding-left: 2.5rem;\n  padding-right: 2.5rem;\n  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);\n  width: 100%;\n}\n\n.search-input:focus {\n  border-color: #3b82f6;\n  box-shadow: 0 0 0 3px rgb(59 130 246 / 0.1);\n  outline: none;\n}\n\n.search-input::placeholder {\n  color: #64748b;\n}\n\n.search-input:disabled {\n  background: #f8fafc;\n  border-color: #e2e8f0;\n  color: #94a3b8;\n  cursor: not-allowed;\n  opacity: 0.6;\n}\n\n.search-input:disabled::placeholder {\n  color: #94a3b8;\n}\n\n.search-icon {\n  color: #64748b;\n  left: 8px;\n  pointer-events: none;\n  position: absolute;\n  z-index: 1;\n}\n\n.clear-button {\n  align-items: center;\n  background: transparent;\n  border: none;\n  border-radius: 4px;\n  color: #64748b;\n  cursor: pointer;\n  display: flex;\n  justify-content: center;\n  position: absolute;\n  right: 4px;\n  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);\n}\n\n.clear-button:hover {\n  background: #f8fafc;\n  color: #1e293b;\n}\n\n.scan-stats {\n  align-items: center;\n  background: #f8fafc;\n  border: 1px solid #e2e8f0;\n  border-radius: 6px;\n  display: flex;\n  font-size: 0.875rem;\n  gap: 16px;\n  padding: 8px 16px;\n}\n\n.stat-item {\n  align-items: center;\n  display: flex;\n  gap: 4px;\n}\n\n.stat-number {\n  font-variant-numeric: tabular-nums;\n  min-width: 2ch;\n  text-align: right;\n  transition: all 0.1s ease;\n}\n\n.stat-text {\n  white-space: nowrap;\n}\n\n.stat-label {\n  color: #64748b;\n  font-weight: 500;\n}\n\n.stat-value {\n  color: #1e293b;\n  font-weight: 600;\n}\n\n.view-toggle-button {\n  align-items: center;\n  background: #fff;\n  border: 1px solid #e2e8f0;\n  border-radius: 6px;\n  color: #64748b;\n  cursor: pointer;\n  display: flex;\n  height: 40px;\n  justify-content: center;\n  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);\n  width: 40px;\n}\n\n.view-toggle-button:hover {\n  background: #f8fafc;\n  border-color: #3b82f6;\n  color: #1e293b;\n}\n\n.view-toggle-button:active {\n  background: #3b82f6;\n  border-color: #3b82f6;\n  color: #fff;\n}\n\n.view-toggle-button:disabled {\n  background: #f8fafc;\n  border-color: #e2e8f0;\n  color: #94a3b8;\n  cursor: not-allowed;\n  opacity: 0.6;\n}\n\n.view-toggle-button:disabled:hover {\n  background: #f8fafc;\n  border-color: #e2e8f0;\n  color: #94a3b8;\n}\n\n.scan-container {\n  align-items: center;\n  display: flex;\n  gap: 8px;\n}\n\n.scan-button {\n  align-items: center;\n  background: #3b82f6;\n  border: 1px solid #e2e8f0;\n  border-radius: 6px;\n  color: #fff;\n  cursor: pointer;\n  display: flex;\n  font-size: 0.875rem;\n  font-weight: 500;\n  gap: 8px;\n  padding: 8px 16px;\n  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);\n}\n\n\n.scan-button:disabled {\n  cursor: not-allowed;\n  opacity: 0.6;\n}\n\n.scan-button:hover:not(:disabled) {\n  background: #2563eb;\n  border-color: #2563eb;\n}\n\n.analysis-toggle-container {\n  align-items: center;\n  display: flex;\n  gap: 8px;\n}\n\n.analysis-toggle-text {\n  color: #64748b;\n  font-size: 0.875rem;\n  font-weight: 500;\n  white-space: nowrap;\n}\n\n.analysis-toggle-label {\n  align-items: center;\n  cursor: pointer;\n  display: flex;\n  user-select: none;\n}\n\n.analysis-toggle-input {\n  display: none;\n}\n\n.analysis-toggle-slider {\n  background: #e2e8f0;\n  border: 1px solid #cbd5e1;\n  border-radius: 4px;\n  cursor: pointer;\n  height: 32px;\n  overflow: hidden;\n  position: relative;\n  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);\n  width: 60px;\n}\n\n.analysis-toggle-slider::before {\n  background: #fff;\n  border-radius: 2px;\n  box-shadow: 0 1px 3px rgb(0 0 0 / 0.1);\n  content: '';\n  height: 28px;\n  left: 2px;\n  position: absolute;\n  top: 2px;\n  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);\n  width: 28px;\n  z-index: 2;\n}\n\n.analysis-toggle-slider::after {\n  color: #64748b;\n  content: 'OFF';\n  font-size: 0.7rem;\n  font-weight: 600;\n  position: absolute;\n  right: 6px;\n  top: 50%;\n  transform: translateY(-50%);\n  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);\n  z-index: 1;\n}\n\n.analysis-toggle-slider.enabled {\n  background: #3b82f6;\n  border-color: #3b82f6;\n}\n\n.analysis-toggle-slider.enabled::before {\n  transform: translateX(28px);\n}\n\n.analysis-toggle-slider.enabled::after {\n  color: #fff;\n  content: 'ON';\n  left: 6px;\n  right: auto;\n}\n\n.analysis-toggle-label:has(.analysis-toggle-input:disabled) {\n  cursor: not-allowed;\n  opacity: 0.6;\n}\n\n.analysis-toggle-label:has(.analysis-toggle-input:disabled) .analysis-toggle-slider {\n  cursor: not-allowed;\n}\n\n.scan-progress {\n  align-items: center;\n  background: #f8fafc;\n  border: 1px solid #e2e8f0;\n  border-radius: 6px;\n  color: #64748b;\n  display: flex;\n  font-size: 0.875rem;\n  gap: 8px;\n  padding: 8px 16px;\n}\n\n.progress-bar {\n  background: #e2e8f0;\n  border-radius: 2px;\n  height: 4px;\n  overflow: hidden;\n  width: 100px;\n}\n\n.progress-fill {\n  background: #3b82f6;\n  height: 100%;\n  transition: width 0.3s ease;\n}\n\n/* Suggestions dropdown styles */\n.suggestions-dropdown {\n  background: #fff;\n  border: 1px solid #e2e8f0;\n  border-radius: 0 0 6px 6px;\n  border-top: none;\n  box-shadow: 0 1px 3px rgb(0 0 0 / 0.1);\n  left: 0;\n  margin-top: -1px; /* Overlap with input border */\n  max-height: 300px;\n  overflow-y: auto;\n  position: absolute;\n  right: 0;\n  top: 100%;\n  z-index: 1000;\n}\n\n.suggestion-item {\n  border-bottom: 1px solid #e2e8f0;\n  cursor: pointer;\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  padding: 8px 16px;\n  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);\n}\n\n.suggestion-item:last-child {\n  border-bottom: none;\n}\n\n.suggestion-item:hover,\n.suggestion-item.active {\n  background: #f8fafc;\n}\n\n.suggestion-main {\n  align-items: center;\n  display: flex;\n  gap: 8px;\n}\n\n.suggestion-text {\n  color: #1e293b;\n  font-size: 0.875rem;\n  font-weight: 500;\n}\n\n.suggestion-details {\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n  margin-left: 1.5rem;\n}\n\n.detail-line {\n  align-items: center;\n  color: #64748b;\n  display: flex;\n  font-size: 0.75rem;\n  gap: 4px;\n}\n\n.detail-line span {\n  color: #1e293b;\n  font-weight: 400;\n}\n\n/* Highlight matching text */\nmark {\n  background: #fef3c7;\n  border-radius: 2px;\n  color: #92400e;\n  font-weight: 600;\n  padding: 0;\n}\n\n@media (max-width: 768px) {\n  .topbar {\n    flex-wrap: wrap;\n    gap: var(--ml-space-sm);\n  }\n  \n  .search-container {\n    flex: 1 1 100%;\n    margin: 0; /* Remove centering on mobile */\n    max-width: none; /* Remove max-width on mobile */\n    min-width: 0;\n    order: 1;\n  }\n  \n  .view-toggle-button {\n    order: 2;\n  }\n  \n  .scan-button {\n    order: 3;\n  }\n}\n\n";
  class MediaTopbar extends LocalizableElement {
    constructor() {
      super();
      this.searchQuery = "";
      this.currentView = "grid";
      this.locale = "en";
      this.isScanning = false;
      this.scanProgress = null;
      this.isBatchLoading = false;
      this.realTimeStats = { images: 0, pages: 0, elapsed: 0 };
      this.lastScanDuration = null;
      this.scanStats = null;
      this.imageAnalysisEnabled = false;
      this.showAnalysisToggle = true;
      this.mediaData = [];
      this.totalPages = 0;
      this.isActuallyScanning = false;
      this._suggestions = [];
      this._activeIndex = -1;
      this._originalQuery = "";
      this._suppressSuggestions = false;
      this._searchDebounceTimeout = null;
      this._suggestionDebounceTimeout = null;
      this._lastSearchQuery = "";
      this.searchContainerRef = e$1();
    }
    async connectedCallback() {
      super.connectedCallback();
      const ICONS = [
        "./icons/search.svg",
        "./icons/close.svg",
        "./icons/list.svg",
        "./icons/grid.svg",
        "./icons/refresh.svg",
        "./icons/photo.svg"
      ];
      getSvg({ parent: this.shadowRoot, paths: ICONS });
      this.handleOutsideClick = this.handleOutsideClick.bind(this);
      this.handleClearSearch = this.handleClearSearch.bind(this);
      document.addEventListener("click", this.handleOutsideClick);
      window.addEventListener("clear-search", this.handleClearSearch);
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      document.removeEventListener("click", this.handleOutsideClick);
      window.removeEventListener("clear-search", this.handleClearSearch);
      if (this._searchDebounceTimeout) {
        clearTimeout(this._searchDebounceTimeout);
      }
      if (this._suggestionDebounceTimeout) {
        clearTimeout(this._suggestionDebounceTimeout);
      }
    }
    handleOutsideClick(e2) {
      const searchContainer = this.searchContainerRef.value;
      if (searchContainer && !searchContainer.contains(e2.target)) {
        this._suggestions = [];
        this._activeIndex = -1;
        this._suppressSuggestions = true;
      }
    }
    handleClearSearch() {
      this.searchQuery = "";
      this._suggestions = [];
      this._activeIndex = -1;
      this._suppressSuggestions = false;
      this.requestUpdate();
    }
    render() {
      return x$1`
      <div class="topbar">
        <div class="search-container" ${n$1(this.searchContainerRef)}>
          <div class="search-wrapper">
            <svg class="search-icon">
              <use href="#search"></use>
            </svg>
            <input 
              class="search-input"
              type="text"
              placeholder=${this.isScanning ? this.t("mediaLibrary.searchDisabledDuringScan") : this.t("mediaLibrary.searchPlaceholder")}
              .value=${this.searchQuery || ""}
              ?disabled=${this.isScanning}
              @input=${this.handleSearchInput}
              @keydown=${this.handleKeyDown}
            />
            ${this.searchQuery ? x$1`
              <button 
                class="clear-button"
                @click=${this.clearSearch}
                aria-label=${this.t("common.clear")}
              >
                <svg class="clear-icon">
                  <use href="#close"></use>
                </svg>
              </button>
            ` : ""}
          </div>
          ${this._suggestions.length ? x$1`
            <div class="suggestions-dropdown">
              ${this._suggestions.map((suggestion, index) => x$1`
                <div 
                  class="suggestion-item ${index === this._activeIndex ? "active" : ""}"
                  @click=${() => this.selectSuggestion(suggestion)}
                >
                  <div class="suggestion-main">
                    <span class="suggestion-text" .innerHTML=${this.highlightMatch(suggestion.display, this._originalQuery)}></span>
                  </div>
                  ${suggestion.details ? x$1`
                    <div class="suggestion-details">
                      ${suggestion.details.alt ? x$1`<div class="detail-line">Alt: <span .innerHTML=${this.highlightMatch(suggestion.details.alt, this._originalQuery)}></span></div>` : ""}
                      ${suggestion.details.doc ? x$1`<div class="detail-line">Doc: <span .innerHTML=${this.highlightMatch(suggestion.details.doc, this._originalQuery)}></span></div>` : ""}
                    </div>
                  ` : ""}
                </div>
              `)}
            </div>
          ` : ""}
        </div>

        ${this.isActuallyScanning ? x$1`
          <div class="scan-stats">
            <div class="stat-item">
              <span class="stat-label">Found</span>
              <span class="stat-value stat-number">${this.realTimeStats.images}</span>
              <span class="stat-text">media in</span>
              <span class="stat-value stat-number">${this.realTimeStats.pages}</span>
              <span class="stat-text">/</span>
              <span class="stat-value stat-number">${this.totalPages}</span>
              <span class="stat-text">changed pages in</span>
              <span class="stat-value stat-number">${this.realTimeStats.elapsed}</span>
              <span class="stat-text">s</span>
            </div>
          </div>
        ` : ""}

        ${this.scanStats ? x$1`
          <div class="scan-stats">
            <div class="stat-item">
              <span class="stat-label">Pages:</span>
              <span class="stat-value">${this.scanStats.pagesScanned}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Media:</span>
              <span class="stat-value">${this.scanStats.mediaFound}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Time:</span>
              <span class="stat-value">${this.scanStats.duration}s</span>
            </div>
          </div>
        ` : ""}

        <button 
          class="view-toggle-button"
          @click=${this.toggleView}
          ?disabled=${this.isScanning}
          aria-label=${this.currentView === "grid" ? this.t("views.list") : this.t("views.grid")}
          title=${this.currentView === "grid" ? this.t("views.list") : this.t("views.grid")}
        >
          <svg class="view-icon">
            <use href="#${this.currentView === "grid" ? "list" : "grid"}"></use>
          </svg>
        </button>

        ${this.showAnalysisToggle ? x$1`
          <div class="analysis-toggle-container">
            <span class="analysis-toggle-text">EXIF</span>
            <label class="analysis-toggle-label">
              <input 
                type="checkbox" 
                class="analysis-toggle-input"
                ?checked=${this.imageAnalysisEnabled}
                @change=${this.toggleImageAnalysis}
                ?disabled=${this.isActuallyScanning}
              />
              <span class="analysis-toggle-slider ${this.imageAnalysisEnabled ? "enabled" : ""}"></span>
            </label>
          </div>
        ` : ""}

      </div>

    `;
    }
    getOnDemandSearchSuggestions(query) {
      return generateSearchSuggestions(this.mediaData, query, createSearchSuggestion);
    }
    handleSearchInput(e2) {
      const query = e2.target.value;
      this.searchQuery = query;
      this._originalQuery = query;
      this._activeIndex = -1;
      if (this._searchDebounceTimeout) {
        clearTimeout(this._searchDebounceTimeout);
      }
      if (this._suggestionDebounceTimeout) {
        clearTimeout(this._suggestionDebounceTimeout);
      }
      this._searchDebounceTimeout = setTimeout(() => {
        this._lastSearchQuery = query;
        this.dispatchEvent(new CustomEvent("search", { detail: { query } }));
      }, 300);
      if (!query || !query.trim() || this._suppressSuggestions || this.isScanning) {
        this._suggestions = [];
        this._suppressSuggestions = false;
      } else {
        this._suggestionDebounceTimeout = setTimeout(() => {
          this._suggestions = this.getOnDemandSearchSuggestions(query);
          this.requestUpdate();
        }, 200);
      }
    }
    handleKeyDown(e2) {
      if (!this._suggestions.length)
        return;
      switch (e2.key) {
        case "ArrowDown":
          e2.preventDefault();
          if (this._activeIndex === -1) {
            this._originalQuery = this.searchQuery;
          }
          this._activeIndex = (this._activeIndex + 1) % this._suggestions.length;
          this.searchQuery = this.getSuggestionText(this._suggestions[this._activeIndex]);
          break;
        case "ArrowUp":
          e2.preventDefault();
          if (this._activeIndex === -1) {
            this._originalQuery = this.searchQuery;
          }
          this._activeIndex = (this._activeIndex - 1 + this._suggestions.length) % this._suggestions.length;
          this.searchQuery = this.getSuggestionText(this._suggestions[this._activeIndex]);
          break;
        case "Enter":
          e2.preventDefault();
          if (this._activeIndex >= 0) {
            this.selectSuggestion(this._suggestions[this._activeIndex]);
          } else {
            if (this.searchQuery === "/") {
              this.searchQuery = "folder:/";
              this._suggestions = [];
              this._activeIndex = -1;
              this._suppressSuggestions = true;
              this.dispatchEvent(new CustomEvent("search", {
                detail: {
                  query: this.searchQuery,
                  type: "folder",
                  path: ""
                }
              }));
              return;
            }
            this._suggestions = [];
            this._activeIndex = -1;
            this._suppressSuggestions = true;
            this.dispatchEvent(new CustomEvent("search", { detail: { query: this.searchQuery } }));
          }
          break;
        case "Escape":
          e2.preventDefault();
          this.searchQuery = this._originalQuery;
          this._suggestions = [];
          this._activeIndex = -1;
          this._suppressSuggestions = true;
          break;
      }
    }
    getSuggestionText(suggestion) {
      if (suggestion.type === "doc")
        return `doc:${suggestion.value}`;
      if (suggestion.type === "folder") {
        return suggestion.value === "" ? "folder:/" : `folder:${suggestion.value}`;
      }
      if (suggestion.type === "media") {
        return suggestion.value.name || suggestion.value.url;
      }
      return "";
    }
    selectSuggestion(suggestion) {
      this._suggestions = [];
      this._activeIndex = -1;
      this._suppressSuggestions = true;
      if (suggestion.type === "doc") {
        this.searchQuery = `doc:${suggestion.value}`;
        this.dispatchEvent(new CustomEvent("search", {
          detail: {
            query: this.searchQuery,
            type: "doc",
            path: suggestion.value
          }
        }));
      } else if (suggestion.type === "folder") {
        this.searchQuery = suggestion.value === "" ? "folder:/" : `folder:${suggestion.value}`;
        this.dispatchEvent(new CustomEvent("search", {
          detail: {
            query: this.searchQuery,
            type: "folder",
            path: suggestion.value
          }
        }));
      } else {
        this.searchQuery = suggestion.value.name;
        this.dispatchEvent(new CustomEvent("search", {
          detail: {
            query: this.searchQuery,
            type: "media",
            media: suggestion.value
          }
        }));
      }
    }
    highlightMatch(text, query) {
      if (!query || !text)
        return text;
      const regex = new RegExp(`(${query})`, "ig");
      return text.replace(regex, "<mark>$1</mark>");
    }
    clearSearch() {
      this.searchQuery = "";
      this._suggestions = [];
      this._activeIndex = -1;
      this._originalQuery = "";
      this._suppressSuggestions = false;
      this.dispatchEvent(new CustomEvent("search", { detail: { query: "" } }));
    }
    handleViewChange(view) {
      this.dispatchEvent(new CustomEvent("viewChange", { detail: { view } }));
    }
    toggleView() {
      const newView = this.currentView === "grid" ? "list" : "grid";
      this.handleViewChange(newView);
    }
    toggleImageAnalysis(event) {
      this.imageAnalysisEnabled = event.target.checked;
      this.dispatchEvent(new CustomEvent("toggleImageAnalysis", { detail: { enabled: this.imageAnalysisEnabled } }));
    }
  }
  __publicField(MediaTopbar, "properties", {
    searchQuery: { type: String },
    currentView: { type: String },
    locale: { type: String },
    isScanning: { type: Boolean },
    scanProgress: { type: Object },
    isBatchLoading: { type: Boolean },
    realTimeStats: { type: Object },
    lastScanDuration: { type: String },
    scanStats: { type: Object },
    imageAnalysisEnabled: { type: Boolean },
    showAnalysisToggle: { type: Boolean },
    mediaData: { type: Array },
    totalPages: { type: Number },
    isActuallyScanning: { type: Boolean },
    _suggestions: { state: true },
    _activeIndex: { state: true },
    _originalQuery: { state: true },
    _suppressSuggestions: { state: true }
  });
  __publicField(MediaTopbar, "styles", getStyles(topbarStyles));
  customElements.define("media-topbar", MediaTopbar);
  const sidebarStyles = '.media-sidebar {\n  background: #f8fafc;\n  border: 1px solid #e2e8f0;\n  border-radius: 6px;\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  padding: 16px;\n}\n\n.sidebar-header {\n  margin-bottom: 24px;\n}\n\n.sidebar-title {\n  color: #1e293b;\n  font-size: 1.25rem;\n  font-weight: 600;\n  margin: 0;\n}\n\n.filter-section h3 {\n  color: #64748b;\n  font-size: 0.875rem;\n  font-weight: 600;\n  letter-spacing: 0.05em;\n  margin: 24px 0 16px;\n}\n\n.filter-list {\n  list-style: none;\n  margin: 0;\n  padding: 0;\n}\n\n.filter-item {\n  margin-bottom: 4px;\n}\n\n.filter-button {\n  align-items: center;\n  background: #fff;\n  border: 1px solid #e2e8f0;\n  border-radius: 6px;\n  color: #1e293b;\n  cursor: pointer;\n  display: flex;\n  font-size: 0.875rem;\n  justify-content: space-between;\n  padding: 8px 16px;\n  text-align: start;\n  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);\n  width: 100%;\n}\n\n.filter-button:hover {\n  background: #f8fafc;\n  border-color: #3b82f6;\n}\n\n.filter-button:focus-visible {\n  outline: 2px solid #3b82f6;\n  outline-offset: 2px;\n}\n\n.filter-button[aria-pressed="true"] {\n  background: #3b82f6;\n  border-color: #3b82f6;\n  color: #fff;\n}\n\n.filter-button[aria-pressed="true"]:hover {\n  background: #2563eb;\n  border-color: #2563eb;\n}\n\n.filter-button.disabled {\n  background: #f8fafc;\n  border-color: #e2e8f0;\n  color: #94a3b8;\n  cursor: not-allowed;\n  opacity: 0.6;\n}\n\n.filter-button.disabled:hover {\n  background: #f8fafc;\n  border-color: #e2e8f0;\n}\n\n.count {\n  background: #f8fafc;\n  border-radius: 4px;\n  color: #64748b;\n  font-size: 0.75rem;\n  font-weight: 500;\n  min-width: 1.5rem;\n  padding: 4px 8px;\n  text-align: center;\n}\n\n.filter-button[aria-pressed="true"] .count {\n  background: rgb(255 255 255 / 0.2);\n  color: #fff;\n}\n\n.filter-button:not([aria-pressed="true"]):hover .count {\n  background: #fff;\n  color: #3b82f6;\n}\n\n/* Category section specific styles */\n.filter-section:has(.filter-list:has(.filter-button[data-category])) {\n  border-left: 3px solid #3b82f6;\n  padding-left: calc(16px - 3px);\n}\n\n.filter-section:has(.filter-list:has(.filter-button[data-category])) h3 {\n  color: #3b82f6;\n  font-weight: 700;\n}\n\n/* Category filter buttons - no bullets */\n.filter-button[data-category] {\n  /* No special styling needed - bullets removed */\n}\n';
  class MediaSidebar extends LocalizableElement {
    constructor() {
      super();
      this.activeFilter = "all";
      this.filterCounts = {};
      this.locale = "en";
      this.isScanning = false;
    }
    async connectedCallback() {
      super.connectedCallback();
      this.handleClearFilters = this.handleClearFilters.bind(this);
      window.addEventListener("clear-filters", this.handleClearFilters);
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      window.removeEventListener("clear-filters", this.handleClearFilters);
    }
    handleClearFilters() {
      this.activeFilter = "all";
      this.requestUpdate();
    }
    render() {
      const counts = this.filterCounts || {};
      logger.debug("Sidebar render - filterCounts:", counts);
      logger.debug("Sidebar render - isScanning:", this.isScanning);
      return x$1`
      <aside class="media-sidebar">
        <div class="sidebar-header">
          <h1 class="sidebar-title">${this.t("mediaLibrary.title")}</h1>
        </div>
        
        <div class="filter-section">
          <h3>${this.t("common.filter")}</h3>
          <ul class="filter-list">
            ${this.renderFilterItem("all", counts.all)}
            ${this.renderFilterItem("images", counts.images)}
            ${this.renderFilterItem("videos", counts.videos)}
            ${this.renderFilterItem("documents", counts.documents)}
            ${this.renderFilterItem("links", counts.links)}
            ${this.renderFilterItem("icons", counts.icons, "SVGs")}
            ${this.renderFilterItem("unused", counts.unused)}
          </ul>
        </div>

        ${counts.filled > 0 || counts.decorative > 0 || counts.missingAlt > 0 ? x$1`
          <div class="filter-section">
            <h3>Accessibility</h3>
            <ul class="filter-list">
              ${this.renderFilterItem("filled", counts.filled)}
              ${this.renderFilterItem("decorative", counts.decorative)}
              ${this.renderFilterItem("missingAlt", counts.missingAlt, "No Alt Text")}
            </ul>
          </div>
        ` : ""}

        ${this.isScanning || counts.landscape > 0 || counts.portrait > 0 || counts.square > 0 ? x$1`
          <div class="filter-section">
            <h3>Orientation</h3>
            <ul class="filter-list">
              ${this.renderFilterItem("landscape", counts.landscape)}
              ${this.renderFilterItem("portrait", counts.portrait)}
              ${this.renderFilterItem("square", counts.square)}
            </ul>
          </div>
        ` : ""}

        ${this.renderCategorySection(counts)}
      </aside>
    `;
    }
    renderFilterItem(filterType, count, customLabel = null) {
      const label = customLabel || this.t(`filters.${filterType}`);
      const categoryFilters = getCategoryFilters();
      const isCategoryFilter = categoryFilters.includes(filterType);
      logger.debug(`renderFilterItem - ${filterType}: count=${count}, isScanning=${this.isScanning}`);
      if (this.isScanning) {
        return x$1`
        <li class="filter-item">
          <button 
            class="filter-button disabled"
            disabled
            aria-pressed="false"
            data-category=${isCategoryFilter ? filterType : ""}
          >
            <span>${label}</span>
          </button>
        </li>
      `;
      }
      if (!count || count === 0) {
        logger.debug(`Hiding filter ${filterType} - no count`);
        return "";
      }
      return x$1`
      <li class="filter-item">
        <button 
          class="filter-button ${this.activeFilter === filterType ? "active" : ""}"
          @click=${() => this.handleFilter(filterType)}
          aria-pressed=${this.activeFilter === filterType}
          data-category=${isCategoryFilter ? filterType : ""}
        >
          <span>${label}</span>
          <span class="count">${this.formatNumber(count)}</span>
        </button>
      </li>
    `;
    }
    renderCategorySection(counts) {
      const categoryFilters = getCategoryFilters();
      const hasCategoryItems = categoryFilters.some((category) => counts[category] > 0);
      if (!this.isScanning && !hasCategoryItems)
        return "";
      return x$1`
      <div class="filter-section">
        <h3>${this.t("categories.title")}</h3>
        <ul class="filter-list">
          ${categoryFilters.map((category) => this.renderFilterItem(category, counts[category]))}
        </ul>
      </div>
    `;
    }
    handleFilter(filterType) {
      this.dispatchEvent(new CustomEvent("filter", { detail: { type: filterType } }));
    }
  }
  __publicField(MediaSidebar, "properties", {
    activeFilter: { type: String },
    filterCounts: { type: Object },
    locale: { type: String },
    isScanning: { type: Boolean }
  });
  __publicField(MediaSidebar, "styles", getStyles(sidebarStyles));
  customElements.define("media-sidebar", MediaSidebar);
  /**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
  const u$1 = (e2, s2, t2) => {
    const r2 = /* @__PURE__ */ new Map();
    for (let l2 = s2; l2 <= t2; l2++)
      r2.set(e2[l2], l2);
    return r2;
  }, c$1 = e$2(class extends i$1 {
    constructor(e2) {
      if (super(e2), e2.type !== t$1.CHILD)
        throw Error("repeat() can only be used in text expressions");
    }
    dt(e2, s2, t2) {
      let r2;
      void 0 === t2 ? t2 = s2 : void 0 !== s2 && (r2 = s2);
      const l2 = [], o2 = [];
      let i2 = 0;
      for (const s3 of e2)
        l2[i2] = r2 ? r2(s3, i2) : i2, o2[i2] = t2(s3, i2), i2++;
      return { values: o2, keys: l2 };
    }
    render(e2, s2, t2) {
      return this.dt(e2, s2, t2).values;
    }
    update(s2, [t2, r2, c2]) {
      const d2 = p$1(s2), { values: p2, keys: a2 } = this.dt(t2, r2, c2);
      if (!Array.isArray(d2))
        return this.ut = a2, p2;
      const h2 = this.ut ?? (this.ut = []), v2 = [];
      let m2, y2, x2 = 0, j2 = d2.length - 1, k2 = 0, w2 = p2.length - 1;
      for (; x2 <= j2 && k2 <= w2; )
        if (null === d2[x2])
          x2++;
        else if (null === d2[j2])
          j2--;
        else if (h2[x2] === a2[k2])
          v2[k2] = v$1(d2[x2], p2[k2]), x2++, k2++;
        else if (h2[j2] === a2[w2])
          v2[w2] = v$1(d2[j2], p2[w2]), j2--, w2--;
        else if (h2[x2] === a2[w2])
          v2[w2] = v$1(d2[x2], p2[w2]), s$2(s2, v2[w2 + 1], d2[x2]), x2++, w2--;
        else if (h2[j2] === a2[k2])
          v2[k2] = v$1(d2[j2], p2[k2]), s$2(s2, d2[x2], d2[j2]), j2--, k2++;
        else if (void 0 === m2 && (m2 = u$1(a2, k2, w2), y2 = u$1(h2, x2, j2)), m2.has(h2[x2]))
          if (m2.has(h2[j2])) {
            const e2 = y2.get(a2[k2]), t3 = void 0 !== e2 ? d2[e2] : null;
            if (null === t3) {
              const e3 = s$2(s2, d2[x2]);
              v$1(e3, p2[k2]), v2[k2] = e3;
            } else
              v2[k2] = v$1(t3, p2[k2]), s$2(s2, d2[x2], t3), d2[e2] = null;
            k2++;
          } else
            M$1(d2[j2]), j2--;
        else
          M$1(d2[x2]), x2++;
      for (; k2 <= w2; ) {
        const e2 = s$2(s2, v2[w2 + 1]);
        v$1(e2, p2[k2]), v2[k2++] = e2;
      }
      for (; x2 <= j2; ) {
        const e2 = d2[x2++];
        null !== e2 && M$1(e2);
      }
      return this.ut = a2, m$1(s2, v2), T$1;
    }
  });
  const SCROLL_CONSTANTS = {
    GRID_ITEM_WIDTH: 410,
    GRID_ITEM_HEIGHT: 400,
    GRID_CARD_SPACING: 20,
    LIST_ITEM_HEIGHT: 80,
    BUFFER_SIZE: 5,
    SCROLL_THROTTLE: 16,
    MAX_VISIBLE_ITEMS: 50,
    MIN_BUFFER_SIZE: 3,
    MAX_BUFFER_SIZE: 10,
    FAST_SCROLL_THRESHOLD: 100
  };
  class VirtualScrollManager {
    getResponsiveItemWidth() {
      if (typeof window === "undefined")
        return SCROLL_CONSTANTS.GRID_ITEM_WIDTH;
      const width = window.innerWidth;
      if (width >= 1200) {
        return 410;
      }
      if (width >= 992) {
        return 360;
      }
      if (width >= 768) {
        return 310;
      }
      if (width >= 576) {
        return 290;
      }
      return 260;
    }
    constructor(options = {}) {
      this.container = null;
      this.scrollListenerAttached = false;
      this.scrollTimeout = null;
      this.throttledScroll = null;
      this.itemHeight = options.itemHeight || SCROLL_CONSTANTS.GRID_ITEM_HEIGHT;
      this.itemWidth = options.itemWidth || this.getResponsiveItemWidth();
      this.cardSpacing = options.cardSpacing || SCROLL_CONSTANTS.GRID_CARD_SPACING;
      this.bufferSize = options.bufferSize || SCROLL_CONSTANTS.BUFFER_SIZE;
      this.maxVisibleItems = options.maxVisibleItems || SCROLL_CONSTANTS.MAX_VISIBLE_ITEMS;
      this.scrollThrottle = options.scrollThrottle || SCROLL_CONSTANTS.SCROLL_THROTTLE;
      this.visibleStart = 0;
      this.visibleEnd = 0;
      this.totalItems = 0;
      this.containerHeight = 0;
      this.containerWidth = 0;
      this.lastScrollTop = 0;
      this.lastScrollTime = 0;
      this.scrollSpeed = 0;
      this.onRangeChange = options.onRangeChange || null;
      this.onColCountChange = options.onColCountChange || null;
      this.onScroll = this.onScroll.bind(this);
      this.onResize = this.onResize.bind(this);
    }
    init(container, totalItems) {
      this.container = container;
      this.totalItems = totalItems;
      this.updateContainerDimensions();
      this.calculateVisibleRange();
      this.attachScrollListener();
      this.attachResizeListener();
    }
    updateContainerDimensions() {
      if (!this.container)
        return;
      const rect = this.container.getBoundingClientRect();
      this.containerHeight = rect.height;
      this.containerWidth = rect.width;
    }
    calculateVisibleRange() {
      if (!this.container || this.totalItems === 0) {
        this.visibleStart = 0;
        this.visibleEnd = 0;
        return;
      }
      const { scrollTop } = this.container;
      const itemsPerRow = Math.floor(this.containerWidth / (this.itemWidth + this.cardSpacing));
      const startRow = Math.floor(scrollTop / (this.itemHeight + this.cardSpacing));
      const endRow = Math.ceil(
        (scrollTop + this.containerHeight) / (this.itemHeight + this.cardSpacing)
      );
      this.visibleStart = Math.max(0, startRow * itemsPerRow - this.bufferSize);
      this.visibleEnd = Math.min(this.totalItems, (endRow + 1) * itemsPerRow + this.bufferSize);
      if (this.visibleEnd - this.visibleStart > this.maxVisibleItems) {
        const center = Math.floor((this.visibleStart + this.visibleEnd) / 2);
        this.visibleStart = Math.max(0, center - Math.floor(this.maxVisibleItems / 2));
        this.visibleEnd = Math.min(this.totalItems, this.visibleStart + this.maxVisibleItems);
      }
    }
    onScroll() {
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
      }
      const currentTime = performance.now();
      const currentScrollTop = this.container.scrollTop;
      if (this.lastScrollTime > 0) {
        const timeDelta = currentTime - this.lastScrollTime;
        const scrollDelta = Math.abs(currentScrollTop - this.lastScrollTop);
        this.scrollSpeed = timeDelta > 0 ? scrollDelta / timeDelta : 0;
        if (this.scrollSpeed > SCROLL_CONSTANTS.FAST_SCROLL_THRESHOLD) {
          this.bufferSize = Math.min(SCROLL_CONSTANTS.MAX_BUFFER_SIZE, this.bufferSize + 1);
        } else {
          this.bufferSize = Math.max(SCROLL_CONSTANTS.MIN_BUFFER_SIZE, this.bufferSize - 1);
        }
      }
      this.lastScrollTop = currentScrollTop;
      this.lastScrollTime = currentTime;
      this.scrollTimeout = setTimeout(() => {
        requestAnimationFrame(() => {
          this.calculateVisibleRange();
          this.onVisibleRangeChange();
        });
      }, this.scrollThrottle);
    }
    onResize() {
      this.updateContainerDimensions();
      this.itemWidth = this.getResponsiveItemWidth();
      this.calculateVisibleRange();
      this.onVisibleRangeChange();
    }
    onVisibleRangeChange() {
      if (this.onRangeChange) {
        this.onRangeChange({
          start: this.visibleStart,
          end: this.visibleEnd
        });
      }
    }
    attachScrollListener() {
      if (this.scrollListenerAttached || !this.container)
        return;
      this.container.addEventListener("scroll", this.onScroll, { passive: true });
      this.scrollListenerAttached = true;
    }
    detachScrollListener() {
      if (!this.scrollListenerAttached || !this.container)
        return;
      this.container.removeEventListener("scroll", this.onScroll);
      this.scrollListenerAttached = false;
    }
    attachResizeListener() {
      if (typeof window === "undefined")
        return;
      window.addEventListener("resize", this.onResize, { passive: true });
    }
    detachResizeListener() {
      if (typeof window === "undefined")
        return;
      window.removeEventListener("resize", this.onResize);
    }
    updateTotalItems(totalItems) {
      this.totalItems = totalItems;
      this.calculateVisibleRange();
      this.onVisibleRangeChange();
    }
    resetState(totalItems) {
      this.totalItems = totalItems;
      this.visibleStart = 0;
      this.visibleEnd = 0;
      this.calculateVisibleRange();
      this.onVisibleRangeChange();
    }
    updateColCount() {
      this.updateContainerDimensions();
      this.itemWidth = this.getResponsiveItemWidth();
      this.calculateVisibleRange();
      this.onVisibleRangeChange();
      if (this.onColCountChange) {
        const itemsPerRow = Math.floor(this.containerWidth / (this.itemWidth + this.cardSpacing));
        this.onColCountChange(itemsPerRow);
      }
    }
    calculateTotalHeight(totalItems) {
      if (totalItems === 0)
        return 0;
      const itemsPerRow = Math.floor(this.containerWidth / (this.itemWidth + this.cardSpacing));
      const totalRows = Math.ceil(totalItems / itemsPerRow);
      return totalRows * (this.itemHeight + this.cardSpacing);
    }
    calculateItemPosition(index) {
      const itemsPerRow = Math.floor(this.containerWidth / (this.itemWidth + this.cardSpacing));
      const row = Math.floor(index / itemsPerRow);
      const col = index % itemsPerRow;
      return {
        top: row * (this.itemHeight + this.cardSpacing),
        left: col * (this.itemWidth + this.cardSpacing)
      };
    }
    setupScrollListener(container) {
      this.container = container;
      this.updateContainerDimensions();
      this.calculateVisibleRange();
      this.attachScrollListener();
      this.attachResizeListener();
    }
    cleanup() {
      this.destroy();
    }
    getTotalItems() {
      return this.totalItems;
    }
    getVisibleRange() {
      return {
        start: this.visibleStart,
        end: this.visibleEnd
      };
    }
    getVisibleItems(data) {
      if (!data || data.length === 0)
        return [];
      return data.slice(this.visibleStart, this.visibleEnd);
    }
    scrollToItem(index) {
      if (!this.container || index < 0 || index >= this.totalItems)
        return;
      const itemsPerRow = Math.floor(this.containerWidth / (this.itemWidth + this.cardSpacing));
      const row = Math.floor(index / itemsPerRow);
      const scrollTop = row * (this.itemHeight + this.cardSpacing);
      this.container.scrollTop = scrollTop;
    }
    destroy() {
      this.detachScrollListener();
      this.detachResizeListener();
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = null;
      }
      this.container = null;
      this.totalItems = 0;
    }
  }
  class GridVirtualScrollManager extends VirtualScrollManager {
    constructor(options = {}) {
      super({
        itemHeight: 400,
        itemWidth: 410,
        cardSpacing: 20,
        ...options
      });
    }
    calculateVisibleRange() {
      if (!this.container || this.totalItems === 0) {
        this.visibleStart = 0;
        this.visibleEnd = 0;
        return;
      }
      const { scrollTop } = this.container;
      const itemsPerRow = Math.floor(this.containerWidth / (this.itemWidth + this.cardSpacing));
      const startRow = Math.floor(scrollTop / (this.itemHeight + this.cardSpacing));
      const endRow = Math.ceil(
        (scrollTop + this.containerHeight) / (this.itemHeight + this.cardSpacing)
      );
      this.visibleStart = Math.max(0, startRow * itemsPerRow - this.bufferSize);
      this.visibleEnd = Math.min(this.totalItems, (endRow + 1) * itemsPerRow + this.bufferSize);
      if (this.visibleEnd - this.visibleStart > this.maxVisibleItems) {
        const center = Math.floor((this.visibleStart + this.visibleEnd) / 2);
        this.visibleStart = Math.max(0, center - Math.floor(this.maxVisibleItems / 2));
        this.visibleEnd = Math.min(this.totalItems, this.visibleStart + this.maxVisibleItems);
      }
    }
    getItemsPerRow() {
      return Math.floor(this.containerWidth / (this.itemWidth + this.cardSpacing));
    }
    getTotalRows() {
      const itemsPerRow = this.getItemsPerRow();
      return Math.ceil(this.totalItems / itemsPerRow);
    }
    getRowForItem(index) {
      const itemsPerRow = this.getItemsPerRow();
      return Math.floor(index / itemsPerRow);
    }
    getColumnForItem(index) {
      const itemsPerRow = this.getItemsPerRow();
      return index % itemsPerRow;
    }
  }
  class ListVirtualScrollManager extends VirtualScrollManager {
    constructor(options = {}) {
      super({
        itemHeight: 80,
        itemWidth: 0,
        cardSpacing: 0,
        ...options
      });
    }
    calculateVisibleRange() {
      if (!this.container || this.totalItems === 0) {
        this.visibleStart = 0;
        this.visibleEnd = 0;
        return;
      }
      const { scrollTop } = this.container;
      const startIndex = Math.floor(scrollTop / this.itemHeight);
      const endIndex = Math.ceil((scrollTop + this.containerHeight) / this.itemHeight);
      this.visibleStart = Math.max(0, startIndex - this.bufferSize);
      this.visibleEnd = Math.min(this.totalItems, endIndex + this.bufferSize);
      if (this.visibleEnd - this.visibleStart > this.maxVisibleItems) {
        const center = Math.floor((this.visibleStart + this.visibleEnd) / 2);
        this.visibleStart = Math.max(0, center - Math.floor(this.maxVisibleItems / 2));
        this.visibleEnd = Math.min(this.totalItems, this.visibleStart + this.maxVisibleItems);
      }
    }
    scrollToItem(index) {
      if (!this.container || index < 0 || index >= this.totalItems)
        return;
      const scrollTop = index * this.itemHeight;
      this.container.scrollTop = scrollTop;
    }
    getTotalHeight() {
      return this.totalItems * this.itemHeight;
    }
    getItemOffset(index) {
      return index * this.itemHeight;
    }
  }
  const gridStyles = "/* src/components/grid/grid.css */\n\n.media-main {\n  background: #fff;\n  height: calc(100vh - 200px);\n  overflow-y: auto;\n  padding: 24px;\n  position: relative;\n}\n\n.media-grid {\n  position: relative;\n  width: 100%;\n}\n\n.media-card {\n  background: #f8fafc;\n  border: 1px solid #e2e8f0;\n  border-radius: 8px;\n  box-shadow: 0 1px 3px rgb(0 0 0 / 0.1);\n  box-sizing: border-box;\n  cursor: default;\n  display: grid;\n  grid-template-rows: auto 1fr;\n  overflow: hidden;\n  padding: 0;\n  position: absolute;\n  transition: box-shadow 0.2s ease, border-color 0.2s ease;\n}\n\n.media-card:hover {\n  border-color: #e2e8f0;\n  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);\n  transform: translateY(-2px);\n}\n\n.media-preview {\n  align-items: center;\n  background: #f8fafc;\n  border-bottom: 1px solid #e2e8f0;\n  display: flex;\n  height: 280px;\n  justify-content: center;\n  overflow: hidden;\n  position: relative;\n}\n\n.media-preview.clickable {\n  cursor: pointer;\n  transition: background-color 0.2s ease;\n}\n\n.media-preview.clickable:hover {\n  background: #fff;\n}\n\n.media-image {\n  height: 100%;\n  object-fit: contain;\n  transition: transform 0.2s ease;\n  width: 100%;\n}\n\n.media-card:hover .media-image {\n  transform: scale(1.05);\n}\n\n.media-placeholder {\n  align-items: center;\n  color: #64748b;\n  display: flex;\n  flex-direction: column;\n  font-size: 2.5rem;\n  gap: 0.5rem;\n  justify-content: center;\n  opacity: 0.6;\n}\n\n.media-placeholder.cors-error {\n  background: linear-gradient(135deg, #fef2f2 0%, #fef2f2 100%);\n  color: #ef4444;\n  opacity: 1;\n}\n\n.cors-message {\n  align-items: center;\n  display: flex;\n  flex-direction: column;\n  font-size: 0.75rem;\n  gap: 0.25rem;\n  text-align: center;\n}\n\n.cors-message small {\n  display: block;\n  font-weight: 500;\n}\n\n/* Franklin-style SVG handling */\n:host > svg {\n  display: none;\n}\n\n/* Icon styles */\n.empty-icon,\n.media-type-icon,\n.action-icon,\n.placeholder-icon {\n  color: currentcolor;\n  display: block;\n}\n\n.empty-icon {\n  color: #64748b;\n  height: 48px;\n  margin-bottom: 8px;\n  width: 48px;\n}\n\n.media-type-badge {\n  align-items: center;\n  background: rgb(0 0 0 / 0.7);\n  border: none;\n  border-radius: 4px;\n  box-shadow: none;\n  color: #fff;\n  display: flex;\n  justify-content: center;\n  outline: none;\n  padding: 4px;\n  position: absolute;\n  right: 8px;\n  top: 8px;\n}\n\n.media-type-badge svg {\n  color: #fff;\n  fill: currentcolor;\n}\n\n.media-type-icon {\n  color: #fff;\n  fill: currentcolor;\n  height: 16px;\n  width: 16px;\n}\n\n.action-icon {\n  color: #fff;\n  fill: currentcolor;\n  height: 18px;\n  width: 18px;\n}\n\n.placeholder-icon {\n  color: #64748b;\n  height: 32px;\n  margin-bottom: 8px;\n  width: 32px;\n}\n\n.media-info {\n  background: #2d3748;\n  display: flex;\n  flex-direction: column;\n  justify-content: space-between;\n  padding: 8px;\n  position: relative;\n}\n\n.media-name {\n  color: #fff;\n  font-size: 0.875rem;\n  font-weight: 700;\n  line-height: 1.4;\n  margin: 0 0 4px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n\n.media-details {\n  display: flex;\n  flex: 1;\n  flex-direction: column;\n  gap: 2px;\n}\n\n.media-actions {\n  align-items: center;\n  display: flex;\n  gap: 4px;\n  justify-content: space-between;\n  margin-top: 4px;\n  min-height: 32px;\n}\n\n.usage-count {\n  background: rgb(255 255 255 / 0.1);\n  border: 1px solid rgb(255 255 255 / 0.2);\n  border-radius: 4px;\n  color: rgb(255 255 255 / 0.8);\n  font-size: var(--ml-font-size-xs);\n  font-weight: 600;\n  padding: 2px 6px;\n}\n\n.action-button {\n  align-items: center;\n  background: rgb(255 255 255 / 0.15);\n  border: 1px solid rgb(255 255 255 / 0.4);\n  border-radius: 4px;\n  box-shadow: 0 1px 2px rgb(0 0 0 / 0.1);\n  color: #fff;\n  cursor: pointer;\n  display: flex;\n  height: 32px;\n  justify-content: center;\n  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);\n  width: 32px;\n}\n\n.action-button:hover {\n  background: rgb(255 255 255 / 0.2);\n  border-color: rgb(255 255 255 / 0.5);\n  color: #fff;\n}\n\n/* Responsive breakpoints for card widths */\n@media (max-width: 1200px) {\n  .media-preview {\n    height: 200px;\n  }\n}\n\n@media (max-width: 992px) {\n  .media-preview {\n    height: 190px;\n  }\n}\n\n@media (max-width: 768px) {\n  .media-main {\n    padding: var(--ml-space-sm);\n  }\n  \n  .media-preview {\n    height: 180px;\n  }\n}\n\n@media (max-width: 576px) {\n  .media-main {\n    padding: var(--ml-space-xs);\n  }\n  \n  .media-preview {\n    height: 170px;\n  }\n}\n\n@media (max-width: 480px) {\n  .media-main {\n    padding: var(--ml-space-xs);\n  }\n  \n  .media-preview {\n    height: 160px;\n  }\n}\n\n.empty-state {\n  align-items: center;\n  color: #64748b;\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  padding: 24px;\n  text-align: center;\n  width: 100%;\n}\n\n.empty-state svg {\n  height: 48px;\n  margin-bottom: 16px;\n  opacity: 0.5;\n  width: 48px;\n}\n\n/* Search highlighting */\nmark {\n  background: #fef3c7;\n  border-radius: 2px;\n  color: #92400e;\n  font-weight: 600;\n  padding: 0;\n}\n";
  class MediaGrid extends LocalizableElement {
    constructor() {
      super();
      this.mediaData = [];
      this.searchQuery = "";
      this.locale = "en";
      this.isProcessing = false;
      this.visibleStart = 0;
      this.visibleEnd = 50;
      this.colCount = 4;
      this.iconsLoaded = false;
      this.containerRef = e$1();
      this.virtualScroll = new GridVirtualScrollManager({
        onRangeChange: (range) => {
          this.visibleStart = range.start;
          this.visibleEnd = range.end;
          requestAnimationFrame(() => {
            this.requestUpdate();
          });
        },
        onColCountChange: (colCount) => {
          this.colCount = colCount;
          requestAnimationFrame(() => {
            this.requestUpdate();
          });
        }
      });
    }
    connectedCallback() {
      super.connectedCallback();
    }
    async firstUpdated() {
      this.setupScrollListener();
      window.addEventListener("resize", () => {
        this.virtualScroll.updateColCount();
      });
    }
    shouldUpdate(changedProperties) {
      return changedProperties.has("mediaData") || changedProperties.has("searchQuery") || changedProperties.has("isProcessing") || changedProperties.has("visibleStart") || changedProperties.has("visibleEnd") || changedProperties.has("colCount") || changedProperties.has("locale");
    }
    willUpdate(changedProperties) {
      if (changedProperties.has("mediaData")) {
        if (this.mediaData && this.mediaData.length > 0) {
          this.virtualScroll.resetState(this.mediaData.length);
        } else {
          this.visibleStart = 0;
          this.visibleEnd = 0;
        }
      }
    }
    updated(changedProperties) {
      var _a2;
      if (changedProperties.has("mediaData") && ((_a2 = this.mediaData) == null ? void 0 : _a2.length) > 0 && !this.iconsLoaded) {
        this.loadIcons();
        this.iconsLoaded = true;
      }
      if (changedProperties.has("mediaData")) {
        this.updateComplete.then(() => {
          if (this.mediaData && this.mediaData.length > 0) {
            if (!this.virtualScroll.scrollListenerAttached) {
              this.setupScrollListener();
            } else {
              this.virtualScroll.updateTotalItems(this.mediaData.length);
              this.virtualScroll.calculateVisibleRange();
              this.virtualScroll.onVisibleRangeChange();
            }
          }
        });
      }
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      this.virtualScroll.cleanup();
    }
    async loadIcons() {
      const ICONS = [
        "./icons/photo.svg",
        "./icons/video.svg",
        "./icons/pdf.svg",
        "./icons/external-link.svg",
        "./icons/copy.svg"
      ];
      const existingIcons = this.shadowRoot.querySelectorAll("svg[id]");
      const loadedIconIds = Array.from(existingIcons).map((icon) => icon.id);
      const missingIcons = ICONS.filter((iconPath) => {
        const iconId = iconPath.split("/").pop().replace(".svg", "");
        return !loadedIconIds.includes(iconId);
      });
      if (missingIcons.length > 0) {
        await getSvg({ parent: this.shadowRoot, paths: missingIcons });
      }
    }
    setupScrollListener() {
      requestAnimationFrame(() => {
        var _a2;
        const container = this.containerRef.value;
        if (container) {
          this.virtualScroll.init(container, ((_a2 = this.mediaData) == null ? void 0 : _a2.length) || 0);
          this.virtualScroll.updateColCount();
          this.virtualScroll.calculateVisibleRange();
          this.virtualScroll.onVisibleRangeChange();
        }
      });
    }
    render() {
      if (!this.mediaData || this.mediaData.length === 0) {
        return x$1`
        <div class="empty-state">
          <svg class="empty-icon">
            <use href="#photo"></use>
          </svg>
          <h3>${this.t("mediaLibrary.noResults")}</h3>
          <p>${this.t("mediaLibrary.loadingMedia")}</p>
        </div>
      `;
      }
      const totalHeight = this.virtualScroll.calculateTotalHeight(this.mediaData.length);
      const visibleItems = this.mediaData.slice(this.visibleStart, this.visibleEnd);
      return x$1`
      <main class="media-main" ${n$1(this.containerRef)}>
        <div class="media-grid" style="height: ${totalHeight}px;">
          ${c$1(visibleItems, (media) => media.url, (media, i2) => {
        const index = this.visibleStart + i2;
        const position = this.virtualScroll.calculateItemPosition(index);
        return this.renderMediaCard(media, index, position);
      })}
        </div>
      </main>
    `;
    }
    renderMediaCard(media, index, position) {
      const mediaType = getMediaType(media);
      this.getMediaTypeIcon(mediaType);
      return x$1`
      <div 
        class="media-card" 
        data-index="${index}"
        style="position: absolute; top: ${position.top}px; left: ${position.left}px; width: ${this.virtualScroll.itemWidth - this.virtualScroll.cardSpacing}px; height: ${this.virtualScroll.itemHeight - this.virtualScroll.cardSpacing}px;"
        @click=${() => this.handleMediaClick(media)}
      >
        <div class="media-preview">
          ${this.renderMediaPreview(media, mediaType)}
          <div class="media-type-badge">
            <svg class="media-type-icon">
              <use href="#${this.getMediaTypeIcon(mediaType)}"></use>
            </svg>
          </div>
        </div>
        
        <div class="media-info">
          <div class="media-details">
            <h4 class="media-name" title=${media.name} .innerHTML=${this.highlightSearchTerm(this.truncateText(media.name, 35), this.searchQuery)}></h4>
          </div>
          
          <div class="media-actions">
            <span class="usage-count">${this.getUsageCount(media)} uses</span>
            <button 
              class="action-button"
              @click=${(e2) => this.handleAction(e2, "copy", media)}
              title=${this.t("media.copyUrl")}
            >
              <svg class="action-icon">
                <use href="#copy"></use>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
    }
    renderMediaPreview(media, mediaType) {
      if (isImage(media.url) && media.hasError !== true) {
        return x$1`
        <img 
          class="media-image" 
          src=${media.url} 
          alt=${media.alt || media.name}
          loading="lazy"
          @error=${(e2) => this.handleImageError(e2, media)}
        />
      `;
      }
      if (isImage(media.url) && media.hasError === true) {
        return x$1`
        <div class="media-placeholder cors-error">
          <svg class="placeholder-icon">
            <use href="#photo"></use>
          </svg>
          <div class="cors-message">
            <small>CORS blocked</small>
            <small>${this.getDomainFromUrl(media.url)}</small>
          </div>
        </div>
      `;
      }
      if (isVideo(media.url) && media.hasError !== true) {
        return this.renderVideoPreview(media);
      }
      if (isVideo(media.url) && media.hasError === true) {
        return x$1`
        <div class="media-placeholder cors-error">
          <svg class="placeholder-icon">
            <use href="#video"></use>
          </svg>
          <div class="cors-message">
            <small>CORS blocked</small>
            <small>${this.getDomainFromUrl(media.url)}</small>
          </div>
        </div>
      `;
      }
      return x$1`
      <div class="media-placeholder">
        <svg class="placeholder-icon">
          <use href="#${this.getMediaTypeIcon(mediaType)}"></use>
        </svg>
      </div>
    `;
    }
    getMediaTypeIcon(mediaType) {
      const iconMap = {
        image: "photo",
        video: "video",
        document: "pdf",
        link: "external-link"
      };
      return iconMap[mediaType] || "photo";
    }
    getDomainFromUrl(url) {
      try {
        const urlObj = new URL(url);
        return urlObj.hostname;
      } catch (error) {
        return "unknown";
      }
    }
    truncateText(text, maxLength = 30) {
      if (!text || text.length <= maxLength)
        return text;
      return `${text.substring(0, maxLength)}...`;
    }
    getUsageCount(media) {
      return media.usageCount || 0;
    }
    handleMediaClick(media) {
      this.dispatchEvent(new CustomEvent("mediaClick", {
        detail: { media },
        bubbles: true
      }));
    }
    handleAction(e2, action, media) {
      e2.stopPropagation();
      this.dispatchEvent(new CustomEvent("mediaAction", {
        detail: { action, media },
        bubbles: true
      }));
    }
    renderVideoPreview(media) {
      if (isExternalVideoUrl(media.url)) {
        const thumbnail = getVideoThumbnail(media.url);
        return x$1`
        <div class="video-thumbnail-container">
          ${thumbnail ? x$1`
            <img 
              class="video-thumbnail" 
              src=${thumbnail} 
              alt=${media.alt || media.name}
              loading="lazy"
              @error=${(e2) => this.handleVideoThumbnailError(e2, media)}
            />
          ` : x$1`
            <div class="video-placeholder">
              <svg class="video-icon">
                <use href="#video"></use>
              </svg>
            </div>
          `}
          <div class="video-play-overlay">
            <svg class="play-icon">
              <use href="#external-link"></use>
            </svg>
          </div>
        </div>
      `;
      }
      return x$1`
      <video 
        class="media-video" 
        src=${media.url} 
        preload="metadata"
        muted
        @error=${(e2) => this.handleVideoError(e2, media)}
        @loadedmetadata=${(e2) => this.handleVideoLoaded(e2, media)}
      />
    `;
    }
    handleImageError(e2, media) {
      media.hasError = true;
      e2.target.style.display = "none";
      this.requestUpdate();
    }
    handleVideoError(e2, media) {
      media.hasError = true;
      e2.target.style.display = "none";
      this.requestUpdate();
    }
    handleVideoThumbnailError(e2) {
      e2.target.style.display = "none";
      this.requestUpdate();
    }
    handleVideoLoaded(e2) {
      const video = e2.target;
      if (video.duration > 0) {
        video.currentTime = 0.1;
      }
    }
    highlightSearchTerm(text, query) {
      if (!query || !text)
        return text;
      let searchTerm = query;
      if (query.includes(":")) {
        const parts = query.split(":");
        if (parts.length > 1) {
          searchTerm = parts[1].trim();
        }
      }
      if (!searchTerm)
        return text;
      const regex = new RegExp(`(${searchTerm})`, "gi");
      return text.replace(regex, "<mark>$1</mark>");
    }
  }
  __publicField(MediaGrid, "properties", {
    mediaData: { type: Array },
    searchQuery: { type: String },
    locale: { type: String },
    isProcessing: { type: Boolean },
    visibleStart: { type: Number },
    visibleEnd: { type: Number },
    colCount: { type: Number }
  });
  __publicField(MediaGrid, "styles", getStyles(gridStyles));
  customElements.define("media-grid", MediaGrid);
  const listStyles = "/* src/components/list/list.css */\n\n/* Franklin-style SVG handling */\n:host > svg {\n  display: none;\n}\n\n/* Icon styles */\n.empty-icon,\n.action-icon,\n.placeholder-icon {\n  color: currentcolor;\n  display: block;\n}\n\n.empty-icon {\n  color: #64748b;\n  height: 48px;\n  margin-bottom: 8px;\n  width: 48px;\n}\n\n.action-icon {\n  color: currentcolor;\n  fill: currentcolor;\n  height: 18px;\n  width: 18px;\n}\n\n.placeholder-icon {\n  color: #64748b;\n  height: 24px;\n  width: 24px;\n}\n\n  .list-main {\n    background: #fff;\n    display: flex;\n    flex-direction: column;\n    height: 100%;\n    overflow: hidden; /* Prevent main container from scrolling */\n  }\n\n  .list-content {\n    flex: 1;\n    height: 100%;\n    overflow-y: auto;\n    position: relative;\n    width: 100%;\n  }\n\n  .list-grid {\n    position: relative;\n    width: 100%;\n  }\n\n  .list-header {\n    background: #f8fafc;\n    border-bottom: 1px solid #e2e8f0;\n    color: #64748b;\n    display: grid;\n    font-size: 0.75rem;\n    font-weight: 600;\n    gap: 16px;\n    grid-template-columns: 60px 1fr 80px 120px 120px auto;\n    letter-spacing: 0.05em;\n    padding: 8px 16px;\n    position: sticky;\n    text-transform: uppercase;\n    top: 0;\n    z-index: 10;\n  }\n\n  .header-cell {\n    align-items: center;\n    display: flex;\n  }\n\n  .media-item {\n    align-items: center;\n    background: #fff;\n    border-bottom: 1px solid #e2e8f0;\n    box-sizing: border-box;\n    cursor: pointer;\n    display: grid;\n    gap: 16px;\n    grid-template-columns: 60px 1fr 80px 120px 120px auto;\n    padding: 16px;\n    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);\n    width: 100%;\n  }\n\n  .media-item:hover {\n    background: #f8fafc;\n  }\n\n\n  .media-thumbnail {\n    align-items: center;\n    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);\n    border: 1px solid #e2e8f0;\n    border-radius: 6px;\n    display: flex;\n    height: 48px;\n    justify-content: center;\n    overflow: hidden;\n    position: relative;\n    width: 48px;\n  }\n\n  .media-thumbnail img {\n    height: 100%;\n    object-fit: cover;\n    width: 100%;\n  }\n\n  .media-thumbnail .placeholder {\n    align-items: center;\n    color: #64748b;\n    display: flex;\n    flex-direction: column;\n    font-size: 1.5rem;\n    gap: 0.25rem;\n    justify-content: center;\n  }\n\n  .media-thumbnail .placeholder.cors-error {\n  background: linear-gradient(135deg, #fef2f2 0%, #fef2f2 100%);\n  color: #ef4444;\n  }\n\n  .media-thumbnail .cors-message {\n    font-size: 0.6rem;\n    font-weight: 500;\n  }\n\n  .media-info {\n    display: flex;\n    flex-direction: column;\n    gap: 4px;\n    min-width: 0;\n  }\n\n  .media-name {\n    color: #1e293b;\n    font-size: 0.875rem;\n    font-weight: 500;\n    margin: 0;\n    overflow: hidden;\n    text-overflow: ellipsis;\n    white-space: nowrap;\n  }\n\n  .media-url {\n    color: #64748b;\n    font-size: 0.75rem;\n    margin: 0;\n    overflow: hidden;\n    text-overflow: ellipsis;\n    white-space: nowrap;\n  }\n\n  .media-type {\n    color: #64748b;\n    font-size: 0.75rem;\n    font-weight: 500;\n    text-transform: uppercase;\n  }\n\n  .media-doc {\n    color: #64748b;\n    font-size: 0.75rem;\n    overflow: hidden;\n    text-overflow: ellipsis;\n    white-space: nowrap;\n  }\n\n  .media-alt {\n    color: #64748b;\n    font-size: 0.75rem;\n    overflow: hidden;\n    text-overflow: ellipsis;\n    white-space: nowrap;\n  }\n\n  .media-actions {\n    display: flex;\n    gap: 4px;\n    opacity: 1;\n  }\n\n  .action-button {\n    align-items: center;\n    background: #fff;\n    border: 1px solid #e2e8f0;\n    border-radius: 4px;\n    color: #64748b;\n    cursor: pointer;\n    display: flex;\n    height: 32px;\n    justify-content: center;\n    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);\n    width: 32px;\n  }\n\n  .action-button svg {\n    color: #64748b;\n    fill: #64748b;\n  }\n\n  .empty-state svg {\n    height: 48px;\n    margin-bottom: 16px;\n    opacity: 0.5;\n    width: 48px;\n  }\n\n\n  @media (max-width: 768px) {\n    .list-header,\n    .media-item {\n      gap: var(--ml-space-sm);\n      grid-template-columns: 50px 1fr 60px 60px auto;\n      padding: var(--ml-space-sm);\n    }\n    \n    .list-header div:nth-child(4),\n    .list-header div:nth-child(5),\n    .media-item .media-doc,\n    .media-item .media-alt {\n      display: none;\n    }\n  }\n\n  @media (max-width: 480px) {\n    .list-header,\n    .media-item {\n      gap: var(--ml-space-xs);\n      grid-template-columns: 40px 1fr auto;\n      padding: var(--ml-space-xs);\n    }\n    \n    .media-thumbnail {\n      height: 32px;\n      width: 32px;\n    }\n    \n    .list-header div:nth-child(3),\n    .list-header div:nth-child(4),\n    .list-header div:nth-child(5),\n    .media-item .media-type,\n    .media-item .media-doc,\n    .media-item .media-alt {\n      display: none;\n    }\n  }\n\n  .empty-state {\n    align-items: center;\n    color: #64748b;\n    display: flex;\n    flex: 1;\n    flex-direction: column;\n    justify-content: center;\n    padding: 24px;\n    text-align: center;\n  }\n\n/* Search highlighting */\nmark {\n  background: #fef3c7;\n  border-radius: 2px;\n  color: #92400e;\n  font-weight: 600;\n  padding: 0;\n}\n";
  class MediaList extends LocalizableElement {
    constructor() {
      super();
      this.mediaData = [];
      this.searchQuery = "";
      this.locale = "en";
      this.visibleStart = 0;
      this.visibleEnd = 50;
      this.containerRef = e$1();
      this.virtualScroll = new ListVirtualScrollManager({
        onRangeChange: (range) => {
          this.visibleStart = range.start;
          this.visibleEnd = range.end;
          requestAnimationFrame(() => {
            this.requestUpdate();
          });
        }
      });
    }
    async connectedCallback() {
      super.connectedCallback();
      await this.loadIcons();
    }
    firstUpdated() {
      this.setupScrollListener();
      window.addEventListener("resize", () => {
        this.virtualScroll.updateContainerDimensions();
      });
    }
    shouldUpdate(changedProperties) {
      return changedProperties.has("mediaData") || changedProperties.has("searchQuery") || changedProperties.has("visibleStart") || changedProperties.has("visibleEnd") || changedProperties.has("locale");
    }
    willUpdate(changedProperties) {
      if (changedProperties.has("mediaData")) {
        if (this.mediaData && this.mediaData.length > 0) {
          this.virtualScroll.resetState(this.mediaData.length);
        } else {
          this.visibleStart = 0;
          this.visibleEnd = 0;
        }
      }
    }
    updated(changedProperties) {
      if (changedProperties.has("mediaData")) {
        this.updateComplete.then(() => {
          if (this.mediaData && this.mediaData.length > 0) {
            if (!this.virtualScroll.scrollListenerAttached) {
              this.setupScrollListener();
            } else {
              this.virtualScroll.updateTotalItems(this.mediaData.length);
              this.virtualScroll.calculateVisibleRange();
              this.virtualScroll.onVisibleRangeChange();
            }
          }
        });
      }
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      this.virtualScroll.cleanup();
    }
    setupScrollListener() {
      requestAnimationFrame(() => {
        var _a2;
        const container = this.containerRef.value;
        if (container) {
          this.virtualScroll.init(container, ((_a2 = this.mediaData) == null ? void 0 : _a2.length) || 0);
          this.virtualScroll.calculateVisibleRange();
          this.virtualScroll.onVisibleRangeChange();
        }
      });
    }
    async loadIcons() {
      const ICONS = [
        "./icons/photo.svg",
        "./icons/video.svg",
        "./icons/pdf.svg",
        "./icons/external-link.svg",
        "./icons/copy.svg"
      ];
      const existingIcons = this.shadowRoot.querySelectorAll("svg[id]");
      const loadedIconIds = Array.from(existingIcons).map((icon) => icon.id);
      const missingIcons = ICONS.filter((iconPath) => {
        const iconId = iconPath.split("/").pop().replace(".svg", "");
        return !loadedIconIds.includes(iconId);
      });
      if (missingIcons.length > 0) {
        await getSvg({ parent: this.shadowRoot, paths: missingIcons });
      }
    }
    render() {
      if (!this.mediaData || this.mediaData.length === 0) {
        return x$1`
        <div class="empty-state">
          <svg class="empty-icon">
            <use href="#photo"></use>
          </svg>
          <h3>${this.t("mediaLibrary.noResults")}</h3>
          <p>${this.t("mediaLibrary.loadingMedia")}</p>
        </div>
      `;
      }
      const totalHeight = this.virtualScroll.getTotalHeight();
      const visibleItems = this.mediaData.slice(this.visibleStart, this.visibleEnd);
      return x$1`
      <main class="list-main">
        <div class="list-header">
          <div class="header-cell"></div>
          <div class="header-cell">${this.t("media.fileName")}</div>
          <div class="header-cell">Type</div>
          <div class="header-cell">Document</div>
          <div class="header-cell">Alt Text</div>
          <div class="header-cell">Actions</div>
        </div>
        <div class="list-content" ${n$1(this.containerRef)}>
          <div class="list-grid" style="height: ${totalHeight}px;">
            ${c$1(visibleItems, (media) => media.url, (media, i2) => {
        const index = this.visibleStart + i2;
        const offset = this.virtualScroll.getItemOffset(index);
        return this.renderListItem(media, index, offset);
      })}
          </div>
        </div>
      </main>
    `;
    }
    renderListItem(media, index, offset) {
      const mediaType = getMediaType(media);
      return x$1`
      <div 
        class="media-item" 
        data-index="${index}"
        style="position: absolute; top: ${offset}px; left: 0; right: 0;"
        @click=${() => this.handleMediaClick(media)}
      >
        <div class="media-thumbnail">
          ${this.renderThumbnail(media, mediaType)}
        </div>
        
        <div class="media-info">
          <h4 class="media-name" title=${media.name} .innerHTML=${this.highlightSearchTerm(this.truncateText(media.name, 35), this.searchQuery)}></h4>
          <p class="media-url" title=${media.url} .innerHTML=${this.highlightSearchTerm(this.getShortUrl(media.url), this.searchQuery)}></p>
        </div>
        
        <div class="media-type">
          ${this.getDisplayMediaType(mediaType)}
        </div>
        
        <div class="media-doc" title=${media.doc || ""} .innerHTML=${this.highlightSearchTerm(this.getShortDoc(media.doc), this.searchQuery)}>
        </div>
        
        <div class="media-alt" title=${media.alt || ""} .innerHTML=${this.highlightSearchTerm(this.getShortAlt(media.alt), this.searchQuery)}>
        </div>
        
        <div class="media-actions">
          <button 
            class="action-button"
            @click=${(e2) => this.handleAction(e2, "copy", media)}
            title=${this.t("media.copyUrl")}
          >
            <svg class="action-icon">
              <use href="#copy"></use>
            </svg>
          </button>
        </div>
      </div>
    `;
    }
    renderThumbnail(media, mediaType) {
      if (isImage(media.url) && media.hasError !== true) {
        return x$1`
        <img 
          src=${media.url} 
          alt=${media.alt || media.name}
          loading="lazy"
          @error=${(e2) => this.handleImageError(e2, media)}
        />
      `;
      }
      if (isImage(media.url) && media.hasError === true) {
        return x$1`
        <div class="placeholder cors-error">
          <svg class="placeholder-icon">
            <use href="#photo"></use>
          </svg>
          <div class="cors-message">
            <small>CORS</small>
          </div>
        </div>
      `;
      }
      return x$1`
      <div class="placeholder">
        <svg class="placeholder-icon">
          <use href="#${this.getMediaTypeIcon(mediaType)}"></use>
        </svg>
      </div>
    `;
    }
    getMediaTypeIcon(mediaType) {
      switch (mediaType) {
        case "image":
          return "photo";
        case "video":
          return "video";
        case "document":
          return "pdf";
        case "link":
          return "external-link";
        default:
          return "photo";
      }
    }
    truncateText(text, maxLength = 30) {
      if (!text || text.length <= maxLength)
        return text;
      return `${text.substring(0, maxLength)}...`;
    }
    getDisplayMediaType(mediaType) {
      switch (mediaType) {
        case "image":
          return "IMG";
        case "video":
          return "VID";
        case "document":
          return "DOC";
        case "link":
          return "LNK";
        default:
          return "FILE";
      }
    }
    getShortUrl(url) {
      if (!url)
        return "";
      try {
        const urlObj = new URL(url);
        return urlObj.pathname.split("/").pop() || urlObj.hostname;
      } catch {
        return url.split("/").pop() || url;
      }
    }
    getShortDoc(doc) {
      if (!doc)
        return this.t("media.notUsed");
      return doc.split("/").pop() || doc;
    }
    getShortAlt(alt) {
      if (!alt || alt === "null")
        return "—";
      return alt;
    }
    handleMediaClick(media) {
      this.dispatchEvent(new CustomEvent("mediaClick", {
        detail: { media },
        bubbles: true
      }));
    }
    handleAction(e2, action, media) {
      e2.stopPropagation();
      this.dispatchEvent(new CustomEvent("mediaAction", {
        detail: { action, media },
        bubbles: true
      }));
    }
    handleImageError(e2, media) {
      media.hasError = true;
      e2.target.style.display = "none";
      this.requestUpdate();
    }
    highlightSearchTerm(text, query) {
      if (!query || !text)
        return text;
      let searchTerm = query;
      if (query.includes(":")) {
        const parts = query.split(":");
        if (parts.length > 1) {
          searchTerm = parts[1].trim();
        }
      }
      if (!searchTerm)
        return text;
      const regex = new RegExp(`(${searchTerm})`, "gi");
      return text.replace(regex, "<mark>$1</mark>");
    }
  }
  __publicField(MediaList, "properties", {
    mediaData: { type: Array },
    searchQuery: { type: String },
    locale: { type: String },
    visibleStart: { type: Number },
    visibleEnd: { type: Number }
  });
  __publicField(MediaList, "styles", getStyles(listStyles));
  customElements.define("media-list", MediaList);
  const modalManagerStyles = `/* src/components/modal-manager/modal-manager.css */

/* Franklin-style SVG handling */
:host > svg {
  display: none;
}

/* Icon styles */
.close-icon,
.preview-icon,
.action-icon {
  color: currentcolor;
  display: block;
}

.close-icon {
  height: 20px;
  width: 20px;
}

.preview-icon {
  color: #64748b;
  height: 64px;
  width: 64px;
}

.action-icon {
  height: 16px;
  width: 16px;
}

  .modal-overlay {
    align-items: center;
    background: rgb(0 0 0 / 0.5);
    bottom: 0;
    display: flex;
    justify-content: center;
    left: 0;
    opacity: 0;
    padding: 20px;
    position: fixed;
    right: 0;
    top: 0;
    transition: opacity 0.3s ease, visibility 0.3s ease;
    visibility: hidden;
    z-index: 99999;
  }

  .modal-overlay[open] {
    opacity: 1;
    visibility: visible;
  }

  .modal-content {
    background: #f8f9fa;
    border-radius: 8px;
    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
    display: flex;
    flex-direction: column;
    max-height: 95vh;
    max-width: 1200px;
    overflow: hidden;
    transform: scale(0.9) translateY(20px);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    width: 100%;
  }

  .modal-overlay[open] .modal-content {
    transform: scale(1) translateY(0);
  }

  .modal-header {
    align-items: center;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    padding: 20px 24px;
  }

  .modal-title {
    color: #1e293b;
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0;
  }

  .close-button {
    align-items: center;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: #64748b;
    cursor: pointer;
    display: flex;
    height: 32px;
    justify-content: center;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    width: 32px;
  }

  .close-button:hover {
    background: #f3f4f6;
    color: #1e293b;
  }
  

  .modal-body {
    background: #f8f9fa;
    flex: 1;
    overflow-y: auto;
    padding: 24px;
  }
  
  .media-preview-section {
    align-items: center;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    display: flex;
    justify-content: center;
    margin-bottom: 24px;
    max-height: 400px;
    min-height: 300px;
    overflow: hidden;
    padding: 20px;
    position: relative;
    text-align: center;
  }

  .media-preview {
    border-radius: var(--ml-radius-lg);
    box-shadow: 0 4px 16px rgb(0 0 0 / 0.15);
    display: block;
    height: auto;
    max-height: 100%;
    max-width: 100%;
    object-fit: contain;
    width: auto;
  }
  
  .preview-placeholder {
    align-items: center;
    background: #e9ecef;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.1);
    display: flex;
    height: 150px;
    justify-content: center;
    margin: 0 auto;
    width: 150px;
  }

  .pdf-preview {
    align-items: center;
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    height: 300px;
    justify-content: center;
    margin: 0 auto;
    max-width: 400px;
    padding: 24px;
    text-align: center;
  }

  .pdf-preview-header {
    align-items: center;
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 24px;
  }

  .pdf-icon {
    color: #ef4444;
    fill: #ef4444;
    height: 48px;
    width: 48px;
  }

  .pdf-preview-header h3 {
    color: #1e293b;
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
  }

  .pdf-preview-header p {
    color: #64748b;
    font-size: 0.875rem;
    margin: 0;
    overflow-wrap: break-word;
  }

  .pdf-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    width: 100%;
  }

  .pdf-action-btn {
    align-items: center;
    background: #3b82f6;
    border: none;
    border-radius: 6px;
    color: #fff;
    cursor: pointer;
    display: flex;
    font-size: 0.9rem;
    font-weight: 600;
    gap: 4px;
    justify-content: center;
    min-width: 140px;
    padding: 16px 24px;
    text-decoration: none;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .pdf-action-btn:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }

  .pdf-action-btn svg {
    fill: currentcolor;
    height: 16px;
    width: 16px;
  }
  
  .modal-tabs {
    background: #f8f9fa;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    gap: 0;
    padding: 0;
  }
  
  .tab-btn {
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: #64748b;
    cursor: pointer;
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    padding: 12px 16px;
    position: relative;
    transition: all 0.2s ease;
  }
  
  .tab-btn:hover {
    background: #f1f5f9;
    color: #1e293b;
  }
  
  .tab-btn.active {
    background: #fff;
    border-bottom-color: #3b82f6;
    color: #3b82f6;
    font-weight: 600;
  }
  
  .tab-btn.active::after {
    background: #fff;
    bottom: -1px;
    content: "";
    height: 1px;
    left: 0;
    position: absolute;
    right: 0;
  }

  .media-info {
    display: grid;
    gap: 16px;
  }

  .info-row {
    align-items: start;
    display: grid;
    gap: 16px;
    grid-template-columns: 120px 1fr;
  }

  .info-label {
    color: #64748b;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .info-value {
    color: #1e293b;
    font-size: 0.875rem;
    word-break: break-all;
  }

  .usage-list {
    margin-top: 24px;
  }

  .usage-item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    margin-bottom: 8px;
    padding: 8px;
  }

  .usage-doc {
    color: #1e293b;
    font-weight: 500;
    margin-bottom: 4px;
  }

  .usage-context {
    color: #64748b;
    font-size: 0.75rem;
  }

  .metadata-section {
    margin-bottom: 24px;
  }
  
  .metadata-table-container {
    margin-bottom: 24px;
    overflow-x: auto;
    padding: 0;
  }
  
  .metadata-table,
  .usage-table {
    border-collapse: collapse;
    font-size: 13px;
    width: 100%;
  }
  
  .metadata-table th {
    background: #e9ecef;
    border-bottom: 1px solid #e5e7eb;
    color: #1e293b;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    padding: 8px 12px;
    text-align: left;
    text-transform: uppercase;
  }
  
  .metadata-table td {
    border-bottom: 1px solid #f3f4f6;
    padding: 8px 12px;
    vertical-align: top;
  }
  
  .metadata-table tr:hover {
    background: #f9fafb;
  }
  
  .usage-table td {
    border-bottom: 1px solid #f3f4f6;
    padding: 8px 12px;
    vertical-align: top;
  }
  
  .usage-table tr:hover {
    background: #f9fafb;
  }
  
  .usage-row:last-child td {
    border-bottom: none;
  }
  
  .metadata-table .metadata-row:last-child td {
    border-bottom: none;
  }
  
  .metadata-label {
    color: #1e293b;
    font-weight: 500;
    width: 120px;
  }
  
  .metadata-value {
    color: #64748b;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    font-size: 0.875rem;
    line-height: 1.5;
    overflow-wrap: break-word;
    white-space: pre-line;
  }


  /* Analysis metadata styles */
  .analysis-section {
    background: #f8f9fa;
    border-top: 2px solid #e5e7eb;
  }

  .analysis-section .metadata-label {
    color: #1e293b;
    font-weight: 600;
  }

  .analysis-subrow {
    background: #f8fafc;
  }

  .analysis-subrow .metadata-label {
    color: #64748b;
    font-weight: 500;
    padding-left: 16px;
  }

  .analysis-unavailable {
    color: #9ca3af;
    font-style: italic;
  }

  .color-preview {
    align-items: center;
    display: flex;
    gap: 8px;
  }

  .color-swatch {
    border: 1px solid #e5e7eb;
    border-radius: 2px;
    display: inline-block;
    flex-shrink: 0;
    height: 16px;
    width: 16px;
  }

  .usage-sections {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  
  .usage-section {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .document-heading {
    background: #f8f9fa;
    border-bottom: 1px solid #e5e7eb;
    padding: 12px 16px;
  }
  
  .document-heading h3 {
    color: #1e293b;
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 4px;
    word-break: break-all;
  }
  
  .usage-table-container {
    margin-bottom: 24px;
    overflow-x: auto;
    padding: 0;
  }
  
  .usage-table {
    min-width: 1000px;
  }
  
  .usage-table th {
    background: #e9ecef;
    border-bottom: 1px solid #e5e7eb;
    color: #1e293b;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    padding: 8px 12px;
    text-align: left;
    text-transform: uppercase;
  }
  
  .alt-cell {
    min-width: 200px;
    width: 200px;
  }
  
  .context-cell {
    flex: 2;
    min-width: 500px;
  }
  
  .actions-cell {
    text-align: center;
    width: 120px;
  }
  
  .actions-container {
    align-items: center;
    display: flex;
    gap: 4px;
    justify-content: center;
  }
  
  .context-text {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    color: #1e293b;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    font-size: 0.75rem;
    line-height: 1.6;
    max-height: 200px;
    max-width: 800px;
    overflow-wrap: break-word;
    overflow-y: auto;
    padding: 12px 16px;
    white-space: pre-line;
  }

  .context-text strong {
    color: #1e293b;
    font-weight: 600;
  }

  /* New user-friendly context display styles */
  .context-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .context-item {
    align-items: flex-start;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    display: flex;
    font-size: 0.75rem;
    gap: 8px;
    line-height: 1.4;
    padding: 8px 12px;
  }

  .context-label {
    color: #64748b;
    flex-shrink: 0;
    font-size: 0.688rem;
    font-weight: 600;
    min-width: 80px;
  }

  .context-value {
    color: #1e293b;
    flex: 1;
    overflow-wrap: break-word;
    white-space: pre-line;
  }

  .no-context {
    color: #9ca3af;
    font-size: 0.75rem;
    font-style: italic;
  }


  .alt-text {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    color: #64748b;
    font-size: 0.875rem;
    max-width: 300px;
    overflow-wrap: break-word;
    padding: 4px 8px;
    white-space: pre-line;
  }
  
  .action-button {
    align-items: center;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    color: #1e293b;
    cursor: pointer;
    display: inline-flex;
    font-size: 0.75rem;
    font-weight: 500;
    gap: 4px;
    padding: 4px 8px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .action-button:hover {
    background: #3b82f6;
    border-color: #3b82f6;
    color: #fff;
  }
  
.no-usage {
  color: #64748b;
  padding: 64px 24px;
  text-align: center;
}
`;
  class ModalManager extends LocalizableElement {
    constructor() {
      super();
      __publicField(this, "handleOpenModal", (e2) => {
        window.dispatchEvent(new Event("close-modal"));
        this.modalData = e2.detail;
        this.isOpen = true;
      });
      __publicField(this, "handleCloseModal", () => {
        this.isOpen = false;
        this.modalData = null;
        this._activeTab = "usage";
      });
      __publicField(this, "handleTabChange", (e2) => {
        const { tab } = e2.target.dataset;
        this._activeTab = tab;
      });
      this.locale = "en";
      this.isOpen = false;
      this.modalData = null;
      this._activeTab = "usage";
    }
    async connectedCallback() {
      super.connectedCallback();
      await this.loadIcons();
      window.addEventListener("open-modal", this.handleOpenModal);
      window.addEventListener("close-modal", this.handleCloseModal);
    }
    async loadIcons() {
      const ICONS = [
        "./icons/close.svg",
        "./icons/photo.svg",
        "./icons/video.svg",
        "./icons/pdf.svg",
        "./icons/external-link.svg",
        "./icons/copy.svg"
      ];
      const existingIcons = this.shadowRoot.querySelectorAll("svg[id]");
      if (existingIcons.length === 0) {
        await getSvg({ parent: this.shadowRoot, paths: ICONS });
      }
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      window.removeEventListener("open-modal", this.handleOpenModal);
      window.removeEventListener("close-modal", this.handleCloseModal);
    }
    getUsageCount() {
      var _a2, _b, _c;
      const usageCount = ((_c = (_b = (_a2 = this.modalData) == null ? void 0 : _a2.data) == null ? void 0 : _b.media) == null ? void 0 : _c.usageCount) || 0;
      return usageCount;
    }
    shouldShowPreviewEditButtons() {
      var _a2, _b;
      const previewEditDomains = [
        "content.da.live"
      ];
      const source = ((_b = (_a2 = this.modalData) == null ? void 0 : _a2.data) == null ? void 0 : _b.source) || "";
      return previewEditDomains.some((domain) => source.includes(domain));
    }
    getAltTextDisplay(alt, mediaType = null) {
      if (mediaType && (mediaType.startsWith("video") || mediaType === "video")) {
        return "N/A";
      }
      if (!alt || alt === "null") {
        return "Missing Alt";
      }
      if (alt === "") {
        return "Decorative";
      }
      return alt;
    }
    formatContextAsHtml(context) {
      if (!context)
        return x$1`<span class="no-context">No context available</span>`;
      const parts = context.split(" > ");
      const contextItems = [];
      parts.forEach((part) => {
        if (part.startsWith("In:")) {
          const containerInfo = part.replace("In:", "").trim();
          if (containerInfo && containerInfo !== "undefined" && containerInfo.length > 0) {
            const simplified = this.simplifyContainerInfo(containerInfo);
            contextItems.push(x$1`
            <div class="context-item">
              <span class="context-label">Container</span>
              <span class="context-value">${simplified}</span>
            </div>
          `);
          }
        } else if (part.startsWith("text:")) {
          const textInfo = part.replace("text:", "").trim();
          if (textInfo && textInfo !== "undefined" && textInfo.length > 0) {
            const cleanedText = this.cleanTextContent(textInfo);
            if (cleanedText) {
              const truncated = this.truncateText(cleanedText, 200);
              contextItems.push(x$1`
              <div class="context-item">
                <span class="context-label">Text</span>
                <span class="context-value">${truncated}</span>
              </div>
            `);
            }
          }
        }
      });
      if (contextItems.length === 0) {
        return x$1`<span class="no-context">No context available</span>`;
      }
      return x$1`<div class="context-container">${contextItems}</div>`;
    }
    simplifyContainerInfo(containerInfo) {
      if (!containerInfo)
        return "";
      const simplified = containerInfo.replace(/max-md:[^-\s]+/g, "").replace(/!-[^-\s]+/g, "").replace(/calc\([^)]+\)/g, "").replace(/\[[^\]]+\]/g, "").replace(/\s+/g, " ").trim();
      if (simplified && simplified.length > 0 && simplified !== "undefined") {
        return simplified;
      }
      const meaningfulParts = containerInfo.split(" ").filter((part) => part.length > 2 && !part.includes("max-md") && !part.includes("!-") && !part.includes("calc") && !part.includes("[") && !part.includes("]"));
      return meaningfulParts.length > 0 ? meaningfulParts[0] : "Container";
    }
    cleanTextContent(text) {
      if (!text)
        return "";
      return text.replace(/\s+/g, " ").replace(/\n\s*\n/g, " ").replace(/^\s+|\s+$/g, "").replace(/\s{2,}/g, " ").trim();
    }
    truncateText(text, maxLength = 50) {
      if (!text || text.length <= maxLength)
        return text;
      const truncated = text.substring(0, maxLength);
      const lastSpaceIndex = truncated.lastIndexOf(" ");
      if (lastSpaceIndex > maxLength * 0.8) {
        return `${text.substring(0, lastSpaceIndex)}...`;
      }
      return `${truncated}...`;
    }
    convertMarkdownToHtml(text) {
      const lines = text.split("\n");
      return x$1`<div>${lines.map((line) => {
        if (line.trim() === "")
          return x$1`<br>`;
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return x$1`<div>${parts.map((part) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            const boldText = part.slice(2, -2);
            return x$1`<strong>${boldText}</strong>`;
          }
          return part;
        })}</div>`;
      })}</div>`;
    }
    render() {
      if (!this.isOpen || !this.modalData) {
        return x$1``;
      }
      return x$1`
      <div class="modal-overlay" ?open=${this.isOpen} @click=${this.handleOverlayClick}>
        <div class="modal-content" @click=${this.handleContentClick}>
          <div class="modal-header">
            <h2 class="modal-title">${this.getModalTitle()}</h2>
            <button class="close-button" @click=${this.handleCloseModal} title="Close">
              <svg class="close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div class="media-preview-section">
            ${this.renderModalPreview()}
          </div>
          
          <div class="modal-tabs">
            <button 
              type="button"
              class="tab-btn ${this._activeTab === "usage" ? "active" : ""}"
              data-tab="usage"
              @click=${this.handleTabChange}
            >
              Usage (${this.getUsageCount()})
            </button>
            <button 
              type="button"
              class="tab-btn ${this._activeTab === "metadata" ? "active" : ""}"
              data-tab="metadata"
              @click=${this.handleTabChange}
            >
              Metadata
            </button>
          </div>
          
          <div class="modal-body">
            ${this._activeTab === "usage" ? this.renderUsageTab() : this.renderMetadataTab()}
          </div>
        </div>
      </div>
    `;
    }
    renderUsageTab() {
      const { usageData } = this.modalData.data;
      if (!usageData || usageData.length === 0) {
        return x$1`
        <div class="no-usage">
          <p>Not Used</p>
        </div>
      `;
      }
      const groupedUsages = usageData.reduce((groups, usage) => {
        const doc = usage.doc || "Unknown Document";
        if (!groups[doc]) {
          groups[doc] = [];
        }
        groups[doc].push(usage);
        return groups;
      }, {});
      return x$1`
      <div class="usage-sections">
        ${Object.entries(groupedUsages).map(([doc, usages]) => x$1`
          <div class="usage-section">
            <div class="document-heading">
              <h3>${doc}</h3>
            </div>
            <div class="usage-table-container">
              <table class="usage-table">
                <thead>
                  <tr>
                    <th>Alt Text</th>
                    <th>Context</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${usages.map((usage) => {
        const shouldShowPreviewEdit = this.shouldShowPreviewEditButtons();
        return x$1`
                    <tr class="usage-row">
                      <td class="alt-cell">
                        <div class="alt-text">${this.getAltTextDisplay(usage.alt, usage.type)}</div>
                      </td>
                      <td class="context-cell">
                        <div class="context-text">${this.formatContextAsHtml(usage.ctx)}</div>
                      </td>
                      <td class="actions-cell">
                        <div class="actions-container">
                          ${shouldShowPreviewEdit ? x$1`
                            <button class="action-button" @click=${() => this.handleViewDocument(doc)}>
                              Preview
                            </button>
                            <button class="action-button" @click=${() => this.handleEditDocument(doc)}>
                              Edit
                            </button>
                          ` : x$1`
                            <button class="action-button" @click=${() => this.handleViewDocument(doc)}>
                              Open
                            </button>
                          `}
                        </div>
                      </td>
                    </tr>
                    `;
      })}
                </tbody>
              </table>
            </div>
          </div>
        `)}
      </div>
    `;
    }
    renderMetadataTab() {
      const { media } = this.modalData.data;
      return x$1`
      <div class="metadata-section">
        <div class="metadata-table-container">
          <table class="metadata-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr class="metadata-row">
                <td class="metadata-label">File Name</td>
                <td class="metadata-value">${media.name}</td>
              </tr>
              <tr class="metadata-row">
                <td class="metadata-label">URL</td>
                <td class="metadata-value">${media.url}</td>
              </tr>
              <tr class="metadata-row">
                <td class="metadata-label">Type</td>
                <td class="metadata-value">${media.type}</td>
              </tr>
              
              ${this.renderAnalysisMetadata(media)}
            </tbody>
          </table>
        </div>
      </div>
    `;
    }
    renderAnalysisMetadata(media) {
      const hasAnalysisData = media.orientation || media.category || media.width || media.height || media.exifCamera || media.exifDate;
      if (!hasAnalysisData) {
        return x$1`
        <tr class="metadata-row analysis-section">
          <td class="metadata-label">Analysis</td>
          <td class="metadata-value analysis-unavailable">No analysis data available</td>
        </tr>
      `;
      }
      return x$1`
      <tr class="metadata-row analysis-section">
        <td class="metadata-label">Analysis</td>
        <td class="metadata-value"></td>
      </tr>
      ${media.orientation ? x$1`
        <tr class="metadata-row analysis-subrow">
          <td class="metadata-label">Orientation</td>
          <td class="metadata-value">${media.orientation}</td>
        </tr>
      ` : ""}
      ${media.category ? x$1`
        <tr class="metadata-row analysis-subrow">
          <td class="metadata-label">Category</td>
          <td class="metadata-value">${media.category}</td>
        </tr>
      ` : ""}
      ${media.width && media.height ? x$1`
        <tr class="metadata-row analysis-subrow">
          <td class="metadata-label">Dimensions</td>
          <td class="metadata-value">${media.width} x ${media.height}px</td>
        </tr>
      ` : ""}
      ${this.renderCameraInfo(media)}
      ${media.exifDate ? x$1`
        <tr class="metadata-row analysis-subrow">
          <td class="metadata-label">Date Taken</td>
          <td class="metadata-value">${media.exifDate}</td>
        </tr>
      ` : ""}
      ${media.analysisConfidence ? x$1`
        <tr class="metadata-row analysis-subrow">
          <td class="metadata-label">Confidence</td>
          <td class="metadata-value">${media.analysisConfidence}</td>
        </tr>
      ` : ""}
    `;
    }
    renderCameraInfo(media) {
      if (!media.exifCamera || media.exifCamera === "undefined undefined" || media.exifCamera === "undefined") {
        return "";
      }
      return x$1`
      <tr class="metadata-row analysis-subrow">
        <td class="metadata-label">Camera</td>
        <td class="metadata-value">${media.exifCamera}</td>
      </tr>
    `;
    }
    renderModalPreview() {
      const { media } = this.modalData.data;
      if (this.isImage(media.url)) {
        return x$1`
        <img 
          class="media-preview" 
          src=${media.url} 
          alt=${media.alt || media.name}
          @error=${(e2) => this.handleImageError(e2, media)}
        />
      `;
      }
      if (this.isVideo(media.url)) {
        return this.renderVideoPreview(media);
      }
      if (this.isPdf(media.url)) {
        return x$1`
        <div class="pdf-preview">
          <div class="pdf-preview-header">
            <svg class="pdf-icon">
              <use href="#pdf"></use>
            </svg>
            <h3>PDF Document</h3>
            <p>${media.name}</p>
          </div>
          <div class="pdf-actions">
            <button 
              class="pdf-action-btn" 
              @click=${(e2) => this.handlePdfAction(e2, media.url, media.name)}
              title="Click to view PDF, Ctrl/Cmd+Click to download"
            >
              <svg class="action-icon">
                <use href="#external-link"></use>
              </svg>
              Open PDF
            </button>
          </div>
        </div>
      `;
      }
      return x$1`
      <div class="preview-placeholder">
        <svg class="preview-icon">
          <use href="#${this.getMediaTypeIcon(media)}"></use>
        </svg>
      </div>
    `;
    }
    renderVideoPreview(media) {
      if (isExternalVideoUrl(media.url)) {
        const thumbnail = getVideoThumbnail(media.url);
        return x$1`
        <div class="external-video-preview">
          <div class="video-thumbnail-container">
            ${thumbnail ? x$1`
              <img 
                class="video-thumbnail" 
                src=${thumbnail} 
                alt=${media.alt || media.name}
                @error=${(e2) => this.handleVideoThumbnailError(e2, media)}
              />
            ` : x$1`
              <div class="video-placeholder">
                <svg class="video-icon">
                  <use href="#video"></use>
                </svg>
              </div>
            `}
            <div class="video-play-overlay">
              <svg class="play-icon">
                <use href="#external-link"></use>
              </svg>
            </div>
          </div>
          <div class="video-info">
            <h3>External Video</h3>
            <p>${media.name}</p>
            <button 
              class="video-action-btn" 
              @click=${(e2) => this.handleExternalVideoAction(e2, media.url, media.name)}
              title="Click to open video, Ctrl/Cmd+Click to open in new tab"
            >
              <svg class="action-icon">
                <use href="#external-link"></use>
              </svg>
              Open Video
            </button>
          </div>
        </div>
      `;
      }
      return x$1`
      <video 
        class="media-preview video-preview" 
        src=${media.url} 
        controls
        preload="metadata"
        @error=${(e2) => this.handleVideoError(e2, media)}
      >
        <p>Your browser does not support the video tag.</p>
      </video>
    `;
    }
    handleImageError(e2, media) {
      media.hasError = true;
      e2.target.style.display = "none";
      this.requestUpdate();
    }
    handleVideoError(e2, media) {
      media.hasError = true;
      e2.target.style.display = "none";
      this.requestUpdate();
    }
    handleVideoThumbnailError(e2) {
      e2.target.style.display = "none";
      this.requestUpdate();
    }
    handleExternalVideoAction(e2, url) {
      e2.preventDefault();
      e2.stopPropagation();
      if (e2.ctrlKey || e2.metaKey) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        window.open(url, "_self");
      }
    }
    getModalTitle() {
      var _a2;
      const { type, data } = this.modalData;
      switch (type) {
        case "details":
          return ((_a2 = data == null ? void 0 : data.media) == null ? void 0 : _a2.name) || "Media Details";
        case "edit":
          return this.t("media.editAltText");
        default:
          return "Modal";
      }
    }
    getMediaTypeIcon(media) {
      const type = media.type || "";
      if (type.startsWith("img >"))
        return "photo";
      if (type.startsWith("video >"))
        return "video";
      if (type.startsWith("document >"))
        return "pdf";
      if (type.startsWith("link >"))
        return "external-link";
      if (this.isPdf(media.url))
        return "pdf";
      if (this.isImage(media.url))
        return "photo";
      if (this.isVideo(media.url))
        return "video";
      return "photo";
    }
    isImage(url) {
      const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"];
      const ext = this.getFileExtension(url);
      return imageExtensions.includes(ext);
    }
    isVideo(url) {
      const videoExtensions = ["mp4", "webm", "mov", "avi"];
      const ext = this.getFileExtension(url);
      return videoExtensions.includes(ext);
    }
    isPdf(url) {
      const ext = this.getFileExtension(url);
      return ext === "pdf";
    }
    getFileExtension(url) {
      var _a2;
      if (!url)
        return "";
      try {
        const cleanUrl = url.split(/[?#]/)[0];
        const extension = ((_a2 = cleanUrl.split(".").pop()) == null ? void 0 : _a2.toLowerCase()) || "";
        if (!extension || extension === cleanUrl || /[^a-z0-9]/.test(extension)) {
          return "";
        }
        return extension;
      } catch (error) {
        return "";
      }
    }
    handleOverlayClick(e2) {
      if (e2.target === e2.currentTarget) {
        this.handleCloseModal();
      }
    }
    handleContentClick(e2) {
      e2.stopPropagation();
    }
    handleEdit() {
      this.modalData = {
        type: "edit",
        data: this.modalData.data
      };
    }
    handleCopy() {
      const { media } = this.modalData.data;
      navigator.clipboard.writeText(media.url);
      window.dispatchEvent(new CustomEvent("show-notification", {
        detail: {
          heading: this.t("common.success"),
          message: this.t("media.copyUrl"),
          type: "success"
        }
      }));
    }
    handleViewDocument(docPath) {
      if (!docPath)
        return;
      window.open(docPath, "_blank");
    }
    handleEditDocument(docPath) {
      if (!docPath)
        return;
      window.open(docPath, "_blank");
    }
    handlePdfAction(event, pdfUrl, fileName) {
      if (!pdfUrl)
        return;
      const isDownload = event.ctrlKey || event.metaKey;
      if (isDownload) {
        const link = document.createElement("a");
        link.href = pdfUrl;
        link.download = fileName || "document.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        window.open(pdfUrl, "_blank");
      }
    }
    handleSave(e2) {
      e2.preventDefault();
      const formData = new FormData(e2.target);
      const altText = formData.get("altText");
      window.dispatchEvent(new CustomEvent("save-alt-text", {
        detail: {
          media: this.modalData.data.media,
          altText
        }
      }));
      this.handleCloseModal();
    }
    handleFormSubmit(e2) {
      e2.preventDefault();
      this.handleSave(e2);
    }
  }
  __publicField(ModalManager, "properties", {
    locale: { type: String },
    isOpen: { type: Boolean },
    modalData: { type: Object },
    _activeTab: { state: true }
  });
  __publicField(ModalManager, "styles", getStyles(modalManagerStyles));
  customElements.define("modal-manager", ModalManager);
  const mediaLibraryStyles = `:host {
  display: block;
  font-family: system-ui, -apple-system, sans-serif;
  height: 100vh;
  margin: 0;
  max-width: 100%;
  overflow: hidden;
  width: 100%;
}

/* Franklin-style SVG handling */
:host > svg {
  display: none;
}

/* Icon styles */
.error-icon {
  color: #ef4444;
  display: block;
  height: 48px;
  margin-bottom: 16px;
  width: 48px;
}

.media-library {
  background: #f8fafc;
  display: grid;
  gap: 8px;
  grid-template:
    "sidebar topbar" auto
    "sidebar main" 1fr
    / 240px 1fr;
  height: 100vh;
  max-width: 100%;
  overflow: hidden;
  padding: 0;
  position: relative;
  width: 100%;
}

.top-bar {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.1);
  grid-area: topbar;
  z-index: 1000;
}


.sidebar {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.1);
  grid-area: sidebar;
  overflow-y: auto;
}

.main-content {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.1);
  grid-area: main;
  overflow: hidden;
  position: relative;
}

.error-state {
  align-items: center;
  color: #64748b;
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
  margin: 0 auto;
  max-width: 800px;
  padding: 32px;
  text-align: center;
}

.error-state svg {
  color: #ef4444;
  height: 48px;
  margin-bottom: 16px;
  width: 48px;
}

.error-message {
  background: #fef2f2;
  border: 1px solid #ef4444;
  border-radius: 6px;
  color: #1e293b;
  font-family: Monaco, Menlo, 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
  margin: 16px 0;
  max-width: 100%;
  overflow-wrap: break-word;
  padding: 24px;
  text-align: left;
  white-space: pre-line;
}

.retry-button {
  background: #3b82f6;
  border: none;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  margin-top: 16px;
  padding: 8px 24px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.retry-button:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.loading-state {
  align-items: center;
  color: #64748b;
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
  padding: 24px;
  text-align: center;
}

.loading-spinner {
  animation: spin 1s linear infinite;
  border: 3px solid #e2e8f0;
  border-radius: 50%;
  border-top: 3px solid #3b82f6;
  height: 32px;
  margin-bottom: 16px;
  width: 32px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.streaming-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.loading-more {
  align-items: center;
  background: rgb(255 255 255 / 0.95);
  border-top: 1px solid #e2e8f0;
  bottom: 0;
  color: #64748b;
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
  padding: 16px;
  position: sticky;
  text-align: center;
  z-index: 10;
}

.loading-more .loading-spinner {
  height: 20px;
  margin-bottom: 0;
  width: 20px;
}

.loading-more p {
  font-size: 0.875rem;
  margin: 0;
}

@media (max-width: 768px) {
  .media-library {
    grid-template:
      "topbar" auto
      "main" 1fr
      / 1fr;
  }
  
  .sidebar {
    display: none;
  }
}
`;
  function waitForMediaLibraryReady(mediaLibraryElement) {
    return new Promise((resolve, reject) => {
      if (mediaLibraryElement.isReady) {
        resolve(mediaLibraryElement);
        return;
      }
      let isResolved = false;
      let handleReady;
      let handleError;
      const cleanup = () => {
        if (!isResolved && handleReady && handleError) {
          mediaLibraryElement.removeEventListener("media-library-ready", handleReady);
          mediaLibraryElement.removeEventListener("media-library-error", handleError);
        }
      };
      handleReady = (event) => {
        if (event.target === mediaLibraryElement && !isResolved) {
          isResolved = true;
          cleanup();
          resolve(mediaLibraryElement);
        }
      };
      handleError = (event) => {
        if (event.target === mediaLibraryElement && !isResolved) {
          isResolved = true;
          cleanup();
          reject(new Error(`Media library initialization failed: ${event.detail.error.message}`));
        }
      };
      mediaLibraryElement.addEventListener("media-library-ready", handleReady);
      mediaLibraryElement.addEventListener("media-library-error", handleError);
      setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          cleanup();
          reject(new Error("Media library initialization timeout"));
        }
      }, 1e4);
    });
  }
  async function initializeMediaLibrary(elementId) {
    const mediaLibraryElement = document.getElementById(elementId);
    if (!mediaLibraryElement) {
      throw new Error(`Media library element with id "${elementId}" not found`);
    }
    return waitForMediaLibraryReady(mediaLibraryElement);
  }
  async function createMediaLibrary(options = {}) {
    const { storage: storage2 = "none", locale = "en", containerId } = options;
    const mediaLibraryElement = document.createElement("media-library");
    mediaLibraryElement.storage = storage2;
    mediaLibraryElement.locale = locale;
    const container = containerId ? document.getElementById(containerId) : document.body;
    container.appendChild(mediaLibraryElement);
    return waitForMediaLibraryReady(mediaLibraryElement);
  }
  class MediaLibrary2 extends LocalizableElement {
    constructor() {
      super();
      this.storage = "none";
      this.locale = "en";
      this.mode = "live";
      this.corsProxy = "https://media-library-cors-proxy.aem-poc-lab.workers.dev/";
      this._mediaData = [];
      this._error = null;
      this._searchQuery = "";
      this._selectedFilterType = "all";
      this._currentView = "grid";
      this._isScanning = false;
      this._scanProgress = null;
      this._imageAnalysisEnabled = false;
      this._isBatchLoading = false;
      this._realTimeStats = { images: 0, pages: 0, elapsed: 0 };
      this._progressiveMediaData = [];
      this._progressiveLimit = 0;
      this._progressiveGroupingKeys = /* @__PURE__ */ new Set();
      this._totalPages = 0;
      this.showAnalysisToggle = true;
      this.storageManager = null;
      this.contentParser = null;
      this._processedData = null;
      this._filteredDataCache = null;
      this._lastFilterParams = null;
      this._readyPromise = null;
      this._isReady = false;
    }
    async connectedCallback() {
      super.connectedCallback();
      this._readyPromise = this._initialize();
      try {
        await this._readyPromise;
        this._isReady = true;
        this.dispatchEvent(new CustomEvent("media-library-ready", {
          detail: { mediaLibrary: this },
          bubbles: true
        }));
      } catch (error) {
        this._error = `Initialization failed: ${error.message}`;
        this.dispatchEvent(new CustomEvent("media-library-error", {
          detail: { error },
          bubbles: true
        }));
      }
    }
    async _initialize() {
      const ICONS = [
        "./icons/close.svg",
        "./icons/photo.svg",
        "./icons/video.svg",
        "./icons/pdf.svg",
        "./icons/external-link.svg",
        "./icons/copy.svg"
      ];
      await getSvg({ parent: this.shadowRoot, paths: ICONS });
      await i18n.loadLocale(this.locale);
      i18n.setLocale(this.locale);
      this.storageManager = createStorage(this.storage);
      if (this.storageManager && this.storageManager.setMode) {
        this.storageManager.setMode(this.mode);
      }
      this.contentParser = new ContentParser({
        corsProxy: this.corsProxy,
        enableImageAnalysis: this._imageAnalysisEnabled,
        enableCategorization: true,
        analysisConfig: {
          extractEXIF: true,
          extractDimensions: true,
          categorizeFromFilename: true
        },
        categorizationConfig: {
          useFilename: true,
          useContext: true,
          useAltText: true,
          usePosition: true
        }
      });
      await this.loadMediaDataFromStorage();
    }
    shouldUpdate(changedProperties) {
      return changedProperties.has("_mediaData") || changedProperties.has("_searchQuery") || changedProperties.has("_selectedFilterType") || changedProperties.has("_currentView") || changedProperties.has("_isScanning") || changedProperties.has("_scanProgress") || changedProperties.has("_error") || changedProperties.has("locale") || changedProperties.has("corsProxy") || changedProperties.has("showAnalysisToggle") || changedProperties.has("_isBatchLoading") || changedProperties.has("_realTimeStats");
    }
    async updated(changedProperties) {
      if (changedProperties.has("locale")) {
        await i18n.loadLocale(this.locale);
        i18n.setLocale(this.locale);
      }
      if (changedProperties.has("corsProxy")) {
        if (this.contentParser) {
          this.contentParser.corsProxy = this.corsProxy;
        }
      }
    }
    async initialize() {
      try {
        this._error = null;
        await this.loadMediaDataFromStorage();
      } catch (error) {
        this._error = error.message;
      }
    }
    async loadMediaDataFromStorage(siteKey = null) {
      try {
        if (!this.storageManager) {
          return;
        }
        this._isBatchLoading = true;
        this.requestUpdate();
        let data;
        if (this.storage === "r2") {
          data = await this.storageManager.loadMediaUsages(this.mode);
        } else {
          const key = siteKey || "media-data";
          data = await this.storageManager.load(key);
        }
        if (data && data.length > 0) {
          this._mediaData = data;
          this._processedData = await processMediaData(data);
        } else {
          this._mediaData = [];
          this._processedData = await processMediaData([]);
        }
        this._isScanning = false;
        this._isBatchLoading = false;
        this._progressiveMediaData = [];
        this._filteredDataCache = null;
        this._lastFilterParams = null;
        this._usageCountCache = null;
        this._lastUsageCountParams = null;
        this.updateAnalysisToggleVisibility();
        this.requestUpdate();
      } catch (error) {
        this._mediaData = [];
        this._processedData = await processMediaData([]);
        this._isScanning = false;
        this._isBatchLoading = false;
        this._progressiveMediaData = [];
        if (error.name !== "NotFoundError" && !error.message.includes("object store")) {
          this._error = this.t("errors.loadFailed");
        }
        this.updateAnalysisToggleVisibility();
        this.requestUpdate();
      }
    }
    async loadFromPageList(pageList, onProgress = null, siteKey = null, saveToStorage = true, previousMetadata = null, completePageList = null, existingMediaData = null) {
      if (!pageList || pageList.length === 0) {
        this._error = "No pages provided to scan";
        return [];
      }
      try {
        this._isScanning = true;
        this._isBatchLoading = true;
        this._error = null;
        this._progressiveMediaData = [];
        this._progressiveGroupingKeys = /* @__PURE__ */ new Set();
        this._searchQuery = "";
        this._selectedFilterType = "all";
        this._scanStartTime = Date.now();
        this._scanProgress = { current: 0, total: 0, found: 0 };
        this._lastScanDuration = null;
        this._scanStats = null;
        this._realTimeStats = { images: 0, pages: 0, elapsed: 0 };
        this._progressiveLimit = this.getProgressiveLimit();
        window.dispatchEvent(new CustomEvent("clear-search"));
        window.dispatchEvent(new CustomEvent("clear-filters"));
        let currentExistingMediaData = existingMediaData || this._mediaData || [];
        if (previousMetadata && currentExistingMediaData.length === 0) {
          if (this.storage === "r2") {
            currentExistingMediaData = await this.storageManager.loadMediaUsages(this.mode) || [];
          } else {
            currentExistingMediaData = await this.storageManager.load() || [];
          }
        }
        if (currentExistingMediaData.length > 0) {
          this._progressiveMediaData = [...currentExistingMediaData];
          currentExistingMediaData.forEach((item) => {
            if (item.url) {
              this._progressiveGroupingKeys.add(getGroupingKey(item.url));
            }
          });
        }
        this._scanProgress = { current: 0, total: pageList.length, found: 0 };
        this._totalPages = pageList.length;
        this.requestUpdate();
        const elapsedInterval = setInterval(() => {
          this._realTimeStats.elapsed = ((Date.now() - this._scanStartTime) / 1e3).toFixed(1);
          this._realTimeStats = { ...this._realTimeStats };
          this.requestUpdate();
        }, 100);
        const newMediaItems = await this.contentParser.scanPages(
          pageList,
          (completed, total, found) => {
            this._realTimeStats.pages = completed;
            this._realTimeStats.images += found;
            this._realTimeStats.elapsed = ((Date.now() - this._scanStartTime) / 1e3).toFixed(1);
            this._realTimeStats = { ...this._realTimeStats };
            if (found > 0) {
              const latestItems = this.contentParser.getLatestMediaItems();
              if (latestItems && latestItems.length > 0) {
                let hasUpdates = false;
                latestItems.forEach((newItem) => {
                  const groupingKey = getGroupingKey(newItem.url);
                  const existingItem = this._progressiveMediaData.find((item) => {
                    const itemGroupingKey = getGroupingKey(item.url);
                    return itemGroupingKey === groupingKey;
                  });
                  if (existingItem) {
                    existingItem.usageCount = (existingItem.usageCount || 1) + 1;
                    hasUpdates = true;
                  }
                });
                const newUniqueItems = latestItems.filter((item) => {
                  if (!item.url)
                    return false;
                  const groupingKey = getGroupingKey(item.url);
                  if (!this._progressiveGroupingKeys.has(groupingKey)) {
                    this._progressiveGroupingKeys.add(groupingKey);
                    item.usageCount = 1;
                    return true;
                  }
                  return false;
                });
                if (newUniqueItems.length > 0 || hasUpdates) {
                  this._progressiveMediaData = [...this._progressiveMediaData, ...newUniqueItems];
                }
              }
            }
            this.requestUpdate();
            if (onProgress) {
              onProgress(completed, total, found);
            }
          },
          previousMetadata
        );
        clearInterval(elapsedInterval);
        const scanDuration = Date.now() - this._scanStartTime;
        const durationSeconds = (scanDuration / 1e3).toFixed(1);
        let pagesToReparse = [];
        if (previousMetadata && previousMetadata.pageLastModified) {
          pagesToReparse = pageList.map((page) => page.loc || page.url);
        }
        const filteredExistingMedia = currentExistingMediaData.filter((item) => {
          const isNotInReparseList = !pagesToReparse.includes(item.doc);
          return isNotInReparseList;
        });
        const completeMediaData = [...filteredExistingMedia, ...newMediaItems];
        if (saveToStorage) {
          if (this.storage === "r2") {
            await this.storageManager.saveMediaUsages(completeMediaData, this.mode);
          } else {
            await this.storageManager.save(completeMediaData);
          }
        }
        const metadataPageList = completePageList || pageList;
        const pageLastModified = {};
        metadataPageList.forEach((page) => {
          pageLastModified[page.loc || page.url] = page.lastmod;
        });
        await this.storageManager.saveScanMetadata({
          totalPages: metadataPageList.length,
          pageLastModified,
          scanDuration
        });
        this._mediaData = completeMediaData;
        this._processedData = await processMediaData(completeMediaData);
        this._isScanning = false;
        this._isBatchLoading = false;
        this._scanProgress = null;
        this._lastScanDuration = durationSeconds;
        this.updateAnalysisToggleVisibility();
        this._filteredDataCache = null;
        this._lastFilterParams = null;
        this._usageCountCache = null;
        this._lastUsageCountParams = null;
        this.requestUpdate();
        this._scanStats = {
          pagesScanned: pageList.length,
          mediaFound: newMediaItems.length,
          duration: durationSeconds
        };
        if (typeof window.refreshSites === "function") {
          window.refreshSites();
        }
        return completeMediaData;
      } catch (error) {
        this._isScanning = false;
        this._isBatchLoading = false;
        this._scanProgress = null;
        this._error = `Scan failed: ${error.message}`;
        this.updateAnalysisToggleVisibility();
        throw error;
      }
    }
    async loadFromStorage(siteKey) {
      const originalStorageType = this.storageManager.type;
      this.storageManager.type = "indexeddb";
      try {
        await this.loadMediaDataFromStorage(siteKey);
        return this._mediaData;
      } finally {
        this.storageManager.type = originalStorageType;
      }
    }
    async loadMediaData(mediaData, siteKey = null, saveToStorage = false, metadata = null) {
      if (!mediaData || !Array.isArray(mediaData)) {
        this._error = "No media data provided";
        return [];
      }
      try {
        this._isScanning = true;
        this._error = null;
        this._searchQuery = "";
        this._selectedFilterType = "all";
        this._scanStartTime = Date.now();
        this._scanProgress = { current: 0, total: 0, found: mediaData.length };
        this._lastScanDuration = null;
        this._scanStats = null;
        window.dispatchEvent(new CustomEvent("clear-search"));
        window.dispatchEvent(new CustomEvent("clear-filters"));
        this.requestUpdate();
        this._mediaData = mediaData;
        this._processedData = await processMediaData(mediaData);
        const loadDuration = Date.now() - this._scanStartTime;
        const durationSeconds = (loadDuration / 1e3).toFixed(1);
        const existingMetadata = metadata || await this.storageManager.loadScanMetadata();
        const totalPages = existingMetadata ? existingMetadata.totalPages : 0;
        if (saveToStorage && siteKey) {
          if (this.storage === "r2") {
            await this.storageManager.saveMediaUsages(mediaData, this.mode);
          } else {
            await this.storageManager.save(mediaData);
          }
          await this.storageManager.saveScanMetadata({
            totalPages: 0,
            pageLastModified: {},
            scanDuration: loadDuration,
            source: "direct-load"
          });
        }
        this._isScanning = false;
        this._isBatchLoading = false;
        this._progressiveMediaData = [];
        this._scanProgress = null;
        this._lastScanDuration = durationSeconds;
        this._totalPages = totalPages;
        this.updateAnalysisToggleVisibility();
        this._filteredDataCache = null;
        this._lastFilterParams = null;
        this._usageCountCache = null;
        this._lastUsageCountParams = null;
        this.requestUpdate();
        this._scanStats = {
          pagesScanned: totalPages,
          mediaFound: mediaData.length,
          duration: durationSeconds,
          source: "direct-load"
        };
        if (typeof window.refreshSites === "function") {
          window.refreshSites();
        }
        return mediaData;
      } catch (error) {
        this._isScanning = false;
        this._scanProgress = null;
        this._error = `Load failed: ${error.message}`;
        this.updateAnalysisToggleVisibility();
        throw error;
      }
    }
    async clearData() {
      this._mediaData = [];
      this._processedData = await processMediaData([]);
      this._error = null;
      this._searchQuery = "";
      this._selectedFilterType = "all";
      this._scanStats = null;
      this._lastScanDuration = null;
      this.updateAnalysisToggleVisibility();
      this.requestUpdate();
    }
    generateSiteKey(source) {
      if (!source)
        return "media-data";
      try {
        if (source.startsWith("http://") || source.startsWith("https://")) {
          const url = new URL(source);
          return url.hostname.replace(/[^a-zA-Z0-9.-]/g, "_");
        }
        return source.replace(/[^a-zA-Z0-9.-]/g, "_");
      } catch (error) {
        return source.replace(/[^a-zA-Z0-9.-]/g, "_");
      }
    }
    handleToggleImageAnalysis(event) {
      this._imageAnalysisEnabled = event.detail.enabled;
      if (this.contentParser) {
        this.contentParser.setImageAnalysis(this._imageAnalysisEnabled, {
          extractEXIF: true,
          extractDimensions: true,
          categorizeFromFilename: true
        });
      }
    }
    updateAnalysisToggleVisibility() {
      const shouldShow = this._mediaData.length === 0 || this._isScanning;
      if (this.showAnalysisToggle !== shouldShow) {
        this.showAnalysisToggle = shouldShow;
      }
    }
    get filteredMediaData() {
      var _a2;
      const currentParams = {
        filterType: this._selectedFilterType,
        searchQuery: this._searchQuery,
        selectedDocument: this.selectedDocument,
        dataLength: ((_a2 = this._mediaData) == null ? void 0 : _a2.length) || 0
      };
      if (this._filteredDataCache && this._lastFilterParams && JSON.stringify(this._lastFilterParams) === JSON.stringify(currentParams)) {
        return this._filteredDataCache;
      }
      if (!this._processedData) {
        const filteredData2 = calculateFilteredMediaData(
          this._mediaData,
          this._selectedFilterType,
          this._searchQuery,
          this.selectedDocument
        );
        const deduplicatedData2 = [];
        const seenUrls2 = /* @__PURE__ */ new Set();
        filteredData2.forEach((item) => {
          if (item.url && !seenUrls2.has(item.url)) {
            seenUrls2.add(item.url);
            deduplicatedData2.push(item);
          }
        });
        this._filteredDataCache = deduplicatedData2;
        this._lastFilterParams = currentParams;
        return deduplicatedData2;
      }
      const filteredData = calculateFilteredMediaDataFromIndex(
        this._mediaData,
        this._processedData,
        this._selectedFilterType,
        this._searchQuery,
        this.selectedDocument
      );
      const deduplicatedData = [];
      const seenUrls = /* @__PURE__ */ new Set();
      filteredData.forEach((item) => {
        if (item.url && !seenUrls.has(item.url)) {
          seenUrls.add(item.url);
          deduplicatedData.push(item);
        }
      });
      this._filteredDataCache = deduplicatedData;
      this._lastFilterParams = currentParams;
      return deduplicatedData;
    }
    // REMOVED: addUsageCountToMediaFromProcessedData function
    // Usage counts are now calculated during initial processing in processMediaData()
    // This eliminates the 7+ second delay on every filter change
    getProgressiveLimit() {
      return this._currentView === "grid" ? 500 : 750;
    }
    get selectedDocument() {
      if (this._mediaData && this._mediaData.length > 0) {
        const indexDoc = this._mediaData.find((media) => media.doc === "/index.html");
        if (indexDoc) {
          return "/index.html";
        }
        const firstDoc = this._mediaData.find((media) => media.doc && media.doc.trim());
        if (firstDoc) {
          return firstDoc.doc;
        }
      }
      return null;
    }
    get filterCounts() {
      var _a2;
      const counts = ((_a2 = this._processedData) == null ? void 0 : _a2.filterCounts) || {};
      return counts;
    }
    get isUIdisabled() {
      return this._isScanning || !this._mediaData || this._mediaData.length === 0;
    }
    handleSearch(e2) {
      if (this.isUIdisabled)
        return;
      this._searchQuery = e2.detail.query;
    }
    handleViewChange(e2) {
      if (this.isUIdisabled)
        return;
      this._currentView = e2.detail.view;
    }
    handleFilter(e2) {
      if (this.isUIdisabled)
        return;
      this._selectedFilterType = e2.detail.type;
    }
    async handleMediaClick(e2) {
      var _a2;
      const { media } = e2.detail;
      if (!media)
        return;
      const filteredItems = ((_a2 = this._mediaData) == null ? void 0 : _a2.filter((item) => urlsMatch(item.url, media.url))) || [];
      const usageData = filteredItems.map((item) => ({
        doc: item.doc || "Unknown Document",
        alt: item.alt,
        type: item.type,
        ctx: item.ctx,
        firstUsedAt: item.firstUsedAt,
        lastUsedAt: item.lastUsedAt
      }));
      window.dispatchEvent(new CustomEvent("open-modal", {
        detail: {
          type: "details",
          data: {
            media,
            usageData
          }
        }
      }));
    }
    async handleMediaAction(e2) {
      const { action, media } = e2.detail;
      if (action === "copy") {
        await this.handleCopyMedia(media);
      }
    }
    async handleCopyMedia(media) {
      try {
        const result = await copyMediaToClipboard(media);
        this.showNotification(result.heading, result.message, "success");
      } catch (error) {
        this.showNotification(this.t("common.error"), this.t("errors.saveFailed"), "error");
      }
    }
    showNotification(heading, message, type = "info") {
      window.dispatchEvent(new CustomEvent("show-notification", {
        detail: {
          heading,
          message,
          type,
          open: true
        }
      }));
    }
    render() {
      return x$1`
      <div class="media-library">
        <div class="top-bar">
          <media-topbar
            .searchQuery=${this._searchQuery}
            .currentView=${this._currentView}
            .locale=${this.locale}
            .isScanning=${this.isUIdisabled}
            .scanProgress=${this._scanProgress}
            .isActuallyScanning=${this._isScanning}
            .isBatchLoading=${this._isBatchLoading}
            .realTimeStats=${this._realTimeStats}
            .lastScanDuration=${this._lastScanDuration}
            .scanStats=${this._scanStats}
            .imageAnalysisEnabled=${this._imageAnalysisEnabled}
            .showAnalysisToggle=${this.showAnalysisToggle}
            .mediaData=${this._mediaData}
            .totalPages=${this._totalPages}
            @search=${this.handleSearch}
            @viewChange=${this.handleViewChange}
            @toggleImageAnalysis=${this.handleToggleImageAnalysis}
          ></media-topbar>
        </div>


        <div class="sidebar">
          <media-sidebar
            .activeFilter=${this._selectedFilterType}
            .filterCounts=${this.filterCounts}
            .locale=${this.locale}
            .isScanning=${this.isUIdisabled}
            @filter=${this.handleFilter}
          ></media-sidebar>
        </div>

        <div class="main-content">
          ${this._error ? this.renderErrorState() : this.renderCurrentView()}
        </div>

        <modal-manager .locale=${this.locale}></modal-manager>
      </div>
    `;
    }
    renderErrorState() {
      return x$1`
      <div class="error-state">
        <svg class="error-icon">
          <use href="#close"></use>
        </svg>
        <h3>${this.t("common.error")}</h3>
        <div class="error-message">${this._error}</div>
        <button class="retry-button" @click=${() => this.clearError()}>
          Try Again
        </button>
      </div>
    `;
    }
    clearError() {
      this._error = null;
    }
    get ready() {
      return this._readyPromise || Promise.resolve(this);
    }
    get isReady() {
      return this._isReady;
    }
    static async create(options = {}) {
      const element = document.createElement("media-library");
      if (options.storage)
        element.storage = options.storage;
      if (options.locale)
        element.locale = options.locale;
      document.body.appendChild(element);
      await element.ready;
      return element;
    }
    renderCurrentView() {
      if (this._isScanning) {
        if (this._progressiveMediaData.length > 0) {
          return x$1`
          <media-grid
            .mediaData=${this._progressiveMediaData}
            .searchQuery=${this._searchQuery}
            .locale=${this.locale}
            .isProcessing=${true}
            @mediaClick=${this.handleMediaClick}
            @mediaAction=${this.handleMediaAction}
          ></media-grid>
        `;
        }
        return x$1`
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <h3>Discovering Media</h3>
          <p>Scanning pages and extracting media files...</p>
        </div>
      `;
      }
      if (this._isBatchLoading) {
        return x$1`
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <h3>Loading Media</h3>
          <p>Loading media data from storage...</p>
        </div>
      `;
      }
      const mediaWithUsageCount = this.filteredMediaData;
      if (this._currentView === "list") {
        return x$1`
        <media-list
          .mediaData=${mediaWithUsageCount}
          .searchQuery=${this._searchQuery}
          .locale=${this.locale}
          @mediaClick=${this.handleMediaClick}
          @mediaAction=${this.handleMediaAction}
        ></media-list>
      `;
      }
      return x$1`
      <media-grid
        .mediaData=${mediaWithUsageCount}
        .searchQuery=${this._searchQuery}
        .locale=${this.locale}
        .isProcessing=${false}
        @mediaClick=${this.handleMediaClick}
        @mediaAction=${this.handleMediaAction}
      ></media-grid>
    `;
    }
  }
  __publicField(MediaLibrary2, "properties", {
    storage: { type: String },
    locale: { type: String },
    mode: { type: String },
    corsProxy: { type: String },
    _mediaData: { state: true },
    _error: { state: true },
    _searchQuery: { state: true },
    _selectedFilterType: { state: true },
    _currentView: { state: true },
    _isScanning: { state: true },
    _scanProgress: { state: true },
    _lastScanDuration: { state: true },
    _scanStats: { state: true },
    _imageAnalysisEnabled: { state: true },
    _isBatchLoading: { state: true },
    _realTimeStats: { state: true },
    _progressiveMediaData: { state: true },
    _progressiveLimit: { state: true },
    showAnalysisToggle: { type: Boolean }
  });
  __publicField(MediaLibrary2, "styles", getStyles(mediaLibraryStyles));
  __publicField(MediaLibrary2, "waitForReady", waitForMediaLibraryReady);
  __publicField(MediaLibrary2, "createInstance", createMediaLibrary);
  __publicField(MediaLibrary2, "initialize", initializeMediaLibrary);
  customElements.define("media-library", MediaLibrary2);
  var e = "undefined" != typeof self ? self : global;
  const t = "undefined" != typeof navigator, i = t && "undefined" == typeof HTMLImageElement, n = !("undefined" == typeof global || "undefined" == typeof process || !process.versions || !process.versions.node), s = e.Buffer, r = e.BigInt, a = !!s, o = (e2) => e2;
  function l(e2, t2 = o) {
    if (n)
      try {
        return "function" == typeof require ? Promise.resolve(t2(require(e2))) : import(
          /* webpackIgnore: true */
          e2
        ).then(t2);
      } catch (t3) {
        console.warn(`Couldn't load ${e2}`);
      }
  }
  let h = e.fetch;
  const u = (e2) => h = e2;
  if (!e.fetch) {
    const e2 = l("http", (e3) => e3), t2 = l("https", (e3) => e3), i2 = (n2, { headers: s2 } = {}) => new Promise(async (r2, a2) => {
      let { port: o2, hostname: l2, pathname: h2, protocol: u2, search: c2 } = new URL(n2);
      const f2 = { method: "GET", hostname: l2, path: encodeURI(h2) + c2, headers: s2 };
      "" !== o2 && (f2.port = Number(o2));
      const d2 = ("https:" === u2 ? await t2 : await e2).request(f2, (e3) => {
        if (301 === e3.statusCode || 302 === e3.statusCode) {
          let t3 = new URL(e3.headers.location, n2).toString();
          return i2(t3, { headers: s2 }).then(r2).catch(a2);
        }
        r2({ status: e3.statusCode, arrayBuffer: () => new Promise((t3) => {
          let i3 = [];
          e3.on("data", (e4) => i3.push(e4)), e3.on("end", () => t3(Buffer.concat(i3)));
        }) });
      });
      d2.on("error", a2), d2.end();
    });
    u(i2);
  }
  function c(e2, t2, i2) {
    return t2 in e2 ? Object.defineProperty(e2, t2, { value: i2, enumerable: true, configurable: true, writable: true }) : e2[t2] = i2, e2;
  }
  const f = (e2) => p(e2) ? void 0 : e2, d = (e2) => void 0 !== e2;
  function p(e2) {
    return void 0 === e2 || (e2 instanceof Map ? 0 === e2.size : 0 === Object.values(e2).filter(d).length);
  }
  function g(e2) {
    let t2 = new Error(e2);
    throw delete t2.stack, t2;
  }
  function m(e2) {
    return "" === (e2 = function(e3) {
      for (; e3.endsWith("\0"); )
        e3 = e3.slice(0, -1);
      return e3;
    }(e2).trim()) ? void 0 : e2;
  }
  function S(e2) {
    let t2 = function(e3) {
      let t3 = 0;
      return e3.ifd0.enabled && (t3 += 1024), e3.exif.enabled && (t3 += 2048), e3.makerNote && (t3 += 2048), e3.userComment && (t3 += 1024), e3.gps.enabled && (t3 += 512), e3.interop.enabled && (t3 += 100), e3.ifd1.enabled && (t3 += 1024), t3 + 2048;
    }(e2);
    return e2.jfif.enabled && (t2 += 50), e2.xmp.enabled && (t2 += 2e4), e2.iptc.enabled && (t2 += 14e3), e2.icc.enabled && (t2 += 6e3), t2;
  }
  const C = (e2) => String.fromCharCode.apply(null, e2), y = "undefined" != typeof TextDecoder ? new TextDecoder("utf-8") : void 0;
  function b(e2) {
    return y ? y.decode(e2) : a ? Buffer.from(e2).toString("utf8") : decodeURIComponent(escape(C(e2)));
  }
  class I {
    static from(e2, t2) {
      return e2 instanceof this && e2.le === t2 ? e2 : new I(e2, void 0, void 0, t2);
    }
    constructor(e2, t2 = 0, i2, n2) {
      if ("boolean" == typeof n2 && (this.le = n2), Array.isArray(e2) && (e2 = new Uint8Array(e2)), 0 === e2)
        this.byteOffset = 0, this.byteLength = 0;
      else if (e2 instanceof ArrayBuffer) {
        void 0 === i2 && (i2 = e2.byteLength - t2);
        let n3 = new DataView(e2, t2, i2);
        this._swapDataView(n3);
      } else if (e2 instanceof Uint8Array || e2 instanceof DataView || e2 instanceof I) {
        void 0 === i2 && (i2 = e2.byteLength - t2), (t2 += e2.byteOffset) + i2 > e2.byteOffset + e2.byteLength && g("Creating view outside of available memory in ArrayBuffer");
        let n3 = new DataView(e2.buffer, t2, i2);
        this._swapDataView(n3);
      } else if ("number" == typeof e2) {
        let t3 = new DataView(new ArrayBuffer(e2));
        this._swapDataView(t3);
      } else
        g("Invalid input argument for BufferView: " + e2);
    }
    _swapArrayBuffer(e2) {
      this._swapDataView(new DataView(e2));
    }
    _swapBuffer(e2) {
      this._swapDataView(new DataView(e2.buffer, e2.byteOffset, e2.byteLength));
    }
    _swapDataView(e2) {
      this.dataView = e2, this.buffer = e2.buffer, this.byteOffset = e2.byteOffset, this.byteLength = e2.byteLength;
    }
    _lengthToEnd(e2) {
      return this.byteLength - e2;
    }
    set(e2, t2, i2 = I) {
      return e2 instanceof DataView || e2 instanceof I ? e2 = new Uint8Array(e2.buffer, e2.byteOffset, e2.byteLength) : e2 instanceof ArrayBuffer && (e2 = new Uint8Array(e2)), e2 instanceof Uint8Array || g("BufferView.set(): Invalid data argument."), this.toUint8().set(e2, t2), new i2(this, t2, e2.byteLength);
    }
    subarray(e2, t2) {
      return t2 = t2 || this._lengthToEnd(e2), new I(this, e2, t2);
    }
    toUint8() {
      return new Uint8Array(this.buffer, this.byteOffset, this.byteLength);
    }
    getUint8Array(e2, t2) {
      return new Uint8Array(this.buffer, this.byteOffset + e2, t2);
    }
    getString(e2 = 0, t2 = this.byteLength) {
      return b(this.getUint8Array(e2, t2));
    }
    getLatin1String(e2 = 0, t2 = this.byteLength) {
      let i2 = this.getUint8Array(e2, t2);
      return C(i2);
    }
    getUnicodeString(e2 = 0, t2 = this.byteLength) {
      const i2 = [];
      for (let n2 = 0; n2 < t2 && e2 + n2 < this.byteLength; n2 += 2)
        i2.push(this.getUint16(e2 + n2));
      return C(i2);
    }
    getInt8(e2) {
      return this.dataView.getInt8(e2);
    }
    getUint8(e2) {
      return this.dataView.getUint8(e2);
    }
    getInt16(e2, t2 = this.le) {
      return this.dataView.getInt16(e2, t2);
    }
    getInt32(e2, t2 = this.le) {
      return this.dataView.getInt32(e2, t2);
    }
    getUint16(e2, t2 = this.le) {
      return this.dataView.getUint16(e2, t2);
    }
    getUint32(e2, t2 = this.le) {
      return this.dataView.getUint32(e2, t2);
    }
    getFloat32(e2, t2 = this.le) {
      return this.dataView.getFloat32(e2, t2);
    }
    getFloat64(e2, t2 = this.le) {
      return this.dataView.getFloat64(e2, t2);
    }
    getFloat(e2, t2 = this.le) {
      return this.dataView.getFloat32(e2, t2);
    }
    getDouble(e2, t2 = this.le) {
      return this.dataView.getFloat64(e2, t2);
    }
    getUintBytes(e2, t2, i2) {
      switch (t2) {
        case 1:
          return this.getUint8(e2, i2);
        case 2:
          return this.getUint16(e2, i2);
        case 4:
          return this.getUint32(e2, i2);
        case 8:
          return this.getUint64 && this.getUint64(e2, i2);
      }
    }
    getUint(e2, t2, i2) {
      switch (t2) {
        case 8:
          return this.getUint8(e2, i2);
        case 16:
          return this.getUint16(e2, i2);
        case 32:
          return this.getUint32(e2, i2);
        case 64:
          return this.getUint64 && this.getUint64(e2, i2);
      }
    }
    toString(e2) {
      return this.dataView.toString(e2, this.constructor.name);
    }
    ensureChunk() {
    }
  }
  function P(e2, t2) {
    g(`${e2} '${t2}' was not loaded, try using full build of exifr.`);
  }
  class k extends Map {
    constructor(e2) {
      super(), this.kind = e2;
    }
    get(e2, t2) {
      return this.has(e2) || P(this.kind, e2), t2 && (e2 in t2 || function(e3, t3) {
        g(`Unknown ${e3} '${t3}'.`);
      }(this.kind, e2), t2[e2].enabled || P(this.kind, e2)), super.get(e2);
    }
    keyList() {
      return Array.from(this.keys());
    }
  }
  var w = new k("file parser"), T = new k("segment parser"), A = new k("file reader");
  function D(e2, n2) {
    return "string" == typeof e2 ? O(e2, n2) : t && !i && e2 instanceof HTMLImageElement ? O(e2.src, n2) : e2 instanceof Uint8Array || e2 instanceof ArrayBuffer || e2 instanceof DataView ? new I(e2) : t && e2 instanceof Blob ? x(e2, n2, "blob", R) : void g("Invalid input argument");
  }
  function O(e2, i2) {
    return (s2 = e2).startsWith("data:") || s2.length > 1e4 ? v(e2, i2, "base64") : n && e2.includes("://") ? x(e2, i2, "url", M) : n ? v(e2, i2, "fs") : t ? x(e2, i2, "url", M) : void g("Invalid input argument");
    var s2;
  }
  async function x(e2, t2, i2, n2) {
    return A.has(i2) ? v(e2, t2, i2) : n2 ? async function(e3, t3) {
      let i3 = await t3(e3);
      return new I(i3);
    }(e2, n2) : void g(`Parser ${i2} is not loaded`);
  }
  async function v(e2, t2, i2) {
    let n2 = new (A.get(i2))(e2, t2);
    return await n2.read(), n2;
  }
  const M = (e2) => h(e2).then((e3) => e3.arrayBuffer()), R = (e2) => new Promise((t2, i2) => {
    let n2 = new FileReader();
    n2.onloadend = () => t2(n2.result || new ArrayBuffer()), n2.onerror = i2, n2.readAsArrayBuffer(e2);
  });
  class L extends Map {
    get tagKeys() {
      return this.allKeys || (this.allKeys = Array.from(this.keys())), this.allKeys;
    }
    get tagValues() {
      return this.allValues || (this.allValues = Array.from(this.values())), this.allValues;
    }
  }
  function U(e2, t2, i2) {
    let n2 = new L();
    for (let [e3, t3] of i2)
      n2.set(e3, t3);
    if (Array.isArray(t2))
      for (let i3 of t2)
        e2.set(i3, n2);
    else
      e2.set(t2, n2);
    return n2;
  }
  function F(e2, t2, i2) {
    let n2, s2 = e2.get(t2);
    for (n2 of i2)
      s2.set(n2[0], n2[1]);
  }
  const E = /* @__PURE__ */ new Map(), B = /* @__PURE__ */ new Map(), N = /* @__PURE__ */ new Map(), G = ["chunked", "firstChunkSize", "firstChunkSizeNode", "firstChunkSizeBrowser", "chunkSize", "chunkLimit"], V = ["jfif", "xmp", "icc", "iptc", "ihdr"], z = ["tiff", ...V], H = ["ifd0", "ifd1", "exif", "gps", "interop"], j = [...z, ...H], W = ["makerNote", "userComment"], K = ["translateKeys", "translateValues", "reviveValues", "multiSegment"], X = [...K, "sanitize", "mergeOutput", "silentErrors"];
  class _ {
    get translate() {
      return this.translateKeys || this.translateValues || this.reviveValues;
    }
  }
  class Y extends _ {
    get needed() {
      return this.enabled || this.deps.size > 0;
    }
    constructor(e2, t2, i2, n2) {
      if (super(), c(this, "enabled", false), c(this, "skip", /* @__PURE__ */ new Set()), c(this, "pick", /* @__PURE__ */ new Set()), c(this, "deps", /* @__PURE__ */ new Set()), c(this, "translateKeys", false), c(this, "translateValues", false), c(this, "reviveValues", false), this.key = e2, this.enabled = t2, this.parse = this.enabled, this.applyInheritables(n2), this.canBeFiltered = H.includes(e2), this.canBeFiltered && (this.dict = E.get(e2)), void 0 !== i2)
        if (Array.isArray(i2))
          this.parse = this.enabled = true, this.canBeFiltered && i2.length > 0 && this.translateTagSet(i2, this.pick);
        else if ("object" == typeof i2) {
          if (this.enabled = true, this.parse = false !== i2.parse, this.canBeFiltered) {
            let { pick: e3, skip: t3 } = i2;
            e3 && e3.length > 0 && this.translateTagSet(e3, this.pick), t3 && t3.length > 0 && this.translateTagSet(t3, this.skip);
          }
          this.applyInheritables(i2);
        } else
          true === i2 || false === i2 ? this.parse = this.enabled = i2 : g(`Invalid options argument: ${i2}`);
    }
    applyInheritables(e2) {
      let t2, i2;
      for (t2 of K)
        i2 = e2[t2], void 0 !== i2 && (this[t2] = i2);
    }
    translateTagSet(e2, t2) {
      if (this.dict) {
        let i2, n2, { tagKeys: s2, tagValues: r2 } = this.dict;
        for (i2 of e2)
          "string" == typeof i2 ? (n2 = r2.indexOf(i2), -1 === n2 && (n2 = s2.indexOf(Number(i2))), -1 !== n2 && t2.add(Number(s2[n2]))) : t2.add(i2);
      } else
        for (let i2 of e2)
          t2.add(i2);
    }
    finalizeFilters() {
      !this.enabled && this.deps.size > 0 ? (this.enabled = true, ee(this.pick, this.deps)) : this.enabled && this.pick.size > 0 && ee(this.pick, this.deps);
    }
  }
  var $ = { jfif: false, tiff: true, xmp: false, icc: false, iptc: false, ifd0: true, ifd1: false, exif: true, gps: true, interop: false, ihdr: void 0, makerNote: false, userComment: false, multiSegment: false, skip: [], pick: [], translateKeys: true, translateValues: true, reviveValues: true, sanitize: true, mergeOutput: true, silentErrors: true, chunked: true, firstChunkSize: void 0, firstChunkSizeNode: 512, firstChunkSizeBrowser: 65536, chunkSize: 65536, chunkLimit: 5 }, J = /* @__PURE__ */ new Map();
  class q extends _ {
    static useCached(e2) {
      let t2 = J.get(e2);
      return void 0 !== t2 || (t2 = new this(e2), J.set(e2, t2)), t2;
    }
    constructor(e2) {
      super(), true === e2 ? this.setupFromTrue() : void 0 === e2 ? this.setupFromUndefined() : Array.isArray(e2) ? this.setupFromArray(e2) : "object" == typeof e2 ? this.setupFromObject(e2) : g(`Invalid options argument ${e2}`), void 0 === this.firstChunkSize && (this.firstChunkSize = t ? this.firstChunkSizeBrowser : this.firstChunkSizeNode), this.mergeOutput && (this.ifd1.enabled = false), this.filterNestedSegmentTags(), this.traverseTiffDependencyTree(), this.checkLoadedPlugins();
    }
    setupFromUndefined() {
      let e2;
      for (e2 of G)
        this[e2] = $[e2];
      for (e2 of X)
        this[e2] = $[e2];
      for (e2 of W)
        this[e2] = $[e2];
      for (e2 of j)
        this[e2] = new Y(e2, $[e2], void 0, this);
    }
    setupFromTrue() {
      let e2;
      for (e2 of G)
        this[e2] = $[e2];
      for (e2 of X)
        this[e2] = $[e2];
      for (e2 of W)
        this[e2] = true;
      for (e2 of j)
        this[e2] = new Y(e2, true, void 0, this);
    }
    setupFromArray(e2) {
      let t2;
      for (t2 of G)
        this[t2] = $[t2];
      for (t2 of X)
        this[t2] = $[t2];
      for (t2 of W)
        this[t2] = $[t2];
      for (t2 of j)
        this[t2] = new Y(t2, false, void 0, this);
      this.setupGlobalFilters(e2, void 0, H);
    }
    setupFromObject(e2) {
      let t2;
      for (t2 of (H.ifd0 = H.ifd0 || H.image, H.ifd1 = H.ifd1 || H.thumbnail, Object.assign(this, e2), G))
        this[t2] = Z(e2[t2], $[t2]);
      for (t2 of X)
        this[t2] = Z(e2[t2], $[t2]);
      for (t2 of W)
        this[t2] = Z(e2[t2], $[t2]);
      for (t2 of z)
        this[t2] = new Y(t2, $[t2], e2[t2], this);
      for (t2 of H)
        this[t2] = new Y(t2, $[t2], e2[t2], this.tiff);
      this.setupGlobalFilters(e2.pick, e2.skip, H, j), true === e2.tiff ? this.batchEnableWithBool(H, true) : false === e2.tiff ? this.batchEnableWithUserValue(H, e2) : Array.isArray(e2.tiff) ? this.setupGlobalFilters(e2.tiff, void 0, H) : "object" == typeof e2.tiff && this.setupGlobalFilters(e2.tiff.pick, e2.tiff.skip, H);
    }
    batchEnableWithBool(e2, t2) {
      for (let i2 of e2)
        this[i2].enabled = t2;
    }
    batchEnableWithUserValue(e2, t2) {
      for (let i2 of e2) {
        let e3 = t2[i2];
        this[i2].enabled = false !== e3 && void 0 !== e3;
      }
    }
    setupGlobalFilters(e2, t2, i2, n2 = i2) {
      if (e2 && e2.length) {
        for (let e3 of n2)
          this[e3].enabled = false;
        let t3 = Q(e2, i2);
        for (let [e3, i3] of t3)
          ee(this[e3].pick, i3), this[e3].enabled = true;
      } else if (t2 && t2.length) {
        let e3 = Q(t2, i2);
        for (let [t3, i3] of e3)
          ee(this[t3].skip, i3);
      }
    }
    filterNestedSegmentTags() {
      let { ifd0: e2, exif: t2, xmp: i2, iptc: n2, icc: s2 } = this;
      this.makerNote ? t2.deps.add(37500) : t2.skip.add(37500), this.userComment ? t2.deps.add(37510) : t2.skip.add(37510), i2.enabled || e2.skip.add(700), n2.enabled || e2.skip.add(33723), s2.enabled || e2.skip.add(34675);
    }
    traverseTiffDependencyTree() {
      let { ifd0: e2, exif: t2, gps: i2, interop: n2 } = this;
      n2.needed && (t2.deps.add(40965), e2.deps.add(40965)), t2.needed && e2.deps.add(34665), i2.needed && e2.deps.add(34853), this.tiff.enabled = H.some((e3) => true === this[e3].enabled) || this.makerNote || this.userComment;
      for (let e3 of H)
        this[e3].finalizeFilters();
    }
    get onlyTiff() {
      return !V.map((e2) => this[e2].enabled).some((e2) => true === e2) && this.tiff.enabled;
    }
    checkLoadedPlugins() {
      for (let e2 of z)
        this[e2].enabled && !T.has(e2) && P("segment parser", e2);
    }
  }
  function Q(e2, t2) {
    let i2, n2, s2, r2, a2 = [];
    for (s2 of t2) {
      for (r2 of (i2 = E.get(s2), n2 = [], i2))
        (e2.includes(r2[0]) || e2.includes(r2[1])) && n2.push(r2[0]);
      n2.length && a2.push([s2, n2]);
    }
    return a2;
  }
  function Z(e2, t2) {
    return void 0 !== e2 ? e2 : void 0 !== t2 ? t2 : void 0;
  }
  function ee(e2, t2) {
    for (let i2 of t2)
      e2.add(i2);
  }
  c(q, "default", $);
  class te {
    constructor(e2) {
      c(this, "parsers", {}), c(this, "output", {}), c(this, "errors", []), c(this, "pushToErrors", (e3) => this.errors.push(e3)), this.options = q.useCached(e2);
    }
    async read(e2) {
      this.file = await D(e2, this.options);
    }
    setup() {
      if (this.fileParser)
        return;
      let { file: e2 } = this, t2 = e2.getUint16(0);
      for (let [i2, n2] of w)
        if (n2.canHandle(e2, t2))
          return this.fileParser = new n2(this.options, this.file, this.parsers), e2[i2] = true;
      this.file.close && this.file.close(), g("Unknown file format");
    }
    async parse() {
      let { output: e2, errors: t2 } = this;
      return this.setup(), this.options.silentErrors ? (await this.executeParsers().catch(this.pushToErrors), t2.push(...this.fileParser.errors)) : await this.executeParsers(), this.file.close && this.file.close(), this.options.silentErrors && t2.length > 0 && (e2.errors = t2), f(e2);
    }
    async executeParsers() {
      let { output: e2 } = this;
      await this.fileParser.parse();
      let t2 = Object.values(this.parsers).map(async (t3) => {
        let i2 = await t3.parse();
        t3.assignToOutput(e2, i2);
      });
      this.options.silentErrors && (t2 = t2.map((e3) => e3.catch(this.pushToErrors))), await Promise.all(t2);
    }
    async extractThumbnail() {
      this.setup();
      let { options: e2, file: t2 } = this, i2 = T.get("tiff", e2);
      var n2;
      if (t2.tiff ? n2 = { start: 0, type: "tiff" } : t2.jpeg && (n2 = await this.fileParser.getOrFindSegment("tiff")), void 0 === n2)
        return;
      let s2 = await this.fileParser.ensureSegmentChunk(n2), r2 = this.parsers.tiff = new i2(s2, e2, t2), a2 = await r2.extractThumbnail();
      return t2.close && t2.close(), a2;
    }
  }
  async function ie(e2, t2) {
    let i2 = new te(t2);
    return await i2.read(e2), i2.parse();
  }
  var ne = Object.freeze({ __proto__: null, parse: ie, Exifr: te, fileParsers: w, segmentParsers: T, fileReaders: A, tagKeys: E, tagValues: B, tagRevivers: N, createDictionary: U, extendDictionary: F, fetchUrlAsArrayBuffer: M, readBlobAsArrayBuffer: R, chunkedProps: G, otherSegments: V, segments: z, tiffBlocks: H, segmentsAndBlocks: j, tiffExtractables: W, inheritables: K, allFormatters: X, Options: q });
  class se {
    constructor(e2, t2, i2) {
      c(this, "errors", []), c(this, "ensureSegmentChunk", async (e3) => {
        let t3 = e3.start, i3 = e3.size || 65536;
        if (this.file.chunked)
          if (this.file.available(t3, i3))
            e3.chunk = this.file.subarray(t3, i3);
          else
            try {
              e3.chunk = await this.file.readChunk(t3, i3);
            } catch (t4) {
              g(`Couldn't read segment: ${JSON.stringify(e3)}. ${t4.message}`);
            }
        else
          this.file.byteLength > t3 + i3 ? e3.chunk = this.file.subarray(t3, i3) : void 0 === e3.size ? e3.chunk = this.file.subarray(t3) : g("Segment unreachable: " + JSON.stringify(e3));
        return e3.chunk;
      }), this.extendOptions && this.extendOptions(e2), this.options = e2, this.file = t2, this.parsers = i2;
    }
    injectSegment(e2, t2) {
      this.options[e2].enabled && this.createParser(e2, t2);
    }
    createParser(e2, t2) {
      let i2 = new (T.get(e2))(t2, this.options, this.file);
      return this.parsers[e2] = i2;
    }
    createParsers(e2) {
      for (let t2 of e2) {
        let { type: e3, chunk: i2 } = t2, n2 = this.options[e3];
        if (n2 && n2.enabled) {
          let t3 = this.parsers[e3];
          t3 && t3.append || t3 || this.createParser(e3, i2);
        }
      }
    }
    async readSegments(e2) {
      let t2 = e2.map(this.ensureSegmentChunk);
      await Promise.all(t2);
    }
  }
  class re {
    static findPosition(e2, t2) {
      let i2 = e2.getUint16(t2 + 2) + 2, n2 = "function" == typeof this.headerLength ? this.headerLength(e2, t2, i2) : this.headerLength, s2 = t2 + n2, r2 = i2 - n2;
      return { offset: t2, length: i2, headerLength: n2, start: s2, size: r2, end: s2 + r2 };
    }
    static parse(e2, t2 = {}) {
      return new this(e2, new q({ [this.type]: t2 }), e2).parse();
    }
    normalizeInput(e2) {
      return e2 instanceof I ? e2 : new I(e2);
    }
    constructor(e2, t2 = {}, i2) {
      c(this, "errors", []), c(this, "raw", /* @__PURE__ */ new Map()), c(this, "handleError", (e3) => {
        if (!this.options.silentErrors)
          throw e3;
        this.errors.push(e3.message);
      }), this.chunk = this.normalizeInput(e2), this.file = i2, this.type = this.constructor.type, this.globalOptions = this.options = t2, this.localOptions = t2[this.type], this.canTranslate = this.localOptions && this.localOptions.translate;
    }
    translate() {
      this.canTranslate && (this.translated = this.translateBlock(this.raw, this.type));
    }
    get output() {
      return this.translated ? this.translated : this.raw ? Object.fromEntries(this.raw) : void 0;
    }
    translateBlock(e2, t2) {
      let i2 = N.get(t2), n2 = B.get(t2), s2 = E.get(t2), r2 = this.options[t2], a2 = r2.reviveValues && !!i2, o2 = r2.translateValues && !!n2, l2 = r2.translateKeys && !!s2, h2 = {};
      for (let [t3, r3] of e2)
        a2 && i2.has(t3) ? r3 = i2.get(t3)(r3) : o2 && n2.has(t3) && (r3 = this.translateValue(r3, n2.get(t3))), l2 && s2.has(t3) && (t3 = s2.get(t3) || t3), h2[t3] = r3;
      return h2;
    }
    translateValue(e2, t2) {
      return t2[e2] || t2.DEFAULT || e2;
    }
    assignToOutput(e2, t2) {
      this.assignObjectToOutput(e2, this.constructor.type, t2);
    }
    assignObjectToOutput(e2, t2, i2) {
      if (this.globalOptions.mergeOutput)
        return Object.assign(e2, i2);
      e2[t2] ? Object.assign(e2[t2], i2) : e2[t2] = i2;
    }
  }
  c(re, "headerLength", 4), c(re, "type", void 0), c(re, "multiSegment", false), c(re, "canHandle", () => false);
  function ae(e2) {
    return 192 === e2 || 194 === e2 || 196 === e2 || 219 === e2 || 221 === e2 || 218 === e2 || 254 === e2;
  }
  function oe(e2) {
    return e2 >= 224 && e2 <= 239;
  }
  function le(e2, t2, i2) {
    for (let [n2, s2] of T)
      if (s2.canHandle(e2, t2, i2))
        return n2;
  }
  class he extends se {
    constructor(...e2) {
      super(...e2), c(this, "appSegments", []), c(this, "jpegSegments", []), c(this, "unknownSegments", []);
    }
    static canHandle(e2, t2) {
      return 65496 === t2;
    }
    async parse() {
      await this.findAppSegments(), await this.readSegments(this.appSegments), this.mergeMultiSegments(), this.createParsers(this.mergedAppSegments || this.appSegments);
    }
    setupSegmentFinderArgs(e2) {
      true === e2 ? (this.findAll = true, this.wanted = new Set(T.keyList())) : (e2 = void 0 === e2 ? T.keyList().filter((e3) => this.options[e3].enabled) : e2.filter((e3) => this.options[e3].enabled && T.has(e3)), this.findAll = false, this.remaining = new Set(e2), this.wanted = new Set(e2)), this.unfinishedMultiSegment = false;
    }
    async findAppSegments(e2 = 0, t2) {
      this.setupSegmentFinderArgs(t2);
      let { file: i2, findAll: n2, wanted: s2, remaining: r2 } = this;
      if (!n2 && this.file.chunked && (n2 = Array.from(s2).some((e3) => {
        let t3 = T.get(e3), i3 = this.options[e3];
        return t3.multiSegment && i3.multiSegment;
      }), n2 && await this.file.readWhole()), e2 = this.findAppSegmentsInRange(e2, i2.byteLength), !this.options.onlyTiff && i2.chunked) {
        let t3 = false;
        for (; r2.size > 0 && !t3 && (i2.canReadNextChunk || this.unfinishedMultiSegment); ) {
          let { nextChunkOffset: n3 } = i2, s3 = this.appSegments.some((e3) => !this.file.available(e3.offset || e3.start, e3.length || e3.size));
          if (t3 = e2 > n3 && !s3 ? !await i2.readNextChunk(e2) : !await i2.readNextChunk(n3), void 0 === (e2 = this.findAppSegmentsInRange(e2, i2.byteLength)))
            return;
        }
      }
    }
    findAppSegmentsInRange(e2, t2) {
      t2 -= 2;
      let i2, n2, s2, r2, a2, o2, { file: l2, findAll: h2, wanted: u2, remaining: c2, options: f2 } = this;
      for (; e2 < t2; e2++)
        if (255 === l2.getUint8(e2)) {
          if (i2 = l2.getUint8(e2 + 1), oe(i2)) {
            if (n2 = l2.getUint16(e2 + 2), s2 = le(l2, e2, n2), s2 && u2.has(s2) && (r2 = T.get(s2), a2 = r2.findPosition(l2, e2), o2 = f2[s2], a2.type = s2, this.appSegments.push(a2), !h2 && (r2.multiSegment && o2.multiSegment ? (this.unfinishedMultiSegment = a2.chunkNumber < a2.chunkCount, this.unfinishedMultiSegment || c2.delete(s2)) : c2.delete(s2), 0 === c2.size)))
              break;
            f2.recordUnknownSegments && (a2 = re.findPosition(l2, e2), a2.marker = i2, this.unknownSegments.push(a2)), e2 += n2 + 1;
          } else if (ae(i2)) {
            if (n2 = l2.getUint16(e2 + 2), 218 === i2 && false !== f2.stopAfterSos)
              return;
            f2.recordJpegSegments && this.jpegSegments.push({ offset: e2, length: n2, marker: i2 }), e2 += n2 + 1;
          }
        }
      return e2;
    }
    mergeMultiSegments() {
      if (!this.appSegments.some((e3) => e3.multiSegment))
        return;
      let e2 = function(e3, t2) {
        let i2, n2, s2, r2 = /* @__PURE__ */ new Map();
        for (let a2 = 0; a2 < e3.length; a2++)
          i2 = e3[a2], n2 = i2[t2], r2.has(n2) ? s2 = r2.get(n2) : r2.set(n2, s2 = []), s2.push(i2);
        return Array.from(r2);
      }(this.appSegments, "type");
      this.mergedAppSegments = e2.map(([e3, t2]) => {
        let i2 = T.get(e3, this.options);
        if (i2.handleMultiSegments) {
          return { type: e3, chunk: i2.handleMultiSegments(t2) };
        }
        return t2[0];
      });
    }
    getSegment(e2) {
      return this.appSegments.find((t2) => t2.type === e2);
    }
    async getOrFindSegment(e2) {
      let t2 = this.getSegment(e2);
      return void 0 === t2 && (await this.findAppSegments(0, [e2]), t2 = this.getSegment(e2)), t2;
    }
  }
  c(he, "type", "jpeg"), w.set("jpeg", he);
  const ue = [void 0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8, 4, 8, 4];
  class ce extends re {
    parseHeader() {
      var e2 = this.chunk.getUint16();
      18761 === e2 ? this.le = true : 19789 === e2 && (this.le = false), this.chunk.le = this.le, this.headerParsed = true;
    }
    parseTags(e2, t2, i2 = /* @__PURE__ */ new Map()) {
      let { pick: n2, skip: s2 } = this.options[t2];
      n2 = new Set(n2);
      let r2 = n2.size > 0, a2 = 0 === s2.size, o2 = this.chunk.getUint16(e2);
      e2 += 2;
      for (let l2 = 0; l2 < o2; l2++) {
        let o3 = this.chunk.getUint16(e2);
        if (r2) {
          if (n2.has(o3) && (i2.set(o3, this.parseTag(e2, o3, t2)), n2.delete(o3), 0 === n2.size))
            break;
        } else
          !a2 && s2.has(o3) || i2.set(o3, this.parseTag(e2, o3, t2));
        e2 += 12;
      }
      return i2;
    }
    parseTag(e2, t2, i2) {
      let { chunk: n2 } = this, s2 = n2.getUint16(e2 + 2), r2 = n2.getUint32(e2 + 4), a2 = ue[s2];
      if (a2 * r2 <= 4 ? e2 += 8 : e2 = n2.getUint32(e2 + 8), (s2 < 1 || s2 > 13) && g(`Invalid TIFF value type. block: ${i2.toUpperCase()}, tag: ${t2.toString(16)}, type: ${s2}, offset ${e2}`), e2 > n2.byteLength && g(`Invalid TIFF value offset. block: ${i2.toUpperCase()}, tag: ${t2.toString(16)}, type: ${s2}, offset ${e2} is outside of chunk size ${n2.byteLength}`), 1 === s2)
        return n2.getUint8Array(e2, r2);
      if (2 === s2)
        return m(n2.getString(e2, r2));
      if (7 === s2)
        return n2.getUint8Array(e2, r2);
      if (1 === r2)
        return this.parseTagValue(s2, e2);
      {
        let t3 = new (function(e3) {
          switch (e3) {
            case 1:
              return Uint8Array;
            case 3:
              return Uint16Array;
            case 4:
              return Uint32Array;
            case 5:
              return Array;
            case 6:
              return Int8Array;
            case 8:
              return Int16Array;
            case 9:
              return Int32Array;
            case 10:
              return Array;
            case 11:
              return Float32Array;
            case 12:
              return Float64Array;
            default:
              return Array;
          }
        }(s2))(r2), i3 = a2;
        for (let n3 = 0; n3 < r2; n3++)
          t3[n3] = this.parseTagValue(s2, e2), e2 += i3;
        return t3;
      }
    }
    parseTagValue(e2, t2) {
      let { chunk: i2 } = this;
      switch (e2) {
        case 1:
          return i2.getUint8(t2);
        case 3:
          return i2.getUint16(t2);
        case 4:
          return i2.getUint32(t2);
        case 5:
          return i2.getUint32(t2) / i2.getUint32(t2 + 4);
        case 6:
          return i2.getInt8(t2);
        case 8:
          return i2.getInt16(t2);
        case 9:
          return i2.getInt32(t2);
        case 10:
          return i2.getInt32(t2) / i2.getInt32(t2 + 4);
        case 11:
          return i2.getFloat(t2);
        case 12:
          return i2.getDouble(t2);
        case 13:
          return i2.getUint32(t2);
        default:
          g(`Invalid tiff type ${e2}`);
      }
    }
  }
  class fe extends ce {
    static canHandle(e2, t2) {
      return 225 === e2.getUint8(t2 + 1) && 1165519206 === e2.getUint32(t2 + 4) && 0 === e2.getUint16(t2 + 8);
    }
    async parse() {
      this.parseHeader();
      let { options: e2 } = this;
      return e2.ifd0.enabled && await this.parseIfd0Block(), e2.exif.enabled && await this.safeParse("parseExifBlock"), e2.gps.enabled && await this.safeParse("parseGpsBlock"), e2.interop.enabled && await this.safeParse("parseInteropBlock"), e2.ifd1.enabled && await this.safeParse("parseThumbnailBlock"), this.createOutput();
    }
    safeParse(e2) {
      let t2 = this[e2]();
      return void 0 !== t2.catch && (t2 = t2.catch(this.handleError)), t2;
    }
    findIfd0Offset() {
      void 0 === this.ifd0Offset && (this.ifd0Offset = this.chunk.getUint32(4));
    }
    findIfd1Offset() {
      if (void 0 === this.ifd1Offset) {
        this.findIfd0Offset();
        let e2 = this.chunk.getUint16(this.ifd0Offset), t2 = this.ifd0Offset + 2 + 12 * e2;
        this.ifd1Offset = this.chunk.getUint32(t2);
      }
    }
    parseBlock(e2, t2) {
      let i2 = /* @__PURE__ */ new Map();
      return this[t2] = i2, this.parseTags(e2, t2, i2), i2;
    }
    async parseIfd0Block() {
      if (this.ifd0)
        return;
      let { file: e2 } = this;
      this.findIfd0Offset(), this.ifd0Offset < 8 && g("Malformed EXIF data"), !e2.chunked && this.ifd0Offset > e2.byteLength && g(`IFD0 offset points to outside of file.
this.ifd0Offset: ${this.ifd0Offset}, file.byteLength: ${e2.byteLength}`), e2.tiff && await e2.ensureChunk(this.ifd0Offset, S(this.options));
      let t2 = this.parseBlock(this.ifd0Offset, "ifd0");
      return 0 !== t2.size ? (this.exifOffset = t2.get(34665), this.interopOffset = t2.get(40965), this.gpsOffset = t2.get(34853), this.xmp = t2.get(700), this.iptc = t2.get(33723), this.icc = t2.get(34675), this.options.sanitize && (t2.delete(34665), t2.delete(40965), t2.delete(34853), t2.delete(700), t2.delete(33723), t2.delete(34675)), t2) : void 0;
    }
    async parseExifBlock() {
      if (this.exif)
        return;
      if (this.ifd0 || await this.parseIfd0Block(), void 0 === this.exifOffset)
        return;
      this.file.tiff && await this.file.ensureChunk(this.exifOffset, S(this.options));
      let e2 = this.parseBlock(this.exifOffset, "exif");
      return this.interopOffset || (this.interopOffset = e2.get(40965)), this.makerNote = e2.get(37500), this.userComment = e2.get(37510), this.options.sanitize && (e2.delete(40965), e2.delete(37500), e2.delete(37510)), this.unpack(e2, 41728), this.unpack(e2, 41729), e2;
    }
    unpack(e2, t2) {
      let i2 = e2.get(t2);
      i2 && 1 === i2.length && e2.set(t2, i2[0]);
    }
    async parseGpsBlock() {
      if (this.gps)
        return;
      if (this.ifd0 || await this.parseIfd0Block(), void 0 === this.gpsOffset)
        return;
      let e2 = this.parseBlock(this.gpsOffset, "gps");
      return e2 && e2.has(2) && e2.has(4) && (e2.set("latitude", de(...e2.get(2), e2.get(1))), e2.set("longitude", de(...e2.get(4), e2.get(3)))), e2;
    }
    async parseInteropBlock() {
      if (!this.interop && (this.ifd0 || await this.parseIfd0Block(), void 0 !== this.interopOffset || this.exif || await this.parseExifBlock(), void 0 !== this.interopOffset))
        return this.parseBlock(this.interopOffset, "interop");
    }
    async parseThumbnailBlock(e2 = false) {
      if (!this.ifd1 && !this.ifd1Parsed && (!this.options.mergeOutput || e2))
        return this.findIfd1Offset(), this.ifd1Offset > 0 && (this.parseBlock(this.ifd1Offset, "ifd1"), this.ifd1Parsed = true), this.ifd1;
    }
    async extractThumbnail() {
      if (this.headerParsed || this.parseHeader(), this.ifd1Parsed || await this.parseThumbnailBlock(true), void 0 === this.ifd1)
        return;
      let e2 = this.ifd1.get(513), t2 = this.ifd1.get(514);
      return this.chunk.getUint8Array(e2, t2);
    }
    get image() {
      return this.ifd0;
    }
    get thumbnail() {
      return this.ifd1;
    }
    createOutput() {
      let e2, t2, i2, n2 = {};
      for (t2 of H)
        if (e2 = this[t2], !p(e2))
          if (i2 = this.canTranslate ? this.translateBlock(e2, t2) : Object.fromEntries(e2), this.options.mergeOutput) {
            if ("ifd1" === t2)
              continue;
            Object.assign(n2, i2);
          } else
            n2[t2] = i2;
      return this.makerNote && (n2.makerNote = this.makerNote), this.userComment && (n2.userComment = this.userComment), n2;
    }
    assignToOutput(e2, t2) {
      if (this.globalOptions.mergeOutput)
        Object.assign(e2, t2);
      else
        for (let [i2, n2] of Object.entries(t2))
          this.assignObjectToOutput(e2, i2, n2);
    }
  }
  function de(e2, t2, i2, n2) {
    var s2 = e2 + t2 / 60 + i2 / 3600;
    return "S" !== n2 && "W" !== n2 || (s2 *= -1), s2;
  }
  c(fe, "type", "tiff"), c(fe, "headerLength", 10), T.set("tiff", fe);
  var pe = Object.freeze({ __proto__: null, default: ne, Exifr: te, fileParsers: w, segmentParsers: T, fileReaders: A, tagKeys: E, tagValues: B, tagRevivers: N, createDictionary: U, extendDictionary: F, fetchUrlAsArrayBuffer: M, readBlobAsArrayBuffer: R, chunkedProps: G, otherSegments: V, segments: z, tiffBlocks: H, segmentsAndBlocks: j, tiffExtractables: W, inheritables: K, allFormatters: X, Options: q, parse: ie });
  const ge = { ifd0: false, ifd1: false, exif: false, gps: false, interop: false, sanitize: false, reviveValues: true, translateKeys: false, translateValues: false, mergeOutput: false }, me = Object.assign({}, ge, { firstChunkSize: 4e4, gps: [1, 2, 3, 4] });
  async function Se(e2) {
    let t2 = new te(me);
    await t2.read(e2);
    let i2 = await t2.parse();
    if (i2 && i2.gps) {
      let { latitude: e3, longitude: t3 } = i2.gps;
      return { latitude: e3, longitude: t3 };
    }
  }
  const Ce = Object.assign({}, ge, { tiff: false, ifd1: true, mergeOutput: false });
  async function ye(e2) {
    let t2 = new te(Ce);
    await t2.read(e2);
    let i2 = await t2.extractThumbnail();
    return i2 && a ? s.from(i2) : i2;
  }
  async function be(e2) {
    let t2 = await this.thumbnail(e2);
    if (void 0 !== t2) {
      let e3 = new Blob([t2]);
      return URL.createObjectURL(e3);
    }
  }
  const Ie = Object.assign({}, ge, { firstChunkSize: 4e4, ifd0: [274] });
  async function Pe(e2) {
    let t2 = new te(Ie);
    await t2.read(e2);
    let i2 = await t2.parse();
    if (i2 && i2.ifd0)
      return i2.ifd0[274];
  }
  const ke = Object.freeze({ 1: { dimensionSwapped: false, scaleX: 1, scaleY: 1, deg: 0, rad: 0 }, 2: { dimensionSwapped: false, scaleX: -1, scaleY: 1, deg: 0, rad: 0 }, 3: { dimensionSwapped: false, scaleX: 1, scaleY: 1, deg: 180, rad: 180 * Math.PI / 180 }, 4: { dimensionSwapped: false, scaleX: -1, scaleY: 1, deg: 180, rad: 180 * Math.PI / 180 }, 5: { dimensionSwapped: true, scaleX: 1, scaleY: -1, deg: 90, rad: 90 * Math.PI / 180 }, 6: { dimensionSwapped: true, scaleX: 1, scaleY: 1, deg: 90, rad: 90 * Math.PI / 180 }, 7: { dimensionSwapped: true, scaleX: 1, scaleY: -1, deg: 270, rad: 270 * Math.PI / 180 }, 8: { dimensionSwapped: true, scaleX: 1, scaleY: 1, deg: 270, rad: 270 * Math.PI / 180 } });
  let we = true, Te = true;
  if ("object" == typeof navigator) {
    let e2 = navigator.userAgent;
    if (e2.includes("iPad") || e2.includes("iPhone")) {
      let t2 = e2.match(/OS (\d+)_(\d+)/);
      if (t2) {
        let [, e3, i2] = t2, n2 = Number(e3) + 0.1 * Number(i2);
        we = n2 < 13.4, Te = false;
      }
    } else if (e2.includes("OS X 10")) {
      let [, t2] = e2.match(/OS X 10[_.](\d+)/);
      we = Te = Number(t2) < 15;
    }
    if (e2.includes("Chrome/")) {
      let [, t2] = e2.match(/Chrome\/(\d+)/);
      we = Te = Number(t2) < 81;
    } else if (e2.includes("Firefox/")) {
      let [, t2] = e2.match(/Firefox\/(\d+)/);
      we = Te = Number(t2) < 77;
    }
  }
  async function Ae(e2) {
    let t2 = await Pe(e2);
    return Object.assign({ canvas: we, css: Te }, ke[t2]);
  }
  class De extends I {
    constructor(...e2) {
      super(...e2), c(this, "ranges", new Oe()), 0 !== this.byteLength && this.ranges.add(0, this.byteLength);
    }
    _tryExtend(e2, t2, i2) {
      if (0 === e2 && 0 === this.byteLength && i2) {
        let e3 = new DataView(i2.buffer || i2, i2.byteOffset, i2.byteLength);
        this._swapDataView(e3);
      } else {
        let i3 = e2 + t2;
        if (i3 > this.byteLength) {
          let { dataView: e3 } = this._extend(i3);
          this._swapDataView(e3);
        }
      }
    }
    _extend(e2) {
      let t2;
      t2 = a ? s.allocUnsafe(e2) : new Uint8Array(e2);
      let i2 = new DataView(t2.buffer, t2.byteOffset, t2.byteLength);
      return t2.set(new Uint8Array(this.buffer, this.byteOffset, this.byteLength), 0), { uintView: t2, dataView: i2 };
    }
    subarray(e2, t2, i2 = false) {
      return t2 = t2 || this._lengthToEnd(e2), i2 && this._tryExtend(e2, t2), this.ranges.add(e2, t2), super.subarray(e2, t2);
    }
    set(e2, t2, i2 = false) {
      i2 && this._tryExtend(t2, e2.byteLength, e2);
      let n2 = super.set(e2, t2);
      return this.ranges.add(t2, n2.byteLength), n2;
    }
    async ensureChunk(e2, t2) {
      this.chunked && (this.ranges.available(e2, t2) || await this.readChunk(e2, t2));
    }
    available(e2, t2) {
      return this.ranges.available(e2, t2);
    }
  }
  class Oe {
    constructor() {
      c(this, "list", []);
    }
    get length() {
      return this.list.length;
    }
    add(e2, t2, i2 = 0) {
      let n2 = e2 + t2, s2 = this.list.filter((t3) => xe(e2, t3.offset, n2) || xe(e2, t3.end, n2));
      if (s2.length > 0) {
        e2 = Math.min(e2, ...s2.map((e3) => e3.offset)), n2 = Math.max(n2, ...s2.map((e3) => e3.end)), t2 = n2 - e2;
        let i3 = s2.shift();
        i3.offset = e2, i3.length = t2, i3.end = n2, this.list = this.list.filter((e3) => !s2.includes(e3));
      } else
        this.list.push({ offset: e2, length: t2, end: n2 });
    }
    available(e2, t2) {
      let i2 = e2 + t2;
      return this.list.some((t3) => t3.offset <= e2 && i2 <= t3.end);
    }
  }
  function xe(e2, t2, i2) {
    return e2 <= t2 && t2 <= i2;
  }
  class ve extends De {
    constructor(e2, t2) {
      super(0), c(this, "chunksRead", 0), this.input = e2, this.options = t2;
    }
    async readWhole() {
      this.chunked = false, await this.readChunk(this.nextChunkOffset);
    }
    async readChunked() {
      this.chunked = true, await this.readChunk(0, this.options.firstChunkSize);
    }
    async readNextChunk(e2 = this.nextChunkOffset) {
      if (this.fullyRead)
        return this.chunksRead++, false;
      let t2 = this.options.chunkSize, i2 = await this.readChunk(e2, t2);
      return !!i2 && i2.byteLength === t2;
    }
    async readChunk(e2, t2) {
      if (this.chunksRead++, 0 !== (t2 = this.safeWrapAddress(e2, t2)))
        return this._readChunk(e2, t2);
    }
    safeWrapAddress(e2, t2) {
      return void 0 !== this.size && e2 + t2 > this.size ? Math.max(0, this.size - e2) : t2;
    }
    get nextChunkOffset() {
      if (0 !== this.ranges.list.length)
        return this.ranges.list[0].length;
    }
    get canReadNextChunk() {
      return this.chunksRead < this.options.chunkLimit;
    }
    get fullyRead() {
      return void 0 !== this.size && this.nextChunkOffset === this.size;
    }
    read() {
      return this.options.chunked ? this.readChunked() : this.readWhole();
    }
    close() {
    }
  }
  A.set("blob", class extends ve {
    async readWhole() {
      this.chunked = false;
      let e2 = await R(this.input);
      this._swapArrayBuffer(e2);
    }
    readChunked() {
      return this.chunked = true, this.size = this.input.size, super.readChunked();
    }
    async _readChunk(e2, t2) {
      let i2 = t2 ? e2 + t2 : void 0, n2 = this.input.slice(e2, i2), s2 = await R(n2);
      return this.set(s2, e2, true);
    }
  });
  var Me = Object.freeze({ __proto__: null, default: pe, Exifr: te, fileParsers: w, segmentParsers: T, fileReaders: A, tagKeys: E, tagValues: B, tagRevivers: N, createDictionary: U, extendDictionary: F, fetchUrlAsArrayBuffer: M, readBlobAsArrayBuffer: R, chunkedProps: G, otherSegments: V, segments: z, tiffBlocks: H, segmentsAndBlocks: j, tiffExtractables: W, inheritables: K, allFormatters: X, Options: q, parse: ie, gpsOnlyOptions: me, gps: Se, thumbnailOnlyOptions: Ce, thumbnail: ye, thumbnailUrl: be, orientationOnlyOptions: Ie, orientation: Pe, rotations: ke, get rotateCanvas() {
    return we;
  }, get rotateCss() {
    return Te;
  }, rotation: Ae });
  A.set("url", class extends ve {
    async readWhole() {
      this.chunked = false;
      let e2 = await M(this.input);
      e2 instanceof ArrayBuffer ? this._swapArrayBuffer(e2) : e2 instanceof Uint8Array && this._swapBuffer(e2);
    }
    async _readChunk(e2, t2) {
      let i2 = t2 ? e2 + t2 - 1 : void 0, n2 = this.options.httpHeaders || {};
      (e2 || i2) && (n2.range = `bytes=${[e2, i2].join("-")}`);
      let s2 = await h(this.input, { headers: n2 }), r2 = await s2.arrayBuffer(), a2 = r2.byteLength;
      if (416 !== s2.status)
        return a2 !== t2 && (this.size = e2 + a2), this.set(r2, e2, true);
    }
  });
  I.prototype.getUint64 = function(e2) {
    let t2 = this.getUint32(e2), i2 = this.getUint32(e2 + 4);
    return t2 < 1048575 ? t2 << 32 | i2 : void 0 !== typeof r ? (console.warn("Using BigInt because of type 64uint but JS can only handle 53b numbers."), r(t2) << r(32) | r(i2)) : void g("Trying to read 64b value but JS can only handle 53b numbers.");
  };
  class Re extends se {
    parseBoxes(e2 = 0) {
      let t2 = [];
      for (; e2 < this.file.byteLength - 4; ) {
        let i2 = this.parseBoxHead(e2);
        if (t2.push(i2), 0 === i2.length)
          break;
        e2 += i2.length;
      }
      return t2;
    }
    parseSubBoxes(e2) {
      e2.boxes = this.parseBoxes(e2.start);
    }
    findBox(e2, t2) {
      return void 0 === e2.boxes && this.parseSubBoxes(e2), e2.boxes.find((e3) => e3.kind === t2);
    }
    parseBoxHead(e2) {
      let t2 = this.file.getUint32(e2), i2 = this.file.getString(e2 + 4, 4), n2 = e2 + 8;
      return 1 === t2 && (t2 = this.file.getUint64(e2 + 8), n2 += 8), { offset: e2, length: t2, kind: i2, start: n2 };
    }
    parseBoxFullHead(e2) {
      if (void 0 !== e2.version)
        return;
      let t2 = this.file.getUint32(e2.start);
      e2.version = t2 >> 24, e2.start += 4;
    }
  }
  class Le extends Re {
    static canHandle(e2, t2) {
      if (0 !== t2)
        return false;
      let i2 = e2.getUint16(2);
      if (i2 > 50)
        return false;
      let n2 = 16, s2 = [];
      for (; n2 < i2; )
        s2.push(e2.getString(n2, 4)), n2 += 4;
      return s2.includes(this.type);
    }
    async parse() {
      let e2 = this.file.getUint32(0), t2 = this.parseBoxHead(e2);
      for (; "meta" !== t2.kind; )
        e2 += t2.length, await this.file.ensureChunk(e2, 16), t2 = this.parseBoxHead(e2);
      await this.file.ensureChunk(t2.offset, t2.length), this.parseBoxFullHead(t2), this.parseSubBoxes(t2), this.options.icc.enabled && await this.findIcc(t2), this.options.tiff.enabled && await this.findExif(t2);
    }
    async registerSegment(e2, t2, i2) {
      await this.file.ensureChunk(t2, i2);
      let n2 = this.file.subarray(t2, i2);
      this.createParser(e2, n2);
    }
    async findIcc(e2) {
      let t2 = this.findBox(e2, "iprp");
      if (void 0 === t2)
        return;
      let i2 = this.findBox(t2, "ipco");
      if (void 0 === i2)
        return;
      let n2 = this.findBox(i2, "colr");
      void 0 !== n2 && await this.registerSegment("icc", n2.offset + 12, n2.length);
    }
    async findExif(e2) {
      let t2 = this.findBox(e2, "iinf");
      if (void 0 === t2)
        return;
      let i2 = this.findBox(e2, "iloc");
      if (void 0 === i2)
        return;
      let n2 = this.findExifLocIdInIinf(t2), s2 = this.findExtentInIloc(i2, n2);
      if (void 0 === s2)
        return;
      let [r2, a2] = s2;
      await this.file.ensureChunk(r2, a2);
      let o2 = 4 + this.file.getUint32(r2);
      r2 += o2, a2 -= o2, await this.registerSegment("tiff", r2, a2);
    }
    findExifLocIdInIinf(e2) {
      this.parseBoxFullHead(e2);
      let t2, i2, n2, s2, r2 = e2.start, a2 = this.file.getUint16(r2);
      for (r2 += 2; a2--; ) {
        if (t2 = this.parseBoxHead(r2), this.parseBoxFullHead(t2), i2 = t2.start, t2.version >= 2 && (n2 = 3 === t2.version ? 4 : 2, s2 = this.file.getString(i2 + n2 + 2, 4), "Exif" === s2))
          return this.file.getUintBytes(i2, n2);
        r2 += t2.length;
      }
    }
    get8bits(e2) {
      let t2 = this.file.getUint8(e2);
      return [t2 >> 4, 15 & t2];
    }
    findExtentInIloc(e2, t2) {
      this.parseBoxFullHead(e2);
      let i2 = e2.start, [n2, s2] = this.get8bits(i2++), [r2, a2] = this.get8bits(i2++), o2 = 2 === e2.version ? 4 : 2, l2 = 1 === e2.version || 2 === e2.version ? 2 : 0, h2 = a2 + n2 + s2, u2 = 2 === e2.version ? 4 : 2, c2 = this.file.getUintBytes(i2, u2);
      for (i2 += u2; c2--; ) {
        let e3 = this.file.getUintBytes(i2, o2);
        i2 += o2 + l2 + 2 + r2;
        let u3 = this.file.getUint16(i2);
        if (i2 += 2, e3 === t2)
          return u3 > 1 && console.warn("ILOC box has more than one extent but we're only processing one\nPlease create an issue at https://github.com/MikeKovarik/exifr with this file"), [this.file.getUintBytes(i2 + a2, n2), this.file.getUintBytes(i2 + a2 + n2, s2)];
        i2 += u3 * h2;
      }
    }
  }
  class Ue extends Le {
  }
  c(Ue, "type", "heic");
  class Fe extends Le {
  }
  c(Fe, "type", "avif"), w.set("heic", Ue), w.set("avif", Fe), U(E, ["ifd0", "ifd1"], [[256, "ImageWidth"], [257, "ImageHeight"], [258, "BitsPerSample"], [259, "Compression"], [262, "PhotometricInterpretation"], [270, "ImageDescription"], [271, "Make"], [272, "Model"], [273, "StripOffsets"], [274, "Orientation"], [277, "SamplesPerPixel"], [278, "RowsPerStrip"], [279, "StripByteCounts"], [282, "XResolution"], [283, "YResolution"], [284, "PlanarConfiguration"], [296, "ResolutionUnit"], [301, "TransferFunction"], [305, "Software"], [306, "ModifyDate"], [315, "Artist"], [316, "HostComputer"], [317, "Predictor"], [318, "WhitePoint"], [319, "PrimaryChromaticities"], [513, "ThumbnailOffset"], [514, "ThumbnailLength"], [529, "YCbCrCoefficients"], [530, "YCbCrSubSampling"], [531, "YCbCrPositioning"], [532, "ReferenceBlackWhite"], [700, "ApplicationNotes"], [33432, "Copyright"], [33723, "IPTC"], [34665, "ExifIFD"], [34675, "ICC"], [34853, "GpsIFD"], [330, "SubIFD"], [40965, "InteropIFD"], [40091, "XPTitle"], [40092, "XPComment"], [40093, "XPAuthor"], [40094, "XPKeywords"], [40095, "XPSubject"]]), U(E, "exif", [[33434, "ExposureTime"], [33437, "FNumber"], [34850, "ExposureProgram"], [34852, "SpectralSensitivity"], [34855, "ISO"], [34858, "TimeZoneOffset"], [34859, "SelfTimerMode"], [34864, "SensitivityType"], [34865, "StandardOutputSensitivity"], [34866, "RecommendedExposureIndex"], [34867, "ISOSpeed"], [34868, "ISOSpeedLatitudeyyy"], [34869, "ISOSpeedLatitudezzz"], [36864, "ExifVersion"], [36867, "DateTimeOriginal"], [36868, "CreateDate"], [36873, "GooglePlusUploadCode"], [36880, "OffsetTime"], [36881, "OffsetTimeOriginal"], [36882, "OffsetTimeDigitized"], [37121, "ComponentsConfiguration"], [37122, "CompressedBitsPerPixel"], [37377, "ShutterSpeedValue"], [37378, "ApertureValue"], [37379, "BrightnessValue"], [37380, "ExposureCompensation"], [37381, "MaxApertureValue"], [37382, "SubjectDistance"], [37383, "MeteringMode"], [37384, "LightSource"], [37385, "Flash"], [37386, "FocalLength"], [37393, "ImageNumber"], [37394, "SecurityClassification"], [37395, "ImageHistory"], [37396, "SubjectArea"], [37500, "MakerNote"], [37510, "UserComment"], [37520, "SubSecTime"], [37521, "SubSecTimeOriginal"], [37522, "SubSecTimeDigitized"], [37888, "AmbientTemperature"], [37889, "Humidity"], [37890, "Pressure"], [37891, "WaterDepth"], [37892, "Acceleration"], [37893, "CameraElevationAngle"], [40960, "FlashpixVersion"], [40961, "ColorSpace"], [40962, "ExifImageWidth"], [40963, "ExifImageHeight"], [40964, "RelatedSoundFile"], [41483, "FlashEnergy"], [41486, "FocalPlaneXResolution"], [41487, "FocalPlaneYResolution"], [41488, "FocalPlaneResolutionUnit"], [41492, "SubjectLocation"], [41493, "ExposureIndex"], [41495, "SensingMethod"], [41728, "FileSource"], [41729, "SceneType"], [41730, "CFAPattern"], [41985, "CustomRendered"], [41986, "ExposureMode"], [41987, "WhiteBalance"], [41988, "DigitalZoomRatio"], [41989, "FocalLengthIn35mmFormat"], [41990, "SceneCaptureType"], [41991, "GainControl"], [41992, "Contrast"], [41993, "Saturation"], [41994, "Sharpness"], [41996, "SubjectDistanceRange"], [42016, "ImageUniqueID"], [42032, "OwnerName"], [42033, "SerialNumber"], [42034, "LensInfo"], [42035, "LensMake"], [42036, "LensModel"], [42037, "LensSerialNumber"], [42080, "CompositeImage"], [42081, "CompositeImageCount"], [42082, "CompositeImageExposureTimes"], [42240, "Gamma"], [59932, "Padding"], [59933, "OffsetSchema"], [65e3, "OwnerName"], [65001, "SerialNumber"], [65002, "Lens"], [65100, "RawFile"], [65101, "Converter"], [65102, "WhiteBalance"], [65105, "Exposure"], [65106, "Shadows"], [65107, "Brightness"], [65108, "Contrast"], [65109, "Saturation"], [65110, "Sharpness"], [65111, "Smoothness"], [65112, "MoireFilter"], [40965, "InteropIFD"]]), U(E, "gps", [[0, "GPSVersionID"], [1, "GPSLatitudeRef"], [2, "GPSLatitude"], [3, "GPSLongitudeRef"], [4, "GPSLongitude"], [5, "GPSAltitudeRef"], [6, "GPSAltitude"], [7, "GPSTimeStamp"], [8, "GPSSatellites"], [9, "GPSStatus"], [10, "GPSMeasureMode"], [11, "GPSDOP"], [12, "GPSSpeedRef"], [13, "GPSSpeed"], [14, "GPSTrackRef"], [15, "GPSTrack"], [16, "GPSImgDirectionRef"], [17, "GPSImgDirection"], [18, "GPSMapDatum"], [19, "GPSDestLatitudeRef"], [20, "GPSDestLatitude"], [21, "GPSDestLongitudeRef"], [22, "GPSDestLongitude"], [23, "GPSDestBearingRef"], [24, "GPSDestBearing"], [25, "GPSDestDistanceRef"], [26, "GPSDestDistance"], [27, "GPSProcessingMethod"], [28, "GPSAreaInformation"], [29, "GPSDateStamp"], [30, "GPSDifferential"], [31, "GPSHPositioningError"]]), U(B, ["ifd0", "ifd1"], [[274, { 1: "Horizontal (normal)", 2: "Mirror horizontal", 3: "Rotate 180", 4: "Mirror vertical", 5: "Mirror horizontal and rotate 270 CW", 6: "Rotate 90 CW", 7: "Mirror horizontal and rotate 90 CW", 8: "Rotate 270 CW" }], [296, { 1: "None", 2: "inches", 3: "cm" }]]);
  let Ee = U(B, "exif", [[34850, { 0: "Not defined", 1: "Manual", 2: "Normal program", 3: "Aperture priority", 4: "Shutter priority", 5: "Creative program", 6: "Action program", 7: "Portrait mode", 8: "Landscape mode" }], [37121, { 0: "-", 1: "Y", 2: "Cb", 3: "Cr", 4: "R", 5: "G", 6: "B" }], [37383, { 0: "Unknown", 1: "Average", 2: "CenterWeightedAverage", 3: "Spot", 4: "MultiSpot", 5: "Pattern", 6: "Partial", 255: "Other" }], [37384, { 0: "Unknown", 1: "Daylight", 2: "Fluorescent", 3: "Tungsten (incandescent light)", 4: "Flash", 9: "Fine weather", 10: "Cloudy weather", 11: "Shade", 12: "Daylight fluorescent (D 5700 - 7100K)", 13: "Day white fluorescent (N 4600 - 5400K)", 14: "Cool white fluorescent (W 3900 - 4500K)", 15: "White fluorescent (WW 3200 - 3700K)", 17: "Standard light A", 18: "Standard light B", 19: "Standard light C", 20: "D55", 21: "D65", 22: "D75", 23: "D50", 24: "ISO studio tungsten", 255: "Other" }], [37385, { 0: "Flash did not fire", 1: "Flash fired", 5: "Strobe return light not detected", 7: "Strobe return light detected", 9: "Flash fired, compulsory flash mode", 13: "Flash fired, compulsory flash mode, return light not detected", 15: "Flash fired, compulsory flash mode, return light detected", 16: "Flash did not fire, compulsory flash mode", 24: "Flash did not fire, auto mode", 25: "Flash fired, auto mode", 29: "Flash fired, auto mode, return light not detected", 31: "Flash fired, auto mode, return light detected", 32: "No flash function", 65: "Flash fired, red-eye reduction mode", 69: "Flash fired, red-eye reduction mode, return light not detected", 71: "Flash fired, red-eye reduction mode, return light detected", 73: "Flash fired, compulsory flash mode, red-eye reduction mode", 77: "Flash fired, compulsory flash mode, red-eye reduction mode, return light not detected", 79: "Flash fired, compulsory flash mode, red-eye reduction mode, return light detected", 89: "Flash fired, auto mode, red-eye reduction mode", 93: "Flash fired, auto mode, return light not detected, red-eye reduction mode", 95: "Flash fired, auto mode, return light detected, red-eye reduction mode" }], [41495, { 1: "Not defined", 2: "One-chip color area sensor", 3: "Two-chip color area sensor", 4: "Three-chip color area sensor", 5: "Color sequential area sensor", 7: "Trilinear sensor", 8: "Color sequential linear sensor" }], [41728, { 1: "Film Scanner", 2: "Reflection Print Scanner", 3: "Digital Camera" }], [41729, { 1: "Directly photographed" }], [41985, { 0: "Normal", 1: "Custom", 2: "HDR (no original saved)", 3: "HDR (original saved)", 4: "Original (for HDR)", 6: "Panorama", 7: "Portrait HDR", 8: "Portrait" }], [41986, { 0: "Auto", 1: "Manual", 2: "Auto bracket" }], [41987, { 0: "Auto", 1: "Manual" }], [41990, { 0: "Standard", 1: "Landscape", 2: "Portrait", 3: "Night", 4: "Other" }], [41991, { 0: "None", 1: "Low gain up", 2: "High gain up", 3: "Low gain down", 4: "High gain down" }], [41996, { 0: "Unknown", 1: "Macro", 2: "Close", 3: "Distant" }], [42080, { 0: "Unknown", 1: "Not a Composite Image", 2: "General Composite Image", 3: "Composite Image Captured While Shooting" }]]);
  const Be = { 1: "No absolute unit of measurement", 2: "Inch", 3: "Centimeter" };
  Ee.set(37392, Be), Ee.set(41488, Be);
  const Ne = { 0: "Normal", 1: "Low", 2: "High" };
  function Ge(e2) {
    return "object" == typeof e2 && void 0 !== e2.length ? e2[0] : e2;
  }
  function Ve(e2) {
    let t2 = Array.from(e2).slice(1);
    return t2[1] > 15 && (t2 = t2.map((e3) => String.fromCharCode(e3))), "0" !== t2[2] && 0 !== t2[2] || t2.pop(), t2.join(".");
  }
  function ze(e2) {
    if ("string" == typeof e2) {
      var [t2, i2, n2, s2, r2, a2] = e2.trim().split(/[-: ]/g).map(Number), o2 = new Date(t2, i2 - 1, n2);
      return Number.isNaN(s2) || Number.isNaN(r2) || Number.isNaN(a2) || (o2.setHours(s2), o2.setMinutes(r2), o2.setSeconds(a2)), Number.isNaN(+o2) ? e2 : o2;
    }
  }
  function He(e2) {
    if ("string" == typeof e2)
      return e2;
    let t2 = [];
    if (0 === e2[1] && 0 === e2[e2.length - 1])
      for (let i2 = 0; i2 < e2.length; i2 += 2)
        t2.push(je(e2[i2 + 1], e2[i2]));
    else
      for (let i2 = 0; i2 < e2.length; i2 += 2)
        t2.push(je(e2[i2], e2[i2 + 1]));
    return m(String.fromCodePoint(...t2));
  }
  function je(e2, t2) {
    return e2 << 8 | t2;
  }
  Ee.set(41992, Ne), Ee.set(41993, Ne), Ee.set(41994, Ne), U(N, ["ifd0", "ifd1"], [[50827, function(e2) {
    return "string" != typeof e2 ? b(e2) : e2;
  }], [306, ze], [40091, He], [40092, He], [40093, He], [40094, He], [40095, He]]), U(N, "exif", [[40960, Ve], [36864, Ve], [36867, ze], [36868, ze], [40962, Ge], [40963, Ge]]), U(N, "gps", [[0, (e2) => Array.from(e2).join(".")], [7, (e2) => Array.from(e2).join(":")]]);
  class We extends re {
    static canHandle(e2, t2) {
      return 225 === e2.getUint8(t2 + 1) && 1752462448 === e2.getUint32(t2 + 4) && "http://ns.adobe.com/" === e2.getString(t2 + 4, "http://ns.adobe.com/".length);
    }
    static headerLength(e2, t2) {
      return "http://ns.adobe.com/xmp/extension/" === e2.getString(t2 + 4, "http://ns.adobe.com/xmp/extension/".length) ? 79 : 4 + "http://ns.adobe.com/xap/1.0/".length + 1;
    }
    static findPosition(e2, t2) {
      let i2 = super.findPosition(e2, t2);
      return i2.multiSegment = i2.extended = 79 === i2.headerLength, i2.multiSegment ? (i2.chunkCount = e2.getUint8(t2 + 72), i2.chunkNumber = e2.getUint8(t2 + 76), 0 !== e2.getUint8(t2 + 77) && i2.chunkNumber++) : (i2.chunkCount = 1 / 0, i2.chunkNumber = -1), i2;
    }
    static handleMultiSegments(e2) {
      return e2.map((e3) => e3.chunk.getString()).join("");
    }
    normalizeInput(e2) {
      return "string" == typeof e2 ? e2 : I.from(e2).getString();
    }
    parse(e2 = this.chunk) {
      if (!this.localOptions.parse)
        return e2;
      e2 = function(e3) {
        let t3 = {}, i3 = {};
        for (let e4 of Ze)
          t3[e4] = [], i3[e4] = 0;
        return e3.replace(et, (e4, n3, s2) => {
          if ("<" === n3) {
            let n4 = ++i3[s2];
            return t3[s2].push(n4), `${e4}#${n4}`;
          }
          return `${e4}#${t3[s2].pop()}`;
        });
      }(e2);
      let t2 = Xe.findAll(e2, "rdf", "Description");
      0 === t2.length && t2.push(new Xe("rdf", "Description", void 0, e2));
      let i2, n2 = {};
      for (let e3 of t2)
        for (let t3 of e3.properties)
          i2 = Je(t3.ns, n2), _e(t3, i2);
      return function(e3) {
        let t3;
        for (let i3 in e3)
          t3 = e3[i3] = f(e3[i3]), void 0 === t3 && delete e3[i3];
        return f(e3);
      }(n2);
    }
    assignToOutput(e2, t2) {
      if (this.localOptions.parse)
        for (let [i2, n2] of Object.entries(t2))
          switch (i2) {
            case "tiff":
              this.assignObjectToOutput(e2, "ifd0", n2);
              break;
            case "exif":
              this.assignObjectToOutput(e2, "exif", n2);
              break;
            case "xmlns":
              break;
            default:
              this.assignObjectToOutput(e2, i2, n2);
          }
      else
        e2.xmp = t2;
    }
  }
  c(We, "type", "xmp"), c(We, "multiSegment", true), T.set("xmp", We);
  class Ke {
    static findAll(e2) {
      return qe(e2, /([a-zA-Z0-9-]+):([a-zA-Z0-9-]+)=("[^"]*"|'[^']*')/gm).map(Ke.unpackMatch);
    }
    static unpackMatch(e2) {
      let t2 = e2[1], i2 = e2[2], n2 = e2[3].slice(1, -1);
      return n2 = Qe(n2), new Ke(t2, i2, n2);
    }
    constructor(e2, t2, i2) {
      this.ns = e2, this.name = t2, this.value = i2;
    }
    serialize() {
      return this.value;
    }
  }
  class Xe {
    static findAll(e2, t2, i2) {
      if (void 0 !== t2 || void 0 !== i2) {
        t2 = t2 || "[\\w\\d-]+", i2 = i2 || "[\\w\\d-]+";
        var n2 = new RegExp(`<(${t2}):(${i2})(#\\d+)?((\\s+?[\\w\\d-:]+=("[^"]*"|'[^']*'))*\\s*)(\\/>|>([\\s\\S]*?)<\\/\\1:\\2\\3>)`, "gm");
      } else
        n2 = /<([\w\d-]+):([\w\d-]+)(#\d+)?((\s+?[\w\d-:]+=("[^"]*"|'[^']*'))*\s*)(\/>|>([\s\S]*?)<\/\1:\2\3>)/gm;
      return qe(e2, n2).map(Xe.unpackMatch);
    }
    static unpackMatch(e2) {
      let t2 = e2[1], i2 = e2[2], n2 = e2[4], s2 = e2[8];
      return new Xe(t2, i2, n2, s2);
    }
    constructor(e2, t2, i2, n2) {
      this.ns = e2, this.name = t2, this.attrString = i2, this.innerXml = n2, this.attrs = Ke.findAll(i2), this.children = Xe.findAll(n2), this.value = 0 === this.children.length ? Qe(n2) : void 0, this.properties = [...this.attrs, ...this.children];
    }
    get isPrimitive() {
      return void 0 !== this.value && 0 === this.attrs.length && 0 === this.children.length;
    }
    get isListContainer() {
      return 1 === this.children.length && this.children[0].isList;
    }
    get isList() {
      let { ns: e2, name: t2 } = this;
      return "rdf" === e2 && ("Seq" === t2 || "Bag" === t2 || "Alt" === t2);
    }
    get isListItem() {
      return "rdf" === this.ns && "li" === this.name;
    }
    serialize() {
      if (0 === this.properties.length && void 0 === this.value)
        return;
      if (this.isPrimitive)
        return this.value;
      if (this.isListContainer)
        return this.children[0].serialize();
      if (this.isList)
        return $e(this.children.map(Ye));
      if (this.isListItem && 1 === this.children.length && 0 === this.attrs.length)
        return this.children[0].serialize();
      let e2 = {};
      for (let t2 of this.properties)
        _e(t2, e2);
      return void 0 !== this.value && (e2.value = this.value), f(e2);
    }
  }
  function _e(e2, t2) {
    let i2 = e2.serialize();
    void 0 !== i2 && (t2[e2.name] = i2);
  }
  var Ye = (e2) => e2.serialize(), $e = (e2) => 1 === e2.length ? e2[0] : e2, Je = (e2, t2) => t2[e2] ? t2[e2] : t2[e2] = {};
  function qe(e2, t2) {
    let i2, n2 = [];
    if (!e2)
      return n2;
    for (; null !== (i2 = t2.exec(e2)); )
      n2.push(i2);
    return n2;
  }
  function Qe(e2) {
    if (function(e3) {
      return null == e3 || "null" === e3 || "undefined" === e3 || "" === e3 || "" === e3.trim();
    }(e2))
      return;
    let t2 = Number(e2);
    if (!Number.isNaN(t2))
      return t2;
    let i2 = e2.toLowerCase();
    return "true" === i2 || "false" !== i2 && e2.trim();
  }
  const Ze = ["rdf:li", "rdf:Seq", "rdf:Bag", "rdf:Alt", "rdf:Description"], et = new RegExp(`(<|\\/)(${Ze.join("|")})`, "g");
  var tt = Object.freeze({ __proto__: null, default: Me, Exifr: te, fileParsers: w, segmentParsers: T, fileReaders: A, tagKeys: E, tagValues: B, tagRevivers: N, createDictionary: U, extendDictionary: F, fetchUrlAsArrayBuffer: M, readBlobAsArrayBuffer: R, chunkedProps: G, otherSegments: V, segments: z, tiffBlocks: H, segmentsAndBlocks: j, tiffExtractables: W, inheritables: K, allFormatters: X, Options: q, parse: ie, gpsOnlyOptions: me, gps: Se, thumbnailOnlyOptions: Ce, thumbnail: ye, thumbnailUrl: be, orientationOnlyOptions: Ie, orientation: Pe, rotations: ke, get rotateCanvas() {
    return we;
  }, get rotateCss() {
    return Te;
  }, rotation: Ae });
  const it = ["xmp", "icc", "iptc", "tiff"], nt = () => {
  };
  async function st(e2, t2, i2) {
    let n2 = new q(t2);
    n2.chunked = false, void 0 === i2 && "string" == typeof e2 && (i2 = function(e3) {
      let t3 = e3.toLowerCase().split(".").pop();
      if (function(e4) {
        return "exif" === e4 || "tiff" === e4 || "tif" === e4;
      }(t3))
        return "tiff";
      if (it.includes(t3))
        return t3;
    }(e2));
    let s2 = await D(e2, n2);
    if (i2) {
      if (it.includes(i2))
        return rt(i2, s2, n2);
      g("Invalid segment type");
    } else {
      if (function(e3) {
        let t3 = e3.getString(0, 50).trim();
        return t3.includes("<?xpacket") || t3.includes("<x:");
      }(s2))
        return rt("xmp", s2, n2);
      for (let [e3] of T) {
        if (!it.includes(e3))
          continue;
        let t3 = await rt(e3, s2, n2).catch(nt);
        if (t3)
          return t3;
      }
      g("Unknown file format");
    }
  }
  async function rt(e2, t2, i2) {
    let n2 = i2[e2];
    return n2.enabled = true, n2.parse = true, T.get(e2).parse(t2, n2);
  }
  let at = l("fs", (e2) => e2.promises);
  A.set("fs", class extends ve {
    async readWhole() {
      this.chunked = false, this.fs = await at;
      let e2 = await this.fs.readFile(this.input);
      this._swapBuffer(e2);
    }
    async readChunked() {
      this.chunked = true, this.fs = await at, await this.open(), await this.readChunk(0, this.options.firstChunkSize);
    }
    async open() {
      void 0 === this.fh && (this.fh = await this.fs.open(this.input, "r"), this.size = (await this.fh.stat(this.input)).size);
    }
    async _readChunk(e2, t2) {
      void 0 === this.fh && await this.open(), e2 + t2 > this.size && (t2 = this.size - e2);
      var i2 = this.subarray(e2, t2, true);
      return await this.fh.read(i2.dataView, 0, t2, e2), i2;
    }
    async close() {
      if (this.fh) {
        let e2 = this.fh;
        this.fh = void 0, await e2.close();
      }
    }
  });
  A.set("base64", class extends ve {
    constructor(...e2) {
      super(...e2), this.input = this.input.replace(/^data:([^;]+);base64,/gim, ""), this.size = this.input.length / 4 * 3, this.input.endsWith("==") ? this.size -= 2 : this.input.endsWith("=") && (this.size -= 1);
    }
    async _readChunk(e2, t2) {
      let i2, n2, r2 = this.input;
      void 0 === e2 ? (e2 = 0, i2 = 0, n2 = 0) : (i2 = 4 * Math.floor(e2 / 3), n2 = e2 - i2 / 4 * 3), void 0 === t2 && (t2 = this.size);
      let o2 = e2 + t2, l2 = i2 + 4 * Math.ceil(o2 / 3);
      r2 = r2.slice(i2, l2);
      let h2 = Math.min(t2, this.size - e2);
      if (a) {
        let t3 = s.from(r2, "base64").slice(n2, n2 + h2);
        return this.set(t3, e2, true);
      }
      {
        let t3 = this.subarray(e2, h2, true), i3 = atob(r2), s2 = t3.toUint8();
        for (let e3 = 0; e3 < h2; e3++)
          s2[e3] = i3.charCodeAt(n2 + e3);
        return t3;
      }
    }
  });
  class ot extends se {
    static canHandle(e2, t2) {
      return 18761 === t2 || 19789 === t2;
    }
    extendOptions(e2) {
      let { ifd0: t2, xmp: i2, iptc: n2, icc: s2 } = e2;
      i2.enabled && t2.deps.add(700), n2.enabled && t2.deps.add(33723), s2.enabled && t2.deps.add(34675), t2.finalizeFilters();
    }
    async parse() {
      let { tiff: e2, xmp: t2, iptc: i2, icc: n2 } = this.options;
      if (e2.enabled || t2.enabled || i2.enabled || n2.enabled) {
        let e3 = Math.max(S(this.options), this.options.chunkSize);
        await this.file.ensureChunk(0, e3), this.createParser("tiff", this.file), this.parsers.tiff.parseHeader(), await this.parsers.tiff.parseIfd0Block(), this.adaptTiffPropAsSegment("xmp"), this.adaptTiffPropAsSegment("iptc"), this.adaptTiffPropAsSegment("icc");
      }
    }
    adaptTiffPropAsSegment(e2) {
      if (this.parsers.tiff[e2]) {
        let t2 = this.parsers.tiff[e2];
        this.injectSegment(e2, t2);
      }
    }
  }
  c(ot, "type", "tiff"), w.set("tiff", ot);
  let lt = l("zlib");
  const ht = ["ihdr", "iccp", "text", "itxt", "exif"];
  class ut extends se {
    constructor(...e2) {
      super(...e2), c(this, "catchError", (e3) => this.errors.push(e3)), c(this, "metaChunks", []), c(this, "unknownChunks", []);
    }
    static canHandle(e2, t2) {
      return 35152 === t2 && 2303741511 === e2.getUint32(0) && 218765834 === e2.getUint32(4);
    }
    async parse() {
      let { file: e2 } = this;
      await this.findPngChunksInRange("PNG\r\n\n".length, e2.byteLength), await this.readSegments(this.metaChunks), this.findIhdr(), this.parseTextChunks(), await this.findExif().catch(this.catchError), await this.findXmp().catch(this.catchError), await this.findIcc().catch(this.catchError);
    }
    async findPngChunksInRange(e2, t2) {
      let { file: i2 } = this;
      for (; e2 < t2; ) {
        let t3 = i2.getUint32(e2), n2 = i2.getUint32(e2 + 4), s2 = i2.getString(e2 + 4, 4).toLowerCase(), r2 = t3 + 4 + 4 + 4, a2 = { type: s2, offset: e2, length: r2, start: e2 + 4 + 4, size: t3, marker: n2 };
        ht.includes(s2) ? this.metaChunks.push(a2) : this.unknownChunks.push(a2), e2 += r2;
      }
    }
    parseTextChunks() {
      let e2 = this.metaChunks.filter((e3) => "text" === e3.type);
      for (let t2 of e2) {
        let [e3, i2] = this.file.getString(t2.start, t2.size).split("\0");
        this.injectKeyValToIhdr(e3, i2);
      }
    }
    injectKeyValToIhdr(e2, t2) {
      let i2 = this.parsers.ihdr;
      i2 && i2.raw.set(e2, t2);
    }
    findIhdr() {
      let e2 = this.metaChunks.find((e3) => "ihdr" === e3.type);
      e2 && false !== this.options.ihdr.enabled && this.createParser("ihdr", e2.chunk);
    }
    async findExif() {
      let e2 = this.metaChunks.find((e3) => "exif" === e3.type);
      e2 && this.injectSegment("tiff", e2.chunk);
    }
    async findXmp() {
      let e2 = this.metaChunks.filter((e3) => "itxt" === e3.type);
      for (let t2 of e2) {
        "XML:com.adobe.xmp" === t2.chunk.getString(0, "XML:com.adobe.xmp".length) && this.injectSegment("xmp", t2.chunk);
      }
    }
    async findIcc() {
      let e2 = this.metaChunks.find((e3) => "iccp" === e3.type);
      if (!e2)
        return;
      let { chunk: t2 } = e2, i2 = t2.getUint8Array(0, 81), s2 = 0;
      for (; s2 < 80 && 0 !== i2[s2]; )
        s2++;
      let r2 = s2 + 2, a2 = t2.getString(0, s2);
      if (this.injectKeyValToIhdr("ProfileName", a2), n) {
        let e3 = await lt, i3 = t2.getUint8Array(r2);
        i3 = e3.inflateSync(i3), this.injectSegment("icc", i3);
      }
    }
  }
  c(ut, "type", "png"), w.set("png", ut), U(E, "interop", [[1, "InteropIndex"], [2, "InteropVersion"], [4096, "RelatedImageFileFormat"], [4097, "RelatedImageWidth"], [4098, "RelatedImageHeight"]]), F(E, "ifd0", [[11, "ProcessingSoftware"], [254, "SubfileType"], [255, "OldSubfileType"], [263, "Thresholding"], [264, "CellWidth"], [265, "CellLength"], [266, "FillOrder"], [269, "DocumentName"], [280, "MinSampleValue"], [281, "MaxSampleValue"], [285, "PageName"], [286, "XPosition"], [287, "YPosition"], [290, "GrayResponseUnit"], [297, "PageNumber"], [321, "HalftoneHints"], [322, "TileWidth"], [323, "TileLength"], [332, "InkSet"], [337, "TargetPrinter"], [18246, "Rating"], [18249, "RatingPercent"], [33550, "PixelScale"], [34264, "ModelTransform"], [34377, "PhotoshopSettings"], [50706, "DNGVersion"], [50707, "DNGBackwardVersion"], [50708, "UniqueCameraModel"], [50709, "LocalizedCameraModel"], [50736, "DNGLensInfo"], [50739, "ShadowScale"], [50740, "DNGPrivateData"], [33920, "IntergraphMatrix"], [33922, "ModelTiePoint"], [34118, "SEMInfo"], [34735, "GeoTiffDirectory"], [34736, "GeoTiffDoubleParams"], [34737, "GeoTiffAsciiParams"], [50341, "PrintIM"], [50721, "ColorMatrix1"], [50722, "ColorMatrix2"], [50723, "CameraCalibration1"], [50724, "CameraCalibration2"], [50725, "ReductionMatrix1"], [50726, "ReductionMatrix2"], [50727, "AnalogBalance"], [50728, "AsShotNeutral"], [50729, "AsShotWhiteXY"], [50730, "BaselineExposure"], [50731, "BaselineNoise"], [50732, "BaselineSharpness"], [50734, "LinearResponseLimit"], [50735, "CameraSerialNumber"], [50741, "MakerNoteSafety"], [50778, "CalibrationIlluminant1"], [50779, "CalibrationIlluminant2"], [50781, "RawDataUniqueID"], [50827, "OriginalRawFileName"], [50828, "OriginalRawFileData"], [50831, "AsShotICCProfile"], [50832, "AsShotPreProfileMatrix"], [50833, "CurrentICCProfile"], [50834, "CurrentPreProfileMatrix"], [50879, "ColorimetricReference"], [50885, "SRawType"], [50898, "PanasonicTitle"], [50899, "PanasonicTitle2"], [50931, "CameraCalibrationSig"], [50932, "ProfileCalibrationSig"], [50933, "ProfileIFD"], [50934, "AsShotProfileName"], [50936, "ProfileName"], [50937, "ProfileHueSatMapDims"], [50938, "ProfileHueSatMapData1"], [50939, "ProfileHueSatMapData2"], [50940, "ProfileToneCurve"], [50941, "ProfileEmbedPolicy"], [50942, "ProfileCopyright"], [50964, "ForwardMatrix1"], [50965, "ForwardMatrix2"], [50966, "PreviewApplicationName"], [50967, "PreviewApplicationVersion"], [50968, "PreviewSettingsName"], [50969, "PreviewSettingsDigest"], [50970, "PreviewColorSpace"], [50971, "PreviewDateTime"], [50972, "RawImageDigest"], [50973, "OriginalRawFileDigest"], [50981, "ProfileLookTableDims"], [50982, "ProfileLookTableData"], [51043, "TimeCodes"], [51044, "FrameRate"], [51058, "TStop"], [51081, "ReelName"], [51089, "OriginalDefaultFinalSize"], [51090, "OriginalBestQualitySize"], [51091, "OriginalDefaultCropSize"], [51105, "CameraLabel"], [51107, "ProfileHueSatMapEncoding"], [51108, "ProfileLookTableEncoding"], [51109, "BaselineExposureOffset"], [51110, "DefaultBlackRender"], [51111, "NewRawImageDigest"], [51112, "RawToPreviewGain"]]);
  let ct = [[273, "StripOffsets"], [279, "StripByteCounts"], [288, "FreeOffsets"], [289, "FreeByteCounts"], [291, "GrayResponseCurve"], [292, "T4Options"], [293, "T6Options"], [300, "ColorResponseUnit"], [320, "ColorMap"], [324, "TileOffsets"], [325, "TileByteCounts"], [326, "BadFaxLines"], [327, "CleanFaxData"], [328, "ConsecutiveBadFaxLines"], [330, "SubIFD"], [333, "InkNames"], [334, "NumberofInks"], [336, "DotRange"], [338, "ExtraSamples"], [339, "SampleFormat"], [340, "SMinSampleValue"], [341, "SMaxSampleValue"], [342, "TransferRange"], [343, "ClipPath"], [344, "XClipPathUnits"], [345, "YClipPathUnits"], [346, "Indexed"], [347, "JPEGTables"], [351, "OPIProxy"], [400, "GlobalParametersIFD"], [401, "ProfileType"], [402, "FaxProfile"], [403, "CodingMethods"], [404, "VersionYear"], [405, "ModeNumber"], [433, "Decode"], [434, "DefaultImageColor"], [435, "T82Options"], [437, "JPEGTables"], [512, "JPEGProc"], [515, "JPEGRestartInterval"], [517, "JPEGLosslessPredictors"], [518, "JPEGPointTransforms"], [519, "JPEGQTables"], [520, "JPEGDCTables"], [521, "JPEGACTables"], [559, "StripRowCounts"], [999, "USPTOMiscellaneous"], [18247, "XP_DIP_XML"], [18248, "StitchInfo"], [28672, "SonyRawFileType"], [28688, "SonyToneCurve"], [28721, "VignettingCorrection"], [28722, "VignettingCorrParams"], [28724, "ChromaticAberrationCorrection"], [28725, "ChromaticAberrationCorrParams"], [28726, "DistortionCorrection"], [28727, "DistortionCorrParams"], [29895, "SonyCropTopLeft"], [29896, "SonyCropSize"], [32781, "ImageID"], [32931, "WangTag1"], [32932, "WangAnnotation"], [32933, "WangTag3"], [32934, "WangTag4"], [32953, "ImageReferencePoints"], [32954, "RegionXformTackPoint"], [32955, "WarpQuadrilateral"], [32956, "AffineTransformMat"], [32995, "Matteing"], [32996, "DataType"], [32997, "ImageDepth"], [32998, "TileDepth"], [33300, "ImageFullWidth"], [33301, "ImageFullHeight"], [33302, "TextureFormat"], [33303, "WrapModes"], [33304, "FovCot"], [33305, "MatrixWorldToScreen"], [33306, "MatrixWorldToCamera"], [33405, "Model2"], [33421, "CFARepeatPatternDim"], [33422, "CFAPattern2"], [33423, "BatteryLevel"], [33424, "KodakIFD"], [33445, "MDFileTag"], [33446, "MDScalePixel"], [33447, "MDColorTable"], [33448, "MDLabName"], [33449, "MDSampleInfo"], [33450, "MDPrepDate"], [33451, "MDPrepTime"], [33452, "MDFileUnits"], [33589, "AdventScale"], [33590, "AdventRevision"], [33628, "UIC1Tag"], [33629, "UIC2Tag"], [33630, "UIC3Tag"], [33631, "UIC4Tag"], [33918, "IntergraphPacketData"], [33919, "IntergraphFlagRegisters"], [33921, "INGRReserved"], [34016, "Site"], [34017, "ColorSequence"], [34018, "IT8Header"], [34019, "RasterPadding"], [34020, "BitsPerRunLength"], [34021, "BitsPerExtendedRunLength"], [34022, "ColorTable"], [34023, "ImageColorIndicator"], [34024, "BackgroundColorIndicator"], [34025, "ImageColorValue"], [34026, "BackgroundColorValue"], [34027, "PixelIntensityRange"], [34028, "TransparencyIndicator"], [34029, "ColorCharacterization"], [34030, "HCUsage"], [34031, "TrapIndicator"], [34032, "CMYKEquivalent"], [34152, "AFCP_IPTC"], [34232, "PixelMagicJBIGOptions"], [34263, "JPLCartoIFD"], [34306, "WB_GRGBLevels"], [34310, "LeafData"], [34687, "TIFF_FXExtensions"], [34688, "MultiProfiles"], [34689, "SharedData"], [34690, "T88Options"], [34732, "ImageLayer"], [34750, "JBIGOptions"], [34856, "Opto-ElectricConvFactor"], [34857, "Interlace"], [34908, "FaxRecvParams"], [34909, "FaxSubAddress"], [34910, "FaxRecvTime"], [34929, "FedexEDR"], [34954, "LeafSubIFD"], [37387, "FlashEnergy"], [37388, "SpatialFrequencyResponse"], [37389, "Noise"], [37390, "FocalPlaneXResolution"], [37391, "FocalPlaneYResolution"], [37392, "FocalPlaneResolutionUnit"], [37397, "ExposureIndex"], [37398, "TIFF-EPStandardID"], [37399, "SensingMethod"], [37434, "CIP3DataFile"], [37435, "CIP3Sheet"], [37436, "CIP3Side"], [37439, "StoNits"], [37679, "MSDocumentText"], [37680, "MSPropertySetStorage"], [37681, "MSDocumentTextPosition"], [37724, "ImageSourceData"], [40965, "InteropIFD"], [40976, "SamsungRawPointersOffset"], [40977, "SamsungRawPointersLength"], [41217, "SamsungRawByteOrder"], [41218, "SamsungRawUnknown"], [41484, "SpatialFrequencyResponse"], [41485, "Noise"], [41489, "ImageNumber"], [41490, "SecurityClassification"], [41491, "ImageHistory"], [41494, "TIFF-EPStandardID"], [41995, "DeviceSettingDescription"], [42112, "GDALMetadata"], [42113, "GDALNoData"], [44992, "ExpandSoftware"], [44993, "ExpandLens"], [44994, "ExpandFilm"], [44995, "ExpandFilterLens"], [44996, "ExpandScanner"], [44997, "ExpandFlashLamp"], [46275, "HasselbladRawImage"], [48129, "PixelFormat"], [48130, "Transformation"], [48131, "Uncompressed"], [48132, "ImageType"], [48256, "ImageWidth"], [48257, "ImageHeight"], [48258, "WidthResolution"], [48259, "HeightResolution"], [48320, "ImageOffset"], [48321, "ImageByteCount"], [48322, "AlphaOffset"], [48323, "AlphaByteCount"], [48324, "ImageDataDiscard"], [48325, "AlphaDataDiscard"], [50215, "OceScanjobDesc"], [50216, "OceApplicationSelector"], [50217, "OceIDNumber"], [50218, "OceImageLogic"], [50255, "Annotations"], [50459, "HasselbladExif"], [50547, "OriginalFileName"], [50560, "USPTOOriginalContentType"], [50656, "CR2CFAPattern"], [50710, "CFAPlaneColor"], [50711, "CFALayout"], [50712, "LinearizationTable"], [50713, "BlackLevelRepeatDim"], [50714, "BlackLevel"], [50715, "BlackLevelDeltaH"], [50716, "BlackLevelDeltaV"], [50717, "WhiteLevel"], [50718, "DefaultScale"], [50719, "DefaultCropOrigin"], [50720, "DefaultCropSize"], [50733, "BayerGreenSplit"], [50737, "ChromaBlurRadius"], [50738, "AntiAliasStrength"], [50752, "RawImageSegmentation"], [50780, "BestQualityScale"], [50784, "AliasLayerMetadata"], [50829, "ActiveArea"], [50830, "MaskedAreas"], [50935, "NoiseReductionApplied"], [50974, "SubTileBlockSize"], [50975, "RowInterleaveFactor"], [51008, "OpcodeList1"], [51009, "OpcodeList2"], [51022, "OpcodeList3"], [51041, "NoiseProfile"], [51114, "CacheVersion"], [51125, "DefaultUserCrop"], [51157, "NikonNEFInfo"], [65024, "KdcIFD"]];
  F(E, "ifd0", ct), F(E, "exif", ct), U(B, "gps", [[23, { M: "Magnetic North", T: "True North" }], [25, { K: "Kilometers", M: "Miles", N: "Nautical Miles" }]]);
  class ft extends re {
    static canHandle(e2, t2) {
      return 224 === e2.getUint8(t2 + 1) && 1246120262 === e2.getUint32(t2 + 4) && 0 === e2.getUint8(t2 + 8);
    }
    parse() {
      return this.parseTags(), this.translate(), this.output;
    }
    parseTags() {
      this.raw = /* @__PURE__ */ new Map([[0, this.chunk.getUint16(0)], [2, this.chunk.getUint8(2)], [3, this.chunk.getUint16(3)], [5, this.chunk.getUint16(5)], [7, this.chunk.getUint8(7)], [8, this.chunk.getUint8(8)]]);
    }
  }
  c(ft, "type", "jfif"), c(ft, "headerLength", 9), T.set("jfif", ft), U(E, "jfif", [[0, "JFIFVersion"], [2, "ResolutionUnit"], [3, "XResolution"], [5, "YResolution"], [7, "ThumbnailWidth"], [8, "ThumbnailHeight"]]);
  class dt extends re {
    parse() {
      return this.parseTags(), this.translate(), this.output;
    }
    parseTags() {
      this.raw = new Map([[0, this.chunk.getUint32(0)], [4, this.chunk.getUint32(4)], [8, this.chunk.getUint8(8)], [9, this.chunk.getUint8(9)], [10, this.chunk.getUint8(10)], [11, this.chunk.getUint8(11)], [12, this.chunk.getUint8(12)], ...Array.from(this.raw)]);
    }
  }
  c(dt, "type", "ihdr"), T.set("ihdr", dt), U(E, "ihdr", [[0, "ImageWidth"], [4, "ImageHeight"], [8, "BitDepth"], [9, "ColorType"], [10, "Compression"], [11, "Filter"], [12, "Interlace"]]), U(B, "ihdr", [[9, { 0: "Grayscale", 2: "RGB", 3: "Palette", 4: "Grayscale with Alpha", 6: "RGB with Alpha", DEFAULT: "Unknown" }], [10, { 0: "Deflate/Inflate", DEFAULT: "Unknown" }], [11, { 0: "Adaptive", DEFAULT: "Unknown" }], [12, { 0: "Noninterlaced", 1: "Adam7 Interlace", DEFAULT: "Unknown" }]]);
  class pt extends re {
    static canHandle(e2, t2) {
      return 226 === e2.getUint8(t2 + 1) && 1229144927 === e2.getUint32(t2 + 4);
    }
    static findPosition(e2, t2) {
      let i2 = super.findPosition(e2, t2);
      return i2.chunkNumber = e2.getUint8(t2 + 16), i2.chunkCount = e2.getUint8(t2 + 17), i2.multiSegment = i2.chunkCount > 1, i2;
    }
    static handleMultiSegments(e2) {
      return function(e3) {
        let t2 = function(e4) {
          let t3 = e4[0].constructor, i2 = 0;
          for (let t4 of e4)
            i2 += t4.length;
          let n2 = new t3(i2), s2 = 0;
          for (let t4 of e4)
            n2.set(t4, s2), s2 += t4.length;
          return n2;
        }(e3.map((e4) => e4.chunk.toUint8()));
        return new I(t2);
      }(e2);
    }
    parse() {
      return this.raw = /* @__PURE__ */ new Map(), this.parseHeader(), this.parseTags(), this.translate(), this.output;
    }
    parseHeader() {
      let { raw: e2 } = this;
      this.chunk.byteLength < 84 && g("ICC header is too short");
      for (let [t2, i2] of Object.entries(gt)) {
        t2 = parseInt(t2, 10);
        let n2 = i2(this.chunk, t2);
        "\0\0\0\0" !== n2 && e2.set(t2, n2);
      }
    }
    parseTags() {
      let e2, t2, i2, n2, s2, { raw: r2 } = this, a2 = this.chunk.getUint32(128), o2 = 132, l2 = this.chunk.byteLength;
      for (; a2--; ) {
        if (e2 = this.chunk.getString(o2, 4), t2 = this.chunk.getUint32(o2 + 4), i2 = this.chunk.getUint32(o2 + 8), n2 = this.chunk.getString(t2, 4), t2 + i2 > l2)
          return void console.warn("reached the end of the first ICC chunk. Enable options.tiff.multiSegment to read all ICC segments.");
        s2 = this.parseTag(n2, t2, i2), void 0 !== s2 && "\0\0\0\0" !== s2 && r2.set(e2, s2), o2 += 12;
      }
    }
    parseTag(e2, t2, i2) {
      switch (e2) {
        case "desc":
          return this.parseDesc(t2);
        case "mluc":
          return this.parseMluc(t2);
        case "text":
          return this.parseText(t2, i2);
        case "sig ":
          return this.parseSig(t2);
      }
      if (!(t2 + i2 > this.chunk.byteLength))
        return this.chunk.getUint8Array(t2, i2);
    }
    parseDesc(e2) {
      let t2 = this.chunk.getUint32(e2 + 8) - 1;
      return m(this.chunk.getString(e2 + 12, t2));
    }
    parseText(e2, t2) {
      return m(this.chunk.getString(e2 + 8, t2 - 8));
    }
    parseSig(e2) {
      return m(this.chunk.getString(e2 + 8, 4));
    }
    parseMluc(e2) {
      let { chunk: t2 } = this, i2 = t2.getUint32(e2 + 8), n2 = t2.getUint32(e2 + 12), s2 = e2 + 16, r2 = [];
      for (let a2 = 0; a2 < i2; a2++) {
        let i3 = t2.getString(s2 + 0, 2), a3 = t2.getString(s2 + 2, 2), o2 = t2.getUint32(s2 + 4), l2 = t2.getUint32(s2 + 8) + e2, h2 = m(t2.getUnicodeString(l2, o2));
        r2.push({ lang: i3, country: a3, text: h2 }), s2 += n2;
      }
      return 1 === i2 ? r2[0].text : r2;
    }
    translateValue(e2, t2) {
      return "string" == typeof e2 ? t2[e2] || t2[e2.toLowerCase()] || e2 : t2[e2] || e2;
    }
  }
  c(pt, "type", "icc"), c(pt, "multiSegment", true), c(pt, "headerLength", 18);
  const gt = { 4: mt, 8: function(e2, t2) {
    return [e2.getUint8(t2), e2.getUint8(t2 + 1) >> 4, e2.getUint8(t2 + 1) % 16].map((e3) => e3.toString(10)).join(".");
  }, 12: mt, 16: mt, 20: mt, 24: function(e2, t2) {
    const i2 = e2.getUint16(t2), n2 = e2.getUint16(t2 + 2) - 1, s2 = e2.getUint16(t2 + 4), r2 = e2.getUint16(t2 + 6), a2 = e2.getUint16(t2 + 8), o2 = e2.getUint16(t2 + 10);
    return new Date(Date.UTC(i2, n2, s2, r2, a2, o2));
  }, 36: mt, 40: mt, 48: mt, 52: mt, 64: (e2, t2) => e2.getUint32(t2), 80: mt };
  function mt(e2, t2) {
    return m(e2.getString(t2, 4));
  }
  T.set("icc", pt), U(E, "icc", [[4, "ProfileCMMType"], [8, "ProfileVersion"], [12, "ProfileClass"], [16, "ColorSpaceData"], [20, "ProfileConnectionSpace"], [24, "ProfileDateTime"], [36, "ProfileFileSignature"], [40, "PrimaryPlatform"], [44, "CMMFlags"], [48, "DeviceManufacturer"], [52, "DeviceModel"], [56, "DeviceAttributes"], [64, "RenderingIntent"], [68, "ConnectionSpaceIlluminant"], [80, "ProfileCreator"], [84, "ProfileID"], ["Header", "ProfileHeader"], ["MS00", "WCSProfiles"], ["bTRC", "BlueTRC"], ["bXYZ", "BlueMatrixColumn"], ["bfd", "UCRBG"], ["bkpt", "MediaBlackPoint"], ["calt", "CalibrationDateTime"], ["chad", "ChromaticAdaptation"], ["chrm", "Chromaticity"], ["ciis", "ColorimetricIntentImageState"], ["clot", "ColorantTableOut"], ["clro", "ColorantOrder"], ["clrt", "ColorantTable"], ["cprt", "ProfileCopyright"], ["crdi", "CRDInfo"], ["desc", "ProfileDescription"], ["devs", "DeviceSettings"], ["dmdd", "DeviceModelDesc"], ["dmnd", "DeviceMfgDesc"], ["dscm", "ProfileDescriptionML"], ["fpce", "FocalPlaneColorimetryEstimates"], ["gTRC", "GreenTRC"], ["gXYZ", "GreenMatrixColumn"], ["gamt", "Gamut"], ["kTRC", "GrayTRC"], ["lumi", "Luminance"], ["meas", "Measurement"], ["meta", "Metadata"], ["mmod", "MakeAndModel"], ["ncl2", "NamedColor2"], ["ncol", "NamedColor"], ["ndin", "NativeDisplayInfo"], ["pre0", "Preview0"], ["pre1", "Preview1"], ["pre2", "Preview2"], ["ps2i", "PS2RenderingIntent"], ["ps2s", "PostScript2CSA"], ["psd0", "PostScript2CRD0"], ["psd1", "PostScript2CRD1"], ["psd2", "PostScript2CRD2"], ["psd3", "PostScript2CRD3"], ["pseq", "ProfileSequenceDesc"], ["psid", "ProfileSequenceIdentifier"], ["psvm", "PS2CRDVMSize"], ["rTRC", "RedTRC"], ["rXYZ", "RedMatrixColumn"], ["resp", "OutputResponse"], ["rhoc", "ReflectionHardcopyOrigColorimetry"], ["rig0", "PerceptualRenderingIntentGamut"], ["rig2", "SaturationRenderingIntentGamut"], ["rpoc", "ReflectionPrintOutputColorimetry"], ["sape", "SceneAppearanceEstimates"], ["scoe", "SceneColorimetryEstimates"], ["scrd", "ScreeningDesc"], ["scrn", "Screening"], ["targ", "CharTarget"], ["tech", "Technology"], ["vcgt", "VideoCardGamma"], ["view", "ViewingConditions"], ["vued", "ViewingCondDesc"], ["wtpt", "MediaWhitePoint"]]);
  const St = { "4d2p": "Erdt Systems", AAMA: "Aamazing Technologies", ACER: "Acer", ACLT: "Acolyte Color Research", ACTI: "Actix Sytems", ADAR: "Adara Technology", ADBE: "Adobe", ADI: "ADI Systems", AGFA: "Agfa Graphics", ALMD: "Alps Electric", ALPS: "Alps Electric", ALWN: "Alwan Color Expertise", AMTI: "Amiable Technologies", AOC: "AOC International", APAG: "Apago", APPL: "Apple Computer", AST: "AST", "AT&T": "AT&T", BAEL: "BARBIERI electronic", BRCO: "Barco NV", BRKP: "Breakpoint", BROT: "Brother", BULL: "Bull", BUS: "Bus Computer Systems", "C-IT": "C-Itoh", CAMR: "Intel", CANO: "Canon", CARR: "Carroll Touch", CASI: "Casio", CBUS: "Colorbus PL", CEL: "Crossfield", CELx: "Crossfield", CGS: "CGS Publishing Technologies International", CHM: "Rochester Robotics", CIGL: "Colour Imaging Group, London", CITI: "Citizen", CL00: "Candela", CLIQ: "Color IQ", CMCO: "Chromaco", CMiX: "CHROMiX", COLO: "Colorgraphic Communications", COMP: "Compaq", COMp: "Compeq/Focus Technology", CONR: "Conrac Display Products", CORD: "Cordata Technologies", CPQ: "Compaq", CPRO: "ColorPro", CRN: "Cornerstone", CTX: "CTX International", CVIS: "ColorVision", CWC: "Fujitsu Laboratories", DARI: "Darius Technology", DATA: "Dataproducts", DCP: "Dry Creek Photo", DCRC: "Digital Contents Resource Center, Chung-Ang University", DELL: "Dell Computer", DIC: "Dainippon Ink and Chemicals", DICO: "Diconix", DIGI: "Digital", "DL&C": "Digital Light & Color", DPLG: "Doppelganger", DS: "Dainippon Screen", DSOL: "DOOSOL", DUPN: "DuPont", EPSO: "Epson", ESKO: "Esko-Graphics", ETRI: "Electronics and Telecommunications Research Institute", EVER: "Everex Systems", EXAC: "ExactCODE", Eizo: "Eizo", FALC: "Falco Data Products", FF: "Fuji Photo Film", FFEI: "FujiFilm Electronic Imaging", FNRD: "Fnord Software", FORA: "Fora", FORE: "Forefront Technology", FP: "Fujitsu", FPA: "WayTech Development", FUJI: "Fujitsu", FX: "Fuji Xerox", GCC: "GCC Technologies", GGSL: "Global Graphics Software", GMB: "Gretagmacbeth", GMG: "GMG", GOLD: "GoldStar Technology", GOOG: "Google", GPRT: "Giantprint", GTMB: "Gretagmacbeth", GVC: "WayTech Development", GW2K: "Sony", HCI: "HCI", HDM: "Heidelberger Druckmaschinen", HERM: "Hermes", HITA: "Hitachi America", HP: "Hewlett-Packard", HTC: "Hitachi", HiTi: "HiTi Digital", IBM: "IBM", IDNT: "Scitex", IEC: "Hewlett-Packard", IIYA: "Iiyama North America", IKEG: "Ikegami Electronics", IMAG: "Image Systems", IMI: "Ingram Micro", INTC: "Intel", INTL: "N/A (INTL)", INTR: "Intra Electronics", IOCO: "Iocomm International Technology", IPS: "InfoPrint Solutions Company", IRIS: "Scitex", ISL: "Ichikawa Soft Laboratory", ITNL: "N/A (ITNL)", IVM: "IVM", IWAT: "Iwatsu Electric", Idnt: "Scitex", Inca: "Inca Digital Printers", Iris: "Scitex", JPEG: "Joint Photographic Experts Group", JSFT: "Jetsoft Development", JVC: "JVC Information Products", KART: "Scitex", KFC: "KFC Computek Components", KLH: "KLH Computers", KMHD: "Konica Minolta", KNCA: "Konica", KODA: "Kodak", KYOC: "Kyocera", Kart: "Scitex", LCAG: "Leica", LCCD: "Leeds Colour", LDAK: "Left Dakota", LEAD: "Leading Technology", LEXM: "Lexmark International", LINK: "Link Computer", LINO: "Linotronic", LITE: "Lite-On", Leaf: "Leaf", Lino: "Linotronic", MAGC: "Mag Computronic", MAGI: "MAG Innovision", MANN: "Mannesmann", MICN: "Micron Technology", MICR: "Microtek", MICV: "Microvitec", MINO: "Minolta", MITS: "Mitsubishi Electronics America", MITs: "Mitsuba", MNLT: "Minolta", MODG: "Modgraph", MONI: "Monitronix", MONS: "Monaco Systems", MORS: "Morse Technology", MOTI: "Motive Systems", MSFT: "Microsoft", MUTO: "MUTOH INDUSTRIES", Mits: "Mitsubishi Electric", NANA: "NANAO", NEC: "NEC", NEXP: "NexPress Solutions", NISS: "Nissei Sangyo America", NKON: "Nikon", NONE: "none", OCE: "Oce Technologies", OCEC: "OceColor", OKI: "Oki", OKID: "Okidata", OKIP: "Okidata", OLIV: "Olivetti", OLYM: "Olympus", ONYX: "Onyx Graphics", OPTI: "Optiquest", PACK: "Packard Bell", PANA: "Matsushita Electric Industrial", PANT: "Pantone", PBN: "Packard Bell", PFU: "PFU", PHIL: "Philips Consumer Electronics", PNTX: "HOYA", POne: "Phase One A/S", PREM: "Premier Computer Innovations", PRIN: "Princeton Graphic Systems", PRIP: "Princeton Publishing Labs", QLUX: "Hong Kong", QMS: "QMS", QPCD: "QPcard AB", QUAD: "QuadLaser", QUME: "Qume", RADI: "Radius", RDDx: "Integrated Color Solutions", RDG: "Roland DG", REDM: "REDMS Group", RELI: "Relisys", RGMS: "Rolf Gierling Multitools", RICO: "Ricoh", RNLD: "Edmund Ronald", ROYA: "Royal", RPC: "Ricoh Printing Systems", RTL: "Royal Information Electronics", SAMP: "Sampo", SAMS: "Samsung", SANT: "Jaime Santana Pomares", SCIT: "Scitex", SCRN: "Dainippon Screen", SDP: "Scitex", SEC: "Samsung", SEIK: "Seiko Instruments", SEIk: "Seikosha", SGUY: "ScanGuy.com", SHAR: "Sharp Laboratories", SICC: "International Color Consortium", SONY: "Sony", SPCL: "SpectraCal", STAR: "Star", STC: "Sampo Technology", Scit: "Scitex", Sdp: "Scitex", Sony: "Sony", TALO: "Talon Technology", TAND: "Tandy", TATU: "Tatung", TAXA: "TAXAN America", TDS: "Tokyo Denshi Sekei", TECO: "TECO Information Systems", TEGR: "Tegra", TEKT: "Tektronix", TI: "Texas Instruments", TMKR: "TypeMaker", TOSB: "Toshiba", TOSH: "Toshiba", TOTK: "TOTOKU ELECTRIC", TRIU: "Triumph", TSBT: "Toshiba", TTX: "TTX Computer Products", TVM: "TVM Professional Monitor", TW: "TW Casper", ULSX: "Ulead Systems", UNIS: "Unisys", UTZF: "Utz Fehlau & Sohn", VARI: "Varityper", VIEW: "Viewsonic", VISL: "Visual communication", VIVO: "Vivo Mobile Communication", WANG: "Wang", WLBR: "Wilbur Imaging", WTG2: "Ware To Go", WYSE: "WYSE Technology", XERX: "Xerox", XRIT: "X-Rite", ZRAN: "Zoran", Zebr: "Zebra Technologies", appl: "Apple Computer", bICC: "basICColor", berg: "bergdesign", ceyd: "Integrated Color Solutions", clsp: "MacDermid ColorSpan", ds: "Dainippon Screen", dupn: "DuPont", ffei: "FujiFilm Electronic Imaging", flux: "FluxData", iris: "Scitex", kart: "Scitex", lcms: "Little CMS", lino: "Linotronic", none: "none", ob4d: "Erdt Systems", obic: "Medigraph", quby: "Qubyx Sarl", scit: "Scitex", scrn: "Dainippon Screen", sdp: "Scitex", siwi: "SIWI GRAFIKA", yxym: "YxyMaster" }, Ct = { scnr: "Scanner", mntr: "Monitor", prtr: "Printer", link: "Device Link", abst: "Abstract", spac: "Color Space Conversion Profile", nmcl: "Named Color", cenc: "ColorEncodingSpace profile", mid: "MultiplexIdentification profile", mlnk: "MultiplexLink profile", mvis: "MultiplexVisualization profile", nkpf: "Nikon Input Device Profile (NON-STANDARD!)" };
  U(B, "icc", [[4, St], [12, Ct], [40, Object.assign({}, St, Ct)], [48, St], [80, St], [64, { 0: "Perceptual", 1: "Relative Colorimetric", 2: "Saturation", 3: "Absolute Colorimetric" }], ["tech", { amd: "Active Matrix Display", crt: "Cathode Ray Tube Display", kpcd: "Photo CD", pmd: "Passive Matrix Display", dcam: "Digital Camera", dcpj: "Digital Cinema Projector", dmpc: "Digital Motion Picture Camera", dsub: "Dye Sublimation Printer", epho: "Electrophotographic Printer", esta: "Electrostatic Printer", flex: "Flexography", fprn: "Film Writer", fscn: "Film Scanner", grav: "Gravure", ijet: "Ink Jet Printer", imgs: "Photo Image Setter", mpfr: "Motion Picture Film Recorder", mpfs: "Motion Picture Film Scanner", offs: "Offset Lithography", pjtv: "Projection Television", rpho: "Photographic Paper Printer", rscn: "Reflective Scanner", silk: "Silkscreen", twax: "Thermal Wax Printer", vidc: "Video Camera", vidm: "Video Monitor" }]]);
  class yt extends re {
    static canHandle(e2, t2, i2) {
      return 237 === e2.getUint8(t2 + 1) && "Photoshop" === e2.getString(t2 + 4, 9) && void 0 !== this.containsIptc8bim(e2, t2, i2);
    }
    static headerLength(e2, t2, i2) {
      let n2, s2 = this.containsIptc8bim(e2, t2, i2);
      if (void 0 !== s2)
        return n2 = e2.getUint8(t2 + s2 + 7), n2 % 2 != 0 && (n2 += 1), 0 === n2 && (n2 = 4), s2 + 8 + n2;
    }
    static containsIptc8bim(e2, t2, i2) {
      for (let n2 = 0; n2 < i2; n2++)
        if (this.isIptcSegmentHead(e2, t2 + n2))
          return n2;
    }
    static isIptcSegmentHead(e2, t2) {
      return 56 === e2.getUint8(t2) && 943868237 === e2.getUint32(t2) && 1028 === e2.getUint16(t2 + 4);
    }
    parse() {
      let { raw: e2 } = this, t2 = this.chunk.byteLength - 1, i2 = false;
      for (let n2 = 0; n2 < t2; n2++)
        if (28 === this.chunk.getUint8(n2) && 2 === this.chunk.getUint8(n2 + 1)) {
          i2 = true;
          let t3 = this.chunk.getUint16(n2 + 3), s2 = this.chunk.getUint8(n2 + 2), r2 = this.chunk.getLatin1String(n2 + 5, t3);
          e2.set(s2, this.pluralizeValue(e2.get(s2), r2)), n2 += 4 + t3;
        } else if (i2)
          break;
      return this.translate(), this.output;
    }
    pluralizeValue(e2, t2) {
      return void 0 !== e2 ? e2 instanceof Array ? (e2.push(t2), e2) : [e2, t2] : t2;
    }
  }
  c(yt, "type", "iptc"), c(yt, "translateValues", false), c(yt, "reviveValues", false), T.set("iptc", yt), U(E, "iptc", [[0, "ApplicationRecordVersion"], [3, "ObjectTypeReference"], [4, "ObjectAttributeReference"], [5, "ObjectName"], [7, "EditStatus"], [8, "EditorialUpdate"], [10, "Urgency"], [12, "SubjectReference"], [15, "Category"], [20, "SupplementalCategories"], [22, "FixtureIdentifier"], [25, "Keywords"], [26, "ContentLocationCode"], [27, "ContentLocationName"], [30, "ReleaseDate"], [35, "ReleaseTime"], [37, "ExpirationDate"], [38, "ExpirationTime"], [40, "SpecialInstructions"], [42, "ActionAdvised"], [45, "ReferenceService"], [47, "ReferenceDate"], [50, "ReferenceNumber"], [55, "DateCreated"], [60, "TimeCreated"], [62, "DigitalCreationDate"], [63, "DigitalCreationTime"], [65, "OriginatingProgram"], [70, "ProgramVersion"], [75, "ObjectCycle"], [80, "Byline"], [85, "BylineTitle"], [90, "City"], [92, "Sublocation"], [95, "State"], [100, "CountryCode"], [101, "Country"], [103, "OriginalTransmissionReference"], [105, "Headline"], [110, "Credit"], [115, "Source"], [116, "CopyrightNotice"], [118, "Contact"], [120, "Caption"], [121, "LocalCaption"], [122, "Writer"], [125, "RasterizedCaption"], [130, "ImageType"], [131, "ImageOrientation"], [135, "LanguageIdentifier"], [150, "AudioType"], [151, "AudioSamplingRate"], [152, "AudioSamplingResolution"], [153, "AudioDuration"], [154, "AudioOutcue"], [184, "JobID"], [185, "MasterDocumentID"], [186, "ShortDocumentID"], [187, "UniqueDocumentID"], [188, "OwnerID"], [200, "ObjectPreviewFileFormat"], [201, "ObjectPreviewFileVersion"], [202, "ObjectPreviewData"], [221, "Prefs"], [225, "ClassifyState"], [228, "SimilarityIndex"], [230, "DocumentNotes"], [231, "DocumentHistory"], [232, "ExifCameraInfo"], [255, "CatalogSets"]]), U(B, "iptc", [[10, { 0: "0 (reserved)", 1: "1 (most urgent)", 2: "2", 3: "3", 4: "4", 5: "5 (normal urgency)", 6: "6", 7: "7", 8: "8 (least urgent)", 9: "9 (user-defined priority)" }], [75, { a: "Morning", b: "Both Morning and Evening", p: "Evening" }], [131, { L: "Landscape", P: "Portrait", S: "Square" }]]);
  const full_esm = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    Exifr: te,
    Options: q,
    allFormatters: X,
    chunkedProps: G,
    createDictionary: U,
    default: tt,
    extendDictionary: F,
    fetchUrlAsArrayBuffer: M,
    fileParsers: w,
    fileReaders: A,
    gps: Se,
    gpsOnlyOptions: me,
    inheritables: K,
    orientation: Pe,
    orientationOnlyOptions: Ie,
    otherSegments: V,
    parse: ie,
    readBlobAsArrayBuffer: R,
    get rotateCanvas() {
      return we;
    },
    get rotateCss() {
      return Te;
    },
    rotation: Ae,
    rotations: ke,
    segmentParsers: T,
    segments: z,
    segmentsAndBlocks: j,
    sidecar: st,
    tagKeys: E,
    tagRevivers: N,
    tagValues: B,
    thumbnail: ye,
    thumbnailOnlyOptions: Ce,
    thumbnailUrl: be,
    tiffBlocks: H,
    tiffExtractables: W
  }, Symbol.toStringTag, { value: "Module" }));
  exports.AUDIO_EXTENSIONS = AUDIO_EXTENSIONS;
  exports.BrowserStorage = BrowserStorage;
  exports.ContentParser = ContentParser;
  exports.DOCUMENT_EXTENSIONS = DOCUMENT_EXTENSIONS;
  exports.FILTER_CONFIG = FILTER_CONFIG;
  exports.IMAGE_EXTENSIONS = IMAGE_EXTENSIONS;
  exports.MEDIA_EXTENSIONS = MEDIA_EXTENSIONS;
  exports.MediaLibrary = MediaLibrary2;
  exports.VIDEO_EXTENSIONS = VIDEO_EXTENSIONS;
  exports.applyFilter = applyFilter;
  exports.calculateFilteredMediaData = calculateFilteredMediaData;
  exports.calculateFilteredMediaDataFromIndex = calculateFilteredMediaDataFromIndex;
  exports.clearProcessedDataCache = clearProcessedDataCache;
  exports.copyImageToClipboard = copyImageToClipboard;
  exports.copyMediaToClipboard = copyMediaToClipboard;
  exports.createElement = createElement;
  exports.createHash = createHash;
  exports.createMediaLibrary = createMediaLibrary;
  exports.createSearchSuggestion = createSearchSuggestion;
  exports.createStorage = createStorage;
  exports.detectMediaTypeFromExtension = detectMediaTypeFromExtension;
  exports.extractFileExtension = extractFileExtension;
  exports.extractMediaLocation = extractMediaLocation;
  exports.extractRelativePath = extractRelativePath;
  exports.formatFileSize = formatFileSize;
  exports.generateSearchSuggestions = generateSearchSuggestions;
  exports.getAvailableFilters = getAvailableFilters;
  exports.getCategoryFilters = getCategoryFilters;
  exports.getDisplayMediaType = getDisplayMediaType;
  exports.getDisplayName = getDisplayName;
  exports.getFileName = getFileName;
  exports.getFilterCounts = getFilterCounts;
  exports.getFilteredItems = getFilteredItems;
  exports.getGroupingKey = getGroupingKey;
  exports.getItemByHash = getItemByHash;
  exports.getMediaType = getMediaType;
  exports.getSubtype = getSubtype;
  exports.getUsageData = getUsageData;
  exports.getVideoThumbnail = getVideoThumbnail;
  exports.groupUsagesByPath = groupUsagesByPath;
  exports.i18n = i18n;
  exports.initializeMediaLibrary = initializeMediaLibrary;
  exports.initializeProcessedData = initializeProcessedData;
  exports.isExternalVideoUrl = isExternalVideoUrl;
  exports.isImage = isImage;
  exports.isMediaFile = isMediaFile;
  exports.isPdf = isPdf;
  exports.isSvgFile = isSvgFile;
  exports.isVideo = isVideo;
  exports.normalizeUrl = normalizeUrl;
  exports.parseColonSyntax = parseColonSyntax;
  exports.processMediaData = processMediaData;
  exports.processNewItems = processNewItems;
  exports.searchProcessedData = searchProcessedData;
  exports.sortMediaData = sortMediaData;
  exports.updateUsageCounts = updateUsageCounts;
  exports.urlsMatch = urlsMatch;
  exports.waitForMediaLibraryReady = waitForMediaLibraryReady;
  Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
  return exports;
}({});
