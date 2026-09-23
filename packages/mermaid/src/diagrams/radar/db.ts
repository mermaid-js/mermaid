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
import { log } from '../../logger.js';

const defaultOptions: RadarOptions = {
  showLegend: true,
  ticks: 5,
  max: null,
  min: 0,
  graticule: 'circle',
};

// Can't see people using more than this, since the gradient makes the diagram unreadable.
const MAX_TICKS = 32;

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
      ...computeCurveEntries(curve.entries),
    };
  });
};

const computeCurveEntries = (entries: Entry[]): Pick<RadarCurve, 'entries' | 'startEntries'> => {
  // If entries have axis reference, we must order them according to the axes
  const orderedEntries = (() => {
    if (entries[0].axis == undefined) {
      return entries;
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
      return entry;
    });
  })();

  const parsedEntries = orderedEntries.map((entry) => {
    if (entry.range !== undefined) {
      const [start, end] = entry.range.slice(1, -1).split('..').map(Number);
      if (start > end) {
        throw new Error(`Curve range start (${start}) must not exceed end (${end})`);
      }
      return { start, end };
    }
    if (entry.value === undefined) {
      throw new Error('Curve entry must contain a value or range');
    }
    return { start: null, end: entry.value };
  });

  const result: Pick<RadarCurve, 'entries' | 'startEntries'> = {
    entries: parsedEntries.map(({ end }) => end),
  };
  if (parsedEntries.some(({ start }) => start !== null)) {
    result.startEntries = parsedEntries.map(({ start }) => start);
  }
  return result;
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

  if (data.options.ticks > MAX_TICKS) {
    log.warn(
      `Radar diagram ticks (${data.options.ticks}) exceeds maximum allowed (${MAX_TICKS}). Using ${MAX_TICKS} instead.`
    );
    data.options.ticks = MAX_TICKS;
  }
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
