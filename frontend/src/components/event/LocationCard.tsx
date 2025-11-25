import { useState } from "react";
import {
    ChevronDown, ChevronUp, Pencil, Trash, ArrowRight
} from "lucide-react";

import { Image } from "@/components/image";
import { useUI, useEventsNav, useNotifications } from "@/store";
import { apiDelete } from "@/api";
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

    async function handleDelete() {
        try {
            await apiDelete(`location/${location.id}`, location.id);
            notify({ type: "success", text: "Локация удалена" });
            onRefresh();
        } catch {}
    }

    return (
        <div className="bg-surface dark:bg-dark-surface border rounded-xl shadow-card p-4 space-y-3">
        <Image
            path={`location/${location.id}/photo`}
    alt={location.name}
    fallbackLetter={location.name[0]}
    className="w-full h-48 rounded-lg object-cover border"
    />

    <h2 className="text-xl font-semibold">{location.name}</h2>
        <p className="text-text-secondary">Адрес: <b>{location.address}</b></p>

    {/* переход */}
    <button
    className="w-full py-2 rounded-lg border flex items-center justify-center gap-2"
    onClick={() => goLeagues(location.id)}
>
    Перейти к лигам
    <ArrowRight size={16} />
    </button>

    {/* раскрытие */}
    <button
        onClick={() => setOpen((v) => !v)}
    className="w-full py-2 rounded-lg bg-primary text-white flex items-center justify-center gap-2"
        >
        {open ? "Скрыть детали" : "Показать детали"}
    {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
    </button>

    {open && (
        <div className="pt-3 border-t space-y-2 text-sm">
            <p><b>ID:</b> {location.id}</p>
    <p><b>Создано:</b> {formatDate(location.created_at)}</p>

    <div className="flex gap-2">
    <button
        className="flex-1 py-2 rounded-lg bg-primary text-white flex items-center justify-center gap-2"
        onClick={() => openForm(locationForm, location)}
    >
        <Pencil size={16} /> Редактировать
    </button>

    <button
        className="flex-1 py-2 rounded-lg bg-error text-white flex items-center justify-center gap-2"
        onClick={handleDelete}
        >
        <Trash size={16} /> Удалить
    </button>
    </div>
    </div>
    )}
    </div>
);
}