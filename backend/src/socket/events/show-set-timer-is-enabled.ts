import type { Socket, Server } from "socket.io";
import db from "../../db/pool.js";
import { checkSocketPermission } from "../services/check-socket-permission.js";
import { getShowState } from "../services/show.js";

export function registerShowSetTimerIsEnabled(socket: Socket, io: Server) {
    socket.on("show_set_timer_is_enabled", async (data) => {
        const hasRight = await checkSocketPermission(
            socket.data.user_id,
            "leagues",
            "control_show",
            socket.data.league_id
        );
        if (!hasRight) {
            return socket.emit("error_response", {
                error: { code: "FORBIDDEN" }
            });
        }

        if (socket.handshake.query.type !== "show") {
            return socket.emit("error_response", { error: { code: "WRONG_SOCKET_TYPE" } });
        }

        const league_id: number = socket.data.league_id;
        const { enabled: is_enabled, minutes } = data ?? {};

        if (typeof is_enabled !== "boolean") {
            return socket.emit("error_response", { error: { code: "INVALID_TIMER_VALUE" } });
        }

        try {
            if (is_enabled) {
                if (typeof minutes !== "number" || !Number.isFinite(minutes)) {
                    return socket.emit("error_response", { error: { code: "INVALID_TIMER_VALUE" } });
                }
                const safeMinutes = Math.floor(minutes);
                if (safeMinutes < 1 || safeMinutes > 120) {
                    return socket.emit("error_response", { error: { code: "INVALID_TIMER_VALUE" } });
                }
                await db.query(
                    `
                    UPDATE leagues
                    SET show_timer_minutes = ?,
                        show_timer_started_at = NOW()
                    WHERE id = ?
                    `,
                    [safeMinutes, league_id],
                    socket.data.user_id
                );
            } else {
                await db.query(
                    `
                    UPDATE leagues
                    SET show_timer_started_at = NULL
                    WHERE id = ?
                    `,
                    [league_id],
                    socket.data.user_id
                );
            }
            const show = await getShowState(league_id);
            io.to(`league:${league_id}:show`).emit("data", show);
        } catch (err) {
            console.error(err);
            socket.emit("error_response", {
                error: { code: "INTERNAL_ERROR" }
            });
        }
    });
}
