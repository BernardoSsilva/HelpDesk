import { Router, type RequestHandler } from "express";
import { NotFoundError, UnauthorizedError } from "../../domain/errors/domain.error.js";
import {
    AuthenticateUserUseCase,
    ChangePasswordUseCase,
    CreateUserUseCase,
    DeleteUserUseCase,
    FindUserByIdUseCase,
    ListUserDirectoryUseCase,
    ListUsersUseCase,
    UpdateUserUseCase,
} from "../../infrastructure/usecases/users/index.js";
import { signJwt } from "../jwt/jwt.js";
import { adminCheckerMiddleware } from "../middlewares/admin.checker.middleware.js";
import { authMiddleware, requireAuthUser } from "../middlewares/auth.middleware.js";
import {
    changePasswordSchema,
    createUserSchema,
    loginSchema,
    parse,
    parseId,
    updateUserSchema,
} from "../validation/schemas.js";

function sanitizeUser<T extends { password?: string }>(user: T) {
    const { password, ...safeUser } = user
    return safeUser
}

export function createUsersRoutes(loginRateLimiter: RequestHandler) {
    const usersRoutes = Router()

    usersRoutes.post("/auth", loginRateLimiter, async (req, res) => {
        const { userEmail, password } = parse(loginSchema, req.body)

        const user = await new AuthenticateUserUseCase().execute({ userEmail, password })
        const token = signJwt({
            sub: user.id,
            email: user.email,
            role: user.role,
        })

        res.status(200).json({
            token,
            user: sanitizeUser(user),
        })
    })

    usersRoutes.use(authMiddleware)

    // Rotas para qualquer usuário autenticado (declaradas antes de "/:id").
    usersRoutes.get("/me", async (req, res) => {
        const user = await new FindUserByIdUseCase().execute(requireAuthUser(req).id)

        if (!user) {
            throw new UnauthorizedError("Usuário não encontrado ou removido")
        }

        res.status(200).json(sanitizeUser(user))
    })

    usersRoutes.put("/me/password", async (req, res) => {
        const { currentPassword, newPassword } = parse(changePasswordSchema, req.body)

        await new ChangePasswordUseCase().execute({
            userId: requireAuthUser(req).id,
            currentPassword,
            newPassword,
        })

        res.status(204).send()
    })

    usersRoutes.get("/directory", async (_req, res) => {
        res.status(200).json(await new ListUserDirectoryUseCase().execute())
    })

    // A partir daqui, somente administradores.
    usersRoutes.use(adminCheckerMiddleware)

    usersRoutes.post("/", async (req, res) => {
        const { userEmail, userName, password, userRole } = parse(createUserSchema, req.body)

        const user = await new CreateUserUseCase().execute({
            userEmail,
            userName,
            password,
            userRole,
        })

        res.status(201).json(sanitizeUser(user))
    })

    usersRoutes.get("/", async (_req, res) => {
        const users = await new ListUsersUseCase().execute()

        res.status(200).json(users.map(sanitizeUser))
    })

    usersRoutes.get("/:id", async (req, res) => {
        const user = await new FindUserByIdUseCase().execute(parseId(req.params.id))

        if (!user) {
            throw new NotFoundError("Usuário não encontrado")
        }

        res.status(200).json(sanitizeUser(user))
    })

    usersRoutes.put("/:id", async (req, res) => {
        const id = parseId(req.params.id)
        const { userEmail, userName, password, userRole } = parse(updateUserSchema, req.body)

        const user = await new UpdateUserUseCase().execute({
            id,
            userEmail,
            userName,
            password,
            userRole,
        })

        res.status(200).json(sanitizeUser(user))
    })

    usersRoutes.delete("/:id", async (req, res) => {
        await new DeleteUserUseCase().execute({
            id: parseId(req.params.id),
            actorId: requireAuthUser(req).id,
        })

        res.status(204).send()
    })

    return usersRoutes
}
