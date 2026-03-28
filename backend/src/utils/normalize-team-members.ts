type LegacyMember = {
    full_name?: unknown;
};

type LegacyMembersPayload = {
    coach?: LegacyMember | null;
    participants?: LegacyMember[] | null;
};

function toNonEmptyString(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    const str = String(value).trim();
    return str ? str : null;
}

function parseJsonMaybe(value: unknown): unknown {
    if (typeof value !== "string") return value;
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
}

export function normalizeTeamMembers(rawMembers: unknown): { participants: string[]; coach: string | null } {
    const value = parseJsonMaybe(rawMembers);

    if (Array.isArray(value)) {
        const participants = value
            .map((item) => toNonEmptyString(item))
            .filter((item): item is string => Boolean(item));
        return { participants, coach: null };
    }

    if (value && typeof value === "object") {
        const payload = value as LegacyMembersPayload;
        const coach = toNonEmptyString(payload.coach?.full_name);
        const participants = Array.isArray(payload.participants)
            ? payload.participants
                .map((item) => toNonEmptyString(item?.full_name))
                .filter((item): item is string => Boolean(item))
            : [];

        return { participants, coach };
    }

    return { participants: [], coach: null };
}
