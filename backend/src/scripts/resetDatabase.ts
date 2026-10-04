import "reflect-metadata";
import "../config/loadEnv";
import { DatabaseResetService } from "../utils/dbReset";

async function main(): Promise<void> {
    await DatabaseResetService.resetDatabase();
    process.exit(0);
}

main().catch((error) => {
    process.exit(1);
});
