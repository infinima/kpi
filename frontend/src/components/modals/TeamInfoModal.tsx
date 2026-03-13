import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import OutlineButton from "@/components/ui/OutlineButton";
import type { TeamTableRowData } from "@/components/ui/table/TeamTableRow";
import { useModalStore } from "@/store";

function formatDateTime(value: string | null | undefined) {
    if (!value) {
        return "Не указано";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

const statusOptions = [
    { label: "В резерве", value: "IN_RESERVE" },
    { label: "На проверке", value: "ON_CHECKING" },
    { label: "Принята", value: "ACCEPTED" },
    { label: "Оплачена", value: "PAID" },
];

const diplomaOptions = [
    { label: "Нет", value: "" },
    { label: "I степень", value: "FIRST_DEGREE" },
    { label: "II степень", value: "SECOND_DEGREE" },
    { label: "III степень", value: "THIRD_DEGREE" },
    { label: "Участник", value: "PARTICIPANT" },
];

const maintainerActivityOptions = [
    { label: "семинар учителей математики", value: "семинар учителей математики" },
    { label: "экскурсия по Технопарку (платно)", value: "экскурсия по Технопарку (платно)" },
    { label: "мастер-класс в Технопарке (платно)", value: "мастер-класс в Технопарке (платно)" },
    { label: "заниматься своими делами", value: "заниматься своими делами" },
];

function ReadField({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4">
            <div className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
                {label}
            </div>
            <div className="mt-2 text-sm font-medium text-[var(--color-text-main)]">
                {value || "Не указано"}
            </div>
        </div>
    );
}

function inputClassName(changed: boolean) {
    return `w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-[var(--color-primary-light)] ${
        changed
            ? "border-amber-300 bg-[rgba(253,224,71,0.16)]"
            : "border-[var(--color-border)] bg-[var(--color-background)]"
    }`;
}

function isChanged(left: unknown, right: unknown) {
    return JSON.stringify(left ?? null) !== JSON.stringify(right ?? null);
}

function buildTextAreaValue(values: string[]) {
    return values.join("\n");
}

function parseTextAreaValue(value: string) {
    return value
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
}

export function TeamInfoModal() {
    const activeModal = useModalStore((state) => state.activeModal);
    const closeModal = useModalStore((state) => state.closeModal);

    const payload = activeModal?.type === "team-info" ? activeModal.payload : null;
    const [draft, setDraft] = useState<TeamTableRowData | null>(payload?.row ?? null);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setDraft(payload?.row ?? null);
        setIsEditing(false);
    }, [payload]);

    const canSave = useMemo(() => {
        if (!draft) {
            return false;
        }

        return Boolean(
            draft.name.trim() &&
            draft.school.trim() &&
            draft.region.trim() &&
            draft.maintainer_activity.trim() &&
            draft.members.length === 4 &&
            draft.members.every((member) => member.trim())
        );
    }, [draft]);

    if (!payload || !draft) {
        return null;
    }

    async function handleSave() {
        if (!canSave) {
            return;
        }

        try {
            setSaving(true);
            await payload.onSave(draft);
            closeModal();
        } finally {
            setSaving(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-[250] flex items-center justify-center bg-[rgba(15,23,42,0.40)] p-4 backdrop-blur-sm"
            onClick={closeModal}
        >
            <div
                className="flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col rounded-[28px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.96)] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.20)]"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="text-xl font-semibold text-[var(--color-text-main)]">
                            {draft.name || "Команда"}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-sm text-[var(--color-text-secondary)]">
                            <span>{draft.league_name || "Лига не указана"}</span>
                            <span>•</span>
                            <span>{statusOptions.find((option) => option.value === draft.status)?.label ?? draft.status ?? "Неизвестно"}</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={closeModal}
                        className="rounded-lg p-2 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)]"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="mt-6 grid flex-1 gap-4 overflow-y-auto pr-1 lg:grid-cols-2">
                    <ReadField label="ID" value={String(draft.id)} />
                    <ReadField label="Руководитель" value={draft.owner_full_name || "Не указан"} />
                    <ReadField label="Создано" value={formatDateTime(draft.created_at)} />
                    <ReadField label="Обновлено" value={formatDateTime(draft.updated_at)} />

                    <label className="block space-y-2 rounded-2xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4">
                        <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">ID лиги</span>
                        <input
                            type="number"
                            min={1}
                            value={draft.league_id}
                            readOnly={!isEditing || !payload.canEditRestrictedFields}
                            onChange={(event) => setDraft((prev) => prev ? { ...prev, league_id: Number(event.target.value || 0) } : prev)}
                            className={inputClassName(isChanged(draft.league_id, payload.row.league_id))}
                        />
                    </label>

                    <ReadField label="Лига" value={draft.league_name} />

                    <label className="block space-y-2 rounded-2xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4">
                        <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Название команды</span>
                        <input
                            value={draft.name}
                            readOnly={!isEditing}
                            onChange={(event) => setDraft((prev) => prev ? { ...prev, name: event.target.value } : prev)}
                            className={inputClassName(isChanged(draft.name, payload.row.name))}
                        />
                    </label>

                    <label className="block space-y-2 rounded-2xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4">
                        <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Статус</span>
                        <select
                            value={draft.status}
                            disabled={!isEditing || !payload.canEditRestrictedFields}
                            onChange={(event) => setDraft((prev) => prev ? { ...prev, status: event.target.value } : prev)}
                            className={inputClassName(isChanged(draft.status, payload.row.status))}
                        >
                            {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block space-y-2 rounded-2xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4 lg:col-span-2">
                        <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Участники</span>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {draft.members.map((member, index) => (
                                <input
                                    key={index}
                                    value={member}
                                    readOnly={!isEditing}
                                    onChange={(event) => setDraft((prev) => prev ? {
                                        ...prev,
                                        members: prev.members.map((item, itemIndex) => itemIndex === index ? event.target.value : item),
                                    } : prev)}
                                    placeholder={`Участник ${index + 1}`}
                                    className={inputClassName(isChanged(member, payload.row.members[index] ?? ""))}
                                />
                            ))}
                        </div>
                    </label>

                    <label className="block space-y-2 rounded-2xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4">
                        <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Учебное заведение</span>
                        <input
                            value={draft.school}
                            readOnly={!isEditing}
                            onChange={(event) => setDraft((prev) => prev ? { ...prev, school: event.target.value } : prev)}
                            className={inputClassName(isChanged(draft.school, payload.row.school))}
                        />
                    </label>

                    <label className="block space-y-2 rounded-2xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4">
                        <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Регион</span>
                        <input
                            value={draft.region}
                            readOnly={!isEditing}
                            onChange={(event) => setDraft((prev) => prev ? { ...prev, region: event.target.value } : prev)}
                            className={inputClassName(isChanged(draft.region, payload.row.region))}
                        />
                    </label>

                    <label className="block space-y-2 rounded-2xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4">
                        <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Сопровождающий</span>
                        <input
                            value={draft.maintainer_full_name}
                            readOnly={!isEditing}
                            onChange={(event) => setDraft((prev) => prev ? { ...prev, maintainer_full_name: event.target.value } : prev)}
                            className={inputClassName(isChanged(draft.maintainer_full_name, payload.row.maintainer_full_name))}
                        />
                    </label>

                    <label className="block space-y-2 rounded-2xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4">
                        <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Активность</span>
                        <select
                            value={draft.maintainer_activity}
                            disabled={!isEditing}
                            onChange={(event) => setDraft((prev) => prev ? { ...prev, maintainer_activity: event.target.value } : prev)}
                            className={inputClassName(isChanged(draft.maintainer_activity, payload.row.maintainer_activity))}
                        >
                            <option value="">Не выбрано</option>
                            {maintainerActivityOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block space-y-2 rounded-2xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4">
                        <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Обеды</span>
                        <input
                            type="number"
                            min={0}
                            value={draft.meals_count}
                            readOnly={!isEditing}
                            onChange={(event) => setDraft((prev) => prev ? { ...prev, meals_count: Number(event.target.value || 0) } : prev)}
                            className={inputClassName(isChanged(draft.meals_count, payload.row.meals_count))}
                        />
                    </label>

                    <label className="block space-y-2 rounded-2xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4">
                        <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Диплом</span>
                        <select
                            value={draft.diploma}
                            disabled={!isEditing || !payload.canEditRestrictedFields}
                            onChange={(event) => setDraft((prev) => prev ? { ...prev, diploma: event.target.value } : prev)}
                            className={inputClassName(isChanged(draft.diploma, payload.row.diploma))}
                        >
                            {diplomaOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block space-y-2 rounded-2xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4 lg:col-span-2">
                        <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Благодарности</span>
                        <textarea
                            rows={4}
                            value={buildTextAreaValue(draft.appreciations)}
                            readOnly={!isEditing}
                            onChange={(event) => setDraft((prev) => prev ? { ...prev, appreciations: parseTextAreaValue(event.target.value) } : prev)}
                            className={`${inputClassName(isChanged(draft.appreciations, payload.row.appreciations))} resize-none`}
                        />
                    </label>

                    <label className="block space-y-2 rounded-2xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4 lg:col-span-2">
                        <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Номинации</span>
                        <textarea
                            rows={3}
                            value={buildTextAreaValue(draft.special_nominations)}
                            readOnly={!isEditing || !payload.canEditRestrictedFields}
                            onChange={(event) => setDraft((prev) => prev ? { ...prev, special_nominations: parseTextAreaValue(event.target.value) } : prev)}
                            className={`${inputClassName(isChanged(draft.special_nominations, payload.row.special_nominations))} resize-none`}
                        />
                    </label>
                </div>

                <div className="mt-5 flex justify-end gap-2 border-t border-[var(--color-border)] pt-4">
                    <OutlineButton active onClick={closeModal}>
                        Закрыть
                    </OutlineButton>
                    {!isEditing ? (
                        <OutlineButton active onClick={() => setIsEditing(true)}>
                            Изменить
                        </OutlineButton>
                    ) : null}
                    {isEditing ? (
                        <PrimaryButton active loading={saving} loadingText="Сохраняем..." onClick={() => void handleSave()} disabled={!canSave}>
                            Сохранить
                        </PrimaryButton>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
