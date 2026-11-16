import yaml from 'js-yaml';
import { describe, expect, it } from 'vitest';
import { stripPrototypeKeys } from './sanitizeMetadata.js';

describe('stripPrototypeKeys', () => {
  it('preserves shared YAML aliases while sanitizing each referenced value', () => {
    const lines = [
      'level0: &level0 { value: kept, __proto__: { polluted: true }, constructor: x, prototype: y }',
    ];
    for (let level = 1; level <= 8; level++) {
      lines.push(`level${level}: &level${level} [*level${level - 1}, *level${level - 1}]`);
    }
    const metadata = yaml.load(lines.join('\n'), { schema: yaml.JSON_SCHEMA }) as Record<
      string,
      unknown
    >;

    const clean = stripPrototypeKeys(metadata);

    for (let level = 1; level <= 8; level++) {
      const entries = clean[`level${level}`] as unknown[];
      expect(entries[0]).toBe(clean[`level${level - 1}`]);
      expect(entries[1]).toBe(entries[0]);
      expect(entries).not.toBe(metadata[`level${level}`]);
    }
    expect(clean.level0).toEqual({ value: 'kept' });
    expect(clean.level0).not.toBe(metadata.level0);
    expect(Object.keys(metadata.level0 as object)).toContain('__proto__');
    expect(stripPrototypeKeys(metadata).level0).not.toBe(clean.level0);
  });

  it('preserves self-referencing YAML objects in the sanitized copy', () => {
    const metadata = yaml.load(
      'root: &root { self: *root, value: kept, __proto__: { polluted: true } }',
      { schema: yaml.JSON_SCHEMA }
    ) as { root: { self: unknown; value: string } };

    const clean = stripPrototypeKeys(metadata);

    expect(clean.root).not.toBe(metadata.root);
    expect(clean.root.self).toBe(clean.root);
    expect(clean.root.value).toBe('kept');
    expect(Object.keys(clean.root)).toEqual(['self', 'value']);
  });

  it('preserves self-referencing YAML arrays in the sanitized copy', () => {
    const metadata = yaml.load('items: &items [*items]', {
      schema: yaml.JSON_SCHEMA,
    }) as { items: unknown[] };

    const clean = stripPrototypeKeys(metadata);

    expect(clean.items).not.toBe(metadata.items);
    expect(clean.items).toHaveLength(1);
    expect(clean.items[0]).toBe(clean.items);
  });
});
