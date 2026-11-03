// The `layout: layered` renderer: mermaid's common measure → layout → paint pipeline with the
// layered engine as its layout core. Edges come out with axis-tagged route points, so
// `insertEdge` draws them with the shared `routePath`.
import { createCommonLayoutRenderer } from '../common/index.js';
import { runLayeredLayoutCore } from './layoutData.js';

export const render = createCommonLayoutRenderer({
  runLayoutCore: runLayeredLayoutCore,
});
