import { create } from "zustand";

export type EventsPage =
    | "events"
    | "locations"
    | "leagues";

interface EventsNavState {
    page: EventsPage;

    eventId: number | null;
    eventName: string | null;

    locationId: number | null;
    locationName: string | null;

    goEvents: () => void;
    goLocations: (eventId: number, eventName: string) => void;
    goLeagues: (locationId: number, locationName: string) => void;

    goBack: () => void;
}

export const useEventsNav = create<EventsNavState>((set, get) => ({

    page: "events",

    eventId: null,
    eventName: null,

    locationId: null,
    locationName: null,


    goEvents: () =>
        set({
            page: "events",
            eventId: null,
            eventName: null,
            locationId: null,
            locationName: null,
        }),

    goLocations: (eventId, eventName) =>
        set({
            page: "locations",
            eventId,
            eventName,
            locationId: null,
            locationName: null,
        }),

    goLeagues: (locationId, locationName) =>
        set({
            page: "leagues",
            locationId,
            locationName,
        }),


    goBack: () => {
        const { page } = get();

        if (page === "leagues") {
            return set({
                page: "locations",
                locationId: null,
                locationName: null,
            });
        }

        if (page === "locations") {
            return set({
                page: "events",
                eventId: null,
                eventName: null,
                locationId: null,
                locationName: null,
            });
        }
    },
}));