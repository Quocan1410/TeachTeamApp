import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !email.endsWith("@candidate.edu.au") || !email.startsWith("e2e.")) {
  console.error("Refusing to delete an email outside the e2e. candidate test range");
  process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const requireFromBackend = createRequire(path.join(root, "backend/package.json"));
requireFromBackend("dotenv").config({ path: path.join(root, "backend/.env") });
const mysql = requireFromBackend("mysql2/promise");

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === "required" ? { rejectUnauthorized: false } : undefined,
});

const [users] = await connection.execute("SELECT id FROM users WHERE email = ?", [email]);
if (!users.length) {
  await connection.end();
  console.log("No test user to delete");
  process.exit(0);
}

const userId = users[0].id;
const childDeletes = [
  ["passkey_challenges", "userId"],
  ["passkey_credentials", "userId"],
  ["refresh_tokens", "userId"],
  ["notifications", "userId"],
  ["application_drafts", "candidateId"],
];

for (const [table, column] of childDeletes) {
  try {
    await connection.execute(`DELETE FROM \`${table}\` WHERE \`${column}\` = ?`, [userId]);
  } catch {
    // Table or column is absent in this database.
  }
}

const [applications] = await connection.execute(
  "SELECT id FROM applications WHERE candidateId = ?",
  [userId]
);
for (const application of applications) {
  try {
    await connection.execute("DELETE FROM selected_candidates WHERE applicationId = ?", [
      application.id,
    ]);
  } catch {
    // Selection table may not reference this application.
  }
}
await connection.execute("DELETE FROM applications WHERE candidateId = ?", [userId]);
await connection.execute("DELETE FROM users WHERE id = ?", [userId]);
await connection.end();
console.log("Deleted test user");
