export type StageType = "kvartaly" | "fudzi";
export type FudziStatus = "correct" | "incorrect" | "not_submitted";
export type FudziAnswer = { score: number; status: FudziStatus; };
export type FudziTeam = { id: number; name: string; has_card: boolean; penalty: number; total: number; answers: FudziAnswer[]; };
export type KvartalyAnswer = { correct: number; incorrect: number; score: number; };
export type KvartalyQuarter = { finished: boolean; bonus: number; total: number; answers: KvartalyAnswer[]; };
export type KvartalyTeam = { id: number; name: string; penalty: number; total: number; quarters: KvartalyQuarter[]; };
export type TableTeams = FudziTeam[] | KvartalyTeam[];
export type TableCommands = {
    get_table: undefined;
    fudzi_set_answer: { team_id: number; question_num: number; status: FudziStatus; };
    fudzi_set_card: { team_id: number; has_card: boolean; };
    fudzi_set_penalty: { team_id: number; penalty: number; };
    kvartaly_add_answer: { team_id: number; question_num: number; delta_correct: number; delta_incorrect: number; };
    kvartaly_finish: { team_id: number; kvartal: number; finished: boolean; };
    kvartaly_set_penalty: { team_id: number; penalty: number; };
};

function record(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object";
}
function numbers(row: Record<string, unknown>, keys: string[]) {
    return keys.every((key) => typeof row[key] === "number" && Number.isFinite(row[key]));
}

export function decodeTable(value: unknown, type: StageType): TableTeams {
    if (!Array.isArray(value)) throw new Error("Неверный формат таблицы");
    return (value as unknown[]).map((row) => {
        if (!record(row) || !numbers(row, ["id", "penalty", "total"]) || typeof row.name !== "string") throw new Error("Неверный формат команды");
        if (type === "fudzi") {
            if (!Array.isArray(row.answers) || row.answers.some((answer: unknown) => !record(answer) || !["correct", "incorrect", "not_submitted"].includes(String(answer.status)) || !numbers(answer, ["score"]))) throw new Error("Неверный формат ответов Фудзи");
        } else {
            if (!Array.isArray(row.quarters) || row.quarters.some((quarter: unknown) => !record(quarter) || !numbers(quarter, ["bonus", "total"]) || !Array.isArray(quarter.answers) || quarter.answers.some((answer: unknown) => !record(answer) || !numbers(answer, ["correct", "incorrect", "score"])))) throw new Error("Неверный формат кварталов");
        }
        return row;
    }) as TableTeams;
}
