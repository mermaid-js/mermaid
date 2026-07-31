import type { PieDiagramConfig } from '../../config.type.js';
import type { DiagramDB } from '../../diagram-api/types.js';

export interface PieFields {
  sections: Sections;
  showData: boolean;
  config: PieDiagramConfig;
}

export interface PieStyleOptions {
  fontFamily: string;
  pie1: string;
  pie2: string;
  pie3: string;
  pie4: string;
  pie5: string;
  pie6: string;
  pie7: string;
  pie8: string;
  pie9: string;
  pie10: string;
  pie11: string;
  pie12: string;
  pieTitleTextSize: string;
  pieTitleTextColor: string;
  pieSectionTextSize: string;
  pieSectionTextColor: string;
  pieLegendTextSize: string;
  pieLegendTextColor: string;
  pieStrokeColor: string;
  pieStrokeWidth: string;
  pieOuterStrokeWidth: string;
  pieOuterStrokeColor: string;
  pieOpacity: string;
}

export type Sections = Map<string, number>;

export interface D3Section {
  label: string;
  value: number;
}

export interface PieDB extends DiagramDB {
  // config
  getConfig: () => Required<PieDiagramConfig>;

  // common db
  clear: () => void;
  setDiagramTitle: (title: string) => void;
  getDiagramTitle: () => string;
  setAccTitle: (title: string) => void;
  getAccTitle: () => string;
  setAccDescription: (description: string) => void;
  getAccDescription: () => string;

  // diagram db
  addSection: ({ label, value }: D3Section) => void;
  getSections: () => Sections;
  setShowData: (toggle: boolean) => void;
  getShowData: () => boolean;
}
