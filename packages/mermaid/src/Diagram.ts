import * as configApi from './config.js';
import { getDiagram, registerDiagram } from './diagram-api/diagramAPI.js';
import { detectType, getDiagramLoader } from './diagram-api/detectType.js';
import { UnknownDiagramError } from './errors.js';
import { encodeEntities } from './utils.js';
import type { DetailedError } from './utils.js';
import type { DiagramDefinition, DiagramMetadata } from './diagram-api/types.js';

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export type ParseErrorFunction = (err: string | DetailedError | unknown, hash?: any) => void;

/**
 * An object representing a parsed mermaid diagram definition.
 * @privateRemarks This is exported as part of the public mermaidAPI.
 */
export class Diagram {
  public static async fromText(text: string, metadata: Pick<DiagramMetadata, 'title'> = {}) {
    const config = configApi.getConfig();
    const type = detectType(text, config);
    text = encodeEntities(text) + '\n';
    try {
      getDiagram(type);
    } catch {
      const loader = getDiagramLoader(type);
      if (!loader) {
        throw new UnknownDiagramError(`Diagram ${type} not found.`);
      }
      // Diagram not available, loading it.
      // new diagram will try getDiagram again and if fails then it is a valid throw
      const { id, diagram } = await loader();
      registerDiagram(id, diagram);
    }
    const { db, parser, renderer, init } = getDiagram(type);
    if (parser.parser) {
      // The parser.parser.yy is only present in JISON parsers. So, we'll only set if required.
      parser.parser.yy = db;
    }
    db.clear?.();
    init?.(config);
    // This block was added for legacy compatibility. Use frontmatter instead of adding more special cases.
    if (metadata.title) {
      db.setDiagramTitle?.(metadata.title);
    }
    await parser.parse(text);
    return new Diagram(type, text, db, parser, renderer);
  }

  private constructor(
    public type: string,
    public text: string,
    public db: DiagramDefinition['db'],
    public parser: DiagramDefinition['parser'],
    public renderer: DiagramDefinition['renderer']
  ) {}

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
