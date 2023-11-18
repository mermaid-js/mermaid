import * as configApi from './config.js';
import { log } from './logger.js';
import { getDiagram, registerDiagram } from './diagram-api/diagramAPI.js';
import { detectType, getDiagramLoaderAndPriority } from './diagram-api/detectType.js';
import { UnknownDiagramError } from './errors.js';
import { encodeEntities } from './utils.js';

import type { DetailedError } from './utils.js';
import type { DiagramDefinition, DiagramMetadata } from './diagram-api/types.js';

export type ParseErrorFunction = (err: string | DetailedError | unknown, hash?: any) => void;

/**
 * An object representing a parsed mermaid diagram definition.
 * @privateRemarks This is exported as part of the public mermaidAPI.
 */
export class Diagram {
  type = 'graph';
  parser: DiagramDefinition['parser'];
  renderer: DiagramDefinition['renderer'];
  db: DiagramDefinition['db'];
  private init?: DiagramDefinition['init'];

  private detectError?: UnknownDiagramError;
  constructor(public text: string, public metadata: Pick<DiagramMetadata, 'title'> = {}) {
    this.text = encodeEntities(text);
    this.text += '\n';
    const cnf = configApi.getConfig();
    try {
      this.type = detectType(text, cnf);
    } catch (e) {
      this.type = 'error';
      this.detectError = e as UnknownDiagramError;
    }
    const diagram = getDiagram(this.type);
    log.debug('Type ' + this.type);
    // Setup diagram
    this.db = diagram.db;
    this.renderer = diagram.renderer;
    this.parser = diagram.parser;
    if (this.parser.parser) {
      // The parser.parser.yy is only present in JISON parsers. So, we'll only set if required.
      this.parser.parser.yy = this.db;
    }
    this.init = diagram.init;
    this.parse();
  }

  parse() {
    if (this.detectError) {
      throw this.detectError;
    }
    this.db.clear?.();
    const config = configApi.getConfig();
    this.init?.(config);
    // This block was added for legacy compatibility. Use frontmatter instead of adding more special cases.
    if (this.metadata.title) {
      this.db.setDiagramTitle?.(this.metadata.title);
    }
    this.parser.parse(this.text);
  }

  async render(id: string, version: string) {
    await this.renderer.draw(this.text, id, version, this);
  }

  getParser() {
    return this.parser;
  }

  getType() {
    return this.type;
  }
}

/**
 * Parse the text asynchronously and generate a Diagram object asynchronously.
 * **Warning:** This function may be changed in the future.
 * @alpha
 * @param text - The mermaid diagram definition.
 * @param metadata - Diagram metadata, defined in YAML.
 * @returns A the Promise of a Diagram object.
 * @throws {@link UnknownDiagramError} if the diagram type can not be found.
 * @privateRemarks This is exported as part of the public mermaidAPI.
 */
export const getDiagramFromText = async (
  text: string,
  metadata: Pick<DiagramMetadata, 'title'> = {}
): Promise<Diagram> => {
  const type = detectType(text, configApi.getConfig());
  try {
    // Trying to find the diagram
    getDiagram(type);
  } catch (error) {
    const { loader, priority } = getDiagramLoaderAndPriority(type);
    if (!loader) {
      throw new UnknownDiagramError(`Diagram ${type} not found.`);
    }
    // Diagram not available, loading it.
    // new diagram will try getDiagram again and if fails then it is a valid throw
    const { id, diagram } = await loader();
    registerDiagram(id, diagram, priority);
  }
  return new Diagram(text, metadata);
};
