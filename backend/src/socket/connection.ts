import type { Server, Socket } from "socket.io";
import { query } from "../utils/database.js";
import {getKvartalyTable} from "./services/kvartaly.js";
import {getFudziTable} from "./services/fudzi.js";

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

        try {
            if (table_type === "kvartaly") {
                const table = await getKvartalyTable(Number(league_id));
                socket.emit("table_data", table);
            } else if (table_type === "fudzi") {
                const table = await getFudziTable(Number(league_id));
                socket.emit("table_data", table);
            } else {
                socket.emit("error_response", {
                    error: {
                        code: "NOT_IMPLEMENTED",
                        message: `Table type '${table_type}' is not implemented`
                    }
                });
            }
        } catch (err) {
            console.error(err);
            socket.emit("error_response", {
                error: {
                    code: "INTERNAL_ERROR",
                    message: "Failed to fetch table"
                }
            });
        }
        onConnected(socket);
    });
}
