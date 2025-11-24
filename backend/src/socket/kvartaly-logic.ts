export interface Team {
    id: number;
    name: string;
    answers_kvartaly: any;
    answers_fudzi: any;
    deleted_at: string | null;
}

export function computeKvartalyTable(
    teams: Team[],
    game_name: "kvartaly" | "fudzi",
    showPlaces: boolean
) {
    const isFudzi = game_name === "fudzi";

    const totalTeams = teams.length;
    const prepared: any[] = [];

    teams.forEach((t, idx) => {
        const kvartaly = t.answers_kvartaly;
        const fudzi = t.answers_fudzi;

        const correct = new Array(16).fill(0);
        const incorrect = new Array(16).fill(0);
        const finished = new Array(4).fill(false);
        const scoresFudzi = new Array(16).fill(0);

        if (!isFudzi) {
            for (let q = 0; q < 4; q++) {
                finished[q] = kvartaly[q].finished > 0;
                for (let i = 0; i < 4; i++) {
                    const idx2 = q * 4 + i;
                    correct[idx2] = kvartaly[q].questions[i].correct;
                    incorrect[idx2] = kvartaly[q].questions[i].incorrect;
                }
            }
        } else {
            for (let i = 0; i < 16; i++) {
                scoresFudzi[i] = fudzi.questions[i].score;
            }
        }

        prepared.push({
            id: t.id,
            name: t.name,
            correct,
            incorrect,
            finished,
            fudziScores: scoresFudzi,
            card: fudzi.card,
            total: 0,
            allScores: [],
            originalIndex: idx
        });
    });

    const solvedCount = new Array(16).fill(0);
    const solvedAll = new Array(4).fill(0);

    if (!isFudzi) {
        for (let i = 0; i < 16; i++) {
            solvedCount[i] = prepared.filter(t => t.correct[i] > 0).length;
        }
        for (let q = 0; q < 4; q++) {
            solvedAll[q] = prepared.filter(t =>
                t.correct.slice(q * 4, q * 4 + 4).every((v: number) => v > 0)
            ).length;
        }
    }

    prepared.forEach(team => {
        let total = 0;
        const allScores: number[] = [];

        if (isFudzi) {
            for (let i = 0; i < 16; i++) {
                let score = 0;
                if (team.fudziScores[i] === 1) score = 5;
                if (team.fudziScores[i] === -1) score = 0;
                allScores[i] = score;
                total += score;
            }
        } else {
            for (let q = 0; q < 4; q++) {
                let qSum = 0;
                for (let i = 0; i < 4; i++) {
                    const idx = q * 4 + i;
                    let s = team.correct[idx] > 0
                        ? (5 + totalTeams - solvedCount[idx]) - team.incorrect[idx]
                        : -team.incorrect[idx];
                    qSum += s;
                    allScores[idx] = s;
                }
                if (team.correct.slice(q * 4, q * 4 + 4).every((v: number) => v > 0)) {
                    qSum += 5 + totalTeams - solvedAll[q];
                }
                total += qSum;
            }
        }

        team.total = total;
        team.allScores = allScores;
    });

    const sorted = [...prepared].sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total;
        for (let i = 15; i >= 0; i--) {
            if (b.allScores[i] !== a.allScores[i])
                return b.allScores[i] - a.allScores[i];
        }
        return 0;
    });

    const places: number[] = [];
    for (let i = 0; i < sorted.length;) {
        let j = i + 1;
        while (
            j < sorted.length &&
            sorted[j].total === sorted[i].total &&
            JSON.stringify(sorted[j].allScores) === JSON.stringify(sorted[i].allScores)
            ) j++;

        const avg = (i + 1 + j) / 2;
        for (let k = i; k < j; k++)
            places[sorted[k].originalIndex] = avg;

        i = j;
    }

    return prepared.map((t, idx) => ({
        id: t.id,
        name: t.name,
        place: showPlaces ? places[idx] : null,
        total: t.total,
        finished: t.finished,
        scores: t.allScores,
        card: t.card
    }));
}
