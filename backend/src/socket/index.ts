import { Server } from "socket.io";
import { registerConnection } from "./connection.js";
import { registerAllEvents } from "./events/index.js";

export function initSocket(io: Server) {
    registerConnection(io, (socket) => {
        registerAllEvents(socket, io);
    });
}
