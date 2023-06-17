import { Diagram } from '../../Diagram.js';

/**
 * Draws a sequenceDiagram in the tag with id: id based on the graph definition in text.
 *
 * @param _text - The text of the diagram
 * @param id - The id of the diagram which will be used as a DOM element id¨
 * @param _version - Mermaid version from package.json
 * @param diagObj - A standard diagram containing the db and the text and type etc of the diagram
 */
export const draw = function (text: string, id: string, _version: string, diagObj: Diagram) {
  
  debugger;
  // diagObj.db.clear();
  diagObj.parser.parse(text);
  
  // const elem = doc.getElementById(id);

  debugger;
  return 'TEST';
}

export default {
  draw,
};
