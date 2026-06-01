(function () {
  "use strict";

  var PIXEL_ID = "1981376712481038";
  var FINAL_BUTTON_SELECTOR = ".lead-win-popup__button";
  var LEAD_SENT_KEY = "lead_sent";
  var LEAD_EVENT_ID_KEY = "lead_event_id";
  var redirecting = false;

  !function(f,b,e,v,n,t,s) {
    if (f.fbq) return;
    n = f.fbq = function() {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

  window.fbq("init", PIXEL_ID);
  window.fbq("track", "PageView");

  function getCookie(name) {
    var match = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : "";
  }

  function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name) || "";
  }

  function getFbc() {
    var cookieFbc = getCookie("_fbc");
    var fbclid = getQueryParam("fbclid");

    if (cookieFbc) return cookieFbc;
    if (!fbclid) return "";

    return "fb.1." + Date.now() + "." + fbclid;
  }

  function createEventId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    return "lead_" + Date.now() + "_" + Math.random().toString(16).slice(2);
  }

  function redirectTo(url) {
    window.location.href = url;
  }

  function postCapi(eventId) {
    return fetch("/api/meta-capi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      keepalive: true,
      body: JSON.stringify({
        event_name: "Lead",
        event_id: eventId,
        fbp: getCookie("_fbp"),
        fbc: getFbc(),
        fbclid: getQueryParam("fbclid"),
        event_source_url: window.location.href,
        referrer: document.referrer || "",
      }),
    });
  }

  function trackLead(button) {
    var affiliateUrl = button.href;
    var storedEventId = localStorage.getItem(LEAD_EVENT_ID_KEY);

    if (localStorage.getItem(LEAD_SENT_KEY) === "true") {
      console.info("[Meta Tracking] Lead bloqueado por duplicidade", storedEventId || "");
      redirectTo(affiliateUrl);
      return;
    }

    if (redirecting) return;
    redirecting = true;

    var eventId = createEventId();
    localStorage.setItem(LEAD_SENT_KEY, "true");
    localStorage.setItem(LEAD_EVENT_ID_KEY, eventId);

    button.setAttribute("aria-disabled", "true");
    button.style.pointerEvents = "none";

    window.fbq("track", "Lead", {}, { eventID: eventId });

    postCapi(eventId)
      .then(function (response) {
        if (!response.ok) {
          throw new Error("CAPI HTTP " + response.status);
        }
        console.info("[Meta Tracking] Lead enviado", eventId);
      })
      .catch(function (error) {
        console.error("[Meta Tracking] erro ao enviar CAPI", error);
      });

    window.setTimeout(function () {
      redirectTo(affiliateUrl);
    }, 700);
  }

  document.addEventListener("click", function (event) {
    var button = event.target.closest(FINAL_BUTTON_SELECTOR);
    if (!button) return;

    event.preventDefault();
    trackLead(button);
  });
})();
