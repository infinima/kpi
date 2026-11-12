import { eventApi } from "@/entities/event/api/eventApi";
import { useUser } from "@/entities/session/model/session";
import { authDestination, registrationPath } from "@/shared/lib/navigation";
import { useQuery } from "@tanstack/react-query";
export function useHomeModel() {
    const guest = useUser(state => state.guest);
    const main = useQuery({ queryKey: ["events", "main"], queryFn: ({ signal }) => eventApi.main(signal), retry: false });
    return {
        guest, event: main.data ?? null, loading: main.isLoading, error: main.isError,
        retry: () => void main.refetch(),
        registrationUrl: main.data ? authDestination(registrationPath(main.data.id), guest) : "/events",
    };
}
