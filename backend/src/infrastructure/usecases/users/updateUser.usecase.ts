import { UserEntity } from "../../../domain/entities/user.entity.js";
import type { UserRoleEnum } from "../../../domain/enums/userRole.enum.js";
import { UserRepository } from "../../repositories/users.repository.js";
import bcrypt from "bcrypt";

type Input = {
    id: string;
    userEmail?: string;
    userName?: string;
    password?: string;
    userRole?: UserRoleEnum;
}

export class UpdateUserUseCase {
    constructor(private readonly userRepository = new UserRepository()) {}

    public async execute(input: Input) {
        const user = await this.userRepository.findById(input.id)

        if (!user) {
            throw new Error("User not found")
        }

        if (input.userEmail && input.userEmail !== user.email) {
            const userWithEmail = await this.userRepository.findByEmail(input.userEmail)

            if (userWithEmail) {
                throw new Error("User email already exists")
            }
        }

        const entity = new UserEntity({
            id: user.id,
            userEmail: input.userEmail ?? user.email,
            userName: input.userName ?? user.name,
            password: input.password ? await bcrypt.hash(input.password, 10) : user.password,
            userRole: input.userRole ?? user.role as UserRoleEnum,
        })

        return await this.userRepository.updateUser(entity)
    }
}
