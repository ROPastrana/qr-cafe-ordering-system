/* ==========================================================================
   QR Cafe Cashier – Browser storage
     localStorage   -> demo orders (mock mode only), shared by all pages
     sessionStorage -> login session, manual-entry cart, checkout draft
   ========================================================================== */
window.Cafe = window.Cafe || {};

Cafe.store = (function () {
  var KEYS = {
    orders: "qrcafe.cashier.orders",
    session: "qrcafe.cashier.session",
    cart: "qrcafe.cashier.cart",
    form: "qrcafe.cashier.form",
    checkout: "qrcafe.cashier.checkout"
  };
  var memory = {};

  function read(area, key, fallback) {
    try {
      var raw = window[area].getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      return key in memory ? memory[key] : fallback;
    }
  }
  function write(area, key, value) {
    memory[key] = value;
    try { window[area].setItem(key, JSON.stringify(value)); } catch (e) { /* memory only */ }
  }
  function remove(area, key) {
    delete memory[key];
    try { window[area].removeItem(key); } catch (e) { /* ignore */ }
  }

  /* ---- Session ---- */
  function getSession() { return read("sessionStorage", KEYS.session, null); }
  function setSession(s) { write("sessionStorage", KEYS.session, s); }
  function clearSession() {
    [KEYS.session, KEYS.cart, KEYS.form, KEYS.checkout].forEach(function (k) { remove("sessionStorage", k); });
  }

  /* ---- Orders (dates are stored as ISO strings and revived on read) ---- */
  function revive(o) {
    o.createdAt = new Date(o.createdAt);
    if (o.completedAt) o.completedAt = new Date(o.completedAt);
    return o;
  }
  function getOrders() {
    var list = read("localStorage", KEYS.orders, null);
    if (!list) { list = Cafe.seedOrders(); saveOrders(list); }
    return list.map(revive);
  }
  function saveOrders(list) { write("localStorage", KEYS.orders, list); }
  function resetOrders() { saveOrders(Cafe.seedOrders()); }

  function nextOrderId() {
    return getOrders().reduce(function (max, o) { return Math.max(max, o.id); }, 0) + 1;
  }
  function updateOrder(id, patch) {
    var list = getOrders().map(function (o) { return o.id === id ? Object.assign({}, o, patch) : o; });
    saveOrders(list);
    return list.find(function (o) { return o.id === id; });
  }
  function addOrder(order) {
    var list = getOrders();
    saveOrders([order].concat(list));
    return order;
  }

  /* ---- Manual-entry cart: [{ itemId, qty, effectivePrice, cartKey, size, sugarLevel, temp }] ---- */
  function getCart() { return read("sessionStorage", KEYS.cart, []); }
  function saveCart(c) { write("sessionStorage", KEYS.cart, c); }
  function addToCart(entry) {
    var cart = getCart();
    var existing = cart.find(function (e) { return e.cartKey === entry.cartKey; });
    if (existing) existing.qty += entry.qty; else cart.push(entry);
    saveCart(cart);
  }
  function changeCartQty(cartKey, delta) {
    saveCart(getCart()
      .map(function (e) { return e.cartKey === cartKey ? Object.assign({}, e, { qty: e.qty + delta }) : e; })
      .filter(function (e) { return e.qty > 0; }));
  }
  function clearCart() { remove("sessionStorage", KEYS.cart); }

  /* ---- Customer name + fulfillment kept while moving between pages ---- */
  function getForm() {
    var f = read("sessionStorage", KEYS.form, {});
    return {
      customerName: typeof f.customerName === "string" ? f.customerName : "",
      fulfillment: Cafe.FULFILLMENT.indexOf(f.fulfillment) === -1 ? "Dine In" : f.fulfillment
    };
  }
  function setForm(f) { write("sessionStorage", KEYS.form, f); }

  /* ---- Checkout draft ---- */
  function getCheckout() {
    var d = read("sessionStorage", KEYS.checkout, null);
    return d ? revive(d) : null;
  }
  function setCheckout(order) { write("sessionStorage", KEYS.checkout, order); }
  function clearCheckout() { remove("sessionStorage", KEYS.checkout); }

  return {
    getSession: getSession, setSession: setSession, clearSession: clearSession,
    getOrders: getOrders, saveOrders: saveOrders, resetOrders: resetOrders,
    nextOrderId: nextOrderId, updateOrder: updateOrder, addOrder: addOrder,
    getCart: getCart, addToCart: addToCart, changeCartQty: changeCartQty, clearCart: clearCart,
    getForm: getForm, setForm: setForm,
    getCheckout: getCheckout, setCheckout: setCheckout, clearCheckout: clearCheckout
  };
})();
