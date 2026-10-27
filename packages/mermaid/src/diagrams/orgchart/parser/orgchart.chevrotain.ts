import type { CstNode, IToken } from 'chevrotain';
import { AccDescrBlock, AccDescrLine, AccTitleLine, TitleLine } from './orgchart.tokens.js';
import type { ParserDefinition } from '../../../diagram-api/types.js';
import { isKnownLocation, runChevrotainParse } from '../../common/parser/runChevrotainParse.js';
import { db } from '../orgchartDb.js';
import type { OrgChartDB } from '../orgchartTypes.js';
import { orgchartLexer, orgchartParser } from './orgchart.parser.js';

const TAB_WIDTH = 4;

const unquote = (image: string): string => image.slice(1, -1);

const isToken = (child: CstNode | IToken): child is IToken => 'tokenTypeIdx' in child;

const tokensOf = (node: CstNode, name: string): IToken[] =>
  (node.children[name] ?? []).filter(isToken);

const subruleOf = (node: CstNode, name: string): CstNode | undefined =>
  (node.children[name] ?? []).find((child): child is CstNode => !isToken(child));

const indentOf = (newline: IToken): number => {
  const afterLastBreak = newline.image.slice(newline.image.lastIndexOf('\n') + 1);
  return [...afterLastBreak].reduce((width, ch) => width + (ch === '\t' ? TAB_WIDTH : 1), 0);
};

const visitNodeLine = (db: OrgChartDB, nodeLine: CstNode): void => {
  const [newline] = tokensOf(nodeLine, 'Newline');
  const [title] = tokensOf(nodeLine, TitleLine.name);
  const [accTitle] = tokensOf(nodeLine, AccTitleLine.name);
  const [accDescrLine] = tokensOf(nodeLine, AccDescrLine.name);
  const [accDescrBlock] = tokensOf(nodeLine, AccDescrBlock.name);
  if (title) {
    db.setDiagramTitle(title.image.replace(/^title[\t ]+/, ''));
    return;
  }
  if (accTitle) {
    db.setAccTitle(accTitle.image.replace(/^accTitle[\t ]*:[\t ]*/, ''));
    return;
  }
  if (accDescrLine) {
    db.setAccDescription(accDescrLine.image.replace(/^accDescr[\t ]*:[\t ]*/, ''));
    return;
  }
  if (accDescrBlock) {
    db.setAccDescription(
      accDescrBlock.image
        .replace(/^accDescr[\t ]*{/, '')
        .slice(0, -1)
        .trim()
    );
    return;
  }

  const label = subruleOf(nodeLine, 'label');
  if (!newline || !label) {
    throw new Error('Malformed orgchart node');
  }
  const [secondary] = tokensOf(nodeLine, 'secondary');
  const first =
    tokensOf(nodeLine, 'Staff')[0] ?? Object.values(label.children).flat().find(isToken);
  if (!first) {
    throw new Error('Malformed orgchart node label');
  }

  let id: string | undefined;
  let text: string;
  const [quoted] = tokensOf(label, 'QuotedString');
  const [idWithLabel] = tokensOf(label, 'IdWithLabel');
  const words = tokensOf(label, 'Word');
  if (quoted) {
    text = unquote(quoted.image);
  } else if (idWithLabel) {
    const bracket = idWithLabel.image.indexOf('[');
    id = idWithLabel.image.slice(0, bracket);
    text = idWithLabel.image.slice(bracket + 1, -1);
  } else {
    if (words.some((word) => word.image.includes('[') || word.image.includes(']'))) {
      throw new Error(
        `Invalid orgchart at line ${(first.startLine ?? 1) + db.getFrontmatterLineOffset()}, column ${first.startColumn ?? 1}: malformed explicit id; expected id[Label]`
      );
    }
    text = words.map((word) => word.image).join(' ');
  }

  db.addNode({
    indent: indentOf(newline),
    line: (first.startLine ?? 1) + db.getFrontmatterLineOffset(),
    column: first.startColumn ?? 1,
    kind: tokensOf(nodeLine, 'Staff').length > 0 ? 'staff' : 'regular',
    label: text,
    secondaryLabel: secondary ? unquote(secondary.image) : undefined,
    id,
  });
};

const visit = (db: OrgChartDB, cst: CstNode): void => {
  for (const child of cst.children.nodeLine ?? []) {
    if (!isToken(child)) {
      visitNodeLine(db, child);
    }
  }
};

export const createOrgChartParser = (db: OrgChartDB): ParserDefinition => {
  return {
    // eslint-disable-next-line @typescript-eslint/require-await -- normalizes synchronous parser errors into rejected promises
    parse: async (input: string): Promise<void> => {
      const diagramTitle = db.getDiagramTitle();
      const frontmatterLineOffset = db.getFrontmatterLineOffset();
      db.clear();
      if (diagramTitle) {
        db.setDiagramTitle(diagramTitle);
      }
      db.setFrontmatterLineOffset(frontmatterLineOffset);
      orgchartParser.input = [];
      try {
        runChevrotainParse(
          {
            diagramType: 'orgchart',
            lineOffset: frontmatterLineOffset,
            lexer: orgchartLexer,
            parser: orgchartParser,
            entry: () => orgchartParser.start(),
            visit: (cst) => visit(db, cst),
          },
          input
        );
        if (!db.getRoot()) {
          const lines = input.trimEnd().split(/\r\n|\n|\r/);
          throw new Error(
            `Invalid orgchart at line ${lines.length + frontmatterLineOffset}, column ${lines.at(-1)!.length + 1}: an orgchart must contain exactly one root node`
          );
        }
      } catch (error) {
        db.clear();
        const parseError = orgchartParser.errors[0];
        if (parseError) {
          const { token } = parseError;
          const line = isKnownLocation(token.startLine)
            ? token.startLine + frontmatterLineOffset
            : undefined;
          const column = isKnownLocation(token.startColumn) ? token.startColumn : undefined;
          const message = error instanceof Error ? error.message : String(error);
          throw new Error(
            line === undefined ? message : `${message} at line ${line}, column ${column ?? 1}`
          );
        }
        throw error;
      }
    },
  };
};

export const parser = createOrgChartParser(db);
