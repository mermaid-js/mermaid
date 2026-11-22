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

  it('should remove inline comments after a statement', () => {
    expect(cleanupComments('graph TD\n    A-->B %% inline comment\n    C-->D\n')).toBe(
      'graph TD\n    A-->B\n    C-->D\n'
    );
  });

  it('should remove inline comments after a semicolon (no space after %%)', () => {
    expect(cleanupComments('graph TD;\n    A --> B;  %%This comment works\n')).toBe(
      'graph TD;\n    A --> B;\n'
    );
  });

  it('should remove an inline comment with no trailing newline', () => {
    expect(cleanupComments('graph TD\n    A-->B %% inline comment')).toBe(
      'graph TD\n    A-->B'
    );
  });

  it('should keep %% inside double-quoted strings', () => {
    expect(cleanupComments('graph TD\n    A["50%% off"] --> B\n')).toBe(
      'graph TD\n    A["50%% off"] --> B\n'
    );
  });

  it('should keep %% inside double-quoted strings while removing a trailing comment', () => {
    expect(cleanupComments('graph TD\n    A["a %% b"] --> B %% comment\n')).toBe(
      'graph TD\n    A["a %% b"] --> B\n'
    );
  });

  it('should keep %% with no whitespace before it', () => {
    expect(cleanupComments('graph TD\n    A-->B: 50%% off\n')).toBe(
      'graph TD\n    A-->B: 50%% off\n'
    );
  });

  it('should keep init statements when removing a trailing comment after them', () => {
    expect(
      cleanupComments("%%{init: {'theme': 'forest'}}%% %% comment\ngraph TD\n    A-->B\n")
    ).toBe("%%{init: {'theme': 'forest'}}%%\ngraph TD\n    A-->B\n");
  });
});
