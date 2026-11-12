import { unavailable } from "../../../shared/api/unavailable.js";
import { apiGetFile } from "../../../shared/api/files.js";
import type { ApiNotifyOptions } from "../../../shared/api/request.js";
import { request } from "../../../shared/api/request.js";
import { fromFinalTeamDto } from "../../results/api/contractAdapters.js";
import type { FinalTeamDto } from "../../results/api/contracts.js";
import type { League, LeagueDraft } from "../model/league.js";
import { fromLeagueDto } from "./adapters.js";
import type { LeagueDto } from "./dto.js";

export const leagueApi = {
    async finalTable(id: string | number, signal?: AbortSignal) { return (await request<FinalTeamDto[]>({ method: "GET", path: `leagues/${id}/final-table`, signal })).map(fromFinalTeamDto); },
    document(id: number, kind: "print_teams_names" | "teams_excel" | "awards-script" | "awarding-presentation" | "fudzi_presentation", filename: string, notify?: ApiNotifyOptions) { return apiGetFile(`leagues/${id}/${kind}`, filename, notify); },
    async list(parentId: number | string, visibility: "active" | "deleted" = "active", signal?: AbortSignal): Promise<League[]> {
        if (visibility === "deleted") return [];
        const data = await request<{ leagues: LeagueDto[] }>({ method: "GET", path: `locations/${parentId}`, signal });
        return data.leagues.map(row => fromLeagueDto({ ...row, location_id: Number(parentId) }));
    },
    async get(id: string | number, signal?: AbortSignal): Promise<League> {
        const data = await request<LeagueDto & { location: { id: number } }>({ method: "GET", path: `leagues/${id}`, signal });
        return fromLeagueDto({ ...data, location_id: data.location.id });
    },
    create(..._args: [parentId: number | string, draft: LeagueDraft]) { return unavailable<{ id: number }>(); },
    update(_id: number | string, _draft: LeagueDraft) { return unavailable(); },
    remove(_id: number | string) { return unavailable(); },
    restore(_id: number | string) { return unavailable(); },
    // The deployed OpenAPI does not publish a league-status mutation yet.
    statusChangeAvailable: false,
    setStatus(_id: number | string, _status: string) { return unavailable(); },
    uploadPresentation(id: number, presentation: string) {
        return request({ method: "PATCH", path: `leagues/${id}`, body: { fudzi_presentation: presentation }, notify: { error: true, success: "Презентация фудзи загружена" } });
    },
    presentation(id: number | string, signal?: AbortSignal) {
        return request<Blob>({ method: "GET", path: `leagues/${id}/fudzi_presentation`, responseType: "blob", signal });
    },
};
