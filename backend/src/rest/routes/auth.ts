import express from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { validate } from "../middlewares/validate.js";
import { query } from "../../db/pool.js";
import { LoginInput, MeQuery } from "../schemas/auth.js";
import { authRequired } from "../middlewares/auth-required.js";

export const authRouter = express.Router();

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

        await query(
            `INSERT INTO sessions (token, user_id, is_deactivated, expires_at)
             VALUES (?, ?, 0, DATE_ADD(NOW(), INTERVAL 1 DAY))`,
            [token, user.id], (req as any).user_id
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
        const { include } = (req as any).validated.query ?? {};

        const [session] = await query(
            `SELECT user_id, expires_at
             FROM sessions
             WHERE token = ?
               AND is_deactivated = 0
               AND expires_at > NOW()`,
            [token], (req as any).user_id
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
        const userId = (req as any).user_id;

        const result = await query(
            `
            UPDATE sessions
               SET is_deactivated = 1
            WHERE token = ?
              AND user_id = ?
              AND is_deactivated = 0
            `,
            [token, userId], (req as any).user_id
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
