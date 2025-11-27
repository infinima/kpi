import type { Server, Socket } from "socket.io";
import { registerGetTable } from "./get-table.js";
import { registerKvartalyAddAnswer } from "./kvartaly-add-answer.js";
import { registerFudziSetCard } from "./fudzi-set-card.js";
import { registerFudziSetAnswer } from "./fudzi-set-answer.js";

export function registerAllEvents(socket: Socket, io: Server): void {
    registerGetTable(socket, io);
    registerKvartalyAddAnswer(socket, io);
    registerFudziSetCard(socket, io);
    registerFudziSetAnswer(socket, io);
}
