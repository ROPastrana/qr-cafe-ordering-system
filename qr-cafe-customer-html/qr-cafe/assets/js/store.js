/* ==========================================================================
   QR Cafe – Client-side state (cart, form, placed orders)
   Cart, form and menu tab use sessionStorage: they last for this browser tab.
   Placed orders use localStorage, so closing the tab or scanning the QR code
   again doesn't lose them; each expires after ORDER_MAX_AGE_MS.
   Falls back to memory if storage is blocked.
   ========================================================================== */
window.Cafe = window.Cafe || {};

Cafe.store = (function () {
  var KEYS = {
    cart: "qrcafe.cart",
    category: "qrcafe.category",
    form: "qrcafe.form",
    order: "qrcafe.order"
  };
  var memory = {};

  function read(key, fallback) {
    try {
      var raw = window.sessionStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      return key in memory ? memory[key] : fallback;
    }
  }

  function write(key, value) {
    memory[key] = value;
    try { window.sessionStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* memory only */ }
  }

  function remove(key) {
    delete memory[key];
    try { window.sessionStorage.removeItem(key); } catch (e) { /* ignore */ }
  }

  /* ---- Cart: [{ cartId, itemId, size, sugarLevel, serve, qty }] ---- */
  function getCart() { return read(KEYS.cart, []); }
  function saveCart(cart) { write(KEYS.cart, cart); }

  function addToCart(line) {
    var cart = getCart();
    var match = cart.find(function (l) {
      return l.itemId === line.itemId && l.size === line.size &&
             l.sugarLevel === line.sugarLevel && l.serve === line.serve;
    });
    if (match) {
      match.qty += line.qty;
    } else {
      line.cartId = line.itemId + "-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
      cart.push(line);
    }
    saveCart(cart);
  }

  function updateQty(cartId, delta) {
    var cart = getCart().map(function (l) {
      return l.cartId === cartId ? Object.assign({}, l, { qty: Math.max(1, l.qty + delta) }) : l;
    });
    saveCart(cart);
  }

  function removeLine(cartId) {
    saveCart(getCart().filter(function (l) { return l.cartId !== cartId; }));
  }

  function clearCart() { remove(KEYS.cart); }

  function cartCount() {
    return getCart().reduce(function (sum, l) { return sum + l.qty; }, 0);
  }

  /* ---- Menu category tab ---- */
  function getCategory() {
    var c = read(KEYS.category, "Coffee");
    return Cafe.CATEGORIES.indexOf(c) === -1 ? "Coffee" : c;
  }
  function setCategory(c) { write(KEYS.category, c); }

  /* ---- Cart form: { name, orderType } ---- */
  function getForm() {
    var f = read(KEYS.form, {});
    return {
      name: typeof f.name === "string" ? f.name : "",
      orderType: Cafe.ORDER_TYPES.indexOf(f.orderType) === -1 ? "Dine In" : f.orderType
    };
  }
  function setForm(form) { write(KEYS.form, form); }

  /* ---- Placed orders (for the status pages and the "your orders" bar) ----
     A list in localStorage, newest first, so a customer who orders twice can
     follow both. Orders are told apart by orderNum. Each one is forgotten
     12 hours after it was placed, and at most MAX_ORDERS are kept. */
  var ORDERS_KEY = "qrcafe.orders";
  var ORDER_MAX_AGE_MS = 12 * 60 * 60 * 1000;
  var MAX_ORDERS = 5;

  function sameOrder(a, b) { return String(a.orderNum) === String(b.orderNum); }

  function saveOrders(list) {
    memory[ORDERS_KEY] = list;
    try { window.localStorage.setItem(ORDERS_KEY, JSON.stringify(list)); } catch (e) { /* memory only */ }
  }

  /* The current list: expired orders dropped, newest first */
  function getOrders() {
    var list = null;
    try {
      var raw = window.localStorage.getItem(ORDERS_KEY);
      list = raw === null ? null : JSON.parse(raw);
    } catch (e) { list = null; }
    /* nothing readable in storage: use what this page kept in memory (storage blocked or full) */
    if (!Array.isArray(list)) list = Array.isArray(memory[ORDERS_KEY]) ? memory[ORDERS_KEY] : [];
    var before = JSON.stringify(list);

    /* A single order saved by an older version of this app ("qrcafe.order",
       in localStorage or sessionStorage): move it into the list once */
    [function () { return window.localStorage; }, function () { return window.sessionStorage; }].forEach(function (area) {
      try {
        var s = area();
        var raw = s.getItem(KEYS.order);
        if (raw === null) return;
        s.removeItem(KEYS.order);
        var old = JSON.parse(raw);
        if (old && old.orderNum != null && !list.some(function (o) { return sameOrder(o, old); })) list.push(old);
      } catch (e) { /* storage blocked or unreadable: nothing to move */ }
    });

    var now = Date.now();
    list = list
      .filter(function (o) { return o && o.orderNum != null; })
      .map(function (o) { if (!o.placedAt) o.placedAt = now; return o; })
      .filter(function (o) { return now - o.placedAt <= ORDER_MAX_AGE_MS; })
      .sort(function (a, b) { return b.placedAt - a.placedAt; })
      .slice(0, MAX_ORDERS);

    if (JSON.stringify(list) !== before) saveOrders(list);
    return list;
  }

  /* One order by its number, or the newest one when no number is given */
  function getOrder(orderNum) {
    var list = getOrders();
    if (orderNum == null || orderNum === "") return list[0] || null;
    return list.find(function (o) { return sameOrder(o, { orderNum: orderNum }); }) || null;
  }

  /* Adds a new order, or updates the saved copy of one already in the list */
  function setOrder(order) {
    if (!order.placedAt) order.placedAt = Date.now();
    var list = getOrders();
    var i = list.findIndex(function (o) { return sameOrder(o, order); });
    if (i === -1) list.unshift(order); else list[i] = order;
    list.sort(function (a, b) { return b.placedAt - a.placedAt; });
    saveOrders(list.slice(0, MAX_ORDERS));
  }

  /* Forgets one order */
  function clearOrder(orderNum) {
    saveOrders(getOrders().filter(function (o) { return !sameOrder(o, { orderNum: orderNum }); }));
  }

  return {
    getCart: getCart, addToCart: addToCart, updateQty: updateQty,
    removeLine: removeLine, clearCart: clearCart, cartCount: cartCount,
    getCategory: getCategory, setCategory: setCategory,
    getForm: getForm, setForm: setForm,
    getOrders: getOrders, getOrder: getOrder, setOrder: setOrder, clearOrder: clearOrder
  };
})();
