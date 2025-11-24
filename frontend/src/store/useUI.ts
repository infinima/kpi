import { create } from "zustand";

interface UIState {
    mobileMenuOpen: boolean;
    toggleMobileMenu: () => void;
    closeMobileMenu: () => void;

    loginModalOpen: boolean;
    openLoginModal: () => void;
    closeLoginModal: () => void;

    theme: "light" | "dark";
    toggleTheme: () => void;

    editUser: any | null;
    openEditUserModal: (user: any) => void;
    closeEditUserModal: () => void;

}

export const useUI = create<UIState>((set, get) => ({
    // MOBILE MENU
    mobileMenuOpen: false,
    toggleMobileMenu: () =>
        set((s) => ({ mobileMenuOpen: !s.mobileMenuOpen })),
    closeMobileMenu: () => set({ mobileMenuOpen: false }),

    // LOGIN MODAL
    loginModalOpen: false,
    openLoginModal: () => set({ loginModalOpen: true }),
    closeLoginModal: () => set({ loginModalOpen: false }),

    // THEME
    theme: localStorage.getItem("theme") === "dark" ? "dark" : "light",

    toggleTheme: () => {
        const next = get().theme === "dark" ? "light" : "dark";

        set({ theme: next });
        localStorage.setItem("theme", next);

        if (next === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    },

    editUser: null,
    openEditUserModal: (user) => set({ editUser: user }),
    closeEditUserModal: () => set({ editUser: null }),
}));