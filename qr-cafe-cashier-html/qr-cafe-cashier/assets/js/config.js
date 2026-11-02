/* ==========================================================================
   QR Cafe Cashier – Configuration
   ========================================================================== */
window.Cafe = window.Cafe || {};

Cafe.config = {
  /*
   * true  -> everything runs in the browser: seeded demo orders, the menu from
   *          assets/js/data.js, and orders saved in localStorage. No PHP needed.
   * false -> the pages call the PHP REST API (see README.md):
   *            POST  {API_BASE_URL}/auth/login      POST {API_BASE_URL}/auth/logout
   *            GET   {API_BASE_URL}/menu            GET  {API_BASE_URL}/orders
   *            POST  {API_BASE_URL}/orders          PATCH {API_BASE_URL}/orders/{id}
   */
  USE_MOCK_DATA: true,

  /* Relative to the HTML pages, e.g. http://localhost/qr-cafe-cashier/api/orders */
  API_BASE_URL: "api",

  /* How often the live queue re-fetches orders (ms). */
  QUEUE_REFRESH_MS: 15000
};
