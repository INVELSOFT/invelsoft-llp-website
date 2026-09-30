(() => {
  // Fill these in from your EmailJS dashboard (Account → Public Key, Email Services, Email Templates).
  const EMAILJS = {
    publicKey: "",
    serviceId: "",
    templateId: "",
  };

  const OTHER_ISSUE = "Something else";

  const PRODUCTS = {
    "office-365": {
      name: "Microsoft Office 365",
      issues: [
        "Installation or setup",
        "Activation or product key",
        "Sign-in or account access",
        "Apps crashing or not opening",
        "Update or error messages",
        "Buy or renew a subscription",
      ],
    },
    "windows-10": {
      name: "Windows 10",
      issues: [
        "Slow performance",
        "Windows Update errors",
        "Blue screen or unexpected restarts",
        "Activation or license",
        "Drivers, printer or hardware",
        "Upgrade to Windows 11",
      ],
    },
    "windows-11": {
      name: "Windows 11",
      issues: [
        "Installation or upgrade",
        "Windows Update errors",
        "Slow performance",
        "Activation or license",
        "Drivers, printer or hardware",
        "Settings and features",
      ],
    },
    outlook: {
      name: "Outlook",
      issues: [
        "Emails not sending or receiving",
        "Email account setup",
        "Password or sign-in problems",
        "Outlook crashing or not responding",
        "Calendar or contacts not syncing",
        "PST / OST data file errors",
      ],
    },
    excel: {
      name: "Excel",
      issues: [
        "File won't open or is corrupted",
        "Excel crashing or freezing",
        "Formulas and functions",
        "Macros or add-ins",
        "Activation or license",
        "Printing or formatting",
      ],
    },
    xbox: {
      name: "Xbox",
      issues: [
        "Console setup",
        "Xbox account or sign-in",
        "Game Pass or subscription",
        "Network or connection problems",
        "Controller issues",
        "Game download or install errors",
      ],
    },
  };

  const product = PRODUCTS[new URLSearchParams(window.location.search).get("product")];
  if (!product) {
    window.location.replace("index.html#products");
    return;
  }

  const form = document.getElementById("lead-form");
  const steps = form.querySelectorAll("[data-step]");
  const indicators = document.querySelectorAll("[data-step-indicator]");
  const optionsContainer = form.querySelector("[data-issue-options]");
  const issueError = form.querySelector("[data-issue-error]");
  const submitError = form.querySelector("[data-submit-error]");
  const submitButton = form.querySelector('button[type="submit"]');
  const description = form.elements.description;
  const phone = form.elements.phone;

  document.title = `${product.name} support – Invelsoft`;
  document.querySelectorAll("[data-product-name]").forEach((el) => {
    el.textContent = product.name;
  });

  [...product.issues, OTHER_ISSUE].forEach((issue) => {
    const label = document.createElement("label");
    label.className = "option";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "issue";
    input.value = issue;
    const body = document.createElement("span");
    body.className = "option-body";
    body.textContent = issue;
    label.append(input, body);
    optionsContainer.append(label);
  });

  function issueProblem() {
    const selected = form.querySelector('input[name="issue"]:checked');
    if (!selected) return "Please choose the option that best matches your issue.";
    if (selected.value === OTHER_ISSUE && !description.value.trim()) {
      return "Please describe the issue so we know how to help.";
    }
    return "";
  }

  function currentStep() {
    return window.location.hash === "#details" && !issueProblem() ? "details" : "issue";
  }

  function render({ moveFocus = false } = {}) {
    const step = currentStep();
    steps.forEach((section) => {
      section.hidden = section.dataset.step !== step;
    });
    indicators.forEach((item) => {
      const isCurrent = item.dataset.stepIndicator === step;
      item.classList.toggle("is-current", isCurrent);
      item.classList.toggle("is-done", step === "details" && item.dataset.stepIndicator === "issue");
      if (isCurrent) item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
    });
    if (moveFocus) {
      window.scrollTo(0, 0);
      form.querySelector(`[data-step="${step}"] .step-title`).focus({ preventScroll: true });
    }
  }

  form.addEventListener("change", (event) => {
    if (event.target.name === "issue") issueError.hidden = true;
  });

  form.querySelector("[data-next]").addEventListener("click", () => {
    const problem = issueProblem();
    issueError.textContent = problem;
    issueError.hidden = !problem;
    if (problem) return;
    history.pushState({ step: "details" }, "", "#details");
    render({ moveFocus: true });
  });

  form.querySelector("[data-back]").addEventListener("click", () => {
    if (history.state && history.state.step === "details") {
      history.back();
    } else {
      history.replaceState(null, "", window.location.pathname + window.location.search);
      render({ moveFocus: true });
    }
  });

  window.addEventListener("popstate", () => render({ moveFocus: true }));

  phone.addEventListener("input", () => {
    const digits = phone.value.replace(/\D/g, "").length;
    phone.setCustomValidity(digits >= 7 && digits <= 15 ? "" : "Please enter a valid phone number.");
  });

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
    const { landing_page: landingPage, ...tracking } = readAttribution();
    const trackingText = Object.entries(tracking)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    return {
      product: product.name,
      issue: value("issue"),
      description: value("description") || "—",
      name: value("name"),
      phone: value("phone"),
      email: value("email"),
      reply_to: value("email"),
      city: value("city"),
      best_time: value("best_time"),
      submitted_at: new Date().toString(),
      landing_page: landingPage || window.location.href,
      tracking: trackingText || "—",
    };
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (currentStep() !== "details") return;

    if (form.elements.company_website.value) {
      window.location.href = "thank-you.html";
      return;
    }

    submitError.hidden = true;
    if (!EMAILJS.publicKey || !EMAILJS.serviceId || !EMAILJS.templateId) {
      console.error("EmailJS keys are missing in js/request.js");
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
      submitButton.textContent = "Request a callback";
    }
  });

  render();
})();
