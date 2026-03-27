import express, { Request, Response } from "express";
import { authRequired } from "../middlewares/auth-required.js";
import { query } from "../../db/pool.js";

export const authPermissionsRouter = express.Router();

// -----------------------------------------------------
// Типы
// -----------------------------------------------------

export type KPIObject = "events" | "locations" | "leagues" | "teams" | "users" | "permissions" | "mailings";

export type KPIPermission =
    | "get"
    | "create"
    | "update"
    | "delete"
    | "restore"
    | "access_history"
    | "access_actions_history"
    | "print_documents"
    | "edit_answers"
    | "get_show"
    | "control_show"
    | "edit_penalties"
    | "edit_photos";

export interface PermissionRow {
    object: KPIObject;
    permission: string;
    object_id: number | null;
    scope_object: "events" | "locations" | "leagues" | null;
    scope_object_id: number | null;
}

export interface PermissionOutput {
    [key: string]: {
        global?: KPIPermission[];
        ids?: Record<string, KPIPermission[]>;
        by_event?: Record<string, KPIPermission[]>;
        by_location?: Record<string, KPIPermission[]>;
        by_league?: Record<string, KPIPermission[]>;
    };
}

function addPermissionsToMap(
    map: Record<string, KPIPermission[]>,
    id: number,
    perms: KPIPermission[]
) {
    const key = String(id);
    if (!map[key]) map[key] = [];
    const tgt = map[key];

    for (const p of perms) {
        if (!tgt.includes(p)) tgt.push(p);
    }
}

function addGlobalPermissions(out: PermissionOutput, object: KPIObject, perms: KPIPermission[]) {
    if (!out[object].global) out[object].global = [];
    for (const p of perms) {
        if (!out[object].global!.includes(p)) out[object].global!.push(p);
    }
}

// -----------------------------------------------------
// ENDPOINT
// -----------------------------------------------------

authPermissionsRouter.get(
    "/",
    authRequired,
    async (req: Request, res: Response) => {
        const userId = (req as any).user_id;

        const rows = (await query(
            `
                SELECT
                    object,
                    permission,
                    object_id,
                    scope_object,
                    scope_object_id
                FROM permissions
                WHERE user_id = ?
            `,
            [userId]
        )) as PermissionRow[];

        const out: PermissionOutput = {
            events: {},
            locations: {},
            leagues: {},
            teams: {},
            users: {},
            mailings: {},
            permissions: {}
        };

        for (const row of rows) {
            const obj = row.object.trim() as KPIObject;

            if (!out[obj]) {
                console.warn("Unknown permissions object:", obj);
                continue;
            }
            const perms = row.permission.split(",") as KPIPermission[];

            // ------------------------------------------------
            // ГЛОБАЛЬНЫЕ ПРАВА
            // ------------------------------------------------
            if (!row.object_id && !row.scope_object) {
                addGlobalPermissions(out, obj, perms);
                continue;
            }

            // ------------------------------------------------
            // ПРЯМЫЕ ПРАВА
            // ------------------------------------------------
            if (row.object_id) {
                if (!out[obj].ids) out[obj].ids = {};
                addPermissionsToMap(out[obj].ids, row.object_id, perms);
            }

            // ------------------------------------------------
            // SCOPE-ПРАВА
            // ------------------------------------------------
            if (row.scope_object && row.scope_object_id) {
                if (row.scope_object === "events") {
                    if (!out[obj].by_event) out[obj].by_event = {};
                    addPermissionsToMap(out[obj].by_event, row.scope_object_id, perms);
                }

                if (row.scope_object === "locations") {
                    if (!out[obj].by_location) out[obj].by_location = {};
                    addPermissionsToMap(out[obj].by_location, row.scope_object_id, perms);
                }

                if (row.scope_object === "leagues") {
                    if (!out[obj].by_league) out[obj].by_league = {};
                    addPermissionsToMap(out[obj].by_league, row.scope_object_id, perms);
                }
            }
        }

        res.json(out);
    }
);
