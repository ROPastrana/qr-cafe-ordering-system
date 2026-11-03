/* ==========================================================================
   QR Cafe Cashier – Page shell: login guard, sidebar, live clock, logout
   Each page calls:  Cafe.layout.start("queue")   (the active nav item)
   NOTE: the guard below is for convenience only. Real access control must be
   enforced by the server (PHP session check on every /api request).
   ========================================================================== */
window.Cafe = window.Cafe || {};

Cafe.layout = (function () {
  var ui = Cafe.ui;

  var NAV = [
    { id: "queue",   label: "Order Queue",   href: "queue.html",   icon: "queue" },
    { id: "manual",  label: "Manual Entry",  href: "manual.html",  icon: "plus" },
    { id: "history", label: "Order History", href: "history.html", icon: "history" },
    { id: "report",  label: "Sales Report",  href: "report.html",  icon: "chart" }
  ];

  var AVATAR =
    '<svg viewBox="0 0 36 36" width="36" height="36" fill="none" aria-hidden="true">' +
    '<circle cx="18" cy="18" r="18" fill="#8B5E3C"/><circle cx="18" cy="14" r="7" fill="#C8966C"/>' +
    '<ellipse cx="18" cy="32" rx="12" ry="9" fill="#6B4226"/></svg>';

  function mountSidebar(active, session) {
    var aside = document.getElementById("sidebar");
    if (!aside) return;
    aside.innerHTML =
      '<div class="sidebar__brand">' +
        '<div class="brand-mark">' + ui.icons.coffee + "</div>" +
        '<span class="sidebar__brand-name">ORDERING<br>SYSTEM POS</span>' +
      "</div>" +
      '<nav class="sidebar__nav" aria-label="Main">' +
        NAV.map(function (n) {
          return '<a class="nav-link" href="' + n.href + '"' + (n.id === active ? ' aria-current="page"' : "") + ">" +
            ui.icons[n.icon] + '<span class="nav-link__label">' + n.label + "</span></a>";
        }).join("") +
        /* Phones hide the sidebar's logout button (input.css, max-width 700px), so the bottom bar gets one */
        '<button type="button" class="nav-link" data-logout hidden>' + ui.icons.logout + '<span class="nav-link__label">Log Out</span></button>' +
      "</nav>" +
      '<div class="sidebar__profile">' +
        '<div class="avatar">' + AVATAR + "</div>" +
        "<div>" +
          '<div class="profile__name">' + ui.esc(session.name) + "</div>" +
          '<div class="profile__role">' + ui.esc(session.role) + "</div>" +
        "</div>" +
      "</div>" +
      '<button class="sidebar__logout" type="button" id="logout-btn">' + ui.icons.logout +
        '<span class="sidebar__logout-label">Logout Session</span></button>';

    function logout() {
      Cafe.api.logout().then(function () { window.location.href = "login.html"; });
    }
    document.getElementById("logout-btn").addEventListener("click", logout);

    var phoneLogout = aside.querySelector("[data-logout]");
    var phone = window.matchMedia("(max-width: 700px)");
    function syncPhoneLogout() { phoneLogout.hidden = !phone.matches; }
    phoneLogout.addEventListener("click", logout);
    phone.addEventListener("change", syncPhoneLogout);
    syncPhoneLogout();
  }

  function startClock() {
    var timeEl = document.getElementById("clock-time");
    var dateEl = document.getElementById("clock-date");
    if (!timeEl || !dateEl) return;
    var DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    var MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    function tick() {
      var now = new Date();
      timeEl.textContent = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      dateEl.textContent = DAYS[now.getDay()] + " · " + MONTHS[now.getMonth()] + " " + now.getDate();
    }
    tick();
    setInterval(tick, 1000);
  }

  /* Returns false (and redirects) when nobody is signed in. */
  function start(active) {
    var session = Cafe.store.getSession();
    if (!session) { window.location.replace("login.html"); return false; }
    mountSidebar(active, session);
    startClock();
    return true;
  }

  return { start: start };
})();
