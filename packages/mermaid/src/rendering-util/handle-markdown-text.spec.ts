import { markdownToLines, markdownToHTML } from './handle-markdown-text.js';
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
      { content: 'with', type: 'emphasis' },
      { content: 'an', type: 'emphasis' },
      { content: 'italic', type: 'emphasis' },
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
      { content: 'italic', type: 'emphasis' },
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
      { content: 'Italic', type: 'emphasis' },
      { content: 'and', type: 'normal' },
      { content: 'bold', type: 'strong' },
      { content: 'formatting', type: 'normal' },
    ],
  ];
  expect(markdownToLines(input)).toEqual(expected);

  input = `*Italic with space* and **bold ws** formatting`;
  expected = [
    [
      { content: 'Italic', type: 'emphasis' },
      { content: 'with', type: 'emphasis' },
      { content: 'space', type: 'emphasis' },
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
      { content: 'very', type: 'emphasis' },
      { content: 'long', type: 'emphasis' },
      { content: 'text', type: 'emphasis' },
      { content: 'about', type: 'normal' },
      { content: 'it', type: 'normal' },
    ],
    [{ content: 'Word!', type: 'normal' }],
  ];

  const output = markdownToLines(input);
  expect(output).toEqual(expectedOutput);
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
  ).toMatchInlineSnapshot('"<p>Hello</p>Unsupported markdown: list"');
});
