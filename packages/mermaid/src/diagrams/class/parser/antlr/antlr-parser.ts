import type { ParseTreeListener } from 'antlr4ng';
import {
  BailErrorStrategy,
  CharStream,
  CommonTokenStream,
  ParseCancellationException,
  ParseTreeWalker,
  RecognitionException,
  type Token,
} from 'antlr4ng';
import {
  ClassParser,
  type ClassIdentifierContext,
  type ClassMembersContext,
  type ClassNameContext,
  type ClassNameSegmentContext,
  type ClassStatementContext,
  type NamespaceIdentifierContext,
  type RelationStatementContext,
  type NoteStatementContext,
  type AnnotationStatementContext,
  type MemberStatementContext,
  type ClassDefStatementContext,
  type StyleStatementContext,
  type CssClassStatementContext,
  type DirectionStatementContext,
  type AccTitleStatementContext,
  type AccDescrStatementContext,
  type AccDescrMultilineStatementContext,
  type CallbackStatementContext,
  type ClickStatementContext,
  type LinkStatementContext,
  type CallStatementContext,
  type CssClassRefContext,
  type StringLiteralContext,
} from './generated/ClassParser.js';
import { ClassParserListener } from './generated/ClassParserListener.js';
import { ClassLexer } from './generated/ClassLexer.js';

type ClassDbLike = Record<string, any>;

const stripQuotes = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed.replace(/\r?\n/g, '\\n')) as string;
    } catch {
      return trimmed.slice(1, -1).replace(/\\"/g, '"');
    }
  }
  return trimmed;
};

const stripBackticks = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('`') && trimmed.endsWith('`')) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

const splitCommaSeparated = (text: string): string[] =>
  text
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

const getStringFromLiteral = (ctx: StringLiteralContext | undefined | null): string | undefined => {
  if (!ctx) {
    return undefined;
  }
  return stripQuotes(ctx.getText());
};

const getClassNameText = (ctx: ClassNameContext): string => {
  const segments = ctx.classNameSegment();
  const parts: string[] = [];
  for (const segment of segments) {
    parts.push(getClassNameSegmentText(segment));
  }
  return parts.join('.');
};

const getClassNameSegmentText = (ctx: ClassNameSegmentContext): string => {
  if (ctx.BACKTICK_ID()) {
    return stripBackticks(ctx.BACKTICK_ID()!.getText());
  }
  if (ctx.EDGE_STATE()) {
    return ctx.EDGE_STATE()!.getText();
  }
  return ctx.getText();
};

const parseRelationArrow = (arrow: string, db: ClassDbLike) => {
  const relation = {
    type1: 'none',
    type2: 'none',
    lineType: db.lineType?.LINE ?? 0,
  };

  const trimmed = arrow.trim();
  if (trimmed.includes('..')) {
    relation.lineType = db.lineType?.DOTTED_LINE ?? relation.lineType;
  }

  const leftHeads: [string, keyof typeof db.relationType][] = [
    ['<|', 'EXTENSION'],
    ['()', 'LOLLIPOP'],
    ['o', 'AGGREGATION'],
    ['*', 'COMPOSITION'],
    ['<', 'DEPENDENCY'],
  ];

  for (const [prefix, key] of leftHeads) {
    if (trimmed.startsWith(prefix)) {
      relation.type1 = db.relationType?.[key] ?? relation.type1;
      break;
    }
  }

  const rightHeads: [string, keyof typeof db.relationType][] = [
    ['|>', 'EXTENSION'],
    ['()', 'LOLLIPOP'],
    ['o', 'AGGREGATION'],
    ['*', 'COMPOSITION'],
    ['>', 'DEPENDENCY'],
  ];

  for (const [suffix, key] of rightHeads) {
    if (trimmed.endsWith(suffix)) {
      relation.type2 = db.relationType?.[key] ?? relation.type2;
      break;
    }
  }

  return relation;
};

const parseStyleLine = (db: ClassDbLike, line: string) => {
  const trimmed = line.trim();
  const body = trimmed.slice('style'.length).trim();
  if (!body) {
    return;
  }
  const match = /^(\S+)(\s+.+)?$/.exec(body);
  if (!match) {
    return;
  }
  const classId = match[1];
  const styleBody = match[2]?.trim() ?? '';
  if (!styleBody) {
    return;
  }
  const styles = splitCommaSeparated(styleBody);
  if (styles.length) {
    db.setCssStyle?.(classId, styles);
  }
};

const parseClassDefLine = (db: ClassDbLike, line: string) => {
  const trimmed = line.trim();
  const body = trimmed.slice('classDef'.length).trim();
  if (!body) {
    return;
  }
  const match = /^(\S+)(\s+.+)?$/.exec(body);
  if (!match) {
    return;
  }
  const idPart = match[1];
  const stylePart = match[2]?.trim() ?? '';
  const ids = splitCommaSeparated(idPart);
  const styles = stylePart ? splitCommaSeparated(stylePart) : [];
  db.defineClass?.(ids, styles);
};

const parseCssClassLine = (db: ClassDbLike, line: string) => {
  const trimmed = line.trim();
  const body = trimmed.slice('cssClass'.length).trim();
  if (!body) {
    return;
  }
  const match = /^("[^"]*"|\S+)\s+(\S+)/.exec(body);
  if (!match) {
    return;
  }
  const idsRaw = stripQuotes(match[1]);
  const className = match[2];
  db.setCssClass?.(idsRaw, className);
};

const parseCallbackLine = (db: ClassDbLike, line: string) => {
  const trimmed = line.trim();
  const match = /^callback\s+(\S+)\s+("[^"]*")(?:\s+("[^"]*"))?\s*$/.exec(trimmed);
  if (!match) {
    return;
  }
  const target = match[1];
  const fn = stripQuotes(match[2]);
  const tooltip = match[3] ? stripQuotes(match[3]) : undefined;
  db.setClickEvent?.(target, fn);
  if (tooltip) {
    db.setTooltip?.(target, tooltip);
  }
};

const parseClickLine = (db: ClassDbLike, line: string) => {
  const trimmed = line.trim();
  const callMatch = /^click\s+(\S+)\s+call\s+([^(]+)\(([^)]*)\)(?:\s+("[^"]*"))?\s*$/.exec(trimmed);
  if (callMatch) {
    const target = callMatch[1];
    const fnName = callMatch[2].trim();
    const args = callMatch[3].trim();
    const tooltip = callMatch[4] ? stripQuotes(callMatch[4]) : undefined;
    if (args.length > 0) {
      db.setClickEvent?.(target, fnName, args);
    } else {
      db.setClickEvent?.(target, fnName);
    }
    if (tooltip) {
      db.setTooltip?.(target, tooltip);
    }
    return target;
  }

  const hrefMatch = /^click\s+(\S+)\s+href\s+("[^"]*")(?:\s+("[^"]*"))?(?:\s+(\S+))?\s*$/.exec(
    trimmed
  );
  if (hrefMatch) {
    const target = hrefMatch[1];
    const url = stripQuotes(hrefMatch[2]);
    const tooltip = hrefMatch[3] ? stripQuotes(hrefMatch[3]) : undefined;
    const targetWindow = hrefMatch[4];
    if (targetWindow) {
      db.setLink?.(target, url, targetWindow);
    } else {
      db.setLink?.(target, url);
    }
    if (tooltip) {
      db.setTooltip?.(target, tooltip);
    }
    return target;
  }

  const genericMatch = /^click\s+(\S+)\s+("[^"]*")(?:\s+("[^"]*"))?\s*$/.exec(trimmed);
  if (genericMatch) {
    const target = genericMatch[1];
    const link = stripQuotes(genericMatch[2]);
    const tooltip = genericMatch[3] ? stripQuotes(genericMatch[3]) : undefined;
    db.setLink?.(target, link);
    if (tooltip) {
      db.setTooltip?.(target, tooltip);
    }
    return target;
  }

  return undefined;
};

const parseLinkLine = (db: ClassDbLike, line: string) => {
  const trimmed = line.trim();
  const match = /^link\s+(\S+)\s+("[^"]*")(?:\s+("[^"]*"))?(?:\s+(\S+))?\s*$/.exec(trimmed);
  if (!match) {
    return;
  }
  const target = match[1];
  const href = stripQuotes(match[2]);
  const tooltip = match[3] ? stripQuotes(match[3]) : undefined;
  const targetWindow = match[4];

  if (targetWindow) {
    db.setLink?.(target, href, targetWindow);
  } else {
    db.setLink?.(target, href);
  }
  if (tooltip) {
    db.setTooltip?.(target, tooltip);
  }
};

const parseCallLine = (db: ClassDbLike, lastTarget: string | undefined, line: string) => {
  if (!lastTarget) {
    return;
  }
  const trimmed = line.trim();
  const match = /^call\s+([^(]+)\(([^)]*)\)\s*("[^"]*")?\s*$/.exec(trimmed);
  if (!match) {
    return;
  }
  const fnName = match[1].trim();
  const args = match[2].trim();
  const tooltip = match[3] ? stripQuotes(match[3]) : undefined;
  if (args.length > 0) {
    db.setClickEvent?.(lastTarget, fnName, args);
  } else {
    db.setClickEvent?.(lastTarget, fnName);
  }
  if (tooltip) {
    db.setTooltip?.(lastTarget, tooltip);
  }
};

interface NamespaceFrame {
  name?: string;
  classes: string[];
}

class ClassDiagramParseListener extends ClassParserListener implements ParseTreeListener {
  private readonly classNames = new WeakMap<ClassIdentifierContext, string>();
  private readonly memberLists = new WeakMap<ClassMembersContext, string[]>();
  private readonly namespaceStack: NamespaceFrame[] = [];
  private lastClickTarget?: string;

  constructor(private readonly db: ClassDbLike) {
    super();
  }

  private recordClassInCurrentNamespace(name: string) {
    const current = this.namespaceStack[this.namespaceStack.length - 1];
    if (current?.name) {
      current.classes.push(name);
    }
  }

  override enterNamespaceStatement = (): void => {
    this.namespaceStack.push({ classes: [] });
  };

  override exitNamespaceIdentifier = (ctx: NamespaceIdentifierContext): void => {
    const frame = this.namespaceStack[this.namespaceStack.length - 1];
    if (!frame) {
      return;
    }
    const classNameCtx = ctx.namespaceName()?.className();
    if (!classNameCtx) {
      return;
    }
    const name = getClassNameText(classNameCtx);
    frame.name = name;
    this.db.addNamespace?.(name);
  };

  override exitNamespaceStatement = (): void => {
    const frame = this.namespaceStack.pop();
    if (!frame?.name) {
      return;
    }
    if (frame.classes.length) {
      this.db.addClassesToNamespace?.(frame.name, frame.classes);
    }
  };

  override exitClassIdentifier = (ctx: ClassIdentifierContext): void => {
    const id = getClassNameText(ctx.className());
    this.classNames.set(ctx, id);
    this.db.addClass?.(id);
    this.recordClassInCurrentNamespace(id);

    const labelCtx = ctx.classLabel?.();
    if (labelCtx) {
      const label = getStringFromLiteral(labelCtx.stringLiteral());
      if (label !== undefined) {
        this.db.setClassLabel?.(id, label);
      }
    }
  };

  override exitClassMembers = (ctx: ClassMembersContext): void => {
    const members: string[] = [];
    for (const memberCtx of ctx.classMember() ?? []) {
      if (memberCtx.MEMBER()) {
        members.push(memberCtx.MEMBER()!.getText());
      } else if (memberCtx.EDGE_STATE()) {
        members.push(memberCtx.EDGE_STATE()!.getText());
      }
    }
    members.reverse();
    this.memberLists.set(ctx, members);
  };

  override exitClassStatement = (ctx: ClassStatementContext): void => {
    const identifierCtx = ctx.classIdentifier();
    if (!identifierCtx) {
      return;
    }
    const classId = this.classNames.get(identifierCtx);
    if (!classId) {
      return;
    }

    const tailCtx = ctx.classStatementTail?.();
    const cssRefCtx = tailCtx?.cssClassRef?.();
    if (cssRefCtx) {
      const cssTarget = this.resolveCssClassRef(cssRefCtx);
      if (cssTarget) {
        this.db.setCssClass?.(classId, cssTarget);
      }
    }

    const memberContexts: ClassMembersContext[] = [];
    const cm1 = tailCtx?.classMembers();
    if (cm1) {
      memberContexts.push(cm1);
    }
    const cssTailCtx = tailCtx?.classStatementCssTail?.();
    const cm2 = cssTailCtx?.classMembers();
    if (cm2) {
      memberContexts.push(cm2);
    }

    for (const membersCtx of memberContexts) {
      const members = this.memberLists.get(membersCtx) ?? [];
      if (members.length) {
        this.db.addMembers?.(classId, members);
      }
    }
  };

  private resolveCssClassRef(ctx: CssClassRefContext): string | undefined {
    if (ctx.className()) {
      return getClassNameText(ctx.className()!);
    }
    if (ctx.IDENTIFIER()) {
      return ctx.IDENTIFIER()!.getText();
    }
    return undefined;
  }

  override exitRelationStatement = (ctx: RelationStatementContext): void => {
    const classNames = ctx.className();
    if (classNames.length < 2) {
      return;
    }
    const id1 = getClassNameText(classNames[0]);
    const id2 = getClassNameText(classNames[classNames.length - 1]);

    const arrow = ctx.relation()?.getText() ?? '';
    const relation = parseRelationArrow(arrow, this.db);

    let relationTitle1 = 'none';
    let relationTitle2 = 'none';
    const stringLiterals = ctx.stringLiteral();
    if (stringLiterals.length === 1 && ctx.children) {
      const stringCtx = stringLiterals[0];
      const children = ctx.children as unknown[];
      const stringIndex = children.indexOf(stringCtx);
      const relationCtx = ctx.relation();
      const relationIndex = relationCtx ? children.indexOf(relationCtx) : -1;
      if (relationIndex >= 0 && stringIndex >= 0 && stringIndex < relationIndex) {
        relationTitle1 = getStringFromLiteral(stringCtx) ?? 'none';
      } else {
        relationTitle2 = getStringFromLiteral(stringCtx) ?? 'none';
      }
    } else if (stringLiterals.length >= 2) {
      relationTitle1 = getStringFromLiteral(stringLiterals[0]) ?? 'none';
      relationTitle2 = getStringFromLiteral(stringLiterals[1]) ?? 'none';
    }

    let title = 'none';
    const labelCtx = ctx.relationLabel?.();
    if (labelCtx?.LABEL()) {
      title = this.db.cleanupLabel?.(labelCtx.LABEL().getText()) ?? 'none';
    }

    this.db.addRelation?.({
      id1,
      id2,
      relation,
      relationTitle1,
      relationTitle2,
      title,
    });
  };

  override exitNoteStatement = (ctx: NoteStatementContext): void => {
    const noteCtx = ctx.noteBody();
    const literalText = noteCtx?.getText?.();
    const text = literalText !== undefined ? stripQuotes(literalText) : undefined;
    if (text === undefined) {
      return;
    }
    if (ctx.NOTE_FOR()) {
      const className = getClassNameText(ctx.className()!);
      this.db.addNote?.(text, className);
    } else {
      this.db.addNote?.(text);
    }
  };

  override exitAnnotationStatement = (ctx: AnnotationStatementContext): void => {
    const className = getClassNameText(ctx.className());
    const nameCtx = ctx.annotationName();
    let annotation: string | undefined;
    if (nameCtx.IDENTIFIER()) {
      annotation = nameCtx.IDENTIFIER()!.getText();
    } else {
      annotation = getStringFromLiteral(nameCtx.stringLiteral());
    }
    if (annotation !== undefined) {
      this.db.addAnnotation?.(className, annotation);
    }
  };

  override exitMemberStatement = (ctx: MemberStatementContext): void => {
    const className = getClassNameText(ctx.className());
    const labelToken = ctx.LABEL();
    if (!labelToken) {
      return;
    }
    const cleaned = this.db.cleanupLabel?.(labelToken.getText()) ?? labelToken.getText();
    this.db.addMember?.(className, cleaned);
  };

  override exitClassDefStatement = (ctx: ClassDefStatementContext): void => {
    const token = ctx.CLASSDEF_LINE()?.getSymbol()?.text;
    if (token) {
      parseClassDefLine(this.db, token);
    }
  };

  override exitStyleStatement = (ctx: StyleStatementContext): void => {
    const token = ctx.STYLE_LINE()?.getSymbol()?.text;
    if (token) {
      parseStyleLine(this.db, token);
    }
  };

  override exitCssClassStatement = (ctx: CssClassStatementContext): void => {
    const token = ctx.CSSCLASS_LINE()?.getSymbol()?.text;
    if (token) {
      parseCssClassLine(this.db, token);
    }
  };

  override exitDirectionStatement = (ctx: DirectionStatementContext): void => {
    if (ctx.DIRECTION_TB()) {
      this.db.setDirection?.('TB');
    } else if (ctx.DIRECTION_BT()) {
      this.db.setDirection?.('BT');
    } else if (ctx.DIRECTION_LR()) {
      this.db.setDirection?.('LR');
    } else if (ctx.DIRECTION_RL()) {
      this.db.setDirection?.('RL');
    }
  };

  override exitAccTitleStatement = (ctx: AccTitleStatementContext): void => {
    const value = ctx.ACC_TITLE_VALUE()?.getText();
    if (value !== undefined) {
      this.db.setAccTitle?.(value.trim());
    }
  };

  override exitAccDescrStatement = (ctx: AccDescrStatementContext): void => {
    const value = ctx.ACC_DESCR_VALUE()?.getText();
    if (value !== undefined) {
      this.db.setAccDescription?.(value.trim());
    }
  };

  override exitAccDescrMultilineStatement = (ctx: AccDescrMultilineStatementContext): void => {
    const value = ctx.ACC_DESCR_MULTILINE_VALUE()?.getText();
    if (value !== undefined) {
      this.db.setAccDescription?.(value.trim());
    }
  };

  override exitCallbackStatement = (ctx: CallbackStatementContext): void => {
    const token = ctx.CALLBACK_LINE()?.getSymbol()?.text;
    if (token) {
      parseCallbackLine(this.db, token);
    }
  };

  override exitClickStatement = (ctx: ClickStatementContext): void => {
    const token = ctx.CLICK_LINE()?.getSymbol()?.text;
    if (!token) {
      return;
    }
    const target = parseClickLine(this.db, token);
    if (target) {
      this.lastClickTarget = target;
    }
  };

  override exitLinkStatement = (ctx: LinkStatementContext): void => {
    const token = ctx.LINK_LINE()?.getSymbol()?.text;
    if (token) {
      parseLinkLine(this.db, token);
    }
  };

  override exitCallStatement = (ctx: CallStatementContext): void => {
    const token = ctx.CALL_LINE()?.getSymbol()?.text;
    if (token) {
      parseCallLine(this.db, this.lastClickTarget, token);
    }
  };
}

class ANTLRClassParser {
  yy: ClassDbLike | null = null;

  parse(input: string): unknown {
    if (!this.yy) {
      throw new Error('Class ANTLR parser missing yy (database).');
    }

    this.yy.clear?.();

    const inputStream = CharStream.fromString(input);
    const lexer = new ClassLexer(inputStream);
    const tokenStream = new CommonTokenStream(lexer);
    const parser = new ClassParser(tokenStream);

    const anyParser = parser as unknown as {
      getErrorHandler?: () => unknown;
      setErrorHandler?: (handler: unknown) => void;
      errorHandler?: unknown;
    };
    const currentHandler = anyParser.getErrorHandler?.() ?? anyParser.errorHandler;
    const handlerName = (currentHandler as { constructor?: { name?: string } } | undefined)
      ?.constructor?.name;
    if (!currentHandler || handlerName !== 'BailErrorStrategy') {
      if (typeof anyParser.setErrorHandler === 'function') {
        anyParser.setErrorHandler(new BailErrorStrategy());
      } else {
        (parser as unknown as { errorHandler: unknown }).errorHandler = new BailErrorStrategy();
      }
    }

    try {
      const tree = parser.start();
      const listener = new ClassDiagramParseListener(this.yy);
      ParseTreeWalker.DEFAULT.walk(listener, tree);
      return tree;
    } catch (error) {
      throw this.transformParseError(error, parser);
    }
  }

  private transformParseError(error: unknown, parser: ClassParser): Error {
    const recognitionError = this.unwrapRecognitionError(error);
    const offendingToken = this.resolveOffendingToken(recognitionError, parser);
    const line = offendingToken?.line ?? 0;
    const column = offendingToken?.column ?? 0;
    const message = `Parse error on line ${line}: Expecting 'STR'`;
    const cause = error instanceof Error ? error : undefined;
    const formatted = cause ? new Error(message, { cause }) : new Error(message);

    Object.assign(formatted, {
      hash: {
        line,
        loc: {
          first_line: line,
          last_line: line,
          first_column: column,
          last_column: column,
        },
        text: offendingToken?.text ?? '',
      },
    });

    return formatted;
  }

  private unwrapRecognitionError(error: unknown): RecognitionException | undefined {
    if (!error) {
      return undefined;
    }
    if (error instanceof RecognitionException) {
      return error;
    }
    if (error instanceof ParseCancellationException) {
      const cause = (error as { cause?: unknown }).cause;
      if (cause instanceof RecognitionException) {
        return cause;
      }
    }
    if (typeof error === 'object' && error !== null && 'cause' in error) {
      const cause = (error as { cause?: unknown }).cause;
      if (cause instanceof RecognitionException) {
        return cause;
      }
    }
    return undefined;
  }

  private resolveOffendingToken(
    error: RecognitionException | undefined,
    parser: ClassParser
  ): Token | undefined {
    const candidate = (error as { offendingToken?: Token })?.offendingToken;
    if (candidate) {
      return candidate;
    }

    const current = (
      parser as unknown as { getCurrentToken?: () => Token | undefined }
    ).getCurrentToken?.();
    if (current) {
      return current;
    }

    const stream = (
      parser as unknown as { _input?: { LT?: (offset: number) => Token | undefined } }
    )._input;
    return stream?.LT?.(1);
  }
}

const parserInstance = new ANTLRClassParser();

const exportedParser = {
  parse: (text: string) => parserInstance.parse(text),
  parser: parserInstance,
  yy: null as ClassDbLike | null,
};

Object.defineProperty(exportedParser, 'yy', {
  get() {
    return parserInstance.yy;
  },
  set(value: ClassDbLike | null) {
    parserInstance.yy = value;
  },
});

export default exportedParser;
