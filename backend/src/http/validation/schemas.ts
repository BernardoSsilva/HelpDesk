import { z } from "zod";
import { TicketDepartmentEnum } from "../../domain/enums/ticketDepartment.enum.js";
import { TicketPriorityEnum } from "../../domain/enums/ticketPriority.enum.js";
import { TicketStatusEnum } from "../../domain/enums/ticketStatus.enum.js";
import { UserRoleEnum } from "../../domain/enums/userRole.enum.js";
import { ValidationError } from "../../domain/errors/domain.error.js";

// Mensagens padrão do zod em português para tudo que não tiver mensagem própria.
z.config(z.locales.pt());

type TextOptions = {
    /** Mensagem quando o campo está ausente ou vazio. Ex.: "Informe o título". */
    required: string;
    /** Sujeito da frase de tamanho. Ex.: "O título". */
    name: string;
    min?: number;
    max: number;
};

function text({ required, name, min = 1, max }: TextOptions) {
    const lengthMessage = min > 1 ? `${name} deve ter entre ${min} e ${max} caracteres` : `${name} deve ter no máximo ${max} caracteres`;
    // `abort` evita empilhar uma segunda mensagem quando o campo está vazio.
    const base = z.string({ error: required }).trim().min(1, { error: required, abort: true });

    return (min > 1 ? base.min(min, { error: lengthMessage }) : base).max(max, { error: lengthMessage });
}

const uuid = (message: string) => z.uuid({ error: message });

const email = z
    .string({ error: "Informe o e-mail" })
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Informe um e-mail válido" }));

// bcrypt só considera os primeiros 72 bytes; recusamos senhas maiores em vez de truncá-las em silêncio.
const newPassword = (required: string) =>
    z
        .string({ error: required })
        .min(8, { error: "A senha deve ter pelo menos 8 caracteres" })
        .refine((value) => Buffer.byteLength(value, "utf8") <= 72, { error: "A senha deve ter no máximo 72 bytes" });

const atLeastOneField = (value: Record<string, unknown>) => Object.values(value).some((field) => field !== undefined);
const atLeastOneFieldMessage = { error: "Informe ao menos um campo para atualizar" };

const priority = z.enum(TicketPriorityEnum, { error: "Prioridade inválida" });
const status = z.enum(TicketStatusEnum, { error: "Status inválido" });
const department = z.enum(TicketDepartmentEnum, { error: "Departamento inválido" });
const role = z.enum(UserRoleEnum, { error: "Perfil inválido" });

const title = text({ required: "Informe o título", name: "O título", min: 3, max: 150 });
const description = text({ required: "Informe a descrição", name: "A descrição", max: 5000 });
const comment = text({ required: "Informe o comentário", name: "O comentário", max: 2000 });

export const idSchema = uuid("Identificador inválido");

export const loginSchema = z.object({
    userEmail: z.string({ error: "Informe o e-mail" }).trim().toLowerCase().min(1, { error: "Informe o e-mail" }),
    password: z.string({ error: "Informe a senha" }).min(1, { error: "Informe a senha" }).max(200),
});

export const createUserSchema = z.object({
    userEmail: email,
    userName: text({ required: "Informe o nome", name: "O nome", min: 2, max: 100 }),
    password: newPassword("Informe a senha"),
    userRole: role.default(UserRoleEnum.USER),
});

export const updateUserSchema = z
    .object({
        userEmail: email.optional(),
        userName: text({ required: "Informe o nome", name: "O nome", min: 2, max: 100 }).optional(),
        password: newPassword("Informe a senha").optional(),
        userRole: role.optional(),
    })
    .refine(atLeastOneField, atLeastOneFieldMessage);

export const changePasswordSchema = z.object({
    currentPassword: z.string({ error: "Informe a senha atual" }).min(1, { error: "Informe a senha atual" }),
    newPassword: newPassword("Informe a nova senha"),
});

export const createTicketSchema = z.object({
    title,
    description,
    priority,
    department: department.nullable().optional(),
    requesterId: uuid("Solicitante inválido").optional(),
    responsibleId: uuid("Responsável inválido").nullable().optional(),
});

export const updateTicketSchema = z
    .object({
        title: title.optional(),
        description: description.optional(),
        priority: priority.optional(),
        status: status.optional(),
        department: department.nullable().optional(),
        responsibleId: uuid("Responsável inválido").nullable().optional(),
        comment: comment.optional(),
    })
    .refine(atLeastOneField, atLeastOneFieldMessage);

export const addCommentSchema = z.object({
    comment,
});

const isoDate = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Data inválida. Use o formato AAAA-MM-DD", abort: true })
    // O V8 "corrige" dias impossíveis (2026-02-31 vira 03/03), então conferimos a ida e volta.
    .refine(
        (value) => {
            const date = new Date(`${value}T00:00:00.000Z`);

            // `toISOString()` lança RangeError em datas inválidas (ex.: mês 13), por isso a checagem prévia.
            return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
        },
        { error: "Data inválida" },
    )
    .transform((value) => new Date(`${value}T00:00:00.000Z`));

export const dashboardQuerySchema = z.object({
    startDate: isoDate.optional(),
    endDate: isoDate.optional(),
    status: status.optional(),
    priority: priority.optional(),
    requesterId: uuid("Solicitante inválido").optional(),
    responsibleId: z.union([z.literal("unassigned"), uuid("Responsável inválido")]).optional(),
    search: z.string().trim().max(100, { error: "A busca deve ter no máximo 100 caracteres" }).optional(),
});

/**
 * Valida `data` com o schema e lança `ValidationError` (HTTP 400) com os detalhes por campo.
 * `rootField` nomeia o campo quando o schema valida um valor solto (ex.: parâmetro da URL).
 */
export function parse<S extends z.ZodType>(schema: S, data: unknown, rootField = ""): z.output<S> {
    const result = schema.safeParse(data);

    if (result.success) {
        return result.data;
    }

    const fields = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || rootField,
        message: issue.message,
    }));

    throw new ValidationError(fields[0]?.message ?? "Dados inválidos", fields);
}

/** Valida um identificador (UUID) vindo da URL. */
export function parseId(value: unknown, field = "id") {
    return parse(idSchema, value, field);
}
