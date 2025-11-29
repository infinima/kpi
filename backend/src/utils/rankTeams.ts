interface Team {
    id: number;
    total: number;
    // массив баллов по задачам – для кварталов это все четверти подряд
    scores: number[];
}

/**
 * Возвращает массив:
 * [
 *   {id: 5, place: 1},
 *   {id: 2, place: 2},
 *   {id: 3, place: 2.5}, ...
 * ]
 */
export function rankTeams(teams: Team[]) {
    // 1. сортируем
    const sorted = [...teams].sort((a, b) => {
        if (b.total !== a.total)
            return b.total - a.total;

        // tie-break по последней задаче
        for (let i = a.scores.length - 1; i >= 0; i--) {
            if (b.scores[i] !== a.scores[i])
                return b.scores[i] - a.scores[i];
        }
        return 0; // полностью равны
    });

    // 2. назначаем места
    const result: { id: number, place: number }[] = [];
    let i = 0;

    while (i < sorted.length) {
        let j = i + 1;

        // ищем до куда тянется группа равных
        while (j < sorted.length) {
            if (!equals(sorted[i], sorted[j])) break;
            j++;
        }

        // места с i по j-1
        const posStart = i + 1;
        const posEnd = j;

        const place = (posStart + posEnd) / 2; // среднее!

        for (let k = i; k < j; k++) {
            result.push({
                id: sorted[k].id,
                place
            });
        }

        i = j;
    }

    return result;
}

function equals(a: Team, b: Team) {
    if (a.total !== b.total) return false;
    for (let i = a.scores.length - 1; i >= 0; i--) {
        if (a.scores[i] !== b.scores[i]) return false;
    }
    return true;
}
