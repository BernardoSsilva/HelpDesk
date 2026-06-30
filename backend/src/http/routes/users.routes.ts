import { Router } from "express";
import { UserRoleEnum } from "../../domain/enums/userRole.enum.js";
import {
    AuthenticateUserUseCase,
    CreateUserUseCase,
    DeleteUserUseCase,
    FindUserByIdUseCase,
    ListUsersUseCase,
    UpdateUserUseCase,
} from "../../infrastructure/usecases/users/index.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { signJwt } from "../jwt/jwt.js";
import { adminCheckerMiddleware } from "../middlewares/admin.checker.middleware.js";

const usersRoutes = Router()

function sanitizeUser<T extends { password?: string }>(user: T) {
    const { password, ...safeUser } = user
    return safeUser
}

usersRoutes.post("/auth", async (req, res) => {
    try {
        const { userEmail, password } = req.body
        const authenticateUserUseCase = new AuthenticateUserUseCase()

        const user = await authenticateUserUseCase.execute({ userEmail, password })
        const token = signJwt({
            sub: user.id,
            email: user.email,
            role: user.role,
        })

        res.status(200).json({
            token,
            user: sanitizeUser(user),
        })
    } catch {
        res.status(401).json({ message: "Invalid credentials" })
    }
})

usersRoutes.post("/", authMiddleware, adminCheckerMiddleware, async (req, res) => {
    try {
        const { userEmail, userName, password, userRole = UserRoleEnum.USER } = req.body

        const createUserUseCase = new CreateUserUseCase()
        const user = await createUserUseCase.execute({
            userEmail,
            userName,
            password,
            userRole,
        })

        res.status(201).json(sanitizeUser(user))
    } catch (error) {
        res.status(400).json({ message: error instanceof Error ? error.message : "Error creating user" })
    }
})

usersRoutes.get("/", authMiddleware, adminCheckerMiddleware, async (_req, res) => {
    try {
        const listUsersUseCase = new ListUsersUseCase()
        const users = await listUsersUseCase.execute()

        res.status(200).json(users.map(sanitizeUser))
    } catch (error) {
        res.status(400).json({ message: error instanceof Error ? error.message : "Error listing users" })
    }
})

usersRoutes.get("/:id", authMiddleware, adminCheckerMiddleware, async (req, res) => {
    try {
        const id = req.params.id

        if (typeof id !== "string") {
            res.status(400).json({ message: "User id is required" })
            return
        }

        const findUserByIdUseCase = new FindUserByIdUseCase()
        const user = await findUserByIdUseCase.execute(id)

        if (!user) {
            res.status(404).json({ message: "User not found" })
            return
        }

        res.status(200).json(sanitizeUser(user))
    } catch (error) {
        res.status(400).json({ message: error instanceof Error ? error.message : "Error finding user" })
    }
})

usersRoutes.put("/:id", authMiddleware, adminCheckerMiddleware, async (req, res) => {
    try {
        const { userEmail, userName, password, userRole } = req.body
        const id = req.params.id

        if (typeof id !== "string") {
            res.status(400).json({ message: "User id is required" })
            return
        }

        const updateUserUseCase = new UpdateUserUseCase()
        const user = await updateUserUseCase.execute({
            id,
            userEmail,
            userName,
            password,
            userRole,
        })

        res.status(200).json(sanitizeUser(user))
    } catch (error) {
        res.status(400).json({ message: error instanceof Error ? error.message : "Error updating user" })
    }
})

usersRoutes.delete("/:id", authMiddleware, adminCheckerMiddleware, async (req, res) => {
    try {
        const id = req.params.id

        if (typeof id !== "string") {
            res.status(400).json({ message: "User id is required" })
            return
        }

        const deleteUserUseCase = new DeleteUserUseCase()
        await deleteUserUseCase.execute(id)

        res.status(204).send()
    } catch (error) {
        res.status(400).json({ message: error instanceof Error ? error.message : "Error deleting user" })
    }
})

export { usersRoutes };
