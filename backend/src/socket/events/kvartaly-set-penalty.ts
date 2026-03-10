import type { Socket, Server } from "socket.io";
import db from "../../db/pool.js";
import { checkSocketPermission } from "../services/check-socket-permission.js";
import { getKvartalyTable } from "../services/kvartaly-table.js";

export function registerKvartalySetPenalty(socket: Socket, io: Server): void {
    socket.on("kvartaly_set_penalty", async (data) => {
        const hasRight = await checkSocketPermission(
            socket.data.user_id,
            "leagues",
            "edit_penalties",
            socket.data.league_id
        );
        if (!hasRight) {
            return socket.emit("error_response", {
                error: { code: "FORBIDDEN" }
            });
        }

        if (socket.handshake.query.type !== "kvartaly") {
            return socket.emit("error_response", { error: { code: "WRONG_SOCKET_TYPE" } });
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

        const { team_id, penalty } = data;
        if (typeof penalty !== "number") {
            return socket.emit("error_response", { error: { code: "INVALID_PENALTY" } });
        }

        if (typeof team_id !== "number") {
            return socket.emit("error_response", { error: { code: "INVALID_TEAM_ID" } });
        }
        const [rows2] = await db.query(
            `SELECT id FROM teams WHERE id = ? AND league_id = ? LIMIT 1`,
            [team_id, league_id], socket.data.user_id
        );
        if (rows2.length === 0) {
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
                [penalty, team_id, league_id], socket.data.user_id
            );

            const table = await getKvartalyTable(league_id);
            io.to(`league:${league_id}:kvartaly`).emit("data", table);
        } catch (err) {
            console.error(err);
            socket.emit("error_response", { error: { code: "INTERNAL_ERROR" } });
        }
    });
}
