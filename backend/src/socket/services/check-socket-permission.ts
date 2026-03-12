import { query } from "../../db/pool.js";
import { getScopeChain } from "../../rest/middlewares/check-permission.js";


export async function checkSocketPermission(
    user_id: number | null,
    object: "events" | "locations" | "leagues" | "teams" | "users" | "permissions" | "mailings",
    permission: "get" | "create" | "update" | "delete" | "access_history" | "restore" | "print_documents" | "edit_answers" | "get_show" | "control_show" | "edit_penalties" | "edit_photos",
    objectId?: number
) {
    if (!user_id) return false;

    const chain = objectId ? await getScopeChain(object, objectId) : {};

    const rows = await query(
        `
            SELECT 1
            FROM permissions p
            WHERE p.user_id = ?
              AND p.object = ?
              AND FIND_IN_SET(?, p.permission)

              AND (
                p.object_id IS NULL
                    OR p.object_id = ?
                    OR (
                        p.scope_object = 'events'
                        AND p.scope_object_id = ?
                    )
                    OR (
                        p.scope_object = 'locations'
                        AND p.scope_object_id = ?
                    )
                    OR (
                        p.scope_object = 'leagues'
                        AND p.scope_object_id = ?
                    )
                )
            LIMIT 1
        `,
        [
            user_id,
            object,
            permission,

            objectId,
            chain.event_id || null,
            chain.location_id || null,
            chain.league_id || null
        ]
    );

    return rows.length > 0;
}
