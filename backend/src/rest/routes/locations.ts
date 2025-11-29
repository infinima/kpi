import express from "express";
import { validate } from "../middlewares/validate.js";
import { query } from "../../utils/database.js";
import { checkNotDeleted, checkParentNotDeleted } from "../middlewares/check-not-deleted.js";
import { checkPermission } from "../middlewares/check-permission.js";

import {
    GetOneLocationInput,
    GetLocationsByEventInput,
    CreateLocationInput,
    UpdateLocationInput,
    DeleteLocationQuery
} from "../schemas/locations.js";

export const locationsRouter = express.Router();

// GET /api/locations/event/:event_id
locationsRouter.get(
    "/event/:event_id",
    validate(GetLocationsByEventInput, "params"),
    checkParentNotDeleted("location", "event_id"),
    async (req, res) => {
        const { event_id } = (req as any).validated.params;

        const rows = await query(
            `SELECT id, event_id, name, address, created_at, updated_at, deleted_at
             FROM locations
             WHERE event_id = ? AND deleted_at IS NULL`,
            [event_id]
        );

        res.json(rows);
    }
);

// GET /api/locations/event/:event_id/deleted
locationsRouter.get(
    "/event/:event_id/deleted",
    validate(GetLocationsByEventInput, "params"),
    checkParentNotDeleted("location", "event_id"),
    checkPermission("locations", "restore"),
    async (req, res) => {
        const { event_id } = (req as any).validated.params;

        const rows = await query(
            `SELECT id, event_id, name, address, created_at, updated_at, deleted_at
             FROM locations
             WHERE event_id = ? AND deleted_at IS NOT NULL`,
            [event_id]
        );

        res.json(rows);
    }
);

// GET /api/locations/:id
locationsRouter.get(
    "/:id",
    validate(GetOneLocationInput, "params"),
    checkNotDeleted("location"),
    async (req, res) => {
        const { id } = (req as any).validated.params;

        const [row] = await query(
            "SELECT id, event_id, name, address, created_at, updated_at, deleted_at FROM locations WHERE id = ?",
            [id]
        );

        res.json(row);
    }
);

// POST /api/locations
locationsRouter.post(
    "/",
    validate(CreateLocationInput, "body"),
    checkParentNotDeleted("location", "event_id"),
    checkPermission("locations", "create"),
    async (req, res) => {
        const data = (req as any).validated.body;

        try {
            const result = await query(
                "INSERT INTO locations (event_id, name, address) VALUES (?, ?, ?)",
                [data.event_id, data.name, data.address]
            );

            res.json({ id: result.insertId });
        } catch (e: any) {
            console.error(e);
            res.status(400).json({
                error: {
                    code: "CREATE_LOCATION_FAILED",
                    message: e.message,
                },
            });
        }
    }
);

// PATCH /api/locations/:id
locationsRouter.patch(
    "/:id",
    validate(GetOneLocationInput, "params"),
    validate(UpdateLocationInput, "body"),
    checkNotDeleted("location"),
    checkParentNotDeleted("location", "event_id", true),
    checkPermission("locations", "update"),
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
            await query("UPDATE locations SET ? WHERE id = ?", [fields, id]);
            res.json({ success: true });
        } catch (e: any) {
            console.error(e);
            res.status(400).json({
                error: {
                    code: "UPDATE_LOCATION_FAILED",
                    message: e.message,
                },
            });
        }
    }
);

// DELETE /api/locations/:id
locationsRouter.delete(
    "/:id",
    validate(GetOneLocationInput, "params"),
    validate(DeleteLocationQuery, "query"),
    checkNotDeleted("location"),
    checkPermission("locations", "delete"),
    async (req, res) => {
        const { id } = (req as any).validated.params;
        const { force } = (req as any).validated.query;

        if (!force) {
            const [leagueRow] = await query(
                `SELECT COUNT(*) AS c FROM leagues 
                 WHERE location_id = ? AND deleted_at IS NULL`,
                [id]
            );

            const [teamRow] = await query(
                `SELECT COUNT(*) AS c
                 FROM teams t
                 JOIN leagues l ON t.league_id = l.id
                 WHERE l.location_id = ?
                   AND t.deleted_at IS NULL
                   AND l.deleted_at IS NULL`,
                [id]
            );

            const nested = Number(leagueRow.c) + Number(teamRow.c);

            if (nested > 0) {
                return res.status(400).json({
                    error: {
                        code: "LOCATION_HAS_RELATED_OBJECTS",
                        message: `Cannot delete location: there are ${nested} related objects. Pass force=true to delete anyway.`,
                        details: {
                            leagues: Number(leagueRow.c),
                            teams: Number(teamRow.c),
                        },
                    },
                });
            }
        }

        await query(
            "UPDATE locations SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
            [id]
        );

        res.json({ success: true });
    }
);

// POST /api/locations/:id/restore
locationsRouter.post(
    "/:id/restore",
    validate(GetOneLocationInput, "params"),
    checkPermission("locations", "restore"),
    async (req, res) => {
        const { id } = (req as any).validated.params;

        const [row] = await query(
            "SELECT deleted_at FROM locations WHERE id = ?",
            [id]
        );

        if (!row) {
            return res.status(404).json({
                error: {
                    code: "LOCATION_NOT_FOUND",
                    message: "The location does not exist",
                },
            });
        }

        if (row.deleted_at === null) {
            return res.status(400).json({
                error: {
                    code: "LOCATION_NOT_DELETED",
                    message: "The location is not deleted",
                },
            });
        }

        await query(
            "UPDATE locations SET deleted_at = NULL WHERE id = ?",
            [id]
        );

        res.json({ success: true });
    }
);
