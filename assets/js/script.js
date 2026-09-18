document.addEventListener("DOMContentLoaded", () => {
  let userCoordinates = null;
  let activeTab = "residential";
  let isPriorityListRequest = false;

  /* ==========================================================================
     Standardized UI & SweetAlert2 Configuration
     ========================================================================== */

  // Inject Global SweetAlert Custom CSS for High Contrast Dark Mode
  if (!document.getElementById("swal-unified-style")) {
    const style = document.createElement("style");
    style.id = "swal-unified-style";
    style.textContent = `
      .swal2-container.swal2-top-end,
      .swal2-container {
        z-index: 99999 !important;
      }

      /* Base Modal Popup Styles */
      .swal2-popup {
        font-family: inherit !important;
        border-radius: 16px !important;
        padding: 1.75rem !important;
        background: #121026 !important;
        color: #f8fafc !important;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5) !important;
      }
      .swal2-title {
        font-size: 1.35rem !important;
        font-weight: 700 !important;
        color: #ffffff !important;
        margin-top: 0.5rem !important;
      }
      .swal2-html-container {
        font-size: 0.95rem !important;
        color: #cbd5e1 !important;
        margin-top: 0.75rem !important;
      }

      /* ==========================================
         TOAST OVERRIDES (Strict Selector Fix)
         ========================================== */
      .swal2-popup.swal2-toast {
        padding: 0.4rem 0.75rem !important;
        border-radius: 8px !important;
        width: auto !important;
        max-width: 300px !important;
      }
      .swal2-popup.swal2-toast .swal2-title {
        font-size: 1rem !important; /* Forces tiny title size */
        font-weight: 600 !important;
        line-height: 1.2 !important;
        margin: 0 !important;
        padding: 0 !important;
        color: #f8fafc !important;
      }
      .swal2-popup.swal2-toast .swal2-html-container {
        font-size: 0.9rem !important; /* Forces tiny body text size */
        margin: 0.15rem 0 0 0 !important;
        padding: 0 !important;
        color: #cbd5e1 !important;
      }
      .swal2-popup.swal2-toast .swal2-icon {
        transform: scale(0.55) !important;
        margin: 0 0.3rem 0 0 !important;
      }

      /* Standard Buttons & Form Inputs */
      .swal2-styled.swal2-confirm {
        background-color: #7c3aed !important;
        color: #ffffff !important;
        border-radius: 8px !important;
        font-weight: 600 !important;
        padding: 0.65rem 1.4rem !important;
      }
      .swal2-styled.swal2-cancel {
        background-color: #475569 !important;
        color: #ffffff !important;
        border-radius: 8px !important;
        font-weight: 500 !important;
        padding: 0.65rem 1.4rem !important;
      }
      .swal-custom-box {
        text-align: left;
        background: #1e1b4b;
        border: 1px solid #312e81;
        padding: 0.85rem;
        border-radius: 8px;
        font-size: 0.875rem;
        color: #e2e8f0;
        margin-top: 0.85rem;
      }
      .swal2-select {
        background-color: #1e1b4b !important;
        color: #ffffff !important;
        border: 1px solid #4338ca !important;
        border-radius: 8px !important;
      }
    `;
    document.head.appendChild(style);
  }

  // SweetAlert Theme Palette Defaults
  const SWAL_THEME = {
    confirmButtonColor: "#7c3aed",
    cancelButtonColor: "#475569",
    dangerButtonColor: "#ef4444",
    background: "#121026",
    color: "#ffffff",
  };

  // Helper 1: Standardized Toast Notifications
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
      Toast.fire({ icon, title });
    } else {
      alert(`${icon.toUpperCase()}: ${title}`);
    }
  };

  // Helper 2: Standardized Dialog Modals
  const showStandardAlert = (options) => {
    if (!window.Swal) {
      if (options.text || options.html) alert(options.title);
      return Promise.resolve({ isConfirmed: true });
    }

    return Swal.fire({
      confirmButtonColor: SWAL_THEME.confirmButtonColor,
      cancelButtonColor: SWAL_THEME.cancelButtonColor,
      ...options,
    });
  };

  // Helper 3: Standardized Loading Modal
  const showLoadingModal = (title, text) => {
    if (!window.Swal) return;
    return Swal.fire({
      title,
      text,
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });
  };

  const highlightInputError = (inputEl) => {
    if (!inputEl) return;

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

  /* ==========================================================================
     Mock Coverage Data & Pricing Tiers
     ========================================================================== */

  const PROXY_BASE_URL = "http://127.0.0.1:3001";

  const MOCK_COVERAGE_POLYGONS = [
    {
      name: "Delmas",
      geometry: {
        coordinates: [
          [
            [-72.33, 18.54],
            [-72.28, 18.54],
            [-72.28, 18.58],
            [-72.33, 18.58],
            [-72.33, 18.54],
          ],
        ],
      },
    },
    {
      name: "Pétion-Ville",
      geometry: {
        coordinates: [
          [
            [-72.3, 18.5],
            [-72.26, 18.5],
            [-72.26, 18.535],
            [-72.3, 18.535],
            [-72.3, 18.5],
          ],
        ],
      },
    },
    {
      name: "Tabarre",
      geometry: {
        coordinates: [
          [
            [-72.3, 18.57],
            [-72.25, 18.57],
            [-72.25, 18.6],
            [-72.3, 18.6],
            [-72.3, 18.57],
          ],
        ],
      },
    },
  ];

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

  let currentStep = 1;

  // Mobile Menu Controls
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileOverlay = document.getElementById("mobileOverlay");
  const mobileLinks = document.querySelectorAll(".mobile-link");
  const btnTesterAdresseMobile = document.getElementById(
    "btnTesterAdresseMobile",
  );

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
    const activeData =
      activeTab === "residential" ? RESIDENTIAL_TIERS : BUSINESS_TIERS;
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
      btnPlus.style.opacity =
        currentStep === activeData.length - 1 ? "0.4" : "1";
    }
  }

  // Tab Switchers
  if (tabInternet) {
    tabInternet.addEventListener("click", () => {
      activeTab = "residential";
      tabInternet.className = "tab-btn active";
      if (tabCombo) tabCombo.className = "tab-btn inactive";

      if (planCategoryTitle)
        planCategoryTitle.textContent = "Forfait Pro / Résidentiel";
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

      if (planCategoryTitle)
        planCategoryTitle.textContent = "AirFiber Enterprise Dedicated";
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
      const activeData =
        activeTab === "residential" ? RESIDENTIAL_TIERS : BUSINESS_TIERS;
      if (currentStep < activeData.length - 1) {
        currentStep++;
        updateWizardUI();
      }
    });
  }

  updateWizardUI();

  // Modal & Geolocation Logic
  const leadModal = document.getElementById("leadModal");
  const openLeadModal = document.getElementById("openLeadModal");
  const closeLeadModal = document.getElementById("closeLeadModal");
  const submitBtn = document.getElementById("btnSubmitLead");

  // Acquire GPS Position
  const captureGPSCoordinates = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        showToast("error", "La géolocalisation n'est pas supportée.");
        return reject(new Error("Geolocation unsupported"));
      }

      const requestPosition = () => {
        showStandardAlert({
          icon: "info",
          title: "Géolocalisation Requise",
          text: "Veuillez autoriser l'accès GPS pour vérifier si votre zone est couverte.",
          confirmButtonText: "Autoriser mon GPS",
          showCancelButton: true,
          cancelButtonText: "Annuler",
          allowOutsideClick: false,
        }).then((res) => {
          if (!res.isConfirmed) {
            showToast("warning", "Permission GPS refusée.");
            return reject(new Error("Permission denied by user"));
          }

          showLoadingModal(
            "Acquisition GPS...",
            "Calcul de votre position exacte en cours.",
          );

          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              userCoordinates = { latitude, longitude };

              const areaInput = document.getElementById("area");
              const formattedCoords = `GPS (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;

              if (areaInput) {
                areaInput.value = formattedCoords;
                areaInput.readOnly = true;
              }

              Swal.close();
              showToast("success", "Position GPS acquise avec succès.");
              resolve(userCoordinates);
            },
            (error) => {
              if (error.code === error.PERMISSION_DENIED) {
                showStandardAlert({
                  icon: "warning",
                  title: "Accès GPS Bloqué",
                  html: `
                    <p>L'accès à votre position est bloqué par votre navigateur.</p>
                    <div class="swal-custom-box">
                      <strong>Pour débloquer :</strong><br/>
                      1. Cliquez sur l'icône de cadenas 🔒 dans la barre d'adresse.<br/>
                      2. Activez l'autorisation <strong>"Localisation"</strong>.<br/>
                      3. Cliquez sur <strong>Réessayer</strong> ci-dessous.
                    </div>
                  `,
                  showCancelButton: true,
                  confirmButtonText: "Réessayer",
                  cancelButtonText: "Annuler",
                }).then((retryRes) => {
                  if (retryRes.isConfirmed) {
                    requestPosition();
                  } else {
                    reject(error);
                  }
                });
              } else {
                showToast(
                  "error",
                  "Impossible de récupérer votre position GPS.",
                );
                reject(error);
              }
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
          );
        });
      };

      requestPosition();
    });
  };

  // Ray-casting algorithm (Expects point as [lng, lat] and polygon as [[lng, lat], ...])
  const isPointInPolygon = (point, vs) => {
    const x = point[0],
      y = point[1];
    let inside = false;

    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      const xi = vs[i][0],
        yi = vs[i][1];
      const xj = vs[j][0],
        yj = vs[j][1];

      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }

    return inside;
  };

  // Checks coverage and returns details if inside a zone
  const checkMockCoverage = (latitude, longitude) => {
    // GeoJSON standard uses [longitude, latitude]
    const userPoint = [longitude, latitude];

    for (const area of MOCK_COVERAGE_POLYGONS) {
      const polygonCoords = area.geometry.coordinates[0];
      if (isPointInPolygon(userPoint, polygonCoords)) {
        return {
          isCovered: true,
          zoneName: area.name,
        };
      }
    }

    return {
      isCovered: false,
      zoneName: null,
    };
  };

  const selectPlanModal = async () => {
    const resOptions = RESIDENTIAL_TIERS.map(
      (p, i) =>
        `<option value="res_${i}">${p.speed} - ${p.price}/mois (Résidentiel/Pro)</option>`,
    ).join("");

    const busOptions = BUSINESS_TIERS.map(
      (p, i) =>
        `<option value="bus_${i}">${p.speed} - ${p.price}/mois (Dédié Entreprise)</option>`,
    ).join("");

    const { value: selectedVal } = await showStandardAlert({
      title: "Sélectionnez votre Forfait",
      html: `
        <p>Choisissez le forfait qui convient le mieux à vos besoins :</p>
        <select id="swalPlanSelect" class="swal2-input" style="width: 100%; margin-top: 1rem;">
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
      preConfirm: () => document.getElementById("swalPlanSelect").value,
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

  const syncZoneToModal = () => {
    const addressInput = document.getElementById("addressInput");
    const modalZoneInput = document.getElementById("zone");

    if (addressInput && modalZoneInput && addressInput.value.trim() !== "") {
      modalZoneInput.value = addressInput.value.trim();
    }
  };

  const openOrderModalWithGPS = async (
    priorityFlag = false,
    promptPlanSelect = false,
  ) => {
    isPriorityListRequest = priorityFlag;

    if (!userCoordinates) {
      try {
        await captureGPSCoordinates();
      } catch (err) {
        console.warn("Order cancelled: GPS coordinates missing.");
        return;
      }
    }

    if (userCoordinates) {
      const isCovered = checkMockCoverage(
        userCoordinates.latitude,
        userCoordinates.longitude,
      );

      if (isCovered) {
        showToast("success", "Votre position GPS est dans une zone couverte !");
      } else {
        isPriorityListRequest = true;

        const result = await showStandardAlert({
          icon: "info",
          title: "Pas de Couverture Directe",
          text: "Votre secteur ne figure pas encore dans notre zone d'accès actif. Inscrivez-vous sur notre liste prioritaire pour être prévenu dès que la zone sera desservie.",
          showCancelButton: true,
          confirmButtonText: "S'inscrire sur Liste Prioritaire",
          cancelButtonText: "Annuler",
        });

        if (!result.isConfirmed) return;
      }
    }

    if (promptPlanSelect) {
      const planPicked = await selectPlanModal();
      if (!planPicked) return;
    }

    syncZoneToModal();
    updateModalSubtitle();
    if (leadModal) leadModal.classList.add("active");
  };

  if (openLeadModal) {
    openLeadModal.addEventListener("click", () =>
      openOrderModalWithGPS(false, false),
    );
  }

  if (closeLeadModal && leadModal) {
    closeLeadModal.addEventListener("click", () =>
      leadModal.classList.remove("active"),
    );
  }

  document.addEventListener("keydown", (e) => {
    if (
      e.key === "Escape" &&
      leadModal &&
      leadModal.classList.contains("active")
    ) {
      leadModal.classList.remove("active");
    }
  });

  const leadForm = document.getElementById("leadForm");
  const phoneInput = document.getElementById("phone");

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
        phoneInput.setSelectionRange(
          phoneInput.value.length,
          phoneInput.value.length,
        );
      }
    });
  }

  /* ==========================================================================
     Form Submission Handling
     ========================================================================== */
  if (leadForm) {
    leadForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nameInput = document.getElementById("name");
      const name = nameInput ? nameInput.value.trim() : "";

      if (!name) {
        showToast(
          "error",
          "Veuillez saisir votre nom complet ou le nom de l'entreprise.",
        );
        highlightInputError(nameInput);
        return;
      }

      const zoneInput = document.getElementById("zone");
      let zone = zoneInput ? zoneInput.value.trim() : "";

      if (!zone) {
        showToast("error", "Veuillez préciser votre zone (ex: Delmas 31).");
        highlightInputError(zoneInput);
        return;
      }

      const honeypotEl = document.getElementById("address_hp");
      if (honeypotEl && honeypotEl.value.trim() !== "") {
        showToast("success", "Demande envoyée !");
        if (leadModal) leadModal.classList.remove("active");
        leadForm.reset();
        return;
      }

      const LAST_SUBMIT_KEY = "toutnet_last_lead_submit";
      const COOLDOWN_TIME = 2 * 60 * 1000;
      const lastSubmit = localStorage.getItem(LAST_SUBMIT_KEY);

      if (lastSubmit && Date.now() - parseInt(lastSubmit, 10) < COOLDOWN_TIME) {
        const remainingSeconds = Math.ceil(
          (COOLDOWN_TIME - (Date.now() - parseInt(lastSubmit, 10))) / 1000,
        );
        showToast(
          "warning",
          `Patientez ${remainingSeconds}s avant de réessayer.`,
        );
        return;
      }

      const rawPhone = phoneInput ? phoneInput.value : "";
      const cleanedPhone = rawPhone.replace(/\s+/g, "");
      const haitiPhoneRegex = /^(?:\+509)?[2-5]\d{7}$/;

      if (!haitiPhoneRegex.test(cleanedPhone)) {
        showToast("error", "Numéro de téléphone non valide (+509 2-5XX XXXX).");
        highlightInputError(phoneInput);
        return;
      }

      if (!userCoordinates) {
        try {
          await captureGPSCoordinates();
        } catch (err) {
          showToast("error", "Position GPS requise pour soumettre.");
          return;
        }
      }

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

        showLoadingModal("Envoi en cours...", "Nous soumettons votre demande.");

        const nameParts = name.trim().split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ") || nameParts[0];

        const turnstileInput = document.querySelector(
          '[name="cf-turnstile-response"]',
        );
        const turnstileToken = turnstileInput ? turnstileInput.value : null;

        const leadPayload = {
          isLead: true,
          clientType: activeTab === "business" ? 2 : 1,
          firstName: firstName,
          lastName: lastName,
          companyName: activeTab === "business" ? name.trim() : null,
          contacts: [
            {
              name: name.trim(),
              phone: cleanedPhone,
              isBilling: true,
              isContact: true,
            },
          ],
          street1: gpsString,
          city: zone,
          note: `Lead Web Site - Zone : ${zone} | Plan : ${formattedPlanName} | Zone Couverte : ${isPriorityListRequest ? "NON" : "OUI"}`,
          ...(turnstileToken && { turnstileToken }),
        };

        const response = await fetch(`${PROXY_BASE_URL}/api/leads`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(leadPayload),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          const errorMessage =
            result.error?.message ||
            result.error ||
            `Erreur Serveur (${response.status})`;
          throw new Error(errorMessage);
        }

        localStorage.setItem(LAST_SUBMIT_KEY, Date.now().toString());

        const successTitle = isPriorityListRequest
          ? "Inscrit sur Liste Prioritaire !"
          : "Demande envoyée avec succès !";

        await showStandardAlert({
          icon: "success",
          title: successTitle,
          html: `
            <p>Merci <strong>${name}</strong> !</p>
            <p>Nous avons reçu votre demande pour le forfait <strong>${currentPlan.speed}</strong> à <strong>${zone}</strong>.</p>
            <div class="swal-custom-box">
              <strong>Coordonnées GPS enregistrées :</strong><br/>
              <code>${gpsString}</code><br/><br/>
              Notre équipe vous contactera sous peu au <strong>${rawPhone}</strong>.
            </div>
          `,
          confirmButtonText: "Parfait",
        });

        if (leadModal) leadModal.classList.remove("active");
        leadForm.reset();
        isPriorityListRequest = false;
        userCoordinates = null;
        if (phoneInput) phoneInput.value = formatPhoneNumber("");
      } catch (err) {
        console.error("Lead Submission Error:", err);
        showStandardAlert({
          icon: "error",
          title: "Échec de l'envoi",
          text:
            err.message ||
            "Impossible de contacter le serveur. Réessayez plus tard.",
          confirmButtonColor: SWAL_THEME.dangerButtonColor,
        });
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
    btnTesterAdresseNav.addEventListener("click", () =>
      openOrderModalWithGPS(false, true),
    );
  }
  if (btnTesterAdresseMobile) {
    btnTesterAdresseMobile.addEventListener("click", () =>
      openOrderModalWithGPS(false, true),
    );
  }

  const coverageForm = document.getElementById("coverageForm");
  if (coverageForm) {
    coverageForm.addEventListener("submit", (e) => {
      e.preventDefault();
      openOrderModalWithGPS(false, true);
    });
  }
});
