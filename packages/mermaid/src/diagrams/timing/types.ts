import type { TimingDiagramConfig } from '../../config.type.js';
import type { DiagramDBBase } from '../../diagram-api/types.js';

export type TimingSignalType = 'clock' | 'binary' | 'state' | 'bus' | 'analog';
export type TimingValue = string | number;
export type AnalogInterpolation = 'linear' | 'step';

export interface TimingSegment {
  value: TimingValue;
  duration: number;
}

export interface PositionedTimingSegment extends TimingSegment {
  start: number;
  end: number;
}

export interface TimingEvent {
  time: number;
  value: TimingValue;
}

export interface ClockOptions {
  period: number;
  duty: number;
  offset: number;
}

export interface AnalogOptions {
  min?: number;
  max?: number;
  interpolation: AnalogInterpolation;
}

export interface TimingSignal {
  id: string;
  label: string;
  type: TimingSignalType;
  clock?: ClockOptions;
  analog?: AnalogOptions;
  states?: string[];
  sequence: TimingSegment[];
  events: TimingEvent[];
}

export type TimingSignalDefinition = Pick<TimingSignal, 'id' | 'label' | 'type'> &
  Partial<Pick<TimingSignal, 'clock' | 'analog' | 'states'>>;

export interface TimingDB extends DiagramDBBase<TimingDiagramConfig> {
  addSignal: (definition: TimingSignalDefinition) => void;
  setSequence: (id: string, segments: TimingSegment[]) => void;
  addEvent: (id: string, time: number, value: TimingValue) => void;
  setTimeUnit: (unit: string) => void;
  getTimeUnit: () => string;
  getSignals: () => readonly TimingSignal[];
  getSignal: (id: string) => TimingSignal | undefined;
}

export interface TimingStyleOptions {
  background?: string;
  fontFamily?: string;
  fontSize?: string;
  lineColor?: string;
  textColor?: string;
  titleColor?: string;
  primaryColor?: string;
  primaryTextColor?: string;
  primaryBorderColor?: string;
  secondaryColor?: string;
  tertiaryColor?: string;
}
