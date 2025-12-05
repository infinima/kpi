import React from "react";

type Status = "correct" | "incorrect" | "not_submitted";

interface FudziChange {
  type: "fudzi";
  record: any;               // лог-запись из LogTableModal
  questionIndex: number;     // 0..15
  oldStatus: Status;
  newStatus: Status;
  meta: {
    created_at: string;
    user_id: number;
  };
}

export function FudziLogRow({ change }: { change: FudziChange }) {
  if (!change) return null;

  const cols = 16;
  const team = change.record.new_data; // состояние ПОСЛЕ изменения
  const questions: { status: Status }[] =
    team.answers_fudzi?.questions ?? Array.from({ length: cols }, () => ({ status: "not_submitted" }));

  const highlightIndex = change.questionIndex;

  return (
    <table className="w-full table-fixed border-collapse border-b-[6px] border-[#1364b3] bg-white">
      <colgroup>
        <col className="w-[20%]" />   {/* Команда */}
        <col className="w-[6%]" />    {/* Штраф */}
        <col className="w-[6%]" />    {/* Итого */}
        {Array.from({ length: cols }).map((_, i) => (
          <col key={i} className="min-w-[40px]" />
        ))}
      </colgroup>

      {/* HEADER */}
      <thead className="text-white bg-[#1364b3] sticky top-0 z-20">
      <tr className="h-7 text-xs select-none">
        <th className="px-2 text-left">Команда</th>
        <th className="px-1 text-center">Штраф</th>
        <th className="px-1 text-center">Итого</th>

        {Array.from({ length: cols }).map((_, i) => (
          <th key={i} className="px-1 text-center">
            {i + 1}
          </th>
        ))}
      </tr>
      </thead>

      {/* ONE ROW */}
      <tbody>
      <tr className="bg-[#dee6ef]">
        {/* Команда */}
        <td className="px-2 py-1 whitespace-normal break-words text-left text-black">
          {team.name}
        </td>

        {/* Штраф (берём текущее penalty_fudzi) */}
        <td className="px-2 py-1 text-center font-semibold text-black">
          {team.penalty_fudzi > 0 ? `-${team.penalty_fudzi}` : ""}
        </td>

        {/* Итог (тут у тебя в логах place_fudzi, поэтому пока так) */}
        <td className="px-2 py-1 text-center font-bold text-black">
          {team.place_fudzi ?? ""}
        </td>

        {/* Ответы 1..16 */}
        {Array.from({ length: cols }).map((_, i) => {
          const ans = questions[i];
          const status: Status = ans?.status ?? "not_submitted";
          const isDiff = i === highlightIndex;

          let bg = "";
          if (status === "correct") bg = "bg-[#44d80d]";
          if (status === "incorrect") bg = "bg-[#ed4242]";

          return (
            <td
              key={i}
              className={`
                  text-center align-middle
                  border border-[#c3cedd]
                  px-1 py-1
                  ${bg}
                  ${status === "not_submitted" ? "text-black/50" : "text-black"}
                  ${isDiff ? "outline outline-2 outline-blue-500" : ""}
                `}
            >
              {/* тут можно ничего не писать, или писать статус/балл,
                   пока показываю просто статус человеко-читаемо */}
              {status === "not_submitted"
                ? ""
                : status === "correct"
                  ? "✓"
                  : "×"}
            </td>
          );
        })}
      </tr>
      </tbody>
    </table>
  );
}