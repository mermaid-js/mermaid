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

  test('with options', () => {
    const str = `venn-beta
          title foo bar
          set A
          set B       size : 20,   label : foo
          set C       size : 30,   label : bar
          union A,B   size : 5.3,  label : buz buz
          union C, A,B             label : "Hello, world!"
      `;
    venn.parse(str);
    expect(db.getSubsetData()).toEqual([
      expect.objectContaining({ sets: ['A'], size: 10 }),
      expect.objectContaining({ sets: ['B'], size: 20, label: 'foo' }),
      expect.objectContaining({ sets: ['C'], size: 30, label: 'bar' }),
      expect.objectContaining({ sets: ['A', 'B'], size: 5.3, label: 'buz buz' }),
      expect.objectContaining({
        sets: ['A', 'B', 'C'],
        size: 1.1111111111111112,
        label: 'Hello, world!',
      }),
    ]);
  });

  test('with text nodes', () => {
    const str = `venn-beta
          set A
            text A1     label: foo bar
          set B
            text B1     label: "hello, world",  color: red
            text B2     label: "hex",  color: #fff
            text B3     label: "rgb",  color: rgb(255, 0, 128)
            text B4     label: "rgba", color: rgba(255, 0, 128, 0.5)
          union A,B
            text AB1    label: "shared note"
      `;
    venn.parse(str);
    expect(db.getTextData()).toEqual([
      expect.objectContaining({ sets: ['A'], id: 'A1', label: 'foo bar' }),
      expect.objectContaining({ sets: ['B'], id: 'B1', label: 'hello, world', color: 'red' }),
      expect.objectContaining({ sets: ['B'], id: 'B2', label: 'hex', color: '#fff' }),
      expect.objectContaining({ sets: ['B'], id: 'B3', label: 'rgb', color: 'rgb(255, 0, 128)' }),
      expect.objectContaining({
        sets: ['B'],
        id: 'B4',
        label: 'rgba',
        color: 'rgba(255, 0, 128, 0.5)',
      }),
      expect.objectContaining({ sets: ['A', 'B'], id: 'AB1', label: 'shared note' }),
    ]);
  });

  test('with indented text nodes', () => {
    const str = `venn-beta
          set A   label: Frontend
            text A1
            text A2
          set B   label: Backend
            text B1
          union A,B label: APIs
            text OpenAPI
      `;
    venn.parse(str);
    expect(db.getTextData()).toEqual([
      expect.objectContaining({ sets: ['A'], id: 'A1', label: undefined }),
      expect.objectContaining({ sets: ['A'], id: 'A2', label: undefined }),
      expect.objectContaining({ sets: ['B'], id: 'B1', label: undefined }),
      expect.objectContaining({ sets: ['A', 'B'], id: 'OpenAPI', label: undefined }),
    ]);
  });

  test('text node requires label', () => {
    const str = `venn-beta
        set A
            text A1  color: red
    `;
    expect(() => venn.parse(str)).toThrow('text requires label');
  });

  test('set requires single identifier', () => {
    const str = `venn-beta
        set A,B
    `;
    expect(() => venn.parse(str)).toThrow('set requires single identifier');
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
