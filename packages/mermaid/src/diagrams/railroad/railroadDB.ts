// import type { RailroadDB } from './railroadTypes.js';
import * as configApi from '../../config.js';
import type { DiagramDB } from '../../diagram-api/types.js';

import { clear as commonClear } from '../common/commonDb.js';

const railroadConfig = configApi.getConfig().railroad;

const clear = (): void => {
  commonClear();

  rules = {};
};

// TODO: move to style config
// Styles
//
// unite rules
// split rules
//
// show states / display states
// hide states
//
// shapes of non-terminals
// shapes of terminals
//
// start
// end

// mark empty transitions
// true / false

// empty transitions mark ?
// 𝜺 - epsilon
// ɛ
// null
// type ruleID = string;

export type Rules = Record<string, Chunk>;
let rules: Rules = {};

const getConsole = () => console;

type Callback<T> = (item: Chunk, index: number, parent: Chunk | undefined, result: T[]) => T;
// type Traverse<T> = (callback: Callback<T>, index: number, parent?: Chunk) => T;

// Base class
//
export abstract class Node {
  abstract traverse<T>(callback: Callback<T>, index?: number, parent?: Node): T;
  // abstract toEBNF(): string;
}

// Production Rule or a Rule for simplicity represents a grammar production
//
//    expr = expr "+" number | expr;
//
// That is a rule. Left side is its label, always non-terminal for context-free
// grammars, and right side is its body (definition)
//
export class Rule implements Node {
  constructor(public label: string, public definition: Chunk) { }

  traverse<T>(callback: Callback<T>, index?: number, parent?: Chunk): T {
    index ??= 0;
    const nested = this.definition.traverse(callback, index, this);

    return callback(this, index, parent, [nested]);
  }

  // toEBNF() {
  //   return `${this.label} ::= ${this.definition.toEBNF()}`;
  // }
}

// Chunk represents any part of right side of a Rule.
// We differ it from the Node because grammar does not allow recursive definitions
//
export abstract class Chunk extends Node {
  // static staticMethod(): void;
  // static display: ((instance: Chunk) => void) | undefined;
}

// Chain is base class for a alternatives or sequences
//
abstract class Chain implements Chunk {
  constructor(public children: Chunk[]) {}

  traverse<T>(callback: Callback<T>, index?: number, parent?: Chunk): T {
    index ??= 0;
    const nested = this.children.map((child, child_index) =>
      child.traverse(callback, child_index, this)
    );

    return callback(this, index, parent, nested);
  }

  // abstract toEBNF(): string;
}

// Choice represents list of alternatives - one or another
//
// variable | number | string ;
//
export class Choice extends Chain {
  // toEBNF(): string {
  //   const content = this.children.map((c) => c.toEBNF()).join('|');
  //   return '(' + content + ')';
  // }
}

// Sequence is concatenation of elements
//
//    expr '+' expr
//
export class Sequence extends Chain {
  // toEBNF(): string {
  //   const delimiter = railroadConfig?.format?.forceComma ? ', ' : ' ';
  //   const content = this.children.map((c) => c.toEBNF()).join(delimiter);
  //   return content;
  // }
}

// Element is a primitive - terminal or non-terminal
//
abstract class Element implements Chunk {
  constructor(public label: string) {}

  traverse<T>(callback: Callback<T>, index?: number, parent?: Chunk): T {
    index ??= 0;
    return callback(this, index, parent, []);
  }

  // abstract toEBNF(): string;
}

// Epsilon represents empty transition
//
// It is implied that every chunk has `start` and `end` states
// But we do not create them, simply keeping transition 'body' with label
//
export class Epsilon extends Element {
  constructor() {
    super('ɛ');
  }

  // toEBNF(): string {
  //   return this.label;
  // }
}

// Terminal is just a symbol or a string in a grammar
//
export class Term extends Element {
  // toEBNF(): string {
  //   const escaped = this.label.replaceAll(/\\([\\'"])/g, "\\$1");

  //   return '"' + escaped + '"';
  // }
}

// NonTerm is reference to a rule
//
//    assignment = variable "=" num
//
// in that case <variable> and <num> are non terminals
//
export class NonTerm extends Element {
  // toEBNF(): string {
  //   const escaped = this.label.replaceAll(/\\([\\'"<>])/g, "\\$1");

  //   return '<' + escaped + '>';
  // }
}

// Something except another something
//
//    variable = alphanum - "const"
//
// means that <variable> is an alphanumeric, but not the word "const"
//
export class Exception implements Chunk {
  constructor(public base: Chunk, public except: Chunk) {}

  traverse<T>(callback: Callback<T>, index?: number, parent?: Chunk): T {
    index ??= 0;
    const nested = [
      this.base.traverse(callback, 0, this),
      this.except.traverse(callback, 1, this),
    ]

    return callback(this, index, parent, nested);
  }
}

// Closure means a grammar (regexp if you will) closure:
// 0 or 1, 1 or many, 0 or many, {n,m} repetitions, etc.
//
abstract class Closure implements Chunk {
  constructor(public child: Chunk) {}

  traverse<T>(callback: Callback<T>, index?: number, parent?: Chunk): T {
    index ??= 0;
    const nested = this.child.traverse(callback, index, this);

    return callback(this, index, parent, [nested]);
  }
}

export class OneOrMany extends Closure {}
export class ZeroOrOne extends Closure {}
export class ZeroOrMany extends Closure {}

//==========================================================

const addTerm = (label: string): Chunk => {
  label.replaceAll(/\\(.)/g, "$1");

  return new Term(label);
};

const addNonTerm = (label: string): Chunk => {
  return new NonTerm(label);
};

// a?? => a?
// a+? => a*
// a*? => a*
const addZeroOrOne = (chunk: Chunk): Chunk => {
  if (chunk instanceof ZeroOrOne) {
    return chunk;
  } else if (chunk instanceof OneOrMany) {
    return new ZeroOrMany(chunk.child);
  } else if (chunk instanceof ZeroOrMany) {
    return chunk;
  }
  return new ZeroOrOne(chunk);
};

// a?+ => a*
// a++ => a+
// a*+ => a*
const addOneOrMany = (chunk: Chunk): Chunk => {
  if (chunk instanceof ZeroOrOne) {
    return new ZeroOrMany(chunk.child);
  } else if (chunk instanceof OneOrMany) {
    return chunk;
  } else if (chunk instanceof ZeroOrMany) {
    return chunk;
  }
  return new OneOrMany(chunk);
};

// a?* => a*
// a+* => a*
// a** => a*
const addZeroOrMany = (chunk: Chunk): Chunk => {
  if (chunk instanceof ZeroOrOne) {
    return new ZeroOrMany(chunk.child);
  } else if (chunk instanceof OneOrMany) {
    return new ZeroOrMany(chunk.child);
  } else if (chunk instanceof ZeroOrMany) {
    return chunk;
  }
  return new ZeroOrMany(chunk);
};

const addException = (base: Chunk, except: Chunk): Chunk => {
  return new Exception(base, except);
}

const addRuleOrChoice = (label: string, chunk: Chunk): void => {
  if (rules[label]) {
    const value = rules[label];
    const alternative = addChoice([value, chunk]);
    rules[label] = alternative;
  } else {
    rules[label] = chunk;
  }
};

const addSequence = (chunks: Chunk[]): Chunk => {
  if (!Array.isArray(chunks)) {
    console.error('Sequence`s chunks are not array', chunks);
  }

  if (railroadConfig?.compress) {
    chunks = chunks
      .flatMap((chunk) => {
        if (chunk instanceof Sequence) {
          return chunk.children;
        }
        return chunk;
      });
  }

  if (chunks.length === 1) {
    return chunks[0];
  } else {
    return new Sequence(chunks);
  }
};

const addChoice = (chunks: Chunk[]): Chunk => {
  if (!Array.isArray(chunks)) {
    console.error('Alternative chunks are not array', chunks);
  }

  if (configApi.getConfig().railroad?.compress) {
    chunks = chunks
      .flatMap((chunk) => {
        if (chunk instanceof Choice) {
          return chunk.children;
        }
        return chunk;
      });
  }

  if (chunks.length === 1) {
    return chunks[0];
  } else {
    return new Choice(chunks);
  }
};

const addEpsilon = (): Chunk => {
  return new Epsilon();
};

// We keep Rules as a mapping and now we return them all as instances
// 
const getRules = (): Rule[] => {
  return Object.entries(rules).map(([ID, definition]) => new Rule(ID, definition));
};

export interface RailroadDB extends DiagramDB {
  addChoice: (chunks: Chunk[]) => Chunk;
  addEpsilon: () => Chunk;
  addNonTerm: (label: string) => Chunk;
  addOneOrMany: (chunk: Chunk) => Chunk;
  addRuleOrChoice: (label: string, chunk: Chunk) => void;
  addSequence: (chunks: Chunk[]) => Chunk;
  addTerm: (label: string) => Chunk;
  addZeroOrMany: (chunk: Chunk) => Chunk;
  addZeroOrOne: (chunk: Chunk) => Chunk;
  addException: (base: Chunk, except: Chunk) => Chunk;
  clear: () => void;
  getConsole: () => Console;
  getRules: () => Rule[];
}

export const db: RailroadDB = {
  addChoice,
  addEpsilon,
  addNonTerm,
  addOneOrMany,
  // addOrMergeRule,
  addRuleOrChoice,
  addSequence,
  addTerm,
  addZeroOrMany,
  addZeroOrOne,
  addException,
  clear,
  getConfig: () => configApi.getConfig().railroad,
  getConsole,
  getRules,
};
