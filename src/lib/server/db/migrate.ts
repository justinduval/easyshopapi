import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import { config } from 'dotenv';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Pool } = pg;

async function migrate() {
	const databaseUrl = process.env.DATABASE_URL;

	if (!databaseUrl) {
		console.error('DATABASE_URL environment variable is not set');
		process.exit(1);
	}

	const pool = new Pool({
		connectionString: databaseUrl,
	});

	try {
		console.log('Starting database migration...');

		const schemaPath = join(__dirname, 'schema.sql');
		const schema = readFileSync(schemaPath, 'utf-8');

		await pool.query(schema);

		console.log('✓ Database migration completed successfully');
	} catch (error) {
		console.error('Migration failed:', error);
		process.exit(1);
	} finally {
		await pool.end();
	}
}

migrate();
