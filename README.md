# TeachTeamApp

Web app for university **Tutor** and **Lab Assistant** hiring.

Candidates browse courses and apply. Lecturers review those applications. The admin site is a separate repo, [TeachTeamApp-Admin](../TeachTeamApp-Admin/).

| | |
|---|---|
| App | http://localhost:3000 |
| API | http://localhost:5000 |

Frontend is Next.js. Backend is Express, TypeORM, and MySQL. Each folder has its own `.env`.

## Run

Node.js 20+ and MySQL 8.

```bash
cp frontend/env.example frontend/.env
cp backend/env.example backend/.env

npm install
cd backend && npm run migration:run && cd ..

npm run dev:windows
```

On macOS or Linux, use `npm run dev:unix` instead.

## Who can sign up

The email domain sets the role:

- `@candidate.edu.au` → candidate (`/tutor`)
- `@lecturer.edu.au` → lecturer (`/lecturer`)

## Sign in and password

Sign in with email and password, or with a passkey on this device.

**Forgot password** asks which method to use:

- **Passkey** signs you in. It does not show or email the password.
- **Email** and **Authenticator** are not built yet.

On the profile page, changing the password still needs the current password.

## Candidate page

`/tutor` is “Find your Teaching Roles”.

- Search waits a moment after you stop typing, then filters.
- Three filters sit under that search: status, role, and course-code order.
- Six course cards per page, three on each row.
- The heart saves a course on this browser to apply later. If it closes within about a month and you have not applied, the page reminds you.
- The monkey in the corner has a short note. Open it and the speech bubble pauses.

`/tutor/applications` is the candidate’s own applications.

## Lecturer page

`/lecturer` is the application list: filter, sort, shortlist, rank, and select.

## Demo accounts

Password for every lecturer and candidate below: `Password123!`

| Role | Email |
|------|--------|
| Lecturer | `jane.morrison@lecturer.edu.au` |
| Lecturer | `marcus.chen@lecturer.edu.au` |
| Lecturer | `priya.sharma@lecturer.edu.au` |
| Candidate | `alex.nguyen@candidate.edu.au` |
| Candidate | `samira.patel@candidate.edu.au` |
| Candidate | `james.oconnor@candidate.edu.au` |

Admin (`admin@admin.com` / `admin`) signs in on the admin app at http://localhost:3001.
