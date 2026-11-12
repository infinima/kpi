import { request } from "../../../shared/api/request.js";
import type { LogsResponse } from "../model/log.js";
export type LogQuery = { mode: "collection" | "record" | "user-actions"; entity?: string; recordId?: number | null; userId?: number | null; page: number; };
export const logApi = {
    list({ mode, entity, recordId, userId, page }: LogQuery, signal?: AbortSignal) {
        const path = mode === "collection" ? `logs/object/${entity}` : mode === "record" ? `logs/object/${entity}/${recordId}` : `logs/user/${userId}`;
        return request<LogsResponse>({ method: "GET", path: `${path}?current_page=${page}&include=user`, signal, notify: { error: true } });
    },
};
