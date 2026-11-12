import { create } from "zustand";

export type NotificationType = "error" | "warning" | "info" | "success";

export interface Notification {
    id: string;
    type: NotificationType;
    text: string;
    duration?: number | null;
    actionText?: string;
    action?: () => void;
    secondaryActionText?: string;
    secondaryAction?: () => void;
    onDismiss?: () => void;
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

        set({ messages: [newMsg, ...get().messages] });

        if (msg.duration !== null) {
            setTimeout(() => {
                get().removeMessage(id);
            }, msg.duration ?? 2000);
        }
    },

    removeMessage: (id) => {
        const message = get().messages.find((item) => item.id === id);
        set({ messages: get().messages.filter((item) => item.id !== id) });
        message?.onDismiss?.();
    },

    clearAll: () => {
        const messages = get().messages;
        set({ messages: [] });
        messages.forEach((message) => message.onDismiss?.());
    },
}));
