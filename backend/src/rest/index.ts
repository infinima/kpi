import express from "express";
import swaggerUi from "swagger-ui-express";
import cors from "cors";
import { fileURLToPath } from "url";
import { generateOpenApiSpec } from "../utils/openapi.js";

import "./schemas/errors.js";
import { authRouter } from "./routes/auth.js";
import { authPermissionsRouter } from "./routes/auth_permissions.js";
import { eventsRouter } from "./routes/events.js";
import { locationsRouter } from "./routes/locations.js";
import { leaguesRouter } from "./routes/leagues.js";
import { teamsRouter } from "./routes/teams.js";
import { usersRouter } from "./routes/users.js";
import { permissionsRouter } from "./routes/permissions.js";
import { logsRouter } from "./routes/logs.js";
import {dirname, join} from "path";

export function createApp() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    const app = express();

    app.use(express.urlencoded({ extended: true, limit: "10mb" }));
    app.use(express.json({ limit: "10mb" }));

    const staticDir = join(__dirname, "../..", "public");
    app.use(express.static(staticDir));

    if (process.env.NODE_ENV === "development") {
        app.use(cors({ origin: "http://localhost:5173", credentials: true }));
    }

    app.use("/api/auth", authRouter);
    app.use("/api/auth/permissions", authPermissionsRouter);
    app.use("/api/events", eventsRouter);
    app.use("/api/locations", locationsRouter);
    app.use("/api/leagues", leaguesRouter);
    app.use("/api/teams", teamsRouter);
    app.use("/api/users", usersRouter);
    app.use("/api/permissions", permissionsRouter);
    app.use("/api/logs", logsRouter);

    // Swagger
    const openApiSpec = generateOpenApiSpec();
    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

    // Health
    app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

    // SPA fallback
    app.get("*", (_req, res) => res.sendFile(join(staticDir, "index.html")));

    return app;
}
