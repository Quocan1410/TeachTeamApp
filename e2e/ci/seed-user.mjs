/**
 * Demo rows for the user-app Playwright project.
 * Runs only against the empty CI database after the API has created the tables.
 */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const requireFromBackend = createRequire(path.join(root, "backend/package.json"));
const bcrypt = requireFromBackend("bcryptjs");
const mysql = requireFromBackend("mysql2/promise");

const passwordHash = bcrypt.hashSync("Password123!", 10);

const alex = "11111111-1111-4111-8111-111111111111";
const jane = "22222222-2222-4222-8222-222222222222";
const chloe = "33333333-3333-4333-8333-333333333333";
const zoe = "44444444-4444-4444-8444-444444444444";
const roleLab = "55555555-5555-4555-8555-555555555555";
const roleTutor = "66666666-6666-4666-8666-666666666666";
const acct = "77777777-7777-4777-8777-777777777777";
const stat = "88888888-8888-4888-8888-888888888888";
const mark = "99999999-9999-4999-8999-999999999999";
const cosc1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
const cosc2 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2";
const cosc3 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3";

const courses = [
  [acct, "ACCT1501", "Accounting and Financial Management"],
  [stat, "STAT1371", "Statistics"],
  [mark, "MARK1001", "Marketing"],
  [cosc1, "COSC2123", "Algorithms and Analysis"],
  [cosc2, "COSC2758", "Programming Fundamentals"],
  [cosc3, "COSC2801", "Software Engineering"],
  ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4", "E2E1001", "Extra Teaching Role"],
];

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "e2e",
  database: process.env.DB_NAME || "teachteamapp",
});

const userSql = `INSERT INTO users
  (id, email, password, firstName, lastName, userType, honorific, isBlocked, theme, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, NULL, 0, 'dark', NOW(6), NOW(6))
  ON DUPLICATE KEY UPDATE firstName = VALUES(firstName), lastName = VALUES(lastName), password = VALUES(password)`;

await connection.execute(userSql, [alex, "alex.nguyen@candidate.edu.au", passwordHash, "Alex", "Nguyen", "candidate"]);
await connection.execute(userSql, [jane, "jane.morrison@lecturer.edu.au", passwordHash, "Jane", "Morrison", "lecturer"]);
await connection.execute(userSql, [chloe, "chloe.martin@candidate.edu.au", passwordHash, "Chloe", "Martin", "candidate"]);
await connection.execute(userSql, [zoe, "zoe.hayes@candidate.edu.au", passwordHash, "Zoe", "Hayes", "candidate"]);

await connection.execute(
  `INSERT INTO roles (id, roleName) VALUES (?, 'lab_assistant'), (?, 'tutor')
   ON DUPLICATE KEY UPDATE roleName = VALUES(roleName)`,
  [roleLab, roleTutor]
);

for (const [id, code, name] of courses) {
  await connection.execute(
    `INSERT INTO courses
      (id, courseCode, courseName, semester, maxTutors, maxLabAssistants, applicationDeadline, createdAt, updatedAt)
     VALUES (?, ?, ?, 'Semester 2 2026', 5, 3, DATE_ADD(NOW(), INTERVAL 90 DAY), NOW(6), NOW(6))
     ON DUPLICATE KEY UPDATE courseName = VALUES(courseName)`,
    [id, code, name]
  );
}

await connection.execute(
  `INSERT INTO course_assignments (id, lecturerId, courseId, assignedAt)
   VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', ?, ?, NOW(6))
   ON DUPLICATE KEY UPDATE lecturerId = VALUES(lecturerId)`,
  [jane, mark]
);

const applicationSql = `INSERT INTO applications
  (id, candidateId, courseId, roleId, status, isWithdrawn, skills, appliedAt, updatedAt)
  VALUES (?, ?, ?, ?, 'pending', 0, 'Tutorials', NOW(6), NOW(6))
  ON DUPLICATE KEY UPDATE status = VALUES(status)`;

await connection.execute(applicationSql, [
  "cccccccc-cccc-4ccc-8ccc-ccccccccccc1",
  alex,
  stat,
  roleLab,
]);
await connection.execute(applicationSql, [
  "cccccccc-cccc-4ccc-8ccc-ccccccccccc2",
  chloe,
  mark,
  roleTutor,
]);
await connection.execute(applicationSql, [
  "cccccccc-cccc-4ccc-8ccc-ccccccccccc3",
  zoe,
  mark,
  roleTutor,
]);

await connection.end();
console.log("User E2E seed ready");
