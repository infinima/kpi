import type { Socket, Server } from "socket.io";
import db from "../../db/pool.js";
import { checkSocketPermission } from "../services/check-socket-permission.js";
import { getShowState } from "../services/show.js";

export function registerShowSetStatus(socket: Socket, io: Server) {
    socket.on("show_set_status", async (data) => {
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
        const { status } = data;

        const allowedStatuses = [
            "WALLPAPER",
            "KVARTALY-RESULTS",
            "FUDZI-PRESENTATION",
            "FUDZI-RESULTS"
        ];

        if (!allowedStatuses.includes(status)) {
            return socket.emit("error_response", {
                error: { code: "INVALID_STATUS" }
            });
        }

        try {
            await db.query(
                `
                UPDATE leagues
                SET show_status = ?,
                    show_slide_num = 1,
                    show_timer_started_at = NULL
                WHERE id = ?
                `,
                [status, league_id],
                socket.data.user_id
            );

            const show = await getShowState(league_id);
            io.to(`league:${league_id}:show`).emit("data", show);
        } catch (err) {
            console.error(err);
            socket.emit("error_response", { error: { code: "INTERNAL_ERROR" } });
        }
    });
}
