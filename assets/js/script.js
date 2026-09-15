document.addEventListener("DOMContentLoaded", () => {
  let userCoordinates = null;
  let activeTab = "residential";
  let isPriorityListRequest = false;

  // Initialize Supabase Client safely
  const SUPABASE_URL = "https://edjuasgetqbcvywwrddq.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkanVhc2dldHFiY3Z5d3dyZGRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MjM2ODMsImV4cCI6MjEwNDk5OTY4M30.uzdul5_sCJGG8UvoHtsuPPqOmOfsqgstvfNRmLxBI4k";

  let supabase = null;
  if (window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } else {
    console.error("Supabase SDK not found in <head>. Please check your CDN script tag.");
  }

  // Toast Notification Helper
  const showToast = (icon, title) => {
    if (window.Swal) {
      const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3500,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener("mouseenter", Swal.stopTimer);
          toast.addEventListener("mouseleave", Swal.resumeTimer);
        },
      });
      Toast.fire({
        icon: icon,
        title: title,
      });
    } else {
      alert(`${icon.toUpperCase()}: ${title}`);
    }
  };

  // Helper: Visual Shake Animation & Input Highlight
  const highlightInputError = (inputEl) => {
    if (!inputEl) return;

    // Dynamically insert CSS keyframe for shake if not present
    if (!document.getElementById("shake-animation-style")) {
      const style = document.createElement("style");
      style.id = "shake-animation-style";
      style.textContent = `
        @keyframes inputShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .input-error-shake {
          animation: inputShake 0.4s ease-in-out !important;
          border-color: #ef4444 !important;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.25) !important;
        }
      `;
      document.head.appendChild(style);
    }

    inputEl.classList.add("input-error-shake");
    inputEl.focus();

    // Remove shake after animation completes, clear error border on input
    setTimeout(() => {
      inputEl.classList.remove("input-error-shake");
    }, 400);

    const clearError = () => {
      inputEl.style.borderColor = "";
      inputEl.style.boxShadow = "";
      inputEl.removeEventListener("input", clearError);
    };
    inputEl.addEventListener("input", clearError);
  };

  // Data Tiers for Residential / Pro
  const RESIDENTIAL_TIERS = [
    {
      speed: "25 Mbps",
      upload: "5 Mbps",
      price: "HTG 5,500",
      progress: "25%",
      devices: "1-4 appareils",
      bullet4: "Antenne Extérieure Offerte",
    },
    {
      speed: "50 Mbps",
      upload: "20 Mbps",
      price: "HTG 6,000",
      progress: "50%",
      devices: "6-12 appareils",
      bullet4: "Antenne Extérieure Offerte",
    },
    {
      speed: "100 Mbps",
      upload: "50 Mbps",
      price: "HTG 8,000",
      progress: "75%",
      devices: "12-25 appareils",
      bullet4: "Antenne Extérieure Offerte",
    },
    {
      speed: "100 Mbps",
      upload: "100 Mbps",
      price: "HTG 13,000",
      progress: "100%",
      devices: "Multi-Utilisateurs",
      bullet4: "Routeur Wi-Fi 6 Pro",
    },
  ];

  // Data Tiers for Enterprise Dedicated
  const BUSINESS_TIERS = [
    {
      speed: "25 Mbps Dédié",
      upload: "25 Mbps Simétrique",
      price: "HTG 25,000",
      progress: "25%",
      devices: "Bureaux PME",
      bullet4: "SLA 99.9% + IP Fixe",
    },
    {
      speed: "50 Mbps Dédié",
      upload: "50 Mbps Simétrique",
      price: "HTG 30,000",
      progress: "50%",
      devices: "20-50 Postes",
      bullet4: "SLA 99.9% + IP Fixe",
    },
    {
      speed: "75 Mbps Dédié",
      upload: "75 Mbps Simétrique",
      price: "HTG 45,000",
      progress: "75%",
      devices: "50-100 Postes",
      bullet4: "Bande Passante Dédiée",
    },
    {
      speed: "100 Mbps Dédié",
      upload: "100 Mbps Simétrique",
      price: "HTG 60,000",
      progress: "100%",
      devices: "Sièges & Data Center",
      bullet4: "Support Technique Dédié",
    },
  ];

  // List of covered zones
  const COVERED_ZONES = [
    "delmas",
    "delmas 75",
    "delmas 31",
    "delmas 33",
    "petion-ville",
    "pétion-ville",
    "petion ville",
    "pétion ville",
    "bois verna",
    "tabarre",
    "turgeau",
    "canapé-vert",
    "canape vert",
    "pacot",
    "vivy mitchell",
    "peguy-ville",
    "peguyville",
    "haut de turgeau",
    "port-au-prince",
    "laboule",
  ];

  let currentStep = 1;

  // Mobile Menu Controls
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileOverlay = document.getElementById("mobileOverlay");
  const mobileLinks = document.querySelectorAll(".mobile-link");
  const btnTesterAdresseMobile = document.getElementById("btnTesterAdresseMobile");

  function toggleMobileMenu() {
    if (mobileMenu) mobileMenu.classList.toggle("active");
    if (mobileOverlay) mobileOverlay.classList.toggle("active");
  }

  if (hamburgerBtn) hamburgerBtn.addEventListener("click", toggleMobileMenu);
  if (mobileOverlay) mobileOverlay.addEventListener("click", toggleMobileMenu);

  mobileLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (mobileMenu) mobileMenu.classList.remove("active");
      if (mobileOverlay) mobileOverlay.classList.remove("active");
    });
  });

  // DOM Elements
  const tabInternet = document.getElementById("tabInternet");
  const tabCombo = document.getElementById("tabCombo");
  const planCategoryTitle = document.getElementById("planCategoryTitle");
  const planSpecsGrid = document.getElementById("planSpecsGrid");

  const speedDisplay = document.getElementById("speedDisplay");
  const uploadDisplay = document.getElementById("uploadDisplay");
  const priceDisplay = document.getElementById("priceDisplay");
  const deviceCount = document.getElementById("deviceCount");
  const progressBar = document.getElementById("progressBar");
  const btnMinus = document.getElementById("btnMinus");
  const btnPlus = document.getElementById("btnPlus");
  const modalPlanName = document.getElementById("modalPlanName");

  const feat4 = document.getElementById("feat4");

  function updateModalSubtitle() {
    const leadModalSubtitle = document.querySelector("#leadModal p");
    if (!leadModalSubtitle) return;

    if (isPriorityListRequest) {
      leadModalSubtitle.textContent =
        "Remplissez ce formulaire pour être placé sur la liste prioritaire avec votre position GPS.";
    } else {
      const currentPlan =
        activeTab === "residential"
          ? RESIDENTIAL_TIERS[currentStep]
          : BUSINESS_TIERS[currentStep];
      const categoryLabel =
        activeTab === "residential"
          ? "Forfait Résidentiel / Pro"
          : "Liaison Dédiée Entreprise";

      leadModalSubtitle.textContent = `Remplissez ce formulaire pour planifier l'installation de votre forfait ${categoryLabel} - ${currentPlan.speed} (${currentPlan.price}/mois).`;
    }
  }

  function updateWizardUI() {
    const activeData = activeTab === "residential" ? RESIDENTIAL_TIERS : BUSINESS_TIERS;
    const data = activeData[currentStep];

    if (speedDisplay) speedDisplay.textContent = data.speed;
    if (uploadDisplay) uploadDisplay.textContent = data.upload;
    if (priceDisplay) priceDisplay.textContent = data.price;
    if (deviceCount) deviceCount.textContent = data.devices;
    if (progressBar) progressBar.style.width = data.progress;

    if (feat4) feat4.innerHTML = `<span>✓</span> ${data.bullet4}`;

    const categoryLabel =
      activeTab === "residential"
        ? "Forfait Résidentiel / Pro"
        : "Liaison Dédiée Entreprise";
    if (modalPlanName)
      modalPlanName.textContent = `${categoryLabel} - ${data.speed} (${data.price}/mois)`;

    if (btnMinus) {
      btnMinus.disabled = currentStep === 0;
      btnMinus.style.opacity = currentStep === 0 ? "0.4" : "1";
    }
    if (btnPlus) {
      btnPlus.disabled = currentStep === activeData.length - 1;
      btnPlus.style.opacity = currentStep === activeData.length - 1 ? "0.4" : "1";
    }
  }

  // Tab Switchers
  if (tabInternet) {
    tabInternet.addEventListener("click", () => {
      activeTab = "residential";
      tabInternet.className = "tab-btn active";
      if (tabCombo) tabCombo.className = "tab-btn inactive";

      if (planCategoryTitle) planCategoryTitle.textContent = "Forfait Pro / Résidentiel";
      if (planSpecsGrid) {
        planSpecsGrid.innerHTML = `
          <div><span>✓</span> Wi-Fi 6 inclus</div>
          <div><span>✓</span> Modem AirFiber</div>
          <div><span>✓</span> Couverture Multi-Étage</div>
          <div><span>✓</span> Support 24/7</div>
        `;
      }

      updateWizardUI();
    });
  }

  if (tabCombo) {
    tabCombo.addEventListener("click", () => {
      activeTab = "business";
      tabCombo.className = "tab-btn active";
      if (tabInternet) tabInternet.className = "tab-btn inactive";

      if (planCategoryTitle) planCategoryTitle.textContent = "AirFiber Enterprise Dedicated";
      if (planSpecsGrid) {
        planSpecsGrid.innerHTML = `
          <div><span>✓</span> Débit 1:1 Simétrique</div>
          <div><span>✓</span> IP Publique</div>
          <div><span>✓</span> SLA Garantie 99.9%</div>
          <div><span>✓</span> Support Prioritaire</div>
        `;
      }

      updateWizardUI();
    });
  }

  // Stepper Controls
  if (btnMinus) {
    btnMinus.addEventListener("click", () => {
      if (currentStep > 0) {
        currentStep--;
        updateWizardUI();
      }
    });
  }

  if (btnPlus) {
    btnPlus.addEventListener("click", () => {
      const activeData = activeTab === "residential" ? RESIDENTIAL_TIERS : BUSINESS_TIERS;
      if (currentStep < activeData.length - 1) {
        currentStep++;
        updateWizardUI();
      }
    });
  }

  updateWizardUI();

  // Modal & Geolocation Core Logic
  const leadModal = document.getElementById("leadModal");
  const openLeadModal = document.getElementById("openLeadModal");
  const closeLeadModal = document.getElementById("closeLeadModal");
  const submitBtn = document.getElementById("btnSubmitLead");

  const captureGPSCoordinates = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        showToast("error", "La géolocalisation n'est pas supportée.");
        return reject(new Error("Geolocation unsupported"));
      }

      if (window.Swal) {
        Swal.fire({
          title: "Géolocalisation Requise",
          text: "Veuillez autoriser l'accès GPS pour vérifier la visibilité directe de votre domicile avec nos relais AirFiber.",
          icon: "info",
          confirmButtonText: "Autoriser mon GPS",
          confirmButtonColor: "#7c3aed",
          allowOutsideClick: false,
        }).then((res) => {
          if (!res.isConfirmed) {
            showToast("warning", "Permission GPS refusée par l'utilisateur.");
            return reject(new Error("Permission denied by user"));
          }

          Swal.fire({
            title: "Acquisition de la position GPS...",
            text: "Calcul de votre position exacte en cours.",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
          });

          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              userCoordinates = { latitude, longitude };

              const areaInput = document.getElementById("area");
              const formattedCoords = `GPS (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;

              if (areaInput) {
                areaInput.value = formattedCoords;
                areaInput.disabled = true;
              }

              Swal.close();
              showToast("success", "Position GPS acquise avec succès.");
              resolve(userCoordinates);
            },
            (error) => {
              let msg = "Impossible de récupérer votre position GPS.";
              if (error.code === error.PERMISSION_DENIED) {
                msg = "Accès GPS refusé. La position GPS est obligatoire.";
              }
              showToast("error", msg);
              reject(error);
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
          );
        });
      }
    });
  };

  const selectPlanModal = async () => {
    const resOptions = RESIDENTIAL_TIERS.map(
      (p, i) => `<option value="res_${i}">${p.speed} - ${p.price}/mois (Résidentiel/Pro)</option>`
    ).join("");

    const busOptions = BUSINESS_TIERS.map(
      (p, i) => `<option value="bus_${i}">${p.speed} - ${p.price}/mois (Dédié Entreprise)</option>`
    ).join("");

    const { value: selectedVal } = await Swal.fire({
      title: "Sélectionnez votre Forfait",
      html: `
        <p style="margin-bottom: 1rem; font-size: 0.9rem; color: #64748b;">
          Choisissez le forfait qui convient le mieux à vos besoins d'installation :
        </p>
        <select id="swalPlanSelect" class="swal2-input" style="width: 100%; max-width: 100%;">
          <optgroup label="Forfaits Résidentiel / Pro">
            ${resOptions}
          </optgroup>
          <optgroup label="Liaisons Dédiées Entreprise">
            ${busOptions}
          </optgroup>
        </select>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Valider le Forfait",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#7c3aed",
      preConfirm: () => {
        return document.getElementById("swalPlanSelect").value;
      },
    });

    if (selectedVal) {
      if (selectedVal.startsWith("res_")) {
        activeTab = "residential";
        currentStep = parseInt(selectedVal.replace("res_", ""), 10);
      } else if (selectedVal.startsWith("bus_")) {
        activeTab = "business";
        currentStep = parseInt(selectedVal.replace("bus_", ""), 10);
      }
      updateWizardUI();
      return true;
    }
    return false;
  };

  const openOrderModalWithGPS = async (priorityFlag = false, promptPlanSelect = false) => {
    isPriorityListRequest = priorityFlag;

    if (!userCoordinates) {
      try {
        await captureGPSCoordinates();
      } catch (err) {
        console.warn("Order cancelled: GPS coordinates missing.");
        return;
      }
    }

    if (promptPlanSelect) {
      const planPicked = await selectPlanModal();
      if (!planPicked) return;
    }

    updateModalSubtitle();
    if (leadModal) leadModal.classList.add("active");
  };

  if (openLeadModal) {
    openLeadModal.addEventListener("click", () => openOrderModalWithGPS(false, false));
  }

  if (closeLeadModal && leadModal) {
    closeLeadModal.addEventListener("click", () => leadModal.classList.remove("active"));
  }

  const leadForm = document.getElementById("leadForm");
  const phoneInput = document.getElementById("phone");

  /* ==========================================================================
     Strict Phone Input Formatter (+509 4444 5555)
     ========================================================================== */
  function formatPhoneNumber(val) {
    let digits = val.replace(/\D/g, "");
    if (digits.startsWith("509")) {
      digits = digits.slice(3);
    }
    digits = digits.substring(0, 8);

    let formatted = "+509 ";
    if (digits.length > 0) {
      if (digits.length <= 4) {
        formatted += digits;
      } else {
        formatted += digits.substring(0, 4) + " " + digits.substring(4);
      }
    }
    return formatted;
  }

  if (phoneInput) {
    phoneInput.value = formatPhoneNumber(phoneInput.value);

    phoneInput.addEventListener("input", (e) => {
      e.target.value = formatPhoneNumber(e.target.value);
    });

    phoneInput.addEventListener("keydown", (e) => {
      if (
        (e.key === "Backspace" || e.key === "Delete") &&
        phoneInput.selectionStart <= 5
      ) {
        e.preventDefault();
      }
    });

    phoneInput.addEventListener("focus", () => {
      if (phoneInput.selectionStart < 5) {
        phoneInput.setSelectionRange(phoneInput.value.length, phoneInput.value.length);
      }
    });
  }

  /* ==========================================================================
     Form Submission with Shake Animation & Haiti [2-5] Phone Validation
     ========================================================================== */
  if (leadForm) {
    leadForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // 1. Validate Name Field
      const nameInput = document.getElementById("name");
      const name = nameInput ? nameInput.value.trim() : "";

      if (!name) {
        showToast("warning", "Veuillez entrer votre nom ou entreprise.");
        highlightInputError(nameInput);
        return;
      }

      // 2. Honeypot Anti-Spam Check
      const honeypotEl = document.getElementById("address_hp");
      if (honeypotEl && honeypotEl.value.trim() !== "") {
        console.warn("Spam attempt detected via honeypot.");
        showToast("success", "Demande envoyée !");
        if (leadModal) leadModal.classList.remove("active");
        leadForm.reset();
        return;
      }

      // 3. Rate Limiting Check (2-minute cooldown)
      const LAST_SUBMIT_KEY = "toutnet_last_lead_submit";
      const COOLDOWN_TIME = 2 * 60 * 1000;
      const lastSubmit = localStorage.getItem(LAST_SUBMIT_KEY);

      if (lastSubmit && Date.now() - parseInt(lastSubmit, 10) < COOLDOWN_TIME) {
        const remainingSeconds = Math.ceil(
          (COOLDOWN_TIME - (Date.now() - parseInt(lastSubmit, 10))) / 1000
        );
        showToast(
          "warning",
          `Patientez ${remainingSeconds}s avant de réesayer.`
        );
        return;
      }

      // 4. Haitian Phone Validation [2-5]
      const rawPhone = phoneInput ? phoneInput.value : "";
      const cleanedPhone = rawPhone.replace(/\s+/g, "");
      // Restricts valid starting digits to 2, 3, 4, or 5 for Haiti
      const haitiPhoneRegex = /^(?:\+509)?[2-5]\d{7}$/;

      if (!haitiPhoneRegex.test(cleanedPhone)) {
        showToast(
          "error",
          "Numéro haïtien invalide (+509 2-5XX XXXX)."
        );
        highlightInputError(phoneInput);
        return;
      }

      // 5. GPS Coordinates Validation
      if (!userCoordinates) {
        try {
          await captureGPSCoordinates();
        } catch (err) {
          showToast("error", "Position GPS requise pour soumettre.");
          return;
        }
      }

      // 6. Submission Block
      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerText = "Traitement en cours...";
        }

        const currentPlan =
          activeTab === "residential"
            ? RESIDENTIAL_TIERS[currentStep]
            : BUSINESS_TIERS[currentStep];

        const categoryLabel =
          activeTab === "residential"
            ? "Forfait Résidentiel / Pro"
            : "Liaison Dédiée Entreprise";

        const formattedPlanName = `${categoryLabel} - ${currentPlan.speed} (${currentPlan.price}/mois)`;
        const gpsString = `Lat ${userCoordinates.latitude.toFixed(5)}, Long ${userCoordinates.longitude.toFixed(5)}`;

        if (window.Swal) {
          Swal.fire({
            title: "Envoi en cours...",
            text: "Veuillez patienter pendant l'enregistrement de votre demande.",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
          });
        }

        if (!supabase) {
          throw new Error("Le client Supabase n'est pas disponible.");
        }

        const { data, error } = await supabase.from("leads").insert([
          {
            name: name,
            phone: rawPhone,
            area: gpsString,
            plan_name: formattedPlanName,
            category: activeTab,
            is_priority_list: isPriorityListRequest,
            coordinates: userCoordinates,
          },
        ]);

        if (error) throw error;

        localStorage.setItem(LAST_SUBMIT_KEY, Date.now().toString());

        const successTitle = isPriorityListRequest
          ? "Inscrit sur Liste Prioritaire !"
          : "Demande envoyée avec succès !";

        if (window.Swal) {
          Swal.fire({
            icon: "success",
            title: successTitle,
            html: `
              <p>Merci <strong>${name}</strong> !</p>
              <p style="margin-top:0.5rem; font-size:0.9rem; color:#64748b;">
                Votre demande pour le forfait <strong>${currentPlan.speed}</strong> a été enregistrée à la position GPS (<code>${gpsString}</code>).
              </p>
              <p style="margin-top:0.5rem; font-size:0.85rem; color:#94a3b8;">
                Notre équipe vous recontactera très prochainement au <strong>${rawPhone}</strong>.
              </p>
            `,
            confirmButtonColor: "#7c3aed",
          });
        }

        if (leadModal) leadModal.classList.remove("active");
        leadForm.reset();
        isPriorityListRequest = false;
        userCoordinates = null;
        if (phoneInput) phoneInput.value = formatPhoneNumber("");

      } catch (err) {
        console.error("Critical Lead Submission Error:", err);
        showToast("error", err.message || "Erreur d'envoi. Veuillez réessayer.");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = "Valider ma Demande";
        }
      }
    });
  }

  // Accordion FAQ
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question");
    if (question) {
      question.addEventListener("click", () => {
        item.classList.toggle("active");
      });
    }
  });

  // Bind Navbar GPS trigger buttons
  const btnTesterAdresseNav = document.getElementById("btnTesterAdresseNav");
  if (btnTesterAdresseNav) {
    btnTesterAdresseNav.addEventListener("click", () => openOrderModalWithGPS(false, true));
  }
  if (btnTesterAdresseMobile) {
    btnTesterAdresseMobile.addEventListener("click", () => openOrderModalWithGPS(false, true));
  }

  function normalizeText(text) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  // Coverage Check Form Handler
  const coverageForm = document.getElementById("coverageForm");
  if (coverageForm) {
    coverageForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const addressInput = document.getElementById("addressInput");
      if (!addressInput) return;

      const userQuery = addressInput.value;
      const normalizedInput = normalizeText(userQuery);

      if (!normalizedInput) {
        showToast("warning", "Veuillez entrer un nom de quartier.");
        highlightInputError(addressInput);
        return;
      }

      const isCovered = COVERED_ZONES.some((zone) =>
        normalizedInput.includes(normalizeText(zone))
      );

      if (isCovered) {
        if (window.Swal) {
          Swal.fire({
            icon: "success",
            title: "Zone Couverte !",
            html: `
              <p>Le secteur <strong>"${userQuery}"</strong> est dans notre périmètre.</p>
              <p style="margin-top: 0.5rem; font-size: 0.85rem; color: #94a3b8;">
                Pour finaliser votre commande, vous allez choisir votre forfait et partager votre position GPS exacte.
              </p>
            `,
            showCancelButton: true,
            confirmButtonText: "Choisir un Forfait & Commander",
            cancelButtonText: "Annuler",
            confirmButtonColor: "#7c3aed",
            cancelButtonColor: "#6b7280",
          }).then((result) => {
            if (result.isConfirmed) {
              openOrderModalWithGPS(false, true);
            }
          });
        }
      } else {
        if (window.Swal) {
          Swal.fire({
            icon: "info",
            title: "Pas de Couverture Directe",
            html: `
              <p>La zone <strong>"${userQuery}"</strong> n'est pas encore répertoriée dans notre couverture active.</p>
              <p style="margin-top: 0.5rem; font-size: 0.85rem; color: #94a3b8;">
                Choisissez un forfait pour être inscrit en liste prioritaire avec vos coordonnées GPS.
              </p>
            `,
            showCancelButton: true,
            confirmButtonText: "S'inscrire sur Liste Prioritaire",
            cancelButtonText: "Annuler",
            confirmButtonColor: "#7c3aed",
            cancelButtonColor: "#6b7280",
          }).then((result) => {
            if (result.isConfirmed) {
              openOrderModalWithGPS(true, true);
            }
          });
        }
      }
    });
  }
});