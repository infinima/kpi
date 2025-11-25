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

    // 🟦 новое для FormModal
    formModalOpen: boolean;
    formConfig: any | null;
    formData: any | null;
    openFormModal: (config: any, data: any | null) => void;
    closeFormModal: () => void;
}

export const useUI = create<UIState>((set, get) => ({
    // MENU
    mobileMenuOpen: false,
    toggleMobileMenu: () =>
        set((s) => ({ mobileMenuOpen: !s.mobileMenuOpen })),
    closeMobileMenu: () => set({ mobileMenuOpen: false }),

    // LOGIN
    loginModalOpen: false,
    openLoginModal: () => set({ loginModalOpen: true }),
    closeLoginModal: () => set({ loginModalOpen: false }),

    // THEME
    theme: localStorage.getItem("theme") === "dark" ? "dark" : "light",
    toggleTheme: () => {
        const next = get().theme === "dark" ? "light" : "dark";
        set({ theme: next });
        localStorage.setItem("theme", next);
        document.documentElement.classList.toggle("dark", next === "dark");
    },

    // FORM MODAL
    formModalOpen: false,
    formConfig: null,
    formData: null,

    openFormModal: (config, data) =>
        set({
            formModalOpen: true,
            formConfig: config,
            formData: data,
        }),

    closeFormModal: () =>
        set({
            formModalOpen: false,
            formConfig: null,
            formData: null,
        }),
}));