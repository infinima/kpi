import { X } from "lucide-react";
import { useUI } from "@/store";

export function LogModal() {
    const { logModal, logModalId, logModalName, closeLogModal } = useUI();

    if (!logModal) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-2xl border border-[var(--color-border)] bg-[rgba(255,255,255,0.96)] p-6 shadow-xl">
                <div className="flex items-center justify-between gap-4">
                    <div className="text-lg font-semibold text-[var(--color-text-main)]">
                        Логи {logModalName ? `${logModalName} #${logModalId}` : ""}
                    </div>
                    <button onClick={closeLogModal} className="rounded-lg p-2 hover:bg-[var(--color-hover)]">
                        <X size={18} />
                    </button>
                </div>

                <div className="mt-4 text-sm text-[var(--color-text-secondary)]">
                    Модалка логов будет перенесена на новый слой позже. Сейчас это временная заглушка.
                </div>
            </div>
        </div>
    );
}
