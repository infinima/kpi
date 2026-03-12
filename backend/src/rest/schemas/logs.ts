import { z } from "../../utils/zod-openapi-init.js";
import { registry } from "../../utils/openapi.js";

// ===== Схемы =====
export const KPIObjectEnum = z.enum([
    "events",
    "locations",
    "leagues",
    "teams",
    "users",
    "permissions",
    "mailings"
]);
export const LogSchema = z.object({
    id: z.number(),
    table_name: z.string(),
    record_id: z.number().nullable(),
    action: z.string(),
    old_data: z.any().nullable(),
    new_data: z.any().nullable(),
    diff_data: z.any().nullable(),
    params: z.any().nullable(),
    user_id: z.number().nullable(),
    query_text: z.string().nullable(),
    created_at: z.string()
});
registry.register("Log", LogSchema);

const IncludeUserQuery = z.object({
    include: z.string().optional().openapi({
        description: "Укажи `include=user`, чтобы вернуть данные пользователя",
        example: "user"
    })
});
const PaginationQuery = z.object({
    current_page: z
        .string()
        .regex(/^\d+$/, "Must be integer")
        .optional()
        .openapi({
            description: "Номер страницы (1-based)",
            example: "1",
        }),
});
const LogsPageSchema = z.object({
    page: z.array(LogSchema),
    current_page: z.number(),
    page_size: z.number(),
    total: z.number(),
    max_page: z.number(),
});
const LogsQuery = z.object({
    ...IncludeUserQuery.shape,
    ...PaginationQuery.shape,
});

export const GetLogsByUserInput = z.object({
    user_id: z.coerce.number().int(),
});
export const GetLogsByObjectInput = z.object({
    object: KPIObjectEnum,
});
export const GetLogsByRecordInput = z.object({
    object: KPIObjectEnum,
    id: z.coerce.number(),
});



// ===== Документация =====

registry.registerPath({
    method: "get",
    path: "/api/logs/user/{user_id}",
    summary: "Получить действия конкретного пользователя",
    tags: ["Logs"],
    security: [{ BearerAuth: [] }],
    request: {
        params: GetLogsByUserInput,
        query: LogsQuery,
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": { schema: LogsPageSchema },
            },
        },
        400: { description: "Invalid page" },
    },
});

// GET /api/logs/object/{object}
registry.registerPath({
    method: "get",
    path: "/api/logs/object/{object}",
    summary: "Получить логи по типу объекта",
    tags: ["Logs"],
    security: [{ BearerAuth: [] }],
    request: {
        params: GetLogsByObjectInput,
        query: LogsQuery,
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": { schema: LogsPageSchema },
            },
        },
        400: { description: "Invalid page" },
    },
});

// GET /api/logs/object/{object}/{id}
registry.registerPath({
    method: "get",
    path: "/api/logs/object/{object}/{id}",
    summary: "Получить логи по конкретной записи объекта",
    tags: ["Logs"],
    security: [{ BearerAuth: [] }],
    request: {
        params: GetLogsByRecordInput,
        query: LogsQuery,
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": { schema: LogsPageSchema },
            },
        },
        400: { description: "Invalid page" },
    },
});
