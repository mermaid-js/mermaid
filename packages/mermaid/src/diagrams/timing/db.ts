import { getConfig as getCommonConfig } from '../../config.js';
import type { TimingDiagramConfig } from '../../config.type.js';
import DEFAULT_CONFIG from '../../defaultConfig.js';
import { cleanAndMerge } from '../../utils.js';
import { ImperativeState } from '../../utils/imperativeState.js';
import { sanitizeText } from '../common/common.js';
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
  AnalogOptions,
  ClockOptions,
  TimingDB,
  TimingSegment,
  TimingSignal,
  TimingSignalDefinition,
  TimingValue,
} from './types.js';

interface TimingState {
  signals: Map<string, TimingSignal>;
  order: string[];
  timeUnit: string;
}

const state = new ImperativeState<TimingState>(() => ({
  signals: new Map(),
  order: [],
  timeUnit: '',
}));

const getConfig = (): Required<TimingDiagramConfig> =>
  cleanAndMerge(DEFAULT_CONFIG.timing, getCommonConfig().timing);

const cleanText = (value: string): string => sanitizeText(value, getCommonConfig());

const assertFiniteNonNegative = (value: number, description: string): void => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${description} must be a finite, non-negative number`);
  }
};

const validateClock = (id: string, clock: ClockOptions | undefined): ClockOptions => {
  if (!clock || !Number.isFinite(clock.period) || clock.period <= 0) {
    throw new Error(`Clock "${id}" must have a period greater than 0`);
  }
  if (!Number.isFinite(clock.duty) || clock.duty < 0 || clock.duty > 100) {
    throw new Error(`Clock "${id}" duty must be between 0% and 100%`);
  }
  assertFiniteNonNegative(clock.offset, `Clock "${id}" offset`);
  return clock;
};

const validateAnalog = (id: string, analog: AnalogOptions | undefined): AnalogOptions => {
  const options = analog ?? { interpolation: 'linear' as const };
  if (options.min !== undefined && !Number.isFinite(options.min)) {
    throw new Error(`Analog signal "${id}" minimum must be finite`);
  }
  if (options.max !== undefined && !Number.isFinite(options.max)) {
    throw new Error(`Analog signal "${id}" maximum must be finite`);
  }
  if (options.min !== undefined && options.max !== undefined && options.min >= options.max) {
    throw new Error(`Analog signal "${id}" minimum must be less than its maximum`);
  }
  return options;
};

const addSignal = (definition: TimingSignalDefinition): void => {
  if (state.records.signals.has(definition.id)) {
    throw new Error(`Signal "${definition.id}" is already declared`);
  }

  const signal: TimingSignal = {
    id: definition.id,
    label: cleanText(definition.label),
    type: definition.type,
    sequence: [],
    events: [],
  };

  if (definition.type === 'clock') {
    signal.clock = validateClock(definition.id, definition.clock);
  } else if (definition.type === 'analog') {
    signal.analog = validateAnalog(definition.id, definition.analog);
  } else if (definition.type === 'state') {
    signal.states = (definition.states ?? []).map(cleanText);
  }

  state.records.signals.set(definition.id, signal);
  state.records.order.push(definition.id);
};

const requireSignal = (id: string): TimingSignal => {
  const signal = state.records.signals.get(id);
  if (!signal) {
    throw new Error(`Unknown timing signal "${id}"`);
  }
  return signal;
};

const normalizeValue = (signal: TimingSignal, value: TimingValue): TimingValue => {
  if (signal.type === 'binary') {
    const normalized = String(value).toLowerCase();
    if (normalized === '0' || normalized === 'low' || normalized === 'false') {
      return 0;
    }
    if (normalized === '1' || normalized === 'high' || normalized === 'true') {
      return 1;
    }
    if (normalized === 'x' || normalized === 'unknown') {
      return 'x';
    }
    if (normalized === 'z') {
      return 'z';
    }
    throw new Error(
      `Binary signal "${signal.id}" values must be 0, 1, low, high, false, true, X, or Z`
    );
  }

  if (signal.type === 'analog') {
    const numericValue = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numericValue)) {
      throw new Error(`Analog signal "${signal.id}" values must be numbers`);
    }
    return numericValue;
  }

  return typeof value === 'string' ? cleanText(value) : String(value);
};

const assertValuesAllowed = (signal: TimingSignal): void => {
  if (signal.type === 'clock') {
    throw new Error(
      `Clock "${signal.id}" is generated from its declaration and cannot have values`
    );
  }
};

const setSequence = (id: string, segments: TimingSegment[]): void => {
  const signal = requireSignal(id);
  assertValuesAllowed(signal);
  if (signal.events.length > 0) {
    throw new Error(`Signal "${id}" cannot mix a value sequence with "at" transitions`);
  }
  if (signal.sequence.length > 0) {
    throw new Error(`Signal "${id}" already has a value sequence`);
  }
  if (segments.length === 0) {
    throw new Error(`Signal "${id}" must contain at least one value`);
  }
  signal.sequence = segments.map(({ value, duration }) => {
    if (!Number.isSafeInteger(duration) || duration <= 0) {
      throw new Error(`Signal "${id}" run lengths must be positive integers`);
    }
    return { value: normalizeValue(signal, value), duration };
  });
};

const addEvent = (id: string, time: number, value: TimingValue): void => {
  const signal = requireSignal(id);
  assertValuesAllowed(signal);
  assertFiniteNonNegative(time, 'Timing transition time');
  if (signal.sequence.length > 0) {
    throw new Error(`Signal "${id}" cannot mix a value sequence with "at" transitions`);
  }
  if (signal.events.some((event) => event.time === time)) {
    throw new Error(`Signal "${id}" already has a transition at time ${time}`);
  }
  signal.events.push({ time, value: normalizeValue(signal, value) });
  signal.events.sort((a, b) => a.time - b.time);
};

const setTimeUnit = (unit: string): void => {
  state.records.timeUnit = cleanText(unit);
};

const getTimeUnit = (): string => state.records.timeUnit;
const getSignals = (): readonly TimingSignal[] =>
  state.records.order.map((id) => state.records.signals.get(id)!);
const getSignal = (id: string): TimingSignal | undefined => state.records.signals.get(id);

const clear = (): void => {
  state.reset();
  commonClear();
};

export const db: TimingDB = {
  addSignal,
  setSequence,
  addEvent,
  setTimeUnit,
  getTimeUnit,
  getSignals,
  getSignal,
  getConfig,
  clear,
  getAccTitle,
  getAccDescription,
  getDiagramTitle,
  setAccDescription,
  setAccTitle,
  setDiagramTitle,
};
