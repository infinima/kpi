import { canPerform } from "@/entities/permission/model/permissions";
import { useUser } from "@/entities/session/model/session";
import { usePermissions } from "@/entities/session/model/usePermissions";
import { teamApi, type TeamUpdate } from "@/entities/team/api";
import type { Team, TeamInfoRequest } from "@/entities/team/model/team";
import type { TeamTableRowData } from "@/entities/team/ui/TeamTableRow";
import { confirmWithNotification } from "@/shared/lib/confirmWithNotification";
import { useServerCollection } from "@/shared/lib/useServerCollection";
import { useNotifications } from "@/shared/model/notifications";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { buildMembersRequestValue } from './eventTeamsSupport';
export function useEventTeamsModel() {
    const { eventId, locationId, leagueId } = useParams();

    const { can } = usePermissions();

    const [teamInfo, setTeamInfo] = useState<TeamInfoRequest | null>(null);
    const onInfo = setTeamInfo;

    const notify = useNotifications((state) => state.addMessage);

    const eventScopeId = eventId ? Number(eventId) : null;

    const locationScopeId = locationId ? Number(locationId) : null;

    const leagueScopeId = leagueId ? Number(leagueId) : null;

    function canEditTeam(teamId: number) {
        return can("teams", "update", {
            id: teamId,
            eventId: eventScopeId,
            locationId: locationScopeId,
            leagueId: leagueScopeId,
        });
    }

    const { data: rows, setData: setRows, refresh: loadTeams, loading } = useServerCollection<Team>(
        ["teams", eventId, locationId, leagueId], () => teamApi.list({ leagueId, locationId, eventId }, { error: true }), Boolean(eventId || locationId || leagueId)
    );

    const tableRows = useMemo<TeamTableRowData[]>(() => {
        return rows.map(row => ({ ...row, can_manage: can("teams", "delete", { eventId: row.eventId ?? eventScopeId, locationId: row.locationId ?? locationScopeId, leagueId: row.league_id }) }));
    }, [rows, can, eventScopeId, locationScopeId]);

    function isColumnEditable(key: keyof Team, row: Team) {
        if (key === "status" || key === "is_paid") return canPerform(useUser.getState().user?.rights, "teams.manage", { eventId: row.eventId ?? eventScopeId, locationId: row.locationId ?? locationScopeId, leagueId: row.league_id });
        const wire = ({ meals_count: "lunches_count", maintainer_full_name: "accompanying_person" } as Record<string, string>)[key] ?? key;
        return Boolean(row.editable_fields?.includes(wire));
    }
    async function handleUpdate(row: TeamTableRowData) {
        const payload: TeamUpdate = {
            name: row.name,
            school: row.school,
            region: row.region,
            members: buildMembersRequestValue(row),
            documents: row.documents,
            texts: row.texts,
            appreciations: row.appreciations,
            meals_count: row.meals_count,
            maintainer_full_name: row.maintainer_full_name || null,
            maintainer_activity: row.maintainer_activity || null,
            status: row.status || undefined,
            diploma: row.diploma || null,
            special_nominations: row.special_nominations,
        };

        if (canEditTeam(row.id)) {
            payload.league_id = row.league_id;
        }

        const current = rows.find(item => item.id === row.id);
        if (current && current.status !== row.status && isColumnEditable("status", current)) {
            await teamApi.update(row.id, { status: row.status }, { error: true });
        }
        if (current && current.is_paid !== row.is_paid && isColumnEditable("is_paid", current)) {
            await teamApi.setPaid(row.id, Boolean(row.is_paid));
        }
        delete payload.status;
        const filtered = Object.fromEntries(Object.entries(payload).filter(([key]) => isColumnEditable(key as keyof Team, current ?? row)));
        if (Object.keys(filtered).length) await teamApi.update(row.id, filtered, {
            success: "Команда обновлена",
            error: true,
        });

        const updated = await teamApi.get(row.id, { error: true });
        setRows((prev) => prev.map((item) => item.id === row.id ? updated : item));
    }

    async function handleDelete(row: TeamTableRowData) {
        if (!can("teams", "delete", { eventId: row.eventId ?? eventScopeId, locationId: row.locationId ?? locationScopeId, leagueId: row.league_id })) return;
        if (!await confirmWithNotification({ text: "Точно удалить?" })) return;
        await teamApi.remove(row.id);
        await loadTeams();
    }

    async function handleCreate(row: TeamTableRowData) {
        const created = await teamApi.create({
            league_id: row.league_id,
            name: row.name,
            members: buildMembersRequestValue(row),
            documents: row.documents,
            texts: row.texts,
            appreciations: row.appreciations,
            school: row.school,
            region: row.region,
            meals_count: row.meals_count,
            maintainer_full_name: row.maintainer_full_name || null,
            maintainer_activity: row.maintainer_activity || null,
        }, {
            success: "Команда создана",
            error: true,
        });

        const data = await teamApi.get(created.id, { error: true });
        setRows((prev) => [{
            ...data,
        }, ...prev.filter((item) => item.id !== data.id)]);
    }

    async function handleCheckPayment(row: TeamTableRowData) {
        const result = await teamApi.checkPayment(row.id, {
            error: true,
        });

        notify({
            type: "success",
            text: result.paid ? "Оплата подтверждена" : "Оплата пока не поступила",
        });

        const updated = await teamApi.get(row.id, { error: true });
        setRows((prev) => prev.map((item) => item.id === row.id ? updated : item));
        return updated;
    }
    return {
        teamInfo,
        setTeamInfo,
        onInfo,
        eventId,
        locationId,
        leagueId,
        can,
        notify,
        eventScopeId,
        locationScopeId,
        leagueScopeId,
        canEditTeam,
        isColumnEditable,
        rows,
        setRows,
        loadTeams,
        loading,
        tableRows,
        handleUpdate,
        handleDelete,
        handleCreate,
        handleCheckPayment,
    };
}
