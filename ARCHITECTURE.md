# Homebase Architecture Brief

## Technology Stack

- **Frontend**: Next.js 14 with App Router, React 18, TypeScript
- **Styling**: Tailwind CSS with custom design tokens for neutral palette
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **API**: Next.js API routes with typed interfaces
- **Testing**: Playwright for E2E, component smoke tests, and accessibility
- **Integrations**: Google Calendar API, Google Maps API

## Major Modules

### Core Application (`/app`)
- **Weekly Grid**: Primary calendar interface with drag-and-drop
- **Dashboard**: Unified view combining grid, alerts, and parent hours
- **Task Management**: Cyclical vs project task handling
- **Parent Availability**: Work/childcare/personal time blocks

### Data Layer (`/lib`)
- **Database Client**: Supabase client with typed queries
- **Domain Models**: Task, Family, User, Child, AvailabilityBlock entities
- **Sync Engine**: Google Calendar bidirectional synchronization
- **Alerts Engine**: Rule-based conflict and completeness detection

### Integrations (`/integrations`)
- **Google Calendar Adapter**: OAuth, event CRUD, conflict detection
- **Google Maps Adapter**: Travel time estimates, address validation
- **Natural Language Parser**: Text/voice/photo input processing

### API Layer (`/app/api`)
- **Tasks API**: CRUD with recurrence rule handling
- **Availability API**: Parent time block management
- **Sync API**: Google Calendar integration endpoints
- **Alerts API**: Real-time notification system

## Data Flow

### Weekly Dashboard Flow
1. Client requests weekly view with parent availability and tasks
2. API aggregates from Tasks, AvailabilityBlocks, WeeklyTotals tables
3. Alerts engine runs validation rules and flags conflicts
4. UI renders weekly grid with color-coded availability and task overlays

### Task Assignment Flow
1. User drags task/project to calendar slot via UI
2. Client validates against availability constraints
3. API creates/updates Task with assigneeUserId and dueDate
4. Sync engine pushes to assigned parent's Google Calendar
5. Optional: Creates event in Shared Family Calendar
6. WeeklyTotals recalculated for work vs childcare tracking

### Google Calendar Sync Flow
1. Incremental sync pulls external events as read-only context
2. Homebase-owned events pushed to Google with conflict detection
3. Hard conflicts (external meetings) block scheduling
4. Soft conflicts (user-defined work blocks) show warnings with override
5. HomebaseEventMap tracks bidirectional event relationships

## Feature Flags

- `ENABLE_SHARED_FAMILY_CALENDAR`: Optional shared calendar creation
- `ENABLE_NATURAL_INPUT`: Text/voice/photo parsing capabilities
- `ENABLE_SOCIAL_BLOCKS`: Friday/Saturday evening default placeholders
- `ENABLE_ADVANCED_AVAILABILITY`: Auto-block from external calendar imports

## Security & Privacy

- Environment-based secrets for Google API keys
- Supabase RLS policies for family data isolation
- Encrypted storage for sensitive integration tokens
- Export/delete flows for GDPR compliance

## Performance Considerations

- Weekly grid virtualization for mobile performance
- Incremental sync to minimize API calls
- Client-side caching for availability blocks
- Nightly batch recalculation of WeeklyTotals