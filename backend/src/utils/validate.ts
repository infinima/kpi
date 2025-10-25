import { ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";

export function validate<T>(
    schema: ZodSchema<T>,
    source: "body" | "query" | "params" = "body"
) {
    return (req: Request, res: Response, next: NextFunction) => {
        const parse = schema.safeParse(req[source]);
        if (!parse.success) {
            return res.status(400).json({
                error: "Validation failed",
                issues: parse.error.issues,
            });
        }

        (req as any).validated = parse.data;
        next();
    };
}
