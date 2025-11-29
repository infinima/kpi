import type { Server, Socket } from "socket.io";
import { query } from "../utils/database.js";
import { getKvartalyTable } from "./services/kvartaly-table.js";
import { getFudziTable } from "./services/fudzi-table.js";

export function registerConnection(
    io: Server,
    onConnected: (socket: Socket) => void
) {
    io.on("connection", async (socket: Socket) => {
        const league_id_raw = socket.handshake.query.league_id;
        const table_type = socket.handshake.query.table_type;
        const token = socket.handshake.query.token ?? null;

        const league_id = Number(league_id_raw);
        if (!league_id || Number.isNaN(league_id)) {
            socket.emit("error_response", {
                error: {
                    code: "INVALID_LEAGUE_ID",
                    message: "league_id must be a number"
                }
            });
            return socket.disconnect(true);
        }

        const allowedTypes = ["kvartaly", "fudzi"];
        if (!allowedTypes.includes(String(table_type))) {
            socket.emit("error_response", {
                error: {
                    code: "INVALID_TABLE_TYPE",
                    message: "Table type must be 'kvartaly' or 'fudzi'"
                }
            });
            return socket.disconnect(true);
        }

        let user_id: number | null = null;

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
                        message: "Invalid or expired token"
                    }
                });
                return socket.disconnect(true);
            }

            user_id = rows[0].user_id;
        } else {
            socket.emit("error_response", {
                error: {
                    code: "NO_TOKEN",
                    message: "Token missing"
                }
            });
            return socket.disconnect(true);
        }

        socket.data.league_id = league_id;
        socket.data.table_type = String(table_type);
        socket.data.token = token;
        socket.data.user_id = user_id;

        socket.join(`league:${league_id}`);
        socket.join(`league:${league_id}:${table_type}`);

        console.log(`Connected: L=${league_id} T=${table_type} U=${user_id}`);

        try {
            if (table_type === "kvartaly") {
                const table = await getKvartalyTable(league_id);
                socket.emit("table_data", table);
            } else {
                const table = await getFudziTable(league_id);
                socket.emit("table_data", table);
            }
        } catch (err) {
            console.error(err);
            socket.emit("error_response", {
                error: {
                    code: "INTERNAL_ERROR",
                    message: "Failed to fetch table"
                }
            });
            return socket.disconnect(true);
        }

        onConnected(socket);
    });
}
