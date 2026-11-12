import type { FudziSnapshot, KvartalySnapshot } from "../model/snapshot.js";
function object(value: unknown): Record<string, unknown> {
    if (typeof value === "string") { try { return object(JSON.parse(value)); } catch { return {}; } }
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function numeric(value: unknown): number { const result = Number(value); return Number.isFinite(result) ? result : 0; }
function place(value: unknown): number | null { return value === null || value === undefined ? null : numeric(value); }
export function fudziSnapshot(value: unknown): FudziSnapshot {
    const team = object(value), answers = object(team.answers_fudzi);
    const questions = Array.isArray(answers.questions) ? answers.questions : Array.from({ length: 16 }, () => ({}));
    return {
        name: String(team.name ?? ""), penalty: numeric(team.penalty_fudzi), place: place(team.place_fudzi), questions: questions.map((question: unknown) => {
            const status = object(question).status;
            return { status: status === "correct" || status === "incorrect" ? status : "not_submitted" };
        })
    };
}
export function kvartalySnapshot(value: unknown): KvartalySnapshot {
    const team = object(value);
    return {
        name: String(team.name ?? ""), penalty: numeric(team.penalty_kvartaly), place: place(team.place_kvartaly), quarters: (Array.isArray(team.answers_kvartaly) ? team.answers_kvartaly : []).map((value: unknown) => {
            const quarter = object(value);
            return {
                finished: Boolean(quarter.finished), bonus: numeric(quarter.bonus), questions: (Array.isArray(quarter.questions) ? quarter.questions : []).map((value: unknown) => {
                    const answer = object(value);
                    return { correct: numeric(answer.correct), incorrect: numeric(answer.incorrect) };
                })
            };
        })
    };
}
