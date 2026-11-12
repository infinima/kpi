export type PermissionEntity =
    "events" |
    "locations" |
    "leagues" |
    "teams" |
    "users" |
    "permissions" |
    "mailings";

export type PermissionAction =
    "get" |
    "create" |
    "update" |
    "delete" |
    "restore" |
    "access_history" |
    "access_actions_history" |
    "print_documents" |
    "edit_answers" |
    "get_show" |
    "control_show" |
    "edit_penalties" |
    "edit_photos";

export type PermissionMap = Record<string, PermissionAction[]>;

export type EntityPermissions = {
    global?: PermissionAction[];
    ids?: PermissionMap;
    by_event?: PermissionMap;
    by_location?: PermissionMap;
    by_league?: PermissionMap;
};

export type PermissionsResponse = import("../../../shared/api/schema.js").PermissionsOut;
export type Action = import("../../../shared/api/schema.js").Action;

export type PermissionTarget = number | {
    id?: number | null;
    eventId?: number | null;
    locationId?: number | null;
    leagueId?: number | null;
};


// The view adapters still use entity/action pairs; authorization comes only from
// the server's scoped action grants. Ownership is checked on each team separately.
function canonical(entity: PermissionEntity, action: PermissionAction): Action | null {
    if (["events", "locations", "leagues"].includes(entity)) return action === "get" ? "structure.read" : null;
    if (entity === "users" || entity === "permissions") return "users.manage";
    if (entity === "mailings") return "mailings.manage";
    if (entity === "teams") return ({ get: "teams.read", create: "teams.create", update: "teams.edit", delete: "teams.manage", restore: "teams.manage" } as Partial<Record<PermissionAction, Action>>)[action] ?? null;
    return null;
}
export function canPerform(rights: PermissionsResponse | null | undefined, action: Action, target?: PermissionTarget): boolean {
    if (!rights) return false;
    const resolved = typeof target === "number" ? { id: target } : target ?? {};
    return rights.grants.some(grant => grant.actions.includes(action) && (grant.scope_type === "global" ||
        (grant.scope_id != null && grant.scope_id === ({ event: resolved.eventId, location: resolved.locationId, league: resolved.leagueId } as Record<string, number | null | undefined>)[grant.scope_type])));
}
export function hasPermission(rights: PermissionsResponse | null | undefined, entity: PermissionEntity, action: PermissionAction, target?: PermissionTarget): boolean {
    const mapped = canonical(entity, action);
    if (!mapped) return false;
    const resolved = typeof target === "number" ? { id: target } : target ?? {};
    const ownScope = entity === "events" ? { eventId: resolved.id } : entity === "locations" ? { locationId: resolved.id } : entity === "leagues" ? { leagueId: resolved.id } : {};
    return canPerform(rights, mapped, { ...ownScope, ...resolved });
}
export function hasGlobalPermission(rights: PermissionsResponse | null | undefined, entity: PermissionEntity, action: PermissionAction): boolean {
    const mapped = canonical(entity, action);
    return Boolean(mapped && rights?.grants.some(grant => grant.scope_type === "global" && grant.actions.includes(mapped)));
}
export function hasAnyPermission(rights: PermissionsResponse | null | undefined, entity: PermissionEntity, actions: readonly PermissionAction[]): boolean {
    return actions.some(action => { const mapped = canonical(entity, action); return mapped != null && Boolean(rights?.grants.some(grant => grant.actions.includes(mapped))); });
}

/** Participant registration is open only in this league phase; scoped staff grants may override it. */
export function canRegisterTeam(rights: PermissionsResponse | null | undefined, status: string, target: PermissionTarget): boolean {
    if (!rights) return false;
    return canPerform(rights, "teams.create", target)
        || (status === "REGISTRATION_IN_PROGRESS" && rights.authenticated.includes("teams.create"));
}

/** This dashboard is reserved for global administrators with the server action grant. */
export function canAccessDashboard(rights: PermissionsResponse | null | undefined): boolean {
    return Boolean(rights?.grants.some(grant => grant.role === "admin" && grant.scope_type === "global" && grant.actions.includes("dashboard.view")));
}
