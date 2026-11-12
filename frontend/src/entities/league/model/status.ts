import type { LeagueStatus } from "../../../shared/api/schema.js";
export const leagueStatusLabels: Record<LeagueStatus, string> = {
    NOT_STARTED: "Не началась", REGISTRATION_IN_PROGRESS: "Идёт регистрация", REGISTRATION_ENDED: "Регистрация завершена",
    TEAMS_FIXED: "Команды зафиксированы", ARRIVAL_IN_PROGRESS: "Идёт прибытие", ARRIVAL_ENDED: "Прибытие завершено",
    KVARTALY_GAME: "Кварталы", LUNCH: "Обед", FUDZI_GAME: "Фудзи", GAMES_ENDED: "Игры завершены", ENDED: "Завершено",
};
export const leagueStatuses = Object.keys(leagueStatusLabels) as LeagueStatus[];
export type { LeagueStatus };
