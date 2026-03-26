import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/api";
import { TeamTable } from "@/components/ui/table/TeamTable";
import type { TeamMembersValue, TeamTableRowData } from "@/components/ui/table/TeamTableRow";
import { useNotifications, useUser } from "@/store";

type TeamResponseRow = {
    id: number;
    league_id: number;
    league_name?: string | null;
    owner_user_id: number | null;
    owner_full_name?: string | null;
    owner_email?: string | null;
    owner_phone_number?: string | null;
    name: string;
    members: unknown;
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

function createEmptyMembers(): TeamMembersValue {
    return Array.from({ length: 4 }, () => "");
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

function parseMembers(value: unknown): TeamMembersValue {
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
            participants?: Array<{ full_name?: unknown }>;
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

function buildMembersRequestValue(row: TeamTableRowData): TeamMembersValue {
    return row.members.map((member) => member.trim());
}

function mapTeamResponseRow(row: TeamResponseRow): TeamTableRowData {
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

export function EventTeamsPage() {
    const { eventId, locationId, leagueId } = useParams();
    const can = useUser((state) => state.can);
    const notify = useNotifications((state) => state.addMessage);
    const [rows, setRows] = useState<TeamResponseRow[]>([]);
    const [loading, setLoading] = useState(false);

    function canEditTeam(teamId: number) {
        return can("teams", "update", teamId);
    }

    const tableRows = useMemo<TeamTableRowData[]>(() => {
        return rows.map(mapTeamResponseRow);
    }, [rows]);

    const loadTeams = useCallback(async () => {
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

        setLoading(true);
        try {
            const data = await apiGet<TeamResponseRow[]>(path, { error: true });
            setRows(data);
        } finally {
            setLoading(false);
        }
    }, [eventId, locationId, leagueId]);

    useEffect(() => {
        void loadTeams();
    }, [loadTeams]);

    async function handleUpdate(row: TeamTableRowData) {
        const payload: Record<string, unknown> = {
            name: row.name,
            members: buildMembersRequestValue(row),
            texts: row.texts,
            appreciations: row.appreciations,
            meals_count: row.meals_count,
            maintainer_full_name: row.maintainer_full_name || null,
            maintainer_activity: row.maintainer_activity || null,
            status: row.status || undefined,
            diploma: row.diploma || null,
            special_nominations: row.special_nominations,
        };

        if (canEditTeam(row.id)) {
            payload.league_id = row.league_id;
        }

        await apiPatch(`teams/${row.id}`, payload, {
            success: "Команда обновлена",
            error: true,
        });

        const updated = await apiGet<TeamResponseRow>(`teams/${row.id}`, { error: true });
        setRows((prev) => prev.map((item) => item.id === row.id ? updated : item));
    }

    async function handleDelete(row: TeamTableRowData) {
        await apiDelete(`teams/${row.id}`, row.id);
        await loadTeams();
    }

    async function handleCreate(row: TeamTableRowData) {
        const created = await apiPost<{ id: number }>("teams", {
            league_id: row.league_id,
            name: row.name,
            members: buildMembersRequestValue(row),
            texts: row.texts,
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
        setRows((prev) => [{
            ...data,
        }, ...prev]);
    }

    async function handleCheckPayment(row: TeamTableRowData) {
        const result = await apiPost<{ paid: boolean }>(`teams/${row.id}/check-payment`, undefined, {
            error: true,
        });

        notify({
            type: "success",
            text: result.paid ? "Оплата подтверждена" : "Оплата пока не поступила",
        });

        const updated = await apiGet<TeamResponseRow>(`teams/${row.id}`, { error: true });
        setRows((prev) => prev.map((item) => item.id === row.id ? updated : item));
        return mapTeamResponseRow(updated);
    }

    return (
        <section className="space-y-5">
            {loading ? <div className="text-sm text-[var(--color-text-secondary)]">Загружаем команды...</div> : null}

            <TeamTable
                data={tableRows}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onCheckPayment={handleCheckPayment}
                onCreate={handleCreate}
                onRefresh={loadTeams}
                loading={loading}
                defaultLeagueId={leagueId ? Number(leagueId) : null}
                defaultLeagueName={leagueId ? tableRows[0]?.league_name ?? "" : ""}
                isColumnEditable={(columnKey, row) => canEditTeam(row.id) && columnKey !== "school" && columnKey !== "region"}
            />
        </section>
    );
}
