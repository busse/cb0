/**
 * Shared string utilities for renderer and main processes.
 */

/**
 * Convert a title or arbitrary string into a URL-friendly slug.
 */
export function slugify(value: string): string {
  return (
    value
      ?.toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '') // remove diacritics
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'note'
  );
}






