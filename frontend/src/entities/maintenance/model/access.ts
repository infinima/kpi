import type { MaintenanceMode } from "../../../shared/api/schema.js";
import type { PermissionsResponse } from "../../permission/model/permissions.js";
export const maintenanceLabels: Record<MaintenanceMode, string> = { off: "Работает", users: "В работе", all: "Технические работы" };
export function isMaintenanceAdmin(rights: PermissionsResponse | null | undefined): boolean {
    return Boolean(rights?.grants.some(grant => grant.role === "admin" && grant.scope_type === "global"));
}
export function maintenanceAccess(mode: MaintenanceMode, admin: boolean, pathname: string): "application" | "login" | "maintenance" {
    if (mode === "off" || (mode === "users" && admin)) return "application";
    return pathname.replace(/\/+$/, "") === "/auth" ? "login" : "maintenance";
}
