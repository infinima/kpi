import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, ImagePlus, Trash2 } from "lucide-react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/api";
import { BaseImage } from "@/components/BaseImage";
import { EventCard } from "@/components/ui/cards/EventCard";
import { EntityTable } from "@/components/ui/table/EntityTable";
import type { EntityTableColumn, EntityTableRowData } from "@/components/ui/table/EntityTableRow";
import { eventEntityColumns, mapEventEntityRows } from "@/pages/event/entityTableConfigs";
import { useModalStore, useUser } from "@/store";
import { pickImageFile } from "@/utils/pickImageFile";
import { canUseTableMode, getCollectionViewMode } from "@/pages/event/viewMode";

type EventItem = {
    id: number;
    name: string;
    date: string;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
};

const DEFAULT_EVENT_PHOTO =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9p2RAi8AAAAASUVORK5CYII=";

export function EventsPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { eventId } = useParams();
    const { can, user } = useUser();
    const openModal = useModalStore((state) => state.openModal);
    const [events, setEvents] = useState<EventItem[]>([]);
    const [photoVersion, setPhotoVersion] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(true);
    const [visibility, setVisibility] = useState<"active" | "deleted">("active");

    const canUseTable = canUseTableMode(user?.rights, "events");
    const canManage = canUseTable && visibility === "active";
    const canSeeDeleted = Boolean(user?.rights.events?.global?.includes("restore"));
    const viewMode = getCollectionViewMode(searchParams, "events", canUseTable);
    const effectiveVisibility = viewMode === "table" ? visibility : "active";
    const visibilityFilter = (
        canSeeDeleted ? (
            <button
                type="button"
                onClick={() => setVisibility((prev) => prev === "active" ? "deleted" : "active")}
                aria-label={visibility === "active" ? "Показать удалённые" : "Показать существующие"}
                title={visibility === "active" ? "Показать удалённые" : "Показать существующие"}
                className={`inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[rgba(255,255,255,0.72)] p-2 leading-none transition ${
                    visibility === "active"
                        ? "text-[var(--color-text-secondary)] hover:border-[var(--color-primary-light)] hover:bg-[rgba(255,255,255,0.95)] hover:text-[var(--color-text-main)]"
                        : "border-[var(--color-primary-light)] bg-[rgba(14,116,144,0.12)] text-[var(--color-primary)]"
                }`}
            >
                {visibility === "active" ? <FileText size={16} /> : <Trash2 size={16} />}
            </button>
        ) : null
    );

    function handlePhotoChange(eventRowId: number, file: File) {
        openModal("crop", {
            file,
            title: "Фото мероприятия",
            confirmLabel: "Сохранить фото",
            onCrop: async (photo) => {
                await apiPatch(`events/${eventRowId}`, { photo }, {
                    success: "Фото мероприятия обновлено",
                    error: true,
                });
                setPhotoVersion((prev) => ({ ...prev, [eventRowId]: Date.now() }));
            },
        });
    }

    function handlePhotoDraftPick(setValue: (value: string | number | null | undefined) => void, file: File) {
        openModal("crop", {
            file,
            title: "Фото мероприятия",
            confirmLabel: "Использовать фото",
            onCrop: async (photo) => {
                setValue(photo);
            },
        });
    }

    const columns = useMemo<EntityTableColumn[]>(() => [
        {
            key: "photo",
            label: "Фото",
            width: 0.72,
            editable: false,
            searchable: false,
            sortable: false,
            renderEditor: ({ value, setValue, isCreating }) => {
                if (!isCreating) {
                    return <div className="h-12 w-12" />;
                }

                const preview = typeof value === "string" ? value : "";

                return (
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            pickImageFile((file) => handlePhotoDraftPick(setValue, file));
                        }}
                        className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-[var(--color-border)] bg-[rgba(248,250,252,0.9)] transition hover:border-[var(--color-primary-light)] hover:bg-white"
                        title={preview ? "Изменить фото" : "Добавить фото"}
                        aria-label={preview ? "Изменить фото" : "Добавить фото"}
                    >
                        {preview ? (
                            <img src={preview} alt="Фото" className="h-full w-full object-cover" />
                        ) : (
                            <ImagePlus size={14} className="text-[var(--color-text-secondary)]" />
                        )}
                    </button>
                );
            },
            renderCell: (row) => {
                const eventRowId = Number(row.id);

                return (
                    <div className="flex items-center">
                        <div className="h-12 w-16 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[rgba(248,250,252,0.9)]">
                            {canManage ? (
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        pickImageFile((file) => handlePhotoChange(eventRowId, file));
                                    }}
                                    className="block h-full w-full transition hover:opacity-90"
                                    title="Изменить фото"
                                    aria-label="Изменить фото"
                                >
                                    <BaseImage
                                        path={`events/${eventRowId}/photo?ts=${photoVersion[eventRowId] ?? 0}`}
                                        alt={String(row.name ?? "Фото")}
                                        className="h-full w-full object-cover"
                                        fallbackLetter="E"
                                    />
                                </button>
                            ) : (
                                <BaseImage
                                    path={`events/${eventRowId}/photo?ts=${photoVersion[eventRowId] ?? 0}`}
                                    alt={String(row.name ?? "Фото")}
                                    className="h-full w-full object-cover"
                                    fallbackLetter="E"
                                />
                            )}
                        </div>
                    </div>
                );
            },
        },
        ...eventEntityColumns,
    ], [canManage, photoVersion]);

    const rows = useMemo(() => mapEventEntityRows(events), [events]);

    const loadEvents = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiGet<EventItem[]>(
                effectiveVisibility === "deleted" ? "events/deleted" : "events"
            );
            setEvents(data);
        } finally {
            setLoading(false);
        }
    }, [effectiveVisibility]);

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
        await loadEvents();

        if (String(eventId) === String(row.id)) {
            navigate("/events");
        }
    }

    async function handleRestore(row: EntityTableRowData) {
        await apiPost(`events/${row.id}/restore`, undefined, {
            success: "Мероприятие восстановлено",
            error: true,
        });
        await loadEvents();
    }

    async function handleCreate(newRow: EntityTableRowData) {
        const response = await apiPost<{ id: number }>("events", {
            name: String(newRow.name ?? ""),
            date: String(newRow.date ?? ""),
            photo: typeof newRow.photo === "string" && newRow.photo ? newRow.photo : DEFAULT_EVENT_PHOTO,
        }, {
            success: "Мероприятие создано",
            error: true,
        });

        setEvents((prev) => [
            ...prev,
            {
                id: response.id,
                name: String(newRow.name ?? ""),
                date: String(newRow.date ?? ""),
            },
        ]);
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
                    columns={columns}
                    data={rows}
                    onCreate={canManage ? handleCreate : undefined}
                    onUpdate={canManage ? handleUpdate : undefined}
                    onDelete={canManage ? handleDelete : undefined}
                    onRestore={effectiveVisibility === "deleted" ? handleRestore : undefined}
                    onRowClick={(row) => navigate({ pathname: `/events/${row.id}`, search: location.search })}
                    toolbarContent={visibilityFilter}
                    actionsWidth={176}
                />
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {events.map((event) => (
                            <EventCard
                                key={event.id}
                                id={event.id}
                                name={event.name}
                                date={event.date}
                                deleted_at={event.deleted_at}
                                selected={String(event.id) === String(eventId)}
                                onClick={() => navigate({ pathname: `/events/${event.id}`, search: location.search })}
                            />
                        ))}
                </div>
            )}
        </section>
    );
}
