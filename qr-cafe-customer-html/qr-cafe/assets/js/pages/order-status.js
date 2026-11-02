/* ==========================================================================
   Order status page – "Order Received!" or "Order Declined"
   Reads the order saved by cart.js. No order in session -> back to menu.
   ========================================================================== */
(function () {
  var ui = Cafe.ui;
  var store = Cafe.store;
  var order = store.getOrder();

  if (!order) {
    window.location.replace("menu.html");
    return;
  }

  var $ = function (id) { return document.getElementById(id); };
  var declined = order.status === "declined";

  document.title = (declined ? "Order Declined" : "Order Received") + " | QR Cafe";

  $("order-type-badge").textContent = order.orderType;
  $("status-title").textContent = declined ? "Order Declined" : "Order Received!";
  $("status-subtitle").textContent = declined ? "Order not fulfilled" : order.orderType + " \u2022 Cafe Order";

  $("status-icon").classList.add(declined ? "status-icon--danger" : "status-icon--success");
  $("icon-check").hidden = declined;
  $("icon-x").hidden = !declined;

  $("order-number").textContent = "#" + order.orderNum;
  $("customer-name").textContent = order.name;
  $("order-type").textContent = order.orderType;

  $("card-received").hidden = declined;
  $("card-declined").hidden = !declined;

  $("summary-items").innerHTML = order.items.map(function (i) {
    return (
      '<div class="summary-row">' +
        "<span>" + Number(i.qty) + "x " + ui.escapeHtml(i.name) + "</span>" +
        "<span>" + Cafe.fmtPrice(i.lineTotal) + "</span>" +
      "</div>"
    );
  }).join("");

  $("total-label").textContent = declined ? "Order Total (Not Charged)" : "Total to Pay";
  $("order-total").textContent = Cafe.fmtCalc(order.total);

  /* "Back to Menu" resets to the Coffee tab and forgets this order. */
  $("back-to-menu").addEventListener("click", function () {
    store.setCategory("Coffee");
    store.clearOrder();
  });
})();
