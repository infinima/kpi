import express from "express";
import { validate } from "../middlewares/validate.js";
import { query } from "../../utils/database.js";
import { checkNotDeleted, checkParentNotDeleted } from "../middlewares/check-not-deleted.js";
import { checkPermission } from "../middlewares/check-permission.js";
import { generateAppreciation } from "../../utils/generate-appreciation.js";
import { generateDiploma } from "../../utils/generate-diploma.js";
import { generateSpecialNominations } from "../../utils/generate-special-nominations.js";

import {
    GetTeamsByLeagueInput,
    GetOneTeamInput,
    CreateTeamInput,
    UpdateTeamInput
} from "../schemas/teams.js";

export const teamsRouter = express.Router();

// GET /api/teams/league/:league_id
teamsRouter.get(
    "/league/:league_id",
    validate(GetTeamsByLeagueInput, "params"),
    checkParentNotDeleted("team", "league_id"),
    checkPermission("teams", "get"),
    async (req, res) => {
        const { league_id } = (req as any).validated.params;

        const rows = await query(
            `SELECT id, league_id, name, members,
                    answers_kvartaly, answers_fudzi,
                    diploma, special_nominations,
                    created_at, updated_at, deleted_at
             FROM teams
             WHERE league_id = ? AND deleted_at IS NULL`,
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
            `SELECT id, league_id, name, members,
                    answers_kvartaly, answers_fudzi,
                    diploma, special_nominations,
                    created_at, updated_at, deleted_at
             FROM teams
             WHERE league_id = ? AND deleted_at IS NOT NULL`,
            [league_id], (req as any).user_id
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
            `SELECT id, league_id, name, members,
                    answers_kvartaly, answers_fudzi,
                    diploma, special_nominations,
                    created_at, updated_at, deleted_at
             FROM teams
             WHERE id = ?`,
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
                 t.members,
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

        const members = row.members;
        const teacherName =
            members?.coach?.full_name || "Руководитель команды";
        const eventName = row.event_name;
        const eventYear = String(row.event_year);

        try {
            const pdf = await generateAppreciation(
                teacherName,
                eventName,
                eventYear
            );

            const safeName = teacherName
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
        const membersJson = row.members || {};
        const membersList =
            membersJson.participants?.map((p: any) => p.full_name)?.slice(0, 4) ||
            [];

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

        const teamName = row.team_name;
        const eventYear = String(row.event_year);
        const membersJson = row.members || {};
        const members = membersJson.participants
            ?.map((p: any) => p.full_name)
            ?.slice(0, 4) || [];

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
    checkPermission("teams", "create"),
    async (req, res) => {
        const data = (req as any).validated.body;

        try {
            const members = JSON.stringify(data.members);

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

            const result = await query(
                `INSERT INTO teams
                 (league_id, name, members, answers_kvartaly, answers_fudzi, special_nominations)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    data.league_id,
                    data.name,
                    members,
                    answers_kvartaly,
                    answers_fudzi,
                    special_nominations,
                ], (req as any).user_id
            );

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
    checkPermission("teams", "update"),
    async (req, res) => {
        const { ...rest } = (req as any).validated.body;
        const { id } = (req as any).validated.params;

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
            if (fields.members) {
                fields.members = JSON.stringify(fields.members);
            }
            if (fields.special_nominations !== undefined) {
                fields.special_nominations = JSON.stringify(fields.special_nominations);
            }

            await query(
                "UPDATE teams SET ? WHERE id = ?",
                [fields, id], (req as any).user_id
            );

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

