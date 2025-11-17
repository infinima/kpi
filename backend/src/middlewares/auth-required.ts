import { query } from "../utils/database.js";

// @ts-ignore
export async function authRequired(req, res, next) {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer ")) {
        return res.status(401).json({
            error: { code: "NO_TOKEN", message: "Token required" }
        });
    }

    const token = auth.substring(7);

    const [session] = await query(
        "SELECT * FROM sessions WHERE token = ? AND is_deactivated = 0 AND expires_at > NOW()",
        [token]
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
