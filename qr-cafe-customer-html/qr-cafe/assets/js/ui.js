/* ==========================================================================
   QR Cafe – Small shared UI helpers
   ========================================================================== */
window.Cafe = window.Cafe || {};

Cafe.ui = (function () {
  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* Visual state is driven by CSS attribute selectors (see input.css):
       .pill[aria-pressed="true"]   .tab[aria-selected="true"]            */
  function setPressed(el, on)  { el.setAttribute("aria-pressed", on ? "true" : "false"); }
  function setSelected(el, on) { el.setAttribute("aria-selected", on ? "true" : "false"); }

  /* Quantity stepper markup. Buttons carry data-step="dec|inc" (+ optional data-id). */
  function stepperHtml(value, small, id) {
    var idAttr = id ? ' data-id="' + escapeHtml(id) + '"' : "";
    return (
      '<div class="stepper' + (small ? " stepper--sm" : "") + '">' +
        '<button type="button" class="stepper__btn stepper__btn--dec" data-step="dec"' + idAttr + ' aria-label="Decrease quantity">\u2212</button>' +
        '<span class="stepper__value" data-qty aria-live="polite">' + value + "</span>" +
        '<button type="button" class="stepper__btn stepper__btn--inc" data-step="inc"' + idAttr + ' aria-label="Increase quantity">+</button>' +
      "</div>"
    );
  }

  /* "Medium \u2022 50% \u2022 Hot" \u2013 only the options the item supports; pastries show "Warmed". */
  function variantText(line, item) {
    var parts = [];
    if (item.hasSize)  parts.push(line.size);
    if (item.hasSugar) parts.push(line.sugarLevel);
    if (item.hasServe) parts.push(line.serve);
    return parts.length ? parts.join(" \u2022 ") : "Warmed";
  }

  return {
    escapeHtml: escapeHtml, setPressed: setPressed, setSelected: setSelected,
    stepperHtml: stepperHtml, variantText: variantText
  };
})();
