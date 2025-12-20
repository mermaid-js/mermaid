import { cleanupComments } from './comments.js';
import { describe, it, expect } from 'vitest';

describe('block comments', () => {
  it('should remove block comments on single lines', () => {
    const text = `

%%* This is a block comment *%%
%%* This is another block comment *%%
graph TD
	A-->B
%%* This is a block comment *%%

`;
    expect(cleanupComments(text)).toMatchInlineSnapshot(`
      "graph TD
      	A-->B

      "
    `);
  });

  it('should remove block comments on multiple lines', () => {
    const text = `

%%*
This is a block comment
*%%
%%*
This is another block comment
*%%
graph TD
	A-->B
%%*
This is a block comment
*%%
`;
    expect(cleanupComments(text)).toMatchInlineSnapshot(`
      "graph TD
      	A-->B
      "
    `);
  });

  it('should remove indented block comments', () => {
    const text = `
%%*
 This is a block comment
        *%%
        %%*
This is a comment
*%%
graph TD
	A-->B
	      %%*
        This is a block comment
        *%%
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




%%*
 This is a block comment
*%%
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
%%* This is a comment *%%`;

    expect(cleanupComments(text)).toMatchInlineSnapshot(`
      "graph TD
	A-->B
"
    `);
  });

  it('should remove block comments AND single line comments', () => {
    const text = `

%%*
This is a block comment
*%%
%% This is a single line comment
graph TD
    A-->B
`;
    expect(cleanupComments(text)).toMatchInlineSnapshot(`
"graph TD
    A-->B
"
    `);
  });

  it('should remove single line comments within block comments', () => {
    const text = `

%%*
This is a block comment
%% This is a single line comment within a block comment
*%%
graph TD
    A-->B
`;
    expect(cleanupComments(text)).toMatchInlineSnapshot(`
"graph TD
    A-->B
"
    `);
  });
});
