/* ==========================================================================
   QR Cafe – Configuration
   ========================================================================== */
window.Cafe = window.Cafe || {};

Cafe.config = {
  /*
   * true  -> menu comes from assets/js/data.js and orders are simulated in the
   *          browser (works on any static server; no PHP/MySQL needed).
   * false -> the front end calls the PHP REST API (see README.md):
   *            GET  {API_BASE_URL}/menu
   *            POST {API_BASE_URL}/orders
   */
  USE_MOCK_DATA: true,

  /* Relative to the HTML pages, e.g. http://localhost/qr-cafe/api/menu */
  API_BASE_URL: "api"
};
