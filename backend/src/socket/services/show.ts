import { query } from "../../db/pool.js";

type ShowStatus = "WALLPAPER" | "KVARTALY-RESULTS" | "FUDZI-PRESENTATION" | "FUDZI-RESULTS";

interface ShowState {
    color_scheme: string,
    status: ShowStatus;
    slide_num: number;
    timer_is_enabled: boolean;
    timer_minutes: number;
    timer_started_at: Date | null;
    server_time: Date;
}

export async function getShowState(league_id: number): Promise<ShowState> {
    const rows = await query(
        `
            SELECT
                show_color_scheme,
                show_status,
                show_slide_num,
                show_timer_minutes,
                show_timer_started_at,
                NOW() AS server_time
            FROM leagues
            WHERE id = ?
        `,
        [league_id]
    );

    if (!rows.length) throw new Error("League not found");

    const row = rows[0];

    return {
        color_scheme: row.show_color_scheme,
        status: row.show_status,
        slide_num: row.show_slide_num,
        timer_is_enabled: row.show_timer_started_at !== null,
        timer_minutes: row.show_timer_minutes,
        timer_started_at: row.show_timer_started_at,
        server_time: row.server_time
    };
}
