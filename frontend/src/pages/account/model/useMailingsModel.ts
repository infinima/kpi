import { eventApi } from "@/entities/event/api/eventApi";
import { leagueApi } from "@/entities/league/api/leagueApi";
import { locationApi } from "@/entities/location/api/locationApi";
import { mailingApi } from "@/entities/mailing/api/mailingApi";
import { useUser } from "@/entities/session/model/session";
import { confirmWithNotification } from "@/shared/lib/confirmWithNotification";
import { useUrlState } from "@/shared/lib/useUrlState";
import { useNotifications } from "@/shared/model/notifications";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ChangeEvent } from "react";
import { DraftAttachment, EventLookupResponse, LeagueLookupResponse, LocationLookupResponse, Mailing, MailingDetails, MailingFormState, SelectionLookup, SelectionLookupMap, buildMailingPayload, createEmptyForm, createEmptyLookup, createFormFromMailing, fileToBase64, renderMailingPreview, selectionTypeLabels, statusLabels } from './mailingsSupport';
export function useMailingsModel() {
    const notify = useNotifications((state) => state.addMessage);

    const { can } = useUser();

    const bodyTextareaRef = useRef<HTMLTextAreaElement | null>(null);

    const [query, setQuery] = useUrlState<string>("mailings_q", "");

    const [editingId, setEditingId] = useState<number | "new" | null>(null);

    const [form, setForm] = useState<MailingFormState>(createEmptyForm());

    const [draftAttachments, setDraftAttachments] = useState<DraftAttachment[]>([]);

    const [saving, setSaving] = useState(false);

    const [sendingMailingId, setSendingMailingId] = useState<number | null>(null);

    const [resendingRecipientIds, setResendingRecipientIds] = useState<number[]>([]);

    const [deliveryMessages, setDeliveryMessages] = useState<Record<number, string>>({});

    const [recipientsExpanded, setRecipientsExpanded] = useState<Record<number, boolean>>({});

    const [mailingCardsExpanded, setMailingCardsExpanded] = useState<Record<number, boolean>>({});

    const [editorSplit, setEditorSplit] = useState(52);

    const [selectionLookup, setSelectionLookup] = useState<SelectionLookupMap>({
        event: createEmptyLookup("Мероприятие"),
        location: createEmptyLookup("Площадка"),
        league: createEmptyLookup("Лига"),
    });

    const previewHtml = useMemo(() => renderMailingPreview(form.body), [form.body]);

    useEffect(() => {
        let cancelled = false;

        async function resolveLookup<T>(
            value: string,
            load: (id: string) => Promise<T>,
            entityLabel: string,
            toLookup: (data: T) => SelectionLookup,
            apply: (lookup: SelectionLookup) => void,
        ) {
            const trimmed = value.trim();
            if (!trimmed) {
                apply(createEmptyLookup(entityLabel));
                return;
            }

            if (!/^\d+$/.test(trimmed)) {
                apply({
                    status: "missing",
                    label: `${entityLabel} не найден`,
                    subtitle: "Введите корректный числовой id",
                });
                return;
            }

            apply({
                status: "loading",
                label: `Проверяем ${entityLabel.toLowerCase()} #${trimmed}...`,
            });

            try {
                const data = await queryClient.fetchQuery({ queryKey: ["mailing-lookup", entityLabel, trimmed], queryFn: () => load(trimmed) });
                if (!cancelled) {
                    apply(toLookup(data));
                }
            } catch {
                if (!cancelled) {
                    apply({
                        status: "missing",
                        label: `${entityLabel} #${trimmed} не найден`,
                        subtitle: "Проверьте id или оставьте поле пустым",
                    });
                }
            }
        }

        const timer = window.setTimeout(() => {
            void resolveLookup<EventLookupResponse>(
                form.selection_event_id,
                eventApi.get,
                "Мероприятие",
                (data) => ({
                    status: "found",
                    label: data.name || `Мероприятие #${data.id}`,
                    subtitle: data.date ? `Дата: ${data.date}` : `ID: ${data.id}`,
                }),
                (lookup) => setSelectionLookup((current) => ({ ...current, event: lookup })),
            );

            void resolveLookup<LocationLookupResponse>(
                form.selection_location_id,
                locationApi.get,
                "Площадка",
                (data) => ({
                    status: "found",
                    label: data.name || `Площадка #${data.id}`,
                    subtitle: data.address || `ID: ${data.id}`,
                }),
                (lookup) => setSelectionLookup((current) => ({ ...current, location: lookup })),
            );

            void resolveLookup<LeagueLookupResponse>(
                form.selection_league_id,
                leagueApi.get,
                "Лига",
                (data) => ({
                    status: "found",
                    label: data.name || `Лига #${data.id}`,
                    subtitle: data.status ? `Статус: ${data.status}` : `ID: ${data.id}`,
                }),
                (lookup) => setSelectionLookup((current) => ({ ...current, league: lookup })),
            );
        }, 250);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [form.selection_event_id, form.selection_league_id, form.selection_location_id]);

    const editorColumnsStyle = useMemo<CSSProperties>(() => ({
        ["--mailing-editor-columns" as string]: `minmax(0, ${editorSplit}fr) minmax(320px, ${100 - editorSplit}fr)`,
    }), [editorSplit]);

    async function loadMailingDetails(mailingId: number) {
        const detail = await mailingApi.details(mailingId, { error: true });
        setDetailsMap((current) => ({ ...current, [mailingId]: detail }));
        setMailings((current) => current.map((item) => item.id === mailingId ? {
            ...item,
            ...detail,
        } : item));
        return detail;
    }

    const queryClient = useQueryClient();
    const mailingQuery = useQuery({
        queryKey: ["mailings"], queryFn: async () => {
            const rows = await mailingApi.list({ error: true });
            const entries = await Promise.all(rows.map(async (row) => {
                try { return [row.id, await mailingApi.details(row.id, { error: true })] as const; }
                catch { return null; }
            }));
            return { rows, details: Object.fromEntries(entries.filter((entry): entry is NonNullable<typeof entry> => entry !== null)) };
        }
    });
    const mailings = mailingQuery.data?.rows ?? [];
    const detailsMap = mailingQuery.data?.details ?? {};
    const loading = mailingQuery.isLoading;
    const loadMailings = async () => { await queryClient.invalidateQueries({ queryKey: ["mailings"] }); };
    function setMailings(update: (rows: Mailing[]) => Mailing[]) {
        queryClient.setQueryData<typeof mailingQuery.data>(["mailings"], (previous) => previous ? { ...previous, rows: update(previous.rows) } : previous);
    }
    function setDetailsMap(update: (details: Record<number, MailingDetails>) => Record<number, MailingDetails>) {
        queryClient.setQueryData<typeof mailingQuery.data>(["mailings"], (previous) => previous ? { ...previous, details: update(previous.details) } : previous);
    }

    const filteredMailings = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) {
            return mailings;
        }

        return mailings.filter((mailing) => {
            const details = detailsMap[mailing.id];
            return [
                String(mailing.id),
                mailing.subject,
                mailing.body,
                statusLabels[mailing.status],
                details?.selection_type ? selectionTypeLabels[details.selection_type] : "",
                ...(mailing.selection_manual_emails ?? []),
                ...(details?.team_names ?? []),
            ].some((value) => String(value).toLowerCase().includes(normalized));
        });
    }, [detailsMap, mailings, query]);

    function resetEditor() {
        setEditingId(null);
        setForm(createEmptyForm());
        setDraftAttachments([]);
    }

    function startCreate() {
        setEditingId("new");
        setForm(createEmptyForm());
        setDraftAttachments([]);
    }

    function startEdit(mailingId: number) {
        const details = detailsMap[mailingId];
        if (!details) {
            return;
        }

        setEditingId(mailingId);
        setForm(createFormFromMailing(details));
        setDraftAttachments([]);
    }

    async function saveMailing() {
        setSaving(true);
        try {
            const payload = buildMailingPayload(form);
            if (draftAttachments.length > 0) {
                payload.shared_attachments = draftAttachments;
            }

            if (editingId === "new") {
                await mailingApi.create(payload, { success: "Рассылка создана", error: true });
            } else if (typeof editingId === "number") {
                await mailingApi.update(editingId, payload, { success: "Рассылка обновлена", error: true });
            }

            resetEditor();
            await loadMailings();
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(mailingId: number) {
        if (!await confirmWithNotification({ text: "Точно удалить рассылку?" })) {
            return;
        }

        await mailingApi.remove(mailingId);
        await loadMailings();
    }

    async function handleRefresh() {
        await loadMailings();
    }

    async function handleStartMailing(mailingId: number) {
        setSendingMailingId(mailingId);
        setDeliveryMessages((current) => ({ ...current, [mailingId]: "Отправляем письма и ждём ответ сервера..." }));

        try {
            const response = await mailingApi.start(mailingId,
                { error: true }
            );

            await loadMailingDetails(mailingId);
            setDeliveryMessages((current) => ({
                ...current,
                [mailingId]: `Отправка завершена: доставлено ${response.sent}, ошибок ${response.failed}.`,
            }));
            notify({ type: response.failed > 0 ? "warning" : "success", text: response.failed > 0 ? "Рассылка отправлена частично" : "Рассылка отправлена" });
        } finally {
            setSendingMailingId(null);
        }
    }

    async function handleResendRecipient(mailingId: number, recipientId: number) {
        setResendingRecipientIds((current) => [...current, recipientId]);
        try {
            await mailingApi.resend(recipientId, {
                success: "Письмо переотправлено",
                error: true,
            });
            await loadMailingDetails(mailingId);
        } finally {
            setResendingRecipientIds((current) => current.filter((id) => id !== recipientId));
        }
    }

    function insertTemplateToken(token: string) {
        const textarea = bodyTextareaRef.current;
        if (!textarea) {
            setForm((prev) => ({ ...prev, body: `${prev.body}${token}` }));
            return;
        }

        const start = textarea.selectionStart ?? form.body.length;
        const end = textarea.selectionEnd ?? form.body.length;
        const nextValue = `${form.body.slice(0, start)}${token}${form.body.slice(end)}`;

        setForm((prev) => ({ ...prev, body: nextValue }));

        requestAnimationFrame(() => {
            textarea.focus();
            const caret = start + token.length;
            textarea.setSelectionRange(caret, caret);
        });
    }

    async function handleAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
        const files = Array.from(event.target.files ?? []);
        if (files.length === 0) {
            return;
        }

        const nextAttachments = await Promise.all(files.map(async (file) => ({
            name: file.name,
            file: await fileToBase64(file),
        })));

        setDraftAttachments((current) => [...current, ...nextAttachments]);
        event.target.value = "";
    }
    return {
        notify,
        can,
        bodyTextareaRef,
        mailings,
        setMailings,
        detailsMap,
        setDetailsMap,
        loading,
        query,
        setQuery,
        editingId,
        setEditingId,
        form,
        setForm,
        draftAttachments,
        setDraftAttachments,
        saving,
        setSaving,
        sendingMailingId,
        setSendingMailingId,
        resendingRecipientIds,
        setResendingRecipientIds,
        deliveryMessages,
        setDeliveryMessages,
        recipientsExpanded,
        setRecipientsExpanded,
        mailingCardsExpanded,
        setMailingCardsExpanded,
        editorSplit,
        setEditorSplit,
        selectionLookup,
        setSelectionLookup,
        previewHtml,
        editorColumnsStyle,
        loadMailingDetails,
        loadMailings,
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
    };
}
