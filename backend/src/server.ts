import "./utils/validate-env.js";
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";
import {dirname, join} from 'path';

import {generateOpenApiSpec} from "./utils/openapi.js";
import "./schemas/events.js";

import {eventsRouter} from "./routes/events.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

if (process.env.NODE_ENV === "development") {
    app.use(cors({ origin: "http://localhost:5173", credentials: true }));
}


app.use("/api/events", eventsRouter);


const openApiSpec = generateOpenApiSpec();
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

const staticDir = join(__dirname, "..", "public");
app.use(express.static(staticDir));

app.get("/api/health", (_req, res) => res.json({ok: true, ts: Date.now()}));

app.get('*', (_req, res) => res.sendFile(join(staticDir, 'index.html')));

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
    if (process.env.NODE_ENV === "development") {
        console.log(`✅  Server is running on http://localhost:${PORT}`);
        console.log(`📘 Swagger docs: http://localhost:${PORT}/api/docs`);
    } else {
        console.log(`Server is running on port ${PORT}`)
    }
});
