import { z } from "../../utils/zod-openapi-init.js";
import { registry } from "../../utils/openapi.js";

// ===== Схемы =====
export const EventSchema = z.object({
    id: z.coerce.number().int().positive(),
    name: z.string().min(1),
    date: z.iso.date(),
    documents_generator_id: z.coerce.number().int().positive(),
    created_at: z.string(),
    updated_at: z.string(),
    deleted_at: z.string().nullable(),
});
registry.register("Event", EventSchema);

export const GetOneEventInput = EventSchema.pick({ id: true });
const RegistrationLeagueSchema = z.object({
    id: z.coerce.number().int().positive(),
    location_id: z.coerce.number().int().positive(),
    name: z.string().min(1),
    status: z.string(),
    max_teams_count: z.number().int(),
    teams_count: z.number().int(),
    reserve_teams_count: z.number().int(),
    created_at: z.string(),
    updated_at: z.string(),
    deleted_at: z.string().nullable(),
});
const RegistrationLocationSchema = z.object({
    id: z.coerce.number().int().positive(),
    event_id: z.coerce.number().int().positive(),
    name: z.string().min(1),
    address: z.string().min(1),
    created_at: z.string(),
    updated_at: z.string(),
    deleted_at: z.string().nullable(),
    leagues: z.array(RegistrationLeagueSchema),
});
const RegistrationEventSchema = z.object({
    id: z.coerce.number().int().positive(),
    name: z.string().min(1),
    date: z.iso.date(),
    created_at: z.string(),
    updated_at: z.string(),
    deleted_at: z.string().nullable(),
    locations: z.array(RegistrationLocationSchema),
});
export const CreateEventInput = EventSchema
    .omit({
        id: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
        documents_generator_id: true,
    })
    .extend({
        documents_generator_id: z.coerce.number().int().positive().optional(),
        photo: z.string().regex(
            /^data:image\/(png|jpe?g|webp);base64,/i,
            "Must be base64 square image string"
        ),
    });
export const UpdateEventInput = CreateEventInput
    .partial()
export const DeleteEventQuery = z.object({
    force: z.preprocess(v => v === "true", z.boolean()),
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

// GET /api/events/registration
registry.registerPath({
    method: "get",
    path: "/api/events/registration",
    summary: "Получить лиги с открытой регистрацией, сгруппированные по событиям и площадкам",
    tags: ["Events"],
    responses: {
        200: {
            description: "OK",
            content: { "application/json": { schema: z.array(RegistrationEventSchema) } },
        },
    },
});

// GET /api/events/deleted
registry.registerPath({
    method: "get",
    path: "/api/events/deleted",
    summary: "Получить список удаленных событий",
    tags: ["Events"],
    security: [{ BearerAuth: [] }],
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
    summary: "Получить фото мероприятия",
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
            content: { "application/json": { schema: UpdateEventInput } },
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
