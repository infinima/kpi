import { z } from "../../utils/zod-openapi-init.js";
import { registry } from "../../utils/openapi.js";

// ===== Схемы =====
export const UserSchema = z.object({
    id: z.coerce.number().int().positive(),
    email: z.email(),
    last_name: z.string().min(1),
    first_name: z.string().min(1),
    patronymic: z.string().nullable(),
    tg_id: z.number().int().nullable(),
    tg_username: z.string().nullable(),
    tg_full_name: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
    deleted_at: z.string().nullable(),
});
registry.register("User", UserSchema);

export const GetOneUserInput = UserSchema.pick({ id: true });
export const CreateUserInput = UserSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
    tg_full_name: true,
    tg_id: true,
    tg_username: true
}).extend({
    password: z.string().min(6, "Password must be at least 6 chars"),
    photo: z.string().regex(
        /^data:image\/(png|jpe?g|webp);base64,/i,
        "Must be base64 square image string"
    ),
});
export const UpdateUserInput = CreateUserInput
    .partial()
    .omit({
        password: true,
    })


// ===== Документация =====

// GET /api/users
registry.registerPath({
    method: "get",
    path: "/api/users",
    summary: "Получить список пользователей",
    tags: ["Users"],
    security: [{ BearerAuth: [] }],
    responses: {
        200: {
            description: "OK",
            content: { "application/json": { schema: z.array(UserSchema) } },
        },
    },
});


// GET /api/users/{id}
registry.registerPath({
    method: "get",
    path: "/api/users/{id}",
    summary: "Получить пользователя по id",
    tags: ["Users"],
    security: [{ BearerAuth: [] }],
    request: { params: GetOneUserInput },
    responses: {
        200: {
            description: "OK",
            content: { "application/json": { schema: UserSchema } },
        },
        400: { description: "The user is deleted" },
        404: { description: "The user does not exist" },
    },
});


// GET /api/users/{id}/photo
registry.registerPath({
    method: "get",
    path: "/api/users/{id}/photo",
    summary: "Получить фото пользователя",
    tags: ["Users"],
    security: [{ BearerAuth: [] }],
    request: { params: GetOneUserInput },
    responses: {
        200: {
            description: "OK",
            content: {
                "image/webp": { schema: { type: "string", format: "binary" } },
            },
        },
        400: { description: "The user is deleted" },
        404: { description: "The user does not exist" },
        500: { description: "Failed to send file" },
    },
});

// POST /api/users
registry.registerPath({
    method: "post",
    path: "/api/users",
    summary: "Создать пользователя",
    tags: ["Users"],
    security: [{ BearerAuth: [] }],
    request: {
        body: {
            content: { "application/json": { schema: CreateUserInput } },
        },
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": { schema: UserSchema.pick({ id: true }) },
            },
        },
        400: { description: "Validation failed" },
    },
});

// PATCH /api/users/{id}
registry.registerPath({
    method: "patch",
    path: "/api/users/{id}",
    summary: "Обновить пользователя",
    tags: ["Users"],
    security: [{ BearerAuth: [] }],
    request: {
        params: GetOneUserInput,
        body: {
            content: { "application/json": { schema: UpdateUserInput } },
        },
    },
    responses: {
        200: { description: "OK" },
        400: { description: "The user is deleted or validation failed" },
        404: { description: "The user does not exist" },
    },
});

// DELETE /api/users/{id}
registry.registerPath({
    method: "delete",
    path: "/api/users/{id}",
    summary: "Удалить пользователя",
    tags: ["Users"],
    security: [{ BearerAuth: [] }],
    request: {
        params: GetOneUserInput,
    },
    responses: {
        200: { description: "OK" },
        400: { description: "The user is deleted" },
        404: { description: "The user does not exist" },
    },
});

// POST /api/users/{id}/restore
registry.registerPath({
    method: "post",
    path: "/api/users/{id}/restore",
    summary: "Восстановить удалённого пользователя",
    tags: ["Users"],
    security: [{ BearerAuth: [] }],
    request: { params: GetOneUserInput },
    responses: {
        200: { description: "OK" },
        400: { description: "The user is not deleted" },
        404: { description: "The user does not exist" },
    },
});

export type User = z.infer<typeof UserSchema>;
