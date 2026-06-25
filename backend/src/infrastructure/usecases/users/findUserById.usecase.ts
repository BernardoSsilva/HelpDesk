import { UserRepository } from "../../repositories/users.repository.js";

export class FindUserByIdUseCase {
    constructor(private readonly userRepository = new UserRepository()) {}

    public async execute(id: string) {
        return await this.userRepository.findById(id)
    }
}
