import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, RotateCcw, Search } from "lucide-react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import OutlineButton from "@/components/ui/OutlineButton";
import { TEAM_TABLE_COLUMNS, TeamTableRow, type TeamTableRowData } from "./TeamTableRow";

type Props = {
    data: TeamTableRowData[];
    onUpdate: (row: TeamTableRowData) => Promise<void> | void;
    onDelete: (row: TeamTableRowData) => Promise<void> | void;
    onCreate?: (row: TeamTableRowData) => Promise<void> | void;
    defaultLeagueId?: number | null;
    defaultLeagueName?: string;
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

function createEmptyTeam(defaultLeagueId?: number | null, defaultLeagueName?: string): TeamTableRowData {
    return {
        id: 0,
        league_id: defaultLeagueId ?? 0,
        league_name: defaultLeagueName ?? "",
        owner_user_id: null,
        owner_name: "",
        name: "",
        members: {
            coach: {
                email: "",
                full_name: "",
            },
            participants: Array.from({ length: 4 }, () => ({
                school: "",
                full_name: "",
            })),
        },
        appreciations: [],
        school: "",
        region: "",
        meals_count: 0,
        maintainer_full_name: "",
        maintainer_activity: "",
        status: "ON_CHECKING",
        diploma: "",
        special_nominations: [],
        created_at: "",
        updated_at: "",
        deleted_at: null,
    };
}

export function TeamTable({ data, onUpdate, onDelete, onCreate, defaultLeagueId, defaultLeagueName }: Props) {
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const [showCreateRow, setShowCreateRow] = useState(false);

    const filteredData = useMemo(() => {
        const filtered = data.filter((row) =>
            TEAM_TABLE_COLUMNS.every((column) => {
                const term = (filters[column.key] ?? "").trim().toLowerCase();
                if (!term) {
                    return true;
                }

                const raw = row[column.key];
                const value = Array.isArray(raw) ? raw.join(", ") : String(raw ?? "");
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
    }, [data, filters, sortDirection, sortKey]);

    const actionsWidth = 136;
    const createRow = useMemo(() => createEmptyTeam(defaultLeagueId, defaultLeagueName), [defaultLeagueId, defaultLeagueName]);

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-[var(--color-text-secondary)]">
                    Найдено команд по текущим фильтрам: {filteredData.length}
                </div>
                {onCreate ? (
                    <PrimaryButton
                        active
                        onClick={() => setShowCreateRow((prev) => !prev)}
                        className="px-3 py-2 text-sm shadow-none"
                    >
                        <span className="sr-only">Создать команду</span>
                        <Plus size={16} />
                    </PrimaryButton>
                ) : null}
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-[1900px] overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.86)] backdrop-blur-sm">
                    <div
                        className="grid items-center gap-2 border-b border-[var(--color-border)] px-6 py-1 font-semibold text-[var(--color-text-main)]"
                        style={{
                            gridTemplateColumns: `${TEAM_TABLE_COLUMNS.map((column) => `${column.width}fr`).join(" ")} ${actionsWidth}px`,
                        }}
                    >
                        {TEAM_TABLE_COLUMNS.map((column) => (
                            <button
                                key={column.key}
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
                            gridTemplateColumns: `${TEAM_TABLE_COLUMNS.map((column) => `${column.width}fr`).join(" ")} ${actionsWidth}px`,
                        }}
                    >
                        {TEAM_TABLE_COLUMNS.map((column) => (
                            <div key={column.key} className="min-w-0">
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

                        <div className="flex justify-end">
                            <OutlineButton
                                active
                                onClick={() => {
                                    setFilters({});
                                    setSortKey(null);
                                    setSortDirection(null);
                                }}
                                className="px-3 py-2 text-sm"
                            >
                                <span className="sr-only">Сбросить фильтры</span>
                                <RotateCcw size={16} />
                            </OutlineButton>
                        </div>
                    </div>

                    <div className="divide-y divide-[var(--color-border)]">
                        {showCreateRow && onCreate ? (
                            <TeamTableRow
                                row={createRow}
                                columns={TEAM_TABLE_COLUMNS}
                                onSave={onCreate}
                                onDelete={onDelete}
                                actionsWidth={actionsWidth}
                                isCreating
                                onCreated={() => setShowCreateRow(false)}
                            />
                        ) : null}
                        {filteredData.map((row) => (
                            <TeamTableRow
                                key={row.id}
                                row={row}
                                columns={TEAM_TABLE_COLUMNS}
                                onSave={onUpdate}
                                onDelete={onDelete}
                                actionsWidth={actionsWidth}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
