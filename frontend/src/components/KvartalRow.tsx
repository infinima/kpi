import React, { useState } from "react";
import { useSocketStore } from "@/store";
import {
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { KvartalRow as KvartalRowType } from "@/types";

type Props = { item: KvartalRowType };

export function KvartalRow({ item }: Props) {
  const send = useSocketStore((s) => s.kvartalyAddAnswer);

  const [popup, setPopup] = useState<{
    x: number;
    y: number;
    q: number;
  } | null>(null);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [openQuarter, setOpenQuarter] = useState<number | null>(null);

  // ---- POPUP OPEN ----
  function openPopup(e: React.MouseEvent, q: number) {
    const r = e.currentTarget.getBoundingClientRect();
    setPopup({
      q,
      x: r.left,
      y: r.bottom + 4,
    });
  }

  function change(q: number, dc: number, di: number) {
    send(item.id, q, dc, di);
    setPopup(null);
  }

  console.log(item)

  // ============ DESKTOP VERSION ============
  const desktop = (
    <>
      <tr className="hidden md:table-row hover:bg-hover/50 dark:hover:bg-dark-hover/50">

        {/* Команда */}
        <td className="td text-center py-4 font-medium border-r border-border dark:border-dark-border">
          {item.name}
        </td>

        {/* Кварталы */}
        {item.quarters.map((q, qi) => {
          const baseIndex = qi * 5;

          return (
            <td
              key={qi}
              className="
                td p-0 border-r border-border dark:border-dark-border
                align-top
              "
            >
              <div className="
                flex flex-col items-center justify-start
                p-2 gap-2 rounded-xl
                bg-hover/20 dark:bg-dark-hover/20
                mx-auto w-[140px]
              ">

                {/* Статус */}
                <div
                  className={`
                    text-sm font-medium
                    ${q.finished ? "text-green-500" : "text-red-500"}
                  `}
                >
                  {q.finished ? "Сдан" : "Не сдан"}
                </div>

                <div className="flex gap-2">
                  {q.answers.map((a, i) => {
                    const qNum = baseIndex + i + 1;

                    return (
                      <div
                        key={i}
                        onClick={(e) => openPopup(e, qNum)}
                        className="
                          w-8 h-10 rounded-lg
                          flex items-center justify-center
                          cursor-pointer
                          border border-border dark:border-dark-border
                          text-sm
                          hover:bg-hover dark:hover:bg-dark-hover
                        "
                      >
                        {a.score}
                      </div>
                    );
                  })}
                </div>

                {/* Бонус */}
                <div className="text-xs opacity-60">
                  Бонус: {q.bonus}
                </div>





              </div>
            </td>
          );
        })}

        {/* Штраф */}
        <td className="td text-center py-4 border-r">{item.penalty}</td>

        {/* Итог */}
        <td className="td text-center py-4 font-semibold">{item.total}</td>
      </tr>

      {popup && (
        <div
          className="
            fixed z-50 w-64 rounded-xl py-3 px-4
            bg-surface dark:bg-dark-surface
            border border-border dark:border-dark-border
            shadow-xl space-y-4
          "
          style={{ top: popup.y, left: popup.x }}
        >
          <div className="flex items-center justify-between pb-2 border-b border-border dark:border-dark-border">
            <span className="font-semibold text-sm">Вопрос {popup.q}</span>

            <button
              onClick={() => setPopup(null)}
              className="p-1 rounded-lg hover:bg-hover dark:hover:bg-dark-hover"
            >
              <XCircle size={18} className="opacity-60"/>
            </button>
          </div>

          {/** Правильные */}
          <div>
            <div className="text-xs opacity-70 mb-1">Правильных</div>
            <div className="flex justify-between items-center">
              <button
                className="px-3 py-1 rounded-lg bg-hover dark:bg-dark-hover"
                onClick={() => change(popup.q, -1, 0)}
              >
                -1
              </button>

              <div className="px-3 py-1 rounded-lg border w-16 text-center">
                {
                  item.quarters[Math.floor((popup.q - 1) / 5)]
                    .answers[(popup.q - 1) % 5].correct
                }
              </div>

              <button
                className="px-3 py-1 rounded-lg bg-hover dark:bg-dark-hover"
                onClick={() => change(popup.q, +1, 0)}
              >
                +1
              </button>
            </div>
          </div>

          {/** Неправильные */}
          <div>
            <div className="text-xs opacity-70 mb-1">Неправильных</div>
            <div className="flex justify-between items-center">
              <button
                className="px-3 py-1 rounded-lg bg-hover dark:bg-dark-hover"
                onClick={() => change(popup.q, 0, -1)}
              >
                -1
              </button>

              <div className="px-3 py-1 rounded-lg border w-16 text-center">
                {
                  item.quarters[Math.floor((popup.q - 1) / 5)]
                    .answers[(popup.q - 1) % 5].incorrect
                }
              </div>

              <button
                className="px-3 py-1 rounded-lg bg-hover dark:bg-dark-hover"
                onClick={() => change(popup.q, 0, +1)}
              >
                +1
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // ===== MOBILE =====
  const mobile = (
    <tr className="md:hidden">
      <td className="p-2" colSpan={999}>
        <div className="p-4 rounded-xl bg-surface dark:bg-dark-surface border shadow-card">

          {/* Header */}
          <div className="flex justify-between items-center mb-2">
            <div>
              <div className="font-semibold text-base">{item.name}</div>
              <div className="text-xs opacity-70">
                Итог: {item.total} · Штраф: {item.penalty}
              </div>
            </div>

            <button
              className="p-2 rounded-lg bg-hover dark:bg-dark-hover"
              onClick={() => setMobileOpen(v => !v)}
            >
              {mobileOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
            </button>
          </div>

          {mobileOpen && (
            <div className="space-y-3 mt-2">
              {item.quarters.map((q, qi) => (
                <div
                  key={qi}
                  className="border rounded-lg p-3 bg-hover/10 dark:bg-dark-hover/10"
                >
                  <button
                    onClick={() => setOpenQuarter(openQuarter === qi ? null : qi)}
                    className="w-full flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium">Квартал {qi + 1}</div>
                      <div className="text-xs opacity-70 mt-1">
                        Баллы: {q.total} · Бонус: {q.bonus}
                      </div>
                    </div>

                    {openQuarter === qi ? <ChevronUp/> : <ChevronDown/>}
                  </button>

                  {openQuarter === qi && (
                    <div className="mt-3 grid grid-cols-5 gap-2">
                      {q.answers.map((a, i) => {
                        const qNum = qi * 5 + i + 1;

                        return (
                          <button
                            key={i}
                            onClick={(e) => openPopup(e, qNum)}
                            className="
                              rounded-lg p-2 text-center border
                              bg-surface dark:bg-dark-surface
                              hover:bg-hover dark:hover:bg-dark-hover
                            "
                          >
                            <div className="font-semibold text-sm">
                              {a.score}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <>
      {desktop}
      {mobile}
    </>
  );
}