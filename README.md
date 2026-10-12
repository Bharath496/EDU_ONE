# EDU_ONE

EDU_ONE is a **portfolio-grade college operating system demo** built with Next.js, TypeScript, Zustand and FastAPI.

It is deliberately designed to be useful at **zero required service cost** for a portfolio/demo environment. Core frontend workflows persist in the browser, while the repository also includes a functional in-memory FastAPI backend that mirrors the main domains.

> EDU_ONE is not presented as a production student-information system. Real institutional deployment would require production authentication, a persistent database, tenant isolation, audit logs, privacy controls, backups, secure file storage and payment-provider integration.

## What is now functional

### Connected college workspace

The main app uses one persistent local data layer, so modules are no longer isolated static mockups.

- **Dashboard**
  - live student, attendance, fee and risk metrics
  - department snapshot
  - current priorities
  - role-based quick actions
  - workspace activity log

- **Students**
  - create, edit and remove students
  - search and department/status filters
  - active/inactive status control
  - CSV export

- **Attendance**
  - course and date based sessions
  - present / absent / late / excused states
  - bulk marking
  - persistent sessions
  - automatic recalculation of student attendance
  - CSV export

- **Assignments**
  - create assignments
  - draft / published / closed states
  - submission-progress display
  - persistent filters

- **Exams**
  - schedule exams
  - assessment type and status
  - venue, date, time, marks and class strength

- **Marks & Grades**
  - editable internal and external marks
  - live total, grade and pass/fail calculation
  - search, course filters and CSV export

- **Fees**
  - fee ledger and status filters
  - collected / pending / overdue metrics
  - demo payment completion
  - CSV export

- **Library**
  - persistent book catalog
  - add books
  - inventory availability
  - issue-copy simulation
  - CSV export

- **Notices**
  - publish announcements
  - priority and audience controls
  - pin / unpin
  - filters and search

- **Alerts**
  - generated from current students, fees, notices and exams
  - read/unread state
  - severity filters
  - mark-all-read

- **Student Intelligence**
  - explainable High / Medium / Low academic-risk classification
  - uses live CGPA, attendance and record status
  - department watchlist
  - risk filtering and CSV export
  - no paid AI API required

- **Reports**
  - real CSV generation from current workspace data
  - student, attendance, fee, assignment and notice exports

- **Profile & Settings**
  - editable demo profile
  - local notification preferences
  - JSON workspace backup and restore
  - reset demo workspace

### Super-admin demo

Super Admin has a separate persistent platform-demo data store.

- fictional tenant institution management
- add / activate / pause demo tenants
- platform-user management
- illustrative plan ledger
- analytics calculated from the demo store
- platform settings and reset controls

All institution/customer records in the Super Admin area are explicitly fictional demo data.

## Demo access

Open the app and choose a role:

- Super Admin
- College Admin
- Faculty
- Student
- Parent

The landing page uses **explicit demo authentication**. It does not pretend that Google/Microsoft SSO or production identity infrastructure is configured.

## FastAPI backend

The API lives in `apps/api/main.py`.

Implemented demo endpoints include:

- `/health`
- `/auth/login`
- `/auth/refresh`
- `/auth/logout`
- `/auth/me`
- `/dashboard/stats`
- `/students` CRUD
- `/faculty`
- `/attendance`
- `/attendance/bulk`
- `/exams`
- `/assignments`
- assignment submission
- `/fees`
- fee payment simulation
- `/notices`
- `/library/books`
- library issue / return
- `/reports`
- admin colleges / users / analytics
- settings
- explainable risk analytics

The API is intentionally **in-memory** for this portfolio build. Restarting it resets server-side demo mutations.

## Tech stack

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
- Pytest
- Uvicorn

### Quality
- GitHub Actions
- TypeScript typecheck
- Next.js production build
- API smoke tests

## Run locally

### 1. Web app

From the repository root:

```bash
npm --prefix apps/web install
npm run dev:web
```

Open:

```text
http://localhost:3000
```

### 2. FastAPI demo

Create a Python environment, then:

```bash
pip install -r apps/api/requirements.txt
npm run dev:api
```

API docs:

```text
http://localhost:8000/docs
```

Optional web API configuration:

```text
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Validate the project

```bash
npm --prefix apps/web install
npm run typecheck:web
npm run build:web
pip install -r apps/api/requirements.txt
npm run test:api
```

The repository also runs these checks automatically through GitHub Actions.

## Deployment

The web project is suitable for a Vercel portfolio deployment with the project root set to:

```text
apps/web
```

The repository currently records this portfolio URL:

```text
https://edu-one-eta.vercel.app
```

The API can be run locally or deployed separately to any compatible Python host. A deployed web app can point to it through `NEXT_PUBLIC_API_URL`.

## Project structure

```text
EDU_ONE/
├── .github/
│   └── workflows/
│       └── web-ci.yml
├── apps/
│   ├── api/
│   │   ├── main.py
│   │   ├── requirements.txt
│   │   └── test_main.py
│   └── web/
│       ├── app/
│       │   ├── admin/
│       │   ├── dashboard/
│       │   └── modules/
│       ├── components/
│       └── lib/
│           ├── auth-store.ts
│           ├── demo-data.ts
│           ├── edu-store.ts
│           ├── platform-store.ts
│           └── api.ts
├── package.json
└── LICENSE
```

## Production boundary

Before using EDU_ONE with real institutional data, at minimum add:

1. server-side authentication and authorization
2. real database persistence with migrations
3. strict tenant isolation
4. audit logging
5. encrypted secret management
6. secure document/file storage
7. rate limiting and abuse controls
8. payment-provider integration and webhooks
9. privacy, retention and consent policies
10. automated backups and disaster recovery
11. observability and error monitoring
12. security review and penetration testing

## License

MIT
