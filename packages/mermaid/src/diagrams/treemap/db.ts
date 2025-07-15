import type { DiagramDB } from '../../diagram-api/types.js';
import type { DiagramStyleClassDef } from '../../diagram-api/types.js';
import type { TreemapDiagramConfig, TreemapNode } from './types.js';
import DEFAULT_CONFIG from '../../defaultConfig.js';
import { getConfig as commonGetConfig } from '../../config.js';
import { cleanAndMerge } from '../../utils.js';
import { isLabelStyle } from '../../rendering-util/rendering-elements/shapes/handDrawnShapeStyles.js';
import {
  clear as commonClear,
  getAccDescription,
  getAccTitle,
  getDiagramTitle,
  setAccDescription,
  setAccTitle,
  setDiagramTitle,
} from '../common/commonDb.js';
export class TreeMapDB implements DiagramDB {
  private nodes: TreemapNode[] = [];
  private levels: Map<TreemapNode, number> = new Map<TreemapNode, number>();
  private outerNodes: TreemapNode[] = [];
  private classes: Map<string, DiagramStyleClassDef> = new Map<string, DiagramStyleClassDef>();
  private root?: TreemapNode;

  constructor() {
    this.clear();
  }

  public getNodes() {
    return this.nodes;
  }

  public getConfig() {
    const defaultConfig = DEFAULT_CONFIG as unknown as { treemap: Required<TreemapDiagramConfig> };
    const userConfig = commonGetConfig() as unknown as { treemap?: Partial<TreemapDiagramConfig> };
    return cleanAndMerge({
      ...defaultConfig.treemap,
      ...(userConfig.treemap ?? {}),
    }) as Required<TreemapDiagramConfig>;
  }

  public addNode(node: TreemapNode, level: number) {
    this.nodes.push(node);
    this.levels.set(node, level);
    if (level === 0) {
      this.outerNodes.push(node);
      this.root ??= node;
    }
  }

  public getRoot() {
    return { name: '', children: this.outerNodes };
  }

  public addClass(id: string, _style: string) {
    const styleClass = this.classes.get(id) ?? { id, styles: [], textStyles: [] };
    const styles = _style.replace(/\\,/g, '§§§').replace(/,/g, ';').replace(/§§§/g, ',').split(';');
    if (styles) {
      styles.forEach((s) => {
        if (isLabelStyle(s)) {
          if (styleClass?.textStyles) {
            styleClass.textStyles.push(s);
          } else {
            styleClass.textStyles = [s];
          }
        }
        if (styleClass?.styles) {
          styleClass.styles.push(s);
        } else {
          styleClass.styles = [s];
        }
      });
    }
    this.classes.set(id, styleClass);
  }

  public getClasses() {
    return this.classes;
  }

  public getStylesForClass(classSelector: string): string[] {
    return this.classes.get(classSelector)?.styles ?? [];
  }

  public clear() {
    commonClear();
    this.nodes = [];
    this.levels = new Map();
    this.outerNodes = [];
    this.classes = new Map();
    this.root = undefined;
  }

  public setAccTitle = setAccTitle;
  public getAccTitle = getAccTitle;
  public setDiagramTitle = setDiagramTitle;
  public getDiagramTitle = getDiagramTitle;
  public getAccDescription = getAccDescription;
  public setAccDescription = setAccDescription;
}
