import type { UserEntity } from "../../domain/entities/user.entity.js";
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

    public async findByEmail(email: string) {
        return await prisma.user.findUnique({
            where: {
                email,
            },
        })
    }

    public async listUsers() {
        return await prisma.user.findMany()
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
                updatedAt: new Date
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
