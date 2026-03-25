import express from "express";
import { validate } from "../middlewares/validate.js";
import { query } from "../../db/pool.js";
import { checkPermission } from "../middlewares/check-permission.js";
import {
    GetLogsByUserInput,
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

async function paginateLogs(req: any, whereSql: string, params: any[]) {
    const pageSize = 100;
    const currentPage = Number(req.query.current_page ?? 1);

    if (currentPage < 1 || isNaN(currentPage)) {
        return {
            error: {
                code: "INVALID_PAGE",
                message: "current_page must be a positive integer",
            }
        };
    }

    const [countRow] = await query(
        `SELECT COUNT(*) AS c FROM logs ${whereSql}`,
        params,
        req.user_id
    );

    const total = Number(countRow.c);
    const maxPage = Math.max(1, Math.ceil(total / pageSize));
    const offset = (currentPage - 1) * pageSize;

    let rows = await query(
        `SELECT *
         FROM logs
                  ${whereSql}
         ORDER BY id DESC
             LIMIT ? OFFSET ?`,
        [...params, pageSize, offset],
        req.user_id
    );

    rows = await attachUserIfNeeded(req, rows);

    return {
        page: rows,
        current_page: currentPage,
        page_size: pageSize,
        total,
        max_page: maxPage
    };
}

logsRouter.get(
    "/user/:user_id",
    validate(GetLogsByUserInput, "params"),
    checkPermission("users", "access_actions_history"),
    async (req: any, res) => {
        const { user_id } = req.validated.params;

        const result = await paginateLogs(
            req,
            `WHERE user_id = ?`,
            [user_id]
        );

        res.json(result);
    }
);

logsRouter.get(
    "/user/:user_id",
    validate(GetLogsByUserInput, "params"),
    checkPermission("users", "access_actions_history"),
    async (req: any, res) => {
        const { user_id } = req.validated.params;

        const result = await paginateLogs(
            req,
            `WHERE user_id = ?`,
            [user_id]
        );

        res.json(result);
    }
);

logsRouter.get(
    "/object/:object/:id",
    validate(GetLogsByRecordInput, "params"),
    (req, res, next) => checkPermission((req as any).params.object, "access_history")(req, res, next),
    async (req: any, res) => {
        const { object, id } = req.validated.params;

        const result = await paginateLogs(
            req,
            `WHERE table_name = ? AND record_id = ?`,
            [object, id]
        );

        res.json(result);
    }
);
