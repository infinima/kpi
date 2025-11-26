import { useEffect, useState, useMemo } from "react";
import { Search, Plus } from "lucide-react";

import { apiGet } from "@/api";
import { useEventsNav, useUI, useNotifications, useUser } from "@/store";

import { LeagueCard } from "@/components/LeagueCard";
import { FormModal } from "@/components/layout/FormModal";
import { leagueForm } from "@/config/leagueForm";

export function LeaguesPage() {
    const locationId = useEventsNav((s) => s.locationId);

    const [leagues, setLeagues] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [mode, setMode] = useState<"active" | "deleted">("active");

    const notify = useNotifications((s) => s.addMessage);

    const formOpen = useUI((s) => s.formModalOpen);
    const closeForm = useUI((s) => s.closeFormModal);
    const openForm = useUI((s) => s.openFormModal);
    const formConfig = useUI((s) => s.formConfig);
    const formData = useUI((s) => s.formData);

    // ---- ПРАВА ----
    const { can, guest } = useUser();

    const canCreate = can("leagues", "create", locationId);
    const canRestore = can("leagues", "restore", locationId);
    const canViewDeleted = canRestore; // правило как в других страницах



    // ---- ЗАГРУЗКА ----
    async function loadLeagues() {
        if (!locationId) return;

        try {
            const url =
                mode === "active"
                    ? `leagues/location/${locationId}`
                    : `leagues/location/${locationId}/deleted`;

            const data = await apiGet(url);
            setLeagues(data);
        } catch {
            notify({ type: "error", text: "Не удалось загрузить лиги" });
        }
    }

    useEffect(() => {
        loadLeagues();
    }, [mode, locationId]);


    // ---- Поиск ----
    const filtered = useMemo(() => {
        const s = search.toLowerCase();
        return leagues.filter((l: any) =>
            l.name.toLowerCase().includes(s)
        );
    }, [search, leagues]);


    // Если нет прав — показать сообщение


    return (
        <div className="space-y-6">

            {/* SEARCH + FILTERS + ADD */}
            <div className="flex flex-col sm:flex-row gap-4">

                {/* Поиск */}
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" size={18} />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Поиск по лигам…"
                        className="
                            w-full pl-10 pr-3 py-2 rounded-lg
                            bg-surface dark:bg-dark-surface
                            border border-border dark:border-dark-border
                        "
                    />
                </div>

                {/* Активные / удалённые */}
                {canViewDeleted && <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as any)}
                    className="px-3 py-2 rounded-lg bg-surface dark:bg-dark-surface border border-border dark:border-dark-border">

                    <option value="active">Активные</option>
                    {canViewDeleted && <option value="deleted">Удалённые</option>}
                </select>}

                {/* Добавить лигу */}
                {mode === "active" && canCreate && (
                    <button
                        onClick={() => openForm(leagueForm, { location_id: locationId })}
                        className="
                            flex items-center gap-2 px-4 py-2
                            bg-primary text-white rounded-lg
                            hover:bg-primary-dark
                        "
                    >
                        <Plus size={18} />
                        Добавить лигу
                    </button>
                )}
            </div>

            {/* LIST */}
            {filtered.length === 0 ? (
                <p>Ничего не найдено</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((lg) => (
                        <LeagueCard
                            key={lg.id}
                            league={lg}
                            onRefresh={loadLeagues}
                            isDeleted={mode === "deleted"}
                        />
                    ))}
                </div>
            )}

            {/* MODAL */}
            {formOpen && (
                <FormModal
                    config={formConfig}
                    initialData={formData}
                    onClose={closeForm}
                    onUpdated={loadLeagues}
                />
            )}
        </div>
    );
}