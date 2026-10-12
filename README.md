# EDU_ONE

EDU_ONE is a **portfolio-grade, multi-role college operating system demo** built with Next.js, TypeScript, Zustand and FastAPI.

The hosted frontend is designed to work at **₹0 required service cost** using GitHub Pages, static export and browser-persisted data. The repository also contains a tested FastAPI backend for local/API demonstration.

> EDU_ONE is a serious portfolio system, not a claim that a production student-information platform can safely run from browser storage. A real institutional deployment would need server-side identity, durable storage, tenant isolation, audit logs, privacy controls, secure files, backups, observability and payment-provider integration.

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
