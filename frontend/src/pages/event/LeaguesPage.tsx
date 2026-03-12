import { useEffect, useMemo, useState } from "react";
import { FileText, Trash2 } from "lucide-react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/api";
import { LeagueCard } from "@/components/ui/cards/LeagueCard";
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
    const canUseTable = canUseTableMode(user?.rights, "leagues");
    const canManage = canUseTable && visibility === "active";
    const canSeeDeleted = Boolean(user?.rights.leagues?.global?.includes("restore"));
    const viewMode = getCollectionViewMode(searchParams, "leagues", canUseTable);
    const effectiveVisibility = viewMode === "table" ? visibility : "active";

    useEffect(() => {
        let ignore = false;

        async function load() {
            if (!locationId) return;

            try {
                setLoading(true);
                const data = await apiGet<LeagueItem[]>(
                    effectiveVisibility === "deleted"
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
    }, [effectiveVisibility, locationId]);

    const rows = useMemo(() => mapLeagueEntityRows(leagues), [leagues]);
    const visibilityFilter = (
        canSeeDeleted ? (
            <button
                type="button"
                onClick={() => setVisibility((prev) => prev === "active" ? "deleted" : "active")}
                aria-label={visibility === "active" ? "Показать удалённые" : "Показать существующие"}
                title={visibility === "active" ? "Показать удалённые" : "Показать существующие"}
                className={`inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[rgba(255,255,255,0.72)] p-2 leading-none transition ${
                    visibility === "active"
                        ? "text-[var(--color-text-secondary)] hover:border-[var(--color-primary-light)] hover:bg-[rgba(255,255,255,0.95)] hover:text-[var(--color-text-main)]"
                        : "border-[var(--color-primary-light)] bg-[rgba(14,116,144,0.12)] text-[var(--color-primary)]"
                }`}
            >
                {visibility === "active" ? <FileText size={16} /> : <Trash2 size={16} />}
            </button>
        ) : null
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
                    onRestore={effectiveVisibility === "deleted" ? handleRestore : undefined}
                    onRowClick={(row) => navigate({ pathname: `/events/${eventId}/location/${locationId}/league/${row.id}`, search: location.search })}
                    toolbarContent={visibilityFilter}
                    actionsWidth={176}
                />
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {leagues.map((league) => (
                        <LeagueCard
                            key={league.id}
                            name={league.name}
                            status={league.status}
                            maxTeamsCount={league.max_teams_count}
                            deleted_at={league.deleted_at}
                            selected={String(league.id) === String(leagueId)}
                            onClick={() => navigate({ pathname: `/events/${eventId}/location/${locationId}/league/${league.id}`, search: location.search })}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
