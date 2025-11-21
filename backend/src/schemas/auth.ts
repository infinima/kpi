import { z } from "../utils/zod-openapi-init.js";
import { registry } from "../utils/openapi.js";
import {UserSchema} from "./users.js";

// ===== Схемы =====
export const LoginInput = z.object({
    email: z.email(),
    password: z.string().min(1)
});
export const LoginResponse = z.object({
    token: z.string().min(10)
});
export const LogoutResponse = z.object({
    success: z.boolean()
});
export const MeQuery = z.object({
    include: z
        .string()
        .transform(v => v.split(","))
        .pipe(z.array(z.enum(["user"])))
        .optional()
});
export const MeResponse = z.object({
    user_id: z.number().int(),
    expires_at: z.string(),
    user: UserSchema.optional()
});


// ===== Документация =====

registry.registerComponent(
    "securitySchemes",
    "BearerAuth",
    {
        type: "http",
        scheme: "bearer"
    }
);

// POST /api/auth/login
registry.registerPath({
    method: "post",
    path: "/api/auth/login",
    summary: "Вход по email и паролю",
    tags: ["Auth"],
    request: {
        body: {
            content: {
                "application/json": {
                    schema: LoginInput
                }
            }
        }
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": { schema: LoginResponse }
            }
        },
        400: { description: "Validation failed" },
        401: { description: "Invalid credentials" }
    }
});

// GET /api/auth/me
registry.registerPath({
    method: "get",
    path: "/api/auth/me",
    summary: "Получить информацию о текущей сессии",
    tags: ["Auth"],
    security: [{ BearerAuth: [] }],
    parameters: [
        {
            name: "include",
            in: "query",
            required: false,
            schema: {
                type: "array",
                items: {
                    type: "string",
                    enum: ["user"]
                },
            },
            description: "Список полей для включения в ответ."
        }
    ],
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": { schema: MeResponse }
            }
        },
        401: { description: "Invalid or expired token" }
    }
});

// POST /api/auth/logout
registry.registerPath({
    method: "post",
    path: "/api/auth/logout",
    summary: "Выход пользователя",
    tags: ["Auth"],
    security: [{ BearerAuth: [] }],
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": { schema: LogoutResponse }
            }
        },
        400: { description: "Session already deactivated" }
    }
});
