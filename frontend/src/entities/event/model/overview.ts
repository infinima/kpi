import type { EventStatus, LeagueStatus } from "../../../shared/api/schema.js";
export type OverviewLeague = { id: number; name: string; status: LeagueStatus; maxTeamsCount: number; teamsCount: number; reserveCount: number };
export type OverviewLocation = { id: number; name: string; address: string; leagues: OverviewLeague[] };
export type EventOverview = { id: number; name: string; date: string; status: EventStatus; locations: OverviewLocation[] };
