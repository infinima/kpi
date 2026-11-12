import type { FudziTeam, KvartalyTeam, StageType } from "@/entities/results/model/protocol";
import { useUser } from "@/entities/session/model/session";
import { useTableConnection } from "@/pages/results/model/useTableConnection";
import { FudziResultsTable, KvartalyResultsTable } from "@/pages/results/ui/StageTables";
import { useParams } from "react-router-dom";

function LeagueStageResultsPage({ stageType }: { stageType: StageType; }) {
    const { leagueId } = useParams();
    const actions = useTableConnection(stageType, leagueId);
    const { tableData, isConnected, error } = actions;
    const { can, guest } = useUser();
    const canEditAnswers = isConnected && !guest && can("leagues", "edit_answers", Number(leagueId));
    const canEditPenalties = isConnected && !guest && can("leagues", "edit_penalties", Number(leagueId));
    const tableProps = { actions, canEditAnswers, canEditPenalties };
    return (
        <section className="space-y-6 h-[calc(100vh-5rem)]">
            {error ? <p role="alert" className="text-[var(--color-error)]">{error}</p> : null}
            {!tableData ? (
                <div className="rounded-[24px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.84)] px-6 py-8 text-sm text-[var(--color-text-secondary)]">Загрузка...</div>
            ) : stageType === "kvartaly" ? (
                <KvartalyResultsTable data={tableData as KvartalyTeam[]} {...tableProps} />
            ) : (
                <FudziResultsTable data={tableData as FudziTeam[]} {...tableProps} />
            )}
        </section>
    );
}
export function KvartalyResultsPage() { return <LeagueStageResultsPage stageType="kvartaly" />; }
export function FudziResultsPage() { return <LeagueStageResultsPage stageType="fudzi" />; }
