import { fromDevTeam, toDevTeam } from "../../team/api/devAdapters.js";
import type { TeamOut } from "../../../shared/api/schema.js";
import { request } from "../../../shared/api/request.js";
import { eventApi } from "../../event/api/eventApi.js";
import { leagueApi } from "../../league/api/leagueApi.js";
import { locationApi } from "../../location/api/locationApi.js";
import type { OwnedTeam } from "../model/contracts.js";
import { fromProfileResponseDto, fromRegistrationEventDto } from "./contractAdapters.js";
import type { ProfileResponseDto } from "./contracts.js";

export type ProfileUpdate = { first_name: string; last_name: string; patronymic: string | null; phone_number: string; };
export type TeamMemberUpdate = { members: string[]; appreciations: string[]; meals_count: number; maintainer_full_name: string | null; maintainer_activity: string | null; };
export type TeamRegistration = TeamMemberUpdate & { league_id: number; owner_user_id?: number; is_reserve: boolean; name: string; school: string; region: string; };

export const accountApi = {
    async profile(_id: number, signal?: AbortSignal) {
        return fromProfileResponseDto(await request<ProfileResponseDto>({ method: "GET", path: "auth/me", signal, notify: { error: true } }));
    },
    updateProfile(_id: number, body: ProfileUpdate) {
        return request({ method: "PATCH", path: "auth/me", body, notify: { error: true, success: "Личные данные сохранены" } });
    },
    async registrationOptions(signal?: AbortSignal) {
        const events = await eventApi.list("active", signal);
        return Promise.all(events.map(async event => {
            const locations = await locationApi.list(event.id, "active", signal);
            return fromRegistrationEventDto({ ...event, locations: await Promise.all(locations.map(async location => ({
                ...location, event_id: event.id,
                leagues: await Promise.all((await leagueApi.list(location.id, "active", signal)).map(async league => {
                    const detail = await request<import("../../../shared/api/schema.js").LeagueDetailOut>({ method: "GET", path: `leagues/${league.id}`, signal });
                    return { ...detail, location_id: location.id, reserve_teams_count: detail.reserve_count };
                }))
            }))) });
        }));
    },
    async myTeams(signal?: AbortSignal): Promise<OwnedTeam[]> {
        const teams = (await request<TeamOut[]>({ method: "GET", path: "teams/my", signal, notify: { error: true } })).map(dto => ({ ...fromDevTeam(dto), status: dto.status, diploma: null, owner_can_edit: dto.editable_fields.includes("members"), league_status: dto.league.status }));
        // Enrichment is presentation-independent and does not duplicate owned teams in another store.
        const leagues = new Map<number, ReturnType<typeof leagueApi.get>>();
        const locations = new Map<number, ReturnType<typeof locationApi.get>>();
        const events = new Map<number, ReturnType<typeof eventApi.get>>();
        return Promise.all(teams.map(async (team) => {
            try {
                if (!leagues.has(team.league_id)) leagues.set(team.league_id, leagueApi.get(team.league_id, signal));
                const league = await leagues.get(team.league_id)!;
                if (!locations.has(league.locationId)) locations.set(league.locationId, locationApi.get(league.locationId, signal));
                const location = await locations.get(league.locationId)!;
                if (!events.has(location.eventId)) events.set(location.eventId, eventApi.get(location.eventId, signal));
                const event = await events.get(location.eventId)!;
                return {
                    ...team,
                    league_name: league.name,
                    league_status: league.status,
                    location_id: location.id,
                    location_name: location.name,
                    location_address: location.address,
                    event_id: event.id,
                    event_name: event.name,
                    event_date: event.date,
                };
            } catch (error) {
                if (signal?.aborted) throw error;
                return team;
            }
        }));
    },
    updateTeam(id: number, body: TeamMemberUpdate) {
        return request({ method: "PATCH", path: `teams/${id}`, body: toDevTeam(body), notify: { error: true, success: "Команда обновлена" } });
    },
    registerTeam(body: TeamRegistration) {
        return request<{ id: number; }>({ method: "POST", path: "teams", body: toDevTeam(body, true), notify: { error: true, success: "Команда зарегистрирована" } });
    },
    checkPayment(id: number) {
        return request({ method: "POST", path: `teams/${id}/check-payment`, notify: { error: true, success: "Проверка оплаты запущена" } });
    },
};
