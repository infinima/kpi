export type League = {
    id: number;
    locationId: number;
    name: string;
    status: string;
    maxTeamsCount: number;
    presentation: string | null | undefined;
    createdAt: string | undefined;
    updatedAt: string | undefined;
    deletedAt: string | null | undefined;
};

export type LeagueDraft = { name: string; maxTeamsCount: number; };
