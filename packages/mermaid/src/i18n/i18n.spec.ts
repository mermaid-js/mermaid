import * as configApi from '../config.js';
import type { MermaidConfig } from '../config.type.js';
import { t, isSupportedLocale, defaultLocale } from './index.js';
import { en } from './messages.js';
import { zhCN } from './zh-CN.js';

describe('i18n', () => {
  beforeEach(() => {
    configApi.reset();
    configApi.setSiteConfig({});
  });

  describe('catalogs', () => {
    it('should translate every English key in every locale', () => {
      // Guards against a locale drifting behind `en` as new messages are added.
      expect(Object.keys(zhCN).sort()).toEqual(Object.keys(en).sort());
    });

    it('should not leave any message untranslated', () => {
      for (const [key, value] of Object.entries(zhCN)) {
        expect(value, `${key} is identical to the English message`).not.toBe(
          en[key as keyof typeof en]
        );
      }
    });

    it('should keep placeholders consistent across locales', () => {
      const placeholders = (message: string) => (message.match(/{(\w+)}/g) ?? []).sort();
      for (const key of Object.keys(en) as (keyof typeof en)[]) {
        expect(placeholders(zhCN[key]), `${key} has mismatched placeholders`).toEqual(
          placeholders(en[key])
        );
      }
    });
  });

  describe('isSupportedLocale', () => {
    it.each(['en', 'zh-CN'])('should accept %s', (locale) => {
      expect(isSupportedLocale(locale)).toBe(true);
    });

    it.each([undefined, '', 'fr', 'zh', 'ZH-CN', 'toString', 'constructor'])(
      'should reject %o',
      (locale) => {
        expect(isSupportedLocale(locale)).toBe(false);
      }
    );
  });

  describe('t', () => {
    it('should default to English', () => {
      expect(defaultLocale).toBe('en');
      expect(t('error.syntaxError')).toBe('Syntax error in text');
    });

    it('should resolve messages in the configured locale', () => {
      configApi.setSiteConfig({ locale: 'zh-CN' });
      expect(t('error.syntaxError')).toBe(zhCN['error.syntaxError']);
    });

    it('should fall back to English for an unknown locale', () => {
      // Config is JSON at runtime, so an unsupported value can reach us.
      configApi.setSiteConfig({ locale: 'fr' } as unknown as MermaidConfig);
      expect(t('error.syntaxError')).toBe(en['error.syntaxError']);
    });

    it('should substitute placeholders', () => {
      expect(t('error.version', { version: '11.0.0' })).toBe('mermaid version 11.0.0');
    });

    it('should substitute placeholders in the configured locale', () => {
      configApi.setSiteConfig({ locale: 'zh-CN' });
      expect(t('error.version', { version: '11.0.0' })).toContain('11.0.0');
      expect(t('error.version', { version: '11.0.0' })).not.toContain('{version}');
    });

    it('should leave unknown placeholders untouched', () => {
      expect(t('error.version', { unrelated: 'x' })).toBe('mermaid version {version}');
    });

    it('should accept numeric placeholder values', () => {
      expect(t('error.version', { version: 11 })).toBe('mermaid version 11');
    });
  });
});
