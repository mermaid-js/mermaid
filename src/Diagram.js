import c4Db from './diagrams/c4/c4Db';
import c4Renderer from './diagrams/c4/c4Renderer';
import c4Parser from './diagrams/c4/parser/c4Diagram';
import classDb from './diagrams/class/classDb';
import classRenderer from './diagrams/class/classRenderer';
import classRendererV2 from './diagrams/class/classRenderer-v2';
import classParser from './diagrams/class/parser/classDiagram';
import erDb from './diagrams/er/erDb';
import erRenderer from './diagrams/er/erRenderer';
import erParser from './diagrams/er/parser/erDiagram';
import flowDb from './diagrams/flowchart/flowDb';
import flowRenderer from './diagrams/flowchart/flowRenderer';
import flowRendererV2 from './diagrams/flowchart/flowRenderer-v2';
import flowParser from './diagrams/flowchart/parser/flow';
import ganttDb from './diagrams/gantt/ganttDb';
import ganttRenderer from './diagrams/gantt/ganttRenderer';
import ganttParser from './diagrams/gantt/parser/gantt';
import gitGraphAst from './diagrams/git/gitGraphAst';
import gitGraphRenderer from './diagrams/git/gitGraphRenderer';
import gitGraphParser from './diagrams/git/parser/gitGraph';
import infoDb from './diagrams/info/infoDb';
import infoRenderer from './diagrams/info/infoRenderer';
import infoParser from './diagrams/info/parser/info';
import pieParser from './diagrams/pie/parser/pie';
import pieDb from './diagrams/pie/pieDb';
import pieRenderer from './diagrams/pie/pieRenderer';
import requirementParser from './diagrams/requirement/parser/requirementDiagram';
import requirementDb from './diagrams/requirement/requirementDb';
import requirementRenderer from './diagrams/requirement/requirementRenderer';
import sequenceParser from './diagrams/sequence/parser/sequenceDiagram';
import sequenceDb from './diagrams/sequence/sequenceDb';
import sequenceRenderer from './diagrams/sequence/sequenceRenderer';
import stateParser from './diagrams/state/parser/stateDiagram';
import stateDb from './diagrams/state/stateDb';
import stateRenderer from './diagrams/state/stateRenderer';
import stateRendererV2 from './diagrams/state/stateRenderer-v2';
import journeyDb from './diagrams/user-journey/journeyDb';
import journeyRenderer from './diagrams/user-journey/journeyRenderer';
import journeyParser from './diagrams/user-journey/parser/journey';
import utils from './utils';
import * as configApi from './config';
import { log } from './logger';

class Diagram {
  type = 'graph';
  parser;
  renderer;
  db;
  constructor(txt) {
    const cnf = configApi.getConfig();
    this.txt = txt;
    this.type = utils.detectType(txt, cnf);
    log.debug('Type ' + this.type);
    switch (this.type) {
      case 'c4':
        this.parser = c4Parser;
        this.parser.parser.yy = c4Db;
        this.db = c4Db;
        this.renderer = c4Renderer;
        break;
      case 'gitGraph':
        this.parser = gitGraphParser;
        this.parser.parser.yy = gitGraphAst;
        this.db = gitGraphAst;
        this.renderer = gitGraphRenderer;
        this.txt = this.txt + '\n';
        break;
      case 'flowchart':
        flowRenderer.setConf(cnf.flowchart);
        cnf.flowchart.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
        flowDb.clear();
        flowDb.setGen('gen-1');
        this.parser = flowParser;
        this.parser.parser.yy = flowDb;
        this.db = flowDb;
        this.renderer = flowRenderer;
        break;
      case 'flowchart-v2':
        flowRendererV2.setConf(cnf.flowchart);
        cnf.flowchart.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
        flowDb.clear();
        flowDb.setGen('gen-2');
        this.parser = flowParser;
        this.parser.parser.yy = flowDb;
        this.db = flowDb;
        this.renderer = flowRendererV2;
        break;
      case 'sequenceDiagram':
      case 'sequence':
        cnf.sequence.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
        if (cnf.sequenceDiagram) {
          // backwards compatibility
          sequenceRenderer.setConf(Object.assign(cnf.sequence, cnf.sequenceDiagram));
          console.error(
            '`mermaid config.sequenceDiagram` has been renamed to `config.sequence`. Please update your mermaid config.'
          );
        }
        this.parser = sequenceParser;
        this.parser.parser.yy = sequenceDb;
        this.db = sequenceDb;
        this.db.setWrap(cnf.wrap);
        this.renderer = sequenceRenderer;
        this.txt = this.txt + '\n';
        break;
      case 'gantt':
        cnf.gantt.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
        ganttRenderer.setConf(cnf.gantt);
        this.parser = ganttParser;
        this.parser.parser.yy = ganttDb;
        this.db = ganttDb;
        this.renderer = ganttRenderer;
        break;
      case 'class':
        this.parser = classParser;
        this.parser.parser.yy = classDb;
        this.db = classDb;
        this.renderer = classRenderer;
        break;
      case 'classDiagram':
        this.parser = classParser;
        this.parser.parser.yy = classDb;
        this.db = classDb;
        this.renderer = classRendererV2;
        break;
      case 'state':
        this.parser = stateParser;
        this.parser.parser.yy = stateDb;
        this.db = stateDb;
        this.db.clear();
        this.renderer = stateRenderer;
        break;
      case 'stateDiagram':
        this.parser = stateParser;
        this.parser.parser.yy = stateDb;
        this.db = stateDb;
        this.db.clear();
        this.renderer = stateRendererV2;
        break;
      case 'info':
        log.debug('info info info');
        this.parser = infoParser;
        this.parser.parser.yy = infoDb;
        this.db = infoDb;
        this.renderer = infoRenderer;
        break;
      case 'pie':
        log.debug('pie');
        this.parser = pieParser;
        this.parser.parser.yy = pieDb;
        this.db = pieDb;
        this.renderer = pieRenderer;
        break;
      case 'er':
        log.debug('er');
        this.parser = erParser;
        this.parser.parser.yy = erDb;
        this.db = erDb;
        this.renderer = erRenderer;
        break;
      case 'journey':
        log.debug('Journey');
        journeyRenderer.setConf(cnf.journey);
        this.parser = journeyParser;
        this.parser.parser.yy = journeyDb;
        this.db = journeyDb;
        this.db.clear();
        this.renderer = journeyRenderer;
        break;
      case 'requirement':
      case 'requirementDiagram':
        log.debug('RequirementDiagram');
        this.parser = requirementParser;
        this.parser.parser.yy = requirementDb;
        this.db = requirementDb;
        this.renderer = requirementRenderer;
        break;
      default:
        log.error('Unkown graphtype');
        throw new Error('Unkown graphtype');
    }
    this.parser.parser.yy.graphType = this.type;
    this.parser.parser.yy.parseError = (str, hash) => {
      const error = { str, hash };
      throw error;
    };
    this.parser.parse(this.txt);
  }
  getParser() {
    return this.parser;
  }
  getType() {
    return this.type;
  }
}

export default Diagram;
