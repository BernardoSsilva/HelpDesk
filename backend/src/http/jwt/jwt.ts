import { createHmac, timingSafeEqual } from "node:crypto";

type JwtPayload = {
    sub: string;
    email: string;
    role: string;
    exp: number;
}

const header = {
    alg: "HS256",
    typ: "JWT",
}

function getJwtSecret() {
    const secret = process.env["JWT_SECRET"]

    if (!secret) {
        throw new Error("JWT_SECRET is required")
    }

    return secret
}

function encode(value: object) {
    return Buffer.from(JSON.stringify(value)).toString("base64url")
}

function decode(value: string): unknown {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf-8"))
}

function sign(value: string) {
    return createHmac("sha256", getJwtSecret())
        .update(value)
        .digest("base64url")
}

export function signJwt(payload: Omit<JwtPayload, "exp">, expiresInSeconds = 60 * 60 * 24) {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds
    const encodedHeader = encode(header)
    const encodedPayload = encode({ ...payload, exp: expiresAt })
    const unsignedToken = `${encodedHeader}.${encodedPayload}`

    return `${unsignedToken}.${sign(unsignedToken)}`
}

function isJwtPayload(value: unknown): value is JwtPayload {
    if (typeof value !== "object" || value === null) {
        return false
    }

    const candidate = value as Record<string, unknown>

    return (
        typeof candidate["sub"] === "string" &&
        typeof candidate["email"] === "string" &&
        typeof candidate["role"] === "string" &&
        typeof candidate["exp"] === "number"
    )
}

/** Valida assinatura, algoritmo, formato e expiração. Lança `Error` se algo falhar. */
export function verifyJwt(token: string) {
    const [encodedHeader, encodedPayload, signature, ...rest] = token.split(".")

    if (!encodedHeader || !encodedPayload || !signature || rest.length) {
        throw new Error("Invalid token")
    }

    const unsignedToken = `${encodedHeader}.${encodedPayload}`
    const expectedSignature = sign(unsignedToken)
    const signatureBuffer = Buffer.from(signature)
    const expectedSignatureBuffer = Buffer.from(expectedSignature)

    if (
        signatureBuffer.length !== expectedSignatureBuffer.length ||
        !timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
    ) {
        throw new Error("Invalid token")
    }

    const decodedHeader = decode(encodedHeader) as { alg?: unknown }

    if (decodedHeader.alg !== header.alg) {
        throw new Error("Invalid token")
    }

    const payload = decode(encodedPayload)

    if (!isJwtPayload(payload)) {
        throw new Error("Invalid token")
    }

    if (payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error("Expired token")
    }

    return payload
}
