import React, { useEffect, useRef, useState } from "react";
import {useEventsNav, useSocketStore, useUI, useUser} from "@/store";
import {
  Check,
  X,
  MinusCircle,
  XCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import type { FudziRow as FudziRowType } from "@/types";
import {useStore} from "zustand/react";

type Props = { item: FudziRowType };

function nextStatus(s: "correct" | "incorrect" | "not_submitted") {
  if (s === "not_submitted") return "correct";
  if (s === "correct") return "incorrect";
  return "not_submitted";
}

export function FudziRow({ item }: Props) {
  const fudziSetAnswer = useSocketStore((s) => s.fudziSetAnswer);
  const fudziSetCard = useSocketStore((s) => s.fudziSetCard);
  const fudziSetPenalty = useSocketStore((s) => s.fudziSetPenalty);

  const hoveredColumn = useUI((s) => s.hoveredColumn);
  const setHoveredColumn = useUI((s) => s.setHoveredColumn);

  const [popup, setPopup] = useState<{ x: number; y: number; q: number } | null>(null);
  const [penaltyPopup, setPenaltyPopup] = useState<{ x: number; y: number } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);


  const {guest, can} = useUser();

  const canPenalty = !guest && can("leagues", "edit_penalties", useEventsNav().leagueId);
  const canEditAnswers = !guest && can("leagues", "edit_answers", useEventsNav().leagueId);

  const popupRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node)
      ) {
        setPopup(null);
        setPenaltyPopup(null);
      }
    }
    window.addEventListener("mousedown", handle);
    return () => window.removeEventListener("mousedown", handle);
  }, []);

  function openPopup(e: React.MouseEvent, q: number) {
    if(!canEditAnswers) {
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();

    const popupWidth = 220;
    const popupHeight = 150;

    const pos = clampPopupPosition(r.left, r.bottom + 4, popupWidth, popupHeight);

    setPopup({
      q,
      x: pos.x,
      y: pos.y,
    });
  }

  // ====== Открыть popup штрафа ======
  function openPenaltyPopup(e: React.MouseEvent) {
    if(!canPenalty) {
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();

    const popupWidth = 160;
    const popupHeight = 110;

    const pos = clampPopupPosition(r.left, r.bottom + 4, popupWidth, popupHeight);

    setPenaltyPopup({
      x: pos.x,
      y: pos.y,
    });
  }

  function choose(status: "correct" | "incorrect" | "not_submitted") {
    if (!popup) return;
    fudziSetAnswer(item.id, popup.q, status);
    setPopup(null);
  }

  function clampPopupPosition(x: number, y: number, popupWidth: number, popupHeight: number) {
    const padding = 8;

    const maxX = window.innerWidth - popupWidth - padding;
    const maxY = window.innerHeight - popupHeight - padding;

    return {
      x: Math.min(Math.max(x, padding), maxX),
      y: Math.min(Math.max(y, padding), maxY),
    };
  }

  const desktopRow = (
    <>
      <tr
        className="
          hidden md:table-row
          transition-colors
          hover:bg-hover dark:hover:bg-dark-hover/60
          border-b border-border dark:border-dark-border
        "
      >
        <td className="td text-center py-1 text-base border-r border-border dark:border-dark-border px-3">
          {item.name}
        </td>

        <td className="td text-center py-1 border-r border-border dark:border-dark-border px-3">
          <button
            onClick={() => {
              if(canEditAnswers)
              fudziSetCard(item.id, !item.has_card)
            }}
            className={`
              px-3 rounded-lg w-full text-sm font-medium
              ${item.has_card
              ? "bg-green-600/20 text-green-500"
              : "bg-red-600/20 text-red-500"}
            `}
          >
            {item.has_card ? "Да" : "Нет"}
          </button>
        </td>

        {/* Вопросы 1..16 */}
        {item.answers.map((a, i) => (
          <td
            key={i}
            onClick={(e) => openPopup(e, i + 1)}
            onMouseEnter={() => setHoveredColumn(i)}
            onMouseLeave={() => setHoveredColumn(null)}
            className={`
              td cursor-pointer text-center w-12 py-0
              border-r border-border dark:border-dark-border
              ${hoveredColumn === i ? "!bg-primary/10 dark:!bg-primary/20" : ""}
              ${a.status === "correct" ? "text-green-500" : ""}
              ${a.status === "incorrect" ? "text-red-500" : ""}
              ${a.status === "not_submitted" ? "opacity-40" : ""}
            `}
          >
            {a.score}
          </td>
        ))}

        {/* Штраф */}
        <td
          className={`td text-center py-0 border-r border-border dark:border-dark-border cursor-pointer ${item.penalty ?"text-red-500" : "" }`}
          onClick={(e) => openPenaltyPopup(e)}
        >
          {item.penalty}
        </td>

        {/* Итог */}
        <td className="td text-center py-0 font-semibold">
          {item.total}
        </td>
      </tr>


    </>
  );

  // ------------------------------------------------------
  //                     MOBILE
  // ------------------------------------------------------

  const mobileRow = (
    <tr className="md:hidden block w-full bg-transparent">
      <td className="block w-full p-0">
        <div className="w-full px-2">
          <div
            className="
              w-full rounded-xl border border-border dark:border-dark-border
              bg-surface dark:bg-dark-surface shadow-card p-4 space-y-3
            "
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">{item.name}</div>
                <div className="text-sm opacity-70">
                  Итог: <b>{item.total}</b> · Штраф:{" "}
                  <button
                    className={`${item.penalty ? "text-red-500" : ""}`}
                    onClick={(e) => openPenaltyPopup(e)}
                  >
                    {item.penalty}
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  if(canEditAnswers)
                    fudziSetCard(item.id, !item.has_card)
                }}
                className={`px-3 py-1 rounded-lg text-sm ${
                  item.has_card
                    ? "bg-green-600/20 text-green-500"
                    : "bg-red-600/20 text-red-500"
                }`}
              >
                Карта: {item.has_card ? "Да" : "Нет"}
              </button>
            </div>

            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="w-full px-3 py-2 rounded-lg flex items-center justify-between bg-hover dark:bg-dark-hover"
            >
              <span>Задачи</span>
              {mobileOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {mobileOpen && (
              <div className="grid grid-cols-4 gap-3 text-xs mt-2">
                {item.answers.map((a, i) => (
                  <button
                    key={i}
                    onClick={(e) => openPopup(e, i + 1)}
                    className="
                      p-3 rounded-lg border border-border dark:border-dark-border
                      bg-surface dark:bg-dark-surface text-center
                    "
                  >
                    <div className="font-semibold text-base">{i + 1}</div>
                    <div className={`text-sm ${a.status === "correct" ? "text-green-500" : ""}
              ${a.status === "incorrect" ? "text-red-500" : ""}
              ${a.status === "not_submitted" ? "opacity-40" : ""}`}>{a.score}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );

  return (
    <>
      {desktopRow}
      {mobileRow}
      {/* ===== Popup изменения ответа ===== */}
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
          <div className="flex items-center justify-between px-4 pb-2 border-b border-border dark:border-dark-border">
            <span className="text-sm font-semibold opacity-80">
              Вопрос {popup.q}
            </span>
            <button
              className="p-1 rounded-lg hover:bg-hover dark:hover:bg-dark-hover"
              onClick={() => setPopup(null)}
            >
              <XCircle size={18} className="opacity-60" />
            </button>
          </div>

          <button
            className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-hover dark:hover:bg-dark-hover text-green-500"
            onClick={() => choose("correct")}
          >
            <Check size={18} /> Правильно
          </button>

          <button
            className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-hover dark:hover:bg-dark-hover text-red-500"
            onClick={() => choose("incorrect")}
          >
            <X size={18} /> Неправильно
          </button>

          <button
            className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-hover dark:hover:bg-dark-hover opacity-70"
            onClick={() => choose("not_submitted")}
          >
            <MinusCircle size={18} /> Не отправлено
          </button>
        </div>
      )}

      {/* ===== Popup изменения штрафа ===== */}
      {penaltyPopup && (
        <div
          ref={popupRef}
          className="
            fixed z-50 w-40 rounded-xl
            bg-surface dark:bg-dark-surface
            border border-border dark:border-dark-border
            shadow-xl py-2
          "
          style={{ top: penaltyPopup.y, left: penaltyPopup.x }}
        >
          <div className="flex items-center justify-between px-4 pb-2 border-b border-border dark:border-dark-border">
            <span className="text-sm font-semibold opacity-80">
              Штраф
            </span>
            <button
              className="p-1 rounded-lg hover:bg-hover dark:hover:bg-dark-hover"
              onClick={() => setPenaltyPopup(null)}
            >
              <XCircle size={18} className="opacity-60" />
            </button>
          </div>



          <div className="flex items-center justify-between px-4 py-2 ">

            {item.penalty > 0 && (
              <button
                className="px-3 py-1 rounded-lg "
                onClick={() => fudziSetPenalty(item.id, item.penalty - 1)}
              >
                -1
              </button>
            )}


            <div className="w-10 text-center font-semibold">
              {item.penalty}
            </div>

            <button
              className="px-3 py-1 rounded-lg bg-hover dark:bg-dark-hover"
              onClick={() => fudziSetPenalty(item.id, item.penalty + 1)}
            >
              +1
            </button>
          </div>
        </div>
      )}
    </>
  );
}