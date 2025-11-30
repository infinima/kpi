import { query } from "../../utils/database.js";
import { authRequired } from "./auth-required.js";

export async function getScopeChain(object: string, objectId: number) {
    if (!objectId) return {};

    if (object === "teams") {
        const [team] = await query("SELECT league_id FROM teams WHERE id = ?", [objectId]);
        if (!team) return {};

        const [league] = await query("SELECT location_id FROM leagues WHERE id = ?", [team.league_id]);
        const [location] = await query("SELECT event_id FROM locations WHERE id = ?", [league.location_id]);

        return {
            team_id: objectId,
            league_id: team.league_id,
            location_id: league.location_id,
            event_id: location.event_id
        };
    }

    if (object === "leagues") {
        const [league] = await query("SELECT location_id FROM leagues WHERE id = ?", [objectId]);
        const [location] = await query("SELECT event_id FROM locations WHERE id = ?", [league.location_id]);

        return {
            league_id: objectId,
            location_id: league.location_id,
            event_id: location.event_id
        };
    }

    if (object === "locations") {
        const [location] = await query("SELECT event_id FROM locations WHERE id = ?", [objectId]);

        return {
            location_id: objectId,
            event_id: location.event_id
        };
    }

    if (object === "events") {
        return { event_id: objectId };
    }

    return {};
}

export function checkPermission(
    object: "events" | "locations" | "leagues" | "teams" | "users" | "permissions",
    permission: "get" | "create" | "update" | "delete" | "access_history" | "access_actions_history" | "restore" | "print_documents" | "edit_answers" | "get_show" | "control_show" | "edit_penalties"
) {
    // @ts-ignore
    return async function (req, res, next) {
        await authRequired(req, res, async () => {
            const userId = req.user_id;
            const objectId = req.params.id ? Number(req.params.id) : null;

            const chain = objectId ? await getScopeChain(object, objectId) : {};

            const permissions = await query(
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
                    userId,
                    object,
                    permission,

                    objectId,                     // direct access
                    chain.event_id || null,       // scope events
                    chain.location_id || null,    // scope locations
                    chain.league_id || null       // scope leagues
                ]
            );

            if (permissions.length > 0) {
                return next();
            }

            return res.status(403).json({
                error: {
                    code: "FORBIDDEN",
                    message: `User has no '${permission}' permission for ${object}${objectId ? " #" + objectId : ""}`
                }
            });
        });
    }
}
