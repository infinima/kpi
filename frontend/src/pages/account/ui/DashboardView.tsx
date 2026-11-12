import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { QueryError } from "@/shared/ui/QueryError";
import { leagueStatusLabels, leagueStatuses, type LeagueStatus, type useDashboardModel } from "../model/useDashboardModel";
type Dashboard = ReturnType<typeof useDashboardModel>;
type League = Dashboard["locations"][number]["leagues"][number];
function LeagueRow({ league, eventId, locationId, dashboard }: { league: League; eventId: number; locationId: number; dashboard: Dashboard }) {
    const [status, setStatus] = useState<LeagueStatus>(league.status);
    useEffect(() => { setStatus(league.status); }, [league.id, league.status]);
    const editable = dashboard.statusChangeAvailable && league.canChangeStatus;
    return <div className="grid gap-4 border-t border-[var(--color-border)] py-5 2xl:grid-cols-[minmax(130px,1fr)_minmax(160px,1.3fr)_minmax(140px,1fr)_minmax(210px,1.6fr)] 2xl:items-center">
        <Link to={`/events/${eventId}/location/${locationId}/league/${league.id}`} className="inline-flex items-center gap-2 font-medium text-[var(--color-primary)] hover:underline">{league.name}<ArrowUpRight size={15} /></Link>
        <div><span className={`inline-block rounded-full px-3 py-1.5 text-xs font-medium ${league.status === "REGISTRATION_IN_PROGRESS" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>{leagueStatusLabels[league.status]}</span></div>
        <div className="text-sm"><p>Команд: <strong>{league.teamsCount}</strong>{league.maxTeamsCount > 0 ? ` / ${league.maxTeamsCount}` : " · без лимита"}</p><p className="mt-1 text-[var(--color-text-secondary)]">В резерве: {league.reserveCount}</p>
            {league.occupancy != null && <progress aria-label={`Заполнение лиги ${league.name}`} max={100} value={league.occupancy} className="mt-2 h-1.5 w-full max-w-40 accent-[var(--color-primary)]" />}
        </div>
        <form onSubmit={e => { e.preventDefault(); if (editable && status !== league.status && !dashboard.saving) dashboard.changeStatus(league.id, status); }} className="flex flex-wrap items-center gap-2">
            <select aria-label={`Новый статус лиги ${league.name}`} aria-describedby={!dashboard.statusChangeAvailable ? "status-api-unavailable" : undefined} disabled={!editable || dashboard.saving} value={status} onChange={e => setStatus(e.target.value as LeagueStatus)} className="min-w-0 max-w-full flex-1 rounded-xl border border-[var(--color-border)] bg-white p-2.5 text-sm disabled:bg-slate-50 disabled:text-slate-500">
                {leagueStatuses.map(value => <option key={value} value={value} disabled={!league.canRollback && leagueStatuses.indexOf(value) < leagueStatuses.indexOf(league.status)}>{leagueStatusLabels[value]}</option>)}
            </select>
            <button type="submit" disabled={!editable || dashboard.saving || status === league.status} className="rounded-xl bg-[var(--color-primary)] px-3 py-2.5 text-sm text-white disabled:bg-slate-100 disabled:text-slate-400">Сохранить</button>
        </form>
    </div>;
}
export function DashboardView(m: Dashboard) {
    if (!m.allowed) return <section><h1 className="text-2xl font-semibold">Dashboard</h1><p className="mt-3">Раздел доступен только администраторам.</p></section>;
    return <section className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-[var(--color-text-secondary)]">Управление главным мероприятием</p><h1 className="mt-1 text-3xl font-semibold">Dashboard</h1></div><button onClick={m.refresh} disabled={m.refreshing} className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={15} className={m.refreshing ? "animate-spin" : ""} />Обновить</button></div>
        <div className={`rounded-2xl border p-4 text-sm ${m.siteInWork ? "border-amber-200 bg-amber-50 text-amber-900" : "border-[var(--color-border)] bg-slate-50"}`}><span className="font-medium">Статус сайта: {m.siteStatus}</span>{m.siteInWork && <span> · Доступ только администраторам</span>}{m.siteMessage && <p className="mt-1">{m.siteMessage}</p>}</div>
        {m.error && <QueryError message="Не удалось загрузить главное мероприятие." onRetry={m.refresh} />}
        {m.loading ? <p role="status">Загружаем dashboard…</p> : !m.event ? !m.error && <p className="rounded-2xl bg-slate-50 p-6">Главное мероприятие пока не назначено.</p> : <>
            <div className="rounded-3xl bg-slate-50 p-5"><h2 className="text-2xl font-semibold">{m.event.name}</h2><p className="mt-2 text-sm text-[var(--color-text-secondary)]"><time dateTime={m.event.date}>{new Date(`${m.event.date}T12:00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}</time> · Автообновление каждые 30 секунд</p></div>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[["Площадок", m.locations.length], ["Лиг", m.stats.leagues], ["Команд", m.stats.teams], ["В резерве", m.stats.reserve]].map(([label, value]) => <div key={label} className="rounded-2xl border border-[var(--color-border)] bg-white p-4"><p className="text-sm text-[var(--color-text-secondary)]">{label}</p><p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p></div>)}</div>
            <p className="text-sm text-[var(--color-text-secondary)]">Регистрация открыта в лигах: {m.stats.registrationOpen} из {m.stats.leagues}. Свободных мест в лигах с лимитом: {m.stats.availablePlaces}.{m.stats.unlimitedLeagues > 0 && ` Лиг без ограничения мест: ${m.stats.unlimitedLeagues}.`}</p>
            {!m.statusChangeAvailable && <p id="status-api-unavailable" role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Изменение статусов пока недоступно: dev API ещё не публикует этот маршрут. Здесь отображаются актуальные статусы с сервера.</p>}
            {m.changeError && <p role="alert" className="text-sm text-red-700">{m.changeError}</p>}
            {m.locations.length === 0 && <p className="rounded-2xl bg-slate-50 p-6">Площадки пока не добавлены.</p>}
            {m.locations.map(location => <section key={location.id} className="rounded-3xl border border-[var(--color-border)] bg-white p-5">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-xl font-semibold">{location.name}</h3><p className="mt-1 text-sm text-[var(--color-text-secondary)]">{location.address}</p></div><p className="text-sm text-[var(--color-text-secondary)]">Лиг: {location.stats.leagues} · Команд: {location.stats.teams} · В резерве: {location.stats.reserve}</p></div>
                {location.leagues.length === 0 ? <p className="text-sm text-[var(--color-text-secondary)]">Лиги пока не добавлены.</p> : location.leagues.map(league => <LeagueRow key={league.id} league={league} eventId={m.event!.id} locationId={location.id} dashboard={m} />)}
            </section>)}
        </>}
    </section>;
}
