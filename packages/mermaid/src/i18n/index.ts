import { getConfig } from '../config.js';
import type { MessageCatalog, MessageKey } from './messages.js';
import { en } from './messages.js';
import { zhCN } from './zh-CN.js';

const catalogs = {
  en,
  'zh-CN': zhCN,
} satisfies Record<string, MessageCatalog>;

export type Locale = keyof typeof catalogs;

/** Locale used when none is configured, and whenever a message has no translation. */
export const defaultLocale: Locale = 'en';

/**
 * Whether a locale has a catalog. Config can carry any string at runtime, so this is
 * checked rather than assumed from the type.
 *
 * @param locale - Locale identifier to check.
 * @returns True if messages are available for the locale.
 */
export const isSupportedLocale = (locale?: string): locale is Locale =>
  locale !== undefined && Object.hasOwn(catalogs, locale);

const interpolate = (message: string, params: Record<string, string | number>): string =>
  message.replace(/{(\w+)}/g, (placeholder, name: string) =>
    Object.hasOwn(params, name) ? String(params[name]) : placeholder
  );

/**
 * Resolves a built-in message in the configured locale.
 *
 * Falls back to English when the locale is unknown or its catalog is missing the key,
 * so an incomplete translation degrades to English rather than to nothing.
 *
 * @param key - Message key, as defined by the English catalog.
 * @param params - Values substituted into `{placeholder}` slots in the message.
 * @returns The resolved message.
 */
export const t = (key: MessageKey, params?: Record<string, string | number>): string => {
  const { locale } = getConfig();
  const message =
    (isSupportedLocale(locale) ? catalogs[locale][key] : undefined) ?? catalogs[defaultLocale][key];
  return params ? interpolate(message, params) : message;
};
