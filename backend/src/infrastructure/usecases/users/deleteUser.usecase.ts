import { UserRoleEnum } from "../../../domain/enums/userRole.enum.js";
import { ConflictError, NotFoundError } from "../../../domain/errors/domain.error.js";
import { isPrismaError } from "../../prisma.errors.js";
import { UserRepository } from "../../repositories/users.repository.js";

type Input = {
    id: string;
    /** Quem está executando a exclusão (não pode excluir a si mesmo). */
    actorId: string;
}

export class DeleteUserUseCase {
    constructor(private readonly userRepository = new UserRepository()) {}

    public async execute({ id, actorId }: Input) {
        if (id === actorId) {
            throw new ConflictError("Você não pode excluir a própria conta")
        }

        const user = await this.userRepository.findById(id)

        if (!user) {
            throw new NotFoundError("Usuário não encontrado")
        }

        if (user.role === UserRoleEnum.ADMIN && (await this.userRepository.countByRole(UserRoleEnum.ADMIN)) <= 1) {
            throw new ConflictError("Não é possível excluir o último administrador")
        }

        try {
            return await this.userRepository.deleteUser(id)
        } catch (error) {
            // Solicitante de tickets e autor de histórico não podem ser removidos sem perder o rastro.
            if (isPrismaError(error, "P2003")) {
                throw new ConflictError("O usuário possui tickets ou atividades registradas e não pode ser excluído")
            }

            throw error
        }
    }
}
