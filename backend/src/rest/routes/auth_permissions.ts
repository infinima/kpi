import express, { Request, Response } from "express";
import { authRequired } from "../middlewares/auth-required.js";
import { query } from "../../utils/database.js";

export const authPermissionsRouter = express.Router();

// -----------------------------------------------------
// Типы
// -----------------------------------------------------

export type KPIObject = "events" | "locations" | "leagues" | "teams" | "users" | "permissions";

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
    | "edit_penalties";

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
        [id: string]: KPIPermission[] | undefined;
    };
}

// правила глобальных
const GLOBAL_ONLY: KPIPermission[] = ["create"];
const GLOBAL_AND_IDS: KPIPermission[] = ["get", "restore", "access_history", "access_actions_history"];

// -----------------------------------------------------
// Утилиты: получение дочерних объектов
// -----------------------------------------------------

async function getChildIds(
    object: KPIObject,
    parentId: number
): Promise<number[]> {
    switch (object) {
        case "locations":
            return (
                await query("SELECT id FROM locations WHERE event_id = ?", [
                    parentId,
                ])
            ).map((r: any) => r.id);

        case "leagues":
            return (
                await query("SELECT id FROM leagues WHERE location_id = ?", [
                    parentId,
                ])
            ).map((r: any) => r.id);

        case "teams":
            return (
                await query("SELECT id FROM teams WHERE league_id = ?", [
                    parentId,
                ])
            ).map((r: any) => r.id);

        default:
            return [];
    }
}

// -----------------------------------------------------
// Раскрытие scope
// -----------------------------------------------------

async function resolveScopedIds(
    object: KPIObject,
    scopeObj: "events" | "locations" | "leagues" | null,
    scopeId: number | null
): Promise<number[]> {
    if (!scopeObj || !scopeId) return [];

    if (scopeObj === "events") {
        if (object === "events") return [scopeId];

        const locs = await getChildIds("locations", scopeId);
        if (object === "locations") return locs;

        const leagues = (
            await Promise.all(locs.map((l) => getChildIds("leagues", l)))
        ).flat();
        if (object === "leagues") return leagues;

        const teams = (
            await Promise.all(leagues.map((lg) => getChildIds("teams", lg)))
        ).flat();
        if (object === "teams") return teams;
    }

    if (scopeObj === "locations") {
        if (object === "locations") return [scopeId];

        const leagues = await getChildIds("leagues", scopeId);
        if (object === "leagues") return leagues;

        const teams = (
            await Promise.all(leagues.map((lg) => getChildIds("teams", lg)))
        ).flat();
        if (object === "teams") return teams;
    }

    if (scopeObj === "leagues") {
        if (object === "leagues") return [scopeId];

        const teams = await getChildIds("teams", scopeId);
        if (object === "teams") return teams;
    }

    return [];
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

                if (!out[obj].global) out[obj].global = [];

                for (const p of perms) {

                    // 1. GLOBAL_ONLY остаются ТОЛЬКО в global
                    if (GLOBAL_ONLY.includes(p)) {
                        if (!out[obj].global!.includes(p))
                            out[obj].global!.push(p);
                    }

                    // 2. GLOBAL_AND_IDS — и в global, и в ID
                    if (GLOBAL_AND_IDS.includes(p)) {
                        if (!out[obj].global!.includes(p))
                            out[obj].global!.push(p);
                    }
                }

                // теперь раскрываем ТОЛЬКО GLOBAL_AND_IDS и IDS_ONLY
                const rowsIds = await query(`SELECT id FROM ${obj}`, []);
                const ids = rowsIds.map((r: any) => r.id);

                for (const id of ids) {
                    if (!out[obj][id]) out[obj][id] = [];

                    for (const p of perms) {
                        if (p === "create") continue; // запрещено расширять
                        if (!out[obj][id]!.includes(p)) {
                            out[obj][id]!.push(p);
                        }
                    }
                }

                continue;
            }

            // ------------------------------------------------
            // ПРЯМЫЕ ПРАВА
            // ------------------------------------------------
            if (row.object_id) {
                if (!out[obj][row.object_id]) out[obj][row.object_id] = [];

                const tgt = out[obj][row.object_id] as KPIPermission[];

                for (const p of perms) {
                    if (!tgt.includes(p)) tgt.push(p);
                }
            }

            // ------------------------------------------------
            // SCOPE-ПРАВА
            // ------------------------------------------------
            if (row.scope_object && row.scope_object_id) {
                const ids = await resolveScopedIds(
                    obj,
                    row.scope_object,
                    row.scope_object_id
                );

                for (const id of ids) {
                    if (!out[obj][id]) out[obj][id] = [];
                    const tgt = out[obj][id] as KPIPermission[];

                    for (const p of perms) {
                        if (!tgt.includes(p)) tgt.push(p);
                    }
                }
            }
        }

        res.json(out);
    }
);
