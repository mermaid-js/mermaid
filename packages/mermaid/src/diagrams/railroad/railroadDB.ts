// import type { RailroadDB } from './railroadTypes.js';
import * as configApi from '../../config.js';
import type { DiagramDB } from '../../diagram-api/types.js';

import { clear as commonClear } from '../common/commonDb.js';

const clear = (): void => {
  commonClear();
};

// unite all rules
// split by rules
// show states
// display states
// hide states
// shape of non-terminals
// shape of terminals
// start
// end

// mark empty transitions
// true / false

// empty transitions mark ?
// 𝜺 - epsilon
// ɛ
// null
// type ruleID = string;

let rules: Record<string, Chunk> = {};

const getConsole = () => console;

class Chunk {
  // start?: State;
  // end?: State;
  // render: () => void;
  type(): string {
    return 'Chunk';
  }

  // [util.inspect.custom](): string {
  //   return this.toString();
  // }

  // should be wrapped?

  needsWrapping(): boolean {
    return false;
  }

  wrap(): string {
    return '(' + this.toString() + ')';
  }
}

// Epsilon represents empty transition
//
// It is implied that every chunk has `start` and `end` states
// But we do not create them, simply keeping transition 'body' with label
//
class Epsilon extends Chunk {
  toString(): string {
    return 'ɛ';
  }
}

class Term extends Chunk {
  constructor(public label: string, public quote: string) {
    super();
  }
  toString(): string {
    return this.quote + this.label + this.quote;
  }
}

class NonTerm extends Chunk {
  constructor(public label: string) {
    super();
  }
  toString(): string {
    return '<' + this.label + '>';
  }
}

class Chain extends Chunk {
  constructor(public chunks: Chunk[]) {
    super();
  }

  needsWrapping(): boolean {
    return this.chunks.length > 1;
  }
}

// Chain of chunks splitted by |
//
class Choice extends Chain {
  toString(): string {
    // const content = '[a' + (this.needsWrapping() ? 'Y' : 'N') + this.chunks.join('|') + 'a]';
    const content = this.chunks.join('|');
    // if (this.needsWrapping())
    return '(a' + content + 'a)';
    // return content;
  }
}

// Chain of chunks splitted by , (optionally)
//
class Sequence extends Chain {
  toString(): string {
    // return '[d' + (this.needsWrapping() ? 'Y' : 'N') + this.chunks.join(',') + 'd]';
    const content = this.chunks.join(',');
    // if (this.needsWrapping())
    return '(c' + content + 'c)';
  }
}

class OneOrMany extends Chunk {
  constructor(public chunk: Chunk) {
    super();
  }
  toString(): string {
    return this.chunk + '+';
  }
}

class ZeroOrOne extends Chunk {
  constructor(public chunk: Chunk) {
    super();
  }
  toString(): string {
    return this.chunk + '?';
  }
}

class ZeroOrMany extends Chunk {
  constructor(public chunk: Chunk) {
    super();
  }
  toString(): string {
    return this.chunk + '?';
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
          return chunk.chunks;
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
          return chunk.chunks;
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
};
