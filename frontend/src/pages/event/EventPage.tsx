import { useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/api";
import { BaseImage } from "@/components/BaseImage";
import { EntityTable } from "@/components/ui/table/EntityTable";
import type { EntityTableRowData } from "@/components/ui/table/EntityTableRow";
import { eventEntityColumns, mapEventEntityRows } from "@/pages/event/entityTableConfigs";
import { useUser } from "@/store";
import { canUseTableMode, getCollectionViewMode } from "@/pages/event/viewMode";

type EventItem = {
    id: number;
    name: string;
    date: string;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
};

export function EventsPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { eventId } = useParams();
    const { can, user } = useUser();
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [visibility, setVisibility] = useState<"active" | "deleted">("active");

    const rows = useMemo(() => mapEventEntityRows(events), [events]);
    const canManage = canUseTableMode(user?.rights, "events") && visibility === "active";
    const canSeeDeleted = Boolean(user?.rights.events?.global?.includes("restore"));
    const viewMode = getCollectionViewMode(searchParams, "events", canManage);
    const effectiveVisibility = viewMode === "table" ? visibility : "active";
    const visibilityFilter = (
        <select
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as "active" | "deleted")}
            className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text-main)] outline-none"
        >
            <option value="active">Существующие</option>
            {canSeeDeleted ? <option value="deleted">Удалённые</option> : null}
        </select>
    );

    useEffect(() => {
        let ignore = false;

        async function load() {
            try {
                setLoading(true);
                const data = await apiGet<EventItem[]>(
                    effectiveVisibility === "deleted" ? "events/deleted" : "events"
                );
                if (!ignore) {
                    setEvents(data);
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        }

        void load();
        return () => {
            ignore = true;
        };
    }, [effectiveVisibility]);

    async function handleUpdate(updatedRow: EntityTableRowData) {
        await apiPatch(`events/${updatedRow.id}`, {
            name: updatedRow.name,
            date: updatedRow.date,
        }, {
            success: "Мероприятие обновлено",
            error: true,
        });

        setEvents((prev) =>
            prev.map((event) =>
                String(event.id) === String(updatedRow.id)
                    ? { ...event, name: String(updatedRow.name ?? ""), date: String(updatedRow.date ?? "") }
                    : event
            )
        );
    }

    async function handleDelete(row: EntityTableRowData) {
        await apiDelete(`events/${row.id}`, Number(row.id));
        setEvents((prev) => prev.filter((event) => String(event.id) !== String(row.id)));

        if (String(eventId) === String(row.id)) {
            navigate("/events");
        }
    }

    async function handleRestore(row: EntityTableRowData) {
        await apiPost(`events/${row.id}/restore`, undefined, {
            success: "Мероприятие восстановлено",
            error: true,
        });
        setEvents((prev) => prev.filter((event) => String(event.id) !== String(row.id)));
    }

    return (
        <section className="space-y-6">
            <div>
                <div className="text-3xl font-semibold tracking-tight text-[var(--color-text-main)]">
                    Мероприятия
                </div>
            </div>

            {loading ? (
                <div className="rounded-[28px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.84)] px-6 py-8 text-sm text-[var(--color-text-secondary)]">
                    Загрузка...
                </div>
            ) : viewMode === "table" ? (
                <EntityTable
                    columns={eventEntityColumns}
                    data={rows}
                    onUpdate={canManage ? handleUpdate : undefined}
                    onDelete={canManage ? handleDelete : undefined}
                    onRestore={effectiveVisibility === "deleted" ? handleRestore : undefined}
                    onRowClick={(row) => navigate({ pathname: `/events/${row.id}`, search: location.search })}
                    toolbarContent={visibilityFilter}
                    actionsWidth={136}
                />
            ) : (
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                        {events.map((event) => {
                            const selected = String(event.id) === String(eventId);

                            return (
                                <button
                                    key={event.id}
                                    type="button"
                                    onClick={() => navigate({ pathname: `/events/${event.id}`, search: location.search })}
                                    className={`
                                        rounded-[28px] border p-5 text-left transition
                                        ${selected
                                            ? "border-[var(--color-primary)] bg-[rgba(14,116,144,0.08)]"
                                            : "border-[var(--color-border)] bg-[rgba(255,255,255,0.84)] hover:border-[var(--color-primary-light)]"}
                                    `}
                                >
                                    <div className="mb-4 overflow-hidden rounded-[22px] border border-[var(--color-border)]">
                                        <BaseImage
                                            path={`events/${event.id}/photo`}
                                            alt={event.name}
                                            className="aspect-[16/9] w-full object-cover"
                                            fallbackLetter="E"
                                        />
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(99,102,241,0.12)] text-[var(--color-primary)]">
                                            <CalendarDays size={20} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-lg font-semibold text-[var(--color-text-main)]">
                                                {event.name}
                                            </div>
                                            <div className="mt-2 text-sm text-[var(--color-text-secondary)]">
                                                Дата: {new Date(event.date).toLocaleDateString("ru-RU")}
                                            </div>
                                            <div className="mt-1 text-sm text-[var(--color-text-muted)]">
                                                ID: {event.id}
                                            </div>
                                            {event.deleted_at ? (
                                                <div className="mt-1 text-sm text-[var(--color-error)]">
                                                    Удалено: {new Date(event.deleted_at).toLocaleString("ru-RU")}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                </div>
            )}
        </section>
    );
}
