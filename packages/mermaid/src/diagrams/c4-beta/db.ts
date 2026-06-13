import { getConfig } from '../../config.js';
import type { DiagramDB } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import type { Edge, LayoutData, Node } from '../../rendering-util/types.js';
import {
  clear as commonClear,
  getAccDescription,
  getAccTitle,
  getDiagramTitle,
  setAccDescription,
  setAccTitle,
  setDiagramTitle,
} from '../common/commonDb.js';
import type {
  C4BetaElement,
  C4BetaRelationship,
  C4BetaTagStyle,
  C4DiagramKind,
  C4Direction,
  C4ElementKind,
  C4LinePattern,
} from './types.js';

interface ElementColors {
  fill: string;
  stroke: string;
}

const ELEMENT_COLORS: Partial<Record<C4ElementKind, ElementColors>> = {
  person: { fill: '#08427B', stroke: '#073B6F' },
  system: { fill: '#1168BD', stroke: '#3C7FC0' },
  container: { fill: '#438DD5', stroke: '#3C7FC0' },
  component: { fill: '#85BBF0', stroke: '#78A8D8' },
};

// Element kinds that are unexpected for a given diagram kind. They still
// render (forgiving WYSIWYG), but we warn so authors can spot mistakes.
const UNEXPECTED_ELEMENT_KINDS: Record<C4DiagramKind, C4ElementKind[]> = {
  context: ['container', 'component', 'node'],
  container: ['component', 'node'],
  component: ['node'],
  dynamic: ['node'],
  deployment: ['person'],
};

const LINE_PATTERNS: C4LinePattern[] = ['solid', 'dashed', 'dotted'];

const isLinePattern = (value: string): value is C4LinePattern =>
  (LINE_PATTERNS as string[]).includes(value);

const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const buildElementLabel = (element: C4BetaElement): string => {
  const lines: string[] = [
    `<small>&laquo;${escapeHtml(element.kind)}&raquo;</small>`,
    `<b>${escapeHtml(element.name)}</b>`,
  ];
  if (element.technology) {
    lines.push(`<small><i>[${escapeHtml(element.technology)}]</i></small>`);
  }
  if (element.description) {
    lines.push(escapeHtml(element.description));
  }
  return lines.join('<br/>');
};

const buildRelationshipLabel = (
  relationship: C4BetaRelationship,
  step?: number
): string | undefined => {
  if (!relationship.description && step === undefined) {
    return undefined;
  }
  const titleParts: string[] = [];
  if (step !== undefined) {
    titleParts.push(`${step}.`);
  }
  if (relationship.description) {
    titleParts.push(escapeHtml(relationship.description));
  }
  const lines: string[] = [`<b>${titleParts.join(' ')}</b>`];
  if (relationship.technology) {
    lines.push(`<small><i>[${escapeHtml(relationship.technology)}]</i></small>`);
  }
  return lines.join('<br/>');
};

export class C4BetaDB implements DiagramDB {
  private elements: C4BetaElement[] = [];
  private relationships: C4BetaRelationship[] = [];
  private styles = new Map<string, C4BetaTagStyle>();
  private direction: C4Direction = 'TB';
  private kind: C4DiagramKind = 'context';

  public addElement(element: C4BetaElement) {
    this.elements.push(element);
  }

  public addRelationship(relationship: C4BetaRelationship) {
    this.relationships.push(relationship);
  }

  public getElements(): C4BetaElement[] {
    return this.elements;
  }

  public getRelationships(): C4BetaRelationship[] {
    return this.relationships;
  }

  public addStyle(tag: string, entries: { key: string; value: string }[]) {
    const style: C4BetaTagStyle = this.styles.get(tag) ?? {};
    for (const { key, value } of entries) {
      if (key === 'fill' || key === 'stroke' || key === 'color') {
        style[key] = value;
      } else if (key === 'shape' && value === 'cylinder') {
        style.shape = value;
      } else if (key === 'line' && isLinePattern(value)) {
        style.line = value;
      } else {
        log.warn(`c4-beta: unsupported style "${key}:${value}" for tag "${tag}"; ignoring it`);
      }
    }
    this.styles.set(tag, style);
  }

  public getStyles(): Map<string, C4BetaTagStyle> {
    return this.styles;
  }

  public setDirection(direction: C4Direction) {
    this.direction = direction;
  }

  public getDirection(): C4Direction {
    return this.direction;
  }

  public setKind(kind: C4DiagramKind) {
    this.kind = kind;
  }

  public getKind(): C4DiagramKind {
    return this.kind;
  }

  private validateKind() {
    const unexpected = UNEXPECTED_ELEMENT_KINDS[this.kind];
    for (const element of this.elements) {
      if (unexpected.includes(element.kind)) {
        log.warn(
          `c4-beta: element "${element.id}" of kind "${element.kind}" is unexpected in a "${this.kind}" diagram; rendering it anyway`
        );
      }
    }
  }

  public getData(): LayoutData {
    const config = getConfig();
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    this.validateKind();

    // Any element containing other elements is rendered as a boundary cluster.
    // Deployment nodes are always clusters, even when they are empty.
    const boundaryIds = new Set(
      this.elements.flatMap((element) => [
        ...(element.kind === 'node' ? [element.id] : []),
        ...(element.parentId === undefined ? [] : [element.parentId]),
      ])
    );

    for (const element of this.elements) {
      if (boundaryIds.has(element.id)) {
        const label =
          element.kind === 'node'
            ? escapeHtml(
                `${element.name} [Node${element.technology ? `: ${element.technology}` : ''}]`
              )
            : escapeHtml(element.name);
        nodes.push({
          id: element.id,
          label,
          parentId: element.parentId,
          isGroup: true,
          shape: 'rect',
          cssClasses: element.kind === 'node' ? 'c4-boundary c4-node' : 'c4-boundary',
          cssStyles: [],
          padding: 8,
          look: config.look,
        });
        continue;
      }
      // `external` is a built-in convention tag: it adds the `c4-external` class
      // (default grey comes from CSS, not inline styles) instead of the kind color.
      const isExternal = element.tags.includes('external');
      const colors = isExternal ? undefined : ELEMENT_COLORS[element.kind];
      const cssClasses = ['c4-shape', `c4-${element.kind}`];
      if (isExternal) {
        cssClasses.push('c4-external');
      }
      const cssStyles = colors ? [`fill: ${colors.fill}`, `stroke: ${colors.stroke}`] : [];
      let shape: Node['shape'] = element.kind === 'person' ? 'c4-person' : 'rect';
      // Tag styles are pushed after the built-in kind colors so they override them.
      // A user `style external fill:#...` therefore beats the default `.c4-external` rule.
      for (const tag of element.tags) {
        cssClasses.push(`c4-tag-${tag}`);
        const style = this.styles.get(tag);
        if (!style) {
          continue;
        }
        for (const key of ['fill', 'stroke', 'color'] as const) {
          if (style[key]) {
            cssStyles.push(`${key}: ${style[key]}`);
          }
        }
        if (style.shape) {
          shape = style.shape;
        }
      }
      nodes.push({
        id: element.id,
        label: buildElementLabel(element),
        parentId: element.parentId,
        isGroup: false,
        shape,
        cssClasses: cssClasses.join(' '),
        cssStyles,
        padding: 8,
        look: config.look,
      });
    }

    // In dynamic diagrams relationships are numbered in declaration order;
    // an explicit `N:` prefix overrides the counter, which continues from it.
    let nextStep = 1;
    this.relationships.forEach((relationship, index) => {
      if (boundaryIds.has(relationship.sourceId) && boundaryIds.has(relationship.targetId)) {
        log.warn(
          `c4-beta: relationship "${relationship.sourceId} ${relationship.arrow} ${relationship.targetId}" connects two clusters; relationships should connect leaf elements`
        );
      }
      let step: number | undefined;
      if (this.kind === 'dynamic') {
        step = relationship.step ?? nextStep;
        nextStep = step + 1;
      }
      const classes = ['c4-rel'];
      const style: string[] = [];
      let pattern = 'solid';
      for (const tag of relationship.tags) {
        classes.push(`c4-tag-${tag}`);
        const tagStyle = this.styles.get(tag);
        if (!tagStyle) {
          continue;
        }
        if (tagStyle.stroke) {
          style.push(`stroke: ${tagStyle.stroke}`);
        }
        if (tagStyle.color) {
          style.push(`color: ${tagStyle.color}`);
        }
        if (tagStyle.line) {
          pattern = tagStyle.line;
        }
      }
      edges.push({
        id: `c4-edge-${index}`,
        start: relationship.sourceId,
        end: relationship.targetId,
        type: 'normal',
        label: buildRelationshipLabel(relationship, step),
        labelpos: 'c',
        classes: classes.join(' '),
        style,
        arrowTypeStart: relationship.arrow === '-->' ? 'none' : 'arrow_point',
        arrowTypeEnd: relationship.arrow === '<--' ? 'none' : 'arrow_point',
        arrowheadStyle: 'fill: #333',
        thickness: 'normal',
        pattern,
        look: config.look,
      });
    });

    return { nodes, edges, other: {}, config, direction: this.direction };
  }

  public clear() {
    commonClear();
    this.elements = [];
    this.relationships = [];
    this.styles = new Map();
    this.direction = 'TB';
    this.kind = 'context';
  }

  public setAccTitle = setAccTitle;
  public getAccTitle = getAccTitle;
  public setDiagramTitle = setDiagramTitle;
  public getDiagramTitle = getDiagramTitle;
  public getAccDescription = getAccDescription;
  public setAccDescription = setAccDescription;
}
