/* ==========================================================================
   Payment Checkout – settle a walk-in order (cash or GCash), then send it to
   the kitchen as "Preparing".
   ========================================================================== */
(function () {
  if (!Cafe.layout.start("manual")) return;

  var ui = Cafe.ui;
  var store = Cafe.store;
  var esc = ui.esc;
  var fmt = Cafe.fmt;

  var order = store.getCheckout();
  if (!order) { window.location.replace("manual.html"); return; }

  var summaryEl = document.getElementById("checkout-summary");
  var paymentEl = document.getElementById("checkout-payment");
  var state = { method: "cash", cash: "", gcashRef: "" };

  function figures() {
    var cash = parseFloat(String(state.cash).replace(/[^\d.]/g, "")) || 0;
    return { cash: cash, change: cash - order.total };
  }

  /* ---- Left: read-only summary ---- */
  function renderSummary() {
    var items = order.items.map(function (i) {
      return '<div class="line-item line-item--sm"><div><p class="line-item__name">' + i.qty + "x " + esc(i.name) + "</p>" +
        (i.variant ? '<p class="line-item__variant">' + esc(i.variant) + "</p>" : "") +
        '</div><span class="line-item__price">' + fmt(i.unitPrice * i.qty) + "</span></div>";
    }).join("");

    summaryEl.innerHTML =
      '<div class="checkout-summary__head"><h2>Order #' + order.id + " Settle</h2>" + ui.typeBadge(order.type) + "</div>" +
      '<div class="rule"></div>' + items +
      '<div class="totals">' +
        (order.discount > 0
          ? '<div class="totals__row"><span>Subtotal</span><span>' + fmt(order.subtotal) + "</span></div>" +
            '<div class="totals__row totals__row--discount"><span>' + esc(order.discountType) + " Discount (\u221220%)</span><span class=\"totals__value\">\u2212" + fmt(order.discount) + "</span></div>"
          : "") +
        '<div class="totals__final"><span class="totals__label">Total</span><span class="totals__amount">' + fmt(order.total) + "</span></div>" +
      "</div>";
  }

  /* ---- Right: payment ---- */
  function renderPayment() {
    var methods = [["cash", "Cash", "Tender and compute change"], ["gcash", "GCash / QR Payment", "Customer scans to pay"]];
    var panel;

    if (state.method === "cash") {
      var quick = [["Exact Change", order.total], ["\u20B1500", 500], ["\u20B11,000", 1000], ["\u20B12,000", 2000]];
      panel =
        '<div class="cash-card"><p class="caption">Cash Tendered</p><div class="cash-card__row">' +
          '<div class="cash-card__amount"><span>\u20B1</span><input id="cash-input" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0" aria-label="Cash tendered" value="' + esc(state.cash) + '"></div>' +
          '<button id="cash-clear" type="button" class="cash-card__clear" aria-label="Clear amount" hidden>\u00D7</button></div></div>' +
        '<p class="quick-title">Quick Denominations</p><div class="quick-row quick-row--lg">' +
          quick.map(function (q) {
            return '<button type="button" class="quick-btn quick-btn--lg" data-cash="' + q[1] + '" aria-pressed="false">' + q[0] + "</button>";
          }).join("") + "</div>" +
        '<div id="change-card" class="change-card"><p class="change-card__label">Change Due</p><p id="change-value" class="change-card__value"></p></div>';
    } else {
      panel =
        '<div class="gcash gcash--lg"><div class="gcash__due"><p class="gcash__label">Amount Due</p>' +
          '<p class="gcash__amount">' + fmt(order.total) + '</p><div class="gcash__qr">' + ui.qrCode(160) + "</div>" +
          '<p class="gcash__hint">Ask the customer to scan to pay via GCash.</p></div>' +
          '<div class="field field--lg"><label class="field__label" for="gcash-ref">GCash Reference Number</label>' +
          '<input id="gcash-ref" class="field__input" type="text" maxlength="13" placeholder="e.g. 1234567890" value="' + esc(state.gcashRef) + '"></div></div>';
    }

    paymentEl.innerHTML =
      '<h2 class="checkout-payment__title">Settle Payment</h2>' +
      '<div class="pay-options">' + methods.map(function (m) {
        return '<button type="button" class="pay-option pay-option--lg" data-method="' + m[0] + '" aria-pressed="' + (state.method === m[0]) + '">' +
          '<div class="pay-option__title">' + m[1] + '</div><div class="pay-option__desc">' + m[2] + "</div></button>";
      }).join("") + "</div>" + panel +
      '<div class="btn-row"><button type="button" class="btn btn--outline btn--lg" data-action="receipt">E-Receipt</button>' +
      '<button type="button" class="btn btn--success btn--lg btn--grow" data-action="confirm">Confirm Payment &amp; Complete</button></div>';
    renderFigures();
  }

  function renderFigures() {
    if (state.method !== "cash") return;
    var f = figures();
    var card = document.getElementById("change-card");
    card.classList.toggle("change-card--short", f.change < 0);
    document.getElementById("change-value").textContent = f.change >= 0 ? fmt(f.change) : "\u2014";
    document.getElementById("cash-clear").hidden = !state.cash;
    paymentEl.querySelectorAll("[data-cash]").forEach(function (b) {
      ui.setPressed(b, f.cash === Number(b.dataset.cash));
    });
  }

  /* ---- Events ---- */
  paymentEl.addEventListener("click", function (e) {
    var method = e.target.closest("[data-method]");
    var cash = e.target.closest("[data-cash]");
    var action = e.target.closest("[data-action]");

    if (method) { state.method = method.dataset.method; renderPayment(); }
    else if (cash) {
      state.cash = Number(cash.dataset.cash).toFixed(2);
      document.getElementById("cash-input").value = state.cash;
      renderFigures();
    } else if (e.target.closest("#cash-clear")) {
      state.cash = "";
      document.getElementById("cash-input").value = "";
      renderFigures();
    } else if (action && action.dataset.action === "receipt") {
      var f = figures();
      Cafe.modals.receipt({
        order: order, discountType: order.discountType, discountAmount: order.discount, finalTotal: order.total,
        paymentMethod: state.method, cashTendered: f.cash, cashChange: f.change, gcashReference: state.gcashRef
      });
    } else if (action && action.dataset.action === "confirm") {
      confirmPayment(action);
    }
  });

  paymentEl.addEventListener("input", function (e) {
    if (e.target.id === "cash-input") { state.cash = e.target.value; renderFigures(); }
    if (e.target.id === "gcash-ref")  { state.gcashRef = e.target.value; }
  });

  function confirmPayment(btn) {
    var payload = Object.assign({}, order, { status: "preparing", paymentMethod: state.method });
    if (state.method === "gcash" && state.gcashRef) payload.gcashReference = state.gcashRef.trim();

    btn.disabled = true;
    Cafe.api.createOrder(payload)
      .then(function () {
        store.clearCart();
        store.clearCheckout();
        var form = store.getForm();
        form.customerName = "";
        store.setForm(form);
        window.location.href = "queue.html";
      })
      .catch(function (err) { btn.disabled = false; ui.toast(err.message || "Could not save the order."); });
  }

  renderSummary();
  renderPayment();
})();
