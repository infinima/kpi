import { z } from "../../utils/zod-openapi-init.js";
import { registry } from "../../utils/openapi.js";

export const PermissionObjectEnum = z.enum([
    "events",
    "locations",
    "leagues",
    "teams",
    "users"
]);
export const PermissionScopeEnum = z.enum([
    "events",
    "locations",
    "leagues",
]);
export const PermissionActionsEnum = z.enum([
    "get",
    "create",
    "update",
    "delete",
    "restore",
    "access_history",
    "print_documents"
]);

export const PermissionSchema = z.object({
    id: z.number().int(),
    user_id: z.number().int(),
    object: PermissionObjectEnum,
    permission: z.array(PermissionActionsEnum),
    object_id: z.number().int().nullable(),
    scope_object: PermissionScopeEnum.nullable(),
    scope_object_id: z.number().int().nullable(),
});
registry.register("Permission", PermissionSchema);

export const CreatePermissionInput = PermissionSchema.omit({
    id: true
});
export const UpdatePermissionInput = CreatePermissionInput.partial();
export const GetPermissionsTargetInput = z.object({
    object: PermissionObjectEnum,
    object_id: z.coerce.number().int().optional(),
});



// ===== Документация =====

// GET /api/permissions/{object}/{object_id}
registry.registerPath({
    method: "get",
    path: "/api/permissions/{object}/{object_id}",
    summary: "Получить список permissions по объекту и optional object_id",
    tags: ["Permissions"],
    security: [{ BearerAuth: [] }],
    request: {
        params: GetPermissionsTargetInput,
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": { schema: z.array(PermissionSchema) },
            },
        },
    },
});

// GET /api/permissions/{object}
registry.registerPath({
    method: "get",
    path: "/api/permissions/{object}",
    summary: "Получить permissions по объекту на верхнем уровне (без object_id)",
    tags: ["Permissions"],
    security: [{ BearerAuth: [] }],
    request: {
        params: GetPermissionsTargetInput.omit({ object_id: true }),
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": { schema: z.array(PermissionSchema) },
            },
        },
    },
});

// POST /api/permissions
registry.registerPath({
    method: "post",
    path: "/api/permissions",
    summary: "Создать permission",
    tags: ["Permissions"],
    security: [{ BearerAuth: [] }],
    request: {
        body: {
            content: {
                "application/json": { schema: CreatePermissionInput },
            },
        },
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": {
                    schema: PermissionSchema.pick({ id: true }),
                },
            },
        },
        400: { description: "Validation failed or invalid scope rules" },
    },
});

// PATCH /api/permissions/{id}
registry.registerPath({
    method: "patch",
    path: "/api/permissions/{id}",
    summary: "Обновить permission",
    tags: ["Permissions"],
    security: [{ BearerAuth: [] }],
    request: {
        params: z.object({
            id: z.coerce.number().int().positive(),
        }),
        body: {
            content: {
                "application/json": { schema: UpdatePermissionInput },
            },
        },
    },
    responses: {
        200: { description: "OK" },
        400: { description: "Validation failed" },
        404: { description: "Permission does not exist" },
    },
});

// DELETE /api/permissions/{id}
registry.registerPath({
    method: "delete",
    path: "/api/permissions/{id}",
    summary: "Удалить permission",
    tags: ["Permissions"],
    security: [{ BearerAuth: [] }],
    request: {
        params: z.object({
            id: z.coerce.number().int().positive(),
        }),
    },
    responses: {
        200: { description: "OK" },
        404: { description: "Permission does not exist" },
    },
});
