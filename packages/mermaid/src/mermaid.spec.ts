import mermaid from './mermaid.js';
import { mermaidAPI } from './mermaidAPI.js';
import './diagram-api/diagram-orchestration.js';
import { addDiagrams } from './diagram-api/diagram-orchestration.js';
import { beforeAll, describe, it, expect, vi } from 'vitest';

beforeAll(async () => {
  addDiagrams();
});
const spyOn = vi.spyOn;

vi.mock('./mermaidAPI.js');

afterEach(() => {
  vi.clearAllMocks();
});

describe('when using mermaid and ', () => {
  describe('when detecting chart type ', () => {
    it('should not start rendering with mermaid.startOnLoad set to false', async () => {
      mermaid.startOnLoad = false;
      document.body.innerHTML = '<div class="mermaid">graph TD;\na;</div>';
      spyOn(mermaid, 'run');
      mermaid.contentLoaded();
      expect(mermaid.run).not.toHaveBeenCalled();
    });

    it('should start rendering with both startOnLoad set', async () => {
      mermaid.startOnLoad = true;
      document.body.innerHTML = '<div class="mermaid">graph TD;\na;</div>';
      spyOn(mermaid, 'run');
      mermaid.contentLoaded();
      expect(mermaid.run).toHaveBeenCalled();
    });

    it('should start rendering with mermaid.startOnLoad', async () => {
      mermaid.startOnLoad = true;
      document.body.innerHTML = '<div class="mermaid">graph TD;\na;</div>';
      spyOn(mermaid, 'run');
      mermaid.contentLoaded();
      expect(mermaid.run).toHaveBeenCalled();
    });

    it('should start rendering as a default with no changes performed', async () => {
      document.body.innerHTML = '<div class="mermaid">graph TD;\na;</div>';
      spyOn(mermaid, 'run');
      mermaid.contentLoaded();
      expect(mermaid.run).toHaveBeenCalled();
    });
  });

  describe('when using #run', () => {
    it('should accept single node', async () => {
      const node = document.createElement('div');
      node.appendChild(document.createTextNode('graph TD;\na;'));

      await mermaid.run({
        nodes: [node],
      });
      // mermaidAPI.render function has been mocked, since it doesn't yet work
      // in Node.JS (only works in browser)
      expect(mermaidAPI.render).toHaveBeenCalled();
    });
  });

  describe('when using #registerExternalDiagrams', () => {
    it('should throw error (but still render) if registerExternalDiagrams fails', async () => {
      const node = document.createElement('div');
      node.appendChild(document.createTextNode('graph TD;\na;'));

      await expect(
        mermaid.registerExternalDiagrams(
          [
            {
              id: 'dummyError',
              detector: (text) => /dummyError/.test(text),
              loader: () => Promise.reject('dummyError'),
            },
          ],
          { lazyLoad: false }
        )
      ).rejects.toThrow('Failed to load 1 external diagrams');

      await expect(
        mermaid.run({
          nodes: [node],
        })
      ).resolves.not.toThrow();
      // should still render, even if lazyLoadedDiagrams fails
      expect(mermaidAPI.render).toHaveBeenCalled();
    });

    it('should defer diagram load based on parameter', async () => {
      let loaded = false;
      const dummyDiagram = {
        db: {},
        renderer: () => {
          // do nothing
        },
        parser: () => {
          // do nothing
        },
        styles: () => {
          // do nothing
        },
      };
      await expect(
        mermaid.registerExternalDiagrams(
          [
            {
              id: 'dummy',
              detector: (text) => /dummy/.test(text),
              loader: () => {
                loaded = true;
                return Promise.resolve({
                  id: 'dummy',
                  diagram: dummyDiagram,
                });
              },
            },
          ],
          { lazyLoad: true }
        )
      ).resolves.toBe(undefined);
      expect(loaded).toBe(false);
      await expect(
        mermaid.registerExternalDiagrams(
          [
            {
              id: 'dummy2',
              detector: (text) => /dummy2/.test(text),
              loader: () => {
                loaded = true;
                return Promise.resolve({
                  id: 'dummy2',
                  diagram: dummyDiagram,
                });
              },
            },
          ],
          { lazyLoad: false }
        )
      ).resolves.toBe(undefined);
      expect(loaded).toBe(true);
    });

    afterEach(() => {
      // we modify mermaid config in some tests, so we need to make sure to reset them
      mermaidAPI.reset();
    });
  });

  describe('checking validity of input ', () => {
    it('should throw for an invalid definition', async () => {
      await expect(
        mermaid.parse('this is not a mermaid diagram definition')
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        '"No diagram type detected matching given configuration for text: this is not a mermaid diagram definition"'
      );
    });

    it('should not throw for a valid flow definition', async () => {
      await expect(
        mermaid.parse('graph TD;A--x|text including URL space|B;')
      ).resolves.not.toThrow();
    });
    it('should throw for an invalid flow definition', async () => {
      await expect(mermaid.parse('graph TQ;A--x|text including URL space|B;')).rejects
        .toThrowErrorMatchingInlineSnapshot(`
        "Lexical error on line 1. Unrecognized text.
        graph TQ;A--x|text includ
        -----^"
      `);
    });

    it('should not throw for a valid sequenceDiagram definition (mmds1)', async () => {
      const text =
        'sequenceDiagram\n' +
        'Alice->Bob: Hello Bob, how are you?\n\n' +
        '%% Comment\n' +
        'Note right of Bob: Bob thinks\n' +
        'alt isWell\n\n' +
        'Bob-->Alice: I am good thanks!\n' +
        'else isSick\n' +
        'Bob-->Alice: Feel sick...\n' +
        'end';
      await expect(mermaid.parse(text)).resolves.not.toThrow();
    });

    it('should throw for an invalid sequenceDiagram definition', async () => {
      const text =
        'sequenceDiagram\n' +
        'Alice:->Bob: Hello Bob, how are you?\n\n' +
        '%% Comment\n' +
        'Note right of Bob: Bob thinks\n' +
        'alt isWell\n\n' +
        'Bob-->Alice: I am good thanks!\n' +
        'else isSick\n' +
        'Bob-->Alice: Feel sick...\n' +
        'end';
      await expect(mermaid.parse(text)).rejects.toThrowErrorMatchingInlineSnapshot(`
        "Parse error on line 2:
        ...equenceDiagramAlice:->Bob: Hello Bob, h...
        ----------------------^
        Expecting 'SOLID_OPEN_ARROW', 'DOTTED_OPEN_ARROW', 'SOLID_ARROW', 'DOTTED_ARROW', 'SOLID_CROSS', 'DOTTED_CROSS', 'SOLID_POINT', 'DOTTED_POINT', got 'TXT'"
      `);
    });

    it('should return false for invalid definition WITH a parseError() callback defined', async () => {
      let parseErrorWasCalled = false;
      mermaid.setParseErrorHandler(() => {
        parseErrorWasCalled = true;
      });
      await expect(
        mermaid.parse('this is not a mermaid diagram definition')
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        '"No diagram type detected matching given configuration for text: this is not a mermaid diagram definition"'
      );
      expect(parseErrorWasCalled).toEqual(true);
    });
  });
});
