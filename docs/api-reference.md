# API Reference — TeachTeamApp

Base URL (local): `http://localhost:5000`

Admin GraphQL: `http://localhost:4002/graphql`

Most REST routes use `Authorization: Bearer <token>` or an httpOnly auth cookie after `POST /api/auth/signin`.

---

## Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | — | API status |

---

## Public

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/public/lecturers` | — | Lecturers for homepage (non-blocked) |

---

## Auth — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/signup` | — | Register (`@candidate.edu.au` / `@lecturer.edu.au`) |
| POST | `/signin` | — | Sign in |
| POST | `/logout` | — | Sign out |
| POST | `/forgot-password` | — | Request password reset (candidate/lecturer only) |
| POST | `/reset-password` | — | Set new password (`token`, `password`, `confirmPassword`) |
| GET | `/profile` | ✓ | Current profile |
| PUT | `/profile` | ✓ | Update profile |
| PATCH | `/theme` | ✓ | Update light/dark theme |
| GET | `/avatar/image` | ✓ | Current user avatar |
| GET | `/users/:userId/avatar` | ✓ | Another user's avatar |
| POST | `/avatar` | ✓ | Upload avatar (multipart) |
| DELETE | `/avatar` | ✓ | Remove avatar |

---

## Applications — `/api/applications`

### Candidate

| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Create application |
| GET | `/my-applications` | My applications |
| GET | `/courses-and-roles` | Open courses and roles |
| PUT | `/:id/candidate-response` | Reply to lecturer |
| DELETE | `/:id/candidate-response` | Delete reply |
| PATCH | `/:id/candidate-response` | Edit message in thread |
| PUT | `/:id/withdraw` | Withdraw application |
| PUT | `/:id/message-reactions` | Toggle emoji reaction |
| POST | `/:id/offer-response` | Accept/decline offer |

### Lecturer

| Method | Path | Description |
|--------|------|-------------|
| GET | `/lecturer` | Application list (filters) |
| GET | `/statistics` | Statistics |
| GET | `/lecturer-assigned-courses` | Assigned courses |
| PUT | `/:id/status` | Update status (select/reject) |
| POST | `/:id/shortlist` | Shortlist |
| DELETE | `/:id/shortlist` | Remove shortlist |
| POST | `/:id/comment` | Add comment |
| PUT | `/:id/comment` | Update comment |
| DELETE | `/:id/comment` | Delete comment |
| POST | `/:id/ranking` | Add to ranking |
| PUT | `/:id/ranking` | Update rank |
| DELETE | `/:id/ranking` | Remove from ranking |
| DELETE | `/:id/blocked` | Remove blocked candidate's application |
| POST | `/:id/review` | Mark as reviewed |
| GET | `/:id/lecturer-notes` | Internal notes |
| PUT | `/:id/lecturer-notes` | Update internal notes |

---

## Application drafts — `/api/application-drafts`

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/` | candidate | List drafts |
| GET | `/:courseId/:roleId` | candidate | Get one draft |
| PUT | `/:courseId/:roleId` | candidate | Save draft |
| DELETE | `/:courseId/:roleId` | candidate | Delete draft |

---

## Announcements — `/api/announcements`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/active` | Active announcements (by audience) |

---

## Notifications — `/api/notifications`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List for current user |
| PUT | `/read-all` | Mark all read |
| PUT | `/:id/read` | Mark one read |
| DELETE | `/:id` | Delete |

---

## Admin GraphQL — `admin-backend`

Endpoint: `POST /graphql`  
Playground (dev): open `/graphql` on port 4002.

### Auth

| Type | Name | Description |
|------|------|-------------|
| Mutation | `adminLogin(email, password)` | Admin sign-in |
| Mutation | `adminLogout` | Admin sign-out |

### Users

| Type | Name |
|------|------|
| Query | `getAllUsers`, `getUsersByType`, `getUserStats`, `getUserById` |
| Mutation | `blockUser`, `unblockUser`, `deleteUser` |

### Courses

| Type | Name |
|------|------|
| Query | `getAllCourses`, `getCourseById`, `getAllCourseAssignments`, `getUnassignedLecturers` |
| Mutation | `createCourse`, `updateCourse`, `deleteCourse`, `assignLecturerToCourse`, `removeLecturerFromCourse` |

### Reports

| Type | Name |
|------|------|
| Query | `getCandidatesChosenPerCourse`, `getCandidatesWithMultipleSelections`, `getUnselectedCandidates` |

### Announcements (admin)

| Type | Name |
|------|------|
| Query | `getAllAnnouncements`, `getAnnouncementById` |
| Mutation | `createAnnouncement`, `updateAnnouncement`, `deleteAnnouncement` |

### Notifications (admin)

| Type | Name |
|------|------|
| Query | `getMyNotifications`, `getUnreadNotificationCount` |
| Mutation | `markNotificationAsRead`, `markAllNotificationsAsRead`, `deleteNotification` |

### Subscriptions

| Name | Description |
|------|-------------|
| `candidateBlocked` | Candidate blocked |
| `userAccountEvent` | Account events |
| `courseEvent` | Course changes |

---

## Socket.IO (backend)

Connect to `NEXT_PUBLIC_SOCKET_URL`. Event details: `backend/src/socket/`.

---

## Reset database (dev)

Not exposed over HTTP by default; run on the server:

```bash
cd backend && npm run db:reset
```
