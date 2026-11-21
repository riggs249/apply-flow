# HanapTracker

HanapTracker (Hiring and Application Navigation and Activity Platform Tracker) is a full-stack personal job application management platform with a
Spring Boot backend and Angular frontend.

## Prerequisites

- Java 21
- Maven wrapper (included)
- Node.js 22
- Docker Desktop with Compose
- PostgreSQL is provided by Docker Compose

## Project structure

```text
backend/             Spring Boot API
frontend/            Angular application
docker-compose.yml   Local PostgreSQL, backend, and frontend services
.github/workflows/   CI quality and image-build workflow
docs/deployment.md   Local Docker and Google Cloud deployment guide
```

## Local development

1. Copy the environment template:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Replace the placeholder JWT secret and PostgreSQL password.
3. Start PostgreSQL only:

   ```powershell
   docker compose up -d postgres
   ```

4. Start the backend:

   ```powershell
   cd backend
   .\mvnw.cmd spring-boot:run
   ```

5. Start the frontend in another terminal:

   ```powershell
   cd frontend
   npm ci
   npm start
   ```

The API runs at `http://localhost:8080`, Swagger at
`http://localhost:8080/swagger-ui.html`, and the frontend at
`http://localhost:4200`.

During Angular development, `proxy.conf.json` forwards `/api` to
`http://localhost:8080`. The Docker frontend uses `/api/v1` and Nginx proxies
`/api/` to the backend container.

## Local Docker Compose

```powershell
docker compose up --build
```

This starts PostgreSQL, the backend, and the frontend. PostgreSQL data is
stored in the `applyflow-postgres-data` named volume.

## Environment variables

Backend:

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_ACCESS_TOKEN_MINUTES`
- `JWT_REFRESH_TOKEN_DAYS`
- `FRONTEND_URL`
- `DDL_AUTO`
- `SERVER_PORT`

Compose:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_PORT`
- `BACKEND_PORT`
- `FRONTEND_PORT`

Never commit `.env` or real secrets.

## Demo data

The local `dev` profile seeds an idempotent preview account on startup:

- Email: `demo@applyflow.dev`
- Password: `ApplyFlow123!`

The seed creates demo companies, applications, interviews, assessments,
activities, and reminders. It only runs once per demo account, and only when
`SPRING_PROFILES_ACTIVE=dev` and `SEED_DEMO_DATA=true`.

It is not enabled for tests or production profiles.

## Authentication

The API uses short-lived signed JWT access tokens and opaque refresh tokens.
Refresh tokens are stored as SHA-256 hashes and rotated on use. The Angular
application keeps access tokens in memory rather than localStorage. Use HTTPS
in every deployed environment.

## Verification

Backend:

```powershell
cd backend
.\mvnw.cmd test
.\mvnw.cmd package
```

Frontend:

```powershell
cd frontend
npm ci
npm test -- --watch=false --browsers=ChromeHeadless
npm run build
```

Docker images:

```powershell
docker build -t applyflow-backend:local ./backend
docker build -t applyflow-frontend:local ./frontend
```

## CI/CD

`.github/workflows/ci.yml` automatically:

1. Runs backend tests and packages the JAR.
2. Runs Angular tests and creates a production build.
3. Builds both Docker images.

It does not deploy or publish credentials, and deployment jobs should remain
blocked until deployment infrastructure and Workload Identity Federation are
approved.

## Google Cloud deployment

See [Deployment Guide](docs/deployment.md) for Cloud Run, Cloud SQL, Cloud
Storage, secrets, networking, and frontend-hosting guidance.

No paid Google Cloud resources are created automatically. Cloud SQL and related
resources have recurring costs and require explicit approval before provisioning.
