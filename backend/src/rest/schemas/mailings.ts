import { z } from "../../utils/zod-openapi-init.js";
import { registry } from "../../utils/openapi.js";

export const MailingStatusEnum = z.enum([
    "draft",
    "sending",
    "sent",
    "partially_sent",
    "failed",
    "canceled"
]);

export const MailingRecipientStatusEnum = z.enum([
    "pending",
    "sent",
    "failed",
    "skipped"
]);

export const ManualRecipientSchema = z.string().trim().min(1).email();

export const SharedAttachmentSchema = z.object({
    name: z.string().trim().min(1),
    path: z.string().trim().min(1),
});

export const SharedAttachmentInputSchema = z.object({
    name: z.string().trim().min(1),
    file: z.string().trim().min(1),
});

export const MailingSchema = z.object({
    id: z.coerce.number().int().positive(),
    subject: z.string().trim().min(1),
    body: z.string().min(1),
    selection_event_id: z.coerce.number().int().positive().nullable(),
    selection_location_id: z.coerce.number().int().positive().nullable(),
    selection_league_id: z.coerce.number().int().positive().nullable(),
    selection_manual_emails: z.array(ManualRecipientSchema).nullable(),
    shared_attachments: z.array(SharedAttachmentSchema),
    status: MailingStatusEnum,
    send_started_at: z.string().nullable(),
    send_finished_at: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
    deleted_at: z.string().nullable(),
});

registry.register("Mailing", MailingSchema);

export const MailingRecipientSchema = z.object({
    id: z.coerce.number().int().positive(),
    mailing_id: z.coerce.number().int().positive(),
    team_id: z.coerce.number().int().positive().nullable(),
    team_name: z.string().min(1).nullable(),
    league_name: z.string().nullable(),
    email: z.string().trim().email(),
    delivery_status: MailingRecipientStatusEnum,
    attempts_count: z.coerce.number().int().min(0),
    provider_message_id: z.string().nullable(),
    last_error_code: z.string().nullable(),
    last_error_message: z.string().nullable(),
    last_attempt_at: z.string().nullable(),
    sent_at: z.string().nullable(),
    created_at: z.string(),
});

registry.register("MailingRecipient", MailingRecipientSchema);

export const MailingWithRecipientsSchema = MailingSchema.extend({
    selection_type: z.enum(["manual", "league", "location", "event", "mixed"]),
    recipients: z.array(MailingRecipientSchema),
    team_names: z.array(z.string()),
});

export const IdParam = z.object({
    id: z.coerce.number().int().positive(),
});

export const RecipientIdParam = z.object({
    id: z.coerce.number().int().positive(),
});

export const CreateMailingInput = z.object({
    subject: z.string().trim().min(1),
    body: z.string().min(1),

    selection_event_id: z.coerce.number().int().positive().optional(),
    selection_location_id: z.coerce.number().int().positive().optional(),
    selection_league_id: z.coerce.number().int().positive().optional(),
    selection_manual_emails: z.array(ManualRecipientSchema).optional().default([]),

    shared_attachments: z.array(SharedAttachmentInputSchema).default([]),
});

export const UpdateMailingInput = z.object({
    subject: z.string().trim().min(1).optional(),
    body: z.string().min(1).optional(),

    selection_event_id: z.coerce.number().int().positive().nullable().optional(),
    selection_location_id: z.coerce.number().int().positive().nullable().optional(),
    selection_league_id: z.coerce.number().int().positive().nullable().optional(),
    selection_manual_emails: z.array(ManualRecipientSchema).optional(),

    shared_attachments: z.array(SharedAttachmentInputSchema).optional(),
});

export const GetAllMailingsQuery = z.object({
    include_deleted: z.preprocess(v => v === "true", z.boolean()).optional().default(false),
});

// docs
registry.registerPath({
    method: "get",
    path: "/api/mailings",
    summary: "Получить все рассылки",
    tags: ["Mailings"],
    security: [{ BearerAuth: [] }],
    request: {
        query: GetAllMailingsQuery
    },
    responses: {
        200: {
            description: "OK",
            content: { "application/json": { schema: z.array(MailingSchema) } }
        }
    }
});

registry.registerPath({
    method: "get",
    path: "/api/mailings/{id}",
    summary: "Получить одну рассылку с реципиентами",
    tags: ["Mailings"],
    security: [{ BearerAuth: [] }],
    request: {
        params: IdParam
    },
    responses: {
        200: {
            description: "OK",
            content: { "application/json": { schema: MailingWithRecipientsSchema } }
        }
    }
});

registry.registerPath({
    method: "post",
    path: "/api/mailings",
    summary: "Создать рассылку",
    tags: ["Mailings"],
    security: [{ BearerAuth: [] }],
    request: {
        body: {
            content: { "application/json": { schema: CreateMailingInput } }
        }
    },
    responses: {
        200: {
            description: "OK",
            content: { "application/json": { schema: MailingSchema.pick({ id: true }) } }
        }
    }
});

registry.registerPath({
    method: "patch",
    path: "/api/mailings/{id}",
    summary: "Изменить рассылку, только draft",
    tags: ["Mailings"],
    security: [{ BearerAuth: [] }],
    request: {
        params: IdParam,
        body: {
            content: { "application/json": { schema: UpdateMailingInput } }
        }
    },
    responses: {
        200: { description: "OK" }
    }
});

registry.registerPath({
    method: "delete",
    path: "/api/mailings/{id}",
    summary: "Soft delete рассылки",
    tags: ["Mailings"],
    security: [{ BearerAuth: [] }],
    request: {
        params: IdParam
    },
    responses: {
        200: { description: "OK" }
    }
});

registry.registerPath({
    method: "post",
    path: "/api/mailings/{id}/start",
    summary: "Начать рассылку",
    tags: ["Mailings"],
    security: [{ BearerAuth: [] }],
    request: {
        params: IdParam
    },
    responses: {
        200: { description: "OK" }
    }
});

registry.registerPath({
    method: "post",
    path: "/api/mailing/recipients/{id}/resend",
    summary: "Повторить отправку письма получателю",
    tags: ["Mailings"],
    security: [{ BearerAuth: [] }],
    request: {
        params: RecipientIdParam
    },
    responses: {
        200: { description: "OK" }
    }
});
