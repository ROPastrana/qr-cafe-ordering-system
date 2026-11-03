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

  var sortEl = document.getElementById("sort-order");

  var FILTERS = [["all", "All Status"], ["completed", "Completed"], ["declined", "Declined"]];
  var SORTS = [["newest", "Newest"], ["oldest", "Oldest"], ["amount-desc", "Highest ₱"], ["amount-asc", "Lowest ₱"]];
  /* Equal amounts fall back to newest first */
  var COMPARE = {
    "newest":      function (a, b) { return b.createdAt - a.createdAt; },
    "oldest":      function (a, b) { return a.createdAt - b.createdAt; },
    "amount-desc": function (a, b) { return b.total - a.total || b.createdAt - a.createdAt; },
    "amount-asc":  function (a, b) { return a.total - b.total || b.createdAt - a.createdAt; }
  };
  var history = [];
  var status = "all";
  var sort = "newest";

  filterEl.innerHTML = FILTERS.map(function (f) {
    return '<button type="button" class="filter-btn" data-status="' + f[0] + '" aria-pressed="false">' + f[1] + "</button>";
  }).join("");
  sortEl.innerHTML = SORTS.map(function (s) {
    return '<button type="button" class="filter-btn" data-sort="' + s[0] + '" aria-pressed="false">' + s[1] + "</button>";
  }).join("");

  function summary(order) {
    var text = order.items.map(function (i) { return (i.qty > 1 ? i.qty + "x " : "") + i.name; }).join(", ");
    return text.length > 50 ? text.slice(0, 50) + "\u2026" : text;
  }

  function render() {
    var q = searchEl.value.trim().toLowerCase();
    filterEl.querySelectorAll("[data-status]").forEach(function (b) { ui.setPressed(b, b.dataset.status === status); });
    sortEl.querySelectorAll("[data-sort]").forEach(function (b) { ui.setPressed(b, b.dataset.sort === sort); });

    var rows = history.filter(function (o) {
      var matchSearch = !q || Cafe.orderNo(o).toLowerCase().includes(q) || o.customer.toLowerCase().includes(q) || o.type.toLowerCase().includes(q);
      return matchSearch && (status === "all" || o.status === status);
    }).sort(COMPARE[sort]);

    rowsEl.innerHTML = rows.length ? rows.map(function (o) {
      var declined = o.status === "declined";
      return "<tr>" +
        '<td data-label="ORDER ID" class="data-table__id">' + esc(Cafe.orderNo(o)) + "</td>" +
        '<td data-label="DATE &amp; TIME">' + Cafe.fmtDate(o.createdAt) + " · " + Cafe.fmtTime(o.createdAt) + "</td>" +
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
  sortEl.addEventListener("click", function (e) {
    var b = e.target.closest("[data-sort]");
    if (b) { sort = b.dataset.sort; render(); }
  });
  rowsEl.addEventListener("click", function (e) {
    var b = e.target.closest("[data-id]");
    if (!b) return;
    var order = history.find(function (o) { return o.id === Number(b.dataset.id); });
    if (order.status === "declined") Cafe.modals.declineReason(order); else Cafe.modals.orderDetail(order);
  });

  /* Completed and declined orders from the last 30 days (render() sorts them) */
  var today = new Date();
  var from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29);
  Cafe.api.getHistory(Cafe.toDateInput(from), Cafe.toDateInput(today), "finished").then(function (list) {
    history = list;
    render();
  }).catch(function (err) { ui.toast(err.message || "Could not load orders."); });

  render();
})();
