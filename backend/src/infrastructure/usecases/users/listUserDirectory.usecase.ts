import { UserRepository } from "../../repositories/users.repository.js";

/** Id e nome de todos os usuários, para exibir/atribuir responsáveis sem expor e-mails. */
export class ListUserDirectoryUseCase {
    constructor(private readonly userRepository = new UserRepository()) {}

    public async execute() {
        return await this.userRepository.listDirectory()
    }
}
