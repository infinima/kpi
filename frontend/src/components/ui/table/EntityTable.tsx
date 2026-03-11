import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, RotateCcw, Search } from "lucide-react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import OutlineButton from "@/components/ui/OutlineButton";
import { EntityTableRow, type EntityTableColumn, type EntityTableRowData } from "./EntityTableRow";

type Props = {
    columns: EntityTableColumn[];
    data: EntityTableRowData[];
    onCreate?: (row: EntityTableRowData) => Promise<void> | void;
    onUpdate?: (row: EntityTableRowData) => Promise<void> | void;
    onDelete?: (row: EntityTableRowData) => Promise<void> | void;
    onRestore?: (row: EntityTableRowData) => Promise<void> | void;
    onRowClick?: (row: EntityTableRowData) => Promise<void> | void;
    toolbarContent?: React.ReactNode;
    actionsWidth?: number;
};

type SortDirection = "asc" | "desc" | null;

function compareValues(a: unknown, b: unknown) {
    if (a == null && b == null) return 0;
    if (a == null) return -1;
    if (b == null) return 1;

    const aNum = Number(a);
    const bNum = Number(b);

    if (!Number.isNaN(aNum) && !Number.isNaN(bNum) && `${a}` !== "" && `${b}` !== "") {
        return aNum - bNum;
    }

    return String(a).localeCompare(String(b), "ru", { sensitivity: "base" });
}

function createEmptyRow(columns: EntityTableColumn[]) {
    return Object.fromEntries(columns.map((column) => [column.key, column.type === "number" ? 0 : ""]));
}

function getFilterValue(row: EntityTableRowData, column: EntityTableColumn) {
    const raw = row[column.key];

    if (column.type === "select" && column.options) {
        const option = column.options.find((item) => item.value === raw);
        return `${option?.label ?? ""} ${String(raw ?? "")}`.trim();
    }

    return String(raw ?? "");
}

export function EntityTable({
    columns,
    data,
    onCreate,
    onUpdate,
    onDelete,
    onRestore,
    onRowClick,
    toolbarContent,
    actionsWidth = 136,
}: Props) {
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const [showCreateRow, setShowCreateRow] = useState(false);

    const filteredData = useMemo(() => {
        const filtered = data.filter((row) =>
            columns.every((column) => {
                if (!column.searchable) {
                    return true;
                }

                const term = (filters[column.key] ?? "").trim().toLowerCase();
                if (!term) {
                    return true;
                }

                return getFilterValue(row, column).toLowerCase().includes(term);
            })
        );

        if (!sortKey || !sortDirection) {
            return filtered;
        }

        return [...filtered].sort((left, right) => {
            const compared = compareValues(left[sortKey], right[sortKey]);
            return sortDirection === "asc" ? compared : -compared;
        });
    }, [columns, data, filters, sortDirection, sortKey]);

    const createRow = useMemo(() => createEmptyRow(columns), [columns]);

    return (
        <section className="space-y-4">
            <div className="overflow-x-auto">
                <div className="min-w-[1180px] overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.86)] backdrop-blur-sm">
                    <div
                        className="grid items-center gap-2 border-b border-[var(--color-border)] px-6 py-1 font-semibold text-[var(--color-text-main)]"
                        style={{
                            gridTemplateColumns: `${columns.map((column) => `${column.width}fr`).join(" ")} ${actionsWidth}px`,
                        }}
                    >
                        {columns.map((column) => (
                            <button
                                key={column.key}
                                type="button"
                                onClick={() => {
                                    if (!column.sortable) {
                                        return;
                                    }

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
                                }}
                                className="flex min-w-0 items-center gap-2 text-left"
                            >
                                <span className="truncate">{column.label}</span>
                                {sortKey === column.key && sortDirection === "asc" ? <ArrowUp size={14} /> : null}
                                {sortKey === column.key && sortDirection === "desc" ? <ArrowDown size={14} /> : null}
                            </button>
                        ))}
                        <div className="text-right">Действия</div>
                    </div>

                    <div
                        className="grid items-center gap-2 border-b border-[var(--color-border)] bg-[rgba(248,250,252,0.88)] px-3 py-2"
                        style={{
                            gridTemplateColumns: `${columns.map((column) => `${column.width}fr`).join(" ")} ${actionsWidth}px`,
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
                                            onChange={(event) => setFilters((prev) => ({ ...prev, [column.key]: event.target.value }))}
                                            placeholder={`Фильтр по ${column.label}`}
                                            className="w-full rounded-lg border border-[var(--color-border)] bg-white py-1.5 pl-8 pr-2 text-sm text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary-light)]"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-9" />
                                )}
                            </div>
                        ))}

                        <div className="flex justify-end gap-2">
                            {toolbarContent}
                            {onCreate ? (
                                <PrimaryButton
                                    active
                                    onClick={() => setShowCreateRow((prev) => !prev)}
                                    className="px-3 py-2 text-sm shadow-none"
                                >
                                    <span className="sr-only">Создать</span>
                                    <Plus size={16} />
                                </PrimaryButton>
                            ) : null}
                            <OutlineButton
                                active
                                onClick={() => {
                                    setFilters({});
                                    setSortKey(null);
                                    setSortDirection(null);
                                }}
                                className="px-3 py-2 text-sm"
                            >
                                <span className="sr-only">Сбросить</span>
                                <RotateCcw size={16} />
                            </OutlineButton>
                        </div>
                    </div>

                    <div className="divide-y divide-[var(--color-border)]">
                        {showCreateRow && onCreate ? (
                            <EntityTableRow
                                row={createRow}
                                columns={columns}
                                onSave={onCreate}
                                onDelete={onDelete}
                                actionsWidth={actionsWidth}
                                isCreating
                                onCreated={() => setShowCreateRow(false)}
                            />
                        ) : null}

                        {filteredData.map((row, index) => (
                            <EntityTableRow
                                key={String(row.id ?? index)}
                                row={row}
                                columns={columns}
                                onSave={onUpdate}
                                onDelete={onDelete}
                                onRestore={onRestore}
                                onRowClick={onRowClick}
                                actionsWidth={actionsWidth}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
