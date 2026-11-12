import { io } from "socket.io-client";
import type { SocketFactory } from "./channel.js";
let url: string | undefined;
export function configureRealtime(serverUrl: string) { url = serverUrl; }
export function getRealtimeUrl(): string { if (!url) throw new Error("Realtime must be configured before use"); return url; }
export const socketFactory: SocketFactory = (config) => io(config.url, {
    autoConnect: false,
    transports: ["websocket"],
    query: { league_id: String(config.leagueId), type: config.type, ...(config.token ? { token: config.token } : {}) },
});
