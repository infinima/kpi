import React from "react";

interface FudziAnswer {
  score: number;
  status: "correct" | "incorrect" | "not_submitted";
}

interface FudziTeam {
  id: number;
  name: string;
  has_card: boolean;
  penalty: number;
  total: number;
  answers: FudziAnswer[];
}

export function FudziTable({ data }: { data: FudziTeam[] }) {
  return (
    <div className="w-full h-full overflow-y-auto">
    <table className="w-full table-fixed border-collapse border-b-[6px] border-[#1364b3] bg-white ">

    {/* === COLUMN SIZES === */}
    <colgroup>
    <col className="w-[15%]" />   {/* Команда */}
      <col className="w-[5%]" />    {/* Карточка */}
    <col className="w-[5%]" />    {/* Штраф */}
    <col className="w-[5%]" />    {/* Итог */}
  {Array.from({ length: 16 }).map((_, i) => (
    <col key={i} className="min-w-[40px]" />
  ))}
  </colgroup>

  {/* === HEADER === */}
  <thead className="text-white bg-[#1364b3] sticky top-0 z-30">
  <tr className="h-6 text-sm select-none">

  <th className="px-1 py-0 text-left">Команда</th>
    <th className="px-1 py-0 text-center">Карта</th>
    <th className="px-1 py-0 text-center">Штраф</th>
    <th className="px-1 py-0 text-center">Итого</th>

  {Array.from({ length: 16 }).map((_, i) => (
    <th key={i} className="px-0 py-0 text-center">
    {i + 1}
    </th>
  ))}

  </tr>
  </thead>

  {/* === BODY === */}
  <tbody>

    {data.map((team, idx) => (
        <tr
          key={team.id}
      className={`
                ${idx % 2 === 0 ? "bg-[#dee6ef]" : ""}
              `}
  >
  {/* === TEAM NAME === */}
  <td className="px-2 py-1 whitespace-normal break-words text-left text-black">
    {team.name}
    </td>

  {/* === CARD STATUS === */}
          <td className="text-center p-1">
            <div
              className={`
       h-full rounded-lg w-full text-sm font-small 
      ${team.has_card ? "bg-[#44d80d]" : "bg-[#ed4242]"}
    `}
            >
              {team.has_card ? "Да" : "Нет"}
            </div>
          </td>

  {/* === PENALTY === */}
  <td className="text-center font-semibold text-black">
    {team.penalty > 0 ? `-${team.penalty}` : ""}
    </td>

  {/* === TOTAL === */}
  <td className="text-center font-bold text-black">
    {team.total}
    </td>

  {/* === ANSWERS === */}
  {team.answers.map((ans, i) => {
    let bg = "";

    if (ans.status === "correct") bg = "bg-[#44d80d]";
    if (ans.status === "incorrect") bg = "bg-[#ed4242]";
    // not_submitted → пустая ячейка

    return (
      <td
        key={i}
    className={`
                      text-center
                      ${bg}
                    `}
  >
    {ans.score > 0 ? ans.score : ""}
    </td>
  );
  })}

  </tr>
))}

  </tbody>
  </table>
  </div>
);
}