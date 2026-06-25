import { UserRepository } from "../../repositories/users.repository.js";

type Input = {
    userEmail: string;
    password: string;
}

export class AuthenticateUserUseCase {
    constructor(private readonly userRepository = new UserRepository()) {}

    public async execute(input: Input) {
        const user = await this.userRepository.findByEmail(input.userEmail)

        if (!user || user.password !== input.password) {
            throw new Error("Invalid credentials")
        }

        return user
    }
}
