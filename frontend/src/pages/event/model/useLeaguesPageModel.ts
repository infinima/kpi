import { leagueApi } from "@/entities/league/api/leagueApi";
import { canRegisterTeam } from "@/entities/permission/model/permissions";
import { useUser } from "@/entities/session/model/session";
import { authDestination, registrationPath } from "@/shared/lib/navigation";
import { useServerCollection } from "@/shared/lib/useServerCollection";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
export function useLeaguesPageModel() {
    const { eventId, locationId, leagueId } = useParams();
    const { user, guest } = useUser();
    const list = useServerCollection(["leagues", locationId, "active"], signal => leagueApi.list(locationId!, "active", signal), Boolean(locationId) && !leagueId);
    const detail = useQuery({ queryKey: ["league", leagueId], queryFn: ({ signal }) => leagueApi.get(leagueId!, signal), enabled: Boolean(leagueId) });
    const selectedLeague = detail.data ?? null;
    const canRegister = selectedLeague ? canRegisterTeam(user?.rights, selectedLeague.status, { eventId: Number(eventId), locationId: Number(locationId), leagueId: selectedLeague.id }) || (guest && selectedLeague.status === "REGISTRATION_IN_PROGRESS") : false;
    return {
        eventId, locationId, leagueId, leagues: list.data, loading: list.loading, error: list.error, loadLeagues: list.refresh,
        selectedLeague, detailLoading: detail.isLoading, detailError: detail.isError, retryDetail: () => void detail.refetch(), canRegister,
        registrationUrl: eventId ? authDestination(registrationPath(eventId, locationId, leagueId), guest) : "/events",
    };
}
