import { z } from "../../utils/zod-openapi-init.js";
import { registry } from "../../utils/openapi.js";

// ===== Схемы =====
export const LocationSchema = z.object({
    id: z.coerce.number().int().positive(),
    event_id: z.coerce.number().int().positive(),
    name: z.string().min(1),
    address: z.string().min(1),
    created_at: z.string(),
    updated_at: z.string(),
    deleted_at: z.string().nullable(),
});
registry.register("Location", LocationSchema);

export const GetOneLocationInput = LocationSchema.pick({ id: true });
export const GetLocationsByEventInput = z.object({
    event_id: z.coerce.number().int().positive(),
});
export const CreateLocationInput = LocationSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
});
export const UpdateLocationInput = CreateLocationInput
    .partial()
export const DeleteLocationQuery = z.object({
    force: z.preprocess(v => v === "true", z.boolean()),
});



// ===== Документация =====

// GET /api/locations/event/:event_id
registry.registerPath({
    method: "get",
    path: "/api/locations/event/{event_id}",
    summary: "Получить площадки по event_id",
    tags: ["Locations"],
    request: { params: GetLocationsByEventInput },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": {
                    schema: z.array(LocationSchema),
                },
            },
        },
        400: { description: "The event is deleted" },
        404: { description: "The event does not exist" },
    },
});

// GET /api/locations/:id
registry.registerPath({
    method: "get",
    path: "/api/locations/{id}",
    summary: "Получить площадку по id",
    tags: ["Locations"],
    request: { params: GetOneLocationInput },
    responses: {
        200: {
            description: "OK",
            content: { "application/json": { schema: LocationSchema } },
        },
        400: { description: "The location is deleted" },
        404: { description: "The location does not exist" },
    },
});


// POST /api/locations
registry.registerPath({
    method: "post",
    path: "/api/locations",
    summary: "Создать площадку",
    tags: ["Locations"],
    security: [{ BearerAuth: [] }],
    request: {
        body: {
            content: { "application/json": { schema: CreateLocationInput } },
        },
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": { schema: LocationSchema.pick({ id: true }) },
            },
        },
        400: { description: "Validation failed" },
    },
});

// PATCH /api/locations/:id
registry.registerPath({
    method: "patch",
    path: "/api/locations/{id}",
    summary: "Обновить площадку",
    tags: ["Locations"],
    security: [{ BearerAuth: [] }],
    request: {
        params: GetOneLocationInput,
        body: {
            content: { "application/json": { schema: UpdateLocationInput } },
        },
    },
    responses: {
        200: { description: "OK" },
        400: { description: "The location is deleted or validation failed" },
        404: { description: "The location does not exist" },
    },
});

// DELETE /api/locations/:id
registry.registerPath({
    method: "delete",
    path: "/api/locations/{id}",
    summary: "Удалить площадку",
    tags: ["Locations"],
    security: [{ BearerAuth: [] }],
    request: {
        params: GetOneLocationInput,
        query: DeleteLocationQuery,
    },
    responses: {
        200: { description: "OK" },
        400: { description: "The location has related objects" },
        404: { description: "The location does not exist" },
    },
});

// POST /api/locations/:id/restore
registry.registerPath({
    method: "post",
    path: "/api/locations/{id}/restore",
    summary: "Восстановить площадку",
    tags: ["Locations"],
    security: [{ BearerAuth: [] }],
    request: { params: GetOneLocationInput },
    responses: {
        200: { description: "OK" },
        400: { description: "The location is not deleted" },
        404: { description: "The location does not exist" },
    },
});

export type Location = z.infer<typeof LocationSchema>;
