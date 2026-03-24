import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Mail, Paperclip, Pencil, Plus, RotateCcw, Send, Trash2, Users, X } from "lucide-react";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/api";
import OutlineButton from "@/components/ui/OutlineButton";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { useNotifications, useUser } from "@/store";
import { confirmWithNotification } from "@/utils/confirmWithNotification";

type Mailing = {
  id: number;
  subject: string;
  body: string;
  selection_event_id: number | null;
  selection_location_id: number | null;
  selection_league_id: number | null;
  selection_manual_emails: string[] | null;
  shared_attachments: { name: string; path: string }[];
  status: "draft" | "sending" | "sent" | "partially_sent" | "failed" | "canceled";
  send_started_at: string | null;
  send_finished_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type MailingRecipient = {
  id: number;
  mailing_id: number;
  team_id: number | null;
  team_name: string | null;
  league_name: string | null;
  email: string;
  delivery_status: "pending" | "sent" | "failed" | "skipped";
  attempts_count: number;
  provider_message_id: string | null;
  last_error_code: string | null;
  last_error_message: string | null;
  last_attempt_at: string | null;
  sent_at: string | null;
  created_at: string;
};

type MailingDetails = Mailing & {
  selection_type: "manual" | "league" | "location" | "event" | "mixed";
  recipients: MailingRecipient[];
  team_names: string[];
};

type MailingFormState = {
  subject: string;
  body: string;
  selection_event_id: string;
  selection_location_id: string;
  selection_league_id: string;
  selection_manual_emails: string;
};

type DraftAttachment = {
  name: string;
  file: string;
};

const statusLabels: Record<Mailing["status"], string> = {
  draft: "Черновик",
  sending: "Отправляется",
  sent: "Отправлена",
  partially_sent: "Частично отправлена",
  failed: "С ошибкой",
  canceled: "Отменена",
};

const selectionTypeLabels: Record<MailingDetails["selection_type"], string> = {
  manual: "Ручной список",
  league: "По лиге",
  location: "По площадке",
  event: "По мероприятию",
  mixed: "Смешанный",
};

const inputClassName = "w-full rounded-2xl border border-[var(--color-border)] bg-[rgba(255,255,255,0.92)] px-4 py-3 text-[var(--color-text-main)] outline-none transition placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary-light)]";
const templateFields = [
  { token: "{{name}}", label: "Имя", description: "Имя получателя или владельца команды" },
  { token: "{{full_name}}", label: "Полное имя", description: "ФИО владельца команды" },
  { token: "{{email}}", label: "Email", description: "Адрес текущего получателя" },
  { token: "{{team_name}}", label: "Команда", description: "Название команды" },
  { token: "{{league_name}}", label: "Лига", description: "Название лиги" },
  { token: "{{event_name}}", label: "Мероприятие", description: "Название мероприятия" },
  { token: "{{event_year}}", label: "Год", description: "Год проведения мероприятия" },
] as const;
const previewContext: Record<string, string> = {
  name: "Анна",
  full_name: "Иванова Анна Сергеевна",
  email: "anna@example.com",
  team_name: "Фудзи-1",
  league_name: "Старшая лига",
  event_name: "Турнир KPI",
  event_year: "2026",
};
const defaultMailingBody = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Письмо турнира</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f6fb;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background-color:#f3f6fb;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:620px;border-collapse:collapse;">
          <tr>
            <td align="center" style="padding-bottom:16px;">
              <div style="display:inline-block;padding:10px 16px;border:1px solid #dbe3ef;border-radius:999px;background-color:#ffffff;font-size:12px;line-height:16px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#475569;">
                Турнир математических игр
              </div>
            </td>
          </tr>
          <tr>
            <td style="border:1px solid #dbe3ef;border-radius:28px;background-color:#ffffff;padding:36px 28px;">
              <div style="font-size:30px;line-height:36px;font-weight:800;color:#0f172a;text-align:center;padding-bottom:12px;">
                Здравствуйте, {{name}}!
              </div>
              <div style="font-size:16px;line-height:24px;color:#475569;text-align:center;padding-bottom:24px;">
                Это письмо по команде <strong>{{team_name}}</strong> из лиги <strong>{{league_name}}</strong>.
              </div>
              <div style="border:1px solid #e2e8f0;border-radius:18px;background-color:#f8fafc;padding:16px 18px;font-size:15px;line-height:24px;color:#334155;">
                Вставьте сюда основной HTML-текст письма. Можно использовать автополя справа.
              </div>
              <div style="padding-top:20px;font-size:13px;line-height:21px;color:#64748b;text-align:center;">
                Мероприятие: <strong style="color:#334155;">{{event_name}}</strong>, {{event_year}} год
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  try {
    return new Date(value).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function createEmptyForm(): MailingFormState {
  return {
    subject: "",
    body: defaultMailingBody,
    selection_event_id: "",
    selection_location_id: "",
    selection_league_id: "",
    selection_manual_emails: "",
  };
}

function createFormFromMailing(mailing: MailingDetails): MailingFormState {
  return {
    subject: mailing.subject,
    body: mailing.body,
    selection_event_id: mailing.selection_event_id == null ? "" : String(mailing.selection_event_id),
    selection_location_id: mailing.selection_location_id == null ? "" : String(mailing.selection_location_id),
    selection_league_id: mailing.selection_league_id == null ? "" : String(mailing.selection_league_id),
    selection_manual_emails: (mailing.selection_manual_emails ?? []).join(", "),
  };
}

function parseManualEmails(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildMailingPayload(form: MailingFormState) {
  const payload: Record<string, unknown> = {
    subject: form.subject.trim(),
    body: form.body,
  };

  if (form.selection_event_id.trim()) {
    payload.selection_event_id = Number(form.selection_event_id.trim());
  }

  if (form.selection_location_id.trim()) {
    payload.selection_location_id = Number(form.selection_location_id.trim());
  }

  if (form.selection_league_id.trim()) {
    payload.selection_league_id = Number(form.selection_league_id.trim());
  }

  const manualEmails = parseManualEmails(form.selection_manual_emails);
  if (manualEmails.length > 0) {
    payload.selection_manual_emails = manualEmails;
  }

  return payload;
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("FILE_READ_FAILED"));
    reader.readAsDataURL(file);
  });
}

function renderPreviewTemplate(template: string) {
  return String(template ?? "").replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key) => previewContext[key] ?? "");
}

function renderMailingPreview(body: string) {
  return renderPreviewTemplate(body);
}

function getDeliveryStatusLabel(status: MailingRecipient["delivery_status"]) {
  switch (status) {
    case "sent":
      return "Доставлено";
    case "failed":
      return "Ошибка";
    case "skipped":
      return "Пропущено";
    default:
      return "Ожидает";
  }
}

function getDeliveryStatusClass(status: MailingRecipient["delivery_status"]) {
  switch (status) {
    case "sent":
      return "bg-[rgba(22,163,74,0.10)] text-[rgb(21,128,61)]";
    case "failed":
      return "bg-[rgba(220,38,38,0.10)] text-[rgb(185,28,28)]";
    case "skipped":
      return "bg-[rgba(245,158,11,0.12)] text-[rgb(180,83,9)]";
    default:
      return "bg-[rgba(15,23,42,0.06)] text-[var(--color-text-secondary)]";
  }
}

export function MailingsSection() {
  const notify = useNotifications((state) => state.addMessage);
  const { can } = useUser();
  const bodyTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [mailings, setMailings] = useState<Mailing[]>([]);
  const [detailsMap, setDetailsMap] = useState<Record<number, MailingDetails>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<MailingFormState>(createEmptyForm());
  const [draftAttachments, setDraftAttachments] = useState<DraftAttachment[]>([]);
  const [saving, setSaving] = useState(false);
  const [sendingMailingId, setSendingMailingId] = useState<number | null>(null);
  const [resendingRecipientIds, setResendingRecipientIds] = useState<number[]>([]);
  const [deliveryMessages, setDeliveryMessages] = useState<Record<number, string>>({});
  const [recipientsExpanded, setRecipientsExpanded] = useState<Record<number, boolean>>({});
  const previewHtml = useMemo(() => renderMailingPreview(form.body), [form.body]);

  async function loadMailingDetails(mailingId: number) {
    const detail = await apiGet<MailingDetails>(`mailings/${mailingId}`, { error: true });
    setDetailsMap((current) => ({ ...current, [mailingId]: detail }));
    setMailings((current) => current.map((item) => item.id === mailingId ? {
      ...item,
      ...detail,
    } : item));
    return detail;
  }

  async function loadMailings() {
    setLoading(true);
    try {
      const rows = await apiGet<Mailing[]>("mailings", { error: true });
      setMailings(rows);

      const detailEntries = await Promise.all(
        rows.map(async (row) => {
          try {
            const detail = await apiGet<MailingDetails>(`mailings/${row.id}`, { error: true });
            return [row.id, detail] as const;
          } catch {
            return null;
          }
        })
      );

      setDetailsMap(Object.fromEntries(detailEntries.filter(Boolean) as Array<readonly [number, MailingDetails]>));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMailings();
  }, []);

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
        await apiPost("mailings", payload, { success: "Рассылка создана", error: true });
      } else if (typeof editingId === "number") {
        await apiPatch(`mailings/${editingId}`, payload, { success: "Рассылка обновлена", error: true });
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

    await apiDelete(`mailings/${mailingId}`, mailingId);
    await loadMailings();
  }

  async function handleRefresh() {
    await loadMailings();
  }

  async function handleStartMailing(mailingId: number) {
    setSendingMailingId(mailingId);
    setDeliveryMessages((current) => ({ ...current, [mailingId]: "Отправляем письма и ждём ответ сервера..." }));

    try {
      const response = await apiPost<{ success: boolean; status: Mailing["status"]; sent: number; failed: number }>(
        `mailings/${mailingId}/start`,
        undefined,
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
      await apiPost(`mailings/recipients/${recipientId}/resend`, undefined, {
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
            </div>

            <div className="rounded-[24px] border border-[var(--color-border)] bg-[rgba(248,250,252,0.72)] p-5">
              <div className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Письмо</div>
              <div className="mt-4 grid gap-4">
                <label className="space-y-2">
                  <span className="text-sm text-[var(--color-text-secondary)]">Тема</span>
                  <input value={form.subject} onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))} className={inputClassName} />
                </label>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
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
                          className="h-[320px] w-full bg-white"
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
                    <div className="overflow-hidden rounded-[22px] border border-[var(--color-border)] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                      <iframe
                        title={`mailing-preview-${mailing.id}`}
                        sandbox=""
                        srcDoc={renderMailingPreview(mailing.body)}
                        className="h-[280px] w-full bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
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

                {deliveryMessage ? (
                  <div className={`mt-4 flex items-center gap-3 rounded-[22px] border px-4 py-3 text-sm ${
                    isSending
                      ? "border-[rgba(14,116,144,0.18)] bg-[rgba(14,116,144,0.08)] text-[var(--color-primary)]"
                      : "border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.92)] text-[var(--color-text-main)]"
                  }`}>
                    {isSending ? <RotateCcw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    <span>{deliveryMessage}</span>
                  </div>
                ) : null}

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
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
