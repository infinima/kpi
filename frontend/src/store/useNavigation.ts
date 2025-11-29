import { create } from "zustand";

export type Page =
    "home" |
    "events" |
    "tables" |
    "logs" |
    "users" |
  "teams";

interface NavigationState {
    currentPage: Page;
    setPage: (p: string) => void;
}

export const useNavigation = create<NavigationState>((set) => ({
    currentPage: "home",
    setPage: (p) => set({ currentPage: p }),
}));