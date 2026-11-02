/* ==========================================================================
   Order History – search + status filter over completed / declined orders
   ========================================================================== */
(function () {
  if (!Cafe.layout.start("history")) return;

  var ui = Cafe.ui;
  var esc = ui.esc;
  var searchEl = document.getElementById("search");
  var filterEl = document.getElementById("status-filter");
  var rowsEl = document.getElementById("history-rows");

  var FILTERS = [["all", "All Status"], ["completed", "Completed"], ["declined", "Declined"]];
  var history = [];
  var status = "all";

  filterEl.innerHTML = FILTERS.map(function (f) {
    return '<button type="button" class="filter-btn" data-status="' + f[0] + '" aria-pressed="false">' + f[1] + "</button>";
  }).join("");

  function summary(order) {
    var text = order.items.map(function (i) { return (i.qty > 1 ? i.qty + "x " : "") + i.name; }).join(", ");
    return text.length > 50 ? text.slice(0, 50) + "\u2026" : text;
  }

  function render() {
    var q = searchEl.value.trim().toLowerCase();
    filterEl.querySelectorAll("[data-status]").forEach(function (b) { ui.setPressed(b, b.dataset.status === status); });

    var rows = history.filter(function (o) {
      var matchSearch = !q || ("#" + o.id).includes(q) || o.customer.toLowerCase().includes(q) || o.type.toLowerCase().includes(q);
      return matchSearch && (status === "all" || o.status === status);
    });

    rowsEl.innerHTML = rows.length ? rows.map(function (o) {
      var declined = o.status === "declined";
      return "<tr>" +
        '<td data-label="ORDER ID" class="data-table__id">#' + o.id + "</td>" +
        '<td data-label="TIME">' + Cafe.fmtTime(o.createdAt) + "</td>" +
        '<td data-label="TYPE">' + esc(o.type) + "</td>" +
        '<td data-label="ITEMS" class="data-table__items">' + esc(summary(o)) + "</td>" +
        '<td data-label="TOTAL" class="data-table__total">' + Cafe.fmt(o.total) + "</td>" +
        '<td data-label="STATUS">' + ui.statusPill(o.status) + "</td>" +
        '<td data-label="ACTION"><button type="button" class="btn-table' + (declined ? " btn-table--alert" : "") + '" data-id="' + o.id + '">' +
          (declined ? "View Reason" : "Details") + "</button></td></tr>";
    }).join("") : '<tr><td colspan="7" class="data-table__empty">No orders found.</td></tr>';
  }

  searchEl.addEventListener("input", render);
  filterEl.addEventListener("click", function (e) {
    var b = e.target.closest("[data-status]");
    if (b) { status = b.dataset.status; render(); }
  });
  rowsEl.addEventListener("click", function (e) {
    var b = e.target.closest("[data-id]");
    if (!b) return;
    var order = history.find(function (o) { return o.id === Number(b.dataset.id); });
    if (order.status === "declined") Cafe.modals.declineReason(order); else Cafe.modals.orderDetail(order);
  });

  Cafe.api.getOrders().then(function (list) {
    history = list.filter(function (o) { return o.status === "completed" || o.status === "declined"; })
      .sort(function (a, b) { return b.id - a.id; });
    render();
  }).catch(function (err) { ui.toast(err.message || "Could not load orders."); });

  render();
})();
