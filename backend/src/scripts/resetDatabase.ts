import "reflect-metadata";
import { config } from "dotenv";
import path from "path";
import { DatabaseResetService } from "../utils/dbReset";

config({ path: path.resolve(__dirname, "../../../.env") });

async function main(): Promise<void> {
    await DatabaseResetService.resetDatabase();
    process.exit(0);
}

main().catch((error) => {
    process.exit(1);
});
