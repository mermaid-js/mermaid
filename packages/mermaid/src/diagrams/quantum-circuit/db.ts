import { getConfig as commonGetConfig } from '../../config.js';
import type { BaseDiagramConfig } from '../../config.type.js';
import type { DiagramDB } from '../../diagram-api/types.js';
import {
  clear as commonClear,
  getAccDescription,
  getAccTitle,
  getDiagramTitle,
  setAccDescription,
  setAccTitle,
  setDiagramTitle,
} from '../common/commonDb.js';
import type { ClassicalWire, Gate, Layer, Wire } from './types.js';

export class QuantumCircuitDB implements DiagramDB {
  private direction: 'LR' | 'TD' = 'LR';
  private wires: Wire[] = [];
  private cbits: ClassicalWire[] = [];
  private gates: Gate[] = [];
  private layers: Layer[] = [];

  public getConfig() {
    return commonGetConfig().quantumCircuit as BaseDiagramConfig | undefined;
  }

  public getDirection(): string {
    return this.direction;
  }

  public setDirection(dir: string) {
    if (dir === 'LR' || dir === 'TD') {
      this.direction = dir;
    }
  }

  public getWires(): Wire[] {
    return this.wires;
  }

  public setWires(w: Wire[]) {
    this.wires = w;
  }

  public addWire(name: string) {
    this.wires.push({ name, initialState: '0' });
  }

  public getCbits(): ClassicalWire[] {
    return this.cbits;
  }

  public setCbits(c: ClassicalWire[]) {
    this.cbits = c;
  }

  public getGates(): Gate[] {
    return this.gates;
  }

  public addGate(gate: Gate) {
    this.gates.push(gate);
  }

  public getLayers(): Layer[] {
    return this.layers;
  }

  public setLayers(l: Layer[]) {
    this.layers = l;
  }

  public clear() {
    commonClear();
    this.direction = 'LR';
    this.wires = [];
    this.cbits = [];
    this.gates = [];
    this.layers = [];
  }

  public setAccTitle = setAccTitle;
  public getAccTitle = getAccTitle;
  public setDiagramTitle = setDiagramTitle;
  public getDiagramTitle = getDiagramTitle;
  public getAccDescription = getAccDescription;
  public setAccDescription = setAccDescription;
}
