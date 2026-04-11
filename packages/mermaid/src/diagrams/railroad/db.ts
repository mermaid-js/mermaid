import { getConfig as commonGetConfig } from '../../config.js';
import type { RailroadDiagramConfig } from '../../config.type.js';
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

const DEFAULT_RAILROAD_CONFIG: Required<RailroadDiagramConfig> = DEFAULT_CONFIG.railroad;

export class RailroadDB implements DiagramDB {
  private source = '';

  public getConfig(): Required<RailroadDiagramConfig> {
    return cleanAndMerge({
      ...DEFAULT_RAILROAD_CONFIG,
      ...commonGetConfig().railroad,
    });
  }

  public setSource(source: string) {
    this.source = source;
  }

  public getSource() {
    return this.source;
  }

  public clear() {
    commonClear();
    this.source = '';
  }

  public setAccTitle = setAccTitle;
  public getAccTitle = getAccTitle;
  public setDiagramTitle = setDiagramTitle;
  public getDiagramTitle = getDiagramTitle;
  public getAccDescription = getAccDescription;
  public setAccDescription = setAccDescription;
}
