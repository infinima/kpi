import { useEffect, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { useModalStore } from "@/store";

export function FinalNominationsModal() {
    const activeModal = useModalStore((state) => state.activeModal);
    const closeModal = useModalStore((state) => state.closeModal);
    const payload = activeModal?.type === "final-nominations" ? activeModal.payload : null;
    const [nominations, setNominations] = useState<string[]>([]);
    const [newNomination, setNewNomination] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!payload) {
            return;
        }

        setNominations(payload.nominations);
        setNewNomination("");
    }, [payload]);

    if (!payload) {
        return null;
    }

    async function handleSave() {
        setSaving(true);
        try {
            await payload.onSave(nominations);
            closeModal();
        } finally {
            setSaving(false);
        }
    }

    function removeNomination(index: number) {
        setNominations((current) => current.filter((_, currentIndex) => currentIndex !== index));
    }

    function addNomination() {
        const value = newNomination.trim();
        if (!value) {
            return;
        }

        setNominations((current) => [...current, value]);
        setNewNomination("");
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-[28px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.96)] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
                <div className="mb-1 text-xl font-semibold text-[var(--color-text-main)]">Специальные номинации</div>
                <div className="mb-4 text-sm text-[var(--color-text-secondary)]">{payload.teamName}</div>

                <div className="space-y-2">
                    {nominations.length === 0 ? (
                        <div className="rounded-xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.85)] px-3 py-4 text-sm text-[var(--color-text-secondary)]">
                            Номинаций пока нет.
                        </div>
                    ) : nominations.map((nomination, index) => (
                        <div key={`${nomination}-${index}`} className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.85)] px-3 py-2">
                            <span className="text-sm text-[var(--color-text-main)]">{nomination}</span>
                            <button
                                type="button"
                                onClick={() => removeNomination(index)}
                                className="text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary)]"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-4 flex gap-2">
                    <input
                        value={newNomination}
                        onChange={(event) => setNewNomination(event.target.value)}
                        placeholder="Новая номинация"
                        className="flex-1 rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text-main)] outline-none"
                    />
                    <button
                        type="button"
                        onClick={addNomination}
                        className="inline-flex items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 py-2 text-white transition hover:bg-[var(--color-primary-dark)]"
                    >
                        <Plus size={18} />
                    </button>
                </div>

                <div className="mt-5 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={closeModal}
                        className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-2 text-sm text-[var(--color-text-main)] transition hover:bg-[rgba(248,250,252,0.9)]"
                    >
                        Отмена
                    </button>
                    <button
                        type="button"
                        disabled={saving}
                        onClick={() => void handleSave()}
                        className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm text-white transition hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Check size={16} />
                        Сохранить
                    </button>
                </div>
            </div>
        </div>
    );
}
