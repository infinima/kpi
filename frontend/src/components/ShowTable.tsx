import React, {useEffect} from "react";
import {useEventsNav, useSocketStore} from "@/store";
import { KvartalyTable } from "./KvartalyTable";
import { FudziTable } from "./FudziTable";

export function ShowTable({tableType} : { tableType: string }) {
  const { tableData, isConnected , connect, disconnect } = useSocketStore();

  useEffect(() => {
    connect();
    return () => disconnect();
  }, []);


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
    return <KvartalyTable data={tableData} />;
  }

  if (tableType === "fudzi") {
    return <FudziTable data={tableData} />;
  }

  return (
    <div className="text-center">
      Неизвестный тип таблицы: {tableType}
    </div>
  );
}