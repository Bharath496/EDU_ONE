# EDU_ONE local development

This repository contains two intentionally separate experiences:

- The portfolio/demo workspace uses fictional browser-local data.
- The institutional workspace uses the versioned FastAPI routes, PostgreSQL, database-backed accounts and server-side authorization.

Do not import real student, parent, staff, attendance, examination or financial records into a local demo.

## Requirements

- Docker Engine and Docker Compose v2
- Node.js 20+ and npm for the frontend

## Start PostgreSQL and the institutional API

1. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

2. Replace `POSTGRES_PASSWORD` with a long URL-safe random value and `JWT_SECRET_KEY` with at least 32 random bytes. One way to generate a JWT secret is:

   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(48))"
   ```

3. Start the database, apply all Alembic migrations, and start the API:

   ```bash
   docker compose up --build -d
   ```

4. Confirm readiness:

   ```bash
   curl http://localhost:8000/health
   curl http://localhost:8000/ready
   ```

   `/health` is a liveness check. `/ready` confirms that the configured database can be reached.

API documentation is available at `http://localhost:8000/docs`.

## Create the first institution administrator

The bootstrap command is deliberately one-time and refuses to add an administrator if the institution already contains a user. Run it only in a development environment and provide a unique password of at least 12 characters:

```bash
docker compose run --rm --no-deps \
  -e BOOTSTRAP_CONFIRM=YES \
  -e BOOTSTRAP_INSTITUTION_NAME="Example College" \
  -e BOOTSTRAP_INSTITUTION_CODE=EXAMPLE01 \
  -e BOOTSTRAP_ADMIN_NAME="Institution Administrator" \
  -e BOOTSTRAP_ADMIN_EMAIL=admin@example.edu \
  -e BOOTSTRAP_ADMIN_PASSWORD="replace-with-a-long-unique-password" \
  api python bootstrap_admin.py
```

Remove the bootstrap password from shell history and environment after use. Never commit credentials.

## Start the web application

In a second terminal:

```bash
npm --prefix apps/web install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev:web
```

Open `http://localhost:3000`, choose **Institution sign in**, and use the institution code and account created above.

The demo role shortcuts on the landing page remain fictional and are not institutional accounts.

## Stop and reset local services

Stop services while preserving the database volume:

```bash
docker compose down
```

To destroy the local database and all local records, including the administrator:

```bash
docker compose down -v
```

The second command is destructive. Do not use it if you need to preserve local test data.

## Deployment boundary

The Docker stack is a local development baseline, not a production deployment recipe. A production environment still needs managed PostgreSQL with tested backups, HTTPS, strong secret management, same-site frontend/API cookie deployment, rate limiting, monitoring, security review, privacy/retention policy, secure file storage, and payment-provider reconciliation. GitHub Pages is a static frontend host and does not host FastAPI or PostgreSQL. Do not enable `EDUONE_DEMO_MODE` on a public API.
