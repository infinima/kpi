import { z } from "../utils/zod-openapi-init.js";
import { registry } from "../utils/openapi.js";

// ===== Схемы =====
export const EventSchema = z.object({
    id: z.coerce.number().int().positive(),
    name: z.string().min(1),
    date: z.iso.date(),
    photo: z.string().min(1),
    is_public: z.coerce.boolean(),
});
registry.register("Event", EventSchema);

export const CreateEventInput = EventSchema.omit({ id: true }).extend({
    is_public: z.coerce.boolean().default(false),
});
export const UpdateEventInput = EventSchema.partial().required({ id: true });
export const GetOneEventInput = EventSchema.pick({ id: true });

// ===== Swagger =====

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
        404: { description: "Event not found" },
    },
});

// POST /api/events
registry.registerPath({
    method: "post",
    path: "/api/events",
    summary: "Создать событие",
    tags: ["Events"],
    request: {
        body: {
            content: { "application/json": { schema: CreateEventInput } },
        },
    },
    responses: {
        200: {
            description: "Событие создано",
            content: {
                "application/json": { schema: EventSchema.pick({ id: true }) },
            },
        },
        400: { description: "Validation failed" },
    },
});

// PUT /api/events/{id}
registry.registerPath({
    method: "put",
    path: "/api/events/{id}",
    summary: "Обновить событие",
    tags: ["Events"],
    request: {
        params: GetOneEventInput,
        body: {
            content: { "application/json": { schema: UpdateEventInput.omit({ id: true }) } },
        },
    },
    responses: {
        200: { description: "OK" },
        400: { description: "No fields provided for update or validation failed" },
        404: { description: "Event not found" },
    },
});

// DELETE /api/events/{id}
registry.registerPath({
    method: "delete",
    path: "/api/events/{id}",
    summary: "Удалить событие",
    tags: ["Events"],
    request: { params: GetOneEventInput },
    responses: {
        200: { description: "OK" },
        404: { description: "Event not found" },
    },
});

export type Event = z.infer<typeof EventSchema>;
