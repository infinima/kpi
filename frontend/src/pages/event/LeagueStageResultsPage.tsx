import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useOutletContext, useParams } from "react-router-dom";
import { ArrowDown, ArrowUp, Check, X } from "lucide-react";
import { useSocketStore } from "@/store/useTableSocket";
import { useUser } from "@/store";

type EntitySummary = {
    id: number;
    name: string;
};

type EventsOutletContext = {
    eventInfo: EntitySummary | null;
    locationInfo: EntitySummary | null;
    leagueInfo: EntitySummary | null;
};

type FudziAnswer = {
    score: number;
    status: "correct" | "incorrect" | "not_submitted";
};

type FudziTeam = {
    id: number;
    name: string;
    has_card: boolean;
    penalty: number;
    total: number;
    answers: FudziAnswer[];
};

type KvartalyAnswer = {
    correct: number;
    incorrect: number;
    score: number;
};

type KvartalyQuarter = {
    finished: boolean;
    bonus: number;
    total: number;
    answers: KvartalyAnswer[];
};

type KvartalyTeam = {
    id: number;
    name: string;
    penalty: number;
    total: number;
    quarters: KvartalyQuarter[];
};

type StageType = "kvartaly" | "fudzi";
type SortDirection = "asc" | "desc" | null;
type SortState = {
    key: string;
    direction: SortDirection;
} | null;

type PopupState =
    | {
        type: "fudzi-answer";
        teamId: number;
        questionIndex: number;
        width: number;
        x: number;
        y: number;
        anchorLeft: number;
        anchorRight: number;
        anchorTop: number;
        anchorBottom: number;
    }
    | {
        type: "fudzi-penalty";
        teamId: number;
        penalty: number;
        width: number;
        x: number;
        y: number;
        anchorLeft: number;
        anchorRight: number;
        anchorTop: number;
        anchorBottom: number;
    }
    | {
        type: "kvartaly-answer";
        teamId: number;
        questionNumber: number;
        correct: number;
        incorrect: number;
        width: number;
        x: number;
        y: number;
        anchorLeft: number;
        anchorRight: number;
        anchorTop: number;
        anchorBottom: number;
    }
    | {
        type: "kvartaly-bonus";
        teamId: number;
        quarterIndex: number;
        finished: boolean;
        width: number;
        x: number;
        y: number;
        anchorLeft: number;
        anchorRight: number;
        anchorTop: number;
        anchorBottom: number;
    }
    | {
        type: "kvartaly-penalty";
        teamId: number;
        penalty: number;
        width: number;
        x: number;
        y: number;
        anchorLeft: number;
        anchorRight: number;
        anchorTop: number;
        anchorBottom: number;
    };

function compareValues(left: unknown, right: unknown) {
    if (left == null && right == null) return 0;
    if (left == null) return -1;
    if (right == null) return 1;

    const leftNumber = Number(left);
    const rightNumber = Number(right);

    if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber) && `${left}` !== "" && `${right}` !== "") {
        return leftNumber - rightNumber;
    }

    return String(left).localeCompare(String(right), "ru", { sensitivity: "base" });
}

function headerButtonClass(active: boolean) {
    return `flex h-5 w-full items-center justify-center gap-1 px-0.5 py-0 text-center text-[10px] font-semibold uppercase tracking-[0.04em] leading-none transition ${
        active ? "text-white" : "text-white/92 hover:text-white"
    }`;
}

function sortIcon(direction: Exclude<SortDirection, null>) {
    return direction === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
}

function getPopupPosition(event: React.MouseEvent, width: number, height: number) {
    const rect = event.currentTarget.getBoundingClientRect();
    const gap = 2 + 125;
    const left = rect.left - width - gap;
    const top = rect.top + rect.height / 2 - height / 2;

    return { x: left, y: top };
}

function Popup({
    popup,
    children,
}: {
    popup: PopupState;
    children: ReactNode;
}) {
    return (
        <div
            className="fixed z-50 rounded-[20px] border border-[var(--color-border)] bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.2)]"
            style={{ left: popup.x, top: popup.y, width: popup.width }}
        >
            <div className="flex flex-col gap-1">
                {children}
            </div>
        </div>
    );
}

function PopupButton({
    onClick,
    children,
    variant = "default",
}: {
    onClick: () => void;
    children: ReactNode;
    variant?: "default" | "danger" | "success";
}) {
    const colorClass = variant === "danger"
        ? "text-[#b91c1c] hover:bg-[rgba(185,28,28,0.08)]"
        : variant === "success"
            ? "text-[#047857] hover:bg-[rgba(4,120,87,0.08)]"
            : "text-[var(--color-text-main)] hover:bg-[rgba(14,116,144,0.08)]";

    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-xl px-3 py-2 text-left text-sm transition ${colorClass}`}
        >
            {children}
        </button>
    );
}

function CounterRow({
    label,
    value,
    onIncrease,
    onDecrease,
    positive = false,
    maxValue,
}: {
    label: string;
    value: number;
    onIncrease: () => void;
    onDecrease: () => void;
    positive?: boolean;
    maxValue?: number;
}) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-xl px-2 py-1">
            <span className="text-sm text-[var(--color-text-main)]">{label}</span>
            <div className="flex items-center gap-2">
                {value > 0 ? (
                    <button
                        type="button"
                        onClick={onDecrease}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text-main)] transition hover:bg-[rgba(14,116,144,0.08)]"
                    >
                        -
                    </button>
                ) : null}
                <div className={`min-w-8 text-center text-sm font-semibold ${positive && value > 0 ? "text-[#166534]" : !positive && value > 0 ? "text-[#b91c1c]" : "text-[var(--color-text-main)]"}`}>
                    {value}
                </div>
                {maxValue === undefined || value < maxValue ? (<button
                    type="button"
                    onClick={onIncrease}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text-main)] transition hover:bg-[rgba(14,116,144,0.08)]"
                >
                    +
                </button>): null}
            </div>
        </div>
    );
}

function FudziResultsTable({ data, leagueId }: { data: FudziTeam[]; leagueId: number }) {
    const { guest, can } = useUser();
    const canEditAnswers = !guest && can("leagues", "edit_answers", leagueId);
    const canEditPenalties = !guest && can("leagues", "edit_penalties", leagueId);
    const setAnswer = useSocketStore((state) => state.fudziSetAnswer);
    const setCard = useSocketStore((state) => state.fudziSetCard);
    const setPenalty = useSocketStore((state) => state.fudziSetPenalty);

    const [sort, setSort] = useState<SortState>(null);
    const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);
    const [hoveredRow, setHoveredRow] = useState<number | null>(null);
    const [popup, setPopup] = useState<PopupState | null>(null);
    const popupRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function handleClick(event: MouseEvent) {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                setPopup(null);
            }
        }

        window.addEventListener("mousedown", handleClick);
        return () => window.removeEventListener("mousedown", handleClick);
    }, []);

    const sortedData = useMemo(() => {
        if (!sort?.key || !sort.direction) {
            return data;
        }

        const getValue = (team: FudziTeam) => {
            if (sort.key === "name") return team.name;
            if (sort.key === "has_card") return Number(Boolean(team.has_card));
            if (sort.key === "penalty") return team.penalty;
            if (sort.key === "total") return team.total;
            if (sort.key.startsWith("q")) {
                const index = Number(sort.key.slice(1)) - 1;
                const answer = team.answers[index];
                if (!answer || answer.status === "not_submitted") return "";
                if (answer.status === "incorrect") return -1;
                return answer.score;
            }
            return "";
        };

        return [...data].sort((left, right) => {
            const compared = compareValues(getValue(left), getValue(right));
            return sort.direction === "asc" ? compared : -compared;
        });
    }, [data, sort]);

    function toggleSort(key: string) {
        setSort((current) => {
            if (!current || current.key !== key) {
                return { key, direction: "asc" };
            }

            if (current.direction === "asc") {
                return { key, direction: "desc" };
            }

            if (current.direction === "desc") {
                return null;
            }

            return { key, direction: "asc" };
        });
    }

    function openPopup(event: React.MouseEvent, nextPopup: PopupState) {
        const rect = event.currentTarget.getBoundingClientRect();
        setPopup({
            ...nextPopup,
            anchorLeft: rect.left,
            anchorRight: rect.right,
            anchorTop: rect.top,
            anchorBottom: rect.bottom,
            ...getPopupPosition(event, nextPopup.width, nextPopup.type === "fudzi-answer" ? 144 : 132),
        });
    }

    return (
        <section className="h-[calc(100vh-5rem)]  overflow-x-auto">
            <div className="max-h-[calc(100vh-5rem)] min-w-[1110px] overflow-auto rounded-[24px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.9)] shadow-[0_18px_52px_rgba(15,23,42,0.08)]">
                <table className="w-full table-fixed border-collapse text-[13px] text-[var(--color-text-main)]">
                    <colgroup>
                        <col className="w-[16%]" />
                        <col className="w-[3%]" />
                        <col className="w-[4.5%]" />
                        <col className="w-[4.5%]" />
                        {Array.from({ length: 16 }).map((_, index) => <col key={index} className="w-[3.2%]" />)}
                    </colgroup>
                    <thead className="bg-[var(--color-primary)]">
                        <tr>
                            <th className="sticky top-0 z-40 bg-[var(--color-primary)]"><button type="button" onClick={() => toggleSort("name")} className={headerButtonClass(sort?.key === "name")}>Команда {sort?.key === "name" && sort.direction ? sortIcon(sort.direction) : null}</button></th>
                            <th className="sticky top-0 z-40 bg-[var(--color-primary)]"><button type="button" onClick={() => toggleSort("has_card")} className={headerButtonClass(sort?.key === "has_card")}>Кар. {sort?.key === "has_card" && sort.direction ? sortIcon(sort.direction) : null}</button></th>
                            <th className="sticky top-0 z-40 bg-[var(--color-primary)]"><button type="button" onClick={() => toggleSort("total")} className={headerButtonClass(sort?.key === "total")}>Итого {sort?.key === "total" && sort.direction ? sortIcon(sort.direction) : null}</button></th>
                            <th className="sticky top-0 z-40 bg-[var(--color-primary)]"><button type="button" onClick={() => toggleSort("penalty")} className={headerButtonClass(sort?.key === "penalty")}>Штраф {sort?.key === "penalty" && sort.direction ? sortIcon(sort.direction) : null}</button></th>

                            {Array.from({ length: 16 }).map((_, index) => {
                                const key = `q${index + 1}`;
                                const active = hoveredColumn === key;
                                return (
                                    <th key={key} className={`sticky top-0 z-40 bg-[var(--color-primary)] ${active ? "shadow-[inset_0_0_0_9999px_rgba(255,255,255,0.14)]" : ""}`}>
                                        <button
                                            type="button"
                                            onClick={() => toggleSort(key)}
                                            onMouseEnter={() => setHoveredColumn(key)}
                                            onMouseLeave={() => setHoveredColumn(null)}
                                            className={headerButtonClass(sort?.key === key)}
                                        >
                                            {index + 1} {sort?.key === key && sort.direction ? sortIcon(sort.direction) : null}
                                        </button>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map((team, rowIndex) => (
                            <tr
                                key={team.id}
                                onMouseEnter={() => setHoveredRow(team.id)}
                                onMouseLeave={() => setHoveredRow(null)}
                                className={rowIndex % 2 === 0 ? "bg-[rgba(248,250,252,0.88)]" : "bg-[rgba(255,255,255,0.84)]"}
                            >
                                <td className={`border-b border-r border-[var(--color-border)] px-3 py-2 ${hoveredRow === team.id ? "bg-[rgba(14,116,144,0.08)]" : ""}`}>{team.name}</td>
                                <td
                                    className={`border-b border-r border-[var(--color-border)] px-2 py-2 text-center font-semibold transition ${
                                        team.has_card
                                            ? "bg-[rgba(68,216,13,0.24)] text-[#166534]"
                                            : "bg-[rgba(237,66,66,0.2)] text-[#b91c1c]"
                                    } ${hoveredRow === team.id ? "shadow-[inset_0_0_0_9999px_rgba(14,116,144,0.08)]" : ""} ${canEditAnswers ? "cursor-pointer" : ""}`}
                                    onClick={canEditAnswers ? () => setCard(team.id, !team.has_card) : undefined}
                                    title={canEditAnswers ? "Переключить наличие карточки" : undefined}
                                >
                                    {team.has_card ? "+" : "-"}
                                </td>

                                <td className={`border-b border-r border-[var(--color-border)] px-2 py-2 text-center font-semibold ${hoveredRow === team.id ? "bg-[rgba(14,116,144,0.08)]" : ""}`}>{team.total}</td>
                                <td
                                    className={`border-b border-r border-[var(--color-border)] px-2 py-2 text-center font-semibold ${hoveredRow === team.id ? "bg-[rgba(14,116,144,0.08)]" : ""} ${team.penalty > 0 ? "text-[#b91c1c]" : ""} ${canEditPenalties ? "cursor-pointer" : ""}`}
                                    onClick={canEditPenalties ? (event) => openPopup(event, { type: "fudzi-penalty", teamId: team.id, penalty: team.penalty, width: 220, x: 0, y: 0 }) : undefined}
                                >
                                    {team.penalty > 0 ? `-${team.penalty}` : ""}
                                </td>
                                {team.answers.map((answer, index) => {
                                    const key = `q${index + 1}`;
                                    const active = hoveredRow === team.id || hoveredColumn === key;
                                    const background = answer.status === "correct"
                                        ? "bg-[rgba(68,216,13,0.24)] text-[#166534]"
                                        : answer.status === "incorrect"
                                            ? "bg-[rgba(237,66,66,0.2)] text-[#b91c1c]"
                                            : "";

                                    return (
                                        <td
                                            key={key}
                                            onMouseEnter={() => setHoveredColumn(key)}
                                            onMouseLeave={() => setHoveredColumn(null)}
                                            onClick={canEditAnswers ? (event) => openPopup(event, { type: "fudzi-answer", teamId: team.id, questionIndex: index + 1, width: 220, x: 0, y: 0 }) : undefined}
                                            className={`border-b border-r border-[var(--color-border)] px-1 py-2 text-center transition ${background} ${active ? "shadow-[inset_0_0_0_9999px_rgba(14,116,144,0.08)]" : ""} ${canEditAnswers ? "cursor-pointer" : ""}`}
                                        >
                                            {answer.status === "correct" ? answer.score : ""}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {popup ? (
                <div ref={popupRef}>
                    <Popup popup={popup}>
                        {popup.type === "fudzi-answer" ? (
                            <>
                                {(() => {
                                    const team = sortedData.find((item) => item.id === popup.teamId);
                                    const answer = team?.answers?.[popup.questionIndex - 1];
                                    const currentStatus = answer?.status ?? "not_submitted";

                                    return (
                                        <>
                                            {currentStatus !== "correct" ? (
                                                <PopupButton onClick={() => { setAnswer(popup.teamId, popup.questionIndex, "correct"); setPopup(null); }} variant="success">Отметить как верный</PopupButton>
                                            ) : null}
                                            {currentStatus !== "incorrect" ? (
                                                <PopupButton onClick={() => { setAnswer(popup.teamId, popup.questionIndex, "incorrect"); setPopup(null); }} variant="danger">Отметить как неверный</PopupButton>
                                            ) : null}
                                            {currentStatus !== "not_submitted" ? (
                                                <PopupButton onClick={() => { setAnswer(popup.teamId, popup.questionIndex, "not_submitted"); setPopup(null); }}>Сбросить ответ</PopupButton>
                                            ) : null}
                                        </>
                                    );
                                })()}
                            </>
                        ) : popup.type === "fudzi-penalty" ? (
                            <>
                                {(() => {
                                    const team = sortedData.find((item) => item.id === popup.teamId);
                                    const penalty = team?.penalty ?? popup.penalty;

                                    return (
                                        <CounterRow
                                            label="Штраф"
                                            value={penalty}
                                            onIncrease={() => { setPenalty(popup.teamId, penalty + 1); }}
                                            onDecrease={() => { setPenalty(popup.teamId, Math.max(0, penalty - 1)); }}
                                        />
                                    );
                                })()}
                            </>
                        ) : null}
                    </Popup>
                </div>
            ) : null}
        </section>
    );
}

function KvartalyResultsTable({ data, leagueId }: { data: KvartalyTeam[]; leagueId: number }) {
    const { guest, can } = useUser();
    const canEditAnswers = !guest && can("leagues", "edit_answers", leagueId);
    const canEditPenalties = !guest && can("leagues", "edit_penalties", leagueId);
    const addAnswer = useSocketStore((state) => state.kvartalAddAnswer);
    const finishQuarter = useSocketStore((state) => state.kvartalFinish);
    const setPenalty = useSocketStore((state) => state.kvartalSetPenalty);

    const [sort, setSort] = useState<SortState>(null);
    const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);
    const [hoveredRow, setHoveredRow] = useState<number | null>(null);
    const [popup, setPopup] = useState<PopupState | null>(null);
    const popupRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function handleClick(event: MouseEvent) {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                setPopup(null);
            }
        }

        window.addEventListener("mousedown", handleClick);
        return () => window.removeEventListener("mousedown", handleClick);
    }, []);

    const sortedData = useMemo(() => {
        if (!sort?.key || !sort.direction) {
            return data;
        }

        const getValue = (team: KvartalyTeam) => {
            if (sort.key === "name") return team.name;
            if (sort.key === "penalty") return team.penalty;
            if (sort.key === "total") return team.total;
            if (sort.key.startsWith("q")) {
                const key = sort.key;
                if (key.startsWith("bonus_")) {
                    const quarterIndex = Number(key.slice(6)) - 1;
                    return team.quarters[quarterIndex]?.bonus ?? "";
                }

                const [, quarterString, answerString] = key.match(/^q(\d+)_(\d+)$/) ?? [];
                const quarterIndex = Number(quarterString) - 1;
                const answerIndex = Number(answerString) - 1;
                return team.quarters[quarterIndex]?.answers[answerIndex]?.score ?? "";
            }
            return "";
        };

        return [...data].sort((left, right) => {
            const compared = compareValues(getValue(left), getValue(right));
            return sort.direction === "asc" ? compared : -compared;
        });
    }, [data, sort]);

    function toggleSort(key: string) {
        setSort((current) => {
            if (!current || current.key !== key) {
                return { key, direction: "asc" };
            }

            if (current.direction === "asc") {
                return { key, direction: "desc" };
            }

            if (current.direction === "desc") {
                return null;
            }

            return { key, direction: "asc" };
        });
    }

    function openPopup(event: React.MouseEvent, nextPopup: PopupState) {
        const rect = event.currentTarget.getBoundingClientRect();
        setPopup({
            ...nextPopup,
            anchorLeft: rect.left,
            anchorRight: rect.right,
            anchorTop: rect.top,
            anchorBottom: rect.bottom,
            ...getPopupPosition(event, nextPopup.width, nextPopup.type === "kvartaly-answer" ? 126 : 120),
        });
    }

    return (
        <section className="h-[calc(100vh-5rem)] overflow-x-auto">
            <div className="max-h-[calc(100vh-5rem)] min-w-[1120px] overflow-auto rounded-[24px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.9)] shadow-[0_18px_52px_rgba(15,23,42,0.08)]">
                <table className="w-full table-fixed border-collapse text-[13px] text-[var(--color-text-main)]">
                    <colgroup>
                        <col className="w-[16%]" />
                        <col className="w-[4.5%]" />
                        <col className="w-[4.5%]" />
                        {Array.from({ length: 20 }).map((_, index) => <col key={index} className="w-[3.1%]" />)}
                    </colgroup>
                    <thead className="bg-[var(--color-primary)] text-white">
                        <tr>
                            <th rowSpan={2} className="sticky top-0 z-40 bg-[var(--color-primary)]"><button type="button" onClick={() => toggleSort("name")} className={headerButtonClass(sort?.key === "name")}>Команда {sort?.key === "name" && sort.direction ? sortIcon(sort.direction) : null}</button></th>
                            <th rowSpan={2} className="sticky top-0 z-40 bg-[var(--color-primary)]"><button type="button" onClick={() => toggleSort("total")} className={headerButtonClass(sort?.key === "total")}>Итого {sort?.key === "total" && sort.direction ? sortIcon(sort.direction) : null}</button></th>
                            <th rowSpan={2} className="sticky top-0 z-40 bg-[var(--color-primary)]"><button type="button" onClick={() => toggleSort("penalty")} className={headerButtonClass(sort?.key === "penalty")}>Штраф {sort?.key === "penalty" && sort.direction ? sortIcon(sort.direction) : null}</button></th>
                            {Array.from({ length: 4 }).map((_, quarterIndex) => (
                                <th key={quarterIndex} colSpan={5} className="sticky top-0 z-40 h-6 bg-[var(--color-primary)] px-1 py-0 text-center text-[10px] font-semibold uppercase tracking-[0.04em] leading-none">
                                    Квартал {quarterIndex + 1}
                                </th>
                            ))}
                        </tr>
                        <tr>
                            {Array.from({ length: 4 }).map((_, quarterIndex) => (
                                Array.from({ length: 5 }).map((_, cellIndex) => {
                                    const key = cellIndex === 4 ? `bonus_${quarterIndex + 1}` : `q${quarterIndex + 1}_${cellIndex + 1}`;
                                    const label = cellIndex === 4 ? "Б" : `${quarterIndex * 4 + cellIndex + 1}`;
                                    const active = hoveredColumn === key;

                                    return (
                                        <th key={key} className={`sticky top-[24px] z-40 h-5 bg-[var(--color-primary)] ${active ? "shadow-[inset_0_0_0_9999px_rgba(255,255,255,0.14)]" : ""}`}>
                                            <button
                                                type="button"
                                                onClick={() => toggleSort(key)}
                                                onMouseEnter={() => setHoveredColumn(key)}
                                                onMouseLeave={() => setHoveredColumn(null)}
                                                className={headerButtonClass(sort?.key === key)}
                                            >
                                                {label} {sort?.key === key && sort.direction ? sortIcon(sort.direction) : null}
                                            </button>
                                        </th>
                                    );
                                })
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map((team, rowIndex) => (
                            <tr
                                key={team.id}
                                onMouseEnter={() => setHoveredRow(team.id)}
                                onMouseLeave={() => setHoveredRow(null)}
                                className={rowIndex % 2 === 0 ? "bg-[rgba(248,250,252,0.88)]" : "bg-[rgba(255,255,255,0.84)]"}
                            >
                                <td className={`border-b border-r border-[var(--color-border)] px-3 py-2 ${hoveredRow === team.id ? "bg-[rgba(14,116,144,0.08)]" : ""}`}>{team.name}</td>
                                <td className={`border-b border-r border-[var(--color-border)] px-2 py-2 text-center font-semibold ${hoveredRow === team.id ? "bg-[rgba(14,116,144,0.08)]" : ""}`}>{team.total}</td>
                                <td
                                    className={`border-b border-r border-[var(--color-border)] px-2 py-2 text-center font-semibold ${hoveredRow === team.id ? "bg-[rgba(14,116,144,0.08)]" : ""} ${team.penalty > 0 ? "text-[#b91c1c]" : ""} ${canEditPenalties ? "cursor-pointer" : ""}`}
                                    onClick={canEditPenalties ? (event) => openPopup(event, { type: "kvartaly-penalty", teamId: team.id, penalty: team.penalty, width: 220, x: 0, y: 0 }) : undefined}
                                >
                                    {team.penalty > 0 ? `-${team.penalty}` : ""}
                                </td>
                                {team.quarters.map((quarter, quarterIndex) => (
                                    <FragmentRow
                                        key={`${team.id}-${quarterIndex}`}
                                        cells={quarter.answers.map((answer, answerIndex) => {
                                            const key = `q${quarterIndex + 1}_${answerIndex + 1}`;
                                            const active = hoveredRow === team.id || hoveredColumn === key;
                                            const colorClass = answer.score > 0
                                                ? "bg-[rgba(68,216,13,0.24)] text-[#166534]"
                                                : answer.score < 0
                                                    ? "bg-[rgba(237,66,66,0.2)] text-[#b91c1c]"
                                                    : "";

                                            return (
                                                <td
                                                    key={key}
                                                    onMouseEnter={() => setHoveredColumn(key)}
                                                    onMouseLeave={() => setHoveredColumn(null)}
                                                    onClick={canEditAnswers ? (event) => openPopup(event, {
                                                        type: "kvartaly-answer",
                                                        teamId: team.id,
                                                        questionNumber: quarterIndex * 4 + answerIndex + 1,
                                                        correct: answer.correct,
                                                        incorrect: answer.incorrect,
                                                        width: 280,
                                                        x: 0,
                                                        y: 0,
                                                    }) : undefined}
                                                    className={`border-b border-r border-[var(--color-border)] px-1 py-2 text-center transition ${colorClass} ${active ? "shadow-[inset_0_0_0_9999px_rgba(14,116,144,0.08)]" : ""} ${canEditAnswers ? "cursor-pointer" : ""}`}
                                                >
                                                    {answer.score !== 0 ? answer.score : quarter.finished ? 0 : ""}
                                                </td>
                                            );
                                        }).concat(
                                            <td
                                                key={`bonus_${quarterIndex + 1}`}
                                                onMouseEnter={() => setHoveredColumn(`bonus_${quarterIndex + 1}`)}
                                                onMouseLeave={() => setHoveredColumn(null)}
                                                onClick={canEditAnswers ? (event) => openPopup(event, { type: "kvartaly-bonus", teamId: team.id, quarterIndex, finished: quarter.finished, width: 220, x: 0, y: 0 }) : undefined}
                                                className={`border-b border-r border-[var(--color-border)] px-1 py-2 text-center font-semibold transition ${quarter.bonus > 0 ? "bg-[rgba(68,216,13,0.24)] text-[#166534]" : ""} ${(hoveredRow === team.id || hoveredColumn === `bonus_${quarterIndex + 1}`) ? "shadow-[inset_0_0_0_9999px_rgba(14,116,144,0.08)]" : ""} ${canEditAnswers ? "cursor-pointer" : ""}`}
                                            >
                                                {quarter.bonus > 0 ? quarter.bonus : quarter.finished ? 0 : ""}
                                            </td>
                                        )}
                                    />
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {popup ? (
                <div ref={popupRef}>
                    <Popup popup={popup}>
                        {popup.type === "kvartaly-answer" ? (
                            <>
                                <CounterRow
                                    label="Верных ответов"
                                    value={popup.correct}
                                    onIncrease={() => { addAnswer(popup.teamId, popup.questionNumber, 1, 0); setPopup(null); }}
                                    onDecrease={() => { addAnswer(popup.teamId, popup.questionNumber, -1, 0); setPopup(null); }}
                                    positive
                                    maxValue={1}
                                />
                                <CounterRow
                                    label="Неверных ответов"
                                    value={popup.incorrect}
                                    onIncrease={() => { addAnswer(popup.teamId, popup.questionNumber, 0, 1); setPopup(null); }}
                                    onDecrease={() => { addAnswer(popup.teamId, popup.questionNumber, 0, -1); setPopup(null); }}
                                />
                            </>
                        ) : popup.type === "kvartaly-bonus" ? (
                            <>
                                <PopupButton onClick={() => { finishQuarter(popup.teamId, popup.quarterIndex + 1, !popup.finished); setPopup(null); }} variant={popup.finished ? "danger" : "success"}>
                                    <span className="inline-flex items-center gap-2">
                                        {popup.finished ? <X size={16} /> : <Check size={16} />}
                                        <span>{popup.finished ? "Открыть квартал" : "Закрыть квартал"}</span>
                                    </span>
                                </PopupButton>
                            </>
                        ) : popup.type === "kvartaly-penalty" ? (
                            <>
                                {(() => {
                                    const team = sortedData.find((item) => item.id === popup.teamId);
                                    const penalty = team?.penalty ?? popup.penalty;

                                    return (
                                        <CounterRow
                                            label="Штраф"
                                            value={penalty}
                                            onIncrease={() => { setPenalty(popup.teamId, penalty + 1); }}
                                            onDecrease={() => { setPenalty(popup.teamId, Math.max(0, penalty - 1)); }}
                                        />
                                    );
                                })()}
                            </>
                        ) : null}
                    </Popup>
                </div>
            ) : null}
        </section>
    );
}

function FragmentRow({ cells }: { cells: ReactNode[] }) {
    return <>{cells}</>;
}

function LeagueStageResultsPage({
    stageType,
    title,
}: {
    stageType: StageType;
    title: string;
}) {
    const location = useLocation();
    const { leagueId } = useParams();
    const { eventInfo, locationInfo, leagueInfo } = useOutletContext<EventsOutletContext>();
    const connect = useSocketStore((state) => state.connect);
    const disconnect = useSocketStore((state) => state.disconnect);
    const tableData = useSocketStore((state) => state.tableData);
    const isConnected = useSocketStore((state) => state.isConnected);
    const routePattern = useMemo(
        () => new RegExp(`^/events/\\d+/location/\\d+/league/${leagueId}/results/${stageType}/?$`),
        [leagueId, stageType]
    );
    const isReadyToConnect = Boolean(leagueId && stageType && routePattern.test(location.pathname));

    useEffect(() => {
        if (!isReadyToConnect || !leagueId) {
            disconnect();
            return;
        }

        const frameId = window.requestAnimationFrame(() => {
            connect(stageType, leagueId);
        });

        return () => {
            window.cancelAnimationFrame(frameId);
            disconnect();
        };
    }, [connect, disconnect, isReadyToConnect, leagueId, stageType]);

    const data = useMemo(
        () => Array.isArray(tableData) ? tableData as KvartalyTeam[] | FudziTeam[] : [],
        [tableData]
    );
    const loading = !tableData;
    const numericLeagueId = Number(leagueId);

    return (
        <section className="space-y-6 h-[calc(100vh-5rem)]">
            {/*<div className="space-y-2">*/}
            {/*    <div className="text-3xl font-semibold tracking-tight text-[var(--color-text-main)]">*/}
            {/*        {title}*/}
            {/*    </div>*/}
            {/*    <div className="space-y-1 text-sm text-[var(--color-text-secondary)]">*/}
            {/*        {eventInfo ? <div>Мероприятие: {eventInfo.name}</div> : null}*/}
            {/*        {locationInfo ? <div>Площадка: {locationInfo.name}</div> : null}*/}
            {/*        {leagueInfo ? <div>Лига: {leagueInfo.name}</div> : null}*/}
            {/*        <div>Статус подключения: {isConnected ? "подключено" : "подключение..."}</div>*/}
            {/*    </div>*/}
            {/*</div>*/}

            {loading ? (
                <div className="rounded-[24px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.84)] px-6 py-8 text-sm text-[var(--color-text-secondary)]">
                    Загрузка...
                </div>
            ) : stageType === "kvartaly" ? (
                <KvartalyResultsTable data={data as KvartalyTeam[]} leagueId={numericLeagueId} />
            ) : (
                <FudziResultsTable data={data as FudziTeam[]} leagueId={numericLeagueId} />
            )}
        </section>
    );
}

export function KvartalyResultsPage() {
    return <LeagueStageResultsPage stageType="kvartaly" title="Результаты кварталов" />;
}

export function FudziResultsPage() {
    return <LeagueStageResultsPage stageType="fudzi" title="Результаты фудзи" />;
}
