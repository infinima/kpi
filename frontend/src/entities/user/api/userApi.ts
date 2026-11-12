import { apiDelete } from "../../../shared/api/delete.js";
import { apiGet } from "../../../shared/api/get.js";
import { apiPatch } from "../../../shared/api/patch.js";
import { apiPost } from "../../../shared/api/post.js";
import type { ApiNotifyOptions } from "../../../shared/api/request.js";
import type { UserRow } from "../model/user.js";
import { fromUserRowDto } from "./contractAdapters.js";
import type { UserRowDto } from "./contracts.js";
export type UserUpdate = Pick<UserRow, "last_name" | "first_name" | "patronymic" | "email" | "phone_number" | "tg_id">;
export const userApi = {
    async list(visibility: "active" | "deleted", notify?: ApiNotifyOptions) {
        const rows: UserRowDto[] = [];
        let total = Infinity;
        while (rows.length < total) {
            const page = await apiGet<{ items: UserRowDto[]; total: number }>(`users?deleted=${visibility === "deleted"}&limit=200${rows.length ? `&offset=${rows.length}` : ""}`, notify);
            rows.push(...page.items); total = page.total;
            if (!page.items.length) break;
        }
        return rows.map(fromUserRowDto);
    },
    async get(id: number | string, notify?: ApiNotifyOptions) { return fromUserRowDto(await apiGet<UserRowDto>(`users/${id}`, notify)); },
    update(id: number, body: UserUpdate, notify?: ApiNotifyOptions) { const { tg_id: _telegram, ...profile } = body; return apiPatch(`users/${id}`, profile, notify); },
    remove(id: number) { return apiDelete(`users/${id}`, id); },
    restore(id: number, notify?: ApiNotifyOptions) { return apiPost(`users/${id}/restore`, undefined, notify); },
};
