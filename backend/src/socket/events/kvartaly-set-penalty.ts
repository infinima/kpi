import type { Socket, Server } from "socket.io";
import db from "../../utils/database.js";
import { getKvartalyTable } from "../services/kvartaly.js";

export function registerKvartalySetPenalty(socket: Socket, io: Server): void {
    socket.on("kvartaly_set_penalty", async (data) => {
        if (!socket.handshake.query.token)
            return socket.emit("error_response", { error: { code: "FORBIDDEN" } });

        if (socket.handshake.query.table_type !== "kvartaly")
            return socket.emit("error_response", { error: { code: "WRONG_TABLE_TYPE" } });

        const league_id: number = socket.data.league_id;
        const { team_id, penalty } = data;

        if (typeof team_id !== "number")
            return socket.emit("error_response", { error: { code: "INVALID_TEAM_ID" } });

        if (typeof penalty !== "number")
            return socket.emit("error_response", { error: { code: "INVALID_PENALTY" } });

        const [rows] = await db.query(
            `SELECT id FROM teams WHERE id = ? AND league_id = ? LIMIT 1`,
            [team_id, league_id]
        );

        if (rows.length === 0) {
            return socket.emit("error_response", {
                error: { code: "TEAM_NOT_FOUND" }
            });
        }

        try {
            await db.query(
                `
                    UPDATE teams
                    SET penalty_kvartaly = ?
                    WHERE id = ? AND league_id = ?
                `,
                [penalty, team_id, league_id]
            );

            const table = await getKvartalyTable(league_id);
            io.to(`league:${league_id}:kvartaly`).emit("table_data", table);
        } catch (err) {
            console.error(err);
            socket.emit("error_response", { error: { code: "INTERNAL_ERROR" } });
        }
    });
}
