/**
 * Maps a diagram type -- the id a detector registers, and the value
 * {@link detectType} returns -- to the key its configuration lives under in
 * `MermaidConfig`.
 *
 * Most types already name their own config section, so only the ones that do
 * not are listed here. Several types share a section on purpose: `flowchart`,
 * `flowchart-v2` and `flowchart-elk` are three renderers for one diagram, and
 * `class`/`classDiagram` and `state`/`stateDiagram` are a v1 and a v2 parser
 * for one diagram, so a setting made under `flowchart`, `class` or `state`
 * has to reach whichever of them the detector picked.
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
 * Returns the `MermaidConfig` key holding the configuration for `diagramType`.
 *
 * The key is not guaranteed to exist -- types such as `info` and `error` have
 * no config section -- so callers must treat a missing section as "nothing
 * configured for this type".
 */
export const getDiagramConfigKey = (diagramType: string): string =>
  DIAGRAM_CONFIG_KEY_ALIASES[diagramType] ?? diagramType;
