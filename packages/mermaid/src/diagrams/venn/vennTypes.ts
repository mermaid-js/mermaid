import type { DiagramDBBase } from '../../diagram-api/types.js';
import type { VennDiagramConfig } from '../../config.type.js';

export interface VennData {
  sets: string[];
  size: number;
  label: string | undefined;
  color: string | undefined;
  background: string | undefined;
}

export interface VennTextData {
  sets: string[];
  id: string;
  label?: string;
  color: string | undefined;
}

export interface VennDB extends DiagramDBBase<VennDiagramConfig> {
  addSubsetData: (identifierList: string[], data: [string, string][] | undefined) => void;
  addTextData: (
    identifierList: string[],
    text: string,
    data: [string, string][] | undefined
  ) => void;
  validateUnionIdentifiers: (identifierList: string[]) => void;
  getSubsetData: () => VennData[];
  getTextData: () => VennTextData[];
  getCurrentSets: () => string[] | undefined;
  getIndentMode: () => boolean;
  setIndentMode: (enabled: boolean) => void;
}
