import { useState } from "react";
import {
    ChevronDown, ChevronUp, Pencil, Trash, ArrowRight,
    RotateCcw, History, ListTree
} from "lucide-react";

import { BaseImage } from "@/components/BaseImage";
import { useUI, useEventsNav, useNotifications, useUser } from "@/store";
import { apiDelete, apiPost } from "@/api";
import { eventForm } from "@/config/eventForm";
import { formatDate, formatDateOnly } from "@/helpers/formatDate";

interface Props {
    event: any;
    onRefresh: () => void;
    isDeleted?: boolean;
}

export function EventCard({ event, onRefresh, isDeleted = false }: Props) {
    const [open, setOpen] = useState(false);

    const notify = useNotifications((s) => s.addMessage);
    const goLocations = useEventsNav((s) => s.goLocations);
    const openForm = useUI((s) => s.openFormModal);

    const { can, guest } = useUser();

    // --- Право на действия ---
    const canUpdate = can("events", "update", event.id);
    const canDelete = can("events", "delete", event.id);
    const canRestore = can("events", "restore", event.id);
    const canHistory = can("events", "access_history", event.id);

    // --- Удаление ---
    async function handleDelete() {
        try {
            await apiDelete(`events/${event.id}`, event.id);
            onRefresh();
        } catch {}
    }

    // --- Восстановление ---
    async function handleRestore() {
        try {
            await apiPost(`events/${event.id}/restore`);
            notify({ type: "success", text: "Мероприятие восстановлено" });
            onRefresh();
        } catch {}
    }

    function handleHistoryView() {
      useUI.getState().openLogModal(event.id, "events");
    }

    function handleChangesView() {
        notify({ type: "info", text: "Журнал действий (TODO)" });
    }

    const canGoInside = !isDeleted; // гости и удалённые → не проходят

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

            {/* Перейти к площадкам */}
            {canGoInside && (
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

            {/* Раскрытие */}
            {!guest && <button
                onClick={() => setOpen((v) => !v)}
                className="
                    w-full flex items-center justify-center gap-2
                    py-2 rounded-lg bg-primary text-white hover:bg-primary-dark
                "
            >
                {open ? "Скрыть детали" : "Показать детали"}
                {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>}


            {/* Детали */}
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

                    {/* БЛОК КНОПОК */}
                    <div className="flex flex-col gap-2 pt-2">

                        {/* ----- АКТИВНОЕ МЕРОПРИЯТИЕ ----- */}
                        {!isDeleted && (
                            <>
                                {/* РЕДАКТИРОВАТЬ */}
                                {canUpdate && (
                                    <button
                                        onClick={() => openForm(eventForm, event)}
                                        className="
                                            flex-1 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark
                                            flex items-center justify-center gap-2
                                        "
                                    >
                                        <Pencil size={16} /> Редактировать
                                    </button>
                                )}

                                {/* УДАЛИТЬ */}
                                {canDelete && (
                                    <button
                                        onClick={handleDelete}
                                        className="
                                            flex-1 py-2 rounded-lg bg-error text-white hover:bg-error/80
                                            flex items-center justify-center gap-2
                                        "
                                    >
                                        <Trash size={16} /> Удалить
                                    </button>
                                )}
                            </>
                        )}

                        {/* ----- УДАЛЁННОЕ МЕРОПРИЯТИЕ ----- */}
                        {isDeleted && canRestore && (
                            <button
                                onClick={handleRestore}
                                className="
                                    flex-1 py-2 rounded-lg bg-success text-white hover:bg-success/80
                                    flex items-center justify-center gap-2
                                "
                            >
                                <RotateCcw size={16} /> Восстановить
                            </button>
                        )}

                        {/* ----- ИСТОРИЯ И ДЕЙСТВИЯ ----- */}
                        {canHistory && (

                                <button
                                    onClick={handleHistoryView}
                                    className="
                                        py-2 rounded-lg bg-surface dark:bg-dark-surface
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