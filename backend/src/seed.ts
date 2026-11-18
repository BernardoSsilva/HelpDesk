import "dotenv/config";
import bcrypt from "bcrypt";
import { UserRoleEnum } from "./domain/enums/userRole.enum.js";
import { prisma } from "./infrastructure/prisma.client.js";

const defaultAdminPassword = "admin123";

const adminEmail = (process.env.ADMIN_EMAIL || "admin@empresa.com").trim().toLowerCase();
const adminName = process.env.ADMIN_NAME || "Administrador";
const adminPassword = process.env.ADMIN_PASSWORD || defaultAdminPassword;

async function seed() {
    const existingAdmin = await prisma.user.findFirst({
        where: {
            email: {
                equals: adminEmail,
                mode: "insensitive",
            },
        },
    });

    if (existingAdmin) {
        console.log(`Admin user already exists: ${adminEmail}`);
        return;
    }

    if (adminPassword === defaultAdminPassword) {
        console.warn("[seed] ADMIN_PASSWORD padrão em uso. Defina uma senha própria no .env antes de publicar.");
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
