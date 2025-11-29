import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

async function updateTva() {
	try {
		const result = await pool.query('UPDATE products SET tva_rate = 0');
		console.log(`✅ TVA mise à 0 pour ${result.rowCount} produits`);
	} catch (error) {
		console.error('Erreur:', error);
	} finally {
		await pool.end();
	}
}

updateTva();
