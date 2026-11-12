import { apiGet } from "../../../shared/api/get.js";
import { apiPost } from "../../../shared/api/post.js";
import type { PermissionsResponse } from "../../permission/model/permissions.js";
export type SessionUser = { tg_id: string; photo: string; patronymic: string; id: number; email: string; first_name: string; last_name: string; };
export type RegistrationDraft = { email: string; password: string; first_name: string; last_name: string; patronymic: string | null; phone_number: string; };
export const authApi = {
    me() { return apiGet<SessionUser>("auth/me").then(user => ({ user: { ...user, patronymic: user.patronymic ?? "", tg_id: "", photo: "" } })); },
    permissions() { return apiGet<PermissionsResponse>("auth/permissions"); },
    logout() { return apiPost("auth/logout"); },
    login(body: { email: string; password: string; }) { return apiPost<{ token: string; }>("auth/login", body, { error: true }); },
    startRegistration(body: RegistrationDraft) { return apiPost("auth/register/start", body, { error: true }); },
    confirmRegistration(body: { email: string; code: string; }) { return apiPost<{ id: number; token: string; }>("auth/register/confirm", body, { error: true }); },
    startPasswordReset(body: { email: string; }) { return apiPost("auth/password-reset/start", body, { error: true }); },
    confirmPasswordReset(body: { key: string; password: string; }) { return apiPost("auth/password-reset/confirm", body, { error: true }); },
};
