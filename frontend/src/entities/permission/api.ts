import { apiDelete } from "../../shared/api/delete.js";
import { apiGet } from "../../shared/api/get.js";
import { apiPatch } from "../../shared/api/patch.js";
import { apiPost } from "../../shared/api/post.js";
import type { PermissionRow } from "./model/editor.js";
export const permissionApi = {
    forUser(userId: number) { return apiGet<PermissionRow[]>(`permissions/user/${userId}`); },
    lookup(entity: string, id: string | number) { return apiGet<{ name?: string; title?: string; }>(`${entity}/${id}`); },
    create(body: PermissionRow) { return apiPost("permissions", body); },
    update(id: number, body: PermissionRow) { return apiPatch(`permissions/${id}`, body); },
    remove(id: number) { return apiDelete(`permissions/${id}`); },
};
