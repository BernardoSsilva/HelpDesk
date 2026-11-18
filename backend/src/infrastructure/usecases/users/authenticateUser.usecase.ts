import bcrypt from "bcrypt";
import { UnauthorizedError } from "../../../domain/errors/domain.error.js";
import { UserRepository } from "../../repositories/users.repository.js";

type Input = {
    userEmail: string;
    password: string;
}

// Hash usado quando o e-mail não existe, para que a resposta leve o mesmo
// tempo e não revele quais e-mails estão cadastrados.
const dummyHash = bcrypt.hashSync("senha-inexistente-tempo-constante", 10);

export class AuthenticateUserUseCase {
    constructor(private readonly userRepository = new UserRepository()) { }

    public async execute(input: Input) {
        const user = await this.userRepository.findByEmail(input.userEmail);
        const isPasswordValid = await bcrypt.compare(input.password, user?.password ?? dummyHash);

        if (!user || !isPasswordValid) {
            throw new UnauthorizedError("Credenciais inválidas");
        }

        return user
    }
}
