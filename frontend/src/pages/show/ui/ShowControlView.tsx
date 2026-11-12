import { ShowScreen } from "@/pages/show/ui/ShowScreen";
import {
    ChevronLeft,
    ChevronRight,
    PanelsTopLeft,
    Timer
} from "lucide-react";
import type { useShowControlModel } from '../model/useShowControlModel';
export function ShowControlView(props: ReturnType<typeof useShowControlModel>) {
    const {
        connectionError,
        leagueId,
        show,
        isConnected,
        showSetSlideNum,
        showSetTimerIsEnabled,
        customTimerMinutes,
        setCustomTimerMinutes,
        changeSlide,
        handleStatusChange,
        startTimer,
    } = props;
    return (
        <div className="space-y-6 pb-8">
            {connectionError ? <p role="alert" className="text-[var(--color-error)]">{connectionError}</p> : null}

            {!isConnected && (
                <div className="rounded-[24px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.84)] px-6 py-8 text-center text-sm text-[var(--color-text-secondary)]">
                    Подключение…
                </div>
            )}

            {isConnected && show && (
                <>
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
                        <div className="rounded-[28px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.92)] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
                                <PanelsTopLeft size={15} />
                                Сцены показа
                            </div>

                            <div className="mt-4 space-y-3">
                                <button
                                    type="button"
                                    onClick={() => handleStatusChange("WALLPAPER")}
                                    className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${show.status === "WALLPAPER"
                                        ? "border-[var(--color-primary-light)] bg-[rgba(14,116,144,0.12)] text-[var(--color-primary)]"
                                        : "border-[var(--color-border)] bg-white text-[var(--color-text-main)] hover:border-[var(--color-primary-light)]"
                                        }`}
                                >
                                    Заставка
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleStatusChange("KVARTALY-RESULTS")}
                                    className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${show.status === "KVARTALY-RESULTS"
                                        ? "border-[var(--color-primary-light)] bg-[rgba(14,116,144,0.12)] text-[var(--color-primary)]"
                                        : "border-[var(--color-border)] bg-white text-[var(--color-text-main)] hover:border-[var(--color-primary-light)]"
                                        }`}
                                >
                                    Таблица кварталов
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleStatusChange("FUDZI-PRESENTATION")}
                                    className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${show.status === "FUDZI-PRESENTATION"
                                        ? "border-[var(--color-primary-light)] bg-[rgba(14,116,144,0.12)] text-[var(--color-primary)]"
                                        : "border-[var(--color-border)] bg-white text-[var(--color-text-main)] hover:border-[var(--color-primary-light)]"
                                        }`}
                                >
                                    Презентация фудзи
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleStatusChange("FUDZI-RESULTS")}
                                    className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${show.status === "FUDZI-RESULTS"
                                        ? "border-[var(--color-primary-light)] bg-[rgba(14,116,144,0.12)] text-[var(--color-primary)]"
                                        : "border-[var(--color-border)] bg-white text-[var(--color-text-main)] hover:border-[var(--color-primary-light)]"
                                        }`}
                                >
                                    Таблица фудзи
                                </button>
                            </div>

                            {show.status === "FUDZI-PRESENTATION" ? (
                                <div className="mt-5 rounded-[24px] border border-[var(--color-border)] bg-[rgba(248,250,252,0.72)] p-4">
                                    <div className="text-sm font-medium text-[var(--color-text-main)]">Управление слайдами</div>
                                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                        <button
                                            type="button"
                                            onClick={() => startTimer(5)}
                                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-center text-sm text-[var(--color-text-main)] transition hover:border-[var(--color-primary-light)]"
                                        >
                                            <Timer size={16} />
                                            Запустить на 5 минут
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => startTimer(2)}
                                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-center text-sm text-[var(--color-text-main)] transition hover:border-[var(--color-primary-light)]"
                                        >
                                            <Timer size={16} />
                                            Запустить на 2 минуты
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => showSetTimerIsEnabled(false)}
                                            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-center text-sm transition sm:col-span-2 ${show.timer_is_enabled
                                                ? "bg-[var(--color-primary)] text-white"
                                                : "border border-[var(--color-border)] bg-white text-[var(--color-text-main)]"
                                                }`}
                                        >
                                            <Timer size={16} />
                                            {show.timer_is_enabled ? "Остановить таймер" : "Таймер остановлен"}
                                        </button>
                                    </div>

                                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                                        <input
                                            type="number"
                                            min={1}
                                            max={120}
                                            value={customTimerMinutes}
                                            onChange={(e) => setCustomTimerMinutes(e.target.value)}
                                            className="h-11 w-full rounded-2xl border border-[var(--color-border)] bg-white px-3 text-center text-sm text-[var(--color-text-main)] outline-none sm:w-28"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const minutes = Math.floor(Number(customTimerMinutes));
                                                if (!Number.isFinite(minutes) || minutes < 1 || minutes > 120) {
                                                    return;
                                                }
                                                startTimer(minutes);
                                            }}
                                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-center text-sm text-[var(--color-text-main)] transition hover:border-[var(--color-primary-light)]"
                                        >
                                            <Timer size={16} />
                                            Запустить на любое время
                                        </button>
                                        {show.timer_is_enabled ? (
                                            <div className="text-sm text-[var(--color-text-secondary)]">
                                                Сейчас запущено на {show.timer_minutes} мин.
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="mt-4 flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => changeSlide(-1)}
                                            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-white text-[var(--color-text-main)] transition hover:border-[var(--color-primary-light)]"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>

                                        <input
                                            className="h-11 w-20 rounded-2xl border border-[var(--color-border)] bg-white px-3 text-center text-sm text-[var(--color-text-main)] outline-none"
                                            value={show.slide_num}
                                            onChange={(e) => {
                                                let n = Number(e.target.value);
                                                if (!Number.isFinite(n)) return;
                                                if (n < 1) n = 1;
                                                if (n > 99) n = 99;
                                                showSetSlideNum(n);
                                            }}
                                        />

                                        <button
                                            type="button"
                                            onClick={() => changeSlide(+1)}
                                            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-white text-[var(--color-text-main)] transition hover:border-[var(--color-primary-light)]"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <div className="rounded-[28px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.92)] p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                            <div className="mx-auto aspect-video w-full overflow-hidden rounded-[22px] border border-[var(--color-border)] bg-black">
                                <ShowScreen leagueId={leagueId} show={show} isConnected={isConnected} manageShowConnection={false} />
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
