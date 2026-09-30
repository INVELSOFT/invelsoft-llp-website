(() => {
  // From the EmailJS dashboard: Account → Public Key, Email Services, Email Templates.
  const EMAILJS = {
    publicKey: "",
    serviceId: "",
    templateId: "",
  };

  // Paste the widget script URL from Zoho SalesIQ's website installation snippet (the zsiqscript src).
  const SALESIQ_SRC = "";

  // Ad groups point their final URL at ?p=<key> so the headline matches the ad.
  const VARIANTS = {
    m365: {
      headline: "Genuine Microsoft 365",
      accent: "set up for you, free",
      product: "Microsoft 365 Personal / Family",
    },
    business: {
      headline: "Microsoft 365 for Business",
      accent: "set up for your team, free",
      product: "Microsoft 365 for Business",
    },
    office2024: {
      headline: "Office Home 2024",
      accent: "one-time purchase, installed free",
      product: "Office Home 2024",
    },
    win11: {
      headline: "Genuine Windows 11 license",
      accent: "activated and set up for you",
      product: "Windows 11 Home / Pro",
    },
    renew: {
      headline: "Renew Microsoft 365",
      accent: "we'll handle the setup",
      product: "Renew Microsoft 365",
    },
  };

  const MIN_FILL_MS = 3000;
  const loadedAt = Date.now();

  const form = document.getElementById("quote");
  const productSelect = form.elements.product;
  const phone = form.elements.phone;
  const submitButton = form.querySelector('button[type="submit"]');
  const submitError = form.querySelector("[data-submit-error]");

  const variantKey = new URLSearchParams(window.location.search).get("p");
  const variant = VARIANTS[variantKey];
  if (variant) {
    document.querySelector("[data-headline]").textContent = variant.headline;
    document.querySelector("[data-headline-accent]").textContent = variant.accent;
    productSelect.value = variant.product;
    document.title = `${variant.headline} – Invelsoft`;
  }

  document.querySelectorAll("[data-product]").forEach((link) => {
    link.addEventListener("click", () => {
      productSelect.value = link.dataset.product;
    });
  });

  if (SALESIQ_SRC) {
    window.$zoho = window.$zoho || {};
    window.$zoho.salesiq = window.$zoho.salesiq || { ready() {} };
    const script = document.createElement("script");
    script.id = "zsiqscript";
    script.src = SALESIQ_SRC;
    script.defer = true;
    document.body.append(script);

    document.querySelectorAll("[data-chat-only]").forEach((el) => {
      el.hidden = false;
    });
    document.querySelectorAll("[data-chat]").forEach((el) => {
      if (el.dataset.chatLabel) el.textContent = el.dataset.chatLabel;
      el.addEventListener("click", (event) => {
        const salesiq = window.$zoho.salesiq;
        if (salesiq && salesiq.floatwindow) {
          event.preventDefault();
          salesiq.floatwindow.visible("show");
        }
      });
    });
  }

  function validatePhone() {
    const digits = phone.value.replace(/\D/g, "");
    const valid = digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
    phone.setCustomValidity(valid || !digits ? "" : "Please enter a valid US phone number.");
  }

  phone.addEventListener("input", validatePhone);
  phone.addEventListener("change", validatePhone);
  submitButton.addEventListener("click", validatePhone);

  function readAttribution() {
    try {
      return JSON.parse(sessionStorage.getItem("invelsoft_attribution")) || {};
    } catch (error) {
      return {};
    }
  }

  function buildParams() {
    const data = new FormData(form);
    const value = (key) => String(data.get(key) || "").trim();
    const { landing_page: landingPage, referrer, ...tracking } = readAttribution();
    const trackingText = Object.entries(tracking)
      .map(([key, val]) => `${key}: ${val}`)
      .join("\n");

    return {
      product: value("product"),
      name: value("name"),
      phone: value("phone"),
      email: value("email"),
      reply_to: value("email"),
      page_variant: variantKey || "default",
      submitted_at: new Date().toString(),
      landing_page: landingPage || window.location.href,
      referrer: referrer || "—",
      tracking: trackingText || "—",
    };
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Bots fill the hidden field or submit instantly; send them to the thank-you page without emailing.
    if (form.elements.company_website.value || Date.now() - loadedAt < MIN_FILL_MS) {
      window.location.href = "thank-you.html";
      return;
    }

    submitError.hidden = true;
    if (!EMAILJS.publicKey || !EMAILJS.serviceId || !EMAILJS.templateId || !window.emailjs) {
      console.error("EmailJS is not configured in js/landing.js");
      submitError.hidden = false;
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Sending…";
    try {
      await window.emailjs.send(EMAILJS.serviceId, EMAILJS.templateId, buildParams(), {
        publicKey: EMAILJS.publicKey,
      });
      window.location.href = "thank-you.html";
    } catch (error) {
      console.error("Lead submission failed", error);
      submitError.hidden = false;
      submitButton.disabled = false;
      submitButton.textContent = "Get my price";
    }
  });
})();
