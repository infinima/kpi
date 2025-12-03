import { z } from "../../utils/zod-openapi-init.js";
import { registry } from "../../utils/openapi.js";

// ===== Схемы =====
export const PhotoSchema = z.object({
    id: z.coerce.number().int().positive(),
    location_id: z.coerce.number().int().positive(),
    created_at: z.string(),
    deleted_at: z.string().nullable(),
});
registry.register("Photo", PhotoSchema);

export const GetPhotosByLocationInput = z.object({
    location_id: z.coerce.number().int().positive(),
});
export const GetPhotoInput = z.object({
    id: z.coerce.number().int().positive(),
});
export const CreatePhotoInput = z.object({
    location_id: z.coerce.number().int().positive(),
    file: z.string().regex(
        /^data:image\/(png|jpe?g|webp);base64,/i,
        "Must be base64 square image string"
    )
});



// ===== Документация =====

// GET /api/photos/location/{location_id}
registry.registerPath({
    method: "get",
    path: "/api/photos/location/{location_id}",
    summary: "Получить фотографии по location_id",
    tags: ["Photos"],
    request: {
        params: GetPhotosByLocationInput
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": {
                    schema: z.array(PhotoSchema),
                },
            },
        },
        400: { description: "The location is deleted" },
        404: { description: "The location does not exist" },
    },
});

// GET /api/photos/location/{location_id}/deleted
registry.registerPath({
    method: "get",
    path: "/api/photos/location/{location_id}/deleted",
    summary: "Получить удаленные фотографии по location_id",
    tags: ["Photos"],
    request: {
        params: GetPhotosByLocationInput
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": {
                    schema: z.array(PhotoSchema),
                },
            },
        },
        400: { description: "The location is deleted" },
        404: { description: "The location does not exist" },
    },
});

// GET /api/photos/{id}
registry.registerPath({
    method: "get",
    path: "/api/photos/{id}",
    summary: "Получить информацию о фотографии",
    tags: ["Photos"],
    request: {
        params: GetPhotoInput
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": {
                    schema: PhotoSchema,
                },
            },
        },
        404: { description: "The photo does not exist" },
    },
});

// GET /api/photos/{id}/file
registry.registerPath({
    method: "get",
    path: "/api/photos/{id}/file",
    summary: "Получить файл фотографии",
    tags: ["Photos"],
    request: {
        params: GetPhotoInput
    },
    responses: {
        200: {
            description: "File",
            content: {
                "image/*": { schema: { type: "string", format: "binary" } },
            },
        },
        404: { description: "The photo does not exist" },
        500: { description: "Failed to send file" },
    },
});

// POST /api/photos
registry.registerPath({
    method: "post",
    path: "/api/photos",
    summary: "Загрузить фотографию",
    tags: ["Photos"],
    security: [{ BearerAuth: [] }],
    request: {
        body: {
            content: {
                "application/json": {
                    schema: CreatePhotoInput
                }
            }
        }
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": {
                    schema: z.object({
                        id: z.number(),
                        file: z.string()
                    })
                }
            }
        },
        400: { description: "Invalid base64 or invalid format" },
        500: { description: "Saving error or conversion error" }
    }
});

// DELETE /api/photos/:id
registry.registerPath({
    method: "delete",
    path: "/api/photos/{id}",
    summary: "Удалить фотографию",
    tags: ["Photos"],
    security: [{ BearerAuth: [] }],
    request: {
        params: GetPhotoInput
    },
    responses: {
        200: { description: "OK" },
        404: { description: "The photo does not exist" },
    },
});

// POST /api/photos/{id}/restore
registry.registerPath({
    method: "post",
    path: "/api/photos/{id}/restore",
    summary: "Восстановить удалённую фотографию",
    tags: ["Photos"],
    security: [{ BearerAuth: [] }],
    request: {
        params: GetPhotoInput,
    },
    responses: {
        200: { description: "OK" },
        400: { description: "The photo is not deleted" },
        404: { description: "The photo does not exist" },
    },
});
