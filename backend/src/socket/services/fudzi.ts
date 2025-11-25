import { query } from "../../utils/database.js";

interface FudziQuestion {
    score: number;
}

interface FudziData {
    card: boolean;
    questions: FudziQuestion[];
}

interface TeamRow {
    id: number;
    name: string;
    answers_fudzi: FudziData | null;
}

export async function getFudziTable(league_id: number) {
    // const teams: TeamRow[] = await query(
    //     `
    //         SELECT id, name, answers_fudzi
    //         FROM teams
    //         WHERE league_id = ?
    //         ORDER BY id
    //     `,
    //     [league_id]
    // );
    //
    // // --- нормализация ---
    // const normalized = teams.map(t => {
    //     const ans: FudziData =
    //         t.answers_fudzi && typeof t.answers_fudzi === "object"
    //             ? t.answers_fudzi
    //             : { card: false, questions: [] };
    //
    //     // гарантируем 16 вопросов
    //     const qs = Array.isArray(ans.questions) ? ans.questions : [];
    //     while (qs.length < 16) qs.push({ score: 0 });
    //
    //     return {
    //         id: t.id,
    //         name: t.name,
    //         questions: qs
    //     };
    // });
    //
    // const teamCount = normalized.length;
    //
    // // ===== 1. Считаем wrong_count для каждой задачи =====
    // const wrongCount: number[] = Array(16).fill(0);
    //
    // for (let i = 0; i < 16; i++) {
    //     let wrong = 0;
    //     for (const t of normalized) {
    //         const s = t.questions[i].score;
    //         if (s === 0) wrong++;
    //     }
    //     wrongCount[i] = wrong;
    // }
    //
    // // ===== 2. Формируем вывод =====
    // const result: any[] = [];
    //
    // for (const t of normalized) {
    //     const row = [];
    //
    //     // team name
    //     row.push({
    //         color: "team_name",
    //         text: t.name,
    //         id: t.id
    //     });
    //
    //     // participation flag
    //     const participated = t.questions.some(q => q.score > 0) ? 1 : 0;
    //
    //     row.push({
    //         color: participated ? "green" : "red",
    //         text: participated
    //     });
    //
    //     // total
    //     let total = 0;
    //
    //     // 16 задач
    //     for (let i = 0; i < 16; i++) {
    //         const rawScore = t.questions[i].score;
    //
    //         let color = "empty";
    //         let text = 0;
    //
    //         if (rawScore > 0) {
    //             // получает онлайн-балл
    //             text = 5 + wrongCount[i];
    //             color = "green";
    //             total += text;
    //         } else {
    //             // неправильный ответ
    //             color = participated ? "red" : "empty";
    //             text = 0;
    //         }
    //
    //         row.push({ color, text });
    //     }
    //
    //     // total
    //     row.splice(3, 0, {
    //         color: "total",
    //         text: total
    //     });
    //
    //     result.push(row);
    // }

    return { "error": "not implemented"};
}
