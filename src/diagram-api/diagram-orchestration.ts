import { registerDiagram } from './diagramAPI';
// import mindmapDb from '../diagrams/mindmap/mindmapDb';
// import mindmapRenderer from '../diagrams/mindmap/mindmapRenderer';
// import mindmapParser from '../diagrams/mindmap/parser/mindmapDiagram';
// import { mindmapDetector } from '../diagrams/mindmap/mindmapDetector';

import gitGraphDb from '../diagrams/git/gitGraphAst';
import gitGraphRenderer from '../diagrams/git/gitGraphRenderer';
// @ts-ignore: TODO Fix ts errors
import gitGraphParser from '../diagrams/git/parser/gitGraph';
import { gitGraphDetector } from '../diagrams/git/gitGraphDetector';

// Register mindmap and other built-in diagrams
// registerDiagram(
//   'mindmap',
//   mindmapParser,
//   mindmapDb,
//   mindmapRenderer,
//   undefined,
//   mindmapRenderer,
//   mindmapDetector
// );
export const addDiagrams = () => {
  registerDiagram(
    'gitGraph',
    { parser: gitGraphParser, db: gitGraphDb, renderer: gitGraphRenderer },
    gitGraphDetector
  );
};
