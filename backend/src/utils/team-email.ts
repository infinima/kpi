import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { query } from "../db/pool.js";
import { sendEmail } from "./send-email.js";

type TeamEmailContext = {
    teamId: number;
    teamName: string;
    ownerEmail: string | null;
    eventName: string;
    locationName: string;
    leagueName: string;
    paymentUrl: string | null;
};

function resolveEmailTemplate(templateFile: string): string {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const candidates = [
        path.resolve(__dirname, "../static/emails", templateFile),
        path.resolve(__dirname, "../static", templateFile),
        path.resolve(process.cwd(), "src/static/emails", templateFile),
        path.resolve(process.cwd(), "src/static", templateFile),
        path.resolve(process.cwd(), "dist/static/emails", templateFile),
        path.resolve(process.cwd(), "dist/static", templateFile),
    ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    throw new Error(`Email template not found. Tried: ${candidates.join(", ")}`);
}

function renderTeamTemplate(templateFile: string, ctx: TeamEmailContext): string {
    const templatePath = resolveEmailTemplate(templateFile);
    const template = fs.readFileSync(templatePath, "utf-8");
    const supportEmail = process.env.SUPPORT_EMAIL || "kpi@phtl.ru";
    const year = new Date().getFullYear().toString();

    return template
        .split("{{TEAM_NAME}}").join(ctx.teamName)
        .split("{{EVENT_NAME}}").join(ctx.eventName)
        .split("{{LOCATION_NAME}}").join(ctx.locationName)
        .split("{{LEAGUE_NAME}}").join(ctx.leagueName)
        .split("{{PAYMENT_URL}}").join(ctx.paymentUrl ?? "")
        .split("{{SUPPORT_EMAIL}}").join(supportEmail)
        .split("{{YEAR}}").join(year);
}

export async function loadTeamEmailContext(teamId: number): Promise<TeamEmailContext | null> {
    const [row] = await query(
        `SELECT t.id,
                t.name AS team_name,
                t.payment_link,
                u.email AS owner_email,
                l.name AS league_name,
                lo.name AS location_name,
                e.name AS event_name
         FROM teams t
                  JOIN leagues l ON l.id = t.league_id
                  JOIN locations lo ON lo.id = l.location_id
                  JOIN events e ON e.id = lo.event_id
                  LEFT JOIN users u ON u.id = t.owner_user_id
         WHERE t.id = ?
         LIMIT 1`,
        [teamId]
    );

    if (!row) return null;

    return {
        teamId: Number(row.id),
        teamName: String(row.team_name),
        ownerEmail: row.owner_email ? String(row.owner_email) : null,
        eventName: String(row.event_name),
        locationName: String(row.location_name),
        leagueName: String(row.league_name),
        paymentUrl: row.payment_link ? String(row.payment_link) : null,
    };
}

export async function sendTeamAcceptedEmail(args: {
    context: TeamEmailContext;
    movedFromReserve: boolean;
}): Promise<void> {
    const { context, movedFromReserve } = args;
    if (!context.ownerEmail || !context.paymentUrl) return;

    const template = movedFromReserve
        ? "team-moved-from-reserve.html"
        : "team-application-approved.html";
    const subject = movedFromReserve
        ? "Команда переведена из резерва"
        : "Ваша заявка одобрена";

    const html = renderTeamTemplate(template, context);
    await sendEmail(context.ownerEmail, subject, html);
}

export async function sendTeamPaymentConfirmedEmail(context: TeamEmailContext): Promise<void> {
    if (!context.ownerEmail) return;

    const html = renderTeamTemplate("team-payment-confirmed.html", context);
    await sendEmail(context.ownerEmail, "Оплата подтверждена", html);
}

export async function sendTeamMovedToReserveEmail(context: TeamEmailContext): Promise<void> {
    if (!context.ownerEmail) return;

    const html = renderTeamTemplate("team-moved-to-reserve.html", context);
    await sendEmail(context.ownerEmail, "Команда переведена в резерв", html);
}

export async function sendTeamRemovedFromTournamentEmail(context: TeamEmailContext): Promise<void> {
    if (!context.ownerEmail) return;

    const html = renderTeamTemplate("team-removed-from-tournament.html", context);
    await sendEmail(context.ownerEmail, "Команда снята с турнира", html);
}
