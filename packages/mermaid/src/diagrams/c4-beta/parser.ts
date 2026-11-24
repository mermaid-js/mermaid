import type { C4, C4Element, C4Relationship } from '@mermaid-js/parser';
import { parse } from '@mermaid-js/parser';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import { C4BetaDB } from './db.js';
import type { C4Arrow } from './types.js';

const DIAGRAM_KINDS = ['context', 'container', 'component', 'dynamic', 'deployment'];

/** The words after `c4-beta` on its own line; the first one must be a diagram kind. */
const HEADER_WORD = /^\s*c4-beta[\t ]+(\S+)/;

/** Throws when the header line names something that is not a diagram kind. */
const checkHeader = (input: string) => {
  const word = HEADER_WORD.exec(input)?.[1];
  if (word !== undefined && !DIAGRAM_KINDS.includes(word)) {
    throw new Error(
      `c4-beta: unknown diagram kind "${word}"; use ${DIAGRAM_KINDS.map((kind) => `"${kind}"`).join(', ')}. Elements and relations go on the lines after the header.`
    );
  }
};

/** The 1-based line of a statement in the diagram text. */
const lineOf = (node: { $cstNode?: { range: { start: { line: number } } } }): number =>
  (node.$cstNode?.range.start.line ?? 0) + 1;

/**
 * Adds the element and its children to the db. An id that is already declared is an error
 * naming both lines, and the element is left out; its children join the element that has the id.
 */
const addElement = (
  db: C4BetaDB,
  element: C4Element,
  declared: Map<string, number>,
  errors: string[],
  parentId?: string
) => {
  const first = declared.get(element.id);
  if (first) {
    errors.push(
      `c4-beta: the id "${element.id}" is declared twice, at line ${first} and at line ${lineOf(element)}. Every element needs its own id.`
    );
  } else {
    declared.set(element.id, lineOf(element));
    db.addElement({
      id: element.id,
      kind: element.kind,
      name: element.name,
      description: element.description,
      technology: element.technology,
      instances: element.instances,
      tags: [...element.tags],
      parentId,
    });
  }
  for (const child of element.children) {
    addElement(db, child, declared, errors, element.id);
  }
};

/** The arrow a relationship is stored with: `<--` turns into `-->`, the others stay as written. */
const storedArrow = (arrow: string): C4Arrow =>
  arrow === '<-->' || arrow === '---' ? arrow : '-->';

/** Adds the relationship. `a <-- b` is stored as `b --> a`, so ranks follow the meaning. */
const addRelationship = (db: C4BetaDB, relationship: C4Relationship) => {
  const reversed = relationship.arrow === '<--';
  db.addRelationship({
    sourceId: reversed ? relationship.targetId : relationship.sourceId,
    targetId: reversed ? relationship.sourceId : relationship.targetId,
    arrow: storedArrow(relationship.arrow),
    description: relationship.description,
    technology: relationship.technology,
    step: relationship.step,
    tags: [...relationship.tags],
  });
};

/** One message for each end of the relationship that is no element. */
const unknownEnds = (relationship: C4Relationship, declared: Map<string, number>): string[] =>
  [relationship.sourceId, relationship.targetId]
    .filter((id) => !declared.has(id))
    .map(
      (id) =>
        `c4-beta: the relationship "${relationship.sourceId} ${relationship.arrow} ${relationship.targetId}" at line ${lineOf(relationship)} names "${id}", which is no element. Declare it with a statement such as person ${id} "Name".`
    );

export const populateDb = (ast: C4, db: C4BetaDB) => {
  populateCommonDb(ast, db);
  if (ast.kind) {
    db.setKind(ast.kind);
  }
  if (ast.direction) {
    db.setDirection(ast.direction);
  }
  if (ast.legend) {
    db.setLegendEnabled(ast.legend === 'on');
  }
  const declared = new Map<string, number>();
  const errors: string[] = [];
  for (const element of ast.elements) {
    addElement(db, element, declared, errors);
  }
  for (const style of ast.styles) {
    db.addStyle(
      style.tag,
      style.entries.map(({ key, value }) => ({ key, value }))
    );
  }
  for (const relationship of ast.relationships) {
    errors.push(...unknownEnds(relationship, declared));
    addRelationship(db, relationship);
  }
  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
};

/** Parses the diagram text into the db: the header, the grammar, then the checks across lines. */
export const parseC4Beta = async (input: string, db: C4BetaDB): Promise<void> => {
  checkHeader(input);
  const ast: C4 = await parse('c4', input);
  log.debug(ast);
  populateDb(ast, db);
};

export const parser: ParserDefinition = {
  parser: {
    // @ts-expect-error - C4BetaDB is not assignable to DiagramDB
    yy: undefined,
  },
  parse: async (input: string): Promise<void> => {
    const db = parser.parser?.yy;
    if (!(db instanceof C4BetaDB)) {
      throw new Error(
        'parser.parser?.yy was not a C4BetaDB. This is due to a bug within Mermaid, please report this issue at https://github.com/mermaid-js/mermaid/issues.'
      );
    }
    await parseC4Beta(input, db);
  },
};
