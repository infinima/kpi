import type { Server, Socket } from "socket.io";
import { registerGetTable } from "./get-table.js";
// import { registerUpdateScore } from "./update-score.js";

export function registerAllEvents(socket: Socket, io: Server): void {
    registerGetTable(socket, io);
    // registerUpdateScore(socket, io);

    // сюда добавляешь новое событие
}
