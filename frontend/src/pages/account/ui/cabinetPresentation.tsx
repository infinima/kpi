import type { OwnedTeam } from '@/entities/account/model/contracts';
import type { ReactNode } from 'react';
export const inputClassName = `
    w-full rounded-2xl border border-[var(--color-border)]
    bg-[rgba(255,255,255,0.92)] px-4 py-3
    text-[var(--color-text-main)] outline-none transition
    placeholder:text-[var(--color-text-secondary)]
    focus:border-[var(--color-primary-light)]
`;

export const readOnlyClassName = `
    w-full rounded-2xl border border-[var(--color-border)]
    bg-[rgba(248,250,252,0.88)] px-4 py-3
    text-[var(--color-text-secondary)]
`;

export const invalidInputClassName = `
    border-[rgba(220,38,38,0.4)] bg-[rgba(254,242,242,0.95)]
    text-[var(--color-text-main)] placeholder:text-[rgba(127,29,29,0.6)]
    focus:border-[rgba(220,38,38,0.65)]
`;

export const teamStatusLabels: Record<OwnedTeam["status"], string> = {
    IN_RESERVE: "В резерве",
    ON_CHECKING: "На проверке",
    ACCEPTED: "Принята",
    ARRIVED: "Прибыла",
    DOCUMENTS_SUBMITTED: "Сдала документы",
};

export function getTeamStatusLabel(status: OwnedTeam["status"] | undefined) {
    if (!status) {
        return "Неизвестно";
    }

    return teamStatusLabels[status] ?? status;
}

export function getTeamPaymentLink(team: OwnedTeam) {
    const rawValue = team.payment_link;

    if (rawValue === null || rawValue === undefined) {
        return null;
    }

    const normalizedValue = String(rawValue).trim();

    if (!normalizedValue || normalizedValue === "0") {
        return null;
    }

    return normalizedValue;
}

export function getTeamFileBaseName(team: OwnedTeam) {
    return team.name.trim().replace(/\s+/g, "_") || `team_${team.id}`;
}

export function withValidationClass(baseClassName: string, isInvalid: boolean) {
    return isInvalid ? `${baseClassName} ${invalidInputClassName}` : baseClassName;
}

export function RequiredLabel({ children, invalid = false }: { children: ReactNode; invalid?: boolean; }) {
    return (
        <span className={`text-sm ${invalid ? "text-[rgba(185,28,28,0.95)]" : "text-[var(--color-text-secondary)]"}`}>
            {children} <span className="text-[rgba(220,38,38,0.9)]">*</span>
        </span>
    );
}

export function InfoBadge({ icon, text }: { icon: ReactNode; text: string; }) {
    return (
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[rgba(255,255,255,0.78)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)]">
            <span className="text-[var(--color-primary)]">{icon}</span>
            <span>{text}</span>
        </div>
    );
}

export function formatEventDate(value: string) {
    try {
        return new Date(value).toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    } catch {
        return value;
    }
}

export function formatDateTime(value: string) {
    try {
        return new Date(value).toLocaleString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return value;
    }
}
