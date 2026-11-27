# EDU_ONE

EDU_ONE is a **portfolio-grade, multi-role college operating system demo** built with Next.js, TypeScript, Zustand and FastAPI.

The hosted frontend is designed to work at **₹0 required service cost** using GitHub Pages, static export and browser-persisted data. The repository also contains a tested FastAPI backend for local/API demonstration.

> EDU_ONE is a serious portfolio system, not a claim that a production student-information platform can safely run from browser storage. A real institutional deployment would need server-side identity, durable storage, tenant isolation, audit logs, privacy controls, secure files, backups, observability and payment-provider integration.

## API and demo safety modes

EDU_ONE now has two deliberately separate backends:

- **Portfolio demo:** fictional browser-local records and legacy in-memory FastAPI routes. The legacy routes are disabled by default. Enable `EDUONE_DEMO_MODE=true` only for an isolated local demo; never expose that mode publicly.
- **Institutional API:** versioned `/v1` routes backed by SQLAlchemy and PostgreSQL. These routes use password-verified accounts, short-lived access tokens, rotating HttpOnly refresh cookies, tenant-aware records, server-side role/scope checks and audit events.

The institutional API requires `DATABASE_URL` and a strong `JWT_SECRET_KEY`. Run the migrations before using it. The institutional sign-in screen requires an account provisioned by the first College Admin. No real college records, payment provider or production identity service is configured in the hosted GitHub Pages demo.

**Do not use the browser-local demo workspace for real institutional records.**

## Engineering documentation

- [Current implementation status and release gates](docs/PROJECT_STATUS.md)
- [Institutional role and data-scope matrix](docs/ROLE_ACCESS_MATRIX.md)
- [Local PostgreSQL/API development setup](docs/LOCAL_DEVELOPMENT.md)
- [Original source-level engineering audit](docs/KNOW_ENVI_ENGINEERING_AUDIT.md)

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

The landing page provides quick access to six fictional demo roles:

- Super Admin
- College Admin
- Faculty
- Student
- Parent
- Staff

Choose a role card to enter the browser-local demo workspace. These shortcuts are not institutional accounts and do not authenticate against the database.

The institutional API supports additional staff designations such as HOD, Class Advisor, Principal, Vice Principal, Exam Cell, Accounts, Librarian, Placement Officer, HR, Admissions, Hostel Warden and Transport Coordinator. A College Admin provisions those accounts through the institutional user-management workflow.

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

The web app includes responsive desktop/tablet/mobile layouts, role-aware mobile navigation, a collapsible sidebar, command palette, installable manifest and service worker.

The service worker caches only public static build assets and the public app icon/manifest. It bypasses navigation requests and all API/dynamic data requests so authenticated student, staff, examination and financial responses are not stored in the shared service-worker cache. Offline mode does not imply that private records are available offline.

## FastAPI backend

The API lives in `apps/api`. It contains both the explicitly disabled legacy demo endpoints and the database-backed institutional API under `/v1`.

The institutional API includes:

- institution-scoped users, roles, staff assignments and verified parent/student links
- password hashing, short-lived access tokens, rotating/revocable refresh sessions and HttpOnly cookies
- student profiles and tenant-aware course catalog/enrolments
- attendance sessions, records and locking
- exams, marks entry/publication, assignments, submissions and grading
- fee invoices and pending payment requests with finance-side manual verification
- library catalogue, loans, returns and overdue fine records
- announcements, per-user read receipts, support tickets and messages
- timetable, academic calendar and placement opportunities
- audit events and database readiness checks

PostgreSQL schema changes are managed with Alembic. The API can be run locally with Docker Compose; see [Local development](docs/LOCAL_DEVELOPMENT.md).

The fee workflow does not process money. A submitted UPI/bank/cash reference remains pending until authorized Accounts staff verify it. Payment gateway checkout, signed webhooks and reconciliation are not configured. Password reset email, MFA, login throttling, secure document storage, external notifications and a production deployment are also outstanding.

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

- FastAPI and Pydantic
- SQLAlchemy 2.x and Alembic migrations
- PostgreSQL for the institutional data store
- PBKDF2 password hashing and signed short-lived access tokens
- Pytest API, authorization and migration checks

### Engineering

- GitHub Actions
- TypeScript typecheck
- production static build
- API smoke tests
- GitHub Pages deployment
- PWA manifest + service worker

## Run locally

### Institutional API + PostgreSQL

The recommended local setup uses Docker Compose to start PostgreSQL, apply migrations and launch FastAPI:

```bash
cp .env.example .env
# Edit .env: set a long URL-safe PostgreSQL password and a JWT secret of 32+ random bytes.
docker compose up --build -d
```

Create the first administrator using the one-time bootstrap command and the environment variables documented in [Local development](docs/LOCAL_DEVELOPMENT.md). Then start the frontend:

```bash
npm --prefix apps/web install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev:web
```

Open `http://localhost:3000` and choose **Institution sign in**. The institutional API is available at `http://localhost:8000`; API docs are at `/docs`.

### Portfolio demo

The landing page also offers fictional local demo roles. They are separate from institution accounts and do not prove or provide institutional authentication. The legacy in-memory API routes remain disabled unless `EDUONE_DEMO_MODE=true` is explicitly set for a local demo.

## Validate

Run the frontend checks:

```bash
npm --prefix apps/web install
npm run lint:web
npm run typecheck:web
npm run build:web
```

Run the complete API suite and validate every database migration against SQLite:

```bash
pip install -r apps/api/requirements.txt
python -m pytest apps/api -q
cd apps/api
DATABASE_URL=sqlite:///./ci.db alembic upgrade head
```

GitHub Actions runs frontend lint/typecheck/build, the full API test suite and migration validation on the development branch and pull requests.

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
├── .github/workflows/
│   ├── web-ci.yml
│   └── deploy-pages.yml
├── apps/
│   ├── api/
│   │   ├── migrations/
│   │   ├── Dockerfile
│   │   ├── main.py
│   │   ├── models.py
│   │   └── requirements.txt
│   └── web/
│       ├── app/
│       ├── components/
│       ├── lib/
│       └── public/
├── docs/
│   ├── KNOW_ENVI_ENGINEERING_AUDIT.md
│   ├── LOCAL_DEVELOPMENT.md
│   ├── PROJECT_STATUS.md
│   └── ROLE_ACCESS_MATRIX.md
├── .env.example
├── docker-compose.yml
├── package.json
└── LICENSE
```

## Production boundary

The institutional API is a development foundation, not a production-ready college ERP. Before real institutional use, complete an independent security review and operational readiness work, including:

1. persistent login throttling/lockout, password reset/invitation delivery and optional MFA
2. verification of tenant boundaries and resource scopes across every route and database relationship
3. production PostgreSQL hosting, encrypted backups and tested restore procedures
4. HTTPS, secure same-site frontend/API cookie deployment, managed secrets and monitoring
5. private file storage with type/size validation, malware scanning and short-lived access
6. verified payment-provider checkout/webhooks and finance reconciliation
7. privacy notices, consent, retention/deletion rules and institutional data-processing agreements
8. accessible UI review, end-to-end workflows and load testing
9. human review for academic-risk analytics; no automated high-stakes student decisions
10. production deployment and incident-response runbooks

GitHub Pages hosts only the static frontend. It does not host FastAPI or PostgreSQL. A real institutional deployment needs a separately hosted API and database, with the frontend/API configured on a compatible same-site domain for secure refresh cookies.

See [Local development](docs/LOCAL_DEVELOPMENT.md) for the supported development setup and the repository's remaining boundaries.

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

The API includes class timetable slots, faculty assignments, effective dates and overlap checks for both classes and faculty. Students can read their own class timetable, faculty can read their assigned timetable, and staff access is checked against course/class/department scopes. Calendar events can be targeted by role, department or class. The institutional workspace now includes a live timetable read view for students and faculty, a verified linked-student timetable view for parents, and a published academic calendar for all authorized accounts. The class-level timetable editor and administrative class schedule view remain to be completed.


## Placement opportunities

Placement Officers can publish, close and review opportunities and manage application outcomes. Students can view published opportunities, submit one application per opportunity and track shortlist/interview/selection/rejection status. Eligibility text is currently informational; automated CGPA/programme checks, resume upload/storage, interview scheduling and employer integrations remain open.


The institutional workspace includes a live student view for profile, attendance, results, courses, timetable, calendar, fees and placements. Staff can open the attendance marking screen, load only students enrolled in an assigned course, save present/absent/late/excused statuses and explicitly lock the session. College Admins have a user administration screen for account creation and activation/deactivation.


The Accounts workspace supports student-linked invoice creation and a pending-payment verification queue. Payment references remain unverified until an Accounts user or College Admin explicitly verifies them; the application does not initiate UPI/bank transfers or claim that a student has paid merely because a request was submitted.


The live Library screen lets Librarians/College Admins add catalogue items, issue available copies to enrolled student profiles and record returns; students can view their own loan history. Overdue fines are calculated and recorded on return but are not automatically collected.


The Support workspace is available to students, parents with verified links, Support Staff, College Admin, Principal and Vice Principal. It supports ticket creation, private message threads and status/resolution updates. Support attachments and external notification delivery are not enabled.


The live Academics workspace gives students access to published exams, assignments and published marks, with text-based assignment submission. Faculty can create assignments, review submissions and enter course-scoped marks. Exam Cell/College Admin can create and publish exams and publish marks; results remain hidden from students until publication. File attachments, exam seating/hall-ticket generation and grade-point/CGPA calculation are not yet integrated.
