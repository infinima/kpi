import {useEffect, useMemo, useState} from "react";
import { useEventsNav, useSocketStore, useUI } from "@/store";

import { FudziRow } from "@/components/FudziRow";
import { KvartalRow } from "@/components/KvartalRow";
import type { FudziRow as TFudzi, KvartalRow as TKvartal } from "@/types";
import { ChevronUp, ChevronDown } from "lucide-react";

export function TablesPage() {
  const { connect, disconnect, tableData, isConnected } = useSocketStore();
  const { eventName, locationName, leagueName, tableType } = useEventsNav();

  const hoveredColumn = useUI((s) => s.hoveredColumn);
  const setHoveredColumn = useUI((s) => s.setHoveredColumn);

  const [topPanelOpen, setTopPanelOpen] = useState(true);
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    if (!tableData) return [];

    const s = search.trim().toLowerCase();
    if (!s) return tableData;

    return tableData.filter((team: any) =>
      team.name.toLowerCase().includes(s)
    );
  }, [search, tableData]);

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
            sticky top-0 z-30 th w-24
            bg-surface dark:bg-dark-surface
            border-b border-border dark:border-dark-border
          "
      >
        Команда
      </th>

      <th
        className="
            sticky top-0 z-30 th w-16
            bg-surface dark:bg-dark-surface
            border-b border-border dark:border-dark-border
          "
      >
        Карта
      </th>

      {[...Array(16)].map((_, i) => (
        <th
          key={i}
          className={`
              sticky top-0 z-30 th text-center w-10
              bg-surface dark:bg-dark-surface
              border-b border-border dark:border-dark-border
              ${hoveredColumn === i ? "!bg-primary/10 dark:!bg-primary/20" : ""}
            `}
          onMouseEnter={() => setHoveredColumn(i)}
          onMouseLeave={() => setHoveredColumn(null)}
        >
          {i + 1}
        </th>
      ))}

      <th
        className="
            sticky top-0 z-30 th w-20
            bg-surface dark:bg-dark-surface
            border-b border-border dark:border-dark-border
          "
      >
        Штраф
      </th>

      <th
        className="
            sticky top-0 z-30 th w-20
            bg-surface dark:bg-dark-surface
            border-b border-border dark:border-dark-border
          "
      >
        Итого
      </th>
    </tr>
    </thead>
  );

  const renderKvartalyHeader = () => (
    <thead className="md:table-header-group">
    <tr>
      <th
        className="
            sticky top-0 z-30 th w-32
            bg-surface dark:bg-dark-surface
            border-b border-border dark:border-dark-border
          "
      >
        Команда
      </th>

      {[1, 2, 3, 4].map((q) => (
        <th
          key={q}
          className="
              sticky top-0 z-30 th text-center
              bg-surface dark:bg-dark-surface
              border-b border-border dark:border-dark-border
              border-r border-border dark:border-dark-border
            "
        >
          Квартал {q}
        </th>
      ))}

      <th
        className="
            sticky top-0 z-30 th w-20
            bg-surface dark:bg-dark-surface
            border-b border-border dark:border-dark-border
          "
      >
        Штраф
      </th>

      <th
        className="
            sticky top-0 z-30 th w-20
            bg-surface dark:bg-dark-surface
            border-b border-border dark:border-dark-border
          "
      >
        Итого
      </th>
    </tr>
    </thead>
  );

  // =====================================================================

  return (
    <div className="flex flex-col h-[calc(100vh-78px-16px-16px-20px)] w-full overflow-hidden">

      {/* ===== TOP PANEL ===== */}
      <div
        className="
          flex-shrink-0
          px-4 md:px-6 lg:px-8 py-3
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

      {/* ====== SCROLLABLE CONTENT ====== */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 md:px-6 lg:px-8 py-4">

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
              "
            >
              <table className="w-full border-collapse text-sm">
                {tableType === "fudzi"
                  ? renderFudziHeader()
                  : renderKvartalyHeader()}

                <tbody>
                {tableData.map((team: TFudzi | TKvartal) =>
                  tableType === "fudzi"
                    ? <FudziRow key={team.id} item={team as TFudzi} />
                    : <KvartalRow key={team.id} item={team as TKvartal} />
                )}
                </tbody>
              </table>
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