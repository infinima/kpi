import express from "express";
import { validate } from "../middlewares/validate.js";
import { query } from "../utils/database.js";
import { resolveFilePath } from "../utils/resolve-file-path.js";
import { savePhoto } from "../utils/save-photo.js";
import { checkNotDeleted } from "../middlewares/check-not-deleted.js";
import { checkPermission } from "../middlewares/permission-check.js";

import { GetOneUserInput, CreateUserInput, UpdateUserInput } from "../schemas/users.js";
import bcrypt from "bcrypt";

export const usersRouter = express.Router();


// GET /api/users
usersRouter.get(
    "/",
    checkPermission("users", "get"),
    async (req, res) => {
        const users = await query(
            `SELECT 
                id, email, last_name, first_name, patronymic,
                tg_id, tg_username, tg_full_name,
                created_at, updated_at, deleted_at
             FROM users
             WHERE deleted_at IS NULL`
        );

        res.json(users);
    }
);

// GET /api/users/:id
usersRouter.get(
    "/:id",
    validate(GetOneUserInput, "params"),
    checkPermission("users", "get"),
    checkNotDeleted("user"),
    async (req, res) => {
        const { id } = (req as any).validated.params;

        const [user] = await query(
            `SELECT 
                id, email, last_name, first_name, patronymic,
                tg_id, tg_username, tg_full_name,
                created_at, updated_at, deleted_at
             FROM users
             WHERE id = ?`,
            [id]
        );

        res.json(user);
    }
);

// GET /api/users/:id/photo
usersRouter.get(
    "/:id/photo",
    validate(GetOneUserInput, "params"),
    checkPermission("users", "get"),
    checkNotDeleted("user"),
    async (req, res) => {
        const { id } = (req as any).validated.params;

        const [user] = await query(
            "SELECT photo FROM users WHERE id = ?",
            [id]
        );

        try {
            const absolutePath = resolveFilePath(user.photo);
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

// POST /api/users
usersRouter.post(
    "/",
    validate(CreateUserInput, "body"),
    checkPermission("users", "create"),
    async (req, res) => {
        const data = (req as any).validated.body;

        try {
            const photoPath = await savePhoto(data.photo);

            const passwordHash = await bcrypt.hash(data.password, 10);

            const result = await query(
                `INSERT INTO users 
                    (email, password_hash, last_name, first_name, patronymic, photo)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    data.email,
                    passwordHash,
                    data.last_name,
                    data.first_name,
                    data.patronymic || null,
                    photoPath
                ]
            );

            res.json({ id: result.insertId });
        } catch (e: any) {
            console.error(e);
            res.status(400).json({
                error: {
                    code: "CREATE_USER_FAILED",
                    message: e.message
                }
            });
        }
    }
);

// PUT /api/users/:id
usersRouter.put(
    "/:id",
    validate(UpdateUserInput, "body"),
    checkPermission("users", "update"),
    checkNotDeleted("user"),
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

            await query("UPDATE users SET ? WHERE id = ?", [fields, id]);
            res.json({ success: true });
        } catch (e: any) {
            console.error(e);
            res.status(400).json({
                error: {
                    code: "UPDATE_USER_FAILED",
                    message: e.message
                }
            });
        }
    }
);

// DELETE /api/users/:id
usersRouter.delete(
    "/:id",
    validate(GetOneUserInput, "params"),
    checkPermission("users", "delete"),
    checkNotDeleted("user"),
    async (req, res) => {
        const { id } = (req as any).validated.params;

        await query(
            "UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
            [id]
        );

        res.json({ success: true });
    }
);

// POST /api/users/:id/restore
usersRouter.post(
    "/:id/restore",
    validate(GetOneUserInput, "params"),
    checkPermission("users", "restore"),
    async (req, res) => {
        const { id } = (req as any).validated.params;

        const [row] = await query(
            "SELECT deleted_at FROM users WHERE id = ?",
            [id]
        );

        if (!row) {
            return res.status(404).json({
                error: {
                    code: "USER_NOT_FOUND",
                    message: "The user does not exist"
                }
            });
        }

        if (row.deleted_at === null) {
            return res.status(400).json({
                error: {
                    code: "USER_NOT_DELETED",
                    message: "The user is not deleted"
                }
            });
        }

        await query(
            "UPDATE users SET deleted_at = NULL WHERE id = ?",
            [id]
        );

        res.json({ success: true });
    }
);
