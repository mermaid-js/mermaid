import * as yaml from 'js-yaml';
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

  describe('a key with control characters', () => {
    const CONTROL_OR_LINE_BREAK = /[\p{Cc}\u2028\u2029]/u;
    const BIDI_CONTROL = /[\u202A-\u202E\u2066-\u2069]/u;

    it.each([
      ['a newline', '\\n', '\\n'],
      ['a tab', '\\t', '\\t'],
      ['a carriage return', '\\r', '\\r'],
      ['an escape character', '\\x1b', '\\u001b'],
      ['a delete', '\\x7f', '\\u007f'],
      ['a next line', '\\x85', '\\u0085'],
      ['a line separator', '\\u2028', '\\u2028'],
      ['a right-to-left override', '\\u202e', '\\u202e'],
      ['a left-to-right embedding', '\\u202a', '\\u202a'],
      ['a right-to-left isolate', '\\u2067', '\\u2067'],
      ['a pop directional isolate', '\\u2069', '\\u2069'],
    ])('shows %s as a backslash sequence, on one line', (_name, written, shown) => {
      const warn = warnSpy();
      extractFrontMatter(withConfigKey(`"elk.a${written}b"`, 'true'));
      expect(warn).toHaveBeenCalledExactlyOnceWith(
        `config key 'elk.a${shown}b' is ignored; write it nested: elk: { "a${shown}b": ... }`
      );
      expect(String(warn.mock.calls[0][0])).not.toMatch(CONTROL_OR_LINE_BREAK);
      expect(String(warn.mock.calls[0][0])).not.toMatch(BIDI_CONTROL);
    });

    it('cannot forge a second log line', () => {
      const warn = warnSpy();
      extractFrontMatter(withConfigKey('"elk.\\nWARN: forged"', 'true'));
      expect(String(warn.mock.calls[0][0]).split('\n')).toHaveLength(1);
    });

    it('leaves a plain key as it is', () => {
      const warn = warnSpy();
      extractFrontMatter(withConfigKey('elk.mergeEdges', 'true'));
      expect(warn).toHaveBeenCalledExactlyOnceWith(
        `config key 'elk.mergeEdges' is ignored; write it nested: elk: { mergeEdges: ... }`
      );
    });

    it('still cuts the escaped text at the limit', () => {
      const warn = warnSpy();
      const key = `elk.${'\\n'.repeat(MAX_SHOWN_LENGTH)}`;
      extractFrontMatter(withConfigKey(`"${key}"`, 'true'));
      const message = String(warn.mock.calls[0][0]);
      expect(message).toContain(`'elk.${'\\n'.repeat((MAX_SHOWN_LENGTH - 'elk.'.length) / 2)}...'`);
      expect(message).not.toMatch(CONTROL_OR_LINE_BREAK);
    });
  });

  describe('the suggested key', () => {
    it.each([
      ['a space', 'elk.a b', 'elk: { "a b": ... }'],
      ['a colon', 'elk.a:b', 'elk: { "a:b": ... }'],
      ['a quote', `'elk.a"b'`, 'elk: { "a\\"b": ... }'],
      ['a backslash', `'elk.a\\b'`, 'elk: { "a\\\\b": ... }'],
    ])('is quoted when a part holds %s', (_name, written, nested) => {
      const warn = warnSpy();
      extractFrontMatter(withConfigKey(written, 'true'));
      expect(String(warn.mock.calls[0][0]).endsWith(`write it nested: ${nested}`)).toBe(true);
    });

    /** The suggestion with `value` in place of its `...`, read as the front matter is read. */
    const readBack = (message: string, value: number): unknown => {
      const nested = message.slice(
        message.indexOf('write it nested: ') + 'write it nested: '.length
      );
      const placeholder = nested.lastIndexOf('...');
      return yaml.load(
        `${nested.slice(0, placeholder)}${value}${nested.slice(placeholder + '...'.length)}`,
        { schema: yaml.JSON_SCHEMA }
      );
    };

    describe('cut at the limit', () => {
      const BELOW_LIMIT = MAX_SHOWN_LENGTH - 1;
      it.each([
        ['a quote', `'elk.${'a'.repeat(BELOW_LIMIT)}"'`],
        ['a backslash', `'elk.${'a'.repeat(BELOW_LIMIT)}\\'`],
        ['a control character', `"elk.${'a'.repeat(BELOW_LIMIT)}\\x01"`],
        ['a character outside the BMP', `"elk.${'a'.repeat(BELOW_LIMIT)}\\U0001F600"`],
      ])('keeps a whole escape when %s crosses it, so the key is valid YAML', (_name, written) => {
        const warn = warnSpy();
        extractFrontMatter(withConfigKey(written, 'true'));
        const message = String(warn.mock.calls[0][0]);
        expect(message).toMatch(`write it nested: elk: { "${'a'.repeat(BELOW_LIMIT)}...": ... }`);
        expect(readBack(message, 1)).toEqual({ elk: { [`${'a'.repeat(BELOW_LIMIT)}...`]: 1 } });
      });

      it.each([
        ['a control character', '\\x01'],
        ['a character outside the BMP', '\\U0001F600'],
      ])('keeps a whole escape when %s crosses it in the shown key', (_name, written) => {
        const warn = warnSpy();
        const filler = 'a'.repeat(MAX_SHOWN_LENGTH - 'elk.'.length - 1);
        extractFrontMatter(withConfigKey(`"elk.${filler}${written}"`, 'true'));
        const message = String(warn.mock.calls[0][0]);
        expect(message).toMatch(`config key 'elk.${filler}...' is ignored`);
        expect(message).not.toMatch(/\p{Cs}/u);
      });
    });

    it('stays bare when every part is a plain word', () => {
      const warn = warnSpy();
      extractFrontMatter(withConfigKey('elk.node-Spacing_2.x', 'true'));
      expect(String(warn.mock.calls[0][0])).toMatch(
        /write it nested: elk: { node-Spacing_2: { x: \.\.\. } }$/
      );
    });
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
