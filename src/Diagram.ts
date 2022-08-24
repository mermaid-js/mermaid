import * as configApi from './config';
import { log } from './logger';
import { getDiagram } from './diagram-api/diagramAPI';
import { detectType } from './diagram-api/detectType';
export class Diagram {
  type = 'graph';
  parser;
  renderer;
  db;
  constructor(public txt: string, parseError?: Function) {
    const cnf = configApi.getConfig();
    this.txt = txt;
    this.type = detectType(txt, cnf);
    const diagram = getDiagram(this.type);
    log.debug('Type ' + this.type);
    // Setup diagram
    this.db = diagram.db;
    this.db.clear?.();
    this.renderer = diagram.renderer;
    this.parser = diagram.parser;
    this.parser.parser.yy = this.db;
    if (diagram.init) {
      diagram.init(cnf);
      log.debug('Initialized diagram ' + this.type, cnf);
    }
    this.txt += '\n';
    this.parser.parser.yy.graphType = this.type;
    this.parser.parser.yy.parseError = (str: string, hash: string) => {
      const error = { str, hash };
      throw error;
    };
    this.parse(this.txt, parseError);
  }

  parse(text: string, parseError?: Function): boolean {
    try {
      text = text + '\n';
      this.db.clear();
      this.parser.parse(text);
      return true;
    } catch (error) {
      // Is this the correct way to access mermiad's parseError()
      // method ? (or global.mermaid.parseError()) ?
      if (parseError) {
        // @ts-ignore
        if (error.str != undefined) {
          // handle case where error string and hash were
          // wrapped in object like`const error = { str, hash };`
          // @ts-ignore
          parseError(error.str, error.hash);
        } else {
          // assume it is just error string and pass it on
          parseError(error);
        }
      } else {
        // No mermaid.parseError() handler defined, so re-throw it
        throw error;
      }
    }
    return false;
  }

  getParser() {
    return this.parser;
  }

  getType() {
    return this.type;
  }
}

export default Diagram;
