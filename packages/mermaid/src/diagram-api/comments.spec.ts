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
    expect(cleanupComments('graph TD\n    A-->B %% inline comment')).toBe('graph TD\n    A-->B');
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

  it('should not let a stray quote stop comment removal on later lines', () => {
    // A `"` in a sequence message (e.g. 6" wide) is ordinary text: the
    // message ends at the line, so the comment on the next line is removed.
    expect(
      cleanupComments(
        'sequenceDiagram\nAlice->>Bob: The board is 6" wide\nBob->>Alice: OK %% remove\n'
      )
    ).toBe('sequenceDiagram\nAlice->>Bob: The board is 6" wide\nBob->>Alice: OK\n');
  });

  it('should keep quote protection across lines where the grammar allows it', () => {
    // A flowchart label can span lines inside quotes, so `%%` in the label
    // stays literal while the trailing comment is still removed.
    expect(cleanupComments('graph TD\nA["50%% off\nmore text"] --> B %% remove\n')).toBe(
      'graph TD\nA["50%% off\nmore text"] --> B\n'
    );
  });

  it('should not treat %%{ as a directive without a preceding boundary', () => {
    // `50%%{off]` is literal text, not a directive: scanning continues past
    // it instead of swallowing the rest, so both trailing comments are removed.
    expect(cleanupComments('graph TD\nA[50%%{off] --> B %% remove\nC --> D %% remove\n')).toBe(
      'graph TD\nA[50%%{off] --> B\nC --> D\n'
    );
  });

  it('should keep a directive that follows code after whitespace', () => {
    expect(cleanupComments('graph TD %%{init: {"theme": "forest"}}%%\n    A-->B\n')).toBe(
      'graph TD %%{init: {"theme": "forest"}}%%\n    A-->B\n'
    );
  });

  it('should keep a state description that spans lines intact', () => {
    // A state description may span lines, so `%%` on the continuation line
    // is inside the quoted description and must be kept.
    expect(
      cleanupComments(
        'stateDiagram-v2\n    state "first\n    second %% note" as S\n    [*] --> S\n'
      )
    ).toBe('stateDiagram-v2\n    state "first\n    second %% note" as S\n    [*] --> S\n');
  });

  it('should not let a stray quote in a state diagram protect later lines', () => {
    // Only a `state "..."` description spans lines; a quote in a transition
    // description is line-scoped, so the comment on the next line is removed.
    expect(
      cleanupComments('stateDiagram-v2\n    [*] --> A: say "hi\n    A --> B %% remove\n')
    ).toBe('stateDiagram-v2\n    [*] --> A: say "hi\n    A --> B\n');
  });

  it('should remove a trailing comment after a one-line state description', () => {
    expect(
      cleanupComments('stateDiagram-v2\n    state "first" as S %% note\n    [*] --> S\n')
    ).toBe('stateDiagram-v2\n    state "first" as S\n    [*] --> S\n');
  });

  it('should keep %% with no whitespace before it at the end of a statement', () => {
    // An inline comment needs whitespace before `%%`; without it the text is
    // literal and the parser sees it.
    expect(cleanupComments('graph TD\n    A --> B;%%hidden\n    C-->D\n')).toBe(
      'graph TD\n    A --> B;%%hidden\n    C-->D\n'
    );
  });
});
