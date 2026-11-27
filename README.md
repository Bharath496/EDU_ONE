# EDU_ONE

EDU_ONE is a **portfolio-grade, multi-role college operating system demo** built with Next.js, TypeScript, Zustand and FastAPI.

The hosted frontend is designed to work at **₹0 required service cost** using GitHub Pages, static export and browser-persisted data. The repository also contains a tested FastAPI backend for local/API demonstration.

> EDU_ONE is a serious portfolio system, not a claim that a production student-information platform can safely run from browser storage. A real institutional deployment would need server-side identity, durable storage, tenant isolation, audit logs, privacy controls, secure files, backups, observability and payment-provider integration.

## API safety mode

The FastAPI service currently contains fictional in-memory demo records and demo login identities. **Business/API routes are disabled by default.** The root and health endpoints remain available, but login, student, attendance, fees, exams, library, communication, administration and analytics routes return `503 DEMO_API_DISABLED` unless the developer explicitly opts in.

For local UI/API demonstrations only, start the API with `EDUONE_DEMO_MODE=true` (or `1`) in the environment. Do not enable this flag on a public deployment or use real student, parent, staff, attendance, examination or financial data. This flag is a demo safety lock, not production authentication. A production release still requires verified server-side identity, role and record-level authorization, persistent database migrations, tenant isolation, audit trails, secure file handling, backups and payment-provider verification.

## Live website

GitHub Pages:

```text
https://bharath496.github.io/EDU_ONE/
```

Repository:

```text
https://github.com/Bharath496/EDU_ONE
```

No Vercel deployment is required.

## Demo roles

EDU_ONE now supports the full role set used by the product design:

- Super Admin
- College Admin
- Faculty
- Student
- Parent
- Staff

You can enter immediately from the landing page or use the guided demo flow:

1. Select a fictional institution
2. Select a role
3. Enter the displayed local demo verification code
4. Continue to the role-based dashboard

The flow deliberately does **not** pretend that real SSO, SMS or production identity infrastructure is configured.

## Extended application

### Dashboard

The dashboard changes by role rather than showing every user the same administrative data.

- Super Admin sees platform-demo tenants, users and administration links
- College Admin sees institution operations and risk signals
- Faculty sees teaching, attendance, coursework and assessment priorities
- Student sees their own attendance, CGPA, assignments, fees, exams and notices
- Parent gets a student-monitoring view
- Staff gets operational workflows

### Academics

- persistent course catalog
- subjects and credits
- semester and department metadata
- faculty assignment
- weekly timetable
- room and class-time information
- College Admin course creation and activation controls

### Students

- create, edit and remove records
- search and filters
- status control
- CSV export
- role-aware mutation controls

### Faculty

- persistent faculty directory
- department, designation and qualification data
- workload information
- add faculty
- CSV export

### Attendance

- course/date sessions
- Present / Absent / Late / Excused
- bulk marking
- persistent session history
- automatic student attendance recalculation
- CSV export
- Student/Parent scoped read-only views

### Assignments

- create assignments
- Draft / Published / Closed workflow
- class submission progress
- student-scoped demo submission
- persistent submission state

### Exams

- exam scheduling
- assessment type and status
- date/time/venue
- maximum marks and class strength
- learner views hide draft exams

### Marks & Grades

- internal + external marks
- automatic total
- automatic grade
- pass/fail status
- course filters and CSV export
- Student/Parent read-only scoped grades

### Fees

- fee ledger
- Paid / Pending / Upcoming / Overdue states
- collection metrics
- demo payment completion
- Student/Parent scoped fee view
- CSV export

### Library

- persistent book catalog
- categories, ISBN and shelf location
- total/available copy tracking
- issue-copy simulation
- learner availability view
- CSV export

### Communication

- local persistent inbox
- compose messages
- recipient selection
- mark read
- announcements
- contacts
- role-aware visibility

### Notices & Alerts

- publish notices
- audience and priority
- pin/unpin
- cross-module alert generation
- read/unread state
- Student/Parent scoped alerts

### Student Intelligence

- explainable High / Medium / Low risk classification
- attendance + CGPA + record-state thresholds
- department watchlist
- CSV export
- no paid AI API

### Reports

Real browser-generated CSV exports for:

- Students
- Attendance
- Fees
- Assignments
- Notices
- Exams
- Marks
- Faculty
- Library

Financial reporting is role-restricted.

### Profile, Settings & Support

- editable demo profile
- local notification preferences
- JSON workspace backup/restore for administrators
- workspace reset
- searchable FAQs
- persistent support tickets
- Staff/College Admin ticket-status management

## Super Admin

Super Admin uses a separate persistent platform-demo store.

- fictional tenant management
- add, activate and pause institutions
- cross-tenant demo users
- Staff accounts
- illustrative plan ledger
- platform analytics calculated from current demo data
- platform settings
- **Roles & Permissions matrix**

The permission matrix controls module visibility for:

- College Admin
- Faculty
- Student
- Parent
- Staff

Permission changes immediately affect the route guard, sidebar, command palette and mobile navigation.

## Mobile, installability and offline behavior

The web app includes:

- responsive desktop/tablet/mobile layouts
- role-aware mobile bottom navigation
- collapsible desktop sidebar
- command palette with Ctrl/Cmd + K
- installable web-app manifest
- service worker
- same-origin cache fallback for previously visited resources

The service worker is a portfolio offline layer, not a replacement for production synchronization or conflict handling.

## FastAPI backend

The API lives in:

```text
apps/api/main.py
```

Current demo API version: **0.5.0**

Implemented API areas include:

- health
- demo authentication and refresh
- Students CRUD
- Faculty
- Academics / courses CRUD
- Attendance + bulk attendance
- Exams
- Assignments + submissions
- Fees + payment simulation
- Communication messages + read state
- Notices
- Library issue/return
- Support tickets
- Reports
- Super Admin colleges/users/analytics
- Settings
- explainable student-risk analytics

The API is intentionally **in-memory**. Restarting it resets API-side mutations.

## Technology

### Web

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Zustand
- Axios
- Lucide React

### API

- FastAPI
- Pydantic
- Uvicorn
- Pytest

### Engineering

- GitHub Actions
- TypeScript typecheck
- production static build
- API smoke tests
- GitHub Pages deployment
- PWA manifest + service worker

## Run locally

### Frontend

```bash
npm --prefix apps/web install
npm run dev:web
```

Open:

```text
http://localhost:3000
```

### API

```bash
pip install -r apps/api/requirements.txt
npm run dev:api
```

API docs:

```text
http://localhost:8000/docs
```

Optional API configuration:

```text
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Validate

```bash
npm --prefix apps/web install
npm run typecheck:web
npm run build:web
pip install -r apps/api/requirements.txt
npm run test:api
```

GitHub Actions runs these checks automatically.

## GitHub Pages deployment

The frontend is exported as static files.

The GitHub Pages workflow:

```text
.github/workflows/deploy-pages.yml
```

builds `apps/web`, uploads `apps/web/out`, and deploys it with GitHub Pages.

The app automatically uses the repository base path:

```text
/EDU_ONE
```

when running in GitHub Actions.

## Project structure

```text
EDU_ONE/
├── .github/
│   └── workflows/
│       ├── web-ci.yml
│       └── deploy-pages.yml
├── apps/
│   ├── api/
│   │   ├── main.py
│   │   ├── requirements.txt
│   │   └── test_main.py
│   └── web/
│       ├── app/
│       │   ├── admin/
│       │   ├── auth/
│       │   ├── dashboard/
│       │   └── modules/
│       ├── components/
│       ├── lib/
│       └── public/
│           ├── icon.svg
│           ├── manifest.webmanifest
│           └── sw.js
├── package.json
└── LICENSE
```

## Production boundary

Before real institutional use, at minimum add:

1. server-side authentication and authorization
2. durable relational database and migrations
3. strict tenant isolation
4. authorization checks on every data mutation
5. audit logs
6. encrypted secret management
7. secure document/file storage
8. rate limiting
9. payment-provider webhooks and reconciliation
10. privacy, consent and retention policies
11. backups and disaster recovery
12. observability and incident response
13. accessibility audit
14. security review and penetration testing

## License

MIT

## Database foundation (development branch)

The API now includes tenant-aware SQLAlchemy models for institutions, users, role grants, student profiles, verified parent/student links, staff scope assignments, refresh sessions and audit events. Database connections require `DATABASE_URL`; schema changes are applied explicitly with Alembic rather than creating production tables during application startup.

For a disposable local SQLite schema check, run from `apps/api`:

```bash
python -m pip install -r requirements.txt
DATABASE_URL=sqlite:///./edu_one_local.db alembic upgrade head
```

For PostgreSQL, provide a managed PostgreSQL URL through the deployment environment and run the same migration command during a controlled release. Keep database credentials and `JWT_SECRET_KEY` out of Git. The identity models and token helpers are foundational components; the existing demo routes have not yet been migrated to them and remain blocked by default outside explicit demo mode.

### Institutional auth configuration

Set `JWT_SECRET_KEY` to a randomly generated secret of at least 32 bytes. Set `DATABASE_URL` to the managed PostgreSQL connection string. Configure `CORS_ORIGINS` and `AUTH_ALLOWED_ORIGINS` as comma-separated exact origins for the deployed web application; do not use wildcards with credentialed requests. Refresh tokens are kept in an HttpOnly, Secure cookie, rotated on refresh and stored server-side only as hashes. The default cookie policy is `SameSite=None; Secure` for a separately hosted web client. For local HTTP development, set `COOKIE_SECURE=false` and `COOKIE_SAMESITE=lax` together. Browser refresh/logout requests require a trusted Origin.

The institutional sign-in page is at `/auth/sign-in`. The home page's quick-role cards remain explicitly local demo access and must not be used as real identity credentials. The current student/admin feature endpoints have not all been migrated to database-backed authorization; only the new `/v1/auth/*` endpoints are wired to the new identity store so far.

## Student profile API

The database-backed student API is available under `/v1/students` and requires a short-lived Bearer access token. It supports tenant-scoped, paginated student lists, profile reads, a student's own profile, admin/admissions creation, admin updates and soft deactivation. Student access is limited to the signed-in student's profile; parent access is limited to verified parent/student links; HOD and class-advisor lists are filtered to assigned departments/classes. Mutations create audit events. Faculty-to-student visibility is intentionally not enabled until course enrolment and teaching assignments are modelled end-to-end.


## Courses, attendance, assessments and fees API

The backend now includes versioned, tenant-scoped APIs for course catalogue and enrolments, attendance sessions and records, exams, result entry/publication, assignments and submissions, invoices and payment verification. Faculty actions require course assignments; HOD and class-advisor access is scoped to their department/class; students are restricted to their own enrolled records; parents require a verified student link. Exam results remain hidden until the Exam Cell or College Admin publishes them. Attendance records can be locked after marking.

Fee requests are deliberately **not** treated as successful payments. A student/parent request creates a pending record only. An Accounts user or College Admin must verify it before the invoice balance changes. This is a manual/offline verification workflow, not a payment-gateway integration; no payment provider or webhook is configured. Never treat a client-provided UPI/bank reference as proof of settlement.


## User provisioning and first administrator

The first College Admin is created with the one-time `apps/api/bootstrap_admin.py` command after database migrations. The command refuses to run without `BOOTSTRAP_CONFIRM=YES` and refuses to add a first administrator to an institution that already has users. Supply the institution name/code, administrator name/email and a strong password through temporary environment variables; never put those values in Git. Remove the bootstrap variables immediately after running it.

After the first administrator signs in, `/v1/users` can create institution-level accounts for student, parent, faculty, HOD, class advisor, principal, vice principal, Exam Cell, Accounts and other supported staff roles. College Admin and Super Admin cannot be created through this ordinary endpoint. Course/class staff assignments are explicit server-side records. Parent/student relationships start unverified and must be verified by an administrator before parent access is granted.

This initial provisioning workflow sets passwords directly; invitation email, password reset, MFA, self-service account recovery and account lockout/rate limiting are still outstanding. Do not distribute passwords through insecure channels.


## Library circulation API

The versioned library API supports a tenant-scoped book catalogue, stock counts, librarian-controlled issue/return workflows, student loan history, active-loan limits and configurable overdue fines (`LIBRARY_FINE_PER_DAY`, default ₹2/day). Only Librarian or College Admin roles can add books, issue or return copies. Students can view their own loan history; they cannot issue or return books themselves. Fine amounts are recorded, not automatically collected.


## Announcements and student support

The API supports institution, department, class and role-targeted announcements with per-user read receipts. HODs and class advisors are restricted to their assigned scopes. Student and parent accounts can raise support tickets for their own or verified linked student profiles, exchange messages and follow progress; Support Staff, Principal, Vice Principal and College Admin roles can manage ticket status. Ticket and announcement actions are audited. Attachments, anonymous reporting, SLA automation and external notification delivery are not yet configured.


## Timetable and academic calendar

The API includes class timetable slots, faculty assignments, effective dates and overlap checks for both classes and faculty. Students can read their own class timetable, faculty can read their assigned timetable, and staff access is checked against course/class/department scopes. Calendar events can be targeted by role, department or class. These endpoints are live API foundations; a full timetable editor and calendar UI are still to be completed.
