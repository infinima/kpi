import { apiGet } from "../../shared/api/get.js";
import { apiPost } from "../../shared/api/post.js";
import { request } from "../../shared/api/request.js";
import type { GrantIn, GrantOut } from "../../shared/api/schema.js";
export const roleApi = {
    list(userId: number) { return apiGet<GrantOut[]>(`users/${userId}/roles`); },
    create(body: GrantIn) { return apiPost<GrantOut>("role-assignments", body, { error: true }); },
    remove(id: number) { return request({ method: "DELETE", path: `role-assignments/${id}`, notify: { error: true } }); },
};
