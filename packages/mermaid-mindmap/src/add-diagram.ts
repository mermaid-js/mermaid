// @ts-ignore: TODO Fix ts errors
import mindmapParser from './parser/mindmap';
import * as mindmapDb from './mindmapDb';
import mindmapRenderer from './mindmapRenderer';
import mindmapStyles from './styles';
import { injectUtils } from './mermaidUtils';

// const getBaseFolder = (path: string) => {
//   const parts = path.split('/');
//   parts.pop();
//   return parts.join('/');
// };

window.mermaid.connectDiagram(
  'mindmap',
  {
    db: mindmapDb,
    renderer: mindmapRenderer,
    parser: mindmapParser,
    styles: mindmapStyles,
  },
  injectUtils
);
