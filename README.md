# toutnet-website

This repository contains the front-end landing page and the backend proxy integration for ToutNet AirFiber. The project captures user geolocation, checks service availability, and securely relays lead data directly into the UISP CRM platform.

---

## 🏗️ Project Architecture

┌─────────────────────────┐          ┌──────────────────────────┐          ┌──────────────────────────┐
│   ToutNet Web Client    │  HTTPS   │    Render Proxy Server   │  HTTPS   │    UISP CRM Platform     │
│  (HTML / JS / Tailwind) │ ───────> │     (Express / Node.js)  │ ───────> │  (toutnet.unmsapp.com)   │
└─────────────────────────┘          └──────────────────────────┘          └──────────────────────────┘