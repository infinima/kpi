import express from "express";
import { query } from "../../utils/database.js";
import { validate } from "../middlewares/validate.js";
import {
    CreatePermissionInput,
    UpdatePermissionInput,
    GetPermissionsTargetInput
} from "../schemas/permissions.js";
import { checkPermission } from "../middlewares/check-permission.js";

export const permissionsRouter = express.Router();

function normalize(rows: any[]) {
    return rows.map(r => ({
        ...r,
        permission: typeof r.permission === "string"
            ? r.permission.split(",")
            : r.permission
    }));
}

// GET /api/permissions/user/:user_id
permissionsRouter.get(
    "/user/:user_id",
    checkPermission("permissions", "get"),
    async (req, res) => {
        const { user_id } = req.params;

        const rows = await query(
            `SELECT * FROM permissions WHERE user_id = ?`,
            [user_id], (req as any).user_id
        );

        return res.json(normalize(rows));
    }
);

// GET /api/permissions/:object/:object_id?
permissionsRouter.get(
    "/:object/:object_id?",
    validate(GetPermissionsTargetInput, "params"),
    checkPermission("permissions", "get"),
    async (req, res) => {
        const { object, object_id } = (req as any).validated.params;

        let rows;

        if (!object_id) {
            rows = await query(
                `SELECT * FROM permissions WHERE object=? AND object_id IS NULL AND scope_object IS NULL`,
                [object], (req as any).user_id
            );
            return res.json(normalize(rows));
        }

        // поиск по object_id
        rows = await query(
            `SELECT * FROM permissions
             WHERE object=? AND object_id=?`,
            [object, object_id], (req as any).user_id
        );

        if (rows.length > 0) return res.json(normalize(rows));

        // поиск по scope
        rows = await query(
            `SELECT * FROM permissions
             WHERE scope_object=? AND scope_object_id=?`,
            [object, object_id], (req as any).user_id
        );

        res.json(normalize(rows));
    }
);

// POST /api/permissions
permissionsRouter.post(
    "/",
    validate(CreatePermissionInput, "body"),
    checkPermission("permissions", "create"),
    async (req, res) => {
        const data = (req as any).validated.body;

        const valid =
            (data.object_id && !data.scope_object && !data.scope_object_id) ||
            (!data.object_id && data.scope_object && data.scope_object_id) ||
            (!data.object_id && !data.scope_object && !data.scope_object_id);

        if (!valid) {
            return res.status(400).json({
                error: "INVALID_SCOPE"
            });
        }

        const result = await query(
            `INSERT INTO permissions
                 (user_id, object, permission, object_id, scope_object, scope_object_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                data.user_id,
                data.object,
                data.permission.join(","),
                data.object_id ?? null,
                data.scope_object ?? null,
                data.scope_object_id ?? null
            ], (req as any).user_id
        );

        res.json({ id: result.insertId });
    }
);

// PATCH /api/permissions/:id
permissionsRouter.patch(
    "/:id",
    validate(UpdatePermissionInput, "body"),
    checkPermission("permissions", "update"),
    async (req, res) => {
        const data = (req as any).validated.body;
        const { id } = req.params;

        const valid =
            (data.object_id && !data.scope_object && !data.scope_object_id) ||
            (!data.object_id && data.scope_object && data.scope_object_id) ||
            (!data.object_id && !data.scope_object && !data.scope_object_id);

        if (!valid) {
            return res.status(400).json({
                error: "INVALID_SCOPE"
            });
        }

        if (Array.isArray(data.permission)) {
            data.permission = data.permission.join(",");
        }

        await query("UPDATE permissions SET ? WHERE id=?", [data, id], (req as any).user_id);
        res.json({ success: true });
    }
);

// DELETE /api/permissions/:id
permissionsRouter.delete(
    "/:id",
    checkPermission("permissions", "delete"),
    async (req, res) => {
        await query("DELETE FROM permissions WHERE id=?", [req.params.id], (req as any).user_id);
        res.json({ success: true });
    }
);
