import type { Event } from "../model/event.js";
import type { EventDto } from "./dto.js";

export function fromEventDto(dto: EventDto): Event {
    return {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.photo_url !== undefined ? { photoUrl: dto.photo_url } : {}),
        id: dto.id,
        name: dto.name,
        date: dto.date,
        createdAt: dto.created_at,
        updatedAt: dto.updated_at,
        deletedAt: dto.deleted_at,
    };
}

export function fromEventOverviewDto(dto: import("../../../shared/api/schema.js").EventDetailOut): import("../model/overview.js").EventOverview {
    return {
        id: dto.id, name: dto.name, date: dto.date, status: dto.status,
        locations: dto.locations.map(location => ({
            id: location.id, name: location.name, address: location.address,
            leagues: location.leagues.map(league => ({ id: league.id, name: league.name, status: league.status,
                maxTeamsCount: league.max_teams_count, teamsCount: league.teams_count, reserveCount: league.reserve_count })),
        })),
    };
}
