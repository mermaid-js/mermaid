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

// interface Traversable {
//   traverse<T>(callback: Callback<T>, index?: number, parent?: Chunk): T;
// }

// TODO: rewrite toEBNF using traverse
//
// interface Chunk extends Traversable {
//   toEBNF(): string;
// }

abstract class Chunk {
  // static staticMethod(): void;
  static display: ((instance: Chunk) => void) | undefined;
  abstract traverse<T>(callback: Callback<T>, index?: number, parent?: Chunk): T;
  abstract toEBNF(): string;
}

abstract class Leaf implements Chunk {
  constructor(public label: string) {}

  traverse<T>(callback: Callback<T>, index?: number, parent?: Chunk): T {
    index ??= 0;
    return callback(this, index, parent, []);
  }

  abstract toEBNF(): string;
}

abstract class Node implements Chunk {
  constructor(public child: Chunk) {}

  traverse<T>(callback: Callback<T>, index?: number, parent?: Chunk): T {
    index ??= 0;
    const nested = this.child.traverse(callback, index, this);

    return callback(this, index, parent, [nested]);
  }

  abstract toEBNF(): string;
}

abstract class Chain implements Chunk {
  constructor(public children: Chunk[]) {}

  traverse<T>(callback: Callback<T>, index?: number, parent?: Chunk): T {
    index ??= 0;
    const nested = this.children.map((child, child_index) =>
      child.traverse(callback, child_index, this)
    );

    return callback(this, index, parent, nested);
  }

  abstract toEBNF(): string;
}

export class Rule {
  constructor(public ID: string, public definition: Chunk) {}
  toEBNF() {
    return `${this.ID} ::= ${this.definition.toEBNF()}`;
  }
}

// Epsilon represents empty transition
//
// It is implied that every chunk has `start` and `end` states
// But we do not create them, simply keeping transition 'body' with label
//
class Epsilon extends Leaf {
  constructor() {
    super('ɛ');
  }

  toEBNF(): string {
    return this.label;
  }
}

class Term extends Leaf {
  toEBNF(): string {
    const escaped = this.label.replaceAll(/\\([\\'"])/g, "\\$1");
    
    return '"' + escaped + '"';
  }
}

class NonTerm extends Leaf {
  toEBNF(): string {
    const escaped = this.label.replaceAll(/\\([\\'"<>])/g, "\\$1");

    return '<' + escaped + '>';
  }
}

class Exception implements Chunk {
  constructor(public base: Chunk, public except: Chunk) {}

  traverse<T>(callback: Callback<T>, index?: number, parent?: Chunk): T {
    index ??= 0;
    const nested = [
      this.base.traverse(callback, 0, this),
      this.except.traverse(callback, 1, this),
    ]

    return callback(this, index, parent, nested);
  }

  toEBNF(): string {
    return `(${this.base.toEBNF()}) - ${this.except.toEBNF()}`
  }
}

class Choice extends Chain {
  toEBNF(): string {
    const content = this.children.map((c) => c.toEBNF()).join('|');
    return '(' + content + ')';
  }
}

class Sequence extends Chain {
  toEBNF(): string {
    const delimiter = railroadConfig?.format?.forceComma ? ', ' : ' ';
    const content = this.children.map((c) => c.toEBNF()).join(delimiter);
    return content;
  }
}

class OneOrMany extends Node {
  toEBNF(): string {
    return this.child.toEBNF() + '+';
  }
}

class ZeroOrOne extends Node {
  toEBNF(): string {
    return this.child.toEBNF() + '?';
  }
}

class ZeroOrMany extends Node {
  toEBNF(): string {
    return this.child.toEBNF() + '*';
  }
}

const addTerm = (label: string): Chunk => {
  label.replaceAll(/\\(.)/g, "$1");

  return new Term(label);
};
const addNonTerm = (label: string): Chunk => {
  return new NonTerm(label);
};


// resolve quantifiers
// (()?)? => ()?
// (()*)? => ()*

const addZeroOrOne = (chunk: Chunk): Chunk => {
  // TODO check if chunk zero or one and propagate
  if (chunk instanceof ZeroOrOne) {
    return chunk;
  } else if (chunk instanceof OneOrMany) {
    return chunk;
  }
  return new ZeroOrOne(chunk);
};
const addOneOrMany = (chunk: Chunk): Chunk => {
  // TODO check if chunk zero or many and propagate
  return new OneOrMany(chunk);
};
const addZeroOrMany = (chunk: Chunk): Chunk => {
  // TODO check if chunk zero or many and propagate
  return new ZeroOrMany(chunk);
};
const addException = (base: Chunk, except: Chunk): Chunk => {
  return new Exception(base, except);
}
const addRuleOrChoice = (ID: string, chunk: Chunk): void => {
  if (rules[ID]) {
    const value = rules[ID];
    const alternative = addChoice([value, chunk]);
    rules[ID] = alternative;
  } else {
    rules[ID] = chunk;
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

const getRules = (): Rule[] => {
  return Object.entries(rules).map(([ID, definition]) => new Rule(ID, definition));
};

export interface RailroadDB extends DiagramDB {
  addChoice: (chunks: Chunk[]) => Chunk;
  addEpsilon: () => Chunk;
  addNonTerm: (label: string) => Chunk;
  addOneOrMany: (chunk: Chunk) => Chunk;
  addRuleOrChoice: (ID: string, chunk: Chunk) => void;
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
