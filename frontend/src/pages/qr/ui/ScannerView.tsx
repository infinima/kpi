import OutlineButton from "@/shared/ui/OutlineButton";
import PrimaryButton from "@/shared/ui/PrimaryButton";
import { ArrowLeft, Camera, CheckCircle2, Search, Square } from "lucide-react";
import { getTeamStatusLabel } from '../model/scannerSupport';
import type { useScannerModel } from '../model/useScannerModel';
export function ScannerView(props: ReturnType<typeof useScannerModel>) {
    const {
        videoRef,
        uuidFromQuery,
        uuidInput,
        setUuidInput,
        teams,
        loading,
        updatingTeamId,
        error,
        setError,
        scannerEnabled,
        setScannerEnabled,
        scannerStatus,
        stopScanner,
        handleBack,
        handleSearch,
        handleMarkArrived,
    } = props;
    return (
        <section className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,116,144,0.12),transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eef6ff_100%)] px-6 py-8">
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="rounded-[32px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.94)] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
                    <div className="mb-4">
                        <OutlineButton
                            active
                            onClick={handleBack}
                            className="px-4 py-2 text-sm"
                            leftIcon={<ArrowLeft size={14} />}
                        >
                            Назад
                        </OutlineButton>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                            <label className="flex-1">
                                <div className="text-sm font-medium text-[var(--color-text-main)]">QR-токен пользователя</div>
                                <input
                                    value={uuidInput}
                                    onChange={(event) => setUuidInput(event.target.value)}
                                    placeholder="88c756f2-290a-11f1-afc9-02420a000110"
                                    className="mt-3 w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-[var(--color-text-main)] outline-none transition focus:border-[var(--color-primary-light)]"
                                />
                            </label>

                            <PrimaryButton
                                active
                                onClick={handleSearch}
                                disabled={loading}
                                loading={loading}
                                loadingText="Загружаем..."
                                className="px-5 py-3 text-sm shadow-none"
                                leftIcon={<Search size={14} />}
                            >
                                Показать команды
                            </PrimaryButton>
                        </div>

                        <div className="rounded-[24px] border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4">
                            <div className="text-sm font-medium text-[var(--color-text-main)]">Сканер QR</div>
                            <div className="mt-2 text-sm text-[var(--color-text-secondary)]">{scannerStatus}</div>
                            <div className="mt-3 overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-black">
                                <video ref={videoRef} muted playsInline className="aspect-video w-full object-cover" />
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <PrimaryButton
                                    active
                                    onClick={() => {
                                        setError(null);
                                        setScannerEnabled(true);
                                    }}
                                    disabled={scannerEnabled}
                                    className="px-4 py-2 text-sm shadow-none"
                                    leftIcon={<Camera size={14} />}
                                >
                                    Сканировать
                                </PrimaryButton>
                                <OutlineButton
                                    active
                                    onClick={stopScanner}
                                    className="px-4 py-2 text-sm"
                                    leftIcon={<Square size={14} />}
                                >
                                    Стоп
                                </OutlineButton>
                            </div>
                        </div>
                    </div>

                    {error ? (
                        <div className="mt-4 rounded-[20px] border border-[rgba(220,38,38,0.18)] bg-[rgba(254,242,242,0.92)] px-4 py-4 text-sm text-[rgb(153,27,27)]">
                            {error}
                        </div>
                    ) : null}

                    {!uuidFromQuery && !loading ? (
                        <div className="mt-6 rounded-[20px] border border-dashed border-[var(--color-border)] px-4 py-6 text-sm text-[var(--color-text-secondary)]">
                            Откройте страницу со ссылкой вида `https://kpiturnir.ru/scanner?data=token` или введите токен вручную.
                        </div>
                    ) : null}

                    {uuidFromQuery && !loading && !error && teams.length === 0 ? (
                        <div className="mt-6 rounded-[20px] border border-dashed border-[var(--color-border)] px-4 py-6 text-sm text-[var(--color-text-secondary)]">
                            Для этого пользователя команды не найдены.
                        </div>
                    ) : null}

                    {teams.length > 0 ? (
                        <div className="mt-6 grid gap-4">
                            {teams.map((team) => {
                                const isArrived = (team.status === "ARRIVED" || team.status === "DOCUMENTS_SUBMITTED");
                                const isUpdating = updatingTeamId === team.id;

                                return (
                                    <article
                                        key={team.id}
                                        className="rounded-[28px] border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-5"
                                    >
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <h2 className="text-xl font-semibold text-[var(--color-text-main)]">
                                                        {team.name}
                                                    </h2>
                                                    <span className="rounded-full bg-[rgba(15,23,42,0.06)] px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)]">
                                                        {getTeamStatusLabel(team.status)}
                                                    </span>
                                                </div>

                                                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                                    <div className="rounded-[20px] bg-white px-4 py-3">
                                                        <div className="text-xs uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Регион</div>
                                                        <div className="mt-2 text-sm text-[var(--color-text-main)]">{team.region || "Не указан"}</div>
                                                    </div>
                                                    <div className="rounded-[20px] bg-white px-4 py-3">
                                                        <div className="text-xs uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Школа</div>
                                                        <div className="mt-2 text-sm text-[var(--color-text-main)]">{team.school || "Не указана"}</div>
                                                    </div>
                                                    <div className="rounded-[20px] bg-white px-4 py-3">
                                                        <div className="text-xs uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Сопровождающий</div>
                                                        <div className="mt-2 text-sm text-[var(--color-text-main)]">{team.maintainer_full_name || "Не указан"}</div>
                                                    </div>
                                                    <div className="rounded-[20px] bg-white px-4 py-3">
                                                        <div className="text-xs uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Статус</div>
                                                        <div className="mt-2 text-sm text-[var(--color-text-main)]">{getTeamStatusLabel(team.status)}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex shrink-0 items-start">
                                                <PrimaryButton
                                                    active
                                                    onClick={() => void handleMarkArrived(team.id)}
                                                    disabled={isArrived || !team.can_register || !team.arrival_open}
                                                    loading={isUpdating}
                                                    loadingText="Обновляем..."
                                                    className="px-4 py-3 text-sm shadow-none"
                                                    leftIcon={<CheckCircle2 size={14} />}
                                                >
                                                    {isArrived ? "Уже прибыли" : "Прибыли"}
                                                </PrimaryButton>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    ) : null}
                </div>
            </div>
        </section>
    );
}
