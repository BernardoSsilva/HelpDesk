import type { NextFunction, Request, Response } from "express";
import { UserRoleEnum } from "../../domain/enums/userRole.enum.js";
import { ForbiddenError } from "../../domain/errors/domain.error.js";
import { requireAuthUser } from "./auth.middleware.js";

/** Deve ser usado depois do `authMiddleware`. Responde 403 (e não 401) para não-administradores. */
export function adminCheckerMiddleware(req: Request, _res: Response, next: NextFunction) {
    if (requireAuthUser(req).role !== UserRoleEnum.ADMIN) {
        throw new ForbiddenError("Acesso restrito a administradores")
    }

    next()
}
