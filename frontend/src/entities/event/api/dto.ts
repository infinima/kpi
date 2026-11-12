export type EventDto = {
    status?: import("../../../shared/api/schema.js").EventStatus;
    photo_url?: string | null;
    id: number;
    name: string;
    date: string;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    deleted_at?: string | null | undefined;
};
