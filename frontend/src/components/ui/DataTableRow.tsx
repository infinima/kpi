import { useEffect, useMemo, useState } from "react";
import { Pencil, Save, Trash2, X } from "lucide-react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import OutlineButton from "@/components/ui/OutlineButton";
import type { TableColumnConfig, TableRowData } from "@/components/ui/data-table/types";

type Props = {
    columns: TableColumnConfig[];
    row: TableRowData;
    isCreating?: boolean;
    onSave?: (data: TableRowData) => Promise<void> | void;
    onDelete?: (row: TableRowData) => Promise<void> | void;
    onCreated?: () => void;
    onRowClick?: (row: TableRowData) => Promise<void> | void;
    hideActions?: boolean;
    actionsWidth?: number;
};

function renderValue(value: unknown, column: TableColumnConfig) {
    if (column.type === "select" && column.options) {
        const option = column.options.find((item) => item.value === value);
        return option?.label ?? String(value ?? "");
    }

    return String(value ?? "");
}

export function DataTableRow({
    columns,
    row,
    isCreating = false,
    onSave,
    onDelete,
    onCreated,
    onRowClick,
    hideActions = false,
    actionsWidth = 220,
}: Props) {
    const [draft, setDraft] = useState<TableRowData>(row);
    const [isEditing, setIsEditing] = useState(isCreating);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setDraft(row);
    }, [row]);

    const canSave = useMemo(() => {
        return columns.every((column) => {
            if (!column.required) return true;
            const value = draft[column.key];
            return value !== "" && value !== null && value !== undefined;
        });
    }, [columns, draft]);

    async function handleSave() {
        if (!onSave || !canSave) return;

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

    return (
        <div
            className={`grid items-center gap-2 px-4 py-1 text-[var(--color-text-main)] ${!isEditing && onRowClick ? "cursor-pointer hover:bg-[rgba(148,163,184,0.08)]" : ""}`}
            onClick={isEditing || !onRowClick ? undefined : () => void onRowClick(row)}
            style={{
                gridTemplateColumns: `${columns.map((column) => `${column.width}fr`).join(" ")} ${actionsWidth}px`,
            }}
        >
            {columns.map((column) => (
                <div key={column.key} className="min-w-0">
                    {isEditing && column.editable !== false ? (
                        column.type === "select" ? (
                            <select
                                value={String(draft[column.key] ?? "")}
                                onChange={(event) => setDraft((prev) => ({ ...prev, [column.key]: event.target.value }))}
                                className="block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-1.5 text-sm outline-none"
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
                                type={column.type === "number" ? "number" : column.type === "email" ? "email" : column.type === "date" ? "date" : "text"}
                                value={String(draft[column.key] ?? "")}
                                onChange={(event) => setDraft((prev) => ({ ...prev, [column.key]: event.target.value }))}
                                className="block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-1.5 text-sm outline-none"
                            />
                        )
                    ) : (
                        <div className="truncate text-sm font-medium" title={renderValue(draft[column.key], column)}>
                            {renderValue(draft[column.key], column)}
                        </div>
                    )}
                </div>
            ))}

            <div className="flex items-center justify-end gap-2">
                {hideActions ? null : isEditing ? (
                    <>
                        <PrimaryButton active onClick={() => void handleSave()} disabled={!canSave || loading} className="px-2.5 py-1.5 text-sm shadow-none">
                            <span className="sr-only">Сохранить</span>
                            <Save size={16} />
                        </PrimaryButton>
                        <OutlineButton
                            active
                            onClick={() => {
                                setDraft(row);
                                if (isCreating) {
                                    onCreated?.();
                                } else {
                                    setIsEditing(false);
                                }
                            }}
                            className="px-2.5 py-1.5 text-sm"
                        >
                            <span className="sr-only">Отмена</span>
                            <X size={16} />
                        </OutlineButton>
                    </>
                ) : (
                    <>
                        {onSave ? (
                            <OutlineButton
                                active
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setIsEditing(true);
                                }}
                                className="px-2.5 py-1.5 text-sm shadow-none"
                            >
                                <span className="sr-only">Изменить</span>
                                <Pencil size={16} />
                            </OutlineButton>
                        ) : null}
                        {onDelete ? (
                            <PrimaryButton
                                active
                                onClick={(event) => {
                                    event.stopPropagation();
                                    void onDelete(row);
                                }}
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
