import { ArrowLeft, ChevronRight, House, UserRound } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import type { useEventsSidebarModel } from "../model/useEventsSidebarModel";
const tab = ({ isActive }: { isActive: boolean }) => `rounded-xl px-4 py-2.5 text-sm font-medium transition ${isActive ? "bg-[var(--color-primary)] text-white" : "bg-white text-[var(--color-text-secondary)] hover:bg-slate-100"}`;
export function EventsSidebarView({ guest, eventInfo, locationInfo, leagueInfo, canSeeTeams }: ReturnType<typeof useEventsSidebarModel>) {
    const eventPath = eventInfo ? `/events/${eventInfo.id}` : null;
    const locationPath = eventPath && locationInfo ? `${eventPath}/location/${locationInfo.id}` : null;
    const leaguePath = locationPath && leagueInfo ? `${locationPath}/league/${leagueInfo.id}` : null;
    const overview = leaguePath ?? (locationPath ? `${locationPath}/league` : eventPath ? `${eventPath}/location` : "/events");
    const scopePath = leaguePath ?? locationPath ?? eventPath;
    return <header className="w-full rounded-3xl border border-[var(--color-border)] bg-white/90 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
            <Link to="/" className="inline-flex items-center gap-2 font-semibold"><House size={18} />кπца</Link>
            <div className="flex flex-wrap items-center gap-4 text-sm">
                <Link to="/events" className="text-[var(--color-primary)]">Все мероприятия</Link>
                <Link to={guest ? "/auth" : "/lk"} className="inline-flex items-center gap-2"><UserRound size={16} />{guest ? "Войти" : "Личный кабинет"}</Link>
            </div>
        </div>
        {eventInfo && <>
            <nav aria-label="Путь к мероприятию" className="mt-5 border-t border-[var(--color-border)] pt-4">
                <ol className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                    <li><Link to="/events" className="inline-flex items-center gap-1 hover:underline"><ArrowLeft size={14} />Все мероприятия</Link></li>
                    <li className="flex items-center gap-2"><ChevronRight size={14} /><Link to={`${eventPath}/location`} className="hover:underline">{eventInfo.name}</Link></li>
                    {locationInfo && <li className="flex items-center gap-2"><ChevronRight size={14} /><Link to={`${locationPath}/league`} className="hover:underline">{locationInfo.name}</Link></li>}
                    {leagueInfo && <li className="flex items-center gap-2"><ChevronRight size={14} /><Link to={leaguePath!} className="hover:underline">{leagueInfo.name}</Link></li>}
                </ol>
            </nav>
            <nav aria-label="Разделы мероприятия" className="mt-4 flex flex-wrap gap-2">
                <NavLink end to={overview} className={tab}>{leagueInfo ? "О лиге" : locationInfo ? "Лиги" : "Площадки"}</NavLink>
                {canSeeTeams && scopePath && <NavLink end to={`${scopePath}/teams`} className={tab}>Команды</NavLink>}
            </nav>
        </>}
    </header>;
}
