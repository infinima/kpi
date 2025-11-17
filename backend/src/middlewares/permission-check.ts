import { query } from "../utils/database.js";
import { authRequired } from "./auth-required.js";

export function checkPermission(
    object: "events" | "locations" | "leagues" | "teams" | "users",
    permission: "get" | "create" | "update" | "delete" | "access_history" | "restore"
) {
    if (permission === "get" && object !== "users") {
        throw new Error(`Permission "get" can only be used with object "users".`);
    }

    // @ts-ignore
    return async function (req, res, next
    ) {
        await authRequired(req, res, async () => {
            const userId = req.user_id;
            const objectId = req.params.id ? Number(req.params.id) : null;

            const permissions = await query(
                `
                    SELECT 1
                    FROM permissions
                    WHERE user_id = ?
                      AND object = ?
                      AND FIND_IN_SET(?, permission)
                      AND (
                        object_id IS NULL
                            OR object_id = ?
                        )
                    LIMIT 1
                `,
                [userId, object, permission, objectId]
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
