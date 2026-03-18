import express from "express";
import { validate } from "../middlewares/validate.js";
import { query } from "../../db/pool.js";
import { checkNotDeleted, checkParentNotDeleted } from "../middlewares/check-not-deleted.js";
import { checkPermission, getScopeChain } from "../middlewares/check-permission.js";
import { authRequired } from "../middlewares/auth-required.js";
import { generateAppreciation } from "../../utils/generate-appreciation.js";
import { generateDiploma } from "../../utils/generate-diploma.js";
import { generateSpecialNominations } from "../../utils/generate-special-nominations.js";
import { requestPaymentInfo } from "../../utils/payment.js";
import {
    loadTeamEmailContext,
    sendTeamAcceptedEmail,
    sendTeamMovedToReserveEmail,
    sendTeamPaymentConfirmedEmail,
} from "../../utils/team-email.js";

import {
    GetTeamsByLeagueInput,
    GetTeamsByEventInput,
    GetTeamsByLocationInput,
    GetOneTeamInput,
    CreateTeamInput,
    UpdateTeamInput
} from "../schemas/teams.js";

export const teamsRouter = express.Router();

// GET /api/teams/my
teamsRouter.get(
    "/my",
    authRequired,
    async (req, res) => {
        const userId = (req as any).user_id;

        const rows = await query(
            `SELECT t.id, t.league_id, l.name AS league_name,
                    t.owner_user_id,
                    u.email AS owner_email,
                    u.phone_number AS owner_phone_number,
                    CONCAT_WS(' ', u.last_name, u.first_name, u.patronymic) AS owner_full_name,
                    t.name, t.members, t.appreciations,
                    t.school, t.region, t.meals_count, t.maintainer_full_name, t.maintainer_activity,
                    t.status,
                    t.payment_link,
                    t.answers_kvartaly, t.answers_fudzi,
                    t.diploma, t.special_nominations,
                    t.created_at, t.updated_at, t.deleted_at,
                    CASE
                        WHEN l.status IN ('REGISTRATION_IN_PROGRESS', 'REGISTRATION_ENDED') THEN 1
                        ELSE 0
                    END AS owner_can_edit
             FROM teams t
                      LEFT JOIN leagues l ON l.id = t.league_id
                      LEFT JOIN users u ON u.id = t.owner_user_id
             WHERE t.owner_user_id = ? AND t.deleted_at IS NULL
             ORDER BY ID DESC`,
            [userId],
            userId
        );

        res.json(rows);
    }
);

// GET /api/teams/league/:league_id
teamsRouter.get(
    "/league/:league_id",
    validate(GetTeamsByLeagueInput, "params"),
    checkParentNotDeleted("team", "league_id"),
    checkPermission("teams", "get"),
    async (req, res) => {
        const { league_id } = (req as any).validated.params;

        const rows = await query(
            `SELECT t.id, t.league_id, l.name AS league_name,
                    t.owner_user_id,
                    u.email AS owner_email,
                    u.phone_number AS owner_phone_number,
                    CONCAT_WS(' ', u.last_name, u.first_name, u.patronymic) AS owner_full_name,
                    t.name, t.members, t.appreciations,
                    t.school, t.region, t.meals_count, t.maintainer_full_name, t.maintainer_activity,
                    t.status,
                    t.payment_link,
                    t.answers_kvartaly, t.answers_fudzi,
                    t.diploma, t.special_nominations,
                    t.created_at, t.updated_at, t.deleted_at
             FROM teams t
                      LEFT JOIN leagues l ON l.id = t.league_id
                      LEFT JOIN users u ON u.id = t.owner_user_id
             WHERE t.league_id = ? AND t.deleted_at IS NULL
             ORDER BY ID DESC`,
            [league_id], (req as any).user_id
        );

        res.json(rows);
    }
);

// GET /api/teams/league/:league_id/deleted
teamsRouter.get(
    "/league/:league_id/deleted",
    validate(GetTeamsByLeagueInput, "params"),
    checkParentNotDeleted("team", "league_id"),
    checkPermission("teams", "restore"),
    async (req, res) => {
        const { league_id } = (req as any).validated.params;

        const rows = await query(
            `SELECT t.id, t.league_id, l.name AS league_name,
                    t.owner_user_id,
                    u.email AS owner_email,
                    u.phone_number AS owner_phone_number,
                    CONCAT_WS(' ', u.last_name, u.first_name, u.patronymic) AS owner_full_name,
                    t.name, t.members, t.appreciations,
                    t.school, t.region, t.meals_count, t.maintainer_full_name, t.maintainer_activity,
                    t.status,
                    t.payment_link,
                    t.answers_kvartaly, t.answers_fudzi,
                    t.diploma, t.special_nominations,
                    t.created_at, t.updated_at, t.deleted_at
             FROM teams t
                      LEFT JOIN leagues l ON l.id = t.league_id
                      LEFT JOIN users u ON u.id = t.owner_user_id
             WHERE t.league_id = ? AND t.deleted_at IS NOT NULL
             ORDER BY ID DESC`,
            [league_id], (req as any).user_id
        );

        res.json(rows);
    }
);

// GET /api/teams/location/:location_id
teamsRouter.get(
    "/location/:location_id",
    validate(GetTeamsByLocationInput, "params"),
    checkParentNotDeleted("league", "location_id"),
    checkPermission("teams", "get"),
    async (req, res) => {
        const { location_id } = (req as any).validated.params;

        const rows = await query(
            `SELECT t.id, t.league_id, l.name AS league_name,
                    t.owner_user_id,
                    u.email AS owner_email,
                    u.phone_number AS owner_phone_number,
                    CONCAT_WS(' ', u.last_name, u.first_name, u.patronymic) AS owner_full_name,
                    t.name, t.members, t.appreciations,
                    t.school, t.region, t.meals_count, t.maintainer_full_name, t.maintainer_activity,
                    t.status,
                    t.payment_link,
                    t.answers_kvartaly, t.answers_fudzi,
                    t.diploma, t.special_nominations,
                    t.created_at, t.updated_at, t.deleted_at
             FROM teams t
                      JOIN leagues l ON l.id = t.league_id
                      LEFT JOIN users u ON u.id = t.owner_user_id
             WHERE l.location_id = ?
               AND t.deleted_at IS NULL
               AND l.deleted_at IS NULL
             ORDER BY ID DESC`,
            [location_id], (req as any).user_id
        );

        res.json(rows);
    }
);

// GET /api/teams/location/:location_id/deleted
teamsRouter.get(
    "/location/:location_id/deleted",
    validate(GetTeamsByLocationInput, "params"),
    checkParentNotDeleted("league", "location_id"),
    checkPermission("teams", "get"),
    async (req, res) => {
        const { location_id } = (req as any).validated.params;

        const rows = await query(
            `SELECT t.id, t.league_id, l.name AS league_name,
                    t.owner_user_id,
                    u.email AS owner_email,
                    u.phone_number AS owner_phone_number,
                    CONCAT_WS(' ', u.last_name, u.first_name, u.patronymic) AS owner_full_name,
                    t.name, t.members, t.appreciations,
                    t.school, t.region, t.meals_count, t.maintainer_full_name, t.maintainer_activity,
                    t.status,
                    t.payment_link,
                    t.answers_kvartaly, t.answers_fudzi,
                    t.diploma, t.special_nominations,
                    t.created_at, t.updated_at, t.deleted_at
             FROM teams t
                      JOIN leagues l ON l.id = t.league_id
                      LEFT JOIN users u ON u.id = t.owner_user_id
             WHERE l.location_id = ?
               AND t.deleted_at IS NOT NULL
               AND l.deleted_at IS NULL
             ORDER BY ID DESC`,
            [location_id], (req as any).user_id
        );

        res.json(rows);
    }
);

// GET /api/teams/event/:event_id
teamsRouter.get(
    "/event/:event_id",
    validate(GetTeamsByEventInput, "params"),
    checkParentNotDeleted("location", "event_id"),
    checkPermission("teams", "get"),
    async (req, res) => {
        const { event_id } = (req as any).validated.params;

        const rows = await query(
            `SELECT t.id, t.league_id, l.name AS league_name,
                    t.owner_user_id,
                    u.email AS owner_email,
                    u.phone_number AS owner_phone_number,
                    CONCAT_WS(' ', u.last_name, u.first_name, u.patronymic) AS owner_full_name,
                    t.name, t.members, t.appreciations,
                    t.school, t.region, t.meals_count, t.maintainer_full_name, t.maintainer_activity,
                    t.status,
                    t.payment_link,
                    t.answers_kvartaly, t.answers_fudzi,
                    t.diploma, t.special_nominations,
                    t.created_at, t.updated_at, t.deleted_at
             FROM teams t
                      JOIN leagues l ON l.id = t.league_id
                      JOIN locations lo ON lo.id = l.location_id
                      LEFT JOIN users u ON u.id = t.owner_user_id
             WHERE lo.event_id = ?
               AND t.deleted_at IS NULL
               AND l.deleted_at IS NULL
               AND lo.deleted_at IS NULL
             ORDER BY ID DESC`,
            [event_id], (req as any).user_id
        );

        res.json(rows);
    }
);

// GET /api/teams/event/:event_id/deleted
teamsRouter.get(
    "/event/:event_id/deleted",
    validate(GetTeamsByEventInput, "params"),
    checkParentNotDeleted("location", "event_id"),
    checkPermission("teams", "get"),
    async (req, res) => {
        const { event_id } = (req as any).validated.params;

        const rows = await query(
            `SELECT t.id, t.league_id, l.name AS league_name,
                    t.owner_user_id,
                    u.email AS owner_email,
                    u.phone_number AS owner_phone_number,
                    CONCAT_WS(' ', u.last_name, u.first_name, u.patronymic) AS owner_full_name,
                    t.name, t.members, t.appreciations,
                    t.school, t.region, t.meals_count, t.maintainer_full_name, t.maintainer_activity,
                    t.status,
                    t.payment_link,
                    t.answers_kvartaly, t.answers_fudzi,
                    t.diploma, t.special_nominations,
                    t.created_at, t.updated_at, t.deleted_at
             FROM teams t
                      JOIN leagues l ON l.id = t.league_id
                      JOIN locations lo ON lo.id = l.location_id
                      LEFT JOIN users u ON u.id = t.owner_user_id
             WHERE lo.event_id = ?
               AND t.deleted_at IS NOT NULL
               AND l.deleted_at IS NULL
               AND lo.deleted_at IS NULL
             ORDER BY ID DESC`,
            [event_id], (req as any).user_id
        );

        res.json(rows);
    }
);

// GET /api/teams/:id
teamsRouter.get(
    "/:id",
    validate(GetOneTeamInput, "params"),
    checkNotDeleted("team"),
    checkPermission("teams", "get"),
    async (req, res) => {
        const { id } = (req as any).validated.params;

        const [row] = await query(
            `SELECT t.id, t.league_id, l.name AS league_name,
                    t.owner_user_id,
                    u.email AS owner_email,
                    u.phone_number AS owner_phone_number,
                    CONCAT_WS(' ', u.last_name, u.first_name, u.patronymic) AS owner_full_name,
                    t.name, t.members, t.appreciations,
                    t.school, t.region, t.meals_count, t.maintainer_full_name, t.maintainer_activity,
                    t.status,
                    t.payment_link,
                    t.answers_kvartaly, t.answers_fudzi,
                    t.diploma, t.special_nominations,
                    t.created_at, t.updated_at, t.deleted_at
             FROM teams t
                      LEFT JOIN leagues l ON l.id = t.league_id
                      LEFT JOIN users u ON u.id = t.owner_user_id
             WHERE t.id = ?`,
            [id], (req as any).user_id
        );

        res.json(row);
    }
);

// GET /api/teams/:id/appreciation
teamsRouter.get(
    "/:id/appreciation",
    validate(GetOneTeamInput, "params"),
    checkNotDeleted("team"),
    checkPermission("teams", "get"),
    async (req, res) => {
        const { id } = (req as any).validated.params;

        const [row] = await query(
            `SELECT
                 t.name,
                 t.appreciations,
                 e.name AS event_name,
                 YEAR(e.date) AS event_year
             FROM teams t
                      JOIN leagues l ON l.id = t.league_id
                      JOIN locations lo ON lo.id = l.location_id
                      JOIN events e ON e.id = lo.event_id
             WHERE t.id = ?
               AND t.deleted_at IS NULL`,
            [id],
            (req as any).user_id
        );

        if (!row) {
            return res.status(404).json({
                error: {
                    code: "TEAM_NOT_FOUND",
                    message: "Team does not exist"
                }
            });
        }

        const appreciations = row.appreciations;
        const eventName = row.event_name;
        const eventYear = String(row.event_year);

        try {
            const pdf = await generateAppreciation(
                appreciations,
                eventName,
                eventYear
            );

            const safeName = row.name
                .trim()
                .replace(/\s+/g, "_")
                .replace(/[^a-zA-Zа-яА-Я0-9_]/g, "_");

            const fileName = `${safeName}_благодарность.pdf`;
            const encoded = encodeURIComponent(fileName);

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `inline; filename="${encoded}"; filename*=UTF-8''${encoded}`
            );

            res.send(pdf);
        } catch (e) {
            console.error(e);
            res.status(500).json({
                error: {
                    code: "PDF_GENERATION_FAILED",
                    message: String(e)
                }
            });
        }
    }
);

// GET /api/teams/:id/diploma
teamsRouter.get(
    "/:id/diploma",
    validate(GetOneTeamInput, "params"),
    checkNotDeleted("team"),
    checkPermission("teams", "get"),
    async (req, res) => {
        const { id } = (req as any).validated.params;

        const [row] = await query(
            `SELECT
                 t.name AS team_name,
                 t.members,
                 t.diploma,
                 e.name AS event_name,
                 YEAR(e.date) AS event_year,
                 CONCAT_WS(' ', u.last_name, u.first_name, u.patronymic) AS coach_full_name
             FROM teams t
                      JOIN leagues l ON l.id = t.league_id
                      JOIN locations lo ON lo.id = l.location_id
                      JOIN events e ON e.id = lo.event_id
                      LEFT JOIN users u ON u.id = t.owner_user_id
             WHERE t.id = ?
               AND t.deleted_at IS NULL`,
            [id],
            (req as any).user_id
        );

        if (!row) {
            return res.status(404).json({
                error: {
                    code: "TEAM_NOT_FOUND",
                    message: "Team does not exist"
                }
            });
        }

        if (!row.diploma) {
            return res.status(400).json({
                error: {
                    code: "TEAM_HAS_NO_DIPLOMA",
                    message: "Diploma type is not assigned"
                }
            });
        }

        const teamName = row.team_name;
        const eventYear = String(row.event_year);
        const baseMembers = Array.isArray(row.members) ? row.members.slice(0, 4) : [];
        const coachName = row.coach_full_name ? String(row.coach_full_name).trim() : "";
        const membersList = coachName
            ? [coachName, ...baseMembers].slice(0, 4)
            : baseMembers;

        if (membersList.length < 1) {
            return res.status(400).json({
                error: {
                    code: "NO_MEMBERS",
                    message: "Team has no members"
                }
            });
        }

        try {
            const pdf = await generateDiploma(
                teamName,
                membersList,
                row.diploma,
                eventYear
            );

            const safeName = teamName
                .trim()
                .replace(/\s+/g, "_")
                .replace(/[^a-zA-Zа-яА-Я0-9_]/g, "_");

            const fileName = `${safeName}_диплом_${row.diploma}.pdf`;
            const encoded = encodeURIComponent(fileName);

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `inline; filename="${encoded}"; filename*=UTF-8''${encoded}`
            );

            res.send(pdf);
        } catch (e) {
            console.error(e);
            res.status(500).json({
                error: {
                    code: "PDF_GENERATION_FAILED",
                    message: String(e)
                }
            });
        }
    }
);

// GET /api/teams/:id/special-nominations
teamsRouter.get(
    "/:id/special-nominations",
    validate(GetOneTeamInput, "params"),
    checkNotDeleted("team"),
    checkPermission("teams", "get"),
    async (req, res) => {
        const { id } = (req as any).validated.params;

        const [row] = await query(
            `SELECT
                 t.name AS team_name,
                 t.members,
                 t.special_nominations,
                 YEAR(e.date) AS event_year,
                 CONCAT_WS(' ', u.last_name, u.first_name, u.patronymic) AS coach_full_name
             FROM teams t
                      JOIN leagues l ON l.id = t.league_id
                      JOIN locations lo ON lo.id = l.location_id
                      JOIN events e ON e.id = lo.event_id
                      LEFT JOIN users u ON u.id = t.owner_user_id
             WHERE t.id = ?
               AND t.deleted_at IS NULL`,
            [id],
            (req as any).user_id
        );

        if (!row) {
            return res.status(404).json({
                error: {
                    code: "TEAM_NOT_FOUND",
                    message: "Team does not exist"
                }
            });
        }

        const teamName = row.team_name;
        const eventYear = String(row.event_year);
        const baseMembers = Array.isArray(row.members) ? row.members.slice(0, 4) : [];
        const coachName = row.coach_full_name ? String(row.coach_full_name).trim() : "";
        const members = coachName
            ? [coachName, ...baseMembers].slice(0, 4)
            : baseMembers;

        if (!Array.isArray(row.special_nominations) || row.special_nominations.length === 0) {
            return res.status(400).json({
                error: {
                    code: "NO_SPECIAL_NOMINATIONS",
                    message: "This team has no special nominations"
                }
            });
        }

        try {
            const pdf = await generateSpecialNominations(
                teamName,
                members,
                row.special_nominations,
                eventYear
            );

            const safeName = teamName
                .trim()
                .replace(/\s+/g, "_")
                .replace(/[^a-zA-Zа-яА-Я0-9_]/g, "_");

            const fileName = `${safeName}_спецноминации.pdf`;
            const encoded = encodeURIComponent(fileName);

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `inline; filename="${encoded}"; filename*=UTF-8''${encoded}`
            );

            res.send(pdf);
        } catch (e) {
            console.error(e);
            res.status(500).json({
                error: {
                    code: "PDF_GENERATION_FAILED",
                    message: String(e)
                }
            });
        }
    }
);

// POST /api/teams
teamsRouter.post(
    "/",
    validate(CreateTeamInput, "body"),
    checkParentNotDeleted("team", "league_id"),
    authRequired,
    async (req, res) => {
        const data = (req as any).validated.body;

        try {
            const userId = (req as any).user_id;

            const [league] = await query(
                "SELECT id, status, max_teams_count FROM leagues WHERE id = ?",
                [data.league_id], userId
            );

            if (!league) {
                return res.status(404).json({
                    error: {
                        code: "LEAGUE_NOT_FOUND",
                        message: "The league does not exist"
                    }
                });
            }

            const chain = await getScopeChain("leagues", data.league_id);
            const permissions = await query(
                `
                    SELECT 1
                    FROM permissions p
                    WHERE p.user_id = ?
                      AND p.object = 'teams'
                      AND FIND_IN_SET('create', p.permission)
                      AND (
                        p.object_id IS NULL
                            OR (
                            p.scope_object = 'events'
                                AND p.scope_object_id = ?
                            )
                            OR (
                            p.scope_object = 'locations'
                                AND p.scope_object_id = ?
                            )
                            OR (
                            p.scope_object = 'leagues'
                                AND p.scope_object_id = ?
                            )
                        )
                    LIMIT 1
                `,
                [
                    userId,
                    chain.event_id || null,
                    chain.location_id || null,
                    chain.league_id || null
                ]
            );

            const canCreateAny = permissions.length > 0;
            const isReserve = Boolean(data.is_reserve);

            let ownerUserId = data.owner_user_id ?? null;

            if (!canCreateAny) {
                const allowedCreate = new Set([
                    "league_id",
                    "owner_user_id",
                    "name",
                    "members",
                    "appreciations",
                    "school",
                    "region",
                    "meals_count",
                    "maintainer_full_name",
                    "maintainer_activity",
                    "is_reserve"
                ]);
                const disallowedCreate = Object.keys(data).filter(k => !allowedCreate.has(k));

                if (disallowedCreate.length > 0) {
                    return res.status(403).json({
                        error: {
                            code: "FORBIDDEN_FIELDS",
                            message: `User cannot set fields: ${disallowedCreate.join(", ")}`,
                        },
                    });
                }

                if (ownerUserId !== null && ownerUserId !== userId) {
                    return res.status(403).json({
                        error: {
                            code: "FORBIDDEN_OWNER",
                            message: "Cannot set owner_user_id for another user"
                        }
                    });
                }

                ownerUserId = userId;

                if (league.status !== "REGISTRATION_IN_PROGRESS") {
                    return res.status(400).json({
                        error: {
                            code: "REGISTRATION_CLOSED",
                            message: "Registration is not in progress for this league"
                        }
                    });
                }

                if (!isReserve) {
                    const [countRow] = await query(
                        `SELECT COUNT(*) AS c
                         FROM teams
                         WHERE league_id = ?
                           AND deleted_at IS NULL
                           AND status IN ('ON_CHECKING','ACCEPTED','PAID')`,
                        [data.league_id], userId
                    );

                    if (Number(countRow.c) >= Number(league.max_teams_count)) {
                        return res.status(400).json({
                            error: {
                                code: "TEAMS_LIMIT_REACHED",
                                message: "Teams limit reached for this league"
                            }
                        });
                    }
                }
            }

            const members = JSON.stringify(data.members);
            const appreciations = data.appreciations ? JSON.stringify(data.appreciations) : "[]";
            const school = data.school;
            const region = data.region;
            const meals_count = data.meals_count ?? 0;
            const maintainer_full_name = data.maintainer_full_name ?? null;
            const maintainer_activity = data.maintainer_activity ?? null;

            const answers_kvartaly = JSON.stringify(
                Array.from({ length: 4 }, () => ({
                    finished: 0,
                    questions: Array.from({ length: 4 }, () => ({
                        correct: 0,
                        incorrect: 0
                    }))
                }))
            );

            const answers_fudzi = JSON.stringify({
                has_card: true,
                questions: Array.from({ length: 16 }, () => ({
                    status: "not_submitted"
                }))
            });

            const special_nominations = JSON.stringify([]);

            const status = isReserve ? "IN_RESERVE" : "ON_CHECKING";

            const result = await query(
                `INSERT INTO teams
                 (league_id, owner_user_id, name, members, status, answers_kvartaly, answers_fudzi, special_nominations, appreciations,
                  school, region, meals_count, maintainer_full_name, maintainer_activity)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    data.league_id,
                    ownerUserId,
                    data.name,
                    members,
                    status,
                    answers_kvartaly,
                    answers_fudzi,
                    special_nominations,
                    appreciations,
                    school,
                    region,
                    meals_count,
                    maintainer_full_name,
                    maintainer_activity
                ], (req as any).user_id
            );

            if (!canCreateAny) {
                await query(
                    `INSERT INTO permissions (user_id, object, permission, object_id)
                     VALUES (?, 'teams', 'get', ?)`,
                    [userId, result.insertId],
                    userId
                );
            }

            res.json({ id: result.insertId });
        } catch (e: any) {
            console.error(e);
            res.status(400).json({
                error: {
                    code: "CREATE_TEAM_FAILED",
                    message: e.message,
                },
            });
        }
    }
);

// PATCH /api/teams/:id
teamsRouter.patch(
    "/:id",
    validate(GetOneTeamInput, "params"),
    validate(UpdateTeamInput, "body"),
    checkNotDeleted("team"),
    checkParentNotDeleted("team", "league_id", true),
    authRequired,
    async (req, res) => {
        const { ...rest } = (req as any).validated.body;
        const { id } = (req as any).validated.params;

        const userId = (req as any).user_id;

        const chain = await getScopeChain("teams", id);
        const permissions = await query(
            `
                SELECT 1
                FROM permissions p
                WHERE p.user_id = ?
                  AND p.object = 'teams'
                  AND FIND_IN_SET('update', p.permission)
                  AND (
                    p.object_id IS NULL
                        OR p.object_id = ?
                        OR (
                        p.scope_object = 'events'
                            AND p.scope_object_id = ?
                        )
                        OR (
                        p.scope_object = 'locations'
                            AND p.scope_object_id = ?
                        )
                        OR (
                        p.scope_object = 'leagues'
                            AND p.scope_object_id = ?
                        )
                    )
                LIMIT 1
            `,
            [
                userId,
                id,
                chain.event_id || null,
                chain.location_id || null,
                chain.league_id || null
            ]
        );

        const canUpdateAny = permissions.length > 0;

        const fields = Object.fromEntries(
            Object.entries(rest).filter(([, v]) => v !== undefined)
        );

        if (Object.keys(fields).length === 0) {
            return res.status(400).json({
                error: {
                    code: "NO_FIELDS_FOR_UPDATE",
                    message: "No fields provided for update",
                },
            });
        }

        try {
            const requestedStatus = fields.status;
            let existingTeam: any | null = null;
            if (!canUpdateAny) {
                const [team] = await query(
                    `SELECT t.owner_user_id, t.status, t.name, t.school,
                            l.status AS league_status
                     FROM teams t
                              JOIN leagues l ON l.id = t.league_id
                     WHERE t.id = ?`,
                    [id], userId
                );
                existingTeam = team ?? null;

                if (!team) {
                    return res.status(404).json({
                        error: {
                            code: "TEAM_NOT_FOUND",
                            message: "The team does not exist",
                        },
                    });
                }

                if (team.owner_user_id !== userId) {
                    return res.status(403).json({
                        error: {
                            code: "FORBIDDEN",
                            message: "User cannot update this team",
                        },
                    });
                }

                if (!["REGISTRATION_IN_PROGRESS", "REGISTRATION_ENDED"].includes(team.league_status)) {
                    return res.status(400).json({
                        error: {
                            code: "LEAGUE_STATUS_FORBIDDEN",
                            message: "League status does not allow updating the team",
                        },
                    });
                }

                const allowed = new Set([
                    "name",
                    "members",
                    "appreciations",
                    "meals_count",
                    "maintainer_full_name",
                    "maintainer_activity"
                ]);
                const disallowed = Object.keys(fields).filter(k => !allowed.has(k));

                if (disallowed.length > 0) {
                    return res.status(403).json({
                        error: {
                            code: "FORBIDDEN_FIELDS",
                            message: `User cannot update fields: ${disallowed.join(", ")}`,
                        },
                    });
                }
            }

            let currentTeam = existingTeam;
            if (!currentTeam) {
                const [row] = await query(
                    "SELECT status, name, school FROM teams WHERE id = ?",
                    [id],
                    (req as any).user_id
                );
                currentTeam = row ?? null;
            }

            const previousStatus = currentTeam?.status;

            if (fields.status === "ACCEPTED") {
                if (!currentTeam) {
                    return res.status(404).json({
                        error: {
                            code: "TEAM_NOT_FOUND",
                            message: "The team does not exist",
                        },
                    });
                }

                if (currentTeam.status !== "ACCEPTED") {
                    try {
                        const info = await requestPaymentInfo({
                            teamId: Number(id),
                            teamName: String(currentTeam.name),
                            teamSchool: String(currentTeam.school),
                        });

                        if (info.payUrl) {
                            fields.payment_link = info.payUrl;
                        }
                        if (info.paid) {
                            fields.status = "PAID";
                        }
                    } catch (e: any) {
                        return res.status(502).json({
                            error: {
                                code: "PAYMENT_REQUEST_FAILED",
                                message: e?.message ?? String(e),
                            },
                        });
                    }
                }
            }

            if (fields.members) {
                fields.members = JSON.stringify(fields.members);
            }
            if (fields.special_nominations !== undefined) {
                fields.special_nominations = JSON.stringify(fields.special_nominations);
            }
            if (fields.appreciations !== undefined) {
                fields.appreciations = JSON.stringify(fields.appreciations);
            }
            if (fields.school !== undefined) {
                fields.school = String(fields.school);
            }
            if (fields.region !== undefined) {
                fields.region = String(fields.region);
            }
            if (fields.meals_count !== undefined) {
                fields.meals_count = Number(fields.meals_count);
            }
            if (fields.maintainer_full_name !== undefined) {
                fields.maintainer_full_name = fields.maintainer_full_name === null
                    ? null
                    : String(fields.maintainer_full_name);
            }
            if (fields.maintainer_activity !== undefined) {
                fields.maintainer_activity = fields.maintainer_activity === null
                    ? null
                    : String(fields.maintainer_activity);
            }

            await query(
                "UPDATE teams SET ? WHERE id = ?",
                [fields, id], (req as any).user_id
            );

            const finalStatus = fields.status ?? previousStatus;

            if (requestedStatus === "ACCEPTED" && previousStatus !== "ACCEPTED") {
                try {
                    const ctx = await loadTeamEmailContext(Number(id));
                    if (ctx) {
                        await sendTeamAcceptedEmail({
                            context: ctx,
                            movedFromReserve: previousStatus === "IN_RESERVE",
                        });
                    }
                } catch (e) {
                    console.error("[email] failed to send acceptance email:", e);
                }
            }

            if (finalStatus === "PAID" && previousStatus !== "PAID") {
                try {
                    const ctx = await loadTeamEmailContext(Number(id));
                    if (ctx) {
                        await sendTeamPaymentConfirmedEmail(ctx);
                    }
                } catch (e) {
                    console.error("[email] failed to send payment confirmation:", e);
                }
            }

            if (finalStatus === "IN_RESERVE" && previousStatus !== "IN_RESERVE") {
                try {
                    const ctx = await loadTeamEmailContext(Number(id));
                    if (ctx) {
                        await sendTeamMovedToReserveEmail(ctx);
                    }
                } catch (e) {
                    console.error("[email] failed to send reserve email:", e);
                }
            }

            res.json({ success: true });
        } catch (e: any) {
            console.error(e);
            res.status(400).json({
                error: {
                    code: "UPDATE_TEAM_FAILED",
                    message: e.message,
                },
            });
        }
    }
);

// POST /api/teams/:id/check-payment
teamsRouter.post(
    "/:id/check-payment",
    validate(GetOneTeamInput, "params"),
    checkNotDeleted("team"),
    checkPermission("teams", "get"),
    async (req, res) => {
        const { id } = (req as any).validated.params;

        const [team] = await query(
            "SELECT id, name, school, payment_link, status FROM teams WHERE id = ?",
            [id], (req as any).user_id
        );

        try {
            const info = await requestPaymentInfo({
                teamId: Number(team.id),
                teamName: String(team.name),
                teamSchool: String(team.school),
            });

            if (info.paid) {
                await query(
                    "UPDATE teams SET status = 'PAID', payment_link = ? WHERE id = ?",
                    [info.payUrl ?? team.payment_link ?? null, team.id],
                    (req as any).user_id
                );

                if (team.status !== "PAID") {
                    try {
                        const ctx = await loadTeamEmailContext(Number(team.id));
                        if (ctx) {
                            await sendTeamPaymentConfirmedEmail(ctx);
                        }
                    } catch (e) {
                        console.error("[email] failed to send payment confirmation:", e);
                    }
                }

                return res.json({ paid: true });
            }

            if (info.payUrl && info.payUrl !== team.payment_link) {
                await query(
                    "UPDATE teams SET payment_link = ? WHERE id = ?",
                    [info.payUrl, team.id],
                    (req as any).user_id
                );
            }

            return res.json({ paid: false });
        } catch (e: any) {
            console.error(e);
            return res.status(502).json({
                error: {
                    code: "PAYMENT_REQUEST_FAILED",
                    message: e?.message ?? String(e),
                },
            });
        }
    }
);

// ---- DELETE /api/teams/:id ----
teamsRouter.delete(
    "/:id",
    validate(GetOneTeamInput, "params"),
    checkNotDeleted("team"),
    checkPermission("teams", "delete"),
    async (req, res) => {
        const { id } = (req as any).validated.params;

        await query(
            "UPDATE teams SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
            [id], (req as any).user_id
        );

        res.json({ success: true });
    }
);

// ---- POST /api/teams/:id/restore ----
teamsRouter.post(
    "/:id/restore",
    validate(GetOneTeamInput, "params"),
    checkPermission("teams", "restore"),
    async (req, res) => {
        const { id } = (req as any).validated.params;

        const [row] = await query(
            "SELECT deleted_at FROM teams WHERE id = ?",
            [id], (req as any).user_id
        );

        if (!row) {
            return res.status(404).json({
                error: {
                    code: "TEAM_NOT_FOUND",
                    message: "The team does not exist",
                },
            });
        }

        if (row.deleted_at === null) {
            return res.status(400).json({
                error: {
                    code: "TEAM_NOT_DELETED",
                    message: "The team is not deleted",
                },
            });
        }

        await query(
            "UPDATE teams SET deleted_at = NULL WHERE id = ?",
            [id], (req as any).user_id
        );

        res.json({ success: true });
    }
);
