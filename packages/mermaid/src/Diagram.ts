import * as configApi from './config';
import { log } from './logger';
import { getDiagram, registerDiagram } from './diagram-api/diagramAPI';
import { detectType, getDiagramLoader } from './diagram-api/detectType';
import { isDetailedError } from './utils';

export type ParseErrorFunction = (str: string, hash?: any) => void;

export class Diagram {
  type = 'graph';
  parser;
  renderer;
  db;
  private detectTypeFailed = false;
  constructor(public txt: string, parseError?: ParseErrorFunction) {
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

  parse(text: string, parseError?: ParseErrorFunction): boolean {
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

  handleError(error: unknown, parseError?: ParseErrorFunction) {
    // Is this the correct way to access mermiad's parseError()
    // method ? (or global.mermaid.parseError()) ?

    if (parseError === undefined) {
      // No mermaid.parseError() handler defined, so re-throw it
      throw error;
    }

    if (isDetailedError(error)) {
      // Handle case where error string and hash were
      // wrapped in object like`const error = { str, hash };`
      parseError(error.str, error.hash);
      return;
    }

    // Otherwise, assume it is just an error string and pass it on
    parseError(error as string);
  }

  getParser() {
    return this.parser;
  }

  getType() {
    return this.type;
  }
}

export const getDiagramFromText = async (
  txt: string,
  parseError?: ParseErrorFunction
): Promise<Diagram> => {
  const type = detectType(txt, configApi.getConfig());
  try {
    // Trying to find the diagram
    getDiagram(type);
  } catch (error) {
    const loader = getDiagramLoader(type);
    if (!loader) {
      throw new Error(`Diagram ${type} not found.`);
    }
    // Diagram not available, loading it
    const { diagram } = await loader();
    registerDiagram(type, diagram, undefined, diagram.injectUtils);
    // new diagram will try getDiagram again and if fails then it is a valid throw
  }
  // If either of the above worked, we have the diagram
  // logic and can continue
  return new Diagram(txt, parseError);
};

export default Diagram;
