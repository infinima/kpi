import mysql, { type Pool, type PoolConnection } from "mysql2/promise";

export const pool: Pool = mysql.createPool({
    host: process.env.MYSQL_HOST!,
    port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
    user: process.env.MYSQL_USER!,
    password: process.env.MYSQL_PASSWORD!,
    database: process.env.MYSQL_DATABASE!,
    connectionLimit: process.env.MYSQL_CONNECTION_LIMIT ? Number(process.env.MYSQL_CONNECTION_LIMIT) : 10,
    namedPlaceholders: true,
});

export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
    const [rows] = await pool.query(sql, params);
    return rows as T;
}

export async function transaction<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const res = await fn(conn);
        await conn.commit();
        return res;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

export default { pool, query, transaction };
