import type { FinalTeam } from '../model/finalTeam.js';
import type { FinalTeamDto } from './contracts.js';

export function fromFinalTeamDto(dto: FinalTeamDto): FinalTeam {
    return {
        id: dto.id,
        name: dto.name,
        school: dto.school,
        region: dto.region,
        place_kvartaly: dto.place_kvartaly,
        place_fudzi: dto.place_fudzi,
        place_sum: dto.place_sum,
        place_final: dto.place_final,
        diploma: dto.diploma,
        special_nominations: dto.special_nominations,
    };
}
