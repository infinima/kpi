import type { FudziTeam, KvartalyTeam, TableTeams } from "@/entities/results/model/protocol";
import { FudziTable } from "@/entities/results/ui/FudziTable";
import { KvartalyTable } from "@/entities/results/ui/KvartalyTable";

export function ShowTable({ tableType, dualMode = false, tableData, isConnected }: { tableType: string; dualMode?: boolean; tableData: TableTeams | null; isConnected: boolean; }) {

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
                <KvartalyTable data={tableData as KvartalyTeam[]} />
            </div>
        );

        // dual mode ON — split data
        const mid = Math.ceil(tableData.length / 2);

        const left = tableData.slice(0, mid);
        const right = tableData.slice(mid);

        return (
            <div className="flex  border-none bg-[#1364b3] origin-top-left scale-[0.70] w-[143%] h-[143%]">
                <div className="w-1/2 overflow-auto border-none">
                    <KvartalyTable data={left as KvartalyTeam[]} />
                </div>

                <div className="w-1/2 overflow-auto border-none">
                    <KvartalyTable data={right as KvartalyTeam[]} />
                </div>
            </div>
        );
    }

    if (tableType === "fudzi") {
        if (!dualMode) return (
            <div className="flex border-none bg-[#1364b3] origin-top-left scale-[0.70] w-[143%] h-[143%]">
                <FudziTable data={tableData as FudziTeam[]} />
            </div>
        );

        const mid = Math.ceil(tableData.length / 2);

        const left = tableData.slice(0, mid);
        const right = tableData.slice(mid);

        return (
            <div className="flex  border-none bg-[#1364b3] origin-top-left scale-[0.70] w-[143%] h-[143%]">
                <div className="w-1/2 overflow-auto border-r-[6px] border-[#1364b3]">
                    <FudziTable data={left as FudziTeam[]} />
                </div>

                <div className="w-1/2 overflow-auto">
                    <FudziTable data={right as FudziTeam[]} />
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
