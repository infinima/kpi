import React, {useMemo, useState} from "react";
import {Pencil, Trash2, X, Save} from "lucide-react";
import type {TableColumnConfig, TableRowData} from "./data-table/types";
import PrimaryButton from "@/components/ui/PrimaryButton";
import OutlineButton from "@/components/ui/OutlineButton";
import {
    getEmptyValue,
    renderCellValue,
} from "./data-table/utils";

type Props = {
    columns: TableColumnConfig[];
    row: TableRowData;
    isCreating?: boolean;
    onSave?: (data: TableRowData) => Promise<void> | void;
    onDelete?: (row: TableRowData) => Promise<void> | void;
    onCreated?: () => void;
    className?: string;
};

export function DataTableRow({
                                 columns,
                                 row,
                                 isCreating = false,
                                 onSave,
                                 onDelete,
                                 onCreated,
                                 className = "",
                             }: Props) {
    const [isEditing, setIsEditing] = useState(isCreating);
    const [draft, setDraft] = useState<TableRowData>(() => {
        const base: TableRowData = {};

        for (const col of columns) {
            base[col.key] = row[col.key] ?? getEmptyValue(col.type);
        }

        return base;
    });

    const [loading, setLoading] = useState(false);

    const canSave = useMemo(() => {
        return columns.every((col) => {
            if (!col.required) return true;
            const value = draft[col.key];
            return value !== "" && value !== null && value !== undefined;
        });
    }, [columns, draft]);

    const handleChange = (key: string, value: string) => {
        setDraft((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleCancel = () => {
        if (isCreating) {
            setDraft(() => {
                const base: TableRowData = {};
                for (const col of columns) {
                    base[col.key] = getEmptyValue(col.type);
                }
                return base;
            });
            return;
        }

        setDraft(() => {
            const base: TableRowData = {};
            for (const col of columns) {
                base[col.key] = row[col.key] ?? getEmptyValue(col.type);
            }
            return base;
        });

        setIsEditing(false);
    };

    const handleSave = async () => {
        if (!onSave || !canSave) return;

        try {
            setLoading(true);
            await onSave(draft);

            if (!isCreating) {
                setIsEditing(false);
            } else {
                setDraft(() => {
                    const base: TableRowData = {};
                    for (const col of columns) {
                        base[col.key] = getEmptyValue(col.type);
                    }
                    return base;
                });
                onCreated?.();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!onDelete) return;

        try {
            setLoading(true);
            await onDelete(row);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className={`
                grid items-center gap-2 px-4 py-1 text-[var(--color-text-main)]
                ${isCreating ? "bg-[rgba(99,102,241,0.06)]" : "bg-transparent hover:bg-[rgba(148,163,184,0.08)]"}
                ${className}
            `}
            style={{
                gridTemplateColumns: `${columns.map((col) => `${col.width}fr`).join(" ")} 220px`,
            }}
        >
            {columns.map((column) => {
                const editable = column.editable !== false;

                return (
                    <div key={column.key} className="min-w-0 self-center">
                        {isEditing && editable ? (
                            column.type === "select" ? (
                                <select
                                    value={String(draft[column.key] ?? "")}
                                    onChange={(e) => handleChange(column.key, e.target.value)}
                                    className="
                                        block w-full min-w-0 rounded-xl border border-[var(--color-border)]
                                        bg-[var(--color-background)] px-2.5 py-1.5 text-sm outline-none
                                        focus:border-[var(--color-primary-light)]
                                    "
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
                                    type={
                                        column.type === "number"
                                            ? "number"
                                            : column.type === "email"
                                                ? "email"
                                                : column.type === "date"
                                                    ? "date"
                                                    : "text"
                                    }
                                    value={String(draft[column.key] ?? "")}
                                    onChange={(e) => handleChange(column.key, e.target.value)}
                                    placeholder={column.label}
                                    className="
                                        block w-full min-w-0 rounded-xl border border-[var(--color-border)]
                                        bg-[var(--color-background)] px-2.5 py-1.5 text-sm outline-none
                                        focus:border-[var(--color-primary-light)]
                                    "
                                />
                            )
                        ) : (
                            <div className="min-w-0 truncate text-sm font-medium sm:text-[15px]">
                                {renderCellValue(draft[column.key], column)}
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
                            onClick={handleSave}
                            disabled={!canSave || loading}
                            className="px-2.5 py-1.5 text-sm shadow-none"
                        >
                            <span className="sr-only">Сохранить</span>
                            <Save size={16} />
                        </PrimaryButton>

                        <OutlineButton
                            active
                            onClick={handleCancel}
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
                            className="px-2.5 py-1.5 text-sm"
                        >
                            <span className="sr-only">Изменить</span>
                            <Pencil size={16} />
                        </OutlineButton>

                        <PrimaryButton
                            active
                            onClick={handleDelete}
                            disabled={loading}
                            className="bg-[var(--color-error)] px-2.5 py-1.5 text-sm shadow-none hover:bg-[color:var(--color-error)]/90"
                        >
                            <span className="sr-only">Удалить</span>
                            <Trash2 size={16} />
                        </PrimaryButton>
                    </>
                )}
            </div>
        </div>
    );
}
