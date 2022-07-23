import { registerDiagram } from './diagramAPI.js';
import mindmapDb from '../diagrams/mindmap/mindmapDb';
import mindmapRenderer from '../diagrams/mindmap/mindmapRenderer';
import mindmapParser from '../diagrams/mindmap/parser/mindmap';
import mindmapDetector from '../diagrams/mindmap/mindmapDetector';
import mindmapStyles from '../diagrams/mindmap/styles';

import gitGraphDb from '../diagrams/git/gitGraphAst';
import gitGraphRenderer from '../diagrams/git/gitGraphRenderer';
import gitGraphParser from '../diagrams/git/parser/gitGraph';
import gitGraphDetector from '../diagrams/git/gitGraphDetector';
import gitGraphStyles from '../diagrams/git/styles';

// Register mindmap and other built-in diagrams
const addDiagrams = () => {
  registerDiagram(
    'gitGraph',
    gitGraphParser,
    gitGraphDb,
    gitGraphRenderer,
    undefined,
    gitGraphDetector,
    gitGraphStyles
  );
  registerDiagram(
    'mindmap',
    mindmapParser,
    mindmapDb,
    mindmapRenderer,
    undefined,
    mindmapDetector,
    mindmapStyles
  );
};
export default addDiagrams;
