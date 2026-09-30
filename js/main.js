(() => {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
    });
  }

  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  const TRACKING_PARAMS = [
    "gclid",
    "gbraid",
    "wbraid",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
  ];

  try {
    const params = new URLSearchParams(window.location.search);
    const tracking = {};
    TRACKING_PARAMS.forEach((key) => {
      const value = params.get(key);
      if (value) tracking[key] = value;
    });

    const isAdClick = Object.keys(tracking).length > 0;
    if (isAdClick || !sessionStorage.getItem("invelsoft_attribution")) {
      sessionStorage.setItem(
        "invelsoft_attribution",
        JSON.stringify({
          ...tracking,
          landing_page: window.location.href,
          referrer: document.referrer,
        })
      );
    }
  } catch (error) {
    // Attribution is best-effort; storage may be blocked in private browsing.
  }
})();
