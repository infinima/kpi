import { logApi } from "@/entities/log/api/logApi";
import { useUrlState } from "@/shared/lib/useUrlState";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { COLLECTION_ENTITIES, getEntityMeta, LogAction, LogsPageProps, PrimaryLogEntity } from './logsSupport';
export function useLogsModel({ mode = "collection", entity }: LogsPageProps) {
    const navigate = useNavigate();

    const params = useParams();

    const [selectedEntity, setSelectedEntity] = useUrlState<PrimaryLogEntity>("entity", "events", COLLECTION_ENTITIES);
    const [page, setPage] = useState(1);

    const [actionFilter, setActionFilter] = useState<LogAction | "ALL">("ALL");

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

    const history = useQuery({ queryKey: ["logs", mode, resolvedEntity, recordId, actionsUserId, page], queryFn: ({ signal }) => logApi.list({ mode, entity: resolvedEntity, recordId, userId: actionsUserId, page }, signal), enabled: mode === "collection" || (mode === "record" ? Boolean(resolvedEntity && recordId) : Boolean(actionsUserId)) });

    const response = history.data ?? null;

    const loading = history.isLoading;

    const error = history.error ? "Не удалось загрузить логи." : null;

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
    return {
        mode,
        entity,
        navigate,
        params,
        selectedEntity,
        setSelectedEntity,
        page,
        setPage,
        actionFilter,
        setActionFilter,
        resolvedEntity,
        rawRecordId,
        recordId,
        rawActionsUserId,
        actionsUserId,
        history,
        response,
        loading,
        error,
        filteredLogs,
        pageTitle,
        pageDescription,
        shouldShowBackButton,
        shouldShowTeamStageSections,
        backLink,
    };
}
