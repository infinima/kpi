import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash,
  ArrowRight,
  RotateCcw,
  History,
  ListTree, Phone, Image
} from "lucide-react";

import { BaseImage } from "@/components/BaseImage";
import { useUI, useEventsNav, useNotifications, useUser } from "@/store";
import { apiDelete, apiPost } from "@/api";
import { locationForm } from "@/config/locationForm";
import { formatDate } from "@/helpers/formatDate";

interface Props {
    location: any;
    onRefresh: () => void;
    isDeleted?: boolean;
}

export function LocationCard({ location, onRefresh, isDeleted = false }: Props) {
    const [open, setOpen] = useState(false);

    const notify = useNotifications((s) => s.addMessage);
    const goLeagues = useEventsNav((s) => s.goLeagues);
    const openForm = useUI((s) => s.openFormModal);

    const { can, guest } = useUser();

  const {openPhotoModal} = useUI();
  const {goInLocations} = useEventsNav();

    // ---- ПРАВА ----
    const canUpdate = can("locations", "update", location.id);
    const canDelete = can("locations", "delete", location.id);
    const canRestore = can("locations", "restore", location.id);
    const canHistory = can("locations", "access_history", location.id);


    // ---- API ----
    async function handleDelete() {
        try {
            await apiDelete(`locations/${location.id}`, location.id);
            onRefresh();
        } catch {}
    }

    async function handleRestore() {
        try {
            await apiPost(`locations/${location.id}/restore`);
            notify({ type: "success", text: "Площадка восстановлена" });
            onRefresh();
        } catch {}
    }

    function handleHistoryView() {
      useUI.getState().openLogModal(location.id, "locations");
    }


    return (
        <div className="
            bg-surface dark:bg-dark-surface
            border border-border dark:border-dark-border
            rounded-xl shadow-card p-4 space-y-3
        "
             onClickCapture={() => goInLocations(location.id, location.name)}

        >
            <h2 className="text-xl font-semibold">{location.name}</h2>
            <p className="text-text-secondary dark:text-dark-text-secondary">
                Адрес: <b>{location.address}</b>
            </p>

          <button
            onClick={() => {openPhotoModal()}}
            className="
                                        w-full py-2 rounded-lg bg-surface dark:bg-dark-surface
                                        border border-border dark:border-dark-border
                                        hover:bg-hover dark:hover:bg-dark-hover
                                        flex items-center justify-center gap-2
                                    "
          >
            <Image size={16} /> Фотографии
          </button>

            {/* Переход к лигам */}
            {!isDeleted && (
                <button
                    onClick={() => goLeagues(location.id, location.name)}
                    className="
                        w-full py-2 rounded-lg flex items-center justify-center gap-2
                        border border-border dark:border-dark-border
                        hover:bg-hover dark:hover:bg-dark-hover
                    "
                >
                    Перейти к лигам
                    <ArrowRight size={16} />
                </button>
            )}




            {/* кнопка раскрытия */}
            {!guest && <button
                onClick={() => setOpen((v) => !v)}
                className="
                    w-full py-2 rounded-lg bg-primary text-white
                    flex items-center justify-center gap-2
                    hover:bg-primary-dark
                "
            >
                {open ? "Скрыть детали" : "Показать детали"}
                {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>}

            {open && (
                <div className="pt-3 border-t border-border dark:border-dark-border space-y-3 text-sm">

                    <p><b>ID:</b> {location.id}</p>
                    <p><b>ID мероприятия:</b> {location.event_id}</p>
                    <p><b>Создана:</b> {formatDate(location.created_at)}</p>
                    <p><b>Обновлена:</b> {formatDate(location.updated_at)}</p>
                    {isDeleted && (
                        <p><b>Удалена:</b> {formatDate(location.deleted_at)}</p>
                    )}

                    {/* кнопки действий */}
                    <div className="flex flex-col gap-2">

                        {/* --- Активные --- */}
                        {!isDeleted && (
                            <div className="flex gap-2">

                                {canUpdate && (
                                    <button
                                        onClick={() => openForm(locationForm, location)}
                                        className="
                                            flex-1 py-2 rounded-lg bg-primary text-white
                                            hover:bg-primary-dark flex items-center justify-center gap-2
                                        "
                                    >
                                        <Pencil size={16} /> Редактировать
                                    </button>
                                )}

                                {canDelete && (
                                    <button
                                        onClick={handleDelete}
                                        className="
                                            flex-1 py-2 rounded-lg bg-error text-white
                                            hover:bg-error/80 flex items-center justify-center gap-2
                                        "
                                    >
                                        <Trash size={16} /> Удалить
                                    </button>
                                )}
                            </div>
                        )}

                        {/* --- Удалённые --- */}
                        {isDeleted && canRestore && (
                            <button
                                onClick={handleRestore}
                                className="
                                    w-full py-2 rounded-lg bg-success text-white
                                    hover:bg-success/80 flex items-center justify-center gap-2
                                "
                            >
                                <RotateCcw size={16} /> Восстановить
                            </button>
                        )}

                        {/* --- История и журнал --- */}
                        {canHistory && (
                                <button
                                    onClick={handleHistoryView}
                                    className="
                                        w-full py-2 rounded-lg bg-surface dark:bg-dark-surface
                                        border border-border dark:border-dark-border
                                        hover:bg-hover dark:hover:bg-dark-hover
                                        flex items-center justify-center gap-2
                                    "
                                >
                                    <History size={16} /> История изменений
                                </button>
                        )}


                    </div>
                </div>
            )}
        </div>
    );
}