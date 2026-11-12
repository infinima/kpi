export interface SocketPort {
    on(event: string, listener: (...args: unknown[]) => void): unknown;
    emit(event: string, ...args: unknown[]): unknown;
    connect(): unknown;
    disconnect(): unknown;
    removeAllListeners(): unknown;
}
export type ConnectionConfig = { url: string; leagueId: number | string; type: string; token: string | null; };
export type SocketFactory = (config: ConnectionConfig) => SocketPort;
export type ConnectionState<T> = { data: T | null; connected: boolean; error: string | null; };

/** One channel per owner. No URL parsing, UI or global session access. */
export function createChannel<T, Commands extends object>(
    factory: SocketFactory,
    decode: (value: unknown) => T,
    dataEvents: readonly string[] = ["data"],
    initialCommand?: keyof Commands & string,
) {
    let current: ConnectionState<T> = { data: null, connected: false, error: null };
    let socket: SocketPort | null = null;
    let generation = 0;
    const listeners = new Set<() => void>();
    function set(patch: Partial<ConnectionState<T>>) { current = { ...current, ...patch }; listeners.forEach((listener) => listener()); }
    function stop() {
        generation++;
        const previous = socket;
        socket = null;
        previous?.removeAllListeners();
        previous?.disconnect();
        set({ data: null, connected: false, error: null });
    }
    function start(config: ConnectionConfig) {
        stop();
        const version = generation;
        const next = factory(config);
        socket = next;
        const live = () => version === generation && socket === next;
        const failure = (value: unknown) => {
            if (!live()) return;
            const error = value && typeof value === "object" && "message" in value ? String(value.message) : typeof value === "string" ? value : "Ошибка подключения";
            set({ connected: false, error });
        };
        next.on("connect", () => {
            if (!live()) return;
            set({ connected: true, error: null });
            if (initialCommand) next.emit(initialCommand);
        });
        next.on("disconnect", () => { if (live()) set({ connected: false }); });
        next.on("connect_error", failure);
        next.on("connection_error", failure);
        next.on("error_response", (error: unknown) => {
            if (!live()) return;
            const nested = error && typeof error === "object" && "error" in error ? error.error : error;
            const message = nested && typeof nested === "object" && "message" in nested ? String(nested.message) : typeof nested === "string" ? nested : "Ошибка игрового действия";
            set({ error: message });
        });
        for (const event of dataEvents) next.on(event, (value: unknown) => {
            if (!live()) return;
            try { set({ data: decode(value), error: null }); }
            catch (error) { set({ error: error instanceof Error ? error.message : "Неверный формат данных" }); }
        });
        next.connect();
    }
    function send<K extends keyof Commands & string>(event: K, payload: Commands[K]): boolean {
        if (!socket || !current.connected) return false;
        socket.emit(event, payload);
        return true;
    }
    return {
        start, stop, send,
        getSnapshot: () => current,
        subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    };
}
