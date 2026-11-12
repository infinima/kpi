import OutlineButton from "@/shared/ui/OutlineButton";
import PrimaryButton from "@/shared/ui/PrimaryButton";
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Mail, Paperclip, Pencil, Plus, RotateCcw, Send, Trash2, Users, X } from "lucide-react";
import { formatDate, getDeliveryStatusClass, getDeliveryStatusLabel, inputClassName, renderMailingPreview, selectionTypeLabels, statusLabels, templateFields } from '../model/mailingsSupport';
import type { useMailingsModel } from '../model/useMailingsModel';
export function MailingsView(props: ReturnType<typeof useMailingsModel>) {
    const {
        can,
        bodyTextareaRef,
        detailsMap,
        loading,
        query,
        setQuery,
        editingId,
        form,
        setForm,
        draftAttachments,
        setDraftAttachments,
        saving,
        sendingMailingId,
        resendingRecipientIds,
        deliveryMessages,
        recipientsExpanded,
        setRecipientsExpanded,
        mailingCardsExpanded,
        setMailingCardsExpanded,
        editorSplit,
        setEditorSplit,
        selectionLookup,
        previewHtml,
        editorColumnsStyle,
        filteredMailings,
        resetEditor,
        startCreate,
        startEdit,
        saveMailing,
        handleDelete,
        handleRefresh,
        handleStartMailing,
        handleResendRecipient,
        insertTemplateToken,
        handleAttachmentChange,
    } = props;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                    <h2 className="text-2xl font-semibold text-[var(--color-text-main)]">Рассылки</h2>
                    <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                        Карточки рассылок с полной служебной информацией, получателями, ручными email-адресами и статусом отправки.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[rgba(255,255,255,0.78)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)]">
                        <Mail size={14} className="text-[var(--color-primary)]" />
                        Рассылок: {filteredMailings.length}
                    </div>
                    <OutlineButton active onClick={() => void handleRefresh()} className="px-4 py-2 text-sm" leftIcon={<RotateCcw size={14} />}>
                        Обновить
                    </OutlineButton>
                    {can("mailings", "create") ? (
                        <PrimaryButton active onClick={startCreate} className="px-4 py-2 text-sm shadow-none" leftIcon={<Plus size={14} />}>
                            Создать новую
                        </PrimaryButton>
                    ) : null}
                </div>
            </div>

            <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Поиск по рассылкам..."
                className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[rgba(255,255,255,0.92)] px-4 py-3 text-[var(--color-text-main)] outline-none transition placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary-light)]"
            />

            {editingId !== null ? (
                <div className="rounded-[28px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.92)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="text-xl font-semibold text-[var(--color-text-main)]">
                                {editingId === "new" ? "Новая рассылка" : `Редактирование рассылки #${editingId}`}
                            </div>
                            <div className="mt-1 text-sm text-[var(--color-text-secondary)]">
                                Для первой версии редактируются тема, текст, selection ids и ручной список email.
                            </div>
                        </div>
                        <OutlineButton active onClick={resetEditor} className="px-4 py-2 text-sm">
                            Отмена
                        </OutlineButton>
                    </div>

                    <div className="mt-6 space-y-6">
                        <div className="rounded-[24px] border border-[var(--color-border)] bg-[rgba(248,250,252,0.72)] p-5">
                            <div className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Кому</div>
                            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                                <label className="space-y-2">
                                    <span className="text-sm text-[var(--color-text-secondary)]">Selection event id</span>
                                    <input value={form.selection_event_id} onChange={(event) => setForm((prev) => ({ ...prev, selection_event_id: event.target.value }))} className={inputClassName} />
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm text-[var(--color-text-secondary)]">Selection location id</span>
                                    <input value={form.selection_location_id} onChange={(event) => setForm((prev) => ({ ...prev, selection_location_id: event.target.value }))} className={inputClassName} />
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm text-[var(--color-text-secondary)]">Selection league id</span>
                                    <input value={form.selection_league_id} onChange={(event) => setForm((prev) => ({ ...prev, selection_league_id: event.target.value }))} className={inputClassName} />
                                </label>
                                <label className="space-y-2 lg:col-span-2">
                                    <span className="text-sm text-[var(--color-text-secondary)]">Ручные email-адреса</span>
                                    <textarea value={form.selection_manual_emails} onChange={(event) => setForm((prev) => ({ ...prev, selection_manual_emails: event.target.value }))} rows={4} placeholder="mail1@example.com, mail2@example.com" className={`${inputClassName} resize-y`} />
                                </label>
                            </div>

                            <div className="mt-4 grid gap-3 lg:grid-cols-3">
                                {([
                                    { key: "event", title: "Мероприятие", lookup: selectionLookup.event },
                                    { key: "location", title: "Площадка", lookup: selectionLookup.location },
                                    { key: "league", title: "Лига", lookup: selectionLookup.league },
                                ] as const).map((item) => (
                                    <div
                                        key={item.key}
                                        className={`rounded-[20px] border px-4 py-3 ${item.lookup.status === "found"
                                            ? "border-[rgba(22,163,74,0.16)] bg-[rgba(240,253,244,0.9)]"
                                            : item.lookup.status === "missing"
                                                ? "border-[rgba(220,38,38,0.16)] bg-[rgba(254,242,242,0.9)]"
                                                : "border-[var(--color-border)] bg-white/80"
                                            }`}
                                    >
                                        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">{item.title}</div>
                                        <div className="mt-2 text-sm font-medium text-[var(--color-text-main)]">{item.lookup.label}</div>
                                        {item.lookup.subtitle ? (
                                            <div className="mt-1 text-xs text-[var(--color-text-secondary)]">{item.lookup.subtitle}</div>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-[24px] border border-[var(--color-border)] bg-[rgba(248,250,252,0.72)] p-5">
                            <div className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Письмо</div>
                            <div className="mt-4 grid gap-4">
                                <label className="space-y-2">
                                    <span className="text-sm text-[var(--color-text-secondary)]">Тема</span>
                                    <input value={form.subject} onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))} className={inputClassName} />
                                </label>

                                <div className="rounded-[22px] border border-[var(--color-border)] bg-white p-4">
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                        <div>
                                            <div className="text-sm font-medium text-[var(--color-text-main)]">Баланс редактора и предпросмотра</div>
                                            <div className="mt-1 text-xs text-[var(--color-text-secondary)]">
                                                Передвигайте ползунок по горизонтали, чтобы менять центральное разделение блоков.
                                            </div>
                                        </div>
                                        <div className="text-sm font-medium text-[var(--color-text-secondary)]">
                                            Редактор {editorSplit}% · Предпросмотр {100 - editorSplit}%
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min={35}
                                        max={65}
                                        step={1}
                                        value={editorSplit}
                                        onChange={(event) => setEditorSplit(Number(event.target.value))}
                                        className="mt-4 h-2 w-full cursor-ew-resize accent-[var(--color-primary)]"
                                    />
                                </div>

                                <div
                                    className="grid gap-4 xl:items-start xl:[grid-template-columns:var(--mailing-editor-columns)]"
                                    style={editorColumnsStyle}
                                >
                                    <div className="space-y-2">
                                        <span className="text-sm text-[var(--color-text-secondary)]">Текст письма</span>
                                        <textarea
                                            ref={bodyTextareaRef}
                                            value={form.body}
                                            onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
                                            rows={18}
                                            className={`${inputClassName} resize-y min-h-[420px]`}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="rounded-[22px] border border-[var(--color-border)] bg-white p-4">
                                            <div className="text-sm font-medium text-[var(--color-text-main)]">Предпросмотр HTML</div>
                                            <div className="mt-3 overflow-hidden rounded-[18px] border border-[var(--color-border)] bg-white">
                                                <iframe
                                                    title="mailing-html-preview"
                                                    sandbox=""
                                                    srcDoc={previewHtml}
                                                    className="h-[640px] w-full bg-white"
                                                />
                                            </div>
                                        </div>

                                        <div className="rounded-[22px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.92)] p-4">
                                            <div className="text-sm font-medium text-[var(--color-text-main)]">Автополя</div>
                                            <div className="mt-3 space-y-2">
                                                {templateFields.map((field) => (
                                                    <button
                                                        key={field.token}
                                                        type="button"
                                                        onClick={() => insertTemplateToken(field.token)}
                                                        className="flex w-full items-start justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.72)] px-3 py-3 text-left transition hover:border-[var(--color-primary-light)] hover:bg-white"
                                                    >
                                                        <span className="min-w-0">
                                                            <span className="block font-mono text-sm text-[var(--color-primary)]">{field.token}</span>
                                                            <span className="mt-1 block text-xs text-[var(--color-text-secondary)]">{field.label} - {field.description}</span>
                                                        </span>
                                                        <span className="shrink-0 text-xs font-medium text-[var(--color-text-secondary)]">Вставить</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-[22px] border border-dashed border-[var(--color-border)] bg-[rgba(255,255,255,0.82)] p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <div className="text-sm font-medium text-[var(--color-text-main)]">Вложения</div>
                                            <div className="mt-2 text-sm text-[var(--color-text-secondary)]">
                                                {editingId === "new"
                                                    ? "Файлы будут отправлены вместе с письмом."
                                                    : "Если добавить новые файлы при редактировании, текущие вложения будут заменены."}
                                            </div>
                                        </div>
                                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text-main)] transition hover:border-[var(--color-primary-light)] hover:bg-[rgba(255,255,255,0.98)]">
                                            <Paperclip size={16} />
                                            Прикрепить вложения
                                            <input type="file" multiple className="hidden" onChange={(event) => void handleAttachmentChange(event)} />
                                        </label>
                                    </div>

                                    {draftAttachments.length > 0 ? (
                                        <div className="mt-4 space-y-2">
                                            {draftAttachments.map((attachment, index) => (
                                                <div key={`${attachment.name}-${index}`} className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-white px-3 py-3">
                                                    <span className="min-w-0 truncate text-sm text-[var(--color-text-main)]">{attachment.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDraftAttachments((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                                                        className="text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary)]"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}

                                    {editingId !== "new" && typeof editingId === "number" && detailsMap[editingId]?.shared_attachments.length ? (
                                        <div className="mt-4 space-y-2">
                                            <div className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Текущие вложения</div>
                                            {detailsMap[editingId].shared_attachments.map((attachment) => (
                                                <div key={`${attachment.name}-${attachment.path}`} className="rounded-2xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.72)] px-3 py-3">
                                                    <div className="text-sm text-[var(--color-text-main)]">{attachment.name}</div>
                                                    <div className="mt-1 break-all text-xs text-[var(--color-text-secondary)]">{attachment.path}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <PrimaryButton active loading={saving} onClick={() => void saveMailing()} className="px-5 py-3 text-sm shadow-none">
                            Сохранить
                        </PrimaryButton>
                    </div>
                </div>
            ) : null}

            {loading ? (
                <div className="rounded-[28px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.84)] px-6 py-8 text-sm text-[var(--color-text-secondary)]">
                    Загрузка рассылок...
                </div>
            ) : filteredMailings.length === 0 ? (
                <div className="rounded-[28px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.84)] px-6 py-8 text-sm text-[var(--color-text-secondary)]">
                    Рассылки не найдены.
                </div>
            ) : (
                <div className="grid gap-5">
                    {filteredMailings.map((mailing) => {
                        const details = detailsMap[mailing.id];
                        const canUpdate = can("mailings", "update", mailing.id) && mailing.status === "draft";
                        const canDelete = can("mailings", "delete", mailing.id);
                        const canSend = can("mailings", "update", mailing.id) && mailing.status === "draft";
                        const isSending = sendingMailingId === mailing.id;
                        const deliveryMessage = deliveryMessages[mailing.id];
                        const recipients = details?.recipients ?? [];
                        const isRecipientsExpanded = recipientsExpanded[mailing.id] ?? false;
                        const isCardExpanded = mailingCardsExpanded[mailing.id] ?? false;

                        return (
                            <article key={mailing.id} className="rounded-[30px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.9)] p-6 shadow-[0_18px_52px_rgba(15,23,42,0.08)]">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h3 className="text-xl font-semibold text-[var(--color-text-main)]">{mailing.subject}</h3>
                                            <span className="rounded-full bg-[rgba(15,23,42,0.06)] px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)]">
                                                #{mailing.id}
                                            </span>
                                            <span className="rounded-full bg-[rgba(14,116,144,0.1)] px-3 py-1 text-xs font-medium text-[var(--color-primary)]">
                                                {statusLabels[mailing.status]}
                                            </span>
                                        </div>
                                        {!isCardExpanded ? (
                                            <div className="text-sm text-[var(--color-text-secondary)]">
                                                Карточка свернута. Оставлена только тема письма.
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <OutlineButton
                                            active
                                            onClick={() => setMailingCardsExpanded((current) => ({ ...current, [mailing.id]: !isCardExpanded }))}
                                            className="px-4 py-2 text-sm"
                                        >
                                            {isCardExpanded ? "Свернуть" : "Развернуть"}
                                        </OutlineButton>
                                        {canSend ? (
                                            <PrimaryButton
                                                active
                                                loading={isSending}
                                                onClick={() => void handleStartMailing(mailing.id)}
                                                className="px-4 py-2 text-sm shadow-none"
                                                leftIcon={<Send size={14} />}
                                            >
                                                Отправить черновик
                                            </PrimaryButton>
                                        ) : null}
                                        {canUpdate ? (
                                            <OutlineButton active onClick={() => startEdit(mailing.id)} className="px-4 py-2 text-sm" leftIcon={<Pencil size={14} />}>
                                                Изменить
                                            </OutlineButton>
                                        ) : null}
                                        {canDelete ? (
                                            <OutlineButton active onClick={() => void handleDelete(mailing.id)} className="px-4 py-2 text-sm" leftIcon={<Trash2 size={14} />}>
                                                Удалить
                                            </OutlineButton>
                                        ) : null}
                                    </div>
                                </div>

                                {deliveryMessage && isCardExpanded ? (
                                    <div className={`mt-4 flex items-center gap-3 rounded-[22px] border px-4 py-3 text-sm ${isSending
                                        ? "border-[rgba(14,116,144,0.18)] bg-[rgba(14,116,144,0.08)] text-[var(--color-primary)]"
                                        : "border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.92)] text-[var(--color-text-main)]"
                                        }`}>
                                        {isSending ? <RotateCcw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                        <span>{deliveryMessage}</span>
                                    </div>
                                ) : null}

                                {isCardExpanded ? (
                                    <>
                                        <div className="mt-6 overflow-hidden rounded-[22px] border border-[var(--color-border)] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                                            <iframe
                                                title={`mailing-preview-${mailing.id}`}
                                                sandbox=""
                                                srcDoc={renderMailingPreview(mailing.body)}
                                                className="h-[520px] w-full bg-white"
                                            />
                                        </div>

                                        <div className="mt-6 grid gap-4 xl:grid-cols-3">
                                            <div className="rounded-[22px] border border-[var(--color-border)] bg-[rgba(248,250,252,0.72)] p-4">
                                                <div className="text-sm font-medium text-[var(--color-text-main)]">Параметры выборки</div>
                                                <div className="mt-3 space-y-2 text-sm text-[var(--color-text-main)]">
                                                    <div><span className="text-[var(--color-text-secondary)]">Тип:</span> {details ? selectionTypeLabels[details.selection_type] : "—"}</div>
                                                    <div><span className="text-[var(--color-text-secondary)]">Event ID:</span> {mailing.selection_event_id ?? "—"}</div>
                                                    <div><span className="text-[var(--color-text-secondary)]">Location ID:</span> {mailing.selection_location_id ?? "—"}</div>
                                                    <div><span className="text-[var(--color-text-secondary)]">League ID:</span> {mailing.selection_league_id ?? "—"}</div>
                                                </div>
                                            </div>

                                            <div className="rounded-[22px] border border-[var(--color-border)] bg-[rgba(248,250,252,0.72)] p-4">
                                                <div className="text-sm font-medium text-[var(--color-text-main)]">Получатели</div>
                                                <div className="mt-3 space-y-2 text-sm text-[var(--color-text-main)]">
                                                    <div><span className="text-[var(--color-text-secondary)]">Всего:</span> {details?.recipients.length ?? "—"}</div>
                                                    <div><span className="text-[var(--color-text-secondary)]">Команд:</span> {details?.team_names.length ?? 0}</div>
                                                    <div><span className="text-[var(--color-text-secondary)]">Ручных email:</span> {(mailing.selection_manual_emails ?? []).length}</div>
                                                </div>
                                                {details?.team_names.length ? (
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {details.team_names.slice(0, 8).map((teamName) => (
                                                            <span key={teamName} className="rounded-full bg-white px-3 py-1 text-xs text-[var(--color-text-secondary)]">{teamName}</span>
                                                        ))}
                                                        {details.team_names.length > 8 ? <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--color-text-secondary)]">+{details.team_names.length - 8}</span> : null}
                                                    </div>
                                                ) : null}
                                            </div>

                                            <div className="rounded-[22px] border border-[var(--color-border)] bg-[rgba(248,250,252,0.72)] p-4">
                                                <div className="text-sm font-medium text-[var(--color-text-main)]">Служебная информация</div>
                                                <div className="mt-3 space-y-2 text-sm text-[var(--color-text-main)]">
                                                    <div><span className="text-[var(--color-text-secondary)]">Создана:</span> {formatDate(mailing.created_at)}</div>
                                                    <div><span className="text-[var(--color-text-secondary)]">Обновлена:</span> {formatDate(mailing.updated_at)}</div>
                                                    <div><span className="text-[var(--color-text-secondary)]">Старт отправки:</span> {formatDate(mailing.send_started_at)}</div>
                                                    <div><span className="text-[var(--color-text-secondary)]">Финиш отправки:</span> {formatDate(mailing.send_finished_at)}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                            <div className="rounded-[22px] border border-[var(--color-border)] bg-[rgba(248,250,252,0.72)] p-4">
                                                <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-main)]">
                                                    <Users size={14} />
                                                    Ручные email-адреса
                                                </div>
                                                <div className="mt-3 space-y-2 text-sm text-[var(--color-text-main)]">
                                                    {(mailing.selection_manual_emails ?? []).length === 0 ? (
                                                        <div className="text-[var(--color-text-secondary)]">Нет</div>
                                                    ) : (mailing.selection_manual_emails ?? []).map((email) => (
                                                        <div key={email} className="rounded-2xl bg-white px-3 py-2">{email}</div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="rounded-[22px] border border-[var(--color-border)] bg-[rgba(248,250,252,0.72)] p-4">
                                                <div className="text-sm font-medium text-[var(--color-text-main)]">Общие вложения</div>
                                                <div className="mt-3 space-y-2 text-sm text-[var(--color-text-main)]">
                                                    {mailing.shared_attachments.length === 0 ? (
                                                        <div className="text-[var(--color-text-secondary)]">Нет вложений</div>
                                                    ) : mailing.shared_attachments.map((attachment) => (
                                                        <div key={`${attachment.name}-${attachment.path}`} className="rounded-2xl bg-white px-3 py-2">
                                                            <div>{attachment.name}</div>
                                                            <div className="mt-1 break-all text-xs text-[var(--color-text-secondary)]">{attachment.path}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 rounded-[22px] border border-[var(--color-border)] bg-[rgba(248,250,252,0.72)] p-4">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <div className="text-sm font-medium text-[var(--color-text-main)]">Доставка по получателям</div>
                                                    <div className="mt-1 text-xs text-[var(--color-text-secondary)]">
                                                        {recipients.length === 0 ? "Получатели ещё не сформированы" : `Получателей: ${recipients.length}`}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setRecipientsExpanded((current) => ({ ...current, [mailing.id]: !isRecipientsExpanded }))}
                                                    className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-2 text-sm text-[var(--color-text-main)] transition hover:border-[var(--color-primary-light)] hover:bg-[rgba(255,255,255,0.98)]"
                                                >
                                                    {isRecipientsExpanded ? "Скрыть получателей" : "Показать получателей"}
                                                    {isRecipientsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                </button>
                                            </div>

                                            {!isRecipientsExpanded ? (
                                                <div className="mt-3 rounded-2xl bg-white px-4 py-4 text-sm text-[var(--color-text-secondary)]">
                                                    Получатели скрыты.
                                                </div>
                                            ) : recipients.length === 0 ? (
                                                <div className="mt-3 rounded-2xl bg-white px-4 py-4 text-sm text-[var(--color-text-secondary)]">
                                                    Для черновика список получателей появится после отправки.
                                                </div>
                                            ) : (
                                                <div className="mt-3 space-y-3">
                                                    {recipients.map((recipient) => {
                                                        const isResending = resendingRecipientIds.includes(recipient.id);
                                                        const canResend = can("mailings", "update", mailing.id) && recipient.delivery_status !== "sent";

                                                        return (
                                                            <div key={recipient.id} className="rounded-[20px] border border-[var(--color-border)] bg-white px-4 py-4">
                                                                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                                                    <div className="min-w-0 space-y-2">
                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${getDeliveryStatusClass(recipient.delivery_status)}`}>
                                                                                {getDeliveryStatusLabel(recipient.delivery_status)}
                                                                            </span>
                                                                            <span className="text-sm font-medium text-[var(--color-text-main)]">{recipient.email}</span>
                                                                        </div>
                                                                        <div className="grid gap-1 text-sm text-[var(--color-text-main)] sm:grid-cols-2">
                                                                            <div><span className="text-[var(--color-text-secondary)]">Команда:</span> {recipient.team_name ?? "Ручной адрес"}</div>
                                                                            <div><span className="text-[var(--color-text-secondary)]">Лига:</span> {recipient.league_name ?? "—"}</div>
                                                                            <div><span className="text-[var(--color-text-secondary)]">Попыток:</span> {recipient.attempts_count}</div>
                                                                            <div><span className="text-[var(--color-text-secondary)]">Отправлено:</span> {formatDate(recipient.sent_at)}</div>
                                                                            <div><span className="text-[var(--color-text-secondary)]">Последняя попытка:</span> {formatDate(recipient.last_attempt_at)}</div>
                                                                            <div><span className="text-[var(--color-text-secondary)]">Message ID:</span> {recipient.provider_message_id ?? "—"}</div>
                                                                        </div>
                                                                        {recipient.last_error_message ? (
                                                                            <div className="flex items-start gap-2 rounded-2xl bg-[rgba(254,242,242,0.9)] px-3 py-3 text-sm text-[rgb(185,28,28)]">
                                                                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                                                                <span>{recipient.last_error_message}</span>
                                                                            </div>
                                                                        ) : null}
                                                                    </div>

                                                                    {canResend ? (
                                                                        <OutlineButton
                                                                            active
                                                                            loading={isResending}
                                                                            onClick={() => void handleResendRecipient(mailing.id, recipient.id)}
                                                                            className="px-4 py-2 text-sm"
                                                                            leftIcon={<RotateCcw size={14} />}
                                                                        >
                                                                            Переотправить
                                                                        </OutlineButton>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : null}
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
