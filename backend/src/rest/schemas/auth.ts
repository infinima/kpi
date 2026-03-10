import { z } from "../../utils/zod-openapi-init.js";
import { registry } from "../../utils/openapi.js";
import {UserSchema} from "./users.js";

// ===== Схемы =====
export const LoginInput = z.object({
    email: z.email(),
    password: z.string().min(1)
});
export const LoginResponse = z.object({
    token: z.string().min(10)
});
export const RegisterStartInput = z.object({
    email: z.email(),
    password: z.string().min(6, "Password must be at least 6 chars"),
    last_name: z.string().min(1),
    first_name: z.string().min(1),
    patronymic: z.string().nullable().optional(),
    phone_number: z.string().regex(/^\+?[0-9][0-9\s\-()]{8,20}$/, "Invalid phone number"),
});
export const RegisterStartResponse = z.object({
    success: z.boolean(),
    expires_at: z.string()
});
export const RegisterConfirmInput = z.object({
    email: z.email(),
    code: z.string().regex(/^\d{4}$/)
});
export const RegisterConfirmResponse = z.object({
    id: z.number().int().positive()
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

export const KPIPermissionEnum = z.enum([
    "get",
    "create",
    "update",
    "delete",
    "restore",
    "access_history",
    "access_actions_history",
    "print_documents",
    "edit_answers",
    "get_show",
    "control_show",
    "edit_penalties",
    "edit_photos"
]);
export const KPIObjectEnum = z.enum([
    "events",
    "locations",
    "leagues",
    "teams",
    "users",
    "permissions"
]);
export const PermissionOutput = z.record(
    KPIObjectEnum,
    z.record(
        z.string(), // "global" или id
        z.array(KPIPermissionEnum).optional()
    )
);



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

// POST /api/auth/register/start
registry.registerPath({
    method: "post",
    path: "/api/auth/register/start",
    summary: "Начать регистрацию пользователя (отправка кода)",
    tags: ["Auth"],
    request: {
        body: {
            content: {
                "application/json": {
                    schema: RegisterStartInput
                }
            }
        }
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": { schema: RegisterStartResponse }
            }
        },
        400: { description: "Validation failed" },
        429: { description: "Too many attempts. Try later." }
    }
});

// POST /api/auth/register/confirm
registry.registerPath({
    method: "post",
    path: "/api/auth/register/confirm",
    summary: "Подтвердить регистрацию по коду",
    tags: ["Auth"],
    request: {
        body: {
            content: {
                "application/json": {
                    schema: RegisterConfirmInput
                }
            }
        }
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": { schema: RegisterConfirmResponse }
            }
        },
        400: { description: "Validation failed or invalid code" },
        429: { description: "Too many attempts. Try later." }
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

// GET /api/auth/permissions
registry.registerPath({
    method: "get",
    path: "/api/auth/permissions",
    summary: "Получить все права текущего пользователя",
    tags: ["Auth"],
    security: [{ BearerAuth: [] }],
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": { schema: PermissionOutput }
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
