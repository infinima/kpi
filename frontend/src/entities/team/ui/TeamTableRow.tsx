import type { TeamInfoRequest } from "@/entities/team/model/team";
import OutlineButton from "@/shared/ui/OutlineButton";
import PrimaryButton from "@/shared/ui/PrimaryButton";
import { CircleEllipsis, Pencil, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { Team } from "@/entities/team/model/team";
export type { TeamMembersValue } from "@/entities/team/model/team";
export type TeamTableRowData = Team;

export type TeamColumnKey = keyof TeamTableRowData;

export type TeamColumn = {
    key: TeamColumnKey;
    label: string;
    width: number;
    editable?: boolean;
    type?: "text" | "select";
    options?: Array<{ label: string; value: string; }>;
};

type Props = {
    onInfo?: (request: TeamInfoRequest) => void;
    row: TeamTableRowData;
    columns: TeamColumn[];
    onSave: (row: TeamTableRowData) => Promise<void> | void;
    onDelete: (row: TeamTableRowData) => Promise<void> | void;
    onCheckPayment?: (row: TeamTableRowData) => Promise<TeamTableRowData | void> | TeamTableRowData | void;
    actionsWidth: number;
    isCreating?: boolean;
    onCreated?: () => void;
    isColumnEditable?: (columnKey: keyof TeamTableRowData, row: TeamTableRowData) => boolean;
};

export const teamStatusLabels: Record<string, string> = {
    IN_RESERVE: "В резерве",
    ON_CHECKING: "На проверке",
    ACCEPTED: "Принята",
    ARRIVED: "Прибыла",
    DOCUMENTS_SUBMITTED: "Сдала документы",
};

export function getTeamColumnDisplayValue(row: TeamTableRowData, column: TeamColumn): string {
    const value = row[column.key];

    if (column.key === "is_paid") return value ? "Да" : "Нет";
    if (Array.isArray(value)) {
        return value.join(", ");
    }

    if (column.key === "status") {
        return teamStatusLabels[String(value)] ?? String(value ?? "");
    }

    return String(value ?? "");
}

function isTeamCellChanged(left: unknown, right: unknown) {
    return JSON.stringify(left ?? null) !== JSON.stringify(right ?? null);
}

export function TeamTableRow({
    row,
    columns,
    onSave,
    onDelete,
    onCheckPayment,
    actionsWidth,
    isCreating = false,
    onCreated,
    isColumnEditable,
    onInfo,
}: Props) {
    const [draft, setDraft] = useState<TeamTableRowData>(row);
    const [isEditing, setIsEditing] = useState(isCreating);
    const [loading, setLoading] = useState(false);
    const [checkingPayment, setCheckingPayment] = useState(false);

    const canSave = useMemo(() => Boolean(draft.name.trim()), [draft.name]);
    const canEditRow = isCreating || (isColumnEditable ? Boolean(row.editable_fields?.length) || isColumnEditable("status", row) : true);
    const rowBaseBackgroundClass = row.status === "ON_CHECKING" && !isEditing
        ? "bg-[rgba(250,204,21,0.10)]"
        : "bg-[rgba(255,255,255,0.96)]";
    const rowHoverClass = !isEditing ? "hover:bg-[rgba(148,163,184,0.08)]" : "";

    useEffect(() => {
        setDraft(row);
    }, [row]);

    function resetDraft() {
        setDraft(row);
    }

    async function handleSave() {
        if (!canSave) {
            return;
        }

        try {
            setLoading(true);
            await onSave(draft);
            if (isCreating) {
                onCreated?.();
            } else {
                setIsEditing(false);
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        try {
            setLoading(true);
            await onDelete(row);
        } finally {
            setLoading(false);
        }
    }

    async function handleCheckPayment() {
        if (!onCheckPayment) {
            return;
        }

        try {
            setCheckingPayment(true);
            const updated = await onCheckPayment(draft);
            if (updated) {
                setDraft(updated);
            }
        } finally {
            setCheckingPayment(false);
        }
    }

    return (
        <div
            className={`group grid items-center gap-0 px-4 py-1 text-[var(--color-text-main)] ${rowBaseBackgroundClass} ${rowHoverClass}`}
            style={{
                gridTemplateColumns: `${columns.map((column) => `${column.width}px`).join(" ")} ${actionsWidth}px`,
            }}
        >
            {columns.map((column) => {
                const editable = isEditing
                    && column.editable !== false
                    && (isColumnEditable ? isColumnEditable(column.key, row) : true);
                const value = draft[column.key];

                return (
                    <div key={column.key} className="min-w-0 self-center px-1">
                        {editable ? (
                            column.type === "select" ? (
                                <select
                                    value={String(value ?? "")}
                                    onChange={(event) => setDraft((prev) => ({ ...prev, [column.key]: column.key === "is_paid" ? event.target.value === "true" : event.target.value }))}
                                    className={`block w-full min-w-0 rounded-xl border px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-primary-light)] ${isCreating || isTeamCellChanged(value, row[column.key])
                                        ? "border-amber-300 bg-[rgba(253,224,71,0.16)]"
                                        : "border-[var(--color-border)] bg-[var(--color-background)]"
                                        }`}
                                >
                                    <option value="">Выбрать</option>
                                    {column.options?.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    value={String(value ?? "")}
                                    onChange={(event) => setDraft((prev) => ({ ...prev, [column.key]: column.key === "is_paid" ? event.target.value === "true" : event.target.value }))}
                                    className={`block w-full min-w-0 rounded-xl border px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-primary-light)] ${isCreating || isTeamCellChanged(value, row[column.key])
                                        ? "border-amber-300 bg-[rgba(253,224,71,0.16)]"
                                        : "border-[var(--color-border)] bg-[var(--color-background)]"
                                        }`}
                                />
                            )
                        ) : (
                            column.key === "payment_link" && value ? (
                                <a
                                    href={String(value)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block min-w-0 truncate text-sm text-[rgb(29,78,216)] underline decoration-[rgb(29,78,216)] underline-offset-2 transition hover:text-[rgb(30,64,175)] hover:decoration-[rgb(30,64,175)] sm:text-[15px]"
                                >
                                    {String(value)}
                                </a>
                            ) : (
                                <div className="min-w-0 truncate text-sm font-medium sm:text-[15px]">
                                    {getTeamColumnDisplayValue(draft, column)}
                                </div>
                            )
                        )}
                    </div>
                );
            })}

            <div className={`sticky right-0 z-10 flex min-w-0 flex-nowrap items-center justify-end gap-2 whitespace-nowrap pl-3 pr-3 `}>
                {isEditing ? (
                    <>
                        <PrimaryButton
                            active
                            onClick={() => void handleSave()}
                            disabled={!canSave || loading}
                            className="px-2.5 py-1.5 text-sm shadow-none"
                        >
                            <span className="sr-only">Сохранить</span>
                            <Save size={16} />
                        </PrimaryButton>
                        <OutlineButton
                            active
                            onClick={() => {
                                resetDraft();
                                if (isCreating) {
                                    onCreated?.();
                                } else {
                                    setIsEditing(false);
                                }
                            }}
                            disabled={loading}
                            className="px-2.5 py-1.5 text-sm"
                        >
                            <span className="sr-only">Отмена</span>
                            <X size={16} />
                        </OutlineButton>
                    </>
                ) : (
                    <>
                        {!isCreating && row.status === "ACCEPTED" && onCheckPayment ? (
                            <OutlineButton
                                active
                                onClick={() => void handleCheckPayment()}
                                disabled={loading || checkingPayment}
                                className="h-9 w-9 px-0 py-0 text-sm shadow-none"
                            >
                                <span className="sr-only">Проверить оплату</span>
                                <RefreshCw size={16} className={checkingPayment ? "animate-spin" : ""} />
                            </OutlineButton>
                        ) : null}
                        <OutlineButton
                            active
                            onClick={() => {
                                onInfo?.({
                                    row: draft,
                                    canEdit: canEditRow,
                                    onSave,
                                    onCheckPayment,
                                });
                            }}
                            className="h-9 w-9 px-0 py-0 text-sm shadow-none"
                        >
                            <span className="sr-only">Инфо</span>
                            <CircleEllipsis size={16} />
                        </OutlineButton>
                        {canEditRow ? (
                            <OutlineButton
                                active
                                onClick={() => setIsEditing(true)}
                                disabled={loading}
                                className="h-9 w-9 px-0 py-0 text-sm shadow-none"
                            >
                                <span className="sr-only">{isCreating ? "Создать" : "Изменить"}</span>
                                {isCreating ? <Plus size={16} /> : <Pencil size={16} />}
                            </OutlineButton>
                        ) : null}
                        {!isCreating && row.can_manage ? (
                            <PrimaryButton
                                active
                                onClick={() => void handleDelete()}
                                disabled={loading}
                                className="h-9 w-9 bg-[var(--color-error)] px-0 py-0 text-sm shadow-none hover:bg-[color:var(--color-error)]/90"
                            >
                                <span className="sr-only">Удалить</span>
                                <Trash2 size={16} />
                            </PrimaryButton>
                        ) : null}
                    </>
                )}
            </div>
        </div>
    );
}

export const TEAM_TABLE_COLUMNS: TeamColumn[] = [
    { key: "id", label: "ID", width: 80, editable: false, type: "text" },
    { key: "league_name", label: "Лига", width: 200, editable: false, type: "text" },
    { key: "league_id", label: "ID лиги", width: 110, editable: true, type: "text" },
    { key: "name", label: "Команда", width: 220, editable: true, type: "text" },
    { key: "owner_full_name", label: "Руководитель", width: 220, editable: false, type: "text" },
    { key: "owner_email", label: "Email руководителя", width: 240, editable: false, type: "text" },
    { key: "owner_phone_number", label: "Телефон руководителя", width: 190, editable: false, type: "text" },
    { key: "members", label: "Участники", width: 320, editable: false, type: "text" },
    { key: "texts", label: "Тексты", width: 260, editable: false, type: "text" },
    { key: "appreciations", label: "Благодарности", width: 260, editable: false, type: "text" },
    { key: "is_paid", label: "Оплачена", width: 120, editable: true, type: "select", options: [{ label: "Да", value: "true" }, { label: "Нет", value: "false" }] },
    { key: "school", label: "Образовательная организация", width: 260, editable: true, type: "text" },
    { key: "region", label: "Регион", width: 180, editable: true, type: "text" },
    { key: "maintainer_full_name", label: "Сопровождающий", width: 220, editable: true, type: "text" },
    { key: "maintainer_activity", label: "Активность сопровождающего", width: 240, editable: true, type: "text" },
    { key: "meals_count", label: "Обеды", width: 100, editable: true, type: "text" },
    {
        key: "status",
        label: "Статус",
        width: 150,
        editable: true,
        type: "select",
        options: [
            { label: "В резерве", value: "IN_RESERVE" },
            { label: "На проверке", value: "ON_CHECKING" },
            { label: "Принята", value: "ACCEPTED" },
            { label: "Прибыли", value: "ARRIVED" },
            { label: "Сдала документы", value: "DOCUMENTS_SUBMITTED" },
        ],
    },
    {
        key: "diploma",
        label: "Диплом",
        width: 150,
        editable: true,
        type: "text",
    },
    { key: "special_nominations", label: "Номинации", width: 240, editable: false, type: "text" },
    { key: "payment_link", label: "Ссылка на оплату", width: 260, editable: false, type: "text" },
    { key: "created_at", label: "Создано", width: 180, editable: false, type: "text" },
    { key: "updated_at", label: "Обновлено", width: 180, editable: false, type: "text" },
    { key: "deleted_at", label: "Удалено", width: 180, editable: false, type: "text" },
];
