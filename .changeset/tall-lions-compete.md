---
'@mermaid-js/layout-elk': minor
'mermaid': minor
---

feat(elk): add force-directed and stress-minimization layout algorithms

## What

Introduces two new ELK layout algorithms for improved force-directed graph visualization:

- **Force-directed layouts**: Implements the EADES and FRUCHTERMAN_REINGOLD physics models with configurable iterations, repulsion, and temperature parameters
- **Stress-minimization layout**: Adds a stress-based algorithm with majorization for optimizing edge lengths and overall graph aesthetics

## Why

The ELK layered algorithm is excellent for hierarchical flows, but many diagrams benefit from force-directed or stress-based layouts that minimize edge crossings and create more natural-looking node distributions. These algorithms are particularly valuable for:

- Complex interconnected systems with many bidirectional edges
- Circular or mesh-like topologies
- Cases where hierarchical layout produces cluttered results

## How

Users can now specify new algorithm values in the ELK configuration:

```javascript
// Force-directed with EADES physics model
elk: {
  algorithm: 'elk.force',
  forceModel: 'EADES',
  forceIterations: 300,
  forceRepulsion: 1.0,
  forceTemperature: 1.0
}

// Stress-minimization algorithm
elk: {
  algorithm: 'elk.stress',
  stressDesiredEdgeLength: 80,
  stressIterationLimit: 300,
  stressEpsilon: 0.01
}
```

New configuration options are fully typed and validated. The existing `elk` and `elk.layered` algorithms remain unchanged, ensuring backward compatibility.
