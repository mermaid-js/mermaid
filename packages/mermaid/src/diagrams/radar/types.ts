import type { Axis, Curve, Option } from '../../../../parser/dist/src/language/generated/ast.js';
import type { RadarDiagramConfig } from '../../config.type.js';
import type { DiagramDBBase } from '../../diagram-api/types.js';

export interface RadarAxis {
  name: string;
  label: string;
}
export interface RadarCurve {
  name: string;
  entries: number[];
  label: string;
}
export interface RadarOptions {
  showLegend: boolean;
  ticks: number;
  max: number | null;
  min: number;
  graticule: 'circle' | 'polygon';
}
export interface RadarDB extends DiagramDBBase<RadarDiagramConfig> {
  getAxes: () => RadarAxis[];
  getCurves: () => RadarCurve[];
  getOptions: () => RadarOptions;
  setAxes: (axes: Axis[]) => void;
  setCurves: (curves: Curve[]) => void;
  setOptions: (options: Option[]) => void;
}

export interface RadarStyleOptions {
  axisColor?: string;
  axisStrokeWidth?: number;
  axisLabelFontSize?: number;
  curveOpacity?: number;
  curveStrokeWidth?: number;
  graticuleColor?: string;
  graticuleOpacity?: number;
  graticuleStrokeWidth?: number;
  legendBoxSize?: number;
  legendFontSize?: number;
}

export interface RadarData {
  axes: RadarAxis[];
  curves: RadarCurve[];
  options: RadarOptions;
}
