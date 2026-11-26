# Vistaro Premium — B2B Procurement Marketplace & Event Services

> **Product Vision:** A serious, modern, editorial B2B sourcing and procurement platform connecting verified vendors with universities, enterprises, and event hosts.

Vistaro Premium is designed with a calm, spacious, dark-charcoal editorial aesthetic inspired by high-end B2B platforms like Valdera:
- **Main Background:** Flat charcoal (`#1F1F1F`)
- **Card Surfaces:** Differentiated charcoal surfaces (`#242424` / `#1D1D1D`)
- **Subtle Borders:** Precise structural borders (`#333333` / `#2E2E2E`)
- **Typography:** High-contrast crisp white (`#FFFFFF`) with muted secondary text (`#A1A1AA` / `#71717A`)
- **Accent:** Restrained lime green (`#D8FF45` with `#121212` text)
- **Zero AI Artifacts:** No neon gradients, no glowing buttons, no decorative grids, no emojis, and no confetti effects.

---

## 🏛️ Two Primary Entry Options

The application is structured around two clear entry flows with a single, shared role- and organisation-based authentication system:

### Option A: FIND TENDERS
- **For Vendors, Suppliers & Specialized Contractors**
- Discover public tenders, RFQs, and RFPs across audio/visual, catering, stage fabrication, LED broadcasting, security, and merchandise.
- Access confidential **Private Tenders** issued directly to your organisation.
- Benchmark technical criteria using the **Tender Readiness Checklist**.
- Submit sealed, confidential proposals with itemized breakdowns.
- Dedicated **Vendor Workspace** with Participation Tracker, Invited Tenders feed, and Direct Buyer Enquiries.

### Option B: PUBLISH TENDERS
- **For Universities, Enterprises, Summit Foundations & Event Committees**
- Publish structured procurement listings with detailed technical riders, submission deadlines, and budget disclosures.
- Choose between **PUBLIC TENDERS** (open to all verified suppliers) and **PRIVATE TENDERS** (restricted strictly to invited vendors).
- Invite vendors by official work email or from the verified partner directory.
- Review incoming submissions side-by-side in the **Institution Submissions Inbox**.
- Multi-criterion scoring (Technical Compliance, Price Competitiveness, Equipment Caliber) and clarification query threads.
- Record official contract award decisions with audited logs.

---

## 🔒 Public vs. Private Tenders Security Architecture

Vistaro enforces a strict, multi-tiered authorization model:

| Capability | Public Tenders | Private Tenders (By Invitation) |
| :--- | :--- | :--- |
| **Public Visitor Discovery** | Visible in Marketplace & Home | **Hidden** (Excluded from public queries) |
| **Unauthenticated Direct Link** | Full scope & specs readable | **403 Forbidden** (Access restricted screen) |
| **Uninvited Vendor Access** | Full scope readable, can bid | **403 Forbidden** (Blocked at API & UI) |
| **Invited Vendor Access** | Can bid & track readiness | **200 OK** (Full access + Sealed bidding) |
| **Uninvited Vendor Proposal** | Allowed if verified | **403 Forbidden** (Rejected by API) |
| **Competitor Bid Confidentiality** | 100% Confidential (403 to others) | 100% Confidential (403 to others) |
| **Institution Owner Access** | Submissions Inbox & Scoring | Full Inbox + Invitation Manager |

---

## 💻 Tech Stack & Deployment Readiness

- **Frontend:** React 19, Vite 8, Tailwind CSS 4, Lucide Icons.
- **Backend:** Node.js, Express REST API (`/api/v1`).
- **ORM & Database:** Prisma ORM 5.22, PostgreSQL relational schema, with atomic JSON local store fallback for instant zero-dependency testing.
- **Security & Validation:**
  - `helmet`: Secure HTTP headers with cross-origin resource policy.
  - `cookie-parser`: Secure HTTP-only cookies (`vistaro_token`).
  - `express-rate-limit`: Rate-limiting (300 req / 15 min on `/api`).
  - `cors`: Configurable CORS origins with credential support.
  - `zod`: Request body validation schemas for all critical mutation endpoints.
  - `bcryptjs`: Industry-standard salted password hashing.

---

## 🚀 Quick Start & Run Commands

### 1. Unified Single-Process Mode (Production / Preview)
Starts the Express server on port 5000, serving the REST API on `/api/v1` and the pre-built React SPA on `/`:
```bash
# From workspace root
cd server
node src/index.js
```
Open **`http://localhost:5000`** in your browser.

### 2. Full Development Mode (Hot-Reload)
In terminal 1 (Backend API):
```bash
cd server
node --watch src/index.js
```
In terminal 2 (Vite Frontend with API proxy):
```bash
cd client
pnpm run dev
```

### 3. Run Automated Test Suite
Run the 10 automated test cases verifying health, auth, private tenders, 403 enforcement, and proposal confidentiality:
```bash
cd server
node --test test/api.test.js
```

---

## 📦 Project Deliverables

1. **Clean Source Archive:** `VISTARO-PREMIUM-FINAL.zip` (197.46 KB, clean git archive excluding `node_modules` and temporary files). Also served at `/VISTARO-PREMIUM-FINAL.zip`.
2. **Git Repository:** Initialized with clean initial commit: `feat: Vistaro Premium Valdera redesign, B2B procurement marketplace, private tenders, and automated test suite`.
3. **Vercel Deployment Configuration:** Pre-configured `vercel.json` and `api/index.js` bridge for seamless frontend static build and serverless API execution.

---

## 🔑 Testing Credentials

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Vendor** | Rajesh Verma (Apex Audio) | `contact@apexaudio.com` | `password123` |
| **Vendor** | Chef Manpreet Singh (Royal Feast) | `orders@royalfeast.in` | `password123` |
| **Institution** | Dr. Arvind Sharma (Delhi Tech Univ) | `arvind.sharma@dtu.ac.in` | `password123` |
| **Service Customer** | Aman Mehta (Summit Organiser) | `aman@globalfinancesummit.org` | `password123` |
| **Admin** | Vistaro Operations Lead | `ops@vistaro.com` | `password123` |
