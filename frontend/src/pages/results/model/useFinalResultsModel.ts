import { leagueApi } from "@/entities/league/api/leagueApi";
import type { NominationsRequest } from "@/entities/results/model/finalTeam";
import { useUser } from "@/entities/session/model/session";
import { teamApi } from "@/entities/team/api";
import { nextSort } from "@/shared/lib/table";
import { useServerCollection } from "@/shared/lib/useServerCollection";
import { useNotifications } from "@/shared/model/notifications";
import { useMemo, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { compareValues, EventsOutletContext, FinalTeam, SortDirection, SortKey } from './finalResultsSupport';
export function useFinalResultsModel() {
    const { leagueId } = useParams();

    const { eventInfo, locationInfo, leagueInfo } = useOutletContext<EventsOutletContext>();

    const notify = useNotifications((state) => state.addMessage);

    const [nominationsRequest, setNominationsRequest] = useState<NominationsRequest | null>(null);

    const { can } = useUser();

    const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection; } | null>(null);

    const eventScopeId = eventInfo?.id ?? null;

    const locationScopeId = locationInfo?.id ?? null;

    const leagueScopeId = leagueInfo?.id ?? (leagueId ? Number(leagueId) : null);

    const { data, setData, loading } = useServerCollection<FinalTeam>(["final-results", leagueId], (signal) => leagueApi.finalTable(leagueId!, signal), Boolean(leagueId));

    const sorted = useMemo(() => {
        if (!sort) {
            return data;
        }

        return [...data].sort((left, right) => {
            const compared = compareValues(left[sort.key], right[sort.key]);
            return sort.direction === "asc" ? compared : -compared;
        });
    }, [data, sort]);

    const canDownloadDocuments = useMemo(() => {
        return sorted.some((team) => can("teams", "get", {
            id: team.id,
            eventId: eventScopeId,
            locationId: locationScopeId,
            leagueId: leagueScopeId,
        }));
    }, [can, eventScopeId, leagueScopeId, locationScopeId, sorted]);

    function toggleSort(key: SortKey) {
        setSort((current) => nextSort(current, key));
    }

    async function updateDiploma(team: FinalTeam, value: string) {
        await teamApi.update(team.id, { diploma: value === "" ? null : value }, { error: true });
        setData((prev) => prev.map((item) => item.id === team.id ? { ...item, diploma: value || null } : item));
    }

    async function saveNominations(team: FinalTeam, list: string[]) {
        try {
            await teamApi.update(team.id, { special_nominations: list }, { error: true });
            notify({ type: "success", text: "Номинации обновлены" });
            setData((prev) => prev.map((item) => item.id === team.id ? { ...item, special_nominations: list } : item));
        } catch {
            notify({ type: "error", text: "Ошибка сохранения" });
        }
    }
    return {
        downloadTeamDocument: teamApi.document,
        leagueId,
        eventInfo,
        locationInfo,
        leagueInfo,
        notify,
        nominationsRequest,
        setNominationsRequest,
        can,
        sort,
        setSort,
        eventScopeId,
        locationScopeId,
        leagueScopeId,
        data,
        setData,
        loading,
        sorted,
        canDownloadDocuments,
        toggleSort,
        updateDiploma,
        saveNominations,
    };
}
