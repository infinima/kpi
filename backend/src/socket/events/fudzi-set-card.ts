import type { Socket, Server } from "socket.io";
import db from "../../db/pool.js";
import { checkSocketPermission } from "../services/check-socket-permission.js";
import { getFudziTable } from "../services/fudzi-table.js";

export function registerFudziSetCard(socket: Socket, io: Server): void {
    socket.on("fudzi_set_card", async (data) => {
        const hasRight = await checkSocketPermission(
            socket.data.user_id,
            "leagues",
            "edit_answers",
            socket.data.league_id
        );
        if (!hasRight) {
            return socket.emit("error_response", {
                error: { code: "FORBIDDEN" }
            });
        }

        if (socket.handshake.query.type !== "fudzi") {
            return socket.emit("error_response", {
                error: { code: "WRONG_SOCKET_TYPE" }
            });
        }

        const league_id = socket.data.league_id;
        const rows = await db.query(
            `SELECT status FROM leagues WHERE id = ? LIMIT 1`,
            [league_id], socket.data.user_id
        );
        if (!rows.length || (rows[0].status !== "FUDZI_GAME" && rows[0].status !== "FUDZI_GAME_BREAK")) {
            return socket.emit("error_response", {
                error: { code: "WRONG_LEAGUE_STATUS" }
            });
        }

        const { team_id, has_card } = data;
        if (typeof has_card !== "boolean") {
            return socket.emit("error_response", {
                error: { code: "INVALID_HAS_CARD" }
            });
        }

        const [rows2] = await db.query(
            `SELECT id
             FROM teams
             WHERE id = ? AND league_id = ? AND deleted_at IS NULL AND status = 'DOCUMENTS_SUBMITTED'
             LIMIT 1`,
            [team_id, league_id], socket.data.user_id
        );
        if (rows2.length === 0) {
            return socket.emit("error_response", {
                error: { code: "TEAM_NOT_ARRIVED" }
            });
        }

        await db.query(
            `UPDATE teams
         SET answers_fudzi = JSON_SET(
             answers_fudzi,
             '$.has_card',
             ?
         )
         WHERE id = ? AND league_id = ?`,
            [has_card, team_id, league_id], socket.data.user_id
        );

        const table = await getFudziTable(league_id);
        io.to(`league:${league_id}:fudzi`).emit("data", table);
    });
}
