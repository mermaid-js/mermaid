// The `mermaid` entry, minus its large layouts, diagrams and KaTeX.
import mermaid from '@mermaid-js/core';
import { info } from '@mermaid-js/diagram-info';
import { ishikawa } from '@mermaid-js/diagram-ishikawa';
import { packet } from '@mermaid-js/diagram-packet';
import { pie } from '@mermaid-js/diagram-pie';
import { radar } from '@mermaid-js/diagram-radar';
import sankey from '@mermaid-js/diagram-sankey';

void mermaid.registerExternalDiagrams([info, ishikawa, packet, pie, radar, sankey]);

export * from '@mermaid-js/core';
export default mermaid;
