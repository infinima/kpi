export type MailingDraft = {
    subject: string;
    body: string;
    selection_event_id?: number;
    selection_location_id?: number;
    selection_league_id?: number;
    selection_manual_emails?: string[];
    shared_attachments?: { name: string; file: string; }[];
};
