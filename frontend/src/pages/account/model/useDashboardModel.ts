import { maintenanceApi } from "@/entities/maintenance/api";
import { maintenanceLabels } from "@/entities/maintenance/model/access";
import { eventApi } from "@/entities/event/api/eventApi";
import { leagueApi } from "@/entities/league/api/leagueApi";
import { leagueStatuses, type LeagueStatus } from "@/entities/league/model/status";
import { canAccessDashboard, canPerform } from "@/entities/permission/model/permissions";
import { useUser } from "@/entities/session/model/session";
import { useMutation, useQuery } from "@tanstack/react-query";
import { leagueOccupancy, summarizeLeagues } from "./dashboard/statistics";
export function useDashboardModel() {
    const rights = useUser(state => state.user?.rights);
    const allowed = canAccessDashboard(rights);
    const maintenance = useQuery({ queryKey: ["maintenance"], queryFn: ({ signal }) => maintenanceApi.status(signal), enabled: allowed, refetchInterval: allowed ? 15000 : false });
    const overview = useQuery({ queryKey: ["dashboard", "main-event"], queryFn: ({ signal }) => eventApi.mainOverview(signal), enabled: allowed, refetchInterval: allowed ? 30000 : false });
    const mutation = useMutation({ mutationFn: async ({ leagueId, status }: { leagueId: number; status: LeagueStatus }) => {
        const currentRights = useUser.getState().user?.rights;
        const location = overview.data?.locations.find(item => item.leagues.some(league => league.id === leagueId));
        const league = location?.leagues.find(item => item.id === leagueId);
        if (!canAccessDashboard(currentRights) || !league || !overview.data) throw new Error("Нет доступа к изменению статуса");
        const target = { eventId: overview.data.id, locationId: location!.id, leagueId };
        const rollback = leagueStatuses.indexOf(status) < leagueStatuses.indexOf(league.status);
        if (!canPerform(currentRights, "league.status", target) || (rollback && !canPerform(currentRights, "league.status_rollback", target))) throw new Error("Недостаточно прав для смены статуса");
        await leagueApi.setStatus(leagueId, status);
    } });
    const event = overview.data ?? null;
    return {
        siteStatus: maintenance.data ? maintenanceLabels[maintenance.data.mode] : "Проверяем…",
        siteInWork: maintenance.data?.mode === "users",
        siteMessage: maintenance.data?.message ?? "",
        allowed, event, loading: overview.isPending, error: overview.isError,
        refreshing: overview.isFetching, refresh: () => void overview.refetch(),
        statusChangeAvailable: leagueApi.statusChangeAvailable,
        saving: mutation.isPending, changeError: mutation.isError ? (mutation.error instanceof Error ? mutation.error.message : "Не удалось изменить статус") : null,
        changeStatus: (leagueId: number, status: LeagueStatus) => mutation.mutate({ leagueId, status }),
        locations: event?.locations.map(location => ({ ...location, stats: summarizeLeagues(location.leagues), leagues: location.leagues.map(league => ({ ...league,
            occupancy: leagueOccupancy(league),
            canChangeStatus: canPerform(rights, "league.status", { eventId: event.id, locationId: location.id, leagueId: league.id }),
            canRollback: canPerform(rights, "league.status_rollback", { eventId: event.id, locationId: location.id, leagueId: league.id }),
        })) })) ?? [],
        stats: summarizeLeagues(event?.locations.flatMap(location => location.leagues) ?? []),
    };
}
export { leagueStatusLabels, leagueStatuses } from "@/entities/league/model/status";
export type { LeagueStatus } from "@/entities/league/model/status";
