import express from "express";
import { validate } from "../middlewares/validate.js";
import { query } from "../../utils/database.js";
import { checkNotDeleted, checkParentNotDeleted } from "../middlewares/check-not-deleted.js";
import { checkPermission } from "../middlewares/permission-check.js";
import { saveFile } from "../../utils/save-file.js";
import { resolveFilePath } from "../../utils/resolve-file-path.js";
import { generatePDFBuffer } from "../../utils/generate-teams-names.js";

import {
    GetOneLeagueInput,
    GetLeaguesByLocationInput,
    CreateLeagueInput,
    UpdateLeagueInput,
    UpdateLeagueStatusInput,
    DeleteLeagueQuery
} from "../schemas/leagues.js";

export const leaguesRouter = express.Router();

// GET /api/leagues/location/:location_id
leaguesRouter.get(
    "/location/:location_id",
    validate(GetLeaguesByLocationInput, "params"),
    checkParentNotDeleted("league", "location_id"),
    async (req, res) => {
        const { location_id } = (req as any).validated.params;

        const rows = await query(
            `SELECT id, location_id, name, status, created_at, updated_at, deleted_at
             FROM leagues
             WHERE location_id = ? AND deleted_at IS NULL`,
            [location_id]
        );

        res.json(rows);
    }
);

// GET /api/leagues/location/:location_id/deleted
leaguesRouter.get(
    "/location/:location_id/deleted",
    validate(GetLeaguesByLocationInput, "params"),
    checkParentNotDeleted("league", "location_id"),
    checkPermission("leagues", "restore"),
    async (req, res) => {
        const { location_id } = (req as any).validated.params;

        const rows = await query(
            `SELECT id, location_id, name, status, created_at, updated_at, deleted_at
             FROM leagues
             WHERE location_id = ? AND deleted_at IS NOT NULL`,
            [location_id]
        );

        res.json(rows);
    }
);

// GET /api/leagues/:id
leaguesRouter.get(
    "/:id",
    validate(GetOneLeagueInput, "params"),
    checkNotDeleted("league"),
    async (req, res) => {
        const { id } = (req as any).validated.params;

        const [row] = await query(
            "SELECT id, location_id, name, status, created_at, updated_at, deleted_at FROM leagues WHERE id = ?",
            [id]
        );

        res.json(row);
    }
);

// GET /api/leagues/:id/fudzi_presentation
leaguesRouter.get(
    "/:id/fudzi_presentation",
    validate(GetOneLeagueInput, "params"),
    checkNotDeleted("league"),
    checkPermission("leagues", "get_show"),
    async (req, res) => {
        const { id } = (req as any).validated.params;

        const [league] = await query(
            "SELECT fudzi_presentation FROM leagues WHERE id = ?",
            [id]
        );

        if (!league) {
            return res.status(404).json({
                error: {
                    code: "LEAGUE_NOT_FOUND",
                    message: "The league does not exist"
                }
            });
        }

        if (!league.fudzi_presentation) {
            return res.status(404).json({
                error: {
                    code: "NO_FUDZI_PRESENTATION",
                    message: "This league has no fudzi_presentation"
                }
            });
        }

        try {
            const absolutePath = resolveFilePath(league.fudzi_presentation);

            res.sendFile(absolutePath, err => {
                if (err) {
                    console.error(err);
                    res.status(500).json({
                        error: {
                            code: "FAILED_TO_SEND_FILE",
                            message: "Failed to send file"
                        }
                    });
                }
            });
        } catch (e: any) {
            res.status(400).json({
                error: {
                    code: "INVALID_FILE_PATH",
                    message: e.message
                }
            });
        }
    }
);

// GET /api/leagues/:id/print_teams_names
leaguesRouter.get(
    "/:id/print_teams_names",
    validate(GetOneLeagueInput, "params"),
    checkNotDeleted("league"),
    checkPermission("leagues", "print_documents"),
    async (req, res) => {
        const { id } = (req as any).validated.params;

        const [league] = await query(
            "SELECT name FROM leagues WHERE id = ? AND deleted_at IS NULL",
            [id]
        );

        if (!league) {
            return res.status(404).json({
                error: {
                    code: "LEAGUE_NOT_FOUND",
                    message: "League does not exist"
                }
            });
        }

        const safeName = league.name
            .trim()
            .replace(/\s+/g, "_")
            .replace(/[^a-zA-Zа-яА-Я0-9_]/g, "_");

        const rows = await query(
            `SELECT name 
             FROM teams
             WHERE league_id = ? AND deleted_at IS NULL
             ORDER BY id`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                error: {
                    code: "NO_TEAMS",
                    message: "League has no teams"
                }
            });
        }

        // @ts-ignore
        const teamNames = rows.map(r => r.name);

        try {
            const buffer = await generatePDFBuffer(teamNames);

            const name = `${safeName}_команды.pdf`;
            const encoded = encodeURIComponent(name);

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `inline; filename="${encoded}"; filename*=UTF-8''${encoded}`
            );

            res.send(buffer);
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

// GET /api/leagues/:id/final-table
leaguesRouter.get(
    "/:id/final-table",
    validate(GetOneLeagueInput, "params"),
    checkNotDeleted("league"),
    async (req, res) => {
        const { id } = (req as any).validated.params;

        const rows = await query(`
            SELECT
                t.id,
                t.name,
                t.place_kvartaly,
                t.place_fudzi,
                (t.place_kvartaly + t.place_fudzi) AS place_sum,
                t.place_final,
                t.diploma,
                JSON_EXTRACT(t.special_nominations, '$') AS special_nominations
            FROM teams t
            WHERE t.league_id = ? AND t.deleted_at IS NULL
            ORDER BY t.id
        `, [id]);

        res.json(rows);
    }
);

// POST /api/leagues
leaguesRouter.post(
    "/",
    validate(CreateLeagueInput, "body"),
    checkParentNotDeleted("league", "location_id"),
    checkPermission("leagues", "create"),
    async (req, res) => {
        const data = (req as any).validated.body;

        try {
            let fudziPath = null;

            if (data.fudzi_presentation) {
                const str = String(data.fudzi_presentation);

                if (!str.startsWith("data:application/pdf;base64,")) {
                    return res.status(400).json({
                        error: {
                            code: "INVALID_PRESENTATION_FORMAT",
                            message: "fudzi_presentation must be a base64 PDF"
                        }
                    });
                }

                const base64 = str.split(",")[1];
                const buffer = Buffer.from(base64, "base64");

                if (!buffer.subarray(0, 4).equals(Buffer.from("%PDF"))) {
                    return res.status(400).json({
                        error: {
                            code: "INVALID_PDF_SIGNATURE",
                            message: "Provided file is not a valid PDF"
                        }
                    });
                }

                fudziPath = await saveFile(buffer, "pdf");
            }

            const result = await query(
                "INSERT INTO leagues (location_id, name, fudzi_presentation) VALUES (?, ?, ?)",
                [data.location_id, data.name, fudziPath]
            );

            res.json({ id: result.insertId });
        } catch (e: any) {
            console.error(e);
            res.status(400).json({
                error: {
                    code: "CREATE_LEAGUE_FAILED",
                    message: e.message,
                },
            });
        }
    }
);

// PATCH /api/leagues/:id
leaguesRouter.patch(
    "/:id",
    validate(GetOneLeagueInput, "params"),
    validate(UpdateLeagueInput, "body"),
    checkNotDeleted("league"),
    checkParentNotDeleted("league", "location_id", true),
    checkPermission("leagues", "update"),
    async (req, res) => {
        const { id } = (req as any).validated.params;
        const { ...rest } = (req as any).validated.body;

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
            if (fields.fudzi_presentation) {
                const str = String(fields.fudzi_presentation);

                if (!str.startsWith("data:application/pdf;base64,")) {
                    return res.status(400).json({
                        error: {
                            code: "INVALID_PRESENTATION_FORMAT",
                            message: "fudzi_presentation must be a base64 PDF"
                        }
                    });
                }

                const base64 = str.split(",")[1];
                const buffer = Buffer.from(base64, "base64");

                if (!buffer.subarray(0, 4).equals(Buffer.from("%PDF"))) {
                    return res.status(400).json({
                        code: "INVALID_PDF_SIGNATURE",
                        message: "Provided file is not a valid PDF"
                    });
                }

                fields.fudzi_presentation = await saveFile(buffer, "pdf");
            }

            await query("UPDATE leagues SET ? WHERE id = ?", [fields, id]);

            res.json({ success: true });
        } catch (e: any) {
            console.error(e);
            res.status(400).json({
                error: {
                    code: "UPDATE_LEAGUE_FAILED",
                    message: e.message,
                },
            });
        }
    }
);

// POST /api/leagues/:id/status
leaguesRouter.post(
    "/:id/status",
    validate(GetOneLeagueInput, "params"),
    validate(UpdateLeagueStatusInput, "body"),
    checkNotDeleted("league"),
    checkPermission("leagues", "update"),
    async (req, res) => {
        const { id } = (req as any).validated.params;
        const { new_status } = (req as any).validated.body;

        const statuses = [
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
        ];

        const [league] = await query(
            "SELECT status FROM leagues WHERE id = ? AND deleted_at IS NULL",
            [id]
        );

        const currentIndex = statuses.indexOf(league.status);
        const nextIndex = statuses.indexOf(new_status);

        if (Math.abs(nextIndex - currentIndex) !== 1) {
            return res.status(400).json({
                error: {
                    code: "ILLEGAL_STATUS_TRANSITION",
                    message: "Allowed to move only to adjacent status"
                }
            });
        }

        try {
            switch (new_status) {
                case "REGISTRATION_ENDED":
                    break;
                case "KVARTALY_GAME":
                    break;
                case "FUDZI_GAME":
                    break;
                case "GAMES_ENDED":
                    break;
            }
        } catch (e: any) {
            console.error(e);
            return res.status(500).json({
                error: {
                    code: "STATUS_SIDE_EFFECT_FAILED",
                    message: String(e)
                }
            });
        }

        await query(
            "UPDATE leagues SET status = ? WHERE id = ?",
            [new_status, id]
        );

        res.json({ success: true, new_status });
    }
);

// DELETE /api/leagues/:id
leaguesRouter.delete(
    "/:id",
    validate(GetOneLeagueInput, "params"),
    validate(DeleteLeagueQuery, "query"),
    checkNotDeleted("league"),
    checkPermission("leagues", "delete"),
    async (req, res) => {
        const { id } = (req as any).validated.params;
        const { force } = (req as any).validated.query;

        if (!force) {
            const [teamCount] = await query(
                `SELECT COUNT(*) AS c FROM teams WHERE league_id = ? AND deleted_at IS NULL`,
                [id]
            );

            if (Number(teamCount.c) > 0) {
                return res.status(400).json({
                    error: {
                        code: "LEAGUE_HAS_RELATED_OBJECTS",
                        message: "Cannot delete league: there are teams inside it",
                        details: { teams: Number(teamCount.c) }
                    }
                });
            }
        }

        await query(
            "UPDATE leagues SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
            [id]
        );

        res.json({ success: true });
    }
);

// POST /api/leagues/:id/restore
leaguesRouter.post(
    "/:id/restore",
    validate(GetOneLeagueInput, "params"),
    checkPermission("leagues", "restore"),
    async (req, res) => {
        const { id } = (req as any).validated.params;

        const [row] = await query(
            "SELECT deleted_at FROM leagues WHERE id = ?",
            [id]
        );

        if (!row) {
            return res.status(404).json({
                error: {
                    code: "LEAGUE_NOT_FOUND",
                    message: "The league does not exist",
                },
            });
        }

        if (row.deleted_at === null) {
            return res.status(400).json({
                error: {
                    code: "LEAGUE_NOT_DELETED",
                    message: "The league is not deleted",
                },
            });
        }

        await query(
            "UPDATE leagues SET deleted_at = NULL WHERE id = ?",
            [id]
        );

        res.json({ success: true });
    }
);
