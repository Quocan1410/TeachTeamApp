import "reflect-metadata";
import { config } from "dotenv";
import path from "path";
import { DatabaseResetService } from "../utils/dbReset";

config({ path: path.resolve(__dirname, "../../../.env") });

async function main(): Promise<void> {
    await DatabaseResetService.resetDatabase();
    console.log("Database reset and bootstrap seed completed.");
    console.log("");
    console.log("Sign in again in the browser — existing sessions are invalid after reset.");
    console.log("Demo: david.lecturer@lecturer.edu.au / sam.candidate@candidate.edu.au");
    console.log("Password: Password123!");
    process.exit(0);
}

main().catch((error) => {
    console.error("Database reset failed:", error);
    process.exit(1);
});
