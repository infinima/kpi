export type LocationDto = {
    id: number;
    event_id: number;
    name: string;
    address: string;
    photo_album_url?: string | null | undefined;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    deleted_at?: string | null | undefined;
};
