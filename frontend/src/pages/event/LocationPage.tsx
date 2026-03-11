import { useEffect, useMemo, useState } from "react";
import { Camera, MapPin } from "lucide-react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/api";
import { BaseImage } from "@/components/BaseImage";
import { EntityTable } from "@/components/ui/table/EntityTable";
import type { EntityTableRowData } from "@/components/ui/table/EntityTableRow";
import { locationEntityColumns, mapLocationEntityRows } from "@/pages/event/entityTableConfigs";
import { useUser } from "@/store";
import { canUseTableMode, getCollectionViewMode } from "@/pages/event/viewMode";

type LocationItem = {
    id: number;
    event_id: number;
    name: string;
    address: string;
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
    const { user } = useUser();
    const isPhotosMode = location.pathname.endsWith("/photos");

    const [locations, setLocations] = useState<LocationItem[]>([]);
    const [photos, setPhotos] = useState<PhotoItem[]>([]);
    const [locationPhotos, setLocationPhotos] = useState<Record<number, number | null>>({});
    const [loading, setLoading] = useState(true);
    const [visibility, setVisibility] = useState<"active" | "deleted">("active");

    useEffect(() => {
        let ignore = false;

        async function loadLocations() {
            if (!eventId) return;

            try {
                setLoading(true);
                const data = await apiGet<LocationItem[]>(
                    visibility === "deleted"
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
    }, [eventId, isPhotosMode, locationId, visibility]);

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
    const canManage = canUseTableMode(user?.rights, "locations") && visibility === "active";
    const canSeeDeleted = Boolean(user?.rights.locations?.global?.includes("restore"));
    const viewMode = getCollectionViewMode(searchParams, "locations", canManage);
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

    async function handleUpdate(updatedRow: EntityTableRowData) {
        await apiPatch(`locations/${updatedRow.id}`, {
            name: updatedRow.name,
            address: updatedRow.address,
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
                    }
                    : location
            )
        );
    }

    async function handleDelete(row: EntityTableRowData) {
        await apiDelete(`locations/${row.id}`, Number(row.id));
        setLocations((prev) => prev.filter((location) => String(location.id) !== String(row.id)));

        if (String(locationId) === String(row.id)) {
            navigate(`/events/${eventId}/location`);
        }
    }

    async function handleRestore(row: EntityTableRowData) {
        await apiPost(`locations/${row.id}/restore`, undefined, {
            success: "Площадка восстановлена",
            error: true,
        });
        setLocations((prev) => prev.filter((location) => String(location.id) !== String(row.id)));
    }

    async function handleCreate(newRow: EntityTableRowData) {
        if (!eventId) {
            return;
        }

        const response = await apiPost<{ id: number }>("locations", {
            event_id: Number(eventId),
            name: newRow.name,
            address: newRow.address,
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
                    columns={locationEntityColumns}
                    data={rows}
                    onCreate={canManage ? handleCreate : undefined}
                    onUpdate={canManage ? handleUpdate : undefined}
                    onDelete={canManage ? handleDelete : undefined}
                    onRestore={visibility === "deleted" ? handleRestore : undefined}
                    onRowClick={(row) => navigate({ pathname: `/events/${eventId}/location/${row.id}`, search: location.search })}
                    toolbarContent={visibilityFilter}
                    actionsWidth={136}
                />
            ) : (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        {visibilityFilter}
                    </div>
                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                        {locations.map((item) => {
                            const selected = String(item.id) === String(locationId);

                            return (
                                <div
                                    key={item.id}
                                    className={`
                                        rounded-[28px] border p-5 transition
                                        ${selected
                                            ? "border-[var(--color-primary)] bg-[rgba(14,116,144,0.08)]"
                                            : "border-[var(--color-border)] bg-[rgba(255,255,255,0.84)]"}
                                    `}
                                >
                                    <div className="mb-4 overflow-hidden rounded-[22px] border border-[var(--color-border)]">
                                        {locationPhotos[item.id] ? (
                                            <BaseImage
                                                path={`photos/${locationPhotos[item.id]}/file`}
                                                alt={item.name}
                                                className="aspect-[16/9] w-full object-cover"
                                                fallbackLetter="L"
                                            />
                                        ) : (
                                            <div className="flex aspect-[16/9] items-center justify-center bg-[rgba(148,163,184,0.12)] text-[var(--color-text-muted)]">
                                                Нет фото
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => navigate({ pathname: `/events/${eventId}/location/${item.id}`, search: location.search })}
                                        className="w-full text-left"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(59,130,246,0.12)] text-[var(--color-info)]">
                                                <MapPin size={20} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate text-lg font-semibold text-[var(--color-text-main)]">
                                                    {item.name}
                                                </div>
                                                <div className="mt-2 text-sm text-[var(--color-text-secondary)]">
                                                    {item.address}
                                                </div>
                                                <div className="mt-1 text-sm text-[var(--color-text-muted)]">
                                                    ID: {item.id}
                                                </div>
                                                {item.deleted_at ? (
                                                    <div className="mt-1 text-sm text-[var(--color-error)]">
                                                        Удалено: {new Date(item.deleted_at).toLocaleString("ru-RU")}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => navigate({ pathname: `/events/${eventId}/location/${item.id}/photos`, search: location.search })}
                                        className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text-main)] transition hover:border-[var(--color-primary-light)] hover:bg-[var(--color-hover)]"
                                    >
                                        <Camera size={16} />
                                        Фото
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </section>
    );
}
