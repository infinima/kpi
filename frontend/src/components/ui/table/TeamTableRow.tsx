import { useMemo, useState } from "react";
import { Pencil, Plus, Save, Trash2, Users, X } from "lucide-react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import OutlineButton from "@/components/ui/OutlineButton";
import { useModalStore } from "@/store";

export type TeamMembersValue = string[];

export type TeamTableRowData = {
    id: number;
    league_id: number;
    league_name: string;
    owner_user_id: number | null;
    owner_full_name: string;
    name: string;
    members: TeamMembersValue;
    appreciations: string[];
    school: string;
    region: string;
    meals_count: number;
    maintainer_full_name: string;
    maintainer_activity: string;
    status: string;
    diploma: string;
    special_nominations: string[];
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
};

type TeamColumnKey =
    | "id"
    | "league_name"
    | "owner_full_name"
    | "name"
    | "members"
    | "appreciations"
    | "school"
    | "region"
    | "meals_count"
    | "maintainer_full_name"
    | "maintainer_activity"
    | "status"
    | "diploma"
    | "special_nominations"
    | "created_at"
    | "updated_at"
    | "deleted_at";

type TeamColumn = {
    key: TeamColumnKey;
    label: string;
    width: number;
    editable?: boolean;
    type?: "text" | "number" | "select";
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

const maintainerActivityOptions = [
    { label: "семинар учителей математики", value: "семинар учителей математики" },
    { label: "экскурсия по Технопарку (платно)", value: "экскурсия по Технопарку (платно)" },
    { label: "мастер-класс в Технопарке (платно)", value: "мастер-класс в Технопарке (платно)" },
    { label: "заниматься своими делами", value: "заниматься своими делами" },
];

const statusLabels: Record<string, string> = {
    IN_RESERVE: "В резерве",
    ON_CHECKING: "На проверке",
    ACCEPTED: "Принята",
    PAID: "Оплачена",
};

const diplomaLabels: Record<string, string> = {
    FIRST_DEGREE: "I степень",
    SECOND_DEGREE: "II степень",
    THIRD_DEGREE: "III степень",
    PARTICIPANT: "Участник",
};

function getMembersPreview(members: TeamMembersValue) {
    const participantNames = members
        .map((participant) => participant.trim())
        .filter(Boolean);

    return participantNames.join(", ");
}

function getMembersSummary(members: TeamMembersValue) {
    const participantNames = members
        .map((participant) => participant.trim())
        .filter(Boolean);

    if (participantNames.length === 0) {
        return "Состав не заполнен";
    }

    return participantNames.join(", ");
}

function formatDateTime(value: string | null) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function displayValue(row: TeamTableRowData, key: TeamColumnKey) {
    switch (key) {
        case "members":
            return `${row.members.filter((participant) => participant.trim()).length} участника`;
        case "appreciations":
            return row.appreciations.join(", ");
        case "special_nominations":
            return row.special_nominations.join(", ");
        case "status":
            return statusLabels[row.status] ?? row.status;
        case "diploma":
            return diplomaLabels[row.diploma] ?? row.diploma;
        case "created_at":
        case "updated_at":
        case "deleted_at":
            return formatDateTime((row[key] as string | null) ?? "");
        default:
            return String(row[key] ?? "");
    }
}

function toCommaSeparated(value: string) {
    return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

function isTeamCellChanged(left: unknown, right: unknown) {
    return JSON.stringify(left ?? null) !== JSON.stringify(right ?? null);
}

export function TeamTableRow({ row, columns, onSave, onDelete, actionsWidth, isCreating = false, onCreated, isColumnEditable }: Props) {
    const [draft, setDraft] = useState<TeamTableRowData>(row);
    const [isEditing, setIsEditing] = useState(isCreating);
    const [loading, setLoading] = useState(false);
    const openModal = useModalStore((state) => state.openModal);

    const canSave = useMemo(() => {
        return Boolean(
            draft.league_id > 0 &&
            draft.name.trim() &&
            draft.school.trim() &&
            draft.region.trim() &&
            draft.maintainer_activity.trim() &&
            draft.members.length === 4 &&
            draft.members.every((participant) => participant.trim())
        );
    }, [draft]);

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

    return (
        <>
            <div
                className={`grid items-center gap-2 px-4 py-1 text-[var(--color-text-main)] hover:bg-[rgba(148,163,184,0.08)] ${
                    row.status === "ON_CHECKING" && !isEditing
                        ? "bg-[rgba(250,204,21,0.10)]"
                        : ""
                }`}
                style={{
                    gridTemplateColumns: `${columns.map((column) => `${column.width}fr`).join(" ")} ${actionsWidth}px`,
                }}
            >
                {columns.map((column) => {
                    if (column.key === "members") {
                        const changed = isCreating || isTeamCellChanged(draft.members, row.members);
                        return (
                            <div key={column.key} className="min-w-0">
                                <button
                                    type="button"
                                    onClick={() => {
                                        openModal("team-members", {
                                            teamName: draft.name,
                                            members: draft.members,
                                            editable: isEditing,
                                            onSave: (members) => {
                                                setDraft((prev) => ({ ...prev, members }));
                                                setIsEditing(true);
                                            },
                                        });
                                    }}
                                    className={`block w-full truncate rounded-xl border px-2.5 py-1.5 text-left text-sm font-medium text-[var(--color-primary)] hover:underline ${
                                        changed
                                            ? "border-amber-300 bg-[rgba(253,224,71,0.16)]"
                                            : "border-transparent"
                                    }`}
                                    title={getMembersPreview(draft.members)}
                                >
                                    {getMembersSummary(draft.members)}
                                </button>
                            </div>
                        );
                    }

                    const editable = isEditing
                        && column.editable !== false
                        && (isColumnEditable ? isColumnEditable(column.key, row) : true);
                    const value = draft[column.key];

                    return (
                        <div key={column.key} className="min-w-0 self-center">
                            {editable ? (
                                (() => {
                                    const changed = isCreating || isTeamCellChanged(value, row[column.key]);
                                    const changedClass = changed
                                        ? "border-amber-300 bg-[rgba(253,224,71,0.16)]"
                                        : "border-[var(--color-border)] bg-[var(--color-background)]";

                                    if (column.type === "select") {
                                        return (
                                            <select
                                                value={String(value ?? "")}
                                                onChange={(event) => {
                                                    setDraft((prev) => ({ ...prev, [column.key]: event.target.value }));
                                                }}
                                                className={`block w-full min-w-0 rounded-xl border px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-primary-light)] ${changedClass}`}
                                            >
                                                <option value="">Выбрать</option>
                                                {column.options?.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        );
                                    }

                                    return (
                                        <input
                                            type={column.key === "league_id" || column.type === "number" ? "number" : "text"}
                                            value={Array.isArray(value) ? value.join(", ") : String(value ?? "")}
                                            onChange={(event) => {
                                                const nextValue = column.key === "appreciations" || column.key === "special_nominations"
                                                    ? toCommaSeparated(event.target.value)
                                                    : column.key === "league_id" || column.type === "number"
                                                        ? Number(event.target.value || 0)
                                                        : event.target.value;
                                                setDraft((prev) => ({ ...prev, [column.key]: nextValue as never }));
                                            }}
                                            className={`block w-full min-w-0 rounded-xl border px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-primary-light)] ${changedClass}`}
                                        />
                                    );
                                })()
                            ) : (
                                <div
                                    className="min-w-0 truncate text-sm font-medium sm:text-[15px]"
                                    title={displayValue(draft, column.key)}
                                >
                                    {displayValue(draft, column.key)}
                                </div>
                            )}
                        </div>
                    );
                })}

                <div className="flex min-w-0 flex-nowrap items-center justify-end gap-2 whitespace-nowrap">
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
                                onClick={() => setIsEditing(true)}
                                disabled={loading}
                                className="px-2.5 py-1.5 text-sm shadow-none"
                            >
                                <span className="sr-only">{isCreating ? "Создать" : "Изменить"}</span>
                                {isCreating ? <Plus size={16} /> : <Pencil size={16} />}
                            </OutlineButton>
                            {!isCreating ? (
                                <PrimaryButton
                                    active
                                    onClick={() => void handleDelete()}
                                    disabled={loading}
                                    className="bg-[var(--color-error)] px-2.5 py-1.5 text-sm shadow-none hover:bg-[color:var(--color-error)]/90"
                                >
                                    <span className="sr-only">Удалить</span>
                                    <Trash2 size={16} />
                                </PrimaryButton>
                            ) : null}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

export const TEAM_TABLE_COLUMNS: TeamColumn[] = [
    { key: "id", label: "ID", width: 0.55, editable: false, type: "number" },
    { key: "league_id", label: "ID лиги", width: 0.8, editable: true, type: "number" },
    { key: "league_name", label: "Лига", width: 1.45, editable: false, type: "text" },
    { key: "owner_full_name", label: "Руководитель", width: 1.7, editable: false, type: "text" },
    { key: "name", label: "Команда", width: 1.6, editable: true, type: "text" },
    { key: "members", label: "Участники", width: 2.6, editable: true, type: "text" },
    { key: "appreciations", label: "Благодарности", width: 1.75, editable: true, type: "text" },
    { key: "school", label: "Учебное заведение", width: 2.2, editable: true, type: "text" },
    { key: "region", label: "Регион", width: 1.25, editable: true, type: "text" },
    { key: "meals_count", label: "Обеды", width: 0.95, editable: true, type: "number" },
    { key: "maintainer_full_name", label: "Сопровождающий", width: 2.1, editable: true, type: "text" },
    { key: "maintainer_activity", label: "Активность", width: 2, editable: true, type: "select", options: maintainerActivityOptions },
    {
        key: "status",
        label: "Статус",
        width: 1.1,
        editable: true,
        type: "select",
        options: [
            { label: "В резерве", value: "IN_RESERVE" },
            { label: "На проверке", value: "ON_CHECKING" },
            { label: "Принята", value: "ACCEPTED" },
            { label: "Оплачена", value: "PAID" },
        ],
    },
    {
        key: "diploma",
        label: "Диплом",
        width: 1.1,
        editable: true,
        type: "select",
        options: [
            { label: "Нет", value: "" },
            { label: "I степень", value: "FIRST_DEGREE" },
            { label: "II степень", value: "SECOND_DEGREE" },
            { label: "III степень", value: "THIRD_DEGREE" },
            { label: "Участник", value: "PARTICIPANT" },
        ],
    },
    { key: "special_nominations", label: "Номинации", width: 1.7, editable: true, type: "text" },
    { key: "created_at", label: "Создание", width: 1.15, editable: false, type: "text" },
    { key: "updated_at", label: "Апдейт", width: 1.15, editable: false, type: "text" },
    { key: "deleted_at", label: "Удалено", width: 1.15, editable: false, type: "text" },
];
