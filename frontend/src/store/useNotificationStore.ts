import { create } from "zustand";

export type NotificationType = "error" | "warning" | "info" | "success";

export interface Notification {
    id: string;
    type: NotificationType;
    text: string;
    actionText?: string;
    action?: () => void;
}

interface NotificationState {
    messages: Notification[];

    addMessage: (msg: Omit<Notification, "id">) => void;
    removeMessage: (id: string) => void;
    clearAll: () => void;
}

export const useNotifications = create<NotificationState>((set, get) => ({
    messages: [],

    addMessage: (msg) => {
        const id = crypto.randomUUID();
        const newMsg: Notification = { id, ...msg };

        console.log("[Notify] addMessage:", newMsg);
        set({ messages: [newMsg, ...get().messages] });

        setTimeout(() => {
            console.log("[Notify] auto-remove:", id);
            get().removeMessage(id);
        }, 2000);
    },

    removeMessage: (id) => {
        console.log("[Notify] removeMessage:", id);
        set({ messages: get().messages.filter((m) => m.id !== id) });
    },

    clearAll: () => {
        console.log("[Notify] clearAll");
        set({ messages: [] });
    },
}));