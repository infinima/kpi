import { useState } from "react";
import {
    ChevronDown, ChevronUp, Pencil, Trash, ArrowRight, RotateCcw
} from "lucide-react";

import { BaseImage } from "@/components/BaseImage";
import { useUI, useEventsNav, useNotifications } from "@/store";
import {apiDelete, apiPost} from "@/api";
import { locationForm } from "@/config/locationForm";
import { formatDate } from "@/helpers/formatDate";
import {eventForm} from "@/config/eventForm";

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

    async function handleDelete() {
        try {
            await apiDelete(`locations/${location.id}`, location.id);
            onRefresh();
        } catch {}
    }

    async function handleRestore() {
        try {
            await apiPost(`locations/${location.id}/restore`);
            notify({ type: "success", text: "Площадка восстановлено" });
            onRefresh();
        } catch {}
    }

    return (
        <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-xl shadow-card p-4 space-y-3">


    <h2 className="text-xl font-semibold">{location.name}</h2>
        <p className="text-text -secondary">Адрес: <b>{location.address}</b></p>

    {/* переход */}{!isDeleted &&
            <button
                className="w-full py-2 rounded-lg border border-border dark:border-dark-border flex items-center justify-center gap-2 hover:bg-hover dark:hover:bg-dark-hover"
                onClick={() => goLeagues(location.id, location.name)}
            >
                Перейти к лигам
                <ArrowRight size={16} />
            </button>
    }


    {/* раскрытие */}
    <button
        onClick={() => setOpen((v) => !v)}
    className="w-full py-2 rounded-lg bg-primary text-white flex items-center justify-center gap-2                             hover:bg-primary-dark
"
        >
        {open ? "Скрыть детали" : "Показать детали"}
    {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
    </button>

    {open && (
        <div className="pt-3 border-t space-y-2 text-sm">
            <p><b>ID:</b> {location.id}</p>
            <p><b>ID мероприятия:</b> {location.event_id}</p>
    <p><b>Создана:</b> {formatDate(location.created_at)}</p>
            <p><b>Обновлена:</b> {formatDate(location.updated_at)}</p>
            {isDeleted && <p><b>Удалена:</b> {formatDate(location.deleted_at)}</p>}

            <div className="flex gap-2">

            {!isDeleted ? (
                <>
                    {/* РЕДАКТИРОВАТЬ */}
                    <button
                        className="flex-1 py-2 rounded-lg bg-primary text-white flex items-center justify-center gap-2 hover:bg-primary-dark"
                        onClick={() => openForm(locationForm, location)}
                    >
                        <Pencil size={16} /> Редактировать
                    </button>

                    <button
                        className="flex-1 py-2 rounded-lg bg-error text-white flex items-center justify-center gap-2 hover:bg-error/80"
                        onClick={handleDelete}
                    >
                        <Trash size={16} /> Удалить
                    </button>
                </>
            ) : (
                <>
                    {/* ВОССТАНОВИТЬ */}
                    <button
                        onClick={handleRestore}
                        className="
                                        flex-1 py-2 rounded-lg bg-success text-white hover:bg-success/80
                                        flex items-center justify-center gap-2
                                    "
                    >
                        <RotateCcw size={16} /> Восстановить
                    </button>
                </>
            )}
                </div>

    </div>
    )}
    </div>
);
}