import type { Diagram } from '../../Diagram.js';
import type {
  DiagramRenderer,
  DiagramStyleClassDef,
  DrawDefinition,
} from '../../diagram-api/types.js';

/**
 * Draws the Usecase diagram
 */
const draw: DrawDefinition = (_text, _id, _version, _diagram: Diagram) => {
  // TODO: Implement the draw function for the usecase diagram
};

const getClasses = function (
  _text: string,
  _diagramObj: Pick<Diagram, 'db'>
): Map<string, DiagramStyleClassDef> {
  return new Map<string, DiagramStyleClassDef>();
};
export const renderer: DiagramRenderer = { draw, getClasses };
