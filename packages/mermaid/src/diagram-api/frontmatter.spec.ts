import { log } from '../logger.js';
import { extractFrontMatter, MAX_SHOWN_LENGTH } from './frontmatter.js';

describe('extractFrontmatter', () => {
  it('returns text unchanged if no frontmatter', () => {
    expect(extractFrontMatter('diagram')).toMatchInlineSnapshot(`
      {
        "metadata": {},
        "text": "diagram",
      }
    `);
  });

  it('returns text unchanged if frontmatter lacks closing delimiter', () => {
    const text = `---\ntitle: foo\ndiagram`;
    expect(extractFrontMatter(text)).toMatchInlineSnapshot(`
      {
        "metadata": {},
        "text": "---
      title: foo
      diagram",
      }
    `);
  });

  it('handles empty frontmatter', () => {
    const text = `---\n\n---\ndiagram`;
    expect(extractFrontMatter(text)).toMatchInlineSnapshot(`
      {
        "metadata": {},
        "text": "diagram",
      }
    `);
  });

  it('handles frontmatter without mappings', () => {
    expect(extractFrontMatter(`---\n1\n---\ndiagram`)).toMatchInlineSnapshot(`
      {
        "metadata": {},
        "text": "diagram",
      }
    `);
    expect(extractFrontMatter(`---\n-1\n-2\n---\ndiagram`)).toMatchInlineSnapshot(`
      {
        "metadata": {},
        "text": "diagram",
      }
    `);
    expect(extractFrontMatter(`---\nnull\n---\ndiagram`)).toMatchInlineSnapshot(`
      {
        "metadata": {},
        "text": "diagram",
      }
    `);
  });

  it('does not try to parse frontmatter at the end', () => {
    const text = `diagram\n---\ntitle: foo\n---\n`;
    expect(extractFrontMatter(text)).toMatchInlineSnapshot(`
      {
        "metadata": {},
        "text": "diagram
      ---
      title: foo
      ---
      ",
      }
    `);
  });

  it('handles frontmatter with multiple delimiters', () => {
    const text = `---\ntitle: foo---bar\n---\ndiagram\n---\ntest`;
    expect(extractFrontMatter(text)).toMatchInlineSnapshot(`
      {
        "metadata": {
          "title": "foo---bar",
        },
        "text": "diagram
      ---
      test",
      }
    `);
  });

  it('handles frontmatter with multi-line string and multiple delimiters', () => {
    const text = `---\ntitle: |\n   multi-line string\n   ---\n---\ndiagram`;
    expect(extractFrontMatter(text)).toMatchInlineSnapshot(`
      {
        "metadata": {
          "title": "multi-line string
      ---
      ",
        },
        "text": "diagram",
      }
    `);
  });

  it('handles frontmatter with title', () => {
    const text = `---\ntitle: foo\n---\ndiagram`;
    expect(extractFrontMatter(text)).toMatchInlineSnapshot(`
      {
        "metadata": {
          "title": "foo",
        },
        "text": "diagram",
      }
    `);
  });

  it('handles booleans in frontmatter properly', () => {
    const text = `---\ntitle: true\n---\ndiagram`;
    expect(extractFrontMatter(text)).toMatchInlineSnapshot(`
      {
        "metadata": {
          "title": "true",
        },
        "text": "diagram",
      }
    `);
  });

  it('ignores unspecified frontmatter keys', () => {
    const text = `---\ninvalid: true\ntitle: foo\ntest: bar\n---\ndiagram`;
    expect(extractFrontMatter(text)).toMatchInlineSnapshot(`
      {
        "metadata": {
          "title": "foo",
        },
        "text": "diagram",
      }
    `);
  });

  it('throws exception for invalid YAML syntax', () => {
    const text = `---\n!!!\n---\ndiagram`;
    expect(() => extractFrontMatter(text)).toThrow('tag suffix cannot contain exclamation marks');
  });

  it('handles leading horizontal whitespace before delimiters (issue #7613)', () => {
    const text = `   ---\n   title: foo\n   ---\n   diagram`;
    expect(extractFrontMatter(text)).toMatchInlineSnapshot(`
      {
        "metadata": {
          "title": "foo",
        },
        "text": "   diagram",
      }
    `);
  });

  it('handles tab indentation before delimiters (issue #7613)', () => {
    const text = `\t---\n\ttitle: foo\n\t---\n\tdiagram`;
    expect(extractFrontMatter(text)).toMatchInlineSnapshot(`
      {
        "metadata": {
          "title": "foo",
        },
        "text": "\tdiagram",
      }
    `);
  });

  it('handles indented frontmatter with config (issue #7613)', () => {
    const text = `   ---\n   config:\n     sankey:\n       showValues: true\n   ---\n   sankey\n   a,b,8`;
    expect(extractFrontMatter(text)).toMatchInlineSnapshot(`
      {
        "metadata": {
          "config": {
            "sankey": {
              "showValues": true,
            },
          },
        },
        "text": "   sankey
         a,b,8",
      }
    `);
  });

  it('does not match an indented closing delimiter when opening is at column zero', () => {
    const text = `---\ntitle: foo\n   ---\n   diagram`;
    expect(extractFrontMatter(text).metadata).toEqual({});
  });

  it('handles frontmatter with config', () => {
    const text = `---
title: hello
config:
  graph:
    string: hello
    number: 14
    boolean: false
    array: [1, 2, 3]
---
diagram`;
    expect(extractFrontMatter(text)).toMatchInlineSnapshot(`
      {
        "metadata": {
          "config": {
            "graph": {
              "array": [
                1,
                2,
                3,
              ],
              "boolean": false,
              "number": 14,
              "string": "hello",
            },
          },
          "title": "hello",
        },
        "text": "diagram",
      }
    `);
  });
});

describe('dotted config keys in frontmatter', () => {
  const withConfigKey = (key: string, value: string) =>
    `---\nconfig:\n  ${key}: ${value}\n---\ndiagram`;

  const warnSpy = () => vi.spyOn(log, 'warn').mockImplementation(() => undefined);

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['elk.mergeEdges', 'true', 'elk: { mergeEdges: ... }'],
    ['flowchart.curve', 'linear', 'flowchart: { curve: ... }'],
    ['themeVariables.primaryColor', 'red', 'themeVariables: { primaryColor: ... }'],
    ['elk.layering.strategy', 'x', 'elk: { layering: { strategy: ... } }'],
  ])('warns that %s is ignored and shows the nested form', (key, value, nested) => {
    const warn = warnSpy();
    extractFrontMatter(withConfigKey(key, value));
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      `config key '${key}' is ignored; write it nested: ${nested}`
    );
  });

  describe('a key the author made very long', () => {
    const RESPONSIVE_MS = 1000;
    const SEGMENTS = 20_000;

    it('is cut to the shown segments, and stays quick', () => {
      const warn = warnSpy();
      const key = `elk${'.a'.repeat(SEGMENTS)}`;
      const started = performance.now();
      extractFrontMatter(withConfigKey(key, 'true'));
      expect(performance.now() - started).toBeLessThan(RESPONSIVE_MS);
      expect(warn).toHaveBeenCalledExactlyOnceWith(
        `config key '${key.slice(0, MAX_SHOWN_LENGTH)}...' is ignored; ` +
          'write it nested: elk: { a: { a: { a: ... } } }'
      );
    });

    it.each([
      ['keeps a key of exactly the limit whole', 0],
      ['cuts a key one past the limit', 1],
    ])('%s', (_name, over) => {
      const warn = warnSpy();
      const key = `elk.${'x'.repeat(MAX_SHOWN_LENGTH - 'elk.'.length + over)}`;
      extractFrontMatter(withConfigKey(key, 'true'));
      const shown = over > 0 ? `${key.slice(0, MAX_SHOWN_LENGTH)}...` : key;
      expect(warn).toHaveBeenCalledExactlyOnceWith(
        `config key '${shown}' is ignored; write it nested: elk: { ${key.slice('elk.'.length)}: ... }`
      );
    });

    it('is clipped when one segment is long', () => {
      const warn = warnSpy();
      const long = 'x'.repeat(MAX_SHOWN_LENGTH * 2);
      extractFrontMatter(withConfigKey(`elk.${long}`, 'true'));
      const clipped = `${long.slice(0, MAX_SHOWN_LENGTH)}...`;
      expect(warn).toHaveBeenCalledExactlyOnceWith(
        `config key '${`elk.${long}`.slice(0, MAX_SHOWN_LENGTH)}...' is ignored; ` +
          `write it nested: elk: { ${clipped}: ... }`
      );
    });
  });

  it('warns once for each dotted key', () => {
    const warn = warnSpy();
    extractFrontMatter(`---\nconfig:\n  elk.mergeEdges: true\n  flowchart.curve: linear\n---\nd`);
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['a first segment that is no config section', 'foo.bar'],
    ['a first segment that is a plain option', 'theme.mode'],
    ['a first segment that is a list', 'secure.0'],
    ['a first segment that is a section without a default', 'dompurifyConfig.ADD_ATTR'],
    ['an empty last segment', 'elk.'],
    ['an empty middle segment', 'elk..mergeEdges'],
    ['a leading dot', '.elk'],
  ])('stays silent for %s', (_name, key) => {
    const warn = warnSpy();
    extractFrontMatter(withConfigKey(`"${key}"`, 'x'));
    expect(warn).not.toHaveBeenCalled();
  });

  it('stays silent for the nested form', () => {
    const warn = warnSpy();
    extractFrontMatter(`---\nconfig:\n  elk:\n    mergeEdges: true\n---\nd`);
    expect(warn).not.toHaveBeenCalled();
  });

  it('stays silent for a dotted key inside a section', () => {
    const warn = warnSpy();
    extractFrontMatter(`---\nconfig:\n  flowchart:\n    "elk.mergeEdges": true\n---\nd`);
    expect(warn).not.toHaveBeenCalled();
  });

  it('stays silent when there is no config', () => {
    const warn = warnSpy();
    extractFrontMatter(`---\ntitle: "elk.mergeEdges"\n---\nd`);
    expect(warn).not.toHaveBeenCalled();
  });

  it('still returns the key, so the sanitiser stays the one place that drops it', () => {
    warnSpy();
    const { metadata } = extractFrontMatter(withConfigKey('elk.mergeEdges', 'true'));
    expect(metadata.config).toEqual({ 'elk.mergeEdges': true });
  });
});
