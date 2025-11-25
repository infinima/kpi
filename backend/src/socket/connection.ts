import type { Server, Socket } from "socket.io";
import { query } from "../utils/database.js";

export function registerConnection(
    io: Server,
    onConnected: (socket: Socket) => void
) {
    io.on("connection", async (socket: Socket) => {
        const league_id = socket.handshake.query.league_id;
        const table_type = socket.handshake.query.table_type;
        const token = socket.handshake.query.token ?? null;

        // ===== Error: missing params =====
        if (!league_id || !table_type) {
            socket.emit("error_response", {
                error: {
                    code: "MISSING_PARAMS",
                    message: "league_id and table_type are required"
                }
            });
            return;
        }

        let user_id: number | null = null;

        // ===== Token validation =====
        if (token) {
            const rows = await query(
                `
                    SELECT user_id
                    FROM sessions
                    WHERE token = ?
                      AND is_deactivated = 0
                      AND expires_at > NOW()
                    LIMIT 1
                `,
                [token]
            );

            if (rows.length === 0) {
                socket.emit("error_response", {
                    error: {
                        code: "INVALID_SESSION",
                        message: "Session is invalid or expired"
                    }
                });
            } else {
                user_id = rows[0].user_id;
            }
        } else {
            // ===== Error: token missing =====
            socket.emit("error_response", {
                error: {
                    code: "NO_TOKEN",
                    message: "Token not provided (unauthorized mode)"
                }
            });
        }

        // ===== Save context =====
        socket.data.league_id = Number(league_id);
        socket.data.table_type = String(table_type);
        socket.data.token = token;
        socket.data.user_id = user_id;

        // ===== Rooms =====
        socket.join(`league:${league_id}`);
        socket.join(`league:${league_id}:${table_type}`);

        console.log(`Connected: L=${league_id} T=${table_type} U=${user_id}`);

        // Pass socket to event registration
        onConnected(socket);
    });
}
