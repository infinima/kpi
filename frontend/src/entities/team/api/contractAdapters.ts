import type { TeamInfo } from '../model/scannerTeam.js';
import type { TeamInfoDto } from './contracts.js';

export function fromTeamInfoDto(dto: TeamInfoDto): TeamInfo {
    return {
        id: dto.id,
        league_id: dto.league_id,
        league_name: dto.league_name,
        owner_user_id: dto.owner_user_id,
        owner_full_name: dto.owner_full_name,
        owner_email: dto.owner_email,
        owner_phone_number: dto.owner_phone_number,
        name: dto.name,
        school: dto.school,
        region: dto.region,
        meals_count: dto.meals_count,
        maintainer_full_name: dto.maintainer_full_name,
        maintainer_activity: dto.maintainer_activity,
        status: dto.status,
        created_at: dto.created_at,
        updated_at: dto.updated_at,
    };
}
