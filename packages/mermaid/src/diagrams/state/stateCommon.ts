/**
 * Constants common to all State Diagram code
 */

// default diagram direction
export const DEFAULT_DIAGRAM_DIRECTION = 'LR';

// default direction for any nested documents (composites)
export const DEFAULT_NESTED_DOC_DIR = 'TB';

// parsed statement type for a state
export const STMT_STATE = 'state';
// parsed statement type for a relation
export const STMT_RELATION = 'relation';
// parsed statement type for a classDef
export const STMT_CLASSDEF = 'classDef';
// parsed statement type for applyClass
export const STMT_APPLYCLASS = 'applyClass';

export const DEFAULT_STATE_TYPE = 'default';
export const DIVIDER_TYPE = 'divider';

// Graph edge settings
export const G_EDGE_STYLE = 'fill:none';
export const G_EDGE_ARROWHEADSTYLE = 'fill: #333';
export const G_EDGE_LABELPOS = 'c';
export const G_EDGE_LABELTYPE = 'text';
export const G_EDGE_THICKNESS = 'normal';

export const CSS_EDGE = 'transition';
export const CSS_DIAGRAM = 'statediagram';

export default {
  DEFAULT_DIAGRAM_DIRECTION,
  DEFAULT_NESTED_DOC_DIR,
  STMT_STATE,
  STMT_RELATION,
  STMT_CLASSDEF,
  STMT_APPLYCLASS,
  DEFAULT_STATE_TYPE,
  DIVIDER_TYPE,
  G_EDGE_STYLE,
  G_EDGE_ARROWHEADSTYLE,
  G_EDGE_LABELPOS,
  G_EDGE_LABELTYPE,
  G_EDGE_THICKNESS,
  CSS_EDGE,
  CSS_DIAGRAM,
};
