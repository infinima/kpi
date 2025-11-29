import type { Server, Socket } from "socket.io";
import { registerGetTable } from "./get-table.js";

import { registerKvartalyAddAnswer } from "./kvartaly-add-answer.js";
import { registerKvartalyFinish } from "./kvartaly-finish.js";
import { registerKvartalySetPenalty } from "./kvartaly-set-penalty.js";

import { registerFudziSetCard } from "./fudzi-set-card.js";
import { registerFudziSetAnswer } from "./fudzi-set-answer.js";
import { registerFudziSetPenalty } from "./fudzi-set-penalty.js";

export function registerAllEvents(socket: Socket, io: Server): void {
    registerGetTable(socket, io);

    registerKvartalyAddAnswer(socket, io);
    registerKvartalyFinish(socket, io);
    registerKvartalySetPenalty(socket, io);

    registerFudziSetCard(socket, io);
    registerFudziSetAnswer(socket, io);
    registerFudziSetPenalty(socket, io);
}
