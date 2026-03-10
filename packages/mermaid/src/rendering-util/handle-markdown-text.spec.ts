import { markdownToLines, markdownToHTML, nonMarkdownToLines } from './handle-markdown-text.js';
import { test, expect } from 'vitest';

test('markdownToLines - Basic test', () => {
  const input = `This is regular text
Here is a new line
There is some words **with a bold** section
Here is a line *with an italic* section`;

  const expectedOutput = [
    [
      { content: 'This', type: 'normal' },
      { content: 'is', type: 'normal' },
      { content: 'regular', type: 'normal' },
      { content: 'text', type: 'normal' },
    ],
    [
      { content: 'Here', type: 'normal' },
      { content: 'is', type: 'normal' },
      { content: 'a', type: 'normal' },
      { content: 'new', type: 'normal' },
      { content: 'line', type: 'normal' },
    ],
    [
      { content: 'There', type: 'normal' },
      { content: 'is', type: 'normal' },
      { content: 'some', type: 'normal' },
      { content: 'words', type: 'normal' },
      { content: 'with', type: 'strong' },
      { content: 'a', type: 'strong' },
      { content: 'bold', type: 'strong' },
      { content: 'section', type: 'normal' },
    ],
    [
      { content: 'Here', type: 'normal' },
      { content: 'is', type: 'normal' },
      { content: 'a', type: 'normal' },
      { content: 'line', type: 'normal' },
      { content: 'with', type: 'em' },
      { content: 'an', type: 'em' },
      { content: 'italic', type: 'em' },
      { content: 'section', type: 'normal' },
    ],
  ];

  const output = markdownToLines(input);
  expect(output).toEqual(expectedOutput);
});

test('markdownToLines - Empty input', () => {
  const input = '';
  const expectedOutput = [[]];
  const output = markdownToLines(input);
  expect(output).toEqual(expectedOutput);
});

test('markdownToLines - No formatting', () => {
  const input = `This is a simple test
with no formatting`;

  const expectedOutput = [
    [
      { content: 'This', type: 'normal' },
      { content: 'is', type: 'normal' },
      { content: 'a', type: 'normal' },
      { content: 'simple', type: 'normal' },
      { content: 'test', type: 'normal' },
    ],
    [
      { content: 'with', type: 'normal' },
      { content: 'no', type: 'normal' },
      { content: 'formatting', type: 'normal' },
    ],
  ];

  const output = markdownToLines(input);
  expect(output).toEqual(expectedOutput);
});

test('markdownToLines - Only bold formatting', () => {
  const input = `This is a **bold** test`;

  const expectedOutput = [
    [
      { content: 'This', type: 'normal' },
      { content: 'is', type: 'normal' },
      { content: 'a', type: 'normal' },
      { content: 'bold', type: 'strong' },
      { content: 'test', type: 'normal' },
    ],
  ];

  const output = markdownToLines(input);
  expect(output).toEqual(expectedOutput);
});

test('markdownToLines - paragraph 1', () => {
  const input = `**Start** with
    a second line`;

  const expectedOutput = [
    [
      { content: 'Start', type: 'strong' },
      { content: 'with', type: 'normal' },
    ],
    [
      { content: 'a', type: 'normal' },
      { content: 'second', type: 'normal' },
      { content: 'line', type: 'normal' },
    ],
  ];

  const output = markdownToLines(input);
  expect(output).toEqual(expectedOutput);
});

test('markdownToLines - paragraph', () => {
  const input = `**Start** with
    a second line`;

  const expectedOutput = [
    [
      { content: 'Start', type: 'strong' },
      { content: 'with', type: 'normal' },
    ],
    [
      { content: 'a', type: 'normal' },
      { content: 'second', type: 'normal' },
      { content: 'line', type: 'normal' },
    ],
  ];

  const output = markdownToLines(input);
  expect(output).toEqual(expectedOutput);
});

test('markdownToLines - Only italic formatting', () => {
  const input = `This is an *italic* test`;

  const expectedOutput = [
    [
      { content: 'This', type: 'normal' },
      { content: 'is', type: 'normal' },
      { content: 'an', type: 'normal' },
      { content: 'italic', type: 'em' },
      { content: 'test', type: 'normal' },
    ],
  ];

  const output = markdownToLines(input);
  expect(output).toEqual(expectedOutput);
});

it('markdownToLines - Mixed formatting', () => {
  let input = `*Italic* and **bold** formatting`;
  let expected = [
    [
      { content: 'Italic', type: 'em' },
      { content: 'and', type: 'normal' },
      { content: 'bold', type: 'strong' },
      { content: 'formatting', type: 'normal' },
    ],
  ];
  expect(markdownToLines(input)).toEqual(expected);

  input = `*Italic with space* and **bold ws** formatting`;
  expected = [
    [
      { content: 'Italic', type: 'em' },
      { content: 'with', type: 'em' },
      { content: 'space', type: 'em' },
      { content: 'and', type: 'normal' },
      { content: 'bold', type: 'strong' },
      { content: 'ws', type: 'strong' },
      { content: 'formatting', type: 'normal' },
    ],
  ];
  expect(markdownToLines(input)).toEqual(expected);
});

it('markdownToLines - Mixed formatting', () => {
  const input = `The dog in **the** hog... a *very long text* about it
Word!`;

  const expectedOutput = [
    [
      { content: 'The', type: 'normal' },
      { content: 'dog', type: 'normal' },
      { content: 'in', type: 'normal' },
      { content: 'the', type: 'strong' },
      { content: 'hog...', type: 'normal' },
      { content: 'a', type: 'normal' },
      { content: 'very', type: 'em' },
      { content: 'long', type: 'em' },
      { content: 'text', type: 'em' },
      { content: 'about', type: 'normal' },
      { content: 'it', type: 'normal' },
    ],
    [{ content: 'Word!', type: 'normal' }],
  ];

  const output = markdownToLines(input);
  expect(output).toEqual(expectedOutput);
});
// TODO: Fix markdownAutoWrap=false behavior for htmlLabels:false.
// Expected output may need update after resolving space handling logic.
test.skip('markdownToLines - No auto wrapping', () => {
  expect(
    markdownToLines(
      `Hello, how do
  you do?`,
      { markdownAutoWrap: false }
    )
  ).toMatchInlineSnapshot(`
    [
      [
        {
          "content": "Hello,&nbsp;how&nbsp;do",
          "type": "normal",
        },
      ],
      [
        {
          "content": "you&nbsp;do?",
          "type": "normal",
        },
      ],
    ]
  `);
});

test('markdownToHTML - Basic test', () => {
  const input = `This is regular text
Here is a new line
There is some words **with a bold** section
Here is a line *with an italic* section`;

  const expectedOutput = `<p>This is regular text<br/>Here is a new line<br/>There is some words <strong>with a bold</strong> section<br/>Here is a line <em>with an italic</em> section</p>`;

  const output = markdownToHTML(input);
  expect(output).toEqual(expectedOutput);
});

test('markdownToHTML - Empty input', () => {
  const input = '';
  const expectedOutput = '';
  const output = markdownToHTML(input);
  expect(output).toEqual(expectedOutput);
});

test('markdownToHTML - No formatting', () => {
  const input = `This is a simple test
with no formatting`;

  const expectedOutput = `<p>This is a simple test<br/>with no formatting</p>`;
  const output = markdownToHTML(input);
  expect(output).toEqual(expectedOutput);
});

test('markdownToHTML - Only bold formatting', () => {
  const input = `This is a **bold** test`;

  const expectedOutput = `<p>This is a <strong>bold</strong> test</p>`;
  const output = markdownToHTML(input);
  expect(output).toEqual(expectedOutput);
});

test('markdownToHTML - Only italic formatting', () => {
  const input = `This is an *italic* test`;

  const expectedOutput = `<p>This is an <em>italic</em> test</p>`;
  const output = markdownToHTML(input);
  expect(output).toEqual(expectedOutput);
});

test('markdownToHTML - Mixed formatting', () => {
  const input = `*Italic* and **bold** formatting`;
  const expectedOutput = `<p><em>Italic</em> and <strong>bold</strong> formatting</p>`;
  const output = markdownToHTML(input);
  expect(output).toEqual(expectedOutput);
});

test('markdownToHTML - Unsupported formatting', () => {
  expect(
    markdownToHTML(`Hello
  - l1
  - l2
  - l3`)
  ).toMatchInlineSnapshot(`
    "<p>Hello</p>  - l1
      - l2
      - l3"
  `);
});

test('markdownToHTML - no auto wrapping', () => {
  expect(
    markdownToHTML(
      `Hello, how do
  you do?`,
      { markdownAutoWrap: false }
    )
  ).toMatchInlineSnapshot('"<p>Hello,&nbsp;how&nbsp;do<br/>you&nbsp;do?</p>"');
});

test('markdownToHTML - auto wrapping', () => {
  expect(
    markdownToHTML(
      `Hello, how do
  you do?`,
      { markdownAutoWrap: true }
    )
  ).toMatchInlineSnapshot('"<p>Hello, how do<br/>you do?</p>"');
});

test('nonMarkdownToLines - splits text by newlines, preserves SVG tags, does not process markdown', () => {
  // Splits by newlines (\n, \\n, <br>) and preserves SVG tags
  expect(nonMarkdownToLines('Line 1\\nLine 2<br/>Text with <strong>tag</strong>')).toEqual([
    [
      { content: 'Line', type: 'normal' },
      { content: '1', type: 'normal' },
    ],
    [
      { content: 'Line', type: 'normal' },
      { content: '2', type: 'normal' },
    ],
    [
      { content: 'Text', type: 'normal' },
      { content: 'with', type: 'normal' },
      { content: '<strong>', type: 'normal' },
      { content: 'tag', type: 'normal' },
      { content: '</strong>', type: 'normal' },
    ],
  ]);

  // Markdown syntax is NOT processed - stays as plain text
  expect(nonMarkdownToLines('**bold** and *italic*')).toEqual([
    [
      { content: '**bold**', type: 'normal' },
      { content: 'and', type: 'normal' },
      { content: '*italic*', type: 'normal' },
    ],
  ]);
});

test('markdownToLines - Link formatting', () => {
  const input = `Click [here](https://example.com/page) for details`;
  const output = markdownToLines(input);
  expect(output).toEqual([
    [
      { content: 'Click', type: 'normal' },
      { content: 'here', type: 'link', href: 'https://example.com/page' },
      { content: 'for', type: 'normal' },
      { content: 'details', type: 'normal' },
    ],
  ]);
});

test('markdownToLines - Link with multi-word text', () => {
  const input = `See [the docs here](https://example.com/docs) now`;
  const output = markdownToLines(input);
  expect(output).toEqual([
    [
      { content: 'See', type: 'normal' },
      { content: 'the', type: 'link', href: 'https://example.com/docs' },
      { content: 'docs', type: 'link', href: 'https://example.com/docs' },
      { content: 'here', type: 'link', href: 'https://example.com/docs' },
      { content: 'now', type: 'normal' },
    ],
  ]);
});

test('markdownToLines - Multiple links', () => {
  const input = `[A](https://a.com/x) and [B](https://b.com/y)`;
  const output = markdownToLines(input);
  expect(output).toEqual([
    [
      { content: 'A', type: 'link', href: 'https://a.com/x' },
      { content: 'and', type: 'normal' },
      { content: 'B', type: 'link', href: 'https://b.com/y' },
    ],
  ]);
});

test('markdownToLines - Link with bold and italic', () => {
  const input = `**Bold** and [link](https://example.com/page) and *italic*`;
  const output = markdownToLines(input);
  expect(output).toEqual([
    [
      { content: 'Bold', type: 'strong' },
      { content: 'and', type: 'normal' },
      { content: 'link', type: 'link', href: 'https://example.com/page' },
      { content: 'and', type: 'normal' },
      { content: 'italic', type: 'em' },
    ],
  ]);
});

test('markdownToLines - Malicious javascript: URL is sanitized', () => {
  const input = `[evil](javascript:alert(1))`;
  const output = markdownToLines(input);
  expect(output).toEqual([[{ content: 'evil', type: 'link', href: 'about:blank' }]]);
});

test('markdownToHTML - Link formatting', () => {
  const input = `Click [here](https://example.com/page) for details`;
  const output = markdownToHTML(input);
  expect(output).toEqual(
    '<p>Click <a href="https://example.com/page" target="_blank">here</a> for details</p>'
  );
});

test('markdownToHTML - Link with bold inside', () => {
  const input = `See [**bold link**](https://example.com/page)`;
  const output = markdownToHTML(input);
  expect(output).toEqual(
    '<p>See <a href="https://example.com/page" target="_blank"><strong>bold link</strong></a></p>'
  );
});

test('markdownToHTML - Multiple links', () => {
  const input = `[A](https://a.com/x) and [B](https://b.com/y)`;
  const output = markdownToHTML(input);
  expect(output).toEqual(
    '<p><a href="https://a.com/x" target="_blank">A</a> and <a href="https://b.com/y" target="_blank">B</a></p>'
  );
});

test('markdownToHTML - Malicious javascript: URL is sanitized', () => {
  const input = `[evil](javascript:alert(1))`;
  const output = markdownToHTML(input);
  expect(output).toEqual('<p><a href="about:blank" target="_blank">evil</a></p>');
});

test('markdownToHTML - Malicious data: URL is sanitized', () => {
  const input = `[evil](data:text/html,<script>alert(1)</script>)`;
  const output = markdownToHTML(input);
  expect(output).toEqual('<p><a href="about:blank" target="_blank">evil</a></p>');
});
