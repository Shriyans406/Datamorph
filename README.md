# DataMorph 

DataMorph is an advanced, secure, and production-safe AI-powered business analytics ecosystem. It enables organizations to upload spreadsheeets, automatically infer schema architectures, generate detailed statistics, simulate live external data syncs, design dynamic dashboards, and schedule automated report dispatches.

---

## Key Modules

DataMorph is modularly structured, offering specialized capabilities via several dashboard modules:

1. **Analytics Dashboards (`/dashboard`)**  
   Interact with real-time analytics dashboards. Users can design dynamic visualization layouts, add/remove widgets (Bar, Line, Area, and Pie charts), and drag/resize widgets dynamically.
2. **Datasets Manager (`/datasets`)**  
   Upload spreadsheets (CSV or Excel), view column types, verify data cleanliness using automatic profiling, and browse inferred database schemas.
3. **External Data Connectors (`/connectors-test`)**  
   Simulate sync integrations for third-party tools such as Google Sheets, Airtable bases, or custom REST APIs, complete with scheduler cron logs and audits.
4. **Export & Report Center (`/export-test`)**  
   Configure scheduled automated reports (PDF, Excel, or CSV formats) and verify email outboxes. Supports simulated SMTP delivery or local mock capturing in Firestore.
5. **Performance Optimization Lab (`/optimizations-test`)**  
   Profile dataset query execution speeds, monitor AI response cache efficiency, and manage rate-limiting throttles.
6. **System Diagnostics Lab (`/testing-lab`)**  
   Verify structured application logging, simulate custom error-boundary fallbacks, and test system runtime crash resilience.
7. **SaaS Deployment Control (`/deployment-lab`)**  
   Monitor system telemetry, connectivity health checks, and trigger encrypted security backups of primary database collections.

---

## System Architecture

DataMorph uses a modern monorepo layout powered by **Turborepo** and **Next.js**:

```
.
├── apps/
│   └── web/                 # Primary Next.js 16 (Turbopack) frontend & API backend
├── packages/                # Placeholder directories for modular decoupling
│   ├── ai/
│   ├── analytics/
│   ├── firebase/
│   ├── shared/
│   └── ui/
├── firebase/                # Firebase Security Rules & Index Configurations
├── scripts/                 # Utility scripts (e.g. database backups)
└── package.json             # Workspace dependencies and turbo pipelines
```

### Stack Highlights
- **Framework:** Next.js 16 + React 19 + TypeScript
- **Styling:** Tailwind CSS + Lucide Icons + Shadcn
- **Database:** Firebase Firestore (with local Emulator Suite support)
- **Charts:** Recharts (Responsive, dark-mode optimized layouts)
- **Reporting:** jsPDF (PDF generation) + XLSX (Excel generation)
- **Email:** Nodemailer (SMTP mail dispatches)

---

## Prerequisites

Before running DataMorph locally, ensure you have installed:
- **Node.js** (v20 or higher is recommended)
- **npm** (v10+ or v11+)
- **Firebase CLI** (`npm install -g firebase-tools`)

---

## Installation

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd datamorph
   ```

2. **Install Workspace Dependencies**
   Run the installation script in the root directory. This bootstraps the Turborepo workspace packages:
   ```bash
   npm install
   ```

---

## Local Development Setup

To run DataMorph fully locally, you need to spin up the Firebase Local Emulator Suite alongside the Next.js dev server.

### Step 1: Start Firebase Emulators
The emulators allow you to run Firestore, Auth, and Storage entirely offline without configuring a cloud Google account.
```bash
# In the project root:
firebase emulators:start
```
*This starts the Firestore database on port `8085` and the Emulator UI console on `http://localhost:4000`.*

### Step 2: Start Next.js Development Server
In a separate terminal window, start the Next.js application:
```bash
# In the project root:
npm run dev
```
*This starts the web app on `http://localhost:3000` using Next.js Turbopack.*

---

## Essential Configuration

If deploying to production or connecting to active external systems, configure the following environment variables:

Create an `.env.local` file under `apps/web/` with:
```ini
# Firebase Config (Required for Firebase Cloud connection, defaults to Emulator in dev)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=datamorph-7c835
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=datamorph-7c835.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=datamorph-7c835.appspot.com

# SMTP Configurations (Optional, for email reporting)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password

# Cron Security
CRON_SECRET=your-secure-passkey
```

---

## Available Development Commands

Run these scripts from the workspace root directory:

- **Start Dev Server:** `npm run dev` (starts the turbo dev server for all workspaces)
- **Production Build:** `npm run build` (builds the Next.js production bundle)
- **Lint Codebase:** `npm run lint` (runs ESLint static analysis)
- **Type Checking:** `npm run typecheck` (validates TypeScript compilation)

---

## Backup & Recovery

DataMorph comes with a secure local database backup script to export firestore snapshot collections:

1. **Locally via Command Line:**
   Ensure Google credentials are set up in your terminal shell, then run:
   ```bash
   node scripts/backup-firestore.js
   ```
   *Backups are saved as JSON files in the `/backups` folder.*

2. **Triggered over API:**
   Make an authenticated POST request to `/api/deployment/backup` containing the bearer token equal to your `CRON_SECRET` variable.
