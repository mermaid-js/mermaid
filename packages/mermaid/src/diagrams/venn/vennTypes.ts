import type { DiagramDBBase } from '../../diagram-api/types.js';
import type { VennDiagramConfig } from '../../config.type.js';

export interface VennData {
  sets: string[];
  size: number;
  label: string | undefined;
  color: string | undefined;
  background: string | undefined;
}

export interface VennDB extends DiagramDBBase<VennDiagramConfig> {
  addSubsetData: (identifierList: string[], data: [string, string][] | undefined) => void;
  getSubsetData: () => VennData[];
}
