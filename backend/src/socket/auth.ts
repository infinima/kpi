import { Socket } from "socket.io";
import { query } from "../utils/database.js";

export async function verifySessionOptional(socket: Socket, next: (err?: any) => void) {
    try {
        const token: string | null = socket.handshake.auth?.token || null;

        if (!token) {
            (socket as any).user = null;
            return next();
        }

        const [sess] = await query(
            `SELECT sessions.user_id AS id, users.email, 'ADMIN' as role
             FROM sessions
                      JOIN users ON users.id = sessions.user_id
             WHERE token = ? AND is_deactivated = 0
               AND (expires_at > CURRENT_TIMESTAMP)
             LIMIT 1`,
            [token]
        );

        (socket as any).user = sess || null;
        next();
    } catch (e) {
        next(e);
    }
}
