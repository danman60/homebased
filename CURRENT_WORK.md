# Current Work - Homebase

## Active Task
All code phases complete. Waiting on manual setup steps.

## What's Built (All Code Complete)
- **Phase 0**: Ported all code from /mnt/data/, fixed build errors, hb_ table prefixes
- **Phase 1**: DB schema (9 hb_ tables + RLS) deployed to CC&SS Supabase
- **Phase 1**: Auth middleware, Google OAuth login, callback with onboarding redirect
- **Phase 2**: Dashboard server page fetches hb_user profile, redirects to onboarding if needed
- **Phase 3**: Task CRUD modal (create/edit/delete), drag-drop reschedule, assignee picker
- **Phase 4**: Alerts engine fully implemented (5 rule categories), availability API with auth
- **Phase 5**: Google Calendar sync with family timezone from DB (no more hardcoded)
- **Phase 6**: Vercel config, responsive components, all API routes use auth context

## Manual Steps Remaining (User Must Do)
1. Google Cloud Console: Add redirect URI `https://netbsyvxrhrqxyzqflmd.supabase.co/auth/v1/callback`
2. Supabase Dashboard → Auth → Providers → Google: Enable with client ID + secret
3. Vercel: Import repo, set env vars (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET)
4. Supabase Dashboard → Auth → URL Config: Add Vercel deploy URL to redirect allowlist

## Key Files
- `src/middleware.ts` — Auth middleware
- `src/app/auth/login/page.tsx` — Google OAuth login
- `src/app/auth/callback/route.ts` — OAuth callback + onboarding check
- `src/app/onboarding/page.tsx` — Create/join family
- `src/app/dashboard/page.tsx` — Server component (auth + data fetch)
- `src/app/dashboard/client.tsx` — Client component (weekly view + task CRUD)
- `src/components/task-modal/TaskModal.tsx` — Task create/edit/delete modal
- `src/lib/auth-helpers.ts` — getAuthenticatedUser() for API routes
- `src/lib/database/client.ts` — All DB ops with hb_ prefixed tables
