import express from "express";
import fetch from "node-fetch";
import https from "node:https";
import { z } from "../../utils/zod-openapi-init.js";
import { validate } from "../middlewares/validate.js";
import { query } from "../../db/pool.js";
import { checkNotDeleted, checkParentNotDeleted } from "../middlewares/check-not-deleted.js";
import { checkPermission } from "../middlewares/check-permission.js";
import { saveFile } from "../../utils/save-file.js";
import { resolveFilePath } from "../../utils/resolve-file-path.js";
import { generateTeamsNames } from "../../utils/generate-teams-names.js";
import { getKvartalyTable } from "../../socket/services/kvartaly-table.js";
import { getFudziTable } from "../../socket/services/fudzi-table.js";
import { rankTeams } from "../../utils/rank-teams.js";
import { rankFinal } from "../../utils/rank-teams-final.js";
import { DEFAULT_TEAM_DOCUMENTS } from "../../utils/team-documents.js";

import {
    GetOneLeagueInput,
    GetLeaguesByLocationInput,
    CreateLeagueInput,
    UpdateLeagueInput,
    UpdateLeagueStatusInput,
    DeleteLeagueQuery,
    ImportTeamsInput
} from "../schemas/leagues.js";
import { MembersSchema } from "../schemas/teams.js";

export const leaguesRouter = express.Router();

// GET /api/leagues/location/:location_id
leaguesRouter.get(
    "/location/:location_id",
    validate(GetLeaguesByLocationInput, "params"),
    checkParentNotDeleted("league", "location_id"),
    async (req, res) => {
        const { location_id } = (req as any).validated.params;

        const rows = await query(
            `SELECT id, location_id, name, max_teams_count, status, created_at, updated_at, deleted_at
             FROM leagues
             WHERE location_id = ? AND deleted_at IS NULL`,
            [location_id], (req as any).user_id
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
            `SELECT id, location_id, name, max_teams_count, status, created_at, updated_at, deleted_at
             FROM leagues
             WHERE location_id = ? AND deleted_at IS NOT NULL`,
            [location_id], (req as any).user_id
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
            "SELECT id, location_id, name, max_teams_count, status, created_at, updated_at, deleted_at FROM leagues WHERE id = ?",
            [id], (req as any).user_id
        );

        res.json(row);
    }
);

// GET /api/leagues/:id/accounts
leaguesRouter.get(
    "/:id/accounts",
    validate(GetOneLeagueInput, "params"),
    checkNotDeleted("league"),
    checkPermission("leagues", "update"),
    async (req, res) => {
        const { id } = (req as any).validated.params;

        if (id === 1) {
            res.json({
                show: {
                    login: "league1_show@kpiturnir.ru",
                    password: "25448779"
                },
                check: {
                    login: "league1_check@kpiturnir.ru",
                    password: "5u2D3w!Q"
                }
            })
        } else if (id === 2) {
            res.json({
                show: {
                    login: "league2_show@kpiturnir.ru",
                    password: "58232559"
                },
                check: {
                    login: "league2_check@kpiturnir.ru",
                    password: "NjS%iD5n"
                }
            })
        } else if (id === 3) {
            res.json({
                show: {
                    login: "league3_show@kpiturnir.ru",
                    password: "98795653"
                },
                check: {
                    login: "league3_check@kpiturnir.ru",
                    password: "%YA9S8Qu"
                }
            })
        } else {
            res.json({
                show: {
                    login: "league4_show@kpiturnir.ru",
                    password: "28229955"
                },
                check: {
                    login: "league4_check@kpiturnir.ru",
                    password: "mj*9Sf4V"
                }
            })
        }
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
            [id], (req as any).user_id
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
            [id], (req as any).user_id
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
            [id], (req as any).user_id
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
            const buffer = await generateTeamsNames(teamNames);

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
            WHERE t.league_id = ? AND t.deleted_at IS NULL AND t.status = 'ARRIVED'
            ORDER BY t.id
        `, [id], (req as any).user_id);

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
                "INSERT INTO leagues (location_id, name, max_teams_count, fudzi_presentation, show_color_scheme) VALUES (?, ?, ?, ?, ?)",
                [
                    data.location_id,
                    data.name,
                    data.max_teams_count ?? 0,
                    fudziPath,
                    JSON.stringify({})
                ], (req as any).user_id
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

            await query("UPDATE leagues SET ? WHERE id = ?", [fields, id], (req as any).user_id);

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
            "TEAMS_FIXED",
            "ARRIVAL_IN_PROGRESS",
            "ARRIVAL_ENDED",
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
            [id], (req as any).user_id
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
                case "KVARTALY_GAME":
                    await query(
                        `UPDATE teams SET place_kvartaly = NULL WHERE league_id = ?`,
                        [id], (req as any).user_id
                    );
                    break;
                case "FUDZI_GAME_BREAK":
                    await query(
                        `UPDATE teams
                         SET place_fudzi = NULL,
                             place_final = NULL,
                             diploma = NULL
                         WHERE league_id = ?`,
                        [id], (req as any).user_id
                    );
                    break;
                case "LUNCH":
                    const table = await getKvartalyTable(id);

                    const ranking = rankTeams(
                        table.map(t => ({
                            id: t.id,
                            total: t.total,
                            scores: t.quarters.flatMap((q: any) =>
                                q.answers.map((a: any) => a.score)
                            )
                        }))
                    );

                    for (const r of ranking) {
                        await query(
                            `UPDATE teams SET place_kvartaly = ? WHERE id = ?`,
                            [r.place, r.id], (req as any).user_id
                        );
                    }
                    break;
                case "GAMES_ENDED": {
                    const fud = await getFudziTable(id);

                    // ---------- 1. Ставим place_fudzi по баллам ----------
                    const fudRank = rankTeams(
                        fud.map(t => ({
                            id: t.id,
                            total: t.total,
                            scores: t.answers.map(a => a.score)
                        }))
                    );

                    for (const r of fudRank) {
                        await query(
                            `UPDATE teams SET place_fudzi = ? WHERE id = ?`,
                            [r.place, r.id], (req as any).user_id
                        );
                    }

                    // ---------- 2. Берем кварталы и фудзи ----------
                    const teams = await query(`
                        SELECT id,
                               place_kvartaly as kvartaly,
                               place_fudzi as fudzi,
                               place_final as final
                        FROM teams
                        WHERE league_id = ? AND deleted_at IS NULL AND status = 'ARRIVED'
                    `, [id], (req as any).user_id);

                    // ---------- 3. Новый финальный рейтинг ----------
                    const finalRank = rankFinal(teams);

                    for (const r of finalRank) {
                        await query(
                            `UPDATE teams SET place_final = ? WHERE id = ?`,
                            [r.place, r.id], (req as any).user_id
                        );
                    }

                    // ---------- 4. Дипломы считаем по НОВОМУ рейтингу ----------
                    const sortedFinal = [...finalRank].sort((a,b) => a.place - b.place);

                    const setDiploma = (id: number, d: 'FIRST_DEGREE' | 'SECOND_DEGREE' | 'THIRD_DEGREE' | 'PARTICIPANT') =>
                        query(
                            `UPDATE teams SET diploma = ? WHERE id = ?`,
                            [d, id],
                            (req as any).user_id
                        );

                    if (sortedFinal.length >= 1)
                        await setDiploma(sortedFinal[0].id, 'FIRST_DEGREE');

                    if (sortedFinal.length >= 2)
                        await setDiploma(sortedFinal[1].id, 'SECOND_DEGREE');
                    if (sortedFinal.length >= 3)
                        await setDiploma(sortedFinal[2].id, 'SECOND_DEGREE');

                    if (sortedFinal.length >= 4)
                        await setDiploma(sortedFinal[3].id, 'THIRD_DEGREE');
                    if (sortedFinal.length >= 5)
                        await setDiploma(sortedFinal[4].id, 'THIRD_DEGREE');
                    if (sortedFinal.length >= 6)
                        await setDiploma(sortedFinal[5].id, 'THIRD_DEGREE');

                    for (let i = 6; i < sortedFinal.length; i++) {
                        await setDiploma(sortedFinal[i].id, 'PARTICIPANT');
                    }

                    break;
                }
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
            [new_status, id], (req as any).user_id
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
                [id], (req as any).user_id
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
            [id], (req as any).user_id
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
            [id], (req as any).user_id
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
            [id], (req as any).user_id
        );

        res.json({ success: true });
    }
);


// POST /api/leagues/:id/import-teams
leaguesRouter.post(
    "/:id/import-teams",
    validate(GetOneLeagueInput, "params"),
    validate(ImportTeamsInput, "body"),
    checkNotDeleted("league"),
    checkPermission("teams", "create"),
    async (req, res) => {
        const { id } = (req as any).validated.params;
        const { url } = (req as any).validated.body;

        let teams: Array<{
            id: number;
            name: string;
            members: z.infer<typeof MembersSchema>;
        }>;
        try {
            const agent = new https.Agent({
                rejectUnauthorized: false
            });
            const r = await fetch(url, { agent });
            const raw = await r.json();

            const SingleTeamSchema = z.object({
                id: z.coerce.number().int().positive(),
                name: z.string().min(1),
                members: MembersSchema
            });

            teams = z.array(SingleTeamSchema).parse(raw);
        } catch (e: any) {
            return res.status(400).json({
                error: {
                    code: "INVALID_IMPORT_DATA",
                    message: String(e)
                }
            });
        }

        let created = 0;
        let updated = 0;

        for (const t of teams) {
            const [existing] = await query(
                `SELECT id FROM teams WHERE import_id = ? AND league_id = ? AND deleted_at IS NULL`,
                [t.id, id], (req as any).user_id
            );

            const members = JSON.stringify(t.members);

            if (!existing) {
                await query(
                    `INSERT INTO teams
                     (league_id, import_id, owner_user_id, name, members, status,
                      answers_kvartaly, answers_fudzi, special_nominations, appreciations, documents)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, '[]', '[]', ?)`,
                    [
                        id,
                        t.id,
                        null,
                        t.name,
                        members,
                        "ON_CHECKING",
                        JSON.stringify(
                            Array.from({ length: 4 }, () => ({
                                finished: 0,
                                questions: Array.from({ length: 4 }, () => ({
                                    correct: 0,
                                    incorrect: 0
                                }))
                            }))
                        ),
                        JSON.stringify({
                            has_card: false,
                            questions: Array.from({ length: 16 }, () => ({
                                status: "not_submitted"
                            }))
                        }),
                        DEFAULT_TEAM_DOCUMENTS
                    ], (req as any).user_id
                );
                created++;
            } else {
                await query(
                    `UPDATE teams
                     SET name = ?, members = ?
                     WHERE id = ?`,
                    [t.name, members, existing.id], (req as any).user_id
                );
                updated++;
            }
        }

        res.json({ success: true, created, updated });
    }
);
