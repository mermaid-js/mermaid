import { log } from '../../logger.js';
import { CommonDB } from '../common/commonDb.js';
import type { PieFields, PieDB as PieDBBase, Sections, D3Section } from './pieTypes.js';
import type { RequiredDeep } from 'type-fest';
import type { PieDiagramConfig } from '../../config.type.js';
import DEFAULT_CONFIG from '../../defaultConfig.js';

export const DEFAULT_PIE_CONFIG: Required<PieDiagramConfig> = DEFAULT_CONFIG.pie;

export const DEFAULT_PIE_DB: RequiredDeep<PieFields> = {
  sections: new Map(),
  showData: false,
  config: DEFAULT_PIE_CONFIG,
} as const;

export class PieDB implements PieDBBase {
  private readonly common = new CommonDB();
  private sections: Sections = new Map();
  private showData: boolean = DEFAULT_PIE_DB.showData;
  private readonly config: Required<PieDiagramConfig> = structuredClone(DEFAULT_PIE_CONFIG);

  public getConfig = (): Required<PieDiagramConfig> => structuredClone(this.config);

  public clear = (): void => {
    this.sections = new Map();
    this.showData = DEFAULT_PIE_DB.showData;
    this.common.clear();
  };

  public addSection = ({ label, value }: D3Section): void => {
    if (value < 0) {
      throw new Error(
        `"${label}" has invalid value: ${value}. Negative values are not allowed in pie charts. All slice values must be >= 0.`
      );
    }
    if (!this.sections.has(label)) {
      this.sections.set(label, value);
      log.debug(`added new section: ${label}, with value: ${value}`);
    }
  };

  public getSections = (): Sections => this.sections;

  public setShowData = (toggle: boolean): void => {
    this.showData = toggle;
  };

  public getShowData = (): boolean => this.showData;

  public setDiagramTitle = this.common.setDiagramTitle;
  public getDiagramTitle = this.common.getDiagramTitle;
  public setAccTitle = this.common.setAccTitle;
  public getAccTitle = this.common.getAccTitle;
  public setAccDescription = this.common.setAccDescription;
  public getAccDescription = this.common.getAccDescription;
}
