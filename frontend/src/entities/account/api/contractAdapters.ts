import type { OwnedTeam, ProfileResponse, RegistrationEvent, RegistrationLeague, RegistrationLocation } from '../model/contracts.js';
import type { OwnedTeamDto, ProfileResponseDto, RegistrationEventDto, RegistrationLeagueDto, RegistrationLocationDto } from './contracts.js';

export function fromProfileResponseDto(dto: ProfileResponseDto): ProfileResponse {
    return {
        id: dto.id,
        email: dto.email,
        first_name: dto.first_name,
        last_name: dto.last_name,
        patronymic: dto.patronymic,
        phone_number: dto.phone_number ?? "",
        tg_username: dto.tg_username ?? null,
        tg_full_name: dto.tg_full_name ?? null,
    };
}

export function fromRegistrationLeagueDto(dto: RegistrationLeagueDto): RegistrationLeague {
    return {
        id: dto.id,
        location_id: dto.location_id,
        name: dto.name,
        status: dto.status,
        max_teams_count: dto.max_teams_count,
        teams_count: dto.teams_count,
        reserve_teams_count: dto.reserve_teams_count,
    };
}

export function fromRegistrationLocationDto(dto: RegistrationLocationDto): RegistrationLocation {
    return {
        id: dto.id,
        event_id: dto.event_id,
        name: dto.name,
        address: dto.address,
        leagues: dto.leagues.map(fromRegistrationLeagueDto),
    };
}

export function fromRegistrationEventDto(dto: RegistrationEventDto): RegistrationEvent {
    return {
        id: dto.id,
        name: dto.name,
        date: dto.date,
        locations: dto.locations.map(fromRegistrationLocationDto),
    };
}

export function fromOwnedTeamDto(dto: OwnedTeamDto): OwnedTeam {
    return {
        id: dto.id,
        league_id: dto.league_id,
        owner_user_id: dto.owner_user_id,
        owner_can_edit: dto.owner_can_edit,
        name: dto.name,
        members: dto.members,
        texts: dto.texts,
        appreciations: dto.appreciations,
        school: dto.school,
        region: dto.region,
        meals_count: dto.meals_count,
        maintainer_full_name: dto.maintainer_full_name,
        maintainer_activity: dto.maintainer_activity,
        status: dto.status,
        payment_link: dto.payment_link,
        diploma: dto.diploma,
        special_nominations: dto.special_nominations,
        created_at: dto.created_at,
        updated_at: dto.updated_at,
        event_id: dto.event_id,
        event_name: dto.event_name,
        event_date: dto.event_date,
        location_id: dto.location_id,
        location_name: dto.location_name,
        location_address: dto.location_address,
        league_name: dto.league_name,
        league_status: dto.league_status,
    };
}
