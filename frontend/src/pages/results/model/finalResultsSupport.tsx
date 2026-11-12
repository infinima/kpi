import { ArrowDown, ArrowUp } from "lucide-react";
export type { FinalTeam } from '../../../entities/results/model/finalTeam.js';
export const diplomaMap: Record<string, string> = {
    FIRST_DEGREE: "Диплом I степени",
    SECOND_DEGREE: "Диплом II степени",
    THIRD_DEGREE: "Диплом III степени",
    PARTICIPANT: "Участник",
};

export const diplomaOptions = Object.keys(diplomaMap);

export type EntitySummary = {
    id: number;
    name: string;
};

export type EventsOutletContext = {
    eventInfo: EntitySummary | null;
    locationInfo: EntitySummary | null;
    leagueInfo: EntitySummary | null;
};

export type SortKey = "place_final" | "place_fudzi" | "place_kvartaly" | "place_sum" | "name";

export type SortDirection = "asc" | "desc";

export function sortIcon(active: boolean, direction: SortDirection) {
    if (!active) return null;
    return direction === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
}

export function headerButtonClass(active: boolean) {
    return `flex w-full items-center justify-center gap-1 text-center text-xs font-semibold uppercase tracking-[0.08em] transition ${active ? "text-white" : "text-white/92 hover:text-white"
        }`;
}

export { compareValues } from "@/shared/lib/table";
