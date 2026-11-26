# Know Envi / EDU_ONE — Engineering Audit

Audit target: `know-envi-rebuild`
Base commit: `9942dfb2081d47e333101456afeaeeb0ca35f48a`
Scope: repository inventory and source review through GitHub file/tree access. No production deployment, local build, dependency install, database migration, or security test has been run as part of this audit.

## Executive assessment

The repository is a useful UI and workflow prototype, but it is not safe to use for real student, staff, financial, examination, or institutional data. The current implementation mixes a browser-persisted demo workspace with an in-memory FastAPI demo API. Authentication and authorization are not security boundaries.

**Recommendation:** retain the Next.js/TypeScript interface and useful module workflows as a prototype/reference; retain selected analytics concepts; rebuild the backend identity, persistence, authorization, tenancy, audit, and sensitive-data workflows before connecting real users or importing real records.

## Critical findings

| Severity | Area | Finding | Required action |
|---|---|---|---|
| Critical | Authentication | Demo login accepts a known email without validating a real credential; `/auth/me` resolves to a fixed College Admin identity. | Replace with server-validated credentials, secure session lifecycle, password hashing, reset flow, revocation and rate limiting. |
| Critical | API authorization | Data routes can be called without effective server-side identity/permission checks. | Require authenticated principals and enforce permissions on every read/write endpoint. |
| Critical | Student data scope | Some student pages match by display name and fall back to the first student record. | Bind student accounts to immutable student IDs; deny by default when linkage is absent. |
| Critical | Fees and payments | Fee payment endpoint changes a fee to paid based on a client request; transaction identifiers can be demo-generated. | Never treat client claims as payment proof; integrate a verified payment provider/webhook or label as offline receipt entry with approvals. |
| Critical | Institutional isolation | College/institution IDs are filters, not proven tenant isolation boundaries. | Enforce institution scope in every query, relationship, file, cache and background job. |
| High | Persistence | API state is held in Python process memory; frontend stores substantial application state in browser persistence. | Use PostgreSQL with migrations, constraints, transactions and backup/restore. |
| High | Token/session storage | Frontend auth state uses browser storage; this is exposed to script execution in the page context. | Use secure, HttpOnly, SameSite cookies and server-side session/token rotation. |
| High | Authorization model | Role checks are mostly UI/navigation logic and generic role labels. | Implement server-side RBAC plus resource attributes: institution, department, class, subject and ownership. |
| High | Assignments and library | Submission and issue/return actions accept client-supplied identifiers without demonstrated ownership/role checks. | Validate actor, ownership, deadlines, stock and state transitions in the service/database layer. |
| High | Communication/support | Message read state and ticket operations are not shown to be scoped to the authenticated recipient/creator or authorized staff. | Add participant/creator scoping and explicit workflow permissions. |
| High | Service worker | Same-origin GET caching does not distinguish public assets from private API responses. | Cache only versioned static assets; bypass authenticated/private API routes and test logout/account switching. |
| High | CI/deployment | Current workflow configuration is oriented to the existing static Pages deployment and main branch. | Add branch CI for lint, typecheck, tests, build, API tests, migrations and security checks; deploy backend separately. |
| Medium | Role design | Actual designations and responsibility scopes (HOD, Principal, Exam Cell, Accounts, mentor, etc.) are not represented as a robust permission model. | Separate job designation, role grants, resource scope and delegated assignments. |
| Medium | Analytics | Risk scoring can misinterpret missing signals as zero and generate false alerts. | Model missingness explicitly, make thresholds configurable, show explanations and require human review. |
| Medium | Demo data | Synthetic/demo data is embedded in the application and can be confused with live records. | Separate fixtures/seeds from production runtime and visibly label demo environments. |

## Existing assets worth retaining

- Next.js and TypeScript application structure and responsive navigation.
- Existing module concepts and UI workflows for students, faculty, attendance, academics, assignments, exams, marks, fees, library, notices, communication and reports.
- PWA manifest and installability as a later delivery option; private data must not be cached.
- Useful analytics concepts from Know_Envi: CSV/Excel/SQLite ingestion, attendance/performance comparisons, department summaries, data-quality checks and explainable risk signals.
- Existing reusable UI components, subject to accessibility, validation and security review.
- Existing tests as a starting point, after replacing demo assumptions.

## Areas requiring redesign or replacement

1. Identity, authentication, sessions, password reset and optional MFA.
2. Server-side authorization and institution/department/class/subject scoping.
3. Persistent relational data model, migrations and transactional service layer.
4. Student/parent/faculty/staff account-to-record relationships.
5. Fee ledger and verified payment/receipt workflow.
6. Examination lifecycle, marks approval, result publication and hall-ticket permissions.
7. File upload/download security and access control.
8. Audit events for sensitive reads, writes, approvals and administrative actions.
9. Notification delivery and user-specific read state.
10. Deployment architecture: web frontend, API, database, object storage, secrets and observability.

## Proposed target architecture

- Web: Next.js + TypeScript.
- Initial mobile experience: responsive PWA; native mobile only after core APIs stabilize.
- API: FastAPI with clear routers, schemas, service layer and repository/data-access layer.
- Database: PostgreSQL; SQLAlchemy models and Alembic migrations.
- Authentication: secure server-managed sessions using HttpOnly cookies; strong password hashing, rotation, expiry, revocation and recovery.
- Authorization: deny-by-default RBAC combined with attribute/data-scope checks.
- Files: private object storage with signed, short-lived access and malware/type/size validation.
- Operations: environment-separated secrets, structured logs, backups, monitoring and tested recovery.
- AI: optional assistant grounded only in institution-approved information and permitted user records; no autonomous high-stakes decisions.

## Delivery sequence

### Phase 0 — Safety and baseline
- Keep `main` untouched.
- Keep all work on `know-envi-rebuild`.
- Add CI for the development branch.
- Separate demo fixtures and demo environment from any real-data environment.
- Establish lint/typecheck/build/API-test baselines.

### Phase 1 — Platform foundation
- Database schema and migrations.
- Institution boundary and academic hierarchy.
- Users, credentials, sessions and account recovery.
- RBAC, resource scopes and audit log.
- Seeded demo accounts only in non-production environments.

### Phase 2 — Core academic workflows
- Student/faculty profiles and assignments.
- Timetable and attendance.
- Courses/materials and assignments/submissions.
- Exams, marks, approval and publication.
- Student/parent access to only linked records.

### Phase 3 — Administration and services
- Fees, receipts and verified payment integration.
- Library inventory and circulation.
- Grievances, notices, messaging and notifications.
- HR, admissions, placement, hostel and transport modules.

### Phase 4 — Intelligence and polish
- Know_Envi analytics with explicit missing-data handling and review.
- Approved-source AI assistant.
- Student portfolio, events and certificates.
- Accessibility, performance, mobile QA and operational hardening.

## Verification status and limitations

- Repository tree inventory: 94 tracked files across 56 directories at the audited base revision.
- Critical API, auth/store, navigation, dashboard and representative module files reviewed.
- Remaining source and UI files inventoried and pattern-scanned.
- No local dependency installation or local execution has been performed.
- No current CI run has been triggered or verified.
- No database or external payment provider is configured.
- This is a source-level engineering assessment, not a penetration test or certification.

## Release gate

Do not connect real student/staff records or use this build for real fee collection, examination publication, attendance decisions or institutional operations until authentication, authorization, tenant isolation, persistence, backups, audit logging and security tests are implemented and independently verified.
