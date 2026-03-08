import { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";

type TableColumnRow = RowDataPacket & {
    TABLE_NAME: string;
    COLUMN_NAME: string;
    ORDINAL_POSITION: number;
};

function quoteIdent(value: string): string {
    return `\`${value.replace(/`/g, "``")}\``;
}

function quoteString(value: string): string {
    return `'${value.replace(/'/g, "''")}'`;
}

function buildJsonObject(prefix: "OLD" | "NEW", columns: string[]): string {
    return `JSON_OBJECT(${columns.map(col => `${quoteString(col)}, ${prefix}.${quoteIdent(col)}`).join(", ")})`;
}

function buildTableTriggersSql(table: string, columns: string[]): string {
    if (!columns.includes("id")) {
        return "";
    }

    const oldJson = buildJsonObject("OLD", columns);
    const newJson = buildJsonObject("NEW", columns);
    const tableName = quoteIdent(table);

    return `
DROP TRIGGER IF EXISTS ${quoteIdent(`${table}_ai`)};
DROP TRIGGER IF EXISTS ${quoteIdent(`${table}_au`)};
DROP TRIGGER IF EXISTS ${quoteIdent(`${table}_ad`)};

CREATE TRIGGER ${quoteIdent(`${table}_ai`)}
AFTER INSERT ON ${tableName}
FOR EACH ROW
INSERT INTO logs(table_name, record_id, action, new_data, diff_data, user_id, query_text, params)
VALUES(
    ${quoteString(table)},
    NEW.id,
    'INSERT',
    ${newJson},
    NULL,
    @current_user_id,
    @current_query,
    @current_params
);

CREATE TRIGGER ${quoteIdent(`${table}_ad`)}
AFTER DELETE ON ${tableName}
FOR EACH ROW
INSERT INTO logs(table_name, record_id, action, old_data, diff_data, user_id, query_text, params)
VALUES(
    ${quoteString(table)},
    OLD.id,
    'DELETE',
    ${oldJson},
    NULL,
    @current_user_id,
    @current_query,
    @current_params
);

CREATE TRIGGER ${quoteIdent(`${table}_au`)}
AFTER UPDATE ON ${tableName}
FOR EACH ROW
INSERT INTO logs(table_name, record_id, action, old_data, new_data, diff_data, user_id, query_text, params)
VALUES(
    ${quoteString(table)},
    NEW.id,
    'UPDATE',
    ${oldJson},
    ${newJson},
    JSON_DIFF(${oldJson}, ${newJson}),
    @current_user_id,
    @current_query,
    @current_params
);
`;
}

export async function loadTrackedTables(connection: PoolConnection) {
    const [rows] = await connection.query<TableColumnRow[]>(`
        SELECT TABLE_NAME, COLUMN_NAME, ORDINAL_POSITION
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
        ORDER BY TABLE_NAME, ORDINAL_POSITION
    `);

    const ignoredTables = new Set([
        ...(process.env.TRIGGERS_IGNORED_TABLES!)
            .split(",")
            .map(table => table.trim())
            .filter(Boolean),
        ...(process.env.MIGRATIONS_TABLE ? [process.env.MIGRATIONS_TABLE] : []),
    ]);

    const tables: Record<string, string[]> = {};

    for (const row of rows) {
        if (ignoredTables.has(row.TABLE_NAME)) {
            continue;
        }

        if (!tables[row.TABLE_NAME]) {
            tables[row.TABLE_NAME] = [];
        }

        tables[row.TABLE_NAME].push(row.COLUMN_NAME);
    }

    return tables;
}

export function generateTriggersSql(tables: Record<string, string[]>): string {
    return Object.entries(tables)
        .map(([table, columns]) => buildTableTriggersSql(table, columns))
        .filter(Boolean)
        .join("\n");
}

export async function rebuildAuditTriggers(pool: Pool): Promise<void> {
    const connection = await pool.getConnection();

    try {
        const tables = await loadTrackedTables(connection);
        const sql = generateTriggersSql(tables);

        if (!sql.trim()) {
            return;
        }

        await connection.query(sql);
    } finally {
        connection.release();
    }
}