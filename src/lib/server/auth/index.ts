import bcrypt from 'bcryptjs';
import { query } from '../db';
import type { RequestEvent } from '@sveltejs/kit';

export interface AdminUser {
	id: string;
	email: string;
	name: string;
	is_system?: boolean;
	created_at?: Date;
}

interface AdminUserRow extends AdminUser {
	password_hash: string;
	created_at: Date;
}

export async function verifyCredentials(email: string, password: string): Promise<AdminUser | null> {
	const result = await query<AdminUserRow>(
		'SELECT * FROM admin_users WHERE email = $1',
		[email]
	);

	if (result.rows.length === 0) {
		return null;
	}

	const user = result.rows[0];
	const passwordMatch = await bcrypt.compare(password, user.password_hash);

	if (!passwordMatch) {
		return null;
	}

	return {
		id: user.id,
		email: user.email,
		name: user.name
	};
}

export async function getUserById(userId: string): Promise<AdminUser | null> {
	const result = await query<AdminUserRow>(
		'SELECT id, email, name FROM admin_users WHERE id = $1',
		[userId]
	);

	if (result.rows.length === 0) {
		return null;
	}

	return result.rows[0];
}

export function setSessionCookie(event: RequestEvent, userId: string) {
	event.cookies.set('session', userId, {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: process.env.NODE_ENV === 'production',
		maxAge: 60 * 60 * 24 * 7 // 7 days
	});
}

export function deleteSessionCookie(event: RequestEvent) {
	event.cookies.delete('session', {
		path: '/'
	});
}

export async function getSessionUser(event: RequestEvent): Promise<AdminUser | null> {
	const sessionId = event.cookies.get('session');

	if (!sessionId) {
		return null;
	}

	return await getUserById(sessionId);
}

/**
 * Ensures the default admin from .env exists in the database.
 * Called once at startup. Creates the admin with is_system=true if not exists.
 */
export async function ensureDefaultAdmin(): Promise<void> {
	const adminEmail = process.env.ADMIN_EMAIL;
	const adminPassword = process.env.ADMIN_PASSWORD;
	const adminName = process.env.ADMIN_NAME || 'Administrateur';

	if (!adminEmail || !adminPassword) {
		console.log('[Auth] No ADMIN_EMAIL/ADMIN_PASSWORD in .env, skipping default admin creation');
		return;
	}

	// Check if admin already exists
	const existing = await query<{ id: string }>(
		'SELECT id FROM admin_users WHERE email = $1',
		[adminEmail]
	);

	if (existing.rows.length > 0) {
		// Ensure is_system is set to true for the existing admin
		await query(
			'UPDATE admin_users SET is_system = true WHERE email = $1 AND (is_system IS NULL OR is_system = false)',
			[adminEmail]
		);
		console.log(`[Auth] Default admin ${adminEmail} already exists`);
		return;
	}

	// Create the default admin
	const passwordHash = await bcrypt.hash(adminPassword, 10);
	await query(
		`INSERT INTO admin_users (email, password_hash, name, is_system)
		 VALUES ($1, $2, $3, true)`,
		[adminEmail, passwordHash, adminName]
	);

	console.log(`[Auth] Created default admin: ${adminEmail}`);
}
