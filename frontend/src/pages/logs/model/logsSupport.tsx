import { logApi } from "@/entities/log/api/logApi";
import { fudziSnapshot, kvartalySnapshot } from "@/entities/log/api/snapshot";
import { FudziLogRow } from "@/entities/log/ui/FudziLogRow";
import { KvartalyLogRow } from "@/entities/log/ui/KvartalyLogRow";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { FudziStatus, LogAction, LogEntity, LogRecord, LogUser, PrimaryLogEntity, TeamStageLogChange } from '../../../entities/log/model/log.js';
export type { FudziStatus, LogAction, LogEntity, LogRecord, LogsResponse, LogUser, PrimaryLogEntity, TeamStageLogChange } from '../../../entities/log/model/log.js';

export type LogsPageMode = "collection" | "record" | "user-actions";

export type LogsPageProps = {
    mode?: LogsPageMode;
    entity?: PrimaryLogEntity;
};

export const ENTITY_META: Record<LogEntity, { label: string; singular: string; }> = {
    events: { label: "Мероприятия", singular: "мероприятия" },
    locations: { label: "Площадки", singular: "площадки" },
    leagues: { label: "Лиги", singular: "лиги" },
    teams: { label: "Команды", singular: "команды" },
    users: { label: "Пользователи", singular: "пользователя" },
    permissions: { label: "Права", singular: "прав" },
    mailings: { label: "Рассылки", singular: "рассылки" },
};

export const ACTION_META: Record<LogAction, { label: string; className: string; }> = {
    INSERT: {
        label: "Создание",
        className: "border-[rgba(5,150,105,0.24)] bg-[rgba(16,185,129,0.12)] text-[rgb(5,150,105)]",
    },
    UPDATE: {
        label: "Изменение",
        className: "border-[rgba(14,116,144,0.18)] bg-[rgba(14,116,144,0.10)] text-[var(--color-primary)]",
    },
    DELETE: {
        label: "Удаление",
        className: "border-[rgba(220,38,38,0.2)] bg-[rgba(239,68,68,0.12)] text-[rgb(185,28,28)]",
    },
};

export const COLLECTION_ENTITIES: PrimaryLogEntity[] = ["events", "locations", "leagues", "teams", "users"];

export const FALLBACK_ENTITY_META = { label: "Неизвестная сущность", singular: "записи" } as const;

export const FALLBACK_ACTION_META = {
    label: "Действие",
    className: "border-[var(--color-border)] bg-[rgba(148,163,184,0.08)] text-[var(--color-text-secondary)]",
} as const;

export function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function formatDateTime(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function formatActor(user?: LogUser, userId?: number | null) {
    if (user) {
        const fullName = [user.last_name, user.first_name, user.patronymic].filter(Boolean).join(" ").trim();
        return fullName || user.email || `Пользователь #${user.id}`;
    }

    if (userId) {
        return `Пользователь #${userId}`;
    }

    return "Системное действие";
}

export function shortJson(value: unknown): string {
    if (value === null || value === undefined) {
        return "—";
    }

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }

    if (Array.isArray(value)) {
        if (value.length === 0) {
            return "[]";
        }

        return value.length <= 3
            ? value.map((item) => shortJson(item)).join(", ")
            : `${value.length} элементов`;
    }

    if (isRecord(value)) {
        const keys = Object.keys(value);
        return keys.length === 0 ? "{}" : `${keys.length} полей`;
    }

    return String(value);
}

export function jsonBlock(value: unknown) {
    if (value === null || value === undefined) {
        return "—";
    }

    try {
        return JSON.stringify(value, null, 2) ?? "—";
    } catch {
        return String(value);
    }
}

export function getEntityMeta(entity: unknown) {
    return typeof entity === "string" && entity in ENTITY_META
        ? ENTITY_META[entity as LogEntity]
        : FALLBACK_ENTITY_META;
}

export function getActionMeta(action: unknown) {
    return typeof action === "string" && action in ACTION_META
        ? ACTION_META[action as LogAction]
        : FALLBACK_ACTION_META;
}

export function getDiffEntries(log: LogRecord) {
    const diff = isRecord(log.diff_data) ? log.diff_data : null;
    if (diff) {
        return Object.entries(diff).slice(0, 8).map(([key, value]) => {
            if (isRecord(value) && ("old" in value || "new" in value)) {
                return {
                    key,
                    oldValue: shortJson(value.old),
                    newValue: shortJson(value.new),
                };
            }

            return {
                key,
                oldValue: shortJson(isRecord(log.old_data) ? log.old_data[key] : undefined),
                newValue: shortJson(value),
            };
        });
    }

    const previous = isRecord(log.old_data) ? log.old_data : null;
    const next = isRecord(log.new_data) ? log.new_data : null;
    const keys = [...new Set([...(previous ? Object.keys(previous) : []), ...(next ? Object.keys(next) : [])])];

    return keys.slice(0, 8).map((key) => ({
        key,
        oldValue: shortJson(previous?.[key]),
        newValue: shortJson(next?.[key]),
    }));
}

export function extractFudziChange(record: LogRecord): TeamStageLogChange | null {
    const oldQuestions = isRecord(record.old_data) && isRecord(record.old_data.answers_fudzi) && Array.isArray(record.old_data.answers_fudzi.questions)
        ? record.old_data.answers_fudzi.questions
        : null;
    const newQuestions = isRecord(record.new_data) && isRecord(record.new_data.answers_fudzi) && Array.isArray(record.new_data.answers_fudzi.questions)
        ? record.new_data.answers_fudzi.questions
        : null;
    const oldPenalty = isRecord(record.old_data) ? Number(record.old_data.penalty_fudzi ?? 0) : 0;
    const newPenalty = isRecord(record.new_data) ? Number(record.new_data.penalty_fudzi ?? 0) : 0;

    if (oldQuestions && newQuestions) {
        for (let index = 0;index < Math.max(oldQuestions.length, newQuestions.length);index += 1) {
            const previous = isRecord(oldQuestions[index]) ? oldQuestions[index] : null;
            const next = isRecord(newQuestions[index]) ? newQuestions[index] : null;
            const oldStatus = (typeof previous?.status === "string" ? previous.status : "not_submitted") as FudziStatus;
            const newStatus = (typeof next?.status === "string" ? next.status : "not_submitted") as FudziStatus;

            if (oldStatus !== newStatus) {
                return {
                    type: "fudzi",
                    record,
                    questionIndex: index,
                    penaltyChanged: oldPenalty !== newPenalty,
                };
            }
        }
    }

    if (oldPenalty !== newPenalty) {
        return {
            type: "fudzi",
            record,
            questionIndex: null,
            penaltyChanged: true,
        };
    }

    return null;
}

export function extractKvartalyChange(record: LogRecord): TeamStageLogChange | null {
    const oldQuarters = isRecord(record.old_data) && Array.isArray(record.old_data.answers_kvartaly)
        ? record.old_data.answers_kvartaly
        : null;
    const newQuarters = isRecord(record.new_data) && Array.isArray(record.new_data.answers_kvartaly)
        ? record.new_data.answers_kvartaly
        : null;
    const oldPenalty = isRecord(record.old_data) ? Number(record.old_data.penalty_kvartaly ?? 0) : 0;
    const newPenalty = isRecord(record.new_data) ? Number(record.new_data.penalty_kvartaly ?? 0) : 0;

    if (oldQuarters && newQuarters) {
        for (let quarterIndex = 0;quarterIndex < Math.max(oldQuarters.length, newQuarters.length);quarterIndex += 1) {
            const previousQuarter = isRecord(oldQuarters[quarterIndex]) ? oldQuarters[quarterIndex] : null;
            const nextQuarter = isRecord(newQuarters[quarterIndex]) ? newQuarters[quarterIndex] : null;
            const oldFinished = Boolean(previousQuarter?.finished);
            const newFinished = Boolean(nextQuarter?.finished);

            if (oldFinished !== newFinished) {
                return {
                    type: "kvartaly",
                    record,
                    quarterIndex,
                    questionIndex: null,
                    penaltyChanged: oldPenalty !== newPenalty,
                    finishChanged: true,
                };
            }

            const oldAnswers = previousQuarter && Array.isArray(previousQuarter.questions) ? previousQuarter.questions : [];
            const newAnswers = nextQuarter && Array.isArray(nextQuarter.questions) ? nextQuarter.questions : [];

            for (let questionIndex = 0;questionIndex < Math.max(oldAnswers.length, newAnswers.length);questionIndex += 1) {
                const previous = isRecord(oldAnswers[questionIndex]) ? oldAnswers[questionIndex] : null;
                const next = isRecord(newAnswers[questionIndex]) ? newAnswers[questionIndex] : null;
                const oldCorrect = Number(previous?.correct ?? 0);
                const newCorrect = Number(next?.correct ?? 0);
                const oldIncorrect = Number(previous?.incorrect ?? 0);
                const newIncorrect = Number(next?.incorrect ?? 0);

                if (oldCorrect !== newCorrect || oldIncorrect !== newIncorrect) {
                    return {
                        type: "kvartaly",
                        record,
                        quarterIndex,
                        questionIndex,
                        penaltyChanged: oldPenalty !== newPenalty,
                        finishChanged: false,
                    };
                }
            }
        }
    }

    if (oldPenalty !== newPenalty) {
        return {
            type: "kvartaly",
            record,
            quarterIndex: null,
            questionIndex: null,
            penaltyChanged: true,
            finishChanged: false,
        };
    }

    return null;
}

export function EmptyState({ title, description }: { title: string; description: string; }) {
    return (
        <div className="rounded-[28px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.84)] px-6 py-8 text-center">
            <div className="text-lg font-semibold text-[var(--color-text-main)]">{title}</div>
            <div className="mt-2 text-sm text-[var(--color-text-secondary)]">{description}</div>
        </div>
    );
}

export function ActorLink({ log, currentMode }: { log: LogRecord; currentMode: LogsPageMode; }) {
    const actorId = log.user?.id ?? log.user_id ?? null;
    const label = formatActor(log.user, log.user_id);

    if (!actorId) {
        return <span>{label}</span>;
    }

    const targetPath = `/logs/users/${actorId}/actions`;

    if (currentMode === "user-actions" && actorId === log.user_id) {
        return <span>{label}</span>;
    }

    return (
        <Link
            to={targetPath}
            className="font-medium text-[var(--color-primary)] underline decoration-transparent underline-offset-4 transition hover:decoration-current"
        >
            {label}
        </Link>
    );
}

export function TeamStageLogsSection({
    teamId,
    stage,
}: {
    teamId: number;
    stage: "fudzi" | "kvartaly";
}) {
    const [page, setPage] = useState(1);
    const [index, setIndex] = useState(0);

    const history = useQuery({ queryKey: ["logs", "team-stage", teamId, page], queryFn: ({ signal }) => logApi.list({ mode: "record", entity: "teams", recordId: teamId, page }, signal) });
    const response = history.data ?? null;
    const loading = history.isLoading;

    const changes = useMemo(() => {
        const rows = Array.isArray(response?.page) ? response.page : [];
        return rows
            .map((record) => stage === "fudzi" ? extractFudziChange(record) : extractKvartalyChange(record))
            .filter((item): item is TeamStageLogChange => Boolean(item));
    }, [response?.page, stage]);

    useEffect(() => {
        setIndex(0);
    }, [page, stage]);

    const current = changes[index] ?? null;
    const title = stage === "fudzi" ? "Логи Фудзи" : "Логи Кварталов";

    return (
        <section className="rounded-[28px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.92)] p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-[var(--color-text-main)]">{title}</h2>
                    <div className="mt-1 text-sm text-[var(--color-text-secondary)]">
                        История изменений ответов и штрафов команды.
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setIndex((currentIndex) => Math.max(0, currentIndex - 1))}
                        disabled={loading || index <= 0}
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-main)] transition hover:bg-[var(--color-hover)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <ChevronLeft size={16} />
                        Назад
                    </button>
                    <button
                        type="button"
                        onClick={() => setIndex((currentIndex) => Math.min(changes.length - 1, currentIndex + 1))}
                        disabled={loading || index >= changes.length - 1 || changes.length === 0}
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-main)] transition hover:bg-[var(--color-hover)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Вперёд
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-[var(--color-border)] bg-[rgba(248,250,252,0.7)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                <div>
                    Запись {changes.length === 0 ? 0 : index + 1} из {changes.length}
                </div>
                <div>
                    Страница {response?.current_page ?? page} из {response?.max_page ?? 1}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                        disabled={loading || (response?.current_page ?? page) <= 1}
                        className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] px-3 py-1.5 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <ChevronLeft size={14} />
                        Страница назад
                    </button>
                    <button
                        type="button"
                        onClick={() => setPage((currentPage) => Math.min(response?.max_page ?? currentPage, currentPage + 1))}
                        disabled={loading || (response?.current_page ?? page) >= (response?.max_page ?? 1)}
                        className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] px-3 py-1.5 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Страница вперёд
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="mt-4 text-sm text-[var(--color-text-secondary)]">Загружаем логи этапа…</div>
            ) : !current ? (
                <div className="mt-4 rounded-[22px] border border-dashed border-[var(--color-border)] px-4 py-5 text-sm text-[var(--color-text-secondary)]">
                    Для этого этапа на текущей странице логов изменений не найдено.
                </div>
            ) : (
                <div className="mt-4 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                        <div>{formatDateTime(current.record.created_at)}</div>
                        <div><ActorLink log={current.record} currentMode="record" /></div>
                    </div>

                    {current.type === "fudzi" ? (
                        <div className="space-y-3">
                            <FudziLogRow snapshot={fudziSnapshot(current.record.new_data)} highlightIndex={current.questionIndex} />
                            <div className="text-sm text-[var(--color-text-secondary)]">
                                {current.questionIndex !== null ? `Изменён ответ на вопрос ${current.questionIndex + 1}. ` : ""}
                                {current.penaltyChanged ? "Изменён штраф." : ""}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <KvartalyLogRow snapshot={kvartalySnapshot(current.record.new_data)} quarterIndex={current.quarterIndex} questionIndex={current.questionIndex} />
                            <div className="text-sm text-[var(--color-text-secondary)]">
                                {current.questionIndex !== null && current.quarterIndex !== null
                                    ? `Изменён ответ: квартал ${current.quarterIndex + 1}, вопрос ${current.quarterIndex * 4 + current.questionIndex + 1}. `
                                    : ""}
                                {current.finishChanged && current.quarterIndex !== null ? `Изменён статус квартала ${current.quarterIndex + 1}. ` : ""}
                                {current.penaltyChanged ? "Изменён штраф." : ""}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
