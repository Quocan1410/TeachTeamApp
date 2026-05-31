# TeachTeamApp

Platform for hiring **tutors** and **lab assistants** on university-style courses (RMIT model): candidates apply, lecturers review and rank applicants, and a dedicated admin panel handles operations.

| Component | Stack | Default port |
|-----------|-------|--------------|
| **frontend** | Next.js 15, React 19, Apollo Client, Socket.IO | 3000 |
| **backend** | Express 5, TypeORM, MySQL, Socket.IO, JWT | 5000 |
| **admin-frontend** | Next.js 15, GraphQL client | 3001 |
| **admin-backend** | Apollo Server, TypeGraphQL, WebSocket subscriptions | 4002 |

Full documentation: [docs/README.md](docs/README.md) (architecture, ERD, API, deployment).

---

## Roles

| Role | Sign-in | UI |
|------|---------|-----|
| **Candidate** (`@candidate.edu.au`) | REST `/api/auth` | http://localhost:3000 → `/tutor` |
| **Lecturer** (`@lecturer.edu.au`) | REST `/api/auth` | http://localhost:3000 → `/lecturer` |
| **Admin** (single account, `ADMIN_EMAIL`) | GraphQL `adminLogin` | http://localhost:3001 |

Admins **cannot** register via the main app; use the admin panel and GraphQL only.

---

## Requirements

- **Node.js** 18+
- **MySQL** 8+
- Root **`.env`** file (copy from `env.example`)

---

## Install & run locally

```bash
npm run install
cp env.example .env
# Edit DB_* and secrets (openssl rand -hex 32)
```

Create the MySQL database, then seed demo data:

```bash
cd backend && npm run db:reset
```

Main app (Windows):

```bash
npm run dev:windows
```

Admin stack (separate terminal):

```bash
npm run dev:admin:windows
```

| Service | URL |
|---------|-----|
| Main app | http://localhost:3000 |
| REST API | http://localhost:5000/api |
| Health | http://localhost:5000/health |
| Forgot password | http://localhost:3000/forgot-password |
| Admin UI | http://localhost:3001 |
| Admin GraphQL | http://localhost:4002/graphql |

Production build:

```bash
npm run build
```

---

## Demo accounts

After `npm run db:reset` in `backend/`:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@admin.com` | Value of `ADMIN_PASSWORD` in `.env` (default `admin`) |
| **Lecturer** | `jane.lecturer@lecturer.edu.au` | `Password123!` |
| **Lecturer** | `marcus.lecturer@lecturer.edu.au` | `Password123!` |
| **Candidate** | `alex.candidate@candidate.edu.au` | `Password123!` |
| **Candidate** | `sam.candidate@candidate.edu.au` | `Password123!` |
| **Candidate (blocked)** | `taylor.candidate@candidate.edu.au` | `Password123!` — test block/unblock in admin |

More seed users: `backend/src/seeds/bootstrapDataset.ts`.

---

## Environment variables

A single **root `.env`** is shared by backend, admin-backend, and Next.js (frontend loads `../.env`).

See **`env.example`** for the full list. Important groups:

- **DB_*** — MySQL
- **BACKEND_JWT_SECRET**, **ADMIN_JWT_SECRET**, **ADMIN_SESSION_SECRET**
- **ADMIN_EMAIL**, **ADMIN_PASSWORD** — single system admin
- **SMTP_*** — optional; password reset emails (dev logs link if unset)
- **FRONTEND_URL**, **ADMIN_FRONTEND_URL**, **ALLOWED_ORIGINS** — CORS
- **NEXT_PUBLIC_*** — public browser URLs only (never secrets)

---

## Repository layout

```
TeachTeamApp/
├── frontend/           # Candidates + lecturers
├── backend/            # REST + Socket.IO
├── admin-frontend/     # Admin dashboard
├── admin-backend/      # Admin GraphQL
├── docs/               # Architecture, ERD, API, deployment
├── deploy/vps/         # Nginx + PM2 + production env template
└── env.example
```

---

## Production deployment

**Recommended:** full stack on **VPS + domain** (Nginx, PM2, MySQL) — see [docs/deployment.md](docs/deployment.md).

**Split hosting (free tiers / limits):**

| Component | Suggested host |
|-----------|----------------|
| `frontend/` | Vercel — Root Directory: `frontend`, Next.js 15.2.9+ |
| `backend/` | Render / Railway |
| MySQL | Railway, PlanetScale, or MySQL on VPS |

After deploy, set `NEXT_PUBLIC_*`, `FRONTEND_URL`, and `ALLOWED_ORIGINS` to your real URLs.

---

## API overview

- **REST:** `GET /health`, `/api/public/*`, `/api/auth/*` (incl. forgot/reset password), `/api/applications/*`, `/api/notifications/*`, …
- **GraphQL (admin):** users, courses, reports, announcements, subscriptions

Full list: [docs/api-reference.md](docs/api-reference.md).

---

## Root scripts

```bash
npm run install
npm run dev:windows          # frontend + backend
npm run dev:admin:windows    # admin-frontend + admin-backend
npm run build
npm run db:reset             # wipe + reseed DB (from repo root)
```

---

## Export documentation as PDF

```bash
# Requires pandoc: https://pandoc.org/
pandoc docs/CONSOLIDATED.md -o docs/TeachTeamApp-Documentation.pdf --toc -V geometry:margin=1in
```

Or open `docs/CONSOLIDATED.md` in VS Code / GitHub and print to PDF.

---

## Security notes

- Never commit `.env`.
- Rotate all secrets in production; demo passwords are for development only.
- Use Next.js **≥ 15.2.9** on Vercel to avoid CVE deploy blocks.
- Configure **SMTP** for password reset emails in production.
