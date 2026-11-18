import bcrypt from "bcrypt";
import { UserEntity } from "../../../domain/entities/user.entity.js";
import { UserRoleEnum } from "../../../domain/enums/userRole.enum.js";
import { ConflictError, NotFoundError } from "../../../domain/errors/domain.error.js";
import { UserRepository } from "../../repositories/users.repository.js";

type Input = {
    id: string;
    userEmail?: string | undefined;
    userName?: string | undefined;
    password?: string | undefined;
    userRole?: UserRoleEnum | undefined;
}

export class UpdateUserUseCase {
    constructor(private readonly userRepository = new UserRepository()) {}

    public async execute(input: Input) {
        const user = await this.userRepository.findById(input.id)

        if (!user) {
            throw new NotFoundError("Usuário não encontrado")
        }

        if (input.userEmail) {
            const userWithEmail = await this.userRepository.findByEmail(input.userEmail)

            if (userWithEmail && userWithEmail.id !== user.id) {
                throw new ConflictError("Já existe um usuário com este e-mail")
            }
        }

        const isDemotingAdmin =
            user.role === UserRoleEnum.ADMIN && input.userRole !== undefined && input.userRole !== UserRoleEnum.ADMIN

        if (isDemotingAdmin && (await this.userRepository.countByRole(UserRoleEnum.ADMIN)) <= 1) {
            throw new ConflictError("Não é possível rebaixar o último administrador")
        }

        const entity = new UserEntity({
            id: user.id,
            userEmail: input.userEmail ?? user.email,
            userName: input.userName ?? user.name,
            password: input.password ? await bcrypt.hash(input.password, 10) : user.password,
            userRole: input.userRole ?? user.role as UserRoleEnum,
        })

        return await this.userRepository.updateUser(entity)
    }
}
