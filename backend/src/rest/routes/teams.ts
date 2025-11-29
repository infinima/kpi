import express from "express";
import { validate } from "../middlewares/validate.js";
import { query } from "../../utils/database.js";
import { checkNotDeleted, checkParentNotDeleted } from "../middlewares/check-not-deleted.js";
import { checkPermission } from "../middlewares/check-permission.js";

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
            [league_id]
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
            [league_id]
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
            [id]
        );

        res.json(row);
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
                has_card: false,
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
                ]
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
                [fields, id]
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
            [id]
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
            [id]
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
            [id]
        );

        res.json({ success: true });
    }
);

