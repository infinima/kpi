import type { Server, Socket } from "socket.io";
import { query } from "../db/pool.js";
import { getKvartalyTable } from "./services/kvartaly-table.js";
import { getFudziTable } from "./services/fudzi-table.js";
import { getShowState } from "./services/show.js";
import { checkSocketPermission } from "./services/check-socket-permission.js";
import crypto from "crypto";

export function registerConnection(
    io: Server,
    onConnected: (socket: Socket) => void
) {
    io.on("connection", async (socket: Socket) => {
        const type = socket.handshake.query.type;
        const token = socket.handshake.query.token ?? null;

        const allowedTypes = ["kvartaly", "fudzi", "show", "bot"];
        if (!allowedTypes.includes(String(type))) {
            socket.emit("error_response", {
                error: {
                    code: "INVALID_SOCKET_TYPE",
                    message: "Table type must be 'kvartaly', 'fudzi', 'show' or 'bot'"
                }
            });
            return socket.disconnect(true);
        }

        const league_id_raw = socket.handshake.query.league_id;
        const league_id = league_id_raw !== undefined && league_id_raw !== null && league_id_raw !== ""
            ? Number(league_id_raw)
            : null;

        if (type !== "bot") {
            if (!league_id || Number.isNaN(league_id)) {
                socket.emit("error_response", {
                    error: {
                        code: "INVALID_LEAGUE_ID",
                        message: "league_id must be a number"
                    }
                });
                return socket.disconnect(true);
            }

            const leagueExists = await query(
                `SELECT 1 FROM leagues WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
                [league_id]
            );

            if (leagueExists.length === 0) {
                socket.emit("error_response", {
                    error: {
                        code: "LEAGUE_NOT_FOUND",
                        message: "League does not exist"
                    }
                });
                return socket.disconnect(true);
            }
        } else if (league_id !== null && Number.isNaN(league_id)) {
            socket.emit("error_response", {
                error: {
                    code: "INVALID_LEAGUE_ID",
                    message: "league_id must be a number"
                }
            });
            return socket.disconnect(true);
        }

        let user_id: number | null = null;

        if (token) {
            const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

            const rows = await query(
                `
                SELECT user_id
                FROM sessions
                WHERE token_hash = ?
                  AND is_deactivated = 0
                  AND expires_at > NOW()
                LIMIT 1
                `,
                [tokenHash]
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
        }

        socket.data.league_id = league_id;
        socket.data.type = String(type);
        socket.data.token = token;
        socket.data.user_id = user_id;

        if (type === "show") {
            const allowed = await checkSocketPermission(
                user_id,
                "leagues",
                "get_show",
                league_id
            );

            if (!allowed) {
                socket.emit("error_response", {
                    error: {
                        code: "FORBIDDEN",
                        message: "No permission: get_show"
                    }
                });
                return socket.disconnect(true);
            }
        }

        if (type === "bot") {
            socket.join("bot");
        } else if (league_id !== null) {
            socket.join(`league:${league_id}`);
            socket.join(`league:${league_id}:${type}`);
        }

        try {
            if (type === "kvartaly") {
                const table = await getKvartalyTable(league_id as number);
                socket.emit("data", table);
            } else if (type === "fudzi") {
                const table = await getFudziTable(league_id as number);
                socket.emit("data", table);
            } else if (type === "show") {
                const show = await getShowState(league_id as number);
                socket.emit("data", show);
            } else if (type === "bot") {
                // bot получает только дифф-обновления, без стартового состояния
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
