# AssetFlow — Task Tracker

> Last Updated: 2026-07-12
> Legend: `[x]` Done · `[/]` In Progress · `[ ]` Not Started

---

## Task 1 — Foundation: Auth, Prisma, RBAC & Core Infrastructure

### 1.1 Project Setup & Dependencies
- [x] Install runtime dependencies (`better-auth`, `@prisma/client`, `zod`, `zustand`, `@tanstack/react-table`, `sonner`)
- [x] Install dev dependency (`prisma`)
- [x] Verify `next.config.ts` — check for any needed config updates
- [x] Set up `app/globals.css` — design system tokens (color palette, typography, spacing)

### 1.2 Prisma Schema & Neon DB Setup
- [x] Create `prisma/schema.prisma` with all models:
  - [x] `User` (with role enum: EMPLOYEE, ASSET_MANAGER, DEPARTMENT_HEAD, ADMIN)
  - [x] `Session`, `Account`, `Verification` (Better Auth required models)
  - [x] `Department` (self-relation for hierarchy, headId)
  - [x] `AssetCategory` (with customFields Json)
  - [x] `Asset` (with status enum, isBookable flag, auto-tag)
  - [x] `Allocation` (with status enum: ACTIVE, RETURNED, OVERDUE)
  - [x] `TransferRequest`
  - [x] `Booking` (with status enum: UPCOMING, ONGOING, COMPLETED, CANCELLED)
  - [x] `MaintenanceRequest` (with priority + status enums)
  - [x] `AuditCycle`, `AuditAssignment`, `AuditEntry`
  - [x] `Notification`
  - [x] `ActivityLog`
- [x] Create `.env.example` (template with placeholder values)
- [ ] Configure `.env.local` with real Neon connection string + Better Auth secret
- [ ] Run `npx prisma generate`
- [ ] Run `npx prisma db push` (against Neon)

### 1.3 Better Auth Setup
- [x] Create `lib/auth.ts` — initialize Better Auth with Prisma adapter
  - [x] Email/password provider configured
  - [x] Signup hardcoded to role `EMPLOYEE` (no self-elevation)
  - [x] Session strategy configured
- [x] Create `lib/auth-client.ts` — export client for React components
- [x] Create `app/api/auth/[...all]/route.ts` — catch-all route handler
- [x] Create `proxy.ts` — session-based route protection (renamed from middleware, exported as `proxy` per Next.js 16)

### 1.4 RBAC Utilities
- [x] Create `lib/rbac.ts` — role constants + permission matrix functions
- [x] Create `lib/rbac-server.ts` — `requireRole()` guard for Server Actions
- [x] Create `components/rbac/RoleGuard.tsx` — client-side role wrapper component

### 1.5 Zod Validation Schemas
- [x] `lib/validations/auth.ts` (login, signup)
- [x] `lib/validations/asset.ts`
- [x] `lib/validations/allocation.ts`
- [x] `lib/validations/booking.ts`
- [x] `lib/validations/maintenance.ts`
- [x] `lib/validations/audit.ts`
- [x] `lib/validations/organization.ts`

### 1.6 Zustand Global State Stores
- [x] `store/useAuthStore.ts` — current user, role, session
- [x] `store/useNotificationStore.ts` — unread count, notification list
- [x] `store/useUIStore.ts` — sidebar state, global loading

### 1.7 Auth UI Pages
- [x] `app/(auth)/login/page.tsx` — email/password form + Sonner toasts
- [x] `app/(auth)/signup/page.tsx` — name/email/password (no role selection)
- [x] `app/(auth)/forgot-password/page.tsx`

### 1.8 App Shell & Layout
- [x] `app/(dashboard)/layout.tsx` — session guard + sidebar/topnav wrapper
- [x] `components/layout/Sidebar.tsx` — role-aware navigation links
- [x] `components/layout/TopNav.tsx` — avatar, notification bell, sign out
- [x] `components/ui/` shared primitives:
  - [x] `Button`, `Input`, `Select`, `Badge`
  - [x] `Modal`, `Card`, `Skeleton`, `Avatar`
  - [x] `Tabs`, `DataTable` (TanStack Table wrapper)
  - [x] Barrel `components/ui/index.ts`
- [x] `lib/notifications.ts` — createNotification() helper
- [x] `lib/activity-log.ts` — logActivity() helper
- [x] Root layout updated with Sonner `<Toaster />`

#### Task 1 Verification
- [ ] `prisma db push` succeeds against Neon (user must configure `.env.local` first)
- [ ] Signup creates user with role `EMPLOYEE`
- [ ] Login/logout works end-to-end with Better Auth session
- [ ] RBAC guard blocks Employee accessing Admin-only route
- [x] `proxy.ts` replaces `middleware.ts` — function exported as `proxy` per Next.js 16 convention
- [x] All Zod v4 `error.issues` (not `.errors`) throughout — tsc passes with zero errors
- [x] `signOut()` called without args (Better Auth v1 react client doesn't accept `callbackURL`)
- [x] `authClient.requestPasswordReset()` replaces `forgetPassword()`

---

## Task 2 — Asset Management Core

### 2.1 Dashboard / Home Screen
- [ ] `app/(dashboard)/page.tsx` — KPI cards (parallel data fetching)
  - [ ] Assets Available, Allocated, Maintenance Today, Active Bookings
  - [ ] Pending Transfers, Upcoming Returns
  - [ ] Overdue returns section (highlighted)
  - [ ] Quick action buttons (role-guarded)
  - [ ] Recent activity feed
- [ ] `app/api/dashboard/route.ts` — aggregated KPI data

### 2.2 Organization Setup (Admin Only — 3 Tabs)
- [ ] `app/(dashboard)/organization/page.tsx` — Admin-only route with 3 tabs
- [ ] **Tab A — Department Management**
  - [ ] `components/organization/DepartmentTable.tsx` (TanStack Table)
  - [ ] Department form (parent dept dropdown, head assignment, status)
  - [ ] Server Actions: `createDepartment`, `updateDepartment`, `deactivateDepartment`
- [ ] **Tab B — Asset Category Management**
  - [ ] `components/organization/CategoryTable.tsx`
  - [ ] Category form with dynamic custom fields builder (JSON)
  - [ ] Server Actions: `createCategory`, `updateCategory`
- [ ] **Tab C — Employee Directory**
  - [ ] `components/organization/EmployeeTable.tsx` (TanStack Table, searchable)
  - [ ] Role promotion dropdown (Admin only: Employee → Dept Head / Asset Manager)
  - [ ] Status toggle Active/Inactive
  - [ ] Server Actions: `updateEmployeeRole`, `updateEmployeeStatus`

### 2.3 Asset Registration & Directory
- [ ] `app/(dashboard)/assets/page.tsx` — TanStack Table with filters + search
- [ ] `app/(dashboard)/assets/[id]/page.tsx` — asset detail, allocation & maintenance history
- [ ] `components/assets/AssetForm.tsx` — Zod-validated registration form
  - [ ] Auto-generated Asset Tag (AF-XXXX) displayed after save
  - [ ] Photo upload, "Is Bookable" toggle
- [ ] Server Actions: `registerAsset`, `updateAsset`, `updateAssetStatus`

### 2.4 Asset Allocation & Transfer
- [ ] `app/(dashboard)/allocation/page.tsx` — All Allocations / My Allocations views
- [ ] `components/allocation/AllocateModal.tsx` — conflict check + Transfer Request button
- [ ] `components/allocation/TransferRequestModal.tsx` — transfer workflow
- [ ] `components/allocation/ReturnModal.tsx` — condition check-in notes
- [ ] Server Actions: `allocateAsset` (with DB transaction guard), `returnAsset`, `createTransferRequest`, `approveTransferRequest`, `rejectTransferRequest`

#### Task 2 Verification
- [ ] Asset tag auto-generates as AF-0001, AF-0002, etc.
- [ ] Double-allocation blocked with "held by [Name]" message
- [ ] Transfer workflow moves through all states correctly
- [ ] Return sets asset back to Available status
- [ ] Employee Directory role promotion restricted to Admin

---

## Task 3 — Bookings, Maintenance & Audit

### 3.1 Resource Booking
- [ ] `app/(dashboard)/bookings/page.tsx` — Calendar + Table views
- [ ] `app/(dashboard)/bookings/new/page.tsx` — booking form with overlap validation
- [ ] Server Actions: `createBooking`, `cancelBooking`, `rescheduleBooking`
- [ ] Overlap rule: `startTime < existingEnd AND endTime > existingStart` (adjacent = allowed)

### 3.2 Maintenance Management
- [ ] `app/(dashboard)/maintenance/page.tsx` — TanStack Table with filters
- [ ] `components/maintenance/MaintenanceRequestForm.tsx` — Zod-validated form
- [ ] Workflow: PENDING → APPROVED/REJECTED → IN_PROGRESS → RESOLVED
- [ ] Asset status side-effects: APPROVED → UNDER_MAINTENANCE; RESOLVED → AVAILABLE
- [ ] Server Actions: `createMaintenanceRequest`, `approveMaintenanceRequest`, `rejectMaintenanceRequest`, `assignTechnician`, `resolveMaintenanceRequest`

### 3.3 Asset Audit
- [ ] `app/(dashboard)/audit/page.tsx` — Audit cycle list
- [ ] `app/(dashboard)/audit/[cycleId]/page.tsx` — cycle detail, per-asset marking
- [ ] `components/audit/AuditCycleForm.tsx` — scope, date range, auditor multi-select
- [ ] Auto-generated discrepancy report for flagged assets
- [ ] Close cycle → lock + update Missing assets to Lost status
- [ ] Server Actions: `createAuditCycle`, `assignAuditors`, `recordAuditEntry`, `closeAuditCycle`

### 3.4 Notifications & Activity Log
- [ ] `lib/notifications.ts` — `createNotification()` helper
- [ ] `lib/activity-log.ts` — `logActivity()` helper
- [ ] `app/api/notifications/route.ts` — GET (paginated) + PATCH (mark read)
- [ ] `app/(dashboard)/notifications/page.tsx` — notification feed + admin activity log
- [ ] Notification triggers wired into all relevant Server Actions:
  - [ ] Asset Allocated, Transfer Approved/Rejected
  - [ ] Maintenance Approved/Rejected
  - [ ] Booking Confirmed/Cancelled/Reminder
  - [ ] Overdue Return Alert
  - [ ] Audit Discrepancy Flagged

#### Task 3 Verification
- [ ] Booking overlap correctly rejected; adjacent booking allowed
- [ ] Maintenance approval flips asset to UNDER_MAINTENANCE
- [ ] Maintenance resolution flips asset back to AVAILABLE
- [ ] Audit cycle close updates Missing → Lost status on assets
- [ ] Notifications appear after all key events

---

## Task 4 — Reports, Analytics & Polish

### 4.1 Reports & Analytics Screen
- [ ] `app/(dashboard)/reports/page.tsx` — tab layout
  - [ ] Asset Utilization tab (most-used vs. idle, charts)
  - [ ] Maintenance Frequency tab
  - [ ] Lifecycle tab (due for maintenance / nearing retirement)
  - [ ] Department Summary tab
  - [ ] Booking Heatmap tab (hour × day grid)
  - [ ] Export tab (CSV per report)
- [ ] API routes: `utilization`, `maintenance`, `department`, `booking-heatmap`
- [ ] Install `recharts`: `bun add recharts`

### 4.2 Overdue Detection
- [ ] `app/api/cron/overdue-check/route.ts`
  - [ ] Flag allocations where `expectedReturnDate < now AND status = ACTIVE` → set OVERDUE
  - [ ] Create notifications for holders + Asset Managers

### 4.3 Global Polish & QA
- [ ] Sonner toast patterns on all Server Actions (success + error)
- [ ] Loading skeletons on all tables and KPI cards
- [ ] Empty states for all tables
- [ ] Mobile-responsive layouts (Tailwind breakpoints)
- [ ] Accessibility: ARIA labels, keyboard navigation on modals
- [ ] Error boundaries on all pages
- [ ] QR code per asset (`bun add qrcode.react`)
- [ ] Confirm dialogs for destructive actions
- [ ] `components/ui/ConfirmDialog.tsx`
- [ ] `components/ui/EmptyState.tsx`
- [ ] `components/ui/LoadingSkeleton.tsx`
- [ ] `components/ui/QRDisplay.tsx`

#### Task 4 Verification
- [ ] All report tabs show real data
- [ ] CSV export downloads correctly
- [ ] Overdue cron endpoint correctly flags and notifies
- [ ] All Sonner toasts appear on success/error
- [ ] Responsive layout works on mobile breakpoints
