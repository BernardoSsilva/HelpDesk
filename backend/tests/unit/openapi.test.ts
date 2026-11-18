import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { openApiDocument } from "../../src/http/docs/openapi.js";

function collectRefs(node: unknown, found = new Set<string>()) {
    if (Array.isArray(node)) {
        node.forEach((item) => collectRefs(item, found));
    } else if (node && typeof node === "object") {
        for (const [key, value] of Object.entries(node)) {
            if (key === "$ref" && typeof value === "string") {
                found.add(value);
            } else {
                collectRefs(value, found);
            }
        }
    }

    return found;
}

function resolve(pointer: string): unknown {
    return pointer
        .replace(/^#\//, "")
        .split("/")
        .reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], openApiDocument);
}

// Lista explícita: se uma rota for removida ou renomeada sem atualizar a documentação, este teste acusa.
const expectedOperations = [
    "GET /health",
    "POST /users/auth",
    "GET /users/me",
    "PUT /users/me/password",
    "GET /users/directory",
    "GET /users",
    "POST /users",
    "GET /users/{id}",
    "PUT /users/{id}",
    "DELETE /users/{id}",
    "GET /tickets",
    "POST /tickets",
    "GET /tickets/requester/{requesterId}",
    "GET /tickets/responsible/{responsibleId}",
    "GET /tickets/{id}",
    "PUT /tickets/{id}",
    "DELETE /tickets/{id}",
    "POST /tickets/{id}/comments",
    "GET /tickets/{id}/history",
    "GET /dashboard",
];

describe("openapi", () => {
    it("todas as referências $ref apontam para algo que existe", () => {
        const unresolved = [...collectRefs(openApiDocument)].filter((pointer) => resolve(pointer) === undefined);

        assert.deepEqual(unresolved, []);
    });

    it("documenta todas as operações esperadas", () => {
        const documented = Object.entries(openApiDocument.paths).flatMap(([path, methods]) =>
            Object.keys(methods).map((method) => `${method.toUpperCase()} ${path}`),
        );

        assert.deepEqual([...documented].sort(), [...expectedOperations].sort());
    });

    it("operationIds são únicos", () => {
        const ids = Object.values(openApiDocument.paths).flatMap((methods) =>
            Object.values(methods).map((operation) => (operation as { operationId: string }).operationId),
        );

        assert.equal(new Set(ids).size, ids.length);
    });

    it("toda operação protegida documenta a resposta 401", () => {
        for (const [path, methods] of Object.entries(openApiDocument.paths)) {
            for (const [method, operation] of Object.entries(methods)) {
                const { security, responses } = operation as { security?: unknown; responses: Record<string, unknown> };

                if (security) {
                    assert.ok(responses["401"], `${method.toUpperCase()} ${path} sem 401`);
                }
            }
        }
    });
});
