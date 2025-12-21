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
          set A,B
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
          set A,D     size : 5.3,  label : buz buz
          set C, A,B               label : "Hello, world!"
      `;
    venn.parse(str);
    expect(db.getSubsetData()).toEqual([
      expect.objectContaining({ sets: ['A'], size: 10 }),
      expect.objectContaining({ sets: ['B'], size: 20, label: 'foo' }),
      expect.objectContaining({ sets: ['C'], size: 30, label: 'bar' }),
      expect.objectContaining({ sets: ['A', 'D'], size: 5.3, label: 'buz buz' }),
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
          set B
          set A,B
          text A     label: foo bar
          text A,B   label: "shared note"
          text B     label: "hello, world",  color: red
          text B     label: "hex",  color: #fff
          text B     label: "rgb",  color: rgb(255, 0, 128)
          text B     label: "rgba", color: rgba(255, 0, 128, 0.5)
      `;
    venn.parse(str);
    expect(db.getTextData()).toEqual([
      expect.objectContaining({ sets: ['A'], text: 'foo bar' }),
      expect.objectContaining({ sets: ['A', 'B'], text: 'shared note' }),
      expect.objectContaining({ sets: ['B'], text: 'hello, world', color: 'red' }),
      expect.objectContaining({ sets: ['B'], text: 'hex', color: '#fff' }),
      expect.objectContaining({ sets: ['B'], text: 'rgb', color: 'rgb(255, 0, 128)' }),
      expect.objectContaining({ sets: ['B'], text: 'rgba', color: 'rgba(255, 0, 128, 0.5)' }),
    ]);
  });

  test('text node requires label', () => {
    const str = `venn-beta
        set A
        text A  color: red
    `;
    expect(() => venn.parse(str)).toThrow('text requires label');
  });
});
