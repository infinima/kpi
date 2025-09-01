// database.ts
import mysql, {
    Pool,
    PoolConnection,
    RowDataPacket,
    ResultSetHeader,
    FieldPacket,
} from 'mysql2/promise';

const pool: Pool = mysql.createPool({
    host: process.env.MYSQL_HOST!,
    user: process.env.MYSQL_USER!,
    password: process.env.MYSQL_PASSWORD!,
    database: process.env.MYSQL_DATABASE!,
    connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT) || 10,
    dateStrings: true,
    namedPlaceholders: true,
});

export type AuditCtx =
    | string // просто sessionUuid
    | {
    sessionUuid?: string | null;
    sqlTextOverride?: string | null;
};

function normalizeCtx(ctx: AuditCtx | undefined, sql: string, params?: any[] | Record<string, any>) {
    let sessionUuid: string | null = null;
    let sqlText: string | null = null;

    if (typeof ctx === 'string') {
        sessionUuid = ctx;
    } else if (ctx) {
        sessionUuid = ctx.sessionUuid ?? null;
        sqlText = ctx.sqlTextOverride ?? null;
    }

    if (!sqlText) {
        const p = params ? ` /* params: ${JSON.stringify(params)} */` : '';
        const text = `${sql}${p}`;
        const MAX = 20000;
        sqlText = text.length > MAX ? text.slice(0, MAX) + ' /*...truncated*/' : text;
    }

    return { sessionUuid, sqlText };
}

async function setTxnVars(conn: PoolConnection, ctx: AuditCtx | undefined, sql: string, params?: any) {
    const { sessionUuid, sqlText } = normalizeCtx(ctx, sql, params);
    await conn.query('SET @transaction_session_uuid = ?, @transaction_sql = ?', [sessionUuid, sqlText]);
}

/** Одиночный запрос */
export type QueryTuple<T extends RowDataPacket[] | ResultSetHeader = RowDataPacket[]> = [T, FieldPacket[]];

/** Одиночный запрос */
export async function query<T extends RowDataPacket[] | ResultSetHeader = RowDataPacket[]>(
    sql: string,
    params?: any[] | Record<string, any>,
    ctx?: AuditCtx
): Promise<QueryTuple<T>> {
    const conn = await pool.getConnection();
    try {
        await setTxnVars(conn, ctx, sql, params);
        const res = await conn.query<T>(sql, params as any);
        return res as QueryTuple<T>;
    } finally {
        conn.release();
    }
}

/** Транзакция */
export async function transaction<T>(
    ctx: AuditCtx | undefined,
    fn: (trx: QueryRunner) => Promise<T>
): Promise<T> {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const { sessionUuid } = normalizeCtx(ctx, '');
        await conn.query('SET @transaction_session_uuid = ?', [sessionUuid]);

        const runner: QueryRunner = {
            async query<TR extends RowDataPacket[] | ResultSetHeader = RowDataPacket[]>(
                sql: string,
                params?: any[] | Record<string, any>
            ): Promise<QueryTuple<TR>> {
                const { sqlText } = normalizeCtx(ctx, sql, params);
                await conn.query('SET @transaction_sql = ?', [sqlText]);
                const res = await conn.query<TR>(sql, params as any);
                return res as QueryTuple<TR>;
            },
        };

        const out = await fn(runner);
        await conn.commit();
        return out;
    } catch (e) {
        try { await conn.rollback(); } catch {}
        throw e;
    } finally {
        conn.release();
    }
}

/** Раннер в транзакции */
export type QueryRunner = {
    query: <TR extends RowDataPacket[] | ResultSetHeader = RowDataPacket[]>(
        sql: string,
        params?: any[] | Record<string, any>
    ) => Promise<QueryTuple<TR>>;
};

export default pool;

/* ==== Примеры ====

// простая строка
await query(
  'UPDATE `users` SET `first_name` = :name WHERE `id` = :id',
  { name: 'Миша', id: 1 },
  'f2b3c8f0-1e7e-4b56-bc6d-2a3a9b7e9a01'
);

// или объект
await query(
  'UPDATE `users` SET `first_name` = :name WHERE `id` = :id',
  { name: 'Миша', id: 1 },
  { sessionUuid: 'f2b3c8f0-...', sqlTextOverride: 'Custom SQL Text' }
);

// транзакция
await transaction('f2b3c8f0-...', async (db) => {
  await db.query('INSERT INTO `teams` (`league_id`,`name`) VALUES (?, ?)', [1, 'Alpha']);
  await db.query('UPDATE `leagues` SET `status` = ? WHERE `id` = ?', ['ENDED', 1]);
});
*/
