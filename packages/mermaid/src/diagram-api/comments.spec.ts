import { cleanupComments } from './comments.js';
import { describe, it, expect } from 'vitest';

describe('comments', () => {
  it('should remove comments', () => {
    const text = `

%% This is a comment
%% This is another comment
graph TD
    A-->B
%% This is a comment
`;
    expect(cleanupComments(text)).toMatchInlineSnapshot(`
      "graph TD
          A-->B
      "
    `);
  });

  it('should keep init statements when removing comments', () => {
    const text = `
%% This is a comment

%% This is another comment
%%{init: {'theme': 'forest'}}%%
%%{ init: {'theme': 'space before init'}}%%
%%{init: {'theme': 'space after ending'}}%%
graph TD
    A-->B

    B-->C
%% This is a comment
`;
    expect(cleanupComments(text)).toMatchInlineSnapshot(`
      "%%{init: {'theme': 'forest'}}%%
      %%{ init: {'theme': 'space before init'}}%%
      %%{init: {'theme': 'space after ending'}}%%
      graph TD
          A-->B

          B-->C
      "
    `);
  });

  it('should remove indented comments', () => {
    const text = `
%% This is a comment
graph TD
    A-->B
    %% This is a comment
    C-->D
`;
    expect(cleanupComments(text)).toMatchInlineSnapshot(`
      "graph TD
          A-->B
          C-->D
      "
    `);
  });

  it('should remove empty newlines from start', () => {
    const text = `




%% This is a comment
graph TD
    A-->B
`;
    expect(cleanupComments(text)).toMatchInlineSnapshot(`
      "graph TD
          A-->B
      "
    `);
  });

  it('should remove comments at end of text with no newline', () => {
    const text = `
graph TD
    A-->B
%% This is a comment`;

    expect(cleanupComments(text)).toMatchInlineSnapshot(`
      "graph TD
          A-->B
      "
    `);
  });
});

describe('shared comment semantics', () => {
  it.each([
    'graph TD %% inline comment\n  A["%% label"] --> B',
    "%%{init: {'theme': 'forest'}}%%\ngraph TD",
    'graph TD\n%%',
    'graph TD\n%%\nA-->B',
  ])('preserves inline text, directives and empty markers: %s', (text) => {
    expect(cleanupComments(text)).toBe(text);
  });

  it('matches the former line-comment expression on a generated corpus', () => {
    const parts = [
      '',
      ' ',
      '\t',
      '\r',
      '\n',
      '\u2028',
      '\u2029',
      '%%',
      '%%{',
      '%%comment',
      'graph TD',
      'A["%%"]',
    ];
    let seed = 8196;
    for (let sample = 0; sample < 2000; sample++) {
      let text = '';
      for (let i = 0; i < 20; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        text += parts[seed % parts.length];
      }
      expect(cleanupComments(text), text).toBe(
        text.replace(/^\s*%%(?!{)[^\n]+\n?/gm, '').trimStart()
      );
    }
  });

  it.each(['\r', '\u2028', '\u2029'])('matches multiline anchors after %j', (separator) => {
    const text = `graph TD${separator}%% comment\nA-->B`;
    expect(cleanupComments(text)).toBe(text.replace(/^\s*%%(?!{)[^\n]+\n?/gm, '').trimStart());
  });

  it('handles whitespace and directive-heavy documents without changing them', () => {
    const text = (' '.repeat(40) + '\n').repeat(10000);
    expect(cleanupComments(text)).toBe('');
    const directives = '  %%{init: {}}%%\n'.repeat(10000);
    expect(cleanupComments(directives)).toBe(directives.trimStart());
  });
});
