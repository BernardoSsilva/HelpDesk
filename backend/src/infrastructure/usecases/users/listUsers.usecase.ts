import { UserRepository } from "../../repositories/users.repository.js";

export class ListUsersUseCase {
    constructor(private readonly userRepository = new UserRepository()) {}

    public async execute() {
        return await this.userRepository.listUsers()
    }
}
