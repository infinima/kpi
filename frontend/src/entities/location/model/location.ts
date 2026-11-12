export type Location = {
    id: number;
    eventId: number;
    name: string;
    address: string;
    photoAlbumUrl: string | null | undefined;
    createdAt: string | undefined;
    updatedAt: string | undefined;
    deletedAt: string | null | undefined;
};

export type LocationDraft = { name: string; address: string; photoAlbumUrl: string | null; };
