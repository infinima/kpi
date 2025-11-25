import {useState} from "react";
import {
    ChevronDown, ChevronUp, Pencil, RotateCcw, Trash,
    ArrowLeft, ArrowRight, FileDown
} from "lucide-react";

import {useUI, useNotifications} from "@/store";
import {apiDelete, apiGetFile, apiPost} from "@/api";
import {leagueForm} from "@/config/leagueForm";
import {formatDate} from "@/helpers/formatDate";

interface Props {
    league: any;
    onRefresh: () => void;
    isDeleted?: boolean;
}

export function LeagueCard({league, onRefresh, isDeleted = false}: Props) {
    const [open, setOpen] = useState(false);

    const notify = useNotifications((s) => s.addMessage);
    const openForm = useUI((s) => s.openFormModal);

    // ---------- список статусов в правильном порядке ----------
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
        ENDED: "Завершено",
    };

    function translateStatus(s: string) {
        return STATUS_TRANSLATIONS[s] ?? s;
    }

    // ---------- переход статуса ----------
    async function updateStatus(newStatus: string) {
        try {
            await apiPost(`leagues/${league.id}/status`, {
                new_status: newStatus,
            });

            notify({
                type: "success",
                text: `Статус изменён: ${translateStatus(newStatus)}`,
            });

            onRefresh();
        } catch {
            notify({type: "error", text: "Не удалось изменить статус"});
        }
    }

    // ---------- текущий статус ----------
    const currentIndex = STATUS_ORDER.indexOf(league.status);

    const prevStatus = currentIndex > 0 ? STATUS_ORDER[currentIndex - 1] : null;
    const nextStatus =
        currentIndex < STATUS_ORDER.length - 1 ? STATUS_ORDER[currentIndex + 1] : null;

    const canGoPrev = !!prevStatus;
    const canGoNext = !!nextStatus;

    // ---------- удалить ----------
    async function handleDelete() {
        try {
            await apiDelete(`leagues/${league.id}`, league.id);
            notify({type: "success", text: "Лига удалена"});
            onRefresh();
        } catch {
        }
    }

    // ---------- восстановить ----------
    async function handleRestore() {
        try {
            await apiPost(`leagues/${league.id}/restore`);
            notify({type: "success", text: "Лига восстановлена"});
            onRefresh();
        } catch {
        }
    }

    // ---------- скачать бланки (пока пустой handler) ----------
    async function handleDownloadBlanks() {
        await apiGetFile(`leagues/${league.id}/print_teams_names`, `${league.name.replace(" ", "_")}_таблички.pdf`);
    }

    return (
        <div
            className="
                bg-surface dark:bg-dark-surface
                border border-border dark:border-dark-border
                rounded-xl shadow-card p-4 space-y-3
            "
        >

            <h2 className="text-xl font-semibold">{league.name}</h2>

            <p className="text-text-secondary dark:text-dark-text-secondary">
                Статус: <b>{translateStatus(league.status)}</b>
            </p>

            {/* ---------- Кнопки: предыдущий / следующий статус ---------- */}
            {!isDeleted && (
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
                        <ArrowLeft size={16}/>
                        {prevStatus ? `Предыдущий: ${translateStatus(prevStatus)}` : "Предыдущий статус"}
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
                        {nextStatus ? `Следующий: ${translateStatus(nextStatus)}` : "Следующий статус"}
                        <ArrowRight size={16}/>
                    </button>

                </div>
            )}

            {/* ---------- БЛАНКИ ---------- */}


            {/* ---------- раскрытие ---------- */}
            <button
                onClick={() => setOpen((v) => !v)}
                className="
                    w-full flex items-center justify-center gap-2
                    py-2 rounded-lg bg-primary text-white hover:bg-primary-dark
                "
            >
                {open ? "Скрыть детали" : "Показать детали"}
                {open ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
            </button>

            {open && (
                <div
                    className="
                        pt-3 border-t border-border dark:border-dark-border
                        space-y-3 text-sm
                    "
                >
                    <p><b>ID:</b> {league.id}</p>
                    <p><b>ID площадки:</b> {league.location_id}</p>
                    <p><b>Создана:</b> {formatDate(league.created_at)}</p>
                    <p><b>Обновлена:</b> {formatDate(league.updated_at)}</p>
                    {isDeleted && <p><b>Удалена:</b> {formatDate(league.deleted_at)}</p>}

                    <div className="flex gap-2">

                        {!isDeleted ?
                            <>
                                <div className="flex flex-col gap-3 w-full">

                                    {/* Строка 1: две маленькие кнопки */}
                                    <div className="flex gap-2 w-full">
                                        <button
                                            className="flex-1 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark flex items-center justify-center gap-2"
                                            onClick={() => openForm(leagueForm, league)}
                                        >
                                            <Pencil size={16}/> Редактировать
                                        </button>

                                        <button
                                            onClick={handleDelete}
                                            className="flex-1 py-2 rounded-lg bg-error text-white hover:bg-error/80 flex items-center justify-center gap-2"
                                        >
                                            <Trash size={16}/> Удалить
                                        </button>
                                    </div>



                                    {/* Строка 3 */}
                                    <button
                                        onClick={async () => await apiGetFile(`leagues/${league.id}/fudzi_presentation`, `${league.name.replace(" ", "_")}_Фудзи.pdf`)}
                                        className="
                w-full py-3 rounded-lg
                bg-surface dark:bg-dark-surface
                border border-border dark:border-dark-border
                hover:bg-hover dark:hover:bg-dark-hover
                flex items-center justify-center gap-2
                text-body font-medium
            "
                                    >
                                        <FileDown size={18}/>
                                        Скачать презентацию «Фудзи»
                                    </button>

                                    {/* Строка 4 */}
                                    <button
                                        onClick={handleDownloadBlanks}
                                        className="
                w-full py-3 rounded-lg
                bg-surface dark:bg-dark-surface
                border border-border dark:border-dark-border
                hover:bg-hover dark:hover:bg-dark-hover
                flex items-center justify-center gap-2
                text-body font-medium
            "
                                    >
                                        <FileDown size={18}/>
                                        Скачать бланки
                                    </button>

                                </div>
                            </>
                             : (
                            <button
                            onClick={handleRestore}
                         className="flex-1 py-2 rounded-lg bg-success text-white hover:bg-success/80 flex items-center justify-center gap-2"
                    >
                        <RotateCcw size={16}/> Восстановить
                    </button>
                    )}
                </div>
                </div>
                )}
        </div>
    );
}