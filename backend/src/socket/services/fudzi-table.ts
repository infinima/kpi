import { query } from "../../db/pool.js";

type FudziStatus = "correct" | "incorrect" | "not_submitted";

interface FudziQuestion {
    status: FudziStatus;
}

interface FudziRaw {
    has_card: boolean;
    questions: FudziQuestion[];
}

interface TeamRow {
    id: number;
    name: string;
    answers_fudzi: FudziRaw | null;
    penalty_fudzi: number;
}

export async function getFudziTable(league_id: number) {
    const teams: TeamRow[] = await query(
        `
            SELECT id, name, answers_fudzi, penalty_fudzi
            FROM teams
            WHERE league_id = ? AND deleted_at IS NULL
            ORDER BY id
        `,
        [league_id]
    );

    const normalized = teams.map(t => {
        const raw = t.answers_fudzi;

        let has_card = false;
        let questions: FudziQuestion[] = [];

        if (raw && typeof raw === "object") {
            has_card = Boolean(raw.has_card);
            questions = Array.isArray(raw.questions) ? raw.questions : [];
        }

        // Guarantee 16 tasks
        while (questions.length < 16) {
            questions.push({ status: "not_submitted" });
        }

        return {
            id: t.id,
            name: t.name,
            has_card,
            penalty: t.penalty_fudzi ?? 0,
            questions
        };
    });

    const teamCount = normalized.length;

    // Count incorrect answers per task
    const wrongCount: number[] = Array(16).fill(0);

    for (let qi = 0; qi < 16; qi++) {
        let wrong = 0;
        for (const t of normalized) {
            if (t.questions[qi].status === "incorrect") wrong++;
        }
        wrongCount[qi] = wrong;
    }

    // Build result format
    const result = [];

    for (const t of normalized) {
        const answers = [];
        let total = 0;

        for (let qi = 0; qi < 16; qi++) {
            const q = t.questions[qi];
            const status = q.status;

            let score = 0;

            if (status === "correct") {
                score = 5 + wrongCount[qi];
                total += score;
            }

            answers.push({ score, status });
        }

        total -= t.penalty;

        result.push({
            name: t.name,
            id: t.id,
            has_card: t.has_card,
            penalty: t.penalty,
            total,
            answers
        });
    }

    return result;
}
