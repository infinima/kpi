import type { Socket, Server } from "socket.io";
import db from "../../utils/database.js";
import { getFudziTable } from "../services/fudzi-table.js";

export function registerFudziSetPenalty(socket: Socket, io: Server): void {
    socket.on("fudzi_set_penalty", async (data) => {
        if (!socket.handshake.query.token)
            return socket.emit("error_response", { error: { code: "FORBIDDEN" } });

        if (socket.handshake.query.table_type !== "fudzi")
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
                    SET penalty_fudzi = ?
                    WHERE id = ? AND league_id = ?
                `,
                [penalty, team_id, league_id]
            );

            const table = await getFudziTable(league_id);
            io.to(`league:${league_id}:fudzi`).emit("table_data", table);

        } catch (err) {
            console.error(err);
            socket.emit("error_response", { error: { code: "INTERNAL_ERROR" } });
        }
    });
}
