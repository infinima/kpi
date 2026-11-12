import { eventApi } from "@/entities/event/api/eventApi";
import { useServerCollection } from "@/shared/lib/useServerCollection";
export function useEventsPageModel() {
    const query = useServerCollection(["events", "active"], signal => eventApi.list("active", signal));
    return { events: query.data, loading: query.loading, error: query.error, loadEvents: query.refresh };
}
