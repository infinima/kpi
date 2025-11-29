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
  const {
    kvartalAddAnswer,
    kvartalFinish,
    kvartalSetPenalty,
  } = useSocketStore();

  const [popup, setPopup] = useState<{
    x: number;
    y: number;
    q: number;
  } | null>(null);

  const [popupPenalty, setPopupPenalty] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [openQuarter, setOpenQuarter] = useState<number | null>(null);

  // ───────────────────────────────────────────────
  // ПОПАПЫ
  // ───────────────────────────────────────────────
  function openPopupAnswer(e: React.MouseEvent, q: number) {
    const r = e.currentTarget.getBoundingClientRect();
    setPopup({
      q,
      x: r.left,
      y: r.bottom + 4,
    });
  }

  function openPopupPenalty(e: React.MouseEvent) {
    const r = e.currentTarget.getBoundingClientRect();
    setPopupPenalty({
      x: r.left,
      y: r.bottom + 4,
    });
  }

  function changeScore(q: number, dc: number, di: number) {
    kvartalAddAnswer(item.id, q, dc, di);
    setPopup(null);
  }

  function changePenalty(delta: number) {
    kvartalSetPenalty(item.id, item.penalty + delta);
  }

  function toggleQuarter(qi: number) {
    kvartalFinish(item.id, qi + 1, !item.quarters[qi].finished);
  }

  // ───────────────────────────────────────────────
  // ДЕСКТОПНАЯ ВЕРСИЯ
  // ───────────────────────────────────────────────
  const desktop = (
    <>
      <tr className="hidden md:table-row hover:bg-hover/50 dark:hover:bg-dark-hover/50">

        {/* ИМЯ */}
        <td className="td text-center py-4 font-medium border-r border-border">
          {item.name}
        </td>

        {/* КВАРТАЛЫ */}
        {item.quarters.map((q, qi) => {
          const baseIndex = qi * 5;

          return (
            <td
              key={qi}
              className="
                td p-0 border-r border-border
                align-top
              "
            >
              <div className="
                flex flex-col items-center
                p-2 gap-2 rounded-xl
                bg-hover/20 dark:bg-dark-hover/20
                mx-auto w-[150px]
              ">
                {/* СТАТУС */}
                <button
                  onClick={() => toggleQuarter(qi)}
                  className={`
                    text-sm font-medium cursor-pointer
                    ${q.finished ? "text-green-500" : "text-red-500"}
                  `}
                >
                  {q.finished ? "Сдан" : "Не сдан"}
                </button>

                {/* 5 задач */}
                <div className="flex gap-2">
                  {q.answers.map((a, i) => {
                    const qNum = baseIndex + i + 1;

                    return (
                      <div
                        key={i}
                        onClick={(e) => openPopupAnswer(e, qNum)}
                        className="
                          w-9 h-10 rounded-lg
                          flex items-center justify-center
                          cursor-pointer
                          border border-border dark:border-dark-border
                          text-sm select-none
                          hover:bg-hover dark:hover:bg-dark-hover
                        "
                      >
                        {a.score}
                      </div>
                    );
                  })}
                </div>

                {/* БОНУС */}
                <div className="text-xs opacity-70">
                  Бонус: {q.bonus}
                </div>
              </div>
            </td>
          );
        })}

        {/* ШТРАФ */}
        <td
          className="td text-center py-4 border-r cursor-pointer text-red-400"
          onClick={openPopupPenalty}
        >
          {item.penalty}
        </td>

        {/* ИТОГО */}
        <td className="td text-center py-4 font-semibold">{item.total}</td>
      </tr>

      {/* POPUP ответов */}
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
          <div className="flex items-center justify-between pb-2 border-b">
            <span className="font-semibold text-sm">Вопрос {popup.q}</span>
            <button onClick={() => setPopup(null)}>
              <XCircle size={18} className="opacity-60" />
            </button>
          </div>

          {/* Найти данные */}
          {(() => {
            const qi = Math.floor((popup.q - 1) / 5);
            const ai = (popup.q - 1) % 5;
            const ans = item.quarters[qi].answers[ai];

            return (
              <>
                {/* Правильные */}
                <div>
                  <div className="text-xs opacity-70 mb-1">Правильных</div>
                  <div className="flex justify-between items-center">
                    <button className="btn" onClick={() => changeScore(popup.q, -1, 0)}>
                      -1
                    </button>

                    <div className="value">{ans.correct}</div>

                    <button className="btn" onClick={() => changeScore(popup.q, +1, 0)}>
                      +1
                    </button>
                  </div>
                </div>

                {/* Неправильные */}
                <div>
                  <div className="text-xs opacity-70 mb-1">Неправильных</div>
                  <div className="flex justify-between items-center">
                    <button className="btn" onClick={() => changeScore(popup.q, 0, -1)}>
                      -1
                    </button>

                    <div className="value">{ans.incorrect}</div>

                    <button className="btn" onClick={() => changeScore(popup.q, 0, +1)}>
                      +1
                    </button>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* POPUP штрафа */}
      {popupPenalty && (
        <div
          className="
            fixed z-50 w-40 rounded-xl py-3 px-4
            bg-surface dark:bg-dark-surface border shadow-xl
            space-y-3
          "
          style={{ top: popupPenalty.y, left: popupPenalty.x }}
        >
          <div className="flex justify-between items-center border-b pb-2">
            <span className="font-semibold text-sm">Штраф</span>
            <button onClick={() => setPopupPenalty(null)}>
              <XCircle size={18} className="opacity-60" />
            </button>
          </div>

          <div className="flex justify-between items-center mt-2">
            <button className="btn" onClick={() => changePenalty(-1)}>-1</button>
            <div className="value">{item.penalty}</div>
            <button className="btn" onClick={() => changePenalty(+1)}>+1</button>
          </div>
        </div>
      )}
    </>
  );

  // ───────────────────────────────────────────────
  // МОБИЛЬНАЯ ВЕРСИЯ
  // ───────────────────────────────────────────────
  const mobile = (
    <tr className="md:hidden">
      <td colSpan={999} className="p-2">
        <div className="p-4 rounded-xl bg-surface border shadow-card space-y-3">

          {/* ГОЛОВА */}
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold text-lg">{item.name}</div>
              <div className="text-xs opacity-70">
                Итог: {item.total} · Штраф:{" "}
                <button
                  onClick={openPopupPenalty}
                  className="underline text-red-400"
                >
                  {item.penalty}
                </button>
              </div>
            </div>

            <button
              className="p-2 rounded-lg bg-hover"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {mobileOpen && (
            <div className="space-y-3">
              {item.quarters.map((q, qi) => (
                <div
                  key={qi}
                  className="border rounded-xl p-3 bg-hover/10 space-y-2"
                >
                  <button
                    className="w-full flex justify-between items-center"
                    onClick={() =>
                      setOpenQuarter(openQuarter === qi ? null : qi)
                    }
                  >
                    <div className="text-left">
                      <div className="font-medium">
                        Квартал {qi + 1} —{" "}
                        <span
                          className={
                            q.finished ? "text-green-500" : "text-red-500"
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleQuarter(qi);
                          }}
                        >
                          {q.finished ? "Сдан" : "Не сдан"}
                        </span>
                      </div>

                      <div className="text-xs opacity-70 mt-1">
                        Баллы: {q.total} · Бонус: {q.bonus}
                      </div>
                    </div>

                    {openQuarter === qi ? <ChevronUp /> : <ChevronDown />}
                  </button>

                  {openQuarter === qi && (
                    <div className="grid grid-cols-5 gap-2 pt-2">
                      {q.answers.map((a, i) => {
                        const qNum = qi * 5 + i + 1;

                        return (
                          <button
                            key={i}
                            onClick={(e) => openPopupAnswer(e, qNum)}
                            className="
                              rounded-lg border p-2 bg-surface
                              text-center text-sm hover:bg-hover
                            "
                          >
                            {a.score}
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