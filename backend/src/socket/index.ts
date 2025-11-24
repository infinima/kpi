import { Server } from "socket.io";
import path, { dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import fs from "fs";

export async function initSocket(io: Server) {
    const __filename = fileURLToPath(import.meta.url);
    const socketDir = dirname(__filename);

    const files = fs.readdirSync(socketDir);

    for (const file of files) {
        if (file === "index.ts" || file === "index.js") continue;
        if (!file.endsWith(".ts") && !file.endsWith(".js")) continue;

        const modulePath = path.join(socketDir, file);

        const moduleUrl = pathToFileURL(modulePath).href;

        const handler = await import(moduleUrl);

        if (typeof handler.default === "function") {
            handler.default(io);
        } else if (typeof handler.register === "function") {
            handler.register(io);
        }
    }
}
