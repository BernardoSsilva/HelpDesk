import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ValidationError } from "../../src/domain/errors/domain.error.js";
import {
    changePasswordSchema,
    createTicketSchema,
    createUserSchema,
    dashboardQuerySchema,
    loginSchema,
    parse,
    parseId,
    updateTicketSchema,
    updateUserSchema,
} from "../../src/http/validation/schemas.js";

const uuid = "3a543473-07f6-42ef-939f-dbf749c48de3";

function validationMessages(run: () => unknown) {
    try {
        run();
    } catch (error) {
        assert.ok(error instanceof ValidationError, "esperava ValidationError");
        return error.fields?.map((field) => `${field.field}: ${field.message}`) ?? [];
    }

    assert.fail("esperava que a validação falhasse");
}

describe("schemas", () => {
    describe("createTicketSchema", () => {
        it("aceita um ticket válido e normaliza espaços", () => {
            const ticket = parse(createTicketSchema, {
                title: "  Impressora offline  ",
                description: " Não imprime ",
                priority: "ALTA",
                department: "TI",
            });

            assert.equal(ticket.title, "Impressora offline");
            assert.equal(ticket.description, "Não imprime");
        });

        it("campo vazio gera uma única mensagem clara (sem duplicar)", () => {
            const messages = validationMessages(() =>
                parse(createTicketSchema, { title: "", description: "", priority: "ALTA" }),
            );

            assert.deepEqual(messages, ["title: Informe o título", "description: Informe a descrição"]);
        });

        it("rejeita prioridade, departamento e UUIDs inválidos", () => {
            const messages = validationMessages(() =>
                parse(createTicketSchema, {
                    title: "Título ok",
                    description: "desc",
                    priority: "XYZ",
                    department: "MARKETING",
                    responsibleId: "123",
                }),
            );

            assert.deepEqual(messages, [
                "priority: Prioridade inválida",
                "department: Departamento inválido",
                "responsibleId: Responsável inválido",
            ]);
        });

        it("ignora campos desconhecidos (sem mass assignment)", () => {
            const ticket = parse(createTicketSchema, {
                title: "Título ok",
                description: "desc",
                priority: "BAIXA",
                status: "FECHADO",
                id: uuid,
            });

            assert.equal("status" in ticket, false);
            assert.equal("id" in ticket, false);
        });

        it("limita o tamanho do título", () => {
            const messages = validationMessages(() =>
                parse(createTicketSchema, { title: "x".repeat(151), description: "d", priority: "BAIXA" }),
            );

            assert.deepEqual(messages, ["title: O título deve ter entre 3 e 150 caracteres"]);
        });
    });

    describe("updateTicketSchema", () => {
        it("exige ao menos um campo", () => {
            assert.deepEqual(validationMessages(() => parse(updateTicketSchema, {})), [": Informe ao menos um campo para atualizar"]);
        });

        it("aceita responsável nulo (remover atribuição)", () => {
            assert.equal(parse(updateTicketSchema, { responsibleId: null }).responsibleId, null);
        });
    });

    describe("usuários", () => {
        it("normaliza e-mail para minúsculas e define perfil padrão", () => {
            const user = parse(createUserSchema, {
                userEmail: "  Ana@Empresa.COM ",
                userName: "Ana",
                password: "senha1234",
            });

            assert.equal(user.userEmail, "ana@empresa.com");
            assert.equal(user.userRole, "USER");
        });

        it("exige senha forte o bastante e e-mail válido", () => {
            const messages = validationMessages(() =>
                parse(createUserSchema, { userEmail: "nao-e-email", userName: "Ana", password: "123" }),
            );

            assert.deepEqual(messages, [
                "userEmail: Informe um e-mail válido",
                "password: A senha deve ter pelo menos 8 caracteres",
            ]);
        });

        it("recusa senhas acima de 72 bytes (limite do bcrypt)", () => {
            const messages = validationMessages(() =>
                parse(changePasswordSchema, { currentPassword: "x", newPassword: "á".repeat(40) }),
            );

            assert.deepEqual(messages, ["newPassword: A senha deve ter no máximo 72 bytes"]);
        });

        it("update exige ao menos um campo", () => {
            assert.equal(validationMessages(() => parse(updateUserSchema, {})).length, 1);
            assert.equal(parse(updateUserSchema, { userName: "Novo Nome" }).userName, "Novo Nome");
        });

        it("login aceita qualquer e-mail não vazio, normalizado", () => {
            assert.equal(parse(loginSchema, { userEmail: " ADMIN@x.com ", password: "p" }).userEmail, "admin@x.com");
        });
    });

    describe("dashboardQuerySchema", () => {
        it("converte datas e aceita 'unassigned' como responsável", () => {
            const query = parse(dashboardQuerySchema, {
                startDate: "2026-11-01",
                endDate: "2026-11-18",
                responsibleId: "unassigned",
            });

            assert.equal(query.startDate?.toISOString(), "2026-11-01T00:00:00.000Z");
            assert.equal(query.responsibleId, "unassigned");
        });

        it("rejeita datas impossíveis e formatos errados", () => {
            // 2026-02-31 e 2026-02-29 (2026 não é bissexto) seriam "corrigidos" em silêncio pelo Date; 2026-13-01 lançaria RangeError.
            for (const startDate of ["2026-02-31", "2026-02-29", "2026-13-01", "18/11/2026"]) {
                assert.equal(validationMessages(() => parse(dashboardQuerySchema, { startDate })).length, 1, startDate);
            }

            assert.equal(parse(dashboardQuerySchema, { startDate: "2028-02-29" }).startDate?.toISOString(), "2028-02-29T00:00:00.000Z");
        });
    });

    describe("parseId", () => {
        it("aceita UUID e nomeia o campo no erro", () => {
            assert.equal(parseId(uuid), uuid);
            assert.deepEqual(validationMessages(() => parseId("x", "ticketId")), ["ticketId: Identificador inválido"]);
        });
    });
});
