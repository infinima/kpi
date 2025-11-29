import {useEffect, useMemo, useState} from "react";
import {apiGet, apiPatch} from "@/api";
import {useEventsNav, useNotifications} from "@/store";

import {ArrowUpDown, Check, Plus, Search, X,} from "lucide-react";

// перевод дипломов
const diplomaMap: Record<string, string> = {
  FIRST_DEGREE: "Диплом I степени",
  SECOND_DEGREE: "Диплом II степени",
  THIRD_DEGREE: "Диплом III степени",
  PARTICIPANT: "Участник",
};

const diplomaOptions = Object.keys(diplomaMap);

type FinalTeam = {
  id: number;
  name: string;
  place_kvartaly: number;
  place_fudzi: number;
  place_sum: number;
  place_final: number;
  diploma: string;
  special_nominations: string[];
};

export function ResultPage() {
  const {leagueId} = useEventsNav();
  const notify = useNotifications((s) => s.addMessage);

  const [data, setData] = useState<FinalTeam[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<
    "place_final" | "place_fudzi" | "place_kvartaly" | "place_sum" | "name"
  >("place_final");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [editNominationsFor, setEditNominationsFor] = useState<FinalTeam | null>(null);
  const [newNom, setNewNom] = useState("");

  // ========= LOAD =========
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const json = await apiGet(`leagues/${leagueId}/final-table`);
        setData(json);
      } catch {
      }
      setLoading(false);
    }

    if (leagueId) load();
  }, [leagueId]);

  // ========= SORT =========
  function toggleSort(key: typeof sortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return data;

    const s = search.toLowerCase();
    return data.filter((t) => t.name.toLowerCase().includes(s));
  }, [data, search]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];

      if (typeof va === "string") {
        return sortDir === "asc"
          ? va.localeCompare(vb)
          : vb.localeCompare(va);
      }
      return sortDir === "asc"
        ? (va as number) - (vb as number)
        : (vb as number) - (va as number);
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  // ========= UPDATE DIPLOMA =========
  async function updateDiploma(team: FinalTeam, value: string) {
    try {
      await apiPatch(`teams/${team.id}`, {diploma: value === "" ? null : value});
      setData((prev) =>
        prev.map((t) =>
          t.id === team.id ? {...t, diploma: value} : t
        )
      );
    } catch {}
  }

  // ========= UPDATE NOMINATIONS =========
  async function saveNominations(team: FinalTeam, list: string[]) {
    try {
      await apiPatch(`teams/${team.id}`, {
        special_nominations: list,
      });

      notify({type: "success", text: "Номинации обновлены"});

      setData((prev) =>
        prev.map((t) =>
          t.id === team.id ? {...t, special_nominations: list} : t
        )
      );
      setEditNominationsFor(null);
      setNewNom("");
    } catch {
      notify({type: "error", text: "Ошибка сохранения"});
    }
  }

  // ========= RENDER HELPERS =========
  const th =
    "px-4 py-3 border-b border-border dark:border-dark-border font-semibold text-left";
  const td =
    "px-4 py-3 border-b border-border dark:border-dark-border";
  const tdCenter =
    "px-4 py-3 border-b border-border dark:border-dark-border text-center";

  // ============================================================
  //                              UI
  // ============================================================

  return (
    <div className="space-y-6 py-6 px-4 md:px-8">


      {/* 🔍 Поиск + сортировка — ВСЕГДА отображаются */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">

        {/* SEARCH */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" size={18}/>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по командам…"
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-surface dark:bg-dark-surface border border-border dark:border-dark-border"
          />
        </div>

        {/* SORT */}
        <div className="relative md:hidden">
          <ArrowUpDown
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none"
          />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as any)}
            className="pl-9 pr-3 py-2 rounded-lg bg-surface dark:bg-dark-surface border border-border dark:border-dark-border"
          >
            <option value="place_final">По месту</option>
            <option value="name">По команде</option>
            <option value="place_fudzi">Фудзи</option>
            <option value="place_kvartaly">Кварталы</option>
            <option value="place_sum">Сумма мест</option>
          </select>
        </div>
      </div>

      {/* STATUS */}
      {loading && (
        <p className="text-center opacity-70 py-10">Загрузка…</p>
      )}

      {!loading && sorted.length === 0 && (
        <p className="text-center opacity-70 py-10">Ничего не найдено</p>
      )}

      {/* ============ DESKTOP TABLE ============ */}
      {!loading && sorted.length > 0 && (
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 rounded-xl overflow-hidden shadow-card">
            <thead>
            <tr className="bg-surface dark:bg-dark-surface">

              <th className={th}>
                <button
                  onClick={() => toggleSort("place_final")}
                  className="flex items-center gap-1"
                >
                  Место <ArrowUpDown size={14} className="opacity-50"/>
                </button>
              </th>

              <th className={th}>
                <button
                  onClick={() => toggleSort("name")}
                  className="flex items-center gap-1"
                >
                  Команда <ArrowUpDown size={14} className="opacity-50"/>
                </button>
              </th>

              <th className={th}>
                <button
                  onClick={() => toggleSort("place_kvartaly")}
                  className="flex items-center gap-1"
                >
                  Кварталы <ArrowUpDown size={14} className="opacity-50"/>
                </button>
              </th>

              <th className={th}>
                <button
                  onClick={() => toggleSort("place_fudzi")}
                  className="flex items-center gap-1"
                >
                  Фудзи <ArrowUpDown size={14} className="opacity-50"/>
                </button>
              </th>


              <th className={th}>
                <button
                  onClick={() => toggleSort("place_sum")}
                  className="flex items-center gap-1"
                >
                  Сумма мест <ArrowUpDown size={14} className="opacity-50"/>
                </button>
              </th>

              <th className={th}>Диплом</th>
              <th className={th}>Специальные номинации</th>
            </tr>
            </thead>

            <tbody>
            {sorted.map((t) => (
              <tr
                key={t.id}
                className="bg-surface dark:bg-dark-surface hover:bg-hover dark:hover:bg-dark-hover transition-colors"
              >
                <td className={tdCenter}>{t.place_final ?? "—"}</td>
                <td className={td}>{t.name ?? "—"}</td>
                <td className={tdCenter}>{t.place_fudzi ?? "—"}</td>
                <td className={tdCenter}>{t.place_kvartaly ?? "—"}</td>
                <td className={tdCenter}>{t.place_sum ?? "—"}</td>

                {/* ДИПЛОМ */}
                <td className={td}>
                  <select
                    value={t.diploma}
                    onChange={(e) => updateDiploma(t, e.target.value)}
                    className="px-2 py-1 rounded-lg bg-surface dark:bg-dark-surface border border-border dark:border-dark-border text-sm"
                  >
                    <option value="">—</option>
                    {diplomaOptions.map((k) => (
                      <option key={k} value={k}>
                        {diplomaMap[k]}
                      </option>
                    ))}
                  </select>
                </td>

                {/* НОМИНАЦИИ */}
                <td className={td}>
                  {t.special_nominations.length === 0 ? (
                    <ul className="text-sm space-y-1">

                      <li >Номинаций нет</li>
                    </ul>
                  ) : (
                    <ul className="text-sm space-y-1">
                      {t.special_nominations.map((n, i) => (
                        <li key={i}>{n}</li>
                      ))}
                    </ul>
                  )}

                  <button
                    onClick={() => setEditNominationsFor(t)}
                    className="text-primary text-sm mt-1 hover:underline"
                  >
                    Изменить
                  </button>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ============ MOBILE VERSION ============ */}
      {!loading && sorted.length > 0 && (
        <div className="md:hidden space-y-4">
          {sorted.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-xl bg-surface dark:bg-dark-surface border border-border dark:border-dark-border shadow-card"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="font-semibold text-lg">{t.name}</div>
                <div className="text-xl font-bold text-primary">
                  #{t.place_final ?? "—"}
                </div>
              </div>

              <div className="text-sm space-y-1 opacity-90">
                <p>Фудзи: <b>{t.place_fudzi ?? "—"}</b></p>
                <p>Кварталы: <b>{t.place_kvartaly ?? "—"}</b></p>
                <p>Сумма мест: <b>{t.place_sum ?? "—"}</b></p>

                {/* Диплом */}
                <div>
                  <span>Диплом: </span>
                  <select
                    value={t.diploma}
                    onChange={(e) => updateDiploma(t, e.target.value)}
                    className="px-2 py-1 rounded-lg bg-surface border border-border  dark:bg-dark-surface dark:border-dark-border text-sm"
                  >
                    <option value="">—</option>
                    {diplomaOptions.map((k) => (
                      <option key={k} value={k}>
                        {diplomaMap[k]}
                      </option>
                    ))}
                  </select>
                </div>

                {t.special_nominations.length > 0 && (
                  <div className="pt-1">
                    <div className="font-medium">Номинации:</div>
                    <div className="text-sm ml-2">
                      {t.special_nominations.map((n, i) => (
                        <div key={i}>{n}</div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setEditNominationsFor(t)}
                  className="text-primary text-sm mt-1 hover:underline"
                >
                  Изменить номинации
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============ POPUP НОМИНАЦИЙ ============ */}
      {editNominationsFor && (
        <div className="
          fixed inset-0 bg-black/40 backdrop-blur-sm
          flex items-center justify-center z-50
        ">
          <div className="
            w-96 bg-surface dark:bg-dark-surface
            rounded-xl border border-border dark:border-dark-border
            shadow-xl p-4 space-y-4
          ">
            <h2 className="font-semibold text-lg">Номинации</h2>

            <div className="space-y-2">
              {editNominationsFor.special_nominations.map((n, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-hover/30 dark:bg-dark-hover/30 px-3 py-2 rounded-lg"
                >
                  <span>{n}</span>
                  <button
                    onClick={() =>
                      setEditNominationsFor({
                        ...editNominationsFor,
                        special_nominations:
                          editNominationsFor.special_nominations.filter((_, j) => j !== i),
                      })
                    }
                    className="text-error hover:opacity-80"
                  >
                    <X size={16}/>
                  </button>
                </div>
              ))}

              {/* ADD NEW */}
              <div className="flex gap-2 mt-2">
                <input
                  value={newNom}
                  onChange={(e) => setNewNom(e.target.value)}
                  placeholder="Новая номинация…"
                  className="flex-1 px-3 py-2 rounded-lg bg-surface dark:bg-dark-surface border border-border dark:border-dark-border"
                />
                <button
                  onClick={() => {
                    if (!newNom.trim()) return;
                    setEditNominationsFor({
                      ...editNominationsFor,
                      special_nominations: [
                        ...editNominationsFor.special_nominations,
                        newNom.trim(),
                      ],
                    });
                    setNewNom("");
                  }}
                  className="px-3 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark"
                >
                  <Plus size={18}/>
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">

              <button
                onClick={() => setEditNominationsFor(null)}
                className="px-4 py-2 rounded-lg border border-border dark:border-dark-border hover:bg-hover dark:hover:bg-dark-hover"
              >
                Отмена
              </button>

              <button
                onClick={() =>
                  saveNominations(
                    editNominationsFor,
                    editNominationsFor.special_nominations
                  )
                }
                className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark flex items-center gap-2"
              >
                <Check size={18}/>
                Сохранить
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}