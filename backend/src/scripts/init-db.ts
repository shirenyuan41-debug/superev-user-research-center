import mysql from 'mysql2/promise';
import { env } from '../config/env.js';
import { CREATE_TABLE_STATEMENTS } from '../constants/schema.js';

const run = async () => {
  const connection = await mysql.createConnection({
    host: env.MYSQL_INIT_HOST || env.MYSQL_HOST,
    port: env.MYSQL_INIT_PORT || env.MYSQL_PORT,
    user: env.MYSQL_INIT_ROOT_USER,
    password: env.MYSQL_INIT_ROOT_PASSWORD,
    multipleStatements: true,
  });

  const databaseName = env.MYSQL_INIT_DATABASE;
  const appUser = env.MYSQL_INIT_APP_USER;
  const appPassword = env.MYSQL_INIT_APP_PASSWORD;
  const escapedAppUser = appUser.replace(/'/g, "''");
  const escapedAppPassword = appPassword?.replace(/'/g, "''");

  if (!appUser || !appPassword || !env.MYSQL_INIT_ROOT_USER || !env.MYSQL_INIT_ROOT_PASSWORD) {
    throw new Error('数据库初始化环境变量未配置完整');
  }

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.query(`CREATE USER IF NOT EXISTS '${escapedAppUser}'@'%' IDENTIFIED BY '${escapedAppPassword}'`);
  await connection.query(`GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP ON \`${databaseName}\`.* TO '${escapedAppUser}'@'%'`);
  await connection.query('FLUSH PRIVILEGES');
  await connection.query(`USE \`${databaseName}\``);

  for (const statement of CREATE_TABLE_STATEMENTS) {
    await connection.query(statement);
  }

  await connection.end();
  console.log(`数据库 ${databaseName} 初始化完成`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
