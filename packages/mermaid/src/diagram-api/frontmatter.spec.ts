import { extractFrontMatter } from './frontmatter.js';

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
