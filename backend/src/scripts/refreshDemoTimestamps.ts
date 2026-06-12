import "reflect-metadata";
import { config } from "dotenv";
import path from "path";
import { initializeDatabaseConnection } from "../config/database";
import { refreshDemoTimestamps } from "../utils/refreshDemoTimestamps";

config({ path: path.resolve(__dirname, "../../../.env") });

async function main(): Promise<void> {
    await initializeDatabaseConnection();
    const result = await refreshDemoTimestamps();
    console.log(
        JSON.stringify(
            {
                ok: true,
                shiftMs: result.shiftMs,
                anchorBefore: result.anchorBefore,
                anchorAfter: result.anchorAfter,
            },
            null,
            2
        )
    );
    process.exit(0);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
