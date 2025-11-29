import type { Server, Socket } from "socket.io";

import { registerKvartalyAddAnswer } from "./kvartaly-add-answer.js";
import { registerKvartalyFinish } from "./kvartaly-finish.js";
import { registerKvartalySetPenalty } from "./kvartaly-set-penalty.js";

import { registerFudziSetCard } from "./fudzi-set-card.js";
import { registerFudziSetAnswer } from "./fudzi-set-answer.js";
import { registerFudziSetPenalty } from "./fudzi-set-penalty.js";

import { registerShowSetStatus } from "./show-set-status.js";
import { registerShowSetSlideNum } from "./show-set-slide-num.js";
import { registerShowSetTimerIsEnabled } from "./show-set-timer-is-enabled.js";

export function registerAllEvents(socket: Socket, io: Server): void {
    registerKvartalyAddAnswer(socket, io);
    registerKvartalyFinish(socket, io);
    registerKvartalySetPenalty(socket, io);

    registerFudziSetCard(socket, io);
    registerFudziSetAnswer(socket, io);
    registerFudziSetPenalty(socket, io);

    registerShowSetStatus(socket, io);
    registerShowSetSlideNum(socket, io);
    registerShowSetTimerIsEnabled(socket, io);
}
