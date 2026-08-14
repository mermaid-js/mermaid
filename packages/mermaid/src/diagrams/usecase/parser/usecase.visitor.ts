// cspell:ignore markerless

import type { CstNode, IToken } from 'chevrotain';
import { db } from '../usecaseDb.js';
import { ARROW_TYPE } from '../usecaseTypes.js';
import type {
  ArrowType,
  Direction,
  GraphStatement,
  LabelType,
  NodeOccurrence,
  RelationshipType,
  Span,
  UseCaseShape,
} from '../usecaseTypes.js';
import { parseOrderedJsonObject } from './usecaseJson.js';
import {
  UsecaseModelBuilder,
  type DraftBoundary,
  type DraftElement,
  type DraftEndpoint,
  type DraftJson,
  type DraftLabel,
  type DraftLocation,
  type DraftMetadata,
  type DraftMetadataProperty,
  type DraftRelationship,
} from './usecaseModelBuilder.js';
import { usecaseParser } from './usecase.parser.js';

type Ctx = Record<string, (CstNode | IToken)[]>;
interface ParsedStereotype {
  value: string;
  span: Span;
}
interface ParsedClassSuffix {
  classes: string[];
  spans: Span[];
}
interface ParsedActorItem {
  id: string;
  label: DraftLabel;
  location: DraftLocation;
  generated: boolean;
  metadata?: DraftMetadata;
  stereotype?: ParsedStereotype;
  classes: string[];
  classSpans: Span[];
}
interface ParsedEntity extends ParsedActorItem {
  shape?: UseCaseShape;
  explicitDeclaration: boolean;
}
interface ParsedArrow {
  type: RelationshipType;
  arrowType: ArrowType;
  label?: DraftLabel;
  minlen: number;
}
interface ParsedRelationTail {
  explicitId?: string;
  explicitIdLocation?: DraftLocation;
  arrow: ParsedArrow;
  target: ParsedEntity;
}
const BaseVisitor = usecaseParser.getBaseCstVisitorConstructor();

class UsecaseVisitor extends BaseVisitor {
  private readonly builder = new UsecaseModelBuilder(db);
  private source = '';
  private parentBoundary: { id: string; location: DraftLocation } | undefined;
  private anonymousEdge = 0;
  private anonymousNote = 0;
  constructor() {
    super();
    this.validateVisitor();
  }
  build(cst: CstNode, source: string): void {
    this.source = source;
    this.parentBoundary = undefined;
    this.anonymousEdge = 0;
    this.anonymousNote = 0;
    this.builder.reset(source);
    this.visit(cst);
  }
  start(ctx: Ctx): void {
    const header = this.tokens(ctx, 'USECASE')[0];
    const statements: GraphStatement[] = [];
    for (const line of this.nodes(ctx, 'line')) {
      statements.push(this.visit(line) as GraphStatement);
    }
    this.builder.setStatements(statements);
    this.builder.finalize(this.tokenSpan(header));
  }
  line(ctx: Ctx): GraphStatement {
    const child = this.firstNode(ctx, 'blankLine', 'commentLine', 'statement');
    return this.wrap(child, this.visit(child) as GraphStatement);
  }
  statement(ctx: Ctx): GraphStatement {
    return this.visit(
      this.firstNode(
        ctx,
        'accTitleStatement',
        'accDescrStatement',
        'directionStatement',
        'actorStatement',
        'systemBoundaryStatement',
        'noteStatement',
        'jsonStatement',
        'classDefStatement',
        'classStatement',
        'styleStatement',
        'metadataAssignmentStatement',
        'entityStatement'
      )
    ) as GraphStatement;
  }
  lineEnd(_ctx: Ctx): undefined {
    return undefined;
  }
  blankLine(ctx: Ctx): GraphStatement {
    return { kind: 'blank', span: this.tokenSpan(this.tokens(ctx, 'NEWLINE')[0]) };
  }
  commentLine(ctx: Ctx): GraphStatement {
    return { kind: 'comment', span: this.tokenSpan(this.tokens(ctx, 'COMMENT')[0]) };
  }
  accTitleStatement(ctx: Ctx): GraphStatement {
    const image = this.tokens(ctx, 'ACC_TITLE_LINE')[0].image;
    this.builder.setAccTitle(image.slice(image.indexOf(':') + 1).trim());
    return { kind: 'accTitle', span: [0, 0] };
  }
  accDescrStatement(ctx: Ctx): GraphStatement {
    const line = this.tokens(ctx, 'ACC_DESCR_LINE')[0];
    const block = this.tokens(ctx, 'ACC_DESCR_BLOCK')[0];
    const description = line
      ? line.image.slice(line.image.indexOf(':') + 1).trim()
      : block.image.slice(block.image.indexOf('{') + 1, block.image.lastIndexOf('}')).trim();
    this.builder.setAccDescription(description);
    return { kind: 'accDescr', span: [0, 0] };
  }

  actorStatement(ctx: Ctx): GraphStatement {
    const nodes = this.nodes(ctx, 'actorItem');
    const items = nodes.map((node) => this.visit(node) as ParsedActorItem);
    const relationNode = this.nodes(ctx, 'relationTail')[0];
    const occurrences = items.map((item, index) => this.actorOccurrence(nodes[index], item, true));
    for (const item of items) {
      this.builder.addElement(this.actorDraft(item));
    }
    if (!relationNode) {
      return { kind: 'node', span: [0, 0], nodes: occurrences };
    }
    const relation = this.visit(relationNode) as ParsedRelationTail;
    if (relation.target.explicitDeclaration) {
      this.builder.addElement(this.entityDraft(relation.target));
    }
    const draft = this.relationshipDraft(items[0], relation, this.nodeLocation(relationNode));
    this.builder.addRelationship(draft);
    const id = draft.explicitId ?? `edge-${this.anonymousEdge++}`;
    occurrences.push(
      this.entityOccurrence(
        this.nodes(relationNode.children as Ctx, 'entityName')[0],
        relation.target,
        relation.target.explicitDeclaration
      )
    );
    return {
      kind: 'edge',
      span: [0, 0],
      nodes: occurrences,
      edges: [
        {
          id,
          span: [0, 0],
          ...(draft.explicitIdLocation ? { idSpan: draft.explicitIdLocation.span } : {}),
          ...(draft.label ? { labelSpan: draft.label.span } : {}),
        },
      ],
    };
  }
  actorItem(ctx: Ctx): ParsedActorItem {
    const base = this.visit(this.nodes(ctx, 'actorName')[0]) as ParsedActorItem;
    const metadataNode = this.nodes(ctx, 'metadata')[0];
    const stereotypeNode = this.nodes(ctx, 'stereotype')[0];
    const classNode = this.nodes(ctx, 'classSuffix')[0];
    const classes = classNode
      ? (this.visit(classNode) as ParsedClassSuffix)
      : { classes: [], spans: [] };
    return {
      ...base,
      ...(metadataNode ? { metadata: this.visit(metadataNode) as DraftMetadata } : {}),
      ...(stereotypeNode ? { stereotype: this.visit(stereotypeNode) as ParsedStereotype } : {}),
      classes: classes.classes,
      classSpans: classes.spans,
    };
  }
  actorName(ctx: Ctx): ParsedActorItem {
    const identifier = this.tokens(ctx, 'IDENTIFIER')[0];
    const string = this.tokens(ctx, 'PLAIN_STRING')[0] ?? this.tokens(ctx, 'MARKDOWN_STRING')[0];
    if (identifier) {
      const labelNode = this.nodes(ctx, 'nodeLabel')[0];
      const label = labelNode ? (this.visit(labelNode) as DraftLabel) : this.tokenLabel(identifier);
      return {
        id: identifier.image,
        label,
        location: this.tokenLocation(identifier),
        generated: false,
        classes: [],
        classSpans: [],
      };
    }
    const label = this.tokenLabel(string);
    return {
      id: this.generateId(label.text),
      label,
      location: this.tokenLocation(string),
      generated: true,
      classes: [],
      classSpans: [],
    };
  }
  actorDeclarationOnly(ctx: Ctx): GraphStatement {
    const nodes = this.nodes(ctx, 'actorItem');
    const items = nodes.map((node) => this.visit(node) as ParsedActorItem);
    for (const item of items) {
      this.builder.addElement(this.actorDraft(item));
    }
    return {
      kind: 'node',
      span: [0, 0],
      nodes: items.map((item, index) => this.actorOccurrence(nodes[index], item, true)),
    };
  }

  entityStatement(ctx: Ctx): GraphStatement {
    const entityNodes = this.nodes(ctx, 'entityName');
    const source = this.visit(entityNodes[0]) as ParsedEntity;
    const relationNode = this.nodes(ctx, 'relationTail')[0];
    if (!relationNode) {
      source.explicitDeclaration = true;
      source.shape ??= 'ellipse';
      this.builder.addElement(this.entityDraft(source));
      return {
        kind: 'node',
        span: [0, 0],
        nodes: [this.entityOccurrence(entityNodes[0], source, true)],
      };
    }
    if (source.explicitDeclaration) {
      this.builder.addElement(this.entityDraft(source));
    }
    const relation = this.visit(relationNode) as ParsedRelationTail;
    if (relation.target.explicitDeclaration) {
      this.builder.addElement(this.entityDraft(relation.target));
    }
    const draft: DraftRelationship = {
      source: this.endpoint(source),
      target: this.endpoint(relation.target),
      location: this.nodeLocation(relationNode),
      ...(relation.explicitId
        ? { explicitId: relation.explicitId, explicitIdLocation: relation.explicitIdLocation }
        : {}),
      ...relation.arrow,
    };
    this.builder.addRelationship(draft);
    const id = draft.explicitId ?? `edge-${this.anonymousEdge++}`;
    return {
      kind: 'edge',
      span: [0, 0],
      nodes: [
        this.entityOccurrence(entityNodes[0], source, source.explicitDeclaration),
        this.entityOccurrence(
          this.nodes(relationNode.children as Ctx, 'entityName')[0],
          relation.target,
          relation.target.explicitDeclaration
        ),
      ],
      edges: [
        {
          id,
          span: [0, 0],
          ...(draft.explicitIdLocation ? { idSpan: draft.explicitIdLocation.span } : {}),
          ...(draft.label ? { labelSpan: draft.label.span } : {}),
        },
      ],
    };
  }
  entityName(ctx: Ctx): ParsedEntity {
    const identifier = this.tokens(ctx, 'IDENTIFIER')[0];
    const string = this.tokens(ctx, 'PLAIN_STRING')[0] ?? this.tokens(ctx, 'MARKDOWN_STRING')[0];
    const labelNode = this.nodes(ctx, 'nodeLabel')[0];
    const metadataNode = this.nodes(ctx, 'useCaseMetadata')[0];
    const stereotypeNode = this.nodes(ctx, 'stereotype')[0];
    const classNode = this.nodes(ctx, 'classSuffix')[0];
    const classes = classNode
      ? (this.visit(classNode) as ParsedClassSuffix)
      : { classes: [], spans: [] };
    if (identifier) {
      const label = labelNode ? (this.visit(labelNode) as DraftLabel) : this.tokenLabel(identifier);
      const shape = labelNode
        ? this.tokens(ctx, 'LBRACKET').length
          ? 'rect'
          : 'ellipse'
        : undefined;
      return {
        id: identifier.image,
        label,
        location: this.tokenLocation(identifier),
        generated: false,
        ...(shape ? { shape } : {}),
        ...(metadataNode ? { metadata: this.visit(metadataNode) as DraftMetadata } : {}),
        ...(stereotypeNode ? { stereotype: this.visit(stereotypeNode) as ParsedStereotype } : {}),
        classes: classes.classes,
        classSpans: classes.spans,
        explicitDeclaration: Boolean(shape || metadataNode || stereotypeNode),
      };
    }
    const label = this.tokenLabel(string);
    return {
      id: this.generateId(label.text),
      label,
      location: this.tokenLocation(string),
      generated: true,
      ...(metadataNode ? { metadata: this.visit(metadataNode) as DraftMetadata } : {}),
      ...(stereotypeNode ? { stereotype: this.visit(stereotypeNode) as ParsedStereotype } : {}),
      classes: classes.classes,
      classSpans: classes.spans,
      explicitDeclaration: Boolean(metadataNode || stereotypeNode),
    };
  }
  nodeLabel(ctx: Ctx): DraftLabel {
    const tokens = this.allTokens(ctx);
    if (
      tokens.length === 1 &&
      (tokens[0].tokenType.name === 'PLAIN_STRING' ||
        tokens[0].tokenType.name === 'MARKDOWN_STRING')
    ) {
      return this.tokenLabel(tokens[0]);
    }
    const span: Span = [
      tokens[0].startOffset,
      (tokens.at(-1)!.endOffset ?? tokens.at(-1)!.startOffset) + 1,
    ];
    return { text: this.source.slice(span[0], span[1]), type: 'text', span };
  }
  useCaseMetadata(ctx: Ctx): DraftMetadata {
    return this.visit(this.nodes(ctx, 'metadata')[0]) as DraftMetadata;
  }
  relationTail(ctx: Ctx): ParsedRelationTail {
    const explicitId = this.tokens(ctx, 'IDENTIFIER')[0];
    return {
      ...(explicitId
        ? { explicitId: explicitId.image, explicitIdLocation: this.tokenLocation(explicitId) }
        : {}),
      arrow: this.visit(this.nodes(ctx, 'arrow')[0]) as ParsedArrow,
      target: this.visit(this.nodes(ctx, 'entityName')[0]) as ParsedEntity,
    };
  }
  arrow(ctx: Ctx): ParsedArrow {
    return this.visit(
      this.firstNode(
        ctx,
        'semanticRelation',
        'forwardSolidOperator',
        'backwardSolidOperator',
        'markerlessSolidOperator',
        'forwardCircleOperator',
        'backwardCircleOperator',
        'forwardCrossOperator',
        'backwardCrossOperator'
      )
    ) as ParsedArrow;
  }
  edgeLabel(ctx: Ctx): DraftLabel {
    return this.nodeLabel(ctx);
  }
  semanticRelation(ctx: Ctx): ParsedArrow {
    if (this.tokens(ctx, 'GENERALIZATION').length) {
      return { type: 'generalization', arrowType: ARROW_TYPE.SOLID_ARROW, minlen: 1 };
    }
    const type: RelationshipType = this.tokens(ctx, 'INCLUDE').length ? 'include' : 'extend';
    const token = this.tokens(ctx, type === 'include' ? 'INCLUDE' : 'EXTEND')[0];
    return {
      type,
      arrowType: ARROW_TYPE.SOLID_ARROW,
      label: { text: type, type: 'text', span: this.tokenSpan(token) },
      minlen: 1,
    };
  }

  metadata(ctx: Ctx): DraftMetadata {
    return {
      properties: this.nodes(ctx, 'metadataProperty').map(
        (node) => this.visit(node) as DraftMetadataProperty
      ),
      location: this.ctxLocation(ctx),
    };
  }
  metadataProperty(ctx: Ctx): DraftMetadataProperty {
    const tokens = this.allTokens(ctx).filter((token) => token.tokenType.name !== 'COLON');
    const keyToken = tokens[0];
    const valueToken = tokens[1];
    const value =
      valueToken.tokenType.name === 'TRUE'
        ? true
        : valueToken.tokenType.name === 'FALSE'
          ? false
          : this.decodePlain(valueToken);
    const span: Span = [keyToken.startOffset, (valueToken.endOffset ?? valueToken.startOffset) + 1];
    return {
      key: this.decodePlain(keyToken),
      value,
      span,
      keySpan: this.contentSpan(keyToken),
      valueSpan: this.contentSpan(valueToken),
      location: this.tokenLocation(keyToken),
    };
  }
  metadataSeparator(_ctx: Ctx): undefined {
    return undefined;
  }

  systemBoundaryStatement(ctx: Ctx): GraphStatement {
    const boundary = this.visit(this.nodes(ctx, 'systemBoundaryName')[0]) as DraftBoundary;
    const classNode = this.nodes(ctx, 'classSuffix')[0];
    const classes = classNode
      ? (this.visit(classNode) as ParsedClassSuffix)
      : { classes: [], spans: [] };
    boundary.classes = classes.classes;
    this.builder.addBoundary(boundary);
    const previous = this.parentBoundary;
    this.parentBoundary = { id: boundary.id, location: boundary.location };
    const contentNode = this.nodes(ctx, 'systemBoundaryContent')[0];
    const children = contentNode ? (this.visit(contentNode) as GraphStatement[]) : [];
    this.parentBoundary = previous;
    const end = this.tokens(ctx, 'END')[0];
    return {
      kind: 'group',
      span: [0, 0],
      group: boundary.id,
      idSpan: boundary.location.span,
      titleSpan: boundary.label.span,
      endSpan: this.tokenSpan(end),
      classSpans: classes.spans,
      ...(children.length ? { children } : {}),
    };
  }
  systemBoundaryName(ctx: Ctx): DraftBoundary {
    const token = this.allTokens(ctx)[0];
    const label = this.tokenLabel(token);
    return {
      id: token.tokenType.name === 'IDENTIFIER' ? token.image : this.generateId(label.text),
      label,
      location: this.tokenLocation(token),
      generated: token.tokenType.name !== 'IDENTIFIER',
      classes: [],
    };
  }
  systemBoundaryContent(ctx: Ctx): GraphStatement[] {
    const children = [
      ...this.nodes(ctx, 'blankLine'),
      ...this.nodes(ctx, 'commentLine'),
      ...this.nodes(ctx, 'boundaryElement'),
    ].sort((a, b) => (a.location?.startOffset ?? 0) - (b.location?.startOffset ?? 0));
    return children.map((node) => this.wrap(node, this.visit(node) as GraphStatement));
  }
  boundaryElement(ctx: Ctx): GraphStatement {
    const actorNode = this.nodes(ctx, 'actorDeclarationOnly')[0];
    if (actorNode) {
      return this.visit(actorNode) as GraphStatement;
    }
    const entityNode = this.nodes(ctx, 'entityName')[0];
    const entity = this.visit(entityNode) as ParsedEntity;
    entity.explicitDeclaration = true;
    entity.shape ??= 'ellipse';
    this.builder.addElement(this.entityDraft(entity));
    return { kind: 'node', span: [0, 0], nodes: [this.entityOccurrence(entityNode, entity, true)] };
  }

  metadataAssignmentStatement(ctx: Ctx): GraphStatement {
    const target = this.visit(this.nodes(ctx, 'metadataAssignmentTarget')[0]) as {
      id: string;
      location: DraftLocation;
    };
    const metadata = this.visit(this.nodes(ctx, 'metadata')[0]) as DraftMetadata;
    const statement: GraphStatement = {
      kind: 'metadata',
      span: [0, 0],
      nodes: [{ id: target.id, span: target.location.span, idSpan: target.location.span }],
      metadata: metadata.properties.map(({ key, span, keySpan, valueSpan }) => ({
        key,
        span,
        keySpan,
        valueSpan,
      })),
    };
    this.builder.addMetadataAssignment(target.id, target.location, metadata, statement);
    return statement;
  }
  metadataAssignmentTarget(ctx: Ctx): { id: string; location: DraftLocation } {
    const token = this.allTokens(ctx)[0];
    const label = this.tokenLabel(token);
    return {
      id: token.tokenType.name === 'IDENTIFIER' ? token.image : this.generateId(label.text),
      location: this.tokenLocation(token),
    };
  }
  noteStatement(ctx: Ctx): GraphStatement {
    const target = this.tokens(ctx, 'IDENTIFIER')[0];
    const label = this.visit(this.nodes(ctx, 'nodeLabel')[0]) as DraftLabel;
    this.builder.addNote({
      target: target.image,
      targetLocation: this.tokenLocation(target),
      label,
      location: this.ctxLocation(ctx),
    });
    return {
      kind: 'note',
      span: [0, 0],
      ref: `note-${this.anonymousNote++}`,
      refSpan: label.span,
      nodes: [{ id: target.image, span: this.tokenSpan(target), idSpan: this.tokenSpan(target) }],
    };
  }
  stereotype(ctx: Ctx): ParsedStereotype {
    const token = this.tokens(ctx, 'STEREOTYPE_TEXT')[0];
    return { value: token.image.trim(), span: this.tokenSpan(token) };
  }
  classSuffix(ctx: Ctx): ParsedClassSuffix {
    const tokens = this.tokens(ctx, 'IDENTIFIER');
    return {
      classes: tokens.map((token) => token.image),
      spans: tokens.map((token) => this.tokenSpan(token)),
    };
  }

  jsonStatement(ctx: Ctx): GraphStatement {
    const start = this.tokens(ctx, 'JSON_DECLARATION_START')[0];
    const literal = this.tokens(ctx, 'JSON_OBJECT_LITERAL')[0];
    const match = /^json[\t ]+(\w+)/.exec(start.image)!;
    const id = match[1];
    // The match is anchored at the start of the image, so the id begins where the
    // matched prefix ends. A text search would instead find ids like `o` or `son`
    // inside the leading `json` keyword.
    const relative = match[0].length - id.length;
    const idLocation: DraftLocation = {
      span: [start.startOffset + relative, start.startOffset + relative + id.length],
      line: start.startLine ?? 1,
      column: (start.startColumn ?? 1) + relative,
    };
    const parsed = parseOrderedJsonObject(
      literal.image,
      literal.startLine ?? 1,
      literal.startColumn ?? 1
    );
    const classNode = this.nodes(ctx, 'classSuffix')[0];
    const classes = classNode
      ? (this.visit(classNode) as ParsedClassSuffix)
      : { classes: [], spans: [] };
    const draft: DraftJson = {
      id,
      value: parsed.value,
      propertyOrder: parsed.propertyOrder,
      location: idLocation,
      classes: classes.classes,
    };
    this.builder.addJson(draft);
    return {
      kind: 'json',
      span: [0, 0],
      nodes: [
        {
          id,
          span: idLocation.span,
          idSpan: idLocation.span,
          defines: true,
          classSpans: classes.spans,
        },
      ],
      classSpans: classes.spans,
    };
  }
  directionStatement(ctx: Ctx): GraphStatement {
    const token = this.allTokens(ctx).find((value) =>
      ['TD', 'TB', 'BT', 'RL', 'LR'].includes(value.tokenType.name)
    )!;
    this.builder.setDirection(token.image as Direction);
    return { kind: 'direction', span: [0, 0] };
  }
  classDefStatement(ctx: Ctx): GraphStatement {
    const ids = this.tokens(ctx, 'IDENTIFIER');
    const styles = this.visit(this.nodes(ctx, 'styles')[0]) as string[];
    this.builder.addClassDef(
      ids.map((token) => token.image),
      styles
    );
    return { kind: 'classDef', span: [0, 0], ref: ids[0].image, refSpan: this.tokenSpan(ids[0]) };
  }
  classStatement(ctx: Ctx): GraphStatement {
    const ids = this.tokens(ctx, 'IDENTIFIER');
    let split = 1;
    for (; split < ids.length; split++) {
      const between = this.source.slice(
        (ids[split - 1].endOffset ?? ids[split - 1].startOffset) + 1,
        ids[split].startOffset
      );
      if (!between.includes(',')) {
        break;
      }
    }
    const targets = ids
      .slice(0, split)
      .map((token) => ({ id: token.image, location: this.tokenLocation(token) }));
    const classes = ids.slice(split).map((token) => token.image);
    this.builder.addClassAssignment(targets, classes);
    return {
      kind: 'classAssign',
      span: [0, 0],
      ref: classes[0],
      refSpan: this.tokenSpan(ids[split]),
      nodes: targets.map(({ id, location }) => ({
        id,
        span: location.span,
        idSpan: location.span,
      })),
    };
  }
  styleStatement(ctx: Ctx): GraphStatement {
    const target = this.tokens(ctx, 'IDENTIFIER')[0];
    const styles = this.visit(this.nodes(ctx, 'styles')[0]) as string[];
    this.builder.addStyleAssignment(target.image, this.tokenLocation(target), styles);
    return {
      kind: 'style',
      span: [0, 0],
      nodes: [{ id: target.image, span: this.tokenSpan(target), idSpan: this.tokenSpan(target) }],
    };
  }
  styles(ctx: Ctx): string[] {
    return this.nodes(ctx, 'styleValue').map((node) => this.visit(node) as string);
  }
  styleValue(ctx: Ctx): string {
    const tokens = this.allTokens(ctx);
    // WhiteSpace is Lexer.SKIPPED, so joining the token images would collapse the
    // separators inside multi-word values such as `border:1px solid red`. Commas are
    // consumed by the `styles` rule, so the source slice never spans two values.
    const span: Span = [
      tokens[0].startOffset,
      (tokens.at(-1)!.endOffset ?? tokens.at(-1)!.startOffset) + 1,
    ];
    return this.source.slice(span[0], span[1]).replaceAll('\\,', ',');
  }
  styleComponent(ctx: Ctx): string {
    return this.allTokens(ctx)
      .map((token) => token.image)
      .join('');
  }

  forwardSolidOperator(ctx: Ctx): ParsedArrow {
    const token = this.tokens(ctx, 'FORWARD_SOLID')[0];
    return {
      type: 'association',
      arrowType: ARROW_TYPE.SOLID_ARROW,
      minlen: this.solidMinlen(token),
    };
  }
  backwardSolidOperator(ctx: Ctx): ParsedArrow {
    const token = this.tokens(ctx, 'BACKWARD_SOLID')[0];
    const labelNode = this.nodes(ctx, 'edgeLabel')[0];
    const lengthToken = labelNode ? this.tokens(ctx, 'MARKERLESS_SOLID').at(-1)! : token;
    return {
      type: 'association',
      arrowType: ARROW_TYPE.BACK_ARROW,
      minlen: this.solidMinlen(lengthToken),
      ...(labelNode ? { label: this.visit(labelNode) as DraftLabel } : {}),
    };
  }
  markerlessSolidOperator(ctx: Ctx): ParsedArrow {
    const labelNode = this.nodes(ctx, 'edgeLabel')[0];
    const tokens = this.allTokens(ctx);
    if (!labelNode) {
      return {
        type: 'association',
        arrowType: ARROW_TYPE.LINE_SOLID,
        minlen: this.solidMinlen(this.tokens(ctx, 'MARKERLESS_SOLID')[0]),
      };
    }
    const last = tokens.at(-1)!;
    const arrowType =
      last.tokenType.name === 'FORWARD_SOLID'
        ? ARROW_TYPE.SOLID_ARROW
        : last.tokenType.name === 'FORWARD_CIRCLE'
          ? ARROW_TYPE.CIRCLE_ARROW
          : last.tokenType.name === 'FORWARD_CROSS'
            ? ARROW_TYPE.CROSS_ARROW
            : ARROW_TYPE.LINE_SOLID;
    return {
      type: 'association',
      arrowType,
      label: this.visit(labelNode) as DraftLabel,
      minlen:
        arrowType === ARROW_TYPE.SOLID_ARROW || arrowType === ARROW_TYPE.LINE_SOLID
          ? this.solidMinlen(last)
          : 1,
    };
  }
  forwardCircleOperator(_ctx: Ctx): ParsedArrow {
    return { type: 'association', arrowType: ARROW_TYPE.CIRCLE_ARROW, minlen: 1 };
  }
  backwardCircleOperator(ctx: Ctx): ParsedArrow {
    const labelNode = this.nodes(ctx, 'edgeLabel')[0];
    return {
      type: 'association',
      arrowType: ARROW_TYPE.CIRCLE_ARROW_REVERSED,
      minlen: 1,
      ...(labelNode ? { label: this.visit(labelNode) as DraftLabel } : {}),
    };
  }
  forwardCrossOperator(_ctx: Ctx): ParsedArrow {
    return { type: 'association', arrowType: ARROW_TYPE.CROSS_ARROW, minlen: 1 };
  }
  backwardCrossOperator(ctx: Ctx): ParsedArrow {
    const labelNode = this.nodes(ctx, 'edgeLabel')[0];
    return {
      type: 'association',
      arrowType: ARROW_TYPE.CROSS_ARROW_REVERSED,
      minlen: 1,
      ...(labelNode ? { label: this.visit(labelNode) as DraftLabel } : {}),
    };
  }

  private actorDraft(item: ParsedActorItem): DraftElement {
    return {
      id: item.id,
      kind: 'actor',
      label: item.label,
      location: item.location,
      generated: item.generated,
      ...(this.parentBoundary
        ? { parentId: this.parentBoundary.id, parentLocation: this.parentBoundary.location }
        : {}),
      ...(item.metadata ? { metadata: item.metadata } : {}),
      ...(item.stereotype
        ? { stereotype: item.stereotype.value, stereotypeSpan: item.stereotype.span }
        : {}),
      classes: item.classes,
    };
  }
  private entityDraft(entity: ParsedEntity): DraftElement {
    return {
      id: entity.id,
      kind: 'usecase',
      label: entity.label,
      location: entity.location,
      generated: entity.generated,
      ...(this.parentBoundary
        ? { parentId: this.parentBoundary.id, parentLocation: this.parentBoundary.location }
        : {}),
      ...(entity.shape ? { shape: entity.shape } : {}),
      ...(entity.metadata ? { metadata: entity.metadata } : {}),
      ...(entity.stereotype
        ? { stereotype: entity.stereotype.value, stereotypeSpan: entity.stereotype.span }
        : {}),
      classes: entity.classes,
    };
  }
  private endpoint(
    entity: ParsedEntity | ParsedActorItem,
    declaration = (entity as ParsedEntity).explicitDeclaration ?? true
  ): DraftEndpoint {
    return {
      id: entity.id,
      label: entity.label,
      location: entity.location,
      generated: entity.generated,
      declaration,
      classesOnReference: entity.classes.length > 0,
    };
  }
  private relationshipDraft(
    source: ParsedActorItem,
    tail: ParsedRelationTail,
    location: DraftLocation
  ): DraftRelationship {
    return {
      source: this.endpoint(source, true),
      target: this.endpoint(tail.target),
      location,
      ...(tail.explicitId
        ? { explicitId: tail.explicitId, explicitIdLocation: tail.explicitIdLocation }
        : {}),
      ...tail.arrow,
    };
  }
  private actorOccurrence(node: CstNode, item: ParsedActorItem, defines: boolean): NodeOccurrence {
    return {
      id: item.id,
      span: this.nodeSpan(node),
      idSpan: item.location.span,
      labelSpan: item.label.span,
      ...(defines ? { defines: true } : {}),
      ...(item.stereotype ? { stereotypeSpan: item.stereotype.span } : {}),
      ...(item.metadata
        ? {
            metadata: item.metadata.properties.map(({ key, span, keySpan, valueSpan }) => ({
              key,
              span,
              keySpan,
              valueSpan,
            })),
          }
        : {}),
      ...(item.classSpans.length ? { classSpans: item.classSpans } : {}),
    };
  }
  private entityOccurrence(node: CstNode, item: ParsedEntity, defines: boolean): NodeOccurrence {
    return this.actorOccurrence(node, item, defines);
  }
  private wrap(node: CstNode, statement: GraphStatement): GraphStatement {
    if (statement.kind === 'blank' || statement.kind === 'comment') {
      return statement;
    }
    statement.span = this.nodeSpan(node);
    for (const edge of statement.edges ?? []) {
      edge.span = statement.span;
    }
    return statement;
  }
  private tokenLabel(token: IToken): DraftLabel {
    const type: LabelType = token.tokenType.name === 'MARKDOWN_STRING' ? 'markdown' : 'text';
    const trim = type === 'markdown' ? 2 : token.tokenType.name === 'PLAIN_STRING' ? 1 : 0;
    const span = this.tokenSpan(token, trim);
    return { text: this.source.slice(span[0], span[1]), type, span };
  }
  private decodePlain(token: IToken): string {
    return token.tokenType.name === 'PLAIN_STRING' ? token.image.slice(1, -1) : token.image;
  }
  private contentSpan(token: IToken): Span {
    return this.tokenSpan(
      token,
      token.tokenType.name === 'PLAIN_STRING'
        ? 1
        : token.tokenType.name === 'MARKDOWN_STRING'
          ? 2
          : 0
    );
  }
  private generateId(label: string): string {
    return label.replace(/\W/g, '_');
  }
  private solidMinlen(token: IToken): number {
    return Math.max(1, (token.image.match(/-/g)?.length ?? 2) - 1);
  }
  private nodeLocation(node: CstNode): DraftLocation {
    const first = this.allTokens(node.children as Ctx)[0];
    return {
      span: this.nodeSpan(node),
      line: first.startLine ?? 1,
      column: first.startColumn ?? 1,
    };
  }
  private ctxLocation(ctx: Ctx): DraftLocation {
    const tokens = this.allTokens(ctx).filter(
      (token) => token.tokenType.name !== 'NEWLINE' && token.tokenType.name !== 'EOF'
    );
    const first = tokens[0];
    const last = tokens.at(-1)!;
    return {
      span: [
        first.startOffset,
        Math.min(
          this.source.length,
          (last.endOffset ?? last.startOffset + last.image.length - 1) + 1
        ),
      ],
      line: first.startLine ?? 1,
      column: first.startColumn ?? 1,
    };
  }
  private tokenLocation(token: IToken): DraftLocation {
    const trim =
      token.tokenType.name === 'PLAIN_STRING'
        ? 1
        : token.tokenType.name === 'MARKDOWN_STRING'
          ? 2
          : 0;
    return {
      span: this.tokenSpan(token, trim),
      line: token.startLine ?? 1,
      column: (token.startColumn ?? 1) + trim,
    };
  }
  private nodeSpan(node: CstNode): Span {
    const tokens = this.allTokens(node.children as Ctx).filter(
      (token) => token.tokenType.name !== 'NEWLINE' && token.tokenType.name !== 'EOF'
    );
    const first = tokens[0];
    const last = tokens.at(-1);
    if (!first || !last) {
      throw new Error('Usecase CST node has no source token');
    }
    return [
      first.startOffset,
      Math.min(
        this.source.length,
        (last.endOffset ?? last.startOffset + last.image.length - 1) + 1
      ),
    ];
  }
  private tokenSpan(token: IToken, trim = 0): Span {
    return [
      token.startOffset + trim,
      Math.min(
        this.source.length,
        (token.endOffset ?? token.startOffset + token.image.length - 1) + 1 - trim
      ),
    ];
  }
  private nodes(ctx: Ctx, key: string): CstNode[] {
    return (ctx[key] ?? []).filter((item): item is CstNode => 'children' in item);
  }
  private tokens(ctx: Ctx, key: string): IToken[] {
    return (ctx[key] ?? []).filter((item): item is IToken => 'tokenTypeIdx' in item);
  }
  private firstNode(ctx: Ctx, ...keys: string[]): CstNode {
    for (const key of keys) {
      const node = this.nodes(ctx, key)[0];
      if (node) {
        return node;
      }
    }
    throw new Error(`Usecase CST is missing one of: ${keys.join(', ')}`);
  }
  private allTokens(ctx: Ctx): IToken[] {
    const result: IToken[] = [];
    for (const values of Object.values(ctx)) {
      for (const value of values) {
        if ('tokenTypeIdx' in value) {
          result.push(value);
        } else {
          result.push(...this.allTokens(value.children as Ctx));
        }
      }
    }
    return result.sort((a, b) => a.startOffset - b.startOffset);
  }
}
export const usecaseVisitor = new UsecaseVisitor();
