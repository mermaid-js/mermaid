import { getConfig } from '../../config.js';
import type { DiagramDB } from '../../diagram-api/types.js';
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
  C4DiagramKind,
  C4Direction,
  C4ElementKind,
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

const EXTERNAL_COLORS: ElementColors = { fill: '#999999', stroke: '#8A8A8A' };

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

const buildRelationshipLabel = (relationship: C4BetaRelationship): string | undefined => {
  if (!relationship.description) {
    return undefined;
  }
  const lines: string[] = [`<b>${escapeHtml(relationship.description)}</b>`];
  if (relationship.technology) {
    lines.push(`<small><i>[${escapeHtml(relationship.technology)}]</i></small>`);
  }
  return lines.join('<br/>');
};

export class C4BetaDB implements DiagramDB {
  private elements: C4BetaElement[] = [];
  private relationships: C4BetaRelationship[] = [];
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

  public getData(): LayoutData {
    const config = getConfig();
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Any element containing other elements is rendered as a boundary cluster.
    const boundaryIds = new Set(
      this.elements
        .map((element) => element.parentId)
        .filter((parentId): parentId is string => parentId !== undefined)
    );

    for (const element of this.elements) {
      if (boundaryIds.has(element.id)) {
        nodes.push({
          id: element.id,
          label: escapeHtml(element.name),
          parentId: element.parentId,
          isGroup: true,
          shape: 'rect',
          cssClasses: 'c4-boundary',
          cssStyles: [],
          padding: 8,
          look: config.look,
        });
        continue;
      }
      const colors = element.external ? EXTERNAL_COLORS : ELEMENT_COLORS[element.kind];
      nodes.push({
        id: element.id,
        label: buildElementLabel(element),
        parentId: element.parentId,
        isGroup: false,
        shape: 'rect',
        cssClasses: `c4-shape c4-${element.kind}` + (element.external ? ' c4-external' : ''),
        cssStyles: colors ? [`fill: ${colors.fill}`, `stroke: ${colors.stroke}`] : [],
        padding: 8,
        look: config.look,
      });
    }

    this.relationships.forEach((relationship, index) => {
      edges.push({
        id: `c4-edge-${index}`,
        start: relationship.sourceId,
        end: relationship.targetId,
        type: 'normal',
        label: buildRelationshipLabel(relationship),
        labelpos: 'c',
        classes: 'c4-rel',
        arrowTypeStart: relationship.arrow === '-->' ? 'none' : 'arrow_point',
        arrowTypeEnd: relationship.arrow === '<--' ? 'none' : 'arrow_point',
        arrowheadStyle: 'fill: #333',
        thickness: 'normal',
        pattern: 'solid',
        look: config.look,
      });
    });

    return { nodes, edges, other: {}, config, direction: this.direction };
  }

  public clear() {
    commonClear();
    this.elements = [];
    this.relationships = [];
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
