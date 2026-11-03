/* ==========================================================================
   Live Orders Queue – five status columns with per-card actions
   ========================================================================== */
(function () {
  if (!Cafe.layout.start("queue")) return;

  var ui = Cafe.ui;
  var esc = ui.esc;
  var grid = document.getElementById("queue-grid");
  var orders = [];

  var COLUMNS = [
    { status: "new",       label: "New",       badge: "badge--new" },
    { status: "preparing", label: "Preparing", badge: "badge--preparing" },
    { status: "ready",     label: "Ready",     badge: "badge--ready" },
    { status: "completed", label: "Completed", badge: "badge--done" },
    { status: "declined",  label: "Declined",  badge: "badge--off" }
  ];

  function countLabel(status, n) {
    if (status === "completed" || status === "declined") return n + " Today";
    return n === 1 ? "1 Order" : n + " Orders";
  }

  function actionsHtml(o) {
    var id = ' data-id="' + o.id + '"';
    if (o.status === "new") {
      return '<div class="order-card__actions">' +
        '<button type="button" class="btn btn--sm btn--primary" data-action="accept"' + id + ">Accept</button>" +
        '<button type="button" class="btn btn--sm btn--outline-strong" data-action="decline"' + id + ">Decline</button></div>";
    }
    if (o.status === "preparing") {
      return '<button type="button" class="btn btn--sm btn--info btn--block" data-action="ready"' + id + ">Mark Ready</button>";
    }
    if (o.status === "ready") {
      /* Payment is already settled at Accept, so completing is one tap. */
      return '<button type="button" class="btn btn--sm btn--success btn--block" data-action="complete"' + id + ">Complete Order</button>";
    }
    if (o.status === "completed") {
      return '<button type="button" class="btn btn--sm btn--outline btn--block" data-action="receipt"' + id + ">View Receipt</button>";
    }
    return "";
  }

  function cardHtml(o) {
    var open = o.status !== "completed" && o.status !== "declined";
    var items = o.items.slice(0, 3).map(function (i) {
      return '<p class="order-card__item">' + i.qty + "x " + esc(i.name) + (i.variant ? " (" + esc(i.variant) + ")" : "") + "</p>";
    }).join("");
    if (o.items.length > 3) items += '<p class="order-card__item order-card__item--more">+' + (o.items.length - 3) + " more</p>";

    return '<article class="order-card' + (o.status === "ready" ? " order-card--ready" : "") + '">' +
      '<div class="order-card__head"><span class="order-card__id">' + esc(Cafe.orderNo(o)) + "</span>" + ui.typeBadge(o.type) +
        (o.status === "declined" ? '<span class="badge badge--declined">Declined</span>' : "") +
        '<span class="order-card__customer">' + esc(o.customer) + "</span></div>" +
      '<div class="order-card__items">' + items + "</div>" +
      (o.status === "declined" && o.declineReason ? '<p class="order-card__reason">Reason: ' + esc(o.declineReason) + "</p>" : "") +
      '<div class="order-card__foot' + (open ? " order-card__foot--spaced" : "") + '">' +
        '<span class="order-card__total">' + Cafe.fmt(o.subtotal) + "</span>" +
        '<span class="order-card__time">' + Cafe.timeAgo(o.createdAt) + "</span></div>" +
      actionsHtml(o) + "</article>";
  }

  function render() {
    grid.innerHTML = COLUMNS.map(function (col) {
      var list = orders.filter(function (o) { return o.status === col.status; });
      return "<section>" +
        '<div class="queue-col__head"><span class="queue-col__dot queue-col__dot--' + col.status + '"></span>' +
          '<h2 class="queue-col__title">' + col.label + "</h2>" +
          '<span class="badge queue-col__count ' + col.badge + '">' + countLabel(col.status, list.length) + "</span></div>" +
        '<div class="queue-col__list">' + list.map(cardHtml).join("") + "</div></section>";
    }).join("");
  }

  function load() {
    return Cafe.api.getOrders()
      .then(function (list) { orders = list; render(); })
      .catch(function (err) { ui.toast(err.message || "Could not load orders."); });
  }

  /* On a conflict (another cashier got there first) the reload shows the real state. */
  function setStatus(id, status, reason, note) {
    return Cafe.api.setStatus(id, status, reason, note)
      .catch(function (err) { ui.toast(err.message); })
      .then(load);
  }

  grid.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-action]");
    if (!btn) return;
    var id = Number(btn.dataset.id);
    var order = orders.find(function (o) { return o.id === id; });

    switch (btn.dataset.action) {
      case "accept":   /* review + settle payment first */
        window.location.href = "workspace.html?id=" + id; break;
      case "ready":
        setStatus(id, "ready"); break;
      case "complete":
        setStatus(id, "completed"); break;
      case "decline":
        Cafe.modals.decline(Cafe.orderNo(order), function (reason, note) {
          setStatus(id, "declined", reason, note);
        });
        break;
      case "receipt":
        Cafe.modals.orderDetail(order); break;
    }
  });

  load();
  setInterval(load, Cafe.config.QUEUE_REFRESH_MS);
})();
