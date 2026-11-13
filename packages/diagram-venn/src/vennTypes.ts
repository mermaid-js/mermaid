import type { DiagramDBBase } from '../../diagram-api/types.js';
import type { VennDiagramConfig } from '../../config.type.js';

export interface VennData {
  sets: string[];
  size: number;
  label: string | undefined;
}

export interface VennTextData {
  sets: string[];
  id: string;
  label: string | undefined;
}

export interface VennStyleData {
  targets: string[];
  styles: Record<string, string>;
}

export interface VennDB extends DiagramDBBase<VennDiagramConfig> {
  addSubsetData: (
    identifierList: string[],
    label: string | undefined,
    size: number | undefined
  ) => void;
  addTextData: (identifierList: string[], id: string, label: string | undefined) => void;
  addStyleData: (identifierList: string[], data: [string, string][]) => void;
  validateUnionIdentifiers: (identifierList: string[]) => void;
  getSubsetData: () => VennData[];
  getTextData: () => VennTextData[];
  getStyleData: () => VennStyleData[];
  getCurrentSets: () => string[] | undefined;
  getIndentMode: () => boolean;
  setIndentMode: (enabled: boolean) => void;
}
