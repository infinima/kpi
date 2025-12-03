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

  // FORM MODAL
  formModalOpen: boolean;
  formConfig: any | null;
  formData: any | null;
  openFormModal: (config: any, data: any | null) => void;
  closeFormModal: () => void;

  // PROFILE
  profileModalOpen: boolean;
  openProfileModal: () => void;
  closeProfileModal: () => void;

  // 🔥 RIGHTS MODAL
  rightsModalOpen: boolean;
  rightsUserId: number | null;
  rightsUserName: string | null;
  openRightsModal: (userId: number, userName: string ) => void;
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

  // PROFILE
  profileModalOpen: false,
  openProfileModal: () => set({ profileModalOpen: true }),
  closeProfileModal: () => set({ profileModalOpen: false }),

  // 🔥 RIGHTS MODAL (новое)
  rightsModalOpen: false,
  rightsUserId: null,
  rightsUserName: null,

  openRightsModal: (userId: number, userName: string) =>
    set({
      rightsModalOpen: true,
      rightsUserId: userId,
      rightsUserName: userName,
    }),

  closeRightsModal: () =>
    set({
      rightsModalOpen: false,
      rightsUserId: null,
      rightsUserName: null,
    }),

  hoveredColumn: null,
  setHoveredColumn: (col) => set({ hoveredColumn: col }),

  dualMode: false,
  toggleDualMode: () => set((state) => ({ dualMode: !state.dualMode })),

  logModal: false,
  logModalId: null,
  logModalName: null,
  openLogModal: (id: number, name: string) => {
    set({ logModal: true, logModalId: id, logModalName: name, logUserModal: false  });
  },
  closeLogModal: () => {
    set({ logModal: false, logModalId: null, logModalName: null });
  },

  logUserModal: false,
  logUserModalId: null,
  openUserLogModal: (id: number) => {
    set({ logUserModal: true, logUserModalId: id, logModal: false });
  },
  closeUserLogModal: () => {
    set({ logUserModal: false, logModalId: null });
  },
}));