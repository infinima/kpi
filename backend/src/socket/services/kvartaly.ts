import { query } from "../../utils/database.js";

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
            WHERE league_id = ?
            ORDER BY id
        `,
        [league_id]
    );

    const teamCount = teams.length;

    // ============================
    // 1. Считаем solvedCount для КАЖДОГО из 4х*4 вопросов
    // solvedCount[quarterIndex][questionIndex]
    // ============================
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

    // ============================
    // 2. Считаем bonusReceivers для каждого квартала
    // ============================
    const bonusReceivers = [0, 0, 0, 0];

    for (let qi = 0; qi < 4; qi++) {
        for (const t of teams) {
            const q = t.answers_kvartaly[qi];
            const allSolved = q.questions.every(
                x => x.correct > 0
            );
            if (allSolved) bonusReceivers[qi]++;
        }
    }

    // bonus = 5 + N - bonusReceivers
    const bonuses = bonusReceivers.map(br => 5 + teamCount - br);

    // ============================
    // 3. Собираем таблицу
    // ============================
    const result: any[] = [];

    for (const t of teams) {
        let total = 0;

        const quarters = [];

        for (let qi = 0; qi < 4; qi++) {
            const quarter = t.answers_kvartaly[qi];

            const answers = quarter.questions.map((q, qi2) => {
                const correct = q.correct;
                const incorrect = q.incorrect;

                let score = 0;

                if (correct > 0) {
                    score = 5 + teamCount - solvedCount[qi][qi2] - incorrect;
                } else if (incorrect > 0) {
                    score = -incorrect;
                } else {
                    score = 0; // не сдан
                }

                total += score;

                return {
                    correct,
                    incorrect,
                    score
                };
            });

            // бонус
            let bonus = 0;
            const allSolved = quarter.questions.every(x => x.correct > 0);

            if (allSolved) {
                bonus = bonuses[qi];
                total += bonus;
            }

            quarters.push({
                finished: quarter.finished === 1,
                bonus,
                answers
            });
        }

        total += t.penalty_kvartaly ?? 0;

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
