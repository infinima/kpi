import express from "express";
import { query } from "../../db/pool.js";
import { validate } from "../middlewares/validate.js";
import { checkNotDeleted } from "../middlewares/check-not-deleted.js";
import { checkPermission } from "../middlewares/check-permission.js";
import fs from "fs/promises";
import { sendEmail, type Attachment } from "../../utils/send-email.js";

import {
    IdParam,
    RecipientIdParam,
    CreateMailingInput,
    UpdateMailingInput,
    GetAllMailingsQuery,
} from "../schemas/mailings.js";

import { resolveFilePath } from "../../utils/resolve-file-path.js";
import { saveFile } from "../../utils/save-file.js";

export const mailingsRouter = express.Router();

type TeamRow = {
    id: number;
    name: string;
    members: any;
    appreciations: any;
    diploma: "FIRST_DEGREE" | "SECOND_DEGREE" | "THIRD_DEGREE" | "PARTICIPANT" | null;
    special_nominations: any[];
    league_name: string | null;
    event_name: string | null;
    event_year: number | null;
    owner_email: string | null;
    coach_full_name: string | null;
};

type MailingTemplateContext = {
    name: string;
    full_name: string;
    email: string;
    team_name: string;
    league_name: string;
    event_name: string;
    event_year: string;
    user_uuid: string;
    scanner_url_base64: string;
};

function parseJson<T>(value: unknown, fallback: T): T {
    if (value == null) return fallback;
    if (typeof value === "string") {
        try {
            return JSON.parse(value) as T;
        } catch {
            return fallback;
        }
    }
    return value as T;
}

function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

function normalizeManualRecipients(recipients: string[]): string[] {
    const set = new Set<string>();

    for (const recipient of recipients) {
        const email = normalizeEmail(recipient);
        if (!email) continue;
        set.add(email);
    }

    return [...set.values()];
}

function validateSingleAutoSelection(data: {
    selection_event_id?: number | null;
    selection_location_id?: number | null;
    selection_league_id?: number | null;
}) {
    const selected = [
        data.selection_event_id,
        data.selection_location_id,
        data.selection_league_id,
    ].filter(v => v !== undefined && v !== null);

    if (selected.length > 1) {
        throw new Error("ONLY_ONE_SELECTION_SCOPE_ALLOWED");
    }
}

function renderMailingTemplate(template: string, context: MailingTemplateContext) {
    return String(template ?? "").replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key) => {
        const value = (context as Record<string, string>)[key];
        return value ?? "";
    });
}

function resolveDisplayName(args: { firstName?: string | null; fullName?: string | null; email?: string | null }) {
    const firstName = args.firstName?.trim();
    if (firstName) return firstName;

    const fullName = args.fullName?.trim();
    if (fullName) return fullName;

    const email = args.email?.trim();
    if (!email) return "";
    return email.split("@")[0] ?? "";
}

function base64UrlEncode(value: string) {
    return Buffer.from(value, "utf8")
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

async function loadMailingRecipientContext(teamId: number, email: string, userId: number): Promise<MailingTemplateContext | null> {
    const [row] = await query(
        `
            SELECT
                t.name AS team_name,
                l.name AS league_name,
                e.name AS event_name,
                YEAR(e.date) AS event_year,
                u.first_name AS owner_first_name,
                u.uuid AS owner_uuid,
                CONCAT_WS(' ', u.last_name, u.first_name, u.patronymic) AS owner_full_name
            FROM teams t
                JOIN leagues l ON l.id = t.league_id
                JOIN locations lo ON lo.id = l.location_id
                JOIN events e ON e.id = lo.event_id
                LEFT JOIN users u ON u.id = t.owner_user_id
            WHERE t.id = ?
            LIMIT 1
        `,
        [teamId],
        userId
    );

    if (!row) return null;

    const fullName = row.owner_full_name ? String(row.owner_full_name) : "";
    const userUuid = row.owner_uuid ? String(row.owner_uuid) : "";
    const scannerUrl = userUuid
        ? `https://kpiturnir.ru/scanner?data=${userUuid}`
        : "";
    const scannerUrlBase64 = scannerUrl ? base64UrlEncode(scannerUrl) : "";
    const name = resolveDisplayName({
        firstName: row.owner_first_name ? String(row.owner_first_name) : "",
        fullName,
        email,
    });

    return {
        name,
        full_name: fullName,
        email,
        team_name: row.team_name ? String(row.team_name) : "",
        league_name: row.league_name ? String(row.league_name) : "",
        event_name: row.event_name ? String(row.event_name) : "",
        event_year: row.event_year != null ? String(row.event_year) : "",
        user_uuid: userUuid,
        scanner_url_base64: scannerUrlBase64,
    };
}

async function prepareMailingPayload(
    payload: {
        subject?: string;
        body?: string;
        selection_event_id?: number | null;
        selection_location_id?: number | null;
        selection_league_id?: number | null;
        selection_manual_emails?: string[];
        shared_attachments?: Array<{ name: string; file: string }>
    },
    userId: number
) {
    validateSingleAutoSelection(payload);

    const manualRecipients = normalizeManualRecipients(payload.selection_manual_emails ?? []);

    return {
        ...payload,
        selection_manual_emails: manualRecipients,
    };
}

function detectSelectionType(row: any): "manual" | "league" | "location" | "event" | "mixed" {
    const manual = parseJson<string[]>(row.selection_manual_emails, []);

    const count =
        Number(!!row.selection_event_id) +
        Number(!!row.selection_location_id) +
        Number(!!row.selection_league_id) +
        Number(manual.length > 0);

    if (count > 1) return "mixed";
    if (row.selection_league_id) return "league";
    if (row.selection_location_id) return "location";
    if (row.selection_event_id) return "event";
    return "manual";
}

async function loadTeamsForMailingSelection(mailing: any, userId: number): Promise<TeamRow[]> {
    const conditions: string[] = [
        "t.deleted_at IS NULL",
        "l.deleted_at IS NULL",
        "lo.deleted_at IS NULL",
        "e.deleted_at IS NULL",
        "t.status = 'PAID'"
    ];
    const params: any[] = [];

    if (mailing.selection_league_id) {
        conditions.push("l.id = ?");
        params.push(mailing.selection_league_id);
    } else if (mailing.selection_location_id) {
        conditions.push("lo.id = ?");
        params.push(mailing.selection_location_id);
    } else if (mailing.selection_event_id) {
        conditions.push("e.id = ?");
        params.push(mailing.selection_event_id);
    } else {
        return [];
    }

    const rows = await query(
        `
            SELECT
                t.id,
                t.name,
                t.members,
                t.appreciations,
                t.diploma,
                t.special_nominations,
                l.name AS league_name,
                e.name AS event_name,
                YEAR(e.date) AS event_year,
                u.email AS owner_email,
                CONCAT_WS(' ', u.last_name, u.first_name, u.patronymic) AS coach_full_name
            FROM teams t
                JOIN leagues l ON l.id = t.league_id
                JOIN locations lo ON lo.id = l.location_id
                JOIN events e ON e.id = lo.event_id
                LEFT JOIN users u ON u.id = t.owner_user_id
            WHERE ${conditions.join(" AND ")}
        `,
        params,
        userId
    );

    return rows as TeamRow[];
}

async function rebuildMailingRecipients(mailingId: number, userId: number) {
    const [mailing] = await query(
        `
            SELECT
                id, selection_event_id, selection_location_id, selection_league_id,
                selection_manual_emails
            FROM mailings
            WHERE id = ?
              AND deleted_at IS NULL
        `,
        [mailingId],
        userId
    );

    if (!mailing) {
        throw new Error("MAILING_NOT_FOUND");
    }

    const teams = await loadTeamsForMailingSelection(mailing, userId);
    const manualRecipients =
        parseJson<string[]>(mailing.selection_manual_emails, []);

    await query(
        "DELETE FROM mailing_recipients WHERE mailing_id = ?",
        [mailingId],
        userId
    );

    for (const team of teams) {
        if (!team.owner_email) continue;
        await query(
            `
                INSERT IGNORE INTO mailing_recipients
                    (mailing_id, team_id, email, delivery_status, attempts_count)
                VALUES (?, ?, ?, 'pending', 0)
            `,
            [mailingId, team.id, normalizeEmail(team.owner_email)],
            userId
        );
    }

    for (const recipient of manualRecipients) {
        await query(
            `
                INSERT IGNORE INTO mailing_recipients
                    (mailing_id, team_id, email, delivery_status, attempts_count)
                VALUES (?, ?, ?, 'pending', 0)
            `,
            [mailingId, null, normalizeEmail(recipient)],
            userId
        );
    }
}

async function buildMailingResponse(mailingId: number, userId: number) {
    const [mailing] = await query(
        `
            SELECT
                id, subject, body,
                selection_event_id, selection_location_id, selection_league_id,
                selection_manual_emails, shared_attachments,
                status, send_started_at, send_finished_at,
                created_at, updated_at, deleted_at
            FROM mailings
            WHERE id = ?
        `,
        [mailingId],
        userId
    );

    if (!mailing) return null;

    const recipients = await query(
        `
            SELECT
                mr.id,
                mr.mailing_id,
                mr.team_id,
                t.name AS team_name,
                l.name AS league_name,
                mr.email,
                mr.delivery_status,
                mr.attempts_count,
                mr.provider_message_id,
                mr.last_error_code,
                mr.last_error_message,
                mr.last_attempt_at,
                mr.sent_at,
                mr.created_at
            FROM mailing_recipients mr
            LEFT JOIN teams t ON t.id = mr.team_id
            LEFT JOIN leagues l ON l.id = t.league_id
            WHERE mr.mailing_id = ?
            ORDER BY mr.id ASC
        `,
        [mailingId],
        userId
    );

    const teamNames = [...new Set((recipients as any[]).map(r => r.team_name).filter(Boolean))];

    return {
        ...mailing,
        selection_manual_emails: parseJson(mailing.selection_manual_emails, []),
        shared_attachments: parseJson(mailing.shared_attachments, []),
        selection_type: detectSelectionType(mailing),
        recipients,
        team_names: teamNames,
    };
}

async function saveSharedAttachments(files: Array<{ name: string; file: string }>) {
    const result: Array<{ name: string; path: string }> = [];

    for (const item of files) {
        const match = item.file.match(/^data:(.+);base64,(.+)$/);
        if (!match) {
            throw new Error("INVALID_BASE64");
        }

        const mime = match[1];
        const base64 = match[2];

        let buffer: Buffer;
        try {
            buffer = Buffer.from(base64, "base64");
        } catch {
            throw new Error("INVALID_BASE64_DATA");
        }

        let ext = "";
        const nameExtMatch = item.name.match(/\.([a-zA-Z0-9]+)$/);
        if (nameExtMatch) {
            ext = nameExtMatch[1].toLowerCase();
        } else if (mime.includes("/")) {
            ext = mime.split("/")[1].toLowerCase();
        }

        if (!ext) {
            ext = "bin";
        }

        const path = await saveFile(buffer, ext);
        result.push({ name: item.name, path });
    }

    return result;
}

// здесь только заглушка. Подставь свой mail provider.
async function sendMailToRecipient(args: {
    mailing: any;
    recipient: any;
    userId: number;
}) {
    const { mailing, recipient, userId } = args;

    const attachments: Attachment[] = [];

    const sharedAttachments = parseJson<Array<{ name: string; path: string }>>(
        mailing.shared_attachments,
        []
    );

    for (const file of sharedAttachments) {
        const buffer = await fs.readFile(resolveFilePath(file.path));

        attachments.push({
            filename: file.name,
            buffer,
        });
    }

    let subject = mailing.subject;
    let body = mailing.body;

    if (recipient.team_id) {
        const context = await loadMailingRecipientContext(
            Number(recipient.team_id),
            String(recipient.email ?? ""),
            userId
        );

        if (context) {
            subject = renderMailingTemplate(subject, context);
            body = renderMailingTemplate(body, context);
        }
    }

    const providerMessageId = await sendEmail(
        recipient.email,
        subject,
        body,
        attachments
    );

    return {
        providerMessageId
    };
}

// GET /api/mailings
mailingsRouter.get(
    "/",
    validate(GetAllMailingsQuery, "query"),
    checkPermission("mailings", "get"),
    async (req, res) => {
        const { include_deleted } = (req as any).validated.query;

        const rows = await query(
            `
                SELECT
                    id, subject, body,
                    selection_event_id, selection_location_id, selection_league_id,
                    selection_manual_emails, shared_attachments,
                    status, send_started_at, send_finished_at,
                    created_at, updated_at, deleted_at
                FROM mailings
                WHERE ${include_deleted ? "1=1" : "deleted_at IS NULL"}
                ORDER BY id DESC
            `,
            [],
            (req as any).user_id
        );

        res.json(
            (rows as any[]).map(row => ({
                ...row,
                selection_manual_emails: parseJson(row.selection_manual_emails, []),
                shared_attachments: parseJson(row.shared_attachments, []),
            }))
        );
    }
);

// GET /api/mailings/:id
mailingsRouter.get(
    "/:id",
    validate(IdParam, "params"),
    checkNotDeleted("mailing"),
    checkPermission("mailings", "get"),
    async (req, res) => {
        const { id } = (req as any).validated.params;

        const response = await buildMailingResponse(id, (req as any).user_id);
        if (!response) {
            return res.status(404).json({
                error: {
                    code: "MAILING_NOT_FOUND",
                    message: "Mailing does not exist"
                }
            });
        }

        res.json(response);
    }
);

// POST /api/mailings
mailingsRouter.post(
    "/",
    validate(CreateMailingInput, "body"),
    checkPermission("mailings", "create"),
    async (req, res) => {
        const data = (req as any).validated.body;

        try {
            const prepared = await prepareMailingPayload(data, (req as any).user_id);
            const savedAttachments = await saveSharedAttachments(prepared.shared_attachments ?? []);

            const result = await query(
                `
                    INSERT INTO mailings
                        (subject, body,
                         selection_event_id, selection_location_id, selection_league_id,
                         selection_manual_emails,
                         shared_attachments)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    prepared.subject,
                    prepared.body,
                    prepared.selection_event_id ?? null,
                    prepared.selection_location_id ?? null,
                    prepared.selection_league_id ?? null,
                    JSON.stringify(prepared.selection_manual_emails ?? []),
                    JSON.stringify(savedAttachments)
                ],
                (req as any).user_id
            );

            res.json({ id: result.insertId });
        } catch (e: any) {
            console.error(e);
            res.status(400).json({
                error: {
                    code: "CREATE_MAILING_FAILED",
                    message: e.message,
                },
            });
        }
    }
);

// PATCH /api/mailings/:id
mailingsRouter.patch(
    "/:id",
    validate(IdParam, "params"),
    validate(UpdateMailingInput, "body"),
    checkNotDeleted("mailing"),
    checkPermission("mailings", "update"),
    async (req, res) => {
        const { id } = (req as any).validated.params;
        const body = (req as any).validated.body;

        const [mailing] = await query(
            `
                SELECT status, selection_manual_emails, shared_attachments
                FROM mailings
                WHERE id = ?
            `,
            [id],
            (req as any).user_id
        );

        if (!mailing) {
            return res.status(404).json({
                error: {
                    code: "MAILING_NOT_FOUND",
                    message: "Mailing does not exist"
                }
            });
        }

        if (mailing.status !== "draft") {
            return res.status(400).json({
                error: {
                    code: "MAILING_NOT_DRAFT",
                    message: "Only draft mailing can be updated"
                }
            });
        }

        try {
            const prepared = await prepareMailingPayload(
                {
                    subject: body.subject ?? mailing.subject,
                    body: body.body ?? mailing.body,
                    selection_event_id:
                        body.selection_event_id !== undefined
                            ? body.selection_event_id
                            : mailing.selection_event_id,
                    selection_location_id:
                        body.selection_location_id !== undefined
                            ? body.selection_location_id
                            : mailing.selection_location_id,
                    selection_league_id:
                        body.selection_league_id !== undefined
                            ? body.selection_league_id
                            : mailing.selection_league_id,
                    selection_manual_emails:
                        body.selection_manual_emails !== undefined
                            ? body.selection_manual_emails
                            : parseJson<string[]>(mailing.selection_manual_emails, []),
                    shared_attachments:
                        body.shared_attachments !== undefined
                            ? body.shared_attachments
                            : []
                },
                (req as any).user_id
            );

            const savedAttachments = body.shared_attachments !== undefined
                ? await saveSharedAttachments(prepared.shared_attachments ?? [])
                : parseJson<Array<{ name: string; path: string }>>(mailing.shared_attachments, []);

            const fields = {
                subject: prepared.subject,
                body: prepared.body,
                selection_event_id: prepared.selection_event_id ?? null,
                selection_location_id: prepared.selection_location_id ?? null,
                selection_league_id: prepared.selection_league_id ?? null,
                selection_manual_emails: JSON.stringify(prepared.selection_manual_emails ?? []),
                shared_attachments: JSON.stringify(savedAttachments)
            };

            await query(
                "UPDATE mailings SET ? WHERE id = ?",
                [fields, id],
                (req as any).user_id
            );

            res.json({ success: true });
        } catch (e: any) {
            console.error(e);
            res.status(400).json({
                error: {
                    code: "UPDATE_MAILING_FAILED",
                    message: e.message,
                },
            });
        }
    }
);

// DELETE /api/mailings/:id
mailingsRouter.delete(
    "/:id",
    validate(IdParam, "params"),
    checkNotDeleted("mailing"),
    checkPermission("mailings", "delete"),
    async (req, res) => {
        const { id } = (req as any).validated.params;

        await query(
            "UPDATE mailings SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
            [id], (req as any).user_id
        );

        res.json({ success: true });
    }
);

// POST /api/mailings/:id/start
mailingsRouter.post(
    "/:id/start",
    validate(IdParam, "params"),
    checkNotDeleted("mailing"),
    checkPermission("mailings", "update"),
    async (req, res) => {
        const { id } = (req as any).validated.params;

        const [mailing] = await query(
            "SELECT * FROM mailings WHERE id = ? AND deleted_at IS NULL",
            [id], (req as any).user_id
        );

        if (!mailing) {
            return res.status(404).json({
                error: { code: "MAILING_NOT_FOUND", message: "Mailing does not exist" }
            });
        }

        if (mailing.status !== "draft") {
            return res.status(400).json({
                error: { code: "MAILING_NOT_DRAFT", message: "Only draft mailing can be started" }
            });
        }

        await rebuildMailingRecipients(id, (req as any).user_id);

        await query(
            "UPDATE mailings SET status = 'sending', send_started_at = CURRENT_TIMESTAMP, send_finished_at = NULL WHERE id = ?",
            [id], (req as any).user_id
        );

        const recipients = await query(
            `
                SELECT id, mailing_id, team_id, email, delivery_status, attempts_count
                FROM mailing_recipients
                WHERE mailing_id = ?
            `,
            [id], (req as any).user_id
        );

        let sent = 0;
        let failed = 0;

        for (const recipient of recipients as any[]) {
            try {
                const result = await sendMailToRecipient({
                    mailing,
                    recipient,
                    userId: (req as any).user_id
                });

                await query(
                    `
                        UPDATE mailing_recipients
                           SET delivery_status = 'sent',
                               provider_message_id = ?,
                               last_error_code = NULL,
                               last_error_message = NULL,
                               last_attempt_at = CURRENT_TIMESTAMP,
                               sent_at = CURRENT_TIMESTAMP
                         WHERE id = ?
                    `,
                    [result.providerMessageId, recipient.id],
                    (req as any).user_id
                );

                sent++;
            } catch (e: any) {
                console.error(e);
                await query(
                    `
                        UPDATE mailing_recipients
                           SET delivery_status = 'failed',
                               attempts_count = attempts_count + 1,
                               last_error_code = 'SEND_FAILED',
                               last_error_message = ?,
                               last_attempt_at = CURRENT_TIMESTAMP
                         WHERE id = ?
                    `,
                    [String(e), recipient.id],
                    (req as any).user_id
                );

                failed++;
            }
        }

        const finalStatus = failed > 0
            ? (sent > 0 ? "partially_sent" : "failed")
            : "sent";

        await query(
            `
                UPDATE mailings
                   SET status = ?,
                       send_finished_at = CURRENT_TIMESTAMP
                 WHERE id = ?
            `,
            [finalStatus, id],
            (req as any).user_id
        );

        res.json({ success: true, status: finalStatus, sent, failed });
    }
);

// POST /api/mailing/recipients/:id/resend
mailingsRouter.post(
    "/recipients/:id/resend",
    validate(RecipientIdParam, "params"),
    checkPermission("mailings", "update"),
    async (req, res) => {
        const { id } = (req as any).validated.params;

        const [recipient] = await query(
            `
                SELECT
                    mr.id,
                    mr.mailing_id,
                    mr.team_id,
                    mr.email,
                    mr.delivery_status,
                    mr.attempts_count,
                    m.subject,
                    m.body,
                    m.shared_attachments,
                    m.status AS mailing_status,
                    m.deleted_at AS mailing_deleted_at
                FROM mailing_recipients mr
                JOIN mailings m ON m.id = mr.mailing_id
                WHERE mr.id = ?
            `,
            [id],
            (req as any).user_id
        );

        if (!recipient) {
            return res.status(404).json({
                error: { code: "MAILING_RECIPIENT_NOT_FOUND", message: "Recipient not found" }
            });
        }

        if (recipient.mailing_deleted_at !== null) {
            return res.status(400).json({
                error: { code: "MAILING_DELETED", message: "Mailing is deleted" }
            });
        }

        const mailing = {
            subject: recipient.subject,
            body: recipient.body,
            shared_attachments: recipient.shared_attachments
        };

        try {
            const result = await sendMailToRecipient({
                mailing,
                recipient,
                userId: (req as any).user_id
            });

            await query(
                `
                    UPDATE mailing_recipients
                       SET delivery_status = 'sent',
                           provider_message_id = ?,
                           last_error_code = NULL,
                           last_error_message = NULL,
                           last_attempt_at = CURRENT_TIMESTAMP,
                           sent_at = CURRENT_TIMESTAMP
                     WHERE id = ?
                `,
                [result.providerMessageId, recipient.id],
                (req as any).user_id
            );

            res.json({ success: true });
        } catch (e: any) {
            console.error(e);
            await query(
                `
                    UPDATE mailing_recipients
                       SET delivery_status = 'failed',
                           attempts_count = attempts_count + 1,
                           last_error_code = 'RESEND_FAILED',
                           last_error_message = ?,
                           last_attempt_at = CURRENT_TIMESTAMP
                     WHERE id = ?
                `,
                [String(e), recipient.id],
                (req as any).user_id
            );

            res.status(400).json({
                error: { code: "RESEND_FAILED", message: "Failed to resend" }
            });
        }
    }
);
