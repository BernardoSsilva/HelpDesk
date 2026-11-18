// Documentação OpenAPI da API. Mantida à mão: ao criar ou alterar uma rota,
// atualize também este arquivo (o teste `tests/unit/openapi.test.ts` valida as referências).

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema: object) => ({ "application/json": { schema } });
const body = (schemaName: string) => ({ required: true, content: json(ref(schemaName)) });
const ok = (description: string, schema?: object) => ({ description, ...(schema ? { content: json(schema) } : {}) });
const list = (schemaName: string) => ({ type: "array", items: ref(schemaName) });
const param = (name: string) => ({ $ref: `#/components/parameters/${name}` });

const bearer = [{ bearerAuth: [] }];

const standardResponses = {
    "400": "BadRequest",
    "401": "Unauthorized",
    "403": "Forbidden",
    "404": "NotFound",
    "409": "Conflict",
    "429": "TooManyRequests",
} as const;

/** Referencia as respostas de erro padrão pelos códigos HTTP informados. */
const errors = (...codes: (keyof typeof standardResponses)[]) =>
    Object.fromEntries(codes.map((code) => [code, { $ref: `#/components/responses/${standardResponses[code]}` }]));

const uuid = { type: "string", format: "uuid" } as const;
const dateTime = { type: "string", format: "date-time" } as const;

const pathParameter = (name: string, description: string) => ({
    name,
    in: "path",
    required: true,
    description,
    schema: uuid,
});

const query = (name: string, description: string, schema: object = { type: "string" }) => ({
    name,
    in: "query",
    required: false,
    description,
    schema,
});

export const openApiDocument = {
    openapi: "3.0.3",
    info: {
        title: "Help Desk API",
        version: "1.0.0",
        description: [
            "API de gestão de tickets: usuários, tickets, comentários, histórico e dashboard.",
            "",
            "**Permissões**",
            "- Qualquer usuário autenticado lê tickets, comenta e consulta o dashboard.",
            "- Editar um ticket: administrador, solicitante ou responsável.",
            "- Excluir um ticket: administrador ou solicitante.",
            "- Abrir ticket em nome de outra pessoa e gerenciar usuários: somente administradores.",
            "",
            "Erros seguem o formato `{ code, message, errors? }`.",
        ].join("\n"),
    },
    servers: [
        {
            url: "http://localhost:8080",
            description: "Servidor local de desenvolvimento",
        },
    ],
    tags: [
        { name: "Sistema", description: "Verificação de saúde." },
        { name: "Users", description: "Autenticação e gestão de usuários." },
        { name: "Tickets", description: "Criação, atualização, listagem, comentários e histórico de tickets." },
        { name: "Dashboard", description: "Indicadores agregados de tickets." },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
            },
        },
        responses: {
            BadRequest: { description: "Requisição inválida (validação).", content: json(ref("ErrorResponse")) },
            Unauthorized: { description: "Token ausente, inválido, expirado ou usuário removido.", content: json(ref("ErrorResponse")) },
            Forbidden: { description: "O usuário autenticado não tem permissão para esta ação.", content: json(ref("ErrorResponse")) },
            NotFound: { description: "Recurso não encontrado.", content: json(ref("ErrorResponse")) },
            Conflict: { description: "Conflito com o estado atual dos dados.", content: json(ref("ErrorResponse")) },
            TooManyRequests: { description: "Limite de tentativas excedido.", content: json(ref("ErrorResponse")) },
        },
        schemas: {
            ErrorResponse: {
                type: "object",
                required: ["code", "message"],
                properties: {
                    code: {
                        type: "string",
                        enum: ["VALIDATION", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "CONFLICT", "RATE_LIMITED", "PAYLOAD_TOO_LARGE", "INTERNAL"],
                        example: "VALIDATION",
                    },
                    message: { type: "string", example: "Informe o título" },
                    errors: {
                        type: "array",
                        description: "Detalhes por campo, quando a falha é de validação.",
                        items: {
                            type: "object",
                            properties: {
                                field: { type: "string", example: "title" },
                                message: { type: "string", example: "Informe o título" },
                            },
                        },
                    },
                },
            },
            UserRoleEnum: { type: "string", enum: ["ADMIN", "USER"], example: "USER" },
            TicketStatusEnum: { type: "string", enum: ["ABERTO", "EM_ANDAMENTO", "AGUARDANDO", "RESOLVIDO", "FECHADO"], example: "ABERTO" },
            TicketPriorityEnum: { type: "string", enum: ["BAIXA", "MEDIA", "ALTA", "CRITICA"], example: "MEDIA" },
            TicketDepartmentEnum: { type: "string", enum: ["TI", "FINANCEIRO", "RH", "OPERACOES", "OUTROS"], example: "TI" },
            TicketHistoryActionEnum: {
                type: "string",
                enum: [
                    "TICKET_CRIADO",
                    "STATUS_ALTERADO",
                    "RESPONSAVEL_ALTERADO",
                    "TITULO_ALTERADO",
                    "DESCRICAO_ALTERADA",
                    "PRIORIDADE_ALTERADA",
                    "DEPARTAMENTO_ALTERADO",
                    "COMENTARIO_ADICIONADO",
                ],
                example: "STATUS_ALTERADO",
            },
            Health: {
                type: "object",
                properties: { status: { type: "string", enum: ["ok", "unavailable"], example: "ok" } },
            },
            User: {
                type: "object",
                properties: {
                    id: { ...uuid, example: "f8f36a8f-71d4-4c48-9d99-1d88e6c9d0c5" },
                    email: { type: "string", format: "email", example: "admin@empresa.com" },
                    name: { type: "string", example: "Administrador" },
                    role: ref("UserRoleEnum"),
                    createdAt: dateTime,
                    updatedAt: dateTime,
                },
            },
            UserDirectoryEntry: {
                type: "object",
                description: "Dados mínimos de um usuário, visíveis a qualquer usuário autenticado.",
                properties: {
                    id: uuid,
                    name: { type: "string", example: "Ana Souza" },
                },
            },
            AuthRequest: {
                type: "object",
                required: ["userEmail", "password"],
                properties: {
                    userEmail: { type: "string", format: "email", example: "admin@empresa.com" },
                    password: { type: "string", example: "sua-senha" },
                },
            },
            AuthResponse: {
                type: "object",
                properties: {
                    token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
                    user: ref("User"),
                },
            },
            CreateUserRequest: {
                type: "object",
                required: ["userEmail", "userName", "password"],
                properties: {
                    userEmail: { type: "string", format: "email", example: "ana@empresa.com" },
                    userName: { type: "string", minLength: 2, maxLength: 100, example: "Ana Souza" },
                    password: { type: "string", minLength: 8, maxLength: 72, description: "De 8 a 72 bytes.", example: "uma-senha-forte" },
                    userRole: { ...ref("UserRoleEnum"), default: "USER" },
                },
            },
            UpdateUserRequest: {
                type: "object",
                description: "Informe ao menos um campo.",
                properties: {
                    userEmail: { type: "string", format: "email" },
                    userName: { type: "string", minLength: 2, maxLength: 100 },
                    password: { type: "string", minLength: 8, maxLength: 72 },
                    userRole: ref("UserRoleEnum"),
                },
            },
            ChangePasswordRequest: {
                type: "object",
                required: ["currentPassword", "newPassword"],
                properties: {
                    currentPassword: { type: "string" },
                    newPassword: { type: "string", minLength: 8, maxLength: 72 },
                },
            },
            Ticket: {
                type: "object",
                properties: {
                    id: uuid,
                    title: { type: "string", example: "Erro ao acessar o sistema" },
                    description: { type: "string", example: "O usuário não consegue acessar o painel principal." },
                    status: ref("TicketStatusEnum"),
                    priority: ref("TicketPriorityEnum"),
                    department: { ...ref("TicketDepartmentEnum"), nullable: true },
                    requesterId: uuid,
                    responsibleId: { ...uuid, nullable: true },
                    createdAt: dateTime,
                    updatedAt: dateTime,
                },
            },
            CreateTicketRequest: {
                type: "object",
                required: ["title", "description", "priority"],
                properties: {
                    title: { type: "string", minLength: 3, maxLength: 150, example: "Erro ao acessar o sistema" },
                    description: { type: "string", maxLength: 5000, example: "O usuário não consegue acessar o painel principal." },
                    priority: ref("TicketPriorityEnum"),
                    department: { ...ref("TicketDepartmentEnum"), nullable: true },
                    requesterId: {
                        ...uuid,
                        description: "Opcional; por padrão é o usuário autenticado. Somente administradores podem informar outro solicitante.",
                    },
                    responsibleId: { ...uuid, nullable: true },
                },
            },
            UpdateTicketRequest: {
                type: "object",
                description: "Informe ao menos um campo. Cada mudança gera um registro no histórico.",
                properties: {
                    title: { type: "string", minLength: 3, maxLength: 150 },
                    description: { type: "string", maxLength: 5000 },
                    priority: ref("TicketPriorityEnum"),
                    status: ref("TicketStatusEnum"),
                    department: { ...ref("TicketDepartmentEnum"), nullable: true },
                    responsibleId: { ...uuid, nullable: true, description: "`null` remove o responsável." },
                    comment: { type: "string", maxLength: 2000, example: "Análise inicial realizada." },
                },
            },
            AddTicketCommentRequest: {
                type: "object",
                required: ["comment"],
                properties: {
                    comment: { type: "string", maxLength: 2000, example: "Comentário adicionado ao atendimento." },
                },
            },
            TicketHistory: {
                type: "object",
                properties: {
                    id: uuid,
                    ticketId: uuid,
                    action: ref("TicketHistoryActionEnum"),
                    changedByUserId: uuid,
                    previousValue: { type: "string", nullable: true, example: "ABERTO" },
                    newValue: { type: "string", nullable: true, example: "EM_ANDAMENTO" },
                    comment: { type: "string", nullable: true, example: "Status atualizado durante o atendimento." },
                    createdAt: dateTime,
                    updatedAt: dateTime,
                },
            },
            DashboardUser: {
                type: "object",
                properties: { id: uuid, name: { type: "string" } },
            },
            DashboardResponse: {
                type: "object",
                properties: {
                    filters: {
                        type: "object",
                        description: "Período efetivamente aplicado (datas AAAA-MM-DD, em UTC).",
                        properties: {
                            startDate: { type: "string", example: "2026-11-12" },
                            endDate: { type: "string", example: "2026-11-18" },
                        },
                    },
                    options: {
                        type: "object",
                        properties: {
                            requesters: { type: "array", items: ref("DashboardUser") },
                            responsibles: { type: "array", items: ref("DashboardUser") },
                        },
                    },
                    stats: {
                        type: "object",
                        properties: {
                            total: { type: "integer" },
                            previousTotal: { type: "integer", description: "Total no período anterior, com o mesmo número de dias." },
                            changePercent: { type: "integer" },
                        },
                    },
                    series: {
                        type: "array",
                        description: "Tickets criados por dia no período.",
                        items: {
                            type: "object",
                            properties: {
                                date: { type: "string", example: "2026-11-18" },
                                label: { type: "string", example: "18/11" },
                                count: { type: "integer" },
                            },
                        },
                    },
                    ticketsByStatus: {
                        type: "array",
                        items: { type: "object", properties: { status: ref("TicketStatusEnum"), count: { type: "integer" } } },
                    },
                    ticketsByPriority: {
                        type: "array",
                        items: { type: "object", properties: { priority: ref("TicketPriorityEnum"), count: { type: "integer" } } },
                    },
                    ticketsByResponsible: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: { id: { ...uuid, nullable: true }, name: { type: "string" }, count: { type: "integer" } },
                        },
                    },
                    recentTickets: {
                        type: "array",
                        items: {
                            allOf: [
                                ref("Ticket"),
                                {
                                    type: "object",
                                    properties: {
                                        requester: ref("DashboardUser"),
                                        responsible: { ...ref("DashboardUser"), nullable: true },
                                    },
                                },
                            ],
                        },
                    },
                },
            },
        },
        parameters: {
            UserId: pathParameter("id", "Identificador do usuário."),
            TicketId: pathParameter("id", "Identificador do ticket."),
            RequesterId: pathParameter("requesterId", "Identificador do solicitante."),
            ResponsibleId: pathParameter("responsibleId", "Identificador do responsável."),
        },
    },
    paths: {
        "/health": {
            get: {
                tags: ["Sistema"],
                summary: "Verificar saúde da API e do banco",
                operationId: "health",
                responses: {
                    "200": ok("API e banco de dados acessíveis.", ref("Health")),
                    "503": ok("Banco de dados indisponível.", ref("Health")),
                },
            },
        },
        "/users/auth": {
            post: {
                tags: ["Users"],
                summary: "Autenticar usuário",
                description: "Limitado por IP: após 10 tentativas malsucedidas em 15 minutos, responde 429.",
                operationId: "authenticateUser",
                requestBody: body("AuthRequest"),
                responses: {
                    "200": ok("Token JWT e usuário autenticado.", ref("AuthResponse")),
                    ...errors("400", "401", "429"),
                },
            },
        },
        "/users/me": {
            get: {
                tags: ["Users"],
                summary: "Dados do usuário autenticado",
                operationId: "getCurrentUser",
                security: bearer,
                responses: {
                    "200": ok("Usuário autenticado.", ref("User")),
                    ...errors("401"),
                },
            },
        },
        "/users/me/password": {
            put: {
                tags: ["Users"],
                summary: "Alterar a própria senha",
                operationId: "changeOwnPassword",
                security: bearer,
                requestBody: body("ChangePasswordRequest"),
                responses: {
                    "204": ok("Senha alterada."),
                    ...errors("400", "401"),
                },
            },
        },
        "/users/directory": {
            get: {
                tags: ["Users"],
                summary: "Listar id e nome de todos os usuários",
                description: "Disponível para qualquer usuário autenticado; usado para exibir e atribuir responsáveis.",
                operationId: "listUserDirectory",
                security: bearer,
                responses: {
                    "200": ok("Usuários ordenados por nome.", list("UserDirectoryEntry")),
                    ...errors("401"),
                },
            },
        },
        "/users": {
            get: {
                tags: ["Users"],
                summary: "Listar usuários (administradores)",
                operationId: "listUsers",
                security: bearer,
                responses: {
                    "200": ok("Lista de usuários.", list("User")),
                    ...errors("401", "403"),
                },
            },
            post: {
                tags: ["Users"],
                summary: "Criar usuário (administradores)",
                operationId: "createUser",
                security: bearer,
                requestBody: body("CreateUserRequest"),
                responses: {
                    "201": ok("Usuário criado.", ref("User")),
                    ...errors("400", "401", "403", "409"),
                },
            },
        },
        "/users/{id}": {
            get: {
                tags: ["Users"],
                summary: "Buscar usuário por id (administradores)",
                operationId: "findUserById",
                security: bearer,
                parameters: [param("UserId")],
                responses: {
                    "200": ok("Usuário encontrado.", ref("User")),
                    ...errors("400", "401", "403", "404"),
                },
            },
            put: {
                tags: ["Users"],
                summary: "Atualizar usuário (administradores)",
                description: "Não é possível rebaixar o último administrador.",
                operationId: "updateUser",
                security: bearer,
                parameters: [param("UserId")],
                requestBody: body("UpdateUserRequest"),
                responses: {
                    "200": ok("Usuário atualizado.", ref("User")),
                    ...errors("400", "401", "403", "404", "409"),
                },
            },
            delete: {
                tags: ["Users"],
                summary: "Excluir usuário (administradores)",
                description: "Não é possível excluir a si mesmo, o último administrador, nem usuários com tickets ou atividades registradas (409).",
                operationId: "deleteUser",
                security: bearer,
                parameters: [param("UserId")],
                responses: {
                    "204": ok("Usuário excluído."),
                    ...errors("400", "401", "403", "404", "409"),
                },
            },
        },
        "/tickets": {
            get: {
                tags: ["Tickets"],
                summary: "Listar tickets",
                description: "Ordenados do mais recentemente atualizado para o mais antigo.",
                operationId: "listTickets",
                security: bearer,
                responses: {
                    "200": ok("Lista de tickets.", list("Ticket")),
                    ...errors("401"),
                },
            },
            post: {
                tags: ["Tickets"],
                summary: "Criar ticket",
                operationId: "createTicket",
                security: bearer,
                requestBody: body("CreateTicketRequest"),
                responses: {
                    "201": ok("Ticket criado.", ref("Ticket")),
                    ...errors("400", "401", "403"),
                },
            },
        },
        "/tickets/requester/{requesterId}": {
            get: {
                tags: ["Tickets"],
                summary: "Listar tickets por solicitante",
                operationId: "findTicketsByRequesterId",
                security: bearer,
                parameters: [param("RequesterId")],
                responses: {
                    "200": ok("Tickets do solicitante.", list("Ticket")),
                    ...errors("400", "401"),
                },
            },
        },
        "/tickets/responsible/{responsibleId}": {
            get: {
                tags: ["Tickets"],
                summary: "Listar tickets por responsável",
                operationId: "findTicketsByResponsibleId",
                security: bearer,
                parameters: [param("ResponsibleId")],
                responses: {
                    "200": ok("Tickets do responsável.", list("Ticket")),
                    ...errors("400", "401"),
                },
            },
        },
        "/tickets/{id}": {
            get: {
                tags: ["Tickets"],
                summary: "Buscar ticket por id",
                operationId: "findTicketById",
                security: bearer,
                parameters: [param("TicketId")],
                responses: {
                    "200": ok("Ticket encontrado.", ref("Ticket")),
                    ...errors("400", "401", "404"),
                },
            },
            put: {
                tags: ["Tickets"],
                summary: "Atualizar ticket",
                description: "Permitido a administradores, ao solicitante e ao responsável atual.",
                operationId: "updateTicket",
                security: bearer,
                parameters: [param("TicketId")],
                requestBody: body("UpdateTicketRequest"),
                responses: {
                    "200": ok("Ticket atualizado.", ref("Ticket")),
                    ...errors("400", "401", "403", "404"),
                },
            },
            delete: {
                tags: ["Tickets"],
                summary: "Excluir ticket",
                description: "Permitido a administradores e ao solicitante. Apaga também o histórico.",
                operationId: "deleteTicket",
                security: bearer,
                parameters: [param("TicketId")],
                responses: {
                    "204": ok("Ticket excluído."),
                    ...errors("400", "401", "403", "404"),
                },
            },
        },
        "/tickets/{id}/comments": {
            post: {
                tags: ["Tickets"],
                summary: "Adicionar comentário",
                operationId: "addTicketComment",
                security: bearer,
                parameters: [param("TicketId")],
                requestBody: body("AddTicketCommentRequest"),
                responses: {
                    "201": ok("Registro de histórico criado para o comentário.", ref("TicketHistory")),
                    ...errors("400", "401", "404"),
                },
            },
        },
        "/tickets/{id}/history": {
            get: {
                tags: ["Tickets"],
                summary: "Listar histórico do ticket",
                operationId: "findTicketHistoryByTicketId",
                security: bearer,
                parameters: [param("TicketId")],
                responses: {
                    "200": ok("Histórico em ordem cronológica.", list("TicketHistory")),
                    ...errors("400", "401", "404"),
                },
            },
        },
        "/dashboard": {
            get: {
                tags: ["Dashboard"],
                summary: "Indicadores de tickets",
                description:
                    "Sem datas, usa os últimos 7 dias. Período máximo de 366 dias. A variação percentual compara com o período imediatamente anterior, de mesma duração.",
                operationId: "getDashboard",
                security: bearer,
                parameters: [
                    query("startDate", "Data inicial (AAAA-MM-DD, UTC).", { type: "string", format: "date" }),
                    query("endDate", "Data final (AAAA-MM-DD, UTC).", { type: "string", format: "date" }),
                    query("status", "Filtra por status.", ref("TicketStatusEnum")),
                    query("priority", "Filtra por prioridade.", ref("TicketPriorityEnum")),
                    query("requesterId", "Filtra por solicitante.", uuid),
                    query("responsibleId", "Filtra por responsável; use `unassigned` para tickets sem responsável.", { type: "string" }),
                    query("search", "Busca no título e na descrição (até 100 caracteres)."),
                ],
                responses: {
                    "200": ok("Indicadores do período.", ref("DashboardResponse")),
                    ...errors("400", "401"),
                },
            },
        },
    },
};
