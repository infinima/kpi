export type FinalTeamDto = {
    id: number;
    name: string;
    school: string | null;
    region: string | null;
    place_kvartaly: number | null;
    place_fudzi: number | null;
    place_sum: number | null;
    place_final: number | null;
    diploma: string | null;
    special_nominations: string[];
};
