import {
    downloadMedicalInterventionFile,
    downloadPhotoVideoConsentFile
} from "@/shared/lib/legalDownloads";
import OutlineButton from "@/shared/ui/OutlineButton";
import PrimaryButton from "@/shared/ui/PrimaryButton";
import {
    CalendarDays,
    ChevronRight,
    MapPin,
    Pencil,
    PlusSquare,
    Trophy,
    Users
} from "lucide-react";
import { Link } from "react-router-dom";
import type { useCabinetModel } from '../model/useCabinetModel';
import { InfoBadge, formatDateTime, formatEventDate, getTeamFileBaseName, getTeamPaymentLink, getTeamStatusLabel } from './cabinetPresentation';
export function OwnedTeamsSection(props: ReturnType<typeof useCabinetModel>) {
    const {
        downloadTeamDocument,
        ownedTeams,
        ownedTeamsLoading,
        checkingPaymentTeamId,
        editingTeamId,
        applyTeamToForm,
        handleCheckPayment,
    } = props;
    return (
        <div>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                    <h2 className="text-2xl font-semibold text-[var(--color-text-main)]">
                        Мои команды
                    </h2>
                    <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                        Здесь собраны все ваши заявки. Можно посмотреть текущий статус и открыть нужную команду на редактирование.
                    </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <InfoBadge
                        icon={<Users size={14} />}
                        text={`Команд: ${ownedTeams.length}`}
                    />
                    <Link to="/lk/reg_team">
                        <PrimaryButton active leftIcon={<PlusSquare size={16} />}>
                            Новая команда
                        </PrimaryButton>
                    </Link>
                </div>
            </div>

            {ownedTeamsLoading ? (
                <div className="mt-8 rounded-[28px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.65)] p-6 text-sm text-[var(--color-text-secondary)]">
                    Загружаем ваши команды...
                </div>
            ) : ownedTeams.length === 0 ? (
                <div className="mt-8 rounded-[32px] border border-dashed border-[var(--color-border)] bg-[rgba(255,255,255,0.55)] p-8">
                    <h3 className="text-lg font-semibold text-[var(--color-text-main)]">
                        Команд пока нет
                    </h3>
                    <p className="mt-2 max-w-xl text-sm text-[var(--color-text-secondary)]">
                        Создайте первую заявку на турнир. После отправки она появится на этой странице со статусом и возможностью редактирования.
                    </p>
                    <div className="mt-6">
                        <Link to="/lk/reg_team">
                            <PrimaryButton active leftIcon={<PlusSquare size={16} />}>
                                Перейти к регистрации
                            </PrimaryButton>
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="mt-8 grid gap-5">
                    {ownedTeams.map((team) => (
                        <div
                            key={team.id}
                            className={`rounded-[32px] border p-6 transition ${editingTeamId === team.id
                                ? "border-[var(--color-primary)] bg-[rgba(255,255,255,0.96)] shadow-[0_18px_50px_rgba(15,23,42,0.10)]"
                                : "border-[var(--color-border)] bg-[rgba(255,255,255,0.74)]"
                                }`}
                        >
                            {(() => {
                                const paymentLink = getTeamPaymentLink(team);
                                const shouldShowPaymentLink = !team.is_paid && team.status === "ACCEPTED" && Boolean(paymentLink);
                                const shouldShowPaidState = team.is_paid === true;
                                const appreciationsCount = Array.isArray(team.appreciations)
                                    ? team.appreciations.filter((item) => String(item ?? "").trim().length > 0).length
                                    : 0;
                                const nominationsCount = Array.isArray(team.special_nominations) ? team.special_nominations.length : 0;
                                const canDownloadAppreciation = false && appreciationsCount > 0;
                                const canDownloadDiploma = team.league_status === "ENDED" && Boolean(team.diploma);
                                const canDownloadNominations = false && nominationsCount > 0;
                                const teamFileBaseName = getTeamFileBaseName(team);

                                return (
                                    <div className="flex flex-col gap-6">
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="space-y-4">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <h4 className="text-lg font-semibold text-[var(--color-text-main)]">
                                                        {team.name}
                                                    </h4>
                                                    <span className="rounded-full bg-[rgba(15,23,42,0.06)] px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)]">
                                                        {getTeamStatusLabel(team.status)}
                                                    </span>
                                                    {editingTeamId === team.id ? (
                                                        <span className="rounded-full bg-[rgba(14,116,144,0.12)] px-3 py-1 text-xs font-medium text-[var(--color-primary)]">
                                                            Сейчас редактируется
                                                        </span>
                                                    ) : null}
                                                </div>

                                                <div className="flex flex-wrap gap-3">
                                                    <InfoBadge
                                                        icon={<Trophy size={14} />}
                                                        text={team.event_name ?? "Мероприятие не указано"}
                                                    />
                                                    <InfoBadge
                                                        icon={<MapPin size={14} />}
                                                        text={team.location_name ?? "Площадка не указана"}
                                                    />
                                                    <InfoBadge
                                                        icon={<Users size={14} />}
                                                        text={team.league_name ?? "Лига не указана"}
                                                    />
                                                    <InfoBadge
                                                        icon={<CalendarDays size={14} />}
                                                        text={formatEventDate(team.event_date ?? "")}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-3 sm:flex-row">
                                                {team.status === "ACCEPTED" ? (
                                                    <OutlineButton
                                                        active
                                                        onClick={() => void handleCheckPayment(team.id)}
                                                        disabled={checkingPaymentTeamId === team.id}
                                                    >
                                                        {checkingPaymentTeamId === team.id ? "Проверяем..." : "Проверить оплату"}
                                                    </OutlineButton>
                                                ) : null}
                                                {canDownloadAppreciation ? (
                                                    <OutlineButton
                                                        active
                                                        onClick={() => void downloadTeamDocument(team.id, "appreciation", `${teamFileBaseName}_благодарность.pdf`)}
                                                    >
                                                        {appreciationsCount === 1 ? "Скачать благодарность" : "Скачать благодарности"}
                                                    </OutlineButton>
                                                ) : null}
                                                {canDownloadDiploma ? (
                                                    <OutlineButton
                                                        active
                                                        onClick={() => void downloadTeamDocument(team.id, "diploma", `${teamFileBaseName}_${team.diploma === "PARTICIPANT" ? "сертификат" : "диплом"}.pdf`)}
                                                    >
                                                        {team.diploma === "PARTICIPANT" ? "Скачать сертификат" : "Скачать диплом"}
                                                    </OutlineButton>
                                                ) : null}
                                                {canDownloadNominations ? (
                                                    <OutlineButton
                                                        active
                                                        onClick={() => void downloadTeamDocument(team.id, "special-nominations", `${teamFileBaseName}_спецноминации.pdf`)}
                                                    >
                                                        {nominationsCount === 1 ? "Скачать номинацию" : "Скачать номинации"}
                                                    </OutlineButton>
                                                ) : null}
                                                {team.owner_can_edit ? (
                                                    <OutlineButton
                                                        active
                                                        leftIcon={<Pencil size={16} />}
                                                        onClick={() => applyTeamToForm(team)}
                                                    >
                                                        Изменить
                                                    </OutlineButton>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="rounded-[24px] border border-[rgba(245,158,11,0.32)] bg-[rgba(255,247,237,0.96)] p-5">
                                            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[rgba(154,52,18,0.95)]">
                                                Важно
                                            </p>
                                            <p className="mt-3 text-sm leading-7 text-[var(--color-text-main)]">
                                                В день турнира при регистрации команды руководитель предоставляет на каждого участника:
                                            </p>
                                            <div className="mt-3 space-y-2 text-sm leading-7 text-[var(--color-text-main)]">
                                                <p>
                                                    <span className="font-semibold uppercase">Справку об отсутствии контактов с инфекционными больными</span>
                                                    {" "}(выдаётся за 3 дня).
                                                </p>
                                                <p>
                                                    <span className="font-semibold uppercase">Справку из школы</span>.
                                                </p>
                                                <p>
                                                    <span className="font-semibold uppercase">Согласие на фото-видеосъёмку</span>
                                                    {" "}
                                                    <button
                                                        type="button"
                                                        onClick={downloadPhotoVideoConsentFile}
                                                        className="text-[var(--color-primary)] underline underline-offset-2"
                                                    >
                                                        скачать
                                                    </button>
                                                    .
                                                </p>
                                                <p>
                                                    <span className="font-semibold uppercase">Согласие на добровольное медицинское вмешательство</span>
                                                    {" "}
                                                    <button
                                                        type="button"
                                                        onClick={downloadMedicalInterventionFile}
                                                        className="text-[var(--color-primary)] underline underline-offset-2"
                                                    >
                                                        скачать
                                                    </button>
                                                    .
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                                            <div className="rounded-[24px] border border-[var(--color-border)] bg-[rgba(248,250,252,0.72)] p-5">
                                                <p className="text-sm font-medium text-[var(--color-text-main)]">
                                                    Состав команды
                                                </p>
                                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                                    {team.members.map((member, index) => (
                                                        <div
                                                            key={`${team.id}-${index}`}
                                                            className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-[var(--color-text-main)]"
                                                        >
                                                            <span className="block text-xs text-[var(--color-text-secondary)]">
                                                                Участник {index + 1}
                                                            </span>
                                                            <span className="mt-1 block font-medium">
                                                                {member}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="rounded-[24px] border border-[var(--color-border)] bg-[rgba(248,250,252,0.72)] p-5">
                                                <p className="text-sm font-medium text-[var(--color-text-main)]">
                                                    Данные заявки
                                                </p>
                                                <div className="mt-4 space-y-3 text-sm">
                                                    <div>
                                                        <span className="text-[var(--color-text-secondary)]">Статус</span>
                                                        <p className="mt-1 text-[var(--color-text-main)]">{getTeamStatusLabel(team.status)}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[var(--color-text-secondary)]">Учебное заведение</span>
                                                        <p className="mt-1 text-[var(--color-text-main)]">{team.school}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[var(--color-text-secondary)]">Регион</span>
                                                        <p className="mt-1 text-[var(--color-text-main)]">{team.region}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[var(--color-text-secondary)]">Сопровождающий</span>
                                                        <p className="mt-1 text-[var(--color-text-main)]">{team.maintainer_full_name || "Не указан"}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[var(--color-text-secondary)]">Активность сопровождающего</span>
                                                        <p className="mt-1 text-[var(--color-text-main)]">{team.maintainer_activity || "Не выбрана"}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[var(--color-text-secondary)]">Количество обедов</span>
                                                        <p className="mt-1 text-[var(--color-text-main)]">{team.meals_count}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[var(--color-text-secondary)]">Обновлено</span>
                                                        <p className="mt-1 text-[var(--color-text-main)]">{formatDateTime(team.updated_at)}</p>
                                                    </div>
                                                    {shouldShowPaymentLink ? (
                                                        <div className="rounded-2xl border border-[rgba(14,116,144,0.18)] bg-[rgba(14,116,144,0.08)] p-4">
                                                            <span className="text-[var(--color-text-secondary)]">Оплата участия</span>
                                                            <p className="mt-1 text-[var(--color-text-main)]">
                                                                Ваша заявка одобрена. Пожалуйста, оплатите участие по ссылке ниже.
                                                            </p>
                                                            <a
                                                                href={paymentLink!}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                                                            >
                                                                Перейти к оплате
                                                                <ChevronRight size={16} />
                                                            </a>
                                                        </div>
                                                    ) : null}
                                                    {shouldShowPaidState ? (
                                                        <div className="rounded-2xl border border-[rgba(34,197,94,0.18)] bg-[rgba(34,197,94,0.08)] p-4">
                                                            <span className="text-[var(--color-text-secondary)]">Оплата участия</span>
                                                            <p className="mt-1 text-[var(--color-text-main)]">
                                                                Участие полностью оплачено.
                                                            </p>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
