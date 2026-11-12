import type { PermissionEntity, PermissionsResponse } from "../../entities/permission/model/permissions.js";
import { hasAnyPermission } from "../../entities/permission/model/permissions.js";

export type CollectionViewMode = "cards" | "table";
export type CollectionEntity = "events" | "locations" | "leagues";

export const VIEW_MODE_PARAM: Record<CollectionEntity, string> = {
    events: "events_view",
    locations: "locations_view",
    leagues: "leagues_view",
};

export function canUseTableMode(rights: PermissionsResponse | undefined, entity: PermissionEntity) {
    return hasAnyPermission(rights, entity, ["create", "update", "delete"]);
}

export function getCollectionViewMode(
    searchParams: URLSearchParams,
    entity: CollectionEntity,
    allowTable: boolean,
): CollectionViewMode {
    const value = searchParams.get(VIEW_MODE_PARAM[entity]);
    if (allowTable && value === "table") {
        return "table";
    }

    return "cards";
}
