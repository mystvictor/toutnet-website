document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");

  if (!form) {
    return;
  }

  const steps = Array.from(document.querySelectorAll(".form-step"));

  const progressSteps = Array.from(document.querySelectorAll(".wizard-step"));

  const nextButtons = Array.from(
    document.querySelectorAll('[data-action="next"]'),
  );

  const previousButtons = Array.from(
    document.querySelectorAll('[data-action="previous"]'),
  );

  const phoneInput = document.getElementById("phone");

  const submitButton = document.getElementById("submitButton");

  let currentStep = 1;

  /* ========================================================================
   TERMS MODAL
   ======================================================================== */

  const termsLink = document.getElementById("termsLink");

  const termsModal = document.getElementById("termsModal");

  const termsModalClose = document.getElementById("termsModalClose");

  const termsCloseButton = document.getElementById("termsCloseButton");

  const termsPrintButton = document.getElementById("termsPrintButton");

  let termsPreviousFocus = null;

  function openTermsModal() {
    if (!termsModal) {
      return;
    }

    termsPreviousFocus = document.activeElement;

    termsModal.classList.add("active");
    termsModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("terms-modal-open");

    if (termsModalClose) {
      termsModalClose.focus();
    }
  }

  function closeTermsModal() {
    if (!termsModal) {
      return;
    }

    termsModal.classList.remove("active");
    termsModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("terms-modal-open");

    if (termsPreviousFocus && typeof termsPreviousFocus.focus === "function") {
      termsPreviousFocus.focus();
    }

    termsPreviousFocus = null;
  }

  if (termsLink) {
    termsLink.addEventListener("click", (event) => {
      event.preventDefault();
      openTermsModal();
    });
  }

  if (termsModalClose) {
    termsModalClose.addEventListener("click", closeTermsModal);
  }

  if (termsCloseButton) {
    termsCloseButton.addEventListener("click", closeTermsModal);
  }

  if (termsModal) {
    termsModal.addEventListener("click", (event) => {
      if (event.target === termsModal) {
        closeTermsModal();
      }
    });
  }

  if (termsPrintButton) {
    termsPrintButton.addEventListener("click", () => {
      window.print();
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && termsModal?.classList.contains("active")) {
      closeTermsModal();
    }
  });

  /* ========================================================================
   STEP HELPERS
   ======================================================================== */

  function getStepElement(stepNumber) {
    return steps.find((step) => Number(step.dataset.step) === stepNumber);
  }

  function showStep(stepNumber) {
    currentStep = stepNumber;

    steps.forEach((step) => {
      const value = Number(step.dataset.step);

      step.classList.toggle("active", value === currentStep);
    });

    progressSteps.forEach((step) => {
      const value = Number(step.dataset.step);

      step.classList.toggle("active", value === currentStep);

      step.classList.toggle("completed", value < currentStep);

      if (value === currentStep) {
        step.setAttribute("aria-current", "step");
      } else {
        step.removeAttribute("aria-current");
      }
    });

    previousButtons.forEach((button) => {
      button.classList.toggle("hidden", currentStep === 1);
    });

    nextButtons.forEach((button) => {
      const parentStep = button.closest(".form-step");

      if (!parentStep) {
        return;
      }

      const parentStepNumber = Number(parentStep.dataset.step);

      button.style.display =
        parentStepNumber === currentStep ? "inline-flex" : "none";
    });
  }

  /* ========================================================================
   VALIDATION
   ======================================================================== */

  function validateStep(stepNumber) {
    const step = getStepElement(stepNumber);

    if (!step) {
      return false;
    }

    const fields = Array.from(
      step.querySelectorAll("input:not(.hp-field), select, textarea"),
    );

    let valid = true;
    let firstInvalid = null;

    fields.forEach((field) => {
      if (!field.checkValidity()) {
        valid = false;

        if (!firstInvalid) {
          firstInvalid = field;
        }
      }
    });

    if (!valid && firstInvalid) {
      firstInvalid.reportValidity();
      firstInvalid.focus();
    }

    return valid;
  }

  /* ========================================================================
   NEXT / PREVIOUS
   ======================================================================== */

  function goNext() {
    if (!validateStep(currentStep)) {
      return;
    }

    if (currentStep < steps.length) {
      showStep(currentStep + 1);
    }
  }

  function goPrevious() {
    if (currentStep > 1) {
      showStep(currentStep - 1);
    }
  }

  nextButtons.forEach((button) => {
    button.addEventListener("click", goNext);
  });

  previousButtons.forEach((button) => {
    button.addEventListener("click", goPrevious);
  });

  /* ========================================================================
   PROGRESS NAVIGATION
   ======================================================================== */

  progressSteps.forEach((progressStep) => {
    const targetStep = Number(progressStep.dataset.step);

    const navigate = () => {
      if (targetStep < currentStep) {
        showStep(targetStep);
        return;
      }

      if (targetStep === currentStep) {
        return;
      }

      if (targetStep === currentStep + 1) {
        goNext();
      }
    };

    progressStep.addEventListener("click", navigate);

    progressStep.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        navigate();
      }
    });
  });

  /* ========================================================================
   PHONE FORMATTING
   ======================================================================== */

  function normalizePhone(value) {
    let digits = value.replace(/\D/g, "");

    if (digits.startsWith("509")) {
      digits = digits.slice(3);
    }

    return digits.slice(0, 8);
  }

  function formatPhone(value) {
    const digits = normalizePhone(value);

    if (digits.length <= 4) {
      return digits;
    }

    return digits.slice(0, 4) + " " + digits.slice(4);
  }

  if (phoneInput) {
    phoneInput.addEventListener("input", () => {
      phoneInput.value = formatPhone(phoneInput.value);

      phoneInput.setCustomValidity("");
    });

    phoneInput.addEventListener("paste", () => {
      setTimeout(() => {
        phoneInput.value = formatPhone(phoneInput.value);
      }, 0);
    });
  }

  /* ========================================================================
   SUBMIT
   ======================================================================== */

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    /* --------------------------------------------------------------------
       Honeypot
       -------------------------------------------------------------------- */

    const honeypot = document.getElementById("address_hp");

    if (honeypot && honeypot.value.trim() !== "") {
      return;
    }

    /* --------------------------------------------------------------------
       Validate every step
       -------------------------------------------------------------------- */

    for (let stepNumber = 1; stepNumber <= steps.length; stepNumber++) {
      if (!validateStep(stepNumber)) {
        showStep(stepNumber);

        return;
      }
    }

    /* --------------------------------------------------------------------
       Validate phone
       -------------------------------------------------------------------- */

    const phoneDigits = normalizePhone(phoneInput ? phoneInput.value : "");

    if (phoneDigits.length !== 8) {
      showStep(2);

      if (phoneInput) {
        phoneInput.setCustomValidity(
          "Veuillez entrer un numéro de téléphone haïtien valide de 8 chiffres.",
        );

        phoneInput.reportValidity();
        phoneInput.focus();
      }

      return;
    }

    if (phoneInput) {
      phoneInput.setCustomValidity("");
    }

    /* --------------------------------------------------------------------
       Build payload
       -------------------------------------------------------------------- */

    const payload = {
      last_name: document.getElementById("last_name").value.trim(),

      first_name: document.getElementById("first_name").value.trim(),

      company: document.getElementById("company").value.trim(),

      phone: "+509 " + phoneDigits,

      email: document.getElementById("email").value.trim(),

      address: {
        street: document.getElementById("street").value.trim(),

        city: document.getElementById("city").value.trim(),

        department: document.getElementById("department").value,
      },

      plan: document.getElementById("plan").value,

      terms_accepted: document.getElementById("terms_accepted").checked,
    };

    /* --------------------------------------------------------------------
       Disable submit
       -------------------------------------------------------------------- */

    if (submitButton) {
      submitButton.disabled = true;

      const submitText = submitButton.querySelector(".submit-text");

      if (submitText) {
        submitText.textContent = "Envoi en cours...";
      }
    }

    try {
      const response = await fetch(
        "https://uisp-proxy-ls6j.onrender.com/api/v1/customers",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error(`Registration failed: ${response.status}`);
      }

      const result = await response.json();

      console.log("Customer registered:", result);
      alert("Votre demande d'inscription a été enregistrée.");

      window.location.href = "index.html";
    } catch (error) {
      console.error("Registration error:", error);

      alert(
        "Une erreur est survenue lors de l'envoi de votre demande. Veuillez réessayer.",
      );
    } finally {
      if (submitButton) {
        submitButton.disabled = false;

        const submitText = submitButton.querySelector(".submit-text");

        if (submitText) {
          submitText.textContent = "Envoyer ma demande";
        }
      }
    }
  });

  /* ========================================================================
   INITIAL STATE
   ======================================================================== */

  showStep(1);
});
