import type { Server, Socket } from "socket.io";
import { query } from "../utils/database.js";
import { getKvartalyTable } from "./services/kvartaly-table.js";
import { getFudziTable } from "./services/fudzi-table.js";
import { getShowState } from "./services/show.js";

export function registerConnection(
    io: Server,
    onConnected: (socket: Socket) => void
) {
    io.on("connection", async (socket: Socket) => {
        const league_id_raw = socket.handshake.query.league_id;
        const type = socket.handshake.query.type;
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

        const allowedTypes = ["kvartaly", "fudzi", "show"];
        if (!allowedTypes.includes(String(type))) {
            socket.emit("error_response", {
                error: {
                    code: "INVALID_SOCKET_TYPE",
                    message: "Table type must be 'kvartaly', 'fudzi' or 'show'"
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
        socket.data.type = String(type);
        socket.data.token = token;
        socket.data.user_id = user_id;

        socket.join(`league:${league_id}`);
        socket.join(`league:${league_id}:${type}`);

        try {
            if (type === "kvartaly") {
                const table = await getKvartalyTable(league_id);
                socket.emit("data", table);
            } else if (type === "fudzi") {
                const table = await getFudziTable(league_id);
                socket.emit("data", table);
            } else if (type === "show") {
                const show = await getShowState(league_id);
                socket.emit("data", show);
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
