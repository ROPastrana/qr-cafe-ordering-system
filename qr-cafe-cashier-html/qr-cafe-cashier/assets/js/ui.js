/* ==========================================================================
   QR Cafe Cashier – Shared UI helpers (escaping, icons, badges, QR graphic)
   ========================================================================== */
window.Cafe = window.Cafe || {};

Cafe.ui = (function () {
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function setPressed(el, on) { el.setAttribute("aria-pressed", on ? "true" : "false"); }

  /* ---- Icons (stroke icons; size comes from the parent component) ---- */
  function svg(inner, extra) {
    return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + ((extra && extra.w) || 2) +
      '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + "</svg>";
  }
  var icons = {
    queue: svg('<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>'),
    plus: svg('<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>'),
    history: svg('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
    chart: svg('<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>'),
    logout: svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>'),
    x: svg('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>', { w: 2.5 }),
    coffee: '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>' +
      '<line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>'
  };

  /* ---- Badges ---- */
  function typeBadge(type) {
    return '<span class="badge ' + (type === "Dine In" ? "badge--dine-in" : "badge--take-out") + '">' + esc(type) + "</span>";
  }

  var STATUS_LABEL = { "new": "New", preparing: "Preparing", ready: "Ready", completed: "Paid", declined: "Declined" };
  function statusPill(status) {
    var s = STATUS_LABEL[status] ? status : "new";
    return '<span class="badge badge--status badge--' + s + '">' + STATUS_LABEL[s] + "</span>";
  }

  /* ---- Decorative QR graphic (placeholder for the real GCash QR image) ---- */
  function qrCode(size) {
    function rect(x, y, w, h, rx, fill) {
      return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + rx + '" fill="' + fill + '"/>';
    }
    function finder(x, y) {
      return rect(x, y, 70, 70, 8, "#1C1C1C") + rect(x + 10, y + 10, 50, 50, 4, "white") + rect(x + 18, y + 18, 34, 34, 2, "#1C1C1C");
    }
    var out = '<svg width="' + size + '" height="' + size + '" viewBox="0 0 200 200" fill="none" role="img" aria-label="GCash QR code">' +
      finder(10, 10) + finder(120, 10) + finder(10, 120);
    function dot(x, y) { out += rect(x, y, 8, 8, 1, "#1C1C1C"); }
    [90, 100, 110, 90, 100, 110].forEach(function (x, i) {
      [10, 20, 30, 40, 50, 60].forEach(function (y, j) { if ((x + y + i + j) % 18 < 9) dot(x, y); });
    });
    [10, 20, 30, 40, 50, 60].forEach(function (x, i) {
      [90, 100, 110, 120, 130, 140].forEach(function (y, j) { if ((x + y + i + j) % 20 < 10) dot(x, y); });
    });
    var grid = [90, 100, 110, 120, 130, 140, 150, 160, 170, 180];
    grid.forEach(function (x, i) { grid.forEach(function (y, j) { if ((i * 3 + j * 7) % 10 < 5) dot(x, y); }); });
    return out + "</svg>";
  }

  /* ---- Discount toggle (PWD / Senior Citizen / Student). Buttons carry data-discount. ---- */
  function discountToggle(value) {
    return '<div class="discount"><div class="discount__head"><span class="discount__title">Discount</span>' +
      (value ? '<span class="discount__applied">\u221220% applied</span>' : "") + "</div>" +
      '<div class="discount__options" role="group" aria-label="Discount type">' +
      Cafe.DISCOUNT_TYPES.map(function (t) {
        return '<button type="button" class="discount__btn" data-discount="' + esc(t) + '" aria-pressed="' + (value === t) + '">' + esc(t) + "</button>";
      }).join("") + "</div></div>";
  }

  /* ---- ID number a discount is recorded with. Saved by the server, never shown on a receipt. ---- */
  function discountIdField(value) {
    return '<div class="field"><label class="field__label" for="discount-id">Discount ID Number</label>' +
      '<input id="discount-id" class="field__input" type="text" maxlength="30" autocomplete="off" placeholder="PWD, Senior Citizen or Student ID" value="' + esc(value) + '"></div>';
  }

  /* ---- Error / info toast ---- */
  function toast(message) {
    var el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "alert");
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 4500);
  }

  return {
    esc: esc, setPressed: setPressed, icons: icons, typeBadge: typeBadge, statusPill: statusPill,
    qrCode: qrCode, discountToggle: discountToggle, discountIdField: discountIdField, toast: toast
  };
})();
