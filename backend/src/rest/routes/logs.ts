import express from "express";
import { validate } from "../middlewares/validate.js";
import { query } from "../../utils/database.js";
import { checkPermission } from "../middlewares/check-permission.js";
import {
    GetLogsByUserInput,
    GetLogsByObjectInput,
    GetLogsByRecordInput
} from "../schemas/logs.js";

export const logsRouter = express.Router();

async function attachUserIfNeeded(req: any, rows: any[]) {
    const include = req.query.include?.split(",") ?? [];
    if (!include.includes("user")) return rows;

    const ids = [...new Set(rows.map(r => r.user_id).filter(Boolean))];
    if (ids.length === 0) return rows;

    const users = await query(
        `SELECT id, email, last_name, first_name, patronymic,
                tg_id, tg_username, tg_full_name,
                created_at, updated_at, deleted_at
         FROM users
         WHERE id IN (${ids.map(() => "?").join(",")})`,
        ids,
        req.user_id
    );

    const map = Object.fromEntries(
        users.map((u: any) => [u.id, u])
    );

    return rows.map(r => ({
        ...r,
        ...(map[r.user_id] ? { user: map[r.user_id] } : {})
    }));
}

// GET /api/logs/user/:user_id
logsRouter.get(
    "/user/:user_id",
    validate(GetLogsByUserInput, "params"),
    checkPermission("users", "access_actions_history"),
    async (req: any, res) => {
        const { user_id } = req.validated.params;

        let rows = await query(
            `SELECT * FROM logs WHERE user_id = ? ORDER BY id DESC`,
            [user_id],
            req.user_id
        );

        rows = await attachUserIfNeeded(req, rows);
        res.json(rows);
    }
);

// GET /api/logs/object/:object
logsRouter.get(
    "/object/:object",
    validate(GetLogsByObjectInput, "params"),
    (req, res, next) => checkPermission((req as any).params.object, "access_history")(req, res, next),
    async (req: any, res) => {
        const { object } = req.validated.params;

        let rows = await query(
            `SELECT * FROM logs WHERE table_name = ? ORDER BY id DESC`,
            [object],
            req.user_id
        );

        rows = await attachUserIfNeeded(req, rows);
        res.json(rows);
    }
);

// GET /api/logs/object/:object/:id
logsRouter.get(
    "/object/:object/:id",
    validate(GetLogsByRecordInput, "params"),
    (req, res, next) => checkPermission((req as any).params.object, "access_history")(req, res, next),
    async (req: any, res) => {
        const { object, id } = req.validated.params;

        let rows = await query(
            `SELECT * FROM logs
             WHERE table_name = ? AND record_id = ?
             ORDER BY id DESC`,
            [object, id],
            req.user_id
        );

        rows = await attachUserIfNeeded(req, rows);
        res.json(rows);
    }
);

