import fs from "fs";
import path from "path";
import { config } from "dotenv";

/** Load `backend/.env` only. cwd is the backend folder when npm scripts run. */
export function loadBackendEnv(): void {
    const candidates = [
        path.resolve(process.cwd(), ".env"),
        path.resolve(__dirname, "../../.env"),
    ];

    for (const envPath of candidates) {
        if (!fs.existsSync(envPath)) continue;
        config({ path: envPath });
        return;
    }
}

loadBackendEnv();
