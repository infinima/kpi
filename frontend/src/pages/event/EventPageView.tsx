import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Search } from "lucide-react";
import { QueryError } from "@/shared/ui/QueryError";
import type { useEventsPageModel } from "./model/useEventsPageModel";
const labels: Record<string, string> = { ANNOUNCED: "Скоро", REGISTRATION_OPEN: "Регистрация открыта", REGISTRATION_CLOSED: "Регистрация закрыта", GAMES_IN_PROGRESS: "Идут игры", FINISHED: "Завершено" };
export function EventsView({ events, loading, error, loadEvents }: ReturnType<typeof useEventsPageModel>) {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const filtered = events.filter(event => event.name.toLocaleLowerCase("ru-RU").includes(search.trim().toLocaleLowerCase("ru-RU")) && (filter === "all" || (filter === "open" ? event.status === "REGISTRATION_OPEN" : event.status === "FINISHED"))).sort((a, b) => b.date.localeCompare(a.date));
    return <section className="space-y-6">
        <div><h1 className="text-3xl font-semibold tracking-tight">Все мероприятия</h1><p className="mt-2 text-[var(--color-text-secondary)]">Выберите турнир, затем площадку и лигу.</p></div>
        <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex flex-1 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-4"><Search size={18} /><input aria-label="Поиск мероприятия" placeholder="Название мероприятия" value={search} onChange={e => setSearch(e.target.value)} className="min-w-0 flex-1 bg-transparent py-3 outline-none" /></label>
            <select aria-label="Статус мероприятий" value={filter} onChange={e => setFilter(e.target.value)} className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-3"><option value="all">Все мероприятия</option><option value="open">Открыта регистрация</option><option value="finished">Завершённые</option></select>
        </div>
        {error ? <QueryError message="Не удалось загрузить мероприятия." onRetry={() => void loadEvents()} /> : loading ? <p role="status">Загружаем мероприятия…</p> : filtered.length === 0 ? <p className="rounded-2xl bg-slate-50 p-6">{events.length ? "По вашему запросу мероприятий не найдено." : "Мероприятия пока не опубликованы."}</p> :
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map(event => <Link key={event.id} to={`/events/${event.id}/location`} className="group flex flex-col rounded-3xl border border-[var(--color-border)] bg-white p-6 transition hover:border-[var(--color-primary-light)] hover:shadow-md focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]">
            <span className={`self-start rounded-full px-3 py-1 text-xs font-medium ${event.status === "REGISTRATION_OPEN" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{labels[event.status ?? ""] ?? "Турнир"}</span>
            <h2 className="mt-4 text-xl font-semibold">{event.name}</h2>
            <p className="mt-3 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]"><CalendarDays size={16} /><time dateTime={event.date}>{new Date(`${event.date}T12:00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}</time></p>
            <span className="mt-auto flex items-center gap-2 pt-6 text-sm font-medium text-[var(--color-primary)]">Выбрать площадку <ArrowRight size={16} /></span>
        </Link>)}</div>}
    </section>;
}
