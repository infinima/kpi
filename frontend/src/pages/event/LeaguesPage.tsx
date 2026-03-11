import { useEffect, useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/api";
import { EntityTable } from "@/components/ui/table/EntityTable";
import type { EntityTableRowData } from "@/components/ui/table/EntityTableRow";
import { leagueEntityColumns, mapLeagueEntityRows } from "@/pages/event/entityTableConfigs";
import { useUser } from "@/store";
import { canUseTableMode, getCollectionViewMode } from "@/pages/event/viewMode";

type LeagueItem = {
    id: number;
    location_id: number;
    name: string;
    status: string;
    max_teams_count: number;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
};

export function LeaguesPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { eventId, locationId, leagueId } = useParams();
    const { user } = useUser();
    const [leagues, setLeagues] = useState<LeagueItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [visibility, setVisibility] = useState<"active" | "deleted">("active");

    useEffect(() => {
        let ignore = false;

        async function load() {
            if (!locationId) return;

            try {
                setLoading(true);
                const data = await apiGet<LeagueItem[]>(
                    visibility === "deleted"
                        ? `leagues/location/${locationId}/deleted`
                        : `leagues/location/${locationId}`
                );
                if (!ignore) {
                    setLeagues(data);
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        }

        void load();
        return () => {
            ignore = true;
        };
    }, [locationId, visibility]);

    const rows = useMemo(() => mapLeagueEntityRows(leagues), [leagues]);
    const canManage = canUseTableMode(user?.rights, "leagues") && visibility === "active";
    const canSeeDeleted = Boolean(user?.rights.leagues?.global?.includes("restore"));
    const viewMode = getCollectionViewMode(searchParams, "leagues", canManage);
    const visibilityFilter = (
        <select
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as "active" | "deleted")}
            className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text-main)] outline-none"
        >
            <option value="active">Существующие</option>
            {canSeeDeleted ? <option value="deleted">Удалённые</option> : null}
        </select>
    );

    async function handleUpdate(updatedRow: EntityTableRowData) {
        const currentLeague = leagues.find((league) => String(league.id) === String(updatedRow.id));
        const nextStatus = String(updatedRow.status ?? currentLeague?.status ?? "");

        await apiPatch(`leagues/${updatedRow.id}`, {
            name: updatedRow.name,
            max_teams_count: Number(updatedRow.max_teams_count ?? 0),
        }, {
            error: true,
        });

        if (currentLeague && nextStatus && nextStatus !== currentLeague.status) {
            await apiPost(`leagues/${updatedRow.id}/status`, {
                new_status: nextStatus,
            }, {
                success: "Статус лиги обновлён",
                error: true,
            });
        }

        setLeagues((prev) =>
            prev.map((league) =>
                String(league.id) === String(updatedRow.id)
                    ? {
                        ...league,
                        name: String(updatedRow.name ?? ""),
                        max_teams_count: Number(updatedRow.max_teams_count ?? 0),
                        status: nextStatus || league.status,
                    }
                    : league
            )
        );
    }

    async function handleDelete(row: EntityTableRowData) {
        await apiDelete(`leagues/${row.id}`, Number(row.id));
        setLeagues((prev) => prev.filter((league) => String(league.id) !== String(row.id)));
    }

    async function handleRestore(row: EntityTableRowData) {
        await apiPost(`leagues/${row.id}/restore`, undefined, {
            success: "Лига восстановлена",
            error: true,
        });
        setLeagues((prev) => prev.filter((league) => String(league.id) !== String(row.id)));
    }

    async function handleCreate(newRow: EntityTableRowData) {
        if (!locationId) {
            return;
        }

        const response = await apiPost<{ id: number }>("leagues", {
            location_id: Number(locationId),
            name: newRow.name,
            max_teams_count: Number(newRow.max_teams_count ?? 0),
        }, {
            success: "Лига создана",
            error: true,
        });

        setLeagues((prev) => [
            ...prev,
            {
                id: response.id,
                location_id: Number(locationId),
                name: String(newRow.name ?? ""),
                max_teams_count: Number(newRow.max_teams_count ?? 0),
                status: "NOT_STARTED",
            },
        ]);
    }

    return (
        <section className="space-y-6">
            <div>
                <div className="text-3xl font-semibold tracking-tight text-[var(--color-text-main)]">
                    Лиги площадки
                </div>
            </div>

            {loading ? (
                <div className="rounded-[28px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.84)] px-6 py-8 text-sm text-[var(--color-text-secondary)]">
                    Загрузка...
                </div>
            ) : viewMode === "table" ? (
                <EntityTable
                    columns={leagueEntityColumns}
                    data={rows}
                    onCreate={canManage ? handleCreate : undefined}
                    onUpdate={canManage ? handleUpdate : undefined}
                    onDelete={canManage ? handleDelete : undefined}
                    onRestore={visibility === "deleted" ? handleRestore : undefined}
                    onRowClick={(row) => navigate({ pathname: `/events/${eventId}/location/${locationId}/league/${row.id}`, search: location.search })}
                    toolbarContent={visibilityFilter}
                    actionsWidth={136}
                />
            ) : (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        {visibilityFilter}
                    </div>
                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                        {leagues.map((league) => {
                            const selected = String(league.id) === String(leagueId);

                            return (
                                <button
                                    key={league.id}
                                    type="button"
                                    onClick={() => navigate({ pathname: `/events/${eventId}/location/${locationId}/league/${league.id}`, search: location.search })}
                                    className={`
                                        rounded-[28px] border p-5 text-left transition
                                        ${selected
                                            ? "border-[var(--color-primary)] bg-[rgba(14,116,144,0.08)]"
                                            : "border-[var(--color-border)] bg-[rgba(255,255,255,0.84)] hover:border-[var(--color-primary-light)]"}
                                    `}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(245,158,11,0.14)] text-[var(--color-warning)]">
                                            <Trophy size={20} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-lg font-semibold text-[var(--color-text-main)]">
                                                {league.name}
                                            </div>
                                            <div className="mt-2 text-sm text-[var(--color-text-secondary)]">
                                                Команд: {league.max_teams_count}
                                            </div>
                                            <div className="mt-1 text-sm text-[var(--color-text-secondary)]">
                                                Статус: {league.status}
                                            </div>
                                            <div className="mt-1 text-sm text-[var(--color-text-muted)]">
                                                ID: {league.id}
                                            </div>
                                            {league.deleted_at ? (
                                                <div className="mt-1 text-sm text-[var(--color-error)]">
                                                    Удалено: {new Date(league.deleted_at).toLocaleString("ru-RU")}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </section>
    );
}
