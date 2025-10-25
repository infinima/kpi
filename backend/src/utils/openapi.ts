import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import pkg from "../../../package.json" with { type: "json" };

export const registry = new OpenAPIRegistry();

export function generateOpenApiSpec() {
    const generator = new OpenApiGeneratorV3(registry.definitions);
    return generator.generateDocument({
        openapi: "3.0.0",
        info: {
            title: "API",
            version: pkg.version,
        },
    });
}
