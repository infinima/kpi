import {useLocation, useParams} from "react-router-dom";

type RouteState = {
  eventName?: string;
  locationName?: string;
  leagueName?: string;
};

function parseId(value?: string) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function useRouteContext() {
  const params = useParams();
  const location = useLocation();
  const state = (location.state ?? {}) as RouteState;

  return {
    eventId: parseId(params.eventId),
    locationId: parseId(params.locationId),
    leagueId: parseId(params.leagueId),
    tableType: params.tableType,
    eventName: state.eventName,
    locationName: state.locationName,
    leagueName: state.leagueName,
  };
}
