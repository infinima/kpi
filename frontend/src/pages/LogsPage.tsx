import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Database, History, ShieldUser } from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiGet } from "@/api";
import { FudziLogRow } from "@/components/FudziLogRow";
import { KvartalyLogRow } from "@/components/KvartalyLogRow";

type LogEntity = "events" | "locations" | "leagues" | "teams" | "users" | "permissions" | "mailings";
type PrimaryLogEntity = "events" | "locations" | "leagues" | "teams" | "users";
type LogAction = "INSERT" | "UPDATE" | "DELETE";
type LogsPageMode = "collection" | "record" | "user-actions";

type LogsPageProps = {
    mode?: LogsPageMode;
    entity?: PrimaryLogEntity;
};

type LogUser = {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    patronymic?: string | null;
};

type LogRecord = {
    id: number;
    table_name: LogEntity;
    record_id: number | null;
    action: LogAction;
    old_data: unknown;
    new_data: unknown;
    diff_data: unknown;
    params: unknown;
    user_id: number | null;
    query_text: string | null;
    created_at: string;
    user?: LogUser;
};

type LogsResponse = {
    page: LogRecord[];
    current_page: number;
    page_size: number;
    total: number;
    max_page: number;
};

type FudziStatus = "correct" | "incorrect" | "not_submitted";

type TeamStageLogChange =
    | {
        type: "fudzi";
        record: LogRecord;
        questionIndex: number | null;
        penaltyChanged: boolean;
    }
    | {
        type: "kvartaly";
        record: LogRecord;
        quarterIndex: number | null;
        questionIndex: number | null;
        penaltyChanged: boolean;
        finishChanged: boolean;
    };

const ENTITY_META: Record<LogEntity, { label: string; singular: string }> = {
    events: { label: "Мероприятия", singular: "мероприятия" },
    locations: { label: "Площадки", singular: "площадки" },
    leagues: { label: "Лиги", singular: "лиги" },
    teams: { label: "Команды", singular: "команды" },
    users: { label: "Пользователи", singular: "пользователя" },
    permissions: { label: "Права", singular: "прав" },
    mailings: { label: "Рассылки", singular: "рассылки" },
};

const ACTION_META: Record<LogAction, { label: string; className: string }> = {
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

const COLLECTION_ENTITIES: PrimaryLogEntity[] = ["events", "locations", "leagues", "teams", "users"];

const FALLBACK_ENTITY_META = { label: "Неизвестная сущность", singular: "записи" } as const;
const FALLBACK_ACTION_META = {
    label: "Действие",
    className: "border-[var(--color-border)] bg-[rgba(148,163,184,0.08)] text-[var(--color-text-secondary)]",
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function formatDateTime(value: string) {
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

function formatActor(user?: LogUser, userId?: number | null) {
    if (user) {
        const fullName = [user.last_name, user.first_name, user.patronymic].filter(Boolean).join(" ").trim();
        return fullName || user.email || `Пользователь #${user.id}`;
    }

    if (userId) {
        return `Пользователь #${userId}`;
    }

    return "Системное действие";
}

function shortJson(value: unknown) {
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

function jsonBlock(value: unknown) {
    if (value === null || value === undefined) {
        return "—";
    }

    try {
        return JSON.stringify(value, null, 2) ?? "—";
    } catch {
        return String(value);
    }
}

function getEntityMeta(entity: unknown) {
    return typeof entity === "string" && entity in ENTITY_META
        ? ENTITY_META[entity as LogEntity]
        : FALLBACK_ENTITY_META;
}

function getActionMeta(action: unknown) {
    return typeof action === "string" && action in ACTION_META
        ? ACTION_META[action as LogAction]
        : FALLBACK_ACTION_META;
}

function getDiffEntries(log: LogRecord) {
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

function extractFudziChange(record: LogRecord): TeamStageLogChange | null {
    const oldQuestions = isRecord(record.old_data) && isRecord(record.old_data.answers_fudzi) && Array.isArray(record.old_data.answers_fudzi.questions)
        ? record.old_data.answers_fudzi.questions
        : null;
    const newQuestions = isRecord(record.new_data) && isRecord(record.new_data.answers_fudzi) && Array.isArray(record.new_data.answers_fudzi.questions)
        ? record.new_data.answers_fudzi.questions
        : null;
    const oldPenalty = isRecord(record.old_data) ? Number(record.old_data.penalty_fudzi ?? 0) : 0;
    const newPenalty = isRecord(record.new_data) ? Number(record.new_data.penalty_fudzi ?? 0) : 0;

    if (oldQuestions && newQuestions) {
        for (let index = 0; index < Math.max(oldQuestions.length, newQuestions.length); index += 1) {
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

function extractKvartalyChange(record: LogRecord): TeamStageLogChange | null {
    const oldQuarters = isRecord(record.old_data) && Array.isArray(record.old_data.answers_kvartaly)
        ? record.old_data.answers_kvartaly
        : null;
    const newQuarters = isRecord(record.new_data) && Array.isArray(record.new_data.answers_kvartaly)
        ? record.new_data.answers_kvartaly
        : null;
    const oldPenalty = isRecord(record.old_data) ? Number(record.old_data.penalty_kvartaly ?? 0) : 0;
    const newPenalty = isRecord(record.new_data) ? Number(record.new_data.penalty_kvartaly ?? 0) : 0;

    if (oldQuarters && newQuarters) {
        for (let quarterIndex = 0; quarterIndex < Math.max(oldQuarters.length, newQuarters.length); quarterIndex += 1) {
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

            for (let questionIndex = 0; questionIndex < Math.max(oldAnswers.length, newAnswers.length); questionIndex += 1) {
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

function EmptyState({ title, description }: { title: string; description: string }) {
    return (
        <div className="rounded-[28px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.84)] px-6 py-8 text-center">
            <div className="text-lg font-semibold text-[var(--color-text-main)]">{title}</div>
            <div className="mt-2 text-sm text-[var(--color-text-secondary)]">{description}</div>
        </div>
    );
}

function ActorLink({ log, currentMode }: { log: LogRecord; currentMode: LogsPageMode }) {
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

function TeamStageLogsSection({
    teamId,
    stage,
}: {
    teamId: number;
    stage: "fudzi" | "kvartaly";
}) {
    const [page, setPage] = useState(1);
    const [response, setResponse] = useState<LogsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [index, setIndex] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);

            try {
                const data = await apiGet<LogsResponse>(`logs/object/teams/${teamId}?current_page=${page}&include=user`, { error: true });
                if (!cancelled) {
                    setResponse(data);
                }
            } catch {
                if (!cancelled) {
                    setResponse(null);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void load();

        return () => {
            cancelled = true;
        };
    }, [page, teamId]);

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
                            <FudziLogRow change={current} />
                            <div className="text-sm text-[var(--color-text-secondary)]">
                                {current.questionIndex !== null ? `Изменён ответ на вопрос ${current.questionIndex + 1}. ` : ""}
                                {current.penaltyChanged ? "Изменён штраф." : ""}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <KvartalyLogRow change={current} />
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

export function LogsPage({ mode = "collection", entity }: LogsPageProps) {
    const navigate = useNavigate();
    const params = useParams();
    const [searchParams] = useSearchParams();
    const [selectedEntity, setSelectedEntity] = useState<PrimaryLogEntity>(() => {
        const value = searchParams.get("entity");
        return COLLECTION_ENTITIES.includes(value as PrimaryLogEntity) ? value as PrimaryLogEntity : "events";
    });
    const [page, setPage] = useState(1);
    const [actionFilter, setActionFilter] = useState<LogAction | "ALL">("ALL");
    const [response, setResponse] = useState<LogsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const resolvedEntity = mode === "collection" ? selectedEntity : entity;
    const rawRecordId = mode === "record"
        ? Number(
            entity === "events"
                ? params.eventId
                : entity === "locations"
                    ? params.locationId
                    : entity === "leagues"
                        ? params.leagueId
                        : entity === "teams"
                            ? params.teamId
                            : params.userId
        )
        : null;
    const recordId = Number.isFinite(rawRecordId) ? rawRecordId : null;
    const rawActionsUserId = mode === "user-actions" ? Number(params.userId) : null;
    const actionsUserId = Number.isFinite(rawActionsUserId) ? rawActionsUserId : null;

    useEffect(() => {
        setPage(1);
    }, [mode, resolvedEntity, recordId, actionsUserId]);

    useEffect(() => {
        if (mode !== "collection") {
            return;
        }

        const queryEntity = searchParams.get("entity");
        if (COLLECTION_ENTITIES.includes(queryEntity as PrimaryLogEntity) && queryEntity !== selectedEntity) {
            setSelectedEntity(queryEntity as PrimaryLogEntity);
        }
    }, [mode, searchParams, selectedEntity]);

    useEffect(() => {
        if (mode !== "collection") {
            return;
        }

        const next = new URLSearchParams(searchParams);
        if (next.get("entity") === selectedEntity) {
            return;
        }

        next.set("entity", selectedEntity);
        navigate({ search: next.toString() }, { replace: true });
    }, [mode, navigate, searchParams, selectedEntity]);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            if ((mode === "record" && (!resolvedEntity || !recordId)) || (mode === "user-actions" && !actionsUserId)) {
                setResponse(null);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const path = mode === "collection"
                    ? `logs/object/${resolvedEntity}?current_page=${page}&include=user`
                    : mode === "record"
                        ? `logs/object/${resolvedEntity}/${recordId}?current_page=${page}&include=user`
                        : `logs/user/${actionsUserId}?current_page=${page}&include=user`;
                const data = await apiGet<LogsResponse>(path, { error: true });

                if (!cancelled) {
                    setResponse(data);
                }
            } catch {
                if (!cancelled) {
                    setError("Не удалось загрузить логи.");
                    setResponse(null);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void load();

        return () => {
            cancelled = true;
        };
    }, [actionsUserId, mode, page, recordId, resolvedEntity]);

    const filteredLogs = useMemo(() => {
        const logs = Array.isArray(response?.page) ? response.page : [];
        if (actionFilter === "ALL") {
            return logs;
        }

        return logs.filter((log) => log.action === actionFilter);
    }, [actionFilter, response?.page]);

    const pageTitle = mode === "user-actions"
        ? `Журнал действий пользователя #${actionsUserId ?? "—"}`
        : mode === "record"
            ? `История изменений ${resolvedEntity ? getEntityMeta(resolvedEntity).singular : "объекта"} #${recordId ?? "—"}`
            : "Логи системы";
    const pageDescription = mode === "user-actions"
        ? "Все действия, выполненные выбранным пользователем в системе."
        : mode === "record"
            ? "История изменений конкретной записи с кратким diff и сырыми данными."
            : "Общая лента изменений по ключевым сущностям: мероприятия, площадки, лиги, команды и пользователи.";
    const shouldShowBackButton = mode === "user-actions" || (mode === "record" && (resolvedEntity === "users" || resolvedEntity === "teams"));
    const shouldShowTeamStageSections = mode === "record" && resolvedEntity === "teams" && Boolean(recordId);
    const backLink = mode === "record" && resolvedEntity
        ? `/logs?entity=${resolvedEntity}`
        : mode === "user-actions"
            ? `/logs?entity=users`
            : null;

    return (
        <section className="space-y-6">
            <div className="overflow-hidden rounded-[32px] border border-[rgba(14,116,144,0.14)] bg-[linear-gradient(135deg,rgba(240,249,255,0.96),rgba(255,255,255,0.92)_42%,rgba(236,253,245,0.9))] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(14,116,144,0.14)] bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)]">
                            {mode === "user-actions" ? <ShieldUser size={14} /> : <History size={14} />}
                            История
                        </div>
                        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-text-main)]">
                            {pageTitle}
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
                            {pageDescription}
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-[22px] border border-white/70 bg-white/82 px-4 py-3">
                            <div className="text-xs uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Записей на странице</div>
                            <div className="mt-2 text-2xl font-semibold text-[var(--color-text-main)]">{filteredLogs.length}</div>
                        </div>
                        <div className="rounded-[22px] border border-white/70 bg-white/82 px-4 py-3">
                            <div className="text-xs uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Всего логов</div>
                            <div className="mt-2 text-2xl font-semibold text-[var(--color-text-main)]">{response?.total ?? 0}</div>
                        </div>
                        <div className="rounded-[22px] border border-white/70 bg-white/82 px-4 py-3">
                            <div className="text-xs uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Страница</div>
                            <div className="mt-2 text-2xl font-semibold text-[var(--color-text-main)]">
                                {response?.current_page ?? page}/{response?.max_page ?? 1}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                    {shouldShowBackButton ? (
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white/78 px-4 py-2 text-sm font-medium text-[var(--color-text-main)] transition hover:bg-white"
                        >
                            <ArrowLeft size={16} />
                            Назад
                        </button>
                    ) : null}

                    {mode === "collection" ? COLLECTION_ENTITIES.map((item) => (
                        <button
                            key={item}
                            type="button"
                            onClick={() => setSelectedEntity(item)}
                            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                                item === selectedEntity
                                    ? "border-[rgba(14,116,144,0.18)] bg-[rgba(14,116,144,0.12)] text-[var(--color-primary)]"
                                    : "border-[var(--color-border)] bg-white/78 text-[var(--color-text-secondary)] hover:bg-white hover:text-[var(--color-text-main)]"
                            }`}
                        >
                            {ENTITY_META[item].label}
                        </button>
                    )) : null}

                    {backLink ? (
                        <Link
                            to={backLink}
                            className="rounded-full border border-[var(--color-border)] bg-white/78 px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition hover:bg-white hover:text-[var(--color-text-main)]"
                        >
                            Ко всем логам
                        </Link>
                    ) : null}

                    {mode === "record" && resolvedEntity === "users" && recordId ? (
                        <Link
                            to={`/logs/users/${recordId}/actions`}
                            className="rounded-full border border-[rgba(14,116,144,0.18)] bg-[rgba(14,116,144,0.08)] px-4 py-2 text-sm font-medium text-[var(--color-primary)] transition hover:bg-[rgba(14,116,144,0.14)]"
                        >
                            Журнал действий пользователя
                        </Link>
                    ) : null}

                    {mode === "user-actions" && actionsUserId ? (
                        <Link
                            to={`/logs/users/${actionsUserId}`}
                            className="rounded-full border border-[rgba(14,116,144,0.18)] bg-[rgba(14,116,144,0.08)] px-4 py-2 text-sm font-medium text-[var(--color-primary)] transition hover:bg-[rgba(14,116,144,0.14)]"
                        >
                            История записи пользователя
                        </Link>
                    ) : null}
                </div>
            </div>

            <div className="flex flex-col gap-3 rounded-[24px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.88)] p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="inline-flex flex-wrap gap-2">
                    {(["ALL", "INSERT", "UPDATE", "DELETE"] as const).map((action) => (
                        <button
                            key={action}
                            type="button"
                            onClick={() => setActionFilter(action)}
                            className={`rounded-full border px-3 py-1.5 text-sm transition ${
                                actionFilter === action
                                    ? "border-[rgba(14,116,144,0.18)] bg-[rgba(14,116,144,0.10)] text-[var(--color-primary)]"
                                    : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
                            }`}
                        >
                            {action === "ALL" ? "Все действия" : ACTION_META[action].label}
                        </button>
                    ))}
                </div>

                <div className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                    <Database size={16} />
                    {mode === "user-actions"
                        ? "Источник: журнал действий пользователя"
                        : `Источник: ${resolvedEntity ? getEntityMeta(resolvedEntity).label.toLowerCase() : "логи"}`}
                </div>
            </div>

            {shouldShowTeamStageSections ? (
                <div className="space-y-4">
                    <TeamStageLogsSection teamId={recordId!} stage="fudzi" />
                    <TeamStageLogsSection teamId={recordId!} stage="kvartaly" />
                </div>
            ) : null}

            {loading ? (
                <EmptyState title="Загружаем логи" description="Получаем историю изменений и подготавливаем diff по последним записям." />
            ) : error ? (
                <EmptyState title="Ошибка загрузки" description={error} />
            ) : filteredLogs.length === 0 ? (
                <EmptyState title="Логов пока нет" description="По текущему фильтру ничего не найдено." />
            ) : (
                <div className="space-y-4">
                    {filteredLogs.map((log) => {
                        const changes = getDiffEntries(log);
                        const entityMeta = getEntityMeta(log.table_name);
                        const actionMeta = getActionMeta(log.action);

                        return (
                            <article
                                key={log.id}
                                className="overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.92)] shadow-[0_18px_45px_rgba(15,23,42,0.06)]"
                            >
                                <div className="border-b border-[var(--color-border)] px-6 py-5">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${actionMeta.className}`}>
                                                    {actionMeta.label}
                                                </span>
                                                <span className="rounded-full border border-[var(--color-border)] bg-[rgba(248,250,252,0.9)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
                                                    {entityMeta.label}
                                                </span>
                                                {log.record_id ? (
                                                    <span className="rounded-full border border-[var(--color-border)] bg-white px-3 py-1 text-xs text-[var(--color-text-secondary)]">
                                                        ID #{log.record_id}
                                                    </span>
                                                ) : null}
                                            </div>

                                            <div>
                                                <div className="text-lg font-semibold text-[var(--color-text-main)]">
                                                    Запись лога #{log.id}
                                                </div>
                                                <div className="mt-1 text-sm text-[var(--color-text-secondary)]">
                                                    {formatDateTime(log.created_at)} · <ActorLink log={log} currentMode={mode} />
                                                </div>
                                            </div>
                                        </div>

                                        {log.table_name === "users" && log.record_id ? (
                                            <Link
                                                to={`/logs/users/${log.record_id}/actions`}
                                                className="rounded-full border border-[rgba(14,116,144,0.18)] bg-[rgba(14,116,144,0.08)] px-4 py-2 text-sm font-medium text-[var(--color-primary)] transition hover:bg-[rgba(14,116,144,0.14)]"
                                            >
                                                Действия пользователя
                                            </Link>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="space-y-4 px-6 py-5">
                                    {changes.length > 0 ? (
                                        <div className="grid gap-3 lg:grid-cols-2">
                                            {changes.map((change) => (
                                                <div
                                                    key={change.key}
                                                    className="rounded-[22px] border border-[var(--color-border)] bg-[rgba(248,250,252,0.8)] p-4"
                                                >
                                                    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
                                                        {change.key}
                                                    </div>
                                                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                                        <div>
                                                            <div className="text-xs text-[var(--color-text-secondary)]">Было</div>
                                                            <div className="mt-1 rounded-xl bg-white px-3 py-2 text-sm text-[var(--color-text-main)]">
                                                                {change.oldValue}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-[var(--color-text-secondary)]">Стало</div>
                                                            <div className="mt-1 rounded-xl bg-white px-3 py-2 text-sm text-[var(--color-text-main)]">
                                                                {change.newValue}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="rounded-[22px] border border-dashed border-[var(--color-border)] px-4 py-5 text-sm text-[var(--color-text-secondary)]">
                                            Для этой записи нет компактного diff. Ниже доступны сырые данные.
                                        </div>
                                    )}

                                    {log.query_text ? (
                                        <div className="rounded-[22px] border border-[var(--color-border)] bg-[rgba(15,23,42,0.03)] px-4 py-3">
                                            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
                                                SQL / комментарий
                                            </div>
                                            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-[var(--color-text-main)]">
                                                {log.query_text}
                                            </pre>
                                        </div>
                                    ) : null}

                                    <div className="grid gap-3 lg:grid-cols-3">
                                        <details className="rounded-[22px] border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4">
                                            <summary className="cursor-pointer text-sm font-semibold text-[var(--color-text-main)]">Старые данные</summary>
                                            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-[var(--color-text-secondary)]">
                                                {jsonBlock(log.old_data)}
                                            </pre>
                                        </details>
                                        <details className="rounded-[22px] border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4">
                                            <summary className="cursor-pointer text-sm font-semibold text-[var(--color-text-main)]">Новые данные</summary>
                                            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-[var(--color-text-secondary)]">
                                                {jsonBlock(log.new_data)}
                                            </pre>
                                        </details>
                                        <details className="rounded-[22px] border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4">
                                            <summary className="cursor-pointer text-sm font-semibold text-[var(--color-text-main)]">Параметры</summary>
                                            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-[var(--color-text-secondary)]">
                                                {jsonBlock(log.params)}
                                            </pre>
                                        </details>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            <div className="flex flex-col gap-3 rounded-[24px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.88)] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-[var(--color-text-secondary)]">
                    Показана страница {response?.current_page ?? page} из {response?.max_page ?? 1}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                        disabled={(response?.current_page ?? page) <= 1 || loading}
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-main)] transition hover:bg-[var(--color-hover)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <ChevronLeft size={16} />
                        Назад
                    </button>
                    <button
                        type="button"
                        onClick={() => setPage((current) => Math.min(response?.max_page ?? current, current + 1))}
                        disabled={(response?.current_page ?? page) >= (response?.max_page ?? 1) || loading}
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-main)] transition hover:bg-[var(--color-hover)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Вперёд
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </section>
    );
}
