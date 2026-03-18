# Current Work - Homebase

## Active Task
All code complete. Deployed to Vercel. Verified. Waiting on 2 manual steps.

## Recent Changes (2026-03-18 Session)
- Ported full codebase from /mnt/data/d/ClaudeCode/homebased
- Fixed 15+ build errors (type mismatches, Supabase generics, null vs undefined)
- Prefixed all tables with hb_ for shared CC&SS Supabase
- Deployed schema (9 tables + RLS + triggers + indexes) to CC&SS
- Built auth layer: middleware, Google OAuth login, callback, onboarding
- Built task CRUD modal (create/edit/delete with assignee picker)
- All API routes use authenticated cookie-based Supabase client
- /verify caught 5 critical issues — all fixed:
  - RLS bypass (supabaseServer had no cookies)
  - Missing auth on PUT/DELETE tasks
  - Missing INSERT policy on hb_families
  - Join Family RLS blocked reads
  - seed.sql wrong table names
- Cleaned up orphaned files, fixed Tailwind warning, added error display on login
- Filled Google OAuth credentials from ~/.env.keys into .env.local + Vercel
- Updated Next.js to 16.1.7 for Vercel security requirement
- Deployed to https://homebased.vercel.app

## Manual Steps Remaining (User)
1. Google Cloud Console: Add redirect URI `https://netbsyvxrhrqxyzqflmd.supabase.co/auth/v1/callback` to OAuth client 6389...8ff9
2. Supabase Dashboard → Auth → Providers → Google: Enable with client ID + secret
3. Supabase Dashboard → Auth → URL Config: Add `https://homebased.vercel.app` to redirect URLs

## Architecture
- **Framework:** Next.js 16, React 19, TypeScript, Tailwind 4
- **DB:** Supabase CC&SS project, hb_ prefixed tables, RLS with auth.uid()
- **Auth:** Supabase Auth with Google OAuth provider
- **Deploy:** Vercel (homebased.vercel.app)
- **Key files:**
  - src/middleware.ts — route protection + session refresh
  - src/lib/auth-helpers.ts — getAuthenticatedUser() returns user + authenticated db client
  - src/lib/database/client.ts — DatabaseClient with hb_ table queries
  - src/app/auth/ — login + callback routes
  - src/app/onboarding/page.tsx — create/join family
  - src/app/dashboard/ — server page (auth) + client (weekly view + task CRUD)
  - src/components/task-modal/TaskModal.tsx — create/edit/delete tasks
  - src/components/dashboard/ — Dashboard, WeeklyGrid, AlertsPanel, CalendarSync, WeeklyStats
  - src/lib/alerts/engine.ts — 5 alert categories
  - src/lib/integrations/google-calendar.ts — OAuth + bidirectional sync

## Future Work (Next Session)
- Availability block creation UI
- Task filtering (by type, assignee, date)
- Settings page (family timezone, children, invite partner)
- Persistent nav layout
- Error boundaries
- Drag-drop conflict detection
- Write fresh Playwright tests with /write-tests
