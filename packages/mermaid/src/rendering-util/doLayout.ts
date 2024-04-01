import { LayoutData, LayoutMethod, RenderData } from './types';

const layoutAlgorithms = {} as Record<string, any>;

const performLayout = (
  layoutData: LayoutData,
  id: string,
  _version: string,
  layoutMethod: LayoutMethod
): RenderData => {
  console.log('Performing layout', layoutData, id, _version, layoutMethod);
  return { items: [], otherDetails:{} };
};
export default performLayout;
