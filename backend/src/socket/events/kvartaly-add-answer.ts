import type { Socket, Server } from "socket.io";
import db from "../../db/pool.js";
import { checkSocketPermission } from "../services/check-socket-permission.js";
import { getKvartalyTable } from "../services/kvartaly-table.js";

export function registerKvartalyAddAnswer(socket: Socket, io: Server): void {
    socket.on("kvartaly_add_answer", async (data) => {
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

        if (socket.handshake.query.type !== "kvartaly") {
            return socket.emit("error_response", {
                error: { code: "WRONG_SOCKET_TYPE" }
            });
        }

        const league_id: number = socket.data.league_id;
        const rows = await db.query(
            `SELECT status FROM leagues WHERE id = ? LIMIT 1`,
            [league_id], socket.data.user_id
        );
        if (!rows.length || rows[0].status !== "KVARTALY_GAME") {
            return socket.emit("error_response", {
                error: { code: "WRONG_LEAGUE_STATUS" }
            });
        }

        const { team_id, question_num, delta_correct = 0, delta_incorrect = 0 } = data;
        if (![ -1, 0, 1 ].includes(delta_correct)) {
            return socket.emit("error_response", { error: { code: "INVALID_CORRECT_DELTA" } });
        }

        if (!question_num || question_num < 1 || question_num > 16) {
            return socket.emit("error_response", {
                error: { code: "INVALID_QUESTION_NUM" }
            });
        }

        if (typeof team_id !== "number") {
            return socket.emit("error_response", { error: { code: "INVALID_TEAM_ID" } });
        }

        const [rows2] = await db.query(
            `SELECT id
             FROM teams
             WHERE id = ? AND league_id = ? AND deleted_at IS NULL AND status = 'ARRIVED'
             LIMIT 1`,
            [team_id, league_id], socket.data.user_id
        );
        if (rows2.length === 0) {
            return socket.emit("error_response", {
                error: { code: "TEAM_NOT_ARRIVED" }
            });
        }

        const kvartal = Math.floor((question_num - 1) / 4);
        const q = (question_num - 1) % 4;

        try {
            await db.query(
                `
                    UPDATE teams
                    SET answers_kvartaly =
                            JSON_SET(
                                    answers_kvartaly,
                                    CONCAT('$[', ?, '].questions[', ?, '].correct'),
                                    LEAST(
                                            1,
                                            GREATEST(
                                                    0,
                                                    JSON_EXTRACT(answers_kvartaly,
                                                                 CONCAT('$[', ?, '].questions[', ?, '].correct')
                                                    ) + ?
                                            )
                                    )
                            ),
                        answers_kvartaly =
                            JSON_SET(
                                    answers_kvartaly,
                                    CONCAT('$[', ?, '].questions[', ?, '].incorrect'),
                                    GREATEST(
                                            0,
                                            JSON_EXTRACT(answers_kvartaly,
                                                         CONCAT('$[', ?, '].questions[', ?, '].incorrect')
                                            ) + ?
                                    )
                            )
                    WHERE id = ? AND league_id = ?;
                `,
                [
                    kvartal, q, kvartal, q, delta_correct,
                    kvartal, q, kvartal, q, delta_incorrect,
                    team_id, league_id
                ],
                socket.data.user_id
            );

            const table = await getKvartalyTable(Number(league_id));
            io.to(`league:${league_id}:kvartaly`).emit("data", table);
            const teamRow = table.find((t: any) => t.id === team_id);
            const qIndex = question_num - 1;
            const quarterIndex = Math.floor(qIndex / 4);
            const questionIndex = qIndex % 4;
            const answerScore = teamRow?.quarters?.[quarterIndex]?.answers?.[questionIndex]?.score ?? null;
            const totalScore = teamRow?.total ?? null;
            io.to("bot").emit("update", {
                type: "kvartaly_add_answer",
                league_id,
                team_id,
                question_num,
                delta_correct,
                delta_incorrect,
                score: answerScore,
                total: totalScore
            });
        } catch (err) {
            console.error(err);
            socket.emit("error_response", { error: { code: "INTERNAL_ERROR" } });
        }
    });
}
