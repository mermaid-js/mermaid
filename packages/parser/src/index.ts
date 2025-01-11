import type { AstNode } from 'langium';

export * from './language/index.js';
export * from './parse.js';

/**
 * Exclude/omit all `AstNode` attributes recursively.
 */
export type RecursiveAstOmit<T> = T extends object
  ? { [P in keyof T as Exclude<P, keyof AstNode>]: RecursiveAstOmit<T[P]> }
  : T;
