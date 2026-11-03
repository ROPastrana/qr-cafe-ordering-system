/* ==========================================================================
   QR Cafe Cashier – Data access layer
   The only file that talks to the back end. Pages never call fetch() directly.
   Every method returns a Promise. In mock mode the data lives in browser
   storage; otherwise it calls the PHP REST API (JSON shapes: see README.md).
   ========================================================================== */
window.Cafe = window.Cafe || {};

Cafe.api = (function () {
  var cfg = Cafe.config;
  var store = Cafe.store;

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* The PHP API answers 403 to any POST/PATCH without an X-CSRF-Token header.
     The token lives in the PHP session, so it is fetched once from csrf.php and
     fetched again when the session was reset (logout, expiry). */
  var CSRF_URL = "/cafe/api/csrf.php";
  var csrfPromise = null;

  function getCsrfToken() {
    if (!csrfPromise) {
      csrfPromise = fetch(CSRF_URL, { credentials: "same-origin", headers: { Accept: "application/json" } })
        .then(function (res) {
          if (!res.ok) throw new Error("Could not reach the server (" + res.status + ")");
          return res.json();
        })
        .then(function (json) { return json.token; });
      csrfPromise.catch(function () { csrfPromise = null; });
    }
    return csrfPromise;
  }

  /* fetch() that adds the CSRF header to writes and retries once on 403.
     A 403 from the CSRF check means the server did nothing, so a retry is safe. */
  function apiFetch(url, options, isRetry) {
    var opts = Object.assign({ credentials: "same-origin" }, options);
    if ((opts.method || "GET").toUpperCase() === "GET") return fetch(url, opts);
    return getCsrfToken().then(function (token) {
      opts.headers = Object.assign({}, opts.headers, { "X-CSRF-Token": token });
      return fetch(url, opts);
    }).then(function (res) {
      if (res.status === 403 && !isRetry) {
        csrfPromise = null;
        return apiFetch(url, options, true);
      }
      return res;
    });
  }

  function request(method, path, body) {
    var headers = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    return apiFetch(cfg.API_BASE_URL + path, {
      method: method, headers: headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (json) {
        if (res.status === 401 && path !== "/auth/login") {
          store.clearSession();
          window.location.replace("login.html");
        }
        if (!res.ok) throw new Error(json.message || "Request failed (" + res.status + ")");
        return json.data !== undefined ? json.data : json;
      });
    });
  }

  function reviveOrder(o) {
    o.createdAt = new Date(o.createdAt);
    if (o.completedAt) o.completedAt = new Date(o.completedAt);
    return o;
  }

  /* ---- Auth ---- */
  function login(username, password) {
    if (cfg.USE_MOCK_DATA) {
      return wait(600).then(function () {
        store.resetOrders();                       /* fresh demo data each sign-in */
        var session = { username: username || "cashier", name: "Juan D.", role: "Station 1 · Cashier" };
        store.setSession(session);
        return session;
      });
    }
    return request("POST", "/auth/login", { username: username, password: password }).then(function (s) {
      var session = { username: s.username || username, name: s.name || username, role: s.role || "Cashier" };
      store.setSession(session);
      return session;
    });
  }

  function logout() {
    var done = function () { store.clearSession(); };
    if (cfg.USE_MOCK_DATA) { done(); return Promise.resolve(); }
    return request("POST", "/auth/logout").then(done, done);
  }

  /* ---- Menu ---- */
  function getMenu() {
    return cfg.USE_MOCK_DATA ? Promise.resolve(Cafe.MENU_ITEMS.slice()) : request("GET", "/menu");
  }

  /* ---- Orders ---- */
  function getOrders() {
    if (cfg.USE_MOCK_DATA) return Promise.resolve(store.getOrders());
    return request("GET", "/orders").then(function (list) { return list.map(reviveOrder); });
  }

  /* patch: any of { status, paymentMethod, completedAt, declineReason, declineNote } */
  function updateOrder(id, patch) {
    if (cfg.USE_MOCK_DATA) return Promise.resolve(store.updateOrder(id, patch));
    return request("PATCH", "/orders/" + encodeURIComponent(id), patch).then(reviveOrder);
  }

  /* order: an order draft from Cafe.buildOrder() plus { status, paymentMethod } */
  function createOrder(order) {
    if (cfg.USE_MOCK_DATA) {
      order.id = store.nextOrderId();
      return Promise.resolve(store.addOrder(order));
    }
    var body = Object.assign({}, order);
    delete body.id;                                /* the server assigns the real id */
    return request("POST", "/orders", body).then(reviveOrder);
  }

  return { login: login, logout: logout, getMenu: getMenu, getOrders: getOrders, updateOrder: updateOrder, createOrder: createOrder };
})();
