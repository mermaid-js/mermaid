export interface Wire {
  name: string;
  initialState: string;
}

export interface ClassicalWire {
  name: string;
}

export interface WireRef {
  wire: string;
  zeroControl: boolean;
}

export interface Gate {
  name: string;
  params?: string;
  wireRefs: WireRef[];
  captureTarget?: string;
  conditionCbit?: string;
}

export type Layer = (ScheduledGate | Barrier)[];

export interface ScheduledGate {
  name: string;
  params?: string;
  wireRefs: WireRef[];
  captureTarget?: string;
  conditionCbit?: string;
}

export interface Barrier {
  type: 'barrier';
}

export interface QuantumCircuitData {
  direction: 'LR' | 'TD';
  wires: Wire[];
  cbits: ClassicalWire[];
  layers: Layer[];
}

export interface QuantumCircuitStyleOptions {
  columnWidth?: number;
  rowHeight?: number;
  wireSpacing?: number;
  gateFontSize?: number;
  showWireLabels?: boolean;
  wireColor?: string;
  classicalWireColor?: string;
  gateColor?: string;
  controlColor?: string;
}
