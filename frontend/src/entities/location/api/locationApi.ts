import { unavailable } from "../../../shared/api/unavailable.js";
import { request } from "../../../shared/api/request.js";
import type { Location, LocationDraft } from "../model/location.js";
import { fromLocationDto } from "./adapters.js";
import type { LocationDto } from "./dto.js";

export const locationApi = {
    async list(parentId: number | string, visibility: "active" | "deleted" = "active", signal?: AbortSignal): Promise<Location[]> {
        if (visibility === "deleted") return [];
        const data = await request<{ locations: LocationDto[] }>({ method: "GET", path: `events/${parentId}`, signal });
        return data.locations.map(row => fromLocationDto({ ...row, event_id: Number(parentId) }));
    },
    async get(id: string | number, signal?: AbortSignal): Promise<Location> {
        const data = await request<LocationDto & { event: { id: number } }>({ method: "GET", path: `locations/${id}`, signal });
        return fromLocationDto({ ...data, event_id: data.event.id });
    },
    create(..._args: [parentId: number | string, draft: LocationDraft]) { return unavailable<{ id: number }>(); },
    update(_id: number | string, _draft: LocationDraft) { return unavailable(); },
    remove(_id: number | string) { return unavailable(); },
    restore(_id: number | string) { return unavailable(); },

};
