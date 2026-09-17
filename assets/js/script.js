document.addEventListener("DOMContentLoaded", () => {
  let userCoordinates = null;
  let activeTab = "residential";
  let isPriorityListRequest = false;

  /* ==========================================================================
     Standardized UI & Error Handling Helpers
     ========================================================================== */

  // Inject High z-index Rule for SweetAlert Toasts & Modals
  if (!document.getElementById("swal-toast-zindex-style")) {
    const style = document.createElement("style");
    style.id = "swal-toast-zindex-style";
    style.textContent = `
      .swal2-container.swal2-top-end,
      .swal2-container {
        z-index: 99999 !important;
      }
      .swal2-toast {
        font-family: inherit !important;
        border-radius: 8px !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Consistent Toast Notification Helper
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

  // Consistent Input Error Animation & Red Highlight
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
     UISP CRM API Configuration
     ========================================================================== */
  const UISP_CONFIG = {
    baseUrl: "https://toutnet.unmsapp.com",
    appKey: "fLJoh6sBrjGiP2US3PYnIkVg6cJ+zkofxieCguxa5/OkhHyqpS+Ba4aKbBrq42fU",
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

  const COVERED_ZONES = [
    "delmas",
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
    "bourdon",
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
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
          );
        });
      }
    });
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

    if (promptPlanSelect) {
      const planPicked = await selectPlanModal();
      if (!planPicked) return;
    }

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

  const leadForm = document.getElementById("leadForm");
  const phoneInput = document.getElementById("phone");

  // Phone Formatter
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

  // Helper to check if user coordinates fall inside any UISP CRM Service Area
  const checkUISPCoverage = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `${UISP_CONFIG.baseUrl}/crm/api/v1.0/service-areas`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Auth-App-Key": UISP_CONFIG.appKey,
          },
        },
      );

      if (!response.ok) {
        console.warn(
          "Could not fetch service areas from UISP CRM, defaulting to manual/list check.",
        );
        return null; // Fallback gracefully if endpoint isn't accessible
      }

      const serviceAreas = await response.json();
      if (!Array.isArray(serviceAreas) || serviceAreas.length === 0) {
        return null;
      }

      // Ray-Casting Point-in-Polygon check algorithm
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

      // Iterate through configured Service Areas
      for (const area of serviceAreas) {
        if (area.geometry && area.geometry.coordinates) {
          // UISP Polygon coordinates format: [[[lng, lat], [lng, lat], ...]]
          const polygonCoords = area.geometry.coordinates[0];
          const isInside = isPointInPolygon(
            [longitude, latitude],
            polygonCoords,
          );
          if (isInside) {
            return { isCovered: true, areaName: area.name || "Zone Couverte" };
          }
        }
      }

      return { isCovered: false, areaName: null };
    } catch (err) {
      console.error("UISP Service Area API Error:", err);
      return null; // Return null on error to allow graceful fallback
    }
  };

  /* ==========================================================================
     Form Submission Sending Lead Data to UISP CRM API
     ========================================================================== */
  if (leadForm) {
    leadForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // 1. Standardized Name Validation
      const nameInput = document.getElementById("name");
      const name = nameInput ? nameInput.value.trim() : "";

      if (!name) {
        showToast(
          "error",
          "Veuillez entrer votre nom complet ou le nom de l'entreprise.",
        );
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
          (COOLDOWN_TIME - (Date.now() - parseInt(lastSubmit, 10))) / 1000,
        );
        showToast(
          "warning",
          `Patientez ${remainingSeconds}s avant de réessayer.`,
        );
        return;
      }

      // 4. Standardized Haitian Phone Validation [2-5]
      const rawPhone = phoneInput ? phoneInput.value : "";
      const cleanedPhone = rawPhone.replace(/\s+/g, "");
      const haitiPhoneRegex = /^(?:\+509)?[2-5]\d{7}$/;

      if (!haitiPhoneRegex.test(cleanedPhone)) {
        showToast("error", "Numéro haïtien invalide (+509 2-5XX XXXX).");
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

      // 5b. Perform UISP CRM Coverage Verification
      /* if (window.Swal) {
        Swal.fire({
          title: "Vérification de la couverture...",
          text: "Interrogation du réseau AirFiber UISP en cours.",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });
      }

      const coverageResult = await checkUISPCoverage(
        userCoordinates.latitude,
        userCoordinates.longitude,
      );

      console.log("Coverage result: ", coverageResult) */

      // 6. Submit Lead to UISP CRM API
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
            text: "Nous soumettons votre demande.",
            allowOutsideClick: false,
            confirmButtonColor: "#7c3aed",
            didOpen: () => Swal.showLoading(),
          });
        }

        // Split name into First / Last Name for UISP
        const nameParts = name.trim().split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ") || nameParts[0];

        // Conforming payload strictly to UISP CRM API Client schema
        const uispPayload = {
          isLead: true,
          clientType: activeTab === "business" ? 2 : 1, // 1 = Individual, 2 = Company
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
          note: `Lead Web Site - Plan : ${formattedPlanName} | Zone Couverte : ${isPriorityListRequest ? "NON" : "OUI"}`,
        };

        const response = await fetch(
          `${UISP_CONFIG.baseUrl}/crm/api/v1.0/clients`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Auth-App-Key": UISP_CONFIG.appKey,
            },
            body: JSON.stringify(uispPayload),
          },
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("UISP CRM Error Details:", errorData);

          const validationMessage = errorData.errors
            ? Object.entries(errorData.errors)
                .map(
                  ([field, msg]) =>
                    `${field}: ${Array.isArray(msg) ? msg.join(", ") : msg}`,
                )
                .join(" | ")
            : errorData.message || `Erreur API UISP (${response.status})`;

          throw new Error(validationMessage);
        }

        localStorage.setItem(LAST_SUBMIT_KEY, Date.now().toString());

        const successTitle = isPriorityListRequest
          ? "Inscrit sur Liste Prioritaire !"
          : "Demande envoyée avec succès !";

        if (window.Swal) {
          await Swal.fire({
            icon: "success",
            title: successTitle,
            html: `
              <p>Merci <strong>${name}</strong> !</p>
              <p style="margin-top:0.5rem; font-size:0.9rem; color:#64748b;">
                Nous avons reçu votre demande pour le forfait <strong>${currentPlan.speed}</strong>, pour les coordonnées GPS : <br><code>${gpsString}</code>.
              </p>
              <p style="margin-top:0.5rem; font-size:0.85rem; color:#94a3b8;">
                Notre équipe vous contactera prochainement au : <br> <strong>${rawPhone}</strong>.
              </p>
            `,
            confirmButtonColor: "#7c3aed",
          });
        }

        // Reset form and close modal ONLY after successful API response
        if (leadModal) leadModal.classList.remove("active");
        leadForm.reset();
        isPriorityListRequest = false;
        userCoordinates = null;
        if (phoneInput) phoneInput.value = formatPhoneNumber("");
      } catch (err) {
        console.error("UISP Lead Submission Error:", err);

        if (window.Swal) {
          Swal.fire({
            icon: "error",
            title: "Échec de l'envoi",
            text:
              err.message ||
              "Impossible de contacter le serveur CRM UISP. Réessayez plus tard.",
            confirmButtonColor: "#ef4444",
          });
        } else {
          alert(`Erreur d'envoi: ${err.message}`);
        }
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
        showToast("error", "Veuillez entrer un nom de quartier.");
        highlightInputError(addressInput);
        return;
      }

      const isCovered = COVERED_ZONES.some((zone) =>
        normalizedInput.includes(normalizeText(zone)),
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
