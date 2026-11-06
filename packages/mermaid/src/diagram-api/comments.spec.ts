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

  it('should keep lines starting with %% inside a quoted string', () => {
    const text = `graph
  a---b["first line
  %% second line
  third line"]
%% This is a comment
`;
    expect(cleanupComments(text)).toMatchInlineSnapshot(`
      "graph
        a---b["first line
        %% second line
        third line"]
      "
    `);
  });

  it('should keep lines starting with %% inside a markdown string', () => {
    const text = `graph
  a["\`**first line**
  %% _second line_\`"]
`;
    expect(cleanupComments(text)).toMatchInlineSnapshot(`
      "graph
        a["\`**first line**
        %% _second line_\`"]
      "
    `);
  });

  it('should ignore quotes inside removed comments', () => {
    const text = `graph
%% A comment with an "unbalanced quote
  A-->B
%% This is a comment
  B["label"]
%% This is another comment
`;
    expect(cleanupComments(text)).toMatchInlineSnapshot(`
      "graph
        A-->B
        B["label"]
      "
    `);
  });
});
