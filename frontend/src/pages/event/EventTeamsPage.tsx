import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/api";
import { TeamTable } from "@/components/ui/table/TeamTable";
import type { TeamMembersValue, TeamTableRowData } from "@/components/ui/table/TeamTableRow";

type TeamResponseRow = {
    id: number;
    league_id: number;
    owner_user_id: number | null;
    name: string;
    members: unknown;
    appreciations: string[] | string;
    school: string;
    region: string;
    meals_count: number;
    maintainer_full_name: string | null;
    maintainer_activity: string | null;
    status: string;
    answers_kvartaly: unknown;
    answers_fudzi: unknown;
    diploma: string | null;
    special_nominations: string[] | string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
};

type UserSummary = {
    id: number;
    first_name: string;
    last_name: string;
    patronymic: string | null;
};

type LeagueSummary = {
    id: number;
    name: string;
};

function createEmptyMembers(): TeamMembersValue {
    return {
        coach: {
            email: "",
            full_name: "",
        },
        participants: Array.from({ length: 4 }, () => ({
            school: "",
            full_name: "",
        })),
    };
}

function parseStringArray(value: string[] | string | null | undefined) {
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

function buildOwnerName(user: UserSummary | null, fallbackId: number | null) {
    if (!user) {
        return fallbackId ? `Пользователь #${fallbackId}` : "";
    }

    return [user.last_name, user.first_name, user.patronymic].filter(Boolean).join(" ");
}

function parseMembers(value: unknown): TeamMembersValue {
    const fallback = createEmptyMembers();

    const normalize = (raw: unknown) => {
        if (!raw || typeof raw !== "object") {
            return fallback;
        }

        const objectValue = raw as {
            coach?: { email?: unknown; full_name?: unknown };
            participants?: Array<{ school?: unknown; full_name?: unknown }>;
        };

        return {
            coach: {
                email: typeof objectValue.coach?.email === "string" ? objectValue.coach.email : "",
                full_name: typeof objectValue.coach?.full_name === "string" ? objectValue.coach.full_name : "",
            },
            participants: Array.from({ length: 4 }, (_, index) => ({
                school: typeof objectValue.participants?.[index]?.school === "string" ? objectValue.participants[index].school : "",
                full_name: typeof objectValue.participants?.[index]?.full_name === "string" ? objectValue.participants[index].full_name : "",
            })),
        };
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

function buildMembersRequestValue(row: TeamTableRowData): TeamMembersValue {
    return {
        coach: {
            email: row.members.coach.email.trim(),
            full_name: row.members.coach.full_name.trim(),
        },
        participants: row.members.participants.map((participant) => ({
            school: participant.school.trim() || row.school.trim(),
            full_name: participant.full_name.trim(),
        })),
    };
}

export function EventTeamsPage() {
    const { eventId, locationId, leagueId } = useParams();
    const [rows, setRows] = useState<TeamResponseRow[]>([]);
    const [loading, setLoading] = useState(false);

    const tableRows = useMemo<TeamTableRowData[]>(() => {
        return rows.map((row) => ({
            id: row.id,
            league_id: row.league_id,
            league_name: (row as TeamResponseRow & { league_name?: string }).league_name ?? `Лига #${row.league_id}`,
            owner_user_id: row.owner_user_id,
            owner_name: (row as TeamResponseRow & { owner_name?: string }).owner_name ?? buildOwnerName(null, row.owner_user_id),
            name: row.name ?? "",
            members: parseMembers(row.members),
            appreciations: parseStringArray(row.appreciations),
            school: row.school ?? "",
            region: row.region ?? "",
            meals_count: row.meals_count ?? 0,
            maintainer_full_name: row.maintainer_full_name ?? "",
            maintainer_activity: row.maintainer_activity ?? "",
            status: row.status ?? "",
            diploma: row.diploma ?? "",
            special_nominations: parseStringArray(row.special_nominations),
            created_at: row.created_at ?? "",
            updated_at: row.updated_at ?? "",
            deleted_at: row.deleted_at,
        }));
    }, [rows]);

    useEffect(() => {
        let ignore = false;

        async function loadTeams() {
            const path = leagueId
                ? `teams/league/${leagueId}`
                : locationId
                    ? `teams/location/${locationId}`
                    : eventId
                        ? `teams/event/${eventId}`
                        : null;

            if (!path) {
                setRows([]);
                return;
            }

            try {
                setLoading(true);
                const data = await apiGet<TeamResponseRow[]>(path, { error: true });

                const uniqueLeagueIds = [...new Set(data.map((row) => row.league_id).filter(Boolean))];
                const uniqueOwnerIds = [...new Set(data.map((row) => row.owner_user_id).filter((value): value is number => Boolean(value)))];

                const [leagueEntries, ownerEntries] = await Promise.all([
                    Promise.all(uniqueLeagueIds.map(async (id) => {
                        try {
                            const league = await apiGet<LeagueSummary>(`leagues/${id}`);
                            return [id, league.name] as const;
                        } catch {
                            return [id, `Лига #${id}`] as const;
                        }
                    })),
                    Promise.all(uniqueOwnerIds.map(async (id) => {
                        try {
                            const owner = await apiGet<UserSummary>(`users/${id}`);
                            return [id, buildOwnerName(owner, id)] as const;
                        } catch {
                            return [id, `Пользователь #${id}`] as const;
                        }
                    })),
                ]);

                const leagueMap = new Map(leagueEntries);
                const ownerMap = new Map(ownerEntries);

                if (!ignore) {
                    setRows(
                        data.map((row) => ({
                            ...row,
                            league_name: leagueMap.get(row.league_id) ?? `Лига #${row.league_id}`,
                            owner_name: row.owner_user_id ? ownerMap.get(row.owner_user_id) ?? `Пользователь #${row.owner_user_id}` : "",
                        })) as TeamResponseRow[]
                    );
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        }

        void loadTeams();
        return () => {
            ignore = true;
        };
    }, [eventId, locationId, leagueId]);

    async function handleUpdate(row: TeamTableRowData) {
        await apiPatch(`teams/${row.id}`, {
            name: row.name,
            members: buildMembersRequestValue(row),
            appreciations: row.appreciations,
            school: row.school,
            region: row.region,
            meals_count: row.meals_count,
            maintainer_full_name: row.maintainer_full_name || null,
            maintainer_activity: row.maintainer_activity || null,
            status: row.status || undefined,
            diploma: row.diploma || null,
            special_nominations: row.special_nominations,
        }, {
            success: "Команда обновлена",
            error: true,
        });

        setRows((prev) => prev.map((item) => item.id === row.id ? {
            ...item,
            name: row.name,
            members: buildMembersRequestValue(row),
            appreciations: row.appreciations,
            school: row.school,
            region: row.region,
            meals_count: row.meals_count,
            maintainer_full_name: row.maintainer_full_name,
            maintainer_activity: row.maintainer_activity,
            status: row.status,
            diploma: row.diploma || null,
            special_nominations: row.special_nominations,
        } : item));
    }

    async function handleDelete(row: TeamTableRowData) {
        await apiDelete(`teams/${row.id}`, row.id);
        setRows((prev) => prev.filter((item) => item.id !== row.id));
    }

    async function handleCreate(row: TeamTableRowData) {
        const created = await apiPost<{ id: number }>("teams", {
            league_id: row.league_id,
            name: row.name,
            members: buildMembersRequestValue(row),
            appreciations: row.appreciations,
            school: row.school,
            region: row.region,
            meals_count: row.meals_count,
            maintainer_full_name: row.maintainer_full_name || null,
            maintainer_activity: row.maintainer_activity || null,
        }, {
            success: "Команда создана",
            error: true,
        });

        const data = await apiGet<TeamResponseRow>(`teams/${created.id}`, { error: true });
        let leagueName = `Лига #${data.league_id}`;
        let ownerName = buildOwnerName(null, data.owner_user_id);

        try {
            const league = await apiGet<LeagueSummary>(`leagues/${data.league_id}`);
            leagueName = league.name;
        } catch {
        }

        if (data.owner_user_id) {
            try {
                const owner = await apiGet<UserSummary>(`users/${data.owner_user_id}`);
                ownerName = buildOwnerName(owner, data.owner_user_id);
            } catch {
            }
        }

        setRows((prev) => [{
            ...data,
            league_name: leagueName,
            owner_name: ownerName,
        } as TeamResponseRow, ...prev]);
    }

    return (
        <section className="space-y-5">
            {loading ? <div className="text-sm text-[var(--color-text-secondary)]">Загружаем команды...</div> : null}

            <TeamTable
                data={tableRows}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onCreate={handleCreate}
                defaultLeagueId={leagueId ? Number(leagueId) : null}
                defaultLeagueName={leagueId ? tableRows[0]?.league_name ?? "" : ""}
            />
        </section>
    );
}
