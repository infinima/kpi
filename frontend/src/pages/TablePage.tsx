import {useEffect, useMemo, useState} from "react";
import { useEventsNav, useSocketStore, useUI } from "@/store";

import { FudziRow } from "@/components/FudziRow";
import { KvartalRow } from "@/components/KvartalRow";
import type { FudziRow as TFudzi, KvartalRow as TKvartal } from "@/types";
import { ChevronUp, ChevronDown } from "lucide-react";

type SortDirection = "asc" | "desc" | null;
type SortState = {
  key: string;
  direction: SortDirection;
} | null;

function compareValues(left: unknown, right: unknown) {
  if (left == null && right == null) return 0;
  if (left == null) return -1;
  if (right == null) return 1;

  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }

  return String(left).localeCompare(String(right), "ru", { sensitivity: "base" });
}

export function TablesPage() {
  const { connect, disconnect, tableData, isConnected } = useSocketStore();
  const { eventName, locationName, leagueName, tableType } = useEventsNav();

  const hoveredColumn = useUI((s) => s.hoveredColumn);
  const setHoveredColumn = useUI((s) => s.setHoveredColumn);

  const [topPanelOpen, setTopPanelOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState>(null);

  const filteredData = useMemo(() => {
    if (!tableData) return [];

    const s = search.trim().toLowerCase();
    if (!s) return tableData;

    return tableData.filter((team: any) =>
      team.name.toLowerCase().includes(s)
    );
  }, [search, tableData]);

  const sortedData = useMemo(() => {
    if (!sort?.key || !sort.direction) {
      return filteredData;
    }

    const getSortValue = (team: any) => {
      if (sort.key === "name" || sort.key === "penalty" || sort.key === "total") {
        return team[sort.key];
      }

      if (tableType === "fudzi" && sort.key.startsWith("fudzi-question-")) {
        const questionIndex = Number(sort.key.replace("fudzi-question-", "")) - 1;
        return team.answers?.[questionIndex]?.score ?? 0;
      }

      if (tableType === "kvartaly" && sort.key.startsWith("kvartaly-question-")) {
        const questionIndex = Number(sort.key.replace("kvartaly-question-", "")) - 1;
        const quarterIndex = Math.floor(questionIndex / 4);
        const answerIndex = questionIndex % 4;
        return team.quarters?.[quarterIndex]?.answers?.[answerIndex]?.score ?? 0;
      }

      if (tableType === "kvartaly" && sort.key.startsWith("kvartaly-bonus-")) {
        const quarterIndex = Number(sort.key.replace("kvartaly-bonus-", "")) - 1;
        return team.quarters?.[quarterIndex]?.bonus ?? 0;
      }

      return 0;
    };

    return [...filteredData].sort((left, right) => {
      const compared = compareValues(getSortValue(left), getSortValue(right));
      return sort.direction === "asc" ? compared : -compared;
    });
  }, [filteredData, sort, tableType]);

  function toggleSort(key: string) {
    setSort((current) => {
      if (!current || current.key !== key) {
        return { key, direction: "asc" };
      }

      if (current.direction === "asc") {
        return { key, direction: "desc" };
      }

      if (current.direction === "desc") {
        return null;
      }

      return { key, direction: "asc" };
    });
  }

  function headerButtonClass(isActive: boolean) {
    return `inline-flex items-center justify-center gap-1 rounded-md px-0.5 py-0 text-[11px] leading-none transition ${isActive ? "font-semibold" : ""}`;
  }

  function renderSortIcon(key: string) {
    if (sort?.key !== key || !sort.direction) {
      return null;
    }

    return sort.direction === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  }

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [tableType]);

  // ====== HEADERS ======

  const renderFudziHeader = () => (
    <thead className="md:table-header-group">
    <tr>
      <th
        className="
            sticky top-0 z-30 th w-50
            bg-surface dark:bg-dark-surface
            border-b border-border dark:border-dark-border
          "
      >
        <button type="button" onClick={() => toggleSort("name")} className={headerButtonClass(sort?.key === "name")}>
          Команда {renderSortIcon("name")}
        </button>
      </th>

      {[...Array(16)].map((_, i) => (
        <th
          key={i}
          className={`
            sticky top-0 z-30 th text-center w-8
              bg-surface dark:bg-dark-surface
              border-b border-border dark:border-dark-border
              ${hoveredColumn === i ? "!bg-primary/40 dark:!bg-primary/80" : ""}
            `}
          onMouseEnter={() => setHoveredColumn(i)}
          onMouseLeave={() => setHoveredColumn(null)}
        >
          <button type="button" onClick={() => toggleSort(`fudzi-question-${i + 1}`)} className={headerButtonClass(sort?.key === `fudzi-question-${i + 1}`)}>
            {i + 1} {renderSortIcon(`fudzi-question-${i + 1}`)}
          </button>
        </th>
      ))}

      <th
        className="
            sticky top-0 z-30 th w-14
            bg-surface dark:bg-dark-surface
            border-b border-border dark:border-dark-border
          "
      >
        <button type="button" onClick={() => toggleSort("penalty")} className={headerButtonClass(sort?.key === "penalty")}>
          Штраф {renderSortIcon("penalty")}
        </button>
      </th>

      <th
        className="
            sticky top-0 z-30 th w-14
            bg-surface dark:bg-dark-surface
            border-b border-border dark:border-dark-border
          "
      >
        <button type="button" onClick={() => toggleSort("total")} className={headerButtonClass(sort?.key === "total")}>
          Итого {renderSortIcon("total")}
        </button>
      </th>
    </tr>
    </thead>
  );

  const renderKvartalyHeader = () => (
    <thead className="md:table-header-group sticky top-0 ">
    {/* ───── СТРОКА 1 ───── */}
    <tr>
      <th
        className="
           z-30 th w-50
          bg-surface dark:bg-dark-surface
          border-b border-border dark:border-dark-border
        "
        rowSpan={2}
      >
        <button type="button" onClick={() => toggleSort("name")} className={headerButtonClass(sort?.key === "name")}>
          Команда {renderSortIcon("name")}
        </button>
      </th>

      {[1, 2, 3, 4].map((q) => (
        <th
          key={q}
          colSpan={5}
          className=
            {`z-30 th text-center
            bg-surface dark:bg-dark-surface
            border-b border-border dark:border-dark-border
            border-r
            ${hoveredColumn !== null &&
            Math.floor(hoveredColumn / 5) + 1 === q
              ? "!bg-primary/40 dark:!bg-primary/80"
              : ""}`}

        >

          <span className="inline-flex items-center gap-1">
            Квартал {q}
          </span>
        </th>
      ))}

      <th
        className="
          z-30 th w-20
          bg-surface dark:bg-dark-surface
          border-b border-border dark:border-dark-border
        "
        rowSpan={2}
      >
        <button type="button" onClick={() => toggleSort("penalty")} className={headerButtonClass(sort?.key === "penalty")}>
          Штраф {renderSortIcon("penalty")}
        </button>
      </th>

      <th
        className="
       z-30 th w-20
          bg-surface dark:bg-dark-surface
          border-b border-border dark:border-dark-border
        "
        rowSpan={2}
      >
        <button type="button" onClick={() => toggleSort("total")} className={headerButtonClass(sort?.key === "total")}>
          Итого {renderSortIcon("total")}
        </button>
      </th>
    </tr>

    {/* ───── СТРОКА 2 (ЗАДАЧИ) ───── */}
    <tr>


      {[1, 2, 3, 4].map((q) =>
        [...Array(5)].map((_, i) => (
          <th
            onMouseEnter={() => {
              setHoveredColumn((q-1) * 5 + i);
            }}
            onMouseLeave={() => setHoveredColumn(null)}
            key={`${q}-${i}`}
            className=
              {`z - 30 th text-center
                bg-surface dark:bg-dark-surface
                border border-border dark:border-dark-border
                w-10 px-2
            ${hoveredColumn === (q-1) * 5 + i? "!bg-primary/40 dark:!bg-primary/80": ""}`}

          >

            <button
              type="button"
              onClick={() => toggleSort(i === 4 ? `kvartaly-bonus-${q}` : `kvartaly-question-${(q - 1) * 4 + i + 1}`)}
              className={headerButtonClass(sort?.key === (i === 4 ? `kvartaly-bonus-${q}` : `kvartaly-question-${(q - 1) * 4 + i + 1}`))}
            >
              {i === 4 ? "Бонус" : (q - 1) * 4 + i + 1} {renderSortIcon(i === 4 ? `kvartaly-bonus-${q}` : `kvartaly-question-${(q - 1) * 4 + i + 1}`)}
            </button>
          </th>
        ))
      )}

    </tr>
    </thead>
  );

  // =====================================================================

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">

      {/* ===== TOP PANEL ===== */}
      <div
        className="
          flex-shrink-0
          px-3 md:px-4 lg:px-5 py-2
          bg-surface dark:bg-dark-surface
          border-b border-border dark:border-dark-border
          shadow-card
          rounded-xl
        "
      >
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">
            Таблица: {tableType === "fudzi" ? "Фудзи" : "Кварталы"}
          </div>

          <button
            onClick={() => setTopPanelOpen((v) => !v)}
            className="p-2 rounded-lg hover:bg-hover dark:hover:bg-dark-hover"
          >
            {topPanelOpen ? <ChevronUp /> : <ChevronDown />}
          </button>
        </div>

        {topPanelOpen && (
          <div className="text-sm opacity-80 space-y-1 mt-2">
            {eventName && <p>Мероприятие: {eventName}</p>}
            {locationName && <p>Площадка: {locationName}</p>}
            {leagueName && <p>Лига: {leagueName}</p>}
          </div>
        )}
      </div>

      {/* 🔍 MOBILE SEARCH */}
      <div className="md:hidden mt-2 mb-3 px-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по командам..."
          className="
      w-full px-3 py-2 rounded-lg bg-surface dark:bg-dark-surface
      border border-border dark:border-dark-border
      text-sm
    "
        />
      </div>

      {/* ====== SCROLLABLE CONTENT ====== */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto no-scrollbar py-2">

        {!isConnected && (
          <div className="p-3 rounded-lg bg-hover dark:bg-dark-hover text-sm opacity-75 text-center">
            Подключение…
          </div>
        )}

        {isConnected && tableData && (
          <>
            {/* 🖥 DESKTOP TABLE */}
            <div
              className="
                hidden md:block
                h-full
                overflow-auto no-scrollbar
                rounded-xl
                border border-border dark:border-dark-border
                shadow-card
                w-full
                h-full
              "
            >
              <table className="w-full border-collapse text-sm">
                {tableType === "fudzi"
                  ? renderFudziHeader()
                  : renderKvartalyHeader()}

                <tbody>
                {sortedData.map((team: TFudzi | TKvartal) =>
                  tableType === "fudzi"
                    ? <FudziRow key={team.id} item={team as TFudzi} />
                    : <KvartalRow key={team.id} item={team as TKvartal} />
                )}
                </tbody>
              </table>
            </div>

            {/* 📱 MOBILE CARDS */}
            <div className="md:hidden space-y-3">
              {filteredData.map((team: TFudzi | TKvartal) =>
                tableType === "fudzi"
                  ? <FudziRow key={team.id} item={team as TFudzi} />
                  : <KvartalRow key={team.id} item={team as TKvartal} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
