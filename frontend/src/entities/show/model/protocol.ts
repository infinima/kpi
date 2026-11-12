export type ShowStatus = "WALLPAPER" | "KVARTALY-RESULTS" | "FUDZI-PRESENTATION" | "FUDZI-RESULTS";
export type ShowState = { status: ShowStatus; slide_num?: number; timer_is_enabled?: boolean; timer_started_at?: string | null; server_time?: string; timer_minutes?: number; color_scheme?: unknown; };
export type ShowCommands = {
    show_set_status: { status: ShowStatus; };
    show_set_slide_num: { slide_num: number; };
    show_set_timer_is_enabled: { enabled: boolean; minutes?: number; };
    show_set_color_scheme: { color_scheme: unknown; };
};
export function decodeShow(value: unknown): ShowState {
    if (!value || typeof value !== "object" || !("status" in value) || !["WALLPAPER", "KVARTALY-RESULTS", "FUDZI-PRESENTATION", "FUDZI-RESULTS"].includes(String(value.status))) throw new Error("Неверный формат состояния показа");
    return value as ShowState;
}

export function timerSeconds(show: ShowState | null, now: number, offset: number): number {
    if (!show?.timer_is_enabled) return 0;
    const duration = Math.max(0, Number(show.timer_minutes ?? 0) * 60);
    const started = show.timer_started_at ? Date.parse(show.timer_started_at) : NaN;
    if (!Number.isFinite(started) || !show.server_time || !Number.isFinite(Date.parse(show.server_time))) return duration;
    return Math.max(0, duration - Math.floor((now - offset - started) / 1000));
}
