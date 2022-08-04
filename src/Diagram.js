import utils from './utils';
import * as configApi from './config';
import { log } from './logger';
import { getDiagrams } from './diagram-api/diagramAPI';
import detectType from './diagram-api/detectType';
class Diagram {
  type = 'graph';
  parser;
  renderer;
  db;
  constructor(txt) {
    const diagrams = getDiagrams();
    const cnf = configApi.getConfig();
    this.txt = txt;
    this.type = detectType(txt, cnf);
    log.debug('Type ' + this.type);

    // console.log('this.type', this.type, diagrams[this.type]);
    // Setup diagram
    this.db = diagrams[this.type].db;
    this.renderer = diagrams[this.type].renderer;
    this.parser = diagrams[this.type].parser;
    this.parser.parser.yy = this.db;
    if (typeof diagrams[this.type].init === 'function') {
      diagrams[this.type].init(cnf);
      log.debug('Initialized diagram ' + this.type, cnf);
    }
    this.txt = this.txt + '\n';

    this.parser.parser.yy.graphType = this.type;
    this.parser.parser.yy.parseError = (str, hash) => {
      const error = { str, hash };
      throw error;
    };
    this.parser.parse(this.txt);
  }
  parse(text) {
    var parseEncounteredException = false;
    try {
      text = text + '\n';
      this.db.clear();

      this.parser.parse(text);
    } catch (error) {
      parseEncounteredException = true;
      // Is this the correct way to access mermiad's parseError()
      // method ? (or global.mermaid.parseError()) ?
      if (global.mermaid.parseError) {
        if (error.str != undefined) {
          // handle case where error string and hash were
          // wrapped in object like`const error = { str, hash };`
          global.mermaid.parseError(error.str, error.hash);
        } else {
          // assume it is just error string and pass it on
          global.mermaid.parseError(error);
        }
      } else {
        // No mermaid.parseError() handler defined, so re-throw it
        throw error;
      }
    }
    return !parseEncounteredException;
  }
  getParser() {
    return this.parser;
  }
  getType() {
    return this.type;
  }
}

export default Diagram;
