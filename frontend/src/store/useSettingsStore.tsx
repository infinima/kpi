import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
    theme: "light" | "dark";
    toggleTheme: () => void;
    setTheme: (t: "light" | "dark") => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            theme: "light",
            toggleTheme: () =>
                set({ theme: get().theme === "light" ? "dark" : "light" }),
            setTheme: (t) => set({ theme: t }),
        }),
        {
            name: "settings-store",
        }
    )
);