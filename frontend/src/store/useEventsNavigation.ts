import { create } from "zustand";

export type EventsPage =
    | "events"        // список мероприятий
    | "locations"     // список локаций выбранного мероприятия
    | "leagues";      // список лиг выбранной локации

interface EventsNavState {
    page: EventsPage;

    // выбранное мероприятие
    eventId: number | null;
    eventName: string | null;

    // выбранная локация
    locationId: number | null;
    locationName: string | null;

    // переходы
    goEvents: () => void;
    goLocations: (eventId: number, eventName: string) => void;
    goLeagues: (locationId: number, locationName: string) => void;

    // назад
    goBack: () => void;
}

export const useEventsNav = create<EventsNavState>((set, get) => ({

    page: "events",

    eventId: null,
    eventName: null,

    locationId: null,
    locationName: null,

    /** ---------------------
     * ПЕРЕХОД НА СПИСОК МЕРОПРИЯТИЙ
     * ---------------------- */
    goEvents: () =>
        set({
            page: "events",
            eventId: null,
            eventName: null,
            locationId: null,
            locationName: null,
        }),

    /** ---------------------
     * ПЕРЕХОД К ЛОКАЦИЯМ КОНКРЕТНОГО МЕРОПРИЯТИЯ
     * ---------------------- */
    goLocations: (eventId, eventName) =>
        set({
            page: "locations",
            eventId,
            eventName,
            locationId: null,
            locationName: null,
        }),

    /** ---------------------
     * ПЕРЕХОД К ЛИГАМ КОНКРЕТНОЙ ЛОКАЦИИ
     * ---------------------- */
    goLeagues: (locationId, locationName) =>
        set({
            page: "leagues",
            locationId,
            locationName,
        }),

    /** ---------------------
     * ПЕРЕХОД НАЗАД
     * leagues → locations → events
     * ---------------------- */
    goBack: () => {
        const { page } = get();

        if (page === "leagues") {
            // назад к локациям текущего мероприятия
            return set({
                page: "locations",
                locationId: null,
                locationName: null,
            });
        }

        if (page === "locations") {
            // назад к списку мероприятий
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