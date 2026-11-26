# Vistaro Premium — Procurement Marketplace & Event Services

> **Product Promise:** Discover the right opportunities. Connect with the right vendors. Prepare and execute with confidence.

Vistaro is a premium procurement marketplace that unifies:
1. **Vendors & Suppliers** looking for high-value tender and procurement opportunities.
2. **Institutions, Organisations & Event Hosts** looking to publish procurement requirements.
3. **Turnkey Services & Promotions Delivery** from Vistaro's in-house team (Paid Campus Promotions, 4K Video Production, and Event Execution).
4. **Contextual AI Guide** grounded in authenticated app records with strict permission boundaries.

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
- Record official contract award decisions with celebratory confetti.

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

## 🎨 Approved Visual Identity & Design System

The application strictly implements the approved **"A. Public website"** design reference:
- **Hero Surface Gradient:** `bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950`
- **Subtle Blueprint Grid:** `bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem]`
- **Headline Gradient Accent:** `bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-300 bg-clip-text text-transparent`
- **Primary Accent Colors:** Navy/Slate `#0F172A`, Deep Blue `#1E3A8A`, Brand Blue `#2563EB`, Sky `#38BDF8`
- **Typography:** Inter / system font with tight tracking, generous whitespace, and high-contrast readable hierarchy.
- **Micro-interactions:** Smooth hover transitions, status pills, and celebratory canvas confetti on submissions and awards.

---

## 💻 Tech Stack & Deployment Readiness

- **Frontend:** React 19, Vite 8, Tailwind CSS 4, Lucide Icons, Canvas Confetti.
- **Backend:** Node.js 24, Express REST API (`/api/v1`).
- **ORM & Database:** Prisma ORM 5.22, PostgreSQL relational schema, with atomic JSON local store fallback for instant testing.
- **Security & Validation:**
  - `helmet`: Secure HTTP headers with cross-origin resource policy.
  - `cookie-parser`: Secure HTTP-only cookies (`vistaro_token`).
  - `express-rate-limit`: Rate-limiting (300 req / 15 min on `/api`).
  - `cors`: Configurable CORS origins with credential support.
  - `zod`: Request body validation schemas for all critical mutation endpoints.
  - `bcryptjs`: Industry-standard salted password hashing.

---

## 🚀 Quick Start Guide

### Unified Single-Process Mode (Default)
Starts the backend server on port 5000, serving the REST API on `/api/v1` and the built client SPA on `/`:
```bash
# From workspace root
cd server
node src/index.js
```
Open **`http://localhost:5000`** in your browser.

### Full Development Mode (Hot-Reload)
In terminal 1 (Backend):
```bash
cd server
node --watch src/index.js
```
In terminal 2 (Frontend with Vite proxy):
```bash
cd client
pnpm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🧪 Automated Test Suite

Run the comprehensive 10-point test suite:
```bash
cd server
node --test test/api.test.js
```
All 10 tests execute and pass in < 1 second:
1. `API Health Check`
2. `Public Opportunity Discovery`
3. `Demo User Authentication & Role Token`
4. `Confidential Proposal Access Rules (403 Cross-Vendor Isolation)`
5. `Services & Promotions Catalogue`
6. `Contextual AI Assistant Query (Permission-Scoped)`
7. `Private Tender Access Enforcement (403 Forbidden for Uninvited & Visitors)`
8. `Uninvited Vendor Proposal Submission Forbidden (403)`
9. `Invited Tenders Endpoint for Vendors (/opportunities/invited)`
10. `Institution Tender Invitation Lifecycle (Invite & Revoke)`

---

## 🗄️ PostgreSQL Database & Migration Guide

The project contains a valid **Prisma 5.22** schema (`server/prisma/schema.prisma`) and prepared migration files in `server/prisma/migrations/`:
- `20261017145808_init`: Core users, organisations, opportunities, proposals, evaluations, enquiries.
- `20261021120000_add_service_requests`: Services, requests, quotes, milestones.
- `20261126180000_add_private_tenders`: `visibility` column, `tender_invitations` table, relational foreign keys, and compound uniqueness index.

### Safe Migration Steps (Never Drop Database!)
When connecting to a live PostgreSQL database:
```bash
# 1. Provide your live DATABASE_URL in server/.env
DATABASE_URL="postgresql://user:password@your-host:5432/vistaro?schema=public"

# 2. Validate schema with Prisma 5.22
node node_modules/prisma/build/index.js validate

# 3. Apply migrations non-destructively (preserves existing data)
node node_modules/prisma/build/index.js migrate deploy

# 4. Generate the Prisma client
node node_modules/prisma/build/index.js generate
```
> [!IMPORTANT]
> Never run `prisma migrate reset` in production environments. The migrations are designed to be additive and non-destructive.

---

## 👥 Demo Evaluation Accounts

Use the interactive **One-Click Persona Switcher** in the UI to evaluate the platform as:
- **Dr. Arvind Sharma** (Institution Buyer — Delhi Technical University)
- **Priya Nair** (Institution Host — Zenith Global Summits Foundation)
- **Rajesh Verma** (Vendor — Apex Audio, Lighting & Stagecraft; invited to Private Tender)
- **Chef Manpreet Singh** (Vendor — Royal Feast Hospitality & Catering; uninvited to Private Tender)
- **Aman Mehta** (Service Customer — Pulse Festival Organizing Committee)
- **Vistaro Operations Admin** (Admin — Services Manager & Operations Lead)
- **Public Visitor** (Unauthenticated Guest View)
