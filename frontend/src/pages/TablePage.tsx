import { useEffect } from "react";
import { useSocketStore, useEventsNav } from "@/store";

import { FudziRow } from "@/components/FudziRow";
import { KvartalRow } from "@/components/KvartalRow";
import type { FudziRow as TFudzi, KvartalRow as TKvartal } from "@/types";

export function TablesPage() {

  const { connect, disconnect, tableData, isConnected } = useSocketStore();
  const { eventName, locationName, leagueName, tableType } = useEventsNav();

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [tableType]);

  const renderFudziHeader = () => (
    <thead className="hidden md:table-header-group sticky top-0 z-30">
    <tr className="bg-surface dark:bg-dark-surface border-b border-border dark:border-dark-border">
      <th className="th w-24">Команда</th>
      <th className="th w-16">Карта</th>
      {[...Array(16)].map((_, i) => (
        <th key={i} className="th text-center w-10">{i + 1}</th>
      ))}
      <th className="th w-17">Штраф</th>
      <th className="th w-15">Итого</th>
    </tr>
    </thead>
  );

  // ----- Заголовки для Кварталов -----
  const renderKvartalyHeader = () => (
    <thead className="hidden md:table-header-group sticky top-0 z-30">
    {/* первая строка */}
    <tr className="bg-surface dark:bg-dark-surface border-b border-border dark:border-dark-border">
      <th rowSpan={2} className="th">Команда</th>

      {[1, 2, 3, 4].map((q) => (
        <th key={q} className="th border-r border-border dark:border-dark-border">
          Квартал {q}
        </th>
      ))}

      <th rowSpan={2} className="th">Штраф</th>
      <th rowSpan={2} className="th">Итого</th>
    </tr>
    </thead>
  );

  return (
    <div className="flex flex-col gap-6 w-full px-4 md:px-6 lg:px-8">

      {/* ===== TOP PANEL ===== */}
      <div className="
        rounded-xl p-4
        bg-surface dark:bg-dark-surface
        border border-border dark:border-dark-border
        shadow-card
      ">
        <div className="text-2xl font-bold">
          Таблица: {tableType === "fudzi" ? "Фудзи" : "Кварталы"}
        </div>

        <div className="text-sm opacity-80 space-y-1 mt-1">
          {eventName && <p>Мероприятие: {eventName}</p>}
          {locationName && <p>Площадка: {locationName}</p>}
          {leagueName && <p>Лига: {leagueName}</p>}
        </div>
      </div>

      {/* ===== CONNECTION STATUS ===== */}
      {!isConnected && (
        <div className="p-3 rounded-lg bg-hover dark:bg-dark-hover text-sm opacity-75 text-center">
          Подключение…
        </div>
      )}

      {/* ===== TABLE / CARDS ===== */}
      {isConnected && tableData && (
        <div
          className="
            overflow-x-auto rounded-xl
            border border-border dark:border-dark-border
            shadow-card
          "
        >
          <table className="hidden md:table w-full border-collapse text-sm">

            {tableType === "fudzi"
              ? renderFudziHeader()
              : renderKvartalyHeader()}

            <tbody>
            {tableData.map((team: TFudzi | TKvartal) =>
              tableType === "fudzi" ? (
                <FudziRow key={team.id} item={team as TFudzi} />
              ) : (
                <KvartalRow key={team.id} item={team as TKvartal} />
              )
            )}
            </tbody>
          </table>

          {/* ----- MOBILE VERSION ----- */}
          <div className="md:hidden space-y-3 py-1">
            {tableData.map((team: TFudzi | TKvartal) =>
              tableType === "fudzi" ? (
                <FudziRow key={team.id} item={team as TFudzi} />
              ) : (
                <KvartalRow key={team.id} item={team as TKvartal} />
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}