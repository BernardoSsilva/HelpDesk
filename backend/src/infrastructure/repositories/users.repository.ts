import type { UserEntity } from "../../domain/entities/user.entity.js";
import type { UserRoleEnum } from "../../domain/enums/userRole.enum.js";
import { prisma } from "../prisma.client.js";

export class UserRepository {
    public async createUser(entity: UserEntity) {
        return await prisma.user.create({
            data: {
                id: entity.getId(),
                email: entity.getEmail(),
                name: entity.getUserName(),
                password: entity.getPassword(),
                role: entity.getUserRole(),
                createdAt: entity.createdAt,
            },
        })
    }

    public async findById(id: string) {
        return await prisma.user.findUnique({
            where: {
                id,
            },
        })
    }

    /** E-mails são tratados sem diferenciar maiúsculas/minúsculas. */
    public async findByEmail(email: string) {
        return await prisma.user.findFirst({
            where: {
                email: {
                    equals: email,
                    mode: "insensitive",
                },
            },
        })
    }

    public async listUsers() {
        return await prisma.user.findMany({
            orderBy: {
                name: "asc",
            },
        })
    }

    /** Lista mínima (id e nome) disponível para qualquer usuário autenticado. */
    public async listDirectory() {
        return await prisma.user.findMany({
            orderBy: {
                name: "asc",
            },
            select: {
                id: true,
                name: true,
            },
        })
    }

    public async countByRole(role: UserRoleEnum) {
        return await prisma.user.count({
            where: {
                role,
            },
        })
    }

    public async updateUser(entity: UserEntity) {
        return await prisma.user.update({
            where: {
                id: entity.getId()
            },
            data: {
                email: entity.getEmail(),
                name: entity.getUserName(),
                password: entity.getPassword(),
                role: entity.getUserRole(),
                updatedAt: new Date()
            }
        })
    }

    public async deleteUser(id: string) {
        return await prisma.user.delete({
            where: {
                id
            },
        })
    }
}
