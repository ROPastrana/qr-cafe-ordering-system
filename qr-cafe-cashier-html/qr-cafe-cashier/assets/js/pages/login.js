/* ==========================================================================
   Login page
   Mock mode accepts any credentials (as in the design); real mode calls
   POST api/auth/login.
   ========================================================================== */
(function () {
  if (Cafe.store.getSession()) { window.location.replace("queue.html"); return; }

  var form = document.getElementById("login-form");
  var user = document.getElementById("username");
  var pass = document.getElementById("password");
  var btn = document.getElementById("login-submit");
  var error = document.getElementById("login-error");

  /* Demo convenience only – never prefill credentials against a real backend. */
  if (Cafe.config.USE_MOCK_DATA) {
    user.value = "Ordering System_cashier01";
    pass.value = "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022";
  }

  function showError(msg) { error.textContent = msg; error.hidden = !msg; }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    showError("");
    if (!Cafe.config.USE_MOCK_DATA && (!user.value.trim() || !pass.value)) {
      showError("Enter your username and password.");
      return;
    }
    btn.disabled = true;
    btn.textContent = "Signing in\u2026";

    Cafe.api.login(user.value.trim(), pass.value)
      .then(function () { window.location.href = "queue.html"; })
      .catch(function (err) {
        showError(err.message || "Could not sign in. Please try again.");
        btn.disabled = false;
        btn.textContent = "Sign In to POS";
      });
  });
})();
