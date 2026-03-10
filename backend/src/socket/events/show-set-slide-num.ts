import type { Socket, Server } from "socket.io";
import db from "../../db/pool.js";
import { checkSocketPermission } from "../services/check-socket-permission.js";
import { getShowState } from "../services/show.js";

export function registerShowSetSlideNum(socket: Socket, io: Server) {
    socket.on("show_set_slide_num", async (data) => {
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
        const { slide_num } = data;

        if (typeof slide_num !== "number" || slide_num < 1) {
            return socket.emit("error_response", {
                error: { code: "INVALID_SLIDE_NUM" }
            });
        }

        try {
            await db.query(
                `UPDATE leagues SET show_slide_num = ?, show_timer_is_enabled = false WHERE id = ?`,
                [slide_num, league_id], socket.data.user_id
            );

            const show = await getShowState(league_id);
            io.to(`league:${league_id}:show`).emit("data", show);
        } catch (err) {
            console.error(err);
            socket.emit("error_response", { error: { code: "INTERNAL_ERROR" } });
        }
    });
}
