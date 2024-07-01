import { log } from '$root/logger.js';
import type { LayoutData, LayoutMethod, RenderData } from './types.js';

const performLayout = (
  layoutData: LayoutData,
  id: string,
  _version: string,
  layoutMethod: LayoutMethod
): RenderData => {
  log.info('Performing layout', layoutData, id, _version, layoutMethod);
  return { items: [] };
};
export default performLayout;
