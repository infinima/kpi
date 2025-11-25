import { useState } from "react";
import {
    ChevronDown, ChevronUp, Pencil, Trash
} from "lucide-react";

import { BaseImage } from "@/components/BaseImage";
import { useUI, useNotifications } from "@/store";
import { apiDelete } from "@/api";
import { leagueForm } from "@/config/leagueForm";
import { formatDate } from "@/helpers/formatDate";

interface Props {
    league: any;
    onRefresh: () => void;
    isDeleted?: boolean;
}

export function LeagueCard({ league, onRefresh, isDeleted = false }: Props) {
    const [open, setOpen] = useState(false);

    const notify = useNotifications((s) => s.addMessage);
    const openForm = useUI((s) => s.openFormModal);

    async function handleDelete() {
        try {
            await apiDelete(`leagues/${league.id}`, league.id);
            notify({ type: "success", text: "Лига удалена" });
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
                path={`leagues/${league.id}/photo`}
                alt={league.name}
                className="
                    w-full h-48 rounded-lg object-cover
                    border border-border dark:border-dark-border
                "
                fallbackLetter={league.name[0]}
            />

            {/* NAME */}
            <h2 className="text-xl font-semibold">{league.name}</h2>

            {/* STATUS */}
            <p className="text-text-secondary dark:text-dark-text-secondary">
                Статус: <b>{league.status}</b>
            </p>

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
                    <p><b>ID:</b> {league.id}</p>
                    <p><b>Локация:</b> {league.location_id}</p>

                    <p><b>Создана:</b> {formatDate(league.created_at)}</p>
                    <p><b>Обновлена:</b> {formatDate(league.updated_at)}</p>

                    {/* ДЕЙСТВИЯ */}
                    {!isDeleted && (
                        <div className="flex gap-2">
                            {/* РЕДАКТИРОВАНИЕ */}
                            <button
                                onClick={() => openForm(leagueForm, league)}
                                className="
                                    flex-1 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark
                                    flex items-center justify-center gap-2
                                "
                            >
                                <Pencil size={16} /> Редактировать
                            </button>

                            {/* УДАЛЕНИЕ */}
                            <button
                                onClick={handleDelete}
                                className="
                                    flex-1 py-2 rounded-lg bg-error text-white hover:bg-error/80
                                    flex items-center justify-center gap-2
                                "
                            >
                                <Trash size={16} /> Удалить
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}