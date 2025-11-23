import { z } from "../utils/zod-openapi-init.js";
import { registry } from "../utils/openapi.js";

// ===== Схемы =====
const CoachSchema = z.object({
    full_name: z.string().min(1),
    email: z.email(),
});
const ParticipantSchema = z.object({
    full_name: z.string().min(1),
    school: z.string().min(1),
});
export const MembersSchema = z.object({
    coach: CoachSchema,
    participants: z.array(ParticipantSchema).min(1),
});

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
    score: z.number().int().min(0),
});
export const AnswersFudziSchema = z.object({
    card: z.boolean(),
    questions: z.array(FudziQuestionSchema).length(16),
});

export const TeamSchema = z.object({
    id: z.coerce.number().int().positive(),
    league_id: z.coerce.number().int().positive(),
    name: z.string().min(1),
    members: MembersSchema,
    answers_kvartaly: AnswersKvartalySchema,
    answers_fudzi: AnswersFudziSchema,
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
export const CreateTeamInput = TeamSchema
    .omit({
        id: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
        answers_kvartaly: true,
        answers_fudzi: true,
        special_nominations: true,
        diploma: true,
    })
    .extend({
        members: MembersSchema,
    });

export const UpdateTeamInput = CreateTeamInput.partial();



// ===== Документация =====

// GET /api/teams/league/:event_id
registry.registerPath({
    method: "get",
    path: "/api/teams/league/{league_id}",
    summary: "Получить команды по league_id",
    tags: ["Teams"],
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

// GET /api/teams/:id
registry.registerPath({
    method: "get",
    path: "/api/teams/{id}",
    summary: "Получить команду по id",
    tags: ["Teams"],
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
