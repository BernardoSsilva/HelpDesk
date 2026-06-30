import "dotenv/config";
import bcrypt from "bcrypt";
import { UserRoleEnum } from "./domain/enums/userRole.enum.js";
import { prisma } from "./infrastructure/prisma.client.js";

const adminEmail = process.env.ADMIN_EMAIL || "admin@empresa.com";
const adminName = process.env.ADMIN_NAME || "Administrador";
const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

async function seed() {
    const existingAdmin = await prisma.user.findUnique({
        where: {
            email: adminEmail,
        },
    });

    if (existingAdmin) {
        console.log(`Admin user already exists: ${adminEmail}`);
        return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await prisma.user.create({
        data: {
            email: adminEmail,
            name: adminName,
            password: hashedPassword,
            role: UserRoleEnum.ADMIN,
        },
    });

    console.log(`Admin user created: ${adminEmail}`);
}

seed()
    .catch((error) => {
        console.error("Seed failed", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
