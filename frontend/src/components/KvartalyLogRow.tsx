import React from "react";

export function KvartalyLogRow({ change }: any) {
  if (!change) return null;

  const qI = change.quarterIndex;
  const aI = change.questionIndex;

  const highlight = (qi: number, ai: number) => qi === qI && ai === aI;

  const toText = (v: any) => `${v.correct}/${v.incorrect}`;

  return (
    <table className="w-full border-collapse text-sm">
      <thead className="sticky top-0 z-20 text-white bg-[#1364b3]">
      <tr className="h-7 text-xs select-none">

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

        {/* пустая под "Команда" */}
        <th />

        {[1,2,3,4].map(q =>
          [...Array(5)].map((_,i)=>(
            <th key={`${q}-${i}`} className="px-1 text-center">
              {i===4 ? "Бонус" : (q-1)*4 + i + 1}
            </th>
          ))
        )}

        <th />
        <th />
      </tr>
      </thead>

      <tbody>
      <tr className="bg-[#dee6ef]">

        {/* Name */}
        <td className="px-2 py-1 text-left font-medium">
          {change.teamName ?? "—"}
        </td>

        {/* Кварталы */}
        {change.oldAll.map((q: any, qi: number) => {

          return (
            <React.Fragment key={qi}>
              {q.questions.map((a: any, ai: number) => {
                const isDiff = highlight(qi, ai);

                const val = isDiff ? change.new : change.old;

                return (
                  <td
                    key={ai}
                    className={`
                      px-1 py-1 border text-center
                      ${isDiff ? "outline outline-2 outline-blue-500" : ""}
                    `}
                  >
                    {toText(val)}
                  </td>
                );
              })}

              {/* бонус */}
              <td className="px-1 py-1 text-center font-semibold">
                {q.finished ? q.bonus : ""}
              </td>
            </React.Fragment>
          );
        })}

        {/* penalty */}
        <td className="px-2 py-1 text-center">
          {change.oldPenalty ?? ""}
        </td>

        {/* total */}
        <td className="px-2 py-1 font-semibold text-center">
          {change.oldTotal ?? ""}
        </td>
      </tr>
      </tbody>
    </table>
  );
}