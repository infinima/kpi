import express from "express";
import { validate } from "../middlewares/validate.js";
import { query } from "../../db/pool.js";
import { checkNotDeleted } from "../middlewares/check-not-deleted.js";
import { checkPermission } from "../middlewares/check-permission.js";

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
                id, email, last_name, first_name, patronymic, phone_number,
                tg_id, tg_username, tg_full_name,
                created_at, updated_at, deleted_at
             FROM users
             WHERE deleted_at IS NULL`, [], (req as any).user_id
        );

        res.json(users);
    }
);

// GET /api/users/deleted
usersRouter.get(
    "/deleted",
    checkPermission("users", "restore"),
    async (req, res) => {
        const users = await query(
            `SELECT id, email, last_name, first_name, patronymic, phone_number,
                    tg_id, tg_username, tg_full_name,
                    created_at, updated_at, deleted_at
             FROM users
             WHERE deleted_at IS NOT NULL`, [], (req as any).user_id
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
                id, email, last_name, first_name, patronymic, phone_number,
                tg_id, tg_username, tg_full_name,
                created_at, updated_at, deleted_at
             FROM users
             WHERE id = ?`,
            [id], (req as any).user_id
        );

        res.json(user);
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
            const [exists] = await query(
                "SELECT id FROM users WHERE email = ? LIMIT 1",
                [data.email], (req as any).user_id
            );

            if (exists) {
                return res.status(400).json({
                    error: {
                        code: "EMAIL_ALREADY_EXISTS",
                        message: "User with this email already exists"
                    }
                });
            }

            const passwordHash = await bcrypt.hash(data.password, 10);

            const result = await query(
                `INSERT INTO users 
                    (email, password_hash, last_name, first_name, patronymic, phone_number)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    data.email,
                    passwordHash,
                    data.last_name,
                    data.first_name,
                    data.patronymic || null,
                    data.phone_number
                ], (req as any).user_id
            );

            const newUserId = result.insertId;

            await query(
                `INSERT INTO permissions (user_id, object, permission, object_id)
                 VALUES (?, 'users', 'get,update', ?)`,
                [newUserId, newUserId],
                (req as any).user_id
            );

            res.json({ id: newUserId });
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

// PATCH /api/users/:id
usersRouter.patch(
    "/:id",
    validate(GetOneUserInput, "params"),
    validate(UpdateUserInput, "body"),
    checkNotDeleted("user"),
    checkPermission("users", "update"),
    async (req, res) => {
        const { id } = (req as any).validated.params;
        const data = (req as any).validated.body;
        const { ...rest } = data;

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
            if (fields.email) {
                const [exists] = await query(
                    "SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1",
                    [fields.email, id], (req as any).user_id
                );

                if (exists) {
                    return res.status(400).json({
                        error: {
                            code: "EMAIL_ALREADY_EXISTS",
                            message: "User with this email already exists"
                        }
                    });
                }
            }

            await query("UPDATE users SET ? WHERE id = ?", [fields, id], (req as any).user_id);
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
    checkNotDeleted("user"),
    checkPermission("users", "delete"),
    async (req, res) => {
        const { id } = (req as any).validated.params;

        await query(
            "UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
            [id], (req as any).user_id
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
            [id], (req as any).user_id
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
            [id], (req as any).user_id
        );

        res.json({ success: true });
    }
);
