// tests to check that comments are removed

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
