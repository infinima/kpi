import {
    downloadContractFile
} from "@/shared/lib/legalDownloads";
import OutlineButton from "@/shared/ui/OutlineButton";
import PrimaryButton from "@/shared/ui/PrimaryButton";
import {
    CalendarDays,
    Check,
    MapPin,
    Trophy,
    Users
} from "lucide-react";
import { customRegionValue, customSchoolValue, isMealsCountInvalid, regionOptions, schoolOptions } from '../model/forms';
import type { useCabinetModel } from '../model/useCabinetModel';
import { InfoBadge, RequiredLabel, formatEventDate, getTeamStatusLabel, inputClassName, readOnlyClassName, withValidationClass } from './cabinetPresentation';
export function RegistrationSection(props: ReturnType<typeof useCabinetModel>) {
    const {
        registrationData,
        registrationLoading,
        teamSaving,
        teamForm,
        setTeamForm,
        teamSubmitAttempted,
        selectedEvent,
        selectedLocation,
        selectedLeague,
        hasUnlimitedPlaces,
        availablePlaces,
        editingTeam,
        resetTeamEditor,
        handleMemberChange,
        handleEventChange,
        handleLocationChange,
        handleSchoolModeChange,
        handleRegionModeChange,
        handleTeamSubmit,
    } = props;
    return (
        <div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                    <h2 className="text-2xl font-semibold text-[var(--color-text-main)]">
                        Регистрация команды
                    </h2>
                </div>
            </div>

            {registrationLoading ? (
                <p className="mt-8 text-sm text-[var(--color-text-secondary)]">
                    Загружаем доступные турниры...
                </p>
            ) : registrationData.length === 0 && !editingTeam ? (
                <div className="mt-8 rounded-[28px] border border-dashed border-[var(--color-border)] bg-[rgba(255,255,255,0.55)] p-6 text-sm text-[var(--color-text-secondary)]">
                    Сейчас нет лиг с открытой регистрацией.
                </div>
            ) : (
                <>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-[var(--color-text-main)]">
                                {editingTeam ? `Редактирование команды «${editingTeam.name}»` : "Новая заявка"}
                            </h3>
                        </div>

                        {editingTeam ? (
                            <OutlineButton
                                active
                                onClick={resetTeamEditor}
                            >
                                Отменить редактирование
                            </OutlineButton>
                        ) : null}
                    </div>

                    {editingTeam ? (
                        <div className="mt-6 flex flex-wrap gap-3">
                            <InfoBadge
                                icon={<Check size={14} />}
                                text={`Статус: ${getTeamStatusLabel(editingTeam.status)}`}
                            />
                            <InfoBadge
                                icon={<CalendarDays size={14} />}
                                text={`Дата: ${formatEventDate(editingTeam.event_date ?? "")}`}
                            />
                            <InfoBadge
                                icon={<Trophy size={14} />}
                                text={`Мероприятие: ${editingTeam.event_name ?? "не указано"}`}
                            />
                            <InfoBadge
                                icon={<MapPin size={14} />}
                                text={`Площадка: ${editingTeam.location_name ?? "не указана"}`}
                            />
                            <InfoBadge
                                icon={<Users size={14} />}
                                text={`Лига: ${editingTeam.league_name ?? "не указана"}`}
                            />
                        </div>
                    ) : (
                        <div className="mt-8 grid gap-5 lg:grid-cols-3">
                            <label className="block space-y-2">
                                <RequiredLabel invalid={teamSubmitAttempted && !teamForm.eventId}>Мероприятие</RequiredLabel>
                                <select
                                    value={teamForm.eventId}
                                    onChange={(event) => handleEventChange(event.target.value)}
                                    className={withValidationClass(inputClassName, teamSubmitAttempted && !teamForm.eventId)}
                                >
                                    <option value="">Выберите мероприятие</option>
                                    {registrationData.map((event) => (
                                        <option key={event.id} value={event.id}>
                                            {event.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="block space-y-2">
                                <RequiredLabel invalid={teamSubmitAttempted && !teamForm.locationId}>Площадка</RequiredLabel>
                                <select
                                    value={teamForm.locationId}
                                    onChange={(event) => handleLocationChange(event.target.value)}
                                    className={withValidationClass(inputClassName, teamSubmitAttempted && !teamForm.locationId)}
                                    disabled={!selectedEvent}
                                >
                                    <option value="">Выберите площадку</option>
                                    {selectedEvent?.locations.map((location) => (
                                        <option key={location.id} value={location.id}>
                                            {location.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="block space-y-2">
                                <RequiredLabel invalid={teamSubmitAttempted && !teamForm.leagueId}>Лига</RequiredLabel>
                                <select
                                    value={teamForm.leagueId}
                                    onChange={(event) => setTeamForm((prev) => ({ ...prev, leagueId: event.target.value }))}
                                    className={withValidationClass(inputClassName, teamSubmitAttempted && !teamForm.leagueId)}
                                    disabled={!selectedLocation}
                                >
                                    <option value="">Выберите лигу</option>
                                    {selectedLocation?.leagues.map((league) => (
                                        <option key={league.id} value={league.id} disabled={!props.canRegisterLeague(league)}>
                                            {league.name}{!props.canRegisterLeague(league) ? " — регистрация закрыта" : league.max_teams_count > 0 && league.teams_count >= league.max_teams_count ? " (резерв)" : ""}
                                        </option>
                                    ))}
                                </select>
                                {selectedLocation && !selectedLocation.leagues.some(props.canRegisterLeague) && <p className="text-sm text-[var(--color-text-secondary)]">На этой площадке регистрация в лиги пока не открыта. Выберите другую площадку или вернитесь позже.</p>}
                            </label>
                        </div>
                    )}

                    {!editingTeam && selectedEvent ? (
                        <div className="mt-6 flex flex-wrap gap-3">
                            <InfoBadge
                                icon={<CalendarDays size={14} />}
                                text={`Дата: ${formatEventDate(selectedEvent.date)}`}
                            />
                            {selectedLocation ? (
                                <InfoBadge
                                    icon={<MapPin size={14} />}
                                    text={`Адрес: ${selectedLocation.address}`}
                                />
                            ) : null}
                            {selectedLeague ? (
                                <InfoBadge
                                    icon={<Users size={14} />}
                                    text={hasUnlimitedPlaces ? "Мест неограниченно" : `Осталось мест: ${availablePlaces ?? 0}`}
                                />
                            ) : null}
                        </div>
                    ) : null}

                    {!editingTeam && selectedLeague && !hasUnlimitedPlaces && availablePlaces === 0 ? (
                        <div className="mt-6 rounded-[24px] border border-[rgba(245,158,11,0.28)] bg-[rgba(245,158,11,0.10)] px-5 py-4">
                            <p className="text-sm font-medium text-[var(--color-text-main)]">
                                Свободные места закончились. Сейчас доступна регистрация ТОЛЬКО в резерв.
                            </p>
                        </div>
                    ) : null}

                    {!editingTeam ? (
                        <div className="mt-6 rounded-[24px] border border-[rgba(14,116,144,0.18)] bg-[rgba(14,116,144,0.08)] px-5 py-4">
                            <p className="text-sm font-medium text-[var(--color-text-main)]">
                                Стоимость участия команды: 7000 рублей.
                            </p>
                            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                                Питание оплачивается отдельно. Стоимость обеда: 400 рублей за человека.
                            </p>
                        </div>
                    ) : null}

                    <div className="mt-8 grid gap-5 sm:grid-cols-2">
                        <label className="block space-y-2 sm:col-span-2">
                            {editingTeam ? (
                                <>
                                    <span className="text-sm text-[var(--color-text-secondary)]">Название команды</span>
                                    <input
                                        value={teamForm.name}
                                        readOnly
                                        className={readOnlyClassName}
                                    />
                                </>
                            ) : (
                                <>
                                    <RequiredLabel invalid={teamSubmitAttempted && !teamForm.name.trim()}>Название команды</RequiredLabel>
                                    <input
                                        value={teamForm.name}
                                        onChange={(event) => setTeamForm((prev) => ({ ...prev, name: event.target.value }))}
                                        placeholder="Пифагоры"
                                        className={withValidationClass(inputClassName, teamSubmitAttempted && !teamForm.name.trim())}
                                    />
                                </>
                            )}
                        </label>

                        {editingTeam ? (
                            <>
                                <label className="block space-y-2">
                                    <span className="text-sm text-[var(--color-text-secondary)]">Учебное заведение команды</span>
                                    <input
                                        value={teamForm.school}
                                        readOnly
                                        className={readOnlyClassName}
                                    />
                                </label>

                                <label className="block space-y-2">
                                    <span className="text-sm text-[var(--color-text-secondary)]">Регион</span>
                                    <input
                                        value={teamForm.region}
                                        readOnly
                                        className={readOnlyClassName}
                                    />
                                </label>
                            </>
                        ) : (
                            <>
                                <label className="block space-y-2">
                                    <RequiredLabel invalid={teamSubmitAttempted && !teamForm.schoolMode}>Учебное заведение команды</RequiredLabel>
                                    <select
                                        value={teamForm.schoolMode}
                                        onChange={(event) => handleSchoolModeChange(event.target.value)}
                                        className={withValidationClass(inputClassName, teamSubmitAttempted && !teamForm.schoolMode)}
                                    >
                                        <option value="">Выберите учебное заведение</option>
                                        {schoolOptions.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                        <option value={customSchoolValue}>{customSchoolValue}</option>
                                    </select>
                                </label>

                                <label className="block space-y-2">
                                    <RequiredLabel invalid={teamSubmitAttempted && !teamForm.regionMode}>Регион</RequiredLabel>
                                    <select
                                        value={teamForm.regionMode}
                                        onChange={(event) => handleRegionModeChange(event.target.value)}
                                        className={withValidationClass(inputClassName, teamSubmitAttempted && !teamForm.regionMode)}
                                    >
                                        <option value="">Выберите регион</option>
                                        {regionOptions.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                        <option value={customRegionValue}>{customRegionValue}</option>
                                    </select>
                                </label>

                                {teamForm.schoolMode === customSchoolValue ? (
                                    <label className="block space-y-2">
                                        <RequiredLabel invalid={teamSubmitAttempted && !teamForm.school.trim()}>Свое учебное заведение</RequiredLabel>
                                        <input
                                            value={teamForm.school}
                                            onChange={(event) => setTeamForm((prev) => ({ ...prev, school: event.target.value }))}
                                            className={withValidationClass(inputClassName, teamSubmitAttempted && !teamForm.school.trim())}
                                        />
                                    </label>
                                ) : null}

                                {teamForm.regionMode === customRegionValue ? (
                                    <label className="block space-y-2">
                                        <RequiredLabel invalid={teamSubmitAttempted && !teamForm.region.trim()}>Свой регион</RequiredLabel>
                                        <input
                                            value={teamForm.region}
                                            onChange={(event) => setTeamForm((prev) => ({ ...prev, region: event.target.value }))}
                                            className={withValidationClass(inputClassName, teamSubmitAttempted && !teamForm.region.trim())}
                                        />
                                    </label>
                                ) : null}
                            </>
                        )}

                        {teamForm.members.map((member, index) => (
                            <label key={index} className="block space-y-2">
                                <RequiredLabel invalid={teamSubmitAttempted && !member.trim()}>Участник {index + 1}</RequiredLabel>
                                <input
                                    value={member}
                                    onChange={(event) => handleMemberChange(index, event.target.value)}
                                    placeholder="Фамилия Имя"
                                    className={withValidationClass(inputClassName, teamSubmitAttempted && !member.trim())}
                                />
                            </label>
                        ))}

                        <label className="block space-y-2">
                            <span className="text-sm text-[var(--color-text-secondary)]">Сопровождающий</span>
                            <input
                                value={teamForm.maintainer_full_name}
                                onChange={(event) => setTeamForm((prev) => ({ ...prev, maintainer_full_name: event.target.value }))}
                                placeholder="ФИО сопровождающего"
                                required
                                className={inputClassName}
                            />
                        </label>

                        <label className="block space-y-2">
                            <RequiredLabel invalid={teamSubmitAttempted && isMealsCountInvalid(teamForm.meals_count)}>Количество обедов</RequiredLabel>
                            <span className="block text-xs text-[var(--color-text-secondary)]">
                                Цена: 400 рублей за человека, сопровождающего тоже нужно учитывать.
                            </span>
                            <input
                                type="number"
                                min={0}
                                max={100}
                                value={teamForm.meals_count}
                                onChange={(event) => setTeamForm((prev) => ({ ...prev, meals_count: event.target.value }))}
                                className={withValidationClass(inputClassName, teamSubmitAttempted && isMealsCountInvalid(teamForm.meals_count))}
                            />
                        </label>

                        <label className="block space-y-2 sm:col-span-2">
                            <span className="text-sm text-[var(--color-text-secondary)]">Благодарности</span>
                            <textarea
                                value={teamForm.appreciationsText}
                                onChange={(event) => setTeamForm((prev) => ({ ...prev, appreciationsText: event.target.value }))}
                                placeholder={`По одной строчке на каждого человека, например:\nИванов Иван Сергеевич\nПетрова Мария Алексеевна\nСмирнов Алексей Дмитриевич`}
                                rows={4}
                                className={`${inputClassName} resize-none`}
                            />
                        </label>
                    </div>

                    {!editingTeam ? (
                        <label className={`mt-6 flex items-start gap-3 rounded-[24px] border bg-[rgba(255,255,255,0.72)] px-4 py-4 ${teamSubmitAttempted && !teamForm.acceptedOffer
                            ? "border-[rgba(220,38,38,0.35)] bg-[rgba(254,242,242,0.92)]"
                            : "border-[var(--color-border)]"
                            }`}>
                            <input
                                type="checkbox"
                                checked={teamForm.acceptedOffer}
                                onChange={(event) => setTeamForm((prev) => ({ ...prev, acceptedOffer: event.target.checked }))}
                                className="mt-1 h-4 w-4 rounded border-[var(--color-border)]"
                            />
                            <span className="text-sm text-[var(--color-text-secondary)]">
                                <span className="text-[rgba(220,38,38,0.9)]">*</span>{" "}
                                Подавая заявку на регистрацию вы автоматически соглашаетесь с {" "}
                                <button
                                    type="button"
                                    onClick={downloadContractFile}
                                    className="text-[var(--color-primary)] underline underline-offset-2"
                                >
                                    договором
                                </button>
                                .
                            </span>
                        </label>
                    ) : null}

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col gap-3 sm:flex-row">
                            {editingTeam ? (
                                <OutlineButton
                                    active
                                    onClick={resetTeamEditor}
                                >
                                    Отменить
                                </OutlineButton>
                            ) : null}
                            <PrimaryButton
                                active
                                loading={teamSaving}
                                loadingText={editingTeam ? "Сохраняем..." : (teamForm.isReserve ? "Записываем в очередь..." : "Отправляем...")}
                                leftIcon={<Check size={18} />}
                                onClick={handleTeamSubmit}
                            >
                                {editingTeam
                                    ? "Сохранить изменения"
                                    : (teamForm.isReserve ? "Зарегистрироваться в очередь" : "Подать заявку")}
                            </PrimaryButton>
                        </div>
                    </div>

                    {!editingTeam ? (
                        <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
                            Заявка поступит на рассмотрение. Вы получите уведомление о результате рассмотрения на электронную почту.
                        </p>
                    ) : null}
                </>
            )}
        </div>
    );
}
