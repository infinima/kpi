import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useParams, useSearchParams } from "react-router-dom";
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Clock3,
    CircleUserRound,
    House,
    LayoutGrid,
    LogIn,
    MapPin,
    MonitorPlay,
    Presentation,
    Rows3,
    Table2,
    Trophy,
    Users, Download
} from "lucide-react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import OutlineButton from "@/components/ui/OutlineButton";
import { apiGet, apiGetFile } from "@/api";
import { useUser } from "@/store";
import { useSocketStore } from "@/store/useTableSocket";
import { useShowStore } from "@/store/useShowSocket";
import {
    canUseTableMode,
    getCollectionViewMode,
    VIEW_MODE_PARAM,
    type CollectionEntity,
    type CollectionViewMode
} from "@/pages/event/viewMode";

type EntitySummary = {
    id: number;
    name: string;
};

type LeagueSidebarSummary = EntitySummary & {
    status: string;
};

const LEAGUE_STATUS_ORDER = [
    "NOT_STARTED",
    "REGISTRATION_IN_PROGRESS",
    "REGISTRATION_ENDED",
    "TEAMS_FIXED",
    "ARRIVAL_IN_PROGRESS",
    "ARRIVAL_ENDED",
    "KVARTALY_GAME",
    "LUNCH",
    "FUDZI_GAME",
    "FUDZI_GAME_BREAK",
    "GAMES_ENDED",
    "AWARDING_IN_PROGRESS",
    "ENDED",
] as const;

function isLeagueStatusAtLeast(currentStatus: string | undefined, requiredStatus: string) {
    const currentIndex = LEAGUE_STATUS_ORDER.indexOf((currentStatus ?? "") as (typeof LEAGUE_STATUS_ORDER)[number]);
    const requiredIndex = LEAGUE_STATUS_ORDER.indexOf(requiredStatus as (typeof LEAGUE_STATUS_ORDER)[number]);

    if (currentIndex === -1 || requiredIndex === -1) {
        return false;
    }

    return currentIndex >= requiredIndex;
}

type SidebarItemProps = {
    label: string;
    icon?: ReactNode;
    to?: string;
    onClick?: () => void | Promise<void>;
    end?: boolean;
    modeToggle?: ReactNode;
    collapsed: boolean;
};

function SidebarItem({ to, label, icon, onClick, end = false, modeToggle, collapsed }: SidebarItemProps) {
    const disconnectTableSocket = useSocketStore((state) => state.disconnect);
    const disconnectShowSocket = useShowStore((state) => state.disconnect);
    const className = ({ isActive }: { isActive: boolean }) => `
        flex min-w-0 items-center rounded-xl transition
        ${collapsed ? "h-10 w-10 justify-center px-0 py-0" : "flex-1 gap-2 px-2.5 py-2 text-sm"}
        ${isActive
            ? "bg-[rgba(14,116,144,0.12)] text-[var(--color-primary)]"
            : "text-[var(--color-text-secondary)] hover:bg-[rgba(255,255,255,0.72)] hover:text-[var(--color-text-main)]"}
    `;

    function handleDisconnect() {
        disconnectTableSocket();
        disconnectShowSocket();
    }

    return (
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-1.5"}`}>
            {to ? (
                <NavLink
                    to={to}
                    end={end}
                    title={label}
                    className={className}
                    onClick={handleDisconnect}
                >
                    {icon ? <span className="shrink-0">{icon}</span> : null}
                    {!collapsed ? <span className="min-w-0 truncate">{label}</span> : null}
                </NavLink>
            ) : (
                <button
                    type="button"
                    onClick={() => {
                        handleDisconnect();
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

function SidebarModeToggle({
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
    const disconnectTableSocket = useSocketStore((state) => state.disconnect);
    const disconnectShowSocket = useShowStore((state) => state.disconnect);
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
                disconnectTableSocket();
                disconnectShowSocket();
            }}
        >
            <Icon size={collapsed ? 16 : 14} />
        </Link>
    );
}

function NestedGroup({
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

function CollapsedDivider() {
    return <div className="mx-auto my-1 h-px w-8 rounded-full bg-[var(--color-border)]" />;
}

function SidebarCollapseToggle({
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

export default function EventsSidebar() {
    const { eventId, locationId, leagueId } = useParams();
    const guest = useUser((state) => state.guest);
    const user = useUser((state) => state.user);
    const can = useUser((state) => state.can);

    const [collapsed, setCollapsed] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);
    const [eventInfo, setEventInfo] = useState<EntitySummary | null>(null);
    const [locationInfo, setLocationInfo] = useState<EntitySummary | null>(null);
    const [leagueInfo, setLeagueInfo] = useState<LeagueSidebarSummary | null>(null);

    useEffect(() => {
        setCollapsed(window.localStorage.getItem("events_sidebar_collapsed") === "true");
    }, []);

    useEffect(() => {
        const media = window.matchMedia("(min-width: 1024px)");
        const update = () => setIsDesktop(media.matches);
        update();
        media.addEventListener("change", update);
        return () => media.removeEventListener("change", update);
    }, []);

    useEffect(() => {
        let ignore = false;

        async function loadEvent() {
            if (!eventId) {
                setEventInfo(null);
                return;
            }

            try {
                const data = await apiGet<EntitySummary>(`events/${eventId}`);
                if (!ignore) {
                    setEventInfo({ id: data.id, name: data.name });
                }
            } catch {
                if (!ignore) {
                    setEventInfo(null);
                }
            }
        }

        void loadEvent();
        return () => {
            ignore = true;
        };
    }, [eventId]);

    useEffect(() => {
        let ignore = false;

        async function loadLocation() {
            if (!locationId) {
                setLocationInfo(null);
                return;
            }

            try {
                const data = await apiGet<EntitySummary>(`locations/${locationId}`);
                if (!ignore) {
                    setLocationInfo({ id: data.id, name: data.name });
                }
            } catch {
                if (!ignore) {
                    setLocationInfo(null);
                }
            }
        }

        void loadLocation();
        return () => {
            ignore = true;
        };
    }, [locationId]);

    useEffect(() => {
        let ignore = false;

        async function loadLeague() {
            if (!leagueId) {
                setLeagueInfo(null);
                return;
            }

            try {
                const data = await apiGet<LeagueSidebarSummary>(`leagues/${leagueId}`);
                if (!ignore) {
                    setLeagueInfo({ id: data.id, name: data.name, status: data.status });
                }
            } catch {
                if (!ignore) {
                    setLeagueInfo(null);
                }
            }
        }

        void loadLeague();
        return () => {
            ignore = true;
        };
    }, [leagueId]);

    function handleToggleCollapse() {
        setCollapsed((prev) => {
            const next = !prev;
            window.localStorage.setItem("events_sidebar_collapsed", String(next));
            return next;
        });
    }

    const effectiveCollapsed = isDesktop && collapsed;

    const eventNumber = eventInfo?.id ?? (eventId ? Number(eventId) : undefined);
    const locationNumber = locationInfo?.id ?? (locationId ? Number(locationId) : undefined);
    const leagueNumber = leagueInfo?.id ?? (leagueId ? Number(leagueId) : undefined);
    const rights = user?.rights;
    const canSeeTeams = !guest && can("teams", "get");
    const canSeeKvartalyResults = isLeagueStatusAtLeast(leagueInfo?.status, "KVARTALY_GAME");
    const canSeeFudziResults = isLeagueStatusAtLeast(leagueInfo?.status, "LUNCH");
    const canSeeOverallResults = leagueInfo?.status === "ENDED"
        || (leagueNumber ? can("leagues", "print_documents", leagueNumber) : false);

    return (
        <aside
            className={`
                w-full shrink-0 rounded-[24px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.82)]
                p-2.5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl
                lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:overflow-y-auto
                ${effectiveCollapsed ? "lg:w-[72px]" : "lg:w-[288px]"}
            `}
        >
            <div className={`flex flex-col gap-3 ${effectiveCollapsed ? "items-center" : ""}`}>
                <div className={`flex w-full items-center ${effectiveCollapsed ? "justify-center gap-3" : "gap-2"}`}>
                    {guest && !effectiveCollapsed ? (
                        <Link to="/auth" className="block">
                            <PrimaryButton
                                active
                                leftIcon={<LogIn size={16} />}
                                className={effectiveCollapsed ? "h-10 w-10 px-0 py-0 [&>span:last-child]:hidden" : "w-full justify-center px-4 py-2.5 text-sm"}
                            >
                                Войти
                            </PrimaryButton>
                        </Link>
                    ) : !guest && !effectiveCollapsed ? (
                        <Link to="/lk" className={effectiveCollapsed ? "block" : "flex-1"}>
                            <OutlineButton
                                active
                                leftIcon={<CircleUserRound size={16} />}
                                className="w-full justify-center px-4 py-2.5 text-sm"
                            >
                                Профиль
                            </OutlineButton>
                        </Link>
                    ) : null}

                    {isDesktop ? (
                        <SidebarCollapseToggle collapsed={effectiveCollapsed} onToggle={handleToggleCollapse} />
                    ) : null}
                </div>

                <div className={`flex w-full ${effectiveCollapsed ? "justify-center" : ""}`}>
                    <Link
                        to="/"
                        title="На главную"
                        aria-label="На главную"
                        className={effectiveCollapsed ? "block" : "w-full"}
                    >
                        {effectiveCollapsed ? (
                            <OutlineButton
                                active
                                className="h-10 w-10 px-0 py-0"
                            >
                                <House size={16} />
                            </OutlineButton>
                        ) : (
                            <OutlineButton
                                active
                                leftIcon={<House size={16} />}
                                className="h-10 w-full px-4 py-2.5 text-sm"
                            >
                                На главную
                            </OutlineButton>
                        )}
                    </Link>
                </div>

                <div className={`w-full rounded-[20px] border border-[var(--color-border)] bg-[rgba(248,250,252,0.92)] ${effectiveCollapsed ? "p-2" : "p-3"}`}>
                    <NestedGroup collapsed={effectiveCollapsed}>
                        <SidebarItem
                            to="/events"
                            label="Все мероприятия"
                            icon={<CalendarDays size={16} />}
                            end={!eventId}
                            collapsed={effectiveCollapsed}
                            modeToggle={
                                <SidebarModeToggle
                                    entity="events"
                                    to={eventId ? `/events/${eventId}` : "/events"}
                                    canTable={canUseTableMode(rights, "events")}
                                    collapsed={effectiveCollapsed}
                                />
                            }
                        />

                        {eventInfo ? (
                            <>
                                {effectiveCollapsed ? <CollapsedDivider /> : null}
                                <NestedGroup title={eventInfo.name} level={1} collapsed={effectiveCollapsed}>
                                {eventNumber && can("events", "access_history", eventNumber) ? (
                                    <SidebarItem
                                        to={`/events/${eventInfo.id}/history`}
                                        label="История изменений"
                                        icon={<Clock3 size={16} />}
                                        collapsed={effectiveCollapsed}
                                    />
                                ) : null}

                                {canSeeTeams ? (
                                    <SidebarItem
                                        to={`/events/${eventInfo.id}/teams`}
                                        label="Команды"
                                        icon={<Users size={16} />}
                                        collapsed={effectiveCollapsed}
                                    />
                                ) : null}

                                <SidebarItem
                                    to={`/events/${eventInfo.id}/location`}
                                    label="Площадки"
                                    icon={<MapPin size={16} />}
                                    end={!locationId}
                                    collapsed={effectiveCollapsed}
                                    modeToggle={
                                        <SidebarModeToggle
                                            entity="locations"
                                            to={locationId
                                                ? `/events/${eventInfo.id}/location/${locationId}`
                                                : `/events/${eventInfo.id}/location`}
                                            canTable={canUseTableMode(rights, "locations")}
                                            collapsed={effectiveCollapsed}
                                        />
                                    }
                                />

                                {locationInfo ? (
                                    <>
                                        {effectiveCollapsed ? <CollapsedDivider /> : null}
                                        <NestedGroup title={locationInfo.name} level={1} collapsed={effectiveCollapsed}>
                                        {locationNumber && can("locations", "access_history", locationNumber) ? (
                                            <SidebarItem
                                                to={`/events/${eventInfo.id}/location/${locationInfo.id}/history`}
                                                label="История изменений"
                                                icon={<Clock3 size={16} />}
                                                collapsed={effectiveCollapsed}
                                            />
                                        ) : null}

                                        {canSeeTeams ? (
                                            <SidebarItem
                                                to={`/events/${eventInfo.id}/location/${locationInfo.id}/teams`}
                                                label="Команды"
                                                icon={<Users size={16} />}
                                                collapsed={effectiveCollapsed}
                                            />
                                        ) : null}

                                        <SidebarItem
                                            to={`/events/${eventInfo.id}/location/${locationInfo.id}/league`}
                                            label="Лиги"
                                            icon={<Trophy size={16} />}
                                            end={!leagueId}
                                            collapsed={effectiveCollapsed}
                                            modeToggle={
                                                <SidebarModeToggle
                                                    entity="leagues"
                                                    to={leagueId
                                                        ? `/events/${eventInfo.id}/location/${locationInfo.id}/league/${leagueId}`
                                                        : `/events/${eventInfo.id}/location/${locationInfo.id}/league`}
                                                    canTable={canUseTableMode(rights, "leagues")}
                                                    collapsed={effectiveCollapsed}
                                                />
                                            }
                                        />

                                        {leagueInfo ? (
                                            <>
                                                {effectiveCollapsed ? <CollapsedDivider /> : null}
                                                <NestedGroup title={leagueInfo.name} level={1} collapsed={effectiveCollapsed}>
                                                {leagueNumber && can("leagues", "access_history", leagueNumber) ? (
                                                    <SidebarItem
                                                        to={`/events/${eventInfo.id}/location/${locationInfo.id}/league/${leagueInfo.id}/history`}
                                                        label="История изменений"
                                                        icon={<Clock3 size={16} />}
                                                        collapsed={effectiveCollapsed}
                                                    />
                                                ) : null}

                                                {canSeeKvartalyResults ? (
                                                    <SidebarItem
                                                        to={`/events/${eventInfo.id}/location/${locationInfo.id}/league/${leagueInfo.id}/results/kvartaly`}
                                                        label="Результаты кварталов"
                                                        icon={<Rows3 size={16} />}
                                                        collapsed={effectiveCollapsed}
                                                    />
                                                ) : null}

                                                {canSeeFudziResults ? (
                                                    <SidebarItem
                                                        to={`/events/${eventInfo.id}/location/${locationInfo.id}/league/${leagueInfo.id}/results/fudzi`}
                                                        label="Результаты фудзи"
                                                        icon={<Rows3 size={16} />}
                                                        collapsed={effectiveCollapsed}
                                                    />
                                                ) : null}

                                                {canSeeOverallResults ? (
                                                    <SidebarItem
                                                        to={`/events/${eventInfo.id}/location/${locationInfo.id}/league/${leagueInfo.id}/results/overall`}
                                                        label="Результаты общие"
                                                        icon={<Rows3 size={16} />}
                                                        collapsed={effectiveCollapsed}
                                                    />
                                                ) : null}

                                                {canSeeTeams ? (
                                                    <SidebarItem
                                                        to={`/events/${eventInfo.id}/location/${locationInfo.id}/league/${leagueInfo.id}/teams`}
                                                        label="Команды"
                                                        icon={<Users size={16} />}
                                                        collapsed={effectiveCollapsed}
                                                    />
                                                ) : null}

                                                {leagueNumber && can("leagues", "get_show", leagueNumber) ? (
                                                    <SidebarItem
                                                        to={`/events/${eventInfo.id}/location/${locationInfo.id}/league/${leagueInfo.id}/show`}
                                                        label="Показ"
                                                        icon={<MonitorPlay size={16} />}
                                                        collapsed={effectiveCollapsed}
                                                    />
                                                ) : null}

                                                {leagueNumber && can("leagues", "control_show", leagueNumber) ? (
                                                    <SidebarItem
                                                        to={`/events/${eventInfo.id}/location/${locationInfo.id}/league/${leagueInfo.id}/show-control`}
                                                        label="Управление показом"
                                                        icon={<MonitorPlay size={16} />}
                                                        collapsed={effectiveCollapsed}
                                                    />
                                                ) : null}

                                                {leagueNumber && can("leagues", "print_documents", leagueNumber) ? (
                                                    <SidebarItem
                                                        label="Карточки команд"
                                                        icon={<Download size={16} />}
                                                        onClick={() => apiGetFile(
                                                            `leagues/${leagueInfo.id}/print_teams_names`,
                                                            `league_${leagueInfo.id}_team_cards.pdf`,
                                                            { error: true }
                                                        )}
                                                        collapsed={effectiveCollapsed}
                                                    />
                                                ) : null}

                                                {leagueNumber && can("leagues", "print_documents", leagueNumber) ? (
                                                    <SidebarItem
                                                        label="Команды (Excel)"
                                                        icon={<Download size={16} />}
                                                        onClick={() => apiGetFile(
                                                            `leagues/${leagueInfo.id}/teams_excel`,
                                                            `league_${leagueInfo.id}_teams.xlsx`,
                                                            { error: true }
                                                        )}
                                                        collapsed={effectiveCollapsed}
                                                    />
                                                ) : null}

                                                {leagueNumber && can("leagues", "get_show", leagueNumber) ? (
                                                    <SidebarItem
                                                        label="Презентация Фудзи"
                                                        icon={<Download size={16} />}
                                                        onClick={() => apiGetFile(
                                                            `leagues/${leagueInfo.id}/fudzi_presentation`,
                                                            `league_${leagueInfo.id}_fudzi_presentation.pdf`,
                                                            { error: true }
                                                        )}
                                                        collapsed={effectiveCollapsed}
                                                    />
                                                ) : null}
                                                </NestedGroup>
                                            </>
                                        ) : null}
                                        </NestedGroup>
                                    </>
                                ) : null}
                                </NestedGroup>
                            </>
                        ) : null}
                    </NestedGroup>
                </div>
            </div>
        </aside>
    );
}
