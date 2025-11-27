import type { Socket, Server } from "socket.io";
import db from "../../utils/database.js";
import { getFudziTable } from "../services/fudzi.js";

export function registerFudziSetAnswer(socket: Socket, io: Server): void {
    socket.on("fudzi_set_answer", async (data) => {
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
        const { team_id, question_num, status } = data;

        const allowed = ["not_submitted", "correct", "incorrect"];
        if (!allowed.includes(status)) {
            return socket.emit("error_response", {
                error: { code: "INVALID_STATUS" }
            });
        }

        const q = Number(question_num) - 1;
        await db.query(
            `UPDATE teams
             SET answers_fudzi =
                     JSON_SET(
                             answers_fudzi,
                             CONCAT('$.questions[', ?, '].status'),
                             ?
                     )
             WHERE id = ? AND league_id = ?`,
            [q, status, team_id, league_id]
        );

        const table = await getFudziTable(league_id);
        io.to(`league:${league_id}:fudzi`).emit("table_data", table);
    });
}
