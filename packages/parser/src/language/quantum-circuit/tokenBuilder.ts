import { AbstractMermaidTokenBuilder } from '../common/index.js';

export class QuantumCircuitTokenBuilder extends AbstractMermaidTokenBuilder {
  public constructor() {
    super(['quantumCircuit', 'quantumCircuit-beta', 'LR', 'TD', 'wires', 'cbits', 'barrier']);
  }
}