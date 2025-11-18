import { z } from "../utils/zod-openapi-init.js";
import { registry } from "../utils/openapi.js";

// ===== Схемы =====
export const EventSchema = z.object({
    id: z.coerce.number().int().positive(),
    name: z.string().min(1),
    date: z.iso.date(),
    created_at: z.string(),
    updated_at: z.string(),
    deleted_at: z.string().nullable(),
});
registry.register("Event", EventSchema);

export const GetOneEventInput = EventSchema.pick({ id: true });
export const CreateEventInput = z.object({
    name: z.string().min(1),
    date: z.iso.date(),
    photo: z.string().regex(
        /^data:image\/(png|jpe?g|webp);base64,/i,
        "Must be base64 image string"
    ),
});
export const UpdateEventInput = z.object({
    id: z.coerce.number().int().positive(),
    name: z.string().min(1).optional(),
    date: z.iso.date().optional(),
    photo: z.string()
        .regex(/^data:image\/(png|jpe?g|webp);base64,/i, "Must be base64 image string")
        .optional(),
});
export const DeleteEventQuery = z.object({
    force: z.preprocess(v => v === "true", z.boolean())
});



// ===== Документация =====

// GET /api/events
registry.registerPath({
    method: "get",
    path: "/api/events",
    summary: "Получить список событий",
    tags: ["Events"],
    responses: {
        200: {
            description: "OK",
            content: { "application/json": { schema: z.array(EventSchema) } },
        },
    },
});

// GET /api/events/{id}
registry.registerPath({
    method: "get",
    path: "/api/events/{id}",
    summary: "Получить событие по id",
    tags: ["Events"],
    request: {
        params: GetOneEventInput,
    },
    responses: {
        200: {
            description: "OK",
            content: { "application/json": { schema: EventSchema } },
        },
        400: { description: "The event is deleted" },
        404: { description: "The event does not exist" },
    },
});

// GET /api/events/{id}/photo
registry.registerPath({
    method: "get",
    path: "/api/events/{id}/photo",
    summary: "Получить фото события",
    tags: ["Events"],
    request: {
        params: GetOneEventInput,
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "image/webp": { schema: { type: "string", format: "binary" } },
            },
        },
        400: { description: "The event is deleted" },
        404: { description: "The event does not exist" },
        500: { description: "Failed to send file" },
    },
});

// POST /api/events
registry.registerPath({
    method: "post",
    path: "/api/events",
    summary: "Создать событие",
    tags: ["Events"],
    security: [{ BearerAuth: [] }],
    request: {
        body: {
            content: { "application/json": { schema: CreateEventInput } },
        },
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": { schema: EventSchema.pick({ id: true }) },
            },
        },
        400: { description: "Validation failed" },
    },
});

// PATCH /api/events/{id}
registry.registerPath({
    method: "patch",
    path: "/api/events/{id}",
    summary: "Обновить событие",
    tags: ["Events"],
    security: [{ BearerAuth: [] }],
    request: {
        params: GetOneEventInput,
        body: {
            content: { "application/json": { schema: UpdateEventInput.omit({ id: true }) } },
        },
    },
    responses: {
        200: { description: "OK" },
        400: { description: "The event is deleted or validation failed" },
        404: { description: "The event does not exist" },
    },
});

// DELETE /api/events/{id}
registry.registerPath({
    method: "delete",
    path: "/api/events/{id}",
    summary: "Удалить событие",
    tags: ["Events"],
    security: [{ BearerAuth: [] }],
    request: {
        params: GetOneEventInput,
        query: DeleteEventQuery
    },
    responses: {
        200: { description: "OK" },
        400: {
            description: "The event is deleted or has related objects (pass force=true to delete anyway)."
        },
        404: { description: "The event does not exist" }
    }
});

// POST /api/events/{id}/restore
registry.registerPath({
    method: "post",
    path: "/api/events/{id}/restore",
    summary: "Восстановить удалённое событие",
    tags: ["Events"],
    security: [{ BearerAuth: [] }],
    request: {
        params: GetOneEventInput,
    },
    responses: {
        200: { description: "OK" },
        400: { description: "The event is not deleted" },
        404: { description: "The event does not exist" },
    },
});

export type Event = z.infer<typeof EventSchema>;
