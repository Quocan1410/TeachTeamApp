import { AppDataSource } from "../config/database";
import { Role } from "../entities/Role";

const DEFAULT_ROLES = [
    {
        roleName: "tutor",
        description: "Tutor role for conducting tutorial sessions",
    },
    {
        roleName: "lab_assistant",
        description: "Lab Assistant role for assisting in laboratory sessions",
    },
] as const;

export async function seedDefaultRoles(): Promise<void> {
    try {
        const roleRepository = AppDataSource.getRepository(Role);

        for (const roleData of DEFAULT_ROLES) {
            const existing = await roleRepository.findOne({
                where: { roleName: roleData.roleName },
            });
            if (!existing) {
                await roleRepository.save(roleRepository.create(roleData));
            }
        }
    } catch (error) {
        console.error("Error seeding default roles:", error);
    }
}
