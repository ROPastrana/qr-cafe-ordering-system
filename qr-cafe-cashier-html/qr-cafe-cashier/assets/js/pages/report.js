/* ==========================================================================
   Sales & Performance – revenue, category split, top items, CSV export
   Only completed orders inside the selected date range are counted.
   ========================================================================== */
(function () {
  if (!Cafe.layout.start("report")) return;

  var ui = Cafe.ui;
  var esc = ui.esc;
  var fmt = Cafe.fmt;

  var startEl = document.getElementById("start-date");
  var endEl = document.getElementById("end-date");
  var statsEl = document.getElementById("report-stats");
  var barsEl = document.getElementById("category-bars");
  var topEl = document.getElementById("top-items");
  var exportToggle = document.getElementById("export-toggle");
  var exportMenu = document.getElementById("export-menu");

  var today = new Date();
  startEl.value = Cafe.toDateInput(new Date(today.getFullYear(), today.getMonth(), 1));
  endEl.value = Cafe.toDateInput(today);

  var orders = [];
  var inRange = [];

  function categoryOf(itemName) {
    var m = Cafe.MENU_ITEMS.find(function (x) { return x.name === itemName; });
    return m ? m.category : "Other";
  }

  function render() {
    inRange = orders.filter(function (o) {
      if (o.status !== "completed") return false;
      var d = Cafe.toDateInput(o.createdAt);
      return d >= startEl.value && d <= endEl.value;
    });

    var revenue = inRange.reduce(function (s, o) { return s + o.total; }, 0);
    var count = inRange.length;
    var avg = count ? revenue / count : 0;

    var catRevenue = {}, itemRevenue = {};
    inRange.forEach(function (o) {
      o.items.forEach(function (i) {
        var cat = categoryOf(i.name), amount = i.unitPrice * i.qty;
        catRevenue[cat] = (catRevenue[cat] || 0) + amount;
        itemRevenue[i.name] = itemRevenue[i.name] || { units: 0, revenue: 0 };
        itemRevenue[i.name].units += i.qty;
        itemRevenue[i.name].revenue += amount;
      });
    });

    var totalCat = Object.keys(catRevenue).reduce(function (s, k) { return s + catRevenue[k]; }, 0) || 1;
    var topCat = Object.keys(catRevenue).sort(function (a, b) { return catRevenue[b] - catRevenue[a]; })[0] || "\u2014";
    var topCatPct = Math.round(((catRevenue[topCat] || 0) / totalCat) * 100);

    function stat(label, value, sub, mod) {
      return '<div class="stat-card"><p class="stat-card__label">' + label + '</p><p class="stat-card__value' + (mod || "") + '">' + esc(value) +
        '</p><p class="stat-card__sub">' + esc(sub) + "</p></div>";
    }
    statsEl.innerHTML =
      stat("Total Revenue", fmt(revenue), count + " orders in period", " stat-card__value--accent") +
      stat("Transactions", count + " Orders", "Completed orders only") +
      stat("Average Ticket", fmt(avg), "Revenue ÷ orders") +
      stat("Top Product Category", topCat, topCatPct + "% of overall sales", " stat-card__value--green stat-card__value--lg");

    var FILL = { "Non-Coffee": " bar__fill--non-coffee", Pastries: " bar__fill--pastries" };
    barsEl.innerHTML = Cafe.CATEGORIES.map(function (cat) {
      var rev = catRevenue[cat] || 0;
      var pct = Math.round((rev / totalCat) * 100);
      return '<div class="bar-row"><div class="bar-row__head"><span class="bar-row__label">' + esc(cat) + " (" + pct + '%)</span>' +
        '<span class="bar-row__value">' + fmt(rev) + "</span></div>" +
        '<div class="bar"><div class="bar__fill' + (FILL[cat] || "") + '" data-pct="' + pct + '"></div></div></div>';
    }).join("");
    /* Widths are set from script, not with style="" in the HTML: the Content-Security-Policy
       blocks inline style attributes, but allows styles set through element.style */
    barsEl.querySelectorAll("[data-pct]").forEach(function (fill) { fill.style.width = fill.dataset.pct + "%"; });

    var top = Object.keys(itemRevenue).map(function (n) { return [n, itemRevenue[n]]; })
      .sort(function (a, b) { return b[1].revenue - a[1].revenue; }).slice(0, 6);
    topEl.innerHTML =
      '<div class="top-items__row top-items__row--head"><span class="top-items__head">ITEM NAME</span><span class="top-items__head">UNITS SOLD</span><span class="top-items__head">REVENUE</span></div>' +
      (top.length ? top.map(function (t) {
        return '<div class="top-items__row"><span class="top-items__name">' + esc(t[0]) + '</span><span class="top-items__units">' + t[1].units +
          ' units</span><span class="top-items__revenue">' + fmt(t[1].revenue) + "</span></div>";
      }).join("") : '<p class="top-items__empty">No data in selected range.</p>');
  }

  /* ---- CSV export ---- */
  function csvCell(value) {
    var s = String(value == null ? "" : value);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;                 /* block spreadsheet formula injection */
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function exportData() {
    var rows = [["Order ID", "Date", "Customer", "Type", "Items", "Total", "Payment"]].concat(
      inRange.map(function (o) {
        return [Cafe.orderNo(o), Cafe.toDateInput(o.createdAt), o.customer, o.type,
          o.items.map(function (i) { return i.qty + "x " + i.name; }).join("; "), o.total.toFixed(2), o.paymentMethod || ""];
      }));
    var csv = "\uFEFF" + rows.map(function (r) { return r.map(csvCell).join(","); }).join("\r\n");
    var url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    var a = document.createElement("a");
    a.href = url;
    a.download = "sales-report-" + startEl.value + "-to-" + endEl.value + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function setMenu(open) {
    exportMenu.hidden = !open;
    exportToggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  exportToggle.addEventListener("click", function (e) { e.stopPropagation(); setMenu(exportMenu.hidden); });
  exportMenu.addEventListener("click", function (e) { if (e.target.closest("[data-export]")) { exportData(); setMenu(false); } });
  document.addEventListener("click", function () { setMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

  /* Completed orders in the chosen range come from history.php */
  function load() {
    if (!startEl.value || !endEl.value || startEl.value > endEl.value) { orders = []; render(); return; }
    Cafe.api.getHistory(startEl.value, endEl.value, "completed")
      .then(function (list) { orders = list; render(); })
      .catch(function (err) { ui.toast(err.message || "Could not load orders."); });
  }

  startEl.addEventListener("change", load);
  endEl.addEventListener("change", load);

  /* The menu is needed first: it tells which category each item name belongs to */
  render();
  Cafe.api.getMenu()
    .catch(function (err) { ui.toast(err.message || "Could not load the menu."); })
    .then(load);
})();
