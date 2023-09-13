// import type { RailroadDB } from './railroadTypes.js';
import * as configApi from '../../config.js';
import type { DiagramDB } from '../../diagram-api/types.js';

import { clear as commonClear } from '../common/commonDb.js';

const clear = (): void => {
  commonClear();
};

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

type Rules = Record<string, Chunk>;

let rules: Rules = {};

const getConsole = () => console;

interface Chunk {
  traverse<T>(callback: (item: Chunk, nested?: T[]) => T): T;
  toString(): string;
}

class Leaf implements Chunk {
  constructor(public label: string) {}

  traverse<T>(callback: (item: Chunk, nested?: T[]) => T): T {
    return callback(this);
  }

  toString(): string {
    return this.label;
  }
}

class Node implements Chunk {
  constructor(public child: Chunk) {}

  traverse<T>(callback: (item: Chunk, nested?: T[]) => T): T {
    const nested = this.child.traverse(callback);

    return callback(this, [nested]);
  }
}

class Chain implements Chunk {
  constructor(public children: Chunk[]) {}

  traverse<T>(callback: (item: Chunk, nested?: T[]) => T): T {
    const nested = this.children.map((child) => child.traverse(callback));

    return callback(this, nested);
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
}

// remote quote???
class Term extends Leaf {
  constructor(public label: string, public quote: string) {
    super(label);
  }

  toString(): string {
    return this.quote + super.toString() + this.quote;
  }
}

class NonTerm extends Leaf {
  toString(): string {
    return '<' + super.toString() + '>';
  }
}

class Choice extends Chain {
  toString(): string {
    // const content = '[a' + (this.needsWrapping() ? 'Y' : 'N') + this.chunks.join('|') + 'a]';
    const content = this.children.join('|');
    // if (this.needsWrapping())
    return '(a' + content + 'a)';
    // return content;
  }
}

class Sequence extends Chain {
  toString(): string {
    // return '[d' + (this.needsWrapping() ? 'Y' : 'N') + this.chunks.join(',') + 'd]';
    const content = this.children.join(',');
    // if (this.needsWrapping())
    return '(c' + content + 'c)';
  }
}

class OneOrMany extends Node {
  toString(): string {
    return this.child + '+';
  }
}

class ZeroOrOne extends Node {
  toString(): string {
    return this.child + '?';
  }
}

class ZeroOrMany extends Node {
  toString(): string {
    return this.child + '?';
  }
}

const addTerm = (label: string, quote: string): Chunk => {
  return new Term(label, quote);
};
const addNonTerm = (label: string): Chunk => {
  return new NonTerm(label);
};

const addZeroOrOne = (chunk: Chunk): Chunk => {
  return new ZeroOrOne(chunk);
};
const addOneOrMany = (chunk: Chunk): Chunk => {
  return new OneOrMany(chunk);
};
const addZeroOrMany = (chunk: Chunk): Chunk => {
  return new ZeroOrMany(chunk);
};
const addRuleOrChoice = (ID: string, chunk: Chunk) => {
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

  if (configApi.getConfig().railroad?.compressed) {
    chunks = chunks
      .map((chunk) => {
        if (chunk instanceof Sequence) {
          return chunk.children;
        }
        return chunk;
      })
      .flat();
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

  if (configApi.getConfig().railroad?.compressed) {
    chunks = chunks
      .map((chunk) => {
        if (chunk instanceof Choice) {
          return chunk.children;
        }
        return chunk;
      })
      .flat();
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

const getRules = (): Rules => {
  return rules;
};

export interface RailroadDB extends DiagramDB {
  addChoice: (chunks: Chunk[]) => Chunk;
  addEpsilon: () => Chunk;
  addNonTerm: (label: string) => Chunk;
  addOneOrMany: (chunk: Chunk) => Chunk;
  addRuleOrChoice: (ID: string, chunk: Chunk) => void;
  addSequence: (chunks: Chunk[]) => Chunk;
  addTerm: (label: string, quote: string) => Chunk;
  addZeroOrMany: (chunk: Chunk) => Chunk;
  addZeroOrOne: (chunk: Chunk) => Chunk;
  clear: () => void;
  getConsole: () => Console;
  getRules: () => Rules;
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
  clear,
  getConfig: () => configApi.getConfig().railroad,
  getConsole,
  getRules,
};
