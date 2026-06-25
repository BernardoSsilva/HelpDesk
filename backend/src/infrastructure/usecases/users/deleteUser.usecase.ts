import { UserRepository } from "../../repositories/users.repository.js";

export class DeleteUserUseCase {
    constructor(private readonly userRepository = new UserRepository()) {}

    public async execute(id: string) {
        const user = await this.userRepository.findById(id)

        if (!user) {
            throw new Error("User not found")
        }

        return await this.userRepository.deleteUser(id)
    }
}
