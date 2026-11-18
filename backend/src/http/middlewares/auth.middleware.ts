import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../../domain/errors/domain.error.js";
import { UserRepository } from "../../infrastructure/repositories/users.repository.js";
import { verifyJwt } from "../jwt/jwt.js";
import { idSchema } from "../validation/schemas.js";

declare global {
    namespace Express {
        interface Request {
            authUser?: {
                id: string;
                email: string;
                role: string;
            }
        }
    }
}

const userRepository = new UserRepository()

/**
 * Autentica pelo JWT e confirma o usuário no banco a cada requisição, assim
 * contas excluídas perdem o acesso na hora e mudanças de perfil valem
 * imediatamente (em vez de só quando o token expira).
 */
export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
    const authorization = req.headers.authorization

    if (!authorization) {
        throw new UnauthorizedError("Token não informado")
    }

    const [type, token] = authorization.split(" ")

    if (type !== "Bearer" || !token) {
        throw new UnauthorizedError("Cabeçalho de autorização inválido")
    }

    let userId: string

    try {
        const payload = verifyJwt(token)
        userId = idSchema.parse(payload.sub)
    } catch {
        throw new UnauthorizedError("Token inválido ou expirado")
    }

    const user = await userRepository.findById(userId)

    if (!user) {
        throw new UnauthorizedError("Usuário não encontrado ou removido")
    }

    req.authUser = {
        id: user.id,
        email: user.email,
        role: user.role,
    }

    next()
}

/** Usuário autenticado da requisição; só deve ser chamado depois de `authMiddleware`. */
export function requireAuthUser(req: Request) {
    if (!req.authUser) {
        throw new UnauthorizedError()
    }

    return req.authUser
}
