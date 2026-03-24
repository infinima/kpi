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

type FudziTableProps = {
  data: FudziTeam[];
  variant?: "show" | "site";
};

export function FudziTable({ data, variant = "show" }: FudziTableProps) {
  const isSite = variant === "site";
  const wrapperClass = isSite
    ? "w-full overflow-auto rounded-[24px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.9)] shadow-[0_16px_48px_rgba(15,23,42,0.08)]"
    : "w-full h-[143%] overflow-y-auto";
  const tableClass = isSite
    ? "w-full min-w-[1180px] table-fixed border-collapse bg-transparent text-[13px] text-[var(--color-text-main)]"
    : "w-full table-fixed border-collapse border-b-[6px] border-[#1364b3] bg-white";
  const headerClass = isSite
    ? "sticky top-0 z-30 bg-[var(--color-primary)] text-white"
    : "text-white bg-[#1364b3] sticky top-0 z-30";
  const teamCellClass = isSite
    ? "px-3 py-2 whitespace-normal break-words border-b border-r border-[var(--color-border)] text-left"
    : "px-2 py-1 whitespace-normal break-words text-left text-black";
  const penaltyCellClass = isSite
    ? "text-center font-semibold border-b border-r border-[var(--color-border)]"
    : "text-center font-semibold text-black";
  const totalCellClass = isSite
    ? "text-center font-bold border-b border-r border-[var(--color-border)]"
    : "text-center font-bold text-black";
  const answerCellClass = isSite
    ? "text-center border-b border-r border-[var(--color-border)]"
    : "text-center";

  return (
    <div className={wrapperClass}>
    <table className={tableClass}>

    {/* === COLUMN SIZES === */}
    <colgroup>
    <col className={isSite ? "w-[16%]" : "w-[15%]"} />
    <col className={isSite ? "w-[6%]" : "w-[5%]"} />
    <col className={isSite ? "w-[6%]" : "w-[5%]"} />
  {Array.from({ length: 16 }).map((_, i) => (
    <col key={i} className="min-w-[40px]" />
  ))}
  </colgroup>

  {/* === HEADER === */}
  <thead className={headerClass}>
  <tr className={isSite ? "h-10 text-sm select-none" : "h-6 text-sm select-none"}>

  <th className="px-1 py-0 text-left">Команда</th>
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
      className={isSite
        ? idx % 2 === 0
          ? "bg-[rgba(248,250,252,0.88)]"
          : "bg-[rgba(255,255,255,0.84)]"
        : idx % 2 === 0
          ? "bg-[#dee6ef]"
          : ""}
  >
  {/* === TEAM NAME === */}
  <td className={teamCellClass}>
    {team.name}
    </td>

  {/* === CARD STATUS === */}


  {/* === PENALTY === */}
  <td className={penaltyCellClass}>
    {team.penalty > 0 ? `-${team.penalty}` : ""}
    </td>

  {/* === TOTAL === */}
  <td className={totalCellClass}>
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
                      ${answerCellClass}
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
