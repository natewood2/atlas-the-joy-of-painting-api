import { Pool } from 'pg';

export const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'joy_of_painting',
  password: '',
  port: 5432
});