import type { WireframeDiagram, WireframeComponent, ActionBar } from '@mermaid-js/parser';
import { getConfig as commonGetConfig } from '../../config.js';
import type { WireframeDiagramConfig } from '../../config.type.js';
import DEFAULT_CONFIG from '../../defaultConfig.js';
import type { DiagramDB } from '../../diagram-api/types.js';
import { cleanAndMerge } from '../../utils.js';
import {
  clear as commonClear,
  getAccDescription,
  getAccTitle,
  getDiagramTitle,
  setAccDescription,
  setAccTitle,
  setDiagramTitle,
} from '../common/commonDb.js';
import type { CanvasSizePreset } from './types.js';
import { CANVAS_SIZE_MAP } from './types.js';

const DEFAULT_WIREFRAME_CONFIG: Required<WireframeDiagramConfig> = DEFAULT_CONFIG.wireframe ?? {
  padding: 10,
  containerPadding: 15,
  defaultCanvasSize: 'desktop',
  fontFamily: 'sans-serif',
  fontSize: 14,
};

export class WireframeDB implements DiagramDB {
  private ast?: WireframeDiagram;
  private diagramId = '';

  constructor() {
    this.clear();
  }

  public setDiagramId(id: string): void {
    this.diagramId = id;
  }

  public getDiagramId(): string {
    return this.diagramId;
  }

  public getConfig = (): Required<WireframeDiagramConfig> => {
    return cleanAndMerge(DEFAULT_WIREFRAME_CONFIG, commonGetConfig().wireframe);
  };

  public clear = (): void => {
    commonClear();
    this.ast = undefined;
    this.diagramId = '';
  };

  public setWireframe = (ast: WireframeDiagram): void => {
    this.ast = ast;
  };

  public getWireframe = (): WireframeDiagram | undefined => {
    return this.ast;
  };

  public getCanvasSize = (): CanvasSizePreset => {
    const parsedPreset = this.ast?.canvasSize as CanvasSizePreset | undefined;
    const configPreset = this.getConfig().defaultCanvasSize as CanvasSizePreset | undefined;
    const resolvedPreset =
      parsedPreset && parsedPreset in CANVAS_SIZE_MAP ? parsedPreset : (configPreset ?? 'desktop');
    return resolvedPreset;
  };

  public getCanvasDimensions = (): { width: number; height: number } => {
    const sizePreset = this.getCanvasSize();
    return CANVAS_SIZE_MAP[sizePreset] ?? CANVAS_SIZE_MAP.desktop;
  };

  public getActionBar = (): ActionBar | undefined => {
    return this.ast?.actions;
  };

  public getComponents = (): WireframeComponent[] => {
    return (this.ast?.components as unknown as WireframeComponent[]) ?? [];
  };

  public setAccTitle = setAccTitle;
  public getAccTitle = getAccTitle;
  public setAccDescription = setAccDescription;
  public getAccDescription = getAccDescription;
  public setDiagramTitle = setDiagramTitle;
  public getDiagramTitle = getDiagramTitle;
}

export const db = new WireframeDB();
export default db;
