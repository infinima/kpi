import type { Socket, Server } from "socket.io";
import db from "../../utils/database.js";
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
        const { enabled: is_enabled } = data;

        if (typeof is_enabled !== "boolean") {
            return socket.emit("error_response", { error: { code: "INVALID_TIMER_VALUE" } });
        }

        try {
            await db.query(
                `
                UPDATE leagues
                SET show_timer_is_enabled = ?
                WHERE id = ?
                `,
                [is_enabled ? 1 : 0, league_id], socket.data.user_id
            );

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
