import { useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Trash, RotateCcw } from "lucide-react";
import { useNotifications, useUI } from "@/store";
import { apiDelete, apiPost } from "@/api";
import { BaseImage } from "@/components/BaseImage";
import { formatDate } from "@/helpers/formatDate";
import { userForm } from "@/config/userForm";


export interface User {
    id: number;
    email: string;
    last_name: string;
    first_name: string;
    patronymic: string;
    tg_username: string;
    tg_full_name: string;
    created_at: string;
    updated_at: string;
    deleted_at: string;
}

interface UserCardProps {
    user: User;
    onRefresh: () => void;
    isDeleted?: boolean;
}

export function UserCard({ user, onRefresh, isDeleted = false }: UserCardProps) {
    const [open, setOpen] = useState(false);
    const openEdit = useUI((s) => s.openFormModal);
    const notify = useNotifications((s) => s.addMessage);

    async function handleDelete() {
        try {
            await apiDelete(`users/${user.id}`, user.id);
            onRefresh();
        } catch {}
    }

    async function handleRestore() {
        try {
            await apiPost(`users/${user.id}/restore`);
            notify({ type: "success", text: "Пользователь восстановлен" });
            onRefresh();
        } catch {}
    }

    return (
        <div
            className="
                bg-surface dark:bg-dark-surface
                border border-border dark:border-dark-border
                rounded-xl shadow-card p-4 space-y-3 transition
                relative
            "
        >

            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">

                    <BaseImage
                        path={`users/${user.id}/photo`}
                        alt="avatar"
                        className="
                            w-12 h-12 rounded-full object-cover
                            border border-border dark:border-dark-border
                        "
                        fallbackLetter={user.first_name?.[0] ?? "?"}
                    />

                    <div>
                        <p className="font-semibold text-lg">
                            {user.last_name} {user.first_name}
                        </p>
                        <p className="text-text-secondary text-sm">{user.email}</p>
                    </div>
                </div>

                <button
                    onClick={() => setOpen((s) => !s)}
                    className="text-primary hover:opacity-80"
                >
                    {open ? <ChevronUp /> : <ChevronDown />}
                </button>
            </div>

            {/* DETAILS */}
            {open && (
                <div
                    className="
                        pt-3 border-t border-border dark:border-dark-border
                        space-y-2 text-sm
                    "
                >
                    <p><b>ID:</b> {user.id}</p>
                    <p><b>Фамилия:</b> {user.last_name}</p>
                    <p><b>Имя:</b> {user.first_name}</p>
                    <p><b>Отчество:</b> {user.patronymic}</p>
                    <p><b>Создан:</b> {formatDate(user.created_at)}</p>
                    <p><b>Последнее изменение:</b> {formatDate(user.updated_at)}</p>
                    {isDeleted && <p><b>Удален:</b> {formatDate(user.deleted_at)}</p>}

                    <div className="pt-3 flex gap-3">

                        {isDeleted ? (


                            <button
                                onClick={handleRestore}
                                className="
                                    px-3 py-2 flex items-center gap-2 rounded-lg
                                    bg-success text-white hover:bg-success/80
                                "
                            >
                                <RotateCcw size={16} /> Восстановить
                            </button>
                        ) : (
                            <>
                                {/* РЕДАКТИРОВАТЬ */}
                                <button
                                    onClick={() => openEdit(userForm, user)}
                                    className="
        px-3 py-2 flex items-center gap-2 rounded-lg
        bg-primary text-white hover:bg-primary-dark
    "
                                >
                                    <Pencil size={16} /> Редактировать
                                </button>

                                {/* УДАЛИТЬ */}
                                <button
                                    onClick={handleDelete}
                                    className="
                                        px-3 py-2 flex items-center gap-2 rounded-lg
                                        bg-error text-white hover:bg-error/80
                                    "
                                >
                                    <Trash size={16} /> Удалить
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}