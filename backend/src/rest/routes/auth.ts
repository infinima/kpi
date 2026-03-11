import express from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { validate } from "../middlewares/validate.js";
import { query } from "../../db/pool.js";
import { LoginInput, MeQuery, RegisterConfirmInput, RegisterStartInput } from "../schemas/auth.js";
import { authRequired } from "../middlewares/auth-required.js";
import { sendEmail } from "../../utils/send-email.js";
import fs from "fs";
import path from "path";

export const authRouter = express.Router();

function renderOneTimeCodeEmail(code: string, minutes: number) {
    const templatePath = path.resolve(process.cwd(), "src/static/emails/one-time-code.html");
    const template = fs.readFileSync(templatePath, "utf-8");
    const supportEmail = process.env.SUPPORT_EMAIL || "kpi@phtl.ru";
    const year = new Date().getFullYear().toString();

    return template
        .split("{{CODE}}").join(code)
        .split("{{MINUTES}}").join(String(minutes))
        .split("{{SUPPORT_EMAIL}}").join(supportEmail)
        .split("{{YEAR}}").join(year);
}

// POST /api/auth/register/start
authRouter.post(
    "/register/start",
    validate(RegisterStartInput, "body"),
    async (req, res) => {
        const data = (req as any).validated.body;
        const email = String(data.email).trim().toLowerCase();

        const [exists] = await query(
            "SELECT id FROM users WHERE email = ? LIMIT 1",
            [email], (req as any).user_id
        );

        if (exists) {
            return res.status(400).json({
                error: {
                    code: "EMAIL_ALREADY_EXISTS",
                    message: "User with this email already exists"
                }
            });
        }

        const code = String(Math.floor(1000 + Math.random() * 9000));
        const codeHash = await bcrypt.hash(code, 10);
        const passwordHash = await bcrypt.hash(data.password, 10);

        const payload = JSON.stringify({
            email,
            password_hash: passwordHash,
            last_name: data.last_name,
            first_name: data.first_name,
            patronymic: data.patronymic ?? null,
            phone_number: data.phone_number
        });

        await query(
            "DELETE FROM registration_requests WHERE email = ?",
            [email], (req as any).user_id
        );

        const [existing] = await query(
            "SELECT blocked_until FROM registration_requests WHERE email = ?",
            [email], (req as any).user_id
        );

        if (existing?.blocked_until && new Date(existing.blocked_until).getTime() > Date.now()) {
            return res.status(429).json({
                error: {
                    code: "REGISTRATION_BLOCKED",
                    message: "Too many attempts. Try later."
                }
            });
        }

        await query(
            "DELETE FROM registration_requests WHERE email = ?",
            [email], (req as any).user_id
        );

        await query(
            `INSERT INTO registration_requests (email, payload, code_hash, attempts_count, blocked_until, expires_at)
             VALUES (?, ?, ?, 0, NULL, DATE_ADD(CONVERT_TZ(NOW(), '+00:00', '+03:00'), INTERVAL 5 MINUTE))`,
            [email, payload, codeHash], (req as any).user_id
        );

        await sendEmail(
            email,
            "Код подтверждения регистрации",
            renderOneTimeCodeEmail(code, 5)
        );

        const [row] = await query(
            "SELECT expires_at FROM registration_requests WHERE email = ?",
            [email], (req as any).user_id
        );

        res.json({ success: true, expires_at: row.expires_at });
    }
);

// POST /api/auth/register/confirm
authRouter.post(
    "/register/confirm",
    validate(RegisterConfirmInput, "body"),
    async (req, res) => {
        const { email: rawEmail, code } = (req as any).validated.body;
        const email = String(rawEmail).trim().toLowerCase();

        const [reqRow] = await query(
            `SELECT id, payload, code_hash, attempts_count, blocked_until, expires_at
             FROM registration_requests
             WHERE email = ?`,
            [email], (req as any).user_id
        );

        if (!reqRow) {
            return res.status(404).json({
                error: {
                    code: "REGISTRATION_NOT_FOUND",
                    message: "Registration request not found"
                }
            });
        }

        if (reqRow.blocked_until && new Date(reqRow.blocked_until).getTime() > Date.now()) {
            return res.status(429).json({
                error: {
                    code: "REGISTRATION_BLOCKED",
                    message: "Too many attempts. Try later."
                }
            });
        }

        if (new Date(reqRow.expires_at).getTime() < Date.now()) {
            await query(
                "DELETE FROM registration_requests WHERE id = ?",
                [reqRow.id], (req as any).user_id
            );

            return res.status(400).json({
                error: {
                    code: "CODE_EXPIRED",
                    message: "Confirmation code expired"
                }
            });
        }

        const isValid = await bcrypt.compare(String(code), reqRow.code_hash);
        if (!isValid) {
            const nextAttempts = Number(reqRow.attempts_count) + 1;
            if (nextAttempts >= 5) {
                await query(
                    `UPDATE registration_requests
                     SET attempts_count = ?, blocked_until = DATE_ADD(NOW(), INTERVAL 15 MINUTE)
                     WHERE id = ?`,
                    [nextAttempts, reqRow.id], (req as any).user_id
                );

                return res.status(429).json({
                    error: {
                        code: "REGISTRATION_BLOCKED",
                        message: "Too many attempts. Try later."
                    }
                });
            }

            await query(
                "UPDATE registration_requests SET attempts_count = ? WHERE id = ?",
                [nextAttempts, reqRow.id], (req as any).user_id
            );

            return res.status(400).json({
                error: {
                    code: "INVALID_CODE",
                    message: "Invalid confirmation code"
                }
            });
        }

        const payload = reqRow.payload;

        const [exists] = await query(
            "SELECT id FROM users WHERE email = ? LIMIT 1",
            [email], (req as any).user_id
        );

        if (exists) {
            await query(
                "DELETE FROM registration_requests WHERE id = ?",
                [reqRow.id], (req as any).user_id
            );

            return res.status(400).json({
                error: {
                    code: "EMAIL_ALREADY_EXISTS",
                    message: "User with this email already exists"
                }
            });
        }

        const result = await query(
            `INSERT INTO users
                (email, password_hash, last_name, first_name, patronymic, phone_number)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                payload.email,
                payload.password_hash,
                payload.last_name,
                payload.first_name,
                payload.patronymic ?? null,
                payload.phone_number
            ], (req as any).user_id
        );

        const newUserId = result.insertId;

        await query(
            `INSERT INTO permissions (user_id, object, permission, object_id)
             VALUES (?, 'users', 'get,update', ?)`,
            [newUserId, newUserId],
            (req as any).user_id
        );

        await query(
            "DELETE FROM registration_requests WHERE id = ?",
            [reqRow.id], (req as any).user_id
        );

        const token = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

        await query(
            `INSERT INTO sessions (token_hash, user_id, is_deactivated, expires_at)
             VALUES (?, ?, 0, DATE_ADD(NOW(), INTERVAL 1 DAY))`,
            [tokenHash, newUserId], (req as any).user_id
        );

        res.json({ token });
    }
);

// POST /api/auth/login
authRouter.post(
    "/login",
    validate(LoginInput, "body"),
    async (req, res) => {
        const { email, password } = (req as any).validated.body;

        const [user] = await query(
            "SELECT id, password_hash FROM users WHERE email = ? AND deleted_at IS NULL",
            [email], (req as any).user_id
        );

        if (!user) {
            return res.status(401).json({
                error: {
                    code: "INVALID_CREDENTIALS",
                    message: "Invalid email or password"
                }
            });
        }

        const isValid = await bcrypt.compare(password, user.password_hash);

        if (!isValid) {
            return res.status(401).json({
                error: {
                    code: "INVALID_CREDENTIALS",
                    message: "Invalid email or password"
                }
            });
        }

        const token = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

        await query(
            `INSERT INTO sessions (token_hash, user_id, is_deactivated, expires_at)
             VALUES (?, ?, 0, DATE_ADD(NOW(), INTERVAL 1 DAY))`,
            [tokenHash, user.id], (req as any).user_id
        );

        res.json({ token });
    }
);

// GET /api/auth/me
authRouter.get(
    "/me",
    authRequired,
    validate(MeQuery, "query"),
    async (req, res) => {
        const token = (req as any).token;
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        const { include } = (req as any).validated.query ?? {};

        const [session] = await query(
            `SELECT user_id, expires_at
             FROM sessions
             WHERE token_hash = ?
               AND is_deactivated = 0
               AND expires_at > NOW()`,
            [tokenHash], (req as any).user_id
        );

        if (!session) {
            return res.status(401).json({
                error: {
                    code: "INVALID_SESSION",
                    message: "Invalid session"
                }
            });
        }

        let user = null;

        if (include?.includes("user")) {
            [user] = await query(
                `SELECT
                     id, email, last_name, first_name, patronymic,
                     tg_id, tg_username, tg_full_name,
                     created_at, updated_at, deleted_at
                 FROM users
                 WHERE id = ?`,
                [session.user_id], (req as any).user_id
            );
        }

        res.json({
            user_id: session.user_id,
            expires_at: session.expires_at,
            ...(user ? { user } : {})
        });
    }
);

// POST /api/auth/logout
authRouter.post(
    "/logout",
    authRequired,
    async (req, res) => {
        const token = (req as any).token;
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        const userId = (req as any).user_id;

        const result = await query(
            `
            UPDATE sessions
               SET is_deactivated = 1
            WHERE token_hash = ?
              AND user_id = ?
              AND is_deactivated = 0
            `,
            [tokenHash, userId], (req as any).user_id
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({
                error: {
                    code: "SESSION_NOT_FOUND",
                    message: "Session already deactivated"
                }
            });
        }

        res.json({ success: true });
    }
);

// authRouter.post("/tg-login", async (req, res) => {
//     const data = req.body;
//     const botToken = process.env.TG_BOT_TOKEN;
//
//     const entries = Object.keys(data)
//         .filter(k => k !== "hash")
//         .sort()
//         .map(k => `${k}=${data[k]}`)
//         .join("\n");
//
//     const secret = crypto.createHash("sha256").update(botToken!).digest();
//     const hmac = crypto.createHmac("sha256", secret)
//         .update(entries)
//         .digest("hex");
//
//     if (hmac !== data.hash) {
//         return res.status(401).json({ error: "INVALID_TELEGRAM_DATA" });
//     }
//
//     if (Date.now() / 1000 - data.auth_date > 60 * 5) {
//         return res.status(401).json({ error: "EXPIRED_AUTH" });
//     }
//
//     let [user] = await query(
//         "SELECT id FROM users WHERE tg_id = ?",
//         [data.id]
//     );
//
//     const token = crypto.randomBytes(32).toString("hex");
//     await query(
//         `INSERT INTO sessions (token, user_id, is_deactivated, expires_at)
//          VALUES (?, ?, 0, DATE_ADD(NOW(), INTERVAL 1 DAY))`,
//         [token, user.id]
//     );
//
//     res.json({ token });
// });
