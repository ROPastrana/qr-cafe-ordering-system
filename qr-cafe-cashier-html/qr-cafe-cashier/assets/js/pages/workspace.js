/* ==========================================================================
   Order Workspace – review an incoming QR order, apply a discount, take
   payment (cash or GCash), then send it to the kitchen.
   URL: workspace.html?id=<order id>
   ========================================================================== */
(function () {
  if (!Cafe.layout.start("queue")) return;

  var ui = Cafe.ui;
  var esc = ui.esc;
  var fmt = Cafe.fmt;
  var listEl = document.getElementById("order-list");
  var detailEl = document.getElementById("workspace-detail");

  var pending = [];
  var order = null;
  var state = {};
  var selectedId = Number(new URLSearchParams(window.location.search).get("id")) || null;

  function resetPayment() { state = { method: "cash", cash: "", gcashRef: "", discount: null }; }
  resetPayment();

  /* ---- Money ---- */
  function figures() {
    var base = order.total;
    var discount = state.discount ? Cafe.discountAmount(base, state.discount) : 0;
    var final = base - discount;
    var cash = parseFloat(String(state.cash).replace(/[^\d.]/g, "")) || 0;
    return { base: base, discount: discount, final: final, cash: cash, change: cash - final };
  }

  /* ---- Left: incoming list ---- */
  function renderList() {
    if (!pending.length) { listEl.innerHTML = '<p class="workspace-list__empty">No pending orders</p>'; return; }
    listEl.innerHTML = pending.map(function (o) {
      var names = o.items.map(function (i) { return i.name; }).join(", ");
      return '<button type="button" class="order-pick" data-id="' + o.id + '" aria-current="' + (order && o.id === order.id) + '">' +
        '<div class="order-pick__row"><span class="order-pick__id">Order ' + esc(Cafe.orderNo(o)) + "</span>" + ui.typeBadge(o.type) + "</div>" +
        '<p class="order-pick__name">' + esc(o.customer) + "</p>" +
        '<p class="order-pick__items">' + esc(names.slice(0, 36)) + (names.length > 36 ? "\u2026" : "") + "</p></button>";
    }).join("");
  }

  /* ---- Right: detail ---- */
  function payMethodHtml() {
    return '<div class="pay-options">' + [
      ["cash", "Cash", "Tender and compute change"],
      ["gcash", "GCash / QR Payment", "Customer scans to pay"]
    ].map(function (m) {
      return '<button type="button" class="pay-option" data-method="' + m[0] + '" aria-pressed="' + (state.method === m[0]) + '">' +
        '<div class="pay-option__title">' + m[1] + '</div><div class="pay-option__desc">' + m[2] + "</div></button>";
    }).join("") + "</div>";
  }

  function paymentPanelHtml() {
    if (state.method === "cash") {
      return '<div class="cash-box"><div class="quick-row">' +
        [1000, 500].map(function (n) {
          return '<button type="button" class="quick-btn" data-cash="' + n + '" aria-pressed="false">\u20B1' + n.toLocaleString() + "</button>";
        }).join("") +
        '<button type="button" class="quick-btn" data-cash="exact" aria-pressed="false">Exact Change</button></div>' +
        '<div class="cash-input"><span class="cash-input__symbol">\u20B1</span>' +
          '<input id="cash-input" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.00" aria-label="Cash tendered" value="' + esc(state.cash) + '">' +
          '<span id="cash-change" class="cash-input__change" hidden></span></div></div>';
    }
    return '<div class="gcash"><div class="gcash__due"><p class="gcash__label">Amount Due</p>' +
      '<p id="gcash-amount" class="gcash__amount"></p><div class="gcash__qr">' + ui.qrCode(140) + "</div>" +
      '<p class="gcash__hint">Ask the customer to scan to pay via GCash.</p></div>' +
      '<div class="field"><label class="field__label" for="gcash-ref">GCash Reference Number</label>' +
      '<input id="gcash-ref" class="field__input" type="text" maxlength="13" placeholder="e.g. 1234567890" value="' + esc(state.gcashRef) + '"></div></div>';
  }

  function renderDetail() {
    if (!order) {
      detailEl.className = "workspace-empty";
      detailEl.innerHTML = "Select an order to view details";
      return;
    }
    detailEl.className = "workspace-detail";
    var items = order.items.map(function (i) {
      return '<div class="line-item"><div><p class="line-item__name">' + i.qty + "x " + esc(i.name) + "</p>" +
        (i.variant ? '<p class="line-item__variant">' + esc(i.variant) + "</p>" : "") +
        '</div><span class="line-item__price">' + fmt(i.unitPrice * i.qty) + "</span></div>";
    }).join("");

    detailEl.innerHTML =
      '<div class="detail-head"><div class="detail-head__title"><h2>Order ' + esc(Cafe.orderNo(order)) + "</h2>" + ui.typeBadge(order.type) + "</div>" +
        '<span class="detail-status">Status: ' + order.status.charAt(0).toUpperCase() + order.status.slice(1) + "</span></div>" +
      '<p class="detail-meta">' + esc(order.customer) + " \u00B7 Received " + Cafe.fmtTime(order.createdAt) + " \u00B7 " + Cafe.timeAgo(order.createdAt) + "</p>" +
      '<div class="rule"></div><h3 class="section-heading">Order Items Breakdown</h3>' + items +
      (order.note ? '<div class="note-box"><p class="note-box__title">Customer Note</p><p class="note-box__text">\u201C' + esc(order.note) + "\u201D</p></div>" : "") +
      '<div id="discount-slot">' + ui.discountToggle(state.discount) + "</div>" +
      payMethodHtml() + '<div id="payment-panel">' + paymentPanelHtml() + "</div>" +
      '<div id="summary" class="totals"></div>' +
      '<div class="btn-row">' +
        '<button type="button" class="btn btn--outline" data-action="receipt">E-Receipt</button>' +
        '<button type="button" class="btn btn--success btn--grow" data-action="pay">' +
          (state.method === "cash" ? "Mark as Paid &amp; Preparing" : "Confirm Payment Received &amp; Preparing") + "</button></div>";
    renderFigures();
  }

  /* Update everything that depends on the numbers without rebuilding inputs. */
  function renderFigures() {
    var f = figures();
    var summary = document.getElementById("summary");
    summary.innerHTML =
      (f.discount > 0
        ? '<div class="totals__row"><span>Subtotal</span><span>' + fmt(f.base) + "</span></div>" +
          '<div class="totals__row totals__row--discount"><span>' + esc(state.discount) + " Discount (\u221220%)</span><span class=\"totals__value\">\u2212" + fmt(f.discount) + "</span></div>"
        : "") +
      '<div class="totals__final"><span class="totals__label">Total</span><span class="totals__amount">' + fmt(f.final) + "</span></div>";

    var gcashAmount = document.getElementById("gcash-amount");
    if (gcashAmount) gcashAmount.textContent = fmt(f.final);

    var change = document.getElementById("cash-change");
    if (change) {
      change.hidden = !state.cash;
      change.textContent = "Change: " + fmt(Math.max(0, f.change));
    }
    detailEl.querySelectorAll("[data-cash]").forEach(function (b) {
      ui.setPressed(b, b.dataset.cash !== "exact" && f.cash === Number(b.dataset.cash));
    });
  }

  /* ---- Data ---- */
  function pick(id) {
    order = pending.find(function (o) { return o.id === id; }) || pending[0] || null;
    selectedId = order ? order.id : null;
    resetPayment();
    renderList();
    renderDetail();
  }

  Cafe.api.getOrders().then(function (list) {
    pending = list.filter(function (o) { return o.status === "new"; });
    pick(selectedId);
  }).catch(function (err) { ui.toast(err.message || "Could not load orders."); });

  /* ---- Events ---- */
  listEl.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-id]");
    if (btn) pick(Number(btn.dataset.id));
  });

  detailEl.addEventListener("click", function (e) {
    var t = e.target;
    var discount = t.closest("[data-discount]");
    var method = t.closest("[data-method]");
    var cash = t.closest("[data-cash]");
    var action = t.closest("[data-action]");

    if (discount) {
      state.discount = state.discount === discount.dataset.discount ? null : discount.dataset.discount;
      document.getElementById("discount-slot").innerHTML = ui.discountToggle(state.discount);
      renderFigures();
    } else if (method) {
      state.method = method.dataset.method;
      renderDetail();
    } else if (cash) {
      state.cash = cash.dataset.cash === "exact" ? figures().final.toFixed(2) : Number(cash.dataset.cash).toFixed(2);
      document.getElementById("cash-input").value = state.cash;
      renderFigures();
    } else if (action && action.dataset.action === "receipt") {
      var f = figures();
      Cafe.modals.receipt({
        order: order, discountType: state.discount, discountAmount: f.discount, finalTotal: f.final,
        paymentMethod: state.method, cashTendered: f.cash, cashChange: f.change, gcashReference: state.gcashRef
      });
    } else if (action && action.dataset.action === "pay") {
      completePayment(action);
    }
  });

  detailEl.addEventListener("input", function (e) {
    if (e.target.id === "cash-input") { state.cash = e.target.value; renderFigures(); }
    if (e.target.id === "gcash-ref")  { state.gcashRef = e.target.value; }
  });

  /* pay.php recomputes the discount and total from the saved items; the receipt shows its numbers. */
  function completePayment(btn) {
    var payment = { method: state.method, discountType: state.discount || null };
    if (state.method === "cash") payment.cashTendered = figures().cash;
    else payment.gcashRef = state.gcashRef.trim();

    btn.disabled = true;
    Cafe.api.pay(order, payment)
      .then(function (r) {
        Cafe.modals.receipt({
          order: order, discountType: state.discount, discountAmount: r.discount, finalTotal: r.total,
          paymentMethod: r.method, cashTendered: r.amountPaid, cashChange: r.change,
          gcashReference: payment.gcashRef, receiptNumber: r.receiptNumber
        }).addEventListener("close", function () { window.location.href = "queue.html"; });
      })
      .catch(function (err) { btn.disabled = false; ui.toast(err.message || "Could not save the payment."); });
  }
})();
