import express from "express";
import crypto from "crypto";
import { validate } from "../utils/validate.js";
import { query } from "../utils/database.js";
import { LoginInput } from "../schemas/auth.js";
import { authRequired } from "../middlewares/auth-required.js";

export const authRouter = express.Router();

// Генерация токена
function generateToken() {
    return crypto.randomBytes(32).toString("hex");
}

// GET /api/auth/login
authRouter.post(
    "/login",
    validate(LoginInput),
    async (req, res) => {
        const { email, password } = (req as any).validated;

        const [user] = await query(
            "SELECT id, password_hash FROM users WHERE email = ? AND deleted_at IS NULL",
            [email]
        );

        if (!user) {
            return res.status(401).json({
                error: {
                    code: "INVALID_CREDENTIALS",
                    message: "Invalid email or password"
                }
            });
        }

        const hash = crypto.createHash("sha256").update(password).digest("hex");

        if (hash !== user.password_hash) {
            return res.status(401).json({
                error: {
                    code: "INVALID_CREDENTIALS",
                    message: "Invalid email or password"
                }
            });
        }

        const token = generateToken();

        await query(
            `INSERT INTO sessions (token, user_id, is_deactivated, expires_at)
             VALUES (?, ?, 0, DATE_ADD(NOW(), INTERVAL 1 DAY))`,
            [token, user.id]
        );

        res.json({ token });
    }
);

// GET /api/auth/logout
authRouter.post(
    "/logout",
    authRequired,
    async (req, res) => {
        // @ts-ignore
        const token = req.token;
        // @ts-ignore
        const userId = req.user_id;

        const result = await query(
            `
            UPDATE sessions
               SET is_deactivated = 1
            WHERE token = ?
               AND user_id = ?
               AND is_deactivated = 0
            `,
            [token, userId]
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
