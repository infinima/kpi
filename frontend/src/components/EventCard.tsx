import { useState } from "react";
import {
    ChevronDown, ChevronUp, Pencil, Trash, ArrowRight, RotateCcw
} from "lucide-react";

import { BaseImage } from "@/components/BaseImage";
import { useUI, useEventsNav, useNotifications } from "@/store";
import { apiDelete, apiPost } from "@/api";
import { eventForm } from "@/config/eventForm";
import { formatDate, formatDateOnly } from "@/helpers/formatDate";

interface Props {
    event: any;
    onRefresh: () => void;
    isDeleted?: boolean;   // ← добавили
}

export function EventCard({ event, onRefresh, isDeleted = false }: Props) {
    const [open, setOpen] = useState(false);

    const notify = useNotifications((s) => s.addMessage);
    const goLocations = useEventsNav((s) => s.goLocations);

    const openForm = useUI((s) => s.openFormModal);

    async function handleDelete() {
        try {
            await apiDelete(`events/${event.id}`, event.id);
            // notify({ type: "success", text: "Мероприятие удалено" });
            onRefresh();
        } catch {}
    }

    async function handleRestore() {
        try {
            await apiPost(`events/${event.id}/restore`);
            notify({ type: "success", text: "Мероприятие восстановлено" });
            onRefresh();
        } catch {}
    }

    return (
        <div
            className="
                bg-surface dark:bg-dark-surface
                border border-border dark:border-dark-border
                rounded-xl shadow-card p-4 space-y-3
            "
        >
            {/* IMAGE */}
            <BaseImage
                path={`events/${event.id}/photo`}
                alt={event.name}
                className="
                    w-full rounded-lg object-cover
                    border border-border dark:border-dark-border aspect-square
                "
                fallbackLetter={event.name[0]}
            />

            <h2 className="text-xl font-semibold">{event.name}</h2>
            <p className="text-text-secondary dark:text-dark-text-secondary">
                Дата: <b>{formatDateOnly(event.date)}</b>
            </p>

            {!isDeleted && (
                <button
                    className="
                        w-full py-2 rounded-lg flex items-center justify-center gap-2
                        bg-surface dark:bg-dark-surface border border-border dark:border-dark-border
                        hover:bg-hover dark:hover:bg-dark-hover
                    "
                    onClick={() => goLocations(event.id, event.name)}
                >
                    Перейти к площадкам <ArrowRight size={16} />
                </button>
            )}

            {/* раскрытие */}
            <button
                onClick={() => setOpen((v) => !v)}
                className="
                    w-full flex items-center justify-center gap-2
                    py-2 rounded-lg bg-primary text-white hover:bg-primary-dark
                "
            >
                {open ? "Скрыть детали" : "Показать детали"}
                {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {open && (
                <div
                    className="
                        pt-3 border-t border-border dark:border-dark-border
                        space-y-3 text-sm
                    "
                >
                    <p><b>ID:</b> {event.id}</p>
                    <p><b>Создан:</b> {formatDate(event.created_at)}</p>
                    <p><b>Обновлен:</b> {formatDate(event.updated_at)}</p>
                    {isDeleted && <p><b>Удален:</b> {formatDate(event.deleted_at)}</p>}

                    {/* ДЕЙСТВИЯ */}
                    <div className="flex gap-2">

                        {!isDeleted ? (
                            <>
                                {/* РЕДАКТИРОВАТЬ */}
                                <button
                                    onClick={() => openForm(eventForm, event)}
                                    className="
                                        flex-1 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark
                                        flex items-center justify-center gap-2
                                    "
                                >
                                    <Pencil size={16} /> Редактировать
                                </button>

                                {/* УДАЛИТЬ */}
                                <button
                                    onClick={handleDelete}
                                    className="
                                        flex-1 py-2 rounded-lg bg-error text-white hover:bg-error/80
                                        flex items-center justify-center gap-2
                                    "
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