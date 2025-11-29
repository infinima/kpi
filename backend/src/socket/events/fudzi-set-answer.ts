import type { Socket, Server } from "socket.io";
import db from "../../utils/database.js";
import { getFudziTable } from "../services/fudzi-table.js";

export function registerFudziSetAnswer(socket: Socket, io: Server): void {
    socket.on("fudzi_set_answer", async (data) => {
        if (!socket.handshake.query.token) {
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
        const [leagues] = await db.query(
            `SELECT status FROM leagues WHERE id = ? LIMIT 1`,
            [league_id]
        );
        if (!leagues.length ||
            (leagues[0].status !== "FUDZI_GAME" &&
                leagues[0].status !== "FUDZI_GAME_BREAK")
        ) {
            return socket.emit("error_response", {
                error: { code: "WRONG_LEAGUE_STATUS" }
            });
        }

        const { team_id, question_num, status } = data;
        if (!question_num || question_num < 1 || question_num > 16) {
            return socket.emit("error_response", {
                error: { code: "INVALID_QUESTION_NUM" }
            });
        }
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
        io.to(`league:${league_id}:fudzi`).emit("data", table);
    });
}
