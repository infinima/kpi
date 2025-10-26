import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function resolveFilePath(dbPath: string): string {
    if (!dbPath) {
        throw new Error("Invalid file path");
    }

    const cleanPath = dbPath.replace(/^\/+/, "");

    return path.resolve(__dirname, "../..", cleanPath);
}
