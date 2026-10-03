export const diagramPatterns: readonly { diagramId: string; pattern: RegExp }[] = [
  { diagramId: 'architecture', pattern: /^architecture-beta\b/ },
  { diagramId: 'block', pattern: /^block-beta\b/ },
  { diagramId: 'c4Diagram', pattern: /^C4(Context|Container|Component|Dynamic|Deployment)\b/ },
  { diagramId: 'classDiagram', pattern: /^classDiagram(-v2)?\b/ },
  { diagramId: 'erDiagram', pattern: /^erDiagram\b/ },
  { diagramId: 'flowchart', pattern: /^(flowchart(-v2|-elk)?|graph)\b/ },
  { diagramId: 'gantt', pattern: /^gantt\b/ },
  { diagramId: 'gitGraph', pattern: /^gitGraph\b/ },
  { diagramId: 'info', pattern: /^info\b/ },
  { diagramId: 'journey', pattern: /^journey\b/ },
  { diagramId: 'kanban', pattern: /^kanban\b/ },
  { diagramId: 'mindmap', pattern: /^mindmap\b/ },
  { diagramId: 'packet', pattern: /^packet-beta\b/ },
  { diagramId: 'pie', pattern: /^pie\b/ },
  { diagramId: 'quadrantChart', pattern: /^quadrantChart\b/ },
  { diagramId: 'radar', pattern: /^radar-beta\b/ },
  { diagramId: 'requirementDiagram', pattern: /^(requirement|requirementDiagram)\b/ },
  { diagramId: 'sankey', pattern: /^sankey-beta\b/ },
  { diagramId: 'sequenceDiagram', pattern: /^sequenceDiagram\b/ },
  { diagramId: 'stateDiagram', pattern: /^stateDiagram(-v2)?\b/ },
  { diagramId: 'timeline', pattern: /^timeline\b/ },
  { diagramId: 'treemap', pattern: /^treemap-beta\b/ },
  { diagramId: 'xychart', pattern: /^xychart-beta\b/ },
  { diagramId: 'zenuml', pattern: /^zenuml\b/ },
];

const stripConfigDirectives = (text: string): string => text.replaceAll(/%%{[\S\s]*?}%%/g, '');

const stripFrontmatter = (text: string): string => {
  if (!text.startsWith('---')) {
    return text;
  }
  const end = text.indexOf('\n---', 3);
  return end === -1 ? text : text.slice(end + 4);
};

/** Detector id declared on the first meaningful line, if there is one. */
export const detectDiagramType = (text: string): string | undefined => {
  for (const line of stripFrontmatter(stripConfigDirectives(text)).split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('%%')) {
      continue;
    }
    for (const { diagramId, pattern } of diagramPatterns) {
      if (pattern.test(trimmed)) {
        return diagramId;
      }
    }
    return undefined;
  }
  return undefined;
};
