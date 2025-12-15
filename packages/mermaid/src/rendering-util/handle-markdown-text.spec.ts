import { markdownToLines, markdownToHTML, hasMarkdownSyntax } from './handle-markdown-text.js';
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

test('markdownToLines - No auto wrapping', () => {
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

test('hasMarkdownSyntax - detects bold text', () => {
  expect(hasMarkdownSyntax('This is **bold** text')).toBe(true);
  expect(hasMarkdownSyntax('**Bold**')).toBe(true);
  expect(hasMarkdownSyntax('Text with **bold** in middle')).toBe(true);
});

test('hasMarkdownSyntax - detects italic text', () => {
  expect(hasMarkdownSyntax('This is *italic* text')).toBe(true);
  expect(hasMarkdownSyntax('*Italic*')).toBe(true);
  expect(hasMarkdownSyntax('Text with *italic* in middle')).toBe(true);
});

test('hasMarkdownSyntax - detects mixed formatting', () => {
  expect(hasMarkdownSyntax('*Italic* and **bold**')).toBe(true);
  expect(hasMarkdownSyntax('The dog in **the** hog')).toBe(true);
});

test('hasMarkdownSyntax - returns false for plain text', () => {
  expect(hasMarkdownSyntax('This is plain text')).toBe(false);
  expect(hasMarkdownSyntax('The dog in the hog')).toBe(false);
  expect(hasMarkdownSyntax('Simple label')).toBe(false);
  expect(hasMarkdownSyntax('')).toBe(false);
});

test('hasMarkdownSyntax - handles edge cases', () => {
  expect(hasMarkdownSyntax(null as any)).toBe(false);
  expect(hasMarkdownSyntax(undefined as any)).toBe(false);
  expect(hasMarkdownSyntax('   ')).toBe(false);
  expect(hasMarkdownSyntax('Text with asterisks * but not italic')).toBe(false);
  expect(hasMarkdownSyntax('Text with ** but not bold')).toBe(false);
});
