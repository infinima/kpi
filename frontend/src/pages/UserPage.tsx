import {useEffect, useMemo, useState} from "react";
import {apiGet} from "@/api";
import {useUI, useUser} from "@/store";
import {ArrowUpDown, Plus, Search} from "lucide-react";

import {UserCard} from "@/components/UserCard";
import {FormModal} from "@/components/layout/FormModal";
import {userForm} from "@/config/userForm";
import {RightsModal} from "@/components/RightsModal";

export function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"name" | "email" | "date">("name");
  const [mode, setMode] = useState<"active" | "deleted">("active");

  const {
    formModalOpen,
    closeFormModal,
    openFormModal,
    formConfig,
    formData,
    rightsModalOpen,
  } = useUI();

  const {can} = useUser();
  const canRestore = can("users", "restore");
  const canCreate = can("users", "create");

  async function loadUsers() {
    try {
      const url = (mode === "deleted") ? "users/deleted" : "users";
      const data = await apiGet(url);
      setUsers(data);
    } catch {
    }
  }

  useEffect(() => {
    void loadUsers();
  }, [mode]);

  useEffect(() => {
    if (!canRestore && mode === "deleted") {
      setMode("active");
    }
  }, [canRestore, mode]);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;

    const s = search.toLowerCase();
    return users.filter((u) =>
      Object.values(u).some((v) =>
        String(v ?? "").toLowerCase().includes(s)
      )
    );
  }, [users, search]);

  const sorted = useMemo(() => {
    const arr = [...filtered];

    switch (sort) {
      case "name":
        return arr.sort((a, b) =>
          `${a.last_name} ${a.first_name}`.localeCompare(
            `${b.last_name} ${b.first_name}`
          )
        );
      case "email":
        return arr.sort((a, b) => a.email.localeCompare(b.email));
      case "date":
        return arr.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );
      default:
        return arr;
    }
  }, [filtered, sort]);

  return (
    <div className="space-y-6 pb-20">

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" size={18}/>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по пользователям..."
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-surface dark:bg-dark-surface border border-border dark:border-dark-border"
          />
        </div>

        <div className="relative inline-block">
          <ArrowUpDown size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60 pointer-events-none"/>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="pl-9 pr-3 py-2 rounded-lg bg-surface dark:bg-dark-surface border border-border dark:border-dark-border"
          >
            <option value="name">По ФИО</option>
            <option value="email">По email</option>
            <option value="date">По дате создания</option>
          </select>
        </div>

        {canRestore && (
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
            className="px-3 py-2 rounded-lg bg-surface dark:bg-dark-surface border border-border dark:border-dark-border"
          >
            <option value="active">Активные</option>
            <option value="deleted">Удалённые</option>
          </select>
        )}

        {mode === "active" && canCreate && (
          <button
            onClick={() => openFormModal(userForm, null)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            <Plus size={18}/>
            Добавить
          </button>
        )}
      </div>

      {sorted.length === 0 && (
        <p>Ничего не найдено</p>
      )}

      {sorted.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onRefresh={loadUsers}
              isDeleted={mode === "deleted"}
            />
          ))}
        </div>
      )}

      {formModalOpen && (
        <FormModal
          config={formConfig}
          initialData={formData}
          onClose={closeFormModal}
          onUpdated={loadUsers}
        />
      )}
      {rightsModalOpen && (
        <RightsModal/>
      )}


    </div>
  );
}