import React, { useState, useRef, useEffect } from "react";
import {useEventsNav, useSocketStore, useUI, useUser} from "@/store";
import {XCircle, Check, X, MinusCircle, ChevronUp, ChevronDown} from "lucide-react";
import type { KvartalRow as KvartalRowType } from "@/types";

type Props = { item: KvartalRowType };

export function KvartalRow({ item }: Props) {
  const { kvartalAddAnswer, kvartalFinish, kvartalSetPenalty } =
    useSocketStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [openQuarter, setOpenQuarter] = useState<number | null>(null);

  const hoveredColumn = useUI((s) => s.hoveredColumn);
  const setHoveredColumn = useUI((s) => s.setHoveredColumn);

  const {guest, can} = useUser();

  const canPenalty = !guest && can("leagues", "edit_penalties", useEventsNav().leagueId || undefined);
  const canEditAnswers = !guest && can("leagues", "edit_answers", useEventsNav().leagueId || undefined);

  const [popup, setPopup] = useState<{
    q: number;
    x: number;
    y: number;
  } | null>(null);

  const [penaltyPopup, setPenaltyPopup] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const popupRef = useRef<HTMLDivElement | null>(null);
  const penaltyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) ||
        penaltyRef.current &&
        !penaltyRef.current.contains(e.target as Node)

      ) {
        setPopup(null);
        setPenaltyPopup(null);
      }
    }
    window.addEventListener("mousedown", handle);
    return () => window.removeEventListener("mousedown", handle);
  }, []);

  // ───────────────────────────────────────────────
  // Попапы удерживать в пределах экрана
  // ───────────────────────────────────────────────
  useEffect(() => {
    const fix = (ref: any, setter: any) => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const maxY = window.innerHeight - 10;

      if (rect.bottom > maxY)
        setter((p: any) => p && { ...p, y: p.y - (rect.bottom - maxY) - 10 });
    };

    fix(popupRef, setPopup);
    fix(penaltyRef, setPenaltyPopup);
  }, [popup, penaltyPopup]);

  // ───────────────────────────────────────────────
  // Открытие попапов
  // ───────────────────────────────────────────────
  function openPopupAnswer(e: React.MouseEvent, q: number) {
    if(!canEditAnswers){
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    setPopup({ q, x: r.left, y: r.bottom + 4 });
  }

  function openPenaltyPopup(e: React.MouseEvent) {
    if(!canPenalty){
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    setPenaltyPopup({ x: r.left, y: r.bottom + 4 });
  }


  function changeScore(q: number, dc: number, di: number) {
    kvartalAddAnswer(item.id, q, dc, di);
  }

  function toggleQuarter(qi: number) {
    if(!canEditAnswers) {
      return;
    }
    kvartalFinish(item.id, qi + 1, !item.quarters[qi].finished);
  }

  function changePenalty(delta: number) {
    kvartalSetPenalty(item.id, item.penalty + delta);
  }

  // =====================================================================
  // DESKTOP — ЧИСТАЯ ТАБЛИЦА
  // =====================================================================

  const desktop = (
    <>
      <tr className="hidden md:table-row border-b  hover:bg-hover dark:hover:bg-dark-hover border-border dark:border-dark-border">

        {/* Команда */}
        <td className="td text-center font-medium border-r border-border dark:border-dark-border">{item.name}</td>

        {/* Кварталы: 4 вопроса + 1 статус */}
        {item.quarters.map((q, qi) => {
          const base = qi * 4;

          return (
            <React.Fragment key={qi}>
              {/* 4 вопроса */}
              {q.answers.slice(0, 4).map((a, i) => {
                const qNum = base + i + 1;

                // @ts-ignore
                return (
                  <td
                    key={i}
                    onClick={(e) => openPopupAnswer(e, qNum)}
                    className={`td text-center cursor-pointer
                      border-r border-border
                      hover:bg-hover dark:hover:bg-dark-hover  dark:border-dark-border
                      ${a.correct ? a.incorrect ? "text-yellow-500"  : "text-green-500": a.incorrect ? "text-red-500"  : "text-gray-500"}
                                  ${hoveredColumn === (qi-1) * 5 + i+5 ? "!bg-primary/10 dark:!bg-primary/20" : ""}\`}
`}

                    onMouseEnter={() => {
                      setHoveredColumn((qi-1) * 5 + i+5);
                    }}
                    onMouseLeave={() => setHoveredColumn(null)}
                  >
                    {a.score}
                  </td>
                );
              })}

              {/* Статус квартала */}
              <td
                onClick={() => toggleQuarter(qi)}
                className=
                  {`td text-center cursor-pointer border-r border-border
                  font-medium
                  hover:bg-hover dark:hover:bg-dark-hover  dark:border-dark-border
                  ${hoveredColumn === (qi-1) * 5 + 9? "!bg-primary/10 dark:!bg-primary/20" : ""}`}


                onMouseEnter={() => setHoveredColumn((qi-1) * 5 + 9)}
                onMouseLeave={() => setHoveredColumn(null)}
              >
                {q.finished ? (
                  <span className={`${q.bonus? "text-green-500" : "text-red-500"}`}>{q.bonus}</span>
                ) : (
                  <span className="opacity-40"></span>
                )}
              </td>
            </React.Fragment>
          );
        })}

        {/* Штраф */}
        <td
          className={`td text-center cursor-pointer  border-r border-border dark:border-dark-border ${item.penalty > 0 ? "text-red-500" : ""}`}
          onClick={openPenaltyPopup}
        >
          {item.penalty}
        </td>

        {/* Итог */}
        <td className="td text-center font-semibold">{item.total}</td>
      </tr>

      {/* ===== POPUP: ответ ===== */}
      {popup && (
        <div
          ref={popupRef}
          className="
            fixed z-50 w-56 rounded-xl
            bg-surface dark:bg-dark-surface
            border border-border dark:border-dark-border
            shadow-xl py-2
          "
          style={{ top: popup.y, left: popup.x }}
        >
          <div className="flex justify-between items-center px-4 pb-2 border-b border-border dark:border-dark-border">
            <span className="text-sm font-semibold opacity-80">
              Вопрос {popup.q}
            </span>
            <button onClick={() => setPopup(null)}>
              <XCircle size={18} className="opacity-60" />
            </button>
          </div>

          {(() => {
            const qi = Math.floor((popup.q - 1) / 4);
            const ai = (popup.q - 1) % 4;
            const ans = item.quarters[qi].answers[ai];

            return (
              <>
                {/* correct */}
                <div className="px-4 pt-3">
                  <div className="text-xs opacity-70 mb-1">Правильных</div>
                  <div className="flex items-center justify-between">
                      <button
                        className={`px-3 py-1 rounded-lg bg-hover dark:bg-dark-hover border-border dark:border-dark-border  ${ans.correct > 0 ? "" : "invisible pointer-events-none"}`}
                        onClick={() => changeScore(popup.q, -1, 0)}
                      >
                        -1
                      </button>

                    <div className="w-10 text-center font-semibold">
                      {ans.correct}
                    </div>
                      <button
                        className={`px-3 py-1 rounded-lg bg-hover dark:bg-dark-hover border-border dark:border-dark-border  ${ans.correct <1 ? "" : "invisible pointer-events-none"}`}
                        onClick={() => changeScore(popup.q, +1, 0)}
                      >
                        +1
                      </button>

                  </div>
                </div>

                {/* incorrect */}
                <div className="px-4 pt-3 pb-2">
                  <div className="text-xs opacity-70 mb-1">Неправильных</div>
                  <div className="flex items-center justify-between">
                      <button
                        className={`px-3 py-1 rounded-lg bg-hover dark:bg-dark-hover border-border dark:border-dark-border  ${ans.incorrect > 0 ? "" : "invisible pointer-events-none"}`}
                        onClick={() => changeScore(popup.q, 0, -1)}
                      >
                        -1
                      </button>

                    <div className="w-10 text-center font-semibold">
                      {ans.incorrect}
                    </div>


                      <button
                        className="px-3 py-1 rounded-lg bg-hover dark:bg-dark-hover"
                        onClick={() => changeScore(popup.q, 0, +1)}
                      >
                        +1
                      </button>

                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ===== POPUP: штраф ===== */}
      {penaltyPopup && (
        <div
          ref={penaltyRef}
          className="
            fixed z-50 w-40 rounded-xl
            bg-surface dark:bg-dark-surface
            border border-border dark:border-dark-border
            shadow-xl py-2
          "
          style={{ top: penaltyPopup.y, left: penaltyPopup.x }}
        >
          <div className="flex justify-between items-center px-4 pb-2 border-b border-border dark:border-dark-border">
            <span className="text-sm font-semibold opacity-80">Штраф</span>
            <button onClick={() => setPenaltyPopup(null)}>
              <XCircle size={18} className="opacity-60" />
            </button>
          </div>

          <div className="flex items-center justify-between px-4 py-2">
            {item.penalty > 0 && (
              <button
                className="px-3 py-1 rounded-lg bg-hover dark:bg-dark-hover"
                onClick={() => changePenalty(-1)}
              >
                -1
              </button>
            )}

            <div className="w-10 text-center font-semibold">
              {item.penalty}
            </div>
            <button
              className="px-3 py-1 rounded-lg bg-hover dark:bg-dark-hover"
              onClick={() => changePenalty(+1)}
            >
              +1
            </button>
          </div>
        </div>
      )}
    </>
  );

  // =====================================================================
  // MOBILE — твоя старая версия (оставил как есть)
  // =====================================================================

  const mobile = (
    <tr className="md:hidden !w-full">
      <td colSpan={999} className="p-2 w-224">
        <div className="p-4 rounded-xl bg-surface dark:bg-dark-surface border shadow-card space-y-3 !w-full border-border dark:border-dark-border">

          {/* ГОЛОВА */}
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold text-lg">{item.name}</div>
              <div className="text-xs opacity-70">
                Итог: {item.total} · Штраф:{" "}
                <button
                  onClick={openPenaltyPopup}
                  className={`${item.penalty ? "text-red-500" : ""}`}
                >
                  {item.penalty}
                </button>
              </div>
            </div>

            <button
              className="p-2 rounded-lg  "
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <ChevronUp /> : <ChevronDown/>}
            </button>
          </div>

          {mobileOpen && (
            <div className="space-y-3 border-border dark:border-dark-border">
              {item.quarters.map((q, qi) => (
                <div
                  key={qi}
                  className="border rounded-xl p-3 bg-hover/10 space-y-2 border-border dark:border-dark-border"
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
                    <div className="grid grid-cols-5 gap-2 pt-2 border-border dark:border-dark-border">
                      {q.answers.map((a, i) => {
                        const qNum = qi * 5 + i + 1;

                        return (
                          <button
                            key={i}
                            onClick={(e) => openPopupAnswer(e, qNum)}
                            className="
                              rounded-lg border p-2 bg-surface dark:bg-dark-surface hover:dark:bg-dark-hover
                              text-center text-sm hover:bg-hover border-border dark:border-dark-border
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