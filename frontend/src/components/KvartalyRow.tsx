import { useSocketStore } from "@/store";

export function KvartalyRow({ item, hoverCol, setHoverCol }) {
  const kvartalyAddAnswer = useSocketStore((s) => s.kvartalyAddAnswer);

  function changeAnswer(qIndex: number, e: React.MouseEvent) {
    let deltaCorrect = 0;
    let deltaIncorrect = 0;

    if (e.altKey) deltaCorrect = -1;     // alt → отменяем правильный
    else if (e.shiftKey) deltaIncorrect = +1; // shift → неправильный
    else deltaCorrect = +1;              // обычный клик → правильный

    kvartalyAddAnswer(item.id, qIndex + 1, deltaCorrect, deltaIncorrect);
  }

  console.log(item);

  return (
    <tr className="hover:bg-hover dark:hover:bg-dark-hover">
      <td onMouseEnter={() => setHoverCol(0)}>{item.name}</td>
      <td onMouseEnter={() => setHoverCol(1)}>{item.id}</td>
      <td onMouseEnter={() => setHoverCol(2)}>{item.penalty}</td>
      <td onMouseEnter={() => setHoverCol(3)}>{item.total}</td>

      {item.quarters.map((q, i) => (
        <td
          key={i}
          onMouseEnter={() => setHoverCol(4 + i)}
          onClick={(e) => changeAnswer(i, e)}
          className={`
            cursor-pointer
            ${q.finished ? "text-green-600" : "opacity-40"}
          `}
        >
          {q.total + q.bonus}
        </td>
      ))}
    </tr>
  );
}