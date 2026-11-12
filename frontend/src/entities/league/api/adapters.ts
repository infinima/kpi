import type { League } from "../model/league.js";
import type { LeagueDto } from "./dto.js";

export function fromLeagueDto(dto: LeagueDto): League {
    return {
        id: dto.id,
        locationId: dto.location_id,
        name: dto.name,
        status: dto.status,
        maxTeamsCount: dto.max_teams_count,
        presentation: dto.fudzi_presentation,
        createdAt: dto.created_at,
        updatedAt: dto.updated_at,
        deletedAt: dto.deleted_at,
    };
}
