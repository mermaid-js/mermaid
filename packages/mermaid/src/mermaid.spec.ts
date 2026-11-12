import mermaid from './mermaid.js';
import { mermaidAPI } from './mermaidAPI.js';
import './diagram-api/diagram-orchestration.js';
import { addDiagrams } from './diagram-api/diagram-orchestration.js';
import { beforeAll, describe, it, expect, vi, afterEach } from 'vitest';
import type { DiagramDefinition } from './diagram-api/types.js';

beforeAll(() => {
  addDiagrams();
});
const spyOn = vi.spyOn;

vi.mock('./mermaidAPI.js');

afterEach(() => {
  vi.clearAllMocks();
});

describe('when using mermaid and ', () => {
  describe('when detecting chart type ', () => {
    it('should not start rendering with mermaid.startOnLoad set to false', () => {
      mermaid.startOnLoad = false;
      document.body.innerHTML = '<div class="mermaid">graph TD;\na;</div>';
      spyOn(mermaid, 'run');
      mermaid.contentLoaded();
      expect(mermaid.run).not.toHaveBeenCalled();
    });

    it('should start rendering with both startOnLoad set', () => {
      mermaid.startOnLoad = true;
      document.body.innerHTML = '<div class="mermaid">graph TD;\na;</div>';
      spyOn(mermaid, 'run');
      mermaid.contentLoaded();
      expect(mermaid.run).toHaveBeenCalled();
    });

    it('should start rendering with mermaid.startOnLoad', () => {
      mermaid.startOnLoad = true;
      document.body.innerHTML = '<div class="mermaid">graph TD;\na;</div>';
      spyOn(mermaid, 'run');
      mermaid.contentLoaded();
      expect(mermaid.run).toHaveBeenCalled();
    });

    it('should start rendering as a default with no changes performed', () => {
      document.body.innerHTML = '<div class="mermaid">graph TD;\na;</div>';
      spyOn(mermaid, 'run');
      mermaid.contentLoaded();
      expect(mermaid.run).toHaveBeenCalled();
    });
  });

  describe('when using #run', () => {
    it.each([
      {
        // Generated with Highlight.js 11.11.1, using its JavaScript grammar.
        name: 'real Highlight.js output with escaped HTML and entities',
        html: 'graph <span class="hljs-variable constant_">TD</span>;\nA[<span class="hljs-string">&quot;&lt;b&gt;Bold&lt;/b&gt; &amp;amp; text&quot;</span>]--&gt;B;',
        text: 'graph TD;\nA["<b>Bold</b> &amp; text"]-->B;',
      },
      {
        name: 'Highlight.js class on the diagram element',
        className: 'mermaid hljs',
        html: 'graph TD;\nA--&gt;B;',
        text: 'graph TD;\nA-->B;',
      },
      {
        name: 'pre with a Highlight.js code wrapper',
        tagName: 'pre',
        html: '<code class="hljs">graph TD;\nA--&gt;B;</code>',
        text: 'graph TD;\nA-->B;',
      },
      {
        name: 'nested Highlight.js spans',
        html: '<span class="hljs-keyword">graph</span> TD;\n<span class="hljs-title"><span class="hljs-variable">A</span></span>--&gt;B;',
        text: 'graph TD;\nA-->B;',
      },
      {
        name: 'Prism tokens and line numbers',
        html: '<code class="language-mermaid"><span class="token keyword">graph</span> TD<span class="token punctuation">;</span>\nA<span class="token arrow operator">--&gt;</span>B;<span aria-hidden="true" class="line-numbers-rows"><span></span><span></span></span></code>',
        text: 'graph TD;\nA-->B;',
      },
      {
        name: 'Prism tokens without a code wrapper',
        html: '<span class="token keyword">graph</span> TD;\nA--&gt;B;',
        text: 'graph TD;\nA-->B;',
      },
      {
        name: 'language code with highlighter spans',
        html: '<code class="extra language-mermaid"><span class="token">graph TD;</span>\nA--&gt;B;</code>',
        text: 'graph TD;\nA-->B;',
      },
      {
        name: 'Shiki line spans with inline styles',
        html: '<code><span class="line"><span style="color:#CF222E">graph</span><span style="color:#24292F"> TD;</span></span>\n<span class="line"><span style="color:#24292F">A--&gt;B;</span></span></code>',
        text: 'graph TD;\nA-->B;',
      },
      {
        // Generated with Highlight.js 11.11.1, using its XML grammar.
        name: 'Highlight.js sub-language spans',
        html: 'graph TD;\n%% <span class="hljs-tag">&lt;<span class="hljs-name">script</span>&gt;</span><span class="language-javascript"><span class="hljs-keyword">const</span> x = <span class="hljs-number">1</span>;</span><span class="hljs-tag">&lt;/<span class="hljs-name">script</span>&gt;</span>\nA--&gt;B;',
        text: 'graph TD;\n%% <script>const x = 1;</script>\nA-->B;',
      },
      {
        name: 'HTML labels including ordinary spans',
        html: 'graph TD;\nA[<b>Bold</b> <span class="label">label</span>]-->B;',
        text: 'graph TD;\nA[<b>Bold</b> <span class="label">label</span>]-->B;',
      },
      {
        name: 'HTML label using only the token class',
        html: 'graph TD;\nA[<span class="token">label</span>]--&gt;B;',
        text: 'graph TD;\nA[<span class="token">label</span>]-->B;',
      },
      {
        name: 'HTML label using only the line class',
        html: 'graph TD;\nA[<span class="line">label</span>]--&gt;B;',
        text: 'graph TD;\nA[<span class="line">label</span>]-->B;',
      },
      {
        name: 'language class without highlighter spans',
        className: 'mermaid language-mermaid',
        html: 'graph TD;\nA[<b>Bold</b>]--&gt;B;',
        text: 'graph TD;\nA[<b>Bold</b>]-->B;',
      },
      {
        name: 'encoded HTML labels',
        html: 'graph TD;\nA[&lt;span class=&quot;label&quot;&gt;label&lt;/span&gt;]--&gt;B;',
        text: 'graph TD;\nA[<span class="label">label</span>]-->B;',
      },
      {
        name: 'entities',
        html: 'graph TD;\nA[&quot;A &amp; B &lt; C &#35;1&quot;]--&gt;B;',
        text: 'graph TD;\nA["A & B < C #1"]-->B;',
      },
      {
        name: 'br normalization',
        html: 'graph TD;\nA[one<br>two&lt;BR /&gt;three]--&gt;B;',
        text: 'graph TD;\nA[one<br/>two<br/>three]-->B;',
      },
      {
        name: 'indented frontmatter',
        html: '\n    ---\n    title: Test\n    ---\n    graph TD;\n      A--&gt;B;\n  ',
        text: '---\ntitle: Test\n---\ngraph TD;\n  A-->B;',
      },
    ])('should preserve diagram text with $name', async ({ html, text, className, tagName }) => {
      const node = document.createElement(tagName ?? 'div');
      node.className = className ?? 'mermaid';
      node.innerHTML = html;

      await mermaid.run({ nodes: [node] });

      expect(mermaidAPI.render).toHaveBeenCalledExactlyOnceWith(expect.any(String), text, node);
    });

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
              detector: (text) => text.includes('dummyError'),
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
    }, 20_000);

    it('should defer diagram load based on parameter', async () => {
      let loaded = false;
      const dummyDiagram: DiagramDefinition = {
        db: {},
        renderer: {
          draw: () => {
            // no-op
          },
        },
        parser: {
          parse: (_text) => {
            return;
          },
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
              detector: (text) => text.includes('dummy'),
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
              detector: (text) => text.includes('dummy2'),
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
        `[UnknownDiagramError: No diagram type detected matching given configuration for text: this is not a mermaid diagram definition]`
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
        [Error: Lexical error on line 1. Unrecognized text.
        graph TQ;A--x|text includ
        -----^]
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
        [Error: Parse error on line 2:
        ...equenceDiagramAlice:->Bob: Hello Bob, h...
        ----------------------^
        Expecting '()', 'SOLID_OPEN_ARROW', 'DOTTED_OPEN_ARROW', 'SOLID_ARROW', 'SOLID_ARROW_TOP', 'SOLID_ARROW_BOTTOM', 'STICK_ARROW_TOP', 'STICK_ARROW_BOTTOM', 'SOLID_ARROW_TOP_DOTTED', 'SOLID_ARROW_BOTTOM_DOTTED', 'STICK_ARROW_TOP_DOTTED', 'STICK_ARROW_BOTTOM_DOTTED', 'SOLID_ARROW_TOP_REVERSE', 'SOLID_ARROW_BOTTOM_REVERSE', 'STICK_ARROW_TOP_REVERSE', 'STICK_ARROW_BOTTOM_REVERSE', 'SOLID_ARROW_TOP_REVERSE_DOTTED', 'SOLID_ARROW_BOTTOM_REVERSE_DOTTED', 'STICK_ARROW_TOP_REVERSE_DOTTED', 'STICK_ARROW_BOTTOM_REVERSE_DOTTED', 'BIDIRECTIONAL_SOLID_ARROW', 'DOTTED_ARROW', 'BIDIRECTIONAL_DOTTED_ARROW', 'SOLID_CROSS', 'DOTTED_CROSS', 'SOLID_POINT', 'DOTTED_POINT', got 'TXT']
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
        `[UnknownDiagramError: No diagram type detected matching given configuration for text: this is not a mermaid diagram definition]`
      );
      expect(parseErrorWasCalled).toEqual(true);
    });
  });
});
