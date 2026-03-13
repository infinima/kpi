import { query } from "../db/pool.js";
import { requestPaymentInfo } from "./payment.js";
import { loadTeamEmailContext, sendTeamPaymentConfirmedEmail } from "./team-email.js";

const CHECK_INTERVAL_MS = 30 * 60 * 1000;

async function checkAcceptedTeams(): Promise<void> {
    const teams = await query(
        `SELECT id, name, school, payment_link
         FROM teams
         WHERE status = 'ACCEPTED'
           AND deleted_at IS NULL`
    );

    for (const team of teams) {
        try {
            const info = await requestPaymentInfo({
                teamId: Number(team.id),
                teamName: String(team.name),
                teamSchool: String(team.school),
            });

            if (info.paid) {
                await query(
                    "UPDATE teams SET status = 'PAID', payment_link = ? WHERE id = ?",
                    [info.payUrl ?? team.payment_link ?? null, team.id]
                );
                try {
                    const ctx = await loadTeamEmailContext(Number(team.id));
                    if (ctx) {
                        await sendTeamPaymentConfirmedEmail(ctx);
                    }
                } catch (e) {
                    console.error(`[payment-checker] email failed for team ${team.id}:`, e);
                }
                continue;
            }

            if (info.payUrl && info.payUrl !== team.payment_link) {
                await query(
                    "UPDATE teams SET payment_link = ? WHERE id = ?",
                    [info.payUrl, team.id]
                );
            }
        } catch (e) {
            console.error(`[payment-checker] team ${team.id}:`, e);
        }
    }
}

export function startPaymentChecker(): void {
    checkAcceptedTeams().catch((e) => console.error("[payment-checker] initial run failed", e));
    setInterval(() => {
        checkAcceptedTeams().catch((e) => console.error("[payment-checker] run failed", e));
    }, CHECK_INTERVAL_MS);
}
