import { eventApi } from "@/entities/event/api/eventApi";
import { leagueApi } from "@/entities/league/api/leagueApi";
import { locationApi } from "@/entities/location/api/locationApi";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

export function useEventContext() {
    const { eventId, locationId, leagueId } = useParams();
    const event = useQuery({ queryKey: ["event", eventId], queryFn: ({ signal }) => eventApi.get(eventId!, signal), enabled: Boolean(eventId) });
    const location = useQuery({ queryKey: ["location", locationId], queryFn: ({ signal }) => locationApi.get(locationId!, signal), enabled: Boolean(locationId) });
    const league = useQuery({ queryKey: ["league", leagueId], queryFn: ({ signal }) => leagueApi.get(leagueId!, signal), enabled: Boolean(leagueId) });
    return { eventInfo: event.data ?? null, locationInfo: location.data ?? null, leagueInfo: league.data ?? null };
}
