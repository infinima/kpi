import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ArrowDown, ArrowUp, RefreshCw, RotateCcw, Search, Settings2, X } from "lucide-react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import OutlineButton from "@/components/ui/OutlineButton";
import {
    getTeamColumnDisplayValue,
    TEAM_TABLE_COLUMNS,
    TeamTableRow,
    type TeamColumn,
    type TeamColumnKey,
    type TeamTableRowData
} from "./TeamTableRow";

type Props = {
    data: TeamTableRowData[];
    onUpdate: (row: TeamTableRowData) => Promise<void> | void;
    onDelete: (row: TeamTableRowData) => Promise<void> | void;
    onCreate?: (row: TeamTableRowData) => Promise<void> | void;
    onRefresh?: () => Promise<void> | void;
    loading?: boolean;
    defaultLeagueId?: number | null;
    defaultLeagueName?: string;
    isColumnEditable?: (columnKey: keyof TeamTableRowData, row: TeamTableRowData) => boolean;
};

type SortDirection = "asc" | "desc" | null;

const DEFAULT_VISIBLE_COLUMN_KEYS: TeamColumnKey[] = [
    "id",
    "league_name",
    "name",
    "school",
    "maintainer_activity",
    "status",
];

const MIN_COLUMN_WIDTH = 80;

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

function createEmptyTeam(defaultLeagueId?: number | null, defaultLeagueName?: string): TeamTableRowData {
    return {
        id: 0,
        league_id: defaultLeagueId ?? 0,
        league_name: defaultLeagueName ?? "",
        owner_user_id: null,
        owner_full_name: "",
        name: "",
        members: Array.from({ length: 4 }, () => ""),
        appreciations: [],
        school: "",
        region: "",
        meals_count: 0,
        maintainer_full_name: "",
        maintainer_activity: "",
        status: "ON_CHECKING",
        payment_link: null,
        diploma: "",
        special_nominations: [],
        created_at: "",
        updated_at: "",
        deleted_at: null,
    };
}

export function TeamTable({ data, onUpdate, onDelete, onCreate, onRefresh, loading = false, defaultLeagueId, defaultLeagueName, isColumnEditable }: Props) {
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const [showCreateRow, setShowCreateRow] = useState(false);
    const [showColumnSettings, setShowColumnSettings] = useState(false);
    const [visibleColumnKeys, setVisibleColumnKeys] = useState<TeamColumnKey[]>(DEFAULT_VISIBLE_COLUMN_KEYS);
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
        () => Object.fromEntries(TEAM_TABLE_COLUMNS.map((column) => [column.key, column.width]))
    );
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const resizeStateRef = useRef<{ key: TeamColumnKey; startX: number; startWidth: number } | null>(null);

    const visibleColumns = useMemo<TeamColumn[]>(
        () => visibleColumnKeys
            .map((key) => TEAM_TABLE_COLUMNS.find((column) => column.key === key))
            .filter((column): column is TeamColumn => Boolean(column))
            .map((column) => ({ ...column, width: columnWidths[column.key] ?? column.width })),
        [columnWidths, visibleColumnKeys]
    );

    const hiddenColumns = useMemo(
        () => TEAM_TABLE_COLUMNS.filter((column) => !visibleColumnKeys.includes(column.key)),
        [visibleColumnKeys]
    );

    useEffect(() => {
        function handlePointerMove(event: PointerEvent) {
            const resizeState = resizeStateRef.current;
            if (!resizeState) {
                return;
            }

            const width = Math.max(MIN_COLUMN_WIDTH, resizeState.startWidth + event.clientX - resizeState.startX);
            setColumnWidths((prev) => ({ ...prev, [resizeState.key]: width }));
        }

        function handlePointerUp() {
            resizeStateRef.current = null;
        }

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);

        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
        };
    }, []);

    const filteredData = useMemo(() => {
        const filtered = data.filter((row) =>
            visibleColumns.every((column) => {
                const term = (filters[column.key] ?? "").trim().toLowerCase();
                if (!term) {
                    return true;
                }

                const raw = row[column.key];
                const value = Array.isArray(raw)
                    ? raw.join(", ")
                    : getTeamColumnDisplayValue(row, column);

                return value.toLowerCase().includes(term);
            })
        );

        if (!sortKey || !sortDirection) {
            return filtered;
        }

        return [...filtered].sort((left, right) => {
            const compared = compareValues(left[sortKey as keyof TeamTableRowData], right[sortKey as keyof TeamTableRowData]);
            return sortDirection === "asc" ? compared : -compared;
        });
    }, [data, filters, sortDirection, sortKey, visibleColumns]);

    const actionsWidth = 168;
    const createRow = useMemo(() => createEmptyTeam(defaultLeagueId, defaultLeagueName), [defaultLeagueId, defaultLeagueName]);
    const tableMinWidth = useMemo(
        () => visibleColumns.reduce((total, column) => total + column.width, actionsWidth),
        [actionsWidth, visibleColumns]
    );

    function handleAddColumn(key: TeamColumnKey) {
        setVisibleColumnKeys((prev) => prev.includes(key) ? prev : [...prev, key]);
    }

    function handleRemoveColumn(key: TeamColumnKey) {
        setVisibleColumnKeys((prev) => prev.length <= 1 ? prev : prev.filter((columnKey) => columnKey !== key));
        setFilters((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
        });

        if (sortKey === key) {
            setSortKey(null);
            setSortDirection(null);
        }
    }

    function handleColumnResizeStart(event: ReactPointerEvent<HTMLDivElement>, column: TeamColumn) {
        event.preventDefault();
        event.stopPropagation();
        resizeStateRef.current = {
            key: column.key,
            startX: event.clientX,
            startWidth: column.width,
        };
    }

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-[var(--color-text-secondary)]">
                    Найдено команд по текущим фильтрам: {filteredData.length}
                </div>
                <div className="relative flex items-center gap-2">
                    {onRefresh ? (
                        <OutlineButton
                            active
                            onClick={() => void onRefresh()}
                            disabled={loading}
                            className="h-9 w-9 px-0 py-0 text-sm shadow-none"
                        >
                            <span className="sr-only">Обновить таблицу</span>
                            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        </OutlineButton>
                    ) : null}
                    <OutlineButton
                        active
                        onClick={() => setShowColumnSettings((prev) => !prev)}
                        className="h-9 w-9 px-0 py-0 text-sm shadow-none"
                    >
                        <span className="sr-only">Настроить столбцы</span>
                        <Settings2 size={16} />
                    </OutlineButton>
                    {showColumnSettings ? (
                        <div className="absolute right-0 top-12 z-20 w-80 rounded-[20px] border border-[var(--color-border)] bg-white p-4 shadow-[0_20px_40px_rgba(15,23,42,0.16)]">
                            <div className="text-sm font-semibold text-[var(--color-text-main)]">
                                Столбцы таблицы
                            </div>
                            <div className="mt-3 text-xs uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
                                Включены
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {visibleColumns.map((column) => (
                                    <button
                                        key={column.key}
                                        type="button"
                                        onClick={() => handleRemoveColumn(column.key)}
                                        className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[rgba(248,250,252,0.88)] px-3 py-1.5 text-sm text-[var(--color-text-main)]"
                                    >
                                        <span>{column.label}</span>
                                        <X size={14} />
                                    </button>
                                ))}
                            </div>
                            <div className="mt-4 text-xs uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
                                Добавить столбец
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {hiddenColumns.length > 0 ? hiddenColumns.map((column) => (
                                    <button
                                        key={column.key}
                                        type="button"
                                        onClick={() => handleAddColumn(column.key)}
                                        className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text-main)] transition hover:bg-[var(--color-hover)]"
                                    >
                                        {column.label}
                                    </button>
                                )) : (
                                    <div className="text-sm text-[var(--color-text-secondary)]">
                                        Все столбцы уже добавлены.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}
                    {onCreate && defaultLeagueId ? (
                        <PrimaryButton
                            active
                            onClick={() => setShowCreateRow((prev) => !prev)}
                            className="h-9 w-9 px-0 py-0 text-sm shadow-none"
                        >
                            <span className="sr-only">Создать команду</span>
                            <Plus size={16} />
                        </PrimaryButton>
                    ) : null}
                </div>
            </div>

            <div
                ref={scrollRef}
                className="overflow-x-auto"
                onWheel={(event) => {
                    if (!event.ctrlKey || !scrollRef.current) {
                        return;
                    }

                    event.preventDefault();
                    scrollRef.current.scrollLeft += event.deltaY;
                }}
            >
                <div
                    className="mx-auto w-max min-w-full overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.86)] backdrop-blur-sm"
                    style={{ minWidth: `${tableMinWidth}px` }}
                >
                    <div
                        className="grid items-center gap-0 border-b border-[var(--color-border)] px-6 py-1 font-semibold text-[var(--color-text-main)]"
                        style={{
                            gridTemplateColumns: `${visibleColumns.map((column) => `${column.width}px`).join(" ")} ${actionsWidth}px`,
                        }}
                    >
                        {visibleColumns.map((column) => (
                            <div
                                key={column.key}
                                className="relative min-w-0 px-1"
                            >
                                <button
                                    type="button"
                                    onClick={() => {
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
                                    className="flex min-w-0 items-center gap-2 pr-3 text-left"
                                >
                                    <span className="truncate">{column.label}</span>
                                    {sortKey === column.key && sortDirection === "asc" ? <ArrowUp size={14} /> : null}
                                    {sortKey === column.key && sortDirection === "desc" ? <ArrowDown size={14} /> : null}
                                </button>
                                <div
                                    role="separator"
                                    aria-orientation="vertical"
                                    onPointerDown={(event) => handleColumnResizeStart(event, column)}
                                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                                />
                            </div>
                        ))}
                        <div className="sticky right-0 z-10 bg-[rgba(255,255,255,0.96)] pr-3 text-right">Действия</div>
                    </div>

                    <div
                        className="grid items-center gap-0 border-b border-[var(--color-border)] bg-[rgba(248,250,252,0.88)] px-3 py-2"
                        style={{
                            gridTemplateColumns: `${visibleColumns.map((column) => `${column.width}px`).join(" ")} ${actionsWidth}px`,
                        }}
                    >
                        {visibleColumns.map((column) => (
                            <div key={column.key} className="min-w-0 px-1">
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
                            </div>
                        ))}

                        <div className="sticky right-0 z-10 flex justify-end bg-[rgba(248,250,252,0.96)] pr-3">
                            <OutlineButton
                                active
                                onClick={() => {
                                    setFilters({});
                                    setSortKey(null);
                                    setSortDirection(null);
                                }}
                                className="h-9 w-9 px-0 py-0 text-sm"
                            >
                                <span className="sr-only">Сбросить фильтры</span>
                                <RotateCcw size={16} />
                            </OutlineButton>
                        </div>
                    </div>

                    <div className="divide-y divide-[var(--color-border)]">
                        {showCreateRow && onCreate && defaultLeagueId ? (
                            <TeamTableRow
                                row={createRow}
                                columns={visibleColumns}
                                onSave={onCreate}
                                onDelete={onDelete}
                                actionsWidth={actionsWidth}
                                isCreating
                                onCreated={() => setShowCreateRow(false)}
                                isColumnEditable={isColumnEditable}
                            />
                        ) : null}
                        {filteredData.map((row) => (
                            <TeamTableRow
                                key={row.id}
                                row={row}
                                columns={visibleColumns}
                                onSave={onUpdate}
                                onDelete={onDelete}
                                actionsWidth={actionsWidth}
                                isColumnEditable={isColumnEditable}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
