import bcrypt from 'bcryptjs';
import { query } from '../db';
import type { RequestEvent } from '@sveltejs/kit';

export interface AdminUser {
	id: string;
	email: string;
	name: string;
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
