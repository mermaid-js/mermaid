import * as configApi from './config.js';
import { getDiagram, registerDiagram } from './diagram-api/diagramAPI.js';
import { detectType, getDiagramLoader } from './diagram-api/detectType.js';
import { UnknownDiagramError } from './errors.js';
import { log } from './logger.js';
import { encodeEntities } from './utils.js';
import type { DetailedError } from './utils.js';
import type { DiagramCode, DiagramDefinition, DiagramMetadata } from './diagram-api/types.js';

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export type ParseErrorFunction = (err: string | DetailedError | unknown, hash?: any) => void;

/**
 * An object representing a parsed mermaid diagram definition.
 * @privateRemarks This is exported as part of the public mermaidAPI.
 */
export class Diagram {
  public static async fromText(
    codeObjectOrText: DiagramCode | string,
    metadata: Pick<DiagramMetadata, 'title'> = {}
  ) {
    // Accept either a raw string (legacy callers) or a DiagramCode object from
    // preprocessDiagram(). When given a string we normalise to a minimal code
    // object so downstream selection logic stays consistent.
    const code: DiagramCode =
      typeof codeObjectOrText === 'string'
        ? { raw: codeObjectOrText, cleaned: codeObjectOrText }
        : codeObjectOrText;
    const config = configApi.getConfig();
    const type = detectType(code.cleaned, config);
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
    // Diagrams that opt into inline-position capture signal by exposing a
    // `setSourceText` method on their DB. For those we prefer the text with
    // comments preserved so that Jison `@$` positions remain meaningful in
    // original-source space. Everything else keeps today's behaviour.
    const dbAny = db as Record<string, unknown>;
    const supportsInlinePositions = typeof dbAny.setSourceText === 'function';
    let textToParse: string;
    if (parser.features?.processRawText) {
      textToParse = encodeEntities(code.raw) + '\n';
    } else if (supportsInlinePositions && code.withComments) {
      textToParse = encodeEntities(code.withComments) + '\n';
    } else {
      textToParse = encodeEntities(code.cleaned) + '\n';
    }
    // Pass frontmatter line offset so AST positions can be adjusted to match
    // the original source (which includes frontmatter) shown in the editor.
    if (
      supportsInlinePositions &&
      code.frontmatterLineOffset &&
      typeof dbAny.setFrontmatterLineOffset === 'function'
    ) {
      (dbAny.setFrontmatterLineOffset as (offset: number) => void)(code.frontmatterLineOffset);
    }
    await parser.parse(textToParse);
    return new Diagram(type, textToParse, db, parser, renderer);
  }

  private constructor(
    public type: string,
    public text: string,
    public db: DiagramDefinition['db'],
    public parser: DiagramDefinition['parser'],
    public renderer: DiagramDefinition['renderer']
  ) {}

  async render(id: string, version: string) {
    const config = configApi.getConfig();
    if (config.securityLevel === 'parseOnly') {
      log.warn('Cannot render diagram in parseOnly mode');
      return;
    }
    await this.renderer.draw(this.text, id, version, this);
  }

  getParser() {
    return this.parser;
  }

  getType() {
    return this.type;
  }
}
