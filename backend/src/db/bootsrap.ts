import { runMigrations } from "./migrate.js";
import { pool } from "./pool.js";

async function main() {
    console.log("[migrations] started")
    await runMigrations();
    await pool.end();
    console.log("[migrations] ended successfully")
}

main().catch(async error => {
    console.error(error);
    await pool.end();
    process.exit(1);
});