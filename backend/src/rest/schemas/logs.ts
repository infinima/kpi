import { z } from "../../utils/zod-openapi-init.js";
import { registry } from "../../utils/openapi.js";

// ===== Схемы =====
export const KPIObjectEnum = z.enum([
    "events",
    "locations",
    "leagues",
    "teams",
    "users",
    "permissions"
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

// GET /api/logs/user/{user_id}
registry.registerPath({
    method: "get",
    path: "/api/logs/user/{user_id}",
    summary: "Получить все действия конкретного пользователя",
    tags: ["Logs"],
    security: [{ BearerAuth: [] }],
    request: {
        params: GetLogsByUserInput,
        query: IncludeUserQuery,
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": {
                    schema: z.array(LogSchema),
                },
            },
        },
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
        query: IncludeUserQuery,
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": {
                    schema: z.array(LogSchema),
                },
            },
        },
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
        query: IncludeUserQuery,
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": {
                    schema: z.array(LogSchema),
                },
            },
        },
    },
});
