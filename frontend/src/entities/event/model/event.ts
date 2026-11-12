export type Event = {
    status?: import("../../../shared/api/schema.js").EventStatus;
    photoUrl?: string | null;
    id: number;
    name: string;
    date: string;
    createdAt: string | undefined;
    updatedAt: string | undefined;
    deletedAt: string | null | undefined;
};

export type EventDraft = { name: string; date: string; photo?: string; };
