import { useState } from "react";
import { useSocketStore } from "@/store";

export function FudziRow({ item }) {
  const fudziSetAnswer = useSocketStore((s) => s.fudziSetAnswer);
  const fudziSetCard = useSocketStore((s) => s.fudziSetCard);

  const [hoverCol, setHoverCol] = useState<number | null>(null);

  // popover
  const [popup, setPopup] = useState<{
    teamId: number;
    qNum: number;
    x: number;
    y: number;
  } | null>(null);

  function openPopup(e: any, qNum: number) {
    const rect = e.currentTarget.getBoundingClientRect();
    setPopup({
      teamId: item.id,
      qNum,
      x: rect.left,
      y: rect.bottom,
    });
  }

  function choose(status: "correct" | "incorrect" | "not_submitted") {
    fudziSetAnswer(item.id, popup!.qNum, status);
    setPopup(null);
  }

  console.log(item);


  return (
    <>
      <tr className="hover:bg-hover dark:hover:bg-dark-hover">

        {/* Команда */}
        <td>{item.name}</td>

        {/* ID */}
        <td>{item.id}</td>

        {/* Карточка */}
        <td>
          <button
            onClick={() => fudziSetCard(item.id, !item.has_card)}
            className={`
              w-full px-2 py-1 rounded-lg text-center
              ${item.has_card ? "bg-green-600/20 text-green-700" : "bg-red-600/20 text-red-700"}
            `}
          >
            {item.has_card ? "Да" : "Нет"}
          </button>
        </td>

        {/* penalty */}
        <td>{item.penalty}</td>

        {/* total */}
        <td>{item.total}</td>

        {/* Вопросы */}
        {item.answers.map((a, i) => (
          <td
            key={i}
            onMouseEnter={() => setHoverCol(5 + i)}
            onClick={(e) => openPopup(e, i + 1)}
            className={`
              cursor-pointer
              ${a.status === "correct" ? "text-green-600" : ""}
              ${a.status === "incorrect" ? "text-red-600" : ""}
              ${a.status === "not_submitted" ? "opacity-40" : ""}
            `}
          >
            {a.score}
          </td>
        ))}
      </tr>

      {/* POPUP */}
      {popup && (
        <div
          className="
            fixed z-50 p-2 rounded-lg
            bg-surface dark:bg-dark-surface
            border border-border dark:border-dark-border
            shadow-card space-y-1
          "
          style={{
            top: popup.y + 4,
            left: popup.x,
          }}
        >
          <button
            className="block w-full text-left px-3 py-1 hover:bg-hover dark:hover:bg-dark-hover"
            onClick={() => choose("correct")}
          >
            ✔ Правильно
          </button>

          <button
            className="block w-full text-left px-3 py-1 hover:bg-hover dark:hover:bg-dark-hover"
            onClick={() => choose("incorrect")}
          >
            ❌ Неправильно
          </button>

          <button
            className="block w-full text-left px-3 py-1 hover:bg-hover dark:hover:bg-dark-hover"
            onClick={() => choose("not_submitted")}
          >
            • Не отправлено
          </button>
        </div>
      )}
    </>
  );
}