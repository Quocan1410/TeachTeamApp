# TeachTeamApp

Web app for university **tutor** and **lab assistant** hiring.

Candidates browse courses and apply. Lecturers review those applications. Admin lives in a separate repository: [TeachTeamApp-Admin](https://github.com/Quocan1410/TeachTeamApp__Admin).

| | |
|---|---|
| App | http://localhost:3000 |
| API | http://localhost:5000 |

The frontend is Next.js. The API is Express, TypeORM, and MySQL. `frontend/` and `backend/` each have their own `.env`.

## Run

Node.js 20+ and MySQL 8.

```bash
cp frontend/env.example frontend/.env
cp backend/env.example backend/.env

npm install
cd backend && npm run migration:run && cd ..

npm run dev:windows
```

On macOS or Linux, use `npm run dev:unix`.

Set `DB_*`, `BACKEND_JWT_SECRET`, and `ADMIN_JWT_SECRET` in `backend/.env` before the API will talk to your database. `ADMIN_JWT_SECRET` must match the admin repo when the admin app calls shared routes such as avatar upload.

## Who can sign up

The email domain sets the role. The address stays the school email.

- `@candidate.edu.au` → candidate (`/tutor`)
- `@lecturer.edu.au` → lecturer (`/lecturer`)

Sign-up also needs a title. The full name must be a first and last name, using letters, apostrophes, and hyphens. After a successful sign-up the app offers to save one passkey on this device.

## Sign in and password

Sign in with email and password, or with **Use a passkey** on a device that already saved one. Each account keeps one passkey.

**Forgot password** asks which method to use:

- **Passkey** signs you in. It does not reveal or email the password.
- **Email** and **Authenticator** show “This feature will be implemented later.”

On the profile page, **Update password** still requires the current password.

## Profile

`/profile` holds the name, the read-only school email, the avatar, and **Login & security**. **Theme** is in the account menu.

Avatar upload accepts JPG, PNG, WebP, GIF, AVIF, and BMP, up to 2MB.

## Candidate

`/tutor` is “Find your Teaching Roles”.

- Search waits a moment after you stop typing, then filters.
- Three filters sit under that search: status, role, and course-code order.
- Six course cards per page.
- The heart saves a course in this browser to apply later.
- An application picks a role, one or more skill tags, and a motivation of at least 20 characters.

`/tutor/applications` lists that candidate’s own applications.

## Lecturer

`/lecturer` is the application list: search, shortlist, rank, and decline. **Yes** shortlists the applicant and adds them to the ranking. **No** asks for confirmation, then declines the profile.

## Notifications and theme

The bell opens activity for the signed-in user. New activity can arrive over the Socket.IO connection. **Theme** in the account menu switches light and dark and keeps the choice on the account.

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

## Tests

With the app on port 3000 and the API on port 5000:

```bash
cd e2e
npm install
npx playwright install chromium
npm test
```

`npm test` runs the guest, candidate, and lecturer Playwright projects against the servers that are already running. GitHub Actions also runs frontend lint, typecheck, and build, the API typecheck and build, then a separate end-to-end job on a fresh MySQL database.
