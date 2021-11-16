import { ClientConfig } from 'pg';

const { PG_HOST, PG_PORT, PG_DATABASE, PG_USERNAME, PG_PASSWORD } = process.env;

export const CONFIG: ClientConfig = {
  host: PG_HOST,
  database: PG_DATABASE,
  password: PG_PASSWORD,
  user: PG_USERNAME,
  port: +PG_PORT,
  connectionTimeoutMillis: 20_000,
  ssl: {
    rejectUnauthorized: false,
  }
};
