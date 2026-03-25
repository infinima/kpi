import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Database, History, ShieldUser } from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiGet } from "@/api";

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
    return JSON.stringify(value, null, 2);
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
        const logs = response?.page ?? [];
        if (actionFilter === "ALL") {
            return logs;
        }

        return logs.filter((log) => log.action === actionFilter);
    }, [actionFilter, response?.page]);

    const pageTitle = mode === "user-actions"
        ? `Журнал действий пользователя #${actionsUserId ?? "—"}`
        : mode === "record"
            ? `История изменений ${resolvedEntity ? ENTITY_META[resolvedEntity].singular : "объекта"} #${recordId ?? "—"}`
            : "Логи системы";
    const pageDescription = mode === "user-actions"
        ? "Все действия, выполненные выбранным пользователем в системе."
        : mode === "record"
            ? "История изменений конкретной записи с кратким diff и сырыми данными."
            : "Общая лента изменений по ключевым сущностям: мероприятия, площадки, лиги, команды и пользователи.";
    const shouldShowBackButton = mode === "user-actions" || (mode === "record" && (resolvedEntity === "users" || resolvedEntity === "teams"));
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
                        : `Источник: ${resolvedEntity ? ENTITY_META[resolvedEntity].label.toLowerCase() : "логи"}`}
                </div>
            </div>

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

                        return (
                            <article
                                key={log.id}
                                className="overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.92)] shadow-[0_18px_45px_rgba(15,23,42,0.06)]"
                            >
                                <div className="border-b border-[var(--color-border)] px-6 py-5">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${ACTION_META[log.action].className}`}>
                                                    {ACTION_META[log.action].label}
                                                </span>
                                                <span className="rounded-full border border-[var(--color-border)] bg-[rgba(248,250,252,0.9)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
                                                    {ENTITY_META[log.table_name].label}
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
