import { useEffect, useMemo, useState } from "react";
import { Users, X } from "lucide-react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import OutlineButton from "@/components/ui/OutlineButton";
import type { TeamMembersValue } from "@/components/ui/table/TeamTableRow";
import { useModalStore } from "@/store";

function createEmptyMembers(): TeamMembersValue {
    return {
        coach: {
            email: "",
            full_name: "",
        },
        participants: Array.from({ length: 4 }, () => ({
            school: "",
            full_name: "",
        })),
    };
}

export function TeamMembersModal() {
    const activeModal = useModalStore((state) => state.activeModal);
    const closeModal = useModalStore((state) => state.closeModal);

    const payload = activeModal?.type === "team-members" ? activeModal.payload : null;

    const initialMembers = useMemo(() => {
        if (!payload) {
            return createEmptyMembers();
        }

        return {
            coach: {
                email: payload.members.coach.email ?? "",
                full_name: payload.members.coach.full_name ?? "",
            },
            participants: Array.from({ length: 4 }, (_, index) => ({
                school: payload.members.participants[index]?.school ?? "",
                full_name: payload.members.participants[index]?.full_name ?? "",
            })),
        };
    }, [payload]);

    const [members, setMembers] = useState<TeamMembersValue>(initialMembers);
    const [isEditing, setIsEditing] = useState(Boolean(payload?.editable));

    useEffect(() => {
        setMembers(initialMembers);
        setIsEditing(Boolean(payload?.editable));
    }, [initialMembers, payload?.editable]);

    if (!payload) {
        return null;
    }

    const editable = Boolean(payload.onSave);

    const handleClose = () => {
        closeModal();
    };

    const handleSave = () => {
        payload.onSave?.({
            coach: {
                email: members.coach.email.trim(),
                full_name: members.coach.full_name.trim(),
            },
            participants: members.participants.map((participant) => ({
                school: participant.school.trim(),
                full_name: participant.full_name.trim(),
            })),
        });
        closeModal();
    };

    return (
        <div
            className="fixed inset-0 z-[250] flex items-center justify-center bg-[rgba(15,23,42,0.40)] p-4 backdrop-blur-sm"
            onClick={handleClose}
        >
            <div
                className="w-full max-w-lg rounded-[28px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.96)] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.20)]"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Users size={18} className="text-[var(--color-primary)]" />
                        <div>
                            <div className="text-lg font-semibold text-[var(--color-text-main)]">
                                Участники команды
                            </div>
                            <div className="text-sm text-[var(--color-text-secondary)]">
                                {payload.teamName || "Без названия"}
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-lg p-2 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)]"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="mt-5 space-y-5">
                    <div className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4">
                        <div className="text-sm font-semibold text-[var(--color-text-main)]">
                            Тренер
                        </div>
                        <label className="block space-y-2">
                            <span className="text-sm text-[var(--color-text-secondary)]">ФИО</span>
                            <input
                                value={members.coach.full_name}
                                onChange={(event) => {
                                    setMembers((prev) => ({
                                        ...prev,
                                        coach: {
                                            ...prev.coach,
                                            full_name: event.target.value,
                                        },
                                    }));
                                }}
                                readOnly={!isEditing}
                                className="block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary-light)]"
                            />
                        </label>
                    </div>

                    <div className="space-y-3">
                        {members.participants.map((participant, index) => (
                            <div
                                key={index}
                                className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4"
                            >
                                <div className="text-sm font-semibold text-[var(--color-text-main)]">
                                    Участник {index + 1}
                                </div>
                                <label className="block space-y-2">
                                    <span className="text-sm text-[var(--color-text-secondary)]">ФИО</span>
                                    <input
                                        value={participant.full_name}
                                        onChange={(event) => {
                                            setMembers((prev) => ({
                                                ...prev,
                                                participants: prev.participants.map((item, itemIndex) => itemIndex === index ? {
                                                    ...item,
                                                    full_name: event.target.value,
                                                } : item),
                                            }));
                                        }}
                                        readOnly={!isEditing}
                                        className="block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary-light)]"
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-5 flex justify-end gap-2">
                    <OutlineButton active onClick={handleClose}>
                        Закрыть
                    </OutlineButton>
                    {!isEditing && editable ? (
                        <OutlineButton active onClick={() => setIsEditing(true)}>
                            Изменить
                        </OutlineButton>
                    ) : null}
                    {isEditing && editable ? (
                        <PrimaryButton active onClick={handleSave}>
                            Сохранить
                        </PrimaryButton>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
