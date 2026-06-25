import { UserRepository } from "../../repositories/users.repository.js";

export class FindUserByEmailUseCase {
    constructor(private readonly userRepository = new UserRepository()) {}

    public async execute(email: string) {
        return await this.userRepository.findByEmail(email)
    }
}
