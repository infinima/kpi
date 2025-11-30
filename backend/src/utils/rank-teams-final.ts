interface TeamPlaces {
    id: number;
    kvartaly: number;
    fudzi: number;
    final: number;
}

export function rankFinal(teams: TeamPlaces[]) {
    const sorted = [...teams].sort((a,b)=>{
        const as = a.kvartaly + a.fudzi + a.final;
        const bs = b.kvartaly + b.fudzi + b.final;

        if (as !== bs) return as - bs;
        if (a.fudzi !== b.fudzi) return a.fudzi - b.fudzi;
        if (a.kvartaly !== b.kvartaly) return a.kvartaly - b.kvartaly;
        return 0;
    });

    const result: {id:number, place:number}[] = [];
    let i = 0;

    while (i < sorted.length) {
        let j = i + 1;
        while (j < sorted.length && equals(sorted[i], sorted[j])) j++;

        const posStart = i + 1;
        const posEnd = j;
        const place = (posStart + posEnd) / 2;

        for (let k=i;k<j;k++)
            result.push({id: sorted[k].id, place});

        i = j;
    }
    return result;
}

function equals(a:TeamPlaces,b:TeamPlaces){
    return a.kvartaly===b.kvartaly &&
        a.fudzi===b.fudzi &&
        a.final===b.final;
}
