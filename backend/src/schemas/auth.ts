import { z } from "../utils/zod-openapi-init.js";
import { registry } from "../utils/openapi.js";

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
            description: "Successful login: returns Bearer token",
            content: {
                "application/json": { schema: LoginResponse }
            }
        },
        400: { description: "Validation failed" },
        401: { description: "Invalid credentials" }
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
            description: "Session deactivated",
            content: {
                "application/json": { schema: LogoutResponse }
            }
        },
        400: { description: "Session already deactivated" }
    }
});
