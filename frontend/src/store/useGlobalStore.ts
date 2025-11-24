import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TableType = "fudzi" | "kvartaly" | "results";

interface GlobalState {
    eventId: string | null;
    locationId: string | null;
    leagueId: string | null;
    tableId: TableType | null;

    setEventId: (id: string | null) => void;
    setLocationId: (id: string | null) => void;
    setLeagueId: (id: string | null) => void;
    setTableId: (id: TableType | null) => void;
    resetAll: () => void;
}

export const useGlobalStore = create<GlobalState>()(
    persist(
        (set) => ({
            eventId: null,
            locationId: null,
            leagueId: null,
            tableId: null,

            setEventId: (id) => set({ eventId: id }),
            setLocationId: (id) => set({ locationId: id }),
            setLeagueId: (id) => set({ leagueId: id }),
            setTableId: (id) => set({ tableId: id }),

            resetAll: () =>
                set({
                    eventId: null,
                    locationId: null,
                    leagueId: null,
                    tableId: null,
                }),
        }),
        {
            name: "global-store",
        }
    )
);