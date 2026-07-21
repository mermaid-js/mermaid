# Quantum Circuit Diagram (vNext.0.0+)

> A quantum circuit is a model for quantum computation, where a computation is
> a sequence of quantum gates acting on qubits.  Quantum circuits are drawn
> with horizontal wires representing qubits and boxes or symbols representing
> gate operations, flowing left‑to‑right (or top‑to‑bottom) over discrete time
> steps. — adapted from
> [Wikipedia](https://en.wikipedia.org/wiki/Quantum_circuit)

Mermaid can render quantum circuit diagrams.  The syntax is **gate‑centered**:
each instruction declares which wires it acts on, and the rendering engine
automatically lays out the time steps.

```mermaid-example
quantumCircuit LR
    wires q0(0), q1(0)
    H[q0]
    CNOT[q0, q1]
    M[q0]
    M[q1]
```

## Quick Start

A minimal circuit needs only gate declarations — wires are created on first
reference and default to initial state `(0)`:

```mermaid-example
quantumCircuit
    H[0]
    CNOT[0, 1]
    M[0]
    M[1]
```

Every wire has an implicit **0‑based index** reflecting the order in which it
was declared (or first referenced).  Wire labels and indices are always
interchangeable, so the example above is equivalent to:

```
quantumCircuit LR
    wires q0(0), q1(0)
    H[q0]
    CNOT[q0, q1]
    M[q0]
    M[q1]
```

When the `wires` keyword is omitted, wires are auto‑named `q0`, `q1`, … in
the order they appear.  When `wires` is present, indices are assigned in
declaration order — `0` always refers to the first declared wire regardless of
its label.

## Syntax

### Diagram Direction

The first word after `quantumCircuit` sets the time axis:

| Keyword | Meaning |
|---------|---------|
| `LR`    | Left‑to‑right (default).  Time flows horizontally, qubits stacked vertically. |
| `TD`    | Top‑down.  Time flows vertically, qubits side‑by‑side horizontally. |

```mermaid-example
quantumCircuit TD
    H[q0]
    CNOT[q0, q1]
    M[q0]
    M[q1]
```

### Wire Declaration

```
wires name1(state1), name2(state2), …
```

The `wires` keyword is **_OPTIONAL_**.  When present it defines wire labels and
their initial states.  When omitted, wires are created on first reference.

| Element | Meaning |
|---------|---------|
| `wires` | Keyword that begins the wire list |
| `name`  | Identifier drawn beside the wire |
| `(state)` | Initial state, rendered in ket notation \|state⟩.  Defaults to `(0)`. |

Valid states include `(0)`, `(1)`, `(+)`, `(-)`, or any arbitrary label like
`(psi)`:

```mermaid-example
quantumCircuit LR
    wires alice(psi), bob(0)
    CNOT[alice, bob]
    M[alice]
    M[bob]
```

Each wire carries an implicit 0‑based index matching its position in the
declaration list (or order of first appearance when `wires` is omitted).
Labels and indices are interchangeable in any gate declaration:

```
wires alice(psi), bob(0)
CNOT[0, 1]    -- same as CNOT[alice, bob]
M[0]          -- same as M[alice]
```

### Gate Declarations

Each line after the wire list declares one gate:

```
GateName[wire1, wire2, …]
GateName(params)[wire1, wire2, …]
```

Gates are declared one per line.  The order of declarations determines the
circuit sequence.  The engine places each gate into the earliest time step
where all its target wires are free.

#### Built‑in Single‑Qubit Gates

These gate names render with canonical symbols:

| Syntax | Gate | Rendered |
|--------|------|:--------:|
| `H[w]` | Hadamard | H |
| `X[w]` | Pauli‑X (NOT) | X |
| `Y[w]` | Pauli‑Y | Y |
| `Z[w]` | Pauli‑Z | Z |
| `S[w]` | Phase | S |
| `T[w]` | π/8 | T |
| `Sdg[w]` | S‑dagger | S† |
| `Tdg[w]` | T‑dagger | T† |
| `I[w]` | Identity | I |

#### Parameterised Gates

```
Rx(pi/2)[q0]
Ry(theta)[q1]
Rz(phi)[q0]
P(pi/4)[q0]
U(theta, phi, lambda)[q0]
```

Parameters are a parenthesised, comma‑separated list of values.  They are
treated as **opaque literal strings** and rendered verbatim as the gate label —
no arithmetic evaluation is performed.  Names like `pi`, `theta`, `phi`, and
`lambda` are conventional, but any printable ASCII is accepted.

#### Custom Gates

Any gate name not in the built‑in list renders as a literal label:

```mermaid-example
quantumCircuit
    U3(0.5, 0, 0)[q0]
    MyGate[q0]
```

`U3` is an older IBM designation for the three‑parameter unitary gate, now
superseded by the built‑in `U` gate.  Because it is not a recognised built‑in
name it falls through to the custom gate renderer, producing a box labelled
`U3(0.5, 0, 0)`.

### Multi‑Qubit Gates

Multi‑qubit gates list all wires they act on.  By convention, **controls come
first, target last**.

| Syntax | Gate | Rendered |
|--------|------|:--------:|
| `CNOT[c, t]` | Controlled‑NOT | • on c, ⊕ on t, vertical line |
| `CX[c, t]` | Alias for CNOT | Same as CNOT |
| `CZ[c, t]` | Controlled‑Z | • on c, Z box on t |
| `SWAP[a, b]` | Swap | × on both wires |
| `CCX[c1, c2, t]` | Toffoli (CCNOT) | • on c1, c2, ⊕ on t |
| `CCZ[c1, c2, t]` | Controlled‑controlled‑Z | • on c1, c2, Z box on t |
| `CSWAP[c, a, b]` | Fredkin | • on c, × on a, b |

```mermaid-example
quantumCircuit LR
    wires q0(0), q1(1), q2(0)
    H[q0]
    H[q1]
    CCX[q0, q1, q2]
    M[q0]
    M[q1]
    M[q2]
```

`CX` and `CNOT` are interchangeable; both render as the same control‑target
symbol pair.

### Zero‑Control (vNext.0.0+)

Prepend `!` to a wire reference to make it a **zero‑control** — the gate
fires only when that qubit is in state |0⟩ (instead of the default |1⟩):

```
CNOT[!c, t]
CCX[!q0, q1, q2]
```

`!` may only be applied to wires in a **control role**.  The permitted
positions for each built‑in gate are:

| Gate | Control wire(s) | `!` permitted on |
|------|-----------------|------------------|
| `CNOT` / `CX` | first | first only |
| `CZ` | first (by convention) | first only |
| `CCX` / `CCZ` | first two | first and/or second |
| `CSWAP` | first | first only |
| `SWAP` | none (both wires are targets) | not allowed |

For **custom multi‑qubit gates** the last wire is treated as the target by
convention; `!` is allowed on any wire except the last.

```mermaid-example
quantumCircuit LR
    wires q0(0), q1(0), q2(0)
    H[q0]
    H[q1]
    CCX[!q0, q1, q2]
    M[q0]
    M[q1]
    M[q2]
```

### Measurement

| Syntax | Basis | Rendered |
|--------|-------|:--------:|
| `M[w]` | Z (computational) | Meter icon |
| `MZ[w]` | Z (computational) | Meter icon + Z label |
| `MX[w]` | X | Meter icon + X label |

Measurement results can be routed to a classical bit using the `->` operator
(see [Classical Wires and Feed‑Forward](#classical-wires-and-feed-forward)):

```
M[q0] -> c0
```

```mermaid-example
quantumCircuit
    H[q0]
    CNOT[q0, q1]
    MZ[q0]
    MX[q1]
```

### Classical Wires and Feed‑Forward

Real circuits often require **classical bits** to store measurement outcomes and
to conditionally apply corrective gates.  Classical wires are declared with the
`cbits` keyword and rendered as **double lines** to visually distinguish them
from quantum wires.

#### Classical Wire Declaration

```
cbits name1, name2, …
```

The `cbits` line may appear anywhere before the first gate that references a
classical bit.  By convention it follows the `wires` declaration.

#### Storing Measurement Results

Append `-> cbit` to any measurement instruction to route the outcome to a
classical bit:

```
M[q0]  -> c0
MZ[q1] -> c1
MX[q2] -> c2
```

A wire is drawn from the measurement symbol to the named classical bit.

#### Classically‑Conditioned Gates

Append `if cbit` to a gate declaration to make it conditionally execute when
that classical bit is 1:

```
X[q2] if c0
Z[q2] if c1
```

The gate is rendered with a small control symbol connecting it to the classical
wire.

#### Example

```mermaid-example
quantumCircuit LR
    wires q0(0), q1(0)
    cbits c0
    H[q0]
    M[q0] -> c0
    X[q1] if c0
```

### Barrier

A `barrier` keyword on its own line inserts a vertical (LR) or horizontal (TD)
dashed line across all wires at that time step.  Blank lines are treated as
insignificant whitespace and do **not** create barriers.

```mermaid-example
quantumCircuit LR
    wires q0(0), q1(0)
    H[q0]
    H[q1]
    barrier
    CNOT[q0, q1]
    barrier
    M[q0]
    M[q1]
```

### Title and Accessibility

The standard Mermaid `title`, `accTitle`, and `accDescr` directives are
supported:

```mermaid-example
---
title: Bell State
---
quantumCircuit LR
    wires q0(0), q1(0)
    H[q0]
    CNOT[q0, q1]
    M[q0]
    M[q1]
```

## Examples

### Bell State Preparation

```mermaid-example
quantumCircuit LR
    wires q0(0), q1(0)
    H[q0]
    CNOT[q0, q1]
    M[q0]
    M[q1]
```

### Quantum Teleportation

Three qubits: `msg` carries the state to be teleported; `alice` and `bob` share
an entangled Bell pair.  Classical bits capture the Bell‑measurement outcomes
and drive the corrective gates on Bob's qubit.

```mermaid-example
---
config:
  quantumCircuit:
    columnWidth: 70
---
quantumCircuit LR
    wires msg(psi), alice(0), bob(0)
    cbits c_msg, c_alice
    H[alice]
    CNOT[alice, bob]
    CNOT[msg, alice]
    H[msg]
    M[msg]   -> c_msg
    M[alice] -> c_alice
    X[bob] if c_alice
    Z[bob] if c_msg
```

### Grover Oracle (4 qubits)

```mermaid-example
quantumCircuit LR
    wires q0(0), q1(0), q2(0), oracle(1)
    H[q0]
    H[q1]
    H[q2]
    H[oracle]
    CZ[q0, oracle]
    CZ[q1, oracle]
    CZ[q2, oracle]
    H[q0]
    H[q1]
    H[q2]
    H[oracle]
    X[q0]
    X[q1]
    X[q2]
    X[oracle]
    CZ[q0, oracle]
    CZ[q1, oracle]
    CZ[q2, oracle]
    X[q0]
    X[q1]
    X[q2]
    X[oracle]
    H[q0]
    H[q1]
    H[q2]
    H[oracle]
    M[q0]
    M[q1]
    M[q2]
```

### Grover Diffusion Operator (3 qubits)

The Grover diffusion operator (inversion about the average) on three qubits:
apply H and X to all wires, perform a three‑qubit controlled‑Z to flip the
phase of |111⟩, then reverse the X and H layers.

```mermaid-example
quantumCircuit LR
    wires q0(0), q1(0), q2(0)
    H[q0]
    H[q1]
    H[q2]
    barrier
    X[q0]
    X[q1]
    X[q2]
    CCZ[q0, q1, q2]
    X[q0]
    X[q1]
    X[q2]
    barrier
    H[q0]
    H[q1]
    H[q2]
```

### SWAP Gate with Top‑Down Direction

```mermaid-example
quantumCircuit TD
    wires a(psi), b(phi)
    H[a]
    H[b]
    SWAP[a, b]
    M[a]
    M[b]
```

### Mixed Controls (zero‑control + positive control)

```mermaid-example
quantumCircuit LR
    wires q0(0), q1(0), q2(0)
    X[q0]
    H[q1]
    CCX[!q0, q1, q2]
    M[q0]
    M[q1]
    M[q2]
```

## Configuration

The following configuration parameters are available under the
`quantumCircuit` key:

| Parameter | Description | Default |
|-----------|-------------|:-------:|
| `columnWidth` | Width in pixels of each time‑step column (LR mode) | `60` |
| `rowHeight` | Height in pixels of each time‑step row (TD mode) | `48` |
| `wireSpacing` | Spacing in pixels between qubit wires | `48` |
| `gateFontSize` | Font size for gate labels | `14` |
| `showWireLabels` | Whether to display wire names and initial states | `true` |
| `wireColor` | CSS color for qubit wires | *(theme)* |
| `classicalWireColor` | CSS color for classical (double) wires | *(theme)* |
| `gateColor` | CSS color for gate boxes | *(theme)* |
| `controlColor` | CSS color for control dots and connector lines | *(theme)* |

```mermaid-example
---
config:
  quantumCircuit:
    columnWidth: 80
    showWireLabels: false
---
quantumCircuit LR
    wires q0(0), q1(0)
    H[q0]
    CNOT[q0, q1]
    M[q0]
    M[q1]
```
