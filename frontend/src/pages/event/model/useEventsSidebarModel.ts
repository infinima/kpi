import { useUser } from "@/entities/session/model/session";
import { usePermissions } from "@/entities/session/model/usePermissions";
import { useEventContext } from "./useEventContext";
export function useEventsSidebarModel() {
    const guest = useUser(state => state.guest);
    const { can } = usePermissions();
    const { eventInfo, locationInfo, leagueInfo } = useEventContext();
    return {
        guest, eventInfo, locationInfo, leagueInfo,
        canSeeTeams: !guest && can("teams", "get", { eventId: eventInfo?.id, locationId: locationInfo?.id, leagueId: leagueInfo?.id }),
    };
}
