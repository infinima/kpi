import type { Socket, Server } from "socket.io";
import db from "../../utils/database.js";
import { getKvartalyTable } from "../services/kvartaly.js";

export function registerKvartalyFinish(socket: Socket, io: Server): void {
    socket.on("kvartaly_finish", async (data) => {
        if (!socket.handshake.query.token)
            return socket.emit("error_response", { error: { code: "FORBIDDEN" } });

        if (socket.handshake.query.table_type !== "kvartaly")
            return socket.emit("error_response", { error: { code: "WRONG_TABLE_TYPE" } });

        const league_id: number = socket.data.league_id;
        const { team_id, kvartal, finished } = data;

        if (kvartal < 1 || kvartal > 4)
            return socket.emit("error_response", { error: { code: "INVALID_KVARTAL" } });

        const idx = kvartal - 1;

        try {
            await db.query(
                `
                UPDATE teams
                SET answers_kvartaly =
                    JSON_SET(
                        answers_kvartaly,
                        CONCAT('$[', ?, '].finished'),
                        ?
                    )
                WHERE id = ? AND league_id = ?;
                `,
                [idx, finished ? 1 : 0, team_id, league_id]
            );

            const table = await getKvartalyTable(Number(league_id));
            io.to(`league:${league_id}:kvartaly`).emit("table_data", table);
        } catch (err) {
            console.error(err);
            socket.emit("error_response", { error: { code: "INTERNAL_ERROR" } });
        }
    });
}
