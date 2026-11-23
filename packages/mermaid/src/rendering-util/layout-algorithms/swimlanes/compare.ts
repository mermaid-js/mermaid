/**
 * Locale-stable string comparison for swimlane layout.
 * Passing an explicit English locale keeps today's English order in every
 * browser locale (#8759).
 */
export function compareStrings(a: string, b: string): number {
  return a.localeCompare(b, 'en');
}
