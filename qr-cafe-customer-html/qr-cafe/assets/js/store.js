/* ==========================================================================
   QR Cafe – Client-side state (cart, form, last placed order)
   Cart, form and menu tab use sessionStorage: they last for this browser tab.
   The placed order uses localStorage, so closing the tab or scanning the QR
   code again doesn't lose it; it expires after ORDER_MAX_AGE_MS.
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

  /* ---- Last placed order (for the status page and the "your order" bar) ----
     Kept in localStorage with the time it was placed; forgotten after 12 hours. */
  var ORDER_MAX_AGE_MS = 12 * 60 * 60 * 1000;

  function getOrder() {
    var order = null;
    try {
      var raw = window.localStorage.getItem(KEYS.order);
      if (raw === null) {
        /* An order saved by the older version (sessionStorage): move it over once */
        raw = window.sessionStorage.getItem(KEYS.order);
        if (raw !== null) {
          var old = JSON.parse(raw);
          window.sessionStorage.removeItem(KEYS.order);
          if (old) { setOrder(old); return getOrder(); }
        }
      }
      /* null in storage but kept in memory: storage refused the write (e.g. full) */
      order = raw === null ? (memory[KEYS.order] || null) : JSON.parse(raw);
    } catch (e) {
      order = KEYS.order in memory ? memory[KEYS.order] : null;
    }
    if (order && (!order.placedAt || Date.now() - order.placedAt > ORDER_MAX_AGE_MS)) {
      clearOrder();
      return null;
    }
    return order;
  }

  function setOrder(order) {
    if (!order.placedAt) order.placedAt = Date.now();
    memory[KEYS.order] = order;
    try { window.localStorage.setItem(KEYS.order, JSON.stringify(order)); } catch (e) { /* memory only */ }
  }

  function clearOrder() {
    delete memory[KEYS.order];
    try {
      window.localStorage.removeItem(KEYS.order);
      window.sessionStorage.removeItem(KEYS.order);
    } catch (e) { /* ignore */ }
  }

  return {
    getCart: getCart, addToCart: addToCart, updateQty: updateQty,
    removeLine: removeLine, clearCart: clearCart, cartCount: cartCount,
    getCategory: getCategory, setCategory: setCategory,
    getForm: getForm, setForm: setForm,
    getOrder: getOrder, setOrder: setOrder, clearOrder: clearOrder
  };
})();
