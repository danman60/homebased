# Homebase Rebuild Plan

**Date:** 2026-03-18
**Source:** `/mnt/data/d/ClaudeCode/homebased` (developed code)
**Target:** `~/projects/homebased` (active repo, currently blank Next.js template)
**Goal:** Get Homebase to a working state as a family activity portal

---

## Current State

**Active repo** (`~/projects/homebased`): Default Next.js 15 template. Zero custom code.

**Developed repo** (`/mnt/data/d/ClaudeCode/homebased`): ~3,500+ lines of custom code with:
- Complete database schema (11 tables, RLS policies, seed data)
- Full API layer (tasks, availability, weekly view, calendar sync, OAuth)
- Component layer (Dashboard, WeeklyGrid, AlertsPanel, CalendarSync, WeeklyStats)
- Business logic (AlertsEngine, DatabaseClient, GoogleCalendarAdapter, GoogleMapsAdapter)
- Comprehensive TypeScript types (database, domain, API contracts)

**Why it doesn't work:**
1. Auth is not wired — no middleware, no session, RLS can't enforce
2. Hardcoded family ID in task creation API
3. Hardcoded timezone in calendar sync
4. Landing page is static mockup, not connected to dashboard
5. `next-auth` installed but unused (Supabase Auth is the intended strategy)
6. Alerts engine may be incomplete
7. No Supabase project provisioned (env vars are placeholders)
8. Feature flags defined in .env.example but never checked in code

---

## Phase 0: Port & Foundation
**Goal:** Get the developed code into the active repo and verify it compiles.

- [ ] **0.1** Copy all source code from `/mnt/data/d/ClaudeCode/homebased/src/` to `~/projects/homebased/src/`
- [ ] **0.2** Copy `supabase/` directory (migrations, seed)
- [ ] **0.3** Copy `tests/` directory
- [ ] **0.4** Copy config files: `playwright.config.ts`, `.env.example`
- [ ] **0.5** Copy docs: `ARCHITECTURE.md`, `DECISIONS.md`, `CONTRIBUTING.md`
- [ ] **0.6** Merge `package.json` — add missing deps: `@supabase/ssr`, `@supabase/supabase-js`, `googleapis`, `date-fns`, `lucide-react`, `tailwind-merge`, `class-variance-authority`
- [ ] **0.7** Remove `next-auth` — not used, Supabase Auth is the strategy
- [ ] **0.8** `npm install` and verify `npm run build` passes (fix any type errors)
- [ ] **0.9** Commit: "port: bring developed code into active repo"

---

## Phase 1: Supabase & Auth
**Goal:** Working database with authentication so RLS policies function.

- [ ] **1.1** Decide which Supabase project to use (CC&SS or new project) — **USER DECISION NEEDED**
- [ ] **1.2** Run migrations (`001_initial_schema.sql`, `002_row_level_security.sql`) against the Supabase project
- [ ] **1.3** Run seed data (`seed.sql`) for development/testing
- [ ] **1.4** Create `.env.local` with real Supabase URL + keys
- [ ] **1.5** Implement Supabase Auth middleware (`src/middleware.ts`):
  - Session refresh on every request
  - Redirect unauthenticated users to login
  - Pass auth context to API routes
- [ ] **1.6** Create login/signup page (`src/app/auth/page.tsx`):
  - Email + password auth via Supabase
  - Redirect to dashboard after login
- [ ] **1.7** Update all API routes to extract `user_id` and `family_id` from auth session instead of hardcoding
  - `/api/tasks` POST — replace hardcoded `f1234567...` with session family ID
  - `/api/availability` — same
  - `/api/weekly` — same
  - `/api/calendar/sync` — same + replace hardcoded timezone with family timezone
  - `/api/auth/google` — same
- [ ] **1.8** Update `DatabaseClient` to accept auth context (or derive family from session)
- [ ] **1.9** Test: Create a user, log in, verify RLS allows access to own family data only
- [ ] **1.10** Commit: "feat: Supabase auth with session middleware and protected routes"

---

## Phase 2: Core App Shell
**Goal:** User can log in, see the dashboard with real data, navigate between views.

- [ ] **2.1** Replace static landing page (`src/app/page.tsx`) with:
  - If authenticated → redirect to `/dashboard`
  - If not → show marketing/login page
- [ ] **2.2** Create `/dashboard` route (`src/app/dashboard/page.tsx`):
  - Server component that fetches from `/api/weekly`
  - Renders `<Dashboard>` component with real data
  - Loading states and error boundaries
- [ ] **2.3** Add navigation layout:
  - App header with family name, user name, logout
  - Sidebar or top nav (Dashboard, Tasks, Settings)
- [ ] **2.4** Verify Dashboard renders with seed data:
  - WeeklyGrid shows tasks in correct time slots
  - AlertsPanel shows generated alerts
  - WeeklyStats shows parent hours
  - CalendarSync shows connection status
- [ ] **2.5** Commit: "feat: app shell with authenticated dashboard route"

---

## Phase 3: Task Management
**Goal:** Full CRUD for tasks — create, view, edit, delete, drag-and-drop reschedule.

- [ ] **3.1** Task creation modal/form:
  - Title, notes, type (cyclical/project), assignee, due date
  - Recurrence rule builder for cyclical tasks (RRULE)
  - Validate required fields
- [ ] **3.2** Task editing — click a TaskCard to open edit modal
- [ ] **3.3** Task deletion with confirmation
- [ ] **3.4** Drag-and-drop in WeeklyGrid:
  - Drag a task to a new time slot → calls PUT `/api/tasks/[id]`
  - Visual feedback during drag
  - Conflict detection on drop (show warning if overlapping)
- [ ] **3.5** Task filtering — by type, assignee, date range
- [ ] **3.6** Verify all CRUD operations work end-to-end with real DB
- [ ] **3.7** Commit: "feat: task CRUD with drag-and-drop scheduling"

---

## Phase 4: Availability & Alerts
**Goal:** Parents can set availability blocks and see smart alerts.

- [ ] **4.1** Availability block creation UI:
  - Type selector (work/childcare/personal)
  - Time range picker
  - Recurring toggle with pattern builder
- [ ] **4.2** Availability blocks render in WeeklyGrid as colored backgrounds
- [ ] **4.3** Complete AlertsEngine implementation:
  - `checkMissingAssignments()` — tasks with due dates but no assignee
  - `checkMissingDetails()` — tasks missing notes or time
  - `checkSchedulingConflicts()` — task overlaps with work blocks
  - `checkRoleBalance()` — unequal work/childcare between parents
- [ ] **4.4** AlertsPanel shows real-time alerts with dismiss functionality
- [ ] **4.5** WeeklyStats shows accurate parent work/childcare hour totals
- [ ] **4.6** Commit: "feat: availability management and alerts engine"

---

## Phase 5: Google Calendar Integration
**Goal:** Bidirectional sync with Google Calendar works end-to-end.

- [ ] **5.1** Set up Google Cloud project + OAuth credentials — **USER DECISION: Do you want this?**
- [ ] **5.2** OAuth flow: User clicks "Connect Google Calendar" → consent → token stored
- [ ] **5.3** Pull sync: External calendar events appear as read-only items in WeeklyGrid
- [ ] **5.4** Push sync: Homebase tasks push to parent's Google Calendar
- [ ] **5.5** Conflict detection: Hard conflicts (external meetings) vs soft (work blocks)
- [ ] **5.6** Fix timezone handling — pull from `families.timezone` instead of hardcoded
- [ ] **5.7** Sync status UI — last sync time, manual sync trigger, error display
- [ ] **5.8** Commit: "feat: Google Calendar bidirectional sync"

---

## Phase 6: Polish & Deploy
**Goal:** Production-ready, deployed on Vercel.

- [ ] **6.1** Responsive design pass — mobile, tablet, desktop
- [ ] **6.2** Loading states, error boundaries, empty states
- [ ] **6.3** Family onboarding flow — create family, invite partner, add children
- [ ] **6.4** Settings page — family timezone, child colors/icons, notification prefs
- [ ] **6.5** Deploy to Vercel:
  - Set env vars
  - Configure custom domain (if desired)
  - Verify build succeeds
- [ ] **6.6** Playwright E2E tests against deployed URL
- [ ] **6.7** Commit: "chore: production polish and deployment"

---

## Decisions (Confirmed 2026-03-18)

| # | Question | Decision |
|---|----------|----------|
| 1 | **Supabase project** | Use existing CC&SS project |
| 2 | **Google Calendar** | Yes, include — OAuth-based integration |
| 3 | **Auth method** | Google OAuth login via Supabase Auth |
| 4 | **Target users** | Multi-tenant (multi-family SaaS) |
| 5 | **Deployment** | Vercel |
| 6 | **Google Maps travel time** | Yes, include |

---

## File Map (What Goes Where)

```
~/projects/homebased/
├── src/
│   ├── app/
│   │   ├── auth/page.tsx              ← NEW: login/signup
│   │   ├── dashboard/page.tsx         ← NEW: authenticated dashboard
│   │   ├── api/                       ← PORTED + FIXED: all API routes
│   │   ├── layout.tsx                 ← UPDATED: add auth provider, nav
│   │   ├── page.tsx                   ← REPLACED: landing → redirect
│   │   └── globals.css                ← PORTED
│   ├── components/                    ← PORTED: all components
│   ├── lib/                           ← PORTED + FIXED: auth integration
│   ├── types/                         ← PORTED
│   └── middleware.ts                  ← NEW: Supabase auth middleware
├── supabase/                          ← PORTED: migrations + seed
├── tests/                             ← PORTED: Playwright tests
├── .env.local                         ← NEW: real credentials
├── .env.example                       ← PORTED
├── playwright.config.ts               ← PORTED
├── ARCHITECTURE.md                    ← PORTED
└── docs/plans/                        ← THIS PLAN
```

---

## Estimated Scope

| Phase | Files | Effort |
|-------|-------|--------|
| Phase 0: Port | ~30 files copied | Small — mostly copy + dependency merge |
| Phase 1: Auth | ~8 files new/modified | Medium — middleware, login page, API fixes |
| Phase 2: Shell | ~4 files new/modified | Medium — routing, data fetching |
| Phase 3: Tasks | ~5 files new/modified | Medium-Large — CRUD UI, drag-drop |
| Phase 4: Alerts | ~4 files modified | Medium — complete engine, wire UI |
| Phase 5: Google | ~3 files modified | Large — requires Google Cloud setup |
| Phase 6: Polish | ~10 files | Medium — responsive, deploy, tests |
