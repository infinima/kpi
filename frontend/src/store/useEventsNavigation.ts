import {create} from "zustand";
import { useSocketStore } from "@/store";

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

  leagueId: number | null;
  leagueName: string | null;

  tableType: "kvartaly"| "fudzi" | null;

  goEvents: () => void;
  goLocations: (eventId: number, eventName: string) => void;
  goLeagues: (locationId: number, locationName: string) => void;
  goInLeagues: (leagueId: number, leagueName: string) => void;
  goToTables: (tableType: "kvartaly"| "fudzi") => void;

  goBack: () => void;
}

export const useEventsNav = create<EventsNavState>()((set, get) => ({

  page: "events",

  eventId: null,
  eventName: null,

  locationId: null,
  locationName: null,

  leagueId: null,
  leagueName: null,

  tableType: null,

  goEvents: () =>
    set(() => {
      useSocketStore.getState().disconnect();   // ← корректный вызов
      return {
        page: "events",
        eventId: null,
        eventName: null,
        locationId: null,
        locationName: null,
        leagueId: null,
        leagueName: null,
        tableType: null,
      };
    }),

  goLocations: (eventId, eventName) =>
    set(() => {
      useSocketStore.getState().disconnect();
      return {
        page: "locations",
        eventId,
        eventName,
        locationId: null,
        locationName: null,
        leagueId: null,
        leagueName: null,
        tableType: null,
      };
    }),

  goLeagues: (locationId, locationName) =>
    set(() => {
      useSocketStore.getState().disconnect();
      return {
        page: "leagues",
        locationId,
        locationName,
        tableType: null,
      };
    }),

  goInLeagues: (leagueId, leagueName) =>
    set(() => {
      useSocketStore.getState().disconnect();
      return {
        leagueId,
        leagueName,
        tableType: null,
      };
    }),

  goToTables: (tableType) =>
    set(()=> {
      useSocketStore.getState().disconnect();
      return {

      tableType};
    }),

  goBack: () => {
    const { page } = get();

    if (page === "leagues") {
      return set(() => {
        useSocketStore.getState().disconnect();
        return {
          page: "locations",
          locationId: null,
          locationName: null,
          leagueId: null,
          leagueName: null,
          tableType: null,
        };
      });
    }

    if (page === "locations") {
      return set(() => {
        useSocketStore.getState().disconnect();
        return {
          page: "events",
          eventId: null,
          eventName: null,
          locationId: null,
          locationName: null,
          leagueId: null,
          leagueName: null,
          tableType: null,
        };
      });
    }
  },
}));