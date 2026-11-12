import { ArrowRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { QueryError } from "@/shared/ui/QueryError";
import type { useLocationsPageModel } from "./model/useLocationsPageModel";
export function LocationsView({ eventId, locations, loading, error, loadLocations }: ReturnType<typeof useLocationsPageModel>) {
    return <section className="space-y-6">
        <div><h1 className="text-3xl font-semibold">Выберите площадку</h1><p className="mt-2 text-[var(--color-text-secondary)]">Выберите удобное место проведения, затем перейдите к лигам.</p></div>
        {error ? <QueryError message="Не удалось загрузить площадки." onRetry={() => void loadLocations()} /> : loading ? <p role="status">Загружаем площадки…</p> : locations.length === 0 ? <p className="rounded-2xl bg-slate-50 p-6">Площадки этого мероприятия пока не опубликованы.</p> :
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{locations.map(location => <article key={location.id} className="flex flex-col rounded-3xl border border-[var(--color-border)] bg-white p-6">
            <MapPin size={22} className="text-[var(--color-primary)]" /><h2 className="mt-4 text-xl font-semibold">{location.name}</h2><p className="mt-2 text-sm text-[var(--color-text-secondary)]">{location.address}</p>
            <Link to={`/events/${eventId}/location/${location.id}/league`} className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-medium text-[var(--color-primary)] hover:underline">Выбрать лигу <ArrowRight size={16} /></Link>
            {location.photoAlbumUrl && <a href={location.photoAlbumUrl} target="_blank" rel="noreferrer" className="mt-3 text-sm text-[var(--color-text-secondary)] underline">Фото площадки</a>}
        </article>)}</div>}
    </section>;
}
