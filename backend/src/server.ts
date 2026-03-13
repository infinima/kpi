import "./utils/validate-env.js";
import http from "http";
import { Server as SocketIOServer } from "socket.io";

import { createApp } from "./rest/index.js";
import { initSocket } from "./socket/index.js";
import { runMigrations } from "./db/migrate.js";

async function bootstrap() {
    // console.log("[migrations] started")
    // await runMigrations();
    // console.log("[migrations] ended successfully")

    const app = createApp();

    const server = http.createServer(app);
    const io = new SocketIOServer(server, {
        cors: process.env.NODE_ENV === "development"
            ? { origin: "http://localhost:5173", credentials: true }
            : {}
    });
    initSocket(io);

    const PORT = process.env.PORT ?? 3000;
    server.listen(PORT, () => {
        if (process.env.NODE_ENV === "development") {
            console.log(`✅  Server is running on http://localhost:${PORT}`);
            console.log(`📘 Swagger docs: http://localhost:${PORT}/api/docs`);
        } else {
            console.log(`Server is running on port ${PORT}`);
        }
    });
}

bootstrap().catch(error => {
    console.error(error);
    process.exit(1);
});
