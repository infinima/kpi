import React, { useState } from "react";
import { useSocketStore } from "@/store";
import {
  Check,
  X,
  MinusCircle,
  XCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import type { FudziRow as FudziRowType } from "@/types";

type Props = {
  item: FudziRowType;
};

function nextStatus(s: "correct" | "incorrect" | "not_submitted") {
  if (s === "not_submitted") return "correct";
  if (s === "correct") return "incorrect";
  return "not_submitted";
}

export function FudziRow({ item }: Props) {
  const fudziSetAnswer = useSocketStore((s) => s.fudziSetAnswer);
  const fudziSetCard = useSocketStore((s) => s.fudziSetCard);

  const [popup, setPopup] = useState<{ x: number; y: number; q: number } | null>(
    null
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  function openPopup(e: React.MouseEvent, q: number) {
    const r = e.currentTarget.getBoundingClientRect();
    setPopup({
      q,
      x: r.left,
      y: r.bottom + 4
    });
  }

  function choose(status: "correct" | "incorrect" | "not_submitted") {
    if (!popup) return;
    fudziSetAnswer(item.id, popup.q, status);
    setPopup(null);
  }

  // ---------- DESKTOP ----------
  const desktopRow = (
    <>
      <tr
        className="
        hidden md:table-row
        transition-colors
        hover:bg-hover/60 dark:hover:bg-dark-hover/60
      "
      >
        {/* Команда */}
        <td className="td text-center py-4 text-base border-r border-border dark:border-dark-border px-3">
          {item.name}
        </td>

        {/* Карта */}
        <td className="td text-center py-4 border-r border-border dark:border-dark-border px-3">
          <button
            onClick={() => fudziSetCard(item.id, !item.has_card)}
            className={`
            px-3 py-2 rounded-lg w-full text-sm font-medium
            ${item.has_card
              ? "bg-green-600/20 text-green-500"
              : "bg-red-600/20 text-red-500"}
          `}
          >
            {item.has_card ? "Да" : "Нет"}
          </button>
        </td>

        {/* 16 задач */}
        {item.answers.map((a, i) => (
          <td
            key={i}
            onClick={(e) => openPopup(e, i + 1)}
            className={`
            td cursor-pointer text-center w-12 py-4
            border-r border-border dark:border-dark-border
            ${a.status === "correct" ? "text-green-500" : ""}
            ${a.status === "incorrect" ? "text-red-500" : ""}
            ${a.status === "not_submitted" ? "opacity-40" : ""}
          `}
          >
            {a.score}
          </td>
        ))}

        {/* Штраф */}
        <td className="td text-center py-4 border-r border-border dark:border-dark-border">
          {item.penalty}
        </td>

        {/* Итог (последняя колонка → без линии) */}
        <td className="td text-center py-4 font-semibold">
          {item.total}
        </td>
      </tr>


      {/* Popup */}
      {popup && (
        <div
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
              <XCircle
                size={18}
                className="text-text-secondary dark:text-dark-text-secondary"
              />
            </button>
          </div>

          <button
            className="
              flex items-center gap-2 w-full text-left px-4 py-2
              hover:bg-hover dark:hover:bg-dark-hover
              text-green-500 dark:text-green-400
            "
            onClick={() => choose("correct")}
          >
            <Check size={18} />
            <span>Правильно</span>
          </button>

          <button
            className="
              flex items-center gap-2 w-full text-left px-4 py-2
              hover:bg-hover dark:hover:bg-dark-hover
              text-red-500 dark:text-red-400
            "
            onClick={() => choose("incorrect")}
          >
            <X size={18} />
            <span>Неправильно</span>
          </button>

          <button
            className="
              flex items-center gap-2 w-full text-left px-4 py-2
              hover:bg-hover dark:hover:bg-dark-hover
              text-text-secondary dark:text-dark-text-secondary
            "
            onClick={() => choose("not_submitted")}
          >
            <MinusCircle size={18} />
            <span>Не отправлено</span>
          </button>
        </div>
      )}
    </>
  );

  // ---------- MOBILE ----------
  const mobileRow = (
    <tr className="md:hidden block w-full">
      <td className="block w-full p-0" colSpan={999}>
        <div className="w-full px-2">
          <div
            className="
            w-full
            rounded-xl border border-border dark:border-dark-border
            bg-surface dark:bg-dark-surface
            shadow-card p-4 space-y-3
          "
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="font-semibold text-lg">{item.name}</div>

                <div className="text-sm opacity-70">
                  Итог: <b>{item.total}</b> · Штраф: <b>{item.penalty}</b>
                </div>
              </div>

              <button
                onClick={() => fudziSetCard(item.id, !item.has_card)}
                className={`
                px-3 py-1 rounded-lg text-sm
                ${item.has_card
                  ? "bg-green-600/20 text-green-500"
                  : "bg-red-600/20 text-red-500"}
              `}
              >
                Карта: {item.has_card ? "Да" : "Нет"}
              </button>
            </div>

            {/* Toggle */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="
              w-full px-3 py-2 rounded-lg text-sm
              flex items-center justify-between
              bg-hover dark:bg-dark-hover
            "
            >
              <span>Задачи</span>
              {mobileOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {mobileOpen && (
              <div className="mt-2 grid grid-cols-4 gap-3 text-xs">
                {item.answers.map((a, i) => {
                  const status = a.status;

                  const color =
                    status === "correct"
                      ? "bg-green-600/10 text-green-400"
                      : status === "incorrect"
                        ? "bg-red-600/10 text-red-400"
                        : "opacity-50";

                  return (
                    <button
                      key={i}
                      className={`flex flex-col items-center justify-center rounded-lg px-2 py-3 border border-border dark:border-dark-border ${color}`}
                      onClick={() => {
                        const ns = nextStatus(status);
                        fudziSetAnswer(item.id, i + 1, ns);
                      }}
                    >
                      <div className="font-semibold text-base">{i + 1}</div>
                      <div className="text-sm">{a.score}</div>
                    </button>
                  );
                })}
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
    </>
  );
}