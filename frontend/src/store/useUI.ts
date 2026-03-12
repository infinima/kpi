import { create } from "zustand";
import { useModalStore } from "./useModalStore";

interface UIState {
    mobileMenuOpen: boolean;
    toggleMobileMenu: () => void;
    closeMobileMenu: () => void;

    loginModalOpen: boolean;
    openLoginModal: () => void;
    closeLoginModal: () => void;

    theme: "light" | "dark";
    toggleTheme: () => void;

    formModalOpen: boolean;
    formConfig: any | null;
    formData: any | null;
    openFormModal: (config: any, data: any | null) => void;
    closeFormModal: () => void;

    profileModalOpen: boolean;
    openProfileModal: () => void;
    closeProfileModal: () => void;

    rightsModalOpen: boolean;
    rightsUserId: number | null;
    rightsUserName: string | null;
    openRightsModal: (userId: number, userName: string) => void;
    closeRightsModal: () => void;

    hoveredColumn: number | null;
    setHoveredColumn: (col: number | null) => void;

    dualMode: boolean;
    toggleDualMode: () => void;

    logModal: boolean;
    logModalId: number | null;
    logModalName: string | null;
    openLogModal: (id: number, name: string) => void;
    closeLogModal: () => void;

    logUserModal: boolean;
    logUserModalId: number | null;
    openUserLogModal: (id: number) => void;
    closeUserLogModal: () => void;

    importZuevaOpen: boolean;
    openImportZueva: () => void;
    closeImportZueva: () => void;

    PhotosModal: boolean;
    openPhotoModal: () => void;
    closePhotoModal: () => void;

    logTableModal: boolean;
    logTableModalType: "fudzi" | "kvartaly" | null;
    logTableModalId: number | null;
    openTableLogModal: (type: "fudzi" | "kvartaly", id: number) => void;
    closeTableLogModal: () => void;

    openLeagueAccountsModal: (leagueId: number) => void;
    closeLeagueAccountsModal: () => void;
    leagueAccountsModal: {
        open: boolean;
        leagueId: number | null;
    };
}

function closeAllGlobalModals(set: (partial: Partial<UIState>) => void) {
    set({
        loginModalOpen: false,
        profileModalOpen: false,
        rightsModalOpen: false,
        rightsUserId: null,
        rightsUserName: null,
        logModal: false,
        logModalId: null,
        logModalName: null,
        logUserModal: false,
        logUserModalId: null,
        PhotosModal: false,
        logTableModal: false,
        logTableModalType: null,
        logTableModalId: null,
        leagueAccountsModal: { open: false, leagueId: null },
    });
}

export const useUI = create<UIState>((set, get) => ({
    mobileMenuOpen: false,
    toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
    closeMobileMenu: () => set({ mobileMenuOpen: false }),

    loginModalOpen: false,
    openLoginModal: () => {
        closeAllGlobalModals(set);
        useModalStore.getState().openModal("login");
        set({ loginModalOpen: true });
    },
    closeLoginModal: () => {
        useModalStore.getState().closeModal();
        set({ loginModalOpen: false });
    },

    theme: localStorage.getItem("theme") === "dark" ? "dark" : "light",
    toggleTheme: () => {
        const next = get().theme === "dark" ? "light" : "dark";
        set({ theme: next });
        localStorage.setItem("theme", next);
        document.documentElement.classList.toggle("dark", next === "dark");
    },

    formModalOpen: false,
    formConfig: null,
    formData: null,
    openFormModal: (config, data) => {
        set({
            formModalOpen: true,
            formConfig: config,
            formData: data,
        });
    },
    closeFormModal: () => {
        set({
            formModalOpen: false,
            formConfig: null,
            formData: null,
        });
    },

    profileModalOpen: false,
    openProfileModal: () => {
        closeAllGlobalModals(set);
        useModalStore.getState().openModal("profile");
        set({ profileModalOpen: true });
    },
    closeProfileModal: () => {
        useModalStore.getState().closeModal();
        set({ profileModalOpen: false });
    },

    rightsModalOpen: false,
    rightsUserId: null,
    rightsUserName: null,
    openRightsModal: (userId, userName) => {
        closeAllGlobalModals(set);
        useModalStore.getState().openModal("rights", { userId, userName });
        set({
            rightsModalOpen: true,
            rightsUserId: userId,
            rightsUserName: userName,
        });
    },
    closeRightsModal: () => {
        useModalStore.getState().closeModal();
        set({
            rightsModalOpen: false,
            rightsUserId: null,
            rightsUserName: null,
        });
    },

    hoveredColumn: null,
    setHoveredColumn: (col) => set({ hoveredColumn: col }),

    dualMode: false,
    toggleDualMode: () => set((state) => ({ dualMode: !state.dualMode })),

    logModal: false,
    logModalId: null,
    logModalName: null,
    openLogModal: (id, name) => {
        closeAllGlobalModals(set);
        useModalStore.getState().openModal("log", { id, name });
        set({ logModal: true, logModalId: id, logModalName: name, logUserModal: false });
    },
    closeLogModal: () => {
        useModalStore.getState().closeModal();
        set({ logModal: false, logModalId: null, logModalName: null });
    },

    logUserModal: false,
    logUserModalId: null,
    openUserLogModal: (id) => {
        closeAllGlobalModals(set);
        useModalStore.getState().openModal("user-log", { id });
        set({ logUserModal: true, logUserModalId: id, logModal: false, logModalId: null, logModalName: null });
    },
    closeUserLogModal: () => {
        useModalStore.getState().closeModal();
        set({ logUserModal: false, logUserModalId: null });
    },

    importZuevaOpen: false,
    openImportZueva: () => set({ importZuevaOpen: true }),
    closeImportZueva: () => set({ importZuevaOpen: false }),

    PhotosModal: false,
    openPhotoModal: () => {
        closeAllGlobalModals(set);
        useModalStore.getState().openModal("photos");
        set({ PhotosModal: true });
    },
    closePhotoModal: () => {
        useModalStore.getState().closeModal();
        set({ PhotosModal: false });
    },

    logTableModal: false,
    logTableModalType: null,
    logTableModalId: null,
    openTableLogModal: (type, id) => {
        closeAllGlobalModals(set);
        useModalStore.getState().openModal("table-log", { type, id });
        set({ logTableModal: true, logTableModalType: type, logTableModalId: id });
    },
    closeTableLogModal: () => {
        useModalStore.getState().closeModal();
        set({ logTableModal: false, logTableModalType: null, logTableModalId: null });
    },

    leagueAccountsModal: { open: false, leagueId: null },
    openLeagueAccountsModal: (leagueId) => {
        closeAllGlobalModals(set);
        useModalStore.getState().openModal("league-accounts", { leagueId });
        set({ leagueAccountsModal: { open: true, leagueId } });
    },
    closeLeagueAccountsModal: () => {
        useModalStore.getState().closeModal();
        set({ leagueAccountsModal: { open: false, leagueId: null } });
    },
}));
