# TeachTeamApp

Monorepo for hiring teaching assistants (tutors and lab assistants) at RMIT-style courses. One MySQL database, a public REST API + UI for candidates and lecturers, and an admin GraphQL stack for operations and reporting.

---

## Roles & features

### Candidate (`@candidate.edu.au`)

Applies for **tutor** or **lab assistant** positions on published courses.

| Capability | Description |
|------------|-------------|
| Register / sign in | Email must end with `@candidate.edu.au` |
| Browse courses | View open roles and remaining slots per course |
| Apply | Submit skills, motivation, availability (part/full time) per course + role |
| Track applications | See status: pending, selected, or rejected |
| Profile | Update name; upload avatar (authenticated endpoint) |
| Notifications | In-app list; mark read / delete |
| Live account alerts | WebSocket when admin blocks or deletes the account |

**UI:** http://localhost:3000 → `/tutor` after login

---

### Lecturer (`@lecturer.edu.au`)

Reviews applicants **only on assigned courses** (set by admin).

| Capability | Description |
|------------|-------------|
| Register / sign in | Email must end with `@lecturer.edu.au` |
| Assigned courses | See courses linked to this lecturer |
| Applicant list | Filter by name, course, role, status, skills |
| Select candidates | Mark applications selected (enforces `maxTutors` / `maxLabAssistants`) |
| Comments | Add, edit, or remove feedback on selected applicants |
| Rankings | Order selected candidates per course (after comment) |
| Statistics | Dashboard metrics for assigned courses |
| Notifications | e.g. new applications, candidate blocked |
| Live updates | WebSocket when a candidate on their course is blocked |

**UI:** http://localhost:3000 → `/lecturer` after login

**Homepage:** Lecturers also appear on the public “Meet Our Lecturers” section via `GET /api/public/lecturers` (non-blocked only).

---

### Admin (`admin@admin.com`)

Full platform management via **admin UI + GraphQL** (not the main REST app).

| Capability | Description |
|------------|-------------|
| Sign in | Admin-only GraphQL login |
| Users | List all users; block / unblock / delete (not other admins) |
| Courses | Create, update, delete courses; set tutor & lab caps |
| Assign lecturers | Link lecturers to courses |
| Reports | Selected per course, multi-course selections, unselected candidates |
| Notifications | Admin notification center |
| Real-time events | Subscriptions for user block/delete and course changes |

Blocking a **candidate** auto-unselects their applications and notifies affected lecturers. Blocked users cannot sign in; blocked lecturers are hidden from the public homepage.

**UI:** http://localhost:3001  
**API:** http://localhost:4002/graphql

---

## Position types (not user roles)

Stored in table `roles` — what a candidate applies for:

| `roleName` | Meaning |
|------------|---------|
| `tutor` | Tutorial / teaching support |
| `lab_assistant` | Laboratory session support |

Each course has limits: `maxTutors`, `maxLabAssistants`.

---

## Quick start

**Prerequisites:** Node.js 18+, MySQL, `.env` from `env.example`

```bash
npm run install
cp env.example .env   # set DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME

npm run dev:windows        # frontend :3000 + backend :5000
npm run dev:admin:windows  # admin UI :3001 + GraphQL :4002
```

| Service | URL |
|---------|-----|
| Main UI | http://localhost:3000 |
| REST API | http://localhost:5000/api |
| Admin UI | http://localhost:3001 |
| Admin GraphQL | http://localhost:4002/graphql |

---

## 5-minute demo flow

1. Open homepage → four lecturers loaded from the database.  
2. **Candidate:** `alice.chen@candidate.edu.au` / `candidate123` → apply or view applications on `/tutor`.  
3. **Lecturer:** `john.smith@lecturer.edu.au` / `lecturer123` → review applicants on `/lecturer`.  
4. **Admin:** `admin@admin.com` / `admin` → Users → block `frank.blocked@candidate.edu.au` → candidate cannot sign in; homepage/API hide blocked lecturers.

---

## Dev seed data

Seeds run on backend start and via `POST /api/database/seed` (idempotent).  
Source: `backend/src/seeds/` (`runAllSeeds()` in `index.ts`).

**Reset database (dev):** `POST http://localhost:5000/api/database/reset`

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@admin.com` | `admin` |
| Lecturer | `john.smith@lecturer.edu.au` | `lecturer123` |
| Lecturer | `sarah.johnson@lecturer.edu.au` | `lecturer123` |
| Lecturer | `michael.williams@lecturer.edu.au` | `lecturer123` |
| Lecturer | `emily.brown@lecturer.edu.au` | `lecturer123` |
| Candidate | `alice.chen@candidate.edu.au` | `candidate123` |
| Candidate | `eva.patel@candidate.edu.au` | `candidate123` (selected on 2 courses — reports) |
| Candidate | `frank.blocked@candidate.edu.au` | `candidate123` (blocked — login fails) |

More candidates (pending / rejected / ranked): see `backend/src/seeds/devDataset.ts`.

---

## Project layout

```
TeachTeamApp/
├── frontend/          # Candidate & lecturer (Next.js)
├── backend/           # REST API + seeds (Express, TypeORM)
├── admin-frontend/    # Admin dashboard (Next.js)
├── admin-backend/     # GraphQL + WebSocket (Apollo, TypeORM)
└── env.example
```

---

## API overview

**REST** (main backend)

| Area | Endpoints |
|------|-----------|
| Public | `GET /api/public/lecturers` |
| Auth | `/api/auth/signup`, `signin`, `profile`, `avatar` |
| Applications | apply, my-applications, lecturer review, rank, comment |
| Notifications | `/api/notifications` |
| Dev ops | `/api/database/seed`, `reset`, `status` |

**GraphQL** (admin backend): users, courses, assignments, reports, notifications, subscriptions.

---

## Scripts

```bash
npm run install
npm run dev:windows
npm run dev:admin:windows
npm run build
```

---

## Notes

- JWT auth; role checks on REST and admin resolvers.  
- Avatars served through authenticated API routes (not public `/uploads`).  
- CORS: configure `ALLOWED_ORIGINS` in `.env`.  
- Do not commit `.env`.
