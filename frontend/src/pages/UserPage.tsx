import { useEffect, useState, useMemo } from "react";
import { apiGet } from "@/api";
import { useUI } from "@/store";
import { Search, Plus } from "lucide-react";

import { UserCard } from "@/components/user/UserCard";
import { UserEditModal } from "@/components/user/UserEditModal";

export function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState<"name" | "email" | "date">("name");

    // 🔥 новый фильтр
    const [mode, setMode] = useState<"active" | "deleted">("active");

    const [loading, setLoading] = useState(true);

    const openEdit = useUI((s) => s.openEditUserModal);

    async function loadUsers() {
        try {
            setLoading(true);

            let url =
                mode === "active"
                    ? "users"
                    : "users/deleted"; // 👈 или users/deleted если так надо

            const list = await apiGet(url);
            setUsers(list);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadUsers();
    }, [mode]); // ⬅ обновлять при переключении фильтра

    const filtered = useMemo(() => {
        if (!search.trim()) return users;
        const s = search.toLowerCase();

        return users.filter((u) =>
            Object.values(u).some((v) =>
                String(v || "").toLowerCase().includes(s)
            )
        );
    }, [users, search]);

    const sorted = useMemo(() => {
        const arr = [...filtered];

        if (sort === "name") {
            return arr.sort((a, b) =>
                `${a.last_name} ${a.first_name}`.localeCompare(
                    `${b.last_name} ${b.first_name}`
                )
            );
        }

        if (sort === "email") {
            return arr.sort((a, b) => a.email.localeCompare(b.email));
        }

        if (sort === "date") {
            return arr.sort(
                (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
            );
        }

        return arr;
    }, [filtered, sort]);

    return (
        <div className="space-y-6 pb-20">

            {/* SEARCH + SORT + MODE */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">

                {/* Search */}
                <div className="relative w-full sm:w-80">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60"
                        size={18}
                    />

                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Поиск по пользователям..."
                        className="
                            w-full pl-10 pr-3 py-2 rounded-lg
                            bg-surface dark:bg-dark-surface
                            border border-border dark:border-dark-border
                        "
                    />
                </div>

                {/* Sort */}
                <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as any)}
                    className="
                        px-3 py-2 rounded-lg
                        bg-surface dark:bg-dark-surface
                        border border-border dark:border-dark-border
                        w-full sm:w-auto
                    "
                >
                    <option value="name">По ФИО</option>
                    <option value="email">По email</option>
                    <option value="date">По дате создания</option>
                </select>

                {/* 🔥 MODE SWITCH */}
                <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as any)}
                    className="
                        px-3 py-2 rounded-lg
                        bg-surface dark:bg-dark-surface
                        border border-border dark:border-dark-border
                        w-full sm:w-auto
                    "
                >
                    <option value="active">Активные</option>
                    <option value="deleted">Удалённые</option>
                </select>

                {/* Add user */}
                {mode === "active" && (
                    <button
                        onClick={() =>
                            openEdit({
                                id: null,
                                email: "",
                                first_name: "",
                                last_name: "",
                                patronymic: "",
                                tg_username: "",
                                tg_full_name: "",
                            })
                        }
                        className="
                            flex items-center gap-2 px-4 py-2
                            bg-primary text-white rounded-lg
                            hover:bg-primary-dark
                        "
                    >
                        <Plus size={18} />
                        Добавить
                    </button>
                )}
            </div>

            {/* GRID */}
            {loading ? (
                <p className="text-text-secondary">Загрузка...</p>
            ) : sorted.length === 0 ? (
                <p className="text-text-secondary">Ничего не найдено</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sorted.map((user) => (
                        <UserCard user={user} onRefresh={loadUsers} isDeleted={mode==="deleted"} />
                    ))}
                </div>
            )}

            <UserEditModal onUpdated={loadUsers} />
        </div>
    );
}