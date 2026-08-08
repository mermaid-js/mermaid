/**
 * Catalog of mermaid's built-in, user-visible strings.
 *
 * `en` is the source of truth: it defines the set of valid message keys, so a locale
 * that forgets one fails to type-check rather than silently rendering English.
 *
 * Only text that mermaid renders itself belongs here. Thrown `Error` messages are
 * deliberately left untranslated — they are developer-facing, asserted in tests, and
 * stay far more useful when they remain stable and searchable.
 */
export const en = {
  'error.syntaxError': 'Syntax error in text',
  'error.version': 'mermaid version {version}',
} as const;

export type MessageKey = keyof typeof en;

export type MessageCatalog = Record<MessageKey, string>;
