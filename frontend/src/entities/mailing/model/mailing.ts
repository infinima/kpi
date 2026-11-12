export type Mailing = {
    id: number;
    subject: string;
    body: string;
    selection_event_id: number | null;
    selection_location_id: number | null;
    selection_league_id: number | null;
    selection_manual_emails: string[] | null;
    shared_attachments: { name: string; path: string; }[];
    status: "draft" | "sending" | "sent" | "partially_sent" | "failed" | "canceled";
    send_started_at: string | null;
    send_finished_at: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
};

export type MailingRecipient = {
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

export type MailingDetails = Mailing & {
    selection_type: "manual" | "league" | "location" | "event" | "mixed";
    recipients: MailingRecipient[];
    team_names: string[];
};
