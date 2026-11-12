import OutlineButton from "@/shared/ui/OutlineButton";
import PrimaryButton from "@/shared/ui/PrimaryButton";
import { X } from "lucide-react";
import { diplomaOptions, formatDateTime, formatRussianPhone, inputClassName, isChanged, maintainerActivityOptions, ReadField, statusOptions } from '../model/teamInfoSupport';
import type { useTeamInfoModel } from '../model/useTeamInfoModel';
export function TeamInfoView(props: ReturnType<typeof useTeamInfoModel>) {
    const {
        payload,
        closeModal,
        navigate,
        draft,
        setDraft,
        isEditing,
        canEditField,
        setIsEditing,
        saving,
        checkingPayment,
        paymentLink,
        canSave,
        canHistory,
        handleSave,
        handleCheckPayment,
    } = props;
    if (!payload || !draft) return null;
    return (
        <div
            className="fixed inset-0 z-[250] flex items-center justify-center bg-[rgba(15,23,42,0.40)] p-4 backdrop-blur-sm"
            onClick={closeModal}
        >
            <div
                className="flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col rounded-[28px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.96)] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.20)]"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="text-xl font-semibold text-[var(--color-text-main)]">
                            {draft.name || "Команда"}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-sm text-[var(--color-text-secondary)]">
                            <span>{draft.league_name || "Лига не указана"}</span>
                            <span>•</span>
                            <span>{statusOptions.find((option) => option.value === draft.status)?.label ?? draft.status ?? "Неизвестно"}</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={closeModal}
                        className="rounded-lg p-2 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)]"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="mt-6 grid flex-1 gap-4 overflow-y-auto pr-1 lg:grid-cols-2">
                    <ReadField label="ID" value={String(draft.id)} />
                    <ReadField label="Руководитель" value={draft.owner_full_name || "Не указан"} />
                    <ReadField label="Email руководителя" value={draft.owner_email || "Не указан"} />
                    <ReadField label="Телефон руководителя" value={formatRussianPhone(draft.owner_phone_number)} />
                    <ReadField label="Создано" value={formatDateTime(draft.created_at)} />
                    <ReadField label="Обновлено" value={formatDateTime(draft.updated_at)} />
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4 lg:col-span-2">
                        <div className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
                            Ссылка на оплату
                        </div>
                        {paymentLink ? (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <a
                                    href={paymentLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-block break-all text-sm text-[rgb(29,78,216)] underline decoration-[rgb(29,78,216)] underline-offset-2 transition hover:text-[rgb(30,64,175)] hover:decoration-[rgb(30,64,175)]"
                                >
                                    {paymentLink}
                                </a>
                                {payload.onCheckPayment && draft.status === "ACCEPTED" ? (
                                    <OutlineButton
                                        active
                                        onClick={() => void handleCheckPayment()}
                                        disabled={checkingPayment}
                                    >
                                        Проверить оплату
                                    </OutlineButton>
                                ) : null}
                            </div>
                        ) : (
                            <div className="mt-2 text-sm font-medium text-[var(--color-text-main)]">
                                Не указано
                            </div>
                        )}
                    </div>

                    <label className="block space-y-2 rounded-2xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4">
                        <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">ID лиги</span>
                        <input
                            type="number"
                            min={1}
                            value={draft.league_id}
                            readOnly={!isEditing || !canEditField("league_id")}
                            onChange={(event) => setDraft((prev) => prev ? { ...prev, league_id: Number(event.target.value || 0) } : prev)}
                            className={inputClassName(isChanged(draft.league_id, payload.row.league_id))}
                        />
                    </label>

                    <ReadField label="Лига" value={draft.league_name} />

                    <label className="block space-y-2 rounded-2xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4">
                        <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Название команды</span>
                        <input
                            value={draft.name}
                            readOnly={!isEditing || !canEditField("name")}
                            onChange={(event) => setDraft((prev) => prev ? { ...prev, name: event.target.value } : prev)}
                            className={inputClassName(isChanged(draft.name, payload.row.name))}
                        />
                    </label>

                    <label className="block space-y-2 rounded-2xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4">
                        <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Статус</span>
                        <select
                            value={draft.status}
                            disabled={!isEditing || !canEditField("status")}
                            onChange={(event) => setDraft((prev) => prev ? { ...prev, status: event.target.value } : prev)}
                            className={inputClassName(isChanged(draft.status, payload.row.status))}
                        >
                            {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block space-y-2 rounded-2xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4 lg:col-span-2">
                        <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Участники</span>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {draft.members.map((member, index) => (
                                <input
                                    key={index}
                                    value={member}
                                    readOnly={!isEditing}
                                    onChange={(event) => setDraft((prev) => prev ? {
                                        ...prev,
                                        members: prev.members.map((item, itemIndex) => itemIndex === index ? event.target.value : item),
                                    } : prev)}
                                    placeholder={`Участник ${index + 1}`}
                                    className={inputClassName(isChanged(member, payload.row.members[index] ?? ""))}
                                />
                            ))}
                        </div>
                    </label>

                    <label className="block space-y-2 rounded-2xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4">
                        <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Учебное заведение</span>
                        <input
                            value={draft.school}
                            readOnly={!isEditing || !canEditField("school")}
                            onChange={(event) => setDraft((prev) => prev ? { ...prev, school: event.target.value } : prev)}
                            className={inputClassName(isChanged(draft.school, payload.row.school))}
                        />
                    </label>

                    <label className="block space-y-2 rounded-2xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4">
                        <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Регион</span>
                        <input
                            value={draft.region}
                            readOnly={!isEditing || !canEditField("region")}
                            onChange={(event) => setDraft((prev) => prev ? { ...prev, region: event.target.value } : prev)}
                            className={inputClassName(isChanged(draft.region, payload.row.region))}
                        />
                    </label>

                    <label className="block space-y-2 rounded-2xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4">
                        <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Сопровождающий</span>
                        <input
                            value={draft.maintainer_full_name}
                            readOnly={!isEditing || !canEditField("maintainer_full_name")}
                            onChange={(event) => setDraft((prev) => prev ? { ...prev, maintainer_full_name: event.target.value } : prev)}
                            className={inputClassName(isChanged(draft.maintainer_full_name, payload.row.maintainer_full_name))}
                        />
                    </label>

                    <label className="block space-y-2 rounded-2xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4">
                        <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Активность</span>
                        <select
                            value={draft.maintainer_activity}
                            disabled={!isEditing || !canEditField("maintainer_activity")}
                            onChange={(event) => setDraft((prev) => prev ? { ...prev, maintainer_activity: event.target.value } : prev)}
                            className={inputClassName(isChanged(draft.maintainer_activity, payload.row.maintainer_activity))}
                        >
                            <option value="">Не выбрано</option>
                            {maintainerActivityOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block space-y-2 rounded-2xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4">
                        <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Обеды</span>
                        <input
                            type="number"
                            min={0}
                            value={draft.meals_count}
                            readOnly={!isEditing || !canEditField("meals_count")}
                            onChange={(event) => setDraft((prev) => prev ? { ...prev, meals_count: Number(event.target.value || 0) } : prev)}
                            className={inputClassName(isChanged(draft.meals_count, payload.row.meals_count))}
                        />
                    </label>

                    <label className="block space-y-2 rounded-2xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4">
                        <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Диплом</span>
                        <select
                            value={draft.diploma}
                            disabled={!isEditing || !canEditField("diploma")}
                            onChange={(event) => setDraft((prev) => prev ? { ...prev, diploma: event.target.value } : prev)}
                            className={inputClassName(isChanged(draft.diploma, payload.row.diploma))}
                        >
                            {diplomaOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block space-y-2 rounded-2xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4 lg:col-span-2">
                        <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Документы</span>
                        <textarea
                            rows={5}
                            value={draft.documents}
                            readOnly={!isEditing || !canEditField("documents")}
                            onChange={(event) => setDraft((prev) => prev ? { ...prev, documents: event.target.value } : prev)}
                            className={`${inputClassName(isChanged(draft.documents, payload.row.documents))} resize-none`}
                        />
                    </label>

                    {/*<label className="block space-y-2 rounded-2xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4 lg:col-span-2">*/}
                    {/*    <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Благодарности</span>*/}
                    {/*    <textarea*/}
                    {/*        rows={4}*/}
                    {/*        value={buildTextAreaValue(draft.appreciations)}*/}
                    {/*        readOnly={!isEditing || !canEditField("appreciations")}*/}
                    {/*        onChange={(event) => setDraft((prev) => prev ? { ...prev, appreciations: parseTextAreaValue(event.target.value) } : prev)}*/}
                    {/*        className={`${inputClassName(isChanged(draft.appreciations, payload.row.appreciations))} resize-none`}*/}
                    {/*    />*/}
                    {/*</label>*/}

                    {/*<label className="block space-y-2 rounded-2xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4 lg:col-span-2">*/}
                    {/*    <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Документы</span>*/}
                    {/*    <textarea*/}
                    {/*        rows={4}*/}
                    {/*        value={buildTextAreaValue(draft.texts)}*/}
                    {/*        readOnly={!isEditing || !canEditField("texts")}*/}
                    {/*        onChange={(event) => setDraft((prev) => prev ? { ...prev, texts: parseTextAreaValue(event.target.value) } : prev)}*/}
                    {/*        className={`${inputClassName(isChanged(draft.texts, payload.row.texts))} resize-none`}*/}
                    {/*    />*/}
                    {/*</label>*/}

                    {/*<label className="block space-y-2 rounded-2xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4 lg:col-span-2">*/}
                    {/*    <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Номинации</span>*/}
                    {/*    <textarea*/}
                    {/*        rows={3}*/}
                    {/*        value={buildTextAreaValue(draft.special_nominations)}*/}
                    {/*        readOnly={!isEditing || !canEditField("special_nominations")}*/}
                    {/*        onChange={(event) => setDraft((prev) => prev ? { ...prev, special_nominations: parseTextAreaValue(event.target.value) } : prev)}*/}
                    {/*        className={`${inputClassName(isChanged(draft.special_nominations, payload.row.special_nominations))} resize-none`}*/}
                    {/*    />*/}
                    {/*</label>*/}
                </div>

                <div className="mt-5 flex justify-end gap-2 border-t border-[var(--color-border)] pt-4">
                    {canHistory ? (
                        <OutlineButton
                            active
                            onClick={() => {
                                closeModal();
                                navigate(`/logs/teams/${draft.id}`);
                            }}
                        >
                            История
                        </OutlineButton>
                    ) : null}
                    <OutlineButton active onClick={closeModal}>
                        Закрыть
                    </OutlineButton>
                    {!isEditing && payload.canEdit ? (
                        <OutlineButton active onClick={() => setIsEditing(true)}>
                            Изменить
                        </OutlineButton>
                    ) : null}
                    {isEditing ? (
                        <PrimaryButton active loading={saving} loadingText="Сохраняем..." onClick={() => void handleSave()} disabled={!canSave}>
                            Сохранить
                        </PrimaryButton>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
