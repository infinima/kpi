    import express from "express";
    import { query } from "../../utils/database.js";
    import { validate } from "../middlewares/validate.js";
    import {
        CreatePermissionInput,
        UpdatePermissionInput,
        GetPermissionsTargetInput
    } from "../schemas/permissions.js";
    import { checkPermission } from "../middlewares/permission-check.js";

    export const permissionsRouter = express.Router();

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
                    [object]
                );
                return res.json(rows);
            }

            // поиск по object_id
            rows = await query(
                `SELECT * FROM permissions
           WHERE object=? AND object_id=?`,
                [object, object_id]
            );

            if (rows.length > 0) return res.json(rows);

            // поиск по scope
            rows = await query(
                `SELECT * FROM permissions
           WHERE scope_object=? AND scope_object_id=?`,
                [object, object_id]
            );

            res.json(rows);
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
                ]
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

            await query("UPDATE permissions SET ? WHERE id=?", [data, id]);
            res.json({ success: true });
        }
    );


    // DELETE /api/permissions/:id
    permissionsRouter.delete(
        "/:id",
        checkPermission("permissions", "delete"),
        async (req, res) => {
            await query("DELETE FROM permissions WHERE id=?", [req.params.id]);
            res.json({ success: true });
        }
    );
