import { useEffect, useMemo, useState } from "react";
import { FileText, ImagePlus, Trash2 } from "lucide-react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/api";
import { BaseImage } from "@/components/BaseImage";
import { LocationCard } from "@/components/ui/cards/LocationCard";
import { EntityTable } from "@/components/ui/table/EntityTable";
import type { EntityTableColumn, EntityTableRowData } from "@/components/ui/table/EntityTableRow";
import { locationEntityColumns, mapLocationEntityRows } from "@/pages/event/entityTableConfigs";
import { useModalStore, useUser } from "@/store";
import { pickImageFile } from "@/utils/pickImageFile";
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
    const { user, can } = useUser();
    const openModal = useModalStore((state) => state.openModal);
    const isPhotosMode = location.pathname.endsWith("/photos");

    const [locations, setLocations] = useState<LocationItem[]>([]);
    const [photos, setPhotos] = useState<PhotoItem[]>([]);
    const [locationPhotos, setLocationPhotos] = useState<Record<number, number | null>>({});
    const [loading, setLoading] = useState(true);
    const [visibility, setVisibility] = useState<"active" | "deleted">("active");
    const canUseTable = canUseTableMode(user?.rights, "locations");
    const canManage = canUseTable && visibility === "active";
    const canSeeDeleted = Boolean(user?.rights.locations?.global?.includes("restore"));
    const viewMode = getCollectionViewMode(searchParams, "locations", canUseTable);
    const effectiveVisibility = viewMode === "table" ? visibility : "active";

    function handlePhotoChange(rowId: number, file: File) {
        openModal("crop", {
            file,
            title: "Фото площадки",
            confirmLabel: "Добавить фото",
            onCrop: async (photo) => {
                await apiPost("photos", {
                    location_id: rowId,
                    file: photo,
                }, {
                    success: "Фото площадки добавлено",
                    error: true,
                });
                const refreshedPhotos = await apiGet<PhotoItem[]>(`photos/location/${rowId}`);
                setLocationPhotos((prev) => ({ ...prev, [rowId]: refreshedPhotos[0]?.id ?? null }));
            },
        });
    }

    function handlePhotoDraftPick(setValue: (value: string | number | null | undefined) => void, file: File) {
        openModal("crop", {
            file,
            title: "Фото площадки",
            confirmLabel: "Использовать фото",
            onCrop: async (photo) => {
                setValue(photo);
            },
        });
    }

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
                const rowId = Number(row.id);
                const photoId = locationPhotos[rowId];

                return (
                    <div className="flex items-center">
                        <div className="h-12 w-16 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[rgba(248,250,252,0.9)]">
                            {photoId ? (
                                canManage ? (
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            pickImageFile((file) => handlePhotoChange(rowId, file));
                                        }}
                                        className="block h-full w-full transition hover:opacity-90"
                                        title="Изменить фото"
                                        aria-label="Изменить фото"
                                    >
                                        <BaseImage
                                            path={`photos/${photoId}/preview`}
                                            alt={String(row.name ?? "Фото")}
                                            className="h-full w-full object-cover"
                                            fallbackLetter="L"
                                        />
                                    </button>
                                ) : (
                                    <BaseImage
                                        path={`photos/${photoId}/preview`}
                                        alt={String(row.name ?? "Фото")}
                                        className="h-full w-full object-cover"
                                        fallbackLetter="L"
                                    />
                                )
                            ) : (
                                canManage ? (
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            pickImageFile((file) => handlePhotoChange(rowId, file));
                                        }}
                                        className="flex h-full w-full items-center justify-center text-xs text-[var(--color-text-muted)] transition hover:bg-[rgba(255,255,255,0.55)]"
                                        title="Добавить фото"
                                        aria-label="Добавить фото"
                                    >
                                        Нет
                                    </button>
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-xs text-[var(--color-text-muted)]">
                                        Нет
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                );
            },
        },
        ...locationEntityColumns,
    ], [canManage, locationPhotos]);
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

        if (typeof newRow.photo === "string" && newRow.photo) {
            await apiPost("photos", {
                location_id: response.id,
                file: newRow.photo,
            }, {
                success: "Фото площадки добавлено",
                error: true,
            });

            const refreshedPhotos = await apiGet<PhotoItem[]>(`photos/location/${response.id}`);
            setLocationPhotos((prev) => ({ ...prev, [response.id]: refreshedPhotos[0]?.id ?? null }));
        }
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
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                    {locations.map((item) => (
                        <LocationCard
                            key={item.id}
                            id={item.id}
                            name={item.name}
                            address={item.address}
                            deleted_at={item.deleted_at}
                            selected={String(item.id) === String(locationId)}
                            photoId={locationPhotos[item.id] ?? null}
                            onClick={() => navigate({ pathname: `/events/${eventId}/location/${item.id}`, search: location.search })}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
