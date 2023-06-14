// import { select, scaleOrdinal, pie as d3pie, arc } from 'd3';

// import { select, selectAll } from 'd3';
// import { log } from '../../logger.js';
// import common from '../common/common.js';
// import * as svgDrawCommon from '../common/svgDrawCommon';
import * as configApi from '../../config.js';
// import assignWithDepth from '../../assignWithDepth.js';
// import utils from '../../utils.js';
// import { configureSvgSize } from '../../setupGraphViewbox.js';
import { Diagram } from '../../Diagram.js';

// import { parseFontSize } from '../../utils.js';

const conf = configApi.getConfig();

/**
 * Draws a Sankey Diagram with the data given in text.
 *
 * @param text
 * @param id
 */
export const draw = function (_text: string, id: string, _version: string, _diagObj: Diagram) {}

export default {
  draw,
};
