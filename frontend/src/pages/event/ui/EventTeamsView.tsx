import { TeamTable } from "@/entities/team/ui/TeamTable";
import { TeamInfoModal } from "@/pages/event/ui/TeamInfoModal";
import { ModalPortal } from "@/shared/ui/ModalPortal";
import type { useEventTeamsModel } from '../model/useEventTeamsModel';
export function EventTeamsView(props: ReturnType<typeof useEventTeamsModel>) {
    const {
        teamInfo,
        setTeamInfo,
        onInfo,
        leagueId,
        isColumnEditable,
        loadTeams,
        loading,
        tableRows,
        handleUpdate,
        handleDelete,
        handleCreate,
        handleCheckPayment,
    } = props;
    return (
        <section className="space-y-5">
            <ModalPortal><TeamInfoModal payload={teamInfo} onClose={() => setTeamInfo(null)} /></ModalPortal>
            {loading ? <div className="text-sm text-[var(--color-text-secondary)]">Загружаем команды...</div> : null}

            <TeamTable
                onInfo={onInfo}
                data={tableRows}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onCheckPayment={handleCheckPayment}
                onCreate={props.can("teams", "create", { eventId: props.eventScopeId, locationId: props.locationScopeId, leagueId: props.leagueScopeId }) ? handleCreate : undefined}
                onRefresh={loadTeams}
                loading={loading}
                defaultLeagueId={leagueId ? Number(leagueId) : null}
                defaultLeagueName={leagueId ? tableRows[0]?.league_name ?? "" : ""}
                isColumnEditable={isColumnEditable}
            />
        </section>
    );
}
