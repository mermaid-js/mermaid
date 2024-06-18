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
export const STMT_STYLEDEF = 'style';
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

export const SHAPE_STATE = 'rect';
export const SHAPE_STATE_WITH_DESC = 'rectWithTitle';
export const SHAPE_START = 'stateStart';
export const SHAPE_END = 'stateEnd';
export const SHAPE_DIVIDER = 'divider';
export const SHAPE_GROUP = 'roundedWithTitle';
export const SHAPE_NOTE = 'note';
export const SHAPE_NOTEGROUP = 'noteGroup';

// CSS classes
export const CSS_DIAGRAM = 'statediagram';
export const CSS_STATE = 'state';
export const CSS_DIAGRAM_STATE = `${CSS_DIAGRAM}-${CSS_STATE}`;
export const CSS_EDGE = 'transition';
export const CSS_NOTE = 'note';
export const CSS_NOTE_EDGE = 'note-edge';
export const CSS_EDGE_NOTE_EDGE = `${CSS_EDGE} ${CSS_NOTE_EDGE}`;
export const CSS_DIAGRAM_NOTE = `${CSS_DIAGRAM}-${CSS_NOTE}`;
export const CSS_CLUSTER = 'cluster';
export const CSS_DIAGRAM_CLUSTER = `${CSS_DIAGRAM}-${CSS_CLUSTER}`;
export const CSS_CLUSTER_ALT = 'cluster-alt';
export const CSS_DIAGRAM_CLUSTER_ALT = `${CSS_DIAGRAM}-${CSS_CLUSTER_ALT}`;

export const PARENT = 'parent';
export const NOTE = 'note';
export const DOMID_STATE = 'state';
export const DOMID_TYPE_SPACER = '----';
export const NOTE_ID = `${DOMID_TYPE_SPACER}${NOTE}`;
export const PARENT_ID = `${DOMID_TYPE_SPACER}${PARENT}`;
// --------------------------------------

export default {
  DEFAULT_DIAGRAM_DIRECTION,
  DEFAULT_NESTED_DOC_DIR,
  STMT_STATE,
  STMT_RELATION,
  STMT_CLASSDEF,
  STMT_STYLEDEF,
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
  SHAPE_STATE,
  SHAPE_STATE_WITH_DESC,
  SHAPE_START,
  SHAPE_END,
  SHAPE_DIVIDER,
  SHAPE_GROUP,
  SHAPE_NOTE,
  SHAPE_NOTEGROUP,
  CSS_STATE,
  CSS_DIAGRAM_STATE,
  CSS_NOTE,
  CSS_NOTE_EDGE,
  CSS_EDGE_NOTE_EDGE,
  CSS_DIAGRAM_NOTE,
  CSS_CLUSTER,
  CSS_DIAGRAM_CLUSTER,
  CSS_CLUSTER_ALT,
  CSS_DIAGRAM_CLUSTER_ALT,
  PARENT,
  NOTE,
  DOMID_STATE,
  DOMID_TYPE_SPACER,
  NOTE_ID,
  PARENT_ID,
};
