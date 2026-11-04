/* ==========================================================================
   Cart page – review lines, edit quantities, name + order type, place order
   ========================================================================== */
(function () {
  var ui = Cafe.ui;
  var store = Cafe.store;

  var $ = function (id) { return document.getElementById(id); };
  var el = {
    empty: $("cart-empty"), emptyTitle: $("cart-empty-title"), filled: $("cart-filled"),
    items: $("cart-items"), total: $("cart-total-amount"), name: $("customer-name"),
    type: $("order-type"), footer: $("cart-footer"), error: $("cart-error"),
    place: $("place-order")
  };

  var byId = new Map();
  var form = store.getForm();
  var submitting = false;

  /* Request id for this cart: made on the first Place Order tap and sent again when the
     customer retries after an error, so a retry never creates a second order. Cleared when
     the cart, name or order type changes, and after a successful order. */
  var requestId = null;

  /* A random UUID. crypto.randomUUID() needs https; getRandomValues also works on plain http. */
  function newRequestId() {
    var b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40;   /* version 4 */
    b[8] = (b[8] & 0x3f) | 0x80;   /* variant */
    var h = Array.prototype.map.call(b, function (x) { return (x + 256).toString(16).slice(1); }).join("");
    return h.slice(0, 8) + "-" + h.slice(8, 12) + "-" + h.slice(12, 16) + "-" + h.slice(16, 20) + "-" + h.slice(20);
  }

  /* Cart lines joined with their menu item; lines whose item vanished are skipped. */
  function rows() {
    return store.getCart()
      .map(function (line) { return { line: line, item: byId.get(line.itemId) }; })
      .filter(function (r) { return r.item; });
  }

  function lineHtml(r) {
    var item = r.item, line = r.line;
    var name = item.name.length > 18 ? item.name.slice(0, 18) + "..." : item.name;
    return (
      '<div class="cart-card">' +
        '<img class="cart-card__img" src="' + ui.escapeHtml(item.image) + '" alt="" loading="lazy">' +
        '<div class="cart-card__body">' +
          '<div class="cart-card__head">' +
            '<p class="cart-card__name">' + ui.escapeHtml(name) + "</p>" +
            '<button type="button" class="btn-remove" data-remove="' + ui.escapeHtml(line.cartId) + '" aria-label="Remove ' + ui.escapeHtml(item.name) + '">' +
              '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">' +
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />' +
              "</svg>" +
            "</button>" +
          "</div>" +
          '<p class="cart-card__variant">' + ui.escapeHtml(ui.variantText(line, item)) + "</p>" +
          '<p class="cart-card__price">' + Cafe.fmtPrice(Cafe.itemPrice(item, line.size)) + "</p>" +
          '<div class="cart-card__qty">' + ui.stepperHtml(line.qty, true, line.cartId) + "</div>" +
        "</div>" +
      "</div>"
    );
  }

  function buildOrderType() {
    el.type.innerHTML = Cafe.ORDER_TYPES.map(function (t) {
      return (
        '<button type="button" class="pill pill--type" data-type="' + t + '" aria-pressed="false">' + t + "</button>"
      );
    }).join("");
  }

  function canPlace() {
    return !submitting && form.name.trim().length > 0 && rows().length > 0;
  }

  /* Things that depend on the form, not on the cart lines. */
  function syncForm() {
    el.type.querySelectorAll("[data-type]").forEach(function (btn) {
      ui.setPressed(btn, btn.dataset.type === form.orderType);
    });

    el.place.textContent = "Place Order \u00b7 " + form.orderType + " \u2192";
    el.place.disabled = !canPlace();
  }

  function render() {
    var list = rows();
    var isEmpty = list.length === 0;

    el.empty.hidden = !isEmpty;
    el.filled.hidden = isEmpty;
    el.footer.hidden = isEmpty;
    if (isEmpty) return;

    el.items.innerHTML = list.map(lineHtml).join("");
    var total = list.reduce(function (sum, r) { return sum + Cafe.itemPrice(r.item, r.line.size) * r.line.qty; }, 0);
    el.total.textContent = Cafe.fmtCalc(total);
    syncForm();
  }

  function showError(msg) {
    el.error.textContent = msg || "";
    el.error.hidden = !msg;
  }

  function submit() {
    if (!canPlace()) return;
    var list = rows();
    var name = form.name.trim();

    submitting = true;
    showError("");
    syncForm();
    el.place.textContent = "Placing order\u2026";
    if (!requestId) requestId = newRequestId();

    Cafe.api.placeOrder({
      customerName: name,
      serviceType: form.orderType,
      requestId: requestId,
      items: list.map(function (r) {
        return {
          itemId: r.item.id, qty: r.line.qty,
          size: r.item.hasSize ? r.line.size : null,
          sugarLevel: r.item.hasSugar ? r.line.sugarLevel : null,
          serve: r.item.hasServe ? r.line.serve : null
        };
      })
    })
      .then(function (result) {
        var total = 0;
        var lines = list.map(function (r) {
          var lineTotal = Cafe.itemPrice(r.item, r.line.size) * r.line.qty;
          total += lineTotal;
          return { qty: r.line.qty, name: r.item.name, lineTotal: lineTotal };
        });

        store.setOrder({
          orderNum: result.orderNum,
          status: result.status,
          trackToken: result.trackToken,
          name: name,
          orderType: form.orderType,
          items: lines,
          total: result.total != null ? result.total : total   /* the server's price wins */
        });
        requestId = null;
        store.clearCart();
        store.setForm({ name: "", orderType: form.orderType });
        /* replace(): the phone's back button then skips the now-empty cart */
        window.location.replace("order-status.html");
      })
      .catch(function (err) {
        submitting = false;
        showError(err && err.message ? err.message : "Could not place your order. Please try again.");
        syncForm();
      });
  }

  /* ---- Events ---- */
  el.items.addEventListener("click", function (e) {
    var remove = e.target.closest("[data-remove]");
    var step = e.target.closest("[data-step]");
    if (remove) {
      requestId = null;
      store.removeLine(remove.dataset.remove);
      render();
    } else if (step) {
      requestId = null;
      store.updateQty(step.dataset.id, step.dataset.step === "inc" ? 1 : -1);
      render();
    }
  });

  el.name.addEventListener("input", function () {
    requestId = null;
    form.name = el.name.value;
    store.setForm(form);
    syncForm();
  });

  el.type.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-type]");
    if (!btn) return;
    if (btn.dataset.type !== form.orderType) requestId = null;
    form.orderType = btn.dataset.type;
    store.setForm(form);
    syncForm();
  });

  el.place.addEventListener("click", submit);

  /* ---- Init ---- */
  buildOrderType();
  el.name.value = form.name;

  Cafe.api.getMenu()
    .then(function (menu) {
      menu.forEach(function (m) { byId.set(m.id, m); });
      render();
    })
    .catch(function () {
      el.empty.hidden = false;
      el.emptyTitle.textContent = "We couldn\u2019t load your cart. Please refresh the page.";
    });
})();
