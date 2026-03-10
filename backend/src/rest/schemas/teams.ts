import { z } from "../../utils/zod-openapi-init.js";
import { registry } from "../../utils/openapi.js";

export const MembersSchema = z.array(z.string().min(1)).length(4);

const KvartalQuestionSchema = z.object({
    correct: z.number().int().min(0),
    incorrect: z.number().int().min(0),
});
const KvartalSchema = z.object({
    finished: z.number().int().min(0),
    questions: z.array(KvartalQuestionSchema).length(4),
});
export const AnswersKvartalySchema = z.array(KvartalSchema).length(4);

const FudziQuestionSchema = z.object({
    status: z.enum(["correct", "incorrect", "not_submitted"]),
});
export const AnswersFudziSchema = z.object({
    has_card: z.boolean(),
    questions: z.array(FudziQuestionSchema).length(16),
});
export const TeamSchema = z.object({
    id: z.coerce.number().int().positive(),
    league_id: z.coerce.number().int().positive(),
    owner_user_id: z.coerce.number().int().positive().nullable(),
    name: z.string().min(1),
    members: MembersSchema,
    appreciations: z.array(z.string()),
    school: z.string().min(1),
    region: z.string().min(1),
    meals_count: z.number().int().min(0).max(5),
    maintainer_full_name: z.string().min(1).nullable(),
    maintainer_activity: z.enum([
        "семинар учителей математики",
        "экскурсия по Технопарку (платно)",
        "мастер-класс в Технопарке (платно)",
        "заниматься своими делами"
    ]).nullable(),
    status: z.enum(["IN_RESERVE", "ON_CHECKING", "ACCEPTED", "PAID"]),

    answers_kvartaly: AnswersKvartalySchema,
    penalty_kvartaly: z.number().int(),
    place_kvartaly: z.number().int().nullable(),

    answers_fudzi: AnswersFudziSchema,
    penalty_fudzi: z.number().int(),
    place_fudzi: z.number().int().nullable(),

    place_final: z.number().int().nullable(),

    diploma: z.enum(["FIRST_DEGREE","SECOND_DEGREE","THIRD_DEGREE","PARTICIPANT"]).nullable(),
    special_nominations: z.array(z.string()),

    created_at: z.string(),
    updated_at: z.string(),
    deleted_at: z.string().nullable(),
});
registry.register("Team", TeamSchema);

export const GetOneTeamInput = TeamSchema.pick({ id: true });
export const GetTeamsByLeagueInput = z.object({
    league_id: z.coerce.number().int().positive(),
});
export const GetTeamsByEventInput = z.object({
    event_id: z.coerce.number().int().positive(),
});
export const GetTeamsByLocationInput = z.object({
    location_id: z.coerce.number().int().positive(),
});
export const CreateTeamInput = TeamSchema
    .omit({
        id: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
        owner_user_id: true,
        status: true,
        answers_kvartaly: true,
        penalty_kvartaly: true,
        place_kvartaly: true,
        answers_fudzi: true,
        penalty_fudzi: true,
        place_fudzi: true,
        place_final: true,
        special_nominations: true,
        diploma: true,
    })
    .extend({
        members: MembersSchema,
        owner_user_id: z.coerce.number().int().positive().nullable().optional(),
        is_reserve: z.boolean().optional(),
    });
export const UpdateTeamInput = CreateTeamInput
    .partial()
    .extend({
        diploma: TeamSchema.shape.diploma.optional(),
        special_nominations: TeamSchema.shape.special_nominations.optional(),
        status: TeamSchema.shape.status.optional(),
        owner_user_id: z.coerce.number().int().positive().nullable().optional(),
        appreciations: TeamSchema.shape.appreciations.optional(),
    });



// ===== Документация =====

// GET /api/teams/league/:league_id
registry.registerPath({
    method: "get",
    path: "/api/teams/league/{league_id}",
    summary: "Получить команды по league_id",
    tags: ["Teams"],
    security: [{ BearerAuth: [] }],
    request: {
        params: GetTeamsByLeagueInput,
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": { schema: z.array(TeamSchema) },
            },
        },
        400: { description: "The league is deleted" },
        404: { description: "The league does not exist" },
    },
});

// GET /api/teams/league/:event_id/deleted
registry.registerPath({
    method: "get",
    path: "/api/teams/league/{league_id}/deleted",
    summary: "Получить удаленные команды по league_id",
    tags: ["Teams"],
    security: [{ BearerAuth: [] }],
    request: {
        params: GetTeamsByLeagueInput,
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": { schema: z.array(TeamSchema) },
            },
        },
        400: { description: "The league is deleted" },
        404: { description: "The league does not exist" },
    },
});

// GET /api/teams/location/:location_id
registry.registerPath({
    method: "get",
    path: "/api/teams/location/{location_id}",
    summary: "Получить команды по location_id",
    tags: ["Teams"],
    security: [{ BearerAuth: [] }],
    request: {
        params: GetTeamsByLocationInput,
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": { schema: z.array(TeamSchema) },
            },
        },
        400: { description: "The location is deleted" },
        404: { description: "The location does not exist" },
    },
});

// GET /api/teams/location/:location_id/deleted
registry.registerPath({
    method: "get",
    path: "/api/teams/location/{location_id}/deleted",
    summary: "Получить удаленные команды по location_id",
    tags: ["Teams"],
    security: [{ BearerAuth: [] }],
    request: {
        params: GetTeamsByLocationInput,
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": { schema: z.array(TeamSchema) },
            },
        },
        400: { description: "The location is deleted" },
        404: { description: "The location does not exist" },
    },
});

// GET /api/teams/event/:event_id
registry.registerPath({
    method: "get",
    path: "/api/teams/event/{event_id}",
    summary: "Получить команды по event_id",
    tags: ["Teams"],
    security: [{ BearerAuth: [] }],
    request: {
        params: GetTeamsByEventInput,
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": { schema: z.array(TeamSchema) },
            },
        },
        400: { description: "The event is deleted" },
        404: { description: "The event does not exist" },
    },
});

// GET /api/teams/event/:event_id/deleted
registry.registerPath({
    method: "get",
    path: "/api/teams/event/{event_id}/deleted",
    summary: "Получить удаленные команды по event_id",
    tags: ["Teams"],
    security: [{ BearerAuth: [] }],
    request: {
        params: GetTeamsByEventInput,
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": { schema: z.array(TeamSchema) },
            },
        },
        400: { description: "The event is deleted" },
        404: { description: "The event does not exist" },
    },
});

// GET /api/teams/:id
registry.registerPath({
    method: "get",
    path: "/api/teams/{id}",
    summary: "Получить команду по id",
    tags: ["Teams"],
    security: [{ BearerAuth: [] }],
    request: {
        params: GetOneTeamInput,
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": { schema: TeamSchema },
            },
        },
        400: { description: "The team is deleted" },
        404: { description: "The team does not exist" },
    },
});

// POST /api/teams
registry.registerPath({
    method: "post",
    path: "/api/teams",
    summary: "Создать команду",
    tags: ["Teams"],
    security: [{ BearerAuth: [] }],
    request: {
        body: {
            content: {
                "application/json": { schema: CreateTeamInput },
            },
        },
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": {
                    schema: TeamSchema.pick({ id: true }),
                },
            },
        },
        400: { description: "Validation failed" },
    },
});

// PATCH /api/teams/:id
registry.registerPath({
    method: "patch",
    path: "/api/teams/{id}",
    summary: "Обновить команду",
    tags: ["Teams"],
    security: [{ BearerAuth: [] }],
    request: {
        params: GetOneTeamInput,
        body: {
            content: {
                "application/json": { schema: UpdateTeamInput },
            },
        },
    },
    responses: {
        200: { description: "OK" },
        400: { description: "The team is deleted or validation failed" },
        404: { description: "The team does not exist" },
    },
});

// DELETE /api/teams/:id
registry.registerPath({
    method: "delete",
    path: "/api/teams/{id}",
    summary: "Удалить команду",
    tags: ["Teams"],
    security: [{ BearerAuth: [] }],
    request: {
        params: GetOneTeamInput,
    },
    responses: {
        200: { description: "OK" },
        400: { description: "The team is already deleted" },
        404: { description: "The team does not exist" },
    },
});

// POST /api/teams/:id/restore
registry.registerPath({
    method: "post",
    path: "/api/teams/{id}/restore",
    summary: "Восстановить команду",
    tags: ["Teams"],
    security: [{ BearerAuth: [] }],
    request: {
        params: GetOneTeamInput,
    },
    responses: {
        200: { description: "OK" },
        400: { description: "The team is not deleted" },
        404: { description: "The team does not exist" },
    },
});

export type Team = z.infer<typeof TeamSchema>;
