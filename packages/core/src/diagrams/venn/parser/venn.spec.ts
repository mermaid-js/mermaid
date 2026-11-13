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
          set A
          set B
          union A,B
      `;
    venn.parse(str);
    expect(db.getDiagramTitle()).toBe('foo bar');
    expect(db.getSubsetData()).toEqual([
      expect.objectContaining({ sets: ['A'], size: 10 }),
      expect.objectContaining({ sets: ['B'], size: 10 }),
      expect.objectContaining({ sets: ['A', 'B'], size: 2.5 }),
    ]);
  });

  test('with bracket labels', () => {
    const str = `venn-beta
          set A["Alpha"]
          set B["Beta"]
          union A,B["AB"]
      `;
    venn.parse(str);
    expect(db.getSubsetData()).toEqual([
      expect.objectContaining({ sets: ['A'], size: 10, label: 'Alpha' }),
      expect.objectContaining({ sets: ['B'], size: 10, label: 'Beta' }),
      expect.objectContaining({ sets: ['A', 'B'], size: 2.5, label: 'AB' }),
    ]);
  });

  test('with unquoted bracket labels', () => {
    const str = `venn-beta
          set A[Alpha]
          set B[Beta]
          union A,B[AB]
      `;
    venn.parse(str);
    expect(db.getSubsetData()).toEqual([
      expect.objectContaining({ sets: ['A'], size: 10, label: 'Alpha' }),
      expect.objectContaining({ sets: ['B'], size: 10, label: 'Beta' }),
      expect.objectContaining({ sets: ['A', 'B'], size: 2.5, label: 'AB' }),
    ]);
  });

  test('with size suffix', () => {
    const str = `venn-beta
          set A:20
          set B:12
          union A,B:3
      `;
    venn.parse(str);
    expect(db.getSubsetData()).toEqual([
      expect.objectContaining({ sets: ['A'], size: 20 }),
      expect.objectContaining({ sets: ['B'], size: 12 }),
      expect.objectContaining({ sets: ['A', 'B'], size: 3 }),
    ]);
  });

  test('with bracket label and size suffix', () => {
    const str = `venn-beta
          title foo bar
          set A["Alpha"]:20
          set B["Beta"]:12
          set C["Gamma"]:30
          union A,B["AB"]:5.3
          union C,A,B:1
      `;
    venn.parse(str);
    expect(db.getSubsetData()).toEqual([
      expect.objectContaining({ sets: ['A'], size: 20, label: 'Alpha' }),
      expect.objectContaining({ sets: ['B'], size: 12, label: 'Beta' }),
      expect.objectContaining({ sets: ['C'], size: 30, label: 'Gamma' }),
      expect.objectContaining({ sets: ['A', 'B'], size: 5.3, label: 'AB' }),
      expect.objectContaining({ sets: ['A', 'B', 'C'], size: 1 }),
    ]);
  });

  test('with text nodes using bracket labels', () => {
    const str = `venn-beta
          set A
            text A1["foo bar"]
          set B
            text B1["hello, world"]
          union A,B
            text AB1["shared note"]
      `;
    venn.parse(str);
    expect(db.getTextData()).toEqual([
      expect.objectContaining({ sets: ['A'], id: 'A1', label: 'foo bar' }),
      expect.objectContaining({ sets: ['B'], id: 'B1', label: 'hello, world' }),
      expect.objectContaining({ sets: ['A', 'B'], id: 'AB1', label: 'shared note' }),
    ]);
  });

  test('with indented text nodes (no label)', () => {
    const str = `venn-beta
          set A["Frontend"]
            text A1
            text A2
          set B["Backend"]
            text B1
          union A,B["APIs"]
      `;
    venn.parse(str);
    expect(db.getTextData()).toEqual([
      expect.objectContaining({ sets: ['A'], id: 'A1', label: undefined }),
      expect.objectContaining({ sets: ['A'], id: 'A2', label: undefined }),
      expect.objectContaining({ sets: ['B'], id: 'B1', label: undefined }),
    ]);
  });

  test('with style statement for single set', () => {
    const str = `venn-beta
          set A
          set B
          union A,B
          style A fill:#ff6b6b
      `;
    venn.parse(str);
    expect(db.getStyleData()).toEqual([
      expect.objectContaining({ targets: ['A'], styles: { fill: '#ff6b6b' } }),
    ]);
  });

  test('with style statement for intersection', () => {
    const str = `venn-beta
          set A
          set B
          union A,B
          style A,B color:#333
      `;
    venn.parse(str);
    expect(db.getStyleData()).toEqual([
      expect.objectContaining({ targets: ['A', 'B'], styles: { color: '#333' } }),
    ]);
  });

  test('with style statement for text node', () => {
    const str = `venn-beta
          set A
            text A1["React"]
          style A1 color:red
      `;
    venn.parse(str);
    expect(db.getStyleData()).toEqual([
      expect.objectContaining({ targets: ['A1'], styles: { color: 'red' } }),
    ]);
  });

  test('with multiple style properties', () => {
    const str = `venn-beta
          set A
          set B
          union A,B
          style A fill:#ff6b6b, color:#333
      `;
    venn.parse(str);
    expect(db.getStyleData()).toEqual([
      expect.objectContaining({
        targets: ['A'],
        styles: { fill: '#ff6b6b', color: '#333' },
      }),
    ]);
  });

  test('style with rgb/rgba colors', () => {
    const str = `venn-beta
          set A
          set B
          style A fill:rgb(255, 0, 128)
          style B fill:rgba(255, 0, 128, 0.5)
      `;
    venn.parse(str);
    expect(db.getStyleData()).toEqual([
      expect.objectContaining({ targets: ['A'], styles: { fill: 'rgb(255, 0, 128)' } }),
      expect.objectContaining({ targets: ['B'], styles: { fill: 'rgba(255, 0, 128, 0.5)' } }),
    ]);
  });

  test('indent mode with style coexistence', () => {
    const str = `venn-beta
          set A["Frontend"]:20
            text A1["React"]
          set B["Backend"]:12
          union A,B["Shared"]:3
            text AB1["OpenAPI"]
          style A fill:#ff6b6b
          style A,B color:#333
          style A1 color:red
      `;
    venn.parse(str);
    expect(db.getSubsetData()).toEqual([
      expect.objectContaining({ sets: ['A'], size: 20, label: 'Frontend' }),
      expect.objectContaining({ sets: ['B'], size: 12, label: 'Backend' }),
      expect.objectContaining({ sets: ['A', 'B'], size: 3, label: 'Shared' }),
    ]);
    expect(db.getTextData()).toEqual([
      expect.objectContaining({ sets: ['A'], id: 'A1', label: 'React' }),
      expect.objectContaining({ sets: ['A', 'B'], id: 'AB1', label: 'OpenAPI' }),
    ]);
    expect(db.getStyleData()).toEqual([
      expect.objectContaining({ targets: ['A'], styles: { fill: '#ff6b6b' } }),
      expect.objectContaining({ targets: ['A', 'B'], styles: { color: '#333' } }),
      expect.objectContaining({ targets: ['A1'], styles: { color: 'red' } }),
    ]);
  });

  test('set requires single identifier', () => {
    const str = `venn-beta
        set A,B
    `;
    expect(() => venn.parse(str)).toThrow();
  });

  test('union requires multiple identifiers', () => {
    const str = `venn-beta
        union A
    `;
    expect(() => venn.parse(str)).toThrow('union requires multiple identifiers');
  });

  test('union requires known identifiers', () => {
    const str = `venn-beta
        set Foo
        union Foo,Buz
    `;
    expect(() => venn.parse(str)).toThrow('unknown set identifier');
  });

  test('quoted identifiers', () => {
    const str = `venn-beta
        set "Foo Bar"
        set Buz
        union "Foo Bar",Buz
    `;
    venn.parse(str);
    expect(db.getSubsetData()).toEqual([
      expect.objectContaining({ sets: ['Foo Bar'], size: 10 }),
      expect.objectContaining({ sets: ['Buz'], size: 10 }),
      expect.objectContaining({ sets: ['Buz', 'Foo Bar'], size: 2.5 }),
    ]);
  });
});
