import { Trophy } from "lucide-react";

type LeagueCardProps = {
    name: string;
    status: string;
    deleted_at?: string | null;
    selected?: boolean;
    onClick: () => void;
};

import { leagueStatusLabels } from "../model/status";
export { leagueStatusLabels } from "../model/status";

export function LeagueCard({
    name,
    status,
    deleted_at,
    selected = false,
    onClick,
}: LeagueCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`
                rounded-[24px] border p-4 text-left transition
                ${selected
                    ? "border-[var(--color-primary)] bg-[rgba(14,116,144,0.08)]"
                    : "border-[var(--color-border)] bg-[rgba(255,255,255,0.84)] hover:border-[var(--color-primary-light)]"}
            `}
        >
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(245,158,11,0.14)] text-[var(--color-warning)]">
                    <Trophy size={18} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="truncate text-base font-semibold text-[var(--color-text-main)]">
                        {name}
                    </div>
                    <div className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
                        Статус: {leagueStatusLabels[status as keyof typeof leagueStatusLabels] ?? status}
                    </div>
                    {deleted_at ? (
                        <div className="mt-1 text-sm text-[var(--color-error)]">
                            Удалено: {new Date(deleted_at).toLocaleString("ru-RU")}
                        </div>
                    ) : null}
                </div>
            </div>
        </button>
    );
}
