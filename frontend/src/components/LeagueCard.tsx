import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  RotateCcw,
  Trash,
  ArrowLeft,
  ArrowRight,
  FileDown,
  History, Baby
} from "lucide-react";

import {useUI, useNotifications, useUser, useEventsNav, useNavigation} from "@/store";
import { apiDelete, apiGetFile, apiPost } from "@/api";
import { leagueForm } from "@/config/leagueForm";
import { formatDate } from "@/helpers/formatDate";

interface Props {
    league: any;
    onRefresh: () => void;
    isDeleted?: boolean;
}

export function LeagueCard({ league, onRefresh, isDeleted = false }: Props) {
    const [open, setOpen] = useState(false);

    const notify = useNotifications((s) => s.addMessage);
    const openForm = useUI((s) => s.openFormModal);
  const goToTables = useEventsNav((s) => s.goToTables);


  const { can, guest } = useUser();
  const { setPage } = useNavigation();

    // ---------- ПРАВА ----------
    const canUpdate = can("leagues", "update", league.id);
    const canDelete = can("leagues", "delete", league.id);
    const canRestore = can("leagues", "restore", league.id);
    const canHistory = can("leagues", "access_history", league.id);
    const canPrint = can("leagues", "print_documents", league.id);
    const canGetShow = can("leagues", "get_show", league.id);
    const canTeams = can("teams", "get")

    // можно ли раскрывать детали
    const canSeeDetails = canUpdate || canDelete || canRestore || canHistory || canPrint;

    // ---------- статусы ----------
    const STATUS_ORDER = [
        "NOT_STARTED",
        "REGISTRATION_IN_PROGRESS",
        "REGISTRATION_ENDED",
        "KVARTALY_GAME",
        "LUNCH",
        "FUDZI_GAME",
        "FUDZI_GAME_BREAK",
        "GAMES_ENDED",
        "AWARDING_IN_PROGRESS",
        "ENDED"
    ] as const;

    const STATUS_TRANSLATIONS: Record<string, string> = {
        NOT_STARTED: "Не началась",
        REGISTRATION_IN_PROGRESS: "Идёт регистрация",
        REGISTRATION_ENDED: "Регистрация завершена",
        KVARTALY_GAME: "Игра «Кварталы»",
        LUNCH: "Обед",
        FUDZI_GAME: "Игра «Фудзи»",
        FUDZI_GAME_BREAK: "Перерыв «Фудзи»",
        GAMES_ENDED: "Игры завершены",
        AWARDING_IN_PROGRESS: "Идёт награждение",
        ENDED: "Завершено"
    };

    function translateStatus(s: string) {
        return STATUS_TRANSLATIONS[s] || s;
    }

    const statusIndex = STATUS_ORDER.indexOf(league.status);

    const canShowKvartalyResults = statusIndex >= STATUS_ORDER.indexOf("KVARTALY_GAME");
    const canShowFudziResults = statusIndex >= STATUS_ORDER.indexOf("FUDZI_GAME");
    const canShowOverallResults = statusIndex >= STATUS_ORDER.indexOf("GAMES_ENDED");

    // ---------- переходы статусов ----------
    const prevStatus =
        statusIndex > 0 ? STATUS_ORDER[statusIndex - 1] : null;
    const nextStatus =
        statusIndex < STATUS_ORDER.length - 1 ? STATUS_ORDER[statusIndex + 1] : null;

    const canGoPrev = canUpdate && !!prevStatus;
    const canGoNext = canUpdate && !!nextStatus;

    async function updateStatus(newStatus: string) {
        try {
            await apiPost(`leagues/${league.id}/status`, { new_status: newStatus });
            notify({ type: "success", text: `Статус изменён: ${translateStatus(newStatus)}` });
            onRefresh();
        } catch {
            notify({ type: "error", text: "Не удалось изменить статус" });
        }
    }

    // ---------- delete / restore ----------
    async function handleDelete() {
        try { await apiDelete(`leagues/${league.id}`, league.id); onRefresh(); } catch {}
    }

    async function handleRestore() {
        try {
            await apiPost(`leagues/${league.id}/restore`);
            notify({ type: "success", text: "Лига восстановлена" });
            onRefresh();
        } catch {}
    }

    async function handleDownloadBlanks() {
        await apiGetFile(`leagues/${league.id}/print_teams_names`, `${league.name.replace(" ", "_")}_таблички.pdf`);
    }

  const goInLeagues = useEventsNav((s) => s.goInLeagues);

    return (
        <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-xl shadow-card p-4 space-y-4"
             onClickCapture={() => goInLeagues(league.id, league.name)}
        >



            {/* ---------- Название и статус ---------- */}
            <h2 className="text-xl font-semibold">{league.name}</h2>
            <p className="text-text-secondary dark:text-dark-text-secondary">
                Статус: <b>{translateStatus(league.status)}</b>
            </p>

            {/* ---------- ТРИ ОСНОВНЫЕ КНОПКИ РЕЗУЛЬТАТОВ ---------- */}

            <div className="flex flex-col gap-2">

                {canShowKvartalyResults && (
                    <button
                        onClick={() => {
                          goToTables("kvartaly");
                          setPage("tables");
                        }}
                        className="
                            w-full py-3 rounded-lg
                            bg-surface dark:bg-dark-surface border border-border dark:border-dark-border
                            hover:bg-hover dark:hover:bg-dark-hover
                            flex items-center justify-center gap-2
                        "
                    >
                        Результаты «Кварталы»
                    </button>
                )}

                {canShowFudziResults && (
                    <button
                        onClick={() =>{goToTables("fudzi");setPage("tables");}}
                        className="
                            w-full py-3 rounded-lg
                            bg-surface dark:bg-dark-surface border border-border dark:border-dark-border
                            hover:bg-hover dark:hover:bg-dark-hover
                            flex items-center justify-center gap-2
                        "
                    >
                        Результаты «Фудзи»
                    </button>
                )}

                {canShowOverallResults && (
                    <button
                        onClick={() => setPage("result")}
                        className="
                            w-full py-3 rounded-lg
                            bg-surface dark:bg-dark-surface border border-border dark:border-dark-border
                            hover:bg-hover dark:hover:bg-dark-hover
                            flex items-center justify-center gap-2
                        "
                    >
                        Общие результаты
                    </button>
                )}
            </div>

            {/* ---------- управление статусом ---------- */}
            {!isDeleted && canUpdate && (
                <div className="flex flex-col gap-2">

                    <button
                        disabled={!canGoPrev}
                        onClick={() => prevStatus && updateStatus(prevStatus)}
                        className="
                            w-full py-2 rounded-lg border border-border
                            bg-surface dark:bg-dark-surface
                            hover:bg-hover dark:hover:bg-dark-hover
                            disabled:opacity-40 disabled:cursor-not-allowed
                            flex items-center justify-center gap-2
                        "
                    >
                        <ArrowLeft size={16} />
                        {prevStatus ? translateStatus(prevStatus) : "Предыдущий статус"}
                    </button>

                    <button
                        disabled={!canGoNext}
                        onClick={() => nextStatus && updateStatus(nextStatus)}
                        className="
                            w-full py-2 rounded-lg border border-border
                            bg-surface dark:bg-dark-surface
                            hover:bg-hover dark:hover:bg-dark-hover
                            disabled:opacity-40 disabled:cursor-not-allowed
                            flex items-center justify-center gap-2
                        "
                    >
                        {nextStatus ? translateStatus(nextStatus) : "Следующий статус"}
                        <ArrowRight size={16} />
                    </button>
                </div>
            )}

            {/* ---------- раскрытие блока деталей ---------- */}
            {canSeeDetails && (
                <button
                    onClick={() => setOpen((v) => !v)}
                    className="
                        w-full py-2 rounded-lg bg-primary text-white
                        flex items-center justify-center gap-2 hover:bg-primary-dark
                    "
                >
                    {open ? "Скрыть детали" : "Показать детали"}
                    {open ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                </button>
            )}

            {/* ---------- детали ---------- */}
            {open && (
                <div className="pt-3 border-t border-border dark:border-dark-border space-y-3 text-sm">

                    <p><b>ID:</b> {league.id}</p>
                    <p><b>ID площадки:</b> {league.location_id}</p>
                    <p><b>Создана:</b> {formatDate(league.created_at)}</p>
                    <p><b>Обновлена:</b> {formatDate(league.updated_at)}</p>
                    {isDeleted && <p><b>Удалена:</b> {formatDate(league.deleted_at)}</p>}

                    {/* ---------- кнопки внутри деталей ---------- */}
                    <div className="flex flex-col gap-3 w-full">

                        {/* редактировать / удалить */}
                        {!isDeleted && (
                            <div className="flex gap-2 w-full">
                                {canUpdate && (
                                    <button
                                        onClick={() => openForm(leagueForm, league)}
                                        className="flex-1 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark flex items-center justify-center gap-2"
                                    >
                                        <Pencil size={16} /> Редактировать
                                    </button>
                                )}

                                {canDelete && (
                                    <button
                                        onClick={handleDelete}
                                        className="flex-1 py-2 rounded-lg bg-error text-white hover:bg-error/80 flex items-center justify-center gap-2"
                                    >
                                        <Trash size={16}/> Удалить
                                    </button>
                                )}
                            </div>
                        )}

                        {/* восстановить */}
                        {isDeleted && canRestore && (
                            <button
                                onClick={handleRestore}
                                className="
                                    w-full py-2 rounded-lg bg-success text-white hover:bg-success/80
                                    flex items-center justify-center gap-2
                                "
                            >
                                <RotateCcw size={16}/> Восстановить
                            </button>
                        )}

                        {/* скачать фудзи */}
                        {canGetShow && !isDeleted && (
                            <>
                                <button
                                    onClick={async () =>
                                        await apiGetFile(
                                            `leagues/${league.id}/fudzi_presentation`,
                                            `${league.name.replace(" ", "_")}_Фудзи.pdf`
                                        )
                                    }
                                    className="
                                        w-full py-3 rounded-lg bg-surface dark:bg-dark-surface
                                        border border-border dark:border-dark-border
                                        hover:bg-hover dark:hover:bg-dark-hover
                                        flex items-center justify-center gap-2
                                    "
                                >
                                    <FileDown size={18}/>
                                    Скачать презентацию «Фудзи»
                                </button>
                            </>
                        )}

                        {/* скачать документы */}
                        {canPrint && !isDeleted && (
                            <>
                                <button
                                    onClick={handleDownloadBlanks}
                                    className="
                                        w-full py-3 rounded-lg bg-surface dark:bg-dark-surface
                                        border border-border dark:border-dark-border
                                        hover:bg-hover dark:hover:bg-dark-hover
                                        flex items-center justify-center gap-2
                                    "
                                >
                                    <FileDown size={18}/>
                                    Скачать бланки
                                </button>
                            </>
                        )}


                      {canTeams && !isDeleted && (
                        <>
                          <button
                            onClick={() => setPage("teams")
                            }
                            className="
                                        w-full py-3 rounded-lg bg-surface dark:bg-dark-surface
                                        border border-border dark:border-dark-border
                                        hover:bg-hover dark:hover:bg-dark-hover
                                        flex items-center justify-center gap-2
                                    "
                          >
                            <Baby size={18}/>
                            Команды
                          </button>
                        </>
                      )}



                        {/* история */}
                        {canHistory && (
                            <button
                                onClick={() =>
                                    notify({
                                        type: "info",
                                        text: "История изменений пока не реализована"
                                    })
                                }
                                className="
                                    w-full py-2 rounded-lg border border-border
                                    bg-surface dark:bg-dark-surface
                                    hover:bg-hover dark:hover:bg-dark-hover
                                    flex items-center justify-center gap-2
                                "
                            >
                                <History size={16}/> История изменений
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}