import { ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";

export function validate<T>(
    schema: ZodSchema<T>,
    source: "body" | "query" | "params"
) {
    return (req: Request, res: Response, next: NextFunction) => {
        const parse = schema.safeParse(req[source]);
        if (!parse.success) {
            return res.status(400).json({
                error: "Validation failed",
                issues: parse.error.issues,
            });
        }

        const r: any = req;
        if (!r.validated) r.validated = {};
        r.validated[source] = parse.data;
        next();
    };
}
