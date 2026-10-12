# TidyUps Cleaning Service — Dispatch & Operations Platform

**TidyUps Cleaning Service Inc. — Live Production Dispatch Console**  
Target Production Domain: [https://app.tidyupscleaning.com](https://app.tidyupscleaning.com)  
Primary Service Territory: Edmonton, Alberta (YEG) and Surrounding Regional Corridors  
Executive Contact & Admin: `cleaningserviceyeg@gmail.com`

---

## 🚀 Production Platform Overview
`app.tidyupscleaning.com` is the live central operations console, territory dispatch board, and booking management system for TidyUps Cleaning Service Inc.

- **15 Mobile Cleaners & Solo/Team Units**: Tracking real home hubs in Edmonton (Chappelle, Charlesworth, Keheewin, Oliver, Clareview, Ambleside, Mill Woods, Queen Mary, Secord, Callingwood, Dechene, Westwood, Lorelei, The Hamptons, Jasper Park).
- **Core Cleaning Services**: Standard Cleaning, Deep Cleaning, and Move-Out Cleaning.
- **Interactive Google Maps Territory Engine**: Live fleet coordinates, real-time vehicle status (On Duty / Available / Off Duty), pin clustering, and Depot Hub addresses with Google Places autocomplete.
- **Fleet & Van Hub Configuration**: Direct vehicle identifier re-naming, cleaner driver assignment, color branding, and forward geocoding.
- **Dual-Layer Real-Time Persistence**:
  - Local resilient JSON database (`data/dispatch_store.json`).
  - Google Cloud Firestore (`ai-studio-cleaningserviced-8a2493ab-cb9d-4c28-a60b-c28e7d08d30e`) with strict Zero-Trust security rules (`firestore.rules`).
- **Two-Way Jobber Sync Hub**: GraphQL connection for calendar visits, clients database, quotes pipeline, and billing invoices.
- **Multi-User RBAC & Authentication**: Role switching and verified Firebase Authentication for Executive Owner (`cleaningserviceyeg@gmail.com`), Lead Dispatcher, and Field Cleaners.
- **AI Voice-to-Text & Lead Intake**: Direct microphone voice dictation and copy-paste intake for Facebook Ads & SMS leads.
- **Customer Booking Portal**: Public estimate request and self-serve booking interface.

---

## 🌐 Deep Link Navigation Routes

All deep links are active directly on `https://app.tidyupscleaning.com`:

| Route / Hash | View Destination | Primary Features |
|---|---|---|
| `https://app.tidyupscleaning.com/` | Interactive Live Map | Territory pins, fleet routing, job visits, van hubs |
| `https://app.tidyupscleaning.com/book` | Customer Booking Portal | Public estimate requests, pricing calculator |
| `https://app.tidyupscleaning.com/management` | Management Hub | Quotes, invoices, staff roster, Firestore sync |
| `https://app.tidyupscleaning.com/clients` | Clients Database | Client records, contact history, lead verdicts |
| `https://app.tidyupscleaning.com/quotes` | Quotes Pipeline | Estimates, approved quotes, Jobber sync |
| `https://app.tidyupscleaning.com/invoices` | Invoices & Billing | Due balances, payment status, Jobber invoicing |
| `https://app.tidyupscleaning.com/jobs` | Scheduled Calendar | Monthly/weekly visits, cleaner assignments |
| `https://app.tidyupscleaning.com/unscheduled` | Unscheduled Queue | Pending job requests, one-click approvals |
| `https://app.tidyupscleaning.com/staff` | Staff Roster Modal | CSV spreadsheet sync, archive & role management |
| `https://app.tidyupscleaning.com/support` | Support Desk | Operations policies, satisfaction guarantee |
| `https://app.tidyupscleaning.com/t&c` | Terms & Conditions | Customer agreements, deposit clauses |
| `https://app.tidyupscleaning.com/privacy-policy` | Privacy Policy | PIPEDA & Alberta PIPA compliance disclosures |

---

## 🛠️ Tech Stack & Architecture
- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, `@vis.gl/react-google-maps`.
- **Backend**: Express on Node.js / `tsx` with server-side proxy routes for Jobber, Geocoding, Places, and Google APIs.
- **Databases**: 
  - Google Cloud Firestore (`ai-studio-cleaningserviced-8a2493ab-cb9d-4c28-a60b-c28e7d08d30e`).
  - Persistent JSON store (`data/dispatch_store.json`).
- **Authentication**: Firebase Authentication with Google Sign-In and RBAC role validation.
- **AI Engine**: Google GenAI SDK (`@google/genai`).

---

## ⚡ Instant Setup & Local Launch

### 1. Install Dependencies
```bash
npm install
```

### 2. Launch Development Server
```bash
npm run dev
# OR
npm start
```

- Server starts on port `3000` (or `$PORT`).
- **No external database required to start**: Operational data is pre-populated in `data/dispatch_store.json`.
- **Hot Reloading & Full-Stack Proxy**: Express middleware powers live routes and proxies for Google Maps and Jobber.

---

## 🔗 Connecting Your Real Jobber Business Account

This application includes official **Jobber OAuth 2.0 two-way connection support** with live GraphQL integration for calendar visits, client database records, quotes, and billing invoices.

> **Safety Guarantee**: Imports are safe and verified. Successful syncs refresh your live dispatch board; failed syncs preserve existing data and show a clear error message. **No automatic destructive changes are sent to your real Jobber account.**

### Jobber Developer Center Settings:
- **Jobber Developer Center**: [https://developer.getjobber.com](https://developer.getjobber.com)
- **App Name**: TidyUps Cleaning Service Inc
- **OAuth Callback / Redirect URI**:
  ```
  https://app.tidyupscleaning.com/api/jobber/oauth/callback
  ```
- **App Base URL (`APP_BASE_URL`)**: `https://app.tidyupscleaning.com`
  *(This is simply your custom domain URL. It tells Jobber where to redirect back after login.)*
- **Jobber Client ID**: `27966135-e33e-4c2e-8dc3-ad7ba06dabb8`
- **Jobber Client Secret**: Securely saved and configured on your server instance.

### Step-by-Step Authorization:
1. In the top navigation bar of `https://app.tidyupscleaning.com`, click the **Jobber Sync** button.
2. Select **Custom Domain (Recommended)** as your redirect mode.
3. Click **Open Jobber in New Tab (Direct) →** (or copy the direct authorization link).
4. On the Jobber webpage, log in with your Jobber business credentials.
5. On the permissions screen, scroll to the bottom and click the green **"Allow Access"** button.
6. Jobber redirects to `https://app.tidyupscleaning.com/api/jobber/oauth/callback`, exchanges the authorization code for your access token, saves the credentials, and automatically returns you to the Dispatch Board with a green "Connected to Jobber!" confirmation!

### Direct Token Method (Instant Alternative):
If you prefer not to use OAuth, you can also generate a **Personal Access Token** in your [Jobber Developer Center](https://developer.getjobber.com) and paste it into the **Direct Personal Access Token** field in the modal. Click **Test & Verify Token** to immediately connect.

---

## 📦 How to Push to GitHub

1. Set your remote repository:
   ```bash
   git remote add origin https://github.com/<YOUR-GITHUB-USERNAME>/Day-1-Dispatch-Board-Tidyups.git
   ```

2. Push changes:
   ```bash
   git push -u origin main --tags
   ```

---

## 📄 License & Confidentiality
Property of TidyUps Cleaning Service Inc. (`cleaningserviceyeg@gmail.com`). All rights reserved. Live platform hosted at [https://app.tidyupscleaning.com](https://app.tidyupscleaning.com).
