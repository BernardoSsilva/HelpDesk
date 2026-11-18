import bcrypt from "bcrypt";
import { UserEntity } from "../../../domain/entities/user.entity.js";
import type { UserRoleEnum } from "../../../domain/enums/userRole.enum.js";
import { ConflictError } from "../../../domain/errors/domain.error.js";
import { UserRepository } from "../../repositories/users.repository.js";

type Input = {
    userEmail: string;
    userName: string;
    password: string;
    userRole: UserRoleEnum;
}

export class CreateUserUseCase {
    constructor(private readonly userRepository = new UserRepository()) {}

    public async execute(input: Input) {
        const existingUser = await this.userRepository.findByEmail(input.userEmail)

        if (existingUser) {
            throw new ConflictError("Já existe um usuário com este e-mail")
        }

        const hashedPassword = await bcrypt.hash(input.password, 10)
        const user = new UserEntity({
            ...input,
            password: hashedPassword,
        })

        return await this.userRepository.createUser(user)
    }
}
