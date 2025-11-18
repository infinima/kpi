import express from "express";
import { validate } from "../middlewares/validate.js";
import { GetOneEventInput, CreateEventInput, UpdateEventInput, DeleteEventQuery } from "../schemas/events.js";
import { query } from "../utils/database.js";
import { resolveFilePath } from "../utils/resolve-file-path.js";
import { savePhoto } from "../utils/save-photo.js";
import { checkNotDeleted } from "../middlewares/check-not-deleted.js";
import { checkPermission } from "../middlewares/permission-check.js";

export const eventsRouter = express.Router();

// GET /api/events
eventsRouter.get("/", async (req, res) => {
    const events = await query(
        "SELECT id, name, date, created_at, updated_at, deleted_at FROM events WHERE deleted_at IS NULL"
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
            "SELECT id, name, date, created_at, updated_at, deleted_at FROM events WHERE id = ?",
            [id]
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
            [id]
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
                "INSERT INTO events (name, date, photo) VALUES (?, ?, ?)",
                [data.name, data.date, photoPath]
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

// PUT /api/events/:id
eventsRouter.put(
    "/:id",
    validate(UpdateEventInput, "body"),
    checkPermission("events", "update"),
    checkNotDeleted("event"),
    async (req, res) => {
        const data = (req as any).validated.body;
        const { id, ...rest } = data;

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

            await query("UPDATE events SET ? WHERE id = ?", [fields, id]);
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
    checkPermission("events", "delete"),
    checkNotDeleted("event"),
    async (req, res) => {
        const { id } = (req as any).validated.params;
        const { force } = (req as any).validated.query;

        if (!force) {
            const [locRow] = await query(
                `SELECT COUNT(*) AS c FROM locations WHERE event_id = ? AND deleted_at IS NULL`,
                [id]
            );
            const [leagueRow] = await query(
                `SELECT COUNT(*) AS c
                 FROM leagues l
                 JOIN locations loc ON l.location_id = loc.id
                 WHERE loc.event_id = ?
                   AND l.deleted_at IS NULL
                   AND loc.deleted_at IS NULL`,
                [id]
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
                [id]
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
            [id]
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
            [id]
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
            [id]
        );

        res.json({ success: true });
    }
);
