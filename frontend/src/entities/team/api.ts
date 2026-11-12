import { apiDelete } from "../../shared/api/delete.js";
import { apiGetFile } from "../../shared/api/files.js";
import { apiGet } from "../../shared/api/get.js";
import { apiPatch } from "../../shared/api/patch.js";
import { apiPost } from "../../shared/api/post.js";
import type { ApiNotifyOptions } from "../../shared/api/request.js";
import { fromDevTeam, toDevTeam } from "./api/devAdapters.js";
import type { TeamOut } from "../../shared/api/schema.js";

import type { QrLookupOut } from "../../shared/api/schema.js";
import type { Team } from "./model/team.js";

export type TeamUpdate = {
    league_id?: number; name?: string; members?: string[]; documents?: string; texts?: string[]; appreciations?: string[];
    school?: string; region?: string; meals_count?: number; maintainer_full_name?: string | null; maintainer_activity?: string | null;
    status?: string; diploma?: string | null; special_nominations?: string[];
};
export type TeamCreate = TeamUpdate & { league_id: number; name: string; school: string; region: string; };
export type TeamScope = { leagueId?: string; locationId?: string; eventId?: string; };
export const teamApi = {
    async list({ leagueId, locationId, eventId }: TeamScope, notify?: ApiNotifyOptions): Promise<Team[]> {
        const path = leagueId ? `teams?league_id=${leagueId}` : locationId ? `teams?location_id=${locationId}` : eventId ? `teams?event_id=${eventId}` : null;
        return path ? (await apiGet<TeamOut[]>(path, notify)).map(fromDevTeam) : [];
    },
    async get(id: number | string, notify?: ApiNotifyOptions) { return fromDevTeam(await apiGet<TeamOut>(`teams/${id}`, notify)); },
    create(body: TeamCreate, notify?: ApiNotifyOptions) { return apiPost<{ id: number; }>("teams", toDevTeam(body, true), notify); },
    update(id: number | string, body: TeamUpdate, notify?: ApiNotifyOptions) { return body.status !== undefined ? apiPost(`teams/${id}/status`, { status: body.status }, notify) : apiPatch(`teams/${id}`, toDevTeam(body), notify); },
    setPaid(id: number, is_paid: boolean) { return apiPost(`teams/${id}/paid`, { is_paid }, { error: true }); },
    remove(id: number) { return apiDelete(`teams/${id}`, id); },
    checkPayment(id: number, notify?: ApiNotifyOptions) { return apiPost<TeamOut>(`teams/${id}/check-payment`, undefined, notify).then(team => ({ paid: team.is_paid })); },
    async byUserUuid(uuid: string, notify?: ApiNotifyOptions) { const data = await apiPost<QrLookupOut>("teams/by-qr", { token: uuid }, notify); return data.teams.map(team => ({ ...team, league_id: team.league.id, league_name: team.league.name, owner_user_id: data.owner.id, owner_full_name: [data.owner.last_name, data.owner.first_name, data.owner.patronymic].filter(Boolean).join(" "), meals_count: 0, maintainer_full_name: team.accompanying_person, created_at: "", updated_at: "" })); },
    document(id: number, kind: "appreciation" | "diploma" | "special-nominations", filename: string) { return apiGetFile(`teams/${id}/${kind}`, filename); },
};
