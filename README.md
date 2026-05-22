# TeachTeamApp

Teaching assistant hiring platform for candidates, lecturers, and admins. Four apps in one monorepo: public UI, REST API, admin UI, and admin GraphQL API.

**Repo:** https://github.com/rmit-fsd-2025-s1/s3959931-s3978302-a2

---

## Tech stack

| Layer | Stack |
|-------|--------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS, Apollo Client, Axios, Framer Motion |
| **Backend** | Node.js, Express 5, TypeORM, MySQL, JWT, Multer, Helmet, rate limiting |
| **Admin frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS, Apollo Client |
| **Admin backend** | Express, Apollo Server, Type-GraphQL, GraphQL WS, TypeORM, MySQL, sessions |

---

## What it does

### Candidates (`@candidate.edu.au`)
- Sign up / sign in
- Browse courses and tutor / lab assistant roles
- Submit and track applications
- Profile and avatar upload
- In-app notifications
- Real-time alerts when account is blocked

### Lecturers (`@lecturer.edu.au`)
- View assigned courses and applicants
- Select candidates (respects position limits)
- Rank selected candidates
- Review skills, credentials, and comments
- Live updates when candidates are blocked

### Admins (`admin@admin.com`)
- User CRUD, block / unblock, delete
- Course CRUD and position limits (`maxTutors`, `maxLabAssistants`)
- Assign lecturers to courses
- Reports and analytics dashboard
- Notification center
- Profile and avatar upload

### Platform
- REST API for auth, applications, notifications
- GraphQL + WebSocket subscriptions for admin and live events
- Protected avatars (auth required, no public `/uploads`)
- Role-based access on REST and GraphQL

---

## Quick start

**Prerequisites:** Node.js 18+, MySQL

```bash
git clone https://github.com/rmit-fsd-2025-s1/s3959931-s3978302-a2.git
cd s3959931-s3978302-a2
npm run install
cp env.example .env   # edit DB credentials and secrets
```

**Run (pick your OS):**

```bash
# Main app
npm run dev:windows        # or dev:unix

# Admin app (separate terminals or combined)
npm run dev:admin:windows  # or dev:admin:unix
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000/api |
| Admin UI | http://localhost:3001 |
| Admin GraphQL | http://localhost:4002/graphql |

**Default admin login:** `admin@admin.com` / `admin`

---

## Project layout

```
TeachTeamApp/
├── frontend/          # Candidate & lecturer UI (Next.js)
├── backend/           # REST API (Express + TypeORM)
├── admin-frontend/    # Admin dashboard (Next.js)
├── admin-backend/     # Admin API (GraphQL + WS)
├── env.example        # Environment template (copy to .env)
└── package.json       # Root scripts
```

---

## Main API surface

**REST** (`backend`, port 5000)

| Area | Examples |
|------|----------|
| Auth | `POST /api/auth/signup`, `signin`, `GET /profile`, `POST /avatar` |
| Applications | courses, apply, status, lecturer selections |
| Notifications | list, mark read |
| Health | `GET /health` |

**GraphQL** (`admin-backend`, port 4002)

| Type | Purpose |
|------|---------|
| Queries | users, courses, reports |
| Mutations | admin CRUD, block user, assign lecturer |
| Subscriptions | user blocked, account status |

---

## Scripts

```bash
npm run install          # all packages
npm run dev:windows      # frontend + backend
npm run dev:admin:windows
npm run build            # production build all
```

---

## Security (summary)

- JWT auth; separate secrets for backend and admin
- GraphQL resolvers protected with admin middleware
- CORS whitelist via `ALLOWED_ORIGINS`
- Rate limits on auth routes
- DB reset routes gated in production (`DEV_OPS_SECRET`)
- Never commit `.env` — use `env.example`

---

## Team

RMIT Full Stack Development 2025 S1 — s3959931, s3978302

License: ISC
