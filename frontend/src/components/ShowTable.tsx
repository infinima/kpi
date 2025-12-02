import React, {useEffect} from "react";
import {useEventsNav, useSocketStore, useUI} from "@/store";
import { KvartalyTable } from "./KvartalyTable";
import { FudziTable } from "./FudziTable";

export function ShowTable({tableType} : { tableType: string }) {
  const { tableData, isConnected , connect, disconnect } = useSocketStore();

  const dualMode = useUI(s => s.dualMode);
  console.log("dual mode", dualMode);

  if (!isConnected) {
    return (
      <div className="flex w-full h-full items-center justify-center text-xl opacity-70">
        Подключение…
      </div>
    );
  }

  if (!tableData) {
    return (
      <div className="flex w-full h-full items-center justify-center text-xl opacity-70">
        Загрузка…
      </div>
    );
  }

  if (tableType === "kvartaly") {
    if (!dualMode) return <KvartalyTable data={tableData} />;

    // dual mode ON — split data
    const mid = Math.ceil(tableData.length / 2);

    const left = tableData.slice(0, mid);
    const right = tableData.slice(mid);

    return (
      <div className="flex w-full h-full border-none">
        <div className="w-1/2 overflow-auto border-none">
          <KvartalyTable data={left} />
        </div>

        <div className="w-1/2 overflow-auto border-none">
          <KvartalyTable data={right} />
        </div>
      </div>
    );
  }

  if (tableType === "fudzi") {
    if (!dualMode) return <FudziTable data={tableData} />;

    const mid = Math.ceil(tableData.length / 2);

    const left = tableData.slice(0, mid);
    const right = tableData.slice(mid);

    return (
      <div className="flex w-full h-full border-none">
        <div className="w-1/2 overflow-auto">
          <FudziTable data={left} />
        </div>

        <div className="w-1/2 overflow-auto">
          <FudziTable data={right} />
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      Неизвестный тип таблицы: {tableType}
    </div>
  );
}