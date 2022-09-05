import { registerDiagram } from './diagramAPI';
import mindmapDb from '../diagrams/mindmap/mindmapDb';
import mindmapRenderer from '../diagrams/mindmap/mindmapRenderer';
// @ts-ignore
import mindmapParser from '../diagrams/mindmap/parser/mindmap';
import mindmapDetector from '../diagrams/mindmap/mindmapDetector';
import mindmapStyles from '../diagrams/mindmap/styles';

import gitGraphDb from '../diagrams/git/gitGraphAst';
import gitGraphRenderer from '../diagrams/git/gitGraphRenderer';
// @ts-ignore
import gitGraphParser from '../diagrams/git/parser/gitGraph';
import { gitGraphDetector } from '../diagrams/git/gitGraphDetector';
import gitGraphStyles from '../diagrams/git/styles';

export const addDiagrams = () => {
  // Register mindmap and other built-in diagrams
  registerDiagram(
    'gitGraph',
    { parser: gitGraphParser, db: gitGraphDb, renderer: gitGraphRenderer, styles: gitGraphStyles },
    gitGraphDetector
  );
    registerDiagram(
    'mindmap',
    { parser: mindmapParser, db: mindmapDb, renderer: mindmapRenderer, styles: mindmapStyles },
    gitGraphDetector
  );
};
