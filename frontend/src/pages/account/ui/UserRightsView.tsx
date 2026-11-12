import type { Role, ScopeType } from "../model/useUserRightsModel";
import type { useUserRightsModel } from "../model/useUserRightsModel";
const roles: Record<Role, string> = { admin: "Администратор", organizer: "Организатор", checker_volunteer: "Волонтёр проверки", venue_volunteer: "Волонтёр площадки" };
const scopes: Record<ScopeType, string> = { global: "Глобально", event: "Мероприятие", location: "Площадка", league: "Лига" };
export function UserRightsView(m: ReturnType<typeof useUserRightsModel>) {
    if (!m.payload) return null;
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
        <section role="dialog" aria-modal="true" aria-label="Роли пользователя" className="max-h-[88vh] w-full max-w-3xl overflow-auto rounded-3xl bg-white p-6 space-y-4">
            <h2 className="text-2xl">Роли: {m.payload.userName}</h2>
            {m.query.isLoading && <p>Загрузка...</p>}
            {m.query.isError && <p role="alert">Не удалось загрузить роли</p>}
            {m.error && <p role="alert">{m.error}</p>}
            <ul className="space-y-3">{m.query.data?.map(row => <li key={row.id} className="flex justify-between gap-4 border-b p-2">
                <span>{roles[row.role]} · {scopes[row.scope_type]} {row.league?.name ?? row.location?.name ?? row.event?.name ?? ""}</span>
                <button disabled={m.busy} onClick={() => void m.remove(row.id)}>Отозвать</button>
            </li>)}</ul>
            <form className="flex flex-wrap gap-3" onSubmit={event => { event.preventDefault(); void m.save(); }}>
                <select aria-label="Роль" value={m.role} onChange={e => m.setRole(e.target.value as Role)}>{Object.entries(roles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                {m.role !== "admin" && <select aria-label="Область" value={m.scope} onChange={e => m.setScope(e.target.value as ScopeType)}>{Object.entries(scopes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>}
                {m.role !== "admin" && m.scope !== "global" && <input aria-label="ID области" placeholder="ID области" inputMode="numeric" value={m.scopeId} onChange={e => m.setScopeId(e.target.value)} />}
                <button disabled={m.busy || m.query.isError} type="submit">Назначить роль</button>
            </form>
            <button onClick={m.closeModal}>Закрыть</button>
        </section>
    </div>;
}
