// @ts-ignore: jison doesn't export types
import venn from './venn.jison';
import { db } from '../vennDB.js';
import { expect } from 'vitest';

describe('Venn diagram', function () {
  beforeEach(function () {
    venn.parser.yy = db;
    venn.parser.yy.clear();
    venn.parser.yy.getLogger = () => console;
  });

  test('simple', () => {
    const str = `venn-beta
          title foo bar
          sets A
          sets B
          sets A,B
      `;
    venn.parse(str);
    expect(db.getDiagramTitle()).toBe('foo bar');
    expect(db.getSubsetData()).toEqual([
      expect.objectContaining({ sets: ['A'], size: 10 }),
      expect.objectContaining({ sets: ['B'], size: 10 }),
      expect.objectContaining({ sets: ['A', 'B'], size: 2.5 }),
    ]);
  });

  test('with options', () => {
    const str = `venn-beta
          title foo bar
          sets A
          sets B        size : 20
          sets C       size : 30,   label : bar
          sets A,D      size : 5.3,  label : foo
          sets C, A,B
      `;
    venn.parse(str);
    expect(db.getSubsetData()).toEqual([
      expect.objectContaining({ sets: ['A'], size: 10 }),
      expect.objectContaining({ sets: ['B'], size: 20 }),
      expect.objectContaining({ sets: ['C'], size: 30, label: 'bar' }),
      expect.objectContaining({ sets: ['A', 'D'], size: 5.3, label: 'foo' }),
      expect.objectContaining({ sets: ['A', 'B', 'C'], size: 1.1111111111111112 }),
    ]);
  });

  test('with elements', () => {
    const str = `venn-beta
          title foo bar
          sets A
          sets B        size : 20
          sets C       size : 30,   label : bar
          sets A,D      size : 5.3,  label : foo
          sets C, A,B
      `;
    venn.parse(str);
    expect(db.getSubsetData()).toEqual([
      expect.objectContaining({ sets: ['A'], size: 10 }),
      expect.objectContaining({ sets: ['B'], size: 20 }),
      expect.objectContaining({ sets: ['C'], size: 30, label: 'bar' }),
      expect.objectContaining({ sets: ['A', 'D'], size: 5.3, label: 'foo' }),
      expect.objectContaining({ sets: ['A', 'B', 'C'], size: 1.1111111111111112 }),
    ]);
  });
});
