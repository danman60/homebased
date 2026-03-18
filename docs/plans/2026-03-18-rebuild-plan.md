# Homebase Rebuild Plan

**Date:** 2026-03-18
**Status:** CODE COMPLETE + DEPLOYED. Manual auth setup remaining.
**Source:** `/mnt/data/d/ClaudeCode/homebased` (developed code)
**Target:** `~/projects/homebased` (active repo)
**Deploy:** https://homebased.vercel.app

---

## Decisions (Confirmed 2026-03-18)

| # | Question | Decision |
|---|----------|----------|
| 1 | **Supabase project** | Use existing CC&SS project |
| 2 | **Google Calendar** | Yes, include — OAuth-based integration |
| 3 | **Auth method** | Google OAuth login via Supabase Auth |
| 4 | **Target users** | Multi-tenant (multi-family SaaS) |
| 5 | **Deployment** | Vercel |
| 6 | **Google Maps travel time** | Deferred (adapter removed during cleanup) |

---

## Phase 0: Port & Foundation — COMPLETE
- [x] Copy all source code, supabase dir, tests, configs, docs
- [x] Merge package.json with all deps
- [x] Fix 15+ type errors (Supabase generics, null vs undefined, etc.)
- [x] Build passes, committed and pushed

## Phase 1: Supabase & Auth — COMPLETE
- [x] Schema deployed to CC&SS with hb_ prefix (9 tables, 12 indexes, triggers)
- [x] RLS policies deployed with hb_get_user_family_id() helper
- [x] Added INSERT policy on hb_families + permissive SELECT for join flow
- [x] .env.local created with real Supabase URL + keys
- [x] Auth middleware (session refresh, route protection)
- [x] Google OAuth login page (/auth/login)
- [x] OAuth callback with onboarding redirect (/auth/callback)
- [x] All API routes use cookie-based authenticated Supabase client
- [x] Google OAuth credentials filled from ~/.env.keys + set on Vercel
- [ ] **MANUAL:** Enable Google provider in Supabase Dashboard
- [ ] **MANUAL:** Add redirect URI in Google Cloud Console
- [ ] **MANUAL:** Add Vercel URL to Supabase redirect allowlist

## Phase 2: Core App Shell — COMPLETE
- [x] Landing page with Get Started CTA
- [x] Dashboard server component (auth check, hb_user fetch, redirect to onboarding)
- [x] Dashboard client component (weekly view fetch, task CRUD wiring)
- [x] Onboarding page (create new family / join existing)
- [x] User bar with name, timezone, sign out, New Task button

## Phase 3: Task Management — COMPLETE
- [x] Task CRUD modal (create/edit/delete)
- [x] Type selector (recurring/one-time)
- [x] Recurrence rule picker (RRULE presets)
- [x] Assignee picker from family members
- [x] Task edit on card click
- [x] Drag-and-drop reschedule (calls PUT API)
- [ ] Task filtering by type/assignee/date (deferred)
- [ ] Drag-drop conflict detection on drop (deferred)

## Phase 4: Availability & Alerts — PARTIAL
- [x] Alerts engine fully implemented (5 rule categories)
- [x] AlertsPanel renders critical/warning alerts
- [x] Availability API with auth (GET/POST)
- [ ] Availability block creation UI (deferred)
- [ ] Alert dismiss functionality (deferred — currently no-op)

## Phase 5: Google Calendar Integration — COMPLETE (code)
- [x] OAuth flow for calendar connection
- [x] Pull sync (import external events as tasks)
- [x] Push sync (push tasks to Google Calendar)
- [x] Conflict detection (hard/soft)
- [x] Family timezone from DB (not hardcoded)
- [x] Sync status UI
- [x] CalendarSync uses real user email
- [x] Credentials set on Vercel

## Phase 6: Polish & Deploy — COMPLETE
- [x] Next.js 16 upgrade (Vercel security requirement)
- [x] Vercel deployment (homebased.vercel.app)
- [x] All env vars set on Vercel
- [x] /verify run — 5 critical fixes applied
- [x] Orphaned files cleaned up
- [x] Tailwind CSS warning fixed
- [x] Login error display
- [x] Auth on all API routes (including calendar)
- [x] seed.sql updated to hb_ prefix
- [ ] Persistent nav layout (deferred)
- [ ] Settings page (deferred)
- [ ] Error boundaries (deferred)
- [ ] Playwright E2E tests (deferred — use /write-tests)

---

## Verify Results (2026-03-18)

5 CRITICAL issues found and fixed:
1. RLS bypass — API routes used sessionless client → now use cookie-based auth
2. PUT/DELETE tasks had no auth → added getAuthenticatedUser() check
3. No INSERT policy on hb_families → added for onboarding
4. Join Family couldn't read families → added permissive SELECT policy
5. seed.sql used unprefixed table names → updated to hb_*

All GOTCHAs resolved: hardcoded email, cookie propagation, error display, calendar auth.
