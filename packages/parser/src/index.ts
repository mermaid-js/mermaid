import type { AstNode } from 'langium';

export type { Info, Packet } from './language/index.js';
export { MermaidParseError, parse } from './parse.js';
export type { DiagramAST } from './parse.js';

/**
 * Exclude/omit all `AstNode` attributes recursively.
 */
export type RecursiveAstOmit<T> = T extends object
  ? { [P in keyof T as Exclude<P, keyof AstNode>]: RecursiveAstOmit<T[P]> }
  : T;
