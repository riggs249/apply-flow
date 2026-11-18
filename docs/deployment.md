# ApplyFlow Deployment Guide

No Google Cloud resources are created by this repository. Provisioning Cloud Run,
Cloud SQL, or Cloud Storage requires explicit approval and will incur costs.

## Cost considerations

- Docker Desktop and local PostgreSQL storage are free locally.
- Cloud Run charges mainly for allocated CPU, memory, requests, networking, and
  request-duration beyond the Google Cloud free allowance.
- Cloud SQL is billed continuously while its instance exists, including Small
  shared-core databases, storage, backups, and network usage. It is the most
  likely source of ongoing cost.
- Cloud Storage is usually low-cost for storage and operations, but data egress
  and larger file volumes can add charges.
- GitHub Actions may consume repository runner minutes beyond the plan allowance.

Use the Google Cloud billing dashboard and budget alerts before provisioning.

## Local Docker Compose

1. Create a local environment file:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Replace `JWT_SECRET` and the PostgreSQL password with local values.
3. Start all services:

   ```powershell
   docker compose up --build
   ```

4. Open:
   - Frontend: `http://localhost:4200`
   - Backend API: `http://localhost:8080`
   - Swagger: `http://localhost:8080/swagger-ui.html`

PostgreSQL data persists in the `applyflow-postgres-data` named volume.

## Production container configuration

The backend reads:

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_ACCESS_TOKEN_MINUTES`
- `JWT_REFRESH_TOKEN_DAYS`
- `FRONTEND_URL`
- `DDL_AUTO`

Do not set database or JWT values in source files or container manifests.
Use Secret Manager and environment-variable injection in the cloud runtime.

For a production database, prefer Flyway migrations and set `DDL_AUTO=validate`
instead of Hibernate `update`.

## Google Cloud Run: backend

After approval:

1. Push the backend image to Artifact Registry.
2. Create a Cloud SQL PostgreSQL instance only if the existing project budget
   explicitly permits its recurring cost.
3. Grant the Cloud Run service account access to the database secret and, for
   Cloud SQL Auth Proxy/private-IP connectivity, the required Cloud SQL roles.
4. Configure a Cloud Run service with:
   - `DB_URL`
   - `DB_USERNAME`
   - `DB_PASSWORD`
   - `JWT_SECRET`
   - `JWT_ACCESS_TOKEN_MINUTES=15`
   - `JWT_REFRESH_TOKEN_DAYS=30`
   - `FRONTEND_URL=https://your-frontend-host`
   - `DDL_AUTO=validate`
5. Attach the Cloud SQL instance using Cloud Run's Cloud SQL connection setting.

Recommended secure JDBC form with Cloud SQL Java Connector:

```text
jdbc:postgresql:///<database>?cloudSqlInstance=<project>:<region>:<instance>&socketFactory=com.google.cloud.sql.postgres.SocketFactory&enableIamAuth=true
```

The connector dependency and database IAM principal must be added explicitly
before using this JDBC form.

## Cloud SQL networking

Preferred approaches:

- Cloud SQL Auth Proxy sidecar or private IP with Cloud Run VPC connector.
- Google-managed Cloud SQL IAM authentication when the connector and database
  configuration support it.

Avoid public IP and plaintext database passwords. Store the database password
and JWT secret in Secret Manager.

## Frontend hosting

The Angular container can be hosted on Cloud Run or Firebase Hosting/Cloud
Storage. The included Nginx container is suitable for Cloud Run:

- Set `BACKEND_URL` to the deployed backend URL.
- Serve frontend traffic over HTTPS.
- Keep `/api/` requests on the backend through Nginx.

For a static Cloud Storage/Firebase frontend, configure the hosting provider to
rewrite unknown routes to `index.html` and proxy or rewrite `/api/` to the
backend origin.

## Uploaded documents

At this stage, uploaded documents should use Cloud Storage only after adding:

- A private bucket
- A server-side signed or authenticated upload flow
- Object lifecycle rules
- Storage CORS rules for the frontend origin
- A path convention that includes the authenticated user ID

Do not expose a bucket or signed object URL without server-side authorization.

## GitHub Actions

The CI workflow runs backend tests, frontend tests/build, and Docker image
builds. It does not publish or deploy images. Add deployment jobs only after
Workload Identity Federation and approved target resources are configured.
