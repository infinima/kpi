import { Server, Socket } from "socket.io";
import { query } from "../utils/database.js";
import { computeKvartalyTable } from "./kvartaly-logic.js";

interface GetTablePayload {
    league_id: number;
    game_name: "kvartaly" | "fudzi";
}

interface SafeResponse {
    success?: boolean;
    error?: string;
    table?: any;
}

export function registerKvartalySocket(io: Server) {
    const nsp = io.of("/kvartaly");

    nsp.on("connection", (socket: Socket) => {

        socket.on(
            "get_table",
            async (data: GetTablePayload, cb?: (payload: SafeResponse) => void) => {
                try {
                    const { league_id, game_name } = data;

                    if (!league_id)
                        return safeReply(cb, socket, "get_table:response", {
                            error: "league_id is required"
                        });

                    if (game_name !== "kvartaly" && game_name !== "fudzi")
                        return safeReply(cb, socket, "get_table:response", {
                            error: "Invalid game_name"
                        });

                    const teams = await query(
                        `SELECT id, name, answers_kvartaly, answers_fudzi, deleted_at
                         FROM teams
                         WHERE league_id = ? AND deleted_at IS NULL`,
                        [league_id]
                    );

                    const table = computeKvartalyTable(teams, game_name, false);

                    return safeReply(cb, socket, "get_table:response", {
                        success: true,
                        table
                    });

                } catch (e: any) {
                    console.error(e);
                    return safeReply(cb, socket, "get_table:response", {
                        error: e.message
                    });
                }
            }
        );

        socket.on("join_league", ({ league_id }: { league_id: number }) => {
            socket.join("league:" + league_id);
        });
    });
}

function safeReply(
    cb: ((payload: SafeResponse) => void) | undefined,
    socket: Socket,
    eventName: string,
    payload: SafeResponse
) {
    if (typeof cb === "function") {
        cb(payload);
    } else {
        socket.emit(eventName, payload);
        console.log(eventName, payload);
    }
}
