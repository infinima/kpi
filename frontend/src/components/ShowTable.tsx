import { useSocketStore } from "@/store/useTableSocket";
import { KvartalyTable } from "./KvartalyTable";
import { FudziTable } from "./FudziTable";

export function ShowTable({ tableType, dualMode = false } : { tableType: string; dualMode?: boolean }) {
  const { tableData, isConnected } = useSocketStore();

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
    if (!dualMode) return (
      <div className="flex border-none bg-[#1364b3] origin-top-left scale-[0.70] w-[143%] h-[143%]">
        <KvartalyTable data={tableData} />
      </div>
    );

    // dual mode ON — split data
    const mid = Math.ceil(tableData.length / 2);

    const left = tableData.slice(0, mid);
    const right = tableData.slice(mid);

    return (
      <div className="flex  border-none bg-[#1364b3] origin-top-left scale-[0.70] w-[143%] h-[143%]">
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
    if (!dualMode) return (
      <div className="flex border-none bg-[#1364b3] origin-top-left scale-[0.70] w-[143%] h-[143%]">
        <FudziTable data={tableData} />
      </div>
    );

    const mid = Math.ceil(tableData.length / 2);

    const left = tableData.slice(0, mid);
    const right = tableData.slice(mid);

    return (
      <div className="flex  border-none bg-[#1364b3] origin-top-left scale-[0.70] w-[143%] h-[143%]">
        <div className="w-1/2 overflow-auto border-r-[6px] border-[#1364b3]">
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
