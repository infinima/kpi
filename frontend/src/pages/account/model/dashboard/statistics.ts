import type { OverviewLeague } from "../../../../entities/event/model/overview.js";
export function summarizeLeagues(leagues: readonly OverviewLeague[]) {
    return leagues.reduce((total, league) => ({
        leagues: total.leagues + 1, teams: total.teams + league.teamsCount, reserve: total.reserve + league.reserveCount,
        registrationOpen: total.registrationOpen + Number(league.status === "REGISTRATION_IN_PROGRESS"),
        availablePlaces: total.availablePlaces + (league.maxTeamsCount > 0 ? Math.max(0, league.maxTeamsCount - league.teamsCount) : 0),
        unlimitedLeagues: total.unlimitedLeagues + Number(league.maxTeamsCount <= 0),
    }), { leagues: 0, teams: 0, reserve: 0, registrationOpen: 0, availablePlaces: 0, unlimitedLeagues: 0 });
}
export function leagueOccupancy(league: OverviewLeague): number | null {
    return league.maxTeamsCount > 0 ? Math.min(100, Math.max(0, league.teamsCount / league.maxTeamsCount * 100)) : null;
}
