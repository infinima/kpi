import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Trash2 } from "lucide-react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/api";
import { BaseImage } from "@/components/BaseImage";
import { LocationCard } from "@/components/ui/cards/LocationCard";
import { EntityTable } from "@/components/ui/table/EntityTable";
import type { EntityTableRowData } from "@/components/ui/table/EntityTableRow";
import { locationEntityColumns, mapLocationEntityRows } from "@/pages/event/entityTableConfigs";
import { useModalStore, useUser } from "@/store";
import { canUseTableMode, getCollectionViewMode } from "@/pages/event/viewMode";

type LocationItem = {
    id: number;
    event_id: number;
    name: string;
    address: string;
    photo_album_url?: string | null;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
};

type PhotoItem = {
    id: number;
    location_id: number;
    created_at: string;
};

export function LocationsPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { eventId, locationId } = useParams();
    const { user, can } = useUser();
    const isPhotosMode = location.pathname.endsWith("/photos");

    const [locations, setLocations] = useState<LocationItem[]>([]);
    const [photos, setPhotos] = useState<PhotoItem[]>([]);
    const [locationPhotos, setLocationPhotos] = useState<Record<number, number | null>>({});
    const [loading, setLoading] = useState(true);
    const [visibility, setVisibility] = useState<"active" | "deleted">("active");
    const canUseTable = canUseTableMode(user?.rights, "locations");
    const canManage = canUseTable && visibility === "active";
    const eventScopeId = eventId ? Number(eventId) : null;
    const canSeeDeleted = can("locations", "restore", { eventId: eventScopeId });
    const viewMode = getCollectionViewMode(searchParams, "locations", canUseTable);
    const effectiveVisibility = viewMode === "table" ? visibility : "active";

    useEffect(() => {
        let ignore = false;

        async function loadLocations() {
            if (!eventId) return;

            try {
                setLoading(true);
                const data = await apiGet<LocationItem[]>(
                    effectiveVisibility === "deleted"
                        ? `locations/event/${eventId}/deleted`
                        : `locations/event/${eventId}`
                );
                if (!ignore) {
                    setLocations(data);
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        }

        async function loadPhotos() {
            if (!locationId) return;

            try {
                setLoading(true);
                const data = await apiGet<PhotoItem[]>(`photos/location/${locationId}`);
                if (!ignore) {
                    setPhotos(data);
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        }

        if (isPhotosMode) {
            void loadPhotos();
        } else {
            void loadLocations();
        }

        return () => {
            ignore = true;
        };
    }, [effectiveVisibility, eventId, isPhotosMode, locationId]);

    const loadLocations = useCallback(async () => {
        if (!eventId) {
            setLocations([]);
            return;
        }

        setLoading(true);
        try {
            const data = await apiGet<LocationItem[]>(
                effectiveVisibility === "deleted"
                    ? `locations/event/${eventId}/deleted`
                    : `locations/event/${eventId}`
            );
            setLocations(data);
        } finally {
            setLoading(false);
        }
    }, [effectiveVisibility, eventId]);

    useEffect(() => {
        let ignore = false;

        async function loadLocationPhotos() {
            if (isPhotosMode || locations.length === 0) {
                setLocationPhotos({});
                return;
            }

            const entries = await Promise.all(
                locations.map(async (item) => {
                    try {
                        const photoRows = await apiGet<PhotoItem[]>(`photos/location/${item.id}`);
                        return [item.id, photoRows[0]?.id ?? null] as const;
                    } catch {
                        return [item.id, null] as const;
                    }
                })
            );

            if (!ignore) {
                setLocationPhotos(Object.fromEntries(entries));
            }
        }

        void loadLocationPhotos();
        return () => {
            ignore = true;
        };
    }, [isPhotosMode, locations]);

    const rows = useMemo(() => mapLocationEntityRows(locations), [locations]);
    const columns = locationEntityColumns;
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

    async function handleUpdate(updatedRow: EntityTableRowData) {
        await apiPatch(`locations/${updatedRow.id}`, {
            name: updatedRow.name,
            address: updatedRow.address,
            photo_album_url: String(updatedRow.photo_album_url ?? "").trim() || null,
        }, {
            success: "Площадка обновлена",
            error: true,
        });

        setLocations((prev) =>
            prev.map((location) =>
                String(location.id) === String(updatedRow.id)
                    ? {
                        ...location,
                        name: String(updatedRow.name ?? ""),
                        address: String(updatedRow.address ?? ""),
                        photo_album_url: String(updatedRow.photo_album_url ?? "").trim() || null,
                    }
                    : location
            )
        );
    }

    async function handleDelete(row: EntityTableRowData) {
        await apiDelete(`locations/${row.id}`, Number(row.id));
        await loadLocations();

        if (String(locationId) === String(row.id)) {
            navigate(`/events/${eventId}/location`);
        }
    }

    async function handleRestore(row: EntityTableRowData) {
        await apiPost(`locations/${row.id}/restore`, undefined, {
            success: "Площадка восстановлена",
            error: true,
        });
        await loadLocations();
    }

    async function handleCreate(newRow: EntityTableRowData) {
        if (!eventId) {
            return;
        }

        const response = await apiPost<{ id: number }>("locations", {
            event_id: Number(eventId),
            name: newRow.name,
            address: newRow.address,
            photo_album_url: String(newRow.photo_album_url ?? "").trim() || null,
        }, {
            success: "Площадка создана",
            error: true,
        });

        setLocations((prev) => [
            ...prev,
            {
                id: response.id,
                event_id: Number(eventId),
                name: String(newRow.name ?? ""),
                address: String(newRow.address ?? ""),
                photo_album_url: String(newRow.photo_album_url ?? "").trim() || null,
            },
        ]);
    }

    if (isPhotosMode && locationId) {
        return (
            <section className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="text-3xl font-semibold tracking-tight text-[var(--color-text-main)]">
                            Фотографии площадки
                        </div>
                        <div className="mt-2 text-sm text-[var(--color-text-secondary)]">
                            Галерея фотографий для выбранной площадки.
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="rounded-[28px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.84)] px-6 py-8 text-sm text-[var(--color-text-secondary)]">
                        Загрузка...
                    </div>
                ) : photos.length === 0 ? (
                    <div className="rounded-[28px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.84)] px-6 py-8 text-sm text-[var(--color-text-secondary)]">
                        Фотографий пока нет.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        {photos.map((photo) => (
                            <div
                                key={photo.id}
                                className="overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.84)] p-3"
                            >
                                <BaseImage
                                    path={`photos/${photo.id}/file`}
                                    alt={`Фото ${photo.id}`}
                                    className="aspect-[4/3] w-full rounded-[22px] object-cover"
                                    fallbackLetter="P"
                                />
                                <div className="px-2 pb-2 pt-4 text-sm text-[var(--color-text-secondary)]">
                                    Добавлено {new Date(photo.created_at).toLocaleDateString("ru-RU")}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        );
    }

    return (
        <section className="space-y-6">
            <div>
                <div className="text-3xl font-semibold tracking-tight text-[var(--color-text-main)]">
                    Площадки
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
                    onRowClick={(row) => navigate({ pathname: `/events/${eventId}/location/${row.id}`, search: location.search })}
                    toolbarContent={visibilityFilter}
                    actionsWidth={176}
                />
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {locations.map((item) => (
                        <LocationCard
                            key={item.id}
                            id={item.id}
                            name={item.name}
                            address={item.address}
                            photoAlbumUrl={item.photo_album_url}
                            deleted_at={item.deleted_at}
                            selected={String(item.id) === String(locationId)}
                            onClick={() => navigate({ pathname: `/events/${eventId}/location/${item.id}`, search: location.search })}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
