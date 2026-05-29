import type { DiagramDB } from '../../diagram-api/types.js';
import type { DiagramStyleClassDef } from '../../diagram-api/types.js';
import type { DitaaDiagram, DitaaDiagramConfig, DitaaDB } from './types.js';
import DEFAULT_CONFIG from '../../defaultConfig.js';
import { getConfig as commonGetConfig } from '../../config.js';
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

export class DitaaDBImpl implements DiagramDB, DitaaDB {
  private diagram: DitaaDiagram | undefined = undefined;
  private classes = new Map<string, DiagramStyleClassDef>();

  public setDiagram(diagram: DitaaDiagram): void {
    this.diagram = diagram;
  }

  public getDiagram(): DitaaDiagram | undefined {
    return this.diagram;
  }

  public getConfig(): Required<DitaaDiagramConfig> {
    const defaultConfig = DEFAULT_CONFIG as unknown as { ditaa: Required<DitaaDiagramConfig> };
    const userConfig = commonGetConfig() as unknown as { ditaa?: Partial<DitaaDiagramConfig> };
    return cleanAndMerge({
      ...defaultConfig.ditaa,
      ...(userConfig.ditaa ?? {}),
    }) as Required<DitaaDiagramConfig>;
  }

  public getClasses(): Map<string, DiagramStyleClassDef> {
    return this.classes;
  }

  public clear(): void {
    commonClear();
    this.diagram = undefined;
    this.classes = new Map();
  }

  public setAccTitle = setAccTitle;
  public getAccTitle = getAccTitle;
  public setDiagramTitle = setDiagramTitle;
  public getDiagramTitle = getDiagramTitle;
  public getAccDescription = getAccDescription;
  public setAccDescription = setAccDescription;
}
