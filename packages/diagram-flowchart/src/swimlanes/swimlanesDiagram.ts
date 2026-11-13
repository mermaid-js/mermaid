// Swimlanes is a "layout-variant diagram": it reuses the flowchart parser, DB,
// and renderer wholesale and only swaps in a different layout engine (the
// schema's `swimlane.layout` default) plus lane-specific styles.
import { createFlowDiagram } from '../flowDiagram.js';
import swimlanesStyles from './styles.js';

export const diagram = createFlowDiagram({ styles: swimlanesStyles });
