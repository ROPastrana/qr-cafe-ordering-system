/* ==========================================================================
   Walk-In & Manual Ordering – browse the menu, customize items, build a cart,
   then continue to checkout. Cart / name / fulfillment persist across pages.
   ========================================================================== */
(function () {
  if (!Cafe.layout.start("manual")) return;

  var ui = Cafe.ui;
  var store = Cafe.store;
  var esc = ui.esc;
  var fmt = Cafe.fmt;

  var tabsEl = document.getElementById("category-tabs");
  var gridEl = document.getElementById("menu-grid");
  var rowsEl = document.getElementById("cart-rows");
  var footEl = document.getElementById("cart-foot");
  var nameEl = document.getElementById("customer-name");
  var fulfillmentEl = document.getElementById("fulfillment");
  var badgeEl = document.getElementById("fulfillment-badge");

  var menu = [];
  var category = "Coffee";
  var discountType = null;
  var form = store.getForm();
  var lastAddedKey = null;

  /* ---- Static controls ---- */
  tabsEl.innerHTML = Cafe.CATEGORIES.map(function (c) {
    return '<button type="button" class="chip chip--tab" data-category="' + esc(c) + '" aria-pressed="false">' + esc(c) + "</button>";
  }).join("");

  fulfillmentEl.innerHTML = Cafe.FULFILLMENT.map(function (f) {
    return '<button type="button" class="segmented__btn" data-fulfillment="' + esc(f) + '" aria-pressed="false">' + esc(f) + "</button>";
  }).join("");

  nameEl.value = form.customerName;

  function renderControls() {
    tabsEl.querySelectorAll("[data-category]").forEach(function (b) { ui.setPressed(b, b.dataset.category === category); });
    fulfillmentEl.querySelectorAll("[data-fulfillment]").forEach(function (b) { ui.setPressed(b, b.dataset.fulfillment === form.fulfillment); });
    badgeEl.innerHTML = ui.typeBadge(form.fulfillment);
  }

  /* ---- Menu grid ---- */
  function qtyInCart(itemId) {
    return store.getCart().filter(function (e) { return e.itemId === itemId; })
      .reduce(function (s, e) { return s + e.qty; }, 0);
  }

  function renderGrid() {
    gridEl.innerHTML = menu.filter(function (m) { return m.category === category; }).map(function (item) {
      var n = qtyInCart(item.id);
      return '<article class="menu-card' + (n > 0 ? " menu-card--selected" : "") + '" role="button" tabindex="0" data-id="' + item.id + '" aria-label="Customize ' + esc(item.name) + '">' +
        '<div class="menu-card__media"><img class="menu-card__img" src="' + esc(item.image) + '" alt="" loading="lazy">' +
          (n > 0 ? '<span class="menu-card__count">' + n + "</span>" : "") + "</div>" +
        '<div class="menu-card__body"><p class="menu-card__name">' + esc(item.name) + "</p>" +
          '<p class="menu-card__desc">' + esc(item.description) + "</p>" +
          '<div class="menu-card__foot"><span class="menu-card__price">' + fmt(item.price) + '</span><span class="menu-card__add">+ Add</span></div></div>' +
      "</article>";
    }).join("");
  }

  /* ---- Cart ---- */
  function cartLines() {
    return store.getCart().map(function (e) { return { entry: e, item: Cafe.menuById(e.itemId) }; })
      .filter(function (l) { return l.item; });
  }

  function renderCart() {
    var lines = cartLines();

    rowsEl.innerHTML = lines.length ? lines.map(function (l) {
      var e = l.entry;
      var variant = l.item.isDrink ? Cafe.buildVariant(e.size, e.sugarLevel, e.temp) : "";
      return '<div class="cart-row' + (e.cartKey === lastAddedKey ? " cart-row--enter" : "") + '">' +
        '<div class="cart-row__head"><span class="cart-row__name">' + esc(l.item.name) + "</span>" +
          '<span class="cart-row__price">' + fmt(e.effectivePrice * e.qty) + "</span></div>" +
        (variant ? '<p class="cart-row__variant">' + esc(variant) + "</p>" : "") +
        '<div class="qty">' +
          '<button type="button" class="qty__btn" data-key="' + esc(e.cartKey) + '" data-step="-1" aria-label="Decrease quantity">\u2212</button>' +
          '<span class="qty__value">' + e.qty + "</span>" +
          '<button type="button" class="qty__btn qty__btn--inc" data-key="' + esc(e.cartKey) + '" data-step="1" aria-label="Increase quantity">+</button>' +
        "</div></div>";
    }).join("") : '<p class="empty-text">No items added yet.</p>';

    var subtotal = lines.reduce(function (s, l) { return s + l.entry.effectivePrice * l.entry.qty; }, 0);
    var discount = discountType ? Cafe.discountAmount(subtotal, discountType) : 0;

    footEl.innerHTML = ui.discountToggle(discountType) +
      '<div class="totals totals--sm">' +
        (discount > 0
          ? '<div class="totals__row"><span>Subtotal</span><span>' + fmt(subtotal) + "</span></div>" +
            '<div class="totals__row totals__row--discount"><span>' + esc(discountType) + " (\u221220%)</span><span class=\"totals__value\">\u2212" + fmt(discount) + "</span></div>"
          : "") +
        '<div class="totals__final"><span class="totals__label">Order Total</span><span class="totals__amount">' + fmt(subtotal - discount) + "</span></div>" +
      "</div>" +
      '<button type="button" class="btn btn--primary btn--block" data-action="pay"' + (lines.length ? "" : " disabled") + ">Pay &amp; Send to Kitchen</button>";
  }

  function renderAll() { renderControls(); renderGrid(); renderCart(); }

  /* ---- Events ---- */
  tabsEl.addEventListener("click", function (e) {
    var b = e.target.closest("[data-category]");
    if (b) { category = b.dataset.category; renderControls(); renderGrid(); }
  });

  fulfillmentEl.addEventListener("click", function (e) {
    var b = e.target.closest("[data-fulfillment]");
    if (!b) return;
    form.fulfillment = b.dataset.fulfillment;
    store.setForm(form);
    renderControls();
  });

  nameEl.addEventListener("input", function () {
    form.customerName = nameEl.value;
    store.setForm(form);
  });

  function openItem(card) {
    var item = Cafe.menuById(card.dataset.id);
    if (!item) return;
    Cafe.modals.customize(item, function (entry) {
      store.addToCart(entry);
      lastAddedKey = entry.cartKey;
      renderGrid();
      renderCart();
    });
  }
  gridEl.addEventListener("click", function (e) {
    var card = e.target.closest("[data-id]");
    if (card) openItem(card);
  });
  gridEl.addEventListener("keydown", function (e) {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches("[data-id]")) { e.preventDefault(); openItem(e.target); }
  });

  rowsEl.addEventListener("click", function (e) {
    var b = e.target.closest("[data-step]");
    if (!b) return;
    lastAddedKey = null;
    store.changeCartQty(b.dataset.key, Number(b.dataset.step));
    renderGrid();
    renderCart();
  });

  footEl.addEventListener("click", function (e) {
    var d = e.target.closest("[data-discount]");
    if (d) {
      discountType = discountType === d.dataset.discount ? null : d.dataset.discount;
      renderCart();
      return;
    }
    if (!e.target.closest("[data-action='pay']")) return;

    var lines = cartLines();
    if (!lines.length) return;
    /* No id yet: walkin.php assigns the order number when the payment is saved. */
    var draft = Cafe.buildOrder(form.customerName.trim() || "Walk-in", form.fulfillment,
      lines.map(function (l) { return l.entry; }), discountType);
    store.setCheckout(draft);
    window.location.href = "checkout.html";
  });

  /* ---- Init ---- */
  Cafe.api.getMenu()
    .then(function (items) { menu = items; renderAll(); })
    .catch(function (err) { ui.toast(err.message || "Could not load the menu."); });
  renderControls();
  renderCart();
})();
