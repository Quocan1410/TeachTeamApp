import { sendPasswordResetEmail } from "./emailService";

export type EmailJob =
    | {
          type: "password_reset";
          to: string;
          resetUrl: string;
      };

const queue: EmailJob[] = [];
let processing = false;

export function enqueueEmail(job: EmailJob): void {
    queue.push(job);
    void drainQueue();
}

export async function drainQueue(): Promise<void> {
    if (processing) return;
    processing = true;

    try {
        while (queue.length > 0) {
            const job = queue.shift();
            if (!job) break;

            if (job.type === "password_reset") {
                await sendPasswordResetEmail(job.to, job.resetUrl);
            }
        }
    } finally {
        processing = false;
    }
}

export function getEmailQueueLength(): number {
    return queue.length;
}
