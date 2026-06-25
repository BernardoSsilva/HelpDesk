import { UserEntity } from "../../../domain/entities/user.entity.js";
import type { UserRoleEnum } from "../../../domain/enums/userRole.enum.js";
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
            throw new Error("User already exists")
        }

        const user = new UserEntity(input)

        return await this.userRepository.createUser(user)
    }
}
