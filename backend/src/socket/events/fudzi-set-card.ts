import type { Socket, Server } from "socket.io";
import db from "../../utils/database.js";
import { getFudziTable } from "../services/fudzi-table.js";

export function registerFudziSetCard(socket: Socket, io: Server): void {
    socket.on("fudzi_set_card", async (data) => {
        if (!socket.handshake.query.token) {
            return socket.emit("error_response", {
                error: { code: "FORBIDDEN" }
            });
        }

        if (socket.handshake.query.table_type !== "fudzi") {
            return socket.emit("error_response", {
                error: { code: "WRONG_TABLE_TYPE" }
            });
        }

        const league_id = socket.data.league_id;
        const { team_id, has_card } = data;

        if (typeof has_card !== "boolean") {
            return socket.emit("error_response", {
                error: { code: "INVALID_HAS_CARD" }
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
            [has_card, team_id, league_id]
        );

        const table = await getFudziTable(league_id);
        io.to(`league:${league_id}:fudzi`).emit("table_data", table);
    });
}
