import express from "express";
import { validate } from "../middlewares/validate.js";
import { GetOneEventInput, CreateEventInput, UpdateEventInput, DeleteEventQuery } from "../schemas/events.js";
import { query } from "../../db/pool.js";
import { resolveFilePath } from "../../utils/resolve-file-path.js";
import { savePhoto } from "../../utils/save-photo.js";
import { checkNotDeleted } from "../middlewares/check-not-deleted.js";
import { checkPermission } from "../middlewares/check-permission.js";

export const eventsRouter = express.Router();

// GET /api/events
eventsRouter.get("/", async (req, res) => {
    const events = await query(
        "SELECT id, name, date, documents_generator_id, created_at, updated_at, deleted_at FROM events WHERE deleted_at IS NULL ORDER BY id DESC",
        [], (req as any).user_id
    );
    res.json(events);
});

// GET /api/events/registration
eventsRouter.get("/registration", async (req, res) => {
    const rows = await query(
        `SELECT
             e.id AS event_id,
             e.name AS event_name,
             e.date AS event_date,
             e.created_at AS event_created_at,
             e.updated_at AS event_updated_at,
             e.deleted_at AS event_deleted_at,
             lo.id AS location_id,
             lo.event_id AS location_event_id,
             lo.name AS location_name,
             lo.address AS location_address,
             lo.created_at AS location_created_at,
             lo.updated_at AS location_updated_at,
             lo.deleted_at AS location_deleted_at,
             l.id AS league_id,
             l.location_id AS league_location_id,
             l.name AS league_name,
             l.status AS league_status,
             l.max_teams_count,
             l.created_at AS league_created_at,
             l.updated_at AS league_updated_at,
             l.deleted_at AS league_deleted_at,
             SUM(CASE   
                     WHEN t.deleted_at IS NULL
                         AND t.status IN ('ON_CHECKING','ACCEPTED','PAID','ARRIVED')
                         THEN 1
                     ELSE 0
                 END) AS teams_count,
             SUM(CASE
                     WHEN t.deleted_at IS NULL
                         AND t.status IN ('IN_RESERVE')
                         THEN 1
                     ELSE 0
                 END) AS reserve_teams_count
         FROM leagues l
                  JOIN locations lo ON lo.id = l.location_id AND lo.deleted_at IS NULL
                  JOIN events e ON e.id = lo.event_id AND e.deleted_at IS NULL
                  LEFT JOIN teams t ON t.league_id = l.id
         WHERE l.deleted_at IS NULL
           AND l.status = 'REGISTRATION_IN_PROGRESS'
         GROUP BY
             e.id, e.name, e.date, e.created_at, e.updated_at, e.deleted_at,
             lo.id, lo.event_id, lo.name, lo.address, lo.created_at, lo.updated_at, lo.deleted_at,
             l.id, l.location_id, l.name, l.status, l.max_teams_count, l.created_at, l.updated_at, l.deleted_at`,
        [], (req as any).user_id
    );

    const eventsMap = new Map<number, any>();
    const locationsMap = new Map<string, any>();

    for (const row of rows as any[]) {
        let event = eventsMap.get(row.event_id);
        if (!event) {
            event = {
                id: row.event_id,
                name: row.event_name,
                date: row.event_date,
                created_at: row.event_created_at,
                updated_at: row.event_updated_at,
                deleted_at: row.event_deleted_at,
                locations: []
            };
            eventsMap.set(row.event_id, event);
        }

        const locationKey = `${row.event_id}:${row.location_id}`;
        let location = locationsMap.get(locationKey);
        if (!location) {
            location = {
                id: row.location_id,
                event_id: row.location_event_id,
                name: row.location_name,
                address: row.location_address,
                created_at: row.location_created_at,
                updated_at: row.location_updated_at,
                deleted_at: row.location_deleted_at,
                leagues: []
            };
            locationsMap.set(locationKey, location);
            event.locations.push(location);
        }

        location.leagues.push({
            id: row.league_id,
            location_id: row.league_location_id,
            name: row.league_name,
            status: row.league_status,
            max_teams_count: row.max_teams_count,
            teams_count: Number(row.teams_count ?? 0),
            reserve_teams_count: Number(row.reserve_teams_count ?? 0),
            created_at: row.league_created_at,
            updated_at: row.league_updated_at,
            deleted_at: row.league_deleted_at
        });
    }

    res.json([...eventsMap.values()]);
});

// GET /api/events/deleted
eventsRouter.get("/deleted",
    checkPermission("events", "restore"),
    async (req, res) => {
    const events = await query(
        "SELECT id, name, date, documents_generator_id, created_at, updated_at, deleted_at FROM events WHERE deleted_at IS NOT NULL",
        [], (req as any).user_id
    );
    res.json(events);
});

// GET /api/events/:id
eventsRouter.get(
    "/:id",
    validate(GetOneEventInput, "params"),
    checkNotDeleted("event"),
    async (req, res) => {
        const { id } = (req as any).validated.params;

        const [event] = await query(
            "SELECT id, name, date, documents_generator_id, created_at, updated_at, deleted_at FROM events WHERE id = ?",
            [id], (req as any).user_id
        );

        res.json(event);
    }
);

// GET /api/events/:id/photo
eventsRouter.get(
    "/:id/photo",
    validate(GetOneEventInput, "params"),
    checkNotDeleted("event"),
    async (req, res) => {
        const { id } = (req as any).validated.params;

        const [event] = await query(
            "SELECT photo FROM events WHERE id = ?",
            [id], (req as any).user_id
        );

        try {
            const absolutePath = resolveFilePath(event.photo);
            res.sendFile(absolutePath, (err) => {
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

// POST /api/events
eventsRouter.post(
    "/",
    validate(CreateEventInput, "body"),
    checkPermission("events", "create"),
    async (req, res) => {
        const data = (req as any).validated.body;

        try {
            const photoPath = await savePhoto(data.photo);

            const result = await query(
                "INSERT INTO events (name, date, documents_generator_id, photo) VALUES (?, ?, ?, ?)",
                [data.name, data.date, data.documents_generator_id ?? null, photoPath], (req as any).user_id
            );

            res.json({ id: result.insertId });
        } catch (e: any) {
            console.error(e);
            res.status(400).json({
                error: {
                    code: "CREATE_EVENT_FAILED",
                    message: e.message
                }
            });
        }
    }
);

// PATCH /api/events/:id
eventsRouter.patch(
    "/:id",
    validate(GetOneEventInput, "params"),
    validate(UpdateEventInput, "body"),
    checkNotDeleted("event"),
    checkPermission("events", "update"),
    async (req, res) => {
        const { id } = (req as any).validated.params;
        const { ...rest } = (req as any).validated.body;

        const fields = Object.fromEntries(
            Object.entries(rest).filter(([_, v]) => v !== undefined)
        );

        if (Object.keys(fields).length === 0) {
            return res.status(400).json({
                error: {
                    code: "NO_FIELDS_FOR_UPDATE",
                    message: "No fields provided for update"
                }
            });
        }

        try {
            if (fields.photo) {
                fields.photo = await savePhoto(String(fields.photo));
            }

            await query("UPDATE events SET ? WHERE id = ?", [fields, id], (req as any).user_id);
            res.json({ success: true });
        } catch (e: any) {
            console.error(e);
            res.status(400).json({
                error: {
                    code: "UPDATE_EVENT_FAILED",
                    message: e.message
                }
            });
        }
    }
);

// DELETE /api/events/:id
eventsRouter.delete(
    "/:id",
    validate(GetOneEventInput, "params"),
    validate(DeleteEventQuery, "query"),
    checkNotDeleted("event"),
    checkPermission("events", "delete"),
    async (req, res) => {
        const { id } = (req as any).validated.params;
        const { force } = (req as any).validated.query;

        if (!force) {
            const [locRow] = await query(
                `SELECT COUNT(*) AS c FROM locations WHERE event_id = ? AND deleted_at IS NULL`,
                [id], (req as any).user_id
            );
            const [leagueRow] = await query(
                `SELECT COUNT(*) AS c
                 FROM leagues l
                 JOIN locations loc ON l.location_id = loc.id
                 WHERE loc.event_id = ?
                   AND l.deleted_at IS NULL
                   AND loc.deleted_at IS NULL`,
                [id], (req as any).user_id
            );
            const [teamRow] = await query(
                `SELECT COUNT(*) AS c
                 FROM teams t
                 JOIN leagues l ON t.league_id = l.id
                 JOIN locations loc ON l.location_id = loc.id
                 WHERE loc.event_id = ?
                   AND t.deleted_at IS NULL
                   AND l.deleted_at IS NULL
                   AND loc.deleted_at IS NULL`,
                [id], (req as any).user_id
            );

            const nested =
                Number(locRow.c) +
                Number(leagueRow.c) +
                Number(teamRow.c);

            if (nested > 0) {
                return res.status(400).json({
                    error: {
                        code: "EVENT_HAS_RELATED_OBJECTS",
                        message: `Cannot delete event: there are ${nested} related objects. Pass force=true to delete anyway.`,
                        details: {
                            locations: Number(locRow.c),
                            leagues: Number(leagueRow.c),
                            teams: Number(teamRow.c),
                        }
                    }
                });
            }
        }

        await query(
            "UPDATE events SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
            [id], (req as any).user_id
        );

        res.json({ success: true });
    }
);

// POST /api/events/:id/restore
eventsRouter.post(
    "/:id/restore",
    validate(GetOneEventInput, "params"),
    checkPermission("events", "restore"),
    async (req, res) => {
        const { id } = (req as any).validated.params;

        const [row] = await query(
            "SELECT deleted_at FROM events WHERE id = ?",
            [id], (req as any).user_id
        );

        if (!row) {
            return res.status(404).json({
                error: {
                    code: "EVENT_NOT_FOUND",
                    message: "The event does not exist"
                }
            });
        }

        if (row.deleted_at === null) {
            return res.status(400).json({
                error: {
                    code: "EVENT_NOT_DELETED",
                    message: "The event is not deleted"
                }
            });
        }

        await query(
            "UPDATE events SET deleted_at = NULL WHERE id = ?",
            [id], (req as any).user_id
        );

        res.json({ success: true });
    }
);
