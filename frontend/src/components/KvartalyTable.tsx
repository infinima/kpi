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

export function KvartalyTable({ data }: { data: KvartalyTeam[] }) {

  return (
    <div className="w-full h-[143%] overflow-y-auto">
      <table className="w-full table-fixed border-collapse border-b-[6px] border-[#1364b3] bg-white">

        {/* COLGROUP */}
        <colgroup>
          <col className="w-[15%] border-[#1364b3] border-r-[2px]"  />  {/* Команда */}
          <col className="w-[5%] border-[#1364b3] border-r-[2px]" />  {/* Итого */}
          <col className="w-[5%] border-[#1364b3] border-r-[2px]" />  {/* Штраф */}
          {/* 20 заданий */}
          {Array.from({ length: 20 }).map((_, i) => (
            <col key={i} className="min-w-[40px]" />
          ))}
        </colgroup>

        {/* ───────────────── HEADER ───────────────── */}
        <thead className="text-white sticky top-0 z-30">
        {/* First header row */}
        <tr className="bg-[#1364b3] h-6 text-sm select-none text-center " >
          <th className="px-1 py-0 text-center " rowSpan={2}>Команда</th>
          <th className="px-0 py-0 text-center" rowSpan={2}>Итого</th>
          <th className="px-1 py-0 text-center " rowSpan={2}>Штраф</th>

          {Array.from({ length: 4 }).map((_, q) => (
            <th
              key={q}
              colSpan={5}
              className="px-1 py-0 text-center border-b border-[#1364b3] border-r-[2px]"
            >
              Квартал {q + 1}
            </th>
          ))}
        </tr>

        {/* Second header row */}
        <tr className="bg-[#1364b3] h-6 text-sm sticky top-6 z-20 select-none">

          {Array.from({ length: 4 }).map((_, q) =>
            [
              ...Array.from({ length: 4 }).map((_, t) => (
                <th key={`${q}_${t}`} className="text-center">
                  {q * 4 + t + 1}
                </th>
              )),
              <th key={`bonus_${q}`} className="text-center border-r-[2px] border-[#1364b3]">Б</th>
            ]
          )}
        </tr>
        </thead>

        {/* ───────────────── BODY ───────────────── */}
        <tbody>
        {data.map((team, idx) => (
          <tr key={team.id} className={idx % 2 === 0 ? "bg-[#dee6ef]" : ""}>
            {/* Команда */}
            <td className="px-2 py-1 whitespace-normal break-words text-black">
              {team.name}
            </td>

            {/* Итого */}
            <td className="text-center font-semibold text-black ">
              {team.total}
            </td>

            {/* Штраф */}
            <td className="text-center font-semibold text-black">
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
                      className={`text-center px-1 py-1 ${bg}`}
                    >
                      {ans.score !== 0 ? ans.score : ""}
                    </td>
                  );
                })}

                {/* Bonus column */}
                <td
                  className={`
                      text-center font-bold
                      border-l-[2px] border-r-[2px] border-[#1364b3]
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