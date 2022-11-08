import * as configApi from './config';
import { log } from './logger';
import { DiagramNotFoundError, getDiagram, registerDiagram } from './diagram-api/diagramAPI';
import { detectType, getDiagramLoader } from './diagram-api/detectType';
import { isDetailedError } from './utils';
export class Diagram {
  type = 'graph';
  parser;
  renderer;
  db;
  private detectTypeFailed = false;
  // eslint-disable-next-line @typescript-eslint/ban-types
  constructor(public txt: string, parseError?: Function) {
    const cnf = configApi.getConfig();
    this.txt = txt;
    try {
      this.type = detectType(txt, cnf);
    } catch (e) {
      this.handleError(e, parseError);
      this.type = 'error';
      this.detectTypeFailed = true;
    }
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

    this.parse(this.txt, parseError);
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  parse(text: string, parseError?: Function): boolean {
    if (this.detectTypeFailed) {
      return false;
    }
    try {
      text = text + '\n';
      this.db.clear();
      this.parser.parse(text);
      return true;
    } catch (error) {
      this.handleError(error, parseError);
    }
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  handleError(error: unknown, parseError?: Function) {
    // Is this the correct way to access mermiad's parseError()
    // method ? (or global.mermaid.parseError()) ?
    if (parseError) {
      if (isDetailedError(error)) {
        // handle case where error string and hash were
        // wrapped in object like`const error = { str, hash };`
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

  getParser() {
    return this.parser;
  }

  getType() {
    return this.type;
  }
}

export const getDiagramFromText = (
  txt: string,
  // eslint-disable-next-line @typescript-eslint/ban-types
  parseError?: Function
): Diagram | Promise<Diagram> => {
  const type = detectType(txt, configApi.getConfig());
  try {
    // Trying to find the diagram
    getDiagram(type);
    return new Diagram(txt, parseError);
  } catch (error) {
    if (!(error instanceof DiagramNotFoundError)) {
      log.error(error);
      throw error;
    }
    const loader = getDiagramLoader(type);
    if (!loader) {
      throw new Error(`Loader for ${type} not found.`);
    }
    // TODO: Uncomment for v10
    // // Diagram not available, loading it
    // const { diagram } = await loader();
    // registerDiagram(type, diagram, undefined, diagram.injectUtils);
    // // new diagram will try getDiagram again and if fails then it is a valid throw
    return loader().then(({ diagram }) => {
      registerDiagram(type, diagram, undefined);
      return new Diagram(txt, parseError);
    });
  }
};

export default Diagram;
