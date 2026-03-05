import { getConfig as commonGetConfig } from '../../config.js';
import type { RadarDiagramConfig } from '../../config.type.js';
import DEFAULT_CONFIG from '../../defaultConfig.js';
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
import type {
  Axis,
  Curve,
  Option,
  Entry,
} from '../../../../parser/dist/src/language/generated/ast.js';
import type { RadarAxis, RadarCurve, RadarOptions, RadarDB, RadarData } from './types.js';

const defaultOptions: RadarOptions = {
  showLegend: true,
  ticks: 5,
  max: null,
  min: 0,
  graticule: 'circle',
};

const defaultRadarData: RadarData = {
  axes: [],
  curves: [],
  options: defaultOptions,
};

let data: RadarData = structuredClone(defaultRadarData);

const DEFAULT_RADAR_CONFIG: Required<RadarDiagramConfig> = DEFAULT_CONFIG.radar;

const getConfig = (): Required<RadarDiagramConfig> => {
  const config = cleanAndMerge({
    ...DEFAULT_RADAR_CONFIG,
    ...commonGetConfig().radar,
  });
  return config;
};

const getAxes = (): RadarAxis[] => data.axes;
const getCurves = (): RadarCurve[] => data.curves;
const getOptions = (): RadarOptions => data.options;

const setAxes = (axes: Axis[]) => {
  data.axes = axes.map((axis) => {
    return {
      name: axis.name,
      label: axis.label ?? axis.name,
    };
  });
};

const setCurves = (curves: Curve[]) => {
  data.curves = curves.map((curve) => {
    return {
      name: curve.name,
      label: curve.label ?? curve.name,
      entries: computeCurveEntries(curve.entries),
    };
  });
};

const computeCurveEntries = (entries: Entry[]): number[] => {
  // If entries have axis reference, we must order them according to the axes
  if (entries[0].axis == undefined) {
    return entries.map((entry) => entry.value);
  }
  const axes = getAxes();
  if (axes.length === 0) {
    throw new Error('Axes must be populated before curves for reference entries');
  }
  return axes.map((axis) => {
    const entry = entries.find((entry) => entry.axis?.$refText === axis.name);
    if (entry === undefined) {
      throw new Error('Missing entry for axis ' + axis.label);
    }
    return entry.value;
  });
};

const setOptions = (options: Option[]) => {
  // Create a map from option names to option objects for quick lookup
  const optionMap = options.reduce(
    (acc, option) => {
      acc[option.name] = option;
      return acc;
    },
    {} as Record<string, Option>
  );

  data.options = {
    showLegend: (optionMap.showLegend?.value as boolean) ?? defaultOptions.showLegend,
    ticks: (optionMap.ticks?.value as number) ?? defaultOptions.ticks,
    max: (optionMap.max?.value as number) ?? defaultOptions.max,
    min: (optionMap.min?.value as number) ?? defaultOptions.min,
    graticule: (optionMap.graticule?.value as 'circle' | 'polygon') ?? defaultOptions.graticule,
  };
};

const clear = () => {
  commonClear();
  data = structuredClone(defaultRadarData);
};

export const db: RadarDB = {
  getAxes,
  getCurves,
  getOptions,
  setAxes,
  setCurves,
  setOptions,
  getConfig,
  clear,
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  getAccDescription,
  setAccDescription,
};
