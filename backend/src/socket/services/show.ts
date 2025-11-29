import { query } from "../../utils/database.js";

type ShowStatus = "WALLPAPER" | "KVARTALY-RESULTS" | "FUDZI-PRESENTATION" | "FUDZI-RESULTS";

interface ShowState {
    status: ShowStatus;
    slide_num: number;
    timer_is_enabled: boolean;
}

export async function getShowState(league_id: number): Promise<ShowState> {
    const rows = await query(
        `
            SELECT show_status, show_slide_num, show_timer_is_enabled
            FROM leagues
            WHERE id = ?
        `,
        [league_id]
    );

    if (!rows.length) throw new Error("League not found");

    const row = rows[0];

    return {
        status: row.show_status,
        slide_num: row.show_slide_num,
        timer_is_enabled: row.show_timer_is_enabled === 1
    };
}
