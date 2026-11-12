import {
    type CollectionEntity,
    type CollectionViewMode,
    getCollectionViewMode,
    VIEW_MODE_PARAM
} from "@/pages/event/viewMode";
import OutlineButton from "@/shared/ui/OutlineButton";
import {
    ChevronLeft,
    ChevronRight,
    LayoutGrid,
    Table2
} from "lucide-react";
import { type ReactNode } from "react";
import { Link, NavLink, useSearchParams } from "react-router-dom";
export type EntitySummary = {
    id: number;
    name: string;
};

export type LeagueSidebarSummary = EntitySummary & {
    status: string;
};

export const LEAGUE_STATUS_ORDER = [
    "NOT_STARTED",
    "REGISTRATION_IN_PROGRESS",
    "REGISTRATION_ENDED",
    "TEAMS_FIXED",
    "ARRIVAL_IN_PROGRESS",
    "ARRIVAL_ENDED",
    "KVARTALY_GAME",
    "LUNCH",
    "FUDZI_GAME",
    "GAMES_ENDED",
    "ENDED",
] as const;

export const AWARDING_SCRIPT_FILENAME = "Сценарий_награждения.pdf";

export function downloadPublicFile(fileName: string) {
    const link = document.createElement("a");
    link.href = `/${encodeURIComponent(fileName)}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function isLeagueStatusAtLeast(currentStatus: string | undefined, requiredStatus: string) {
    const currentIndex = LEAGUE_STATUS_ORDER.indexOf((currentStatus ?? "") as (typeof LEAGUE_STATUS_ORDER)[number]);
    const requiredIndex = LEAGUE_STATUS_ORDER.indexOf(requiredStatus as (typeof LEAGUE_STATUS_ORDER)[number]);

    if (currentIndex === -1 || requiredIndex === -1) {
        return false;
    }

    return currentIndex >= requiredIndex;
}

export type SidebarItemProps = {
    label: string;
    icon?: ReactNode;
    to?: string;
    onClick?: () => void | Promise<void>;
    end?: boolean;
    modeToggle?: ReactNode;
    collapsed: boolean;
};

export function SidebarItem({ to, label, icon, onClick, end = false, modeToggle, collapsed }: SidebarItemProps) {
    const className = ({ isActive }: { isActive: boolean; }) => `
        flex min-w-0 items-center rounded-xl transition
        ${collapsed ? "h-10 w-10 justify-center px-0 py-0" : "flex-1 gap-2 px-2.5 py-2 text-sm"}
        ${isActive
            ? "bg-[rgba(14,116,144,0.12)] text-[var(--color-primary)]"
            : "text-[var(--color-text-secondary)] hover:bg-[rgba(255,255,255,0.72)] hover:text-[var(--color-text-main)]"}
    `;

    return (
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-1.5"}`}>
            {to ? (
                <NavLink
                    to={to}
                    end={end}
                    title={label}
                    className={className}
                >
                    {icon ? <span className="shrink-0">{icon}</span> : null}
                    {!collapsed ? <span className="min-w-0 truncate">{label}</span> : null}
                </NavLink>
            ) : (
                <button
                    type="button"
                    onClick={() => {
                        void onClick?.();
                    }}
                    title={label}
                    className={className({ isActive: false })}
                >
                    {icon ? <span className="shrink-0">{icon}</span> : null}
                    {!collapsed ? <span className="min-w-0 truncate text-left">{label}</span> : null}
                </button>
            )}
            {!collapsed ? modeToggle : null}
        </div>
    );
}

export function SidebarModeToggle({
    entity,
    to,
    canTable,
    collapsed,
}: {
    entity: CollectionEntity;
    to: string;
    canTable: boolean;
    collapsed: boolean;
}) {
    const [searchParams] = useSearchParams();
    const mode = getCollectionViewMode(searchParams, entity, canTable);
    const nextMode: CollectionViewMode = mode === "cards" && canTable ? "table" : "cards";
    const Icon = mode === "cards" ? LayoutGrid : Table2;

    const params = new URLSearchParams(searchParams);
    params.set(VIEW_MODE_PARAM[entity], nextMode);
    const nextSearch = params.toString() ? `?${params.toString()}` : "";

    const buttonClass = `
        flex items-center justify-center rounded-lg border border-[var(--color-border)]
        bg-[rgba(255,255,255,0.72)] text-[var(--color-text-secondary)] transition
        ${collapsed ? "h-10 w-10" : "h-8 w-8"}
        ${canTable ? "hover:bg-[rgba(255,255,255,0.95)] hover:text-[var(--color-text-main)]" : "cursor-not-allowed opacity-40"}
    `;

    if (!canTable) {
        return (
            <span className={buttonClass} title="Табличный режим недоступен">
                <Icon size={collapsed ? 16 : 14} />
            </span>
        );
    }

    return (
        <Link
            to={{ pathname: to, search: nextSearch }}
            className={buttonClass}
            title={nextMode === "table" ? "Переключить в таблицу" : "Переключить в карточки"}
            onClick={() => {

            }}
        >
            <Icon size={collapsed ? 16 : 14} />
        </Link>
    );
}

export function NestedGroup({
    title,
    children,
    level = 0,
    collapsed,
}: {
    title?: string;
    children: ReactNode;
    level?: number;
    collapsed: boolean;
}) {
    return (
        <div className={`${!collapsed && level > 0 ? "ml-2 border-l border-[var(--color-border)] pl-3" : ""}`}>
            {!collapsed && title ? (
                <div className="mb-1.5 text-sm font-semibold text-[var(--color-text-main)]">
                    {title}
                </div>
            ) : null}
            <div className={`${collapsed ? "space-y-2" : "space-y-1"}`}>
                {children}
            </div>
        </div>
    );
}

export function CollapsedDivider() {
    return <div className="mx-auto my-1 h-px w-8 rounded-full bg-[var(--color-border)]" />;
}

export function SidebarCollapseToggle({
    collapsed,
    onToggle,
}: {
    collapsed: boolean;
    onToggle: () => void;
}) {
    return (
        <OutlineButton
            active
            onClick={onToggle}
            className={collapsed ? "h-10 w-10 px-0 py-0" : "h-10 w-full px-4 py-2.5"}
        >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </OutlineButton>
    );
}
