/*! jQuery v1.11.0 | (c) 2005, 2014 jQuery Foundation, Inc. | jquery.org/license */
!(function(a, b) {
  typeof module === 'object' && typeof module.exports === 'object'
    ? (module.exports = a.document
        ? b(a, !0)
        : function(a) {
            if (!a.document) throw new Error('jQuery requires a window with a document');
            return b(a);
          })
    : b(a);
})(typeof window !== 'undefined' ? window : this, (a, b) => {
  var c = [],
    d = c.slice,
    e = c.concat,
    f = c.push,
    g = c.indexOf,
    h = {},
    i = h.toString,
    j = h.hasOwnProperty,
    k = ''.trim,
    l = {},
    m = '1.11.0',
    n = function(a, b) {
      return new n.fn.init(a, b);
    },
    o = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
    p = /^-ms-/,
    q = /-([\da-z])/gi,
    r = function(a, b) {
      return b.toUpperCase();
    };
  (n.fn = n.prototype = {
    jquery: m,
    constructor: n,
    selector: '',
    length: 0,
    toArray() {
      return d.call(this);
    },
    get(a) {
      return a != null ? (a < 0 ? this[a + this.length] : this[a]) : d.call(this);
    },
    pushStack(a) {
      const b = n.merge(this.constructor(), a);
      return (b.prevObject = this), (b.context = this.context), b;
    },
    each(a, b) {
      return n.each(this, a, b);
    },
    map(a) {
      return this.pushStack(n.map(this, (b, c) => a.call(b, c, b)));
    },
    slice() {
      return this.pushStack(d.apply(this, arguments));
    },
    first() {
      return this.eq(0);
    },
    last() {
      return this.eq(-1);
    },
    eq(a) {
      let b = this.length,
        c = +a + (a < 0 ? b : 0);
      return this.pushStack(c >= 0 && b > c ? [this[c]] : []);
    },
    end() {
      return this.prevObject || this.constructor(null);
    },
    push: f,
    sort: c.sort,
    splice: c.splice,
  }),
    (n.extend = n.fn.extend = function() {
      let a,
        b,
        c,
        d,
        e,
        f,
        g = arguments[0] || {},
        h = 1,
        i = arguments.length,
        j = !1;
      for (
        typeof g === 'boolean' && ((j = g), (g = arguments[h] || {}), h++),
          typeof g === 'object' || n.isFunction(g) || (g = {}),
          h === i && ((g = this), h--);
        i > h;
        h++
      )
        if ((e = arguments[h]) != null)
          for (d in e)
            (a = g[d]),
              (c = e[d]),
              g !== c &&
                (j && c && (n.isPlainObject(c) || (b = n.isArray(c)))
                  ? (b
                      ? ((b = !1), (f = a && n.isArray(a) ? a : []))
                      : (f = a && n.isPlainObject(a) ? a : {}),
                    (g[d] = n.extend(j, f, c)))
                  : void 0 !== c && (g[d] = c));
      return g;
    }),
    n.extend({
      expando: `jQuery${(m + Math.random()).replace(/\D/g, '')}`,
      isReady: !0,
      error(a) {
        throw new Error(a);
      },
      noop() {},
      isFunction(a) {
        return n.type(a) === 'function';
      },
      isArray:
        Array.isArray ||
        function(a) {
          return n.type(a) === 'array';
        },
      isWindow(a) {
        return a != null && a == a.window;
      },
      isNumeric(a) {
        return a - parseFloat(a) >= 0;
      },
      isEmptyObject(a) {
        let b;
        for (b in a) return !1;
        return !0;
      },
      isPlainObject(a) {
        let b;
        if (!a || n.type(a) !== 'object' || a.nodeType || n.isWindow(a)) return !1;
        try {
          if (
            a.constructor &&
            !j.call(a, 'constructor') &&
            !j.call(a.constructor.prototype, 'isPrototypeOf')
          )
            return !1;
        } catch (c) {
          return !1;
        }
        if (l.ownLast) for (b in a) return j.call(a, b);
        for (b in a);
        return void 0 === b || j.call(a, b);
      },
      type(a) {
        return a == null
          ? `${a}`
          : typeof a === 'object' || typeof a === 'function' ? h[i.call(a)] || 'object' : typeof a;
      },
      globalEval(b) {
        b &&
          n.trim(b) &&
          (a.execScript ||
            function(b) {
              a.eval.call(a, b);
            })(b);
      },
      camelCase(a) {
        return a.replace(p, 'ms-').replace(q, r);
      },
      nodeName(a, b) {
        return a.nodeName && a.nodeName.toLowerCase() === b.toLowerCase();
      },
      each(a, b, c) {
        let d,
          e = 0,
          f = a.length,
          g = s(a);
        if (c) {
          if (g) {
            for (; f > e; e++) if (((d = b.apply(a[e], c)), d === !1)) break;
          } else for (e in a) if (((d = b.apply(a[e], c)), d === !1)) break;
        } else if (g) {
          for (; f > e; e++) if (((d = b.call(a[e], e, a[e])), d === !1)) break;
        } else for (e in a) if (((d = b.call(a[e], e, a[e])), d === !1)) break;
        return a;
      },
      trim:
        k && !k.call('\ufeff\xa0')
          ? function(a) {
              return a == null ? '' : k.call(a);
            }
          : function(a) {
              return a == null ? '' : `${a}`.replace(o, '');
            },
      makeArray(a, b) {
        const c = b || [];
        return (
          a != null && (s(Object(a)) ? n.merge(c, typeof a === 'string' ? [a] : a) : f.call(c, a)),
          c
        );
      },
      inArray(a, b, c) {
        let d;
        if (b) {
          if (g) return g.call(b, a, c);
          for (d = b.length, c = c ? (c < 0 ? Math.max(0, d + c) : c) : 0; d > c; c++)
            if (c in b && b[c] === a) return c;
        }
        return -1;
      },
      merge(a, b) {
        let c = +b.length,
          d = 0,
          e = a.length;
        while (c > d) a[e++] = b[d++];
        if (c !== c) while (void 0 !== b[d]) a[e++] = b[d++];
        return (a.length = e), a;
      },
      grep(a, b, c) {
        for (var d, e = [], f = 0, g = a.length, h = !c; g > f; f++)
          (d = !b(a[f], f)), d !== h && e.push(a[f]);
        return e;
      },
      map(a, b, c) {
        let d,
          f = 0,
          g = a.length,
          h = s(a),
          i = [];
        if (h) for (; g > f; f++) (d = b(a[f], f, c)), d != null && i.push(d);
        else for (f in a) (d = b(a[f], f, c)), d != null && i.push(d);
        return e.apply([], i);
      },
      guid: 1,
      proxy(a, b) {
        let c, e, f;
        return (
          typeof b === 'string' && ((f = a[b]), (b = a), (a = f)),
          n.isFunction(a)
            ? ((c = d.call(arguments, 2)),
              (e = function() {
                return a.apply(b || this, c.concat(d.call(arguments)));
              }),
              (e.guid = a.guid = a.guid || n.guid++),
              e)
            : void 0
        );
      },
      now() {
        return +new Date();
      },
      support: l,
    }),
    n.each('Boolean Number String Function Array Date RegExp Object Error'.split(' '), (a, b) => {
      h[`[object ${b}]`] = b.toLowerCase();
    });
  function s(a) {
    let b = a.length,
      c = n.type(a);
    return c === 'function' || n.isWindow(a)
      ? !1
      : a.nodeType === 1 && b
        ? !0
        : c === 'array' || b === 0 || (typeof b === 'number' && b > 0 && b - 1 in a);
  }
  const t = (function(a) {
    let b,
      c,
      d,
      e,
      f,
      g,
      h,
      i,
      j,
      k,
      l,
      m,
      n,
      o,
      p,
      q,
      r,
      s = `sizzle${-new Date()}`,
      t = a.document,
      u = 0,
      v = 0,
      w = eb(),
      x = eb(),
      y = eb(),
      z = function(a, b) {
        return a === b && (j = !0), 0;
      },
      A = 'undefined',
      B = 1 << 31,
      C = {}.hasOwnProperty,
      D = [],
      E = D.pop,
      F = D.push,
      G = D.push,
      H = D.slice,
      I =
        D.indexOf ||
        function(a) {
          for (let b = 0, c = this.length; c > b; b++) if (this[b] === a) return b;
          return -1;
        },
      J =
        'checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped',
      K = '[\\x20\\t\\r\\n\\f]',
      L = '(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+',
      M = L.replace('w', 'w#'),
      N = `\\[${K}*(${L})${K}*(?:([*^$|!~]?=)${K}*(?:(['"])((?:\\\\.|[^\\\\])*?)\\3|(${M})|)|)${K}*\\]`,
      O = `:(${L})(?:\\(((['"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|${N.replace(
        3,
        8
      )})*)|.*)\\)|)`,
      P = new RegExp(`^${K}+|((?:^|[^\\\\])(?:\\\\.)*)${K}+$`, 'g'),
      Q = new RegExp(`^${K}*,${K}*`),
      R = new RegExp(`^${K}*([>+~]|${K})${K}*`),
      S = new RegExp(`=${K}*([^\\]'"]*?)${K}*\\]`, 'g'),
      T = new RegExp(O),
      U = new RegExp(`^${M}$`),
      V = {
        ID: new RegExp(`^#(${L})`),
        CLASS: new RegExp(`^\\.(${L})`),
        TAG: new RegExp(`^(${L.replace('w', 'w*')})`),
        ATTR: new RegExp(`^${N}`),
        PSEUDO: new RegExp(`^${O}`),
        CHILD: new RegExp(
          `^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(${K}*(even|odd|(([+-]|)(\\d*)n|)${K}*(?:([+-]|)${K}*(\\d+)|))${K}*\\)|)`,
          'i'
        ),
        bool: new RegExp(`^(?:${J})$`, 'i'),
        needsContext: new RegExp(
          `^${K}*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(${K}*((?:-\\d)?\\d*)${K}*\\)|)(?=[^-]|$)`,
          'i'
        ),
      },
      W = /^(?:input|select|textarea|button)$/i,
      X = /^h\d$/i,
      Y = /^[^{]+\{\s*\[native \w/,
      Z = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,
      $ = /[+~]/,
      _ = /'|\\/g,
      ab = new RegExp(`\\\\([\\da-f]{1,6}${K}?|(${K})|.)`, 'ig'),
      bb = function(a, b, c) {
        const d = `0x${b}` - 65536;
        return d !== d || c
          ? b
          : d < 0
            ? String.fromCharCode(d + 65536)
            : String.fromCharCode((d >> 10) | 55296, (1023 & d) | 56320);
      };
    try {
      G.apply((D = H.call(t.childNodes)), t.childNodes), D[t.childNodes.length].nodeType;
    } catch (cb) {
      G = {
        apply: D.length
          ? function(a, b) {
              F.apply(a, H.call(b));
            }
          : function(a, b) {
              let c = a.length,
                d = 0;
              while ((a[c++] = b[d++]));
              a.length = c - 1;
            },
      };
    }
    function db(a, b, d, e) {
      let f, g, h, i, j, m, p, q, u, v;
      if (
        ((b ? b.ownerDocument || b : t) !== l && k(b),
        (b = b || l),
        (d = d || []),
        !a || typeof a !== 'string')
      )
        return d;
      if ((i = b.nodeType) !== 1 && i !== 9) return [];
      if (n && !e) {
        if ((f = Z.exec(a)))
          if ((h = f[1])) {
            if (i === 9) {
              if (((g = b.getElementById(h)), !g || !g.parentNode)) return d;
              if (g.id === h) return d.push(g), d;
            } else if (
              b.ownerDocument &&
              (g = b.ownerDocument.getElementById(h)) &&
              r(b, g) &&
              g.id === h
            )
              return d.push(g), d;
          } else {
            if (f[2]) return G.apply(d, b.getElementsByTagName(a)), d;
            if ((h = f[3]) && c.getElementsByClassName && b.getElementsByClassName)
              return G.apply(d, b.getElementsByClassName(h)), d;
          }
        if (c.qsa && (!o || !o.test(a))) {
          if (
            ((q = p = s),
            (u = b),
            (v = i === 9 && a),
            i === 1 && b.nodeName.toLowerCase() !== 'object')
          ) {
            (m = ob(a)),
              (p = b.getAttribute('id')) ? (q = p.replace(_, '\\$&')) : b.setAttribute('id', q),
              (q = `[id='${q}'] `),
              (j = m.length);
            while (j--) m[j] = q + pb(m[j]);
            (u = ($.test(a) && mb(b.parentNode)) || b), (v = m.join(','));
          }
          if (v)
            try {
              return G.apply(d, u.querySelectorAll(v)), d;
            } catch (w) {
            } finally {
              p || b.removeAttribute('id');
            }
        }
      }
      return xb(a.replace(P, '$1'), b, d, e);
    }
    function eb() {
      const a = [];
      function b(c, e) {
        return a.push(`${c} `) > d.cacheLength && delete b[a.shift()], (b[`${c} `] = e);
      }
      return b;
    }
    function fb(a) {
      return (a[s] = !0), a;
    }
    function gb(a) {
      let b = l.createElement('div');
      try {
        return !!a(b);
      } catch (c) {
        return !1;
      } finally {
        b.parentNode && b.parentNode.removeChild(b), (b = null);
      }
    }
    function hb(a, b) {
      let c = a.split('|'),
        e = a.length;
      while (e--) d.attrHandle[c[e]] = b;
    }
    function ib(a, b) {
      let c = b && a,
        d =
          c &&
          a.nodeType === 1 &&
          b.nodeType === 1 &&
          (~b.sourceIndex || B) - (~a.sourceIndex || B);
      if (d) return d;
      if (c) while ((c = c.nextSibling)) if (c === b) return -1;
      return a ? 1 : -1;
    }
    function jb(a) {
      return function(b) {
        const c = b.nodeName.toLowerCase();
        return c === 'input' && b.type === a;
      };
    }
    function kb(a) {
      return function(b) {
        const c = b.nodeName.toLowerCase();
        return (c === 'input' || c === 'button') && b.type === a;
      };
    }
    function lb(a) {
      return fb(
        b => (
          (b = +b),
          fb((c, d) => {
            let e,
              f = a([], c.length, b),
              g = f.length;
            while (g--) c[(e = f[g])] && (c[e] = !(d[e] = c[e]));
          })
        )
      );
    }
    function mb(a) {
      return a && typeof a.getElementsByTagName !== A && a;
    }
    (c = db.support = {}),
      (f = db.isXML = function(a) {
        const b = a && (a.ownerDocument || a).documentElement;
        return b ? b.nodeName !== 'HTML' : !1;
      }),
      (k = db.setDocument = function(a) {
        let b,
          e = a ? a.ownerDocument || a : t,
          g = e.defaultView;
        return e !== l && e.nodeType === 9 && e.documentElement
          ? ((l = e),
            (m = e.documentElement),
            (n = !f(e)),
            g &&
              g !== g.top &&
              (g.addEventListener
                ? g.addEventListener(
                    'unload',
                    () => {
                      k();
                    },
                    !1
                  )
                : g.attachEvent &&
                  g.attachEvent('onunload', () => {
                    k();
                  })),
            (c.attributes = gb(a => (a.className = 'i'), !a.getAttribute('className'))),
            (c.getElementsByTagName = gb(
              a => a.appendChild(e.createComment('')),
              !a.getElementsByTagName('*').length
            )),
            (c.getElementsByClassName =
              Y.test(e.getElementsByClassName) &&
              gb(
                a => (
                  (a.innerHTML = "<div class='a'></div><div class='a i'></div>"),
                  (a.firstChild.className = 'i'),
                  a.getElementsByClassName('i').length === 2
                )
              )),
            (c.getById = gb(
              a => (
                (m.appendChild(a).id = s), !e.getElementsByName || !e.getElementsByName(s).length
              )
            )),
            c.getById
              ? ((d.find.ID = function(a, b) {
                  if (typeof b.getElementById !== A && n) {
                    const c = b.getElementById(a);
                    return c && c.parentNode ? [c] : [];
                  }
                }),
                (d.filter.ID = function(a) {
                  const b = a.replace(ab, bb);
                  return function(a) {
                    return a.getAttribute('id') === b;
                  };
                }))
              : (delete d.find.ID,
                (d.filter.ID = function(a) {
                  const b = a.replace(ab, bb);
                  return function(a) {
                    const c = typeof a.getAttributeNode !== A && a.getAttributeNode('id');
                    return c && c.value === b;
                  };
                })),
            (d.find.TAG = c.getElementsByTagName
              ? function(a, b) {
                  return typeof b.getElementsByTagName !== A ? b.getElementsByTagName(a) : void 0;
                }
              : function(a, b) {
                  let c,
                    d = [],
                    e = 0,
                    f = b.getElementsByTagName(a);
                  if (a === '*') {
                    while ((c = f[e++])) c.nodeType === 1 && d.push(c);
                    return d;
                  }
                  return f;
                }),
            (d.find.CLASS =
              c.getElementsByClassName &&
              function(a, b) {
                return typeof b.getElementsByClassName !== A && n
                  ? b.getElementsByClassName(a)
                  : void 0;
              }),
            (p = []),
            (o = []),
            (c.qsa = Y.test(e.querySelectorAll)) &&
              (gb(a => {
                (a.innerHTML = "<select t=''><option selected=''></option></select>"),
                  a.querySelectorAll("[t^='']").length && o.push(`[*^$]=${K}*(?:''|"")`),
                  a.querySelectorAll('[selected]').length || o.push(`\\[${K}*(?:value|${J})`),
                  a.querySelectorAll(':checked').length || o.push(':checked');
              }),
              gb(a => {
                const b = e.createElement('input');
                b.setAttribute('type', 'hidden'),
                  a.appendChild(b).setAttribute('name', 'D'),
                  a.querySelectorAll('[name=d]').length && o.push(`name${K}*[*^$|!~]?=`),
                  a.querySelectorAll(':enabled').length || o.push(':enabled', ':disabled'),
                  a.querySelectorAll('*,:x'),
                  o.push(',.*:');
              })),
            (c.matchesSelector = Y.test(
              (q =
                m.webkitMatchesSelector ||
                m.mozMatchesSelector ||
                m.oMatchesSelector ||
                m.msMatchesSelector)
            )) &&
              gb(a => {
                (c.disconnectedMatch = q.call(a, 'div')), q.call(a, "[s!='']:x"), p.push('!=', O);
              }),
            (o = o.length && new RegExp(o.join('|'))),
            (p = p.length && new RegExp(p.join('|'))),
            (b = Y.test(m.compareDocumentPosition)),
            (r =
              b || Y.test(m.contains)
                ? function(a, b) {
                    let c = a.nodeType === 9 ? a.documentElement : a,
                      d = b && b.parentNode;
                    return (
                      a === d ||
                      !(
                        !d ||
                        d.nodeType !== 1 ||
                        !(c.contains
                          ? c.contains(d)
                          : a.compareDocumentPosition && 16 & a.compareDocumentPosition(d))
                      )
                    );
                  }
                : function(a, b) {
                    if (b) while ((b = b.parentNode)) if (b === a) return !0;
                    return !1;
                  }),
            (z = b
              ? function(a, b) {
                  if (a === b) return (j = !0), 0;
                  let d = !a.compareDocumentPosition - !b.compareDocumentPosition;
                  return (
                    d ||
                    ((d =
                      (a.ownerDocument || a) === (b.ownerDocument || b)
                        ? a.compareDocumentPosition(b)
                        : 1),
                    1 & d || (!c.sortDetached && b.compareDocumentPosition(a) === d)
                      ? a === e || (a.ownerDocument === t && r(t, a))
                        ? -1
                        : b === e || (b.ownerDocument === t && r(t, b))
                          ? 1
                          : i ? I.call(i, a) - I.call(i, b) : 0
                      : 4 & d ? -1 : 1)
                  );
                }
              : function(a, b) {
                  if (a === b) return (j = !0), 0;
                  let c,
                    d = 0,
                    f = a.parentNode,
                    g = b.parentNode,
                    h = [a],
                    k = [b];
                  if (!f || !g)
                    return a === e
                      ? -1
                      : b === e ? 1 : f ? -1 : g ? 1 : i ? I.call(i, a) - I.call(i, b) : 0;
                  if (f === g) return ib(a, b);
                  c = a;
                  while ((c = c.parentNode)) h.unshift(c);
                  c = b;
                  while ((c = c.parentNode)) k.unshift(c);
                  while (h[d] === k[d]) d++;
                  return d ? ib(h[d], k[d]) : h[d] === t ? -1 : k[d] === t ? 1 : 0;
                }),
            e)
          : l;
      }),
      (db.matches = function(a, b) {
        return db(a, null, null, b);
      }),
      (db.matchesSelector = function(a, b) {
        if (
          ((a.ownerDocument || a) !== l && k(a),
          (b = b.replace(S, "='$1']")),
          !(!c.matchesSelector || !n || (p && p.test(b)) || (o && o.test(b))))
        )
          try {
            const d = q.call(a, b);
            if (d || c.disconnectedMatch || (a.document && a.document.nodeType !== 11)) return d;
          } catch (e) {}
        return db(b, l, null, [a]).length > 0;
      }),
      (db.contains = function(a, b) {
        return (a.ownerDocument || a) !== l && k(a), r(a, b);
      }),
      (db.attr = function(a, b) {
        (a.ownerDocument || a) !== l && k(a);
        let e = d.attrHandle[b.toLowerCase()],
          f = e && C.call(d.attrHandle, b.toLowerCase()) ? e(a, b, !n) : void 0;
        return void 0 !== f
          ? f
          : c.attributes || !n
            ? a.getAttribute(b)
            : (f = a.getAttributeNode(b)) && f.specified ? f.value : null;
      }),
      (db.error = function(a) {
        throw new Error(`Syntax error, unrecognized expression: ${a}`);
      }),
      (db.uniqueSort = function(a) {
        let b,
          d = [],
          e = 0,
          f = 0;
        if (((j = !c.detectDuplicates), (i = !c.sortStable && a.slice(0)), a.sort(z), j)) {
          while ((b = a[f++])) b === a[f] && (e = d.push(f));
          while (e--) a.splice(d[e], 1);
        }
        return (i = null), a;
      }),
      (e = db.getText = function(a) {
        let b,
          c = '',
          d = 0,
          f = a.nodeType;
        if (f) {
          if (f === 1 || f === 9 || f === 11) {
            if (typeof a.textContent === 'string') return a.textContent;
            for (a = a.firstChild; a; a = a.nextSibling) c += e(a);
          } else if (f === 3 || f === 4) return a.nodeValue;
        } else while ((b = a[d++])) c += e(b);
        return c;
      }),
      (d = db.selectors = {
        cacheLength: 50,
        createPseudo: fb,
        match: V,
        attrHandle: {},
        find: {},
        relative: {
          '>': { dir: 'parentNode', first: !0 },
          ' ': { dir: 'parentNode' },
          '+': { dir: 'previousSibling', first: !0 },
          '~': { dir: 'previousSibling' },
        },
        preFilter: {
          ATTR(a) {
            return (
              (a[1] = a[1].replace(ab, bb)),
              (a[3] = (a[4] || a[5] || '').replace(ab, bb)),
              a[2] === '~=' && (a[3] = ` ${a[3]} `),
              a.slice(0, 4)
            );
          },
          CHILD(a) {
            return (
              (a[1] = a[1].toLowerCase()),
              a[1].slice(0, 3) === 'nth'
                ? (a[3] || db.error(a[0]),
                  (a[4] = +(a[4] ? a[5] + (a[6] || 1) : 2 * (a[3] === 'even' || a[3] === 'odd'))),
                  (a[5] = +(a[7] + a[8] || a[3] === 'odd')))
                : a[3] && db.error(a[0]),
              a
            );
          },
          PSEUDO(a) {
            let b,
              c = !a[5] && a[2];
            return V.CHILD.test(a[0])
              ? null
              : (a[3] && void 0 !== a[4]
                  ? (a[2] = a[4])
                  : c &&
                    T.test(c) &&
                    (b = ob(c, !0)) &&
                    (b = c.indexOf(')', c.length - b) - c.length) &&
                    ((a[0] = a[0].slice(0, b)), (a[2] = c.slice(0, b))),
                a.slice(0, 3));
          },
        },
        filter: {
          TAG(a) {
            const b = a.replace(ab, bb).toLowerCase();
            return a === '*'
              ? function() {
                  return !0;
                }
              : function(a) {
                  return a.nodeName && a.nodeName.toLowerCase() === b;
                };
          },
          CLASS(a) {
            let b = w[`${a} `];
            return (
              b ||
              ((b = new RegExp(`(^|${K})${a}(${K}|$)`)) &&
                w(a, a =>
                  b.test(
                    (typeof a.className === 'string' && a.className) ||
                      (typeof a.getAttribute !== A && a.getAttribute('class')) ||
                      ''
                  )
                ))
            );
          },
          ATTR(a, b, c) {
            return function(d) {
              let e = db.attr(d, a);
              return e == null
                ? b === '!='
                : b
                  ? ((e += ''),
                    b === '='
                      ? e === c
                      : b === '!='
                        ? e !== c
                        : b === '^='
                          ? c && e.indexOf(c) === 0
                          : b === '*='
                            ? c && e.indexOf(c) > -1
                            : b === '$='
                              ? c && e.slice(-c.length) === c
                              : b === '~='
                                ? ` ${e} `.indexOf(c) > -1
                                : b === '|=' ? e === c || e.slice(0, c.length + 1) === `${c}-` : !1)
                  : !0;
            };
          },
          CHILD(a, b, c, d, e) {
            let f = a.slice(0, 3) !== 'nth',
              g = a.slice(-4) !== 'last',
              h = b === 'of-type';
            return d === 1 && e === 0
              ? function(a) {
                  return !!a.parentNode;
                }
              : function(b, c, i) {
                  let j,
                    k,
                    l,
                    m,
                    n,
                    o,
                    p = f !== g ? 'nextSibling' : 'previousSibling',
                    q = b.parentNode,
                    r = h && b.nodeName.toLowerCase(),
                    t = !i && !h;
                  if (q) {
                    if (f) {
                      while (p) {
                        l = b;
                        while ((l = l[p]))
                          if (h ? l.nodeName.toLowerCase() === r : l.nodeType === 1) return !1;
                        o = p = a === 'only' && !o && 'nextSibling';
                      }
                      return !0;
                    }
                    if (((o = [g ? q.firstChild : q.lastChild]), g && t)) {
                      (k = q[s] || (q[s] = {})),
                        (j = k[a] || []),
                        (n = j[0] === u && j[1]),
                        (m = j[0] === u && j[2]),
                        (l = n && q.childNodes[n]);
                      while ((l = (++n && l && l[p]) || (m = n = 0) || o.pop()))
                        if (l.nodeType === 1 && ++m && l === b) {
                          k[a] = [u, n, m];
                          break;
                        }
                    } else if (t && (j = (b[s] || (b[s] = {}))[a]) && j[0] === u) m = j[1];
                    else
                      while ((l = (++n && l && l[p]) || (m = n = 0) || o.pop()))
                        if (
                          (h ? l.nodeName.toLowerCase() === r : l.nodeType === 1) &&
                          ++m &&
                          (t && ((l[s] || (l[s] = {}))[a] = [u, m]), l === b)
                        )
                          break;
                    return (m -= e), m === d || (m % d === 0 && m / d >= 0);
                  }
                };
          },
          PSEUDO(a, b) {
            let c,
              e =
                d.pseudos[a] ||
                d.setFilters[a.toLowerCase()] ||
                db.error(`unsupported pseudo: ${a}`);
            return e[s]
              ? e(b)
              : e.length > 1
                ? ((c = [a, a, '', b]),
                  d.setFilters.hasOwnProperty(a.toLowerCase())
                    ? fb((a, c) => {
                        let d,
                          f = e(a, b),
                          g = f.length;
                        while (g--) (d = I.call(a, f[g])), (a[d] = !(c[d] = f[g]));
                      })
                    : function(a) {
                        return e(a, 0, c);
                      })
                : e;
          },
        },
        pseudos: {
          not: fb(a => {
            let b = [],
              c = [],
              d = g(a.replace(P, '$1'));
            return d[s]
              ? fb((a, b, c, e) => {
                  let f,
                    g = d(a, null, e, []),
                    h = a.length;
                  while (h--) (f = g[h]) && (a[h] = !(b[h] = f));
                })
              : function(a, e, f) {
                  return (b[0] = a), d(b, null, f, c), !c.pop();
                };
          }),
          has: fb(
            a =>
              function(b) {
                return db(a, b).length > 0;
              }
          ),
          contains: fb(
            a =>
              function(b) {
                return (b.textContent || b.innerText || e(b)).indexOf(a) > -1;
              }
          ),
          lang: fb(
            a => (
              U.test(a || '') || db.error(`unsupported lang: ${a}`),
              (a = a.replace(ab, bb).toLowerCase()),
              function(b) {
                let c;
                do
                  if ((c = n ? b.lang : b.getAttribute('xml:lang') || b.getAttribute('lang')))
                    return (c = c.toLowerCase()), c === a || c.indexOf(`${a}-`) === 0;
                while ((b = b.parentNode) && b.nodeType === 1);
                return !1;
              }
            )
          ),
          target(b) {
            const c = a.location && a.location.hash;
            return c && c.slice(1) === b.id;
          },
          root(a) {
            return a === m;
          },
          focus(a) {
            return (
              a === l.activeElement &&
              (!l.hasFocus || l.hasFocus()) &&
              !!(a.type || a.href || ~a.tabIndex)
            );
          },
          enabled(a) {
            return a.disabled === !1;
          },
          disabled(a) {
            return a.disabled === !0;
          },
          checked(a) {
            const b = a.nodeName.toLowerCase();
            return (b === 'input' && !!a.checked) || (b === 'option' && !!a.selected);
          },
          selected(a) {
            return a.parentNode && a.parentNode.selectedIndex, a.selected === !0;
          },
          empty(a) {
            for (a = a.firstChild; a; a = a.nextSibling) if (a.nodeType < 6) return !1;
            return !0;
          },
          parent(a) {
            return !d.pseudos.empty(a);
          },
          header(a) {
            return X.test(a.nodeName);
          },
          input(a) {
            return W.test(a.nodeName);
          },
          button(a) {
            const b = a.nodeName.toLowerCase();
            return (b === 'input' && a.type === 'button') || b === 'button';
          },
          text(a) {
            let b;
            return (
              a.nodeName.toLowerCase() === 'input' &&
              a.type === 'text' &&
              ((b = a.getAttribute('type')) == null || b.toLowerCase() === 'text')
            );
          },
          first: lb(() => [0]),
          last: lb((a, b) => [b - 1]),
          eq: lb((a, b, c) => [c < 0 ? c + b : c]),
          even: lb((a, b) => {
            for (let c = 0; b > c; c += 2) a.push(c);
            return a;
          }),
          odd: lb((a, b) => {
            for (let c = 1; b > c; c += 2) a.push(c);
            return a;
          }),
          lt: lb((a, b, c) => {
            for (let d = c < 0 ? c + b : c; --d >= 0; ) a.push(d);
            return a;
          }),
          gt: lb((a, b, c) => {
            for (let d = c < 0 ? c + b : c; ++d < b; ) a.push(d);
            return a;
          }),
        },
      }),
      (d.pseudos.nth = d.pseudos.eq);
    for (b in { radio: !0, checkbox: !0, file: !0, password: !0, image: !0 }) d.pseudos[b] = jb(b);
    for (b in { submit: !0, reset: !0 }) d.pseudos[b] = kb(b);
    function nb() {}
    (nb.prototype = d.filters = d.pseudos), (d.setFilters = new nb());
    function ob(a, b) {
      let c,
        e,
        f,
        g,
        h,
        i,
        j,
        k = x[`${a} `];
      if (k) return b ? 0 : k.slice(0);
      (h = a), (i = []), (j = d.preFilter);
      while (h) {
        (!c || (e = Q.exec(h))) && (e && (h = h.slice(e[0].length) || h), i.push((f = []))),
          (c = !1),
          (e = R.exec(h)) &&
            ((c = e.shift()),
            f.push({ value: c, type: e[0].replace(P, ' ') }),
            (h = h.slice(c.length)));
        for (g in d.filter)
          !(e = V[g].exec(h)) ||
            (j[g] && !(e = j[g](e))) ||
            ((c = e.shift()), f.push({ value: c, type: g, matches: e }), (h = h.slice(c.length)));
        if (!c) break;
      }
      return b ? h.length : h ? db.error(a) : x(a, i).slice(0);
    }
    function pb(a) {
      for (var b = 0, c = a.length, d = ''; c > b; b++) d += a[b].value;
      return d;
    }
    function qb(a, b, c) {
      let d = b.dir,
        e = c && d === 'parentNode',
        f = v++;
      return b.first
        ? function(b, c, f) {
            while ((b = b[d])) if (b.nodeType === 1 || e) return a(b, c, f);
          }
        : function(b, c, g) {
            let h,
              i,
              j = [u, f];
            if (g) {
              while ((b = b[d])) if ((b.nodeType === 1 || e) && a(b, c, g)) return !0;
            } else
              while ((b = b[d]))
                if (b.nodeType === 1 || e) {
                  if (((i = b[s] || (b[s] = {})), (h = i[d]) && h[0] === u && h[1] === f))
                    return (j[2] = h[2]);
                  if (((i[d] = j), (j[2] = a(b, c, g)))) return !0;
                }
          };
    }
    function rb(a) {
      return a.length > 1
        ? function(b, c, d) {
            let e = a.length;
            while (e--) if (!a[e](b, c, d)) return !1;
            return !0;
          }
        : a[0];
    }
    function sb(a, b, c, d, e) {
      for (var f, g = [], h = 0, i = a.length, j = b != null; i > h; h++)
        (f = a[h]) && (!c || c(f, d, e)) && (g.push(f), j && b.push(h));
      return g;
    }
    function tb(a, b, c, d, e, f) {
      return (
        d && !d[s] && (d = tb(d)),
        e && !e[s] && (e = tb(e, f)),
        fb((f, g, h, i) => {
          let j,
            k,
            l,
            m = [],
            n = [],
            o = g.length,
            p = f || wb(b || '*', h.nodeType ? [h] : h, []),
            q = !a || (!f && b) ? p : sb(p, m, a, h, i),
            r = c ? (e || (f ? a : o || d) ? [] : g) : q;
          if ((c && c(q, r, h, i), d)) {
            (j = sb(r, n)), d(j, [], h, i), (k = j.length);
            while (k--) (l = j[k]) && (r[n[k]] = !(q[n[k]] = l));
          }
          if (f) {
            if (e || a) {
              if (e) {
                (j = []), (k = r.length);
                while (k--) (l = r[k]) && j.push((q[k] = l));
                e(null, (r = []), j, i);
              }
              k = r.length;
              while (k--) (l = r[k]) && (j = e ? I.call(f, l) : m[k]) > -1 && (f[j] = !(g[j] = l));
            }
          } else
            (r = sb(r === g ? r.splice(o, r.length) : r)), e ? e(null, g, r, i) : G.apply(g, r);
        })
      );
    }
    function ub(a) {
      for (
        var b,
          c,
          e,
          f = a.length,
          g = d.relative[a[0].type],
          i = g || d.relative[' '],
          j = g ? 1 : 0,
          k = qb(a => a === b, i, !0),
          l = qb(a => I.call(b, a) > -1, i, !0),
          m = [
            function(a, c, d) {
              return (!g && (d || c !== h)) || ((b = c).nodeType ? k(a, c, d) : l(a, c, d));
            },
          ];
        f > j;
        j++
      )
        if ((c = d.relative[a[j].type])) m = [qb(rb(m), c)];
        else {
          if (((c = d.filter[a[j].type].apply(null, a[j].matches)), c[s])) {
            for (e = ++j; f > e; e++) if (d.relative[a[e].type]) break;
            return tb(
              j > 1 && rb(m),
              j > 1 &&
                pb(a.slice(0, j - 1).concat({ value: a[j - 2].type === ' ' ? '*' : '' })).replace(
                  P,
                  '$1'
                ),
              c,
              e > j && ub(a.slice(j, e)),
              f > e && ub((a = a.slice(e))),
              f > e && pb(a)
            );
          }
          m.push(c);
        }
      return rb(m);
    }
    function vb(a, b) {
      let c = b.length > 0,
        e = a.length > 0,
        f = function(f, g, i, j, k) {
          let m,
            n,
            o,
            p = 0,
            q = '0',
            r = f && [],
            s = [],
            t = h,
            v = f || (e && d.find.TAG('*', k)),
            w = (u += t == null ? 1 : Math.random() || 0.1),
            x = v.length;
          for (k && (h = g !== l && g); q !== x && (m = v[q]) != null; q++) {
            if (e && m) {
              n = 0;
              while ((o = a[n++]))
                if (o(m, g, i)) {
                  j.push(m);
                  break;
                }
              k && (u = w);
            }
            c && ((m = !o && m) && p--, f && r.push(m));
          }
          if (((p += q), c && q !== p)) {
            n = 0;
            while ((o = b[n++])) o(r, s, g, i);
            if (f) {
              if (p > 0) while (q--) r[q] || s[q] || (s[q] = E.call(j));
              s = sb(s);
            }
            G.apply(j, s), k && !f && s.length > 0 && p + b.length > 1 && db.uniqueSort(j);
          }
          return k && ((u = w), (h = t)), r;
        };
      return c ? fb(f) : f;
    }
    g = db.compile = function(a, b) {
      let c,
        d = [],
        e = [],
        f = y[`${a} `];
      if (!f) {
        b || (b = ob(a)), (c = b.length);
        while (c--) (f = ub(b[c])), f[s] ? d.push(f) : e.push(f);
        f = y(a, vb(e, d));
      }
      return f;
    };
    function wb(a, b, c) {
      for (let d = 0, e = b.length; e > d; d++) db(a, b[d], c);
      return c;
    }
    function xb(a, b, e, f) {
      let h,
        i,
        j,
        k,
        l,
        m = ob(a);
      if (!f && m.length === 1) {
        if (
          ((i = m[0] = m[0].slice(0)),
          i.length > 2 &&
            (j = i[0]).type === 'ID' &&
            c.getById &&
            b.nodeType === 9 &&
            n &&
            d.relative[i[1].type])
        ) {
          if (((b = (d.find.ID(j.matches[0].replace(ab, bb), b) || [])[0]), !b)) return e;
          a = a.slice(i.shift().value.length);
        }
        h = V.needsContext.test(a) ? 0 : i.length;
        while (h--) {
          if (((j = i[h]), d.relative[(k = j.type)])) break;
          if (
            (l = d.find[k]) &&
            (f = l(j.matches[0].replace(ab, bb), ($.test(i[0].type) && mb(b.parentNode)) || b))
          ) {
            if ((i.splice(h, 1), (a = f.length && pb(i)), !a)) return G.apply(e, f), e;
            break;
          }
        }
      }
      return g(a, m)(f, b, !n, e, ($.test(a) && mb(b.parentNode)) || b), e;
    }
    return (
      (c.sortStable =
        s
          .split('')
          .sort(z)
          .join('') === s),
      (c.detectDuplicates = !!j),
      k(),
      (c.sortDetached = gb(a => 1 & a.compareDocumentPosition(l.createElement('div')))),
      gb(a => (a.innerHTML = "<a href='#'></a>"), a.firstChild.getAttribute('href') === '#') ||
        hb(
          'type|href|height|width',
          (a, b, c) => (c ? void 0 : a.getAttribute(b, b.toLowerCase() === 'type' ? 1 : 2))
        ),
      (c.attributes &&
        gb(
          a => (
            (a.innerHTML = '<input/>'),
            a.firstChild.setAttribute('value', ''),
            a.firstChild.getAttribute('value') === ''
          )
        )) ||
        hb(
          'value',
          (a, b, c) => (c || a.nodeName.toLowerCase() !== 'input' ? void 0 : a.defaultValue)
        ),
      gb(a => a.getAttribute('disabled') == null) ||
        hb(J, (a, b, c) => {
          let d;
          return c
            ? void 0
            : a[b] === !0
              ? b.toLowerCase()
              : (d = a.getAttributeNode(b)) && d.specified ? d.value : null;
        }),
      db
    );
  })(a);
  (n.find = t),
    (n.expr = t.selectors),
    (n.expr[':'] = n.expr.pseudos),
    (n.unique = t.uniqueSort),
    (n.text = t.getText),
    (n.isXMLDoc = t.isXML),
    (n.contains = t.contains);
  let u = n.expr.match.needsContext,
    v = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
    w = /^.[^:#\[\.,]*$/;
  function x(a, b, c) {
    if (n.isFunction(b)) return n.grep(a, (a, d) => !!b.call(a, d, a) !== c);
    if (b.nodeType) return n.grep(a, a => (a === b) !== c);
    if (typeof b === 'string') {
      if (w.test(b)) return n.filter(b, a, c);
      b = n.filter(b, a);
    }
    return n.grep(a, a => n.inArray(a, b) >= 0 !== c);
  }
  (n.filter = function(a, b, c) {
    const d = b[0];
    return (
      c && (a = `:not(${a})`),
      b.length === 1 && d.nodeType === 1
        ? n.find.matchesSelector(d, a) ? [d] : []
        : n.find.matches(a, n.grep(b, a => a.nodeType === 1))
    );
  }),
    n.fn.extend({
      find(a) {
        let b,
          c = [],
          d = this,
          e = d.length;
        if (typeof a !== 'string')
          return this.pushStack(
            n(a).filter(function() {
              for (b = 0; e > b; b++) if (n.contains(d[b], this)) return !0;
            })
          );
        for (b = 0; e > b; b++) n.find(a, d[b], c);
        return (
          (c = this.pushStack(e > 1 ? n.unique(c) : c)),
          (c.selector = this.selector ? `${this.selector} ${a}` : a),
          c
        );
      },
      filter(a) {
        return this.pushStack(x(this, a || [], !1));
      },
      not(a) {
        return this.pushStack(x(this, a || [], !0));
      },
      is(a) {
        return !!x(this, typeof a === 'string' && u.test(a) ? n(a) : a || [], !1).length;
      },
    });
  let y,
    z = a.document,
    A = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,
    B = (n.fn.init = function(a, b) {
      let c, d;
      if (!a) return this;
      if (typeof a === 'string') {
        if (
          ((c =
            a.charAt(0) === '<' && a.charAt(a.length - 1) === '>' && a.length >= 3
              ? [null, a, null]
              : A.exec(a)),
          !c || (!c[1] && b))
        )
          return !b || b.jquery ? (b || y).find(a) : this.constructor(b).find(a);
        if (c[1]) {
          if (
            ((b = b instanceof n ? b[0] : b),
            n.merge(this, n.parseHTML(c[1], b && b.nodeType ? b.ownerDocument || b : z, !0)),
            v.test(c[1]) && n.isPlainObject(b))
          )
            for (c in b) n.isFunction(this[c]) ? this[c](b[c]) : this.attr(c, b[c]);
          return this;
        }
        if (((d = z.getElementById(c[2])), d && d.parentNode)) {
          if (d.id !== c[2]) return y.find(a);
          (this.length = 1), (this[0] = d);
        }
        return (this.context = z), (this.selector = a), this;
      }
      return a.nodeType
        ? ((this.context = this[0] = a), (this.length = 1), this)
        : n.isFunction(a)
          ? typeof y.ready !== 'undefined' ? y.ready(a) : a(n)
          : (void 0 !== a.selector && ((this.selector = a.selector), (this.context = a.context)),
            n.makeArray(a, this));
    });
  (B.prototype = n.fn), (y = n(z));
  let C = /^(?:parents|prev(?:Until|All))/,
    D = { children: !0, contents: !0, next: !0, prev: !0 };
  n.extend({
    dir(a, b, c) {
      let d = [],
        e = a[b];
      while (e && e.nodeType !== 9 && (void 0 === c || e.nodeType !== 1 || !n(e).is(c)))
        e.nodeType === 1 && d.push(e), (e = e[b]);
      return d;
    },
    sibling(a, b) {
      for (var c = []; a; a = a.nextSibling) a.nodeType === 1 && a !== b && c.push(a);
      return c;
    },
  }),
    n.fn.extend({
      has(a) {
        let b,
          c = n(a, this),
          d = c.length;
        return this.filter(function() {
          for (b = 0; d > b; b++) if (n.contains(this, c[b])) return !0;
        });
      },
      closest(a, b) {
        for (
          var c,
            d = 0,
            e = this.length,
            f = [],
            g = u.test(a) || typeof a !== 'string' ? n(a, b || this.context) : 0;
          e > d;
          d++
        )
          for (c = this[d]; c && c !== b; c = c.parentNode)
            if (
              c.nodeType < 11 &&
              (g ? g.index(c) > -1 : c.nodeType === 1 && n.find.matchesSelector(c, a))
            ) {
              f.push(c);
              break;
            }
        return this.pushStack(f.length > 1 ? n.unique(f) : f);
      },
      index(a) {
        return a
          ? typeof a === 'string' ? n.inArray(this[0], n(a)) : n.inArray(a.jquery ? a[0] : a, this)
          : this[0] && this[0].parentNode ? this.first().prevAll().length : -1;
      },
      add(a, b) {
        return this.pushStack(n.unique(n.merge(this.get(), n(a, b))));
      },
      addBack(a) {
        return this.add(a == null ? this.prevObject : this.prevObject.filter(a));
      },
    });
  function E(a, b) {
    do a = a[b];
    while (a && a.nodeType !== 1);
    return a;
  }
  n.each(
    {
      parent(a) {
        const b = a.parentNode;
        return b && b.nodeType !== 11 ? b : null;
      },
      parents(a) {
        return n.dir(a, 'parentNode');
      },
      parentsUntil(a, b, c) {
        return n.dir(a, 'parentNode', c);
      },
      next(a) {
        return E(a, 'nextSibling');
      },
      prev(a) {
        return E(a, 'previousSibling');
      },
      nextAll(a) {
        return n.dir(a, 'nextSibling');
      },
      prevAll(a) {
        return n.dir(a, 'previousSibling');
      },
      nextUntil(a, b, c) {
        return n.dir(a, 'nextSibling', c);
      },
      prevUntil(a, b, c) {
        return n.dir(a, 'previousSibling', c);
      },
      siblings(a) {
        return n.sibling((a.parentNode || {}).firstChild, a);
      },
      children(a) {
        return n.sibling(a.firstChild);
      },
      contents(a) {
        return n.nodeName(a, 'iframe')
          ? a.contentDocument || a.contentWindow.document
          : n.merge([], a.childNodes);
      },
    },
    (a, b) => {
      n.fn[a] = function(c, d) {
        let e = n.map(this, b, c);
        return (
          a.slice(-5) !== 'Until' && (d = c),
          d && typeof d === 'string' && (e = n.filter(d, e)),
          this.length > 1 && (D[a] || (e = n.unique(e)), C.test(a) && (e = e.reverse())),
          this.pushStack(e)
        );
      };
    }
  );
  let F = /\S+/g,
    G = {};
  function H(a) {
    const b = (G[a] = {});
    return (
      n.each(a.match(F) || [], (a, c) => {
        b[c] = !0;
      }),
      b
    );
  }
  (n.Callbacks = function(a) {
    a = typeof a === 'string' ? G[a] || H(a) : n.extend({}, a);
    var b,
      c,
      d,
      e,
      f,
      g,
      h = [],
      i = !a.once && [],
      j = function(l) {
        for (c = a.memory && l, d = !0, f = g || 0, g = 0, e = h.length, b = !0; h && e > f; f++)
          if (h[f].apply(l[0], l[1]) === !1 && a.stopOnFalse) {
            c = !1;
            break;
          }
        (b = !1), h && (i ? i.length && j(i.shift()) : c ? (h = []) : k.disable());
      },
      k = {
        add() {
          if (h) {
            const d = h.length;
            !(function f(b) {
              n.each(b, (b, c) => {
                const d = n.type(c);
                d === 'function'
                  ? (a.unique && k.has(c)) || h.push(c)
                  : c && c.length && d !== 'string' && f(c);
              });
            })(arguments),
              b ? (e = h.length) : c && ((g = d), j(c));
          }
          return this;
        },
        remove() {
          return (
            h &&
              n.each(arguments, (a, c) => {
                let d;
                while ((d = n.inArray(c, h, d)) > -1)
                  h.splice(d, 1), b && (e >= d && e--, f >= d && f--);
              }),
            this
          );
        },
        has(a) {
          return a ? n.inArray(a, h) > -1 : !(!h || !h.length);
        },
        empty() {
          return (h = []), (e = 0), this;
        },
        disable() {
          return (h = i = c = void 0), this;
        },
        disabled() {
          return !h;
        },
        lock() {
          return (i = void 0), c || k.disable(), this;
        },
        locked() {
          return !i;
        },
        fireWith(a, c) {
          return (
            !h ||
              (d && !i) ||
              ((c = c || []), (c = [a, c.slice ? c.slice() : c]), b ? i.push(c) : j(c)),
            this
          );
        },
        fire() {
          return k.fireWith(this, arguments), this;
        },
        fired() {
          return !!d;
        },
      };
    return k;
  }),
    n.extend({
      Deferred(a) {
        var b = [
            ['resolve', 'done', n.Callbacks('once memory'), 'resolved'],
            ['reject', 'fail', n.Callbacks('once memory'), 'rejected'],
            ['notify', 'progress', n.Callbacks('memory')],
          ],
          c = 'pending',
          d = {
            state() {
              return c;
            },
            always() {
              return e.done(arguments).fail(arguments), this;
            },
            then() {
              let a = arguments;
              return n
                .Deferred(c => {
                  n.each(b, (b, f) => {
                    const g = n.isFunction(a[b]) && a[b];
                    e[f[1]](function() {
                      const a = g && g.apply(this, arguments);
                      a && n.isFunction(a.promise)
                        ? a
                            .promise()
                            .done(c.resolve)
                            .fail(c.reject)
                            .progress(c.notify)
                        : c[`${f[0]}With`](this === d ? c.promise() : this, g ? [a] : arguments);
                    });
                  }),
                    (a = null);
                })
                .promise();
            },
            promise(a) {
              return a != null ? n.extend(a, d) : d;
            },
          },
          e = {};
        return (
          (d.pipe = d.then),
          n.each(b, (a, f) => {
            let g = f[2],
              h = f[3];
            (d[f[1]] = g.add),
              h &&
                g.add(
                  () => {
                    c = h;
                  },
                  b[1 ^ a][2].disable,
                  b[2][2].lock
                ),
              (e[f[0]] = function() {
                return e[`${f[0]}With`](this === e ? d : this, arguments), this;
              }),
              (e[`${f[0]}With`] = g.fireWith);
          }),
          d.promise(e),
          a && a.call(e, e),
          e
        );
      },
      when(a) {
        let b = 0,
          c = d.call(arguments),
          e = c.length,
          f = e !== 1 || (a && n.isFunction(a.promise)) ? e : 0,
          g = f === 1 ? a : n.Deferred(),
          h = function(a, b, c) {
            return function(e) {
              (b[a] = this),
                (c[a] = arguments.length > 1 ? d.call(arguments) : e),
                c === i ? g.notifyWith(b, c) : --f || g.resolveWith(b, c);
            };
          },
          i,
          j,
          k;
        if (e > 1)
          for (i = new Array(e), j = new Array(e), k = new Array(e); e > b; b++)
            c[b] && n.isFunction(c[b].promise)
              ? c[b]
                  .promise()
                  .done(h(b, k, c))
                  .fail(g.reject)
                  .progress(h(b, j, i))
              : --f;
        return f || g.resolveWith(k, c), g.promise();
      },
    });
  let I;
  (n.fn.ready = function(a) {
    return n.ready.promise().done(a), this;
  }),
    n.extend({
      isReady: !1,
      readyWait: 1,
      holdReady(a) {
        a ? n.readyWait++ : n.ready(!0);
      },
      ready(a) {
        if (a === !0 ? !--n.readyWait : !n.isReady) {
          if (!z.body) return setTimeout(n.ready);
          (n.isReady = !0),
            (a !== !0 && --n.readyWait > 0) ||
              (I.resolveWith(z, [n]),
              n.fn.trigger &&
                n(z)
                  .trigger('ready')
                  .off('ready'));
        }
      },
    });
  function J() {
    z.addEventListener
      ? (z.removeEventListener('DOMContentLoaded', K, !1), a.removeEventListener('load', K, !1))
      : (z.detachEvent('onreadystatechange', K), a.detachEvent('onload', K));
  }
  function K() {
    (z.addEventListener || event.type === 'load' || z.readyState === 'complete') &&
      (J(), n.ready());
  }
  n.ready.promise = function(b) {
    if (!I)
      if (((I = n.Deferred()), z.readyState === 'complete')) setTimeout(n.ready);
      else if (z.addEventListener)
        z.addEventListener('DOMContentLoaded', K, !1), a.addEventListener('load', K, !1);
      else {
        z.attachEvent('onreadystatechange', K), a.attachEvent('onload', K);
        let c = !1;
        try {
          c = a.frameElement == null && z.documentElement;
        } catch (d) {}
        c &&
          c.doScroll &&
          !(function e() {
            if (!n.isReady) {
              try {
                c.doScroll('left');
              } catch (a) {
                return setTimeout(e, 50);
              }
              J(), n.ready();
            }
          })();
      }
    return I.promise(b);
  };
  let L = 'undefined',
    M;
  for (M in n(l)) break;
  (l.ownLast = M !== '0'),
    (l.inlineBlockNeedsLayout = !1),
    n(() => {
      let a,
        b,
        c = z.getElementsByTagName('body')[0];
      c &&
        ((a = z.createElement('div')),
        (a.style.cssText =
          'border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px'),
        (b = z.createElement('div')),
        c.appendChild(a).appendChild(b),
        typeof b.style.zoom !== L &&
          ((b.style.cssText = 'border:0;margin:0;width:1px;padding:1px;display:inline;zoom:1'),
          (l.inlineBlockNeedsLayout = b.offsetWidth === 3) && (c.style.zoom = 1)),
        c.removeChild(a),
        (a = b = null));
    }),
    (function() {
      let a = z.createElement('div');
      if (l.deleteExpando == null) {
        l.deleteExpando = !0;
        try {
          delete a.test;
        } catch (b) {
          l.deleteExpando = !1;
        }
      }
      a = null;
    })(),
    (n.acceptData = function(a) {
      let b = n.noData[`${a.nodeName} `.toLowerCase()],
        c = +a.nodeType || 1;
      return c !== 1 && c !== 9 ? !1 : !b || (b !== !0 && a.getAttribute('classid') === b);
    });
  let N = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
    O = /([A-Z])/g;
  function P(a, b, c) {
    if (void 0 === c && a.nodeType === 1) {
      const d = `data-${b.replace(O, '-$1').toLowerCase()}`;
      if (((c = a.getAttribute(d)), typeof c === 'string')) {
        try {
          c =
            c === 'true'
              ? !0
              : c === 'false'
                ? !1
                : c === 'null' ? null : `${+c}` === c ? +c : N.test(c) ? n.parseJSON(c) : c;
        } catch (e) {}
        n.data(a, b, c);
      } else c = void 0;
    }
    return c;
  }
  function Q(a) {
    let b;
    for (b in a) if ((b !== 'data' || !n.isEmptyObject(a[b])) && b !== 'toJSON') return !1;
    return !0;
  }
  function R(a, b, d, e) {
    if (n.acceptData(a)) {
      let f,
        g,
        h = n.expando,
        i = a.nodeType,
        j = i ? n.cache : a,
        k = i ? a[h] : a[h] && h;
      if ((k && j[k] && (e || j[k].data)) || void 0 !== d || typeof b !== 'string')
        return (
          k || (k = i ? (a[h] = c.pop() || n.guid++) : h),
          j[k] || (j[k] = i ? {} : { toJSON: n.noop }),
          (typeof b === 'object' || typeof b === 'function') &&
            (e ? (j[k] = n.extend(j[k], b)) : (j[k].data = n.extend(j[k].data, b))),
          (g = j[k]),
          e || (g.data || (g.data = {}), (g = g.data)),
          void 0 !== d && (g[n.camelCase(b)] = d),
          typeof b === 'string' ? ((f = g[b]), f == null && (f = g[n.camelCase(b)])) : (f = g),
          f
        );
    }
  }
  function S(a, b, c) {
    if (n.acceptData(a)) {
      let d,
        e,
        f = a.nodeType,
        g = f ? n.cache : a,
        h = f ? a[n.expando] : n.expando;
      if (g[h]) {
        if (b && (d = c ? g[h] : g[h].data)) {
          n.isArray(b)
            ? (b = b.concat(n.map(b, n.camelCase)))
            : b in d ? (b = [b]) : ((b = n.camelCase(b)), (b = b in d ? [b] : b.split(' '))),
            (e = b.length);
          while (e--) delete d[b[e]];
          if (c ? !Q(d) : !n.isEmptyObject(d)) return;
        }
        (c || (delete g[h].data, Q(g[h]))) &&
          (f
            ? n.cleanData([a], !0)
            : l.deleteExpando || g != g.window ? delete g[h] : (g[h] = null));
      }
    }
  }
  n.extend({
    cache: {},
    noData: {
      'applet ': !0,
      'embed ': !0,
      'object ': 'clsid:D27CDB6E-AE6D-11cf-96B8-444553540000',
    },
    hasData(a) {
      return (a = a.nodeType ? n.cache[a[n.expando]] : a[n.expando]), !!a && !Q(a);
    },
    data(a, b, c) {
      return R(a, b, c);
    },
    removeData(a, b) {
      return S(a, b);
    },
    _data(a, b, c) {
      return R(a, b, c, !0);
    },
    _removeData(a, b) {
      return S(a, b, !0);
    },
  }),
    n.fn.extend({
      data(a, b) {
        let c,
          d,
          e,
          f = this[0],
          g = f && f.attributes;
        if (void 0 === a) {
          if (this.length && ((e = n.data(f)), f.nodeType === 1 && !n._data(f, 'parsedAttrs'))) {
            c = g.length;
            while (c--)
              (d = g[c].name),
                d.indexOf('data-') === 0 && ((d = n.camelCase(d.slice(5))), P(f, d, e[d]));
            n._data(f, 'parsedAttrs', !0);
          }
          return e;
        }
        return typeof a === 'object'
          ? this.each(function() {
              n.data(this, a);
            })
          : arguments.length > 1
            ? this.each(function() {
                n.data(this, a, b);
              })
            : f ? P(f, a, n.data(f, a)) : void 0;
      },
      removeData(a) {
        return this.each(function() {
          n.removeData(this, a);
        });
      },
    }),
    n.extend({
      queue(a, b, c) {
        let d;
        return a
          ? ((b = `${b || 'fx'}queue`),
            (d = n._data(a, b)),
            c && (!d || n.isArray(c) ? (d = n._data(a, b, n.makeArray(c))) : d.push(c)),
            d || [])
          : void 0;
      },
      dequeue(a, b) {
        b = b || 'fx';
        let c = n.queue(a, b),
          d = c.length,
          e = c.shift(),
          f = n._queueHooks(a, b),
          g = function() {
            n.dequeue(a, b);
          };
        e === 'inprogress' && ((e = c.shift()), d--),
          e && (b === 'fx' && c.unshift('inprogress'), delete f.stop, e.call(a, g, f)),
          !d && f && f.empty.fire();
      },
      _queueHooks(a, b) {
        const c = `${b}queueHooks`;
        return (
          n._data(a, c) ||
          n._data(a, c, {
            empty: n.Callbacks('once memory').add(() => {
              n._removeData(a, `${b}queue`), n._removeData(a, c);
            }),
          })
        );
      },
    }),
    n.fn.extend({
      queue(a, b) {
        let c = 2;
        return (
          typeof a !== 'string' && ((b = a), (a = 'fx'), c--),
          arguments.length < c
            ? n.queue(this[0], a)
            : void 0 === b
              ? this
              : this.each(function() {
                  const c = n.queue(this, a, b);
                  n._queueHooks(this, a), a === 'fx' && c[0] !== 'inprogress' && n.dequeue(this, a);
                })
        );
      },
      dequeue(a) {
        return this.each(function() {
          n.dequeue(this, a);
        });
      },
      clearQueue(a) {
        return this.queue(a || 'fx', []);
      },
      promise(a, b) {
        let c,
          d = 1,
          e = n.Deferred(),
          f = this,
          g = this.length,
          h = function() {
            --d || e.resolveWith(f, [f]);
          };
        typeof a !== 'string' && ((b = a), (a = void 0)), (a = a || 'fx');
        while (g--) (c = n._data(f[g], `${a}queueHooks`)), c && c.empty && (d++, c.empty.add(h));
        return h(), e.promise(b);
      },
    });
  let T = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,
    U = ['Top', 'Right', 'Bottom', 'Left'],
    V = function(a, b) {
      return (a = b || a), n.css(a, 'display') === 'none' || !n.contains(a.ownerDocument, a);
    },
    W = (n.access = function(a, b, c, d, e, f, g) {
      let h = 0,
        i = a.length,
        j = c == null;
      if (n.type(c) === 'object') {
        e = !0;
        for (h in c) n.access(a, b, h, c[h], !0, f, g);
      } else if (
        void 0 !== d &&
        ((e = !0),
        n.isFunction(d) || (g = !0),
        j &&
          (g
            ? (b.call(a, d), (b = null))
            : ((j = b),
              (b = function(a, b, c) {
                return j.call(n(a), c);
              }))),
        b)
      )
        for (; i > h; h++) b(a[h], c, g ? d : d.call(a[h], h, b(a[h], c)));
      return e ? a : j ? b.call(a) : i ? b(a[0], c) : f;
    }),
    X = /^(?:checkbox|radio)$/i;
  !(function() {
    let a = z.createDocumentFragment(),
      b = z.createElement('div'),
      c = z.createElement('input');
    if (
      (b.setAttribute('className', 't'),
      (b.innerHTML = "  <link/><table></table><a href='/a'>a</a>"),
      (l.leadingWhitespace = b.firstChild.nodeType === 3),
      (l.tbody = !b.getElementsByTagName('tbody').length),
      (l.htmlSerialize = !!b.getElementsByTagName('link').length),
      (l.html5Clone = z.createElement('nav').cloneNode(!0).outerHTML !== '<:nav></:nav>'),
      (c.type = 'checkbox'),
      (c.checked = !0),
      a.appendChild(c),
      (l.appendChecked = c.checked),
      (b.innerHTML = '<textarea>x</textarea>'),
      (l.noCloneChecked = !!b.cloneNode(!0).lastChild.defaultValue),
      a.appendChild(b),
      (b.innerHTML = "<input type='radio' checked='checked' name='t'/>"),
      (l.checkClone = b.cloneNode(!0).cloneNode(!0).lastChild.checked),
      (l.noCloneEvent = !0),
      b.attachEvent &&
        (b.attachEvent('onclick', () => {
          l.noCloneEvent = !1;
        }),
        b.cloneNode(!0).click()),
      l.deleteExpando == null)
    ) {
      l.deleteExpando = !0;
      try {
        delete b.test;
      } catch (d) {
        l.deleteExpando = !1;
      }
    }
    a = b = c = null;
  })(),
    (function() {
      let b,
        c,
        d = z.createElement('div');
      for (b in { submit: !0, change: !0, focusin: !0 })
        (c = `on${b}`),
          (l[`${b}Bubbles`] = c in a) ||
            (d.setAttribute(c, 't'), (l[`${b}Bubbles`] = d.attributes[c].expando === !1));
      d = null;
    })();
  let Y = /^(?:input|select|textarea)$/i,
    Z = /^key/,
    $ = /^(?:mouse|contextmenu)|click/,
    _ = /^(?:focusinfocus|focusoutblur)$/,
    ab = /^([^.]*)(?:\.(.+)|)$/;
  function bb() {
    return !0;
  }
  function cb() {
    return !1;
  }
  function db() {
    try {
      return z.activeElement;
    } catch (a) {}
  }
  (n.event = {
    global: {},
    add(a, b, c, d, e) {
      let f,
        g,
        h,
        i,
        j,
        k,
        l,
        m,
        o,
        p,
        q,
        r = n._data(a);
      if (r) {
        c.handler && ((i = c), (c = i.handler), (e = i.selector)),
          c.guid || (c.guid = n.guid++),
          (g = r.events) || (g = r.events = {}),
          (k = r.handle) ||
            ((k = r.handle = function(a) {
              return typeof n === L || (a && n.event.triggered === a.type)
                ? void 0
                : n.event.dispatch.apply(k.elem, arguments);
            }),
            (k.elem = a)),
          (b = (b || '').match(F) || ['']),
          (h = b.length);
        while (h--)
          (f = ab.exec(b[h]) || []),
            (o = q = f[1]),
            (p = (f[2] || '').split('.').sort()),
            o &&
              ((j = n.event.special[o] || {}),
              (o = (e ? j.delegateType : j.bindType) || o),
              (j = n.event.special[o] || {}),
              (l = n.extend(
                {
                  type: o,
                  origType: q,
                  data: d,
                  handler: c,
                  guid: c.guid,
                  selector: e,
                  needsContext: e && n.expr.match.needsContext.test(e),
                  namespace: p.join('.'),
                },
                i
              )),
              (m = g[o]) ||
                ((m = g[o] = []),
                (m.delegateCount = 0),
                (j.setup && j.setup.call(a, d, p, k) !== !1) ||
                  (a.addEventListener
                    ? a.addEventListener(o, k, !1)
                    : a.attachEvent && a.attachEvent(`on${o}`, k))),
              j.add && (j.add.call(a, l), l.handler.guid || (l.handler.guid = c.guid)),
              e ? m.splice(m.delegateCount++, 0, l) : m.push(l),
              (n.event.global[o] = !0));
        a = null;
      }
    },
    remove(a, b, c, d, e) {
      let f,
        g,
        h,
        i,
        j,
        k,
        l,
        m,
        o,
        p,
        q,
        r = n.hasData(a) && n._data(a);
      if (r && (k = r.events)) {
        (b = (b || '').match(F) || ['']), (j = b.length);
        while (j--)
          if (
            ((h = ab.exec(b[j]) || []), (o = q = h[1]), (p = (h[2] || '').split('.').sort()), o)
          ) {
            (l = n.event.special[o] || {}),
              (o = (d ? l.delegateType : l.bindType) || o),
              (m = k[o] || []),
              (h = h[2] && new RegExp(`(^|\\.)${p.join('\\.(?:.*\\.|)')}(\\.|$)`)),
              (i = f = m.length);
            while (f--)
              (g = m[f]),
                (!e && q !== g.origType) ||
                  (c && c.guid !== g.guid) ||
                  (h && !h.test(g.namespace)) ||
                  (d && d !== g.selector && (d !== '**' || !g.selector)) ||
                  (m.splice(f, 1),
                  g.selector && m.delegateCount--,
                  l.remove && l.remove.call(a, g));
            i &&
              !m.length &&
              ((l.teardown && l.teardown.call(a, p, r.handle) !== !1) ||
                n.removeEvent(a, o, r.handle),
              delete k[o]);
          } else for (o in k) n.event.remove(a, o + b[j], c, d, !0);
        n.isEmptyObject(k) && (delete r.handle, n._removeData(a, 'events'));
      }
    },
    trigger(b, c, d, e) {
      let f,
        g,
        h,
        i,
        k,
        l,
        m,
        o = [d || z],
        p = j.call(b, 'type') ? b.type : b,
        q = j.call(b, 'namespace') ? b.namespace.split('.') : [];
      if (
        ((h = l = d = d || z),
        d.nodeType !== 3 &&
          d.nodeType !== 8 &&
          !_.test(p + n.event.triggered) &&
          (p.indexOf('.') >= 0 && ((q = p.split('.')), (p = q.shift()), q.sort()),
          (g = p.indexOf(':') < 0 && `on${p}`),
          (b = b[n.expando] ? b : new n.Event(p, typeof b === 'object' && b)),
          (b.isTrigger = e ? 2 : 3),
          (b.namespace = q.join('.')),
          (b.namespace_re = b.namespace
            ? new RegExp(`(^|\\.)${q.join('\\.(?:.*\\.|)')}(\\.|$)`)
            : null),
          (b.result = void 0),
          b.target || (b.target = d),
          (c = c == null ? [b] : n.makeArray(c, [b])),
          (k = n.event.special[p] || {}),
          e || !k.trigger || k.trigger.apply(d, c) !== !1))
      ) {
        if (!e && !k.noBubble && !n.isWindow(d)) {
          for (i = k.delegateType || p, _.test(i + p) || (h = h.parentNode); h; h = h.parentNode)
            o.push(h), (l = h);
          l === (d.ownerDocument || z) && o.push(l.defaultView || l.parentWindow || a);
        }
        m = 0;
        while ((h = o[m++]) && !b.isPropagationStopped())
          (b.type = m > 1 ? i : k.bindType || p),
            (f = (n._data(h, 'events') || {})[b.type] && n._data(h, 'handle')),
            f && f.apply(h, c),
            (f = g && h[g]),
            f &&
              f.apply &&
              n.acceptData(h) &&
              ((b.result = f.apply(h, c)), b.result === !1 && b.preventDefault());
        if (
          ((b.type = p),
          !e &&
            !b.isDefaultPrevented() &&
            (!k._default || k._default.apply(o.pop(), c) === !1) &&
            n.acceptData(d) &&
            g &&
            d[p] &&
            !n.isWindow(d))
        ) {
          (l = d[g]), l && (d[g] = null), (n.event.triggered = p);
          try {
            d[p]();
          } catch (r) {}
          (n.event.triggered = void 0), l && (d[g] = l);
        }
        return b.result;
      }
    },
    dispatch(a) {
      a = n.event.fix(a);
      let b,
        c,
        e,
        f,
        g,
        h = [],
        i = d.call(arguments),
        j = (n._data(this, 'events') || {})[a.type] || [],
        k = n.event.special[a.type] || {};
      if (
        ((i[0] = a),
        (a.delegateTarget = this),
        !k.preDispatch || k.preDispatch.call(this, a) !== !1)
      ) {
        (h = n.event.handlers.call(this, a, j)), (b = 0);
        while ((f = h[b++]) && !a.isPropagationStopped()) {
          (a.currentTarget = f.elem), (g = 0);
          while ((e = f.handlers[g++]) && !a.isImmediatePropagationStopped())
            (!a.namespace_re || a.namespace_re.test(e.namespace)) &&
              ((a.handleObj = e),
              (a.data = e.data),
              (c = ((n.event.special[e.origType] || {}).handle || e.handler).apply(f.elem, i)),
              void 0 !== c && (a.result = c) === !1 && (a.preventDefault(), a.stopPropagation()));
        }
        return k.postDispatch && k.postDispatch.call(this, a), a.result;
      }
    },
    handlers(a, b) {
      let c,
        d,
        e,
        f,
        g = [],
        h = b.delegateCount,
        i = a.target;
      if (h && i.nodeType && (!a.button || a.type !== 'click'))
        for (; i != this; i = i.parentNode || this)
          if (i.nodeType === 1 && (i.disabled !== !0 || a.type !== 'click')) {
            for (e = [], f = 0; h > f; f++)
              (d = b[f]),
                (c = `${d.selector} `),
                void 0 === e[c] &&
                  (e[c] = d.needsContext
                    ? n(c, this).index(i) >= 0
                    : n.find(c, this, null, [i]).length),
                e[c] && e.push(d);
            e.length && g.push({ elem: i, handlers: e });
          }
      return h < b.length && g.push({ elem: this, handlers: b.slice(h) }), g;
    },
    fix(a) {
      if (a[n.expando]) return a;
      let b,
        c,
        d,
        e = a.type,
        f = a,
        g = this.fixHooks[e];
      g || (this.fixHooks[e] = g = $.test(e) ? this.mouseHooks : Z.test(e) ? this.keyHooks : {}),
        (d = g.props ? this.props.concat(g.props) : this.props),
        (a = new n.Event(f)),
        (b = d.length);
      while (b--) (c = d[b]), (a[c] = f[c]);
      return (
        a.target || (a.target = f.srcElement || z),
        a.target.nodeType === 3 && (a.target = a.target.parentNode),
        (a.metaKey = !!a.metaKey),
        g.filter ? g.filter(a, f) : a
      );
    },
    props: 'altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which'.split(
      ' '
    ),
    fixHooks: {},
    keyHooks: {
      props: 'char charCode key keyCode'.split(' '),
      filter(a, b) {
        return a.which == null && (a.which = b.charCode != null ? b.charCode : b.keyCode), a;
      },
    },
    mouseHooks: {
      props: 'button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement'.split(
        ' '
      ),
      filter(a, b) {
        let c,
          d,
          e,
          f = b.button,
          g = b.fromElement;
        return (
          a.pageX == null &&
            b.clientX != null &&
            ((d = a.target.ownerDocument || z),
            (e = d.documentElement),
            (c = d.body),
            (a.pageX =
              b.clientX +
              ((e && e.scrollLeft) || (c && c.scrollLeft) || 0) -
              ((e && e.clientLeft) || (c && c.clientLeft) || 0)),
            (a.pageY =
              b.clientY +
              ((e && e.scrollTop) || (c && c.scrollTop) || 0) -
              ((e && e.clientTop) || (c && c.clientTop) || 0))),
          !a.relatedTarget && g && (a.relatedTarget = g === a.target ? b.toElement : g),
          a.which || void 0 === f || (a.which = 1 & f ? 1 : 2 & f ? 3 : 4 & f ? 2 : 0),
          a
        );
      },
    },
    special: {
      load: { noBubble: !0 },
      focus: {
        trigger() {
          if (this !== db() && this.focus)
            try {
              return this.focus(), !1;
            } catch (a) {}
        },
        delegateType: 'focusin',
      },
      blur: {
        trigger() {
          return this === db() && this.blur ? (this.blur(), !1) : void 0;
        },
        delegateType: 'focusout',
      },
      click: {
        trigger() {
          return n.nodeName(this, 'input') && this.type === 'checkbox' && this.click
            ? (this.click(), !1)
            : void 0;
        },
        _default(a) {
          return n.nodeName(a.target, 'a');
        },
      },
      beforeunload: {
        postDispatch(a) {
          void 0 !== a.result && (a.originalEvent.returnValue = a.result);
        },
      },
    },
    simulate(a, b, c, d) {
      const e = n.extend(new n.Event(), c, { type: a, isSimulated: !0, originalEvent: {} });
      d ? n.event.trigger(e, null, b) : n.event.dispatch.call(b, e),
        e.isDefaultPrevented() && c.preventDefault();
    },
  }),
    (n.removeEvent = z.removeEventListener
      ? function(a, b, c) {
          a.removeEventListener && a.removeEventListener(b, c, !1);
        }
      : function(a, b, c) {
          const d = `on${b}`;
          a.detachEvent && (typeof a[d] === L && (a[d] = null), a.detachEvent(d, c));
        }),
    (n.Event = function(a, b) {
      return this instanceof n.Event
        ? (a && a.type
            ? ((this.originalEvent = a),
              (this.type = a.type),
              (this.isDefaultPrevented =
                a.defaultPrevented ||
                (void 0 === a.defaultPrevented &&
                  (a.returnValue === !1 || (a.getPreventDefault && a.getPreventDefault())))
                  ? bb
                  : cb))
            : (this.type = a),
          b && n.extend(this, b),
          (this.timeStamp = (a && a.timeStamp) || n.now()),
          void (this[n.expando] = !0))
        : new n.Event(a, b);
    }),
    (n.Event.prototype = {
      isDefaultPrevented: cb,
      isPropagationStopped: cb,
      isImmediatePropagationStopped: cb,
      preventDefault() {
        const a = this.originalEvent;
        (this.isDefaultPrevented = bb),
          a && (a.preventDefault ? a.preventDefault() : (a.returnValue = !1));
      },
      stopPropagation() {
        const a = this.originalEvent;
        (this.isPropagationStopped = bb),
          a && (a.stopPropagation && a.stopPropagation(), (a.cancelBubble = !0));
      },
      stopImmediatePropagation() {
        (this.isImmediatePropagationStopped = bb), this.stopPropagation();
      },
    }),
    n.each({ mouseenter: 'mouseover', mouseleave: 'mouseout' }, (a, b) => {
      n.event.special[a] = {
        delegateType: b,
        bindType: b,
        handle(a) {
          let c,
            d = this,
            e = a.relatedTarget,
            f = a.handleObj;
          return (
            (!e || (e !== d && !n.contains(d, e))) &&
              ((a.type = f.origType), (c = f.handler.apply(this, arguments)), (a.type = b)),
            c
          );
        },
      };
    }),
    l.submitBubbles ||
      (n.event.special.submit = {
        setup() {
          return n.nodeName(this, 'form')
            ? !1
            : void n.event.add(this, 'click._submit keypress._submit', a => {
                let b = a.target,
                  c = n.nodeName(b, 'input') || n.nodeName(b, 'button') ? b.form : void 0;
                c &&
                  !n._data(c, 'submitBubbles') &&
                  (n.event.add(c, 'submit._submit', a => {
                    a._submit_bubble = !0;
                  }),
                  n._data(c, 'submitBubbles', !0));
              });
        },
        postDispatch(a) {
          a._submit_bubble &&
            (delete a._submit_bubble,
            this.parentNode && !a.isTrigger && n.event.simulate('submit', this.parentNode, a, !0));
        },
        teardown() {
          return n.nodeName(this, 'form') ? !1 : void n.event.remove(this, '._submit');
        },
      }),
    l.changeBubbles ||
      (n.event.special.change = {
        setup() {
          return Y.test(this.nodeName)
            ? ((this.type === 'checkbox' || this.type === 'radio') &&
                (n.event.add(this, 'propertychange._change', function(a) {
                  a.originalEvent.propertyName === 'checked' && (this._just_changed = !0);
                }),
                n.event.add(this, 'click._change', function(a) {
                  this._just_changed && !a.isTrigger && (this._just_changed = !1),
                    n.event.simulate('change', this, a, !0);
                })),
              !1)
            : void n.event.add(this, 'beforeactivate._change', a => {
                const b = a.target;
                Y.test(b.nodeName) &&
                  !n._data(b, 'changeBubbles') &&
                  (n.event.add(b, 'change._change', function(a) {
                    !this.parentNode ||
                      a.isSimulated ||
                      a.isTrigger ||
                      n.event.simulate('change', this.parentNode, a, !0);
                  }),
                  n._data(b, 'changeBubbles', !0));
              });
        },
        handle(a) {
          const b = a.target;
          return this !== b ||
            a.isSimulated ||
            a.isTrigger ||
            (b.type !== 'radio' && b.type !== 'checkbox')
            ? a.handleObj.handler.apply(this, arguments)
            : void 0;
        },
        teardown() {
          return n.event.remove(this, '._change'), !Y.test(this.nodeName);
        },
      }),
    l.focusinBubbles ||
      n.each({ focus: 'focusin', blur: 'focusout' }, (a, b) => {
        const c = function(a) {
          n.event.simulate(b, a.target, n.event.fix(a), !0);
        };
        n.event.special[b] = {
          setup() {
            let d = this.ownerDocument || this,
              e = n._data(d, b);
            e || d.addEventListener(a, c, !0), n._data(d, b, (e || 0) + 1);
          },
          teardown() {
            let d = this.ownerDocument || this,
              e = n._data(d, b) - 1;
            e ? n._data(d, b, e) : (d.removeEventListener(a, c, !0), n._removeData(d, b));
          },
        };
      }),
    n.fn.extend({
      on(a, b, c, d, e) {
        let f, g;
        if (typeof a === 'object') {
          typeof b !== 'string' && ((c = c || b), (b = void 0));
          for (f in a) this.on(f, b, c, a[f], e);
          return this;
        }
        if (
          (c == null && d == null
            ? ((d = b), (c = b = void 0))
            : d == null &&
              (typeof b === 'string' ? ((d = c), (c = void 0)) : ((d = c), (c = b), (b = void 0))),
          d === !1)
        )
          d = cb;
        else if (!d) return this;
        return (
          e === 1 &&
            ((g = d),
            (d = function(a) {
              return n().off(a), g.apply(this, arguments);
            }),
            (d.guid = g.guid || (g.guid = n.guid++))),
          this.each(function() {
            n.event.add(this, a, d, c, b);
          })
        );
      },
      one(a, b, c, d) {
        return this.on(a, b, c, d, 1);
      },
      off(a, b, c) {
        let d, e;
        if (a && a.preventDefault && a.handleObj)
          return (
            (d = a.handleObj),
            n(a.delegateTarget).off(
              d.namespace ? `${d.origType}.${d.namespace}` : d.origType,
              d.selector,
              d.handler
            ),
            this
          );
        if (typeof a === 'object') {
          for (e in a) this.off(e, b, a[e]);
          return this;
        }
        return (
          (b === !1 || typeof b === 'function') && ((c = b), (b = void 0)),
          c === !1 && (c = cb),
          this.each(function() {
            n.event.remove(this, a, c, b);
          })
        );
      },
      trigger(a, b) {
        return this.each(function() {
          n.event.trigger(a, b, this);
        });
      },
      triggerHandler(a, b) {
        const c = this[0];
        return c ? n.event.trigger(a, b, c, !0) : void 0;
      },
    });
  function eb(a) {
    let b = fb.split('|'),
      c = a.createDocumentFragment();
    if (c.createElement) while (b.length) c.createElement(b.pop());
    return c;
  }
  var fb =
      'abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video',
    gb = / jQuery\d+="(?:null|\d+)"/g,
    hb = new RegExp(`<(?:${fb})[\\s/>]`, 'i'),
    ib = /^\s+/,
    jb = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
    kb = /<([\w:]+)/,
    lb = /<tbody/i,
    mb = /<|&#?\w+;/,
    nb = /<(?:script|style|link)/i,
    ob = /checked\s*(?:[^=]|=\s*.checked.)/i,
    pb = /^$|\/(?:java|ecma)script/i,
    qb = /^true\/(.*)/,
    rb = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,
    sb = {
      option: [1, "<select multiple='multiple'>", '</select>'],
      legend: [1, '<fieldset>', '</fieldset>'],
      area: [1, '<map>', '</map>'],
      param: [1, '<object>', '</object>'],
      thead: [1, '<table>', '</table>'],
      tr: [2, '<table><tbody>', '</tbody></table>'],
      col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
      td: [3, '<table><tbody><tr>', '</tr></tbody></table>'],
      _default: l.htmlSerialize ? [0, '', ''] : [1, 'X<div>', '</div>'],
    },
    tb = eb(z),
    ub = tb.appendChild(z.createElement('div'));
  (sb.optgroup = sb.option),
    (sb.tbody = sb.tfoot = sb.colgroup = sb.caption = sb.thead),
    (sb.th = sb.td);
  function vb(a, b) {
    let c,
      d,
      e = 0,
      f =
        typeof a.getElementsByTagName !== L
          ? a.getElementsByTagName(b || '*')
          : typeof a.querySelectorAll !== L ? a.querySelectorAll(b || '*') : void 0;
    if (!f)
      for (f = [], c = a.childNodes || a; (d = c[e]) != null; e++)
        !b || n.nodeName(d, b) ? f.push(d) : n.merge(f, vb(d, b));
    return void 0 === b || (b && n.nodeName(a, b)) ? n.merge([a], f) : f;
  }
  function wb(a) {
    X.test(a.type) && (a.defaultChecked = a.checked);
  }
  function xb(a, b) {
    return n.nodeName(a, 'table') && n.nodeName(b.nodeType !== 11 ? b : b.firstChild, 'tr')
      ? a.getElementsByTagName('tbody')[0] || a.appendChild(a.ownerDocument.createElement('tbody'))
      : a;
  }
  function yb(a) {
    return (a.type = `${n.find.attr(a, 'type') !== null}/${a.type}`), a;
  }
  function zb(a) {
    const b = qb.exec(a.type);
    return b ? (a.type = b[1]) : a.removeAttribute('type'), a;
  }
  function Ab(a, b) {
    for (var c, d = 0; (c = a[d]) != null; d++)
      n._data(c, 'globalEval', !b || n._data(b[d], 'globalEval'));
  }
  function Bb(a, b) {
    if (b.nodeType === 1 && n.hasData(a)) {
      let c,
        d,
        e,
        f = n._data(a),
        g = n._data(b, f),
        h = f.events;
      if (h) {
        delete g.handle, (g.events = {});
        for (c in h) for (d = 0, e = h[c].length; e > d; d++) n.event.add(b, c, h[c][d]);
      }
      g.data && (g.data = n.extend({}, g.data));
    }
  }
  function Cb(a, b) {
    let c, d, e;
    if (b.nodeType === 1) {
      if (((c = b.nodeName.toLowerCase()), !l.noCloneEvent && b[n.expando])) {
        e = n._data(b);
        for (d in e.events) n.removeEvent(b, d, e.handle);
        b.removeAttribute(n.expando);
      }
      c === 'script' && b.text !== a.text
        ? ((yb(b).text = a.text), zb(b))
        : c === 'object'
          ? (b.parentNode && (b.outerHTML = a.outerHTML),
            l.html5Clone && a.innerHTML && !n.trim(b.innerHTML) && (b.innerHTML = a.innerHTML))
          : c === 'input' && X.test(a.type)
            ? ((b.defaultChecked = b.checked = a.checked),
              b.value !== a.value && (b.value = a.value))
            : c === 'option'
              ? (b.defaultSelected = b.selected = a.defaultSelected)
              : (c === 'input' || c === 'textarea') && (b.defaultValue = a.defaultValue);
    }
  }
  n.extend({
    clone(a, b, c) {
      let d,
        e,
        f,
        g,
        h,
        i = n.contains(a.ownerDocument, a);
      if (
        (l.html5Clone || n.isXMLDoc(a) || !hb.test(`<${a.nodeName}>`)
          ? (f = a.cloneNode(!0))
          : ((ub.innerHTML = a.outerHTML), ub.removeChild((f = ub.firstChild))),
        !(
          (l.noCloneEvent && l.noCloneChecked) ||
          (a.nodeType !== 1 && a.nodeType !== 11) ||
          n.isXMLDoc(a)
        ))
      )
        for (d = vb(f), h = vb(a), g = 0; (e = h[g]) != null; ++g) d[g] && Cb(e, d[g]);
      if (b)
        if (c) for (h = h || vb(a), d = d || vb(f), g = 0; (e = h[g]) != null; g++) Bb(e, d[g]);
        else Bb(a, f);
      return (
        (d = vb(f, 'script')), d.length > 0 && Ab(d, !i && vb(a, 'script')), (d = h = e = null), f
      );
    },
    buildFragment(a, b, c, d) {
      for (var e, f, g, h, i, j, k, m = a.length, o = eb(b), p = [], q = 0; m > q; q++)
        if (((f = a[q]), f || f === 0))
          if (n.type(f) === 'object') n.merge(p, f.nodeType ? [f] : f);
          else if (mb.test(f)) {
            (h = h || o.appendChild(b.createElement('div'))),
              (i = (kb.exec(f) || ['', ''])[1].toLowerCase()),
              (k = sb[i] || sb._default),
              (h.innerHTML = k[1] + f.replace(jb, '<$1></$2>') + k[2]),
              (e = k[0]);
            while (e--) h = h.lastChild;
            if (
              (!l.leadingWhitespace && ib.test(f) && p.push(b.createTextNode(ib.exec(f)[0])),
              !l.tbody)
            ) {
              (f =
                i !== 'table' || lb.test(f)
                  ? k[1] !== '<table>' || lb.test(f) ? 0 : h
                  : h.firstChild),
                (e = f && f.childNodes.length);
              while (e--)
                n.nodeName((j = f.childNodes[e]), 'tbody') &&
                  !j.childNodes.length &&
                  f.removeChild(j);
            }
            n.merge(p, h.childNodes), (h.textContent = '');
            while (h.firstChild) h.removeChild(h.firstChild);
            h = o.lastChild;
          } else p.push(b.createTextNode(f));
      h && o.removeChild(h), l.appendChecked || n.grep(vb(p, 'input'), wb), (q = 0);
      while ((f = p[q++]))
        if (
          (!d || n.inArray(f, d) === -1) &&
          ((g = n.contains(f.ownerDocument, f)),
          (h = vb(o.appendChild(f), 'script')),
          g && Ab(h),
          c)
        ) {
          e = 0;
          while ((f = h[e++])) pb.test(f.type || '') && c.push(f);
        }
      return (h = null), o;
    },
    cleanData(a, b) {
      for (
        var d, e, f, g, h = 0, i = n.expando, j = n.cache, k = l.deleteExpando, m = n.event.special;
        (d = a[h]) != null;
        h++
      )
        if ((b || n.acceptData(d)) && ((f = d[i]), (g = f && j[f]))) {
          if (g.events)
            for (e in g.events) m[e] ? n.event.remove(d, e) : n.removeEvent(d, e, g.handle);
          j[f] &&
            (delete j[f],
            k ? delete d[i] : typeof d.removeAttribute !== L ? d.removeAttribute(i) : (d[i] = null),
            c.push(f));
        }
    },
  }),
    n.fn.extend({
      text(a) {
        return W(
          this,
          function(a) {
            return void 0 === a
              ? n.text(this)
              : this.empty().append(((this[0] && this[0].ownerDocument) || z).createTextNode(a));
          },
          null,
          a,
          arguments.length
        );
      },
      append() {
        return this.domManip(arguments, function(a) {
          if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
            const b = xb(this, a);
            b.appendChild(a);
          }
        });
      },
      prepend() {
        return this.domManip(arguments, function(a) {
          if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
            const b = xb(this, a);
            b.insertBefore(a, b.firstChild);
          }
        });
      },
      before() {
        return this.domManip(arguments, function(a) {
          this.parentNode && this.parentNode.insertBefore(a, this);
        });
      },
      after() {
        return this.domManip(arguments, function(a) {
          this.parentNode && this.parentNode.insertBefore(a, this.nextSibling);
        });
      },
      remove(a, b) {
        for (var c, d = a ? n.filter(a, this) : this, e = 0; (c = d[e]) != null; e++)
          b || c.nodeType !== 1 || n.cleanData(vb(c)),
            c.parentNode &&
              (b && n.contains(c.ownerDocument, c) && Ab(vb(c, 'script')),
              c.parentNode.removeChild(c));
        return this;
      },
      empty() {
        for (var a, b = 0; (a = this[b]) != null; b++) {
          a.nodeType === 1 && n.cleanData(vb(a, !1));
          while (a.firstChild) a.removeChild(a.firstChild);
          a.options && n.nodeName(a, 'select') && (a.options.length = 0);
        }
        return this;
      },
      clone(a, b) {
        return (
          (a = a == null ? !1 : a),
          (b = b == null ? a : b),
          this.map(function() {
            return n.clone(this, a, b);
          })
        );
      },
      html(a) {
        return W(
          this,
          function(a) {
            let b = this[0] || {},
              c = 0,
              d = this.length;
            if (void 0 === a) return b.nodeType === 1 ? b.innerHTML.replace(gb, '') : void 0;
            if (
              !(
                typeof a !== 'string' ||
                nb.test(a) ||
                (!l.htmlSerialize && hb.test(a)) ||
                (!l.leadingWhitespace && ib.test(a)) ||
                sb[(kb.exec(a) || ['', ''])[1].toLowerCase()]
              )
            ) {
              a = a.replace(jb, '<$1></$2>');
              try {
                for (; d > c; c++)
                  (b = this[c] || {}),
                    b.nodeType === 1 && (n.cleanData(vb(b, !1)), (b.innerHTML = a));
                b = 0;
              } catch (e) {}
            }
            b && this.empty().append(a);
          },
          null,
          a,
          arguments.length
        );
      },
      replaceWith() {
        let a = arguments[0];
        return (
          this.domManip(arguments, function(b) {
            (a = this.parentNode), n.cleanData(vb(this)), a && a.replaceChild(b, this);
          }),
          a && (a.length || a.nodeType) ? this : this.remove()
        );
      },
      detach(a) {
        return this.remove(a, !0);
      },
      domManip(a, b) {
        a = e.apply([], a);
        let c,
          d,
          f,
          g,
          h,
          i,
          j = 0,
          k = this.length,
          m = this,
          o = k - 1,
          p = a[0],
          q = n.isFunction(p);
        if (q || (k > 1 && typeof p === 'string' && !l.checkClone && ob.test(p)))
          return this.each(function(c) {
            const d = m.eq(c);
            q && (a[0] = p.call(this, c, d.html())), d.domManip(a, b);
          });
        if (
          k &&
          ((i = n.buildFragment(a, this[0].ownerDocument, !1, this)),
          (c = i.firstChild),
          i.childNodes.length === 1 && (i = c),
          c)
        ) {
          for (g = n.map(vb(i, 'script'), yb), f = g.length; k > j; j++)
            (d = i),
              j !== o && ((d = n.clone(d, !0, !0)), f && n.merge(g, vb(d, 'script'))),
              b.call(this[j], d, j);
          if (f)
            for (h = g[g.length - 1].ownerDocument, n.map(g, zb), j = 0; f > j; j++)
              (d = g[j]),
                pb.test(d.type || '') &&
                  !n._data(d, 'globalEval') &&
                  n.contains(h, d) &&
                  (d.src
                    ? n._evalUrl && n._evalUrl(d.src)
                    : n.globalEval((d.text || d.textContent || d.innerHTML || '').replace(rb, '')));
          i = c = null;
        }
        return this;
      },
    }),
    n.each(
      {
        appendTo: 'append',
        prependTo: 'prepend',
        insertBefore: 'before',
        insertAfter: 'after',
        replaceAll: 'replaceWith',
      },
      (a, b) => {
        n.fn[a] = function(a) {
          for (var c, d = 0, e = [], g = n(a), h = g.length - 1; h >= d; d++)
            (c = d === h ? this : this.clone(!0)), n(g[d])[b](c), f.apply(e, c.get());
          return this.pushStack(e);
        };
      }
    );
  let Db,
    Eb = {};
  function Fb(b, c) {
    let d = n(c.createElement(b)).appendTo(c.body),
      e = a.getDefaultComputedStyle
        ? a.getDefaultComputedStyle(d[0]).display
        : n.css(d[0], 'display');
    return d.detach(), e;
  }
  function Gb(a) {
    let b = z,
      c = Eb[a];
    return (
      c ||
        ((c = Fb(a, b)),
        (c !== 'none' && c) ||
          ((Db = (Db || n("<iframe frameborder='0' width='0' height='0'/>")).appendTo(
            b.documentElement
          )),
          (b = (Db[0].contentWindow || Db[0].contentDocument).document),
          b.write(),
          b.close(),
          (c = Fb(a, b)),
          Db.detach()),
        (Eb[a] = c)),
      c
    );
  }
  !(function() {
    let a,
      b,
      c = z.createElement('div'),
      d =
        '-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;padding:0;margin:0;border:0';
    (c.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>"),
      (a = c.getElementsByTagName('a')[0]),
      (a.style.cssText = 'float:left;opacity:.5'),
      (l.opacity = /^0.5/.test(a.style.opacity)),
      (l.cssFloat = !!a.style.cssFloat),
      (c.style.backgroundClip = 'content-box'),
      (c.cloneNode(!0).style.backgroundClip = ''),
      (l.clearCloneStyle = c.style.backgroundClip === 'content-box'),
      (a = c = null),
      (l.shrinkWrapBlocks = function() {
        let a, c, e, f;
        if (b == null) {
          if (((a = z.getElementsByTagName('body')[0]), !a)) return;
          (f = 'border:0;width:0;height:0;position:absolute;top:0;left:-9999px'),
            (c = z.createElement('div')),
            (e = z.createElement('div')),
            a.appendChild(c).appendChild(e),
            (b = !1),
            typeof e.style.zoom !== L &&
              ((e.style.cssText = `${d};width:1px;padding:1px;zoom:1`),
              (e.innerHTML = '<div></div>'),
              (e.firstChild.style.width = '5px'),
              (b = e.offsetWidth !== 3)),
            a.removeChild(c),
            (a = c = e = null);
        }
        return b;
      });
  })();
  let Hb = /^margin/,
    Ib = new RegExp(`^(${T})(?!px)[a-z%]+$`, 'i'),
    Jb,
    Kb,
    Lb = /^(top|right|bottom|left)$/;
  a.getComputedStyle
    ? ((Jb = function(a) {
        return a.ownerDocument.defaultView.getComputedStyle(a, null);
      }),
      (Kb = function(a, b, c) {
        let d,
          e,
          f,
          g,
          h = a.style;
        return (
          (c = c || Jb(a)),
          (g = c ? c.getPropertyValue(b) || c[b] : void 0),
          c &&
            (g !== '' || n.contains(a.ownerDocument, a) || (g = n.style(a, b)),
            Ib.test(g) &&
              Hb.test(b) &&
              ((d = h.width),
              (e = h.minWidth),
              (f = h.maxWidth),
              (h.minWidth = h.maxWidth = h.width = g),
              (g = c.width),
              (h.width = d),
              (h.minWidth = e),
              (h.maxWidth = f))),
          void 0 === g ? g : `${g}`
        );
      }))
    : z.documentElement.currentStyle &&
      ((Jb = function(a) {
        return a.currentStyle;
      }),
      (Kb = function(a, b, c) {
        let d,
          e,
          f,
          g,
          h = a.style;
        return (
          (c = c || Jb(a)),
          (g = c ? c[b] : void 0),
          g == null && h && h[b] && (g = h[b]),
          Ib.test(g) &&
            !Lb.test(b) &&
            ((d = h.left),
            (e = a.runtimeStyle),
            (f = e && e.left),
            f && (e.left = a.currentStyle.left),
            (h.left = b === 'fontSize' ? '1em' : g),
            (g = `${h.pixelLeft}px`),
            (h.left = d),
            f && (e.left = f)),
          void 0 === g ? g : `${g}` || 'auto'
        );
      }));
  function Mb(a, b) {
    return {
      get() {
        const c = a();
        if (c != null) return c ? void delete this.get : (this.get = b).apply(this, arguments);
      },
    };
  }
  !(function() {
    let b,
      c,
      d,
      e,
      f,
      g,
      h = z.createElement('div'),
      i = 'border:0;width:0;height:0;position:absolute;top:0;left:-9999px',
      j =
        '-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;padding:0;margin:0;border:0';
    (h.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>"),
      (b = h.getElementsByTagName('a')[0]),
      (b.style.cssText = 'float:left;opacity:.5'),
      (l.opacity = /^0.5/.test(b.style.opacity)),
      (l.cssFloat = !!b.style.cssFloat),
      (h.style.backgroundClip = 'content-box'),
      (h.cloneNode(!0).style.backgroundClip = ''),
      (l.clearCloneStyle = h.style.backgroundClip === 'content-box'),
      (b = h = null),
      n.extend(l, {
        reliableHiddenOffsets() {
          if (c != null) return c;
          let a,
            b,
            d,
            e = z.createElement('div'),
            f = z.getElementsByTagName('body')[0];
          if (f)
            return (
              e.setAttribute('className', 't'),
              (e.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>"),
              (a = z.createElement('div')),
              (a.style.cssText = i),
              f.appendChild(a).appendChild(e),
              (e.innerHTML = '<table><tr><td></td><td>t</td></tr></table>'),
              (b = e.getElementsByTagName('td')),
              (b[0].style.cssText = 'padding:0;margin:0;border:0;display:none'),
              (d = b[0].offsetHeight === 0),
              (b[0].style.display = ''),
              (b[1].style.display = 'none'),
              (c = d && b[0].offsetHeight === 0),
              f.removeChild(a),
              (e = f = null),
              c
            );
        },
        boxSizing() {
          return d == null && k(), d;
        },
        boxSizingReliable() {
          return e == null && k(), e;
        },
        pixelPosition() {
          return f == null && k(), f;
        },
        reliableMarginRight() {
          let b, c, d, e;
          if (g == null && a.getComputedStyle) {
            if (((b = z.getElementsByTagName('body')[0]), !b)) return;
            (c = z.createElement('div')),
              (d = z.createElement('div')),
              (c.style.cssText = i),
              b.appendChild(c).appendChild(d),
              (e = d.appendChild(z.createElement('div'))),
              (e.style.cssText = d.style.cssText = j),
              (e.style.marginRight = e.style.width = '0'),
              (d.style.width = '1px'),
              (g = !parseFloat((a.getComputedStyle(e, null) || {}).marginRight)),
              b.removeChild(c);
          }
          return g;
        },
      });
    function k() {
      let b,
        c,
        h = z.getElementsByTagName('body')[0];
      h &&
        ((b = z.createElement('div')),
        (c = z.createElement('div')),
        (b.style.cssText = i),
        h.appendChild(b).appendChild(c),
        (c.style.cssText =
          '-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;position:absolute;display:block;padding:1px;border:1px;width:4px;margin-top:1%;top:1%'),
        n.swap(h, h.style.zoom != null ? { zoom: 1 } : {}, () => {
          d = c.offsetWidth === 4;
        }),
        (e = !0),
        (f = !1),
        (g = !0),
        a.getComputedStyle &&
          ((f = (a.getComputedStyle(c, null) || {}).top !== '1%'),
          (e = (a.getComputedStyle(c, null) || { width: '4px' }).width === '4px')),
        h.removeChild(b),
        (c = h = null));
    }
  })(),
    (n.swap = function(a, b, c, d) {
      let e,
        f,
        g = {};
      for (f in b) (g[f] = a.style[f]), (a.style[f] = b[f]);
      e = c.apply(a, d || []);
      for (f in b) a.style[f] = g[f];
      return e;
    });
  let Nb = /alpha\([^)]*\)/i,
    Ob = /opacity\s*=\s*([^)]*)/,
    Pb = /^(none|table(?!-c[ea]).+)/,
    Qb = new RegExp(`^(${T})(.*)$`, 'i'),
    Rb = new RegExp(`^([+-])=(${T})`, 'i'),
    Sb = { position: 'absolute', visibility: 'hidden', display: 'block' },
    Tb = { letterSpacing: 0, fontWeight: 400 },
    Ub = ['Webkit', 'O', 'Moz', 'ms'];
  function Vb(a, b) {
    if (b in a) return b;
    let c = b.charAt(0).toUpperCase() + b.slice(1),
      d = b,
      e = Ub.length;
    while (e--) if (((b = Ub[e] + c), b in a)) return b;
    return d;
  }
  function Wb(a, b) {
    for (var c, d, e, f = [], g = 0, h = a.length; h > g; g++)
      (d = a[g]),
        d.style &&
          ((f[g] = n._data(d, 'olddisplay')),
          (c = d.style.display),
          b
            ? (f[g] || c !== 'none' || (d.style.display = ''),
              d.style.display === '' && V(d) && (f[g] = n._data(d, 'olddisplay', Gb(d.nodeName))))
            : f[g] ||
              ((e = V(d)),
              ((c && c !== 'none') || !e) &&
                n._data(d, 'olddisplay', e ? c : n.css(d, 'display'))));
    for (g = 0; h > g; g++)
      (d = a[g]),
        d.style &&
          ((b && d.style.display !== 'none' && d.style.display !== '') ||
            (d.style.display = b ? f[g] || '' : 'none'));
    return a;
  }
  function Xb(a, b, c) {
    const d = Qb.exec(b);
    return d ? Math.max(0, d[1] - (c || 0)) + (d[2] || 'px') : b;
  }
  function Yb(a, b, c, d, e) {
    for (var f = c === (d ? 'border' : 'content') ? 4 : b === 'width' ? 1 : 0, g = 0; f < 4; f += 2)
      c === 'margin' && (g += n.css(a, c + U[f], !0, e)),
        d
          ? (c === 'content' && (g -= n.css(a, `padding${U[f]}`, !0, e)),
            c !== 'margin' && (g -= n.css(a, `border${U[f]}Width`, !0, e)))
          : ((g += n.css(a, `padding${U[f]}`, !0, e)),
            c !== 'padding' && (g += n.css(a, `border${U[f]}Width`, !0, e)));
    return g;
  }
  function Zb(a, b, c) {
    let d = !0,
      e = b === 'width' ? a.offsetWidth : a.offsetHeight,
      f = Jb(a),
      g = l.boxSizing() && n.css(a, 'boxSizing', !1, f) === 'border-box';
    if (e <= 0 || e == null) {
      if (((e = Kb(a, b, f)), (e < 0 || e == null) && (e = a.style[b]), Ib.test(e))) return e;
      (d = g && (l.boxSizingReliable() || e === a.style[b])), (e = parseFloat(e) || 0);
    }
    return `${e + Yb(a, b, c || (g ? 'border' : 'content'), d, f)}px`;
  }
  n.extend({
    cssHooks: {
      opacity: {
        get(a, b) {
          if (b) {
            const c = Kb(a, 'opacity');
            return c === '' ? '1' : c;
          }
        },
      },
    },
    cssNumber: {
      columnCount: !0,
      fillOpacity: !0,
      fontWeight: !0,
      lineHeight: !0,
      opacity: !0,
      order: !0,
      orphans: !0,
      widows: !0,
      zIndex: !0,
      zoom: !0,
    },
    cssProps: { float: l.cssFloat ? 'cssFloat' : 'styleFloat' },
    style(a, b, c, d) {
      if (a && a.nodeType !== 3 && a.nodeType !== 8 && a.style) {
        let e,
          f,
          g,
          h = n.camelCase(b),
          i = a.style;
        if (
          ((b = n.cssProps[h] || (n.cssProps[h] = Vb(i, h))),
          (g = n.cssHooks[b] || n.cssHooks[h]),
          void 0 === c)
        )
          return g && 'get' in g && void 0 !== (e = g.get(a, !1, d)) ? e : i[b];
        if (
          ((f = typeof c),
          f === 'string' &&
            (e = Rb.exec(c)) &&
            ((c = (e[1] + 1) * e[2] + parseFloat(n.css(a, b))), (f = 'number')),
          c != null &&
            c === c &&
            (f !== 'number' || n.cssNumber[h] || (c += 'px'),
            l.clearCloneStyle || c !== '' || b.indexOf('background') !== 0 || (i[b] = 'inherit'),
            !(g && 'set' in g && void 0 === (c = g.set(a, c, d)))))
        )
          try {
            (i[b] = ''), (i[b] = c);
          } catch (j) {}
      }
    },
    css(a, b, c, d) {
      let e,
        f,
        g,
        h = n.camelCase(b);
      return (
        (b = n.cssProps[h] || (n.cssProps[h] = Vb(a.style, h))),
        (g = n.cssHooks[b] || n.cssHooks[h]),
        g && 'get' in g && (f = g.get(a, !0, c)),
        void 0 === f && (f = Kb(a, b, d)),
        f === 'normal' && b in Tb && (f = Tb[b]),
        c === '' || c ? ((e = parseFloat(f)), c === !0 || n.isNumeric(e) ? e || 0 : f) : f
      );
    },
  }),
    n.each(['height', 'width'], (a, b) => {
      n.cssHooks[b] = {
        get(a, c, d) {
          return c
            ? a.offsetWidth === 0 && Pb.test(n.css(a, 'display'))
              ? n.swap(a, Sb, () => Zb(a, b, d))
              : Zb(a, b, d)
            : void 0;
        },
        set(a, c, d) {
          const e = d && Jb(a);
          return Xb(
            a,
            c,
            d ? Yb(a, b, d, l.boxSizing() && n.css(a, 'boxSizing', !1, e) === 'border-box', e) : 0
          );
        },
      };
    }),
    l.opacity ||
      (n.cssHooks.opacity = {
        get(a, b) {
          return Ob.test((b && a.currentStyle ? a.currentStyle.filter : a.style.filter) || '')
            ? `${0.01 * parseFloat(RegExp.$1)}`
            : b ? '1' : '';
        },
        set(a, b) {
          let c = a.style,
            d = a.currentStyle,
            e = n.isNumeric(b) ? `alpha(opacity=${100 * b})` : '',
            f = (d && d.filter) || c.filter || '';
          (c.zoom = 1),
            ((b >= 1 || b === '') &&
              n.trim(f.replace(Nb, '')) === '' &&
              c.removeAttribute &&
              (c.removeAttribute('filter'), b === '' || (d && !d.filter))) ||
              (c.filter = Nb.test(f) ? f.replace(Nb, e) : `${f} ${e}`);
        },
      }),
    (n.cssHooks.marginRight = Mb(
      l.reliableMarginRight,
      (a, b) => (b ? n.swap(a, { display: 'inline-block' }, Kb, [a, 'marginRight']) : void 0)
    )),
    n.each({ margin: '', padding: '', border: 'Width' }, (a, b) => {
      (n.cssHooks[a + b] = {
        expand(c) {
          for (var d = 0, e = {}, f = typeof c === 'string' ? c.split(' ') : [c]; d < 4; d++)
            e[a + U[d] + b] = f[d] || f[d - 2] || f[0];
          return e;
        },
      }),
        Hb.test(a) || (n.cssHooks[a + b].set = Xb);
    }),
    n.fn.extend({
      css(a, b) {
        return W(
          this,
          (a, b, c) => {
            let d,
              e,
              f = {},
              g = 0;
            if (n.isArray(b)) {
              for (d = Jb(a), e = b.length; e > g; g++) f[b[g]] = n.css(a, b[g], !1, d);
              return f;
            }
            return void 0 !== c ? n.style(a, b, c) : n.css(a, b);
          },
          a,
          b,
          arguments.length > 1
        );
      },
      show() {
        return Wb(this, !0);
      },
      hide() {
        return Wb(this);
      },
      toggle(a) {
        return typeof a === 'boolean'
          ? a ? this.show() : this.hide()
          : this.each(function() {
              V(this) ? n(this).show() : n(this).hide();
            });
      },
    });
  function $b(a, b, c, d, e) {
    return new $b.prototype.init(a, b, c, d, e);
  }
  (n.Tween = $b),
    ($b.prototype = {
      constructor: $b,
      init(a, b, c, d, e, f) {
        (this.elem = a),
          (this.prop = c),
          (this.easing = e || 'swing'),
          (this.options = b),
          (this.start = this.now = this.cur()),
          (this.end = d),
          (this.unit = f || (n.cssNumber[c] ? '' : 'px'));
      },
      cur() {
        const a = $b.propHooks[this.prop];
        return a && a.get ? a.get(this) : $b.propHooks._default.get(this);
      },
      run(a) {
        let b,
          c = $b.propHooks[this.prop];
        return (
          (this.pos = b = this.options.duration
            ? n.easing[this.easing](a, this.options.duration * a, 0, 1, this.options.duration)
            : a),
          (this.now = (this.end - this.start) * b + this.start),
          this.options.step && this.options.step.call(this.elem, this.now, this),
          c && c.set ? c.set(this) : $b.propHooks._default.set(this),
          this
        );
      },
    }),
    ($b.prototype.init.prototype = $b.prototype),
    ($b.propHooks = {
      _default: {
        get(a) {
          let b;
          return a.elem[a.prop] == null || (a.elem.style && a.elem.style[a.prop] != null)
            ? ((b = n.css(a.elem, a.prop, '')), b && b !== 'auto' ? b : 0)
            : a.elem[a.prop];
        },
        set(a) {
          n.fx.step[a.prop]
            ? n.fx.step[a.prop](a)
            : a.elem.style && (a.elem.style[n.cssProps[a.prop]] != null || n.cssHooks[a.prop])
              ? n.style(a.elem, a.prop, a.now + a.unit)
              : (a.elem[a.prop] = a.now);
        },
      },
    }),
    ($b.propHooks.scrollTop = $b.propHooks.scrollLeft = {
      set(a) {
        a.elem.nodeType && a.elem.parentNode && (a.elem[a.prop] = a.now);
      },
    }),
    (n.easing = {
      linear(a) {
        return a;
      },
      swing(a) {
        return 0.5 - Math.cos(a * Math.PI) / 2;
      },
    }),
    (n.fx = $b.prototype.init),
    (n.fx.step = {});
  let _b,
    ac,
    bc = /^(?:toggle|show|hide)$/,
    cc = new RegExp(`^(?:([+-])=|)(${T})([a-z%]*)$`, 'i'),
    dc = /queueHooks$/,
    ec = [jc],
    fc = {
      '*': [
        function(a, b) {
          let c = this.createTween(a, b),
            d = c.cur(),
            e = cc.exec(b),
            f = (e && e[3]) || (n.cssNumber[a] ? '' : 'px'),
            g = (n.cssNumber[a] || (f !== 'px' && +d)) && cc.exec(n.css(c.elem, a)),
            h = 1,
            i = 20;
          if (g && g[3] !== f) {
            (f = f || g[3]), (e = e || []), (g = +d || 1);
            do (h = h || '.5'), (g /= h), n.style(c.elem, a, g + f);
            while (h !== (h = c.cur() / d) && h !== 1 && --i);
          }
          return (
            e &&
              ((g = c.start = +g || +d || 0),
              (c.unit = f),
              (c.end = e[1] ? g + (e[1] + 1) * e[2] : +e[2])),
            c
          );
        },
      ],
    };
  function gc() {
    return (
      setTimeout(() => {
        _b = void 0;
      }),
      (_b = n.now())
    );
  }
  function hc(a, b) {
    let c,
      d = { height: a },
      e = 0;
    for (b = b ? 1 : 0; e < 4; e += 2 - b) (c = U[e]), (d[`margin${c}`] = d[`padding${c}`] = a);
    return b && (d.opacity = d.width = a), d;
  }
  function ic(a, b, c) {
    for (var d, e = (fc[b] || []).concat(fc['*']), f = 0, g = e.length; g > f; f++)
      if ((d = e[f].call(c, b, a))) return d;
  }
  function jc(a, b, c) {
    let d,
      e,
      f,
      g,
      h,
      i,
      j,
      k,
      m = this,
      o = {},
      p = a.style,
      q = a.nodeType && V(a),
      r = n._data(a, 'fxshow');
    c.queue ||
      ((h = n._queueHooks(a, 'fx')),
      h.unqueued == null &&
        ((h.unqueued = 0),
        (i = h.empty.fire),
        (h.empty.fire = function() {
          h.unqueued || i();
        })),
      h.unqueued++,
      m.always(() => {
        m.always(() => {
          h.unqueued--, n.queue(a, 'fx').length || h.empty.fire();
        });
      })),
      a.nodeType === 1 &&
        ('height' in b || 'width' in b) &&
        ((c.overflow = [p.overflow, p.overflowX, p.overflowY]),
        (j = n.css(a, 'display')),
        (k = Gb(a.nodeName)),
        j === 'none' && (j = k),
        j === 'inline' &&
          n.css(a, 'float') === 'none' &&
          (l.inlineBlockNeedsLayout && k !== 'inline'
            ? (p.zoom = 1)
            : (p.display = 'inline-block'))),
      c.overflow &&
        ((p.overflow = 'hidden'),
        l.shrinkWrapBlocks() ||
          m.always(() => {
            (p.overflow = c.overflow[0]),
              (p.overflowX = c.overflow[1]),
              (p.overflowY = c.overflow[2]);
          }));
    for (d in b)
      if (((e = b[d]), bc.exec(e))) {
        if ((delete b[d], (f = f || e === 'toggle'), e === (q ? 'hide' : 'show'))) {
          if (e !== 'show' || !r || void 0 === r[d]) continue;
          q = !0;
        }
        o[d] = (r && r[d]) || n.style(a, d);
      }
    if (!n.isEmptyObject(o)) {
      r ? 'hidden' in r && (q = r.hidden) : (r = n._data(a, 'fxshow', {})),
        f && (r.hidden = !q),
        q
          ? n(a).show()
          : m.done(() => {
              n(a).hide();
            }),
        m.done(() => {
          let b;
          n._removeData(a, 'fxshow');
          for (b in o) n.style(a, b, o[b]);
        });
      for (d in o)
        (g = ic(q ? r[d] : 0, d, m)),
          d in r ||
            ((r[d] = g.start),
            q && ((g.end = g.start), (g.start = d === 'width' || d === 'height' ? 1 : 0)));
    }
  }
  function kc(a, b) {
    let c, d, e, f, g;
    for (c in a)
      if (
        ((d = n.camelCase(c)),
        (e = b[d]),
        (f = a[c]),
        n.isArray(f) && ((e = f[1]), (f = a[c] = f[0])),
        c !== d && ((a[d] = f), delete a[c]),
        (g = n.cssHooks[d]),
        g && 'expand' in g)
      ) {
        (f = g.expand(f)), delete a[d];
        for (c in f) c in a || ((a[c] = f[c]), (b[c] = e));
      } else b[d] = e;
  }
  function lc(a, b, c) {
    var d,
      e,
      f = 0,
      g = ec.length,
      h = n.Deferred().always(() => {
        delete i.elem;
      }),
      i = function() {
        if (e) return !1;
        for (
          var b = _b || gc(),
            c = Math.max(0, j.startTime + j.duration - b),
            d = c / j.duration || 0,
            f = 1 - d,
            g = 0,
            i = j.tweens.length;
          i > g;
          g++
        )
          j.tweens[g].run(f);
        return h.notifyWith(a, [j, f, c]), f < 1 && i ? c : (h.resolveWith(a, [j]), !1);
      },
      j = h.promise({
        elem: a,
        props: n.extend({}, b),
        opts: n.extend(!0, { specialEasing: {} }, c),
        originalProperties: b,
        originalOptions: c,
        startTime: _b || gc(),
        duration: c.duration,
        tweens: [],
        createTween(b, c) {
          const d = n.Tween(a, j.opts, b, c, j.opts.specialEasing[b] || j.opts.easing);
          return j.tweens.push(d), d;
        },
        stop(b) {
          let c = 0,
            d = b ? j.tweens.length : 0;
          if (e) return this;
          for (e = !0; d > c; c++) j.tweens[c].run(1);
          return b ? h.resolveWith(a, [j, b]) : h.rejectWith(a, [j, b]), this;
        },
      }),
      k = j.props;
    for (kc(k, j.opts.specialEasing); g > f; f++) if ((d = ec[f].call(j, a, k, j.opts))) return d;
    return (
      n.map(k, ic, j),
      n.isFunction(j.opts.start) && j.opts.start.call(a, j),
      n.fx.timer(n.extend(i, { elem: a, anim: j, queue: j.opts.queue })),
      j
        .progress(j.opts.progress)
        .done(j.opts.done, j.opts.complete)
        .fail(j.opts.fail)
        .always(j.opts.always)
    );
  }
  (n.Animation = n.extend(lc, {
    tweener(a, b) {
      n.isFunction(a) ? ((b = a), (a = ['*'])) : (a = a.split(' '));
      for (var c, d = 0, e = a.length; e > d; d++)
        (c = a[d]), (fc[c] = fc[c] || []), fc[c].unshift(b);
    },
    prefilter(a, b) {
      b ? ec.unshift(a) : ec.push(a);
    },
  })),
    (n.speed = function(a, b, c) {
      const d =
        a && typeof a === 'object'
          ? n.extend({}, a)
          : {
              complete: c || (!c && b) || (n.isFunction(a) && a),
              duration: a,
              easing: (c && b) || (b && !n.isFunction(b) && b),
            };
      return (
        (d.duration = n.fx.off
          ? 0
          : typeof d.duration === 'number'
            ? d.duration
            : d.duration in n.fx.speeds ? n.fx.speeds[d.duration] : n.fx.speeds._default),
        (d.queue == null || d.queue === !0) && (d.queue = 'fx'),
        (d.old = d.complete),
        (d.complete = function() {
          n.isFunction(d.old) && d.old.call(this), d.queue && n.dequeue(this, d.queue);
        }),
        d
      );
    }),
    n.fn.extend({
      fadeTo(a, b, c, d) {
        return this.filter(V)
          .css('opacity', 0)
          .show()
          .end()
          .animate({ opacity: b }, a, c, d);
      },
      animate(a, b, c, d) {
        let e = n.isEmptyObject(a),
          f = n.speed(b, c, d),
          g = function() {
            const b = lc(this, n.extend({}, a), f);
            (e || n._data(this, 'finish')) && b.stop(!0);
          };
        return (g.finish = g), e || f.queue === !1 ? this.each(g) : this.queue(f.queue, g);
      },
      stop(a, b, c) {
        const d = function(a) {
          const b = a.stop;
          delete a.stop, b(c);
        };
        return (
          typeof a !== 'string' && ((c = b), (b = a), (a = void 0)),
          b && a !== !1 && this.queue(a || 'fx', []),
          this.each(function() {
            let b = !0,
              e = a != null && `${a}queueHooks`,
              f = n.timers,
              g = n._data(this);
            if (e) g[e] && g[e].stop && d(g[e]);
            else for (e in g) g[e] && g[e].stop && dc.test(e) && d(g[e]);
            for (e = f.length; e--; )
              f[e].elem !== this ||
                (a != null && f[e].queue !== a) ||
                (f[e].anim.stop(c), (b = !1), f.splice(e, 1));
            (b || !c) && n.dequeue(this, a);
          })
        );
      },
      finish(a) {
        return (
          a !== !1 && (a = a || 'fx'),
          this.each(function() {
            let b,
              c = n._data(this),
              d = c[`${a}queue`],
              e = c[`${a}queueHooks`],
              f = n.timers,
              g = d ? d.length : 0;
            for (
              c.finish = !0,
                n.queue(this, a, []),
                e && e.stop && e.stop.call(this, !0),
                b = f.length;
              b--;

            )
              f[b].elem === this && f[b].queue === a && (f[b].anim.stop(!0), f.splice(b, 1));
            for (b = 0; g > b; b++) d[b] && d[b].finish && d[b].finish.call(this);
            delete c.finish;
          })
        );
      },
    }),
    n.each(['toggle', 'show', 'hide'], (a, b) => {
      const c = n.fn[b];
      n.fn[b] = function(a, d, e) {
        return a == null || typeof a === 'boolean'
          ? c.apply(this, arguments)
          : this.animate(hc(b, !0), a, d, e);
      };
    }),
    n.each(
      {
        slideDown: hc('show'),
        slideUp: hc('hide'),
        slideToggle: hc('toggle'),
        fadeIn: { opacity: 'show' },
        fadeOut: { opacity: 'hide' },
        fadeToggle: { opacity: 'toggle' },
      },
      (a, b) => {
        n.fn[a] = function(a, c, d) {
          return this.animate(b, a, c, d);
        };
      }
    ),
    (n.timers = []),
    (n.fx.tick = function() {
      let a,
        b = n.timers,
        c = 0;
      for (_b = n.now(); c < b.length; c++) (a = b[c]), a() || b[c] !== a || b.splice(c--, 1);
      b.length || n.fx.stop(), (_b = void 0);
    }),
    (n.fx.timer = function(a) {
      n.timers.push(a), a() ? n.fx.start() : n.timers.pop();
    }),
    (n.fx.interval = 13),
    (n.fx.start = function() {
      ac || (ac = setInterval(n.fx.tick, n.fx.interval));
    }),
    (n.fx.stop = function() {
      clearInterval(ac), (ac = null);
    }),
    (n.fx.speeds = { slow: 600, fast: 200, _default: 400 }),
    (n.fn.delay = function(a, b) {
      return (
        (a = n.fx ? n.fx.speeds[a] || a : a),
        (b = b || 'fx'),
        this.queue(b, (b, c) => {
          const d = setTimeout(b, a);
          c.stop = function() {
            clearTimeout(d);
          };
        })
      );
    }),
    (function() {
      let a,
        b,
        c,
        d,
        e = z.createElement('div');
      e.setAttribute('className', 't'),
        (e.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>"),
        (a = e.getElementsByTagName('a')[0]),
        (c = z.createElement('select')),
        (d = c.appendChild(z.createElement('option'))),
        (b = e.getElementsByTagName('input')[0]),
        (a.style.cssText = 'top:1px'),
        (l.getSetAttribute = e.className !== 't'),
        (l.style = /top/.test(a.getAttribute('style'))),
        (l.hrefNormalized = a.getAttribute('href') === '/a'),
        (l.checkOn = !!b.value),
        (l.optSelected = d.selected),
        (l.enctype = !!z.createElement('form').enctype),
        (c.disabled = !0),
        (l.optDisabled = !d.disabled),
        (b = z.createElement('input')),
        b.setAttribute('value', ''),
        (l.input = b.getAttribute('value') === ''),
        (b.value = 't'),
        b.setAttribute('type', 'radio'),
        (l.radioValue = b.value === 't'),
        (a = b = c = d = e = null);
    })();
  const mc = /\r/g;
  n.fn.extend({
    val(a) {
      let b,
        c,
        d,
        e = this[0];
      {
        if (arguments.length)
          return (
            (d = n.isFunction(a)),
            this.each(function(c) {
              let e;
              this.nodeType === 1 &&
                ((e = d ? a.call(this, c, n(this).val()) : a),
                e == null
                  ? (e = '')
                  : typeof e === 'number'
                    ? (e += '')
                    : n.isArray(e) && (e = n.map(e, a => (a == null ? '' : `${a}`))),
                (b = n.valHooks[this.type] || n.valHooks[this.nodeName.toLowerCase()]),
                (b && 'set' in b && void 0 !== b.set(this, e, 'value')) || (this.value = e));
            })
          );
        if (e)
          return (
            (b = n.valHooks[e.type] || n.valHooks[e.nodeName.toLowerCase()]),
            b && 'get' in b && void 0 !== (c = b.get(e, 'value'))
              ? c
              : ((c = e.value), typeof c === 'string' ? c.replace(mc, '') : c == null ? '' : c)
          );
      }
    },
  }),
    n.extend({
      valHooks: {
        option: {
          get(a) {
            const b = n.find.attr(a, 'value');
            return b != null ? b : n.text(a);
          },
        },
        select: {
          get(a) {
            for (
              var b,
                c,
                d = a.options,
                e = a.selectedIndex,
                f = a.type === 'select-one' || e < 0,
                g = f ? null : [],
                h = f ? e + 1 : d.length,
                i = e < 0 ? h : f ? e : 0;
              h > i;
              i++
            )
              if (
                ((c = d[i]),
                !(
                  (!c.selected && i !== e) ||
                  (l.optDisabled ? c.disabled : c.getAttribute('disabled') !== null) ||
                  (c.parentNode.disabled && n.nodeName(c.parentNode, 'optgroup'))
                ))
              ) {
                if (((b = n(c).val()), f)) return b;
                g.push(b);
              }
            return g;
          },
          set(a, b) {
            let c,
              d,
              e = a.options,
              f = n.makeArray(b),
              g = e.length;
            while (g--)
              if (((d = e[g]), n.inArray(n.valHooks.option.get(d), f) >= 0))
                try {
                  d.selected = c = !0;
                } catch (h) {
                  d.scrollHeight;
                }
              else d.selected = !1;
            return c || (a.selectedIndex = -1), e;
          },
        },
      },
    }),
    n.each(['radio', 'checkbox'], function() {
      (n.valHooks[this] = {
        set(a, b) {
          return n.isArray(b) ? (a.checked = n.inArray(n(a).val(), b) >= 0) : void 0;
        },
      }),
        l.checkOn ||
          (n.valHooks[this].get = function(a) {
            return a.getAttribute('value') === null ? 'on' : a.value;
          });
    });
  let nc,
    oc,
    pc = n.expr.attrHandle,
    qc = /^(?:checked|selected)$/i,
    rc = l.getSetAttribute,
    sc = l.input;
  n.fn.extend({
    attr(a, b) {
      return W(this, n.attr, a, b, arguments.length > 1);
    },
    removeAttr(a) {
      return this.each(function() {
        n.removeAttr(this, a);
      });
    },
  }),
    n.extend({
      attr(a, b, c) {
        let d,
          e,
          f = a.nodeType;
        if (a && f !== 3 && f !== 8 && f !== 2)
          return typeof a.getAttribute === L
            ? n.prop(a, b, c)
            : ((f === 1 && n.isXMLDoc(a)) ||
                ((b = b.toLowerCase()),
                (d = n.attrHooks[b] || (n.expr.match.bool.test(b) ? oc : nc))),
              void 0 === c
                ? d && 'get' in d && (e = d.get(a, b)) !== null
                  ? e
                  : ((e = n.find.attr(a, b)), e == null ? void 0 : e)
                : c !== null
                  ? d && 'set' in d && void 0 !== (e = d.set(a, c, b))
                    ? e
                    : (a.setAttribute(b, `${c}`), c)
                  : void n.removeAttr(a, b));
      },
      removeAttr(a, b) {
        let c,
          d,
          e = 0,
          f = b && b.match(F);
        if (f && a.nodeType === 1)
          while ((c = f[e++]))
            (d = n.propFix[c] || c),
              n.expr.match.bool.test(c)
                ? (sc && rc) || !qc.test(c)
                  ? (a[d] = !1)
                  : (a[n.camelCase(`default-${c}`)] = a[d] = !1)
                : n.attr(a, c, ''),
              a.removeAttribute(rc ? c : d);
      },
      attrHooks: {
        type: {
          set(a, b) {
            if (!l.radioValue && b === 'radio' && n.nodeName(a, 'input')) {
              const c = a.value;
              return a.setAttribute('type', b), c && (a.value = c), b;
            }
          },
        },
      },
    }),
    (oc = {
      set(a, b, c) {
        return (
          b === !1
            ? n.removeAttr(a, c)
            : (sc && rc) || !qc.test(c)
              ? a.setAttribute((!rc && n.propFix[c]) || c, c)
              : (a[n.camelCase(`default-${c}`)] = a[c] = !0),
          c
        );
      },
    }),
    n.each(n.expr.match.bool.source.match(/\w+/g), (a, b) => {
      const c = pc[b] || n.find.attr;
      pc[b] =
        (sc && rc) || !qc.test(b)
          ? function(a, b, d) {
              let e, f;
              return (
                d ||
                  ((f = pc[b]),
                  (pc[b] = e),
                  (e = c(a, b, d) != null ? b.toLowerCase() : null),
                  (pc[b] = f)),
                e
              );
            }
          : function(a, b, c) {
              return c ? void 0 : a[n.camelCase(`default-${b}`)] ? b.toLowerCase() : null;
            };
    }),
    (sc && rc) ||
      (n.attrHooks.value = {
        set(a, b, c) {
          return n.nodeName(a, 'input') ? void (a.defaultValue = b) : nc && nc.set(a, b, c);
        },
      }),
    rc ||
      ((nc = {
        set(a, b, c) {
          let d = a.getAttributeNode(c);
          return (
            d || a.setAttributeNode((d = a.ownerDocument.createAttribute(c))),
            (d.value = b += ''),
            c === 'value' || b === a.getAttribute(c) ? b : void 0
          );
        },
      }),
      (pc.id = pc.name = pc.coords = function(a, b, c) {
        let d;
        return c ? void 0 : (d = a.getAttributeNode(b)) && d.value !== '' ? d.value : null;
      }),
      (n.valHooks.button = {
        get(a, b) {
          const c = a.getAttributeNode(b);
          return c && c.specified ? c.value : void 0;
        },
        set: nc.set,
      }),
      (n.attrHooks.contenteditable = {
        set(a, b, c) {
          nc.set(a, b === '' ? !1 : b, c);
        },
      }),
      n.each(['width', 'height'], (a, b) => {
        n.attrHooks[b] = {
          set(a, c) {
            return c === '' ? (a.setAttribute(b, 'auto'), c) : void 0;
          },
        };
      })),
    l.style ||
      (n.attrHooks.style = {
        get(a) {
          return a.style.cssText || void 0;
        },
        set(a, b) {
          return (a.style.cssText = `${b}`);
        },
      });
  let tc = /^(?:input|select|textarea|button|object)$/i,
    uc = /^(?:a|area)$/i;
  n.fn.extend({
    prop(a, b) {
      return W(this, n.prop, a, b, arguments.length > 1);
    },
    removeProp(a) {
      return (
        (a = n.propFix[a] || a),
        this.each(function() {
          try {
            (this[a] = void 0), delete this[a];
          } catch (b) {}
        })
      );
    },
  }),
    n.extend({
      propFix: { for: 'htmlFor', class: 'className' },
      prop(a, b, c) {
        let d,
          e,
          f,
          g = a.nodeType;
        if (a && g !== 3 && g !== 8 && g !== 2)
          return (
            (f = g !== 1 || !n.isXMLDoc(a)),
            f && ((b = n.propFix[b] || b), (e = n.propHooks[b])),
            void 0 !== c
              ? e && 'set' in e && void 0 !== (d = e.set(a, c, b)) ? d : (a[b] = c)
              : e && 'get' in e && (d = e.get(a, b)) !== null ? d : a[b]
          );
      },
      propHooks: {
        tabIndex: {
          get(a) {
            const b = n.find.attr(a, 'tabindex');
            return b
              ? parseInt(b, 10)
              : tc.test(a.nodeName) || (uc.test(a.nodeName) && a.href) ? 0 : -1;
          },
        },
      },
    }),
    l.hrefNormalized ||
      n.each(['href', 'src'], (a, b) => {
        n.propHooks[b] = {
          get(a) {
            return a.getAttribute(b, 4);
          },
        };
      }),
    l.optSelected ||
      (n.propHooks.selected = {
        get(a) {
          const b = a.parentNode;
          return b && (b.selectedIndex, b.parentNode && b.parentNode.selectedIndex), null;
        },
      }),
    n.each(
      [
        'tabIndex',
        'readOnly',
        'maxLength',
        'cellSpacing',
        'cellPadding',
        'rowSpan',
        'colSpan',
        'useMap',
        'frameBorder',
        'contentEditable',
      ],
      function() {
        n.propFix[this.toLowerCase()] = this;
      }
    ),
    l.enctype || (n.propFix.enctype = 'encoding');
  const vc = /[\t\r\n\f]/g;
  n.fn.extend({
    addClass(a) {
      let b,
        c,
        d,
        e,
        f,
        g,
        h = 0,
        i = this.length,
        j = typeof a === 'string' && a;
      if (n.isFunction(a))
        return this.each(function(b) {
          n(this).addClass(a.call(this, b, this.className));
        });
      if (j)
        for (b = (a || '').match(F) || []; i > h; h++)
          if (
            ((c = this[h]),
            (d = c.nodeType === 1 && (c.className ? ` ${c.className} `.replace(vc, ' ') : ' ')))
          ) {
            f = 0;
            while ((e = b[f++])) d.indexOf(` ${e} `) < 0 && (d += `${e} `);
            (g = n.trim(d)), c.className !== g && (c.className = g);
          }
      return this;
    },
    removeClass(a) {
      let b,
        c,
        d,
        e,
        f,
        g,
        h = 0,
        i = this.length,
        j = arguments.length === 0 || (typeof a === 'string' && a);
      if (n.isFunction(a))
        return this.each(function(b) {
          n(this).removeClass(a.call(this, b, this.className));
        });
      if (j)
        for (b = (a || '').match(F) || []; i > h; h++)
          if (
            ((c = this[h]),
            (d = c.nodeType === 1 && (c.className ? ` ${c.className} `.replace(vc, ' ') : '')))
          ) {
            f = 0;
            while ((e = b[f++])) while (d.indexOf(` ${e} `) >= 0) d = d.replace(` ${e} `, ' ');
            (g = a ? n.trim(d) : ''), c.className !== g && (c.className = g);
          }
      return this;
    },
    toggleClass(a, b) {
      const c = typeof a;
      return typeof b === 'boolean' && c === 'string'
        ? b ? this.addClass(a) : this.removeClass(a)
        : this.each(
            n.isFunction(a)
              ? function(c) {
                  n(this).toggleClass(a.call(this, c, this.className, b), b);
                }
              : function() {
                  if (c === 'string') {
                    let b,
                      d = 0,
                      e = n(this),
                      f = a.match(F) || [];
                    while ((b = f[d++])) e.hasClass(b) ? e.removeClass(b) : e.addClass(b);
                  } else
                    (c === L || c === 'boolean') &&
                      (this.className && n._data(this, '__className__', this.className),
                      (this.className =
                        this.className || a === !1 ? '' : n._data(this, '__className__') || ''));
                }
          );
    },
    hasClass(a) {
      for (let b = ` ${a} `, c = 0, d = this.length; d > c; c++)
        if (this[c].nodeType === 1 && ` ${this[c].className} `.replace(vc, ' ').indexOf(b) >= 0)
          return !0;
      return !1;
    },
  }),
    n.each(
      'blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu'.split(
        ' '
      ),
      (a, b) => {
        n.fn[b] = function(a, c) {
          return arguments.length > 0 ? this.on(b, null, a, c) : this.trigger(b);
        };
      }
    ),
    n.fn.extend({
      hover(a, b) {
        return this.mouseenter(a).mouseleave(b || a);
      },
      bind(a, b, c) {
        return this.on(a, null, b, c);
      },
      unbind(a, b) {
        return this.off(a, null, b);
      },
      delegate(a, b, c, d) {
        return this.on(b, a, c, d);
      },
      undelegate(a, b, c) {
        return arguments.length === 1 ? this.off(a, '**') : this.off(b, a || '**', c);
      },
    });
  let wc = n.now(),
    xc = /\?/,
    yc = /(,)|(\[|{)|(}|])|"(?:[^"\\\r\n]|\\["\\\/bfnrt]|\\u[\da-fA-F]{4})*"\s*:?|true|false|null|-?(?!0\d)\d+(?:\.\d+|)(?:[eE][+-]?\d+|)/g;
  (n.parseJSON = function(b) {
    if (a.JSON && a.JSON.parse) return a.JSON.parse(`${b}`);
    let c,
      d = null,
      e = n.trim(`${b}`);
    return e &&
      !n.trim(
        e.replace(
          yc,
          (a, b, e, f) => c && b && (d = 0),
          d === 0 ? a : ((c = e || b), (d += !f - !e), '')
        )
      )
      ? Function(`return ${e}`)()
      : n.error(`Invalid JSON: ${b}`);
  }),
    (n.parseXML = function(b) {
      let c, d;
      if (!b || typeof b !== 'string') return null;
      try {
        a.DOMParser
          ? ((d = new DOMParser()), (c = d.parseFromString(b, 'text/xml')))
          : ((c = new ActiveXObject('Microsoft.XMLDOM')), (c.async = 'false'), c.loadXML(b));
      } catch (e) {
        c = void 0;
      }
      return (
        (c && c.documentElement && !c.getElementsByTagName('parsererror').length) ||
          n.error(`Invalid XML: ${b}`),
        c
      );
    });
  let zc,
    Ac,
    Bc = /#.*$/,
    Cc = /([?&])_=[^&]*/,
    Dc = /^(.*?):[ \t]*([^\r\n]*)\r?$/gm,
    Ec = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
    Fc = /^(?:GET|HEAD)$/,
    Gc = /^\/\//,
    Hc = /^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/,
    Ic = {},
    Jc = {},
    Kc = '*/'.concat('*');
  try {
    Ac = location.href;
  } catch (Lc) {
    (Ac = z.createElement('a')), (Ac.href = ''), (Ac = Ac.href);
  }
  zc = Hc.exec(Ac.toLowerCase()) || [];
  function Mc(a) {
    return function(b, c) {
      typeof b !== 'string' && ((c = b), (b = '*'));
      let d,
        e = 0,
        f = b.toLowerCase().match(F) || [];
      if (n.isFunction(c))
        while ((d = f[e++]))
          d.charAt(0) === '+'
            ? ((d = d.slice(1) || '*'), (a[d] = a[d] || []).unshift(c))
            : (a[d] = a[d] || []).push(c);
    };
  }
  function Nc(a, b, c, d) {
    let e = {},
      f = a === Jc;
    function g(h) {
      let i;
      return (
        (e[h] = !0),
        n.each(a[h] || [], (a, h) => {
          const j = h(b, c, d);
          return typeof j !== 'string' || f || e[j]
            ? f ? !(i = j) : void 0
            : (b.dataTypes.unshift(j), g(j), !1);
        }),
        i
      );
    }
    return g(b.dataTypes[0]) || (!e['*'] && g('*'));
  }
  function Oc(a, b) {
    let c,
      d,
      e = n.ajaxSettings.flatOptions || {};
    for (d in b) void 0 !== b[d] && ((e[d] ? a : c || (c = {}))[d] = b[d]);
    return c && n.extend(!0, a, c), a;
  }
  function Pc(a, b, c) {
    let d,
      e,
      f,
      g,
      h = a.contents,
      i = a.dataTypes;
    while (i[0] === '*')
      i.shift(), void 0 === e && (e = a.mimeType || b.getResponseHeader('Content-Type'));
    if (e)
      for (g in h)
        if (h[g] && h[g].test(e)) {
          i.unshift(g);
          break;
        }
    if (i[0] in c) f = i[0];
    else {
      for (g in c) {
        if (!i[0] || a.converters[`${g} ${i[0]}`]) {
          f = g;
          break;
        }
        d || (d = g);
      }
      f = f || d;
    }
    return f ? (f !== i[0] && i.unshift(f), c[f]) : void 0;
  }
  function Qc(a, b, c, d) {
    let e,
      f,
      g,
      h,
      i,
      j = {},
      k = a.dataTypes.slice();
    if (k[1]) for (g in a.converters) j[g.toLowerCase()] = a.converters[g];
    f = k.shift();
    while (f)
      if (
        (a.responseFields[f] && (c[a.responseFields[f]] = b),
        !i && d && a.dataFilter && (b = a.dataFilter(b, a.dataType)),
        (i = f),
        (f = k.shift()))
      )
        if (f === '*') f = i;
        else if (i !== '*' && i !== f) {
          if (((g = j[`${i} ${f}`] || j[`* ${f}`]), !g))
            for (e in j)
              if (((h = e.split(' ')), h[1] === f && (g = j[`${i} ${h[0]}`] || j[`* ${h[0]}`]))) {
                g === !0 ? (g = j[e]) : j[e] !== !0 && ((f = h[0]), k.unshift(h[1]));
                break;
              }
          if (g !== !0)
            if (g && a.throws) b = g(b);
            else
              try {
                b = g(b);
              } catch (l) {
                return {
                  state: 'parsererror',
                  error: g ? l : `No conversion from ${i} to ${f}`,
                };
              }
        }
    return { state: 'success', data: b };
  }
  n.extend({
    active: 0,
    lastModified: {},
    etag: {},
    ajaxSettings: {
      url: Ac,
      type: 'GET',
      isLocal: Ec.test(zc[1]),
      global: !0,
      processData: !0,
      async: !0,
      contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
      accepts: {
        '*': Kc,
        text: 'text/plain',
        html: 'text/html',
        xml: 'application/xml, text/xml',
        json: 'application/json, text/javascript',
      },
      contents: { xml: /xml/, html: /html/, json: /json/ },
      responseFields: { xml: 'responseXML', text: 'responseText', json: 'responseJSON' },
      converters: {
        '* text': String,
        'text html': !0,
        'text json': n.parseJSON,
        'text xml': n.parseXML,
      },
      flatOptions: { url: !0, context: !0 },
    },
    ajaxSetup(a, b) {
      return b ? Oc(Oc(a, n.ajaxSettings), b) : Oc(n.ajaxSettings, a);
    },
    ajaxPrefilter: Mc(Ic),
    ajaxTransport: Mc(Jc),
    ajax(a, b) {
      typeof a === 'object' && ((b = a), (a = void 0)), (b = b || {});
      var c,
        d,
        e,
        f,
        g,
        h,
        i,
        j,
        k = n.ajaxSetup({}, b),
        l = k.context || k,
        m = k.context && (l.nodeType || l.jquery) ? n(l) : n.event,
        o = n.Deferred(),
        p = n.Callbacks('once memory'),
        q = k.statusCode || {},
        r = {},
        s = {},
        t = 0,
        u = 'canceled',
        v = {
          readyState: 0,
          getResponseHeader(a) {
            let b;
            if (t === 2) {
              if (!j) {
                j = {};
                while ((b = Dc.exec(f))) j[b[1].toLowerCase()] = b[2];
              }
              b = j[a.toLowerCase()];
            }
            return b == null ? null : b;
          },
          getAllResponseHeaders() {
            return t === 2 ? f : null;
          },
          setRequestHeader(a, b) {
            const c = a.toLowerCase();
            return t || ((a = s[c] = s[c] || a), (r[a] = b)), this;
          },
          overrideMimeType(a) {
            return t || (k.mimeType = a), this;
          },
          statusCode(a) {
            let b;
            if (a)
              if (t < 2) for (b in a) q[b] = [q[b], a[b]];
              else v.always(a[v.status]);
            return this;
          },
          abort(a) {
            const b = a || u;
            return i && i.abort(b), x(0, b), this;
          },
        };
      if (
        ((o.promise(v).complete = p.add),
        (v.success = v.done),
        (v.error = v.fail),
        (k.url = `${a || k.url || Ac}`.replace(Bc, '').replace(Gc, `${zc[1]}//`)),
        (k.type = b.method || b.type || k.method || k.type),
        (k.dataTypes = n
          .trim(k.dataType || '*')
          .toLowerCase()
          .match(F) || ['']),
        k.crossDomain == null &&
          ((c = Hc.exec(k.url.toLowerCase())),
          (k.crossDomain = !(
            !c ||
            (c[1] === zc[1] &&
              c[2] === zc[2] &&
              (c[3] || (c[1] === 'http:' ? '80' : '443')) ===
                (zc[3] || (zc[1] === 'http:' ? '80' : '443')))
          ))),
        k.data &&
          k.processData &&
          typeof k.data !== 'string' &&
          (k.data = n.param(k.data, k.traditional)),
        Nc(Ic, k, b, v),
        t === 2)
      )
        return v;
      (h = k.global),
        h && n.active++ === 0 && n.event.trigger('ajaxStart'),
        (k.type = k.type.toUpperCase()),
        (k.hasContent = !Fc.test(k.type)),
        (e = k.url),
        k.hasContent ||
          (k.data && ((e = k.url += (xc.test(e) ? '&' : '?') + k.data), delete k.data),
          k.cache === !1 &&
            (k.url = Cc.test(e)
              ? e.replace(Cc, `$1_=${wc++}`)
              : `${e + (xc.test(e) ? '&' : '?')}_=${wc++}`)),
        k.ifModified &&
          (n.lastModified[e] && v.setRequestHeader('If-Modified-Since', n.lastModified[e]),
          n.etag[e] && v.setRequestHeader('If-None-Match', n.etag[e])),
        ((k.data && k.hasContent && k.contentType !== !1) || b.contentType) &&
          v.setRequestHeader('Content-Type', k.contentType),
        v.setRequestHeader(
          'Accept',
          k.dataTypes[0] && k.accepts[k.dataTypes[0]]
            ? k.accepts[k.dataTypes[0]] + (k.dataTypes[0] !== '*' ? `, ${Kc}; q=0.01` : '')
            : k.accepts['*']
        );
      for (d in k.headers) v.setRequestHeader(d, k.headers[d]);
      if (k.beforeSend && (k.beforeSend.call(l, v, k) === !1 || t === 2)) return v.abort();
      u = 'abort';
      for (d in { success: 1, error: 1, complete: 1 }) v[d](k[d]);
      if ((i = Nc(Jc, k, b, v))) {
        (v.readyState = 1),
          h && m.trigger('ajaxSend', [v, k]),
          k.async &&
            k.timeout > 0 &&
            (g = setTimeout(() => {
              v.abort('timeout');
            }, k.timeout));
        try {
          (t = 1), i.send(r, x);
        } catch (w) {
          if (!(t < 2)) throw w;
          x(-1, w);
        }
      } else x(-1, 'No Transport');
      function x(a, b, c, d) {
        let j,
          r,
          s,
          u,
          w,
          x = b;
        t !== 2 &&
          ((t = 2),
          g && clearTimeout(g),
          (i = void 0),
          (f = d || ''),
          (v.readyState = a > 0 ? 4 : 0),
          (j = (a >= 200 && a < 300) || a === 304),
          c && (u = Pc(k, v, c)),
          (u = Qc(k, u, v, j)),
          j
            ? (k.ifModified &&
                ((w = v.getResponseHeader('Last-Modified')),
                w && (n.lastModified[e] = w),
                (w = v.getResponseHeader('etag')),
                w && (n.etag[e] = w)),
              a === 204 || k.type === 'HEAD'
                ? (x = 'nocontent')
                : a === 304
                  ? (x = 'notmodified')
                  : ((x = u.state), (r = u.data), (s = u.error), (j = !s)))
            : ((s = x), (a || !x) && ((x = 'error'), a < 0 && (a = 0))),
          (v.status = a),
          (v.statusText = `${b || x}`),
          j ? o.resolveWith(l, [r, x, v]) : o.rejectWith(l, [v, x, s]),
          v.statusCode(q),
          (q = void 0),
          h && m.trigger(j ? 'ajaxSuccess' : 'ajaxError', [v, k, j ? r : s]),
          p.fireWith(l, [v, x]),
          h && (m.trigger('ajaxComplete', [v, k]), --n.active || n.event.trigger('ajaxStop')));
      }
      return v;
    },
    getJSON(a, b, c) {
      return n.get(a, b, c, 'json');
    },
    getScript(a, b) {
      return n.get(a, void 0, b, 'script');
    },
  }),
    n.each(['get', 'post'], (a, b) => {
      n[b] = function(a, c, d, e) {
        return (
          n.isFunction(c) && ((e = e || d), (d = c), (c = void 0)),
          n.ajax({ url: a, type: b, dataType: e, data: c, success: d })
        );
      };
    }),
    n.each(
      ['ajaxStart', 'ajaxStop', 'ajaxComplete', 'ajaxError', 'ajaxSuccess', 'ajaxSend'],
      (a, b) => {
        n.fn[b] = function(a) {
          return this.on(b, a);
        };
      }
    ),
    (n._evalUrl = function(a) {
      return n.ajax({ url: a, type: 'GET', dataType: 'script', async: !1, global: !1, throws: !0 });
    }),
    n.fn.extend({
      wrapAll(a) {
        if (n.isFunction(a))
          return this.each(function(b) {
            n(this).wrapAll(a.call(this, b));
          });
        if (this[0]) {
          const b = n(a, this[0].ownerDocument)
            .eq(0)
            .clone(!0);
          this[0].parentNode && b.insertBefore(this[0]),
            b
              .map(function() {
                let a = this;
                while (a.firstChild && a.firstChild.nodeType === 1) a = a.firstChild;
                return a;
              })
              .append(this);
        }
        return this;
      },
      wrapInner(a) {
        return this.each(
          n.isFunction(a)
            ? function(b) {
                n(this).wrapInner(a.call(this, b));
              }
            : function() {
                let b = n(this),
                  c = b.contents();
                c.length ? c.wrapAll(a) : b.append(a);
              }
        );
      },
      wrap(a) {
        const b = n.isFunction(a);
        return this.each(function(c) {
          n(this).wrapAll(b ? a.call(this, c) : a);
        });
      },
      unwrap() {
        return this.parent()
          .each(function() {
            n.nodeName(this, 'body') || n(this).replaceWith(this.childNodes);
          })
          .end();
      },
    }),
    (n.expr.filters.hidden = function(a) {
      return (
        (a.offsetWidth <= 0 && a.offsetHeight <= 0) ||
        (!l.reliableHiddenOffsets() &&
          ((a.style && a.style.display) || n.css(a, 'display')) === 'none')
      );
    }),
    (n.expr.filters.visible = function(a) {
      return !n.expr.filters.hidden(a);
    });
  let Rc = /%20/g,
    Sc = /\[\]$/,
    Tc = /\r?\n/g,
    Uc = /^(?:submit|button|image|reset|file)$/i,
    Vc = /^(?:input|select|textarea|keygen)/i;
  function Wc(a, b, c, d) {
    let e;
    if (n.isArray(b))
      n.each(b, (b, e) => {
        c || Sc.test(a) ? d(a, e) : Wc(`${a}[${typeof e === 'object' ? b : ''}]`, e, c, d);
      });
    else if (c || n.type(b) !== 'object') d(a, b);
    else for (e in b) Wc(`${a}[${e}]`, b[e], c, d);
  }
  (n.param = function(a, b) {
    let c,
      d = [],
      e = function(a, b) {
        (b = n.isFunction(b) ? b() : b == null ? '' : b),
          (d[d.length] = `${encodeURIComponent(a)}=${encodeURIComponent(b)}`);
      };
    if (
      (void 0 === b && (b = n.ajaxSettings && n.ajaxSettings.traditional),
      n.isArray(a) || (a.jquery && !n.isPlainObject(a)))
    )
      n.each(a, function() {
        e(this.name, this.value);
      });
    else for (c in a) Wc(c, a[c], b, e);
    return d.join('&').replace(Rc, '+');
  }),
    n.fn.extend({
      serialize() {
        return n.param(this.serializeArray());
      },
      serializeArray() {
        return this.map(function() {
          const a = n.prop(this, 'elements');
          return a ? n.makeArray(a) : this;
        })
          .filter(function() {
            const a = this.type;
            return (
              this.name &&
              !n(this).is(':disabled') &&
              Vc.test(this.nodeName) &&
              !Uc.test(a) &&
              (this.checked || !X.test(a))
            );
          })
          .map(function(a, b) {
            const c = n(this).val();
            return c == null
              ? null
              : n.isArray(c)
                ? n.map(c, a => ({ name: b.name, value: a.replace(Tc, '\r\n') }))
                : { name: b.name, value: c.replace(Tc, '\r\n') };
          })
          .get();
      },
    }),
    (n.ajaxSettings.xhr =
      void 0 !== a.ActiveXObject
        ? function() {
            return (
              (!this.isLocal && /^(get|post|head|put|delete|options)$/i.test(this.type) && $c()) ||
              _c()
            );
          }
        : $c);
  let Xc = 0,
    Yc = {},
    Zc = n.ajaxSettings.xhr();
  a.ActiveXObject &&
    n(a).on('unload', () => {
      for (const a in Yc) Yc[a](void 0, !0);
    }),
    (l.cors = !!Zc && 'withCredentials' in Zc),
    (Zc = l.ajax = !!Zc),
    Zc &&
      n.ajaxTransport(a => {
        if (!a.crossDomain || l.cors) {
          let b;
          return {
            send(c, d) {
              let e,
                f = a.xhr(),
                g = ++Xc;
              if ((f.open(a.type, a.url, a.async, a.username, a.password), a.xhrFields))
                for (e in a.xhrFields) f[e] = a.xhrFields[e];
              a.mimeType && f.overrideMimeType && f.overrideMimeType(a.mimeType),
                a.crossDomain ||
                  c['X-Requested-With'] ||
                  (c['X-Requested-With'] = 'XMLHttpRequest');
              for (e in c) void 0 !== c[e] && f.setRequestHeader(e, `${c[e]}`);
              f.send((a.hasContent && a.data) || null),
                (b = function(c, e) {
                  let h, i, j;
                  if (b && (e || f.readyState === 4))
                    if ((delete Yc[g], (b = void 0), (f.onreadystatechange = n.noop), e))
                      f.readyState !== 4 && f.abort();
                    else {
                      (j = {}),
                        (h = f.status),
                        typeof f.responseText === 'string' && (j.text = f.responseText);
                      try {
                        i = f.statusText;
                      } catch (k) {
                        i = '';
                      }
                      h || !a.isLocal || a.crossDomain
                        ? h === 1223 && (h = 204)
                        : (h = j.text ? 200 : 404);
                    }
                  j && d(h, i, j, f.getAllResponseHeaders());
                }),
                a.async
                  ? f.readyState === 4 ? setTimeout(b) : (f.onreadystatechange = Yc[g] = b)
                  : b();
            },
            abort() {
              b && b(void 0, !0);
            },
          };
        }
      });
  function $c() {
    try {
      return new a.XMLHttpRequest();
    } catch (b) {}
  }
  function _c() {
    try {
      return new a.ActiveXObject('Microsoft.XMLHTTP');
    } catch (b) {}
  }
  n.ajaxSetup({
    accepts: {
      script:
        'text/javascript, application/javascript, application/ecmascript, application/x-ecmascript',
    },
    contents: { script: /(?:java|ecma)script/ },
    converters: {
      'text script': function(a) {
        return n.globalEval(a), a;
      },
    },
  }),
    n.ajaxPrefilter('script', a => {
      void 0 === a.cache && (a.cache = !1), a.crossDomain && ((a.type = 'GET'), (a.global = !1));
    }),
    n.ajaxTransport('script', a => {
      if (a.crossDomain) {
        let b,
          c = z.head || n('head')[0] || z.documentElement;
        return {
          send(d, e) {
            (b = z.createElement('script')),
              (b.async = !0),
              a.scriptCharset && (b.charset = a.scriptCharset),
              (b.src = a.url),
              (b.onload = b.onreadystatechange = function(a, c) {
                (c || !b.readyState || /loaded|complete/.test(b.readyState)) &&
                  ((b.onload = b.onreadystatechange = null),
                  b.parentNode && b.parentNode.removeChild(b),
                  (b = null),
                  c || e(200, 'success'));
              }),
              c.insertBefore(b, c.firstChild);
          },
          abort() {
            b && b.onload(void 0, !0);
          },
        };
      }
    });
  let ad = [],
    bd = /(=)\?(?=&|$)|\?\?/;
  n.ajaxSetup({
    jsonp: 'callback',
    jsonpCallback() {
      const a = ad.pop() || `${n.expando}_${wc++}`;
      return (this[a] = !0), a;
    },
  }),
    n.ajaxPrefilter('json jsonp', (b, c, d) => {
      let e,
        f,
        g,
        h =
          b.jsonp !== !1 &&
          (bd.test(b.url)
            ? 'url'
            : typeof b.data === 'string' &&
              !(b.contentType || '').indexOf('application/x-www-form-urlencoded') &&
              bd.test(b.data) &&
              'data');
      return h || b.dataTypes[0] === 'jsonp'
        ? ((e = b.jsonpCallback = n.isFunction(b.jsonpCallback)
            ? b.jsonpCallback()
            : b.jsonpCallback),
          h
            ? (b[h] = b[h].replace(bd, `$1${e}`))
            : b.jsonp !== !1 && (b.url += `${(xc.test(b.url) ? '&' : '?') + b.jsonp}=${e}`),
          (b.converters['script json'] = function() {
            return g || n.error(`${e} was not called`), g[0];
          }),
          (b.dataTypes[0] = 'json'),
          (f = a[e]),
          (a[e] = function() {
            g = arguments;
          }),
          d.always(() => {
            (a[e] = f),
              b[e] && ((b.jsonpCallback = c.jsonpCallback), ad.push(e)),
              g && n.isFunction(f) && f(g[0]),
              (g = f = void 0);
          }),
          'script')
        : void 0;
    }),
    (n.parseHTML = function(a, b, c) {
      if (!a || typeof a !== 'string') return null;
      typeof b === 'boolean' && ((c = b), (b = !1)), (b = b || z);
      let d = v.exec(a),
        e = !c && [];
      return d
        ? [b.createElement(d[1])]
        : ((d = n.buildFragment([a], b, e)),
          e && e.length && n(e).remove(),
          n.merge([], d.childNodes));
    });
  const cd = n.fn.load;
  (n.fn.load = function(a, b, c) {
    if (typeof a !== 'string' && cd) return cd.apply(this, arguments);
    let d,
      e,
      f,
      g = this,
      h = a.indexOf(' ');
    return (
      h >= 0 && ((d = a.slice(h, a.length)), (a = a.slice(0, h))),
      n.isFunction(b) ? ((c = b), (b = void 0)) : b && typeof b === 'object' && (f = 'POST'),
      g.length > 0 &&
        n
          .ajax({ url: a, type: f, dataType: 'html', data: b })
          .done(function(a) {
            (e = arguments),
              g.html(
                d
                  ? n('<div>')
                      .append(n.parseHTML(a))
                      .find(d)
                  : a
              );
          })
          .complete(
            c &&
              ((a, b) => {
                g.each(c, e || [a.responseText, b, a]);
              })
          ),
      this
    );
  }),
    (n.expr.filters.animated = function(a) {
      return n.grep(n.timers, b => a === b.elem).length;
    });
  const dd = a.document.documentElement;
  function ed(a) {
    return n.isWindow(a) ? a : a.nodeType === 9 ? a.defaultView || a.parentWindow : !1;
  }
  (n.offset = {
    setOffset(a, b, c) {
      let d,
        e,
        f,
        g,
        h,
        i,
        j,
        k = n.css(a, 'position'),
        l = n(a),
        m = {};
      k === 'static' && (a.style.position = 'relative'),
        (h = l.offset()),
        (f = n.css(a, 'top')),
        (i = n.css(a, 'left')),
        (j = (k === 'absolute' || k === 'fixed') && n.inArray('auto', [f, i]) > -1),
        j
          ? ((d = l.position()), (g = d.top), (e = d.left))
          : ((g = parseFloat(f) || 0), (e = parseFloat(i) || 0)),
        n.isFunction(b) && (b = b.call(a, c, h)),
        b.top != null && (m.top = b.top - h.top + g),
        b.left != null && (m.left = b.left - h.left + e),
        'using' in b ? b.using.call(a, m) : l.css(m);
    },
  }),
    n.fn.extend({
      offset(a) {
        if (arguments.length)
          return void 0 === a
            ? this
            : this.each(function(b) {
                n.offset.setOffset(this, a, b);
              });
        let b,
          c,
          d = { top: 0, left: 0 },
          e = this[0],
          f = e && e.ownerDocument;
        if (f)
          return (
            (b = f.documentElement),
            n.contains(b, e)
              ? (typeof e.getBoundingClientRect !== L && (d = e.getBoundingClientRect()),
                (c = ed(f)),
                {
                  top: d.top + (c.pageYOffset || b.scrollTop) - (b.clientTop || 0),
                  left: d.left + (c.pageXOffset || b.scrollLeft) - (b.clientLeft || 0),
                })
              : d
          );
      },
      position() {
        if (this[0]) {
          let a,
            b,
            c = { top: 0, left: 0 },
            d = this[0];
          return (
            n.css(d, 'position') === 'fixed'
              ? (b = d.getBoundingClientRect())
              : ((a = this.offsetParent()),
                (b = this.offset()),
                n.nodeName(a[0], 'html') || (c = a.offset()),
                (c.top += n.css(a[0], 'borderTopWidth', !0)),
                (c.left += n.css(a[0], 'borderLeftWidth', !0))),
            {
              top: b.top - c.top - n.css(d, 'marginTop', !0),
              left: b.left - c.left - n.css(d, 'marginLeft', !0),
            }
          );
        }
      },
      offsetParent() {
        return this.map(function() {
          let a = this.offsetParent || dd;
          while (a && !n.nodeName(a, 'html') && n.css(a, 'position') === 'static')
            a = a.offsetParent;
          return a || dd;
        });
      },
    }),
    n.each({ scrollLeft: 'pageXOffset', scrollTop: 'pageYOffset' }, (a, b) => {
      const c = /Y/.test(b);
      n.fn[a] = function(d) {
        return W(
          this,
          (a, d, e) => {
            const f = ed(a);
            return void 0 === e
              ? f ? (b in f ? f[b] : f.document.documentElement[d]) : a[d]
              : void (f
                  ? f.scrollTo(c ? n(f).scrollLeft() : e, c ? e : n(f).scrollTop())
                  : (a[d] = e));
          },
          a,
          d,
          arguments.length,
          null
        );
      };
    }),
    n.each(['top', 'left'], (a, b) => {
      n.cssHooks[b] = Mb(
        l.pixelPosition,
        (a, c) => (c ? ((c = Kb(a, b)), Ib.test(c) ? `${n(a).position()[b]}px` : c) : void 0)
      );
    }),
    n.each({ Height: 'height', Width: 'width' }, (a, b) => {
      n.each({ padding: `inner${a}`, content: b, '': `outer${a}` }, (c, d) => {
        n.fn[d] = function(d, e) {
          let f = arguments.length && (c || typeof d !== 'boolean'),
            g = c || (d === !0 || e === !0 ? 'margin' : 'border');
          return W(
            this,
            (b, c, d) => {
              let e;
              return n.isWindow(b)
                ? b.document.documentElement[`client${a}`]
                : b.nodeType === 9
                  ? ((e = b.documentElement),
                    Math.max(
                      b.body[`scroll${a}`],
                      e[`scroll${a}`],
                      b.body[`offset${a}`],
                      e[`offset${a}`],
                      e[`client${a}`]
                    ))
                  : void 0 === d ? n.css(b, c, g) : n.style(b, c, d, g);
            },
            b,
            f ? d : void 0,
            f,
            null
          );
        };
      });
    }),
    (n.fn.size = function() {
      return this.length;
    }),
    (n.fn.andSelf = n.fn.addBack),
    typeof define === 'function' && define.amd && define('jquery', [], () => n);
  let fd = a.jQuery,
    gd = a.$;
  return (
    (n.noConflict = function(b) {
      return a.$ === n && (a.$ = gd), b && a.jQuery === n && (a.jQuery = fd), n;
    }),
    typeof b === L && (a.jQuery = a.$ = n),
    n
  );
});
