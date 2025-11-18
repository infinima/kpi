import { Request, Response, NextFunction } from "express";
import { query } from "../utils/database.js";

export type ObjectType = "event" | "location" | "league" | "team" | "user";

const CHAIN: Record<ObjectType, ObjectType | null> = {
    event: null,
    location: "event",
    league: "location",
    team: "league",
    user: null,
};

const TABLE: Record<ObjectType, string> = {
    event: "events",
    location: "locations",
    league: "leagues",
    team: "teams",
    user: "users",
};

const PARENT_FIELD: Record<"location" | "league" | "team", string> = {
    location: "event_id",
    league: "location_id",
    team: "league_id"
};

export function checkNotDeleted(type: ObjectType) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            let currentType: ObjectType | null = type;
            let currentId = Number((req as any).validated?.id ?? req.params.id);

            while (currentType) {
                const table = TABLE[currentType];
                const parentType: ObjectType | null = CHAIN[currentType];

                const parentField =
                    parentType !== null ? PARENT_FIELD[currentType as keyof typeof PARENT_FIELD] : null;

                const columns = parentField
                    ? `deleted_at, ${parentField}`
                    : `deleted_at`;

                const [row] = await query(
                    `SELECT ${columns} FROM ${table} WHERE id = ?`,
                    [currentId]
                );

                if (!row) {
                    return res.status(404).json({
                        error: {
                            code: `${currentType.toUpperCase()}_NOT_FOUND`,
                            message: `The ${currentType} does not exist`
                        }
                    });
                }

                if (row.deleted_at !== null) {
                    return res.status(400).json({
                        error: {
                            code: `${currentType.toUpperCase()}_DELETED`,
                            message: `The ${currentType} is deleted`
                        }
                    });
                }

                if (!parentType) break;

                currentId = row[parentField!];
                currentType = parentType;
            }

            next();
        } catch (err) {
            console.error(err);
            return res.status(500).json({
                error: {
                    code: "INTERNAL_ERROR",
                    message: "Internal server error"
                }
            });
        }
    };
}
