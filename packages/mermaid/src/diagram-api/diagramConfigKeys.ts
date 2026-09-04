/**
 * Diagram types whose id differs from the `MermaidConfig` key their configuration lives
 * under. Several share one section on purpose: they are renderers or parser versions of
 * one diagram, so a setting made under `flowchart`, `class` or `state` must reach any of them.
 */
const DIAGRAM_CONFIG_KEY_ALIASES: Record<string, string> = {
  'flowchart-v2': 'flowchart',
  'flowchart-elk': 'flowchart',
  classDiagram: 'class',
  stateDiagram: 'state',
  xychart: 'xyChart',
  railroadAbnf: 'railroad',
  railroadEbnf: 'railroad',
  railroadPeg: 'railroad',
};

/**
 * Returns the `MermaidConfig` key holding the configuration for `diagramType`. The key is
 * not guaranteed to exist -- `info` and `error` have no section -- so treat a missing one
 * as "nothing configured for this type".
 */
export const getDiagramConfigKey = (diagramType: string): string =>
  DIAGRAM_CONFIG_KEY_ALIASES[diagramType] ?? diagramType;
