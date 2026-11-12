export const actions = [
    "get",
    "create",
    "update",
    "delete",
    "restore",
    "access_history",
    "access_actions_history",
    "print_documents",
    "edit_answers",
    "get_show",
    "control_show",
    "edit_penalties",
    "edit_photos"
] as const;

export type PermissionAction = (typeof actions)[number];

export type PermissionObject =
    | "events"
    | "locations"
    | "leagues"
    | "teams"
    | "users"
    | "permissions"
    | "mailings";

export type PermissionScope = "global" | "local" | "nested";

export interface PermissionRow {
    id: number | null;
    user_id: number;

    object: PermissionObject | "";
    permission: PermissionAction[];

    object_id: number | null;
    scope_object: PermissionObject | null;
    scope_object_id: number | null;
}

export function validatePermission(data: PermissionRow, scope: PermissionScope): string | null {
    if (!data.object) return "Выберите объект.";
    if (data.permission.length === 0) return "Выберите хотя бы одно действие.";

    if (scope === "local" && (!data.object_id || isNaN(data.object_id)))
        return "Укажите корректный ID объекта.";

    if (scope === "nested") {
        if (!data.scope_object) return "Выберите тип родительского объекта.";
        if (!data.scope_object_id || isNaN(data.scope_object_id))
            return "Укажите корректный ID родительского объекта.";
    }

    return null;
}
