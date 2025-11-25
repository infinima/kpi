import { useEffect, useState, useMemo } from "react";
import { apiGet } from "@/api";
import { Search, Plus } from "lucide-react";
import { useEventsNav, useUI, useNotifications } from "@/store";

import { EventCard } from "@/components/event/EventCard";
import { FormModal } from "@/components/layout/FormModal";
import { eventForm } from "@/config/eventForm";

interface EventItem {
    id: number;
    name: string;
    date: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export function EventsPage() {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [search, setSearch] = useState("");
    const [mode, setMode] = useState<"active" | "deleted">("active");
    const [dateFilter, setDateFilter] = useState<"all" | "future" | "past">("all");

    const notify = useNotifications((s) => s.addMessage);

    const formOpen = useUI((s) => s.formModalOpen);
    const closeForm = useUI((s) => s.closeFormModal);
    const openForm = useUI((s) => s.openFormModal);
    const formConfig = useUI((s) => s.formConfig);
    const formData = useUI((s) => s.formData);

    async function loadEvents() {
        try {
            const url = mode === "active" ? "events" : "events/deleted";
            const data = await apiGet(url);
            setEvents(data);
        } catch {
            notify({ type: "error", text: "Не удалось загрузить мероприятия" });
        }
    }

    useEffect(() => {
        loadEvents();
    }, [mode]);

    // 🔍 Фильтр по тексту
    const filteredBySearch = useMemo(() => {
        const s = search.toLowerCase();
        return events.filter((e) =>
            e.name.toLowerCase().includes(s)
        );
    }, [search, events]);

    // 🟦 Фильтр по дате (Только для активных!)
    const filteredByDate = useMemo(() => {
        if (mode === "deleted") return filteredBySearch; // НЕ фильтруем по дате

        const now = new Date().getTime();

        return filteredBySearch.filter((e) => {
            const t = new Date(e.date).getTime();

            if (dateFilter === "future") return t >= now;
            if (dateFilter === "past") return t < now;

            return true; // all
        });
    }, [filteredBySearch, dateFilter, mode]);

    // 🔥 сортировка — всегда новые сверху
    const sorted = useMemo(() => {
        return [...filteredByDate].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }, [filteredByDate]);


    return (
        <div className="space-y-6">
            <h1 className="text-h1 font-bold">Мероприятия</h1>

            {/* ➤ Фильтры и поиск */}
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center">

                {/* поиск */}
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" size={18} />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Поиск по мероприятиям…"
                        className="
                            w-full pl-10 pr-3 py-2 rounded-lg
                            bg-surface dark:bg-dark-surface
                            border border-border dark:border-dark-border
                        "
                    />
                </div>

                {/* тип: активные / удалённые */}
                <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as any)}
                    className="
                        px-3 py-2 rounded-lg
                        bg-surface dark:bg-dark-surface
                        border border-border dark:border-dark-border
                    "
                >
                    <option value="active">Активные</option>
                    <option value="deleted">Удалённые</option>
                </select>

                {/* фильтр по дате — только если active */}
                {mode === "active" && (
                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value as any)}
                        className="
                            px-3 py-2 rounded-lg
                            bg-surface dark:bg-dark-surface
                            border border-border dark:border-dark-border
                        "
                    >
                        <option value="all">Все</option>
                        <option value="future">Будущие</option>
                        <option value="past">Прошедшие</option>
                    </select>
                )}

                {/* добавить */}
                {mode === "active" && (
                    <button
                        onClick={() => openForm(eventForm, null)}
                        className="
                            flex items-center gap-2 px-4 py-2
                            bg-primary text-white rounded-lg
                            hover:bg-primary-dark
                        "
                    >
                        <Plus size={18} />
                        Добавить мероприятие
                    </button>
                )}
            </div>

            {/* LIST */}
            {sorted.length === 0 ? (
                <p>Ничего не найдено</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sorted.map((ev) => (
                        <EventCard
                            key={ev.id}
                            event={ev}
                            onRefresh={loadEvents}
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
                    onUpdated={loadEvents}
                />
            )}
        </div>
    );
}