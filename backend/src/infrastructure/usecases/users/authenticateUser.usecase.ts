import { UserRepository } from "../../repositories/users.repository.js";
import bcrypt from "bcrypt";

type Input = {
    userEmail: string;
    password: string;
}

export class AuthenticateUserUseCase {
    constructor(private readonly userRepository = new UserRepository()) { }

    public async execute(input: Input) {
        console.log('entrou')
        const user = await this.userRepository.findByEmail(input.userEmail);

        console.log(user)
        if (!user) {
            throw new Error("Invalid credentials");
        }

        const isPasswordValid = await bcrypt.compare(
            input.password,
            user.password
        );

        if (!isPasswordValid) {
            throw new Error("Invalid credentials");
        }

        return user
    }
}
