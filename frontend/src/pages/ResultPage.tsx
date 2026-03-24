import { useEffect, useMemo, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { ArrowDown, ArrowUp, Download } from "lucide-react";
import { apiGet, apiGetFile, apiPatch } from "@/api";
import { useModalStore, useNotifications, useUser } from "@/store";

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
  place_kvartaly: number | null;
  place_fudzi: number | null;
  place_sum: number | null;
  place_final: number | null;
  diploma: string | null;
  special_nominations: string[];
};

type EntitySummary = {
  id: number;
  name: string;
};

type EventsOutletContext = {
  eventInfo: EntitySummary | null;
  locationInfo: EntitySummary | null;
  leagueInfo: EntitySummary | null;
};

type SortKey = "place_final" | "place_fudzi" | "place_kvartaly" | "place_sum" | "name";
type SortDirection = "asc" | "desc";

function compareValues(left: unknown, right: unknown) {
  if (left == null && right == null) return 0;
  if (left == null) return -1;
  if (right == null) return 1;

  const leftNumber = Number(left);
  const rightNumber = Number(right);

  if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber) && `${left}` !== "" && `${right}` !== "") {
    return leftNumber - rightNumber;
  }

  return String(left).localeCompare(String(right), "ru", { sensitivity: "base" });
}

function sortIcon(active: boolean, direction: SortDirection) {
  if (!active) return null;
  return direction === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
}

function headerButtonClass(active: boolean) {
  return `flex w-full items-center gap-1 text-left text-xs font-semibold uppercase tracking-[0.08em] transition ${
    active ? "text-white" : "text-white/92 hover:text-white"
  }`;
}

export function ResultPage() {
  const { leagueId } = useParams();
  const { eventInfo, locationInfo, leagueInfo } = useOutletContext<EventsOutletContext>();
  const notify = useNotifications((state) => state.addMessage);
  const openModal = useModalStore((state) => state.openModal);
  const { can } = useUser();

  const [data, setData] = useState<FinalTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({
    key: "place_final",
    direction: "asc",
  });

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!leagueId) {
        setData([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const json = await apiGet<FinalTeam[]>(`leagues/${leagueId}/final-table`);
        if (!ignore) {
          setData(json);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      ignore = true;
    };
  }, [leagueId]);

  const sorted = useMemo(() => {
    return [...data].sort((left, right) => {
      const compared = compareValues(left[sort.key], right[sort.key]);
      return sort.direction === "asc" ? compared : -compared;
    });
  }, [data, sort]);

  function toggleSort(key: SortKey) {
    setSort((current) => current.key === key
      ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
      : { key, direction: key === "name" ? "asc" : "desc" });
  }

  async function updateDiploma(team: FinalTeam, value: string) {
    await apiPatch(`teams/${team.id}`, { diploma: value === "" ? null : value }, { error: true });
    setData((prev) => prev.map((item) => item.id === team.id ? { ...item, diploma: value || null } : item));
  }

  async function saveNominations(team: FinalTeam, list: string[]) {
    try {
      await apiPatch(`teams/${team.id}`, { special_nominations: list }, { error: true });
      notify({ type: "success", text: "Номинации обновлены" });
      setData((prev) => prev.map((item) => item.id === team.id ? { ...item, special_nominations: list } : item));
    } catch {
      notify({ type: "error", text: "Ошибка сохранения" });
    }
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <div className="text-3xl font-semibold tracking-tight text-[var(--color-text-main)]">
          Общие результаты
        </div>
        <div className="space-y-1 text-sm text-[var(--color-text-secondary)]">
          {eventInfo ? <div>Мероприятие: {eventInfo.name}</div> : null}
          {locationInfo ? <div>Площадка: {locationInfo.name}</div> : null}
          {leagueInfo ? <div>Лига: {leagueInfo.name}</div> : null}
        </div>
      </div>

      {loading ? (
        <div className="rounded-[24px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.84)] px-6 py-8 text-sm text-[var(--color-text-secondary)]">
          Загрузка...
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-[24px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.84)] px-6 py-8 text-sm text-[var(--color-text-secondary)]">
          Нет данных для отображения.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[1240px] overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.9)] shadow-[0_18px_52px_rgba(15,23,42,0.08)]">
            <table className="w-full table-fixed border-collapse text-[13px] text-[var(--color-text-main)]">
              <colgroup>
                <col className="w-[8%]" />
                <col className="w-[18%]" />
                <col className="w-[8%]" />
                <col className="w-[8%]" />
                <col className="w-[8%]" />
                <col className="w-[12%]" />
                <col className="w-[18%]" />
                <col className="w-[8%]" />
                <col className="w-[6%]" />
                <col className="w-[6%]" />
              </colgroup>
              <thead>
                <tr className="bg-[var(--color-primary)] text-white">
                  <th className="px-3 py-3"><button type="button" onClick={() => toggleSort("place_final")} className={headerButtonClass(sort.key === "place_final")}>Место {sortIcon(sort.key === "place_final", sort.direction)}</button></th>
                  <th className="px-3 py-3"><button type="button" onClick={() => toggleSort("name")} className={headerButtonClass(sort.key === "name")}>Команда {sortIcon(sort.key === "name", sort.direction)}</button></th>
                  <th className="px-3 py-3"><button type="button" onClick={() => toggleSort("place_kvartaly")} className={headerButtonClass(sort.key === "place_kvartaly")}>Кварталы {sortIcon(sort.key === "place_kvartaly", sort.direction)}</button></th>
                  <th className="px-3 py-3"><button type="button" onClick={() => toggleSort("place_fudzi")} className={headerButtonClass(sort.key === "place_fudzi")}>Фудзи {sortIcon(sort.key === "place_fudzi", sort.direction)}</button></th>
                  <th className="px-3 py-3"><button type="button" onClick={() => toggleSort("place_sum")} className={headerButtonClass(sort.key === "place_sum")}>Сумма {sortIcon(sort.key === "place_sum", sort.direction)}</button></th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em]">Диплом</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em]">Спецноминации</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em]">Благ.</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em]">Дипл.</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em]">Ном.</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((team, index) => (
                  <tr
                    key={team.id}
                    className={`transition ${index % 2 === 0 ? "bg-[rgba(248,250,252,0.88)]" : "bg-[rgba(255,255,255,0.84)]"} hover:bg-[rgba(14,116,144,0.08)]`}
                  >
                    <td className="border-b border-r border-[var(--color-border)] px-3 py-3 text-center font-semibold">{team.place_final ?? "—"}</td>
                    <td className="border-b border-r border-[var(--color-border)] px-3 py-3">{team.name}</td>
                    <td className="border-b border-r border-[var(--color-border)] px-3 py-3 text-center">{team.place_kvartaly ?? "—"}</td>
                    <td className="border-b border-r border-[var(--color-border)] px-3 py-3 text-center">{team.place_fudzi ?? "—"}</td>
                    <td className="border-b border-r border-[var(--color-border)] px-3 py-3 text-center">{team.place_sum ?? "—"}</td>
                    <td className="border-b border-r border-[var(--color-border)] px-3 py-3">
                      <select
                        disabled={!can("teams", "update", team.id)}
                        value={team.diploma ?? ""}
                        onChange={(event) => void updateDiploma(team, event.target.value)}
                        className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text-main)] outline-none"
                      >
                        <option value="">—</option>
                        {diplomaOptions.map((key) => (
                          <option key={key} value={key}>
                            {diplomaMap[key]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border-b border-r border-[var(--color-border)] px-3 py-3">
                      <div className="space-y-2">
                        <div className="space-y-1 text-sm">
                          {team.special_nominations.length === 0 ? "Номинаций нет" : team.special_nominations.map((item, nominationIndex) => (
                            <div key={`${team.id}-${nominationIndex}`}>{item}</div>
                          ))}
                        </div>
                        {can("teams", "update", team.id) ? (
                          <button
                            type="button"
                            onClick={() => openModal("final-nominations", {
                              teamId: team.id,
                              teamName: team.name,
                              nominations: team.special_nominations,
                              onSave: (list) => saveNominations(team, list),
                            })}
                            className="text-sm text-[var(--color-primary)] transition hover:opacity-80"
                          >
                            Изменить
                          </button>
                        ) : null}
                      </div>
                    </td>
                    <td className="border-b border-r border-[var(--color-border)] px-3 py-3 text-center">
                      {can("teams", "get", team.id) ? (
                        <button
                          type="button"
                          onClick={() => void apiGetFile(`teams/${team.id}/appreciation`, `${team.name.replace(" ", "_")}_благодарность.pdf`)}
                          className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] transition hover:opacity-80"
                        >
                          <Download size={14} />
                        </button>
                      ) : null}
                    </td>
                    <td className="border-b border-r border-[var(--color-border)] px-3 py-3 text-center">
                      {can("teams", "get", team.id) && team.diploma ? (
                        <button
                          type="button"
                          onClick={() => void apiGetFile(`teams/${team.id}/diploma`, `${team.name.replace(" ", "_")}_${team.diploma === "PARTICIPANT" ? "сертификат" : "диплом"}.pdf`)}
                          className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] transition hover:opacity-80"
                        >
                          <Download size={14} />
                        </button>
                      ) : null}
                    </td>
                    <td className="border-b border-[var(--color-border)] px-3 py-3 text-center">
                      {can("teams", "get", team.id) && team.special_nominations.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => void apiGetFile(`teams/${team.id}/special-nominations`, `${team.name.replace(" ", "_")}_спецноминации.pdf`)}
                          className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] transition hover:opacity-80"
                        >
                          <Download size={14} />
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
