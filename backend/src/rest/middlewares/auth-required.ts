import { query } from "../../db/pool.js";
import crypto from "crypto";

// @ts-ignore
export async function authRequired(req, res, next) {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer ")) {
        return res.status(401).json({
            error: { code: "NO_TOKEN", message: "Token required" }
        });
    }

    const token = auth.substring(7);
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const [session] = await query(
        `SELECT s.*
         FROM sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ?
           AND s.is_deactivated = 0
           AND s.expires_at > NOW()
           AND u.deleted_at IS NULL`,
        [tokenHash]
    );

    if (!session) {
        return res.status(401).json({
            error: { code: "INVALID_TOKEN", message: "Invalid or expired token" }
        });
    }

    req.token = token;
    req.user_id = session.user_id;
    next();
}
