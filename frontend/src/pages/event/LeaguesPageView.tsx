import { ArrowRight, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { leagueStatusLabels } from "@/entities/league/ui/LeagueCard";
import { QueryError } from "@/shared/ui/QueryError";
import type { useLeaguesPageModel } from "./model/useLeaguesPageModel";
export function LeaguesView(m: ReturnType<typeof useLeaguesPageModel>) {
    const base = `/events/${m.eventId}/location/${m.locationId}/league`;
    if (m.leagueId) return <section className="space-y-5">
        {m.detailLoading ? <p role="status">Загружаем лигу…</p> : m.detailError ? <QueryError message="Не удалось загрузить лигу." onRetry={m.retryDetail} /> : m.selectedLeague && <>
            <p className="text-sm text-[var(--color-primary)]">{leagueStatusLabels[m.selectedLeague.status as keyof typeof leagueStatusLabels] ?? m.selectedLeague.status}</p>
            <h1 className="text-3xl font-semibold">{m.selectedLeague.name}</h1>
            <p className="text-[var(--color-text-secondary)]">{m.selectedLeague.maxTeamsCount > 0 ? `Количество мест для команд: ${m.selectedLeague.maxTeamsCount}` : "Количество мест не ограничено"}</p>
            {m.canRegister ? <Link to={m.registrationUrl} className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-3 font-medium text-white">Зарегистрировать команду <ArrowRight size={16} /></Link> : <p className="rounded-2xl bg-slate-50 p-4 text-sm">Регистрация в эту лигу сейчас закрыта.</p>}
            <div><Link to={base} className="text-sm text-[var(--color-primary)] hover:underline">← Все лиги площадки</Link></div>
        </>}
    </section>;
    return <section className="space-y-6">
        <div><h1 className="text-3xl font-semibold">Выберите лигу</h1><p className="mt-2 text-[var(--color-text-secondary)]">Откройте лигу, чтобы посмотреть её статус и перейти к регистрации.</p></div>
        {m.error ? <QueryError message="Не удалось загрузить лиги." onRetry={() => void m.loadLeagues()} /> : m.loading ? <p role="status">Загружаем лиги…</p> : m.leagues.length === 0 ? <p className="rounded-2xl bg-slate-50 p-6">На этой площадке лиги пока не опубликованы.</p> :
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{m.leagues.map(league => <Link key={league.id} to={`${base}/${league.id}`} className="rounded-3xl border border-[var(--color-border)] bg-white p-6 transition hover:border-[var(--color-primary-light)] hover:shadow-md">
            <Trophy size={22} className="text-[var(--color-primary)]" /><h2 className="mt-4 text-xl font-semibold">{league.name}</h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{leagueStatusLabels[league.status as keyof typeof leagueStatusLabels] ?? league.status}</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)]">Открыть лигу <ArrowRight size={16} /></span>
        </Link>)}</div>}
    </section>;
}
