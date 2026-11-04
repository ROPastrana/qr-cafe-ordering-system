/* ==========================================================================
   Order status page – follows the order live through api/track.php
   Reads the order saved by cart.js. No order in session -> back to menu.
   Polls every TRACK_REFRESH_MS while the page is visible and every 30 s while
   it is hidden; stops once the order is completed or declined, or after 3 hours.
   The phone vibrates when the order becomes ready or declined during the visit.
   ========================================================================== */
(function () {
  var ui = Cafe.ui;
  var store = Cafe.store;
  var cfg = Cafe.config;
  var order = store.getOrder();

  if (!order) {
    window.location.replace("menu.html");
    return;
  }

  var $ = function (id) { return document.getElementById(id); };

  /* What the customer sees for each status from track.php */
  var VIEWS = {
    pending:   { title: "Order Received!", total: "Total to Pay",
                 step: "Please proceed to the counter to pay. Your order will be prepared once payment is confirmed." },
    preparing: { title: "Preparing Your Order", total: "Order Total",
                 step: "Payment confirmed. Your drinks & pastries are being prepared fresh now." },
    ready:     { title: "Order Ready!", total: "Order Total",
                 step: "Your order is ready. Please pick it up at the counter." },
    completed: { title: "Order Complete", total: "Order Total",
                 step: "Thank you for ordering. Enjoy!" },
    declined:  { title: "Order Declined", total: "Order Total (Not Charged)", step: "" }
  };
  var FINAL = { completed: true, declined: true };

  /* SVG elements have no .hidden property, so toggle the attribute itself */
  function showSvg(svg, on) {
    if (on) svg.removeAttribute("hidden"); else svg.setAttribute("hidden", "");
  }

  /* ---- Parts that never change ---- */
  $("order-type-badge").textContent = order.orderType;
  $("order-number").textContent = "#" + order.orderNum;
  $("customer-name").textContent = order.name;
  $("order-type").textContent = order.orderType;

  $("summary-items").innerHTML = order.items.map(function (i) {
    return (
      '<div class="summary-row">' +
        "<span>" + Number(i.qty) + "x " + ui.escapeHtml(i.name) + "</span>" +
        "<span>" + Cafe.fmtPrice(i.lineTotal) + "</span>" +
      "</div>"
    );
  }).join("");
  $("order-total").textContent = Cafe.fmtCalc(order.total);

  /* ---- Parts that follow the status ---- */
  function render() {
    var view = VIEWS[order.status] || VIEWS.pending;
    var declined = order.status === "declined";

    document.title = view.title.replace("!", "") + " | QR Cafe";
    $("status-title").textContent = view.title;
    $("status-subtitle").textContent = declined ? "Order not fulfilled" : order.orderType + " • Cafe Order";

    $("status-icon").classList.toggle("status-icon--success", !declined);
    $("status-icon").classList.toggle("status-icon--danger", declined);
    showSvg($("icon-check"), !declined);
    showSvg($("icon-x"), declined);

    $("card-received").hidden = declined;
    $("card-declined").hidden = !declined;
    $("next-step").textContent = view.step;

    /* Typed by the cashier: textContent only, never innerHTML */
    $("decline-reason").textContent = "Reason: " + (order.declineReason || "Not given");
    $("decline-note").textContent = order.declineNote ? "Note from the café: " + order.declineNote : "";
    $("decline-note").hidden = !order.declineNote;

    $("total-label").textContent = view.total;

    var receipt = $("receipt-link");
    receipt.hidden = !order.receiptToken;
    if (order.receiptToken) receipt.href = "/cafe/receipt/index.html?t=" + encodeURIComponent(order.receiptToken);
  }

  /* ---- Live updates ---- */
  var HIDDEN_REFRESH_MS = 30000;            /* a background tab still checks, just less often */
  var GIVE_UP_MS = 3 * 60 * 60 * 1000;      /* stop asking after 3 hours on this page */
  var startedAt = Date.now();
  var timer = null;
  var inFlight = false;                     /* one request at a time, so two chains can never run */

  /* Vibrate when the order changes to ready or declined during this visit.
     lastSeen is the status from the previous answer; the first answer only sets it,
     so a reload on an order that is already ready or declined does not vibrate. */
  var VIBRATE = { ready: [400], declined: [200, 100, 200] };
  var lastSeen = null;

  function vibrateOnChange(status) {
    /* phones without vibration (e.g. iPhone) have no navigator.vibrate and skip this */
    if (lastSeen !== null && status !== lastSeen && VIBRATE[status] && navigator.vibrate) {
      navigator.vibrate(VIBRATE[status]);
    }
    lastSeen = status;
  }

  function stopped() {
    return !order.trackToken || FINAL[order.status] || Date.now() - startedAt >= GIVE_UP_MS;
  }

  function poll() {
    timer = null;
    if (inFlight || stopped()) return;
    inFlight = true;
    Cafe.api.trackOrder(order.trackToken)
      .then(function (t) {
        order.status = t.status;
        order.declineReason = t.declineReason;
        order.declineNote = t.declineNote;
        order.receiptToken = t.receiptToken;
        store.setOrder(order);
        render();
        vibrateOnChange(t.status);
      })
      .catch(function (err) {
        /* 404: the order no longer exists, so stop asking. Otherwise keep the last status and retry. */
        if (err.status === 404) order.trackToken = null;
      })
      .then(function () {
        inFlight = false;
        schedule();
      });
  }

  function schedule() {
    if (!timer && !stopped()) {
      timer = setTimeout(poll, document.hidden ? HIDDEN_REFRESH_MS : cfg.TRACK_REFRESH_MS);
    }
  }

  /* Check right away when the customer comes back to the tab */
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) return;
    clearTimeout(timer);
    timer = null;
    poll();
  });

  /* "Back to Menu" resets to the Coffee tab. The order is only forgotten once it is
     finished (completed or declined); an open order stays, and the menu shows a bar
     that leads back here. */
  $("back-to-menu").addEventListener("click", function () {
    store.setCategory("Coffee");
    if (FINAL[order.status]) store.clearOrder();
  });

  render();
  poll();
})();
