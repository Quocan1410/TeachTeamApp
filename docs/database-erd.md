# Database schema (ERD)

MySQL, managed with TypeORM. Main tables and relationships:

```mermaid
erDiagram
    users ||--o{ applications : "candidateId"
    users ||--o{ course_assignments : "lecturerId"
    users ||--o{ notifications : "userId"
    users ||--o{ application_drafts : "candidateId"
    users ||--o{ password_reset_tokens : "userId"

    courses ||--o{ applications : "courseId"
    courses ||--o{ course_assignments : "courseId"
    courses ||--o{ application_drafts : "courseId"

    roles ||--o{ applications : "roleId"
    roles ||--o{ application_drafts : "roleId"

    applications ||--o| selected_candidates : "applicationId"
    users ||--o{ selected_candidates : "selectedById"

    users {
        int id PK
        string email UK
        string password
        string firstName
        string lastName
        enum userType "candidate|lecturer|admin"
        boolean isBlocked
        string avatarUrl
        string theme
    }

    courses {
        int id PK
        string courseCode UK
        string courseName
        string semester
        int maxTutors
        int maxLabAssistants
        datetime applicationDeadline
    }

    roles {
        int id PK
        string roleName "tutor|lab_assistant"
    }

    course_assignments {
        int id PK
        int lecturerId FK
        int courseId FK
    }

    applications {
        int id PK
        int candidateId FK
        int courseId FK
        int roleId FK
        string status "pending|selected|rejected"
        text skills
        text motivation
        json correspondenceMessages
        json messageReactions
        int rank
        string offerResponse
    }

    selected_candidates {
        int id PK
        int applicationId FK UK
        int selectedById FK
    }

    application_drafts {
        int id PK
        int candidateId FK
        int courseId FK
        int roleId FK
        json payload
    }

    notifications {
        int id PK
        int userId FK
        string type
        string title
        text message
        boolean read
    }

    announcements {
        int id PK
        string title
        text body
        string audience "all|candidate|lecturer"
        boolean isActive
    }

    password_reset_tokens {
        int id PK
        int userId FK
        string tokenHash UK
        datetime expiresAt
        datetime usedAt
    }
```

## Business constraints

| Table | Constraint |
|-------|------------|
| `applications` | Unique `(candidateId, courseId, roleId)` |
| `course_assignments` | Unique `(lecturerId, courseId)` |
| `application_drafts` | Unique `(candidateId, courseId, roleId)` |
| `selected_candidates` | Unique `applicationId` |
| `users.email` | Unique |

## Application roles (`roles` table)

Distinct from `users.userType`:

| `roleName` | Meaning |
|------------|---------|
| `tutor` | Tutor position |
| `lab_assistant` | Lab assistant position |

## Entity files

`backend/src/entities/*.ts` — `User`, `Course`, `Role`, `CourseAssignment`, `Application`, `SelectedCandidate`, `ApplicationDraft`, `Notification`, `Announcement`, `PasswordResetToken`.
