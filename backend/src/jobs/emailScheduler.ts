import cron from "node-cron";
import { drainQueue } from "../services/emailQueue";

let started = false;

/** Process queued outbound emails every minute (assignment demo scheduler). */
export function startEmailScheduler(): void {
    if (started) return;
    started = true;

    cron.schedule("* * * * *", () => {
        void drainQueue();
    });
}
