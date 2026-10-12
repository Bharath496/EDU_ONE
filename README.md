# EDU_ONE

**EDU_ONE** is a portfolio-grade college operating-system concept built with Next.js and TypeScript.

It brings common academic and administrative workflows into one multi-role interface for students, faculty, parents, college administrators, and platform administrators.

## What it demonstrates

- Role-based login flows
- Multi-role dashboards
- Student records
- Faculty management
- Attendance workflows
- Exams and marks
- Assignments
- Fee tracking
- Notices and announcements
- Library workflows
- Reports and settings
- Responsive sidebar and mobile navigation
- Command palette and reusable UI components
- Explainable student-intelligence module
- Functional FastAPI demo backend with health, demo-data, summary, and student-risk endpoints
- TypeScript-first frontend architecture
- Free Vercel deployment support

## Student Intelligence

The Student Intelligence module adds a practical analytics layer without paid services.

It includes:

- student search
- department filters
- score and attendance KPIs
- recent performance trend
- transparent High / Medium / Low academic-risk classification
- readable reasons for every risk flag
- CSV export

The logic is intentionally explainable. It does not pretend that a black-box AI score is automatically trustworthy.

## Demo roles

The current portfolio build includes demo sessions for:

- Super Admin
- College Admin
- Faculty
- Student
- Parent

The authentication layer is intentionally a demo implementation for portfolio use. It must be replaced with production authentication before handling real institutional data.

## Tech stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Zustand
- Axios
- Lucide React

## Run locally

### Web

From the repository root:

```bash
npm --prefix apps/web install
npm run dev:web
```

Then open the local Next.js URL shown in the terminal.

### API

Create a Python environment, install the API dependencies, then run:

```bash
pip install -r apps/api/requirements.txt
npm run dev:api
```

The FastAPI docs are available at `http://localhost:8000/docs`.

## Quality checks

```bash
npm run typecheck:web
npm run build:web
npm run test:api
```

A GitHub Actions workflow is included so public-repository CI can check the web build automatically.

## Free deployment

The web app is suitable for deployment on Vercel's free tier for portfolio/demo use.

The repository already points to:

`https://edu-one-eta.vercel.app`

Deployment availability depends on the connected Vercel project and its current configuration.

## Important production note

EDU_ONE is a portfolio/demo system. Before using it with real student or institutional data, production work would still be required for:

- secure server-side authentication
- encrypted secrets
- tenant isolation
- a persistent database
- authorization enforcement on the backend
- audit logging
- file-storage security
- payment-provider integration
- privacy and retention policies
- backups and disaster recovery

Keeping those boundaries explicit is considerably more credible than claiming a demo is magically enterprise-ready because the gradient looks expensive.

## Project structure

```text
EDU_ONE/
├── apps/
│   ├── api/
│   │   ├── main.py
│   │   └── test_main.py
│   ├── web/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   └── api/
├── package.json
└── package-lock.json
```

## Portfolio summary

> Built a responsive multi-role college operating-system interface with academic, attendance, exam, assignment, fee, library, reporting, and explainable student-risk analytics workflows using Next.js, TypeScript, Tailwind CSS, and Zustand.
