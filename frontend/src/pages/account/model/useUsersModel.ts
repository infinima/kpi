import { useUser } from "@/entities/session/model/session";
import { userApi } from "@/entities/user/api/userApi";
import { confirmWithNotification } from "@/shared/lib/confirmWithNotification";
import { useServerCollection } from "@/shared/lib/useServerCollection";
import { useUrlState } from "@/shared/lib/useUrlState";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserDraft, UserRow, VisibilityMode, createDraft, formatDate, formatName } from './usersSupport';
export function useUsersModel() {
    const navigate = useNavigate();

    const { can } = useUser();

    const [rightsUser, setRightsUser] = useState<{ userId: number; userName: string; } | null>(null);

    const [visibility, setVisibility] = useUrlState<VisibilityMode>("users_visibility", "active", ["active", "deleted"]);

    const [editingId, setEditingId] = useState<number | null>(null);

    const [draft, setDraft] = useState<UserDraft | null>(null);

    const [savingId, setSavingId] = useState<number | null>(null);

    const [query, setQuery] = useUrlState<string>("users_q", "");

    const canRestoreGlobally = can("users", "restore");

    const canManagePermissions = can("permissions", "get") && (can("permissions", "create") || can("permissions", "update"));

    const { data: rows, loading, refresh: loadUsers } = useServerCollection<UserRow>(["users", visibility], () => userApi.list(visibility, { error: true }));

    useEffect(() => {
        setEditingId(null);
        setDraft(null);
    }, [visibility]);

    const filteredRows = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) {
            return rows;
        }

        return rows.filter((row) => [
            String(row.id),
            formatName(row),
            row.email,
            row.phone_number,
            row.tg_id == null ? "" : String(row.tg_id),
            row.tg_username ?? "",
            row.tg_full_name ?? "",
            formatDate(row.created_at),
        ].some((value) => String(value).toLowerCase().includes(normalizedQuery)));
    }, [query, rows]);

    function beginEdit(row: UserRow) {
        setEditingId(row.id);
        setDraft(createDraft(row));
    }

    function cancelEdit() {
        setEditingId(null);
        setDraft(null);
    }

    function updateDraft<K extends keyof UserDraft>(key: K, value: UserDraft[K]) {
        setDraft((current) => current ? { ...current, [key]: value } : current);
    }

    async function handleSave(row: UserRow) {
        if (!draft) {
            return;
        }

        setSavingId(row.id);
        try {
            await userApi.update(row.id, {
                last_name: draft.last_name.trim(),
                first_name: draft.first_name.trim(),
                patronymic: draft.patronymic.trim() || null,
                email: draft.email.trim(),
                phone_number: draft.phone_number.trim(),
                tg_id: draft.tg_id.trim() ? Number(draft.tg_id.trim()) : null,
            }, {
                success: "Пользователь обновлён",
                error: true,
            });

            await loadUsers();
            cancelEdit();
        } finally {
            setSavingId(null);
        }
    }

    async function handleDelete(row: UserRow) {
        if (!await confirmWithNotification({ text: "Точно удалить пользователя?" })) {
            return;
        }

        await userApi.remove(row.id);
        await loadUsers();
    }

    async function handleRestore(row: UserRow) {
        await userApi.restore(row.id, { success: "Пользователь восстановлен", error: true });
        await loadUsers();
    }
    return {
        navigate,
        can,
        rightsUser,
        setRightsUser,
        rows,
        loading,
        visibility,
        setVisibility,
        editingId,
        setEditingId,
        draft,
        setDraft,
        savingId,
        setSavingId,
        query,
        setQuery,
        canRestoreGlobally,
        canManagePermissions,
        loadUsers,
        filteredRows,
        beginEdit,
        cancelEdit,
        updateDraft,
        handleSave,
        handleDelete,
        handleRestore,
    };
}
