import type { PermissionEntity, PermissionsResponse } from "@/store/useUserStore";

export type CollectionViewMode = "cards" | "table";
export type CollectionEntity = "events" | "locations" | "leagues";

export const VIEW_MODE_PARAM: Record<CollectionEntity, string> = {
    events: "events_view",
    locations: "locations_view",
    leagues: "leagues_view",
};

const MANAGE_ACTIONS = new Set(["create", "update", "delete"]);

export function canUseTableMode(rights: PermissionsResponse | undefined, entity: PermissionEntity) {
    if (!rights) {
        return false;
    }

    const entityRights = rights[entity];
    if (!entityRights) {
        return false;
    }

    return Object.values(entityRights).some((actions) =>
        Array.isArray(actions) && actions.some((action) => MANAGE_ACTIONS.has(action))
    );
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
