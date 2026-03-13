import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./pool.js";
import { rebuildAuditTriggers } from "./triggers.js";

type MigrationRow = {
    version: string;
};

async function ensureMigrationsTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS ${process.env.MIGRATIONS_TABLE} (
            id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            version VARCHAR(255) NOT NULL UNIQUE,
            executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
}

async function getAppliedMigrations(): Promise<Set<string>> {
    const [rows] = await pool.query(`SELECT version FROM ${process.env.MIGRATIONS_TABLE} ORDER BY version`);
    return new Set((rows as MigrationRow[]).map(row => row.version));
}

export async function runMigrations(): Promise<void> {
    await ensureMigrationsTable();

    const applied = await getAppliedMigrations();
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const candidates = [
        path.resolve(__dirname, "migrations"),
        path.resolve(__dirname, "../db/migrations"),
        path.resolve(process.cwd(), "src/db/migrations"),
        path.resolve(process.cwd(), "dist/db/migrations"),
    ];

    let migrationsDir = "";
    for (const candidate of candidates) {
        try {
            const stat = await fs.stat(candidate);
            if (stat.isDirectory()) {
                migrationsDir = candidate;
                break;
            }
        } catch {
            // ignore
        }
    }

    if (!migrationsDir) {
        throw new Error(`Migrations directory not found. Tried: ${candidates.join(", ")}`);
    }

    const files = (await fs.readdir(migrationsDir))
        .filter(file => file.endsWith(".sql"))
        .sort();

    let appliedSomething = false;

    for (const file of files) {
        if (applied.has(file)) {
            continue;
        }

        const fullPath = path.join(migrationsDir, file);
        const sql = await fs.readFile(fullPath, "utf-8");
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();
            await connection.query(sql);
            await connection.execute(
                `INSERT INTO ${process.env.MIGRATIONS_TABLE} (version) VALUES (?)`,
                [file]
            );
            await connection.commit();

            appliedSomething = true;
            console.log(`[migration] applied ${file}`);
        } catch (error) {
            await connection.rollback();
            console.error(`[migration] failed ${file}`);
            throw error;
        } finally {
            connection.release();
        }
    }

    if (appliedSomething) {
        await rebuildAuditTriggers(pool);
        console.log("[migration] triggers rebuilt");
    }
}
