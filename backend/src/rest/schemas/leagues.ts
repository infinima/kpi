import { z } from "../../utils/zod-openapi-init.js";
import { registry } from "../../utils/openapi.js";

// ===== Схемы =====
export const LeagueSchema = z.object({
    id: z.coerce.number().int().positive(),
    location_id: z.coerce.number().int().positive(),
    name: z.string().min(1),
    status: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
    deleted_at: z.string().nullable(),
});
registry.register("League", LeagueSchema);

export const GetOneLeagueInput = LeagueSchema.pick({ id: true });
export const GetLeaguesByLocationInput = z.object({
    location_id: z.coerce.number().int().positive(),
});
export const FinalTableSchema = z.object({
    id: z.number(),
    name: z.string(),
    place_kvartaly: z.number().nullable(),
    place_fudzi: z.number().nullable(),
    place_sum: z.number().nullable(),
    place_final: z.number().nullable(),
    diploma: z.string().nullable(),
    special_nominations: z.array(z.string()).nullable(),
});

export const GetFinalTableOutput = z.array(FinalTableSchema);
export const CreateLeagueInput = LeagueSchema
    .omit({
        id: true,
        status: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
    })
    .extend({
        fudzi_presentation: z.string()
            .regex(/^data:application\/pdf;base64,/i)
            .optional(),
    });
export const UpdateLeagueInput = CreateLeagueInput
    .partial()
export const UpdateLeagueStatusInput = z.object({
    new_status: z.enum([
        "NOT_STARTED",
        "REGISTRATION_IN_PROGRESS",
        "REGISTRATION_ENDED",
        "KVARTALY_GAME",
        "LUNCH",
        "FUDZI_GAME",
        "FUDZI_GAME_BREAK",
        "GAMES_ENDED",
        "AWARDING_IN_PROGRESS",
        "ENDED"
    ])
});
export const DeleteLeagueQuery = z.object({
    force: z.preprocess(v => v === "true", z.boolean()),
});
export const ImportTeamsInput = z.object({
    url: z.url()
});



// ===== Документация =====

// GET /api/leagues/location/{location_id}
registry.registerPath({
    method: "get",
    path: "/api/leagues/location/{location_id}",
    summary: "Получить лиги по location_id",
    tags: ["Leagues"],
    request: {
        params: GetLeaguesByLocationInput,
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": { schema: z.array(LeagueSchema) },
            },
        },
        400: { description: "The location is deleted" },
        404: { description: "The location does not exist" },
    },
});

// GET /api/leagues/location/{location_id}/deleted
registry.registerPath({
    method: "get",
    path: "/api/leagues/location/{location_id}/deleted",
    summary: "Получить удаленные лиги по location_id",
    tags: ["Leagues"],
    security: [{ BearerAuth: [] }],
    request: {
        params: GetLeaguesByLocationInput,
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": { schema: z.array(LeagueSchema) },
            },
        },
        400: { description: "The location is deleted" },
        404: { description: "The location does not exist" },
    },
});

// GET /api/leagues/{id}
registry.registerPath({
    method: "get",
    path: "/api/leagues/{id}",
    summary: "Получить лигу по id",
    tags: ["Leagues"],
    request: {
        params: GetOneLeagueInput,
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": { schema: LeagueSchema },
            },
        },
        400: { description: "The league is deleted" },
        404: { description: "The league does not exist" },
    },
});

// GET /api/leagues/{id}/fudzi_presentation
registry.registerPath({
    method: "get",
    path: "/api/leagues/{id}/fudzi_presentation",
    summary: "Получить файл презентации лиги",
    tags: ["Leagues"],
    security: [{ BearerAuth: [] }],
    request: {
        params: GetOneLeagueInput,
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/pdf": { schema: { type: "string", format: "binary" } },
            },
        },
        400: { description: "The league is deleted" },
        404: {
            description: "The league does not exist or has no fudzi_presentation",
        },
        500: { description: "Failed to send file" },
    },
});

// GET /api/leagues/{id}/print_teams_names
registry.registerPath({
    method: "get",
    path: "/api/leagues/{id}/print_teams_names",
    summary: "Скачать PDF с табличками на столы команд",
    tags: ["Leagues"],
    security: [{ BearerAuth: [] }],
    request: {
        params: GetOneLeagueInput,
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/pdf": {
                    schema: { type: "string", format: "binary" },
                },
            },
        },
        400: { description: "The league is deleted" },
        404: { description: "The league does not exist or has no teams" },
        500: { description: "PDF generation failed" },
    },
});

registry.registerPath({
    method: "get",
    path: "/api/leagues/{id}/final-table",
    summary: "Итоговая таблица команды",
    tags: ["Leagues"],
    request: {
        params: GetOneLeagueInput,
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": { schema: GetFinalTableOutput },
            },
        },
        400: { description: "The league is deleted" },
        404: { description: "The league does not exist" },
    },
});

// POST /api/leagues
registry.registerPath({
    method: "post",
    path: "/api/leagues",
    summary: "Создать лигу",
    tags: ["Leagues"],
    security: [{ BearerAuth: [] }],
    request: {
        body: {
            content: {
                "application/json": { schema: CreateLeagueInput },
            },
        },
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": { schema: LeagueSchema.pick({ id: true }) },
            },
        },
        400: { description: "Validation failed" },
    },
});

// PATCH /api/leagues/{id}
registry.registerPath({
    method: "patch",
    path: "/api/leagues/{id}",
    summary: "Обновить лигу",
    tags: ["Leagues"],
    security: [{ BearerAuth: [] }],
    request: {
        params: GetOneLeagueInput,
        body: {
            content: {
                "application/json": { schema: UpdateLeagueInput },
            },
        },
    },
    responses: {
        200: { description: "OK" },
        400: { description: "The league is deleted or validation failed" },
        404: { description: "The league does not exist" },
    },
});

// POST /api/leagues/:id/status
registry.registerPath({
    method: "post",
    path: "/api/leagues/{id}/status",
    summary: "Изменить статус лиги",
    tags: ["Leagues"],
    security: [{ BearerAuth: [] }],
    request: {
        params: GetOneLeagueInput,
        body: {
            content: {
                "application/json": {
                    schema: UpdateLeagueStatusInput
                }
            }
        }
    },
    responses: {
        200: { description: "OK" },
        400: { description: "Invalid transition or validation error" },
        404: { description: "League does not exist" },
        500: { description: "Side-effect logic failed" }
    }
});

// DELETE /api/leagues/{id}
registry.registerPath({
    method: "delete",
    path: "/api/leagues/{id}",
    summary: "Удалить лигу",
    tags: ["Leagues"],
    security: [{ BearerAuth: [] }],
    request: {
        params: GetOneLeagueInput,
        query: DeleteLeagueQuery,
    },
    responses: {
        200: { description: "OK" },
        400: {
            description:
                "The league is deleted or has related objects (pass force=true to delete anyway)",
        },
        404: { description: "The league does not exist" },
    },
});

// POST /api/leagues/{id}/restore
registry.registerPath({
    method: "post",
    path: "/api/leagues/{id}/restore",
    summary: "Восстановить удалённую лигу",
    tags: ["Leagues"],
    security: [{ BearerAuth: [] }],
    request: {
        params: GetOneLeagueInput,
    },
    responses: {
        200: { description: "OK" },
        400: { description: "The league is not deleted" },
        404: { description: "The league does not exist" },
    },
});

// POST /api/leagues/{id}/import-teams
registry.registerPath({
    method: "post",
    path: "/api/leagues/{id}/import-teams",
    summary: "Импорт команд по URL",
    tags: ["Leagues"],
    security: [{ BearerAuth: [] }],
    request: {
        params: GetOneLeagueInput,
        body: {
            content: {
                "application/json": { schema: ImportTeamsInput }
            }
        }
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": {
                    schema: z.object({
                        success: z.boolean(),
                        created: z.number().nullish(),
                        updated: z.number().nullish()
                    })
                }
            }
        },
        400: { description: "Invalid URL or invalid data" }
    }
});

export type League = z.infer<typeof LeagueSchema>;
