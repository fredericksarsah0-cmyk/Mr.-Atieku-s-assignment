# St. Jude Medical Center — Hospital Management System (HMS)

> **University Information Technology Capstone Project**  
> *Architected with Next.js 14, TypeScript, Prisma ORM, Hosted Neon PostgreSQL, Argon2id Cryptographic Hashing, and Mandatory Two-Factor (2FA) OTP Verification.*

---

## 1. Executive Summary & Architecture Overview

The **St. Jude Medical Center Hospital Management System (HMS)** is an enterprise-grade clinical administration and patient health portal engineered for university capstone evaluation. It provides a secure, role-restricted web platform designed with a **Zero-Trust Cybersecurity Architecture** ensuring that private electronic health records (EHR), physician availability, and clinical consultations remain protected at rest and in transit.

### Architectural Stack

- **Frontend & Routing:** [Next.js 14](https://nextjs.org/) (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend Services:** Next.js Server Actions and Route Handlers with strict server-side validation.
- **Database Engine:** PostgreSQL hosted on [Neon](https://neon.tech/) with connection pooling and SSL encryption.
- **Data Layer (ORM):** [Prisma ORM 5.22](https://www.prisma.io/) enforcing relational constraints, exclusion locks, and indexed lookups.
- **Cybersecurity & Password Hashing:** RFC 9106 compliant **Argon2id** with a unique per-user 128-bit CSPRNG cryptographic salt and a high-entropy server-side pepper (`PASSWORD_PEPPER`).
- **Two-Factor Authentication (2FA):** Mandatory 6-digit numeric CSPRNG One-Time Password (OTP) dispatched via [Resend](https://resend.com/) transactional email (with optional Twilio SMS support), verified against SHA-256 HMAC cryptographic hashes with a strict 5-minute time-to-live (TTL) and brute-force rate-limiting.
- **Session Architecture:** High-entropy cryptographically generated session tokens persisted in the database and issued via HTTP-Only, Secure, `SameSite=Lax` cookies (`hms_session`).

---

## 2. Core Functional Modules

### A. Authentication & Mandatory 2FA OTP Protocol
- **Step 1 (Master Credentials):** User submits username or email and password. Server verifies credentials using Argon2id against stored per-user salt and environment pepper.
- **Step 2 (Identity Challenge):** A 6-digit numeric OTP is generated via system CSPRNG (`crypto.randomInt`), hashed with SHA-256 HMAC, and stored in `otp_challenges`. The plaintext OTP is dispatched to the user's verified address.
- **Step 3 (Cryptographic Session):** Upon constant-time hash verification, the single-use OTP is marked `isUsed: true`, an active session is persisted in PostgreSQL, and an HTTP-Only session cookie is established.

### B. Patient Management & Electronic Health Records (EHR)
- Unique patient identifiers formatted as `PAT-2026-XXXX`.
- Demographic profiles, verified contact information, residential address, emergency contact person, relation, and phone.
- Documented allergy profiles (e.g., Penicillin, Latex) and blood groups.
- Chronological consultation history recording symptoms, diagnoses, prescribed non-prescription treatments, and clinical observations.
- Strict authorization: Ordinary patients can strictly access only their own medical history; unauthorized ID queries are rejected with HTTP 403 Forbidden.

### C. Doctor Management & Scheduling
- Unique clinician identifiers formatted as `DOC-2026-XXXX`.
- Medical board credentials, surgical specialties, departments, contact data, and consultation suite locations.
- Granular weekly working hours, appointment slot durations (15/30/45/60 min), and scheduled meal breaks.
- Doctor leave exceptions (annual leave, conferences) preventing bookings on absent calendar days.

### D. Appointment Booking & Double-Booking Prevention Engine
- Dynamic calendar slot selector.
- Server-side atomic validation preventing double-booking:
  1. Verifies doctor is on active duty and not on approved leave on the selected date.
  2. Verifies appointment time does not overlap with physician lunch/break periods.
  3. Verifies no other active appointment exists for that doctor during the requested time window (`HTTP 409 Conflict`).
  4. Verifies the patient does not have a concurrent appointment elsewhere.
- Real-time appointment status management (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`).

### E. First-Aid Inventory & Emergency Care Guidance
- Non-prescription first-aid supplies categorized into: *Antiseptics & Cleansers, Dressings & Bandages, Burn Care, Cryotherapy & Sprains, and Emergency Resuscitation*.
- Minimum stock threshold monitoring with automated visual **Low Stock** alert banners.
- Mandatory storage instructions, expiration dates, contraindications, child precautions, and explicit guidance on when hospital ER trauma care is required.
- Cryptographically audited inventory movements (`RESTOCK`, `DISPENSED`, `EXPIRED_DISCARD`, `ADJUSTMENT`).

### F. Security Audit Logging
- Immutable administrative trail capturing `LOGIN_SUCCESS`, `LOGIN_FAILED`, `OTP_GENERATED`, `OTP_VERIFIED`, `OTP_EXPIRED`, `PATIENT_CREATED`, `APPOINTMENT_BOOKED`, and `FIRST_AID_UPDATED`.
- Records actor, entity type, entity ID, remote IP address, browser User-Agent, and event timestamps.

---

## 3. Preconfigured Demonstration Accounts

Run `npm run db:seed` to populate the database with these fictional demonstration credentials:

| Role | Username | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | `admin` | `admin@stjudemedical.org` | `Admin@Hospital2026!` | Full administrative access: Patient registry, clinician scheduling, appointment approvals, inventory restock, and security audit logs. |
| **USER (Patient)** | `patient_john` | `john.doe@example.com` | `Patient@Hospital2026!` | Verified patient: View personal health profile, view chronological medical visits, book appointments, and cancel personal bookings. |
| **USER (Clinician)** | `dr_sarah` | `dr.sarah@stjudemedical.org` | `Doctor@Hospital2026!` | Attending Cardiologist: Review clinical schedule, view departmental appointments, and patient consultation records. |

---

## 4. Local Installation & Setup Guide

### Prerequisites
- **Node.js:** v20.9.0 or newer (tested on Node v24.20.0 LTS)
- **Package Manager:** npm v10+ (tested on npm 11.19.0)
- **Database:** Hosted Neon PostgreSQL (or local PostgreSQL 15+)

### Step-by-Step Instructions

1. **Clone the Repository & Navigate to Workspace:**
   ```bash
   cd "PUIT24110007_SIMPLE_LOGIN_SYSTEM - Copy (2)"
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create `.env` based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Set your Neon connection strings, pepper, and session secret:
   ```env
   # Neon PostgreSQL Connection URLs
   DATABASE_URL="postgresql://username:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
   DIRECT_URL="postgresql://username:password@ep-sample.us-east-2.aws.neon.tech/neondb?sslmode=require"

   # Cryptographic Keys (Min 32 chars)
   PASSWORD_PEPPER="e7c81a5392d42b919a712f8e1234908ef12847ab59c0326e479831efcb43a19b"
   SESSION_SECRET="9a4b3d810237ca58619bc489f10928e461a2938475c02b3e4f6a781920394857"

   # Transactional Email for 2FA OTP Delivery (Resend.com)
   RESEND_API_KEY="re_sample_apiKey_here"
   RESEND_FROM_EMAIL="Hospital Security <onboarding@resend.dev>"

   # Application URL
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Synchronize Database Schema & Seed Data:**
   ```bash
   # Push schema to PostgreSQL database
   npm run db:push

   # Seed demonstration accounts, doctors, patients, and supplies
   npm run db:seed
   ```

5. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Navigate to [http://localhost:3000](http://localhost:3000) in your web browser.

6. **Verify Production Build:**
   ```bash
   npm run build
   ```

---

## 5. Deployment Guide: GitHub & Vercel

### A. Pushing to GitHub
1. Initialize repository and stage files:
   ```bash
   git init
   git add .
   git commit -m "feat: complete hospital management system with Argon2id 2FA and clinical modules"
   ```
2. Link to your GitHub remote and push:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<your-username>/hospital-management-system.git
   git push -u origin main
   ```

### B. Deploying to Vercel
1. Log in to [Vercel](https://vercel.com/) and click **"Add New Project"**.
2. Import the GitHub repository.
3. In **Environment Variables**, add:
   - `DATABASE_URL` (Pooled Neon URL)
   - `DIRECT_URL` (Direct Neon URL)
   - `PASSWORD_PEPPER` (Production server-side pepper)
   - `SESSION_SECRET` (Production session secret)
   - `RESEND_API_KEY` (Live Resend API key)
   - `RESEND_FROM_EMAIL` (Verified sender domain)
   - `NEXT_PUBLIC_APP_URL` (Live Vercel URL, e.g. `https://your-hms.vercel.app`)
4. In **Build & Development Settings**, set the Build Command to:
   ```bash
   prisma generate && next build
   ```
5. Click **Deploy**. Vercel will build and deploy the production bundle.

---

## 6. University Lecturer Demonstration Script

When demonstrating this project to a university evaluator or supervisor, follow this structured walkthrough:

1. **Cybersecurity Hardening Demonstration:**
   - Open `/login` and enter invalid credentials. Point out the generic error message preventing account harvesting.
   - Enter `admin` / `Admin@Hospital2026!`. Explain that Argon2id is calculating with 64MB memory cost, salt, and pepper.
   - Show the 2FA verification screen (`/verify-otp`). Highlight the 5-minute countdown timer and rate-limiting cooldown. Explain how OTPs are stored in hashed format (SHA-256 HMAC) so database leaks never compromise pending 2FA challenges.
   - Verify OTP and show how the server establishes an HTTP-Only, Secure session cookie.

2. **Role-Based Access Control (RBAC):**
   - In Admin view, navigate to `/dashboard/audit` to display live audit logs.
   - Log out, sign in as `patient_john`. Show how the interface adapts to the patient portal, displaying only John's appointments and clinical visits.
   - Attempt to access `/dashboard/audit` as a regular user — show the server-side access denial screen.

3. **Conflict Prevention & Double-Booking Safeguard:**
   - Go to `/dashboard/appointments` and book an appointment with `Dr. Sarah Jenkins` on an upcoming weekday at 10:00 AM.
   - Attempt to book the exact same physician and time slot again. Show how the server catches the collision and raises an explicit `409 Conflict` alert.

4. **Clinical Health Records & First-Aid Inventory:**
   - Show the First-Aid Inventory with category filtering, low-stock warnings, and emergency medical referral guidance.
   - Log a stock restock movement and show how the inventory balance and audit trail update automatically.
