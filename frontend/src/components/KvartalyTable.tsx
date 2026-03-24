import React from "react";

interface KvartalyTeam {
  id: number;
  name: string;
  penalty: number;
  total: number;
  quarters: {
    finished: boolean;
    bonus: number;
    total: number;
    answers: {
      correct: number;
      incorrect: number;
      score: number;
    }[];
  }[];
}

type KvartalyTableProps = {
  data: KvartalyTeam[];
  variant?: "show" | "site";
};

export function KvartalyTable({ data, variant = "show" }: KvartalyTableProps) {
  const isSite = variant === "site";
  const wrapperClass = isSite
    ? "w-full overflow-auto rounded-[24px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.9)] shadow-[0_16px_48px_rgba(15,23,42,0.08)]"
    : "w-full h-[143%] overflow-y-auto";
  const tableClass = isSite
    ? "w-full min-w-[1320px] table-fixed border-collapse bg-transparent text-[13px] text-[var(--color-text-main)]"
    : "w-full table-fixed border-collapse border-b-[6px] border-[#1364b3] bg-white";
  const headClass = isSite
    ? "sticky top-0 z-30 text-white"
    : "text-white sticky top-0 z-30";
  const headerRowClass = isSite
    ? "h-10 bg-[var(--color-primary)] text-sm select-none text-center"
    : "bg-[#1364b3] h-6 text-sm select-none text-center";
  const headerSubRowClass = isSite
    ? "h-10 bg-[var(--color-primary)] text-sm select-none"
    : "bg-[#1364b3] h-6 text-sm sticky top-6 z-20 select-none";
  const teamCellClass = isSite
    ? "px-3 py-2 whitespace-normal break-words border-b border-r border-[var(--color-border)]"
    : "px-2 py-1 whitespace-normal break-words text-black";
  const totalCellClass = isSite
    ? "text-center font-semibold border-b border-r border-[var(--color-border)]"
    : "text-center font-semibold text-black";
  const penaltyCellClass = isSite
    ? "text-center font-semibold border-b border-r border-[var(--color-border)]"
    : "text-center font-semibold text-black";
  const baseAnswerCellClass = isSite
    ? "px-1 py-2 text-center border-b border-r border-[var(--color-border)]"
    : "text-center px-1 py-1";
  const bonusCellClass = isSite
    ? "text-center font-bold border-b border-r border-[var(--color-border)]"
    : "text-center font-bold border-l-[2px] border-r-[2px] border-[#1364b3]";

  return (
    <div className={wrapperClass}>
      <table className={tableClass}>

        {/* COLGROUP */}
        <colgroup>
          <col className={isSite ? "w-[16%]" : "w-[15%] border-[#1364b3] border-r-[2px]"} />
          <col className={isSite ? "w-[6%]" : "w-[5%] border-[#1364b3] border-r-[2px]"} />
          <col className={isSite ? "w-[6%]" : "w-[5%] border-[#1364b3] border-r-[2px]"} />
          {/* 20 заданий */}
          {Array.from({ length: 20 }).map((_, i) => (
            <col key={i} className="min-w-[40px]" />
          ))}
        </colgroup>

        {/* ───────────────── HEADER ───────────────── */}
        <thead className={headClass}>
        {/* First header row */}
        <tr className={headerRowClass}>
          <th className="px-1 py-0 text-center " rowSpan={2}>Команда</th>
          <th className="px-0 py-0 text-center" rowSpan={2}>Итого</th>
          <th className="px-1 py-0 text-center " rowSpan={2}>Штраф</th>

          {Array.from({ length: 4 }).map((_, q) => (
            <th
              key={q}
              colSpan={5}
              className={isSite
                ? "px-1 py-0 text-center border-b border-r border-white/20"
                : "px-1 py-0 text-center border-b border-[#1364b3] border-r-[2px]"}
            >
              Квартал {q + 1}
            </th>
          ))}
        </tr>

        {/* Second header row */}
        <tr className={headerSubRowClass}>

          {Array.from({ length: 4 }).map((_, q) =>
            [
              ...Array.from({ length: 4 }).map((_, t) => (
                <th key={`${q}_${t}`} className={isSite ? "text-center border-r border-white/15" : "text-center"}>
                  {q * 4 + t + 1}
                </th>
              )),
              <th
                key={`bonus_${q}`}
                className={isSite ? "text-center border-r border-white/20" : "text-center border-r-[2px] border-[#1364b3]"}
              >
                Б
              </th>
            ]
          )}
        </tr>
        </thead>

        {/* ───────────────── BODY ───────────────── */}
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
            {/* Команда */}
            <td className={teamCellClass}>
              {team.name}
            </td>

            {/* Итого */}
            <td className={totalCellClass}>
              {team.total}
            </td>

            {/* Штраф */}
            <td className={penaltyCellClass}>
              {team.penalty > 0 ? `-${team.penalty}` : ""}
            </td>

            {/* Quarter answers + bonus */}
            {team.quarters.map((q, qi) => (
              <React.Fragment key={qi}>
                {q.answers.map((ans, ai) => {
                  let bg = "";
                  if (ans.score > 0) bg = "bg-[#44d80d]";
                  else if (ans.score < 0) bg = "bg-[#ed4242]";

                  return (
                    <td
                      key={`${qi}_${ai}`}
                      className={`${baseAnswerCellClass} ${bg}`}
                    >
                      {ans.score !== 0 ? ans.score : ""}
                    </td>
                  );
                })}

                {/* Bonus column */}
                <td
                  className={`
                      ${bonusCellClass}
                      ${q.bonus > 0 ? "bg-[#44d80d]" : ""}
                    `}
                >
                  {q.bonus > 0 ? q.bonus : ""}
                </td>
              </React.Fragment>
            ))}
          </tr>
        ))}
        </tbody>

      </table>
    </div>
  );
}
