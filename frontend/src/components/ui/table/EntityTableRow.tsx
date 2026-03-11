import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, RotateCcw, Save, Trash2, X } from "lucide-react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import OutlineButton from "@/components/ui/OutlineButton";

export type EntityTableRowData = Record<string, string | number | null | undefined>;

export type EntityTableColumn = {
    key: string;
    label: string;
    width: number;
    editable?: boolean;
    required?: boolean;
    searchable?: boolean;
    sortable?: boolean;
    type?: "text" | "number" | "date" | "select";
    options?: Array<{ label: string; value: string }>;
};

type Props = {
    row: EntityTableRowData;
    columns: EntityTableColumn[];
    onSave?: (row: EntityTableRowData) => Promise<void> | void;
    onDelete?: (row: EntityTableRowData) => Promise<void> | void;
    onRestore?: (row: EntityTableRowData) => Promise<void> | void;
    onRowClick?: (row: EntityTableRowData) => Promise<void> | void;
    actionsWidth: number;
    isCreating?: boolean;
    onCreated?: () => void;
};

function renderValue(value: unknown, column: EntityTableColumn) {
    if (column.type === "select" && column.options) {
        const selectedOption = column.options.find((option) => option.value === value);
        return selectedOption?.label ?? String(value ?? "");
    }

    if (column.type === "date" && typeof value === "string" && value) {
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) {
            return date.toLocaleDateString("ru-RU");
        }
    }

    if (typeof value === "string" && value) {
        const date = new Date(value);
        if (!Number.isNaN(date.getTime()) && (value.includes("T") || value.includes(":"))) {
            return date.toLocaleString("ru-RU", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        }
    }

    return String(value ?? "");
}

export function EntityTableRow({
    row,
    columns,
    onSave,
    onDelete,
    onRestore,
    onRowClick,
    actionsWidth,
    isCreating = false,
    onCreated,
}: Props) {
    const [draft, setDraft] = useState<EntityTableRowData>(row);
    const [isEditing, setIsEditing] = useState(isCreating);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setDraft(row);
    }, [row]);

    const canSave = useMemo(() => {
        return columns.every((column) => {
            if (!column.required) {
                return true;
            }

            const value = draft[column.key];
            return value !== "" && value !== null && value !== undefined;
        });
    }, [columns, draft]);

    async function handleSave() {
        if (!onSave || !canSave) {
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
        if (!onDelete) {
            return;
        }

        try {
            setLoading(true);
            await onDelete(row);
        } finally {
            setLoading(false);
        }
    }

    async function handleRestore() {
        if (!onRestore) {
            return;
        }

        try {
            setLoading(true);
            await onRestore(row);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div
            className={`grid items-center gap-2 px-4 py-1 text-[var(--color-text-main)] ${!isEditing && onRowClick ? "cursor-pointer hover:bg-[rgba(148,163,184,0.08)]" : ""}`}
            onClick={isEditing || !onRowClick ? undefined : () => void onRowClick(row)}
            style={{
                gridTemplateColumns: `${columns.map((column) => `${column.width}fr`).join(" ")} ${actionsWidth}px`,
            }}
        >
            {columns.map((column) => (
                <div key={column.key} className="min-w-0 self-center">
                    {isEditing && column.editable !== false ? (
                        column.type === "select" ? (
                            <select
                                value={String(draft[column.key] ?? "")}
                                onChange={(event) => {
                                    setDraft((prev) => ({ ...prev, [column.key]: event.target.value }));
                                }}
                                className="block w-full min-w-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-primary-light)]"
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
                                type={column.type === "number" ? "number" : column.type === "date" ? "date" : "text"}
                                value={String(draft[column.key] ?? "")}
                                onChange={(event) => {
                                    const nextValue = column.type === "number"
                                        ? Number(event.target.value || 0)
                                        : event.target.value;
                                    setDraft((prev) => ({ ...prev, [column.key]: nextValue }));
                                }}
                                className="block w-full min-w-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-primary-light)]"
                            />
                        )
                    ) : (
                        <div className="min-w-0 truncate text-sm font-medium sm:text-[15px]" title={renderValue(draft[column.key], column)}>
                            {renderValue(draft[column.key], column)}
                        </div>
                    )}
                </div>
            ))}

            <div className="flex min-w-0 flex-nowrap items-center justify-end gap-2 whitespace-nowrap">
                {isEditing ? (
                    <>
                        <PrimaryButton
                            active
                            onClick={(event) => {
                                event.stopPropagation();
                                void handleSave();
                            }}
                            disabled={!canSave || loading}
                            className="px-2.5 py-1.5 text-sm shadow-none"
                        >
                            <span className="sr-only">Сохранить</span>
                            <Save size={16} />
                        </PrimaryButton>
                        <OutlineButton
                            active
                            onClick={(event) => {
                                event.stopPropagation();
                                setDraft(row);
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
                        {onRestore ? (
                            <OutlineButton
                                active
                                onClick={(event) => {
                                    event.stopPropagation();
                                    void handleRestore();
                                }}
                                disabled={loading}
                                className="px-2.5 py-1.5 text-sm shadow-none"
                            >
                                <span className="sr-only">Восстановить</span>
                                <RotateCcw size={16} />
                            </OutlineButton>
                        ) : null}
                        {onRestore ? null : onSave ? (
                            <OutlineButton
                                active
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setIsEditing(true);
                                }}
                                disabled={loading}
                                className="px-2.5 py-1.5 text-sm shadow-none"
                            >
                                <span className="sr-only">{isCreating ? "Создать" : "Изменить"}</span>
                                {isCreating ? <Plus size={16} /> : <Pencil size={16} />}
                            </OutlineButton>
                        ) : null}
                        {!isCreating && !onRestore && onDelete ? (
                            <PrimaryButton
                                active
                                onClick={(event) => {
                                    event.stopPropagation();
                                    void handleDelete();
                                }}
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
    );
}
