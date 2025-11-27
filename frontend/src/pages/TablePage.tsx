import { useEffect, useState } from "react";
import { useSocketStore, useEventsNav } from "@/store";

import { FudziRow } from "@/components/FudziRow";
import { KvartalyRow } from "@/components/KvartalyRow";

export function TablesPage() {
  // Сокет
  const connect = useSocketStore((s) => s.connect);
  const disconnect = useSocketStore((s) => s.disconnect);

  const tableData = useSocketStore((s) => s.tableData);
  const isConnected = useSocketStore((s) => s.isConnected);

  // Методы сокета
  const fudziSetAnswer = useSocketStore((s) => s.fudziSetAnswer);
  const fudziSetCard = useSocketStore((s) => s.fudziSetCard);
  const kvartalyAddAnswer = useSocketStore((s) => s.kvartalyAddAnswer);

  // Навигация
  const eventName = useEventsNav((s) => s.eventName);
  const locationName = useEventsNav((s) => s.locationName);
  const leagueName = useEventsNav((s) => s.leagueName);
  const tableType = useEventsNav((s) => s.tableType);

  // Ховер колонка
  const [hoverCol, setHoverCol] = useState<number | null>(null);

  // Заголовки
  const headersFudzi = [
    "Команда",
    "ID",
    "Карта",
    ...Array.from({ length: 16 }, (_, i) => `В ${i + 1}`),
    "Штраф",
    "Итого",
  ];

  const headersKvartaly = [
    "Команда",
    "ID",
    "Кв1",
    "Кв2",
    "Кв3",
    "Кв4",
    "Штраф",
    "Итого",
  ];

  const headers = tableType === "fudzi" ? headersFudzi : headersKvartaly;

  // Подключение
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [tableType]);


  console.log(tableData);

  return (
    <div className="flex flex-col w-full gap-6">

      {/* -------- TOP BAR -------- */}
      <div
        className="
          w-full px-6 py-4 rounded-xl
          bg-surface dark:bg-dark-surface
          border border-border dark:border-dark-border
          shadow-card
          flex flex-col gap-2
        "
      >
        <div className="text-2xl font-semibold">
          Таблица: {tableType === "fudzi" ? "Фудзи" : "Кварталы"}
        </div>

        <div className="text-sm opacity-80">
          {eventName && <p>Мероприятие: <b>{eventName}</b></p>}
          {locationName && <p>Площадка: <b>{locationName}</b></p>}
          {leagueName && <p>Лига: <b>{leagueName}</b></p>}
        </div>

        <div className="pt-2 text-xs opacity-50">
          (Настройки цвета появятся позже)
        </div>
      </div>

      {/* -------- STATUS -------- */}
      {!isConnected && (
        <div className="p-3 rounded-lg bg-hover dark:bg-dark-hover opacity-70">
          Подключение к таблице…
        </div>
      )}

      {/* -------- TABLE -------- */}
      {isConnected && tableData && (
        <div
          className="
            overflow-x-auto rounded-xl
            border border-border dark:border-dark-border
          "
        >
          <table className="w-full border-collapse text-sm">

            {/* HEADERS */}
            <thead>
            <tr className="bg-surface dark:bg-dark-surface border-b border-border dark:border-dark-border">
              {headers.map((h, i) => (
                <th
                  key={i}
                  onMouseEnter={() => setHoverCol(i)}
                  className={`
                      px-3 py-2 text-left font-semibold border-r 
                      border-border dark:border-dark-border whitespace-nowrap
                      ${hoverCol === i ? "bg-hover dark:bg-dark-hover" : ""}
                    `}
                >
                  {h}
                </th>
              ))}
            </tr>
            </thead>

            {/* BODY */}
            <tbody>
            {tableData.map((team: any) =>
              tableType === "fudzi" ? (
                <FudziRow
                  key={team.id}
                  item={team}

                  hoverCol={hoverCol}
                  setHoverCol={setHoverCol}

                  fudziSetAnswer={fudziSetAnswer}
                  fudziSetCard={fudziSetCard}
                />
              ) : (
                <KvartalyRow
                  key={team.id}
                  item={team}

                  hoverCol={hoverCol}
                  setHoverCol={setHoverCol}

                  kvartalyAddAnswer={kvartalyAddAnswer}
                />
              )
            )}
            </tbody>

          </table>
        </div>
      )}
    </div>
  );
}