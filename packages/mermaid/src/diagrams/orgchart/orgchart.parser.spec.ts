import type { CstNode } from 'chevrotain';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parser } from './parser/orgchart.chevrotain.js';
import { orgchartLexer, orgchartParser } from './parser/orgchart.parser.js';
import { db } from './orgchartDb.js';
import { orgchart } from './orgchartDetector.js';
import type { OrgNode } from './orgchartTypes.js';

const parse = (text: string) => parser.parse(text + '\n');
const labels = (nodes: OrgNode[]) => nodes.map((n) => n.label);

describe('orgchart detector', () => {
  it('detects orgchart-beta only', () => {
    expect(orgchart.detector('orgchart-beta\n  CEO', {})).toBe(true);
    expect(orgchart.detector('  orgchart-beta', {})).toBe(true);
    expect(orgchart.detector('orgchart\n  CEO', {})).toBe(false);
    expect(orgchart.detector('orgchart-betamax', {})).toBe(false);
    expect(orgchart.detector('treeView-beta', {})).toBe(false);
  });
});

describe('orgchart parser and model', () => {
  beforeEach(() => db.clear());
  afterEach(() => vi.restoreAllMocks());

  it('parses the reference example into regular children and staff', async () => {
    await parse(`orgchart-beta
    CEO "Anna Andersson"
        staff CFO "Bo Berg"
        staff HR "Carina Carlson"
        Engineering "David Dahl"
            Development "Eva Ek"
            Systems "Fred Ford"
        Sales "Greta Gran"`);
    const root = db.getRoot()!;
    expect(root.label).toBe('CEO');
    expect(root.secondaryLabel).toBe('Anna Andersson');
    expect(labels(root.staff)).toEqual(['CFO', 'HR']);
    expect(root.staff.every((n) => n.kind === 'staff')).toBe(true);
    expect(labels(root.children)).toEqual(['Engineering', 'Sales']);
    expect(labels(root.children[0].children)).toEqual(['Development', 'Systems']);
    expect(root.children[0].parentId).toBe(root.id);
    expect(db.getNodes()).toHaveLength(7);
  });

  it('supports arbitrary depth and returning to shallower levels', async () => {
    await parse(`orgchart-beta
  A
    B
      C
        D
    E`);
    const root = db.getRoot()!;
    expect(labels(root.children)).toEqual(['B', 'E']);
    expect(root.children[0].children[0].children[0].label).toBe('D');
  });

  it('keeps source order of regular children when staff is interleaved', async () => {
    await parse(`orgchart-beta
  A
    B
    staff S
    C`);
    const root = db.getRoot()!;
    expect(labels(root.children)).toEqual(['B', 'C']);
    expect(labels(root.staff)).toEqual(['S']);
  });

  it('makes the secondary label optional and allows unquoted multi-word and quoted labels', async () => {
    await parse(`orgchart-beta
  Chief Executive Officer
    "Head of staff" "Jane Doe"
    R&D`);
    const root = db.getRoot()!;
    expect(root.label).toBe('Chief Executive Officer');
    expect(root.secondaryLabel).toBeUndefined();
    expect(root.children[0].label).toBe('Head of staff');
    expect(root.children[0].secondaryLabel).toBe('Jane Doe');
    expect(root.children[1].label).toBe('R&D');
  });

  it('only treats the staff keyword as a keyword on its own', async () => {
    await parse(`orgchart-beta
  A
    staffing "x"
    "staff"`);
    const root = db.getRoot()!;
    expect(root.staff).toHaveLength(0);
    expect(labels(root.children)).toEqual(['staffing', 'staff']);
  });

  it('supports optional explicit ids and generates the rest', async () => {
    await parse(`orgchart-beta
  ceo[CEO] "Anna"
    staff cfo[CFO]
    Sales`);
    expect(db.getNode('ceo')?.label).toBe('CEO');
    expect(db.getNode('cfo')?.kind).toBe('staff');
    expect(db.getRoot()!.children[0].id).toMatch(/^orgchart-node-/);
  });

  it('rejects collisions between explicit ids and generated ids', async () => {
    await expect(
      parse(`orgchart-beta
  orgchart-node-1[CEO]
  Report`)
    ).rejects.toThrow(/duplicate node id "orgchart-node-1"/);
  });

  it('parses visible and accessible title metadata without changing the hierarchy', async () => {
    await parse(`orgchart-beta
title The company
accTitle: Company organization
accDescr {
  The CEO manages Engineering.
  Finance supports the CEO.
}
  CEO
    staff Finance
    Engineering`);
    expect(db.getDiagramTitle()).toBe('The company');
    expect(db.getAccTitle()).toBe('Company organization');
    expect(db.getAccDescription()).toBe('The CEO manages Engineering.\nFinance supports the CEO.');
    expect(labels(db.getRoot()!.children)).toEqual(['Engineering']);
    expect(labels(db.getRoot()!.staff)).toEqual(['Finance']);
  });

  it('treats a sanitized-empty secondary label as absent', async () => {
    await parse(`orgchart-beta
  CEO ""`);

    expect(db.getRoot()?.label).toBe('CEO');
    expect(db.getRoot()?.secondaryLabel).toBeUndefined();
  });

  it('ignores comments and blank lines, and accepts tabs', async () => {
    await parse(`orgchart-beta
%% a comment
  A

\tB %% trailing
`);
    expect(labels(db.getRoot()!.children)).toEqual(['B']);
  });

  it('resets state between parses', async () => {
    await parse('orgchart-beta\n  A\n    B');
    await parse('orgchart-beta\n  X');
    expect(db.getNodes()).toHaveLength(1);
    expect(db.getRoot()!.label).toBe('X');
  });

  describe('invalid input', () => {
    it.each([
      ['a second root', 'orgchart-beta\n  A\n  B', /line 3.*exactly one root/],
      ['a node shallower than the root', 'orgchart-beta\n    A\n  B', /exactly one root/],
      ['a staff root', 'orgchart-beta\n  staff A', /root node cannot be a staff node/],
      ['children of a staff node', 'orgchart-beta\n  A\n    staff S\n      B', /staff node "S"/],
      ['duplicate ids', 'orgchart-beta\n  a[A]\n    a[B]', /duplicate node id "a"/],
      ['malformed explicit ids', 'orgchart-beta\n  ceo[CEO', /malformed explicit id/],
      ['an empty quoted label', 'orgchart-beta\n  ""', /non-empty label/],
      ['an empty chart', 'orgchart-beta', /exactly one root node/],
      ['a header-only chart with comments', 'orgchart-beta\n%% no nodes', /exactly one root node/],
    ])('rejects %s', async (_name, text, message) => {
      await expect(parse(text)).rejects.toThrow(message);
      expect(db.getRoot()).toBeUndefined();
    });

    it('rejects a bare staff keyword with a position', async () => {
      await expect(parse('orgchart-beta\n  A\n    staff')).rejects.toThrow(/line 3/);
    });

    it('reports the end-of-input position when there is no root node', async () => {
      await expect(parse('orgchart-beta')).rejects.toThrow(/line 1, column 14/);
    });

    it('rejects a missing header', async () => {
      await expect(parse('  A\n    B')).rejects.toThrow(/Error parsing orgchart/);
    });

    it('rejects an unterminated string with a position', async () => {
      await expect(parse('orgchart-beta\n  A "oops')).rejects.toThrow(/line 2/);
    });

    it('reports the source column for model validation failures', async () => {
      await expect(parse('orgchart-beta\n  A\n    staff S\n      B')).rejects.toThrow(
        /line 4, column 7/
      );
    });

    it('rejects a node CST without a label', async () => {
      const newline = orgchartLexer
        .tokenize('orgchart-beta\n  A')
        .tokens.find((token) => token.tokenType.name === 'Newline')!;
      const cst = {
        name: 'start',
        children: {
          nodeLine: [{ name: 'nodeLine', children: { Newline: [newline] } }],
        },
      } as CstNode;
      vi.spyOn(orgchartParser, 'start').mockReturnValue(cst);

      await expect(parser.parse('orgchart-beta\n  A')).rejects.toThrow('Malformed orgchart node');
    });

    it('rejects a node label CST without a token', async () => {
      const newline = orgchartLexer
        .tokenize('orgchart-beta\n  A')
        .tokens.find((token) => token.tokenType.name === 'Newline')!;
      const cst = {
        name: 'start',
        children: {
          nodeLine: [
            {
              name: 'nodeLine',
              children: { Newline: [newline], label: [{ name: 'label', children: {} }] },
            },
          ],
        },
      } as CstNode;
      vi.spyOn(orgchartParser, 'start').mockReturnValue(cst);

      await expect(parser.parse('orgchart-beta\n  A')).rejects.toThrow(
        'Malformed orgchart node label'
      );
    });

    it('defaults the parser error column when Chevrotain has no token location', async () => {
      db.setFrontmatterLineOffset(3);
      const tokenize = orgchartLexer.tokenize.bind(orgchartLexer);
      vi.spyOn(orgchartLexer, 'tokenize').mockImplementation((input) => {
        const result = tokenize(input);
        for (const token of result.tokens) {
          token.startColumn = -1;
        }
        return result;
      });

      await expect(parser.parse('  A\n    B')).rejects.toThrow(/at line 4, column 1/);
    });

    it('omits the source location when Chevrotain has no token line', async () => {
      const tokenize = orgchartLexer.tokenize.bind(orgchartLexer);
      vi.spyOn(orgchartLexer, 'tokenize').mockImplementation((input) => {
        const result = tokenize(input);
        for (const token of result.tokens) {
          token.startLine = -1;
        }
        return result;
      });

      await expect(parser.parse('  A\n    B')).rejects.toThrow(/^Error parsing orgchart diagram:/);
    });

    it('maps lexer errors to source lines before frontmatter is removed', async () => {
      db.setFrontmatterLineOffset(4);
      await expect(parse('orgchart-beta\n  CEO\n  "unterminated')).rejects.toThrow(
        /line 7, column 3/
      );
    });
  });
});
