import { FinalNominationsModal } from "@/pages/results/ui/FinalNominationsModal";
import { ModalPortal } from "@/shared/ui/ModalPortal";
import { Download } from "lucide-react";
import { diplomaMap, diplomaOptions, headerButtonClass, sortIcon } from '../model/finalResultsSupport';
import type { useFinalResultsModel } from '../model/useFinalResultsModel';
export function FinalResultsView(props: ReturnType<typeof useFinalResultsModel>) {
    const {
        downloadTeamDocument,
        eventInfo,
        locationInfo,
        leagueInfo,
        nominationsRequest,
        setNominationsRequest,
        can,
        sort,
        eventScopeId,
        locationScopeId,
        leagueScopeId,
        loading,
        sorted,
        canDownloadDocuments,
        toggleSort,
        updateDiploma,
        saveNominations,
    } = props;
    return (
        <section className="space-y-6">
            <ModalPortal><FinalNominationsModal payload={nominationsRequest} onClose={() => setNominationsRequest(null)} /></ModalPortal>
            <div className="space-y-2">
                <div className="text-3xl font-semibold tracking-tight text-[var(--color-text-main)]">
                    Общие результаты
                </div>
                <div className="space-y-1 text-sm text-[var(--color-text-secondary)]">
                    {eventInfo ? <div>Мероприятие: {eventInfo.name}</div> : null}
                    {locationInfo ? <div>Площадка: {locationInfo.name}</div> : null}
                    {leagueInfo ? <div>Лига: {leagueInfo.name}</div> : null}
                </div>
            </div>

            {loading ? (
                <div className="rounded-[24px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.84)] px-6 py-8 text-sm text-[var(--color-text-secondary)]">
                    Загрузка...
                </div>
            ) : sorted.length === 0 ? (
                <div className="rounded-[24px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.84)] px-6 py-8 text-sm text-[var(--color-text-secondary)]">
                    Нет данных для отображения.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <div className={`${canDownloadDocuments ? "min-w-[1380px]" : "min-w-[1240px]"} overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.9)] shadow-[0_18px_52px_rgba(15,23,42,0.08)]`}>
                        <table className="w-full table-fixed border-collapse text-[13px] text-[var(--color-text-main)]">
                            <colgroup>
                                <col className="w-[8%]" />
                                <col className="w-[15%]" />
                                <col className="w-[18%]" />
                                <col className="w-[8%]" />
                                <col className="w-[8%]" />
                                <col className="w-[8%]" />
                                <col className="w-[14%]" />
                                <col className="w-[15%]" />
                                {canDownloadDocuments ? (
                                    <>
                                        <col className="w-[4%]" />
                                        <col className="w-[4%]" />
                                        <col className="w-[4%]" />
                                    </>
                                ) : null}
                            </colgroup>
                            <thead>
                                <tr className="bg-[var(--color-primary)] text-white">
                                    <th className="px-3 py-3"><button type="button" onClick={() => toggleSort("place_final")} className={headerButtonClass(sort?.key === "place_final")}>Место {sort ? sortIcon(sort.key === "place_final", sort.direction) : null}</button></th>
                                    <th className="px-3 py-3"><button type="button" onClick={() => toggleSort("name")} className={headerButtonClass(sort?.key === "name")}>Команда {sort ? sortIcon(sort.key === "name", sort.direction) : null}</button></th>
                                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.08em]">Школа / регион</th>
                                    <th className="px-3 py-3"><button type="button" onClick={() => toggleSort("place_kvartaly")} className={headerButtonClass(sort?.key === "place_kvartaly")}>Кварталы {sort ? sortIcon(sort.key === "place_kvartaly", sort.direction) : null}</button></th>
                                    <th className="px-3 py-3"><button type="button" onClick={() => toggleSort("place_fudzi")} className={headerButtonClass(sort?.key === "place_fudzi")}>Фудзи {sort ? sortIcon(sort.key === "place_fudzi", sort.direction) : null}</button></th>
                                    <th className="px-3 py-3"><button type="button" onClick={() => toggleSort("place_sum")} className={headerButtonClass(sort?.key === "place_sum")}>Сумма {sort ? sortIcon(sort.key === "place_sum", sort.direction) : null}</button></th>
                                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.08em]">Диплом</th>
                                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.08em]">Спецноминации</th>
                                    {canDownloadDocuments ? (
                                        <>
                                            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.08em]">Благ.</th>
                                            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.08em]">Дипл.</th>
                                            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.08em]">Ном.</th>
                                        </>
                                    ) : null}
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map((team, index) => {
                                    const canUpdateTeam = can("teams", "update", {
                                        id: team.id,
                                        eventId: eventScopeId,
                                        locationId: locationScopeId,
                                        leagueId: leagueScopeId,
                                    });
                                    const canGetTeam = can("teams", "get", {
                                        id: team.id,
                                        eventId: eventScopeId,
                                        locationId: locationScopeId,
                                        leagueId: leagueScopeId,
                                    });

                                    return (
                                        <tr
                                            key={team.id}
                                            className={`transition ${index % 2 === 0 ? "bg-[rgba(248,250,252,0.88)]" : "bg-[rgba(255,255,255,0.84)]"} hover:bg-[rgba(14,116,144,0.08)]`}
                                        >
                                            <td className="border-b border-r border-[var(--color-border)] px-3 py-3 text-center font-semibold">{team.place_final ?? "—"}</td>
                                            <td className="border-b border-r border-[var(--color-border)] px-3 py-3 text-center">{team.name}</td>
                                            <td className="border-b border-r border-[var(--color-border)] px-3 py-3 text-left">
                                                <div className="space-y-1">
                                                    <div className="font-medium">{team.school?.trim() || "—"}</div>
                                                    <div className="text-xs text-[var(--color-text-secondary)]">{team.region?.trim() || "—"}</div>
                                                </div>
                                            </td>
                                            <td className="border-b border-r border-[var(--color-border)] px-3 py-3 text-center">{team.place_kvartaly ?? "—"}</td>
                                            <td className="border-b border-r border-[var(--color-border)] px-3 py-3 text-center">{team.place_fudzi ?? "—"}</td>
                                            <td className="border-b border-r border-[var(--color-border)] px-3 py-3 text-center">{team.place_sum ?? "—"}</td>
                                            <td className="border-b border-r border-[var(--color-border)] px-3 py-3 text-center">
                                                <select
                                                    disabled={!canUpdateTeam}
                                                    value={team.diploma ?? ""}
                                                    onChange={(event) => void updateDiploma(team, event.target.value)}
                                                    className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-center text-sm text-[var(--color-text-main)] outline-none"
                                                >
                                                    <option value="">—</option>
                                                    {diplomaOptions.map((key) => (
                                                        <option key={key} value={key}>
                                                            {diplomaMap[key]}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="border-b border-r border-[var(--color-border)] px-3 py-3 text-center">
                                                <div className="space-y-2">
                                                    <div className="space-y-1 text-sm">
                                                        {team.special_nominations.length === 0 ? "Номинаций нет" : team.special_nominations.map((item, nominationIndex) => (
                                                            <div key={`${team.id}-${nominationIndex}`}>{item}</div>
                                                        ))}
                                                    </div>
                                                    {canUpdateTeam ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setNominationsRequest({
                                                                teamId: team.id,
                                                                teamName: team.name,
                                                                nominations: team.special_nominations,
                                                                onSave: (list) => saveNominations(team, list),
                                                            })}
                                                            className="text-sm text-[var(--color-primary)] transition hover:opacity-80"
                                                        >
                                                            Изменить
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </td>
                                            {canDownloadDocuments ? (
                                                <>
                                                    <td className="border-b border-r border-[var(--color-border)] px-3 py-3 text-center">
                                                        {canGetTeam ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => void downloadTeamDocument(team.id, "appreciation", `${team.name.replace(" ", "_")}_благодарность.pdf`)}
                                                                className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] transition hover:opacity-80"
                                                            >
                                                                <Download size={14} />
                                                            </button>
                                                        ) : null}
                                                    </td>
                                                    <td className="border-b border-r border-[var(--color-border)] px-3 py-3 text-center">
                                                        {canGetTeam && team.diploma ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => void downloadTeamDocument(team.id, "diploma", `${team.name.replace(" ", "_")}_${team.diploma === "PARTICIPANT" ? "сертификат" : "диплом"}.pdf`)}
                                                                className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] transition hover:opacity-80"
                                                            >
                                                                <Download size={14} />
                                                            </button>
                                                        ) : null}
                                                    </td>
                                                    <td className="border-b border-[var(--color-border)] px-3 py-3 text-center">
                                                        {canGetTeam && team.special_nominations.length > 0 ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => void downloadTeamDocument(team.id, "special-nominations", `${team.name.replace(" ", "_")}_спецноминации.pdf`)}
                                                                className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] transition hover:opacity-80"
                                                            >
                                                                <Download size={14} />
                                                            </button>
                                                        ) : null}
                                                    </td>
                                                </>
                                            ) : null}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </section>
    );
}
