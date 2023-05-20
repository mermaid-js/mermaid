// @ts-ignore: TODO Fix ts errors
import { select } from 'd3';
import * as configApi from '../../config.js';
import { log } from '../../logger.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import { Diagram } from '../../Diagram.js';

export const draw = (txt: string, id: string, _version: string, diagObj: Diagram) => {
  const conf = configApi.getConfig();

  log.debug('Rendering xychart chart\n' + txt);

  const securityLevel = conf.securityLevel;
  // Handle root and Document for when rendering in sandbox mode
  let sandboxElement;
  if (securityLevel === 'sandbox') {
    sandboxElement = select('#i' + id);
  }
  const root =
    securityLevel === 'sandbox'
      ? select(sandboxElement.nodes()[0].contentDocument.body)
      : select('body');

  const svg = root.select(`[id="${id}"]`);

  const group = svg.append('g').attr('class', 'main');

  const width = 500;
  const height = 500;

  configureSvgSize(svg, height, width, true);

  svg.attr('viewBox', '0 0 ' + width + ' ' + height);
};

export default {
  draw,
};
