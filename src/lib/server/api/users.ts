import bcrypt from 'bcryptjs';
import { query } from '../db';
import type { AdminUser } from '../auth';

export interface AdminUserFull extends AdminUser {
	is_system: boolean;
	created_at: Date;
}

/**
 * Get all admin users
 */
export async function getAllAdmins(): Promise<AdminUserFull[]> {
	const result = await query<AdminUserFull>(
		`SELECT id, email, name, is_system, created_at
		 FROM admin_users
		 ORDER BY is_system DESC, created_at ASC`
	);
	return result.rows;
}

/**
 * Get a single admin by ID
 */
export async function getAdminById(id: string): Promise<AdminUserFull | null> {
	const result = await query<AdminUserFull>(
		`SELECT id, email, name, is_system, created_at
		 FROM admin_users
		 WHERE id = $1`,
		[id]
	);
	return result.rows[0] || null;
}

/**
 * Create a new admin user
 */
export async function createAdmin(
	email: string,
	password: string,
	name: string
): Promise<AdminUserFull> {
	// Check if email already exists
	const existing = await query<{ id: string }>(
		'SELECT id FROM admin_users WHERE email = $1',
		[email]
	);

	if (existing.rows.length > 0) {
		throw new Error('Un administrateur avec cet email existe déjà');
	}

	const passwordHash = await bcrypt.hash(password, 10);

	const result = await query<AdminUserFull>(
		`INSERT INTO admin_users (email, password_hash, name, is_system)
		 VALUES ($1, $2, $3, false)
		 RETURNING id, email, name, is_system, created_at`,
		[email, passwordHash, name]
	);

	return result.rows[0];
}

/**
 * Delete an admin user by ID
 * System admins (is_system=true) cannot be deleted
 */
export async function deleteAdmin(id: string): Promise<boolean> {
	// Check if admin exists and is not a system admin
	const admin = await query<{ is_system: boolean }>(
		'SELECT is_system FROM admin_users WHERE id = $1',
		[id]
	);

	if (admin.rows.length === 0) {
		throw new Error('Administrateur non trouvé');
	}

	if (admin.rows[0].is_system) {
		throw new Error('Impossible de supprimer l\'administrateur système');
	}

	const result = await query(
		'DELETE FROM admin_users WHERE id = $1 AND is_system = false',
		[id]
	);

	return (result.rowCount ?? 0) > 0;
}

/**
 * Update admin password
 */
export async function updateAdminPassword(
	id: string,
	newPassword: string
): Promise<boolean> {
	const passwordHash = await bcrypt.hash(newPassword, 10);

	const result = await query(
		'UPDATE admin_users SET password_hash = $1 WHERE id = $2',
		[passwordHash, id]
	);

	return (result.rowCount ?? 0) > 0;
}

/**
 * Update admin name
 */
export async function updateAdminName(
	id: string,
	name: string
): Promise<boolean> {
	const result = await query(
		'UPDATE admin_users SET name = $1 WHERE id = $2',
		[name, id]
	);

	return (result.rowCount ?? 0) > 0;
}
