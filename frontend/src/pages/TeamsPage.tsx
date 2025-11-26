import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/api";
import { useUser } from "@/store";
import { useEventsNav } from "@/store";

import { Search, ArrowUpDown, Plus } from "lucide-react";
import { TeamCard } from "@/components/TeamCard";
import { FormModal } from "@/components/layout/FormModal";

import { useUI } from "@/store";
import { teamForm } from "@/config/teamForm"; // создадим ниже

export function TeamsPage() {
  // @ts-ignore
  const { leagueId, leagueName } = useEventsNav();
  const { can } = useUser();

  const canCreate = can("teams", "create");
  const canRestore = can("teams", "restore");

  const [teams, setTeams] = useState<any[]>([]);
  const [mode, setMode] = useState<"active" | "deleted">("active");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"name" | "created">("name");

  const {
    formModalOpen,
    openFormModal,
    closeFormModal,
    formConfig,
    formData,
  } = useUI();

  async function loadTeams() {
    if (!leagueId) return;

    const url =
      mode === "deleted"
        ? `teams/league/${leagueId}/deleted`
        : `teams/league/${leagueId}`;

    const data = await apiGet(url);
    setTeams(data);
  }

  useEffect(() => {
    if (leagueId) {
      void loadTeams();
    }
  }, [leagueId, mode]);

  useEffect(() => {
    if (!canRestore && mode === "deleted") {
      setMode("active");
    }
  }, [canRestore, mode]);

  const filtered = useMemo(() => {
    if (!search.trim()) return teams;

    const s = search.toLowerCase();
    return teams.filter((t) =>
      String(t.name ?? "").toLowerCase().includes(s)
    );
  }, [teams, search]);

  const sorted = useMemo(() => {
    const arr = [...filtered];

    switch (sort) {
      case "name":
        return arr.sort((a, b) => a.name.localeCompare(b.name));
      case "created":
        return arr.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );
      default:
        return arr;
    }
  }, [filtered, sort]);

  if (!leagueId) {
    return (
      <div className="text-center mt-10 text-lg opacity-70">
        Чтобы увидеть команды — выберите лигу
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">

      <h2 className="text-2xl font-bold">
        Команды лиги: {leagueName}
      </h2>

      {/* панель поиска / сортировки */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" size={18}/>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по командам…"
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-surface dark:bg-dark-surface border border-border dark:border-dark-border"
          />
        </div>

        <div className="relative inline-block">
          <ArrowUpDown size={16}
                       className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60 pointer-events-none"/>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="pl-9 pr-3 py-2 rounded-lg bg-surface dark:bg-dark-surface border border-border dark:border-dark-border"
          >
            <option value="name">По названию</option>
            <option value="created">По дате создания</option>
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
            onClick={() =>
              openFormModal(teamForm, { league_id: leagueId })
            }
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            <Plus size={18}/>
            Добавить команду
          </button>
        )}
      </div>

      {sorted.length === 0 && (
        <p className="opacity-70">Ничего не найдено</p>
      )}

      {sorted.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onRefresh={loadTeams}
              isDeleted={mode === "deleted"}
            />
          ))}
        </div>
      )}

      {/* Модальное окно */}
      {formModalOpen && (
        <FormModal
          config={formConfig}
          initialData={formData}
          onClose={closeFormModal}
          onUpdated={loadTeams}
        />
      )}

    </div>
  );
}