/* ==========================================================================
   "Your order" bar on the menu and cart pages.
   While this phone has a placed order (see Cafe.store.getOrder), shows
   "Order #012 · Preparing   View →" linking back to order-status.html, so a
   customer who left the status page can always return to it (and its receipt).
   Shows the last known status at once, then asks track.php once for the latest.
   Needs an element <a id="order-bar" hidden> with the parts filled in below.
   ========================================================================== */
(function () {
  var bar = document.getElementById("order-bar");
  if (!bar) return;
  var store = Cafe.store;

  var LABELS = {
    pending:   "Waiting for payment",
    preparing: "Being prepared",
    ready:     "Ready for pickup!",
    completed: "Completed",
    declined:  "Declined"
  };

  function show(order) {
    bar.querySelector("[data-order-title]").textContent = "Order #" + order.orderNum;
    bar.querySelector("[data-order-status]").textContent = LABELS[order.status] || LABELS.pending;
    bar.classList.toggle("order-bar--ready", order.status === "ready");
    bar.hidden = false;
  }

  function refresh() {
    var order = store.getOrder();
    if (!order) { bar.hidden = true; return; }
    show(order);

    if (!order.trackToken) return;   /* mock mode: nothing to ask */
    Cafe.api.trackOrder(order.trackToken)
      .then(function (t) {
        order.status = t.status;
        order.declineReason = t.declineReason;
        order.declineNote = t.declineNote;
        order.receiptToken = t.receiptToken;
        store.setOrder(order);
        show(order);
      })
      .catch(function (err) {
        /* 404: the order no longer exists on the server, so stop offering it */
        if (err.status === 404) { store.clearOrder(); bar.hidden = true; }
        /* other errors (offline, server busy): keep showing the last known status */
      });
  }

  refresh();
  /* The phone's back button can restore this page from memory exactly as it was
     (before the order was placed) without running scripts again: refresh then too */
  window.addEventListener("pageshow", function (e) { if (e.persisted) refresh(); });
})();
