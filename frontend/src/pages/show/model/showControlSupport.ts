export type EntitySummary = {
    id: number;
    name: string;
};

export type EventsOutletContext = {
    eventInfo?: EntitySummary | null;
    locationInfo?: EntitySummary | null;
    leagueInfo?: EntitySummary | null;
};
