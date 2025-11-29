import { error, json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// Simple in-memory rate limiter
const rateLimits = new Map<string, { count: number; resetTime: number }>();

export function verifyApiKey(event: RequestEvent) {
	const apiKey = event.request.headers.get('X-API-Key');

	if (!apiKey || apiKey !== env.API_SECRET_KEY) {
		throw error(401, 'Unauthorized: Invalid API Key');
	}
}

export function checkRateLimit(ip: string, limit: number = 100, windowMs: number = 60000): boolean {
	const now = Date.now();
	const record = rateLimits.get(ip);

	if (!record || now > record.resetTime) {
		rateLimits.set(ip, {
			count: 1,
			resetTime: now + windowMs
		});
		return true;
	}

	if (record.count >= limit) {
		return false;
	}

	record.count++;
	return true;
}

export function handleCors(event: RequestEvent) {
	const origin = event.request.headers.get('origin');

	const headers: Record<string, string> = {
		'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, X-API-Key'
	};

	if (origin === env.ALLOWED_ORIGIN) {
		headers['Access-Control-Allow-Origin'] = origin;
	}

	return headers;
}

export function secureApiEndpoint(event: RequestEvent) {
	// Handle CORS preflight
	if (event.request.method === 'OPTIONS') {
		return json({}, { headers: handleCors(event) });
	}

	// Check rate limit
	const ip = event.getClientAddress();
	if (!checkRateLimit(ip)) {
		throw error(429, 'Too Many Requests');
	}

	// Verify API key
	verifyApiKey(event);

	return handleCors(event);
}
