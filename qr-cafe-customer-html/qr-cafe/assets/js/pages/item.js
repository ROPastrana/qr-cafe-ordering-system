/* ==========================================================================
   Item detail page – size / sugar / serve options, quantity, add to cart
   URL: item.html?id=<item_id>
   ========================================================================== */
(function () {
  var ui = Cafe.ui;
  var store = Cafe.store;
  var D = Cafe.DEFAULTS;

  var el = {
    image: document.getElementById("item-image"),
    name: document.getElementById("item-name"),
    price: document.getElementById("item-price"),
    desc: document.getElementById("item-desc"),
    options: document.getElementById("item-options"),
    stepper: document.getElementById("qty-stepper"),
    subtotal: document.getElementById("item-subtotal"),
    add: document.getElementById("add-to-cart")
  };

  var item = null;
  var state = { size: D.size, sugar: D.sugar, serve: D.serve, qty: D.qty };
  var qtyEl = null;

  function pill(group, value, modifier) {
    return (
      '<button type="button" class="pill' + (modifier ? " " + modifier : "") + '" ' +
      'data-option="' + group + '" data-value="' + ui.escapeHtml(value) + '" aria-pressed="false">' +
      ui.escapeHtml(value) + "</button>"
    );
  }

  function optionGroup(title, pillsHtml, tight) {
    return (
      '<div class="option-group">' +
        '<p class="option-group__title">' + title + "</p>" +
        '<div class="option-pills' + (tight ? " option-pills--tight" : "") + '">' + pillsHtml + "</div>" +
      "</div>"
    );
  }

  function buildOptions() {
    var html = "";
    if (item.hasSize) {
      html += optionGroup("Size",
        Cafe.SIZES.map(function (v) { return pill("size", v); }).join(""));
    }
    if (item.hasSugar) {
      html += optionGroup("Sugar Level",
        Cafe.SUGAR_LEVELS.map(function (v) { return pill("sugar", v); }).join(""), true);
    }
    if (item.hasServe) {
      html += optionGroup("Serve",
        Cafe.SERVE_OPTIONS.map(function (v) { return pill("serve", v, "pill--serve"); }).join(""));
    } else if (item.fixedTemp) {
      /* Hot-only / iced-only drink: show it, but there is nothing to choose */
      html += optionGroup("Serve",
        '<span class="pill pill--serve" aria-pressed="true">' + ui.escapeHtml(item.fixedTemp) + " only</span>");
    }
    el.options.innerHTML = html;
  }

  /* Update everything that depends on state without rebuilding the DOM. */
  function sync() {
    var unit = Cafe.itemPrice(item, state.size);
    el.price.textContent = Cafe.fmtPrice(unit);
    el.subtotal.textContent = Cafe.fmtPrice(unit * state.qty);
    qtyEl.textContent = state.qty;

    el.options.querySelectorAll("[data-option]").forEach(function (btn) {
      ui.setPressed(btn, state[btn.dataset.option] === btn.dataset.value);
    });
  }

  function init(found) {
    item = found;
    document.title = item.name + " | QR Cafe";
    el.image.src = item.image;
    el.image.alt = item.name;
    el.name.textContent = item.name;
    el.desc.textContent = item.description;

    buildOptions();
    el.stepper.innerHTML = ui.stepperHtml(state.qty, false);
    qtyEl = el.stepper.querySelector("[data-qty]");
    sync();
  }

  /* ---- Events ---- */
  el.options.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-option]");
    if (!btn) return;
    state[btn.dataset.option] = btn.dataset.value;
    sync();
  });

  el.stepper.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-step]");
    if (!btn) return;
    state.qty = Math.max(1, state.qty + (btn.dataset.step === "inc" ? 1 : -1));
    sync();
  });

  el.add.addEventListener("click", function () {
    if (!item) return;
    store.addToCart({
      itemId: item.id,
      size: state.size,
      sugarLevel: state.sugar,
      serve: state.serve,
      qty: state.qty
    });
    window.location.href = "menu.html";
  });

  /* ---- Init ---- */
  var id = Number(new URLSearchParams(window.location.search).get("id"));

  Cafe.api.getMenu()
    .then(function (menu) {
      var found = menu.find(function (m) { return m.id === id; });
      if (!found) { window.location.replace("menu.html"); return; }
      init(found);
    })
    .catch(function () {
      el.name.textContent = "We couldn\u2019t load this item.";
      el.desc.textContent = "Go back to the menu and try again.";
      el.add.disabled = true;
    });
})();
