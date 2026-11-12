import type { Mailing, MailingDetails, MailingRecipient } from '../model/mailing.js';
import type { MailingDetailsDto, MailingDto, MailingRecipientDto } from './contracts.js';

export function fromMailingDto(dto: MailingDto): Mailing {
    return {
        id: dto.id,
        subject: dto.subject,
        body: dto.body,
        selection_event_id: dto.selection_event_id,
        selection_location_id: dto.selection_location_id,
        selection_league_id: dto.selection_league_id,
        selection_manual_emails: dto.selection_manual_emails,
        shared_attachments: dto.shared_attachments,
        status: dto.status,
        send_started_at: dto.send_started_at,
        send_finished_at: dto.send_finished_at,
        created_at: dto.created_at,
        updated_at: dto.updated_at,
        deleted_at: dto.deleted_at,
    };
}

export function fromMailingRecipientDto(dto: MailingRecipientDto): MailingRecipient {
    return {
        id: dto.id,
        mailing_id: dto.mailing_id,
        team_id: dto.team_id,
        team_name: dto.team_name,
        league_name: dto.league_name,
        email: dto.email,
        delivery_status: dto.delivery_status,
        attempts_count: dto.attempts_count,
        provider_message_id: dto.provider_message_id,
        last_error_code: dto.last_error_code,
        last_error_message: dto.last_error_message,
        last_attempt_at: dto.last_attempt_at,
        sent_at: dto.sent_at,
        created_at: dto.created_at,
    };
}

export function fromMailingDetailsDto(dto: MailingDetailsDto): MailingDetails {
    return {
        id: dto.id,
        subject: dto.subject,
        body: dto.body,
        selection_event_id: dto.selection_event_id,
        selection_location_id: dto.selection_location_id,
        selection_league_id: dto.selection_league_id,
        selection_manual_emails: dto.selection_manual_emails,
        shared_attachments: dto.shared_attachments,
        status: dto.status,
        send_started_at: dto.send_started_at,
        send_finished_at: dto.send_finished_at,
        created_at: dto.created_at,
        updated_at: dto.updated_at,
        deleted_at: dto.deleted_at,
        selection_type: dto.selection_type,
        recipients: dto.recipients.map(fromMailingRecipientDto),
        team_names: dto.team_names,
    };
}
