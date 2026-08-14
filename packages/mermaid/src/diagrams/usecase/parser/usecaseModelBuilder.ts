// cspell:ignore markerless

import { buildUsecaseGraphAST, type UsecaseModelReader } from '../usecaseAst.js';
import type {
  Actor,
  ActorType,
  Animation,
  ArrowType,
  BoundaryType,
  ClassDef,
  Direction,
  GraphAST,
  GraphStatement,
  LabelType,
  MetadataOccurrence,
  Relationship,
  RelationshipType,
  Span,
  SystemBoundary,
  UseCase,
  UseCaseShape,
  UsecaseDB,
  UsecaseFields,
  UsecaseJsonNode,
  UsecaseNote,
  UsecaseSymbolKind,
} from '../usecaseTypes.js';

export interface DraftLocation {
  span: Span;
  line: number;
  column: number;
}
export interface DraftLabel {
  text: string;
  type: LabelType;
  span: Span;
}
export interface DraftMetadataProperty extends MetadataOccurrence {
  value: string | boolean;
  location: DraftLocation;
}
export interface DraftMetadata {
  properties: DraftMetadataProperty[];
  location: DraftLocation;
}
export interface DraftElement {
  id: string;
  kind: 'actor' | 'usecase';
  label: DraftLabel;
  location: DraftLocation;
  generated: boolean;
  parentId?: string;
  parentLocation?: DraftLocation;
  shape?: UseCaseShape;
  metadata?: DraftMetadata;
  stereotype?: string;
  stereotypeSpan?: Span;
  classes: string[];
}
export interface DraftBoundary {
  id: string;
  label: DraftLabel;
  location: DraftLocation;
  generated: boolean;
  classes: string[];
}
export interface DraftJson {
  id: string;
  value: Record<string, unknown>;
  propertyOrder: Record<string, string[]>;
  location: DraftLocation;
  classes: string[];
}
export interface DraftEndpoint {
  id: string;
  label: DraftLabel;
  location: DraftLocation;
  generated: boolean;
  declaration: boolean;
  classesOnReference: boolean;
}
export interface DraftRelationship {
  source: DraftEndpoint;
  target: DraftEndpoint;
  location: DraftLocation;
  explicitId?: string;
  explicitIdLocation?: DraftLocation;
  type: RelationshipType;
  arrowType: ArrowType;
  label?: DraftLabel;
  minlen: number;
}
export interface DraftNote {
  target: string;
  targetLocation: DraftLocation;
  label: DraftLabel;
  location: DraftLocation;
}
interface DraftMetadataAssignment {
  target: string;
  targetLocation: DraftLocation;
  metadata: DraftMetadata;
  statement: GraphStatement;
}
interface DraftClassAssignment {
  targets: { id: string; location: DraftLocation }[];
  classes: string[];
}
interface DraftStyleAssignment {
  target: string;
  location: DraftLocation;
  styles: string[];
}
interface SymbolOrigin {
  kind: UsecaseSymbolKind;
  location: DraftLocation;
  generated: boolean;
  /** Source label a generated ID was derived from; absent when the ID was written explicitly. */
  label?: string;
}
interface ElementState {
  kind: 'actor' | 'usecase';
  id: string;
  label: DraftLabel;
  location: DraftLocation;
  generated: boolean;
  parentId?: string;
  parentLocation?: DraftLocation;
  shape?: UseCaseShape;
  stereotype?: string;
  stereotypeLocation?: DraftLocation;
  classes: string[];
  actorType?: Exclude<ActorType, 'icon'>;
  icon?: string;
  business?: boolean;
}
interface BoundaryState {
  id: string;
  label: DraftLabel;
  location: DraftLocation;
  generated: boolean;
  type?: BoundaryType;
  classes: string[];
  styles: string[];
  members: string[];
}
interface EdgeState {
  draft: DraftRelationship;
  relationship: Relationship;
}

const locationText = (location: DraftLocation): string =>
  `line ${location.line}, column ${location.column} [${location.span[0]},${location.span[1]})`;
/**
 * Names the source label a generated ID was derived from, so that a collision between two
 * different labels that normalize to the same ID points at both originals.
 */
const labelSuffix = (label: string | undefined): string =>
  label === undefined ? '' : ` (label "${label}")`;
const generatedFrom = (origin: { generated: boolean; label?: string }): string | undefined =>
  origin.generated ? origin.label : undefined;
const pushUnique = (target: string[], values: readonly string[]): void => {
  for (const value of values) {
    if (!target.includes(value)) {
      target.push(value);
    }
  }
};

/** Collects detached CST drafts and atomically publishes a fully resolved model and AST. */
export class UsecaseModelBuilder implements UsecaseModelReader {
  private model: UsecaseFields;
  private source = '';
  private statements: GraphStatement[] = [];
  private readonly elements: DraftElement[] = [];
  private readonly boundaries: DraftBoundary[] = [];
  private readonly jsonDrafts: DraftJson[] = [];
  private readonly relationshipDrafts: DraftRelationship[] = [];
  private readonly noteDrafts: DraftNote[] = [];
  private readonly metadataAssignments: DraftMetadataAssignment[] = [];
  private readonly classAssignments: DraftClassAssignment[] = [];
  private readonly styleAssignments: DraftStyleAssignment[] = [];
  private readonly classDefinitions: { ids: string[]; styles: string[] }[] = [];
  private readonly directions: Direction[] = [];

  constructor(private readonly db: UsecaseDB) {
    this.model = db.createModel();
  }
  reset(source: string): void {
    this.model = this.db.createModel();
    this.source = source;
    this.statements = [];
    this.elements.length = 0;
    this.boundaries.length = 0;
    this.jsonDrafts.length = 0;
    this.relationshipDrafts.length = 0;
    this.noteDrafts.length = 0;
    this.metadataAssignments.length = 0;
    this.classAssignments.length = 0;
    this.styleAssignments.length = 0;
    this.classDefinitions.length = 0;
    this.directions.length = 0;
  }
  addElement(value: DraftElement): void {
    this.elements.push(value);
  }
  addBoundary(value: DraftBoundary): void {
    this.boundaries.push(value);
  }
  addJson(value: DraftJson): void {
    this.jsonDrafts.push(value);
  }
  addRelationship(value: DraftRelationship): void {
    this.relationshipDrafts.push(value);
  }
  addNote(value: DraftNote): void {
    this.noteDrafts.push(value);
  }
  addMetadataAssignment(
    target: string,
    targetLocation: DraftLocation,
    metadata: DraftMetadata,
    statement: GraphStatement
  ): void {
    this.metadataAssignments.push({ target, targetLocation, metadata, statement });
  }
  addClassDef(ids: string[], styles: string[]): void {
    this.classDefinitions.push({ ids, styles });
  }
  addClassAssignment(targets: { id: string; location: DraftLocation }[], classes: string[]): void {
    this.classAssignments.push({ targets, classes });
  }
  addStyleAssignment(target: string, location: DraftLocation, styles: string[]): void {
    this.styleAssignments.push({ target, location, styles });
  }
  setDirection(direction: Direction): void {
    this.directions.push(direction === 'TD' ? 'TB' : direction);
  }
  setAccTitle(title: string): void {
    this.model.accTitle = title;
  }
  setAccDescription(description: string): void {
    this.model.accDescription = description;
  }
  setStatements(statements: GraphStatement[]): void {
    this.statements = statements;
  }
  getActors(): ReadonlyMap<string, Actor> {
    return this.model.actors;
  }
  getUseCases(): ReadonlyMap<string, UseCase> {
    return this.model.useCases;
  }
  getSystemBoundaries(): ReadonlyMap<string, SystemBoundary> {
    return this.model.systemBoundaries;
  }
  getRelationships(): readonly Relationship[] {
    return this.model.relationships;
  }
  getNotes(): ReadonlyMap<string, UsecaseNote> {
    return this.model.notes;
  }
  getJsonNodes(): ReadonlyMap<string, UsecaseJsonNode> {
    return this.model.jsonNodes;
  }
  getClassDefs(): ReadonlyMap<string, ClassDef> {
    return this.model.classDefs;
  }
  getDirection(): Direction {
    return this.model.direction;
  }
  getAccTitle(): string {
    return this.model.accTitle;
  }
  getAccDescription(): string {
    return this.model.accDescription;
  }

  finalize(headerSpan: Span): GraphAST {
    const symbols = new Map<string, SymbolOrigin>();
    const elements = new Map<string, ElementState>();
    const boundaries = new Map<string, BoundaryState>();
    const first = new Map<string, number>();
    for (const relation of this.relationshipDrafts) {
      this.recordFirst(first, relation.source.id, relation.source.location.span[0]);
      this.recordFirst(first, relation.target.id, relation.target.location.span[0]);
    }
    for (const draft of this.elements) {
      this.recordFirst(first, draft.id, draft.location.span[0]);
    }
    for (const draft of this.boundaries) {
      this.recordFirst(first, draft.id, draft.location.span[0]);
    }
    for (const draft of this.jsonDrafts) {
      this.recordFirst(first, draft.id, draft.location.span[0]);
    }
    const declarations = [
      ...this.elements.map((value) => ({
        offset: value.location.span[0],
        type: 'element' as const,
        value,
      })),
      ...this.boundaries.map((value) => ({
        offset: value.location.span[0],
        type: 'boundary' as const,
        value,
      })),
      ...this.jsonDrafts.map((value) => ({
        offset: value.location.span[0],
        type: 'json' as const,
        value,
      })),
      ...this.relationshipDrafts
        .filter((value) => value.explicitId)
        .map((value) => ({
          offset: value.explicitIdLocation!.span[0],
          type: 'edge' as const,
          value,
        })),
    ].sort((a, b) => a.offset - b.offset);
    for (const item of declarations) {
      if (item.type === 'element') {
        this.collectElement(item.value, symbols, elements);
      } else if (item.type === 'boundary') {
        this.collectBoundary(item.value, symbols, boundaries);
      } else if (item.type === 'json') {
        this.registerUnique(symbols, item.value.id, 'json', item.value.location, false);
      } else {
        this.registerUnique(
          symbols,
          item.value.explicitId!,
          'edge',
          item.value.explicitIdLocation!,
          false
        );
      }
    }
    this.materializeElements(elements, first);
    this.materializeBoundaries(boundaries, first);
    this.materializeJson(first);
    const edges = this.materializeRelationships(symbols, elements, first);
    this.reorderElements(elements, first);
    this.applyMetadataAssignments(symbols, elements, boundaries, edges);
    this.validateAndRefreshElements(elements);
    this.refreshBoundaries(boundaries, elements);
    this.materializeNotes(symbols);
    this.applyClassDefinitions();
    this.applyClassesAndStyles(symbols, edges);
    this.model.direction = this.directions.at(-1) ?? this.model.direction;
    this.model.symbols = new Map([...symbols].map(([id, origin]) => [id, origin.kind]));
    const ast = buildUsecaseGraphAST(this, this.source, headerSpan, this.statements);
    this.model.ast = ast;
    this.db.commit(this.model);
    return ast;
  }

  private collectElement(
    draft: DraftElement,
    symbols: Map<string, SymbolOrigin>,
    states: Map<string, ElementState>
  ): void {
    const origin = symbols.get(draft.id);
    const draftLabel = generatedFrom({ generated: draft.generated, label: draft.label.text });
    if (origin && origin.kind !== draft.kind) {
      this.conflict(
        `ID '${draft.id}' is declared as both ${origin.kind} and ${draft.kind}`,
        draft.location,
        origin.location,
        draftLabel,
        generatedFrom(origin)
      );
    }
    if (origin && (origin.generated || draft.generated)) {
      this.conflict(
        `Generated ID '${draft.id}' collides with another declaration`,
        draft.location,
        origin.location,
        draftLabel,
        generatedFrom(origin)
      );
    }
    const existing = states.get(draft.id);
    if (!existing) {
      const state: ElementState = {
        kind: draft.kind,
        id: draft.id,
        label: draft.label,
        location: draft.location,
        generated: draft.generated,
        classes: [...draft.classes],
        ...(draft.parentId
          ? { parentId: draft.parentId, parentLocation: draft.parentLocation }
          : {}),
        ...(draft.shape ? { shape: draft.shape } : {}),
        ...(draft.stereotype
          ? { stereotype: draft.stereotype, stereotypeLocation: draft.location }
          : {}),
      };
      this.applyDeclarationMetadata(state, draft.metadata);
      states.set(draft.id, state);
      symbols.set(draft.id, {
        kind: draft.kind,
        location: draft.location,
        generated: draft.generated,
        label: draft.label.text,
      });
      return;
    }
    if (existing.label.text !== draft.label.text || existing.label.type !== draft.label.type) {
      this.conflict(`ID '${draft.id}' has conflicting labels`, draft.location, existing.location);
    }
    if (draft.shape && existing.shape && draft.shape !== existing.shape) {
      this.conflict(
        `Use case '${draft.id}' has conflicting shapes`,
        draft.location,
        existing.location
      );
    }
    if (draft.parentId && existing.parentId && draft.parentId !== existing.parentId) {
      this.conflict(
        `Element '${draft.id}' belongs to more than one system boundary`,
        draft.parentLocation ?? draft.location,
        existing.parentLocation ?? existing.location
      );
    }
    if (draft.stereotype && existing.stereotype && draft.stereotype !== existing.stereotype) {
      this.conflict(
        `Element '${draft.id}' has conflicting stereotypes`,
        draft.location,
        existing.stereotypeLocation ?? existing.location
      );
    }
    existing.shape ??= draft.shape;
    existing.parentId ??= draft.parentId;
    existing.parentLocation ??= draft.parentLocation;
    existing.stereotype ??= draft.stereotype;
    existing.stereotypeLocation ??= draft.stereotype ? draft.location : undefined;
    pushUnique(existing.classes, draft.classes);
    this.applyDeclarationMetadata(existing, draft.metadata);
  }

  private collectBoundary(
    draft: DraftBoundary,
    symbols: Map<string, SymbolOrigin>,
    states: Map<string, BoundaryState>
  ): void {
    const origin = symbols.get(draft.id);
    const draftLabel = generatedFrom({ generated: draft.generated, label: draft.label.text });
    if (origin && origin.kind !== 'boundary') {
      this.conflict(
        `ID '${draft.id}' is declared as both ${origin.kind} and boundary`,
        draft.location,
        origin.location,
        draftLabel,
        generatedFrom(origin)
      );
    }
    if (origin && (origin.generated || draft.generated)) {
      this.conflict(
        `Generated ID '${draft.id}' collides with another declaration`,
        draft.location,
        origin.location,
        draftLabel,
        generatedFrom(origin)
      );
    }
    const existing = states.get(draft.id);
    if (existing) {
      if (existing.label.text !== draft.label.text || existing.label.type !== draft.label.type) {
        this.conflict(
          `Boundary '${draft.id}' has conflicting titles`,
          draft.location,
          existing.location
        );
      }
      pushUnique(existing.classes, draft.classes);
      return;
    }
    states.set(draft.id, {
      id: draft.id,
      label: draft.label,
      location: draft.location,
      generated: draft.generated,
      classes: [...draft.classes],
      styles: [],
      members: [],
    });
    symbols.set(draft.id, {
      kind: 'boundary',
      location: draft.location,
      generated: draft.generated,
      label: draft.label.text,
    });
  }

  private materializeElements(states: Map<string, ElementState>, first: Map<string, number>): void {
    for (const state of [...states.values()].sort(
      (a, b) => (first.get(a.id) ?? 0) - (first.get(b.id) ?? 0)
    )) {
      this.setElementModel(state);
    }
  }
  private materializeBoundaries(
    states: Map<string, BoundaryState>,
    first: Map<string, number>
  ): void {
    for (const state of [...states.values()].sort(
      (a, b) => (first.get(a.id) ?? 0) - (first.get(b.id) ?? 0)
    )) {
      this.model.systemBoundaries.set(state.id, {
        id: state.id,
        label: state.label.text,
        labelType: state.label.type,
        type: state.type ?? 'rect',
        members: [],
        classes: [...state.classes],
        styles: [...state.styles],
      });
    }
  }
  private materializeJson(first: Map<string, number>): void {
    for (const draft of [...this.jsonDrafts].sort(
      (a, b) => (first.get(a.id) ?? 0) - (first.get(b.id) ?? 0)
    )) {
      this.model.jsonNodes.set(draft.id, {
        id: draft.id,
        value: draft.value,
        propertyOrder: draft.propertyOrder,
        classes: [...draft.classes],
        styles: [],
      });
    }
  }
  private materializeRelationships(
    symbols: Map<string, SymbolOrigin>,
    states: Map<string, ElementState>,
    first: Map<string, number>
  ): Map<string, EdgeState> {
    const edges = new Map<string, EdgeState>();
    let anonymous = 0;
    for (const draft of this.relationshipDrafts) {
      const sourceKind = this.resolveEndpoint(draft.source, symbols, states, first);
      const targetKind = this.resolveEndpoint(draft.target, symbols, states, first);
      this.validateRelationship(draft, sourceKind, targetKind, symbols);
      const id = draft.explicitId ?? `edge-${anonymous++}`;
      const relationship: Relationship = {
        id,
        explicitId: Boolean(draft.explicitId),
        source: draft.source.id,
        target: draft.target.id,
        type: draft.type,
        arrowType: draft.arrowType,
        ...(draft.label ? { label: draft.label.text, labelType: draft.label.type } : {}),
        minlen: draft.minlen,
        classes: [],
        styles: [],
        animate: false,
      };
      this.model.relationships.push(relationship);
      edges.set(id, { draft, relationship });
    }
    this.model.relationshipCounter = anonymous;
    return edges;
  }
  private resolveEndpoint(
    endpoint: DraftEndpoint,
    symbols: Map<string, SymbolOrigin>,
    states: Map<string, ElementState>,
    first: Map<string, number>
  ): UsecaseSymbolKind {
    if (endpoint.classesOnReference && !endpoint.declaration) {
      throw new Error(
        `Relationship endpoint '${endpoint.id}' uses ::: without declaring the node at ${locationText(endpoint.location)}`
      );
    }
    const origin = symbols.get(endpoint.id);
    if (origin) {
      return origin.kind;
    }
    states.set(endpoint.id, {
      kind: 'usecase',
      id: endpoint.id,
      label: endpoint.label,
      location: endpoint.location,
      generated: endpoint.generated,
      shape: 'ellipse',
      classes: [],
    });
    symbols.set(endpoint.id, {
      kind: 'usecase',
      location: endpoint.location,
      generated: endpoint.generated,
      label: endpoint.label.text,
    });
    this.recordFirst(first, endpoint.id, endpoint.location.span[0]);
    return 'usecase';
  }
  private reorderElements(states: Map<string, ElementState>, first: Map<string, number>): void {
    const actors = new Map(this.model.actors);
    const useCases = new Map(this.model.useCases);
    this.model.actors.clear();
    this.model.useCases.clear();
    for (const state of [...states.values()].sort(
      (a, b) => (first.get(a.id) ?? 0) - (first.get(b.id) ?? 0)
    )) {
      if (!actors.has(state.id) && !useCases.has(state.id)) {
        this.setElementModel(state);
      }
      const actor = actors.get(state.id) ?? this.model.actors.get(state.id);
      const useCase = useCases.get(state.id) ?? this.model.useCases.get(state.id);
      if (actor) {
        this.model.actors.set(state.id, actor);
      } else if (useCase) {
        this.model.useCases.set(state.id, useCase);
      }
    }
  }

  private applyMetadataAssignments(
    symbols: Map<string, SymbolOrigin>,
    elements: Map<string, ElementState>,
    boundaries: Map<string, BoundaryState>,
    edges: Map<string, EdgeState>
  ): void {
    for (const assignment of this.metadataAssignments) {
      const origin = symbols.get(assignment.target);
      if (!origin) {
        const inferred = this.inferMetadataKind(assignment.metadata);
        throw new Error(
          `Metadata target '${assignment.target}' is unresolved${inferred ? ` (metadata implies ${inferred})` : ''} at ${locationText(assignment.targetLocation)}`
        );
      }
      if (origin.kind === 'actor' || origin.kind === 'usecase') {
        this.applyStandaloneElementMetadata(elements.get(assignment.target)!, assignment.metadata);
      } else if (origin.kind === 'boundary') {
        const boundary = boundaries.get(assignment.target)!;
        for (const property of assignment.metadata.properties) {
          if (
            property.key !== 'type' ||
            (property.value !== 'rect' && property.value !== 'package')
          ) {
            this.invalidMetadata(assignment.target, origin.kind, property);
          }
          boundary.type = property.value;
        }
      } else if (origin.kind === 'edge') {
        const edge = edges.get(assignment.target);
        if (!edge) {
          throw new Error(
            `Metadata target '${assignment.target}' is not an explicit edge at ${locationText(assignment.targetLocation)}`
          );
        }
        assignment.statement.kind = 'edgeMetadata';
        assignment.statement.edges = [
          {
            id: assignment.target,
            span: assignment.statement.span,
            idSpan: assignment.targetLocation.span,
            ...(assignment.statement.metadata ? { metadata: assignment.statement.metadata } : {}),
          },
        ];
        delete assignment.statement.nodes;
        for (const property of assignment.metadata.properties) {
          if (property.key === 'animate' && typeof property.value === 'boolean') {
            edge.relationship.animate = property.value;
          } else if (
            property.key === 'animation' &&
            (property.value === 'fast' || property.value === 'slow')
          ) {
            edge.relationship.animation = property.value as Animation;
            edge.relationship.animate = true;
          } else {
            this.invalidMetadata(assignment.target, origin.kind, property);
          }
        }
      } else {
        for (const property of assignment.metadata.properties) {
          this.invalidMetadata(assignment.target, origin.kind, property);
        }
      }
    }
    for (const { relationship } of edges.values()) {
      if (relationship.animation) {
        relationship.animate = true;
      }
    }
  }
  private applyStandaloneElementMetadata(state: ElementState, metadata: DraftMetadata): void {
    for (const property of metadata.properties) {
      if (state.kind === 'actor') {
        this.applyActorProperty(state, property, true);
      } else if (property.key === 'business' && typeof property.value === 'boolean') {
        state.business = property.value;
      } else {
        this.invalidMetadata(state.id, state.kind, property);
      }
    }
  }
  private applyDeclarationMetadata(state: ElementState, metadata?: DraftMetadata): void {
    if (!metadata) {
      return;
    }
    for (const property of metadata.properties) {
      if (state.kind === 'actor') {
        this.applyActorProperty(state, property, false);
      } else if (property.key === 'business' && typeof property.value === 'boolean') {
        if (state.business !== undefined && state.business !== property.value) {
          this.conflict(
            `Use case '${state.id}' has conflicting business metadata`,
            property.location,
            state.location
          );
        }
        state.business = property.value;
      } else {
        this.invalidMetadata(state.id, state.kind, property);
      }
    }
  }
  private applyActorProperty(
    state: ElementState,
    property: DraftMetadataProperty,
    replace: boolean
  ): void {
    if (
      property.key === 'type' &&
      (property.value === 'normal' || property.value === 'hollow' || property.value === 'awesome')
    ) {
      if (!replace && state.actorType !== undefined && state.actorType !== property.value) {
        this.conflict(
          `Actor '${state.id}' has conflicting type metadata`,
          property.location,
          state.location
        );
      }
      state.actorType = property.value;
    } else if (property.key === 'icon' && typeof property.value === 'string') {
      if (!replace && state.icon !== undefined && state.icon !== property.value) {
        this.conflict(
          `Actor '${state.id}' has conflicting icon metadata`,
          property.location,
          state.location
        );
      }
      state.icon = property.value;
    } else if (property.key === 'business' && typeof property.value === 'boolean') {
      if (!replace && state.business !== undefined && state.business !== property.value) {
        this.conflict(
          `Actor '${state.id}' has conflicting business metadata`,
          property.location,
          state.location
        );
      }
      state.business = property.value;
    } else {
      this.invalidMetadata(state.id, state.kind, property);
    }
  }
  private validateAndRefreshElements(states: Map<string, ElementState>): void {
    for (const state of states.values()) {
      const type: ActorType = state.icon ? 'icon' : (state.actorType ?? 'normal');
      if (state.kind === 'actor') {
        if (state.icon && state.actorType && state.actorType !== 'normal') {
          throw new Error(
            `Actor '${state.id}' cannot combine icon with type '${state.actorType}' at ${locationText(state.location)}`
          );
        }
        if (state.business && (type === 'icon' || type === 'awesome')) {
          throw new Error(
            `Business actor '${state.id}' must use normal or hollow geometry at ${locationText(state.location)}`
          );
        }
      } else if ((state.shape ?? 'ellipse') === 'rect' && state.business) {
        throw new Error(
          `Rectangular use case '${state.id}' cannot be a business use case at ${locationText(state.location)}`
        );
      }
      this.setElementModel(state);
    }
  }
  private refreshBoundaries(
    boundaries: Map<string, BoundaryState>,
    elements: Map<string, ElementState>
  ): void {
    for (const boundary of boundaries.values()) {
      boundary.members.length = 0;
    }
    for (const draft of [...this.elements].sort(
      (a, b) => a.location.span[0] - b.location.span[0]
    )) {
      if (!draft.parentId) {
        continue;
      }
      const boundary = boundaries.get(draft.parentId);
      if (!boundary) {
        throw new Error(
          `Parent boundary '${draft.parentId}' for '${draft.id}' is unresolved at ${locationText(draft.parentLocation ?? draft.location)}`
        );
      }
      if (!boundary.members.includes(draft.id)) {
        boundary.members.push(draft.id);
      }
    }
    for (const state of elements.values()) {
      if (state.parentId && !boundaries.has(state.parentId)) {
        throw new Error(
          `Parent boundary '${state.parentId}' for '${state.id}' is unresolved at ${locationText(state.parentLocation ?? state.location)}`
        );
      }
    }
    for (const state of boundaries.values()) {
      const model = this.model.systemBoundaries.get(state.id)!;
      model.type = state.type ?? 'rect';
      model.members = [...state.members];
      model.classes = [...state.classes];
      model.styles = [...state.styles];
    }
  }
  private materializeNotes(symbols: Map<string, SymbolOrigin>): void {
    let counter = 0;
    for (const draft of this.noteDrafts) {
      const origin = symbols.get(draft.target);
      if (!origin) {
        throw new Error(
          `Note target '${draft.target}' is unresolved at ${locationText(draft.targetLocation)}`
        );
      }
      if (origin.kind !== 'actor' && origin.kind !== 'usecase') {
        this.conflict(
          `Note target '${draft.target}' must be an actor or use case, not ${origin.kind}`,
          draft.targetLocation,
          origin.location
        );
      }
      const id = `note-${counter++}`;
      this.model.notes.set(id, {
        id,
        target: draft.target,
        label: draft.label.text,
        labelType: draft.label.type,
      });
    }
    this.model.noteCounter = counter;
  }
  private applyClassDefinitions(): void {
    for (const definition of this.classDefinitions) {
      for (const id of definition.ids) {
        this.model.classDefs.set(id, { id, styles: [...definition.styles] });
      }
    }
  }
  private applyClassesAndStyles(
    symbols: Map<string, SymbolOrigin>,
    edges: Map<string, EdgeState>
  ): void {
    for (const assignment of this.classAssignments) {
      for (const target of assignment.targets) {
        pushUnique(
          this.getStylable(target.id, symbols, edges, target.location).classes,
          assignment.classes
        );
      }
    }
    for (const assignment of this.styleAssignments) {
      this.getStylable(assignment.target, symbols, edges, assignment.location).styles.push(
        ...assignment.styles
      );
    }
  }
  private getStylable(
    id: string,
    symbols: Map<string, SymbolOrigin>,
    edges: Map<string, EdgeState>,
    location: DraftLocation
  ): { classes: string[]; styles: string[] } {
    const kind = symbols.get(id)?.kind;
    const target =
      kind === 'actor'
        ? this.model.actors.get(id)
        : kind === 'usecase'
          ? this.model.useCases.get(id)
          : kind === 'boundary'
            ? this.model.systemBoundaries.get(id)
            : kind === 'json'
              ? this.model.jsonNodes.get(id)
              : kind === 'edge'
                ? edges.get(id)?.relationship
                : undefined;
    if (!target) {
      throw new Error(
        `Class/style target '${id}' is unresolved or anonymous at ${locationText(location)}`
      );
    }
    return target;
  }
  private validateRelationship(
    draft: DraftRelationship,
    sourceKind: UsecaseSymbolKind,
    targetKind: UsecaseSymbolKind,
    symbols: Map<string, SymbolOrigin>
  ): void {
    const allowed = (kind: UsecaseSymbolKind): boolean =>
      kind === 'actor' || kind === 'usecase' || kind === 'json';
    if (!allowed(sourceKind)) {
      this.conflict(
        `Relationship source '${draft.source.id}' cannot be ${sourceKind}`,
        draft.source.location,
        symbols.get(draft.source.id)!.location
      );
    }
    if (!allowed(targetKind)) {
      this.conflict(
        `Relationship target '${draft.target.id}' cannot be ${targetKind}`,
        draft.target.location,
        symbols.get(draft.target.id)!.location
      );
    }
    if (
      (draft.type === 'include' || draft.type === 'extend') &&
      (sourceKind !== 'usecase' || targetKind !== 'usecase')
    ) {
      throw new Error(
        `${draft.type} relationship requires use-case endpoints at ${locationText(draft.location)}`
      );
    }
    if (
      draft.type === 'generalization' &&
      ((sourceKind !== 'actor' && sourceKind !== 'usecase') || sourceKind !== targetKind)
    ) {
      throw new Error(
        `Generalization requires actor-to-actor or use-case-to-use-case endpoints at ${locationText(draft.location)}`
      );
    }
    if (
      draft.type === 'association' &&
      (sourceKind === 'json' || targetKind === 'json') &&
      ![0, 1, 2].includes(draft.arrowType)
    ) {
      throw new Error(
        `JSON relationship '${draft.source.id}' to '${draft.target.id}' permits only point, reversed-point, or markerless solid association at ${locationText(draft.location)}`
      );
    }
  }
  private setElementModel(state: ElementState): void {
    if (state.kind === 'actor') {
      const type: ActorType = state.icon ? 'icon' : (state.actorType ?? 'normal');
      this.model.useCases.delete(state.id);
      this.model.actors.set(state.id, {
        id: state.id,
        label: state.label.text,
        labelType: state.label.type,
        type,
        ...(state.icon ? { icon: state.icon } : {}),
        business: state.business ?? false,
        ...(state.stereotype ? { stereotype: state.stereotype } : {}),
        ...(state.parentId ? { parentId: state.parentId } : {}),
        classes: [...state.classes],
        styles: this.model.actors.get(state.id)?.styles ?? [],
      });
    } else {
      this.model.actors.delete(state.id);
      this.model.useCases.set(state.id, {
        id: state.id,
        label: state.label.text,
        labelType: state.label.type,
        shape: state.shape ?? 'ellipse',
        business: state.business ?? false,
        ...(state.stereotype ? { stereotype: state.stereotype } : {}),
        ...(state.parentId ? { parentId: state.parentId } : {}),
        classes: [...state.classes],
        styles: this.model.useCases.get(state.id)?.styles ?? [],
      });
    }
  }
  private inferMetadataKind(metadata: DraftMetadata): string | undefined {
    const possible = new Set(['actor', 'usecase', 'boundary', 'edge']);
    for (const property of metadata.properties) {
      if (property.key === 'icon') {
        possible.clear();
        possible.add('actor');
      } else if (property.key === 'animate' || property.key === 'animation') {
        possible.clear();
        possible.add('edge');
      } else if (property.key === 'type') {
        possible.clear();
        if (property.value === 'rect' || property.value === 'package') {
          possible.add('boundary');
        } else if (
          property.value === 'normal' ||
          property.value === 'hollow' ||
          property.value === 'awesome'
        ) {
          possible.add('actor');
        }
      } else if (property.key === 'business') {
        possible.delete('boundary');
        possible.delete('edge');
      } else {
        return undefined;
      }
    }
    return possible.size === 1 ? [...possible][0] : undefined;
  }
  private invalidMetadata(
    id: string,
    kind: UsecaseSymbolKind | 'actor' | 'usecase',
    property: DraftMetadataProperty
  ): never {
    throw new Error(
      `Metadata property '${property.key}' is invalid for ${kind} '${id}' at ${locationText(property.location)}`
    );
  }
  private registerUnique(
    symbols: Map<string, SymbolOrigin>,
    id: string,
    kind: UsecaseSymbolKind,
    location: DraftLocation,
    generated: boolean
  ): void {
    const previous = symbols.get(id);
    if (previous) {
      this.conflict(
        `ID '${id}' is declared more than once (${previous.kind} and ${kind})`,
        location,
        previous.location,
        undefined,
        generatedFrom(previous)
      );
    }
    symbols.set(id, { kind, location, generated });
  }
  private recordFirst(map: Map<string, number>, id: string, offset: number): void {
    const previous = map.get(id);
    if (previous === undefined || offset < previous) {
      map.set(id, offset);
    }
  }
  private conflict(
    message: string,
    current: DraftLocation,
    previous: DraftLocation,
    currentLabel?: string,
    previousLabel?: string
  ): never {
    throw new Error(
      `${message} at ${locationText(current)}${labelSuffix(currentLabel)}; previous declaration at ${locationText(previous)}${labelSuffix(previousLabel)}`
    );
  }
}
