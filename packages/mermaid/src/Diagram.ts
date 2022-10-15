import * as configApi from './config';
import { log } from './logger';
import { getDiagram, registerDiagram } from './diagram-api/diagramAPI';
import { detectType, getDiagramLoader } from './diagram-api/detectType';
import { isDetailedError } from './utils';
export class Diagram {
  type = 'graph';
  parser;
  renderer;
  db;
  // eslint-disable-next-line @typescript-eslint/ban-types
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

    this.parse(this.txt, parseError);
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
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

// eslint-disable-next-line @typescript-eslint/ban-types
export const getDiagramFromText = async (txt: string, parseError?: Function) => {
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
    // const path = getPathForDiagram(type);
    const { diagram } = await loader(); // eslint-disable-line @typescript-eslint/no-explicit-any
    registerDiagram(
      type,
      {
        db: diagram.db,
        renderer: diagram.renderer,
        parser: diagram.parser,
        styles: diagram.styles,
      },
      diagram.injectUtils
    );
    // await loadDiagram('./packages/mermaid-mindmap/dist/mermaid-mindmap.js');
    // await loadDiagram(path + 'mermaid-' + type + '.js');
    // new diagram will try getDiagram again and if fails then it is a valid throw
  }
  // If either of the above worked, we have the diagram
  // logic and can continue
  return new Diagram(txt, parseError);
};
