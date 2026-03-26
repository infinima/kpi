import { query } from "../../db/pool.js";

interface KvQuestion {
    correct: number;
    incorrect: number;
}

interface KvQuarter {
    finished: number;
    questions: KvQuestion[];
}

interface TeamRow {
    id: number;
    name: string;
    penalty_kvartaly: number;
    answers_kvartaly: KvQuarter[];
}

export async function getKvartalyTable(league_id: number) {
    const teams: TeamRow[] = await query(
        `
            SELECT id, name, penalty_kvartaly, answers_kvartaly
            FROM teams
            WHERE league_id = ? AND deleted_at IS NULL AND status = 'ARRIVED'
            ORDER BY id
        `,
        [league_id]
    );

    const teamCount = teams.length;

    // ---------- 1. Подсчёт solvedCount по каждому вопросу ----------
    const solvedCount: number[][] = [
        [0,0,0,0],
        [0,0,0,0],
        [0,0,0,0],
        [0,0,0,0],
    ];

    for (const team of teams) {
        for (let qi = 0; qi < 4; qi++) {
            const quarter = team.answers_kvartaly[qi];
            for (let qi2 = 0; qi2 < 4; qi2++) {
                if (quarter.questions[qi2].correct > 0) {
                    solvedCount[qi][qi2]++;
                }
            }
        }
    }

    // ---------- 2. Подсчёт bonusReceivers ----------
    const bonusReceivers = [0, 0, 0, 0];

    for (let qi = 0; qi < 4; qi++) {
        for (const t of teams) {
            const q = t.answers_kvartaly[qi];
            const allSolved = q.questions.every(x => x.correct > 0);
            if (allSolved) bonusReceivers[qi]++;
        }
    }

    const bonuses = bonusReceivers.map(br => 5 + teamCount - br);

    // ---------- 3. Формируем ответ ----------
    const result: any[] = [];

    for (const t of teams) {
        let total = 0;
        const quarters = [];

        for (let qi = 0; qi < 4; qi++) {
            const quarter = t.answers_kvartaly[qi];

            let quarter_total = 0;

            const answers = quarter.questions.map((q, qi2) => {
                let score = 0;

                if (q.correct > 0) {
                    score = 5 + teamCount - solvedCount[qi][qi2] - q.incorrect;
                } else if (q.incorrect > 0) {
                    score = -q.incorrect;
                } else {
                    score = 0;
                }

                quarter_total += score;
                return {
                    correct: q.correct,
                    incorrect: q.incorrect,
                    score
                };
            });

            let bonus = 0;
            const allSolved = quarter.questions.every(x => x.correct > 0);

            if (allSolved) {
                bonus = bonuses[qi];
                quarter_total += bonus;
            }

            total += quarter_total;

            quarters.push({
                finished: quarter.finished === 1,
                bonus,
                total: quarter_total,      // ← ДОБАВЛЕНО
                answers
            });
        }

        total -= t.penalty_kvartaly ?? 0;

        result.push({
            name: t.name,
            id: t.id,
            penalty: t.penalty_kvartaly,
            total,
            quarters
        });
    }

    return result;
}
