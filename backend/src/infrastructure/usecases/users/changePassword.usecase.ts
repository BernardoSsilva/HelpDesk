import bcrypt from "bcrypt";
import { UserEntity } from "../../../domain/entities/user.entity.js";
import type { UserRoleEnum } from "../../../domain/enums/userRole.enum.js";
import { NotFoundError, ValidationError } from "../../../domain/errors/domain.error.js";
import { UserRepository } from "../../repositories/users.repository.js";

type Input = {
    userId: string;
    currentPassword: string;
    newPassword: string;
}

export class ChangePasswordUseCase {
    constructor(private readonly userRepository = new UserRepository()) {}

    public async execute({ userId, currentPassword, newPassword }: Input) {
        const user = await this.userRepository.findById(userId)

        if (!user) {
            throw new NotFoundError("Usuário não encontrado")
        }

        // Erro de validação (400) e não 401: um 401 faria o frontend encerrar a sessão.
        if (!(await bcrypt.compare(currentPassword, user.password))) {
            throw new ValidationError("Senha atual incorreta", [
                { field: "currentPassword", message: "Senha atual incorreta" },
            ])
        }

        if (currentPassword === newPassword) {
            throw new ValidationError("A nova senha deve ser diferente da atual", [
                { field: "newPassword", message: "A nova senha deve ser diferente da atual" },
            ])
        }

        const entity = new UserEntity({
            id: user.id,
            userEmail: user.email,
            userName: user.name,
            password: await bcrypt.hash(newPassword, 10),
            userRole: user.role as UserRoleEnum,
        })

        await this.userRepository.updateUser(entity)
    }
}
