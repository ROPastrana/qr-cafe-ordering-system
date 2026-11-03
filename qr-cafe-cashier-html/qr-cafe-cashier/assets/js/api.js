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

  /* With the real API the menu comes from menu.php; drop the demo menu so it never shows. */
  if (!cfg.USE_MOCK_DATA) Cafe.MENU_ITEMS = [];

  function request(method, path, body) {
    var headers = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    return apiFetch(cfg.API_BASE_URL + path, {
      method: method, headers: headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (json) {
        if (res.status === 401 && path !== "/login.php") {   /* signed out or session older than 12 h */
          store.clearSession();
          window.location.replace("login.html");
        }
        if (!res.ok) throw new Error(json.error || "Request failed (" + res.status + ")");
        return json;
      });
    });
  }

  function reviveOrder(o) {
    o.createdAt = new Date(o.createdAt);
    if (o.completedAt) o.completedAt = new Date(o.completedAt);
    return o;
  }

  /* menu.php item -> the shape the cashier pages use (isDrink, tempOptions) */
  function normalizeMenuItem(r) {
    var hasServe = Boolean(r.hasServe);
    return {
      id: Number(r.id), name: r.name, category: r.category, price: Number(r.price),
      description: r.description || "", image: r.image || "",
      isDrink: Boolean(r.hasSize || r.hasSugar || hasServe || r.fixedTemp),
      tempOptions: hasServe ? "both" : r.fixedTemp === "Cold" ? "cold-only" : "hot-only"
    };
  }

  /* Mock-mode stand-in for the receipt fields pay.php / walkin.php return */
  function mockReceipt(order, payment) {
    var total = order.total;
    var cash = Number(payment.cashTendered) || 0;
    return {
      orderCode: String(order.id), receiptNumber: null, receiptToken: null, method: payment.method,
      subtotal: order.subtotal, discount: order.discount || 0, total: total,
      amountPaid: payment.method === "cash" ? cash : total, change: payment.method === "cash" ? cash - total : 0
    };
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
    /* login.php -> { id, name } */
    return request("POST", "/login.php", { username: username, password: password }).then(function (s) {
      var session = { username: username, name: s.name || username, role: "Cashier" };
      store.setSession(session);
      return session;
    });
  }

  function logout() {
    var done = function () { store.clearSession(); };
    if (cfg.USE_MOCK_DATA) { done(); return Promise.resolve(); }
    return request("POST", "/logout.php").then(done, done);
  }

  /* ---- Menu ---- */
  function getMenu() {
    if (cfg.USE_MOCK_DATA) return Promise.resolve(Cafe.MENU_ITEMS.slice());
    return request("GET", "/menu.php").then(function (rows) {
      Cafe.MENU_ITEMS = rows.map(normalizeMenuItem);   /* so Cafe.menuById() finds the real items */
      return Cafe.MENU_ITEMS.slice();
    });
  }

  /* ---- Orders ---- */
  /* Live queue: every open order plus today's completed / declined ones */
  function getOrders() {
    if (cfg.USE_MOCK_DATA) return Promise.resolve(store.getOrders());
    return request("GET", "/queue.php").then(function (list) { return list.map(reviveOrder); });
  }

  /* from / to: "YYYY-MM-DD". status: "finished" (completed + declined) or "completed" */
  function getHistory(from, to, status) {
    if (cfg.USE_MOCK_DATA) {
      return Promise.resolve(store.getOrders().filter(function (o) {
        var d = Cafe.toDateInput(o.createdAt);
        var wanted = status === "completed" ? o.status === "completed" : o.status === "completed" || o.status === "declined";
        return wanted && d >= from && d <= to;
      }));
    }
    var q = "?from=" + encodeURIComponent(from) + "&to=" + encodeURIComponent(to) + "&status=" + encodeURIComponent(status || "finished");
    return request("GET", "/history.php" + q).then(function (list) { return list.map(reviveOrder); });
  }

  /* status: "ready" | "completed" | "declined" (declined also takes reason + note) */
  function setStatus(id, status, reason, note) {
    if (cfg.USE_MOCK_DATA) {
      var patch = { status: status };
      if (status === "completed") patch.completedAt = new Date();
      if (status === "declined") { patch.declineReason = reason; patch.declineNote = note || undefined; }
      return Promise.resolve(store.updateOrder(id, patch));
    }
    var body = { id: id, status: status };
    if (status === "declined") { body.reason = reason; body.note = note || ""; }
    return request("PATCH", "/status.php", body);
  }

  /* payment: { method: "cash"|"gcash", cashTendered, gcashRef, discountType }
     resolves -> { orderCode, receiptNumber, receiptToken, method, subtotal, discount, total, amountPaid, change } */
  function pay(order, payment) {
    if (cfg.USE_MOCK_DATA) {
      store.updateOrder(order.id, { status: "preparing", paymentMethod: payment.method });
      return Promise.resolve(mockReceipt(order, payment));
    }
    return request("POST", "/pay.php", Object.assign({ orderId: order.id }, payment));
  }

  /* Walk-in order and its payment in one step (walkin.php).
     walkIn: { name, orderType, items: [{ itemId, qty, size, sugarLevel, serve }] } */
  function walkIn(walkIn, payment, draft) {
    if (cfg.USE_MOCK_DATA) {
      draft.id = store.nextOrderId();
      store.addOrder(Object.assign({}, draft, { status: "preparing", paymentMethod: payment.method }));
      return Promise.resolve(mockReceipt(draft, payment));
    }
    return request("POST", "/walkin.php", Object.assign({}, walkIn, payment));
  }

  return {
    login: login, logout: logout, getMenu: getMenu, getOrders: getOrders, getHistory: getHistory,
    setStatus: setStatus, pay: pay, walkIn: walkIn
  };
})();
