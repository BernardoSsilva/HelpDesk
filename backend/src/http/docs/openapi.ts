export const openApiDocument = {
    openapi: "3.0.3",
    info: {
        title: "Ticket Management API",
        version: "1.0.0",
        description: "API for user management, ticket lifecycle, comments and ticket history.",
    },
    servers: [
        {
            url: "http://localhost:8080",
            description: "Local development server",
        },
    ],
    tags: [
        {
            name: "Users",
            description: "User creation, update, deletion and authentication.",
        },
        {
            name: "Tickets",
            description: "Ticket creation, update, listing, comments and history.",
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
            },
        },
        schemas: {
            ErrorResponse: {
                type: "object",
                properties: {
                    message: {
                        type: "string",
                        example: "Invalid token",
                    },
                },
            },
            UserRoleEnum: {
                type: "string",
                enum: ["ADMIN", "USER"],
                example: "USER",
            },
            TicketStatusEnum: {
                type: "string",
                enum: ["ABERTO", "EM_ANDAMENTO", "AGUARDANDO", "RESOLVIDO", "FECHADO"],
                example: "ABERTO",
            },
            TicketPriorityEnum: {
                type: "string",
                enum: ["BAIXA", "MEDIA", "ALTA", "CRITICA"],
                example: "MEDIA",
            },
            TicketHistoryActionEnum: {
                type: "string",
                enum: [
                    "TICKET_CRIADO",
                    "STATUS_ALTERADO",
                    "RESPONSAVEL_ALTERADO",
                    "TITULO_ALTERADO",
                    "DESCRICAO_ALTERADA",
                    "PRIORIDADE_ALTERADA",
                    "COMENTARIO_ADICIONADO",
                ],
                example: "STATUS_ALTERADO",
            },
            User: {
                type: "object",
                properties: {
                    id: {
                        type: "string",
                        format: "uuid",
                        example: "f8f36a8f-71d4-4c48-9d99-1d88e6c9d0c5",
                    },
                    email: {
                        type: "string",
                        format: "email",
                        example: "admin@email.com",
                    },
                    name: {
                        type: "string",
                        example: "Admin",
                    },
                    role: {
                        $ref: "#/components/schemas/UserRoleEnum",
                    },
                    createdAt: {
                        type: "string",
                        format: "date-time",
                    },
                    updatedAt: {
                        type: "string",
                        format: "date-time",
                    },
                },
            },
            AuthRequest: {
                type: "object",
                required: ["userEmail", "password"],
                properties: {
                    userEmail: {
                        type: "string",
                        format: "email",
                        example: "admin@email.com",
                    },
                    password: {
                        type: "string",
                        example: "123456",
                    },
                },
            },
            AuthResponse: {
                type: "object",
                properties: {
                    token: {
                        type: "string",
                        example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    },
                    user: {
                        $ref: "#/components/schemas/User",
                    },
                },
            },
            CreateUserRequest: {
                type: "object",
                required: ["userEmail", "userName", "password"],
                properties: {
                    userEmail: {
                        type: "string",
                        format: "email",
                        example: "user@email.com",
                    },
                    userName: {
                        type: "string",
                        example: "User Name",
                    },
                    password: {
                        type: "string",
                        example: "123456",
                    },
                    userRole: {
                        $ref: "#/components/schemas/UserRoleEnum",
                    },
                },
            },
            UpdateUserRequest: {
                type: "object",
                properties: {
                    userEmail: {
                        type: "string",
                        format: "email",
                        example: "updated@email.com",
                    },
                    userName: {
                        type: "string",
                        example: "Updated User",
                    },
                    password: {
                        type: "string",
                        example: "new-password",
                    },
                    userRole: {
                        $ref: "#/components/schemas/UserRoleEnum",
                    },
                },
            },
            Ticket: {
                type: "object",
                properties: {
                    id: {
                        type: "string",
                        format: "uuid",
                    },
                    title: {
                        type: "string",
                        example: "Erro ao acessar o sistema",
                    },
                    description: {
                        type: "string",
                        example: "Usuario nao consegue acessar o painel principal.",
                    },
                    status: {
                        $ref: "#/components/schemas/TicketStatusEnum",
                    },
                    priority: {
                        $ref: "#/components/schemas/TicketPriorityEnum",
                    },
                    requesterId: {
                        type: "string",
                        format: "uuid",
                    },
                    responsibleId: {
                        type: "string",
                        format: "uuid",
                        nullable: true,
                    },
                    createdAt: {
                        type: "string",
                        format: "date-time",
                    },
                    updatedAt: {
                        type: "string",
                        format: "date-time",
                    },
                },
            },
            CreateTicketRequest: {
                type: "object",
                required: ["title", "description", "priority"],
                properties: {
                    title: {
                        type: "string",
                        example: "Erro ao acessar o sistema",
                    },
                    description: {
                        type: "string",
                        example: "Usuario nao consegue acessar o painel principal.",
                    },
                    requesterId: {
                        type: "string",
                        format: "uuid",
                        description: "Optional. If omitted, the authenticated user will be used.",
                    },
                    priority: {
                        $ref: "#/components/schemas/TicketPriorityEnum",
                    },
                    responsibleId: {
                        type: "string",
                        format: "uuid",
                        nullable: true,
                    },
                },
            },
            UpdateTicketRequest: {
                type: "object",
                properties: {
                    title: {
                        type: "string",
                        example: "Erro ao acessar o painel administrativo",
                    },
                    description: {
                        type: "string",
                        example: "Usuario recebe mensagem de credenciais invalidas.",
                    },
                    priority: {
                        $ref: "#/components/schemas/TicketPriorityEnum",
                    },
                    status: {
                        $ref: "#/components/schemas/TicketStatusEnum",
                    },
                    responsibleId: {
                        type: "string",
                        format: "uuid",
                        nullable: true,
                    },
                    comment: {
                        type: "string",
                        example: "Analise inicial realizada.",
                    },
                },
            },
            AddTicketCommentRequest: {
                type: "object",
                required: ["comment"],
                properties: {
                    comment: {
                        type: "string",
                        example: "Comentario adicionado ao atendimento.",
                    },
                },
            },
            TicketHistory: {
                type: "object",
                properties: {
                    id: {
                        type: "string",
                        format: "uuid",
                    },
                    ticketId: {
                        type: "string",
                        format: "uuid",
                    },
                    action: {
                        $ref: "#/components/schemas/TicketHistoryActionEnum",
                    },
                    changedByUserId: {
                        type: "string",
                        format: "uuid",
                    },
                    previousValue: {
                        type: "string",
                        nullable: true,
                        example: "ABERTO",
                    },
                    newValue: {
                        type: "string",
                        nullable: true,
                        example: "EM_ANDAMENTO",
                    },
                    comment: {
                        type: "string",
                        nullable: true,
                        example: "Status atualizado durante o atendimento.",
                    },
                    createdAt: {
                        type: "string",
                        format: "date-time",
                    },
                    updatedAt: {
                        type: "string",
                        format: "date-time",
                    },
                },
            },
        },
        parameters: {
            UserId: {
                name: "id",
                in: "path",
                required: true,
                schema: {
                    type: "string",
                    format: "uuid",
                },
            },
            TicketId: {
                name: "id",
                in: "path",
                required: true,
                schema: {
                    type: "string",
                    format: "uuid",
                },
            },
            RequesterId: {
                name: "requesterId",
                in: "path",
                required: true,
                schema: {
                    type: "string",
                    format: "uuid",
                },
            },
            ResponsibleId: {
                name: "responsibleId",
                in: "path",
                required: true,
                schema: {
                    type: "string",
                    format: "uuid",
                },
            },
        },
    },
    paths: {
        "/users/auth": {
            post: {
                tags: ["Users"],
                summary: "Authenticate user",
                operationId: "authenticateUser",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/AuthRequest",
                            },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Authenticated user and JWT token.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/AuthResponse",
                                },
                            },
                        },
                    },
                    "401": {
                        description: "Invalid credentials.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                },
            },
        },
        "/users": {
            post: {
                tags: ["Users"],
                summary: "Create user",
                operationId: "createUser",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/CreateUserRequest",
                            },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Created user.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/User",
                                },
                            },
                        },
                    },
                    "400": {
                        description: "Invalid request.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    "401": {
                        description: "Missing or invalid token.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                },
            },
        },
        "/users/{id}": {
            put: {
                tags: ["Users"],
                summary: "Update user",
                operationId: "updateUser",
                security: [{ bearerAuth: [] }],
                parameters: [{ $ref: "#/components/parameters/UserId" }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/UpdateUserRequest",
                            },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Updated user.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/User",
                                },
                            },
                        },
                    },
                    "400": {
                        description: "Invalid request.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    "401": {
                        description: "Missing or invalid token.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                },
            },
            delete: {
                tags: ["Users"],
                summary: "Delete user",
                operationId: "deleteUser",
                security: [{ bearerAuth: [] }],
                parameters: [{ $ref: "#/components/parameters/UserId" }],
                responses: {
                    "204": {
                        description: "User deleted.",
                    },
                    "400": {
                        description: "Invalid request.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    "401": {
                        description: "Missing or invalid token.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                },
            },
        },
        "/tickets": {
            get: {
                tags: ["Tickets"],
                summary: "List tickets",
                operationId: "listTickets",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Ticket list.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: {
                                        $ref: "#/components/schemas/Ticket",
                                    },
                                },
                            },
                        },
                    },
                    "401": {
                        description: "Missing or invalid token.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                },
            },
            post: {
                tags: ["Tickets"],
                summary: "Create ticket",
                operationId: "createTicket",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/CreateTicketRequest",
                            },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Created ticket.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/Ticket",
                                },
                            },
                        },
                    },
                    "400": {
                        description: "Invalid request.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    "401": {
                        description: "Missing or invalid token.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                },
            },
        },
        "/tickets/requester/{requesterId}": {
            get: {
                tags: ["Tickets"],
                summary: "List tickets by requester",
                operationId: "findTicketsByRequesterId",
                security: [{ bearerAuth: [] }],
                parameters: [{ $ref: "#/components/parameters/RequesterId" }],
                responses: {
                    "200": {
                        description: "Requester ticket list.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: {
                                        $ref: "#/components/schemas/Ticket",
                                    },
                                },
                            },
                        },
                    },
                    "400": {
                        description: "Invalid request.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    "401": {
                        description: "Missing or invalid token.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                },
            },
        },
        "/tickets/responsible/{responsibleId}": {
            get: {
                tags: ["Tickets"],
                summary: "List tickets by responsible user",
                operationId: "findTicketsByResponsibleId",
                security: [{ bearerAuth: [] }],
                parameters: [{ $ref: "#/components/parameters/ResponsibleId" }],
                responses: {
                    "200": {
                        description: "Responsible user ticket list.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: {
                                        $ref: "#/components/schemas/Ticket",
                                    },
                                },
                            },
                        },
                    },
                    "400": {
                        description: "Invalid request.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    "401": {
                        description: "Missing or invalid token.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                },
            },
        },
        "/tickets/{id}": {
            get: {
                tags: ["Tickets"],
                summary: "Find ticket by id",
                operationId: "findTicketById",
                security: [{ bearerAuth: [] }],
                parameters: [{ $ref: "#/components/parameters/TicketId" }],
                responses: {
                    "200": {
                        description: "Found ticket.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/Ticket",
                                },
                            },
                        },
                    },
                    "404": {
                        description: "Ticket not found.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    "401": {
                        description: "Missing or invalid token.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                },
            },
            put: {
                tags: ["Tickets"],
                summary: "Update ticket",
                operationId: "updateTicket",
                security: [{ bearerAuth: [] }],
                parameters: [{ $ref: "#/components/parameters/TicketId" }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/UpdateTicketRequest",
                            },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Updated ticket.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/Ticket",
                                },
                            },
                        },
                    },
                    "400": {
                        description: "Invalid request.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    "401": {
                        description: "Missing or invalid token.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                },
            },
            delete: {
                tags: ["Tickets"],
                summary: "Delete ticket",
                operationId: "deleteTicket",
                security: [{ bearerAuth: [] }],
                parameters: [{ $ref: "#/components/parameters/TicketId" }],
                responses: {
                    "204": {
                        description: "Ticket deleted.",
                    },
                    "400": {
                        description: "Invalid request.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    "401": {
                        description: "Missing or invalid token.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                },
            },
        },
        "/tickets/{id}/comments": {
            post: {
                tags: ["Tickets"],
                summary: "Add ticket comment",
                operationId: "addTicketComment",
                security: [{ bearerAuth: [] }],
                parameters: [{ $ref: "#/components/parameters/TicketId" }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/AddTicketCommentRequest",
                            },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Created ticket history entry for the comment.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/TicketHistory",
                                },
                            },
                        },
                    },
                    "400": {
                        description: "Invalid request.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    "401": {
                        description: "Missing or invalid token.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                },
            },
        },
        "/tickets/{id}/history": {
            get: {
                tags: ["Tickets"],
                summary: "List ticket history",
                operationId: "findTicketHistoryByTicketId",
                security: [{ bearerAuth: [] }],
                parameters: [{ $ref: "#/components/parameters/TicketId" }],
                responses: {
                    "200": {
                        description: "Ticket history list.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: {
                                        $ref: "#/components/schemas/TicketHistory",
                                    },
                                },
                            },
                        },
                    },
                    "400": {
                        description: "Invalid request.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    "401": {
                        description: "Missing or invalid token.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                },
            },
        },
    },
};
