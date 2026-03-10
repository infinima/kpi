import React, {useMemo, useState} from "react";
import {ArrowUp, ArrowDown, Search, Plus, RotateCcw} from "lucide-react";
import {DataTableRow} from "./DataTableRow";
import type {
    SortDirection,
    TableConfig,
    TableColumnConfig,
    TableRowData,
} from "./data-table/types";
import PrimaryButton from "@/components/ui/PrimaryButton";
import OutlineButton from "@/components/ui/OutlineButton";
import {
    createEmptyRow,
    filterTableData,
    sortTableData,
} from "./data-table/utils";

type Props = {
    config: TableConfig;
    data: TableRowData[];
    onCreate: (data: TableRowData) => Promise<void> | void;
    onUpdate: (data: TableRowData) => Promise<void> | void;
    onDelete: (data: TableRowData) => Promise<void> | void;
};

export function DataTable({
                              config,
                              data,
                              onCreate,
                              onUpdate,
                              onDelete,
                          }: Props) {
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const [showCreateRow, setShowCreateRow] = useState(false);

    const columns = config.columns;

    const searchableColumns = useMemo(
        () => columns.filter((col) => col.searchable),
        [columns]
    );

    const filteredData = useMemo(() => {
        const filtered = filterTableData(data, searchableColumns, filters);
        return sortTableData(filtered, sortKey, sortDirection);
    }, [data, filters, searchableColumns, sortDirection, sortKey]);

    const toggleSort = (column: TableColumnConfig) => {
        if (!column.sortable) return;

        if (sortKey !== column.key) {
            setSortKey(column.key);
            setSortDirection("asc");
            return;
        }

        if (sortDirection === "asc") {
            setSortDirection("desc");
            return;
        }

        if (sortDirection === "desc") {
            setSortDirection(null);
            setSortKey(null);
            return;
        }

        setSortDirection("asc");
    };

    const createRowTemplate = useMemo(() => {
        return createEmptyRow(columns);
    }, [columns]);

    const updateFilter = (key: string, value: string) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const resetFilters = () => {
        setFilters({});
        setSortKey(null);
        setSortDirection(null);
    };

    return (
        <section className="space-y-4">

                <div className="overflow-x-auto">
                    <div
                        className="
                            min-w-[980px] overflow-hidden rounded-[24px] border border-[var(--color-border)]
                            bg-[rgba(255,255,255,0.86)] backdrop-blur-sm
                        "
                    >
                        <div
                            className="
                                grid items-center gap-2 border-b border-[var(--color-border)]
                                px-6 py-1 font-semibold text-[var(--color-text-main)]
                            "
                            style={{
                                gridTemplateColumns: `${columns
                                    .map((col) => `${col.width}fr`)
                                    .join(" ")} 220px`,
                            }}
                        >
                            {columns.map((column) => (
                                <button
                                    key={column.key}
                                    type="button"
                                    onClick={() => toggleSort(column)}
                                    className={`
                                        flex min-w-0 items-center gap-2 text-left
                                        ${column.sortable ? "cursor-pointer" : "cursor-default"}
                                    `}
                                >
                                    <span className="truncate">{column.label}</span>

                                    {sortKey === column.key && sortDirection === "asc" && (
                                        <ArrowUp size={14} />
                                    )}
                                    {sortKey === column.key && sortDirection === "desc" && (
                                        <ArrowDown size={14} />
                                    )}
                                </button>
                            ))}

                            <div className="text-right">Действия</div>
                        </div>

                        <div
                            className="
                                grid items-center gap-2 border-b border-[var(--color-border)]
                                bg-[rgba(248,250,252,0.88)] px-3 py-2
                            "
                            style={{
                                gridTemplateColumns: `${columns
                                    .map((col) => `${col.width}fr`)
                                    .join(" ")} 220px`,
                            }}
                        >
                            {columns.map((column) => (
                                <div key={column.key} className="min-w-0">
                                    {column.searchable ? (
                                        <div className="relative">
                                            <Search
                                                size={14}
                                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                                            />
                                            <input
                                                value={filters[column.key] ?? ""}
                                                onChange={(e) => updateFilter(column.key, e.target.value)}
                                                placeholder={`Фильтр по ${column.label}`}
                                                className="
                                                    w-full rounded-lg border border-[var(--color-border)] bg-white
                                                    py-1.5 pl-8 pr-2 text-sm text-[var(--color-text-main)] outline-none
                                                    focus:border-[var(--color-primary-light)]
                                                "
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-9" />
                                    )}
                                </div>
                            ))}

                            <div className="flex justify-end gap-2">
                                <PrimaryButton
                                    active
                                    onClick={() => setShowCreateRow((prev) => !prev)}
                                    className="px-3 py-2 text-sm shadow-none"
                                >
                                    <span className="sr-only">{showCreateRow ? "Скрыть форму создания" : "Создать строку"}</span>
                                    <Plus size={16} />
                                </PrimaryButton>
                                <OutlineButton
                                    active
                                    onClick={resetFilters}
                                    className="px-3 py-2 text-sm"
                                >
                                    <span className="sr-only">Сбросить фильтры</span>
                                    <RotateCcw size={16} />
                                </OutlineButton>
                            </div>
                        </div>

                        <div className="divide-y divide-[var(--color-border)]">
                            {filteredData.map((row, index) => (
                                <DataTableRow
                                    key={String(row.id ?? index)}
                                    columns={columns}
                                    row={row}
                                    onSave={onUpdate}
                                    onDelete={onDelete}
                                />
                            ))}

                            {showCreateRow && (
                                <DataTableRow
                                    columns={columns}
                                    row={createRowTemplate}
                                    isCreating
                                    onSave={onCreate}
                                    onCreated={() => setShowCreateRow(false)}
                                />
                            )}
                        </div>
                    </div>
                </div>
        </section>
    );
}
