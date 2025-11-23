/**
 * Generate slug from name
 */
export function generateSlug(name: string): string {
	return name
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

/**
 * Generate slug from product name (alias for generateSlug)
 */
export function generateProductSlug(name: string): string {
	return generateSlug(name);
}
