# Technical Decisions

This document records key technical decisions made during Homebase development, with references to relevant PRD sections.

## Architecture Decisions

### Next.js App Router with TypeScript
**Decision**: Use Next.js 14 with App Router and TypeScript
**Rationale**: 
- App Router provides better file-based routing and server components
- TypeScript ensures type safety across the full stack
- Aligns with PRD requirement for "type-safe API layer and DB access"
- Supports both mobile-first and desktop requirements from UI & Style Guidance

### Supabase as Backend-as-a-Service
**Decision**: Use Supabase for database, authentication, and real-time features
**Rationale**:
- Provides PostgreSQL with built-in Row Level Security for family data isolation
- Handles authentication requirements mentioned in Non-Functional Requirements
- Supports the "privacy: export/delete flows" requirement
- Reduces infrastructure complexity while maintaining type safety

### Feature-Based Component Organization
**Decision**: Organize components by feature rather than type
**Rationale**:
- Supports PRD's modular approach (weekly view, tasks, availability, alerts)
- Makes code easier to maintain as features grow
- Aligns with clear separation between domain logic and UI components

## Data Architecture Decisions

### Unified Task Model for Cyclical and Project Tasks
**Decision**: Use single `tasks` table with `type` field instead of separate tables
**Rationale**:
- PRD specifies "Task model: unified structure" in Functional Requirements
- Simplifies drag-and-drop implementation across both task types
- Maintains consistent API contracts for task operations
- Reduces code duplication in UI components

### RRULE for Recurrence Patterns
**Decision**: Use RFC 5545 RRULE format for recurrence
**Rationale**:
- Industry standard format, compatible with Google Calendar
- Supports complex recurrence patterns mentioned in PRD (daily/weekly repeat)
- Future-proof for advanced recurrence needs
- Direct integration with Google Calendar sync requirement

### Availability Blocks as Separate Entity
**Decision**: Model parent availability as separate `availability_blocks` table
**Rationale**:
- PRD specifies "granular work/childcare blocks" in Parent Availability section
- Allows flexible scheduling patterns (9–12 work, 12–1 lunch, 1–2 childcare)
- Supports conflict detection between hard/soft constraints
- Enables weekly totals calculation for time tracking

### Weekly Totals Materialization
**Decision**: Store pre-calculated weekly totals rather than computing on-demand
**Rationale**:
- PRD specifies "weekly totals displayed" and "recalculated nightly"
- Improves dashboard performance for frequent access
- Supports historical tracking and reporting
- Allows batch processing during off-peak hours

## Integration Architecture Decisions

### Adapter Pattern for Google Services
**Decision**: Create adapter classes for Google Calendar and Maps APIs
**Rationale**:
- PRD requires "clear separation between domain logic and integration adapters"
- Enables mock implementations for development and testing
- Provides consistent interface regardless of underlying API changes
- Supports feature flag system for optional integrations

### Event Mapping for Google Calendar Sync
**Decision**: Maintain bidirectional mapping between Homebase tasks and Google events
**Rationale**:
- PRD specifies "Google Calendar is authoritative source of truth"
- Enables conflict detection and resolution
- Supports "Homebase cannot override Google Calendar entries" requirement
- Allows proper cleanup when tasks are deleted

### Mock-First Integration Development
**Decision**: Implement mock versions of all external APIs for development
**Rationale**:
- Supports PRD requirement "No secrets. Read keys from env"
- Enables development without API quotas or rate limits
- Provides predictable data for testing
- Allows feature development before integration setup

## UI/UX Architecture Decisions

### 7×24 Grid as Primary Interface
**Decision**: Make weekly grid the default and primary view
**Rationale**:
- PRD explicitly states "Default view: Weekly grid, repeats until overridden"
- Supports "Grid: strict 7×24 weekly calendar as base layout"
- Enables drag-and-drop functionality across time slots
- Aligns with mobile-first but desktop-functional requirement

### Tailwind CSS for Styling
**Decision**: Use Tailwind CSS with custom design tokens
**Rationale**:
- Supports PRD's "neutral base with subtle accents" color palette
- Enables rapid mobile-first responsive development
- Provides consistent spacing and typography system
- Easy to customize for family/child-specific colors

### Client-Side State Management
**Decision**: Use React hooks and local state rather than external state library
**Rationale**:
- PRD doesn't specify complex global state requirements
- Weekly view is primary data structure, fits well in component state
- Reduces bundle size and complexity
- Server state is handled by API calls, not global client state

### Drag-and-Drop Implementation
**Decision**: Use native HTML5 drag-and-drop with React event handlers
**Rationale**:
- PRD specifies "Drag-and-drop everywhere" as key requirement
- Native API provides better mobile touch support
- Reduces external dependencies
- Integrates well with weekly grid cell structure

## API Design Decisions

### RESTful API with Typed Contracts
**Decision**: Use REST endpoints with comprehensive TypeScript interfaces
**Rationale**:
- PRD requires "typed interfaces for routes"
- Provides clear API contracts with request/response examples
- Easier to test and document than GraphQL for this use case
- Aligns with Next.js API routes pattern

### Weekly View Aggregation Endpoint
**Decision**: Create `/api/weekly` endpoint that aggregates all weekly data
**Rationale**:
- PRD specifies dashboard showing "tasks, projects, events, alerts, weather, and parent hours"
- Reduces client-side API calls and complexity
- Enables server-side optimization of data fetching
- Provides atomic view of weekly state

### Incremental Sync Strategy
**Decision**: Implement incremental sync with conflict detection
**Rationale**:
- PRD requires "Incremental sync with conflict alerts"
- Reduces API call volume to Google Calendar
- Supports "Hard vs soft constraints" conflict resolution
- Enables real-time conflict detection and user notification

## Testing Strategy Decisions

### Playwright for E2E and Component Testing
**Decision**: Use Playwright for all browser-based testing
**Rationale**:
- PRD requires "E2E happy paths" and "accessibility assertions"
- Supports multi-browser testing (mobile and desktop)
- Provides excellent debugging tools and UI mode
- Single tool for both E2E and component-level testing

### Mock Data for Test Consistency
**Decision**: Use consistent mock data across all test suites
**Rationale**:
- Ensures predictable test results
- Supports PRD requirement for "realistic sample family" seed data
- Enables testing of edge cases without external dependencies
- Provides faster test execution than real API calls

### API-First Testing Approach
**Decision**: Test API endpoints independently before UI integration
**Rationale**:
- PRD specifies "typed API routes" and "clear contracts"
- Enables parallel development of frontend and backend
- Provides confidence in API behavior before UI development
- Supports comprehensive error handling validation

## Security and Privacy Decisions

### Row Level Security (RLS) for Data Isolation
**Decision**: Use Supabase RLS policies for all family data access
**Rationale**:
- PRD requires family data isolation and privacy controls
- Provides defense-in-depth security model
- Supports "export/delete flows for GDPR compliance"
- Enables fine-grained access control as features grow

### Environment-Based Configuration
**Decision**: Use environment variables for all secrets and feature flags
**Rationale**:
- PRD explicitly states "Keep secrets out of code"
- Supports different configurations for development/staging/production
- Enables feature flag system for optional components
- Follows security best practices for credential management

### Client-Side Google API Integration
**Decision**: Handle Google OAuth flow on client-side with server-side token storage
**Rationale**:
- Google OAuth requires browser-based authorization flow
- Server stores and manages refresh tokens securely
- Client never sees long-lived credentials
- Supports PRD's "Read credentials from environment variables"

## Performance Optimization Decisions

### Virtualized Weekly Grid
**Decision**: Implement viewport-based rendering for large time ranges
**Rationale**:
- PRD specifies "Mobile FCP <1s" performance requirement
- Weekly grid can contain 168 time slots (7 days × 24 hours)
- Reduces initial render time and memory usage
- Maintains smooth scrolling performance

### Database Indexing Strategy
**Decision**: Create indexes on frequently queried fields (family_id, due_date, user_id)
**Rationale**:
- Supports fast weekly view queries across date ranges
- Enables efficient family data isolation
- Optimizes availability conflict detection queries
- Maintains good performance as data grows

## Deployment and DevOps Decisions

### Vercel for Hosting
**Decision**: Optimize for Vercel deployment with automatic GitHub integration
**Rationale**:
- Best-in-class Next.js hosting performance
- Automatic preview deployments for pull requests
- Built-in performance monitoring and analytics
- Supports PRD's CI/CD requirements for quality bars

### Database Migrations with Supabase
**Decision**: Use Supabase migration system for schema changes
**Rationale**:
- Provides version control for database schema
- Supports rollback capabilities for failed deployments
- Integrates with Supabase's built-in tooling
- Enables safe production deployments

## Future Architecture Considerations

### Scalability Decisions Deferred
- Real-time collaboration features (mentioned in PRD roadmap)
- Advanced caching strategies for high-traffic families
- Microservices architecture for larger team development
- Advanced conflict resolution algorithms

### Integration Expansion Points
- Additional calendar providers (Outlook, Apple Calendar)
- Smart home integration for activity tracking
- Third-party task management tools
- Advanced travel time APIs with traffic data

These decisions provide a foundation for the current implementation while maintaining flexibility for future PRD phases.