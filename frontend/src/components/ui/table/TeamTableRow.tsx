import { useEffect, useMemo, useState } from "react";
import { CircleEllipsis, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import OutlineButton from "@/components/ui/OutlineButton";
import { useModalStore } from "@/store";
import { confirmWithNotification } from "@/utils/confirmWithNotification";

export type TeamMembersValue = string[];

export type TeamTableRowData = {
    id: number;
    league_id: number;
    league_name: string;
    owner_user_id: number | null;
    owner_full_name: string;
    owner_email?: string | null;
    owner_phone_number?: string | null;
    name: string;
    members: TeamMembersValue;
    appreciations: string[];
    school: string;
    region: string;
    meals_count: number;
    maintainer_full_name: string;
    maintainer_activity: string;
    status: string;
    payment_link?: string | number | null;
    diploma: string;
    special_nominations: string[];
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
};

type TeamColumnKey = "id" | "league_name" | "name" | "school" | "maintainer_activity" | "status";

type TeamColumn = {
    key: TeamColumnKey;
    label: string;
    width: number;
    editable?: boolean;
    type?: "text" | "select";
    options?: Array<{ label: string; value: string }>;
};

type Props = {
    row: TeamTableRowData;
    columns: TeamColumn[];
    onSave: (row: TeamTableRowData) => Promise<void> | void;
    onDelete: (row: TeamTableRowData) => Promise<void> | void;
    actionsWidth: number;
    isCreating?: boolean;
    onCreated?: () => void;
    isColumnEditable?: (columnKey: keyof TeamTableRowData, row: TeamTableRowData) => boolean;
};

export const teamStatusLabels: Record<string, string> = {
    IN_RESERVE: "В резерве",
    ON_CHECKING: "На проверке",
    ACCEPTED: "Принята",
    PAID: "Оплачена",
};

export function getTeamColumnDisplayValue(row: TeamTableRowData, column: TeamColumn): string {
    const value = row[column.key];

    if (column.key === "status") {
        return teamStatusLabels[String(value)] ?? String(value ?? "");
    }

    return String(value ?? "");
}

function isTeamCellChanged(left: unknown, right: unknown) {
    return JSON.stringify(left ?? null) !== JSON.stringify(right ?? null);
}

export function TeamTableRow({ row, columns, onSave, onDelete, actionsWidth, isCreating = false, onCreated, isColumnEditable }: Props) {
    const [draft, setDraft] = useState<TeamTableRowData>(row);
    const [isEditing, setIsEditing] = useState(isCreating);
    const [loading, setLoading] = useState(false);
    const openModal = useModalStore((state) => state.openModal);

    const canSave = useMemo(() => Boolean(draft.name.trim()), [draft.name]);
    const rowBaseBackgroundClass = row.status === "ON_CHECKING" && !isEditing
        ? "bg-[rgba(250,204,21,0.10)]"
        : "bg-[rgba(255,255,255,0.96)]";
    const rowHoverClass = !isEditing ? "hover:bg-[rgba(148,163,184,0.08)]" : "";
    const stickyBackgroundClass = row.status === "ON_CHECKING" && !isEditing
        ? "bg-[rgba(250,204,21,0.10)] group-hover:bg-[rgba(148,163,184,0.08)]"
        : "bg-[rgba(255,255,255,0.96)] group-hover:bg-[rgba(148,163,184,0.08)]";

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
        if (!await confirmWithNotification({ text: "Точно удалить?" })) {
            return;
        }

        try {
            setLoading(true);
            await onDelete(row);
        } finally {
            setLoading(false);
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
                                    onChange={(event) => setDraft((prev) => ({ ...prev, [column.key]: event.target.value }))}
                                    className={`block w-full min-w-0 rounded-xl border px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-primary-light)] ${
                                        isCreating || isTeamCellChanged(value, row[column.key])
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
                                    onChange={(event) => setDraft((prev) => ({ ...prev, [column.key]: event.target.value }))}
                                    className={`block w-full min-w-0 rounded-xl border px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-primary-light)] ${
                                        isCreating || isTeamCellChanged(value, row[column.key])
                                            ? "border-amber-300 bg-[rgba(253,224,71,0.16)]"
                                            : "border-[var(--color-border)] bg-[var(--color-background)]"
                                    }`}
                                />
                            )
                        ) : (
                            <div className="min-w-0 truncate text-sm font-medium sm:text-[15px]">
                                {getTeamColumnDisplayValue(draft, column)}
                            </div>
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
                        <OutlineButton
                            active
                            onClick={() => {
                                openModal("team-info", {
                                    row: draft,
                                    canEditRestrictedFields: isColumnEditable ? isColumnEditable("status", row) : true,
                                    onSave,
                                });
                            }}
                            className="h-9 w-9 px-0 py-0 text-sm shadow-none"
                        >
                            <span className="sr-only">Инфо</span>
                            <CircleEllipsis size={16} />
                        </OutlineButton>
                        <OutlineButton
                            active
                            onClick={() => setIsEditing(true)}
                            disabled={loading}
                            className="h-9 w-9 px-0 py-0 text-sm shadow-none"
                        >
                            <span className="sr-only">{isCreating ? "Создать" : "Изменить"}</span>
                            {isCreating ? <Plus size={16} /> : <Pencil size={16} />}
                        </OutlineButton>
                        {!isCreating ? (
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
    { key: "name", label: "Команда", width: 220, editable: true, type: "text" },
    { key: "school", label: "Образовательная организация", width: 260, editable: true, type: "text" },
    { key: "maintainer_activity", label: "Активность сопровождающего", width: 240, editable: true, type: "text" },
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
            { label: "Оплачена", value: "PAID" },
        ],
    },
];
