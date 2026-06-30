import type { NextFunction, Request, Response } from "express";
import { verifyJwt } from "../jwt/jwt.js";


export function adminCheckerMiddleware(req: Request, res: Response, next: NextFunction) {
    const authorization = req.headers.authorization

    if (!authorization) {
        res.status(401).json({ message: "Token not provided" })
        return
    }

    const [type, token] = authorization.split(" ")

    if (type !== "Bearer" || !token) {
        res.status(401).json({ message: "Invalid authorization header" })
        return
    }

    const payload = verifyJwt(token as string)

    if (payload.role != "ADMIN") {
        res.status(401).json({ message: "Unauthorized" })
        return
    }

    next()
}
