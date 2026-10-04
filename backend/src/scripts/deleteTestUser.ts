import "reflect-metadata";
import "../config/loadEnv";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { RefreshToken } from "../entities/RefreshToken";

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

    await AppDataSource.getRepository(RefreshToken).delete({
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
