/*! algoliasearch-lite.umd.js | 4.24.0 | © Algolia, inc. | https://github.com/algolia/algoliasearch-client-javascript */
!(function (e, t) {
  "object" == typeof exports && "undefined" != typeof module
    ? (module.exports = t())
    : "function" == typeof define && define.amd
    ? define(t)
    : ((e = e || self).algoliasearch = t());
})(this, function () {
  "use strict";
  function e(e, t, r) {
    return (
      t in e
        ? Object.defineProperty(e, t, {
            value: r,
            enumerable: !0,
            configurable: !0,
            writable: !0,
          })
        : (e[t] = r),
      e
    );
  }
  function t(e, t) {
    var r = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var n = Object.getOwnPropertySymbols(e);
      t &&
        (n = n.filter(function (t) {
          return Object.getOwnPropertyDescriptor(e, t).enumerable;
        })),
        r.push.apply(r, n);
    }
    return r;
  }
  function r(r) {
    for (var n = 1; n < arguments.length; n++) {
      var o = null != arguments[n] ? arguments[n] : {};
      n % 2
        ? t(Object(o), !0).forEach(function (t) {
            e(r, t, o[t]);
          })
        : Object.getOwnPropertyDescriptors
        ? Object.defineProperties(r, Object.getOwnPropertyDescriptors(o))
        : t(Object(o)).forEach(function (e) {
            Object.defineProperty(r, e, Object.getOwnPropertyDescriptor(o, e));
          });
    }
    return r;
  }
  function n(e, t) {
    if (null == e) return {};
    var r,
      n,
      o = (function (e, t) {
        if (null == e) return {};
        var r,
          n,
          o = {},
          a = Object.keys(e);
        for (n = 0; n < a.length; n++)
          (r = a[n]), t.indexOf(r) >= 0 || (o[r] = e[r]);
        return o;
      })(e, t);
    if (Object.getOwnPropertySymbols) {
      var a = Object.getOwnPropertySymbols(e);
      for (n = 0; n < a.length; n++)
        (r = a[n]),
          t.indexOf(r) >= 0 ||
            (Object.prototype.propertyIsEnumerable.call(e, r) && (o[r] = e[r]));
    }
    return o;
  }
  function o(e, t) {
    return (
      (function (e) {
        if (Array.isArray(e)) return e;
      })(e) ||
      (function (e, t) {
        if (
          !(
            Symbol.iterator in Object(e) ||
            "[object Arguments]" === Object.prototype.toString.call(e)
          )
        )
          return;
        var r = [],
          n = !0,
          o = !1,
          a = void 0;
        try {
          for (
            var u, i = e[Symbol.iterator]();
            !(n = (u = i.next()).done) &&
            (r.push(u.value), !t || r.length !== t);
            n = !0
          );
        } catch (e) {
          (o = !0), (a = e);
        } finally {
          try {
            n || null == i.return || i.return();
          } finally {
            if (o) throw a;
          }
        }
        return r;
      })(e, t) ||
      (function () {
        throw new TypeError(
          "Invalid attempt to destructure non-iterable instance"
        );
      })()
    );
  }
  function a(e) {
    return (
      (function (e) {
        if (Array.isArray(e)) {
          for (var t = 0, r = new Array(e.length); t < e.length; t++)
            r[t] = e[t];
          return r;
        }
      })(e) ||
      (function (e) {
        if (
          Symbol.iterator in Object(e) ||
          "[object Arguments]" === Object.prototype.toString.call(e)
        )
          return Array.from(e);
      })(e) ||
      (function () {
        throw new TypeError("Invalid attempt to spread non-iterable instance");
      })()
    );
  }
  function u(e) {
    var t,
      r = "algoliasearch-client-js-".concat(e.key),
      n = function () {
        return void 0 === t && (t = e.localStorage || window.localStorage), t;
      },
      a = function () {
        return JSON.parse(n().getItem(r) || "{}");
      },
      u = function (e) {
        n().setItem(r, JSON.stringify(e));
      },
      i = function () {
        var t = e.timeToLive ? 1e3 * e.timeToLive : null,
          r = a(),
          n = Object.fromEntries(
            Object.entries(r).filter(function (e) {
              return void 0 !== o(e, 2)[1].timestamp;
            })
          );
        if ((u(n), t)) {
          var i = Object.fromEntries(
            Object.entries(n).filter(function (e) {
              var r = o(e, 2)[1],
                n = new Date().getTime();
              return !(r.timestamp + t < n);
            })
          );
          u(i);
        }
      };
    return {
      get: function (e, t) {
        var r =
          arguments.length > 2 && void 0 !== arguments[2]
            ? arguments[2]
            : {
                miss: function () {
                  return Promise.resolve();
                },
              };
        return Promise.resolve()
          .then(function () {
            i();
            var t = JSON.stringify(e);
            return a()[t];
          })
          .then(function (e) {
            return Promise.all([e ? e.value : t(), void 0 !== e]);
          })
          .then(function (e) {
            var t = o(e, 2),
              n = t[0],
              a = t[1];
            return Promise.all([n, a || r.miss(n)]);
          })
          .then(function (e) {
            return o(e, 1)[0];
          });
      },
      set: function (e, t) {
        return Promise.resolve().then(function () {
          var o = a();
          return (
            (o[JSON.stringify(e)] = {
              timestamp: new Date().getTime(),
              value: t,
            }),
            n().setItem(r, JSON.stringify(o)),
            t
          );
        });
      },
      delete: function (e) {
        return Promise.resolve().then(function () {
          var t = a();
          delete t[JSON.stringify(e)], n().setItem(r, JSON.stringify(t));
        });
      },
      clear: function () {
        return Promise.resolve().then(function () {
          n().removeItem(r);
        });
      },
    };
  }
  function i(e) {
    var t = a(e.caches),
      r = t.shift();
    return void 0 === r
      ? {
          get: function (e, t) {
            var r =
                arguments.length > 2 && void 0 !== arguments[2]
                  ? arguments[2]
                  : {
                      miss: function () {
                        return Promise.resolve();
                      },
                    },
              n = t();
            return n
              .then(function (e) {
                return Promise.all([e, r.miss(e)]);
              })
              .then(function (e) {
                return o(e, 1)[0];
              });
          },
          set: function (e, t) {
            return Promise.resolve(t);
          },
          delete: function (e) {
            return Promise.resolve();
          },
          clear: function () {
            return Promise.resolve();
          },
        }
      : {
          get: function (e, n) {
            var o =
              arguments.length > 2 && void 0 !== arguments[2]
                ? arguments[2]
                : {
                    miss: function () {
                      return Promise.resolve();
                    },
                  };
            return r.get(e, n, o).catch(function () {
              return i({ caches: t }).get(e, n, o);
            });
          },
          set: function (e, n) {
            return r.set(e, n).catch(function () {
              return i({ caches: t }).set(e, n);
            });
          },
          delete: function (e) {
            return r.delete(e).catch(function () {
              return i({ caches: t }).delete(e);
            });
          },
          clear: function () {
            return r.clear().catch(function () {
              return i({ caches: t }).clear();
            });
          },
        };
  }
  function s() {
    var e =
        arguments.length > 0 && void 0 !== arguments[0]
          ? arguments[0]
          : { serializable: !0 },
      t = {};
    return {
      get: function (r, n) {
        var o =
            arguments.length > 2 && void 0 !== arguments[2]
              ? arguments[2]
              : {
                  miss: function () {
                    return Promise.resolve();
                  },
                },
          a = JSON.stringify(r);
        if (a in t)
          return Promise.resolve(e.serializable ? JSON.parse(t[a]) : t[a]);
        var u = n(),
          i =
            (o && o.miss) ||
            function () {
              return Promise.resolve();
            };
        return u
          .then(function (e) {
            return i(e);
          })
          .then(function () {
            return u;
          });
      },
      set: function (r, n) {
        return (
          (t[JSON.stringify(r)] = e.serializable ? JSON.stringify(n) : n),
          Promise.resolve(n)
        );
      },
      delete: function (e) {
        return delete t[JSON.stringify(e)], Promise.resolve();
      },
      clear: function () {
        return (t = {}), Promise.resolve();
      },
    };
  }
  function c(e) {
    for (var t = e.length - 1; t > 0; t--) {
      var r = Math.floor(Math.random() * (t + 1)),
        n = e[t];
      (e[t] = e[r]), (e[r] = n);
    }
    return e;
  }
  function l(e, t) {
    return t
      ? (Object.keys(t).forEach(function (r) {
          e[r] = t[r](e);
        }),
        e)
      : e;
  }
  function f(e) {
    for (
      var t = arguments.length, r = new Array(t > 1 ? t - 1 : 0), n = 1;
      n < t;
      n++
    )
      r[n - 1] = arguments[n];
    var o = 0;
    return e.replace(/%s/g, function () {
      return encodeURIComponent(r[o++]);
    });
  }
  var h = { WithinQueryParameters: 0, WithinHeaders: 1 };
  function m(e, t) {
    var r = e || {},
      n = r.data || {};
    return (
      Object.keys(r).forEach(function (e) {
        -1 ===
          [
            "timeout",
            "headers",
            "queryParameters",
            "data",
            "cacheable",
          ].indexOf(e) && (n[e] = r[e]);
      }),
      {
        data: Object.entries(n).length > 0 ? n : void 0,
        timeout: r.timeout || t,
        headers: r.headers || {},
        queryParameters: r.queryParameters || {},
        cacheable: r.cacheable,
      }
    );
  }
  var d = { Read: 1, Write: 2, Any: 3 },
    p = 1,
    v = 2,
    g = 3;
  function y(e) {
    var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : p;
    return r(r({}, e), {}, { status: t, lastUpdate: Date.now() });
  }
  function b(e) {
    return "string" == typeof e
      ? { protocol: "https", url: e, accept: d.Any }
      : {
          protocol: e.protocol || "https",
          url: e.url,
          accept: e.accept || d.Any,
        };
  }
  var O = "GET",
    P = "POST";
  function q(e, t) {
    return Promise.all(
      t.map(function (t) {
        return e.get(t, function () {
          return Promise.resolve(y(t));
        });
      })
    ).then(function (e) {
      var r = e.filter(function (e) {
          return (function (e) {
            return e.status === p || Date.now() - e.lastUpdate > 12e4;
          })(e);
        }),
        n = e.filter(function (e) {
          return (function (e) {
            return e.status === g && Date.now() - e.lastUpdate <= 12e4;
          })(e);
        }),
        o = [].concat(a(r), a(n));
      return {
        getTimeout: function (e, t) {
          return (0 === n.length && 0 === e ? 1 : n.length + 3 + e) * t;
        },
        statelessHosts:
          o.length > 0
            ? o.map(function (e) {
                return b(e);
              })
            : t,
      };
    });
  }
  function j(e, t, n, o) {
    var u = [],
      i = (function (e, t) {
        if (e.method === O || (void 0 === e.data && void 0 === t.data)) return;
        var n = Array.isArray(e.data) ? e.data : r(r({}, e.data), t.data);
        return JSON.stringify(n);
      })(n, o),
      s = (function (e, t) {
        var n = r(r({}, e.headers), t.headers),
          o = {};
        return (
          Object.keys(n).forEach(function (e) {
            var t = n[e];
            o[e.toLowerCase()] = t;
          }),
          o
        );
      })(e, o),
      c = n.method,
      l = n.method !== O ? {} : r(r({}, n.data), o.data),
      f = r(
        r(r({ "x-algolia-agent": e.userAgent.value }, e.queryParameters), l),
        o.queryParameters
      ),
      h = 0,
      m = function t(r, a) {
        var l = r.pop();
        if (void 0 === l)
          throw {
            name: "RetryError",
            message:
              "Unreachable hosts - your application id may be incorrect. If the error persists, please reach out to the Algolia Support team: https://alg.li/support .",
            transporterStackTrace: A(u),
          };
        var m = {
            data: i,
            headers: s,
            method: c,
            url: S(l, n.path, f),
            connectTimeout: a(h, e.timeouts.connect),
            responseTimeout: a(h, o.timeout),
          },
          d = function (e) {
            var t = { request: m, response: e, host: l, triesLeft: r.length };
            return u.push(t), t;
          },
          p = {
            onSuccess: function (e) {
              return (function (e) {
                try {
                  return JSON.parse(e.content);
                } catch (t) {
                  throw (function (e, t) {
                    return {
                      name: "DeserializationError",
                      message: e,
                      response: t,
                    };
                  })(t.message, e);
                }
              })(e);
            },
            onRetry: function (n) {
              var o = d(n);
              return (
                n.isTimedOut && h++,
                Promise.all([
                  e.logger.info("Retryable failure", x(o)),
                  e.hostsCache.set(l, y(l, n.isTimedOut ? g : v)),
                ]).then(function () {
                  return t(r, a);
                })
              );
            },
            onFail: function (e) {
              throw (
                (d(e),
                (function (e, t) {
                  var r = e.content,
                    n = e.status,
                    o = r;
                  try {
                    o = JSON.parse(r).message;
                  } catch (e) {}
                  return (function (e, t, r) {
                    return {
                      name: "ApiError",
                      message: e,
                      status: t,
                      transporterStackTrace: r,
                    };
                  })(o, n, t);
                })(e, A(u)))
              );
            },
          };
        return e.requester.send(m).then(function (e) {
          return (function (e, t) {
            return (function (e) {
              var t = e.status;
              return (
                e.isTimedOut ||
                (function (e) {
                  var t = e.isTimedOut,
                    r = e.status;
                  return !t && 0 == ~~r;
                })(e) ||
                (2 != ~~(t / 100) && 4 != ~~(t / 100))
              );
            })(e)
              ? t.onRetry(e)
              : 2 == ~~(e.status / 100)
              ? t.onSuccess(e)
              : t.onFail(e);
          })(e, p);
        });
      };
    return q(e.hostsCache, t).then(function (e) {
      return m(a(e.statelessHosts).reverse(), e.getTimeout);
    });
  }
  function w(e) {
    var t = {
      value: "Algolia for JavaScript (".concat(e, ")"),
      add: function (e) {
        var r = "; "
          .concat(e.segment)
          .concat(void 0 !== e.version ? " (".concat(e.version, ")") : "");
        return (
          -1 === t.value.indexOf(r) && (t.value = "".concat(t.value).concat(r)),
          t
        );
      },
    };
    return t;
  }
  function S(e, t, r) {
    var n = T(r),
      o = ""
        .concat(e.protocol, "://")
        .concat(e.url, "/")
        .concat("/" === t.charAt(0) ? t.substr(1) : t);
    return n.length && (o += "?".concat(n)), o;
  }
  function T(e) {
    return Object.keys(e)
      .map(function (t) {
        return f(
          "%s=%s",
          t,
          ((r = e[t]),
          "[object Object]" === Object.prototype.toString.call(r) ||
          "[object Array]" === Object.prototype.toString.call(r)
            ? JSON.stringify(e[t])
            : e[t])
        );
        var r;
      })
      .join("&");
  }
  function A(e) {
    return e.map(function (e) {
      return x(e);
    });
  }
  function x(e) {
    var t = e.request.headers["x-algolia-api-key"]
      ? { "x-algolia-api-key": "*****" }
      : {};
    return r(
      r({}, e),
      {},
      {
        request: r(
          r({}, e.request),
          {},
          { headers: r(r({}, e.request.headers), t) }
        ),
      }
    );
  }
  var N = function (e) {
      var t = e.appId,
        n = (function (e, t, r) {
          var n = { "x-algolia-api-key": r, "x-algolia-application-id": t };
          return {
            headers: function () {
              return e === h.WithinHeaders ? n : {};
            },
            queryParameters: function () {
              return e === h.WithinQueryParameters ? n : {};
            },
          };
        })(void 0 !== e.authMode ? e.authMode : h.WithinHeaders, t, e.apiKey),
        a = (function (e) {
          var t = e.hostsCache,
            r = e.logger,
            n = e.requester,
            a = e.requestsCache,
            u = e.responsesCache,
            i = e.timeouts,
            s = e.userAgent,
            c = e.hosts,
            l = e.queryParameters,
            f = {
              hostsCache: t,
              logger: r,
              requester: n,
              requestsCache: a,
              responsesCache: u,
              timeouts: i,
              userAgent: s,
              headers: e.headers,
              queryParameters: l,
              hosts: c.map(function (e) {
                return b(e);
              }),
              read: function (e, t) {
                var r = m(t, f.timeouts.read),
                  n = function () {
                    return j(
                      f,
                      f.hosts.filter(function (e) {
                        return 0 != (e.accept & d.Read);
                      }),
                      e,
                      r
                    );
                  };
                if (
                  !(void 0 !== r.cacheable ? r.cacheable : e.cacheable === !0)
                )
                  return n();
                var a = {
                  request: e,
                  mappedRequestOptions: r,
                  transporter: {
                    queryParameters: f.queryParameters,
                    headers: f.headers,
                  },
                };
                return f.responsesCache.get(
                  a,
                  function () {
                    return f.requestsCache.get(a, function () {
                      return f.requestsCache
                        .set(a, n())
                        .then(
                          function (e) {
                            return Promise.all([f.requestsCache.delete(a), e]);
                          },
                          function (e) {
                            return Promise.all([
                              f.requestsCache.delete(a),
                              Promise.reject(e),
                            ]);
                          }
                        )
                        .then(function (e) {
                          var t = o(e, 2);
                          t[0];
                          return t[1];
                        });
                    });
                  },
                  {
                    miss: function (e) {
                      return f.responsesCache.set(a, e);
                    },
                  }
                );
              },
              write: function (e, t) {
                return j(
                  f,
                  f.hosts.filter(function (e) {
                    return 0 != (e.accept & d.Write);
                  }),
                  e,
                  m(t, f.timeouts.write)
                );
              },
            };
          return f;
        })(
          r(
            r(
              {
                hosts: [
                  { url: "".concat(t, "-dsn.algolia.net"), accept: d.Read },
                  { url: "".concat(t, ".algolia.net"), accept: d.Write },
                ].concat(
                  c([
                    { url: "".concat(t, "-1.algolianet.com") },
                    { url: "".concat(t, "-2.algolianet.com") },
                    { url: "".concat(t, "-3.algolianet.com") },
                  ])
                ),
              },
              e
            ),
            {},
            {
              headers: r(
                r(r({}, n.headers()), {
                  "content-type": "application/x-www-form-urlencoded",
                }),
                e.headers
              ),
              queryParameters: r(r({}, n.queryParameters()), e.queryParameters),
            }
          )
        );
      return l(
        {
          transporter: a,
          appId: t,
          addAlgoliaAgent: function (e, t) {
            a.userAgent.add({ segment: e, version: t });
          },
          clearCache: function () {
            return Promise.all([
              a.requestsCache.clear(),
              a.responsesCache.clear(),
            ]).then(function () {});
          },
        },
        e.methods
      );
    },
    C = function (e) {
      return function (t, r) {
        return t.method === O
          ? e.transporter.read(t, r)
          : e.transporter.write(t, r);
      };
    },
    E = function (e) {
      return function (t) {
        var r =
            arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {},
          n = { transporter: e.transporter, appId: e.appId, indexName: t };
        return l(n, r.methods);
      };
    },
    J = function (e) {
      return function (t, n) {
        var o = t.map(function (e) {
          return r(r({}, e), {}, { params: T(e.params || {}) });
        });
        return e.transporter.read(
          {
            method: P,
            path: "1/indexes/*/queries",
            data: { requests: o },
            cacheable: !0,
          },
          n
        );
      };
    },
    k = function (e) {
      return function (t, o) {
        return Promise.all(
          t.map(function (t) {
            var a = t.params,
              u = a.facetName,
              i = a.facetQuery,
              s = n(a, ["facetName", "facetQuery"]);
            return E(e)(t.indexName, {
              methods: { searchForFacetValues: F },
            }).searchForFacetValues(u, i, r(r({}, o), s));
          })
        );
      };
    },
    I = function (e) {
      return function (t, r, n) {
        return e.transporter.read(
          {
            method: P,
            path: f("1/answers/%s/prediction", e.indexName),
            data: { query: t, queryLanguages: r },
            cacheable: !0,
          },
          n
        );
      };
    },
    R = function (e) {
      return function (t, r) {
        return e.transporter.read(
          {
            method: P,
            path: f("1/indexes/%s/query", e.indexName),
            data: { query: t },
            cacheable: !0,
          },
          r
        );
      };
    },
    F = function (e) {
      return function (t, r, n) {
        return e.transporter.read(
          {
            method: P,
            path: f("1/indexes/%s/facets/%s/query", e.indexName, t),
            data: { facetQuery: r },
            cacheable: !0,
          },
          n
        );
      };
    },
    D = 1,
    W = 2,
    H = 3;
  var Q = function (e) {
    return function (t, n) {
      var o = t.map(function (e) {
        return r(r({}, e), {}, { threshold: e.threshold || 0 });
      });
      return e.transporter.read(
        {
          method: P,
          path: "1/indexes/*/recommendations",
          data: { requests: o },
          cacheable: !0,
        },
        n
      );
    };
  };
  function L(e, t, n) {
    var o,
      a = {
        appId: e,
        apiKey: t,
        timeouts: { connect: 1, read: 2, write: 30 },
        requester: {
          send: function (e) {
            return new Promise(function (t) {
              var r = new XMLHttpRequest();
              r.open(e.method, e.url, !0),
                Object.keys(e.headers).forEach(function (t) {
                  return r.setRequestHeader(t, e.headers[t]);
                });
              var n,
                o = function (e, n) {
                  return setTimeout(function () {
                    r.abort(), t({ status: 0, content: n, isTimedOut: !0 });
                  }, 1e3 * e);
                },
                a = o(e.connectTimeout, "Connection timeout");
              (r.onreadystatechange = function () {
                r.readyState > r.OPENED &&
                  void 0 === n &&
                  (clearTimeout(a),
                  (n = o(e.responseTimeout, "Socket timeout")));
              }),
                (r.onerror = function () {
                  0 === r.status &&
                    (clearTimeout(a),
                    clearTimeout(n),
                    t({
                      content: r.responseText || "Network request failed",
                      status: r.status,
                      isTimedOut: !1,
                    }));
                }),
                (r.onload = function () {
                  clearTimeout(a),
                    clearTimeout(n),
                    t({
                      content: r.responseText,
                      status: r.status,
                      isTimedOut: !1,
                    });
                }),
                r.send(e.data);
            });
          },
        },
        logger:
          ((o = H),
          {
            debug: function (e, t) {
              return D >= o && console.debug(e, t), Promise.resolve();
            },
            info: function (e, t) {
              return W >= o && console.info(e, t), Promise.resolve();
            },
            error: function (e, t) {
              return console.error(e, t), Promise.resolve();
            },
          }),
        responsesCache: s(),
        requestsCache: s({ serializable: !1 }),
        hostsCache: i({
          caches: [u({ key: "".concat("4.24.0", "-").concat(e) }), s()],
        }),
        userAgent: w("4.24.0").add({ segment: "Browser", version: "lite" }),
        authMode: h.WithinQueryParameters,
      };
    return N(
      r(
        r(r({}, a), n),
        {},
        {
          methods: {
            search: J,
            searchForFacetValues: k,
            multipleQueries: J,
            multipleSearchForFacetValues: k,
            customRequest: C,
            initIndex: function (e) {
              return function (t) {
                return E(e)(t, {
                  methods: {
                    search: R,
                    searchForFacetValues: F,
                    findAnswers: I,
                  },
                });
              };
            },
            getRecommendations: Q,
          },
        }
      )
    );
  }
  return (L.version = "4.24.0"), L;
});

!(function (e, t) {
  "object" == typeof exports && "undefined" != typeof module
    ? (module.exports = t())
    : "function" == typeof define && define.amd
    ? define(t)
    : ((e = e || self).instantsearch = t());
})(this, function () {
  "use strict";
  var a = 0;
  function o(t, e) {
    var n,
      r = Object.keys(t);
    return (
      Object.getOwnPropertySymbols &&
        ((n = Object.getOwnPropertySymbols(t)),
        e &&
          (n = n.filter(function (e) {
            return Object.getOwnPropertyDescriptor(t, e).enumerable;
          })),
        r.push.apply(r, n)),
      r
    );
  }
  function F(t) {
    for (var e = 1; e < arguments.length; e++) {
      var n = null != arguments[e] ? arguments[e] : {};
      e % 2
        ? o(Object(n), !0).forEach(function (e) {
            E(t, e, n[e]);
          })
        : Object.getOwnPropertyDescriptors
        ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(n))
        : o(Object(n)).forEach(function (e) {
            Object.defineProperty(t, e, Object.getOwnPropertyDescriptor(n, e));
          });
    }
    return t;
  }
  function W(e) {
    return (W =
      "function" == typeof Symbol && "symbol" == typeof Symbol.iterator
        ? function (e) {
            return typeof e;
          }
        : function (e) {
            return e &&
              "function" == typeof Symbol &&
              e.constructor === Symbol &&
              e !== Symbol.prototype
              ? "symbol"
              : typeof e;
          })(e);
  }
  function D(e, t) {
    if (!(e instanceof t))
      throw new TypeError("Cannot call a class as a function");
  }
  function c(e, t) {
    for (var n = 0; n < t.length; n++) {
      var r = t[n];
      (r.enumerable = r.enumerable || !1),
        (r.configurable = !0),
        "value" in r && (r.writable = !0),
        Object.defineProperty(e, J(r.key), r);
    }
  }
  function $(e, t, n) {
    return (
      t && c(e.prototype, t),
      n && c(e, n),
      Object.defineProperty(e, "prototype", { writable: !1 }),
      e
    );
  }
  function E(e, t, n) {
    return (
      (t = J(t)) in e
        ? Object.defineProperty(e, t, {
            value: n,
            enumerable: !0,
            configurable: !0,
            writable: !0,
          })
        : (e[t] = n),
      e
    );
  }
  function g() {
    return (g = Object.assign
      ? Object.assign.bind()
      : function (e) {
          for (var t = 1; t < arguments.length; t++) {
            var n,
              r = arguments[t];
            for (n in r)
              Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
          }
          return e;
        }).apply(this, arguments);
  }
  function B(e, t) {
    if ("function" != typeof t && null !== t)
      throw new TypeError("Super expression must either be null or a function");
    (e.prototype = Object.create(t && t.prototype, {
      constructor: { value: e, writable: !0, configurable: !0 },
    })),
      Object.defineProperty(e, "prototype", { writable: !1 }),
      t && q(e, t);
  }
  function U(e) {
    return (U = Object.setPrototypeOf
      ? Object.getPrototypeOf.bind()
      : function (e) {
          return e.__proto__ || Object.getPrototypeOf(e);
        })(e);
  }
  function q(e, t) {
    return (q = Object.setPrototypeOf
      ? Object.setPrototypeOf.bind()
      : function (e, t) {
          return (e.__proto__ = t), e;
        })(e, t);
  }
  function Q(e) {
    if (null == e) throw new TypeError("Cannot destructure " + e);
  }
  function j(e, t) {
    if (null == e) return {};
    var n,
      r = (function (e, t) {
        if (null == e) return {};
        for (var n, r = {}, i = Object.keys(e), a = 0; a < i.length; a++)
          (n = i[a]), 0 <= t.indexOf(n) || (r[n] = e[n]);
        return r;
      })(e, t);
    if (Object.getOwnPropertySymbols)
      for (var i = Object.getOwnPropertySymbols(e), a = 0; a < i.length; a++)
        (n = i[a]),
          0 <= t.indexOf(n) ||
            (Object.prototype.propertyIsEnumerable.call(e, n) && (r[n] = e[n]));
    return r;
  }
  function y(e) {
    if (void 0 === e)
      throw new ReferenceError(
        "this hasn't been initialised - super() hasn't been called"
      );
    return e;
  }
  function V(n) {
    var r = (function () {
      if ("undefined" == typeof Reflect || !Reflect.construct) return !1;
      if (Reflect.construct.sham) return !1;
      if ("function" == typeof Proxy) return !0;
      try {
        return (
          Boolean.prototype.valueOf.call(
            Reflect.construct(Boolean, [], function () {})
          ),
          !0
        );
      } catch (e) {
        return !1;
      }
    })();
    return function () {
      var e,
        t = U(n),
        t =
          ((e = r
            ? ((e = U(this).constructor), Reflect.construct(t, arguments, e))
            : t.apply(this, arguments)),
          this);
      if (e && ("object" == typeof e || "function" == typeof e)) return e;
      if (void 0 !== e)
        throw new TypeError(
          "Derived constructors may only return object or undefined"
        );
      return y(t);
    };
  }
  function k(e, t) {
    return (
      (function (e) {
        if (Array.isArray(e)) return e;
      })(e) ||
      (function (e, t) {
        var n =
          null == e
            ? null
            : ("undefined" != typeof Symbol && e[Symbol.iterator]) ||
              e["@@iterator"];
        if (null != n) {
          var r,
            i,
            a,
            s,
            o = [],
            c = !0,
            u = !1;
          try {
            if (((a = (n = n.call(e)).next), 0 === t)) {
              if (Object(n) !== n) return;
              c = !1;
            } else
              for (
                ;
                !(c = (r = a.call(n)).done) &&
                (o.push(r.value), o.length !== t);
                c = !0
              );
          } catch (e) {
            (u = !0), (i = e);
          } finally {
            try {
              if (!c && null != n.return && ((s = n.return()), Object(s) !== s))
                return;
            } finally {
              if (u) throw i;
            }
          }
          return o;
        }
      })(e, t) ||
      K(e, t) ||
      (function () {
        throw new TypeError(
          "Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."
        );
      })()
    );
  }
  function P(e) {
    return (
      (function (e) {
        if (Array.isArray(e)) return z(e);
      })(e) ||
      (function (e) {
        if (
          ("undefined" != typeof Symbol && null != e[Symbol.iterator]) ||
          null != e["@@iterator"]
        )
          return Array.from(e);
      })(e) ||
      K(e) ||
      (function () {
        throw new TypeError(
          "Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."
        );
      })()
    );
  }
  function K(e, t) {
    var n;
    if (e)
      return "string" == typeof e
        ? z(e, t)
        : "Map" ===
            (n =
              "Object" ===
                (n = Object.prototype.toString.call(e).slice(8, -1)) &&
              e.constructor
                ? e.constructor.name
                : n) || "Set" === n
        ? Array.from(e)
        : "Arguments" === n ||
          /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)
        ? z(e, t)
        : void 0;
  }
  function z(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n = 0, r = new Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function J(e) {
    e = (function (e, t) {
      if ("object" != typeof e || null === e) return e;
      var n = e[Symbol.toPrimitive];
      if (void 0 === n) return ("string" === t ? String : Number)(e);
      if ("object" != typeof (n = n.call(e, t || "default"))) return n;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    })(e, "string");
    return "symbol" == typeof e ? e : String(e);
  }
  function R() {}
  function Z(e, t) {
    return e;
  }
  function Y(e) {
    return Object.prototype.toString.call(e).slice(8, -1);
  }
  function f(e, t) {
    if (void 0 === e || "function" != typeof e)
      throw new Error(
        "The render function is not valid (received type "
          .concat(Y(e), ").\n\n")
          .concat(t)
      );
  }
  function X(e) {
    var t = e.helper,
      e = e.attributesToClear,
      e = void 0 === e ? [] : e,
      n = t.state.setPage(0),
      n = e.reduce(function (e, t) {
        return n.isNumericRefined(t)
          ? e.removeNumericRefinement(t)
          : n.isHierarchicalFacet(t)
          ? e.removeHierarchicalFacetRefinement(t)
          : n.isDisjunctiveFacet(t)
          ? e.removeDisjunctiveFacetRefinement(t)
          : n.isConjunctiveFacet(t)
          ? e.removeFacetRefinement(t)
          : e;
      }, n);
    return (n = -1 !== e.indexOf("query") ? n.setQuery("") : n);
  }
  var G = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    },
    ee = /[&<>"']/g,
    te = RegExp(ee.source);
  var ne = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&#39;": "'",
    },
    re = /&(amp|quot|lt|gt|#39);/g,
    ie = RegExp(re.source);
  function ae(e) {
    return e && ie.test(e)
      ? e.replace(re, function (e) {
          return ne[e];
        })
      : e;
  }
  function se(e) {
    if (
      "object" === W((t = e)) &&
      null !== t &&
      "[object Object]" ===
        (null === (t = e)
          ? void 0 === t
            ? "[object Undefined]"
            : "[object Null]"
          : Object.prototype.toString.call(t))
    ) {
      var t;
      if (null === Object.getPrototypeOf(e)) return 1;
      for (var n = e; null !== Object.getPrototypeOf(n); )
        n = Object.getPrototypeOf(n);
      return Object.getPrototypeOf(e) === n;
    }
  }
  var O = {
      highlightPreTag: "__ais-highlight__",
      highlightPostTag: "__/ais-highlight__",
    },
    u = { highlightPreTag: "<mark>", highlightPostTag: "</mark>" };
  function oe(e) {
    return (
      (e = e) && te.test(e)
        ? e.replace(ee, function (e) {
            return G[e];
          })
        : e
    )
      .replace(new RegExp(O.highlightPreTag, "g"), u.highlightPreTag)
      .replace(new RegExp(O.highlightPostTag, "g"), u.highlightPostTag);
  }
  function ce(n) {
    return se(n) && "string" != typeof n.value
      ? Object.keys(n).reduce(function (e, t) {
          return F(F({}, e), {}, E({}, t, ce(n[t])));
        }, {})
      : Array.isArray(n)
      ? n.map(ce)
      : F(F({}, n), {}, { value: oe(n.value) });
  }
  function ue(e) {
    return (
      void 0 === e.__escaped &&
        ((e = e.map(function (e) {
          e = g({}, (Q(e), e));
          return (
            e._highlightResult && (e._highlightResult = ce(e._highlightResult)),
            e._snippetResult && (e._snippetResult = ce(e._snippetResult)),
            e
          );
        })).__escaped = !0),
      e
    );
  }
  function le(e) {
    var t = u.highlightPreTag,
      n = u.highlightPostTag;
    return e
      .map(function (e) {
        return e.isHighlighted ? t + e.value + n : e.value;
      })
      .join("");
  }
  function de(e) {
    var h = e.instantSearchInstance,
      f = e.helper,
      m = e.attribute,
      p = e.widgetType;
    return function () {
      for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++)
        t[n] = arguments[n];
      var r,
        i,
        a,
        s = t[1],
        o = t[2],
        o = void 0 === o ? "Filter Applied" : o,
        c = t[3],
        c = void 0 === c ? {} : c,
        u = k(t[0].split(":"), 2),
        l = u[0],
        u = u[1],
        d = "string" == typeof m ? m : m(s);
      1 === t.length && "object" === W(t[0])
        ? h.sendEventToInsights(t[0])
        : "click" === l &&
          2 <= t.length &&
          t.length <= 4 &&
          ((i = d),
          (a = s),
          ((r = f).state.isHierarchicalFacet(i)
            ? r.state.isHierarchicalFacetRefined(i, a)
            : r.state.isConjunctiveFacet(i)
            ? r.state.isFacetRefined(i, a)
            : r.state.isDisjunctiveFacetRefined(i, a)) ||
            h.sendEventToInsights({
              insightsMethod: "clickedFilters",
              widgetType: p,
              eventType: l,
              eventModifier: u,
              payload: F(
                {
                  eventName: o,
                  index: f.getIndex(),
                  filters: ["".concat(d, ":").concat(s)],
                },
                c
              ),
              attribute: d,
            }));
    };
  }
  function he(e) {
    return btoa(encodeURIComponent(JSON.stringify(e)));
  }
  function fe(e) {
    return JSON.parse(decodeURIComponent(atob(e)));
  }
  function me(e) {
    var n,
      r,
      i,
      a,
      s,
      t,
      o,
      c,
      u = e.getIndex,
      l = e.widgetType,
      d = (e.methodName, e.args),
      e = e.instantSearchInstance;
    return 1 === d.length && "object" === W(d[0])
      ? [d[0]]
      : ((t = k(d[0].split(":"), 2)),
        (n = t[0]),
        (r = t[1]),
        (t = d[1]),
        (i = d[2]),
        (a = d[3] || {}),
        !t ||
        !(("click" !== n && "conversion" !== n) || i) ||
        0 === (d = Array.isArray(t) ? t : [t]).length
          ? []
          : ((s = d[0].__queryID),
            (t = (function (e, t) {
              for (
                var n = 1 < arguments.length && void 0 !== t ? t : 20,
                  r = [],
                  i = 0;
                i < Math.ceil(e.length / n);
                i++
              )
                r.push(e.slice(i * n, (i + 1) * n));
              return r;
            })(d)),
            (o = t.map(function (e) {
              return e.map(function (e) {
                return e.objectID;
              });
            })),
            (c = t.map(function (e) {
              return e.map(function (e) {
                return e.__position;
              });
            })),
            "view" === n
              ? "idle" !== e.status
                ? []
                : t.map(function (e, t) {
                    return {
                      insightsMethod: "viewedObjectIDs",
                      widgetType: l,
                      eventType: n,
                      payload: F(
                        {
                          eventName: i || "Hits Viewed",
                          index: u(),
                          objectIDs: o[t],
                        },
                        a
                      ),
                      hits: e,
                      eventModifier: r,
                    };
                  })
              : "click" === n
              ? t.map(function (e, t) {
                  return {
                    insightsMethod: "clickedObjectIDsAfterSearch",
                    widgetType: l,
                    eventType: n,
                    payload: F(
                      {
                        eventName: i || "Hit Clicked",
                        index: u(),
                        queryID: s,
                        objectIDs: o[t],
                        positions: c[t],
                      },
                      a
                    ),
                    hits: e,
                    eventModifier: r,
                  };
                })
              : "conversion" === n
              ? t.map(function (e, t) {
                  return {
                    insightsMethod: "convertedObjectIDsAfterSearch",
                    widgetType: l,
                    eventType: n,
                    payload: F(
                      {
                        eventName: i || "Hit Converted",
                        index: u(),
                        queryID: s,
                        objectIDs: o[t],
                      },
                      a
                    ),
                    hits: e,
                    eventModifier: r,
                  };
                })
              : []));
  }
  function pe(e) {
    var r = e.instantSearchInstance,
      i = e.getIndex,
      a = e.widgetType,
      s = {},
      o = void 0;
    return function () {
      for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++)
        t[n] = arguments[n];
      me({
        widgetType: a,
        getIndex: i,
        methodName: "sendEvent",
        args: t,
        instantSearchInstance: r,
      }).forEach(function (e) {
        ("click" === e.eventType &&
          "internal" === e.eventModifier &&
          s[e.eventType]) ||
          ((s[e.eventType] = !0), r.sendEventToInsights(e));
      }),
        clearTimeout(o),
        (o = setTimeout(function () {
          s = {};
        }, 0));
    };
  }
  function ge(e) {
    var i = e.getIndex,
      a = e.widgetType,
      s = e.instantSearchInstance;
    return function () {
      for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++)
        t[n] = arguments[n];
      var r = me({
        widgetType: a,
        getIndex: i,
        methodName: "bindEvent",
        args: t,
        instantSearchInstance: s,
      });
      return r.length ? "data-insights-event=".concat(he(r)) : "";
    };
  }
  function ve(e) {
    return "ais.index" === e.$$type;
  }
  function ye(t, e) {
    var n = t[e.getIndexId()] || {};
    e
      .getHelper()
      .setState(
        e.getWidgetSearchParameters(e.getHelper().state, { uiState: n })
      ),
      e
        .getWidgets()
        .filter(ve)
        .forEach(function (e) {
          return ye(t, e);
        });
  }
  function be(r, i) {
    var a = null;
    return function () {
      for (var e = arguments.length, n = new Array(e), t = 0; t < e; t++)
        n[t] = arguments[t];
      return new Promise(function (e, t) {
        a && clearTimeout(a),
          (a = setTimeout(function () {
            (a = null),
              Promise.resolve(r.apply(void 0, n))
                .then(e)
                .catch(t);
          }, i));
      });
    };
  }
  var Re = Promise.resolve();
  function Se(r) {
    function e() {
      for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++)
        t[n] = arguments[n];
      null === i &&
        (i = Re.then(function () {
          (i = null), a ? (a = !1) : r.apply(void 0, t);
        }));
    }
    var i = null,
      a = !1;
    return (
      (e.wait = function () {
        if (null === i)
          throw new Error(
            "The deferred function should be called before calling `wait()`"
          );
        return i;
      }),
      (e.cancel = function () {
        null !== i && (a = !0);
      }),
      e
    );
  }
  function l() {
    for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++)
      t[n] = arguments[n];
    var r = t
      .map(function (e) {
        return (
          (t = (e = e).name),
          (e = e.connector),
          [
            "https://www.algolia.com/doc/api-reference/widgets/",
            t,
            "/js/",
            void 0 !== e && e ? "#connector" : "",
          ].join("")
        );
        var t;
      })
      .join(", ");
    return function (e) {
      return [e, "See documentation: ".concat(r)].filter(Boolean).join("\n\n");
    };
  }
  function _e(e) {
    return ("number" == typeof e && e < 0) || "string" == typeof e
      ? String(e).replace(/^-/, "\\-")
      : e;
  }
  function we(e, t) {
    for (var n, r = 0; r < e.length; r++) if (t((n = e[r]), r, e)) return n;
  }
  var Pe = /^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/;
  function Ne(e) {
    if (Array.isArray(e)) {
      var t = e,
        n = k(t, 1)[0],
        r = (n = k(void 0 === n ? [void 0, void 0, void 0, void 0] : n, 4))[0],
        i = n[1],
        a = n[2],
        n = n[3];
      if (r && i && a && n)
        return { northEast: { lat: r, lng: i }, southWest: { lat: a, lng: n } };
      throw new Error(
        'Invalid value for "insideBoundingBox" parameter: ['.concat(t, "]")
      );
    }
    (r = e),
      (a = (i = k(r.split(",").map(parseFloat), 4))[0]),
      (n = i[1]),
      (t = i[2]),
      (i = i[3]);
    if (a && n && t && i)
      return { northEast: { lat: a, lng: n }, southWest: { lat: t, lng: i } };
    throw new Error(
      'Invalid value for "insideBoundingBox" parameter: "'.concat(r, '"')
    );
  }
  function N(e) {
    var t,
      n = "string" == typeof e,
      r = n ? document.querySelector(e) : e;
    if ((t = r) instanceof HTMLElement || (Boolean(t) && 0 < t.nodeType))
      return r;
    throw (
      ((t = "Container must be `string` or `HTMLElement`."),
      n && (t += " Unable to find ".concat(e)),
      new Error(t))
    );
  }
  function xe(e) {
    var t = u.highlightPostTag,
      n = u.highlightPreTag,
      e = e.split(n),
      n = e.shift(),
      r = n ? [{ value: n, isHighlighted: !1 }] : [];
    return (
      e.forEach(function (e) {
        e = e.split(t);
        r.push({ value: e[0], isHighlighted: !0 }),
          "" !== e[1] && r.push({ value: e[1], isHighlighted: !1 });
      }),
      r
    );
  }
  var Ie = new RegExp(/\w/i);
  function Ce(e, t) {
    return (Array.isArray(t) ? t : t.split(".")).reduce(function (e, t) {
      return e && e[t];
    }, e);
  }
  function Te(e, t, n, r, i) {
    var a,
      i = 4 < arguments.length && void 0 !== i ? i : [],
      s = { type: t, attribute: n, name: r, escapedValue: _e(r) },
      o = we(i, function (e) {
        return e.name === n;
      });
    if ("hierarchical" === t) {
      for (
        var i = e.getHierarchicalFacetByName(n),
          c = r.split(i.separator),
          u = 0;
        void 0 !== o && u < c.length;
        ++u
      )
        !(function (t) {
          var n;
          o =
            o &&
            o.data &&
            we(
              Object.keys(o.data).map(
                ((n = o.data),
                function (e) {
                  return n[e];
                })
              ),
              function (e) {
                return e.name === c[t];
              }
            );
        })(u);
      a = o && o.count;
    } else a = o && o.data && o.data[s.name];
    return (
      void 0 !== a && (s.count = a),
      o && void 0 !== o.exhaustive && (s.exhaustive = o.exhaustive),
      s
    );
  }
  function Fe(n, r, e) {
    var e = 2 < arguments.length && void 0 !== e && e,
      i = [],
      t = r.facetsRefinements,
      a = void 0 === t ? {} : t,
      t = r.facetsExcludes,
      s = void 0 === t ? {} : t,
      t = r.disjunctiveFacetsRefinements,
      o = void 0 === t ? {} : t,
      t = r.hierarchicalFacetsRefinements,
      c = void 0 === t ? {} : t,
      t = r.numericRefinements,
      u = void 0 === t ? {} : t,
      t = r.tagRefinements,
      t = void 0 === t ? [] : t;
    return (
      Object.keys(a).forEach(function (t) {
        a[t].forEach(function (e) {
          i.push(Te(r, "facet", t, e, n.facets));
        });
      }),
      Object.keys(s).forEach(function (t) {
        s[t].forEach(function (e) {
          i.push({ type: "exclude", attribute: t, name: e, exclude: !0 });
        });
      }),
      Object.keys(o).forEach(function (t) {
        o[t].forEach(function (e) {
          i.push(
            Te(
              r,
              "disjunctive",
              t,
              "string" == typeof (e = e) ? e.replace(/^\\-/, "-") : e,
              n.disjunctiveFacets
            )
          );
        });
      }),
      Object.keys(c).forEach(function (t) {
        c[t].forEach(function (e) {
          i.push(Te(r, "hierarchical", t, e, n.hierarchicalFacets));
        });
      }),
      Object.keys(u).forEach(function (n) {
        var r = u[n];
        Object.keys(r).forEach(function (e) {
          var t = e,
            e = r[t];
          (Array.isArray(e) ? e : [e]).forEach(function (e) {
            i.push({
              type: "numeric",
              attribute: n,
              name: "".concat(e),
              numericValue: e,
              operator: t,
            });
          });
        });
      }),
      t.forEach(function (e) {
        i.push({ type: "tag", attribute: "_tags", name: e });
      }),
      e &&
        r.query &&
        r.query.trim() &&
        i.push({
          attribute: "query",
          type: "query",
          name: r.query,
          query: r.query,
        }),
      i
    );
  }
  function Ee(e, t) {
    var n = null == (n = e.getWidgetRenderState) ? void 0 : n.call(e, t),
      t = null;
    if (
      (n &&
        n.widgetParams &&
        ((n = n.widgetParams).attribute
          ? (t = n.attribute)
          : Array.isArray(n.attributes) && (t = n.attributes[0])),
      "string" != typeof t)
    )
      throw new Error(
        "Could not find the attribute of the widget:\n\n".concat(
          JSON.stringify(e),
          "\n\nPlease check whether the widget's getWidgetRenderState returns widgetParams.attribute correctly."
        )
      );
    return t;
  }
  function je(e, n, r) {
    return e.map(function (e, t) {
      return F(F({}, e), {}, { __position: r * n + t + 1 });
    });
  }
  function ke(e, t) {
    return t
      ? e.map(function (e) {
          return F(F({}, e), {}, { __queryID: t });
        })
      : e;
  }
  function Oe(a, i) {
    var e, s, t;
    i &&
      (("transporter" in a && !a._cacheHydrated) ||
        (a._useCache && "function" == typeof a.addAlgoliaAgent)) &&
      ((e = [
        Object.keys(i).reduce(function (e, t) {
          var t = i[t],
            n = t.state,
            r = t.requestParams,
            t = t.results,
            t =
              t && n
                ? t.map(function (e, t) {
                    return F(
                      { indexName: n.index || e.index },
                      (null != r && r[t]) || e.params
                        ? {
                            params: Le(
                              (null == r ? void 0 : r[t]) ||
                                e.params.split("&").reduce(function (e, t) {
                                  var t = k(t.split("="), 2),
                                    n = t[0],
                                    t = t[1];
                                  return (
                                    (e[n] = t ? decodeURIComponent(t) : ""), e
                                  );
                                }, {})
                            ),
                          }
                        : {}
                    );
                  })
                : [];
          return e.concat(t);
        }, []),
      ]),
      (t = Object.keys(i).reduce(function (e, t) {
        t = i[t].results;
        return t ? e.concat(t) : e;
      }, [])),
      "transporter" in a &&
        !a._cacheHydrated &&
        ((a._cacheHydrated = !0),
        (s = a.search),
        (a.search = function (e) {
          for (
            var t = arguments.length, n = new Array(1 < t ? t - 1 : 0), r = 1;
            r < t;
            r++
          )
            n[r - 1] = arguments[r];
          var i = e.map(function (e) {
            return F(F({}, e), {}, { params: Le(e.params) });
          });
          return a.transporter.responsesCache.get(
            { method: "search", args: [i].concat(n) },
            function () {
              return s.apply(void 0, [e].concat(n));
            }
          );
        }),
        a.transporter.responsesCache.set(
          { method: "search", args: e },
          { results: t }
        )),
      "transporter" in a ||
        ((t = "/1/indexes/*/queries_body_".concat(
          JSON.stringify({ requests: e })
        )),
        (a.cache = F(
          F({}, a.cache),
          {},
          E(
            {},
            t,
            JSON.stringify({
              results: Object.keys(i).map(function (e) {
                return i[e].results;
              }),
            })
          )
        ))));
  }
  function Le(n) {
    return Object.keys(n)
      .map(function (e) {
        return (function (e) {
          for (
            var t = arguments.length, n = new Array(1 < t ? t - 1 : 0), r = 1;
            r < t;
            r++
          )
            n[r - 1] = arguments[r];
          var i = 0;
          return e.replace(/%s/g, function () {
            return encodeURIComponent(n[i++]);
          });
        })(
          "%s=%s",
          e,
          ((t = n[e]),
          "[object Object]" === Object.prototype.toString.call(t) ||
          "[object Array]" === Object.prototype.toString.call(t)
            ? JSON.stringify(n[e])
            : n[e])
        );
        var t;
      })
      .join("&");
  }
  function Me(e) {
    return e !== Object(e);
  }
  function He(e, t) {
    if (e === t) return 1;
    if (Me(e) || Me(t) || "function" == typeof e || "function" == typeof t)
      return e === t;
    if (Object.keys(e).length === Object.keys(t).length) {
      for (var n = 0, r = Object.keys(e); n < r.length; n++) {
        var i = r[n];
        if (!(i in t)) return;
        if (!He(e[i], t[i])) return;
      }
      return 1;
    }
  }
  function b(e) {
    return "number" == typeof e && isFinite(e);
  }
  function Ae(e) {
    return 1 === e.button || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey;
  }
  function We(e) {
    return e.filter(function (e, t, n) {
      return n.indexOf(e) === t;
    });
  }
  var De = [
      "facets",
      "disjunctiveFacets",
      "facetsRefinements",
      "facetsExcludes",
      "disjunctiveFacetsRefinements",
      "numericRefinements",
      "tagRefinements",
      "hierarchicalFacets",
      "hierarchicalFacetsRefinements",
      "ruleContexts",
    ],
    $e = function (e, t) {
      t.facets,
        t.disjunctiveFacets,
        t.facetsRefinements,
        t.facetsExcludes,
        t.disjunctiveFacetsRefinements,
        t.numericRefinements,
        t.tagRefinements,
        t.hierarchicalFacets,
        t.hierarchicalFacetsRefinements,
        t.ruleContexts;
      t = j(t, De);
      return e.setQueryParameters(t);
    },
    Be = function (e, t) {
      return t.facets.reduce(function (e, t) {
        return e.addFacet(t);
      }, e);
    },
    Ue = function (e, t) {
      return t.disjunctiveFacets.reduce(function (e, t) {
        return e.addDisjunctiveFacet(t);
      }, e);
    },
    qe = function (e, t) {
      return e.setQueryParameters({
        hierarchicalFacets: t.hierarchicalFacets.reduce(function (e, t) {
          var n = (function (e, t) {
            if (Array.isArray(e))
              for (var n = 0; n < e.length; n++) if (t(e[n])) return n;
            return -1;
          })(e, function (e) {
            return e.name === t.name;
          });
          return -1 === n ? e.concat(t) : ((e = e.slice()).splice(n, 1, t), e);
        }, e.hierarchicalFacets),
      });
    },
    Qe = function (e, t) {
      return t.tagRefinements.reduce(function (e, t) {
        return e.addTagRefinement(t);
      }, e);
    },
    Ve = function (e, t) {
      return e.setQueryParameters({
        facetsRefinements: F(F({}, e.facetsRefinements), t.facetsRefinements),
      });
    },
    Ke = function (e, t) {
      return e.setQueryParameters({
        facetsExcludes: F(F({}, e.facetsExcludes), t.facetsExcludes),
      });
    },
    ze = function (e, t) {
      return e.setQueryParameters({
        disjunctiveFacetsRefinements: F(
          F({}, e.disjunctiveFacetsRefinements),
          t.disjunctiveFacetsRefinements
        ),
      });
    },
    Je = function (e, t) {
      return e.setQueryParameters({
        numericRefinements: F(
          F({}, e.numericRefinements),
          t.numericRefinements
        ),
      });
    },
    Ze = function (e, t) {
      return e.setQueryParameters({
        hierarchicalFacetsRefinements: F(
          F({}, e.hierarchicalFacetsRefinements),
          t.hierarchicalFacetsRefinements
        ),
      });
    },
    Ye = function (e, t) {
      t = We([].concat(e.ruleContexts).concat(t.ruleContexts).filter(Boolean));
      return 0 < t.length ? e.setQueryParameters({ ruleContexts: t }) : e;
    },
    Xe = function () {
      for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++)
        t[n] = arguments[n];
      return t.reduce(function (e, t) {
        (e = Ze(e, t)),
          (e = qe(e, t)),
          (e = Qe(e, t)),
          (e = Je(e, t)),
          (e = ze(e, t)),
          (e = Ke(e, t)),
          (e = Ve(e, t)),
          (e = Ue(e, t)),
          (e = Ye(e, t)),
          (e = Be(e, t));
        return $e(e, t);
      });
    };
  function Ge(n, r) {
    return null == n
      ? n
      : Object.keys(n).reduce(function (e, t) {
          return 0 <= r.indexOf(t) || (e[t] = n[t]), e;
        }, {});
  }
  function et(e) {
    var t = e.start,
      n = void 0 === t ? 0 : t,
      t = e.end,
      e = e.step,
      e = void 0 === e ? 1 : e,
      r = 0 === e ? 1 : e,
      e = Math.round((t - n) / r);
    return P(Array(e)).map(function (e, t) {
      return n + t * r;
    });
  }
  function tt(e, t, n) {
    var r = t.getHelper();
    return {
      uiState: n,
      helper: r,
      parent: t,
      instantSearchInstance: e,
      state: r.state,
      renderState: e.renderState,
      templatesConfig: e.templatesConfig,
      createURL: t.createURL,
      scopedResults: [],
      searchMetadata: { isSearchStalled: "stalled" === e.status },
      status: e.status,
      error: e.error,
    };
  }
  function nt(e, t, n) {
    var n = t.getResultsForWidget(n),
      r = t.getHelper();
    return {
      helper: r,
      parent: t,
      instantSearchInstance: e,
      results: n,
      scopedResults: t.getScopedResults(),
      state: n && "_state" in n ? n._state : r.state,
      renderState: e.renderState,
      templatesConfig: e.templatesConfig,
      createURL: t.createURL,
      searchMetadata: { isSearchStalled: "stalled" === e.status },
      status: e.status,
      error: e.error,
    };
  }
  function rt(i) {
    return i.some(function (e) {
      return e.isHighlighted;
    })
      ? i.map(function (e, t) {
          return F(
            F({}, e),
            {},
            {
              isHighlighted:
                ((n = (e = i)[(t = t)]),
                (r = (null == (r = i[t + 1]) ? void 0 : r.isHighlighted) || !0),
                (t = (null == (e = i[t - 1]) ? void 0 : e.isHighlighted) || !0),
                !(Ie.test(ae(n.value)) || t !== r ? n.isHighlighted : t)),
            }
          );
          var n, r;
        })
      : i.map(function (e) {
          return F(F({}, e), {}, { isHighlighted: !1 });
        });
  }
  function it(e, t) {
    t = (
      1 < arguments.length && void 0 !== t ? t : { fallback: function () {} }
    ).fallback;
    return "undefined" == typeof window ? t() : e({ window: window });
  }
  function at(e) {
    return Array.isArray(e) ? e : [e];
  }
  function st(y) {
    var b = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : R;
    return (
      f(y, ut()),
      function (e) {
        var r,
          n,
          i,
          a,
          s,
          o,
          c,
          u,
          t = e || {},
          l = t.queryLanguages,
          d = t.attributesForPrediction,
          h = t.nbHits,
          f = void 0 === h ? 1 : h,
          h = t.renderDebounceTime,
          m = t.searchDebounceTime,
          p = void 0 === m ? 100 : m,
          m = t.escapeHTML,
          g = void 0 === m || m,
          m = t.extraParameters,
          v = void 0 === m ? {} : m;
        if (l && 0 !== l.length)
          return (
            (r = function (e) {
              var t = ++n;
              return Promise.resolve(e).then(function (e) {
                return a && t < i ? a : ((i = t), (a = e));
              });
            }),
            (s = []),
            (o = !(i = n = -1)),
            (c = be(y, (a = void 0) === h ? 100 : h)),
            {
              $$type: "ais.answers",
              init: function (e) {
                var t = e.state,
                  t = e.instantSearchInstance.client.initIndex(t.index);
                if ("function" != typeof t.findAnswers)
                  throw new Error(ut("`algoliasearch` >= 4.8.0 required."));
                (u = be(t.findAnswers, p)),
                  y(
                    F(
                      F({}, this.getWidgetRenderState(e)),
                      {},
                      { instantSearchInstance: e.instantSearchInstance }
                    ),
                    !0
                  );
              },
              render: function (t) {
                var n = this,
                  e = t.state.query;
                e
                  ? ((s = []),
                    (o = !0),
                    y(
                      F(
                        F({}, this.getWidgetRenderState(t)),
                        {},
                        { instantSearchInstance: t.instantSearchInstance }
                      ),
                      !1
                    ),
                    r(
                      u(
                        e,
                        l,
                        F(
                          F({}, v),
                          {},
                          { nbHits: f, attributesForPrediction: d }
                        )
                      )
                    ).then(function (e) {
                      e &&
                        (g && 0 < e.hits.length && (e.hits = ue(e.hits)),
                        (e = ke(je(e.hits, 0, f), e.queryID)),
                        (s = e),
                        (o = !1),
                        c(
                          F(
                            F({}, n.getWidgetRenderState(t)),
                            {},
                            { instantSearchInstance: t.instantSearchInstance }
                          ),
                          !1
                        ));
                    }))
                  : ((o = !(s = [])),
                    y(
                      F(
                        F({}, this.getWidgetRenderState(t)),
                        {},
                        { instantSearchInstance: t.instantSearchInstance }
                      ),
                      !1
                    ));
              },
              getRenderState: function (e, t) {
                return F(
                  F({}, e),
                  {},
                  { answers: this.getWidgetRenderState(t) }
                );
              },
              getWidgetRenderState: function () {
                return { hits: s, isLoading: o, widgetParams: e };
              },
              dispose: function (e) {
                e = e.state;
                return b(), e;
              },
              getWidgetSearchParameters: function (e) {
                return e;
              },
            }
          );
        throw new Error(
          ut("The `queryLanguages` expects an array of strings.")
        );
      }
    );
  }
  function ot(u) {
    var s = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : R;
    return (
      f(u, lt()),
      function (n) {
        var o,
          e = n.widgets,
          t = n.maxValuesPerFacet,
          r = void 0 === t ? 20 : t,
          t = n.facets,
          i = void 0 === t ? ["*"] : t,
          t = n.transformItems,
          a =
            void 0 === t
              ? function (e) {
                  return e;
                }
              : t,
          c = n.fallbackWidget;
        if (
          !(
            e &&
            Array.isArray(e) &&
            e.every(function (e) {
              return "object" === W(e);
            })
          )
        )
          throw new Error(
            lt("The `widgets` option expects an array of widgets.")
          );
        if (Array.isArray(i))
          return (
            (o = new Map()),
            {
              $$type: "ais.dynamicWidgets",
              init: function (n) {
                e.forEach(function (e) {
                  var t = Ee(e, n);
                  o.set(t, { widget: e, isMounted: !1 });
                }),
                  u(
                    F(
                      F({}, this.getWidgetRenderState(n)),
                      {},
                      { instantSearchInstance: n.instantSearchInstance }
                    ),
                    !0
                  );
              },
              render: function (e) {
                var t = e.parent,
                  i = this.getWidgetRenderState(e),
                  a = [],
                  s = [];
                c &&
                  i.attributesToRender.forEach(function (e) {
                    var t;
                    o.has(e) ||
                      ((t = c({ attribute: e })),
                      o.set(e, { widget: t, isMounted: !1 }));
                  }),
                  o.forEach(function (e, t) {
                    var n = e.widget,
                      e = e.isMounted,
                      r = -1 < i.attributesToRender.indexOf(t);
                    !e && r
                      ? (s.push(n), o.set(t, { widget: n, isMounted: !0 }))
                      : e &&
                        !r &&
                        (a.push(n), o.set(t, { widget: n, isMounted: !1 }));
                  }),
                  t.addWidgets(s),
                  setTimeout(function () {
                    return t.removeWidgets(a);
                  }, 0),
                  u(
                    F(
                      F({}, i),
                      {},
                      { instantSearchInstance: e.instantSearchInstance }
                    ),
                    !1
                  );
              },
              dispose: function (e) {
                var e = e.parent,
                  n = [];
                o.forEach(function (e) {
                  var t = e.widget;
                  e.isMounted && n.push(t);
                }),
                  e.removeWidgets(n),
                  s();
              },
              getWidgetSearchParameters: function (e) {
                return i.reduce(function (e, t) {
                  return e.addFacet(t);
                }, e.setQueryParameters({
                  maxValuesPerFacet: Math.max(r || 0, e.maxValuesPerFacet || 0),
                }));
              },
              getRenderState: function (e, t) {
                return F(
                  F({}, e),
                  {},
                  { dynamicWidgets: this.getWidgetRenderState(t) }
                );
              },
              getWidgetRenderState: function (e) {
                var t = e.results;
                e.state;
                if (!t) return { attributesToRender: [], widgetParams: n };
                e = a(
                  null !=
                    (e =
                      null == (e = t.renderingContent) ||
                      null == (e = e.facetOrdering) ||
                      null == (e = e.facets)
                        ? void 0
                        : e.order)
                    ? e
                    : [],
                  { results: t }
                );
                if (Array.isArray(e))
                  return { attributesToRender: e, widgetParams: n };
                throw new Error(
                  lt(
                    "The `transformItems` option expects a function that returns an Array."
                  )
                );
              },
            }
          );
        throw new Error(
          lt(
            "The `facets` option only accepts an array of facets, you passed ".concat(
              JSON.stringify(i)
            )
          )
        );
      }
    );
  }
  function ct(n) {
    var s = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : R;
    return (
      f(n, dt()),
      function (r) {
        var e = r || {},
          t = e.includedAttributes,
          o = void 0 === t ? [] : t,
          t = e.excludedAttributes,
          c = void 0 === t ? ["query"] : t,
          t = e.transformItems,
          u =
            void 0 === t
              ? function (e) {
                  return e;
                }
              : t;
        if (r && r.includedAttributes && r.excludedAttributes)
          throw new Error(
            dt(
              "The options `includedAttributes` and `excludedAttributes` cannot be used together."
            )
          );
        function i() {
          return l.refine();
        }
        function a() {
          return l.createURL();
        }
        var l = {
          refine: R,
          createURL: function () {
            return "";
          },
          attributesToClear: [],
        };
        return {
          $$type: "ais.clearRefinements",
          init: function (e) {
            var t = e.instantSearchInstance;
            n(
              F(
                F({}, this.getWidgetRenderState(e)),
                {},
                { instantSearchInstance: t }
              ),
              !0
            );
          },
          render: function (e) {
            var t = e.instantSearchInstance;
            n(
              F(
                F({}, this.getWidgetRenderState(e)),
                {},
                { instantSearchInstance: t }
              ),
              !1
            );
          },
          dispose: function () {
            s();
          },
          getRenderState: function (e, t) {
            return F(
              F({}, e),
              {},
              { clearRefinements: this.getWidgetRenderState(t) }
            );
          },
          getWidgetRenderState: function (e) {
            var t = e.createURL,
              n = e.scopedResults,
              s = e.results,
              e =
                ((l.attributesToClear = n.reduce(function (e, t) {
                  return e.concat(
                    ((t = (e = {
                      scopedResult: t,
                      includedAttributes: o,
                      excludedAttributes: c,
                      transformItems: u,
                      results: s,
                    }).scopedResult),
                    (n = e.includedAttributes),
                    (r = e.excludedAttributes),
                    (i = e.transformItems),
                    (e = e.results),
                    (a =
                      -1 !== n.indexOf("query") || -1 === r.indexOf("query")),
                    {
                      helper: t.helper,
                      items: i(
                        We(
                          Fe(t.results, t.helper.state, a)
                            .map(function (e) {
                              return e.attribute;
                            })
                            .filter(function (e) {
                              return 0 === n.length || -1 !== n.indexOf(e);
                            })
                            .filter(function (e) {
                              return (
                                ("query" === e && a) || -1 === r.indexOf(e)
                              );
                            })
                        ),
                        { results: e }
                      ),
                    })
                  );
                  var n, r, i, a;
                }, [])),
                (l.refine = function () {
                  l.attributesToClear.forEach(function (e) {
                    var t = e.helper,
                      e = e.items;
                    t.setState(X({ helper: t, attributesToClear: e })).search();
                  });
                }),
                (l.createURL = function () {
                  return t(
                    Xe.apply(
                      void 0,
                      P(
                        l.attributesToClear.map(function (e) {
                          return X({
                            helper: e.helper,
                            attributesToClear: e.items,
                          });
                        })
                      )
                    )
                  );
                }),
                l.attributesToClear.some(function (e) {
                  return 0 < e.items.length;
                }));
            return {
              canRefine: e,
              hasRefinements: e,
              refine: i,
              createURL: a,
              widgetParams: r,
            };
          },
        };
      }
    );
  }
  var ut = l({ name: "answers", connector: !0 }),
    lt = l({ name: "dynamic-widgets", connector: !0 }),
    dt = l({ name: "clear-refinements", connector: !0 });
  function ht(n) {
    var r = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : R;
    return (
      f(n, ft()),
      function (a) {
        if ((a || {}).includedAttributes && (a || {}).excludedAttributes)
          throw new Error(
            ft(
              "The options `includedAttributes` and `excludedAttributes` cannot be used together."
            )
          );
        var e = a || {},
          s = e.includedAttributes,
          t = e.excludedAttributes,
          o = void 0 === t ? ["query"] : t,
          t = e.transformItems,
          c =
            void 0 === t
              ? function (e) {
                  return e;
                }
              : t;
        return {
          $$type: "ais.currentRefinements",
          init: function (e) {
            var t = e.instantSearchInstance;
            n(
              F(
                F({}, this.getWidgetRenderState(e)),
                {},
                { instantSearchInstance: t }
              ),
              !0
            );
          },
          render: function (e) {
            var t = e.instantSearchInstance;
            n(
              F(
                F({}, this.getWidgetRenderState(e)),
                {},
                { instantSearchInstance: t }
              ),
              !1
            );
          },
          dispose: function () {
            r();
          },
          getRenderState: function (e, t) {
            return F(
              F({}, e),
              {},
              { currentRefinements: this.getWidgetRenderState(t) }
            );
          },
          getWidgetRenderState: function (e) {
            var n = e.results,
              t = e.scopedResults,
              r = e.createURL,
              i = e.helper;
            e = n
              ? t.reduce(function (e, t) {
                  return e.concat(
                    c(
                      mt({
                        results: t.results,
                        helper: t.helper,
                        indexId: t.indexId,
                        includedAttributes: s,
                        excludedAttributes: o,
                      }),
                      { results: n }
                    )
                  );
                }, [])
              : c(
                  mt({
                    results: {},
                    helper: i,
                    indexId: i.state.index,
                    includedAttributes: s,
                    excludedAttributes: o,
                  }),
                  { results: n }
                );
            return {
              items: e,
              canRefine: 0 < e.length,
              refine: function (e) {
                return gt(i, e);
              },
              createURL: function (e) {
                return r(pt(i.state, e));
              },
              widgetParams: a,
            };
          },
        };
      }
    );
  }
  var ft = l({ name: "current-refinements", connector: !0 });
  function mt(e) {
    var t = e.results,
      n = e.helper,
      r = e.indexId,
      i = e.includedAttributes,
      a = e.excludedAttributes,
      e =
        -1 !== (i || []).indexOf("query") || -1 === (a || []).indexOf("query"),
      s = i
        ? function (e) {
            return -1 !== i.indexOf(e.attribute);
          }
        : function (e) {
            return -1 === a.indexOf(e.attribute);
          },
      o = Fe(t, n.state, e).map(vt).filter(s);
    return o.reduce(function (e, t) {
      return [].concat(
        P(
          e.filter(function (e) {
            return e.attribute !== t.attribute;
          })
        ),
        [
          {
            indexName: n.state.index,
            indexId: r,
            attribute: t.attribute,
            label: t.attribute,
            refinements: o
              .filter(function (e) {
                return e.attribute === t.attribute;
              })
              .sort(function (e, t) {
                return "numeric" === e.type ? e.value - t.value : 0;
              }),
            refine: function (e) {
              return gt(n, e);
            },
          },
        ]
      );
    }, []);
  }
  function pt(e, t) {
    switch (((e = e.resetPage()), t.type)) {
      case "facet":
        return e.removeFacetRefinement(t.attribute, String(t.value));
      case "disjunctive":
        return e.removeDisjunctiveFacetRefinement(t.attribute, String(t.value));
      case "hierarchical":
        return e.removeHierarchicalFacetRefinement(t.attribute);
      case "exclude":
        return e.removeExcludeRefinement(t.attribute, String(t.value));
      case "numeric":
        return e.removeNumericRefinement(
          t.attribute,
          t.operator,
          String(t.value)
        );
      case "tag":
        return e.removeTagRefinement(String(t.value));
      case "query":
        return e.setQueryParameter("query", "");
      default:
        return e;
    }
  }
  function gt(e, t) {
    e.setState(pt(e.state, t)).search();
  }
  function vt(e) {
    var t = (function (e) {
        if ("numeric" === e.type) return Number(e.name);
        if ("escapedValue" in e) return e.escapedValue;
        return e.name;
      })(e),
      n = e.operator
        ? ""
            .concat(
              (function (e) {
                switch (e) {
                  case ">=":
                    return "≥";
                  case "<=":
                    return "≤";
                  default:
                    return e;
                }
              })(e.operator),
              " "
            )
            .concat(e.name)
        : e.name,
      t = { attribute: e.attribute, type: e.type, value: t, label: n };
    return (
      void 0 !== e.operator && (t.operator = e.operator),
      void 0 !== e.count && (t.count = e.count),
      void 0 !== e.exhaustive && (t.exhaustive = e.exhaustive),
      t
    );
  }
  function yt(c) {
    var n = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : R;
    return (
      f(c, Rt()),
      function (u) {
        var e = u || {},
          l = e.attributes,
          t = e.separator,
          d = void 0 === t ? " > " : t,
          t = e.rootPath,
          r = void 0 === t ? null : t,
          t = e.showParentLevel,
          i = void 0 === t || t,
          t = e.limit,
          a = void 0 === t ? 10 : t,
          t = e.showMore,
          h = void 0 !== t && t,
          t = e.showMoreLimit,
          s = void 0 === t ? 20 : t,
          t = e.sortBy,
          f = void 0 === t ? St : t,
          t = e.transformItems,
          m =
            void 0 === t
              ? function (e) {
                  return e;
                }
              : t;
        if (!l || !Array.isArray(l) || 0 === l.length)
          throw new Error(
            Rt("The `attributes` option expects an array of strings.")
          );
        if (!0 === h && s <= a)
          throw new Error(
            Rt("The `showMoreLimit` option must be greater than `limit`.")
          );
        var p,
          g,
          v = k(l, 1)[0],
          o = function () {};
        function y() {
          o();
        }
        var b = !1;
        function R() {
          return b ? s : a;
        }
        return {
          $$type: "ais.hierarchicalMenu",
          init: function (e) {
            var t = e.instantSearchInstance;
            c(
              F(
                F({}, this.getWidgetRenderState(e)),
                {},
                { instantSearchInstance: t }
              ),
              !0
            );
          },
          render: function (e) {
            var t,
              n,
              r = e.instantSearchInstance;
            (t = e),
              (o = function () {
                (b = !b), n.render(t);
              }),
              c(
                F(
                  F({}, (n = this).getWidgetRenderState(e)),
                  {},
                  { instantSearchInstance: r }
                ),
                !1
              );
          },
          dispose: function (e) {
            e = e.state;
            return (
              n(),
              e
                .removeHierarchicalFacet(v)
                .setQueryParameter("maxValuesPerFacet", void 0)
            );
          },
          getRenderState: function (e, t) {
            return F(
              F({}, e),
              {},
              {
                hierarchicalMenu: F(
                  F({}, e.hierarchicalMenu),
                  {},
                  E({}, v, this.getWidgetRenderState(t))
                ),
              }
            );
          },
          getWidgetRenderState: function (e) {
            var t,
              n = this,
              r = e.results,
              i = e.state,
              a = e.createURL,
              s = e.instantSearchInstance,
              o = e.helper,
              e = [],
              c = !1;
            return (
              (p =
                p ||
                de({
                  instantSearchInstance: s,
                  helper: o,
                  attribute: function (e) {
                    e = e.split(d).length - 1;
                    return l[e];
                  },
                  widgetType: this.$$type,
                })),
              (g =
                g ||
                function (e) {
                  p("click:internal", e),
                    o.toggleFacetRefinement(v, e).search();
                }),
              r &&
                ((s =
                  (s = r.getFacetValues(v, {
                    sortBy: f,
                    facetOrdering: f === St,
                  })) &&
                  !Array.isArray(s) &&
                  s.data
                    ? s.data
                    : []),
                (t =
                  (i.maxValuesPerFacet || 0) > R()
                    ? s.length <= R()
                    : s.length < R()),
                (c = h && (b || !t)),
                (e = m(
                  (function i(e) {
                    return e.slice(0, R()).map(function (e) {
                      var t = e.name,
                        n = e.escapedValue,
                        r = e.data,
                        e =
                          (e.path,
                          F(
                            F({}, j(e, bt)),
                            {},
                            { value: n, label: t, data: null }
                          ));
                      return Array.isArray(r) && (e.data = i(r)), e;
                    });
                  })(s),
                  { results: r }
                ))),
              {
                items: e,
                refine: g,
                canRefine: 0 < e.length,
                createURL: function (t) {
                  return a(function (e) {
                    return n.getWidgetUiState(e, {
                      searchParameters: i
                        .resetPage()
                        .toggleFacetRefinement(v, t),
                      helper: o,
                    });
                  });
                },
                sendEvent: p,
                widgetParams: u,
                isShowingMore: b,
                toggleShowMore: y,
                canToggleShowMore: c,
              }
            );
          },
          getWidgetUiState: function (e, t) {
            var t = t.searchParameters.getHierarchicalFacetBreadcrumb(v);
            return (
              (e = F(
                F({}, e),
                {},
                {
                  hierarchicalMenu: F(
                    F({}, e.hierarchicalMenu),
                    {},
                    E({}, v, t)
                  ),
                }
              )),
              (t = v),
              e.hierarchicalMenu &&
                ((e.hierarchicalMenu[t] &&
                  0 !== e.hierarchicalMenu[t].length) ||
                  delete e.hierarchicalMenu[t],
                0 === Object.keys(e.hierarchicalMenu).length) &&
                delete e.hierarchicalMenu,
              e
            );
          },
          getWidgetSearchParameters: function (e, t) {
            (t = t.uiState), (t = t.hierarchicalMenu && t.hierarchicalMenu[v]);
            if (e.isConjunctiveFacet(v) || e.isDisjunctiveFacet(v)) return e;
            e.isHierarchicalFacet(v) && e.getHierarchicalFacetByName(v);
            var e = e
                .removeHierarchicalFacet(v)
                .addHierarchicalFacet({
                  name: v,
                  attributes: l,
                  separator: d,
                  rootPath: r,
                  showParentLevel: i,
                }),
              n = e.maxValuesPerFacet || 0,
              n = Math.max(n, h ? s : a),
              e = e.setQueryParameter("maxValuesPerFacet", n);
            return t
              ? e.addHierarchicalFacetRefinement(v, t.join(d))
              : e.setQueryParameters({
                  hierarchicalFacetsRefinements: F(
                    F({}, e.hierarchicalFacetsRefinements),
                    {},
                    E({}, v, [])
                  ),
                });
          },
        };
      }
    );
  }
  var bt = ["name", "escapedValue", "data", "path"],
    Rt = l({ name: "hierarchical-menu", connector: !0 }),
    St = ["name:asc"];
  function _t(n) {
    var c = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : R;
    return (
      f(n, wt()),
      function (r) {
        var i,
          a,
          e = r || {},
          t = e.escapeHTML,
          s = void 0 === t || t,
          t = e.transformItems,
          o =
            void 0 === t
              ? function (e) {
                  return e;
                }
              : t;
        return {
          $$type: "ais.hits",
          init: function (e) {
            n(
              F(
                F({}, this.getWidgetRenderState(e)),
                {},
                { instantSearchInstance: e.instantSearchInstance }
              ),
              !0
            );
          },
          render: function (e) {
            var t = this.getWidgetRenderState(e);
            n(
              F(
                F({}, t),
                {},
                { instantSearchInstance: e.instantSearchInstance }
              ),
              !1
            ),
              t.sendEvent("view:internal", t.items);
          },
          getRenderState: function (e, t) {
            return F(F({}, e), {}, { hits: this.getWidgetRenderState(t) });
          },
          getWidgetRenderState: function (e) {
            var t = e.results,
              n = e.helper,
              e = e.instantSearchInstance;
            if (
              ((i =
                i ||
                pe({
                  instantSearchInstance: e,
                  getIndex: function () {
                    return n.getIndex();
                  },
                  widgetType: this.$$type,
                })),
              (a =
                a ||
                ge({
                  getIndex: function () {
                    return n.getIndex();
                  },
                  widgetType: this.$$type,
                  instantSearchInstance: e,
                })),
              !t)
            )
              return {
                hits: [],
                items: [],
                results: void 0,
                banner: void 0,
                sendEvent: i,
                bindEvent: a,
                widgetParams: r,
              };
            s && 0 < t.hits.length && (t.hits = ue(t.hits));
            var e = ke(je(t.hits, t.page, t.hitsPerPage), t.queryID),
              e = o(e, { results: t });
            return {
              hits: e,
              items: e,
              results: t,
              banner:
                null == (e = t.renderingContent) ||
                null == (t = e.widgets) ||
                null == (e = t.banners)
                  ? void 0
                  : e[0],
              sendEvent: i,
              bindEvent: a,
              widgetParams: r,
            };
          },
          dispose: function (e) {
            e = e.state;
            return (
              c(),
              s
                ? e.setQueryParameters(
                    Object.keys(O).reduce(function (e, t) {
                      return F(F({}, e), {}, E({}, t, void 0));
                    }, {})
                  )
                : e
            );
          },
          getWidgetSearchParameters: function (e, t) {
            return s ? e.setQueryParameters(O) : e;
          },
        };
      }
    );
  }
  var wt = l({ name: "hits", connector: !0 }),
    Pt = function (e) {
      var n,
        t = e.method,
        r = e.results,
        i = e.hits,
        a = e.objectIDs,
        s = r.index,
        o =
          ((n = i),
          a.map(function (t) {
            var e = we(n, function (e) {
              return e.objectID === t;
            });
            if (void 0 === e)
              throw new Error(
                'Could not find objectID "'.concat(
                  t,
                  '" passed to `clickedObjectIDsAfterSearch` in the returned hits. This is necessary to infer the absolute position and the query ID.'
                )
              );
            return e;
          })),
        c = (function (e) {
          e = We(
            e.map(function (e) {
              return e.__queryID;
            })
          );
          if (1 < e.length)
            throw new Error(
              "Insights currently allows a single `queryID`. The `objectIDs` provided map to multiple `queryID`s."
            );
          e = e[0];
          if ("string" != typeof e)
            throw new Error(
              "Could not infer `queryID`. Ensure InstantSearch `clickAnalytics: true` was added with the Configure widget.\n\nSee: https://alg.li/lNiZZ7"
            );
          return e;
        })(o);
      switch (t) {
        case "clickedObjectIDsAfterSearch":
          return {
            index: s,
            queryID: c,
            objectIDs: a,
            positions: o.map(function (e) {
              return e.__position;
            }),
          };
        case "convertedObjectIDsAfterSearch":
          return { index: s, queryID: c, objectIDs: a };
        default:
          throw new Error(
            'Unsupported method passed to insights: "'.concat(t, '".')
          );
      }
    };
  function Nt(t) {
    return function (a, e) {
      return t(function (e, t) {
        var s,
          o,
          c,
          n = e.results,
          r = e.hits,
          i = e.instantSearchInstance;
        return n && r && i
          ? ((s = i.insightsClient),
            (o = n),
            (c = r),
            (i = function (e) {
              for (
                var t = arguments.length,
                  n = new Array(1 < t ? t - 1 : 0),
                  r = 1;
                r < t;
                r++
              )
                n[r - 1] = arguments[r];
              var i = n[0];
              if (!s)
                throw (
                  ((a = l({ name: "instantsearch" })),
                  new Error(
                    a(
                      "The `insightsClient` option has not been provided to `instantsearch`."
                    )
                  ))
                );
              if (!Array.isArray(i.objectIDs))
                throw new TypeError("Expected `objectIDs` to be an array.");
              var a = Pt({
                method: e,
                results: o,
                hits: c,
                objectIDs: i.objectIDs,
              });
              s(e, F(F({}, a), i));
            }),
            a(F(F({}, e), {}, { insights: i }), t))
          : a(e, t);
      }, e);
    };
  }
  var xt,
    w,
    It,
    Ct,
    Tt,
    Ft = {},
    Et = [],
    jt = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
  function kt(e, t) {
    for (var n in t) e[n] = t[n];
    return e;
  }
  function Ot(e) {
    var t = e.parentNode;
    t && t.removeChild(e);
  }
  function L(e, t, n) {
    var r,
      i,
      a,
      s = {};
    for (a in t)
      "key" == a ? (r = t[a]) : "ref" == a ? (i = t[a]) : (s[a] = t[a]);
    if (
      (2 < arguments.length &&
        (s.children = 3 < arguments.length ? xt.call(arguments, 2) : n),
      "function" == typeof e && null != e.defaultProps)
    )
      for (a in e.defaultProps) void 0 === s[a] && (s[a] = e.defaultProps[a]);
    return Lt(e, s, r, i, null);
  }
  function Lt(e, t, n, r, i) {
    e = {
      type: e,
      props: t,
      key: n,
      ref: r,
      __k: null,
      __: null,
      __b: 0,
      __e: null,
      __d: void 0,
      __c: null,
      __h: null,
      constructor: void 0,
      __v: null == i ? ++It : i,
    };
    return null == i && null != w.vnode && w.vnode(e), e;
  }
  function Mt() {
    return { current: null };
  }
  function x(e) {
    return e.children;
  }
  function Ht(e, t) {
    (this.props = e), (this.context = t);
  }
  function At(e, t) {
    if (null == t) return e.__ ? At(e.__, e.__.__k.indexOf(e) + 1) : null;
    for (var n; t < e.__k.length; t++)
      if (null != (n = e.__k[t]) && null != n.__e) return n.__e;
    return "function" == typeof e.type ? At(e) : null;
  }
  function Wt(e) {
    ((e.__d || ((e.__d = !0), !Ct.push(e)) || Dt.__r++) &&
      Tt === w.debounceRendering) ||
      ((Tt = w.debounceRendering) || setTimeout)(Dt);
  }
  function Dt() {
    for (var e; (Dt.__r = Ct.length); )
      (e = Ct.sort(function (e, t) {
        return e.__v.__b - t.__v.__b;
      })),
        (Ct = []),
        e.some(function (e) {
          var t, n, r, i, a;
          e.__d &&
            ((i = (r = (e = e).__v).__e), (a = e.__P)) &&
            ((t = []),
            ((n = kt({}, r)).__v = r.__v + 1),
            Kt(
              a,
              r,
              n,
              e.__n,
              void 0 !== a.ownerSVGElement,
              null != r.__h ? [i] : null,
              t,
              null == i ? At(r) : i,
              r.__h
            ),
            zt(t, r),
            r.__e != i) &&
            (function e(t) {
              var n, r;
              if (null != (t = t.__) && null != t.__c) {
                for (t.__e = t.__c.base = null, n = 0; n < t.__k.length; n++)
                  if (null != (r = t.__k[n]) && null != r.__e) {
                    t.__e = t.__c.base = r.__e;
                    break;
                  }
                return e(t);
              }
            })(r);
        });
  }
  function $t(e, t, n, r, i, a, s, o, c, u) {
    var l,
      d,
      h,
      f,
      m,
      p,
      g,
      v = (r && r.__k) || Et,
      y = v.length;
    for (n.__k = [], l = 0; l < t.length; l++)
      if (
        null !=
        (f = n.__k[l] =
          null == (f = t[l]) || "boolean" == typeof f
            ? null
            : "string" == typeof f ||
              "number" == typeof f ||
              "bigint" == typeof f
            ? Lt(null, f, null, null, f)
            : Array.isArray(f)
            ? Lt(x, { children: f }, null, null, null)
            : 0 < f.__b
            ? Lt(f.type, f.props, f.key, f.ref || null, f.__v)
            : f)
      ) {
        if (
          ((f.__ = n),
          (f.__b = n.__b + 1),
          null === (h = v[l]) || (h && f.key == h.key && f.type === h.type))
        )
          v[l] = void 0;
        else
          for (d = 0; d < y; d++) {
            if ((h = v[d]) && f.key == h.key && f.type === h.type) {
              v[d] = void 0;
              break;
            }
            h = null;
          }
        Kt(e, f, (h = h || Ft), i, a, s, o, c, u),
          (m = f.__e),
          (d = f.ref) &&
            h.ref != d &&
            ((g = g || []),
            h.ref && g.push(h.ref, null, f),
            g.push(d, f.__c || m, f)),
          null != m
            ? (null == p && (p = m),
              "function" == typeof f.type && f.__k === h.__k
                ? (f.__d = c =
                    (function e(t, n, r) {
                      for (var i, a = t.__k, s = 0; a && s < a.length; s++)
                        (i = a[s]) &&
                          ((i.__ = t),
                          (n =
                            "function" == typeof i.type
                              ? e(i, n, r)
                              : Bt(r, i, i, a, i.__e, n)));
                      return n;
                    })(f, c, e))
                : (c = Bt(e, f, h, v, m, c)),
              "function" == typeof n.type && (n.__d = c))
            : c && h.__e == c && c.parentNode != e && (c = At(h));
      }
    for (n.__e = p, l = y; l--; )
      null != v[l] &&
        ("function" == typeof n.type &&
          null != v[l].__e &&
          v[l].__e == n.__d &&
          (n.__d = At(r, l + 1)),
        (function e(t, n, r) {
          var i, a;
          if (
            (w.unmount && w.unmount(t),
            !(i = t.ref) ||
              (i.current && i.current !== t.__e) ||
              Jt(i, null, n),
            null != (i = t.__c))
          ) {
            if (i.componentWillUnmount)
              try {
                i.componentWillUnmount();
              } catch (t) {
                w.__e(t, n);
              }
            (i.base = i.__P = null), (t.__c = void 0);
          }
          if ((i = t.__k))
            for (a = 0; a < i.length; a++)
              i[a] && e(i[a], n, "function" != typeof t.type);
          r || null == t.__e || Ot(t.__e), (t.__ = t.__e = t.__d = void 0);
        })(v[l], v[l]));
    if (g) for (l = 0; l < g.length; l++) Jt(g[l], g[++l], g[++l]);
  }
  function Bt(e, t, n, r, i, a) {
    var s, o, c;
    if (void 0 !== t.__d) (s = t.__d), (t.__d = void 0);
    else if (null == n || i != a || null == i.parentNode)
      e: if (null == a || a.parentNode !== e) e.appendChild(i), (s = null);
      else {
        for (o = a, c = 0; (o = o.nextSibling) && c < r.length; c += 2)
          if (o == i) break e;
        e.insertBefore(i, a), (s = a);
      }
    return void 0 !== s ? s : i.nextSibling;
  }
  function Ut(e, t, n) {
    "-" === t[0]
      ? e.setProperty(t, n)
      : (e[t] =
          null == n ? "" : "number" != typeof n || jt.test(t) ? n : n + "px");
  }
  function qt(e, t, n, r, i) {
    var a;
    e: if ("style" === t)
      if ("string" == typeof n) e.style.cssText = n;
      else {
        if (("string" == typeof r && (e.style.cssText = r = ""), r))
          for (t in r) (n && t in n) || Ut(e.style, t, "");
        if (n) for (t in n) (r && n[t] === r[t]) || Ut(e.style, t, n[t]);
      }
    else if ("o" === t[0] && "n" === t[1])
      (a = t !== (t = t.replace(/Capture$/, ""))),
        (t = (t.toLowerCase() in e ? t.toLowerCase() : t).slice(2)),
        e.l || (e.l = {}),
        (e.l[t + a] = n)
          ? r || e.addEventListener(t, a ? Vt : Qt, a)
          : e.removeEventListener(t, a ? Vt : Qt, a);
    else if ("dangerouslySetInnerHTML" !== t) {
      if (i) t = t.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
      else if (
        "href" !== t &&
        "list" !== t &&
        "form" !== t &&
        "tabIndex" !== t &&
        "download" !== t &&
        t in e
      )
        try {
          e[t] = null == n ? "" : n;
          break e;
        } catch (e) {}
      "function" != typeof n &&
        (null != n && (!1 !== n || ("a" === t[0] && "r" === t[1]))
          ? e.setAttribute(t, n)
          : e.removeAttribute(t));
    }
  }
  function Qt(e) {
    this.l[e.type + !1](w.event ? w.event(e) : e);
  }
  function Vt(e) {
    this.l[e.type + !0](w.event ? w.event(e) : e);
  }
  function Kt(e, t, n, r, i, a, s, o, c) {
    var u,
      l,
      d,
      h,
      f,
      m,
      p,
      g,
      v,
      y,
      b,
      R,
      S,
      _ = t.type;
    if (void 0 === t.constructor) {
      null != n.__h &&
        ((c = n.__h), (o = t.__e = n.__e), (t.__h = null), (a = [o])),
        (u = w.__b) && u(t);
      try {
        e: if ("function" == typeof _) {
          if (
            ((g = t.props),
            (v = (u = _.contextType) && r[u.__c]),
            (y = u ? (v ? v.props.value : u.__) : r),
            n.__c
              ? (p = (l = t.__c = n.__c).__ = l.__E)
              : ("prototype" in _ && _.prototype.render
                  ? (t.__c = l = new _(g, y))
                  : ((t.__c = l = new Ht(g, y)),
                    (l.constructor = _),
                    (l.render = Zt)),
                v && v.sub(l),
                (l.props = g),
                l.state || (l.state = {}),
                (l.context = y),
                (l.__n = r),
                (d = l.__d = !0),
                (l.__h = [])),
            null == l.__s && (l.__s = l.state),
            null != _.getDerivedStateFromProps &&
              (l.__s == l.state && (l.__s = kt({}, l.__s)),
              kt(l.__s, _.getDerivedStateFromProps(g, l.__s))),
            (h = l.props),
            (f = l.state),
            d)
          )
            null == _.getDerivedStateFromProps &&
              null != l.componentWillMount &&
              l.componentWillMount(),
              null != l.componentDidMount && l.__h.push(l.componentDidMount);
          else {
            if (
              (null == _.getDerivedStateFromProps &&
                g !== h &&
                null != l.componentWillReceiveProps &&
                l.componentWillReceiveProps(g, y),
              (!l.__e &&
                null != l.shouldComponentUpdate &&
                !1 === l.shouldComponentUpdate(g, l.__s, y)) ||
                t.__v === n.__v)
            ) {
              (l.props = g),
                (l.state = l.__s),
                t.__v !== n.__v && (l.__d = !1),
                ((l.__v = t).__e = n.__e),
                (t.__k = n.__k),
                t.__k.forEach(function (e) {
                  e && (e.__ = t);
                }),
                l.__h.length && s.push(l);
              break e;
            }
            null != l.componentWillUpdate && l.componentWillUpdate(g, l.__s, y),
              null != l.componentDidUpdate &&
                l.__h.push(function () {
                  l.componentDidUpdate(h, f, m);
                });
          }
          if (
            ((l.context = y),
            (l.props = g),
            (l.__v = t),
            (l.__P = e),
            (b = w.__r),
            (R = 0),
            "prototype" in _ && _.prototype.render)
          )
            (l.state = l.__s),
              (l.__d = !1),
              b && b(t),
              (u = l.render(l.props, l.state, l.context));
          else
            for (
              ;
              (l.__d = !1),
                b && b(t),
                (u = l.render(l.props, l.state, l.context)),
                (l.state = l.__s),
                l.__d && ++R < 25;

            );
          (l.state = l.__s),
            null != l.getChildContext &&
              (r = kt(kt({}, r), l.getChildContext())),
            d ||
              null == l.getSnapshotBeforeUpdate ||
              (m = l.getSnapshotBeforeUpdate(h, f)),
            (S =
              null != u && u.type === x && null == u.key
                ? u.props.children
                : u),
            $t(e, Array.isArray(S) ? S : [S], t, n, r, i, a, s, o, c),
            (l.base = t.__e),
            (t.__h = null),
            l.__h.length && s.push(l),
            p && (l.__E = l.__ = null),
            (l.__e = !1);
        } else
          null == a && t.__v === n.__v
            ? ((t.__k = n.__k), (t.__e = n.__e))
            : (t.__e = (function (e, t, n, r, i, a, s, o) {
                var c,
                  u,
                  l,
                  d = n.props,
                  h = t.props,
                  f = t.type,
                  m = 0;
                if (("svg" === f && (i = !0), null != a))
                  for (; m < a.length; m++)
                    if (
                      (c = a[m]) &&
                      "setAttribute" in c == !!f &&
                      (f ? c.localName === f : 3 === c.nodeType)
                    ) {
                      (e = c), (a[m] = null);
                      break;
                    }
                if (null == e) {
                  if (null === f) return document.createTextNode(h);
                  (e = i
                    ? document.createElementNS("http://www.w3.org/2000/svg", f)
                    : document.createElement(f, h.is && h)),
                    (a = null),
                    (o = !1);
                }
                if (null === f) d === h || (o && e.data === h) || (e.data = h);
                else {
                  if (
                    ((a = a && xt.call(e.childNodes)),
                    (u = (d = n.props || Ft).dangerouslySetInnerHTML),
                    (l = h.dangerouslySetInnerHTML),
                    !o)
                  ) {
                    if (null != a)
                      for (d = {}, m = 0; m < e.attributes.length; m++)
                        d[e.attributes[m].name] = e.attributes[m].value;
                    (!l && !u) ||
                      (l &&
                        ((u && l.__html == u.__html) ||
                          l.__html === e.innerHTML)) ||
                      (e.innerHTML = (l && l.__html) || "");
                  }
                  if (
                    ((function (e, t, n, r, i) {
                      for (var a in n)
                        "children" === a ||
                          "key" === a ||
                          a in t ||
                          qt(e, a, null, n[a], r);
                      for (a in t)
                        (i && "function" != typeof t[a]) ||
                          "children" === a ||
                          "key" === a ||
                          "value" === a ||
                          "checked" === a ||
                          n[a] === t[a] ||
                          qt(e, a, t[a], n[a], r);
                    })(e, h, d, i, o),
                    l)
                  )
                    t.__k = [];
                  else if (
                    ((m = t.props.children),
                    $t(
                      e,
                      Array.isArray(m) ? m : [m],
                      t,
                      n,
                      r,
                      i && "foreignObject" !== f,
                      a,
                      s,
                      a ? a[0] : n.__k && At(n, 0),
                      o
                    ),
                    null != a)
                  )
                    for (m = a.length; m--; ) null != a[m] && Ot(a[m]);
                  o ||
                    ("value" in h &&
                      void 0 !== (m = h.value) &&
                      (m !== e.value ||
                        ("progress" === f && !m) ||
                        ("option" === f && m !== d.value)) &&
                      qt(e, "value", m, d.value, !1),
                    "checked" in h &&
                      void 0 !== (m = h.checked) &&
                      m !== e.checked &&
                      qt(e, "checked", m, d.checked, !1));
                }
                return e;
              })(n.__e, t, n, r, i, a, s, c));
        (u = w.diffed) && u(t);
      } catch (e) {
        (t.__v = null),
          (!c && null == a) ||
            ((t.__e = o), (t.__h = !!c), (a[a.indexOf(o)] = null)),
          w.__e(e, t, n);
      }
    }
  }
  function zt(e, t) {
    w.__c && w.__c(t, e),
      e.some(function (t) {
        try {
          (e = t.__h),
            (t.__h = []),
            e.some(function (e) {
              e.call(t);
            });
        } catch (e) {
          w.__e(e, t.__v);
        }
      });
  }
  function Jt(e, t, n) {
    try {
      "function" == typeof e ? e(t) : (e.current = t);
    } catch (e) {
      w.__e(e, n);
    }
  }
  function Zt(e, t, n) {
    return this.constructor(e, n);
  }
  function M(e, t, n) {
    var r, i, a;
    w.__ && w.__(e, t),
      (i = (r = "function" == typeof n) ? null : (n && n.__k) || t.__k),
      (a = []),
      Kt(
        t,
        (e = ((!r && n) || t).__k = L(x, null, [e])),
        i || Ft,
        Ft,
        void 0 !== t.ownerSVGElement,
        !r && n ? [n] : !i && t.firstChild ? xt.call(t.childNodes) : null,
        a,
        !r && n ? n : i ? i.__e : t.firstChild,
        r
      ),
      zt(a, e);
  }
  function Yt(e, t) {
    var n,
      e = { method: e, payload: t },
      t = e.method;
    if ("object" !== W((e = e.payload)))
      throw new Error(
        "The insights helper expects the payload to be an object."
      );
    try {
      n = he(e);
    } catch (e) {
      throw new Error("Could not JSON serialize the payload object.");
    }
    return 'data-insights-method="'
      .concat(t, '" data-insights-payload="')
      .concat(n, '"');
  }
  (xt = Et.slice),
    (w = {
      __e: function (e, t, n, r) {
        for (var i, a, s; (t = t.__); )
          if ((i = t.__c) && !i.__)
            try {
              if (
                ((a = i.constructor) &&
                  null != a.getDerivedStateFromError &&
                  (i.setState(a.getDerivedStateFromError(e)), (s = i.__d)),
                null != i.componentDidCatch &&
                  (i.componentDidCatch(e, r || {}), (s = i.__d)),
                s)
              )
                return (i.__E = i);
            } catch (t) {
              e = t;
            }
        throw e;
      },
    }),
    (It = 0),
    (Ht.prototype.setState = function (e, t) {
      var n =
        null != this.__s && this.__s !== this.state
          ? this.__s
          : (this.__s = kt({}, this.state));
      (e = "function" == typeof e ? e(kt({}, n), this.props) : e) && kt(n, e),
        null != e && this.__v && (t && this.__h.push(t), Wt(this));
    }),
    (Ht.prototype.forceUpdate = function (e) {
      this.__v && ((this.__e = !0), e && this.__h.push(e), Wt(this));
    }),
    (Ht.prototype.render = x),
    (Ct = []),
    (Dt.__r = 0);
  var Xt = function (e) {
    var n = e.insights,
      r = e.sendEvent;
    return function (e) {
      var t = Gt(e.target, e.currentTarget, function (e) {
          return e.hasAttribute("data-insights-event");
        }),
        t =
          (t &&
            (function (e) {
              e = e.getAttribute("data-insights-event");
              if ("string" != typeof e)
                throw new Error(
                  "The insights middleware expects `data-insights-event` to be a base64-encoded JSON string."
                );
              try {
                return fe(e);
              } catch (e) {
                throw new Error(
                  "The insights middleware was unable to parse `data-insights-event`."
                );
              }
            })(t).forEach(function (e) {
              return r(e);
            }),
          Gt(e.target, e.currentTarget, function (e) {
            return (
              e.hasAttribute("data-insights-method") &&
              e.hasAttribute("data-insights-payload")
            );
          }));
      t &&
        ((t = (e = (function (e) {
          var t = e.getAttribute("data-insights-method");
          if ("string" != typeof (e = e.getAttribute("data-insights-payload")))
            throw new Error(
              "The insights helper expects `data-insights-payload` to be a base64-encoded JSON string."
            );
          try {
            return { method: t, payload: fe(e) };
          } catch (e) {
            throw new Error(
              "The insights helper was unable to parse `data-insights-payload`."
            );
          }
        })(t)).method),
        (e = e.payload),
        n(t, e));
    };
  };
  function Gt(e, t, n) {
    for (var r = e; r && !n(r); ) {
      if (r === t) return null;
      r = r.parentElement;
    }
    return r;
  }
  function en(r) {
    var i = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : R;
    return (
      f(r, nn()),
      function (s) {
        var e = s || {},
          t = e.items,
          e = e.transformItems,
          o =
            void 0 === e
              ? function (e) {
                  return e;
                }
              : e;
        if (!Array.isArray(t))
          throw new Error(
            nn("The `items` option expects an array of objects.")
          );
        var c = t,
          e = c.filter(function (e) {
            return !0 === e.default;
          });
        if (0 === e.length)
          throw new Error(nn("A default value must be specified in `items`."));
        if (1 < e.length)
          throw new Error(
            nn("More than one default value is specified in `items`.")
          );
        var n = e[0],
          u = function (t) {
            return function (e) {
              return (
                e || 0 === e
                  ? t.setQueryParameter("hitsPerPage", e)
                  : t.setQueryParameter("hitsPerPage", void 0)
              ).search();
            };
          },
          l = function (e) {
            var n = e.state,
              r = e.createURL,
              i = e.getWidgetUiState,
              a = e.helper;
            return function (t) {
              return r(function (e) {
                return i(e, {
                  searchParameters: n
                    .resetPage()
                    .setQueryParameter(
                      "hitsPerPage",
                      t || 0 === t ? t : void 0
                    ),
                  helper: a,
                });
              });
            };
          };
        return {
          $$type: "ais.hitsPerPage",
          init: function (e) {
            var t = e.state,
              n = e.instantSearchInstance;
            c.some(function (e) {
              return Number(t.hitsPerPage) === Number(e.value);
            }) || (c = [{ value: "", label: "" }].concat(P(c))),
              r(
                F(
                  F({}, this.getWidgetRenderState(e)),
                  {},
                  { instantSearchInstance: n }
                ),
                !0
              );
          },
          render: function (e) {
            var t = e.instantSearchInstance;
            r(
              F(
                F({}, this.getWidgetRenderState(e)),
                {},
                { instantSearchInstance: t }
              ),
              !1
            );
          },
          dispose: function (e) {
            e = e.state;
            return i(), e.setQueryParameter("hitsPerPage", void 0);
          },
          getRenderState: function (e, t) {
            return F(
              F({}, e),
              {},
              { hitsPerPage: this.getWidgetRenderState(t) }
            );
          },
          getWidgetRenderState: function (e) {
            var t,
              n = e.state,
              r = e.results,
              i = e.createURL,
              e = e.helper,
              a = !!r && 0 < r.nbHits;
            return {
              items: o(
                ((t = n.hitsPerPage),
                c.map(function (e) {
                  return F(
                    F({}, e),
                    {},
                    { isRefined: Number(e.value) === Number(t) }
                  );
                })),
                { results: r }
              ),
              refine: u(e),
              createURL: l({
                state: n,
                createURL: i,
                getWidgetUiState: this.getWidgetUiState,
                helper: e,
              }),
              hasNoResults: !a,
              canRefine: a,
              widgetParams: s,
            };
          },
          getWidgetUiState: function (e, t) {
            t = t.searchParameters.hitsPerPage;
            return void 0 === t || t === n.value
              ? e
              : F(F({}, e), {}, { hitsPerPage: t });
          },
          getWidgetSearchParameters: function (e, t) {
            t = t.uiState;
            return e.setQueryParameters({
              hitsPerPage: t.hitsPerPage || n.value,
            });
          },
        };
      }
    );
  }
  var tn = Nt(_t),
    nn = l({ name: "hits-per-page", connector: !0 }),
    rn = ["page"],
    an = ["clickAnalytics", "userToken"],
    sn = l({ name: "infinite-hits", connector: !0 });
  function on(e) {
    e = e || {};
    e.page;
    return j(e, rn);
  }
  function cn(e) {
    e = e || {};
    e.clickAnalytics, e.userToken;
    return j(e, an);
  }
  function un(i) {
    var a = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : R;
    return (
      f(i, sn()),
      function (m) {
        var n,
          r,
          p,
          g,
          v,
          y,
          e = m || {},
          t = e.escapeHTML,
          b = void 0 === t || t,
          t = e.transformItems,
          R =
            void 0 === t
              ? function (e) {
                  return e;
                }
              : t,
          t = e.cache,
          S =
            void 0 === t
              ? ((r = n = null),
                {
                  read: function (e) {
                    e = e.state;
                    return He(r, on(e)) ? n : null;
                  },
                  write: function (e) {
                    var t = e.state,
                      e = e.hits;
                    (r = on(t)), (n = e);
                  },
                })
              : t,
          _ = function (e, t) {
            (e = e.page),
              (e = void 0 === e ? 0 : e),
              (t = Object.keys(t).map(Number));
            return 0 === t.length ? e : Math.min.apply(Math, [e].concat(P(t)));
          },
          w = function (e, t) {
            (e = e.page),
              (e = void 0 === e ? 0 : e),
              (t = Object.keys(t).map(Number));
            return 0 === t.length ? e : Math.max.apply(Math, [e].concat(P(t)));
          };
        return {
          $$type: "ais.infiniteHits",
          init: function (e) {
            i(
              F(
                F({}, this.getWidgetRenderState(e)),
                {},
                { instantSearchInstance: e.instantSearchInstance }
              ),
              !0
            );
          },
          render: function (e) {
            var t = e.instantSearchInstance,
              e = this.getWidgetRenderState(e);
            i(F(F({}, e), {}, { instantSearchInstance: t }), !1),
              v("view:internal", e.currentPageHits);
          },
          getRenderState: function (e, t) {
            return F(
              F({}, e),
              {},
              { infiniteHits: this.getWidgetRenderState(t) }
            );
          },
          getWidgetRenderState: function (e) {
            var t,
              n,
              r,
              i,
              a = e.results,
              s = e.helper,
              o = e.parent,
              c = e.state,
              e = e.instantSearchInstance,
              u = [],
              o = o.getPreviousState() || c,
              c = S.read({ state: cn(o) }) || {},
              l =
                null == a ||
                null == (l = a.renderingContent) ||
                null == (l = l.widgets) ||
                null == (l = l.banners)
                  ? void 0
                  : l[0],
              d = a
                ? ((h = void 0 === (h = o.page) ? 0 : h),
                  b && 0 < a.hits.length && (a.hits = ue(a.hits)),
                  (f = ke(je(a.hits, a.page, a.hitsPerPage), a.queryID)),
                  (f = R(f, { results: a })),
                  (t = !1),
                  (function t(e, n) {
                    n(e),
                      e.getWidgets().forEach(function (e) {
                        ve(e) && t(e, n);
                      });
                  })(e.mainIndex, function (e) {
                    !t &&
                      e.getWidgets().some(function (e) {
                        return "ais.dynamicWidgets" === e.$$type;
                      }) &&
                      (t = !0);
                  }),
                  (d = !(
                    (null != (d = o.disjunctiveFacets) && d.length) ||
                    (o.facets || []).filter(function (e) {
                      return "*" !== e;
                    }).length ||
                    (null != (d = o.hierarchicalFacets) && d.length)
                  )),
                  void 0 !== c[h] ||
                    a.__isArtificial ||
                    "idle" !== e.status ||
                    (t && d) ||
                    ((c[h] = f), S.write({ state: cn(o), hits: c })),
                  (u = f),
                  0 === _(o, c))
                : ((p = function () {
                    r.overrideStateWithoutTriggeringChangeEvent(
                      F(
                        F({}, r.state),
                        {},
                        {
                          page:
                            _(r.state, S.read({ state: cn(r.state) }) || {}) -
                            1,
                        }
                      )
                    ).searchWithoutTriggeringOnStateChange();
                  }),
                  (n = r = s),
                  (g = function () {
                    n.setPage(
                      w(n.state, S.read({ state: cn(n.state) }) || {}) + 1
                    ).search();
                  }),
                  (v = pe({
                    instantSearchInstance: e,
                    getIndex: function () {
                      return s.getIndex();
                    },
                    widgetType: this.$$type,
                  })),
                  (y = ge({
                    getIndex: function () {
                      return s.getIndex();
                    },
                    widgetType: this.$$type,
                    instantSearchInstance: e,
                  })),
                  void 0 === o.page || 0 === _(o, c)),
              h =
                ((i = c),
                Object.keys(i)
                  .map(Number)
                  .sort(function (e, t) {
                    return e - t;
                  })
                  .reduce(function (e, t) {
                    return e.concat(i[t]);
                  }, [])),
              f = !a || a.nbPages <= w(o, c) + 1;
            return {
              hits: h,
              items: h,
              currentPageHits: u,
              sendEvent: v,
              bindEvent: y,
              banner: l,
              results: a,
              showPrevious: p,
              showMore: g,
              isFirstPage: d,
              isLastPage: f,
              widgetParams: m,
            };
          },
          dispose: function (e) {
            (e = e.state), a(), (e = e.setQueryParameter("page", void 0));
            return b
              ? e.setQueryParameters(
                  Object.keys(O).reduce(function (e, t) {
                    return F(F({}, e), {}, E({}, t, void 0));
                  }, {})
                )
              : e;
          },
          getWidgetUiState: function (e, t) {
            t = t.searchParameters.page || 0;
            return t ? F(F({}, e), {}, { page: t + 1 }) : e;
          },
          getWidgetSearchParameters: function (e, t) {
            var t = t.uiState,
              n = e,
              e = (b && (n = e.setQueryParameters(O)), t.page ? t.page - 1 : 0);
            return n.setQueryParameter("page", e);
          },
        };
      }
    );
  }
  function ln(n) {
    var a = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : R;
    return (
      f(n, fn()),
      function (l) {
        var d,
          h,
          f,
          e = l || {},
          m = e.attribute,
          t = e.limit,
          r = void 0 === t ? 10 : t,
          t = e.showMore,
          p = void 0 !== t && t,
          t = e.showMoreLimit,
          i = void 0 === t ? 20 : t,
          t = e.sortBy,
          g = void 0 === t ? mn : t,
          t = e.transformItems,
          v =
            void 0 === t
              ? function (e) {
                  return e;
                }
              : t;
        if (!m) throw new Error(fn("The `attribute` option is required."));
        if (!0 === p && i <= r)
          throw new Error(
            fn("The `showMoreLimit` option must be greater than `limit`.")
          );
        var y = !1,
          b = function () {};
        function R() {
          b();
        }
        function S() {
          return y ? i : r;
        }
        return {
          $$type: "ais.menu",
          init: function (e) {
            var t = e.instantSearchInstance;
            n(
              F(
                F({}, this.getWidgetRenderState(e)),
                {},
                { instantSearchInstance: t }
              ),
              !0
            );
          },
          render: function (e) {
            var t = e.instantSearchInstance;
            n(
              F(
                F({}, this.getWidgetRenderState(e)),
                {},
                { instantSearchInstance: t }
              ),
              !1
            );
          },
          dispose: function (e) {
            e = e.state;
            return (
              a(),
              e
                .removeHierarchicalFacet(m)
                .setQueryParameter("maxValuesPerFacet", void 0)
            );
          },
          getRenderState: function (e, t) {
            return F(
              F({}, e),
              {},
              {
                menu: F(
                  F({}, e.menu),
                  {},
                  E({}, m, this.getWidgetRenderState(t))
                ),
              }
            );
          },
          getWidgetRenderState: function (e) {
            var t,
              n,
              r = this,
              i = e.results,
              a = e.createURL,
              s = e.instantSearchInstance,
              o = e.helper,
              c = [],
              u = !1;
            return (
              (d =
                d ||
                de({
                  instantSearchInstance: s,
                  helper: o,
                  attribute: m,
                  widgetType: this.$$type,
                })),
              (h =
                h ||
                function (t) {
                  return a(function (e) {
                    return r.getWidgetUiState(e, {
                      searchParameters: o.state
                        .resetPage()
                        .toggleFacetRefinement(m, t),
                      helper: o,
                    });
                  });
                }),
              (f =
                f ||
                function (e) {
                  var t = k(o.getHierarchicalFacetBreadcrumb(m), 1)[0];
                  d("click:internal", e || t),
                    o.toggleFacetRefinement(m, e || t).search();
                }),
              e.results &&
                ((t = e),
                (n = this),
                (b = function () {
                  (y = !y), n.render(t);
                })),
              i &&
                ((e =
                  (s = i.getFacetValues(m, {
                    sortBy: g,
                    facetOrdering: g === mn,
                  })) &&
                  !Array.isArray(s) &&
                  s.data
                    ? s.data
                    : []),
                (u = p && (y || e.length > S())),
                (c = v(
                  e.slice(0, S()).map(function (e) {
                    var t = e.name,
                      n = e.escapedValue;
                    e.path;
                    return F(F({}, j(e, hn)), {}, { label: t, value: n });
                  }),
                  { results: i }
                ))),
              {
                items: c,
                createURL: h,
                refine: f,
                sendEvent: d,
                canRefine: 0 < c.length,
                widgetParams: l,
                isShowingMore: y,
                toggleShowMore: R,
                canToggleShowMore: u,
              }
            );
          },
          getWidgetUiState: function (e, t) {
            var t = k(
              t.searchParameters.getHierarchicalFacetBreadcrumb(m),
              1
            )[0];
            return (
              (e = F(
                F({}, e),
                {},
                { menu: F(F({}, e.menu), {}, E({}, m, t)) }
              )),
              (t = m),
              e.menu &&
                (void 0 === e.menu[t] && delete e.menu[t],
                0 === Object.keys(e.menu).length) &&
                delete e.menu,
              e
            );
          },
          getWidgetSearchParameters: function (e, t) {
            var n,
              t = t.uiState,
              t = t.menu && t.menu[m];
            return e.isConjunctiveFacet(m) || e.isDisjunctiveFacet(m)
              ? e
              : ((n =
                  (e = e
                    .removeHierarchicalFacet(m)
                    .addHierarchicalFacet({ name: m, attributes: [m] }))
                    .maxValuesPerFacet || 0),
                (n = Math.max(n, p ? i : r)),
                (e = e.setQueryParameter("maxValuesPerFacet", n)),
                t
                  ? e.addHierarchicalFacetRefinement(m, t)
                  : e.setQueryParameters({
                      hierarchicalFacetsRefinements: F(
                        F({}, e.hierarchicalFacetsRefinements),
                        {},
                        E({}, m, [])
                      ),
                    }));
          },
        };
      }
    );
  }
  var dn = Nt(un),
    hn = ["name", "escapedValue", "path"],
    fn = l({ name: "menu", connector: !0 }),
    mn = ["isRefined", "name:asc"];
  function pn(n) {
    var r = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : R;
    return (
      f(n, gn()),
      function (f) {
        var m,
          e = f || {},
          t = e.attribute,
          p = void 0 === t ? "" : t,
          t = e.items,
          g = void 0 === t ? [] : t,
          t = e.transformItems,
          v =
            void 0 === t
              ? function (e) {
                  return e;
                }
              : t;
        if ("" === p)
          throw new Error(gn("The `attribute` option is required."));
        if (g && 0 !== g.length)
          return (
            (m = {}),
            {
              $$type: "ais.numericMenu",
              init: function (e) {
                var t = e.instantSearchInstance;
                n(
                  F(
                    F({}, this.getWidgetRenderState(e)),
                    {},
                    { instantSearchInstance: t }
                  ),
                  !0
                );
              },
              render: function (e) {
                var t = e.instantSearchInstance;
                n(
                  F(
                    F({}, this.getWidgetRenderState(e)),
                    {},
                    { instantSearchInstance: t }
                  ),
                  !1
                );
              },
              dispose: function (e) {
                e = e.state;
                return r(), e.removeNumericRefinement(p);
              },
              getWidgetUiState: function (e, t) {
                var t = t.searchParameters.getNumericRefinements(p),
                  n = t["="] && t["="][0];
                return n || 0 === n
                  ? F(
                      F({}, e),
                      {},
                      {
                        numericMenu: F(
                          F({}, e.numericMenu),
                          {},
                          E({}, p, "".concat(t["="]))
                        ),
                      }
                    )
                  : ((n = (t[">="] && t[">="][0]) || ""),
                    (t = (t["<="] && t["<="][0]) || ""),
                    (e = F(
                      F({}, e),
                      {},
                      {
                        numericMenu: F(
                          F({}, e.numericMenu),
                          {},
                          E({}, p, "".concat(n, ":").concat(t))
                        ),
                      }
                    )),
                    (n = p),
                    e.numericMenu &&
                      (":" === e.numericMenu[n] && delete e.numericMenu[n],
                      0 === Object.keys(e.numericMenu).length) &&
                      delete e.numericMenu,
                    e);
              },
              getWidgetSearchParameters: function (e, t) {
                var n,
                  t = t.uiState,
                  t = t.numericMenu && t.numericMenu[p],
                  e = e.setQueryParameters({
                    numericRefinements: F(
                      F({}, e.numericRefinements),
                      {},
                      E({}, p, {})
                    ),
                  });
                return t
                  ? -1 === t.indexOf(":")
                    ? e.addNumericRefinement(p, "=", Number(t))
                    : ((n = (t = k(t.split(":").map(parseFloat), 2))[0]),
                      (t = t[1]),
                      (n = b(n) ? e.addNumericRefinement(p, ">=", n) : e),
                      b(t) ? n.addNumericRefinement(p, "<=", t) : n)
                  : e;
              },
              getRenderState: function (e, t) {
                return F(
                  F({}, e),
                  {},
                  {
                    numericMenu: F(
                      F({}, e.numericMenu),
                      {},
                      E({}, p, this.getWidgetRenderState(t))
                    ),
                  }
                );
              },
              getWidgetRenderState: function (e) {
                var t,
                  r,
                  n,
                  i = this,
                  a = e.results,
                  s = e.state,
                  o = e.instantSearchInstance,
                  c = e.helper,
                  u = e.createURL,
                  e =
                    (m.refine ||
                      (m.refine = function (e) {
                        var t = yn(c.state, p, e);
                        m.sendEvent("click:internal", e),
                          c.setState(t).search();
                      }),
                    m.createURL ||
                      (m.createURL = function (n) {
                        return function (t) {
                          return u(function (e) {
                            return i.getWidgetUiState(e, {
                              searchParameters: yn(n, p, t),
                              helper: c,
                            });
                          });
                        };
                      }),
                    m.sendEvent ||
                      (m.sendEvent =
                        ((t = { instantSearchInstance: o }
                          .instantSearchInstance),
                        function () {
                          1 === arguments.length &&
                            t.sendEventToInsights(
                              arguments.length <= 0 ? void 0 : arguments[0]
                            );
                        })),
                    !a || 0 === a.nbHits),
                  o =
                    ((r = s),
                    g.map(function (e) {
                      var t = e.start,
                        n = e.end,
                        e = e.label;
                      return {
                        label: e,
                        value: encodeURI(JSON.stringify({ start: t, end: n })),
                        isRefined: vn(r, p, { start: t, end: n, label: e }),
                      };
                    })),
                  l = !0,
                  d = (function (e, t) {
                    var n,
                      r,
                      i,
                      a,
                      s =
                        ("undefined" != typeof Symbol && e[Symbol.iterator]) ||
                        e["@@iterator"];
                    if (s)
                      return (
                        (r = !(n = !0)),
                        {
                          s: function () {
                            s = s.call(e);
                          },
                          n: function () {
                            var e = s.next();
                            return (n = e.done), e;
                          },
                          e: function (e) {
                            (r = !0), (i = e);
                          },
                          f: function () {
                            try {
                              n || null == s.return || s.return();
                            } finally {
                              if (r) throw i;
                            }
                          },
                        }
                      );
                    if (
                      Array.isArray(e) ||
                      (s = K(e)) ||
                      (t && e && "number" == typeof e.length)
                    )
                      return (
                        s && (e = s),
                        (a = 0),
                        {
                          s: (t = function () {}),
                          n: function () {
                            return a >= e.length
                              ? { done: !0 }
                              : { done: !1, value: e[a++] };
                          },
                          e: function (e) {
                            throw e;
                          },
                          f: t,
                        }
                      );
                    throw new TypeError(
                      "Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."
                    );
                  })(o);
                try {
                  for (d.s(); !(n = d.n()).done; ) {
                    var h = n.value;
                    if (h.isRefined && "{}" !== decodeURI(h.value)) {
                      l = !1;
                      break;
                    }
                  }
                } catch (e) {
                  d.e(e);
                } finally {
                  d.f();
                }
                return {
                  createURL: m.createURL(s),
                  items: v(o, { results: a }),
                  hasNoResults: e,
                  canRefine: !(e && l),
                  refine: m.refine,
                  sendEvent: m.sendEvent,
                  widgetParams: f,
                };
              },
            }
          );
        throw new Error(gn("The `items` option expects an array of objects."));
      }
    );
  }
  var gn = l({ name: "numeric-menu", connector: !0 });
  function vn(e, t, n) {
    var r = e.getNumericRefinements(t);
    return void 0 !== n.start && void 0 !== n.end
      ? n.start === n.end
        ? bn(r, "=", n.start)
        : bn(r, ">=", n.start) && bn(r, "<=", n.end)
      : void 0 !== n.start
      ? bn(r, ">=", n.start)
      : void 0 !== n.end
      ? bn(r, "<=", n.end)
      : void 0 === n.start &&
        void 0 === n.end &&
        Object.keys(r).every(function (e) {
          return 0 === (r[e] || []).length;
        });
  }
  function yn(e, t, n) {
    var n = JSON.parse(decodeURI(n)),
      r = e.getNumericRefinements(t);
    if (void 0 === n.start && void 0 === n.end)
      return e.removeNumericRefinement(t);
    if (
      (vn(e, t, n) || (e = e.removeNumericRefinement(t)),
      void 0 !== n.start && void 0 !== n.end)
    ) {
      if (n.start > n.end)
        throw new Error("option.start should be > to option.end");
      if (n.start === n.end)
        return (e = bn(r, "=", n.start)
          ? e.removeNumericRefinement(t, "=", n.start)
          : e.addNumericRefinement(t, "=", n.start));
    }
    return (
      void 0 !== n.start &&
        (e = (e = bn(r, ">=", n.start)
          ? e.removeNumericRefinement(t, ">=", n.start)
          : e).addNumericRefinement(t, ">=", n.start)),
      "number" ==
        typeof (e =
          void 0 !== n.end
            ? (e = bn(r, "<=", n.end)
                ? e.removeNumericRefinement(t, "<=", n.end)
                : e).addNumericRefinement(t, "<=", n.end)
            : e).page && (e.page = 0),
      e
    );
  }
  function bn(e, t, n) {
    return void 0 !== e[t] && e[t].includes(n);
  }
  function Rn(n) {
    var t = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : R;
    return (
      f(n, _n()),
      function (a) {
        var e = a || {},
          s = e.totalPages,
          e = e.padding,
          o = new Sn({
            currentPage: 0,
            total: 0,
            padding: void 0 === e ? 3 : e,
          }),
          c = {};
        return {
          $$type: "ais.pagination",
          init: function (e) {
            var t = e.instantSearchInstance;
            n(
              F(
                F({}, this.getWidgetRenderState(e)),
                {},
                { instantSearchInstance: t }
              ),
              !0
            );
          },
          render: function (e) {
            var t = e.instantSearchInstance;
            n(
              F(
                F({}, this.getWidgetRenderState(e)),
                {},
                { instantSearchInstance: t }
              ),
              !1
            );
          },
          dispose: function (e) {
            e = e.state;
            return t(), e.setQueryParameter("page", void 0);
          },
          getWidgetUiState: function (e, t) {
            t = t.searchParameters.page || 0;
            return t ? F(F({}, e), {}, { page: t + 1 }) : e;
          },
          getWidgetSearchParameters: function (e, t) {
            (t = t.uiState), (t = t.page ? t.page - 1 : 0);
            return e.setQueryParameter("page", t);
          },
          getWidgetRenderState: function (e) {
            var t = e.results,
              n = e.helper,
              r = e.state,
              i = e.createURL,
              e =
                (c.refine ||
                  (c.refine = function (e) {
                    n.setPage(e), n.search();
                  }),
                c.createURL ||
                  (c.createURL = function (t) {
                    return i(function (e) {
                      return F(F({}, e), {}, { page: t + 1 });
                    });
                  }),
                r.page || 0),
              r =
                ((r = (r = t || { nbPages: 0 }).nbPages),
                void 0 !== s ? Math.min(s, r) : r);
            return (
              (o.currentPage = e),
              (o.total = r),
              {
                createURL: c.createURL,
                refine: c.refine,
                canRefine: 1 < r,
                currentRefinement: e,
                nbHits: (null == t ? void 0 : t.nbHits) || 0,
                nbPages: r,
                pages: t ? o.pages() : [],
                isFirstPage: o.isFirstPage(),
                isLastPage: o.isLastPage(),
                widgetParams: a,
              }
            );
          },
          getRenderState: function (e, t) {
            return F(
              F({}, e),
              {},
              { pagination: this.getWidgetRenderState(t) }
            );
          },
        };
      }
    );
  }
  var Sn = (function () {
      function t(e) {
        D(this, t),
          E(this, "currentPage", void 0),
          E(this, "total", void 0),
          E(this, "padding", void 0),
          (this.currentPage = e.currentPage),
          (this.total = e.total),
          (this.padding = e.padding);
      }
      return (
        $(t, [
          {
            key: "pages",
            value: function () {
              var e,
                t = this.total,
                n = this.currentPage,
                r = this.padding;
              return 0 === t
                ? [0]
                : et(
                    (e = this.nbPagesDisplayed(r, t)) === t
                      ? { end: t }
                      : {
                          start:
                            n - (r = this.calculatePaddingLeft(n, r, t, e)),
                          end: n + (e - r),
                        }
                  );
            },
          },
          {
            key: "nbPagesDisplayed",
            value: function (e, t) {
              return Math.min(2 * e + 1, t);
            },
          },
          {
            key: "calculatePaddingLeft",
            value: function (e, t, n, r) {
              return e <= t ? e : n - t <= e ? r - (n - e) : t;
            },
          },
          {
            key: "isLastPage",
            value: function () {
              return this.currentPage >= this.total - 1;
            },
          },
          {
            key: "isFirstPage",
            value: function () {
              return this.currentPage <= 0;
            },
          },
        ]),
        t
      );
    })(),
    _n = l({ name: "pagination", connector: !0 }),
    wn = l(
      { name: "range-input", connector: !0 },
      { name: "range-slider", connector: !0 }
    );
  function Pn(e) {
    var t = e.min,
      n = e.max,
      e = e.precision,
      e = Math.pow(10, e);
    return { min: t && Math.floor(t * e) / e, max: n && Math.ceil(n * e) / e };
  }
  function Nn(n) {
    var r = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : R;
    return (
      f(n, wn()),
      function (o) {
        var e = o || {},
          t = e.attribute,
          u = void 0 === t ? "" : t,
          l = e.min,
          d = e.max,
          t = e.precision,
          h = void 0 === t ? 0 : t;
        if (!u) throw new Error(wn("The `attribute` option is required."));
        if (b(l) && b(d) && d < l)
          throw new Error(wn("The `max` option can't be lower than `min`."));
        var c = {
            from: function (e) {
              return e.toLocaleString();
            },
            to: function (e) {
              return Number(Number(e).toFixed(h)).toLocaleString();
            },
          },
          i = function (e, t, n, r) {
            var e = e.state,
              i = t.min,
              t = t.max,
              a = k(e.getNumericRefinement(u, ">=") || [], 1)[0],
              s = k(e.getNumericRefinement(u, "<=") || [], 1)[0],
              o = void 0 === n || "" === n,
              c = void 0 === r || "" === r,
              n = Pn({
                min: o ? void 0 : parseFloat(n),
                max: c ? void 0 : parseFloat(r),
                precision: h,
              }),
              r = n.min,
              n = n.max,
              o = b(l) || i !== r ? (b(l) && o ? l : r) : void 0,
              r = b(d) || t !== n ? (b(d) && c ? d : n) : void 0,
              c = void 0 === o,
              n = b(i) && i <= o,
              c = c || (b(o) && (!b(i) || n)),
              i = void 0 === r,
              n = b(r) && r <= t,
              i = i || (b(r) && (!b(t) || n));
            return (a !== o || s !== r) && c && i
              ? ((e = e.removeNumericRefinement(u)),
                b(o) && (e = e.addNumericRefinement(u, ">=", o)),
                (e = b(r) ? e.addNumericRefinement(u, "<=", r) : e).resetPage())
              : null;
          };
        function f(n, r) {
          return function () {
            var e = k(
                0 < arguments.length && void 0 !== arguments[0]
                  ? arguments[0]
                  : [void 0, void 0],
                2
              ),
              t = e[0],
              e = e[1],
              t = i(n, r, t, e);
            t && n.setState(t).search();
          };
        }
        return {
          $$type: "ais.range",
          init: function (e) {
            n(
              F(
                F({}, this.getWidgetRenderState(e)),
                {},
                { instantSearchInstance: e.instantSearchInstance }
              ),
              !0
            );
          },
          render: function (e) {
            n(
              F(
                F({}, this.getWidgetRenderState(e)),
                {},
                { instantSearchInstance: e.instantSearchInstance }
              ),
              !1
            );
          },
          getRenderState: function (e, t) {
            return F(
              F({}, e),
              {},
              {
                range: F(
                  F({}, e.range),
                  {},
                  E({}, u, this.getWidgetRenderState(t))
                ),
              }
            );
          },
          getWidgetRenderState: function (e) {
            var t,
              n = e.results,
              r = e.helper,
              e = e.instantSearchInstance,
              i = we((n && n.disjunctiveFacets) || [], function (e) {
                return e.name === u;
              }),
              i = (i && i.stats) || { min: void 0, max: void 0 },
              a =
                ((i = i),
                (a = b(l) ? l : b(i.min) ? i.min : 0),
                (i = b(d) ? d : b(i.max) ? i.max : 0),
                Pn({ min: a, max: i, precision: h })),
              s =
                ((s = k((i = r).getNumericRefinement(u, ">=") || [], 1)[0]),
                (i = k(i.getNumericRefinement(u, "<=") || [], 1)[0]),
                [b(s) ? s : -1 / 0, b(i) ? i : 1 / 0]),
              i = f(r, n ? a : { min: void 0, max: void 0 });
            return {
              refine: i,
              canRefine: a.min !== a.max,
              format: c,
              range: a,
              sendEvent:
                ((t = e),
                function () {
                  1 === arguments.length &&
                    t.sendEventToInsights(
                      arguments.length <= 0 ? void 0 : arguments[0]
                    );
                }),
              widgetParams: F(F({}, o), {}, { precision: h }),
              start: s,
            };
          },
          dispose: function (e) {
            e = e.state;
            return r(), e.removeDisjunctiveFacet(u).removeNumericRefinement(u);
          },
          getWidgetUiState: function (e, t) {
            var t = t.searchParameters.getNumericRefinements(u),
              n = t[">="],
              n = void 0 === n ? [] : n,
              t = t["<="],
              t = void 0 === t ? [] : t;
            return 0 === n.length && 0 === t.length
              ? e
              : F(
                  F({}, e),
                  {},
                  {
                    range: F(
                      F({}, e.range),
                      {},
                      E({}, u, "".concat(n, ":").concat(t))
                    ),
                  }
                );
          },
          getWidgetSearchParameters: function (e, t) {
            var n,
              t = t.uiState,
              e = e
                .addDisjunctiveFacet(u)
                .setQueryParameters({
                  numericRefinements: F(
                    F({}, e.numericRefinements),
                    {},
                    E({}, u, {})
                  ),
                }),
              t =
                (b(l) && (e = e.addNumericRefinement(u, ">=", l)),
                b(d) && (e = e.addNumericRefinement(u, "<=", d)),
                t.range && t.range[u]);
            return (e =
              t &&
              -1 !== t.indexOf(":") &&
              ((n = (t = k(t.split(":").map(parseFloat), 2))[0]),
              (t = t[1]),
              b(n) &&
                (!b(l) || l < n) &&
                (e = (e = e.removeNumericRefinement(
                  u,
                  ">="
                )).addNumericRefinement(u, ">=", n)),
              b(t)) &&
              (!b(d) || t < d)
                ? (e = e.removeNumericRefinement(u, "<=")).addNumericRefinement(
                    u,
                    "<=",
                    t
                  )
                : e);
          },
        };
      }
    );
  }
  function xn(c) {
    var n = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : R;
    return (
      f(c, Tn()),
      function (h) {
        var e = h || {},
          f = e.attribute,
          t = e.operator,
          i = void 0 === t ? "or" : t,
          t = e.limit,
          m = void 0 === t ? 10 : t,
          t = e.showMore,
          p = void 0 !== t && t,
          t = e.showMoreLimit,
          a = void 0 === t ? 20 : t,
          t = e.sortBy,
          g = void 0 === t ? Fn : t,
          t = e.escapeFacetValues,
          o = void 0 === t || t,
          t = e.transformItems,
          v =
            void 0 === t
              ? function (e) {
                  return e;
                }
              : t;
        if (!f) throw new Error(Tn("The `attribute` option is required."));
        if (!/^(and|or)$/.test(i))
          throw new Error(
            Tn(
              'The `operator` must one of: `"and"`, `"or"` (got "'.concat(
                i,
                '").'
              )
            )
          );
        if (!0 === p && a <= m)
          throw new Error(
            Tn("`showMoreLimit` should be greater than `limit`.")
          );
        function y(e) {
          var t = e.name,
            n = e.escapedValue;
          return F(F({}, j(e, In)), {}, { value: n, label: t, highlighted: t });
        }
        var b,
          R,
          S,
          _ = [],
          w = !0,
          P = !1,
          N = function () {};
        function x() {
          N();
        }
        function I() {
          return P ? a : m;
        }
        function C(a, s) {
          return function (i) {
            return function (e) {
              var t,
                n = i.instantSearchInstance,
                r = i.results;
              "" === e && _
                ? c(
                    F(
                      F(
                        {},
                        s.getWidgetRenderState(F(F({}, i), {}, { results: b }))
                      ),
                      {},
                      { instantSearchInstance: n }
                    ),
                    !1
                  )
                : ((t = {
                    highlightPreTag: (o ? O : u).highlightPreTag,
                    highlightPostTag: (o ? O : u).highlightPostTag,
                  }),
                  a
                    .searchForFacetValues(f, e, Math.min(I(), 100), t)
                    .then(function (e) {
                      (e = o
                        ? e.facetHits.map(function (e) {
                            return F(
                              F({}, e),
                              {},
                              { highlighted: oe(e.highlighted) }
                            );
                          })
                        : e.facetHits),
                        (e = v(
                          e.map(function (e) {
                            var t = e.escapedValue,
                              n = e.value;
                            return F(
                              F({}, j(e, Cn)),
                              {},
                              { value: t, label: n }
                            );
                          }),
                          { results: r }
                        ));
                      c(
                        F(
                          F(
                            {},
                            s.getWidgetRenderState(
                              F(F({}, i), {}, { results: b })
                            )
                          ),
                          {},
                          {
                            items: e,
                            canToggleShowMore: !1,
                            canRefine: !0,
                            isFromSearch: !0,
                            instantSearchInstance: n,
                          }
                        ),
                        !1
                      );
                    }));
            };
          };
        }
        var T = function () {
          return function () {};
        };
        return {
          $$type: "ais.refinementList",
          init: function (e) {
            c(
              F(
                F({}, this.getWidgetRenderState(e)),
                {},
                { instantSearchInstance: e.instantSearchInstance }
              ),
              !0
            );
          },
          render: function (e) {
            c(
              F(
                F({}, this.getWidgetRenderState(e)),
                {},
                { instantSearchInstance: e.instantSearchInstance }
              ),
              !1
            );
          },
          getRenderState: function (e, t) {
            return F(
              F({}, e),
              {},
              {
                refinementList: F(
                  F({}, e.refinementList),
                  {},
                  E({}, f, this.getWidgetRenderState(t))
                ),
              }
            );
          },
          getWidgetRenderState: function (e) {
            var t,
              n,
              r = this,
              i = e.results,
              a = e.state,
              s = e.createURL,
              o = e.instantSearchInstance,
              c = e.helper,
              u = [],
              l = [],
              o =
                ((S && R && T) ||
                  ((S = de({
                    instantSearchInstance: o,
                    helper: c,
                    attribute: f,
                    widgetType: this.$$type,
                  })),
                  (R = function (e) {
                    S("click:internal", e),
                      c.toggleFacetRefinement(f, e).search();
                  }),
                  (T = C(c, this))),
                i &&
                  ((l =
                    (o = i.getFacetValues(f, {
                      sortBy: g,
                      facetOrdering: g === Fn,
                    })) && Array.isArray(o)
                      ? o
                      : []),
                  (u = v(l.slice(0, I()).map(y), { results: i })),
                  (o = a.maxValuesPerFacet),
                  (d = I()),
                  (w = d < o ? l.length <= d : l.length < d),
                  (b = i),
                  (_ = u),
                  e.results) &&
                  ((t = e),
                  (n = this),
                  (N = function () {
                    (P = !P), n.render(t);
                  })),
                T && T(e)),
              l = P && _.length > m,
              d = p && !w;
            return {
              createURL: function (t) {
                return s(function (e) {
                  return r.getWidgetUiState(e, {
                    searchParameters: a.resetPage().toggleFacetRefinement(f, t),
                    helper: c,
                  });
                });
              },
              items: u,
              refine: R,
              searchForItems: o,
              isFromSearch: !1,
              canRefine: 0 < u.length,
              widgetParams: h,
              isShowingMore: P,
              canToggleShowMore: l || d,
              toggleShowMore: x,
              sendEvent: S,
              hasExhaustiveItems: w,
            };
          },
          dispose: function (e) {
            (e = e.state),
              n(),
              (e = e.setQueryParameter("maxValuesPerFacet", void 0));
            return "and" === i ? e.removeFacet(f) : e.removeDisjunctiveFacet(f);
          },
          getWidgetUiState: function (e, t) {
            var t = t.searchParameters,
              t =
                "or" === i
                  ? t.getDisjunctiveRefinements(f)
                  : t.getConjunctiveRefinements(f);
            return (
              (e = F(
                F({}, e),
                {},
                { refinementList: F(F({}, e.refinementList), {}, E({}, f, t)) }
              )),
              (t = f),
              e.refinementList &&
                ((e.refinementList[t] && 0 !== e.refinementList[t].length) ||
                  delete e.refinementList[t],
                0 === Object.keys(e.refinementList).length) &&
                delete e.refinementList,
              e
            );
          },
          getWidgetSearchParameters: function (e, t) {
            var n,
              t = t.uiState,
              r = "or" === i;
            return e.isHierarchicalFacet(f) ||
              (r && e.isConjunctiveFacet(f)) ||
              (!r && e.isDisjunctiveFacet(f))
              ? e
              : ((t = t.refinementList && t.refinementList[f]),
                (n =
                  (e = r
                    ? e
                        .addDisjunctiveFacet(f)
                        .removeDisjunctiveFacetRefinement(f)
                    : e.addFacet(f).removeFacetRefinement(f))
                    .maxValuesPerFacet || 0),
                (n = Math.max(n, p ? a : m)),
                (e = e.setQueryParameter("maxValuesPerFacet", n)),
                t
                  ? t.reduce(function (e, t) {
                      return r
                        ? e.addDisjunctiveFacetRefinement(f, t)
                        : e.addFacetRefinement(f, t);
                    }, e)
                  : e.setQueryParameters(
                      E(
                        {},
                        (n = r
                          ? "disjunctiveFacetsRefinements"
                          : "facetsRefinements"),
                        F(F({}, e[n]), {}, E({}, f, []))
                      )
                    ));
          },
        };
      }
    );
  }
  var In = ["name", "escapedValue"],
    Cn = ["escapedValue", "value"],
    Tn = l({ name: "refinement-list", connector: !0 }),
    Fn = ["isRefined", "count:desc", "name:asc"];
  function En(l) {
    var d = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : R;
    return (
      f(l, Mn()),
      function (t) {
        var e = t || {},
          n = e.escapeHTML,
          r = void 0 === n || n,
          i = e.objectIDs,
          a = e.limit,
          s = e.threshold,
          o = e.fallbackParameters,
          c = e.queryParameters,
          n = e.transformItems,
          u =
            void 0 === n
              ? function (e) {
                  return e;
                }
              : n;
        if (i && 0 !== i.length)
          return {
            dependsOn: "recommend",
            $$type: "ais.relatedProducts",
            init: function (e) {
              l(
                F(
                  F({}, this.getWidgetRenderState(e)),
                  {},
                  { instantSearchInstance: e.instantSearchInstance }
                ),
                !0
              );
            },
            render: function (e) {
              var t = this.getWidgetRenderState(e);
              l(
                F(
                  F({}, t),
                  {},
                  { instantSearchInstance: e.instantSearchInstance }
                ),
                !1
              );
            },
            getRenderState: function (e) {
              return e;
            },
            getWidgetRenderState: function (e) {
              e = e.results;
              return null == e
                ? { items: [], widgetParams: t }
                : (r && 0 < e.hits.length && (e.hits = ue(e.hits)),
                  { items: u(e.hits, { results: e }), widgetParams: t });
            },
            dispose: function (e) {
              e = e.recommendState;
              return d(), e.removeParams(this.$$id);
            },
            getWidgetParameters: function (e) {
              var n = this;
              return i.reduce(function (e, t) {
                return e.addRelatedProducts({
                  objectID: t,
                  maxRecommendations: a,
                  threshold: s,
                  fallbackParameters: F(F({}, o), r ? O : {}),
                  queryParameters: F(F({}, c), r ? O : {}),
                  $$id: n.$$id,
                });
              }, e.removeParams(this.$$id));
            },
          };
        throw new Error(Mn("The `objectIDs` option is required."));
      }
    );
  }
  function jn(e, t) {
    return t(e);
  }
  function kn(n) {
    var t = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : R;
    return (
      f(n, Hn()),
      function (r) {
        var i,
          a,
          e = (r || {}).queryHook,
          s = void 0 === e ? jn : e;
        return {
          $$type: "ais.searchBox",
          init: function (e) {
            var t = e.instantSearchInstance;
            n(
              F(
                F({}, this.getWidgetRenderState(e)),
                {},
                { instantSearchInstance: t }
              ),
              !0
            );
          },
          render: function (e) {
            var t = e.instantSearchInstance;
            n(
              F(
                F({}, this.getWidgetRenderState(e)),
                {},
                { instantSearchInstance: t }
              ),
              !1
            );
          },
          dispose: function (e) {
            e = e.state;
            return t(), e.setQueryParameter("query", void 0);
          },
          getRenderState: function (e, t) {
            return F(F({}, e), {}, { searchBox: this.getWidgetRenderState(t) });
          },
          getWidgetRenderState: function (e) {
            var t = e.helper,
              n = e.instantSearchInstance,
              e = e.state;
            return (
              i ||
                ((i = function (e) {
                  s(e, function (e) {
                    return t.setQuery(e).search();
                  });
                }),
                (a = function () {
                  t.setQuery("").search();
                })),
              {
                query: e.query || "",
                refine: i,
                clear: a,
                widgetParams: r,
                isSearchStalled: "stalled" === n.status,
              }
            );
          },
          getWidgetUiState: function (e, t) {
            t = t.searchParameters.query || "";
            return "" === t || (e && e.query === t)
              ? e
              : F(F({}, e), {}, { query: t });
          },
          getWidgetSearchParameters: function (e, t) {
            t = t.uiState;
            return e.setQueryParameter("query", t.query || "");
          },
        };
      }
    );
  }
  function On(r) {
    var t = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : R,
      o = (f(r, An()), {});
    return function (i) {
      var e = i || {},
        a = e.items,
        e = e.transformItems,
        s =
          void 0 === e
            ? function (e) {
                return e;
              }
            : e;
      if (Array.isArray(a))
        return {
          $$type: "ais.sortBy",
          init: function (e) {
            var t = e.instantSearchInstance,
              e = this.getWidgetRenderState(e),
              n = e.currentRefinement;
            we(a, function (e) {
              return e.value === n;
            });
            r(F(F({}, e), {}, { instantSearchInstance: t }), !0);
          },
          render: function (e) {
            var t = e.instantSearchInstance;
            r(
              F(
                F({}, this.getWidgetRenderState(e)),
                {},
                { instantSearchInstance: t }
              ),
              !1
            );
          },
          dispose: function (e) {
            e = e.state;
            return t(), o.initialIndex ? e.setIndex(o.initialIndex) : e;
          },
          getRenderState: function (e, t) {
            return F(F({}, e), {}, { sortBy: this.getWidgetRenderState(t) });
          },
          getWidgetRenderState: function (e) {
            var t = e.results,
              n = e.helper,
              r = e.state,
              e = e.parent,
              e =
                (!o.initialIndex && e && (o.initialIndex = e.getIndexName()),
                o.setIndex ||
                  (o.setIndex = function (e) {
                    n.setIndex(e).search();
                  }),
                !t || 0 === t.nbHits);
            return {
              currentRefinement: r.index,
              options: s(a, { results: t }),
              refine: o.setIndex,
              hasNoResults: e,
              canRefine: !e && 0 < a.length,
              widgetParams: i,
            };
          },
          getWidgetUiState: function (e, t) {
            t = t.searchParameters.index;
            return F(
              F({}, e),
              {},
              { sortBy: t !== o.initialIndex ? t : void 0 }
            );
          },
          getWidgetSearchParameters: function (e, t) {
            t = t.uiState;
            return e.setQueryParameter(
              "index",
              t.sortBy || o.initialIndex || e.index
            );
          },
        };
      throw new Error(An("The `items` option expects an array of objects."));
    };
  }
  function Ln(n) {
    var t = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : R;
    return (
      f(n, Wn()),
      function (g) {
        var v,
          y,
          b,
          R,
          e = g || {},
          S = e.attribute,
          e = e.max,
          _ = void 0 === e ? 5 : e;
        if (S)
          return (
            (y = function (e) {
              var t,
                e = e.getNumericRefinements(S);
              if (null != (t = e[">="]) && t.length) return e[">="][0];
            }),
            (b = function (e) {
              return function (e, t) {
                v("click:internal", t), e.setState(s(e.state, t)).search();
              }.bind(null, e);
            }),
            (R = function (e) {
              var n = e.state,
                r = e.createURL,
                i = e.getWidgetUiState,
                a = e.helper;
              return function (t) {
                return r(function (e) {
                  return i(e, { searchParameters: s(n, t), helper: a });
                });
              };
            }),
            {
              $$type: Dn,
              init: function (e) {
                var t = e.instantSearchInstance;
                n(
                  F(
                    F({}, this.getWidgetRenderState(e)),
                    {},
                    { instantSearchInstance: t }
                  ),
                  !0
                );
              },
              render: function (e) {
                var t = e.instantSearchInstance;
                n(
                  F(
                    F({}, this.getWidgetRenderState(e)),
                    {},
                    { instantSearchInstance: t }
                  ),
                  !1
                );
              },
              getRenderState: function (e, t) {
                return F(
                  F({}, e),
                  {},
                  {
                    ratingMenu: F(
                      F({}, e.ratingMenu),
                      {},
                      E({}, S, this.getWidgetRenderState(t))
                    ),
                  }
                );
              },
              getWidgetRenderState: function (e) {
                var o,
                  c,
                  u,
                  l,
                  t,
                  n = e.helper,
                  r = e.results,
                  i = e.state,
                  a = e.instantSearchInstance,
                  e = e.createURL,
                  s = [],
                  d =
                    (v ||
                      ((o = (a = {
                        instantSearchInstance: a,
                        helper: n,
                        getRefinedStar: function () {
                          return y(n.state);
                        },
                        attribute: S,
                      }).instantSearchInstance),
                      (c = a.helper),
                      (u = a.getRefinedStar),
                      (l = a.attribute),
                      (v = function () {
                        for (
                          var e,
                            t,
                            n,
                            r,
                            i = arguments.length,
                            a = new Array(i),
                            s = 0;
                          s < i;
                          s++
                        )
                          a[s] = arguments[s];
                        1 === a.length
                          ? o.sendEventToInsights(a[0])
                          : ((e = a[1]),
                            (t = void 0 === (t = a[2]) ? "Filter Applied" : t),
                            (n = (r = k(a[0].split(":"), 2))[0]),
                            (r = r[1]),
                            "click" === n &&
                              u() !== Number(e) &&
                              o.sendEventToInsights({
                                insightsMethod: "clickedFilters",
                                widgetType: Dn,
                                eventType: n,
                                eventModifier: r,
                                payload: {
                                  eventName: t,
                                  index: c.getIndex(),
                                  filters: ["".concat(l, ">=").concat(e)],
                                },
                                attribute: l,
                              }));
                      })),
                    !1),
                  h = 0,
                  f = null == r ? void 0 : r.getFacetValues(S, {});
                if (r && f) {
                  f.length,
                    (t = 0),
                    f.forEach(function (e) {
                      e = k(e.name.split("."), 2)[1];
                      t = Math.max(t, (void 0 === e ? "" : e).length);
                    });
                  for (var m = y(i), p = 1; p < _; p += 1)
                    (function (n) {
                      var e = m === n,
                        t =
                          ((d = d || e),
                          f
                            .filter(function (e) {
                              return Number(e.name) >= n && Number(e.name) <= _;
                            })
                            .map(function (e) {
                              return e.count;
                            })
                            .reduce(function (e, t) {
                              return e + t;
                            }, 0));
                      if (((h += t), m && !e && 0 === t)) return;
                      var r = P(new Array(Math.floor(+_))).map(function (e, t) {
                        return +t < n;
                      });
                      s.push({
                        stars: r,
                        name: String(n),
                        label: String(n),
                        value: String(n),
                        count: t,
                        isRefined: e,
                      });
                    })(p);
                }
                (s = s.reverse()), (a = !r || 0 === r.nbHits);
                return {
                  items: s,
                  hasNoResults: a,
                  canRefine: (!a || d) && 0 < h,
                  refine: b(n),
                  sendEvent: v,
                  createURL: R({
                    state: i,
                    createURL: e,
                    helper: n,
                    getWidgetUiState: this.getWidgetUiState,
                  }),
                  widgetParams: g,
                };
              },
              dispose: function (e) {
                e = e.state;
                return t(), e.removeNumericRefinement(S);
              },
              getWidgetUiState: function (e, t) {
                var t = t.searchParameters,
                  t = y(t);
                return (
                  (e = F(
                    F({}, e),
                    {},
                    {
                      ratingMenu: F(
                        F({}, e.ratingMenu),
                        {},
                        E({}, S, "number" == typeof t ? t : void 0)
                      ),
                    }
                  )),
                  (t = S),
                  e.ratingMenu &&
                    ("number" != typeof e.ratingMenu[t] &&
                      delete e.ratingMenu[t],
                    0 === Object.keys(e.ratingMenu).length) &&
                    delete e.ratingMenu,
                  e
                );
              },
              getWidgetSearchParameters: function (e, t) {
                (t = t.uiState),
                  (t = t.ratingMenu && t.ratingMenu[S]),
                  (e = e
                    .addDisjunctiveFacet(S)
                    .removeNumericRefinement(S)
                    .removeDisjunctiveFacetRefinement(S));
                return t
                  ? e
                      .addNumericRefinement(S, "<=", _)
                      .addNumericRefinement(S, ">=", t)
                  : e.setQueryParameters({
                      numericRefinements: F(
                        F({}, e.numericRefinements),
                        {},
                        E({}, S, {})
                      ),
                    });
              },
            }
          );
        throw new Error(Wn("The `attribute` option is required."));
        function s(e, t) {
          var n = y(e) === Number(t),
            e = e.resetPage().removeNumericRefinement(S);
          return n
            ? e
            : e
                .addNumericRefinement(S, "<=", _)
                .addNumericRefinement(S, ">=", Number(t));
        }
      }
    );
  }
  var Mn = l({ name: "related-products", connector: !0 }),
    Hn = l({ name: "search-box", connector: !0 }),
    An = l({ name: "sort-by", connector: !0 }),
    Wn = l({ name: "rating-menu", connector: !0 }),
    Dn = "ais.ratingMenu";
  function $n(r) {
    var e = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : R;
    return (
      f(r, Qn()),
      function (n) {
        return {
          $$type: "ais.stats",
          init: function (e) {
            var t = e.instantSearchInstance;
            r(
              F(
                F({}, this.getWidgetRenderState(e)),
                {},
                { instantSearchInstance: t }
              ),
              !0
            );
          },
          render: function (e) {
            var t = e.instantSearchInstance;
            r(
              F(
                F({}, this.getWidgetRenderState(e)),
                {},
                { instantSearchInstance: t }
              ),
              !1
            );
          },
          dispose: function () {
            e();
          },
          getRenderState: function (e, t) {
            return F(F({}, e), {}, { stats: this.getWidgetRenderState(t) });
          },
          getWidgetRenderState: function (e) {
            var t = e.results,
              e = e.state;
            return t
              ? {
                  hitsPerPage: t.hitsPerPage,
                  nbHits: t.nbHits,
                  nbSortedHits: t.nbSortedHits,
                  areHitsSorted:
                    void 0 !== t.appliedRelevancyStrictness &&
                    0 < t.appliedRelevancyStrictness &&
                    t.nbSortedHits !== t.nbHits,
                  nbPages: t.nbPages,
                  page: t.page,
                  processingTimeMS: t.processingTimeMS,
                  query: t.query,
                  widgetParams: n,
                }
              : {
                  hitsPerPage: e.hitsPerPage,
                  nbHits: 0,
                  nbSortedHits: void 0,
                  areHitsSorted: !1,
                  nbPages: 0,
                  page: e.page || 0,
                  processingTimeMS: -1,
                  query: e.query || "",
                  widgetParams: n,
                };
          },
        };
      }
    );
  }
  function Bn(n) {
    var r = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : R;
    return (
      f(n, Vn()),
      function (g) {
        var v,
          y,
          b,
          R,
          S,
          e = g || {},
          _ = e.attribute,
          t = e.on,
          e = e.off;
        if (_)
          return (
            (v = void 0 !== e),
            (y = at(void 0 === t || t).map(_e)),
            (b = v ? at(e).map(_e) : void 0),
            (S = function (t, e) {
              var n = e.state,
                r = e.createURL,
                i = e.getWidgetUiState,
                a = e.helper;
              return function () {
                n = n.resetPage();
                var e = t ? y : b,
                  e =
                    (e &&
                      e.forEach(function (e) {
                        n = n.removeDisjunctiveFacetRefinement(_, e);
                      }),
                    t ? b : y);
                return (
                  e &&
                    e.forEach(function (e) {
                      n = n.addDisjunctiveFacetRefinement(_, e);
                    }),
                  r(function (e) {
                    return i(e, { searchParameters: n, helper: a });
                  })
                );
              };
            }),
            {
              $$type: Kn,
              init: function (e) {
                var t = e.instantSearchInstance;
                n(
                  F(
                    F({}, this.getWidgetRenderState(e)),
                    {},
                    { instantSearchInstance: t }
                  ),
                  !0
                );
              },
              render: function (e) {
                var t = e.instantSearchInstance;
                n(
                  F(
                    F({}, this.getWidgetRenderState(e)),
                    {},
                    { instantSearchInstance: t }
                  ),
                  !1
                );
              },
              dispose: function (e) {
                e = e.state;
                return r(), e.removeDisjunctiveFacet(_);
              },
              getRenderState: function (e, t) {
                return F(
                  F({}, e),
                  {},
                  {
                    toggleRefinement: F(
                      F({}, e.toggleRefinement),
                      {},
                      E({}, _, this.getWidgetRenderState(t))
                    ),
                  }
                );
              },
              getWidgetRenderState: function (e) {
                var n,
                  t,
                  o,
                  c,
                  u,
                  l,
                  r,
                  i = e.state,
                  a = e.helper,
                  s = e.results,
                  d = e.createURL,
                  e = e.instantSearchInstance,
                  h = s
                    ? y.every(function (e) {
                        return i.isDisjunctiveFacetRefined(_, e);
                      })
                    : y.every(function (e) {
                        return i.isDisjunctiveFacetRefined(_, e);
                      }),
                  f = { isRefined: h, count: 0 },
                  m = { isRefined: v && !h, count: 0 },
                  p =
                    (s &&
                      ((p = at(b || !1)),
                      (n = s.getFacetValues(_, {}) || []),
                      (t = y
                        .map(function (t) {
                          return we(n, function (e) {
                            return e.escapedValue === _e(String(t));
                          });
                        })
                        .filter(function (e) {
                          return void 0 !== e;
                        })),
                      (p = v
                        ? p
                            .map(function (t) {
                              return we(n, function (e) {
                                return e.escapedValue === _e(String(t));
                              });
                            })
                            .filter(function (e) {
                              return void 0 !== e;
                            })
                        : []),
                      (f = {
                        isRefined:
                          !!t.length &&
                          t.every(function (e) {
                            return e.isRefined;
                          }),
                        count:
                          t.reduce(function (e, t) {
                            return e + t.count;
                          }, 0) || null,
                      }),
                      (m = {
                        isRefined:
                          !!p.length &&
                          p.every(function (e) {
                            return e.isRefined;
                          }),
                        count:
                          p.reduce(function (e, t) {
                            return e + t.count;
                          }, 0) ||
                          n.reduce(function (e, t) {
                            return e + t.count;
                          }, 0),
                      })),
                    R ||
                      ((o = (t = {
                        instantSearchInstance: e,
                        attribute: _,
                        on: y,
                        helper: a,
                      }).instantSearchInstance),
                      (c = t.helper),
                      (u = t.attribute),
                      (l = t.on),
                      (R = function () {
                        for (
                          var e,
                            t,
                            n,
                            r,
                            i = arguments.length,
                            a = new Array(i),
                            s = 0;
                          s < i;
                          s++
                        )
                          a[s] = arguments[s];
                        1 === a.length
                          ? o.sendEventToInsights(a[0])
                          : ((e = a[1]),
                            (t = void 0 === (t = a[2]) ? "Filter Applied" : t),
                            (n = (r = k(a[0].split(":"), 2))[0]),
                            (r = r[1]),
                            "click" !== n ||
                              void 0 === l ||
                              e ||
                              o.sendEventToInsights({
                                insightsMethod: "clickedFilters",
                                widgetType: Kn,
                                eventType: n,
                                eventModifier: r,
                                payload: {
                                  eventName: t,
                                  index: c.getIndex(),
                                  filters: l.map(function (e) {
                                    return "".concat(u, ":").concat(e);
                                  }),
                                },
                                attribute: u,
                              }));
                      })),
                    h ? m : f);
                return {
                  value: {
                    name: _,
                    isRefined: h,
                    count: s ? p.count : null,
                    onFacetValue: f,
                    offFacetValue: m,
                  },
                  createURL: S(h, {
                    state: i,
                    createURL: d,
                    helper: a,
                    getWidgetUiState: this.getWidgetUiState,
                  }),
                  sendEvent: R,
                  canRefine: Boolean(s ? p.count : null),
                  refine:
                    ((r = a),
                    function () {
                      var e = (
                        0 < arguments.length && void 0 !== arguments[0]
                          ? arguments[0]
                          : { isRefined: !1 }
                      ).isRefined;
                      e
                        ? (y.forEach(function (e) {
                            return r.removeDisjunctiveFacetRefinement(_, e);
                          }),
                          v &&
                            b.forEach(function (e) {
                              return r.addDisjunctiveFacetRefinement(_, e);
                            }))
                        : (R("click:internal", e),
                          v &&
                            b.forEach(function (e) {
                              return r.removeDisjunctiveFacetRefinement(_, e);
                            }),
                          y.forEach(function (e) {
                            return r.addDisjunctiveFacetRefinement(_, e);
                          })),
                        r.search();
                    }),
                  widgetParams: g,
                };
              },
              getWidgetUiState: function (e, t) {
                var n = t.searchParameters,
                  t =
                    y &&
                    y.every(function (e) {
                      return n.isDisjunctiveFacetRefined(_, e);
                    });
                return t
                  ? F(
                      F({}, e),
                      {},
                      { toggle: F(F({}, e.toggle), {}, E({}, _, t)) }
                    )
                  : (null != (t = e.toggle) && delete t[_], e);
              },
              getWidgetSearchParameters: function (e, t) {
                var n,
                  t = t.uiState;
                return e.isHierarchicalFacet(_) || e.isConjunctiveFacet(_)
                  ? e
                  : ((n = e
                      .addDisjunctiveFacet(_)
                      .removeDisjunctiveFacetRefinement(_)),
                    Boolean(t.toggle && t.toggle[_])
                      ? (y &&
                          y.forEach(function (e) {
                            n = n.addDisjunctiveFacetRefinement(_, e);
                          }),
                        n)
                      : v
                      ? (b &&
                          b.forEach(function (e) {
                            n = n.addDisjunctiveFacetRefinement(_, e);
                          }),
                        n)
                      : n.setQueryParameters({
                          disjunctiveFacetsRefinements: F(
                            F({}, e.disjunctiveFacetsRefinements),
                            {},
                            E({}, _, [])
                          ),
                        }));
              },
            }
          );
        throw new Error(Vn("The `attribute` option is required."));
      }
    );
  }
  function Un(d) {
    var h = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : R;
    return (
      f(d, zn()),
      function (t) {
        var e = t || {},
          n = e.facetName,
          r = e.facetValue,
          i = e.limit,
          a = e.threshold,
          s = e.fallbackParameters,
          o = e.queryParameters,
          c = e.escapeHTML,
          u = void 0 === c || c,
          c = e.transformItems,
          l =
            void 0 === c
              ? function (e) {
                  return e;
                }
              : c;
        if ((n && !r) || (!n && r))
          throw new Error(
            zn(
              "When you provide facetName (received type "
                .concat(
                  Y(n),
                  "), you must also provide facetValue (received type "
                )
                .concat(Y(r), ").")
            )
          );
        return {
          dependsOn: "recommend",
          $$type: "ais.trendingItems",
          init: function (e) {
            d(
              F(
                F({}, this.getWidgetRenderState(e)),
                {},
                { instantSearchInstance: e.instantSearchInstance }
              ),
              !0
            );
          },
          render: function (e) {
            var t = this.getWidgetRenderState(e);
            d(
              F(
                F({}, t),
                {},
                { instantSearchInstance: e.instantSearchInstance }
              ),
              !1
            );
          },
          getRenderState: function (e) {
            return e;
          },
          getWidgetRenderState: function (e) {
            e = e.results;
            return null == e
              ? { items: [], widgetParams: t }
              : (u && 0 < e.hits.length && (e.hits = ue(e.hits)),
                { items: l(e.hits, { results: e }), widgetParams: t });
          },
          dispose: function (e) {
            e = e.recommendState;
            return h(), e.removeParams(this.$$id);
          },
          getWidgetParameters: function (e) {
            return e
              .removeParams(this.$$id)
              .addTrendingItems({
                facetName: n,
                facetValue: r,
                maxRecommendations: i,
                threshold: a,
                fallbackParameters: F(F({}, s), u ? O : {}),
                queryParameters: F(F({}, o), u ? O : {}),
                $$id: this.$$id,
              });
          },
        };
      }
    );
  }
  function qn(u) {
    var l = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : R,
      d = (f(u, Jn()), {});
    return function (s) {
      var n,
        e = s || {},
        r = e.attributes,
        t = e.separator,
        i = void 0 === t ? " > " : t,
        t = e.rootPath,
        a = void 0 === t ? null : t,
        t = e.transformItems,
        o =
          void 0 === t
            ? function (e) {
                return e;
              }
            : t;
      if (r && Array.isArray(r) && 0 !== r.length)
        return (
          (n = k(r, 1)[0]),
          {
            $$type: "ais.breadcrumb",
            init: function (e) {
              u(
                F(
                  F({}, this.getWidgetRenderState(e)),
                  {},
                  { instantSearchInstance: e.instantSearchInstance }
                ),
                !0
              );
            },
            render: function (e) {
              u(
                F(
                  F({}, this.getWidgetRenderState(e)),
                  {},
                  { instantSearchInstance: e.instantSearchInstance }
                ),
                !1
              );
            },
            dispose: function () {
              l();
            },
            getRenderState: function (e, t) {
              return F(
                F({}, e),
                {},
                {
                  breadcrumb: F(
                    F({}, e.breadcrumb),
                    {},
                    E({}, n, this.getWidgetRenderState(t))
                  ),
                }
              );
            },
            getWidgetRenderState: function (e) {
              var n = this,
                r = e.helper,
                i = e.createURL,
                t = e.results,
                e = e.state;
              var a,
                e =
                  t && 0 !== e.hierarchicalFacets.length
                    ? ((e = k(e.hierarchicalFacets, 1)[0].name),
                      (e =
                        (e = t.getFacetValues(e, {})) &&
                        !Array.isArray(e) &&
                        e.data
                          ? e.data
                          : []),
                      o(
                        (a = (function n(e) {
                          return e.reduce(function (e, t) {
                            return (e =
                              t.isRefined &&
                              (e.push({ label: t.name, value: t.escapedValue }),
                              Array.isArray(t.data))
                                ? e.concat(n(t.data))
                                : e);
                          }, []);
                        })(e)).map(function (e, t) {
                          return {
                            label: e.label,
                            value: t + 1 === a.length ? null : a[t + 1].value,
                          };
                        }),
                        { results: t }
                      ))
                    : [];
              return (
                d.createURL ||
                  (d.createURL = function (t) {
                    return i(function (e) {
                      return n.getWidgetUiState(e, {
                        searchParameters: c(r.state, t),
                        helper: r,
                      });
                    });
                  }),
                d.refine ||
                  (d.refine = function (e) {
                    r.setState(c(r.state, e)).search();
                  }),
                {
                  canRefine: 0 < e.length,
                  createURL: d.createURL,
                  items: e,
                  refine: d.refine,
                  widgetParams: s,
                }
              );
            },
            getWidgetUiState: function (e, t) {
              var t = t.searchParameters.getHierarchicalFacetBreadcrumb(n);
              return (
                (e = F(
                  F({}, e),
                  {},
                  {
                    hierarchicalMenu: F(
                      F({}, e.hierarchicalMenu),
                      {},
                      E({}, n, t)
                    ),
                  }
                )),
                (t = n),
                e.hierarchicalMenu &&
                  ((e.hierarchicalMenu[t] && e.hierarchicalMenu[t].length) ||
                    delete e.hierarchicalMenu[t],
                  0 === Object.keys(e.hierarchicalMenu).length) &&
                  delete e.hierarchicalMenu,
                e
              );
            },
            getWidgetSearchParameters: function (e, t) {
              (t = t.uiState),
                (t = t.hierarchicalMenu && t.hierarchicalMenu[n]);
              if (e.isConjunctiveFacet(n) || e.isDisjunctiveFacet(n)) return e;
              e.isHierarchicalFacet(n) && e.getHierarchicalFacetByName(n);
              e = e
                .removeHierarchicalFacet(n)
                .addHierarchicalFacet({
                  name: n,
                  attributes: r,
                  separator: i,
                  rootPath: a,
                });
              return t
                ? e.addHierarchicalFacetRefinement(n, t.join(i))
                : e.setQueryParameters({
                    hierarchicalFacetsRefinements: F(
                      F({}, e.hierarchicalFacetsRefinements),
                      {},
                      E({}, n, [])
                    ),
                  });
            },
          }
        );
      throw new Error(
        Jn("The `attributes` option expects an array of strings.")
      );
      function c(e, t) {
        return t
          ? e.resetPage().toggleFacetRefinement(n, t)
          : 0 === (t = e.getHierarchicalFacetBreadcrumb(n)).length
          ? e
          : e.resetPage().toggleFacetRefinement(n, t[0]);
      }
    };
  }
  var Qn = l({ name: "stats", connector: !0 }),
    Vn = l({ name: "toggle-refinement", connector: !0 }),
    Kn = "ais.toggleRefinement",
    zn = l({ name: "trending-items", connector: !0 }),
    Jn = l({ name: "breadcrumb", connector: !0 });
  var Zn = l({ name: "geo-search", connector: !0 });
  function Yn(e) {
    return e.insideBoundingBox || "";
  }
  function Xn(e, t) {
    return e.setQueryParameter("insideBoundingBox", t);
  }
  function Gn(g) {
    var n = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : R;
    return (
      f(g, Zn()),
      function (o) {
        function c(e) {
          if (e.aroundLatLng) {
            var e = e.aroundLatLng,
              t = e.match(Pe);
            if (t) return { lat: parseFloat(t[1]), lng: parseFloat(t[2]) };
            throw new Error(
              'Invalid value for "aroundLatLng" parameter: "'.concat(e, '"')
            );
          }
        }
        function u() {
          return p.internalToggleRefineOnMapMove();
        }
        function a(e, t) {
          return function () {
            (p.isRefineOnMapMove = !p.isRefineOnMapMove), t(e);
          };
        }
        function l() {
          return p.isRefineOnMapMove;
        }
        function d() {
          return p.internalSetMapMoveSinceLastRefine();
        }
        function s(t, n) {
          return function () {
            var e = !0 !== p.hasMapMoveSinceLastRefine;
            (p.hasMapMoveSinceLastRefine = !0), e && n(t);
          };
        }
        function h() {
          return p.hasMapMoveSinceLastRefine;
        }
        var f,
          e = o || {},
          t = e.enableRefineOnMapMove,
          e = e.transformItems,
          m =
            void 0 === e
              ? function (e) {
                  return e;
                }
              : e,
          p = {
            isRefineOnMapMove: void 0 === t || t,
            hasMapMoveSinceLastRefine: !1,
            lastRefinePosition: "",
            lastRefineBoundingBox: "",
            internalToggleRefineOnMapMove: R,
            internalSetMapMoveSinceLastRefine: R,
          };
        return {
          $$type: tr,
          init: function (e) {
            var t = e.instantSearchInstance;
            (p.internalToggleRefineOnMapMove = a(e, R)),
              (p.internalSetMapMoveSinceLastRefine = s(e, R)),
              g(
                F(
                  F({}, this.getWidgetRenderState(e)),
                  {},
                  { instantSearchInstance: t }
                ),
                !0
              );
          },
          render: function (e) {
            var t = e.helper,
              n = e.instantSearchInstance,
              t = t.state,
              r =
                Boolean(t.aroundLatLng) &&
                Boolean(p.lastRefinePosition) &&
                t.aroundLatLng !== p.lastRefinePosition,
              i =
                !t.insideBoundingBox &&
                Boolean(p.lastRefineBoundingBox) &&
                t.insideBoundingBox !== p.lastRefineBoundingBox,
              r =
                ((r || i) && (p.hasMapMoveSinceLastRefine = !1),
                (p.lastRefinePosition = t.aroundLatLng || ""),
                (p.lastRefineBoundingBox = Yn(t)),
                (p.internalToggleRefineOnMapMove = a(
                  e,
                  this.render.bind(this)
                )),
                (p.internalSetMapMoveSinceLastRefine = s(
                  e,
                  this.render.bind(this)
                )),
                this.getWidgetRenderState(e));
            f("view:internal", r.items),
              g(F(F({}, r), {}, { instantSearchInstance: n }), !1);
          },
          getWidgetRenderState: function (e) {
            var t,
              n,
              r,
              i = e.helper,
              a = e.results,
              e = e.instantSearchInstance,
              s = i.state,
              a = a
                ? m(
                    a.hits.filter(function (e) {
                      return e._geoloc;
                    }),
                    { results: a }
                  )
                : [];
            return (
              (f =
                f ||
                pe({
                  instantSearchInstance: e,
                  getIndex: function () {
                    return i.getIndex();
                  },
                  widgetType: tr,
                })),
              {
                items: a,
                position: c(s),
                currentRefinement:
                  (e = s).insideBoundingBox && Ne(e.insideBoundingBox),
                refine: function (e) {
                  var t = e.northEast,
                    e = e.southWest,
                    t = [t.lat, t.lng, e.lat, e.lng].join();
                  r.setState(Xn(r.state, t).resetPage()).search(),
                    (p.hasMapMoveSinceLastRefine = !1),
                    (p.lastRefineBoundingBox = t);
                },
                sendEvent: f,
                clearMapRefinement:
                  ((n = r = i),
                  function () {
                    n.setQueryParameter("insideBoundingBox", void 0).search();
                  }),
                isRefinedWithMap:
                  ((t = s),
                  function () {
                    return Boolean(t.insideBoundingBox);
                  }),
                toggleRefineOnMapMove: u,
                isRefineOnMapMove: l,
                setMapMoveSinceLastRefine: d,
                hasMapMoveSinceLastRefine: h,
                widgetParams: o,
              }
            );
          },
          getRenderState: function (e, t) {
            return F(F({}, e), {}, { geoSearch: this.getWidgetRenderState(t) });
          },
          dispose: function (e) {
            e = e.state;
            return n(), e.setQueryParameter("insideBoundingBox", void 0);
          },
          getWidgetUiState: function (e, t) {
            t = Yn(t.searchParameters);
            return !t || (e && e.geoSearch && e.geoSearch.boundingBox === t)
              ? e
              : F(F({}, e), {}, { geoSearch: { boundingBox: t } });
          },
          getWidgetSearchParameters: function (e, t) {
            t = t.uiState;
            return t && t.geoSearch
              ? Xn(e, t.geoSearch.boundingBox)
              : e.setQueryParameter("insideBoundingBox", void 0);
          },
        };
      }
    );
  }
  function er(r) {
    var i = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : R,
      a =
        (f(r, nr()),
        "https://www.algolia.com/?utm_source=instantsearch.js&utm_medium=website&" +
          "utm_content=".concat(
            it(
              function (e) {
                return (
                  (null == (e = e.window.location) ? void 0 : e.hostname) || ""
                );
              },
              {
                fallback: function () {
                  return "";
                },
              }
            ),
            "&"
          ) +
          "utm_campaign=poweredby");
    return function (e) {
      var t = (e || {}).url,
        n = void 0 === t ? a : t;
      return {
        $$type: "ais.poweredBy",
        init: function (e) {
          var t = e.instantSearchInstance;
          r(
            F(
              F({}, this.getWidgetRenderState(e)),
              {},
              { instantSearchInstance: t }
            ),
            !0
          );
        },
        render: function (e) {
          var t = e.instantSearchInstance;
          r(
            F(
              F({}, this.getWidgetRenderState(e)),
              {},
              { instantSearchInstance: t }
            ),
            !1
          );
        },
        getRenderState: function (e, t) {
          return F(F({}, e), {}, { poweredBy: this.getWidgetRenderState(t) });
        },
        getWidgetRenderState: function () {
          return { url: n, widgetParams: e };
        },
        dispose: function () {
          i();
        },
      };
    };
  }
  var tr = "ais.geoSearch",
    nr = l({ name: "powered-by", connector: !0 });
  function n() {
    (this._events = this._events || {}),
      (this._maxListeners = this._maxListeners || void 0);
  }
  var rr = n;
  function ir(e) {
    return "function" == typeof e;
  }
  function ar(e) {
    return "object" == typeof e && null !== e;
  }
  function sr(e) {
    return void 0 === e;
  }
  (n.prototype._events = void 0),
    (n.prototype._maxListeners = void 0),
    (n.defaultMaxListeners = 10),
    (n.prototype.setMaxListeners = function (e) {
      if ("number" != typeof e || e < 0 || isNaN(e))
        throw TypeError("n must be a positive number");
      return (this._maxListeners = e), this;
    }),
    (n.prototype.emit = function (e) {
      var t, n, r, i, a, s, o;
      if (
        (this._events || (this._events = {}), "error" === e) &&
        (!this._events.error ||
          (ar(this._events.error) && !this._events.error.length))
      )
        throw (o = arguments[1]) instanceof Error
          ? o
          : (((s = new Error(
              'Uncaught, unspecified "error" event. (' + o + ")"
            )).context = o),
            s);
      if (sr((t = this._events[e]))) return !1;
      if (ir(t))
        switch (arguments.length) {
          case 1:
            t.call(this);
            break;
          case 2:
            t.call(this, arguments[1]);
            break;
          case 3:
            t.call(this, arguments[1], arguments[2]);
            break;
          default:
            (r = Array.prototype.slice.call(arguments, 1)), t.apply(this, r);
        }
      else if (ar(t))
        for (
          r = Array.prototype.slice.call(arguments, 1),
            n = (a = t.slice()).length,
            i = 0;
          i < n;
          i++
        )
          a[i].apply(this, r);
      return !0;
    }),
    (n.prototype.on = n.prototype.addListener =
      function (e, t) {
        if (ir(t))
          return (
            this._events || (this._events = {}),
            this._events.newListener &&
              this.emit("newListener", e, ir(t.listener) ? t.listener : t),
            this._events[e]
              ? ar(this._events[e])
                ? this._events[e].push(t)
                : (this._events[e] = [this._events[e], t])
              : (this._events[e] = t),
            ar(this._events[e]) &&
              !this._events[e].warned &&
              (t = sr(this._maxListeners)
                ? n.defaultMaxListeners
                : this._maxListeners) &&
              0 < t &&
              this._events[e].length > t &&
              ((this._events[e].warned = !0),
              console.error(
                "(node) warning: possible EventEmitter memory leak detected. %d listeners added. Use emitter.setMaxListeners() to increase limit.",
                this._events[e].length
              ),
              "function" == typeof console.trace) &&
              console.trace(),
            this
          );
        throw TypeError("listener must be a function");
      }),
    (n.prototype.once = function (e, t) {
      var n;
      if (ir(t)) return (n = !1), (r.listener = t), this.on(e, r), this;
      throw TypeError("listener must be a function");
      function r() {
        this.removeListener(e, r), n || ((n = !0), t.apply(this, arguments));
      }
    }),
    (n.prototype.removeListener = function (e, t) {
      var n, r, i, a;
      if (!ir(t)) throw TypeError("listener must be a function");
      if (this._events && this._events[e])
        if (
          ((i = (n = this._events[e]).length),
          (r = -1),
          n === t || (ir(n.listener) && n.listener === t))
        )
          delete this._events[e],
            this._events.removeListener && this.emit("removeListener", e, t);
        else if (ar(n)) {
          for (a = i; 0 < a--; )
            if (n[a] === t || (n[a].listener && n[a].listener === t)) {
              r = a;
              break;
            }
          if (r < 0) return this;
          1 === n.length
            ? ((n.length = 0), delete this._events[e])
            : n.splice(r, 1),
            this._events.removeListener && this.emit("removeListener", e, t);
        }
      return this;
    }),
    (n.prototype.removeAllListeners = function (e) {
      var t, n;
      if (this._events)
        if (this._events.removeListener)
          if (0 === arguments.length) {
            for (t in this._events)
              "removeListener" !== t && this.removeAllListeners(t);
            this.removeAllListeners("removeListener"), (this._events = {});
          } else {
            if (ir((n = this._events[e]))) this.removeListener(e, n);
            else if (n)
              for (; n.length; ) this.removeListener(e, n[n.length - 1]);
            delete this._events[e];
          }
        else
          0 === arguments.length
            ? (this._events = {})
            : this._events[e] && delete this._events[e];
      return this;
    }),
    (n.prototype.listeners = function (e) {
      e =
        this._events && this._events[e]
          ? ir(this._events[e])
            ? [this._events[e]]
            : this._events[e].slice()
          : [];
      return e;
    }),
    (n.prototype.listenerCount = function (e) {
      if (this._events) {
        e = this._events[e];
        if (ir(e)) return 1;
        if (e) return e.length;
      }
      return 0;
    }),
    (n.listenerCount = function (e, t) {
      return e.listenerCount(t);
    });
  var e = function (e, t) {
    e.prototype = Object.create(t.prototype, {
      constructor: { value: e, enumerable: !1, writable: !0, configurable: !0 },
    });
  };
  function or(e, t, n) {
    (this.main = e),
      (this.fn = t),
      (this.recommendFn = n),
      (this.lastResults = null),
      (this.lastRecommendResults = null);
  }
  e(or, rr),
    (or.prototype.detach = function () {
      this.removeAllListeners(), this.main.detachDerivedHelper(this);
    }),
    (or.prototype.getModifiedState = function (e) {
      return this.fn(e);
    }),
    (or.prototype.getModifiedRecommendState = function (e) {
      return this.recommendFn(e);
    });
  var cr = or;
  var ur = function (e) {
      return "string" != typeof e ? e : String(e).replace(/^-/, "\\-");
    },
    lr = function (e) {
      return "string" != typeof e ? e : e.replace(/^\\-/, "-");
    };
  function dr(e) {
    return (
      "function" == typeof e ||
      Array.isArray(e) ||
      "[object Object]" === Object.prototype.toString.call(e)
    );
  }
  function hr(e, t) {
    var n, r;
    if (e !== t)
      for (var i in t)
        Object.prototype.hasOwnProperty.call(t, i) &&
          "__proto__" !== i &&
          "constructor" !== i &&
          ((n = t[i]),
          (void 0 !== (r = e[i]) && void 0 === n) ||
            (dr(r) && dr(n)
              ? (e[i] = hr(r, n))
              : (e[i] =
                  "object" == typeof (r = n) && null !== r
                    ? hr(Array.isArray(r) ? [] : {}, r)
                    : r)));
    return e;
  }
  var fr = function (e) {
    dr(e) || (e = {});
    for (var t = 1, n = arguments.length; t < n; t++) {
      var r = arguments[t];
      dr(r) && hr(e, r);
    }
    return e;
  };
  var mr = function (e) {
    return e && 0 < Object.keys(e).length;
  };
  var pr = function (e, t) {
    if (null === e) return {};
    for (var n, r = {}, i = Object.keys(e), a = 0; a < i.length; a++)
      (n = i[a]), 0 <= t.indexOf(n) || (r[n] = e[n]);
    return r;
  };
  function gr(e) {
    this.params = (e = e || {}).params || [];
  }
  gr.prototype = {
    constructor: gr,
    addParams: function (e) {
      var t = this.params.slice();
      return t.push(e), new gr({ params: t });
    },
    removeParams: function (t) {
      return new gr({
        params: this.params.filter(function (e) {
          return e.$$id !== t;
        }),
      });
    },
    addFrequentlyBoughtTogether: function (e) {
      return this.addParams(Object.assign({}, e, { model: "bought-together" }));
    },
    addRelatedProducts: function (e) {
      return this.addParams(
        Object.assign({}, e, { model: "related-products" })
      );
    },
    addTrendingItems: function (e) {
      return this.addParams(Object.assign({}, e, { model: "trending-items" }));
    },
    addTrendingFacets: function (e) {
      return this.addParams(Object.assign({}, e, { model: "trending-facets" }));
    },
    addLookingSimilar: function (e) {
      return this.addParams(Object.assign({}, e, { model: "looking-similar" }));
    },
    _buildQueries: function (t, n) {
      return this.params
        .filter(function (e) {
          return void 0 === n[e.$$id];
        })
        .map(function (e) {
          e = Object.assign({}, e, {
            indexName: t,
            threshold: e.threshold || 0,
          });
          return delete e.$$id, e;
        });
    },
  };
  var vr = gr;
  function yr(e, t) {
    (this._state = e), (this._rawResults = {});
    var n = this;
    e.params.forEach(function (e) {
      e = e.$$id;
      (n[e] = t[e]), (n._rawResults[e] = t[e]);
    });
  }
  yr.prototype = { constructor: yr };
  var br = yr;
  function Rr(n) {
    return Object.keys(n)
      .sort()
      .reduce(function (e, t) {
        return (e[t] = n[t]), e;
      }, {});
  }
  function Sr() {
    return Array.prototype.slice.call(arguments).reduceRight(function (t, n) {
      return (
        Object.keys(Object(n)).forEach(function (e) {
          void 0 !== n[e] && (void 0 !== t[e] && delete t[e], (t[e] = n[e]));
        }),
        t
      );
    }, {});
  }
  var d = {
      _getQueries: function (o, c) {
        var u = [];
        return (
          u.push({ indexName: o, params: d._getHitsSearchParams(c) }),
          c.getRefinedDisjunctiveFacets().forEach(function (e) {
            u.push({
              indexName: o,
              params: d._getDisjunctiveFacetSearchParams(c, e),
            });
          }),
          c.getRefinedHierarchicalFacets().forEach(function (e) {
            var a,
              s = c.getHierarchicalFacetByName(e),
              e = c.getHierarchicalRefinement(e),
              r = c._getHierarchicalFacetSeparator(s);
            0 < e.length &&
              1 < e[0].split(r).length &&
              (a = e[0]
                .split(r)
                .slice(0, -1)
                .reduce(function (e, t, n) {
                  return e.concat({
                    attribute: s.attributes[n],
                    value: 0 === n ? t : [e[e.length - 1].value, t].join(r),
                  });
                }, [])).forEach(function (e, t) {
                e = d._getDisjunctiveFacetSearchParams(c, e.attribute, 0 === t);
                function r(t) {
                  return s.attributes.some(function (e) {
                    return e === t.split(":")[0];
                  });
                }
                var n = (e.facetFilters || []).reduce(function (e, t) {
                    var n;
                    return (
                      Array.isArray(t) &&
                        0 <
                          (n = t.filter(function (e) {
                            return !r(e);
                          })).length &&
                        e.push(n),
                      "string" != typeof t || r(t) || e.push(t),
                      e
                    );
                  }, []),
                  i = a[t - 1];
                0 < t
                  ? (e.facetFilters = n.concat(i.attribute + ":" + i.value))
                  : 0 < n.length
                  ? (e.facetFilters = n)
                  : delete e.facetFilters,
                  u.push({ indexName: o, params: e });
              });
          }),
          u
        );
      },
      _getHitsSearchParams: function (e) {
        var t = e.facets
            .concat(e.disjunctiveFacets)
            .concat(d._getHitsHierarchicalFacetsAttributes(e))
            .sort(),
          n = d._getFacetFilters(e),
          r = d._getNumericFilters(e),
          i = d._getTagFilters(e),
          a = {};
        return (
          0 < t.length && (a.facets = -1 < t.indexOf("*") ? ["*"] : t),
          0 < i.length && (a.tagFilters = i),
          0 < n.length && (a.facetFilters = n),
          0 < r.length && (a.numericFilters = r),
          Rr(fr({}, e.getQueryParams(), a))
        );
      },
      _getDisjunctiveFacetSearchParams: function (e, t, n) {
        var r = d._getFacetFilters(e, t, n),
          i = d._getNumericFilters(e, t),
          a = d._getTagFilters(e),
          s = { hitsPerPage: 0, page: 0, analytics: !1, clickAnalytics: !1 },
          a =
            (0 < a.length && (s.tagFilters = a),
            e.getHierarchicalFacetByName(t));
        return (
          (s.facets = a
            ? d._getDisjunctiveHierarchicalFacetAttribute(e, a, n)
            : t),
          0 < i.length && (s.numericFilters = i),
          0 < r.length && (s.facetFilters = r),
          Rr(fr({}, e.getQueryParams(), s))
        );
      },
      _getNumericFilters: function (e, i) {
        var a;
        return (
          e.numericFilters ||
          ((a = []),
          Object.keys(e.numericRefinements).forEach(function (r) {
            var t = e.numericRefinements[r] || {};
            Object.keys(t).forEach(function (n) {
              var e = t[n] || [];
              i !== r &&
                e.forEach(function (e) {
                  var t;
                  Array.isArray(e)
                    ? ((t = e.map(function (e) {
                        return r + n + e;
                      })),
                      a.push(t))
                    : a.push(r + n + e);
                });
            });
          }),
          a)
        );
      },
      _getTagFilters: function (e) {
        return e.tagFilters || e.tagRefinements.join(",");
      },
      _getFacetFilters: function (s, o, c) {
        var u = [],
          e = s.facetsRefinements || {},
          n =
            (Object.keys(e)
              .sort()
              .forEach(function (t) {
                (e[t] || [])
                  .slice()
                  .sort()
                  .forEach(function (e) {
                    u.push(t + ":" + e);
                  });
              }),
            s.facetsExcludes || {}),
          r =
            (Object.keys(n)
              .sort()
              .forEach(function (t) {
                (n[t] || []).sort().forEach(function (e) {
                  u.push(t + ":-" + e);
                });
              }),
            s.disjunctiveFacetsRefinements || {}),
          l =
            (Object.keys(r)
              .sort()
              .forEach(function (t) {
                var n,
                  e = r[t] || [];
                t !== o &&
                  e &&
                  0 !== e.length &&
                  ((n = []),
                  e
                    .slice()
                    .sort()
                    .forEach(function (e) {
                      n.push(t + ":" + e);
                    }),
                  u.push(n));
              }),
            s.hierarchicalFacetsRefinements || {});
        return (
          Object.keys(l)
            .sort()
            .forEach(function (e) {
              var t = (l[e] || [])[0];
              if (void 0 !== t) {
                var n,
                  r = s.getHierarchicalFacetByName(e),
                  i = s._getHierarchicalFacetSeparator(r),
                  a = s._getHierarchicalRootPath(r);
                if (o === e) {
                  if (
                    -1 === t.indexOf(i) ||
                    (!a && !0 === c) ||
                    (a && a.split(i).length === t.split(i).length)
                  )
                    return;
                  t = a
                    ? ((n = a.split(i).length - 1), a)
                    : ((n = t.split(i).length - 2),
                      t.slice(0, t.lastIndexOf(i)));
                } else n = t.split(i).length - 1;
                (e = r.attributes[n]) && u.push([e + ":" + t]);
              }
            }),
          u
        );
      },
      _getHitsHierarchicalFacetsAttributes: function (i) {
        return i.hierarchicalFacets.reduce(function (e, t) {
          var n,
            r = i.getHierarchicalRefinement(t.name)[0];
          return r
            ? ((n = i._getHierarchicalFacetSeparator(t)),
              (r = r.split(n).length),
              (n = t.attributes.slice(0, r + 1)),
              e.concat(n))
            : (e.push(t.attributes[0]), e);
        }, []);
      },
      _getDisjunctiveHierarchicalFacetAttribute: function (e, t, n) {
        var r,
          i = e._getHierarchicalFacetSeparator(t);
        return !0 === n
          ? ((n = 0),
            (r = e._getHierarchicalRootPath(t)) && (n = r.split(i).length),
            [t.attributes[n]])
          : ((r =
              (e.getHierarchicalRefinement(t.name)[0] || "").split(i).length -
              1),
            t.attributes.slice(0, 1 + r));
      },
      getSearchForFacetQuery: function (e, t, n, r) {
        (r = r.isDisjunctiveFacet(e) ? r.clearRefinements(e) : r),
          (t = { facetQuery: t, facetName: e });
        return (
          "number" == typeof n && (t.maxFacetHits = n),
          Rr(fr({}, d._getHitsSearchParams(r), t))
        );
      },
    },
    _r = d,
    p = function (e, t) {
      if (Array.isArray(e))
        for (var n = 0; n < e.length; n++) if (t(e[n])) return e[n];
    };
  var wr = function (n, r) {
    return n.filter(function (e, t) {
      return -1 < r.indexOf(e) && n.indexOf(e) === t;
    });
  };
  var Pr = function e(t) {
      if ("number" == typeof t) return t;
      if ("string" == typeof t) return parseFloat(t);
      if (Array.isArray(t)) return t.map(e);
      throw new Error(
        "The value should be a number, a parsable string or an array of those."
      );
    },
    Nr = {
      addRefinement: function (e, t, n) {
        var r;
        return Nr.isRefined(e, t, n)
          ? e
          : ((n = "" + n),
            (n = e[t] ? e[t].concat(n) : [n]),
            ((r = {})[t] = n),
            Sr({}, r, e));
      },
      removeRefinement: function (e, n, t) {
        var r;
        return void 0 === t
          ? Nr.clearRefinement(e, function (e, t) {
              return n === t;
            })
          : ((r = "" + t),
            Nr.clearRefinement(e, function (e, t) {
              return n === t && r === e;
            }));
      },
      toggleRefinement: function (e, t, n) {
        if (void 0 === n)
          throw new Error("toggleRefinement should be used with a value");
        return Nr.isRefined(e, t, n)
          ? Nr.removeRefinement(e, t, n)
          : Nr.addRefinement(e, t, n);
      },
      clearRefinement: function (i, a, s) {
        var o, e;
        return void 0 === a
          ? mr(i)
            ? {}
            : i
          : "string" == typeof a
          ? pr(i, [a])
          : "function" == typeof a
          ? ((o = !1),
            (e = Object.keys(i).reduce(function (e, t) {
              var n = i[t] || [],
                r = n.filter(function (e) {
                  return !a(e, t, s);
                });
              return r.length !== n.length && (o = !0), (e[t] = r), e;
            }, {})),
            o ? e : i)
          : void 0;
      },
      isRefined: function (e, t, n) {
        var r = Boolean(e[t]) && 0 < e[t].length;
        return void 0 !== n && r ? -1 !== e[t].indexOf("" + n) : r;
      },
    },
    r = Nr;
  function xr(e, n) {
    return Array.isArray(e) && Array.isArray(n)
      ? e.length === n.length &&
          e.every(function (e, t) {
            return xr(n[t], e);
          })
      : e === n;
  }
  function s(e) {
    var r = e ? s._parseNumbers(e) : {},
      i =
        (void 0 === r.userToken ||
          (null !== (e = r.userToken) && /^[a-zA-Z0-9_-]{1,64}$/.test(e)) ||
          console.warn(
            "[algoliasearch-helper] The `userToken` parameter is invalid. This can lead to wrong analytics.\n  - Format: [a-zA-Z0-9_-]{1,64}"
          ),
        (this.facets = r.facets || []),
        (this.disjunctiveFacets = r.disjunctiveFacets || []),
        (this.hierarchicalFacets = r.hierarchicalFacets || []),
        (this.facetsRefinements = r.facetsRefinements || {}),
        (this.facetsExcludes = r.facetsExcludes || {}),
        (this.disjunctiveFacetsRefinements =
          r.disjunctiveFacetsRefinements || {}),
        (this.numericRefinements = r.numericRefinements || {}),
        (this.tagRefinements = r.tagRefinements || []),
        (this.hierarchicalFacetsRefinements =
          r.hierarchicalFacetsRefinements || {}),
        this);
    Object.keys(r).forEach(function (e) {
      var t = -1 !== s.PARAMETERS.indexOf(e),
        n = void 0 !== r[e];
      !t && n && (i[e] = r[e]);
    });
  }
  (s.PARAMETERS = Object.keys(new s())),
    (s._parseNumbers = function (i) {
      var r, a;
      return i instanceof s
        ? i
        : ((r = {}),
          [
            "aroundPrecision",
            "aroundRadius",
            "getRankingInfo",
            "minWordSizefor2Typos",
            "minWordSizefor1Typo",
            "page",
            "maxValuesPerFacet",
            "distinct",
            "minimumAroundRadius",
            "hitsPerPage",
            "minProximity",
          ].forEach(function (e) {
            var t,
              n = i[e];
            "string" == typeof n &&
              ((t = parseFloat(n)), (r[e] = isNaN(t) ? n : t));
          }),
          Array.isArray(i.insideBoundingBox) &&
            (r.insideBoundingBox = i.insideBoundingBox.map(function (e) {
              return Array.isArray(e)
                ? e.map(function (e) {
                    return parseFloat(e);
                  })
                : e;
            })),
          i.numericRefinements &&
            ((a = {}),
            Object.keys(i.numericRefinements).forEach(function (n) {
              var r = i.numericRefinements[n] || {};
              (a[n] = {}),
                Object.keys(r).forEach(function (e) {
                  var t = r[e].map(function (e) {
                    return Array.isArray(e)
                      ? e.map(function (e) {
                          return "string" == typeof e ? parseFloat(e) : e;
                        })
                      : "string" == typeof e
                      ? parseFloat(e)
                      : e;
                  });
                  a[n][e] = t;
                });
            }),
            (r.numericRefinements = a)),
          fr(i, r));
    }),
    (s.make = function (e) {
      var n = new s(e);
      return (
        (e.hierarchicalFacets || []).forEach(function (e) {
          var t;
          e.rootPath &&
            0 ===
              (t = (n =
                0 < (t = n.getHierarchicalRefinement(e.name)).length &&
                0 !== t[0].indexOf(e.rootPath)
                  ? n.clearRefinements(e.name)
                  : n).getHierarchicalRefinement(e.name)).length &&
            (n = n.toggleHierarchicalFacetRefinement(e.name, e.rootPath));
        }),
        n
      );
    }),
    (s.validate = function (e, t) {
      t = t || {};
      return e.tagFilters && t.tagRefinements && 0 < t.tagRefinements.length
        ? new Error(
            "[Tags] Cannot switch from the managed tag API to the advanced API. It is probably an error, if it is really what you want, you should first clear the tags with clearTags method."
          )
        : 0 < e.tagRefinements.length && t.tagFilters
        ? new Error(
            "[Tags] Cannot switch from the advanced tag API to the managed API. It is probably an error, if it is not, you should first clear the tags with clearTags method."
          )
        : e.numericFilters && t.numericRefinements && mr(t.numericRefinements)
        ? new Error(
            "[Numeric filters] Can't switch from the advanced to the managed API. It is probably an error, if this is really what you want, you have to first clear the numeric filters."
          )
        : mr(e.numericRefinements) && t.numericFilters
        ? new Error(
            "[Numeric filters] Can't switch from the managed API to the advanced. It is probably an error, if this is really what you want, you have to first clear the numeric filters."
          )
        : null;
    }),
    (s.prototype = {
      constructor: s,
      clearRefinements: function (e) {
        e = {
          numericRefinements: this._clearNumericRefinements(e),
          facetsRefinements: r.clearRefinement(
            this.facetsRefinements,
            e,
            "conjunctiveFacet"
          ),
          facetsExcludes: r.clearRefinement(this.facetsExcludes, e, "exclude"),
          disjunctiveFacetsRefinements: r.clearRefinement(
            this.disjunctiveFacetsRefinements,
            e,
            "disjunctiveFacet"
          ),
          hierarchicalFacetsRefinements: r.clearRefinement(
            this.hierarchicalFacetsRefinements,
            e,
            "hierarchicalFacet"
          ),
        };
        return e.numericRefinements === this.numericRefinements &&
          e.facetsRefinements === this.facetsRefinements &&
          e.facetsExcludes === this.facetsExcludes &&
          e.disjunctiveFacetsRefinements ===
            this.disjunctiveFacetsRefinements &&
          e.hierarchicalFacetsRefinements === this.hierarchicalFacetsRefinements
          ? this
          : this.setQueryParameters(e);
      },
      clearTags: function () {
        return void 0 === this.tagFilters && 0 === this.tagRefinements.length
          ? this
          : this.setQueryParameters({ tagFilters: void 0, tagRefinements: [] });
      },
      setIndex: function (e) {
        return e === this.index ? this : this.setQueryParameters({ index: e });
      },
      setQuery: function (e) {
        return e === this.query ? this : this.setQueryParameters({ query: e });
      },
      setPage: function (e) {
        return e === this.page ? this : this.setQueryParameters({ page: e });
      },
      setFacets: function (e) {
        return this.setQueryParameters({ facets: e });
      },
      setDisjunctiveFacets: function (e) {
        return this.setQueryParameters({ disjunctiveFacets: e });
      },
      setHitsPerPage: function (e) {
        return this.hitsPerPage === e
          ? this
          : this.setQueryParameters({ hitsPerPage: e });
      },
      setTypoTolerance: function (e) {
        return this.typoTolerance === e
          ? this
          : this.setQueryParameters({ typoTolerance: e });
      },
      addNumericRefinement: function (e, t, n) {
        var r,
          n = Pr(n);
        return this.isNumericRefined(e, t, n)
          ? this
          : (((r = fr({}, this.numericRefinements))[e] = fr({}, r[e])),
            r[e][t]
              ? ((r[e][t] = r[e][t].slice()), r[e][t].push(n))
              : (r[e][t] = [n]),
            this.setQueryParameters({ numericRefinements: r }));
      },
      getConjunctiveRefinements: function (e) {
        return (this.isConjunctiveFacet(e) && this.facetsRefinements[e]) || [];
      },
      getDisjunctiveRefinements: function (e) {
        return (
          (this.isDisjunctiveFacet(e) &&
            this.disjunctiveFacetsRefinements[e]) ||
          []
        );
      },
      getHierarchicalRefinement: function (e) {
        return this.hierarchicalFacetsRefinements[e] || [];
      },
      getExcludeRefinements: function (e) {
        return (this.isConjunctiveFacet(e) && this.facetsExcludes[e]) || [];
      },
      removeNumericRefinement: function (n, r, e) {
        var i = e;
        return void 0 !== i
          ? this.isNumericRefined(n, r, i)
            ? this.setQueryParameters({
                numericRefinements: this._clearNumericRefinements(function (
                  e,
                  t
                ) {
                  return t === n && e.op === r && xr(e.val, Pr(i));
                }),
              })
            : this
          : void 0 !== r
          ? this.isNumericRefined(n, r)
            ? this.setQueryParameters({
                numericRefinements: this._clearNumericRefinements(function (
                  e,
                  t
                ) {
                  return t === n && e.op === r;
                }),
              })
            : this
          : this.isNumericRefined(n)
          ? this.setQueryParameters({
              numericRefinements: this._clearNumericRefinements(function (
                e,
                t
              ) {
                return t === n;
              }),
            })
          : this;
      },
      getNumericRefinements: function (e) {
        return this.numericRefinements[e] || {};
      },
      getNumericRefinement: function (e, t) {
        return this.numericRefinements[e] && this.numericRefinements[e][t];
      },
      _clearNumericRefinements: function (s) {
        var o, t, e;
        return void 0 === s
          ? mr(this.numericRefinements)
            ? {}
            : this.numericRefinements
          : "string" == typeof s
          ? pr(this.numericRefinements, [s])
          : "function" == typeof s
          ? ((o = !1),
            (t = this.numericRefinements),
            (e = Object.keys(t).reduce(function (e, r) {
              var i = t[r],
                a = {},
                i = i || {};
              return (
                Object.keys(i).forEach(function (t) {
                  var e = i[t] || [],
                    n = [];
                  e.forEach(function (e) {
                    s({ val: e, op: t }, r, "numeric") || n.push(e);
                  }),
                    n.length !== e.length && (o = !0),
                    (a[t] = n);
                }),
                (e[r] = a),
                e
              );
            }, {})),
            o ? e : this.numericRefinements)
          : void 0;
      },
      addFacet: function (e) {
        return this.isConjunctiveFacet(e)
          ? this
          : this.setQueryParameters({ facets: this.facets.concat([e]) });
      },
      addDisjunctiveFacet: function (e) {
        return this.isDisjunctiveFacet(e)
          ? this
          : this.setQueryParameters({
              disjunctiveFacets: this.disjunctiveFacets.concat([e]),
            });
      },
      addHierarchicalFacet: function (e) {
        if (this.isHierarchicalFacet(e.name))
          throw new Error(
            "Cannot declare two hierarchical facets with the same name: `" +
              e.name +
              "`"
          );
        return this.setQueryParameters({
          hierarchicalFacets: this.hierarchicalFacets.concat([e]),
        });
      },
      addFacetRefinement: function (e, t) {
        if (this.isConjunctiveFacet(e))
          return r.isRefined(this.facetsRefinements, e, t)
            ? this
            : this.setQueryParameters({
                facetsRefinements: r.addRefinement(
                  this.facetsRefinements,
                  e,
                  t
                ),
              });
        throw new Error(
          e +
            " is not defined in the facets attribute of the helper configuration"
        );
      },
      addExcludeRefinement: function (e, t) {
        if (this.isConjunctiveFacet(e))
          return r.isRefined(this.facetsExcludes, e, t)
            ? this
            : this.setQueryParameters({
                facetsExcludes: r.addRefinement(this.facetsExcludes, e, t),
              });
        throw new Error(
          e +
            " is not defined in the facets attribute of the helper configuration"
        );
      },
      addDisjunctiveFacetRefinement: function (e, t) {
        if (this.isDisjunctiveFacet(e))
          return r.isRefined(this.disjunctiveFacetsRefinements, e, t)
            ? this
            : this.setQueryParameters({
                disjunctiveFacetsRefinements: r.addRefinement(
                  this.disjunctiveFacetsRefinements,
                  e,
                  t
                ),
              });
        throw new Error(
          e +
            " is not defined in the disjunctiveFacets attribute of the helper configuration"
        );
      },
      addTagRefinement: function (e) {
        return this.isTagRefined(e)
          ? this
          : ((e = { tagRefinements: this.tagRefinements.concat(e) }),
            this.setQueryParameters(e));
      },
      removeFacet: function (t) {
        return this.isConjunctiveFacet(t)
          ? this.clearRefinements(t).setQueryParameters({
              facets: this.facets.filter(function (e) {
                return e !== t;
              }),
            })
          : this;
      },
      removeDisjunctiveFacet: function (t) {
        return this.isDisjunctiveFacet(t)
          ? this.clearRefinements(t).setQueryParameters({
              disjunctiveFacets: this.disjunctiveFacets.filter(function (e) {
                return e !== t;
              }),
            })
          : this;
      },
      removeHierarchicalFacet: function (t) {
        return this.isHierarchicalFacet(t)
          ? this.clearRefinements(t).setQueryParameters({
              hierarchicalFacets: this.hierarchicalFacets.filter(function (e) {
                return e.name !== t;
              }),
            })
          : this;
      },
      removeFacetRefinement: function (e, t) {
        if (this.isConjunctiveFacet(e))
          return r.isRefined(this.facetsRefinements, e, t)
            ? this.setQueryParameters({
                facetsRefinements: r.removeRefinement(
                  this.facetsRefinements,
                  e,
                  t
                ),
              })
            : this;
        throw new Error(
          e +
            " is not defined in the facets attribute of the helper configuration"
        );
      },
      removeExcludeRefinement: function (e, t) {
        if (this.isConjunctiveFacet(e))
          return r.isRefined(this.facetsExcludes, e, t)
            ? this.setQueryParameters({
                facetsExcludes: r.removeRefinement(this.facetsExcludes, e, t),
              })
            : this;
        throw new Error(
          e +
            " is not defined in the facets attribute of the helper configuration"
        );
      },
      removeDisjunctiveFacetRefinement: function (e, t) {
        if (this.isDisjunctiveFacet(e))
          return r.isRefined(this.disjunctiveFacetsRefinements, e, t)
            ? this.setQueryParameters({
                disjunctiveFacetsRefinements: r.removeRefinement(
                  this.disjunctiveFacetsRefinements,
                  e,
                  t
                ),
              })
            : this;
        throw new Error(
          e +
            " is not defined in the disjunctiveFacets attribute of the helper configuration"
        );
      },
      removeTagRefinement: function (t) {
        var e;
        return this.isTagRefined(t)
          ? ((e = {
              tagRefinements: this.tagRefinements.filter(function (e) {
                return e !== t;
              }),
            }),
            this.setQueryParameters(e))
          : this;
      },
      toggleRefinement: function (e, t) {
        return this.toggleFacetRefinement(e, t);
      },
      toggleFacetRefinement: function (e, t) {
        if (this.isHierarchicalFacet(e))
          return this.toggleHierarchicalFacetRefinement(e, t);
        if (this.isConjunctiveFacet(e))
          return this.toggleConjunctiveFacetRefinement(e, t);
        if (this.isDisjunctiveFacet(e))
          return this.toggleDisjunctiveFacetRefinement(e, t);
        throw new Error(
          "Cannot refine the undeclared facet " +
            e +
            "; it should be added to the helper options facets, disjunctiveFacets or hierarchicalFacets"
        );
      },
      toggleConjunctiveFacetRefinement: function (e, t) {
        if (this.isConjunctiveFacet(e))
          return this.setQueryParameters({
            facetsRefinements: r.toggleRefinement(this.facetsRefinements, e, t),
          });
        throw new Error(
          e +
            " is not defined in the facets attribute of the helper configuration"
        );
      },
      toggleExcludeFacetRefinement: function (e, t) {
        if (this.isConjunctiveFacet(e))
          return this.setQueryParameters({
            facetsExcludes: r.toggleRefinement(this.facetsExcludes, e, t),
          });
        throw new Error(
          e +
            " is not defined in the facets attribute of the helper configuration"
        );
      },
      toggleDisjunctiveFacetRefinement: function (e, t) {
        if (this.isDisjunctiveFacet(e))
          return this.setQueryParameters({
            disjunctiveFacetsRefinements: r.toggleRefinement(
              this.disjunctiveFacetsRefinements,
              e,
              t
            ),
          });
        throw new Error(
          e +
            " is not defined in the disjunctiveFacets attribute of the helper configuration"
        );
      },
      toggleHierarchicalFacetRefinement: function (e, t) {
        var n, r;
        if (this.isHierarchicalFacet(e))
          return (
            (n = this._getHierarchicalFacetSeparator(
              this.getHierarchicalFacetByName(e)
            )),
            (r = {}),
            void 0 !== this.hierarchicalFacetsRefinements[e] &&
            0 < this.hierarchicalFacetsRefinements[e].length &&
            (this.hierarchicalFacetsRefinements[e][0] === t ||
              0 === this.hierarchicalFacetsRefinements[e][0].indexOf(t + n))
              ? -1 === t.indexOf(n)
                ? (r[e] = [])
                : (r[e] = [t.slice(0, t.lastIndexOf(n))])
              : (r[e] = [t]),
            this.setQueryParameters({
              hierarchicalFacetsRefinements: Sr(
                {},
                r,
                this.hierarchicalFacetsRefinements
              ),
            })
          );
        throw new Error(
          e +
            " is not defined in the hierarchicalFacets attribute of the helper configuration"
        );
      },
      addHierarchicalFacetRefinement: function (e, t) {
        if (this.isHierarchicalFacetRefined(e))
          throw new Error(e + " is already refined.");
        var n;
        if (this.isHierarchicalFacet(e))
          return (
            ((n = {})[e] = [t]),
            this.setQueryParameters({
              hierarchicalFacetsRefinements: Sr(
                {},
                n,
                this.hierarchicalFacetsRefinements
              ),
            })
          );
        throw new Error(
          e +
            " is not defined in the hierarchicalFacets attribute of the helper configuration."
        );
      },
      removeHierarchicalFacetRefinement: function (e) {
        var t;
        return this.isHierarchicalFacetRefined(e)
          ? (((t = {})[e] = []),
            this.setQueryParameters({
              hierarchicalFacetsRefinements: Sr(
                {},
                t,
                this.hierarchicalFacetsRefinements
              ),
            }))
          : this;
      },
      toggleTagRefinement: function (e) {
        return this.isTagRefined(e)
          ? this.removeTagRefinement(e)
          : this.addTagRefinement(e);
      },
      isDisjunctiveFacet: function (e) {
        return -1 < this.disjunctiveFacets.indexOf(e);
      },
      isHierarchicalFacet: function (e) {
        return void 0 !== this.getHierarchicalFacetByName(e);
      },
      isConjunctiveFacet: function (e) {
        return -1 < this.facets.indexOf(e);
      },
      isFacetRefined: function (e, t) {
        return (
          !!this.isConjunctiveFacet(e) &&
          r.isRefined(this.facetsRefinements, e, t)
        );
      },
      isExcludeRefined: function (e, t) {
        return (
          !!this.isConjunctiveFacet(e) && r.isRefined(this.facetsExcludes, e, t)
        );
      },
      isDisjunctiveFacetRefined: function (e, t) {
        return (
          !!this.isDisjunctiveFacet(e) &&
          r.isRefined(this.disjunctiveFacetsRefinements, e, t)
        );
      },
      isHierarchicalFacetRefined: function (e, t) {
        return (
          !!this.isHierarchicalFacet(e) &&
          ((e = this.getHierarchicalRefinement(e)),
          t ? -1 !== e.indexOf(t) : 0 < e.length)
        );
      },
      isNumericRefined: function (e, t, n) {
        var r, i;
        return void 0 === n && void 0 === t
          ? Boolean(this.numericRefinements[e])
          : ((r =
              this.numericRefinements[e] &&
              void 0 !== this.numericRefinements[e][t]),
            void 0 !== n && r
              ? ((n = Pr(n)),
                (t =
                  void 0 !==
                  ((e = this.numericRefinements[e][t]),
                  (i = n),
                  p(e, function (e) {
                    return xr(e, i);
                  }))),
                r && t)
              : r);
      },
      isTagRefined: function (e) {
        return -1 !== this.tagRefinements.indexOf(e);
      },
      getRefinedDisjunctiveFacets: function () {
        var t = this,
          e = wr(
            Object.keys(this.numericRefinements).filter(function (e) {
              return 0 < Object.keys(t.numericRefinements[e]).length;
            }),
            this.disjunctiveFacets
          );
        return Object.keys(this.disjunctiveFacetsRefinements)
          .filter(function (e) {
            return 0 < t.disjunctiveFacetsRefinements[e].length;
          })
          .concat(e)
          .concat(this.getRefinedHierarchicalFacets())
          .sort();
      },
      getRefinedHierarchicalFacets: function () {
        var t = this;
        return wr(
          this.hierarchicalFacets.map(function (e) {
            return e.name;
          }),
          Object.keys(this.hierarchicalFacetsRefinements).filter(function (e) {
            return 0 < t.hierarchicalFacetsRefinements[e].length;
          })
        ).sort();
      },
      getUnrefinedDisjunctiveFacets: function () {
        var t = this.getRefinedDisjunctiveFacets();
        return this.disjunctiveFacets.filter(function (e) {
          return -1 === t.indexOf(e);
        });
      },
      managedParameters: [
        "index",
        "facets",
        "disjunctiveFacets",
        "facetsRefinements",
        "hierarchicalFacets",
        "facetsExcludes",
        "disjunctiveFacetsRefinements",
        "numericRefinements",
        "tagRefinements",
        "hierarchicalFacetsRefinements",
      ],
      getQueryParams: function () {
        var n = this.managedParameters,
          r = {},
          i = this;
        return (
          Object.keys(this).forEach(function (e) {
            var t = i[e];
            -1 === n.indexOf(e) && void 0 !== t && (r[e] = t);
          }),
          r
        );
      },
      setQueryParameter: function (e, t) {
        var n;
        return this[e] === t
          ? this
          : (((n = {})[e] = t), this.setQueryParameters(n));
      },
      setQueryParameters: function (e) {
        if (!e) return this;
        var t = s.validate(this, e);
        if (t) throw t;
        var n = this,
          i = s._parseNumbers(e),
          t = Object.keys(this).reduce(function (e, t) {
            return (e[t] = n[t]), e;
          }, {}),
          e = Object.keys(i).reduce(function (e, t) {
            var n = void 0 !== e[t],
              r = void 0 !== i[t];
            return n && !r ? pr(e, [t]) : (r && (e[t] = i[t]), e);
          }, t);
        return new this.constructor(e);
      },
      resetPage: function () {
        return void 0 === this.page ? this : this.setPage(0);
      },
      _getHierarchicalFacetSortBy: function (e) {
        return e.sortBy || ["isRefined:desc", "name:asc"];
      },
      _getHierarchicalFacetSeparator: function (e) {
        return e.separator || " > ";
      },
      _getHierarchicalRootPath: function (e) {
        return e.rootPath || null;
      },
      _getHierarchicalShowParentLevel: function (e) {
        return "boolean" != typeof e.showParentLevel || e.showParentLevel;
      },
      getHierarchicalFacetByName: function (t) {
        return p(this.hierarchicalFacets, function (e) {
          return e.name === t;
        });
      },
      getHierarchicalFacetBreadcrumb: function (e) {
        var t;
        return this.isHierarchicalFacet(e) &&
          (t = this.getHierarchicalRefinement(e)[0])
          ? ((e = this._getHierarchicalFacetSeparator(
              this.getHierarchicalFacetByName(e)
            )),
            t.split(e).map(function (e) {
              return e.trim();
            }))
          : [];
      },
      toString: function () {
        return JSON.stringify(this, null, 2);
      },
    });
  function Ir(e) {
    return Array.isArray(e) ? e.filter(Boolean) : [];
  }
  function Cr(e, t) {
    if (Array.isArray(e))
      for (var n = 0; n < e.length; n++) if (t(e[n])) return n;
    return -1;
  }
  function Tr(e, t) {
    var r = (t || []).map(function (e) {
      return e.split(":");
    });
    return e.reduce(
      function (e, t) {
        var n = t.split(":"),
          t = p(r, function (e) {
            return e[0] === n[0];
          });
        return (
          1 < n.length || !t
            ? (e[0].push(n[0]), e[1].push(n[1]))
            : (e[0].push(t[0]), e[1].push(t[1])),
          e
        );
      },
      [[], []]
    );
  }
  var Fr = s;
  var Er = function (e, n, i) {
      return Array.isArray(e)
        ? (Array.isArray(i) || (i = []),
          (e = e.map(function (t, e) {
            return {
              criteria: n.map(function (e) {
                return t[e];
              }),
              index: e,
              value: t,
            };
          })).sort(function (e, t) {
            for (var n = -1; ++n < e.criteria.length; ) {
              var r = (function (e, t) {
                if (e !== t) {
                  var n = void 0 !== e,
                    r = null === e,
                    i = void 0 !== t,
                    a = null === t;
                  if ((!a && t < e) || (r && i) || !n) return 1;
                  if ((!r && e < t) || (a && n) || !i) return -1;
                }
                return 0;
              })(e.criteria[n], t.criteria[n]);
              if (r) return !(n >= i.length) && "desc" === i[n] ? -r : r;
            }
            return e.index - t.index;
          }),
          e.map(function (e) {
            return e.value;
          }))
        : [];
    },
    jr = function (m) {
      return function (e, t) {
        function n(e, s, t) {
          var n,
            o = e;
          if (0 < t) {
            var r = 0;
            for (o = e; r < t; ) {
              var i = o && Array.isArray(o.data) ? o.data : [],
                o = p(i, function (e) {
                  return e.isRefined;
                });
              r++;
            }
          }
          return (
            o &&
              ((n = Object.keys(s.data)
                .map(function (e) {
                  return [e, s.data[e]];
                })
                .filter(function (e) {
                  var t,
                    n,
                    r,
                    i,
                    a,
                    e = e[0];
                  return (
                    (e = e),
                    (t = o.path || u),
                    (n = d),
                    (r = c),
                    (a = l),
                    (!(i = u) || (0 === e.indexOf(i) && i !== e)) &&
                      ((!i && -1 === e.indexOf(r)) ||
                        (i && e.split(r).length - i.split(r).length == 1) ||
                        (-1 === e.indexOf(r) && -1 === n.indexOf(r)) ||
                        0 === n.indexOf(e) ||
                        (0 === e.indexOf(t + r) && (a || 0 === e.indexOf(n))))
                  );
                })),
              (o.data = Er(
                n.map(function (e) {
                  var t,
                    n,
                    r,
                    i,
                    a = e[0],
                    e = e[1];
                  return (
                    (e = e),
                    (a = a),
                    (t = c),
                    (n = Or(d)),
                    (r = s.exhaustive),
                    {
                      name: (i = a.split(t))[i.length - 1].trim(),
                      path: a,
                      escapedValue: kr(a),
                      count: e,
                      isRefined: n === a || 0 === n.indexOf(a + t),
                      exhaustive: r,
                      data: null,
                    }
                  );
                }),
                a[0],
                a[1]
              ))),
            e
          );
        }
        var a,
          c,
          u,
          l,
          d,
          r = m.hierarchicalFacets[t],
          i =
            (m.hierarchicalFacetsRefinements[r.name] &&
              m.hierarchicalFacetsRefinements[r.name][0]) ||
            "",
          s = m._getHierarchicalFacetSeparator(r),
          o = m._getHierarchicalRootPath(r),
          h = m._getHierarchicalShowParentLevel(r),
          r = Tr(m._getHierarchicalFacetSortBy(r)),
          f = e.every(function (e) {
            return e.exhaustive;
          }),
          r = ((a = r), (c = s), (l = h), (d = i), e);
        return (r = (u = o) ? e.slice(o.split(s).length) : r).reduce(n, {
          name: m.hierarchicalFacets[t].name,
          count: null,
          isRefined: !0,
          path: null,
          escapedValue: null,
          exhaustive: f,
          data: null,
        });
      };
    },
    kr = ur,
    Or = lr;
  var Lr = ur,
    Mr = lr;
  function Hr(e) {
    var n = {};
    return (
      e.forEach(function (e, t) {
        n[e] = t;
      }),
      n
    );
  }
  function Ar(e, t, n) {
    t && t[n] && (e.stats = t[n]);
  }
  function Wr(l, t, e) {
    var o = t[0] || {},
      d = ((this._rawResults = t), this),
      n =
        (Object.keys(o).forEach(function (e) {
          d[e] = o[e];
        }),
        fr({ persistHierarchicalRootCount: !1 }, e)),
      e =
        (Object.keys(n).forEach(function (e) {
          d[e] = n[e];
        }),
        (this.processingTimeMS = t.reduce(function (e, t) {
          return void 0 === t.processingTimeMS ? e : e + t.processingTimeMS;
        }, 0)),
        (this.disjunctiveFacets = []),
        (this.hierarchicalFacets = l.hierarchicalFacets.map(function () {
          return [];
        })),
        (this.facets = []),
        l.getRefinedDisjunctiveFacets()),
      c = Hr(l.facets),
      u = Hr(l.disjunctiveFacets),
      r = 1,
      h = o.facets || {};
    Object.keys(h).forEach(function (e) {
      var t,
        n,
        r,
        i,
        a = h[e],
        s =
          ((r = l.hierarchicalFacets),
          (t = e),
          p(r, function (e) {
            return -1 < (e.attributes || []).indexOf(t);
          }));
      s
        ? ((r = s.attributes.indexOf(e)),
          (n = Cr(l.hierarchicalFacets, function (e) {
            return e.name === s.name;
          })),
          (d.hierarchicalFacets[n][r] = {
            attribute: e,
            data: a,
            exhaustive: o.exhaustiveFacetsCount,
          }))
        : ((n = -1 !== l.disjunctiveFacets.indexOf(e)),
          (r = -1 !== l.facets.indexOf(e)),
          n &&
            ((i = u[e]),
            (d.disjunctiveFacets[i] = {
              name: e,
              data: a,
              exhaustive: o.exhaustiveFacetsCount,
            }),
            Ar(d.disjunctiveFacets[i], o.facets_stats, e)),
          r &&
            ((i = c[e]),
            (d.facets[i] = {
              name: e,
              data: a,
              exhaustive: o.exhaustiveFacetsCount,
            }),
            Ar(d.facets[i], o.facets_stats, e)));
    }),
      (this.hierarchicalFacets = Ir(this.hierarchicalFacets)),
      e.forEach(function (e) {
        var i = t[r],
          a = i && i.facets ? i.facets : {},
          s = l.getHierarchicalFacetByName(e);
        Object.keys(a).forEach(function (t) {
          var n,
            e,
            r = a[t];
          s
            ? ((n = Cr(l.hierarchicalFacets, function (e) {
                return e.name === s.name;
              })),
              -1 !==
                (e = Cr(d.hierarchicalFacets[n], function (e) {
                  return e.attribute === t;
                })) &&
                (d.hierarchicalFacets[n][e].data = fr(
                  {},
                  d.hierarchicalFacets[n][e].data,
                  r
                )))
            : ((n = u[t]),
              (e = (o.facets && o.facets[t]) || {}),
              (d.disjunctiveFacets[n] = {
                name: t,
                data: Sr({}, r, e),
                exhaustive: i.exhaustiveFacetsCount,
              }),
              Ar(d.disjunctiveFacets[n], i.facets_stats, t),
              l.disjunctiveFacetsRefinements[t] &&
                l.disjunctiveFacetsRefinements[t].forEach(function (e) {
                  !d.disjunctiveFacets[n].data[e] &&
                    -1 < l.disjunctiveFacetsRefinements[t].indexOf(Mr(e)) &&
                    (d.disjunctiveFacets[n].data[e] = 0);
                }));
        }),
          r++;
      }),
      l.getRefinedHierarchicalFacets().forEach(function (e) {
        var o = l.getHierarchicalFacetByName(e),
          c = l._getHierarchicalFacetSeparator(o),
          u = l.getHierarchicalRefinement(e);
        0 === u.length ||
          u[0].split(c).length < 2 ||
          t.slice(r).forEach(function (e) {
            var s = e && e.facets ? e.facets : {};
            Object.keys(s).forEach(function (t) {
              var e,
                n,
                r = s[t],
                i = Cr(l.hierarchicalFacets, function (e) {
                  return e.name === o.name;
                }),
                a = Cr(d.hierarchicalFacets[i], function (e) {
                  return e.attribute === t;
                });
              -1 !== a &&
                ((e = {}),
                0 < u.length &&
                  !d.persistHierarchicalRootCount &&
                  (e[(n = u[0].split(c)[0])] =
                    d.hierarchicalFacets[i][a].data[n]),
                (d.hierarchicalFacets[i][a].data = Sr(
                  e,
                  r,
                  d.hierarchicalFacets[i][a].data
                )));
            }),
              r++;
          });
      }),
      Object.keys(l.facetsExcludes).forEach(function (t) {
        var e = l.facetsExcludes[t],
          n = c[t];
        (d.facets[n] = {
          name: t,
          data: h[t],
          exhaustive: o.exhaustiveFacetsCount,
        }),
          e.forEach(function (e) {
            (d.facets[n] = d.facets[n] || { name: t }),
              (d.facets[n].data = d.facets[n].data || {}),
              (d.facets[n].data[e] = 0);
          });
      }),
      (this.hierarchicalFacets = this.hierarchicalFacets.map(jr(l))),
      (this.facets = Ir(this.facets)),
      (this.disjunctiveFacets = Ir(this.disjunctiveFacets)),
      (this._state = l);
  }
  function Dr(n, r) {
    function e(e) {
      return e.name === r;
    }
    var i, a, t, s, o, c;
    return n._state.isConjunctiveFacet(r)
      ? (i = p(n.facets, e))
        ? Object.keys(i.data).map(function (e) {
            var t = Lr(e);
            return {
              name: e,
              escapedValue: t,
              count: i.data[e],
              isRefined: n._state.isFacetRefined(r, t),
              isExcluded: n._state.isExcludeRefined(r, e),
            };
          })
        : []
      : n._state.isDisjunctiveFacet(r)
      ? (a = p(n.disjunctiveFacets, e))
        ? Object.keys(a.data).map(function (e) {
            var t = Lr(e);
            return {
              name: e,
              escapedValue: t,
              count: a.data[e],
              isRefined: n._state.isDisjunctiveFacetRefined(r, t),
            };
          })
        : []
      : n._state.isHierarchicalFacet(r)
      ? ((t = p(n.hierarchicalFacets, e)) &&
          ((c = n._state.getHierarchicalFacetByName(r)),
          (s = n._state._getHierarchicalFacetSeparator(c)),
          (c = (o =
            0 ===
            (o = Mr(n._state.getHierarchicalRefinement(r)[0] || "")).indexOf(
              c.rootPath
            )
              ? o.replace(c.rootPath + s, "")
              : o).split(s)).unshift(r),
          (function t(e, n, r) {
            e.isRefined = e.name === (n[r] && n[r].trim());
            e.data &&
              e.data.forEach(function (e) {
                t(e, n, r + 1);
              });
          })(t, c, 0)),
        t)
      : void 0;
  }
  function $r(e, t) {
    e = p(e, function (e) {
      return e.name === t;
    });
    return e && e.stats;
  }
  function Br(e, t, n, r, i) {
    var i = p(i, function (e) {
        return e.name === n;
      }),
      a = i && i.data && i.data[r] ? i.data[r] : 0,
      i = (i && i.exhaustive) || !1;
    return { type: t, attributeName: n, name: r, count: a, exhaustive: i };
  }
  (Wr.prototype.getFacetByName = function (t) {
    function e(e) {
      return e.name === t;
    }
    return (
      p(this.facets, e) ||
      p(this.disjunctiveFacets, e) ||
      p(this.hierarchicalFacets, e)
    );
  }),
    (Wr.DEFAULT_SORT = ["isRefined:desc", "count:desc", "name:asc"]),
    (Wr.prototype.getFacetValues = function (e, t) {
      var o,
        c,
        n = Dr(this, e);
      if (n)
        return (
          (o = Sr({}, t, {
            sortBy: Wr.DEFAULT_SORT,
            facetOrdering: !(t && t.sortBy),
          })),
          (c = this),
          (function t(n, e, r, i) {
            var a;
            return (
              (i = i || 0),
              Array.isArray(e)
                ? n(e, r[i])
                : e.data && 0 !== e.data.length
                ? ((a = e.data.map(function (e) {
                    return t(n, e, r, i + 1);
                  })),
                  (a = n(a, r[i])),
                  Sr({ data: a }, e))
                : e
            );
          })(
            function (e, t) {
              if (o.facetOrdering) {
                t = t;
                n =
                  (n = c).renderingContent &&
                  n.renderingContent.facetOrdering &&
                  n.renderingContent.facetOrdering.values &&
                  n.renderingContent.facetOrdering.values[t];
                if (n)
                  return (
                    (t = e),
                    (r = []),
                    (i = []),
                    (a = (n = n).hide || []),
                    (s = (n.order || []).reduce(function (e, t, n) {
                      return (e[t] = n), e;
                    }, {})),
                    t.forEach(function (e) {
                      var t = e.path || e.name,
                        n = -1 < a.indexOf(t);
                      n || void 0 === s[t] ? n || i.push(e) : (r[s[t]] = e);
                    }),
                    (r = r.filter(function (e) {
                      return e;
                    })),
                    "hidden" === (t = n.sortRemainingBy)
                      ? r
                      : r.concat(
                          Er(
                            i,
                            (n =
                              "alpha" === t
                                ? [
                                    ["path", "name"],
                                    ["asc", "asc"],
                                  ]
                                : [["count"], ["desc"]])[0],
                            n[1]
                          )
                        )
                  );
              }
              var r, i, a, s, n;
              if (Array.isArray(o.sortBy))
                return (t = Tr(o.sortBy, Wr.DEFAULT_SORT)), Er(e, t[0], t[1]);
              if ("function" == typeof o.sortBy)
                return (n = o.sortBy), e.sort(n);
              throw new Error(
                "options.sortBy is optional but if defined it must be either an array of string (predicates) or a sorting function"
              );
            },
            n,
            Array.isArray(n)
              ? [e]
              : c._state.getHierarchicalFacetByName(n.name).attributes
          )
        );
    }),
    (Wr.prototype.getFacetStats = function (e) {
      return this._state.isConjunctiveFacet(e)
        ? $r(this.facets, e)
        : this._state.isDisjunctiveFacet(e)
        ? $r(this.disjunctiveFacets, e)
        : void 0;
    }),
    (Wr.prototype.getRefinements = function () {
      var s = this._state,
        o = this,
        c = [];
      return (
        Object.keys(s.facetsRefinements).forEach(function (t) {
          s.facetsRefinements[t].forEach(function (e) {
            c.push(Br(0, "facet", t, e, o.facets));
          });
        }),
        Object.keys(s.facetsExcludes).forEach(function (t) {
          s.facetsExcludes[t].forEach(function (e) {
            c.push(Br(0, "exclude", t, e, o.facets));
          });
        }),
        Object.keys(s.disjunctiveFacetsRefinements).forEach(function (t) {
          s.disjunctiveFacetsRefinements[t].forEach(function (e) {
            c.push(Br(0, "disjunctive", t, e, o.disjunctiveFacets));
          });
        }),
        Object.keys(s.hierarchicalFacetsRefinements).forEach(function (a) {
          s.hierarchicalFacetsRefinements[a].forEach(function (e) {
            var t, n, r, i;
            c.push(
              ((t = s),
              (n = a),
              (e = e),
              (r = o.hierarchicalFacets),
              (i = t.getHierarchicalFacetByName(n)),
              (t = t._getHierarchicalFacetSeparator(i)),
              (i = e.split(t)),
              (e = p(r, function (e) {
                return e.name === n;
              })),
              (t = i.reduce(function (e, t) {
                var n =
                  e &&
                  p(e.data, function (e) {
                    return e.name === t;
                  });
                return void 0 !== n ? n : e;
              }, e)),
              (r = (t && t.count) || 0),
              (i = (t && t.exhaustive) || !1),
              (e = (t && t.path) || ""),
              {
                type: "hierarchical",
                attributeName: n,
                name: e,
                count: r,
                exhaustive: i,
              })
            );
          });
        }),
        Object.keys(s.numericRefinements).forEach(function (n) {
          var e = s.numericRefinements[n];
          Object.keys(e).forEach(function (t) {
            e[t].forEach(function (e) {
              c.push({
                type: "numeric",
                attributeName: n,
                name: e,
                numericValue: e,
                operator: t,
              });
            });
          });
        }),
        s.tagRefinements.forEach(function (e) {
          c.push({ type: "tag", attributeName: "_tags", name: e });
        }),
        c
      );
    });
  var Ur = Wr;
  var qr = function (r) {
      var t,
        n,
        i,
        a = {};
      return (
        r.forEach(function (e) {
          e.forEach(function (e, t) {
            a[e.objectID]
              ? (a[e.objectID] = {
                  indexSum: a[e.objectID].indexSum + t,
                  count: a[e.objectID].count + 1,
                })
              : (a[e.objectID] = { indexSum: t, count: 1 });
          });
        }),
        (t = a),
        (n = r.length),
        (i = []),
        Object.keys(t).forEach(function (e) {
          t[e].count < 2 && (t[e].indexSum += 100),
            i.push({ objectID: e, avgOfIndices: t[e].indexSum / n });
        }),
        i
          .sort(function (e, t) {
            return e.avgOfIndices > t.avgOfIndices ? 1 : -1;
          })
          .reduce(function (e, t) {
            var n = p(
              r.reduce(function (e, t) {
                return e.concat(t);
              }, []),
              function (e) {
                return e.objectID === t.objectID;
              }
            );
            return n ? e.concat(n) : e;
          }, [])
      );
    },
    lr = "3.22.3",
    Qr = ur;
  function t(e, t, n, r) {
    "function" == typeof e.addAlgoliaAgent &&
      e.addAlgoliaAgent("JS Helper (3.22.3)"),
      this.setClient(e);
    e = n || {};
    (e.index = t),
      (this.state = Fr.make(e)),
      (this.recommendState = new vr({ params: e.recommendState })),
      (this.lastResults = null),
      (this.lastRecommendResults = null),
      (this._queryId = 0),
      (this._recommendQueryId = 0),
      (this._lastQueryIdReceived = -1),
      (this._lastRecommendQueryIdReceived = -1),
      (this.derivedHelpers = []),
      (this._currentNbQueries = 0),
      (this._currentNbRecommendQueries = 0),
      (this._searchResultsOptions = r),
      (this._recommendCache = {});
  }
  function Vr(e) {
    if (e < 0) throw new Error("Page requested below 0.");
    return (
      this._change({ state: this.state.setPage(e), isPageReset: !1 }), this
    );
  }
  function Kr() {
    return this.state.page;
  }
  e(t, rr),
    (t.prototype.search = function () {
      return this._search({ onlyWithDerivedHelpers: !1 }), this;
    }),
    (t.prototype.searchOnlyWithDerivedHelpers = function () {
      return this._search({ onlyWithDerivedHelpers: !0 }), this;
    }),
    (t.prototype.recommend = function () {
      return this._recommend(), this;
    }),
    (t.prototype.getQuery = function () {
      var e = this.state;
      return _r._getHitsSearchParams(e);
    }),
    (t.prototype.searchOnce = function (e, t) {
      var n = e ? this.state.setQueryParameters(e) : this.state,
        e = _r._getQueries(n.index, n),
        r = this;
      if ((this._currentNbQueries++, this.emit("searchOnce", { state: n }), !t))
        return this.client.search(e).then(
          function (e) {
            return (
              r._currentNbQueries--,
              0 === r._currentNbQueries && r.emit("searchQueueEmpty"),
              { content: new Ur(n, e.results), state: n, _originalResponse: e }
            );
          },
          function (e) {
            throw (
              (r._currentNbQueries--,
              0 === r._currentNbQueries && r.emit("searchQueueEmpty"),
              e)
            );
          }
        );
      this.client
        .search(e)
        .then(function (e) {
          r._currentNbQueries--,
            0 === r._currentNbQueries && r.emit("searchQueueEmpty"),
            t(null, new Ur(n, e.results), n);
        })
        .catch(function (e) {
          r._currentNbQueries--,
            0 === r._currentNbQueries && r.emit("searchQueueEmpty"),
            t(e, null, n);
        });
    }),
    (t.prototype.findAnswers = function (e) {
      console.warn("[algoliasearch-helper] answers is no longer supported");
      var t = this.state,
        n = this.derivedHelpers[0];
      if (!n) return Promise.resolve([]);
      var n = n.getModifiedState(t),
        t = fr(
          {
            attributesForPrediction: e.attributesForPrediction,
            nbHits: e.nbHits,
          },
          {
            params: pr(_r._getHitsSearchParams(n), [
              "attributesToSnippet",
              "hitsPerPage",
              "restrictSearchableAttributes",
              "snippetEllipsisText",
            ]),
          }
        ),
        r =
          "search for answers was called, but this client does not have a function client.initIndex(index).findAnswers";
      if ("function" != typeof this.client.initIndex) throw new Error(r);
      var i = this.client.initIndex(n.index);
      if ("function" != typeof i.findAnswers) throw new Error(r);
      return i.findAnswers(n.query, e.queryLanguages, t);
    }),
    (t.prototype.searchForFacetValues = function (t, e, n, r) {
      var i,
        a,
        s,
        o = "function" == typeof this.client.searchForFacetValues,
        c = "function" == typeof this.client.initIndex;
      if (o || c || "function" == typeof this.client.search)
        return (
          (i = this.state.setQueryParameters(r || {})),
          (a = i.isDisjunctiveFacet(t)),
          (r = _r.getSearchForFacetQuery(t, e, n, i)),
          this._currentNbQueries++,
          (s = this),
          (n = o
            ? this.client.searchForFacetValues([
                { indexName: i.index, params: r },
              ])
            : c
            ? this.client.initIndex(i.index).searchForFacetValues(r)
            : (delete r.facetName,
              this.client
                .search([
                  { type: "facet", facet: t, indexName: i.index, params: r },
                ])
                .then(function (e) {
                  return e.results[0];
                }))),
          this.emit("searchForFacetValues", { state: i, facet: t, query: e }),
          n.then(
            function (e) {
              return (
                s._currentNbQueries--,
                0 === s._currentNbQueries && s.emit("searchQueueEmpty"),
                (e = Array.isArray(e) ? e[0] : e).facetHits.forEach(function (
                  e
                ) {
                  (e.escapedValue = Qr(e.value)),
                    (e.isRefined = a
                      ? i.isDisjunctiveFacetRefined(t, e.escapedValue)
                      : i.isFacetRefined(t, e.escapedValue));
                }),
                e
              );
            },
            function (e) {
              throw (
                (s._currentNbQueries--,
                0 === s._currentNbQueries && s.emit("searchQueueEmpty"),
                e)
              );
            }
          )
        );
      throw new Error(
        "search for facet values (searchable) was called, but this client does not have a function client.searchForFacetValues or client.initIndex(index).searchForFacetValues"
      );
    }),
    (t.prototype.setQuery = function (e) {
      return (
        this._change({
          state: this.state.resetPage().setQuery(e),
          isPageReset: !0,
        }),
        this
      );
    }),
    (t.prototype.clearRefinements = function (e) {
      return (
        this._change({
          state: this.state.resetPage().clearRefinements(e),
          isPageReset: !0,
        }),
        this
      );
    }),
    (t.prototype.clearTags = function () {
      return (
        this._change({
          state: this.state.resetPage().clearTags(),
          isPageReset: !0,
        }),
        this
      );
    }),
    (t.prototype.addDisjunctiveFacetRefinement = function (e, t) {
      return (
        this._change({
          state: this.state.resetPage().addDisjunctiveFacetRefinement(e, t),
          isPageReset: !0,
        }),
        this
      );
    }),
    (t.prototype.addDisjunctiveRefine = function () {
      return this.addDisjunctiveFacetRefinement.apply(this, arguments);
    }),
    (t.prototype.addHierarchicalFacetRefinement = function (e, t) {
      return (
        this._change({
          state: this.state.resetPage().addHierarchicalFacetRefinement(e, t),
          isPageReset: !0,
        }),
        this
      );
    }),
    (t.prototype.addNumericRefinement = function (e, t, n) {
      return (
        this._change({
          state: this.state.resetPage().addNumericRefinement(e, t, n),
          isPageReset: !0,
        }),
        this
      );
    }),
    (t.prototype.addFacetRefinement = function (e, t) {
      return (
        this._change({
          state: this.state.resetPage().addFacetRefinement(e, t),
          isPageReset: !0,
        }),
        this
      );
    }),
    (t.prototype.addRefine = function () {
      return this.addFacetRefinement.apply(this, arguments);
    }),
    (t.prototype.addFacetExclusion = function (e, t) {
      return (
        this._change({
          state: this.state.resetPage().addExcludeRefinement(e, t),
          isPageReset: !0,
        }),
        this
      );
    }),
    (t.prototype.addExclude = function () {
      return this.addFacetExclusion.apply(this, arguments);
    }),
    (t.prototype.addTag = function (e) {
      return (
        this._change({
          state: this.state.resetPage().addTagRefinement(e),
          isPageReset: !0,
        }),
        this
      );
    }),
    (t.prototype.addFrequentlyBoughtTogether = function (e) {
      return (
        this._recommendChange({
          state: this.recommendState.addFrequentlyBoughtTogether(e),
        }),
        this
      );
    }),
    (t.prototype.addRelatedProducts = function (e) {
      return (
        this._recommendChange({
          state: this.recommendState.addRelatedProducts(e),
        }),
        this
      );
    }),
    (t.prototype.addTrendingItems = function (e) {
      return (
        this._recommendChange({
          state: this.recommendState.addTrendingItems(e),
        }),
        this
      );
    }),
    (t.prototype.addTrendingFacets = function (e) {
      return (
        this._recommendChange({
          state: this.recommendState.addTrendingFacets(e),
        }),
        this
      );
    }),
    (t.prototype.addLookingSimilar = function (e) {
      return (
        this._recommendChange({
          state: this.recommendState.addLookingSimilar(e),
        }),
        this
      );
    }),
    (t.prototype.removeNumericRefinement = function (e, t, n) {
      return (
        this._change({
          state: this.state.resetPage().removeNumericRefinement(e, t, n),
          isPageReset: !0,
        }),
        this
      );
    }),
    (t.prototype.removeDisjunctiveFacetRefinement = function (e, t) {
      return (
        this._change({
          state: this.state.resetPage().removeDisjunctiveFacetRefinement(e, t),
          isPageReset: !0,
        }),
        this
      );
    }),
    (t.prototype.removeDisjunctiveRefine = function () {
      return this.removeDisjunctiveFacetRefinement.apply(this, arguments);
    }),
    (t.prototype.removeHierarchicalFacetRefinement = function (e) {
      return (
        this._change({
          state: this.state.resetPage().removeHierarchicalFacetRefinement(e),
          isPageReset: !0,
        }),
        this
      );
    }),
    (t.prototype.removeFacetRefinement = function (e, t) {
      return (
        this._change({
          state: this.state.resetPage().removeFacetRefinement(e, t),
          isPageReset: !0,
        }),
        this
      );
    }),
    (t.prototype.removeRefine = function () {
      return this.removeFacetRefinement.apply(this, arguments);
    }),
    (t.prototype.removeFacetExclusion = function (e, t) {
      return (
        this._change({
          state: this.state.resetPage().removeExcludeRefinement(e, t),
          isPageReset: !0,
        }),
        this
      );
    }),
    (t.prototype.removeExclude = function () {
      return this.removeFacetExclusion.apply(this, arguments);
    }),
    (t.prototype.removeTag = function (e) {
      return (
        this._change({
          state: this.state.resetPage().removeTagRefinement(e),
          isPageReset: !0,
        }),
        this
      );
    }),
    (t.prototype.removeFrequentlyBoughtTogether = function (e) {
      return (
        this._recommendChange({ state: this.recommendState.removeParams(e) }),
        this
      );
    }),
    (t.prototype.removeRelatedProducts = function (e) {
      return (
        this._recommendChange({ state: this.recommendState.removeParams(e) }),
        this
      );
    }),
    (t.prototype.removeTrendingItems = function (e) {
      return (
        this._recommendChange({ state: this.recommendState.removeParams(e) }),
        this
      );
    }),
    (t.prototype.removeTrendingFacets = function (e) {
      return (
        this._recommendChange({ state: this.recommendState.removeParams(e) }),
        this
      );
    }),
    (t.prototype.removeLookingSimilar = function (e) {
      return (
        this._recommendChange({ state: this.recommendState.removeParams(e) }),
        this
      );
    }),
    (t.prototype.toggleFacetExclusion = function (e, t) {
      return (
        this._change({
          state: this.state.resetPage().toggleExcludeFacetRefinement(e, t),
          isPageReset: !0,
        }),
        this
      );
    }),
    (t.prototype.toggleExclude = function () {
      return this.toggleFacetExclusion.apply(this, arguments);
    }),
    (t.prototype.toggleRefinement = function (e, t) {
      return this.toggleFacetRefinement(e, t);
    }),
    (t.prototype.toggleFacetRefinement = function (e, t) {
      return (
        this._change({
          state: this.state.resetPage().toggleFacetRefinement(e, t),
          isPageReset: !0,
        }),
        this
      );
    }),
    (t.prototype.toggleRefine = function () {
      return this.toggleFacetRefinement.apply(this, arguments);
    }),
    (t.prototype.toggleTag = function (e) {
      return (
        this._change({
          state: this.state.resetPage().toggleTagRefinement(e),
          isPageReset: !0,
        }),
        this
      );
    }),
    (t.prototype.nextPage = function () {
      var e = this.state.page || 0;
      return this.setPage(e + 1);
    }),
    (t.prototype.previousPage = function () {
      var e = this.state.page || 0;
      return this.setPage(e - 1);
    }),
    (t.prototype.setCurrentPage = Vr),
    (t.prototype.setPage = Vr),
    (t.prototype.setIndex = function (e) {
      return (
        this._change({
          state: this.state.resetPage().setIndex(e),
          isPageReset: !0,
        }),
        this
      );
    }),
    (t.prototype.setQueryParameter = function (e, t) {
      return (
        this._change({
          state: this.state.resetPage().setQueryParameter(e, t),
          isPageReset: !0,
        }),
        this
      );
    }),
    (t.prototype.setState = function (e) {
      return this._change({ state: Fr.make(e), isPageReset: !1 }), this;
    }),
    (t.prototype.overrideStateWithoutTriggeringChangeEvent = function (e) {
      return (this.state = new Fr(e)), this;
    }),
    (t.prototype.hasRefinements = function (e) {
      return (
        !!mr(this.state.getNumericRefinements(e)) ||
        (this.state.isConjunctiveFacet(e)
          ? this.state.isFacetRefined(e)
          : this.state.isDisjunctiveFacet(e)
          ? this.state.isDisjunctiveFacetRefined(e)
          : !!this.state.isHierarchicalFacet(e) &&
            this.state.isHierarchicalFacetRefined(e))
      );
    }),
    (t.prototype.isExcluded = function (e, t) {
      return this.state.isExcludeRefined(e, t);
    }),
    (t.prototype.isDisjunctiveRefined = function (e, t) {
      return this.state.isDisjunctiveFacetRefined(e, t);
    }),
    (t.prototype.hasTag = function (e) {
      return this.state.isTagRefined(e);
    }),
    (t.prototype.isTagRefined = function () {
      return this.hasTagRefinements.apply(this, arguments);
    }),
    (t.prototype.getIndex = function () {
      return this.state.index;
    }),
    (t.prototype.getCurrentPage = Kr),
    (t.prototype.getPage = Kr),
    (t.prototype.getTags = function () {
      return this.state.tagRefinements;
    }),
    (t.prototype.getRefinements = function (e) {
      var n = [],
        r =
          (this.state.isConjunctiveFacet(e)
            ? (this.state.getConjunctiveRefinements(e).forEach(function (e) {
                n.push({ value: e, type: "conjunctive" });
              }),
              this.state.getExcludeRefinements(e).forEach(function (e) {
                n.push({ value: e, type: "exclude" });
              }))
            : this.state.isDisjunctiveFacet(e) &&
              this.state.getDisjunctiveRefinements(e).forEach(function (e) {
                n.push({ value: e, type: "disjunctive" });
              }),
          this.state.getNumericRefinements(e));
      return (
        Object.keys(r).forEach(function (e) {
          var t = r[e];
          n.push({ value: t, operator: e, type: "numeric" });
        }),
        n
      );
    }),
    (t.prototype.getNumericRefinement = function (e, t) {
      return this.state.getNumericRefinement(e, t);
    }),
    (t.prototype.getHierarchicalFacetBreadcrumb = function (e) {
      return this.state.getHierarchicalFacetBreadcrumb(e);
    }),
    (t.prototype._search = function (e) {
      var r = this.state,
        i = [],
        t = [],
        e =
          (e.onlyWithDerivedHelpers ||
            ((t = _r._getQueries(r.index, r)),
            i.push({ state: r, queriesCount: t.length, helper: this }),
            this.emit("search", { state: r, results: this.lastResults })),
          this.derivedHelpers.map(function (e) {
            var t = e.getModifiedState(r),
              n = t.index ? _r._getQueries(t.index, t) : [];
            return (
              i.push({ state: t, queriesCount: n.length, helper: e }),
              e.emit("search", { state: t, results: e.lastResults }),
              n
            );
          })),
        t = Array.prototype.concat.apply(t, e),
        e = this._queryId++;
      if ((this._currentNbQueries++, !t.length))
        return Promise.resolve({ results: [] }).then(
          this._dispatchAlgoliaResponse.bind(this, i, e)
        );
      try {
        this.client
          .search(t)
          .then(this._dispatchAlgoliaResponse.bind(this, i, e))
          .catch(this._dispatchAlgoliaError.bind(this, e));
      } catch (e) {
        this.emit("error", { error: e });
      }
    }),
    (t.prototype._recommend = function () {
      var r = this.state,
        e = this.recommendState,
        t = this.getIndex(),
        i = [{ state: e, index: t, helper: this }],
        a = e.params.map(function (e) {
          return e.$$id;
        }),
        s =
          (this.emit("fetch", {
            recommend: { state: e, results: this.lastRecommendResults },
          }),
          this._recommendCache),
        e = this.derivedHelpers.map(function (e) {
          var t,
            n = e.getModifiedState(r).index;
          return n
            ? ((t = e.getModifiedRecommendState(new vr())),
              i.push({ state: t, index: n, helper: e }),
              (a = Array.prototype.concat.apply(
                a,
                t.params.map(function (e) {
                  return e.$$id;
                })
              )),
              e.emit("fetch", {
                recommend: { state: t, results: e.lastRecommendResults },
              }),
              t._buildQueries(n, s))
            : [];
        }),
        t = Array.prototype.concat.apply(
          this.recommendState._buildQueries(t, s),
          e
        );
      if (0 !== t.length)
        if (0 < t.length && void 0 === this.client.getRecommendations)
          console.warn(
            "Please update algoliasearch/lite to the latest version in order to use recommend widgets."
          );
        else {
          e = this._recommendQueryId++;
          this._currentNbRecommendQueries++;
          try {
            this.client
              .getRecommendations(t)
              .then(this._dispatchRecommendResponse.bind(this, e, i, a))
              .catch(this._dispatchRecommendError.bind(this, e));
          } catch (e) {
            this.emit("error", { error: e });
          }
        }
    }),
    (t.prototype._dispatchAlgoliaResponse = function (e, t, n) {
      var r,
        i = this;
      t < this._lastQueryIdReceived ||
        ((this._currentNbQueries -= t - this._lastQueryIdReceived),
        (this._lastQueryIdReceived = t),
        0 === this._currentNbQueries && this.emit("searchQueueEmpty"),
        (r = n.results.slice()),
        e.forEach(function (e) {
          var t = e.state,
            n = e.queriesCount,
            e = e.helper,
            n = r.splice(0, n);
          t.index
            ? ((e.lastResults = new Ur(t, n, i._searchResultsOptions)),
              e.emit("result", { results: e.lastResults, state: t }))
            : e.emit("result", { results: null, state: t });
        }));
    }),
    (t.prototype._dispatchRecommendResponse = function (e, t, n, r) {
      var i, a, s;
      e < this._lastRecommendQueryIdReceived ||
        ((this._currentNbRecommendQueries -=
          e - this._lastRecommendQueryIdReceived),
        (this._lastRecommendQueryIdReceived = e),
        0 === this._currentNbRecommendQueries &&
          this.emit("recommendQueueEmpty"),
        (i = this._recommendCache),
        (a = {}),
        n
          .filter(function (e) {
            return void 0 === i[e];
          })
          .forEach(function (e, t) {
            a[e] || (a[e] = []), a[e].push(t);
          }),
        Object.keys(a).forEach(function (e) {
          var t = a[e],
            n = r.results[t[0]];
          1 === t.length
            ? (i[e] = n)
            : (i[e] = Object.assign({}, n, {
                hits: qr(
                  t.map(function (e) {
                    return r.results[e].hits;
                  })
                ),
              }));
        }),
        (s = {}),
        n.forEach(function (e) {
          s[e] = i[e];
        }),
        t.forEach(function (e) {
          var t = e.state,
            n = e.helper;
          e.index
            ? ((n.lastRecommendResults = new br(t, s)),
              n.emit("recommend:result", {
                recommend: { results: n.lastRecommendResults, state: t },
              }))
            : n.emit("recommend:result", { results: null, state: t });
        }));
    }),
    (t.prototype._dispatchAlgoliaError = function (e, t) {
      e < this._lastQueryIdReceived ||
        ((this._currentNbQueries -= e - this._lastQueryIdReceived),
        (this._lastQueryIdReceived = e),
        this.emit("error", { error: t }),
        0 === this._currentNbQueries && this.emit("searchQueueEmpty"));
    }),
    (t.prototype._dispatchRecommendError = function (e, t) {
      e < this._lastRecommendQueryIdReceived ||
        ((this._currentNbRecommendQueries -=
          e - this._lastRecommendQueryIdReceived),
        (this._lastRecommendQueryIdReceived = e),
        this.emit("error", { error: t }),
        0 === this._currentNbRecommendQueries &&
          this.emit("recommendQueueEmpty"));
    }),
    (t.prototype.containsRefinement = function (e, t, n, r) {
      return e || 0 !== t.length || 0 !== n.length || 0 !== r.length;
    }),
    (t.prototype._hasDisjunctiveRefinements = function (e) {
      return (
        this.state.disjunctiveRefinements[e] &&
        0 < this.state.disjunctiveRefinements[e].length
      );
    }),
    (t.prototype._change = function (e) {
      var t = e.state,
        e = e.isPageReset;
      t !== this.state &&
        ((this.state = t),
        this.emit("change", {
          state: this.state,
          results: this.lastResults,
          isPageReset: e,
        }));
    }),
    (t.prototype._recommendChange = function (e) {
      e = e.state;
      e !== this.recommendState &&
        ((this.recommendState = e),
        this.emit("recommend:change", {
          search: { results: this.lastResults, state: this.state },
          recommend: {
            results: this.lastRecommendResults,
            state: this.recommendState,
          },
        }));
    }),
    (t.prototype.clearCache = function () {
      return this.client.clearCache && this.client.clearCache(), this;
    }),
    (t.prototype.setClient = function (e) {
      return (
        this.client !== e &&
          ("function" == typeof e.addAlgoliaAgent &&
            e.addAlgoliaAgent("JS Helper (3.22.3)"),
          (this.client = e)),
        this
      );
    }),
    (t.prototype.getClient = function () {
      return this.client;
    }),
    (t.prototype.derive = function (e, t) {
      e = new cr(this, e, t);
      return this.derivedHelpers.push(e), e;
    }),
    (t.prototype.detachDerivedHelper = function (e) {
      e = this.derivedHelpers.indexOf(e);
      if (-1 === e) throw new Error("Derived helper already detached");
      this.derivedHelpers.splice(e, 1);
    }),
    (t.prototype.hasPendingRequests = function () {
      return 0 < this._currentNbQueries;
    });
  var zr = t;
  function Jr(e, t, n, r) {
    return new zr(e, t, n, r);
  }
  (Jr.version = lr),
    (Jr.AlgoliaSearchHelper = zr),
    (Jr.SearchParameters = Fr),
    (Jr.RecommendParameters = vr),
    (Jr.SearchResults = Ur),
    (Jr.RecommendResults = br);
  var v = Jr,
    Zr = l({ name: "configure", connector: !0 });
  function Yr(e, t) {
    return e.setQueryParameters(
      Object.keys(t.searchParameters).reduce(function (e, t) {
        return F(F({}, e), {}, E({}, t, void 0));
      }, {})
    );
  }
  function Xr() {
    var n = 0 < arguments.length && void 0 !== arguments[0] ? arguments[0] : R,
      i = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : R;
    return function (r) {
      var t;
      if (r && se(r.searchParameters))
        return (
          (t = {}),
          {
            $$type: "ais.configure",
            init: function (e) {
              var t = e.instantSearchInstance;
              n(
                F(
                  F({}, this.getWidgetRenderState(e)),
                  {},
                  { instantSearchInstance: t }
                ),
                !0
              );
            },
            render: function (e) {
              var t = e.instantSearchInstance;
              n(
                F(
                  F({}, this.getWidgetRenderState(e)),
                  {},
                  { instantSearchInstance: t }
                ),
                !1
              );
            },
            dispose: function (e) {
              e = e.state;
              return i(), Yr(e, r);
            },
            getRenderState: function (e, t) {
              t = this.getWidgetRenderState(t);
              return F(
                F({}, e),
                {},
                {
                  configure: F(
                    F({}, t),
                    {},
                    {
                      widgetParams: F(
                        F({}, t.widgetParams),
                        {},
                        {
                          searchParameters: Xe(
                            new v.SearchParameters(
                              null == (e = e.configure)
                                ? void 0
                                : e.widgetParams.searchParameters
                            ),
                            new v.SearchParameters(
                              t.widgetParams.searchParameters
                            )
                          ).getQueryParams(),
                        }
                      ),
                    }
                  ),
                }
              );
            },
            getWidgetRenderState: function (e) {
              var n,
                e = e.helper;
              return (
                t.refine ||
                  (t.refine =
                    ((n = e),
                    function (e) {
                      var t = Yr(n.state, r),
                        t = Xe(t, new v.SearchParameters(e));
                      (r.searchParameters = e), n.setState(t).search();
                    })),
                { refine: t.refine, widgetParams: r }
              );
            },
            getWidgetSearchParameters: function (e, t) {
              t = t.uiState;
              return Xe(
                e,
                new v.SearchParameters(
                  F(F({}, t.configure), r.searchParameters)
                )
              );
            },
            getWidgetUiState: function (e) {
              return F(
                F({}, e),
                {},
                { configure: F(F({}, e.configure), r.searchParameters) }
              );
            },
          }
        );
      throw new Error(Zr("The `searchParameters` option expects an object."));
    };
  }
  var Gr = l({ name: "configure-related-items", connector: !0 });
  function ei(e) {
    var t = e.attributeName,
      n = e.attributeValue,
      e = e.attributeScore;
    return ""
      .concat(t, ":")
      .concat(n, "<score=")
      .concat(e || 1, ">");
  }
  function ti(n, r) {
    return function (e) {
      var t,
        e = e || {},
        a = e.hit,
        s = e.matchingPatterns,
        e = e.transformSearchParameters,
        e =
          void 0 === e
            ? function (e) {
                return e;
              }
            : e;
      if (!a) throw new Error(Gr("The `hit` option is required."));
      if (s)
        return (
          (t = Object.keys(s).reduce(function (e, t) {
            var n = s[t],
              r = Ce(a, t),
              i = n.score;
            return Array.isArray(r)
              ? [].concat(P(e), [
                  r.map(function (e) {
                    return ei({
                      attributeName: t,
                      attributeValue: e,
                      attributeScore: i,
                    });
                  }),
                ])
              : "string" == typeof r
              ? [].concat(P(e), [
                  ei({
                    attributeName: t,
                    attributeValue: r,
                    attributeScore: i,
                  }),
                ])
              : e;
          }, [])),
          (e = F(
            {},
            e(
              new v.SearchParameters({
                sumOrFiltersScores: !0,
                facetFilters: ["objectID:-".concat(a.objectID)],
                optionalFilters: t,
              })
            )
          )),
          F(
            F({}, Xr(n, r)({ searchParameters: e })),
            {},
            { $$type: "ais.configureRelatedItems" }
          )
        );
      throw new Error(Gr("The `matchingPatterns` option is required."));
    };
  }
  var ni = l({ name: "autocomplete", connector: !0 }),
    ri = l({ name: "query-rules", connector: !0 });
  function ii(e) {
    var i,
      a,
      s,
      t = this.helper,
      n = this.initialRuleContexts,
      r = this.trackedFilters,
      o = this.transformRuleContexts,
      e = e.state,
      c = e.ruleContexts || [],
      r =
        ((i = (r = { helper: t, sharedHelperState: e, trackedFilters: r })
          .helper),
        (a = r.sharedHelperState),
        (s = r.trackedFilters),
        Object.keys(s).reduce(function (e, t) {
          var n = Fe(i.lastResults || {}, a, !0)
              .filter(function (e) {
                return e.attribute === t;
              })
              .map(function (e) {
                return e.numericValue || e.name;
              }),
            r = (0, s[t])(n);
          return [].concat(
            P(e),
            P(
              n
                .filter(function (e) {
                  return r.includes(e);
                })
                .map(function (e) {
                  return "ais-"
                    .concat(t, "-")
                    .concat(e)
                    .replace(/[^a-z0-9-_]+/gi, "_");
                })
            )
          );
        }, [])),
      o = o([].concat(P(n), P(r))).slice(0, 10);
    He(c, o) ||
      t.overrideStateWithoutTriggeringChangeEvent(
        F(F({}, e), {}, { ruleContexts: o })
      );
  }
  function ai(l) {
    var r = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : R;
    return (
      f(l, ri()),
      function (i) {
        var a,
          e = i || {},
          t = e.trackedFilters,
          s = void 0 === t ? {} : t,
          t = e.transformRuleContexts,
          o =
            void 0 === t
              ? function (e) {
                  return e;
                }
              : t,
          t = e.transformItems,
          n =
            void 0 === t
              ? function (e) {
                  return e;
                }
              : t,
          c =
            (Object.keys(s).forEach(function (e) {
              if ("function" != typeof s[e])
                throw new Error(
                  ri(
                    "'The \"".concat(
                      e,
                      '" filter value in the `trackedFilters` option expects a function.'
                    )
                  )
                );
            }),
            0 < Object.keys(s).length),
          u = [];
        return {
          $$type: "ais.queryRules",
          init: function (e) {
            var t = e.helper,
              n = e.state,
              r = e.instantSearchInstance;
            (u = n.ruleContexts || []),
              (a = ii.bind({
                helper: t,
                initialRuleContexts: u,
                trackedFilters: s,
                transformRuleContexts: o,
              })),
              c &&
                (([
                  n.disjunctiveFacetsRefinements,
                  n.facetsRefinements,
                  n.hierarchicalFacetsRefinements,
                  n.numericRefinements,
                ].some(function (e) {
                  return Boolean(e && 0 < Object.keys(e).length);
                }) ||
                  Boolean(i.transformRuleContexts)) &&
                  a({ state: n }),
                t.on("change", a)),
              l(
                F(
                  F({}, this.getWidgetRenderState(e)),
                  {},
                  { instantSearchInstance: r }
                ),
                !0
              );
          },
          render: function (e) {
            var t = e.instantSearchInstance;
            l(
              F(
                F({}, this.getWidgetRenderState(e)),
                {},
                { instantSearchInstance: t }
              ),
              !1
            );
          },
          getWidgetRenderState: function (e) {
            var e = e.results,
              t = (e || {}).userData;
            return {
              items: n(void 0 === t ? [] : t, { results: e }),
              widgetParams: i,
            };
          },
          getRenderState: function (e, t) {
            return F(
              F({}, e),
              {},
              { queryRules: this.getWidgetRenderState(t) }
            );
          },
          dispose: function (e) {
            var t = e.helper,
              e = e.state;
            return (
              r(),
              c
                ? (t.removeListener("change", a),
                  e.setQueryParameter("ruleContexts", u))
                : e
            );
          },
        };
      }
    );
  }
  function si(e) {
    function t() {
      d(
        u(
          0 < arguments.length && void 0 !== arguments[0]
            ? arguments[0]
            : "initial"
        )
      );
    }
    function n() {
      r &&
        (r.stop(),
        r.removeEventListener("start", h),
        r.removeEventListener("error", f),
        r.removeEventListener("result", m),
        r.removeEventListener("end", p),
        (r = void 0));
    }
    var r,
      i = e.searchAsYouSpeak,
      a = e.language,
      s = e.onQueryChange,
      o = e.onStateChange,
      c = window.webkitSpeechRecognition || window.SpeechRecognition,
      u = function (e) {
        return {
          status: e,
          transcript: "",
          isSpeechFinal: !1,
          errorCode: void 0,
        };
      },
      l = u("initial"),
      d = function () {
        var e =
          0 < arguments.length && void 0 !== arguments[0] ? arguments[0] : {};
        (l = F(F({}, l), e)), o();
      },
      h = function () {
        d({ status: "waiting" });
      },
      f = function (e) {
        d({ status: "error", errorCode: e.error });
      },
      m = function (e) {
        d({
          status: "recognizing",
          transcript:
            (e.results[0] && e.results[0][0] && e.results[0][0].transcript) ||
            "",
          isSpeechFinal: e.results[0] && e.results[0].isFinal,
        }),
          i && l.transcript && s(l.transcript);
      },
      p = function () {
        l.errorCode || !l.transcript || i || s(l.transcript),
          "error" !== l.status && d({ status: "finished" });
      };
    return {
      getState: function () {
        return l;
      },
      isBrowserSupported: function () {
        return Boolean(c);
      },
      isListening: function () {
        return (
          "askingPermission" === l.status ||
          "waiting" === l.status ||
          "recognizing" === l.status
        );
      },
      startListening: function () {
        (r = new c()) &&
          (t("askingPermission"),
          (r.interimResults = !0),
          a && (r.lang = a),
          r.addEventListener("start", h),
          r.addEventListener("error", f),
          r.addEventListener("result", m),
          r.addEventListener("end", p),
          r.start());
      },
      stopListening: function () {
        n(), t("finished");
      },
      dispose: n,
    };
  }
  function oi(m) {
    var r = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : R;
    return (
      f(m, di()),
      function (u) {
        var e = u.searchAsYouSpeak,
          l = void 0 !== e && e,
          d = u.language,
          h = u.additionalQueryParameters,
          e = u.createVoiceSearchHelper,
          f = void 0 === e ? si : e;
        return {
          $$type: "ais.voiceSearch",
          init: function (e) {
            var t = e.instantSearchInstance;
            m(
              F(
                F({}, this.getWidgetRenderState(e)),
                {},
                { instantSearchInstance: t }
              ),
              !0
            );
          },
          render: function (e) {
            var t = e.instantSearchInstance;
            m(
              F(
                F({}, this.getWidgetRenderState(e)),
                {},
                { instantSearchInstance: t }
              ),
              !1
            );
          },
          getRenderState: function (e, t) {
            return F(
              F({}, e),
              {},
              { voiceSearch: this.getWidgetRenderState(t) }
            );
          },
          getWidgetRenderState: function (e) {
            var t = this,
              n = e.helper,
              r = e.instantSearchInstance,
              i =
                (this._refine ||
                  (this._refine = function (e) {
                    var t;
                    e !== n.state.query &&
                      ((t = d ? [d.split("-")[0]] : void 0),
                      n.setQueryParameter("queryLanguages", t),
                      "function" == typeof h &&
                        n.setState(
                          n.state.setQueryParameters(
                            F(
                              {
                                ignorePlurals: !0,
                                removeStopWords: !0,
                                optionalWords: e,
                              },
                              h({ query: e })
                            )
                          )
                        ),
                      n.setQuery(e).search());
                  }),
                this._voiceSearchHelper ||
                  (this._voiceSearchHelper = f({
                    searchAsYouSpeak: l,
                    language: d,
                    onQueryChange: function (e) {
                      return t._refine(e);
                    },
                    onStateChange: function () {
                      m(
                        F(
                          F({}, t.getWidgetRenderState(e)),
                          {},
                          { instantSearchInstance: r }
                        ),
                        !1
                      );
                    },
                  })),
                this._voiceSearchHelper),
              a = i.isBrowserSupported,
              s = i.isListening,
              o = i.startListening,
              c = i.stopListening,
              i = i.getState;
            return {
              isBrowserSupported: a(),
              isListening: s(),
              toggleListening: function () {
                a() && (s() ? c : o)();
              },
              voiceListeningState: i(),
              widgetParams: u,
            };
          },
          dispose: function (e) {
            var t,
              e = e.state,
              n = (this._voiceSearchHelper.dispose(), r(), e);
            return (
              "function" == typeof h &&
                ((t = (t = h({ query: "" }))
                  ? Object.keys(t).reduce(function (e, t) {
                      return (e[t] = void 0), e;
                    }, {})
                  : {}),
                (n = e.setQueryParameters(
                  F(
                    {
                      queryLanguages: void 0,
                      ignorePlurals: void 0,
                      removeStopWords: void 0,
                      optionalWords: void 0,
                    },
                    t
                  )
                ))),
              n.setQueryParameter("query", void 0)
            );
          },
          getWidgetUiState: function (e, t) {
            t = t.searchParameters.query || "";
            return t ? F(F({}, e), {}, { query: t }) : e;
          },
          getWidgetSearchParameters: function (e, t) {
            t = t.uiState;
            return e.setQueryParameter("query", t.query || "");
          },
        };
      }
    );
  }
  function ci() {
    var n = 0 < arguments.length && void 0 !== arguments[0] ? arguments[0] : R,
      t = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : R;
    return function (r) {
      var i = {};
      return {
        $$type: "ais.relevantSort",
        init: function (e) {
          var t = e.instantSearchInstance;
          n(
            F(
              F({}, this.getWidgetRenderState(e)),
              {},
              { instantSearchInstance: t }
            ),
            !0
          );
        },
        render: function (e) {
          var t = e.instantSearchInstance;
          n(
            F(
              F({}, this.getWidgetRenderState(e)),
              {},
              { instantSearchInstance: t }
            ),
            !1
          );
        },
        dispose: function (e) {
          e = e.state;
          return t(), e.setQueryParameter("relevancyStrictness", void 0);
        },
        getRenderState: function (e, t) {
          return F(
            F({}, e),
            {},
            { relevantSort: this.getWidgetRenderState(t) }
          );
        },
        getWidgetRenderState: function (e) {
          var t = e.results,
            n = e.helper;
          i.refine ||
            (i.refine = function (e) {
              n.setQueryParameter("relevancyStrictness", e).search();
            });
          (e = (t || {}).appliedRelevancyStrictness), (t = void 0 !== e);
          return {
            isRelevantSorted: void 0 !== e && 0 < e,
            isVirtualReplica: t,
            canRefine: t,
            refine: i.refine,
            widgetParams: r,
          };
        },
        getWidgetSearchParameters: function (e, t) {
          var t = t.uiState;
          return e.setQueryParameter(
            "relevancyStrictness",
            null != (t = t.relevantSort) ? t : e.relevancyStrictness
          );
        },
        getWidgetUiState: function (e, t) {
          t = t.searchParameters;
          return F(
            F({}, e),
            {},
            { relevantSort: t.relevancyStrictness || e.relevantSort }
          );
        },
      };
    };
  }
  function ui(u) {
    var l = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : R;
    return (
      f(u, hi()),
      function (t) {
        var e = t || {},
          n = e.escapeHTML,
          r = void 0 === n || n,
          n = e.transformItems,
          i =
            void 0 === n
              ? function (e) {
                  return e;
                }
              : n,
          a = e.objectIDs,
          s = e.limit,
          o = e.threshold,
          c = e.queryParameters;
        if (a && 0 !== a.length)
          return {
            dependsOn: "recommend",
            $$type: "ais.frequentlyBoughtTogether",
            init: function (e) {
              u(
                F(
                  F({}, this.getWidgetRenderState(e)),
                  {},
                  { instantSearchInstance: e.instantSearchInstance }
                ),
                !0
              );
            },
            render: function (e) {
              var t = this.getWidgetRenderState(e);
              u(
                F(
                  F({}, t),
                  {},
                  { instantSearchInstance: e.instantSearchInstance }
                ),
                !1
              );
            },
            getRenderState: function (e) {
              return e;
            },
            getWidgetRenderState: function (e) {
              e = e.results;
              return null == e
                ? { items: [], widgetParams: t }
                : (r && 0 < e.hits.length && (e.hits = ue(e.hits)),
                  { items: i(e.hits, { results: e }), widgetParams: t });
            },
            dispose: function (e) {
              e = e.recommendState;
              return l(), e.removeParams(this.$$id);
            },
            getWidgetParameters: function (e) {
              var n = this;
              return a.reduce(function (e, t) {
                return e.addFrequentlyBoughtTogether({
                  objectID: t,
                  threshold: o,
                  maxRecommendations: s,
                  queryParameters: F(F({}, c), r ? O : {}),
                  $$id: n.$$id,
                });
              }, e.removeParams(this.$$id));
            },
          };
        throw new Error(hi("The `objectIDs` option is required."));
      }
    );
  }
  function li(l) {
    var d = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : R;
    return (
      f(l, fi()),
      function (t) {
        var e = t || {},
          n = e.escapeHTML,
          r = void 0 === n || n,
          i = e.objectIDs,
          a = e.limit,
          s = e.threshold,
          o = e.fallbackParameters,
          c = e.queryParameters,
          n = e.transformItems,
          u =
            void 0 === n
              ? function (e) {
                  return e;
                }
              : n;
        if (i && 0 !== i.length)
          return {
            dependsOn: "recommend",
            $$type: "ais.lookingSimilar",
            init: function (e) {
              l(
                F(
                  F({}, this.getWidgetRenderState(e)),
                  {},
                  { instantSearchInstance: e.instantSearchInstance }
                ),
                !0
              );
            },
            render: function (e) {
              var t = this.getWidgetRenderState(e);
              l(
                F(
                  F({}, t),
                  {},
                  { instantSearchInstance: e.instantSearchInstance }
                ),
                !1
              );
            },
            getRenderState: function (e) {
              return e;
            },
            getWidgetRenderState: function (e) {
              e = e.results;
              return null == e
                ? { items: [], widgetParams: t }
                : (r && 0 < e.hits.length && (e.hits = ue(e.hits)),
                  { items: u(e.hits, { results: e }), widgetParams: t });
            },
            dispose: function (e) {
              e = e.recommendState;
              return d(), e.removeParams(this.$$id);
            },
            getWidgetParameters: function (e) {
              var n = this;
              return i.reduce(function (e, t) {
                return e.addLookingSimilar({
                  objectID: t,
                  maxRecommendations: a,
                  threshold: s,
                  fallbackParameters: F(F({}, o), r ? O : {}),
                  queryParameters: F(F({}, c), r ? O : {}),
                  $$id: n.$$id,
                });
              }, e.removeParams(this.$$id));
            },
          };
        throw new Error(fi("The `objectIDs` option is required."));
      }
    );
  }
  function i(n) {
    return function () {
      var e =
          0 < arguments.length && void 0 !== arguments[0] ? arguments[0] : {},
        t = e.descendantName,
        e = e.modifierName,
        t = t ? "-".concat(t) : "",
        e = e ? "--".concat(e) : "";
      return "".concat("ais", "-").concat(n).concat(t).concat(e);
    };
  }
  var di = l({ name: "voice-search", connector: !0 }),
    hi = l({ name: "frequently-bought-together", connector: !0 }),
    fi = l({ name: "looking-similar", connector: !0 }),
    ur = Z(st),
    e = Z(ot),
    lr = Object.freeze({
      __proto__: null,
      EXPERIMENTAL_connectAnswers: ur,
      EXPERIMENTAL_connectDynamicWidgets: e,
      connectDynamicWidgets: ot,
      connectClearRefinements: ct,
      connectCurrentRefinements: ht,
      connectHierarchicalMenu: yt,
      connectHits: _t,
      connectHitsWithInsights: tn,
      connectHitsPerPage: en,
      connectInfiniteHits: un,
      connectInfiniteHitsWithInsights: dn,
      connectMenu: ln,
      connectNumericMenu: pn,
      connectPagination: Rn,
      connectRange: Nn,
      connectRefinementList: xn,
      connectRelatedProducts: En,
      connectSearchBox: kn,
      connectSortBy: On,
      connectRatingMenu: Ln,
      connectStats: $n,
      connectToggleRefinement: Bn,
      connectTrendingItems: Un,
      connectBreadcrumb: qn,
      connectGeoSearch: Gn,
      connectPoweredBy: er,
      connectConfigure: Xr,
      EXPERIMENTAL_connectConfigureRelatedItems: ti,
      connectAutocomplete: function (n) {
        var t =
          1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : R;
        return (
          f(n, ni()),
          function (s) {
            var e = (s || {}).escapeHTML,
              o = void 0 === e || e,
              c = {};
            return {
              $$type: "ais.autocomplete",
              init: function (e) {
                var t = e.instantSearchInstance;
                n(
                  F(
                    F({}, this.getWidgetRenderState(e)),
                    {},
                    { instantSearchInstance: t }
                  ),
                  !0
                );
              },
              render: function (e) {
                var t = e.instantSearchInstance,
                  e = this.getWidgetRenderState(e);
                e.indices.forEach(function (e) {
                  (0, e.sendEvent)("view:internal", e.hits);
                }),
                  n(F(F({}, e), {}, { instantSearchInstance: t }), !1);
              },
              getRenderState: function (e, t) {
                return F(
                  F({}, e),
                  {},
                  { autocomplete: this.getWidgetRenderState(t) }
                );
              },
              getWidgetRenderState: function (e) {
                var n = this,
                  t = e.helper,
                  r = e.state,
                  i = e.scopedResults,
                  a = e.instantSearchInstance,
                  e =
                    (c.refine ||
                      (c.refine = function (e) {
                        t.setQuery(e).search();
                      }),
                    i.map(function (e) {
                      e.results.hits = o ? ue(e.results.hits) : e.results.hits;
                      var t = pe({
                        instantSearchInstance: a,
                        getIndex: function () {
                          return e.results.index;
                        },
                        widgetType: n.$$type,
                      });
                      return {
                        indexId: e.indexId,
                        indexName: e.results.index,
                        hits: e.results.hits,
                        results: e.results,
                        sendEvent: t,
                      };
                    }));
                return {
                  currentRefinement: r.query || "",
                  indices: e,
                  refine: c.refine,
                  widgetParams: s,
                };
              },
              getWidgetUiState: function (e, t) {
                t = t.searchParameters.query || "";
                return "" === t || (e && e.query === t)
                  ? e
                  : F(F({}, e), {}, { query: t });
              },
              getWidgetSearchParameters: function (e, t) {
                t = { query: t.uiState.query || "" };
                return o
                  ? e.setQueryParameters(F(F({}, t), O))
                  : e.setQueryParameters(t);
              },
              dispose: function (e) {
                (e = e.state), t(), (e = e.setQueryParameter("query", void 0));
                return o
                  ? e.setQueryParameters(
                      Object.keys(O).reduce(function (e, t) {
                        return F(F({}, e), {}, E({}, t, void 0));
                      }, {})
                    )
                  : e;
              },
            };
          }
        );
      },
      connectQueryRules: ai,
      connectVoiceSearch: oi,
      connectRelevantSort: ci,
      connectFrequentlyBoughtTogether: ui,
      connectLookingSimilar: li,
    }),
    mi = i("Highlight");
  function pi(e) {
    var t = e.attribute,
      n = e.highlightedTagName,
      n = void 0 === n ? "mark" : n,
      r = e.hit,
      e = e.cssClasses,
      e = void 0 === e ? {} : e,
      r = (Ce(r._highlightResult, t) || {}).value,
      t = void 0 === r ? "" : r,
      r =
        mi({ descendantName: "highlighted" }) +
        (e.highlighted ? " ".concat(e.highlighted) : "");
    return t
      .replace(
        new RegExp(u.highlightPreTag, "g"),
        "<".concat(n, ' class="').concat(r, '">')
      )
      .replace(new RegExp(u.highlightPostTag, "g"), "</".concat(n, ">"));
  }
  var gi = i("ReverseHighlight");
  function vi(e) {
    var t = e.attribute,
      n = e.highlightedTagName,
      n = void 0 === n ? "mark" : n,
      r = e.hit,
      e = e.cssClasses,
      e = void 0 === e ? {} : e,
      r = (Ce(r._highlightResult, t) || {}).value,
      t = void 0 === r ? "" : r,
      r =
        gi({ descendantName: "highlighted" }) +
        (e.highlighted ? " ".concat(e.highlighted) : "");
    return le(rt(xe(t)))
      .replace(
        new RegExp(u.highlightPreTag, "g"),
        "<".concat(n, ' class="').concat(r, '">')
      )
      .replace(new RegExp(u.highlightPostTag, "g"), "</".concat(n, ">"));
  }
  var yi = i("Snippet");
  function bi(e) {
    var t = e.attribute,
      n = e.highlightedTagName,
      n = void 0 === n ? "mark" : n,
      r = e.hit,
      e = e.cssClasses,
      e = void 0 === e ? {} : e,
      r = (Ce(r._snippetResult, t) || {}).value,
      t = void 0 === r ? "" : r,
      r =
        yi({ descendantName: "highlighted" }) +
        (e.highlighted ? " ".concat(e.highlighted) : "");
    return t
      .replace(
        new RegExp(u.highlightPreTag, "g"),
        "<".concat(n, ' class="').concat(r, '">')
      )
      .replace(new RegExp(u.highlightPostTag, "g"), "</".concat(n, ">"));
  }
  var Ri = i("ReverseSnippet");
  function Si(e) {
    var t = e.attribute,
      n = e.highlightedTagName,
      n = void 0 === n ? "mark" : n,
      r = e.hit,
      e = e.cssClasses,
      e = void 0 === e ? {} : e,
      r = (Ce(r._snippetResult, t) || {}).value,
      t = void 0 === r ? "" : r,
      r =
        Ri({ descendantName: "highlighted" }) +
        (e.highlighted ? " ".concat(e.highlighted) : "");
    return le(rt(xe(t)))
      .replace(
        new RegExp(u.highlightPreTag, "g"),
        "<".concat(n, ' class="').concat(r, '">')
      )
      .replace(new RegExp(u.highlightPostTag, "g"), "</".concat(n, ">"));
  }
  var _i = "_ALGOLIA";
  function wi() {
    var e = _i;
    if (
      "object" ===
        ("undefined" == typeof document ? "undefined" : W(document)) &&
      "string" == typeof document.cookie
    )
      for (
        var t = "".concat(e, "="), n = document.cookie.split(";"), r = 0;
        r < n.length;
        r++
      ) {
        for (var i = n[r]; " " === i.charAt(0); ) i = i.substring(1);
        if (0 === i.indexOf(t)) return i.substring(t.length, i.length);
      }
  }
  var Pi = ["page"];
  function Ni(e) {
    e = e || {};
    e.page;
    return j(e, Pi);
  }
  var xi = "ais.infiniteHits";
  var Ii = "2.15.0",
    Ci = "https://cdn.jsdelivr.net/npm/search-insights@".concat(
      Ii,
      "/dist/search-insights.min.js"
    );
  function Ti() {
    var e = 0 < arguments.length && void 0 !== arguments[0] ? arguments[0] : {},
      t = e.insightsClient,
      m = e.insightsInitParams,
      p = e.onEvent,
      n = e.$$internal,
      g = void 0 !== n && n,
      n = e.$$automatic,
      v = void 0 !== n && n,
      a = t,
      y =
        (t ||
          null === t ||
          it(function (e) {
            var r = e.window,
              i = r.AlgoliaAnalyticsObject || "aa";
            (a = "string" == typeof i ? r[i] : a) ||
              ((r.AlgoliaAnalyticsObject = i),
              r[i] ||
                ((r[i] = function () {
                  r[i].queue || (r[i].queue = []);
                  for (
                    var e = arguments.length, t = new Array(e), n = 0;
                    n < e;
                    n++
                  )
                    t[n] = arguments[n];
                  r[i].queue.push(t);
                }),
                (r[i].version = Ii),
                (r[i].shouldAddScript = !0)),
              (a = r[i]));
          }),
        a || R);
    return function (e) {
      var a = e.instantSearchInstance,
        e = a.middleware
          .filter(function (e) {
            return (
              "ais.insights" === e.instance.$$type && e.instance.$$internal
            );
          })
          .map(function (e) {
            return e.creator;
          });
      a.unuse.apply(a, P(e));
      var t,
        n,
        s,
        o,
        r = k(
          (e = a.client).transporter
            ? ((r = (t = e.transporter).headers || t.baseHeaders),
              (t = t.queryParameters || t.baseQueryParameters),
              [
                r[(n = "x-algolia-application-id")] || t[n],
                r[(n = "x-algolia-api-key")] || t[n],
              ])
            : [e.applicationID, e.apiKey],
          2
        ),
        c = r[0],
        u = r[1],
        l = void 0,
        d = void 0,
        h = void 0,
        f = void 0,
        i = y.queue;
      return (
        Array.isArray(i) &&
          ((t = ["setUserToken", "setAuthenticatedUserToken"].map(function (t) {
            var e =
              we(i.slice().reverse(), function (e) {
                return k(e, 1)[0] === t;
              }) || [];
            return k(e, 2)[1];
          })),
          (n = k(t, 2)),
          (l = n[0]),
          (d = n[1])),
        y("getUserToken", null, function (e, t) {
          h = Ei(t);
        }),
        y("getAuthenticatedUserToken", null, function (e, t) {
          f = Ei(t);
        }),
        (!m && Fi(y)) || y("init", F({ appId: c, apiKey: u, partial: !0 }, m)),
        {
          $$type: "ais.insights",
          $$internal: g,
          $$automatic: v,
          onStateChange: function () {},
          subscribe: function () {
            if (y.shouldAddScript) {
              var t =
                "[insights middleware]: could not load search-insights.js. Please load it manually following https://alg.li/insights-init";
              try {
                var e = document.createElement("script");
                (e.async = !0),
                  (e.src = Ci),
                  (e.onerror = function () {
                    a.emit("error", new Error(t));
                  }),
                  document.body.appendChild(e),
                  (y.shouldAddScript = !1);
              } catch (e) {
                (y.shouldAddScript = !1), a.emit("error", new Error(t));
              }
            }
          },
          started: function () {
            y("addAlgoliaAgent", "insights-middleware"),
              (o = a.mainHelper),
              (s = {
                userToken: o.state.userToken,
                clickAnalytics: o.state.clickAnalytics,
              }),
              v ||
                o.overrideStateWithoutTriggeringChangeEvent(
                  F(F({}, o.state), {}, { clickAnalytics: !0 })
                ),
              g || a.scheduleSearch();
            var r = function (e) {
                var t,
                  n =
                    1 < arguments.length &&
                    void 0 !== arguments[1] &&
                    arguments[1],
                  r = Ei(e);
                function i() {
                  o.overrideStateWithoutTriggeringChangeEvent(
                    F(F({}, o.state), {}, { userToken: r })
                  ),
                    t && t !== e && a.scheduleSearch();
                }
                r && ((t = o.state.userToken), n ? i() : setTimeout(i, 0));
              },
              e = wi();
            function t(e, t, n) {
              r(e, !0),
                t && y("setUserToken", t),
                n && y("setAuthenticatedUserToken", n);
            }
            e && r(e, !0);
            var e = f || h,
              n = d || l,
              i =
                (e ? t(e, h, f) : n && t(n, l, d),
                y("onUserTokenChange", r, { immediate: !0 }),
                y(
                  "onAuthenticatedUserTokenChange",
                  function (e) {
                    e ||
                      y("getUserToken", null, function (e, t) {
                        r(t);
                      }),
                      r(e);
                  },
                  { immediate: !0 }
                ),
                y);
            Fi(y) &&
              (i = function (e, t) {
                return y(e, t, {
                  headers: {
                    "X-Algolia-Application-Id": c,
                    "X-Algolia-API-Key": u,
                  },
                });
              }),
              (a.sendEventToInsights = function (e) {
                p
                  ? p(e, i)
                  : e.insightsMethod &&
                    ((e.payload.algoliaSource = ["instantsearch"]),
                    v &&
                      e.payload.algoliaSource.push("instantsearch-automatic"),
                    "internal" === e.eventModifier &&
                      e.payload.algoliaSource.push("instantsearch-internal"),
                    i(e.insightsMethod, e.payload));
              });
          },
          unsubscribe: function () {
            y("onUserTokenChange", void 0),
              y("onAuthenticatedUserTokenChange", void 0),
              (a.sendEventToInsights = R),
              o &&
                s &&
                (o.overrideStateWithoutTriggeringChangeEvent(
                  F(F({}, o.state), s)
                ),
                a.scheduleSearch());
          },
        }
      );
    };
  }
  function Fi(e) {
    var e = k((e.version || "").split(".").map(Number), 2),
      t = e[0],
      e = e[1];
    return 3 <= t || (2 === t && 6 <= e) || (1 === t && 10 <= e);
  }
  function Ei(e) {
    if (e) return "number" == typeof e ? e.toString() : e;
  }
  function ji() {
    return it(
      function (e) {
        return (
          -1 <
          (null == (e = e.window.navigator) || null == (e = e.userAgent)
            ? void 0
            : e.indexOf("Algolia Crawler"))
        );
      },
      {
        fallback: function () {
          return !1;
        },
      }
    );
  }
  function ki() {
    var e = (
        0 < arguments.length && void 0 !== arguments[0] ? arguments[0] : {}
      ).$$internal,
      a = void 0 !== e && e;
    return function (e) {
      var t = e.instantSearchInstance,
        n = { widgets: [] },
        r = document.createElement("meta"),
        i = document.querySelector("head");
      return (
        (r.name = "instantsearch:widgets"),
        {
          $$type: "ais.metadata",
          $$internal: a,
          onStateChange: function () {},
          subscribe: function () {
            setTimeout(function () {
              var e = t.client;
              (n.ua =
                e.transporter && e.transporter.userAgent
                  ? e.transporter.userAgent.value
                  : e._ua),
                (function r(e, i, a) {
                  var s = tt(i, i.mainIndex, i._initialUiState);
                  e.forEach(function (e) {
                    var t = {},
                      n =
                        (e.getWidgetRenderState &&
                          (n = e.getWidgetRenderState(s)) &&
                          n.widgetParams &&
                          (t = n.widgetParams),
                        Object.keys(t).filter(function (e) {
                          return void 0 !== t[e];
                        }));
                    a.widgets.push({
                      type: e.$$type,
                      widgetType: e.$$widgetType,
                      params: n,
                    }),
                      "ais.index" === e.$$type && r(e.getWidgets(), i, a);
                  });
                })(t.mainIndex.getWidgets(), t, n),
                t.middleware.forEach(function (e) {
                  return n.widgets.push({
                    middleware: !0,
                    type: e.instance.$$type,
                    internal: e.instance.$$internal,
                  });
                }),
                (r.content = JSON.stringify(n)),
                i.appendChild(r);
            }, 0);
          },
          started: function () {},
          unsubscribe: function () {
            r.remove();
          },
        }
      );
    };
  }
  function Oi(e, t) {
    for (
      var n = t && t.plainObjects ? Object.create(null) : {}, r = 0;
      r < e.length;
      ++r
    )
      void 0 !== e[r] && (n[r] = e[r]);
    return n;
  }
  function Li(e, t, n, r, i, a, s, o, c, u, l, d, h, f) {
    var m = e;
    if (
      ("function" == typeof s
        ? (m = s(t, m))
        : m instanceof Date
        ? (m = u(m))
        : "comma" === n &&
          Vi(m) &&
          (m = Ui.maybeMap(m, function (e) {
            return e instanceof Date ? u(e) : e;
          })),
      null === m)
    ) {
      if (r) return a && !h ? a(t, I.encoder, f, "key", l) : t;
      m = "";
    }
    if (Yi(m) || Ui.isBuffer(m)) {
      if (a) {
        e = h ? t : a(t, I.encoder, f, "key", l);
        if ("comma" === n && h) {
          for (
            var p = Ki.call(String(m), ","), g = "", v = 0;
            v < p.length;
            ++v
          )
            g += (0 === v ? "" : ",") + d(a(p[v], I.encoder, f, "value", l));
          return [d(e) + "=" + g];
        }
        return [d(e) + "=" + d(a(m, I.encoder, f, "value", l))];
      }
      return [d(t) + "=" + d(String(m))];
    }
    var y,
      b = [];
    if (void 0 !== m) {
      y =
        "comma" === n && Vi(m)
          ? [{ value: 0 < m.length ? m.join(",") || null : void 0 }]
          : Vi(s)
          ? s
          : ((e = Object.keys(m)), o ? e.sort(o) : e);
      for (var R = 0; R < y.length; ++R) {
        var S = y[R],
          _ = "object" == typeof S && void 0 !== S.value ? S.value : m[S];
        (i && null === _) ||
          ((S = Vi(m)
            ? "function" == typeof n
              ? n(t, S)
              : t
            : t + (c ? "." + S : "[" + S + "]")),
          Ji(b, Li(_, S, n, r, i, a, s, o, c, u, l, d, h, f)));
      }
    }
    return b;
  }
  function Mi(e) {
    e && (window.document.title = e);
  }
  var Hi = String.prototype.replace,
    Ai = /%20/g,
    ur = "RFC3986",
    Wi = {
      default: ur,
      formatters: {
        RFC1738: function (e) {
          return Hi.call(e, Ai, "+");
        },
        RFC3986: function (e) {
          return String(e);
        },
      },
      RFC1738: "RFC1738",
      RFC3986: ur,
    },
    Di = Object.prototype.hasOwnProperty,
    $i = Array.isArray,
    Bi = (function () {
      for (var e = [], t = 0; t < 256; ++t)
        e.push("%" + ((t < 16 ? "0" : "") + t.toString(16)).toUpperCase());
      return e;
    })(),
    Ui = {
      arrayToObject: Oi,
      assign: function (e, n) {
        return Object.keys(n).reduce(function (e, t) {
          return (e[t] = n[t]), e;
        }, e);
      },
      combine: function (e, t) {
        return [].concat(e, t);
      },
      compact: function (e) {
        for (
          var t = [{ obj: { o: e }, prop: "o" }], n = [], r = 0;
          r < t.length;
          ++r
        )
          for (
            var i = t[r], a = i.obj[i.prop], s = Object.keys(a), o = 0;
            o < s.length;
            ++o
          ) {
            var c = s[o],
              u = a[c];
            "object" == typeof u &&
              null !== u &&
              -1 === n.indexOf(u) &&
              (t.push({ obj: a, prop: c }), n.push(u));
          }
        for (var l = t; 1 < l.length; ) {
          var d = l.pop(),
            h = d.obj[d.prop];
          if ($i(h)) {
            for (var f = [], m = 0; m < h.length; ++m)
              void 0 !== h[m] && f.push(h[m]);
            d.obj[d.prop] = f;
          }
        }
        return e;
      },
      decode: function (t, e, n) {
        t = t.replace(/\+/g, " ");
        if ("iso-8859-1" === n) return t.replace(/%[0-9a-f]{2}/gi, unescape);
        try {
          return decodeURIComponent(t);
        } catch (e) {
          return t;
        }
      },
      encode: function (e, t, n, r, i) {
        if (0 === e.length) return e;
        var a = e;
        if (
          ("symbol" == typeof e
            ? (a = Symbol.prototype.toString.call(e))
            : "string" != typeof e && (a = String(e)),
          "iso-8859-1" === n)
        )
          return escape(a).replace(/%u[0-9a-f]{4}/gi, function (e) {
            return "%26%23" + parseInt(e.slice(2), 16) + "%3B";
          });
        for (var s = "", o = 0; o < a.length; ++o) {
          var c = a.charCodeAt(o);
          45 === c ||
          46 === c ||
          95 === c ||
          126 === c ||
          (48 <= c && c <= 57) ||
          (65 <= c && c <= 90) ||
          (97 <= c && c <= 122) ||
          (i === Wi.RFC1738 && (40 === c || 41 === c))
            ? (s += a.charAt(o))
            : c < 128
            ? (s += Bi[c])
            : c < 2048
            ? (s += Bi[192 | (c >> 6)] + Bi[128 | (63 & c)])
            : c < 55296 || 57344 <= c
            ? (s +=
                Bi[224 | (c >> 12)] +
                Bi[128 | ((c >> 6) & 63)] +
                Bi[128 | (63 & c)])
            : ((o += 1),
              (c = 65536 + (((1023 & c) << 10) | (1023 & a.charCodeAt(o)))),
              (s +=
                Bi[240 | (c >> 18)] +
                Bi[128 | ((c >> 12) & 63)] +
                Bi[128 | ((c >> 6) & 63)] +
                Bi[128 | (63 & c)]));
        }
        return s;
      },
      isBuffer: function (e) {
        return !(
          !e ||
          "object" != typeof e ||
          !(
            e.constructor &&
            e.constructor.isBuffer &&
            e.constructor.isBuffer(e)
          )
        );
      },
      isRegExp: function (e) {
        return "[object RegExp]" === Object.prototype.toString.call(e);
      },
      maybeMap: function (e, t) {
        if ($i(e)) {
          for (var n = [], r = 0; r < e.length; r += 1) n.push(t(e[r]));
          return n;
        }
        return t(e);
      },
      merge: function r(i, a, s) {
        if (!a) return i;
        if ("object" != typeof a) {
          if ($i(i)) i.push(a);
          else {
            if (!i || "object" != typeof i) return [i, a];
            ((s && (s.plainObjects || s.allowPrototypes)) ||
              !Di.call(Object.prototype, a)) &&
              (i[a] = !0);
          }
          return i;
        }
        var e;
        return i && "object" == typeof i
          ? ($i((e = i)) && !$i(a) && (e = Oi(i, s)),
            $i(i) && $i(a)
              ? (a.forEach(function (e, t) {
                  var n;
                  Di.call(i, t)
                    ? (n = i[t]) &&
                      "object" == typeof n &&
                      e &&
                      "object" == typeof e
                      ? (i[t] = r(n, e, s))
                      : i.push(e)
                    : (i[t] = e);
                }),
                i)
              : Object.keys(a).reduce(function (e, t) {
                  var n = a[t];
                  return Di.call(e, t) ? (e[t] = r(e[t], n, s)) : (e[t] = n), e;
                }, e))
          : [i].concat(a);
      },
    },
    qi = Object.prototype.hasOwnProperty,
    Qi = {
      brackets: function (e) {
        return e + "[]";
      },
      comma: "comma",
      indices: function (e, t) {
        return e + "[" + t + "]";
      },
      repeat: function (e) {
        return e;
      },
    },
    Vi = Array.isArray,
    Ki = String.prototype.split,
    zi = Array.prototype.push,
    Ji = function (e, t) {
      zi.apply(e, Vi(t) ? t : [t]);
    },
    Zi = Date.prototype.toISOString,
    e = Wi.default,
    I = {
      addQueryPrefix: !1,
      allowDots: !1,
      charset: "utf-8",
      charsetSentinel: !1,
      delimiter: "&",
      encode: !0,
      encoder: Ui.encode,
      encodeValuesOnly: !1,
      format: e,
      formatter: Wi.formatters[e],
      indices: !1,
      serializeDate: function (e) {
        return Zi.call(e);
      },
      skipNulls: !1,
      strictNullHandling: !1,
    },
    Yi = function (e) {
      return (
        "string" == typeof e ||
        "number" == typeof e ||
        "boolean" == typeof e ||
        "symbol" == typeof e ||
        "bigint" == typeof e
      );
    },
    Xi = Object.prototype.hasOwnProperty,
    Gi = Array.isArray,
    h = {
      allowDots: !1,
      allowPrototypes: !1,
      arrayLimit: 20,
      charset: "utf-8",
      charsetSentinel: !1,
      comma: !1,
      decoder: Ui.decode,
      delimiter: "&",
      depth: 5,
      ignoreQueryPrefix: !1,
      interpretNumericEntities: !1,
      parameterLimit: 1e3,
      parseArrays: !0,
      plainObjects: !1,
      strictNullHandling: !1,
    },
    ea = function (e) {
      return e.replace(/&#(\d+);/g, function (e, t) {
        return String.fromCharCode(parseInt(t, 10));
      });
    },
    ta = function (e, t) {
      return e && "string" == typeof e && t.comma && -1 < e.indexOf(",")
        ? e.split(",")
        : e;
    },
    na = "utf8=%26%2310003%3B",
    ra = "utf8=%E2%9C%93",
    ia = function (e, t, n, r) {
      for (var i = r ? t : ta(t, n), a = e.length - 1; 0 <= a; --a) {
        var s,
          o,
          c,
          u = e[a];
        "[]" === u && n.parseArrays
          ? (s = [].concat(i))
          : ((s = n.plainObjects ? Object.create(null) : {}),
            (o =
              "[" === u.charAt(0) && "]" === u.charAt(u.length - 1)
                ? u.slice(1, -1)
                : u),
            (c = parseInt(o, 10)),
            n.parseArrays || "" !== o
              ? !isNaN(c) &&
                u !== o &&
                String(c) === o &&
                0 <= c &&
                n.parseArrays &&
                c <= n.arrayLimit
                ? ((s = [])[c] = i)
                : "__proto__" !== o && (s[o] = i)
              : (s = { 0: i })),
          (i = s);
      }
      return i;
    },
    aa = {
      formats: Wi,
      parse: function (e, t) {
        var n = (function (e) {
          if (!e) return h;
          if (
            null !== e.decoder &&
            void 0 !== e.decoder &&
            "function" != typeof e.decoder
          )
            throw new TypeError("Decoder has to be a function.");
          if (
            void 0 !== e.charset &&
            "utf-8" !== e.charset &&
            "iso-8859-1" !== e.charset
          )
            throw new TypeError(
              "The charset option must be either utf-8, iso-8859-1, or undefined"
            );
          var t = (void 0 === e.charset ? h : e).charset;
          return {
            allowDots: void 0 === e.allowDots ? h.allowDots : !!e.allowDots,
            allowPrototypes: ("boolean" == typeof e.allowPrototypes ? e : h)
              .allowPrototypes,
            arrayLimit: ("number" == typeof e.arrayLimit ? e : h).arrayLimit,
            charset: t,
            charsetSentinel: ("boolean" == typeof e.charsetSentinel ? e : h)
              .charsetSentinel,
            comma: ("boolean" == typeof e.comma ? e : h).comma,
            decoder: ("function" == typeof e.decoder ? e : h).decoder,
            delimiter: ("string" == typeof e.delimiter ||
            Ui.isRegExp(e.delimiter)
              ? e
              : h
            ).delimiter,
            depth:
              "number" == typeof e.depth || !1 === e.depth ? +e.depth : h.depth,
            ignoreQueryPrefix: !0 === e.ignoreQueryPrefix,
            interpretNumericEntities: ("boolean" ==
            typeof e.interpretNumericEntities
              ? e
              : h
            ).interpretNumericEntities,
            parameterLimit: ("number" == typeof e.parameterLimit ? e : h)
              .parameterLimit,
            parseArrays: !1 !== e.parseArrays,
            plainObjects: ("boolean" == typeof e.plainObjects ? e : h)
              .plainObjects,
            strictNullHandling: ("boolean" == typeof e.strictNullHandling
              ? e
              : h
            ).strictNullHandling,
          };
        })(t);
        if ("" === e || null == e)
          return n.plainObjects ? Object.create(null) : {};
        for (
          var r =
              "string" == typeof e
                ? (function (e, t) {
                    var n,
                      r,
                      i,
                      a,
                      s = {},
                      e = t.ignoreQueryPrefix ? e.replace(/^\?/, "") : e,
                      o =
                        t.parameterLimit === 1 / 0 ? void 0 : t.parameterLimit,
                      c = e.split(t.delimiter, o),
                      u = -1,
                      l = t.charset;
                    if (t.charsetSentinel)
                      for (n = 0; n < c.length; ++n)
                        0 === c[n].indexOf("utf8=") &&
                          (c[n] === ra
                            ? (l = "utf-8")
                            : c[n] === na && (l = "iso-8859-1"),
                          (u = n),
                          (n = c.length));
                    for (n = 0; n < c.length; ++n)
                      n !== u &&
                        ((a =
                          -1 ===
                          (a =
                            -1 === (a = (r = c[n]).indexOf("]="))
                              ? r.indexOf("=")
                              : a + 1)
                            ? ((i = t.decoder(r, h.decoder, l, "key")),
                              t.strictNullHandling ? null : "")
                            : ((i = t.decoder(
                                r.slice(0, a),
                                h.decoder,
                                l,
                                "key"
                              )),
                              Ui.maybeMap(ta(r.slice(a + 1), t), function (e) {
                                return t.decoder(e, h.decoder, l, "value");
                              }))) &&
                          t.interpretNumericEntities &&
                          "iso-8859-1" === l &&
                          (a = ea(a)),
                        -1 < r.indexOf("[]=") && (a = Gi(a) ? [a] : a),
                        Xi.call(s, i)
                          ? (s[i] = Ui.combine(s[i], a))
                          : (s[i] = a));
                    return s;
                  })(e, n)
                : e,
            i = n.plainObjects ? Object.create(null) : {},
            a = Object.keys(r),
            s = 0;
          s < a.length;
          ++s
        )
          var o = a[s],
            o = (function (e, t, n, r) {
              if (e) {
                var i = n.allowDots ? e.replace(/\.([^.[]+)/g, "[$1]") : e,
                  a = /(\[[^[\]]*])/g,
                  s = 0 < n.depth && /(\[[^[\]]*])/.exec(i),
                  e = s ? i.slice(0, s.index) : i,
                  o = [];
                if (e) {
                  if (
                    !n.plainObjects &&
                    Xi.call(Object.prototype, e) &&
                    !n.allowPrototypes
                  )
                    return;
                  o.push(e);
                }
                for (
                  var c = 0;
                  0 < n.depth && null !== (s = a.exec(i)) && c < n.depth;

                ) {
                  if (
                    ((c += 1),
                    !n.plainObjects &&
                      Xi.call(Object.prototype, s[1].slice(1, -1)) &&
                      !n.allowPrototypes)
                  )
                    return;
                  o.push(s[1]);
                }
                return (
                  s && o.push("[" + i.slice(s.index) + "]"), ia(o, t, n, r)
                );
              }
            })(o, r[o], n, "string" == typeof e),
            i = Ui.merge(i, o, n);
        return Ui.compact(i);
      },
      stringify: function (e, t) {
        var n = e,
          r = (function (e) {
            if (!e) return I;
            if (
              null !== e.encoder &&
              void 0 !== e.encoder &&
              "function" != typeof e.encoder
            )
              throw new TypeError("Encoder has to be a function.");
            var t = e.charset || I.charset;
            if (
              void 0 !== e.charset &&
              "utf-8" !== e.charset &&
              "iso-8859-1" !== e.charset
            )
              throw new TypeError(
                "The charset option must be either utf-8, iso-8859-1, or undefined"
              );
            var n = Wi.default;
            if (void 0 !== e.format) {
              if (!qi.call(Wi.formatters, e.format))
                throw new TypeError("Unknown format option provided.");
              n = e.format;
            }
            var r = Wi.formatters[n],
              i = I.filter;
            return (
              ("function" != typeof e.filter && !Vi(e.filter)) ||
                (i = e.filter),
              {
                addQueryPrefix: ("boolean" == typeof e.addQueryPrefix ? e : I)
                  .addQueryPrefix,
                allowDots: void 0 === e.allowDots ? I.allowDots : !!e.allowDots,
                charset: t,
                charsetSentinel: ("boolean" == typeof e.charsetSentinel ? e : I)
                  .charsetSentinel,
                delimiter: (void 0 === e.delimiter ? I : e).delimiter,
                encode: ("boolean" == typeof e.encode ? e : I).encode,
                encoder: ("function" == typeof e.encoder ? e : I).encoder,
                encodeValuesOnly: ("boolean" == typeof e.encodeValuesOnly
                  ? e
                  : I
                ).encodeValuesOnly,
                filter: i,
                format: n,
                formatter: r,
                serializeDate: ("function" == typeof e.serializeDate ? e : I)
                  .serializeDate,
                skipNulls: ("boolean" == typeof e.skipNulls ? e : I).skipNulls,
                sort: "function" == typeof e.sort ? e.sort : null,
                strictNullHandling: ("boolean" == typeof e.strictNullHandling
                  ? e
                  : I
                ).strictNullHandling,
              }
            );
          })(t),
          i =
            ("function" == typeof r.filter
              ? (n = (0, r.filter)("", n))
              : Vi(r.filter) && (s = r.filter),
            []);
        if ("object" != typeof n || null === n) return "";
        var e =
            t && t.arrayFormat in Qi
              ? t.arrayFormat
              : !(t && "indices" in t) || t.indices
              ? "indices"
              : "repeat",
          a = Qi[e],
          s = s || Object.keys(n);
        r.sort && s.sort(r.sort);
        for (var o = 0; o < s.length; ++o) {
          var c = s[o];
          (r.skipNulls && null === n[c]) ||
            Ji(
              i,
              Li(
                n[c],
                c,
                a,
                r.strictNullHandling,
                r.skipNulls,
                r.encode ? r.encoder : null,
                r.filter,
                r.sort,
                r.allowDots,
                r.serializeDate,
                r.format,
                r.formatter,
                r.encodeValuesOnly,
                r.charset
              )
            );
        }
        (t = i.join(r.delimiter)), (e = !0 === r.addQueryPrefix ? "?" : "");
        return (
          r.charsetSentinel &&
            ("iso-8859-1" === r.charset
              ? (e += "utf8=%26%2310003%3B&")
              : (e += "utf8=%E2%9C%93&")),
          0 < t.length ? e + t : ""
        );
      },
    },
    sa = (function () {
      function l(e) {
        var n = this,
          t = e.windowTitle,
          r = e.writeDelay,
          r = void 0 === r ? 400 : r,
          i = e.createURL,
          a = e.parseURL,
          s = e.getLocation,
          o = e.start,
          c = e.dispose,
          u = e.push,
          e = e.cleanUrlOnDispose;
        D(this, l),
          E(this, "$$type", "ais.browser"),
          E(this, "windowTitle", void 0),
          E(this, "writeDelay", void 0),
          E(this, "_createURL", void 0),
          E(this, "parseURL", void 0),
          E(this, "getLocation", void 0),
          E(this, "writeTimer", void 0),
          E(this, "_onPopState", void 0),
          E(this, "inPopState", !1),
          E(this, "isDisposed", !1),
          E(this, "latestAcknowledgedHistory", 0),
          E(this, "_start", void 0),
          E(this, "_dispose", void 0),
          E(this, "_push", void 0),
          E(this, "_cleanUrlOnDispose", void 0),
          (this.windowTitle = t),
          (this.writeTimer = void 0),
          (this.writeDelay = r),
          (this._createURL = i),
          (this.parseURL = a),
          (this.getLocation = s),
          (this._start = o),
          (this._dispose = c),
          (this._push = u),
          (this._cleanUrlOnDispose = void 0 === e || e),
          it(function (e) {
            var e = e.window,
              t = n.windowTitle && n.windowTitle(n.read());
            Mi(t), (n.latestAcknowledgedHistory = e.history.length);
          });
      }
      return (
        $(l, [
          {
            key: "read",
            value: function () {
              return this.parseURL({
                qsModule: aa,
                location: this.getLocation(),
              });
            },
          },
          {
            key: "write",
            value: function (i) {
              var a = this;
              it(function (e) {
                var t = e.window,
                  n = a.createURL(i),
                  r = a.windowTitle && a.windowTitle(i);
                a.writeTimer && clearTimeout(a.writeTimer),
                  (a.writeTimer = setTimeout(function () {
                    Mi(r),
                      a.shouldWrite(n) &&
                        (a._push
                          ? a._push(n)
                          : t.history.pushState(i, r || "", n),
                        (a.latestAcknowledgedHistory = t.history.length)),
                      (a.inPopState = !1),
                      (a.writeTimer = void 0);
                  }, a.writeDelay));
              });
            },
          },
          {
            key: "onUpdate",
            value: function (e) {
              var t = this;
              this._start &&
                this._start(function () {
                  e(t.read());
                }),
                (this._onPopState = function () {
                  t.writeTimer &&
                    (clearTimeout(t.writeTimer), (t.writeTimer = void 0)),
                    (t.inPopState = !0),
                    e(t.read());
                }),
                it(function (e) {
                  e.window.addEventListener("popstate", t._onPopState);
                });
            },
          },
          {
            key: "createURL",
            value: function (e) {
              return this._createURL({
                qsModule: aa,
                routeState: e,
                location: this.getLocation(),
              });
            },
          },
          {
            key: "dispose",
            value: function () {
              var t = this;
              this._dispose && this._dispose(),
                (this.isDisposed = !0),
                it(function (e) {
                  e = e.window;
                  t._onPopState &&
                    e.removeEventListener("popstate", t._onPopState);
                }),
                this.writeTimer && clearTimeout(this.writeTimer),
                this._cleanUrlOnDispose && this.write({});
            },
          },
          {
            key: "start",
            value: function () {
              this.isDisposed = !1;
            },
          },
          {
            key: "shouldWrite",
            value: function (n) {
              var r = this;
              return it(function (e) {
                var t,
                  e = e.window;
                return (
                  !(r.isDisposed && !r._cleanUrlOnDispose) &&
                  ((t = !(
                    r.isDisposed &&
                    r.latestAcknowledgedHistory !== e.history.length
                  )),
                  !r.inPopState) &&
                  t &&
                  n !== e.location.href
                );
              });
            },
          },
        ]),
        l
      );
    })();
  function oa() {
    var e = 0 < arguments.length && void 0 !== arguments[0] ? arguments[0] : {},
      t = e.createURL,
      n = e.parseURL,
      r = e.writeDelay,
      i = e.windowTitle,
      a = e.getLocation,
      s = e.start,
      o = e.dispose,
      c = e.push,
      e = e.cleanUrlOnDispose;
    return new sa({
      createURL:
        void 0 === t
          ? function (e) {
              var t = e.qsModule,
                n = e.routeState,
                e = e.location,
                r = e.protocol,
                i = e.hostname,
                a = e.port,
                a = void 0 === a ? "" : a,
                s = e.pathname,
                e = e.hash,
                t = t.stringify(n),
                n = "" === a ? "" : ":".concat(a);
              return (
                t
                  ? ""
                      .concat(r, "//")
                      .concat(i)
                      .concat(n)
                      .concat(s, "?")
                      .concat(t)
                  : "".concat(r, "//").concat(i).concat(n).concat(s)
              ).concat(e);
            }
          : t,
      parseURL:
        void 0 === n
          ? function (e) {
              var t = e.qsModule,
                e = e.location;
              return t.parse(e.search.slice(1), { arrayLimit: 99 });
            }
          : n,
      writeDelay: void 0 === r ? 400 : r,
      windowTitle: i,
      getLocation:
        void 0 === a
          ? function () {
              return it(
                function (e) {
                  return e.window.location;
                },
                {
                  fallback: function () {
                    throw new Error(
                      "You need to provide `getLocation` to the `history` router in environments where `window` does not exist."
                    );
                  },
                }
              );
            }
          : a,
      start: s,
      dispose: o,
      push: c,
      cleanUrlOnDispose: e,
    });
  }
  var ca = ["configure"];
  function ua(e) {
    e.configure;
    return j(e, ca);
  }
  function la() {
    return {
      $$type: "ais.simple",
      stateToRoute: function (n) {
        return Object.keys(n).reduce(function (e, t) {
          return F(F({}, e), {}, E({}, t, ua(n[t])));
        }, {});
      },
      routeToState: function () {
        var n =
          0 < arguments.length && void 0 !== arguments[0] ? arguments[0] : {};
        return Object.keys(n).reduce(function (e, t) {
          return F(F({}, e), {}, E({}, t, ua(n[t])));
        }, {});
      },
    };
  }
  function da() {
    var e = 0 < arguments.length && void 0 !== arguments[0] ? arguments[0] : {},
      t = e.router,
      i = void 0 === t ? oa() : t,
      a = void 0 === (t = e.stateMapping) ? la() : t,
      s = void 0 !== (t = e.$$internal) && t;
    return function (e) {
      var t = e.instantSearchInstance;
      t._createURL = function (n) {
        var e =
            0 === t.mainIndex.getWidgets().length
              ? t._initialUiState
              : t.mainIndex.getWidgetUiState({}),
          e = Object.keys(n).reduce(function (e, t) {
            return F(F({}, e), {}, E({}, t, n[t]));
          }, e),
          e = a.stateToRoute(e);
        return i.createURL(e);
      };
      var n = void 0,
        r = t._initialUiState;
      return {
        $$type: "ais.router({router:"
          .concat(i.$$type || "__unknown__", ", stateMapping:")
          .concat(a.$$type || "__unknown__", "})"),
        $$internal: s,
        onStateChange: function (e) {
          (e = e.uiState), (e = a.stateToRoute(e));
          (void 0 !== n && He(n, e)) || (i.write(e), (n = e));
        },
        subscribe: function () {
          (t._initialUiState = F(F({}, r), a.routeToState(i.read()))),
            i.onUpdate(function (e) {
              0 < t.mainIndex.getWidgets().length &&
                t.setUiState(a.routeToState(e));
            });
        },
        started: function () {
          var e;
          null != (e = i.start) && e.call(i);
        },
        unsubscribe: function () {
          i.dispose();
        },
      };
    };
  }
  var ha = ["initialSearchParameters"],
    fa = ["initialRecommendParameters"],
    ma = l({ name: "index-widget" });
  function pa(e, t) {
    var n = t.state,
      r = t.recommendState,
      i = t.isPageReset,
      t = t._uiState;
    n !== e.state &&
      ((e.state = n),
      e.emit("change", {
        state: e.state,
        results: e.lastResults,
        isPageReset: i,
        _uiState: t,
      })),
      r !== e.recommendState && (e.recommendState = r);
  }
  function ga(e, n, t) {
    return e.reduce(
      function (e, t) {
        return !ve(t) && (t.getWidgetUiState || t.getWidgetState)
          ? t.getWidgetUiState
            ? t.getWidgetUiState(e, n)
            : t.getWidgetState(e, n)
          : e;
      },
      2 < arguments.length && void 0 !== t ? t : {}
    );
  }
  function va(e, t) {
    var n = t.initialSearchParameters,
      r = j(t, ha);
    return e.reduce(function (e, t) {
      return !t.getWidgetSearchParameters || ve(t)
        ? e
        : "search" === t.dependsOn && t.getWidgetParameters
        ? t.getWidgetParameters(e, r)
        : t.getWidgetSearchParameters(e, r);
    }, n);
  }
  function ya(e, t) {
    var n = t.initialRecommendParameters,
      r = j(t, fa);
    return e.reduce(function (e, t) {
      return !ve(t) && "recommend" === t.dependsOn && t.getWidgetParameters
        ? t.getWidgetParameters(e, r)
        : e;
    }, n);
  }
  function ba(e) {
    if (void 0 === e || void 0 === e.indexName)
      throw new Error(ma("The `indexName` option is required."));
    var s = e.indexName,
      o = void 0 === (e = e.indexId) ? s : e,
      c = [],
      u = {},
      l = null,
      d = null,
      h = null,
      f = null,
      m = null,
      p = !1,
      g = !1;
    return {
      $$type: "ais.index",
      $$widgetType: "ais.index",
      getIndexName: function () {
        return s;
      },
      getIndexId: function () {
        return o;
      },
      getHelper: function () {
        return h;
      },
      getResults: function () {
        var e;
        return null != (e = f) && e.lastResults
          ? ((f.lastResults._state = h.state), f.lastResults)
          : null;
      },
      getResultsForWidget: function (e) {
        var t;
        return "recommend" !== e.dependsOn || ve(e) || void 0 === e.$$id
          ? this.getResults()
          : null != (t = h) && t.lastRecommendResults
          ? h.lastRecommendResults[e.$$id]
          : null;
      },
      getPreviousState: function () {
        return m;
      },
      getScopedResults: function () {
        var e = this.getParent(),
          e = e ? e.getWidgets() : 0 === s.length ? this.getWidgets() : [this];
        return (function n(e) {
          return e.filter(ve).reduce(function (e, t) {
            return e.concat.apply(
              e,
              [
                {
                  indexId: t.getIndexId(),
                  results: t.getResults(),
                  helper: t.getHelper(),
                },
              ].concat(P(n(t.getWidgets())))
            );
          }, []);
        })(e);
      },
      getParent: function () {
        return d;
      },
      createURL: function (e) {
        return "function" == typeof e
          ? l._createURL(E({}, o, e(u)))
          : l._createURL(E({}, o, ga(c, { searchParameters: e, helper: h })));
      },
      getWidgets: function () {
        return c;
      },
      addWidgets: function (e) {
        var t = this;
        if (!Array.isArray(e))
          throw new Error(
            ma("The `addWidgets` method expects an array of widgets.")
          );
        if (
          e.some(function (e) {
            return "function" != typeof e.init && "function" != typeof e.render;
          })
        )
          throw new Error(
            ma(
              "The widget definition expects a `render` and/or an `init` method."
            )
          );
        return (
          e.forEach(function (e) {
            ve(e) ||
              (l && "recommend" === e.dependsOn
                ? (l._hasRecommendWidget = !0)
                : l
                ? (l._hasSearchWidget = !0)
                : "recommend" === e.dependsOn
                ? (p = !0)
                : (g = !0),
              "recommend" === (e = e).dependsOn && (e.$$id = a++));
          }),
          (c = c.concat(e)),
          l &&
            Boolean(e.length) &&
            (pa(h, {
              state: va(c, { uiState: u, initialSearchParameters: h.state }),
              recommendState: ya(c, {
                uiState: u,
                initialRecommendParameters: h.recommendState,
              }),
              _uiState: u,
            }),
            e.forEach(function (e) {
              e.getRenderState &&
                Ra({
                  renderState: e.getRenderState(
                    l.renderState[t.getIndexId()] || {},
                    tt(l, t, l._initialUiState)
                  ),
                  instantSearchInstance: l,
                  parent: t,
                });
            }),
            e.forEach(function (e) {
              e.init && e.init(tt(l, t, l._initialUiState));
            }),
            l.scheduleSearch()),
          this
        );
      },
      removeWidgets: function (t) {
        var e,
          n,
          r = this;
        if (!Array.isArray(t))
          throw new Error(
            ma("The `removeWidgets` method expects an array of widgets.")
          );
        if (
          t.some(function (e) {
            return "function" != typeof e.dispose;
          })
        )
          throw new Error(
            ma("The widget definition expects a `dispose` method.")
          );
        return (
          (c = c.filter(function (e) {
            return -1 === t.indexOf(e);
          })).forEach(function (e) {
            ve(e) ||
              (l && "recommend" === e.dependsOn
                ? (l._hasRecommendWidget = !0)
                : l
                ? (l._hasSearchWidget = !0)
                : "recommend" === e.dependsOn
                ? (p = !0)
                : (g = !0));
          }),
          l &&
            Boolean(t.length) &&
            ((n = (e = t.reduce(
              function (e, t) {
                t = t.dispose({
                  helper: h,
                  state: e.cleanedSearchState,
                  recommendState: e.cleanedRecommendState,
                  parent: r,
                });
                return (
                  t instanceof v.RecommendParameters
                    ? (e.cleanedRecommendState = t)
                    : t && (e.cleanedSearchState = t),
                  e
                );
              },
              {
                cleanedSearchState: h.state,
                cleanedRecommendState: h.recommendState,
              }
            )).cleanedSearchState),
            (e = e.cleanedRecommendState),
            (n = l.future.preserveSharedStateOnUnmount
              ? va(c, {
                  uiState: u,
                  initialSearchParameters: new v.SearchParameters({
                    index: this.getIndexName(),
                  }),
                })
              : va(c, {
                  uiState: ga(c, { searchParameters: n, helper: h }),
                  initialSearchParameters: n,
                })),
            (u = ga(c, { searchParameters: n, helper: h })),
            h.setState(n),
            (h.recommendState = e),
            c.length) &&
            l.scheduleSearch(),
          this
        );
      },
      init: function (e) {
        var i,
          t = this,
          n = e.instantSearchInstance,
          r = e.parent,
          a = e.uiState;
        null === h &&
          ((l = n),
          (d = r),
          (u = a[o] || {}),
          (i = n.mainHelper),
          (e = va(c, {
            uiState: u,
            initialSearchParameters: new v.SearchParameters({ index: s }),
          })),
          (r = ya(c, {
            uiState: u,
            initialRecommendParameters: new v.RecommendParameters(),
          })),
          ((h = v({}, e.index, e)).recommendState = r),
          (h.search = function () {
            return n.onStateChange
              ? (n.onStateChange({
                  uiState: n.mainIndex.getWidgetUiState({}),
                  setUiState: function (e) {
                    return n.setUiState(e, !1);
                  },
                }),
                i)
              : i.search();
          }),
          (h.searchWithoutTriggeringOnStateChange = function () {
            return i.search();
          }),
          (h.searchForFacetValues = function (e, t, n, r) {
            r = h.state.setQueryParameters(r);
            return i.searchForFacetValues(e, t, n, r);
          }),
          (f = i.derive(
            function () {
              return Xe.apply(
                void 0,
                [i.state].concat(
                  P(
                    (function (e) {
                      for (
                        var t = e.getParent(), n = [e.getHelper().state];
                        null !== t;

                      )
                        (n = [t.getHelper().state].concat(n)),
                          (t = t.getParent());
                      return n;
                    })(t)
                  )
                )
              );
            },
            function () {
              return t.getHelper().recommendState;
            }
          )),
          null !=
            (r =
              null == (e = n._initialResults)
                ? void 0
                : e[this.getIndexId()]) &&
            r.results &&
            ((e = new v.SearchResults(
              new v.SearchParameters(r.state),
              r.results
            )),
            (f.lastResults = e),
            (h.lastResults = e)),
          null != r &&
            r.recommendResults &&
            ((e = new v.RecommendResults(
              new v.RecommendParameters({ params: r.recommendResults.params }),
              r.recommendResults.results
            )),
            (f.lastRecommendResults = e),
            (h.lastRecommendResults = e)),
          h.on("change", function (e) {
            e.isPageReset &&
              !(function n(e) {
                e = e.filter(ve);
                0 !== e.length &&
                  e.forEach(function (e) {
                    var t = e.getHelper();
                    pa(t, {
                      state: t.state.resetPage(),
                      recommendState: t.recommendState,
                      isPageReset: !0,
                    }),
                      n(e.getWidgets());
                  });
              })(c);
          }),
          f.on("search", function () {
            n.scheduleStalledRender();
          }),
          f.on("result", function (e) {
            e = e.results;
            n.scheduleRender(),
              (h.lastResults = e),
              (m = null == e ? void 0 : e._state);
          }),
          f.on("recommend:result", function (e) {
            e = e.recommend;
            n.scheduleRender(), (h.lastRecommendResults = e.results);
          }),
          c.forEach(function (e) {
            e.getRenderState &&
              Ra({
                renderState: e.getRenderState(
                  n.renderState[t.getIndexId()] || {},
                  tt(n, t, a)
                ),
                instantSearchInstance: n,
                parent: t,
              });
          }),
          c.forEach(function (e) {
            e.init && e.init(tt(n, t, a));
          }),
          h.on("change", function (e) {
            var t = e.state,
              e = e._uiState;
            (u = ga(c, { searchParameters: t, helper: h }, e || {})),
              n.onStateChange || n.onInternalStateChange();
          }),
          r && n.scheduleRender(),
          p && (n._hasRecommendWidget = !0),
          g) &&
          (n._hasSearchWidget = !0);
      },
      render: function (e) {
        var t = this,
          n = e.instantSearchInstance,
          e =
            ("error" === n.status &&
              !n.mainHelper.hasPendingRequests() &&
              m &&
              h.setState(m),
            this.getResults() || (null != (e = f) && e.lastRecommendResults)
              ? c
              : c.filter(ve));
        (e = e.filter(function (e) {
          return (
            !e.shouldRender || e.shouldRender({ instantSearchInstance: n })
          );
        })).forEach(function (e) {
          e.getRenderState &&
            Ra({
              renderState: e.getRenderState(
                n.renderState[t.getIndexId()] || {},
                nt(n, t, e)
              ),
              instantSearchInstance: n,
              parent: t,
            });
        }),
          e.forEach(function (e) {
            e.render && e.render(nt(n, t, e));
          });
      },
      dispose: function () {
        var e,
          t = this;
        c.forEach(function (e) {
          e.dispose &&
            h &&
            e.dispose({
              helper: h,
              state: h.state,
              recommendState: h.recommendState,
              parent: t,
            });
        }),
          (d = l = null) != (e = h) && e.removeAllListeners(),
          (h = null) != (e = f) && e.detach(),
          (f = null);
      },
      getWidgetUiState: function (e) {
        return c.filter(ve).reduce(function (e, t) {
          return t.getWidgetUiState(e);
        }, F(F({}, e), {}, E({}, o, F(F({}, e[o]), u))));
      },
      getWidgetState: function (e) {
        return this.getWidgetUiState(e);
      },
      getWidgetSearchParameters: function (e, t) {
        t = t.uiState;
        return va(c, { uiState: t, initialSearchParameters: e });
      },
      refreshUiState: function () {
        u = ga(
          c,
          {
            searchParameters: this.getHelper().state,
            helper: this.getHelper(),
          },
          u
        );
      },
      setIndexUiState: function (e) {
        var t = "function" == typeof e ? e(u) : e;
        l.setUiState(function (e) {
          return F(F({}, e), {}, E({}, o, t));
        });
      },
    };
  }
  function Ra(e) {
    var t = e.renderState,
      n = e.instantSearchInstance,
      e = e.parent,
      e = (e || n.mainIndex).getIndexId();
    n.renderState = F(
      F({}, n.renderState),
      {},
      E({}, e, F(F({}, n.renderState[e]), t))
    );
  }
  function Sa(e, t) {
    return e.toLocaleString(t);
  }
  var _a = l({ name: "instantsearch" });
  function wa() {
    return "#";
  }
  var Pa = {
      preserveSharedStateOnUnmount: !1,
      persistHierarchicalRootCount: !1,
    },
    Na = (function () {
      B(p, rr);
      var m = V(p);
      function p(e) {
        D(this, p),
          E(y((n = m.call(this))), "client", void 0),
          E(y(n), "indexName", void 0),
          E(y(n), "insightsClient", void 0),
          E(y(n), "onStateChange", null),
          E(y(n), "future", void 0),
          E(y(n), "helper", void 0),
          E(y(n), "mainHelper", void 0),
          E(y(n), "mainIndex", void 0),
          E(y(n), "started", void 0),
          E(y(n), "templatesConfig", void 0),
          E(y(n), "renderState", {}),
          E(y(n), "_stalledSearchDelay", void 0),
          E(y(n), "_searchStalledTimer", void 0),
          E(y(n), "_initialUiState", void 0),
          E(y(n), "_initialResults", void 0),
          E(y(n), "_createURL", void 0),
          E(y(n), "_searchFunction", void 0),
          E(y(n), "_mainHelperSearch", void 0),
          E(y(n), "_hasSearchWidget", !1),
          E(y(n), "_hasRecommendWidget", !1),
          E(y(n), "_insights", void 0),
          E(y(n), "middleware", []),
          E(y(n), "sendEventToInsights", void 0),
          E(y(n), "status", "idle"),
          E(y(n), "error", void 0),
          E(
            y(n),
            "scheduleSearch",
            Se(function () {
              n.started && n.mainHelper.search();
            })
          ),
          E(
            y(n),
            "scheduleRender",
            Se(function () {
              var e,
                t =
                  !(0 < arguments.length && void 0 !== arguments[0]) ||
                  arguments[0];
              (null != (e = n.mainHelper) && e.hasPendingRequests()) ||
                (clearTimeout(n._searchStalledTimer),
                (n._searchStalledTimer = null),
                t && ((n.status = "idle"), (n.error = void 0))),
                n.mainIndex.render({ instantSearchInstance: y(n) }),
                n.emit("render");
            })
          ),
          E(
            y(n),
            "onInternalStateChange",
            Se(function () {
              var t = n.mainIndex.getWidgetUiState({});
              n.middleware.forEach(function (e) {
                e.instance.onStateChange({ uiState: t });
              });
            })
          ),
          n.setMaxListeners(100);
        var n,
          r,
          t = e.indexName,
          t = void 0 === t ? "" : t,
          i = e.numberLocale,
          a = e.initialUiState,
          a = void 0 === a ? {} : a,
          s = e.routing,
          s = void 0 === s ? null : s,
          o = e.insights,
          o = void 0 === o ? void 0 : o,
          c = e.searchFunction,
          u = e.stalledSearchDelay,
          u = void 0 === u ? 200 : u,
          l = e.searchClient,
          l = void 0 === l ? null : l,
          d = e.insightsClient,
          d = void 0 === d ? null : d,
          h = e.onStateChange,
          h = void 0 === h ? null : h,
          f = e.future,
          e = void 0 === f ? F(F({}, Pa), e.future || {}) : f;
        if (null === l)
          throw new Error(_a("The `searchClient` option is required."));
        if ("function" != typeof l.search)
          throw new Error(
            "The `searchClient` must implement a `search` method.\n\nSee: https://www.algolia.com/doc/guides/building-search-ui/going-further/backend-search/in-depth/backend-instantsearch/js/"
          );
        if (
          ("function" == typeof l.addAlgoliaAgent &&
            l.addAlgoliaAgent("instantsearch.js (".concat("4.73.4", ")")),
          d && "function" != typeof d)
        )
          throw new Error(
            _a("The `insightsClient` option should be a function.")
          );
        return (
          (n.client = l),
          (n.future = e),
          (n.insightsClient = d),
          (n.indexName = t),
          (n.helper = null),
          (n.mainHelper = null),
          (n.mainIndex = ba({ indexName: t })),
          (n.onStateChange = h),
          (n.started = !1),
          (n.templatesConfig = {
            helpers:
              ((r = { numberLocale: i }.numberLocale),
              {
                formatNumber: function (e, t) {
                  return Sa(Number(t(e)), r);
                },
                highlight: function (e, t) {
                  try {
                    return t(pi(F(F({}, JSON.parse(e)), {}, { hit: this })));
                  } catch (e) {
                    throw new Error(
                      '\nThe highlight helper expects a JSON object of the format:\n{ "attribute": "name", "highlightedTagName": "mark" }'
                    );
                  }
                },
                reverseHighlight: function (e, t) {
                  try {
                    return t(vi(F(F({}, JSON.parse(e)), {}, { hit: this })));
                  } catch (e) {
                    throw new Error(
                      '\n  The reverseHighlight helper expects a JSON object of the format:\n  { "attribute": "name", "highlightedTagName": "mark" }'
                    );
                  }
                },
                snippet: function (e, t) {
                  try {
                    return t(bi(F(F({}, JSON.parse(e)), {}, { hit: this })));
                  } catch (e) {
                    throw new Error(
                      '\nThe snippet helper expects a JSON object of the format:\n{ "attribute": "name", "highlightedTagName": "mark" }'
                    );
                  }
                },
                reverseSnippet: function (e, t) {
                  try {
                    return t(Si(F(F({}, JSON.parse(e)), {}, { hit: this })));
                  } catch (e) {
                    throw new Error(
                      '\n  The reverseSnippet helper expects a JSON object of the format:\n  { "attribute": "name", "highlightedTagName": "mark" }'
                    );
                  }
                },
                insights: function (e, t) {
                  try {
                    var n = JSON.parse(e),
                      r = n.method,
                      i = n.payload;
                    return t(Yt(r, F({ objectIDs: [this.objectID] }, i)));
                  } catch (e) {
                    throw new Error(
                      '\nThe insights helper expects a JSON object of the format:\n{ "method": "method-name", "payload": { "eventName": "name of the event" } }'
                    );
                  }
                },
              }),
            compileOptions: {},
          }),
          (n._stalledSearchDelay = u),
          (n._searchStalledTimer = null),
          (n._createURL = wa),
          (n._initialUiState = a),
          (n._initialResults = null),
          (n._insights = o),
          c && (n._searchFunction = c),
          (n.sendEventToInsights = R),
          s &&
            (((f = "boolean" == typeof s ? {} : s).$$internal = !0),
            n.use(da(f))),
          o &&
            (((l = "boolean" == typeof o ? {} : o).$$internal = !0),
            n.use(Ti(l))),
          ji() && n.use(ki({ $$internal: !0 })),
          n
        );
      }
      return (
        $(p, [
          {
            key: "_isSearchStalled",
            get: function () {
              return "stalled" === this.status;
            },
          },
          {
            key: "use",
            value: function () {
              for (
                var n = this, e = arguments.length, t = new Array(e), r = 0;
                r < e;
                r++
              )
                t[r] = arguments[r];
              var i = t.map(function (e) {
                var t = F(
                  {
                    $$type: "__unknown__",
                    $$internal: !1,
                    subscribe: R,
                    started: R,
                    unsubscribe: R,
                    onStateChange: R,
                  },
                  e({ instantSearchInstance: n })
                );
                return n.middleware.push({ creator: e, instance: t }), t;
              });
              return (
                this.started &&
                  i.forEach(function (e) {
                    e.subscribe(), e.started();
                  }),
                this
              );
            },
          },
          {
            key: "unuse",
            value: function () {
              for (
                var e = arguments.length, t = new Array(e), n = 0;
                n < e;
                n++
              )
                t[n] = arguments[n];
              return (
                this.middleware
                  .filter(function (e) {
                    return t.includes(e.creator);
                  })
                  .forEach(function (e) {
                    return e.instance.unsubscribe();
                  }),
                (this.middleware = this.middleware.filter(function (e) {
                  return !t.includes(e.creator);
                })),
                this
              );
            },
          },
          {
            key: "EXPERIMENTAL_use",
            value: function () {
              return this.use.apply(this, arguments);
            },
          },
          {
            key: "addWidget",
            value: function (e) {
              return this.addWidgets([e]);
            },
          },
          {
            key: "addWidgets",
            value: function (e) {
              if (!Array.isArray(e))
                throw new Error(
                  _a(
                    "The `addWidgets` method expects an array of widgets. Please use `addWidget`."
                  )
                );
              if (
                e.some(function (e) {
                  return (
                    "function" != typeof e.init && "function" != typeof e.render
                  );
                })
              )
                throw new Error(
                  _a(
                    "The widget definition expects a `render` and/or an `init` method."
                  )
                );
              return this.mainIndex.addWidgets(e), this;
            },
          },
          {
            key: "removeWidget",
            value: function (e) {
              return this.removeWidgets([e]);
            },
          },
          {
            key: "removeWidgets",
            value: function (e) {
              if (!Array.isArray(e))
                throw new Error(
                  _a(
                    "The `removeWidgets` method expects an array of widgets. Please use `removeWidget`."
                  )
                );
              if (
                e.some(function (e) {
                  return "function" != typeof e.dispose;
                })
              )
                throw new Error(
                  _a("The widget definition expects a `dispose` method.")
                );
              return this.mainIndex.removeWidgets(e), this;
            },
          },
          {
            key: "start",
            value: function () {
              var r = this;
              if (this.started)
                throw new Error(
                  _a("The `start` method has already been called once.")
                );
              var n,
                e,
                t,
                i,
                a,
                s =
                  this.mainHelper ||
                  v(this.client, this.indexName, void 0, {
                    persistHierarchicalRootCount:
                      this.future.persistHierarchicalRootCount,
                  });
              (s.search = function () {
                return (
                  (r.status = "loading"),
                  r.scheduleRender(!1),
                  r._hasSearchWidget && s.searchOnlyWithDerivedHelpers(),
                  r._hasRecommendWidget && s.recommend(),
                  s
                );
              }),
                this._searchFunction &&
                  ((n = {
                    search: function () {
                      return new Promise(R);
                    },
                  }),
                  (this._mainHelperSearch = s.search.bind(s)),
                  (s.search = function () {
                    var t = r.mainIndex.getHelper(),
                      e = v(n, t.state.index, t.state);
                    return (
                      e.once("search", function (e) {
                        e = e.state;
                        t.overrideStateWithoutTriggeringChangeEvent(e),
                          r._mainHelperSearch();
                      }),
                      e.on("change", function (e) {
                        e = e.state;
                        t.setState(e);
                      }),
                      r._searchFunction(e),
                      s
                    );
                  })),
                s.on("error", function (e) {
                  var n,
                    e = e.error;
                  e instanceof Error ||
                    ((n = e),
                    (e = Object.keys(n).reduce(function (e, t) {
                      return (e[t] = n[t]), e;
                    }, new Error(n.message)))),
                    (e.error = e),
                    (r.error = e),
                    (r.status = "error"),
                    r.scheduleRender(!1),
                    r.emit("error", e);
                }),
                (this.mainHelper = s),
                this.middleware.forEach(function (e) {
                  e.instance.subscribe();
                }),
                this.mainIndex.init({
                  instantSearchInstance: this,
                  parent: null,
                  uiState: this._initialUiState,
                }),
                this._initialResults
                  ? (Oe(this.client, this._initialResults),
                    (t = this.mainHelper),
                    (i = this._initialResults),
                    (a = Object.keys(i).reduce(function (e, t) {
                      t = i[t];
                      return t.recommendResults
                        ? F(F({}, e), t.recommendResults.results)
                        : e;
                    }, {})),
                    (t._recommendCache = a),
                    (e = this.scheduleSearch),
                    (this.scheduleSearch = Se(R)),
                    Se(function () {
                      r.scheduleSearch = e;
                    })())
                  : 0 < this.mainIndex.getWidgets().length &&
                    this.scheduleSearch(),
                (this.helper = this.mainIndex.getHelper()),
                (this.started = !0),
                this.middleware.forEach(function (e) {
                  e.instance.started();
                }),
                void 0 === this._insights &&
                  s.derivedHelpers[0].once("result", function () {
                    r.mainIndex.getScopedResults().some(function (e) {
                      e = e.results;
                      return null == e ? void 0 : e._automaticInsights;
                    }) && r.use(Ti({ $$internal: !0, $$automatic: !0 }));
                  });
            },
          },
          {
            key: "dispose",
            value: function () {
              var e;
              this.scheduleSearch.cancel(),
                this.scheduleRender.cancel(),
                clearTimeout(this._searchStalledTimer),
                this.removeWidgets(this.mainIndex.getWidgets()),
                this.mainIndex.dispose(),
                (this.started = !1),
                this.removeAllListeners(),
                null != (e = this.mainHelper) && e.removeAllListeners(),
                (this.mainHelper = null),
                (this.helper = null),
                this.middleware.forEach(function (e) {
                  e.instance.unsubscribe();
                });
            },
          },
          {
            key: "scheduleStalledRender",
            value: function () {
              var e = this;
              this._searchStalledTimer ||
                (this._searchStalledTimer = setTimeout(function () {
                  (e.status = "stalled"), e.scheduleRender();
                }, this._stalledSearchDelay));
            },
          },
          {
            key: "setUiState",
            value: function (e) {
              var t = this,
                n =
                  !(1 < arguments.length && void 0 !== arguments[1]) ||
                  arguments[1];
              if (!this.mainHelper)
                throw new Error(
                  _a(
                    "The `start` method needs to be called before `setUiState`."
                  )
                );
              this.mainIndex.refreshUiState();
              var r =
                "function" == typeof e
                  ? e(this.mainIndex.getWidgetUiState({}))
                  : e;
              this.onStateChange && n
                ? this.onStateChange({
                    uiState: r,
                    setUiState: function (e) {
                      ye("function" == typeof e ? e(r) : e, t.mainIndex),
                        t.scheduleSearch(),
                        t.onInternalStateChange();
                    },
                  })
                : (ye(r, this.mainIndex),
                  this.scheduleSearch(),
                  this.onInternalStateChange());
            },
          },
          {
            key: "getUiState",
            value: function () {
              return (
                this.started && this.mainIndex.refreshUiState(),
                this.mainIndex.getWidgetUiState({})
              );
            },
          },
          {
            key: "createURL",
            value: function () {
              if (this.started)
                return this._createURL(
                  0 < arguments.length && void 0 !== arguments[0]
                    ? arguments[0]
                    : {}
                );
              throw new Error(
                _a("The `start` method needs to be called before `createURL`.")
              );
            },
          },
          {
            key: "refresh",
            value: function () {
              if (!this.mainHelper)
                throw new Error(
                  _a("The `start` method needs to be called before `refresh`.")
                );
              this.mainHelper.clearCache().search();
            },
          },
        ]),
        p
      );
    })(),
    tn = Object.freeze({ __proto__: null, history: oa }),
    xa = ["configure"];
  function Ia(e) {
    e.configure;
    return j(e, xa);
  }
  (dn = Object.freeze({
    __proto__: null,
    simple: la,
    singleIndex: function (t) {
      return {
        $$type: "ais.singleIndex",
        stateToRoute: function (e) {
          return Ia(e[t] || {});
        },
        routeToState: function () {
          return E(
            {},
            t,
            Ia(
              0 < arguments.length && void 0 !== arguments[0]
                ? arguments[0]
                : {}
            )
          );
        },
      };
    },
  })),
    (ur = Object.freeze({
      __proto__: null,
      createInsightsMiddleware: Ti,
      createRouterMiddleware: da,
      isMetadataEnabled: ji,
      createMetadataMiddleware: ki,
    }));
  function Ca(e) {
    return e &&
      e.__esModule &&
      Object.prototype.hasOwnProperty.call(e, "default")
      ? e.default
      : e;
  }
  function Ta(e, t) {
    return e((t = { exports: {} }), t.exports), t.exports;
  }
  var Fa = Ca(
      Ta(function (e) {
        function t() {
          return (
            (e.exports = t =
              Object.assign
                ? Object.assign.bind()
                : function (e) {
                    for (var t = 1; t < arguments.length; t++) {
                      var n,
                        r = arguments[t];
                      for (n in r)
                        Object.prototype.hasOwnProperty.call(r, n) &&
                          (e[n] = r[n]);
                    }
                    return e;
                  }),
            (e.exports.__esModule = !0),
            (e.exports.default = e.exports),
            t.apply(this, arguments)
          );
        }
        (e.exports = t),
          (e.exports.__esModule = !0),
          (e.exports.default = e.exports);
      })
    ),
    Ea = Ta(function (t) {
      function n(e) {
        return (
          (t.exports = n =
            "function" == typeof Symbol && "symbol" == typeof Symbol.iterator
              ? function (e) {
                  return typeof e;
                }
              : function (e) {
                  return e &&
                    "function" == typeof Symbol &&
                    e.constructor === Symbol &&
                    e !== Symbol.prototype
                    ? "symbol"
                    : typeof e;
                }),
          (t.exports.__esModule = !0),
          (t.exports.default = t.exports),
          n(e)
        );
      }
      (t.exports = n),
        (t.exports.__esModule = !0),
        (t.exports.default = t.exports);
    }),
    ja =
      (Ca(Ea),
      Ta(function (e) {
        var r = Ea.default;
        (e.exports = function (e, t) {
          if ("object" !== r(e) || null === e) return e;
          var n = e[Symbol.toPrimitive];
          if (void 0 === n) return ("string" === t ? String : Number)(e);
          if (((n = n.call(e, t || "default")), "object" !== r(n))) return n;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }),
          (e.exports.__esModule = !0),
          (e.exports.default = e.exports);
      })),
    ka =
      (Ca(ja),
      Ta(function (e) {
        var t = Ea.default;
        (e.exports = function (e) {
          return (e = ja(e, "string")), "symbol" === t(e) ? e : String(e);
        }),
          (e.exports.__esModule = !0),
          (e.exports.default = e.exports);
      })),
    e =
      (Ca(ka),
      Ta(function (e) {
        (e.exports = function (e, t, n) {
          return (
            (t = ka(t)) in e
              ? Object.defineProperty(e, t, {
                  value: n,
                  enumerable: !0,
                  configurable: !0,
                  writable: !0,
                })
              : (e[t] = n),
            e
          );
        }),
          (e.exports.__esModule = !0),
          (e.exports.default = e.exports);
      })),
    Oa = Ca(e),
    La = Ta(function (e) {
      (e.exports = function (e, t) {
        if (null == e) return {};
        for (var n, r = {}, i = Object.keys(e), a = 0; a < i.length; a++)
          (n = i[a]), 0 <= t.indexOf(n) || (r[n] = e[n]);
        return r;
      }),
        (e.exports.__esModule = !0),
        (e.exports.default = e.exports);
    }),
    e =
      (Ca(La),
      Ta(function (e) {
        (e.exports = function (e, t) {
          if (null == e) return {};
          var n,
            r = La(e, t);
          if (Object.getOwnPropertySymbols)
            for (
              var i = Object.getOwnPropertySymbols(e), a = 0;
              a < i.length;
              a++
            )
              (n = i[a]),
                0 <= t.indexOf(n) ||
                  (Object.prototype.propertyIsEnumerable.call(e, n) &&
                    (r[n] = e[n]));
          return r;
        }),
          (e.exports.__esModule = !0),
          (e.exports.default = e.exports);
      })),
    Ma = Ca(e);
  function C() {
    for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++)
      t[n] = arguments[n];
    return t
      .reduce(function (e, t) {
        return Array.isArray(t) ? e.concat(t) : e.concat([t]);
      }, [])
      .filter(Boolean)
      .join(" ");
  }
  function Ha(e) {
    var t = e.createElement,
      n = e.Fragment;
    return function () {
      return t(n, null, "No results");
    };
  }
  function Aa(e) {
    var r = e.createElement;
    return function (e) {
      var t = e.classNames,
        n = e.items,
        e = e.translations;
      return n && !(n.length < 1) && e.title
        ? r("h3", { className: (void 0 === t ? {} : t).title }, e.title)
        : null;
    };
  }
  function Wa(e) {
    var t = e.createElement,
      n = e.Fragment;
    return function (e) {
      return t(n, null, JSON.stringify(e.item, null, 2));
    };
  }
  function Da(e) {
    var a = e.createElement;
    return function (e) {
      var t = e.classNames,
        n = void 0 === t ? {} : t,
        r = e.itemComponent,
        t = e.items,
        i = e.sendEvent;
      return a(
        "div",
        { className: n.container },
        a(
          "ol",
          { className: n.list },
          t.map(function (e) {
            return a(
              "li",
              { key: e.objectID, className: n.item, onClick: i, onAuxClick: i },
              a(r, { item: e })
            );
          })
        )
      );
    };
  }
  var $a = [
    "classNames",
    "emptyComponent",
    "headerComponent",
    "itemComponent",
    "view",
    "items",
    "status",
    "translations",
    "sendEvent",
  ];
  function Ba(t, e) {
    var n,
      r = Object.keys(t);
    return (
      Object.getOwnPropertySymbols &&
        ((n = Object.getOwnPropertySymbols(t)),
        e &&
          (n = n.filter(function (e) {
            return Object.getOwnPropertyDescriptor(t, e).enumerable;
          })),
        r.push.apply(r, n)),
      r
    );
  }
  var Ua = [
    "parts",
    "highlightedTagName",
    "nonHighlightedTagName",
    "separator",
    "className",
    "classNames",
  ];
  var qa = [
    "classNames",
    "hits",
    "itemComponent",
    "sendEvent",
    "emptyComponent",
    "banner",
    "bannerComponent",
  ];
  var Qa = [
    "classNames",
    "emptyComponent",
    "headerComponent",
    "itemComponent",
    "view",
    "items",
    "status",
    "translations",
    "sendEvent",
  ];
  function Va(t, e) {
    var n,
      r = Object.keys(t);
    return (
      Object.getOwnPropertySymbols &&
        ((n = Object.getOwnPropertySymbols(t)),
        e &&
          (n = n.filter(function (e) {
            return Object.getOwnPropertyDescriptor(t, e).enumerable;
          })),
        r.push.apply(r, n)),
      r
    );
  }
  var Ka = [
    "classNames",
    "emptyComponent",
    "headerComponent",
    "itemComponent",
    "view",
    "items",
    "status",
    "translations",
    "sendEvent",
  ];
  function za(t, e) {
    var n,
      r = Object.keys(t);
    return (
      Object.getOwnPropertySymbols &&
        ((n = Object.getOwnPropertySymbols(t)),
        e &&
          (n = n.filter(function (e) {
            return Object.getOwnPropertyDescriptor(t, e).enumerable;
          })),
        r.push.apply(r, n)),
      r
    );
  }
  var Ja = [
    "classNames",
    "emptyComponent",
    "headerComponent",
    "itemComponent",
    "view",
    "items",
    "status",
    "translations",
    "sendEvent",
  ];
  function Za(t, e) {
    var n,
      r = Object.keys(t);
    return (
      Object.getOwnPropertySymbols &&
        ((n = Object.getOwnPropertySymbols(t)),
        e &&
          (n = n.filter(function (e) {
            return Object.getOwnPropertyDescriptor(t, e).enumerable;
          })),
        r.push.apply(r, n)),
      r
    );
  }
  function H(e) {
    var t = e.defaultTemplates,
      n = e.templates;
    return F(
      { templatesConfig: e.templatesConfig },
      (function (a, e) {
        var s = 1 < arguments.length && void 0 !== e ? e : {};
        return We([].concat(P(Object.keys(a || {})), P(Object.keys(s)))).reduce(
          function (e, t) {
            var n = a ? a[t] : void 0,
              r = s[t],
              i = void 0 !== r && r !== n;
            return (
              (e.templates[t] = i ? r : n),
              (e.useCustomCompileOptions[t] = i),
              e
            );
          },
          { templates: {}, useCustomCompileOptions: {} }
        );
      })(t, n)
    );
  }
  var e = Ta(function (e, t) {
      function b(e) {
        return e.trim ? e.trim() : e.replace(/^\s*|\s*$/g, "");
      }
      function R(e, t, n) {
        if (t.charAt(n) == e.charAt(0)) {
          for (var r = 1, i = e.length; r < i; r++)
            if (t.charAt(n + r) != e.charAt(r)) return;
          return 1;
        }
      }
      function c(e, t, n, r) {
        for (
          var i = [], a = null, s = null, o = n[n.length - 1];
          0 < e.length;

        ) {
          if (((s = e.shift()), o && "<" == o.tag && !(s.tag in p)))
            throw new Error("Illegal content in < super tag.");
          if (
            S.tags[s.tag] <= S.tags.$ ||
            (function (e, t) {
              for (var n = 0, r = t.length; n < r; n++)
                if (t[n].o == e.n) return (e.tag = "#");
            })(s, r)
          )
            n.push(s), (s.nodes = c(e, s.tag, n, r));
          else {
            if ("/" == s.tag) {
              if (0 === n.length)
                throw new Error("Closing tag without opener: /" + s.n);
              if (
                ((a = n.pop()),
                s.n == a.n ||
                  (function (e, t, n) {
                    for (var r = 0, i = n.length; r < i; r++)
                      if (n[r].c == e && n[r].o == t) return 1;
                  })(s.n, a.n, r))
              )
                return (a.end = s.i), i;
              throw new Error("Nesting error: " + a.n + " vs. " + s.n);
            }
            "\n" == s.tag && (s.last = 0 == e.length || "\n" == e[0].tag);
          }
          i.push(s);
        }
        if (0 < n.length) throw new Error("missing closing tag: " + n.pop().n);
        return i;
      }
      function r(e) {
        var t,
          n = [];
        for (t in e.partials)
          n.push(
            '"' +
              i(t) +
              '":{name:"' +
              i(e.partials[t].name) +
              '", ' +
              r(e.partials[t]) +
              "}"
          );
        return (
          "partials: {" +
          n.join(",") +
          "}, subs: " +
          (function (e) {
            var t,
              n = [];
            for (t in e)
              n.push('"' + i(t) + '": function(c,p,t,i) {' + e[t] + "}");
            return "{ " + n.join(",") + " }";
          })(e.subs)
        );
      }
      function i(e) {
        return e
          .replace(h, "\\\\")
          .replace(u, '\\"')
          .replace(l, "\\n")
          .replace(d, "\\r")
          .replace(f, "\\u2028")
          .replace(m, "\\u2029");
      }
      function n(e) {
        return ~e.indexOf(".") ? "d" : "f";
      }
      function a(e, t) {
        var n = "<" + (t.prefix || "") + e.n + g++;
        return (
          (t.partials[n] = { name: e.n, partials: {} }),
          (t.code +=
            't.b(t.rp("' + i(n) + '",c,p,"' + (e.indent || "") + '"));'),
          n
        );
      }
      function s(e, t) {
        t.code += "t.b(t.t(t." + n(e.n) + '("' + i(e.n) + '",c,p,0)));';
      }
      function o(e) {
        return "t.b(" + e + ");";
      }
      var S, _, u, l, d, h, f, m, p, g;
      (_ = /\S/),
        (u = /\"/g),
        (l = /\n/g),
        (d = /\r/g),
        (h = /\\/g),
        (f = /\u2028/),
        (m = /\u2029/),
        ((S = t).tags = {
          "#": 1,
          "^": 2,
          "<": 3,
          $: 4,
          "/": 5,
          "!": 6,
          ">": 7,
          "=": 8,
          _v: 9,
          "{": 10,
          "&": 11,
          _t: 12,
        }),
        (S.scan = function (e, t) {
          var n,
            r,
            i,
            a,
            s,
            o = e.length,
            c = 0,
            u = null,
            l = "",
            d = [],
            h = !1,
            f = 0,
            m = 0,
            p = "{{",
            g = "}}";
          function v() {
            0 < l.length &&
              (d.push({ tag: "_t", text: new String(l) }), (l = ""));
          }
          function y(e, t) {
            if (
              (v(),
              e &&
                (function () {
                  for (var e = !0, t = m; t < d.length; t++)
                    if (
                      !(e =
                        S.tags[d[t].tag] < S.tags._v ||
                        ("_t" == d[t].tag && null === d[t].text.match(_)))
                    )
                      return;
                  return e;
                })())
            )
              for (var n, r = m; r < d.length; r++)
                d[r].text &&
                  ((n = d[r + 1]) &&
                    ">" == n.tag &&
                    (n.indent = d[r].text.toString()),
                  d.splice(r, 1));
            else t || d.push({ tag: "\n" });
            (h = !1), (m = d.length);
          }
          for (
            t && ((t = t.split(" ")), (p = t[0]), (g = t[1])), f = 0;
            f < o;
            f++
          )
            0 == c
              ? R(p, e, f)
                ? (--f, v(), (c = 1))
                : "\n" == e.charAt(f)
                ? y(h)
                : (l += e.charAt(f))
              : 1 == c
              ? ((f += p.length - 1),
                (c =
                  "=" ==
                  (u = (n = S.tags[e.charAt(f + 1)]) ? e.charAt(f + 1) : "_v")
                    ? ((i = f),
                      (s = a = void 0),
                      (a = "=" + g),
                      (s = (r = e).indexOf(a, i)),
                      (r = b(r.substring(r.indexOf("=", i) + 1, s)).split(" ")),
                      (p = r[0]),
                      (g = r[r.length - 1]),
                      (f = s + a.length - 1),
                      0)
                    : (n && f++, 2)),
                (h = f))
              : R(g, e, f)
              ? (d.push({
                  tag: u,
                  n: b(l),
                  otag: p,
                  ctag: g,
                  i: "/" == u ? h - p.length : f + g.length,
                }),
                (l = ""),
                (f += g.length - 1),
                (c = 0),
                "{" == u &&
                  ("}}" == g
                    ? f++
                    : "}" === (i = d[d.length - 1]).n.substr(i.n.length - 1) &&
                      (i.n = i.n.substring(0, i.n.length - 1))))
              : (l += e.charAt(f));
          return y(h, !0), d;
        }),
        (p = { _t: !0, "\n": !0, $: !0, "/": !0 }),
        (S.stringify = function (e, t, n) {
          return (
            "{code: function (c,p,i) { " +
            S.wrapMain(e.code) +
            " }," +
            r(e) +
            "}"
          );
        }),
        (g = 0),
        (S.generate = function (e, t, n) {
          g = 0;
          var r = { code: "", subs: {}, partials: {} };
          return (
            S.walk(e, r),
            n.asString ? this.stringify(r, t, n) : this.makeTemplate(r, t, n)
          );
        }),
        (S.wrapMain = function (e) {
          return 'var t=this;t.b(i=i||"");' + e + "return t.fl();";
        }),
        (S.template = S.Template),
        (S.makeTemplate = function (e, t, n) {
          var r = this.makePartials(e);
          return (
            (r.code = new Function("c", "p", "i", this.wrapMain(e.code))),
            new this.template(r, t, this, n)
          );
        }),
        (S.makePartials = function (e) {
          var t,
            n = { subs: {}, partials: e.partials, name: e.name };
          for (t in n.partials)
            n.partials[t] = this.makePartials(n.partials[t]);
          for (t in e.subs)
            n.subs[t] = new Function("c", "p", "t", "i", e.subs[t]);
          return n;
        }),
        (S.codegen = {
          "#": function (e, t) {
            (t.code +=
              "if(t.s(t." +
              n(e.n) +
              '("' +
              i(e.n) +
              '",c,p,1),c,p,0,' +
              e.i +
              "," +
              e.end +
              ',"' +
              e.otag +
              " " +
              e.ctag +
              '")){t.rs(c,p,function(c,p,t){'),
              S.walk(e.nodes, t),
              (t.code += "});c.pop();}");
          },
          "^": function (e, t) {
            (t.code +=
              "if(!t.s(t." +
              n(e.n) +
              '("' +
              i(e.n) +
              '",c,p,1),c,p,1,0,0,"")){'),
              S.walk(e.nodes, t),
              (t.code += "};");
          },
          ">": a,
          "<": function (e, t) {
            var n = { partials: {}, code: "", subs: {}, inPartial: !0 },
              e = (S.walk(e.nodes, n), t.partials[a(e, t)]);
            (e.subs = n.subs), (e.partials = n.partials);
          },
          $: function (e, t) {
            var n = { subs: {}, code: "", partials: t.partials, prefix: e.n };
            S.walk(e.nodes, n),
              (t.subs[e.n] = n.code),
              t.inPartial || (t.code += 't.sub("' + i(e.n) + '",c,p,i);');
          },
          "\n": function (e, t) {
            t.code += o('"\\n"' + (e.last ? "" : " + i"));
          },
          _v: function (e, t) {
            t.code += "t.b(t.v(t." + n(e.n) + '("' + i(e.n) + '",c,p,0)));';
          },
          _t: function (e, t) {
            t.code += o('"' + i(e.text) + '"');
          },
          "{": s,
          "&": s,
        }),
        (S.walk = function (e, t) {
          for (var n, r = 0, i = e.length; r < i; r++)
            (n = S.codegen[e[r].tag]) && n(e[r], t);
          return t;
        }),
        (S.parse = function (e, t, n) {
          return c(e, 0, [], (n = n || {}).sectionTags || []);
        }),
        (S.cache = {}),
        (S.cacheKey = function (e, t) {
          return [
            e,
            !!t.asString,
            !!t.disableLambda,
            t.delimiters,
            !!t.modelGet,
          ].join("||");
        }),
        (S.compile = function (e, t) {
          var n = S.cacheKey(e, (t = t || {})),
            r = this.cache[n];
          if (r) {
            var i,
              a = r.partials;
            for (i in a) delete a[i].instance;
            return r;
          }
          return (
            (r = this.generate(
              this.parse(this.scan(e, t.delimiters), e, t),
              e,
              t
            )),
            (this.cache[n] = r)
          );
        });
    }),
    Ya = Ta(function (e, t) {
      function l(e, t, n) {
        var r;
        return (
          t &&
            "object" == typeof t &&
            (void 0 !== t[e]
              ? (r = t[e])
              : n && t.get && "function" == typeof t.get && (r = t.get(e))),
          r
        );
      }
      function s(e) {
        return String(null == e ? "" : e);
      }
      var n, r, i, a, o, c, d;
      ((t = t).Template = function (e, t, n, r) {
        (this.r = (e = e || {}).code || this.r),
          (this.c = n),
          (this.options = r || {}),
          (this.text = t || ""),
          (this.partials = e.partials || {}),
          (this.subs = e.subs || {}),
          (this.buf = "");
      }),
        (t.Template.prototype = {
          r: function (e, t, n) {
            return "";
          },
          v: function (e) {
            return (
              (e = s(e)),
              c.test(e)
                ? e
                    .replace(n, "&amp;")
                    .replace(r, "&lt;")
                    .replace(i, "&gt;")
                    .replace(a, "&#39;")
                    .replace(o, "&quot;")
                : e
            );
          },
          t: s,
          render: function (e, t, n) {
            return this.ri([e], t || {}, n);
          },
          ri: function (e, t, n) {
            return this.r(e, t, n);
          },
          ep: function (e, t) {
            var n = this.partials[e],
              r = t[n.name];
            if (n.instance && n.base == r) return n.instance;
            if ("string" == typeof r) {
              if (!this.c) throw new Error("No compiler available.");
              r = this.c.compile(r, this.options);
            }
            if (!r) return null;
            if (((this.partials[e].base = r), n.subs)) {
              for (key in (t.stackText || (t.stackText = {}), n.subs))
                t.stackText[key] ||
                  (t.stackText[key] =
                    void 0 !== this.activeSub && t.stackText[this.activeSub]
                      ? t.stackText[this.activeSub]
                      : this.text);
              r = (function (e, t, n, r, i, a) {
                function s() {}
                function o() {}
                o.prototype = (s.prototype = e).subs;
                var c,
                  u = new s();
                for (c in ((u.subs = new o()),
                (u.subsText = {}),
                (u.buf = ""),
                (r = r || {}),
                (u.stackSubs = r),
                (u.subsText = a),
                t))
                  r[c] || (r[c] = t[c]);
                for (c in r) u.subs[c] = r[c];
                for (c in ((i = i || {}), (u.stackPartials = i), n))
                  i[c] || (i[c] = n[c]);
                for (c in i) u.partials[c] = i[c];
                return u;
              })(
                r,
                n.subs,
                n.partials,
                this.stackSubs,
                this.stackPartials,
                t.stackText
              );
            }
            return (this.partials[e].instance = r);
          },
          rp: function (e, t, n, r) {
            e = this.ep(e, n);
            return e ? e.ri(t, n, r) : "";
          },
          rs: function (e, t, n) {
            var r = e[e.length - 1];
            if (d(r))
              for (var i = 0; i < r.length; i++)
                e.push(r[i]), n(e, t, this), e.pop();
            else n(e, t, this);
          },
          s: function (e, t, n, r, i, a, s) {
            return (
              (!d(e) || 0 !== e.length) &&
              ((n = !!(e =
                "function" == typeof e ? this.ms(e, t, n, r, i, a, s) : e)),
              !r &&
                n &&
                t &&
                t.push("object" == typeof e ? e : t[t.length - 1]),
              n)
            );
          },
          d: function (e, t, n, r) {
            var i,
              a = e.split("."),
              s = this.f(a[0], t, n, r),
              o = this.options.modelGet,
              c = null;
            if ("." === e && d(t[t.length - 2])) s = t[t.length - 1];
            else
              for (var u = 1; u < a.length; u++)
                s = void 0 !== (i = l(a[u], s, o)) ? ((c = s), i) : "";
            return (
              !(r && !s) &&
              (r ||
                "function" != typeof s ||
                (t.push(c), (s = this.mv(s, t, n)), t.pop()),
              s)
            );
          },
          f: function (e, t, n, r) {
            for (
              var i = !1, a = !1, s = this.options.modelGet, o = t.length - 1;
              0 <= o;
              o--
            )
              if (void 0 !== (i = l(e, t[o], s))) {
                a = !0;
                break;
              }
            return a
              ? r || "function" != typeof i
                ? i
                : this.mv(i, t, n)
              : !r && "";
          },
          ls: function (e, t, n, r, i) {
            var a = this.options.delimiters;
            return (
              (this.options.delimiters = i),
              this.b(this.ct(s(e.call(t, r)), t, n)),
              (this.options.delimiters = a),
              !1
            );
          },
          ct: function (e, t, n) {
            if (this.options.disableLambda)
              throw new Error("Lambda features disabled.");
            return this.c.compile(e, this.options).render(t, n);
          },
          b: function (e) {
            this.buf += e;
          },
          fl: function () {
            var e = this.buf;
            return (this.buf = ""), e;
          },
          ms: function (e, t, n, r, i, a, s) {
            (t = t[t.length - 1]), (e = e.call(t));
            return "function" == typeof e
              ? !!r ||
                  ((r =
                    this.activeSub &&
                    this.subsText &&
                    this.subsText[this.activeSub]
                      ? this.subsText[this.activeSub]
                      : this.text),
                  this.ls(e, t, n, r.substring(i, a), s))
              : e;
          },
          mv: function (e, t, n) {
            (t = t[t.length - 1]), (e = e.call(t));
            return "function" == typeof e ? this.ct(s(e.call(t)), t, n) : e;
          },
          sub: function (e, t, n, r) {
            var i = this.subs[e];
            i &&
              ((this.activeSub = e), i(t, n, this, r), (this.activeSub = !1));
          },
        }),
        (n = /&/g),
        (r = /</g),
        (i = />/g),
        (a = /\'/g),
        (o = /\"/g),
        (c = /[&<>\"\']/),
        (d =
          Array.isArray ||
          function (e) {
            return "[object Array]" === Object.prototype.toString.call(e);
          });
    }),
    Xa = ((e.Template = Ya.Template), (e.template = e.Template), e),
    Ga = function (e, t, n, r) {
      t[0] = 0;
      for (var i = 1; i < t.length; i++) {
        var a = t[i++],
          s = t[i] ? ((t[0] |= a ? 1 : 2), n[t[i++]]) : t[++i];
        3 === a
          ? (r[0] = s)
          : 4 === a
          ? (r[1] = Object.assign(r[1] || {}, s))
          : 5 === a
          ? ((r[1] = r[1] || {})[t[++i]] = s)
          : 6 === a
          ? (r[1][t[++i]] += s + "")
          : a
          ? ((a = e.apply(s, Ga(e, s, n, ["", null]))),
            r.push(a),
            s[0] ? (t[0] |= 2) : ((t[i - 2] = 0), (t[i] = a)))
          : r.push(s);
      }
      return r;
    },
    es = new Map();
  var ts,
    ns,
    rs,
    is = function (e) {
      var t = es.get(this);
      return (
        t || ((t = new Map()), es.set(this, t)),
        1 <
        (t = Ga(
          this,
          t.get(e) ||
            (t.set(
              e,
              (t = (function (e) {
                for (
                  var t,
                    n,
                    r = 1,
                    i = "",
                    a = "",
                    s = [0],
                    o = function (e) {
                      1 === r &&
                      (e || (i = i.replace(/^\s*\n\s*|\s*\n\s*$/g, "")))
                        ? s.push(0, e, i)
                        : 3 === r && (e || i)
                        ? (s.push(3, e, i), (r = 2))
                        : 2 === r && "..." === i && e
                        ? s.push(4, e, 0)
                        : 2 === r && i && !e
                        ? s.push(5, 0, !0, i)
                        : 5 <= r &&
                          ((i || (!e && 5 === r)) &&
                            (s.push(r, 0, i, n), (r = 6)),
                          e) &&
                          (s.push(r, e, 0, n), (r = 6)),
                        (i = "");
                    },
                    c = 0;
                  c < e.length;
                  c++
                ) {
                  c && (1 === r && o(), o(c));
                  for (var u = 0; u < e[c].length; u++)
                    (t = e[c][u]),
                      1 === r
                        ? "<" === t
                          ? (o(), (s = [s]), (r = 3))
                          : (i += t)
                        : 4 === r
                        ? (i =
                            "--" === i && ">" === t ? ((r = 1), "") : t + i[0])
                        : a
                        ? t === a
                          ? (a = "")
                          : (i += t)
                        : '"' === t || "'" === t
                        ? (a = t)
                        : ">" === t
                        ? (o(), (r = 1))
                        : r &&
                          ("=" === t
                            ? ((r = 5), (n = i), (i = ""))
                            : "/" === t && (r < 5 || ">" === e[c][u + 1])
                            ? (o(),
                              3 === r && (s = s[0]),
                              (s = (r = s)[0]).push(2, 0, r),
                              (r = 0))
                            : " " === t ||
                              "\t" === t ||
                              "\n" === t ||
                              "\r" === t
                            ? (o(), (r = 2))
                            : (i += t)),
                      3 === r && "!--" === i && ((r = 4), (s = s[0]));
                }
                return o(), s;
              })(e))
            ),
            t),
          arguments,
          []
        )).length
          ? t
          : t[0]
      );
    }.bind(L),
    as =
      ((ns = (Ya = { createElement: L, Fragment: x }).createElement),
      (rs = Ya.Fragment),
      (ts = { createElement: ns, Fragment: rs }.createElement),
      function (e) {
        var r = e.parts,
          t = e.highlightedTagName,
          i = void 0 === t ? "mark" : t,
          t = e.nonHighlightedTagName,
          a = void 0 === t ? "span" : t,
          t = e.separator,
          s = void 0 === t ? ", " : t,
          t = e.className,
          n = e.classNames,
          o = void 0 === n ? {} : n,
          n = Ma(e, Ua);
        return ns(
          "span",
          Fa({}, n, { className: C(o.root, t) }),
          r.map(function (e, t) {
            var n = t === r.length - 1;
            return ns(
              rs,
              { key: t },
              e.map(function (e, t) {
                return ns(
                  ss,
                  {
                    key: t,
                    classNames: o,
                    highlightedTagName: i,
                    nonHighlightedTagName: a,
                    isHighlighted: e.isHighlighted,
                  },
                  e.value
                );
              }),
              !n && ns("span", { className: o.separator }, s)
            );
          })
        );
      });
  function ss(e) {
    var t = e.classNames,
      n = e.children,
      r = e.highlightedTagName,
      i = e.isHighlighted,
      e = e.nonHighlightedTagName;
    return ts(
      i ? r : e,
      { className: i ? t.highlighted : t.nonHighlighted },
      n
    );
  }
  var os = ["classNames"];
  function cs(e) {
    var t = e.classNames,
      t = void 0 === t ? {} : t,
      e = j(e, os);
    return L(
      as,
      g(
        {
          classNames: {
            root: C("ais-Highlight", t.root),
            highlighted: C("ais-Highlight-highlighted", t.highlighted),
            nonHighlighted: C("ais-Highlight-nonHighlighted", t.nonHighlighted),
            separator: C("ais-Highlight-separator", t.separator),
          },
        },
        e
      )
    );
  }
  var us = ["hit", "attribute", "cssClasses"];
  function ls(e) {
    var t = e.hit,
      n = e.attribute,
      r = e.cssClasses;
    return L(
      cs,
      g({}, j(e, us), {
        parts: at(Ce(t._highlightResult, n) || []).map(function (e) {
          return xe(ae(e.value || ""));
        }),
        classNames: r,
      })
    );
  }
  var ds = ["classNames"];
  function hs(e) {
    var t = e.classNames,
      t = void 0 === t ? {} : t,
      e = j(e, ds);
    return L(
      as,
      g(
        {
          classNames: {
            root: C("ais-ReverseHighlight", t.root),
            highlighted: C("ais-ReverseHighlight-highlighted", t.highlighted),
            nonHighlighted: C(
              "ais-ReverseHighlight-nonHighlighted",
              t.nonHighlighted
            ),
            separator: C("ais-ReverseHighlight-separator", t.separator),
          },
        },
        e
      )
    );
  }
  var fs = ["hit", "attribute", "cssClasses"],
    ms = ["isHighlighted"];
  function ps(e) {
    var t = e.hit,
      n = e.attribute,
      r = e.cssClasses;
    return L(
      hs,
      g({}, j(e, fs), {
        parts: at(Ce(t._highlightResult, n) || []).map(function (e) {
          return xe(ae(e.value || "")).map(function (e) {
            var t = e.isHighlighted;
            return F(F({}, j(e, ms)), {}, { isHighlighted: !t });
          });
        }),
        classNames: r,
      })
    );
  }
  var gs = ["classNames"];
  function vs(e) {
    var t = e.classNames,
      t = void 0 === t ? {} : t,
      e = j(e, gs);
    return L(
      as,
      g(
        {
          classNames: {
            root: C("ais-ReverseSnippet", t.root),
            highlighted: C("ais-ReverseSnippet-highlighted", t.highlighted),
            nonHighlighted: C(
              "ais-ReverseSnippet-nonHighlighted",
              t.nonHighlighted
            ),
            separator: C("ais-ReverseSnippet-separator", t.separator),
          },
        },
        e
      )
    );
  }
  var ys = ["hit", "attribute", "cssClasses"],
    bs = ["isHighlighted"];
  function Rs(e) {
    var t = e.hit,
      n = e.attribute,
      r = e.cssClasses;
    return L(
      vs,
      g({}, j(e, ys), {
        parts: at(Ce(t._snippetResult, n) || []).map(function (e) {
          return xe(ae(e.value || "")).map(function (e) {
            var t = e.isHighlighted;
            return F(F({}, j(e, bs)), {}, { isHighlighted: !t });
          });
        }),
        classNames: r,
      })
    );
  }
  var Ss = ["classNames"];
  function _s(e) {
    var t = e.classNames,
      t = void 0 === t ? {} : t,
      e = j(e, Ss);
    return L(
      as,
      g(
        {
          classNames: {
            root: C("ais-Snippet", t.root),
            highlighted: C("ais-Snippet-highlighted", t.highlighted),
            nonHighlighted: C("ais-Snippet-nonHighlighted", t.nonHighlighted),
            separator: C("ais-Snippet-separator", t.separator),
          },
        },
        e
      )
    );
  }
  var ws = ["hit", "attribute", "cssClasses"];
  function Ps(e) {
    var t = e.hit,
      n = e.attribute,
      r = e.cssClasses;
    return L(
      _s,
      g({}, j(e, ws), {
        parts: at(Ce(t._snippetResult, n) || []).map(function (e) {
          return xe(ae(e.value || ""));
        }),
        classNames: r,
      })
    );
  }
  function Ns(e) {
    var t = e.templates,
      n = e.templateKey,
      r = e.compileOptions,
      i = e.helpers,
      a = e.data,
      s = e.bindEvent,
      e = e.sendEvent,
      t = t[n];
    if ("string" != typeof t && "function" != typeof t)
      throw new Error(
        "Template must be 'string' or 'function', was '"
          .concat(W(t), "' (key: ")
          .concat(n, ")")
      );
    return "function" == typeof t
      ? (((n = s || {}).html = is),
        (n.sendEvent = e),
        (n.components = {
          Highlight: ls,
          ReverseHighlight: ps,
          Snippet: Ps,
          ReverseSnippet: Rs,
        }),
        t(a, n))
      : ((s = (function (e, t, n) {
          var r = 0 < arguments.length && void 0 !== e ? e : {},
            i = 1 < arguments.length ? t : void 0,
            a = 2 < arguments.length ? n : void 0;
          return Object.keys(r).reduce(function (e, n) {
            return F(
              F({}, e),
              {},
              E({}, n, function () {
                var t = this;
                return function (e) {
                  return r[n].call(a, e, function (e) {
                    return Xa.compile(e, i).render(t);
                  });
                };
              })
            );
          }, {});
        })(i, r, a)),
        Xa.compile(t, r)
          .render(F(F({}, a), {}, { helpers: s }))
          .replace(/[ \n\r\t\f\xA0]+/g, function (e) {
            return e.replace(/(^|\xA0+)[^\xA0]+/g, "$1 ");
          })
          .trim());
  }
  var xs = (function () {
      B(a, Ht);
      var i = V(a);
      function a() {
        var e;
        D(this, a);
        for (var t = arguments.length, n = new Array(t), r = 0; r < t; r++)
          n[r] = arguments[r];
        return (
          E(y((e = i.call.apply(i, [this].concat(n)))), "ref", Mt()),
          E(y(e), "nodes", []),
          e
        );
      }
      return (
        $(a, [
          {
            key: "componentDidMount",
            value: function () {
              var t = new DocumentFragment(),
                e = document.createElement("div");
              (e.innerHTML = this.props.content),
                (this.nodes = P(e.childNodes)),
                this.nodes.forEach(function (e) {
                  return t.appendChild(e);
                }),
                this.ref.current.replaceWith(t);
            },
          },
          {
            key: "componentWillUnmount",
            value: function () {
              this.nodes.forEach(function (e) {
                e instanceof Element ? (e.outerHTML = "") : (e.nodeValue = "");
              }),
                this.nodes[0].nodeValue && (this.nodes[0].nodeValue = "");
            },
          },
          {
            key: "render",
            value: function () {
              return L("div", { ref: this.ref });
            },
          },
        ]),
        a
      );
    })(),
    S = (function () {
      B(t, Ht);
      var e = V(t);
      function t() {
        return D(this, t), e.apply(this, arguments);
      }
      return (
        $(t, [
          {
            key: "shouldComponentUpdate",
            value: function (e) {
              return (
                !He(this.props.data, e.data) ||
                this.props.templateKey !== e.templateKey ||
                !He(this.props.rootProps, e.rootProps)
              );
            },
          },
          {
            key: "render",
            value: function () {
              var e =
                  "fragment" === this.props.rootTagName
                    ? x
                    : this.props.rootTagName,
                t = this.props.useCustomCompileOptions[this.props.templateKey]
                  ? this.props.templatesConfig.compileOptions
                  : {},
                t = Ns({
                  templates: this.props.templates,
                  templateKey: this.props.templateKey,
                  compileOptions: t,
                  helpers: this.props.templatesConfig.helpers,
                  data: this.props.data,
                  bindEvent: this.props.bindEvent,
                  sendEvent: this.props.sendEvent,
                });
              return null === t
                ? null
                : "object" === W(t)
                ? L(e, this.props.rootProps, t)
                : e === x
                ? L(xs, { content: t, key: Math.random() })
                : L(
                    e,
                    g({}, this.props.rootProps, {
                      dangerouslySetInnerHTML: { __html: t },
                    })
                  );
            },
          },
        ]),
        t
      );
    })(),
    Is =
      (E(S, "defaultProps", {
        data: {},
        rootTagName: "div",
        useCustomCompileOptions: {},
        templates: {},
        templatesConfig: {},
      }),
      function (e) {
        var t = e.hits,
          n = e.isLoading,
          r = e.cssClasses,
          i = e.templateProps;
        return L(
          "div",
          { className: C(r.root, 0 === t.length && r.emptyRoot) },
          L(
            S,
            g({}, i, {
              templateKey: "header",
              rootProps: { className: r.header },
              data: { hits: t, isLoading: n },
            })
          ),
          n
            ? L(
                S,
                g({}, i, {
                  templateKey: "loader",
                  rootProps: { className: r.loader },
                })
              )
            : L(
                "ul",
                { className: r.list },
                t.map(function (e, t) {
                  return L(
                    S,
                    g({}, i, {
                      templateKey: "item",
                      rootTagName: "li",
                      rootProps: { className: r.item },
                      key: e.objectID,
                      data: F(
                        F({}, e),
                        {},
                        {
                          get __hitIndex() {
                            return t;
                          },
                        }
                      ),
                    })
                  );
                })
              )
        );
      }),
    Cs = {
      header: function () {
        return "";
      },
      loader: function () {
        return "";
      },
      item: function (e) {
        return JSON.stringify(e);
      },
    },
    Ts = l({ name: "answers" }),
    Fs = i("Answers"),
    e = Z(function (e) {
      var t,
        i,
        a,
        s,
        o,
        e = e || {},
        n = e.container,
        r = e.attributesForPrediction,
        c = e.queryLanguages,
        u = e.nbHits,
        l = e.searchDebounceTime,
        d = e.renderDebounceTime,
        h = e.escapeHTML,
        f = e.extraParameters,
        m = e.templates,
        m = void 0 === m ? {} : m,
        e = e.cssClasses,
        e = void 0 === e ? {} : e;
      if (n)
        return (
          (t = N(n)),
          (n = {
            root: C(Fs(), e.root),
            emptyRoot: C(Fs({ modifierName: "empty" }), e.emptyRoot),
            header: C(Fs({ descendantName: "header" }), e.header),
            loader: C(Fs({ descendantName: "loader" }), e.loader),
            list: C(Fs({ descendantName: "list" }), e.list),
            item: C(Fs({ descendantName: "item" }), e.item),
          }),
          (i = (e = {
            containerNode: t,
            cssClasses: n,
            templates: m,
            renderState: {},
          }).containerNode),
          (a = e.cssClasses),
          (s = e.renderState),
          (o = e.templates),
          F(
            F(
              {},
              st(
                function (e, t) {
                  var n = e.hits,
                    r = e.isLoading,
                    e = e.instantSearchInstance;
                  t
                    ? (s.templateProps = H({
                        defaultTemplates: Cs,
                        templatesConfig: e.templatesConfig,
                        templates: o,
                      }))
                    : M(
                        L(Is, {
                          cssClasses: a,
                          hits: n,
                          isLoading: r,
                          templateProps: s.templateProps,
                        }),
                        i
                      );
                },
                function () {
                  return M(null, t);
                }
              )({
                attributesForPrediction: r,
                queryLanguages: c,
                nbHits: u,
                searchDebounceTime: l,
                renderDebounceTime: d,
                escapeHTML: h,
                extraParameters: f,
              })
            ),
            {},
            { $$widgetType: "ais.answers" }
          )
        );
      throw new Error(Ts("The `container` option is required."));
    }),
    Es = ["container", "widgets", "fallbackWidget"],
    js = l({ name: "dynamic-widgets" }),
    ks = i("DynamicWidgets");
  function Os(e) {
    var t = document.createElement("div");
    return (
      (t.className = ks({ descendantName: "widget" })), e.appendChild(t), t
    );
  }
  function Ls(e) {
    var n,
      i,
      a,
      s,
      t,
      r = (e = e || {}).container,
      o = e.widgets,
      c = e.fallbackWidget,
      e = j(e, Es);
    if (!r) throw new Error(js("The `container` option is required."));
    if (
      o &&
      Array.isArray(o) &&
      o.every(function (e) {
        return "function" == typeof e;
      })
    )
      return (
        (n = N(r)),
        ((i = document.createElement("div")).className = ks()),
        (a = new Map()),
        (s = []),
        (t = ot(
          function (e, t) {
            e = e.attributesToRender;
            t && n.appendChild(i),
              e.forEach(function (e) {
                a.has(e) && ((e = a.get(e)), i.appendChild(e));
              });
          },
          function () {
            n.removeChild(i);
          }
        )(
          F(
            F({}, e),
            {},
            {
              widgets: s,
              fallbackWidget:
                "function" == typeof c
                  ? function (e) {
                      var e = e.attribute,
                        t = Os(i);
                      return a.set(e, t), c({ attribute: e, container: t });
                    }
                  : void 0,
            }
          )
        )),
        F(
          F({}, t),
          {},
          {
            init: function (r) {
              o.forEach(function (e) {
                var t = Os(i),
                  e = e(t),
                  n = Ee(e, r);
                a.set(n, t), s.push(e);
              }),
                t.init(r);
            },
            $$widgetType: "ais.dynamicWidgets",
          }
        )
      );
    throw new Error(js("The `widgets` option expects an array of callbacks."));
  }
  function Ms(e, t) {
    var n = e.items,
      r = e.widgetParams,
      e = e.canRefine;
    t ||
      ((t = r.container),
      (r = r.cssClasses),
      M(L(Js, { cssClasses: r, items: n, canRefine: e }), t));
  }
  function Hs(e) {
    var t = e.className,
      n = e.disabled;
    return L(
      "button",
      { className: t, onClick: e.onClick, disabled: void 0 !== n && n },
      e.children
    );
  }
  function As(e) {
    var t = e.classNameLabel,
      n = e.classNameInput,
      r = e.checked,
      i = e.onToggle,
      e = e.children;
    return L(
      "label",
      { className: t },
      L("input", { className: n, type: "checkbox", checked: r, onChange: i }),
      e
    );
  }
  function Ws(e, t) {
    var n,
      r,
      i,
      a,
      s = e.items,
      o = e.position,
      c = e.currentRefinement,
      u = e.refine,
      l = e.clearMapRefinement,
      d = e.toggleRefineOnMapMove,
      h = e.isRefineOnMapMove,
      f = e.setMapMoveSinceLastRefine,
      m = e.hasMapMoveSinceLastRefine,
      p = e.isRefinedWithMap,
      g = e.widgetParams,
      e = e.instantSearchInstance,
      v = g.container,
      y = g.googleReference,
      b = g.cssClasses,
      R = g.templates,
      S = g.initialZoom,
      _ = g.initialPosition,
      w = g.enableRefine,
      P = g.enableClearMapRefinement,
      N = g.enableRefineControl,
      x = g.mapOptions,
      I = g.createMarker,
      C = g.markerOptions,
      T = g.renderState;
    t
      ? ((T.isUserInteraction = !0),
        (T.isPendingRefine = !1),
        (T.markers = []),
        ((g = document.createElement("div")).className = b.root),
        v.appendChild(g),
        ((t = document.createElement("div")).className = b.map),
        g.appendChild(t),
        ((n = document.createElement("div")).className = b.tree),
        g.appendChild(n),
        (T.mapInstance = new y.maps.Map(
          t,
          F(
            {
              mapTypeControl: !1,
              fullscreenControl: !1,
              streetViewControl: !1,
              clickableIcons: !1,
              zoomControlOptions: { position: y.maps.ControlPosition.LEFT_TOP },
            },
            x
          )
        )),
        y.maps.event.addListenerOnce(T.mapInstance, "idle", function () {
          function e() {
            T.isUserInteraction && w && (f(), h()) && (T.isPendingRefine = !0);
          }
          T.mapInstance.addListener("center_changed", e),
            T.mapInstance.addListener("zoom_changed", e),
            T.mapInstance.addListener("dragstart", e),
            T.mapInstance.addListener("idle", function () {
              T.isUserInteraction &&
                T.isPendingRefine &&
                ((T.isPendingRefine = !1),
                to({ mapInstance: T.mapInstance, refine: u }));
            });
        }),
        (T.templateProps = H({
          templatesConfig: e.templatesConfig,
          templates: R,
        })))
      : ((g = s.map(function (e) {
          return e.objectID;
        })),
        (t = (n = k(no(T.markers, g), 2))[0]),
        (x = n[1]),
        (r = t.map(function (e) {
          return e.__id;
        })),
        (e = s.filter(function (e) {
          return !r.includes(e.objectID);
        })),
        x.forEach(function (e) {
          return e.setMap(null);
        }),
        (T.markers = t.concat(
          e.map(function (n) {
            var r = I({ map: T.mapInstance, item: n });
            return (
              Object.keys(C.events).forEach(function (t) {
                r.addListener(t, function (e) {
                  C.events[t]({
                    map: T.mapInstance,
                    event: e,
                    item: n,
                    marker: r,
                  });
                });
              }),
              r
            );
          })
        )),
        (R = !m()),
        (i = c ? 0 : null),
        (a = !c && Boolean(T.markers.length) ? ro(y, T.markers) : c) && R
          ? io(T, function () {
              T.mapInstance.fitBounds(
                new y.maps.LatLngBounds(a.southWest, a.northEast),
                i
              );
            })
          : R &&
            io(T, function () {
              T.mapInstance.setCenter(o || _), T.mapInstance.setZoom(S);
            }),
        M(
          L(eo, {
            cssClasses: b,
            enableRefine: w,
            enableRefineControl: N,
            enableClearMapRefinement: P,
            isRefineOnMapMove: h(),
            isRefinedWithMap: p(),
            hasMapMoveSinceLastRefine: m(),
            onRefineToggle: d,
            onRefineClick: function () {
              return to({ mapInstance: T.mapInstance, refine: u });
            },
            onClearClick: l,
            templateProps: T.templateProps,
          }),
          v.querySelector(".".concat(b.tree))
        ));
  }
  var Ds = l({ name: "analytics" }),
    $s = function (e) {
      var r = e.items,
        i = e.cssClasses,
        a = e.templateProps,
        s = e.createURL,
        o = e.refine;
      return L(
        "div",
        { className: C(i.root, 0 === r.length && i.noRefinementRoot) },
        L(
          "ul",
          { className: i.list },
          L(
            "li",
            { className: C(i.item, 0 === r.length && i.selectedItem) },
            L(
              S,
              g({}, a, {
                templateKey: "home",
                rootTagName: "a",
                rootProps: {
                  className: i.link,
                  href: s(null),
                  onClick: function (e) {
                    e.preventDefault(), o(null);
                  },
                },
              })
            )
          ),
          r.map(function (t, e) {
            var n = e === r.length - 1;
            return L(
              "li",
              { key: t.label + e, className: C(i.item, n && i.selectedItem) },
              L(
                S,
                g({}, a, {
                  templateKey: "separator",
                  rootTagName: "span",
                  rootProps: { className: i.separator, "aria-hidden": !0 },
                })
              ),
              n
                ? t.label
                : L(
                    "a",
                    {
                      className: i.link,
                      href: s(t.value),
                      onClick: function (e) {
                        e.preventDefault(), o(t.value);
                      },
                    },
                    t.label
                  )
            );
          })
        )
      );
    },
    Bs = {
      home: function () {
        return "Home";
      },
      separator: function () {
        return ">";
      },
    },
    Us = l({ name: "breadcrumb" }),
    qs = i("Breadcrumb"),
    Qs = function (e) {
      var t = e.hasRefinements,
        n = e.refine,
        r = e.cssClasses,
        e = e.templateProps;
      return L(
        "div",
        { className: r.root },
        L(
          S,
          g({}, e, {
            templateKey: "resetLabel",
            rootTagName: "button",
            rootProps: {
              className: C(r.button, !t && r.disabledButton),
              onClick: n,
              disabled: !t,
            },
            data: { hasRefinements: t },
          })
        )
      );
    },
    Vs = {
      resetLabel: function () {
        return "Clear refinements";
      },
    },
    Ks = l({ name: "clear-refinements" }),
    zs = i("ClearRefinements"),
    Js = function (e) {
      var t = e.items,
        a = e.cssClasses,
        e = e.canRefine;
      return L(
        "div",
        { className: C(a.root, !e && a.noRefinementRoot) },
        L(
          "ul",
          { className: a.list },
          t.map(function (i, e) {
            return L(
              "li",
              {
                key: ""
                  .concat(i.indexName, "-")
                  .concat(i.attribute, "-")
                  .concat(e),
                className: a.item,
              },
              L(
                "span",
                { className: a.label },
                (e = i.label).toString().charAt(0).toUpperCase() +
                  e.toString().slice(1),
                ": "
              ),
              i.refinements.map(function (e) {
                return L(
                  "span",
                  {
                    key:
                      ((n = e.attribute),
                      (r = e.value),
                      [n, e.type, r, e.operator]
                        .map(function (e) {
                          return e;
                        })
                        .filter(Boolean)
                        .join(":")),
                    className: a.category,
                  },
                  L(
                    "span",
                    { className: a.categoryLabel },
                    "query" === e.attribute ? L("q", null, e.label) : e.label
                  ),
                  L(
                    "button",
                    {
                      className: a.delete,
                      type: "button",
                      onClick:
                        ((t = i.refine.bind(null, e)),
                        function (e) {
                          Ae(e) || (e.preventDefault(), t());
                        }),
                    },
                    "✕"
                  )
                );
                var t, n, r;
              })
            );
          })
        )
      );
    },
    Zs = l({ name: "current-refinements" }),
    Ys = i("CurrentRefinements"),
    Xs = L("p", null, "Your custom HTML Marker"),
    Gs = {
      HTMLMarker: function () {
        return Xs;
      },
      reset: function () {
        return "Clear the map refinement";
      },
      toggle: function () {
        return "Search as I move the map";
      },
      redo: function () {
        return "Redo search here";
      },
    },
    eo = function (e) {
      var t = e.cssClasses,
        n = e.enableRefine,
        r = e.enableRefineControl,
        i = e.enableClearMapRefinement,
        a = e.isRefineOnMapMove,
        s = e.isRefinedWithMap,
        o = e.hasMapMoveSinceLastRefine,
        c = e.onRefineToggle,
        u = e.onRefineClick,
        l = e.onClearClick,
        e = e.templateProps;
      return L(
        x,
        null,
        n &&
          L(
            "div",
            null,
            r &&
              L(
                "div",
                { className: t.control },
                a || !o
                  ? L(
                      As,
                      {
                        classNameLabel: C(t.label, a && t.selectedLabel),
                        classNameInput: t.input,
                        checked: a,
                        onToggle: c,
                      },
                      L(
                        S,
                        g({}, e, { templateKey: "toggle", rootTagName: "span" })
                      )
                    )
                  : L(
                      Hs,
                      { className: t.redo, disabled: !o, onClick: u },
                      L(
                        S,
                        g({}, e, { templateKey: "redo", rootTagName: "span" })
                      )
                    )
              ),
            !r &&
              !a &&
              L(
                "div",
                { className: t.control },
                L(
                  Hs,
                  {
                    className: C(t.redo, !o && t.disabledRedo),
                    disabled: !o,
                    onClick: u,
                  },
                  L(S, g({}, e, { templateKey: "redo", rootTagName: "span" }))
                )
              ),
            i &&
              s &&
              L(
                Hs,
                { className: t.reset, onClick: l },
                L(S, g({}, e, { templateKey: "reset", rootTagName: "span" }))
              )
          )
      );
    },
    to = function (e) {
      var t = e.refine,
        e = e.mapInstance;
      return t({
        northEast: e.getBounds().getNorthEast().toJSON(),
        southWest: e.getBounds().getSouthWest().toJSON(),
      });
    },
    no = function (e, r) {
      return e.reduce(
        function (e, t) {
          var e = k(e, 2),
            n = e[0],
            e = e[1];
          return r.includes(t.__id) ? [n.concat(t), e] : [n, e.concat(t)];
        },
        [[], []]
      );
    },
    ro = function (e, t) {
      t = t.reduce(function (e, t) {
        return e.extend(t.getPosition());
      }, new e.maps.LatLngBounds());
      return {
        northEast: t.getNorthEast().toJSON(),
        southWest: t.getSouthWest().toJSON(),
      };
    },
    io = function (e, t) {
      (e.isUserInteraction = !1), t(), (e.isUserInteraction = !0);
    },
    ao = [
      "initialZoom",
      "initialPosition",
      "templates",
      "cssClasses",
      "builtInMarker",
      "customHTMLMarker",
      "enableRefine",
      "enableClearMapRefinement",
      "enableRefineControl",
      "container",
      "googleReference",
    ],
    so = ["item"],
    oo = ["item"],
    co = l({ name: "geo-search" }),
    uo = i("GeoSearch"),
    Ya = {
      query: "",
      showSubmit: !0,
      showReset: !0,
      showLoadingIndicator: !0,
      autofocus: !1,
      searchAsYouType: !0,
      ignoreCompositionEvents: !1,
      isSearchStalled: !1,
      disabled: !1,
      ariaLabel: "Search",
      onChange: R,
      onSubmit: R,
      onReset: R,
      refine: R,
    },
    lo = (function () {
      B(i, Ht);
      var r = V(i);
      function i() {
        var a;
        D(this, i);
        for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++)
          t[n] = arguments[n];
        return (
          E(y((a = r.call.apply(r, [this].concat(t)))), "state", {
            query: a.props.query,
            focused: !1,
          }),
          E(y(a), "input", Mt()),
          E(y(a), "onInput", function (e) {
            var t = a.props,
              n = t.searchAsYouType,
              r = t.refine,
              t = t.onChange,
              i = e.target.value;
            (a.props.ignoreCompositionEvents && e.isComposing) ||
              (n && r(i), a.setState({ query: i }), t(e));
          }),
          E(y(a), "onSubmit", function (e) {
            var t = a.props,
              n = t.searchAsYouType,
              r = t.refine,
              t = t.onSubmit;
            return (
              e.preventDefault(),
              e.stopPropagation(),
              a.input.current && a.input.current.blur(),
              n || r(a.state.query),
              t(e),
              !1
            );
          }),
          E(y(a), "onReset", function (e) {
            var t = a.props,
              n = t.refine,
              t = t.onReset;
            a.input.current && a.input.current.focus(),
              n(""),
              a.setState({ query: "" }),
              t(e);
          }),
          E(y(a), "onBlur", function () {
            a.setState({ focused: !1 });
          }),
          E(y(a), "onFocus", function () {
            a.setState({ focused: !0 });
          }),
          a
        );
      }
      return (
        $(i, [
          {
            key: "resetInput",
            value: function () {
              this.setState({ query: "" });
            },
          },
          {
            key: "componentWillReceiveProps",
            value: function (e) {
              this.state.focused ||
                e.query === this.state.query ||
                this.setState({ query: e.query });
            },
          },
          {
            key: "render",
            value: function () {
              var e = this.props,
                t = e.cssClasses,
                n = e.placeholder,
                r = e.autofocus,
                i = e.showSubmit,
                a = e.showReset,
                s = e.showLoadingIndicator,
                o = e.templates,
                c = e.isSearchStalled,
                e = e.ariaLabel;
              return L(
                "div",
                { className: t.root },
                L(
                  "form",
                  {
                    action: "",
                    role: "search",
                    className: t.form,
                    noValidate: !0,
                    onSubmit: this.onSubmit,
                    onReset: this.onReset,
                  },
                  L("input", {
                    ref: this.input,
                    value: this.state.query,
                    disabled: this.props.disabled,
                    className: t.input,
                    type: "search",
                    placeholder: n,
                    autoFocus: r,
                    autoComplete: "off",
                    autoCorrect: "off",
                    autoCapitalize: "off",
                    spellCheck: "false",
                    maxLength: 512,
                    onInput: this.onInput,
                    oncompositionend: this.onInput,
                    onBlur: this.onBlur,
                    onFocus: this.onFocus,
                    "aria-label": e,
                  }),
                  L(S, {
                    templateKey: "submit",
                    rootTagName: "button",
                    rootProps: {
                      className: t.submit,
                      type: "submit",
                      title: "Submit the search query",
                      hidden: !i,
                    },
                    templates: o,
                    data: { cssClasses: t },
                  }),
                  L(S, {
                    templateKey: "reset",
                    rootTagName: "button",
                    rootProps: {
                      className: t.reset,
                      type: "reset",
                      title: "Clear the search query",
                      hidden: !(a && this.state.query.trim() && !c),
                    },
                    templates: o,
                    data: { cssClasses: t },
                  }),
                  s &&
                    L(S, {
                      templateKey: "loadingIndicator",
                      rootTagName: "span",
                      rootProps: { className: t.loadingIndicator, hidden: !c },
                      templates: o,
                      data: { cssClasses: t },
                    })
                )
              );
            },
          },
        ]),
        i
      );
    })();
  function ho(e) {
    var t = e.className,
      n = e.handleClick,
      r = e.facetValueToRefine,
      i = e.isRefined,
      a = e.templateProps,
      s = e.templateKey,
      o = e.templateData,
      e = e.subItems;
    return L(
      "li",
      {
        className: t,
        onClick: function (e) {
          n({ facetValueToRefine: r, isRefined: i, originalEvent: e });
        },
      },
      L(S, g({}, a, { templateKey: s, data: o })),
      e
    );
  }
  E(lo, "defaultProps", Ya);
  var fo = ["root"];
  function mo(e) {
    return void 0 !== e.data;
  }
  var po,
    go,
    vo = (function () {
      B(s, Ht);
      var r = V(s);
      function s() {
        var a;
        D(this, s);
        for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++)
          t[n] = arguments[n];
        return (
          E(y((a = r.call.apply(r, [this].concat(t)))), "searchBox", Mt()),
          E(y(a), "_generateFacetItem", function (e) {
            mo(e) &&
              Array.isArray(e.data) &&
              0 < e.data.length &&
              ((t = a.props.cssClasses).root,
              (t = j(t, fo)),
              (t = L(
                s,
                g({}, a.props, {
                  cssClasses: t,
                  depth: a.props.depth + 1,
                  facetValues: e.data,
                  showMore: !1,
                  className: a.props.cssClasses.childList,
                })
              )));
            var t,
              n = a.props.createURL(e.value),
              n = F(
                F({}, e),
                {},
                {
                  url: n,
                  attribute: a.props.attribute,
                  cssClasses: a.props.cssClasses,
                  isFromSearch: a.props.isFromSearch,
                }
              ),
              r = e.value,
              i =
                (void 0 !== e.isRefined && (r += "/".concat(e.isRefined)),
                void 0 !== e.count && (r += "/".concat(e.count)),
                C(
                  a.props.cssClasses.item,
                  e.isRefined && a.props.cssClasses.selectedItem,
                  !e.count && a.props.cssClasses.disabledItem,
                  Boolean(
                    mo(e) && Array.isArray(e.data) && 0 < e.data.length
                  ) && a.props.cssClasses.parentItem
                ));
            return L(ho, {
              templateKey: "item",
              key: r,
              facetValueToRefine: e.value,
              handleClick: a.handleItemClick,
              isRefined: e.isRefined,
              className: i,
              subItems: t,
              templateData: n,
              templateProps: a.props.templateProps,
            });
          }),
          E(y(a), "handleItemClick", function (e) {
            var t = e.facetValueToRefine,
              n = e.isRefined,
              r = e.originalEvent;
            if (!Ae(r)) {
              var i = r.target;
              if (
                !(
                  null === i ||
                  null === i.parentNode ||
                  (n &&
                    i.parentNode.querySelector('input[type="radio"]:checked'))
                )
              ) {
                if ("INPUT" !== i.tagName) {
                  for (; i !== r.currentTarget; ) {
                    if (
                      "LABEL" === i.tagName &&
                      (i.querySelector('input[type="checkbox"]') ||
                        i.querySelector('input[type="radio"]'))
                    )
                      return;
                    "A" === i.tagName && i.href && r.preventDefault(),
                      (i = i.parentNode);
                  }
                  r.stopPropagation();
                }
                a.refine(t);
              }
            }
          }),
          a
        );
      }
      return (
        $(s, [
          {
            key: "shouldComponentUpdate",
            value: function (e) {
              return !He(this.props.facetValues, e.facetValues);
            },
          },
          {
            key: "refine",
            value: function (e) {
              this.props.toggleRefinement(e);
            },
          },
          {
            key: "componentWillReceiveProps",
            value: function (e) {
              this.searchBox.current &&
                !e.isFromSearch &&
                this.searchBox.current.resetInput();
            },
          },
          {
            key: "refineFirstValue",
            value: function () {
              var e = this.props.facetValues && this.props.facetValues[0];
              e && ((e = e.value), this.props.toggleRefinement(e));
            },
          },
          {
            key: "render",
            value: function () {
              var t = this,
                e = C(
                  this.props.cssClasses.showMore,
                  !(
                    !0 === this.props.showMore && this.props.canToggleShowMore
                  ) && this.props.cssClasses.disabledShowMore
                ),
                e =
                  !0 === this.props.showMore &&
                  L(
                    S,
                    g({}, this.props.templateProps, {
                      templateKey: "showMoreText",
                      rootTagName: "button",
                      rootProps: {
                        className: e,
                        disabled: !this.props.canToggleShowMore,
                        onClick: this.props.toggleShowMore,
                      },
                      data: { isShowingMore: this.props.isShowingMore },
                    })
                  ),
                n =
                  !0 !== this.props.searchIsAlwaysActive &&
                  !(this.props.isFromSearch || !this.props.hasExhaustiveItems),
                n =
                  this.props.searchFacetValues &&
                  L(
                    "div",
                    { className: this.props.cssClasses.searchBox },
                    L(lo, {
                      ref: this.searchBox,
                      placeholder: this.props.searchPlaceholder,
                      disabled: n,
                      cssClasses: this.props.cssClasses.searchable,
                      templates: this.props.searchBoxTemplateProps.templates,
                      onChange: function (e) {
                        return t.props.searchFacetValues(e.target.value);
                      },
                      onReset: function () {
                        return t.props.searchFacetValues("");
                      },
                      onSubmit: function () {
                        return t.refineFirstValue();
                      },
                      searchAsYouType: !1,
                      ariaLabel: "Search for filters",
                    })
                  ),
                r =
                  this.props.facetValues &&
                  0 < this.props.facetValues.length &&
                  L(
                    "ul",
                    { className: this.props.cssClasses.list },
                    this.props.facetValues.map(this._generateFacetItem, this)
                  ),
                i =
                  this.props.searchFacetValues &&
                  this.props.isFromSearch &&
                  (!this.props.facetValues ||
                    0 === this.props.facetValues.length) &&
                  L(
                    S,
                    g({}, this.props.templateProps, {
                      templateKey: "searchableNoResults",
                      rootProps: { className: this.props.cssClasses.noResults },
                    })
                  );
              return L(
                "div",
                {
                  className: C(
                    this.props.cssClasses.root,
                    (!this.props.facetValues ||
                      0 === this.props.facetValues.length) &&
                      this.props.cssClasses.noRefinementRoot,
                    this.props.className
                  ),
                },
                this.props.children,
                n,
                r,
                i,
                e
              );
            },
          },
        ]),
        s
      );
    })(),
    yo =
      (E(vo, "defaultProps", { cssClasses: {}, depth: 0 }),
      {
        item: function (e) {
          var t = e.url,
            n = e.label,
            r = e.count,
            i = e.cssClasses,
            e = e.isRefined;
          return L(
            "a",
            {
              className: C(C(i.link), C(e ? i.selectedItemLink : void 0)),
              href: t,
            },
            L("span", { className: C(i.label) }, n),
            L("span", { className: C(i.count) }, Sa(r))
          );
        },
        showMoreText: function (e) {
          return e.isShowingMore ? "Show less" : "Show more";
        },
      }),
    bo = l({ name: "hierarchical-menu" }),
    _ = i("HierarchicalMenu"),
    Ro = {
      empty: function () {
        return "No results";
      },
      item: function (e) {
        return JSON.stringify(Ge(e, ["__hitIndex"]), null, 2);
      },
    },
    So = ["hit", "index"],
    _o = l({ name: "hits" }),
    wo =
      ((go = (Ya = { createElement: L, Fragment: x }).createElement),
      (Ya = Ya.Fragment),
      (po = { createElement: go, Fragment: Ya }.createElement),
      function (e) {
        var t = e.classNames,
          n = void 0 === t ? {} : t,
          t = e.hits,
          r = e.itemComponent,
          i = e.sendEvent,
          a = e.emptyComponent,
          s = e.banner,
          o = e.bannerComponent,
          e = Ma(e, qa);
        return go(
          "div",
          Fa({}, e, {
            className: C(
              "ais-Hits",
              n.root,
              0 === t.length && C("ais-Hits--empty", n.emptyRoot),
              e.className
            ),
          }),
          s &&
            (o
              ? go(o, {
                  className: C("ais-Hits-banner", n.bannerRoot),
                  banner: s,
                })
              : go(Po, { classNames: n, banner: s })),
          0 === t.length && a
            ? go(a, null)
            : go(
                "ol",
                { className: C("ais-Hits-list", n.list) },
                t.map(function (e, t) {
                  return go(r, {
                    key: e.objectID,
                    hit: e,
                    index: t,
                    className: C("ais-Hits-item", n.item),
                    onClick: function () {
                      i("click:internal", e, "Hit Clicked");
                    },
                    onAuxClick: function () {
                      i("click:internal", e, "Hit Clicked");
                    },
                  });
                })
              )
        );
      });
  function Po(e) {
    var t = e.classNames;
    return (e = e.banner).image.urls[0].url
      ? po(
          "aside",
          { className: C("ais-Hits-banner", t.bannerRoot) },
          e.link
            ? po(
                "a",
                {
                  className: C("ais-Hits-banner-link", t.bannerLink),
                  href: e.link.url,
                  target: e.link.target,
                },
                po("img", {
                  className: C("ais-Hits-banner-image", t.bannerImage),
                  src: e.image.urls[0].url,
                  alt: e.image.title,
                })
              )
            : po("img", {
                className: C("ais-Hits-banner-image", t.bannerImage),
                src: e.image.urls[0].url,
                alt: e.image.title,
              })
        )
      : null;
  }
  function No(e) {
    var t = e.currentValue,
      n = e.options,
      r = e.cssClasses,
      i = e.setValue,
      e = e.ariaLabel;
    return L(
      "select",
      {
        className: C(r.select),
        onChange: function (e) {
          return i(e.target.value);
        },
        value: "".concat(t),
        "aria-label": e,
      },
      n.map(function (e) {
        return L(
          "option",
          {
            className: C(r.option),
            key: e.label + e.value,
            value: "".concat(e.value),
          },
          e.label
        );
      })
    );
  }
  function xo(e) {
    var t = e.banner,
      e = e.classNames;
    return t.image.urls[0].url
      ? L(
          "aside",
          { className: C(e.bannerRoot) },
          t.link
            ? L(
                "a",
                {
                  className: C(e.bannerLink),
                  href: t.link.url,
                  target: t.link.target,
                },
                L("img", {
                  className: C(e.bannerImage),
                  src: t.image.urls[0].url,
                  alt: t.image.title,
                })
              )
            : L("img", {
                className: C(e.bannerImage),
                src: t.image.urls[0].url,
                alt: t.image.title,
              })
        )
      : null;
  }
  var Io = l({ name: "hits-per-page" }),
    Co = i("HitsPerPage"),
    To = function (e) {
      var t = e.results,
        n = e.hits,
        r = e.insights,
        i = e.bindEvent,
        a = e.sendEvent,
        s = e.hasShowPrevious,
        o = e.showPrevious,
        c = e.showMore,
        u = e.isFirstPage,
        l = e.isLastPage,
        d = e.cssClasses,
        h = e.templateProps,
        e = e.banner,
        f = Xt({ insights: r, sendEvent: a });
      return 0 === t.hits.length
        ? L(
            "div",
            { className: C(d.root, d.emptyRoot), onClick: f },
            e &&
              (h.templates.banner
                ? L(
                    S,
                    g({}, h, {
                      templateKey: "banner",
                      rootTagName: "fragment",
                      data: { banner: e, className: d.bannerRoot },
                    })
                  )
                : L(xo, { banner: e, classNames: d })),
            L(
              S,
              g({}, h, {
                templateKey: "empty",
                rootTagName: "fragment",
                data: t,
              })
            )
          )
        : L(
            "div",
            { className: d.root },
            s &&
              L(
                S,
                g({}, h, {
                  templateKey: "showPreviousText",
                  rootTagName: "button",
                  rootProps: {
                    className: C(d.loadPrevious, u && d.disabledLoadPrevious),
                    disabled: u,
                    onClick: o,
                  },
                })
              ),
            e &&
              (h.templates.banner
                ? L(
                    S,
                    g({}, h, {
                      templateKey: "banner",
                      rootTagName: "fragment",
                      data: { banner: e, className: d.bannerRoot },
                    })
                  )
                : L(xo, { banner: e, classNames: d })),
            L(
              "ol",
              { className: d.list },
              n.map(function (t, e) {
                return L(
                  S,
                  g({}, h, {
                    templateKey: "item",
                    rootTagName: "li",
                    rootProps: {
                      className: d.item,
                      onClick: function (e) {
                        f(e), a("click:internal", t, "Hit Clicked");
                      },
                      onAuxClick: function (e) {
                        f(e), a("click:internal", t, "Hit Clicked");
                      },
                    },
                    key: t.objectID,
                    data: F(
                      F({}, t),
                      {},
                      {
                        get __hitIndex() {
                          return e;
                        },
                      }
                    ),
                    bindEvent: i,
                    sendEvent: a,
                  })
                );
              })
            ),
            L(
              S,
              g({}, h, {
                templateKey: "showMoreText",
                rootTagName: "button",
                rootProps: {
                  className: C(d.loadMore, l && d.disabledLoadMore),
                  disabled: l,
                  onClick: c,
                },
              })
            )
          );
    },
    Fo = {
      empty: function () {
        return "No results";
      },
      showPreviousText: function () {
        return "Show previous results";
      },
      showMoreText: function () {
        return "Show more results";
      },
      item: function (e) {
        return JSON.stringify(Ge(e, ["__hitIndex"]), null, 2);
      },
    },
    Eo = l({ name: "infinite-hits" }),
    jo = i("InfiniteHits"),
    ko = {
      item: function (e) {
        var t = e.cssClasses,
          n = e.url,
          r = e.label,
          e = e.count;
        return L(
          "a",
          { className: C(t.link), href: n },
          L("span", { className: C(t.label) }, r),
          L("span", { className: C(t.count) }, Sa(e))
        );
      },
      showMoreText: function (e) {
        return e.isShowingMore ? "Show less" : "Show more";
      },
    },
    Oo = l({ name: "menu" }),
    Lo = i("Menu");
  function Mo(e) {
    var t = e.cssClasses,
      n = e.templateProps,
      r = e.items,
      i = e.refine,
      e = (
        we(r, function (e) {
          return e.isRefined;
        }) || { value: "" }
      ).value;
    return L(
      "div",
      { className: C(t.root, 0 === r.length && t.noRefinementRoot) },
      L(
        "select",
        {
          className: t.select,
          value: e,
          onChange: function (e) {
            i(e.target.value);
          },
        },
        L(
          S,
          g({}, n, {
            templateKey: "defaultOption",
            rootTagName: "option",
            rootProps: { value: "", className: t.option },
          })
        ),
        r.map(function (e) {
          return L(
            S,
            g({}, n, {
              templateKey: "item",
              rootTagName: "option",
              rootProps: { value: e.value, className: t.option },
              key: e.value,
              data: e,
            })
          );
        })
      )
    );
  }
  var Ho = {
      item: function (e) {
        var t = e.label,
          e = e.count;
        return "".concat(t, " (").concat(Sa(e), ")");
      },
      defaultOption: function () {
        return "See all";
      },
    },
    Ao = l({ name: "menu-select" }),
    Wo = i("MenuSelect"),
    Do = {
      item: function (e) {
        var t = e.cssClasses,
          n = e.attribute,
          r = e.label,
          e = e.isRefined;
        return L(
          "label",
          { className: t.label },
          L("input", {
            type: "radio",
            className: t.radio,
            name: n,
            defaultChecked: e,
          }),
          L("span", { className: t.labelText }, r)
        );
      },
    },
    $o = l({ name: "numeric-menu" }),
    Bo = i("NumericMenu");
  function Uo(n) {
    function t(t) {
      return function (e) {
        Ae(e) || (e.preventDefault(), n.setCurrentPage(t));
      };
    }
    return L(
      "div",
      {
        className: C(
          n.cssClasses.root,
          n.nbPages <= 1 && n.cssClasses.noRefinementRoot
        ),
      },
      L(
        "ul",
        { className: n.cssClasses.list },
        n.showFirst &&
          L(qo, {
            ariaLabel: "First Page",
            className: n.cssClasses.firstPageItem,
            isDisabled: n.isFirstPage,
            templates: n.templates,
            templateKey: "first",
            pageNumber: 0,
            createURL: n.createURL,
            cssClasses: n.cssClasses,
            createClickHandler: t,
          }),
        n.showPrevious &&
          L(qo, {
            ariaLabel: "Previous Page",
            className: n.cssClasses.previousPageItem,
            isDisabled: n.isFirstPage,
            templates: n.templates,
            templateKey: "previous",
            pageNumber: n.currentPage - 1,
            createURL: n.createURL,
            cssClasses: n.cssClasses,
            createClickHandler: t,
          }),
        n.pages.map(function (e) {
          return L(qo, {
            key: e,
            ariaLabel: "Page ".concat(e + 1),
            className: n.cssClasses.pageItem,
            isSelected: e === n.currentPage,
            templates: n.templates,
            templateKey: "page",
            pageNumber: e,
            createURL: n.createURL,
            cssClasses: n.cssClasses,
            createClickHandler: t,
          });
        }),
        n.showNext &&
          L(qo, {
            ariaLabel: "Next Page",
            className: n.cssClasses.nextPageItem,
            isDisabled: n.isLastPage,
            templates: n.templates,
            templateKey: "next",
            pageNumber: n.currentPage + 1,
            createURL: n.createURL,
            cssClasses: n.cssClasses,
            createClickHandler: t,
          }),
        n.showLast &&
          L(qo, {
            ariaLabel: "Last Page, Page ".concat(n.nbPages),
            className: n.cssClasses.lastPageItem,
            isDisabled: n.isLastPage,
            templates: n.templates,
            templateKey: "last",
            pageNumber: n.nbPages - 1,
            createURL: n.createURL,
            cssClasses: n.cssClasses,
            createClickHandler: t,
          })
      )
    );
  }
  function qo(e) {
    var t = e.templates,
      n = e.templateKey,
      r = e.ariaLabel,
      i = e.pageNumber,
      a = e.className,
      s = e.isDisabled,
      s = void 0 !== s && s,
      o = e.isSelected,
      c = e.cssClasses,
      u = e.createURL,
      e = e.createClickHandler;
    return L(
      "li",
      {
        className: C(
          c.item,
          s && c.disabledItem,
          a,
          void 0 !== o && o && c.selectedItem
        ),
      },
      L(
        S,
        s
          ? {
              rootTagName: "span",
              rootProps: { className: c.link, "aria-label": r },
              templateKey: n,
              templates: t,
              data: { page: i + 1 },
            }
          : {
              rootTagName: "a",
              rootProps: {
                className: c.link,
                "aria-label": r,
                href: u(i),
                onClick: e(i),
              },
              templateKey: n,
              templates: t,
              data: { page: i + 1 },
            }
      )
    );
  }
  var Qo,
    m,
    Vo,
    Ko,
    zo = i("Pagination"),
    Jo = l({ name: "pagination" }),
    Zo = {
      previous: function () {
        return "‹";
      },
      next: function () {
        return "›";
      },
      page: function (e) {
        e = e.page;
        return "".concat(e);
      },
      first: function () {
        return "«";
      },
      last: function () {
        return "»";
      },
    },
    Yo = 0,
    Xo = [],
    Go = [],
    ec = w.__b,
    tc = w.__r,
    nc = w.diffed,
    rc = w.__c,
    ic = w.unmount;
  function ac(e, t) {
    w.__h && w.__h(m, e, Yo || t), (Yo = 0);
    t = m.__H || (m.__H = { __: [], __h: [] });
    return e >= t.__.length && t.__.push({ __V: Go }), t.__[e];
  }
  function sc(e) {
    Yo = 1;
    var a,
      t = fc,
      n = void 0,
      s = ac(Qo++, 2);
    return (
      (s.t = t),
      s.__c ||
        ((s.__ = [
          n ? n(e) : fc(void 0, e),
          function (e) {
            var t = (s.__N || s.__)[0],
              e = s.t(t, e);
            t !== e && ((s.__N = [e, s.__[1]]), s.__c.setState({}));
          },
        ]),
        (s.__c = m).u) ||
        ((m.u = !0),
        (a = m.shouldComponentUpdate),
        (m.shouldComponentUpdate = function (e, t, n) {
          var r, i;
          return (
            !s.__c.__H ||
            (((r = s.__c.__H.__.filter(function (e) {
              return e.__c;
            })).every(function (e) {
              return !e.__N;
            }) ||
              ((i = !1),
              r.forEach(function (e) {
                var t;
                e.__N &&
                  ((t = e.__[0]),
                  (e.__ = e.__N),
                  (e.__N = void 0),
                  t !== e.__[0]) &&
                  (i = !0);
              }),
              !!i)) &&
              (!a || a.call(this, e, t, n)))
          );
        })),
      s.__N || s.__
    );
  }
  function oc(e) {
    return (
      (Yo = 5),
      (t = function () {
        return { current: e };
      }),
      (n = []),
      hc((r = ac(Qo++, 7)).__H, n)
        ? ((r.__V = t()), (r.i = n), (r.__h = t), r.__V)
        : r.__
    );
    var t, n, r;
  }
  function cc() {
    for (var t; (t = Xo.shift()); )
      if (t.__P && t.__H)
        try {
          t.__H.__h.forEach(lc), t.__H.__h.forEach(dc), (t.__H.__h = []);
        } catch (e) {
          (t.__H.__h = []), w.__e(e, t.__v);
        }
  }
  (w.__b = function (e) {
    "function" != typeof e.type || e.o || e.type === x
      ? e.o || (e.o = e.__ && e.__.o ? e.__.o : "")
      : (e.o =
          (e.__ && e.__.o ? e.__.o : "") +
          (e.__ && e.__.__k ? e.__.__k.indexOf(e) : 0)),
      (m = null),
      ec && ec(e);
  }),
    (w.__r = function (e) {
      tc && tc(e), (Qo = 0);
      e = (m = e.__c).__H;
      e &&
        (Vo === m
          ? ((e.__h = []),
            (m.__h = []),
            e.__.forEach(function (e) {
              e.__N && (e.__ = e.__N), (e.__V = Go), (e.__N = e.i = void 0);
            }))
          : (e.__h.forEach(lc), e.__h.forEach(dc), (e.__h = []))),
        (Vo = m);
    }),
    (w.diffed = function (e) {
      nc && nc(e);
      e = e.__c;
      e &&
        e.__H &&
        (!e.__H.__h.length ||
          (1 !== Xo.push(e) && Ko === w.requestAnimationFrame) ||
          (
            (Ko = w.requestAnimationFrame) ||
            function (e) {
              function t() {
                clearTimeout(r), uc && cancelAnimationFrame(n), setTimeout(e);
              }
              var n,
                r = setTimeout(t, 100);
              uc && (n = requestAnimationFrame(t));
            }
          )(cc),
        e.__H.__.forEach(function (e) {
          e.i && (e.__H = e.i),
            e.__V !== Go && (e.__ = e.__V),
            (e.i = void 0),
            (e.__V = Go);
        })),
        (Vo = m = null);
    }),
    (w.__c = function (e, n) {
      n.some(function (t) {
        try {
          t.__h.forEach(lc),
            (t.__h = t.__h.filter(function (e) {
              return !e.__ || dc(e);
            }));
        } catch (e) {
          n.some(function (e) {
            e.__h && (e.__h = []);
          }),
            (n = []),
            w.__e(e, t.__v);
        }
      }),
        rc && rc(e, n);
    }),
    (w.unmount = function (e) {
      ic && ic(e);
      var t,
        e = e.__c;
      e &&
        e.__H &&
        (e.__H.__.forEach(function (e) {
          try {
            lc(e);
          } catch (e) {
            t = e;
          }
        }),
        (e.__H = void 0),
        t) &&
        w.__e(t, e.__v);
    });
  var uc = "function" == typeof requestAnimationFrame;
  function lc(e) {
    var t = m,
      n = e.__c;
    "function" == typeof n && ((e.__c = void 0), n()), (m = t);
  }
  function dc(e) {
    var t = m;
    (e.__c = e.__()), (m = t);
  }
  function hc(n, e) {
    return (
      !n ||
      n.length !== e.length ||
      e.some(function (e, t) {
        return e !== n[t];
      })
    );
  }
  function fc(e, t) {
    return "function" == typeof t ? t(e) : t;
  }
  function mc(t) {
    var e,
      n,
      r = k(sc(t.isCollapsed), 2),
      i = r[0],
      a = r[1],
      r = k(sc(!1), 2),
      s = r[0],
      o = r[1],
      c = oc(null);
    return (
      (r = function () {
        var e = c.current;
        if (e)
          return (
            e.appendChild(t.bodyElement),
            function () {
              e.removeChild(t.bodyElement);
            }
          );
      }),
      (e = [c, t.bodyElement]),
      (n = ac(Qo++, 3)),
      !w.__s && hc(n.__H, e) && ((n.__ = r), (n.i = e), m.__H.__h.push(n)),
      s || t.isCollapsed === i || a(t.isCollapsed),
      L(
        "div",
        {
          className: C(
            t.cssClasses.root,
            t.hidden && t.cssClasses.noRefinementRoot,
            t.collapsible && t.cssClasses.collapsibleRoot,
            i && t.cssClasses.collapsedRoot
          ),
          hidden: t.hidden,
        },
        t.templates.header &&
          L(
            "div",
            { className: t.cssClasses.header },
            L(S, {
              templates: t.templates,
              templateKey: "header",
              rootTagName: "span",
              data: t.data,
            }),
            t.collapsible &&
              L(
                "button",
                {
                  className: t.cssClasses.collapseButton,
                  "aria-expanded": !i,
                  onClick: function (e) {
                    e.preventDefault(),
                      o(!0),
                      a(function (e) {
                        return !e;
                      });
                  },
                },
                L(S, {
                  templates: t.templates,
                  templateKey: "collapseButtonText",
                  rootTagName: "span",
                  data: { collapsed: i },
                })
              )
          ),
        L("div", { className: t.cssClasses.body, ref: c }),
        t.templates.footer &&
          L(S, {
            templates: t.templates,
            templateKey: "footer",
            rootProps: { className: t.cssClasses.footer },
            data: t.data,
          })
      )
    );
  }
  var pc,
    gc,
    vc = l({ name: "panel" }),
    yc = i("Panel"),
    bc = ["placesReference", "defaultPosition"],
    Rc = ["places"],
    Ya = Z(function (e) {
      var t = e || {},
        n = t.placesReference,
        r = t.defaultPosition,
        i = void 0 === r ? [] : r,
        r = j(t, bc);
      if ("function" != typeof n)
        throw new Error(
          "The `placesReference` option requires a valid Places.js reference."
        );
      var a = n(r),
        s = {
          query: "",
          initialLatLngViaIP: void 0,
          isInitialLatLngViaIPSet: !1,
        };
      return {
        $$type: "ais.places",
        $$widgetType: "ais.places",
        init: function (e) {
          var r = e.helper;
          a.on("change", function (e) {
            var e = e.suggestion,
              t = e.value,
              e = e.latlng,
              n = e.lat,
              e = e.lng;
            (s.query = t),
              r
                .setQueryParameter("insideBoundingBox", void 0)
                .setQueryParameter("aroundLatLngViaIP", !1)
                .setQueryParameter("aroundLatLng", "".concat(n, ",").concat(e))
                .search();
          }),
            a.on("clear", function () {
              (s.query = ""),
                r.setQueryParameter("insideBoundingBox", void 0),
                1 < i.length
                  ? r
                      .setQueryParameter("aroundLatLngViaIP", !1)
                      .setQueryParameter("aroundLatLng", i.join(","))
                  : r
                      .setQueryParameter(
                        "aroundLatLngViaIP",
                        s.initialLatLngViaIP
                      )
                      .setQueryParameter("aroundLatLng", void 0),
                r.search();
            });
        },
        getWidgetUiState: function (e, t) {
          t = t.searchParameters.aroundLatLng || i.join(",");
          return t !== i.join(",") || s.query
            ? F(F({}, e), {}, { places: { query: s.query, position: t } })
            : (e.places, j(e, Rc));
        },
        getWidgetSearchParameters: function (e, t) {
          var t = t.uiState.places || {},
            n = t.query,
            n = void 0 === n ? "" : n,
            t = t.position,
            t = void 0 === t ? i.join(",") : t;
          return (
            (s.query = n),
            s.isInitialLatLngViaIPSet ||
              ((s.isInitialLatLngViaIPSet = !0),
              (s.initialLatLngViaIP = e.aroundLatLngViaIP)),
            a.setVal(n),
            a.close(),
            e
              .setQueryParameter("insideBoundingBox", void 0)
              .setQueryParameter("aroundLatLngViaIP", !1)
              .setQueryParameter("aroundLatLng", t || void 0)
          );
        },
        getRenderState: function (e, t) {
          return F(F({}, e), {}, { places: this.getWidgetRenderState(t) });
        },
        getWidgetRenderState: function () {
          return { widgetParams: e };
        },
      };
    }),
    Sc = function (e) {
      var t = e.url,
        n = e.theme,
        e = e.cssClasses;
      return L(
        "div",
        { className: e.root },
        L(
          "a",
          {
            href: t,
            target: "_blank",
            className: e.link,
            "aria-label": "Search by Algolia",
            rel: "noopener noreferrer",
          },
          L(
            "svg",
            {
              height: "1.2em",
              className: e.logo,
              viewBox: "0 0 572 64",
              style: { width: "auto" },
            },
            L("path", {
              fill: "dark" === n ? "#FFF" : "#36395A",
              d: "M16 48.3c-3.4 0-6.3-.6-8.7-1.7A12.4 12.4 0 0 1 1.9 42C.6 40 0 38 0 35.4h6.5a6.7 6.7 0 0 0 3.9 6c1.4.7 3.3 1.1 5.6 1.1 2.2 0 4-.3 5.4-1a7 7 0 0 0 3-2.4 6 6 0 0 0 1-3.4c0-1.5-.6-2.8-1.9-3.7-1.3-1-3.3-1.6-5.9-1.8l-4-.4c-3.7-.3-6.6-1.4-8.8-3.4a10 10 0 0 1-3.3-7.9c0-2.4.6-4.6 1.8-6.4a12 12 0 0 1 5-4.3c2.2-1 4.7-1.6 7.5-1.6s5.5.5 7.6 1.6a12 12 0 0 1 5 4.4c1.2 1.8 1.8 4 1.8 6.7h-6.5a6.4 6.4 0 0 0-3.5-5.9c-1-.6-2.6-1-4.4-1s-3.2.3-4.4 1c-1.1.6-2 1.4-2.6 2.4-.5 1-.8 2-.8 3.1a5 5 0 0 0 1.5 3.6c1 1 2.6 1.7 4.7 1.9l4 .3c2.8.2 5.2.8 7.2 1.8 2.1 1 3.7 2.2 4.9 3.8a9.7 9.7 0 0 1 1.7 5.8c0 2.5-.7 4.7-2 6.6a13 13 0 0 1-5.6 4.4c-2.4 1-5.2 1.6-8.4 1.6Zm35.6 0c-2.6 0-4.8-.4-6.7-1.3a13 13 0 0 1-4.7-3.5 17.1 17.1 0 0 1-3.6-10.4v-1c0-2 .3-3.8 1-5.6a13 13 0 0 1 7.3-8.3 15 15 0 0 1 6.3-1.4A13.2 13.2 0 0 1 64 24.3c1 2.2 1.6 4.6 1.6 7.2V34H39.4v-4.3h21.8l-1.8 2.2c0-2-.3-3.7-.9-5.1a7.3 7.3 0 0 0-2.7-3.4c-1.2-.7-2.7-1.1-4.6-1.1s-3.4.4-4.7 1.3a8 8 0 0 0-2.9 3.6c-.6 1.5-.9 3.3-.9 5.4 0 2 .3 3.7 1 5.3a7.9 7.9 0 0 0 2.8 3.7c1.3.8 3 1.3 5 1.3s3.8-.5 5.1-1.3c1.3-1 2.1-2 2.4-3.2h6a11.8 11.8 0 0 1-7 8.7 16 16 0 0 1-6.4 1.2ZM80 48c-2.2 0-4-.3-5.7-1a8.4 8.4 0 0 1-3.7-3.3 9.7 9.7 0 0 1-1.3-5.2c0-2 .5-3.8 1.5-5.2a9 9 0 0 1 4.3-3.1c1.8-.7 4-1 6.7-1H89v4.1h-7.5c-2 0-3.4.5-4.4 1.4-1 1-1.6 2.1-1.6 3.6s.5 2.7 1.6 3.6c1 1 2.5 1.4 4.4 1.4 1.1 0 2.2-.2 3.2-.7 1-.4 1.9-1 2.6-2 .6-1 1-2.4 1-4.2l1.7 2.1c-.2 2-.7 3.8-1.5 5.2a9 9 0 0 1-3.4 3.3 12 12 0 0 1-5.3 1Zm9.5-.7v-8.8h-1v-10c0-1.8-.5-3.2-1.4-4.1-1-1-2.4-1.4-4.2-1.4a142.9 142.9 0 0 0-10.2.4v-5.6a74.8 74.8 0 0 1 8.6-.4c3 0 5.5.4 7.5 1.2s3.4 2 4.4 3.6c1 1.7 1.4 4 1.4 6.7v18.4h-5Zm12.9 0V17.8h5v12.3h-.2c0-4.2 1-7.4 2.8-9.5a11 11 0 0 1 8.3-3.1h1v5.6h-2a9 9 0 0 0-6.3 2.2c-1.5 1.5-2.2 3.6-2.2 6.4v15.6h-6.4Zm34.4 1a15 15 0 0 1-6.6-1.3c-1.9-.9-3.4-2-4.7-3.5a15.5 15.5 0 0 1-2.7-5c-.6-1.7-1-3.6-1-5.4v-1c0-2 .4-3.8 1-5.6a15 15 0 0 1 2.8-4.9c1.3-1.5 2.8-2.6 4.6-3.5a16.4 16.4 0 0 1 13.3.2c2 1 3.5 2.3 4.8 4a12 12 0 0 1 2 6H144c-.2-1.6-1-3-2.2-4.1a7.5 7.5 0 0 0-5.2-1.7 8 8 0 0 0-4.7 1.3 8 8 0 0 0-2.8 3.6 13.8 13.8 0 0 0 0 10.3c.6 1.5 1.5 2.7 2.8 3.6s2.8 1.3 4.8 1.3c1.5 0 2.7-.2 3.8-.8a7 7 0 0 0 2.6-2c.7-1 1-2 1.2-3.2h6.2a11 11 0 0 1-2 6.2 15.1 15.1 0 0 1-11.8 5.5Zm19.7-1v-40h6.4V31h-1.3c0-3 .4-5.5 1.1-7.6a9.7 9.7 0 0 1 3.5-4.8A9.9 9.9 0 0 1 172 17h.3c3.5 0 6 1.1 7.9 3.5 1.7 2.3 2.6 5.7 2.6 10v16.8h-6.4V29.6c0-2.1-.6-3.8-1.8-5a6.4 6.4 0 0 0-4.8-1.8c-2 0-3.7.7-5 2a7.8 7.8 0 0 0-1.9 5.5v17h-6.4Zm63.8 1a12.2 12.2 0 0 1-10.9-6.2 19 19 0 0 1-1.8-7.3h1.4v12.5h-5.1v-40h6.4v19.8l-2 3.5c.2-3.1.8-5.7 1.9-7.7a11 11 0 0 1 4.4-4.5c1.8-1 3.9-1.5 6.1-1.5a13.4 13.4 0 0 1 12.8 9.1c.7 1.9 1 3.8 1 6v1c0 2.2-.3 4.1-1 6a13.6 13.6 0 0 1-13.2 9.4Zm-1.2-5.5a8.4 8.4 0 0 0 7.9-5c.7-1.5 1.1-3.3 1.1-5.3s-.4-3.8-1.1-5.3a8.7 8.7 0 0 0-3.2-3.6 9.6 9.6 0 0 0-9.2-.2 8.5 8.5 0 0 0-3.3 3.2c-.8 1.4-1.3 3-1.3 5v2.3a9 9 0 0 0 1.3 4.8 9 9 0 0 0 3.4 3c1.4.7 2.8 1 4.4 1Zm27.3 3.9-10-28.9h6.5l9.5 28.9h-6Zm-7.5 12.2v-5.7h4.9c1 0 2-.1 2.9-.4a4 4 0 0 0 2-1.4c.4-.7.9-1.6 1.2-2.7l8.6-30.9h6.2l-9.3 32.4a14 14 0 0 1-2.5 5 8.9 8.9 0 0 1-4 2.8c-1.5.6-3.4.9-5.6.9h-4.4Zm9-12.2v-5.2h6.4v5.2H248Z",
            }),
            L("path", {
              fill: "dark" === n ? "#FFF" : "#003DFF",
              d: "M534.4 9.1H528a.8.8 0 0 1-.7-.7V1.8c0-.4.2-.7.6-.8l6.5-1c.4 0 .8.2.9.6v7.8c0 .4-.4.7-.8.7zM428 35.2V.8c0-.5-.3-.8-.7-.8h-.2l-6.4 1c-.4 0-.7.4-.7.8v35c0 1.6 0 11.8 12.3 12.2.5 0 .8-.4.8-.8V43c0-.4-.3-.7-.6-.8-4.5-.5-4.5-6-4.5-7zm106.5-21.8H528c-.4 0-.7.4-.7.8v34c0 .4.3.8.7.8h6.5c.4 0 .8-.4.8-.8v-34c0-.5-.4-.8-.8-.8zm-17.7 21.8V.8c0-.5-.3-.8-.8-.8l-6.5 1c-.4 0-.7.4-.7.8v35c0 1.6 0 11.8 12.3 12.2.4 0 .8-.4.8-.8V43c0-.4-.3-.7-.7-.8-4.4-.5-4.4-6-4.4-7zm-22.2-20.6a16.5 16.5 0 0 1 8.6 9.3c.8 2.2 1.3 4.8 1.3 7.5a19.4 19.4 0 0 1-4.6 12.6 14.8 14.8 0 0 1-5.2 3.6c-2 .9-5.2 1.4-6.8 1.4a21 21 0 0 1-6.7-1.4 15.4 15.4 0 0 1-8.6-9.3 21.3 21.3 0 0 1 0-14.4 15.2 15.2 0 0 1 8.6-9.3c2-.8 4.3-1.2 6.7-1.2s4.6.4 6.7 1.2zm-6.7 27.6c2.7 0 4.7-1 6.2-3s2.2-4.3 2.2-7.8-.7-6.3-2.2-8.3-3.5-3-6.2-3-4.7 1-6.1 3c-1.5 2-2.2 4.8-2.2 8.3s.7 5.8 2.2 7.8 3.5 3 6.2 3zm-88.8-28.8c-6.2 0-11.7 3.3-14.8 8.2a18.6 18.6 0 0 0 4.8 25.2c1.8 1.2 4 1.8 6.2 1.7s.1 0 .1 0h.9c4.2-.7 8-4 9.1-8.1v7.4c0 .4.3.7.8.7h6.4a.7.7 0 0 0 .7-.7V14.2c0-.5-.3-.8-.7-.8h-13.5zm6.3 26.5a9.8 9.8 0 0 1-5.7 2h-.5a10 10 0 0 1-9.2-14c1.4-3.7 5-6.3 9-6.3h6.4v18.3zm152.3-26.5h13.5c.5 0 .8.3.8.7v33.7c0 .4-.3.7-.8.7h-6.4a.7.7 0 0 1-.8-.7v-7.4c-1.2 4-4.8 7.4-9 8h-.1a4.2 4.2 0 0 1-.5.1h-.9a10.3 10.3 0 0 1-7-2.6c-4-3.3-6.5-8.4-6.5-14.2 0-3.7 1-7.2 3-10 3-5 8.5-8.3 14.7-8.3zm.6 28.4c2.2-.1 4.2-.6 5.7-2V21.7h-6.3a9.8 9.8 0 0 0-9 6.4 10.2 10.2 0 0 0 9.1 13.9h.5zM452.8 13.4c-6.2 0-11.7 3.3-14.8 8.2a18.5 18.5 0 0 0 3.6 24.3 10.4 10.4 0 0 0 13 .6c2.2-1.5 3.8-3.7 4.5-6.1v7.8c0 2.8-.8 5-2.2 6.3-1.5 1.5-4 2.2-7.5 2.2l-6-.3c-.3 0-.7.2-.8.5l-1.6 5.5c-.1.4.1.8.5 1h.1c2.8.4 5.5.6 7 .6 6.3 0 11-1.4 14-4.1 2.7-2.5 4.2-6.3 4.5-11.4V14.2c0-.5-.4-.8-.8-.8h-13.5zm6.3 8.2v18.3a9.6 9.6 0 0 1-5.6 2h-1a10.3 10.3 0 0 1-8.8-14c1.4-3.7 5-6.3 9-6.3h6.4zM291 31.5A32 32 0 0 1 322.8 0h30.8c.6 0 1.2.5 1.2 1.2v61.5c0 1.1-1.3 1.7-2.2 1l-19.2-17a18 18 0 0 1-11 3.4 18.1 18.1 0 1 1 18.2-14.8c-.1.4-.5.7-.9.6-.1 0-.3 0-.4-.2l-3.8-3.4c-.4-.3-.6-.8-.7-1.4a12 12 0 1 0-2.4 8.3c.4-.4 1-.5 1.6-.2l14.7 13.1v-46H323a26 26 0 1 0 10 49.7c.8-.4 1.6-.2 2.3.3l3 2.7c.3.2.3.7 0 1l-.2.2a32 32 0 0 1-47.2-28.6z",
            })
          )
        )
      );
    },
    _c = i("PoweredBy"),
    wc = l({ name: "powered-by" }),
    Pc = l({ name: "query-rule-context" }),
    Nc = function (e) {
      var t = e.cssClasses,
        n = e.templates,
        e = e.items;
      return L(S, {
        templateKey: "default",
        templates: n,
        rootProps: { className: t.root },
        data: { items: e },
      });
    },
    xc = {
      default: function (e) {
        e = e.items;
        return JSON.stringify(e, null, 2);
      },
    },
    Ic = l({ name: "query-rule-custom-data" }),
    Cc = i("QueryRuleCustomData"),
    Tc = l({ name: "related-products" }),
    Fc =
      ((pc = (el = { createElement: L, Fragment: x }).createElement),
      (gc = el.Fragment),
      function (e) {
        var t = e.classNames,
          t = void 0 === t ? {} : t,
          n = e.emptyComponent,
          n = void 0 === n ? Ha({ createElement: pc, Fragment: gc }) : n,
          r = e.headerComponent,
          r = void 0 === r ? Aa({ createElement: pc, Fragment: gc }) : r,
          i = e.itemComponent,
          i = void 0 === i ? Wa({ createElement: pc, Fragment: gc }) : i,
          a = e.view,
          a = void 0 === a ? Da({ createElement: pc, Fragment: gc }) : a,
          s = e.items,
          o = e.status,
          c = e.translations,
          u = e.sendEvent,
          e = Ma(e, Ka),
          c = (function (t) {
            for (var e = 1; e < arguments.length; e++) {
              var n = null != arguments[e] ? arguments[e] : {};
              e % 2
                ? za(Object(n), !0).forEach(function (e) {
                    Oa(t, e, n[e]);
                  })
                : Object.getOwnPropertyDescriptors
                ? Object.defineProperties(
                    t,
                    Object.getOwnPropertyDescriptors(n)
                  )
                : za(Object(n)).forEach(function (e) {
                    Object.defineProperty(
                      t,
                      e,
                      Object.getOwnPropertyDescriptor(n, e)
                    );
                  });
            }
            return t;
          })({ title: "Related products", sliderLabel: "Related products" }, c),
          t = {
            root: C("ais-RelatedProducts", t.root),
            emptyRoot: C(
              "ais-RelatedProducts",
              t.root,
              "ais-RelatedProducts--empty",
              t.emptyRoot,
              e.className
            ),
            title: C("ais-RelatedProducts-title", t.title),
            container: C("ais-RelatedProducts-container", t.container),
            list: C("ais-RelatedProducts-list", t.list),
            item: C("ais-RelatedProducts-item", t.item),
          };
        return 0 === s.length && "idle" === o
          ? pc("section", Fa({}, e, { className: t.emptyRoot }), pc(n, null))
          : pc(
              "section",
              Fa({}, e, { className: t.root }),
              pc(r, { classNames: t, items: s, translations: c }),
              pc(a, {
                classNames: t,
                translations: c,
                itemComponent: i,
                items: s,
                sendEvent: u,
              })
            );
      });
  function Ec(e) {
    return e.replace(/^(0+)\d/, function (e) {
      return Number(e).toString();
    });
  }
  function jc(e) {
    var t = e.style,
      e = e.children,
      n = Math.round(parseFloat(t.left)),
      r = [0, 50, 100].includes(n),
      e = Math.round(100 * parseInt(e, 10)) / 100;
    return L(
      "div",
      {
        style: F(F({}, t), {}, { marginLeft: 100 === n ? "-2px" : 0 }),
        className: C(
          "rheostat-marker",
          "rheostat-marker-horizontal",
          r && "rheostat-marker-large"
        ),
      },
      r && L("div", { className: "rheostat-value" }, e)
    );
  }
  var kc = (function () {
      B(s, Ht);
      var a = V(s);
      function s() {
        var e, n;
        D(this, s);
        for (var t = arguments.length, r = new Array(t), i = 0; i < t; i++)
          r[i] = arguments[i];
        return (
          E(y((n = a.call.apply(a, [this].concat(r)))), "state", {
            min: null == (e = n.props.values.min) ? void 0 : e.toString(),
            max: null == (e = n.props.values.max) ? void 0 : e.toString(),
          }),
          E(y(n), "onInput", function (t) {
            return function (e) {
              e = e.currentTarget.value;
              n.setState(E({}, t, e));
            };
          }),
          E(y(n), "onSubmit", function (e) {
            e.preventDefault();
            var e = n.state,
              t = e.min,
              e = e.max;
            n.props.refine([t ? Number(t) : void 0, e ? Number(e) : void 0]);
          }),
          n
        );
      }
      return (
        $(s, [
          {
            key: "componentWillReceiveProps",
            value: function (e) {
              var t;
              this.setState({
                min: null == (t = e.values.min) ? void 0 : t.toString(),
                max: null == (t = e.values.max) ? void 0 : t.toString(),
              });
            },
          },
          {
            key: "render",
            value: function () {
              var e = this.state,
                t = e.min,
                e = e.max,
                n = this.props,
                r = n.min,
                i = n.max,
                a = n.step,
                s = n.cssClasses,
                n = n.templateProps,
                o = !(!r || !i) && i <= r,
                c = Boolean(t || e);
              return L(
                "div",
                { className: C(s.root, !c && s.noRefinement) },
                L(
                  "form",
                  { className: s.form, onSubmit: this.onSubmit },
                  L(
                    "label",
                    { className: s.label },
                    L("input", {
                      className: C(s.input, s.inputMin),
                      type: "number",
                      min: r,
                      max: i,
                      step: a,
                      value: Ec(null != t ? t : ""),
                      onInput: this.onInput("min"),
                      placeholder: null == r ? void 0 : r.toString(),
                      disabled: o,
                    })
                  ),
                  L(
                    S,
                    g({}, n, {
                      templateKey: "separatorText",
                      rootTagName: "span",
                      rootProps: { className: s.separator },
                    })
                  ),
                  L(
                    "label",
                    { className: s.label },
                    L("input", {
                      className: C(s.input, s.inputMax),
                      type: "number",
                      min: r,
                      max: i,
                      step: a,
                      value: Ec(null != e ? e : ""),
                      onInput: this.onInput("max"),
                      placeholder: null == i ? void 0 : i.toString(),
                      disabled: o,
                    })
                  ),
                  L(
                    S,
                    g({}, n, {
                      templateKey: "submitText",
                      rootTagName: "button",
                      rootProps: {
                        type: "submit",
                        className: s.submit,
                        disabled: o,
                      },
                    })
                  )
                )
              );
            },
          },
        ]),
        s
      );
    })(),
    Oc = l({ name: "range-input" }),
    Lc = i("RangeInput"),
    Mc = {
      separatorText: function () {
        return "to";
      },
      submitText: function () {
        return "Go";
      },
    },
    Hc = 40,
    Ac = 35,
    Wc = 27,
    Dc = 36,
    $c = 37,
    Bc = 34,
    Uc = 33,
    qc = 39,
    Qc = 38,
    Vc = 100;
  function Kc(e, t, n) {
    return ((e - t) / (n - t)) * 100;
  }
  function zc(e, t, n) {
    return 0 === e ? t : 100 === e ? n : Math.round((n - t) * (e / 100) + t);
  }
  function Jc(e) {
    return [
      "rheostat",
      "vertical" === e.orientation
        ? "rheostat-vertical"
        : "rheostat-horizontal",
    ]
      .concat(e.className.split(" "))
      .join(" ");
  }
  function Zc(e) {
    return Number(e.currentTarget.getAttribute("data-handle-key"));
  }
  function Yc(e) {
    e.stopPropagation(), e.preventDefault();
  }
  var Xc = L("div", { className: "rheostat-background" }),
    Gc = (function () {
      B(i, Ht);
      var r = V(i);
      function i() {
        var f;
        D(this, i);
        for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++)
          t[n] = arguments[n];
        return (
          E(
            y((f = r.call.apply(r, [this].concat(t)))),
            "x",
            [0, 0].map(function (e) {
              return e;
            })
          ),
          E(y(f), "state", {
            className: Jc(f.props),
            handlePos: f.props.values.map(function (e) {
              return Kc(e, f.props.min, f.props.max);
            }),
            handleDimensions: 0,
            mousePos: null,
            sliderBox: {},
            slidingIndex: null,
            values: f.props.values,
          }),
          E(y(f), "rheostat", Mt()),
          E(y(f), "componentWillReceiveProps", function (n) {
            var e = f.props,
              t = e.className,
              r = e.disabled,
              i = e.min,
              a = e.max,
              e = e.orientation,
              s = f.state,
              o = s.values,
              s = s.slidingIndex,
              i = n.min !== i || n.max !== a,
              a =
                o.length !== n.values.length ||
                o.some(function (e, t) {
                  return n.values[t] !== e;
                }),
              o = n.className !== t || n.orientation !== e,
              t = n.disabled && !r;
            o && f.setState({ className: Jc(n) }),
              (i || a) && f.updateNewValues(n),
              t && null !== s && f.endSlide();
          }),
          E(y(f), "getPublicState", function () {
            var e = f.props,
              t = e.min;
            return { max: e.max, min: t, values: f.state.values };
          }),
          E(y(f), "getSliderBoundingBox", function () {
            var e = f.rheostat.current,
              t = e.getBoundingClientRect();
            return {
              height: t.height || e.clientHeight,
              left: t.left,
              top: t.top,
              width: t.width || e.clientWidth,
            };
          }),
          E(y(f), "getProgressStyle", function (e) {
            var t = f.state.handlePos,
              n = t[e];
            return 0 === e
              ? "vertical" === f.props.orientation
                ? { height: "".concat(n, "%"), top: 0 }
                : { left: 0, width: "".concat(n, "%") }
              : ((t = n - (n = t[e - 1])),
                "vertical" === f.props.orientation
                  ? { height: "".concat(t, "%"), top: "".concat(n, "%") }
                  : { left: "".concat(n, "%"), width: "".concat(t, "%") });
          }),
          E(y(f), "getMinValue", function (e) {
            return f.state.values[e - 1]
              ? Math.max(f.props.min, f.state.values[e - 1])
              : f.props.min;
          }),
          E(y(f), "getMaxValue", function (e) {
            return f.state.values[e + 1]
              ? Math.min(f.props.max, f.state.values[e + 1])
              : f.props.max;
          }),
          E(y(f), "getHandleDimensions", function (e, t) {
            e = e.currentTarget || null;
            return e
              ? "vertical" === f.props.orientation
                ? ((e.clientHeight / t.height) * Vc) / 2
                : ((e.clientWidth / t.width) * Vc) / 2
              : 0;
          }),
          E(y(f), "getClosestSnapPoint", function (n) {
            return f.props.snapPoints.length
              ? f.props.snapPoints.reduce(function (e, t) {
                  return Math.abs(e - n) < Math.abs(t - n) ? e : t;
                })
              : n;
          }),
          E(y(f), "getSnapPosition", function (e) {
            var t, n, r;
            return f.props.snap
              ? ((t = (n = f.props).max),
                (r = zc(e, (n = n.min), t)),
                Kc(f.getClosestSnapPoint(r), n, t))
              : e;
          }),
          E(y(f), "getNextPositionForKey", function (e, t) {
            var n = f.state,
              r = n.handlePos,
              n = n.values,
              i = f.props,
              a = i.max,
              s = i.min,
              i = i.snapPoints,
              o = f.props.snap,
              c = n[e],
              r = r[e],
              u = r,
              l = 1,
              d = (100 <= a ? (r = Math.round(r)) : (l = 100 / (a - s)), null),
              e =
                (o && (d = i.indexOf(f.getClosestSnapPoint(n[e]))),
                E((n = {}), $c, function (e) {
                  return -1 * e;
                }),
                E(n, qc, function (e) {
                  return e;
                }),
                E(n, Qc, function (e) {
                  return e;
                }),
                E(n, Hc, function (e) {
                  return -1 * e;
                }),
                E(n, Bc, function (e) {
                  return 1 < e ? -e : -10 * e;
                }),
                E(n, Uc, function (e) {
                  return 1 < e ? e : 10 * e;
                }),
                n);
            if (Object.prototype.hasOwnProperty.call(e, t))
              (r += e[t](l)),
                o &&
                  d &&
                  (u < r
                    ? d < i.length - 1 && (c = i[d + 1])
                    : 0 < d && (c = i[d - 1]));
            else if (t === Dc) (r = 0), o && (c = i[0]);
            else {
              if (t !== Ac) return null;
              (r = Vc), o && (c = i[i.length - 1]);
            }
            return o ? Kc(c, s, a) : r;
          }),
          E(y(f), "getNextState", function (n, e) {
            var t = f.state.handlePos,
              r = f.props,
              i = r.max,
              a = r.min,
              s = f.validatePosition(n, e),
              r = t.map(function (e, t) {
                return t === n ? s : e;
              });
            return {
              handlePos: r,
              values: r.map(function (e) {
                return zc(e, a, i);
              }),
            };
          }),
          E(y(f), "getClosestHandle", function (r) {
            var i = f.state.handlePos;
            return i.reduce(function (e, t, n) {
              return Math.abs(i[n] - r) < Math.abs(i[e] - r) ? n : e;
            }, 0);
          }),
          E(y(f), "setStartSlide", function (e, t, n) {
            var r = f.getSliderBoundingBox();
            f.setState({
              handleDimensions: f.getHandleDimensions(e, r),
              mousePos: { x: t, y: n },
              sliderBox: r,
              slidingIndex: Zc(e),
            });
          }),
          E(y(f), "startMouseSlide", function (e) {
            f.setStartSlide(e, e.clientX, e.clientY),
              document.addEventListener("mousemove", f.handleMouseSlide, !1),
              document.addEventListener("mouseup", f.endSlide, !1),
              Yc(e);
          }),
          E(y(f), "startTouchSlide", function (e) {
            var t;
            1 < e.changedTouches.length ||
              ((t = e.changedTouches[0]),
              f.setStartSlide(e, t.clientX, t.clientY),
              document.addEventListener("touchmove", f.handleTouchSlide, !1),
              document.addEventListener("touchend", f.endSlide, !1),
              f.props.onSliderDragStart && f.props.onSliderDragStart(),
              Yc(e));
          }),
          E(y(f), "handleMouseSlide", function (e) {
            null !== f.state.slidingIndex &&
              (f.handleSlide(e.clientX, e.clientY), Yc(e));
          }),
          E(y(f), "handleTouchSlide", function (e) {
            var t;
            null !== f.state.slidingIndex &&
              (1 < e.changedTouches.length
                ? f.endSlide()
                : ((t = e.changedTouches[0]),
                  f.handleSlide(t.clientX, t.clientY),
                  Yc(e)));
          }),
          E(y(f), "handleSlide", function (e, t) {
            var n = f.state,
              r = n.slidingIndex,
              n = n.sliderBox,
              n =
                "vertical" === f.props.orientation
                  ? ((t - n.top) / n.height) * Vc
                  : ((e - n.left) / n.width) * Vc;
            f.slideTo(r, n),
              f.canMove(r, n) &&
                (f.setState({ mousePos: { x: e, y: t } }),
                f.props.onSliderDragMove) &&
                f.props.onSliderDragMove();
          }),
          E(y(f), "endSlide", function () {
            var e,
              t = f.state.slidingIndex;
            f.setState({ slidingIndex: null }),
              document.removeEventListener("mouseup", f.endSlide, !1),
              document.removeEventListener("touchend", f.endSlide, !1),
              document.removeEventListener("touchmove", f.handleTouchSlide, !1),
              document.removeEventListener("mousemove", f.handleMouseSlide, !1),
              f.props.onSliderDragEnd && f.props.onSliderDragEnd(),
              f.props.snap
                ? ((e = f.getSnapPosition(f.state.handlePos[t])),
                  f.slideTo(t, e, function () {
                    return f.fireChangeEvent();
                  }))
                : f.fireChangeEvent();
          }),
          E(y(f), "handleClick", function (e) {
            var t;
            e.target.getAttribute("data-handle-key") ||
              ((t = f.getSliderBoundingBox()),
              (e =
                ("vertical" === f.props.orientation
                  ? (e.clientY - t.top) / t.height
                  : (e.clientX - t.left) / t.width) * Vc),
              (t = f.getClosestHandle(e)),
              (e = f.getSnapPosition(e)),
              f.slideTo(t, e, function () {
                return f.fireChangeEvent();
              }),
              f.props.onClick && f.props.onClick());
          }),
          E(y(f), "handleKeydown", function (e) {
            var t,
              n = Zc(e);
            e.keyCode === Wc
              ? e.currentTarget.blur()
              : null !== (t = f.getNextPositionForKey(n, e.keyCode)) &&
                (f.canMove(n, t) &&
                  (f.slideTo(n, t, function () {
                    return f.fireChangeEvent();
                  }),
                  f.props.onKeyPress) &&
                  f.props.onKeyPress(),
                Yc(e));
          }),
          E(y(f), "validatePosition", function (e, t) {
            var n = f.state,
              r = n.handlePos,
              n = n.handleDimensions;
            return Math.max(
              Math.min(t, void 0 !== r[e + 1] ? r[e + 1] - n : Vc),
              void 0 !== r[e - 1] ? r[e - 1] + n : 0
            );
          }),
          E(y(f), "validateValues", function (e, t) {
            var t = t || f.props,
              r = t.max,
              i = t.min;
            return e.map(function (e, t, n) {
              e = Math.max(Math.min(e, r), i);
              return n.length && e < n[t - 1] ? n[t - 1] : e;
            });
          }),
          E(y(f), "canMove", function (e, t) {
            var n = f.state,
              r = n.handlePos,
              n = n.handleDimensions;
            return !(
              t < 0 ||
              Vc < t ||
              (void 0 !== r[e + 1] ? r[e + 1] - n : 1 / 0) < t ||
              t < (void 0 !== r[e - 1] ? r[e - 1] + n : -1 / 0)
            );
          }),
          E(y(f), "fireChangeEvent", function () {
            var e = f.props.onChange;
            e && e(f.getPublicState());
          }),
          E(y(f), "slideTo", function (e, t, n) {
            e = f.getNextState(e, t);
            f.setState(e, function () {
              var e = f.props.onValuesUpdated;
              e && e(f.getPublicState()), n && n();
            });
          }),
          E(y(f), "updateNewValues", function (e) {
            var t, n, r;
            null === f.state.slidingIndex &&
              ((t = e.max),
              (n = e.min),
              (r = e.values),
              (r = f.validateValues(r, e)),
              f.setState(
                {
                  handlePos: r.map(function (e) {
                    return Kc(e, n, t);
                  }),
                  values: r,
                },
                function () {
                  return f.fireChangeEvent();
                }
              ));
          }),
          E(y(f), "render", function () {
            var e = f.props,
              t = e.children,
              n = e.disabled,
              r = e.handle,
              i = e.max,
              a = e.min,
              s = e.orientation,
              o = e.pitComponent,
              c = e.pitPoints,
              u = e.progressBar,
              e = f.state,
              l = e.className,
              d = e.handlePos,
              h = e.values;
            return L(
              "div",
              {
                className: l,
                ref: f.rheostat,
                onClick: n ? void 0 : f.handleClick,
                style: { position: "relative" },
              },
              Xc,
              d.map(function (e, t) {
                e =
                  "vertical" === s
                    ? { top: "".concat(e, "%"), position: "absolute" }
                    : { left: "".concat(e, "%"), position: "absolute" };
                return L(r, {
                  "aria-valuemax": f.getMaxValue(t),
                  "aria-valuemin": f.getMinValue(t),
                  "aria-valuenow": h[t],
                  "aria-disabled": n,
                  "data-handle-key": t,
                  className: "rheostat-handle",
                  key: "handle-".concat(t),
                  onClick: Yc,
                  onKeyDown: n ? void 0 : f.handleKeydown,
                  onMouseDown: n ? void 0 : f.startMouseSlide,
                  onTouchStart: n ? void 0 : f.startTouchSlide,
                  role: "slider",
                  style: e,
                  tabIndex: 0,
                });
              }),
              d.map(function (e, t, n) {
                return 0 === t && 1 < n.length
                  ? null
                  : L(u, {
                      className: "rheostat-progress",
                      key: "progress-bar-".concat(t),
                      style: f.getProgressStyle(t),
                    });
              }),
              o &&
                c.map(function (e) {
                  var t = Kc(e, a, i),
                    t =
                      "vertical" === s
                        ? { top: "".concat(t, "%"), position: "absolute" }
                        : { left: "".concat(t, "%"), position: "absolute" };
                  return L(o, { key: "pit-".concat(e), style: t }, e);
                }),
              t
            );
          }),
          f
        );
      }
      return $(i);
    })(),
    eu =
      (E(Gc, "defaultProps", {
        className: "",
        children: null,
        disabled: !1,
        handle: function (e) {
          return L("button", g({}, e, { type: "button" }));
        },
        max: Vc,
        min: 0,
        onClick: null,
        onChange: null,
        onKeyPress: null,
        onSliderDragEnd: null,
        onSliderDragMove: null,
        onSliderDragStart: null,
        onValuesUpdated: null,
        orientation: "horizontal",
        pitComponent: null,
        pitPoints: [],
        progressBar: "div",
        snap: !1,
        snapPoints: [],
        values: [0],
      }),
      (function () {
        B(a, Ht);
        var i = V(a);
        function a() {
          var t;
          D(this, a);
          for (var e = arguments.length, n = new Array(e), r = 0; r < e; r++)
            n[r] = arguments[r];
          return (
            E(
              y((t = i.call.apply(i, [this].concat(n)))),
              "handleChange",
              function (e) {
                e = e.values;
                t.isDisabled || t.props.refine(e);
              }
            ),
            E(y(t), "createHandleComponent", function (n) {
              return function (e) {
                var t = Math.round(100 * parseFloat(e["aria-valuenow"])) / 100,
                  t = "object" === W(n) && n.format ? n.format(t) : t;
                return L(
                  "div",
                  g({}, e, {
                    className: C(
                      e.className,
                      0 === e["data-handle-key"] && "rheostat-handle-lower",
                      1 === e["data-handle-key"] && "rheostat-handle-upper"
                    ),
                    "aria-label":
                      0 === e["data-handle-key"]
                        ? "Minimum Filter Handle"
                        : "Maximum Filter Handle",
                  }),
                  n && L("div", { className: "rheostat-tooltip" }, t)
                );
              };
            }),
            t
          );
        }
        return (
          $(a, [
            {
              key: "isDisabled",
              get: function () {
                return this.props.min >= this.props.max;
              },
            },
            {
              key: "computeDefaultPitPoints",
              value: function (e) {
                var t = e.min,
                  e = e.max,
                  n = (e - t) / 34;
                return [t].concat(
                  P(
                    et({ end: 33 }).map(function (e) {
                      return t + n * (e + 1);
                    })
                  ),
                  [e]
                );
              },
            },
            {
              key: "computeSnapPoints",
              value: function (e) {
                var t = e.min,
                  n = e.max,
                  e = e.step;
                if (e)
                  return [].concat(P(et({ start: t, end: n, step: e })), [n]);
              },
            },
            {
              key: "render",
              value: function () {
                var e = this.props,
                  t = e.tooltips,
                  n = e.step,
                  r = e.pips,
                  i = e.values,
                  e = e.cssClasses,
                  a = this.isDisabled
                    ? { min: this.props.min, max: this.props.max + 0.001 }
                    : this.props,
                  s = a.min,
                  a = a.max,
                  n = this.computeSnapPoints({ min: s, max: a, step: n }),
                  r =
                    !1 === r
                      ? []
                      : this.computeDefaultPitPoints({ min: s, max: a });
                return L(
                  "div",
                  { className: C(e.root, this.isDisabled && e.disabledRoot) },
                  L(Gc, {
                    handle: this.createHandleComponent(t),
                    onChange: this.handleChange,
                    min: s,
                    max: a,
                    pitComponent: jc,
                    pitPoints: r,
                    snap: !0,
                    snapPoints: n,
                    values: this.isDisabled ? [s, a] : i,
                    disabled: this.isDisabled,
                  })
                );
              },
            },
          ]),
          a
        );
      })()),
    tu = l({ name: "range-slider" }),
    nu = i("RangeSlider");
  function ru(e) {
    var t = e.children,
      n = e.count,
      r = e.value,
      i = e.url,
      e = e.cssClasses;
    return n
      ? L(
          "a",
          {
            className: C(e.link),
            "aria-label": "".concat(r, " & up"),
            href: i,
          },
          t
        )
      : L(
          "div",
          {
            className: C(e.link),
            "aria-label": "".concat(r, " & up"),
            disabled: !0,
          },
          t
        );
  }
  var iu = {
      item: function (e) {
        var t = e.count,
          n = e.value,
          r = e.url,
          i = e.stars,
          a = e.cssClasses;
        return L(
          ru,
          { count: t, value: n, url: r, cssClasses: a },
          i.map(function (e, t) {
            return L(
              "svg",
              {
                key: t,
                className: C(a.starIcon, e ? a.fullStarIcon : a.emptyStarIcon),
                "aria-hidden": "true",
                width: "24",
                height: "24",
              },
              L("use", {
                xlinkHref: e
                  ? "#ais-RatingMenu-starSymbol"
                  : "#ais-RatingMenu-starEmptySymbol",
              })
            );
          }),
          L("span", { "aria-hidden": "true", className: C(a.label) }, "& Up"),
          t && L("span", { className: C(a.count) }, Sa(t))
        );
      },
    },
    au = l({ name: "rating-menu" }),
    T = i("RatingMenu"),
    su = L("path", {
      d: "M12 .288l2.833 8.718h9.167l-7.417 5.389 2.833 8.718-7.416-5.388-7.417 5.388 2.833-8.718-7.416-5.389h9.167z",
    }),
    ou = L("path", {
      d: "M12 6.76l1.379 4.246h4.465l-3.612 2.625 1.379 4.246-3.611-2.625-3.612 2.625 1.379-4.246-3.612-2.625h4.465l1.38-4.246zm0-6.472l-2.833 8.718h-9.167l7.416 5.389-2.833 8.718 7.417-5.388 7.416 5.388-2.833-8.718 7.417-5.389h-9.167l-2.833-8.718z",
    }),
    cu = L("path", {
      d: "M8.114 10L.944 2.83 0 1.885 1.886 0l.943.943L10 8.113l7.17-7.17.944-.943L20 1.886l-.943.943-7.17 7.17 7.17 7.17.943.944L18.114 20l-.943-.943-7.17-7.17-7.17 7.17-.944.943L0 18.114l.943-.943L8.113 10z",
    }),
    uu = L("path", {
      d: "M26.804 29.01c-2.832 2.34-6.465 3.746-10.426 3.746C7.333 32.756 0 25.424 0 16.378 0 7.333 7.333 0 16.378 0c9.046 0 16.378 7.333 16.378 16.378 0 3.96-1.406 7.594-3.746 10.426l10.534 10.534c.607.607.61 1.59-.004 2.202-.61.61-1.597.61-2.202.004L26.804 29.01zm-10.426.627c7.323 0 13.26-5.936 13.26-13.26 0-7.32-5.937-13.257-13.26-13.257C9.056 3.12 3.12 9.056 3.12 16.378c0 7.323 5.936 13.26 13.258 13.26z",
    }),
    lu = L(
      "g",
      { fill: "none", "fill-rule": "evenodd" },
      L(
        "g",
        { transform: "translate(1 1)", "stroke-width": "2" },
        L("circle", { "stroke-opacity": ".5", cx: "18", cy: "18", r: "18" }),
        L(
          "path",
          { d: "M36 18c0-9.94-8.06-18-18-18" },
          L("animateTransform", {
            attributeName: "transform",
            type: "rotate",
            from: "0 18 18",
            to: "360 18 18",
            dur: "1s",
            repeatCount: "indefinite",
          })
        )
      )
    ),
    du = {
      reset: function (e) {
        return L(
          "svg",
          {
            className: e.cssClasses.resetIcon,
            viewBox: "0 0 20 20",
            width: "10",
            height: "10",
            "aria-hidden": "true",
          },
          cu
        );
      },
      submit: function (e) {
        return L(
          "svg",
          {
            className: e.cssClasses.submitIcon,
            width: "10",
            height: "10",
            viewBox: "0 0 40 40",
            "aria-hidden": "true",
          },
          uu
        );
      },
      loadingIndicator: function (e) {
        return L(
          "svg",
          {
            "aria-label": "Results are loading",
            className: e.cssClasses.loadingIcon,
            width: "16",
            height: "16",
            viewBox: "0 0 38 38",
            stroke: "#444",
            "aria-hidden": "true",
          },
          lu
        );
      },
    },
    hu = {
      item: function (e) {
        var t = e.cssClasses,
          n = e.count,
          r = e.value,
          i = e.highlighted,
          a = e.isRefined,
          e = e.isFromSearch;
        return L(
          "label",
          { className: C(t.label) },
          L("input", {
            type: "checkbox",
            className: C(t.checkbox),
            value: r,
            defaultChecked: a,
          }),
          L(
            "span",
            {
              className: C(t.labelText),
              dangerouslySetInnerHTML: e ? { __html: i } : void 0,
            },
            !e && i
          ),
          L("span", { className: C(t.count) }, Sa(n))
        );
      },
      showMoreText: function (e) {
        return e.isShowingMore ? "Show less" : "Show more";
      },
      searchableNoResults: function () {
        return "No results";
      },
    },
    fu = l({ name: "refinement-list" }),
    A = i("RefinementList"),
    mu = i("SearchBox"),
    pu = function (e) {
      var t = e.cssClasses,
        n = e.templates,
        r = e.isRelevantSorted,
        i = e.isVirtualReplica,
        a = e.refine;
      return i
        ? L(
            "div",
            { className: t.root },
            L(S, {
              templateKey: "text",
              templates: n,
              rootProps: { className: t.text },
              data: { isRelevantSorted: r },
            }),
            L(
              "button",
              {
                type: "button",
                className: t.button,
                onClick: function () {
                  a(r ? 0 : void 0);
                },
              },
              L(S, {
                rootTagName: "span",
                templateKey: "button",
                templates: n,
                data: { isRelevantSorted: r },
              })
            )
          )
        : null;
    },
    gu = {
      text: function () {
        return "";
      },
      button: function (e) {
        return e.isRelevantSorted ? "See all results" : "See relevant results";
      },
    },
    vu = l({ name: "relevant-sort" }),
    yu = i("RelevantSort"),
    bu = l({ name: "search-box" }),
    Ru = i("SearchBox"),
    Su = l({ name: "sort-by" }),
    _u = i("SortBy"),
    wu = ["nbHits", "nbSortedHits", "cssClasses", "templateProps"],
    Pu = function (e) {
      var t = e.nbHits,
        n = e.nbSortedHits,
        r = e.cssClasses,
        i = e.templateProps,
        e = j(e, wu);
      return L(
        "div",
        { className: C(r.root) },
        L(
          S,
          g({}, i, {
            templateKey: "text",
            rootTagName: "span",
            rootProps: { className: r.text },
            data: F(
              {
                hasManySortedResults: n && 1 < n,
                hasNoSortedResults: 0 === n,
                hasOneSortedResults: 1 === n,
                hasManyResults: 1 < t,
                hasNoResults: 0 === t,
                hasOneResult: 1 === t,
                nbHits: t,
                nbSortedHits: n,
                cssClasses: r,
              },
              e
            ),
          })
        )
      );
    },
    Nu = l({ name: "stats" }),
    xu = i("Stats"),
    Iu = {
      text: function (e) {
        return ""
          .concat(
            (e.areHitsSorted
              ? function (e) {
                  var t = e.nbHits,
                    n = e.hasNoSortedResults,
                    r = e.hasOneSortedResults,
                    i = e.hasManySortedResults,
                    e = e.nbSortedHits,
                    t = "sorted out of ".concat(Sa(t));
                  if (n) return "No relevant results ".concat(t);
                  if (r) return "1 relevant result ".concat(t);
                  if (i)
                    return ""
                      .concat(Sa(e || 0), " relevant results ")
                      .concat(t);
                  return "";
                }
              : function (e) {
                  var t = e.nbHits,
                    n = e.hasNoResults,
                    r = e.hasOneResult,
                    e = e.hasManyResults;
                  if (n) return "No results";
                  if (r) return "1 result";
                  if (e) return "".concat(Sa(t), " results");
                  return "";
                })(e),
            " found in "
          )
          .concat(e.processingTimeMS, "ms");
      },
    };
  var Cu,
    Tu,
    Fu = function (e) {
      var t = e.currentRefinement,
        n = e.refine,
        r = e.cssClasses,
        e = e.templateProps;
      return L(
        "div",
        { className: r.root },
        L(
          "label",
          { className: r.label },
          L("input", {
            className: r.checkbox,
            type: "checkbox",
            checked: t.isRefined,
            onChange: function (e) {
              return n({ isRefined: !e.target.checked });
            },
          }),
          L(
            S,
            g({}, e, {
              rootTagName: "span",
              rootProps: { className: r.labelText },
              templateKey: "labelText",
              data: t,
            })
          )
        )
      );
    },
    Eu = {
      labelText: function (e) {
        return e.name;
      },
    },
    ju = l({ name: "toggle-refinement" }),
    ku = i("ToggleRefinement"),
    Ou = l({ name: "trending-items" }),
    Lu =
      ((Cu = (el = { createElement: L, Fragment: x }).createElement),
      (Tu = el.Fragment),
      function (e) {
        var t = e.classNames,
          t = void 0 === t ? {} : t,
          n = e.emptyComponent,
          n = void 0 === n ? Ha({ createElement: Cu, Fragment: Tu }) : n,
          r = e.headerComponent,
          r = void 0 === r ? Aa({ createElement: Cu, Fragment: Tu }) : r,
          i = e.itemComponent,
          i = void 0 === i ? Wa({ createElement: Cu, Fragment: Tu }) : i,
          a = e.view,
          a = void 0 === a ? Da({ createElement: Cu, Fragment: Tu }) : a,
          s = e.items,
          o = e.status,
          c = e.translations,
          u = e.sendEvent,
          e = Ma(e, Ja),
          c = (function (t) {
            for (var e = 1; e < arguments.length; e++) {
              var n = null != arguments[e] ? arguments[e] : {};
              e % 2
                ? Za(Object(n), !0).forEach(function (e) {
                    Oa(t, e, n[e]);
                  })
                : Object.getOwnPropertyDescriptors
                ? Object.defineProperties(
                    t,
                    Object.getOwnPropertyDescriptors(n)
                  )
                : Za(Object(n)).forEach(function (e) {
                    Object.defineProperty(
                      t,
                      e,
                      Object.getOwnPropertyDescriptor(n, e)
                    );
                  });
            }
            return t;
          })({ title: "Trending items", sliderLabel: "Trending items" }, c),
          t = {
            root: C("ais-TrendingItems", t.root),
            emptyRoot: C(
              "ais-TrendingItems",
              t.root,
              "ais-TrendingItems--empty",
              t.emptyRoot,
              e.className
            ),
            title: C("ais-TrendingItems-title", t.title),
            container: C("ais-TrendingItems-container", t.container),
            list: C("ais-TrendingItems-list", t.list),
            item: C("ais-TrendingItems-item", t.item),
          };
        return 0 === s.length && "idle" === o
          ? Cu("section", Fa({}, e, { className: t.emptyRoot }), Cu(n, null))
          : Cu(
              "section",
              Fa({}, e, { className: t.root }),
              Cu(r, { classNames: t, items: s, translations: c }),
              Cu(a, {
                classNames: t,
                translations: c,
                itemComponent: i,
                items: s,
                sendEvent: u,
              })
            );
      });
  function Mu(e) {
    var t = e.status,
      n = e.errorCode,
      e = e.isListening;
    return "error" === t && "not-allowed" === n
      ? Bu
      : L(
          x,
          null,
          L("path", {
            d: "M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z",
            fill: e ? "currentColor" : "none",
          }),
          Uu,
          qu,
          Qu
        );
  }
  var Hu,
    Au,
    Wu,
    Du,
    $u = function (e) {
      var t = e.cssClasses,
        n = e.isBrowserSupported,
        r = e.isListening,
        i = e.toggleListening,
        a = e.voiceListeningState,
        e = e.templates,
        s = a.status,
        o = a.transcript,
        c = a.isSpeechFinal,
        a = a.errorCode;
      return L(
        "div",
        { className: t.root },
        L(S, {
          templateKey: "buttonText",
          rootTagName: "button",
          rootProps: {
            className: t.button,
            type: "button",
            title: "Search by voice".concat(
              n ? "" : " (not supported on this browser)"
            ),
            onClick: function (e) {
              e.currentTarget instanceof HTMLElement && e.currentTarget.blur(),
                i();
            },
            disabled: !n,
          },
          data: {
            status: s,
            errorCode: a,
            isListening: r,
            transcript: o,
            isSpeechFinal: c,
            isBrowserSupported: n,
          },
          templates: e,
        }),
        L(S, {
          templateKey: "status",
          rootProps: { className: t.status },
          data: {
            status: s,
            errorCode: a,
            isListening: r,
            transcript: o,
            isSpeechFinal: c,
            isBrowserSupported: n,
          },
          templates: e,
        })
      );
    },
    Bu = L(
      x,
      null,
      L("line", { x1: "1", y1: "1", x2: "23", y2: "23" }),
      L("path", {
        d: "M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6",
      }),
      L("path", { d: "M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" }),
      L("line", { x1: "12", y1: "19", x2: "12", y2: "23" }),
      L("line", { x1: "8", y1: "23", x2: "16", y2: "23" })
    ),
    Uu = L("path", { d: "M19 10v2a7 7 0 0 1-14 0v-2" }),
    qu = L("line", { x1: "12", y1: "19", x2: "12", y2: "23" }),
    Qu = L("line", { x1: "8", y1: "23", x2: "16", y2: "23" }),
    Vu = {
      buttonText: function (e) {
        var t = e.status,
          n = e.errorCode,
          e = e.isListening;
        return L(
          "svg",
          {
            width: "16",
            height: "16",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            "stroke-width": "2",
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
          },
          L(Mu, { status: t, errorCode: n, isListening: e })
        );
      },
      status: function (e) {
        return L("p", null, e.transcript);
      },
    },
    Ku = l({ name: "voice-search" }),
    zu = i("VoiceSearch"),
    Ju = l({ name: "frequently-bought-together" }),
    Zu =
      ((Hu = (el = { createElement: L, Fragment: x }).createElement),
      (Au = el.Fragment),
      function (e) {
        var t = e.classNames,
          t = void 0 === t ? {} : t,
          n = e.emptyComponent,
          n = void 0 === n ? Ha({ createElement: Hu, Fragment: Au }) : n,
          r = e.headerComponent,
          r = void 0 === r ? Aa({ createElement: Hu, Fragment: Au }) : r,
          i = e.itemComponent,
          i = void 0 === i ? Wa({ createElement: Hu, Fragment: Au }) : i,
          a = e.view,
          a = void 0 === a ? Da({ createElement: Hu, Fragment: Au }) : a,
          s = e.items,
          o = e.status,
          c = e.translations,
          u = e.sendEvent,
          e = Ma(e, $a),
          c = (function (t) {
            for (var e = 1; e < arguments.length; e++) {
              var n = null != arguments[e] ? arguments[e] : {};
              e % 2
                ? Ba(Object(n), !0).forEach(function (e) {
                    Oa(t, e, n[e]);
                  })
                : Object.getOwnPropertyDescriptors
                ? Object.defineProperties(
                    t,
                    Object.getOwnPropertyDescriptors(n)
                  )
                : Ba(Object(n)).forEach(function (e) {
                    Object.defineProperty(
                      t,
                      e,
                      Object.getOwnPropertyDescriptor(n, e)
                    );
                  });
            }
            return t;
          })(
            {
              title: "Frequently bought together",
              sliderLabel: "Frequently bought together products",
            },
            c
          ),
          t = {
            root: C("ais-FrequentlyBoughtTogether", t.root),
            emptyRoot: C(
              "ais-FrequentlyBoughtTogether",
              t.root,
              "ais-FrequentlyBoughtTogether--empty",
              t.emptyRoot,
              e.className
            ),
            title: C("ais-FrequentlyBoughtTogether-title", t.title),
            container: C("ais-FrequentlyBoughtTogether-container", t.container),
            list: C("ais-FrequentlyBoughtTogether-list", t.list),
            item: C("ais-FrequentlyBoughtTogether-item", t.item),
          };
        return 0 === s.length && "idle" === o
          ? Hu("section", Fa({}, e, { className: t.emptyRoot }), Hu(n, null))
          : Hu(
              "section",
              Fa({}, e, { className: t.root }),
              Hu(r, { classNames: t, items: s, translations: c }),
              Hu(a, {
                classNames: t,
                translations: c,
                itemComponent: i,
                items: s,
                sendEvent: u,
              })
            );
      }),
    Yu = l({ name: "looking-similar" }),
    Xu =
      ((Wu = (el = { createElement: L, Fragment: x }).createElement),
      (Du = el.Fragment),
      function (e) {
        var t = e.classNames,
          t = void 0 === t ? {} : t,
          n = e.emptyComponent,
          n = void 0 === n ? Ha({ createElement: Wu, Fragment: Du }) : n,
          r = e.headerComponent,
          r = void 0 === r ? Aa({ createElement: Wu, Fragment: Du }) : r,
          i = e.itemComponent,
          i = void 0 === i ? Wa({ createElement: Wu, Fragment: Du }) : i,
          a = e.view,
          a = void 0 === a ? Da({ createElement: Wu, Fragment: Du }) : a,
          s = e.items,
          o = e.status,
          c = e.translations,
          u = e.sendEvent,
          e = Ma(e, Qa),
          c = (function (t) {
            for (var e = 1; e < arguments.length; e++) {
              var n = null != arguments[e] ? arguments[e] : {};
              e % 2
                ? Va(Object(n), !0).forEach(function (e) {
                    Oa(t, e, n[e]);
                  })
                : Object.getOwnPropertyDescriptors
                ? Object.defineProperties(
                    t,
                    Object.getOwnPropertyDescriptors(n)
                  )
                : Va(Object(n)).forEach(function (e) {
                    Object.defineProperty(
                      t,
                      e,
                      Object.getOwnPropertyDescriptor(n, e)
                    );
                  });
            }
            return t;
          })({ title: "Looking similar", sliderLabel: "Looking similar" }, c),
          t = {
            root: C("ais-LookingSimilar", t.root),
            emptyRoot: C(
              "ais-LookingSimilar",
              t.root,
              "ais-LookingSimilar--empty",
              t.emptyRoot,
              e.className
            ),
            title: C("ais-LookingSimilar-title", t.title),
            container: C("ais-LookingSimilar-container", t.container),
            list: C("ais-LookingSimilar-list", t.list),
            item: C("ais-LookingSimilar-item", t.item),
          };
        return 0 === s.length && "idle" === o
          ? Wu("section", Fa({}, e, { className: t.emptyRoot }), Wu(n, null))
          : Wu(
              "section",
              Fa({}, e, { className: t.root }),
              Wu(r, { classNames: t, items: s, translations: c }),
              Wu(a, {
                classNames: t,
                translations: c,
                itemComponent: i,
                items: s,
                sendEvent: u,
              })
            );
      });
  function Gu(e) {
    return new Na(e);
  }
  var el = Z(e),
    e = Z(Ls),
    el = Object.freeze({
      __proto__: null,
      EXPERIMENTAL_answers: el,
      EXPERIMENTAL_dynamicWidgets: e,
      dynamicWidgets: Ls,
      analytics: function (e) {
        var n,
          i,
          a,
          s,
          r,
          o,
          c,
          t,
          u,
          l = e || {},
          d = l.pushFunction,
          h = l.delay,
          f = void 0 === h ? 3e3 : h,
          h = l.triggerOnUIInteraction,
          m = void 0 !== h && h,
          h = l.pushInitialSearch,
          l = l.pushPagination,
          p = void 0 !== l && l;
        if (d)
          return (
            (n = null),
            (i = function (e) {
              var t,
                n,
                r = [];
              for (t in e)
                e.hasOwnProperty(t) &&
                  ((n = e[t].join("+")),
                  r.push(
                    ""
                      .concat(encodeURIComponent(t), "=")
                      .concat(encodeURIComponent(t), "_")
                      .concat(encodeURIComponent(n))
                  ));
              return r.join("&");
            }),
            (a = function (e) {
              var t,
                n = [];
              for (t in e)
                if (e.hasOwnProperty(t)) {
                  var r = e[t];
                  if (r.hasOwnProperty(">=") && r.hasOwnProperty("<="))
                    r[">="] && r[">="][0] === r["<="] && r["<="][0]
                      ? n.push("".concat(t, "=").concat(t, "_").concat(r[">="]))
                      : n.push(
                          ""
                            .concat(t, "=")
                            .concat(t, "_")
                            .concat(r[">="], "to")
                            .concat(r["<="])
                        );
                  else if (r.hasOwnProperty(">="))
                    n.push(
                      "".concat(t, "=").concat(t, "_from").concat(r[">="])
                    );
                  else if (r.hasOwnProperty("<="))
                    n.push("".concat(t, "=").concat(t, "_to").concat(r["<="]));
                  else if (r.hasOwnProperty("=")) {
                    var i,
                      a = [];
                    for (i in r["="])
                      r["="].hasOwnProperty(i) && a.push(r["="][i]);
                    n.push(
                      "".concat(t, "=").concat(t, "_").concat(a.join("-"))
                    );
                  }
                }
              return n.join("&");
            }),
            (r = function (e) {
              var t, n, r;
              null !== e &&
                ((t = []),
                (n = i(
                  F(
                    F(
                      F({}, e.state.disjunctiveFacetsRefinements),
                      e.state.facetsRefinements
                    ),
                    e.state.hierarchicalFacetsRefinements
                  )
                )),
                (r = a(e.state.numericRefinements)),
                "" !== n && t.push(n),
                "" !== r && t.push(r),
                (n = t.join("&")),
                (r = "Query: ".concat(e.state.query || "", ", ").concat(n)),
                !0 === p && (r += ", Page: ".concat(e.state.page || 0)),
                s !== r) &&
                (d(n, e.state, e.results), (s = r));
            }),
            (c = !(s = "") === (void 0 === h || h) ? !1 : !0),
            (t = function () {
              r(n);
            }),
            (u = function () {
              r(n);
            }),
            {
              $$type: "ais.analytics",
              $$widgetType: "ais.analytics",
              init: function () {
                !0 === m &&
                  (document.addEventListener("click", t),
                  window.addEventListener("beforeunload", u));
              },
              render: function (e) {
                var t = e.results,
                  e = e.state;
                !0 === c
                  ? (c = !1)
                  : ((n = { results: t, state: e }),
                    o && clearTimeout(o),
                    (o = window.setTimeout(function () {
                      return r(n);
                    }, f)));
              },
              dispose: function () {
                !0 === m &&
                  (document.removeEventListener("click", t),
                  window.removeEventListener("beforeunload", u));
              },
              getRenderState: function (e, t) {
                return F(
                  F({}, e),
                  {},
                  { analytics: this.getWidgetRenderState(t) }
                );
              },
              getWidgetRenderState: function () {
                return { widgetParams: e };
              },
            }
          );
        throw new Error(Ds("The `pushFunction` option is required."));
      },
      breadcrumb: function (e) {
        var t,
          s,
          o,
          c,
          u,
          e = e || {},
          n = e.container,
          r = e.attributes,
          i = e.separator,
          a = e.rootPath,
          l = e.transformItems,
          d = e.templates,
          d = void 0 === d ? {} : d,
          e = e.cssClasses,
          e = void 0 === e ? {} : e;
        if (n)
          return (
            (t = N(n)),
            (n = {
              root: C(qs(), e.root),
              noRefinementRoot: C(
                qs({ modifierName: "noRefinement" }),
                e.noRefinementRoot
              ),
              list: C(qs({ descendantName: "list" }), e.list),
              item: C(qs({ descendantName: "item" }), e.item),
              selectedItem: C(
                qs({ descendantName: "item", modifierName: "selected" }),
                e.selectedItem
              ),
              separator: C(qs({ descendantName: "separator" }), e.separator),
              link: C(qs({ descendantName: "link" }), e.link),
            }),
            (s = (e = {
              containerNode: t,
              cssClasses: n,
              renderState: {},
              templates: d,
            }).containerNode),
            (o = e.cssClasses),
            (c = e.renderState),
            (u = e.templates),
            F(
              F(
                {},
                qn(
                  function (e, t) {
                    var n = e.canRefine,
                      r = e.createURL,
                      i = e.instantSearchInstance,
                      a = e.items,
                      e = e.refine;
                    t
                      ? (c.templateProps = H({
                          defaultTemplates: Bs,
                          templatesConfig: i.templatesConfig,
                          templates: u,
                        }))
                      : M(
                          L($s, {
                            canRefine: n,
                            cssClasses: o,
                            createURL: r,
                            items: a,
                            refine: e,
                            templateProps: c.templateProps,
                          }),
                          s
                        );
                  },
                  function () {
                    return M(null, t);
                  }
                )({
                  attributes: r,
                  separator: i,
                  rootPath: a,
                  transformItems: l,
                })
              ),
              {},
              { $$widgetType: "ais.breadcrumb" }
            )
          );
        throw new Error(Us("The `container` option is required."));
      },
      clearRefinements: function (e) {
        var t,
          i,
          a,
          s,
          o,
          e = e || {},
          n = e.container,
          r = e.templates,
          r = void 0 === r ? {} : r,
          c = e.includedAttributes,
          u = e.excludedAttributes,
          l = e.transformItems,
          e = e.cssClasses,
          e = void 0 === e ? {} : e;
        if (n)
          return (
            (t = N(n)),
            (n = {
              root: C(zs(), e.root),
              button: C(zs({ descendantName: "button" }), e.button),
              disabledButton: C(
                zs({ descendantName: "button", modifierName: "disabled" }),
                e.disabledButton
              ),
            }),
            (i = (e = {
              containerNode: t,
              cssClasses: n,
              renderState: {},
              templates: r,
            }).containerNode),
            (a = e.cssClasses),
            (s = e.renderState),
            (o = e.templates),
            F(
              F(
                {},
                ct(
                  function (e, t) {
                    var n = e.refine,
                      r = e.canRefine,
                      e = e.instantSearchInstance;
                    t
                      ? (s.templateProps = H({
                          defaultTemplates: Vs,
                          templatesConfig: e.templatesConfig,
                          templates: o,
                        }))
                      : M(
                          L(Qs, {
                            refine: n,
                            cssClasses: a,
                            hasRefinements: r,
                            templateProps: s.templateProps,
                          }),
                          i
                        );
                  },
                  function () {
                    return M(null, t);
                  }
                )({
                  includedAttributes: c,
                  excludedAttributes: u,
                  transformItems: l,
                })
              ),
              {},
              { $$widgetType: "ais.clearRefinements" }
            )
          );
        throw new Error(Ks("The `container` option is required."));
      },
      configure: function (e) {
        return F(
          F({}, Xr(R)({ searchParameters: e })),
          {},
          { $$widgetType: "ais.configure" }
        );
      },
      currentRefinements: function (e) {
        var t,
          e = e || {},
          n = e.container,
          r = e.includedAttributes,
          i = e.excludedAttributes,
          a = e.cssClasses,
          a = void 0 === a ? {} : a,
          e = e.transformItems;
        if (n)
          return (
            (t = N(n)),
            (n = {
              root: C(Ys(), a.root),
              noRefinementRoot: C(
                Ys({ modifierName: "noRefinement" }),
                a.noRefinementRoot
              ),
              list: C(Ys({ descendantName: "list" }), a.list),
              item: C(Ys({ descendantName: "item" }), a.item),
              label: C(Ys({ descendantName: "label" }), a.label),
              category: C(Ys({ descendantName: "category" }), a.category),
              categoryLabel: C(
                Ys({ descendantName: "categoryLabel" }),
                a.categoryLabel
              ),
              delete: C(Ys({ descendantName: "delete" }), a.delete),
            }),
            F(
              F(
                {},
                ht(Ms, function () {
                  return M(null, t);
                })({
                  container: t,
                  cssClasses: n,
                  includedAttributes: r,
                  excludedAttributes: i,
                  transformItems: e,
                })
              ),
              {},
              { $$widgetType: "ais.currentRefinements" }
            )
          );
        throw new Error(Zs("The `container` option is required."));
      },
      EXPERIMENTAL_configureRelatedItems: function (e) {
        return F(
          F({}, ti(R)(e)),
          {},
          { $$widgetType: "ais.configureRelatedItems" }
        );
      },
      geoSearch: function (e) {
        var t,
          n,
          r,
          i,
          a,
          u,
          e = e || {},
          s = e.initialZoom,
          s = void 0 === s ? 1 : s,
          o = e.initialPosition,
          o = void 0 === o ? { lat: 0, lng: 0 } : o,
          c = e.templates,
          c = void 0 === c ? {} : c,
          l = e.cssClasses,
          l = void 0 === l ? {} : l,
          d = e.builtInMarker,
          d = void 0 === d ? {} : d,
          h = e.customHTMLMarker,
          f = e.enableRefine,
          f = void 0 === f || f,
          m = e.enableClearMapRefinement,
          m = void 0 === m || m,
          p = e.enableRefineControl,
          p = void 0 === p || p,
          g = e.container,
          v = e.googleReference,
          e = j(e, ao);
        if (!g) throw new Error(co("The `container` option is required."));
        if (v)
          return (
            (t = N(g)),
            (g = {
              root: C(uo(), l.root),
              tree: uo({ descendantName: "tree" }),
              map: C(uo({ descendantName: "map" }), l.map),
              control: C(uo({ descendantName: "control" }), l.control),
              label: C(uo({ descendantName: "label" }), l.label),
              selectedLabel: C(
                uo({ descendantName: "label", modifierName: "selected" }),
                l.selectedLabel
              ),
              input: C(uo({ descendantName: "input" }), l.input),
              redo: C(uo({ descendantName: "redo" }), l.redo),
              disabledRedo: C(
                uo({ descendantName: "redo", modifierName: "disabled" }),
                l.disabledRedo
              ),
              reset: C(uo({ descendantName: "reset" }), l.reset),
            }),
            (n = F(F({}, Gs), c)),
            (r = F(
              F(
                {},
                {
                  createOptions: function () {
                    return {};
                  },
                  events: {},
                }
              ),
              d
            )),
            (i =
              (Boolean(h) || Boolean(c.HTMLMarker)) &&
              F(
                F(
                  {},
                  {
                    createOptions: function () {
                      return {};
                    },
                    events: {},
                  }
                ),
                h
              )),
            (u = v),
            (a = (function () {
              B(c, u.maps.OverlayView);
              var o = V(c);
              function c(e) {
                var t,
                  n = e.__id,
                  r = e.position,
                  i = e.map,
                  a = e.template,
                  s = e.className,
                  e = e.anchor,
                  e = void 0 === e ? { x: 0, y: 0 } : e;
                return (
                  D(this, c),
                  E(y((t = o.call(this))), "__id", void 0),
                  E(y(t), "anchor", void 0),
                  E(y(t), "offset", void 0),
                  E(y(t), "listeners", void 0),
                  E(y(t), "latLng", void 0),
                  E(y(t), "element", void 0),
                  (t.__id = n),
                  (t.anchor = e),
                  (t.listeners = {}),
                  (t.latLng = new u.maps.LatLng(r)),
                  (t.element = document.createElement("div")),
                  (t.element.className = s),
                  (t.element.style.position = "absolute"),
                  "object" === W(a)
                    ? M(a, t.element)
                    : (t.element.innerHTML = a),
                  t.setMap(i),
                  t
                );
              }
              return (
                $(c, [
                  {
                    key: "onAdd",
                    value: function () {
                      this.getPanes().overlayMouseTarget.appendChild(
                        this.element
                      );
                      var e = this.element.getBoundingClientRect();
                      (this.offset = {
                        x: this.anchor.x + e.width / 2,
                        y: this.anchor.y + e.height,
                      }),
                        (this.element.style.width = "".concat(e.width, "px"));
                    },
                  },
                  {
                    key: "draw",
                    value: function () {
                      var e = this.getProjection().fromLatLngToDivPixel(
                        this.latLng
                      );
                      (this.element.style.left = "".concat(
                        Math.round(e.x - this.offset.x),
                        "px"
                      )),
                        (this.element.style.top = "".concat(
                          Math.round(e.y - this.offset.y),
                          "px"
                        )),
                        (this.element.style.zIndex = String(
                          parseInt(this.element.style.top, 10)
                        ));
                    },
                  },
                  {
                    key: "onRemove",
                    value: function () {
                      var t = this;
                      this.element &&
                        (this.element.parentNode.removeChild(this.element),
                        Object.keys(this.listeners).forEach(function (e) {
                          t.element.removeEventListener(e, t.listeners[e]);
                        }),
                        delete this.element,
                        delete this.listeners);
                    },
                  },
                  {
                    key: "addListener",
                    value: function (e, t) {
                      this.listeners[e] = t;
                      var n = this.element;
                      return (
                        n.addEventListener(e, t),
                        {
                          remove: function () {
                            return n.removeEventListener(e, t);
                          },
                        }
                      );
                    },
                  },
                  {
                    key: "getPosition",
                    value: function () {
                      return this.latLng;
                    },
                  },
                ]),
                c
              );
            })()),
            (l = i
              ? function (e) {
                  var t = e.item,
                    e = j(e, oo);
                  return new a(
                    F(
                      F(F({}, i.createOptions(t)), e),
                      {},
                      {
                        __id: t.objectID,
                        position: t._geoloc,
                        className: C(uo({ descendantName: "marker" })),
                        template: Ns({
                          templateKey: "HTMLMarker",
                          templates: n,
                          data: t,
                        }),
                      }
                    )
                  );
                }
              : function (e) {
                  var t = e.item,
                    e = j(e, so);
                  return new v.maps.Marker(
                    F(
                      F(F({}, r.createOptions(t)), e),
                      {},
                      { __id: t.objectID, position: t._geoloc }
                    )
                  );
                }),
            (d = i || r),
            F(
              F(
                {},
                Gn(Ws, function () {
                  return M(null, t);
                })(
                  F(
                    F({}, e),
                    {},
                    {
                      templates: n,
                      renderState: {},
                      container: t,
                      googleReference: v,
                      initialZoom: s,
                      initialPosition: o,
                      cssClasses: g,
                      createMarker: l,
                      markerOptions: d,
                      enableRefine: f,
                      enableClearMapRefinement: m,
                      enableRefineControl: p,
                    }
                  )
                )
              ),
              {},
              { $$widgetType: "ais.geoSearch" }
            )
          );
        throw new Error(co("The `googleReference` option is required."));
      },
      hierarchicalMenu: function (e) {
        var t,
          c,
          u,
          l,
          d,
          h,
          e = e || {},
          n = e.container,
          r = e.attributes,
          i = e.separator,
          a = e.rootPath,
          s = e.showParentLevel,
          o = e.limit,
          f = e.showMore,
          f = void 0 !== f && f,
          m = e.showMoreLimit,
          p = e.sortBy,
          g = e.transformItems,
          v = e.templates,
          v = void 0 === v ? {} : v,
          e = e.cssClasses,
          e = void 0 === e ? {} : e;
        if (n)
          return (
            (t = N(n)),
            (n = {
              root: C(_(), e.root),
              noRefinementRoot: C(
                _({ modifierName: "noRefinement" }),
                e.noRefinementRoot
              ),
              list: C(_({ descendantName: "list" }), e.list),
              childList: C(
                _({ descendantName: "list", modifierName: "child" }),
                e.childList
              ),
              item: C(_({ descendantName: "item" }), e.item),
              selectedItem: C(
                _({ descendantName: "item", modifierName: "selected" }),
                e.selectedItem
              ),
              parentItem: C(
                _({ descendantName: "item", modifierName: "parent" }),
                e.parentItem
              ),
              link: C(_({ descendantName: "link" }), e.link),
              selectedItemLink: C(
                _({ descendantName: "link", modifierName: "selected" }),
                e.selectedItemLink
              ),
              label: C(_({ descendantName: "label" }), e.label),
              count: C(_({ descendantName: "count" }), e.count),
              showMore: C(_({ descendantName: "showMore" }), e.showMore),
              disabledShowMore: C(
                _({ descendantName: "showMore", modifierName: "disabled" }),
                e.disabledShowMore
              ),
            }),
            (c = (e = {
              cssClasses: n,
              containerNode: t,
              templates: v,
              showMore: f,
              renderState: {},
            }).cssClasses),
            (u = e.containerNode),
            (l = e.showMore),
            (d = e.templates),
            (h = e.renderState),
            F(
              F(
                {},
                yt(
                  function (e, t) {
                    var n = e.createURL,
                      r = e.items,
                      i = e.refine,
                      a = e.instantSearchInstance,
                      s = e.isShowingMore,
                      o = e.toggleShowMore,
                      e = e.canToggleShowMore;
                    t
                      ? (h.templateProps = H({
                          defaultTemplates: yo,
                          templatesConfig: a.templatesConfig,
                          templates: d,
                        }))
                      : M(
                          L(vo, {
                            createURL: n,
                            cssClasses: c,
                            facetValues: r,
                            templateProps: h.templateProps,
                            toggleRefinement: i,
                            showMore: l,
                            toggleShowMore: o,
                            isShowingMore: s,
                            canToggleShowMore: e,
                          }),
                          u
                        );
                  },
                  function () {
                    return M(null, t);
                  }
                )({
                  attributes: r,
                  separator: i,
                  rootPath: a,
                  showParentLevel: s,
                  limit: o,
                  showMore: f,
                  showMoreLimit: m,
                  sortBy: p,
                  transformItems: g,
                })
              ),
              {},
              { $$widgetType: "ais.hierarchicalMenu" }
            )
          );
        throw new Error(bo("The `container` option is required."));
      },
      hits: function (e) {
        var t,
          u,
          l,
          d,
          h,
          e = e || {},
          n = e.container,
          r = e.escapeHTML,
          i = e.transformItems,
          a = e.templates,
          a = void 0 === a ? {} : a,
          e = e.cssClasses,
          e = void 0 === e ? {} : e;
        if (n)
          return (
            (t = N(n)),
            (u = (n = {
              containerNode: t,
              cssClasses: e,
              renderState: {},
              templates: a,
            }).renderState),
            (l = n.cssClasses),
            (d = n.containerNode),
            (h = n.templates),
            F(
              F(
                {},
                Nt(_t)(
                  function (e, t) {
                    var i,
                      n = e.items,
                      r = e.results,
                      a = e.instantSearchInstance,
                      s = e.insights,
                      o = e.bindEvent,
                      c = e.sendEvent,
                      e = e.banner;
                    t
                      ? (u.templateProps = H({
                          defaultTemplates: Ro,
                          templatesConfig: a.templatesConfig,
                          templates: h,
                        }))
                      : ((i = Xt({ insights: s, sendEvent: c })),
                        M(
                          L(wo, {
                            hits: n,
                            itemComponent: function (e) {
                              var t = e.hit,
                                n = e.index,
                                r = j(e, So);
                              return L(
                                S,
                                g({}, u.templateProps, {
                                  templateKey: "item",
                                  rootTagName: "li",
                                  rootProps: F(
                                    F({}, r),
                                    {},
                                    {
                                      onClick: function (e) {
                                        i(e), r.onClick();
                                      },
                                      onAuxClick: function (e) {
                                        i(e), r.onAuxClick();
                                      },
                                    }
                                  ),
                                  data: F(
                                    F({}, t),
                                    {},
                                    {
                                      get __hitIndex() {
                                        return n;
                                      },
                                    }
                                  ),
                                  bindEvent: o,
                                  sendEvent: c,
                                })
                              );
                            },
                            sendEvent: c,
                            classNames: l,
                            emptyComponent: function (e) {
                              e = g({}, (Q(e), e));
                              return L(
                                S,
                                g({}, u.templateProps, {
                                  rootProps: e,
                                  templateKey: "empty",
                                  data: r,
                                  rootTagName: "fragment",
                                })
                              );
                            },
                            banner: e,
                            bannerComponent: h.banner
                              ? function (e) {
                                  return L(
                                    S,
                                    g({}, u.templateProps, {
                                      templateKey: "banner",
                                      data: e,
                                      rootTagName: "fragment",
                                    })
                                  );
                                }
                              : void 0,
                          }),
                          d
                        ));
                  },
                  function () {
                    return M(null, t);
                  }
                )({ escapeHTML: r, transformItems: i })
              ),
              {},
              { $$widgetType: "ais.hits" }
            )
          );
        throw new Error(_o("The `container` option is required."));
      },
      hitsPerPage: function (e) {
        var t,
          r,
          i,
          e = e || {},
          n = e.container,
          a = e.items,
          s = e.cssClasses,
          s = void 0 === s ? {} : s,
          e = e.transformItems;
        if (n)
          return (
            (t = N(n)),
            (n = {
              root: C(Co(), s.root),
              select: C(Co({ descendantName: "select" }), s.select),
              option: C(Co({ descendantName: "option" }), s.option),
            }),
            (r = (s = { containerNode: t, cssClasses: n }).containerNode),
            (i = s.cssClasses),
            F(
              F(
                {},
                en(
                  function (e, t) {
                    var n = e.items,
                      e = e.refine;
                    t ||
                      ((t = (
                        we(n, function (e) {
                          return e.isRefined;
                        }) || {}
                      ).value),
                      M(
                        L(
                          "div",
                          { className: i.root },
                          L(No, {
                            cssClasses: i,
                            currentValue: t,
                            options: n,
                            setValue: e,
                          })
                        ),
                        r
                      ));
                  },
                  function () {
                    return M(null, t);
                  }
                )({ items: a, transformItems: e })
              ),
              {},
              { $$widgetType: "ais.hitsPerPage" }
            )
          );
        throw new Error(Io("The `container` option is required."));
      },
      index: ba,
      infiniteHits: function (e) {
        var t,
          h,
          f,
          m,
          p,
          g,
          e = e || {},
          n = e.container,
          r = e.escapeHTML,
          i = e.transformItems,
          a = e.templates,
          a = void 0 === a ? {} : a,
          s = e.cssClasses,
          s = void 0 === s ? {} : s,
          o = e.showPrevious,
          e = e.cache;
        if (n)
          return (
            (t = N(n)),
            (n = {
              root: C(jo(), s.root),
              emptyRoot: C(jo({ modifierName: "empty" }), s.emptyRoot),
              item: C(jo({ descendantName: "item" }), s.item),
              list: C(jo({ descendantName: "list" }), s.list),
              loadPrevious: C(
                jo({ descendantName: "loadPrevious" }),
                s.loadPrevious
              ),
              disabledLoadPrevious: C(
                jo({
                  descendantName: "loadPrevious",
                  modifierName: "disabled",
                }),
                s.disabledLoadPrevious
              ),
              loadMore: C(jo({ descendantName: "loadMore" }), s.loadMore),
              disabledLoadMore: C(
                jo({ descendantName: "loadMore", modifierName: "disabled" }),
                s.disabledLoadMore
              ),
              bannerRoot: C(jo({ descendantName: "banner" }), s.bannerRoot),
              bannerImage: C(
                jo({ descendantName: "banner-image" }),
                s.bannerImage
              ),
              bannerLink: C(
                jo({ descendantName: "banner-link" }),
                s.bannerLink
              ),
            }),
            (h = (s = {
              containerNode: t,
              cssClasses: n,
              templates: a,
              showPrevious: o,
              renderState: {},
            }).containerNode),
            (f = s.cssClasses),
            (m = s.renderState),
            (p = s.templates),
            (g = s.showPrevious),
            F(
              F(
                {},
                Nt(un)(
                  function (e, t) {
                    var n = e.items,
                      r = e.results,
                      i = e.showMore,
                      a = e.showPrevious,
                      s = e.isFirstPage,
                      o = e.isLastPage,
                      c = e.instantSearchInstance,
                      u = e.insights,
                      l = e.bindEvent,
                      d = e.sendEvent,
                      e = e.banner;
                    t
                      ? (m.templateProps = H({
                          defaultTemplates: Fo,
                          templatesConfig: c.templatesConfig,
                          templates: p,
                        }))
                      : M(
                          L(To, {
                            cssClasses: f,
                            hits: n,
                            results: r,
                            hasShowPrevious: g,
                            showPrevious: a,
                            showMore: i,
                            templateProps: m.templateProps,
                            isFirstPage: s,
                            isLastPage: o,
                            insights: u,
                            sendEvent: d,
                            bindEvent: l,
                            banner: e,
                          }),
                          h
                        );
                  },
                  function () {
                    return M(null, t);
                  }
                )({
                  escapeHTML: r,
                  transformItems: i,
                  showPrevious: o,
                  cache: e,
                })
              ),
              {},
              { $$widgetType: "ais.infiniteHits" }
            )
          );
        throw new Error(Eo("The `container` option is required."));
      },
      menu: function (e) {
        var t,
          c,
          u,
          l,
          d,
          h,
          e = e || {},
          n = e.container,
          r = e.attribute,
          i = e.sortBy,
          a = e.limit,
          s = e.showMore,
          o = e.showMoreLimit,
          f = e.cssClasses,
          f = void 0 === f ? {} : f,
          m = e.templates,
          m = void 0 === m ? {} : m,
          e = e.transformItems;
        if (n)
          return (
            (t = N(n)),
            (n = {
              root: C(Lo(), f.root),
              noRefinementRoot: C(
                Lo({ modifierName: "noRefinement" }),
                f.noRefinementRoot
              ),
              list: C(Lo({ descendantName: "list" }), f.list),
              item: C(Lo({ descendantName: "item" }), f.item),
              selectedItem: C(
                Lo({ descendantName: "item", modifierName: "selected" }),
                f.selectedItem
              ),
              link: C(Lo({ descendantName: "link" }), f.link),
              label: C(Lo({ descendantName: "label" }), f.label),
              count: C(Lo({ descendantName: "count" }), f.count),
              showMore: C(Lo({ descendantName: "showMore" }), f.showMore),
              disabledShowMore: C(
                Lo({ descendantName: "showMore", modifierName: "disabled" }),
                f.disabledShowMore
              ),
            }),
            (c = (f = {
              containerNode: t,
              cssClasses: n,
              renderState: {},
              templates: m,
              showMore: s,
            }).containerNode),
            (u = f.cssClasses),
            (l = f.renderState),
            (d = f.templates),
            (h = f.showMore),
            F(
              F(
                {},
                ln(
                  function (e, t) {
                    var n = e.refine,
                      r = e.items,
                      i = e.createURL,
                      a = e.instantSearchInstance,
                      s = e.isShowingMore,
                      o = e.toggleShowMore,
                      e = e.canToggleShowMore;
                    t
                      ? (l.templateProps = H({
                          defaultTemplates: ko,
                          templatesConfig: a.templatesConfig,
                          templates: d,
                        }))
                      : ((t = r.map(function (e) {
                          return F(F({}, e), {}, { url: i(e.value) });
                        })),
                        M(
                          L(vo, {
                            createURL: i,
                            cssClasses: u,
                            facetValues: t,
                            showMore: h,
                            templateProps: l.templateProps,
                            toggleRefinement: n,
                            toggleShowMore: o,
                            isShowingMore: s,
                            canToggleShowMore: e,
                          }),
                          c
                        ));
                  },
                  function () {
                    return M(null, t);
                  }
                )({
                  attribute: r,
                  limit: a,
                  showMore: s,
                  showMoreLimit: o,
                  sortBy: i,
                  transformItems: e,
                })
              ),
              {},
              { $$widgetType: "ais.menu" }
            )
          );
        throw new Error(Oo("The `container` option is required."));
      },
      menuSelect: function (e) {
        var t,
          i,
          a,
          s,
          o,
          e = e || {},
          n = e.container,
          r = e.attribute,
          c = e.sortBy,
          c = void 0 === c ? ["name:asc"] : c,
          u = e.limit,
          u = void 0 === u ? 10 : u,
          l = e.cssClasses,
          l = void 0 === l ? {} : l,
          d = e.templates,
          d = void 0 === d ? {} : d,
          e = e.transformItems;
        if (n)
          return (
            (t = N(n)),
            (n = {
              root: C(Wo(), l.root),
              noRefinementRoot: C(
                Wo({ modifierName: "noRefinement" }),
                l.noRefinementRoot
              ),
              select: C(Wo({ descendantName: "select" }), l.select),
              option: C(Wo({ descendantName: "option" }), l.option),
            }),
            (i = (l = {
              containerNode: t,
              cssClasses: n,
              renderState: {},
              templates: d,
            }).containerNode),
            (a = l.cssClasses),
            (s = l.renderState),
            (o = l.templates),
            F(
              F(
                {},
                ln(
                  function (e, t) {
                    var n = e.refine,
                      r = e.items,
                      e = e.instantSearchInstance;
                    t
                      ? (s.templateProps = H({
                          defaultTemplates: Ho,
                          templatesConfig: e.templatesConfig,
                          templates: o,
                        }))
                      : M(
                          L(Mo, {
                            cssClasses: a,
                            items: r,
                            refine: n,
                            templateProps: s.templateProps,
                          }),
                          i
                        );
                  },
                  function () {
                    return M(null, t);
                  }
                )({ attribute: r, limit: u, sortBy: c, transformItems: e })
              ),
              {},
              { $$widgetType: "ais.menuSelect" }
            )
          );
        throw new Error(Ao("The `container` option is required."));
      },
      numericMenu: function (e) {
        var t,
          a,
          s,
          o,
          c,
          u,
          e = e || {},
          n = e.container,
          r = e.attribute,
          i = e.items,
          l = e.cssClasses,
          l = void 0 === l ? {} : l,
          d = e.templates,
          d = void 0 === d ? {} : d,
          e = e.transformItems;
        if (n)
          return (
            (t = N(n)),
            (n = {
              root: C(Bo(), l.root),
              noRefinementRoot: C(
                Bo({ modifierName: "noRefinement" }),
                l.noRefinementRoot
              ),
              list: C(Bo({ descendantName: "list" }), l.list),
              item: C(Bo({ descendantName: "item" }), l.item),
              selectedItem: C(
                Bo({ descendantName: "item", modifierName: "selected" }),
                l.selectedItem
              ),
              label: C(Bo({ descendantName: "label" }), l.label),
              radio: C(Bo({ descendantName: "radio" }), l.radio),
              labelText: C(Bo({ descendantName: "labelText" }), l.labelText),
            }),
            (a = (l = {
              containerNode: t,
              attribute: r,
              cssClasses: n,
              renderState: {},
              templates: d,
            }).containerNode),
            (s = l.attribute),
            (o = l.cssClasses),
            (c = l.renderState),
            (u = l.templates),
            F(
              F(
                {},
                pn(
                  function (e, t) {
                    var n = e.createURL,
                      r = e.instantSearchInstance,
                      i = e.refine,
                      e = e.items;
                    t
                      ? (c.templateProps = H({
                          defaultTemplates: Do,
                          templatesConfig: r.templatesConfig,
                          templates: u,
                        }))
                      : M(
                          L(vo, {
                            createURL: n,
                            cssClasses: o,
                            facetValues: e,
                            templateProps: c.templateProps,
                            toggleRefinement: i,
                            attribute: s,
                          }),
                          a
                        );
                  },
                  function () {
                    return M(null, t);
                  }
                )({ attribute: r, items: i, transformItems: e })
              ),
              {},
              { $$widgetType: "ais.numericMenu" }
            )
          );
        throw new Error($o("The `container` option is required."));
      },
      pagination: function (e) {
        var t,
          u,
          l,
          d,
          h,
          f,
          m,
          p,
          g,
          e = e || {},
          n = e.container,
          r = e.templates,
          r = void 0 === r ? {} : r,
          i = e.cssClasses,
          i = void 0 === i ? {} : i,
          a = e.totalPages,
          s = e.padding,
          o = e.showFirst,
          o = void 0 === o || o,
          c = e.showLast,
          c = void 0 === c || c,
          v = e.showPrevious,
          v = void 0 === v || v,
          y = e.showNext,
          y = void 0 === y || y,
          e = e.scrollTo,
          e = void 0 === e ? "body" : e;
        if (n)
          return (
            (t = N(n)),
            (e = !1 !== (n = !0 === e ? "body" : e) && N(n)),
            (n = {
              root: C(zo(), i.root),
              noRefinementRoot: C(
                zo({ modifierName: "noRefinement" }),
                i.noRefinementRoot
              ),
              list: C(zo({ descendantName: "list" }), i.list),
              item: C(zo({ descendantName: "item" }), i.item),
              firstPageItem: C(
                zo({ descendantName: "item", modifierName: "firstPage" }),
                i.firstPageItem
              ),
              lastPageItem: C(
                zo({ descendantName: "item", modifierName: "lastPage" }),
                i.lastPageItem
              ),
              previousPageItem: C(
                zo({ descendantName: "item", modifierName: "previousPage" }),
                i.previousPageItem
              ),
              nextPageItem: C(
                zo({ descendantName: "item", modifierName: "nextPage" }),
                i.nextPageItem
              ),
              pageItem: C(
                zo({ descendantName: "item", modifierName: "page" }),
                i.pageItem
              ),
              selectedItem: C(
                zo({ descendantName: "item", modifierName: "selected" }),
                i.selectedItem
              ),
              disabledItem: C(
                zo({ descendantName: "item", modifierName: "disabled" }),
                i.disabledItem
              ),
              link: C(zo({ descendantName: "link" }), i.link),
            }),
            (i = F(F({}, Zo), r)),
            (u = (r = {
              containerNode: t,
              cssClasses: n,
              templates: i,
              showFirst: o,
              showLast: c,
              showPrevious: v,
              showNext: y,
              scrollToNode: e,
            }).containerNode),
            (l = r.cssClasses),
            (d = r.templates),
            (h = r.showFirst),
            (f = r.showLast),
            (m = r.showPrevious),
            (p = r.showNext),
            (g = r.scrollToNode),
            F(
              F(
                {},
                Rn(
                  function (e, t) {
                    var n = e.createURL,
                      r = e.currentRefinement,
                      i = e.nbPages,
                      a = e.pages,
                      s = e.isFirstPage,
                      o = e.isLastPage,
                      c = e.refine;
                    t ||
                      M(
                        L(Uo, {
                          createURL: n,
                          cssClasses: l,
                          currentPage: r,
                          templates: d,
                          nbPages: i,
                          pages: a,
                          isFirstPage: s,
                          isLastPage: o,
                          setCurrentPage: function (e) {
                            c(e), !1 !== g && g.scrollIntoView();
                          },
                          showFirst: h,
                          showLast: f,
                          showPrevious: m,
                          showNext: p,
                        }),
                        u
                      );
                  },
                  function () {
                    return M(null, t);
                  }
                )({ totalPages: a, padding: s })
              ),
              {},
              { $$widgetType: "ais.pagination" }
            )
          );
        throw new Error(Jo("The `container` option is required."));
      },
      panel: function (e) {
        var e = e || {},
          t = e.templates,
          r = void 0 === t ? {} : t,
          t = e.hidden,
          d =
            void 0 === t
              ? function () {
                  return !1;
                }
              : t,
          t = e.collapsed,
          e = e.cssClasses,
          e = void 0 === e ? {} : e,
          h = document.createElement("div"),
          f = Boolean(t),
          m =
            "function" == typeof t
              ? t
              : function () {
                  return !1;
                },
          p = {
            root: C(yc(), e.root),
            noRefinementRoot: C(
              yc({ modifierName: "noRefinement" }),
              e.noRefinementRoot
            ),
            collapsibleRoot: C(
              yc({ modifierName: "collapsible" }),
              e.collapsibleRoot
            ),
            collapsedRoot: C(
              yc({ modifierName: "collapsed" }),
              e.collapsedRoot
            ),
            collapseButton: C(
              yc({ descendantName: "collapseButton" }),
              e.collapseButton
            ),
            collapseIcon: C(
              yc({ descendantName: "collapseIcon" }),
              e.collapseIcon
            ),
            body: C(yc({ descendantName: "body" }), e.body),
            header: C(yc({ descendantName: "header" }), e.header),
            footer: C(yc({ descendantName: "footer" }), e.footer),
          };
        return function (n) {
          return function (e) {
            var i, a, t, s, o, c, u, l;
            if (e && e.container)
              return (
                (i = N(e.container)),
                (t = {
                  containerNode: i,
                  bodyContainerNode: h,
                  cssClasses: p,
                  templates: F(
                    F(
                      {},
                      {
                        collapseButtonText: function (e) {
                          e = e.collapsed;
                          return '<svg\n          class="'
                            .concat(
                              p.collapseIcon,
                              '"\n          style="width: 1em; height: 1em;"\n          viewBox="0 0 500 500"\n        >\n        <path d="'
                            )
                            .concat(
                              e
                                ? "M100 250l300-150v300z"
                                : "M250 400l150-300H100z",
                              '" fill="currentColor" />\n        </svg>'
                            );
                        },
                      }
                    ),
                    r
                  ),
                }),
                (s = t.containerNode),
                (o = t.bodyContainerNode),
                (c = t.cssClasses),
                (u = t.templates),
                (a = function (e) {
                  var t = e.options,
                    n = e.hidden,
                    r = e.collapsible,
                    e = e.collapsed;
                  M(
                    L(mc, {
                      cssClasses: c,
                      hidden: n,
                      collapsible: r,
                      isCollapsed: e,
                      templates: u,
                      data: t,
                      bodyElement: o,
                    }),
                    s
                  );
                }),
                (l = n(F(F({}, e), {}, { container: h }))),
                F(
                  F({}, l),
                  {},
                  {
                    init: function () {
                      for (
                        var e = arguments.length, t = new Array(e), n = 0;
                        n < e;
                        n++
                      )
                        t[n] = arguments[n];
                      var r = t[0],
                        r = F(
                          F(
                            {},
                            l.getWidgetRenderState
                              ? l.getWidgetRenderState(r)
                              : {}
                          ),
                          r
                        );
                      a({
                        options: r,
                        hidden: !0,
                        collapsible: f,
                        collapsed: !1,
                      }),
                        "function" == typeof l.init &&
                          (r = l.init).call.apply(r, [this].concat(t));
                    },
                    render: function () {
                      for (
                        var e = arguments.length, t = new Array(e), n = 0;
                        n < e;
                        n++
                      )
                        t[n] = arguments[n];
                      var r = t[0],
                        r = F(
                          F(
                            {},
                            l.getWidgetRenderState
                              ? l.getWidgetRenderState(r)
                              : {}
                          ),
                          r
                        );
                      a({
                        options: r,
                        hidden: Boolean(d(r)),
                        collapsible: f,
                        collapsed: Boolean(m(r)),
                      }),
                        "function" == typeof l.render &&
                          (r = l.render).call.apply(r, [this].concat(t));
                    },
                    dispose: function () {
                      if ((M(null, i), "function" == typeof l.dispose)) {
                        for (
                          var e, t = arguments.length, n = new Array(t), r = 0;
                          r < t;
                          r++
                        )
                          n[r] = arguments[r];
                        return (e = l.dispose).call.apply(e, [this].concat(n));
                      }
                    },
                  }
                )
              );
            throw new Error(
              vc(
                "The `container` option is required in the widget within the panel."
              )
            );
          };
        };
      },
      places: Ya,
      poweredBy: function (e) {
        var t,
          r,
          i,
          e = e || {},
          n = e.container,
          a = e.cssClasses,
          a = void 0 === a ? {} : a,
          e = e.theme,
          e = void 0 === e ? "light" : e;
        if (n)
          return (
            (t = N(n)),
            (n = {
              root: C(
                _c(),
                _c({ modifierName: "dark" === e ? "dark" : "light" }),
                a.root
              ),
              link: C(_c({ descendantName: "link" }), a.link),
              logo: C(_c({ descendantName: "logo" }), a.logo),
            }),
            (r = (a = { containerNode: t, cssClasses: n }).containerNode),
            (i = a.cssClasses),
            F(
              F(
                {},
                er(
                  function (e, t) {
                    var n = e.url,
                      e = e.widgetParams;
                    t &&
                      ((t = e.theme),
                      M(
                        L(Sc, {
                          cssClasses: i,
                          url: n,
                          theme: void 0 === t ? "light" : t,
                        }),
                        r
                      ));
                  },
                  function () {
                    return M(null, t);
                  }
                )({ theme: e })
              ),
              {},
              { $$widgetType: "ais.poweredBy" }
            )
          );
        throw new Error(wc("The `container` option is required."));
      },
      queryRuleContext: function () {
        var e =
          0 < arguments.length && void 0 !== arguments[0] ? arguments[0] : {};
        if (e.trackedFilters)
          return F(
            F({}, ai(R)(e)),
            {},
            { $$widgetType: "ais.queryRuleContext" }
          );
        throw new Error(Pc("The `trackedFilters` option is required."));
      },
      queryRuleCustomData: function (e) {
        var t,
          n,
          r,
          i,
          e = e || {},
          a = e.container,
          s = e.cssClasses,
          s = void 0 === s ? {} : s,
          o = e.templates,
          o = void 0 === o ? {} : o,
          e = e.transformItems,
          e =
            void 0 === e
              ? function (e) {
                  return e;
                }
              : e;
        if (a)
          return (
            (s = { root: C(Cc(), s.root) }),
            (t = N(a)),
            (a = F(F({}, xc), o)),
            (n = (o = {
              containerNode: t,
              cssClasses: s,
              renderState: {},
              templates: a,
            }).containerNode),
            (r = o.cssClasses),
            (i = o.templates),
            F(
              F(
                {},
                ai(
                  function (e) {
                    e = e.items;
                    M(L(Nc, { cssClasses: r, templates: i, items: e }), n);
                  },
                  function () {
                    M(null, t);
                  }
                )({ transformItems: e })
              ),
              {},
              { $$widgetType: "ais.queryRuleCustomData" }
            )
          );
        throw new Error(Ic("The `container` option is required."));
      },
      relatedProducts: function (e) {
        var t,
          s,
          o,
          c,
          u,
          e = e || {},
          n = e.container,
          r = e.objectIDs,
          i = e.limit,
          a = e.queryParameters,
          l = e.fallbackParameters,
          d = e.threshold,
          h = e.escapeHTML,
          f = e.transformItems,
          m = e.templates,
          m = void 0 === m ? {} : m,
          e = e.cssClasses,
          e = void 0 === e ? {} : e;
        if (n)
          return (
            (t = N(n)),
            (s = (n = {
              containerNode: t,
              cssClasses: e,
              renderState: {},
              templates: m,
            }).renderState),
            (o = n.cssClasses),
            (c = n.containerNode),
            (u = n.templates),
            F(
              F(
                {},
                En(
                  function (e, t) {
                    var n,
                      r,
                      i = e.items,
                      a = e.results,
                      e = e.instantSearchInstance;
                    t
                      ? (s.templateProps = H({
                          defaultTemplates: {},
                          templatesConfig: e.templatesConfig,
                          templates: u,
                        }))
                      : ((t = u.header
                          ? function (e) {
                              return L(
                                S,
                                g({}, s.templateProps, {
                                  templateKey: "header",
                                  rootTagName: "fragment",
                                  data: {
                                    cssClasses: e.classNames,
                                    items: e.items,
                                  },
                                })
                              );
                            }
                          : void 0),
                        (n = u.item
                          ? function (e) {
                              e = e.item;
                              return L(
                                S,
                                g({}, s.templateProps, {
                                  templateKey: "item",
                                  rootTagName: "fragment",
                                  data: e,
                                })
                              );
                            }
                          : void 0),
                        (r = u.empty
                          ? function () {
                              return L(
                                S,
                                g({}, s.templateProps, {
                                  templateKey: "empty",
                                  rootTagName: "fragment",
                                  data: a,
                                })
                              );
                            }
                          : void 0),
                        M(
                          L(Fc, {
                            items: i,
                            sendEvent: function () {},
                            classNames: o,
                            headerComponent: t,
                            itemComponent: n,
                            emptyComponent: r,
                            status: e.status,
                          }),
                          c
                        ));
                  },
                  function () {
                    return M(null, t);
                  }
                )({
                  objectIDs: r,
                  limit: i,
                  queryParameters: a,
                  fallbackParameters: l,
                  threshold: d,
                  escapeHTML: h,
                  transformItems: f,
                })
              ),
              {},
              { $$widgetType: "ais.relatedProducts" }
            )
          );
        throw new Error(Tc("The `container` option is required."));
      },
      rangeInput: function (e) {
        var t,
          s,
          o,
          c,
          u,
          e = e || {},
          n = e.container,
          r = e.attribute,
          i = e.min,
          a = e.max,
          l = e.precision,
          l = void 0 === l ? 0 : l,
          d = e.cssClasses,
          d = void 0 === d ? {} : d,
          e = e.templates,
          e = void 0 === e ? {} : e;
        if (n)
          return (
            (t = N(n)),
            (n = {
              root: C(Lc(), d.root),
              noRefinement: C(Lc({ modifierName: "noRefinement" })),
              form: C(Lc({ descendantName: "form" }), d.form),
              label: C(Lc({ descendantName: "label" }), d.label),
              input: C(Lc({ descendantName: "input" }), d.input),
              inputMin: C(
                Lc({ descendantName: "input", modifierName: "min" }),
                d.inputMin
              ),
              inputMax: C(
                Lc({ descendantName: "input", modifierName: "max" }),
                d.inputMax
              ),
              separator: C(Lc({ descendantName: "separator" }), d.separator),
              submit: C(Lc({ descendantName: "submit" }), d.submit),
            }),
            (s = (d = {
              containerNode: t,
              cssClasses: n,
              templates: e,
              renderState: {},
            }).containerNode),
            (o = d.cssClasses),
            (c = d.renderState),
            (u = d.templates),
            F(
              F(
                {},
                Nn(
                  function (e, t) {
                    var n = e.refine,
                      r = e.range,
                      i = e.start,
                      a = e.widgetParams,
                      e = e.instantSearchInstance;
                    t
                      ? (c.templateProps = H({
                          defaultTemplates: Mc,
                          templatesConfig: e.templatesConfig,
                          templates: u,
                        }))
                      : ((t = r.min),
                        (e = r.max),
                        (i = (r = k(i, 2))[0]),
                        (r = r[1]),
                        (a = 1 / Math.pow(10, a.precision || 0)),
                        M(
                          L(kc, {
                            min: t,
                            max: e,
                            step: a,
                            values: {
                              min: i !== -1 / 0 && i !== t ? i : void 0,
                              max: r !== 1 / 0 && r !== e ? r : void 0,
                            },
                            cssClasses: o,
                            refine: n,
                            templateProps: c.templateProps,
                          }),
                          s
                        ));
                  },
                  function () {
                    return M(null, t);
                  }
                )({ attribute: r, min: i, max: a, precision: l })
              ),
              {},
              { $$type: "ais.rangeInput", $$widgetType: "ais.rangeInput" }
            )
          );
        throw new Error(Oc("The `container` option is required."));
      },
      rangeSlider: function (e) {
        var t,
          a,
          s,
          o,
          c,
          u,
          e = e || {},
          n = e.container,
          r = e.attribute,
          i = e.min,
          l = e.max,
          d = e.cssClasses,
          d = void 0 === d ? {} : d,
          h = e.step,
          f = e.pips,
          f = void 0 === f || f,
          m = e.precision,
          m = void 0 === m ? 0 : m,
          e = e.tooltips,
          e = void 0 === e || e;
        if (n)
          return (
            (t = N(n)),
            (n = {
              root: C(nu(), d.root),
              disabledRoot: C(nu({ modifierName: "disabled" }), d.disabledRoot),
            }),
            (a = (d = {
              containerNode: t,
              step: h,
              pips: f,
              tooltips: e,
              cssClasses: n,
            }).containerNode),
            (s = d.cssClasses),
            (o = d.pips),
            (c = d.step),
            (u = d.tooltips),
            F(
              F(
                {},
                Nn(
                  function (e, t) {
                    var n,
                      r = e.refine,
                      i = e.range,
                      e = e.start;
                    t ||
                      ((t = i.min),
                      (i = i.max),
                      (n = (e = k(e, 2))[0]),
                      (e = e[1]),
                      M(
                        L(eu, {
                          cssClasses: s,
                          refine: r,
                          min: t,
                          max: i,
                          values: [
                            i < (r = n === -1 / 0 ? t : n) ? i : r,
                            (n = e === 1 / 0 ? i : e) < t ? t : n,
                          ],
                          tooltips: u,
                          step: c,
                          pips: o,
                        }),
                        a
                      ));
                  },
                  function () {
                    return M(null, t);
                  }
                )({ attribute: r, min: i, max: l, precision: m })
              ),
              {},
              { $$type: "ais.rangeSlider", $$widgetType: "ais.rangeSlider" }
            )
          );
        throw new Error(tu("The `container` option is required."));
      },
      ratingMenu: function (e) {
        var t,
          a,
          s,
          o,
          c,
          e = e || {},
          n = e.container,
          r = e.attribute,
          i = e.max,
          i = void 0 === i ? 5 : i,
          u = e.cssClasses,
          u = void 0 === u ? {} : u,
          e = e.templates,
          e = void 0 === e ? {} : e;
        if (n)
          return (
            (t = N(n)),
            (n = {
              root: C(T(), u.root),
              noRefinementRoot: C(
                T({ modifierName: "noRefinement" }),
                u.noRefinementRoot
              ),
              list: C(T({ descendantName: "list" }), u.list),
              item: C(T({ descendantName: "item" }), u.item),
              selectedItem: C(
                T({ descendantName: "item", modifierName: "selected" }),
                u.selectedItem
              ),
              disabledItem: C(
                T({ descendantName: "item", modifierName: "disabled" }),
                u.disabledItem
              ),
              link: C(T({ descendantName: "link" }), u.link),
              starIcon: C(T({ descendantName: "starIcon" }), u.starIcon),
              fullStarIcon: C(
                T({ descendantName: "starIcon", modifierName: "full" }),
                u.fullStarIcon
              ),
              emptyStarIcon: C(
                T({ descendantName: "starIcon", modifierName: "empty" }),
                u.emptyStarIcon
              ),
              label: C(T({ descendantName: "label" }), u.label),
              count: C(T({ descendantName: "count" }), u.count),
            }),
            (a = (u = {
              containerNode: t,
              cssClasses: n,
              renderState: {},
              templates: e,
            }).containerNode),
            (s = u.cssClasses),
            (o = u.templates),
            (c = u.renderState),
            F(
              F(
                {},
                Ln(
                  function (e, t) {
                    var n = e.refine,
                      r = e.items,
                      i = e.createURL,
                      e = e.instantSearchInstance;
                    t
                      ? (c.templateProps = H({
                          defaultTemplates: iu,
                          templatesConfig: e.templatesConfig,
                          templates: o,
                        }))
                      : M(
                          L(
                            vo,
                            {
                              createURL: i,
                              cssClasses: s,
                              facetValues: r,
                              templateProps: c.templateProps,
                              toggleRefinement: n,
                            },
                            L(
                              "svg",
                              { style: "display:none;" },
                              L(
                                "symbol",
                                {
                                  id: T({ descendantName: "starSymbol" }),
                                  viewBox: "0 0 24 24",
                                },
                                su
                              ),
                              L(
                                "symbol",
                                {
                                  id: T({ descendantName: "starEmptySymbol" }),
                                  viewBox: "0 0 24 24",
                                },
                                ou
                              )
                            )
                          ),
                          a
                        );
                  },
                  function () {
                    return M(null, t);
                  }
                )({ attribute: r, max: i })
              ),
              {},
              { $$widgetType: "ais.ratingMenu" }
            )
          );
        throw new Error(au("The `container` option is required."));
      },
      refinementList: function (e) {
        var t,
          d,
          h,
          f,
          m,
          p,
          g,
          v,
          y,
          b,
          e = e || {},
          n = e.container,
          r = e.attribute,
          i = e.operator,
          a = e.sortBy,
          s = e.limit,
          o = e.showMore,
          c = e.showMoreLimit,
          u = e.searchable,
          u = void 0 !== u && u,
          l = e.searchablePlaceholder,
          l = void 0 === l ? "Search..." : l,
          R = e.searchableEscapeFacetValues,
          S = e.searchableIsAlwaysActive,
          S = void 0 === S || S,
          _ = e.cssClasses,
          _ = void 0 === _ ? {} : _,
          w = e.templates,
          w = void 0 === w ? {} : w,
          e = e.transformItems;
        if (n)
          return (
            (R = !!u && Boolean(void 0 === R || R)),
            (t = N(n)),
            (n = {
              root: C(A(), _.root),
              noRefinementRoot: C(
                A({ modifierName: "noRefinement" }),
                _.noRefinementRoot
              ),
              list: C(A({ descendantName: "list" }), _.list),
              item: C(A({ descendantName: "item" }), _.item),
              selectedItem: C(
                A({ descendantName: "item", modifierName: "selected" }),
                _.selectedItem
              ),
              searchBox: C(A({ descendantName: "searchBox" }), _.searchBox),
              label: C(A({ descendantName: "label" }), _.label),
              checkbox: C(A({ descendantName: "checkbox" }), _.checkbox),
              labelText: C(A({ descendantName: "labelText" }), _.labelText),
              count: C(A({ descendantName: "count" }), _.count),
              noResults: C(A({ descendantName: "noResults" }), _.noResults),
              showMore: C(A({ descendantName: "showMore" }), _.showMore),
              disabledShowMore: C(
                A({ descendantName: "showMore", modifierName: "disabled" }),
                _.disabledShowMore
              ),
              searchable: {
                root: C(mu(), _.searchableRoot),
                form: C(mu({ descendantName: "form" }), _.searchableForm),
                input: C(mu({ descendantName: "input" }), _.searchableInput),
                submit: C(mu({ descendantName: "submit" }), _.searchableSubmit),
                submitIcon: C(
                  mu({ descendantName: "submitIcon" }),
                  _.searchableSubmitIcon
                ),
                reset: C(mu({ descendantName: "reset" }), _.searchableReset),
                resetIcon: C(
                  mu({ descendantName: "resetIcon" }),
                  _.searchableResetIcon
                ),
                loadingIndicator: C(
                  mu({ descendantName: "loadingIndicator" }),
                  _.searchableLoadingIndicator
                ),
                loadingIcon: C(
                  mu({ descendantName: "loadingIcon" }),
                  _.searchableLoadingIcon
                ),
              },
            }),
            (_ = {
              containerNode: t,
              cssClasses: n,
              templates: w,
              searchBoxTemplates: {
                submit: w.searchableSubmit,
                reset: w.searchableReset,
                loadingIndicator: w.searchableLoadingIndicator,
              },
              renderState: {},
              searchable: u,
              searchablePlaceholder: l,
              searchableIsAlwaysActive: S,
              showMore: o,
            }),
            (d = _.containerNode),
            (h = _.cssClasses),
            (f = _.templates),
            (m = _.searchBoxTemplates),
            (p = _.renderState),
            (g = _.showMore),
            (v = _.searchable),
            (y = _.searchablePlaceholder),
            (b = _.searchableIsAlwaysActive),
            F(
              F(
                {},
                xn(
                  function (e, t) {
                    var n = e.refine,
                      r = e.items,
                      i = e.createURL,
                      a = e.searchForItems,
                      s = e.isFromSearch,
                      o = e.instantSearchInstance,
                      c = e.toggleShowMore,
                      u = e.isShowingMore,
                      l = e.hasExhaustiveItems,
                      e = e.canToggleShowMore;
                    t
                      ? ((p.templateProps = H({
                          defaultTemplates: hu,
                          templatesConfig: o.templatesConfig,
                          templates: f,
                        })),
                        (p.searchBoxTemplateProps = H({
                          defaultTemplates: du,
                          templatesConfig: o.templatesConfig,
                          templates: m,
                        })))
                      : M(
                          L(vo, {
                            createURL: i,
                            cssClasses: h,
                            facetValues: r,
                            templateProps: p.templateProps,
                            searchBoxTemplateProps: p.searchBoxTemplateProps,
                            toggleRefinement: n,
                            searchFacetValues: v ? a : void 0,
                            searchPlaceholder: y,
                            searchIsAlwaysActive: b,
                            isFromSearch: s,
                            showMore: g && !s && 0 < r.length,
                            toggleShowMore: c,
                            isShowingMore: u,
                            hasExhaustiveItems: l,
                            canToggleShowMore: e,
                          }),
                          d
                        );
                  },
                  function () {
                    return M(null, t);
                  }
                )({
                  attribute: r,
                  operator: i,
                  limit: s,
                  showMore: o,
                  showMoreLimit: c,
                  sortBy: a,
                  escapeFacetValues: R,
                  transformItems: e,
                })
              ),
              {},
              { $$widgetType: "ais.refinementList" }
            )
          );
        throw new Error(fu("The `container` option is required."));
      },
      relevantSort: function (e) {
        var t,
          r,
          i,
          a,
          n = e.container,
          s = e.templates,
          s = void 0 === s ? {} : s,
          e = e.cssClasses,
          e = void 0 === e ? {} : e;
        if (n)
          return (
            (t = N(n)),
            (n = {
              root: C(yu(), e.root),
              text: C(yu({ descendantName: "text" }), e.text),
              button: C(yu({ descendantName: "button" }), e.button),
            }),
            (e = F(F({}, gu), s)),
            (r = (s = {
              containerNode: t,
              cssClasses: n,
              renderState: {},
              templates: e,
            }).containerNode),
            (i = s.cssClasses),
            (a = s.templates),
            F(
              F(
                {},
                ci(
                  function (e) {
                    var t = e.isRelevantSorted,
                      n = e.isVirtualReplica,
                      e = e.refine;
                    M(
                      L(pu, {
                        cssClasses: i,
                        templates: a,
                        isRelevantSorted: t,
                        isVirtualReplica: n,
                        refine: e,
                      }),
                      r
                    );
                  },
                  function () {
                    M(null, t);
                  }
                )({})
              ),
              {},
              { $$widgetType: "ais.relevantSort" }
            )
          );
        throw new Error(vu("The `container` option is required."));
      },
      searchBox: function (e) {
        var t,
          r,
          i,
          a,
          s,
          o,
          c,
          u,
          l,
          d,
          h,
          e = e || {},
          n = e.container,
          f = e.placeholder,
          f = void 0 === f ? "" : f,
          m = e.cssClasses,
          m = void 0 === m ? {} : m,
          p = e.autofocus,
          p = void 0 !== p && p,
          g = e.searchAsYouType,
          g = void 0 === g || g,
          v = e.ignoreCompositionEvents,
          v = void 0 !== v && v,
          y = e.showReset,
          y = void 0 === y || y,
          b = e.showSubmit,
          b = void 0 === b || b,
          R = e.showLoadingIndicator,
          R = void 0 === R || R,
          S = e.queryHook,
          e = e.templates,
          e = void 0 === e ? {} : e;
        if (n)
          return (
            (t = N(n)),
            (n = {
              root: C(Ru(), m.root),
              form: C(Ru({ descendantName: "form" }), m.form),
              input: C(Ru({ descendantName: "input" }), m.input),
              submit: C(Ru({ descendantName: "submit" }), m.submit),
              submitIcon: C(Ru({ descendantName: "submitIcon" }), m.submitIcon),
              reset: C(Ru({ descendantName: "reset" }), m.reset),
              resetIcon: C(Ru({ descendantName: "resetIcon" }), m.resetIcon),
              loadingIndicator: C(
                Ru({ descendantName: "loadingIndicator" }),
                m.loadingIndicator
              ),
              loadingIcon: C(
                Ru({ descendantName: "loadingIcon" }),
                m.loadingIcon
              ),
            }),
            (m = F(F({}, du), e)),
            (r = (e = {
              containerNode: t,
              cssClasses: n,
              placeholder: f,
              templates: m,
              autofocus: p,
              searchAsYouType: g,
              ignoreCompositionEvents: v,
              showReset: y,
              showSubmit: b,
              showLoadingIndicator: R,
            }).containerNode),
            (i = e.cssClasses),
            (a = e.placeholder),
            (s = e.templates),
            (o = e.autofocus),
            (c = e.searchAsYouType),
            (u = e.ignoreCompositionEvents),
            (l = e.showReset),
            (d = e.showSubmit),
            (h = e.showLoadingIndicator),
            F(
              F(
                {},
                kn(
                  function (e) {
                    var t = e.refine,
                      n = e.query,
                      e = e.isSearchStalled;
                    M(
                      L(lo, {
                        query: n,
                        placeholder: a,
                        autofocus: o,
                        refine: t,
                        searchAsYouType: c,
                        ignoreCompositionEvents: u,
                        templates: s,
                        showSubmit: d,
                        showReset: l,
                        showLoadingIndicator: h,
                        isSearchStalled: e,
                        cssClasses: i,
                      }),
                      r
                    );
                  },
                  function () {
                    return M(null, t);
                  }
                )({ queryHook: S })
              ),
              {},
              { $$widgetType: "ais.searchBox" }
            )
          );
        throw new Error(bu("The `container` option is required."));
      },
      sortBy: function (e) {
        var t,
          i,
          a,
          e = e || {},
          n = e.container,
          r = e.items,
          s = e.cssClasses,
          s = void 0 === s ? {} : s,
          e = e.transformItems;
        if (n)
          return (
            (t = N(n)),
            (n = {
              root: C(_u(), s.root),
              select: C(_u({ descendantName: "select" }), s.select),
              option: C(_u({ descendantName: "option" }), s.option),
            }),
            (i = (s = { containerNode: t, cssClasses: n }).containerNode),
            (a = s.cssClasses),
            F(
              F(
                {},
                On(
                  function (e, t) {
                    var n = e.currentRefinement,
                      r = e.options,
                      e = e.refine;
                    t ||
                      M(
                        L(
                          "div",
                          { className: a.root },
                          L(No, {
                            cssClasses: a,
                            currentValue: n,
                            options: r,
                            setValue: e,
                            ariaLabel: "Sort results by",
                          })
                        ),
                        i
                      );
                  },
                  function () {
                    return M(null, t);
                  }
                )({ container: t, items: r, transformItems: e })
              ),
              {},
              { $$widgetType: "ais.sortBy" }
            )
          );
        throw new Error(Su("The `container` option is required."));
      },
      stats: function (e) {
        var t,
          l,
          d,
          h,
          f,
          e = e || {},
          n = e.container,
          r = e.cssClasses,
          r = void 0 === r ? {} : r,
          e = e.templates,
          e = void 0 === e ? {} : e;
        if (n)
          return (
            (t = N(n)),
            (n = {
              root: C(xu(), r.root),
              text: C(xu({ descendantName: "text" }), r.text),
            }),
            (l = (r = {
              containerNode: t,
              cssClasses: n,
              templates: e,
              renderState: {},
            }).renderState),
            (d = r.cssClasses),
            (h = r.containerNode),
            (f = r.templates),
            F(
              F(
                {},
                $n(
                  function (e, t) {
                    var n = e.hitsPerPage,
                      r = e.nbHits,
                      i = e.nbSortedHits,
                      a = e.areHitsSorted,
                      s = e.nbPages,
                      o = e.page,
                      c = e.processingTimeMS,
                      u = e.query,
                      e = e.instantSearchInstance;
                    t
                      ? (l.templateProps = H({
                          defaultTemplates: Iu,
                          templatesConfig: e.templatesConfig,
                          templates: f,
                        }))
                      : M(
                          L(Pu, {
                            cssClasses: d,
                            hitsPerPage: n,
                            nbHits: r,
                            nbSortedHits: i,
                            areHitsSorted: a,
                            nbPages: s,
                            page: o,
                            processingTimeMS: c,
                            query: u,
                            templateProps: l.templateProps,
                          }),
                          h
                        );
                  },
                  function () {
                    return M(null, t);
                  }
                )({})
              ),
              {},
              { $$widgetType: "ais.stats" }
            )
          );
        throw new Error(Nu("The `container` option is required."));
      },
      toggleRefinement: function (e) {
        var t,
          i,
          a,
          s,
          o,
          e = e || {},
          n = e.container,
          r = e.attribute,
          c = e.cssClasses,
          c = void 0 === c ? {} : c,
          u = e.templates,
          u = void 0 === u ? {} : u,
          l = e.on,
          l = void 0 === l || l,
          e = e.off;
        if (n)
          return (
            (t = N(n)),
            (n = {
              root: C(ku(), c.root),
              label: C(ku({ descendantName: "label" }), c.label),
              checkbox: C(ku({ descendantName: "checkbox" }), c.checkbox),
              labelText: C(ku({ descendantName: "labelText" }), c.labelText),
            }),
            (i = (c = {
              containerNode: t,
              cssClasses: n,
              renderState: {},
              templates: u,
            }).containerNode),
            (a = c.cssClasses),
            (s = c.renderState),
            (o = c.templates),
            F(
              F(
                {},
                Bn(
                  function (e, t) {
                    var n = e.value,
                      r = e.refine,
                      e = e.instantSearchInstance;
                    t
                      ? (s.templateProps = H({
                          defaultTemplates: Eu,
                          templatesConfig: e.templatesConfig,
                          templates: o,
                        }))
                      : M(
                          L(Fu, {
                            cssClasses: a,
                            currentRefinement: n,
                            templateProps: s.templateProps,
                            refine: r,
                          }),
                          i
                        );
                  },
                  function () {
                    return M(null, t);
                  }
                )({ attribute: r, on: l, off: e })
              ),
              {},
              { $$widgetType: "ais.toggleRefinement" }
            )
          );
        throw new Error(ju("The `container` option is required."));
      },
      trendingItems: function (e) {
        var t,
          s,
          o,
          c,
          u,
          e = e || {},
          n = e.container,
          r = e.facetName,
          i = e.facetValue,
          a = e.limit,
          l = e.queryParameters,
          d = e.fallbackParameters,
          h = e.threshold,
          f = e.escapeHTML,
          m = e.transformItems,
          p = e.templates,
          p = void 0 === p ? {} : p,
          e = e.cssClasses,
          e = void 0 === e ? {} : e;
        if (n)
          return (
            (t = N(n)),
            (s = (n = {
              containerNode: t,
              cssClasses: e,
              renderState: {},
              templates: p,
            }).renderState),
            (o = n.cssClasses),
            (c = n.containerNode),
            (u = n.templates),
            F(
              F(
                {},
                Un(
                  function (e, t) {
                    var n,
                      r,
                      i = e.items,
                      a = e.results,
                      e = e.instantSearchInstance;
                    t
                      ? (s.templateProps = H({
                          defaultTemplates: {},
                          templatesConfig: e.templatesConfig,
                          templates: u,
                        }))
                      : ((t = u.header
                          ? function (e) {
                              return L(
                                S,
                                g({}, s.templateProps, {
                                  templateKey: "header",
                                  rootTagName: "fragment",
                                  data: {
                                    cssClasses: e.classNames,
                                    items: e.items,
                                  },
                                })
                              );
                            }
                          : void 0),
                        (n = u.item
                          ? function (e) {
                              e = e.item;
                              return L(
                                S,
                                g({}, s.templateProps, {
                                  templateKey: "item",
                                  rootTagName: "fragment",
                                  data: e,
                                })
                              );
                            }
                          : void 0),
                        (r = u.empty
                          ? function () {
                              return L(
                                S,
                                g({}, s.templateProps, {
                                  templateKey: "empty",
                                  rootTagName: "fragment",
                                  data: a,
                                })
                              );
                            }
                          : void 0),
                        M(
                          L(Lu, {
                            items: i,
                            sendEvent: function () {},
                            classNames: o,
                            headerComponent: t,
                            itemComponent: n,
                            emptyComponent: r,
                            status: e.status,
                          }),
                          c
                        ));
                  },
                  function () {
                    return M(null, t);
                  }
                )(
                  F(
                    F({}, r && i ? { facetName: r, facetValue: i } : {}),
                    {},
                    {
                      limit: a,
                      queryParameters: l,
                      fallbackParameters: d,
                      threshold: h,
                      escapeHTML: f,
                      transformItems: m,
                    }
                  )
                )
              ),
              {},
              { $$widgetType: "ais.trendingItems" }
            )
          );
        throw new Error(Ou("The `container` option is required."));
      },
      voiceSearch: function (e) {
        var t,
          i,
          a,
          s,
          e = e || {},
          n = e.container,
          r = e.cssClasses,
          r = void 0 === r ? {} : r,
          o = e.templates,
          o = void 0 === o ? {} : o,
          c = e.searchAsYouSpeak,
          c = void 0 !== c && c,
          u = e.language,
          l = e.additionalQueryParameters,
          e = e.createVoiceSearchHelper;
        if (n)
          return (
            (t = N(n)),
            (n = {
              root: C(zu(), r.root),
              button: C(zu({ descendantName: "button" }), r.button),
              status: C(zu({ descendantName: "status" }), r.status),
            }),
            (r = F(F({}, Vu), o)),
            (i = (o = { containerNode: t, cssClasses: n, templates: r })
              .containerNode),
            (a = o.cssClasses),
            (s = o.templates),
            F(
              F(
                {},
                oi(
                  function (e) {
                    var t = e.isBrowserSupported,
                      n = e.isListening,
                      r = e.toggleListening,
                      e = e.voiceListeningState;
                    M(
                      L($u, {
                        cssClasses: a,
                        templates: s,
                        isBrowserSupported: t,
                        isListening: n,
                        toggleListening: r,
                        voiceListeningState: e,
                      }),
                      i
                    );
                  },
                  function () {
                    return M(null, t);
                  }
                )({
                  container: t,
                  cssClasses: n,
                  templates: r,
                  searchAsYouSpeak: c,
                  language: u,
                  additionalQueryParameters: l,
                  createVoiceSearchHelper: e,
                })
              ),
              {},
              { $$widgetType: "ais.voiceSearch" }
            )
          );
        throw new Error(Ku("The `container` option is required."));
      },
      frequentlyBoughtTogether: function (e) {
        var t,
          s,
          o,
          c,
          u,
          e = e || {},
          n = e.container,
          r = e.objectIDs,
          i = e.limit,
          a = e.queryParameters,
          l = e.threshold,
          d = e.escapeHTML,
          h = e.transformItems,
          f = e.templates,
          f = void 0 === f ? {} : f,
          e = e.cssClasses,
          e = void 0 === e ? {} : e;
        if (n)
          return (
            (t = N(n)),
            (s = (n = {
              containerNode: t,
              cssClasses: e,
              renderState: {},
              templates: f,
            }).renderState),
            (o = n.cssClasses),
            (c = n.containerNode),
            (u = n.templates),
            F(
              F(
                {},
                ui(
                  function (e, t) {
                    var n,
                      r,
                      i = e.items,
                      a = e.results,
                      e = e.instantSearchInstance;
                    t
                      ? (s.templateProps = H({
                          defaultTemplates: {},
                          templatesConfig: e.templatesConfig,
                          templates: u,
                        }))
                      : ((t = u.header
                          ? function (e) {
                              return L(
                                S,
                                g({}, s.templateProps, {
                                  templateKey: "header",
                                  rootTagName: "fragment",
                                  data: {
                                    cssClasses: e.classNames,
                                    items: e.items,
                                  },
                                })
                              );
                            }
                          : void 0),
                        (n = u.item
                          ? function (e) {
                              e = e.item;
                              return L(
                                S,
                                g({}, s.templateProps, {
                                  templateKey: "item",
                                  rootTagName: "fragment",
                                  data: e,
                                })
                              );
                            }
                          : void 0),
                        (r = u.empty
                          ? function () {
                              return L(
                                S,
                                g({}, s.templateProps, {
                                  templateKey: "empty",
                                  rootTagName: "fragment",
                                  data: a,
                                })
                              );
                            }
                          : void 0),
                        M(
                          L(Zu, {
                            items: i,
                            headerComponent: t,
                            itemComponent: n,
                            sendEvent: function () {},
                            classNames: o,
                            emptyComponent: r,
                            status: e.status,
                          }),
                          c
                        ));
                  },
                  function () {
                    return M(null, t);
                  }
                )({
                  objectIDs: r,
                  limit: i,
                  queryParameters: a,
                  threshold: l,
                  escapeHTML: d,
                  transformItems: h,
                })
              ),
              {},
              { $$widgetType: "ais.frequentlyBoughtTogether" }
            )
          );
        throw new Error(Ju("The `container` option is required."));
      },
      lookingSimilar: function (e) {
        var t,
          s,
          o,
          c,
          u,
          e = e || {},
          n = e.container,
          r = e.objectIDs,
          i = e.limit,
          a = e.queryParameters,
          l = e.fallbackParameters,
          d = e.threshold,
          h = e.escapeHTML,
          f = e.transformItems,
          m = e.templates,
          m = void 0 === m ? {} : m,
          e = e.cssClasses,
          e = void 0 === e ? {} : e;
        if (n)
          return (
            (t = N(n)),
            (s = (n = {
              containerNode: t,
              cssClasses: e,
              renderState: {},
              templates: m,
            }).renderState),
            (o = n.cssClasses),
            (c = n.containerNode),
            (u = n.templates),
            F(
              F(
                {},
                li(
                  function (e, t) {
                    var n,
                      r,
                      i = e.items,
                      a = e.results,
                      e = e.instantSearchInstance;
                    t
                      ? (s.templateProps = H({
                          defaultTemplates: {},
                          templatesConfig: e.templatesConfig,
                          templates: u,
                        }))
                      : ((t = u.header
                          ? function (e) {
                              return L(
                                S,
                                g({}, s.templateProps, {
                                  templateKey: "header",
                                  rootTagName: "fragment",
                                  data: {
                                    cssClasses: e.classNames,
                                    items: e.items,
                                  },
                                })
                              );
                            }
                          : void 0),
                        (n = u.item
                          ? function (e) {
                              e = e.item;
                              return L(
                                S,
                                g({}, s.templateProps, {
                                  templateKey: "item",
                                  rootTagName: "fragment",
                                  data: e,
                                })
                              );
                            }
                          : void 0),
                        (r = u.empty
                          ? function () {
                              return L(
                                S,
                                g({}, s.templateProps, {
                                  templateKey: "empty",
                                  rootTagName: "fragment",
                                  data: a,
                                })
                              );
                            }
                          : void 0),
                        M(
                          L(Xu, {
                            items: i,
                            headerComponent: t,
                            itemComponent: n,
                            sendEvent: function () {},
                            classNames: o,
                            emptyComponent: r,
                            status: e.status,
                          }),
                          c
                        ));
                  },
                  function () {
                    return M(null, t);
                  }
                )({
                  objectIDs: r,
                  limit: i,
                  queryParameters: a,
                  fallbackParameters: l,
                  threshold: d,
                  escapeHTML: h,
                  transformItems: f,
                })
              ),
              {},
              { $$widgetType: "ais.lookingSimilar" }
            )
          );
        throw new Error(Yu("The `container` option is required."));
      },
    });
  return (
    (Gu.version = "4.73.4"),
    (Gu.connectors = lr),
    (Gu.widgets = el),
    (Gu.middlewares = ur),
    (Gu.routers = tn),
    (Gu.stateMappings = dn),
    (Gu.createInfiniteHitsSessionStorageCache = function () {
      return {
        read: function (e) {
          var e = e.state,
            t = it(function (e) {
              return e.window.sessionStorage;
            });
          if (!t) return null;
          try {
            var n = JSON.parse(t.getItem(xi));
            return n && He(n.state, Ni(e)) ? n.hits : null;
          } catch (e) {
            if (e instanceof SyntaxError)
              try {
                t.removeItem(xi);
              } catch (e) {}
            return null;
          }
        },
        write: function (e) {
          var t = e.state,
            e = e.hits,
            n = it(function (e) {
              return e.window.sessionStorage;
            });
          if (n)
            try {
              n.setItem(xi, JSON.stringify({ state: Ni(t), hits: e }));
            } catch (e) {}
        },
      };
    }),
    (Gu.highlight = pi),
    (Gu.reverseHighlight = vi),
    (Gu.snippet = bi),
    (Gu.reverseSnippet = Si),
    (Gu.insights = Yt),
    Gu
  );
});


const searchClient = algoliasearch(
  "RLCNMHQ9IE",
  "88867d3bca1ce8c6a13e3bdf2968ca79"
);

const search = instantsearch({
  indexName: "sredevopsorg",
  searchClient,
  insights: true,
});

search.addWidgets([
  instantsearch.widgets.configure({
    attributesToSnippet: ["description"],
  }),
  instantsearch.widgets.searchBox({
    container: "#searchbox",
    placeholder: "Search in SREDevOps.org...",
  }),

  instantsearch.widgets.hits({
    container: "#hits",
    templates: {
      item: (hit, { html, components }) => html`
        <a href="${hit.url}">
          <div class="hit-item group hover:bg-[#14051c]">
            <div class="hit-title group-hover:text-lighter">
              ${components.Highlight({ hit, attribute: "title" })}
              <div class="hit-type">${hit.type}</div>
            </div>
            <div class="hit-description group-hover:text-lighter">
              ${components.Snippet({ hit, attribute: "description" })}
            </div>
          </div>
        </a>
      `,
    },
  }),
]);