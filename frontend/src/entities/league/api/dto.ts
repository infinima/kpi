export type LeagueDto = {
    id: number;
    location_id: number;
    name: string;
    status: string;
    max_teams_count: number;
    fudzi_presentation?: string | null | undefined;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    deleted_at?: string | null | undefined;
};
