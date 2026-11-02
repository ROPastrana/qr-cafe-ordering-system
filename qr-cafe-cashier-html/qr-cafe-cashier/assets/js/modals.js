/* ==========================================================================
   QR Cafe Cashier – Modals (native <dialog>)
   Cafe.modal.open(html, opts)   Cafe.modal.close()
   Cafe.modals.customize / decline / receipt / orderDetail / declineReason
   ========================================================================== */
window.Cafe = window.Cafe || {};

Cafe.modal = (function () {
  var current = null;

  function close() { if (current) current.close(); }

  /* opts.backdropClose: close when the dark area is clicked (default true) */
  function open(html, opts) {
    close();
    var backdropClose = !opts || opts.backdropClose !== false;
    var dialog = document.createElement("dialog");
    dialog.className = "modal";
    dialog.innerHTML = html;
    document.body.appendChild(dialog);

    dialog.addEventListener("click", function (e) {
      if (e.target.closest("[data-modal-close]") || (backdropClose && e.target === dialog)) close();
    });
    dialog.addEventListener("close", function () {
      if (current === dialog) current = null;
      dialog.remove();
    });

    current = dialog;
    dialog.showModal();
    return dialog;
  }

  return { open: open, close: close };
})();

Cafe.modals = (function () {
  var ui = Cafe.ui;
  var fmt = Cafe.fmt;
  var esc = ui.esc;

  function closeBtn(cls) {
    return '<button type="button" class="' + cls + '" data-modal-close aria-label="Close">' + ui.icons.x + "</button>";
  }

  /* ---------------------------------------------------------------- customize */
  function customize(item, onAdd) {
    var state = { size: "Medium", sugar: "50%", temp: item.tempOptions === "cold-only" ? "Cold" : "Hot", qty: 1 };

    function chips(group, values, extra) {
      return '<div class="chip-group">' + values.map(function (v) {
        return '<button type="button" class="chip' + (extra ? " " + extra : "") + '" data-group="' + group + '" data-value="' + esc(v) + '" aria-pressed="false">' + esc(v) + "</button>";
      }).join("") + "</div>";
    }

    var drinkOptions = "";
    if (item.isDrink) {
      var tempBlock = item.tempOptions === "both"
        ? '<div class="segmented">' + ["Hot", "Cold"].map(function (t) {
            return '<button type="button" class="segmented__btn" data-group="temp" data-value="' + t + '" aria-pressed="false">' + t + "</button>";
          }).join("") + "</div>"
        : '<span class="temp-note ' + (item.tempOptions === "cold-only" ? "temp-note--cold" : "temp-note--hot") + '">' +
          (item.tempOptions === "cold-only" ? "Cold Only" : "Hot Only") + "</span>";

      drinkOptions =
        '<div class="modal__group">' +
          '<div class="modal__group-head"><span class="modal__group-title">Size</span><span class="modal__group-hint" data-size-hint></span></div>' +
          chips("size", Cafe.SIZES) +
        "</div>" +
        '<div class="modal__group"><span class="modal__group-title">Sugar Level</span>' + chips("sugar", Cafe.SUGAR_LEVELS, "chip--brown") + "</div>" +
        '<div class="modal__group"><span class="modal__group-title">Temperature</span>' + tempBlock + "</div>";
    }

    var dialog = Cafe.modal.open(
      '<div class="modal__panel" role="document">' +
        '<div class="modal__hero">' +
          '<img src="' + esc(item.image) + '" alt="' + esc(item.name) + '">' +
          '<div class="modal__hero-fade"></div>' + closeBtn("modal__close") +
          '<h2 class="modal__hero-title">' + esc(item.name) + "</h2>" +
        "</div>" +
        '<div class="modal__body">' +
          '<p class="modal__desc">' + esc(item.description) + "</p>" + drinkOptions +
          '<div class="modal__qty"><span class="modal__qty-label">Quantity</span>' +
            '<div class="qty qty--lg">' +
              '<button type="button" class="qty__btn" data-step="-1" aria-label="Decrease quantity">\u2212</button>' +
              '<span class="qty__value" data-qty aria-live="polite">1</span>' +
              '<button type="button" class="qty__btn qty__btn--inc" data-step="1" aria-label="Increase quantity">+</button>' +
            "</div></div>" +
        "</div>" +
        '<div class="modal__foot">' +
          '<div><span class="modal__foot-label">Total</span><div class="modal__foot-total" data-total></div></div>' +
          '<button type="button" class="btn btn--primary btn--lg modal__add" data-add>Add to Cart</button>' +
        "</div>" +
      "</div>");

    function unitPrice() { return item.price + (item.isDrink ? (Cafe.SIZE_ADJUSTMENTS[state.size] || 0) : 0); }

    function sync() {
      var adj = item.isDrink ? (Cafe.SIZE_ADJUSTMENTS[state.size] || 0) : 0;
      var hint = dialog.querySelector("[data-size-hint]");
      if (hint) hint.textContent = adj < 0 ? "\u2212\u20B1" + Math.abs(adj) : adj > 0 ? "+\u20B1" + adj : "Base price";
      dialog.querySelectorAll("[data-group]").forEach(function (btn) {
        ui.setPressed(btn, state[btn.dataset.group] === btn.dataset.value);
      });
      dialog.querySelector("[data-qty]").textContent = state.qty;
      dialog.querySelector("[data-total]").textContent = fmt(unitPrice() * state.qty);
    }

    dialog.addEventListener("click", function (e) {
      var chip = e.target.closest("[data-group]");
      var step = e.target.closest("[data-step]");
      if (chip) { state[chip.dataset.group] = chip.dataset.value; sync(); }
      else if (step) { state.qty = Math.max(1, state.qty + Number(step.dataset.step)); sync(); }
      else if (e.target.closest("[data-add]")) {
        var entry = item.isDrink
          ? { itemId: item.id, qty: state.qty, effectivePrice: unitPrice(),
              cartKey: Cafe.makeCartKey(item.id, state.size, state.sugar, state.temp),
              size: state.size, sugarLevel: state.sugar, temp: state.temp }
          : { itemId: item.id, qty: state.qty, effectivePrice: item.price, cartKey: Cafe.makeCartKey(item.id) };
        Cafe.modal.close();
        onAdd(entry);
      }
    });
    sync();
  }

  /* ----------------------------------------------------------------- decline */
  function decline(orderId, onConfirm) {
    var reason = Cafe.DECLINE_REASONS[0];
    var dialog = Cafe.modal.open(
      '<div class="modal__panel modal__panel--dialog" role="document">' +
        '<h2 class="dialog__title">Decline Order #' + esc(orderId) + "?</h2>" +
        '<p class="dialog__text">Let the kitchen know why this order can\u2019t be fulfilled. This will notify the customer.</p>' +
        '<div class="dialog__section"><p class="dialog__label">Reason</p><div class="chip-group">' +
          Cafe.DECLINE_REASONS.map(function (r) {
            return '<button type="button" class="chip chip--soft" data-reason="' + esc(r) + '" aria-pressed="false">' + esc(r) + "</button>";
          }).join("") +
        "</div></div>" +
        '<div class="dialog__section dialog__section--last"><label class="dialog__label" for="decline-note">Custom note (optional)</label>' +
          '<textarea id="decline-note" class="textarea" maxlength="255" placeholder="e.g. &quot;Ran out of oat milk \u2014 will restock tomorrow.&quot;"></textarea></div>' +
        '<div class="dialog__actions">' +
          '<button type="button" class="btn btn--outline-strong" data-modal-close>Cancel</button>' +
          '<button type="button" class="btn btn--danger" data-confirm>Confirm Decline</button>' +
        "</div>" +
      "</div>", { backdropClose: false });

    function sync() {
      dialog.querySelectorAll("[data-reason]").forEach(function (b) { ui.setPressed(b, b.dataset.reason === reason); });
    }
    dialog.addEventListener("click", function (e) {
      var r = e.target.closest("[data-reason]");
      if (r) { reason = r.dataset.reason; sync(); }
      else if (e.target.closest("[data-confirm]")) {
        var note = dialog.querySelector("#decline-note").value.trim();
        Cafe.modal.close();
        onConfirm(reason, note);
      }
    });
    sync();
  }

  /* ----------------------------------------------------------------- receipt */
  function barcode() {
    var bars = "";
    for (var i = 0; i < 38; i++) {
      bars += '<span class="barcode__bar' + ((i % 5 === 0 || i % 7 === 0) ? " barcode__bar--wide" : "") + ((i % 3 === 0) ? " barcode__bar--tall" : "") + '"></span>';
    }
    return '<div class="barcode" aria-hidden="true">' + bars + "</div>";
  }

  /* o: { order, discountType, discountAmount, finalTotal, paymentMethod, cashTendered, cashChange, gcashReference } */
  function receipt(o) {
    var order = o.order, now = new Date();
    var pad = function (n) { return String(n).padStart(2, "0"); };
    var refNo = "RC-" + order.id + "-" + now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate());
    var meta = [
      ["Receipt No.", refNo], ["Order ID", "#" + order.id],
      ["Date", Cafe.fmtDate(now)], ["Time", Cafe.fmtTime(now)],
      ["Customer", order.customer], ["Type", order.type]
    ];

    var items = order.items.map(function (i) {
      return '<div class="receipt__item"><div class="receipt__item-main">' +
        '<p class="receipt__item-name">' + esc(i.name) + "</p>" +
        (i.variant ? '<p class="receipt__item-variant">' + esc(i.variant) + "</p>" : "") +
        '</div><div class="receipt__item-side"><p class="receipt__item-calc">' + i.qty + " \u00D7 " + fmt(i.unitPrice) +
        '</p><p class="receipt__item-amount">' + fmt(i.unitPrice * i.qty) + "</p></div></div>";
    }).join("");

    var discountRow = (o.discountType && o.discountAmount != null)
      ? '<div class="receipt__row receipt__row--lg receipt__row--discount"><span>' + esc(o.discountType) + ' Discount (20%)</span><span class="receipt__value">\u2212' + fmt(o.discountAmount) + "</span></div>"
      : "";

    var payExtra = "";
    if (o.paymentMethod === "gcash" && o.gcashReference) {
      payExtra = '<div class="receipt__row receipt__row--boxed"><span>GCash Ref. No.</span><span class="receipt__value--blue">' + esc(o.gcashReference) + "</span></div>";
    } else if (o.paymentMethod === "cash" && o.cashTendered > 0) {
      payExtra =
        '<div class="receipt__row"><span>Cash Tendered</span><span class="receipt__value">' + fmt(o.cashTendered) + "</span></div>" +
        '<div class="receipt__row receipt__row--boxed"><span>Change</span><span class="receipt__value--green">' + fmt(Math.max(0, o.cashChange || 0)) + "</span></div>";
    }

    Cafe.modal.open(
      '<div class="modal__panel modal__panel--receipt" role="document">' +
        '<div class="receipt__head">' + closeBtn("btn-icon no-print") +
          '<div class="brand-mark">' + ui.icons.coffee + "</div>" +
          '<p class="receipt__brand">QR CAF\u00C9</p><p class="receipt__sub">OFFICIAL E-RECEIPT</p>' +
        "</div>" +
        '<div class="receipt__body">' +
          '<div class="receipt__meta">' + meta.map(function (m) {
            return '<div><p class="meta-label">' + m[0] + '</p><p class="meta-value">' + esc(m[1]) + "</p></div>";
          }).join("") + "</div>" +
          '<div class="receipt__rule"></div><p class="meta-label receipt__heading">Items</p>' + items +
          '<div class="receipt__rule receipt__rule--tight"></div>' +
          '<div class="receipt__row receipt__row--lg"><span>Subtotal</span><span class="receipt__value">' + fmt(order.subtotal) + "</span></div>" + discountRow +
          '<div class="receipt__total"><span class="receipt__total-label">TOTAL</span><span class="receipt__total-amount">' + fmt(o.finalTotal) + "</span></div>" +
          '<div class="receipt__row"><span>Payment Method</span><span class="receipt__value">' + (o.paymentMethod === "cash" ? "Cash" : "GCash / QR") + "</span></div>" + payExtra +
          '<div class="receipt__barcode">' + barcode() + '<p class="receipt__ref">' + esc(refNo) + "</p></div>" +
          '<p class="receipt__thanks">Thank you for visiting QR Caf\u00E9!<br>Please keep this receipt for your records.</p>' +
        "</div>" +
        '<div class="modal__foot modal__foot--actions btn-row no-print">' +
          '<button type="button" class="btn btn--outline" data-print>Print</button>' +
          '<button type="button" class="btn btn--primary btn--grow" data-modal-close>Done</button>' +
        "</div>" +
      "</div>").addEventListener("click", function (e) {
        if (e.target.closest("[data-print]")) window.print();
      });
  }

  /* ------------------------------------------------------------- orderDetail */
  function orderDetail(order) {
    var payLabel = { cash: "Cash", gcash: "GCash / QR" };
    var lines = order.items.map(function (i) {
      return '<div class="detail-line"><div>' +
        '<p class="detail-line__name"><span class="qty-badge">' + i.qty + "</span>" + esc(i.name) + "</p>" +
        (i.variant ? '<p class="detail-line__variant">' + esc(i.variant) + "</p>" : "") +
        '</div><div class="detail-line__side"><p class="detail-line__price">' + fmt(i.unitPrice * i.qty) + "</p>" +
        (i.qty > 1 ? '<p class="detail-line__each">' + fmt(i.unitPrice) + " each</p>" : "") + "</div></div>";
    }).join("");

    Cafe.modal.open(
      '<div class="modal__panel modal__panel--detail" role="document">' +
        '<div class="detail-modal__head"><div>' +
          '<div class="detail-modal__title"><h2>Order #' + order.id + "</h2>" + ui.typeBadge(order.type) + ui.statusPill(order.status) + "</div>" +
          '<p class="detail-modal__sub">' + esc(order.customer) + " \u00B7 " + Cafe.fmtDate(order.createdAt, "long") + " \u00B7 " + Cafe.fmtTime(order.createdAt) + "</p>" +
        "</div>" + closeBtn("btn-icon") + "</div>" +
        '<div class="detail-modal__body">' +
          '<p class="eyebrow">Items Ordered</p><div class="detail-lines">' + lines + "</div>" +
          (order.note ? '<div class="detail-modal__note"><p class="eyebrow">Customer Note</p><p class="detail-modal__note-text">\u201C' + esc(order.note) + "\u201D</p></div>" : "") +
          '<div class="total-panel"><span class="total-panel__label">Total</span><span class="total-panel__amount">' + fmt(order.total) + "</span></div>" +
          '<div class="info-grid">' +
            '<div class="info-cell"><p class="eyebrow">Payment Method</p><p class="info-cell__value">' + (order.paymentMethod ? esc(payLabel[order.paymentMethod] || order.paymentMethod) : "\u2014") + "</p></div>" +
            '<div class="info-cell"><p class="eyebrow">Completed At</p><p class="info-cell__value">' + (order.completedAt ? Cafe.fmtTime(order.completedAt) : "\u2014") + "</p></div>" +
          "</div>" +
        "</div>" +
        '<div class="detail-modal__foot btn-row no-print">' +
          '<button type="button" class="btn btn--outline" data-print>Print Receipt</button>' +
          '<button type="button" class="btn btn--dark btn--grow" data-modal-close>Close</button>' +
        "</div>" +
      "</div>").addEventListener("click", function (e) {
        if (e.target.closest("[data-print]")) window.print();
      });
  }

  /* ----------------------------------------------------------- declineReason */
  function declineReason(order) {
    var cls = { "Out of Stock": "reason-pill--stock", "Kitchen Closing": "reason-pill--closing" }[order.declineReason] || "reason-pill--other";
    var lines = order.items.map(function (i) {
      return '<p class="reason__item"><strong>' + i.qty + "\u00D7</strong> " + esc(i.name) +
        (i.variant ? ' <span class="reason__item-variant">\u00B7 ' + esc(i.variant) + "</span>" : "") + "</p>";
    }).join("");

    Cafe.modal.open(
      '<div class="modal__panel modal__panel--reason" role="document">' +
        '<div class="reason__bar"></div><div class="reason__body">' +
          '<div class="reason__head"><div><p class="reason__title">Order #' + order.id + " \u2014 Declined</p>" +
            '<p class="detail-modal__sub">' + esc(order.customer) + " \u00B7 " + esc(order.type) + " \u00B7 " + Cafe.fmtTime(order.createdAt) + "</p></div>" +
            closeBtn("btn-icon") + "</div>" +
          '<div class="reason__items"><p class="eyebrow">Items in Order</p>' + lines +
            '<div class="reason__total"><span>Order total</span><strong>' + fmt(order.total) + "</strong></div></div>" +
          '<p class="eyebrow eyebrow--sm">Decline Reason</p>' +
          '<div class="reason-pill ' + cls + (order.declineNote ? " reason-pill--with-note" : "") + '">' + esc(order.declineReason || "\u2014") + "</div>" +
          (order.declineNote ? '<div class="reason__note"><p class="eyebrow eyebrow--xs">Staff Note</p><div class="quote-box">\u201C' + esc(order.declineNote) + "\u201D</div></div>" : "") +
          '<button type="button" class="btn btn--dark btn--block" data-modal-close>Close</button>' +
        "</div>" +
      "</div>");
  }

  return { customize: customize, decline: decline, receipt: receipt, orderDetail: orderDetail, declineReason: declineReason };
})();
