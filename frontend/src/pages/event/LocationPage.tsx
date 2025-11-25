import { useEffect, useState, useMemo } from "react";
import { apiGet } from "@/api";
import { Search, Plus } from "lucide-react";
import { useEventsNav, useUI, useNotifications } from "@/store";

import { LocationCard } from "@/components/event/LocationCard";
import { FormModal } from "@/components/layout/FormModal";
import { locationForm } from "@/config/locationForm";

interface LocationItem {
    id: number;
    event_id: number;
    name: string;
    address: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export function LocationsPage() {
    const eventId = useEventsNav((s) => s.eventId);
    const [locations, setLocations] = useState<LocationItem[]>([]);
    const [search, setSearch] = useState("");
    const [mode, setMode] = useState<"active" | "deleted">("active");

    const notify = useNotifications((s) => s.addMessage);

    const formOpen = useUI((s) => s.formModalOpen);
    const closeForm = useUI((s) => s.closeFormModal);
    const openForm = useUI((s) => s.openFormModal);
    const formConfig = useUI((s) => s.formConfig);
    const formData = useUI((s) => s.formData);

    async function loadLocations() {
        if (!eventId) return;

        try {
            const url =
                mode === "active"
                    ? `locations/event/${eventId}`
                    : `locations/event/${eventId}/deleted`;

            const data = await apiGet(url);
            setLocations(data);
        } catch {
            notify({ type: "error", text: "Не удалось загрузить площадки" });
        }
    }

    useEffect(() => {
        loadLocations();
    }, [mode, eventId]);

    // Поиск
    const filtered = useMemo(() => {
        const s = search.toLowerCase();
        return locations.filter((e) =>
            e.name.toLowerCase().includes(s)
        );
    }, [search, locations]);

    return (
        <div className="space-y-6">
            <h1 className="text-h1 font-bold">Локации пло #{eventId}</h1>

            {/* SEARCH + MODE + ADD */}
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center">

                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" size={18} />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Поиск по локациям…"
                        className="w-full pl-10 pr-3 py-2 rounded-lg bg-surface dark:bg-dark-surface border"
                    />
                </div>

                <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as any)}
                    className="px-3 py-2 rounded-lg bg-surface dark:bg-dark-surface border"
                >
                    <option value="active">Активные</option>
                    <option value="deleted">Удалённые</option>
                </select>

                {mode === "active" && (
                    <button
                        onClick={() => openForm(locationForm, { event_id: eventId })}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                    >
                        <Plus size={18} />
                        Добавить локацию
                    </button>
                )}
            </div>

            {/* LIST */}
            {filtered.length === 0 ? (
                <p>Ничего не найдено</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((loc) => (
                        <LocationCard
                            key={loc.id}
                            location={loc}
                            onRefresh={loadLocations}
                            isDeleted={mode === "deleted"}
                        />
                    ))}
                </div>
            )}

            {formOpen && (
                <FormModal
                    config={formConfig}
                    initialData={formData}
                    onClose={closeForm}
                    onUpdated={loadLocations}
                />
            )}
        </div>
    );
}