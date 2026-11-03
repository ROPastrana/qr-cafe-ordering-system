/* ==========================================================================
   QR Cafe – Data access layer
   One place that talks to the back end. Pages never call fetch() directly.
   See README.md for the JSON contract expected from the PHP REST API.
   ========================================================================== */
window.Cafe = window.Cafe || {};

Cafe.api = (function () {
  var cfg = Cafe.config;
  var menuPromise = null;

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

  /* Accepts the front-end shape OR the DB column names from tbl_menu_items. */
  function normalizeItem(r) {
    var category = r.category != null ? r.category : r.category_name;
    var isDrink = category !== "Pastries";
    function flag(a, b, fallback) {
      var v = a != null ? a : b;
      return v == null ? fallback : Boolean(Number(v) || v === true);
    }
    return {
      id: Number(r.id != null ? r.id : r.item_id),
      name: String(r.name != null ? r.name : r.item_name),
      description: r.description || "",
      price: Number(r.price != null ? r.price : r.base_price),
      image: r.image || r.image_url || "",
      category: category,
      popular: flag(r.popular, r.is_popular, false),
      hasSize: flag(r.hasSize, r.has_size, isDrink),
      hasSugar: flag(r.hasSugar, r.has_sugar, isDrink),
      hasServe: flag(r.hasServe, r.has_serve, false),
      available: flag(r.available, r.is_available, true)
    };
  }

  function getMenu() {
    if (menuPromise) return menuPromise;

    if (cfg.USE_MOCK_DATA) {
      menuPromise = Promise.resolve(Cafe.MENU.slice());
    } else {
      menuPromise = fetch(cfg.API_BASE_URL + "/menu", { headers: { Accept: "application/json" } })
        .then(function (res) {
          if (!res.ok) throw new Error("Menu request failed (" + res.status + ")");
          return res.json();
        })
        .then(function (json) {
          var rows = Array.isArray(json) ? json : json.data;
          return rows.map(normalizeItem).filter(function (i) { return i.available; });
        });
    }
    /* Do not cache failures. */
    menuPromise.catch(function () { menuPromise = null; });
    return menuPromise;
  }

  /*
   * order = {
   *   customerName, serviceType ("Dine In" | "Take Out"),
   *   items: [{ itemId, qty, size, sugarLevel, serve }],
   *   simulateDecline (mock mode only)
   * }
   * resolves -> { orderNum, status: "received" | "declined" }
   */
  function placeOrder(order) {
    if (cfg.USE_MOCK_DATA) {
      return wait(300).then(function () {
        return {
          orderNum: String(Math.floor(100 + Math.random() * 900)),
          status: order.simulateDecline ? "declined" : "received"
        };
      });
    }

    var body = {
      customer_name: order.customerName,
      order_type: "self_order",
      service_type: order.serviceType,
      items: order.items.map(function (i) {
        return {
          item_id: i.itemId,
          quantity: i.qty,
          size: i.size,
          sugar_level: i.sugarLevel,
          temperature: i.serve
        };
      })
    };

    return apiFetch(cfg.API_BASE_URL + "/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body)
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (json) {
          if (!res.ok) throw new Error(json.message || "Could not place your order. Please try again.");
          return json;
        });
      })
      .then(function (json) {
        var d = json.data || json;
        return { orderNum: String(d.order_code || d.order_id), status: "received" };
      });
  }

  return { getMenu: getMenu, placeOrder: placeOrder };
})();
