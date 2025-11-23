import pg from 'pg';
import bcrypt from 'bcrypt';

const { Pool } = pg;

async function seed() {
	const databaseUrl = process.env.DATABASE_URL;

	if (!databaseUrl) {
		console.error('DATABASE_URL environment variable is not set');
		process.exit(1);
	}

	const pool = new Pool({
		connectionString: databaseUrl,
	});

	try {
		console.log('Starting database seeding...');

		// Create admin user (email: admin@easyshop.com, password: admin123)
		const passwordHash = await bcrypt.hash('admin123', 10);
		await pool.query(
			`INSERT INTO admin_users (email, password_hash, name)
			 VALUES ($1, $2, $3)
			 ON CONFLICT (email) DO NOTHING`,
			['admin@easyshop.com', passwordHash, 'Admin User']
		);
		console.log('✓ Admin user created (email: admin@easyshop.com, password: admin123)');

		// Create categories
		const categories = [
			{
				name: 'Pneus',
				slug: 'pneus',
				description: 'Pneus moto toutes marques et dimensions'
			},
			{
				name: 'Batteries',
				slug: 'batteries',
				description: 'Batteries moto 12V haute performance'
			},
			{
				name: 'Accessoires',
				slug: 'accessoires',
				description: 'Accessoires et pièces diverses pour motos'
			}
		];

		const categoryIds: Record<string, string> = {};

		for (const cat of categories) {
			const result = await pool.query(
				`INSERT INTO categories (name, slug, description)
				 VALUES ($1, $2, $3)
				 ON CONFLICT (slug) DO UPDATE SET
				   name = EXCLUDED.name,
				   description = EXCLUDED.description
				 RETURNING id`,
				[cat.name, cat.slug, cat.description]
			);
			categoryIds[cat.slug] = result.rows[0].id;
		}
		console.log('✓ Categories created');

		// Create sample products
		const products = [
			{
				category: 'pneus',
				reference: 'PN-MICH-001',
				name: 'Pneu Michelin Pilot Road 5 120/70 ZR17',
				description: 'Pneu sport-touring haute performance. Adhérence optimale sur route sèche et mouillée.',
				price: 145.90,
				tva_rate: 20.00,
				stock_quantity: 12
			},
			{
				category: 'pneus',
				reference: 'PN-MICH-002',
				name: 'Pneu Michelin Pilot Road 5 180/55 ZR17',
				description: 'Pneu arrière sport-touring. Longévité exceptionnelle.',
				price: 189.90,
				tva_rate: 20.00,
				stock_quantity: 8
			},
			{
				category: 'pneus',
				reference: 'PN-DUNL-001',
				name: 'Pneu Dunlop RoadSmart 3 120/70 ZR17',
				description: 'Excellent compromis performance/longévité.',
				price: 135.50,
				tva_rate: 20.00,
				stock_quantity: 0
			},
			{
				category: 'batteries',
				reference: 'BAT-YTX14-BS',
				name: 'Batterie Yuasa YTX14-BS 12V 12Ah',
				description: 'Batterie sans entretien, prête à l\'emploi. Compatible avec la plupart des motos moyennes cylindrées.',
				price: 89.90,
				tva_rate: 20.00,
				stock_quantity: 15
			},
			{
				category: 'batteries',
				reference: 'BAT-YTZ10S',
				name: 'Batterie Yuasa YTZ10S 12V 8.6Ah',
				description: 'Batterie AGM haute performance pour motos sportives.',
				price: 125.00,
				tva_rate: 20.00,
				stock_quantity: 6
			},
			{
				category: 'accessoires',
				reference: 'ACC-HUI-001',
				name: 'Huile Motul 7100 10W40 4L',
				description: 'Huile moteur 100% synthèse pour moteurs 4 temps.',
				price: 42.90,
				tva_rate: 20.00,
				stock_quantity: 24
			}
		];

		for (const prod of products) {
			const slug = prod.name
				.toLowerCase()
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-+|-+$/g, '');

			await pool.query(
				`INSERT INTO products
				 (category_id, reference, name, slug, description, price, tva_rate, stock_quantity, status)
				 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
				 ON CONFLICT (reference) DO UPDATE SET
				   name = EXCLUDED.name,
				   description = EXCLUDED.description,
				   price = EXCLUDED.price,
				   stock_quantity = EXCLUDED.stock_quantity`,
				[
					categoryIds[prod.category],
					prod.reference,
					prod.name,
					slug,
					prod.description,
					prod.price,
					prod.tva_rate,
					prod.stock_quantity,
					'published'
				]
			);
		}
		console.log('✓ Sample products created');

		console.log('\n✓ Database seeding completed successfully');
		console.log('\nAdmin credentials:');
		console.log('  Email: admin@easyshop.com');
		console.log('  Password: admin123');
	} catch (error) {
		console.error('Seeding failed:', error);
		process.exit(1);
	} finally {
		await pool.end();
	}
}

seed();
