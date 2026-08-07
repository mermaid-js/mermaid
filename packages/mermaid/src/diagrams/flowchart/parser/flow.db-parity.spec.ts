import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
// @ts-ignore JISON doesn't support types
import flowJisonParser from './flow.jison';
import { FlowDB } from '../flowDb.js';
import { cleanupComments } from '../../../diagram-api/comments.js';
import { parseFlowchartChevrotain } from './flow.chevrotain.js';

/**
 * DB-parity gate. The legacy jison parser is the oracle: for every harvested diagram string we parse
 * with both engines into separate `FlowDB` instances and assert the observable DB state is identical.
 * This is the visitor's real test — far stronger than "parser accepts" because it checks the produced
 * data, not just acceptance. (`@{ }` shape data + `%%` comments are deferred / pre-stripped.)
 */

function snapshotVertex(v: any) {
  return {
    id: v.id,
    text: v.text,
    type: v.type,
    labelType: v.labelType,
    styles: v.styles,
    classes: v.classes,
    link: v.link,
    linkTarget: v.linkTarget,
    props: v.props,
    dir: v.dir,
  };
}

function snapshotEdge(e: any) {
  return {
    start: e.start,
    end: e.end,
    type: e.type,
    stroke: e.stroke,
    length: e.length,
    text: e.text,
    labelType: e.labelType,
    id: e.id,
    classes: e.classes,
    style: e.style,
    interpolate: e.interpolate,
  };
}

function snapshot(db: FlowDB) {
  const vertices = [...db.getVertices().values()]
    .map(snapshotVertex)
    .sort((a, b) => a.id.localeCompare(b.id));
  const edges = db.getEdges().map(snapshotEdge);
  const classes = [...(db.getClasses() as Map<string, any>).values()].map((c) => ({
    id: c.id,
    styles: c.styles,
    textStyles: c.textStyles,
  }));
  const subGraphs = db.getSubGraphs().map((s: any) => ({
    id: s.id,
    title: s.title,
    nodes: [...s.nodes].sort(),
    dir: s.dir,
    classes: s.classes,
  }));
  const tooltips = vertices
    .map((v) => [v.id, db.getTooltip(v.id)] as const)
    .filter(([, tip]) => tip !== undefined);
  return { direction: db.getDirection(), vertices, edges, classes, subGraphs, tooltips };
}

function jisonSnapshot(input: string) {
  const db = new FlowDB();
  const p = flowJisonParser.parser ?? flowJisonParser;
  p.yy = db;
  p.yy.clear?.();
  p.parse(input.replace(/}\s*\n/g, '}\n'));
  return snapshot(db);
}

function chevrotainSnapshot(input: string) {
  const db = new FlowDB();
  db.clear?.();
  parseFlowchartChevrotain(input, db);
  return snapshot(db);
}

function harvest(): string[] {
  const dir = dirname(fileURLToPath(import.meta.url));
  const found = new Set<string>();
  const re = /\.parse\(\s*(['`])((?:\\.|(?!\1)[\S\s])*?)\1\s*\)/g;
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.spec.js'))) {
    const src = readFileSync(join(dir, file), 'utf8');
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) {
      const quote = m[1];
      const raw = m[2]
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\r/g, '\r')
        .replace(/\\`/g, '`')
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, '\\');
      if (quote === '`' && raw.includes('${')) {
        continue;
      }
      if (raw.includes('%%')) {
        continue;
      }
      found.add(raw);
    }
  }
  return [...found];
}

const CORPUS = harvest().filter((input) => {
  try {
    jisonSnapshot(input);
    return true;
  } catch {
    return false;
  }
});

describe('flowchart db parity (Chevrotain vs jison)', () => {
  it('has a substantial corpus', () => {
    expect(CORPUS.length).toBeGreaterThan(80);
  });

  it.each(CORPUS)('db matches jison for: %j', (input) => {
    expect(chevrotainSnapshot(input)).toEqual(jisonSnapshot(input));
  });
});

// The curated `.mmd` visual-parity corpus (also rendered manually under both engines). Multi-feature
// diagrams — a stronger parity check than the single-feature harvested inputs. Comments are stripped
// here because the production pipeline strips them before the parser ever runs.
const FIXTURE_DIR = 'cypress/platform/dev-diagrams/parser-update/flowchart';
const FIXTURES = readdirSync(FIXTURE_DIR).filter((file) => file.endsWith('.mmd'));

describe('flowchart db parity over the .mmd fixture corpus', () => {
  it.each(FIXTURES)('fixture %s fills db identically on both engines', (file) => {
    const source = cleanupComments(readFileSync(join(FIXTURE_DIR, file), 'utf8'));
    expect(chevrotainSnapshot(source)).toEqual(jisonSnapshot(source));
  });
});
