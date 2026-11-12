import type { Mailing, MailingDetails, MailingRecipient } from '../../../entities/mailing/model/mailing.js';
import type { MailingDraft } from "../../../entities/mailing/model/mailingDraft.js";
export type { Mailing, MailingDetails, MailingRecipient } from '../../../entities/mailing/model/mailing.js';

export type MailingFormState = {
    subject: string;
    body: string;
    selection_event_id: string;
    selection_location_id: string;
    selection_league_id: string;
    selection_manual_emails: string;
};

export type DraftAttachment = {
    name: string;
    file: string;
};

export type LookupStatus = "idle" | "loading" | "found" | "missing";

export type SelectionLookup = {
    status: LookupStatus;
    label: string;
    subtitle?: string;
};

export type SelectionLookupMap = {
    event: SelectionLookup;
    location: SelectionLookup;
    league: SelectionLookup;
};

export type EventLookupResponse = {
    id: number;
    name: string;
    date?: string;
};

export type LocationLookupResponse = {
    id: number;
    name: string;
    address: string;
};

export type LeagueLookupResponse = {
    id: number;
    name: string;
    status?: string;
};

export const statusLabels: Record<Mailing["status"], string> = {
    draft: "Черновик",
    sending: "Отправляется",
    sent: "Отправлена",
    partially_sent: "Частично отправлена",
    failed: "С ошибкой",
    canceled: "Отменена",
};

export const selectionTypeLabels: Record<MailingDetails["selection_type"], string> = {
    manual: "Ручной список",
    league: "По лиге",
    location: "По площадке",
    event: "По мероприятию",
    mixed: "Смешанный",
};

export const inputClassName = "w-full rounded-2xl border border-[var(--color-border)] bg-[rgba(255,255,255,0.92)] px-4 py-3 text-[var(--color-text-main)] outline-none transition placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary-light)]";

export const templateFields = [
    { token: "{{name}}", label: "Имя", description: "Имя получателя или владельца команды" },
    { token: "{{full_name}}", label: "Полное имя", description: "ФИО владельца команды" },
    { token: "{{email}}", label: "Email", description: "Адрес текущего получателя" },
    { token: "{{team_name}}", label: "Команда", description: "Название команды" },
    { token: "{{league_name}}", label: "Лига", description: "Название лиги" },
    { token: "{{event_name}}", label: "Мероприятие", description: "Название мероприятия" },
    { token: "{{event_year}}", label: "Год", description: "Год проведения мероприятия" },
    { token: "{{user_uuid}}", label: "UUID", description: "UUID пользователя-владельца команды" },
    { token: "{{scanner_url_base64}}", label: "Base64 URL", description: "Base64url от https://kpiturnir.ru/scanner?data={{user_uuid}}" },
] as const;

export const previewContext: Record<string, string> = {
    name: "Анна",
    full_name: "Иванова Анна Сергеевна",
    email: "anna@example.com",
    team_name: "Фудзи-1",
    league_name: "Старшая лига",
    event_name: "Турнир KPI",
    event_year: "2026",
    user_uuid: "b3d5c5d4-6ad3-4d88-bc29-6fb3c6b4f5a4",
    scanner_url_base64: "aHR0cHM6Ly9rcGl0dXJuaXIucnUvc2Nhbm5lcj9kYXRhPWIyZDVjNWQ0LTZhZDMtNGQ4OC1iYzI5LTZmYjNjNmI0ZjVhNA",
};

export const defaultMailingBody = `<!doctype html>
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

export function formatDate(value: string | null) {
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

export function createEmptyForm(): MailingFormState {
    return {
        subject: "",
        body: defaultMailingBody,
        selection_event_id: "",
        selection_location_id: "",
        selection_league_id: "",
        selection_manual_emails: "",
    };
}

export function createFormFromMailing(mailing: MailingDetails): MailingFormState {
    return {
        subject: mailing.subject,
        body: mailing.body,
        selection_event_id: mailing.selection_event_id == null ? "" : String(mailing.selection_event_id),
        selection_location_id: mailing.selection_location_id == null ? "" : String(mailing.selection_location_id),
        selection_league_id: mailing.selection_league_id == null ? "" : String(mailing.selection_league_id),
        selection_manual_emails: (mailing.selection_manual_emails ?? []).join(", "),
    };
}

export function parseManualEmails(value: string) {
    return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

export function buildMailingPayload(form: MailingFormState): MailingDraft {
    const payload: MailingDraft = {
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

export { fileToBase64 } from "../../../shared/lib/files.js";

export function renderPreviewTemplate(template: string) {
    return String(template ?? "").replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key) => previewContext[key] ?? "");
}

export function renderMailingPreview(body: string) {
    return renderPreviewTemplate(body);
}

export function getDeliveryStatusLabel(status: MailingRecipient["delivery_status"]) {
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

export function getDeliveryStatusClass(status: MailingRecipient["delivery_status"]) {
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

export function createEmptyLookup(entityLabel: string): SelectionLookup {
    return {
        status: "idle",
        label: `${entityLabel} не выбран`,
    };
}
