import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { beforeEach, describe, it } from "node:test";
import { signJwt, verifyJwt } from "../../src/http/jwt/jwt.js";

const secret = "segredo-de-teste-com-mais-de-32-caracteres!!";
const claims = { sub: "3a543473-07f6-42ef-939f-dbf749c48de3", email: "a@b.com", role: "USER" };

function forgeToken(header: object, payload: object, signingSecret = secret) {
    const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
    const unsigned = `${encode(header)}.${encode(payload)}`;
    const signature = createHmac("sha256", signingSecret).update(unsigned).digest("base64url");

    return `${unsigned}.${signature}`;
}

describe("jwt", () => {
    beforeEach(() => {
        process.env["JWT_SECRET"] = secret;
    });

    it("assina e valida um token", () => {
        const payload = verifyJwt(signJwt(claims));

        assert.equal(payload.sub, claims.sub);
        assert.equal(payload.role, "USER");
    });

    it("rejeita token adulterado", () => {
        const [header, , signature] = signJwt(claims).split(".");
        const tamperedPayload = Buffer.from(JSON.stringify({ ...claims, role: "ADMIN", exp: 9999999999 })).toString("base64url");

        assert.throws(() => verifyJwt(`${header}.${tamperedPayload}.${signature}`), /Invalid token/);
    });

    it("rejeita token assinado com outro segredo", () => {
        const token = forgeToken({ alg: "HS256", typ: "JWT" }, { ...claims, exp: 9999999999 }, "outro-segredo");

        assert.throws(() => verifyJwt(token), /Invalid token/);
    });

    it("rejeita token expirado", () => {
        assert.throws(() => verifyJwt(signJwt(claims, -10)), /Expired token/);
    });

    it("rejeita algoritmo diferente de HS256, mesmo com assinatura válida", () => {
        const token = forgeToken({ alg: "none", typ: "JWT" }, { ...claims, exp: 9999999999 });

        assert.throws(() => verifyJwt(token), /Invalid token/);
    });

    it("rejeita payload com formato inesperado", () => {
        const token = forgeToken({ alg: "HS256", typ: "JWT" }, { sub: 123, exp: "amanhã" });

        assert.throws(() => verifyJwt(token), /Invalid token/);
    });

    it("rejeita tokens malformados", () => {
        assert.throws(() => verifyJwt("lixo"), /Invalid token/);
        assert.throws(() => verifyJwt("a.b"), /Invalid token/);
        assert.throws(() => verifyJwt("a.b.c.d"), /Invalid token/);
    });
});
