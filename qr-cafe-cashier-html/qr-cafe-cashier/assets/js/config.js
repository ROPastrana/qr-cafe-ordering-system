/* ==========================================================================
   QR Cafe Cashier – Configuration
   ========================================================================== */
window.Cafe = window.Cafe || {};

Cafe.config = {
  /*
   * true  -> everything runs in the browser: seeded demo orders, the menu from
   *          assets/js/data.js, and orders saved in localStorage. No PHP needed.
   * false -> the pages call the PHP API in /cafe/api (see README.md):
   *            POST  login.php   logout.php   pay.php   walkin.php
   *            GET   menu.php    queue.php    history.php?from=&to=&status=
   *            PATCH status.php
   */
  USE_MOCK_DATA: false,

  /* Absolute path, so it also works when the POS is opened by the laptop's IP */
  API_BASE_URL: "/cafe/api",

  /* How often the live queue re-fetches orders (ms). */
  QUEUE_REFRESH_MS: 15000
};
