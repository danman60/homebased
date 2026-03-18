# Current Work - Homebase

## Active Task
Rebuild plan created. Waiting for user decisions before starting Phase 0.

## Recent Changes (This Session)
- Explored both repos: ~/projects/homebased (blank template) and /mnt/data/d/ClaudeCode/homebased (developed code)
- Created detailed rebuild plan at docs/plans/2026-03-18-rebuild-plan.md

## Blockers / Open Questions
1. Which Supabase project to use? (CC&SS shared, or new dedicated?)
2. Google Calendar integration priority? (Now or defer?)
3. Auth method? (Email/password, Google OAuth, magic link?)
4. Single-tenant (your family) or multi-family SaaS?
5. Deploy to Vercel?
6. Include Google Maps travel time or defer?

## Next Steps
1. Get answers to decision points
2. Start Phase 0: Port code from /mnt/data/ to active repo
3. Phase 1: Supabase + Auth setup

## Context for Next Session
- Source code is at /mnt/data/d/ClaudeCode/homebased (read-only old drive)
- Active repo at ~/projects/homebased has 1 commit (blank Next.js template)
- Full analysis of what's broken documented in the plan file
- Key blockers: hardcoded family ID, no auth middleware, landing page not connected to dashboard
