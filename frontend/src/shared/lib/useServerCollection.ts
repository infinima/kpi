import { useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { type SetStateAction } from "react";

/** Cache is the single owner of collection data; forms keep their own local drafts. */
export function useServerCollection<T>(queryKey: QueryKey, load: (signal: AbortSignal) => Promise<T[]>, enabled = true) {
    const client = useQueryClient();
    const query = useQuery({ queryKey, queryFn: ({ signal }) => load(signal), enabled });
    const setData = (update: SetStateAction<T[]>) => client.setQueryData<T[]>(queryKey, (previous = []) => typeof update === "function" ? update(previous) : update);
    const refresh = async () => { await client.invalidateQueries({ queryKey }); };
    return { data: query.data ?? [], setData, refresh, loading: enabled && query.isPending, error: query.error };
}
