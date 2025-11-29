import type { Socket, Server } from "socket.io";
import { getKvartalyTable } from "../services/kvartaly-table.js";
import { getFudziTable } from "../services/fudzi-table.js";

export function registerGetTable(socket: Socket, io: Server): void {
    socket.on("get_table", async () => {
        const league_id: number = socket.data.league_id;
        const table_type: string = socket.data.table_type;

        try {
            if (table_type === "kvartaly") {
                const table = await getKvartalyTable(league_id);
                socket.emit("table_data", table);
                return;
            }

            if (table_type === "fudzi") {
                const table = await getFudziTable(league_id);
                socket.emit("table_data", table);
                return;
            }

            socket.emit("error_response", {
                error: {
                    code: "NOT_IMPLEMENTED",
                    message: `Table type '${table_type}' is not implemented`
                }
            });
        } catch (err) {
            console.error(err);
            socket.emit("error_response", {
                error: {
                    code: "INTERNAL_ERROR",
                    message: "Failed to fetch table"
                }
            });
        }
    });
}
