/**
 * Formatting utilities for currency, dates, and numbers
 */

/**
 * Format a number as EUR currency
 * @param amount - Amount to format
 * @returns Formatted currency string (e.g., "12,45 €")
 */
export function formatCurrency(amount: number | string): string {
	const num = typeof amount === 'string' ? parseFloat(amount) : amount;

	if (isNaN(num)) {
		return '0,00 €';
	}

	return new Intl.NumberFormat('fr-FR', {
		style: 'currency',
		currency: 'EUR'
	}).format(num);
}

/**
 * Format a date to French locale
 * @param date - Date to format (Date object, ISO string, or timestamp)
 * @returns Formatted date string (e.g., "23 nov. 2025")
 */
export function formatDate(date: Date | string | number): string {
	const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

	if (isNaN(d.getTime())) {
		return '';
	}

	return new Intl.DateTimeFormat('fr-FR', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	}).format(d);
}

/**
 * Format a date with time to French locale
 * @param date - Date to format (Date object, ISO string, or timestamp)
 * @returns Formatted datetime string (e.g., "23 nov. 2025 à 14:30")
 */
export function formatDateTime(date: Date | string | number): string {
	const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

	if (isNaN(d.getTime())) {
		return '';
	}

	return new Intl.DateTimeFormat('fr-FR', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	}).format(d);
}

/**
 * Format a date to input[type="date"] format (YYYY-MM-DD)
 * @param date - Date to format
 * @returns ISO date string (e.g., "2025-11-23")
 */
export function formatInputDate(date: Date | string | number): string {
	const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

	if (isNaN(d.getTime())) {
		return '';
	}

	return d.toISOString().split('T')[0];
}

/**
 * Get relative time string (e.g., "il y a 2 heures")
 * @param date - Date to compare
 * @returns Relative time string in French
 */
export function formatRelativeTime(date: Date | string | number): string {
	const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

	if (isNaN(d.getTime())) {
		return '';
	}

	const now = new Date();
	const diffMs = now.getTime() - d.getTime();
	const diffSec = Math.floor(diffMs / 1000);
	const diffMin = Math.floor(diffSec / 60);
	const diffHour = Math.floor(diffMin / 60);
	const diffDay = Math.floor(diffHour / 24);

	if (diffSec < 60) {
		return 'à l\'instant';
	} else if (diffMin < 60) {
		return `il y a ${diffMin} min`;
	} else if (diffHour < 24) {
		return `il y a ${diffHour}h`;
	} else if (diffDay < 7) {
		return `il y a ${diffDay}j`;
	} else {
		return formatDate(d);
	}
}
