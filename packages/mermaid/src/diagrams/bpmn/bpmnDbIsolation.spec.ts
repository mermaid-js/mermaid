import { describe, expect, it } from 'vitest';
import { BpmnDb } from './bpmnDb.js';
import { diagram } from './diagram.js';
import { parser } from './parser/bpmn.chevrotain.js';

const ONE = 'bpmn-beta LR\n  lane "L"\n    task one "One"';
const TWO = 'bpmn-beta TB\n  lane "L"\n    task two "Two"\n    task three "Three"';

const ids = (db: BpmnDb) => db.getData().nodes.map((node) => node.id);

/** The way `Diagram.fromText` hands the parser the db it just took from the definition. */
const parseInto = (db: BpmnDb, text: string) => {
  const yy = parser.parser;
  if (!yy) {
    throw new Error('the bpmn parser exposes no yy');
  }
  yy.yy = db;
  parser.parse(text);
};

describe('bpmn db isolation', () => {
  it('gives every render a fresh db', () => {
    expect(diagram.db).not.toBe(diagram.db);
  });

  it('keeps two diagrams parsed back to back apart', () => {
    const first = new BpmnDb();
    const second = new BpmnDb();
    parseInto(first, ONE);
    parseInto(second, TWO);
    expect(ids(first)).toEqual(['lane-1', 'one']);
    expect(ids(second)).toEqual(['lane-1', 'two', 'three']);
    expect(first.getDirection()).toBe('LR');
    expect(second.getDirection()).toBe('TB');
  });

  it('keeps two diagrams parsed interleaved apart', () => {
    const first = new BpmnDb();
    const second = new BpmnDb();
    parseInto(first, ONE);
    first.setDiagramId('first');
    parseInto(second, TWO);
    second.setDiagramId('second');
    expect(first.getData().diagramId).toBe('first');
    expect(second.getData().diagramId).toBe('second');
    expect(ids(first)).toEqual(['lane-1', 'one']);
  });

  describe('clear', () => {
    it('forgets the parsed diagram', () => {
      const db = new BpmnDb();
      parseInto(db, TWO);
      db.clear();
      expect(ids(db)).toEqual([]);
    });

    it('forgets the direction', () => {
      const db = new BpmnDb();
      parseInto(db, TWO);
      db.clear();
      expect(db.getDirection()).toBe('LR');
    });

    it('forgets the diagram id', () => {
      const db = new BpmnDb();
      db.setDiagramId('earlier');
      db.clear();
      expect(db.getData().diagramId).toBe('');
    });

    it('forgets the title and the accessibility text', () => {
      const db = new BpmnDb();
      parseInto(db, `${ONE}\n  title Heading\n  accTitle: T\n  accDescr: D`);
      db.clear();
      expect([db.getDiagramTitle(), db.getAccTitle(), db.getAccDescription()]).toEqual([
        '',
        '',
        '',
      ]);
    });
  });
});
