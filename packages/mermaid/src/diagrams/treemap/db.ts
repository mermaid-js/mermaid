import type { DiagramDB } from '../../diagram-api/types.js';
import { ImperativeState } from '../../utils/imperativeState.js';
import type { TreemapData, TreemapDiagramConfig, TreemapNode } from './types.js';
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
  private data: TreemapData;
  private state: ImperativeState<TreemapData>;

  constructor() {
    this.data = {
      nodes: [],
      levels: new Map(),
      outerNodes: [],
      classes: new Map(),
    };

    this.state = new ImperativeState<TreemapData>(() => structuredClone(this.data));
  }

  public getNodes() {
    return this.state.records.nodes;
  }

  public getConfig() {
    // Use type assertion with unknown as intermediate step
    const defaultConfig = DEFAULT_CONFIG as unknown as { treemap: Required<TreemapDiagramConfig> };
    const userConfig = commonGetConfig() as unknown as { treemap?: Partial<TreemapDiagramConfig> };

    return cleanAndMerge({
      ...defaultConfig.treemap,
      ...(userConfig.treemap ?? {}),
    }) as Required<TreemapDiagramConfig>;
  }

  public addNode(node: TreemapNode, level: number) {
    const data = this.state.records;
    data.nodes.push(node);
    data.levels.set(node, level);

    if (level === 0) {
      data.outerNodes.push(node);
    }

    // Set the root node if this is a level 0 node and we don't have a root yet
    if (level === 0 && !data.root) {
      data.root = node;
    }
  }

  public getRoot() {
    return { name: '', children: this.state.records.outerNodes };
  }

  public addClass(id: string, _style: string) {
    // const classes = this.state.records.classes;
    const styleClass = this.state.records.classes.get(id) ?? { id, styles: [], textStyles: [] };
    this.state.records.classes.set(id, styleClass);

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

    this.state.records.classes.set(id, styleClass);
  }

  public getClasses() {
    return this.state.records.classes;
  }

  public getStylesForClass(classSelector: string): string[] {
    return this.state.records.classes.get(classSelector)?.styles ?? [];
  }

  public clear = () => {
    commonClear();
    this.state.reset();
  };

  public setAccTitle = setAccTitle;
  public setAccDescription = setAccDescription;
  public setDiagramTitle = setDiagramTitle;
  public getAccTitle = getAccTitle;
  public getAccDescription = getAccDescription;
  public getDiagramTitle = getDiagramTitle;
}
