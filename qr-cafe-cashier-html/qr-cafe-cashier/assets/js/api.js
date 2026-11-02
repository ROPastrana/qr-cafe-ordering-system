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

  function csrfHeaders() {
    var meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? { "X-CSRF-Token": meta.content } : {};
  }

  function request(method, path, body) {
    var headers = Object.assign({ Accept: "application/json" }, method === "GET" ? {} : csrfHeaders());
    if (body !== undefined) headers["Content-Type"] = "application/json";
    return fetch(cfg.API_BASE_URL + path, {
      method: method, headers: headers, credentials: "same-origin",
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
