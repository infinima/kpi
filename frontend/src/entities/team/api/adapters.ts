import type { TeamMembersValue, Team as TeamTableRowData } from "../model/team.js";
export type TeamResponseRow = {
    id: number;
    league_id: number;
    league_name?: string | null;
    owner_user_id: number | null;
    owner_full_name?: string | null;
    owner_email?: string | null;
    owner_phone_number?: string | null;
    name: string;
    members: unknown;
    documents?: string | null;
    texts?: string[] | string | null;
    appreciations: string[] | string;
    school: string;
    region: string;
    meals_count: number;
    maintainer_full_name: string | null;
    maintainer_activity: string | null;
    status: string;
    payment_link?: string | number | null;
    answers_kvartaly: unknown;
    answers_fudzi: unknown;
    diploma: string | null;
    special_nominations: string[] | string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
};

export function createEmptyMembers(): TeamMembersValue {
    return Array.from({ length: 4 }, () => "");
}

export function parseStringArray(value: string[] | string | null | undefined) {
    if (Array.isArray(value)) {
        return value;
    }

    if (!value) {
        return [];
    }

    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
    } catch {
        return String(value)
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }
}

export function parseMembers(value: unknown): TeamMembersValue {
    const fallback = createEmptyMembers();

    const normalizeArray = (raw: unknown[]) =>
        Array.from({ length: 4 }, (_, index) => typeof raw[index] === "string" ? raw[index] : "");

    const normalize = (raw: unknown) => {
        if (Array.isArray(raw)) {
            return normalizeArray(raw);
        }

        if (!raw || typeof raw !== "object") {
            return fallback;
        }

        const objectValue = raw as {
            participants?: Array<{ full_name?: unknown; }>;
        };

        return Array.from({ length: 4 }, (_, index) =>
            typeof objectValue.participants?.[index]?.full_name === "string"
                ? objectValue.participants[index].full_name
                : ""
        );
    };

    if (typeof value === "string") {
        try {
            return normalize(JSON.parse(value));
        } catch {
            return fallback;
        }
    }

    return normalize(value);
}

export function buildMembersRequestValue(row: TeamTableRowData): TeamMembersValue {
    return row.members.map((member) => member.trim());
}

export function mapTeamResponseRow(row: TeamResponseRow): TeamTableRowData {
    return {
        id: row.id,
        league_id: row.league_id,
        league_name: row.league_name ?? `Лига #${row.league_id}`,
        owner_user_id: row.owner_user_id,
        owner_full_name: row.owner_full_name || "",
        owner_email: row.owner_email ?? "",
        owner_phone_number: row.owner_phone_number ?? "",
        name: row.name ?? "",
        members: parseMembers(row.members),
        documents: row.documents ?? "",
        texts: parseStringArray(row.texts),
        appreciations: parseStringArray(row.appreciations),
        school: row.school ?? "",
        region: row.region ?? "",
        meals_count: row.meals_count ?? 0,
        maintainer_full_name: row.maintainer_full_name ?? "",
        maintainer_activity: row.maintainer_activity ?? "",
        status: row.status ?? "",
        payment_link: row.payment_link ?? null,
        diploma: row.diploma ?? "",
        special_nominations: parseStringArray(row.special_nominations),
        created_at: row.created_at ?? "",
        updated_at: row.updated_at ?? "",
        deleted_at: row.deleted_at,
    };
}
