import React from "react";

export function KvartalyLogRow({ change }: any) {
  if (!change) return null;

  const team = change.record.new_data;

  return (
    <table className="w-full border-collapse text-sm rounded-lg overflow-hidden border border-border dark:border-dark-border bg-surface dark:bg-dark-surface">
      <thead className="text-white bg-[#1364b3] sticky top-0 z-20">
      <tr className="h-7 text-xs">
        <th className="px-2 text-left">Команда</th>

        {[1,2,3,4].map((q)=>(
          <th key={q} colSpan={5} className="px-2 text-center">
            Квартал {q}
          </th>
        ))}

        <th className="px-2 text-center">Штраф</th>
        <th className="px-2 text-center">Итого</th>
      </tr>

      <tr className="h-6 text-xs">
        <th />

        {[1,2,3,4].map(q =>
          [...Array(5)].map((_,i)=>(
            <th key={`${q}-${i}`} className="px-1 text-center w-10">
              {i===4 ? "Бонус" : (q-1)*4 + i + 1}
            </th>
          ))
        )}

        <th />
        <th />
      </tr>
      </thead>

      <tbody>
      <tr className="border-b border-border dark:border-dark-border bg-white/30">
        {/* NAME */}
        <td className="px-2 py-1 text-left font-medium border-r border-border dark:border-dark-border">
          {team.name}
        </td>

        {/* QUARTERS */}
        {team.answers_kvartaly.map((q: any, qi: number) => {

          return (
            <React.Fragment key={qi}>
              {q.questions.map((a: any, ai: number) => {
                const isDiff =
                  qi === change.quarterIndex &&
                  ai === change.questionIndex;

                const color =
                  a.correct > 0 && a.incorrect > 0
                    ? "text-yellow-500"
                    : a.correct > 0
                      ? "text-green-500"
                      : a.incorrect > 0
                        ? "text-red-500"
                        : "text-gray-500";

                return (
                  <td
                    key={ai}
                    className={`
                        text-center w-10 py-1 border-r border-border dark:border-dark-border
                        ${color}
                        ${isDiff ? "outline outline-2 outline-blue-500 font-bold text-blue-700 bg-blue-50" : ""}
                      `}
                  >
                    {`${a.correct}/${a.incorrect}`}
                  </td>
                );
              })}

              {/* BONUS */}
              <td
                className={`
                    text-center w-10 py-1 border-r border-border dark:border-dark-border font-semibold
                    ${q.finished ? (q.bonus ? "text-green-500" : "text-red-500") : "opacity-40"}
                  `}
              >
                {q.finished ? q.bonus : ""}
              </td>
            </React.Fragment>
          );
        })}

        {/* PENALTY */}
        <td
          className={`
              text-center py-1 border-r border-border dark:border-dark-border
              ${team.penalty_kvartaly > 0 ? "text-red-500" : ""}
            `}
        >
          {team.penalty_kvartaly}
        </td>

        {/* TOTAL */}
        <td className="text-center py-1 font-semibold">
          {team.place_kvartaly ?? ""}
        </td>
      </tr>
      </tbody>
    </table>
  );
}