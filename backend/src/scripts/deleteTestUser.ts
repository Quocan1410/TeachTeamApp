import "reflect-metadata";
import { config } from "dotenv";
import path from "path";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { UserSecurityAnswer } from "../entities/UserSecurityAnswer";
import { RefreshToken } from "../entities/RefreshToken";
import { PasswordResetToken } from "../entities/PasswordResetToken";

config({ path: path.resolve(__dirname, "../../../.env") });

async function main(): Promise<void> {
    const email = process.argv[2];
    if (!email) {
        console.error("Usage: ts-node deleteTestUser.ts <email>");
        process.exit(1);
    }

    await AppDataSource.initialize();
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { email } });
    if (!user) {
        console.log("NOT_FOUND");
        await AppDataSource.destroy();
        process.exit(0);
    }

    await AppDataSource.getRepository(UserSecurityAnswer).delete({
        userId: user.id,
    });
    await AppDataSource.getRepository(RefreshToken).delete({
        userId: user.id,
    });
    await AppDataSource.getRepository(PasswordResetToken).delete({
        userId: user.id,
    });
    await userRepo.delete({ id: user.id });
    console.log("DELETED", email);
    await AppDataSource.destroy();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
