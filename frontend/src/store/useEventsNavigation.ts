import { create } from "zustand";

export type EventsPage =
    | "events"        // список мероприятий
    | "locations"     // список локаций выбранного мероприятия
    | "leagues";      // список лиг выбранной локации

interface EventsNavState {
    page: EventsPage;

    // выбранные элементы
    eventId: number | null;
    locationId: number | null;

    // переходы вперёд
    goEvents: () => void;
    goLocations: (eventId: number) => void;
    goLeagues: (locationId: number) => void;

    // переход назад (автоматически по дереву)
    goBack: () => void;
}

export const useEventsNav = create<EventsNavState>((set, get) => ({

    page: "events",
    eventId: null,
    locationId: null,

    /** ---------------------
     * ПЕРЕХОД НА СПИСОК МЕРОПРИЯТИЙ
     * ---------------------- */
    goEvents: () =>
        set({
            page: "events",
            eventId: null,
            locationId: null,
        }),

    /** ---------------------
     * ПЕРЕХОД К ЛОКАЦИЯМ МЕРОПРИЯТИЯ
     * ---------------------- */
    goLocations: (eventId) =>
        set({
            page: "locations",
            eventId,
            locationId: null,
        }),

    /** ---------------------
     * ПЕРЕХОД К ЛИГАМ ЛОКАЦИИ
     * ---------------------- */
    goLeagues: (locationId) =>
        set({
            page: "leagues",
            locationId,
        }),

    /** ---------------------
     * ПЕРЕХОД НАЗАД
     * leagues → locations → events
     * ---------------------- */
    goBack: () => {
        const { page, eventId } = get();

        if (page === "leagues") {
            // возвращаемся к локациям текущего мероприятия
            return set({
                page: "locations",
                // eventId остаётся тем же!
            });
        }

        if (page === "locations") {
            // возвращаемся в список мероприятий
            return set({
                page: "events",
                eventId: null,
                locationId: null,
            });
        }

        // если мы уже на events — ничего не делаем
    },

}));