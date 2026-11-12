import type { FudziSnapshot } from "../model/snapshot";

export function FudziLogRow({ snapshot: team, highlightIndex }: { snapshot: FudziSnapshot; highlightIndex: number | null; }) {
    const cols = 16;
    const questions = team.questions;

    return (
        <table className="w-full border-collapse text-sm rounded-lg overflow-hidden border border-border dark:border-dark-border bg-surface dark:bg-dark-surface">
            <thead className="text-white bg-[#1364b3] sticky top-0 z-20">
                <tr className="h-7 text-xs">
                    <th className="px-2 text-left">Команда</th>
                    <th className="px-2 text-center">Штраф</th>
                    <th className="px-2 text-center">Итого</th>

                    {Array.from({ length: cols }).map((_, i) => (
                        <th key={i} className="px-1 text-center w-12">
                            {i + 1}
                        </th>
                    ))}
                </tr>
            </thead>

            <tbody>
                <tr className="border-b border-border dark:border-dark-border bg-white/30">
                    {/* Команда */}
                    <td className="px-2 py-1 text-center text-base border-r border-border dark:border-dark-border">
                        {team.name}
                    </td>

                    {/* Штраф */}
                    <td
                        className={`
              px-2 py-1 text-center font-semibold border-r border-border dark:border-dark-border
              ${team.penalty > 0 ? "text-red-500" : ""}
            `}
                    >
                        {team.penalty}
                    </td>

                    {/* Итог */}
                    <td className="px-2 py-1 text-center font-bold border-r border-border dark:border-dark-border">
                        {team.place ?? ""}
                    </td>

                    {questions.map((ans, i) => {
                        const status = ans?.status ?? "not_submitted";
                        const isDiff = i === highlightIndex;

                        let color = "";
                        if (status === "correct") color = "text-green-500";
                        if (status === "incorrect") color = "text-red-500";
                        if (status === "not_submitted") color = "opacity-40 text-black";

                        return (
                            <td
                                key={i}
                                className={`
                  text-center w-12 py-1 border-r border-border dark:border-dark-border
                  ${color}
                  ${isDiff ? "outline outline-2 outline-blue-500 font-bold text-blue-700 bg-blue-50" : ""}
                `}
                            >
                                {status === "correct" ? "✓" : status === "incorrect" ? "×" : ""}
                            </td>
                        );
                    })}
                </tr>
            </tbody>
        </table>
    );
}
