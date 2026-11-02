/* ==========================================================================
   Menu page – category tabs, item cards, cart counter
   ========================================================================== */
(function () {
  var ui = Cafe.ui;
  var store = Cafe.store;

  var tabsEl = document.getElementById("category-tabs");
  var scrollEl = document.getElementById("menu-scroll");
  var countEl = document.getElementById("cart-count");

  var menu = [];
  var active = store.getCategory();

  /* ---- Tabs (built once, toggled in place) ---- */
  function buildTabs() {
    tabsEl.innerHTML = Cafe.CATEGORIES.map(function (cat) {
      return (
        '<button type="button" role="tab" data-category="' + ui.escapeHtml(cat) + '" ' +
        'class="tab">' +
        ui.escapeHtml(cat) + "</button>"
      );
    }).join("");
    syncTabs();
  }

  function syncTabs() {
    tabsEl.querySelectorAll("[data-category]").forEach(function (btn) {
      ui.setSelected(btn, btn.dataset.category === active);
    });
  }

  /* ---- Cards ---- */
  function cardHtml(item) {
    return (
      '<article data-item-id="' + item.id + '" role="link" tabindex="0" aria-label="Customize ' + ui.escapeHtml(item.name) + '" ' +
        'class="menu-card">' +
        '<img class="menu-card__img" src="' + ui.escapeHtml(item.image) + '" alt="" loading="lazy">' +
        '<div class="menu-card__body">' +
          "<div>" +
            '<p class="menu-card__name">' + ui.escapeHtml(item.name) + "</p>" +
            '<p class="menu-card__desc">' + ui.escapeHtml(item.description) + "</p>" +
          "</div>" +
          '<div class="menu-card__footer">' +
            '<span class="price">' + Cafe.fmtPrice(item.price) + "</span>" +
            '<button type="button" class="btn-add" tabindex="-1" aria-hidden="true">+ Add</button>' +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function sectionHtml(title, items, first) {
    if (!items.length) return "";
    return (
      '<h2 class="section-title mb-3 ' + (first ? "mt-1" : "mt-5") + '">' + ui.escapeHtml(title) + "</h2>" +
      '<div class="menu-card-grid">' + items.map(cardHtml).join("") + "</div>"
    );
  }

  function renderItems() {
    var inCategory = menu.filter(function (m) { return m.category === active; });
    var popular = inCategory.filter(function (m) { return m.popular; });
    var rest = inCategory.filter(function (m) { return !m.popular; });

    if (!inCategory.length) {
      scrollEl.innerHTML = '<p class="message">Nothing available in this category right now.</p>';
      return;
    }
    scrollEl.innerHTML =
      sectionHtml("Popular Choices", popular, true) +
      sectionHtml(Cafe.SECTION_LABEL[active] || active, rest, popular.length === 0);
    scrollEl.scrollTop = 0;
  }

  function updateCount() { countEl.textContent = store.cartCount(); }

  function openItem(id) { window.location.href = "item.html?id=" + encodeURIComponent(id); }

  /* ---- Events ---- */
  tabsEl.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-category]");
    if (!btn) return;
    active = btn.dataset.category;
    store.setCategory(active);
    syncTabs();
    renderItems();
  });

  scrollEl.addEventListener("click", function (e) {
    var card = e.target.closest("[data-item-id]");
    if (card) openItem(card.dataset.itemId);
  });

  scrollEl.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var card = e.target.closest("[data-item-id]");
    if (card && e.target === card) { e.preventDefault(); openItem(card.dataset.itemId); }
  });

  /* Back/forward cache: refresh the counter when returning to this page. */
  window.addEventListener("pageshow", updateCount);

  /* ---- Init ---- */
  buildTabs();
  updateCount();

  Cafe.api.getMenu()
    .then(function (items) { menu = items; renderItems(); })
    .catch(function () {
      scrollEl.innerHTML =
        '<div class="message">' +
          '<p class="message__title">We couldn\u2019t load the menu.</p>' +
          '<p class="message__text">Check your connection and try again.</p>' +
          '<button type="button" class="message__action" onclick="location.reload()">Reload menu</button>' +
        "</div>";
    });
})();
