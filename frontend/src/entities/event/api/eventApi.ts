import { ApiError } from "../../../shared/api/errors.js";
import { unavailable } from "../../../shared/api/unavailable.js";
import { request } from "../../../shared/api/request.js";
import type { Event, EventDraft } from "../model/event.js";
import { fromEventDto, fromEventOverviewDto } from "./adapters.js";
import type { EventDto } from "./dto.js";

export const eventApi = {
    async mainOverview(signal?: AbortSignal) {
        try { return fromEventOverviewDto(await request<import("../../../shared/api/schema.js").EventDetailOut>({ method: "GET", path: "events/main", signal })); }
        catch (error) { if (error instanceof ApiError && error.status === 404) return null; throw error; }
    },
    async main(signal?: AbortSignal): Promise<Event | null> {
        try { return fromEventDto(await request<EventDto>({ method: "GET", path: "events/main", signal })); }
        catch (error) { if (error instanceof ApiError && error.status === 404) return null; throw error; }
    },
    async list(visibility: "active" | "deleted" = "active", signal?: AbortSignal): Promise<Event[]> {
        if (visibility === "deleted") return [];
        const data = await request<EventDto[]>({ method: "GET", path: "events", signal });
        return data.map(fromEventDto);
    },
    async get(id: string | number, signal?: AbortSignal): Promise<Event> {
        return fromEventDto(await request<EventDto>({ method: "GET", path: `events/${id}`, signal }));
    },
    create(..._args: [draft: EventDraft]) { return unavailable<{ id: number }>(); },
    update(_id: number | string, _draft: EventDraft) { return unavailable(); },
    remove(_id: number | string) { return unavailable(); },
    restore(_id: number | string) { return unavailable(); },
    photoPath(id: string | number, version = 0) { return `events/${id}/photo?ts=${version}`; },
    updatePhoto(_id: number, _photo: string) { return unavailable(); },
};
