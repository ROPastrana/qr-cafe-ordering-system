/* ==========================================================================
   QR Cafe – Configuration
   ========================================================================== */
window.Cafe = window.Cafe || {};

Cafe.config = {
  /*
   * true  -> menu comes from assets/js/data.js and orders are simulated in the
   *          browser (works on any static server; no PHP/MySQL needed).
   * false -> the front end calls the PHP API in /cafe/api (see README.md):
   *            GET  {API_BASE_URL}/menu.php
   *            POST {API_BASE_URL}/orders.php
   *            GET  {API_BASE_URL}/track.php?t=<trackToken>
   */
  USE_MOCK_DATA: false,

  /* Absolute path, so it also works when a phone opens the page by the laptop's IP */
  API_BASE_URL: "/cafe/api",

  /* How often the order status page asks track.php for news (ms). */
  TRACK_REFRESH_MS: 5000
};
