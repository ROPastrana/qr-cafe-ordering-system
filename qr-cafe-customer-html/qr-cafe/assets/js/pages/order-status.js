/* ==========================================================================
   Order status page – follows the order live through api/track.php
   Reads the order saved by cart.js. No order in session -> back to menu.
   Polls every TRACK_REFRESH_MS while the page is visible, and stops once the
   order is completed or declined.
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
  var timer = null;
  var busy = false;

  function poll() {
    timer = null;
    if (busy || !order.trackToken || FINAL[order.status]) return;
    busy = true;
    Cafe.api.trackOrder(order.trackToken)
      .then(function (t) {
        order.status = t.status;
        order.declineReason = t.declineReason;
        order.declineNote = t.declineNote;
        order.receiptToken = t.receiptToken;
        store.setOrder(order);
        render();
      })
      .catch(function (err) {
        /* 404: the order no longer exists, so stop asking. Otherwise keep the last status and retry. */
        if (err.status === 404) order.trackToken = null;
      })
      .then(function () {
        busy = false;
        schedule();
      });
  }

  function schedule() {
    if (!timer && !document.hidden && order.trackToken && !FINAL[order.status]) {
      timer = setTimeout(poll, cfg.TRACK_REFRESH_MS);
    }
  }

  /* Phones pause background tabs: check right away when the customer comes back */
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) return;
    clearTimeout(timer);
    poll();
  });

  /* "Back to Menu" resets to the Coffee tab and forgets this order. */
  $("back-to-menu").addEventListener("click", function () {
    store.setCategory("Coffee");
    store.clearOrder();
  });

  render();
  poll();
})();
