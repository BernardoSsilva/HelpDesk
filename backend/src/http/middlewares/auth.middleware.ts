import type { NextFunction, Request, Response } from "express";
import { verifyJwt } from "../jwt/jwt.js";

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

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
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

    try {
        const payload = verifyJwt(token)

        req.authUser = {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
        }

        next()
    } catch {
        res.status(401).json({ message: "Invalid token" })
    }
}
