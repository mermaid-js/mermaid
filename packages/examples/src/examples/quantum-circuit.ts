import type { DiagramMetadata } from '../types.js';

export default {
  id: 'quantumCircuit',
  name: 'Quantum Circuit',
  description: 'Visualize quantum circuits with gates, measurements, and multi-qubit operations',
  examples: [
    {
      title: 'Bell State Preparation',
      isDefault: true,
      code: `quantumCircuit LR
    wires q0(0), q1(0)
    H[q0]
    CNOT[q0, q1]
    M[q0]
    M[q1]`,
    },
    {
      title: 'Quantum Teleportation',
      code: `quantumCircuit LR
    wires msg(psi), alice(0), bob(0)
    cbits c_msg, c_alice
    H[alice]
    CNOT[alice, bob]
    CNOT[msg, alice]
    H[msg]
    M[msg]   -> c_msg
    M[alice] -> c_alice
    X[bob] if c_alice
    Z[bob] if c_msg`,
    },
    {
      title: 'Toffoli Gate with Zero‑Control',
      code: `quantumCircuit LR
    wires a(0), b(0), c(0)
    H[a]
    H[b]
    CCX[!a, b, c]
    M[a]
    M[b]
    M[c]`,
    },
    {
      title: 'SWAP Gate',
      code: `quantumCircuit LR
    wires a(psi), b(phi)
    H[a]
    H[b]
    SWAP[a, b]
    M[a]
    M[b]`,
    },
    {
      title: 'Bell State (Top‑Down)',
      code: `quantumCircuit TD
    wires q0(0), q1(0)
    H[q0]
    CNOT[q0, q1]
    M[q0]
    M[q1]`,
    },
    {
      title: 'Measurement Feed‑Forward',
      code: `quantumCircuit LR
    wires q0(0), q1(0)
    cbits c0
    H[q0]
    M[q0] -> c0
    X[q1] if c0`,
    },
  ],
} satisfies DiagramMetadata;
