import { ArrowLeft, ChevronLeft, ChevronRight, Database, History, ShieldUser } from "lucide-react";
import { Link } from "react-router-dom";
import { ACTION_META, ActorLink, COLLECTION_ENTITIES, EmptyState, ENTITY_META, formatDateTime, getActionMeta, getDiffEntries, getEntityMeta, jsonBlock, TeamStageLogsSection } from '../model/logsSupport';
import type { useLogsModel } from '../model/useLogsModel';
export function LogsView(props: ReturnType<typeof useLogsModel>) {
    const {
        mode,
        navigate,
        selectedEntity,
        setSelectedEntity,
        page,
        setPage,
        actionFilter,
        setActionFilter,
        resolvedEntity,
        recordId,
        actionsUserId,
        response,
        loading,
        error,
        filteredLogs,
        pageTitle,
        pageDescription,
        shouldShowBackButton,
        shouldShowTeamStageSections,
        backLink,
    } = props;
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
                            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${item === selectedEntity
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
                            className={`rounded-full border px-3 py-1.5 text-sm transition ${actionFilter === action
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
