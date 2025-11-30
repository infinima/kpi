import type { Socket, Server } from "socket.io";
import db from "../../utils/database.js";
import { checkSocketPermission } from "../services/check-socket-permission.js";
import { getShowState } from "../services/show.js";

export function registerShowSetColorScheme(socket: Socket, io: Server) {
    socket.on("show_set_color_scheme", async (data) => {
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
            return socket.emit("error_response", {
                error: { code: "WRONG_SOCKET_TYPE" }
            });
        }

        const league_id: number = socket.data.league_id;
        const { color_scheme } = data;

        if (!color_scheme || typeof color_scheme !== "object") {
            return socket.emit("error_response", {
                error: { code: "INVALID_COLOR_SCHEME" }
            });
        }

        try {
            await db.query(
                `UPDATE leagues SET show_color_scheme = ? WHERE id = ?`,
                [JSON.stringify(color_scheme), league_id],
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
