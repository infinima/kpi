import { useNotifications } from "@/store";

type ConfirmOptions = {
    text: string;
    confirmText?: string;
    cancelText?: string;
    type?: "error" | "warning" | "info" | "success";
};

export function confirmWithNotification({
    text,
    confirmText = "Удалить",
    cancelText = "Отмена",
    type = "warning",
}: ConfirmOptions) {
    return new Promise<boolean>((resolve) => {
        let settled = false;

        const finish = (result: boolean) => {
            if (settled) {
                return;
            }

            settled = true;
            resolve(result);
        };

        useNotifications.getState().addMessage({
            type,
            text,
            duration: null,
            actionText: confirmText,
            action: () => finish(true),
            secondaryActionText: cancelText,
            secondaryAction: () => finish(false),
        });
    });
}
