import { locationApi } from "@/entities/location/api/locationApi";
import { useServerCollection } from "@/shared/lib/useServerCollection";
import { useParams } from "react-router-dom";
export function useLocationsPageModel() {
    const { eventId } = useParams();
    const query = useServerCollection(["locations", eventId, "active"], signal => locationApi.list(eventId!, "active", signal), Boolean(eventId));
    return { eventId, locations: query.data, loading: query.loading, error: query.error, loadLocations: query.refresh };
}
