import { it, describe, expect } from 'vitest';
import { addDetector, detectors, detectType } from './detectType.js';
import { cleanupComments } from './comments.js';
import { directiveRegex, matchFrontMatter, stripAnyComments } from './regexes.js';
import { addDiagrams } from './diagram-orchestration.js';

describe('diagram-orchestration', () => {
  it('should register diagrams', () => {
    expect(() => detectType('graph TD; A-->B')).toThrow();
    addDiagrams();
    expect(detectType('graph TD; A-->B')).toBe('flowchart-v2');
  });

  describe('proper diagram types should be detected', () => {
    beforeAll(() => {
      addDiagrams();
    });

    it.each([
      { text: 'graph TD;', expected: 'flowchart-v2' },
      { text: 'flowchart TD;', expected: 'flowchart-v2' },
      { text: 'flowchart-v2 TD;', expected: 'flowchart-v2' },
      { text: 'flowchart-elk TD;', expected: 'flowchart-elk' },
      { text: 'swimlane-beta TD;', expected: 'swimlane' },
      { text: 'error', expected: 'error' },
      { text: 'C4Context;', expected: 'c4' },
      { text: 'classDiagram', expected: 'classDiagram' },
      { text: 'classDiagram-v2', expected: 'classDiagram' },
      { text: 'erDiagram', expected: 'er' },
      { text: 'journey', expected: 'journey' },
      { text: 'gantt', expected: 'gantt' },
      { text: 'pie', expected: 'pie' },
      { text: 'requirementDiagram', expected: 'requirement' },
      { text: 'info', expected: 'info' },
      { text: 'sequenceDiagram', expected: 'sequence' },
      { text: 'mindmap', expected: 'mindmap' },
      { text: 'timeline', expected: 'timeline' },
      { text: 'gitGraph', expected: 'gitGraph' },
      { text: 'stateDiagram', expected: 'stateDiagram' },
      { text: 'stateDiagram-v2', expected: 'stateDiagram' },
    ])(
      'should $text be detected as $expected',
      ({ text, expected }: { text: string; expected: string }) => {
        expect(detectType(text)).toBe(expected);
      }
    );

    it('routes both graph and flowchart to the unified flowchart', () => {
      // `graph` and `flowchart` are the same diagram. They used to differ only when a
      // renderer was configured, which is why `graph` had a legacy id of its own.
      expect(detectType('graph TD; A-->B')).toBe('flowchart-v2');
      expect(detectType('flowchart TD; A-->B')).toBe('flowchart-v2');
    });

    it('keeps flowchart-elk as its own explicit keyword', () => {
      // The only remaining way to ask for ELK by diagram type. Everything else asks with
      // `layout: elk`.
      expect(detectType('flowchart-elk TD; A-->B')).toBe('flowchart-elk');
      expect(detectType('swimlane-beta TD; A-->B')).toBe('swimlane');
    });

    it('routes classDiagram and stateDiagram to their unified diagrams', () => {
      expect(detectType('classDiagram')).toBe('classDiagram');
      expect(detectType('classDiagram-v2')).toBe('classDiagram');
      expect(detectType('stateDiagram\n  [*] --> A')).toBe('stateDiagram');
      expect(detectType('stateDiagram-v2\n  [*] --> A')).toBe('stateDiagram');
    });

    it('does not mistake other diagram types for a flowchart', () => {
      // These carried a `flowchart.defaultRenderer` block for years, which did nothing for
      // them except trip a side effect in the flowchart detector.
      expect(detectType('mindmap\n  root\n    Photograph\n      Waterfall')).toBe('mindmap');
      expect(
        detectType(`
          classDiagram
            class Person {
              +String name
              -Int id
            }
          `)
      ).toBe('classDiagram');
      expect(
        detectType(`
          erDiagram
            p[Photograph] {
              varchar(12) jobId
              date dateCreated
            }
          `)
      ).toBe('er');
    });

    it('should not detect flowchart if pie contains flowchart', () => {
      expect(
        detectType(`pie title: "flowchart"
      flowchart: 1 "pie" pie: 2 "pie"`)
      ).toBe('pie');
    });
  });
});

describe('shared comment stripping in detection', () => {
  beforeAll(() => addDiagrams());

  it('passes exactly the shared helper output to a detector', () => {
    const source = '%% leading\ncustom-header %% inline\n  node["%% text"]\n%% trailing';
    const detector = vi.fn((text: string) => text.startsWith('custom-header'));
    addDetector('shared-comments-test', detector);
    try {
      expect(detectType(source)).toBe('shared-comments-test');
      expect(detector).toHaveBeenCalledWith(cleanupComments(source), undefined);
    } finally {
      delete detectors['shared-comments-test'];
    }
  });

  it('does not treat inline text as a whole-line comment for the strict error detector', () => {
    expect(() => detectType('error %% inline\n')).toThrow();
    expect(detectType('%% whole-line comment\nerror')).toBe('error');
  });

  it('keeps every registered detector equivalent on the diagram-header corpus', () => {
    const headers = [
      'error',
      '---',
      'C4Context',
      'C4Container',
      'C4Component',
      'C4Dynamic',
      'C4Deployment',
      'graph TD',
      'flowchart LR',
      'flowchart-elk TD',
      'agentflow-beta',
      'swimlane-beta',
      'erDiagram',
      'gitGraph',
      'gantt',
      'info',
      'pie',
      'quadrantChart',
      'xychart',
      'requirementDiagram',
      'sequenceDiagram',
      'classDiagram',
      'stateDiagram-v2',
      'journey',
      'timeline',
      'mindmap',
      'kanban',
      'sankey-beta',
      'packet-beta',
      'radar-beta',
      'block-beta',
      'treeView-beta',
      'architecture-beta',
      'eventmodeling',
      'ishikawa-beta',
      'treemap-beta',
      'railroad-beta',
      'railroad-ebnf-beta',
      'railroad-abnf-beta',
      'railroad-peg-beta',
      'venn-beta',
      'wardley-beta',
      'cynefin-beta',
      'usecase-beta',
    ];
    const covered = new Set<string>();
    for (const header of headers) {
      for (const source of [
        header,
        ...(header === 'error' || header === '---' ? [] : [`${header} %% inline\n`]),
        `%% leading\n  ${header}\n%% trailing\n`,
        `---\ntitle: Example\n---\n%% leading\n${header}\n`,
        `%%{init: {"theme": "default"}}%%\n${header}\n`,
      ]) {
        const frontMatter = matchFrontMatter(source);
        const stripped = (frontMatter ? source.slice(frontMatter.length) : source).replace(
          directiveRegex,
          ''
        );
        const oldText = stripAnyComments(stripped);
        const sharedText = cleanupComments(stripped);
        for (const [key, { detector }] of Object.entries(detectors)) {
          const oldResult = detector(oldText, {});
          expect(Boolean(detector(sharedText, {})), `${key}: ${source}`).toBe(Boolean(oldResult));
          if (oldResult) {
            covered.add(key);
          }
        }
        expect(detectType(source)).toBe(detectType(sharedText));
      }
    }
    expect([...covered].sort()).toEqual(Object.keys(detectors).sort());
  });
});
