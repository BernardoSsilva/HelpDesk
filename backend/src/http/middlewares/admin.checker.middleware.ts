import type { NextFunction, Request, Response } from "express";
import { verifyJwt } from "../jwt/jwt.js";


export function adminCheckerMiddleware(req: Request, res: Response, next: NextFunction) {
    const authorization = req.headers.authorization

    const [type, token] = authorization!.split(" ")


    const payload = verifyJwt(token as string)

    if (payload.role != "ADMIN") {
        res.status(401).json({ message: "Unauthorized" })
        return
    }

}