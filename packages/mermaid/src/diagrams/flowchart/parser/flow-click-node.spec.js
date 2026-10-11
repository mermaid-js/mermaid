import { vi } from 'vitest';
import { FlowDB } from '../flowDb.js';
import flow from './flowParser.ts';
import { setConfig } from '../../../config.js';

setConfig({ securityLevel: 'strict' });

describe('Nodes named click', () => {
  let flowDb;

  beforeEach(() => {
    flowDb = new FlowDB();
    flow.parser.yy = flowDb;
    flowDb.clear();
  });

  describe.each([' ', '   ', '\t'])('with whitespace %j', (whitespace) => {
    it.each([
      '---',
      '-->',
      '==>',
      '-.->',
      '..->',
      '~~~',
      '<-->',
      'o--o',
      'x--x',
      '-- label -->',
      '== label ==>',
      '-. label .->',
    ])('preserves the nodes and edge for %s', (link) => {
      flow.parser.parse(`flowchart LR\nclick${whitespace}${link} abc;`);

      expect([...flowDb.getVertices().keys()]).toEqual(['click', 'abc']);
      expect(flowDb.getEdges()).toHaveLength(1);
      expect(flowDb.getEdges()[0]).toMatchObject({ start: 'click', end: 'abc' });
    });

    it('preserves click commands targeting a node named &', () => {
      const setClickEvent = vi.spyOn(flowDb, 'setClickEvent');
      flow.parser.parse(`flowchart LR\n& --> B\nclick${whitespace}& callback`);

      expect(setClickEvent).toHaveBeenCalledWith('&', 'callback');
      expect([...flowDb.getVertices().keys()]).toEqual(['&', 'B']);
      expect(flowDb.getEdges()).toHaveLength(1);
    });

    it.each(['callback', 'call callback()'])('preserves the %s click command', (command) => {
      const setClickEvent = vi.spyOn(flowDb, 'setClickEvent');
      flow.parser.parse(`flowchart LR\nA --> B\nclick${whitespace}A ${command}`);

      expect(setClickEvent).toHaveBeenCalledWith('A', 'callback');
      expect(flowDb.getEdges()).toHaveLength(1);
    });

    it.each(['"https://example.com"', 'href "https://example.com"'])(
      'preserves the %s click command',
      (command) => {
        const setLink = vi.spyOn(flowDb, 'setLink');
        flow.parser.parse(`flowchart LR\nA --> B\nclick${whitespace}A ${command}`);

        expect(setLink).toHaveBeenCalledWith('A', 'https://example.com');
        expect(flowDb.getEdges()).toHaveLength(1);
      }
    );
  });
});
