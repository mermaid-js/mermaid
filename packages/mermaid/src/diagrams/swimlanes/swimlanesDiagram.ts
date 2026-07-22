// Swimlanes is a "layout-variant diagram": it reuses the flowchart parser, DB,
// and renderer wholesale and only swaps in a different layout engine
// (`defaultLayout: 'swimlane'`) plus lane-specific styles. It therefore
// deliberately consumes flowchart's public factory `createFlowDiagram` rather
// than duplicating the entire flowchart plugin. This is the one sanctioned
// exception to the cross-diagram isolation rule documented in diagrams/CLAUDE.md;
// the dependency is on flowchart's exported entry points only, never its internals.
import { createFlowDiagram } from '../flowchart/flowDiagram.js';
import swimlanesStyles from './styles.js';

export const diagram = createFlowDiagram({ defaultLayout: 'swimlane', styles: swimlanesStyles });
