import mysql, { type Pool, type PoolConnection } from 'mysql2/promise';
import { env } from '../config/env.js';

let pool: Pool | null = null;

export const getPool = () => {
  if (pool) {
    return pool;
  }

  pool = mysql.createPool({
    host: env.MYSQL_HOST,
    port: env.MYSQL_PORT,
    database: env.MYSQL_DATABASE,
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    waitForConnections: true,
    connectionLimit: env.MYSQL_CONNECTION_LIMIT,
    namedPlaceholders: true,
    timezone: '+08:00',
    charset: 'utf8mb4',
    decimalNumbers: true,
  });

  return pool;
};

export const query = async <T = any[]>(sql: string, params?: any) => {
  const [rows] = await getPool().query(sql, params);
  return rows as T;
};

export const execute = async (sql: string, params?: any) => {
  const [result] = await getPool().execute(sql, params);
  return result as any;
};

export const withTransaction = async <T>(callback: (connection: PoolConnection) => Promise<T>) => {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
