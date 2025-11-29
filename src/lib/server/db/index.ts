import pg from 'pg';
import { env } from '$env/dynamic/private';

const { Pool } = pg;

export const pool = new Pool({
	connectionString: env.DATABASE_URL,
	max: 20,
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: 2000,
});

export async function query<T = unknown>(text: string, params?: unknown[]): Promise<pg.QueryResult<T>> {
	const start = Date.now();
	try {
		const res = await pool.query<T>(text, params);
		const duration = Date.now() - start;
		console.log('Executed query', { text, duration, rows: res.rowCount });
		return res;
	} catch (error) {
		console.error('Database query error:', error);
		throw error;
	}
}

export async function getClient() {
	return await pool.connect();
}
