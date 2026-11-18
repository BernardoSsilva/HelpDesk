import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import bcrypt from "bcrypt";
import { assertDisposableDatabase, listen, prepareEnvironment, skipReason, testDatabaseUrl, type TestClient } from "./helpers.js";

type Prisma = typeof import("../../src/infrastructure/prisma.client.js")["prisma"];

const password = "senha-de-teste-123";

// Falha logo e com uma única mensagem clara (em vez de dezenas de testes "cancelados") se o banco não for descartável.
if (testDatabaseUrl) {
    assertDisposableDatabase(testDatabaseUrl);
}

describe("API (integração com PostgreSQL)", { skip: skipReason }, () => {
    let prisma: Prisma;
    let client: TestClient;
    let tokens: { admin: string; ana: string; bruno: string; carla: string };
    let ids: { admin: string; ana: string; bruno: string; carla: string };

    async function createUser(name: string, role: "ADMIN" | "USER") {
        const user = await prisma.user.create({
            data: {
                name,
                email: `${name.toLowerCase()}@teste.com`,
                // custo baixo só para acelerar o teste; o app usa 10
                password: await bcrypt.hash(password, 4),
                role,
            },
        });

        return user.id;
    }

    async function login(email: string, pass = password) {
        return await client.request<{ token: string }>("POST", "/users/auth", {
            body: { userEmail: email, password: pass },
        });
    }

    async function tokenFor(name: string) {
        return (await login(`${name.toLowerCase()}@teste.com`)).body.token;
    }

    /** Ana abre um ticket e atribui ao Bruno; Carla não tem relação com ele. */
    async function createTicketAsAna(overrides: Record<string, unknown> = {}) {
        const response = await client.request<{ id: string; [key: string]: unknown }>("POST", "/tickets", {
            token: tokens.ana,
            body: { title: "Impressora offline", description: "Não imprime", priority: "ALTA", department: "TI", responsibleId: ids.bruno, ...overrides },
        });

        assert.equal(response.status, 201, JSON.stringify(response.body));

        return response.body;
    }

    before(async () => {
        prepareEnvironment(testDatabaseUrl!);

        ({ prisma } = await import("../../src/infrastructure/prisma.client.js"));
        const { createApp } = await import("../../src/app.js");

        await prisma.ticket.deleteMany();
        await prisma.user.deleteMany();

        ids = {
            admin: await createUser("Admin", "ADMIN"),
            ana: await createUser("Ana", "USER"),
            bruno: await createUser("Bruno", "USER"),
            carla: await createUser("Carla", "USER"),
        };

        client = await listen(createApp());
        tokens = {
            admin: await tokenFor("Admin"),
            ana: await tokenFor("Ana"),
            bruno: await tokenFor("Bruno"),
            carla: await tokenFor("Carla"),
        };
    });

    after(async () => {
        await client?.close();
        await prisma?.$disconnect();
    });

    describe("infraestrutura", () => {
        it("GET /health confirma API e banco", async () => {
            const response = await client.request("GET", "/health");

            assert.equal(response.status, 200);
            assert.deepEqual(response.body, { status: "ok" });
        });

        it("rota inexistente devolve 404 em JSON", async () => {
            const response = await client.request("GET", "/nada");

            assert.equal(response.status, 404);
            assert.equal((response.body as { code: string }).code, "NOT_FOUND");
        });

        it("JSON malformado devolve 400 em JSON, sem stack trace", async () => {
            const response = await client.request("POST", "/users/auth", { rawBody: "{bad" });

            assert.equal(response.status, 400);
            assert.equal((response.body as { message: string }).message, "O corpo da requisição não é um JSON válido");
        });

        it("envia cabeçalhos de segurança e não revela o framework", async () => {
            const response = await fetch(`${client.baseUrl}/health`);

            assert.equal(response.headers.get("x-content-type-options"), "nosniff");
            assert.ok(response.headers.get("content-security-policy"));
            assert.equal(response.headers.has("x-powered-by"), false);
        });

        it("a documentação da API tem um CSP próprio que permite o Swagger UI", async () => {
            const response = await fetch(`${client.baseUrl}/api/docs`);

            assert.equal(response.status, 200);
            assert.match(response.headers.get("content-security-policy") ?? "", /https:\/\/unpkg\.com/);
        });
    });

    describe("autenticação", () => {
        it("login devolve token e usuário sem a senha", async () => {
            const response = await client.request<{ token: string; user: Record<string, unknown> }>("POST", "/users/auth", {
                body: { userEmail: "ana@teste.com", password },
            });

            assert.equal(response.status, 200);
            assert.ok(response.body.token);
            assert.equal(response.body.user["email"], "ana@teste.com");
            assert.equal("password" in response.body.user, false);
        });

        it("e-mail não diferencia maiúsculas de minúsculas", async () => {
            assert.equal((await login("  ANA@Teste.COM ")).status, 200);
        });

        it("credenciais erradas e e-mail inexistente dão a mesma resposta (sem enumeração)", async () => {
            const wrongPassword = await login("ana@teste.com", "errada");
            const unknownEmail = await login("ninguem@teste.com");

            assert.equal(wrongPassword.status, 401);
            assert.deepEqual(wrongPassword.body, unknownEmail.body);
        });

        it("rejeita login sem campos", async () => {
            const response = await client.request("POST", "/users/auth", { body: {} });

            assert.equal(response.status, 400);
        });

        it("exige token, e rejeita token inválido", async () => {
            assert.equal((await client.request("GET", "/tickets")).status, 401);
            assert.equal((await client.request("GET", "/tickets", { token: "lixo.lixo.lixo" })).status, 401);
        });

        it("limita tentativas de login por IP (429) sem contar os logins corretos", async () => {
            const { createApp } = await import("../../src/app.js");
            const limited = await listen(createApp({ loginRateLimit: { limit: 3 } }));

            try {
                const attempt = (pass: string) =>
                    limited.request("POST", "/users/auth", { body: { userEmail: "ana@teste.com", password: pass } });

                // logins corretos não consomem o limite
                for (let i = 0; i < 5; i++) {
                    assert.equal((await attempt(password)).status, 200);
                }

                for (let i = 0; i < 3; i++) {
                    assert.equal((await attempt("errada")).status, 401);
                }

                const blocked = await attempt("errada");

                assert.equal(blocked.status, 429);
                assert.equal((blocked.body as { code: string }).code, "RATE_LIMITED");
            } finally {
                await limited.close();
            }
        });

        it("token de usuário excluído perde o acesso imediatamente", async () => {
            const id = await createUser("Temporario", "USER");
            const token = await tokenFor("Temporario");

            assert.equal((await client.request("GET", "/tickets", { token })).status, 200);

            await prisma.user.delete({ where: { id } });

            const response = await client.request("GET", "/tickets", { token });

            assert.equal(response.status, 401);
        });

        it("mudança de perfil vale na hora, sem esperar o token expirar", async () => {
            const id = await createUser("Promovido", "ADMIN");
            const token = await tokenFor("Promovido");

            assert.equal((await client.request("GET", "/users", { token })).status, 200);

            await prisma.user.update({ where: { id }, data: { role: "USER" } });

            assert.equal((await client.request("GET", "/users", { token })).status, 403);

            await prisma.user.delete({ where: { id } });
        });
    });

    describe("usuários", () => {
        it("usuário comum recebe 403 (e não 401) nas rotas de administração", async () => {
            for (const [method, path] of [["GET", "/users"], ["GET", `/users/${ids.ana}`], ["DELETE", `/users/${ids.bruno}`]] as const) {
                const response = await client.request(method, path, { token: tokens.ana });

                assert.equal(response.status, 403, `${method} ${path}`);
            }

            const created = await client.request("POST", "/users", {
                token: tokens.ana,
                body: { userEmail: "x@teste.com", userName: "X", password, userRole: "ADMIN" },
            });

            assert.equal(created.status, 403);
        });

        it("diretório expõe só id e nome para qualquer usuário autenticado", async () => {
            const response = await client.request<Record<string, unknown>[]>("GET", "/users/directory", { token: tokens.ana });

            assert.equal(response.status, 200);
            assert.ok(response.body.length >= 4);
            for (const entry of response.body) {
                assert.deepEqual(Object.keys(entry).sort(), ["id", "name"]);
            }
        });

        it("GET /users/me devolve o próprio usuário sem a senha", async () => {
            const response = await client.request<Record<string, unknown>>("GET", "/users/me", { token: tokens.ana });

            assert.equal(response.status, 200);
            assert.equal(response.body["id"], ids.ana);
            assert.equal("password" in response.body, false);
        });

        it("nenhuma listagem de usuários vaza o hash da senha", async () => {
            const response = await client.request<Record<string, unknown>[]>("GET", "/users", { token: tokens.admin });

            assert.equal(response.status, 200);
            assert.ok(response.body.every((user) => !("password" in user)));
        });

        it("administrador cria usuário; e-mail duplicado (qualquer caixa) dá 409", async () => {
            const created = await client.request("POST", "/users", {
                token: tokens.admin,
                body: { userEmail: "Nova.Pessoa@Teste.com", userName: "Nova Pessoa", password },
            });

            assert.equal(created.status, 201);
            assert.equal((created.body as { email: string; role: string }).email, "nova.pessoa@teste.com");
            assert.equal((created.body as { role: string }).role, "USER");

            const duplicate = await client.request("POST", "/users", {
                token: tokens.admin,
                body: { userEmail: "NOVA.PESSOA@teste.com", userName: "Outra", password },
            });

            assert.equal(duplicate.status, 409);

            await prisma.user.deleteMany({ where: { email: "nova.pessoa@teste.com" } });
        });

        it("valida senha curta ao criar usuário", async () => {
            const response = await client.request<{ message: string }>("POST", "/users", {
                token: tokens.admin,
                body: { userEmail: "curta@teste.com", userName: "Curta", password: "123" },
            });

            assert.equal(response.status, 400);
            assert.equal(response.body.message, "A senha deve ter pelo menos 8 caracteres");
        });

        it("não permite excluir a si mesmo nem rebaixar/excluir o último administrador", async () => {
            const self = await client.request("DELETE", `/users/${ids.admin}`, { token: tokens.admin });
            const demote = await client.request("PUT", `/users/${ids.admin}`, { token: tokens.admin, body: { userRole: "USER" } });

            assert.equal(self.status, 409);
            assert.equal(demote.status, 409);
            assert.match((demote.body as { message: string }).message, /último administrador/);
        });

        it("não exclui usuário com tickets: 409 claro em vez de erro de banco", async () => {
            const ticket = await createTicketAsAna();
            const response = await client.request<{ message: string }>("DELETE", `/users/${ids.ana}`, { token: tokens.admin });

            assert.equal(response.status, 409);
            assert.match(response.body.message, /possui tickets/);

            await client.request("DELETE", `/tickets/${ticket.id}`, { token: tokens.admin });
        });

        it("troca de senha: senha atual errada dá 400 (não 401) e a nova senha passa a valer", async () => {
            const id = await createUser("Trocador", "USER");
            const token = await tokenFor("Trocador");

            const wrong = await client.request("PUT", "/users/me/password", {
                token,
                body: { currentPassword: "incorreta", newPassword: "nova-senha-456" },
            });

            assert.equal(wrong.status, 400);

            const same = await client.request("PUT", "/users/me/password", {
                token,
                body: { currentPassword: password, newPassword: password },
            });

            assert.equal(same.status, 400);

            const ok = await client.request("PUT", "/users/me/password", {
                token,
                body: { currentPassword: password, newPassword: "nova-senha-456" },
            });

            assert.equal(ok.status, 204);
            assert.equal((await login("trocador@teste.com")).status, 401);
            assert.equal((await login("trocador@teste.com", "nova-senha-456")).status, 200);

            await prisma.user.delete({ where: { id } });
        });
    });

    describe("tickets", () => {
        it("cria ticket para si mesmo, com departamento e histórico de criação", async () => {
            const ticket = await createTicketAsAna();

            assert.equal(ticket["requesterId"], ids.ana);
            assert.equal(ticket["status"], "ABERTO");
            assert.equal(ticket["department"], "TI");

            const history = await client.request<{ action: string }[]>("GET", `/tickets/${ticket.id}/history`, { token: tokens.carla });

            assert.equal(history.status, 200);
            assert.deepEqual(history.body.map((entry) => entry.action), ["TICKET_CRIADO"]);
        });

        it("usuário comum não abre ticket em nome de outra pessoa; administrador pode", async () => {
            const base = { title: "Em nome de", description: "d", priority: "BAIXA", requesterId: ids.carla };
            const denied = await client.request("POST", "/tickets", { token: tokens.ana, body: base });
            const allowed = await client.request<{ requesterId: string }>("POST", "/tickets", { token: tokens.admin, body: base });

            assert.equal(denied.status, 403);
            assert.equal(allowed.status, 201);
            assert.equal(allowed.body.requesterId, ids.carla);
        });

        it("rejeita responsável inexistente com 400 claro", async () => {
            const response = await client.request<{ message: string }>("POST", "/tickets", {
                token: tokens.ana,
                body: { title: "Teste", description: "d", priority: "BAIXA", responsibleId: "11111111-1111-4111-8111-111111111111" },
            });

            assert.equal(response.status, 400);
            assert.equal(response.body.message, "Responsável não encontrado");
        });

        it("valida os campos e devolve mensagens por campo", async () => {
            const response = await client.request<{ errors: { field: string }[] }>("POST", "/tickets", {
                token: tokens.ana,
                body: { title: "", description: "", priority: "XYZ" },
            });

            assert.equal(response.status, 400);
            assert.deepEqual(response.body.errors.map((error) => error.field), ["title", "description", "priority"]);
        });

        it("UUID inválido na URL dá 400 e ticket inexistente dá 404", async () => {
            assert.equal((await client.request("GET", "/tickets/nao-e-uuid", { token: tokens.ana })).status, 400);
            assert.equal((await client.request("GET", "/tickets/11111111-1111-4111-8111-111111111111", { token: tokens.ana })).status, 404);
            assert.equal((await client.request("GET", "/tickets/11111111-1111-4111-8111-111111111111/history", { token: tokens.ana })).status, 404);
        });

        it("lista do mais recentemente atualizado para o mais antigo", async () => {
            const first = await createTicketAsAna({ title: "Primeiro" });
            const second = await createTicketAsAna({ title: "Segundo" });

            // atualizar o primeiro o traz para o topo
            await client.request("PUT", `/tickets/${first.id}`, { token: tokens.ana, body: { priority: "CRITICA" } });

            const list = await client.request<{ id: string }[]>("GET", "/tickets", { token: tokens.carla });
            const position = (id: string) => list.body.findIndex((ticket) => ticket.id === id);

            assert.ok(position(first.id) < position(second.id));
        });

        describe("quem pode editar", () => {
            it("solicitante, responsável e administrador editam; terceiros recebem 403", async () => {
                const ticket = await createTicketAsAna();
                const edit = (token: string, body: object) => client.request("PUT", `/tickets/${ticket.id}`, { token, body });

                assert.equal((await edit(tokens.ana, { priority: "MEDIA" })).status, 200);
                assert.equal((await edit(tokens.bruno, { status: "EM_ANDAMENTO" })).status, 200);
                assert.equal((await edit(tokens.admin, { status: "AGUARDANDO" })).status, 200);

                const stranger = await edit(tokens.carla, { status: "FECHADO" });

                assert.equal(stranger.status, 403);

                const current = await client.request<{ status: string }>("GET", `/tickets/${ticket.id}`, { token: tokens.carla });

                assert.equal(current.body.status, "AGUARDANDO", "o ticket não pode ter sido alterado pelo terceiro");
            });

            it("registra no histórico cada mudança, com valores anteriores e novos", async () => {
                const ticket = await createTicketAsAna();

                await client.request("PUT", `/tickets/${ticket.id}`, {
                    token: tokens.ana,
                    body: { status: "EM_ANDAMENTO", priority: "CRITICA", department: "RH", responsibleId: null, comment: "Atualizando" },
                });

                const history = await client.request<{ action: string; previousValue: string | null; newValue: string | null }[]>(
                    "GET",
                    `/tickets/${ticket.id}/history`,
                    { token: tokens.ana },
                );
                const byAction = Object.fromEntries(history.body.map((entry) => [entry.action, entry]));

                assert.equal(byAction["STATUS_ALTERADO"]?.previousValue, "ABERTO");
                assert.equal(byAction["STATUS_ALTERADO"]?.newValue, "EM_ANDAMENTO");
                assert.equal(byAction["PRIORIDADE_ALTERADA"]?.newValue, "CRITICA");
                assert.equal(byAction["DEPARTAMENTO_ALTERADO"]?.previousValue, "TI");
                assert.equal(byAction["DEPARTAMENTO_ALTERADO"]?.newValue, "RH");
                assert.equal(byAction["RESPONSAVEL_ALTERADO"]?.previousValue, ids.bruno);
                assert.equal(byAction["RESPONSAVEL_ALTERADO"]?.newValue, null);
                assert.ok(byAction["COMENTARIO_ADICIONADO"]);
            });

            it("não permite atribuir responsável que não existe", async () => {
                const ticket = await createTicketAsAna();
                const response = await client.request("PUT", `/tickets/${ticket.id}`, {
                    token: tokens.ana,
                    body: { responsibleId: "11111111-1111-4111-8111-111111111111" },
                });

                assert.equal(response.status, 400);
            });

            it("exige ao menos um campo", async () => {
                const ticket = await createTicketAsAna();

                assert.equal((await client.request("PUT", `/tickets/${ticket.id}`, { token: tokens.ana, body: {} })).status, 400);
            });
        });

        describe("quem pode excluir", () => {
            it("responsável e terceiros recebem 403; o ticket continua existindo", async () => {
                const ticket = await createTicketAsAna();

                assert.equal((await client.request("DELETE", `/tickets/${ticket.id}`, { token: tokens.bruno })).status, 403);
                assert.equal((await client.request("DELETE", `/tickets/${ticket.id}`, { token: tokens.carla })).status, 403);
                assert.equal((await client.request("GET", `/tickets/${ticket.id}`, { token: tokens.ana })).status, 200);
            });

            it("solicitante e administrador excluem, e o histórico some junto", async () => {
                const byRequester = await createTicketAsAna();
                const byAdmin = await createTicketAsAna();

                assert.equal((await client.request("DELETE", `/tickets/${byRequester.id}`, { token: tokens.ana })).status, 204);
                assert.equal((await client.request("DELETE", `/tickets/${byAdmin.id}`, { token: tokens.admin })).status, 204);
                assert.equal((await client.request("GET", `/tickets/${byRequester.id}`, { token: tokens.ana })).status, 404);
                assert.equal(await prisma.ticketHistory.count({ where: { ticketId: byRequester.id } }), 0);
            });

            it("excluir ticket inexistente dá 404", async () => {
                const response = await client.request("DELETE", "/tickets/11111111-1111-4111-8111-111111111111", { token: tokens.admin });

                assert.equal(response.status, 404);
            });
        });

        describe("comentários", () => {
            it("qualquer usuário autenticado comenta, e o ticket sobe nos atualizados", async () => {
                const ticket = await createTicketAsAna();
                const before = await client.request<{ updatedAt: string }>("GET", `/tickets/${ticket.id}`, { token: tokens.ana });

                await new Promise((resolve) => setTimeout(resolve, 15));

                const comment = await client.request<{ action: string; changedByUserId: string }>(
                    "POST",
                    `/tickets/${ticket.id}/comments`,
                    { token: tokens.carla, body: { comment: "  Também acontece comigo  " } },
                );

                assert.equal(comment.status, 201);
                assert.equal(comment.body.action, "COMENTARIO_ADICIONADO");
                assert.equal(comment.body.changedByUserId, ids.carla);

                const after = await client.request<{ updatedAt: string }>("GET", `/tickets/${ticket.id}`, { token: tokens.ana });

                assert.ok(new Date(after.body.updatedAt) > new Date(before.body.updatedAt));
            });

            it("rejeita comentário vazio ou só com espaços", async () => {
                const ticket = await createTicketAsAna();

                for (const comment of ["", "   "]) {
                    const response = await client.request("POST", `/tickets/${ticket.id}/comments`, { token: tokens.ana, body: { comment } });

                    assert.equal(response.status, 400);
                }
            });
        });
    });

    describe("dashboard", () => {
        it("responde com o formato esperado e conta tickets do período", async () => {
            await createTicketAsAna();

            const response = await client.request<{ stats: { total: number }; series: unknown[]; ticketsByStatus: unknown[] }>(
                "GET",
                "/dashboard",
                { token: tokens.carla },
            );

            assert.equal(response.status, 200);
            assert.ok(response.body.stats.total >= 1);
            assert.equal(response.body.series.length, 7);
            assert.equal(response.body.ticketsByStatus.length, 5);
        });

        it("aceita filtros vazios como 'sem filtro'", async () => {
            const response = await client.request("GET", "/dashboard?status=&priority=&search=", { token: tokens.carla });

            assert.equal(response.status, 200);
        });

        it("valida intervalo e filtros", async () => {
            const invalid = [
                "?startDate=2026-11-18&endDate=2026-11-01",
                "?startDate=1900-01-01",
                "?startDate=2026-02-31",
                "?status=INEXISTENTE",
                "?requesterId=abc",
            ];

            for (const query of invalid) {
                const response = await client.request("GET", `/dashboard${query}`, { token: tokens.carla });

                assert.equal(response.status, 400, query);
            }
        });
    });
});
