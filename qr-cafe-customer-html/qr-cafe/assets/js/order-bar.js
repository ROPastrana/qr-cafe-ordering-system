/* ==========================================================================
   "Your orders" bar on the menu and cart pages.
   For each order this phone has placed (see Cafe.store.getOrders), shows a row
   "Order #012 · Being prepared   View →" linking to order-status.html?order=012,
   so a customer who left a status page can always return to it (and its receipt).
   Shows the last known statuses at once, then asks track.php once per order.
   Needs an empty <nav id="order-bar" hidden> in the page.
   ========================================================================== */
(function () {
  var box = document.getElementById("order-bar");
  if (!box) return;
  var store = Cafe.store;

  var LABELS = {
    pending:   "Waiting for payment",
    preparing: "Being prepared",
    ready:     "Ready for pickup!",
    completed: "Completed",
    declined:  "Declined"
  };

  /* One row; text goes in with textContent only */
  function row(order) {
    var a = document.createElement("a");
    a.className = "order-bar" + (order.status === "ready" ? " order-bar--ready" : "");
    a.href = "order-status.html?order=" + encodeURIComponent(order.orderNum);

    var text = document.createElement("span");
    text.className = "order-bar__text";
    var title = document.createElement("span");
    title.className = "order-bar__title";
    title.textContent = "Order #" + order.orderNum;
    var status = document.createElement("span");
    status.className = "order-bar__status";
    status.textContent = LABELS[order.status] || LABELS.pending;
    text.append(title, status);

    var action = document.createElement("span");
    action.className = "order-bar__action";
    action.textContent = "View →";

    a.append(text, action);
    return a;
  }

  function show() {
    var orders = store.getOrders();
    box.replaceChildren.apply(box, orders.map(row));
    box.hidden = orders.length === 0;
  }

  function refresh() {
    show();
    store.getOrders().forEach(function (order) {
      if (!order.trackToken) return;   /* mock mode: nothing to ask */
      Cafe.api.trackOrder(order.trackToken)
        .then(function (t) {
          order.status = t.status;
          order.declineReason = t.declineReason;
          order.declineNote = t.declineNote;
          order.receiptToken = t.receiptToken;
          store.setOrder(order);
          show();
        })
        .catch(function (err) {
          /* 404: the order no longer exists on the server, so stop offering it */
          if (err.status === 404) { store.clearOrder(order.orderNum); show(); }
          /* other errors (offline, server busy): keep showing the last known status */
        });
    });
  }

  refresh();
  /* The phone's back button can restore this page from memory exactly as it was
     (before the order was placed) without running scripts again: refresh then too */
  window.addEventListener("pageshow", function (e) { if (e.persisted) refresh(); });
})();
