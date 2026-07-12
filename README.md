# 🚀 AssetFlow ERP

### *Enterprise Asset & Resource Management System*

AssetFlow is a centralized, role-based Enterprise Resource Planning (ERP) platform designed to digitize and simplify how organizations track, allocate, and maintain physical assets and shared resources. By shifting away from manual spreadsheets and paper logs, AssetFlow establishes structured asset lifecycles, booking schedules, and maintenance approval paths with real-time operational visibility.

---

## 🎨 Tech Stack & Architecture Tokens

AssetFlow is built with a cutting-edge web stack optimized for type safety, performance, and developer experience.

![Next.js](https://img.shields.io/badge/Next.js-16.2-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Better Auth](https://img.shields.io/badge/Better_Auth-1.6-9C27B0?style=for-the-badge&logo=auth0&logoColor=white)
![Neon DB](https://img.shields.io/badge/Neon_DB-PostgreSQL-00E699?style=for-the-badge&logo=postgresql&logoColor=black)
![Zustand](https://img.shields.io/badge/Zustand-State-black?style=for-the-badge)
![Zod](https://img.shields.io/badge/Zod-Validation-3E67B1?style=for-the-badge)

---

## 🏗️ System Architecture

AssetFlow is structured around a clean modular architecture separating client views, server actions, state management, database schema design, and permission hierarchies.

```mermaid
graph TD
    Client["💻 Client Layer (React 19, Tailwind v4, Zustand)"]
    AuthClient["🔐 Better Auth Client"]
    ServerActions["⚙️ Next.js Server Actions / API Routes"]
    RBAC["🛡️ RBAC Permission Guard (lib/rbac)"]
    BetterAuthServer["🔑 Better Auth Engine (lib/auth)"]
    PrismaClient["📡 Prisma ORM Client (lib/db)"]
    PostgresNeon["🗄️ Neon PostgreSQL Database"]

    Client -->|User Interactions| ServerActions
    Client -->|Session Check| AuthClient
    AuthClient <-->|Token Exchange| BetterAuthServer
    ServerActions -->|Require Session & Permissions| RBAC
    RBAC -->|Authorize Action| PrismaClient
    BetterAuthServer -->|Session/User Store| PrismaClient
    PrismaClient <-->|SQL Queries| PostgresNeon
```

### Key Architectural Concepts
- **Next.js 16 App Router & Server Actions:** Server Actions handle business logic transactions (allocations, bookings, audit cycles) securely behind middleware guards.
- **Strict Role-Based Access Control (RBAC):** Built-in permission matrix (`lib/rbac.ts`) that maps actions to user roles: `ADMIN`, `ASSET_MANAGER`, `DEPARTMENT_HEAD`, and `EMPLOYEE`.
- **Better Auth Integration:** Provides session persistence and secure password hashing. To prevent self-elevation of roles, standard sign-up defaults all accounts to the `EMPLOYEE` role. Role promotions are restricted to the `ADMIN` setup interface.
- **Relational Integrity via Prisma:** A comprehensive schema maps users, departments, categories, assets, allocations, booking schedules, maintenance tickets, and audit cycles.

---

## ✨ Features Breakdown

### 🔒 1. Authentication & Role Security
* **Secure Sign-Up:** New registrations default to the `EMPLOYEE` role.
* **Role Promotion:** The Admin promotes designated users to `ASSET_MANAGER` or `DEPARTMENT_HEAD` from the Directory.
* **Session Controls:** Protected routes and UI elements depending on user credentials.

### 🖥️ 2. Real-Time Operational Dashboard
* **Dynamic KPIs:** Key stats showing Assets Available, Assets Allocated, Active Bookings, Overdue Returns, and Pending Transfers.
* **Quick Actions:** Create, book, or request repairs directly from the central hub based on permissions.
* **Alert Notifications:** Live alerts showing due return dates or booking schedules.

### 🏢 3. Organization Setup (Admin Core)
* **Department Hierarchy:** Manage parent-child departments and assign department heads.
* **Category Specifications:** Define asset categories (e.g. Laptops, Vehicles) and specify custom JSON attributes (e.g. Warranty, RAM size).
* **Employee Directory:** Search, verify, activate/deactivate accounts, and assign roles.

### 📂 4. Asset Registry & Lifecycle Tracking
* **Comprehensive Registration:** Record serial numbers, purchase cost, acquisition dates, conditions, and locations.
* **Auto-generated Identifiers:** Assets receive prefix tags (e.g. `AF-0014`) and QR codes upon creation.
* **State Machine:** Assets transition between: `AVAILABLE`, `ALLOCATED`, `RESERVED`, `UNDER_MAINTENANCE`, `LOST`, `RETIRED`, and `DISPOSED`.

### 🔄 5. Allocation & Conflict Handling
* **Double-Allocation Prevention:** Core transactions block concurrent allocations for single assets.
* **Peer-to-Peer Transfers:** Raise and approve transfers between users or departments if an asset is currently in use.
* **Overdue System:** Automatically triggers notification alerts when expected return dates are missed.

### 📅 6. Collision-Free Resource Booking
* **Calendar Overlap Check:** Prevents double-booking slots for shared resources (e.g. Meeting Rooms, Fleet Vehicles).
* **Booking States:** Track bookings through `UPCOMING`, `ONGOING`, `COMPLETED`, and `CANCELLED`.

### 🛠️ 7. Maintenance Request Workflow
* **Issue Pipeline:** Users report issues, managers approve/reject tickets, assign technicians, and track resolution history.
* **Automatic State Changes:** Assets shift to `UNDER_MAINTENANCE` upon approval and revert to `AVAILABLE` on resolution.

### 📝 8. Scheduled Audit Cycles
* **Verification Runs:** Set scope (by department or location), assign auditor teams, and track progress.
* **Audit States:** Verify assets as *Verified*, *Missing*, or *Damaged*.
* **Discrepancy Reporting:** System auto-generates discrepancies and marks confirmed missing assets as `LOST`.

### 📊 9. Reports & Analytics
* **Utilization Analytics:** Identify most-used vs. idle items and track maintenance frequencies.
* **Data Export:** Export custom tables and utilization reports.

---

## 📂 Project Structure

```bash
assetflow/
├── app/
│   ├── (auth)/                  # Signup, Login, and Password Recovery views
│   ├── (dashboard)/             # Main ERP interface pages (Assets, Bookings, Audits, etc.)
│   ├── actions/                 # Next.js Server Actions for secure transactional queries
│   └── api/                     # API route endpoints (Better Auth catch-all, cron, reports)
├── components/
│   ├── layout/                  # Persistent UI Shell (Sidebar, Top Navigation bar)
│   ├── ui/                      # Base component primitives (Buttons, Tables, Drawers, Modals)
│   ├── rbac/                    # RoleGuard wrapper component
│   └── [modules]/               # Specific feature components (assets, allocations, bookings)
├── context/                     # React Context providers for global settings
├── lib/
│   ├── auth.ts                  # Better Auth configuration (Prisma Neon Adapter)
│   ├── db.ts                    # Neon DB Serverless database client instantiation
│   ├── rbac.ts                  # Role hierarchy permissions matrix
│   ├── mail.ts                  # Nodemailer helper for transactional emails
│   └── validations/             # Unified Zod schemas for forms and APIs
├── prisma/
│   └── schema.prisma            # PostgreSQL Database tables structure
├── store/                       # Zustand client state management stores
├── seed-demo-accounts.ts        # Database mock data seeding script
└── promote-admin.ts             # Utility CLI script to promote a user to ADMIN
```

---

## ⚡ Setup & Installation

Follow these steps to set up and run AssetFlow locally.

### Prerequisites
* **Node.js** v20.x or higher
* **Bun** package manager (recommended, lockfile included)
* **PostgreSQL Database** (Neon PostgreSQL console account recommended)

### 1. Clone the Repository
```bash
git clone https://github.com/AbiNash1017/AssetFlowERP
cd AssetFlowERP
```

### 2. Install Dependencies
Using **Bun** (highly recommended as the project has `bun.lock` configured):
```bash
bun install
```
*Alternatively, you can run:*
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local` (or `.env` in your root directory):
```bash
cp .env.example .env.local
```
Open the `.env.local` file and fill in your details:
* **`DATABASE_URL`**: Your primary Neon PostgreSQL connection URL (e.g. `postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require`).
* **`BETTER_AUTH_SECRET`**: Generate a strong random key:
  ```bash
  # Generate using openssl:
  openssl rand -base64 32
  ```
* **`BETTER_AUTH_URL`**: Base URL of the app (`http://localhost:3000`).
* **SMTP Settings** (Optional): Add SMTP email details (e.g. Gmail App Passwords) if you want to test password reset and email triggers.

### 4. Push Database Schema
Sync the Prisma schema definitions directly to your Neon PostgreSQL instance:
```bash
npx prisma db push
```

### 5. Seed Demo Accounts
Run the seeding script to wipe the database and pre-populate it with realistic departments, categories, assets, bookings, maintenance requests, and user directories:
```bash
bun seed-demo-accounts.ts
```
*If using npm:*
```bash
npx tsx seed-demo-accounts.ts
```

---

## 🚀 Running the Project

### Start Development Server
```bash
bun dev
```
*Or with npm:*
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

### Build and Run for Production
```bash
bun run build
bun start
```
*Or with npm:*
```bash
npm run build
npm run start
```

---

## 👥 Demo Access Accounts

Use these pre-populated credentials to log in and immediately explore the different role perspectives in the AssetFlow ERP system:

| Role | Email | Password | Allowed Dashboards & Actions |
|---|---|---|---|
| **Admin** | `demo.admin@assetflow.dev` | `Demo@Admin123` | Full Org Setup, promote users, configure departments/categories, view global logs and analytics. |
| **Asset Manager** | `demo.manager@assetflow.dev` | `Demo@Manager123` | Register & edit assets, assign allocations, approve transfers, approve maintenance requests, run audits. |
| **Department Head** | `demo.head@assetflow.dev` | `Demo@Head123` | Approve transfers/allocations within department scope, book resources on department behalf. |
| **Employee** | `demo.employee@assetflow.dev` | `Demo@Employee123` | View own allocations, book resources on calendar, raise maintenance tickets, initiate transfers. |

---

## 🔍 Verification Checklist

To confirm everything runs correctly:
- [ ] **Database Setup:** Verify that `npx prisma db push` syncs without errors.
- [ ] **Seeding Success:** Verify the console outputs all 4 role types successfully after running `seed-demo-accounts.ts`.
- [ ] **Better Auth Portal:** Attempt registration; confirm that new accounts are initialized as `EMPLOYEE`.
- [ ] **RBAC Protection:** Log in as `demo.employee@assetflow.dev` and attempt to navigate to `/organization` or `/reports`. Confirm you are blocked.
- [ ] **Allocation Guard:** Test double-allocating asset `AF-0014` (assigned to Priya) to a new user; check that a transfer modal is suggested.
- [ ] **Resource Collision:** Navigate to Bookings and try booking Room B2 on an overlapping time slot to test collision avoidance.

---

*AssetFlow ERP System &copy; 2026. Made with ❤️ by the development team:*
* **Abinash Das** — [@AbiNash1017](https://github.com/AbiNash1017)
* **Rakshitha Mb** — [@Rakshitha-M-B](https://github.com/Rakshitha-M-B)
* **Achala Sharma** — [@AchalaSharma](https://github.com/AchalaSharma)


