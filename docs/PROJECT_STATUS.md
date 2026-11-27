# EDU_ONE / Know Envi — Project Status

Status reviewed: 27 November 2026  
Working branch: `know-envi-rebuild`  
Verified code commit: `68e5f4abca475b2d9a11277834b4151a41a76407`  
Current branch head: `c20436dba46bf6bef654cd8083ade004afbe4009` (README-only change after the verified code commit)  
`main` remains at its original base commit: `9942dfb2081d47e333101456afeaeeb0ca35f48a`  
Repository: `Bharath496/EDU_ONE`

This document supersedes the original audit's snapshot when describing work added after its base commit. The original audit remains useful as a record of the risks found in the prototype.

## Current architecture

EDU_ONE now has two separate execution paths:

1. **Portfolio demo:** fictional browser-local records and legacy in-memory API routes. Legacy API routes are disabled by default and must not be enabled on a public deployment.
2. **Institutional workspace:** versioned FastAPI `/v1` routes backed by SQLAlchemy models and Alembic migrations. Institutional sign-in uses the database-backed identity system and server-side authorization. A PostgreSQL/Docker Compose development stack is included.

The hosted GitHub Pages site remains a static portfolio/demo frontend. It does not host the institutional API or PostgreSQL database.

## Implemented foundation

- Institution, user, role, student profile, parent/student link, staff assignment, session and audit-event models.
- Eight initial Alembic migrations covering identity/audit, courses/attendance, assessments, fees, library, announcements/support, timetable/calendar and placements.
- Password hashing with PBKDF2-HMAC-SHA256 and per-password salts.
- Short-lived signed access tokens and database-stored hashed refresh tokens with rotation/revocation.
- HttpOnly refresh cookie settings and trusted-origin checks for refresh/logout.
- Server-side permission map and tenant/ownership/department/class/course scope checks.
- Student profiles, course catalogue/enrolments, attendance sessions/records/locking, exams, marks/results publication, assignments/submissions/grading.
- Fee invoices and pending payment requests. Only authorized finance staff can verify/reject a request; a client-provided reference is not proof of payment.
- Library catalogue and circulation, announcements/read receipts, support tickets/messages, timetable/calendar and placement opportunity/application endpoints.
- Audit events for key mutations.
- Liveness and database-readiness endpoints.
- Dockerfile, PostgreSQL Compose stack, migration service and one-time first-admin bootstrap script.
- CI for frontend lint/typecheck/build, the full API test suite, migration validation, Compose configuration and API container build.
- Service worker restricted to public static assets; navigation and API/dynamic responses are not cached.
- Demo dashboard and learner module views (alerts, assignments, attendance, fees and marks) use explicit stable fixture IDs rather than display-name matching or a fallback to the first student.
- API responses include security headers and private `/v1` responses are marked `Cache-Control: no-store`; institutional login validates the trusted request origin.

## Verification checkpoints

These are CI results at the named commits, not a claim that every later commit has already been re-verified:

| Commit | Checks observed |
|---|---|
| `d11f600baf2810671e8674988b79fc6363a70103` | Frontend lint, TypeScript check and production build passed |
| `6bb58a380a195e27244311037a0fb355ae771910` | API suite: 70 passed; Alembic migration validation passed |
| `9910a3a55c99a8ed5133da8c9d8ca9b116c11b0d` | API suite and migration validation passed; Docker Compose config validation and API image build passed |
| `68e5f4abca475b2d9a11277834b4151a41a76407` | Full CI passed: frontend lint/typecheck/build; API suite **76 passed**; Alembic migration validation; Compose config; API image build; PostgreSQL + API Compose integration stack reached `/ready` and shut down cleanly |

The verified code commit includes the fee-payment row locking, service-worker cache restrictions, faculty course-scoped student roster, login-origin validation and API security headers. The current branch head is a README-only documentation commit on top of that verified code. Review the latest [branch Actions runs](https://github.com/Bharath496/EDU_ONE/actions?query=branch%3Aknow-envi-rebuild) for any subsequent changes.

## Remaining work before a production pilot

- Invitation delivery, password reset, account recovery, MFA and persistent login throttling/lockout.
- Full tenant-isolation review, database-level tenant-consistency constraints and authorization tests for every route/resource combination.
- Production database hosting, secrets management, HTTPS, backup/restore drills, monitoring and incident response.
- Same-site frontend/API deployment configuration for refresh-cookie reliability.
- Private document storage, upload validation, malware scanning and short-lived download access.
- Payment gateway checkout, signed provider webhooks and reconciliation; current finance verification is manual.
- Email/SMS/push notification delivery.
- Formal academic hierarchy administration for departments, programmes, classes, sections and subject assignments.
- Full UI workflows for all staff designations, plus exam hall tickets/seating, grade-point/CGPA calculation, file-based assignment submission and richer student/parent services.
- End-to-end, accessibility, load and independent security testing.
- Institutional privacy/consent, retention/deletion and data-processing policies.

## Safety decision

Do not load real student, parent, staff, attendance, examination or financial records into the hosted demo or treat the repository as a production college ERP yet. Do not enable `EDUONE_DEMO_MODE` on a public API. The current work is a materially stronger development foundation, but external services, deployment controls and independent verification remain necessary.
